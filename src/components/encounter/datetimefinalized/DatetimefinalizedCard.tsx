// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse } from "@/utils/types";
// import Datetimefinalizedform from "./Datetimefinalizedform";
//
// /** If you already have this type in "@/utils/types", just import it and delete this local copy. */
// export type DateTimeFinalizedDto = {
//     id?: number;
//     patientId?: number;
//     encounterId?: number;
//
//     targetType?: string;          // e.g. "NOTE"
//     targetId?: number;
//     targetVersion?: string;
//
//     finalizedAt?: string;         // ISO 8601
//     finalizedBy?: string;         // e.g. "dr.smith@clinic"
//     finalizerRole?: string;       // e.g. "MD"
//     method?: string;              // e.g. "MANUAL"
//     status?: string;              // e.g. "finalized" | "amended" | "revoked"
//     reason?: string;
//     comments?: string;
//     contentHash?: string;
//     providerSignatureId?: number;
//     signoffId?: number;
//
//     audit?: { createdDate?: string; lastModifiedDate?: string };
// };
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// async function safeJson<T = unknown>(res: Response): Promise<T | null> {
//     const text = await res.text().catch(() => "");
//     if (!text) return null;
//     try { return JSON.parse(text) as T; } catch { return null; }
// }
//
// export default function DatetimefinalizedCard({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<DateTimeFinalizedDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<DateTimeFinalizedDto | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/date-time-finalized/{patientId}/{encounterId}
//             const url = `/api/date-time-finalized/${patientId}/${encounterId}`;
//             const res = await fetchWithOrg(url);
//             const json = (await safeJson<ApiResponse<DateTimeFinalizedDto[]>>(res)) ?? undefined;
//
//             if (!res.ok) { setError(`Load failed (${res.status})`); setItems([]); return; }
//             if (!json || json.success !== true) { setError(json?.message || "Load failed"); setItems([]); return; }
//
//             setItems(Array.isArray(json.data) ? json.data : []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Something went wrong");
//             setItems([]);
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     /** Put/merge newly saved item into the local list immediately */
//     function onSaved(saved: DateTimeFinalizedDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems(prev => {
//             const next = [...prev];
//             const i = next.findIndex(x => x.id === saved.id);
//             if (i >= 0) next[i] = saved; else next.unshift(saved);
//             return next;
//         });
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this finalization timestamp?")) return;
//         try {
//             const url = `/api/date-time-finalized/${patientId}/${encounterId}/${id}`;
//             const res = await fetchWithOrg(url, { method: "DELETE" });
//             const json = await safeJson<ApiResponse<void>>(res);
//
//             if (!res.ok) { alert(`Delete failed (${res.status})`); return; }
//             if (json && json.success === false) { alert(json.message || "Delete failed"); return; }
//
//             setItems(p => p.filter(x => x.id !== id));
//             setEditing(null);
//             setShowForm(false);
//         } catch (e: unknown) {
//             alert(e instanceof Error ? e.message : "Something went wrong");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         const arr = Array.isArray(items) ? items : [];
//         return [...arr].sort((a, b) => {
//             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
//             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
//             return d2.localeCompare(d1); // newest first
//         });
//     }, [items]);
//
//     const current = sorted[0]; // show the most recent one as the “card”
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Date/Time Finalized</h2>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={() => { setEditing(null); setShowForm(s => !s); }}
//                         className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                     >
//                         {showForm ? "Close" : (current ? "New" : "Add")}
//                     </button>
//                     {current?.id && (
//                         <button
//                             onClick={() => remove(current.id!)}
//                             className="rounded-xl border px-4 py-2 hover:bg-gray-50"
//                         >
//                             Delete
//                         </button>
//                     )}
//                 </div>
//             </div>
//
//             {/* Current summary card */}
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//
//             {!loading && !error && !current && (
//                 <div className="rounded-2xl border p-4 text-gray-600">No finalization timestamps yet.</div>
//             )}
//
//             {current && (
//                 <div className="rounded-2xl border p-4 bg-white shadow-sm">
//                     <div className="flex items-center justify-between">
//                         <h3 className="font-semibold">Finalized</h3>
//                         <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5">
//               {current.status || "finalized"}
//             </span>
//                     </div>
//
//                     <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
//                         <div><b>Finalized At:</b> {current.finalizedAt || "—"}</div>
//                         <div><b>Finalized By:</b> {current.finalizedBy || "—"}</div>
//                         <div><b>Role:</b> {current.finalizerRole || "—"}</div>
//                         <div><b>Method:</b> {current.method || "—"}</div>
//                         <div><b>Target Type:</b> {current.targetType || "—"}</div>
//                         <div><b>Target ID:</b> {current.targetId ?? "—"}</div>
//                         <div><b>Version:</b> {current.targetVersion || "—"}</div>
//                         <div><b>Reason:</b> {current.reason || "—"}</div>
//                         <div className="md:col-span-2">
//                             <b>Notes:</b> {current.comments || "—"}
//                         </div>
//                         <div><b>Provider Signature ID:</b> {current.providerSignatureId ?? "—"}</div>
//                         <div><b>Sign-off ID:</b> {current.signoffId ?? "—"}</div>
//                         <div className="md:col-span-2"><b>Content Hash:</b> {current.contentHash || "—"}</div>
//                         <div className="md:col-span-2 text-xs text-gray-500">
//                             {current.audit?.createdDate && <>Created: {current.audit.createdDate}</>}
//                             {current.audit?.lastModifiedDate && <> · Updated: {current.audit.lastModifiedDate}</>}
//                         </div>
//                     </div>
//
//                     <div className="mt-3">
//                         <button
//                             onClick={() => { setEditing(current); setShowForm(true); }}
//                             className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                         >
//                             Edit
//                         </button>
//                     </div>
//                 </div>
//             )}
//
//             {/* Form (new or edit) */}
//             {showForm && (
//                 <Datetimefinalizedform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     editing={editing}
//                     onSaved={onSaved}
//                     onCancel={() => { setShowForm(false); setEditing(null); }}
//                 />
//             )}
//         </div>
//     );
// }






// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse } from "@/utils/types";
// import Datetimefinalizedform from "./Datetimefinalizedform";
//
// /** If you already have this type in "@/utils/types", just import it and delete this local copy. */
// export type DateTimeFinalizedDto = {
//     id?: number;
//     patientId?: number;
//     encounterId?: number;
//
//     targetType?: string;          // e.g. "NOTE"
//     targetId?: number;
//     targetVersion?: string;
//
//     finalizedAt?: string;         // ISO 8601
//     finalizedBy?: string;         // e.g. "dr.smith@clinic"
//     finalizerRole?: string;       // e.g. "MD"
//     method?: string;              // e.g. "MANUAL"
//     status?: string;              // e.g. "finalized" | "amended" | "revoked"
//     reason?: string;
//     comments?: string;
//     contentHash?: string;
//     providerSignatureId?: number;
//     signoffId?: number;
//
//     audit?: { createdDate?: string; lastModifiedDate?: string };
// };
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// async function safeJson<T = unknown>(res: Response): Promise<T | null> {
//     const text = await res.text().catch(() => "");
//     if (!text) return null;
//     try { return JSON.parse(text) as T; } catch { return null; }
// }
//
// // local helper used by print template
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) =>
//         ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!)
//     );
// }
//
// export default function DatetimefinalizedCard({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<DateTimeFinalizedDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<DateTimeFinalizedDto | null>(null);
//
//     // UI feedback
//     const [busy, setBusy] = useState(false);
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/date-time-finalized/{patientId}/{encounterId}
//             const url = `/api/date-time-finalized/${patientId}/${encounterId}`;
//             const res = await fetchWithOrg(url);
//             const json = (await safeJson<ApiResponse<DateTimeFinalizedDto[]>>(res)) ?? undefined;
//
//             if (!res.ok) { setError(`Load failed (${res.status})`); setItems([]); return; }
//             if (!json || json.success !== true) { setError(json?.message || "Load failed"); setItems([]); return; }
//
//             setItems(Array.isArray(json.data) ? json.data : []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Something went wrong");
//             setItems([]);
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     /** Put/merge newly saved item into the local list immediately */
//     function onSaved(saved: DateTimeFinalizedDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems(prev => {
//             const next = [...prev];
//             const i = next.findIndex(x => x.id === saved.id);
//             if (i >= 0) next[i] = saved; else next.unshift(saved);
//             return next;
//         });
//         setAlert({ type: "success", msg: "Finalization saved." });
//         setTimeout(() => setAlert(null), 3500);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this finalization timestamp?")) return;
//         try {
//             setBusy(true);
//             const url = `/api/date-time-finalized/${patientId}/${encounterId}/${id}`;
//             const res = await fetchWithOrg(url, { method: "DELETE" });
//             const json = await safeJson<ApiResponse<void>>(res);
//
//             if (!res.ok) throw new Error(`Delete failed (${res.status})`);
//             if (json && json.success === false) throw new Error(json.message || "Delete failed");
//
//             setItems(p => p.filter(x => x.id !== id));
//             setEditing(null);
//             setShowForm(false);
//             setAlert({ type: "success", msg: "Finalization deleted." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusy(false);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // --- eSign: adjust endpoint if your backend differs
//     async function esign(id: number) {
//         try {
//             setBusy(true);
//             const url = `/api/date-time-finalized/${patientId}/${encounterId}/${id}/esign`;
//             const res = await fetchWithOrg(url, { method: "POST" });
//
//             let ok = res.ok;
//             const json = await safeJson<ApiResponse<unknown>>(res);
//             if (json && json.success === false) ok = false;
//
//             if (!ok) throw new Error(json?.message || "eSign failed");
//
//             setAlert({ type: "success", msg: "Finalization e-signed." });
//             // reload so providerSignatureId/signoffId reflect
//             await load();
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusy(false);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // --- Print: open a clean printable view of the current record
//     function printCurrent(rec: DateTimeFinalizedDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//
//             const created = rec.audit?.createdDate ? `Created: ${rec.audit.createdDate}` : "";
//             const updated = rec.audit?.lastModifiedDate ? ` · Updated: ${rec.audit.lastModifiedDate}` : "";
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Date/Time Finalized #${rec.id ?? ""}</title>
// <style>
//   body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
//   h1 { font-size: 20px; margin: 0 0 8px; }
//   .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
//   .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
//   .row { margin: 6px 0; }
//   @media print { @page { margin: 12mm; } }
// </style>
// </head>
// <body>
//   <h1>Date/Time Finalized</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} · ID ${rec.id ?? ""} ${created}${updated}</div>
//   <div class="card">
//     <div class="row"><strong>Status:</strong> ${escapeHtml(rec.status || "finalized")}</div>
//     <div class="row"><strong>Finalized At:</strong> ${escapeHtml(rec.finalizedAt || "—")}</div>
//     <div class="row"><strong>Finalized By:</strong> ${escapeHtml(rec.finalizedBy || "—")}</div>
//     <div class="row"><strong>Role:</strong> ${escapeHtml(rec.finalizerRole || "—")}</div>
//     <div class="row"><strong>Method:</strong> ${escapeHtml(rec.method || "—")}</div>
//     <div class="row"><strong>Target:</strong> ${escapeHtml(rec.targetType || "—")} ${rec.targetId ? "· " + rec.targetId : ""} ${rec.targetVersion ? "· v" + rec.targetVersion : ""}</div>
//     <div class="row"><strong>Reason:</strong> ${escapeHtml(rec.reason || "—")}</div>
//     ${rec.comments ? `<div class="row"><strong>Notes:</strong><br/>${escapeHtml(rec.comments).replace(/\\n/g,"<br/>")}</div>` : ""}
//     <div class="row"><strong>Provider Signature ID:</strong> ${rec.providerSignatureId ?? "—"}</div>
//     <div class="row"><strong>Sign-off ID:</strong> ${rec.signoffId ?? "—"}</div>
//     <div class="row"><strong>Content Hash:</strong> ${escapeHtml(rec.contentHash || "—")}</div>
//   </div>
//   <script>
//     function escapeHtml(s){return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
//     window.onload = () => { window.print(); };
//   </script>
// </body>
// </html>`);
//             win.document.close();
//         } catch (e) {
//             window.alert(e instanceof Error ? e.message : "Unable to print");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         const arr = Array.isArray(items) ? items : [];
//         return [...arr].sort((a, b) => {
//             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
//             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
//             return d2.localeCompare(d1); // newest first
//         });
//     }, [items]);
//
//     const current = sorted[0]; // show the most recent one as the “card”
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Date/Time Finalized</h2>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={() => { setEditing(null); setShowForm(s => !s); }}
//                         className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                     >
//                         {showForm ? "Close" : (current ? "New" : "Add")}
//                     </button>
//                     {current?.id && (
//                         <button
//                             onClick={() => remove(current.id!)}
//                             className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
//                             disabled={busy}
//                         >
//                             Delete
//                         </button>
//                     )}
//                 </div>
//             </div>
//
//             {/* Alerts */}
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
//             {/* Current summary card */}
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//
//             {!loading && !error && !current && (
//                 <div className="rounded-2xl border p-4 text-gray-600">No finalization timestamps yet.</div>
//             )}
//
//             {current && (
//                 <div className="rounded-2xl border p-4 bg-white shadow-sm">
//                     <div className="flex items-center justify-between">
//                         <h3 className="font-semibold">Finalized</h3>
//                         <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5">
//               {current.status || "finalized"}
//             </span>
//                     </div>
//
//                     <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
//                         <div><b>Finalized At:</b> {current.finalizedAt || "—"}</div>
//                         <div><b>Finalized By:</b> {current.finalizedBy || "—"}</div>
//                         <div><b>Role:</b> {current.finalizerRole || "—"}</div>
//                         <div><b>Method:</b> {current.method || "—"}</div>
//                         <div><b>Target Type:</b> {current.targetType || "—"}</div>
//                         <div><b>Target ID:</b> {current.targetId ?? "—"}</div>
//                         <div><b>Version:</b> {current.targetVersion || "—"}</div>
//                         <div><b>Reason:</b> {current.reason || "—"}</div>
//                         <div className="md:col-span-2"><b>Notes:</b> {current.comments || "—"}</div>
//                         <div><b>Provider Signature ID:</b> {current.providerSignatureId ?? "—"}</div>
//                         <div><b>Sign-off ID:</b> {current.signoffId ?? "—"}</div>
//                         <div className="md:col-span-2"><b>Content Hash:</b> {current.contentHash || "—"}</div>
//                         <div className="md:col-span-2 text-xs text-gray-500">
//                             {current.audit?.createdDate && <>Created: {current.audit.createdDate}</>}
//                             {current.audit?.lastModifiedDate && <> · Updated: {current.audit.lastModifiedDate}</>}
//                         </div>
//                     </div>
//
//                     <div className="mt-3 flex flex-wrap gap-2">
//                         <button
//                             onClick={() => { setEditing(current); setShowForm(true); }}
//                             className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                         >
//                             Edit
//                         </button>
//                         <button
//                             onClick={() => current.id && esign(current.id)}
//                             className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                             disabled={busy || !current.id}
//                             title="eSign"
//                         >
//                             eSign
//                         </button>
//                         <button
//                             onClick={() => printCurrent(current)}
//                             className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                             disabled={busy}
//                             title="Print"
//                         >
//                             Print
//                         </button>
//                     </div>
//                 </div>
//             )}
//
//             {/* Form (new or edit) */}
//             {showForm && (
//                 <Datetimefinalizedform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     editing={editing}
//                     onSaved={onSaved}
//                     onCancel={() => { setShowForm(false); setEditing(null); }}
//                 />
//             )}
//         </div>
//     );
// }


"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse } from "@/utils/types";
import Datetimefinalizedform from "./Datetimefinalizedform";

export type DateTimeFinalizedDto = {
    id?: number;
    patientId?: number;
    encounterId?: number;

    targetType?: string;
    targetId?: number;
    targetVersion?: string;

    finalizedAt?: string;
    finalizedBy?: string;
    finalizerRole?: string;
    method?: string;
    status?: string;
    reason?: string;
    comments?: string;
    contentHash?: string;
    providerSignatureId?: number;
    signoffId?: number;

    audit?: { createdDate?: string; lastModifiedDate?: string };
    esigned?: boolean;
};

type Props = {
    patientId: number;
    encounterId: number;
};

async function safeJson<T = unknown>(res: Response): Promise<T | null> {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

export default function DatetimefinalizedCard({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<DateTimeFinalizedDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<DateTimeFinalizedDto | null>(null);

    const [busy, setBusy] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/date-time-finalized/${patientId}/${encounterId}`);
            const json = (await safeJson<ApiResponse<DateTimeFinalizedDto[]>>(res)) ?? undefined;
            if (!res.ok) throw new Error(`Load failed (${res.status})`);
            if (!json || json.success !== true) throw new Error(json?.message || "Load failed");
            setItems(Array.isArray(json.data) ? json.data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, encounterId]);

    function onSaved(saved: DateTimeFinalizedDto) {
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
        setAlert({ type: "success", msg: "Finalization saved." });
        setTimeout(() => setAlert(null), 3500);
    }

    async function remove(id: number) {
        if (!confirm("Delete this finalization timestamp?")) return;
        try {
            setBusy(true);
            const res = await fetchWithOrg(
                `/api/date-time-finalized/${patientId}/${encounterId}/${id}`,
                { method: "DELETE" }
            );
            const json = await safeJson<ApiResponse<void>>(res);
            if (!res.ok || (json && json.success === false)) throw new Error(json?.message || "Delete failed");
            setItems((p) => p.filter((x) => x.id !== id));
            setAlert({ type: "success", msg: "Finalization deleted." });
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusy(false);
            setTimeout(() => setAlert(null), 3500);
        }
    }

    // --- eSign (backend)
    async function esign(id: number) {
        try {
            setBusy(true);
            const res = await fetchWithOrg(
                `/api/date-time-finalized/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST" }
            );
            const json = await safeJson<ApiResponse<unknown>>(res);
            if (!res.ok || (json && json.success === false)) throw new Error(json?.message || "eSign failed");
            setAlert({ type: "success", msg: "Finalization e-signed." });
            await load();
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusy(false);
            setTimeout(() => setAlert(null), 3500);
        }
    }

    // --- Print (backend PDF)
    async function printFromBackend(id: number) {
        try {
            setBusy(true);
            const res = await fetchWithOrg(
                `/api/date-time-finalized/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error("Print failed");
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e) {
            window.alert(e instanceof Error ? e.message : "Unable to print");
        } finally {
            setBusy(false);
        }
    }

    const sorted = useMemo(() => {
        return [...items].sort((a, b) => {
            const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
            const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
            return d2.localeCompare(d1);
        });
    }, [items]);

    const current = sorted[0];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Date/Time Finalized</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditing(null);
                            setShowForm((s) => !s);
                        }}
                        className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                    >
                        {showForm ? "Close" : current ? "New" : "Add"}
                    </button>
                    {current?.id && (
                        <button
                            onClick={() => remove(current.id!)}
                            className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                            disabled={busy}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {alert && (
                <div
                    className={`rounded-xl border px-4 py-2 text-sm ${
                        alert.type === "success"
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-red-300 bg-red-50 text-red-800"
                    }`}
                    role="status"
                >
                    {alert.msg}
                </div>
            )}

            {loading && <div className="text-gray-600">Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && !current && (
                <div className="rounded-2xl border p-4 text-gray-600">No finalization timestamps yet.</div>
            )}

            {current && (
                <div className="rounded-2xl border p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Finalized</h3>
                        <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5">
              {current.status || "finalized"}
            </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div>
                            <b>Finalized At:</b> {current.finalizedAt || "—"}
                        </div>
                        <div>
                            <b>Finalized By:</b> {current.finalizedBy || "—"}
                        </div>
                        <div>
                            <b>Role:</b> {current.finalizerRole || "—"}
                        </div>
                        <div>
                            <b>Method:</b> {current.method || "—"}
                        </div>
                        <div>
                            <b>Target Type:</b> {current.targetType || "—"}
                        </div>
                        <div>
                            <b>Target ID:</b> {current.targetId ?? "—"}
                        </div>
                        <div>
                            <b>Version:</b> {current.targetVersion || "—"}
                        </div>
                        <div>
                            <b>Reason:</b> {current.reason || "—"}
                        </div>
                        <div className="md:col-span-2">
                            <b>Notes:</b> {current.comments || "—"}
                        </div>
                        <div>
                            <b>Provider Signature ID:</b> {current.providerSignatureId ?? "—"}
                        </div>
                        <div>
                            <b>Sign-off ID:</b> {current.signoffId ?? "—"}
                        </div>
                        <div className="md:col-span-2">
                            <b>Content Hash:</b> {current.contentHash || "—"}
                        </div>
                        <div className="md:col-span-2 text-xs text-gray-500">
                            {current.audit?.createdDate && <>Created: {current.audit.createdDate}</>}
                            {current.audit?.lastModifiedDate && <> · Updated: {current.audit.lastModifiedDate}</>}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setEditing(current);
                                setShowForm(true);
                            }}
                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                        >
                            Edit
                        </button>
                        {!current.esigned && (
                            <button
                                onClick={() => current.id && esign(current.id)}
                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                disabled={busy || !current.id}
                                title="eSign"
                            >
                                eSign
                            </button>
                        )}
                        <button
                            onClick={() => current.id && printFromBackend(current.id)}
                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                            disabled={busy}
                            title="Print"
                        >
                            Print
                        </button>
                    </div>
                </div>
            )}

            {showForm && (
                <Datetimefinalizedform
                    patientId={patientId}
                    encounterId={encounterId}
                    editing={editing}
                    onSaved={onSaved}
                    onCancel={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}
