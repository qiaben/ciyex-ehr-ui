"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/app/(admin)/layout";
import { toast, confirmDialog } from "@/utils/toast";
import { formatDisplayDateTime } from "@/utils/dateUtils";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getEnv } from "@/utils/env";
import { Modal } from "@/components/ui/modal";
import {
    ClipboardList, Loader2, CheckCircle2, Trash2, Eye,
    Clock, ChevronDown, ChevronRight, Search, RefreshCw,
} from "lucide-react";

const API_URL = () => getEnv("NEXT_PUBLIC_API_URL") || "";

interface FormSubmission {
    id: number;
    patientId: number;
    patientName: string;
    formId: number;
    formKey: string;
    formTitle: string;
    formDescription?: string;
    responseData: Record<string, any>;
    status: "pending" | "accepted" | "rejected";
    submittedDate: string;
    reviewedDate?: string;
    reviewedBy?: string;
    reviewNote?: string;
}

export default function FormSubmissionsPage() {
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 20;

    // Preview modal
    const [previewModal, setPreviewModal] = useState<{
        open: boolean;
        submission: FormSubmission | null;
    }>({ open: false, submission: null });

    const fetchSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = statusFilter === "pending"
                ? `${API_URL()}/api/portal/form-submissions/pending`
                : `${API_URL()}/api/portal/form-submissions`;
            const response = await fetchWithAuth(endpoint);
            const data = await response.json();

            if (data.success !== false) {
                const list = Array.isArray(data.data)
                    ? data.data
                    : data.data?.content || (Array.isArray(data) ? data : []);
                setSubmissions(list);
            } else {
                setError(data.message || "Failed to load form submissions");
            }
        } catch (err) {
            console.error("Error fetching form submissions:", err);
            setError("Failed to load form submissions");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleAccept = async (subId: number) => {
        if (!(await confirmDialog("Accept this form submission and add it to the patient's records?"))) return;

        setActionLoading(subId);
        try {
            const response = await fetchWithAuth(
                `${API_URL()}/api/portal/form-submissions/${subId}/accept`,
                { method: "PUT" }
            );
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success !== false) {
                toast.success("Form submission accepted and added to patient records.");
                fetchSubmissions();
            } else {
                toast.error(`Failed to accept: ${data.message || "Unknown error"}`);
            }
        } catch {
            toast.error("Failed to accept submission. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (subId: number) => {
        if (!(await confirmDialog("Delete this form submission? This cannot be undone."))) return;

        setActionLoading(subId);
        try {
            const response = await fetchWithAuth(
                `${API_URL()}/api/portal/form-submissions/${subId}`,
                { method: "DELETE" }
            );
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success !== false) {
                toast.success("Form submission deleted.");
                fetchSubmissions();
            } else {
                toast.error(`Failed to delete: ${data.message || "Unknown error"}`);
            }
        } catch {
            toast.error("Failed to delete submission. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const openPreview = (submission: FormSubmission) => {
        setPreviewModal({ open: true, submission });
    };

    // Filter & paginate
    const filtered = submissions.filter((s) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            s.patientName?.toLowerCase().includes(term) ||
            s.formTitle?.toLowerCase().includes(term) ||
            s.formKey?.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

    const statusBadge = (status: string) => {
        const cls =
            status === "pending" ? "bg-yellow-100 text-yellow-700" :
            status === "accepted" ? "bg-green-100 text-green-700" :
            status === "rejected" ? "bg-red-100 text-red-700" :
            "bg-gray-100 text-gray-600";
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                            Form Submissions
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review and manage form submissions from the patient portal
                        </p>
                    </div>
                    <button
                        onClick={fetchSubmissions}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by patient or form name..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="pending">Pending Only</option>
                        <option value="all">All Submissions</option>
                    </select>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-red-500 text-sm">{error}</p>
                        <button onClick={fetchSubmissions} className="text-sm text-blue-600 hover:text-blue-700 mt-2">
                            Try Again
                        </button>
                    </div>
                ) : paged.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                            {statusFilter === "pending"
                                ? "No pending form submissions"
                                : "No form submissions found"}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paged.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">{sub.patientName}</div>
                                                <div className="text-xs text-gray-500">ID: {sub.patientId}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">{sub.formTitle}</div>
                                                <div className="text-xs text-gray-500 font-mono">{sub.formKey}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {formatDisplayDateTime(sub.submittedDate) || sub.submittedDate}
                                            </td>
                                            <td className="px-4 py-3">
                                                {statusBadge(sub.status)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openPreview(sub)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                                        title="View Response"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {sub.status === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAccept(sub.id)}
                                                                disabled={actionLoading === sub.id}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 disabled:opacity-50"
                                                                title="Accept"
                                                            >
                                                                {actionLoading === sub.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(sub.id)}
                                                                disabled={actionLoading === sub.id}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                                <span>
                                    Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Preview Modal */}
                <Modal
                    isOpen={previewModal.open}
                    onClose={() => setPreviewModal({ open: false, submission: null })}
                >
                    {previewModal.submission && (
                        <div className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {previewModal.submission.formTitle}
                            </h3>
                            <p className="text-sm text-gray-500 mb-1">
                                Patient: <span className="font-medium">{previewModal.submission.patientName}</span>
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                                Submitted: {formatDisplayDateTime(previewModal.submission.submittedDate) || previewModal.submission.submittedDate}
                            </p>

                            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                                {Object.entries(previewModal.submission.responseData || {}).map(
                                    ([key, value]) => (
                                        <div key={key} className="flex px-4 py-2.5">
                                            <span className="text-sm font-medium text-gray-600 w-1/3 shrink-0">
                                                {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                                            </span>
                                            <span className="text-sm text-gray-900">
                                                {typeof value === "boolean"
                                                    ? value ? "Yes" : "No"
                                                    : String(value || "—")}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>

                            {previewModal.submission.status === "pending" && (
                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            const subId = previewModal.submission!.id;
                                            setPreviewModal({ open: false, submission: null });
                                            handleDelete(subId);
                                        }}
                                        className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            const subId = previewModal.submission!.id;
                                            setPreviewModal({ open: false, submission: null });
                                            handleAccept(subId);
                                        }}
                                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Accept
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
