import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILENAME = "dev-workflow.db";

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

export function getHistoryForUser(userId, limit = 10) {
  const stmt = getDb().prepare(`
    SELECT * FROM workflow_history
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(userId, limit);
}
