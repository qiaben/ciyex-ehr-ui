"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
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

const toServerContext = (c: "encounter" | "portal") =>
  (c === "encounter" ? "ENCOUNTER" : "PORTAL") as "ENCOUNTER" | "PORTAL";
const fromServerContext = (c: "ENCOUNTER" | "PORTAL") =>
  (c === "ENCOUNTER" ? "encounter" : "portal") as "encounter" | "portal";

type UpsertBody = {
  name: string;
  context: "ENCOUNTER" | "PORTAL";
  content: string;
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
  options: Record<string, unknown>;
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
  context: TemplateContext;
}

interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  options: TemplateOptions;
  updatedAt: number;
}
type Snap = { title: string; templateText: string; tplOptions: TemplateOptions; currentId: string | null };

const LS_DRAFT = "ts_current_draft_v6";

const btn =
  "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 hover:shadow-md hover:from-blue-50 hover:to-white active:scale-[.97] transition text-sm font-medium shadow-sm backdrop-blur-sm";
const pillSm =
  "inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border border-gray-200 bg-white/80 hover:bg-blue-50 text-[11px] leading-none font-semibold shadow-sm";
const cardCls = "bg-white/85 rounded-3xl border border-gray-200 shadow-[0_4px_14px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)] backdrop-blur-sm hover:shadow-[0_10px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.10)] transition";
const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium";

const uid = () => Math.random().toString(36).slice(2);
const isLikelyHTML = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);
const isFullHTMLDocument = (s: string) => /<!doctype html/i.test(s) || /<html[\s\S]*?>/i.test(s);

/* =========================================================
   Default templates
   ========================================================= */
const TEMPLATE_HIPAA = `HIPAA Declaration
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HIPAA Declaration - Ciyex Practice</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2em; background: #f8f9fa; color: #222; }
    .container { max-width: 800px; margin: auto; background: #fff; padding: 2em; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { text-align: center; color: #2d5c9f; }
    .section-title { margin-top: 1.5em; font-weight: bold; color: #2d5c9f; }
    ul, ol { margin-left: 1.5em; margin-bottom: 1em; }
    label { font-weight: bold; }
    .input-row { margin-bottom: 1em; }
    .checkbox-group { display: flex; gap: 1em; align-items: center; }
    .note { font-size: 0.95em; color: #555; margin-top: 0.5em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HIPAA Declaration & Privacy Notice</h1>
    <div class="section-title">Privacy Notice</div>
    <ol>
      <li>The Practice is required by federal law to maintain the privacy of your PHI.</li>
      <li>Under the Privacy Rule, other laws may require greater access or restrictions.</li>
      <li>The Practice is required to abide by the terms of this Privacy Notice.</li>
      <li>The Practice reserves the right to change the terms of this Privacy Notice.</li>
    </ol>
    <form>
      <div class="section-title">Patient Information</div>
      <div class="input-row"><label>Patient Name:</label><input type="text" name="patientName" required></div>
      <div class="input-row"><label>Date of Birth:</label><input type="date" name="patientDOB"></div>
      <div class="checkbox-group"><input type="checkbox" name="acceptTerms" checked><label>I accept these terms</label></div>
      <button type="submit" style="margin-top:1.5em;padding:.6em 1.2em;background:#2d5c9f;color:#fff;border:none;border-radius:4px">Submit</button>
    </form>
  </div>
</body>
</html>`;

const TEMPLATE_HELP = `Instructions for completing Pending Forms
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Instructions</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #f4f6fb; color: #222; font-size: 14px; }
    .container { max-width: 510px; margin: 2em auto; background: #fff; padding: 1.5em 2em; border-radius: 12px; box-shadow: 0 4px 20px rgba(44,62,80,0.08); }
    h1 { font-size: 1.2em; color: #2872d1; text-align: center; }
    .section-title { font-weight: 600; color: #2872d1; margin-top: 1.2em; margin-bottom: 0.6em; }
    .action { background: #e9f2fd; color: #2872d1; border-radius: 4px; padding: 1px 6px; font-weight: 500; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Instructions for Completing Pending Forms</h1>
    <div class="section-title">Filling Out Forms</div>
    <ol><li>Select a form from the list.</li><li>Answer all required queries.</li><li>Click <span class="action">Save</span> or <span class="action">Submit Document</span>.</li></ol>
    <div class="section-title">Sending Documents</div>
    <ol><li>Click <span class="action">Submit Document</span>.</li><li>Your form appears as Pending review.</li><li>Once reviewed, it becomes Locked.</li></ol>
  </div>
</body>
</html>`;

const TEMPLATE_INSURANCE = `INSURANCE INFORMATION
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Insurance Information</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; color: #222; font-size: 14px; margin: 0; }
    .container { max-width: 540px; margin: 2em auto; background: #fff; padding: 2em; border-radius: 12px; box-shadow: 0 4px 20px rgba(44,62,80,.08); }
    h1 { font-size: 1.3em; color: #2872d1; text-align: center; }
    .form-section { margin-bottom: 1.2em; padding-bottom: 0.6em; border-bottom: 1px solid #f0f0f0; }
    .form-row { display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 0.6em; gap: 1em; }
    .form-row label { font-weight: 500; font-size: 13px; min-width: 95px; }
    .submit-btn { display: block; margin: .5em auto 0; background: #2872d1; color: #fff; border: none; border-radius: 6px; padding: .7em 2em; font-size: 15px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>INSURANCE INFORMATION</h1>
    <form>
      <div class="form-section"><div class="form-row"><input type="checkbox"><label>Medicare#</label><input type="text" name="medicareNumber"></div><div class="form-row"><input type="checkbox"><label>Medicaid#</label><input type="text" name="medicaidNumber"></div></div>
      <div class="form-section"><div class="form-row"><label>Insurance Name:</label><input type="text" name="insName1"></div><div class="form-row"><label>Phone:</label><input type="tel" name="insPhone1"></div></div>
      <button type="submit" class="submit-btn">Submit</button>
    </form>
  </div>
</body>
</html>`;

const TEMPLATE_PRIVACY = `NOTICE OF PRIVACY PRACTICES
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Notice of Privacy Practices</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; color: #222; font-size: 14px; margin: 0; }
    .container { max-width: 600px; margin: 2em auto; background: #fff; padding: 2em; border-radius: 12px; box-shadow: 0 4px 20px rgba(44,62,80,.08); }
    h1 { font-size: 1.3em; color: #2872d1; text-align: center; }
    .section-title { font-weight: 600; color: #2872d1; margin-bottom: 0.8em; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.3em; }
    .submit-btn { display: block; margin: 2em auto 0; background: #2872d1; color: #fff; border: none; border-radius: 6px; padding: .7em 2em; font-size: 15px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>NOTICE OF PRIVACY PRACTICES</h1>
    <form>
      <div class="section-title">Patient Information</div>
      <div style="margin-bottom:1em"><label>Patient Name:</label><input type="text" name="patientName"></div>
      <div class="section-title">Acknowledgement</div>
      <p>I have received and understand this practice's Notice of Privacy Practices.</p>
      <div class="section-title">Consent for Treatment</div>
      <p>I voluntarily consent to care, including physician examination and tests.</p>
      <button type="submit" class="submit-btn">Submit</button>
    </form>
  </div>
</body>
</html>`;

/* =========================================================
   Clipboard helper
   ========================================================= */
async function copyToClipboard(text: string): Promise<"success"|"blocked"|"unavailable"> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
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
   Token -> HTML
   ========================================================= */
function signatureHTML(id: string) {
  return `<div class="sig-pad my-1"><canvas id="sig_${id}" class="w-full h-28 rounded-md border border-dashed border-gray-300 bg-white"></canvas><div class="flex justify-end gap-2 mt-2"><button type="button" class="sig-clear px-3 py-1.5 rounded border text-sm">Clear</button></div><input type="hidden" name="signature_${id}" /></div>`;
}
function signatureInlineHTML(id: string) {
  return `<span class="inline-block align-middle sig-pad mx-1"><canvas id="sig_${id}" class="w-36 h-10 rounded border border-dashed border-gray-300 bg-white"></canvas><input type="hidden" name="signature_${id}" /></span>`;
}
function orgLogoHTML(src?: string) {
  if (src) return `<div class="inline-flex items-center gap-2"><img src="${src}" alt="Org Logo" class="org-logo rounded-md" style="max-width:160px;max-height:48px;object-fit:contain;background:#fff;border:1px solid #e5e7eb;padding:4px;" /></div>`;
  return `<div class="inline-flex items-center gap-2"><div class="org-logo inline-flex items-center justify-center bg-gray-200 text-gray-600 rounded-md" style="width:120px;height:40px;">Org&nbsp;Logo</div></div>`;
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
    .replace(/\{OrgLogo:\s*"([^"]+)"\}/g, (_m, url) => orgLogoHTML(url))
    .replace(/\{OrgLogo:\s*'([^']+)'\}/g, (_m, url) => orgLogoHTML(url))
    .replace(/\{OrgLogo:\s*(https?:\/\/[^\s}]+)\s*\}/g, (_m, url) => orgLogoHTML(url))
    .replace(/\{OrgLogo\}/g, orgLogoHTML())
    .replace(/\{CurrentDate:"global"\}/g, `<input type="date" value="${todayStr}" ${baseInput} />`)
    .replace(/\{CurrentTime\}/g, `<input type="time" value="${timeStr}" ${baseInput} />`)
    .replace(/\{DOS\}/g, `<input type="date" value="${todayStr}" ${baseInput} />`)
    .replace(/\{PatientName\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{PatientDOB\}/g, `<input type="date" max="${todayStr}" ${baseInput} />`)
    .replace(/\{PatientSex\}/g, `<select ${baseInput}><option>Male</option><option>Female</option><option>Other</option></select>`)
    .replace(/\{PatientID\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{PatientPhone\}/g, `<input type="tel" ${baseInput} />`)
    .replace(/\{Address\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{City\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{State\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{Zip\}/g, `<input type="text" ${baseInput} />`)
    .replace(/\{ReferringDOC\}/g, `<input type="text" ${baseInput} />`);
  return html;
}

/* =========================================================
   Signature init & preview builder
   ========================================================= */
function signatureInit() {
  document.querySelectorAll('.sig-pad').forEach((wrapper: any) => {
    const canvas = wrapper.querySelector('canvas');
    if (!canvas) return;
    const hidden = wrapper.querySelector('input[type="hidden"]');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false, lastX = 0, lastY = 0;
    function size() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * ratio);
      canvas.height = Math.max(1, rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827';
    }
    size(); window.addEventListener('resize', size);
    const pos = (e: any) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
    canvas.addEventListener('mousedown', (e: any) => { drawing = true; const { x, y } = pos(e); lastX = x; lastY = y; });
    canvas.addEventListener('mousemove', (e: any) => { if (!drawing) return; e.preventDefault(); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke(); lastX = x; lastY = y; if (hidden) hidden.value = canvas.toDataURL('image/png'); });
    window.addEventListener('mouseup', () => { drawing = false; });
    canvas.addEventListener('touchstart', (e: any) => { drawing = true; const { x, y } = pos(e); lastX = x; lastY = y; }, { passive: false });
    canvas.addEventListener('touchmove', (e: any) => { if (!drawing) return; e.preventDefault(); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke(); lastX = x; lastY = y; if (hidden) hidden.value = canvas.toDataURL('image/png'); }, { passive: false });
    window.addEventListener('touchend', () => { drawing = false; });
    wrapper.querySelector('.sig-clear')?.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); if (hidden) hidden.value = ''; });
  });
}

function baseHTMLWrapper(title: string, contentInner: string, _options: TemplateOptions) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><script src="https://cdn.tailwindcss.com"><\/script><style>:root{--doc-border:#e5e7eb}*{box-sizing:border-box}body{margin:0;padding:2rem;font-family:Inter,system-ui,sans-serif;background:linear-gradient(to bottom,#f8fafc,#f1f5f9);color:#0f172a}.doc-card{max-width:48rem;margin:0 auto;background:#fff;border:1px solid var(--doc-border);border-radius:14px;padding:2rem;box-shadow:0 10px 30px rgba(2,6,23,.08)}.doc-input,.doc-check,select,textarea{font:inherit;background:#fff;border:1px solid var(--doc-border);border-radius:10px;padding:.55rem .75rem}.sig-pad canvas{width:100%;height:100%;touch-action:none;display:block}</style></head><body><article class="doc-prose"><div class="max-w-3xl mx-auto">${contentInner}</div></article><script>(${signatureInit.toString()})();<\/script></body></html>`;
}

function extractBodyOrAll(html: string) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

function buildPreviewHTML(title: string, templateText: string, options: TemplateOptions) {
  if (!templateText.trim()) return baseHTMLWrapper(title || "Template", "<p></p>", options);
  const replaced = replaceTokens(templateText);
  if (isFullHTMLDocument(replaced) && options.applyWrapperToFullHTML) {
    return baseHTMLWrapper(title || "Template", `<div class="doc-card">${extractBodyOrAll(replaced)}</div>`, options);
  }
  if (isFullHTMLDocument(replaced)) {
    const scriptTag = `<script>(${signatureInit.toString()})();<\/script>`;
    return /<\/body>/i.test(replaced) ? replaced.replace(/<\/body>/i, scriptTag + "</body>") : replaced + scriptTag;
  }
  if (isLikelyHTML(replaced)) return baseHTMLWrapper(title || "Template", `<div class="doc-card">${replaced}</div>`, options);
  const para = replaced.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
  return baseHTMLWrapper(title || "Template", `<div class="doc-card">${para}</div>`, options);
}

/* =========================================================
   Component
   ========================================================= */
export default function TemplateStudio() {
  const [title, setTitle] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [tplOptions, setTplOptions] = useState<TemplateOptions>({ theme: "slate", container: "normal", card: true, applyWrapperToFullHTML: false, context: "encounter" });
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [history, setHistory] = useState<Snap[]>([]);
  const [future, setFuture] = useState<Snap[]>([]);
  const lastPush = useRef(0);
  const pushHistory = () => { const now = Date.now(); if (now - lastPush.current < 250) return; lastPush.current = now; setHistory(h => [...h, { title, templateText, tplOptions, currentId }]); setFuture([]); };
  const undo = () => setHistory(h => { if (!h.length) return h; const prev = h[h.length-1]; setFuture(f => [{ title, templateText, tplOptions, currentId }, ...f]); setTitle(prev.title); setTemplateText(prev.templateText); setTplOptions(prev.tplOptions); setCurrentId(prev.currentId); return h.slice(0,-1); });
  const redo = () => setFuture(f => { if (!f.length) return f; const [next,...rest]=f; setHistory(h => [...h, { title, templateText, tplOptions, currentId }]); setTitle(next.title); setTemplateText(next.templateText); setTplOptions(next.tplOptions); setCurrentId(next.currentId); return rest; });

  const [myTemplates, setMyTemplates] = useState<SavedTemplate[]>([]);
  const [filter, setFilter] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{id:string,msg:string,type?:"success"|"error"|"info"}>>([]);
  const showToast = (msg: string, type?: "success"|"error"|"info") => { const id = uid(); setToasts(t => [...t, {id,msg,type}]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), type === "error" ? 5000 : 3000); };
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SavedTemplate | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const byCtx = myTemplates.filter(t => (t.options?.context || "encounter") === tplOptions.context);
    return q ? byCtx.filter(t => t.name.toLowerCase().includes(q)) : byCtx;
  }, [myTemplates, tplOptions.context, filter]);

  const previewHTML = useMemo(() => buildPreviewHTML(title, templateText, tplOptions), [title, templateText, tplOptions]);
  const counts = useMemo(() => { const t = templateText.trim(); return { words: t ? t.split(/\s+/).length : 0, chars: t.length }; }, [templateText]);

  // Draft persist
  useEffect(() => { try { const d = localStorage.getItem(LS_DRAFT); if (d) { const obj = JSON.parse(d); if (obj) { setTitle(obj.title||""); setTemplateText(obj.templateText||""); if (obj.tplOptions) setTplOptions(obj.tplOptions); } } } catch {} }, []);
  useEffect(() => { const id = setTimeout(() => { try { localStorage.setItem(LS_DRAFT, JSON.stringify({ title, templateText, tplOptions })); } catch {} }, 400); return () => clearTimeout(id); }, [title, templateText, tplOptions]);

  // Load from server
  useEffect(() => {
    (async () => {
      try {
        const rows = await apiListTemplates(toServerContext(tplOptions.context));
        setMyTemplates(rows.map(t => {
          const opts = typeof t.options === "string" ? JSON.parse(t.options as any) : (t.options || {});
          return { id: String(t.id), name: t.name, content: t.content, options: { theme: opts.theme ?? "slate", container: opts.container ?? "normal", card: opts.card ?? true, applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? false, context: fromServerContext(t.context) }, updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now() };
        }));
      } catch (e) { console.warn("Failed to load templates:", e); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplOptions.context]);

  async function performSave(name: string) {
    const body: UpsertBody = { name: name || title || "Untitled", context: toServerContext(tplOptions.context), content: templateText, options: { theme: tplOptions.theme, container: tplOptions.container, card: tplOptions.card, applyWrapperToFullHTML: tplOptions.applyWrapperToFullHTML } };
    try {
      const saved = currentId ? await apiUpdateTemplate(Number(currentId), body) : await apiCreateTemplate(body);
      const opts = typeof saved.options === "string" ? JSON.parse(saved.options as any) : (saved.options || {});
      setCurrentId(String(saved.id)); setTitle(saved.name); setTemplateText(saved.content);
      showToast(currentId ? "Template updated!" : "Template created!", "success");
      const rows = await apiListTemplates(saved.context);
      setMyTemplates(rows.map(t => { const o = typeof t.options === "string" ? JSON.parse(t.options as any) : (t.options || {}); return { id: String(t.id), name: t.name, content: t.content, options: { ...o, context: fromServerContext(t.context) }, updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now() }; }));
    } catch (e: any) { showToast(`Save failed: ${e.message}`, "error"); }
    setSaveOpen(false);
  }

  const saveTemplate = () => { if (!currentId) { setSaveName(title || "Untitled"); setSaveOpen(true); } else performSave(title || "Untitled"); };
  const newTemplate = () => { pushHistory(); setTitle(""); setTemplateText(""); setCurrentId(null); };

  const loadTemplate = async (t: SavedTemplate) => {
    try {
      const row = await apiGetTemplate(Number(t.id));
      const opts = typeof row.options === "string" ? JSON.parse(row.options as any) : (row.options || {});
      pushHistory(); setCurrentId(String(row.id)); setTitle(row.name); setTemplateText(row.content);
      setTplOptions(s => ({ ...s, context: fromServerContext(row.context), theme: opts.theme ?? s.theme, container: opts.container ?? s.container, card: opts.card ?? s.card, applyWrapperToFullHTML: opts.applyWrapperToFullHTML ?? s.applyWrapperToFullHTML }));
    } catch { showToast("Load failed", "error"); }
  };

  const performDelete = async () => {
    if (!pendingDelete) return; const t = pendingDelete; setPendingDelete(null);
    try { await apiDeleteTemplate(Number(t.id)); setMyTemplates(p => p.filter(x => x.id !== t.id)); if (t.id === currentId) { setCurrentId(null); setTitle(""); setTemplateText(""); } showToast("Deleted!", "success"); } catch { showToast("Delete failed", "error"); }
  };

  const loadDefault = (key: "HIPAA"|"HELP"|"INS"|"PRIV") => {
    const map = { HIPAA: { t: "HIPAA Declaration", c: TEMPLATE_HIPAA }, HELP: { t: "Help / Pending Forms", c: TEMPLATE_HELP }, INS: { t: "Insurance Information", c: TEMPLATE_INSURANCE }, PRIV: { t: "Privacy Practices", c: TEMPLATE_PRIVACY } } as const;
    const sel = map[key]; pushHistory(); setCurrentId(null); setTitle(sel.t); setTemplateText(sel.c);
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart ?? templateText.length;
    const end = ta.selectionEnd ?? templateText.length;
    pushHistory(); setTemplateText(templateText.slice(0, start) + text + templateText.slice(end));
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + text.length; }, 0);
  };

  const importFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = evt.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || "");
      try {
        const saved = await apiCreateTemplate({ name: f.name.replace(/\.[^.]+$/, ""), context: toServerContext(tplOptions.context), content: text, options: { theme: tplOptions.theme, container: tplOptions.container, card: tplOptions.card, applyWrapperToFullHTML: tplOptions.applyWrapperToFullHTML } });
        pushHistory(); setCurrentId(String(saved.id)); setTitle(saved.name); setTemplateText(saved.content);
        const rows = await apiListTemplates(toServerContext(tplOptions.context));
        setMyTemplates(rows.map(t => { const o = typeof t.options === "string" ? JSON.parse(t.options as any) : (t.options || {}); return { id: String(t.id), name: t.name, content: t.content, options: { ...o, context: fromServerContext(t.context) }, updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now() }; }));
        showToast("Imported!", "success");
      } catch { showToast("Import failed", "error"); }
      evt.target.value = "";
    };
    reader.readAsText(f);
  };

  const copyHTML = async () => { const r = await copyToClipboard(previewHTML); if (r === "success") showToast("Copied!", "success"); else showToast("Clipboard blocked", "error"); };
  const downloadHTML = () => { const blob = new Blob([previewHTML], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${(title || "template").replace(/[^\w-]+/g, "-")}.html`; a.click(); URL.revokeObjectURL(a.href); showToast("Downloaded!", "success"); };

  const [leftOpenTokens, setLeftOpenTokens] = useState(true);
  const [leftOpenDefaults, setLeftOpenDefaults] = useState(true);
  const [rightOpenMyTemplates, setRightOpenMyTemplates] = useState(true);
  const [rightOpenImport, setRightOpenImport] = useState(true);
  const [rightOpenUtils, setRightOpenUtils] = useState(true);

  const trimContent = () => { pushHistory(); setTemplateText(templateText.trim()); showToast("Trimmed", "info"); };
  const normalizeNewlines = () => { pushHistory(); setTemplateText(templateText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n")); showToast("Normalized", "info"); };
  const stripHTMLTags = () => { pushHistory(); setTemplateText(templateText.replace(/<\/?[^>]+>/g, "")); showToast("Stripped", "info"); };
  const minifyWhitespace = () => { pushHistory(); setTemplateText(templateText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ")); showToast("Minified", "info"); };

  return (
    <div className="min-h-screen relative text-gray-900">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-50 via-white to-blue-50" />

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/75 backdrop-blur-xl border-b shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <FileCode2 className="w-5 h-5" />
          <input value={title} onChange={e => { pushHistory(); setTitle(e.target.value); }} placeholder="Template title" className="text-base font-medium bg-transparent outline-none flex-1" />
          <div className="hidden md:flex items-center gap-1 rounded-xl border bg-white p-1 shadow-sm">
            {(["encounter","portal"] as TemplateContext[]).map(opt => (
              <button key={opt} className={`px-3 py-1.5 text-sm rounded-lg ${tplOptions.context===opt ? "bg-black text-white shadow" : "hover:bg-gray-50"}`} onClick={() => setTplOptions(s => ({ ...s, context: opt }))}>{opt.charAt(0).toUpperCase()+opt.slice(1)}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className={btn} onClick={undo} disabled={!history.length}><Undo2 className="w-4 h-4"/></button>
            <button className={btn} onClick={redo} disabled={!future.length}><Redo2 className="w-4 h-4"/></button>
            <button className={btn} onClick={newTemplate}><Plus className="w-4 h-4"/></button>
            <button className={btn} onClick={() => setPreviewOpen(true)}><Eye className="w-4 h-4"/></button>
            <button className={btn} onClick={copyHTML}><Copy className="w-4 h-4"/></button>
            <button className={btn} onClick={downloadHTML}><Download className="w-4 h-4"/></button>
            <button className={btn} onClick={saveTemplate}><Save className="w-4 h-4"/>Save</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3 space-y-3">
          <div className={cardCls}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold rounded-t-2xl" onClick={() => setLeftOpenTokens(v => !v)}>
              <span>Tokens</span><ChevronDown className={`w-4 h-4 transition ${leftOpenTokens ? "rotate-180" : ""}`} />
            </button>
            {leftOpenTokens && (
              <div className="p-3"><div className="flex flex-wrap gap-1.5">
                {["{TextInput}","{TextBox}","{CheckMark}","{ynRadioGroup}","{PatientSignature}","{AdminSignature}","{OrgLogo}",'{CurrentDate:"global"}',"{CurrentTime}","{DOS}","{PatientName}","{PatientDOB}","{PatientSex}","{PatientID}","{PatientPhone}","{Address}","{City}","{State}","{Zip}","{ReferringDOC}"].map(tok => (
                  <button key={tok} className={pillSm} onClick={() => insertAtCursor(tok)}>{tok}</button>
                ))}
              </div></div>
            )}
          </div>
          <div className={cardCls}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold" onClick={() => setLeftOpenDefaults(v => !v)}>
              <span>Default templates</span><ChevronDown className={`w-4 h-4 transition ${leftOpenDefaults ? "rotate-180" : ""}`} />
            </button>
            {leftOpenDefaults && (
              <div className="p-3 grid gap-2">
                <button className={btn} onClick={() => loadDefault("HIPAA")}>HIPAA Declaration</button>
                <button className={btn} onClick={() => loadDefault("HELP")}>Help / Pending Forms</button>
                <button className={btn} onClick={() => loadDefault("INS")}>Insurance Information</button>
                <button className={btn} onClick={() => loadDefault("PRIV")}>Privacy Practices</button>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER EDITOR */}
        <section className="col-span-12 md:col-span-6">
          <div className={`${cardCls} overflow-hidden`}>
            <div className="px-4 py-2 border-b bg-gray-50/70 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Template</h3>
            </div>
            <textarea ref={textareaRef} className="w-full min-h-[560px] outline-none border-0 p-4 font-mono text-sm bg-white" value={templateText} onChange={e => { pushHistory(); setTemplateText(e.target.value); }} placeholder="Type or paste your template..." spellCheck={false} />
            <div className="px-4 py-2 border-t bg-gray-50/70 text-xs text-gray-600 flex items-center justify-between">
              <span>{counts.words} words &middot; {counts.chars} chars</span>
              <span>{currentId ? `Editing saved (${tplOptions.context})` : `New (${tplOptions.context})`}</span>
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3 space-y-3">
          <div className={cardCls}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold" onClick={() => setRightOpenMyTemplates(v => !v)}>
              <span>My templates</span><ChevronDown className={`w-4 h-4 transition ${rightOpenMyTemplates ? "rotate-180" : ""}`} />
            </button>
            {rightOpenMyTemplates && (
              <div className="p-3 space-y-3">
                <div className="relative"><Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" /><input className={`${inputBase} pl-8`} placeholder={`Search ${tplOptions.context}...`} value={filter} onChange={e => setFilter(e.target.value)} /></div>
                <div className="grid gap-2 max-h-[32vh] overflow-auto">
                  {filteredTemplates.length === 0 && <p className="text-sm text-gray-500">No saved {tplOptions.context} templates yet.</p>}
                  {filteredTemplates.map(t => (
                    <div key={t.id} className="rounded-xl border p-2 bg-white/90 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-2">
                        <button className="text-left flex-1 hover:underline" onClick={() => loadTemplate(t)}><div className="text-sm font-medium">{t.name}</div><div className="text-[11px] text-gray-500">{new Date(t.updatedAt).toLocaleDateString()}</div></button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" onClick={() => setPendingDelete(t)}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className={cardCls}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold" onClick={() => setRightOpenImport(v => !v)}>
              <span>Import</span><ChevronDown className={`w-4 h-4 transition ${rightOpenImport ? "rotate-180" : ""}`} />
            </button>
            {rightOpenImport && (
              <div className="p-3"><label className={`${btn} cursor-pointer`}><Upload className="w-4 h-4"/> Import file<input hidden type="file" accept=".html,.htm,.txt,.json" onChange={importFile}/></label></div>
            )}
          </div>
          <div className={cardCls}>
            <button className="w-full flex items-center justify-between px-3 py-2 border-b bg-gray-50/70 text-sm font-semibold" onClick={() => setRightOpenUtils(v => !v)}>
              <span>Utils</span><ChevronDown className={`w-4 h-4 transition ${rightOpenUtils ? "rotate-180" : ""}`} />
            </button>
            {rightOpenUtils && (
              <div className="p-3 flex flex-wrap gap-2">
                <button className={btn} onClick={trimContent}>Trim</button>
                <button className={btn} onClick={normalizeNewlines}>Normalize</button>
                <button className={btn} onClick={minifyWhitespace}>Minify</button>
                <button className={btn} onClick={stripHTMLTags}>Strip tags</button>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-3 items-end">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
              className={`px-4 py-2 rounded-xl shadow-lg font-semibold text-sm ${t.type === "success" ? "bg-green-600 text-white" : t.type === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}>{t.msg}</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-[1100px] h-[86vh] bg-white rounded-2xl shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/70"><div className="flex items-center gap-2"><Eye className="w-4 h-4"/><span className="text-sm font-medium">Preview</span></div><button className={btn} onClick={() => setPreviewOpen(false)}><XIcon className="w-4 h-4"/>Close</button></div>
            <iframe title="Preview" className="w-full h-[calc(86vh-44px)] bg-white" sandbox="allow-forms allow-scripts allow-same-origin" srcDoc={previewHTML} />
          </div>
        </div>
      )}

      {/* Save dialog */}
      <AnimatePresence>
        {saveOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} className="w-[min(92vw,520px)] bg-white rounded-3xl border shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-blue-50"><h3 className="font-bold">Save template</h3></div>
              <div className="p-4"><input className={inputBase} autoFocus value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Template name..." /></div>
              <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button className={btn} onClick={() => setSaveOpen(false)}>Cancel</button>
                <button className={`${btn} !bg-blue-600 !text-white !border-blue-600`} onClick={() => { if (saveName.trim()) performSave(saveName.trim()); }}><Save className="w-4 h-4"/>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} className="w-[min(92vw,420px)] bg-white rounded-3xl border shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-red-50"><h3 className="font-bold text-red-800">Delete template</h3></div>
              <div className="p-4 text-sm">Delete &quot;{pendingDelete.name}&quot;? This cannot be undone.</div>
              <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button className={btn} onClick={() => setPendingDelete(null)}>Cancel</button>
                <button className={`${btn} !bg-red-600 !text-white !border-red-600`} onClick={performDelete}><Trash2 className="w-4 h-4"/>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
