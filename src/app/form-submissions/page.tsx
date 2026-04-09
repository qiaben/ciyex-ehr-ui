"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/app/(admin)/layout";
import { toast, confirmDialog } from "@/utils/toast";
import { formatDisplayDateTime } from "@/utils/dateUtils";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getEnv } from "@/utils/env";
import { Modal } from "@/components/ui/modal";

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

    // Reject modal
    const [rejectModal, setRejectModal] = useState<{ open: boolean; subId: number | null; formTitle: string }>({ open: false, subId: null, formTitle: "" });
    const [rejectReason, setRejectReason] = useState("");

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
                toast.success("Form submission accepted.");
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

    const openRejectModal = (subId: number, formTitle: string) => {
        setRejectModal({ open: true, subId, formTitle });
        setRejectReason("");
    };

    const handleReject = async () => {
        if (!rejectModal.subId) return;
        if (!rejectReason.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }

        const subId = rejectModal.subId;
        setActionLoading(subId);
        setRejectModal({ open: false, subId: null, formTitle: "" });

        try {
            // Reject first so backend can notify the patient with the reason
            const rejectRes = await fetchWithAuth(
                `${API_URL()}/api/portal/form-submissions/${subId}/reject?reason=${encodeURIComponent(rejectReason)}`,
                { method: "PUT" }
            );
            const rejectData = await rejectRes.json().catch(() => ({}));

            if (!rejectRes.ok || rejectData.success === false) {
                toast.error(`Failed to reject: ${rejectData.message || "Unknown error"}`);
                return;
            }

            // Delete the submission after rejection
            await fetchWithAuth(
                `${API_URL()}/api/portal/form-submissions/${subId}`,
                { method: "DELETE" }
            ).catch(() => {});

            toast.success("Form submission rejected and deleted.");
            fetchSubmissions();
        } catch {
            toast.error("Failed to reject submission. Please try again.");
        } finally {
            setActionLoading(null);
            setRejectReason("");
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
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <div className="flex items-center justify-center min-h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading form submissions...</p>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="h-5 w-5 text-red-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                                <button
                                    onClick={() => { setError(""); setLoading(true); fetchSubmissions(); }}
                                    className="mt-3 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Form Reviews</h1>
                    <p className="text-gray-600 mt-1">Review form submissions from the patient portal</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-xs">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
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

                {paged.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {statusFilter === "pending" ? "No Pending Form Submissions" : "No Form Submissions Found"}
                        </h3>
                        <p className="text-gray-600">
                            {statusFilter === "pending"
                                ? "All patient form submissions have been reviewed."
                                : "No form submissions match your search criteria."}
                        </p>
                        <button
                            onClick={() => { setLoading(true); fetchSubmissions(); }}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="mb-4 flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    {filtered.length} {statusFilter === "pending" ? "pending " : ""}submission{filtered.length !== 1 ? "s" : ""} for review
                                </span>
                                <button
                                    onClick={() => { setLoading(true); fetchSubmissions(); }}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paged.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{sub.patientName || `Patient #${sub.patientId}`}</div>
                                                    <div className="text-xs text-gray-500">ID: {sub.patientId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{sub.formTitle}</div>
                                                    {sub.formDescription && (
                                                        <div className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">{sub.formDescription}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {statusBadge(sub.status)}
                                                    {sub.reviewNote && (
                                                        <div className="text-xs text-gray-400 mt-1 truncate max-w-[150px]" title={sub.reviewNote}>
                                                            {sub.reviewNote}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDisplayDateTime(sub.submittedDate)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openPreview(sub)}
                                                            className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-sm hover:bg-blue-50"
                                                        >
                                                            Preview
                                                        </button>
                                                        {sub.status === "pending" && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAccept(sub.id)}
                                                                    disabled={actionLoading === sub.id}
                                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {actionLoading === sub.id ? "Processing..." : "Accept"}
                                                                </button>
                                                                <button
                                                                    onClick={() => openRejectModal(sub.id, sub.formTitle)}
                                                                    disabled={actionLoading === sub.id}
                                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {actionLoading === sub.id ? "Processing..." : "Reject"}
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

                            {totalPages > 1 && (
                                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                                    <span>{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</span>
                                    <div className="flex items-center gap-2">
                                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-sm">Prev</button>
                                        <span>Page {page + 1} of {totalPages}</span>
                                        <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-sm">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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
                                            const sub = previewModal.submission!;
                                            setPreviewModal({ open: false, submission: null });
                                            openRejectModal(sub.id, sub.formTitle);
                                        }}
                                        className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                                    >
                                        Reject
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

                {/* Reject Modal */}
                <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, subId: null, formTitle: "" })} className="max-w-[480px] p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Reject Form Submission</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Rejecting <span className="font-medium text-gray-700">{rejectModal.formTitle}</span>. The patient will be notified with your reason.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Reason for Rejection <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Incomplete information, missing fields, invalid data..."
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setRejectModal({ open: false, subId: null, formTitle: "" })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reject Submission
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}
