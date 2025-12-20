'use client';

import React, { useState } from "react";
import AdminLayout from '@/app/(admin)/layout';

const DUMMY_PAYMENTS = [
  { id: 'PAY-2001', serviceDate: '2025-01-15', patientName: 'John Doe', paymentDate: '2025-01-16', cptCode: '99213', billingCode: 'B001', description: 'Office Visit - Established Patient', payments: 150.00 },
  { id: 'PAY-2002', serviceDate: '2025-01-15', patientName: 'Jane Smith', paymentDate: '2025-01-17', cptCode: '99214', billingCode: 'B002', description: 'Office Visit - Detailed', payments: 200.00 },
  { id: 'PAY-2003', serviceDate: '2025-01-16', patientName: 'Robert Brown', paymentDate: '2025-01-18', cptCode: '99215', billingCode: 'B003', description: 'Office Visit - Comprehensive', payments: 275.00 },
  { id: 'PAY-2004', serviceDate: '2025-01-17', patientName: 'Emily Davis', paymentDate: '2025-01-19', cptCode: '99212', billingCode: 'B004', description: 'Office Visit - Problem Focused', payments: 125.00 },
  { id: 'PAY-2005', serviceDate: '2025-01-18', patientName: 'Michael Wilson', paymentDate: '2025-01-20', cptCode: '99396', billingCode: 'B005', description: 'Preventive Medicine - Adult', payments: 180.00 },
];

const PROVIDERS = ['All Providers', 'Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
const CPT_CODES = ['All CPT Codes', '99212', '99213', '99214', '99215', '99396'];

export default function PaymentReportPage() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [provider, setProvider] = useState('All Providers');
  const [cptCode, setCptCode] = useState('All CPT Codes');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['serviceDate', 'patientName', 'paymentDate', 'cptCode', 'billingCode', 'description']);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<string[]>(['serviceDate', 'patientName', 'paymentDate', 'cptCode', 'billingCode', 'description']);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const filtered = DUMMY_PAYMENTS.filter(p => {
    const matchSearch = p.patientName.toLowerCase().includes(search.toLowerCase()) || p.cptCode.includes(search) || p.billingCode.includes(search) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCptCode = cptCode === 'All CPT Codes' || p.cptCode === cptCode;
    const matchDate = (!startDate || p.serviceDate >= startDate) && (!endDate || p.serviceDate <= endDate);
    return matchSearch && matchCptCode && matchDate;
  });

  const applyFilters = () => {
    setVisibleColumns(draftVisibleColumns);
    setShowFilters(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
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
    const headers = ['Billing', 'Service Date', 'Patient', 'Pymt. Date', 'CPT', 'Billing Code', 'Description', 'Payments'];

    const rows = filtered.map(p => {
      const row = [p.id, p.serviceDate, p.patientName, p.paymentDate, p.cptCode, p.billingCode, p.description, `$${p.payments.toFixed(2)}`];
      return row.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_report.csv';
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
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
              placeholder="Search Patient/CPT/Billing Code"
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
              value={cptCode}
              onChange={(e) => setCptCode(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {CPT_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
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
                {['serviceDate', 'patientName', 'paymentDate', 'cptCode', 'billingCode', 'description'].map(col => (
                  <label key={col} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftVisibleColumns.includes(col)}
                      onChange={() => setDraftVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                    />
                    <span className="text-sm">{col === 'serviceDate' ? 'Service Date' : col === 'patientName' ? 'Patient' : col === 'paymentDate' ? 'Pymt. Date' : col === 'cptCode' ? 'CPT' : col === 'billingCode' ? 'Billing Code' : 'Description'}</span>
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
                  <th className="p-3 text-left font-semibold text-gray-700">Billing</th>
                  {visibleColumns.includes('serviceDate') && <th className="p-3 text-left font-semibold text-gray-700">Service Date</th>}
                  {visibleColumns.includes('patientName') && <th className="p-3 text-left font-semibold text-gray-700">Patient</th>}
                  {visibleColumns.includes('paymentDate') && <th className="p-3 text-left font-semibold text-gray-700">Pymt. Date</th>}
                  {visibleColumns.includes('cptCode') && <th className="p-3 text-left font-semibold text-gray-700">CPT</th>}
                  {visibleColumns.includes('billingCode') && <th className="p-3 text-left font-semibold text-gray-700">Billing Code</th>}
                  {visibleColumns.includes('description') && <th className="p-3 text-left font-semibold text-gray-700">Description</th>}
                  <th className="p-3 text-left font-semibold text-gray-700">Payments</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.id} className={`border-t hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleRow(p.id)} className="w-4 h-4 text-blue-600 rounded" />
                    </td>
                    <td className="p-3 font-semibold text-blue-600">{p.id}</td>
                    {visibleColumns.includes('serviceDate') && <td className="p-3 text-gray-600">{p.serviceDate}</td>}
                    {visibleColumns.includes('patientName') && <td className="p-3 font-medium text-gray-900">{p.patientName}</td>}
                    {visibleColumns.includes('paymentDate') && <td className="p-3 text-gray-600">{p.paymentDate}</td>}
                    {visibleColumns.includes('cptCode') && <td className="p-3 text-gray-600">{p.cptCode}</td>}
                    {visibleColumns.includes('billingCode') && <td className="p-3 text-gray-600">{p.billingCode}</td>}
                    {visibleColumns.includes('description') && <td className="p-3 text-gray-600">{p.description}</td>}
                    <td className="p-3 text-gray-600 font-medium">${p.payments.toFixed(2)}</td>
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