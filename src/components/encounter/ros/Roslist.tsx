

"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, RosDto } from "@/utils/types";
import ROSForm from "./Rosform";


/** Safely parse JSON (handles empty body / 204 / 401) */
async function safeJson<T>(res: Response): Promise<T | null> {
    const txt = await res.text().catch(() => "");
    if (!txt) return null;
    try {
        return JSON.parse(txt) as T;
    } catch {
        return null;
    }
}

/** Map backend payload -> UI RosDto */
// function toRosDto(b: any): RosDto {
//     return {
//         id: b.id,
//         patientId: b.patientId,
//         encounterId: b.encounterId,
//         system: b.systemName,
//         status: b.isNegative ? "Negative" : "Positive",
//         finding: Array.isArray(b.systemDetails) ? b.systemDetails.join(", ") : "",
//         notes: b.notes ?? "",
//         // treat either `esigned` or `signed` as the flag (depending on backend)
//         esigned: Boolean(b.esigned ?? b.signed),
//         audit: {
//             createdDate: b.createdDate ?? b.audit?.createdDate,
//             lastModifiedDate: b.lastModifiedDate ?? b.audit?.lastModifiedDate,
//         },
//     } as RosDto;
// }
function toRosDto(b: unknown): RosDto {
    const rec = b as Record<string, unknown>;
    return {
        id: rec.id as number,
        patientId: rec.patientId as number,
        encounterId: rec.encounterId as number,
        system: rec.systemName as string,
        status: rec.isNegative ? "Negative" : "Positive",
        finding: Array.isArray(rec.systemDetails) ? (rec.systemDetails as string[]).join(", ") : "",
        notes: (rec.notes as string) ?? "",
        esigned: Boolean(rec.esigned ?? rec.signed),
        audit: {
            createdDate: (rec.createdDate ?? (rec.audit as Record<string, unknown>)?.createdDate) as string | undefined,
            lastModifiedDate: (rec.lastModifiedDate ?? (rec.audit as Record<string, unknown>)?.lastModifiedDate) as string | undefined,
        },
    };
}


type Props = { patientId: number; encounterId: number };

export default function ROSList({ patientId, encounterId }: Props) {
    const [items, setItems] = useState<RosDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<RosDto | null>(null);

    // ui feedback
    const [busyId, setBusyId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    function notify(type: "success" | "error", msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 2500);
    }

    /** Load list */
    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithOrg(
                `/api/reviewofsystems/${patientId}/${encounterId}`,
                { headers: { Accept: "application/json" } }
            );

          //  const json = await safeJson<ApiResponse<any[]>>(res);
            const json = await safeJson<ApiResponse<unknown[]>>(res);

            if (!res.ok || !json?.success) {

                throw new Error(json?.message || `Load failed (${res.status})`);
            }

            const data = Array.isArray(json.data) ? json.data : [];
            setItems(data.map(toRosDto));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setItems([]);
        }
        finally {
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

    /** Delete */
    async function remove(id: number) {
        if (!confirm("Delete this ROS entry?")) return;
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/reviewofsystems/${patientId}/${encounterId}/${id}`,
                { method: "DELETE", headers: { Accept: "application/json" } }
            );

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
        }
        finally {
            setBusyId(null);
        }
    }

    /** eSign (backend) */
    async function esign(id: number) {
        try {
            setBusyId(id);
            const res = await fetchWithOrg(
                `/api/reviewofsystems/${patientId}/${encounterId}/${id}/esign`,
                { method: "POST", headers: { Accept: "application/json" } }
            );

            const json = await safeJson<ApiResponse<unknown>>(res);
            if (!res.ok || (json && json.success === false)) {
                throw new Error(json?.message || `eSign failed (${res.status})`);
            }
            notify("success", "ROS entry e-signed.");
            await load();
        } catch (e: unknown) {
            notify("error", e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setBusyId(null);
        }
    }

    /** Print (backend PDF/HTML) */
    // Replace the old printROS(...) with this version.
    async function printROS(id: number) {
        try {
            setBusyId(id);

            // Hit the backend through the same helper you use for all API calls
            const res = await fetchWithOrg(
                `/api/reviewofsystems/${patientId}/${encounterId}/${id}/print`,
                { method: "GET" }
            );
            if (!res.ok) throw new Error(`Print failed (${res.status})`);

            const ct = res.headers.get("content-type") || "";

            if (ct.includes("pdf")) {
                // Backend returns a PDF → open as blob
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const win = window.open(url, "_blank", "noopener,noreferrer");
                if (!win) throw new Error("Popup blocked. Allow popups to view the PDF.");
            } else {
                // Backend returns HTML → write it into a new tab
                const html = await res.text();
                const win = window.open("", "_blank", "noopener,noreferrer");
                if (!win) throw new Error("Popup blocked. Allow popups to view the document.");
                win.document.write(html);
                win.document.close();
            }
        } catch (e: unknown) {
            notify("error", e instanceof Error ? e.message : "Unable to print");
        }
        finally {
            setBusyId(null);
        }
    }

    /** newest first */
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
                    const readOnly = ros.esigned === true;
                    return (
                        <li key={ros.id} className="rounded-2xl border p-4 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">
                                        {ros.system} · {ros.status}
                                    </p>
                                    {ros.finding && <p className="text-gray-800">Findings: {ros.finding}</p>}
                                    {ros.notes && <p className="text-gray-700 whitespace-pre-wrap">{ros.notes}</p>}
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
