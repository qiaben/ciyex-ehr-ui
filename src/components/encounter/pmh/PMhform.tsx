




"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PatientMedicalHistoryDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: PatientMedicalHistoryDto | null;
    onSaved: (x: PatientMedicalHistoryDto) => void;
    onCancel?: () => void;
};

export default function PMhform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setDescription(editing?.description || "");
    }, [editing]);

    async function submit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        try {
            const body: PatientMedicalHistoryDto = {
                patientId,
                encounterId,
                description: description.trim(),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/patient-medical-history/${patientId}/${encounterId}/${editing.id}`
                : `/api/patient-medical-history/${patientId}/${encounterId}`;

            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<PatientMedicalHistoryDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
            onSaved(json.data!);
            setDescription("");
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit History" : "Add History"}</h3>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter medical history details"
                className="w-full min-h-28 rounded-lg border px-3 py-2 focus:ring"
                required
            />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-2">
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
                        onClick={onCancel}
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
