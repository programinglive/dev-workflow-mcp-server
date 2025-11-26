import { readFile, access } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import path from "path";

function getProjectRoot() {
    const initCwd = process.env.INIT_CWD || process.cwd();
    let projectRoot = initCwd;
    while (projectRoot !== path.dirname(projectRoot)) {
        if (existsSync(path.join(projectRoot, "package.json")) && existsSync(path.join(projectRoot, "docs"))) return projectRoot;
        projectRoot = path.dirname(projectRoot);
    }
    return path.join(process.cwd(), "..");
}

const projectRoot = getProjectRoot();

const docSources = {
    "README.md": {
        markdown: join(projectRoot, "README.md"),
        html: join(projectRoot, "dist", "docs", "README.html"),
    },
    "web-dashboard.md": {
        markdown: join(projectRoot, "docs", "web-dashboard.md"),
        html: join(projectRoot, "dist", "docs", "web-dashboard.html"),
    },
    "GETTING-STARTED.md": {
        markdown: join(projectRoot, "docs", "antigravity", "GETTING-STARTED.md"),
        html: join(projectRoot, "dist", "docs", "GETTING-STARTED.html"),
    },
    "EXAMPLES.md": {
        markdown: join(projectRoot, "docs", "antigravity", "EXAMPLES.md"),
        html: join(projectRoot, "dist", "docs", "EXAMPLES.html"),
    },
    "WORKFLOW-TEMPLATES.md": {
        markdown: join(projectRoot, "docs", "antigravity", "WORKFLOW-TEMPLATES.md"),
        html: join(projectRoot, "dist", "docs", "WORKFLOW-TEMPLATES.html"),
    },
    "TROUBLESHOOTING.md": {
        markdown: join(projectRoot, "docs", "antigravity", "TROUBLESHOOTING.md"),
        html: join(projectRoot, "dist", "docs", "TROUBLESHOOTING.html"),
    },
    "RELEASE_NOTES.md": {
        markdown: join(projectRoot, "docs", "release-notes", "RELEASE_NOTES.md"),
        html: join(projectRoot, "dist", "docs", "RELEASE_NOTES.html"),
    },
};

export async function resolveDocContent(docKey) {
    const entry = docSources[docKey];
    if (!entry) {
        return { exists: false };
    }

    // Try HTML first, fall back to Markdown in development or if HTML missing.
    const candidates = [entry.html, entry.markdown];
    for (const candidate of candidates) {
        try {
            await access(candidate);
            const content = await readFile(candidate, "utf-8");
            const format = candidate.endsWith(".html") ? "html" : "markdown";
            return { exists: true, content, format };
        } catch {
            // try next candidate
        }
    }

    return { exists: false };
}

export function getAvailableDocs() {
    return Object.keys(docSources);
}
