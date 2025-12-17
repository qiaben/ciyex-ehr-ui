import { Metadata } from "next";
import EditReferralPractice from "./EditReferralPractice";

export const metadata: Metadata = {
    title: "Edit Referral Practice",
};

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <EditReferralPractice id={id} />;
}
