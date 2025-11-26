
const state = {
    userId: "", startDate: "", endDate: "", page: 1, pageSize: 20, totalPages: 1
};
const el = (id) => document.getElementById(id);

async function load() {
    const params = new URLSearchParams();
    if (state.userId) params.append("user", state.userId);
    if (state.startDate) params.append("startDate", state.startDate);
    if (state.endDate) params.append("endDate", state.endDate);
    params.append("page", state.page);
    params.append("pageSize", state.pageSize);

    try {
        const res = await fetch(`/api/history?${params}`);
        const data = await res.json();
        state.totalPages = data.totalPages;

        el("historySection").classList.remove("hidden");
        el("summarySection").classList.remove("hidden");
        el("paginationControls").classList.remove("hidden");

        el("pageInfo").textContent = `Page ${data.page} of ${data.totalPages}`;

        el("historyContent").innerHTML = (data.data || []).map(row => `
      <div class="p-4 rounded-lg bg-white/5 border border-white/10">
        <div class="font-semibold">${row.task_description}</div>
        <div class="text-sm text-gray-400 mt-1">${new Date(row.created_at).toLocaleString()}</div>
      </div>
    `).join('') || '<p class="text-gray-500">No history yet.</p>';

        el("prevPageBtn").disabled = data.page <= 1;
        el("nextPageBtn").disabled = data.page >= data.totalPages;
    } catch (err) {
        console.error(err);
    }

    try {
        const summaryRes = await fetch(`/api/summary?${params}`);
        const summary = await summaryRes.json();
        el("summaryContent").innerHTML = `<p>Total tasks: ${summary.summary?.totalTasks || 0}</p>`;
    } catch (err) {
        console.error(err);
    }
}

el("applyFiltersBtn").addEventListener("click", () => {
    state.userId = el("userId").value;
    state.startDate = el("startDate").value;
    state.endDate = el("endDate").value;
    state.page = 1;
    load();
});

el("prevPageBtn").addEventListener("click", () => {
    if (state.page > 1) {
        state.page--;
        load();
    }
});

el("nextPageBtn").addEventListener("click", () => {
    if (state.page < state.totalPages) {
        state.page++;
        load();
    }
});

// Terminal Animation
const terminalLines = [
    { type: 'command', text: 'start_task', delay: 500 },
    { type: 'success', text: '✓ Task started: Implement user auth', delay: 1500 },
    { type: 'comment', text: '# Write code...', delay: 2500 },
    { type: 'command', text: 'mark_bug_fixed', delay: 4000 },
    { type: 'info', text: '✨ Feature complete! Now create tests...', delay: 5000 },
    { type: 'command', text: 'create_tests', delay: 6500 },
    { type: 'success', text: '✓ Tests created', delay: 7500 },
    { type: 'command', text: 'run_tests', delay: 8500 },
    { type: 'success', text: '✓ All tests passed!', delay: 9500 },
    { type: 'command', text: 'create_documentation', delay: 10500 },
    { type: 'success', text: '✓ Documentation updated', delay: 11500 },
    { type: 'command', text: 'commit_and_push', delay: 12500 },
    { type: 'final', text: 'Ready to release!', delay: 13500 }
];

const terminalContent = document.getElementById('terminalContent');

function createLine(line) {
    const div = document.createElement('div');
    div.className = 'terminal-line';

    if (line.type === 'command') {
        div.innerHTML = `<span class="text-gray-500 mr-2">$</span><span class="text-white typing-cursor">${line.text}</span>`;
    } else if (line.type === 'success') {
        div.className += ' text-emerald-400';
        div.textContent = line.text;
    } else if (line.type === 'comment') {
        div.innerHTML = `<span class="text-gray-500 mr-2">$</span><span class="text-white">${line.text}</span>`;
        div.classList.add('mt-3');
    } else if (line.type === 'info') {
        div.className += ' text-purple-400';
        div.textContent = line.text;
    } else if (line.type === 'final') {
        div.className += ' text-pink-400 flex items-center gap-2';
        div.innerHTML = `<i data-lucide="rocket" class="w-4 h-4"></i>${line.text}`;
    }

    return div;
}

async function runTerminalAnimation() {
    terminalContent.innerHTML = '';

    for (const line of terminalLines) {
        const div = createLine(line);
        terminalContent.appendChild(div);

        if (line.type === 'command') {
            const textSpan = div.querySelector('.typing-cursor');
            const fullText = line.text;
            textSpan.textContent = '';
            div.classList.add('visible');

            for (let i = 0; i < fullText.length; i++) {
                textSpan.textContent += fullText[i];
                await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
            }

            textSpan.classList.remove('typing-cursor');
        } else {
            await new Promise(r => setTimeout(r, 300));
            div.classList.add('visible');
        }

        await new Promise(r => setTimeout(r, 500));
    }
}

// Start animation when visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            runTerminalAnimation();
            observer.disconnect();
        }
    });
});

observer.observe(document.querySelector('.relative.bg-\\[\\#1a1a24\\]'));

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking on a link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}
