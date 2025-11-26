"use client";

import { useState, useEffect } from "react";

type HistoryItem = {
    task_description: string;
    created_at: string;
};

type SummaryData = {
    summary: {
        totalTasks: number;
    };
};

export default function History() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        userId: "",
        startDate: "",
        endDate: ""
    });

    const loadData = async () => {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: "20",
            ...(filters.userId && { user: filters.userId }),
            ...(filters.startDate && { startDate: filters.startDate }),
            ...(filters.endDate && { endDate: filters.endDate }),
        });

        try {
            const res = await fetch(`/api/history?${params}`);
            const data = await res.json();
            setHistory(data.data || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Failed to load history", err);
        }

        try {
            const res = await fetch(`/api/summary?${params}`);
            const data = await res.json();
            setSummary(data);
        } catch (err) {
            console.error("Failed to load summary", err);
        }
    };

    useEffect(() => {
        loadData();
    }, [page]); // Reload when page changes

    const handleApplyFilters = () => {
        setPage(1);
        loadData();
    };

    return (
        <section id="history" className="py-20 px-4 bg-white/5">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-8">Workflow History</h2>
                <p className="text-gray-400 mb-12">Track your development progress and analyze your workflow patterns.</p>
                <div className="bg-[#0a0a0f] rounded-xl border border-white/10 p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                        <input
                            type="text"
                            placeholder="User ID"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        />
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                        />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                        />
                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {summary && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                            <div className="text-gray-400">
                                <p>Total tasks: {summary.summary?.totalTasks || 0}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Recent History</h3>
                        <div className="space-y-3">
                            {history.length > 0 ? (
                                history.map((row, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                                        <div className="font-semibold">{row.task_description}</div>
                                        <div className="text-sm text-gray-400 mt-1">{new Date(row.created_at).toLocaleString()}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No history yet.</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
