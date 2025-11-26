"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Terminal from "./Terminal";
import { useEffect, useState } from "react";

export default function Hero() {
    const [downloads, setDownloads] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/npm-downloads")
            .then(res => res.json())
            .then(data => setDownloads(data.downloads))
            .catch(() => setDownloads(null));
    }, []);

    const formatDownloads = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <section className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Column - Content */}
                <div>
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>v1.3.12 - Active</span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        Master Your<br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Workflow</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                        An MCP server that acts as your coding conscience. Enforce test-driven development, ensure documentation, and never skip a step in your release process.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        <Link href="#history" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition inline-flex items-center justify-center gap-2">
                            View History <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/docs" className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition text-center">
                            Documentation
                        </Link>
                    </div>
                    <div className="flex items-center gap-8 text-sm animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                        <div>
                            <div className="text-2xl font-bold">1.3.12</div>
                            <div className="text-gray-500">Latest Version</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">MIT</div>
                            <div className="text-gray-500">License</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">Node 18+</div>
                            <div className="text-gray-500">Compatibility</div>
                        </div>
                        {downloads !== null && (
                            <div>
                                <div className="text-2xl font-bold">{formatDownloads(downloads)}</div>
                                <div className="text-gray-500">Downloads/mo</div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Right Column - Terminal */}
                <div className="hidden lg:block">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl"></div>
                        <div className="relative bg-[#1a1a24] rounded-xl border border-white/10 p-6 shadow-2xl">
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
