"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  FileCode2, Eye, X as XIcon, Save, Undo2, Redo2, Trash2, Search, Plus,
  ChevronDown, Upload, Download, Copy, Bold, Italic, Underline as UnderlineIcon,
  Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Table as TableIcon, ImageIcon, Link as LinkIcon,
  Code, Quote, Minus, HighlighterIcon, Palette, Type, Pilcrow,
} from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

/* =========================================================
   API helpers
   ========================================================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API = `${API_BASE}/api/template-documents`;

const toServerContext = (c: "encounter" | "portal") => c === "encounter" ? "ENCOUNTER" : "PORTAL";
const fromServerContext = (c: string) => c === "ENCOUNTER" ? "encounter" : "portal";

type UpsertBody = { name: string; context: string; content: string; options: Record<string, any>; };
type ServerTemplate = { id: number; name: string; context: string; content: string; options: Record<string, any>; createdAt?: string; updatedAt?: string; };

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
  const res = await fetchWithAuth(`${API}/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiListTemplates(context?: string): Promise<ServerTemplate[]> {
  const url = context ? `${API}?context=${context}` : API;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiDeleteTemplate(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

/* =========================================================
   Types
   ========================================================= */
type TemplateContext = "encounter" | "portal";
interface SavedTemplate { id: string; name: string; content: string; context: TemplateContext; updatedAt: number; }

const uid = () => Math.random().toString(36).slice(2);

const btnCls = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 active:scale-[.97] transition text-sm font-medium shadow-sm";
const btnActive = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 active:scale-[.97] transition text-sm font-medium shadow-sm";
const cardCls = "bg-white rounded-2xl border border-gray-200 shadow-sm";
const inputBase = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";

/* =========================================================
   Toolbar Button
   ========================================================= */
function TBtn({ active, onClick, title, children, disabled }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition ${disabled ? "opacity-30 cursor-not-allowed" : active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-600"}`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   Component
   ========================================================= */
export default function TemplateStudio() {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState<TemplateContext>("encounter");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [myTemplates, setMyTemplates] = useState<SavedTemplate[]>([]);
  const [filter, setFilter] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [sourceHTML, setSourceHTML] = useState("");

  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: string; msg: string; type?: "success" | "error" | "info" }>>([]);
  const showToast = (msg: string, type?: "success" | "error" | "info") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), type === "error" ? 5000 : 2500);
  };

  // Modals
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SavedTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start typing your template..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: true }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[480px] px-6 py-4",
      },
    },
  });

  const getHTML = useCallback(() => editor?.getHTML() || "", [editor]);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredTemplates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const byCtx = myTemplates.filter(t => t.context === context);
    return q ? byCtx.filter(t => t.name.toLowerCase().includes(q)) : byCtx;
  }, [myTemplates, context, filter]);

  // Load templates from server
  const refreshList = useCallback(async (ctx?: string) => {
    try {
      const rows = await apiListTemplates(toServerContext((ctx || context) as TemplateContext));
      setMyTemplates(rows.map(t => ({
        id: String(t.id), name: t.name, content: t.content,
        context: fromServerContext(t.context) as TemplateContext,
        updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
      })));
    } catch (e) { console.warn("Failed to load:", e); }
  }, [context]);

  useEffect(() => { refreshList(); }, [context, refreshList]);

  // Save
  async function performSave(name: string) {
    const content = getHTML();
    const body: UpsertBody = { name, context: toServerContext(context), content, options: {} };
    try {
      const saved = currentId ? await apiUpdateTemplate(Number(currentId), body) : await apiCreateTemplate(body);
      setCurrentId(String(saved.id));
      setTitle(saved.name);
      showToast(currentId ? "Updated!" : "Created!", "success");
      refreshList();
    } catch (e: any) { showToast(`Save failed: ${e.message}`, "error"); }
    setSaveOpen(false);
  }

  const saveTemplate = () => {
    if (!currentId) { setSaveName(title || "Untitled"); setSaveOpen(true); }
    else performSave(title || "Untitled");
  };

  const newTemplate = () => { setCurrentId(null); setTitle(""); editor?.commands.setContent(""); };

  const loadTemplate = async (t: SavedTemplate) => {
    try {
      const row = await apiGetTemplate(Number(t.id));
      setCurrentId(String(row.id));
      setTitle(row.name);
      editor?.commands.setContent(row.content || "");
    } catch { showToast("Load failed", "error"); }
  };

  const performDelete = async () => {
    if (!pendingDelete) return;
    const t = pendingDelete;
    setPendingDelete(null);
    try {
      await apiDeleteTemplate(Number(t.id));
      setMyTemplates(p => p.filter(x => x.id !== t.id));
      if (t.id === currentId) { setCurrentId(null); setTitle(""); editor?.commands.setContent(""); }
      showToast("Deleted!", "success");
    } catch { showToast("Delete failed", "error"); }
  };

  const importFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = evt.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || "");
      try {
        const saved = await apiCreateTemplate({ name: f.name.replace(/\.[^.]+$/, ""), context: toServerContext(context), content: text, options: {} });
        setCurrentId(String(saved.id)); setTitle(saved.name); editor?.commands.setContent(saved.content);
        refreshList();
        showToast("Imported!", "success");
      } catch { showToast("Import failed", "error"); }
      evt.target.value = "";
    };
    reader.readAsText(f);
  };

  const downloadHTML = () => {
    const html = getHTML();
    const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || "Template"}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2em auto;padding:0 1em;color:#222}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px}h1,h2,h3{color:#2d5c9f}</style></head><body>${html}</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || "template").replace(/[^\w-]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Downloaded!", "success");
  };

  const copyHTML = async () => {
    try { await navigator.clipboard.writeText(getHTML()); showToast("Copied!", "success"); }
    catch { showToast("Copy failed", "error"); }
  };

  // Source view toggle
  const toggleSource = () => {
    if (showSource) {
      editor?.commands.setContent(sourceHTML);
      setShowSource(false);
    } else {
      setSourceHTML(getHTML());
      setShowSource(true);
    }
  };

  // Toolbar actions
  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = prompt("Enter image URL:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };
  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Preview HTML
  const previewHTML = useMemo(() => {
    const content = getHTML();
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:2em auto;padding:0 1.5em;color:#1a1a1a;line-height:1.6}h1{color:#2d5c9f;border-bottom:2px solid #e5e7eb;padding-bottom:.3em}h2{color:#2d5c9f}h3{color:#374151}table{border-collapse:collapse;width:100%;margin:1em 0}td,th{border:1px solid #d1d5db;padding:8px 12px;text-align:left}th{background:#f3f4f6;font-weight:600}blockquote{border-left:4px solid #2d5c9f;margin:1em 0;padding:.5em 1em;background:#f8fafc}code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:.9em}pre{background:#1e293b;color:#e2e8f0;padding:1em;border-radius:8px;overflow-x:auto}img{max-width:100%;border-radius:8px}hr{border:none;border-top:2px solid #e5e7eb;margin:2em 0}a{color:#2563eb}mark{background:#fef08a;padding:2px 4px;border-radius:2px}</style></head><body>${content}</body></html>`;
  }, [getHTML, editor?.state.doc.content.size]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileCode2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Template Documents</h1>
              <p className="text-[10px] text-gray-500">Rich text template editor</p>
            </div>
          </div>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Template title..."
            className="flex-1 max-w-xs text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />

          {/* Context toggle */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(["encounter", "portal"] as TemplateContext[]).map(c => (
              <button key={c} onClick={() => setContext(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${context === c ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >{c === "encounter" ? "Encounter" : "Portal"}</button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button className={btnCls} onClick={newTemplate} title="New"><Plus className="w-4 h-4" /></button>
            <button className={btnCls} onClick={() => setPreviewOpen(true)} title="Preview"><Eye className="w-4 h-4" /></button>
            <button className={btnCls} onClick={copyHTML} title="Copy HTML"><Copy className="w-4 h-4" /></button>
            <button className={btnCls} onClick={downloadHTML} title="Download"><Download className="w-4 h-4" /></button>
            <label className={`${btnCls} cursor-pointer`} title="Import"><Upload className="w-4 h-4" /><input hidden type="file" accept=".html,.htm,.txt" onChange={importFile} /></label>
            <button className={`${btnCls} !bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700`} onClick={saveTemplate}><Save className="w-4 h-4" />Save</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-64" : "w-0"} shrink-0 border-r bg-white overflow-hidden transition-all duration-200`}>
          <div className="w-64 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Templates</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100"><XIcon className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input className={`${inputBase} pl-8 py-1.5 text-xs`} placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredTemplates.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No templates yet</p>}
              {filteredTemplates.map(t => (
                <div key={t.id} onClick={() => loadTemplate(t)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition group ${currentId === t.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setPendingDelete(t); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Editor */}
        <main className="flex-1 min-w-0">
          {/* Formatting Toolbar */}
          <div className="sticky top-[53px] z-[5] bg-white border-b px-4 py-1.5 flex items-center gap-0.5 flex-wrap">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 mr-2" title="Show sidebar">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            )}

            {/* Text formatting */}
            <TBtn active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold"><Bold className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic"><Italic className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("highlight")} onClick={() => editor?.chain().focus().toggleHighlight().run()} title="Highlight"><HighlighterIcon className="w-4 h-4" /></TBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Headings */}
            <TBtn active={editor?.isActive("heading", { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => editor?.chain().focus().setParagraph().run()} active={editor?.isActive("paragraph")} title="Paragraph"><Pilcrow className="w-4 h-4" /></TBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Lists */}
            <TBtn active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered List"><ListOrdered className="w-4 h-4" /></TBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Alignment */}
            <TBtn active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()} title="Align Left"><AlignLeft className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()} title="Align Center"><AlignCenter className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()} title="Align Right"><AlignRight className="w-4 h-4" /></TBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Insert */}
            <TBtn onClick={addLink} active={editor?.isActive("link")} title="Link"><LinkIcon className="w-4 h-4" /></TBtn>
            <TBtn onClick={addImage} title="Image"><ImageIcon className="w-4 h-4" /></TBtn>
            <TBtn onClick={addTable} title="Insert Table"><TableIcon className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus className="w-4 h-4" /></TBtn>
            <TBtn active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Code Block"><Code className="w-4 h-4" /></TBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Undo/Redo */}
            <TBtn onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo"><Undo2 className="w-4 h-4" /></TBtn>
            <TBtn onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo"><Redo2 className="w-4 h-4" /></TBtn>

            <div className="flex-1" />

            {/* Source toggle */}
            <button onClick={toggleSource} className={`text-xs px-2 py-1 rounded-md border ${showSource ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
              {showSource ? "Visual" : "HTML Source"}
            </button>
          </div>

          {/* Editor Content */}
          <div className="bg-white min-h-[500px]">
            {showSource ? (
              <textarea
                value={sourceHTML}
                onChange={e => setSourceHTML(e.target.value)}
                className="w-full min-h-[500px] p-4 font-mono text-sm border-0 outline-none resize-y bg-gray-50"
                spellCheck={false}
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>

          {/* Status bar */}
          <div className="border-t bg-gray-50 px-4 py-1.5 text-xs text-gray-500 flex items-center justify-between">
            <span>{currentId ? `Editing: ${title || "Untitled"}` : "New template"}</span>
            <span>{context === "encounter" ? "Encounter" : "Portal"} template</span>
          </div>
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
              className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${t.type === "success" ? "bg-green-600 text-white" : t.type === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}>{t.msg}</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
              <span className="text-sm font-semibold">Preview: {title || "Untitled"}</span>
              <button onClick={() => setPreviewOpen(false)} className={btnCls}><XIcon className="w-4 h-4" />Close</button>
            </div>
            <iframe title="Preview" className="w-full h-[calc(85vh-48px)]" sandbox="allow-scripts allow-same-origin" srcDoc={previewHTML} />
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <AnimatePresence>
        {saveOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b bg-blue-50"><h3 className="font-bold text-blue-900">Save template</h3></div>
              <div className="p-5"><input className={inputBase} autoFocus value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Template name..." /></div>
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button className={btnCls} onClick={() => setSaveOpen(false)}>Cancel</button>
                <button className={`${btnCls} !bg-blue-600 !text-white !border-blue-600`} onClick={() => { if (saveName.trim()) performSave(saveName.trim()); }}><Save className="w-4 h-4" />Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b bg-red-50"><h3 className="font-bold text-red-800">Delete template</h3></div>
              <div className="p-5 text-sm">Delete &quot;{pendingDelete.name}&quot;? This cannot be undone.</div>
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button className={btnCls} onClick={() => setPendingDelete(null)}>Cancel</button>
                <button className={`${btnCls} !bg-red-600 !text-white !border-red-600`} onClick={performDelete}><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
