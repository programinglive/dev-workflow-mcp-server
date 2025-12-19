'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    GitCommit,
    FileText,
    Activity,
    Search,
    Filter,
    Calendar,
    BarChart3
} from 'lucide-react';

interface WorkflowHistoryItem {
    id: number;
    task_type: string;
    description: string;
    commit_message: string;
    completed_at: string;
    tests_passed: boolean;
    documentation_type: string;
}

export default function HistoryPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            try {
                // Verify auth
                const user = await apiClient.getCurrentUser();
                if (!user) {
                    throw new Error('Not authenticated');
                }

                setIsAuthenticated(true);
                // Sync auth state
                localStorage.setItem('isLoggedIn', 'true');
                window.dispatchEvent(new Event('authUpdate'));

                // Fetch history
                const result = await apiClient.getHistory();
                if (result?.history) {
                    setHistory(result.history);
                }
            } catch (error) {
                console.error('History load error:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    const stats = useMemo(() => {
        const total = history.length;
        const features = history.filter(h => h.task_type === 'feature').length;
        const bugs = history.filter(h => h.task_type === 'bugfix').length;
        const passedTests = history.filter(h => h.tests_passed).length;
        const successRate = total > 0 ? Math.round((passedTests / total) * 100) : 0;

        return { total, features, bugs, successRate };
    }, [history]);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.commit_message.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || item.task_type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [history, searchQuery, typeFilter]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#0a0a0f] transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Workflow Insights</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track and analyze your development velocity and quality.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<Activity className="w-5 h-5 text-indigo-500" />} label="Total Tasks" value={stats.total} />
                    <StatCard icon={<CheckCircle className="w-5 h-5 text-green-500" />} label="Success Rate" value={`${stats.successRate}%`} />
                    <StatCard icon={<BarChart3 className="w-5 h-5 text-blue-500" />} label="Features Built" value={stats.features} />
                    <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-500" />} label="Bugs Fixed" value={stats.bugs} />
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks, commits..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            <option value="feature">Features</option>
                            <option value="bugfix">Bug Fixes</option>
                            <option value="refactor">Refactors</option>
                        </select>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:dark:via-white/20 before:to-transparent">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No workflow history found.</p>
                        </div>
                    ) : (
                        filteredHistory.map((item, index) => (
                            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-[#0a0a0f] bg-gray-100 dark:bg-white/10 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    {getTaskIcon(item.task_type)}
                                </div>

                                {/* Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${getTypeColor(item.task_type)}`}>
                                            {item.task_type}
                                        </span>
                                        <time className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            {new Date(item.completed_at).toLocaleDateString()}
                                        </time>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.description}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-black/20 p-2 rounded-lg break-all font-mono">
                                        <GitCommit className="w-4 h-4 shrink-0" />
                                        {item.commit_message}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${item.tests_passed ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                            {item.tests_passed ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                            {item.tests_passed ? 'Tests Passed' : 'Tests Skipped'}
                                        </div>
                                        {item.documentation_type && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                                                <FileText className="w-3.5 h-3.5" />
                                                {item.documentation_type}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
        <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}

function getTaskIcon(type: string) {
    switch (type) {
        case 'feature': return <CheckCircle className="w-5 h-5 text-blue-500" />;
        case 'bugfix': return <XCircle className="w-5 h-5 text-red-500" />;
        default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
}

function getTypeColor(type: string) {
    switch (type) {
        case 'feature': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'bugfix': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
}
