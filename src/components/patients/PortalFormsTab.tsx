"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getEnv } from "@/utils/env";
import { formatDisplayDateTime } from "@/utils/dateUtils";
import {
    FileCheck, Loader2, ChevronDown, ChevronRight, FileText, Eye,
} from "lucide-react";

const API_BASE = () => (getEnv("NEXT_PUBLIC_API_URL") || "").replace(/\/$/, "");

interface PortalForm {
    id: number;
    formKey: string;
    formTitle: string;
    formDescription?: string;
    responseData: Record<string, any>;
    status: "pending" | "accepted" | "rejected";
    submittedDate: string;
    reviewedDate?: string;
    reviewNote?: string;
}

export default function PortalFormsTab({ patientId }: { patientId: number }) {
    const [forms, setForms] = useState<PortalForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchForms = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(
                `${API_BASE()}/api/portal/form-submissions/patient/${patientId}`
            );
            if (res.ok) {
                const json = await res.json();
                const data = json.data || json;
                const all: PortalForm[] = Array.isArray(data) ? data : data?.content || [];
                setForms(all.filter((f) => f.status === "accepted"));
            } else {
                setError("Failed to load portal forms");
            }
        } catch (err) {
            console.error("Failed to load patient portal forms:", err);
            setError("Failed to load portal forms");
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={fetchForms} className="text-sm text-blue-600 hover:text-blue-700 mt-2">
                    Retry
                </button>
            </div>
        );
    }

    if (forms.length === 0) {
        return (
            <div className="text-center py-16">
                <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No accepted portal forms for this patient</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    Portal Forms
                </h3>
                <span className="text-xs text-gray-500">{forms.length} document{forms.length !== 1 ? "s" : ""}</span>
            </div>

            {forms.map((form) => {
                const isExpanded = expandedId === form.id;

                return (
                    <div
                        key={form.id}
                        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                    >
                        {/* Header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : form.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-left">
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{form.formTitle}</div>
                                    <div className="text-xs text-gray-500">
                                        Submitted: {formatDisplayDateTime(form.submittedDate) || form.submittedDate}
                                        {form.reviewedDate && (
                                            <span className="ml-3">
                                                Reviewed: {formatDisplayDateTime(form.reviewedDate) || form.reviewedDate}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border text-blue-600 bg-blue-50 border-blue-200">
                                    <Eye className="w-3 h-3" />
                                    View Document
                                </span>
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                                {form.formDescription && (
                                    <p className="text-xs text-gray-500 mb-3 italic">{form.formDescription}</p>
                                )}
                                <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                                    {Object.entries(form.responseData || {}).map(([key, value]) => (
                                        <div key={key} className="flex px-3 py-2">
                                            <span className="text-xs font-medium text-gray-500 w-2/5 shrink-0">
                                                {key
                                                    .replace(/([A-Z])/g, " $1")
                                                    .replace(/_/g, " ")
                                                    .replace(/^\w/, (c) => c.toUpperCase())}
                                            </span>
                                            <span className="text-xs text-gray-900">
                                                {typeof value === "boolean"
                                                    ? value ? "Yes" : "No"
                                                    : String(value || "\u2014")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {form.reviewNote && (
                                    <div className="mt-3 text-xs text-gray-500">
                                        <span className="font-medium">Review Note:</span> {form.reviewNote}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
