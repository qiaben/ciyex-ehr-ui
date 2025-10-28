import { Metadata } from "next";
import ProviderRegistrationPage from "./ProviderRegistrationPage";

export const metadata: Metadata = {
    title: "AddProvider",
};

export default function Page() {
    return <ProviderRegistrationPage />;
}
