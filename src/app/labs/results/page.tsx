"use client";
import React from "react";
import LabResultsTable from "@/components/labresults/LabResultsTable";
import AdminLayout from "@/app/(admin)/layout";

export default function LabResultsPage() {
  // In a real scenario patientId might come from route params or context
  const mockPatientId = 12345;
  return (
    <AdminLayout>
    <div className="p-6 space-y-6">
      <LabResultsTable patientId={mockPatientId} />
    </div>
    </AdminLayout>
  );
}
