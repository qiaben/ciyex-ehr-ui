"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getEnv } from "@/utils/env";
import DynamicFormRenderer, { FieldConfig } from "./DynamicFormRenderer";
import { useAutoSave, AutoSaveStatus } from "@/hooks/useAutoSave";
import { Loader2, ArrowLeft, Printer, CheckCircle, XCircle, ChevronDown, ChevronRight, Copy } from "lucide-react";
import PluginSlot from "@/components/plugins/PluginSlot";
import CloneEncounterModal from "@/components/encounter/CloneEncounterModal";
import { PluginContextProvider } from "@/context/PluginContextProvider";
import { usePluginEventBus } from "@/context/PluginEventBus";
import { toast } from "@/utils/toast";
import { formatDisplayDate } from "@/utils/dateUtils";

const API_BASE = () => (getEnv("NEXT_PUBLIC_API_URL") || "").replace(/\/$/, "");

/** Flatten nested objects into dot-notation keys so formData["ros.constitutional"] works */
function flattenObject(obj: Record<string, any>, prefix = "", result: Record<string, any> = {}): Record<string, any> {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      // Keep the nested object too (some renderers need it)
      result[fullKey] = value;
      flattenObject(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

type EncounterStatus = "SIGNED" | "UNSIGNED" | "INCOMPLETE";

interface DynamicEncounterFormProps {
  patientId: number;
  encounterId: number;
  /** When true, renders without negative margins and hides Back link (for slide-over panel) */
  embedded?: boolean;
  /** Auto-scroll to a section on load, e.g. "vitals" */
  initialSection?: string;
}

export default function DynamicEncounterForm({ patientId, encounterId, embedded, initialSection }: DynamicEncounterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pluginEvents = usePluginEventBus();
  const backUrl = searchParams?.get("from") === "encounters" ? "/all-encounters" : `/patients/${patientId}`;

  // Encounter metadata
  const [encounter, setEncounter] = useState<Record<string, any> | null>(null);
  const [patient, setPatient] = useState<{ firstName?: string; lastName?: string; dateOfBirth?: string } | null>(null);
  const [status, setStatus] = useState<EncounterStatus>("UNSIGNED");
  const [statusLoading, setStatusLoading] = useState(false);

  // Field config
  const [fieldConfig, setFieldConfig] = useState<FieldConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Composition resource ID (FHIR)
  const [compositionId, setCompositionId] = useState<string | null>(null);

  // Section navigation
  const [activeSection, setActiveSection] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Clone encounter
  const [showCloneModal, setShowCloneModal] = useState(false);

  // Auto-save features from config
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [debounceMs, setDebounceMs] = useState(2000);

  // Auto-save hook
  const autoSave = useAutoSave({
    debounceMs,
    enabled: autoSaveEnabled && status !== "SIGNED",
    onSave: useCallback(async (data: Record<string, any>) => {
      const base = API_BASE();
      if (compositionId) {
        await fetchWithAuth(
          `${base}/api/fhir-resource/encounter-form/patient/${patientId}/${compositionId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
      } else {
        const res = await fetchWithAuth(
          `${base}/api/fhir-resource/encounter-form/patient/${patientId}?encounterRef=${encounterId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (res.ok) {
          const json = await res.json();
          const created = json.data || json;
          const newId = created.id || created.fhirId;
          if (newId) {
            setCompositionId(newId);
            // Persist so page refresh can reload correct composition
            try { localStorage.setItem(`enc-comp-${patientId}-${encounterId}`, String(newId)); } catch { /* ignore */ }
          }
        }
      }
    }, [patientId, encounterId, compositionId]),
  });

  // Fetch encounter metadata + patient info
  useEffect(() => {
    if (!patientId || !encounterId) return;
    const base = API_BASE();

    const resolveStatus = (data: Record<string, any>): EncounterStatus | null => {
      // Check multiple possible locations for status
      const raw = data.status || data.meta?.status || data.signoff?.status || data.encounterStatus || null;
      if (raw && ['SIGNED', 'UNSIGNED', 'INCOMPLETE'].includes(String(raw).toUpperCase())) {
        return String(raw).toUpperCase() as EncounterStatus;
      }
      // FHIR Encounter status "finished" with a signoff → SIGNED
      if (data.signoff?.signedAt || data.providerSignature?.signedAt) return 'SIGNED';
      // Map standard FHIR encounter statuses
      if (raw) {
        const lower = String(raw).toLowerCase();
        if (lower === 'finished' || lower === 'completed') return 'SIGNED';
      }
      return null;
    };

    (async () => {
      try {
        // Try summary endpoint first
        let encData: Record<string, any> | null = null;
        const summaryRes = await fetchWithAuth(`${base}/api/encounters/${patientId}/${encounterId}/summary`);
        if (summaryRes.ok) {
          const json = await summaryRes.json();
          encData = json.data || json;
        }
        // Fallback to direct encounter endpoint
        if (!encData) {
          const encRes = await fetchWithAuth(`${base}/api/encounters/${patientId}/${encounterId}`);
          if (encRes.ok) {
            const json = await encRes.json();
            encData = json.data || json;
          }
        }
        if (encData) {
          setEncounter(encData);
          const resolvedStatus = resolveStatus(encData);
          if (resolvedStatus) setStatus(resolvedStatus);
        }

        // Check localStorage for cached sign status (set by sign/unsign actions)
        try {
          const cachedStatus = localStorage.getItem(`enc-status-${patientId}-${encounterId}`);
          if (cachedStatus && ['SIGNED', 'UNSIGNED', 'INCOMPLETE'].includes(cachedStatus)) {
            setStatus(cachedStatus as EncounterStatus);
          }
        } catch { /* ignore */ }

        // Also try the dedicated sign-status endpoint for an authoritative status
        try {
          const signRes = await fetchWithAuth(`${base}/api/${patientId}/encounters/${encounterId}/status`);
          if (signRes.ok) {
            const signJson = await signRes.json();
            const signData = signJson.data || signJson;
            const signStatus = signData?.status || signData?.encounterStatus;
            if (signStatus && ['SIGNED', 'UNSIGNED', 'INCOMPLETE'].includes(String(signStatus).toUpperCase())) {
              setStatus(String(signStatus).toUpperCase() as EncounterStatus);
            }
          }
        } catch { /* sign-status endpoint may not exist — that's OK */ }
      } catch { /* ignore */ }
    })();

    fetchWithAuth(`${base}/api/patients/${patientId}`)
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          setPatient({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            dateOfBirth: data.dateOfBirth,
          });
        }
      })
      .catch(() => {});
  }, [patientId, encounterId]);

  // Fetch encounter form config + existing composition data
  useEffect(() => {
    if (!patientId || !encounterId) return;
    const base = API_BASE();

    const loadData = async () => {
      setLoading(true);
      try {
        const configRes = await fetchWithAuth(`${base}/api/tab-field-config/encounter-form`);
        if (configRes.ok) {
          const configJson = await configRes.json();
          const config = configJson.data || configJson;
          const fc: FieldConfig = typeof config.fieldConfig === "string"
            ? JSON.parse(config.fieldConfig)
            : config.fieldConfig;
          setFieldConfig(fc);

          const features = (fc as any)?.features?.encounterForm;
          if (features?.autoSave) {
            setAutoSaveEnabled(features.autoSave.enabled !== false);
            if (features.autoSave.debounceMs) setDebounceMs(features.autoSave.debounceMs);
          }
        }

        // Try multiple API patterns to find existing composition data
        let existing: Record<string, any> | null = null;

        const tryExtract = (json: any): Record<string, any> | null => {
          const pd = json.data || json;
          if (Array.isArray(pd) && pd.length > 0) return pd[0];
          if (Array.isArray(pd.content) && pd.content.length > 0) return pd.content[0];
          if (pd && typeof pd === "object" && (pd.id || pd.fhirId)) return pd;
          return null;
        };

        // Attempt 0: check localStorage for a previously stored compositionId
        try {
          const storedId = localStorage.getItem(`enc-comp-${patientId}-${encounterId}`);
          if (storedId) {
            const storedRes = await fetchWithAuth(
              `${base}/api/fhir-resource/encounter-form/patient/${patientId}/${storedId}`
            );
            if (storedRes.ok) {
              const storedJson = await storedRes.json();
              const storedData = storedJson.data || storedJson;
              if (storedData && typeof storedData === "object" && (storedData.id || storedData.fhirId)) {
                existing = storedData;
              }
            }
          }
        } catch { /* ignore localStorage errors */ }

        // Attempt 1: by encounterRef query param
        if (!existing) {
          const dataRes = await fetchWithAuth(
            `${base}/api/fhir-resource/encounter-form/patient/${patientId}?encounterRef=${encounterId}`
          );
          if (dataRes.ok) {
            const dataJson = await dataRes.json();
            existing = tryExtract(dataJson);
            // Only accept if the composition actually matches this encounter
            if (existing && String(existing.encounterRef) !== String(encounterId) &&
                String(existing.encounterId) !== String(encounterId) &&
                String(existing.encounter) !== String(encounterId)) {
              existing = null;
            }
          }
        }

        // Attempt 2: try encounter-specific endpoint if first returned nothing
        if (!existing) {
          try {
            const altRes = await fetchWithAuth(
              `${base}/api/fhir-resource/encounter-form/patient/${patientId}?encounterId=${encounterId}`
            );
            if (altRes.ok) {
              existing = tryExtract(await altRes.json());
            }
          } catch { /* silent fallback */ }
        }

        // Attempt 3: try listing all compositions for the patient and filter by encounterRef
        if (!existing) {
          try {
            const listRes = await fetchWithAuth(
              `${base}/api/fhir-resource/encounter-form/patient/${patientId}?page=0&size=100`
            );
            if (listRes.ok) {
              const listJson = await listRes.json();
              const items = listJson.data?.content || listJson.data || listJson.content || (Array.isArray(listJson) ? listJson : []);
              if (Array.isArray(items)) {
                existing = items.find((c: any) =>
                  String(c.encounterRef) === String(encounterId) ||
                  String(c.encounterId) === String(encounterId) ||
                  String(c.encounter) === String(encounterId)
                ) || null;
              }
            }
          } catch { /* silent fallback */ }
        }

        if (existing) {
          const foundId = existing.id || existing.fhirId || null;
          setCompositionId(foundId);
          // Persist so future page refreshes find it quickly
          if (foundId) {
            try { localStorage.setItem(`enc-comp-${patientId}-${encounterId}`, String(foundId)); } catch { /* ignore */ }
          }
          // Extract form field data: the server may nest form fields under formData/fields/data
          // Try to find a nested object with more keys than the top-level composition metadata
          const metaKeys = new Set(["id", "fhirId", "encounterRef", "encounterId", "encounter", "status", "patientId", "createdAt", "updatedAt", "createdDate", "lastModifiedDate", "audit"]);
          const nonMetaKeys = Object.keys(existing).filter(k => !metaKeys.has(k));
          let formPayload: Record<string, any> = existing;
          // If server wraps form data in a nested property, extract it
          for (const key of ["formData", "fields", "data", "content"]) {
            if (existing[key] && typeof existing[key] === "object" && !Array.isArray(existing[key])) {
              const nested = existing[key] as Record<string, any>;
              if (Object.keys(nested).length > nonMetaKeys.length) {
                formPayload = { ...existing, ...nested };
                break;
              }
            }
          }
          // Flatten nested objects so dot-notation field keys (e.g. "ros.constitutional") resolve correctly
          const flattened = flattenObject(formPayload);
          // Preserve top-level keys as well (merge so both nested and flat access works)
          autoSave.setFormData({ ...formPayload, ...flattened });
        }
      } catch (err) {
        console.error("Error loading encounter form:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId, encounterId]);

  // Intersection observer for section navigation (scoped to scroll container)
  useEffect(() => {
    if (!fieldConfig?.sections?.length) return;
    const root = contentRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root, rootMargin: "-20px 0px -40% 0px", threshold: [0, 0.25] }
    );

    fieldConfig.sections.forEach((s) => {
      const el = document.getElementById(`section-${s.key}`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [fieldConfig]);

  // Auto-scroll to initialSection after form loads
  useEffect(() => {
    if (!initialSection || loading || !fieldConfig) return;
    // Small delay so DOM elements are rendered
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${initialSection}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timer);
  }, [initialSection, loading, fieldConfig]);

  // Sign / Unsign
  const postStatus = useCallback(
    async (action: "sign" | "unsign", next: EncounterStatus) => {
      setStatusLoading(true);
      try {
        if (autoSave.isDirty) await autoSave.saveNow();

        // Run encounter:close-hook — plugins can return { block: true, reason: "..." } to prevent signing
        if (action === "sign") {
          const hookResults = await pluginEvents.emitAsync("encounter:close-hook", {
            patientId, encounterId, formData: autoSave.formData,
          });
          const blocker = hookResults.find((r: any) => r?.block);
          if (blocker) {
            toast.warning(blocker.reason || "A plugin has blocked signing this encounter.");
            setStatusLoading(false);
            return;
          }
        }

        const res = await fetchWithAuth(
          `${API_BASE()}/api/${patientId}/encounters/${encounterId}/${action}`,
          { method: "POST" }
        );
        if (res.ok) {
          setStatus(next);
          // Persist status so page refresh picks it up immediately
          try { localStorage.setItem(`enc-status-${patientId}-${encounterId}`, next); } catch { /* ignore */ }
          pluginEvents.emit("encounter:saved", { encounterId, status: next });
        } else {
          const json = await res.json().catch(() => null);
          toast.error(json?.message || `Failed to ${action} encounter`);
        }
      } catch {
        toast.error(`Failed to ${action} encounter`);
      } finally {
        setStatusLoading(false);
      }
    },
    [patientId, encounterId, autoSave, pluginEvents]
  );

  // Client-side print — generates a professional, readable medical visit note
  const downloadPdf = useCallback(() => {
    if (!contentRef.current) return;

    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : '';
    const dob = patient?.dateOfBirth || '';
    const dos = encounter?.dateOfService || encounter?.encounterDate || encounter?.startDate || encounter?.meta?.dateOfService || '';
    const providerDisplay = encounter?.encounterProvider || encounter?.meta?.provider || encounter?.assignedProviders?.[0]?.providerName || '';
    const visitType = encounter?.visitCategory || encounter?.meta?.visitCategory || encounter?.meta?.type || '';
    const reason = encounter?.reasonForVisit || encounter?.meta?.reasonForVisit || '';
    const encStatus = status || 'UNSIGNED';
    const nowStr = new Date().toLocaleString();

    // Build sections from the form data (autoSave.formData) for a clean, structured print
    const sectionsArr: { title: string; html: string }[] = [];
    const fd = autoSave.formData || {};

    // Helper: format a value for display
    const fmtVal = (v: unknown): string => {
      if (v == null || v === '' || v === 'null' || v === 'undefined') return '';
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      if (Array.isArray(v)) {
        const items = v.map(fmtVal).filter(Boolean);
        return items.length > 0 ? items.join(', ') : '';
      }
      if (typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (o.coding && Array.isArray(o.coding)) return (o.coding[0] as any)?.display || (o.coding[0] as any)?.code || o.text as string || '';
        if (o.text) return String(o.text);
        if (o.display) return String(o.display);
        // Skip raw objects
        return '';
      }
      return String(v);
    };

    if (fieldConfig?.sections) {
      for (const section of fieldConfig.sections) {
        if (section.visible === false) continue;
        const rows: string[] = [];

        if (section.fields) {
          for (const field of section.fields) {
            if (!field || field.type === 'hidden') continue;
            const val = fd[field.key];
            const display = fmtVal(val);
            if (!display) continue; // Skip empty fields

            // For checkbox groups (ROS), deduplicate and present cleanly
            if (field.type === 'checkbox-group' || field.type === 'checkboxGroup') {
              const items = Array.isArray(val) ? [...new Set(val.map(String))] : [display];
              rows.push(`<tr><td class="lbl">${esc(field.label)}</td><td>${items.map(i => esc(i)).join(', ')}</td></tr>`);
            } else if (field.type === 'textarea') {
              rows.push(`<tr><td class="lbl">${esc(field.label)}</td><td style="white-space:pre-wrap">${esc(display)}</td></tr>`);
            } else {
              rows.push(`<tr><td class="lbl">${esc(field.label)}</td><td>${esc(display)}</td></tr>`);
            }
          }
        }

        // Also check for nested object data (e.g., ros.constitutional)
        const sectionKey = section.key;
        const nested = fd[sectionKey];
        if (nested && typeof nested === 'object' && !Array.isArray(nested) && rows.length === 0) {
          for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
            const display = fmtVal(v);
            if (!display) continue;
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            rows.push(`<tr><td class="lbl">${esc(label)}</td><td>${esc(display)}</td></tr>`);
          }
        }

        if (rows.length > 0) {
          sectionsArr.push({
            title: section.title,
            html: `<table class="sec-tbl">${rows.join('')}</table>`,
          });
        }
      }
    }

    // Fallback: if no data from formData, extract from DOM (for sections that use custom rendering)
    if (sectionsArr.length === 0 && contentRef.current) {
      const sectionEls = contentRef.current.querySelectorAll('[id^="section-"]');
      sectionEls.forEach((secEl) => {
        const heading = secEl.querySelector('h2, h3, [class*="font-semibold"], [class*="font-bold"]');
        const sectionTitle = heading?.textContent?.trim() || '';
        if (!sectionTitle) return;
        const rows: string[] = [];
        const seen = new Set<string>();
        // Inputs with values
        secEl.querySelectorAll('input, textarea, select').forEach((inp) => {
          const el = inp as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (el.type === 'checkbox' || el.type === 'hidden') return;
          const val = el.value?.trim();
          if (!val) return;
          const label = el.closest('div')?.querySelector('label')?.textContent?.trim() || '';
          const key = `${label}|${val}`;
          if (seen.has(key)) return;
          seen.add(key);
          rows.push(label ? `<tr><td class="lbl">${esc(label)}</td><td>${esc(val)}</td></tr>` : `<tr><td colspan="2">${esc(val)}</td></tr>`);
        });
        // Checked checkboxes — deduplicated
        const checkLabels: string[] = [];
        secEl.querySelectorAll('input[type="checkbox"]:checked').forEach((ch) => {
          const lbl = ch.closest('label')?.textContent?.trim() || (ch as HTMLInputElement).name;
          if (lbl && !checkLabels.includes(lbl)) checkLabels.push(lbl);
        });
        if (checkLabels.length > 0) {
          rows.push(`<tr><td colspan="2">${checkLabels.map(l => esc(l)).join(', ')}</td></tr>`);
        }
        if (rows.length > 0) {
          sectionsArr.push({ title: sectionTitle, html: `<table class="sec-tbl">${rows.join('')}</table>` });
        }
      });
    }

    const sectionsHtml = sectionsArr.map(s =>
      `<div class="section"><h3>${esc(s.title)}</h3>${s.html}</div>`
    ).join('');

    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup blocked — please allow popups and try again."); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Visit Note — ${esc(patientName)} — Encounter #${encounterId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #222; padding: 24px 32px; line-height: 1.6; }
  @media print { body { padding: 0.4in; } @page { size: letter; margin: 0.5in; } }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 16px; }
  .header-left { font-size: 11px; }
  .header-right { text-align: right; font-size: 11px; }
  .header-right td { padding: 2px 0; }
  .patient-bar { background: #f0f4f8; border: 1px solid #d0d8e0; border-radius: 6px; padding: 10px 16px; margin-bottom: 20px; font-size: 12px; display: flex; gap: 28px; flex-wrap: wrap; align-items: center; }
  .patient-bar b { color: #1e3a5f; }
  .status-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-signed { background: #d1fae5; color: #065f46; }
  .status-unsigned { background: #fee2e2; color: #991b1b; }
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section h3 { font-size: 13px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .sec-tbl { width: 100%; font-size: 12px; border-collapse: collapse; }
  .sec-tbl td { padding: 3px 12px 3px 0; vertical-align: top; border-bottom: 1px solid #eee; }
  .sec-tbl .lbl { font-weight: 600; color: #444; white-space: nowrap; width: 180px; }
  .footer { margin-top: 28px; border-top: 2px solid #ccc; padding-top: 8px; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
  button { display: none !important; }
  .print-btn { display: block !important; margin: 20px auto; padding: 10px 32px; background: #1e3a5f; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
  .print-btn:hover { background: #2a4d7a; }
  @media print { .print-btn { display: none !important; } }
</style></head><body>
  <div class="header">
    <div class="header-left">
      <div style="font-size:10px;color:#666">${nowStr}</div>
      <div style="font-size:20px;font-weight:bold;color:#1e3a5f;margin:4px 0">Encounter Visit Note</div>
    </div>
    <div class="header-right">
      <table>
        <tr><td style="font-weight:600;padding-right:12px">Patient:</td><td>${esc(patientName) || '—'}</td></tr>
        <tr><td style="font-weight:600;padding-right:12px">Provider:</td><td>${esc(String(providerDisplay)) || '—'}</td></tr>
        <tr><td style="font-weight:600;padding-right:12px">Visit Date:</td><td>${dos ? formatDisplayDate(dos) : '—'}</td></tr>
        ${reason ? `<tr><td style="font-weight:600;padding-right:12px">Reason:</td><td>${esc(String(reason))}</td></tr>` : ''}
      </table>
    </div>
  </div>
  <div class="patient-bar">
    <span><b>Patient:</b> ${esc(patientName) || '—'}</span>
    <span><b>DOB:</b> ${dob ? formatDisplayDate(dob) : '—'}</span>
    <span><b>Visit Type:</b> ${esc(String(visitType)) || '—'}</span>
    <span><b>Encounter #:</b> ${encounterId}</span>
    <span class="status-badge ${encStatus === 'SIGNED' ? 'status-signed' : 'status-unsigned'}">${encStatus}</span>
  </div>
  ${sectionsHtml || '<p style="color:#888;text-align:center;padding:24px">No encounter data recorded yet.</p>'}
  <div class="footer">
    <span>Encounter #${encounterId} — ${esc(patientName)}</span>
    <span>Printed: ${nowStr}</span>
  </div>
  <button class="print-btn" onclick="window.print()">Print Visit Note</button>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }, [encounterId, contentRef, patient, encounter, status, autoSave.formData, fieldConfig]);

  const fmt = (d?: string) => formatDisplayDate(d);

  const statusIcon = (s: AutoSaveStatus) => {
    switch (s) {
      case "saving": return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />;
      case "saved": return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case "error": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return null;
    }
  };

  const statusText = (s: AutoSaveStatus, lastSaved: Date | null) => {
    switch (s) {
      case "saving": return "Saving...";
      case "saved": return lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Saved";
      case "error": return "Save failed";
      default: return lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!fieldConfig) {
    return (
      <div className="p-6 text-center text-red-600">
        No encounter form configuration found.
        <div className="mt-3">
          <Link href={`/patients/${patientId}`} className="text-blue-600 hover:underline text-sm">
            Back to Patient
          </Link>
        </div>
      </div>
    );
  }

  const isReadOnly = status === "SIGNED";
  const sections = (fieldConfig.sections || []).filter((s) => s.visible !== false);

  const handleNavClick = (e: React.MouseEvent, sectionKey: string) => {
    e.preventDefault();
    const el = document.getElementById(`section-${sectionKey}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
    <PluginContextProvider
      patient={{ id: String(patientId), name: patient ? `${patient.firstName} ${patient.lastName}` : undefined, birthDate: patient?.dateOfBirth }}
      encounter={{ id: String(encounterId), status }}
    >
    <div className={embedded ? "flex flex-col h-full" : "-m-4 md:-m-6 flex flex-col h-[calc(100vh-64px)]"}>
      {/* Top Bar */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2 flex items-center justify-between">
          {/* Left: Back + Encounter info */}
          <div className="flex items-center gap-3">
            {!embedded && (
              <Link
                href={backUrl}
                className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Link>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Encounter <span className="font-semibold">#{encounterId}</span>
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xs border font-medium ${
                status === "SIGNED"
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  : status === "INCOMPLETE"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
              }`}
            >
              {status}
            </span>
            {patient && (
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {patient.firstName} {patient.lastName}
                {patient.dateOfBirth ? ` | DOB: ${fmt(patient.dateOfBirth)}` : ""}
              </span>
            )}
          </div>

          {/* Right: Auto-save status + actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {statusIcon(autoSave.status)}
              <span>{statusText(autoSave.status, autoSave.lastSaved)}</span>
            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

            <button
              className="px-3 py-1.5 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={statusLoading || status === "SIGNED"}
              onClick={() => postStatus("sign", "SIGNED")}
            >
              {statusLoading && status !== "SIGNED" ? "..." : "Sign"}
            </button>

            <button
              className="px-3 py-1.5 rounded text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              disabled={statusLoading || status === "UNSIGNED"}
              onClick={() => postStatus("unsign", "UNSIGNED")}
            >
              Unsign
            </button>

            {!compositionId && status !== "SIGNED" && (
              <button
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center gap-1.5"
                onClick={() => setShowCloneModal(true)}
                title="Clone from Previous Encounter"
              >
                <Copy className="w-4 h-4" /> Clone
              </button>
            )}

            <button
              className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              onClick={downloadPdf}
              title="Download PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <PluginSlot name="encounter:toolbar" context={{ patientId, encounterId, status }} as="fragment" />
          </div>
        </div>
      </div>

      {/* Body: Side Menu + Form Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Side Menu */}
        <nav className="w-56 shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <ul className="py-2">
            {sections.map((s) => {
              const isActive = activeSection === `section-${s.key}`;
              return (
                <li key={s.key}>
                  <a
                    href={`#section-${s.key}`}
                    onClick={(e) => handleNavClick(e, s.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-l-2 ${
                      isActive
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {isActive
                      ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                    }
                    <span className="truncate">{s.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          <PluginSlot name="encounter:sidebar" context={{ patientId, encounterId }} className="px-3 py-2 border-t border-gray-200 dark:border-gray-700" />
        </nav>

        {/* Right: Form Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="max-w-screen-lg mx-auto px-6 py-6 space-y-6">
            {sections.map((section) => (
              <section
                key={section.key}
                id={`section-${section.key}`}
              >
                <DynamicFormRenderer
                  fieldConfig={{ sections: [section], features: fieldConfig.features }}
                  formData={autoSave.formData}
                  onChange={autoSave.onChange}
                  readOnly={isReadOnly}
                />
              </section>
            ))}
            {/* Plugin note sections (e.g., AI Summary, Voice Transcription) */}
            <PluginSlot name="encounter:note-section" context={{ patientId, encounterId, status, formData: autoSave.formData }} className="space-y-4" />
            {/* Plugin assessment cards (e.g., clinical decision support) */}
            <PluginSlot name="encounter:assessment-card" context={{ patientId, encounterId, status }} className="space-y-4" />
            {/* Plugin order panels (e.g., Lab Panel Finder) */}
            <PluginSlot name="encounter:order-panel" context={{ patientId, encounterId, status }} className="space-y-4" />
            {/* Plugin form footer (e.g., coding suggestions, compliance checks) */}
            <PluginSlot name="encounter:form-footer" context={{ patientId, encounterId, status }} className="space-y-4" />
            {/* Bottom spacer for scrolling last section to top */}
            <div className="h-[50vh]" />
          </div>
        </div>
      </div>
    </div>
    </PluginContextProvider>

    <CloneEncounterModal
      patientId={patientId}
      currentEncounterId={encounterId}
      tabKey="encounter-form"
      open={showCloneModal}
      onClose={() => setShowCloneModal(false)}
      onCloned={(data) => {
        autoSave.setFormData(data);
        setShowCloneModal(false);
        // Trigger save immediately since setFormData doesn't schedule auto-save
        setTimeout(() => autoSave.saveNow(), 100);
      }}
    />
    </>
  );
}
