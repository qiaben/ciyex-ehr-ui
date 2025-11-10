import { Metadata } from "next";
import EditReferralPractice from "./EditReferralPractice";

export const metadata: Metadata = {
    title: "Edit Referral Practice",
};

interface PageProps {
    params: {
        id: string;
    };
}

export default function Page({ params }: PageProps) {
    return <EditReferralPractice id={params.id} />;
}
