// "use client";
//
// import { useEffect, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, PhysicalExamDto, PhysicalExamSectionDto } from "@/utils/types";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
//     editing?: PhysicalExamDto | null;
//     onSaved: (saved: PhysicalExamDto) => void;
//     onCancel?: () => void;
// };
//
// const DEFAULT_SECTIONS = [
//     "General",
//     "HEENT",
//     "Neck",
//     "Cardiovascular",
//     "Respiratory",
//     "Abdomen",
//     "Genitourinary",
//     "Musculoskeletal",
//     "Neurological",
//     "Skin",
//     "Psychiatric",
// ];
//
// const STATUS: Array<PhysicalExamSectionDto["status"]> = ["Normal", "Abnormal", "NotExamined"];
//
// export default function Peform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
//     const [summary, setSummary] = useState("");
//     const [sections, setSections] = useState<PhysicalExamSectionDto[]>(
//         DEFAULT_SECTIONS.map((name) => ({ name, status: "NotExamined", finding: "", notes: "" }))
//     );
//
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState<string | null>(null);
//
//     useEffect(() => {
//         if (editing?.id) {
//             setSummary(editing.summary || "");
//             // Normalize incoming sections by defaulting missing fields
//             const incoming = (editing.sections || []).map((s) => ({
//                 name: s.name,
//                 status: s.status || "NotExamined",
//                 finding: s.finding || "",
//                 notes: s.notes || "",
//             }));
//             // Ensure all DEFAULT_SECTIONS exist (keep extra ones too)
//             const mapped = [...incoming];
//             DEFAULT_SECTIONS.forEach((name) => {
//                 if (!mapped.find((s) => s.name === name)) {
//                     mapped.push({ name, status: "NotExamined", finding: "", notes: "" });
//                 }
//             });
//             // Keep a stable order using DEFAULT_SECTIONS first, then any custom sections
//             mapped.sort(
//                 (a, b) =>
//                     (DEFAULT_SECTIONS.indexOf(a.name) === -1 ? 999 : DEFAULT_SECTIONS.indexOf(a.name)) -
//                     (DEFAULT_SECTIONS.indexOf(b.name) === -1 ? 999 : DEFAULT_SECTIONS.indexOf(b.name))
//             );
//             setSections(mapped);
//         } else {
//             setSummary("");
//             setSections(DEFAULT_SECTIONS.map((name) => ({ name, status: "NotExamined", finding: "", notes: "" })));
//         }
//     }, [editing]);
//
//     function updateSection(i: number, patch: Partial<PhysicalExamSectionDto>) {
//         setSections((prev) => {
//             const copy = [...prev];
//             copy[i] = { ...copy[i], ...patch };
//             return copy;
//         });
//     }
//
//     function addCustomSection() {
//         const name = prompt("Enter custom section name:");
//         if (!name) return;
//         setSections((prev) => [...prev, { name, status: "NotExamined", finding: "", notes: "" }]);
//     }
//
//     function removeSection(i: number) {
//         setSections((prev) => prev.filter((_, idx) => idx !== i));
//     }
//
//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setSaving(true);
//         setErr(null);
//
//         try {
//             // Only keep sections that have at least a status other than NotExamined OR any text
//             const cleanSections = sections.filter(
//                 (s) => s.status !== "NotExamined" || (s.finding && s.finding.trim()) || (s.notes && s.notes.trim())
//             );
//
//             const body: PhysicalExamDto = {
//                 patientId,
//                 encounterId,
//                 ...(summary ? { summary: summary.trim() } : {}),
//                 sections: cleanSections.map((s) => ({
//                     name: s.name,
//                     status: s.status || "NotExamined",
//                     ...(s.finding ? { finding: s.finding.trim() } : {}),
//                     ...(s.notes ? { notes: s.notes.trim() } : {}),
//                 })),
//                 ...(editing?.id ? { id: editing.id } : {}),
//             };
//
//             const url = editing?.id
//                 ? `/api/physical-exam/${patientId}/${encounterId}/${editing.id}`
//                 : `/api/physical-exam/${patientId}/${encounterId}`;
//
//             const method = editing?.id ? "PUT" : "POST";
//
//             const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
//             const json = (await res.json()) as ApiResponse<PhysicalExamDto>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
//
//             onSaved(json.data!);
//             if (!editing?.id) {
//                 setSummary("");
//                 setSections(DEFAULT_SECTIONS.map((name) => ({ name, status: "NotExamined", finding: "", notes: "" })));
//             }
//         } catch (e: unknown) {
//             setErr(e instanceof Error ? e.message : "Something went wrong");
//         } finally {
//             setSaving(false);
//         }
//     }
//
//     return (
//         <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
//             <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-semibold">{editing?.id ? "Edit Physical Exam" : "Add Physical Exam"}</h3>
//                 <button
//                     type="button"
//                     onClick={addCustomSection}
//                     className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
//                 >
//                     + Add Section
//                 </button>
//             </div>
//
//             <div>
//                 <label className="block text-sm font-medium mb-1">Overall Summary</label>
//                 <textarea
//                     className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
//                     value={summary}
//                     onChange={(e) => setSummary(e.target.value)}
//                     placeholder="Brief summary of overall physical exam"
//                 />
//             </div>
//
//             <div className="space-y-4">
//                 {sections.map((sec, i) => (
//                     <div key={`${sec.name}-${i}`} className="rounded-xl border p-3">
//                         <div className="flex items-center justify-between gap-2">
//                             <p className="font-medium">{sec.name}</p>
//                             <div className="flex items-center gap-2">
//                                 <select
//                                     className="rounded-lg border px-2 py-1 focus:ring"
//                                     value={sec.status || "NotExamined"}
//                                     onChange={(e) => updateSection(i, { status: e.target.value as PhysicalExamSectionDto["status"] })}
//                                 >
//                                     {STATUS.map((s) => (
//                                         <option key={s} value={s}>{s}</option>
//                                     ))}
//                                 </select>
//                                 {DEFAULT_SECTIONS.includes(sec.name) ? null : (
//                                     <button
//                                         type="button"
//                                         onClick={() => removeSection(i)}
//                                         className="rounded-lg border px-2 py-1 hover:bg-gray-50"
//                                         title="Remove custom section"
//                                     >
//                                         Remove
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//
//                         <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
//                             <div>
//                                 <label className="block text-sm font-medium mb-1">Finding</label>
//                                 <input
//                                     className="w-full rounded-lg border px-3 py-2 focus:ring"
//                                     value={sec.finding || ""}
//                                     onChange={(e) => updateSection(i, { finding: e.target.value })}
//                                     placeholder="e.g., NAD, CTA bilaterally, RRR, NT/ND"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1">Notes</label>
//                                 <input
//                                     className="w-full rounded-lg border px-3 py-2 focus:ring"
//                                     value={sec.notes || ""}
//                                     onChange={(e) => updateSection(i, { notes: e.target.value })}
//                                     placeholder="Optional details"
//                                 />
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//
//             {err && <p className="text-sm text-red-600">{err}</p>}
//
//             <div className="flex items-center gap-2">
//                 <button
//                     type="submit"
//                     disabled={saving}
//                     className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
//                 >
//                     {saving ? "Saving..." : editing?.id ? "Update" : "Save"}
//                 </button>
//                 {onCancel && (
//                     <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
//                         Cancel
//                     </button>
//                 )}
//             </div>
//         </form>
//     );
// }







"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PhysicalExamDto, PhysicalExamSectionDto } from "@/utils/types";

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

function keyToTitle(k: string) {
    return k
        .toLowerCase()
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

export default function Peform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [summary, setSummary] = useState(""); // keep if your DTO supports it
    const [sections, setSections] = useState<PhysicalExamSectionDto[]>(
        DEFAULT_KEYS.map((sectionKey) => ({
            sectionKey,
            allNormal: true,
            normalText: "",
            findings: "",
        }))
    );

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (editing?.id) {
            setSummary(editing.summary || "");
            // normalize incoming + ensure all default keys exist
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
            // put defaults first in a consistent order, then custom keys
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
    }, [editing]);

    function updateSection(i: number, patch: Partial<PhysicalExamSectionDto>) {
        setSections((prev) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], ...patch };
            return copy;
        });
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
                <button
                    type="button"
                    onClick={addCustomSection}
                    className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                >
                    + Add Section
                </button>
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
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{keyToTitle(sec.sectionKey)}</p>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!sec.allNormal}
                                        onChange={(e) => updateSection(i, { allNormal: e.target.checked })}
                                    />
                                    All Normal
                                </label>
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
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Normal Text</label>
                                <input
                                    className="w-full rounded-lg border px-3 py-2 focus:ring"
                                    value={sec.normalText || ""}
                                    onChange={(e) => updateSection(i, { normalText: e.target.value })}
                                    placeholder='e.g., "Well-nourished, no acute distress"'
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Findings</label>
                                <input
                                    className="w-full rounded-lg border px-3 py-2 focus:ring"
                                    value={sec.findings || ""}
                                    onChange={(e) => updateSection(i, { findings: e.target.value })}
                                    placeholder='e.g., "Mild nasal congestion"'
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
                    <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
