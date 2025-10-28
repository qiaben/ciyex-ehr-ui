import Calendar from "@/components/calendar/Calendar";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Calendar", // will render as "Ciyex | Calendar"
    description: "Manage and schedule appointments in Ciyex",
};
export default function page() {
  return (
    <div>
      <Calendar />
    </div>
  );
}
