//
//
//
// // src/components/encounter/signoff/Signoffcard.tsx
// "use client";
//
// import { useEffect, useMemo, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, SignoffDto } from "@/utils/types";
// import Signoffform from "./Signoffform";
//
// type Props = { patientId: number; encounterId: number };
//
// /** Safe text→JSON (handles 204/empty/non-JSON bodies) */
// async function safeJson<T>(res: Response): Promise<T | null> {
//     const t = await res.text().catch(() => "");
//     if (!t) return null;
//     try { return JSON.parse(t) as T; } catch { return null; }
// }
//
// /** Choose the latest signoff from an array */
// function pickLatest(arr: any[]): SignoffDto | null {
//     if (!Array.isArray(arr) || arr.length === 0) return null;
//     const sorted = [...arr].sort((a, b) => {
//         const da = a?.audit?.lastModifiedDate || a?.audit?.createdDate || "";
//         const db = b?.audit?.lastModifiedDate || b?.audit?.createdDate || "";
//         if (db && da) {
//             const cmp = String(db).localeCompare(String(da));
//             if (cmp !== 0) return cmp; // newest first
//         }
//         // fallback by id desc
//         return (Number(b?.id) || 0) - (Number(a?.id) || 0);
//     });
//     return (sorted[0] ?? null) as SignoffDto | null;
// }
//
// /** Normalize API data (object | array) → single SignoffDto | null */
// function normalizeSignoff(data: unknown): SignoffDto | null {
//     if (Array.isArray(data)) return pickLatest(data);
//     return (data ?? null) as SignoffDto | null;
// }
//
// /** GET helper that never sends a body even if fetchWithOrg has quirks */
// async function safeGet(url: string, headers: HeadersInit) {
//     try {
//         return await fetchWithOrg(url, { method: "GET", headers });
//     } catch {
//         return await fetch(url, { method: "GET", headers });
//     }
// }
//
// // Escape for print HTML
// function escapeHtml(s: string) {
//     return String(s).replace(/[&<>"']/g, (m) =>
//         ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!)
//     );
// }
//
// export default function Signoffcard({ patientId, encounterId }: Props) {
//     const [item, setItem] = useState<SignoffDto | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [err, setErr] = useState<string | null>(null);
//
//     // UI feedback
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [busy, setBusy] = useState(false);
//     const [showForm, setShowForm] = useState(false);
//
//     async function load() {
//         setLoading(true);
//         setErr(null);
//         try {
//             // GET existing signoff(s) — NO body
//             const res = await safeGet(
//                 `/api/signoffs/${patientId}/${encounterId}`,
//                 { Accept: "application/json" }
//             );
//             const json = await safeJson<ApiResponse<SignoffDto | SignoffDto[]>>(res);
//
//             if (res.ok && json?.success) {
//                 const current = normalizeSignoff(json.data);
//                 if (current) {
//                     setItem(current);
//                     setShowForm(false);
//                     return;
//                 }
//             }
//
//             // If none exists, create one (keeps UX consistent with your previous behavior)
//             const createRes = await fetchWithOrg(
//                 `/api/signoffs/${patientId}/${encounterId}`,
//                 {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json", Accept: "application/json" },
//                     body: JSON.stringify({ patientId, encounterId }),
//                 }
//             );
//             const created = await safeJson<ApiResponse<SignoffDto>>(createRes);
//             if (!createRes.ok || !created?.success) {
//                 throw new Error(created?.message || `Create failed (${createRes.status})`);
//             }
//             setItem(created.data ?? null);
//             setShowForm(false);
//         } catch (e: any) {
//             setErr(e?.message ?? "Something went wrong");
//             setItem(null);
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => { void load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);
//
//     // ---- Actions
//     async function remove() {
//         if (!item?.id) return;
//         if (!confirm("Delete this sign-off?")) return;
//         try {
//             setBusy(true);
//             const res = await fetchWithOrg(
//                 `/api/signoffs/${patientId}/${encounterId}/${item.id}`,
//                 { method: "DELETE" }
//             );
//
//             if (res.status === 204) {
//                 setItem(null);
//                 setShowForm(true);
//                 setAlert({ type: "success", msg: "Sign-off deleted." });
//                 return;
//             }
//
//             const json = await safeJson<ApiResponse<void>>(res);
//             if (!res.ok || (json && (json as any).success === false)) {
//                 throw new Error((json as any)?.message || `Delete failed (${res.status})`);
//             }
//             setItem(null);
//             setShowForm(true);
//             setAlert({ type: "success", msg: "Sign-off deleted." });
//         } catch (e: any) {
//             setAlert({ type: "error", msg: e?.message ?? "Something went wrong" });
//         } finally {
//             setBusy(false);
//             setTimeout(() => setAlert(null), 3000);
//         }
//     }
//
//     // eSign current signoff (adjust endpoint if your backend differs)
//     async function esign() {
//         if (!item?.id) return;
//         try {
//             setBusy(true);
//             const res = await fetchWithOrg(
//                 `/api/signoffs/${patientId}/${encounterId}/${item.id}/esign`,
//                 { method: "POST" }
//             );
//             let ok = res.ok;
//             const json = await safeJson<ApiResponse<SignoffDto | unknown>>(res);
//             if (json && (json as any).success === false) ok = false;
//             if (!ok) throw new Error((json as any)?.message || "eSign failed");
//
//             setAlert({ type: "success", msg: "Sign-off e-signed." });
//             await load(); // refresh to reflect signature/lock fields
//         } catch (e: any) {
//             setAlert({ type: "error", msg: e?.message ?? "Something went wrong" });
//         } finally {
//             setBusy(false);
//             setTimeout(() => setAlert(null), 3000);
//         }
//     }
//
//     // Print a clean sign-off view
//     function printSignoff(sig: SignoffDto) {
//         try {
//             const s: any = sig as any;
//             const win = window.open("", "_blank", "noopener,noreferrer");
//             if (!win) throw new Error("Popup blocked. Please allow popups to print.");
//
//             const created = s.audit?.createdDate ? `Created: ${s.audit.createdDate}` : "";
//             const updated = s.audit?.lastModifiedDate ? ` · Updated: ${s.audit.lastModifiedDate}` : "";
//
//             const cosigners = Array.isArray(s.cosigners) ? String(s.cosigners.join(", ")) : s.cosignedBy;
//             const finalizedAt = s.finalizedAt || s.lockedAt;
//
//             win.document.write(`<!doctype html>
// <html>
// <head>
// <meta charset="utf-8" />
// <title>Sign-off</title>
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
//   <h1>Sign-off / Finalization</h1>
//   <div class="meta">Patient #${patientId} · Encounter #${encounterId} ${created}${updated}</div>
//   <div class="card">
//     <div class="row"><strong>Status:</strong> ${escapeHtml(s.status || "Draft")}</div>
//     ${s.signedBy ? `<div class="row"><strong>Signed By:</strong> ${escapeHtml(String(s.signedBy))}</div>` : ""}
//     ${s.signedAt ? `<div class="row"><strong>Signed At:</strong> ${escapeHtml(String(s.signedAt))}</div>` : ""}
//     ${cosigners ? `<div class="row"><strong>Co-signers:</strong> ${escapeHtml(String(cosigners))}</div>` : ""}
//     ${s.cosignedAt ? `<div class="row"><strong>Co-signed At:</strong> ${escapeHtml(String(s.cosignedAt))}</div>` : ""}
//     ${finalizedAt ? `<div class="row"><strong>Finalized/Locked At:</strong> ${escapeHtml(String(finalizedAt))}</div>` : ""}
//     ${s.comments ? `<div class="row"><strong>Comments:</strong><br/>${escapeHtml(String(s.comments)).replace(/\\n/g,"<br/>")}</div>` : ""}
//   </div>
//   <script>window.onload = () => { window.print(); };</script>
// </body>
// </html>`);
//             win.document.close();
//         } catch (e: any) {
//             window.alert(e?.message ?? "Unable to print");
//         }
//     }
//
//     const badge = useMemo(() => {
//         const s = (item?.status ?? "Draft") as string;
//         const map: Record<string, string> = {
//             Draft: "bg-gray-100 text-gray-700",
//             ReadyForSignature: "bg-amber-100 text-amber-700",
//             Signed: "bg-green-100 text-green-700",
//             CosignRequested: "bg-blue-100 text-blue-700",
//             Cosigned: "bg-teal-100 text-teal-700",
//             Locked: "bg-green-100 text-green-700",
//             finalized: "bg-green-100 text-green-700",
//         };
//         return (
//             <span className={`rounded-full px-3 py-1 text-sm ${map[s] || "bg-gray-100 text-gray-700"}`}>
//         {s}
//       </span>
//         );
//     }, [item?.status]);
//
//     return (
//         <div className="space-y-4">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold">Sign-off / Finalization</h2>
//                 <div className="flex items-center gap-2">
//                     {badge}
//                     {item ? (
//                         <>
//                             <button
//                                 onClick={() => setShowForm((v) => !v)}
//                                 className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                             >
//                                 {showForm ? "Close" : "Edit"}
//                             </button>
//                             <button
//                                 onClick={() => item && esign()}
//                                 className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
//                                 disabled={busy || !item?.id}
//                                 title="eSign"
//                             >
//                                 eSign
//                             </button>
//                             <button
//                                 onClick={() => item && printSignoff(item)}
//                                 className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
//                                 disabled={busy || !item}
//                                 title="Print"
//                             >
//                                 Print
//                             </button>
//                             <button
//                                 onClick={remove}
//                                 className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
//                                 disabled={busy || !item?.id}
//                             >
//                                 Delete
//                             </button>
//                         </>
//                     ) : (
//                         <button
//                             onClick={() => setShowForm(true)}
//                             className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
//                         >
//                             Add Sign-off
//                         </button>
//                     )}
//                 </div>
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
//             {loading && <div className="text-gray-600">Loading...</div>}
//             {err && <div className="text-red-600">{err}</div>}
//
//             {!loading && !err && item && !showForm && (
//                 <div className="rounded-xl border p-4 bg-white space-y-2">
//                     <div className="text-sm text-gray-800">
//                         <b>Status:</b> {(item as any).status || "Draft"}
//                     </div>
//                     <div className="text-sm text-gray-800">
//                         {(item as any).signedBy ? <span><b>Signed By:</b> {(item as any).signedBy}</span> : null}
//                         {(item as any).signedAt ? <span> · {(item as any).signedAt}</span> : null}
//                     </div>
//                     {((item as any).cosigners || (item as any).cosignedBy) && (
//                         <div className="text-sm text-gray-800">
//                             <b>Co-signers:</b>{" "}
//                             {Array.isArray((item as any).cosigners)
//                                 ? (item as any).cosigners.join(", ")
//                                 : (item as any).cosignedBy}
//                             {(item as any).cosignedAt ? ` · ${(item as any).cosignedAt}` : ""}
//                         </div>
//                     )}
//                     {((item as any).finalizedAt || (item as any).lockedAt) && (
//                         <div className="text-sm text-gray-800">
//                             <b>Finalized/Locked At:</b> {(item as any).finalizedAt || (item as any).lockedAt}
//                         </div>
//                     )}
//                     {(item as any).comments && (
//                         <p className="text-sm text-gray-700 whitespace-pre-wrap">{(item as any).comments}</p>
//                     )}
//                     <p className="text-xs text-gray-500">
//                         {(item as any).audit?.createdDate && <>Created: {(item as any).audit.createdDate}</>}
//                         {(item as any).audit?.lastModifiedDate && <> · Updated: {(item as any).audit.lastModifiedDate}</>}
//                     </p>
//                 </div>
//             )}
//
//             {/* Form */}
//             {!loading && !err && showForm && (
//                 <Signoffform
//                     patientId={patientId}
//                     encounterId={encounterId}
//                     value={item}
//                     onSaved={(saved) => {
//                         setItem(saved);
//                         setShowForm(false);
//                         setAlert({ type: "success", msg: "Sign-off saved." });
//                         setTimeout(() => setAlert(null), 3000);
//                     }}
//                     onDeleted={() => {
//                         setItem(null);
//                         setShowForm(true);
//                         setAlert({ type: "success", msg: "Sign-off deleted." });
//                         setTimeout(() => setAlert(null), 3000);
//                     }}
//                 />
//             )}
//         </div>
//     );
// }







"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, SignoffDto } from "@/utils/types";
import Signoffform from "./Signoffform";

type Props = { patientId: number; encounterId: number };

async function safeJson<T>(res: Response): Promise<T | null> {
    const t = await res.text().catch(() => "");
    if (!t) return null;
    try {
        return JSON.parse(t) as T;
    } catch {
        return null;
    }
}

function pickLatest(arr: unknown[]): SignoffDto | null {
    if (!Array.isArray(arr) || arr.length === 0) return null;

    // safely assume it's SignoffDto[]
    const list = arr as SignoffDto[];

    const sorted = [...list].sort((a, b) => {
        const da = a?.audit?.lastModifiedDate || a?.audit?.createdDate || "";
        const db = b?.audit?.lastModifiedDate || b?.audit?.createdDate || "";
        if (db && da) {
            const cmp = String(db).localeCompare(String(da));
            if (cmp !== 0) return cmp;
        }
        return (Number(b?.id) || 0) - (Number(a?.id) || 0);
    });

    return sorted[0] ?? null;
}

function normalizeSignoff(data: unknown): SignoffDto | null {
    if (Array.isArray(data)) return pickLatest(data);
    return (data ?? null) as SignoffDto | null;
}

async function safeGet(url: string, headers: HeadersInit) {
    try {
        return await fetchWithOrg(url, { method: "GET", headers });
    } catch {
        return await fetch(url, { method: "GET", headers });
    }
}

export default function Signoffcard({ patientId, encounterId }: Props) {
    const [item, setItem] = useState<SignoffDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [showForm, setShowForm] = useState(false);

    async function load(autoCreate = true) {
        setLoading(true);
        setErr(null);
        try {
            const res = await safeGet(`/api/signoffs/${patientId}/${encounterId}`, {
                Accept: "application/json",
            });
            const json = await safeJson<ApiResponse<SignoffDto | SignoffDto[]>>(res);

            if (res.ok && json?.success) {
                const current = normalizeSignoff(json.data);
                if (current) {
                    setItem(current);
                    setShowForm(false);
                    return;
                }
            }

            if (autoCreate) {
                const createRes = await fetchWithOrg(`/api/signoffs/${patientId}/${encounterId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ patientId, encounterId }),
                });
                const created = await safeJson<ApiResponse<SignoffDto>>(createRes);
                if (!createRes.ok || !created?.success) {
                    throw new Error(created?.message || `Create failed (${createRes.status})`);
                }
                setItem(created.data ?? null);
                setShowForm(true);
            } else {
                setItem(null);
                setShowForm(true);
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, encounterId]);

    async function esign() {
        if (!item?.id) return;
        try {
            setBusy(true);
            const res = await fetchWithOrg(
                `/api/signoffs/${patientId}/${encounterId}/${item.id}/esign`,
                { method: "POST" }
            );
            const json = await safeJson<ApiResponse<SignoffDto>>(res);
            if (!res.ok || !json?.success) throw new Error(json?.message || "eSign failed");

            setAlert({ type: "success", msg: "Sign-off e-signed." });
            await load(true); // ✅ force reload, pick locked record
        } catch (e: unknown) {
            setAlert({ type: "error", msg: e instanceof Error ? e.message : "Something went wrong" });
        }
        finally {
            setBusy(false);
            setTimeout(() => setAlert(null), 3000);
        }
    }


    async function printSignoff(sig: SignoffDto) {
        if (!sig?.id) return;
        try {
            const res = await fetchWithOrg(
                `/api/signoffs/${patientId}/${encounterId}/${sig.id}/print`,
                { method: "GET", headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error(`Print failed (${res.status})`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e: unknown) {
            window.alert(e instanceof Error ? e.message : "Unable to print");
        }

    }

    const badge = useMemo(() => {
        const s = (item?.status ?? "Draft") as string;
        const map: Record<string, string> = {
            Draft: "bg-gray-100 text-gray-700",
            ReadyForSignature: "bg-amber-100 text-amber-700",
            Signed: "bg-green-100 text-green-700",
            CosignRequested: "bg-blue-100 text-blue-700",
            Cosigned: "bg-teal-100 text-teal-700",
            Locked: "bg-green-100 text-green-700",
            finalized: "bg-green-100 text-green-700",
        };
        return (
            <span className={`rounded-full px-3 py-1 text-sm ${map[s] || "bg-gray-100 text-gray-700"}`}>
        {s}
      </span>
        );
    }, [item?.status]);

    const isReadOnly =
        item?.status === "Locked" ||
        item?.status === "Signed" ||
        item?.status === "finalized";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Sign-off / Finalization</h2>
                <div className="flex items-center gap-2">
                    {badge}
                    {item ? (
                        <>
                            {!isReadOnly && (
                                <button
                                    onClick={() => setShowForm((v) => !v)}
                                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                                >
                                    {showForm ? "Close" : "Edit"}
                                </button>
                            )}
                            {!isReadOnly && (
                                <button
                                    onClick={esign}
                                    className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                                    disabled={busy || !item?.id}
                                >
                                    eSign
                                </button>
                            )}
                            <button
                                onClick={() => printSignoff(item)}
                                className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                                disabled={busy || !item}
                            >
                                Print
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                        >
                            Add Sign-off
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
                >
                    {alert.msg}
                </div>
            )}

            {loading && <div className="text-gray-600">Loading...</div>}
            {err && <div className="text-red-600">{err}</div>}

            {!loading && !err && item && !showForm && (
                <div className="rounded-xl border p-4 bg-white space-y-2">
                    <div className="text-sm text-gray-800">
                        <b>Status:</b> {item.status || "Draft"}
                    </div>
                    {item.signedBy && (
                        <div className="text-sm text-gray-800">
                            <b>Signed By:</b> {item.signedBy} · {item.signedAt}
                        </div>
                    )}
                    {item.comments && <p className="text-sm text-gray-700">{item.comments}</p>}
                    <p className="text-xs text-gray-500">
                        {item.audit?.createdDate && <>Created: {item.audit.createdDate}</>}
                        {item.audit?.lastModifiedDate && <> · Updated: {item.audit.lastModifiedDate}</>}
                    </p>
                </div>
            )}

            {!loading && !err && showForm && (
                <Signoffform
                    patientId={patientId}
                    encounterId={encounterId}
                    value={item}
                    onSaved={(saved) => {
                        setItem(saved);
                        setShowForm(false);
                        setAlert({ type: "success", msg: "Sign-off saved." });
                        setTimeout(() => setAlert(null), 3000);
                    }}
                    onDeleted={() => {
                        setItem(null);
                        setShowForm(true);
                        setAlert({ type: "success", msg: "Sign-off deleted." });
                        setTimeout(() => setAlert(null), 3000);
                    }}
                />
            )}
        </div>
    );
}
