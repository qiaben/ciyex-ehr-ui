import { Metadata } from "next";
import PatientEducation from "@/components/patient_education/patienteducation";

export const metadata: Metadata = {
    title: "Patient Education",
};

export default function Page() {
    return <PatientEducation />;
}
