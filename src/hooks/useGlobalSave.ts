import { useState, useCallback } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";

type GlobalSaveResponse = {
  success: boolean;
  message?: string;
  data?: Record<string, string>;
};

export function useGlobalSave(patientId: number, encounterId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const globalSave = useCallback(
    async (data: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchWithOrg(
          `/api/${patientId}/encounters/${encounterId}/global-save`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        const json = (await res.json()) as GlobalSaveResponse;

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Global save failed");
        }

        return json;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error during global save";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [patientId, encounterId]
  );

  return { globalSave, loading, error };
}
