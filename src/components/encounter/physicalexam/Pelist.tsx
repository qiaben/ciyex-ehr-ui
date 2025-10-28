// // "use client";
// //
// // import { useEffect, useMemo, useState } from "react";
// // import { fetchWithOrg } from "@/utils/fetchWithOrg";
// // import type { ApiResponse, PhysicalExamDto } from "@/utils/types";
// // import Peform from "./Peform";
// //
// // type Props = {
// //     patientId: number;
// //     encounterId: number;
// // };
// //
// // export default function Pelist({ patientId, encounterId }: Props) {
// //     const [items, setItems] = useState<PhysicalExamDto[]>([]);
// //     const [loading, setLoading] = useState(true);
// //     const [error, setError] = useState<string | null>(null);
// //     const [showForm, setShowForm] = useState(false);
// //     const [editing, setEditing] = useState<PhysicalExamDto | null>(null);
// //
// //     async function load() {
// //         setLoading(true);
// //         setError(null);
// //         try {
// //             // GET /api/physical-exam/{patientId}/{encounterId}
// //             const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}`);
// //             const json = (await res.json()) as ApiResponse<PhysicalExamDto[]>;
// //             if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
// //             setItems(json.data || []);
// //         } catch (e: unknown) {
// //             setError(e instanceof Error ? e.message : "Something went wrong");
// //         } finally {
// //             setLoading(false);
// //         }
// //     }
// //
// //     useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
// //
// //     function onSaved(saved: PhysicalExamDto) {
// //         setShowForm(false);
// //         setEditing(null);
// //         setItems((prev) => {
// //             const i = prev.findIndex((x) => x.id === saved.id);
// //             if (i >= 0) {
// //                 const copy = [...prev];
// //                 copy[i] = saved;
// //                 return copy;
// //             }
// //             return [saved, ...prev];
// //         });
// //     }
// //
// //     async function remove(id: number) {
// //         if (!confirm("Delete this physical exam?")) return;
// //         try {
// //             const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}/${id}`, { method: "DELETE" });
// //             const json = (await res.json()) as ApiResponse<void>;
// //             if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
// //             setItems((p) => p.filter((x) => x.id !== id));
// //         } catch (e: unknown) {
// //             alert(e instanceof Error ? e.message : "Something went wrong");
// //         }
// //     }
// //
// //     const sorted = useMemo(() => {
// //         return [...items].sort((a, b) => {
// //             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
// //             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
// //             return d2.localeCompare(d1);
// //         });
// //     }, [items]);
// //
// //     return (
// //         <div className="space-y-4">
// //             <div className="flex items-center justify-between">
// //                 <h2 className="text-xl font-semibold">Physical Examination</h2>
// //                 <button
// //                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
// //                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
// //                 >
// //                     {showForm ? "Close" : "Add Physical Exam"}
// //                 </button>
// //             </div>
// //
// //             {showForm && (
// //                 <Peform
// //                     patientId={patientId}
// //                     encounterId={encounterId}
// //                     editing={editing}
// //                     onSaved={onSaved}
// //                     onCancel={() => { setShowForm(false); setEditing(null); }}
// //                 />
// //             )}
// //
// //             {loading && <div className="text-gray-600">Loading...</div>}
// //             {error && <div className="text-red-600">{error}</div>}
// //             {!loading && !error && sorted.length === 0 && (
// //                 <div className="rounded-xl border p-4 text-gray-600">No physical exam recorded yet.</div>
// //             )}
// //
// //             <ul className="space-y-3">
// //                 {sorted.map((pe) => (
// //                     <li key={pe.id} className="rounded-2xl border p-4 bg-white shadow-sm">
// //                         <div className="space-y-2">
// //                             {pe.summary && <p className="text-gray-900 whitespace-pre-wrap">{pe.summary}</p>}
// //
// //                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
// //                                 {(pe.sections || []).map((s, idx) => (
// //                                     <div key={`${s.name}-${idx}`} className="rounded-lg border p-3">
// //                                         <p className="font-medium">
// //                                             {s.name} · <span className={s.status === "Abnormal" ? "text-red-600" : "text-gray-700"}>{s.status || "NotExamined"}</span>
// //                                         </p>
// //                                         {s.finding && <p className="text-sm text-gray-800 mt-1">Finding: {s.finding}</p>}
// //                                         {s.notes && <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{s.notes}</p>}
// //                                     </div>
// //                                 ))}
// //                             </div>
// //
// //                             <p className="text-xs text-gray-500">
// //                                 {pe.audit?.createdDate && <>Created: {pe.audit.createdDate}</>}
// //                                 {pe.audit?.lastModifiedDate && <> · Updated: {pe.audit.lastModifiedDate}</>}
// //                             </p>
// //                         </div>
// //
// //                         <div className="mt-3 flex gap-2">
// //                             <button
// //                                 onClick={() => { setEditing(pe); setShowForm(true); }}
// //                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
// //                             >
// //                                 Edit
// //                             </button>
// //                             <button
// //                                 onClick={() => remove(pe.id!)}
// //                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
// //                             >
// //                                 Delete
// //                             </button>
// //                         </div>
// //                     </li>
// //                 ))}
// //             </ul>
// //         </div>
// //     );
// // }
//
//
// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, PhysicalExamDto } from "@/utils/types";
// import Peform from "./Peform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// function keyToTitle(k: string) {
//     return k
//         .toLowerCase()
//         .split("_")
//         .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
//         .join(" ");
// }
//
// export default function Pelist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<PhysicalExamDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<PhysicalExamDto | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}`);
//             const json = (await res.json()) as ApiResponse<PhysicalExamDto[]>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
//             setItems(json.data || []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Something went wrong");
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     function onSaved(saved: PhysicalExamDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems((prev) => {
//             const i = prev.findIndex((x) => x.id === saved.id);
//             if (i >= 0) {
//                 const copy = [...prev];
//                 copy[i] = saved;
//                 return copy;
//             }
//             return [saved, ...prev];
//         });
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this physical exam?")) return;
//         try {
//             const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}/${id}`, { method: "DELETE" });
//             const json = (await res.json()) as ApiResponse<void>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
//             setItems((p) => p.filter((x) => x.id !== id));
//         } catch (e: unknown) {
//             alert(e instanceof Error ? e.message : "Something went wrong");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         return [...items].sort((a, b) => {
//             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
//             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
//             return d2.localeCompare(d1);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Physical Examination</h2>
//                 <button
//                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add Physical Exam"}
//                 </button>
//             </div>
//
//             {showForm && (
//                 <Peform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     editing={editing}
//                     onSaved={onSaved}
//                     onCancel={() => { setShowForm(false); setEditing(null); }}
//                 />
//             )}
//
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//             {!loading && !error && sorted.length === 0 && (
//                 <div className="rounded-xl border p-4 text-gray-600">No physical exam recorded yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((pe) => (
//                     <li key={pe.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="space-y-2">
//                             {pe.summary && <p className="text-gray-900 whitespace-pre-wrap">{pe.summary}</p>}
//
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                 {(pe.sections || []).map((s, idx) => (
//                                     <div key={`${s.sectionKey}-${idx}`} className="rounded-lg border p-3">
//                                         <p className="font-medium flex items-center gap-2">
//                                             {keyToTitle(s.sectionKey)}
//                                             {s.allNormal ? (
//                                                 <span className="text-xs rounded-full border px-2 py-0.5">All normal</span>
//                                             ) : (
//                                                 <span className="text-xs rounded-full border px-2 py-0.5">Abnormal</span>
//                                             )}
//                                         </p>
//                                         {s.normalText && (
//                                             <p className="text-sm text-gray-800 mt-1">
//                                                 <b>Normal Text:</b> {s.normalText}
//                                             </p>
//                                         )}
//                                         {s.findings && (
//                                             <p className="text-sm text-gray-800 mt-1">
//                                                 <b>Findings:</b> {s.findings}
//                                             </p>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//
//                             <p className="text-xs text-gray-500">
//                                 {pe.audit?.createdDate && <>Created: {pe.audit.createdDate}</>}
//                                 {pe.audit?.lastModifiedDate && <> · Updated: {pe.audit.lastModifiedDate}</>}
//                             </p>
//                         </div>
//
//                         <div className="mt-3 flex gap-2">
//                             <button
//                                 onClick={() => { setEditing(pe); setShowForm(true); }}
//                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                             >
//                                 Edit
//                             </button>
//                             <button
//                                 onClick={() => remove(pe.id!)}
//                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                             >
//                                 Delete
//                             </button>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }
//






// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, PhysicalExamDto } from "@/utils/types";
// import Peform from "./Peform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// function keyToTitle(k: string) {
//     return k
//         .toLowerCase()
//         .split("_")
//         .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
//         .join(" ");
// }
//
// // Safe JSON (handles empty body / non-JSON)
// async function safeJson<T>(res: Response): Promise<T | null> {
//     const t = await res.text().catch(() => "");
//     if (!t) return null;
//     try { return JSON.parse(t) as T; } catch { return null; }
// }
//
// // Escape for print HTML
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) => (
//         { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!
//     ));
// }
//
// export default function Pelist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<PhysicalExamDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<PhysicalExamDto | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busyId, setBusyId] = useState<number | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}`);
//             const json = await safeJson<ApiResponse<PhysicalExamDto[]>>(res);
//             if (!res.ok) throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
//             if (!json?.success) throw new Error(json?.message || "Load failed");
//             setItems(json.data || []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Something went wrong");
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     function onSaved(saved: PhysicalExamDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems((prev) => {
//             const i = prev.findIndex((x) => x.id === saved.id);
//             if (i >= 0) {
//                 const copy = [...prev];
//                 copy[i] = saved;
//                 return copy;
//             }
//             return [saved, ...prev];
//         });
//         setAlert({ type: "success", msg: "Physical exam saved." });
//         setTimeout(() => setAlert(null), 3000);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this physical exam?")) return;
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/physical-exam/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//
//             if (res.status === 204) {
//                 setItems((p) => p.filter((x) => x.id !== id));
//                 setAlert({ type: "success", msg: "Physical exam deleted." });
//                 return;
//             }
//
//             const json = await safeJson<ApiResponse<void>>(res);
//             if (!res.ok || (json && json.success === false)) {
//                 throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
//             }
//             setItems((p) => p.filter((x) => x.id !== id));
//             setAlert({ type: "success", msg: "Physical exam deleted." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3000);
//         }
//     }
//
//     // --- eSign (adjust endpoint if your backend differs)
//     async function esign(id: number) {
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/physical-exam/${patientId}/${encounterId}/${id}/esign`,
//                 { method: "POST" }
//             );
//
//             let ok = res.ok;
//             const json = await safeJson<ApiResponse<unknown>>(res);
//             if (json && json.success === false) ok = false;
//             if (!ok) throw new Error(json?.message || "eSign failed");
//
//             setAlert({ type: "success", msg: "Physical exam e-signed." });
//             await load(); // reflect any signature fields
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3000);
//         }
//     }
//
//     // --- Print: open a clean printable view
//     function printPhysicalExam(pe: PhysicalExamDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//
//             const sectionRows = (pe.sections || [])
//                 .map((s) => {
//                     const badge = s.allNormal ? "All normal" : "Abnormal";
//                     const bits: string[] = [
//                         `<div class="row"><strong>Section:</strong> ${escapeHtml(keyToTitle(s.sectionKey))} · ${escapeHtml(badge)}</div>`
//                     ];
//                     if (s.normalText) bits.push(`<div class="row"><strong>Normal Text:</strong> ${escapeHtml(s.normalText)}</div>`);
//                     if (s.findings) bits.push(`<div class="row"><strong>Findings:</strong> ${escapeHtml(s.findings)}</div>`);
//                     return bits.join("\n");
//                 })
//                 .join(`\n<div class="sep"></div>\n`);
//
//             const created = pe.audit?.createdDate ? `Created: ${pe.audit.createdDate}` : "";
//             const updated = pe.audit?.lastModifiedDate ? ` · Updated: ${pe.audit.lastModifiedDate}` : "";
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Physical Exam #${pe.id ?? ""}</title>
// <style>
//   body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
//   h1 { font-size: 20px; margin: 0 0 8px; }
//   .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
//   .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
//   .row { margin: 6px 0; }
//   .sep { height: 8px; }
//   @media print { @page { margin: 12mm; } }
// </style>
// </head>
// <body>
//   <h1>Physical Examination</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} · ID ${pe.id ?? ""} ${created}${updated}</div>
//   <div class="card">
//     ${pe.summary ? `<div class="row"><strong>Summary:</strong><br/>${escapeHtml(pe.summary).replace(/\n/g,"<br/>")}</div>` : ""}
//     ${sectionRows}
//   </div>
//   <script>window.onload = () => { window.print(); };</script>
// </body>
// </html>`);
//             win.document.close();
//         } catch (e: unknown) {
//             window.alert(e instanceof Error ? e.message : "Unable to print");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         return [...items].sort((a, b) => {
//             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
//             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
//             return d2.localeCompare(d1);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Physical Examination</h2>
//                 <button
//                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add Physical Exam"}
//                 </button>
//             </div>
//
//             {alert && (
//                 <div
//                     className={`rounded-xl border px-4 py-2 text-sm ${
//                         alert.type === "success"
//                             ? "border-green-300 bg-green-50 text-green-800"
//                             : "border-red-300 bg-red-50 text-red-800"
//                     }`}
//                     role="status"
//                 >
//                     {alert.msg}
//                 </div>
//             )}
//
//             {showForm && (
//                 <Peform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     editing={editing}
//                     onSaved={onSaved}
//                     onCancel={() => { setShowForm(false); setEditing(null); }}
//                 />
//             )}
//
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//             {!loading && !error && sorted.length === 0 && (
//                 <div className="rounded-xl border p-4 text-gray-600">No physical exam recorded yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((pe) => (
//                     <li key={pe.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="space-y-2">
//                             {pe.summary && <p className="text-gray-900 whitespace-pre-wrap">{pe.summary}</p>}
//
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                 {(pe.sections || []).map((s, idx) => (
//                                     <div key={`${s.sectionKey}-${idx}`} className="rounded-lg border p-3">
//                                         <p className="font-medium flex items-center gap-2">
//                                             {keyToTitle(s.sectionKey)}
//                                             {s.allNormal ? (
//                                                 <span className="text-xs rounded-full border px-2 py-0.5">All normal</span>
//                                             ) : (
//                                                 <span className="text-xs rounded-full border px-2 py-0.5">Abnormal</span>
//                                             )}
//                                         </p>
//                                         {s.normalText && (
//                                             <p className="text-sm text-gray-800 mt-1">
//                                                 <b>Normal Text:</b> {s.normalText}
//                                             </p>
//                                         )}
//                                         {s.findings && (
//                                             <p className="text-sm text-gray-800 mt-1">
//                                                 <b>Findings:</b> {s.findings}
//                                             </p>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//
//                             <p className="text-xs text-gray-500">
//                                 {pe.audit?.createdDate && <>Created: {pe.audit.createdDate}</>}
//                                 {pe.audit?.lastModifiedDate && <> · Updated: {pe.audit.lastModifiedDate}</>}
//                             </p>
//                         </div>
//
//                         <div className="mt-3 flex flex-wrap gap-2">
//                             <button
//                                 onClick={() => { setEditing(pe); setShowForm(true); }}
//                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                             >
//                                 Edit
//                             </button>
//
//                             <button
//                                 onClick={() => remove(pe.id!)}
//                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                 disabled={busyId === pe.id}
//                             >
//                                 Delete
//                             </button>
//
//                             <button
//                                 onClick={() => esign(pe.id!)}
//                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                 disabled={busyId === pe.id}
//                                 title="eSign"
//                             >
//                                 eSign
//                             </button>
//
//                             <button
//                                 onClick={() => printPhysicalExam(pe)}
//                                 className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                 disabled={busyId === pe.id}
//                                 title="Print"
//                             >
//                                 Print
//                             </button>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }



"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PhysicalExamDto } from "@/utils/types";
import Peform from "./Peform";

type Props = { patientId: number; encounterId: number };

// helper for section labels
function keyToTitle(k: string) {
    return k
        .toLowerCase()
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

// safe JSON parser
async function safeJson<T>(res: Response): Promise<T | null> {
    const txt = await res.text().catch(() => "");
    if (!txt) return null;
    try {
        return JSON.parse(txt) as T;
    } catch {
        return null;
    }
}

export default function Pelist({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<PhysicalExamDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PhysicalExamDto | null>(null);

    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}`);
            const json = await safeJson<ApiResponse<PhysicalExamDto[]>>(res);
            if (!res.ok) throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
            if (!json?.success) throw new Error(json?.message || "Load failed");
            setItems(json.data || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setLoading(false);
        }
    }

   // useEffect(() => { load(); }, [patientId, encounterId]);
// eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [patientId, encounterId]);

    function onSaved(saved: PhysicalExamDto) {
        setShowForm(false);
        setEditing(null);
        setItems((prev) => {
            const i = prev.findIndex((x) => x.id === saved.id);
            if (i >= 0) {
                const copy = [...prev];
                copy[i] = saved;
                return copy;
            }
            return [saved, ...prev];
        });
        setAlert({ type: "success", msg: "Physical exam saved." });
        setTimeout(() => setAlert(null), 3000);
    }

    async function remove(id: number) {
        if (!confirm("Delete this physical exam?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/physical-exam/${patientId}/${encounterId}/${id}`, {
                method: "DELETE",
            });

            if (res.status === 204) {
                setItems((p) => p.filter((x) => x.id !== id));
                setAlert({ type: "success", msg: "Physical exam deleted." });
                return;
            }

            const json = await safeJson<ApiResponse<void>>(res);
            if (!res.ok || (json && json.success === false))
                throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);

            setItems((p) => p.filter((x) => x.id !== id));
            setAlert({ type: "success", msg: "Physical exam deleted." });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3000);
        }
    }

    // --- eSign: backend call
    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/physical-exam/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST" }
            );
            const json = await safeJson<ApiResponse<unknown>>(res);
            if (!res.ok || (json && json.success === false))
                throw new Error(json?.message || "eSign failed");

            setAlert({ type: "success", msg: "Physical exam e-signed." });
            await load();
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        }
        finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3000);
        }
    }

    // --- Print: backend PDF
    async function printFromBackend(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/physical-exam/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error("Print failed");
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setBusyId(null);
        }
    }

    const sorted = useMemo(() => {
        return [...items].sort((a, b) => {
            const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
            const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
            return d2.localeCompare(d1);
        });
    }, [items]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Physical Examination</h2>
                <button
                    onClick={() => { setEditing(null); setShowForm((s) => !s); }}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                    {showForm ? "Close" : "Add Physical Exam"}
                </button>
            </div>

            {alert && (
                <div
                    className={`rounded-xl border px-4 py-2 text-sm ${
                        alert.type === "success"
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-red-300 bg-red-50 text-red-800"
                    }`}
                >
                    {alert.msg}
                </div>
            )}

            {showForm && (
                <Peform
                    patientId={patientId}
                    encounterId={encounterId}
                    editing={editing}
                    onSaved={onSaved}
                    onCancel={() => { setShowForm(false); setEditing(null); }}
                />
            )}

            {loading && <div className="text-gray-600">Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && sorted.length === 0 && (
                <div className="rounded-xl border p-4 text-gray-600">No physical exam recorded yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((pe) => (
                    <li key={pe.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                        <div className="space-y-2">
                            {pe.summary && <p className="text-gray-900 whitespace-pre-wrap">{pe.summary}</p>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(pe.sections || []).map((s, idx) => (
                                    <div key={`${s.sectionKey}-${idx}`} className="rounded-lg border p-3">
                                        <p className="font-medium flex items-center gap-2">
                                            {keyToTitle(s.sectionKey)}
                                            {s.allNormal ? (
                                                <span className="text-xs rounded-full border px-2 py-0.5">All normal</span>
                                            ) : (
                                                <span className="text-xs rounded-full border px-2 py-0.5">Abnormal</span>
                                            )}
                                        </p>
                                        {s.normalText && <p className="text-sm text-gray-800 mt-1"><b>Normal Text:</b> {s.normalText}</p>}
                                        {s.findings && <p className="text-sm text-gray-800 mt-1"><b>Findings:</b> {s.findings}</p>}
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500">
                                {pe.audit?.createdDate && <>Created: {pe.audit.createdDate}</>}
                                {pe.audit?.lastModifiedDate && <> · Updated: {pe.audit.lastModifiedDate}</>}
                            </p>
                            {pe.esigned && (
                                <p className="text-xs text-gray-500">Signed — read only</p>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {!pe.esigned && (
                                <>
                                    <button
                                        onClick={() => { setEditing(pe); setShowForm(true); }}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => remove(pe.id!)}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                        disabled={busyId === pe.id}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => esign(pe.id!)}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                        disabled={busyId === pe.id}
                                    >
                                        eSign
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => printFromBackend(pe.id!)}
                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                disabled={busyId === pe.id}
                            >
                                Print
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
