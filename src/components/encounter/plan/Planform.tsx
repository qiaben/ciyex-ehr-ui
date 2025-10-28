"use client";

import { useEffect, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, PlanDto } from "@/utils/types";

type Props = {
  patientId: number;
  encounterId: number;
  editing?: PlanDto | null;
  onSaved: (saved: PlanDto) => void;
  onCancel?: () => void;
};

const DEFAULT_SECTIONS = {
  templates: ["Plan Template A"],
  diagnostic: { search: "" },
};

export default function PlanForm({ patientId, encounterId, editing, onSaved, onCancel }: Props) {
  const [diagnosticPlan, setDiagnosticPlan] = useState("");
  const [plan, setPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpVisit, setFollowUpVisit] = useState("");
  const [returnWorkSchool, setReturnWorkSchool] = useState("");
  const [sectionsJsonText, setSectionsJsonText] = useState(
    JSON.stringify(DEFAULT_SECTIONS, null, 2)
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (editing?.id) {
      setDiagnosticPlan(editing.diagnosticPlan || "");
      setPlan(editing.plan || "");
      setNotes(editing.notes || "");
      setFollowUpVisit(editing.followUpVisit || "");
      setReturnWorkSchool(editing.returnWorkSchool || "");
      setSectionsJsonText(
        editing.sectionsJson
          ? JSON.stringify(editing.sectionsJson, null, 2)
          : JSON.stringify(DEFAULT_SECTIONS, null, 2)
      );
    } else {
      setDiagnosticPlan("");
      setPlan("");
      setNotes("");
      setFollowUpVisit("");
      setReturnWorkSchool("");
      setSectionsJsonText(JSON.stringify(DEFAULT_SECTIONS, null, 2));
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    try {
      // Validate the “Sections JSON” textarea content.
      let sectionsJson: Record<string, unknown> | undefined = undefined;
      const trimmed = sectionsJsonText.trim();
      if (trimmed) {
        try {
          sectionsJson = JSON.parse(trimmed);
        } catch {
          throw new Error("Sections JSON is not valid JSON.");
        }
      }

      // const body: PlanDto = {
      //   patientId,
      //   encounterId,
      //   ...(diagnosticPlan ? { diagnosticPlan: diagnosticPlan.trim() } : {}),
      //   ...(plan ? { plan: plan.trim() } : {}),
      //   ...(notes ? { notes: notes.trim() } : {}),
      //   ...(followUpVisit ? { followUpVisit: followUpVisit.trim() } : {}),
      //   ...(returnWorkSchool ? { returnWorkSchool: returnWorkSchool.trim() } : {}),
      //  ...(sectionsJsonText ? { sectionsJson: sectionsJsonText.trim() } : {}),

      //   ...(editing?.id ? { id: editing.id } : {}),
      // };
      const body: PlanDto = {
  patientId,
  encounterId,
  ...(diagnosticPlan ? { diagnosticPlan: diagnosticPlan.trim() } : {}),
  ...(plan ? { plan: plan.trim() } : {}),
  ...(notes ? { notes: notes.trim() } : {}),
  ...(followUpVisit ? { followUpVisit: followUpVisit.trim() } : {}),
  ...(returnWorkSchool ? { returnWorkSchool: returnWorkSchool.trim() } : {}),
  ...(sectionsJson ? { sectionsJson } : {}),   // <-- use parsed JSON here
  ...(editing?.id ? { id: editing.id } : {}),
};


      const url = editing?.id
        ? `/api/plan/${patientId}/${encounterId}/${editing.id}`
        : `/api/plan/${patientId}/${encounterId}`;
      const method = editing?.id ? "PUT" : "POST";

      const res = await fetchWithOrg(url, { method, body: JSON.stringify(body) });
      const json = (await res.json()) as ApiResponse<PlanDto>;
      if (!res.ok || !json.success) throw new Error(json.message || "Save failed");

      onSaved(json.data!);

      if (!editing?.id) {
        setDiagnosticPlan("");
        setPlan("");
        setNotes("");
        setFollowUpVisit("");
        setReturnWorkSchool("");
        setSectionsJsonText(JSON.stringify(DEFAULT_SECTIONS, null, 2));
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-4 shadow-sm bg-white">
      <h3 className="text-lg font-semibold">{editing?.id ? "Edit Plan" : "Add Plan"}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Diagnostic Plan</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
            value={diagnosticPlan}
            onChange={(e) => setDiagnosticPlan(e.target.value)}
            placeholder="Order CBC, CMP, Chest X-Ray."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Plan</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Start bronchodilator, lifestyle advice, follow-up in 4 weeks."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:ring min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Patient is compliant with meds."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Follow-Up Visit</label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:ring"
            value={followUpVisit}
            onChange={(e) => setFollowUpVisit(e.target.value)}
            placeholder="4 weeks"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Return Work/School</label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:ring"
            value={returnWorkSchool}
            onChange={(e) => setReturnWorkSchool(e.target.value)}
            placeholder="Return to work on 2025-08-20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Sections JSON</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:ring font-mono min-h-36"
            value={sectionsJsonText}
            onChange={(e) => setSectionsJsonText(e.target.value)}
            placeholder='{"templates":["Plan Template A"],"diagnostic":{"search":"asthma"}}'
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste a valid JSON object. It will be sent as <code>sectionsJson</code>.
          </p>
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
