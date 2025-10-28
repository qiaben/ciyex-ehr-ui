"use client";
import React from "react";

interface ProfessionalInfoFormData {
    providerType: string;
    specialty: string;
    licenseNumber: string;
    npiNumber: string;
    licenseExpiry: string;
    licenseState: string;
}
interface ProfessionalInfoProps {
    formData: ProfessionalInfoFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    errors?: Partial<Record<keyof ProfessionalInfoFormData, string>>;
}


const ProfessionalInfo: React.FC<ProfessionalInfoProps> = ({ formData, handleChange, errors = {} }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Type Input */}
            <div>
                <label htmlFor="providerType" className="block text-sm font-medium text-gray-700">Provider Type</label>
                <input
                    type="text"
                    id="providerType"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your provider type"
                />
                {errors.providerType && <p className="text-red-500 text-xs">{errors.providerType}</p>}
            </div>

            {/* Specialty Input */}
            <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Specialty</label>
                <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your specialty"
                />
                {errors.specialty && <p className="text-red-500 text-xs">{errors.specialty}</p>}
            </div>

            {/* License Number Input */}
            <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">License Number</label>
                <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your license number"
                />
                {errors.licenseNumber && <p className="text-red-500 text-xs">{errors.licenseNumber}</p>}
            </div>

            {/* NPI Number Input (Replacing Fax Number) */}
            <div>
                <label htmlFor="npiNumber" className="block text-sm font-medium text-gray-700">NPI Number</label>
                <input
                    type="text"
                    id="npiNumber"
                    name="npiNumber"  // This should match the field in formData
                    value={formData.npiNumber || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your NPI number"
             />
                    {errors.npiNumber && <p className="text-red-500 text-xs">{errors.npiNumber}</p>}
            </div>

            {/* License Expiry Input */}
            <div>
                <label htmlFor="licenseExpiry" className="block text-sm font-medium text-gray-700">License Expiry</label>
                <input
                    type="date"
                    id="licenseExpiry"
                    name="licenseExpiry"
                    value={formData.licenseExpiry}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.licenseExpiry && <p className="text-red-500 text-xs">{errors.licenseExpiry}</p>}
            </div>

            {/* License State Input */}
            <div>
                <label htmlFor="licenseState" className="block text-sm font-medium text-gray-700">License State</label>
                <input
                    type="text"
                    id="licenseState"
                    name="licenseState"
                    value={formData.licenseState}
                    onChange={handleChange}
                    placeholder="Enter State"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.licenseState && <p className="text-red-500 text-xs">{errors.licenseState}</p>}
            </div>
        </div>
    );
};

export default ProfessionalInfo;
