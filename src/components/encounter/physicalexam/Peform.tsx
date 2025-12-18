






"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PhysicalExamDto, PhysicalExamSectionDto } from "@/utils/types";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: PhysicalExamDto | null;
    onSaved: (saved: PhysicalExamDto) => void;
    onCancel?: () => void;
};

const DEFAULT_KEYS: PhysicalExamSectionDto["sectionKey"][] = [
    "GENERAL",
    "HEENT",
    "NECK",
    "CARDIOVASCULAR",
    "RESPIRATORY",
    "ABDOMEN",
    "GENITOURINARY",
    "MUSCULOSKELETAL",
    "NEUROLOGICAL",
    "SKIN",
    "PSYCHIATRIC",
    "OTHER",
];

const NORMAL_TEXT_MAP: Record<string, string> = {
    GENERAL: "The patient is well-developed, well-nourished, and in no acute distress.",
    HEENT: "Head is normocephalic and atraumatic. Pupils are equally round and reactive to light and accommodation. Extraocular movements are intact. Sclerae are anicteric. TMs are clear bilaterally. Nasal mucosa and turbinates are normal. Oropharynx is clear without erythema or exudate.",
    NECK: "Supple. No JVD. No lymphadenopathy. No thyromegaly.",
    CARDIOVASCULAR: "Regular rate and rhythm without S3, S4. No murmurs, rubs, or gallops.",
    RESPIRATORY: "Clear to auscultation bilaterally. No wheezes, rales or rhonchi.",
    ABDOMEN: "The abdomen is soft, nontender, and nondistended with positive bowel sounds. No hepatomegaly, splenomegaly, masses, or bruits.",
    GENITOURINARY: "Normal genitalia.",
    MUSCULOSKELETAL: "Normal strength in all muscle groups. Normal range of motion of all joints. No joint effusions. No muscle masses. No clubbing, cyanosis, or edema.",
    NEUROLOGICAL: "Alert and oriented. Normal neurological examination.",
    SKIN: "No apparent rashes, lesions, or ulcers. On palpation, there are no evident indurations, masses, or subcutaneous nodules.",
    PSYCHIATRIC: "Alert and oriented x4. No delusions or hallucinations, no loose associations, no flight of ideas, no tangentiality. Affect is appropriate. No psychomotor slowing or agitation. Eye contact is appropriate.",
    OTHER: "",
};

function keyToTitle(k: string) {
    return k
        .toLowerCase()
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

export default function Peform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [summary, setSummary] = useState("");
    const [globalAllNormal, setGlobalAllNormal] = useState(false);
    const [sections, setSections] = useState<PhysicalExamSectionDto[]>(
        DEFAULT_KEYS.map((sectionKey) => ({
            sectionKey,
            allNormal: false,
            normalText: "",
            findings: "",
        }))
    );

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.physicalExam && !editing?.id) {
            const data = encounterData.physicalExam;
            setSummary(data.summary || "");
            setSections(data.sections || DEFAULT_KEYS.map((sectionKey) => ({
                sectionKey,
                allNormal: true,
                normalText: "",
                findings: "",
            })));
        } else if (editing?.id) {
            setSummary(editing.summary || "");
            const incoming = (editing.sections || []).map<PhysicalExamSectionDto>((s) => ({
                sectionKey: s.sectionKey,
                allNormal: !!s.allNormal,
                normalText: s.normalText || "",
                findings: s.findings || "",
            }));
            const mapped = [...incoming];
            DEFAULT_KEYS.forEach((k) => {
                if (!mapped.find((s) => s.sectionKey === k)) {
                    mapped.push({ sectionKey: k, allNormal: true, normalText: "", findings: "" });
                }
            });
            mapped.sort((a, b) => {
                const ia = DEFAULT_KEYS.indexOf(a.sectionKey);
                const ib = DEFAULT_KEYS.indexOf(b.sectionKey);
                return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            });
            setSections(mapped);
        } else {
            setSummary("");
            setSections(
                DEFAULT_KEYS.map((sectionKey) => ({
                    sectionKey,
                    allNormal: true,
                    normalText: "",
                    findings: "",
                }))
            );
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (summary || sections.some(s => s.normalText || s.findings)) {
            setEncounterSection(patientId, encounterId, "physicalExam", { summary, sections } as any);
        }
    }, [summary, sections, patientId, encounterId]);

    function updateSection(i: number, patch: Partial<PhysicalExamSectionDto>) {
        setSections((prev) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], ...patch };
            return copy;
        });
    }

    function handleGlobalAllNormalChange(checked: boolean) {
        setGlobalAllNormal(checked);
        if (checked) {
            setSections((prev) =>
                prev.map((s) => ({
                    ...s,
                    allNormal: true,
                    normalText: NORMAL_TEXT_MAP[s.sectionKey] || "",
                }))
            );
        } else {
            setSections((prev) =>
                prev.map((s) => ({
                    ...s,
                    allNormal: false,
                    normalText: "",
                }))
            );
        }
    }

    function addCustomSection() {
        const key = prompt(
            "Enter custom section key (UPPERCASE, no spaces — e.g., DENTAL or VASCULAR):"
        );
        if (!key) return;
        const sectionKey = key.trim().toUpperCase().replace(/\s+/g, "_");
        setSections((prev) => [
            ...prev,
            { sectionKey, allNormal: true, normalText: "", findings: "" },
        ]);
    }

    function removeSection(i: number) {
        setSections((prev) => prev.filter((_, idx) => idx !== i));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            // Keep sections that have content or explicitly set allNormal
            const clean = sections.filter(
                (s) =>
                    s.allNormal === true ||
                    (s.normalText && s.normalText.trim()) ||
                    (s.findings && s.findings.trim())
            );

            const body: PhysicalExamDto = {
                patientId,
                encounterId,
                ...(summary ? { summary: summary.trim() } : {}),
                sections: clean.map((s) => ({
                    sectionKey: s.sectionKey,
                    allNormal: !!s.allNormal,
                    ...(s.normalText ? { normalText: s.normalText.trim() } : {}),
                    ...(s.findings ? { findings: s.findings.trim() } : {}),
                })),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/physical-exam/${patientId}/${encounterId}/${editing.id}`
                : `/api/physical-exam/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<PhysicalExamDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

            onSaved(json.data!);
            removeEncounterSection(patientId, encounterId, "physicalExam");
            if (!editing?.id) {
                setSummary("");
                setSections(
                    DEFAULT_KEYS.map((sectionKey) => ({
                        sectionKey,
                        allNormal: true,
                        normalText: "",
                        findings: "",
                    }))
                );
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    {editing?.id ? "Edit Physical Exam" : "Add Physical Exam"}
                </h3>
                <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={globalAllNormal}
                            onChange={(e) => handleGlobalAllNormalChange(e.target.checked)}
                        />
                        All Normal
                    </label>
                    <button
                        type="button"
                        onClick={addCustomSection}
                        className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                    >
                        + Add Section
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Overall Summary</label>
                <textarea
                    className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief summary of overall physical exam"
                />
            </div>

            <div className="space-y-4">
                {sections.map((sec, i) => (
                    <div key={`${sec.sectionKey}-${i}`} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="font-medium">{keyToTitle(sec.sectionKey)}</p>
                            {!DEFAULT_KEYS.includes(sec.sectionKey) && (
                                <button
                                    type="button"
                                    onClick={() => removeSection(i)}
                                    className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                                    title="Remove custom section"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Normal</label>
                                <textarea
                                    className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20 disabled:bg-gray-50 disabled:text-gray-700"
                                    value={sec.normalText || ""}
                                    onChange={(e) => updateSection(i, { normalText: e.target.value })}
                                    placeholder="Enter normal findings"
                                    disabled={globalAllNormal}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Findings</label>
                                <textarea
                                    className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
                                    value={sec.findings || ""}
                                    onChange={(e) => updateSection(i, { findings: e.target.value })}
                                    placeholder="Enter any abnormal findings or additional observations"
                                />
                            </div>
                        </div>
                    </div>
                ))}
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
                    <button type="button" onClick={() => { removeEncounterSection(patientId, encounterId, "physicalExam"); onCancel(); }} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
