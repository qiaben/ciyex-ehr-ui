"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileCode2, Eye, X as XIcon, Copy, Download, Save,
  Undo2, Redo2, Trash2, Search, Plus, ChevronDown, Upload
} from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

/* =========================================================
   Server API helpers (all via fetchWithAuth)
   ========================================================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API = `${API_BASE}/api/template-documents`;

// map UI context <-> backend enum
const toServerContext = (c: "encounter" | "portal") =>
  (c === "encounter" ? "ENCOUNTER" : "PORTAL") as "ENCOUNTER" | "PORTAL";
const fromServerContext = (c: "ENCOUNTER" | "PORTAL") =>
  (c === "ENCOUNTER" ? "encounter" : "portal") as "encounter" | "portal";

type UpsertBody = {
  name: string;
  context: "ENCOUNTER" | "PORTAL";
  content: string; // full <!doctype html> doc
  options: {
    theme: TemplateTheme;
    container: TemplateContainer;
    card: boolean;
    applyWrapperToFullHTML: boolean;
  };
};

type ServerTemplate = {
  id: number;
  name: string;
  context: "ENCOUNTER" | "PORTAL";
  content: string;
  options: any;            // may be object or JSON string
  createdAt?: string;
  updatedAt?: string;
};

async function apiCreateTemplate(body: UpsertBody): Promise<ServerTemplate> {
  const res = await fetchWithAuth(`${API}`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiUpdateTemplate(id: number, body: UpsertBody): Promise<ServerTemplate> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiGetTemplate(id: number): Promise<ServerTemplate> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiListTemplates(context?: "ENCOUNTER" | "PORTAL"): Promise<ServerTemplate[]> {
  const url = context ? `${API}?context=${context}` : `${API}`;
  const res = await fetchWithAuth(url, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiDeleteTemplate(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/* =========================================================
   Types & constants
   ========================================================= */
type TemplateTheme = "slate" | "stone" | "neutral" | "zinc";
type TemplateContainer = "narrow" | "normal" | "wide";
type TemplateContext = "encounter" | "portal";

interface TemplateOptions {
  theme: TemplateTheme;
  container: TemplateContainer;
  card: boolean;
  applyWrapperToFullHTML: boolean;
  context: TemplateContext; // Encounter/Portal
}

interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  options: TemplateOptions;
  updatedAt: number;
}
type Snap = { title: string; templateText: string; tplOptions: TemplateOptions; currentId: string | null };

const LS_MY_TEMPLATES = "ts_saved_templates_v6";
const LS_DRAFT = "ts_current_draft_v6";

const btn =
  "inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50 active:scale-[.98] transition text-sm";
const pillSm =
  "inline-flex items-center gap-1.5 px-2 py-1 rounded border bg-white hover:bg-gray-50 text-[11px] leading-none";
const card = "bg-white/95 rounded-2xl border border-gray-200 shadow-lg";
const inputBase =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-gray-300";

const uid = () => Math.random().toString(36).slice(2);
const isLikelyHTML = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);
const isFullHTMLDocument = (s: string) => /<!doctype html/i.test(s) || /<html[\s\S]*?>/i.test(s);

/* =========================================================
   Your 4 default templates (content preserved)
   ========================================================= */
const TEMPLATE_HIPAA = `HIPAA Declaration
Given today: {DOS} OpenEMR Software makes it a priority to keep this piece of software updated with the most recent available security options, so it will integrate easily into a HIPAA-compliant practice and will protect our customers with at least the official HIPAA regulations. The Practice: (a) Is required by federal law to maintain the privacy of your PHI and to provide you with this Privacy Notice detailing the Practice's legal duties and privacy practices with respect to your PHI (b) Under the Privacy Rule, it may be required by other laws to grant greater access or maintain greater restrictions on the use of, or release of your PHI than that which is provided for under federal HIPAA laws. (c) Is required to abide by the terms of the Privacy Notice (d) Reserves the right to change the terms of the Privacy Notice and make new Privacy Notice provisions effective for all of your PHI that it maintains if needed (e) Will distribute any revised Privacy Notice to you prior to implementation (f) Will not retaliate against you for filing a complaint Patient Communications: Health Insurance Privacy Act 1996 USA, requires to inform you of the following government stipulations in order for us to contact you with educational and promotional items in the future via e-mail, U.S. mail, telephone, and/or prerecorded messages. We will not share, sell, or use your personal contact information for spam messages. I am aware and have read the policies of this practice towards secrecy and digital information protection: The Practice set up their User accounts for the OpenEMR databases, so it requires Users to log inwith a password. The User have to exit or log out of any medical information when not using it or as soon as Default timeout is reached. When using this medical information registration in front of patients the User should use the "Privacy" feature to hide PHI (Personal Health Information) for other patients in the Search screen. We have developed and will use standard operating procedures (SOPs) requiring any use of the Export Patients Medical or other information to be documented. Users are only allowed to store a copy of your Medical information on a laptop computer or other portable media that is taken outside The Practice if recorded in writing. By signing out of The Practice with any portable device or transport medium this information is to be erased when finished with the need to take this information out of The Practice, if possible this information is only to be taken outside The Practice in encrypted format. Only specific technicians may have occasional access to our hardware and Software. The HIPAA Privacy Rule requires that a practice have a signed Business Associate Contract before granting such access. The Technicians are trained on HIPAA regulations and limit the use and disclosure of customer data to the minimum necessary.
I acknowledge receipt of this notice, have read the contents and understand the content.
Patient Name: {PatientName} Sex: {PatientSex} hereby signs and agree to the terms of this agreement . Our external ID:{PatientID} Born: {PatientDOB} Home Address: {Address} Zip: {Zip}; City: {City}; State: {State} Home Phone: {PatientPhone} Patient Signature:{PatientSignature} Patient:{PatientName} Date: {DOS} I do not accept these terms: {CheckMark} Patient refusal to sign due to the following reason: {TextInput}`;

const TEMPLATE_HELP = `Instructions for completing Pending Forms
Welcome {PatientName}
Filling Out Forms
- Select a form from the list on the left by clicking the appropriate button. After selection, the page will go to full page. To exit, click the Action menu horizontal barred button to toggle page mode.
- Answer all the appropriate queries in the form.
- When finished, click either the 'Save' or 'Submit Document' option in top Action Menu. The 'Save' button will save the currently edited form to your Document History and will still be available for editing until you delete the form or send to your provider using the 'Submit Document' action button.
Sending Documents
- Click the 'Submit Document' button from Action Menu.
- Once sent, the form will show in your Document History as Pending review. You may still make changes to the form until reviewed by practice administrator where once the review is completed, Document History will show the form as Locked and no further edits are available. At this point, your completed document is recorded in your chart (medical record).
Signing Document
- Create or redo your on file signature by clicking the 'Edit Signature' button in top Actions Menu. You may also manage your signature from the Main top menu under 'My Signature'.
- To add your signature to a document, simply click the appropriate sign here 'X'.
- To remove a signature, click the signature to return to the default sign here 'X'.`;

const TEMPLATE_INSURANCE = `INSURANCE INFORMATION
{CheckMark} Medicare# {TextInput} {CheckMark} Medicaid# {TextInput}

{CheckMark} Workers Compensation (job injury) If so then to whom is bill to be sent? {TextInput}

{CheckMark} Other Medical Insurance: Group# {TextInput} ID# {TextInput}

Name/Address 1st or 2nd Insurance:

Name: {TextInput} Relationship: {TextInput}

Address {TextInput} State {TextInput} Zip {TextInput}

Phone: {TextInput} Secondary Phone: {TextInput}

Are you personally responsible for the payment of your fees? {ynRadioGroup}

If not, who is?

Name: {TextInput} Relationship: {TextInput} DOB:{TextInput}

Address {TextInput} State {TextInput} Zip {TextInput}

Phone: {TextInput} Secondary Phone: {TextInput}

Who to notify in emergency (nearest relative or friend)?

Name{TextInput} Relationship{TextInput}

Address: {TextInput} State: {TextInput} Zip: {TextInput}

Work Phone: {TextInput} Home Phone: {TextInput}

Signed by {PatientName} on {CurrentDate:"global"} {CurrentTime} {PatientSignature}`;

const TEMPLATE_PRIVACY = `NOTICE OF PRIVACY PRACTICES PATIENT ACKNOWLEDGEMENT AND CONSENT TO MEDICAL TREATMENT
Patient Name: {PatientName} Date of Birth: {PatientDOB}
I have received and understand this practice's Notice of Privacy Practices written in plain English. The notice provides in detail the uses and disclosures of my protected health information that may be made by this practice, my individual rights, how I may exercise those rights, and the practices legal duties with respect to my information. I understand that the practice reserves the right to change the terms of the Privacy Practices, and to make changes regarding all protected health information. If changes occur then the practice will provide me with a revised copy upon request.
I voluntarily consent to care, including physician examination and tests such as x-ray, laboratory tests and to medical treatment by my physician or his/her assistants or designees, as may be necessary in the judgment of my physician. No guarantees have been made to me as the result of treatment or examination.
Authorization for: In consideration for services received by {ReferringDOC} I agree to pay any and all charges as billed. I also request that direct payments be made to {ReferringDOC} on my behalf by insurers and agencies in the settlement of any of my claims. I understand that my protected health information may need to be released for the purpose of treatment, payment or health care operations.
Medicare Patients: I certify that the information given by me for application for payment under title XVIII of the Social Security Act is correct. I authorize any holder of medical or other relevant information about me be released to the Social Security Administration or it's intermediaries of carriers and such information needed to support application for payment. Including records pertaining to HIV status or treatment (AIDS records), drug and alcohol treatment, and or psychiatric treatment. I assign and authorize payment directly to {ReferringDOC} for the unpaid charges for the physician's services. I understand that I am responsible for all insurance deductibles and coinsurance.
Comments: {TextInput}
Signature: {PatientSignature} Do you authorize electronic signature {CheckMark}
Relationship to patient (if signed by a personal representative): {TextInput}
Are you Primary Care Giver:{ynRadioGroup} Date: {DOS}

Clinic Representative Signature {ReferringDOC} Signed: {AdminSignature}`;

/* =========================================================
   Clipboard helper
   ========================================================= */
async function copyToClipboard(text: string): Promise<"success"|"blocked"|"unavailable"> {
  try {
    if (navigator.clipboard && (window as any).isSecureContext) {
      await navigator.clipboard.writeText(text);
      return "success";
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.readOnly = true; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); document.body.removeChild(ta);
    return ok ? "success" : "blocked";
  } catch { return "unavailable"; }
}

/* =========================================================
   Token → HTML (incl. OrgLogo + signatures)
   ========================================================= */
function signatureHTML(id: string) {
  return `
  <div class="sig-pad my-1">
    <canvas id="sig_${id}" class="w-full h-28 rounded-md border border-dashed border-gray-300 bg-white"></canvas>
    <div class="flex justify-end gap-2 mt-2">
      <button type="button" class="sig-clear px-3 py-1.5 rounded border text-sm">Clear</button>
    </div>
    <input type="hidden" name="signature_${id}" />
  </div>`;
}
function signatureInlineHTML(id: string) {
  return `
  <span class="inline-block align-middle sig-pad mx-1">
    <canvas id="sig_${id}" class="w-36 h-10 rounded border border-dashed border-gray-300 bg-white"></canvas>
    <input type="hidden" name="signature_${id}" />
  </span>`;
}
function orgLogoHTML(src?: string) {
  if (src) {
    return `
    <div class="inline-flex items-center gap-2">
      <img src="${src}" alt="Org Logo" class="org-logo rounded-md"
           style="max-width:160px; max-height:48px; object-fit:contain; background:#fff; border:1px solid #e5e7eb; padding:4px;" />
    </div>`;
  }
  return `
  <div class="inline-flex items-center gap-2">
    <div class="org-logo inline-flex items-center justify-center bg-gray-200 text-gray-600 rounded-md"
         style="width:120px;height:40px;">
      Org&nbsp;Logo
    </div>
  </div>`;
}

function replaceTokens(raw: string) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const timeStr = today.toTimeString().slice(0, 5);

  let html = raw;
  const baseInput = `class="doc-input"`;

  html = html
    .replace(/\{TextInput\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{TextBox:(\d{2})x(\d{3})\}/g, (_m, rows) => `<textarea rows="${Number(rows)}" ${baseInput}></textarea>`)
    .replace(/\{TextBox\}/g, `<textarea rows="4" ${baseInput}></textarea>`)
    .replace(/\{CheckMark\}/g, `<input type="checkbox" class="doc-check" />`)
    .replace(/\{ynRadioGroup\}/g, `<span class="doc-radio"><label><input type="radio" name="yn_${uid()}" value="Yes"/> Yes</label><label><input type="radio" name="yn_${uid()}" value="No"/> No</label></span>`)
    .replace(/\{PatientSignature\}/g, signatureHTML(uid()))
    .replace(/\{AdminSignature\}/g, signatureHTML(uid()))
    // OrgLogo with URL (", ', or no quotes)
    .replace(/\{OrgLogo:\s*"([^"]+)"\}/g, (_m, url) => orgLogoHTML(url))
    .replace(/\{OrgLogo:\s*'([^']+)'\}/g, (_m, url) => orgLogoHTML(url))
    .replace(/\{OrgLogo:\s*(https?:\/\/[^\s}]+)\s*\}/g, (_m, url) => orgLogoHTML(url))
    // fallback no-URL
    .replace(/\{OrgLogo\}/g, orgLogoHTML())
    .replace(/\{CurrentDate:"global"\}/g, `<input type="date" value="${todayStr}" ${baseInput} />`)
    .replace(/\{CurrentTime\}/g, `<input type="time" value="${timeStr}" ${baseInput} />`)
    .replace(/\{DOS\}/g, `<input type="date" value="${todayStr}" ${baseInput} />`)
    .replace(/\{PatientName\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{PatientDOB\}/g, `<input type="date" max="${todayStr}" ${baseInput} />`)
    .replace(/\{PatientSex\}/g, `<select ${baseInput}><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select>`)
    .replace(/\{PatientID\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{PatientPhone\}/g, `<input type="tel" ${baseInput} />`)
    .replace(/\{Address\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{City\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{State\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{Zip\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{ReferringDOC\}/g, `<input type="text" ${baseInput} />`);

  // Replace “X” hotspots with inline signature
  html = html
    .replace(/‘X’|’X’|“X”|”X”|\'X\'|\"X\"/g, signatureInlineHTML(uid()))
    .replace(/(?:\s|\b)X(\s|\b)/g, (_m, tail) => " " + signatureInlineHTML(uid()) + (tail || " "));

  return html;
}

/* =========================================================
   Preview document wrapper (Tailwind inside iframe)
   ========================================================= */
function signatureInit() {
  document.querySelectorAll('.sig-pad').forEach(function(wrapper){
    const canvas = wrapper.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const hidden = wrapper.querySelector('input[type="hidden"]') as HTMLInputElement | null;
    const ctx = canvas.getContext('2d')!;
    let drawing = false, lastX = 0, lastY = 0;

    function size() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * ratio);
      canvas.height = Math.max(1, rect.height * ratio);
      (ctx as any).setTransform(ratio,0,0,ratio,0,0);
      (ctx as any).lineWidth = 2; (ctx as any).lineJoin = 'round'; (ctx as any).lineCap = 'round'; (ctx as any).strokeStyle = '#111827';
    }
    size(); window.addEventListener('resize', size);

    const pos = (e:any) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
    const down = (e:any) => { drawing = true; const {x,y}=pos(e); lastX=x; lastY=y; };
    const move = (e:any) => { if(!drawing) return; e.preventDefault(); const {x,y}=pos(e); (ctx as any).beginPath(); (ctx as any).moveTo(lastX,lastY); (ctx as any).lineTo(x,y); (ctx as any).stroke(); lastX=x; lastY=y; if(hidden) hidden.value = canvas.toDataURL('image/png'); };
    const up = () => { drawing = false; };

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, {passive:false} as any);
    canvas.addEventListener('touchmove', move, {passive:false} as any);
    window.addEventListener('touchend', up);

    wrapper.querySelector<HTMLButtonElement>('.sig-clear')?.addEventListener('click', () => {
      (ctx as any).clearRect(0,0,canvas.width, canvas.height);
      if (hidden) hidden.value = '';
    });
  });
}

function baseHTMLWrapper(title: string, contentInner: string, _options: TemplateOptions) {
  const wrapper = `<div class="max-w-3xl mx-auto">${contentInner}</div>`;

  return `<!doctype html>
<html lang="en" data-context="${_options.context}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<style>
:root{--doc-border:#e5e7eb;--doc-bg:linear-gradient(to bottom,#f8fafc,#f1f5f9);--fg:#0f172a}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;padding:2rem;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";background:var(--doc-bg);color:var(--fg)}
.doc-card{margin:0 auto;background:#fff;border:1px solid var(--doc-border);border-radius:14px;padding:2rem;box-shadow:0 10px 30px rgba(2,6,23,.08), 0 2px 8px rgba(2,6,23,.05)}
.max-w-prose{max-width:65ch;margin-left:auto;margin-right:auto}.max-w-2xl{max-width:42rem;margin-inline:auto}.max-w-3xl{max-width:48rem;margin-inline:auto}
.doc-prose{line-height:1.65}.doc-prose h1{font-size:1.75rem;margin:0 0 .75rem;font-weight:600}
.doc-prose h2{font-size:1.35rem;margin:1rem 0 .5rem;font-weight:600}
.doc-prose h3{font-size:1.15rem;margin:.85rem 0 .4rem;font-weight:600}
.doc-prose p{margin:.65rem 0}.doc-prose ul{margin:.4rem 0 .7rem 1.25rem}.doc-prose li{margin:.2rem 0}
.doc-prose table{width:100%;border-collapse:collapse;margin:.75rem 0;border:1px solid var(--doc-border)}
.doc-prose th,.doc-prose td{border:1px solid var(--doc-border);padding:.5rem .6rem;text-align:left}
.doc-prose hr{border:0;border-top:1px solid var(--doc-border);margin:1rem 0}
.doc-input,.doc-check,select,textarea{font:inherit;color:inherit;background:#fff;border:1px solid var(--doc-border);border-radius:10px;padding:.55rem .75rem}
.doc-radio{display:inline-flex;align-items:center;gap:1rem}.doc-radio label{display:inline-flex;align-items:center;gap:.5rem}
.sig-pad canvas{width:100%;height:100%;touch-action:none;display:block}
.org-logo{display:inline-flex;align-items:center;justify-content:center;font-weight:600;letter-spacing:.2px}
</style>
</head>
<body>
<article class="doc-prose">${wrapper}</article>
<script>(${signatureInit.toString()})();</script>
</body>
</html>`;
}

function extractBodyOrAll(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1];
  const htmlMatch = html.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
  if (htmlMatch) return htmlMatch[1];
  return html;
}

function buildPreviewHTML(title: string, templateText: string, options: TemplateOptions) {
  if (!templateText.trim()) return baseHTMLWrapper(title || "Template", "<p></p>", options);

  const replaced = replaceTokens(templateText);

  if (isFullHTMLDocument(replaced) && options.applyWrapperToFullHTML) {
    const inner = `<div class="doc-card">${extractBodyOrAll(replaced)}</div>`;
    return baseHTMLWrapper(title || "Template", inner, options);
  }

  if (isFullHTMLDocument(replaced)) {
    const scriptTag = `<script>(${signatureInit.toString()})();</script>`;
    return /<\/body>/i.test(replaced)
      ? replaced.replace(/<\/body>/i, scriptTag + "</body>")
      : replaced + scriptTag;
  }

  if (isLikelyHTML(replaced)) {
    const inner = `<div class="doc-card">${replaced}</div>`;
    return baseHTMLWrapper(title || "Template", inner, options);
  }

  const para = replaced
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  const inner = `<div class="doc-card">${para}</div>`;
  return baseHTMLWrapper(title || "Template", inner, options);
}

/* =========================================================
   Component
   ========================================================= */
export default function TemplateStudio() {
  // Editor
  const [title, setTitle] = useState<string>("");
  const [templateText, setTemplateText] = useState<string>("");
  const [tplOptions, setTplOptions] = useState<TemplateOptions>({
    theme: "slate",
    container: "normal",
    card: true,
    applyWrapperToFullHTML: false,
    context: "encounter",
  });
  const [currentId, setCurrentId] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<Snap[]>([]);
  const [future, setFuture] = useState<Snap[]>([]);
  const lastPush = useRef(0);
  const pushHistory = () => {
    const now = Date.now();
    if (now - lastPush.current < 250) return;
    lastPush.current = now;
    setHistory((h) => [...h, { title, templateText, tplOptions, currentId }]);
    setFuture([]);
  };
  const undo = () => setHistory(h => {
    if (!h.length) return h;
    const prev = h[h.length-1];
    setFuture(f => [{ title, templateText, tplOptions, currentId }, ...f]);
    setTitle(prev.title); setTemplateText(prev.templateText); setTplOptions(prev.tplOptions); setCurrentId(prev.currentId);
    return h.slice(0, -1);
  });
  const redo = () => setFuture(f => {
    if (!f.length) return f;
    const [next, ...rest] = f;
    setHistory(h => [...h, { title, templateText, tplOptions, currentId }]);
    setTitle(next.title); setTemplateText(next.templateText); setTplOptions(next.tplOptions); setCurrentId(next.currentId);
    return rest;
  });

  // Saved (from server)
  const [myTemplates, setMyTemplates] = useState<SavedTemplate[]>([]);
  const [filter, setFilter] = useState("");

  const filteredTemplates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const byContext = myTemplates.filter(t => (t.options?.context || "encounter") === tplOptions.context);
    if (!q) return byContext;
    return byContext.filter(t => t.name.toLowerCase().includes(q));
  }, [myTemplates, tplOptions.context, filter]);

  // Draft persist only (keep)
  useEffect(() => {
    try {
      const d = localStorage.getItem(LS_DRAFT);
      if (d) {
        const obj = JSON.parse(d);
        if (obj) {
          setTitle(obj.title||"");
          setTemplateText(obj.templateText||"");
          if (obj.tplOptions) setTplOptions({ context: obj.tplOptions.context ?? "encounter", ...obj.tplOptions });
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(LS_DRAFT, JSON.stringify({ title, templateText, tplOptions })); } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [title, templateText, tplOptions]);

  // Load list from server when context changes
  useEffect(() => {
    (async () => {
      try {
        const ctx = toServerContext(tplOptions.context);
        const rows = await apiListTemplates(ctx);
        const mapped: SavedTemplate[] = rows.map((t) => {
          const opts = typeof t.options === "string" ? JSON.parse(t.options) : (t.options || {});
          return {
            id: String(t.id),
            name: t.name,
            content: t.content,
            options: {
              theme: opts.theme ?? tplOptions.theme,
              container: opts.container ?? tplOptions.container,
              card: opts.card ?? tplOptions.card,
              applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? tplOptions.applyWrapperToFullHTML,
              context: fromServerContext(t.context),
            },
            updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
          };
        });
        setMyTemplates(mapped);
      } catch (e) {
        console.warn("Failed to load templates from server:", e);
      }
    })();
  }, [tplOptions.context]);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewHTML = useMemo(() => buildPreviewHTML(title, templateText, tplOptions), [title, templateText, tplOptions]);

  // Notifications
  const [notice, setNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(null), 2200); };

  // New
  const newTemplate = () => { pushHistory(); setTitle(""); setTemplateText(""); setCurrentId(null); };

  // Save dialog
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const openSaveDialog = (defaultName?: string) => { setSaveName(defaultName ?? (title || "Untitled Template")); setSaveOpen(true); };

  // Create-or-update on server
  async function performSave(name: string) {
    const body: UpsertBody = {
      name: name || title || "Untitled Template",
      context: toServerContext(tplOptions.context),
      content: templateText,
      options: {
        theme: tplOptions.theme,
        container: tplOptions.container,
        card: tplOptions.card,
        applyWrapperToFullHTML: tplOptions.applyWrapperToFullHTML,
      },
    };

    try {
      let saved: ServerTemplate;
      if (currentId) {
        saved = await apiUpdateTemplate(Number(currentId), body);
        showNotice("Saved again (server).");
      } else {
        saved = await apiCreateTemplate(body);
        showNotice("Saved (server).");
      }

      // sync editor and id from server
      const opts = typeof saved.options === "string" ? JSON.parse(saved.options) : (saved.options || {});
      setCurrentId(String(saved.id));
      setTitle(saved.name);
      setTemplateText(saved.content);
      setTplOptions((s) => ({
        ...s,
        context: fromServerContext(saved.context),
        theme: opts.theme ?? s.theme,
        container: opts.container ?? s.container,
        card: opts.card ?? s.card,
        applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? s.applyWrapperToFullHTML,
      }));

      // refresh list
      const rows = await apiListTemplates(saved.context);
      const mapped: SavedTemplate[] = rows.map((t) => {
        const o = typeof t.options === "string" ? JSON.parse(t.options) : (t.options || {});
        return {
          id: String(t.id),
          name: t.name,
          content: t.content,
          options: { ...o, context: fromServerContext(t.context) },
          updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
        };
      });
      setMyTemplates(mapped);
    } catch (e: any) {
      console.error(e);
      showNotice("Save failed");
    } finally {
      setSaveOpen(false);
    }
  }

  const saveTemplate = () => {
    if (!currentId) openSaveDialog(title || "Untitled Template");
    else performSave(title || "Untitled Template");
  };

  // Delete (server)
  const [pendingDelete, setPendingDelete] = useState<SavedTemplate | null>(null);
  const requestDelete = (t: SavedTemplate) => { setPendingDelete(t); };
  const performDelete = async () => {
    const t = pendingDelete; if (!t) return;
    setPendingDelete(null);
    try {
      await apiDeleteTemplate(Number(t.id));
      setMyTemplates(prev => prev.filter(x => x.id !== t.id));
      if (t.id === currentId) { setCurrentId(null); setTitle(""); setTemplateText(""); }
      showNotice("Deleted (server).");
    } catch (e:any) {
      console.error(e);
      showNotice("Delete failed");
    }
  };

  // Import (create on server)
  const importAnything = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = evt.target.files?.[0]; if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = async () => {
      const text = String(reader.result || "");

      const createOne = async (name: string, content: string) => {
        const body: UpsertBody = {
          name,
          context: toServerContext(tplOptions.context),
          content,
          options: {
            theme: tplOptions.theme,
            container: tplOptions.container,
            card: tplOptions.card,
            applyWrapperToFullHTML: tplOptions.applyWrapperToFullHTML,
          },
        };
        const saved = await apiCreateTemplate(body);
        return saved;
      };

      try {
        if (ext === "json") {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            for (const t of parsed) {
              await createOne(String(t.name || "Imported Template"), String(t.content || ""));
            }
            showNotice(`Imported ${parsed.length} ${tplOptions.context} templates.`);
          } else if (parsed && typeof parsed === "object" && ("content" in parsed || "title" in parsed || "name" in parsed)) {
            const saved = await createOne(String(parsed.name || parsed.title || "Imported Template"), String(parsed.content ?? ""));
            const o = typeof saved.options === "string" ? JSON.parse(saved.options) : (saved.options || {});
            pushHistory();
            setCurrentId(String(saved.id));
            setTitle(saved.name);
            setTemplateText(saved.content);
            setTplOptions((s) => ({
              ...s,
              context: fromServerContext(saved.context),
              theme: o.theme ?? s.theme, container: o.container ?? s.container, card: o.card ?? s.card,
              applyWrapperToFullHTML: o.applyWrapperToFullHTML ?? s.applyWrapperToFullHTML,
            }));
            showNotice("Imported form into editor (server).");
          } else {
            const saved = await createOne(f.name.replace(/\.[^.]+$/, "") || "Imported Template", text);
            const o = typeof saved.options === "string" ? JSON.parse(saved.options) : (saved.options || {});
            pushHistory();
            setCurrentId(String(saved.id));
            setTitle(saved.name);
            setTemplateText(saved.content);
            setTplOptions((s) => ({ ...s, context: fromServerContext(saved.context), ...o }));
            showNotice("Imported into editor (server).");
          }
        } else {
          const defaultName = f.name.replace(/\.[^.]+$/, "") || "Imported Template";
          const saved = await createOne(defaultName, text);
          const o = typeof saved.options === "string" ? JSON.parse(saved.options) : (saved.options || {});
          pushHistory();
          setCurrentId(String(saved.id));
          setTitle(saved.name);
          setTemplateText(saved.content);
          setTplOptions((s) => ({ ...s, context: fromServerContext(saved.context), ...o }));
          showNotice("Imported into editor (server).");
        }

        // refresh list after import
        const rows = await apiListTemplates(toServerContext(tplOptions.context));
        const mapped: SavedTemplate[] = rows.map((t) => {
          const o = typeof t.options === "string" ? JSON.parse(t.options) : (t.options || {});
          return {
            id: String(t.id),
            name: t.name,
            content: t.content,
            options: { ...o, context: fromServerContext(t.context) },
            updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
          };
        });
        setMyTemplates(mapped);
      } catch (err) {
        console.error(err);
        showNotice("Import failed");
      } finally {
        evt.target.value = "";
      }
    };

    reader.readAsText(f);
  };

  // Editor counts (SINGLE definition)
  const counts = useMemo(() => {
    const t = templateText.trim();
    return { words: t ? t.split(/\s+/).length : 0, chars: t.length };
  }, [templateText]);

  // Token insert
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart ?? templateText.length;
    const end = ta.selectionEnd ?? templateText.length;

    const next = templateText.slice(0, start) + text + templateText.slice(end);
    pushHistory();
    setTemplateText(next);

    // restore cursor after insert
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    }, 0);
  };


  // Defaults loader
  const loadDefault = (key: "HIPAA"|"HELP"|"INS"|"PRIV") => {
    const map = {
      HIPAA: { title: "HIPAA Declaration", content: TEMPLATE_HIPAA },
      HELP:  { title: "Help / Pending Forms", content: TEMPLATE_HELP },
      INS:   { title: "Insurance Information", content: TEMPLATE_INSURANCE },
      PRIV:  { title: "Privacy Practices & Consent", content: TEMPLATE_PRIVACY },
    } as const;
    const sel = map[key];
    pushHistory(); setCurrentId(null); setTitle(sel.title); setTemplateText(sel.content);
  };

  // Utilities (necessary only)
  const trimContent = () => { pushHistory(); setTemplateText(templateText.trim()); showNotice("Trimmed."); };
  const normalizeNewlines = () => { pushHistory(); setTemplateText(templateText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n")); showNotice("Normalized newlines."); };
  const smartToAsciiQuotes = () => { pushHistory(); setTemplateText(templateText.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")); showNotice("Converted smart quotes."); };
  const stripHTMLTags = () => { pushHistory(); setTemplateText(templateText.replace(/<\/?[^>]+>/g, "")); showNotice("Stripped HTML tags."); };
  const minifyWhitespace = () => { pushHistory(); setTemplateText(templateText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ")); showNotice("Minified whitespace."); };

  // Load one template from server by ID (on list click)
  const loadTemplate = async (t: SavedTemplate) => {
    try {
      const row = await apiGetTemplate(Number(t.id));
      const opts = typeof row.options === "string" ? JSON.parse(row.options) : (row.options || {});
      pushHistory();
      setCurrentId(String(row.id));
      setTitle(row.name);
      setTemplateText(row.content);
      setTplOptions((s) => ({
        ...s,
        context: fromServerContext(row.context),
        theme: opts.theme ?? s.theme,
        container: opts.container ?? s.container,
        card: opts.card ?? s.card,
        applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? s.applyWrapperToFullHTML,
      }));
    } catch (e) {
      console.error(e);
      showNotice("Load failed");
    }
  };

  /* =========== COLLAPSE STATES =========== */
  const [leftOpenInstructions, setLeftOpenInstructions] = useState(true);
  const [leftOpenTokens, setLeftOpenTokens] = useState(true);
  const [leftOpenDefaults, setLeftOpenDefaults] = useState(true);

  const [rightOpenMyTemplates, setRightOpenMyTemplates] = useState(true);
  const [rightOpenImport, setRightOpenImport] = useState(true);
  const [rightOpenUtils, setRightOpenUtils] = useState(true);

  /* =========== copyHTML & downloadHTML =========== */
  const copyHTML = async () => {
    const result = await copyToClipboard(previewHTML);
    if (result === "success") showNotice("Copied HTML to clipboard.");
    else showNotice("Clipboard blocked — use Download.");
  };

  const downloadHTML = () => {
    const blob = new Blob([previewHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (title || "template").replace(/[^\w\-]+/g, "-").toLowerCase();
    a.href = url;
    a.download = `${safeTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice("Download started.");
  };

  // optional: open server-rendered html in new tab
  const openServerPreview = () => {
    if (!currentId) { showNotice("Save first to preview from server."); return; }
    const url = `${API}/${currentId}/html`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <FileCode2 className="w-5 h-5" />
          <input
            value={title} onChange={(e)=>{pushHistory(); setTitle(e.target.value);}}
            placeholder="Template title"
            className="text-base font-medium bg-transparent outline-none flex-1"
          />

          {/* Encounter / Portal segmented toggle */}
          <div className="hidden md:flex items-center gap-1 rounded-xl border bg-white p-1 shadow-sm">
            {(["encounter","portal"] as TemplateContext[]).map(opt => (
              <button
                key={opt}
                className={`px-3 py-1.5 text-sm rounded-lg ${tplOptions.context===opt ? "bg-black text-white shadow" : "hover:bg-gray-50"}`}
                onClick={() => setTplOptions(s => ({ ...s, context: opt }))}
                title={`Show ${opt} templates`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button className={btn} onClick={undo} disabled={!history.length}><Undo2 className="w-4 h-4"/>Undo</button>
            <button className={btn} onClick={redo} disabled={!future.length}><Redo2 className="w-4 h-4"/>Redo</button>
            <button className={btn} onClick={newTemplate}><Plus className="w-4 h-4"/>New</button>
            <button className={btn} onClick={()=>setPreviewOpen(true)}><Eye className="w-4 h-4"/>Preview</button>
            <button className={btn} onClick={openServerPreview}><Eye className="w-4 h-4"/>Server</button>
            <button className={btn} onClick={copyHTML}><Copy className="w-4 h-4"/>Copy</button>
            <button className={btn} onClick={downloadHTML}><Download className="w-4 h-4"/>Download</button>
            <button className={btn} onClick={saveTemplate}><Save className="w-4 h-4"/>Save</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3 space-y-3">
          {/* Instructions */}
          <div className={card}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold rounded-t-2xl"
              onClick={()=>setLeftOpenInstructions(v=>!v)}>
              <span>Instructions</span>
              <ChevronDown className={`w-4 h-4 transition ${leftOpenInstructions ? "rotate-180" : ""}`} />
            </button>
            {leftOpenInstructions && (
              <div className="p-3">
                <ol className="text-xs space-y-1.5 list-decimal ml-5">
                  <li>Paste raw text or full HTML + CSS into the editor.</li>
                  <li>Use <strong>Tokens</strong> to insert form fields (checkbox, text box, signature, date/time…).</li>
                  <li>Use the top toggle to switch between <strong>Encounter</strong> and <strong>Portal</strong> modes.</li>
                  <li>Only templates for the current mode appear in <strong>My templates</strong>.</li>
                  <li><strong>Save</strong> stores the template to the server; saving again updates it.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Tokens */}
          <div className={card}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold"
              onClick={()=>setLeftOpenTokens(v=>!v)}>
              <span>Tokens</span>
              <ChevronDown className={`w-4 h-4 transition ${leftOpenTokens ? "rotate-180" : ""}`} />
            </button>
            {leftOpenTokens && (
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "{TextInput}","{TextBox}","{TextBox:03x080}","{CheckMark}","{ynRadioGroup}",
                    "{PatientSignature}","{AdminSignature}","{OrgLogo}",
                    '{OrgLogo:"https://example.com/logo.png"}',
                    '{CurrentDate:"global"}',"{CurrentTime}","{DOS}",
                    "{PatientName}","{PatientDOB}","{PatientSex}","{PatientID}","{PatientPhone}",
                    "{Address}","{City}","{State}","{Zip}","{ReferringDOC}"
                  ].map(tok => (
                    <button key={tok} className={pillSm} onClick={()=>insertAtCursor(tok)}>{tok}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Default templates */}
          <div className={card}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold"
              onClick={()=>setLeftOpenDefaults(v=>!v)}>
              <span>Default templates</span>
              <ChevronDown className={`w-4 h-4 transition ${leftOpenDefaults ? "rotate-180" : ""}`} />
            </button>
            {leftOpenDefaults && (
              <div className="p-3 grid gap-2">
                <button className={btn} onClick={()=>loadDefault("HIPAA")}>HIPAA Declaration</button>
                <button className={btn} onClick={()=>loadDefault("HELP")}>Help / Pending Forms</button>
                <button className={btn} onClick={()=>loadDefault("INS")}>Insurance Information</button>
                <button className={btn} onClick={()=>loadDefault("PRIV")}>Privacy Practices & Consent</button>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER EDITOR */}
        <section className="col-span-12 md:col-span-6">
          <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.25}} className={`${card} overflow-hidden`}>
            <div className="px-4 py-2 border-b bg-gray-50/70 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Template</h3>
              {/* Mobile context toggle */}
              <div className="md:hidden">
                <div className="inline-flex items-center gap-1 rounded-xl border bg-white p-1 shadow-sm">
                  {(["encounter","portal"] as TemplateContext[]).map(opt => (
                    <button
                      key={opt}
                      className={`px-3 py-1.5 text-sm rounded-lg ${tplOptions.context===opt ? "bg-black text-white shadow" : "hover:bg-gray-50"}`}
                      onClick={() => setTplOptions(s => ({ ...s, context: opt }))}
                      title={`Show ${opt} templates`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              className="w-full min-h-[560px] outline-none border-0 p-4 font-mono text-sm bg-white"
              value={templateText}
              onChange={(e)=>{pushHistory(); setTemplateText(e.target.value);}}
              placeholder="Type or paste your template…"
            />
            <div className="px-4 py-2 border-t bg-gray-50/70 text-xs text-gray-600 flex items-center justify-between">
              <span>{counts.words} words · {counts.chars} chars</span>
              <span>{currentId ? `Editing saved template (${tplOptions.context})` : `Editing new template (${tplOptions.context})`}</span>
            </div>
          </motion.div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3 space-y-3">
          {/* My templates */}
          <div className={card}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold"
              onClick={()=>setRightOpenMyTemplates(v=>!v)}>
              <span>My templates</span>
              <ChevronDown className={`w-4 h-4 transition ${rightOpenMyTemplates ? "rotate-180" : ""}`} />
            </button>
            {rightOpenMyTemplates && (
              <div className="p-3 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                  <input className={`${inputBase} pl-8`} placeholder={`Search ${tplOptions.context} templates…`} value={filter} onChange={(e)=>setFilter(e.target.value)} />
                </div>

                <div className="grid gap-2 max-h-[32vh] overflow-auto">
                  {filteredTemplates.length === 0 && <p className="text-sm text-gray-500">No saved {tplOptions.context} templates yet.</p>}
                  {filteredTemplates.map(t => (
                    <div key={t.id} className="rounded-xl border p-2 bg-white shadow-sm">
                      <div className="flex items-center gap-2">
                        <button className="text-left flex-1 hover:underline" title="Load" onClick={()=>loadTemplate(t)}>
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text[11px] text-gray-500">{new Date(t.updatedAt).toLocaleString()} · {(t.options?.context || "encounter")}</div>
                        </button>
                        <button className={btn} onClick={()=>requestDelete(t)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t flex flex-wrap gap-2">
                  <button className={btn} onClick={saveTemplate}>
                    <Save className="w-4 h-4"/>Save
                  </button>
                  <button className={btn} onClick={()=>setPreviewOpen(true)}><Eye className="w-4 h-4"/>Preview</button>
                  <button className={btn} onClick={openServerPreview}><Eye className="w-4 h-4"/>Server</button>
                </div>
              </div>
            )}
          </div>

          {/* Import */}
          <div className={card}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold"
              onClick={()=>setRightOpenImport(v=>!v)}>
              <span>Import</span>
              <ChevronDown className={`w-4 h-4 transition ${rightOpenImport ? "rotate-180" : ""}`} />
            </button>
            {rightOpenImport && (
              <div className="p-3 flex flex-col gap-2">
                <label className={btn}>
                  <Upload className="w-4 h-4"/> Import (.html, .htm, .txt, .json)
                  <input hidden type="file" accept=".html,.htm,.txt,.json,application/json" onChange={importAnything}/>
                </label>
                <p className="text-xs text-gray-600">
                  JSON array = creates many on server (assigned to <strong>{tplOptions.context}</strong>). File/text = creates one and loads it.
                </p>
              </div>
            )}
          </div>

          {/* Utils */}
          <div className={card}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold"
              onClick={()=>setRightOpenUtils(v=>!v)}>
              <span>Utils</span>
              <ChevronDown className={`w-4 h-4 transition ${rightOpenUtils ? "rotate-180" : ""}`} />
            </button>
            {rightOpenUtils && (
              <div className="p-3 flex flex-wrap gap-2">
                <button className={btn} onClick={trimContent}>Trim</button>
                <button className={btn} onClick={normalizeNewlines}>Normalize</button>
                <button className={btn} onClick={smartToAsciiQuotes}>Smart→ASCII</button>
                <button className={btn} onClick={minifyWhitespace}>Minify</button>
                <button className={btn} onClick={stripHTMLTags}>Strip tags</button>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Notice */}
      {notice && (
        <div className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black text-white text-sm px-3 py-1.5 rounded-md shadow">{notice}</div>
        </div>
      )}

      {/* Preview popup (client-rendered) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[1100px] h-[86vh] bg-white rounded-2xl shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/70">
              <div className="flex items-center gap-2"><Eye className="w-4 h-4"/><span className="text-sm font-medium">Live Preview</span></div>
              <button className={btn} onClick={()=>setPreviewOpen(false)}><XIcon className="w-4 h-4"/>Close</button>
            </div>
            <iframe
              title="Live Preview"
              className="w-full h-[calc(86vh-44px)] bg-white"
              sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts"
              srcDoc={previewHTML}
            />
          </div>
        </div>
      )}

      {/* Save dialog */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-[min(92vw,520px)] bg-white rounded-2xl border shadow-2xl overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-100 text-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2"><Save className="w-4 h-4"/><h3 className="text-sm font-semibold">Save template</h3></div>
              <button className={btn} onClick={()=>setSaveOpen(false)}><XIcon className="w-4 h-4"/>Close</button>
            </div>
            <div className="p-4 space-y-3">
              <label className="text-xs text-gray-600">Template name</label>
              <input className={inputBase} autoFocus value={saveName} onChange={(e)=>setSaveName(e.target.value)} placeholder="Enter a name…"/>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button className={btn} onClick={()=>setSaveOpen(false)}>Cancel</button>
              <button
                className={`${btn}`}
                onClick={()=>{ if (!saveName.trim()) return; performSave(saveName.trim()); }}
                style={{ color: '#000', fontWeight: 600 }}
              >
                <Save className="w-4 h-4"/> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-[min(92vw,520px)] bg-white rounded-2xl border shadow-2xl overflow-hidden">
            <div className="px-4 py-2 border-b bg-red-50 text-red-900 flex items-center justify-between">
              <div className="flex items-center gap-2"><Trash2 className="w-4 h-4"/><h3 className="text-sm font-semibold">Confirm delete</h3></div>
              <button className={btn} onClick={()=>setPendingDelete(null)}><XIcon className="w-4 h-4"/>Close</button>
            </div>
            <div className="p-4 text-sm">
              Are you sure you want to delete <strong>"{pendingDelete.name}"</strong>? This action cannot be undone.
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button className={btn} onClick={()=>setPendingDelete(null)}>Cancel</button>
              <button className={`${btn} bg-red-600 text-white border-red-600 hover:bg-red-700`} onClick={performDelete}>
                <Trash2 className="w-4 h-4"/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
