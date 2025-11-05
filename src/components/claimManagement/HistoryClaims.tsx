



import React, { useEffect, useState } from 'react';

const API_BASE = "/api/patient-billing";

const HistoryClaims: React.FC = () => {
  // Similar state as above...
  const [claims, setClaims] = useState<any[]>([]);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchClaim, setSearchClaim] = useState("");
  const [filters, setFilters] = useState({ type: "", carrier: "", attachment: "" });
  const [loading, setLoading] = useState(false);
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Get patientId and orgId from localStorage, context, or props (update as needed)
  const patientId = typeof window !== "undefined" ? localStorage.getItem("patientId") : 1;
  const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : 1;

  // Add selectAll and toggleSelect functions
  const selectAll = () => {
    if (selectedClaims.size === filteredClaims.length) {
      setSelectedClaims(new Set());
    } else {
      setSelectedClaims(new Set(filteredClaims.map((claim: any) => claim.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedClaims(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const mockClaims = [
    { id: 28269, patientName: "Maya Goldenburg (7903)", type: "E-claim Primary", createdOn: "10/22/2025", printedOn: "Cigna", payerName: "Cigna", status: "submittedToClearingHouse", eraStatus: "", clearingHouseStatusMessage: "", value: "$37.00", hasAttachment: false, notes: "", description: "" },
    // Add more...
  ];

  useEffect(() => {
    // Fetch claims and filter for 'sent' || 'submittedToClearingHouse'
    async function fetchClaims() {
      setLoading(true);
      try {
        // Use new API endpoint for all claims
        const res = await fetch(`/api/all-claims`, {
          headers: { "x-org-id": orgId ? orgId.toString() : "" }
        });
        const allClaims = await res.json();
        const historyClaims = (allClaims || []).filter((c: any) => c.status === 'sent' || c.status === 'submittedToClearingHouse');
        setClaims(historyClaims);
        // Optionally set unique carriers
        setUniqueCarriers([...new Set((allClaims || []).map((c: any) => c.payerName).filter(Boolean))] as string[]);
      } catch (e) {
        setClaims([]);
        setError("Failed to fetch claims.");
      }
      setLoading(false);
    }
    fetchClaims();
  }, [orgId]);

  // filteredClaims logic same...
  const filteredClaims = claims.filter((claim: any) => {
    return (
      (!searchPatient || (claim.patientName && claim.patientName.toLowerCase().includes(searchPatient.toLowerCase()))) &&
      (!searchClaim || (claim.id && claim.id.toString().includes(searchClaim))) &&
      (!filters.type || claim.type === filters.type) &&
      (!filters.carrier || claim.payerName === filters.carrier) &&
      (!filters.attachment || (filters.attachment === "yes" ? claim.hasAttachment : !claim.hasAttachment))
    );
  });

  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">History Claims ({filteredClaims.length})</h2>
      {/* Filters same, add "Group by Date Range" select if needed */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {/* ... same as above ... */}
        <div className="flex gap-2">
          <button className="border px-2 py-1 rounded bg-gray-500 text-white">Print Page</button>
          <button className="border px-2 py-1 rounded bg-gray-500 text-white">Export as CSV</button>
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
            <th className="p-2">Printed on</th>
            <th className="p-2">Carrier</th>
            <th className="p-2">Procedures</th>
            <th className="p-2">Status</th>
            <th className="p-2">ERA</th>
            <th className="p-2">Clearing House Status Message</th>
            <th className="p-2">Value</th>
            <th className="p-2">Notes</th>
            <th className="p-2">Description</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Similar tbody, add printedOn, eraStatus, value columns */}
          {filteredClaims.map((claim: any) => (
            <tr key={claim.id} className="border-b">
              <td className="p-2"><input type="checkbox" checked={selectedClaims.has(claim.id)} onChange={() => toggleSelect(claim.id)} /></td>
              <td className="p-2">{claim.patientName}</td>
              <td className="p-2">{claim.id}</td>
              <td className="p-2">{claim.type}</td>
              <td className="p-2">{claim.sentOn || claim.createdOn}</td>
              <td className="p-2">{claim.printedOn || ''}</td>
              <td className="p-2">{claim.payerName}</td>
              <td className="p-2"><button className="text-blue-500">Show</button></td>
              <td className="p-2">{claim.status}</td>
              <td className="p-2">{claim.eraStatus || ''}</td>
              <td className="p-2">{claim.clearingHouseStatusMessage || ''}</td>
              <td className="p-2">{claim.value || ''}</td>
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

export default HistoryClaims;