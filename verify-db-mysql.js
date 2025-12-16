
import { MysqlAdapter } from "./db/adapters/mysql.js";
import { resolve } from "path";

const CONNECTION_URL = process.env.DEV_WORKFLOW_DB_URL;

if (!CONNECTION_URL) {
    console.error("❌ Error: DEV_WORKFLOW_DB_URL environment variable is required.");
    console.error("Usage: DEV_WORKFLOW_DB_URL='mysql://user:password@host:port/database' node verify-db-mysql.js");
    process.exit(1);
}

const TEST_USER = "test-verification-user";
const TEST_PROJECT = resolve(process.cwd());

async function runVerification() {
    console.log("🔍 Starting MySQL Verification...");
    console.log(`   User ID: ${TEST_USER}`);
    console.log(`   Project: ${TEST_PROJECT}`);
    console.log(`   URL:     ${CONNECTION_URL.replace(/:[^:@]+@/, ":****@")}`);

    const adapter = new MysqlAdapter({
        connectionUrl: CONNECTION_URL
    });

    try {
        // 1. Connect & Migrate
        console.log("\n1. Connecting and Migrating...");
        await adapter.connect();
        console.log("   ✅ Connected to MySQL");

        // 2. Clear previous test data (optional, but good for cleanliness)
        // We won't strictly clear to avoid wiping valid data if user reuses IDs, 
        // but the test user should be unique enough.

        // 3. Insert History
        console.log("\n3. Testing History Insertion...");
        const entry = {
            taskDescription: "Verification Task",
            taskType: "test",
            timestamp: new Date().toISOString(),
            commitMessage: "test commit"
        };
        await adapter.insertHistoryEntry(TEST_USER, TEST_PROJECT, entry);
        console.log("   ✅ Inserted history entry");

        // 4. Verify History Retrieval
        console.log("\n4. Verifying History Retrieval...");
        const history = await adapter.getHistoryForUser(TEST_USER, TEST_PROJECT, { pageSize: 1 });
        const savedEntry = history.entries[0];

        if (savedEntry && savedEntry.task_description === entry.taskDescription) {
            console.log("   ✅ Retrieved history entry matches");
        } else {
            console.error("   ❌ Retrieved entry mismatch:", savedEntry);
            process.exit(1);
        }

        // 5. Test State Persistence
        console.log("\n5. Testing State Persistence...");
        const state = {
            currentPhase: "verification",
            verified: true,
            random: Math.random()
        };
        await adapter.saveState(TEST_USER, TEST_PROJECT, state);
        console.log("   ✅ Saved state");

        // 6. Verify State Retrieval
        console.log("\n6. Verifying State Retrieval...");
        const retrievedState = await adapter.getState(TEST_USER, TEST_PROJECT);
        if (retrievedState && retrievedState.random === state.random) {
            console.log("   ✅ Retrieved state matches");
        } else {
            console.error("   ❌ Retrieved state mismatch:", retrievedState);
            process.exit(1);
        }

        console.log("\n🎉 MySQL Verification SUCCESS!");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Verification FAILED:", error);
        process.exit(1);
    } finally {
        if (adapter.pool) {
            await adapter.pool.end();
        }
    }
}

runVerification();
