// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, ChiefComplaintDto } from "@/utils/types";
// import Chiefcomplaintform from "./Chiefcomplaintform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// function fmtDate(d?: string | number[]) {
//     if (!d) return "";
//     if (Array.isArray(d)) {
//         const [y, m, day, h = 0, min = 0] = d;
//         const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(day), Number(h), Number(min)));
//         return dt.toISOString().slice(0, 10);
//     }
//     return (d as string).slice(0, 10);
// }
//
// export default function Chiefcomplaintlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<ChiefComplaintDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<ChiefComplaintDto | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/chief-complaints/{patientId}/{encounterId}
//             const res = await fetchWithOrg(`/api/chief-complaints/${patientId}/${encounterId}`, {
//                 method: "GET",
//             });
//             const json = (await res.json()) as ApiResponse<ChiefComplaintDto[]>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
//             setItems(json.data || []);
//         } catch (e: unknown) {
//             alert(e instanceof Error ? e.message : "Something went wrong");
//
//     } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => {
//         load();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [patientId, encounterId]);
//
//     function onSaved(saved: ChiefComplaintDto) {
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
//         if (!confirm("Delete this complaint?")) return;
//         try {
//             const res = await fetchWithOrg(
//                 `/api/chief-complaints/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//             const json = (await res.json()) as ApiResponse<void>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
//             setItems((p) => p.filter((x) => x.id !== id));
//         }catch (e: unknown) {
//             alert(e instanceof Error ? e.message : "Something went wrong");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         return [...items].sort((a, b) => {
//             const d1 = fmtDate(a.updatedAt) || fmtDate(a.createdAt) || "";
//             const d2 = fmtDate(b.updatedAt) || fmtDate(b.createdAt) || "";
//             return d2.localeCompare(d1);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Chief Complaint</h2>
//                 <button
//                     onClick={() => {
//                         setEditing(null);
//                         setShowForm((s) => !s);
//                     }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add CC"}
//                 </button>
//             </div>
//
//             {showForm && (
//                 <Chiefcomplaintform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     editing={editing}
//                     onSaved={onSaved}
//                     onCancel={() => {
//                         setShowForm(false);
//                         setEditing(null);
//                     }}
//                 />
//             )}
//
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//             {!loading && !error && sorted.length === 0 && (
//                 <div className="rounded-xl border p-4 text-gray-600">No chief complaints yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((cc) => (
//                     <li key={cc.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="font-medium text-gray-900">{cc.complaint}</p>
//                                 {cc.details && <p className="text-gray-700 whitespace-pre-wrap">{cc.details}</p>}
//                                 <p className="text-xs text-gray-500">
//                                     {cc.createdAt && <>Created: {fmtDate(cc.createdAt)}</>}
//                                     {cc.updatedAt && <> · Updated: {fmtDate(cc.updatedAt)}</>}
//                                 </p>
//                             </div>
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={() => {
//                                         setEditing(cc);
//                                         setShowForm(true);
//                                     }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Edit
//                                 </button>
//                                 <button
//                                     onClick={() => remove(cc.id!)}
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
// import type { ApiResponse, ChiefComplaintDto } from "@/utils/types";
// import Chiefcomplaintform from "./Chiefcomplaintform";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
// };
//
// function fmtDate(d?: string | number[]) {
//     if (!d) return "";
//     if (Array.isArray(d)) {
//         const [y, m, day, h = 0, min = 0] = d;
//         const dt = new Date(
//             Date.UTC(Number(y), Number(m) - 1, Number(day), Number(h), Number(min))
//         );
//         return dt.toISOString().slice(0, 10);
//     }
//     return (d as string).slice(0, 10);
// }
//
// // Escape helper for print template
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) => ({
//         "&": "&amp;",
//         "<": "&lt;",
//         ">": "&gt;",
//         '"': "&quot;",
//         "'": "&#039;",
//     }[m]!));
// }
//
// export default function Chiefcomplaintlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<ChiefComplaintDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<ChiefComplaintDto | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busyId, setBusyId] = useState<number | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/chief-complaints/{patientId}/{encounterId}
//             const res = await fetchWithOrg(`/api/chief-complaints/${patientId}/${encounterId}`, {
//                 method: "GET",
//             });
//             const json = (await res.json()) as ApiResponse<ChiefComplaintDto[]>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
//             setItems(json.data || []);
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
//     function onSaved(saved: ChiefComplaintDto) {
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
//         setAlert({ type: "success", msg: "Chief complaint saved." });
//         setTimeout(() => setAlert(null), 3500);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this complaint?")) return;
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/chief-complaints/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//             const json = (await res.json()) as ApiResponse<void>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
//             setItems((p) => p.filter((x) => x.id !== id));
//             setAlert({ type: "success", msg: "Chief complaint deleted." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // --- eSign: adjust endpoint if your backend differs
//     async function esign(id: number) {
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/chief-complaints/${patientId}/${encounterId}/${id}/esign`,
//                 { method: "POST" }
//             );
//             let ok = res.ok;
//             try {
//                 const json = (await res.json()) as ApiResponse<unknown>;
//                 ok = ok && (json.success ?? true);
//             } catch {
//                 // non-JSON body; rely on res.ok
//             }
//             if (!ok) throw new Error("eSign failed");
//             setAlert({ type: "success", msg: "Chief complaint e-signed." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // --- Print: open a clean printable view
//     function printChiefComplaint(cc: ChiefComplaintDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//             const created = cc.createdAt ? `Created: ${fmtDate(cc.createdAt)}` : "";
//             const updated = cc.updatedAt ? ` · Updated: ${fmtDate(cc.updatedAt)}` : "";
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Chief Complaint #${cc.id ?? ""}</title>
// <style>
//   body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
//   h1 { font-size: 20px; margin: 0 0 8px; }
//   .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
//   .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
//   .row { margin: 6px 0; }
//   .muted { color: #111827; }
//   @media print { @page { margin: 12mm; } }
// </style>
// </head>
// <body>
//   <h1>Chief Complaint</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} · ID ${cc.id ?? ""} ${created}${updated}</div>
//   <div class="card">
//     ${cc.complaint ? `<div class="row"><strong>Complaint:</strong> ${escapeHtml(cc.complaint)}</div>` : ""}
//     ${cc.details ? `<div class="row"><strong>Details:</strong><br/>${escapeHtml(cc.details).replace(/\\n/g,"<br/>")}</div>` : ""}
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
//         return [...items].sort((a, b) => {
//             const d1 = fmtDate(a.updatedAt) || fmtDate(a.createdAt) || "";
//             const d2 = fmtDate(b.updatedAt) || fmtDate(b.createdAt) || "";
//             return d2.localeCompare(d1);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Chief Complaint</h2>
//                 <button
//                     onClick={() => {
//                         setEditing(null);
//                         setShowForm((s) => !s);
//                     }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add CC"}
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
//                 <Chiefcomplaintform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     editing={editing}
//                     onSaved={onSaved}
//                     onCancel={() => {
//                         setShowForm(false);
//                         setEditing(null);
//                     }}
//                 />
//             )}
//
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {error && <div className="text-red-600">{error}</div>}
//             {!loading && !error && sorted.length === 0 && (
//                 <div className="rounded-xl border p-4 text-gray-600">No chief complaints yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((cc) => (
//                     <li key={cc.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="font-medium text-gray-900">{cc.complaint}</p>
//                                 {cc.details && (
//                                     <p className="text-gray-700 whitespace-pre-wrap">{cc.details}</p>
//                                 )}
//                                 <p className="text-xs text-gray-500">
//                                     {cc.createdAt && <>Created: {fmtDate(cc.createdAt)}</>}
//                                     {cc.updatedAt && <> · Updated: {fmtDate(cc.updatedAt)}</>}
//                                 </p>
//                             </div>
//
//                             <div className="flex flex-wrap gap-2">
//                                 <button
//                                     onClick={() => {
//                                         setEditing(cc);
//                                         setShowForm(true);
//                                     }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                     aria-label="Edit complaint"
//                                 >
//                                     Edit
//                                 </button>
//
//                                 <button
//                                     onClick={() => remove(cc.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === cc.id}
//                                     aria-label="Delete complaint"
//                                 >
//                                     Delete
//                                 </button>
//
//                                 <button
//                                     onClick={() => esign(cc.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === cc.id}
//                                     aria-label="eSign complaint"
//                                     title="eSign"
//                                 >
//                                     eSign
//                                 </button>
//
//                                 <button
//                                     onClick={() => printChiefComplaint(cc)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === cc.id}
//                                     aria-label="Print complaint"
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

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, ChiefComplaintDto } from "@/utils/types";
import Chiefcomplaintform from "./Chiefcomplaintform";

type Props = { patientId: number; encounterId: number };

function fmtDate(d?: string | number[]) {
    if (!d) return "";
    if (Array.isArray(d)) {
        const [y, m, day, h = 0, min = 0] = d;
        const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(day), Number(h), Number(min)));
        return dt.toISOString().slice(0, 10);
    }
    return (d as string).slice(0, 10);
}

export default function Chiefcomplaintlist({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<ChiefComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ChiefComplaintDto | null>(null);
    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/chief-complaints/${patientId}/${encounterId}`);
            const json = (await res.json()) as ApiResponse<ChiefComplaintDto[]>;
            if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
            setItems(json.data || []);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Something went wrong");
            }
        }
        finally {
            setLoading(false);
        }
    }

   // useEffect(() => { void load(); }, [patientId, encounterId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void load(); }, [patientId, encounterId]);


    function onSaved(saved: ChiefComplaintDto) {
        setShowForm(false);
        setEditing(null);
        setItems((prev) => {
            const i = prev.findIndex((x) => x.id === saved.id);
            if (i >= 0) {
                const copy = [...prev]; copy[i] = saved; return copy;
            }
            return [saved, ...prev];
        });
        setAlert({ type: "success", msg: "Chief complaint saved." });
        setTimeout(() => setAlert(null), 3000);
    }

    async function remove(id: number) {
        if (!confirm("Delete this complaint?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/chief-complaints/${patientId}/${encounterId}/${id}`, { method: "DELETE" });
            const json = (await res.json()) as ApiResponse<void>;
            if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
            setItems((p) => p.filter((x) => x.id !== id));
            setAlert({ type: "success", msg: "Chief complaint deleted." });
        } catch (e: unknown) {
            setAlert({
                type: "error",
                msg: e instanceof Error ? e.message : "Something went wrong",
            });
        } finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3000);
        }
    }

    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/chief-complaints/${patientId}/${encounterId}/${id}/esign`, { method: "POST" });
            //const json = await res.json().catch(() => null) as ApiResponse<any> | null;
            const json = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;

            if (!res.ok || (json && json.success === false)) throw new Error(json?.message || "eSign failed");
            setAlert({ type: "success", msg: "Chief complaint e-signed." });
            await load();
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3000);
        }
    }

    async function printBackend(id: number) {
        try {
            const res = await fetchWithOrg(`/api/chief-complaints/${patientId}/${encounterId}/${id}/print`, {
                headers: { Accept: "application/pdf" }
            });
            if (!res.ok) throw new Error("Print failed");
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e: unknown) {
            window.alert(e instanceof Error ? e.message : "Unable to print");
        }
    }

    const sorted = useMemo(() => {
        return [...items].sort((a, b) => {
            const d1 = fmtDate(a.updatedAt) || fmtDate(a.createdAt) || "";
            const d2 = fmtDate(b.updatedAt) || fmtDate(b.createdAt) || "";
            return d2.localeCompare(d1);
        });
    }, [items]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Chief Complaint</h2>
                <button onClick={() => { setEditing(null); setShowForm((s) => !s); }}
                        className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700">
                    {showForm ? "Close" : "Add CC"}
                </button>
            </div>

            {alert && (
                <div className={`rounded-xl border px-4 py-2 text-sm ${alert.type === "success"
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-800"}`}>
                    {alert.msg}
                </div>
            )}

            {showForm && (
                <Chiefcomplaintform
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
                <div className="rounded-xl border p-4 text-gray-600">No chief complaints yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((cc) => (
                    <li key={cc.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-medium text-gray-900">{cc.complaint}</p>
                                {cc.details && <p className="text-gray-700 whitespace-pre-wrap">{cc.details}</p>}
                                <p className="text-xs text-gray-500">
                                    {cc.createdAt && <>Created: {fmtDate(cc.createdAt)}</>}
                                    {cc.updatedAt && <> · Updated: {fmtDate(cc.updatedAt)}</>}
                                </p>
                                {cc.esigned && <p className="text-xs text-gray-500 font-medium">Signed — read only</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {!cc.esigned && (
                                    <>
                                        <button onClick={() => { setEditing(cc); setShowForm(true); }}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Edit</button>
                                        <button onClick={() => remove(cc.id!)} disabled={busyId === cc.id}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">Delete</button>
                                        <button onClick={() => esign(cc.id!)} disabled={busyId === cc.id}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">eSign</button>
                                    </>
                                )}
                                <button onClick={() => printBackend(cc.id!)} disabled={busyId === cc.id}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">Print</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
