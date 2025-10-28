

"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PlanDto } from "@/utils/types";
import PlanForm from "./Planform";

type Props = { patientId: number; encounterId: number };

// --- tolerate 204/empty responses everywhere
async function safeJson<T>(res: Response): Promise<T | null> {
  const t = await res.text().catch(() => "");
  if (!t) return null;
  try {
    return JSON.parse(t) as T;
  } catch {
    return null;
  }
}

export default function PlanList({ patientId, encounterId }: Props) {
  const [items, setItems] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlanDto | null>(null);

  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function toast(type: "success" | "error", msg: string) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3200);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithOrg(`/api/plan/${patientId}/${encounterId}`, {
        headers: { Accept: "application/json" },
      });
      const json = await safeJson<ApiResponse<PlanDto[] | PlanDto>>(res);
      if (!res.ok) throw new Error(json?.message || `Load failed (HTTP ${res.status})`);
      if (!json?.success) throw new Error(json?.message || "Load failed");

      const data = Array.isArray(json?.data)
        ? (json!.data as PlanDto[])
        : json?.data
        ? [json.data as PlanDto]
        : [];
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, encounterId]);

  function onSaved(saved: PlanDto) {
    setShowForm(false);
    setEditing(null);
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === saved.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    toast("success", "Plan saved.");
  }

  async function remove(id: number) {
    if (!confirm("Delete this plan?")) return;
    try {
      setBusyId(id);
      const res = await fetchWithOrg(`/api/plan/${patientId}/${encounterId}/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.status === 204) {
        setItems((p) => p.filter((x) => x.id !== id));
        toast("success", "Plan deleted.");
        return;
      }
      const json = await safeJson<ApiResponse<void>>(res);
      if (!res.ok || (json && json.success === false))
        throw new Error(json?.message || `Delete failed (HTTP ${res.status})`);
      setItems((p) => p.filter((x) => x.id !== id));
      toast("success", "Plan deleted.");
    } catch (e: unknown) {
      toast("error", e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function esign(id: number) {
    try {
      setBusyId(id);
      const res = await fetchWithOrg(
        `/api/plan/${patientId}/${encounterId}/${id}/esign`,
        { method: "POST", headers: { Accept: "application/json" } }
      );
      let ok = res.ok;
      const json = await safeJson<ApiResponse<PlanDto>>(res);
      if (json && json.success === false) ok = false;
      if (!ok) throw new Error(json?.message || "eSign failed");

      if (json?.data) {
        setItems((prev) => prev.map((p) => (p.id === id ? json.data! : p)));
      }
      toast("success", "Plan e-signed.");
      await load();
    } catch (e: unknown) {
      toast("error", e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function printBackend(id: number) {
    try {
      setBusyId(id);
      const res = await fetchWithOrg(
        `/api/plan/${patientId}/${encounterId}/${id}/print`,
        { method: "GET", headers: { Accept: "application/pdf" } }
      );
      if (!res.ok) throw new Error(`Print failed (HTTP ${res.status})`);
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error("Empty PDF received");
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) window.alert("Popup blocked. Please allow popups to view the PDF.");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : "Unable to print");
    } finally {
      setBusyId(null);
    }
  }

  const sorted = useMemo(() => {
    const safeTime = (s?: string) => {
      if (!s) return 0;
      const t = Date.parse(s);
      return Number.isNaN(t) ? 0 : t;
    };
    return [...items].sort((a, b) => {
      const t1 = safeTime(a.audit?.lastModifiedDate) || safeTime(a.audit?.createdDate);
      const t2 = safeTime(b.audit?.lastModifiedDate) || safeTime(b.audit?.createdDate);
      return t2 - t1; // newest first
    });
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plan</h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
          className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
        >
          {showForm ? "Close" : "Add Plan"}
        </button>
      </div>

      {alert && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            alert.type === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {alert.msg}
        </div>
      )}

      {showForm && (
        <PlanForm
          patientId={patientId}
          encounterId={encounterId}
          editing={editing}
          onSaved={onSaved}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {loading && <div className="text-gray-600">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && sorted.length === 0 && (
        <div className="rounded-xl border p-4 text-gray-600">No plan recorded yet.</div>
      )}

      <ul className="space-y-3">
        {sorted.map((p) => {
          const id = p.id;
          const isSigned = Boolean(p.esigned) || Boolean(p.signedAt);

          return (
            <li key={id} className="rounded-2xl border p-4 bg-white shadow-sm">
              <div className="space-y-2">
                {p.diagnosticPlan && (
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">Diagnostic Plan</p>
                    <p className="text-sm whitespace-pre-wrap">{p.diagnosticPlan}</p>
                  </div>
                )}
                {p.plan && (
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">Plan</p>
                    <p className="text-sm whitespace-pre-wrap">{p.plan}</p>
                  </div>
                )}
                {p.notes && (
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{p.notes}</p>
                  </div>
                )}
                {(p.followUpVisit || p.returnWorkSchool) && (
                  <div className="rounded-lg border p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {p.followUpVisit && (
                      <div>
                        <p className="font-medium">Follow-Up Visit</p>
                        <p className="text-sm">{p.followUpVisit}</p>
                      </div>
                    )}
                    {p.returnWorkSchool && (
                      <div>
                        <p className="font-medium">Return Work/School</p>
                        <p className="text-sm">{p.returnWorkSchool}</p>
                      </div>
                    )}
                  </div>
                )}
                {p.sectionsJson && (
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">Sections JSON</p>
                    <pre className="text-xs overflow-auto">
                      {typeof p.sectionsJson === "string"
                        ? p.sectionsJson
                        : JSON.stringify(p.sectionsJson, null, 2)}
                    </pre>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {p.audit?.createdDate && <>Created: {p.audit.createdDate}</>}
                  {p.audit?.lastModifiedDate && <> · Updated: {p.audit.lastModifiedDate}</>}
                </p>
                {isSigned && <p className="text-xs text-gray-500">Signed — read only</p>}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {!isSigned && (
                  <>
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                      className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => id && remove(id)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                      disabled={busyId === id}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => id && esign(id)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                      disabled={busyId === id}
                      title="eSign"
                    >
                      eSign
                    </button>
                  </>
                )}
                <button
                  onClick={() => id && printBackend(id)}
                  className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                  disabled={busyId === id}
                  title="Print (PDF)"
                >
                  Print
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
