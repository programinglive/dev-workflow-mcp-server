import { ShieldCheck, TestTube, FileText, GitBranch, History, Zap } from "lucide-react";

export default function Features() {
    return (
        <section id="features" className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Your Coding Conscience</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
                        title="Enforced Discipline"
                        description="Won't let you skip important steps. Follows a strict, proven development workflow."
                        bg="bg-indigo-500/20"
                    />
                    <FeatureCard
                        icon={<TestTube className="w-6 h-6 text-purple-400" />}
                        title="Test-Driven"
                        description="Blocks commits if tests fail. Encourages writing tests before marking tasks complete."
                        bg="bg-purple-500/20"
                    />
                    <FeatureCard
                        icon={<FileText className="w-6 h-6 text-emerald-400" />}
                        title="Documentation"
                        description="Reminds you to update documentation (README, docs, changelog) for every change."
                        bg="bg-emerald-500/20"
                    />
                    <FeatureCard
                        icon={<GitBranch className="w-6 h-6 text-orange-400" />}
                        title="State Tracking"
                        description="Remembers exactly where you are in the workflow, even across sessions."
                        bg="bg-orange-500/20"
                    />
                    <FeatureCard
                        icon={<History className="w-6 h-6 text-blue-400" />}
                        title="Task History"
                        description="Keeps a detailed log of all completed tasks, commits, and releases."
                        bg="bg-blue-500/20"
                    />
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-pink-400" />}
                        title="Smart Prompts"
                        description="Provides quick reminders and guidance on best practices as you work."
                        bg="bg-pink-500/20"
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description, bg }: { icon: React.ReactNode, title: string, description: string, bg: string }) {
    return (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}
