





// "use client";

// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { useEffect, useRef, useState, useCallback ,useMemo} from "react";

// // If you already have this helper, keep using it.
// import {fetchWithOrg} from "@/utils/fetchWithOrg";


// import AdminLayout from "@/app/(admin)/layout";

// // Sections
// import AssignedProviderlist from "@/components/encounter/assigned/AssignedProviderlist";
// import Chiefcomplaintlist from "@/components/encounter/cc/Chiefcomplaintlist";
// import Hpilist from "@/components/encounter/hpi/Hpilist";
// import Patientmhlist from "@/components/encounter/pmh/Patientmhlist";
// import Pmhlist from "@/components/encounter/pastmh/Pmhlist";
// import FHlist from "@/components/encounter/familyhistory/FHlist";
// import Shlist from "@/components/encounter/socialhistory/Shlist";
// import Pelist from "@/components/encounter/physicalexam/Pelist";
// import Roslist from "@/components/encounter/ros/Roslist";
// import Procedurelist from "@/components/encounter/procedure/Procedurelist";
// import Codelist from "@/components/encounter/coding/Codelist";
// import Assessmentlist from "@/components/encounter/assessment/Assessmentlist";
// import Planlist from "@/components/encounter/plan/Planlist";
// import Providernotelist from "@/components/encounter/providernote/Providernotelist";
// import Providersignaturecard from "@/components/encounter/providersignature/Providersignaturecard";
// import Signoffcard from "@/components/encounter/signoff/Signoffcard";
// //import Feeschedulecard from "@/components/encounter/fees/Feeschedulecard";
// import DatetimefinalizedCard from "@/components/encounter/datetimefinalized/DatetimefinalizedCard";
// import EncounterSummary from "@/components/encounter/summary/Encountersummary";
// import Vitalslist from "@/components/encounter/Vitals/Vitalslist";


// // (Optional) If you already have this component per your earlier share
// // import EncounterDropdown from "@/components/encounter/EncounterDropdown";

// type EncounterStatus = "SIGNED" | "UNSIGNED" | "INCOMPLETE";

// export default function EncounterTabsPage() {
//     const params = useParams();
//     const router = useRouter();

//     const appointmentId = Number(params?.id);          // /record/appointments/[id]
//     const encounterId = Number(params?.encounterId);   // /encounters/[encounterId]

//     const [activeSection, setActiveSection] = useState<string>("");
//     const [status, setStatus] = useState<EncounterStatus>("UNSIGNED");
//     const [loadingStatus, setLoadingStatus] = useState(false);
//     const summaryRef = useRef<HTMLDivElement | null>(null);

//     // ---- TOC (includes Summary tab) ----

//     const toc = useMemo(
//         () => [
//             { id: "assigned-providers", label: "Assigned Providers" },
//             { id: "chief-complaint", label: "Chief Complaint" },
//             { id: "hpi", label: "History of Present Illness" },
//             { id: "pmh", label: "Patient Medical Hx" },
//             { id: "pastpmh", label: "Past Medical Hx" },
//             { id: "fh", label: "Family History" },
//             { id: "sh", label: "Social History" },
//             { id: "pe", label: "Physical Exam" },
//             { id: "ros", label: "Review of Systems" },
//             { id: "procedures", label: "Procedures" },
//             { id: "codes", label: "Codes" },
//             { id: "assessment", label: "Assessment" },
//             { id: "plan", label: "Plan" },
//             { id: "notes", label: "Provider Notes" },
//             { id: "signature", label: "Provider Signature" },
//             // { id: "fees", label: "Fee Schedule" },
//             { id: "datetime", label: "Date/Time Finalized" },
//             { id: "signoff", label: "Sign-off / Finalize" },
//             { id: "vitals", label: "vitals" },
//             { id: "summary", label: "Summary" },
//         ],
//         []
//     );

// // ---- Load encounter to get current status ----
//     useEffect(() => {
//         if (!encounterId) return;
//         (async () => {
//             try {
//                 const res = await fetchWithOrg(
//                     `${process.env.NEXT_PUBLIC_API_URL}/api/encounters/${encounterId}`
//                 );
//                 if (res.ok) {
//                     const data = await res.json();
//                     if (data?.status) setStatus(data.status as EncounterStatus);
//                 }
//             } catch {
//                 // ignore
//             }
//         })();
//     }, [encounterId]);

// // ---- Highlight active section as you scroll ----
//     useEffect(() => {
//         const observer = new IntersectionObserver(
//             (entries) => {
//                 const visible = entries.find((e) => e.isIntersecting);
//                 if (visible?.target.id) setActiveSection(visible.target.id);
//             },
//             { rootMargin: "-30% 0px -60% 0px", threshold: 0.2 }
//         );

//         toc.forEach((t) => {
//             const el = document.getElementById(t.id);
//             if (el) observer.observe(el);
//         });

//         return () => observer.disconnect();
//     }, [toc]);

//     // ---- Status mutations (Sign / Unsign / Incomplete) ----
//     const updateStatus = useCallback(async (next: EncounterStatus) => {
//         try {
//             setLoadingStatus(true);
//             const res = await fetchWithOrg(
//                 `${process.env.NEXT_PUBLIC_API_URL}/api/encounters/${encounterId}`,
//                 {
//                     method: "PUT",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ status: next }),
//                 }
//             );
//             if (!res.ok) throw new Error("Failed to update status");
//             setStatus(next);
//         } catch (err) {
//             console.error(err);
//             alert("Could not update encounter status. Please try again.");
//         } finally {
//             setLoadingStatus(false);
//         }
//     }, [encounterId]);

//     // ---- Download Summary as PDF (DOM → PDF) ----
//     const downloadSummaryPdf = useCallback(async () => {
//         if (!summaryRef.current) return;
//         const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
//             import("html2canvas"),
//             import("jspdf"),
//         ]);

//         const node = summaryRef.current;
//         const canvas = await html2canvas(node, { scale: 2, useCORS: true });
//         const imgData = canvas.toDataURL("image/png");

//         const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
//         const pageWidth = pdf.internal.pageSize.getWidth();
//         const pageHeight = pdf.internal.pageSize.getHeight();

//         const imgWidth = pageWidth;
//         const imgHeight = (canvas.height * imgWidth) / canvas.width;

//         let heightLeft = imgHeight;
//         let position = 0;

//         pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//         heightLeft -= pageHeight;

//         while (heightLeft > 0) {
//             position = heightLeft - imgHeight;
//             pdf.addPage();
//             pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//             heightLeft -= pageHeight;
//         }

//         pdf.save(`encounter-${encounterId}-summary.pdf`);
//     }, [encounterId]);

//     // Early return after all hooks
//     if (!appointmentId || !encounterId) {
//         return (
//             <AdminLayout>
//                 <div className="p-6 text-center text-red-600">
//                     Missing appointment or encounter id.
//                     <div className="mt-3">
//                         <button
//                             onClick={() => router.push("/patients")}
//                             className="px-3 py-1.5 rounded bg-blue-600 text-white"
//                         >
//                             Back to Patients
//                         </button>
//                     </div>
//                 </div>
//             </AdminLayout>
//         );
//     }

//     // ---- Render ----
//     return (
//         <AdminLayout>
//             {/* Top header with back link & actions (Sign/Incomplete/Unsign) */}
//             <div className="border-b bg-white sticky top-0 z-50">
//                 <div className="max-w-screen-2xl mx-auto px-3 py-2 grid grid-cols-1 md:grid-cols-3 items-center gap-2">
//                     <div className="flex items-center gap-2">
//                         <Link
//                             href={`/record/appointments/${appointmentId}`}
//                             className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-xs font-medium text-gray-700"
//                         >
//                             ← Back
//                         </Link>
//                         <div className="text-sm text-gray-600">
//                             Encounter <span className="font-semibold">#{encounterId}</span>
//                         </div>
//                         <span
//                             className={`ml-2 rounded px-2 py-0.5 text-xs border ${
//                                 status === "SIGNED"
//                                     ? "bg-green-50 text-green-700 border-green-200"
//                                     : status === "INCOMPLETE"
//                                         ? "bg-amber-50 text-amber-700 border-amber-200"
//                                         : "bg-gray-50 text-gray-700 border-gray-200"
//                             }`}
//                             title="Current status"
//                         >
//                             {status}
//                         </span>
//                     </div>

//                     {/* Optional encounter switcher */}
//                     <div className="hidden md:flex justify-center">
//                         {/* Uncomment if you have this component already */}
//                         {/* <EncounterDropdown
//                             appointmentId={appointmentId}
//                             onSelect={(eId) =>
//                                 router.push(`/record/appointments/${appointmentId}/encounters/${eId}`)
//                             }
//                         /> */}
//                     </div>

//                     <div className="flex justify-start md:justify-end items-center gap-2">
//                         <button
//                             className="px-3 py-1.5 rounded bg-green-600 text-white disabled:opacity-60"
//                             disabled={loadingStatus || status === "SIGNED"}
//                             onClick={() => updateStatus("SIGNED")}
//                         >
//                             {loadingStatus && status !== "SIGNED" ? "Saving..." : "Sign"}
//                         </button>
//                         <button
//                             className="px-3 py-1.5 rounded bg-amber-500 text-white disabled:opacity-60"
//                             disabled={loadingStatus || status === "INCOMPLETE"}
//                             onClick={() => updateStatus("INCOMPLETE")}
//                             title="Mark this encounter as Incomplete"
//                         >
//                             Set Incomplete
//                         </button>
//                         <button
//                             className="px-3 py-1.5 rounded bg-gray-600 text-white disabled:opacity-60"
//                             disabled={loadingStatus || status === "UNSIGNED"}
//                             onClick={() => updateStatus("UNSIGNED")}
//                             title="Revert to Un-signed"
//                         >
//                             Unsign
//                         </button>
//                         <button
//                             className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
//                             onClick={downloadSummaryPdf}
//                             title="Download Summary as PDF"
//                         >
//                             Download PDF
//                         </button>
//                     </div>
//                 </div>

//                 {/* Sticky tabs row */}
//                 <div className="bg-white border-t border-b">
//                     <div className="max-w-screen-2xl mx-auto px-3 py-2 flex flex-wrap gap-1 overflow-x-auto">
//                         {toc.map((t) => (
//                             <a
//                                 key={t.id}
//                                 href={`#${t.id}`}
//                                 className={`px-3 py-1.5 rounded-md text-xs font-medium border whitespace-nowrap transition ${
//                                     activeSection === t.id
//                                         ? "bg-blue-600 text-white"
//                                         : "bg-white hover:bg-gray-50 text-gray-700"
//                                 }`}
//                             >
//                                 {t.label}
//                             </a>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Two-column layout: left anchors, right content */}
//             <div className="w-full max-w-screen-2xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
//                 {/* Left anchor list */}
//                 <aside className="hidden lg:block w-[260px]">
//                     <div className="sticky top-[120px] max-h-[calc(100vh-120px)] overflow-auto bg-white rounded-2xl border p-4 shadow-md">
//                         <div className="text-sm font-semibold text-gray-800 mb-2">Sections</div>
//                         <div className="grid gap-1">
//                             {toc.map((t) => (
//                                 <a
//                                     key={t.id}
//                                     href={`#${t.id}`}
//                                     className={`px-2 py-1 rounded-md text-xs border transition ${
//                                         activeSection === t.id
//                                             ? "bg-blue-600 text-white"
//                                             : "bg-gray-50 hover:bg-gray-100 text-gray-700"
//                                     }`}
//                                 >
//                                     {t.label}
//                                 </a>
//                             ))}
//                         </div>
//                     </div>
//                 </aside>

//                 {/* Right main content */}
//                 <main className="min-w-0 space-y-6">
//                     {/* Remaining sections */}
//                     {[
//                         "assigned-providers",
//                         "chief-complaint",
//                         "hpi",
//                         "pmh",
//                         "pastpmh",
//                         "fh",
//                         "sh",
//                         "pe",
//                         "ros",
//                         "procedures",
//                         "codes",
//                         "assessment",
//                         "plan",
//                         "notes",
//                         "signature",
//                         //"fees",
//                         "vitals",
//                         "datetime",
//                         "signoff",
//                         "summary"
//                     ].map((id, index) => (
//                         <section
//                             key={id}
//                             id={id}
//                             aria-label={id}
//                             className={`scroll-mt-[130px] rounded-2xl border shadow-sm p-6 ${
//                                 index % 2 === 0 ? "bg-gray-50" : "bg-white"
//                             }`}
//                             ref={id === "summary" ? summaryRef : undefined}
//                         >
//                             {id === "assigned-providers" && (
//                                 <AssignedProviderlist patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "chief-complaint" && (
//                                 <Chiefcomplaintlist patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "hpi" && <Hpilist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "pmh" && <Patientmhlist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "pastpmh" && <Pmhlist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "fh" && (
//                                 <FHlist patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "sh" && <Shlist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "pe" && <Pelist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "ros" && <Roslist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "procedures" && (
//                                 <Procedurelist patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "codes" && <Codelist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "assessment" && (
//                                 <Assessmentlist patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "plan" && <Planlist patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "notes" && (
//                                 <Providernotelist patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "signature" && (
//                                 <Providersignaturecard patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {/*{id === "fees" && (*/}
//                             {/*    <Feeschedulecard patientId={appointmentId} encounterId={encounterId} />*/}
//                             {/*)}*/}
//                             {id === "datetime" && (
//                                 <DatetimefinalizedCard patientId={appointmentId} encounterId={encounterId} />
//                             )}
//                             {id === "vitals" && (
//                                 <Vitalslist patientId={appointmentId} encounterId={encounterId} />
//                             )}

//                             {id === "signoff" && <Signoffcard patientId={appointmentId} encounterId={encounterId} />}
//                             {id === "summary" && (
//                                 <EncounterSummary
//                                     patientId={appointmentId}
//                                     encounterId={encounterId}
//                                     showDownload={true}   // set false if you don't want a button here
//                                 />
//                             )}
//                         </section>
//                     ))}
//                 </main>
//             </div>
//         </AdminLayout>
//     );

// }

// "use client";

// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";

// import AdminLayout from "@/app/(admin)/layout";

// // Sections
// import AssignedProviderlist from "@/components/encounter/assigned/AssignedProviderlist";
// import Chiefcomplaintlist from "@/components/encounter/cc/Chiefcomplaintlist";
// import Hpilist from "@/components/encounter/hpi/Hpilist";
// import Patientmhlist from "@/components/encounter/pmh/Patientmhlist";
// import Pmhlist from "@/components/encounter/pastmh/Pmhlist";
// import FHlist from "@/components/encounter/familyhistory/FHlist";
// import Shlist from "@/components/encounter/socialhistory/Shlist";
// import Pelist from "@/components/encounter/physicalexam/Pelist";
// import Roslist from "@/components/encounter/ros/Roslist";
// import Procedurelist from "@/components/encounter/procedure/Procedurelist";
// import Codelist from "@/components/encounter/coding/Codelist";
// import Assessmentlist from "@/components/encounter/assessment/Assessmentlist";
// import Planlist from "@/components/encounter/plan/Planlist";
// import Providernotelist from "@/components/encounter/providernote/Providernotelist";
// import Providersignaturecard from "@/components/encounter/providersignature/Providersignaturecard";
// import Signoffcard from "@/components/encounter/signoff/Signoffcard";
// import DatetimefinalizedCard from "@/components/encounter/datetimefinalized/DatetimefinalizedCard";
// import EncounterSummary from "@/components/encounter/summary/Encountersummary";
// import Vitalslist from "@/components/encounter/Vitals/Vitalslist";

// type EncounterStatus = "SIGNED" | "UNSIGNED" | "INCOMPLETE";
// type ApiResponse<T> = { success: boolean; message?: string; data?: T };
// type UnknownJson = Record<string, unknown>;

// export default function EncounterTabsPage() {
//   const params = useParams();
//   const router = useRouter();

//   // URL: /patients/[id]/encounters/[encounterId]
//   const patientId = Number(params?.id);
//   const encounterId = Number(params?.encounterId);

//   const [activeSection, setActiveSection] = useState<string>("");
//   const [status, setStatus] = useState<EncounterStatus>("UNSIGNED");
//   const [loadingStatus, setLoadingStatus] = useState(false);
//   const summaryRef = useRef<HTMLDivElement | null>(null);

//   const toc = useMemo(
//     () => [
//       { id: "assigned-providers", label: "Assigned Providers" },
//       { id: "chief-complaint", label: "Chief Complaint" },
//       { id: "hpi", label: "History of Present Illness" },
//       { id: "pmh", label: "Patient Medical Hx" },
//       { id: "pastpmh", label: "Past Medical Hx" },
//       { id: "fh", label: "Family History" },
//       { id: "sh", label: "Social History" },
//       { id: "pe", label: "Physical Exam" },
//       { id: "ros", label: "Review of Systems" },
//       { id: "procedures", label: "Procedures" },
//       { id: "codes", label: "Codes" },
//       { id: "assessment", label: "Assessment" },
//       { id: "plan", label: "Plan" },
//       { id: "notes", label: "Provider Notes" },
//       { id: "signature", label: "Provider Signature" },
//       { id: "datetime", label: "Date/Time Finalized" },
//       { id: "signoff", label: "Sign-off / Finalize" },
//       { id: "vitals", label: "vitals" },
//       { id: "summary", label: "Summary" },
//     ],
//     []
//   );

//   // base URL memoized
//   const base = useMemo(
//     () => `${process.env.NEXT_PUBLIC_API_URL}/api/${patientId}/encounters`,
//     [patientId]
//   );

//   // orgId read once on client
//   const orgId = useMemo(() => {
//     if (typeof window === "undefined") return undefined;
//     return (localStorage.getItem("orgId") || sessionStorage.getItem("orgId")) ?? undefined;
//   }, []);

//   // attach orgId header
//   const withOrgId = useCallback(
//     (h?: HeadersInit): HeadersInit => {
//       const baseHeaders: Record<string, string> = {};
//       if (orgId) baseHeaders["orgId"] = String(orgId);
//       return { ...baseHeaders, ...(h as Record<string, string>) };
//     },
//     [orgId]
//   );

//   // tiny helper to parse JSON without "any"
//   const safeJson = useCallback(async (res: Response): Promise<unknown> => {
//     try {
//       return await res.json();
//     } catch {
//       return {};
//     }
//   }, []);

//   // ---- Load current encounter to get status ----
//   useEffect(() => {
//     if (!patientId || !encounterId) return;
//     (async () => {
//       try {
//         const res = await fetchWithOrg(`${base}/${encounterId}`, { headers: withOrgId() });
//         const raw = (await safeJson(res)) as UnknownJson | ApiResponse<UnknownJson>;
//         const dto =
//           (raw as ApiResponse<UnknownJson>)?.data ??
//           (raw as UnknownJson);

//         const maybeStatus = (dto as UnknownJson)?.["status"];
//         if (typeof maybeStatus === "string") {
//           setStatus(maybeStatus as EncounterStatus);
//         }
//       } catch {
//         /* ignore */
//       }
//     })();
//   }, [patientId, encounterId, base, withOrgId, safeJson]);

//   // ---- Highlight active section when scrolling ----
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         const visible = entries.find((e) => e.isIntersecting);
//         if (visible?.target.id) setActiveSection(visible.target.id);
//       },
//       { rootMargin: "-30% 0px -60% 0px", threshold: 0.2 }
//     );

//     toc.forEach((t) => {
//       const el = document.getElementById(t.id);
//       if (el) observer.observe(el);
//     });

//     return () => observer.disconnect();
//   }, [toc]);

//   // ---- Status mutations (POST /sign | /unsign | /incomplete) ----
//   const postStatus = useCallback(
//     async (action: "sign" | "unsign" | "incomplete", next: EncounterStatus) => {
//       try {
//         setLoadingStatus(true);
//         const res = await fetchWithOrg(`${base}/${encounterId}/${action}`, {
//           method: "POST",
//           headers: withOrgId({ "Content-Type": "application/json" }),
//         });

//         const raw = (await safeJson(res)) as UnknownJson | ApiResponse<unknown>;
//         const ok =
//           res.ok &&
//           (typeof (raw as ApiResponse<unknown>)?.success === "boolean"
//             ? (raw as ApiResponse<unknown>).success
//             : true);

//         if (!ok) {
//           const msg =
//             (raw as ApiResponse<unknown>)?.message ??
//             (raw as UnknownJson)?.["message"] ??
//             "Failed";
//           throw new Error(String(msg));
//         }

//         setStatus(next);
//       } catch (err) {
//         console.error(err);
//         alert("Could not update encounter status. Please try again.");
//       } finally {
//         setLoadingStatus(false);
//       }
//     },
//     [base, encounterId, withOrgId, safeJson]
//   );

//   // ---- Download Summary as PDF (DOM → PDF) ----
//   const downloadSummaryPdf = useCallback(async () => {
//     if (!summaryRef.current) return;
//     const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
//       import("html2canvas"),
//       import("jspdf"),
//     ]);

//     const node = summaryRef.current;
//     const canvas = await html2canvas(node, { scale: 2, useCORS: true });
//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     const imgWidth = pageWidth;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     let heightLeft = imgHeight;
//     let position = 0;

//     pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//     heightLeft -= pageHeight;

//     while (heightLeft > 0) {
//       position = heightLeft - imgHeight;
//       pdf.addPage();
//       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//       heightLeft -= pageHeight;
//     }

//     pdf.save(`encounter-${encounterId}-summary.pdf`);
//   }, [encounterId]);

//   if (!patientId || !encounterId) {
//     return (
//       <AdminLayout>
//         <div className="p-6 text-center text-red-600">
//           Missing patient or encounter id.
//           <div className="mt-3">
//             <button
//               onClick={() => router.push("/patients")}
//               className="px-3 py-1.5 rounded bg-blue-600 text-white"
//             >
//               Back to Patients
//             </button>
//           </div>
//         </div>
//       </AdminLayout>
//     );
//   }

//   return (
//     <AdminLayout>
//       {/* Top header with back link & actions */}
//       <div className="border-b bg-white sticky top-0 z-50">
//         <div className="max-w-screen-2xl mx-auto px-3 py-2 grid grid-cols-1 md:grid-cols-3 items-center gap-2">
//           <div className="flex items-center gap-2">
//             <Link
//               href={`/patients/${patientId}`}
//               className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-xs font-medium text-gray-700"
//             >
//               ← Back
//             </Link>
//             <div className="text-sm text-gray-600">
//               Encounter <span className="font-semibold">#{encounterId}</span>
//             </div>
//             <span
//               className={`ml-2 rounded px-2 py-0.5 text-xs border ${
//                 status === "SIGNED"
//                   ? "bg-green-50 text-green-700 border-green-200"
//                   : status === "INCOMPLETE"
//                   ? "bg-amber-50 text-amber-700 border-amber-200"
//                   : "bg-gray-50 text-gray-700 border-gray-200"
//               }`}
//               title="Current status"
//             >
//               {status}
//             </span>
//           </div>

//           <div className="hidden md:flex justify-center" />

//           <div className="flex justify-start md:justify-end items-center gap-2">
//             <button
//               className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
//               disabled={loadingStatus || status === "SIGNED"}
//               onClick={() => postStatus("sign", "SIGNED")}
//             >
//               {loadingStatus && status !== "SIGNED" ? "Saving..." : "Sign"}
//             </button>
//             {/* <button
//               className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
//               disabled={loadingStatus || status === "INCOMPLETE"}
//               onClick={() => postStatus("incomplete", "INCOMPLETE")}
//               title="Mark this encounter as Incomplete"
//             >
//               Set Incomplete
//             </button> */}
//             <button
//               className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
//               disabled={loadingStatus || status === "UNSIGNED"}
//               onClick={() => postStatus("unsign", "UNSIGNED")}
//               title="Revert to Un-signed"
//             >
//               Unsign
//             </button>
//             <button
//               className="px-3 py-1.5 rounded bg-blue-700 text-white disabled:opacity-60"
//               onClick={downloadSummaryPdf}
//               title="Download Summary as PDF"
//             >
//               Print
//             </button>
//           </div>
//         </div>

//         {/* Sticky tabs row */}
//         <div className="bg-white border-t border-b">
//           <div className="max-w-screen-2xl mx-auto px-3 py-2 flex flex-wrap gap-1 overflow-x-auto">
//             {toc.map((t) => (
//               <a
//                 key={t.id}
//                 href={`#${t.id}`}
//                 className={`px-3 py-1.5 rounded-md text-xs font-medium border whitespace-nowrap transition ${
//                   activeSection === t.id
//                     ? "bg-blue-600 text-white"
//                     : "bg-white hover:bg-gray-50 text-gray-700"
//                 }`}
//               >
//                 {t.label}
//               </a>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Two-column layout: left anchors, right content */}
//       <div className="w-full max-w-screen-2xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
//         {/* Left anchor list */}
//         <aside className="hidden lg:block w-[260px]">
//           <div className="sticky top-[120px] max-h-[calc(100vh-120px)] overflow-auto bg-white rounded-2xl border p-4 shadow-md">
//             <div className="text-sm font-semibold text-gray-800 mb-2">Sections</div>
//             <div className="grid gap-1">
//               {toc.map((t) => (
//                 <a
//                   key={t.id}
//                   href={`#${t.id}`}
//                   className={`px-2 py-1 rounded-md text-xs border transition ${
//                     activeSection === t.id
//                       ? "bg-blue-600 text-white"
//                       : "bg-gray-50 hover:bg-gray-100 text-gray-700"
//                   }`}
//                 >
//                   {t.label}
//                 </a>
//               ))}
//             </div>
//           </div>
//         </aside>

//         {/* Right main content */}
//         <main className="min-w-0 space-y-6">
//           {[
//             "assigned-providers",
//             "chief-complaint",
//             "hpi",
//             "pmh",
//             "pastpmh",
//             "fh",
//             "sh",
//             "pe",
//             "ros",
//             "procedures",
//             "codes",
//             "assessment",
//             "plan",
//             "notes",
//             "signature",
//             "vitals",
//             "datetime",
//             "signoff",
//             "summary",
//           ].map((id, index) => (
//             <section
//               key={id}
//               id={id}
//               aria-label={id}
//               className={`scroll-mt-[130px] rounded-2xl border shadow-sm p-6 ${
//                 index % 2 === 0 ? "bg-gray-50" : "bg-white"
//               }`}
//               ref={id === "summary" ? summaryRef : undefined}
//             >
//               {id === "assigned-providers" && (
//                 <AssignedProviderlist patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "chief-complaint" && (
//                 <Chiefcomplaintlist patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "hpi" && <Hpilist patientId={patientId} encounterId={encounterId} />}
//               {id === "pmh" && <Patientmhlist patientId={patientId} encounterId={encounterId} />}
//               {id === "pastpmh" && <Pmhlist patientId={patientId} encounterId={encounterId} />}
//               {id === "fh" && <FHlist patientId={patientId} encounterId={encounterId} />}
//               {id === "sh" && <Shlist patientId={patientId} encounterId={encounterId} />}
//               {id === "pe" && <Pelist patientId={patientId} encounterId={encounterId} />}
//               {id === "ros" && <Roslist patientId={patientId} encounterId={encounterId} />}
//               {id === "procedures" && (
//                 <Procedurelist patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "codes" && <Codelist patientId={patientId} encounterId={encounterId} />}
//               {id === "assessment" && (
//                 <Assessmentlist patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "plan" && <Planlist patientId={patientId} encounterId={encounterId} />}
//               {id === "notes" && (
//                 <Providernotelist patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "signature" && (
//                 <Providersignaturecard patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "vitals" && <Vitalslist patientId={patientId} encounterId={encounterId} />}
//               {id === "datetime" && (
//                 <DatetimefinalizedCard patientId={patientId} encounterId={encounterId} />
//               )}
//               {id === "signoff" && <Signoffcard patientId={patientId} encounterId={encounterId} />}
//               {id === "summary" && (
//                 <EncounterSummary
//                   patientId={patientId}
//                   encounterId={encounterId}
//                   showDownload={true}
//                 />
//               )}
//             </section>
//           ))}
//         </main>
//       </div>
//     </AdminLayout>
//   );
// }



"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import { fetchWithAuth } from "@/utils/fetchWithAuth";


import AdminLayout from "@/app/(admin)/layout";

// Sections
import AssignedProviderlist from "@/components/encounter/assigned/AssignedProviderlist";
import Chiefcomplaintlist from "@/components/encounter/cc/Chiefcomplaintlist";
import Hpilist from "@/components/encounter/hpi/Hpilist";
import Patientmhlist from "@/components/encounter/pmh/Patientmhlist";
import Pmhlist from "@/components/encounter/pastmh/Pmhlist";
import FHlist from "@/components/encounter/familyhistory/FHlist";
import Shlist from "@/components/encounter/socialhistory/Shlist";
import Pelist from "@/components/encounter/physicalexam/Pelist";
import Roslist from "@/components/encounter/ros/Roslist";
import Procedurelist from "@/components/encounter/procedure/Procedurelist";
import Codelist from "@/components/encounter/coding/Codelist";
import Assessmentlist from "@/components/encounter/assessment/Assessmentlist";
import Planlist from "@/components/encounter/plan/Planlist";
import Providernotelist from "@/components/encounter/providernote/Providernotelist";
import Providersignaturecard from "@/components/encounter/providersignature/Providersignaturecard";
import Signoffcard from "@/components/encounter/signoff/Signoffcard";
import DatetimefinalizedCard from "@/components/encounter/datetimefinalized/DatetimefinalizedCard";
import EncounterSummary from "@/components/encounter/summary/Encountersummary";
import Vitalslist from "@/components/encounter/Vitals/Vitalslist";

type EncounterStatus = "SIGNED" | "UNSIGNED" | "INCOMPLETE";
type ApiResponse<T> = { success: boolean; message?: string; data?: T };
type UnknownJson = Record<string, unknown>;

export default function EncounterTabsPage() {
  const params = useParams();
  const router = useRouter();

  // URL: /patients/[id]/encounters/[encounterId]
  const patientId = Number(params?.id);
  const encounterId = Number(params?.encounterId);

  const [activeSection, setActiveSection] = useState<string>("");
  const [status, setStatus] = useState<EncounterStatus>("UNSIGNED");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [patient, setPatient] = useState<{
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
} | null>(null);

// small local formatter
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString() : "");

  const toc = useMemo(
    () => [
      { id: "assigned-providers", label: "Assigned Providers" },
      { id: "chief-complaint", label: "Chief Complaint" },
      { id: "hpi", label: "History of Present Illness" },
      { id: "pmh", label: "Patient Medical Hx" },
      { id: "pastpmh", label: "Past Medical Hx" },
      { id: "fh", label: "Family History" },
      { id: "sh", label: "Social History" },
      { id: "pe", label: "Physical Exam" },
      { id: "ros", label: "Review of Systems" },
      { id: "procedures", label: "Procedures" },
      { id: "codes", label: "Codes" },
      { id: "assessment", label: "Assessment" },
      { id: "plan", label: "Plan" },
      { id: "notes", label: "Provider Notes" },
      { id: "signature", label: "Provider Signature" },
      { id: "datetime", label: "Date/Time Finalized" },
      { id: "signoff", label: "Sign-off / Finalize" },
      { id: "vitals", label: "vitals" },
      { id: "summary", label: "Summary" },
    ],
    []
  );

  // base URL memoized
  const base = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/api/${patientId}/encounters`,
    [patientId]
  );

  // orgId read once on client
  const orgId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (localStorage.getItem("orgId") || sessionStorage.getItem("orgId")) ?? undefined;
  }, []);

  // attach orgId header
  const withOrgId = useCallback(
    (h?: HeadersInit): HeadersInit => {
      const baseHeaders: Record<string, string> = {};
      if (orgId) baseHeaders["orgId"] = String(orgId);
      return { ...baseHeaders, ...(h as Record<string, string>) };
    },
    [orgId]
  );

  // safe JSON
  const safeJson = useCallback(async (res: Response): Promise<unknown> => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }, []);

  // ---- Load current encounter to get status ----
  useEffect(() => {
    if (!patientId || !encounterId) return;
    (async () => {
      try {
        const res = await fetchWithOrg(`${base}/${encounterId}`, { headers: withOrgId() });
        const raw = (await safeJson(res)) as UnknownJson | ApiResponse<UnknownJson>;
        const dto = (raw as ApiResponse<UnknownJson>)?.data ?? (raw as UnknownJson);
        const maybeStatus = (dto as UnknownJson)?.["status"];
        if (typeof maybeStatus === "string") setStatus(maybeStatus as EncounterStatus);
      } catch {
        /* ignore */
      }
    })();
  }, [patientId, encounterId, base, withOrgId, safeJson]);

  // ---- Highlight active section when scrolling ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0.2 }
    );

    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

// useEffect(() => {
//   if (!patientId || !encounterId) return;

//   (async () => {
//     try {
//       // current encounter (kept as-is)
//       const res = await fetchWithOrg(`${base}/${encounterId}`, { headers: withOrgId() });
//       const raw = (await safeJson(res)) as UnknownJson | ApiResponse<UnknownJson>;
//       const dto = (raw as ApiResponse<UnknownJson>)?.data ?? (raw as UnknownJson);
//       const maybeStatus = (dto as UnknownJson)?.["status"];
//       if (typeof maybeStatus === "string") setStatus(maybeStatus as EncounterStatus);
//     } catch {/* ignore */ }

//     try {
//       // 👉 fetch the patient for name & DOB
//       const pres = await fetchWithAuth(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/patients/${patientId}`,
//         { headers: withOrgId() }
//       );
//       const pbody = (await safeJson(pres)) as UnknownJson | ApiResponse<UnknownJson>;
//       const pdata = (pbody as ApiResponse<UnknownJson>)?.data ?? (pbody as UnknownJson);
//       setPatient({
//         firstName: String((pdata as any)?.firstName ?? ""),
//         lastName: String((pdata as any)?.lastName ?? ""),
//         dateOfBirth: (pdata as any)?.dateOfBirth as string | undefined,
//       });
//     } catch {/* ignore */}
//   })();
// }, [patientId, encounterId, base, withOrgId, safeJson]);


useEffect(() => {
  if (!patientId || !encounterId) return;

  (async () => {
    try {
      // current encounter (kept as-is)
      const res = await fetchWithOrg(`${base}/${encounterId}`, { headers: withOrgId() });
      const raw = (await safeJson(res)) as UnknownJson | ApiResponse<UnknownJson>;
      const dto = (raw as ApiResponse<UnknownJson>)?.data ?? (raw as UnknownJson);
      const maybeStatus = (dto as UnknownJson)?.["status"];
      if (typeof maybeStatus === "string") setStatus(maybeStatus as EncounterStatus);
    } catch {
      /* ignore */
    }

    try {
      // 👉 fetch the patient for name & DOB
      const pres = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patients/${patientId}`,
        { headers: withOrgId() }
      );
      const pbody = (await safeJson(pres)) as UnknownJson | ApiResponse<UnknownJson>;
      const pdata = (pbody as ApiResponse<UnknownJson>)?.data ?? (pbody as UnknownJson);

      // instead of (pdata as any), assert it as UnknownJson
      const patientJson = pdata as UnknownJson;

      setPatient({
        firstName: typeof patientJson.firstName === "string" ? patientJson.firstName : "",
        lastName: typeof patientJson.lastName === "string" ? patientJson.lastName : "",
        dateOfBirth:
          typeof patientJson.dateOfBirth === "string" ? patientJson.dateOfBirth : undefined,
      });
    } catch {
      /* ignore */
    }
  })();
}, [patientId, encounterId, base, withOrgId, safeJson]);









  // ---- Status mutations (POST /sign | /unsign) ----
  const postStatus = useCallback(
    async (action: "sign" | "unsign" | "incomplete", next: EncounterStatus) => {
      try {
        setLoadingStatus(true);
        const res = await fetchWithOrg(`${base}/${encounterId}/${action}`, {
          method: "POST",
          headers: withOrgId({ "Content-Type": "application/json" }),
        });

        const raw = (await safeJson(res)) as UnknownJson | ApiResponse<unknown>;
        const ok =
          res.ok &&
          (typeof (raw as ApiResponse<unknown>)?.success === "boolean"
            ? (raw as ApiResponse<unknown>).success
            : true);

        if (!ok) {
          const msg =
            (raw as ApiResponse<unknown>)?.message ??
            (raw as UnknownJson)?.["message"] ??
            "Failed";
          throw new Error(String(msg));
        }

        setStatus(next);
      } catch (err) {
        console.error(err);
        alert("Could not update encounter status. Please try again.");
      } finally {
        setLoadingStatus(false);
      }
    },
    [base, encounterId, withOrgId, safeJson]
  );

  // ---- Download Summary as PDF (DOM → PDF) ----
  const downloadSummaryPdf = useCallback(async () => {
    if (!summaryRef.current) return;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const node = summaryRef.current;
    const canvas = await html2canvas(node, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`encounter-${encounterId}-summary.pdf`);
  }, [encounterId]);

  if (!patientId || !encounterId) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-red-600">
          Missing patient or encounter id.
          <div className="mt-3">
            <button
              onClick={() => router.push("/patients")}
              className="px-3 py-1.5 rounded bg-blue-600 text-white"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Top header with back link & actions */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-3 py-2 grid grid-cols-1 md:grid-cols-3 items-center gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/patients/${patientId}`}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-xs font-medium text-gray-700"
            >
              ← Back
            </Link>
            <div className="text-sm text-gray-600">
              Encounter <span className="font-semibold">#{encounterId}</span>
            </div>
            <span
              className={`ml-2 rounded px-2 py-0.5 text-xs border ${
                status === "SIGNED"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : status === "INCOMPLETE"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
              title="Current status"
            >
              {status}
            </span>
             {patient && (
    <span className="ml-3 text-xs text-gray-700">
      {patient.firstName} {patient.lastName}
      {patient.dateOfBirth ? `  ${fmt(patient.dateOfBirth)}` : ""}
    </span>
  )}
          </div>

          <div className="hidden md:flex justify-center" />

          <div className="flex justify-start md:justify-end items-center gap-2">
            <button
              className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
              disabled={loadingStatus || status === "SIGNED"}
              onClick={() => postStatus("sign", "SIGNED")}
            >
              {loadingStatus && status !== "SIGNED" ? "Saving..." : "Sign"}
            </button>

            <button
              className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
              disabled={loadingStatus || status === "UNSIGNED"}
              onClick={() => postStatus("unsign", "UNSIGNED")}
              title="Revert to Un-signed"
            >
              Unsign
            </button>
            <button
              className="px-3 py-1.5 rounded bg-blue-700 text-white disabled:opacity-60"
              onClick={downloadSummaryPdf}
              title="Download Summary as PDF"
            >
              Print
            </button>
          </div>
        </div>

        {/* Sticky tabs row */}
        <div className="bg-white border-t border-b">
          <div className="max-w-screen-2xl mx-auto px-3 py-2 flex flex-wrap gap-1 overflow-x-auto">
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border whitespace-nowrap transition ${
                  activeSection === t.id
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Single-column content (sidebar removed) */}
      <div className="w-full max-w-screen-2xl mx-auto p-4">
        <main className="min-w-0 space-y-6">
          {[
            "assigned-providers",
            "chief-complaint",
            "hpi",
            "pmh",
            "pastpmh",
            "fh",
            "sh",
            "pe",
            "ros",
            "procedures",
            "codes",
            "assessment",
            "plan",
            "notes",
            "signature",
            "vitals",
            "datetime",
            "signoff",
            "summary",
          ].map((id, index) => (
            <section
              key={id}
              id={id}
              aria-label={id}
              className={`scroll-mt-[130px] rounded-2xl border shadow-sm p-6 ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
              ref={id === "summary" ? summaryRef : undefined}
            >
              {id === "assigned-providers" && (
                <AssignedProviderlist patientId={patientId} encounterId={encounterId} />
              )}
              {id === "chief-complaint" && (
                <Chiefcomplaintlist patientId={patientId} encounterId={encounterId} />
              )}
              {id === "hpi" && <Hpilist patientId={patientId} encounterId={encounterId} />}
              {id === "pmh" && <Patientmhlist patientId={patientId} encounterId={encounterId} />}
              {id === "pastpmh" && <Pmhlist patientId={patientId} encounterId={encounterId} />}
              {id === "fh" && <FHlist patientId={patientId} encounterId={encounterId} />}
              {id === "sh" && <Shlist patientId={patientId} encounterId={encounterId} />}
              {id === "pe" && <Pelist patientId={patientId} encounterId={encounterId} />}
              {id === "ros" && <Roslist patientId={patientId} encounterId={encounterId} />}
              {id === "procedures" && (
                <Procedurelist patientId={patientId} encounterId={encounterId} />
              )}
              {id === "codes" && <Codelist patientId={patientId} encounterId={encounterId} />}
              {id === "assessment" && (
                <Assessmentlist patientId={patientId} encounterId={encounterId} />
              )}
              {id === "plan" && <Planlist patientId={patientId} encounterId={encounterId} />}
              {id === "notes" && (
                <Providernotelist patientId={patientId} encounterId={encounterId} />
              )}
              {id === "signature" && (
                <Providersignaturecard patientId={patientId} encounterId={encounterId} />
              )}
              {id === "vitals" && <Vitalslist patientId={patientId} encounterId={encounterId} />}
              {id === "datetime" && (
                <DatetimefinalizedCard patientId={patientId} encounterId={encounterId} />
              )}
              {id === "signoff" && <Signoffcard patientId={patientId} encounterId={encounterId} />}
              {id === "summary" && (
                <EncounterSummary
                  patientId={patientId}
                  encounterId={encounterId}
                  showDownload={true}
                />
              )}
            </section>
          ))}
        </main>
      </div>
    </AdminLayout>
  );
}
