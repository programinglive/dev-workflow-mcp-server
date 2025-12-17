"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Github, Menu, X, Moon, Sun, LogOut } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        // Get theme from localStorage or system preference
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
        setTheme(initialTheme);

        // Apply the class immediately
        document.documentElement.classList.toggle("dark", initialTheme === "dark");

        // Check authentication status
        const checkAuth = () => {
            // Check authentication status ONLY if we think we're logged in OR if we just received an update event
            // This prevents 401 errors from cluttering the console for guests
            const mightBeLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

            if (mightBeLoggedIn) {
                fetch('/api/auth/me')
                    .then(res => {
                        if (res.ok) {
                            return res.json();
                        }
                        throw new Error('Not authenticated');
                    })
                    .then(data => {
                        setIsAuthenticated(true);
                        setUsername(data.user?.username || 'User');
                        // Ensure local storage is in sync
                        localStorage.setItem('isLoggedIn', 'true');
                    })
                    .catch(() => {
                        // Session invalid/expired
                        localStorage.removeItem('isLoggedIn');
                        setIsAuthenticated(false);
                        setUsername(null);
                    });
            } else {
                setIsAuthenticated(false);
                setUsername(null);
            }
        };

        // Initial check
        checkAuth();

        // Listen for auth updates (login/logout/validated session)
        window.addEventListener('authUpdate', checkAuth);

        return () => {
            window.removeEventListener('authUpdate', checkAuth);
        };
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('isLoggedIn');
            setIsAuthenticated(false);
            setUsername(null);
            window.dispatchEvent(new Event('authUpdate'));
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/assets/logo.png" alt="Dev Workflow" width={28} height={28} className="rounded-lg w-7 h-7 sm:w-8 sm:h-8" />
                        <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Dev Workflow</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-3 lg:gap-6">
                        <Link href="/#features" className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Features</Link>
                        <Link href="/history" className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">History</Link>
                        <Link href="/#api" className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">API</Link>
                        <Link href="/docs" className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Docs</Link>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition text-gray-900 dark:text-white"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                        </button>
                        <a
                            href="https://github.com/programinglive/dev-workflow-mcp-server"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition text-xs lg:text-sm text-gray-900 dark:text-white"
                        >
                            <Github className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            GitHub
                        </a>
                        {isAuthenticated && (
                            <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-white/10">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {username}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition text-xs lg:text-sm text-red-700 dark:text-red-300"
                                >
                                    <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                        {!isAuthenticated && (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition text-gray-900 dark:text-white"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-900 dark:text-white"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0f] transition-colors duration-300">
                    <div className="px-4 py-4 space-y-3">
                        {isAuthenticated && (
                            <div className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 mb-2">
                                Signed in as {username}
                            </div>
                        )}
                        <Link href="/#features" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition" onClick={() => setIsOpen(false)}>Features</Link>
                        <Link href="/history" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition" onClick={() => setIsOpen(false)}>History</Link>
                        <Link href="/#api" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition" onClick={() => setIsOpen(false)}>API</Link>
                        <Link href="/docs" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition" onClick={() => setIsOpen(false)}>Docs</Link>
                        <a
                            href="https://github.com/programinglive/dev-workflow-mcp-server"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                        {isAuthenticated ? (
                            <button
                                onClick={() => { setIsOpen(false); handleLogout(); }}
                                className="w-full text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
