import { createServer } from "http";
import { readFile, access } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import getPort from "get-port";
import { getHistoryForUser, getSummaryForUser, getHistorySummary } from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const allowedDocs = {
  "README.md": join(projectRoot, "README.md"),
  "web-dashboard.md": join(projectRoot, "docs", "web-dashboard.md"),
};

async function start() {
  const PORT = process.env.DEV_WORKFLOW_WEB_PORT || await getPort({ port: 3111 });

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get("user") || "default";

      if (req.method === "GET" && url.pathname === "/") {
        const html = await readFile(join(__dirname, "index.html"), "utf-8");
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
        if (!rawDocKey) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ docs: Object.keys(allowedDocs) }));
          return;
        }

        const docKey = rawDocKey.trim();
        const resolvedKey = Object.keys(allowedDocs).find((key) => key.toLowerCase() === docKey.toLowerCase());
        if (!resolvedKey) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Document not found", requested: docKey, available: Object.keys(allowedDocs) }));
          return;
        }

        const docPath = allowedDocs[resolvedKey];

        try {
          await access(docPath);
          const content = await readFile(docPath, "utf-8");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ doc: resolvedKey, content }));
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error.message }));
        }
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
