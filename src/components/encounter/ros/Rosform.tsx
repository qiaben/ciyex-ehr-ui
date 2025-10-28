


"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, RosDto } from "@/utils/types";

// split "a, b\nc" → ["a","b","c"]
function splitDetails(s: string): string[] {
    return s
        .split(/[,;\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
}

// Convert backend → UI
// function toRosDto(b: any): RosDto {
//     return {
//         id: b.id,
//         patientId: b.patientId,
//         encounterId: b.encounterId,
//         system: b.systemName,
//         status: b.isNegative ? "Negative" : "Positive",
//         finding: Array.isArray(b.systemDetails) ? b.systemDetails.join(", ") : "",
//         notes: b.notes ?? "",
//         audit: {
//             createdDate: b.createdDate,
//             lastModifiedDate: b.lastModifiedDate,
//         },
//     };
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
        audit: {
            createdDate: rec.createdDate as string | undefined,
            lastModifiedDate: rec.lastModifiedDate as string | undefined,
        },
    };
}


// Safe JSON
async function safeJson<T>(res: Response): Promise<T | null> {
    const t = await res.text().catch(() => "");
    if (!t) return null;
    try { return JSON.parse(t) as T; } catch { return null; }
}

type Props = {
    patientId: number;
    encounterId: number;
    editing?: RosDto | null;
    onSaved: (saved: RosDto) => void;
    onCancel?: () => void;
};

const ROS_SYSTEMS = [
    "Constitutional","Eyes","ENT","Cardiovascular","Respiratory","Gastrointestinal",
    "Genitourinary","Musculoskeletal","Skin","Neurological","Psychiatric",
    "Endocrine","Hematologic/Lymphatic","Allergic/Immunologic",
];

export default function ROSForm({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [system, setSystem] = useState(ROS_SYSTEMS[0]);
    const [status, setStatus] = useState<"Positive" | "Negative" | "NotAsked">("Negative");
    const [finding, setFinding] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (editing?.id) {
            setSystem(editing.system || ROS_SYSTEMS[0]);
            setStatus(editing.status || "Negative");
            setFinding(editing.finding || "");
            setNotes(editing.notes || "");
        } else {
            setSystem(ROS_SYSTEMS[0]);
            setStatus("Negative");
            setFinding("");
            setNotes("");
        }
    }, [editing]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            // Map UI → backend payload
            const payload = {
                systemName: system,
                isNegative: status !== "Positive", // Positive => false; Negative/NotAsked => true
                ...(notes.trim() ? { notes: notes.trim() } : {}),
                systemDetails:
                    status === "Positive" && finding.trim()
                        ? splitDetails(finding)
                        : [],
            };

            const url = editing?.id
                ? `/api/reviewofsystems/${patientId}/${encounterId}/${editing.id}`
                : `/api/reviewofsystems/${patientId}/${encounterId}`;

            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, {
                method,
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
            });

          //  const json = await safeJson<ApiResponse<any>>(res);
            const json = await safeJson<ApiResponse<unknown>>(res);

            if (!res.ok || !json || json.success !== true) {
                throw new Error(json?.message || `Save failed (${res.status})`);
            }

            onSaved(toRosDto(json.data));
            if (!editing?.id) {
                setSystem(ROS_SYSTEMS[0]);
                setStatus("Negative");
                setFinding("");
                setNotes("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit ROS Entry" : "Add ROS Entry"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">System</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={system}
                        onChange={(e) => setSystem(e.target.value)}
                    >
                        {ROS_SYSTEMS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "Positive" | "Negative" | "NotAsked")}
                    >
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="NotAsked">NotAsked</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Finding (if Positive)</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={finding}
                        onChange={(e) => setFinding(e.target.value)}
                        placeholder="e.g., chest pain, shortness of breath"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional comments"
                    />
                </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex items-center gap-2">
                <button type="submit" disabled={saving}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? "Saving..." : editing?.id ? "Update" : "Save"}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
