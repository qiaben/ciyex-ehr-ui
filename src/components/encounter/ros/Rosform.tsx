"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, RosDto } from "@/utils/types";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

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

const SYSTEMS = [
    { key: "constitutional", label: "Constitutional", fields: ["fever", "chills", "nightSweats", "lossOfAppetite", "weightLoss", "weightGain", "fatigue", "weakness", "tiredness", "troubleSleeping"] },
    { key: "eyes", label: "Eyes", fields: ["visionLoss", "doubleVision", "blurredVision", "eyeIrritation", "eyePain", "eyeDischarge", "lightSensitivity", "eyeRedness"] },
    { key: "ent", label: "ENT", fields: ["earache", "earDischarge", "ringingInEars", "decreasedHearing", "frequentColds", "nasalCongestion", "nosebleeds", "bleedingGums", "difficultySwallowing", "hoarseness", "soreThroat", "dryLips", "redSwollenTongue", "toothAche", "sinusitis", "dryMouth"] },
    { key: "neck", label: "Neck", fields: ["thyroidEnlargement", "neckPain"] },
    { key: "cardiovascular", label: "Cardiovascular", fields: ["difficultyBreathingAtNight", "chestPain", "irregularHeartbeats", "shortnessOfBreathOnExertion", "palpitations", "difficultyBreathingWhenLyingDown", "rapidHeartbeat", "slowHeartbeat", "lossOfConsciousness", "chestDiscomfort", "chestTightness", "legSwelling", "legCramps", "tortuousLegVeins"] },
    { key: "respiratory", label: "Respiratory", fields: ["shortnessOfBreath", "wheezing", "cough", "chestDiscomfort", "snoring", "excessiveSputum", "coughingUpBlood", "painfulBreathing"] },
    { key: "gastrointestinal", label: "Gastrointestinal", fields: ["changeInAppetite", "indigestion", "heartburn", "nausea", "vomiting", "excessiveGas", "abdominalPain", "abdominalBloating", "hemorrhoids", "diarrhea", "changeInBowelHabits", "constipation", "blackOrTarryStools", "bloodyStools", "abdominalSwelling", "enlargedLiver", "jaundice", "ascites", "vomitingBlood", "distendedAbdomen", "clayColoredStool"] },
    { key: "genitourinaryMale", label: "Genitourinary (Male)", fields: ["frequentUrination", "bloodInUrine", "foulUrinaryDischarge", "kidneyPain", "urinaryUrgency", "troubleStartingUrine", "inabilityToEmptyBladder", "burningOnUrination", "genitalRashesOrSores", "testicularPainOrMasses", "urinaryRetention", "leakingUrine", "excessiveNightUrination", "urinaryHesitancy", "kidneyStones", "hernia", "penileDischarge", "shortWeakErections", "painfulErection", "decreasedSexualDesire", "prematureEjaculation"] },
    { key: "genitourinaryFemale", label: "Genitourinary (Female)", fields: ["inabilityToControlBladder", "unusualUrinaryColor", "missedPeriods", "excessivelyHeavyPeriods", "lumpsOrSores", "pelvicPain", "urinaryRetention", "vaginalDischarge", "vaginalItching", "vaginalRash", "urinaryFrequency", "urinaryHesitancy", "excessiveNightUrination", "urinaryUrgency", "painfulMenstruation", "irregularMenses", "kidneyStones"] },
    { key: "musculoskeletal", label: "Musculoskeletal", fields: ["jointPain", "jointStiffness", "backPain", "muscleCramps", "muscleWeakness", "muscleAches", "lossOfStrength", "neckPain", "swellingHandsFeet", "legCramps", "shoulderPain", "elbowPain", "handPain", "hipPain", "thighPain", "calfPain", "legPain", "wristPain", "fingerPain", "heelPain", "toePain", "anklePain", "kneePain"] },
    { key: "skin", label: "Skin", fields: ["suspiciousLesions", "excessivePerspiration", "poorWoundHealing", "dryness", "itching", "rash", "flushing", "cyanosis", "clammySkin", "hairLoss", "lumps", "changesInHairOrNails", "skinColorChanges", "jaundice"] },
    { key: "neurologic", label: "Neurologic", fields: ["headaches", "poorBalance", "difficultySpeaking", "difficultyConcentrating", "coordinationProblems", "weakness", "briefParalysis", "numbness", "tingling", "visualDisturbances", "seizures", "tremors", "roomSpinning", "memoryLoss", "excessiveDaytimeSleepiness", "dizziness", "facialPain", "lightheadedness", "faintingSpells", "lethargy", "insomnia", "somnolence", "disorientation"] },
    { key: "psychiatric", label: "Psychiatric", fields: ["anxiety", "nervousness", "depression", "hallucinations", "frighteningVisionsOrSounds", "suicidalIdeation", "homicidalIdeation", "impendingSenseOfDoom", "disturbingThoughts", "memoryLoss"] },
    { key: "endocrine", label: "Endocrine", fields: ["heatColdIntolerance", "weightChange", "excessiveThirstOrHunger", "excessiveSweating", "frequentUrination"] },
    { key: "hematologicLymphatic", label: "Hematologic/Lymphatic", fields: ["skinDiscoloration", "easyBleeding", "enlargedLymphNodes", "easyBruising", "anemia", "bloodClots", "swollenGlandsOrThyroid"] },
    { key: "allergicImmunologic", label: "Allergic/Immunologic", fields: ["seasonalAllergies", "hivesOrRash", "persistentInfections", "hivExposure", "immuneDeficiencies"] },
];

function camelToTitle(s: string): string {
    return s.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
}

export default function ROSForm({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [formData, setFormData] = useState<RosDto>({} as RosDto);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.reviewOfSystems && !editing?.id) {
            setFormData(encounterData.reviewOfSystems as RosDto);
        } else if (editing?.id) {
            setFormData(editing);
        } else {
            setFormData({ patientId, encounterId } as RosDto);
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (Object.keys(formData).length > 2) {
            setEncounterSection(patientId, encounterId, "reviewOfSystems", formData);
        }
    }, [formData, patientId, encounterId]);

    const toggleField = (systemKey: string, field: string) => {
        setFormData((prev) => {
            const system = (prev as Record<string, unknown>)[systemKey] as Record<string, unknown> || {};
            return {
                ...prev,
                [systemKey]: { ...system, [field]: !system[field] },
            };
        });
    };

    const setNote = (systemKey: string, note: string) => {
        setFormData((prev) => {
            const system = (prev as Record<string, unknown>)[systemKey] as Record<string, unknown> || {};
            return {
                ...prev,
                [systemKey]: { ...system, note },
            };
        });
    };

    const setAllNegative = (systemKey: string) => {
        setFormData((prev) => {
            const system = SYSTEMS.find((s) => s.key === systemKey);
            if (!system) return prev;
            const negativeSystem = system.fields.reduce((acc, f) => ({ ...acc, [f]: false }), { note: "" });
            return { ...prev, [systemKey]: negativeSystem };
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const url = editing?.id
                ? `/api/reviewofsystems/${patientId}/${encounterId}/${editing.id}`
                : `/api/reviewofsystems/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, {
                method,
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(formData),
            });

            const json = await safeJson<ApiResponse<RosDto>>(res);
            if (!res.ok || !json || json.success !== true) {
                throw new Error(json?.message || `Save failed (${res.status})`);
            }

            onSaved(json.data!);
            removeEncounterSection(patientId, encounterId, "reviewOfSystems");
            if (!editing?.id) {
                setFormData({ patientId, encounterId } as RosDto);
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit ROS Entry" : "Add ROS Entry"}</h3>

            <div className="space-y-6">
                {SYSTEMS.map((system) => {
                    const systemData = (formData as Record<string, unknown>)[system.key] as Record<string, unknown> || {};
                    return (
                        <div key={system.key} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{system.label}</h4>
                                <button
                                    type="button"
                                    onClick={() => setAllNegative(system.key)}
                                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                                >
                                    All Negative
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                                {system.fields.map((field) => (
                                    <label key={field} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={!!systemData[field]}
                                            onChange={() => toggleField(system.key, field)}
                                        />
                                        {camelToTitle(field)}
                                    </label>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Note (optional)"
                                value={(systemData.note as string) || ""}
                                onChange={(e) => setNote(system.key, e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                            />
                        </div>
                    );
                })}
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
                        onClick={() => {
                            removeEncounterSection(patientId, encounterId, "reviewOfSystems");
                            onCancel();
                        }}
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
