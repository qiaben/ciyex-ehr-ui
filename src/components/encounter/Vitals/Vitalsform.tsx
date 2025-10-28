



"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, VitalsDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: VitalsDto | null;
    onSaved: (saved: VitalsDto) => void;
    onCancel?: () => void;
};

export default function Vitalsform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [weightKg, setWeightKg] = useState<string>("");
    const [heightCm, setHeightCm] = useState<string>("");
    const [bpSystolic, setBpSystolic] = useState<string>("");
    const [bpDiastolic, setBpDiastolic] = useState<string>("");
    const [pulse, setPulse] = useState<string>("");
    const [respiration, setRespiration] = useState<string>("");
    const [temperatureC, setTemperatureC] = useState<string>("");
    const [oxygenSaturation, setOxygenSaturation] = useState<string>("");
    const [bmi, setBmi] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (editing?.id) {
            setWeightKg(editing.weightKg?.toString() || "");
            setHeightCm(editing.heightCm?.toString() || "");
            setBpSystolic(editing.bpSystolic?.toString() || "");
            setBpDiastolic(editing.bpDiastolic?.toString() || "");
            setPulse(editing.pulse?.toString() || "");
            setRespiration(editing.respiration?.toString() || "");
            setTemperatureC(editing.temperatureC?.toString() || "");
            setOxygenSaturation(editing.oxygenSaturation?.toString() || "");
            setBmi(editing.bmi?.toString() || "");
            setNotes(editing.notes || "");
        } else {
            setWeightKg("");
            setHeightCm("");
            setBpSystolic("");
            setBpDiastolic("");
            setPulse("");
            setRespiration("");
            setTemperatureC("");
            setOxygenSaturation("");
            setBmi("");
            setNotes("");
        }
    }, [editing]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const body: Partial<VitalsDto> = {
                patientId,
                encounterId,
                ...(weightKg ? { weightKg: parseFloat(weightKg) } : {}),
                ...(heightCm ? { heightCm: parseFloat(heightCm) } : {}),
                ...(bpSystolic ? { bpSystolic: parseInt(bpSystolic) } : {}),
                ...(bpDiastolic ? { bpDiastolic: parseInt(bpDiastolic) } : {}),
                ...(pulse ? { pulse: parseInt(pulse) } : {}),
                ...(respiration ? { respiration: parseInt(respiration) } : {}),
                ...(temperatureC ? { temperatureC: parseFloat(temperatureC) } : {}),
                ...(oxygenSaturation ? { oxygenSaturation: parseInt(oxygenSaturation) } : {}),
                ...(bmi ? { bmi: parseFloat(bmi) } : {}),
                ...(notes ? { notes: notes.trim() } : {}),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/vitals/${patientId}/${encounterId}/${editing.id}`
                : `/api/vitals/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<VitalsDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

            onSaved(json.data!);

            if (!editing?.id) {
                setWeightKg("");
                setHeightCm("");
                setBpSystolic("");
                setBpDiastolic("");
                setPulse("");
                setRespiration("");
                setTemperatureC("");
                setOxygenSaturation("");
                setBmi("");
                setNotes("");
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
        >
            <h3 className="text-lg font-semibold">
                {editing?.id ? "Edit Vitals" : "Add Vitals"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Weight (kg)"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Height (cm)"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Systolic BP"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Diastolic BP"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Pulse"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Respiration"
                    value={respiration}
                    onChange={(e) => setRespiration(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Temperature (°C)"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Oxygen Saturation (%)"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="BMI"
                    value={bmi}
                    onChange={(e) => setBmi(e.target.value)}
                />
                <textarea
                    className="w-full rounded-lg border px-3 py-2 md:col-span-2"
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
