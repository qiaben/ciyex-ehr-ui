// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import dynamic from "next/dynamic";
// // Load JitsiMeeting dynamically only on client-side to avoid server-side module resolution errors
// const JitsiMeeting = dynamic(() => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting), { ssr: false });

// import { fetchWithAuth } from "@/utils/fetchWithAuth";
// import Alert from "@/components/ui/alert/Alert";

// type Appointment = {
//     id: number;
//     patientId: number;
//     providerId: number;
//     visitType: string;
//     formattedDate: string;
//     formattedTime: string;
//     status: string;
//     priority: string;
//     providerName?: string;
// };

// type ProviderNoteDTO = {
//     subjective?: string;
//     objective?: string;
//     assessment?: string;
//     plan?: string;
// };

// type QuickItem = {
//     id: number;
//     description?: string;
//     name?: string;
//     drugName?: string;
//     dosage?: string;
//     instructions?: string;
// };

// export default function AppointmentTelehealthPage() {
//     const params = useParams();
//     const router = useRouter();
//     const appointmentId = params?.appointmentId as string;

//     const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

//     const [appointment, setAppointment] = useState<Appointment | null>(null);
//     const [roomName, setRoomName] = useState<string | null>(null);
//     const [jwt, setJwt] = useState<string | null>(null);
//     const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
//     const [loading, setLoading] = useState(true);

//     // SOAP notes
//     const [soapNotes, setSoapNotes] = useState<ProviderNoteDTO>({
//         subjective: "",
//         objective: "",
//         assessment: "",
//         plan: "",
//     });

//     // Quick actions
//     const [expanded, setExpanded] = useState({
//         medications: false,
//         history: false,
//         prescriptions: false,
//     });
//     const [history, setHistory] = useState<QuickItem[]>([]);
//     const [medications, setMedications] = useState<QuickItem[]>([]);
//     const [prescriptions, setPrescriptions] = useState<QuickItem[]>([]);

//     const [message, setMessage] = useState("");

//     // Jitsi API reference to attach event listeners
//     const jitsiApiRef = useRef<unknown | null>(null);

//     /** 🔹 Load SOAP notes, history, meds, prescriptions */
//     const loadClinicalData = useCallback(async (patientId: number, apptId: number) => {
//         try {
//             // Get orgId for authentication - required for all API calls
//             const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
//             if (!orgId) {
//                 setAlert({ type: "error", msg: "Missing organization ID. Please log in again." });
//                 return;
//             }

//             // SOAP
//             const resS = await fetchWithAuth(`${API_BASE}/api/provider-notes/${patientId}/${apptId}`, {
//                 headers: { "x-org-id": orgId }
//             });

//             if (resS.status === 401) {
//                 setAlert({ type: "error", msg: "Session expired. Please log in again." });
//                 return; // stop further loading if unauthorized
//             }

//             if (resS.ok) {
//                 const apiResponse = await resS.json();
//                 if (apiResponse?.success && Array.isArray(apiResponse.data) && apiResponse.data.length) {
//                     const note = apiResponse.data[0];
//                     setSoapNotes({
//                         subjective: note.subjective || "",
//                         objective: note.objective || "",
//                         assessment: note.assessment || "",
//                         plan: note.plan || "",
//                     });
//                 } else {
//                     setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
//                 }
//             }

//             // History - Add x-org-id header to fix 401 Unauthorized
//             const resH = await fetchWithAuth(`${API_BASE}/api/past-medical-history/${patientId}/${apptId}`, {
//                 headers: { "x-org-id": orgId }
//             });

//             if (resH.status === 401) {
//                 console.warn("401 Unauthorized when accessing past-medical-history");
//                 setAlert({ type: "error", msg: "Authorization failed for medical history data." });
//             } else if (resH.ok) {
//                 const apiResponse = await resH.json();
//                 setHistory(apiResponse.data || []);
//             } else {
//                 console.warn(`Failed to load past medical history: ${resH.status}`);
//                 setHistory([]);
//             }

//             // Medication requests - Add x-org-id header
//             try {
//                 const medsResp = await fetchWithAuth(`${API_BASE}/api/medication-requests?patientId=${patientId}&encounterId=${apptId}`, {
//                     headers: { "x-org-id": orgId }
//                 });

//                 if (medsResp.status === 401) {
//                     console.warn("401 Unauthorized when accessing medication-requests");
//                 } else if (medsResp.ok) {
//                     const apiResponse = await medsResp.json();
//                     const medsData = Array.isArray(apiResponse) ? apiResponse : (apiResponse.data || []);
//                     setMedications(medsData);
//                     setPrescriptions(medsData);
//                 } else {
//                     setMedications([]);
//                     setPrescriptions([]);
//                 }
//             } catch (err: unknown) {
//                 console.warn('Failed to load medication requests', String(err));
//                 setMedications([]);
//                 setPrescriptions([]);
//             }
//         } catch (err: unknown) {
//             console.warn("⚠️ Failed to load clinical data", String(err));
//         }
//     }, [API_BASE]);

//     /** 🔹 Load appointment + join video */
//     useEffect(() => {
//         async function initVideoCall() {
//             try {
//                 // Step 1: load appointment
//                 const resp = await fetchWithAuth(`${API_BASE}/api/appointments/${appointmentId}`);
//                 const raw = await resp.json();

//                 if (!raw.success || !raw.data) {
//                     setAlert({ type: "error", msg: raw.message || "Appointment not found" });
//                     setLoading(false);
//                     return;
//                 }

//                 const appt: Appointment = raw.data;
//                 setAppointment(appt);

//                 // Step 2: create telehealth room
//                 let roomId: string = `appt-${appointmentId}`;
//                 try {
//                     // Get orgId for authentication - required for all API calls
//                     const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
//                     if (!orgId) {
//                         console.warn("Missing orgId for telehealth room creation");
//                     }

//                     const roomResp = await fetchWithAuth(`${API_BASE}/api/telehealth/rooms`, {
//                         method: "POST",
//                         body: JSON.stringify({
//                             providerId: appt.providerId,
//                             patientId: appt.patientId,
//                             roomName: roomId,
//                             orgId: orgId ? Number(orgId) : undefined,
//                         }),
//                         headers: {
//                             "x-org-id": orgId || "",
//                             "Content-Type": "application/json",
//                         }
//                     });


//                     if (roomResp.status === 401) {
//                         console.warn("Telehealth room API returned 401 Unauthorized");
//                         // Continue with fallback room name
//                     } else if (roomResp.ok) {
//                         const parsed = await roomResp.json();
//                         roomId = parsed.roomSid || roomId;
//                         console.log("Telehealth room created successfully:", roomId);
//                     }
//                 } catch (err: unknown) {
//                     console.warn("Room API failed, using fallback room:", String(err));
//                 }

//                 // Step 3: request join token
//                 try {
//                     const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;

//                     const joinResp = await fetchWithAuth(`${API_BASE}/api/telehealth/jitsi/join`, {
//                         method: "POST",
//                         body: JSON.stringify({
//                             roomName: roomId,
//                             identity: `provider-${appt.providerId}`,
//                             ttlSeconds: 3600,
//                             orgId: orgId ? Number(orgId) : undefined,
//                         }),
//                         headers: {
//                             "x-org-id": orgId || "",
//                             "Content-Type": "application/json",
//                         }
//                     });

//                     if (!joinResp.ok) {
//                         const msg = `Join API failed with status ${joinResp.status}`;
//                         console.error(msg);
//                         setAlert({ type: "error", msg });
//                         setLoading(false);
//                         return;
//                     }

//                     const joinData = await joinResp.json();
//                     const token = joinData.token;

//                     setRoomName(joinData.roomName || roomId);
//                     setJwt(token);
//                     setAlert({ type: "success", msg: "Joined video call successfully!" });

//                     // Step 4: Load SOAP Notes + Quick Actions
//                     loadClinicalData(appt.patientId, appt.id);
//                 } catch (err: unknown) {
//                     console.error("Join API error:", String(err));
//                     setAlert({ type: "error", msg: "Failed to join video call" });
//                 }
//             } catch (err: unknown) {
//                 console.error(err);
//                 setAlert({
//                     type: "error",
//                     msg: String(err) || "Failed to join video call",
//                 });
//             } finally {
//                 setLoading(false);
//             }
//         }

//         if (appointmentId) initVideoCall();
//     }, [appointmentId, API_BASE, loadClinicalData]);

//     /** 🔹 SOAP Notes Save */
//     const saveSoapNotes = async () => {
//         if (!appointment) return;
//         try {
//             // Get orgId from localStorage - crucial for 401 fix
//             const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
//             if (!orgId) {
//                 setAlert({ type: "error", msg: "Missing organization ID. Please log in again." });
//                 setMessage("❌ Failed to save SOAP Notes");
//                 return;
//             }

//             const completeNotes = {
//                 ...soapNotes,
//                 patientId: appointment.patientId,
//                 encounterId: appointment.id,
//                 orgId: Number(orgId),
//                 noteTitle: "SOAP Note",
//                 noteTypeCode: "SOAP",
//                 noteStatus: "active",
//                 authorPractitionerId: appointment.providerId
//             } as Record<string, unknown>;

//             const res = await fetchWithAuth(
//                 `${API_BASE}/api/provider-notes/${appointment.patientId}/${appointment.id}`,
//                 {
//                     method: "POST",
//                     body: JSON.stringify(completeNotes),
//                     headers: {
//                         "x-org-id": orgId
//                     }
//                 }
//             );

//             if (res.status === 401) {
//                 setMessage("❌ Authentication failed");
//                 setAlert({ type: "error", msg: "Unauthorized. Please log in again." });
//                 return;
//             }

//             const apiResponse = await res.json().catch(() => null);
//             if (res.ok && apiResponse?.success) {
//                 setMessage("✅ SOAP Notes saved successfully");
//                 loadClinicalData(appointment.patientId, appointment.id);
//             } else {
//                 const errorMsg = apiResponse?.message || `Error: ${res.status}`;
//                 setMessage("❌ Failed to save SOAP Notes");
//                 setAlert({ type: "error", msg: errorMsg });
//             }
//         } catch (err: unknown) {
//             console.error("Error saving SOAP notes:", String(err));
//             setMessage("❌ Failed to save SOAP Notes");
//             setAlert({ type: "error", msg: "An unexpected error occurred" });
//         }
//     };

//     /** 🔹 Quick Actions helpers */
//     const addItem = async (type: "past-medical-history" | "medications" | "prescriptions" | "medication-requests", payload: Record<string, unknown>) => {
//         if (!appointment) return;

//         const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
//         if (!orgId) {
//             setAlert({ type: "error", msg: "Missing organization ID. Please log in again." });
//             return;
//         }

//         let res: Response | undefined;
//         try {
//             if (type === 'past-medical-history') {
//                 const url = `${API_BASE}/api/past-medical-history/${appointment.patientId}/${appointment.id}`;
//                 res = await fetchWithAuth(url, {
//                     method: 'POST',
//                     body: JSON.stringify({ ...payload, orgId: Number(orgId) }),
//                     headers: { "x-org-id": orgId }
//                 });
//             } else if (type === 'medications' || type === 'prescriptions' || type === 'medication-requests') {
//                 const url = `${API_BASE}/api/medication-requests`;
//                 const body = {
//                     ...(payload || {}),
//                     patientId: appointment.patientId,
//                     encounterId: appointment.id,
//                     orgId: Number(orgId)
//                 };
//                 res = await fetchWithAuth(url, {
//                     method: 'POST',
//                     body: JSON.stringify(body),
//                     headers: { "x-org-id": orgId }
//                 });
//             }

//             if (res?.ok) {
//                 loadClinicalData(appointment.patientId, appointment.id);
//             } else if (res?.status === 401) {
//                 setAlert({ type: "error", msg: "Unauthorized. Please log in again." });
//             } else {
//                 try {
//                     const errResponse = await res?.json();
//                     setAlert({ type: "error", msg: errResponse?.message || "Failed to add item" });
//                 } catch {
//                     setAlert({ type: "error", msg: "Failed to add item" });
//                 }
//             }
//         } catch (err: unknown) {
//             console.error("Error adding item:", String(err));
//             setAlert({ type: "error", msg: "Failed to add item" });
//         }
//     };

//     const updateItem = async (type: "past-medical-history" | "medication-requests" | "medications" | "prescriptions", id: number, payload: Record<string, unknown>) => {
//         if (!appointment) return;

//         const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
//         if (!orgId) {
//             setAlert({ type: "error", msg: "Missing organization ID. Please log in again." });
//             return;
//         }

//         let res: Response | undefined;
//         try {
//             if (type === 'past-medical-history') {
//                 const url = `${API_BASE}/api/past-medical-history/${appointment.patientId}/${appointment.id}/${id}`;
//                 res = await fetchWithAuth(url, {
//                     method: 'PUT',
//                     body: JSON.stringify({ ...payload, orgId: Number(orgId) }),
//                     headers: { "x-org-id": orgId }
//                 });
//             } else {
//                 const url = `${API_BASE}/api/medication-requests/${id}`;
//                 const body = { ...payload, orgId: Number(orgId) };
//                 res = await fetchWithAuth(url, {
//                     method: 'PUT',
//                     body: JSON.stringify(body),
//                     headers: { "x-org-id": orgId }
//                 });
//             }

//             if (res?.ok) {
//                 loadClinicalData(appointment.patientId, appointment.id);
//             } else if (res?.status === 401) {
//                 setAlert({ type: "error", msg: "Unauthorized. Please log in again." });
//             }
//         } catch (err: unknown) {
//             console.error("Error updating item:", String(err));
//             setAlert({ type: "error", msg: "Failed to update item" });
//         }
//     };

//     const deleteItem = async (type: "past-medical-history" | "medication-requests" | "medications" | "prescriptions", id: number) => {
//         if (!appointment) return;

//         const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") : null;
//         if (!orgId) {
//             setAlert({ type: "error", msg: "Missing organization ID. Please log in again." });
//             return;
//         }

//         let res: Response | undefined;
//         try {
//             if (type === 'past-medical-history') {
//                 const url = `${API_BASE}/api/past-medical-history/${appointment.patientId}/${appointment.id}/${id}`;
//                 res = await fetchWithAuth(url, { method: 'DELETE', headers: { "x-org-id": orgId } });
//             } else {
//                 const url = `${API_BASE}/api/medication-requests/${id}`;
//                 res = await fetchWithAuth(url, { method: 'DELETE', headers: { "x-org-id": orgId } });
//             }

//             if (res?.ok) {
//                 loadClinicalData(appointment.patientId, appointment.id);
//             } else if (res?.status === 401) {
//                 setAlert({ type: "error", msg: "Unauthorized. Please log in again." });
//             }
//         } catch (err: unknown) {
//             console.error("Error deleting item:", String(err));
//             setAlert({ type: "error", msg: "Failed to delete item" });
//         }
//     };

//     /** 🔹 End Call */
//     const endCall = () => {
//         // cleanup jitsi listeners if any
//         try {
//             const api = jitsiApiRef.current as any | null;
//             if (api && typeof api.removeEventListener === "function") {
//                 // remove listeners (best-effort)
//                 try { api.removeEventListener('readyToClose', endCall); } catch (e) {}
//                 try { api.removeEventListener('videoConferenceLeft', endCall); } catch (e) {}
//             }
//         } catch (e) {
//             // swallow
//         }
//         router.push("/appointments");
//     };

//     // attach cleanup for jitsi on unmount
//     useEffect(() => {
//         return () => {
//             try {
//                 const api = jitsiApiRef.current as any | null;
//                 if (api && typeof api.removeEventListener === "function") {
//                     try { api.removeEventListener('readyToClose', endCall); } catch (e) {}
//                     try { api.removeEventListener('videoConferenceLeft', endCall); } catch (e) {}
//                 }
//             } catch (e) {
//                 // ignore
//             }
//         };
//     }, []);

//     if (loading) {
//         return <p className="p-6">Joining telehealth session...</p>;
//     }

//     if (!appointment || !roomName || !jwt) {
//         return (
//             <div className="p-6">
//                 {alert && (
//                     <Alert
//                         type={alert.type}
//                         title={alert.type === "error" ? "Error" : "Success"}
//                         message={alert.msg}
//                         variant="success"
//                     />
//                 )}
//                 <p>Unable to load telehealth session</p>
//             </div>
//         );
//     }

//     return (
//         <div className="flex flex-col w-full h-screen bg-gray-50">
//             {/* Header */}
//             <header className="w-full bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
//                 <h1 className="text-lg font-semibold text-black">
//                     🌐 Telehealth Virtual Session — Appointment #{appointmentId}
//                 </h1>
//                 <div className="flex gap-2 items-center">
//                     {alert && (
//                         <Alert
//                             type={alert.type}
//                             title={alert.type === "error" ? "Error" : "Success"}
//                             message={alert.msg}
//                             variant="success"
//                         />
//                     )}
//                     <button
//                         onClick={endCall}
//                         className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm shadow"
//                     >
//                         End Call
//                     </button>
//                 </div>
//             </header>

//             <div className="flex flex-1 overflow-hidden">
//                 {/* Left: Video */}
//                 <div className="w-1/2 border-r bg-black flex items-center justify-center">
//                     <div className="w-full h-full">
//                         <JitsiMeeting
//                             domain="meet-stg.ciyex.com"
//                             roomName={roomName}
//                             jwt={jwt}
//                             configOverwrite={{
//                                 startWithAudioMuted: false,
//                                 startWithVideoMuted: false,
//                                 prejoinPageEnabled: false,
//                             }}
//                             interfaceConfigOverwrite={{
//                                 SHOW_JITSI_WATERMARK: false,
//                                 SHOW_BRAND_WATERMARK: false,
//                                 SHOW_POWERED_BY: false,
//                                 DEFAULT_LOGO_URL: "",
//                                 TOOLBAR_BUTTONS: ["microphone", "camera", "chat", "tileview", "raisehand", "hangup"],
//                             }}
//                             userInfo={{
//                                 displayName: `Dr. ${appointment.providerName || appointment.providerId}`,
//                                 email: "provider@example.com",
//                             }}
//                             getIFrameRef={(iframeRef) => {
//                                 iframeRef.style.height = "100%";
//                                 iframeRef.style.width = "100%";
//                             }}
//                             onApiReady={(apiObj) => {
//                                 // store api ref and bind end-call events
//                                 jitsiApiRef.current = apiObj;
//                                 try {
//                                     const api = apiObj as any;
//                                     if (api && typeof api.addEventListener === "function") {
//                                         api.addEventListener('readyToClose', endCall);
//                                         api.addEventListener('videoConferenceLeft', endCall);
//                                     }
//                                 } catch (e) {
//                                     console.warn('Failed to attach jitsi listeners', e);
//                                 }
//                             }}
//                         />
//                     </div>
//                 </div>

//                 {/* Right: SOAP + Quick Actions */}
//                 <div className="w-1/2 flex flex-col bg-white shadow-inner overflow-y-auto">
//                     {/* SOAP Notes */}
//                     <div className="p-4 border-b bg-gray-50">
//                         <h3 className="font-semibold mb-2 text-indigo-600">📝 SOAP Notes</h3>
//                         {["subjective", "objective", "assessment", "plan"].map((field) => (
//                             <textarea
//                                 key={field}
//                                 value={soapNotes[field as keyof ProviderNoteDTO] || ""}
//                                 onChange={(e) => setSoapNotes({ ...soapNotes, [field]: e.target.value })}
//                                 className="w-full border rounded-lg p-2 text-sm mb-2 focus:ring focus:ring-indigo-200"
//                                 rows={2}
//                                 placeholder={field}
//                             />
//                         ))}
//                         <div className="flex gap-2">
//                             <button
//                                 onClick={saveSoapNotes}
//                                 className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-sm shadow"
//                             >
//                                 Save
//                             </button>
//                             <button
//                                 onClick={() => window.print()}
//                                 className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm shadow"
//                             >
//                                 Export
//                             </button>
//                         </div>
//                         {message && <p className="text-xs text-green-600 mt-2">{message}</p>}
//                     </div>

//                     {/* Quick Actions */}
//                     <div className="flex-1 p-4 space-y-4">
//                         {/* Medications */}
//                         <div className="bg-white rounded-lg shadow-sm p-3">
//                             <button
//                                 onClick={() => setExpanded((prev) => ({ ...prev, medications: !prev.medications }))}
//                                 className="flex items-center justify-between w-full font-semibold text-gray-700"
//                             >
//                                 💊 Medications
//                                 <span>{expanded.medications ? "▲" : "▼"}</span>
//                             </button>
//                             {expanded.medications && (
//                                 <div className="mt-2 text-sm space-y-2">
//                                     {medications.length ? (
//                                         medications.map((m) => (
//                                             <div key={m.id} className="flex justify-between items-center">
//                                                 <span>{m.name}</span>
//                                                 <div className="flex gap-2">
//                                                     <button
//                                                         className="text-xs text-blue-600"
//                                                         onClick={() =>
//                                                             updateItem("medications", m.id, { name: m.name + " (edited)" })
//                                                         }
//                                                     >
//                                                         Edit
//                                                     </button>
//                                                     <button
//                                                         className="text-xs text-red-600"
//                                                         onClick={() => deleteItem("medications", m.id)}
//                                                     >
//                                                         Delete
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         ))
//                                     ) : (
//                                         <p className="text-gray-500">No medications found</p>
//                                     )}
//                                     <button
//                                         onClick={() => addItem("medications", { name: "New Medication" })}
//                                         className="mt-2 text-xs text-green-600"
//                                     >
//                                         + Add Medication
//                                     </button>
//                                 </div>
//                             )}
//                         </div>

//                         {/* History */}
//                         <div className="bg-white rounded-lg shadow-sm p-3">
//                             <button
//                                 onClick={() => setExpanded((prev) => ({ ...prev, history: !prev.history }))}
//                                 className="flex items-center justify-between w-full font-semibold text-gray-700"
//                             >
//                                 🩺 Medical History
//                                 <span>{expanded.history ? "▲" : "▼"}</span>
//                             </button>
//                             {expanded.history && (
//                                 <div className="mt-2 text-sm space-y-2">
//                                     {history.length ? (
//                                         history.map((h) => (
//                                             <div key={h.id} className="flex justify-between items-center">
//                                                 <span>{h.description}</span>
//                                                 <div className="flex gap-2">
//                                                     <button
//                                                         className="text-xs text-blue-600"
//                                                         onClick={() =>
//                                                             updateItem("past-medical-history", h.id, {
//                                                                 description: h.description + " (edited)",
//                                                             })
//                                                         }
//                                                     >
//                                                         Edit
//                                                     </button>
//                                                     <button
//                                                         className="text-xs text-red-600"
//                                                         onClick={() => deleteItem("past-medical-history", h.id)}
//                                                     >
//                                                         Delete
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         ))
//                                     ) : (
//                                         <p className="text-gray-500">No history found</p>
//                                     )}
//                                     <button
//                                         onClick={() => addItem("past-medical-history", { description: "New condition" })}
//                                         className="mt-2 text-xs text-green-600"
//                                     >
//                                         + Add History
//                                     </button>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Prescriptions */}
//                         <div className="bg-white rounded-lg shadow-sm p-3">
//                             <button
//                                 onClick={() => setExpanded((prev) => ({ ...prev, prescriptions: !prev.prescriptions }))}
//                                 className="flex items-center justify-between w-full font-semibold text-gray-700"
//                             >
//                                 📄 Prescriptions
//                                 <span>{expanded.prescriptions ? "▲" : "▼"}</span>
//                             </button>
//                             {expanded.prescriptions && (
//                                 <div className="mt-2 text-sm space-y-2">
//                                     {prescriptions.length ? (
//                                         prescriptions.map((p) => (
//                                             <div key={p.id} className="flex justify-between items-center">
//                                                 <span>
//                                                     {p.drugName} {p.dosage} ({p.instructions})
//                                                 </span>
//                                                 <div className="flex gap-2">
//                                                     <button
//                                                         className="text-xs text-blue-600"
//                                                         onClick={() =>
//                                                             updateItem("prescriptions", p.id, {
//                                                                 drugName: p.drugName,
//                                                                 dosage: p.dosage,
//                                                                 instructions: "Edited instructions",
//                                                             })
//                                                         }
//                                                     >
//                                                         Edit
//                                                     </button>
//                                                     <button
//                                                         className="text-xs text-red-600"
//                                                         onClick={() => deleteItem("prescriptions", p.id)}
//                                                     >
//                                                         Delete
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         ))
//                                     ) : (
//                                         <p className="text-gray-500">No prescriptions found</p>
//                                     )}
//                                     <button
//                                         onClick={() =>
//                                             addItem("prescriptions", {
//                                                 drugName: "New Drug",
//                                                 dosage: "10mg",
//                                                 instructions: "Take daily",
//                                             })
//                                         }
//                                         className="mt-2 text-xs text-green-600"
//                                     >
//                                         + Add Prescription
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
