"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/(admin)/layout";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type WeeklyRecord = {
    day?: string;
    label?: string;
    stock?: number;
    value?: number;
};

type MonthlyRecord = {
    month?: string;
    label?: string;
    count?: number;
    value?: number;
};


/** UI */
function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            {title && (
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</h3>
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
}

function SimpleBarChart<T extends Record<string, unknown>>({
                                                               data,
                                                               valueKey,
                                                               labelKey,
                                                           }: {
    data: T[];
    valueKey: keyof T & string;
    labelKey: keyof T & string;
}) {
    const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

    return (
        <div className="space-y-3">
            {data.map((d, i) => {
                const v = Number(d[valueKey]) || 0;
                const pct = Math.round((v / max) * 100);
                return (
                    <div key={i}>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{String(d[labelKey])}</span>
                            <span className="tabular-nums">{v}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Component */
export default function Records() {
    const [weekly, setWeekly] = useState<{ label: string; value: number }[]>([]);
    const [monthly, setMonthly] = useState<{ label: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ Safe JSON helper
    async function safeJson(res: Response) {
        const text = await res.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (err) {
            console.error("Invalid JSON:", err);
            return null;
        }
    }

    useEffect(() => {
        (async () => {
            try {
                const [weeklyRes, monthlyRes] = await Promise.all([
                    fetchWithAuth(`${API_URL}/api/inventory/records/weekly-consumption`),
                    fetchWithAuth(`${API_URL}/api/inventory/records/monthly-orders`),
                ]);

                const weeklyJson = await safeJson(weeklyRes);
                const monthlyJson = await safeJson(monthlyRes);

                setWeekly(
                    (weeklyJson?.data as WeeklyRecord[] || []).map((d) => ({
                        label: d.day || d.label || "N/A",
                        value: d.stock || d.value || 0,
                    }))
                );

                setMonthly(
                    (monthlyJson?.data as MonthlyRecord[] || []).map((d) => ({
                        label: d.month || d.label || "N/A",
                        value: d.count || d.value || 0,
                    }))
                );
            } catch (e) {
                console.error("Error loading records", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AdminLayout>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100"></div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Maintain records of past stock movements and audit history.
            </p>

            {loading ? (
                <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-4">
                    <Panel title="Weekly Stock Consumption">
                        <SimpleBarChart data={weekly} valueKey="value" labelKey="label" />
                    </Panel>
                    <Panel title="Monthly Orders (count)">
                        <SimpleBarChart data={monthly} valueKey="value" labelKey="label" />
                    </Panel>
                </div>
            )}
        </AdminLayout>
    );
}
