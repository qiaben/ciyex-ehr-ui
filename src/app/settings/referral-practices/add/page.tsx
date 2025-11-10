import { Metadata } from "next";
import AddReferralPractice from "./AddReferralPractice";

export const metadata: Metadata = {
    title: "Add Referral Practice",
};

export default function Page() {
    return <AddReferralPractice />;
}
