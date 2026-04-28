"use client";

import AdminLayout from "@/app/(admin)/layout";
import React, { useState } from "react";
import { GraduationCap } from "lucide-react";
import MaterialLibrary from "@/components/education/MaterialLibrary";
import MaterialForm from "@/components/education/MaterialForm";
import MaterialDetail from "@/components/education/MaterialDetail";
import AssignMaterialModal from "@/components/education/AssignMaterialModal";
import { EducationMaterial } from "@/components/education/types";

export default function PatientEducationPage() {
    const [selectedMaterial, setSelectedMaterial] = useState<EducationMaterial | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<EducationMaterial | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [assignMaterial, setAssignMaterial] = useState<EducationMaterial | null>(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleNew = () => {
        setEditingMaterial(null);
        setFormOpen(true);
    };

    const handleEdit = (m: EducationMaterial) => {
        setEditingMaterial(m);
        setFormOpen(true);
    };

    const handleAssign = (m: EducationMaterial) => {
        setAssignMaterial(m);
        setAssignOpen(true);
    };

    const handleSaved = () => {
        setFormOpen(false);
        setEditingMaterial(null);
        setRefreshKey((k) => k + 1);
    };

    const handleAssigned = () => {
        setAssignOpen(false);
        setAssignMaterial(null);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-slate-900 dark:border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Patient Education</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Manage education materials and assign them to patients
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body — Material Library handles Add/Edit/Delete via its own header + row actions */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {selectedMaterial ? (
                        <MaterialDetail
                            material={selectedMaterial}
                            onBack={() => setSelectedMaterial(null)}
                        />
                    ) : (
                        <MaterialLibrary
                            onSelectMaterial={setSelectedMaterial}
                            onEditMaterial={handleEdit}
                            onNewMaterial={handleNew}
                            onAssignMaterial={handleAssign}
                            refreshKey={refreshKey}
                        />
                    )}
                </div>

                {/* Material Form (Create / Edit) */}
                <MaterialForm
                    open={formOpen}
                    onClose={() => {
                        setFormOpen(false);
                        setEditingMaterial(null);
                    }}
                    material={editingMaterial}
                    onSaved={handleSaved}
                />

                {/* Assign Material Modal */}
                <AssignMaterialModal
                    open={assignOpen}
                    onClose={() => {
                        setAssignOpen(false);
                        setAssignMaterial(null);
                    }}
                    onAssigned={handleAssigned}
                    preselectedMaterial={assignMaterial}
                />
            </div>
        </AdminLayout>
    );
}
