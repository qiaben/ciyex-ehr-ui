
// // src/components/encounter/providersignature/Providersignatureform.tsx
// "use client";
//
// import { useEffect, useRef, useState } from "react";
// import { fetchWithOrg } from "@/utils/fetchWithOrg";
// import type { ApiResponse, ProviderSignatureDto } from "@/utils/types";
//
// type Props = {
//     patientId: number;
//     encounterId: number;
//     value?: ProviderSignatureDto | null;
//     onSaved: (saved: ProviderSignatureDto) => void;
//     onAfterSubmit?: () => void;
// };
//
// const ROLES = ["MD", "DO", "NP", "PA", "RN", "Other"];
//
// // SHA-256 to hex (no TS BufferSource error)
// async function sha256Hex(input: string): Promise<string> {
//     const bytes = new TextEncoder().encode(input);
//     const digest = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
//     const arr = new Uint8Array(digest);
//     return Array.from(arr)
//         .map((b) => b.toString(16).padStart(2, "0"))
//         .join("");
// }
//
// // File → base64 (strip data URL prefix)
// function readFileAsBase64(file: File): Promise<{ base64: string; mime: string }> {
//     return new Promise((resolve, reject) => {
//         const r = new FileReader();
//         r.onerror = () => reject(new Error("Failed reading signature image"));
//         r.onload = () => {
//             const dataUrl = String(r.result || "");
//             const [, base64] = dataUrl.split(",", 2);
//             resolve({ base64: base64 || "", mime: file.type || "image/png" });
//         };
//         r.readAsDataURL(file);
//     });
// }
//
// export default function Providersignatureform({
//                                                   patientId,
//                                                   encounterId,
//                                                   value,
//                                                   onSaved,
//                                                   onAfterSubmit,
//                                               }: Props) {
//     const [signedBy, setSignedBy] = useState("");
//     const [signerRole, setSignerRole] = useState(ROLES[0]);
//     const [comments, setComments] = useState("");
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState<string | null>(null);
//     const fileRef = useRef<HTMLInputElement | null>(null);
//
//     const isLocked =
//         (value as any)?.status?.toLowerCase?.() === "signed" ||
//         (value as any)?.status?.toLowerCase?.() === "locked";
//
//     useEffect(() => {
//         setSignedBy((value as any)?.signedBy || "");
//         setSignerRole((value as any)?.signerRole || ROLES[0]);
//         setComments((value as any)?.comments || "");
//     }, [value]);
//
//     async function submit() {
//         if (isLocked) return;
//         setSaving(true);
//         setErr(null);
//
//         try {
//             // optional image
//             let signatureData = (value as any)?.signatureData || "";
//             let signatureFormat = (value as any)?.signatureFormat || "image/png";
//             if (fileRef.current?.files?.[0]) {
//                 const f = fileRef.current.files[0];
//                 const r = await readFileAsBase64(f);
//                 signatureData = r.base64;
//                 signatureFormat = r.mime;
//             }
//
//             const payload: ProviderSignatureDto & Record<string, unknown> = {
//                 id: (value as any)?.id,
//                 patientId,
//                 encounterId,
//                 signedAt: new Date().toISOString(),
//                 signedBy: signedBy.trim(),
//                 signerRole,
//                 signatureType: "ELECTRONIC",
//                 signatureFormat,
//                 signatureData,
//                 signatureHash: signatureData ? await sha256Hex(signatureData) : (value as any)?.signatureHash,
//                 status: "active",
//                 comments: comments.trim(),
//             };
//
//             // ✅ plural endpoints: POST create, PUT update
//             const url = (value as any)?.id
//                 ? `/api/provider-signatures/${patientId}/${encounterId}/${(value as any).id}`
//                 : `/api/provider-signatures/${patientId}/${encounterId}`;
//             const method = (value as any)?.id ? "PUT" : "POST";
//
//             const res = await fetchWithOrg(url, { method, body: JSON.stringify(payload) });
//             const json = (await res.json()) as ApiResponse<ProviderSignatureDto>;
//             if (!res.ok || !json?.success) throw new Error(json?.message || "Save failed");
//
//             onSaved(json.data!);
//             onAfterSubmit?.();
//
//             if (!(value as any)?.id) {
//                 setComments("");
//                 if (fileRef.current) fileRef.current.value = "";
//             }
//         } catch (e: any) {
//             setErr(e?.message ?? "Something went wrong");
//         } finally {
//             setSaving(false);
//         }
//     }
//
//     return (
//         <div className="rounded-2xl border p-4 shadow-sm bg-white space-y-3">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Signed By</label>
//                     <input
//                         className="w-full rounded-lg border px-3 py-2"
//                         placeholder="dr.rajaclinic.test"
//                         value={signedBy}
//                         disabled={isLocked}
//                         onChange={(e) => setSignedBy(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Role</label>
//                     <select
//                         className="w-full rounded-lg border px-3 py-2"
//                         value={signerRole}
//                         disabled={isLocked}
//                         onChange={(e) => setSignerRole(e.target.value)}
//                     >
//                         {ROLES.map((r) => (
//                             <option key={r} value={r}>
//                                 {r}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Signature Image</label>
//                     <input ref={fileRef} type="file" accept="image/*" disabled={isLocked} className="block w-full text-sm" />
//                 </div>
//             </div>
//
//             <div>
//                 <label className="block text-sm font-medium mb-1">Comments</label>
//                 <textarea
//                     className="w-full rounded-lg border px-3 py-2 min-h-20"
//                     value={comments}
//                     disabled={isLocked}
//                     onChange={(e) => setComments(e.target.value)}
//                     placeholder='e.g., "Signed SOAP note"'
//                 />
//             </div>
//
//             {err && <p className="text-sm text-red-600">{err}</p>}
//
//             <div className="flex gap-2">
//                 {!isLocked && (
//                     <button
//                         onClick={submit}
//                         disabled={saving}
//                         className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
//                     >
//                         {saving ? "Saving..." : (value as any)?.id ? "Update Signature" : "Sign"}
//                     </button>
//                 )}
//                 {isLocked && (
//                     <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm">Signed</span>
//                 )}
//             </div>
//         </div>
//     );
// }







"use client";

import { useEffect, useRef, useState } from "react";
import { fetchWithOrg } from "@/utils/fetchWithOrg";
import type { ApiResponse, ProviderSignatureDto } from "@/utils/types";

type Props = {
    patientId: number;
    encounterId: number;
    value?: ProviderSignatureDto | null;
    onSaved: (saved: ProviderSignatureDto) => void;
    onAfterSubmit?: () => void;
};

const ROLES = ["MD", "DO", "NP", "PA", "RN", "Other"];

// SHA-256 to hex
async function sha256Hex(input: string): Promise<string> {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
    const arr = new Uint8Array(digest);
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// File → base64 (strip data URL prefix)
function readFileAsBase64(file: File): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error("Failed reading signature image"));
        r.onload = () => {
            const dataUrl = String(r.result || "");
            const [, base64] = dataUrl.split(",", 2);
            resolve({ base64: base64 || "", mime: file.type || "image/png" });
        };
        r.readAsDataURL(file);
    });
}

export default function Providersignatureform({
                                                  patientId,
                                                  encounterId,
                                                  value,
                                                  onSaved,
                                                  onAfterSubmit,
                                              }: Props) {
    const [signedBy, setSignedBy] = useState("");
    const [signerRole, setSignerRole] = useState(ROLES[0]);
    const [comments, setComments] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);

    const isLocked =
        value?.status?.toLowerCase() === "signed" ||
        value?.status?.toLowerCase() === "locked";

    useEffect(() => {
        setSignedBy(value?.signedBy || "");
        setSignerRole(value?.signerRole || ROLES[0]);
        setComments(value?.comments || "");
    }, [value]);

    async function submit() {
        if (isLocked) return;
        setSaving(true);
        setErr(null);

        try {
            // optional image
            let signatureData = value?.signatureData || "";
            let signatureFormat = value?.signatureFormat || "image/png";
            if (fileRef.current?.files?.[0]) {
                const f = fileRef.current.files[0];
                const r = await readFileAsBase64(f);
                signatureData = r.base64;
                signatureFormat = r.mime;
            }

            const payload: ProviderSignatureDto = {
                id: value?.id,
                patientId,
                encounterId,
                signedAt: new Date().toISOString(),
                signedBy: signedBy.trim(),
                signerRole,
                signatureType: "ELECTRONIC",
                signatureFormat,
                signatureData,
                signatureHash: signatureData
                    ? await sha256Hex(signatureData)
                    : value?.signatureHash,
                status: "active",
                comments: comments.trim(),
            };

            const url = value?.id
                ? `/api/provider-signatures/${patientId}/${encounterId}/${value.id}`
                : `/api/provider-signatures/${patientId}/${encounterId}`;
            const method = value?.id ? "PUT" : "POST";

            const res = await fetchWithOrg(url, { method, body: JSON.stringify(payload) });
            const json = (await res.json()) as ApiResponse<ProviderSignatureDto>;
            if (!res.ok || !json?.success) throw new Error(json?.message || "Save failed");

            onSaved(json.data!);
            onAfterSubmit?.();

            if (!value?.id) {
                setComments("");
                if (fileRef.current) fileRef.current.value = "";
            }
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-2xl border p-4 shadow-sm bg-white space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Signed By</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="dr.rajaclinic.test"
                        value={signedBy}
                        disabled={isLocked}
                        onChange={(e) => setSignedBy(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                        className="w-full rounded-lg border px-3 py-2"
                        value={signerRole}
                        disabled={isLocked}
                        onChange={(e) => setSignerRole(e.target.value)}
                    >
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Signature Image</label>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        disabled={isLocked}
                        className="block w-full text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Comments</label>
                <textarea
                    className="w-full rounded-lg border px-3 py-2 min-h-20"
                    value={comments}
                    disabled={isLocked}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder='e.g., "Signed SOAP note"'
                />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex gap-2">
                {!isLocked && (
                    <button
                        onClick={submit}
                        disabled={saving}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : value?.id ? "Update Signature" : "Sign"}
                    </button>
                )}
                {isLocked && (
                    <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm">
            Signed
          </span>
                )}
            </div>
        </div>
    );
}
