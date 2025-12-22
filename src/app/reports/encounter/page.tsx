'use client';

import React, { useState, useEffect, useRef } from "react";
import AdminLayout from '@/app/(admin)/layout';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

interface Provider { id: number; name: string; }
interface Encounter {
  id: number;
  patientId: number;
  patientName?: string;
  primaryInsurance?: string;
  secondaryInsurance?: string;
  encounterDate: string;
  encounterProvider: string;
  status: string | null;
  type: string;
  diagnosis: string | null;
  reasonForVisit: string;
  visitCategory: string;
}

export default function EncounterReportPage() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [provider, setProvider] = useState('All Providers');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'signed' | 'unsigned'>('all');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['patientName', 'date', 'provider', 'type', 'status', 'diagnosis']);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<string[]>(['patientName', 'date', 'provider', 'type', 'status', 'diagnosis']);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(false);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/providers`);
        if (!res.ok) throw new Error('Failed to fetch providers');
        const data = await res.json();
        const list: Provider[] = data.data.map((p: { id: number; identification: { firstName: string; lastName: string } }) => ({
          id: p.id,
          name: `${p.identification.firstName} ${p.identification.lastName}`,
        }));
        setProviders(list);
      } catch { setProviders([]); }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    if (startDateRef.current) {
      flatpickr(startDateRef.current, {
        dateFormat: 'Y-m-d',
        disableMobile: true,
        onChange: (selectedDates, dateStr) => {
          setStartDate(dateStr);
        }
      });
    }
    if (endDateRef.current) {
      flatpickr(endDateRef.current, {
        dateFormat: 'Y-m-d',
        disableMobile: true,
        onChange: (selectedDates, dateStr) => {
          setEndDate(dateStr);
        }
      });
    }
  }, []);

  const fetchEncounters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/encounters/report/encounterAll?${params}`);
      if (!response.ok) throw new Error('Failed to fetch encounters');
      const result = await response.json();
      const encounterList = Array.isArray(result.data) ? result.data : [];
      
      const enriched = await Promise.all(
        encounterList.map(async (enc: Encounter) => {
          try {
            const patRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${enc.patientId}`);
            if (patRes.ok) {
              const patData = await patRes.json();
              const patient = patData.data;
              return {
                ...enc,
                patientName: `${patient.firstName} ${patient.lastName}`,
                primaryInsurance: patient.primaryInsurance || 'N/A',
                secondaryInsurance: patient.secondaryInsurance || 'N/A'
              };
            }
          } catch {}
          return { ...enc, patientName: `Patient ${enc.patientId}`, primaryInsurance: 'N/A', secondaryInsurance: 'N/A' };
        })
      );
      setEncounters(enriched);
    } catch (error) {
      console.error('Failed to fetch encounters:', error);
      setEncounters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncounters();
  }, [search, startDate, endDate]);

  const filteredEncounters = encounters.filter(enc => {
    if (provider !== 'All Providers') {
      const encProvider = (enc.encounterProvider || '').toLowerCase();
      const selectedProvider = provider.toLowerCase();
      if (!selectedProvider.includes(encProvider) && !encProvider.includes(selectedProvider)) return false;
    }
    if (startDate || endDate) {
      const encDate = new Date(enc.encounterDate).setHours(0, 0, 0, 0);
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (encDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (encDate > end) return false;
      }
    }
    if (statusFilter === 'all') return true;
    const status = (enc.status || '').toLowerCase();
    if (statusFilter === 'signed') return status === 'signed';
    if (statusFilter === 'unsigned') return !status || status === 'unsigned';
    return true;
  });

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredEncounters.map(e => e.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleRow = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setSelectAll(next.size === filteredEncounters.length);
  };

  const applyFilters = () => {
    setVisibleColumns(draftVisibleColumns);
    setShowFilters(false);
  };

  const downloadCSV = () => {
    const dataToExport = selected.size > 0 ? filteredEncounters.filter(e => selected.has(e.id)) : filteredEncounters;
    const headers = ['Encounter ID'];
    if (visibleColumns.includes('patientName')) headers.push('Patient Name');
    if (visibleColumns.includes('date')) headers.push('Date');
    if (visibleColumns.includes('provider')) headers.push('Provider');
    if (visibleColumns.includes('type')) headers.push('Type');
    if (visibleColumns.includes('status')) headers.push('Status');
    if (visibleColumns.includes('diagnosis')) headers.push('Diagnosis');
    if (visibleColumns.includes('primaryInsurance')) headers.push('Primary Insurance');
    if (visibleColumns.includes('secondaryInsurance')) headers.push('Secondary Insurance');
    
    const rows = dataToExport.map(e => {
      const row = [e.id];
      if (visibleColumns.includes('patientName')) row.push(e.patientName || e.patientId);
      if (visibleColumns.includes('date')) row.push(e.encounterDate);
      if (visibleColumns.includes('provider')) row.push(e.encounterProvider);
      if (visibleColumns.includes('type')) row.push(e.type);
      if (visibleColumns.includes('status')) row.push(e.status || 'Unsigned');
      if (visibleColumns.includes('diagnosis')) row.push(e.diagnosis || 'N/A');
      if (visibleColumns.includes('primaryInsurance')) row.push(e.primaryInsurance || 'N/A');
      if (visibleColumns.includes('secondaryInsurance')) row.push(e.secondaryInsurance || 'N/A');
      return row.join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encounter_report.csv';
    a.click();
  };

  const printTable = () => {
    const dataToExport = selected.size > 0 ? filteredEncounters.filter(e => selected.has(e.id)) : filteredEncounters;
    const tableHeaders = `
      <tr>
        <th>Encounter ID</th>
        ${visibleColumns.includes('patientName') ? '<th>Patient Name</th>' : ''}
        ${visibleColumns.includes('date') ? '<th>Date</th>' : ''}
        ${visibleColumns.includes('provider') ? '<th>Provider</th>' : ''}
        ${visibleColumns.includes('type') ? '<th>Type</th>' : ''}
        ${visibleColumns.includes('status') ? '<th>Status</th>' : ''}
        ${visibleColumns.includes('diagnosis') ? '<th>Diagnosis</th>' : ''}
        ${visibleColumns.includes('primaryInsurance') ? '<th>Primary Ins</th>' : ''}
        ${visibleColumns.includes('secondaryInsurance') ? '<th>Secondary Ins</th>' : ''}
      </tr>
    `;
    
    const tableRows = dataToExport.map(e => `
      <tr>
        <td>${e.id}</td>
        ${visibleColumns.includes('patientName') ? `<td>${e.patientName || `Patient ${e.patientId}`}</td>` : ''}
        ${visibleColumns.includes('date') ? `<td>${new Date(e.encounterDate).toLocaleString()}</td>` : ''}
        ${visibleColumns.includes('provider') ? `<td>${e.encounterProvider}</td>` : ''}
        ${visibleColumns.includes('type') ? `<td>${e.type}</td>` : ''}
        ${visibleColumns.includes('status') ? `<td>${getStatusText(e.status)}</td>` : ''}
        ${visibleColumns.includes('diagnosis') ? `<td>${e.diagnosis || 'N/A'}</td>` : ''}
        ${visibleColumns.includes('primaryInsurance') ? `<td>${e.primaryInsurance}</td>` : ''}
        ${visibleColumns.includes('secondaryInsurance') ? `<td>${e.secondaryInsurance}</td>` : ''}
      </tr>
    `).join('');
    
    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <table style="border-collapse: collapse; width: 100%;">
        <thead>${tableHeaders}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
    
    document.body.style.visibility = 'hidden';
    printDiv.style.visibility = 'visible';
    printDiv.style.position = 'absolute';
    printDiv.style.left = '0';
    printDiv.style.top = '0';
    printDiv.style.width = '100%';
    
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
    window.print();
    document.body.removeChild(printDiv);
    document.head.removeChild(printStyles);
    document.body.style.visibility = 'visible';
  };

  const getStatusColor = (status: string | null) => {
    const s = (status || '').toUpperCase();
    if (!s || s === 'UNSIGNED') return 'bg-orange-100 text-orange-800';
    if (s === 'SIGNED') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string | null) => {
    if (!status) return 'UNSIGNED';
    return status.toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full gap-4">
        <div className="bg-white rounded-lg border p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Patient/Encounter ID"
              className="px-4 py-2 border rounded-lg"
            />
            <div className="relative">
              <input
                ref={startDateRef}
                type="text"
                value={startDate}
                placeholder="Start Date"
                readOnly
                className="px-4 py-2 border rounded-lg w-full cursor-pointer"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="relative">
              <input
                ref={endDateRef}
                type="text"
                value={endDate}
                placeholder="End Date"
                readOnly
                className="px-4 py-2 border rounded-lg w-full cursor-pointer"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="All Providers">All Providers</option>
              {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="signed">Signed</option>
              <option value="unsigned">Unsigned</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border rounded-lg">Customize</button>
            <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Export CSV</button>
            <button onClick={printTable} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
          </div>

          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-semibold mb-3 text-gray-500">SHOW COLUMNS</p>
              <div className="flex flex-wrap gap-4">
                {['patientName', 'date', 'provider', 'type', 'status', 'diagnosis', 'primaryInsurance', 'secondaryInsurance'].map(col => (
                  <label key={col} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftVisibleColumns.includes(col)}
                      onChange={() => setDraftVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                    />
                    <span className="text-sm">
                      {col === 'patientName' ? 'Patient Name' :
                       col === 'date' ? 'Date' :
                       col === 'provider' ? 'Provider' :
                       col === 'type' ? 'Type' :
                       col === 'status' ? 'Status' :
                       col === 'diagnosis' ? 'Diagnosis' :
                       col === 'primaryInsurance' ? 'Primary Insurance' : 'Secondary Insurance'}
                    </span>
                  </label>
                ))}
                <button onClick={applyFilters} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg">Apply Filter</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          {startDate && endDate && new Date(endDate) < new Date(startDate) && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4" role="alert">
              <p className="font-bold">Invalid Date Range</p>
              <p>End date cannot be before start date. Please enter dates properly.</p>
            </div>
          )}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="p-3 w-12"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded" /></th>
                  <th className="p-3 text-left font-medium text-gray-700">Encounter ID</th>
                  {visibleColumns.includes('patientName') && <th className="p-3 text-left font-medium text-gray-700">Patient Name</th>}
                  {visibleColumns.includes('date') && <th className="p-3 text-left font-medium text-gray-700">Date</th>}
                  {visibleColumns.includes('provider') && <th className="p-3 text-left font-medium text-gray-700">Provider</th>}
                  {visibleColumns.includes('type') && <th className="p-3 text-left font-medium text-gray-700">Type</th>}
                  {visibleColumns.includes('status') && <th className="p-3 text-left font-medium text-gray-700">Status</th>}
                  {visibleColumns.includes('diagnosis') && <th className="p-3 text-left font-medium text-gray-700">Diagnosis</th>}
                  {visibleColumns.includes('primaryInsurance') && <th className="p-3 text-left font-medium text-gray-700">Primary Ins</th>}
                  {visibleColumns.includes('secondaryInsurance') && <th className="p-3 text-left font-medium text-gray-700">Secondary Ins</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-500">Loading encounters...</td></tr>
                ) : filteredEncounters.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-gray-500">No encounters found</td></tr>
                ) : (
                  filteredEncounters.map((encounter, idx) => (
                    <tr key={encounter.id} className={`border-t hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-3 w-12">
                        <input type="checkbox" checked={selected.has(encounter.id)} onChange={() => toggleRow(encounter.id)} className="w-4 h-4 text-blue-600 rounded" />
                      </td>
                      <td className="p-3 font-semibold text-blue-600">{encounter.id}</td>
                      {visibleColumns.includes('patientName') && <td className="p-3 font-medium text-gray-900">{encounter.patientName || `Patient ${encounter.patientId}`}</td>}
                      {visibleColumns.includes('date') && <td className="p-3 text-gray-600">{new Date(encounter.encounterDate).toLocaleString()}</td>}
                      {visibleColumns.includes('provider') && <td className="p-3 text-gray-600">{encounter.encounterProvider}</td>}
                      {visibleColumns.includes('type') && <td className="p-3 text-gray-600">{encounter.type}</td>}
                      {visibleColumns.includes('status') && (
                        <td className="p-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(encounter.status)}`}>
                            {getStatusText(encounter.status)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('diagnosis') && <td className="p-3 text-gray-600">{encounter.diagnosis || 'N/A'}</td>}
                      {visibleColumns.includes('primaryInsurance') && <td className="p-3 text-gray-600">{encounter.primaryInsurance}</td>}
                      {visibleColumns.includes('secondaryInsurance') && <td className="p-3 text-gray-600">{encounter.secondaryInsurance}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-3 flex justify-between text-sm">
            <span>{filteredEncounters.length} records found</span>
            {selected.size > 0 && <span className="text-blue-600">{selected.size} selected</span>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
