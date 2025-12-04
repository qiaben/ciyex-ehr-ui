





"use client";
import { useEffect, useMemo, useRef, useState,useCallback } from "react";
import Image from "next/image";
import { fetchWithOrg } from "@/utils/fetchWithOrg";

type ApiResponse<T = unknown> = { success: boolean; message?: string; data?: T };

// Type definitions for all the different data structures
interface EncounterMeta {
    visitCategory?: string;
    type?: string;
    facility?: string;
    dateOfService?: string;
    reasonForVisit?: string;
}

interface AssignedProvider {
    id?: number;
    providerName?: string;
    name?: string;
    role?: string;
    start?: string;
    end?: string;
}

interface ChiefComplaint {
    id?: number;
    title?: string;
    complaint?: string;
    notes?: string;
}

interface HPIEntry {
    id?: number;
    description?: string;
    text?: string;
    notes?: string;
}

interface PMHEntry {
    id?: number;
    description?: string;
    text?: string;
}

interface PatientMHEntry {
    id?: number;
    description?: string;
    text?: string;
}

interface FamilyHistoryEntry {
    relation?: string;
    diagnosisText?: string;
    condition?: string;
    details?: string;
    diagnosisCode?: string;
    notes?: string;
}

interface FamilyHistory {
    id?: number;
    entries?: FamilyHistoryEntry[];
    relation?: string;
    condition?: string;
    details?: string;
}

interface SocialHistoryEntry {
    id?: number;
    category?: string;
    value?: string;
    details?: string;
}

interface SocialHistory {
    entries?: SocialHistoryEntry[];
}

interface ROSEntry {
    id?: number;
    system?: string;
    systemName?: string;
    status?: string;
    isNegative?: boolean;
    finding?: string;
    notes?: string;
}

interface PhysicalExamSection {
    sectionKey?: string;
    allNormal?: boolean;
    normalText?: string;
    findings?: string;
}

interface PhysicalExam {
    id?: number;
    summary?: string;
    sections?: PhysicalExamSection[];
}

interface Procedure {
    id?: number;
    cpt4?: string;
    description?: string;
    procedureName?: string;
    units?: number;
    rate?: number;
    relatedIcds?: string;
}

interface Code {
    id?: number;
    code?: string;
    description?: string;
}

interface Assessment {
    id?: number;
    text?: string;
    assessment?: string;
}

interface Plan {
    id?: number;
    diagnosticPlan?: string;
    plan?: string;
    notes?: string;
    followUpVisit?: string | boolean;
    returnWorkSchool?: string | boolean;
    sectionsJson?: string | object;
}

interface ProviderNote {
    id?: number;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    narrative?: string;
}

interface ProviderSignature {
    signedBy?: string;
    signedAt?: string;
    status?: string;
    signatureData?: string;
    signatureFormat?: string;
}

interface DateTimeFinalized {
    finalizedAt?: string;
    lockedAt?: string;
}

interface Signoff {
    status?: string;
    signedBy?: string;
    signedAt?: string;
    cosigners?: string[];
    cosignedAt?: string;
    finalizedAt?: string;
    lockedAt?: string;
}

async function safeJson<T>(res: Response): Promise<T | null> {
    const txt = await res.text().catch(() => "");
    if (!txt) return null;
    try { return JSON.parse(txt) as T; } catch { return null; }
}

async function getApi<T>(url: string): Promise<T | null> {
    try {
        const res = await fetchWithOrg(url, { headers: { Accept: "application/json" } });
        const json = await safeJson<ApiResponse<T>>(res);
        if (!res.ok || !json?.success) return null;
        return (json.data ?? null) as T | null;
    } catch {
        return null;
    }
}

/** Try a list of endpoints and return the first non-empty result */
async function tryMany<T>(urls: string[]): Promise<T | null> {
    for (const u of urls) {
        const data = await getApi<T>(u);
        if (data && (Array.isArray(data) ? data.length > 0 : true)) return data;
    }
    return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="mb-2 font-semibold text-gray-800">{title}</div>
            {children}
        </div>
    );
}

export default function Encountersummary({
                                             patientId,
                                             encounterId,
                                             showDownload = false,
                                         }: {
    patientId: number;
    encounterId: number;
    showDownload?: boolean;
}) {
    const [loading, setLoading] = useState(true);
    const [topErr, setTopErr] = useState<string | null>(null);

    // Header meta
    const [encMeta, setEncMeta] = useState<EncounterMeta | null>(null);

    // Sections
    const [assignedProviders, setAssignedProviders] = useState<AssignedProvider[] | null>(null);
    const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaint[] | null>(null);
    const [hpi, setHpi] = useState<HPIEntry[] | null>(null);
    const [pmh, setPmh] = useState<PMHEntry[] | null>(null);
    const [patientMH, setPatientMH] = useState<PatientMHEntry[] | null>(null);
    const [fh, setFh] = useState<FamilyHistory[] | null>(null);
    const [sh, setSh] = useState<SocialHistory | null>(null);
    const [ros, setRos] = useState<ROSEntry[] | null>(null);
    const [pe, setPe] = useState<PhysicalExam[] | null>(null);
    const [procedures, setProcedures] = useState<Procedure[] | null>(null);
    const [codes, setCodes] = useState<Code[] | null>(null);
    const [assessment, setAssessment] = useState<Assessment[] | null>(null);
    const [plan, setPlan] = useState<Plan[] | null>(null);
    const [providerNotes, setProviderNotes] = useState<ProviderNote[] | null>(null);
    const [providerSignature, setProviderSignature] = useState<ProviderSignature | null>(null);
    const [signoff, setSignoff] = useState<Signoff | null>(null);
    const [dateTimeFinalized, setDateTimeFinalized] = useState<DateTimeFinalized | null>(null);

    // const summaryRef = useRef<HTMLDivElement | null>(null);

    // useEffect(() => {
    //     let alive = true;
    //     (async () => {
    //         try {
    //             setLoading(true);
    //             setTopErr(null);

    //             // Encounter meta
    //             const meta =
    //                 (await tryMany<EncounterMeta>([
    //                     `/api/encounters/${patientId}/${encounterId}/summary`,
    //                     `/api/encounters/${patientId}/${encounterId}`,
    //                 ])) || null;

    //             // Load sections (try multiple endpoint variants where teams used different paths)
    //             const [
    //                 ap,
    //                 cc,
    //                 hp,
    //                 pm,
    //                 pm2,
    //                 fam,
    //                 socRaw,
    //                 rs,
    //                 px,
    //                 pr,
    //                 cd,
    //                 asmt,
    //                 pl,
    //                 pnotes,
    //                 sig,
    //                 so,
    //                 dtf,
    //             ] = await Promise.all([
    //                 tryMany<AssignedProvider[]>([
    //                     `/api/assigned-providers/${patientId}/${encounterId}`,
    //                     `/api/assigned/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<ChiefComplaint[]>([
    //                     `/api/chief-complaint/${patientId}/${encounterId}`,
    //                     `/api/chief-complaints/${patientId}/${encounterId}`,
    //                     `/api/cc/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<HPIEntry[]>([
    //                     `/api/history-of-present-illness/${patientId}/${encounterId}`,
    //                     `/api/hpi/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<PMHEntry[]>([
    //                     `/api/pmh/${patientId}/${encounterId}`,
    //                     `/api/past-medical-history/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<PatientMHEntry[]>([
    //                     `/api/patient-medical-history/${patientId}/${encounterId}`,
    //                     `/api/patient-mh/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<FamilyHistory[]>([
    //                     `/api/family-history/${patientId}/${encounterId}`,
    //                     `/api/fh/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<SocialHistory | SocialHistoryEntry[]>([
    //                     `/api/social-history/${patientId}/${encounterId}`,
    //                     `/api/socialhistory/${patientId}/${encounterId}`,
    //                     `/api/sh/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<ROSEntry[]>([
    //                     `/api/reviewofsystems/${patientId}/${encounterId}`,
    //                     `/api/ros/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<PhysicalExam[]>([
    //                     `/api/physical-exam/${patientId}/${encounterId}`,
    //                     `/api/pe/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<Procedure[]>([
    //                     `/api/procedures/${patientId}/${encounterId}`,
    //                     `/api/procedure/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<Code[]>([`/api/codes/${patientId}/${encounterId}`]),
    //                 tryMany<Assessment[]>([
    //                     `/api/assessment/${patientId}/${encounterId}`,
    //                     `/api/assessments/${patientId}/${encounterId}`,
    //                 ]),
    //                 tryMany<Plan[]>([`/api/plan/${patientId}/${encounterId}`, `/api/plans/${patientId}/${encounterId}`]),
    //                 tryMany<ProviderNote[]>([`/api/provider-notes/${patientId}/${encounterId}`, `/api/soap/${patientId}/${encounterId}`]),
    //                 tryMany<ProviderSignature>([`/api/provider-signatures/${patientId}/${encounterId}`, `/api/signatures/${patientId}/${encounterId}`]),
    //                 tryMany<Signoff>([`/api/signoffs/${patientId}/${encounterId}`, `/api/sign-off/${patientId}/${encounterId}`]),
    //                 tryMany<DateTimeFinalized>([`/api/datetime-finalized/${patientId}/${encounterId}`, `/api/finalized/${patientId}/${encounterId}`]),
    //             ]);

    //             if (!alive) return;

    //             // Normalize Social History: accept array or object-with-entries
    //             let soc: SocialHistory | null = null;
    //             if (Array.isArray(socRaw)) soc = { entries: socRaw };
    //             else if (socRaw && typeof socRaw === "object") soc = socRaw as SocialHistory;

    //             setEncMeta(meta);
    //             setAssignedProviders(ap || null);
    //             setChiefComplaints(cc || null);
    //             setHpi(hp || null);
    //             setPmh(pm || null);
    //             setPatientMH(pm2 || null);
    //             setFh(fam || null);
    //             setSh(soc || null);
    //             setRos(rs || null);
    //             setPe(px || null);
    //             setProcedures(pr || null);
    //             setCodes(cd || null);
    //             setAssessment(asmt || null);
    //             setPlan(pl || null);
    //             setProviderNotes(pnotes || null);
    //             setProviderSignature(sig || null);
    //             setSignoff(so || null);
    //             setDateTimeFinalized(dtf || null);
    //         } catch (e: unknown) {
    //             if (!alive) return;
    //             setTopErr(e instanceof Error ? e.message : "Failed to load summary");
    //         } finally {
    //             if (alive) setLoading(false);
    //         }
    //     })();
    //     return () => { alive = false; };
    // }, [patientId, encounterId]);





    const summaryRef = useRef<HTMLDivElement | null>(null);

// ⬇️ NEW: the loader we can call anytime
const loadAll = useCallback(async () => {
  //let alive = true;
  const alive = true;

  try {
    setLoading(true);
    setTopErr(null);

    // ---- Encounter meta ----
    const meta =
      (await tryMany<EncounterMeta>([
        `/api/encounters/${patientId}/${encounterId}/summary`,
        `/api/encounters/${patientId}/${encounterId}`,
      ])) || null;

    // ---- Sections (same list you already had) ----
    const [
      ap, cc, hp, pm, pm2, fam, socRaw, rs, px, pr, cd, asmt, pl, pnotes, sig, so, dtf,
    ] = await Promise.all([
      tryMany<AssignedProvider[]>([
        `/api/assigned-providers/${patientId}/${encounterId}`,
        `/api/assigned/${patientId}/${encounterId}`,
      ]),
      tryMany<ChiefComplaint[]>([
        `/api/chief-complaint/${patientId}/${encounterId}`,
        `/api/chief-complaints/${patientId}/${encounterId}`,
        `/api/cc/${patientId}/${encounterId}`,
      ]),
      tryMany<HPIEntry[]>([
        `/api/history-of-present-illness/${patientId}/${encounterId}`,
        `/api/hpi/${patientId}/${encounterId}`,
      ]),
      tryMany<PMHEntry[]>([
        `/api/pmh/${patientId}/${encounterId}`,
        `/api/past-medical-history/${patientId}/${encounterId}`,
      ]),
      tryMany<PatientMHEntry[]>([
        `/api/patient-medical-history/${patientId}/${encounterId}`,
        `/api/patient-mh/${patientId}/${encounterId}`,
      ]),
      tryMany<FamilyHistory[]>([
        `/api/family-history/${patientId}/${encounterId}`,
        `/api/fh/${patientId}/${encounterId}`,
      ]),
      tryMany<SocialHistory | SocialHistoryEntry[]>([
        `/api/social-history/${patientId}/${encounterId}`,
        `/api/socialhistory/${patientId}/${encounterId}`,
        `/api/sh/${patientId}/${encounterId}`,
      ]),
      tryMany<ROSEntry[]>([
        `/api/reviewofsystems/${patientId}/${encounterId}`,
        `/api/ros/${patientId}/${encounterId}`,
      ]),
      tryMany<PhysicalExam[]>([
        `/api/physical-exam/${patientId}/${encounterId}`,
        `/api/pe/${patientId}/${encounterId}`,
      ]),
      tryMany<Procedure[]>([
        `/api/procedures/${patientId}/${encounterId}`,
        `/api/procedure/${patientId}/${encounterId}`,
      ]),
      tryMany<Code[]>([`/api/codes/${patientId}/${encounterId}`]),
      tryMany<Assessment[]>([
        `/api/assessment/${patientId}/${encounterId}`,
        `/api/assessments/${patientId}/${encounterId}`,
      ]),
      tryMany<Plan[]>([
        `/api/plan/${patientId}/${encounterId}`,
        `/api/plans/${patientId}/${encounterId}`,
      ]),
      tryMany<ProviderNote[]>([
        `/api/provider-notes/${patientId}/${encounterId}`,
        `/api/soap/${patientId}/${encounterId}`,
      ]),
      tryMany<ProviderSignature>([
        `/api/provider-signatures/${patientId}/${encounterId}`,
        `/api/signatures/${patientId}/${encounterId}`,
      ]),
      tryMany<Signoff>([
        `/api/signoffs/${patientId}/${encounterId}`,
        `/api/sign-off/${patientId}/${encounterId}`,
      ]),
      tryMany<DateTimeFinalized>([
        `/api/datetime-finalized/${patientId}/${encounterId}`,
        `/api/finalized/${patientId}/${encounterId}`,
      ]),
    ]);

    // normalize & set
    let soc: SocialHistory | null = null;
    if (Array.isArray(socRaw)) soc = { entries: socRaw };
    else if (socRaw && typeof socRaw === "object") soc = socRaw as SocialHistory;

    if (!alive) return;
    setEncMeta(meta);
    setAssignedProviders(ap || null);
    setChiefComplaints(cc || null);
    setHpi(hp || null);
    setPmh(pm || null);
    setPatientMH(pm2 || null);
    setFh(fam || null);
    setSh(soc || null);
    setRos(rs || null);
    setPe(px || null);
    setProcedures(pr || null);
    setCodes(cd || null);
    setAssessment(asmt || null);
    setPlan(pl || null);
    setProviderNotes(pnotes || null);
    setProviderSignature(sig || null);
    setSignoff(so || null);
    setDateTimeFinalized(dtf || null);
  } catch (e: unknown) {
    setTopErr(e instanceof Error ? e.message : "Failed to load summary");
  } finally {
    setLoading(false);
  }
}, [patientId, encounterId]);


// A. initial load (and when ids change)
useEffect(() => {
  loadAll();
}, [loadAll]);

// B. auto-refresh: on focus/visibility + gentle polling while visible
useEffect(() => {
  const onFocus = () => loadAll();
  const onVis = () => { if (!document.hidden) loadAll(); };
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVis);

  const POLL_MS = 300000; // 5 minutes; adjust if you like
  const timer = setInterval(() => {
    if (!document.hidden) loadAll();
  }, POLL_MS);

  return () => {
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVis);
    clearInterval(timer);
  };
}, [loadAll]);



   
// Client-side PDF download using html2pdf.js (no API dependency)
async function downloadPdf() {
    if (!summaryRef.current) {
        window.alert("Summary not loaded");
        return;
    }
    try {
        // Dynamically import html2pdf.js
       // const html2pdf = (await import("html2pdf.js"))?.default || (window as any).html2pdf;
       const html2pdf =
  (await import("html2pdf.js"))?.default ||
  (window as unknown as { html2pdf?: unknown }).html2pdf; 
       if (!html2pdf) {
            window.alert("html2pdf.js not found. Please install it via npm/yarn/pnpm.");
            return;
        }
        html2pdf()
            .set({
                margin: 0.5,
                filename: `encounter-${encounterId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            })
            .from(summaryRef.current)
            .save();
    } catch (e) {
        window.alert("Failed to generate PDF: " + (e instanceof Error ? e.message : "Unknown error"));
    }
}


    const hasAnyData = useMemo(() => {
        return [
            assignedProviders, chiefComplaints, hpi, pmh, patientMH, fh, sh?.entries, ros, pe,
            procedures, codes, assessment, plan, providerNotes, providerSignature, signoff, dateTimeFinalized
        ].some((x) => (Array.isArray(x) ? x.length > 0 : !!x));
    }, [
        assignedProviders, chiefComplaints, hpi, pmh, patientMH, fh, sh, ros, pe,
        procedures, codes, assessment, plan, providerNotes, providerSignature, signoff, dateTimeFinalized
    ]);

    if (loading) return <div className="p-4 text-sm text-gray-600">Loading encounter summary…</div>;
    if (topErr)  return <div className="p-4 text-sm text-red-600">Error: {topErr}</div>;

    return (
        <div>
            {showDownload && (
                <div className="mb-3 flex justify-end">
                    <button
                        onClick={downloadPdf}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-700"
                        title="Download PDF"
                    >
                       Print
                    </button>
                </div>
            )}

            <div ref={summaryRef} className="grid gap-4">
                {/* Header meta */}
                {encMeta && (
                    <div className="rounded-2xl border bg-white shadow-sm p-4">
                        <div className="mb-2 font-semibold text-gray-800">Encounter Summary</div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                            {encMeta.visitCategory && <div className="row"><b>Visit Category:</b> {String(encMeta.visitCategory)}</div>}
                            {encMeta.type && <div className="row"><b>Type:</b> {String(encMeta.type)}</div>}
                            {encMeta.facility && <div className="row"><b>Facility:</b> {String(encMeta.facility)}</div>}
                            {encMeta.dateOfService && <div className="row"><b>Date of service:</b> {String(encMeta.dateOfService)}</div>}
                            {encMeta.reasonForVisit && (
                                <div className="row sm:col-span-2"><b>Reason for Visit:</b> {String(encMeta.reasonForVisit)}</div>
                            )}
                        </div>
                    </div>
                )}

                {!hasAnyData && (
                    <div className="rounded-2xl border bg-white shadow-sm p-8 text-center text-gray-500">
                        No data available for this encounter yet.
                    </div>
                )}

                {/* Assigned Providers */}
                {assignedProviders?.length ? (
                    <Section title="Assigned Provider(s)">
                        <ul className="text-sm text-gray-800 space-y-1">
                            {assignedProviders.map((p, i) => (
                                <li key={p?.id ?? i}>
                                    <b>{p?.providerName || p?.name || `Provider #${p?.id ?? i + 1}`}</b>
                                    {p?.role ? ` — ${p.role}` : ""}{" "}
                                    <span className="text-xs text-gray-500">
                    {p?.start ? `Start: ${p.start}` : ""}{p?.end ? ` · End: ${p.end}` : ""}
                  </span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Chief Complaint */}
                {chiefComplaints?.length ? (
                    <Section title="Chief Complaint">
                        <ul className="space-y-2">
                            {chiefComplaints.map((cc, i) => (
                                <li key={cc?.id ?? i} className="text-sm">
                                    <div className="font-medium text-gray-900">{cc?.title || cc?.complaint || "Chief Complaint"}</div>
                                    {cc?.notes && <div className="text-gray-700 whitespace-pre-wrap">{cc.notes}</div>}
                                </li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* SOAP / Provider Notes */}
                {providerNotes?.length ? (
                    <Section title="SOAP">
                        {providerNotes.map((n, i) => (
                            <div key={n?.id ?? i} className="border rounded-lg p-3 mb-2">
                                {n?.subjective && (<p className="text-sm"><b>S:</b> {n.subjective}</p>)}
                                {n?.objective  && (<p className="text-sm"><b>O:</b> {n.objective}</p>)}
                                {n?.assessment && (<p className="text-sm"><b>A:</b> {n.assessment}</p>)}
                                {n?.plan       && (<p className="text-sm"><b>P:</b> {n.plan}</p>)}
                                {n?.narrative  && (<p className="text-sm whitespace-pre-wrap"><b>Narrative:</b> {n.narrative}</p>)}
                            </div>
                        ))}
                    </Section>
                ) : null}

                {/* Patient Medical History */}
                {patientMH?.length ? (
                    <Section title="Patient Medical History">
                        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                            {patientMH.map((x, i) => (
                                <li key={x?.id ?? i}>{x?.description || x?.text || JSON.stringify(x)}</li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Past Medical History */}
                {pmh?.length ? (
                    <Section title="Past Medical History (PMH)">
                        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                            {pmh.map((x, i) => (
                                <li key={x?.id ?? i}>{x?.description || x?.text || JSON.stringify(x)}</li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Family History (render entries if present) */}
                {fh?.length ? (
                    <Section title="Family History">
                        <div className="text-sm text-gray-800 space-y-2">
                            {fh.map((block, i) => {
                                if (Array.isArray(block?.entries)) {
                                    return (
                                        <ul key={block?.id ?? i} className="list-disc pl-5">
                                            {block.entries.map((e, j) => (
                                                <li key={j}>
                                                    {e?.relation ? `${e.relation}: ` : ""}
                                                    {e?.diagnosisText || e?.condition || e?.details || e?.diagnosisCode || "—"}
                                                    {e?.notes ? ` — ${e.notes}` : ""}
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }
                                return (
                                    <div key={block?.id ?? i}>
                                        {block?.relation ? `${block.relation}: ` : ""}
                                        {block?.condition || block?.details || JSON.stringify(block)}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                ) : null}

                {/* Social History (array or {entries}) */}
                {sh?.entries?.length ? (
                    <Section title="Social History">
                        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                            {sh.entries.map((x, i) => (
                                <li key={x?.id ?? i}>
                                    <b>{x?.category || "Item"}:</b> {x?.value || "—"} {x?.details ? `— ${x.details}` : ""}
                                </li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* ROS */}
                {ros?.length ? (
                    <Section title="Review of Systems (ROS)">
                        <ul className="text-sm text-gray-800 space-y-1">
                            {ros.map((r, i) => (
                                <li key={r?.id ?? i}>
                                    <b>{r?.system || r?.systemName || "System"}:</b> {r?.status || (r?.isNegative ? "Negative" : "Positive")}
                                    {r?.finding ? ` — ${r.finding}` : ""}
                                    {r?.notes ? <div className="text-gray-700 whitespace-pre-wrap">{r.notes}</div> : null}
                                </li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Physical Exam */}
                {pe?.length ? (
                    <Section title="Physical Exam">
                        {pe.map((p, i) => (
                            <div key={p?.id ?? i} className="border rounded-lg p-3 mb-2">
                                {p?.summary && <p className="text-sm whitespace-pre-wrap">{p.summary}</p>}
                                {Array.isArray(p?.sections) && p.sections.length > 0 && (
                                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                                        {p.sections.map((s, j) => (
                                            <div key={j} className="rounded-md border p-2 text-sm">
                                                <div className="font-medium">{s?.sectionKey || "Section"}</div>
                                                {s?.allNormal ? <div className="text-xs text-gray-600">All normal</div> : null}
                                                {s?.normalText && <div className="mt-1">Normal: {s.normalText}</div>}
                                                {s?.findings && <div className="mt-1">Findings: {s.findings}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </Section>
                ) : null}

                {/* Procedures */}
                {procedures?.length ? (
                    <Section title="Procedures">
                        <ul className="text-sm text-gray-800 space-y-1">
                            {procedures.map((p, i) => (
                                <li key={p?.id ?? i}>
                                    {p?.cpt4 ? `${p.cpt4} · ${p?.description || ""}` : (p?.procedureName || "Procedure")}
                                    {typeof p?.units === "number" ? ` · Units: ${p.units}` : ""}
                                    {p?.rate ? ` · $${p.rate}` : ""}
                                    {p?.relatedIcds ? ` · ICDs: ${p.relatedIcds}` : ""}
                                </li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Codes */}
                {codes?.length ? (
                    <Section title="Codes">
                        <ul className="text-sm text-gray-800 space-y-1">
                            {codes.map((c, i) => (
                                <li key={c?.id ?? i}>
                                    {c?.code ? <b>{c.code}</b> : <b>Code</b>} {c?.description ? `— ${c.description}` : ""}
                                </li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Assessment */}
                {assessment?.length ? (
                    <Section title="Assessment">
                        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                            {assessment.map((a, i) => (
                                <li key={a?.id ?? i}>{a?.text || a?.assessment || JSON.stringify(a)}</li>
                            ))}
                        </ul>
                    </Section>
                ) : null}

                {/* Plan */}
                {plan?.length ? (
                    <Section title="Plan">
                        {plan.map((p, i) => (
                            <div key={p?.id ?? i} className="border rounded-lg p-3 mb-2 text-sm whitespace-pre-wrap">
                                {p?.diagnosticPlan && <div><b>Diagnostic Plan:</b> {p.diagnosticPlan}</div>}
                                {p?.plan && <div><b>Plan:</b> {p.plan}</div>}
                                {p?.notes && <div><b>Notes:</b> {p.notes}</div>}
                                {p?.followUpVisit && <div><b>Follow-Up Visit:</b> {String(p.followUpVisit)}</div>}
                                {p?.returnWorkSchool && <div><b>Return Work/School:</b> {String(p.returnWorkSchool)}</div>}
                                {p?.sectionsJson && (
                                    <pre className="mt-2 text-xs bg-gray-50 rounded p-2 overflow-auto">
                    {typeof p.sectionsJson === "string" ? p.sectionsJson : JSON.stringify(p.sectionsJson, null, 2)}
                  </pre>
                                )}
                            </div>
                        ))}
                    </Section>
                ) : null}

                {/* Provider Signature */}
                {providerSignature ? (
                    <Section title="Provider Signature">
                        <div className="text-sm text-gray-800">
                            <div><b>Signed by:</b> {providerSignature?.signedBy || "—"}</div>
                            {providerSignature?.signedAt && <div><b>Signed at:</b> {providerSignature.signedAt}</div>}
                            {providerSignature?.status && <div><b>Status:</b> {providerSignature.status}</div>}
                            {providerSignature?.signatureData && (
                                <div className="mt-2">
                                    <Image
                                        alt="Provider Signature"
                                        className="max-h-24"
                                        width={200}
                                        height={96}
                                        src={
                                            providerSignature?.signatureFormat?.startsWith?.("image/")
                                                ? `data:${providerSignature.signatureFormat};base64,${providerSignature.signatureData}`
                                                : `data:image/png;base64,${providerSignature.signatureData}`
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </Section>
                ) : null}

                {/* Date/Time Finalized */}
                {dateTimeFinalized ? (
                    <Section title="Date/Time Finalized">
                        <div className="text-sm text-gray-800">
                            {dateTimeFinalized?.finalizedAt && <div><b>Finalized At:</b> {dateTimeFinalized.finalizedAt}</div>}
                            {dateTimeFinalized?.lockedAt && <div><b>Locked At:</b> {dateTimeFinalized.lockedAt}</div>}
                        </div>
                    </Section>
                ) : null}

                {/* Sign-off */}
                {signoff ? (
                    <Section title="Sign-off / Finalization">
                        <div className="text-sm text-gray-800">
                            <div><b>Status:</b> {signoff?.status || "Draft"}</div>
                            {signoff?.signedBy && <div><b>Signed By:</b> {signoff.signedBy}</div>}
                            {signoff?.signedAt && <div><b>Signed At:</b> {signoff.signedAt}</div>}
                            {Array.isArray(signoff?.cosigners) && signoff.cosigners.length > 0 && (
                                <div><b>Co-signers:</b> {signoff.cosigners.join(", ")}</div>
                            )}
                            {signoff?.cosignedAt && <div><b>Co-signed At:</b> {signoff.cosignedAt}</div>}
                            {(signoff?.finalizedAt || signoff?.lockedAt) && (
                                <div><b>Finalized/Locked At:</b> {signoff.finalizedAt || signoff.lockedAt}</div>
                            )}
                        </div>
                    </Section>
                ) : null}
            </div>
        </div>
    );
}