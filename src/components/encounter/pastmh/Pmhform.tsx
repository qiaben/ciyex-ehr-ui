




"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PastMedicalHistoryDto } from "@/utils/types";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: PastMedicalHistoryDto | null;
    onSaved: (saved: PastMedicalHistoryDto) => void;
    onCancel?: () => void;
};

/** Safely read an ApiResponse<T>; returns null when body is empty or not JSON */
async function safeApiJson<T>(res: Response): Promise<ApiResponse<T> | null> {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text) as ApiResponse<T>;
    } catch {
        return null;
    }
}

export default function Pmhform({
                                    patientId,
                                    encounterId,
                                    editing,
                                    onSaved,
                                    onCancel,
                                }: Props) {
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.pastMedicalHistory && !editing?.id) {
            setDescription(encounterData.pastMedicalHistory.description || "");
        } else {
            setDescription(editing?.description ?? "");
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (description) {
            setEncounterSection(patientId, encounterId, "pastMedicalHistory", { description });
        }
    }, [description, patientId, encounterId]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!description.trim()) {
            setErr("Description is required.");
            return;
        }

        setSaving(true);
        setErr(null);

        try {
            const body = {
                description: description.trim(),
            };

            const url = editing?.id
                ? `/api/past-medical-history/${patientId}/${encounterId}/${editing.id}`
                : `/api/past-medical-history/${patientId}/${encounterId}`;

            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await safeApiJson<PastMedicalHistoryDto>(res);

            if (!res.ok) {
                throw new Error(json?.message || `Save failed (HTTP ${res.status})`);
            }
            if (!json) {
                throw new Error("Saved, but received an empty response from server.");
            }
            if (!json.success) {
                throw new Error(json.message || "Save failed");
            }

            onSaved(json.data!);
            removeEncounterSection(patientId, encounterId, "pastMedicalHistory");

            if (!editing?.id) {
                setDescription("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white"
            aria-label={editing?.id ? "Edit PMH Entry" : "Add PMH Entry"}
        >
            <h3 className="text-lg font-semibold">
                {editing?.id ? "Edit PMH Entry" : "Add PMH Entry"}
            </h3>

            <div className="grid grid-cols-1 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="pmh-description">
                        Description <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        id="pmh-description"
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-28"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='e.g., Patient has history of hypertension, diagnosed in 2018.'
                        required
                    />
                </div>
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
                        onClick={() => { removeEncounterSection(patientId, encounterId, "pastMedicalHistory"); onCancel(); }}
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
