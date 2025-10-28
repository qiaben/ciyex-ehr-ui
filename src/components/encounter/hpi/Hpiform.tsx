// "use client";
//
// import { useEffect, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, HpiDto } from "@/utils/types";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
//     editing?: HpiDto | null;
//     onSaved: (saved: HpiDto) => void;
//     onCancel?: () => void;
// };
//
// export default function Hpiform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
//     // required field
//     const [narrative, setNarrative] = useState("");
//
//     // optional structured fields
//     const [onset, setOnset] = useState("");
//     const [duration, setDuration] = useState("");
//     const [severity, setSeverity] = useState("");
//     const [location, setLocation] = useState("");
//     const [character, setCharacter] = useState("");
//     const [aggravatingFactors, setAggravatingFactors] = useState("");
//     const [alleviatingFactors, setAlleviatingFactors] = useState("");
//     const [associatedSymptoms, setAssociatedSymptoms] = useState("");
//     const [timing, setTiming] = useState("");
//
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState<string | null>(null);
//
//     useEffect(() => {
//         setNarrative(editing?.narrative ?? "");
//         setOnset(editing?.onset ?? "");
//         setDuration(editing?.duration ?? "");
//         setSeverity(editing?.severity ?? "");
//         setLocation(editing?.location ?? "");
//         setCharacter(editing?.character ?? "");
//         setAggravatingFactors(editing?.aggravatingFactors ?? "");
//         setAlleviatingFactors(editing?.alleviatingFactors ?? "");
//         setAssociatedSymptoms(editing?.associatedSymptoms ?? "");
//         setTiming(editing?.timing ?? "");
//     }, [editing]);
//
//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setSaving(true);
//         setErr(null);
//
//         try {
//             // Only send non-empty optional fields to keep payload tidy
//             const body: HpiDto = {
//                 patientId,
//                 encounterId,
//                 narrative: narrative.trim(),
//                 ...(onset ? { onset } : {}),
//                 ...(duration ? { duration } : {}),
//                 ...(severity ? { severity } : {}),
//                 ...(location ? { location } : {}),
//                 ...(character ? { character } : {}),
//                 ...(aggravatingFactors ? { aggravatingFactors } : {}),
//                 ...(alleviatingFactors ? { alleviatingFactors } : {}),
//                 ...(associatedSymptoms ? { associatedSymptoms } : {}),
//                 ...(timing ? { timing } : {}),
//                 ...(editing?.id ? { id: editing.id } : {}),
//             };
//
//             const url = editing?.id
//                 ? `/api/history-of-present-illness/${patientId}/${encounterId}/${editing.id}`
//                 : `/api/history-of-present-illness/${patientId}/${encounterId}`;
//
//             const method = editing?.id ? "PUT" : "POST";
//
//             const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
//             const json = (await res.json()) as ApiResponse<HpiDto>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
//
//             onSaved(json.data!);
//             if (!editing?.id) {
//                 setNarrative("");
//                 setOnset("");
//                 setDuration("");
//                 setSeverity("");
//                 setLocation("");
//                 setCharacter("");
//                 setAggravatingFactors("");
//                 setAlleviatingFactors("");
//                 setAssociatedSymptoms("");
//                 setTiming("");
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
//             <h3 className="text-lg font-semibold">{editing?.id ? "Edit HPI" : "Add HPI"}</h3>
//
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Onset</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={onset} onChange={e=>setOnset(e.target.value)} placeholder="e.g., 2 days ago" />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Duration</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g., 2 days" />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Severity</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={severity} onChange={e=>setSeverity(e.target.value)} placeholder="e.g., mild / moderate / severe" />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Location</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g., frontal head" />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Character</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={character} onChange={e=>setCharacter(e.target.value)} placeholder="e.g., throbbing" />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Timing</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={timing} onChange={e=>setTiming(e.target.value)} placeholder="e.g., intermittent" />
//                 </div>
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Aggravating Factors</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={aggravatingFactors} onChange={e=>setAggravatingFactors(e.target.value)} placeholder="e.g., light, noise" />
//                 </div>
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Alleviating Factors</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={alleviatingFactors} onChange={e=>setAlleviatingFactors(e.target.value)} placeholder="e.g., rest, NSAIDs" />
//                 </div>
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Associated Symptoms</label>
//                     <input className="w-full rounded-lg border px-3 py-2 focus:ring" value={associatedSymptoms} onChange={e=>setAssociatedSymptoms(e.target.value)} placeholder="e.g., nausea, photophobia" />
//                 </div>
//             </div>
//
//             <div>
//                 <label className="block text-sm font-medium mb-1">Narrative (required)</label>
//                 <textarea
//                     className="w-full rounded-lg border px-3 py-2 focus:ring min-h-28"
//                     value={narrative}
//                     onChange={(e) => setNarrative(e.target.value)}
//                     placeholder="Free-text HPI narrative"
//                     required
//                 />
//             </div>
//
//             {err && <p className="text-sm text-red-600">{err}</p>}
//
//             <div className="flex items-center gap-2">
//                 <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
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
import type { ApiResponse, HpiDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: HpiDto | null;
    onSaved: (saved: HpiDto) => void;
    onCancel?: () => void;
};

export default function Hpiform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setDescription(editing?.description ?? "");
    }, [editing]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        try {
            const body: HpiDto = {
                patientId,
                encounterId,
                description: description.trim(),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/history-of-present-illness/${patientId}/${encounterId}/${editing.id}`
                : `/api/history-of-present-illness/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<HpiDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

            onSaved(json.data!);
            if (!editing?.id) setDescription("");
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit HPI" : "Add HPI"}</h3>

            <div>
                <label className="block text-sm font-medium mb-1">Description (required)</label>
                <textarea
                    className="w-full rounded-lg border px-3 py-2 focus:ring min-h-28"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Patient presents with intermittent chest pain lasting 2 weeks, worsens with exertion."
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
                    <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
