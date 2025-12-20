'use client';

import React, { useState } from "react";
import AdminLayout from '@/app/(admin)/layout';

const DUMMY_ENCOUNTERS = [
  { id: 'ENC-2001', patientName: 'John Doe', patientId: 'PT-1001', date: '2025-01-15', time: '09:00 AM', provider: 'Dr. Smith', location: 'Main Clinic', status: 'completed', type: 'Consultation', diagnosis: 'Hypertension' },
  { id: 'ENC-2002', patientName: 'Jane Smith', patientId: 'PT-1002', date: '2025-01-15', time: '10:30 AM', provider: 'Dr. Johnson', location: 'Downtown', status: 'completed', type: 'Follow-up', diagnosis: 'Diabetes' },
  { id: 'ENC-2003', patientName: 'Robert Brown', patientId: 'PT-1003', date: '2025-01-16', time: '02:00 PM', provider: 'Dr. Williams', location: 'Main Clinic', status: 'in-progress', type: 'Check-up', diagnosis: 'Routine' },
  { id: 'ENC-2004', patientName: 'Emily Davis', patientId: 'PT-1004', date: '2025-01-17', time: '11:00 AM', provider: 'Dr. Smith', location: 'Westside', status: 'pending', type: 'Consultation', diagnosis: 'Chest Pain' },
  { id: 'ENC-2005', patientName: 'Michael Wilson', patientId: 'PT-1005', date: '2025-01-18', time: '03:30 PM', provider: 'Dr. Johnson', location: 'Downtown', status: 'completed', type: 'Follow-up', diagnosis: 'Asthma' },
];

const PROVIDERS = ['All Providers', 'Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
const LOCATIONS = ['All Locations', 'Main Clinic', 'Downtown', 'Westside'];

export default function EncounterReportPage() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [provider, setProvider] = useState('All Providers');
  const [location, setLocation] = useState('All Locations');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress' | 'pending'>('all');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['date', 'time', 'provider', 'location', 'type', 'diagnosis']);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<string[]>(['date', 'time', 'provider', 'location', 'type', 'diagnosis']);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const filtered = DUMMY_ENCOUNTERS.filter(e => {
    const matchSearch = e.patientName.toLowerCase().includes(search.toLowerCase()) || e.patientId.includes(search) || e.id.includes(search);
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchProvider = provider === 'All Providers' || e.provider === provider;
    const matchLocation = location === 'All Locations' || e.location === location;
    const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
    return matchSearch && matchStatus && matchProvider && matchLocation && matchDate;
  });

  const applyFilters = () => {
    setVisibleColumns(draftVisibleColumns);
    setShowFilters(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(e => e.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setSelectAll(next.size === filtered.length);
  };

  const downloadCSV = () => {
    const headers = ['Encounter ID', 'Patient Name', 'Patient ID', 'Status'];
    if (visibleColumns.includes('date')) headers.push('Date');
    if (visibleColumns.includes('time')) headers.push('Time');
    if (visibleColumns.includes('provider')) headers.push('Provider');
    if (visibleColumns.includes('location')) headers.push('Location');
    if (visibleColumns.includes('type')) headers.push('Type');
    if (visibleColumns.includes('diagnosis')) headers.push('Diagnosis');

    const rows = filtered.map(e => {
      const row = [e.id, e.patientName, e.patientId, e.status.toUpperCase()];
      if (visibleColumns.includes('date')) row.push(e.date);
      if (visibleColumns.includes('time')) row.push(e.time);
      if (visibleColumns.includes('provider')) row.push(e.provider);
      if (visibleColumns.includes('location')) row.push(e.location);
      if (visibleColumns.includes('type')) row.push(e.type);
      if (visibleColumns.includes('diagnosis')) row.push(e.diagnosis);
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full gap-4">
        {/* FILTER BAR */}
        <div className="bg-white rounded-lg border p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Patient/Encounter ID"
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border rounded-lg">Customize</button>
            <button onClick={downloadCSV} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Export CSV</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
          </div>

          {/* COLUMN FILTER */}
          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-semibold mb-3 text-gray-500">SHOW COLUMNS</p>
              <div className="flex flex-wrap gap-4">
                {['date', 'time', 'provider', 'location', 'type', 'diagnosis'].map(col => (
                  <label key={col} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftVisibleColumns.includes(col)}
                      onChange={() => setDraftVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                    />
                    <span className="text-sm">{col.charAt(0).toUpperCase() + col.slice(1)}</span>
                  </label>
                ))}
                <button onClick={applyFilters} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg">Apply Filter</button>
              </div>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white border rounded-lg overflow-hidden flex flex-col">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="p-3">
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded" />
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700">Encounter ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Patient Name</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Patient ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                  {visibleColumns.includes('date') && <th className="p-3 font-semibold text-gray-700">Date</th>}
                  {visibleColumns.includes('time') && <th className="p-3 font-semibold text-gray-700">Time</th>}
                  {visibleColumns.includes('provider') && <th className="p-3 font-semibold text-gray-700">Provider</th>}
                  {visibleColumns.includes('location') && <th className="p-3 font-semibold text-gray-700">Location</th>}
                  {visibleColumns.includes('type') && <th className="p-3 font-semibold text-gray-700">Type</th>}
                  {visibleColumns.includes('diagnosis') && <th className="p-3 font-semibold text-gray-700">Diagnosis</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, idx) => (
                  <tr key={e.id} className={`border-t hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleRow(e.id)} className="w-4 h-4 text-blue-600 rounded" />
                    </td>
                    <td className="p-3 font-semibold text-blue-600">{e.id}</td>
                    <td className="p-3 font-medium text-gray-900">{e.patientName}</td>
                    <td className="p-3 text-gray-600">{e.patientId}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(e.status)}`}>
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </span>
                    </td>
                    {visibleColumns.includes('date') && <td className="p-3 text-gray-600">{e.date}</td>}
                    {visibleColumns.includes('time') && <td className="p-3 text-gray-600">{e.time}</td>}
                    {visibleColumns.includes('provider') && <td className="p-3 text-gray-600">{e.provider}</td>}
                    {visibleColumns.includes('location') && <td className="p-3 text-gray-600">{e.location}</td>}
                    {visibleColumns.includes('type') && <td className="p-3 text-gray-600">{e.type}</td>}
                    {visibleColumns.includes('diagnosis') && <td className="p-3 text-gray-600">{e.diagnosis}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-3 flex justify-between text-sm">
            <span>{filtered.length} records found</span>
            {selected.size > 0 && <span className="text-blue-600">{selected.size} selected</span>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}