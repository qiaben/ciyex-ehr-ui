"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getEnv } from "@/utils/env";
import { formatDisplayDateTime } from "@/utils/dateUtils";
import {
    ClipboardList, Loader2, CheckCircle2, XCircle, Clock,
    Eye, ChevronDown, ChevronRight, FileText,
} from "lucide-react";

const API_BASE = () => (getEnv("NEXT_PUBLIC_API_URL") || "").replace(/\/$/, "");

interface PortalSubmission {
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

export default function PortalSubmissionsTab({ patientId }: { patientId: number }) {
    const [submissions, setSubmissions] = useState<PortalSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(
                `${API_BASE()}/api/patients/${patientId}/form-submissions`
            );
            if (res.ok) {
                const json = await res.json();
                const data = json.data || json;
                setSubmissions(
                    Array.isArray(data) ? data : data?.content || []
                );
            } else {
                setError("Failed to load submissions");
            }
        } catch (err) {
            console.error("Failed to load patient form submissions:", err);
            setError("Failed to load submissions");
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
        pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200", label: "Pending" },
        accepted: { icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200", label: "Accepted" },
        rejected: { icon: XCircle, color: "text-red-600 bg-red-50 border-red-200", label: "Rejected" },
    };

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
                <button onClick={fetchSubmissions} className="text-sm text-blue-600 hover:text-blue-700 mt-2">
                    Retry
                </button>
            </div>
        );
    }

    // Only show accepted submissions (stored like documents)
    const accepted = submissions.filter((s) => s.status === "accepted");

    if (accepted.length === 0) {
        return (
            <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No accepted form submissions for this patient</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Portal Form Submissions
                </h3>
                <span className="text-xs text-gray-500">{accepted.length} record{accepted.length !== 1 ? "s" : ""}</span>
            </div>

            {accepted.map((sub) => {
                const status = statusConfig[sub.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedId === sub.id;

                return (
                    <div
                        key={sub.id}
                        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                    >
                        {/* Header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-left">
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{sub.formTitle}</div>
                                    <div className="text-xs text-gray-500">
                                        Submitted: {formatDisplayDateTime(sub.submittedDate) || sub.submittedDate}
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                                {sub.formDescription && (
                                    <p className="text-xs text-gray-500 mb-3 italic">{sub.formDescription}</p>
                                )}
                                <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                                    {Object.entries(sub.responseData || {}).map(([key, value]) => (
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
                                {sub.reviewNote && (
                                    <div className="mt-3 text-xs text-gray-500">
                                        <span className="font-medium">Review Note:</span> {sub.reviewNote}
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
