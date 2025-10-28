import { Metadata } from "next";
import Dashboard from "@/components/inventory-management/Dashboard/Dashboard";

export const metadata: Metadata = {
    title: "Inventory Dashboard",
};

export default function Page() {
    return <Dashboard />;
}
