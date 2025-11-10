import { Metadata } from "next";
import AddReferralProvider from "./AddReferralProvider";

export const metadata: Metadata = {
    title: "Add Referral Provider",
};

export default function Page() {
    return <AddReferralProvider />;
}
