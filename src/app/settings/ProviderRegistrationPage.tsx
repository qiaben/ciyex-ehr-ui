"use client";
import ProviderRegistrationForm from "@/components/settings/provider-registration/ProviderRegistrationForm";
import AdminLayout from "@/app/(admin)/layout";

export default function ProviderRegistrationPage() {
    return (
        <AdminLayout>
            <div className="flex flex-grow overflow-hidden">
                {/* Your content */}
                <div className="flex-grow p-8 overflow-auto">
                    <h1 className="text-2xl font-semibold mb-6 text-center">Provider</h1>
                    <ProviderRegistrationForm />
                </div>
            </div>
        </AdminLayout>
    );
}