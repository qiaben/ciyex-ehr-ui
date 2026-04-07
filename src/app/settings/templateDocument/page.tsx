"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import AdminLayout from "@/app/(admin)/layout";
import {
  FileCode2, Eye, X as XIcon, Copy, Download, Save,
  Undo2, Redo2, Trash2, Search, Plus, ChevronDown, Upload
} from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

/* =========================================================
   Server API helpers (all via fetchWithAuth)
   ========================================================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API = `${API_BASE}/api/template-documents`;

// map UI context <-> backend enum
const toServerContext = (c: "encounter" | "portal") =>
  (c === "encounter" ? "ENCOUNTER" : "PORTAL") as "ENCOUNTER" | "PORTAL";
const fromServerContext = (c: "ENCOUNTER" | "PORTAL") =>
  (c === "ENCOUNTER" ? "encounter" : "portal") as "encounter" | "portal";

type UpsertBody = {
  name: string;
  context: "ENCOUNTER" | "PORTAL";
  content: string;
  options: {
    theme: TemplateTheme;
    container: TemplateContainer;
    card: boolean;
    applyWrapperToFullHTML: boolean;
  };
};

type ServerTemplate = {
  id: number;
  name: string;
  context: "ENCOUNTER" | "PORTAL";
  content: string;
  options: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

async function apiCreateTemplate(body: UpsertBody): Promise<ServerTemplate> {
  const res = await fetchWithAuth(`${API}`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiUpdateTemplate(id: number, body: UpsertBody): Promise<ServerTemplate> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiGetTemplate(id: number): Promise<ServerTemplate> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiListTemplates(context?: "ENCOUNTER" | "PORTAL"): Promise<ServerTemplate[]> {
  const url = context ? `${API}?context=${context}` : `${API}`;
  const res = await fetchWithAuth(url, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiDeleteTemplate(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/* =========================================================
   Types & constants
   ========================================================= */
type TemplateTheme = "slate" | "stone" | "neutral" | "zinc";
type TemplateContainer = "narrow" | "normal" | "wide";
type TemplateContext = "encounter" | "portal";

interface TemplateOptions {
  theme: TemplateTheme;
  container: TemplateContainer;
  card: boolean;
  applyWrapperToFullHTML: boolean;
  context: TemplateContext;
}

interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  options: TemplateOptions;
  updatedAt: number;
}
type Snap = { title: string; templateText: string; tplOptions: TemplateOptions; currentId: string | null };

const LS_DRAFT = "ts_current_draft_v6";

const btn =
  "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 hover:shadow-md hover:from-blue-50 hover:to-white active:scale-[.97] transition text-sm font-medium shadow-sm backdrop-blur-sm";
const card = "bg-white/85 rounded-3xl border border-gray-200 shadow-[0_4px_14px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)] backdrop-blur-sm hover:shadow-[0_10px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.10)] transition";
const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium";

const uid = () => Math.random().toString(36).slice(2);
const isLikelyHTML = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);
const isFullHTMLDocument = (s: string) => /<!doctype html/i.test(s) || /<html[\s\S]*?>/i.test(s);

/* =========================================================
   Default templates
   ========================================================= */
const TEMPLATE_HIPAA = `HIPAA Declaration\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>HIPAA Declaration</title><style>body{font-family:Arial,sans-serif;margin:2em;background:#f8f9fa;color:#222}.container{max-width:800px;margin:auto;background:#fff;padding:2em;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08)}h1{text-align:center;color:#2d5c9f}.section-title{margin-top:1.5em;font-weight:bold;color:#2d5c9f}ul,ol{margin-left:1.5em;margin-bottom:1em}</style></head><body><div class="container"><h1>HIPAA Declaration & Privacy Notice</h1><div class="section-title">Privacy Notice</div><ol><li>The Practice is required by federal law to maintain the privacy of your PHI.</li><li>Under the Privacy Rule, other laws may require greater access or restrictions.</li><li>The Practice is required to abide by the terms of this Privacy Notice.</li><li>The Practice reserves the right to change the terms of this Privacy Notice.</li></ol><form><div class="section-title">Patient Information</div><div style="margin-bottom:1em"><label>Patient Name:</label><input type="text" name="patientName" required></div><div style="margin-bottom:1em"><label>Date of Birth:</label><input type="date" name="patientDOB"></div><div style="margin-bottom:1em"><input type="checkbox" name="acceptTerms" checked><label>I accept these terms</label></div><button type="submit" style="padding:.6em 1.2em;background:#2d5c9f;color:#fff;border:none;border-radius:4px">Submit</button></form></div></body></html>`;

const TEMPLATE_INSURANCE = `INSURANCE INFORMATION\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Insurance Information</title><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#f8f9fa;color:#222;font-size:14px;margin:0}.container{max-width:540px;margin:2em auto;background:#fff;padding:2em;border-radius:12px;box-shadow:0 4px 20px rgba(44,62,80,.08)}h1{font-size:1.3em;color:#2872d1;text-align:center}.form-row{display:flex;flex-wrap:wrap;align-items:center;margin-bottom:.6em;gap:1em}.form-row label{font-weight:500;font-size:13px;min-width:95px}</style></head><body><div class="container"><h1>INSURANCE INFORMATION</h1><form><div class="form-row"><input type="checkbox" id="medicare"><label for="medicare">Medicare#</label><input type="text" name="medicareNumber"></div><div class="form-row"><input type="checkbox" id="medicaid"><label for="medicaid">Medicaid#</label><input type="text" name="medicaidNumber"></div><div class="form-row"><label for="insName1">Insurance Name:</label><input type="text" id="insName1" name="insName1"></div><button type="submit" style="display:block;margin:1em auto;background:#2872d1;color:#fff;border:none;border-radius:6px;padding:.7em 2em;font-size:15px">Submit</button></form></div></body></html>`;

const TEMPLATE_PRIVACY = `NOTICE OF PRIVACY PRACTICES\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Notice of Privacy Practices</title><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#f8f9fa;color:#222;font-size:14px;margin:0}.container{max-width:600px;margin:2em auto;background:#fff;padding:2em;border-radius:12px;box-shadow:0 4px 20px rgba(44,62,80,.08)}h1{font-size:1.3em;color:#2872d1;text-align:center}.section-title{font-weight:600;color:#2872d1;margin-bottom:.8em;font-size:1.1em;border-bottom:1px solid #f0f0f0;padding-bottom:.3em}</style></head><body><div class="container"><h1>NOTICE OF PRIVACY PRACTICES</h1><form><div class="section-title">Patient Information</div><div style="margin-bottom:1em"><label>Patient Name:</label><input type="text" name="patientName"></div><div class="section-title">Acknowledgement</div><p>I have received and understand this practice\'s Notice of Privacy Practices.</p><div class="section-title">Consent for Treatment</div><p>I voluntarily consent to care, including physician examination and tests.</p><button type="submit" style="display:block;margin:2em auto 0;background:#2872d1;color:#fff;border:none;border-radius:6px;padding:.7em 2em;font-size:15px">Submit</button></form></div></body></html>`;

const TEMPLATE_HELP = `Instructions for completing Pending Forms\n<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Instructions</title><style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;background:#f4f6fb;color:#222;font-size:14px}.container{max-width:510px;margin:2em auto;background:#fff;padding:1.5em 2em;border-radius:12px;box-shadow:0 4px 20px rgba(44,62,80,.08)}h1{font-size:1.2em;color:#2872d1;text-align:center}.section-title{font-weight:600;color:#2872d1;margin-top:1.2em;margin-bottom:.6em}.action{background:#e9f2fd;color:#2872d1;border-radius:4px;padding:1px 6px;font-weight:500;font-size:13px}</style></head><body><div class="container"><h1>Instructions for Completing Pending Forms</h1><div class="section-title">Filling Out Forms</div><ol><li>Select a form from the list.</li><li>Answer all required queries.</li><li>Click <span class="action">Save</span> or <span class="action">Submit Document</span>.</li></ol><div class="section-title">Sending Documents</div><ol><li>Click <span class="action">Submit Document</span>.</li><li>Your form appears as Pending review.</li><li>Once reviewed, it becomes Locked.</li></ol></div></body></html>`;

/* =========================================================
   Clipboard helper
   ========================================================= */
async function copyToClipboard(text: string): Promise<"success"|"blocked"|"unavailable"> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return "success";
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.readOnly = true; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); document.body.removeChild(ta);
    return ok ? "success" : "blocked";
  } catch { return "unavailable"; }
}

/* =========================================================
   Token replacement & preview
   ========================================================= */
function signatureHTML(id: string) {
  return `<div class="sig-pad my-1"><canvas id="sig_${id}" class="w-full h-28 rounded-md border border-dashed border-gray-300 bg-white"></canvas><div class="flex justify-end gap-2 mt-2"><button type="button" class="sig-clear px-3 py-1.5 rounded border text-sm">Clear</button></div><input type="hidden" name="signature_${id}" /></div>`;
}

function replaceTokens(raw: string) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const timeStr = today.toTimeString().slice(0, 5);
  const baseInput = `class="doc-input"`;

  return raw
    .replace(/\{TextInput\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{TextBox\}/g, `<textarea rows="4" ${baseInput}></textarea>`)
    .replace(/\{CheckMark\}/g, `<input type="checkbox" class="doc-check" />`)
    .replace(/\{PatientSignature\}/g, signatureHTML(uid()))
    .replace(/\{AdminSignature\}/g, signatureHTML(uid()))
    .replace(/\{OrgLogo\}/g, `<div class="inline-flex items-center justify-center bg-gray-200 text-gray-600 rounded-md" style="width:120px;height:40px;">Org&nbsp;Logo</div>`)
    .replace(/\{CurrentDate:"global"\}/g, `<input type="date" value="${todayStr}" ${baseInput} />`)
    .replace(/\{CurrentTime\}/g, `<input type="time" value="${timeStr}" ${baseInput} />`)
    .replace(/\{DOS\}/g, `<input type="date" value="${todayStr}" ${baseInput} />`)
    .replace(/\{PatientName\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{PatientDOB\}/g, `<input type="date" max="${todayStr}" ${baseInput} />`);
}

function signatureInit() {
  document.querySelectorAll('.sig-pad').forEach((wrapper: any) => {
    const canvas = wrapper.querySelector('canvas');
    if (!canvas) return;
    const hidden = wrapper.querySelector('input[type="hidden"]');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false, lastX = 0, lastY = 0;
    function size() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * ratio);
      canvas.height = Math.max(1, rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827';
    }
    size(); window.addEventListener('resize', size);
    const pos = (e: any) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
    canvas.addEventListener('mousedown', (e: any) => { drawing = true; const { x, y } = pos(e); lastX = x; lastY = y; });
    canvas.addEventListener('mousemove', (e: any) => { if (!drawing) return; e.preventDefault(); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke(); lastX = x; lastY = y; if (hidden) hidden.value = canvas.toDataURL('image/png'); });
    window.addEventListener('mouseup', () => { drawing = false; });
    wrapper.querySelector('.sig-clear')?.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); if (hidden) hidden.value = ''; });
  });
}

function extractBodyOrAll(html: string) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

function buildPreviewHTML(title: string, templateText: string, options: TemplateOptions) {
  if (!templateText.trim()) return `<!doctype html><html><body><p></p></body></html>`;
  const replaced = replaceTokens(templateText);

  if (isFullHTMLDocument(replaced)) {
    const scriptTag = `<script>(${signatureInit.toString()})();<\/script>`;
    return /<\/body>/i.test(replaced) ? replaced.replace(/<\/body>/i, scriptTag + "</body>") : replaced + scriptTag;
  }

  const inner = isLikelyHTML(replaced) ? replaced : replaced.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"/><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;padding:2rem;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a}.doc-card{max-width:48rem;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:2rem;box-shadow:0 10px 30px rgba(2,6,23,.08)}.doc-input{border:1px solid #e5e7eb;border-radius:10px;padding:.55rem .75rem;font:inherit}</style></head><body><div class="doc-card">${inner}</div><script>(${signatureInit.toString()})();<\/script></body></html>`;
}

/* =========================================================
   Component
   ========================================================= */
export default function TemplateStudio() {
  const [title, setTitle] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [tplOptions, setTplOptions] = useState<TemplateOptions>({
    theme: "slate", container: "normal", card: true, applyWrapperToFullHTML: false, context: "encounter",
  });
  const [currentId, setCurrentId] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<Snap[]>([]);
  const [future, setFuture] = useState<Snap[]>([]);
  const lastPush = useRef(0);
  const pushHistory = () => {
    const now = Date.now();
    if (now - lastPush.current < 250) return;
    lastPush.current = now;
    setHistory(h => [...h, { title, templateText, tplOptions, currentId }]);
    setFuture([]);
  };
  const undo = () => setHistory(h => {
    if (!h.length) return h;
    const prev = h[h.length - 1];
    setFuture(f => [{ title, templateText, tplOptions, currentId }, ...f]);
    setTitle(prev.title); setTemplateText(prev.templateText); setTplOptions(prev.tplOptions); setCurrentId(prev.currentId);
    return h.slice(0, -1);
  });
  const redo = () => setFuture(f => {
    if (!f.length) return f;
    const [next, ...rest] = f;
    setHistory(h => [...h, { title, templateText, tplOptions, currentId }]);
    setTitle(next.title); setTemplateText(next.templateText); setTplOptions(next.tplOptions); setCurrentId(next.currentId);
    return rest;
  });

  // Saved templates
  const [myTemplates, setMyTemplates] = useState<SavedTemplate[]>([]);
  const [filter, setFilter] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredTemplates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const byCtx = myTemplates.filter(t => (t.options?.context || "encounter") === tplOptions.context);
    if (!q) return byCtx;
    return byCtx.filter(t => t.name.toLowerCase().includes(q));
  }, [myTemplates, tplOptions.context, filter]);

  const flash = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Draft persist
  useEffect(() => {
    try {
      const d = localStorage.getItem(LS_DRAFT);
      if (d) {
        const obj = JSON.parse(d);
        if (obj) { setTitle(obj.title || ""); setTemplateText(obj.templateText || ""); if (obj.tplOptions) setTplOptions(obj.tplOptions); }
      }
    } catch {}
  }, []);
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(LS_DRAFT, JSON.stringify({ title, templateText, tplOptions })); } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [title, templateText, tplOptions]);

  // Load from server
  useEffect(() => {
    (async () => {
      try {
        const ctx = toServerContext(tplOptions.context);
        const rows = await apiListTemplates(ctx);
        const mapped: SavedTemplate[] = rows.map(t => {
          const opts = typeof t.options === "string" ? JSON.parse(t.options as any) : (t.options || {});
          return {
            id: String(t.id),
            name: t.name,
            content: t.content,
            options: { theme: opts.theme ?? "slate", container: opts.container ?? "normal", card: opts.card ?? true, applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? false, context: fromServerContext(t.context) },
            updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
          };
        });
        setMyTemplates(mapped);
      } catch (err) { console.error("Failed to load templates:", err); }
    })();
  }, [tplOptions.context]);

  // Save
  const saveTemplate = async () => {
    if (!title.trim()) { flash("Please enter a title", "err"); return; }
    setSaving(true);
    try {
      const body: UpsertBody = {
        name: title.trim(),
        context: toServerContext(tplOptions.context),
        content: templateText,
        options: { theme: tplOptions.theme, container: tplOptions.container, card: tplOptions.card, applyWrapperToFullHTML: tplOptions.applyWrapperToFullHTML },
      };
      let server: ServerTemplate;
      if (currentId) {
        server = await apiUpdateTemplate(Number(currentId), body);
      } else {
        server = await apiCreateTemplate(body);
      }
      const opts = typeof server.options === "string" ? JSON.parse(server.options as any) : (server.options || {});
      const saved: SavedTemplate = {
        id: String(server.id), name: server.name, content: server.content,
        options: { theme: opts.theme ?? "slate", container: opts.container ?? "normal", card: opts.card ?? true, applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? false, context: fromServerContext(server.context) },
        updatedAt: server.updatedAt ? new Date(server.updatedAt).getTime() : Date.now(),
      };
      setMyTemplates(prev => {
        const idx = prev.findIndex(t => t.id === saved.id);
        return idx >= 0 ? prev.map((t, i) => i === idx ? saved : t) : [saved, ...prev];
      });
      setCurrentId(saved.id);
      flash("Template saved");
    } catch (err: any) { flash(err.message || "Save failed", "err"); }
    setSaving(false);
  };

  const loadTemplate = (t: SavedTemplate) => {
    pushHistory();
    setTitle(t.name);
    const firstNewline = t.content.indexOf("\n");
    setTemplateText(firstNewline > -1 ? t.content.slice(firstNewline + 1) : t.content);
    setTplOptions(t.options);
    setCurrentId(t.id);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await apiDeleteTemplate(Number(id));
      setMyTemplates(prev => prev.filter(t => t.id !== id));
      if (currentId === id) { setCurrentId(null); setTitle(""); setTemplateText(""); }
      flash("Template deleted");
    } catch { flash("Delete failed", "err"); }
  };

  const newTemplate = () => {
    pushHistory();
    setCurrentId(null); setTitle(""); setTemplateText("");
  };

  const loadDefault = (raw: string) => {
    pushHistory();
    const nl = raw.indexOf("\n");
    setTitle(nl > -1 ? raw.slice(0, nl) : "Untitled");
    setTemplateText(nl > -1 ? raw.slice(nl + 1) : raw);
    setCurrentId(null);
  };

  const downloadHTML = () => {
    const html = buildPreviewHTML(title, templateText, tplOptions);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title || "template"}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pushHistory();
      setTemplateText(reader.result as string);
      if (!title) setTitle(file.name.replace(/\.html?$/, ""));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const previewHTML = useMemo(() => buildPreviewHTML(title, templateText, tplOptions), [title, templateText, tplOptions]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-4 sm:p-6">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
              className={`fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FileCode2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Template Documents</h1>
              <p className="text-xs text-gray-500">Create and manage HTML form templates</p>
            </div>
          </div>

          {/* Context Toggle */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {(["encounter", "portal"] as TemplateContext[]).map(ctx => (
              <button
                key={ctx}
                onClick={() => setTplOptions(o => ({ ...o, context: ctx }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${tplOptions.context === ctx ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                {ctx === "encounter" ? "Encounter" : "Portal"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar — Templates List */}
          <div className="col-span-3">
            <div className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700">Templates</h2>
                <button onClick={newTemplate} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="New">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search..." className={`${inputBase} pl-8 py-1.5 text-xs`} />
              </div>

              {/* Saved templates */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {filteredTemplates.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No saved templates</p>}
                {filteredTemplates.map(t => (
                  <div
                    key={t.id}
                    onClick={() => loadTemplate(t)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition group ${currentId === t.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Default templates */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Starter Templates</p>
                {[
                  { label: "HIPAA Declaration", data: TEMPLATE_HIPAA },
                  { label: "Insurance Info", data: TEMPLATE_INSURANCE },
                  { label: "Privacy Notice", data: TEMPLATE_PRIVACY },
                  { label: "Form Instructions", data: TEMPLATE_HELP },
                ].map(d => (
                  <button key={d.label} onClick={() => loadDefault(d.data)} className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition truncate">
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="col-span-9">
            <div className={`${card} p-5`}>
              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <input
                  value={title}
                  onChange={e => { pushHistory(); setTitle(e.target.value); }}
                  placeholder="Template title..."
                  className={`${inputBase} max-w-xs`}
                />
                <div className="flex-1" />
                <button onClick={undo} disabled={!history.length} className={`${btn} ${!history.length ? "opacity-40" : ""}`} title="Undo">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={redo} disabled={!future.length} className={`${btn} ${!future.length ? "opacity-40" : ""}`} title="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>
                <button onClick={() => { copyToClipboard(templateText); flash("Copied!"); }} className={btn} title="Copy">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={downloadHTML} className={btn} title="Download HTML">
                  <Download className="w-4 h-4" />
                </button>
                <label className={`${btn} cursor-pointer`} title="Import HTML">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept=".html,.htm" onChange={handleImport} className="hidden" />
                </label>
                <button onClick={() => setShowPreview(true)} className={btn} title="Preview">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={saveTemplate} disabled={saving} className={`${btn} !bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700 ${saving ? "opacity-60" : ""}`}>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Editor */}
              <textarea
                value={templateText}
                onChange={e => { pushHistory(); setTemplateText(e.target.value); }}
                placeholder="Paste or write your HTML template here..."
                rows={24}
                className="w-full font-mono text-sm bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-sm font-bold text-gray-700">Preview: {title || "Untitled"}</h2>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-gray-200">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
                <iframe
                  srcDoc={previewHTML}
                  className="flex-1 w-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Template Preview"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
