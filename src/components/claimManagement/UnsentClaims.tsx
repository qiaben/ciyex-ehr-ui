import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Edit, Eye, Paperclip, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = "/api/patient-billing";

// Type definitions
type Claim = {
  id: number;
  patientId: number;
  patientName: string;
  type: string;
  createdOn: string;
  provider: string;
  status: string;
  notes?: string;
  description?: string;
  hasAttachment?: boolean;
};

type ClaimLineDetail = {
  lineid: number;
  dos: number[];
  code: string;
  description: string;
  provider: string;
  totalSubmittedAmount: number;
};

const UnsentClaims: React.FC = () => {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchClaim, setSearchClaim] = useState("");
  const [filters, setFilters] = useState({ type: "", carrier: "", attachment: "" });
  const [loading, setLoading] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [hiddenClaims, setHiddenClaims] = useState<Set<number>>(new Set());

  // ✅ Patient search
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Modal + states
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showConvertTypeModal, setShowConvertTypeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showEditNarrativeModal, setShowEditNarrativeModal] = useState(false);
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<Claim | null>(null);
  const [narrativeText, setNarrativeText] = useState("");
  
  // Line details modal
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetails, setLineDetails] = useState<ClaimLineDetail[]>([]);
  const [lineDetailsLoading, setLineDetailsLoading] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusToChange, setStatusToChange] = useState("");
  const [remittanceDate, setRemittanceDate] = useState("");
  const [insurancePaymentAmount, setInsurancePaymentAmount] = useState("");
  const [typeToConvert, setTypeToConvert] = useState("");

  // ✅ Patient search API call
  const searchPatientsAPI = async (query: string) => {
    if (!query || query.length < 2) {
      setPatientSearchResults([]);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetchWithAuth(
        `${API_URL}/api/all-claims/patient-search?query=${encodeURIComponent(query)}&page=0&size=20`
      );
      
      if (!res.ok) throw new Error("Failed to search patients");
      
      const response = await res.json();
      setPatientSearchResults(response.data?.content || []);
      setShowPatientDropdown(true);
    } catch (err: any) {
      console.error("Patient search error:", err);
      setPatientSearchResults([]);
    }
  };

  // ✅ Debounce patient search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearchQuery) {
        searchPatientsAPI(patientSearchQuery);
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearchQuery]);

  // ✅ Load claims by patient ID
  const loadClaimsByPatient = async (patientId: number) => {
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      const res = await fetchWithAuth(`${API_URL}/api/all-claims/patient/${patientId}/claims`);
      if (!res.ok) throw new Error("Failed to fetch patient claims");

      const response = await res.json();
      setClaims(response.data || []);
      setUniqueCarriers(
        Array.from(new Set((response.data || []).map((c: any) => String(c.provider)).filter(Boolean)))
      );
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching patient claims");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load all claims
  useEffect(() => {
    if (selectedPatientId) {
      loadClaimsByPatient(selectedPatientId);
    } else {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      fetchWithAuth(`${API_URL}/api/all-claims`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch claims");
          return res.json();
        })
        .then(data => {
          setClaims(data);
          setUniqueCarriers(Array.from(new Set(data.map((c: any) => String(c.provider)).filter(Boolean))));
          setError(null);
        })
        .catch(err => {
          setError(err.message || "Error fetching claims");
        })
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  // ✅ Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // ✅ Filter claims
  const filteredClaims = claims.filter((claim: any) => {
    return (
      !hiddenClaims.has(claim.id) &&
      (!searchPatient || (claim.patientName && claim.patientName.toLowerCase().includes(searchPatient.toLowerCase()))) &&
      (!searchClaim || (claim.id && claim.id.toString().includes(searchClaim)) || claim.createdOn?.includes(searchClaim)) &&
      (!filters.type || claim.type === filters.type) &&
      (!filters.carrier || claim.provider === filters.carrier) &&
      (!filters.attachment || (filters.attachment === "yes" ? claim.hasAttachment : !claim.hasAttachment))
    );
  });

  // ✅ Select items
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedClaims);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedClaims(newSet);
  };

  const selectAll = () => {
    if (selectedClaims.size === filteredClaims.length) {
      setSelectedClaims(new Set());
    } else {
      setSelectedClaims(new Set(filteredClaims.map((c: any) => c.id)));
    }
  };

  const selectedCount = selectedClaims.size;

  // ✅ UPDATE - Change Status
const handleChangeStatus = async () => {
  if (!statusToChange || selectedClaims.size === 0) return;

  setActionLoading(true);
  setActionError(null);

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // ✅ UPDATE EACH CLAIM
    for (const claimId of selectedClaims) {
      await fetchWithAuth(
        `${API_URL}/api/all-claims/${claimId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusToChange,
            remitDate: remittanceDate,
            paymentAmount: insurancePaymentAmount
          }),
        }
      );
    }

    setShowChangeStatusModal(false);
    setSelectedClaims(new Set());
    setStatusToChange("");
    setRemittanceDate("");
    setInsurancePaymentAmount("");

    window.location.reload();
  } catch (err: any) {
    setActionError(err.message || "Error changing status");
  } finally {
    setActionLoading(false);
  }
};


  // ✅ UPDATE - Convert Type
  const handleConvertType = async () => {
    if (!typeToConvert || selectedClaims.size === 0) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // ✅ UPDATE EACH CLAIM TYPE
      for (const claimId of selectedClaims) {
        await fetchWithAuth(
          `${API_URL}/api/all-claims/${claimId}/convert-type`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetType: typeToConvert
            }),
          }
        );
      }

      setShowConvertTypeModal(false);
      setSelectedClaims(new Set());
      setTypeToConvert("");

      window.location.reload();
    } catch (err: any) {
      setActionError(err.message || "Error converting type");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Navigate to patient page
  const navigateToPatientBilling = (patientId: number) => {
    if (patientId) {
      // Navigate to patient page - user will need to click Billing tab
      router.push(`/patients/${patientId}`);
    }
  };

  // ✅ Fetch claim line details
  const fetchLineDetails = async (claimId: number) => {
    setLineDetailsLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      const res = await fetchWithAuth(`${API_URL}/api/all-claims/${claimId}/line-details`);
      if (!res.ok) throw new Error("Failed to fetch line details");
      
      const response = await res.json();
      setLineDetails(response.data || []);
      setShowLineDetailsModal(true);
    } catch (err: any) {
      console.error("Error fetching line details:", err);
      alert("Failed to load procedure details");
    } finally {
      setLineDetailsLoading(false);
    }
  };


 


  return (
    <div className="p-4">

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* ✅ Top Filters */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {/* ✅ Patient Search with Dropdown */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search patient by name/MRN"
            value={patientSearchQuery}
            onChange={e => {
              setPatientSearchQuery(e.target.value);
              if (!e.target.value) {
                setSelectedPatientId(null);
              }
            }}
            onFocus={() => patientSearchResults.length > 0 && setShowPatientDropdown(true)}
            className="border px-2 py-1 rounded w-64"
          />
          
          {showPatientDropdown && patientSearchResults.length > 0 && (
            <div className="absolute z-50 bg-white border border-gray-300 rounded shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
              {patientSearchResults.map((patient: any) => (
                <div
                  key={patient.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setPatientSearchQuery(`${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn})`);
                    setShowPatientDropdown(false);
                  }}
                >
                  <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                  <div className="text-sm text-gray-500">MRN: {patient.mrn}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPatientId && (
          <button
            className="border px-2 py-1 rounded bg-gray-200 text-sm"
            onClick={() => {
              setSelectedPatientId(null);
              setPatientSearchQuery("");
            }}
          >
            Clear Patient Filter
          </button>
        )}

        <input
          type="text"
          placeholder="Search by patient"
          value={searchPatient}
          onChange={e => setSearchPatient(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="text"
          placeholder="Search by claim ID or date"
          value={searchClaim}
          onChange={e => setSearchClaim(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <select
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          className="border px-2 py-1 rounded"
        >
          <option value="">Filter by Claim Type</option>
          <option value="manual">Manual</option>
          <option value="electronic">Electronic</option>
        </select>
        <select
          value={filters.carrier}
          onChange={e => setFilters(f => ({ ...f, carrier: e.target.value }))}
          className="border px-2 py-1 rounded"
        >
          <option value="">Filter by Carrier</option>
          {uniqueCarriers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filters.attachment}
          onChange={e => setFilters(f => ({ ...f, attachment: e.target.value }))}
          className="border px-2 py-1 rounded"
        >
          <option value="">Filter by Claim Attachment</option>
          <option value="yes">With Attachment</option>
          <option value="no">Without Attachment</option>
        </select>

        <div className="flex gap-2">
          <button 
            className="border px-2 py-1 rounded bg-blue-500 text-white"
            disabled={!selectedCount}
            onClick={() => setShowConvertTypeModal(true)}
          >
            Convert Type
          </button>

          <button
            className="border px-2 py-1 rounded bg-blue-500 text-white"
            disabled={!selectedCount}
            onClick={() => setShowChangeStatusModal(true)}
          >
            Change Status
          </button>

          <button
            className="border px-2 py-1 rounded bg-orange-500 text-white"
           
          >
            Sent Claims ({selectedCount})
          </button>

          <button className="border px-2 py-1 rounded bg-gray-500 text-white">
            Print Claims
          </button>
        </div>
      </div>

      {/* ✅ Claims Table */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">
              <input type="checkbox" onChange={selectAll} />
            </th>
            <th className="p-2">Patient Name</th>
            <th className="p-2">Claim #</th>
            <th className="p-2">Claim Type</th>
            <th className="p-2">Created Date</th>
            <th className="p-2">Carrier</th>
            <th className="p-2">Procedures</th>
            <th className="p-2">Status</th>
            <th className="p-2">Notes</th>
            <th className="p-2">Description</th>
            <th className="p-2">Actions</th>
            <th className="p-2">Hide</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={11} className="text-center p-4">
                Loading...
              </td>
            </tr>
          ) : filteredClaims.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center p-4">
                No claims found
              </td>
            </tr>
          ) : (
            filteredClaims.map((claim: any) => (
              <tr key={claim.id} className="border-b">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedClaims.has(claim.id)}
                    onChange={() => toggleSelect(claim.id)}
                  />
                </td>
                <td className="p-2">
                  <button 
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                    onClick={() => navigateToPatientBilling(claim.patientId)}
                    title="View patient billing"
                  >
                    {claim.patientName}
                  </button>
                </td>
                <td className="p-2">{claim.id}</td>
                <td className="p-2">{claim.type}</td>
                <td className="p-2">{formatDate(claim.createdOn)}</td>
                <td className="p-2">{claim.provider}</td>
                <td className="p-2">
                  <button 
                    className="text-blue-500 hover:text-blue-700 hover:underline"
                    onClick={() => fetchLineDetails(claim.id)}
                    disabled={lineDetailsLoading}
                  >
                    {lineDetailsLoading ? "Loading..." : "Show"}
                  </button>
                </td>
                <td className="p-2">{claim.status}</td>
                <td className="p-2">{claim.notes}</td>
                <td className="p-2">{claim.description || ""}</td>
                <td className="p-2 flex gap-2">
                  <button 
                    className="border px-2 py-1 rounded text-xs hover:bg-blue-50 flex items-center gap-1" 
                    title="Edit"
                    onClick={() => {
                      setSelectedClaimForAction(claim);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    className="border px-2 py-1 rounded text-xs hover:bg-green-50 flex items-center gap-1" 
                    title="View"
                    onClick={() => {
                      setSelectedClaimForAction(claim);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="border px-2 py-1 rounded text-xs hover:bg-gray-50 flex items-center gap-1" 
                    title="Attachments"
                    onClick={() => {
                      setSelectedClaimForAction(claim);
                      setShowAttachmentModal(true);
                    }}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </td>
                <td className="p-2">
                  <button 
                    className="border px-2 py-1 rounded text-xs hover:bg-red-50 flex items-center gap-1" 
                    title="Hide"
                    onClick={() => {
                      const newHidden = new Set(hiddenClaims);
                      newHidden.add(claim.id);
                      setHiddenClaims(newHidden);
                    }}
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {filteredClaims.length > 8 && (
        <button className="mt-2 border px-4 py-2 rounded">
          Load More Claims
        </button>
      )}

      <button className="mt-2 ml-2 text-sm text-blue-500">
        Expand all Clearing House Messages
      </button>

      {/* ✅ Change Status Modal */}
      {showChangeStatusModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h3 className="font-semibold mb-2">Modify Claim Status</h3>

            <form>
              <div className="mb-4 flex flex-col gap-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="claimStatus"
                    value="ACCEPTED"
                    checked={statusToChange === "ACCEPTED"}
                    onChange={e => setStatusToChange(e.target.value)}
                  />
                  <span className="ml-2">Accepted & Paid</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="claimStatus"
                    value="DENIED"
                    checked={statusToChange === "DENIED"}
                    onChange={e => setStatusToChange(e.target.value)}
                  />
                  <span className="ml-2">Accepted but Final Payment Denied</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="claimStatus"
                    value="REJECTED"
                    checked={statusToChange === "REJECTED"}
                    onChange={e => setStatusToChange(e.target.value)}
                  />
                  <span className="ml-2">Rejected</span>
                </label>
              </div>

              {(statusToChange === "ACCEPTED" ||
                statusToChange === "DENIED") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Remittance Date
                  </label>
                  <input
                    type="date"
                    value={remittanceDate}
                    onChange={e => setRemittanceDate(e.target.value)}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              )}

              {statusToChange === "ACCEPTED" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Insurance Payment Amount
                  </label>
                  <input
                    type="number"
                    value={insurancePaymentAmount}
                    onChange={e => setInsurancePaymentAmount(e.target.value)}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              )}

              {actionError && <p className="text-red-500 mb-2">{actionError}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-1 rounded bg-blue-500 text-white"
                  disabled={actionLoading || !statusToChange}
                  onClick={handleChangeStatus}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-1 rounded bg-gray-300"
                  onClick={() => setShowChangeStatusModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Convert Type Modal */}
      {showConvertTypeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="font-semibold text-lg mb-6">Convert Claim Type</h3>

            <form>
              <div className="mb-6 flex flex-col gap-4">
                <button
                  type="button"
                  className={`w-full px-6 py-3 rounded border-2 text-left font-medium transition-all ${
                    typeToConvert === "Manual"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                  onClick={() => setTypeToConvert("Manual")}
                >
                  To Manual
                </button>

                <button
                  type="button"
                  className={`w-full px-6 py-3 rounded border-2 text-left font-medium transition-all ${
                    typeToConvert === "Electronic"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                  onClick={() => setTypeToConvert("Electronic")}
                >
                  To Electronic
                </button>
              </div>

              {actionError && <p className="text-red-500 mb-4 text-sm">{actionError}</p>}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium"
                  onClick={() => {
                    setShowConvertTypeModal(false);
                    setTypeToConvert("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading || !typeToConvert}
                  onClick={handleConvertType}
                >
                  {actionLoading ? "Converting..." : "Convert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Edit Modal */}
      {showEditModal && selectedClaimForAction && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h3 className="font-semibold text-lg mb-4">Edit Claim #{selectedClaimForAction.id}</h3>
            <button
              className="w-full px-4 py-2 mb-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => {
                setNarrativeText(selectedClaimForAction.description || "");
                setShowEditNarrativeModal(true);
                setShowEditModal(false);
              }}
            >
              Edit Narrative
            </button>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 rounded bg-gray-300"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedClaimForAction(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit Narrative Modal */}
      {showEditNarrativeModal && selectedClaimForAction && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[500px]">
            <h3 className="font-semibold text-lg mb-4">Edit Narrative - Claim #{selectedClaimForAction.id}</h3>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={6}
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              placeholder="Enter narrative text..."
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => {
                  // Save narrative logic here
                  console.log("Saving narrative:", narrativeText);
                  setShowEditNarrativeModal(false);
                  setSelectedClaimForAction(null);
                }}
              >
                Save
              </button>
              <button
                className="px-4 py-1 rounded bg-gray-300"
                onClick={() => {
                  setShowEditNarrativeModal(false);
                  setSelectedClaimForAction(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ View Modal */}
      {showViewModal && selectedClaimForAction && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[600px] max-h-[80vh] overflow-auto">
            <h3 className="font-semibold text-lg mb-4">View Claim Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Claim #:</strong> {selectedClaimForAction.id}</div>
              <div><strong>Patient:</strong> {selectedClaimForAction.patientName}</div>
              <div><strong>Type:</strong> {selectedClaimForAction.type}</div>
              <div><strong>Created On:</strong> {formatDate(selectedClaimForAction.createdOn)}</div>
              <div><strong>Carrier:</strong> {selectedClaimForAction.provider}</div>
              <div><strong>Status:</strong> {selectedClaimForAction.status}</div>
              <div><strong>Notes:</strong> {selectedClaimForAction.notes || 'N/A'}</div>
              <div><strong>Description:</strong> {selectedClaimForAction.description || 'N/A'}</div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-1 rounded bg-gray-300"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedClaimForAction(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Attachment Modal */}
      {showAttachmentModal && selectedClaimForAction && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[800px] max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Claim Attachments</h3>
              <button
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedClaimForAction(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Claim #{selectedClaimForAction.id}</p>
              <p className="text-sm text-gray-600">Payer Reference Number: 
                <span className="ml-2">
                  <button className="text-blue-500">✓</button>
                  <button className="text-red-500 ml-1">⚠</button>
                </span>
              </p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Imported Files</h4>
              <p className="text-sm text-gray-500">No files added yet</p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Import from:</h4>
              <p className="text-xs text-gray-400 mb-2">*PDF files will be submitted as images*</p>
              <div className="grid grid-cols-7 gap-2">
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center">
                  <div className="text-blue-500 mb-1">🖼️</div>
                  <span className="text-xs">Images</span>
                </button>
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center">
                  <div className="text-blue-500 mb-1">📤</div>
                  <span className="text-xs">Upload from PC</span>
                </button>
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center">
                  <div className="text-blue-500 mb-1">📊</div>
                  <span className="text-xs">Perio Chart</span>
                </button>
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center">
                  <div className="text-blue-500 mb-1">🏥</div>
                  <span className="text-xs">Medical History</span>
                </button>
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center">
                  <div className="text-blue-500 mb-1">🦷</div>
                  <span className="text-xs">Dental History</span>
                </button>
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center">
                  <div className="text-blue-500 mb-1">📝</div>
                  <span className="text-xs">Progress Notes</span>
                </button>
                <button className="border p-3 rounded hover:bg-gray-50 flex flex-col items-center bg-blue-50">
                  <div className="text-blue-500 mb-1">📄</div>
                  <span className="text-xs">Upload LOBs</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" />
                Send both Peart-annotated and original images
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 rounded bg-gray-300"
                onClick={() => {
                  setShowAttachmentModal(false);
                  setSelectedClaimForAction(null);
                }}
              >
                Cancel
              </button>
              <button className="px-4 py-1 rounded bg-blue-500 text-white">
                Submit Attachments
              </button>
              <button className="px-4 py-1 rounded bg-green-500 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Line Details Modal */}
      {showLineDetailsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Claim Line Details</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => {
                  setShowLineDetailsModal(false);
                  setLineDetails([]);
                }}
              >
                ×
              </button>
            </div>

            {lineDetails.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No line details found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left border">DOS</th>
                      <th className="p-3 text-left border">Code</th>
                      <th className="p-3 text-left border">Description</th>
                      <th className="p-3 text-left border">Provider</th>
                      <th className="p-3 text-right border">Total Submitted Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineDetails.map((line) => (
                      <tr key={line.lineid} className="hover:bg-gray-50">
                        <td className="p-3 border">
                          {line.dos && line.dos.length > 0 ? (
                            <div>
                              {line.dos.map((dateNum, idx) => {
                                const year = Math.floor(dateNum / 10000);
                                const month = Math.floor((dateNum % 10000) / 100);
                                const day = dateNum % 100;
                                return (
                                  <div key={idx}>
                                    {`${month}/${day}/${year}`}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 border">{line.code || "-"}</td>
                        <td className="p-3 border">{line.description || "-"}</td>
                        <td className="p-3 border">{line.provider || "-"}</td>
                        <td className="p-3 border text-right">
                          ${line.totalSubmittedAmount?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => {
                  setShowLineDetailsModal(false);
                  setLineDetails([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
};

export default UnsentClaims;
