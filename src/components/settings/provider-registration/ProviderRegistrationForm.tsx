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
        phoneNumber: string;
    };
}

const ProviderRegistrationForm = () => {
    const [formData, setFormData] = useState({
        fullName: "",
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
            formData.fullName,
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
                firstName: formData.fullName.split(" ")[0],
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
            },
        };

        try {
            const response = await fetchWithAuth(`${apiUrl}/api/providers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });


            const result = await response.json();

            if (response.ok) {
                setAlertData({
                    variant: "success",
                    title: "Success",
                    message: "Provider created successfully!",
                });

                setTimeout(() => {
                    router.push("/settings");
                }, 2000);
            } else {
                setAlertData({
                    variant: "error",
                    title: "Error",
                    message: result.message || "An error occurred.",
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
