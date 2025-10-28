"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, EncounterDto } from "@/utils/types";

type Props = {
    patientId: number;
    editing?: EncounterDto | null;
    onSaved: (e: EncounterDto) => void;
    onCancel?: () => void;
};

export default function EncounterForm({ patientId, editing, onSaved, onCancel }: Props) {
    const [encounterDate, setEncounterDate] = useState("");
    const [reason, setReason] = useState("");
    const [status, setStatus] = useState<"OPEN" | "CLOSED">("OPEN");
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (editing && editing.id) {
            const iso =
                typeof editing.encounterDate === "string" ? editing.encounterDate.slice(0, 10) : "";
            setEncounterDate(iso);
            setReason(editing.reason || "");
            setStatus(editing.status === "OPEN" || editing.status === "CLOSED" ? editing.status : "OPEN");
        } else {
            setEncounterDate(new Date().toISOString().slice(0, 10));
            setReason("");
            setStatus("OPEN");
        }
    }, [editing]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setErr(null);
        try {
            const base: Omit<EncounterDto, "id"> = { patientId, encounterDate, reason, status };

            let method: "POST" | "PUT" = "POST";
            let url = `/api/encounters`;
            const payload: Partial<EncounterDto> =
                editing && editing.id ? { ...base, id: editing.id } : base;

            if (editing && editing.id) {
                method = "PUT";
                url = `/api/encounters/${editing.id}`;
            }

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(payload) });
            const json = (await res.json()) as ApiResponse<EncounterDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
            onSaved(json.data!);
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit Encounter" : "New Encounter"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                        type="date"
                        value={encounterDate}
                        onChange={(e) => setEncounterDate(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "OPEN" | "CLOSED")}
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                    >
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Reason</label>
                    <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Visit reason"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                    />
                </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? "Saving..." : editing?.id ? "Update" : "Save"}
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
