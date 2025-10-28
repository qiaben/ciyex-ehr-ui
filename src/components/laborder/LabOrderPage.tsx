"use client";

import { useState } from "react";

type LabOrder = {
    orderNumber: string;
    reporting: string;
    type: string;
    qualifier: string;
    procedure: string;
    icd10: string;
    modifier: string;
    category: string;
    diagnostic: string;
    service: string;
    status: string;
    date: string;
};

export default function LabOrdersPage() {
    const [orders, setOrders] = useState<LabOrder[]>([
        {
            orderNumber: "12345",
            reporting: "Diagnosis X",
            type: "Standard",
            qualifier: "Primary",
            procedure: "CPT4-99213",
            icd10: "A10",
            modifier: "None",
            category: "Laboratory",
            diagnostic: "Yes",
            service: "Blood Test",
            status: "Pending",
            date: "2025-09-06",
        },
    ]);

    const [form, setForm] = useState<LabOrder>({
        orderNumber: "",
        reporting: "",
        type: "Standard",
        qualifier: "All",
        procedure: "",
        icd10: "",
        modifier: "",
        category: "Unassigned",
        diagnostic: "",
        service: "",
        status: "Pending",
        date: new Date().toISOString().slice(0, 10),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!form.orderNumber) {
            alert("Order Number is required");
            return;
        }
        setOrders([...orders, form]);
        setForm({
            orderNumber: "",
            reporting: "",
            type: "Standard",
            qualifier: "All",
            procedure: "",
            icd10: "",
            modifier: "",
            category: "Unassigned",
            diagnostic: "",
            service: "",
            status: "Pending",
            date: new Date().toISOString().slice(0, 10),
        });
    };

    const handleCancel = () => {
        setForm({
            orderNumber: "",
            reporting: "",
            type: "Standard",
            qualifier: "All",
            procedure: "",
            icd10: "",
            modifier: "",
            category: "Unassigned",
            diagnostic: "",
            service: "",
            status: "Pending",
            date: new Date().toISOString().slice(0, 10),
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Lab Orders – Medical Coding</h1>
            </div>

            {/* Entry Form */}
            <div className="bg-white shadow rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Order Number *</label>
                    <input
                        type="text"
                        name="orderNumber"
                        value={form.orderNumber}
                        onChange={handleChange}
                        placeholder="Enter Order #"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Reporting / Relate To</label>
                    <input
                        type="text"
                        name="reporting"
                        value={form.reporting}
                        onChange={handleChange}
                        placeholder="Diagnosis / Service Code"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Type</label>
                    <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="border rounded p-2 text-sm"
                    >
                        <option>Standard</option>
                        <option>Custom</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Qualifier</label>
                    <select
                        name="qualifier"
                        value={form.qualifier}
                        onChange={handleChange}
                        className="border rounded p-2 text-sm"
                    >
                        <option>All</option>
                        <option>Primary</option>
                        <option>Secondary</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Procedure / Service</label>
                    <input
                        type="text"
                        name="procedure"
                        value={form.procedure}
                        onChange={handleChange}
                        placeholder="CPT4 / HCPCS"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">ICD10 Diagnosis</label>
                    <input
                        type="text"
                        name="icd10"
                        value={form.icd10}
                        onChange={handleChange}
                        placeholder="ICD-10 Code"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Code Modifier</label>
                    <input
                        type="text"
                        name="modifier"
                        value={form.modifier}
                        onChange={handleChange}
                        placeholder="Modifier"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Category</label>
                    <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="border rounded p-2 text-sm"
                    >
                        <option>Unassigned</option>
                        <option>Preventive</option>
                        <option>Emergency</option>
                        <option>Laboratory</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Diagnostic Reporting</label>
                    <input
                        type="text"
                        name="diagnostic"
                        value={form.diagnostic}
                        onChange={handleChange}
                        placeholder="Yes / No"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Service</label>
                    <input
                        type="text"
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        placeholder="Service name"
                        className="border rounded p-2 text-sm"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="border rounded p-2 text-sm"
                    >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                    </select>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Save
                </button>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                    Cancel
                </button>
            </div>

            {/* Dashboard Table */}
            <div>
                <h2 className="text-xl font-bold mb-4">Lab Orders Dashboard</h2>
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">Order #</th>
                            <th className="border p-2">Reporting</th>
                            <th className="border p-2">Type</th>
                            <th className="border p-2">Qualifier</th>
                            <th className="border p-2">Procedure</th>
                            <th className="border p-2">ICD10</th>
                            <th className="border p-2">Modifier</th>
                            <th className="border p-2">Category</th>
                            <th className="border p-2">Diagnostic</th>
                            <th className="border p-2">Service</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((o, i) => (
                            <tr key={i}>
                                <td className="border p-2">{o.orderNumber}</td>
                                <td className="border p-2">{o.reporting}</td>
                                <td className="border p-2">{o.type}</td>
                                <td className="border p-2">{o.qualifier}</td>
                                <td className="border p-2">{o.procedure}</td>
                                <td className="border p-2">{o.icd10}</td>
                                <td className="border p-2">{o.modifier}</td>
                                <td className="border p-2">{o.category}</td>
                                <td className="border p-2">{o.diagnostic}</td>
                                <td className="border p-2">{o.service}</td>
                                <td
                                    className={`border p-2 ${
                                        o.status === "Pending"
                                            ? "text-yellow-600"
                                            : o.status === "Completed"
                                                ? "text-green-600"
                                                : "text-blue-600"
                                    }`}
                                >
                                    {o.status}
                                </td>
                                <td className="border p-2">{o.date}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
