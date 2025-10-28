import { Metadata } from "next";
import EditProviderList from "./EditProviderList";

export const metadata: Metadata = {
    title: "Editproviders",   // ✅ will render as "Ciyex | providers"
};

export default function Page() {
    return <EditProviderList />;
}
