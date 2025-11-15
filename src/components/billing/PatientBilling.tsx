

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

/* =========================================================
   Props / Types
========================================================= */
type Props = {
    patientId: number;
    patientName: string;
};

type InvoiceStatus = "OPEN" | "PARTIALLY_PAID" | "PAID" | "VOID";
type ClaimStatus =
    | "DRAFT"
    | "READY_FOR_SUBMISSION"
    | "SUBMITTED"
    | "IN_PROCESS"
    | "ACCEPTED"
    | "REJECTED"
    | "CLOSED"
    | "VOID";

type PaymentMethod =
    | "CREDIT_CARD"
    | "CHECK"
    | "DEBIT_CARD"
    | "EFT"
    | "CASH"
    | "CARE_CREDIT"
    | "MASTERCARD"
    | "VISA"
    | "DISCOVER"
    | "AMEX";

type NoteTargetType = "INVOICE" | "CLAIM" | "INSURANCE_PAYMENT" | "PATIENT_PAYMENT";

type Note = {
    id: number;
    patientId: number;
    invoiceId?: number;
    type: NoteTargetType;
    targetId: number;
    text: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
};

type InvoiceLine = {
    id: number;
    dos: string;
    code: string;
    treatment: string;
    provider: string;
    charge: number;
    allowed?: number;
    insWriteOff?: number;
    insPortion?: number;
    patientPortion?: number;
};

type Invoice = {
    id: number;
    patientId: number;
    status: InvoiceStatus;
    lines: InvoiceLine[];
    insWO?: number;
    ptBalance?: number;
    insBalance?: number;
    totalCharge?: number;
    insPaid?: number;
    ptPaid?: number;
};

type Claim = {
    id: number;
    invoiceId: number;
    patientId: number;
    payerName: string | null;
    treatingProviderId?: string | null;
    provider?: string | null;
    billingEntity?: string | null;
    policyNumber?: string | null;
    type: "Electronic" | "Paper" | null;
    notes?: string | null;
    status: ClaimStatus;
    attachments: number;
    eobAttached: boolean;
    createdOn?: string | null;
    locked?: boolean; // Add locked flag to Claim type
};

type InsuranceRemitLine = {
     id: number;
    invoiceLineId: number;
    submitted: number;
    balance: number;
    deductible: number;
    allowed: number;
    insWriteOff: number;
    insPay: number;
    updateAllowed?: boolean;
    updateFlatPortion?: boolean;
    applyWriteoff?: boolean;
};

type PatientPaymentAllocation = {
    invoiceLineId: number;
    amount: number;
};

type PatientPayment = {
  id: number;                 // <-- paymentId
  amount: number;
  paymentMethod?: PaymentMethod | string;
};

type AccountCredit = { balance: number };

type CourtesyCredit = {
    id: number;
    invoiceId: number;
    patientId: number;
    adjustmentType: string;
    amount: number;
    description?: string;
    appliedDate?: string;
    createdAt?: string;
};

type Provider = {
    id: number;
    name: string;
};

type Patient = {
    id: number;
    name: string;
};

type InsuranceCompany = {
    id: number;
    name: string;
};

/* =========================================================
   Small UI helpers
========================================================= */
const currency = (n: number | undefined) =>
    Number(n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

// safe-sum helper (prevents “number | undefined” errors)
const sum = (nums: Array<number | undefined>) =>
    nums.reduce((a: number, b) => a + (Number.isFinite(Number(b)) ? Number(b) : 0), 0);

const Badge: React.FC<{
    tone: "red" | "green" | "amber" | "blue" | "gray" | "purple";
    children: React.ReactNode;
}> = ({ tone, children }) => {
    const map: Record<string, string> = {
        red: "bg-red-100 text-red-700 border-red-200",
        green: "bg-green-100 text-green-700 border-green-200",
        amber: "bg-amber-100 text-amber-800 border-amber-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
        gray: "bg-gray-100 text-gray-700 border-gray-200",
        purple: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return (
        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${map[tone]}`}>
      {children}
    </span>
    );
};

const SectionCard: React.FC<{
    title: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, actions, children }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            {actions}
        </div>
        {children}
    </div>
);

const SegmentedTabs: React.FC<{
    tabs: { id: string; label: string }[];
    value: string;
    onChange: (id: string) => void;
}> = ({ tabs, value, onChange }) => (
    <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-2 border-b bg-white/80 px-1 py-2 backdrop-blur">
        {tabs.map((t) => (
            <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition ${
                    value === t.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
                {t.label}
            </button>
        ))}
    </div>
);

const RowStat: React.FC<{
    label: string;
    value: string;
    bold?: boolean;
    tone?: "red" | "default";
    hideOnSmall?: boolean;
}> = ({ label, value, bold, tone = "default", hideOnSmall }) => (
    <div className={`${hideOnSmall ? "hidden md:block" : ""}`}>
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
        <div className={`${bold ? "font-semibold" : ""} ${tone === "red" ? "text-red-600" : ""}`}>{value}</div>
    </div>
);

const IconBtn: React.FC<React.PropsWithChildren<{ title: string; onClick?: () => void; disabled?: boolean }>> = ({
                                                                                                 children,
                                                                                                 title,
                                                                                                 onClick,
                                                                                                 disabled,
                                                                                             }) => (
    <button
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={`rounded border border-gray-200 bg-white px-2 py-1 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
    >
        {children}
    </button>
);

const styles = `
.btn-primary{border-radius:.375rem;padding:.375rem .75rem;font-size:.875rem;background:#2563eb;color:#fff;transition:filter .15s}
.btn-primary:hover{filter:brightness(.95)}
.btn-light{border:1px solid #e5e7eb;border-radius:.375rem;padding:.375rem .75rem;font-size:.875rem;background:#fff;transition:background .15s}
.btn-light:hover{background:#f8fafc}
.btn-danger{border-radius:.375rem;padding:.375rem .75rem;font-size:.875rem;background:#dc2626;color:#fff}
.input{border:1px solid #e5e7eb;border-radius:.375rem;padding:.375rem .75rem;font-size:.875rem;outline:none}
.input:focus{box-shadow:0 0 0 2px #93c5fd;border-color:#60a5fa}
.label{margin-bottom:.25rem;display:block;font-size:.75rem;font-weight:500;color:#64748b}
`;
const StyleInjector: React.FC = () => (
    <style id="billing-inline-styles-v6" dangerouslySetInnerHTML={{ __html: styles }} />
);

/* =========================================================
   Component
========================================================= */
export default function PatientBilling({ patientId, patientName }: Props) {
    // More Actions state
    const [moreActionsOpenId, setMoreActionsOpenId] = React.useState<number | null>(null);
    const [showStatusModal, setShowStatusModal] = React.useState(false);
    const [statusModalClaim, setStatusModalClaim] = React.useState<Claim | null>(null);
    const [showAttachmentModal, setShowAttachmentModal] = React.useState(false);
    const [attachmentClaim, setAttachmentClaim] = React.useState<Claim | null>(null);
    const [showAttachmentConfirm, setShowAttachmentConfirm] = React.useState(false);
    const [lockLoading, setLockLoading] = React.useState(false);

    async function handleLockClaim(claim: Claim) {
        setLockLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patient-billing/${patientId}/claims/${claim.id}/lock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const body = await res.json();
            if (!body?.success) {
                alert(body?.message || "Failed to lock claim");
                return;
            }
            await loadAll(); // Refresh claim data
        } catch (err) {
            alert("Error: " + (err as Error).message);
        } finally {
            setLockLoading(false);
        }
    }

    function handleChangeClaimStatus(claim: Claim) {
        setStatusModalClaim(claim);
        setShowStatusModal(true);
        // Actual API call is in StatusModal's handleSave
    }

    function handleSubmitAttachments(claim: Claim) {
        setAttachmentClaim(claim);
        setShowAttachmentConfirm(true);
        // Actual API call is in AttachmentModal's handleUpload
    }

    function renderMoreActions(claim: Claim) {
        return (
            <div style={{ position: "relative", display: "inline-block" }}>
                <IconBtn title="More Actions" onClick={() => setMoreActionsOpenId(moreActionsOpenId === claim.id ? null : claim.id)}>
                    <span role="img" aria-label="more">⋮</span>
                </IconBtn>
                {moreActionsOpenId === claim.id && (
                    <div style={{ position: "absolute", right: 0, zIndex: 10, background: "#fff", border: "1px solid #eee", borderRadius: 4, boxShadow: "0 2px 8px #0002", minWidth: 180 }}>
                        <button className="btn-light" style={{ width: "100%", textAlign: "left" }} disabled={claim.locked} onClick={() => { handleLockClaim(claim); setMoreActionsOpenId(null); }}>Lock Claim</button>
                        <button className="btn-light" style={{ width: "100%", textAlign: "left" }} onClick={() => { handleSubmitAttachments(claim); setMoreActionsOpenId(null); }}>Submit Attachments</button>
                        <button className="btn-light" style={{ width: "100%", textAlign: "left" }} disabled={claim.locked} onClick={() => { handleChangeClaimStatus(claim); setMoreActionsOpenId(null); }}>Change Claim Status</button>
                    </div>
                )}
            </div>
        );
    }

    // Modal for Change Claim Status
    function StatusModal({ claim, onClose }: { claim: Claim, onClose: () => void }) {
        const [selectedStatus, setSelectedStatus] = React.useState<string>("");
        const [remitDate, setRemitDate] = React.useState("");
        const [paymentAmount, setPaymentAmount] = React.useState("");
        async function handleSave() {
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patient-billing/${patientId}/claims/${claim.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: selectedStatus, remitDate, paymentAmount }),
                });
                const body = await res.json();
                if (!body?.success) {
                    alert(body?.message || "Failed to change claim status");
                    return;
                }
                await loadAll();
                onClose();
            } catch (err) {
                alert("Error: " + (err as Error).message);
            }
        }
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Modify Claim Status</h3>
                    <div className="mb-3">
                        <label><input type="radio" value="ACCEPTED" checked={selectedStatus === "ACCEPTED"} onChange={() => setSelectedStatus("ACCEPTED")} /> Accepted & Paid</label><br />
                        <label><input type="radio" value="DENIED" checked={selectedStatus === "DENIED"} onChange={() => setSelectedStatus("DENIED")} /> Accepted but Final Payment Denied</label><br />
                        <label><input type="radio" value="REJECTED" checked={selectedStatus === "REJECTED"} onChange={() => setSelectedStatus("REJECTED")} /> Rejected</label>
                    </div>
                    {/* Show Remittance Date for Accepted & Paid and Denied */}
                    {(selectedStatus === "ACCEPTED" || selectedStatus === "DENIED") && (
                        <div className="mb-3">
                            <label>Remittance Date: <input type="date" value={remitDate} onChange={e => setRemitDate(e.target.value)} /></label>
                        </div>
                    )}
                    {/* Show Insurance Payment Amount only for Accepted & Paid */}
                    {selectedStatus === "ACCEPTED" && (
                        <div className="mb-3">
                            <label>Insurance Payment Amount: <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></label>
                        </div>
                    )}
                    <div className="flex gap-2 mt-4">
                        <button className="btn-primary" onClick={handleSave}>Save</button>
                        <button className="btn-light" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    // Modal for Submit Attachments
    function AttachmentModal({ claim, onClose }: { claim: Claim, onClose: () => void }) {
        const [file, setFile] = React.useState<File | null>(null);
        async function handleUpload() {
            if (!file) return;
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patient-billing/${patientId}/claims/${claim.id}/attachment`, {
                    method: "POST",
                    body: formData,
                });
                const body = await res.json();
                if (!body?.success) {
                    alert(body?.message || "Failed to submit attachment");
                    return;
                }
                await loadAll();
                onClose();
            } catch (err) {
                alert("Error: " + (err as Error).message);
            }
        }
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Submit Attachments</h3>
                    <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    <div className="flex gap-2 mt-4">
                        <button className="btn-primary" onClick={handleUpload} disabled={!file}>Upload</button>
                        <button className="btn-light" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    // Confirmation modal for Submit Attachments
    function AttachmentConfirmModal({ claim, onClose, onOk }: { claim: Claim, onClose: () => void, onOk: () => void }) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4 text-center">Are you sure you want to manually submit the claim attachments?</h3>
                    <div className="flex gap-2 mt-4 justify-center">
                        <button className="btn-light" onClick={onClose}>Cancel</button>
                        <button className="btn-primary" onClick={onOk}>OK</button>
                    </div>
                </div>
            </div>
        );
    }
    

    
    // Patient Deposit logic
    async function addPatientDeposit() {
        if (!depositAmount || !depositMethod || !depositFromPatientId) return;
        try {
            const res = await fetchWithAuth(`${API}/deposit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(depositAmount),
                    method: depositMethod,
                    description: depositDesc,
                    fromPatientId: depositFromPatientId
                }),
            });
            const body = await res.json();
            if (!body?.success) {
                alert(body?.message || "Failed to add deposit");
                return;
            }
            // Update account credit after deposit
            setAccountCredit({ balance: body.data?.balance ?? 0 });
            // Optionally reset deposit modal state
            setDepositAmount("");
            setDepositDesc("");
            setShowDepositType(null);
        } catch (err) {
            alert("Error: " + (err as Error).message);
        }
    }

    // Courtesy Credit logic
    async function addCourtesyCredit() {
        if (!selectedInvoiceId) {
            alert("Please select an invoice from the Invoice tab first");
            return;
        }
        if (!depositAmount || Number(depositAmount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        try {
            const res = await fetchWithAuth(`${API}/invoices/${selectedInvoiceId}/courtesy-credit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adjustmentType: courtesyType,
                    amount: Number(depositAmount),
                    description: depositDesc
                }),
            });
            const body = await res.json();
            if (!body?.success) {
                alert(body?.message || "Failed to add courtesy credit");
                return;
            }
            // Reload all invoice data to show the courtesy credit transaction
            await loadAll();
            // Reset modal state
            setDepositAmount("");
            setDepositDesc("");
            setCourtesyType("Un-Collected");
            setShowDepositType(null);
            alert("Courtesy credit added successfully");
        } catch (err) {
            alert("Error: " + (err as Error).message);
        }
    }
    // Transfer INS balance to PT balance
    async function transferOutstandingToPatient(invoiceId: number, amount: number) {
        try {
            const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/transfer-outstanding-to-patient`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            if (!data?.success) {
                alert(data?.message || "Transfer to patient failed");
                return;
            }
            // Success: reload invoice and balances
            await loadAll();
            // Optionally show success message
            // alert("Transfer to patient successful");
            return data;
        } catch (err) {
            alert("Error: " + (err as Error).message);
        }
    }

    // Transfer PT balance to INS balance
    async function transferOutstandingToInsurance(invoiceId: number, amount: number) {
        try {
            const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/transfer-outstanding-to-insurance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            if (!data?.success) {
                alert(data?.message || "Transfer to insurance failed");
                return;
            }
            // Success: reload invoice and balances
            await loadAll();
            // Optionally show success message
            // alert("Transfer to insurance successful");
            return data;
        } catch (err) {
            alert("Error: " + (err as Error).message);
        }
    }
    // Edit modals for insurance and patient payments
    const [editInsuranceModal, setEditInsuranceModal] = useState<{invoiceId: number, remit: InsuranceRemitLine} | null>(null);
    const [editPatientModal, setEditPatientModal] = useState<{invoiceId: number, payment: PatientPayment} | null>(null);
    const [editCourtesyModal, setEditCourtesyModal] = useState<{invoiceId: number, courtesy: CourtesyCredit} | null>(null);
    // Notes state
    const [currentNotes, setCurrentNotes] = useState<Note[]>([]);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [notesText, setNotesText] = useState<string>("");
    const [showNotesFor, setShowNotesFor] = useState<{ invoiceId: number; anchor: HTMLElement | null } | null>(null); // Updated to use invoiceId directly
    // Dropdown data
    const [providers, setProviders] = useState<Provider[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([]);

    // Preview modal state
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    // Fetch providers and patients for dropdowns
    useEffect(() => {
        fetchWithAuth("/api/providers")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.success && Array.isArray(data.data)) {
                    setProviders(data.data.map((p: any) => ({ id: p.id, name: (p.identification?.firstName || '') + ' ' + (p.identification?.lastName || '') })));
                }
            });
        fetchWithAuth("/api/patients")
            .then((res) => res.json())
            .then((data) => {
                if (data && data.success && Array.isArray(data.data)) {
                    setPatients(data.data.map((p: any) => ({ id: p.id, name: (p.firstName || '') + ' ' + (p.lastName || '') })));
                }
            });
    }, []);
    // =====================
    // Insurance Payment Actions
    // =====================
    async function editInsuranceRemitLine(invoiceId: number, remitId: number, body: Partial<InsuranceRemitLine>) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/insurance-payments/${remitId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to edit insurance payment");
        await loadAll();
    }

    async function voidInsurancePayment(invoiceId: number, remitId: number, reason?: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/insurance-payments/${remitId}/void`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: reason ? JSON.stringify({ reason }) : undefined,
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to void insurance payment");
        await loadAll();
    }

    async function refundInsurancePayment(invoiceId: number, remitId: number, amount: number, reason: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/insurance-payments/${remitId}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, reason }),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to refund insurance payment");
        await loadAll();
    }

    async function transferInsuranceCreditToPatient(invoiceId: number, remitId: number, amount: number, note: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/insurance-payments/${remitId}/transfer-credit-to-patient`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, note }),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to transfer insurance credit");
        await loadAll();
    }

    // =====================
    // Patient Payment Actions
    // =====================
    async function editPatientPayment(invoiceId: number, paymentId: number, body: Partial<PatientPayment>) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/patient-payments/${paymentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to edit patient payment");
        await loadAll();
    }

    async function voidPatientPayment(invoiceId: number, paymentId: number, reason?: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/patient-payments/${paymentId}/void`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: reason ? JSON.stringify({ reason }) : undefined,
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to void patient payment");
        await loadAll();
    }

    async function refundPatientPayment(invoiceId: number, paymentId: number, amount: number, reason: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/patient-payments/${paymentId}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, reason }),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to refund patient payment");
        await loadAll();
    }

    async function transferPatientCreditToPatient(fromPatientId: number, toPatientId: number, amount: number, note: string) {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patient-billing/patients/${fromPatientId}/transfer-credit/${toPatientId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, note }),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to transfer patient credit");
        await loadAll();
    }

    // =====================
    // Courtesy Credit Actions
    // =====================
    async function updateCourtesyCredit(invoiceId: number, body: { adjustmentType: string; amount: number; description?: string }) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/courtesy-credit`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const resBody = await res.json();
        if (!resBody?.success) throw new Error(resBody?.message || "Failed to update courtesy credit");
        await loadAll();
    }

    async function removeCourtesyCredit(invoiceId: number, reason?: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/courtesy-credit`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: reason || "Courtesy credit removed" }),
        });
        const resBody = await res.json();
        if (!resBody?.success) throw new Error(resBody?.message || "Failed to remove courtesy credit");
        await loadAll();
    }

    // =====================
    // Edit Invoice Action
    // =====================
    async function updateInvoice(invoiceId: number, body: { code: string; description: string; provider: string; dos: string; rate: number }) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || "Failed to update invoice");
        await loadAll();
    }

    // =====================
    // Notes Actions
    // =====================
    async function fetchNotes(invoiceId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/notes`);
        const data = await res.json();
        if (data?.success) {
            setCurrentNotes(data.data || []);
        } else {
            setCurrentNotes([]);
        }
    }

    async function createNote(invoiceId: number, text: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data?.success) {
            await fetchNotes(invoiceId); // Refresh list
            setNotesText(""); // Clear textarea
        } else {
            throw new Error(data?.message || "Failed to create note");
        }
    }

    async function updateNote(invoiceId: number, noteId: number, text: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/notes/${noteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data?.success) {
            await fetchNotes(invoiceId); // Refresh list
            setEditingNote(null);
            setNotesText(""); // Clear textarea
        } else {
            throw new Error(data?.message || "Failed to update note");
        }
    }

    async function deleteNote(invoiceId: number, noteId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/notes/${noteId}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (data?.success) {
            await fetchNotes(invoiceId); // Refresh list
        } else {
            throw new Error(data?.message || "Failed to delete note");
        }
    }

    const handleOpenNotes = async (invoiceId: number, e?: React.MouseEvent) => {
        setShowNotesFor({ invoiceId, anchor: e?.currentTarget as HTMLElement || null });
        setEditingNote(null);
        setNotesText("");
        await fetchNotes(invoiceId);
    };

    const handleCloseNotes = () => {
        setShowNotesFor(null);
        setCurrentNotes([]);
        setEditingNote(null);
        setNotesText("");
    };

    const handleSaveNote = async () => {
        if (!showNotesFor) return;
        if (editingNote) {
            await updateNote(showNotesFor.invoiceId, editingNote.id, notesText.trim());
        } else {
            if (notesText.trim()) {
                await createNote(showNotesFor.invoiceId, notesText.trim());
            }
        }
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNotesText(note.text);
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!showNotesFor) return;
        if (confirm("Are you sure you want to delete this note?")) {
            await deleteNote(showNotesFor.invoiceId, noteId);
        }
    };

    // Notes Popover/Modal - Enhanced to use portal, anchor to row, and smooth input
  
    // Notes Modal - Rendered as fixed overlay, no anchor, smooth controlled textarea
    const NotesModal = ({ open, invoiceId, onClose, notes, editingNote, notesText, onNotesChange, onSave, onEdit, onDelete }: {
        open: boolean;
        invoiceId: number;
        onClose: () => void;
        notes: Note[];
        editingNote: Note | null;
        notesText: string;
        onNotesChange: (v: string) => void;
        onSave: () => void;
        onEdit: (note: Note) => void;
        onDelete: (noteId: number) => void;
    }) => {
        if (!open) return null;
        return (
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.15)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }} onClick={onClose}>
                <div style={{ background: "#fff", borderRadius: 8, minWidth: 340, maxWidth: 400, padding: 20, boxShadow: "0 2px 16px #0002" }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Notes for Invoice #{invoiceId}</div>
                    <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 8 }}>
                        {notes.length === 0 && <div style={{ color: "#888", fontSize: 13 }}>No notes yet.</div>}
                        {notes.map(note => (
                            <div key={note.id} style={{ borderBottom: "1px solid #eee", padding: "4px 0" }}>
                                <div style={{ fontSize: 13, color: "#333" }}>{note.text}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{note.createdBy || ""} {note.createdAt && (new Date(note.createdAt)).toLocaleString()}</div>
                                <div style={{ marginTop: 2 }}>
                                    <button className="btn-light" style={{ fontSize: 11, marginRight: 4 }} onClick={() => onEdit(note)}>Edit</button>
                                    <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => onDelete(note.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <textarea
                        className="input"
                        style={{ width: "100%", minHeight: 60, marginBottom: 8, resize: "vertical" }}
                        placeholder={editingNote ? "Edit note..." : "Enter new note..."}
                        value={notesText}
                        onChange={e => onNotesChange(e.target.value)}
                        autoFocus
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button className="btn-light" onClick={onClose}>Cancel</button>
                        <button className="btn-primary" onClick={onSave} disabled={!notesText.trim()}>{editingNote ? "Update" : "Save"}</button>
                    </div>
                </div>
            </div>
        );
    };

    if (!Number.isFinite(Number(patientId))) {
        return (
            <div className="p-6">
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
                    Unable to load billing: invalid patient id.
                </div>
            </div>
        );
    }

    const API = `${process.env.NEXT_PUBLIC_API_URL}/api/patient-billing/${patientId}`;

    const [tab, setTab] = useState<"INVOICE" | "CLAIM" | "INS" | "PATIENT" | "DEPOSIT">("INVOICE");

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [claims, setClaims] = useState<Record<number, Claim>>({});
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    const selectedInvoice =
        invoices.find((x) => x.id === selectedInvoiceId) ?? (invoices.length ? invoices[0] : undefined);
    const selectedClaim = selectedInvoice ? claims[selectedInvoice.id] : undefined;

    // Pre-fetched payment summaries per invoice
    const [insPayMap, setInsPayMap] = useState<Record<number, InsuranceRemitLine[]>>({});
    const [ptPayMap, setPtPayMap] = useState<Record<number, any[]>>({});
    const [courtesyCreditsMap, setCourtesyCreditsMap] = useState<Record<number, CourtesyCredit[]>>({});

    // Patient payment allocations
    const [payMethod, setPayMethod] = useState<PaymentMethod>("CREDIT_CARD");
    const [allocs, setAllocs] = useState<PatientPaymentAllocation[]>([]);
    useEffect(() => {
        if (!selectedInvoice) return;
        setAllocs(
            selectedInvoice.lines.map((l) => ({
                invoiceLineId: l.id,
                amount: Number(l.patientPortion ?? 0),
            }))
        );
    }, [selectedInvoice?.id, selectedInvoice?.lines]);

    // --- Calculate PT PAID and INS PAID for summary bar ---
    // Use ptPayMap and insPayMap if invoice-level values are missing or zero
    const invoicePtPaid = useMemo(() => {
        if (!selectedInvoice) return 0;
        if (Number(selectedInvoice.ptPaid) > 0) return Number(selectedInvoice.ptPaid);
        const pp = ptPayMap[selectedInvoice.id] ?? [];
        return sum(pp.map((p: any) => Number(p.amount ?? p.payment ?? p.paid ?? 0)));
    }, [selectedInvoice, ptPayMap]);

    const invoiceInsPaid = useMemo(() => {
        if (!selectedInvoice) return 0;
        if (Number(selectedInvoice.insPaid) > 0) return Number(selectedInvoice.insPaid);
        const ip = insPayMap[selectedInvoice.id] ?? [];
        return sum(ip.map((r: any) => Number(r.insPay ?? 0)));
    }, [selectedInvoice, insPayMap]);

    const [accountCredit, setAccountCredit] = useState<AccountCredit>({ balance: 0 });

    // Insurance remit state – per selected invoice
    const [remits, setRemits] = useState<InsuranceRemitLine[]>([]);
    useEffect(() => {
        if (!selectedInvoice) return;
        setRemits(
            selectedInvoice.lines.map((l) => ({
                id: l.id, // Add id property as required by InsuranceRemitLine
                invoiceLineId: l.id,
                submitted: Number(l.charge ?? 0),
                balance: 0,
                deductible: 0,
                allowed: Number(l.allowed ?? l.charge ?? 0),
                insWriteOff: 0,
                insPay: Number(l.charge ?? 0),
            }))
        );
    }, [selectedInvoice?.id]); // eslint-disable-line

    // Removed duplicate declarations of insPayMap, ptPayMap, payMethod, allocs, and their useEffect

    /* -------- Derived ---------- */
    const patientOwing = useMemo(
        () =>
            selectedInvoice
                ? selectedInvoice.lines.reduce((a, l) => a + Number(l.patientPortion ?? 0), 0)
                : 0,
        [selectedInvoice]
    );

    const isClosed = useMemo(
        () =>
            selectedInvoice?.status === "PAID" &&
            Number(selectedInvoice?.ptBalance ?? 0) === 0 &&
            Number(selectedInvoice?.insBalance ?? 0) === 0,
        [selectedInvoice?.status, selectedInvoice?.ptBalance, selectedInvoice?.insBalance]
    );

    const outstanding = useMemo(
        () => (isClosed ? 0 : Number(selectedInvoice?.ptBalance ?? patientOwing)),
        [isClosed, selectedInvoice?.ptBalance, patientOwing]
    );

    const entered = useMemo(
        () => allocs.reduce((a, r) => a + Number(r.amount || 0), 0),
        [allocs]
    );
    const overpay = Math.max(0, entered - outstanding);

    /* -------- UI modals / popovers ---------- */
    const [transferOpenFor, setTransferOpenFor] = useState<number | null>(null);
    const [showEditLinesFor, setShowEditLinesFor] = useState<number | null>(null);
    const [showAdjustmentFor, setShowAdjustmentFor] = useState<number | null>(null);
    const [showAddProcedure, setShowAddProcedure] = useState(false);
    const [showClaimEditFor, setShowClaimEditFor] = useState<number | null>(null);
    const [showVoidFor, setShowVoidFor] = useState<number | null>(null);
    const [showClaimComposeFor, setShowClaimComposeFor] = useState<number | null>(null);
    const [cheque, setCheque] = useState({ number: "", bankBranch: "" });

    const [showAttachmentFor, setShowAttachmentFor] = useState<number | null>(null);
    const [showEobFor, setShowEobFor] = useState<number | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [eobFile, setEobFile] = useState<File | null>(null);

    const [showDepositType, setShowDepositType] = useState<"PATIENT" | "INSURANCE" | "COURTESY" | null>(null);

    // New modals for update
    const [showBackdateFor, setShowBackdateFor] = useState<number | null>(null);
    const [showAccountAdjustmentFor, setShowAccountAdjustmentFor] = useState<number | null>(null);
    const [showAdjustmentInvoiceFor, setShowAdjustmentInvoiceFor] = useState<number | null>(null);
    const [showInsuranceWriteOffFor, setShowInsuranceWriteOffFor] = useState<number | null>(null);
    const [showMembershipAdjustmentFor, setShowMembershipAdjustmentFor] = useState<number | null>(null);

    /* =========================================================
       Load data (invoices, credit + payment GETs)
    ========================================================== */
    const mapServerInvoice = (raw: any): Invoice => ({
        id: raw.id,
        patientId: raw.patientId,
        status: raw.status,
        insWO: raw.insWO,
        ptBalance: raw.ptBalance,
        insBalance: raw.insBalance,
        totalCharge: raw.totalCharge,
        insPaid: raw.insPaid ?? 0,
        ptPaid: raw.ptPaid ?? 0,
        lines: (raw.lines || []).map((l: any) => ({
            id: l.id,
            dos: Array.isArray(l.dos)
                ? `${l.dos[0]}-${String(l.dos[1]).padStart(2, "0")}-${String(l.dos[2]).padStart(2, "0")}`
                : l.dos,
            code: l.code,
            treatment: l.treatment,
            provider: l.provider,
            charge: l.charge,
            allowed: l.allowed,
            insWriteOff: l.insWriteOff,
            insPortion: l.insPortion,
            patientPortion: l.patientPortion,
        })),
    });

    const mapServerClaim = (raw: any): Claim => ({
        id: raw.id,
        invoiceId: raw.invoiceId,
        patientId: raw.patientId,
        payerName: raw.payerName ?? null,
        treatingProviderId: raw.treatingProviderId ?? null,
        provider: raw.provider ?? null,
        billingEntity: raw.billingEntity ?? null,
        policyNumber: raw.policyNumber ?? raw.policynumber ?? null,
        type: (raw.type as Claim["type"]) ?? null,
        notes: raw.notes ?? null,
        status: raw.status,
        attachments: raw.attachments ?? 0,
        eobAttached: !!raw.eobAttached,
        createdOn: Array.isArray(raw.createdOn)
            ? `${raw.createdOn[0]}-${String(raw.createdOn[1]).padStart(2, "0")}-${String(raw.createdOn[2]).padStart(2, "0")}`
            : raw.createdOn ?? null,
    });

    async function loadAll() {
        // invoices
        const invRes = await fetchWithAuth(`${API}/invoices`);
        const invBody = await invRes.json();
        let invs: Invoice[] = [];
        if (invBody?.success) {
            invs = (invBody.data || []).map(mapServerInvoice);
            setInvoices(invs);
            setSelectedInvoiceId((s) => s ?? (invs[0]?.id ?? null));
        }

        // claims
        try {
            const clRes = await fetchWithAuth(`${API}/claims`);
            const clBody = await clRes.json();
            if (clBody?.success && Array.isArray(clBody.data)) {
                const claimMap = (clBody.data as any[]).reduce((acc, raw) => {
                    const c = mapServerClaim(raw);
                    if (!acc[c.invoiceId]) acc[c.invoiceId] = c;
                    return acc;
                }, {} as Record<number, Claim>);
                setClaims(claimMap);
            }
        } catch {}

        // insurance & patient payments & courtesy credits per invoice
        try {
            const all = await Promise.all(
                invs.map(async (inv) => {
                    const [insRes, ptRes, ccRes] = await Promise.all([
                        fetchWithAuth(`${API}/invoices/${inv.id}/insurance-payments`),
                        fetchWithAuth(`${API}/invoices/${inv.id}/patient-payments`),
                        fetchWithAuth(`${API}/invoices/${inv.id}/courtesy-credit`),
                    ]);
                    const [insJ, ptJ, ccJ] = await Promise.all([insRes.json(), ptRes.json(), ccRes.json()]);
                    return {
                        id: inv.id,
                        ins: Array.isArray(insJ?.data) ? (insJ.data as InsuranceRemitLine[]) : [],
                        pt: Array.isArray(ptJ?.data) ? (ptJ.data as any[]) : [],
                        cc: ccJ?.success && ccJ?.data ? [ccJ.data as CourtesyCredit] : [],
                    };
                })
            );
            const nextIns: Record<number, InsuranceRemitLine[]> = {};
            const nextPt: Record<number, any[]> = {};
            const nextCc: Record<number, CourtesyCredit[]> = {};
            all.forEach(({ id, ins, pt, cc }) => {
                nextIns[id] = ins;
                nextPt[id] = pt;
                nextCc[id] = cc;
            });
            setInsPayMap(nextIns);
            setPtPayMap(nextPt);
            setCourtesyCreditsMap(nextCc);
        } catch {}

        // account credit
        try {
            const crRes = await fetchWithAuth(`${API}/account-credit`);
            const crBody = await crRes.json();
            if (crBody?.success && crBody.data) setAccountCredit({ balance: crBody.data.balance ?? 0 });
        } catch {}
    }

    async function loadDropdowns() {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const [provRes, patRes, insRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/api/providers`),
                fetchWithAuth(`${API_URL}/api/patients`),
                fetchWithAuth(`${API_URL}/api/insurance-companies`)
            ]);
            const provData = await provRes.json();
            const patData = await patRes.json();
            const insData = await insRes.json();

            // Providers: expect data.data to be an array
            setProviders(
                provData.success && Array.isArray(provData.data)
                    ? provData.data.map((p: any) => ({
                        id: p.id,
                        name: `${p.identification?.firstName ?? ""} ${p.identification?.lastName ?? ""}`.trim()
                    }))
                    : []
            );
            // Patients: expect data.data.content to be an array (paginated)
            setPatients(
                patData.success && patData.data && Array.isArray(patData.data.content)
                    ? patData.data.content.map((p: any) => ({
                        id: p.id,
                        name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
                    }))
                    : []
            );
            setInsuranceCompanies(
                insData.success && Array.isArray(insData.data)
                    ? insData.data.map((i: any) => ({
                        id: i.id,
                        name: i.name
                    }))
                    : []
            );
        } catch (error) {
            setProviders([]); setPatients([]); setInsuranceCompanies([]);
        }
    }

    useEffect(() => {
        void loadAll();
        void loadDropdowns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    /* =========================================================
       Actions → Backend
    ========================================================== */
    // Backdate invoice
    async function backdateInvoice(invoiceId: number, date: string) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/backdate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date }),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to backdate invoice");
        const inv = mapServerInvoice(body.data);
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    }

    // Invoice adjustment (flat/percent)
    async function adjustInvoice(invoiceId: number, payload: { adjustmentType: string; discountPercent?: number; description?: string; }) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/adjust`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to adjust invoice");
        const inv = mapServerInvoice(body.data);
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    }

    // Account adjustment
    async function accountAdjustment(payload: { adjustmentType: string; flatRate?: number; specificAmount?: number; description?: string; includeCourtesyCredit?: boolean; }) {
        const res = await fetchWithAuth(`${API}/account-adjustment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to adjust account");
        setAccountCredit({ balance: body.data?.balance ?? 0 });
    }
    async function createInvoiceFromProcedure(p: {
        dos: string;
        code: string;
        treatment: string;
        provider: string;
        rate: number;
    }) {
        const res = await fetchWithAuth(`${API}/invoices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: p.code,
                description: p.treatment,
                provider: p.provider,
                dos: p.dos,
                rate: p.rate,
            }),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to create invoice");
        const inv = mapServerInvoice(body.data);
        setInvoices((arr) => [inv, ...arr]);
        setSelectedInvoiceId(inv.id);
    }

    async function reestimateLine(invoiceId: number, lineId: number, newCharge: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/lines/${lineId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newCharge }),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to update line");
        const inv = mapServerInvoice(body.data);
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    }

    async function promoteClaim(invoiceId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/claim/promote`, { method: "POST" });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to promote claim");
        const claim = mapServerClaim(body.data);
        setClaims((m) => ({ ...m, [invoiceId]: claim }));
    }

    async function sendToBatch(invoiceId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/claim/send-to-batch`, {
            method: "POST",
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to move claim to batch");
        const claim = mapServerClaim(body.data);
        setClaims((m) => ({ ...m, [invoiceId]: claim }));
        setShowClaimComposeFor(null);
    }

    async function submitClaim(invoiceId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/claim/submit`, { method: "POST" });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to submit claim");
        const claim = mapServerClaim(body.data);
        setClaims((m) => ({ ...m, [invoiceId]: claim }));
    }

    async function closeClaim(invoiceId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/claim/close`, { method: "POST" });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to close claim");
        const claim = mapServerClaim(body.data);
        setClaims((m) => ({ ...m, [invoiceId]: claim }));
    }

    async function voidAndRecreateClaim(invoiceId: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/claim/void-recreate`, { method: "POST" });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to void/recreate claim");
        const claim = mapServerClaim(body.data);
        setClaims((m) => ({ ...m, [invoiceId]: claim }));
        setShowVoidFor(null);
    }

    async function updateClaim(invoiceId: number, payload: Partial<Claim> & Record<string, any>) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/claim`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to update claim");
        const claim = mapServerClaim(body.data);
        setClaims((m) => ({ ...m, [invoiceId]: claim }));
    }

    async function applyInsurancePayment() {
        if (!selectedInvoice) return;
        const payload = {
            chequeNumber: cheque.number || "000000000",
            bankBranch: cheque.bankBranch || "000",
            lines: remits.map((r) => ({
                invoiceLineId: r.invoiceLineId,
                submitted: Number(r.submitted || 0),
                balance: Number(r.balance || 0),
                deductible: Number(r.deductible || 0),
                allowed: Number(r.allowed || 0),
                insWriteOff: Number(r.insWriteOff || 0),
                insPay: Number(r.insPay || 0),
                updateAllowed: !!r.updateAllowed,
                updateFlatPortion: !!r.updateFlatPortion,
                applyWriteoff: !!r.applyWriteoff,
            })),
        };
        const res = await fetchWithAuth(`${API}/invoices/${selectedInvoice.id}/insurance-payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to apply insurance payment");
        const inv = mapServerInvoice(body.data);
        setInvoices((list) => list.map((x) => (x.id === inv.id ? inv : x)));


        setAllocs(inv.lines.map((l) => ({ invoiceLineId: l.id, amount: Number(l.patientPortion ?? 0) })));
        setSelectedInvoiceId(inv.id);
        setTab("PATIENT");
    }

    async function applyPatientPayment() {
        if (!selectedInvoice) return;
        const res = await fetchWithAuth(`${API}/invoices/${selectedInvoice.id}/patient-payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paymentMethod: payMethod,
                allocations: allocs.map((a) => ({ ...a, amount: Number(a.amount || 0) })),
            }),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to apply patient payment");
        const inv = mapServerInvoice(body.data);
        setInvoices((list) => list.map((x) => (x.id === inv.id ? inv : x)));


        // refresh allocations & credit
        setAllocs(inv.lines.map((l) => ({ invoiceLineId: l.id, amount: Number(l.patientPortion ?? 0) })));
        try {
            const crRes = await fetchWithAuth(`${API}/account-credit`);
            const crBody = await crRes.json();
            if (crBody?.success && crBody.data) setAccountCredit({ balance: crBody.data.balance ?? 0 });
        } catch {}
    }

    async function applyPercentAdjustment(invoiceId: number, percent: number) {
        const res = await fetchWithAuth(`${API}/invoices/${invoiceId}/adjustment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ percent }),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to adjust invoice");
        const inv = mapServerInvoice(body.data);
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    }

    async function applyAccountCredit(amount: number) {
        const res = await fetchWithAuth(`${API}/account-credit/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
        });
        const body = await res.json();
        if (!body?.success) throw new Error(body?.message || "Failed to apply credit");
        setAccountCredit({ balance: body.data?.balance ?? 0 });
    }

    // Payment methods for deposit modals
    const paymentMethods = [
        { value: "CREDIT_CARD", label: "Credit Card" },
        { value: "CHECK", label: "Check" },
        { value: "DEBIT_CARD", label: "Debit Card" },
        { value: "EFT", label: "EFT" },
        { value: "CASH", label: "Cash" },
        { value: "CARE_CREDIT", label: "Care Credit" },
        { value: "MASTERCARD", label: "Master Card" },
        { value: "VISA", label: "Visa" },
        { value: "DISCOVER", label: "Discover" },
        { value: "AMEX", label: "Amex" },
    ];

    // Deposit modal state variables (enhanced)
    const [depositMethod, setDepositMethod] = useState<string>("CREDIT_CARD");
    const [depositFromPatientId, setDepositFromPatientId] = useState<number | null>(null); // For insurance/patient deposit
    const [depositToProviderId, setDepositToProviderId] = useState<number | null>(null); // For insurance deposit
    const [depositPolicyId, setDepositPolicyId] = useState<number | null>(null); // For insurance policy
    const [depositAmount, setDepositAmount] = useState<string>("");
    const [depositDesc, setDepositDesc] = useState<string>("");
    const [courtesyType, setCourtesyType] = useState<string>("Un-Collected");
    const courtesyTypes = [
        "Un-Collected",
        "Professional Courtesy",
        "Migrated",
        "MembershipPlan"
    ];

    return (
        <div className="p-6 space-y-6">
            <StyleInjector />

            {/* Top summary cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border p-4">
                    <div className="text-sm text-gray-500">Patient</div>
                    <div className="text-xl font-semibold">{patientName || "Patient"}</div>
                </div>
                <div className="rounded-xl border p-4">
                    <div className="text-sm text-gray-500">Invoices</div>
                    <div className="text-xl font-semibold">{invoices.length}</div>
                </div>
                <div className="rounded-xl border p-4">
                    <div className="text-sm text-gray-500">Claims</div>
                    <div className="text-xl font-semibold">
                        {Object.values(claims).filter(Boolean).length}
                    </div>
                </div>
                <div className="rounded-xl border p-4">
                    <div className="text-sm text-gray-500">Account Credit</div>
                    <div className="text-xl font-semibold">{currency(Number(accountCredit.balance ?? 0))}</div>
                </div>
            </div>

            {/* Primary actions */}
            <div className="flex flex-wrap items-center gap-2">
                <button className="btn-primary" onClick={() => setShowAddProcedure(true)}>
                    + Add Procedure
                </button>
                <select
                    className="input"
                    value={selectedInvoice?.id ?? ""}
                    onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
                >
                    {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                            Select Invoice #{inv.id}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            {/* Tabs with Deposit */}
            <SegmentedTabs
                tabs={[
                    { id: "INVOICE", label: "Invoice(s)" },
                    { id: "CLAIM", label: "Claim (selected)" },
                    { id: "INS", label: "Insurance Payment" },
                    { id: "PATIENT", label: "Patient Payment" },
                    { id: "DEPOSIT", label: "Deposit" },
                ]}
                value={tab}
                onChange={(id) => { setTab(id as any); setShowDepositType(null); }}
            />
            {/* Deposit Tab Implementation */}
            {tab === "DEPOSIT" && (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <button className="btn-light" onClick={() => { setShowDepositType("PATIENT"); }}>Add Patient Deposit</button>
                        <button className="btn-light" onClick={() => { setShowDepositType("INSURANCE"); }}>Add Insurance Deposit</button>
                        <button className="btn-light" onClick={() => { setShowDepositType("COURTESY"); }}>Add Courtesy Credit</button>
                    </div>

                    {/* Patient Deposit Modal */}
                    {showDepositType === "PATIENT" && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                                <div className="font-semibold text-lg mb-2">Patient Deposit</div>
                                <div className="text-sm text-gray-500 mb-4">{new Date().toLocaleDateString()} Deposit #XXXXX from {patientName}</div>
                                <div className="mb-3">
                                    <label className="label">Select Patient</label>
                                    <select className="input w-full" value={depositFromPatientId ?? ''} onChange={e => setDepositFromPatientId(Number(e.target.value) || null)}>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Deposit Amount:</label>
                                    <input className="input w-full" type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label className="label">Payment Method:</label>
                                    <select className="input w-full" value={depositMethod} onChange={e => setDepositMethod(e.target.value)}>
                                        {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Add description</label>
                                    <input className="input w-full" value={depositDesc} onChange={e => setDepositDesc(e.target.value)} />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button className="btn-primary" onClick={addPatientDeposit}>Add Deposit</button>
                                    <button className="btn-light" onClick={() => setShowDepositType(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Insurance Deposit Modal */}
                    {showDepositType === "INSURANCE" && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                                <div className="font-semibold text-lg mb-2">Insurance Deposit</div>
                                <div className="text-sm text-gray-500 mb-2">{new Date().toLocaleDateString()} Deposit #XXXXX</div>
                                <div className="mb-3">
                                    <label className="label">Select Patient</label>
                                    <select className="input w-full" value={depositFromPatientId ?? ''} onChange={e => setDepositFromPatientId(Number(e.target.value) || null)}>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Payment Method</label>
                                    <select className="input w-full" value={depositMethod} onChange={e => setDepositMethod(e.target.value)}>
                                        {paymentMethods.map(pm => (
                                            <option key={pm.value} value={pm.value}>{pm.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Select Policy</label>
                                    <select className="input w-full" value={depositPolicyId ?? ''} onChange={e => setDepositPolicyId(Number(e.target.value) || null)}>
                                        <option value="">Select Policy</option>
                                        {insuranceCompanies.map(ic => (
                                            <option key={ic.id} value={ic.id}>{ic.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Deposit Amount</label>
                                    <input className="input w-full" type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label className="label">Select Provider</label>
                                    <select className="input w-full" value={depositToProviderId ?? ''} onChange={e => setDepositToProviderId(Number(e.target.value) || null)}>
                                        <option value="">Select Provider</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Add description</label>
                                    <input className="input w-full" value={depositDesc} onChange={e => setDepositDesc(e.target.value)} />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button className="btn-primary" onClick={() => { /* handle add deposit */ }}>Add Deposit</button>
                                    <button className="btn-light" onClick={() => setShowDepositType(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Courtesy Credit Modal */}
                    {showDepositType === "COURTESY" && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                                <div className="font-semibold text-lg mb-2">Courtesy Credit</div>
                                <div className="text-sm text-gray-500 mb-2">{new Date().toLocaleDateString()}</div>
                                {selectedInvoiceId ? (
                                    <div className="text-sm text-blue-600 font-medium mb-2">For Invoice #{selectedInvoiceId} - Remaining Patient Balance: {currency(Number(selectedInvoice?.ptBalance ?? 0))}</div>
                                ) : (
                                    <div className="text-sm text-red-600 font-medium mb-2">⚠️ Please select an invoice from the Invoice tab first</div>
                                )}
                                <div className="mb-2">
                                    <label className="label">Adjustment Type</label>
                                    <select className="input w-full" value={courtesyType} onChange={e => setCourtesyType(e.target.value)}>
                                        {courtesyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="label">Courtesy Credit Amount:</label>
                                    <input className="input w-full" type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label className="label">Add description</label>
                                    <input className="input w-full" value={depositDesc} onChange={e => setDepositDesc(e.target.value)} />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button 
                                        className="btn-primary" 
                                        onClick={addCourtesyCredit}
                                        disabled={!selectedInvoiceId || !depositAmount || Number(depositAmount) <= 0}
                                        style={!selectedInvoiceId || !depositAmount || Number(depositAmount) <= 0 ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
                                    >
                                        Add Courtesy
                                    </button>
                                    <button className="btn-light" onClick={() => setShowDepositType(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= INVOICE LIST ================= */}
            {tab === "INVOICE" && (
                <div className="space-y-4">
                    {selectedInvoiceId === null ? (
                        invoices.map((inv) => {
                            const first = inv.lines[0];
                            const claim = claims[inv.id];
                            const effectiveStatus: InvoiceStatus =
                                (inv.status === "PAID" && Number(inv.ptBalance ?? 0) === 0 && Number(inv.insBalance ?? 0) === 0 ? "PAID" : inv.status);
                            const rowTone =
                                effectiveStatus === "OPEN"
                                    ? "bg-red-50"
                                    : effectiveStatus === "PARTIALLY_PAID"
                                        ? "bg-amber-50"
                                        : (effectiveStatus === "PAID" ? "bg-green-50" : "bg-gray-50");
                            const ip = insPayMap[inv.id] ?? [];
                            const pp = ptPayMap[inv.id] ?? [];
                            const ptPaid = Number(inv.ptPaid) > 0 ? Number(inv.ptPaid) : sum(pp.map((p: any) => Number(p.amount ?? p.payment ?? p.paid ?? 0)));
                            const insPaid = Number(inv.insPaid) > 0 ? Number(inv.insPaid) : sum(ip.map((r: any) => Number(r.insPay ?? 0)));
                            const showInsuranceSummary = ip.length > 0;
                            const showPatientSummary = pp.length > 0;
                            return (
                                <div key={inv.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm cursor-pointer" onClick={() => setSelectedInvoiceId(inv.id)}>
                                    <div className={`flex items-center gap-4 border-b px-3 py-2 text-sm ${rowTone}`}>
                                        <Badge
                                            tone={effectiveStatus === "OPEN" ? "red" : effectiveStatus === "PARTIALLY_PAID" ? "amber" : "green"}
                                        >
                                            INVOICE #{inv.id} ({first?.dos ?? "—"})
                                        </Badge>
                                        <div className="ml-2 grid flex-1 grid-cols-4 gap-3 md:grid-cols-6">
                                            <RowStat label="Pt Balance" value={currency(Number(inv.ptBalance ?? 0))} tone="red" />
                                            <RowStat label="Ins Balance" value={currency(Number(inv.insBalance ?? 0))} />
                                            <RowStat label="Invoice Balance" value={currency(Number(inv.ptBalance ?? 0) + Number(inv.insBalance ?? 0))} bold />
                                            <RowStat label="Ins WO" value={currency(Number(inv.insWO ?? inv.lines.reduce((a, l) => a + Math.max(0, Number(l.charge || 0) - Number(l.allowed || 0)), 0)))} />
                                            <RowStat label="Pt Paid" value={currency(ptPaid)} />
                                            <RowStat label="Ins Paid" value={currency(insPaid)} />
                                        </div>
                                        {/* Four action icons: Backdate, Account Adjustment, Adjustment Invoice, Statement */}
                                        <div className="ml-auto flex items-center gap-2">
                                            <IconBtn title="Backdate Invoice" onClick={() => setShowBackdateFor(inv.id)}>
                                                <span role="img" aria-label="backdate">📅</span>
                                            </IconBtn>
                                            <IconBtn title="Account Adjustment" onClick={() => setShowAccountAdjustmentFor(inv.id)}>
                                                <span role="img" aria-label="account-adjustment">💲</span>
                                            </IconBtn>
                                            <IconBtn title="Adjustment Invoice" onClick={() => setShowAdjustmentInvoiceFor(inv.id)}>
                                                <span role="img" aria-label="adjustment-invoice">📝</span>
                                            </IconBtn>
                                            <IconBtn title="Statement" onClick={() => alert(`Statement for Invoice #${inv.id}`)}>
                                                <span role="img" aria-label="statement">📄</span>
                                            </IconBtn>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        (() => {
                            const inv = invoices.find(i => i.id === selectedInvoiceId);
                            if (!inv) return null;
                            const first = inv.lines[0];
                            const claim = claims[inv.id];
                            const effectiveStatus: InvoiceStatus =
                                (inv.status === "PAID" && Number(inv.ptBalance ?? 0) === 0 && Number(inv.insBalance ?? 0) === 0 ? "PAID" : inv.status);
                            const rowTone =
                                effectiveStatus === "OPEN"
                                    ? "bg-red-50"
                                    : effectiveStatus === "PARTIALLY_PAID"
                                        ? "bg-amber-50"
                                        : (effectiveStatus === "PAID" ? "bg-green-50" : "bg-gray-50");
                            const ip = insPayMap[inv.id] ?? [];
                            const pp = ptPayMap[inv.id] ?? [];
                            const ptPaid = Number(inv.ptPaid) > 0 ? Number(inv.ptPaid) : sum(pp.map((p: any) => Number(p.amount ?? p.payment ?? p.paid ?? 0)));
                            const insPaid = Number(inv.insPaid) > 0 ? Number(inv.insPaid) : sum(ip.map((r: any) => Number(r.insPay ?? 0)));
                            const showInsuranceSummary = ip.length > 0;
                            const showPatientSummary = pp.length > 0;
                            return (
                                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    <div className="flex items-center gap-4 border-b px-3 py-2 text-sm">
                                        <button className="btn-light mr-2" onClick={() => setSelectedInvoiceId(null)}>
                                            ← Back to Invoice List
                                        </button>
                                        <Badge
                                            tone={effectiveStatus === "OPEN" ? "red" : effectiveStatus === "PARTIALLY_PAID" ? "amber" : "green"}
                                        >
                                            INVOICE #{inv.id} ({first?.dos ?? "—"})
                                        </Badge>
                                        <div className="ml-2 grid flex-1 grid-cols-4 gap-3 md:grid-cols-6">
                                            <RowStat label="Pt Balance" value={currency(Number(inv.ptBalance ?? 0))} tone="red" />
                                            <RowStat label="Ins Balance" value={currency(Number(inv.insBalance ?? 0))} />
                                            <RowStat label="Invoice Balance" value={currency(Number(inv.ptBalance ?? 0) + Number(inv.insBalance ?? 0))} bold />
                                            <RowStat label="Ins WO" value={currency(Number(inv.insWO ?? inv.lines.reduce((a, l) => a + Math.max(0, Number(l.charge || 0) - Number(l.allowed || 0)), 0)))} />
                                            <RowStat label="Pt Paid" value={currency(ptPaid)} />
                                            <RowStat label="Ins Paid" value={currency(insPaid)} />
                                        </div>
                                    </div>
                                    {/* Claim summary row (if exists) */}
                                    {claim && claim.status !== "DRAFT" ? (
                                        <div className="flex items-start gap-3 border-b px-3 py-2 text-sm">
                                            <button
                                                className="mr-2 p-1 rounded-full hover:bg-amber-100"
                                                title="View/Add Notes"
                                                onClick={e => handleOpenNotes(inv.id, e)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12s3.694 8.25 8.25 8.25z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                                                </svg>
                                            </button>
                                            <div className="min-w-[100px] text-gray-500">{claim.createdOn || first?.dos}</div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-gray-600">
                                                        <b>Claim #{claim.id}</b> to <b>{claim.payerName ?? "—"}</b>
                                                        {(claim.provider || claim.treatingProviderId) && <span> | Provider: <b>{claim.provider ?? claim.treatingProviderId}</b></span>}
                                                        {claim.policyNumber && <span> | Policy: <b>{claim.policyNumber}</b></span>}
                                                        <span> :</span>
                                                    </span>
                                                    <Badge tone="amber">
                                                        {claim.status === "IN_PROCESS"
                                                            ? "Claim in process"
                                                            : claim.status.replaceAll("_", " ").toLowerCase()}
                                                    </Badge>
                                                    <Badge tone="blue">Status Response (A1): Th…</Badge>
                                                </div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <IconBtn title="Print" onClick={() => window.print()}>🖨️</IconBtn>
                                                <IconBtn title="Edit" onClick={() => setShowClaimEditFor(inv.id)} disabled={claim.locked}>✏️</IconBtn>
                                                <IconBtn title="Close Claim" onClick={() => { void closeClaim(inv.id); }} disabled={claim.locked}>✅</IconBtn>
                                                <IconBtn title="Attachments" onClick={() => setShowAttachmentFor(inv.id)}>📎</IconBtn>
                                                <IconBtn title="Void & Re-Create" onClick={() => setShowVoidFor(inv.id)} disabled={claim.locked}>🗑️</IconBtn>
                                                <IconBtn title="EOB" onClick={() => setShowEobFor(inv.id)}>📄</IconBtn>
                                                <IconBtn title="Submit Claim" onClick={() => { void submitClaim(inv.id); }} disabled={claim.locked}>📤</IconBtn>
                                                {/* More Actions icon next to Submit Claim */}
                                                {renderMoreActions(claim)}
    {/* Add modal for Change Claim Status */}
    {showStatusModal && statusModalClaim && <StatusModal claim={statusModalClaim} onClose={() => setShowStatusModal(false)} />}
    {/* Add modal for Submit Attachments */}
    {showAttachmentConfirm && attachmentClaim && (
        <AttachmentConfirmModal
            claim={attachmentClaim}
            onClose={() => setShowAttachmentConfirm(false)}
            onOk={() => {
                setShowAttachmentConfirm(false);
                setShowAttachmentModal(true);
            }}
        />
    )}
    {showAttachmentModal && attachmentClaim && <AttachmentModal claim={attachmentClaim} onClose={() => setShowAttachmentModal(false)} />}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between border-b px-3 py-2 text-sm">
                                            <div className="text-gray-600">No active claim yet for invoice #{inv.id}.</div>
                                            <div className="flex items-center gap-2">
                                                <button className="btn-light" onClick={() => setShowClaimComposeFor(inv.id)}>
                                                    + Add note/narrative
                                                </button>
                                                <button className="btn-primary" onClick={() => { void promoteClaim(inv.id); }}>
                                                    Create Claim
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* Insurance payment summary (inline, only after insurance paid) */}
                                    {showInsuranceSummary && (
                                        <div className="flex items-start gap-3 border-b px-3 py-2 text-sm bg-blue-50/40">
                                            <button
                                                className="mr-2 p-1 rounded-full hover:bg-blue-100"
                                                title="View/Add Notes"
                                                onClick={e => handleOpenNotes(inv.id, e)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12s3.694 8.25 8.25 8.25z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                                                </svg>
                                            </button>
                                            <div className="min-w-[100px] text-gray-500">Insurance</div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge tone="blue">Submitted {currency(Number(sum(ip.map(r => r.submitted))))}</Badge>
                                                    <Badge tone="gray">Allowed {currency(Number(sum(ip.map(r => r.allowed))))}</Badge>
                                                    <Badge tone="green">Paid {currency(Number(sum(ip.map(r => r.insPay))))}</Badge>
                                                    <Badge tone="purple">Write-off {currency(Number(sum(ip.map(r => r.insWriteOff))))}</Badge>
                                                </div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <IconBtn title="Void Insurance Payment" onClick={() => {
                                                    const remit = ip[0];
                                                    if (remit) void voidInsurancePayment(inv.id, remit.id, "Payer reversal / posted in error");
                                                }}>
                                                    <span role="img" aria-label="void">🚫</span>
                                                </IconBtn>
                                                <IconBtn title="Edit Insurance Payment" onClick={() => {
                                                    const remit = ip[0];
                                                    if (remit) setEditInsuranceModal({ invoiceId: inv.id, remit });
                                                }}>
                                                    <span role="img" aria-label="edit">✏️</span>
                                                </IconBtn>
                                                <IconBtn title="Refund Insurance Payment" onClick={() => {
                                                    const remit = ip[0];
                                                    if (remit) void refundInsurancePayment(inv.id, remit.id, 10, "Overpayment per EOB");
                                                }}>
                                                    <span role="img" aria-label="refund">⋯</span>
                                                </IconBtn>
                                                <IconBtn title="Transfer Credit to Patient" onClick={() => {
                                                    const remit = ip[0];
                                                    if (remit) void transferInsuranceCreditToPatient(inv.id, remit.id, 20, "Move insurance overpay to patient account credit");
                                                }}>
                                                    <span role="img" aria-label="transfer">🔁</span>
                                                </IconBtn>
                                            </div>
                                        </div>
                                    )}
                                    {/* Patient payment summary (inline, only after insurance paid) */}
                                    {showPatientSummary && (
                                        <div className="flex items-start gap-3 border-b px-3 py-2 text-sm bg-purple-50/40">
                                            <button
                                                className="mr-2 p-1 rounded-full hover:bg-purple-100"
                                                title="View/Add Notes"
                                                onClick={e => handleOpenNotes(inv.id, e)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12s3.694 8.25 8.25 8.25z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                                                </svg>
                                            </button>
                                            <div className="min-w-[100px] text-gray-500">Patient</div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge tone="green">Payments {currency(sum(pp.map((p: any) => Number(p.amount ?? p.payment ?? p.paid ?? 0))) )}</Badge>
                                                    <Badge tone="gray">{pp.length} entr{pp.length === 1 ? "y" : "ies"}</Badge>
                                                </div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <IconBtn title="Void Patient Payment" onClick={() => {
                                                    const pay = pp[0];
                                                    if (pay) void voidPatientPayment(inv.id, pay.id, "Duplicate collection at front desk");
                                                }}>
                                                    <span role="img" aria-label="void">🚫</span>
                                                </IconBtn>
                                                <IconBtn title="Edit Patient Payment" onClick={() => {
                                                    const pay = pp[0];
                                                    if (pay) setEditPatientModal({ invoiceId: inv.id, payment: pay });
                                                }}>
                                                    <span role="img" aria-label="edit">✏️</span>
                                                </IconBtn>
                                                <IconBtn title="Refund Patient Payment" onClick={() => {
                                                    const pay = pp[0];
                                                    if (pay) void refundPatientPayment(inv.id, pay.id, 10, "Partial refund");
                                                }}>
                                                    <span role="img" aria-label="refund">⋯</span>
                                                </IconBtn>
                                                <IconBtn title="Transfer Credit to Insurance" onClick={() => {
                                                    // Not implemented: transfer patient credit to insurance
                                                }}>
                                                    <span role="img" aria-label="transfer">🔁</span>
                                                </IconBtn>
                                            </div>
                                        </div>
                                    )}
                                    {/* Courtesy credit summary (inline, only shown when manually added from Deposit tab) */}
                                    {(() => {
                                        const cc = courtesyCreditsMap[inv.id] ?? [];
                                        const showCourtesyCredit = cc.length > 0;
                                        if (!showCourtesyCredit) return null;
                                        const courtesy = cc[0];
                                        return (
                                            <div className="flex items-start gap-3 border-b px-3 py-2 text-sm bg-amber-50/40">
                                                <button
                                                    className="mr-2 p-1 rounded-full hover:bg-amber-100"
                                                    title="View/Add Notes"
                                                    onClick={e => handleOpenNotes(inv.id, e)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12s3.694 8.25 8.25 8.25z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                                                    </svg>
                                                </button>
                                                <div className="min-w-[100px] text-gray-500">{courtesy.appliedDate || new Date().toLocaleDateString()}</div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-gray-700">
                                                            <b>Courtesy Credit Adjustment #{courtesy.id}:</b> {courtesy.adjustmentType}
                                                        </span>
                                                        <Badge tone="amber">Applied {currency(Number(courtesy.amount))}</Badge>
                                                        {courtesy.description && <Badge tone="gray">{courtesy.description}</Badge>}
                                                    </div>
                                                </div>
                                                <div className="ml-auto flex items-center gap-2">
                                                    <IconBtn title="Edit Courtesy Credit" onClick={() => {
                                                        setEditCourtesyModal({ invoiceId: inv.id, courtesy });
                                                    }}>
                                                        <span role="img" aria-label="edit">✏️</span>
                                                    </IconBtn>
                                                    <IconBtn title="Void Courtesy Credit" onClick={() => {
                                                        if (confirm('Are you sure you want to void this courtesy credit?')) {
                                                            void removeCourtesyCredit(inv.id, "Voided by user");
                                                        }
                                                    }}>
                                                        <span role="img" aria-label="void">🚫</span>
                                                    </IconBtn>
                                                    <IconBtn title="Undo Courtesy Credit" onClick={() => {
                                                        if (confirm('Are you sure you want to undo this courtesy credit?')) {
                                                            void removeCourtesyCredit(inv.id, "Undone by user");
                                                        }
                                                    }}>
                                                        <span role="img" aria-label="undo">↩️</span>
                                                    </IconBtn>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {/* Mini invoice line row */}
                                    {first && (
                                        <div className="flex items-start gap-3 px-3 py-2 text-sm">
                                            <button
                                                className="mr-2 p-1 rounded-full hover:bg-gray-100"
                                                title="View/Add Notes"
                                                onClick={e => handleOpenNotes(inv.id, e)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12s3.694 8.25 8.25 8.25z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                                                </svg>
                                            </button>
                                            <div className="min-w-[100px] text-gray-500">{first.dos}</div>
                                            <div className="flex-1">
                                                <span className="text-gray-700">
                                                    Invoice #{inv.id}: [ {first.treatment} ] <b>{currency(Number(first.charge ?? 0))}</b>
                                                </span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <IconBtn title="Print" onClick={() => window.print()}>🖨️</IconBtn>
                                                <IconBtn title="Edit" onClick={() => setShowEditLinesFor(inv.id)}>✏️</IconBtn>
                                                <IconBtn title="Transfer Outstanding" onClick={() => setTransferOpenFor(inv.id)}>🔁</IconBtn>
                                                <IconBtn title="Adjustment" onClick={() => setShowAdjustmentInvoiceFor(inv.id)}>➖</IconBtn>
                                            </div>
                                        </div>
                                    )}
                                    {transferOpenFor === inv.id && (
                                        <div className="relative">
                                            <div className="absolute z-10 ml-3 mt-2 w-64 rounded-md border bg-white p-1 shadow">
                                                <button className="w-full rounded px-3 py-2 text-left hover:bg-gray-50" onClick={() => { transferOutstandingToPatient(inv.id, Number(inv.ptBalance ?? 0)); setTransferOpenFor(null); }}>
                                                    Transfer Outstanding To Patient
                                                </button>
                                                <button className="w-full rounded px-3 py-2 text-left hover:bg-gray-50" onClick={() => { transferOutstandingToInsurance(inv.id, Number(inv.insBalance ?? 0)); setTransferOpenFor(null); }}>
                                                    Transfer Outstanding To Insurance
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            )}

            {/* Notes Modal for invoice notes */}
            <NotesModal
                open={!!showNotesFor}
                invoiceId={showNotesFor?.invoiceId ?? 0}
                onClose={handleCloseNotes}
                notes={currentNotes}
                editingNote={editingNote}
                notesText={notesText}
                onNotesChange={setNotesText}
                onSave={handleSaveNote}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
            />

            {/* ================= CLAIM TAB ================= */}
            {tab === "CLAIM" && selectedInvoice && selectedClaim && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <div>
                                <span className="font-semibold">Claim #{selectedClaim.id}</span> · For{" "}
                                <span className="font-semibold">{patientName}</span> · To{" "}
                                <span className="font-semibold">{selectedClaim.payerName ?? "—"}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <button className="btn-light" onClick={() => setShowClaimComposeFor(selectedInvoice.id)}>
                                    + Add note/narrative
                                </button>
                                <button className="btn-primary" onClick={() => { void sendToBatch(selectedInvoice.id); }}>
                                    Send to Batch
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-amber-800">
                            This claim will be split into multiple claims unless you specify a treating provider.
                        </div>
                    </div>
                    <SectionCard
                        title={`Claim #${selectedClaim.id}`}
                        actions={
                            <div className="flex gap-2">
                                <button className="btn-light" onClick={() => window.print()}>Print</button>
                                <button className="btn-light" onClick={() => setShowClaimEditFor(selectedInvoice.id)}>Edit</button>
                                <button className="btn-light" onClick={() => { void closeClaim(selectedInvoice.id); }}>Close Claim</button>
                                <button
                                    className="btn-light"
                                    title={selectedClaim.attachments ? "" : "No Attachments"}
                                    onClick={() => setShowAttachmentFor(selectedInvoice.id)}
                                />
                                <button className="btn-light" onClick={() => setShowEobFor(selectedInvoice.id)}>EOB</button>
                                <button className="btn-danger" onClick={() => setShowVoidFor(selectedInvoice.id)}>
                                    Void & Re-Create
                                </button>
                            </div>
                        }
                    >
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div>
                                {" "}
                                Status: <Badge tone="blue">{selectedClaim.status.replaceAll("_", " ").toLowerCase()}</Badge>
                            </div>
                            <div>
                                {" "}
                                Type: <Badge tone="gray">{(selectedClaim.type ?? "Electronic").toString().toLowerCase()}</Badge>
                            </div>
                            <div>
                                {" "}
                                Attachments: <Badge tone="gray">{String(selectedClaim.attachments)}</Badge>
                            </div>
                            <div>
                                {" "}
                                EOB: {selectedClaim.eobAttached ? <Badge tone="green">attached</Badge> : <Badge tone="gray">none</Badge>} {" "}
                            </div>
                            <div className="ml-auto">
                                <button className="btn-primary" onClick={() => { void submitClaim(selectedInvoice.id); }}>
                                    Submit Claim
                                </button>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            )}

            {/* ============ INSURANCE PAYMENT ============ */}
            {tab === "INS" && selectedInvoice && (
                <SectionCard
                    title={`Add Payment (Insurance) — Invoice #${selectedInvoice.id}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Cheque #</label>
                            <input
                                className="input"
                                placeholder="e.g., 0037089513"
                                value={cheque.number}
                                onChange={(e) => setCheque((c) => ({ ...c, number: e.target.value }))}
                            />
                            <label className="text-sm text-gray-600">Bank/Branch #</label>
                            <input
                                className="input"
                                placeholder="…"
                                value={cheque.bankBranch}
                                onChange={(e) => setCheque((c) => ({ ...c, bankBranch: e.target.value }))}
                            />
                            <button className="btn-primary" onClick={() => { void applyInsurancePayment(); }}>
                                Apply
                            </button>
                        </div>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-left">
                            <tr className="border-b">
                                <th className="p-2">Code</th>
                                <th className="p-2">Submitted</th>
                                <th className="p-2">Balance</th>
                                <th className="p-2">Deductible</th>
                                <th className="p-2">Allowed</th>
                                <th className="p-2">Ins WO</th>
                                <th className="p-2">Ins Pay</th>
                                <th className="p-2">Options</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedInvoice.lines.map((l, idx) => {
                                const r = remits[idx];
                                return (
                                    <tr key={l.id} className="border-b">
                                        <td className="p-2 font-mono">{l.code}</td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-28"
                                                value={r?.submitted ?? 0}
                                                onChange={(e) =>
                                                    setRemits((arr) =>
                                                        arr.map((x, i) => (i === idx ? { ...x, submitted: +e.target.value } : x))
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-24"
                                                value={r?.balance ?? 0}
                                                onChange={(e) =>
                                                    setRemits((arr) =>
                                                        arr.map((x, i) => (i === idx ? { ...x, balance: +e.target.value } : x))
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-24"
                                                value={r?.deductible ?? 0}
                                                onChange={(e) =>
                                                    setRemits((arr) =>
                                                        arr.map((x, i) => (i === idx ? { ...x, deductible: +e.target.value } : x))
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-24"
                                                value={r?.allowed ?? 0}
                                                onChange={(e) =>
                                                    setRemits((arr) =>
                                                        arr.map((x, i) => (i === idx ? { ...x, allowed: +e.target.value } : x))
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-24"
                                                value={r?.insWriteOff ?? 0}
                                                onChange={(e) =>
                                                    setRemits((arr) =>
                                                        arr.map((x, i) => (i === idx ? { ...x, insWriteOff: +e.target.value } : x))
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-24"
                                                value={r?.insPay ?? 0}
                                                onChange={(e) =>
                                                    setRemits((arr) =>
                                                        arr.map((x, i) => (i === idx ? { ...x, insPay: +e.target.value } : x))
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center gap-3 text-xs">
                                                <label className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={r?.updateAllowed ?? false}
                                                        onChange={(e) =>
                                                            setRemits((arr) =>
                                                                arr.map((x, i) => (i === idx ? { ...x, updateAllowed: e.target.checked } : x))
                                                            )
                                                        }
                                                    />
                                                    Update allowed fee
                                                </label>
                                                <label className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={r?.updateFlatPortion ?? false}
                                                        onChange={(e) =>
                                                            setRemits((arr) =>
                                                                arr.map((x, i) => (i === idx ? { ...x, updateFlatPortion: e.target.checked } : x))
                                                            )
                                                        }
                                                    />
                                                    Update Ins. Flat Portion
                                                </label>
                                                <label className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={r?.applyWriteoff ?? false}
                                                        onChange={(e) =>
                                                            setRemits((arr) =>
                                                                arr.map((x, i) => (i === idx ? { ...x, applyWriteoff: e.target.checked } : x))
                                                            )
                                                        }
                                                    />
                                                    Apply write-off
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                        Note: In multiple coverage scenarios, primary write-off may be deferred until final EOB.
                    </div>
                </SectionCard>
            )}

            {/* ============ PATIENT PAYMENT ============ */}
            {tab === "PATIENT" && selectedInvoice && (
                <div className="space-y-4">
                    {outstanding <= 0 && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800">
                            {/* There is no outstanding balance on the patient’s account. Please add as a deposit. */}
                        </div>
                    )}

                    <SectionCard
                        title={`Add Payment (Patient) — Invoice #${selectedInvoice.id}`}
                        actions={
                            <div className="flex items-center gap-2">
                                <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="CHECK">Check</option>
                                    <option value="DEBIT_CARD">Debit Card (debit)</option>
                                    <option value="EFT">EFT</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CARE_CREDIT">Care Credit</option>
                                    <option value="MASTERCARD">Master Card</option>
                                    <option value="VISA">Visa</option>
                                    <option value="DISCOVER">Discover</option>
                                    <option value="AMEX">Amex</option>
                                </select>
                                <button className="btn-primary" onClick={() => { void applyPatientPayment(); }}>
                                    Apply
                                </button>
                            </div>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left">
                                <tr className="border-b">
                                    <th className="p-2">Invoice</th>
                                    <th className="p-2">Line</th>
                                    <th className="p-2">Charge</th>
                                    <th className="p-2">Payment</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedInvoice.lines.map((l, idx) => (
                                    <tr key={l.id} className="border-b">
                                        <td className="p-2">#{selectedInvoice.id}</td>
                                        <td className="p-2">
                                            {l.code} — {l.treatment}
                                        </td>
                                        <td className="p-2">{currency(Number(l.charge ?? 0))}</td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="input w-32"
                                                value={allocs[idx]?.amount ?? 0}
                                                onChange={(e) =>
                                                    setAllocs((arr) => arr.map((a, i) => (i === idx ? { ...a, amount: +e.target.value } : a)))
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="p-2 font-medium" colSpan={3}>
                                        Overpayment:
                                    </td>
                                    <td className="p-2 font-semibold">{currency(overpay)}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" /> Generate Statement
                            </label>
                            <div className="text-gray-700">
                                Entered: <span className="font-semibold">{currency(entered)}</span> · Outstanding:{" "}
                                <span className="font-semibold">{currency(outstanding)}</span>
                            </div>
                        </div>
                    </SectionCard>

                    <div className="rounded-xl border border-purple-300 bg-purple-50 p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-purple-900">
                                Account Credit: <b>{currency(Number(accountCredit.balance ?? 0))}</b>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="btn-light"
                                    onClick={() => {
                                        void applyAccountCredit(Math.min(Number(accountCredit.balance ?? 0), Number(outstanding ?? 0)));
                                    }}
                                >
                                    Apply to open balance
                                </button>
                                <button className="btn-light" onClick={() => { void applyAccountCredit(0); }}>
                                    Keep as account credit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======= MODALS ======= */}
            {/* Backdate Transaction Modal */}
            {showBackdateFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3 bg-blue-600 text-white rounded-t-2xl">
                            <h4 className="text-base font-semibold">Backdate Transaction</h4>
                            <button onClick={() => setShowBackdateFor(null)} className="rounded p-1 hover:bg-blue-700" aria-label="Close">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="text-sm text-gray-600">Backdate to:</div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="date" 
                                    id="backdate-input"
                                    className="input flex-1" 
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn-light" style={{background: '#f59e0b', color: 'white', borderColor: '#f59e0b'}} onClick={async () => {
                                    const dateInput = document.getElementById('backdate-input') as HTMLInputElement;
                                    const backdate = dateInput?.value;
                                    if (!backdate || !showBackdateFor) return;
                                    try {
                                        await backdateInvoice(showBackdateFor, backdate);
                                        alert(`Invoice #${showBackdateFor} backdated to ${backdate}`);
                                    } catch (err) {
                                        alert("Error: " + (err as Error).message);
                                    }
                                    setShowBackdateFor(null);
                                }}>
                                    Backdate Transaction
                                </button>
                                <button className="btn-light" onClick={() => setShowBackdateFor(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Adjustment Modal */}
            {showAccountAdjustmentFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3 bg-purple-600 text-white rounded-t-2xl">
                            <h4 className="text-base font-semibold">Account Adjustment</h4>
                            <button onClick={() => setShowAccountAdjustmentFor(null)} className="rounded p-1 hover:bg-purple-700" aria-label="Close">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <label className="label flex-shrink-0">Adjustment Type</label>
                                <select id="acct-adj-type" className="input flex-1" defaultValue="Un-Collected">
                                    <option value="Un-Collected">Un-Collected</option>
                                    <option value="Professional Courtesy">Professional Courtesy</option>
                                    <option value="Migrated">Migrated</option>
                                    <option value="MembershipPlan">MembershipPlan</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="label flex-shrink-0">Flat rate</label>
                                <input type="radio" name="adj-method" value="flat" defaultChecked />
                                <label className="label flex-shrink-0 ml-4">Total Outstanding</label>
                                <input type="number" id="acct-adj-total" className="input w-32" placeholder="$0.00" />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="label flex-shrink-0">Patient Outstanding</label>
                                <input type="number" id="acct-adj-patient" className="input w-32" placeholder="$0.00" />
                                <label className="label flex-shrink-0 ml-4">Specific</label>
                                <input type="radio" name="adj-method" value="specific" />
                                <input type="number" className="input w-20" placeholder="$0" />
                            </div>
                            <div className="mt-2">
                                <input type="checkbox" id="include-courtesy" />
                                <label htmlFor="include-courtesy" className="ml-2 text-sm">Include the Courtesy Credit ($0.00)</label>
                            </div>
                            <div className="mt-2">
                                <label className="label">+ Add description</label>
                                <textarea id="acct-adj-desc" className="input w-full h-20" placeholder="Add description..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn-primary" onClick={async () => {
                                    const type = (document.getElementById('acct-adj-type') as HTMLSelectElement)?.value;
                                    const flatRate = Number((document.getElementById('acct-adj-total') as HTMLInputElement)?.value);
                                    const specificAmount = Number((document.getElementById('acct-adj-patient') as HTMLInputElement)?.value);
                                    const description = (document.getElementById('acct-adj-desc') as HTMLTextAreaElement)?.value;
                                    const includeCourtesyCredit = (document.getElementById('include-courtesy') as HTMLInputElement)?.checked;
                                    if (!type || (!flatRate && !specificAmount) || !showAccountAdjustmentFor) return;
                                    try {
                                        await accountAdjustment({ adjustmentType: type, flatRate, specificAmount, description, includeCourtesyCredit });
                                        alert(`Account adjustment applied: ${type}`);
                                    } catch (err) {
                                        alert("Error: " + (err as Error).message);
                                    }
                                    setShowAccountAdjustmentFor(null);
                                }}>
                                    Apply
                                </button>
                                <button className="btn-light" onClick={() => setShowAccountAdjustmentFor(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjustment Invoice Modal */}
            {showAdjustmentInvoiceFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={(e) => {
                    if (e.target === e.currentTarget) setShowAdjustmentInvoiceFor(null);
                }}>
                    <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3 bg-purple-600 text-white rounded-t-2xl">
                            <h4 className="text-base font-semibold">Adjust Invoice #{showAdjustmentInvoiceFor}</h4>
                            <button onClick={() => setShowAdjustmentInvoiceFor(null)} className="rounded p-1 hover:bg-purple-700" aria-label="Close">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-sm">{new Date().toLocaleDateString()}</div>
                                <div className="text-sm">Credit Adjustment <span className="font-semibold">#27943</span> type</div>
                                <select id="adj-invoice-type" className="input" defaultValue="Un-Collected">
                                    <option value="Un-Collected">Un-Collected</option>
                                    <option value="Professional Courtesy">Professional Courtesy</option>
                                    <option value="Migrated">Migrated</option>
                                    <option value="MembershipPlan">MembershipPlan</option>
                                </select>
                                <div className="text-sm">for invoice: <span className="font-semibold">#{showAdjustmentInvoiceFor}</span></div>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <label className="text-sm">Percentage ~</label>
                                <input id="adj-invoice-percent" type="number" className="input w-20" placeholder="% 0" />
                                <div className="text-sm">= $0</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm border-collapse">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left border">Invoice #</th>
                                            <th className="p-2 text-left border">Code</th>
                                            <th className="p-2 text-left border">Provider</th>
                                            <th className="p-2 text-right border">Ins Writeoff</th>
                                            <th className="p-2 text-right border">Patient: $0.00</th>
                                            <th className="p-2 text-right border">Insurance: $206.00</th>
                                            <th className="p-2 text-right border">Previous Total Owing: $206.00</th>
                                            <th className="p-2 text-right border">Payment: $0.00</th>
                                            <th className="p-2 text-right border">Adjust: $0.00</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.find((i) => i.id === showAdjustmentInvoiceFor)?.lines.map((l) => (
                                            <tr key={l.id} className="border-b">
                                                <td className="p-2 border">#{showAdjustmentInvoiceFor} : {l.dos} for</td>
                                                <td className="p-2 border">{l.code}</td>
                                                <td className="p-2 border">{l.provider}</td>
                                                <td className="p-2 text-right border">$0.00</td>
                                                <td className="p-2 text-right border">$0.00</td>
                                                <td className="p-2 text-right border">${l.charge?.toFixed(2)}</td>
                                                <td className="p-2 text-right border">${l.charge?.toFixed(2)}</td>
                                                <td className="p-2 text-right border">$0.00</td>
                                                <td className="p-2 text-right border">
                                                    <input id={`adj-invoice-line-${l.id}`} type="number" className="input w-20 text-right" placeholder="0%" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <label className="label">+ Add description</label>
                                <textarea id="adj-invoice-desc" className="input w-full h-16" placeholder="Add description..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn-primary" onClick={async () => {
                                    const invoiceId = showAdjustmentInvoiceFor;
                                    const type = (document.getElementById('adj-invoice-type') as HTMLSelectElement)?.value;
                                    const percent = Number((document.getElementById('adj-invoice-percent') as HTMLInputElement)?.value);
                                    const description = (document.getElementById('adj-invoice-desc') as HTMLTextAreaElement)?.value;
                                    if (!invoiceId || !type) {
                                        alert('Please select an adjustment type');
                                        return;
                                    }
                                    try {
                                        await adjustInvoice(invoiceId, { 
                                            adjustmentType: type, 
                                            discountPercent: percent > 0 ? percent : undefined,
                                            description: description || undefined
                                        });
                                        alert(`Invoice adjusted successfully`);
                                        await loadAll();
                                    } catch (err) {
                                        alert("Error: " + (err as Error).message);
                                    }
                                    setShowAdjustmentInvoiceFor(null);
                                }}>
                                    Adjust
                                </button>
                                <button className="btn-light" onClick={() => setShowAdjustmentInvoiceFor(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Insurance Write-Off Modal */}
            {showInsuranceWriteOffFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3 bg-purple-600 text-white rounded-t-2xl">
                            <h4 className="text-base font-semibold">Insurance Write-Off Invoice #{showInsuranceWriteOffFor}</h4>
                            <button onClick={() => setShowInsuranceWriteOffFor(null)} className="rounded p-1 hover:bg-purple-700" aria-label="Close">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="text-sm text-gray-600">
                                {new Date().toLocaleDateString()} claim: <span className="font-semibold">select a claim</span> for invoice: <span className="font-semibold">#{showInsuranceWriteOffFor}</span>
                            </div>
                            <div>
                                <select className="input w-full">
                                    <option value="">Select a claim</option>
                                    {Object.values(claims).filter(c => c.invoiceId === showInsuranceWriteOffFor).map(c => (
                                        <option key={c.id} value={c.id}>Claim #{c.id} - {c.payerName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn-primary" onClick={() => {
                                    alert(`Insurance write-off applied to invoice #${showInsuranceWriteOffFor}`);
                                    setShowInsuranceWriteOffFor(null);
                                }}>
                                    Apply
                                </button>
                                <button className="btn-light" onClick={() => setShowInsuranceWriteOffFor(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Membership Adjustment Modal */}
            {showMembershipAdjustmentFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3 bg-purple-600 text-white rounded-t-2xl">
                            <h4 className="text-base font-semibold">Membership Adjustment</h4>
                            <button onClick={() => setShowMembershipAdjustmentFor(null)} className="rounded p-1 hover:bg-purple-700" aria-label="Close">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="text-center text-red-600 font-semibold">Patient Has No Membership Plans</div>
                            <div>
                                <label className="label">Description</label>
                                <textarea className="input w-full h-20" placeholder="Add description..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="btn-primary" disabled>Apply</button>
                                <button className="btn-light" onClick={() => setShowMembershipAdjustmentFor(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ...existing code... */}
            {showEditLinesFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    {/* ...existing code... */}
                </div>
            )}
            {/* ...existing code... */}

            {showAddProcedure && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h4 className="text-base font-semibold">Add Procedure (creates Invoice)</h4>
                            <button onClick={() => setShowAddProcedure(false)} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                                ✕
                            </button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="md:col-span-2">
                                    <label className="label">Code</label>
                                    <input id="p-code" className="input w-full" placeholder="e.g., D2391" defaultValue="D2391" />
                                </div>
                                <div>
                                    <label className="label">Units</label>
                                    <input id="p-units" className="input w-full" defaultValue={1} type="number" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Rate</label>
                                <input id="p-rate" className="input w-full" placeholder="e.g., 239.00" defaultValue={239} />
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <input id="p-desc" className="input w-full" defaultValue="Composite Resin, 1 surface" />
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                    <label className="label">Date of Service</label>
                                    <input id="p-dos" className="input w-full" placeholder="YYYY-MM-DD" />
                                </div>
                                <div>
                                    <label className="label">Provider</label>
                                    <select id="p-prov" className="input w-full" defaultValue={providers[0]?.name || ""}>
                                        <option value="">Select Provider</option>
                                        {providers.map((prov) => (
                                            <option key={prov.id} value={prov.name}>
                                                {prov.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button className="btn-light" onClick={() => setShowAddProcedure(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        const code = (document.getElementById("p-code") as HTMLInputElement).value || "D2391";
                                        const rate = Number((document.getElementById("p-rate") as HTMLInputElement).value || "239");
                                        const treatment = (document.getElementById("p-desc") as HTMLInputElement).value || "Procedure";
                                        const dos =
                                            (document.getElementById("p-dos") as HTMLInputElement).value ||
                                            new Date().toISOString().slice(0, 10);
                                        const provider = (document.getElementById("p-prov") as HTMLSelectElement).value || providers[0]?.name || "PROV-01";

                                        void createInvoiceFromProcedure({ dos, code, treatment, provider, rate });
                                        setShowAddProcedure(false);
                                        setTab("INVOICE");
                                    }}
                                >
                                    Save & Create Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showClaimComposeFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h4 className="text-base font-semibold">Claim notes / narrative</h4>
                            <button onClick={() => setShowClaimComposeFor(null)} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                                ✕
                            </button>
                        </div>
                        <div className="p-5">
                            {(() => {
                                const c = claims[showClaimComposeFor ?? -1];
                                if (!c) return null;
                                return (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="label">Treating Provider</label>
                                                <input
                                                    className="input w-full"
                                                    defaultValue={c.treatingProviderId ?? ""}
                                                    onBlur={(e) => {
                                                        void updateClaim(c.invoiceId, { treatingProviderId: e.currentTarget.value });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Billing Entity</label>
                                                <input
                                                    className="input w-full"
                                                    defaultValue={c.billingEntity ?? ""}
                                                    onBlur={(e) => {
                                                        void updateClaim(c.invoiceId, { billingEntity: e.currentTarget.value });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Notes</label>
                                            <textarea
                                                className="input h-28 w-full"
                                                defaultValue={c.notes ?? ""}
                                                onBlur={(e) => {
                                                    void updateClaim(c.invoiceId, { notes: e.currentTarget.value });
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button className="btn-primary" onClick={() => { void sendToBatch(c.invoiceId); }}>
                                                Send to Batch
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {showClaimEditFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h4 className="text-base font-semibold">{`Edit Claim #${claims[showClaimEditFor!]?.id}`}</h4>
                            <button onClick={() => setShowClaimEditFor(null)} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                                ✕
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {[
                                ["attachmentIndicator", "Attachment Indicator (Y/N)"],
                                ["attachmentType", "Attachment Type (e.g., EOB)"],
                                ["attachmentTransmissionCode", "Attachment Transmission Code (EL/Mail/Fax)"],
                                ["claimSubmissionReasonCode", "Claim Submission Reason Code (e.g., 1)"],
                                ["type", "Type (Electronic/Paper)"],
                            ].map(([key, label]) => (
                                <div key={key}>
                                    <label className="label">{label}</label>
                                    <input
                                        className="input w-full"
                                        onBlur={(e) => {
                                            void updateClaim(showClaimEditFor!, { [key]: e.currentTarget.value });
                                        }}
                                    />
                                </div>
                            ))}
                            <div className="md:col-span-2 flex justify-end">
                                <button className="btn-primary" onClick={() => setShowClaimEditFor(null)}>
                                    Edit Claim
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showVoidFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h4 className="text-base font-semibold">Void & Re-Create claim</h4>
                            <button onClick={() => setShowVoidFor(null)} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                                ✕
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm">
                                Are you sure you want to void & recreate this claim? This will only void the claim in the system and
                                create a clone without submitting. <b>This can’t be undone!</b>
                            </p>
                            <div className="flex justify-end gap-2">
                                <button className="btn-light" onClick={() => setShowVoidFor(null)}>
                                    Cancel
                                </button>
                                <button className="btn-danger" onClick={() => { void voidAndRecreateClaim(showVoidFor!); }}>
                                    Void & Re-Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======= ATTACHMENTS UPLOAD MODAL ======= */}
            {showAttachmentFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h4 className="text-base font-semibold">
                                {`Upload Attachment — Claim #${claims[showAttachmentFor]?.id ?? "—"}`}
                            </h4>
                            <button
                                onClick={() => { setAttachmentFile(null); setShowAttachmentFor(null); }}
                                className="rounded p-1 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-5 grid gap-4">
                            <div>
                                <label className="label">Select document (image/PDF)</label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="input w-full"
                                    onChange={(e) => setAttachmentFile(e.currentTarget.files?.[0] ?? null)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    className="btn-light"
                                    onClick={async () => {
                                        const claimId = claims[showAttachmentFor]?.id;
                                        if (!claimId) return;
                                        const res = await fetchWithAuth(`${API}/claims/${claimId}/attachment`, { method: "GET" });
                                        if (res.ok) {
                                            const contentType = res.headers.get("content-type") || "";
                                            const blob = await res.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            if (contentType.startsWith("image/")) {
                                                setPreviewUrl(url);
                                                setPreviewType("image");
                                                setPreviewOpen(true);
                                            } else if (contentType === "application/pdf") {
                                                setPreviewUrl(url);
                                                setPreviewType("pdf");
                                                setPreviewOpen(true);
                                            } else {
                                                window.open(url, "_blank");
                                            }
                                        }
                                    }}
                                >
                                    View documents
                                </button>

                                <div className="flex gap-2">
                                    <button className="btn-light" onClick={() => { setAttachmentFile(null); setShowAttachmentFor(null); }}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={async () => {
                                            if (!attachmentFile || !showAttachmentFor) return;
                                            const claimId = claims[showAttachmentFor]?.id;
                                            if (!claimId) return;
                                            const formData = new FormData();
                                            formData.append("file", attachmentFile);
                                            await fetchWithAuth(`${API}/claims/${claimId}/attachment`, {
                                                method: "POST",
                                                body: formData,
                                            });
                                            setAttachmentFile(null);
                                            setShowAttachmentFor(null);
                                            // Optionally reload claim data here
                                        }}
                                        disabled={!attachmentFile}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======= EOB UPLOAD MODAL ======= */}
            {showEobFor && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h4 className="text-base font-semibold">
                                {`Upload EOB — Claim #${claims[showEobFor]?.id ?? "—"}`}
                            </h4>
                            <button
                                onClick={() => { setEobFile(null); setShowEobFor(null); }}
                                className="rounded p-1 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-5 grid gap-4">
                            <div>
                                <label className="label">Select EOB (image/PDF)</label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="input w-full"
                                    onChange={(e) => setEobFile(e.currentTarget.files?.[0] ?? null)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    className="btn-light"
                                    onClick={async () => {
                                        const claimId = claims[showEobFor]?.id;
                                        if (!claimId) return;
                                        const res = await fetchWithAuth(`${API}/claims/${claimId}/eob`, { method: "GET" });
                                        if (res.ok) {
                                            const contentType = res.headers.get("content-type") || "";
                                            const blob = await res.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            if (contentType.startsWith("image/")) {
                                                setPreviewUrl(url);
                                                setPreviewType("image");
                                                setPreviewOpen(true);
                                            } else if (contentType === "application/pdf") {
                                                setPreviewUrl(url);
                                                setPreviewType("pdf");
                                                setPreviewOpen(true);
                                            } else {
                                                window.open(url, "_blank");
                                            }
                                        }
                                    }}
                                >
                                    View documents
                                </button>
            {/* ======= FILE PREVIEW MODAL ======= */}
            {previewOpen && previewUrl && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl relative">
                        <button
                            onClick={() => { setPreviewOpen(false); setPreviewUrl(null); setPreviewType(null); }}
                            className="absolute top-2 right-2 rounded p-1 hover:bg-gray-100"
                            aria-label="Close"
                        >✕</button>
                        <div className="p-5 flex justify-center items-center min-h-[400px]">
                            {previewType === "image" ? (
                                <img src={previewUrl} alt="Preview" className="max-h-[70vh] max-w-full rounded" />
                            ) : previewType === "pdf" ? (
                                <iframe src={previewUrl} title="PDF Preview" className="w-full h-[70vh]" />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

                                <div className="flex gap-2">
                                    <button className="btn-light" onClick={() => { setEobFile(null); setShowEobFor(null); }}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={async () => {
                                            if (!eobFile || !showEobFor) return;
                                            const claimId = claims[showEobFor]?.id;
                                            if (!claimId) return;
                                            const formData = new FormData();
                                            formData.append("file", eobFile);
                                            await fetchWithAuth(`${API}/claims/${claimId}/eob`, {
                                                method: "POST",
                                                body: formData,
                                            });
                                            setEobFile(null);
                                            setShowEobFor(null);
                                            // Optionally reload claim data here
                                        }}
                                        disabled={!eobFile}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Insurance Payment Modal */}
            {editInsuranceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">Edit Insurance Payment</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as typeof e.target & {
                                submitted: { value: string },
                                balance: { value: string },
                                deductible: { value: string },
                                allowed: { value: string },
                                insWriteOff: { value: string },
                                insPay: { value: string },
                                updateAllowed: { checked: boolean },
                                updateFlatPortion: { checked: boolean },
                                applyWriteoff: { checked: boolean },
                            };
                            await editInsuranceRemitLine(
                                editInsuranceModal.invoiceId,
                                editInsuranceModal.remit.id,
                                {
                                    invoiceLineId: editInsuranceModal.remit.invoiceLineId,
                                    submitted: Number(form.submitted.value),
                                    balance: Number(form.balance.value),
                                    deductible: Number(form.deductible.value),
                                    allowed: Number(form.allowed.value),
                                    insWriteOff: Number(form.insWriteOff.value),
                                    insPay: Number(form.insPay.value),
                                    updateAllowed: form.updateAllowed.checked,
                                    updateFlatPortion: form.updateFlatPortion.checked,
                                    applyWriteoff: form.applyWriteoff.checked,
                                }
                            );
                            setEditInsuranceModal(null);
                        }}>
                            <div className="grid grid-cols-2 gap-3">
                                <label>Submitted<input name="submitted" type="number" className="input w-full" defaultValue={editInsuranceModal.remit.submitted} /></label>
                                <label>Balance<input name="balance" type="number" className="input w-full" defaultValue={editInsuranceModal.remit.balance} /></label>
                                <label>Deductible<input name="deductible" type="number" className="input w-full" defaultValue={editInsuranceModal.remit.deductible} /></label>
                                <label>Allowed<input name="allowed" type="number" className="input w-full" defaultValue={editInsuranceModal.remit.allowed} /></label>
                                <label>Ins WriteOff<input name="insWriteOff" type="number" className="input w-full" defaultValue={editInsuranceModal.remit.insWriteOff} /></label>
                                <label>Ins Pay<input name="insPay" type="number" className="input w-full" defaultValue={editInsuranceModal.remit.insPay} /></label>
                                <label className="col-span-2"><input name="updateAllowed" type="checkbox" defaultChecked={!!editInsuranceModal.remit.updateAllowed} /> Update Allowed</label>
                                <label className="col-span-2"><input name="updateFlatPortion" type="checkbox" defaultChecked={!!editInsuranceModal.remit.updateFlatPortion} /> Update Flat Portion</label>
                                <label className="col-span-2"><input name="applyWriteoff" type="checkbox" defaultChecked={!!editInsuranceModal.remit.applyWriteoff} /> Apply Writeoff</label>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" className="btn-light" onClick={() => setEditInsuranceModal(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Patient Payment Modal */}
            {editPatientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">Edit Patient Payment</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as typeof e.target & {
                                amount: { value: string },
                                paymentMethod: { value: string },
                            };
                            await editPatientPayment(
                                editPatientModal.invoiceId,
                                editPatientModal.payment.id,
                                {
                                    amount: Number(form.amount.value),
                                    paymentMethod: form.paymentMethod.value,
                                }
                            );
                            setEditPatientModal(null);
                        }}>
                            <div className="grid grid-cols-2 gap-3">
                                <label>Amount<input name="amount" type="number" className="input w-full" defaultValue={editPatientModal.payment.amount} /></label>
                                <label>Payment Method
                                    <select name="paymentMethod" className="input w-full" defaultValue={editPatientModal.payment.paymentMethod}>
                                        <option value="CREDIT_CARD">Credit Card</option>
                                        <option value="CHECK">Check</option>
                                        <option value="DEBIT_CARD">Debit Card</option>
                                        <option value="EFT">EFT</option>
                                        <option value="CASH">Cash</option>
                                        <option value="CARE_CREDIT">Care Credit</option>
                                        <option value="MASTERCARD">Master Card</option>
                                        <option value="VISA">Visa</option>
                                        <option value="DISCOVER">Discover</option>
                                        <option value="AMEX">Amex</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" className="btn-light" onClick={() => setEditPatientModal(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {showEditLinesFor && (() => {
                const invoice = invoices.find(inv => inv.id === showEditLinesFor);
                if (!invoice || !invoice.lines.length) return null;
                const firstLine = invoice.lines[0];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                            <h3 className="text-lg font-semibold mb-4">Edit Invoice #{invoice.id}</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as typeof e.target & {
                                    code: { value: string };
                                    description: { value: string };
                                    provider: { value: string };
                                    dos: { value: string };
                                    rate: { value: string };
                                };
                                try {
                                    await updateInvoice(invoice.id, {
                                        code: form.code.value,
                                        description: form.description.value,
                                        provider: form.provider.value,
                                        dos: form.dos.value,
                                        rate: Number(form.rate.value),
                                    });
                                    setShowEditLinesFor(null);
                                } catch (error) {
                                    console.error("Failed to update invoice:", error);
                                    alert("Failed to update invoice. Please try again.");
                                }
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                        <input
                                            name="code"
                                            type="text"
                                            className="input w-full"
                                            defaultValue={firstLine.code}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input
                                            name="description"
                                            type="text"
                                            className="input w-full"
                                            defaultValue={firstLine.treatment}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                                        <input
                                            name="provider"
                                            type="text"
                                            className="input w-full"
                                            defaultValue={firstLine.provider}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Service</label>
                                        <input
                                            name="dos"
                                            type="date"
                                            className="input w-full"
                                            defaultValue={firstLine.dos}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                                        <input
                                            name="rate"
                                            type="number"
                                            step="0.01"
                                            className="input w-full"
                                            defaultValue={firstLine.charge}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" className="btn-light" onClick={() => setShowEditLinesFor(null)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Update Invoice</button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* Edit Courtesy Credit Modal */}
            {editCourtesyModal && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3 bg-amber-600 text-white rounded-t-2xl">
                            <h4 className="text-base font-semibold">Edit Courtesy Credit #{editCourtesyModal.courtesy.id}</h4>
                            <button onClick={() => setEditCourtesyModal(null)} className="rounded p-1 hover:bg-amber-700" aria-label="Close">✕</button>
                        </div>
                        <div className="p-5">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget as HTMLFormElement;
                                try {
                                    await updateCourtesyCredit(editCourtesyModal.invoiceId, {
                                        adjustmentType: (form.elements.namedItem('adjustmentType') as HTMLSelectElement).value,
                                        amount: Number((form.elements.namedItem('amount') as HTMLInputElement).value),
                                        description: (form.elements.namedItem('description') as HTMLInputElement).value,
                                    });
                                    setEditCourtesyModal(null);
                                    alert("Courtesy credit updated successfully");
                                } catch (error) {
                                    console.error("Failed to update courtesy credit:", error);
                                    alert("Failed to update courtesy credit. Please try again.");
                                }
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label">Adjustment Type</label>
                                        <select name="adjustmentType" className="input w-full" defaultValue={editCourtesyModal.courtesy.adjustmentType}>
                                            {courtesyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Amount</label>
                                        <input
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            className="input w-full"
                                            defaultValue={editCourtesyModal.courtesy.amount}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Description</label>
                                        <input
                                            name="description"
                                            type="text"
                                            className="input w-full"
                                            defaultValue={editCourtesyModal.courtesy.description || ''}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" className="btn-light" onClick={() => setEditCourtesyModal(null)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}