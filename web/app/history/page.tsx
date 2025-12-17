'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    useEffect(() => {
        // Check authentication status
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) {
                    setIsAuthenticated(true);
                    // Fetch history
                    return fetch('/api/workflow/history');
                } else {
                    router.push('/login');
                    throw new Error('Not authenticated');
                }
            })
            .then(res => res?.json())
            .then(data => {
                if (data?.history) {
                    setHistory(data.history);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="text-gray-900 dark:text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen pt-20 px-4 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Workflow History</h1>

                {history.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No workflow history yet. Start using the MCP server to see your workflow history here!</p>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div key={item.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.task_type === 'feature' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                                    item.task_type === 'bugfix' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                                        'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                }`}>
                                                {item.task_type}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.tests_passed ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                }`}>
                                                {item.tests_passed ? '✓ Tests Passed' : '⚠ Tests Skipped'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.description}</h3>
                                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                                            <strong>Commit:</strong> {item.commit_message}
                                        </p>
                                        {item.documentation_type && (
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                <strong>Docs:</strong> {item.documentation_type}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(item.completed_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
