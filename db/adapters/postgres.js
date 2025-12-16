import pg from "pg";
import { DbAdapter } from "./base.js";

const { Pool } = pg;

const FREQUENCY_FORMATS = {
    daily: "YYYY-MM-DD",
    monthly: "YYYY-MM",
    yearly: "YYYY",
};

export class PostgresAdapter extends DbAdapter {
    constructor(config = {}) {
        super(config);
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = new Pool({
                connectionString: this.config.connectionUrl,
                // pg pool handles connections automatically
            });
            await this.migrate();
        }
    }

    async migrate() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_history (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          project_path TEXT DEFAULT '',
          task_description TEXT NOT NULL,
          task_type TEXT NOT NULL,
          commit_message TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          forced BOOLEAN DEFAULT FALSE,
          force_reason TEXT,
          dropped BOOLEAN DEFAULT FALSE,
          drop_reason TEXT,
          UNIQUE (user_id, project_path, timestamp, task_description)
        )
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS project_summary (
          user_id TEXT,
          project_path TEXT DEFAULT '',
          total_tasks INTEGER DEFAULT 0,
          task_types JSONB,
          last_active TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          recent_tasks JSONB,
          PRIMARY KEY (user_id, project_path)
        )
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_state (
          user_id TEXT,
          project_path TEXT DEFAULT '',
          state_json JSONB,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, project_path)
        )
      `);
        } finally {
            client.release();
        }
    }

    async insertHistoryEntry(userId, projectPath, entry) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const query = `
      INSERT INTO workflow_history
      (user_id, project_path, task_description, task_type, commit_message, timestamp, forced, force_reason, dropped, drop_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, project_path, timestamp, task_description) DO UPDATE SET
        commit_message=EXCLUDED.commit_message,
        forced=EXCLUDED.forced,
        force_reason=EXCLUDED.force_reason,
        dropped=EXCLUDED.dropped,
        drop_reason=EXCLUDED.drop_reason
    `;

        await this.pool.query(query, [
            userId,
            normalizedProjectPath,
            entry.taskDescription,
            entry.taskType,
            entry.commitMessage,
            entry.timestamp || new Date().toISOString(),
            entry.forced || false,
            entry.forceReason || null,
            entry.dropped || false,
            entry.dropReason || null
        ]);

        await this.updateSummaryForUser(userId, normalizedProjectPath);
    }

    async updateSummaryForUser(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const res = await this.pool.query(`
      SELECT task_type, timestamp, task_description
      FROM workflow_history
      WHERE user_id = $1 AND project_path = $2
      ORDER BY timestamp DESC
      LIMIT 20
    `, [userId, normalizedProjectPath]);

        const rows = res.rows;

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

        const upsert = `
      INSERT INTO project_summary
      (user_id, project_path, total_tasks, task_types, last_active, recent_tasks, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, project_path) DO UPDATE SET
        total_tasks=EXCLUDED.total_tasks,
        task_types=EXCLUDED.task_types,
        last_active=EXCLUDED.last_active,
        recent_tasks=EXCLUDED.recent_tasks,
        updated_at=EXCLUDED.updated_at
    `;

        await this.pool.query(upsert, [
            userId,
            normalizedProjectPath,
            rows.length,
            JSON.stringify(taskTypes),
            lastActive,
            JSON.stringify(recentTasks),
            new Date().toISOString()
        ]);
    }

    async getSummaryForUser(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const res = await this.pool.query(`
      SELECT * FROM project_summary WHERE user_id = $1 AND project_path = $2
    `, [userId, normalizedProjectPath]);

        const row = res.rows[0];
        if (!row) return null;

        return {
            totalTasks: row.total_tasks,
            taskTypes: row.task_types, // pg parses jsonb automatically
            lastActive: row.last_active,
            recentTasks: row.recent_tasks,
            updatedAt: row.updated_at,
        };
    }

    async getHistoryForUser(userId, projectPath, options = {}) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const { page = 1, pageSize = 20, startDate, endDate } = options;
        const sanitizedPage = Math.max(1, Number.isFinite(Number(page)) ? Math.floor(Number(page)) : 1);
        const sanitizedPageSize = Math.min(100, Math.max(1, Number.isFinite(Number(pageSize)) ? Math.floor(Number(pageSize)) : 20));
        const offset = (sanitizedPage - 1) * sanitizedPageSize;

        const clauses = [];
        const params = [userId, normalizedProjectPath];
        let paramIdx = 3;

        if (startDate) {
            clauses.push(`DATE(timestamp) >= DATE($${paramIdx++})`);
            params.push(startDate);
        }
        if (endDate) {
            clauses.push(`DATE(timestamp) <= DATE($${paramIdx++})`);
            params.push(endDate);
        }

        const where = [`user_id = $1`, `project_path = $2`, ...clauses].join(" AND ");

        const countRes = await this.pool.query(
            `SELECT COUNT(*) as total FROM workflow_history WHERE ${where}`,
            params
        );
        const total = parseInt(countRes.rows[0].total, 10);

        const entriesRes = await this.pool.query(`
      SELECT *
      FROM workflow_history
      WHERE ${where}
      ORDER BY timestamp DESC
      LIMIT $${paramIdx++}
      OFFSET $${paramIdx++}
    `, [...params, sanitizedPageSize, offset]);

        return {
            entries: entriesRes.rows,
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

        const clauses = [];
        const params = [userId, normalizedProjectPath];
        let paramIdx = 3;

        if (startDate) {
            clauses.push(`DATE(timestamp) >= DATE($${paramIdx++})`);
            params.push(startDate);
        }
        if (endDate) {
            clauses.push(`DATE(timestamp) <= DATE($${paramIdx++})`);
            params.push(endDate);
        }

        const where = [`user_id = $1`, `project_path = $2`, ...clauses].join(" AND ");

        const res = await this.pool.query(`
      SELECT to_char(timestamp, '${format}') AS period, COUNT(*) AS count
      FROM workflow_history
      WHERE ${where}
      GROUP BY period
      ORDER BY period DESC
    `, params);

        return res.rows;
    }

    async saveState(userId, projectPath, state) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const query = `
      INSERT INTO workflow_state
      (user_id, project_path, state_json, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, project_path) DO UPDATE SET
        state_json=EXCLUDED.state_json,
        updated_at=EXCLUDED.updated_at
    `;

        await this.pool.query(query, [
            userId,
            normalizedProjectPath,
            JSON.stringify(state),
            new Date().toISOString()
        ]);
    }

    async getState(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const res = await this.pool.query(`
      SELECT state_json FROM workflow_state WHERE user_id = $1 AND project_path = $2
    `, [userId, normalizedProjectPath]);

        const row = res.rows[0];
        if (!row) return null;

        return row.state_json; // pg automatically parses JSONB
    }
}
