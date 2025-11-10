import { Metadata } from "next";
import ReferralProviderList from "./ReferralProviderList";

export const metadata: Metadata = {
    title: "Referral Providers",
};

export default function Page() {
    return <ReferralProviderList />;
}
