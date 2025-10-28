// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, PatientMedicalHistoryDto } from "@/utils/types";
// import PMhform from "./PMhform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// export default function Patientmhlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<PatientMedicalHistoryDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<PatientMedicalHistoryDto | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/patient-medical-history/{patientId}/{encounterId}
//             const res = await fetchWithOrg(`/api/patient-medical-history/${patientId}/${encounterId}`);
//             const json = (await res.json()) as ApiResponse<PatientMedicalHistoryDto[]>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
//             setItems(json.data || []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Error");
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { load(); /* eslint-disable react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     function onSaved(x: PatientMedicalHistoryDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems((prev) => {
//             const i = prev.findIndex((p) => p.id === x.id);
//             if (i >= 0) {
//                 const copy = [...prev]; copy[i] = x; return copy;
//             }
//             return [x, ...prev];
//         });
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this entry?")) return;
//         const res = await fetchWithOrg(`/api/patient-medical-history/${patientId}/${encounterId}/${id}`, { method: "DELETE" });
//         const json = (await res.json()) as ApiResponse<void>;
//         if (!res.ok || !json.success) { alert(json.message || "Delete failed"); return; }
//         setItems((p) => p.filter((i) => i.id !== id));
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
//                 <h3 className="text-lg font-semibold">Patient Medical History</h3>
//                 <button
//                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add History"}
//                 </button>
//             </div>
//
//             {showForm && (
//                 <PMhform
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
//             {!loading && !error && sorted.length === 0 && <div className="rounded-xl border p-4 text-gray-600">No history yet.</div>}
//
//             <ul className="space-y-3">
//                 {sorted.map((it) => (
//                     <li key={it.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="whitespace-pre-wrap text-gray-900">{it.description}</p>
//                                 <p className="text-xs text-gray-500">
//                                     {it.audit?.createdDate && <>Created: {it.audit.createdDate}</>}
//                                     {it.audit?.lastModifiedDate && <> · Updated: {it.audit.lastModifiedDate}</>}
//                                 </p>
//                             </div>
//                             <div className="flex gap-2">
//                                 <button onClick={() => { setEditing(it); setShowForm(true); }} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
//                                     Edit
//                                 </button>
//                                 <button onClick={() => remove(it.id!)} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
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
// import type { ApiResponse, PatientMedicalHistoryDto } from "@/utils/types";
// import PMhform from "./PMhform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// // ---- helpers
// async function safeApiJson<T>(res: Response): Promise<ApiResponse<T> | null> {
//     const text = await res.text().catch(() => "");
//     if (!text) return null;
//     try { return JSON.parse(text) as ApiResponse<T>; } catch { return null; }
// }
//
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) =>
//         ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!)
//     );
// }
//
// export default function Patientmhlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<PatientMedicalHistoryDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<PatientMedicalHistoryDto | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busyId, setBusyId] = useState<number | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/patient-medical-history/{patientId}/{encounterId}
//             const res = await fetchWithOrg(`/api/patient-medical-history/${patientId}/${encounterId}`);
//             const json = await safeApiJson<PatientMedicalHistoryDto[]>(res);
//             if (!res.ok) throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
//             if (!json?.success) throw new Error(json?.message || "Load failed");
//             setItems(json.data || []);
//         } catch (e: unknown) {
//             setError(e instanceof Error ? e.message : "Error");
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { load(); /* eslint-disable react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     function onSaved(x: PatientMedicalHistoryDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems((prev) => {
//             const i = prev.findIndex((p) => p.id === x.id);
//             if (i >= 0) { const copy = [...prev]; copy[i] = x; return copy; }
//             return [x, ...prev];
//         });
//         setAlert({ type: "success", msg: "History saved." });
//         setTimeout(() => setAlert(null), 3000);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this entry?")) return;
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/patient-medical-history/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//
//             if (res.status === 204) {
//                 setItems((p) => p.filter((i) => i.id !== id));
//                 setAlert({ type: "success", msg: "History deleted." });
//                 return;
//             }
//
//             const json = await safeApiJson<void>(res);
//             if (!res.ok || (json && json.success === false)) {
//                 throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
//             }
//
//             setItems((p) => p.filter((i) => i.id !== id));
//             setAlert({ type: "success", msg: "History deleted." });
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
//                 `/api/patient-medical-history/${patientId}/${encounterId}/${id}/esign`,
//                 { method: "POST" }
//             );
//             let ok = res.ok;
//             const json = await safeApiJson<unknown>(res);
//             if (json && json.success === false) ok = false;
//             if (!ok) throw new Error(json?.message || "eSign failed");
//             setAlert({ type: "success", msg: "History entry e-signed." });
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
//     function printHistory(it: PatientMedicalHistoryDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//
//             const created = it.audit?.createdDate ? `Created: ${it.audit.createdDate}` : "";
//             const updated = it.audit?.lastModifiedDate ? ` · Updated: ${it.audit.lastModifiedDate}` : "";
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Patient Medical History #${it.id ?? ""}</title>
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
//   <h1>Patient Medical History</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} · ID ${it.id ?? ""} ${created}${updated}</div>
//   <div class="card">
//     ${it.description ? `<div class="row"><strong>Description:</strong><br/>${escapeHtml(it.description).replace(/\n/g,"<br/>")}</div>` : ""}
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
//                 <h3 className="text-lg font-semibold">Patient Medical History</h3>
//                 <button
//                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add History"}
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
//                 <PMhform
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
//                 <div className="rounded-xl border p-4 text-gray-600">No history yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((it) => (
//                     <li key={it.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="whitespace-pre-wrap text-gray-900">{it.description}</p>
//                                 <p className="text-xs text-gray-500">
//                                     {it.audit?.createdDate && <>Created: {it.audit.createdDate}</>}
//                                     {it.audit?.lastModifiedDate && <> · Updated: {it.audit.lastModifiedDate}</>}
//                                 </p>
//                             </div>
//                             <div className="flex flex-wrap gap-2">
//                                 <button
//                                     onClick={() => { setEditing(it); setShowForm(true); }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Edit
//                                 </button>
//
//                                 <button
//                                     onClick={() => remove(it.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === it.id}
//                                 >
//                                     Delete
//                                 </button>
//
//                                 <button
//                                     onClick={() => esign(it.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === it.id}
//                                     title="eSign"
//                                 >
//                                     eSign
//                                 </button>
//
//                                 <button
//                                     onClick={() => printHistory(it)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === it.id}
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

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PatientMedicalHistoryDto } from "@/utils/types";
import PMhform from "./PMhform";

type Props = {
    patientId: number;
    encounterId: number;
};

// ---- helpers
async function safeJson<T>(res: Response): Promise<ApiResponse<T> | null> {
    const txt = await res.text().catch(() => "");
    if (!txt) return null;
    try {
        return JSON.parse(txt) as ApiResponse<T>;
    } catch {
        return null;
    }
}

export default function Patientmhlist({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<PatientMedicalHistoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PatientMedicalHistoryDto | null>(null);

    const [busyId, setBusyId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(
                `/api/patient-medical-history/${patientId}/${encounterId}`,
                { headers: { Accept: "application/json" } }
            );
            const json = await safeJson<PatientMedicalHistoryDto[]>(res);
            if (!res.ok || !json || json.success === false) {
                throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
            }
            setItems(json.data || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [patientId, encounterId]);

    useEffect(() => {
        void load();
    }, [load]);

    function onSaved(saved: PatientMedicalHistoryDto) {
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
        setToast({ type: "success", msg: "History saved." });
        setTimeout(() => setToast(null), 3000);
    }

    async function remove(id: number) {
        if (!confirm("Delete this entry?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/patient-medical-history/${patientId}/${encounterId}/${id}`,
                { method: "DELETE", headers: { Accept: "application/json" } }
            );

            if (res.status === 204) {
                setItems((p) => p.filter((x) => x.id !== id));
                setToast({ type: "success", msg: "History deleted." });
                return;
            }

            const json = await safeJson<void>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
            }

            setItems((p) => p.filter((x) => x.id !== id));
            setToast({ type: "success", msg: "History deleted." });
        } catch (e: unknown) {
            setToast({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setToast(null), 3000);
        }
    }

    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/patient-medical-history/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST", headers: { Accept: "application/json" } }
            );
            const json = await safeJson<unknown>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || "eSign failed");
            }
            setToast({ type: "success", msg: "History entry e-signed." });
            await load();
        } catch (e: unknown) {
            setToast({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setToast(null), 3000);
        }
    }

    async function printFromBackend(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/patient-medical-history/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error(`Print failed (HTTP ${res.status})`);
            const blob = await res.blob();
            if (!blob || blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (e: unknown) {
            window.alert(e instanceof Error ? e.message : "Unable to print");
        } finally {
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
                <h3 className="text-lg font-semibold">Patient Medical History</h3>
                <button
                    onClick={() => {
                        setEditing(null);
                        setShowForm((s) => !s);
                    }}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                    {showForm ? "Close" : "Add History"}
                </button>
            </div>

            {toast && (
                <div
                    className={`rounded-xl border px-4 py-2 text-sm ${
                        toast.type === "success"
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-red-300 bg-red-50 text-red-800"
                    }`}
                    role="status"
                >
                    {toast.msg}
                </div>
            )}

            {showForm && (
                <PMhform
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

            {loading && <div className="text-gray-600">Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && sorted.length === 0 && (
                <div className="rounded-xl border p-4 text-gray-600">No history yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((it) => {
                    const signed = Boolean(it.esigned || it.signedAt);
                    return (
                        <li key={it.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="whitespace-pre-wrap text-gray-900">{it.description}</p>
                                    <p className="text-xs text-gray-500">
                                        {it.audit?.createdDate && <>Created: {it.audit.createdDate}</>}
                                        {it.audit?.lastModifiedDate && <> · Updated: {it.audit.lastModifiedDate}</>}
                                    </p>
                                    {signed && <p className="text-xs text-gray-500 font-medium">Signed — read only</p>}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {!signed && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditing(it);
                                                    setShowForm(true);
                                                }}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => remove(it.id!)}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={busyId === it.id}
                                            >
                                                Delete
                                            </button>

                                            <button
                                                onClick={() => esign(it.id!)}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={busyId === it.id}
                                                title="eSign"
                                            >
                                                eSign
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => printFromBackend(it.id!)}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                        disabled={busyId === it.id}
                                        title="Print"
                                    >
                                        Print
                                    </button>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
