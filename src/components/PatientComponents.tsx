"use client";
import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import VideoCallButton from "@/components/telehealth/VideoCallButton";

/* ---------------- TYPES ---------------- */
interface AppointmentDTO {
    id: number;
    visitType: string;
    patientId: number;
    providerId: number;
    appointmentStartDate: string;
    appointmentEndDate: string;
    appointmentStartTime: string;
    appointmentEndTime: string;
    priority?: string;
    locationId?: number;
    status: string;
    reason?: string;
}
// interface ProviderDTO {
//     id: number;
//     name: string;
// }

interface Billing {
    patientBalanceDue?: number;
    insuranceBalanceDue?: number;
    totalBalanceDue?: number;
}

interface Lab {
    testName: string;
    orderDate: string;
    result: string;
    referenceRange: string;
    status: string;
}

interface ReportFlatProps {
    useDateRange: boolean;
    setUseDateRange: (value: boolean) => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
    reportFilters: string[];
    toggleFilter: (filter: string) => void;
    generateReport: (type: string, filters?: string[]) => void;
    downloadReport: (type: string, filters?: string[]) => void;
    lastVisitedTab: string;
    setActiveTab: (tab: string) => void;
}

/* ---------------- APPOINTMENTS ---------------- */
export const AppointmentsFlat: React.FC<{
    patientId: number;
    formatDateTimeLocal: (d: string) => string;
}> = ({ patientId, formatDateTimeLocal }) => {
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // provider list
    const [providers, setProviders] = useState<{ id: number; name: string }[]>([]);

    // form state
    const [form, setForm] = useState({
        providerId: "",
        visitType: "",
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
    });

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/patient/${patientId}?page=0&size=10`
                );
                const json = await res.json();
                setAppointments(json.data?.content || []);
            } catch (err) {
                console.error("Error fetching appointments", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchProviders = async () => {
            try {
                const res = await fetchWithAuth(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/providers?active=true`
                );
                const json = await res.json();
                setProviders(json.data || []);
            } catch (err) {
                console.error("Error fetching providers", err);
            }
        };

        if (patientId) fetchAppointments();
        fetchProviders();
    }, [patientId]);

    const setField = (key: string, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        try {
            const payload = {
                patientId,
                providerId: Number(form.providerId),
                visitType: form.visitType,
                appointmentStartDate: form.date,
                appointmentStartTime: form.startTime,
                appointmentEndTime: form.endTime,
                reason: form.reason,
                status: "Scheduled",
            };
            const res = await fetchWithAuth(
                `${process.env.NEXT_PUBLIC_API_URL}/api/appointments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            if (res.ok) {
                setShowModal(false);
                setForm({ providerId: "", visitType: "", date: "", startTime: "", endTime: "", reason: "" });
                const updated = await res.json();
                setAppointments((prev) => [updated.data, ...prev].slice(0, 10));
            } else {
                console.error("Failed to save appointment");
            }
        } catch (err) {
            console.error("Error saving appointment", err);
        }
    };

    const filteredAppointments = appointments.filter((appt) =>
        [appt.visitType, appt.status, appt.reason]
            .filter(Boolean)
            .some((field) =>
                field!.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-lg text-gray-800">Appointments</h4>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700"
                >
                    Schedule
                </button>
            </div>

            <input
                className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
            ) : (
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Provider</th>
                        <th className="px-4 py-2 text-left">Visit Type</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Video Call</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2">
                                    {formatDateTimeLocal(appt.appointmentStartDate).split(",")[0]}
                                </td>
                                <td className="px-4 py-2">
                                    {appt.appointmentStartTime} – {appt.appointmentEndTime}
                                </td>
                                <td className="px-4 py-2">
                                    {appt.providerId
                                        ? providers.find((p) => p.id === appt.providerId)?.name || `Provider #${appt.providerId}`
                                        : "—"}
                                </td>
                                <td className="px-4 py-2">{appt.visitType || "—"}</td>
                                <td className="px-4 py-2">
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${
                            appt.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : appt.status === "Scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                        }`}
                    >
                      {appt.status}
                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    {(appt.status === "Scheduled" && (appt.visitType === "Telehealth" || appt.visitType === "Video Consultation")) ? (
                                        <VideoCallButton 
                                            patientId={appt.patientId}
                                            appointmentId={appt.id} providerId={0}                                        />
                                    ) : (
                                        "—"
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                                {searchTerm
                                    ? "No matching appointments found"
                                    : "No appointments scheduled"}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold">Schedule Appointment</h3>

                        {/* Provider dropdown */}
                        <label className="block text-sm font-medium">Provider</label>
                        <select
                            value={form.providerId}
                            onChange={(e) => setField("providerId", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        >
                            <option value="">-- Select Provider --</option>
                            {providers.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Visit Type"
                            value={form.visitType}
                            onChange={(e) => setField("visitType", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        />
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setField("date", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        />
                        <div className="flex gap-2">
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setField("startTime", e.target.value)}
                                className="flex-1 border rounded px-2 py-1"
                            />
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => setField("endTime", e.target.value)}
                                className="flex-1 border rounded px-2 py-1"
                            />
                        </div>
                        <textarea
                            placeholder="Reason"
                            value={form.reason}
                            onChange={(e) => setField("reason", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-3 py-1 bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-blue-600 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ---------------- BILLING ---------------- */
export const BillingFlat: React.FC<{ billing: Billing | null }> = ({ billing }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 className="font-semibold text-lg mb-4 text-gray-800">Billing</h4>
        {billing ? (
            <table className="w-full text-sm">
                <tbody>
                <tr className="border-b">
                    <td className="px-3 py-2">Patient Balance Due</td>
                    <td className="px-3 py-2 text-right">
                        {billing.patientBalanceDue?.toFixed(2) ?? "0.00"}
                    </td>
                </tr>
                <tr className="border-b">
                    <td className="px-3 py-2">Insurance Balance Due</td>
                    <td className="px-3 py-2 text-right">
                        {billing.insuranceBalanceDue?.toFixed(2) ?? "0.00"}
                    </td>
                </tr>
                <tr>
                    <td className="px-3 py-2 font-semibold">Total Balance Due</td>
                    <td className="px-3 py-2 text-right font-semibold">
                        {billing.totalBalanceDue?.toFixed(2) ?? "0.00"}
                    </td>
                </tr>
                </tbody>
            </table>
        ) : (
            <div className="text-center py-6 text-gray-500">No billing records</div>
        )}
    </div>
);

/* ---------------- MEDICATIONS (re-export) ---------------- */
export { default as MedicationsFlat } from "./MedicationsFlat";

/* ---------------- ALLERGIES (re-export) ---------------- */
export { default as AllergiesFlat } from "./AllergiesFlat";

/* ---------------- INSURANCE (re-export) ---------------- */
export { default as InsuranceFlat } from "./InsuranceFlat";

export { default as MedicalProblemsFlat } from "./MedicalProblemsFlat";

export { default as IssuesFlat } from "@/components/IssuesFlat";

export { default as ImmunizationsFlat } from "@/components/ImmunizationsFlat";

/* ---------------- HEALTHCARE SERVICES (new) ---------------- */
export { default as HealthcareServicesFlat } from "@/components/HealthcareServicesFlat";

/* ---------------- PAYMENT ---------------- */
export { default as PaymentFlat } from "@/components/PaymentFlat";

/* ---------------- REPORT ---------------- */
export const ReportFlat: React.FC<ReportFlatProps> = ({
                                                          useDateRange,
                                                          setUseDateRange,
                                                          startDate,
                                                          setStartDate,
                                                          endDate,
                                                          setEndDate,
                                                          reportFilters,
                                                          toggleFilter,
                                                          generateReport,
                                                          downloadReport,
                                                          lastVisitedTab,
                                                          setActiveTab,
                                                      }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <h4 className="font-semibold text-lg text-gray-800">Reports</h4>

        {/* CCR */}
        <div>
            <h5 className="font-medium mb-2">Continuity of Care Record (CCR)</h5>
            <label className="flex items-center gap-2 mb-2 text-sm">
                <input
                    type="checkbox"
                    checked={useDateRange}
                    onChange={(e) => setUseDateRange(e.target.checked)}
                />
                Use Date Range
            </label>
            {useDateRange && (
                <div className="flex gap-2 mb-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    />
                </div>
            )}
            <div className="space-x-2">
                <button
                    onClick={() => generateReport("CCR")}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    Generate
                </button>
                <button
                    onClick={() => downloadReport("CCR")}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    Download
                </button>
            </div>
        </div>

        {/* CCD */}
        <div>
            <h5 className="font-medium mb-2">Continuity of Care Document (CCD)</h5>
            <div className="space-x-2">
                <button
                    onClick={() => generateReport("CCD")}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    Generate
                </button>
                <button
                    onClick={() => downloadReport("CCD")}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    Download
                </button>
            </div>
        </div>

        {/* Patient Report */}
        <div>
            <h5 className="font-medium mb-2">Patient Report</h5>
            <div className="flex flex-wrap gap-3 mb-4 text-sm">
                {[
                    "Demographics",
                    "History",
                    "Insurance",
                    "Billing",
                    "Immunizations",
                    "Notes",
                    "Transactions",
                    "Communications",
                ].map((f) => (
                    <label key={f} className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={reportFilters.includes(f)}
                            onChange={() => toggleFilter(f)}
                        />
                        {f}
                    </label>
                ))}
            </div>
            <div className="space-x-2 mb-4">
                <button
                    onClick={() => generateReport("Patient", reportFilters)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    Generate
                </button>
                <button
                    onClick={() => downloadReport("Patient", reportFilters)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    Download
                </button>
            </div>
        </div>

        <div>
            <button
                onClick={() => setActiveTab(lastVisitedTab)}
                className="px-4 py-2 bg-gray-500 text-white rounded text-sm"
            >
                Cancel
            </button>
        </div>
    </div>
);

/* ---------------- LABS ---------------- */
export const LabsFlat: React.FC<{ labsData: Lab[] }> = ({ labsData }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 className="font-semibold text-lg text-gray-800 mb-4">Labs</h4>
        {!labsData?.length ? (
            <div className="text-center py-6 text-gray-500">No lab results</div>
        ) : (
            <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-2 py-1">Test</th>
                    <th className="px-2 py-1">Order Date</th>
                    <th className="px-2 py-1">Result</th>
                    <th className="px-2 py-1">Range</th>
                    <th className="px-2 py-1">Status</th>
                </tr>
                </thead>
                <tbody>
                {labsData.map((lab, i) => (
                    <tr key={i}>
                        <td className="border px-2 py-1">{lab.testName}</td>
                        <td className="border px-2 py-1">{lab.orderDate}</td>
                        <td className="border px-2 py-1">{lab.result}</td>
                        <td className="border px-2 py-1">{lab.referenceRange}</td>
                        <td className="border px-2 py-1">{lab.status}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        )}
    </div>
);