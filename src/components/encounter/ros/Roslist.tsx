"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, RosDto } from "@/utils/types";
import ROSForm from "./Rosform";

async function safeJson<T>(res: Response): Promise<T | null> {
    const txt = await res.text().catch(() => "");
    if (!txt) return null;
    try { return JSON.parse(txt) as T; } catch { return null; }
}

type Props = { patientId: number; encounterId: number };

function getPositiveSymptoms(ros: RosDto): string[] {
    const symptoms: string[] = [];
    const systems = [
        { key: "constitutional", label: "Constitutional" },
        { key: "eyes", label: "Eyes" },
        { key: "ent", label: "ENT" },
        { key: "neck", label: "Neck" },
        { key: "cardiovascular", label: "Cardiovascular" },
        { key: "respiratory", label: "Respiratory" },
        { key: "gastrointestinal", label: "Gastrointestinal" },
        { key: "genitourinaryMale", label: "Genitourinary (Male)" },
        { key: "genitourinaryFemale", label: "Genitourinary (Female)" },
        { key: "musculoskeletal", label: "Musculoskeletal" },
        { key: "skin", label: "Skin" },
        { key: "neurologic", label: "Neurologic" },
        { key: "psychiatric", label: "Psychiatric" },
        { key: "endocrine", label: "Endocrine" },
        { key: "hematologicLymphatic", label: "Hematologic/Lymphatic" },
        { key: "allergicImmunologic", label: "Allergic/Immunologic" },
    ];

    systems.forEach((sys) => {
        const systemData = (ros as Record<string, unknown>)[sys.key] as Record<string, unknown>;
        if (!systemData) return;

        const positives = Object.entries(systemData)
            .filter(([k, v]) => k !== "note" && v === true)
            .map(([k]) => k.replace(/([A-Z])/g, " $1").trim());

        if (positives.length > 0) {
            symptoms.push(`${sys.label}: ${positives.join(", ")}`);
        }
    });

    return symptoms;
}

export default function ROSList({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<RosDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<RosDto | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    function notify(type: "success" | "error", msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 2500);
    }

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(`/api/reviewofsystems/${patientId}/${encounterId}`, {
                headers: { Accept: "application/json" },
            });
            const json = await safeJson<ApiResponse<RosDto[]>>(res);
            if (!res.ok || !json?.success) {
                throw new Error(json?.message || `Load failed (${res.status})`);
            }
            setItems(Array.isArray(json.data) ? json.data : []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, encounterId]);

    async function onSaved() {
        setShowForm(false);
        setEditing(null);
        await load();
    }

    async function remove(id: number) {
        if (!confirm("Delete this ROS entry?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/reviewofsystems/${patientId}/${encounterId}/${id}`, {
                method: "DELETE",
                headers: { Accept: "application/json" },
            });

            if (res.status === 204) {
                setItems((prev) => prev.filter((x) => x.id !== id));
                notify("success", "ROS entry deleted.");
                return;
            }
            const json = await safeJson<ApiResponse<void>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `Delete failed (${res.status})`);
            }
            setItems((prev) => prev.filter((x) => x.id !== id));
            notify("success", "ROS entry deleted.");
        } catch (e: unknown) {
            notify("error", e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setBusyId(null);
        }
    }

    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/reviewofsystems/${patientId}/${encounterId}/${id}/esign`, {
                method: "POST",
                headers: { Accept: "application/json" },
            });
            const json = await safeJson<ApiResponse<RosDto>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `eSign failed (${res.status})`);
            }
            notify("success", "ROS entry e-signed.");
            await load();
        } catch (e: unknown) {
            notify("error", e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setBusyId(null);
        }
    }

    async function printROS(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(`/api/reviewofsystems/${patientId}/${encounterId}/${id}/print`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`Print failed (${res.status})`);

            const ct = res.headers.get("content-type") || "";
            if (ct.includes("pdf")) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const win = window.open(url, "_blank", "noopener,noreferrer");
                if (!win) throw new Error("Popup blocked. Allow popups to view the PDF.");
            } else {
                const html = await res.text();
                const win = window.open("", "_blank", "noopener,noreferrer");
                if (!win) throw new Error("Popup blocked. Allow popups to view the document.");
                win.document.write(html);
                win.document.close();
            }
        } catch (e: unknown) {
            notify("error", e instanceof Error ? e.message : "Unable to print");
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
                <h2 className="text-xl font-semibold">Review of Systems (ROS)</h2>
                <button
                    onClick={() => {
                        setEditing(null);
                        setShowForm((s) => !s);
                    }}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
                >
                    {showForm ? "Close" : "Add ROS"}
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
                <ROSForm
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
                <div className="rounded-xl border p-4 text-gray-600">No ROS entries yet.</div>
            )}

            <ul className="space-y-3">
                {sorted.map((ros) => {
                    const readOnly = ros.eSigned === true;
                    const symptoms = getPositiveSymptoms(ros);
                    return (
                        <li key={ros.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">Review of Systems</p>
                                    {symptoms.length > 0 ? (
                                        <ul className="text-sm text-gray-800 list-disc pl-5">
                                            {symptoms.map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-600">All systems negative</p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {ros.audit?.createdDate && <>Created: {ros.audit.createdDate}</>}
                                        {ros.audit?.lastModifiedDate && <> · Updated: {ros.audit.lastModifiedDate}</>}
                                        {readOnly && <> · <span className="text-green-700 font-medium">Signed — read only</span></>}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {!readOnly && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditing(ros);
                                                    setShowForm(true);
                                                }}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => remove(ros.id!)}
                                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                                disabled={busyId === ros.id}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => esign(ros.id!)}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                        disabled={busyId === ros.id || readOnly}
                                        title="eSign"
                                    >
                                        eSign
                                    </button>

                                    <button
                                        onClick={() => printROS(ros.id!)}
                                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                                        disabled={busyId === ros.id}
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
