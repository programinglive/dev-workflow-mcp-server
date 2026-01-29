"use client";

import { useEffect, useState, useRef } from "react";
import { Rocket } from "lucide-react";

type TerminalLine = {
    type: 'command' | 'success' | 'comment' | 'info' | 'final';
    text: string;
    delay: number;
};

const terminalLines: TerminalLine[] = [
    { type: 'command', text: 'start_task', delay: 500 },
    { type: 'success', text: '✓ Task started: Implement user auth', delay: 1500 },
    { type: 'command', text: 'create_feature_flow', delay: 2500 },
    { type: 'success', text: '✓ Feature flow created with Mermaid', delay: 3500 },
    { type: 'comment', text: '# Write code...', delay: 4500 },
    { type: 'command', text: 'mark_bug_fixed', delay: 6000 },
    { type: 'info', text: '✨ Feature complete! Now create tests...', delay: 7000 },
    { type: 'command', text: 'create_tests', delay: 8500 },
    { type: 'success', text: '✓ Tests created', delay: 9500 },
    { type: 'command', text: 'run_tests', delay: 10500 },
    { type: 'success', text: '✓ All tests passed!', delay: 11500 },
    { type: 'command', text: 'create_documentation', delay: 12500 },
    { type: 'success', text: '✓ Documentation updated', delay: 13500 },
    { type: 'command', text: 'commit_and_push', delay: 14500 },
    { type: 'final', text: 'Ready to release!', delay: 15500 }
];

export default function Terminal() {
    const [lines, setLines] = useState<React.ReactElement[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasStarted.current) {
                    hasStarted.current = true;
                    runAnimation();
                }
            });
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const runAnimation = async () => {
        for (const line of terminalLines) {
            await new Promise(r => setTimeout(r, line.delay - (terminalLines[terminalLines.indexOf(line) - 1]?.delay || 0)));

            if (line.type === 'command') {
                await typeCommand(line.text);
            } else {
                addLine(line);
            }
        }
    };

    const typeCommand = async (text: string) => {
        const id = Date.now();
        setLines(prev => [...prev, (
            <div key={id} className="terminal-line visible">
                <span className="text-gray-500 mr-2">$</span>
                <span className="text-white typing-cursor" id={`cmd-${id}`}></span>
            </div>
        )]);

        for (let i = 0; i < text.length; i++) {
            await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
            const el = document.getElementById(`cmd-${id}`);
            if (el) el.textContent += text[i];
        }

        const el = document.getElementById(`cmd-${id}`);
        if (el) el.classList.remove('typing-cursor');
    };

    const addLine = (line: TerminalLine) => {
        let content: React.ReactElement;
        let className = "terminal-line visible";

        switch (line.type) {
            case 'success':
                className += " text-emerald-400";
                content = <>{line.text}</>;
                break;
            case 'comment':
                className += " mt-3";
                content = <><span className="text-gray-500 mr-2">$</span><span className="text-white">{line.text}</span></>;
                break;
            case 'info':
                className += " text-purple-400";
                content = <>{line.text}</>;
                break;
            case 'final':
                className += " text-pink-400 flex items-center gap-2";
                content = <><Rocket className="w-4 h-4" />{line.text}</>;
                break;
            default:
                content = <>{line.text}</>;
        }

        setLines(prev => [...prev, <div key={Date.now()} className={className}>{content}</div>]);
    };

    return (
        <div ref={containerRef} className="font-mono text-xs sm:text-sm space-y-1.5 sm:space-y-2 min-h-[300px] sm:min-h-[400px]">
            {lines}
        </div>
    );
}
