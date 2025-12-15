


"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, AssessmentDto } from "@/utils/types";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: AssessmentDto | null;
    onSaved: (saved: AssessmentDto) => void;
    onCancel?: () => void;
};

export default function Assessmentform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [diagnosisCode, setDiagnosisCode] = useState("");
    const [diagnosisName, setDiagnosisName] = useState("");
    const [status, setStatus] = useState<AssessmentDto["status"]>("Active");
    const [priority, setPriority] = useState<AssessmentDto["priority"]>("Primary");
    const [assessmentText, setAssessmentText] = useState("");
    const [notes, setNotes] = useState("");

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.assessment && !editing?.id) {
            const data = encounterData.assessment;
            setDiagnosisCode(data.diagnosisCode || "");
            setDiagnosisName(data.diagnosisName || "");
            setStatus(data.status || "Active");
            setPriority(data.priority || "Primary");
            setAssessmentText(data.assessmentText || "");
            setNotes(data.notes || "");
        } else if (editing?.id) {
            setDiagnosisCode(editing.diagnosisCode || "");
            setDiagnosisName(editing.diagnosisName || "");
            setStatus(editing.status || "Active");
            setPriority(editing.priority || "Primary");
            setAssessmentText(editing.assessmentText || "");
            setNotes(editing.notes || "");
        } else {
            setDiagnosisCode("");
            setDiagnosisName("");
            setStatus("Active");
            setPriority("Primary");
            setAssessmentText("");
            setNotes("");
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (diagnosisCode || diagnosisName || assessmentText || notes) {
            setEncounterSection(patientId, encounterId, "assessment", {
                diagnosisCode,
                diagnosisName,
                status,
                priority,
                assessmentText,
                notes
            });
        }
    }, [diagnosisCode, diagnosisName, status, priority, assessmentText, notes, patientId, encounterId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const body: AssessmentDto = {
                patientId,
                encounterId,
                ...(diagnosisCode ? { diagnosisCode: diagnosisCode.trim() } : {}),
                ...(diagnosisName ? { diagnosisName: diagnosisName.trim() } : {}),
                ...(status ? { status } : {}),
                ...(priority ? { priority } : {}),
                ...(assessmentText ? { assessmentText: assessmentText.trim() } : {}),
                ...(notes ? { notes: notes.trim() } : {}),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/assessment/${patientId}/${encounterId}/${editing.id}`
                : `/api/assessment/${patientId}/${encounterId}`;

            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<AssessmentDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

            onSaved(json.data!);
            removeEncounterSection(patientId, encounterId, "assessment");

            if (!editing?.id) {
                setDiagnosisCode(""); setDiagnosisName(""); setStatus("Active"); setPriority("Primary");
                setAssessmentText(""); setNotes("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit Assessment" : "Add Assessment"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Diagnosis Code (ICD-10) <span className="text-red-600">*</span></label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={diagnosisCode}
                        onChange={(e) => setDiagnosisCode(e.target.value)}
                        placeholder="e.g., M54.5"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Diagnosis Name <span className="text-red-600">*</span></label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={diagnosisName}
                        onChange={(e) => setDiagnosisName(e.target.value)}
                        placeholder="e.g., Low back pain"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as AssessmentDto["status"])}
                    >
                        <option value="Active">Active</option>
                        <option value="Resolved">Resolved</option>
                        <option value="RuleOut">Rule Out</option>
                        <option value="Differential">Differential</option>
                        <option value="Chronic">Chronic</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as AssessmentDto["priority"])}
                    >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Tertiary">Tertiary</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Assessment / Impression <span className="text-red-600">*</span></label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
                        value={assessmentText}
                        onChange={(e) => setAssessmentText(e.target.value)}
                        placeholder="Clinical impression, differentials, brief rationale"
                        required
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes <span className="text-red-600">*</span></label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes"
                        required
                    />
                </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex items-center gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? "Saving..." : editing?.id ? "Update" : "Save"}
                </button>
                {onCancel && (
                    <button type="button" onClick={() => { removeEncounterSection(patientId, encounterId, "assessment"); onCancel(); }} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
