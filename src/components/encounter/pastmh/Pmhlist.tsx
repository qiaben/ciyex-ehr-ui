// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, PastMedicalHistoryDto } from "@/utils/types";
// import PMhform from "./PMhform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// /** Safely read an ApiResponse<T>; returns null when body is empty or not JSON */
// async function safeApiJson<T>(res: Response): Promise<ApiResponse<T> | null> {
//     const text = await res.text();
//     if (!text) return null;
//     try {
//         return JSON.parse(text) as ApiResponse<T>;
//     } catch {
//         return null;
//     }
// }
//
// export default function Pmhlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<PastMedicalHistoryDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<PastMedicalHistoryDto | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetchWithOrg(
//                 `/api/past-medical-history/${patientId}/${encounterId}`
//             );
//             const json = await safeApiJson<PastMedicalHistoryDto[]>(res);
//
//             if (!res.ok) {
//                 throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
//             }
//
//             const data = json?.success ? json.data || [] : [];
//             setItems(Array.isArray(data) ? data : []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Something went wrong");
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => {
//         load();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [patientId, encounterId]);
//
//     function onSaved(saved: PastMedicalHistoryDto) {
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
//         if (!confirm("Delete this PMH entry?")) return;
//         try {
//             const res = await fetchWithOrg(
//                 `/api/past-medical-history/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//
//             if (res.status === 204) {
//                 setItems((p) => p.filter((x) => x.id !== id));
//                 return;
//             }
//
//             const json = await safeApiJson<void>(res);
//
//             if (!res.ok) {
//                 throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
//             }
//             if (json && !json.success) {
//                 throw new Error(json.message || "Delete failed");
//             }
//
//             setItems((p) => p.filter((x) => x.id !== id));
//         } catch (e: unknown) {
//             alert(e instanceof Error ? e.message : "Something went wrong");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         return [...items].sort((a, b) => {
//             const aKey = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
//             const bKey = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
//             return bKey.localeCompare(aKey);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Past Medical History (PMH)</h2>
//                 <button
//                     onClick={() => {
//                         setEditing(null);
//                         setShowForm((s) => !s);
//                     }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                     aria-expanded={showForm}
//                     aria-controls="pmh-form"
//                 >
//                     {showForm ? "Close" : "Add PMH"}
//                 </button>
//             </div>
//
//             {showForm && (
//                 <div id="pmh-form">
//                     <PMhform
//                         patientId={patientId}
//                         encounterId={encounterId}
//                         editing={editing}
//                         onSaved={onSaved}
//                         onCancel={() => {
//                             setShowForm(false);
//                             setEditing(null);
//                         }}
//                     />
//                 </div>
//             )}
//
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//             {!loading && !error && sorted.length === 0 && (
//                 <div className="rounded-xl border p-4 text-gray-600">
//                     No PMH entries yet.
//                 </div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((pmh) => (
//                     <li
//                         key={pmh.id}
//                         className="rounded-2xl border p-4 bg-white shadow-sm"
//                     >
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="text-gray-900 whitespace-pre-wrap">
//                                     {pmh.description}
//                                 </p>
//                                 <p className="text-xs text-gray-500">
//                                     {pmh.audit?.createdDate && <>Created: {pmh.audit.createdDate}</>}
//                                     {pmh.audit?.lastModifiedDate && (
//                                         <> · Updated: {pmh.audit.lastModifiedDate}</>
//                                     )}
//                                 </p>
//                             </div>
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={() => {
//                                         setEditing(pmh);
//                                         setShowForm(true);
//                                     }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Edit
//                                 </button>
//                                 <button
//                                     onClick={() => remove(pmh.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Delete
//                                 </button>
//                             </div>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }






// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, PastMedicalHistoryDto } from "@/utils/types";
// import PMhform from "./PMhform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// /** Safely read an ApiResponse<T>; returns null when body is empty or not JSON */
// async function safeApiJson<T>(res: Response): Promise<ApiResponse<T> | null> {
//     const text = await res.text();
//     if (!text) return null;
//     try {
//         return JSON.parse(text) as ApiResponse<T>;
//     } catch {
//         return null;
//     }
// }
//
// // helper for print template
// function escapeHtml(s: string) {
//     return String(s).replace(
//         /[&<>"']/g,
//         (m) =>
//             ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!)
//     );
// }
//
// export default function Pmhlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<PastMedicalHistoryDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<PastMedicalHistoryDto | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busyId, setBusyId] = useState<number | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetchWithOrg(`/api/past-medical-history/${patientId}/${encounterId}`);
//             const json = await safeApiJson<PastMedicalHistoryDto[]>(res);
//
//             if (!res.ok) throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
//             const data = json?.success ? json.data || [] : [];
//             setItems(Array.isArray(data) ? data : []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Something went wrong");
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => {
//         load();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [patientId, encounterId]);
//
//     function onSaved(saved: PastMedicalHistoryDto) {
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
//         setAlert({ type: "success", msg: "PMH saved." });
//         setTimeout(() => setAlert(null), 3500);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this PMH entry?")) return;
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/past-medical-history/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//
//             if (res.status === 204) {
//                 setItems((p) => p.filter((x) => x.id !== id));
//                 setAlert({ type: "success", msg: "PMH deleted." });
//                 return;
//             }
//
//             const json = await safeApiJson<void>(res);
//
//             if (!res.ok) throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
//             if (json && !json.success) throw new Error(json.message || "Delete failed");
//
//             setItems((p) => p.filter((x) => x.id !== id));
//             setAlert({ type: "success", msg: "PMH deleted." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // --- eSign (adjust endpoint if your backend differs)
//     async function esign(id: number) {
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/past-medical-history/${patientId}/${encounterId}/${id}/esign`,
//                 { method: "POST" }
//             );
//             let ok = res.ok;
//             const json = await safeApiJson<unknown>(res);
//             if (json && json.success === false) ok = false;
//             if (!ok) throw new Error(json?.message || "eSign failed");
//
//             setAlert({ type: "success", msg: "PMH entry e-signed." });
//             // If signature fields are stamped on save, reload to reflect
//             await load();
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // --- Print: open a clean printable view
//     function printPmh(pmh: PastMedicalHistoryDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//             const created = pmh.audit?.createdDate ? `Created: ${pmh.audit.createdDate}` : "";
//             const updated = pmh.audit?.lastModifiedDate ? ` · Updated: ${pmh.audit.lastModifiedDate}` : "";
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Past Medical History #${pmh.id ?? ""}</title>
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
//   <h1>Past Medical History</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} · ID ${pmh.id ?? ""} ${created}${updated}</div>
//   <div class="card">
//     ${pmh.description ? `<div class="row"><strong>Description:</strong><br/>${escapeHtml(
//                 pmh.description
//             ).replace(/\\n/g,"<br/>")}</div>` : ""}
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
//             const aKey = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
//             const bKey = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
//             return bKey.localeCompare(aKey);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Past Medical History (PMH)</h2>
//                 <button
//                     onClick={() => {
//                         setEditing(null);
//                         setShowForm((s) => !s);
//                     }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                     aria-expanded={showForm}
//                     aria-controls="pmh-form"
//                 >
//                     {showForm ? "Close" : "Add PMH"}
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
//                 <div id="pmh-form">
//                     <PMhform
//                         patientId={patientId}
//                         encounterId={encounterId}
//                         editing={editing}
//                         onSaved={onSaved}
//                         onCancel={() => {
//                             setShowForm(false);
//                             setEditing(null);
//                         }}
//                     />
//                 </div>
//             )}
//
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//             {!loading && !error && sorted.length === 0 && (
//                 <div className="rounded-xl border p-4 text-gray-600">No PMH entries yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((pmh) => (
//                     <li key={pmh.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="text-gray-900 whitespace-pre-wrap">{pmh.description}</p>
//                                 <p className="text-xs text-gray-500">
//                                     {pmh.audit?.createdDate && <>Created: {pmh.audit.createdDate}</>}
//                                     {pmh.audit?.lastModifiedDate && <> · Updated: {pmh.audit.lastModifiedDate}</>}
//                                 </p>
//                             </div>
//
//                             <div className="flex flex-wrap gap-2">
//                                 <button
//                                     onClick={() => {
//                                         setEditing(pmh);
//                                         setShowForm(true);
//                                     }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Edit
//                                 </button>
//
//                                 <button
//                                     onClick={() => remove(pmh.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === pmh.id}
//                                 >
//                                     Delete
//                                 </button>
//
//                                 <button
//                                     onClick={() => esign(pmh.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === pmh.id}
//                                     title="eSign"
//                                 >
//                                     eSign
//                                 </button>
//
//                                 <button
//                                     onClick={() => printPmh(pmh)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === pmh.id}
//                                     title="Print"
//                                 >
//                                     Print
//                                 </button>
//                             </div>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }



"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PastMedicalHistoryDto } from "@/utils/types";
import Pmhform from "./Pmhform";

type Props = { patientId: number; encounterId: number };

// safe JSON parse
async function safeApiJson<T>(res: Response): Promise<ApiResponse<T> | null> {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text) as ApiResponse<T>;
    } catch {
        return null;
    }
}

export default function Pmhlist({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<PastMedicalHistoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PastMedicalHistoryDto | null>(null);

    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = useCallback(async () => {

        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/past-medical-history/${patientId}/${encounterId}`);
            const json = await safeApiJson<PastMedicalHistoryDto[]>(res);
            if (!res.ok) throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
            setItems(Array.isArray(json?.data) ? json.data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [patientId, encounterId]);

    useEffect(() => { load(); }, [load]);

    //useEffect(() => { load(); }, [patientId, encounterId]);

    function onSaved(saved: PastMedicalHistoryDto) {
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
        setAlert({ type: "success", msg: "PMH saved." });
        setTimeout(() => setAlert(null), 3500);
    }

    async function remove(id: number) {
        if (!confirm("Delete this PMH entry?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/past-medical-history/${patientId}/${encounterId}/${id}`, {
                method: "DELETE",
            });
            const json = await safeApiJson<void>(res);
            if (!res.ok || (json && json.success === false))
                throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
            setItems((p) => p.filter((x) => x.id !== id));
            setAlert({ type: "success", msg: "PMH deleted." });
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        }
        finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3500);
        }
    }

    // --- eSign with backend
    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/past-medical-history/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST" }
            );
            const json = await safeApiJson<unknown>(res);
            if (!res.ok || (json && json.success === false))
                throw new Error(json?.message || "eSign failed");
            setAlert({ type: "success", msg: "PMH entry e-signed." });
            await load();
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        }
        finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3500);
        }
    }

    // --- Print from backend PDF
    async function printFromBackend(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/past-medical-history/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error("Print failed");
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e: unknown) {
            window.alert(e instanceof Error ? e.message : "Unable to print");
        }
        finally {
            setBusyId(null);
        }
    }

    const sorted = useMemo(() => {
        return [...items].sort((a, b) => {
            const aKey = a.audit?.lastModifiedDate || a.audit?.createdDate || "";
            const bKey = b.audit?.lastModifiedDate || b.audit?.createdDate || "";
            return bKey.localeCompare(aKey);
        });
    }, [items]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Past Medical History (PMH)</h2>
                <button
                    onClick={() => { setEditing(null); setShowForm((s) => !s); }}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                    {showForm ? "Close" : "Add PMH"}
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
                <Pmhform
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
                <div className="rounded-xl border p-4 text-gray-600">No PMH entries yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((pmh) => (
                    <li key={pmh.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-gray-900 whitespace-pre-wrap">{pmh.description}</p>
                                <p className="text-xs text-gray-500">
                                    {pmh.audit?.createdDate && <>Created: {pmh.audit.createdDate}</>}
                                    {pmh.audit?.lastModifiedDate && <> · Updated: {pmh.audit.lastModifiedDate}</>}
                                </p>
                                {pmh.esigned && (
                                    <p className="text-xs text-gray-500">Signed — read only</p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {!pmh.esigned && (
                                    <>
                                        <button
                                            onClick={() => { setEditing(pmh); setShowForm(true); }}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => remove(pmh.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === pmh.id}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => esign(pmh.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === pmh.id}
                                        >
                                            eSign
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => printFromBackend(pmh.id!)}
                                    className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                    disabled={busyId === pmh.id}
                                >
                                    Print
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
