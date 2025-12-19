"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

type HistoryItem = {
    id: number;
    task_type: string;
    description: string;
    commit_message: string;
    completed_at: string;
    tests_passed: boolean;
    documentation_type: string;
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
        try {
            // Fetch workflow history from API via apiClient
            const data = await apiClient.getHistory();

            if (data?.history) {
                setHistory(data.history || []);
                setTotalPages(Math.ceil((data.history?.length || 0) / 10));
                setSummary({
                    summary: {
                        totalTasks: data.history?.length || 0,
                    },
                });
            } else {
                // Not authenticated or error - show empty state
                setHistory([]);
                setTotalPages(1);
                setSummary({
                    summary: {
                        totalTasks: 0,
                    },
                });
            }
        } catch (error) {
            // Silently handle errors - show empty state
            setHistory([]);
            setTotalPages(1);
            setSummary({
                summary: {
                    totalTasks: 0,
                },
            });
        }
    };

    useEffect(() => {
        // Only load if we're likely authenticated (reduces 401 errors)
        // History component should only be on authenticated pages anyway
        if (typeof window !== 'undefined' && window.location.pathname === '/history') {
            loadData();
        }
    }, [page]); // Reload when page changes

    const handleApplyFilters = () => {
        setPage(1);
        loadData();
    };

    return (
        <section id="history" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 bg-gray-50 dark:bg-white/5 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 text-gray-900 dark:text-white">Workflow History</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8 sm:mb-12">Track your development progress and analyze your workflow patterns.</p>
                <div className="bg-white dark:bg-[#0a0a0f] rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6 transition-colors duration-300">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                        <input
                            type="text"
                            placeholder="User ID"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                        />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                        />
                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition text-white"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {summary && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Project Summary</h3>
                            <div className="text-gray-600 dark:text-gray-400">
                                <p>Total tasks: {summary.summary?.totalTasks || 0}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent History</h3>
                        <div className="space-y-3">
                            {history.length > 0 ? (
                                history.map((row) => (
                                    <div key={row.id} className="p-4 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${row.task_type === 'feature' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                                row.task_type === 'bugfix' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                                    'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                }`}>
                                                {row.task_type}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${row.tests_passed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                }`}>
                                                {row.tests_passed ? '✓ Tests' : '⚠ Skipped'}
                                            </span>
                                        </div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{row.description}</div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{row.commit_message}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{new Date(row.completed_at).toLocaleString()}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50 text-gray-900 dark:text-white transition"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50 text-gray-900 dark:text-white transition"
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
