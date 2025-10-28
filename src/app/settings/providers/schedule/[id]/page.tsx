import { Metadata } from "next";
import Schedule from "./Schedule";

export const metadata: Metadata = {
    title: "ScheduleProviders",   // ✅ will render as "Ciyex | providers"
};

export default function Page() {
    return <Schedule/>;
}
