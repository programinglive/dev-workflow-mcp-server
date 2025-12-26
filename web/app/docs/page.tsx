import Link from "next/link";
import { ArrowLeft, CheckCircle, GitBranch, FileText, TestTube, Rocket } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white pt-20 px-4 pb-12 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 dark:from-indigo-400 via-purple-600 dark:via-purple-400 to-pink-600 dark:to-pink-400 bg-clip-text text-transparent">
                        Dev Workflow MCP Server
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                        An MCP server that acts as your coding conscience. Enforce test-driven development, ensure documentation,
                        and never skip a step in your release process.
                    </p>

                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4 mb-8">
                        <p className="text-emerald-700 dark:text-emerald-400 font-semibold">Version: 1.8.1</p>
                    </div>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">Features</h2>
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enforced Discipline</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Won't let you skip important steps. Follows a strict, proven development workflow.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test-Driven</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Blocks commits if tests fail. Encourages writing tests before marking tasks complete.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documentation</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Reminds you to update documentation (README, docs, changelog) for every change.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <GitBranch className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">State Tracking</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Remembers exactly where you are in the workflow, even across sessions.</p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">Installation</h2>
                    <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-6 border border-gray-300 dark:border-white/10 mb-8">
                        <pre className="text-sm overflow-x-auto">
                            <code className="text-gray-700 dark:text-gray-300">npm install -g @programinglive/dev-workflow-mcp-server</code>
                        </pre>
                    </div>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">Quick Start</h2>
                    <ol className="space-y-4 mb-8">
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">1</span>
                            <div>
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Start a Task</h3>
                                <p className="text-gray-600 dark:text-gray-400">Begin your coding session by defining what you're working on.</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-3 mt-2 border border-gray-300 dark:border-white/10">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">start_task</code>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">2</span>
                            <div>
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Mark Bug Fixed</h3>
                                <p className="text-gray-600 dark:text-gray-400">Once you've implemented your feature or fix, mark it as complete.</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-3 mt-2 border border-gray-300 dark:border-white/10">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">mark_bug_fixed</code>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">3</span>
                            <div>
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Create Tests</h3>
                                <p className="text-gray-600 dark:text-gray-400">Write tests to verify your changes work correctly.</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-3 mt-2 border border-gray-300 dark:border-white/10">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">create_tests</code>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">4</span>
                            <div>
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Run Tests</h3>
                                <p className="text-gray-600 dark:text-gray-400">Execute your test suite and ensure everything passes.</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-3 mt-2 border border-gray-300 dark:border-white/10">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">run_tests</code>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold">5</span>
                            <div>
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Create Documentation</h3>
                                <p className="text-gray-600 dark:text-gray-400">Update relevant documentation for your changes.</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-3 mt-2 border border-gray-300 dark:border-white/10">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">create_documentation</code>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">6</span>
                            <div>
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Commit and Push</h3>
                                <p className="text-gray-600 dark:text-gray-400">Commit your changes and push to the repository.</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a24] rounded-lg p-3 mt-2 border border-gray-300 dark:border-white/10">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">commit_and_push</code>
                                </div>
                            </div>
                        </li>
                    </ol>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">Available Commands</h2>
                    <div className="space-y-3 mb-8">
                        {[
                            { cmd: "start_task", desc: "Begin a new coding task" },
                            { cmd: "mark_bug_fixed", desc: "Mark feature/bugfix as complete" },
                            { cmd: "create_tests", desc: "Record that tests have been created" },
                            { cmd: "run_tests", desc: "Execute and record test results" },
                            { cmd: "skip_tests", desc: "Skip tests with justification" },
                            { cmd: "create_documentation", desc: "Record documentation updates" },
                            { cmd: "commit_and_push", desc: "Commit and push changes" },
                            { cmd: "perform_release", desc: "Execute release process" },
                            { cmd: "complete_task", desc: "Mark task as complete" },
                            { cmd: "get_workflow_status", desc: "Check current workflow state" },
                            { cmd: "view_history", desc: "View completed tasks" },
                        ].map((item) => (
                            <div key={item.cmd} className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                                <code className="text-indigo-600 dark:text-indigo-400 font-mono">{item.cmd}</code>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">Configuration</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The server stores workflow state in a SQLite database located at <code className="text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">.state/dev-workflow.db</code>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Set the <code className="text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">DEV_WORKFLOW_USER_ID</code> environment variable to isolate workflow state per user.
                    </p>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">Requirements</h2>
                    <ul className="space-y-2 mb-8">
                        <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Node.js 18 or higher
                        </li>
                        <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Git installed and configured
                        </li>
                        <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            MCP-compatible AI assistant (e.g., Claude Desktop)
                        </li>
                    </ul>

                    <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white">License</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        MIT License - Free to use for personal and commercial projects.
                    </p>

                    <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-500/10 via-purple-50 dark:via-purple-500/10 to-pink-50 dark:to-pink-500/10 border border-gray-300 dark:border-white/10 rounded-lg p-6 mt-12">
                        <div className="flex items-center gap-3 mb-3">
                            <Rocket className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ready to get started?</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Install the MCP server and start enforcing best practices in your development workflow today!
                        </p>
                        <Link
                            href="https://github.com/programinglive/dev-workflow-mcp-server"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-600 dark:to-purple-600 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-indigo-500/50 transition"
                        >
                            View on GitHub
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
