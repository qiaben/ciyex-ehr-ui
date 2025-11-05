


import React, { useEffect, useState } from 'react';

const API_BASE = "/api/patient-billing";

const UnclaimedClaims: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchClaim, setSearchClaim] = useState("");
  const [filters, setFilters] = useState({ type: "", carrier: "", attachment: "" });
  const [loading, setLoading] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);



  // Mock data fallback (based on Oryx screenshots; customize as needed)
  const mockClaims = [
    { id: 8268, patientName: "Adam Laws (7623)", type: "E-claim Primary", createdOn: "05/17/2024", payerName: "United Concordia Inc.", status: "unclaimed", hasAttachment: false, notes: "", description: "" },
    { id: 14731, patientName: "Aimee Benedetto (6068)", type: "E-claim Other", createdOn: "10/18/2024", payerName: "Careington International Dental", status: "unclaimed", hasAttachment: false, notes: "", description: "" },
    { id: 9317, patientName: "Alan Friedman (8132)", type: "E-claim Primary", createdOn: "09/17/2024", payerName: "Aetna Dental Plans", status: "unclaimed", hasAttachment: false, notes: "", description: "" },
    // Add more from screenshots...
  ];

  // Dynamic orgId from localStorage
  const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "" : "";
  // Get patientId from localStorage, context, or props (update as needed)
  const patientId = typeof window !== "undefined" ? localStorage.getItem("patientId") : 2;

  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      setError(null);
      try {
        // Use new API endpoint for all claims
        const res = await fetch(`/api/all-claims`, {
          headers: { "x-org-id": orgId }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const allClaims = await res.json();
        const unclaimedClaims = allClaims.filter((c: any) => c.status === 'unclaimed');
        setClaims(unclaimedClaims);
        // Dynamic carriers
        const carriers = [...new Set(unclaimedClaims.map((c: any) => c.payerName).filter(Boolean))] as string[];
        setUniqueCarriers(carriers);
        // Mock fallback if empty
        if (unclaimedClaims.length === 0) {
          // setClaims(mockClaims); // Uncomment for demo
        }
      } catch (e: any) {
        console.error("Fetch error:", e);
        setError(`Failed to load claims: ${e.message}`);
        // setClaims(mockClaims); // Uncomment for demo
      }
      setLoading(false);
    }
    fetchClaims();
  }, [orgId]);

  // Filter/search logic
  const filteredClaims = claims.filter((claim: any) => {
    return (
      (!searchPatient || (claim.patientName && claim.patientName.toLowerCase().includes(searchPatient.toLowerCase()))) &&
      (!searchClaim || (claim.id && claim.id.toString().includes(searchClaim)) || claim.createdOn?.includes(searchClaim)) &&
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
    if (selectedClaims.size === filteredClaims.length) {
      setSelectedClaims(new Set());
    } else {
      setSelectedClaims(new Set(filteredClaims.map((c: any) => c.id)));
    }
  };

  const selectedCount = selectedClaims.size;

  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Unclaimed Claims ({filteredClaims.length})</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="flex gap-4 mb-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search by patient"
          value={searchPatient}
          onChange={e => setSearchPatient(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="text"
          placeholder="Search by claim # or date"
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
          <option value="E-claim Primary">E-claim Primary</option>
          <option value="E-claim Secondary">E-claim Secondary</option>
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
          <button className="border px-2 py-1 rounded bg-blue-500 text-white">Convert Type</button>
          <button className="border px-2 py-1 rounded bg-blue-500 text-white">Change Status</button>
          <button className="border px-2 py-1 rounded bg-orange-500 text-white" disabled={!selectedCount}>Void & Recreate Claims ({selectedCount})</button>
          <button className="border px-2 py-1 rounded bg-gray-500 text-white">Print Claims</button>
        </div>
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2"><input type="checkbox" onChange={() => selectAll()} /></th>
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
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={11} className="text-center p-4">Loading...</td></tr>
          ) : filteredClaims.length === 0 ? (
            <tr><td colSpan={11} className="text-center p-4">No claims found</td></tr>
          ) : (
            filteredClaims.map((claim: any) => (
              <tr key={claim.id} className="border-b">
                <td className="p-2"><input type="checkbox" checked={selectedClaims.has(claim.id)} onChange={() => toggleSelect(claim.id)} /></td>
                <td className="p-2">{claim.patientName || claim.patientId}</td>
                <td className="p-2">{claim.id}</td>
                <td className="p-2">{claim.type}</td>
                <td className="p-2">{claim.createdOn}</td>
                <td className="p-2">{claim.payerName}</td>
                <td className="p-2"><button className="text-blue-500">Show</button></td>
                <td className="p-2">{claim.status}</td>
                <td className="p-2">{claim.notes}</td>
                <td className="p-2">{claim.description || ''}</td>
                <td className="p-2 flex gap-2">
                  <button className="border px-2 py-1 rounded text-xs">Edit</button>
                  <button className="border px-2 py-1 rounded text-xs">View</button>
                  <button className="border px-2 py-1 rounded text-xs">Print</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {filteredClaims.length > 8 && <button className="mt-2 border px-4 py-2 rounded">Load More Claims</button>}
      <button className="mt-2 ml-2 text-sm text-blue-500">Expand all Clearing House Messages</button>
    </div>
  );
};

export default UnclaimedClaims;