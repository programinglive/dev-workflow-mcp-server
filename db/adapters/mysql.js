import mysql from "mysql2/promise";
import { DbAdapter } from "./base.js";

const FREQUENCY_FORMATS = {
    daily: "%Y-%m-%d",
    monthly: "%Y-%m",
    yearly: "%Y",
};

export class MysqlAdapter extends DbAdapter {
    constructor(config = {}) {
        super(config);
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = mysql.createPool({
                uri: this.config.connectionUrl,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                // Support named parameters or handle manually? mysql2 supports '?' by default.
            });
            await this.migrate();
        }
    }

    async migrate() {
        const conn = await this.pool.getConnection();
        try {
            await conn.query(`
        CREATE TABLE IF NOT EXISTS workflow_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          project_path VARCHAR(255) DEFAULT '',
          task_description TEXT NOT NULL,
          task_type VARCHAR(50) NOT NULL,
          commit_message TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          forced TINYINT(1) DEFAULT 0,
          force_reason TEXT,
          dropped TINYINT(1) DEFAULT 0,
          drop_reason TEXT,
          UNIQUE KEY uniq_workflow_entry (user_id, project_path, timestamp, task_description(100))
        )
      `);

            await conn.query(`
        CREATE TABLE IF NOT EXISTS project_summary (
          user_id VARCHAR(255),
          project_path VARCHAR(255) DEFAULT '',
          total_tasks INT DEFAULT 0,
          task_types JSON,
          last_active DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          recent_tasks JSON,
          PRIMARY KEY (user_id, project_path)
        )
      `);

            await conn.query(`
        CREATE TABLE IF NOT EXISTS workflow_state (
          user_id VARCHAR(255),
          project_path VARCHAR(255) DEFAULT '',
          state_json JSON,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, project_path)
        )
      `);

            // Indexes are effectively covered by PRIMARY/UNIQUE keys, but we can add secondary if needed.
        } finally {
            conn.release();
        }
    }

    async insertHistoryEntry(userId, projectPath, entry) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        // MySQL INSERT ON DUPLICATE KEY UPDATE
        const query = `
      INSERT INTO workflow_history
      (user_id, project_path, task_description, task_type, commit_message, timestamp, forced, force_reason, dropped, drop_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        commit_message=VALUES(commit_message),
        forced=VALUES(forced),
        force_reason=VALUES(force_reason),
        dropped=VALUES(dropped),
        drop_reason=VALUES(drop_reason)
    `;

        await this.pool.execute(query, [
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
        ]);

        await this.updateSummaryForUser(userId, normalizedProjectPath);
    }

    async updateSummaryForUser(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const [rows] = await this.pool.execute(`
      SELECT task_type, timestamp, task_description
      FROM workflow_history
      WHERE user_id = ? AND project_path = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `, [userId, normalizedProjectPath]);

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
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_tasks=VALUES(total_tasks),
        task_types=VALUES(task_types),
        last_active=VALUES(last_active),
        recent_tasks=VALUES(recent_tasks),
        updated_at=VALUES(updated_at)
    `;

        await this.pool.execute(upsert, [
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

        const [rows] = await this.pool.execute(`
      SELECT * FROM project_summary WHERE user_id = ? AND project_path = ?
    `, [userId, normalizedProjectPath]);

        const row = rows[0];
        if (!row) return null;

        return {
            totalTasks: row.total_tasks,
            taskTypes: row.task_types, // MySQL driver typically parses JSON columns automatically
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

        if (startDate) {
            clauses.push("DATE(timestamp) >= DATE(?)");
            params.push(startDate);
        }
        if (endDate) {
            clauses.push("DATE(timestamp) <= DATE(?)");
            params.push(endDate);
        }

        const where = ["user_id = ?", "project_path = ?", ...clauses].join(" AND ");

        const [countRows] = await this.pool.execute(
            `SELECT COUNT(*) as total FROM workflow_history WHERE ${where}`,
            params
        );
        const total = countRows[0].total;

        const [entries] = await this.pool.execute(`
      SELECT *
      FROM workflow_history
      WHERE ${where}
      ORDER BY timestamp DESC
      LIMIT ?
      OFFSET ?
    `, [...params, sanitizedPageSize.toString(), offset.toString()]); // prepared statement params often stringified in strict mode, but execute handles numbers usually.

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

        const clauses = [];
        const params = [userId, normalizedProjectPath];
        if (startDate) {
            clauses.push("DATE(timestamp) >= DATE(?)");
            params.push(startDate);
        }
        if (endDate) {
            clauses.push("DATE(timestamp) <= DATE(?)");
            params.push(endDate);
        }

        const where = ["user_id = ?", "project_path = ?", ...clauses].join(" AND ");

        const [rows] = await this.pool.execute(`
      SELECT DATE_FORMAT(timestamp, '${format}') AS period, COUNT(*) AS count
      FROM workflow_history
      WHERE ${where}
      GROUP BY period
      ORDER BY period DESC
    `, params);

        return rows;
    }

    async saveState(userId, projectPath, state) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const query = `
      INSERT INTO workflow_state
      (user_id, project_path, state_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        state_json=VALUES(state_json),
        updated_at=VALUES(updated_at)
    `;

        await this.pool.execute(query, [
            userId,
            normalizedProjectPath,
            JSON.stringify(state),
            new Date().toISOString()
        ]);
    }

    async getState(userId, projectPath) {
        await this.connect();
        const normalizedProjectPath = projectPath || '';

        const [rows] = await this.pool.execute(`
      SELECT state_json FROM workflow_state WHERE user_id = ? AND project_path = ?
    `, [userId, normalizedProjectPath]);

        const row = rows[0];
        if (!row) return null;

        // mysql2 usually parses JSON columns, but if not:
        return typeof row.state_json === 'string' ? JSON.parse(row.state_json) : row.state_json;
    }
}

