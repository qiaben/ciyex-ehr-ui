import { Metadata } from "next";
import EditReferralProvider from "./EditReferralProvider";

export const metadata: Metadata = {
    title: "Edit Referral Provider",
};

export default function Page({ params }: { params: { id: string } }) {
    return <EditReferralProvider id={params.id} />;
}
