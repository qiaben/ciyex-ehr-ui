



import React, { useEffect, useState } from 'react';

const API_BASE = "/api/patient-billing";

const ErroredClaims: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchClaim, setSearchClaim] = useState("");
  const [filters, setFilters] = useState({ type: "", carrier: "", attachment: "" });
  const [loading, setLoading] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Get orgId from localStorage (dynamic)
  const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;

  // Mock data from screenshots
  const mockClaims = [
    { id: 27760, patientName: "Arnold Lopez (8946)", type: "E-claim Primary", createdOn: "10/13/2025", payerName: "Delta Dental of New Jersey", status: "error", clearingHouseStatusMessage: "Status Response (A3): Returned...", hasAttachment: false, notes: "", description: "" },
    // Add more...
  ];

  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/all-claims`, {
          headers: { "x-org-id": orgId }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        const erroredClaims = (body.data || []).filter((c: any) => c.status === 'error');
        setClaims(erroredClaims);
        const carriers = [...new Set(erroredClaims.map((c: any) => c.payerName).filter(Boolean))];
        setUniqueCarriers(carriers);
        if (erroredClaims.length === 0) {
          // setClaims(mockClaims);
        }
      } catch (e: any) {
        console.error("Fetch error:", e);
        setError(`Failed to load claims: ${e.message}`);
        // setClaims(mockClaims);
      }
      setLoading(false);
    }
    fetchClaims();
  }, [patientId, orgId]);

  const filteredClaims = claims.filter((claim: any) => {
    return (
      (!searchPatient || claim.patientName?.toLowerCase().includes(searchPatient.toLowerCase())) &&
      (!searchClaim || claim.id?.toString().includes(searchClaim) || claim.createdOn?.includes(searchClaim)) &&
      (!filters.type || claim.type === filters.type) &&
      (!filters.carrier || claim.payerName === filters.carrier) &&
      (!filters.attachment || (filters.attachment === "yes" ? claim.hasAttachment : !claim.hasAttachment))
    );
  });

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedClaims);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedClaims(newSet);
  };

  const selectAll = () => {
    if (selectedClaims.size === filteredClaims.length) setSelectedClaims(new Set()); 
    else setSelectedClaims(new Set(filteredClaims.map((c: any) => c.id)));
  };

  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Errored Claims ({filteredClaims.length})</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="flex gap-4 mb-4 flex-wrap items-center">
        {/* Same filters as Unsent */}
        <input type="text" placeholder="Search by patient" value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="border px-2 py-1 rounded" />
        <input type="text" placeholder="Search by claim # or date" value={searchClaim} onChange={e => setSearchClaim(e.target.value)} className="border px-2 py-1 rounded" />
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="border px-2 py-1 rounded">
          <option value="">Filter by Claim Type</option>
          <option value="E-claim Primary">E-claim Primary</option>
          <option value="E-claim Secondary">E-claim Secondary</option>
        </select>
        <select value={filters.carrier} onChange={e => setFilters(f => ({ ...f, carrier: e.target.value }))} className="border px-2 py-1 rounded">
          <option value="">Filter by Carrier</option>
          {uniqueCarriers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.attachment} onChange={e => setFilters(f => ({ ...f, attachment: e.target.value }))} className="border px-2 py-1 rounded">
          <option value="">Filter by Claim Attachment</option>
          <option value="yes">With Attachment</option>
          <option value="no">Without Attachment</option>
        </select>
        <div className="flex gap-2">
          <button className="border px-2 py-1 rounded bg-blue-500 text-white">Change Status</button>
          <button className="border px-2 py-1 rounded bg-orange-500 text-white" disabled={!selectedClaims.size}>Void & Recreate Claims ({selectedClaims.size})</button>
        </div>
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2"><input type="checkbox" onChange={() => selectAll()} /></th>
            <th className="p-2">Patient Name</th>
            <th className="p-2">Claim #</th>
            <th className="p-2">Claim Type</th>
            <th className="p-2">Sent on</th>
            <th className="p-2">Carrier</th>
            <th className="p-2">Procedures</th>
            <th className="p-2">Status</th>
            <th className="p-2">Clearing House Status Message</th>
            <th className="p-2">Notes</th>
            <th className="p-2">Description</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={12} className="text-center p-4">Loading...</td></tr> : filteredClaims.length === 0 ? <tr><td colSpan={12} className="text-center p-4">No claims found</td></tr> : filteredClaims.map((claim: any) => (
            <tr key={claim.id} className="border-b">
              <td className="p-2"><input type="checkbox" checked={selectedClaims.has(claim.id)} onChange={() => toggleSelect(claim.id)} /></td>
              <td className="p-2">{claim.patientName || claim.patientId}</td>
              <td className="p-2">{claim.id}</td>
              <td className="p-2">{claim.type}</td>
              <td className="p-2">{claim.createdOn}</td>
              <td className="p-2">{claim.payerName}</td>
              <td className="p-2"><button className="text-blue-500">Show</button></td>
              <td className="p-2">{claim.status}</td>
              <td className="p-2">{claim.clearingHouseStatusMessage || ''}</td>
              <td className="p-2">{claim.notes}</td>
              <td className="p-2">{claim.description || ''}</td>
              <td className="p-2 flex gap-2">
                <button className="border px-2 py-1 rounded text-xs">Edit</button>
                <button className="border px-2 py-1 rounded text-xs">View</button>
                <button className="border px-2 py-1 rounded text-xs">Print</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="mt-2 text-sm text-blue-500">Expand all Clearing House Messages</button>
    </div>
  );
};

export default ErroredClaims;