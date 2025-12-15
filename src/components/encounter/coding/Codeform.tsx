"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, CodeDto } from "@/utils/types";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: CodeDto | null;
    onSaved: (saved: CodeDto) => void;
    onCancel?: () => void;
};

const CODE_TYPES: CodeDto["codeType"][] = ["CPT", "HCPCS", "ICD10", "ICD10PCS", "Modifier", "Other"];

export default function CodeForm({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [codeType, setCodeType] = useState<CodeDto["codeType"]>("ICD10");
    const [code, setCode] = useState("");
    const [modifier, setModifier] = useState<string>("");
    const [active, setActive] = useState(true);
    const [description, setDescription] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [category, setCategory] = useState("");
    const [diagnosisReporting, setDiagnosisReporting] = useState<boolean>(false);
    const [serviceReporting, setServiceReporting] = useState<boolean>(false);
    const [relateTo, setRelateTo] = useState("");
    const [feeStandard, setFeeStandard] = useState<number | "">("");

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.code && !editing?.id) {
            const data = encounterData.code;
            setCodeType((data.codeType as CodeDto["codeType"]) || "ICD10");
            setCode(data.code || "");
            setModifier(data.modifier ?? "");
            setActive(data.active ?? true);
            setDescription(data.description || "");
            setShortDescription((data as any).shortDescription || "");
            setCategory((data as any).category || "");
            setDiagnosisReporting(data.diagnosisReporting ?? false);
            setServiceReporting(data.serviceReporting ?? false);
            setRelateTo((data as any).relateTo || "");
            setFeeStandard((data as any).feeStandard ?? "");
        } else if (editing?.id) {
            setCodeType((editing.codeType as CodeDto["codeType"]) || "ICD10");
            setCode(editing.code || "");
            setModifier(editing.modifier ?? "");
            setActive(!!editing.active);
            setDescription(editing.description || "");
            setShortDescription(editing.shortDescription || "");
            setCategory(editing.category || "");
            setDiagnosisReporting(!!editing.diagnosisReporting);
            setServiceReporting(!!editing.serviceReporting);
            setRelateTo(editing.relateTo || "");
            setFeeStandard(typeof editing.feeStandard === "number" ? editing.feeStandard : "");
        } else {
            setCodeType("ICD10");
            setCode("");
            setModifier("");
            setActive(true);
            setDescription("");
            setShortDescription("");
            setCategory("");
            setDiagnosisReporting(false);
            setServiceReporting(false);
            setRelateTo("");
            setFeeStandard("");
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (code || description) {
            setEncounterSection(patientId, encounterId, "code", {
                codeType,
                code,
                modifier,
                active,
                description,
                diagnosisReporting,
                serviceReporting
            } as any);
        }
    }, [codeType, code, modifier, active, description, diagnosisReporting, serviceReporting, patientId, encounterId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const body: CodeDto = {
                patientId,
                encounterId,
                codeType,
                code: code.trim(),
                active,
                ...(modifier ? { modifier: modifier.trim() } : { modifier: null }),
                ...(description ? { description: description.trim() } : {}),
                ...(shortDescription ? { shortDescription: shortDescription.trim() } : {}),
                ...(category ? { category: category.trim() } : {}),
                ...(diagnosisReporting ? { diagnosisReporting } : {}),
                ...(serviceReporting ? { serviceReporting } : {}),
                ...(relateTo ? { relateTo: relateTo.trim() } : {}),
                ...(feeStandard !== "" ? { feeStandard: Number(feeStandard) } : {}),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/codes/${patientId}/${encounterId}/${editing.id}`
                : `/api/codes/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<CodeDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

            onSaved(json.data!);
            removeEncounterSection(patientId, encounterId, "code");

            if (!editing?.id) {
                setCodeType("ICD10");
                setCode("");
                setModifier("");
                setActive(true);
                setDescription("");
                setShortDescription("");
                setCategory("");
                setDiagnosisReporting(false);
                setServiceReporting(false);
                setRelateTo("");
                setFeeStandard("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit Code" : "Add Code"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Code Type</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={codeType}
                        onChange={(e) => setCodeType(e.target.value as CodeDto["codeType"])}
                    >
                        {CODE_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Code</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g., I10 / 99214"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Modifier</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={modifier}
                        onChange={(e) => setModifier(e.target.value)}
                        placeholder="Optional"
                    />
                </div>

                <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='e.g., "Essential (primary) hypertension"'
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Short Description</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="e.g., Hypertension"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Diagnosis / Procedure / ..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Relate To</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={relateTo}
                        onChange={(e) => setRelateTo(e.target.value)}
                        placeholder="e.g., Cardiology"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Fee Standard</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={feeStandard}
                        onChange={(e) => setFeeStandard(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g., 100.00"
                    />
                </div>

                <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Reporting</label>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" className="h-4 w-4" checked={diagnosisReporting} onChange={(e) => setDiagnosisReporting(e.target.checked)} />
                            Diagnosis Reporting
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" className="h-4 w-4" checked={serviceReporting} onChange={(e) => setServiceReporting(e.target.checked)} />
                            Service Reporting
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" className="h-4 w-4" checked={active} onChange={(e) => setActive(e.target.checked)} />
                            Active
                        </label>
                    </div>
                </div>
            </div>

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
                    <button type="button" onClick={() => { removeEncounterSection(patientId, encounterId, "code"); onCancel(); }} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}