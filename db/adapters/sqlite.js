import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";
import { DbAdapter } from "./base.js";

const DB_FILENAME = "dev-workflow.db";
const FREQUENCY_FORMATS = {
    daily: "%Y-%m-%d",
    monthly: "%Y-%m",
    yearly: "%Y",
};

export class SqliteAdapter extends DbAdapter {
    constructor(config = {}) {
        super(config);
        this.db = null;
    }

    getDbPath() {
        // If a specific path is provided in config, use it
        if (this.config.dbPath) {
            return this.config.dbPath;
        }

        // Otherwise, attempt to find project root relative to CWD
        const initCwd = process.env.INIT_CWD || process.cwd();
        let projectRoot = initCwd;
        while (projectRoot !== path.dirname(projectRoot)) {
            if (existsSync(path.join(projectRoot, "package.json"))) break;
            projectRoot = path.dirname(projectRoot);
        }
        return path.join(projectRoot, ".state", DB_FILENAME);
    }

    async connect() {
        if (!this.db) {
            const dbPath = this.getDbPath();
            this.db = new Database(dbPath);
            this.db.pragma("journal_mode = WAL");
            await this.migrate();
        }
    }

    async migrate() {
        // 1. Create tables if they don't exist (new installs get the correct schema immediately)
        const createHistory = `
      CREATE TABLE IF NOT EXISTS workflow_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        project_path TEXT DEFAULT '',
        task_description TEXT NOT NULL,
        task_type TEXT NOT NULL,
        commit_message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        forced INTEGER DEFAULT 0,
        force_reason TEXT,
        dropped INTEGER DEFAULT 0,
        drop_reason TEXT,
        UNIQUE(user_id, project_path, timestamp, task_description)
      )
    `;
        // Note: project_summary definition
        const createSummary = `
      CREATE TABLE IF NOT EXISTS project_summary (
        user_id TEXT,
        project_path TEXT DEFAULT '',
        total_tasks INTEGER DEFAULT 0,
        task_types TEXT DEFAULT '{}',
        last_active DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        recent_tasks TEXT DEFAULT '[]',
        PRIMARY KEY (user_id, project_path)
      )
    `;
        const createState = `
      CREATE TABLE IF NOT EXISTS workflow_state (
        user_id TEXT,
        project_path TEXT DEFAULT '',
        state_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, project_path)
      )
    `;

        this.db.exec(createHistory);

        // 2. MIGRATION: Handle existing databases (workflow_history)
        try {
            const tableInfo = this.db.prepare("PRAGMA table_info(workflow_history)").all();
            if (!tableInfo.some(col => col.name === 'project_path')) {
                // Add column to existing table
                this.db.exec("ALTER TABLE workflow_history ADD COLUMN project_path TEXT DEFAULT ''");

                // Re-create index to include new column
                this.db.exec("DROP INDEX IF EXISTS idx_workflow_history_user");
                // We need to fix the UNIQUE constraint if possible, but SQLite ALTER TABLE limitations make that hard.
                // For now, ensuring the column exists allows the new INSERT logic (inserting '') to work.
                // Duplicate entries from old schema (with no project_path) effectively mean project_path='' which matches new default.
            }
        } catch (e) {
            console.error("Migration error (workflow_history):", e.message);
        }

        // 3. MIGRATION: Handle project_summary (Drop and Recreate if schema mismatch)
        // Since it's a cache and we're changing the Primary Key, it's safer/easier to just drop it.
        let recreateSummary = false;
        try {
            const summaryInfo = this.db.prepare("PRAGMA table_info(project_summary)").all();
            // If table exists but missing project_path, drop it
            if (summaryInfo.length > 0 && !summaryInfo.some(col => col.name === 'project_path')) {
                this.db.exec("DROP TABLE IF EXISTS project_summary");
                recreateSummary = true;
            }
        } catch (e) {
            // Ignore
        }

        this.db.exec(createSummary); // Will create if we dropped it or if it didn't exist
        this.db.exec(createState);

        // 4. Create Indexes (Safe now that columns exist)
        const idxHistory = `CREATE INDEX IF NOT EXISTS idx_workflow_history_user_project ON workflow_history(user_id, project_path)`;
        const idxSummary = `CREATE INDEX IF NOT EXISTS idx_project_summary_user_project ON project_summary(user_id, project_path)`;

        // START FIX: Create explicit UNIQUE index to support ON CONFLICT clause for migrated tables
        // The original table constraint was UNIQUE(user_id, timestamp, task_description).
        // The new Insert statement relies on UNIQUE(user_id, project_path, timestamp, task_description).
        // We must ensure this index exists for ON CONFLICT to work.
        const idxUnique = `CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_history_entry_v2 ON workflow_history(user_id, project_path, timestamp, task_description)`;
        // END FIX

        this.db.exec(idxHistory);
        this.db.exec(idxSummary);
        this.db.exec(idxUnique);
    }

    async insertHistoryEntry(userId, projectPath, entry) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        // SQLite upsert syntax
        const stmt = this.db.prepare(`
      INSERT INTO workflow_history
      (user_id, project_path, task_description, task_type, commit_message, timestamp, forced, force_reason, dropped, drop_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, project_path, timestamp, task_description) DO UPDATE SET
        commit_message=excluded.commit_message,
        forced=excluded.forced,
        force_reason=excluded.force_reason,
        dropped=excluded.dropped,
        drop_reason=excluded.drop_reason
    `);

        stmt.run(
            userId,
            normalizedProjectPath,
            entry.taskDescription,
            entry.taskType,
            entry.commitMessage,
            entry.timestamp || new Date().toISOString(),
            entry.forced ? 1 : 0,
            entry.forceReason || null,
            entry.dropped ? 1 : 0,
            entry.dropReason || null
        );

        await this.updateSummaryForUser(userId, normalizedProjectPath);
    }

    async updateSummaryForUser(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const getHistory = this.db.prepare(`
      SELECT task_type, timestamp, task_description
      FROM workflow_history
      WHERE user_id = ? AND project_path = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `);
        const rows = getHistory.all(userId, normalizedProjectPath);

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

        const upsert = this.db.prepare(`
      INSERT INTO project_summary
      (user_id, project_path, total_tasks, task_types, last_active, recent_tasks, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, project_path) DO UPDATE SET
        total_tasks=excluded.total_tasks,
        task_types=excluded.task_types,
        last_active=excluded.last_active,
        recent_tasks=excluded.recent_tasks,
        updated_at=excluded.updated_at
    `);

        upsert.run(
            userId,
            normalizedProjectPath,
            rows.length,
            JSON.stringify(taskTypes),
            lastActive,
            JSON.stringify(recentTasks),
            new Date().toISOString()
        );
    }

    async getSummaryForUser(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const stmt = this.db.prepare(`
      SELECT * FROM project_summary WHERE user_id = ? AND project_path = ?
    `);
        const row = stmt.get(userId, normalizedProjectPath);

        if (!row) return null;
        return {
            totalTasks: row.total_tasks,
            taskTypes: JSON.parse(row.task_types),
            lastActive: row.last_active,
            recentTasks: JSON.parse(row.recent_tasks),
            updatedAt: row.updated_at,
        };
    }

    buildHistoryFilters({ startDate, endDate }) {
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

    async getHistoryForUser(userId, projectPath, options = {}) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const { page = 1, pageSize = 20, startDate, endDate } = options;
        const sanitizedPage = Math.max(1, Number.isFinite(Number(page)) ? Math.floor(Number(page)) : 1);
        const sanitizedPageSize = Math.min(100, Math.max(1, Number.isFinite(Number(pageSize)) ? Math.floor(Number(pageSize)) : 20));
        const offset = (sanitizedPage - 1) * sanitizedPageSize;

        const { clauses, params } = this.buildHistoryFilters({ startDate, endDate });
        const where = ["user_id = ?", "project_path = ?", ...clauses].join(" AND ");

        const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM workflow_history WHERE ${where}`);
        const total = countStmt.get(userId, normalizedProjectPath, ...params).total;

        const rowsStmt = this.db.prepare(`
      SELECT *
      FROM workflow_history
      WHERE ${where}
      ORDER BY timestamp DESC
      LIMIT ?
      OFFSET ?
    `);
        const entries = rowsStmt.all(userId, normalizedProjectPath, ...params, sanitizedPageSize, offset);

        return {
            entries,
            total,
            page: sanitizedPage,
            pageSize: sanitizedPageSize,
        };
    }

    async getHistorySummary(userId, projectPath, options = {}) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const { startDate, endDate, frequency = "daily" } = options;
        const format = FREQUENCY_FORMATS[frequency] || FREQUENCY_FORMATS.daily;
        const { clauses, params } = this.buildHistoryFilters({ startDate, endDate });
        const where = ["user_id = ?", "project_path = ?", ...clauses].join(" AND ");

        const stmt = this.db.prepare(`
      SELECT strftime('${format}', timestamp) AS period, COUNT(*) AS count
      FROM workflow_history
      WHERE ${where}
      GROUP BY period
      ORDER BY period DESC
    `);

        return stmt
            .all(userId, normalizedProjectPath, ...params)
            .map((row) => ({ period: row.period, count: row.count }));
    }

    async saveState(userId, projectPath, state) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const stmt = this.db.prepare(`
      INSERT INTO workflow_state (user_id, project_path, state_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, project_path) DO UPDATE SET
        state_json=excluded.state_json,
        updated_at=excluded.updated_at
    `);

        stmt.run(
            userId,
            normalizedProjectPath,
            JSON.stringify(state),
            new Date().toISOString()
        );
    }

    async getState(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const stmt = this.db.prepare(`
      SELECT state_json FROM workflow_state WHERE user_id = ? AND project_path = ?
    `);
        const row = stmt.get(userId, normalizedProjectPath);

        if (!row) return null;
        try {
            return JSON.parse(row.state_json);
        } catch {
            return null;
        }
    }
}
