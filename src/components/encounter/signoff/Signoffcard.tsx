





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
        void load(false);
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
