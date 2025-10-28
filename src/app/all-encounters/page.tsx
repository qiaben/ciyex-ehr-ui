
import { Metadata } from "next";
import EncountersTable from "@/components/encounter/EncountersTable";




export const metadata: Metadata = {
    title: "All Encounters",
};




export default function EncountersPage() {
  return (
    <div className="p-4">
      <EncountersTable />
    </div>
  );
}
