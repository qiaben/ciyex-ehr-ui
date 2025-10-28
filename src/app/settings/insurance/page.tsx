"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import AdminLayout from "@/app/(admin)/layout";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import Button from "@/components/ui/button/Button";

type InsuranceCompany = {
    id: number;
    payerId?: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactNumber?: string;
    notes?: string;
    status: "ACTIVE" | "ARCHIVED";
};

type CompanyForm = {
    payerId: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactNumber: string;
    notes: string;
};

export default function InsurancePage() {
    const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
    const [filtered, setFiltered] = useState<InsuranceCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editCompany, setEditCompany] = useState<InsuranceCompany | null>(null);
    const [form, setForm] = useState<CompanyForm>({
        payerId: "",
        name: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        contactNumber: "",
        notes: "",
    });
    const [errors, setErrors] = useState<{ [k: string]: string }>({});
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-companies`
            );
            const data = await res.json();
            setCompanies(data.data ?? data);
            setFiltered(data.data ?? data);
        } catch (err) {
            console.error("Error loading companies:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(companies);
        } else {
            setFiltered(
                companies.filter((c) =>
                    c.name?.toLowerCase().includes(search.toLowerCase())
                )
            );
        }
        setPage(1);
    }, [search, companies]);

    const validateForm = () => {
        const errs: { [k: string]: string } = {};
        if (!form.payerId.trim()) {
            errs.payerId = "Payer ID is required.";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            const method = editCompany ? "PUT" : "POST";
            const url = editCompany
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-companies/${editCompany.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-companies`;
            await fetchWithAuth(url, {
                method,
                body: JSON.stringify(form),
            });
            setOpen(false);
            setEditCompany(null);
            setForm({
                payerId: "",
                name: "",
                address: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
                contactNumber: "",
                notes: "",
            });
            setErrors({});
            loadCompanies();
        } catch (err) {
            console.error("Error saving company:", err);
        }
    };

    const handleToggleStatus = async (company: InsuranceCompany) => {
        const action = company.status === "ACTIVE" ? "archive" : "activate";
        try {
            await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL}/api/insurance-companies/${company.id}/${action}`,
                { method: "POST" }
            );
            loadCompanies();
        } catch (err) {
            console.error(`Error trying to ${action} company:`, err);
        }
    };

    const openAddModal = () => {
        setEditCompany(null);
        setForm({
            payerId: "",
            name: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            contactNumber: "",
            notes: "",
        });
        setErrors({});
        setOpen(true);
    };

    const openEditModal = (company: InsuranceCompany) => {
        setEditCompany(company);
        setForm({
            payerId: company.payerId || "",
            name: company.name,
            address: company.address,
            city: company.city,
            state: company.state,
            postalCode: company.postalCode,
            country: company.country,
            contactNumber: company.contactNumber || "",
            notes: company.notes || "",
        });
        setErrors({});
        setOpen(true);
    };

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(filtered.length / pageSize);

    return (
        <AdminLayout>
            <div className="p-4">
                {/* Search + Add Row */}
                <div className="flex justify-between items-center gap-3 mt-2 mb-4">
                    <Input
                        placeholder="Search Companies"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="!w-64 max-w-md text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <button
                        onClick={openAddModal}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-md shadow hover:from-blue-600 hover:to-indigo-600 transition"
                    >
                        + Insurance
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                    {loading ? (
                        <p className="p-4 text-gray-500 text-sm">
                            Loading insurance companies...
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                            <tr className="text-left text-gray-600 text-sm font-semibold uppercase tracking-wide">
                                <th className="px-3 py-2">Payer ID</th>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Address</th>
                                <th className="px-3 py-2">City</th>
                                <th className="px-3 py-2">State</th>
                                <th className="px-3 py-2">Postal Code</th>
                                <th className="px-3 py-2">Country</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.map((c) => (
                                <tr
                                    key={c.id}
                                    className="hover:bg-blue-50 text-gray-700 text-sm border-b border-gray-200"
                                >
                                    <td className="px-3 py-2">{c.payerId || "-"}</td>
                                    <td className="px-3 py-2 font-medium">{c.name}</td>
                                    <td className="px-3 py-2">{c.address}</td>
                                    <td className="px-3 py-2">{c.city}</td>
                                    <td className="px-3 py-2">{c.state}</td>
                                    <td className="px-3 py-2">{c.postalCode}</td>
                                    <td className="px-3 py-2">{c.country}</td>
                                    <td className="px-3 py-2">
                                        {c.status === "ACTIVE" ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                          Archived
                        </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 flex space-x-2">
                                        {/* Edit button */}
                                        <button
                                            onClick={() => openEditModal(c)}
                                            className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-blue-50"
                                            title="Edit"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-blue-600"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.862 4.487l2.651 2.651M9 11l7.862-7.862a1.5 1.5 0 112.121 2.121L11.121 13H9v-2z"
                                                />
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" />
                                            </svg>
                                        </button>


                                        {/* Archive / Activate button */}
                                        <button
                                            onClick={() => handleToggleStatus(c)}
                                            className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
                                            title={c.status === "ACTIVE" ? "Archive" : "Activate"}
                                        >
                                            {c.status === "ACTIVE" ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-gray-600"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2m-2 0v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7h14z"
                                                    />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-green-600"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>

                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
                    <p>
                        Showing {(page - 1) * pageSize + 1}-
                        {Math.min(page * pageSize, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex space-x-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>

                {/* Modal */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent onClose={() => setOpen(false)} className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-800">
                                Payer Information
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Payer ID */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Payer ID <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.payerId}
                                    onChange={(e) =>
                                        setForm({ ...form, payerId: e.target.value })
                                    }
                                    className={`w-full shadow-sm ${errors.payerId ? "border-red-500" : ""}`}
                                />
                                {errors.payerId && (
                                    <p className="text-red-500 text-xs mt-1">{errors.payerId}</p>
                                )}
                            </div>

                            {/* Two-column fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Payer Name</label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Address</label>
                                    <Input
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        className="shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">City</label>
                                    <Input
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        className="shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">State</label>
                                    <Input
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        className="shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                                    <Input
                                        value={form.postalCode}
                                        onChange={(e) =>
                                            setForm({ ...form, postalCode: e.target.value })
                                        }
                                        className="shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Country</label>
                                    <Input
                                        value={form.country}
                                        onChange={(e) =>
                                            setForm({ ...form, country: e.target.value })
                                        }
                                        className="shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Contact Number</label>
                                <Input
                                    value={form.contactNumber}
                                    onChange={(e) =>
                                        setForm({ ...form, contactNumber: e.target.value })
                                    }
                                    className="shadow-sm"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <Input
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="shadow-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} variant="primary" size="sm">
                                {editCompany ? "Update" : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
