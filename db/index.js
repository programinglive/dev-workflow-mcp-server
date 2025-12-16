import { SqliteAdapter } from "./adapters/sqlite.js";
import { MysqlAdapter } from "./adapters/mysql.js";
import { PostgresAdapter } from "./adapters/postgres.js";

let adapterInstance = null;

export async function getAdapter() {
  if (adapterInstance) {
    return adapterInstance;
  }

  const type = (process.env.DEV_WORKFLOW_DB_TYPE || "sqlite").toLowerCase();
  const config = {
    connectionUrl: process.env.DEV_WORKFLOW_DB_URL,
    dbPath: process.env.DEV_WORKFLOW_DB_PATH // optional override for sqlite
  };

  switch (type) {
    case "mysql":
      adapterInstance = new MysqlAdapter(config);
      break;
    case "postgres":
    case "postgresql":
      adapterInstance = new PostgresAdapter(config);
      break;
    case "sqlite":
    default:
      adapterInstance = new SqliteAdapter(config);
      break;
  }

  await adapterInstance.connect();
  return adapterInstance;
}

// Proxies for backward compatibility (though call sites need to handle Promises now)

export async function insertHistoryEntry(userId, projectPath, entry) {
  const db = await getAdapter();
  await db.insertHistoryEntry(userId, projectPath, entry);
}

export async function updateSummaryForUser(userId, projectPath) {
  const db = await getAdapter();
  await db.updateSummaryForUser(userId, projectPath);
}

export async function getSummaryForUser(userId, projectPath) {
  const db = await getAdapter();
  return await db.getSummaryForUser(userId, projectPath);
}

export async function getHistoryForUser(userId, projectPath, options) {
  const db = await getAdapter();
  return await db.getHistoryForUser(userId, projectPath, options);
}

export async function getHistorySummary(userId, projectPath, options) {
  const db = await getAdapter();
  return await db.getHistorySummary(userId, projectPath, options);
}
