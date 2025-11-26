import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";

const DB_FILENAME = "dev-workflow.db";
const FREQUENCY_FORMATS = {
    daily: "%Y-%m-%d",
    monthly: "%Y-%m",
    yearly: "%Y",
};

function getDbPath() {
    const initCwd = process.env.INIT_CWD || process.cwd();
    let projectRoot = initCwd;

    // Look for .state folder specifically.
    while (projectRoot !== path.dirname(projectRoot)) {
        if (existsSync(path.join(projectRoot, ".state"))) return path.join(projectRoot, ".state", DB_FILENAME);
        projectRoot = path.dirname(projectRoot);
    }

    // Fallback to relative path from this file if possible
    return path.join(process.cwd(), "..", ".state", DB_FILENAME);
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
        data: entries,
        total,
        page: sanitizedPage,
        pageSize: sanitizedPageSize,
        totalPages: Math.ceil(total / sanitizedPageSize)
    };
}
