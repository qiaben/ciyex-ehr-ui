import { Metadata } from "next";
import EditReferralProvider from "./EditReferralProvider";

export const metadata: Metadata = {
    title: "Edit Referral Provider",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EditReferralProvider id={id} />;
}
