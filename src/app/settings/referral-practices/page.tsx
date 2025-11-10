import { Metadata } from "next";
import ReferralPracticeList from "./ReferralPracticeList";

export const metadata: Metadata = {
    title: "Referral Practices",
};

export default function Page() {
    return <ReferralPracticeList />;
}
