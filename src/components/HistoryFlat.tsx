"use client";
import React from "react";

export type ExamStatus = "N/A" | "Normal" | "Abnormal" | "";

export type HistoryForm = {
    general: {
        riskFactors: Record<string, boolean | string>;
        examsTests: Record<string, { status: ExamStatus; notes: string }>;
    };
    family: {
        father: string; diagFather: string;
        mother: string; diagMother: string;
        siblings: string; diagSiblings: string;
        spouse: string; diagSpouse: string;
        offspring: string; diagOffspring: string;
    };
    relatives: {
        cancer: string; diabetes: string; heartProblems: string; epilepsy: string;
        suicide: string; tuberculosis: string; hbp: string; stroke: string;
        mentalIllness: string;
    };
    lifestyle: {
        tobacco: { value: string; status: string };
        coffee: { value: string; status: string };
        alcohol: { value: string; status: string };
        drugs: { value: string; status: string };
        counseling: { value: string; status: string };
        exercise: { value: string; status: string };
        hazardous: { value: string; status: string };
        sleep: string;
        seatbelt: string;
    };
    other: { nameValue1: string; nameValue2: string; additionalHistory: string };
};

// ✅ Defaults kept here for rendering
export const defaultRiskFactors: Record<string, boolean | string> = {
    "Varicose Veins": false,
    "Hypertension": false,
    "Diabetes": false,
    "Sickle Cell": false,
    "Fibroids": false,
    "PID (Pelvic Inflammatory Disease)": false,
    "Severe Migraine": false,
    "Heart Disease": false,
    "Thrombosis/Stroke": false,
    "Hepatitis": false,
    "Gall Bladder Condition": false,
    "Breast Disease": false,
    "Depression": false,
    "Allergies": false,
    "Infertility": false,
    "Asthma": false,
    "Epilepsy": false,
    "Contact Lenses": false,
    "Contraceptive Complication (specify)": "",
    "Other (specify)": "",
};

export const defaultExams: Record<string, { status: ExamStatus; notes: string }> = {
    "Breast Exam": { status: "", notes: "" },
    "Cardiac Echo": { status: "", notes: "" },
    "ECG": { status: "", notes: "" },
    "Gynecological Exam": { status: "", notes: "" },
    "Mammogram": { status: "", notes: "" },
    "Physical Exam": { status: "", notes: "" },
    "Prostate Exam": { status: "", notes: "" },
    "Rectal Exam": { status: "", notes: "" },
    "Sigmoid/Colonoscopy": { status: "", notes: "" },
    "Retinal Exam": { status: "", notes: "" },
    "Flu Vaccination": { status: "", notes: "" },
    "Pneumonia Vaccination": { status: "", notes: "" },
    "LDL": { status: "", notes: "" },
    "Hemoglobin": { status: "", notes: "" },
    "PSA": { status: "", notes: "" },
};

export const defaultFamily = {
    father: "", diagFather: "",
    mother: "", diagMother: "",
    siblings: "", diagSiblings: "",
    spouse: "", diagSpouse: "",
    offspring: "", diagOffspring: "",
};

export const defaultRelatives = {
    cancer: "",
    diabetes: "",
    heartProblems: "",
    epilepsy: "",
    suicide: "",
    tuberculosis: "",
    hbp: "",
    stroke: "",
    mentalIllness: "",
};

export const lifestyleOptions: Record<string, string[]> = {
    tobacco: [
        "Unassigned",
        "Current every day smoker",
        "Current some day smoker",
        "Former smoker",
        "Never smoker",
        "Smoker, current status unknown",
        "Unknown if ever smoked",
        "Heavy tobacco smoker",
        "Light tobacco smoker",
    ],
    coffee: ["Unassigned", "None", "1-2 cups/day", "3-4 cups/day", "5+ cups/day", "Decaf only"],
    alcohol: [
        "Unassigned",
        "None",
        "Occasional (1-2 drinks/week)",
        "Moderate (3-7 drinks/week)",
        "Heavy (8+ drinks/week)",
        "Binge pattern",
    ],
    drugs: ["Unassigned", "None", "Occasional", "Recreational use", "Dependent use", "Recovering"],
    counseling: ["Unassigned", "None", "Past", "Current", "Psychological", "Substance abuse"],
    exercise: [
        "Unassigned",
        "None",
        "Light (1-2 times/week)",
        "Moderate (3-4 times/week)",
        "Intense (5+ times/week)",
        "Professional athlete",
    ],
    hazardous: ["Unassigned", "None", "Occasional risk", "Frequent risk", "Occupational hazard"],
};

export const defaultOther = {
    nameValue1: "",
    nameValue2: "",
    additionalHistory: "",
};

type Props = {
    historyForm: HistoryForm;
    setHistoryForm: React.Dispatch<React.SetStateAction<HistoryForm>>;
    editHistory: boolean;
    setEditHistory: (v: boolean) => void;
    activeHistoryTab: keyof HistoryForm;
    setActiveHistoryTab: (tab: keyof HistoryForm) => void;
    saveHistory: () => Promise<void>;
};

const HistoryFlat: React.FC<Props> = ({
                                          historyForm,
                                          setHistoryForm,
                                          editHistory,
                                          setEditHistory,
                                          activeHistoryTab,
                                          setActiveHistoryTab,
                                          saveHistory,
                                      }) => {
    const sectionLabels: Record<keyof HistoryForm, string> = {
        general: "General",
        family: "Family History",
        relatives: "Relatives",
        lifestyle: "Lifestyle",
        other: "Other",
    };

    const statuses: string[] = ["Current", "Quit", "Never", "N/A"];

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">History & Lifestyle</h4>
                <div className="flex gap-2">
                    {editHistory ? (
                        <>
                            <button
                                onClick={async () => { await saveHistory(); setEditHistory(false); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditHistory(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditHistory(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(Object.keys(sectionLabels) as Array<keyof HistoryForm>).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveHistoryTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-t ${
                            activeHistoryTab === tab
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {sectionLabels[tab]}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeHistoryTab === "general" && (
                <div>
                    <h5 className="font-semibold mb-2">Risk Factors</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(defaultRiskFactors).map(([k]) => {
                            const value = historyForm.general.riskFactors[k] ?? defaultRiskFactors[k];
                            return typeof value === "boolean" ? (
                                <label key={k} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        disabled={!editHistory}
                                        checked={value}
                                        onChange={(e) =>
                                            setHistoryForm((prev) => ({
                                                ...prev,
                                                general: {
                                                    ...prev.general,
                                                    riskFactors: { ...prev.general.riskFactors, [k]: e.target.checked },
                                                },
                                            }))
                                        }
                                    />
                                    {k}
                                </label>
                            ) : (
                                <div key={k} className="col-span-2">
                                    <label className="block">{k}</label>
                                    <input
                                        className="w-full border rounded px-2 py-1"
                                        disabled={!editHistory}
                                        value={value as string}
                                        onChange={(e) =>
                                            setHistoryForm((prev) => ({
                                                ...prev,
                                                general: {
                                                    ...prev.general,
                                                    riskFactors: { ...prev.general.riskFactors, [k]: e.target.value },
                                                },
                                            }))
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <h5 className="font-semibold mt-4 mb-2">Exams/Tests</h5>
                    <table className="w-full border text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-2 py-1 text-left">Exam or Test</th>
                            <th className="border px-2 py-1 text-center">N/A</th>
                            <th className="border px-2 py-1 text-center">Nor</th>
                            <th className="border px-2 py-1 text-center">Abn</th>
                            <th className="border px-2 py-1 text-left">Date/Notes</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(defaultExams).map(([exam, def]) => {
                            const data = historyForm.general.examsTests[exam] || def; // ✅ fallback
                            return (
                                <tr key={exam}>
                                    <td className="border px-2 py-1">{exam}</td>
                                    {["N/A", "Normal", "Abnormal"].map((s) => (
                                        <td key={s} className="border px-2 py-1 text-center">
                                            <input
                                                type="radio"
                                                name={exam}
                                                disabled={!editHistory}
                                                checked={data.status === s}
                                                onChange={() =>
                                                    setHistoryForm((prev) => ({
                                                        ...prev,
                                                        general: {
                                                            ...prev.general,
                                                            examsTests: {
                                                                ...prev.general.examsTests,
                                                                [exam]: { ...data, status: s as ExamStatus },
                                                            },
                                                        },
                                                    }))
                                                }
                                            />
                                        </td>
                                    ))}
                                    <td className="border px-2 py-1">
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            disabled={!editHistory}
                                            value={data.notes}
                                            onChange={(e) =>
                                                setHistoryForm((prev) => ({
                                                    ...prev,
                                                    general: {
                                                        ...prev.general,
                                                        examsTests: {
                                                            ...prev.general.examsTests,
                                                            [exam]: { ...data, notes: e.target.value },
                                                        },
                                                    },
                                                }))
                                            }
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Family Tab */}
            {activeHistoryTab === "family" && (
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(defaultFamily).map(([field]) => (
                        <div key={field}>
                            <label className="block">{field}</label>
                            <input
                                className="w-full border rounded px-2 py-1"
                                disabled={!editHistory}
                                value={historyForm.family[field as keyof typeof historyForm.family] ?? ""}
                                onChange={(e) =>
                                    setHistoryForm((prev) => ({
                                        ...prev,
                                        family: { ...prev.family, [field]: e.target.value },
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Relatives Tab */}
            {activeHistoryTab === "relatives" && (
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(defaultRelatives).map(([field]) => (
                        <div key={field}>
                            <label className="block">{field}</label>
                            <input
                                className="w-full border rounded px-2 py-1"
                                disabled={!editHistory}
                                value={historyForm.relatives[field as keyof typeof historyForm.relatives] ?? ""}
                                onChange={(e) =>
                                    setHistoryForm((prev) => ({
                                        ...prev,
                                        relatives: { ...prev.relatives, [field]: e.target.value },
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Lifestyle Tab */}

            {activeHistoryTab === "lifestyle" && (
                <div className="space-y-4">
                    {Object.entries(historyForm.lifestyle).map(([field, val]) => {

                        // Sleep & Seatbelt are plain text inputs
                        if (typeof val === "string") {
                            return (
                                <div key={field} className="grid grid-cols-12 gap-2 items-center">
                                    <label className="col-span-2 font-medium">{field}:</label>
                                    <input
                                        className="col-span-10 border rounded px-2 py-1"
                                        disabled={!editHistory}
                                        value={val}
                                        onChange={(e) =>
                                            setHistoryForm((prev) => ({
                                                ...prev,
                                                lifestyle: { ...prev.lifestyle, [field]: e.target.value },
                                            }))
                                        }
                                    />
                                </div>
                            );
                        }

                        // Dropdown + status radios
                        const options = lifestyleOptions[field] || ["Unassigned"];

                        return (
                            <div key={field} className="grid grid-cols-12 gap-2 items-center">
                                {/* Label */}
                                <label className="col-span-2 font-medium">{field}:</label>

                                {/* Dropdown */}
                                <select
                                    className="col-span-3 border rounded px-2 py-1"
                                    disabled={!editHistory}
                                    value={val.value}
                                    onChange={(e) =>
                                        setHistoryForm((prev) => ({
                                            ...prev,
                                            lifestyle: {
                                                ...prev.lifestyle,
                                                [field]: { ...val, value: e.target.value },
                                            },
                                        }))
                                    }
                                >
                                    {options.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>

                                {/* Status radios */}
                                <div className="col-span-7 flex gap-4 items-center">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    {statuses.map((s) => (
                                        <label key={s} className="flex items-center gap-1">
                                            <input
                                                type="radio"
                                                disabled={!editHistory}
                                                checked={val.status === s}
                                                onChange={() =>
                                                    setHistoryForm((prev) => ({
                                                        ...prev,
                                                        lifestyle: {
                                                            ...prev.lifestyle,
                                                            [field]: { ...val, status: s },
                                                        },
                                                    }))
                                                }
                                            />
                                            {s}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Other Tab */}
            {activeHistoryTab === "other" && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block">Name/Value 1</label>
                        <input
                            className="w-full border rounded px-2 py-1"
                            disabled={!editHistory}
                            value={historyForm.other.nameValue1 ?? ""}
                            onChange={(e) =>
                                setHistoryForm((prev) => ({
                                    ...prev,
                                    other: { ...prev.other, nameValue1: e.target.value },
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label className="block">Name/Value 2</label>
                        <input
                            className="w-full border rounded px-2 py-1"
                            disabled={!editHistory}
                            value={historyForm.other.nameValue2 ?? ""}
                            onChange={(e) =>
                                setHistoryForm((prev) => ({
                                    ...prev,
                                    other: { ...prev.other, nameValue2: e.target.value },
                                }))
                            }
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block">Additional History</label>
                        <textarea
                            className="w-full border rounded px-2 py-1"
                            rows={3}
                            disabled={!editHistory}
                            value={historyForm.other.additionalHistory ?? ""}
                            onChange={(e) =>
                                setHistoryForm((prev) => ({
                                    ...prev,
                                    other: { ...prev.other, additionalHistory: e.target.value },
                                }))
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryFlat;
