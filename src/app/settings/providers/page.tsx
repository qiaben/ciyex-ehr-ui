import { Metadata } from "next";
import ProviderList from "./ProviderList";

export const metadata: Metadata = {
    title: "providers",   // ✅ will render as "Ciyex | providers"
};

export default function Page() {
    return <ProviderList />;
}
