// "use client";
//
// import { useEffect, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, SignoffDto } from "@/utils/types";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
//     value?: SignoffDto | null;
//     onSaved: (saved: SignoffDto) => void;
//     onDeleted: () => void;
// };
//
// async function safeJson<T>(res: Response): Promise<T | null> {
//     const t = await res.text().catch(() => "");
//     if (!t) return null;
//     try { return JSON.parse(t) as T; } catch { return null; }
// }
//
// export default function Signoffform({ patientId, encounterId, value, onSaved, onDeleted }: Props) {
//     const [attestationText, setAttestationText] = useState("");
//     const [ackBilling, setAckBilling] = useState(false);
//     const [lockEncounter, setLockEncounter] = useState(true);
//     const [cosigner, setCosigner] = useState("");
//     const [notes, setNotes] = useState("");
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState<string | null>(null);
//
//     useEffect(() => {
//         setAttestationText(value?.attestationText || "");
//         setAckBilling(!!value?.acknowledgeBillingComplete);
//         setLockEncounter(value?.lockEncounter ?? true);
//         setCosigner(value?.cosigner || "");
//         setNotes((value as any)?.comments || value?.notes || "");
//     }, [value]);
//
//     async function saveDraft() {
//         setSaving(true);
//         setErr(null);
//         try {
//             const body: any = {
//                 attestationText: attestationText.trim(),
//                 comments: notes.trim() || undefined,
//                 cosigner: cosigner.trim() || undefined,
//                 lockEncounter,
//                 acknowledgeBillingComplete: ackBilling,
//             };
//
//             const hasId = !!value?.id;
//             const url = hasId
//                 ? `/api/signoffs/${patientId}/${encounterId}/${value!.id}`
//                 : `/api/signoffs/${patientId}/${encounterId}`;
//             const method = hasId ? "PUT" : "POST";
//
//             const res = await fetchWithOrg(url, {
//                 method,
//                 headers: { "Content-Type": "application/json", Accept: "application/json" },
//                 body: JSON.stringify(hasId ? { id: value!.id, ...body } : body),
//             });
//             const json = await safeJson<ApiResponse<SignoffDto>>(res);
//             if (!res.ok || !json?.success) throw new Error(json?.message || `Save failed (${res.status})`);
//             onSaved(json.data!);
//         } catch (e: any) {
//             setErr(e?.message ?? "Something went wrong");
//         } finally {
//             setSaving(false);
//         }
//     }
//
//     async function finalize() {
//         if (!ackBilling) {
//             setErr("Please acknowledge billing is complete before finalizing.");
//             return;
//         }
//         if (!confirm("Finalize and sign this encounter? This may lock further edits.")) return;
//
//         setSaving(true);
//         setErr(null);
//         try {
//             let signoffId = value?.id;
//
//             // If no id yet, create one quickly
//             if (!signoffId) {
//                 const createRes = await fetchWithOrg(
//                     `/api/signoffs/${patientId}/${encounterId}`,
//                     {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json", Accept: "application/json" },
//                         body: JSON.stringify({ patientId, encounterId }),
//                     }
//                 );
//                 const created = await safeJson<ApiResponse<SignoffDto>>(createRes);
//                 if (!createRes.ok || !created?.success) {
//                     throw new Error(created?.message || `Create failed (${createRes.status})`);
//                 }
//                 signoffId = created.data!.id;
//             }
//
//             // Prefer finalize endpoint; fallback to PUT status=finalized
//             let res = await fetchWithOrg(
//                 `/api/signoffs/${patientId}/${encounterId}/${signoffId}/finalize`,
//                 {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json", Accept: "application/json" },
//                     body: JSON.stringify({
//                         attestationText: attestationText.trim(),
//                         comments: notes.trim() || undefined,
//                         lockEncounter,
//                     }),
//                 }
//             );
//
//             if (res.status === 404) {
//                 res = await fetchWithOrg(
//                     `/api/signoffs/${patientId}/${encounterId}/${signoffId}`,
//                     {
//                         method: "PUT",
//                         headers: { "Content-Type": "application/json", Accept: "application/json" },
//                         body: JSON.stringify({
//                             id: signoffId,
//                             status: "finalized",
//                             attestationText: attestationText.trim(),
//                             comments: notes.trim() || undefined,
//                             lockEncounter,
//                         }),
//                     }
//                 );
//             }
//
//             const json = await safeJson<ApiResponse<SignoffDto>>(res);
//             if (!res.ok || !json?.success) throw new Error(json?.message || `Finalize failed (${res.status})`);
//             onSaved(json.data!);
//         } catch (e: any) {
//             setErr(e?.message ?? "Something went wrong");
//         } finally {
//             setSaving(false);
//         }
//     }
//
//     async function handleDelete() {
//         if (!value?.id) return;
//         if (!confirm("Delete this sign-off?")) return;
//         setSaving(true);
//         setErr(null);
//         try {
//             const res = await fetchWithOrg(
//                 `/api/signoffs/${patientId}/${encounterId}/${value.id}`,
//                 { method: "DELETE", headers: { Accept: "application/json" } }
//             );
//             const json = await safeJson<ApiResponse<void>>(res);
//             if (!res.ok || (json && json.success === false)) {
//                 throw new Error(json?.message || `Delete failed (${res.status})`);
//             }
//             onDeleted();
//         } catch (e: any) {
//             setErr(e?.message ?? "Something went wrong");
//         } finally {
//             setSaving(false);
//         }
//     }
//
//     const signed = (value?.status === "Signed" || value?.status === "Locked" || (value?.status as any) === "finalized");
//
//     return (
//         <div className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Attestation</label>
//                     <textarea
//                         className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
//                         value={attestationText}
//                         onChange={(e) => setAttestationText(e.target.value)}
//                         placeholder='e.g., "I attest that this note accurately reflects my findings and plan."'
//                         disabled={signed}
//                     />
//                 </div>
//
//                 <div className="flex items-center gap-2">
//                     <input id="ack" type="checkbox" checked={ackBilling} onChange={(e) => setAckBilling(e.target.checked)} disabled={signed} />
//                     <label htmlFor="ack" className="text-sm">Billing/Coding completed & ready for submission</label>
//                 </div>
//
//                 <div className="flex items-center gap-2">
//                     <input id="lock" type="checkbox" checked={lockEncounter} onChange={(e) => setLockEncounter(e.target.checked)} disabled={signed} />
//                     <label htmlFor="lock" className="text-sm">Lock encounter on sign-off</label>
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Request Cosign (optional)</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={cosigner}
//                         onChange={(e) => setCosigner(e.target.value)}
//                         placeholder="Cosigner name or ID"
//                         disabled={signed}
//                     />
//                 </div>
//
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Internal Notes (optional)</label>
//                     <textarea
//                         className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
//                         value={notes}
//                         onChange={(e) => setNotes(e.target.value)}
//                         disabled={signed}
//                     />
//                 </div>
//             </div>
//
//             {err && <p className="text-sm text-red-600">{err}</p>}
//
//             <div className="flex flex-wrap items-center gap-2">
//                 {!signed ? (
//                     <>
//                         <button type="button" onClick={saveDraft} disabled={saving} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
//                             Save Draft
//                         </button>
//                         <button
//                             type="button"
//                             onClick={finalize}
//                             disabled={saving || !ackBilling}
//                             className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
//                             title={!ackBilling ? "Acknowledge billing before finalizing" : ""}
//                         >
//                             Finalize & Sign
//                         </button>
//                         {value?.id && (
//                             <button
//                                 type="button"
//                                 onClick={handleDelete}
//                                 disabled={saving}
//                                 className="rounded-xl border px-4 py-2 hover:bg-gray-50"
//                             >
//                                 Delete
//                             </button>
//                         )}
//                     </>
//                 ) : (
//                     <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm">
//             {value?.status ?? "finalized"}
//           </span>
//                 )}
//             </div>
//         </div>
//     );
// }





"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, SignoffDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    value?: SignoffDto | null;
    onSaved: (saved: SignoffDto) => void;
    onDeleted: () => void;
};

async function safeJson<T>(res: Response): Promise<T | null> {
    const t = await res.text().catch(() => "");
    if (!t) return null;
    try {
        return JSON.parse(t) as T;
    } catch {
        return null;
    }
}

export default function Signoffform({
                                        patientId,
                                        encounterId,
                                        value,
                                        onSaved,
                                        onDeleted,
                                    }: Props) {
    const [attestationText, setAttestationText] = useState("");
    const [ackBilling, setAckBilling] = useState(false);
    const [lockEncounter, setLockEncounter] = useState(true);
    const [cosigner, setCosigner] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setAttestationText(value?.attestationText || "");
        setAckBilling(!!value?.acknowledgeBillingComplete);
        setLockEncounter(value?.lockEncounter ?? true);
        setCosigner(value?.cosigner || "");
        setNotes(value?.comments || value?.notes || "");
    }, [value]);

    async function saveDraft() {
        setSaving(true);
        setErr(null);
        try {
            const body: Partial<SignoffDto> = {
                attestationText: attestationText.trim(),
                comments: notes.trim() || undefined,
                cosigner: cosigner.trim() || undefined,
                lockEncounter,
                acknowledgeBillingComplete: ackBilling,
            };

            const hasId = !!value?.id;
            const url = hasId
                ? `/api/signoffs/${patientId}/${encounterId}/${value!.id}`
                : `/api/signoffs/${patientId}/${encounterId}`;
            const method = hasId ? "PUT" : "POST";

            const res = await fetchWithOrg(url, {
                method,
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(hasId ? { id: value!.id, ...body } : body),
            });
            const json = await safeJson<ApiResponse<SignoffDto>>(res);
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || `Save failed (${res.status})`);
            }
            onSaved(json.data!);
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    async function finalize() {
        if (!ackBilling) {
            setErr("Please acknowledge billing is complete before finalizing.");
            return;
        }
        if (
            !confirm(
                "Finalize and sign this encounter? This may lock further edits."
            )
        )
            return;

        setSaving(true);
        setErr(null);
        try {
            let signoffId = value?.id;

            if (!signoffId) {
                const createRes = await fetchWithOrg(
                    `/api/signoffs/${patientId}/${encounterId}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({ patientId, encounterId }),
                    }
                );
                const created = await safeJson<ApiResponse<SignoffDto>>(createRes);
                if (!createRes.ok || !created?.success) {
                    throw new Error(created?.message || `Create failed (${createRes.status})`);
                }
                signoffId = created.data!.id;
            }

            let res = await fetchWithOrg(
                `/api/signoffs/${patientId}/${encounterId}/${signoffId}/finalize`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        attestationText: attestationText.trim(),
                        comments: notes.trim() || undefined,
                        lockEncounter,
                        acknowledgeBillingComplete: ackBilling,
                        cosigner: cosigner.trim() || undefined,
                    }),
                }
            );

            if (res.status === 404) {
                res = await fetchWithOrg(
                    `/api/signoffs/${patientId}/${encounterId}/${signoffId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            id: signoffId,
                            status: "finalized",
                            attestationText: attestationText.trim(),
                            comments: notes.trim() || undefined,
                            lockEncounter,
                            acknowledgeBillingComplete: ackBilling,
                            cosigner: cosigner.trim() || undefined,
                        }),
                    }
                );
            }

            const json = await safeJson<ApiResponse<SignoffDto>>(res);
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || `Finalize failed (${res.status})`);
            }
            onSaved(json.data!);
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }

    }

    async function handleDelete() {
        if (!value?.id) return;
        if (!confirm("Delete this sign-off?")) return;
        setSaving(true);
        setErr(null);
        try {
            const res = await fetchWithOrg(
                `/api/signoffs/${patientId}/${encounterId}/${value.id}`,
                { method: "DELETE", headers: { Accept: "application/json" } }
            );
            const json = await safeJson<ApiResponse<void>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `Delete failed (${res.status})`);
            }
            onDeleted();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }


    }

    const signed =
        value?.status === "Signed" ||
        value?.status === "Locked" ||
        value?.status === "finalized";


    return (
        <div className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Attestation</label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
                        value={attestationText}
                        onChange={(e) => setAttestationText(e.target.value)}
                        placeholder='e.g., "I attest that this note accurately reflects my findings and plan."'
                        disabled={signed}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="ack"
                        type="checkbox"
                        checked={ackBilling}
                        onChange={(e) => setAckBilling(e.target.checked)}
                        disabled={signed}
                    />
                    <label htmlFor="ack" className="text-sm">
                        Billing/Coding completed & ready for submission
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="lock"
                        type="checkbox"
                        checked={lockEncounter}
                        onChange={(e) => setLockEncounter(e.target.checked)}
                        disabled={signed}
                    />
                    <label htmlFor="lock" className="text-sm">
                        Lock encounter on sign-off
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Request Cosign (optional)
                    </label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={cosigner}
                        onChange={(e) => setCosigner(e.target.value)}
                        placeholder="Cosigner name or ID"
                        disabled={signed}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                        Internal Notes (optional)
                    </label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={signed}
                    />
                </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex flex-wrap items-center gap-2">
                {!signed ? (
                    <>
                        <button
                            type="button"
                            onClick={saveDraft}
                            disabled={saving}
                            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                        >
                            Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={finalize}
                            disabled={saving || !ackBilling}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                            title={
                                !ackBilling ? "Acknowledge billing before finalizing" : ""
                            }
                        >
                            Finalize & Sign
                        </button>
                        {value?.id && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={saving}
                                className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                            >
                                Delete
                            </button>
                        )}
                    </>
                ) : (
                    <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm">
            {value?.status ?? "finalized"}
          </span>
                )}
            </div>
        </div>
    );
}
