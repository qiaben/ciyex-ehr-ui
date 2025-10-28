




// "use client";
// import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
// import AdminLayout from "@/app/(admin)/layout";
// import { fetchWithAuth } from "@/utils/fetchWithAuth";
// import { NotebookPen, Scissors, Activity } from "lucide-react";

// // drawer content
// import ProviderNoteList from "@/components/encounter/providernote/Providernotelist";
// import ProcedureList from "@/components/encounter/procedure/Procedurelist";
// import VitalsList from "@/components/encounter/Vitals/Vitalslist";

// export type AppointmentDTO = {
//   id: number;
//   visitType: string;
//   patientId: number; // still used for MRN
//   providerId: number;
//   appointmentStartDate: string;
//   appointmentEndDate: string;
//   appointmentStartTime: string;
//   appointmentEndTime: string;
//   priority: string;
//   locationId: number;
//   status: string;
//   reason: string;
//   orgId: number;
//   patientName?: string; // resolved from patient API
//   audit: {
//     createdDate: string;
//     lastModifiedDate: string;
//   };
// };

// interface Category { title: string; optionName: string; activity?: number; }
// interface Provider { id: number; name: string; }
// interface Location { id: number; name: string; }

// interface FullscreenElement extends HTMLElement {
//   webkitRequestFullscreen?: () => Promise<void>;
//   msRequestFullscreen?: () => Promise<void>;
// }

// type DrawerSection = "notes" | "procedures" | "vitals";

// const pad = (n: number) => n.toString().padStart(2, "0");

// function formatToMMDDYYYY(iso: string): string {
//   if (!iso) return "";
//   const d = new Date(iso + "T00:00:00");
//   if (isNaN(d.getTime())) return iso;
//   return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
// }
// function parseMMDDYYYY(s: string): string | null {
//   if (!s) return null;
//   const parts = s.split("/");
//   if (parts.length !== 3) return null;
//   const [mmStr, ddStr, yyyyStr] = parts;
//   const mm = parseInt(mmStr, 10);
//   const dd = parseInt(ddStr, 10);
//   const yyyy = parseInt(yyyyStr, 10);
//   if (Number.isNaN(mm) || Number.isNaN(dd) || Number.isNaN(yyyy)) return null;
//   const d = new Date(Date.UTC(yyyy, mm - 1, dd));
//   if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) return null;
//   return `${yyyy}-${pad(mm)}-${pad(dd)}`;
// }
// function timeFromMMDDYYYY(s: string, fallback: number): number {
//   const iso = parseMMDDYYYY(s);
//   return iso ? new Date(iso).getTime() : fallback;
// }

// const fetchPatientName = async (id: number): Promise<string> => {
//   try {
//     const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${id}`);
//     if (!res.ok) return String(id);
//     const data = await res.json();
//     return `${data.data.firstName} ${data.data.lastName}`;
//   } catch {
//     return String(id);
//   }
// };

// /** Right-side drawer (frame only) */
// function Drawer({
//   open,
//   onClose,
//   title,
//   children,
// }: {
//   open: boolean;
//   onClose: () => void;
//   title: React.ReactNode;
//   children: React.ReactNode;
// }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex">
//       <div className="flex-1 bg-black/40" onClick={onClose} />
//       <div className="w-[800px] max-w-full bg-white dark:bg-slate-900 shadow-xl p-6 overflow-y-auto animate-slideInRight">
//         <button className="mb-4 text-sm text-gray-500 hover:text-gray-700" onClick={onClose}>
//           ✕ Close
//         </button>
//         <h2 className="text-lg font-semibold mb-4">{title}</h2>
//         {children}
//       </div>
//     </div>
//   );
// }

// export default function AppointmentPage() {
//   const [category, setCategory] = useState<string>("All Visit Categories");
//   const [categories, setCategories] = useState<string[]>([]);
//   const [provider, setProvider] = useState<string>("All Providers");
//   const [providers, setProviders] = useState<Provider[]>([]);
//   const [location, setLocation] = useState<string>("All Locations");
//   const [locations, setLocations] = useState<Location[]>([]);
//   const [from, setFrom] = useState<string>("");
//   const [to, setTo] = useState<string>("");
//   const [patientName, setPatientName] = useState("");
//   const [rows, setRows] = useState<AppointmentDTO[]>([]);

//   const [loadingProviders, setLoadingProviders] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [loadingLocations, setLoadingLocations] = useState(true);
//   const [loadingAppointments, setLoadingAppointments] = useState(false);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const tableRef = useRef<HTMLDivElement>(null);

//   // NEW — status filter & inline status edit
//   const [statusFilter, setStatusFilter] = useState<string>("All");
//   const [editingStatusId, setEditingStatusId] = useState<number | null>(null);

//   // drawer state
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [selectedRow, setSelectedRow] = useState<AppointmentDTO | null>(null);
//   const [activeSection, setActiveSection] = useState<DrawerSection>("notes");

//   // Visit Categories (active only)
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/list-options/list/Visit Type`);
//         if (!res.ok) throw new Error("Failed to fetch categories");
//         const data = await res.json();
//         const active = (data as Category[]).filter((c) => c.activity === 1).map((c) => c.title || c.optionName);
//         setCategories(active);
//       } catch { setCategories([]); }
//       finally { setLoadingCategories(false); }
//     };
//     fetchCategories();
//   }, []);

//   // Providers
//   useEffect(() => {
//     const fetchProviders = async () => {
//       try {
//         const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/providers`);
//         if (!res.ok) throw new Error("Failed to fetch providers");
//         const data = await res.json();
//         const list: Provider[] = data.data.map((p: { id: number; identification: { firstName: string; lastName: string } }) => ({
//           id: p.id,
//           name: `${p.identification.firstName} ${p.identification.lastName}`,
//         }));
//         setProviders(list);
//       } catch { setProviders([]); }
//       finally { setLoadingProviders(false); }
//     };
//     fetchProviders();
//   }, []);

//   // Locations
//   useEffect(() => {
//     const fetchLocations = async () => {
//       try {
//         const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/locations`);
//         if (!res.ok) throw new Error("Failed to fetch locations");
//         const data = await res.json();
//         const list: Location[] = data.data.map((l: { id: number; name: string }) => ({ id: l.id, name: l.name }));
//         setLocations(list);
//       } catch { setLocations([]); }
//       finally { setLoadingLocations(false); }
//     };
//     fetchLocations();
//   }, []);

//   // Default date range: last month -> today
//   useEffect(() => {
//     const today = new Date();
//     const lastMonth = new Date(today);
//     lastMonth.setMonth(today.getMonth() - 1);
//     const fmt = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
//     setFrom(fmt(lastMonth));
//     setTo(fmt(today));
//   }, []);

//   // ---- Appointments loader ----
//   const loadAppointments = useCallback(async () => {
//     setLoadingAppointments(true);
//     try {
//       // include status filter when not "All"
//       const params = new URLSearchParams({
//         page: String(currentPage - 1),
//         size: String(pageSize),
//       });
//       if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);

//       const res = await fetchWithAuth(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/appointments?${params.toString()}`
//       );
//       if (!res.ok) throw new Error("Failed to fetch appointments");
//       const data = await res.json();

//       // Support both: { data: { content, totalPages, totalElements } }
//       // and legacy:  { data: { content }, totalPages in data.data }
//       const payload = data?.data ?? {};
//       const content: AppointmentDTO[] = payload.content ?? payload?.data?.content ?? [];
//       const totalPagesVal = payload.totalPages ?? data?.data?.totalPages ?? 1;
//       const totalElementsVal = payload.totalElements ?? data?.data?.totalElements ?? content.length;

//       if (content && Array.isArray(content)) {
//         const enriched = await Promise.all(
//           content.map(async (appt: AppointmentDTO) => {
//             const name = await fetchPatientName(appt.patientId);
//             return { ...appt, patientName: name };
//           })
//         );
//         setRows(enriched);
//         setTotalPages(totalPagesVal);
//         setTotalItems(totalElementsVal);
//       } else {
//         setRows([]);
//         setTotalPages(1);
//         setTotalItems(0);
//       }
//     } catch (err) {
//       console.error(err);
//       setRows([]);
//     } finally {
//       setLoadingAppointments(false);
//     }
//   }, [currentPage, pageSize, statusFilter]);

//   // Initial & pagination fetch
//   useEffect(() => { loadAppointments(); }, [loadAppointments]);

//   const onRefresh = () => { loadAppointments(); };
//   const onPrint = () => window.print();
//   const onKiosk = () => {
//     const el = tableRef.current as FullscreenElement | null;
//     if (!el) return;
//     if (el.requestFullscreen) el.requestFullscreen();
//     else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
//     else if (el.msRequestFullscreen) el.msRequestFullscreen();
//   };

//   // NEW — update status
//   const updateStatus = useCallback(
//     async (row: AppointmentDTO, newStatus: "Checked" | "Unchecked") => {
//       try {
//         const res = await fetchWithAuth(
//           `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${row.id}/status`,
//           {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ status: newStatus }),
//           }
//         );
//         const json = await res.json();
//         if (!res.ok || !json?.success) {
//           throw new Error(json?.message || "Failed to update status");
//         }
//         setEditingStatusId(null);
//         await loadAppointments(); // auto-refresh the row list
//       } catch (e) {
//         console.error(e);
//         alert("Failed to update status");
//       }
//     },
//     [loadAppointments]
//   );

//   const filtered = useMemo(() => {
//     if (!Array.isArray(rows)) return [];
//     const fromTime = from ? timeFromMMDDYYYY(from, -Infinity) : -Infinity;
//     const toTime = to ? timeFromMMDDYYYY(to, Infinity) : Infinity;
//     return rows.filter((r) => {
//       const d = new Date(r.appointmentStartDate).getTime();
//       const matchDate = d >= fromTime && d <= toTime;
//       const matchProvider = provider === "All Providers" ? true : r.providerId === Number(provider);
//       const matchCategory = category === "All Visit Categories" ? true : r.visitType === category;
//       const matchLocation = location === "All Locations" ? true : r.locationId === Number(location);
//       const matchPatient = patientName ? r.patientName?.toLowerCase().includes(patientName.trim().toLowerCase()) : true;
//       return matchDate && matchProvider && matchCategory && matchLocation && matchPatient;
//     });
//   }, [rows, from, to, provider, category, location, patientName]);

//   const total = filtered.length;
//   const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
//   const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

//   const getStatusClass = (status: string) => {
//     switch (status) {
//       case "Confirmed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
//       case "Scheduled": return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
//       case "Pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
//       case "Cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
//       case "Checked": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
//       case "Unchecked": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
//       default: return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
//     }
//   };

//   const openDrawer = (row: AppointmentDTO, section: DrawerSection) => {
//     setSelectedRow(row);
//     setActiveSection(section);
//     setDrawerOpen(true);
//   };

//   const encounterUrl = (row: AppointmentDTO) =>
//     `/patients/${row.patientId}/encounters/${row.id}`;

//   const sectionLabel = (s: DrawerSection) =>
//     s === "notes" ? "Provider Notes" : s === "procedures" ? "Procedures" : "Vitals";

//   return (
//     <AdminLayout>
//       <div className="container mx-auto p-6 overflow-x-hidden text-gray-800 dark:text-gray-200">
//         {/* Heading */}
//         <div className="flex items-center justify-between mb-4">
//           <div className="text-sm">
//             <span className="italic font-semibold">Total appointments:</span>{" "}
//             {loadingAppointments ? "…" : total}
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 w-full">
//             <select value={category} onChange={(e) => setCategory(e.target.value)}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600">
//               <option value="All Visit Categories">All Visit Categories</option>
//               {loadingCategories ? <option disabled>Loading...</option> :
//                 categories.map((c, idx) => (<option key={idx} value={c}>{c}</option>))}
//             </select>

//             <select value={provider} onChange={(e) => setProvider(e.target.value)}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600">
//               <option value="All Providers">All Providers</option>
//               {loadingProviders ? <option disabled>Loading...</option> :
//                 providers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
//             </select>

//             <select value={location} onChange={(e) => setLocation(e.target.value)}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600">
//               <option value="All Locations">All Locations</option>
//               {loadingLocations ? <option disabled>Loading...</option> :
//                 locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
//             </select>

//             <input type="text" placeholder="MM/DD/YYYY" value={from} onChange={(e) => setFrom(e.target.value)}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600" />

//             <input type="text" placeholder="MM/DD/YYYY" value={to} onChange={(e) => setTo(e.target.value)}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600" />

//             {/* NEW — Status filter */}
//             <select
//               value={statusFilter}
//               onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600"
//             >
//               <option value="All">All Statuses</option>
//               <option value="Scheduled">Scheduled</option>
//               <option value="Checked">Checked</option>
//               <option value="Unchecked">Unchecked</option>
//             </select>

//             <input type="text" placeholder="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)}
//               className="rounded-md border px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600" />
//           </div>

//           <div className="flex gap-2">
//             <button onClick={onRefresh} disabled={loadingAppointments}
//               className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" title="Refresh table data">
//               Refresh
//             </button>
//             <button onClick={onPrint} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
//               Print
//             </button>
//             <button onClick={onKiosk} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
//               Kiosk
//             </button>
//           </div>
//         </div>

//         {/* Table */}
//         <div ref={tableRef} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
//           <table className="w-full table-auto">
//             <colgroup>
//               <col className="w-20" />
//               <col className="w-48" />
//               <col className="w-48" />
//               <col />
//               <col className="w-32" />
//               <col className="w-32" />
//               <col className="w-28" />
//               <col className="w-28" />
//               <col className="w-28" />
//               <col className="w-[260px]" />
//             </colgroup>
//             <thead className="bg-gray-100 dark:bg-gray-800">
//               <tr>
//                 <th className="py-3 px-6 text-left text-sm font-medium">MRN</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Patient Name</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Provider Name</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Location</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Visit Type</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Start Date</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Start Time</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Priority</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Status</th>
//                 <th className="py-3 px-6 text-left text-sm font-medium">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loadingAppointments ? (
//                 <tr>
//                   <td colSpan={10} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400" />
//                 </tr>
//               ) : filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
//                     No appointments match your filters.
//                   </td>
//                 </tr>
//               ) : (
//                 filtered.map((r) => (
//                   <tr key={`${r.patientId}-${r.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700">
//                     <td className="py-3 px-6 text-sm whitespace-nowrap">{r.patientId}</td>
//                     <td className="py-3 px-6 text-sm">{r.patientName || "—"}</td>
//                     <td className="py-3 px-6 text-sm">
//                       {providers.find((p) => p.id === r.providerId)?.name || r.providerId}
//                     </td>
//                     <td className="py-3 px-6 text-sm">
//                       {locations.find((l) => l.id === r.locationId)?.name || "—"}
//                     </td>
//                     <td className="py-3 px-6 text-sm">{r.visitType}</td>
//                     <td className="py-3 px-6 text-sm">{formatToMMDDYYYY(r.appointmentStartDate)}</td>
//                     <td className="py-3 px-6 text-sm">{r.appointmentStartTime}</td>
//                     <td className="py-3 px-6 text-sm">{r.priority}</td>

//                     {/* Status cell — click to edit */}
//                     <td className="py-3 px-6 text-sm">
//                       {editingStatusId === r.id ? (
//                         <div className="flex items-center gap-2">
//                           <select
//                             autoFocus
//                             defaultValue={
//                               r.status === "Checked" ? "Checked" :
//                               r.status === "Unchecked" ? "Unchecked" : ""
//                             }
//                             className="rounded-md border px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
//                             onChange={(e) => {
//                               const val = e.target.value as "Checked" | "Unchecked" | "";
//                               if (val) updateStatus(r, val);
//                             }}
//                             onBlur={() => setEditingStatusId(null)}
//                           >
//                             {/* Placeholder if current is not checked/unchecked */}
//                             {r.status !== "Checked" && r.status !== "Unchecked" && (
//                               <option value="">{r.status}</option>
//                             )}
//                             <option value="Checked">Checked</option>
//                             <option value="Unchecked">Unchecked</option>
//                           </select>

//                           <button
//                             type="button"
//                             className="px-2 py-1 text-xs rounded border dark:border-gray-600"
//                             onClick={() => setEditingStatusId(null)}
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       ) : (
//                         <button
//                           type="button"
//                           className={[
//                             "inline-flex items-center rounded-full text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap",
//                             getStatusClass(r.status),
//                           ].join(" ")}
//                           title="Click to change status"
//                           onClick={() => setEditingStatusId(r.id)}
//                         >
//                           {r.status}
//                         </button>
//                       )}
//                     </td>

//                     <td className="py-3 px-6 text-sm">
//                       <div className="flex items-center gap-2">
//                         {/* Encounter button */}
//                         <button
//                           className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
//                           onClick={() => window.location.assign(encounterUrl(r))}
//                           title="Open encounters for this appointment"
//                         >
//                           Encounter
//                         </button>

//                         {/* Icon buttons — aligned and sized consistently */}
//                         <button
//                           type="button"
//                           onClick={() => openDrawer(r, "notes")}
//                           className="inline-flex items-center justify-center h-9 w-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600"
//                           title="Provider Notes"
//                           aria-label="Open Provider Notes"
//                         >
//                           <NotebookPen className="h-4 w-4" />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => openDrawer(r, "procedures")}
//                           className="inline-flex items-center justify-center h-9 w-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600"
//                           title="Procedures"
//                           aria-label="Open Procedures"
//                         >
//                           <Scissors className="h-4 w-4" />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => openDrawer(r, "vitals")}
//                           className="inline-flex items-center justify-center h-9 w-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600"
//                           title="Vitals"
//                           aria-label="Open Vitals"
//                         >
//                           <Activity className="h-4 w-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="mt-3 flex items-center justify-between px-3 py-2 border-t bg-white dark:bg-gray-900 dark:border-gray-700 text-sm">
//           <div className="flex items-center gap-3">
//             <button disabled={currentPage === 1 || loadingAppointments} onClick={handlePrevious}
//               className="px-3 py-1.5 border rounded disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800">
//               Prev
//             </button>
//             <div>Page {currentPage} of {totalPages}</div>
//             <button disabled={currentPage === totalPages || loadingAppointments} onClick={handleNext}
//               className="px-3 py-1.5 border rounded disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800">
//               Next
//             </button>
//           </div>
//           <div className="flex items-center gap-4">
//             <div>Showing {loadingAppointments ? "…" : filtered.length} of {totalItems}</div>
//             <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
//               className="border rounded px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm">
//               <option value={5}>5</option>
//               <option value={10}>10</option>
//               <option value={25}>25</option>
//               <option value={50}>50</option>
//             </select>
//           </div>
//         </div>

//         {/* Drawer: shows ONLY the chosen section */}
//         <Drawer
//           open={drawerOpen}
//           onClose={() => setDrawerOpen(false)}
//           title={
//             selectedRow ? (
//               <>
//                 Appointment #{selectedRow.id} — Patient {selectedRow.patientName ?? selectedRow.patientId} &nbsp;·&nbsp; {sectionLabel(activeSection)}
//               </>
//             ) : ("")
//           }
//         >
//           {selectedRow && activeSection === "notes" && (
//             <section className="mb-8">
//               <div className="mb-2 flex items-center justify-between">
//                 <h3 className="text-base font-semibold">Provider Notes</h3>
//               </div>
//               <ProviderNoteList
//                 patientId={selectedRow.patientId}
//                 encounterId={selectedRow.id}
//               />
//             </section>
//           )}

//           {selectedRow && activeSection === "procedures" && (
//             <section className="mb-8">
//               <div className="mb-2 flex items-center justify-between">
//                 <h3 className="text-base font-semibold">Procedures</h3>
//               </div>
//               <ProcedureList
//                 patientId={selectedRow.patientId}
//                 encounterId={selectedRow.id}
//               />
//             </section>
//           )}

//           {selectedRow && activeSection === "vitals" && (
//             <section className="mb-8">
//               <div className="mb-2 flex items-center justify-between">
//                 <h3 className="text-base font-semibold">Vitals</h3>
//               </div>
//               <VitalsList
//                 patientId={selectedRow.patientId}
//                 encounterId={selectedRow.id}
//               />
//             </section>
//           )}
//         </Drawer>
//       </div>
//     </AdminLayout>
//   );
// }




"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import AdminLayout from "@/app/(admin)/layout";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { NotebookPen, Scissors, Activity } from "lucide-react";

// drawer content
import ProviderNoteList from "@/components/encounter/providernote/Providernotelist";
import ProcedureList from "@/components/encounter/procedure/Procedurelist";
import VitalsList from "@/components/encounter/Vitals/Vitalslist";

export type AppointmentDTO = {
  id: number;
  visitType: string;
  patientId: number;
  providerId: number;
  appointmentStartDate: string;
  appointmentEndDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  priority: string;
  locationId: number;
  status: string;
  reason: string;
  orgId: number;
  patientName?: string;
  audit: {
    createdDate: string;
    lastModifiedDate: string;
  };
};

interface Category { title: string; optionName: string; activity?: number; }
interface Provider { id: number; name: string; }
interface Location { id: number; name: string; }

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

type DrawerSection = "notes" | "procedures" | "vitals";

const pad = (n: number) => n.toString().padStart(2, "0");

function formatToMMDDYYYY(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

function parseMMDDYYYY(s: string): string | null {
  if (!s) return null;
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const [mmStr, ddStr, yyyyStr] = parts;
  const mm = parseInt(mmStr, 10);
  const dd = parseInt(ddStr, 10);
  const yyyy = parseInt(yyyyStr, 10);
  if (Number.isNaN(mm) || Number.isNaN(dd) || Number.isNaN(yyyy)) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) return null;
  return `${yyyy}-${pad(mm)}-${pad(dd)}`;
}

function timeFromMMDDYYYY(s: string, fallback: number): number {
  const iso = parseMMDDYYYY(s);
  return iso ? new Date(iso).getTime() : fallback;
}

const fetchPatientName = async (id: number): Promise<string> => {
  try {
    const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${id}`);
    if (!res.ok) return String(id);
    const data = await res.json();
    return `${data.data.firstName} ${data.data.lastName}`;
  } catch {
    return String(id);
  }
};

// Video Call Button Component
const VideoCallButton = ({ appointmentId }: { appointmentId: number }) => {
  return (
    <button
      onClick={() => window.location.assign(`/telehealth/${appointmentId}`)}
      className="inline-flex items-center justify-center px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
      title="Start Video Call"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        <path d="M14 6a1 1 0 011 1v2.5a1 1 0 01-1 1h-.5v1h.5a1 1 0 011 1V15a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2.5a1 1 0 011-1h.5v-1h-.5a1 1 0 01-1-1V7a1 1 0 011-1h1z" />
      </svg>
      <span>Video</span>
    </button>
  );
};

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40" onClick={onClose} />
        <div className="w-[800px] max-w-full bg-white dark:bg-slate-900 shadow-xl p-6 overflow-y-auto animate-slideInRight">
          <button className="mb-4 text-sm text-gray-500 hover:text-gray-700" onClick={onClose}>
            ✕ Close
          </button>
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
          {children}
        </div>
      </div>
  );
}

export default function AppointmentPage() {
  const [category, setCategory] = useState("All Visit Categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [provider, setProvider] = useState("All Providers");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [location, setLocation] = useState("All Locations");
  const [locations, setLocations] = useState<Location[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [rows, setRows] = useState<AppointmentDTO[]>([]);

  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  // Status filter & inline status edit
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AppointmentDTO | null>(null);
  const [activeSection, setActiveSection] = useState<DrawerSection>("notes");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/list-options/list/Visit Type`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        const active = (data as Category[]).filter(c => c.activity === 1).map(c => c.title || c.optionName);
        setCategories(active);
      } catch { setCategories([]); }
      finally { setLoadingCategories(false); }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/providers`);
        if (!res.ok) throw new Error("Failed to fetch providers");
        const data = await res.json();
        const list: Provider[] = data.data.map((p: {id:number;identification:{firstName:string;lastName:string}})=>({
          id:p.id,
          name:`${p.identification.firstName} ${p.identification.lastName}`,
        }));
        setProviders(list);
      } catch { setProviders([]); }
      finally { setLoadingProviders(false); }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/locations`);
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();
        const list: Location[] = data.data.map((l:{id:number;name:string})=>({id:l.id,name:l.name}));
        setLocations(list);
      } catch { setLocations([]); }
      finally { setLoadingLocations(false); }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const fmt = (d:Date)=>`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    setFrom(fmt(lastMonth));
    setTo(fmt(today));
  }, []);

  // Modified appointment loading function to ensure all appointments are loaded correctly
  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      // Only include pagination params, not filter params (we'll filter client-side)
      // This ensures we get all appointments from the database
      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: String(pageSize),
      });

      console.log('Loading appointments with params:', params.toString());
      console.log('Current date filter range:', { from, to });

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments?${params.toString()}`
      );

      if (!res.ok) {
        console.error(`Failed to fetch appointments: ${res.status} ${res.statusText}`);
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }

      const data = await res.json();
      console.log('Raw appointments response:', data);

      const payload = data?.data ?? {};
      const content: AppointmentDTO[] = payload.content ?? payload?.data?.content ?? [];
      const totalPagesVal = payload.totalPages ?? data?.data?.totalPages ?? 1;
      const totalElementsVal = payload.totalElements ?? data?.data?.totalElements ?? content.length;

      if (content && Array.isArray(content)) {
        console.log(`Received ${content.length} raw appointments from database`);

        // Log all appointment dates to help with debugging
        content.forEach(appt => {
          console.log(`Appointment ID ${appt.id}: ${appt.visitType}, Date: ${appt.appointmentStartDate}, Status: ${appt.status}`);
        });

        // Enhance with patient names
        const enriched = await Promise.all(
          content.map(async (appt: AppointmentDTO) => {
            const name = await fetchPatientName(appt.patientId);
            return { ...appt, patientName: name };
          })
        );

        setRows(enriched);
        setTotalPages(totalPagesVal);
        setTotalItems(totalElementsVal);
      } else {
        console.warn('No appointments found in database');
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setRows([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    // Set default date range to show upcoming appointments
    const today = new Date();
    const threeMonthsAhead = new Date(today);
    threeMonthsAhead.setMonth(today.getMonth() + 3);

    const fmt = (d:Date)=>`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    setFrom(fmt(today));
    setTo(fmt(threeMonthsAhead));

    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = () => loadAppointments();
  const onPrint = () => window.print();
  const onKiosk = () => {
    const el = tableRef.current as FullscreenElement | null;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  // Update status
  const updateStatus = useCallback(
    async (row: AppointmentDTO, newStatus: "Checked" | "Unchecked") => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${row.id}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to update status");
        }
        setEditingStatusId(null);
        await loadAppointments(); // auto-refresh the row list
      } catch (e) {
        console.error(e);
        alert("Failed to update status");
      }
    },
    [loadAppointments]
  );

  // Helper to check if a visit is telehealth or virtual
  const isTelehealthVisit = (visitType: string) => {
    if (!visitType) return false;

    const lowerType = visitType.toLowerCase().trim();
    return lowerType === 'virtual' ||
           lowerType.includes('virtual') ||
           lowerType === 'telehealth' ||
           lowerType.includes('telehealth') ||
           lowerType.includes('tele-health') ||
           lowerType.includes('tele health') ||
           lowerType.includes('video');
  };

  // Improved client-side filtering to handle date range better and respect "All" filters
  const filtered = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('No appointments to filter');
      return [];
    }

    console.log(`Filtering ${rows.length} appointments with criteria:`,
      { from, to, provider, category, location, patientName, statusFilter });

    // Parse dates once outside the filter loop
    const fromTime = from ? timeFromMMDDYYYY(from, -Infinity) : -Infinity;
    const toTime = to ? timeFromMMDDYYYY(to, Infinity) + 86400000 : Infinity;

    const wanted = (statusFilter || "All").toUpperCase();

    // Track how many appointments are filtered out by each criterion
    let dateFiltered = 0, providerFiltered = 0, categoryFiltered = 0,
        locationFiltered = 0, nameFiltered = 0, statusFiltered = 0;

    const results = rows.filter((r) => {
      try {
        // Date filtering
        const d = r.appointmentStartDate ? new Date(r.appointmentStartDate).getTime() : 0;
        const matchDate = d >= fromTime && d <= toTime;
        if (!matchDate) dateFiltered++;

        // Provider filtering
        const matchProvider = provider === "All Providers" ? true : r.providerId === Number(provider);
        if (!matchProvider) providerFiltered++;

        // Visit type/category filtering
        const matchCategory = category === "All Visit Categories" ? true : r.visitType === category;
        if (!matchCategory) categoryFiltered++;

        // Location filtering
        const matchLocation = location === "All Locations" ? true : r.locationId === Number(location);
        if (!matchLocation) locationFiltered++;

        // Patient name filtering
        const matchPatient = !patientName ? true :
          (r.patientName || "").toLowerCase().includes(patientName.trim().toLowerCase());
        if (!matchPatient) nameFiltered++;

        // Status filtering
        const currStatus = (r.status || "").toUpperCase();
        const matchStatus = wanted === "ALL" ? true : currStatus === wanted;
        if (!matchStatus) statusFiltered++;

        return matchDate && matchProvider && matchCategory && matchLocation && matchPatient && matchStatus;
      } catch (e) {
        console.error('Error filtering appointment:', e, r);
        return false;
      }
    });

    // Log filter results
    console.log(`Filtering results: ${results.length} matched out of ${rows.length} total appointments`);
    console.log('Filtered out counts:', {
      byDate: dateFiltered,
      byProvider: providerFiltered,
      byCategory: categoryFiltered,
      byLocation: locationFiltered,
      byName: nameFiltered,
      byStatus: statusFiltered
    });

    return results;
  }, [rows, from, to, provider, category, location, patientName, statusFilter]);


  const goPrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // tolerant to any casing
  const getStatusClass = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "CONFIRMED":  return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "SCHEDULED":  return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "PENDING":    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "CANCELLED":  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "CHECKED":    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "UNCHECKED":  return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:           return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const openDrawer = (row: AppointmentDTO, section: DrawerSection) => {
    setSelectedRow(row);
    setActiveSection(section);
    setDrawerOpen(true);
  };

  const encounterUrl = (row: AppointmentDTO) =>
    `/patients/${row.patientId}/encounters/${row.id}`;

  const sectionLabel = (s: DrawerSection) =>
    s === "notes" ? "Provider Notes" : s === "procedures" ? "Procedures" : "Vitals";

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 overflow-x-hidden text-gray-800 dark:text-gray-200">
        {/* Header with title and counts */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm bg-blue-50 dark:bg-blue-900 px-4 py-2 rounded-full">
              <span className="font-semibold">Filtered:</span>{" "}
              {loadingAppointments ? "Loading..." : filtered.length}
            </div>
            <div className="text-sm bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-full">
              <span className="font-semibold">Total:</span>{" "}
              {loadingAppointments ? "Loading..." : rows.length}
            </div>
          </div>
        </div>

        {/* Filter section - single line with all controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {/* Visit Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800"
              title="Visit Category"
            >
              <option value="All Visit Categories">All Categories</option>
              {loadingCategories ? <option disabled>Loading...</option> :
                categories.map((c, idx) => (<option key={idx} value={c}>{c}</option>))}
            </select>

            {/* Provider */}
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800"
              title="Provider"
            >
              <option value="All Providers">All Providers</option>
              {loadingProviders ? <option disabled>Loading...</option> :
                providers.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>

            {/* Location */}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800"
              title="Location"
            >
              <option value="All Locations">All Locations</option>
              {loadingLocations ? <option disabled>Loading...</option> :
                locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>

            {/* From date */}
            <div className="inline-flex items-center">
              <span className="text-xs text-gray-500 mr-1">From:</span>
              <input
                type="text"
                placeholder="MM/DD/YYYY"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800 w-24"
              />
            </div>

            {/* To date */}
            <div className="inline-flex items-center">
              <span className="text-xs text-gray-500 mr-1">To:</span>
              <input
                type="text"
                placeholder="MM/DD/YYYY"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800 w-24"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800"
              title="Status"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Checked">Checked</option>
              <option value="Unchecked">Unchecked</option>
            </select>

            {/* Patient name */}
            <input
              type="text"
              placeholder="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="rounded-md text-sm border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-white dark:bg-gray-800 w-32"
            />

            {/* Action buttons in the same row */}
            <div className="flex-grow flex justify-end gap-1">
              <button
                onClick={onRefresh}
                disabled={loadingAppointments}
                className="rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 text-sm"
                title="Refresh appointment data"
              >
                <svg className="h-3 w-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={onPrint}
                className="rounded-md bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 text-sm"
                title="Print appointment list"
              >
                <svg className="h-3 w-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={onKiosk}
                className="rounded-md bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 text-sm"
                title="Enter kiosk mode"
              >
                <svg className="h-3 w-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Kiosk
              </button>
            </div>
          </div>
        </div>

        {/* Table with clear empty state and data display */}
        <div ref={tableRef} className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md mb-5">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <colgroup>
                <col className="w-20" />
                <col className="w-48" />
                <col className="w-48" />
                <col />
                <col className="w-32" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-[260px]" />
              </colgroup>
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold">MRN</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Patient Name</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Provider Name</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Location</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Visit Type</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Start Date</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Start Time</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Priority</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">Status</th>
                  <th className="py-3 px-6 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loadingAppointments ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-500 dark:text-gray-400">Loading appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No appointments found in the database</p>
                        <button
                          onClick={onRefresh}
                          className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh data
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 012 2v2a2 2 0 002 2h6a2 2 0 002-2v-2a2 2 0 012-2h2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                          No appointments match your filter criteria
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 mb-4">
                          There are {rows.length} appointments in the database
                        </p>
                        <button onClick={() => {
                          setCategory("All Visit Categories");
                          setProvider("All Providers");
                          setLocation("All Locations");
                          setStatusFilter("All");
                          setPatientName("");

                          // Set date range to a wider period to show more appointments
                          const today = new Date();
                          const sixMonthsLater = new Date(today);
                          sixMonthsLater.setMonth(today.getMonth() + 6);

                          const fmt = (d:Date)=>`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`;
                          setFrom(fmt(today));
                          setTo(fmt(sixMonthsLater));
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                          Reset filters to see all appointments
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={`${r.patientId}-${r.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-6 text-sm whitespace-nowrap">{r.patientId}</td>
                      <td className="py-3 px-6 text-sm font-medium">{r.patientName || "—"}</td>
                      <td className="py-3 px-6 text-sm">
                        {providers.find((p) => p.id === r.providerId)?.name || r.providerId}
                      </td>
                      <td className="py-3 px-6 text-sm">
                        {locations.find((l) => l.id === r.locationId)?.name || "—"}
                      </td>
                      <td className="py-3 px-6 text-sm">
                        <div className="flex items-center gap-1">
                          {isTelehealthVisit(r.visitType) && (
                            <span className="inline-block w-4 h-4 text-green-500">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                <path d="M14 6a1 1 0 011 1v2.5a1 1 0 01-1 1h-.5v1h.5a1 1 0 011 1V15a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2.5a1 1 0 011-1h.5v-1h-.5a1 1 0 01-1-1V7a1 1 0 011-1h1z" />
                              </svg>
                            </span>
                          )}
                          {r.visitType}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm">{formatToMMDDYYYY(r.appointmentStartDate)}</td>
                      <td className="py-3 px-6 text-sm">{r.appointmentStartTime}</td>
                      <td className="py-3 px-6 text-sm">
                        {r.priority && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            r.priority.toUpperCase() === "HIGH" 
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                              : r.priority.toUpperCase() === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}>
                            {r.priority}
                          </span>
                        )}
                      </td>

                      {/* Status cell — click to edit */}
                      <td className="py-3 px-6 text-sm">
                        {editingStatusId === r.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              autoFocus
                              defaultValue={
                                ((r.status || "").toUpperCase() === "CHECKED") ? "Checked" :
                                ((r.status || "").toUpperCase() === "UNCHECKED") ? "Unchecked" : ""
                              }
                              className="rounded-md border px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                              onChange={(e) => {
                                const val = e.target.value as "Checked" | "Unchecked" | "";
                                if (val) updateStatus(r, val);
                              }}
                              onBlur={() => setEditingStatusId(null)}
                            >
                              {/* Placeholder if current is not checked/unchecked */}
                              {!(["CHECKED","UNCHECKED"].includes((r.status || "").toUpperCase())) && (
                                <option value="">{r.status}</option>
                              )}
                              <option value="Checked">Checked</option>
                              <option value="Unchecked">Unchecked</option>
                            </select>

                            <button
                              type="button"
                              className="px-2 py-1 text-xs rounded border dark:border-gray-600"
                              onClick={() => setEditingStatusId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={[
                              "inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap",
                              getStatusClass(r.status),
                            ].join(" ")}
                            title="Click to change status"
                            onClick={() => setEditingStatusId(r.id)}
                          >
                            {r.status}
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-6 text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {/* Encounter button */}
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs flex items-center"
                            onClick={() => window.location.assign(encounterUrl(r))}
                            title="Open encounters for this appointment"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            Encounter
                          </button>

                          {/* Video Call button - only for telehealth/virtual visits with status scheduled */}
                          {isTelehealthVisit(r.visitType) && r.status.toUpperCase() === "SCHEDULED" && (
                            <VideoCallButton appointmentId={r.id} />
                          )}

                          {/* Icon buttons */}
                          <button
                            type="button"
                            onClick={() => openDrawer(r, "notes")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600 transition-colors"
                            title="Provider Notes"
                            aria-label="Open Provider Notes"
                          >
                            <NotebookPen className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDrawer(r, "procedures")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600 transition-colors"
                            title="Procedures"
                            aria-label="Open Procedures"
                          >
                            <Scissors className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDrawer(r, "vitals")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 dark:border-gray-600 transition-colors"
                            title="Vitals"
                            aria-label="Open Vitals"
                          >
                            <Activity className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination & items per page */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              disabled={currentPage === 1 || loadingAppointments}
              onClick={goPrev}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Prev
            </button>
            <div className="text-sm">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <button
              disabled={currentPage === totalPages || loadingAppointments}
              onClick={goNext}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm">Showing <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{totalItems}</span> appointments</div>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Drawer for appointment details */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={
            selectedRow ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">#</span>
                  <span>{selectedRow.id}</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="font-medium">{selectedRow.patientName ?? selectedRow.patientId}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{sectionLabel(activeSection)}</div>
              </div>
            ) : ("")
          }
        >
          {selectedRow && activeSection === "notes" && (
            <section className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold">Provider Notes</h3>
              </div>
              <ProviderNoteList
                patientId={selectedRow.patientId}
                encounterId={selectedRow.id}
              />
            </section>
          )}

          {selectedRow && activeSection === "procedures" && (
            <section className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold">Procedures</h3>
              </div>
              <ProcedureList
                patientId={selectedRow.patientId}
                encounterId={selectedRow.id}
              />
            </section>
          )}

          {selectedRow && activeSection === "vitals" && (
            <section className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold">Vitals</h3>
              </div>
              <VitalsList
                patientId={selectedRow.patientId}
                encounterId={selectedRow.id}
              />
            </section>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}
