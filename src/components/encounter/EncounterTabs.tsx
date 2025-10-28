"use client";
import Link from "next/link";

export default function EncounterTabs({
                                          patientId,
                                          encounterId,
                                      }: {
    patientId: number;
    encounterId: number;
}) {
    const base = `/patients/${patientId}/encounters/${encounterId}`;

    const items: { label: string; href: string }[] = [
        { label: "Chief Complaint", href: `${base}/chief-complaint` },
        { label: "HPI",              href: `${base}/hpi` },
        { label: "ROS",              href: `${base}/ros` },
        { label: "PMH",              href: `${base}/pmh` },
        { label: "FH",               href: `${base}/family-history` },
        { label: "SH",               href: `${base}/social-history` },
        { label: "PE",               href: `${base}/physical-exam` },
        { label: "Assessment",       href: `${base}/assessment` },
        { label: "Plan",             href: `${base}/plan` },
        { label: "Procedures",       href: `${base}/procedures` },
        { label: "Billing/Coding",   href: `${base}/billing-coding` },
        { label: "Assigned Providers", href: `${base}/assigned-providers` },
        { label: "Fee",              href: `${base}/fee-schedule` },
        { label: "Signature",        href: `${base}/provider-signature` },
        { label: "Sign-off",         href: `${base}/signoff` },
        { label: "Finalized",        href: `${base}/datetime-finalized` },
        { label: "provider notes",        href: `${base}/provider-notes` },
        { label: "social",        href: `${base}/social-history` },


    ];

    return (
        <nav className="flex gap-2 overflow-x-auto border-b bg-white p-2 rounded-md">
            {items.map((it) => (
                <Link
                    key={it.href}
                    href={it.href}
                    className="px-3 py-1.5 text-sm rounded-md hover:bg-neutral-100 border"
                >
                    {it.label}
                </Link>
            ))}
        </nav>
    );
}

// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
//
// /**
//  * EncounterTabs — patient encounter navigation styled like the Patient page tabs
//  * (Dashboard, Demographics, Allergies, etc.).
//  *
//  * Drop-in replacement for your existing component.
//  * - Keeps "use client" at the very top.
//  * - Highlights the active tab based on the current pathname.
//  * - Horizontal scroll for overflow.
//  * - Accessible: uses aria-current and focus rings.
//  */
//
// export default function EncounterTabs({
//                                           patientId,
//                                           encounterId,
//                                           sticky = false,
//                                           className = "",
//                                       }: {
//     patientId: number;
//     encounterId: number;
//     /** Optional: make the tab bar sticky */
//     sticky?: boolean;
//     /** Optional: extra classes for the outer <nav> */
//     className?: string;
// }) {
//     const pathname = usePathname();
//     const base = `/patients/${patientId}/encounters/${encounterId}`;
//
//     const items: { label: string; href: string }[] = [
//         { label: "Dashboard", href: base },
//         { label: "Chief Complaint", href: `${base}/chief-complaint` },
//         { label: "HPI", href: `${base}/hpi` },
//         { label: "ROS", href: `${base}/ros` },
//         { label: "PMH", href: `${base}/pmh` },
//         { label: "Family History", href: `${base}/family-history` },
//         { label: "Social History", href: `${base}/social-history` },
//         { label: "Physical Exam", href: `${base}/physical-exam` },
//         { label: "Assessment", href: `${base}/assessment` },
//         { label: "Plan", href: `${base}/plan` },
//         { label: "Procedures", href: `${base}/procedures` },
//         { label: "Assigned Providers", href: `${base}/assigned-providers` },
//         { label: "Billing/Coding", href: `${base}/billing-coding` },
//         { label: "Fee Schedule", href: `${base}/fee-schedule` },
//         { label: "Provider Notes", href: `${base}/provider-notes` },
//         { label: "Provider Signature", href: `${base}/provider-signature` },
//         { label: "Sign-off", href: `${base}/signoff` },
//         { label: "Finalized", href: `${base}/datetime-finalized` },
//     ];
//
//     return (
//         <div className={sticky ? "sticky top-0 z-20 bg-white" : undefined}>
//             <nav
//                 className={
//                     "flex gap-2 overflow-x-auto border-b bg-white p-2 rounded-md " + className
//                 }
//             >
//                 {items.map((it) => {
//                     const isActive =
//                         pathname === it.href || (it.href !== base && pathname.startsWith(it.href));
//                     return (
//                         <Link
//                             key={it.href}
//                             href={it.href}
//                             aria-current={isActive ? "page" : undefined}
//                             data-active={isActive}
//                             className={
//                                 [
//                                     "whitespace-nowrap px-3 py-1.5 text-sm rounded-md border",
//                                     "shadow-[inset_0_0_0_0_transparent] transition-colors",
//                                     "hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
//                                     isActive
//                                         ? "bg-neutral-900 text-white border-neutral-900"
//                                         : "bg-white text-neutral-700",
//                                 ].join(" ")
//                             }
//                         >
//                             {it.label}
//                         </Link>
//                     );
//                 })}
//             </nav>
//         </div>
//     );
// }
//
