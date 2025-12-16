


"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, ChiefComplaintDto } from "@/utils/types";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: ChiefComplaintDto | null;
    onSaved: (saved: ChiefComplaintDto) => void;
    onCancel?: () => void;
};

export default function Chiefcomplaintform({
                                               patientId,
                                               encounterId,
                                               editing,
                                               onSaved,
                                               onCancel,
                                           }: Props) {
    const [complaint, setComplaint] = useState("");
    const [details, setDetails] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.chiefComplaint && !editing?.id) {
            setComplaint(encounterData.chiefComplaint.complaint || "");
            setDetails(encounterData.chiefComplaint.details || "");
        } else {
            setComplaint(editing?.complaint ?? "");
            setDetails(editing?.details ?? "");
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (complaint || details) {
            setEncounterSection(patientId, encounterId, "chiefComplaint", {
                complaint,
                details,
                patientId,
                encounterId
            });
        }
    }, [complaint, details, patientId, encounterId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        try {
            const body: ChiefComplaintDto = {
                patientId,
                encounterId,
                complaint: complaint.trim(),
                details: details.trim(),
                ...(editing?.id ? {id: editing.id} : {}),
            };

            const url = editing?.id
                ? `/api/chief-complaints/${patientId}/${encounterId}/${editing.id}`
                : `/api/chief-complaints/${patientId}/${encounterId}`;

            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, {
                method,
                body: JSON.stringify(body),
            });

            const json = (await res.json()) as ApiResponse<ChiefComplaintDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
            onSaved(json.data!);
            removeEncounterSection(patientId, encounterId, "chiefComplaint");
            if (!editing?.id) {
                setComplaint("");
                setDetails("");
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                setErr(e.message || "Something went wrong");
            } else {
                setErr("Something went wrong");
            }
        }
    }

        return (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">
                {editing?.id ? "Edit Chief Complaint" : "Add Chief Complaint"}
            </h3>

            <div>
                <label className="block text-sm font-medium mb-1">Complaint <span className="text-red-600">*</span></label>
                <input
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="e.g., neck pain, headache"
                    className="w-full rounded-lg border px-3 py-2 focus:ring"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Details </label>
                <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Clinical details or context"
                    className="w-full min-h-28 rounded-lg border px-3 py-2 focus:ring"
                    required
                />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {saving ? "Saving..." : editing?.id ? "Update" : "Save"}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={() => { removeEncounterSection(patientId, encounterId, "chiefComplaint"); onCancel(); }}
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
