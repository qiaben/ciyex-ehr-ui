'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from "@/app/(admin)/layout";
import { toast, confirmDialog } from "@/utils/toast";
import { formatDisplayDateTime } from "@/utils/dateUtils";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getEnv } from "@/utils/env";
import { Modal } from "@/components/ui/modal";

const API_URL = () => getEnv("NEXT_PUBLIC_API_URL") || "";

interface PendingDocument {
  id: number;
  patientId: number;
  patientName: string;
  fileName: string;
  category: string;
  description?: string;
  contentType?: string;
  fileSize?: number;
  createdDate: string;
  status: string;
}

export default function DocumentReviewsPage() {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; docId: number | null; docName: string }>({ open: false, docId: null, docName: '' });
  const [rejectReason, setRejectReason] = useState('');
  const pageSize = 20;

  const fetchPendingDocuments = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${API_URL()}/api/portal/document-reviews/pending`);
      const data = await response.json();

      if (data.success !== false) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
        setDocuments(list);
      } else {
        setError(data.message || 'Failed to load pending documents');
      }
    } catch (err) {
      console.error('Error fetching pending documents:', err);
      setError('Failed to load pending documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingDocuments();
  }, [fetchPendingDocuments]);

  const handleAccept = async (docId: number) => {
    if (!(await confirmDialog('Accept this document and add it to the patient\'s records?'))) return;

    setActionLoading(docId);
    try {
      const response = await fetchWithAuth(`${API_URL()}/api/portal/document-reviews/${docId}/accept`, {
        method: 'PUT',
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success !== false) {
        toast.success('Document accepted and added to patient records.');
        fetchPendingDocuments();
      } else {
        toast.error(`Failed to accept document: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error accepting document:', err);
      toast.error('Failed to accept document. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (docId: number, docName: string) => {
    setRejectModal({ open: true, docId, docName });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal.docId) return;
    if (!rejectReason.trim()) {
      toast.warning('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(rejectModal.docId);
    setRejectModal({ open: false, docId: null, docName: '' });

    try {
      const response = await fetchWithAuth(
        `${API_URL()}/api/portal/document-reviews/${rejectModal.docId}/reject?reason=${encodeURIComponent(rejectReason)}`,
        { method: 'PUT' }
      );
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success !== false) {
        toast.success('Document rejected. Patient will be notified.');
        fetchPendingDocuments();
      } else {
        toast.error(`Failed to reject document: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error rejecting document:', err);
      toast.error('Failed to reject document. Please try again.');
    } finally {
      setActionLoading(null);
      setRejectReason('');
    }
  };

  const handlePreview = async (docId: number) => {
    try {
      const res = await fetchWithAuth(`${API_URL()}/api/portal/document-reviews/${docId}/preview`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        toast.error('Unable to preview document.');
      }
    } catch {
      toast.error('Failed to load document preview.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryBadge = (cat?: string) => {
    const c = (cat || '').toLowerCase();
    const cls =
      c === 'clinical' ? 'bg-blue-100 text-blue-700' :
      c === 'lab' ? 'bg-green-100 text-green-700' :
      c === 'imaging' ? 'bg-purple-100 text-purple-700' :
      c === 'insurance' ? 'bg-amber-100 text-amber-700' :
      'bg-gray-100 text-gray-600';
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{cat || 'Other'}</span>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pending documents...</p>
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
                  onClick={() => { setError(''); setLoading(true); fetchPendingDocuments(); }}
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
        <h1 className="text-2xl font-bold text-gray-900">Document Reviews</h1>
        <p className="text-gray-600 mt-1">Review documents uploaded by patients from the portal</p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Documents</h3>
          <p className="text-gray-600">All patient-uploaded documents have been reviewed.</p>
          <button
            onClick={() => { setLoading(true); fetchPendingDocuments(); }}
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
                {documents.length} pending document{documents.length !== 1 ? 's' : ''} for review
              </span>
              <button
                onClick={() => { setLoading(true); fetchPendingDocuments(); }}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.slice(page * pageSize, (page + 1) * pageSize).map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.patientName || `Patient #${doc.patientId}`}</div>
                        <div className="text-xs text-gray-500">ID: {doc.patientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{doc.fileName}</div>
                        {doc.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">{doc.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{categoryBadge(doc.category)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDisplayDateTime(doc.createdDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handlePreview(doc.id)}
                            className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-sm hover:bg-blue-50"
                            title="Preview"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleAccept(doc.id)}
                            disabled={actionLoading === doc.id}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === doc.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => openRejectModal(doc.id, doc.fileName)}
                            disabled={actionLoading === doc.id}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === doc.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {Math.ceil(documents.length / pageSize) > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-sm">Prev</button>
                  <span>Page {page + 1} of {Math.ceil(documents.length / pageSize)}</span>
                  <button disabled={page + 1 >= Math.ceil(documents.length / pageSize)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 text-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, docId: null, docName: '' })} className="max-w-[480px] p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reject Document</h3>
            <p className="text-sm text-gray-500 mt-1">
              Rejecting <span className="font-medium text-gray-700">{rejectModal.docName}</span>. The patient will be notified with your reason.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Document is illegible, wrong document type, missing pages..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRejectModal({ open: false, docId: null, docName: '' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Document
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </AdminLayout>
  );
}
