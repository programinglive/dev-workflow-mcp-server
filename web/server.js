import { createServer } from "http";
import { readFile, access } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import getPort from "get-port";
import { getHistoryForUser, getSummaryForUser, getHistorySummary } from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

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

async function resolveDocContent(docKey) {
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

function getPreferredPort() {
  const fromEnv = process.env.PORT || process.env.DEV_WORKFLOW_WEB_PORT;

  if (!fromEnv) {
    return null;
  }

  const parsed = Number(fromEnv);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function start() {
  const preferred = getPreferredPort();
  const PORT = preferred ?? await getPort({ port: 3111 });

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get("user") || "default";

      if (req.method === "GET" && url.pathname === "/output.css") {
        const css = await readFile(join(__dirname, "public", "output.css"), "utf-8");
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(css);
      } else if (req.method === "GET" && url.pathname === "/") {
        const html = await readFile(join(__dirname, "public", "index.html"), "utf-8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      } else if (req.method === "GET" && url.pathname === "/api/summary") {
        const summary = getSummaryForUser(userId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ summary }));
      } else if (req.method === "GET" && url.pathname === "/api/history") {
        const page = Number(url.searchParams.get("page") || "1");
        const pageSize = Number(url.searchParams.get("pageSize") || "20");
        const startDate = url.searchParams.get("startDate") || undefined;
        const endDate = url.searchParams.get("endDate") || undefined;
        const history = getHistoryForUser(userId, { page, pageSize, startDate, endDate });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(history));
      } else if (req.method === "GET" && url.pathname === "/api/history-summary") {
        const startDate = url.searchParams.get("startDate") || undefined;
        const endDate = url.searchParams.get("endDate") || undefined;
        const frequency = url.searchParams.get("frequency") || "daily";
        const summary = getHistorySummary(userId, { startDate, endDate, frequency });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ summary }));
      } else if (req.method === "GET" && url.pathname === "/api/docs") {
        const rawDocKey = url.searchParams.get("doc");
        const availableDocs = Object.keys(docSources);

        if (!rawDocKey) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ docs: availableDocs }));
          return;
        }

        const docKey = rawDocKey.trim();
        const resolvedKey = availableDocs.find((key) => key.toLowerCase() === docKey.toLowerCase());
        if (!resolvedKey) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Document not found", requested: docKey, available: availableDocs }));
          return;
        }

        const result = await resolveDocContent(resolvedKey);
        if (!result.exists) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Document asset is missing" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ doc: resolvedKey, content: result.content, format: result.format }));
      } else if (req.method === "GET" && url.pathname === "/api/version") {
        const packageJson = await readFile(join(projectRoot, "package.json"), "utf-8");
        const { version } = JSON.parse(packageJson);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ version }));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(err.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`🌐 Dev Workflow Dashboard running at http://localhost:${PORT}`);
  });
}

start();
