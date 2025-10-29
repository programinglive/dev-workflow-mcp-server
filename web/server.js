import { createServer } from "http";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import getPort from "get-port";
import { getHistoryForUser, getSummaryForUser } from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        const limit = Number(url.searchParams.get("limit") || "20");
        const history = getHistoryForUser(userId, Number.isFinite(limit) ? limit : 20);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ history }));
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
