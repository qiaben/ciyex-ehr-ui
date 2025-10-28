



"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, AssignedProviderDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    editing?: AssignedProviderDto | null;
    onSaved: (saved: AssignedProviderDto) => void;
    onCancel?: () => void;
};

// If you have a provider search API, wire it here (see fetchProviders below)
type ProviderOption = { id: number; name: string; npi?: string; specialty?: string };

const ROLES: AssignedProviderDto["role"][] = ["Primary", "Attending", "Consultant", "Nurse", "Scribe", "Other"];

export default function AssignedProviderform({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
    // Provider selection
    const [providerId, setProviderId] = useState<number | "">("");
    const [providerName, setProviderName] = useState("");

    // Role & dates
    const [role, setRole] = useState<AssignedProviderDto["role"]>("Primary");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");

    // Provider options (optional: live search)
    const [options, setOptions] = useState<ProviderOption[]>([]);
    const [q, setQ] = useState("");        // search query for provider list
    const [loadingProviders, setLoadingProviders] = useState(false);

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (editing?.id) {
            setProviderId(editing.providerId);
            setProviderName(editing.providerName || "");
            setRole(editing.role || "Primary");
            setStartDate(editing?.startDate?.slice(0, 10) || editing?.startDate || "");
            setEndDate(editing?.endDate?.slice(0, 10) || editing?.endDate || "");

            setNotes(editing.notes || "");
        } else {
            setProviderId("");
            setProviderName("");
            setRole("Primary");
            setStartDate("");
            setEndDate("");
            setNotes("");
        }
    }, [editing]);

    async function fetchProviders(query: string) {
        if (!query || query.length < 2) {
            setOptions([]);
            return;
        }
        setLoadingProviders(true);
        try {
            // OPTIONAL helper endpoint (adjust or remove if you don’t have it):
            // GET /api/providers?query=<q>
            const res = await fetchWithOrg(`/api/providers?query=${encodeURIComponent(query)}`);
            const json = await res.json();
            if (res.ok) {
                const list: unknown[] = json?.data || json || [];
                const mapped: ProviderOption[] = list.map((item) => {
                    const p = item as Record<string, unknown>;
                    return {
                        id: Number(p.id ?? p.providerId ?? 0),
                        name: String(p.name ?? p.fullName ?? p.displayName ?? "Provider"),
                        npi: typeof p.npi === "string" ? p.npi : undefined,
                        specialty: typeof p.specialty === "string" ? p.specialty : undefined,
                    };
                }).filter((p) => p.id > 0);

                setOptions(mapped);
            } else {
                setOptions([]);
            }
        } catch {
            setOptions([]);
        } finally {
            setLoadingProviders(false);
        }
    }

    useEffect(() => {
        const t = setTimeout(() => fetchProviders(q), 300);
        return () => clearTimeout(t);
    }, [q]);

    function chooseProvider(p: ProviderOption) {
        setProviderId(p.id);
        setProviderName(p.name);
        setOptions([]);
        setQ("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setErr(null);
        try {
            if (providerId === "" || Number(providerId) <= 0) throw new Error("Please select a provider");

            const body: AssignedProviderDto = {
                patientId,
                encounterId,
                providerId: Number(providerId),
                role,
                ...(providerName ? { providerName: providerName.trim() } : {}),
                ...(startDate ? { startDate } : {}),
                ...(endDate ? { endDate } : {}),
                ...(notes ? { notes: notes.trim() } : {}),
                ...(editing?.id ? { id: editing.id } : {}),
            };

            const url = editing?.id
                ? `/api/assigned-providers/${patientId}/${encounterId}/${editing.id}`
                : `/api/assigned-providers/${patientId}/${encounterId}`;
            const method = editing?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
            const json = (await res.json()) as ApiResponse<AssignedProviderDto>;
            if (!res.ok || !json.success) throw new Error(json.message || "Save failed");
            onSaved(json.data!);

            if (!editing?.id) {
                setProviderId(""); setProviderName(""); setRole("Primary");
                setStartDate(""); setEndDate(""); setNotes("");
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold">{editing?.id ? "Edit Assignment" : "Assign Provider"}</h3>

            {/* Provider picker */}
            <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                        <input
                            className="w-full rounded-lg border px-3 py-2 focus:ring"
                            placeholder="Search provider by name/NPI…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        {loadingProviders && <p className="text-xs text-gray-500 mt-1">Searching…</p>}
                        {options.length > 0 && (
                            <div className="mt-2 rounded-xl border bg-white shadow-sm max-h-56 overflow-auto">
                                {options.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => chooseProvider(p)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                    >
                                        <div className="font-medium">{p.name}</div>
                                        <div className="text-xs text-gray-600">
                                            {p.npi ? `NPI: ${p.npi}` : ""} {p.specialty ? ` · ${p.specialty}` : ""}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <input
                            className="w-full rounded-lg border px-3 py-2 focus:ring"
                            type="number"
                            min={1}
                            value={providerId}
                            onChange={(e) => setProviderId(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Provider ID"
                            required
                        />
                    </div>
                </div>
                {providerName && <p className="mt-1 text-sm text-gray-700">Selected: {providerName}</p>}
            </div>

            {/* Role & dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={role}
                        onChange={(e) => setRole(e.target.value as AssignedProviderDto["role"])}
                    >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2 focus:ring"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                    className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional details (coverage, shift, responsibilities)"
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
