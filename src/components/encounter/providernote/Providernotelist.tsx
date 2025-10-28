//
//
// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, ProviderNoteDto } from "@/utils/types";
// import Providernoteform from "./Providernoteform";
//
// type Props = { patientId: number; encounterId: number };
//
// // safely parse JSON (DELETE or empty bodies can be 204/empty)
// async function safeJson<T>(res: Response): Promise<T | null> {
//     const text = await res.text().catch(() => "");
//     if (!text) return null;
//     try { return JSON.parse(text) as T; } catch { return null; }
// }
//
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) =>
//         ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!)
//     );
// }
//
// export default function Providernotelist({ patientId, encounterId }: Props) {
//     const [items, setItems] = useState<ProviderNoteDto[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [showForm, setShowForm] = useState(false);
//     const [editing, setEditing] = useState<ProviderNoteDto | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busyId, setBusyId] = useState<number | null>(null);
//
//     async function load() {
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetchWithOrg(`/api/provider-notes/${patientId}/${encounterId}`);
//             const json = await safeJson<ApiResponse<ProviderNoteDto[]>>(res);
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
//     useEffect(() => {
//         load(); // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [patientId, encounterId]);
//
//     function onSaved(saved: ProviderNoteDto) {
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
//         setAlert({ type: "success", msg: "Note saved." });
//         setTimeout(() => setAlert(null), 3000);
//     }
//
//     async function remove(id: number) {
//         if (!confirm("Delete this provider note?")) return;
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/provider-notes/${patientId}/${encounterId}/${id}`,
//                 { method: "DELETE" }
//             );
//             if (res.status === 204) {
//                 setItems((p) => p.filter((x) => x.id !== id));
//                 setAlert({ type: "success", msg: "Note deleted." });
//                 return;
//             }
//             const json = await safeJson<ApiResponse<void>>(res);
//             if (!res.ok || (json && json.success === false)) {
//                 throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
//             }
//             setItems((p) => p.filter((x) => x.id !== id));
//             setAlert({ type: "success", msg: "Note deleted." });
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3000);
//         }
//     }
//
//     // ---- eSign (adjust endpoint if your backend differs)
//     async function esign(id: number) {
//         try {
//             setBusyId(id);
//             const res = await fetchWithOrg(
//                 `/api/provider-notes/${patientId}/${encounterId}/${id}/esign`,
//                 { method: "POST" }
//             );
//             let ok = res.ok;
//             const json = await safeJson<ApiResponse<unknown>>(res);
//             if (json && json.success === false) ok = false;
//             if (!ok) throw new Error(json?.message || "eSign failed");
//             setAlert({ type: "success", msg: "Note e-signed." });
//             await load(); // reflect any signature fields
//         } catch (e: unknown) {
//             setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
//         } finally {
//             setBusyId(null);
//             setTimeout(() => setAlert(null), 3000);
//         }
//     }
//
//     // ---- Print: opens a clean printable view for the selected note
//     function printNote(n: ProviderNoteDto) {
//         try {
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//
//             const created = (n as any)?.audit?.createdDate ? `Created: ${(n as any).audit.createdDate}` : "";
//             const updated = (n as any)?.audit?.lastModifiedDate ? ` · Updated: ${(n as any).audit.lastModifiedDate}` : "";
//
//             const blocks: string[] = [];
//             if (n.subjective) blocks.push(`<div class="row"><strong>S (Subjective):</strong><br/>${escapeHtml(n.subjective).replace(/\n/g,"<br/>")}</div>`);
//             if (n.objective) blocks.push(`<div class="row"><strong>O (Objective):</strong><br/>${escapeHtml(n.objective).replace(/\n/g,"<br/>")}</div>`);
//             if (n.assessment) blocks.push(`<div class="row"><strong>A (Assessment):</strong><br/>${escapeHtml(n.assessment).replace(/\n/g,"<br/>")}</div>`);
//             if (n.plan) blocks.push(`<div class="row"><strong>P (Plan):</strong><br/>${escapeHtml(n.plan).replace(/\n/g,"<br/>")}</div>`);
//             if (n.narrative) blocks.push(`<div class="row"><strong>Narrative:</strong><br/>${escapeHtml(n.narrative).replace(/\n/g,"<br/>")}</div>`);
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Provider Note #${n.id ?? ""}</title>
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
//   <h1>Provider Note</h1>
//   <div class="meta">
//     Patient #${patientId} · Encounter #${encounterId} · ID ${n.id ?? ""} ${created}${updated}
//   </div>
//   <div class="card">
//     <div class="row"><strong>Title:</strong> ${escapeHtml(n.noteTitle || "Provider Note")}</div>
//     <div class="row"><strong>Status:</strong> ${escapeHtml(n.noteStatus || "draft")}</div>
//     <div class="row"><strong>Type:</strong> ${escapeHtml(n.noteTypeCode || "—")}</div>
//     ${n.noteDateTime ? `<div class="row"><strong>Date/Time:</strong> ${escapeHtml(n.noteDateTime)}</div>` : ""}
//     ${n.authorPractitionerId ? `<div class="row"><strong>Author:</strong> ${escapeHtml(String(n.authorPractitionerId))}</div>` : ""}
//     ${blocks.join("\n")}
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
//         // newest first by updated/created
//         return [...items].sort((a, b) => {
//             const d1 = (a as any)?.audit?.lastModifiedDate || (a as any)?.audit?.createdDate || "";
//             const d2 = (b as any)?.audit?.lastModifiedDate || (b as any)?.audit?.createdDate || "";
//             return String(d2).localeCompare(String(d1));
//         });
//     }, [items]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Provider Notes</h2>
//                 <button
//                     onClick={() => { setEditing(null); setShowForm((s) => !s); }}
//                     className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                 >
//                     {showForm ? "Close" : "Add Note"}
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
//                 <Providernoteform
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
//                 <div className="rounded-xl border p-4 text-gray-600">No provider notes yet.</div>
//             )}
//
//             <ul className="space-y-3">
//                 {sorted.map((note) => (
//                     <li key={note.id} className="rounded-2xl border p-4 bg-white shadow-sm">
//                         <div className="flex items-start justify-between gap-4">
//                             <div className="space-y-1">
//                                 <p className="font-medium text-gray-900">
//                                     {note.noteTitle || "Provider Note"} · {note.noteStatus || "draft"}
//                                 </p>
//                                 <div className="text-sm text-gray-600">
//                                     <span>Type: {note.noteTypeCode || "—"}</span>
//                                     {note.noteDateTime && <span> · At: {note.noteDateTime}</span>}
//                                     {note.authorPractitionerId && <span> · Author: {note.authorPractitionerId}</span>}
//                                 </div>
//
//                                 {/* Show SOAP blocks if present */}
//                                 {note.subjective && (
//                                     <p className="text-gray-800 whitespace-pre-wrap">
//                                         <span className="font-semibold">S:</span> {note.subjective}
//                                     </p>
//                                 )}
//                                 {note.objective && (
//                                     <p className="text-gray-800 whitespace-pre-wrap">
//                                         <span className="font-semibold">O:</span> {note.objective}
//                                     </p>
//                                 )}
//                                 {note.assessment && (
//                                     <p className="text-gray-800 whitespace-pre-wrap">
//                                         <span className="font-semibold">A:</span> {note.assessment}
//                                     </p>
//                                 )}
//                                 {note.plan && (
//                                     <p className="text-gray-800 whitespace-pre-wrap">
//                                         <span className="font-semibold">P:</span> {note.plan}
//                                     </p>
//                                 )}
//                                 {note.narrative && (
//                                     <p className="text-gray-800 whitespace-pre-wrap">
//                                         <span className="font-semibold">Narrative:</span> {note.narrative}
//                                     </p>
//                                 )}
//
//                                 <p className="text-xs text-gray-500">
//                                     {(note as any)?.audit?.createdDate && <>Created: {(note as any).audit.createdDate}</>}
//                                     {(note as any)?.audit?.lastModifiedDate && <> · Updated: {(note as any).audit.lastModifiedDate}</>}
//                                 </p>
//                             </div>
//
//                             <div className="flex flex-wrap gap-2">
//                                 <button
//                                     onClick={() => { setEditing(note); setShowForm(true); }}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                                 >
//                                     Edit
//                                 </button>
//
//                                 <button
//                                     onClick={() => remove(note.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === note.id}
//                                 >
//                                     Delete
//                                 </button>
//
//                                 <button
//                                     onClick={() => esign(note.id!)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === note.id}
//                                     title="eSign"
//                                 >
//                                     eSign
//                                 </button>
//
//                                 <button
//                                     onClick={() => printNote(note)}
//                                     className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
//                                     disabled={busyId === note.id}
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







// src/components/encounter/providernote/Providernotelist.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, ProviderNoteDto } from "@/utils/types";
import Providernoteform from "./Providernoteform";

type Props = { patientId: number; encounterId: number };

// Safely parse JSON (DELETE/204 empty bodies won't have JSON)
async function safeJson<T>(res: Response): Promise<T | null> {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

export default function Providernotelist({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<ProviderNoteDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ProviderNoteDto | null>(null);

    // UI feedback + disable buttons during calls
    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/provider-notes/${patientId}/${encounterId}`);
            const json = (await res.json()) as ApiResponse<ProviderNoteDto[]>;
            if (!res.ok || !json.success) throw new Error(json.message || "Load failed");
            setItems(json.data || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, encounterId]);

    function onSaved(saved: ProviderNoteDto) {
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
        setAlert({ type: "success", msg: "Note saved." });
        setTimeout(() => setAlert(null), 2500);
    }

    async function remove(id: number) {
        if (!confirm("Delete this provider note?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/provider-notes/${patientId}/${encounterId}/${id}`, {
                method: "DELETE",
            });
            const json = await safeJson<ApiResponse<void>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
            }
            setItems((p) => p.filter((x) => x.id !== id));
            setAlert({ type: "success", msg: "Note deleted." });
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 2500);
        }
    }

    // ---- eSign a note (reload after success)
    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/provider-notes/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST" }
            );
            const json = await safeJson<ApiResponse<unknown>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || "eSign failed");
            }
            setAlert({ type: "success", msg: "Note e-signed." });
            await load(); // refresh to reflect signed fields
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        } finally {
            setBusyId(null);
            setTimeout(() => setAlert(null), 2500);
        }
    }

    // ---- Print via backend PDF endpoint (fresh tab)
    async function printNote(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/provider-notes/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error(`Print failed (HTTP ${res.status})`);
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Empty PDF received");
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
            return String(d2).localeCompare(String(d1));
        });
    }, [items]);



    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Provider Notes</h2>
                <button
                    onClick={() => {
                        setEditing(null);
                        setShowForm((s) => !s);
                    }}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                    {showForm ? "Close" : "Add Note"}
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
                <Providernoteform
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
                <div className="rounded-xl border p-4 text-gray-600">No provider notes yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((note) => (
                    <li key={note.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-medium text-gray-900">
                                    {note.noteTitle || "Provider Note"} · {note.noteStatus || "draft"}
                                </p>
                                <div className="text-sm text-gray-600">
                                    <span>Type: {note.noteTypeCode || "—"}</span>
                                    {note.noteDateTime && <span> · At: {note.noteDateTime}</span>}
                                    {note.authorPractitionerId && <span> · Author: {note.authorPractitionerId}</span>}
                                </div>

                                {/* SOAP blocks if present */}
                                {note.subjective && (
                                    <p className="text-gray-800 whitespace-pre-wrap">
                                        <span className="font-semibold">S:</span> {note.subjective}
                                    </p>
                                )}
                                {note.objective && (
                                    <p className="text-gray-800 whitespace-pre-wrap">
                                        <span className="font-semibold">O:</span> {note.objective}
                                    </p>
                                )}
                                {note.assessment && (
                                    <p className="text-gray-800 whitespace-pre-wrap">
                                        <span className="font-semibold">A:</span> {note.assessment}
                                    </p>
                                )}
                                {note.plan && (
                                    <p className="text-gray-800 whitespace-pre-wrap">
                                        <span className="font-semibold">P:</span> {note.plan}
                                    </p>
                                )}
                                {note.narrative && (
                                    <p className="text-gray-800 whitespace-pre-wrap">
                                        <span className="font-semibold">Narrative:</span> {note.narrative}
                                    </p>
                                )}

                                <p className="text-xs text-gray-500">
                                    {note.audit?.createdDate && <>Created: {note.audit.createdDate}</>}
                                    {note.audit?.lastModifiedDate && <> · Updated: {note.audit.lastModifiedDate}</>}
                                </p>


                                {note.esigned && (
                                    <p className="text-xs text-gray-500 font-medium">Signed — read only</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {/* Hide Edit/Delete/eSign once the note is signed */}
                                {!note.esigned && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditing(note);
                                                setShowForm(true);
                                            }}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => remove(note.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === note.id}
                                        >
                                            Delete
                                        </button>

                                        <button
                                            onClick={() => esign(note.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === note.id}
                                            title="eSign"
                                        >
                                            eSign
                                        </button>
                                    </>
                                )}

                                {/* Print always available */}
                                <button
                                    onClick={() => printNote(note.id!)}
                                    className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                    disabled={busyId === note.id}
                                    title="Print"
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
