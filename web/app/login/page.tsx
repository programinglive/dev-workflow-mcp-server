'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if already logged in
        const mightBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!mightBeLoggedIn) {
            setAuthChecking(false);
            return;
        }

        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) {
                    router.push('/history');
                }
            })
            .catch(() => { })
            .finally(() => setAuthChecking(false));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('isLoggedIn', 'true');
                window.dispatchEvent(new Event('authUpdate'));
                router.push('/history');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authChecking) {
        return null; // Or a loading spinner
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] px-4 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-white/5 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 relative mb-4">
                        <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-20 dark:opacity-40"></div>
                        <Image src="/assets/logo.png" alt="Logo" width={48} height={48} className="relative rounded-xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Sign in to access your workflow history
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-900/50">
                            <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <label htmlFor="username" className="sr-only">Username</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black/20 text-gray-900 dark:text-white sm:text-sm transition-all"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black/20 text-gray-900 dark:text-white sm:text-sm transition-all"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
