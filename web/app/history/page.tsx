'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check authentication status
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    router.push('/login');
                }
            })
            .catch(() => {
                router.push('/login');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Workflow History</h1>
                <p className="text-gray-400">Your workflow history will appear here.</p>
                {/* Add your history component here */}
            </div>
        </div>
    );
}
