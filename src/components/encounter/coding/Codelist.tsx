

"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, CodeDto } from "@/utils/types";
import CodeForm from "./Codeform";


type Props = { patientId: number; encounterId: number };

// ---------- helpers ----------
async function safeJson<T>(res: Response): Promise<T | null> {
    const t = await res.text().catch(() => "");
    if (!t) return null;
    try {
        return JSON.parse(t) as T;
    } catch {
        return null;
    }
}

function isSigned(c: CodeDto & { esigned?: boolean; signed?: boolean }): boolean {
    return Boolean(c.esigned ?? c.signed ?? c.signedAt);
}


// ---------- component ----------
export default function CodeList({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<CodeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<CodeDto | null>(null);

    const [busyId, setBusyId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // -------- load ----------
    async function load() {
        setLoading(true);
        setError(null);
        try {
            // GET /api/codes/{patientId}/{encounterId}
            const res = await fetchWithOrg(`/api/codes/${patientId}/${encounterId}`, {
                headers: { Accept: "application/json" },
            });
            const json = await safeJson<ApiResponse<CodeDto[]>>(res);
            if (!res.ok || !json || json.success === false) {
                throw new Error(json?.message || `Load failed (${res.status})`);
            }
            setItems(json.data ?? []);
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

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, encounterId]);

    // keep list order STABLE by createdDate (then id) — like AssessmentList
    const list = useMemo(() => {
        const arr = Array.isArray(items) ? items.slice() : [];
        arr.sort((a, b) => {
            const aCreated = a.audit?.createdDate || "";
            const bCreated = b.audit?.createdDate || "";
            const cmp = aCreated.localeCompare(bCreated);
            return cmp !== 0 ? cmp : (a.id ?? 0) - (b.id ?? 0);
        });
        return arr;
    }, [items]);

    const totalFee = useMemo(
        () =>
            (items ?? []).reduce(
                (sum, x) => sum + (typeof x.feeStandard === "number" ? x.feeStandard : 0),
                0
            ),
        [items]
    );

    function showOk(msg: string) {
        setToast({ type: "success", msg });
        setTimeout(() => setToast(null), 3000);
    }
    function showErr(e: unknown, fallback = "Something went wrong") {
        const msg = e instanceof Error ? e.message : fallback;
        setToast({ type: "error", msg });
        setTimeout(() => setToast(null), 3500);
    }


    // -------- CRUD ----------
    async function remove(id: number) {
        if (!confirm("Delete this code?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/codes/${patientId}/${encounterId}/${id}`, {
                method: "DELETE",
                headers: { Accept: "application/json" },
            });
            const json = await safeJson<ApiResponse<void>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `Delete failed (${res.status})`);
            }
            setItems(prev => prev.filter(x => x.id !== id));
            showOk("Code deleted.");
        } catch (e) {
            showErr(e, "Delete failed");
        } finally {
            setBusyId(null);
        }
    }

    function upsertLocal(updated: CodeDto) {
        setItems(prev => {
            const i = prev.findIndex(x => x.id === updated.id);
            if (i >= 0) {
                const copy = [...prev];
                copy[i] = updated;
                return copy;
            }
            return [...prev, updated];
        });
    }

    function onSaved(saved: CodeDto) {
        upsertLocal(saved);
        setEditing(null);
        setShowForm(false);
        showOk("Code saved.");
    }

    // -------- eSign ----------
    async function esign(id: number) {
        try {
            setBusyId(id);
            // POST /api/codes/{patientId}/{encounterId}/{id}/esign
            const res = await fetchWithOrg(
                `/api/codes/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST", headers: { Accept: "application/json" } }
            );
            const json = await safeJson<ApiResponse<CodeDto>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `eSign failed (${res.status})`);
            }
            // Merge returned record so UI flips to read-only
            if (json?.data) upsertLocal(json.data);
            showOk("Code e-signed.");
        } catch (e) {
            showErr(e, "eSign failed");
        } finally {
            setBusyId(null);
        }
    }

    // -------- print ----------
    async function printCode(id: number) {
        try {
            setBusyId(id);
            // GET /api/codes/{patientId}/{encounterId}/{id}/print  -> PDF
            const res = await fetchWithOrg(
                `/api/codes/${patientId}/${encounterId}/${id}/print`,
                { headers: { Accept: "application/pdf" } }
            );
            if (!res.ok) throw new Error(`Print failed (${res.status})`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const win = window.open(url, "_blank", "noopener,noreferrer");
            if (!win) throw new Error("Popup blocked. Allow popups to view PDF.");
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (e) {
            showErr(e, "Unable to print");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Codes</h2>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-700">Total Fee: ₹{totalFee.toFixed(2)}</div>
                    <button
                        onClick={() => {
                            setEditing(null);
                            setShowForm(s => !s);
                        }}
                        className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                    >
                        {showForm ? "Close" : "Add Code"}
                    </button>
                </div>
            </div>

            {toast && (
                <div
                    className={`rounded-xl border px-4 py-2 text-sm ${
                        toast.type === "success"
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-red-300 bg-red-50 text-red-800"
                    }`}
                >
                    {toast.msg}
                </div>
            )}

            {showForm && (
                <CodeForm
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

            {loading && <div className="text-gray-600">Loading…</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && list.length === 0 && (
                <div className="rounded-xl border p-4 text-gray-600">No codes yet.</div>
            )}

            <ul className="space-y-3">
                {list.map(c => {
                    const readonly = isSigned(c);
                    return (
                        <li key={c.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">
                                        {c.codeType} · {c.code}
                                        {c.modifier ? `-${c.modifier}` : ""}
                                        {c.active ? " · Active" : " · Inactive"}
                                        {typeof c.feeStandard === "number" ? ` · ₹${c.feeStandard.toFixed(2)}` : ""}
                                    </p>

                                    {c.shortDescription && <p className="text-gray-900">{c.shortDescription}</p>}
                                    {c.description && (
                                        <p className="text-gray-700 whitespace-pre-wrap">{c.description}</p>
                                    )}

                                    <p className="text-sm text-gray-700">
                                        {c.category ? `Category: ${c.category}` : ""}
                                        {(c.category && (c.relateTo || c.diagnosisReporting || c.serviceReporting)) ? " · " : ""}
                                        {c.relateTo ? `Relate To: ${c.relateTo}` : ""}
                                        {(c.relateTo && (c.diagnosisReporting || c.serviceReporting)) ? " · " : ""}
                                        {c.diagnosisReporting ? "Dx Reporting" : ""}
                                        {c.diagnosisReporting && c.serviceReporting ? " · " : ""}
                                        {c.serviceReporting ? "Svc Reporting" : ""}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        {c.audit?.createdDate && <>Created: {c.audit.createdDate}</>}
                                        {c.audit?.lastModifiedDate && <> · Updated: {c.audit.lastModifiedDate}</>}
                                    </p>

                                    {readonly && (
                                        <p className="text-xs font-medium text-emerald-700">Signed — read only</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* When signed: ONLY Print (match AssessmentList workflow) */}
                                    {!readonly ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditing(c);
                                                    setShowForm(true);
                                                }}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                                aria-label="Edit code"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => remove(c.id!)}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={busyId === c.id}
                                                aria-label="Delete code"
                                            >
                                                Delete
                                            </button>

                                            <button
                                                onClick={() => esign(c.id!)}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={busyId === c.id}
                                                aria-label="eSign code"
                                                title="eSign"
                                            >
                                                eSign
                                            </button>

                                            <button
                                                onClick={() => printCode(c.id!)}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={busyId === c.id}
                                                aria-label="Print code"
                                                title="Print"
                                            >
                                                Print
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => printCode(c.id!)}
                                            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={busyId === c.id}
                                            aria-label="Print code"
                                            title="Print"
                                        >
                                            Print
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
