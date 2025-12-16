"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Terminal from "./Terminal";
import { useEffect, useState } from "react";

export default function Hero() {
    const [downloads, setDownloads] = useState<number | null>(null);
    const [version, setVersion] = useState<string | null>(null);

    useEffect(() => {
        // Fetch npm downloads directly from npm API
        fetch("https://api.npmjs.org/downloads/point/last-month/@programinglive/dev-workflow-mcp-server")
            .then(res => res.json())
            .then(data => setDownloads(data.downloads || 0))
            .catch(() => setDownloads(null));

        // Version is hardcoded for static export
        setVersion("1.7.11");
    }, []);

    const formatDownloads = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <section className="min-h-screen flex items-center justify-center px-3 sm:px-4 pt-16 relative overflow-hidden bg-white dark:bg-transparent transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 dark:from-indigo-500/10 via-purple-500/5 dark:via-purple-500/10 to-pink-500/5 dark:to-pink-500/10"></div>
            <div className="max-w-7xl mx-auto grid xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center relative z-10">
                {/* Left Column - Content */}
                <div>
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>v{version ?? "..."} - Active</span>
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        Master Your<br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Workflow</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                        An MCP server that acts as your coding conscience. Enforce test-driven development, ensure documentation, and never skip a step in your release process.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        <Link href="#history" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition inline-flex items-center justify-center gap-2 text-white">
                            View History <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/docs" className="px-6 py-3 bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-white/10 transition text-center text-gray-900 dark:text-white">
                            Documentation
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{version ?? "..."}</div>
                            <div className="text-gray-600 dark:text-gray-500">Latest Version</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">MIT</div>
                            <div className="text-gray-600 dark:text-gray-500">License</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Node 18+</div>
                            <div className="text-gray-600 dark:text-gray-500">Compatibility</div>
                        </div>
                        {downloads !== null && (
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatDownloads(downloads)}</div>
                                <div className="text-gray-600 dark:text-gray-500">Downloads/mo</div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Right Column - Terminal */}
                <div className="hidden xl:block">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl"></div>
                        <div className="relative bg-[#1a1a24] rounded-xl border border-white/10 p-4 sm:p-6 shadow-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="ml-auto text-xs text-gray-500">terminal</span>
                            </div>
                            <Terminal />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
