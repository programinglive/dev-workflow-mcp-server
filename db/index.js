import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILENAME = "dev-workflow.db";
const FREQUENCY_FORMATS = {
  daily: "%Y-%m-%d",
  monthly: "%Y-%m",
  yearly: "%Y",
};

function getDbPath() {
  const initCwd = process.env.INIT_CWD || process.cwd();
  let projectRoot = initCwd;
  while (projectRoot !== path.dirname(projectRoot)) {
    if (existsSync(path.join(projectRoot, "package.json"))) break;
    projectRoot = path.dirname(projectRoot);
  }
  return path.join(projectRoot, ".state", DB_FILENAME);
}

let db;
export function getDb() {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    migrate();
  }
  return db;
}

function migrate() {
  const createHistory = `
    CREATE TABLE IF NOT EXISTS workflow_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      task_description TEXT NOT NULL,
      task_type TEXT NOT NULL,
      commit_message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      forced INTEGER DEFAULT 0,
      force_reason TEXT,
      dropped INTEGER DEFAULT 0,
      drop_reason TEXT,
      UNIQUE(user_id, timestamp, task_description)
    )
  `;
  const createSummary = `
    CREATE TABLE IF NOT EXISTS project_summary (
      user_id TEXT PRIMARY KEY,
      total_tasks INTEGER DEFAULT 0,
      task_types TEXT DEFAULT '{}',
      last_active DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      recent_tasks TEXT DEFAULT '[]'
    )
  `;
  const idxHistory = `CREATE INDEX IF NOT EXISTS idx_workflow_history_user ON workflow_history(user_id)`;
  const idxSummary = `CREATE INDEX IF NOT EXISTS idx_project_summary_user ON project_summary(user_id)`;

  db.exec(createHistory);
  db.exec(createSummary);
  db.exec(idxHistory);
  db.exec(idxSummary);
}

export function insertHistoryEntry(userId, entry) {
  const stmt = getDb().prepare(`
    INSERT OR REPLACE INTO workflow_history
    (user_id, task_description, task_type, commit_message, timestamp, forced, force_reason, dropped, drop_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    userId,
    entry.taskDescription,
    entry.taskType,
    entry.commitMessage,
    entry.timestamp || new Date().toISOString(),
    entry.forced ? 1 : 0,
    entry.forceReason || null,
    entry.dropped ? 1 : 0,
    entry.dropReason || null
  );
  updateSummaryForUser(userId);
}

export function updateSummaryForUser(userId) {
  const getHistory = getDb().prepare(`
    SELECT task_type, timestamp, task_description
    FROM workflow_history
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 20
  `);
  const rows = getHistory.all(userId);

  const taskTypes = {};
  for (const row of rows) {
    taskTypes[row.task_type] = (taskTypes[row.task_type] || 0) + 1;
  }

  const recentTasks = rows.slice(0, 5).map(r => ({
    description: r.task_description,
    type: r.task_type,
    timestamp: r.timestamp,
  }));

  const lastActive = rows[0]?.timestamp || null;

  const upsert = getDb().prepare(`
    INSERT OR REPLACE INTO project_summary
    (user_id, total_tasks, task_types, last_active, recent_tasks, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  upsert.run(
    userId,
    rows.length,
    JSON.stringify(taskTypes),
    lastActive,
    JSON.stringify(recentTasks),
    new Date().toISOString()
  );
}

export function getSummaryForUser(userId) {
  const stmt = getDb().prepare(`
    SELECT * FROM project_summary WHERE user_id = ?
  `);
  const row = stmt.get(userId);
  if (!row) return null;
  return {
    totalTasks: row.total_tasks,
    taskTypes: JSON.parse(row.task_types),
    lastActive: row.last_active,
    recentTasks: JSON.parse(row.recent_tasks),
    updatedAt: row.updated_at,
  };
}

function buildHistoryFilters({ startDate, endDate }) {
  const clauses = [];
  const params = [];
  if (startDate) {
    clauses.push("DATE(timestamp) >= DATE(?)");
    params.push(startDate);
  }
  if (endDate) {
    clauses.push("DATE(timestamp) <= DATE(?)");
    params.push(endDate);
  }
  return { clauses, params };
}

export function getHistoryForUser(userId, options = {}) {
  const { page = 1, pageSize = 20, startDate, endDate } = options;
  const sanitizedPage = Math.max(1, Number.isFinite(Number(page)) ? Math.floor(Number(page)) : 1);
  const sanitizedPageSize = Math.min(100, Math.max(1, Number.isFinite(Number(pageSize)) ? Math.floor(Number(pageSize)) : 20));
  const offset = (sanitizedPage - 1) * sanitizedPageSize;

  const { clauses, params } = buildHistoryFilters({ startDate, endDate });
  const where = ["user_id = ?", ...clauses].join(" AND ");
  const dbInstance = getDb();

  const countStmt = dbInstance.prepare(`SELECT COUNT(*) as total FROM workflow_history WHERE ${where}`);
  const total = countStmt.get(userId, ...params).total;

  const rowsStmt = dbInstance.prepare(`
    SELECT *
    FROM workflow_history
    WHERE ${where}
    ORDER BY timestamp DESC
    LIMIT ?
    OFFSET ?
  `);
  const entries = rowsStmt.all(userId, ...params, sanitizedPageSize, offset);

  return {
    entries,
    total,
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
  };
}

export function getHistorySummary(userId, options = {}) {
  const { startDate, endDate, frequency = "daily" } = options;
  const format = FREQUENCY_FORMATS[frequency] || FREQUENCY_FORMATS.daily;
  const { clauses, params } = buildHistoryFilters({ startDate, endDate });
  const where = ["user_id = ?", ...clauses].join(" AND ");
  const stmt = getDb().prepare(`
    SELECT strftime('${format}', timestamp) AS period, COUNT(*) AS count
    FROM workflow_history
    WHERE ${where}
    GROUP BY period
    ORDER BY period DESC
  `);
  return stmt
    .all(userId, ...params)
    .map((row) => ({ period: row.period, count: row.count }));
}
