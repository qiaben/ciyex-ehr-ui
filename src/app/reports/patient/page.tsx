'use client';

import React, { useState, useEffect } from "react";
import AdminLayout from '@/app/(admin)/layout';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  status?: string;
  address?: string;
  primaryInsurance?: string;
  secondaryInsurance?: string;
}

interface PageResponse {
  content: Patient[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export default function PatientReportPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'dob', 'gender', 'email', 'address', 'ins1', 'ins2'
  ]);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<string[]>([
    'dob', 'gender', 'email', 'address', 'ins1', 'ins2'
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort: "id"
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetchWithAuth(`/api/patients?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse = await response.json() as ApiResponse<PageResponse>;
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || "Failed to fetch patients");
      }
      
      const data = apiResponse.data;
      if (!data) {
        setPatients([]);
        setTotalElements(0);
        setTotalPages(0);
        return;
      }
      
      // Filter by status on frontend since API doesn't support it
      let filteredPatients = data.content || [];
      if (statusFilter !== 'all') {
        filteredPatients = filteredPatients.filter(p => 
          (p.status || 'active').toLowerCase() === statusFilter
        );
      }
      
      setPatients(filteredPatients);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0);
      fetchPatients();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const applyFilters = () => {
    setVisibleColumns(draftVisibleColumns);
    setShowFilters(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(patients.map(p => p.id.toString())));
    }
    setSelectAll(!selectAll);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setSelectAll(next.size === patients.length);
  };

  const downloadCSV = async () => {
    try {
      let patientsToExport: Patient[];
      
      // If patients are selected, export only selected ones
      if (selected.size > 0) {
        patientsToExport = patients.filter(p => selected.has(p.id.toString()));
      } else {
        // Fetch all patients for CSV export
        const params = new URLSearchParams({
          page: "0",
          size: "10000", // Large number to get all patients
          sort: "id"
        });
        
        if (search.trim()) {
          params.append('search', search.trim());
        }

        const response = await fetchWithAuth(`/api/patients?${params}`);
        const apiResponse = await response.json() as ApiResponse<PageResponse>;
        
        if (!apiResponse.success || !apiResponse.data) {
          throw new Error("Failed to fetch all patients");
        }
        
        patientsToExport = apiResponse.data.content || [];
        
        // Apply status filter
        if (statusFilter !== 'all') {
          patientsToExport = patientsToExport.filter(p => 
            (p.status || 'active').toLowerCase() === statusFilter
          );
        }
      }

      const headers = ['Patient ID', 'Name', 'Phone', 'Status'];
      if (visibleColumns.includes('dob')) headers.push('DOB');
      if (visibleColumns.includes('gender')) headers.push('Gender');
      if (visibleColumns.includes('email')) headers.push('Email');
      if (visibleColumns.includes('address')) headers.push('Address');
      if (visibleColumns.includes('ins1')) headers.push('Primary Ins');
      if (visibleColumns.includes('ins2')) headers.push('Secondary Ins');

      const rows = patientsToExport.map(p => {
        const row = [p.id.toString(), `${p.firstName} ${p.lastName}`, p.phoneNumber || '', (p.status || 'active').toUpperCase()];
        if (visibleColumns.includes('dob')) row.push(p.dateOfBirth || '');
        if (visibleColumns.includes('gender')) row.push(p.gender || '');
        if (visibleColumns.includes('email')) row.push(p.email || '');
        if (visibleColumns.includes('address')) row.push(p.address || '');
        if (visibleColumns.includes('ins1')) row.push(p.primaryInsurance || '');
        if (visibleColumns.includes('ins2')) row.push(p.secondaryInsurance || '');
        return row.join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patient_report.csv';
      a.click();
    } catch (error) {
      console.error('Failed to download CSV:', error);
    }
  };

  const printTable = () => {
    let patientsToShow: Patient[];
    
    // If patients are selected, show only selected ones
    if (selected.size > 0) {
      patientsToShow = patients.filter(p => selected.has(p.id.toString()));
    } else {
      patientsToShow = patients;
    }
    
    // Build table HTML with filtered patients
    const tableHeaders = `
      <tr>
        <th>Patient ID</th>
        <th>Name</th>
        <th>Phone</th>
        <th>Status</th>
        ${visibleColumns.includes('dob') ? '<th>DOB</th>' : ''}
        ${visibleColumns.includes('gender') ? '<th>Gender</th>' : ''}
        ${visibleColumns.includes('email') ? '<th>Email</th>' : ''}
        ${visibleColumns.includes('address') ? '<th>Address</th>' : ''}
        ${visibleColumns.includes('ins1') ? '<th>Primary Ins</th>' : ''}
        ${visibleColumns.includes('ins2') ? '<th>Secondary Ins</th>' : ''}
      </tr>
    `;
    
    const tableRows = patientsToShow.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.firstName} ${p.lastName}</td>
        <td>${p.phoneNumber || '-'}</td>
        <td>${(p.status || 'Active').charAt(0).toUpperCase() + (p.status || 'Active').slice(1)}</td>
        ${visibleColumns.includes('dob') ? `<td>${p.dateOfBirth || '-'}</td>` : ''}
        ${visibleColumns.includes('gender') ? `<td>${p.gender || '-'}</td>` : ''}
        ${visibleColumns.includes('email') ? `<td>${p.email || '-'}</td>` : ''}
        ${visibleColumns.includes('address') ? `<td>${p.address || '-'}</td>` : ''}
        ${visibleColumns.includes('ins1') ? `<td>${p.primaryInsurance || '-'}</td>` : ''}
        ${visibleColumns.includes('ins2') ? `<td>${p.secondaryInsurance || '-'}</td>` : ''}
      </tr>
    `).join('');
    
    // Create temporary div with table content
    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <table style="border-collapse: collapse; width: 100%;">
        <thead>${tableHeaders}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
    
    // Hide current content and show print content
    document.body.style.visibility = 'hidden';
    printDiv.style.visibility = 'visible';
    printDiv.style.position = 'absolute';
    printDiv.style.left = '0';
    printDiv.style.top = '0';
    printDiv.style.width = '100%';
    
    // Add print styles
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      }
    `;
    
    document.head.appendChild(printStyles);
    document.body.appendChild(printDiv);
    
    // Print
    window.print();
    
    // Cleanup
    document.body.removeChild(printDiv);
    document.head.removeChild(printStyles);
    document.body.style.visibility = 'visible';
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full gap-4">
        {/* FILTER BAR */}
        <div className="bg-white rounded-lg border p-5">
          <div className="flex gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name or Phone"
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Patients</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg"
            >
              Customize
            </button>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Export CSV
            </button>
            <button
              onClick={printTable}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
          </div>

          {/* COLUMN FILTER */}
          {showFilters && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold mb-3 text-gray-500">SHOW COLUMNS</p>
              <div className="flex flex-wrap gap-4">
                {['dob', 'gender', 'email', 'address', 'ins1', 'ins2'].map(col => (
                  <label key={col} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftVisibleColumns.includes(col)}
                      onChange={() =>
                        setDraftVisibleColumns(prev =>
                          prev.includes(col)
                            ? prev.filter(c => c !== col)
                            : [...prev, col]
                        )
                      }
                    />
                    <span className="text-sm">{col === 'dob' ? 'DOB' : col === 'ins1' ? 'Primary Ins' : col === 'ins2' ? 'Secondary Ins' : col.charAt(0).toUpperCase() + col.slice(1)}</span>
                  </label>
                ))}
                <button
                  onClick={applyFilters}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white border rounded-lg overflow-hidden flex flex-col">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Loading patients...
            </div>
          )}
          
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700">Patient ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Phone</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                  {visibleColumns.includes('dob') && <th className="p-3 text-left font-semibold text-gray-700">DOB</th>}
                  {visibleColumns.includes('gender') && <th className="p-3 text-left font-semibold text-gray-700">Gender</th>}
                  {visibleColumns.includes('email') && <th className="p-3 text-left font-semibold text-gray-700">Email</th>}
                  {visibleColumns.includes('address') && <th className="p-3 text-left font-semibold text-gray-700">Address</th>}
                  {visibleColumns.includes('ins1') && <th className="p-3 text-left font-semibold text-gray-700">Primary Ins</th>}
                  {visibleColumns.includes('ins2') && <th className="p-3 text-left font-semibold text-gray-700">Secondary Ins</th>}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => (
                  <tr key={p.id} className={`border-t hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id.toString())}
                        onChange={() => toggleRow(p.id.toString())}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="p-3 font-semibold text-blue-600">{p.id}</td>
                    <td className="p-3 font-medium text-gray-900">{`${p.firstName} ${p.lastName}`}</td>
                    <td className="p-3 text-gray-600">{p.phoneNumber || '-'}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status || 'active')}`}>
                        {(p.status || 'Active').charAt(0).toUpperCase() + (p.status || 'Active').slice(1)}
                      </span>
                    </td>
                    {visibleColumns.includes('dob') && <td className="p-3 text-gray-600">{p.dateOfBirth || '-'}</td>}
                    {visibleColumns.includes('gender') && <td className="p-3 text-gray-600">{p.gender || '-'}</td>}
                    {visibleColumns.includes('email') && <td className="p-3 text-gray-600">{p.email || '-'}</td>}
                    {visibleColumns.includes('address') && <td className="p-3 text-gray-600">{p.address || '-'}</td>}
                    {visibleColumns.includes('ins1') && <td className="p-3 text-gray-600">{p.primaryInsurance || '-'}</td>}
                    {visibleColumns.includes('ins2') && <td className="p-3 text-gray-600">{p.secondaryInsurance || '-'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION & INFO */}
          <div className="border-t px-4 py-3 flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <span>{totalElements} total records</span>
              {selected.size > 0 && <span className="text-blue-600">{selected.size} selected</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page + 1} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}