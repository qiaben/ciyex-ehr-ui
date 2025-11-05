
// "use client";
//
// import { useEffect, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, ProcedureDto } from "@/utils/types";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
//     editing?: ProcedureDto | null;
//     onSaved: (saved: ProcedureDto) => void;
//     onCancel?: () => void;
// };
//
// const STATUS = ["Planned", "InProgress", "Completed", "Aborted"] as const;
// const LATERALITY = ["Left", "Right", "Bilateral", "Midline"] as const;
//
// export default function Procedureform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
//     const [procedureCode, setProcedureCode] = useState("");
//     const [procedureName, setProcedureName] = useState("");
//     const [datePerformed, setDatePerformed] = useState("");
//     const [status, setStatus] = useState<ProcedureDto["status"]>("Completed");
//     const [performer, setPerformer] = useState("");
//     const [bodySite, setBodySite] = useState("");
//     const [laterality, setLaterality] = useState<ProcedureDto["laterality"]>();
//     const [modifiers, setModifiers] = useState("");
//     const [anesthesia, setAnesthesia] = useState("");
//     const [notes, setNotes] = useState("");
//
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState<string | null>(null);
//
//     useEffect(() => {
//         if (editing?.id) {
//             setProcedureCode(editing.procedureCode || "");
//             setProcedureName(editing.procedureName || "");
//             setDatePerformed(editing.datePerformed ? editing.datePerformed.slice(0, 10) : "");
//             setStatus(editing.status || "Completed");
//             setPerformer(editing.performer || "");
//             setBodySite(editing.bodySite || "");
//             setLaterality(editing.laterality);
//             setModifiers(editing.modifiers || "");
//             setAnesthesia(editing.anesthesia || "");
//             setNotes(editing.notes || "");
//         } else {
//             setProcedureCode("");
//             setProcedureName("");
//             setDatePerformed(new Date().toISOString().slice(0, 10));
//             setStatus("Completed");
//             setPerformer("");
//             setBodySite("");
//             setLaterality(undefined);
//             setModifiers("");
//             setAnesthesia("");
//             setNotes("");
//         }
//     }, [editing]);
//
//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setSaving(true);
//         setErr(null);
//
//         try {
//             const body: ProcedureDto = {
//                 patientId,
//                 encounterId,
//                 procedureName: procedureName.trim(),
//                 ...(procedureCode ? { procedureCode: procedureCode.trim() } : {}),
//                 ...(datePerformed ? { datePerformed } : {}),
//                 ...(status ? { status } : {}),
//                 ...(performer ? { performer: performer.trim() } : {}),
//                 ...(bodySite ? { bodySite: bodySite.trim() } : {}),
//                 ...(laterality ? { laterality } : {}),
//                 ...(modifiers ? { modifiers: modifiers.trim() } : {}),
//                 ...(anesthesia ? { anesthesia: anesthesia.trim() } : {}),
//                 ...(notes ? { notes: notes.trim() } : {}),
//                 ...(editing?.id ? { id: editing.id } : {}),
//             };
//
//             const url = editing?.id
//                 ? `/api/procedures/${patientId}/${encounterId}/${editing.id}`
//                 : `/api/procedures/${patientId}/${encounterId}`;
//
//             const method = editing?.id ? "PUT" : "POST";
//
//             const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
//             const json = (await res.json()) as ApiResponse<ProcedureDto>;
//             if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
//
//             onSaved(json.data!);
//             if (!editing?.id) {
//                 setProcedureCode("");
//                 setProcedureName("");
//                 setDatePerformed(new Date().toISOString().slice(0, 10));
//                 setStatus("Completed");
//                 setPerformer("");
//                 setBodySite("");
//                 setLaterality(undefined);
//                 setModifiers("");
//                 setAnesthesia("");
//                 setNotes("");
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
//             <h3 className="text-lg font-semibold">{editing?.id ? "Edit Procedure" : "Add Procedure"}</h3>
//
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Procedure Name</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={procedureName}
//                         onChange={(e) => setProcedureName(e.target.value)}
//                         placeholder="e.g., Laceration repair, Colonoscopy"
//                         required
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Procedure Code</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={procedureCode}
//                         onChange={(e) => setProcedureCode(e.target.value)}
//                         placeholder="CPT/HCPCS/PCS"
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Date Performed</label>
//                     <input
//                         type="date"
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={datePerformed}
//                         onChange={(e) => setDatePerformed(e.target.value)}
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Status</label>
//                     <select
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={status}
//                         onChange={(e) => setStatus(e.target.value as ProcedureDto["status"])}
//                     >
//                         {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
//                     </select>
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Performer</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={performer}
//                         onChange={(e) => setPerformer(e.target.value)}
//                         placeholder="Provider"
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Body Site</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={bodySite}
//                         onChange={(e) => setBodySite(e.target.value)}
//                         placeholder="e.g., Knee, Abdomen"
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Laterality</label>
//                     <select
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={laterality || ""}
//                         onChange={(e) => setLaterality((e.target.value || undefined) as ProcedureDto["laterality"])}
//                     >
//                         <option value="">—</option>
//                         {LATERALITY.map((l) => <option key={l} value={l}>{l}</option>)}
//                     </select>
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Modifiers</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={modifiers}
//                         onChange={(e) => setModifiers(e.target.value)}
//                         placeholder='e.g., "25,59"'
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Anesthesia</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 focus:ring"
//                         value={anesthesia}
//                         onChange={(e) => setAnesthesia(e.target.value)}
//                         placeholder="Local/General/etc."
//                     />
//                 </div>
//
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-medium mb-1">Notes</label>
//                     <textarea
//                         className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
//                         value={notes}
//                         onChange={(e) => setNotes(e.target.value)}
//                         placeholder="Procedure details"
//                     />
//                 </div>
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

import { useEffect, useState ,useRef} from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type { ApiResponse, ProcedureDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: ProcedureDto | null;
    onSaved: (saved: ProcedureDto) => void;
    onCancel?: () => void;
};

export default function Procedureform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [cpt4, setCpt4] = useState("");
    const [description, setDescription] = useState("");
    const [units, setUnits] = useState<number | "">("");
    const [rate, setRate] = useState<string>("");
    const [relatedIcds, setRelatedIcds] = useState("");
    const [hospitalBillingStart, setHospitalBillingStart] = useState("");
    const [hospitalBillingEnd, setHospitalBillingEnd] = useState("");
    const [modifier1, setModifier1] = useState<string>("");
    const [modifier2, setModifier2] = useState<string>("");
    const [modifier3, setModifier3] = useState<string>("");
    const [modifier4, setModifier4] = useState<string>("");
    const [note, setNote] = useState("");
    const [providername, setProvidername] = useState("");


    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Price Level (Patients → Codes)
    type PatientCodeList = { id: number; title: string; active?: boolean; isDefault?: boolean };
    const [priceLevels, setPriceLevels] = useState<PatientCodeList[]>([]);
    const [priceLevelTitle, setPriceLevelTitle] = useState<number | "">("");

    type CodeHit = { code: string; description: string; price: number | null; modifier: string | null };
    const [hits, setHits] = useState<CodeHit[]>([]);
    const [showHits, setShowHits] = useState(false);
    const searchTimer = useRef<number | null>(null);

    async function searchCodes(q: string) {
        if (!q || q.length < 2) { setHits([]); return; }
        try {
            const res = await fetchWithOrg(`/api/codes?q=${encodeURIComponent(q)}&type=CPT4`, {
                headers: { Accept: "application/json" }
            });
            const json = await res.json();
            if (res.ok) setHits(Array.isArray(json) ? json : (json?.data ?? []));
        } catch {
            // ignore
        }
    }



    useEffect(() => {
        if (editing?.id) {
            setCpt4(editing.cpt4 || "");
            setDescription(editing.description || "");
            setUnits(typeof editing.units === "number" ? editing.units : "");
            setRate(editing.rate || "");
            setRelatedIcds(editing.relatedIcds || "");
            setHospitalBillingStart(editing.hospitalBillingStart || "");
            setHospitalBillingEnd(editing.hospitalBillingEnd || "");
            setModifier1(editing.modifier1 ?? "");
            setModifier2(editing.modifier2 ?? "");
            setModifier3(editing.modifier3 ?? "");
            setModifier4(editing.modifier4 ?? "");
            setNote(editing.note ?? "");
            setPriceLevelTitle((editing as any).priceLevelTitle ?? "");
            setProvidername((editing as any).providername ?? "");


        } else {
            setCpt4("");
            setDescription("");
            setUnits("");
            setRate("");
            setRelatedIcds("");
            setHospitalBillingStart("");
            setHospitalBillingEnd("");
            setModifier1("");
            setModifier2("");
            setModifier3("");
            setModifier4("");
            setNote("");
            setPriceLevelTitle("");
            setProvidername("");


        }
    }, [editing]);


    // Load active Patient Code lists for Price Level dropdown
    useEffect(() => {
        const ac = new AbortController();

        (async () => {
            try {
                // Try to read orgId the same way the rest of your app does
                const raw = (typeof window !== "undefined" && localStorage.getItem("orgId")) || "";
                const orgId = raw ? String(raw) : undefined;

                // Prefer fetchWithOrg if it exists; otherwise fall back to fetchWithAuth + header
                // @ts-ignore - runtime check in case fetchWithOrg isn't imported in this file
                const preferFetchWithOrg = typeof fetchWithOrg === "function";

                const headers: Record<string, string> = { Accept: "application/json" };
                if (orgId) headers["X-Org-Id"] = orgId;

                const res = preferFetchWithOrg
                    // @ts-ignore
                    ? await fetchWithOrg("/api/patient-codes", { method: "GET", headers, signal: ac.signal })
                    : await fetchWithAuth("/api/patient-codes", { method: "GET", headers, signal: ac.signal });

                let json: { success?: boolean; data?: any[]; message?: string } | null = null;
                try {
                    json = await res.json();
                } catch {
                    // non-JSON response
                }

                if (!res.ok || json?.success === false) {
                    const msg = json?.message || `Load failed (${res.status})`;
                    throw new Error(msg);
                }

                const rows = Array.isArray(json?.data) ? json!.data! : [];
                const active = rows.filter((r: any) => r?.active !== false);
                const mapped: PatientCodeList[] = active.map((r: any) => ({
                    id: r.id,
                    title: r.title,
                    active: r.active,
                    isDefault: r.isDefault,
                }));

                setPriceLevels(mapped);

                // If we're creating (no existing procedure), preselect the default price level if any
                if (!editing?.id) {
                    const def = mapped.find((r) => r.isDefault);
                    if (def) setPriceLevelTitle(def.id as number);
                }
            } catch (err) {
                // surface a minimal hint in dev; avoid UI crash
                console.warn("[procedureform] Failed to load patient-codes:", err);
                setPriceLevels([]); // ensure controlled state
            }
        })();

        return () => ac.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?.id]);







    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const body: ProcedureDto = {
                patientId,
                encounterId,
                cpt4: cpt4.trim(),
                description: description.trim(),
                ...(units !== "" ? { units: Number(units) } : {}),
                ...(rate ? { rate: rate } : {}),
                ...(priceLevelTitle !== "" ? { priceLevelId: Number(priceLevelTitle) } : {}),
                ...(relatedIcds ? { relatedIcds: relatedIcds.trim() } : {}),
                ...(hospitalBillingStart ? { hospitalBillingStart } : {}),
                ...(hospitalBillingEnd ? { hospitalBillingEnd } : {}),
                ...(modifier1 ? { modifier1: modifier1.trim() } : { modifier1: null }),
                ...(modifier2 ? { modifier2: modifier2.trim() } : { modifier2: null }),
                ...(modifier3 ? { modifier3: modifier3.trim() } : { modifier3: null }),
                ...(modifier4 ? { modifier4: modifier4.trim() } : { modifier4: null }),
                ...(note ? { note: note.trim() } : { note: null }),
                ...(providername ? { providername: providername.trim() } : {}),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/procedures/${patientId}/${encounterId}/${editing.id}`
                : `/api/procedures/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<ProcedureDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

            // After procedure creation, create invoice dynamically using all relevant procedure fields
            if (!editing?.id && json.data) {
                try {
                    const invoiceBody = {
                        code: cpt4.trim() || json.data.cpt4 || "",
                        description: description.trim() || json.data.description || "",
                        units: units !== "" ? Number(units) : (json.data.units ? Number(json.data.units) : 1),
                        rate: rate ? Number(rate) : (json.data.rate ? Number(json.data.rate) : 0),
                        dos: hospitalBillingStart || json.data.hospitalBillingStart || "",
                        provider: providername.trim(),
                        modifiers: [modifier1, modifier2, modifier3, modifier4].filter(Boolean).join(","),
                        patientId,
                        encounterId,
                    };
                    await fetchWithAuth(`/api/patient-billing/${patientId}/invoices`, {
                        method: "POST",
                        body: JSON.stringify(invoiceBody),
                        headers: { "Content-Type": "application/json" },
                    });
                } catch (err) {
                    // Log error but do not block procedure creation
                    // eslint-disable-next-line no-console
                    console.error("Invoice creation failed:", err);
                }
            }

            onSaved(json.data!);

            if (!editing?.id) {
                setCpt4("");
                setDescription("");
                setUnits("");
                setRate("");
                setRelatedIcds("");
                setHospitalBillingStart("");
                setHospitalBillingEnd("");
                setModifier1("");
                setModifier2("");
                setModifier3("");
                setModifier4("");
                setNote("");
                setPriceLevelTitle("");
                setProvidername("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit Procedure" : "Add Procedure"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">CPT-4</label>
                    {/*<input*/}
                    {/*    className="w-full rounded-lg border px-3 py-2 focus:ring"*/}
                    {/*    value={cpt4}*/}
                    {/*    onChange={(e) => setCpt4(e.target.value)}*/}
                    {/*    placeholder="e.g., 99214"*/}
                    {/*    required*/}
                    {/*/>*/}
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={cpt4}
                        onChange={(e) => {
                            const v = e.target.value;
                            setCpt4(v);
                            setShowHits(true);
                            if (searchTimer.current) window.clearTimeout(searchTimer.current);
                            // debounce 250ms
                            searchTimer.current = window.setTimeout(() => searchCodes(v), 250) as unknown as number;
                        }}
                        placeholder="e.g., 99214"
                        required
                    />

                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Units</label>
                    <input
                        type="number"
                        min={0}
                        step={1}
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={units}
                        onChange={(e) => setUnits(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="1"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Rate</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="239.00"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Price Level</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={priceLevelTitle}
                        onChange={(e) => setPriceLevelTitle(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                        <option value="">Price level</option>
                        {priceLevels.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                                {pl.title}
                            </option>
                        ))}
                    </select>
                </div>


                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Office visit est. patient comprehensive"
                        required
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Provider Name</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={providername}
                        onChange={(e) => setProvidername(e.target.value)}
                        placeholder="e.g., Dr. Smith"
                    />
                </div>


                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Related ICDs</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={relatedIcds}
                        onChange={(e) => setRelatedIcds(e.target.value)}
                        placeholder='e.g., "E0500" or comma-separated'
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Hospital Billing Start</label>
                    <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={hospitalBillingStart}
                        onChange={(e) => setHospitalBillingStart(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Hospital Billing End</label>
                    <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={hospitalBillingEnd}
                        onChange={(e) => setHospitalBillingEnd(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Modifier 1</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={modifier1}
                        onChange={(e) => setModifier1(e.target.value)}
                        placeholder="25"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Modifier 2</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={modifier2}
                        onChange={(e) => setModifier2(e.target.value)}
                        placeholder="34"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Modifier 3</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={modifier3}
                        onChange={(e) => setModifier3(e.target.value)}
                        placeholder="Optional"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Modifier 4</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={modifier4}
                        onChange={(e) => setModifier4(e.target.value)}
                        placeholder="Optional"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Note</label>
                    <textarea
                        className="w-full rounded-lg border px-3 py-2 focus:ring min-h-24"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Follow CPT Estimator guidance"
                    />
                </div>
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
