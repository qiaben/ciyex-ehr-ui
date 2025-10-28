




"use client";

import {useEffect, useMemo, useState} from "react";
import {fetchWithOrg} from "@/utils/fetchWithOrg";
import type {ApiResponse, FeeScheduleDto, FeeScheduleEntryDto} from "@/utils/types";
import Feescheduleform from "./Feescheduleform";

type Props = { patientId: number; encounterId: number };

type SignoffDtoLite = { status?: "Draft"|"ReadyForSignature"|"Signed"|"CosignRequested"|"Cosigned"|"Locked" };

// --- Backend wire models (what the API returns/expects) ---
type BackSchedule = {
    id: number;
    payer?: string;
    currency?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    status?: string;
    notes?: string;
    audit?: { createdDate?: string; lastModifiedDate?: string };
};
type BackEntry = {
    id: number;
    codeType?: string;
    code?: string;
    modifier?: string;
    description?: string;
    unit?: string;         // e.g. "visit"
    currency?: string;     // e.g. "USD"
    amount?: number;       // price per unit
    active?: boolean;
    notes?: string;
};

// Safe JSON for 200/204/empty bodies
async function safeJson<T>(res: Response): Promise<T | null> {
    const t = await res.text().catch(() => "");
    if (!t) return null;
    try { return JSON.parse(t) as T; } catch { return null; }
}

function money(n?: number) {
    const x = typeof n === "number" ? n : 0;
    return x.toFixed(2);
}

export default function Feeschedulecard({ patientId, encounterId }: Props) {
    const [item, setItem] = useState<FeeScheduleDto | null>(null);
    const [locked, setLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [mode, setMode] = useState<"view" | "edit">("edit");

    async function load() {
        setLoading(true);
        setErr(null);
        try {
            // 1) fetch schedules (array) and pick the most recent
            const schRes = await fetchWithOrg(`/api/fee-schedules/${patientId}/${encounterId}`, {
                headers: { Accept: "application/json" },
            });
            const schJson = await safeJson<ApiResponse<BackSchedule[]>>(schRes);
            if (!schRes.ok || !schJson?.success) throw new Error(schJson?.message || "Load failed");

            const s = (schJson.data || [])[0] || null;

            // 2) fetch entries for that schedule (if any)
            let entries: FeeScheduleEntryDto[] = [];
            if (s?.id) {
                const entRes = await fetchWithOrg(
                    `/api/fee-schedules/${patientId}/${encounterId}/${s.id}/entries`,
                    { headers: { Accept: "application/json" } }
                );
                const entJson = await safeJson<ApiResponse<BackEntry[]>>(entRes);
                if (!entRes.ok || !entJson?.success) throw new Error(entJson?.message || "Load entries failed");
                entries = (entJson.data || []).map((e) => ({
                    id: e.id,
                    code: e.code || "",
                    description: e.description || "",
                    modifiers: e.modifier || "",
                    units: 1, // backend has price per unit; UI keeps quantity at 1 for now
                    unitPrice: typeof e.amount === "number" ? e.amount : 0,
                    lineTotal: typeof e.amount === "number" ? e.amount : 0,
                    notes: e.notes || "",
                }));
            }

            // 3) map to UI dto
            const ui: FeeScheduleDto | null = s
                ? {
                    id: s.id,
                    patientId,
                    encounterId,
                    effectiveDate: s.effectiveFrom || "",
                    payer: s.payer || "",
                    remarks: s.notes || "",
                    entries,
                    audit: s.audit,
                }
                : null;

            setItem(ui);
            setMode(ui ? "view" : "edit");

            // 4) signoff state to lock the section (best-effort)
            const soRes = await fetchWithOrg(`/api/signoffs/${patientId}/${encounterId}`, {
                headers: { Accept: "application/json" },
            });
            if (soRes.ok) {
                const soJson = await safeJson<ApiResponse<SignoffDtoLite | null>>(soRes);
                setLocked(!!soJson?.data && soJson.data.status === "Locked");
            } else {
                setLocked(false);
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [patientId, encounterId]);

    async function handleDelete() {
        if (!item?.id || locked) return;
        if (!confirm("Delete this fee schedule? This cannot be undone.")) return;
        setBusy(true);
        setErr(null);
        try {
            const res = await fetchWithOrg(
                `/api/fee-schedules/${patientId}/${encounterId}/${item.id}`,
                { method: "DELETE", headers: { Accept: "application/json" } }
            );
            if (!res.ok) throw new Error("Delete failed");
            setItem(null);
            setMode("edit");
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setBusy(false);
        }
    }

    // computed totals for read-only card
    const totals = useMemo(() => {
        const subtotal = (item?.entries || []).reduce((s, e) => {
            const u = typeof e.units === "number" ? e.units : Number(e.units || 0);
            const p = typeof e.unitPrice === "number" ? e.unitPrice : Number(e.unitPrice || 0);
            return s + Math.max(0, u) * Math.max(0, p);
        }, 0);
        const discount = typeof item?.discount === "number" ? item!.discount : 0;
        const tax = typeof item?.tax === "number" ? item!.tax : 0;
        const total = Math.max(0, subtotal - discount + tax);
        return { subtotal, discount, tax, total };
    }, [item]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Fee Schedule</h2>
                {locked ? (
                    <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm">Locked</span>
                ) : item?.audit ? (
                    <span className="text-xs text-gray-600">
            {item.audit.createdDate && <>Created: {item.audit.createdDate}</>}
                        {item.audit.lastModifiedDate && <> · Updated: {item.audit.lastModifiedDate}</>}
          </span>
                ) : null}
            </div>

            {loading && <div className="text-gray-600">Loading...</div>}
            {err && <div className="text-red-600">{err}</div>}

            {mode === "view" && item ? (
                <div className="rounded-2xl border p-4 shadow-sm bg-white space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 space-x-4">
                            <span><b>Effective:</b> {item.effectiveDate?.slice(0, 10) || "-"}</span>
                            <span><b>Payer:</b> {item.payer || "-"}</span>
                            <span><b>Remarks:</b> {item.remarks || "-"}</span>
                        </div>
                        {!locked && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode("edit")}
                                    className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleDelete}
                                    className="rounded-xl border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-separate border-spacing-y-2">
                            <thead className="text-left text-gray-600">
                            <tr>
                                <th className="px-2">Code</th>
                                <th className="px-2">Description</th>
                                <th className="px-2">Mods</th>
                                <th className="px-2 w-24">Units</th>
                                <th className="px-2 w-32">Unit Price</th>
                                <th className="px-2 w-32 text-right">Line Total</th>
                                <th className="px-2">Notes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {item.entries?.map((e, i) => {
                                const u = typeof e.units === "number" ? e.units : Number(e.units || 0);
                                const p = typeof e.unitPrice === "number" ? e.unitPrice : Number(e.unitPrice || 0);
                                const line = Math.max(0, u) * Math.max(0, p);
                                return (
                                    <tr key={e.id ?? i} className="bg-white rounded-xl shadow-sm">
                                        <td className="px-2 py-2">{e.code || "-"}</td>
                                        <td className="px-2 py-2">{e.description || "-"}</td>
                                        <td className="px-2 py-2">{e.modifiers || "-"}</td>
                                        <td className="px-2 py-2">{u}</td>
                                        <td className="px-2 py-2">₹{money(p)}</td>
                                        <td className="px-2 py-2 text-right">₹{money(line)}</td>
                                        <td className="px-2 py-2">{e.notes || "-"}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end text-sm">
                        <div className="rounded-xl border p-3 w-full md:w-80 bg-gray-50">
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{money(totals.subtotal)}</span></div>
                            <div className="flex justify-between"><span>Discount</span><span>₹{money(totals.discount)}</span></div>
                            <div className="flex justify-between"><span>Tax</span><span>₹{money(totals.tax)}</span></div>
                            <div className="mt-1 border-t pt-1 flex justify-between font-semibold"><span>Total</span><span>₹{money(totals.total)}</span></div>
                        </div>
                    </div>
                </div>
            ) : (
                <Feescheduleform
                    patientId={patientId}
                    encounterId={encounterId}
                    value={item}
                    readOnly={locked}
                    onSaved={(saved) => {
                        setItem(saved);
                        setMode("view");   // <<< go back to read-only after saving
                    }}
                />
            )}
        </div>
    );
}
