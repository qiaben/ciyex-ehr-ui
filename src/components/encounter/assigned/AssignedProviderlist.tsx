// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, AssignedProviderDto } from "@/utils/types";
// import AssignedProviderform from "./AssignedProviderform";
//
// type Props = { patientId: number; encounterId: number };
//
// export default function AssignedProviderlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<AssignedProviderDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<AssignedProviderDto | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/assigned-providers/{patientId}/{encounterId}
//             const res = await fetchWithOrg(`/api/assigned-providers/${patientId}/${encounterId}`);
//             const json = (await res.json()) as ApiResponse<AssignedProviderDto[]>;
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
//     function onSaved(saved: AssignedProviderDto) {
//         setShowForm(false);
//         setEditing(null);
//         setItems((prev) => {
//             const i = prev.findIndex((x) => x.id === saved.id);
//             if (i >= 0) {
//                 const copy = [...prev]; copy[i] = saved; return copy;
//             }
//             return [saved, ...prev];
//         });
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Remove this assignment?")) return;
//         try {
//             const res = await fetchWithOrg(`/api/assigned-providers/${patientId}/${encounterId}/${id}`, { method: "DELETE" });
//             const json = (await res.json()) as ApiResponse<void>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
//             setItems((p) => p.filter((x) => x.id !== id));
//         } catch (e: unknown) {
//             alert(e instanceof Error ? e.message : "Something went wrong");
//         }
//     }
//
//     const sorted = useMemo(() => {
//         // Show Primary & Attending first, then others by lastModified/created
//         const rank: Record<string, number> = { Primary: 0, Attending: 1, Consultant: 2, Nurse: 3, Scribe: 4, Other: 5 };
//         return [...items].sort((a, b) => {
//             const r = (rank[a.role] ?? 9) - (rank[b.role] ?? 9);
//             if (r !== 0) return r;
//             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || a.startDate || "";
//             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || b.startDate || "";
//             return d2.localeCompare(d1);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Assigned Provider(s)</h2>
//                 <button
//                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Assign Provider"}
//                 </button>
//             </div>
//
//             {showForm && (
//                 <AssignedProviderform
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
//                 <div className="rounded-xl border p-4 text-gray-600">No providers assigned yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((ap) => (
//                     <li key={ap.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="font-medium text-gray-900">
//                                     {ap.providerName ? `${ap.providerName}` : `Provider #${ap.providerId}`} · {ap.role}
//                                 </p>
//                                 <p className="text-sm text-gray-700">
//                                     {ap.startDate ? `Start: ${ap.startDate}` : ""}
//                                     {ap.endDate ? ` · End: ${ap.endDate}` : ""}
//                                 </p>
//                                 {ap.notes && <p className="text-gray-800 whitespace-pre-wrap">{ap.notes}</p>}
//                                 <p className="text-xs text-gray-500">
//                                     {ap.audit?.createdDate && <>Created: {ap.audit.createdDate}</>}
//                                     {ap.audit?.lastModifiedDate && <> · Updated: {ap.audit.lastModifiedDate}</>}
//                                 </p>
//                             </div>
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={() => { setEditing(ap); setShowForm(true); }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Edit
//                                 </button>
//                                 <button
//                                     onClick={() => remove(ap.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Remove
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
// import type { ApiResponse, AssignedProviderDto } from "@/utils/types";
// import AssignedProviderform from "./AssignedProviderform";
//
// type Props = { patientId: number; encounterId: number };
//
// export default function AssignedProviderlist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<AssignedProviderDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<AssignedProviderDto | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busyId, setBusyId] = useState<number | null>(null); // disable buttons during actions
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             // GET /api/assigned-providers/{patientId}/{encounterId}
//             const res = await fetchWithOrg(`/api/assigned-providers/${patientId}/${encounterId}`);
//             const json = (await res.json()) as ApiResponse<AssignedProviderDto[]>;
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
//         load(); // eslint-disable-line react-hooks/exhaustive-deps
//     }, [patientId, encounterId]);
//
//     function onSaved(saved: AssignedProviderDto) {
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
//         setAlert({ type: "success", msg: "Assignment saved." });
//         setTimeout(() => setAlert(null), 3500);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Remove this assignment?")) return;
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/assigned-providers/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//             const json = (await res.json()) as ApiResponse<void>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
//             setItems((p) => p.filter((x) => x.id !== id));
//             setAlert({ type: "success", msg: "Assignment removed." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // ---- eSign: adjust endpoint if your backend differs
//     async function esign(id: number) {
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/assigned-providers/${patientId}/${encounterId}/${id}/esign`,
//                 { method: "POST" }
//             );
//
//             // If API returns JSON {success,message}, use it; otherwise only rely on res.ok
//             let ok = res.ok;
//             try {
//                 const json = (await res.json()) as ApiResponse<unknown>;
//                 ok = ok && (json.success ?? true);
//             } catch {
//                 // non-JSON body
//             }
//             if (!ok) throw new Error("eSign failed");
//             setAlert({ type: "success", msg: "Assignment e-signed." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3500);
//         }
//     }
//
//     // ---- Print: simple printable view
//     function printAssignedProvider(ap: AssignedProviderDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//
//             const created = ap.audit?.createdDate ? `Created: ${ap.audit.createdDate}` : "";
//             const updated = ap.audit?.lastModifiedDate ? ` · Updated: ${ap.audit.lastModifiedDate}` : "";
//             const provLabel = ap.providerName || `Provider #${ap.providerId}`;
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Assigned Provider #${ap.id ?? ""}</title>
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
//   <h1>Assigned Provider</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} · ID ${ap.id ?? ""} ${created}${updated}</div>
//   <div class="card">
//     <div class="row"><strong>Provider:</strong> ${escapeHtml(provLabel)}</div>
//     <div class="row"><strong>Role:</strong> ${escapeHtml(ap.role || "—")}</div>
//     ${ap.startDate ? `<div class="row"><strong>Start:</strong> ${ap.startDate}</div>` : ""}
//     ${ap.endDate ? `<div class="row"><strong>End:</strong> ${ap.endDate}</div>` : ""}
//     ${ap.notes ? `<div class="row"><strong>Notes:</strong><br/>${escapeHtml(ap.notes).replace(/\\n/g,"<br/>")}</div>` : ""}
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
//     // sort Primary & Attending first, then by last modified/created/start
//     const sorted = useMemo(() => {
//         const rank: Record<string, number> = {
//             Primary: 0,
//             Attending: 1,
//             Consultant: 2,
//             Nurse: 3,
//             Scribe: 4,
//             Other: 5
//         };
//         return [...items].sort((a, b) => {
//             const r = (rank[a.role] ?? 9) - (rank[b.role] ?? 9);
//             if (r !== 0) return r;
//             const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || a.startDate || "";
//             const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || b.startDate || "";
//             return d2.localeCompare(d1);
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Assigned Provider(s)</h2>
//                 <button
//                     onClick={() => {
//                         setEditing(null);
//                         setShowForm((s) => !s);
//                     }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Assign Provider"}
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
//                 <AssignedProviderform
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
//                 <div className="rounded-xl border p-4 text-gray-600">No providers assigned yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((ap) => (
//                     <li key={ap.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="font-medium text-gray-900">
//                                     {ap.providerName ? `${ap.providerName}` : `Provider #${ap.providerId}`} · {ap.role}
//                                 </p>
//                                 <p className="text-sm text-gray-700">
//                                     {ap.startDate ? `Start: ${ap.startDate}` : ""}
//                                     {ap.endDate ? ` · End: ${ap.endDate}` : ""}
//                                 </p>
//                                 {ap.notes && <p className="text-gray-800 whitespace-pre-wrap">{ap.notes}</p>}
//                                 <p className="text-xs text-gray-500">
//                                     {ap.audit?.createdDate && <>Created: {ap.audit.createdDate}</>}
//                                     {ap.audit?.lastModifiedDate && <> · Updated: {ap.audit.lastModifiedDate}</>}
//                                 </p>
//                             </div>
//
//                             <div className="flex flex-wrap gap-2">
//                                 <button
//                                     onClick={() => {
//                                         setEditing(ap);
//                                         setShowForm(true);
//                                     }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                     aria-label="Edit assignment"
//                                 >
//                                     Edit
//                                 </button>
//
//                                 <button
//                                     onClick={() => remove(ap.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === ap.id}
//                                     aria-label="Remove assignment"
//                                 >
//                                     Remove
//                                 </button>
//
//                                 <button
//                                     onClick={() => esign(ap.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === ap.id}
//                                     aria-label="eSign assignment"
//                                     title="eSign"
//                                 >
//                                     eSign
//                                 </button>
//
//                                 <button
//                                     onClick={() => printAssignedProvider(ap)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === ap.id}
//                                     aria-label="Print assignment"
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
//
// // Local helper for print template (also used inside the new window)
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!));
// }






"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, AssignedProviderDto } from "@/utils/types";
import AssignedProviderform from "./AssignedProviderform";

type Props = { patientId: number; encounterId: number };

export default function AssignedProviderlist({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<AssignedProviderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<AssignedProviderDto | null>(null);

    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/assigned-providers/${patientId}/${encounterId}`);
            const json = (await res.json()) as ApiResponse<AssignedProviderDto[]>;
            if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
            setItems(json.data || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

   // useEffect(() => { load(); }, [patientId, encounterId]);
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchWithOrg(`/api/assigned-providers/${patientId}/${encounterId}`);
                const json = (await res.json()) as ApiResponse<AssignedProviderDto[]>;
                if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
                setItems(json.data || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId, encounterId]);

    function onSaved(saved: AssignedProviderDto) {
        setShowForm(false);
        setEditing(null);
        setItems((prev) => {
            const i = prev.findIndex((x) => x.id === saved.id);
            if (i >= 0) {
                const copy = [...prev]; copy[i] = saved; return copy;
            }
            return [saved, ...prev];
        });
        setAlert({ type: "success", msg: "Assignment saved." });
        setTimeout(() => setAlert(null), 3500);
    }

    async function remove(id: number) {
        if (!confirm("Remove this assignment?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/assigned-providers/${patientId}/${encounterId}/${id}`, { method: "DELETE" });
            const json = (await res.json()) as ApiResponse<void>;
            if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
            setItems((p) => p.filter((x) => x.id !== id));
            setAlert({ type: "success", msg: "Assignment removed." });
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3500);
        }
    }

    // ✅ Backend eSign
    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/assigned-providers/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST" }
            );
            let ok = res.ok;
            try {
                const json = (await res.json()) as ApiResponse<unknown>;
                ok = ok && (json.success ?? true);
            } catch {}
            if (!ok) throw new Error("eSign failed");
            setAlert({ type: "success", msg: "Assignment e-signed." });
            await load();
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 3500);
        }
    }

    // ✅ Backend print
    async function printFromBackend(id: number) {
        try {
            const res = await fetchWithOrg(
                `/api/assigned-providers/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error("Print failed");
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e) {
            window.alert(e instanceof Error ? e.message : "Unable to print");
        }
    }

    const sorted = useMemo(() => {
        const rank: Record<string, number> = { Primary: 0, Attending: 1, Consultant: 2, Nurse: 3, Scribe: 4, Other: 5 };
        return [...items].sort((a, b) => {
            const r = (rank[a.role] ?? 9) - (rank[b.role] ?? 9);
            if (r !== 0) return r;
            const d1 = a.audit?.lastModifiedDate || a.audit?.createdDate || a.startDate || "";
            const d2 = b.audit?.lastModifiedDate || b.audit?.createdDate || b.startDate || "";
            return d2.localeCompare(d1);
        });
    }, [items]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Assigned Provider(s)</h2>
                <button
                    onClick={() => { setEditing(null); setShowForm((s) => !s); }}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                    {showForm ? "Close" : "Assign Provider"}
                </button>
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

            {showForm && (
                <AssignedProviderform
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
                <div className="rounded-xl border p-4 text-gray-600">No providers assigned yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((ap) => (
                    <li key={ap.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-medium text-gray-900">
                                    {ap.providerName ? `${ap.providerName}` : `Provider #${ap.providerId}`} · {ap.role}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {ap.startDate ? `Start: ${ap.startDate}` : ""}
                                    {ap.endDate ? ` · End: ${ap.endDate}` : ""}
                                </p>
                                {ap.notes && <p className="text-gray-800 whitespace-pre-wrap">{ap.notes}</p>}
                                <p className="text-xs text-gray-500">
                                    {ap.audit?.createdDate && <>Created: {ap.audit.createdDate}</>}
                                    {ap.audit?.lastModifiedDate && <> · Updated: {ap.audit.lastModifiedDate}</>}
                                </p>
                                {ap.esigned && (
                                    <p className="text-xs text-gray-500 font-medium">Signed — read only</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {!ap.esigned && (
                                    <>
                                        <button
                                            onClick={() => { setEditing(ap); setShowForm(true); }}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => remove(ap.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === ap.id}
                                        >
                                            Remove
                                        </button>
                                        <button
                                            onClick={() => esign(ap.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === ap.id}
                                        >
                                            eSign
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => printFromBackend(ap.id!)}
                                    className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                    disabled={busyId === ap.id}
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
