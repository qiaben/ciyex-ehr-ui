// Centralized encounter localStorage management

export type EncounterData = {
  hpi?: { description: string };
  chiefComplaint?: { complaint: string; details: string; patientId: number; encounterId: number };
  assignedProvider?: { providerId: string; providerName: string; role: string; startDate: string; endDate: string; notes: string; patientId: number; encounterId: number };
  patientMedicalHistory?: { description: string };
  pastMedicalHistory?: { description: string };
  assessment?: { diagnosisCode: string; diagnosisName: string; status: string; priority: string; assessmentText: string; notes: string };
  code?: { code: string; codeType: string; modifier: string | null; active: boolean; description: string; diagnosisReporting: boolean; serviceReporting: boolean };
  dateTimeFinalized?: { targetType: string; targetId: string; targetVersion: string; finalizedAt: string; finalizedBy: string; finalizerRole: string; method: string; status: string; reason: string; comments: string };
  familyHistory?: { relation: string; diagnosisCode: string; diagnosisText: string; notes: string };
  plan?: { diagnosticPlan: string; plan: string; notes: string; followUpVisit: string; returnWorkSchool: string };
  physicalExam?: { summary: string; sections: any[] };
  procedure?: { cpt4: string; description: string; units: string; rate: string; relatedIcds: string; modifier1: string; modifier2: string; modifier3: string; modifier4: string; note: string; priceLevelTitle: string; providername: string };
  providerNotes?: { noteTitle: string; noteTypeCode: string; noteStatus: string; noteDateTime: string; authorPractitionerId: string; subjective: string; objective: string; assessment: string; plan: string; narrative: string };
  providerSignature?: { signedBy: string; signerRole: string; comments: string };
  reviewOfSystems?: { system: string; status: string; finding: string; notes: string };
  socialHistory?: { category: string; value: string; details: string };
  vitals?: { weightKg: string; heightCm: string; bpSystolic: string; bpDiastolic: string; pulse: string; respiration: string; temperatureC: string; oxygenSaturation: string; bmi: string; notes: string };
  signoff?: { attestationText: string; ackBilling: boolean; lockEncounter: boolean; cosigner: string; notes: string };
};

export function getEncounterKey(patientId: number, encounterId: number): string {
  return `encounter_${patientId}_${encounterId}`;
}

export function getEncounterData(patientId: number, encounterId: number): EncounterData {
  const key = getEncounterKey(patientId, encounterId);
  const data = localStorage.getItem(key);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function setEncounterSection<K extends keyof EncounterData>(
  patientId: number,
  encounterId: number,
  section: K,
  value: EncounterData[K]
): void {
  const key = getEncounterKey(patientId, encounterId);
  const current = getEncounterData(patientId, encounterId);
  current[section] = value;
  localStorage.setItem(key, JSON.stringify(current));
}

export function removeEncounterSection(
  patientId: number,
  encounterId: number,
  section: keyof EncounterData
): void {
  const key = getEncounterKey(patientId, encounterId);
  const current = getEncounterData(patientId, encounterId);
  delete current[section];
  if (Object.keys(current).length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(current));
  }
}

export function clearEncounterData(patientId: number, encounterId: number): void {
  const key = getEncounterKey(patientId, encounterId);
  localStorage.removeItem(key);
}
