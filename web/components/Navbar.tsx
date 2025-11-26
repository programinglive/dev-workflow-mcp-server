"use client";

import { useState } from "react";
import Link from "next/link";
import { Github, Menu, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/assets/logo.png" alt="Dev Workflow" width={32} height={32} className="rounded-lg" />
                        <span className="text-lg font-bold">Dev Workflow</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/#features" className="text-gray-300 hover:text-white transition">Features</Link>
                        <Link href="/#history" className="text-gray-300 hover:text-white transition">History</Link>
                        <Link href="/#api" className="text-gray-300 hover:text-white transition">API</Link>
                        <Link href="/docs" className="text-gray-300 hover:text-white transition">Docs</Link>
                        <a
                            href="https://github.com/programinglive/dev-workflow-mcp-server"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-white/5"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>
            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-white/10 bg-[#0a0a0f]">
                    <div className="px-4 py-4 space-y-3">
                        <Link href="/#features" className="block text-gray-300 hover:text-white transition" onClick={() => setIsOpen(false)}>Features</Link>
                        <Link href="/#history" className="block text-gray-300 hover:text-white transition" onClick={() => setIsOpen(false)}>History</Link>
                        <Link href="/#api" className="block text-gray-300 hover:text-white transition" onClick={() => setIsOpen(false)}>API</Link>
                        <Link href="/docs" className="block text-gray-300 hover:text-white transition" onClick={() => setIsOpen(false)}>Docs</Link>
                        <a
                            href="https://github.com/programinglive/dev-workflow-mcp-server"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
