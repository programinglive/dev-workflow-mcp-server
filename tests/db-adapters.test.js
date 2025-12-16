import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

import { SqliteAdapter } from "../db/adapters/sqlite.js";
import { MysqlAdapter } from "../db/adapters/mysql.js";
import { PostgresAdapter } from "../db/adapters/postgres.js";


// Helper to run common adapter tests
async function runGenericAdapterTests(t, adapter, testUserId, testProject) {
    await t.test("connects and migrates", async () => {
        await adapter.connect();
        // No error means success
    });

    await t.test("inserts and retrieves history", async () => {
        const entry = {
            taskDescription: "Test Task",
            taskType: "feature",
            commitMessage: "feat: test",
            timestamp: new Date().toISOString(),
        };
        await adapter.insertHistoryEntry(testUserId, testProject, entry);

        const history = await adapter.getHistoryForUser(testUserId, testProject, { pageSize: 1 });
        assert.equal(history.entries.length, 1);
        assert.equal(history.entries[0].task_description, "Test Task");
    });

    await t.test("saves and retrieves state", async () => {
        const state = { phase: "testing", count: 123 };
        await adapter.saveState(testUserId, testProject, state);
        const retrieved = await adapter.getState(testUserId, testProject);
        assert.deepEqual(retrieved, state);
    });

    await t.test("history summary aggregation", async () => {
        // already inserted one entry
        const summary = await adapter.getHistorySummary(testUserId, testProject, { frequency: 'daily' });
        assert.ok(summary.length > 0);
    });

    await t.test("project summary update", async () => {
        const summary = await adapter.getSummaryForUser(testUserId, testProject);
        assert.ok(summary);
        assert.ok(summary.totalTasks >= 1);
    });
}

test("Database Adapters", async (t) => {
    // 1. SQLite (Always Test)
    await t.test("SqliteAdapter", async (t) => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sqlite-test-"));
        const dbPath = path.join(tmpDir, "test.db");

        // Convert to file URI for connection string if needed, or just pass path
        // The adapter expects a connection URL for SQLite usually: file:///path/to/db or just path?
        // Looking at sqlite.js: uri: this.config.connectionUrl.replace("sqlite://", "")
        // So we invoke it with sqlite://<path>
        const connectionUrl = `sqlite://${dbPath}`;

        const adapter = new SqliteAdapter({ connectionUrl });

        try {
            await runGenericAdapterTests(t, adapter, "user-sqlite", tmpDir);
        } finally {
            if (adapter.db) adapter.db.close();
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    });

    // 2. MySQL (Conditional)
    // Check specific test variable OR generic one if it maps to mysql
    const mysqlUrl = process.env.TEST_MYSQL_URL ||
        (process.env.DEV_WORKFLOW_DB_URL && process.env.DEV_WORKFLOW_DB_URL.startsWith("mysql") ? process.env.DEV_WORKFLOW_DB_URL : null);

    await t.test("MysqlAdapter", { skip: !mysqlUrl }, async (t) => {
        const adapter = new MysqlAdapter({ connectionUrl: mysqlUrl });
        try {
            // We use a random user ID to avoid clashing with verification script data
            // although verification cleaned up mostly.
            const testId = `test-mysql-${Date.now()}`;
            const testProj = process.cwd();
            await runGenericAdapterTests(t, adapter, testId, testProj);
        } finally {
            if (adapter.pool) await adapter.pool.end();
        }
    });

    // 3. PostgreSQL (Conditional)
    const pgUrl = process.env.TEST_POSTGRES_URL ||
        (process.env.DEV_WORKFLOW_DB_URL && process.env.DEV_WORKFLOW_DB_URL.startsWith("postgres") ? process.env.DEV_WORKFLOW_DB_URL : null);

    await t.test("PostgresAdapter", { skip: !pgUrl }, async (t) => {
        const adapter = new PostgresAdapter({ connectionUrl: pgUrl });
        try {
            const testId = `test-pg-${Date.now()}`;
            const testProj = process.cwd();
            await runGenericAdapterTests(t, adapter, testId, testProj);
        } finally {
            if (adapter.pool) await adapter.pool.end();
        }
    });
});
