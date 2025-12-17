"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/(admin)/layout";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";
import Alert from "@/components/ui/alert/Alert";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

type MaintenanceTask = {
    id: number;
    equipment: string;
    category: string;
    location: string;
    dueDate: string;
    lastServiceDate?: string;
    assignee: string;
    vendor?: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    status: "Open" | "In Progress" | "Done";
    notes?: string;
};

function TableShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
            {children}
        </div>
    );
}

function Pill({
                  children,
                  tone = "neutral",
              }: {
    children: React.ReactNode;
    tone?: "neutral" | "warn" | "ok";
}) {
    const map: Record<"neutral" | "warn" | "ok", string> = {
        neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        warn: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
        ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]}`}
        >
      {children}
    </span>
    );
}

export default function Maintenance() {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<Partial<MaintenanceTask>>({
        equipment: "",
        category: "Preventive",
        location: "",
        dueDate: "",
        lastServiceDate: "",
        assignee: "",
        vendor: "",
        priority: "Medium",
        notes: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [alertData, setAlertData] = useState<{
        variant: "success" | "error" | "warning" | "info";
        title: string;
        message: string;
    } | null>(null);

    useEffect(() => {
        if (alertData) {
            const timer = setTimeout(() => setAlertData(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [alertData]);

    // ✅ Fetch all tasks with pagination
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/maintenances?page=${currentPage - 1}&size=${pageSize}`
                );
                const data = await res.json();
                if (res.ok && data.success) {
                    setTasks(data.data.content ?? []);
                    setTotalPages(data.data.totalPages);
                    setTotalItems(data.data.totalElements);
                } else {
                    setTasks([]);
                }
            } catch (err) {
                console.error("Failed to fetch maintenances:", err);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [currentPage, pageSize]);

    // Validate mandatory fields
    function validateForm(): boolean {
        const newErrors: Record<string, string> = {};
        
        if (!form.equipment?.trim()) newErrors.equipment = "Equipment is required";
        if (!form.location?.trim()) newErrors.location = "Location is required";
        if (!form.dueDate?.trim()) newErrors.dueDate = "Due date is required";
        if (!form.assignee?.trim()) newErrors.assignee = "Assignee is required";
        
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            setAlertData({
                variant: "error",
                title: "Validation Error",
                message: "Mandatory values should be filled",
            });
            return false;
        }
        
        return true;
    }

    // ✅ Create task
    async function createTask(e: React.FormEvent) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            const payload = { ...form, status: "Open" };
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL}/api/maintenances`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const data = await res.json();
            if (data.success) {
                setTasks((prev) => [...prev, data.data]);
                setShowModal(false);
                setForm({
                    equipment: "",
                    category: "Preventive",
                    location: "",
                    dueDate: "",
                    lastServiceDate: "",
                    assignee: "",
                    vendor: "",
                    priority: "Medium",
                    notes: "",
                });
                setErrors({});
                setAlertData({
                    variant: "success",
                    title: "Success",
                    message: "Maintenance task saved successfully",
                });
            } else {
                throw new Error(data.message || "Failed to create task");
            }
        } catch (err) {
            console.error(err);
            setAlertData({
                variant: "error",
                title: "Error",
                message: "Failed to create maintenance task.",
            });
        }
    }

    // ✅ Update status via dedicated endpoint
    async function cycleStatus(id: number, current: "Open" | "In Progress" | "Done") {
        const next: "Open" | "In Progress" | "Done" =
            current === "Open" ? "In Progress" : current === "In Progress" ? "Done" : "Open";


        try {
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL}/api/maintenances/${id}/status?status=${encodeURIComponent(next)}`,
                { method: "PUT" }
            );
            const data = await res.json();
            if (data.success) {
                setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
                setAlertData({
                    variant: "success",
                    title: "Status Updated",
                    message: `Task #${id} marked as ${next}.`,
                });
            } else {
                throw new Error("Failed to update");
            }
        } catch {
            setAlertData({
                variant: "error",
                title: "Error",
                message: "Failed to update task status.",
            });
        }
    }

    return (
        <AdminLayout>
            {/* ✅ Alert */}
            {alertData && (
                <div className="mb-4">
                    <Alert
                        variant={alertData.variant}
                        title={alertData.title}
                        message={alertData.message}
                    />
                </div>
            )}

            <div className="flex items-center justify-between p-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage maintenance tasks, schedules, and statuses.
                </p>
                <Button
                    className="h-8 px-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setShowModal(true)}
                >
                    + New Task
                </Button>
            </div>

            <div className="mt-4 space-y-4">
                <TableShell>
                    <table className="w-full table-auto text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr className="text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                            <th className="px-6 py-3">Equipment</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Priority</th>
                            <th className="px-6 py-3">Location</th>
                            <th className="px-6 py-3">Due</th>
                            <th className="px-6 py-3">Assignee</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tasks.map((t) => (
                            <tr
                                key={t.id}
                                className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                <td className="px-6 py-3">{t.equipment}</td>
                                <td className="px-6 py-3">{t.category}</td>
                                <td className="px-6 py-3">{t.priority}</td>
                                <td className="px-6 py-3">{t.location}</td>
                                <td className="px-6 py-3">{t.dueDate}</td>
                                <td className="px-6 py-3">{t.assignee}</td>
                                <td className="px-6 py-3">
                                    <Pill
                                        tone={
                                            t.status === "Done"
                                                ? "ok"
                                                : t.status === "In Progress"
                                                    ? "neutral"
                                                    : "warn"
                                        }
                                    >
                                        {t.status}
                                    </Pill>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Button
                                        onClick={() => cycleStatus(t.id, t.status)}
                                        className="rounded-2xl px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        {t.status === "Open"
                                            ? "Progress"
                                            : t.status === "In Progress"
                                                ? "Mark Done"
                                                : "Reopen"}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </TableShell>
            </div>

            {/* Pagination */}
            <div className="mt-3 flex items-center justify-between px-3 py-2 border-t bg-white dark:bg-gray-900 dark:border-gray-700 text-sm">
                <div className="flex items-center gap-3">
                    <button
                        disabled={currentPage === 1 || loading}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 border rounded disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
                    >
                        Prev
                    </button>
                    <div>Page {currentPage} of {totalPages}</div>
                    <button
                        disabled={currentPage === totalPages || loading}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 border rounded disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
                    >
                        Next
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div>Showing {loading ? "…" : tasks.length} of {totalItems}</div>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border rounded px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-start justify-between px-6 py-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                New Maintenance Task
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={createTask} className="flex flex-col max-h-[70vh]">
                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
                                <div>
                                    <Label>
                                        Equipment <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={form.equipment}
                                        onChange={(e) => {
                                            setForm({ ...form, equipment: e.target.value });
                                            if (errors.equipment) setErrors({ ...errors, equipment: "" });
                                        }}
                                        className={errors.equipment ? "border-red-500" : ""}
                                    />
                                    {errors.equipment && (
                                        <p className="text-red-500 text-xs mt-1">{errors.equipment}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Category</Label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="h-10 w-full rounded-md border px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option>Preventive</option>
                                        <option>Corrective</option>
                                        <option>Calibration</option>
                                        <option>Cleaning</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Priority</Label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                priority: e.target.value as MaintenanceTask["priority"],
                                            })
                                        }
                                        className="h-10 w-full rounded-md border px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option>Critical</option>
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>
                                        Location <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={form.location}
                                        onChange={(e) => {
                                            setForm({ ...form, location: e.target.value });
                                            if (errors.location) setErrors({ ...errors, location: "" });
                                        }}
                                        className={errors.location ? "border-red-500" : ""}
                                    />
                                    {errors.location && (
                                        <p className="text-red-500 text-xs mt-1">{errors.location}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>
                                        Due Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={form.dueDate}
                                        onChange={(e) => {
                                            setForm({ ...form, dueDate: e.target.value });
                                            if (errors.dueDate) setErrors({ ...errors, dueDate: "" });
                                        }}
                                        className={errors.dueDate ? "border-red-500" : ""}
                                    />
                                    {errors.dueDate && (
                                        <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Last Service Date</Label>
                                    <Input
                                        type="date"
                                        value={form.lastServiceDate}
                                        onChange={(e) =>
                                            setForm({ ...form, lastServiceDate: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>
                                        Assignee <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={form.assignee}
                                        onChange={(e) => {
                                            setForm({ ...form, assignee: e.target.value });
                                            if (errors.assignee) setErrors({ ...errors, assignee: "" });
                                        }}
                                        className={errors.assignee ? "border-red-500" : ""}
                                    />
                                    {errors.assignee && (
                                        <p className="text-red-500 text-xs mt-1">{errors.assignee}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Vendor</Label>
                                    <Input
                                        value={form.vendor}
                                        onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Notes</Label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
                                <Button type="button" onClick={() => setShowModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 text-white">
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
