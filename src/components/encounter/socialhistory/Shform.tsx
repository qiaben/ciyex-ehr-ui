// // "use client";
// //
// // import { useEffect, useState } from "react";
// // import { fetchWithOrg } from "@/utils/fetchWithOrg";
// // import type { ApiResponse, SocialHistoryDto } from "@/utils/types";
// //
// // type Props = {
// //     patientId: number;
// //     encounterId: number;
// //     editing?: SocialHistoryDto | null;
// //     onSaved: (saved: SocialHistoryDto) => void;
// //     onCancel?: () => void;
// // };
// //
// // const CATEGORIES = [
// //     "Tobacco",
// //     "Alcohol",
// //     "Drugs",
// //     "Occupation",
// //     "Exercise",
// //     "Diet",
// //     "Caffeine",
// //     "Sexual",
// //     "Living Situation",
// //     "Marital",
// //     "Pets",
// //     "Other",
// // ];
// //
// // const STATUS_OPTS = ["Current", "Former", "Never", "Occasional", "Unknown"];
// //
// // export default function Shform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
// //     const [category, setCategory] = useState(CATEGORIES[0]);
// //     const [status, setStatus] = useState<string>("");
// //     const [frequency, setFrequency] = useState("");
// //     const [duration, setDuration] = useState("");
// //     const [quantityPerDay, setQuantityPerDay] = useState<number | "">("");
// //     const [years, setYears] = useState<number | "">("");
// //     const [notes, setNotes] = useState("");
// //
// //     const [saving, setSaving] = useState(false);
// //     const [err, setErr] = useState<string | null>(null);
// //
// //     useEffect(() => {
// //         if (editing?.id) {
// //             setCategory(editing.category || CATEGORIES[0]);
// //             setStatus(editing.status || "");
// //             setFrequency(editing.frequency || "");
// //             setDuration(editing.duration || "");
// //             setQuantityPerDay(
// //                 typeof editing.quantityPerDay === "number" ? editing.quantityPerDay : ""
// //             );
// //             setYears(typeof editing.years === "number" ? editing.years : "");
// //             setNotes(editing.notes || "");
// //         } else {
// //             setCategory(CATEGORIES[0]);
// //             setStatus("");
// //             setFrequency("");
// //             setDuration("");
// //             setQuantityPerDay("");
// //             setYears("");
// //             setNotes("");
// //         }
// //     }, [editing]);
// //
// //     async function handleSubmit(e: React.FormEvent) {
// //         e.preventDefault();
// //         setSaving(true);
// //         setErr(null);
// //
// //         try {
// //             const body: SocialHistoryDto = {
// //                 patientId,
// //                 encounterId,
// //                 category,
// //                 ...(status ? { status } : {}),
// //                 ...(frequency ? { frequency } : {}),
// //                 ...(duration ? { duration } : {}),
// //                 ...(quantityPerDay !== "" ? { quantityPerDay: Number(quantityPerDay) } : {}),
// //                 ...(years !== "" ? { years: Number(years) } : {}),
// //                 ...(notes ? { notes } : {}),
// //                 ...(editing?.id ? { id: editing.id } : {}),
// //             };
// //
// //             const url = editing?.id
// //                 ? `/api/social-history/${patientId}/${encounterId}/${editing.id}`
// //                 : `/api/social-history/${patientId}/${encounterId}`;
// //
// //             const method = editing?.id ? "PUT" : "POST";
// //
// //             const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
// //             const json = (await res.json()) as ApiResponse<SocialHistoryDto>;
// //             if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
// //
// //             onSaved(json.data!);
// //             if (!editing?.id) {
// //                 setCategory(CATEGORIES[0]);
// //                 setStatus("");
// //                 setFrequency("");
// //                 setDuration("");
// //                 setQuantityPerDay("");
// //                 setYears("");
// //                 setNotes("");
// //             }
// //         } catch (e: unknown) {
// //             setErr(e instanceof Error ? e.message : "Something went wrong");
// //         } finally {
// //             setSaving(false);
// //         }
// //     }
// //
// //     return (
// //         <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
// //             <h3 className="text-lg font-semibold">{editing?.id ? "Edit Social History" : "Add Social History"}</h3>
// //
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
// //                 <div>
// //                     <label className="block text-sm font-medium mb-1">Category</label>
// //                     <select
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring"
// //                         value={category}
// //                         onChange={(e) => setCategory(e.target.value)}
// //                     >
// //                         {CATEGORIES.map((c) => (
// //                             <option key={c} value={c}>
// //                                 {c}
// //                             </option>
// //                         ))}
// //                     </select>
// //                 </div>
// //
// //                 <div>
// //                     <label className="block text-sm font-medium mb-1">Status</label>
// //                     <input
// //                         list="sh-status"
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring"
// //                         value={status}
// //                         onChange={(e) => setStatus(e.target.value)}
// //                         placeholder="e.g., Current / Former / Never"
// //                     />
// //                     <datalist id="sh-status">
// //                         {STATUS_OPTS.map((s) => (
// //                             <option key={s} value={s} />
// //                         ))}
// //                     </datalist>
// //                 </div>
// //
// //                 <div>
// //                     <label className="block text-sm font-medium mb-1">Frequency</label>
// //                     <input
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring"
// //                         value={frequency}
// //                         onChange={(e) => setFrequency(e.target.value)}
// //                         placeholder="e.g., Daily, Weekly, Socially"
// //                     />
// //                 </div>
// //
// //                 <div>
// //                     <label className="block text-sm font-medium mb-1">Duration</label>
// //                     <input
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring"
// //                         value={duration}
// //                         onChange={(e) => setDuration(e.target.value)}
// //                         placeholder="e.g., 10 years"
// //                     />
// //                 </div>
// //
// //                 <div>
// //                     <label className="block text-sm font-medium mb-1">Quantity / Day</label>
// //                     <input
// //                         type="number"
// //                         min={0}
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring"
// //                         value={quantityPerDay}
// //                         onChange={(e) => setQuantityPerDay(e.target.value === "" ? "" : Number(e.target.value))}
// //                         placeholder="e.g., 5 (cigarettes/drinks)"
// //                     />
// //                 </div>
// //
// //                 <div>
// //                     <label className="block text-sm font-medium mb-1">Years</label>
// //                     <input
// //                         type="number"
// //                         min={0}
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring"
// //                         value={years}
// //                         onChange={(e) => setYears(e.target.value === "" ? "" : Number(e.target.value))}
// //                         placeholder="e.g., 8"
// //                     />
// //                 </div>
// //
// //                 <div className="md:col-span-2">
// //                     <label className="block text-sm font-medium mb-1">Notes</label>
// //                     <textarea
// //                         className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
// //                         value={notes}
// //                         onChange={(e) => setNotes(e.target.value)}
// //                         placeholder="Additional details"
// //                     />
// //                 </div>
// //             </div>
// //
// //             {err && <p className="text-sm text-red-600">{err}</p>}
// //
// //             <div className="flex items-center gap-2">
// //                 <button
// //                     type="submit"
// //                     disabled={saving}
// //                     className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
// //                 >
// //                     {saving ? "Saving..." : editing?.id ? "Update" : "Save"}
// //                 </button>
// //                 {onCancel && (
// //                     <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
// //                         Cancel
// //                     </button>
// //                 )}
// //             </div>
// //         </form>
// //     );
// // }
//
//
// "use client";
//
// import { useEffect, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type {
//     ApiResponse,
//     SocialHistoryDto,
//     SocialHistoryEntryDto,
// } from "@/utils/types";
//
// // Categories shown in your Bruno example
// const CATEGORIES: string[] = [
//     "SMOKING",
//     "ALCOHOL",
//     "DRUGS",
//     "EXERCISE",
//     "DIET",
//     "CAFFEINE",
//     "OCCUPATION",
//     "MARITAL",
//     "LIVING",
//     "SEXUAL",
//     "PETS",
//     "OTHER",
// ];
//
// type Props = {
//     patientId: number;
//     encounterId: number;
//     editing?: SocialHistoryEntryDto | null;
//     onSaved: (saved: SocialHistoryEntryDto) => void;
//     onCancel?: () => void;
// };
//
// export default function Shform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
//     const [category, setCategory] = useState<string>(CATEGORIES[0]);
//     const [value, setValue] = useState<string>("");
//     const [details, setDetails] = useState<string>("");
//
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState<string | null>(null);
//
//     useEffect(() => {
//         if (editing?.id) {
//             setCategory(editing.category || CATEGORIES[0]);
//             setValue(editing.value || "");
//             setDetails(editing.details || "");
//         } else {
//             setCategory(CATEGORIES[0]);
//             setValue("");
//             setDetails("");
//         }
//     }, [editing]);
//
//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setSaving(true);
//         setErr(null);
//
//         try {
//             const entry: SocialHistoryEntryDto = {
//                 ...(editing?.id ? { id: editing.id } : {}),
//                 category,
//                 ...(value ? { value: value.trim() } : {}),
//                 ...(details ? { details: details.trim() } : {}),
//             };
//
//             const url = editing?.id
//                 ? `/api/social-history/${patientId}/${encounterId}/${editing.id}`
//                 : `/api/social-history/${patientId}/${encounterId}`;
//             const method = editing?.id ? "PUT" : "POST";
//             const body = editing?.id
//                 ? entry
//                 : ({ patientId, encounterId, entries: [entry] } as SocialHistoryDto);
//
//             const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
//             const json = (await res.json()) as ApiResponse<SocialHistoryEntryDto | SocialHistoryDto>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
//
//             // Accept both shapes: updated entry OR container with entries[]
//             let saved: SocialHistoryEntryDto | undefined;
//             const data: any = json.data;
//             if (data && Array.isArray(data.entries)) {
//                 const arr = data.entries as SocialHistoryEntryDto[];
//                 saved = arr[arr.length - 1] ?? arr[0];
//             } else {
//                 saved = data as SocialHistoryEntryDto;
//             }
//             if (!saved) throw new Error("Invalid response: no entry returned");
//
//             onSaved(saved);
//
//             if (!editing?.id) {
//                 setCategory(CATEGORIES[0]);
//                 setValue("");
//                 setDetails("");
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
//             <h3 className="text-lg font-semibold">{editing?.id ? "Edit Social History" : "Add Social History"}</h3>
//
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Category</label>
//                     <select
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={category}
//                         onChange={(e) => setCategory(e.target.value)}
//                     >
//                         {CATEGORIES.map((c) => (
//                             <option key={c} value={c}>{c}</option>
//                         ))}
//                     </select>
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Value</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={value}
//                         onChange={(e) => setValue(e.target.value)}
//                         placeholder='e.g., "Former smoker" or "Vegetarian"'
//                     />
//                 </div>
//
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Details</label>
//                     <textarea
//                         className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
//                         value={details}
//                         onChange={(e) => setDetails(e.target.value)}
//                         placeholder='e.g., "Quit in 2023" or "Mostly plant-based, occasional dairy"'
//                     />
//                 </div>
//             </div>
//
//             {err && <p className="text-sm text-red-600">{err}</p>}
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
//







"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, SocialHistoryDto, SocialHistoryEntryDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    shId: number | null;                         // container id (may be null on first create)
    entries: SocialHistoryEntryDto[];            // current entries
    editing?: SocialHistoryEntryDto | null;
    onSaved: () => void;                         // parent reloads on save
    onCancel?: () => void;
};

const CATEGORIES: string[] = [
    "SMOKING","ALCOHOL","DRUGS","EXERCISE","DIET","CAFFEINE","OCCUPATION",
    "MARITAL","LIVING","SEXUAL","PETS","OTHER",
];

async function safeJson<T>(res: Response): Promise<T | null> {
    const t = await res.text().catch(() => "");
    if (!t) return null;
    try { return JSON.parse(t) as T; } catch { return null; }
}

export default function Shform({ patientId, encounterId, shId, entries, editing, onSaved, onCancel }: Props) {
    const [category, setCategory] = useState<string>(CATEGORIES[0]);
    const [value, setValue] = useState<string>("");
    const [details, setDetails] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (editing) {
            setCategory(editing.category || CATEGORIES[0]);
            setValue(editing.value || "");
            setDetails(editing.details || "");
        } else {
            setCategory(CATEGORIES[0]);
            setValue("");
            setDetails("");
        }
    }, [editing]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const newEntry: SocialHistoryEntryDto = {
                // No entry id in API — update by index in the list
                category,
                ...(value ? { value: value.trim() } : {}),
                ...(details ? { details: details.trim() } : {}),
            };

            let url: string;
            let method: "POST" | "PUT";
            let body: SocialHistoryDto;

            if (shId) {
                // Update existing container with full entries array
                const next = editing
                    ? entries.map((e) =>
                        e === editing ? { ...e, ...newEntry } : e
                    )
                    : [...entries, newEntry];

                url = `/api/social-history/${patientId}/${encounterId}/${shId}`;
                method = "PUT";
                body = { id: shId, patientId, encounterId, entries: next } as SocialHistoryDto;
            } else {
                // First create: POST new container
                url = `/api/social-history/${patientId}/${encounterId}`;
                method = "POST";
                body = { patientId, encounterId, entries: [newEntry] } as SocialHistoryDto;
            }

            const res = await fetchWithOrg(url, {
                method,
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(body),
            });

            const json = await safeJson<ApiResponse<SocialHistoryDto>>(res);
            if (!res.ok || !json || json.success !== true) {
                throw new Error(json?.message || `Save failed (${res.status})`);
            }

            onSaved(); // parent reloads to keep shape in sync
        }  catch (e: unknown) {
        if (e instanceof Error) {
            setErr(e.message);
        } else {
            setErr("Something went wrong");
        }
    }
finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing ? "Edit Social History" : "Add Social History"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select className="w-full rounded-lg border px-3 py-2 focus:ring"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Value</label>
                    <input className="w-full rounded-lg border px-3 py-2 focus:ring"
                           value={value}
                           onChange={(e) => setValue(e.target.value)}
                           placeholder='e.g., "Former smoker" or "Vegetarian"' />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Details</label>
                    <textarea className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
                              value={details}
                              onChange={(e) => setDetails(e.target.value)}
                              placeholder='e.g., "Quit in 2023" or "Mostly plant-based, occasional dairy"' />
                </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex items-center gap-2">
                <button type="submit" disabled={saving}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? "Saving..." : editing ? "Update" : "Save"}
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
