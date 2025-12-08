"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import PersonalInfo from "@/components/settings/provider-registration/PersonalInfo";
import ProfessionalInfo from "@/components/settings/provider-registration/ProfessionalInfo";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import Alert from "@/components/ui/alert/Alert"; // Import your Alert component

interface ProviderRequestData {
    npi: string;
    identification: {
        firstName: string;
        lastName: string;
        gender: string;
        dateOfBirth: string;
    };
    professionalDetails: {
        licenseNumber: string;
        licenseState: string;
        licenseExpiry: string;
        specialty: string | null;
        providerType: string;
    };
    contact: {
        email: string;
        phoneNumber?: string;
        mobileNumber?: string;
    };
    systemAccess?: {
        status?: string;
    };
}

const ProviderRegistrationForm = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        phone: "",
        email: "",
        providerType: "",
        specialty: "",
        licenseNumber: "",
        licenseState: "",
        licenseExpiry: "",
        npiNumber: "",
    });

    const [alertData, setAlertData] = useState<{
        variant: "success" | "error" | "warning" | "info";
        title: string;
        message: string;
    } | null>(null);

    const router = useRouter();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL as string; //  ADD THIS LINE

    const handleSubmit = async () => {
        const requiredFields = [
            (formData as any).firstName,
            formData.lastName,
            formData.dob,
            formData.gender,
            formData.phone,
            formData.email,
            formData.providerType,
            formData.specialty,
            formData.licenseNumber,
            formData.licenseState,
            formData.licenseExpiry,
            formData.npiNumber,
        ];

        if (requiredFields.some((field) => !field)) {
            setAlertData({
                variant: "warning",
                title: "Missing Information",
                message: "Please fill in all the fields.",
            });
            return;
        }

        const requestData: ProviderRequestData = {
            npi: formData.npiNumber,
            identification: {
                firstName: (formData as any).firstName || "",
                lastName: formData.lastName,
                gender: formData.gender,
                dateOfBirth: formData.dob,
            },
            professionalDetails: {
                licenseNumber: formData.licenseNumber,
                licenseState: formData.licenseState,
                licenseExpiry: formData.licenseExpiry,
                specialty: formData.specialty || null,
                providerType: formData.providerType,
            },
            contact: {
                email: formData.email,
                phoneNumber: formData.phone,
                mobileNumber: formData.phone, // backend validation requires mobileNumber
            },
            systemAccess: {
                status: "ACTIVE",
            },
        };

        // Quick check: ensure an auth token exists in local/session storage
        const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("token")) : null;
        if (!token) {
            setAlertData({
                variant: "error",
                title: "Not Signed In",
                message: "You are not signed in. Please sign in and try again.",
            });
            return;
        }

        try {
            const response = await fetchWithAuth(`${apiUrl}/api/providers`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(requestData),
            });

            let result: any = null;
            try {
                result = await response.json();
            } catch (err) {
                console.error("Failed to parse create provider response", err);
            }

            if (response.ok) {
                setAlertData({
                    variant: "success",
                    title: "Success",
                    message: "Provider created successfully!",
                });

                // Redirect to provider list so the newly created provider is visible
                setTimeout(() => {
                    router.push("/settings/providers");
                }, 1200);
            } else if (response.status === 401) {
                // Unauthorized — surface clear message
                console.error("Create provider unauthorized", { status: response.status, body: result });
                setAlertData({
                    variant: "error",
                    title: "Unauthorized",
                    message: "Your session has expired or you are not signed in. Please sign in and try again.",
                });
            } else {
                console.error("Create provider failed", { status: response.status, body: result });
                setAlertData({
                    variant: "error",
                    title: "Error",
                    message: (result && (result.message || result.error)) || `Save failed (status ${response.status})`,
                });
            }
        } catch {
            setAlertData({
                variant: "error",
                title: "Error",
                message: "An error occurred while submitting the form.",
            });
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <div>
            {/* Show alert if exists */}
            {alertData && (
                <div className="mb-4">
                    <Alert
                        variant={alertData.variant}
                        title={alertData.title}
                        message={alertData.message}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <PersonalInfo formData={formData} handleChange={handleChange} errors={{}} />
                </div>

                <div className="bg-white p-6 rounded shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                    <ProfessionalInfo formData={formData} handleChange={handleChange} errors={{}} />
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                <Button size="md" variant="primary" onClick={handleSubmit}>
                    Save
                </Button>
                <span className="mx-2"></span>
                <Button size="md" variant="primary" onClick={handleBack}>
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default ProviderRegistrationForm;
