




"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse } from "@/utils/types";
import type { DateTimeFinalizedDto } from "./DatetimefinalizedCard";
import { getEncounterData, setEncounterSection, removeEncounterSection } from "@/utils/encounterStorage";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: DateTimeFinalizedDto | null;
    onSaved: (saved: DateTimeFinalizedDto) => void;
    onCancel?: () => void;
};

const TARGET_TYPES = ["NOTE", "ORDER", "RESULT"];
const METHODS = ["MANUAL", "AUTO"];
const STATUSES = ["finalized", "amended", "revoked"];
const ROLES = ["MD", "DO", "NP", "PA"];

async function safeJson<T = unknown>(res: Response): Promise<T | null> {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try { return JSON.parse(text) as T; } catch { return null; }
}

export default function Datetimefinalizedform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    const [targetType, setTargetType] = useState<string>("NOTE");
    const [targetId, setTargetId] = useState<string>("");
    const [targetVersion, setTargetVersion] = useState<string>("v1");

    const [finalizedAt, setFinalizedAt] = useState<string>("");
    const [finalizedBy, setFinalizedBy] = useState<string>("");
    const [finalizerRole, setFinalizerRole] = useState<string>("MD");
    const [method, setMethod] = useState<string>("MANUAL");
    const [status, setStatus] = useState<string>("finalized");
    const [reason, setReason] = useState<string>("");

    const [comments, setComments] = useState<string>("");
    const [contentHash, setContentHash] = useState<string>("");
    const [providerSignatureId, setProviderSignatureId] = useState<string>("");
    const [signoffId, setSignoffId] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const encounterData = getEncounterData(patientId, encounterId);
        if (encounterData.dateTimeFinalized && !editing?.id) {
            const data = encounterData.dateTimeFinalized;
            setTargetType(data.targetType || "NOTE");
            setTargetId(data.targetId || "");
            setTargetVersion(data.targetVersion || "v1");
            setFinalizedAt(data.finalizedAt || "");
            setFinalizedBy(data.finalizedBy || "");
            setFinalizerRole(data.finalizerRole || "MD");
            setMethod(data.method || "MANUAL");
            setStatus(data.status || "finalized");
            setReason(data.reason || "");
            setComments(data.comments || "");
            setContentHash((data as any).contentHash || "");
            setProviderSignatureId((data as any).providerSignatureId || "");
            setSignoffId((data as any).signoffId || "");
        } else if (editing?.id) {
            setTargetType(editing.targetType || "NOTE");
            setTargetId(editing.targetId?.toString() ?? "");
            setTargetVersion(editing.targetVersion || "v1");
            setFinalizedAt(editing.finalizedAt || "");
            setFinalizedBy(editing.finalizedBy || "");
            setFinalizerRole(editing.finalizerRole || "MD");
            setMethod(editing.method || "MANUAL");
            setStatus(editing.status || "finalized");
            setReason(editing.reason || "");
            setComments(editing.comments || "");
            setContentHash(editing.contentHash || "");
            setProviderSignatureId(editing.providerSignatureId?.toString() ?? "");
            setSignoffId(editing.signoffId?.toString() ?? "");
        } else {
            setTargetType("NOTE");
            setTargetId("");
            setTargetVersion("v1");
            setFinalizedAt("");
            setFinalizedBy("");
            setFinalizerRole("MD");
            setMethod("MANUAL");
            setStatus("finalized");
            setReason("");
            setComments("");
            setContentHash("");
            setProviderSignatureId("");
            setSignoffId("");
        }
    }, [editing, patientId, encounterId]);

    useEffect(() => {
        if (targetType || finalizedAt || finalizedBy || reason) {
            setEncounterSection(patientId, encounterId, "dateTimeFinalized", {
                targetType,
                targetId,
                targetVersion,
                finalizedAt,
                finalizedBy,
                finalizerRole,
                method,
                status,
                reason,
                comments
            } as any);
        }
    }, [targetType, targetId, targetVersion, finalizedAt, finalizedBy, finalizerRole, method, status, reason, comments, patientId, encounterId]);

    function setNow() {
        setFinalizedAt(new Date().toISOString());
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);

        try {
            const body: DateTimeFinalizedDto = {
                patientId,
                encounterId,
                targetType,
                ...(targetId ? { targetId: Number(targetId) } : {}),
                ...(targetVersion ? { targetVersion } : {}),
                ...(finalizedAt ? { finalizedAt } : {}),
                ...(finalizedBy ? { finalizedBy } : {}),
                ...(finalizerRole ? { finalizerRole } : {}),
                ...(method ? { method } : {}),
                ...(status ? { status } : {}),
                ...(reason ? { reason } : {}),
                ...(comments ? { comments } : {}),
                ...(contentHash ? { contentHash } : {}),
                ...(providerSignatureId ? { providerSignatureId: Number(providerSignatureId) } : {}),
                ...(signoffId ? { signoffId: Number(signoffId) } : {}),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/date-time-finalized/${patientId}/${encounterId}/${editing.id}`
                : `/api/date-time-finalized/${patientId}/${encounterId}`;
            const methodHttp = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method: methodHttp, body: JSON.stringify(body) });
            const json = (await safeJson<ApiResponse<DateTimeFinalizedDto>>(res)) ?? undefined;

            if (!res.ok) { setErr(`Save failed (${res.status})`); return; }
            if (!json || json.success !== true || !json.data) { setErr(json?.message || "Save failed"); return; }

            onSaved(json.data);
            removeEncounterSection(patientId, encounterId, "dateTimeFinalized");

            if (!editing?.id) {
                setTargetType("NOTE");
                setTargetId("");
                setTargetVersion("v1");
                setFinalizedAt("");
                setFinalizedBy("");
                setFinalizerRole("MD");
                setMethod("MANUAL");
                setStatus("finalized");
                setReason("");
                setComments("");
                setContentHash("");
                setProviderSignatureId("");
                setSignoffId("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit Finalization Timestamp" : "Add Finalization Timestamp"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Target Type <span className="text-red-600">*</span></label>
                    <select className="w-full rounded-lg border px-3 py-2" value={targetType} onChange={(e) => setTargetType(e.target.value)} required>
                        {TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Target ID <span className="text-red-600">*</span></label>
                    <input className="w-full rounded-lg border px-3 py-2" value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="e.g., 5001" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Target Version</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} placeholder="e.g., v1" />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Finalized Date/Time <span className="text-red-600">*</span></label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 rounded-lg border px-3 py-2"
                                value={finalizedAt}
                                onChange={(e) => setFinalizedAt(e.target.value)}
                                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                                required
                            />
                            <button type="button" onClick={setNow} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">
                                Set to Now
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Finalized By <span className="text-red-600">*</span></label>
                        <input className="w-full rounded-lg border px-3 py-2" value={finalizedBy} onChange={(e) => setFinalizedBy(e.target.value)} placeholder="dr.smith@clinic" required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Role <span className="text-red-600">*</span></label>
                    <select className="w-full rounded-lg border px-3 py-2" value={finalizerRole} onChange={(e) => setFinalizerRole(e.target.value)} required>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Method</label>
                    <select className="w-full rounded-lg border px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value)}>
                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select className="w-full rounded-lg border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Reason <span className="text-red-600">*</span></label>
                    <input className="w-full rounded-lg border px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., signed off" required />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea className="w-full rounded-lg border px-3 py-2 min-h-20" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Additional notes" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Content Hash</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={contentHash} onChange={(e) => setContentHash(e.target.value)} placeholder="optional" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Provider Signature ID</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={providerSignatureId} onChange={(e) => setProviderSignatureId(e.target.value)} placeholder="e.g., 4" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Sign-off ID</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={signoffId} onChange={(e) => setSignoffId(e.target.value)} placeholder="e.g., 9" />
                </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex items-center gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? "Saving..." : editing?.id ? "Update" : "Save"}
                </button>
                {onCancel && (
                    <button type="button" onClick={() => { removeEncounterSection(patientId, encounterId, "dateTimeFinalized"); onCancel(); }} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
