'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/app/(admin)/layout';
import {
    SECTIONS,
    STORAGE_KEY,
    type SectionKey,
    type EnabledMap,
    readEnabledMap,
    writeEnabledMap,
} from '@/lib/encounter-sections';

type DescMap = Record<SectionKey, string>;
const DESC_STORAGE_KEY = `${STORAGE_KEY}:descriptions`;

export default function FormAdminPage() {
    const [map, setMap] = useState<EnabledMap>({});
    const [descMap, setDescMap] = useState<DescMap>({} as DescMap);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [saveFeedback, setSaveFeedback] = useState(false);

    const [editingId, setEditingId] = useState<SectionKey | null>(null);
    const originalOnRef = useRef<boolean | null>(null);
    const originalDescRef = useRef<string | null>(null);

    useEffect(() => {
        setMap(readEnabledMap());
        // seed/load descriptions
        try {
            const raw = localStorage.getItem(DESC_STORAGE_KEY);
            if (raw) {
                setDescMap(JSON.parse(raw) as DescMap);
            } else {
                const seed = SECTIONS.reduce((acc, s) => {
                    const desc = (s as { desc?: unknown }).desc;
                    const hasDesc = typeof desc === 'string';
                    acc[s.id as SectionKey] = hasDesc ? (desc as string) : '';
                    return acc;
                }, {} as DescMap);
                setDescMap(seed);
            }
        } catch {
            const seed = SECTIONS.reduce((acc, s) => {
                const desc = (s as { desc?: unknown }).desc;
                const hasDesc = typeof desc === 'string';
                acc[s.id as SectionKey] = hasDesc ? (desc as string) : '';
                return acc;
            }, {} as DescMap);
            setDescMap(seed);
        }
    }, []);

    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key === STORAGE_KEY && e.newValue) {
                try { setMap(JSON.parse(e.newValue) as EnabledMap); } catch {}
            }
            if (e.key === DESC_STORAGE_KEY && e.newValue) {
                try { setDescMap(JSON.parse(e.newValue) as DescMap); } catch {}
            }
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const rows = useMemo(() => {
        const term = search.trim().toLowerCase();
        return SECTIONS.filter((s) => {
            const enabled = map[s.id] ?? true;
            const okStatus =
                status === 'all' || (status === 'enabled' && enabled) || (status === 'disabled' && !enabled);
            const baseDesc = descMap[s.id as SectionKey] ?? '';
            const matches =
                !term ||
                s.name.toLowerCase().includes(term) ||
                baseDesc.toLowerCase().includes(term);
            return matches && okStatus;
        });
    }, [search, status, map, descMap]);

    const enabledCount = useMemo(
        () => SECTIONS.reduce((n, s) => n + ((map[s.id] ?? true) ? 1 : 0), 0),
        [map]
    );

    const setEnabled = useCallback((id: SectionKey, on: boolean) => {
        setMap((prev) => {
            const next: EnabledMap = { ...prev, [id]: on };
            writeEnabledMap(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const setDesc = useCallback((id: SectionKey, text: string) => {
        setDescMap((prev) => ({ ...prev, [id]: text })); // persist on save
    }, []);

    const persistDescriptions = useCallback((next?: DescMap) => {
        try {
            localStorage.setItem(DESC_STORAGE_KEY, JSON.stringify(next ?? descMap));
        } catch {}
    }, [descMap]);

    const handleSaveClick = useCallback(() => {
        persistDescriptions();
        setSaveFeedback(true);
        setTimeout(() => setSaveFeedback(false), 1200);
    }, [persistDescriptions]);

    const startEdit = useCallback((id: SectionKey) => {
        if (editingId === id) return;
        originalOnRef.current = map[id] ?? true;
        originalDescRef.current = descMap[id] ?? '';
        setEditingId(id);
    }, [editingId, map, descMap]);

    const saveEdit = useCallback(() => {
        persistDescriptions();
        setEditingId(null);
        originalOnRef.current = null;
        originalDescRef.current = null;
    }, [persistDescriptions]);

    const cancelEdit = useCallback(() => {
        if (editingId) {
            const origOn = originalOnRef.current;
            if (typeof origOn === 'boolean') setEnabled(editingId, origOn);
            const origDesc = originalDescRef.current;
            if (typeof origDesc === 'string') {
                setDescMap((prev) => ({ ...prev, [editingId]: origDesc }));
            }
        }
        setEditingId(null);
        originalOnRef.current = null;
        originalDescRef.current = null;
    }, [editingId, setEnabled]);

    const isLocked = (id: SectionKey) => editingId !== id;

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
                <style jsx global>{`
          .themed-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
          .dark .themed-scrollbar { scrollbar-color: #334155 #0b1220; }
          .themed-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .themed-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
          .themed-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 9999px; }
          .themed-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
          .dark .themed-scrollbar::-webkit-scrollbar-track { background: #0b1220; }
          .dark .themed-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; }
          .dark .themed-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #475569; }
        `}</style>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Toolbar: Search + Save + Status */}
                    <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Search sections…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-sm ${
                                    saveFeedback ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                                onClick={handleSaveClick}
                                title="Save all changes"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{saveFeedback ? 'Saved!' : 'Save Changes'}</span>
                            </button>

                            <select
                                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'all' | 'enabled' | 'disabled')}
                                title="Filter by status"
                            >
                                <option value="all">All</option>
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mt-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 table-fixed">
                                <thead className="bg-gray-50 dark:bg-gray-800/80">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[40%]">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-36">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-40">Action</th>
                                </tr>
                                </thead>
                            </table>

                            {/* Scrollable body */}
                            <div className="max-h-[65vh] overflow-auto themed-scrollbar">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 table-fixed">
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {rows.map((s) => {
                                        const on = map[s.id] ?? true;
                                        const locked = isLocked(s.id);
                                        const descValue = descMap[s.id as SectionKey] ?? '';

                                        return (
                                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                                <td className="px-6 py-4 w-[40%] align-top">
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${on ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                        {s.name}
                                                    </div>
                                                </td>

                                                {/* Editable only when unlocked; tiny 10px, no scroll, no resize */}
                                                <td className="px-6 py-4 align-top">
                                                    <textarea
                                                        className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-1 py-0 text-[13px] leading-[30px] h-[30px] min-h-0 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                        value={descValue}
                                                        onChange={(e) => setDesc(s.id as SectionKey, e.target.value)}
                                                        placeholder="Type description…"
                                                        aria-label={`${s.name} description`}
                                                        disabled={locked}
                                                        tabIndex={locked ? -1 : 0}
                                                    />
                                                </td>

                                                <td className="px-6 py-4 w-36 align-top">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${
                                                        on ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                    }`}>
                                                        {on ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 w-40 align-top">
                                                    {locked ? (
                                                        <button
                                                            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                                                            onClick={() => startEdit(s.id as SectionKey)}
                                                            title="Edit section"
                                                        >
                                                            {/* Pencil icon */}
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.651 1.651m-2.475-1.177l-8.4 8.4a2.5 2.5 0 00-.657 1.2l-.393 1.964a.5.5 0 00.588.588l1.964-.393a2.5 2.5 0 001.2-.657l8.4-8.4m-2.302-2.302a1.875 1.875 0 112.652 2.652" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <label className="flex items-center cursor-pointer select-none">
                                                                <div className="relative">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only"
                                                                        checked={on}
                                                                        onChange={(e) => setEnabled(s.id as SectionKey, e.target.checked)}
                                                                    />
                                                                    <div className={`block w-14 h-8 rounded-full ${on ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${on ? 'translate-x-6' : ''}`} />
                                                                </div>
                                                            </label>
                                                            <button
                                                                className="p-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                                                                onClick={saveEdit}
                                                                title="Save row"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                                                                onClick={cancelEdit}
                                                                title="Cancel"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {rows.length === 0 && (
                                        <tr>
                                            <td className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                                                No sections match your filters.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tip: Click <em>Edit</em> to modify the description or toggle. Use row <em>Save</em>/<em>Cancel</em> or the top <em>Save Changes</em>.</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 md:mt-0">
                                {rows.length} shown • {enabledCount} enabled total
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
