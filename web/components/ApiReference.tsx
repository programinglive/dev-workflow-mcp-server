export default function ApiReference() {
    return (
        <section id="api" className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-8">API Reference</h2>
                <p className="text-gray-400 mb-12">Query workflow data programmatically with our JSON API.</p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                        <code className="text-indigo-400 font-mono text-sm">GET /api/history</code>
                        <p className="text-gray-400 mt-2">Retrieve paginated task history entries.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                        <code className="text-indigo-400 font-mono text-sm">GET /api/summary</code>
                        <p className="text-gray-400 mt-2">Get project health stats and recent tasks.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
