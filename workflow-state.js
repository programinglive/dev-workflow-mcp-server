import fs from "fs/promises";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_DIR = ".state";
const STATE_FILENAME = "workflow-state.json";
const LEGACY_STATE_FILENAME = ".workflow-state.json";
const PROJECT_SUMMARY_FILENAME = "project-summary.json";
const USER_ID_FILENAME = "user-id";

let cachedUserId = null;
let cachedUserStateDir = null;

function generateUserId() {
  const timestamp = Date.now().toString(16);
  const randomSuffix = Math.random().toString(16).slice(2, 10);
  return `user-${timestamp}-${randomSuffix}`;
}

function resolveUserId(stateDir) {
  const envUserId = (process.env.DEV_WORKFLOW_USER_ID || "").trim();
  if (envUserId) {
    cachedUserId = envUserId;
    cachedUserStateDir = stateDir;
    return envUserId;
  }

  if (cachedUserId && cachedUserStateDir === stateDir) {
    return cachedUserId;
  }

  const userIdFile = path.join(stateDir, USER_ID_FILENAME);

  try {
    if (existsSync(userIdFile)) {
      const stored = readFileSync(userIdFile, "utf-8").trim();
      if (stored) {
        cachedUserId = stored;
        cachedUserStateDir = stateDir;
        return stored;
      }
    }
  } catch {
    // Ignore read errors; we'll generate a new ID below.
  }

  const usersDir = path.join(stateDir, "users");

  try {
    const entries = readdirSync(usersDir, { withFileTypes: true });
    const candidateDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    if (candidateDirs.length === 1) {
      const legacyId = candidateDirs[0];
      try {
        mkdirSync(stateDir, { recursive: true });
        writeFileSync(userIdFile, legacyId, "utf-8");
      } catch {
        // Persisting the legacy ID is best-effort.
      }
      cachedUserId = legacyId;
      cachedUserStateDir = stateDir;
      return legacyId;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      // Unexpected error accessing users directory – fall through to generate new ID.
    }
  }

  const legacyDefaultPath = path.join(usersDir, "default", STATE_FILENAME);
  if (existsSync(legacyDefaultPath)) {
    try {
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(userIdFile, "default", "utf-8");
    } catch {
      // Best-effort persistence; continue with in-memory fallback.
    }
    cachedUserId = "default";
    cachedUserStateDir = stateDir;
    return "default";
  }

  const generatedId = generateUserId();
  try {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(userIdFile, generatedId, "utf-8");
  } catch {
    // Ignore persistence errors; continue with in-memory ID.
  }

  cachedUserId = generatedId;
  cachedUserStateDir = stateDir;
  return generatedId;
}

function hasProjectMarkers(candidate) {
  if (!candidate) {
    return false;
  }

  const resolved = path.resolve(candidate);
  return (
    existsSync(path.join(resolved, "package.json")) || existsSync(path.join(resolved, ".git"))
  );
}

function selectProjectRoot(candidates) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const resolved = path.resolve(candidate);
    if (isRootPath(resolved) && !hasProjectMarkers(resolved)) {
      continue;
    }

    return resolved;
  }

  return null;
}

function getUserScopedDir(baseDir) {
  const userId = resolveUserId(baseDir);
  return path.join(baseDir, "users", userId);
}

function getCurrentUserId() {
  const envUserId = (process.env.DEV_WORKFLOW_USER_ID || "").trim();
  if (envUserId) {
    return envUserId;
  }

  if (cachedUserId) {
    return cachedUserId;
  }

  if (cachedUserStateDir) {
    return resolveUserId(cachedUserStateDir);
  }

  return "default";
}

async function migrateLegacyStateFile(targetPath) {
  const stateDir = path.dirname(targetPath);
  if (path.basename(stateDir) !== STATE_DIR) {
    return;
  }

  const projectRoot = path.dirname(stateDir);
  const legacyPath = path.join(projectRoot, LEGACY_STATE_FILENAME);

  if (legacyPath === targetPath) {
    return;
  }

  try {
    await fs.access(legacyPath);
  } catch {
    return;
  }

  await fs.mkdir(stateDir, { recursive: true });

  try {
    await fs.access(targetPath);
    await fs.unlink(legacyPath);
    return;
  } catch {
    // New state file doesn't exist yet; fall through to migrate.
  }

  await fs.rename(legacyPath, targetPath);
}

function isRootPath(candidate) {
  if (!candidate) {
    return true;
  }

  const resolved = path.resolve(candidate);
  return path.parse(resolved).root === resolved;
}

function findProjectRoot(startDir) {
  if (!startDir) {
    return null;
  }

  let current = path.resolve(startDir);
  const { root } = path.parse(current);

  while (true) {
    const hasPackageJson = existsSync(path.join(current, "package.json"));
    const hasGitDir = existsSync(path.join(current, ".git"));
    if (hasPackageJson || hasGitDir) {
      return current;
    }

    if (current === root) {
      return null;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function getCompatibilityPaths(primaryPath) {
  const resolvedPrimary = path.resolve(primaryPath);
  const candidates = new Set();
  const moduleDir = __dirname;

  const directCandidate = path.resolve(moduleDir, STATE_DIR, STATE_FILENAME);
  if (directCandidate !== resolvedPrimary) {
    candidates.add(directCandidate);
  }

  const possibleDistDirs = [
    path.join(moduleDir, "dist"),
    path.join(path.dirname(moduleDir), "dist"),
  ];

  for (const distDir of possibleDistDirs) {
    const candidate = path.resolve(distDir, STATE_DIR, STATE_FILENAME);
    if (candidate !== resolvedPrimary) {
      candidates.add(candidate);
    }
  }

  return Array.from(candidates);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureCompatibilityLinks(primaryPath) {
  const resolvedPrimary = path.resolve(primaryPath);

  if (!(await pathExists(resolvedPrimary))) {
    return;
  }

  const compatibilityPaths = getCompatibilityPaths(resolvedPrimary);

  for (const compatPath of compatibilityPaths) {
    try {
      await fs.mkdir(path.dirname(compatPath), { recursive: true });
    } catch {
      // Ignore directory creation errors; we'll surface them on actual writes.
    }

    try {
      const compatStat = await fs.lstat(compatPath);
      if (compatStat.isSymbolicLink()) {
        const target = await fs.readlink(compatPath);
        if (path.resolve(path.dirname(compatPath), target) === resolvedPrimary) {
          continue;
        }
        await fs.unlink(compatPath);
      } else if (compatStat.isFile()) {
        const [primaryStat, existingStat] = await Promise.all([
          fs.stat(resolvedPrimary),
          fs.stat(compatPath),
        ]);
        if (primaryStat.dev === existingStat.dev && primaryStat.ino === existingStat.ino) {
          continue;
        }
        await fs.unlink(compatPath);
      } else {
        await fs.unlink(compatPath);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        // Unexpected error accessing legacy path; skip mirroring to avoid breaking primary file.
        continue;
      }
    }

    try {
      await fs.link(resolvedPrimary, compatPath);
      continue;
    } catch (error) {
      if (!["EEXIST", "EXDEV", "EPERM"].includes(error.code)) {
        continue;
      }
      if (error.code === "EEXIST") {
        continue;
      }
    }

    try {
      await fs.symlink(resolvedPrimary, compatPath);
      continue;
    } catch (error) {
      if (error.code === "EEXIST") {
        continue;
      }
      if (!["EPERM", "ENOTSUP", "EEXIST"].includes(error.code)) {
        // If symlink fails for another reason, skip to avoid interfering with primary file.
        continue;
      }
    }

    try {
      await fs.copyFile(resolvedPrimary, compatPath);
    } catch {
      // Final fallback failed; ignore to avoid disrupting primary save.
    }
  }
}

export function resolveStateFile() {
  const customPath = process.env.DEV_WORKFLOW_STATE_FILE;
  if (customPath) {
    return path.resolve(customPath);
  }

  const initCwd = process.env.INIT_CWD || process.cwd();
  const resolvedInitCwd = path.resolve(initCwd);
  const moduleRoot = path.resolve(__dirname, "..");
  const cwdResolved = path.resolve(process.cwd());

  const candidateRoots = [];

  const initProjectRoot = findProjectRoot(resolvedInitCwd);
  if (initProjectRoot) {
    candidateRoots.push(initProjectRoot);
  }

  const moduleProjectRoot = findProjectRoot(moduleRoot);
  if (moduleProjectRoot) {
    candidateRoots.push(moduleProjectRoot);
  } else if (!isRootPath(moduleRoot)) {
    candidateRoots.push(moduleRoot);
  }

  const cwdProjectRoot = findProjectRoot(cwdResolved);
  if (cwdProjectRoot) {
    candidateRoots.push(cwdProjectRoot);
  } else if (!isRootPath(cwdResolved)) {
    candidateRoots.push(cwdResolved);
  }

  if (!isRootPath(resolvedInitCwd)) {
    candidateRoots.push(resolvedInitCwd);
  }

  if (!isRootPath(__dirname)) {
    candidateRoots.push(__dirname);
  }

  let projectRoot = selectProjectRoot(candidateRoots);

  if (!projectRoot) {
    projectRoot = path.resolve(__dirname);
  }

  const stateDir = path.join(projectRoot, STATE_DIR);
  const userDir = getUserScopedDir(stateDir);
  return path.join(userDir, STATE_FILENAME);
}

export class WorkflowState {
  constructor(stateFilePath = resolveStateFile()) {
    this.stateFile = stateFilePath;
    this.state = {
      currentPhase: "idle",
      taskDescription: "",
      bugFixed: false,
      testsCreated: false,
      testsPassed: false,
      testsSkipped: false,
      testsSkippedReason: "",
      documentationCreated: false,
      readyToCommit: false,
      readyCheckCompleted: false,
      released: false,
      releaseCommand: "",
      releaseNotes: "",
      commitAndPushCompleted: false,
      lastCommitMessage: "",
      lastPushBranch: "",
      history: [],
      taskType: "",
    };
  }

  async load() {
    await migrateLegacyStateFile(this.stateFile);
    try {
      const data = await fs.readFile(this.stateFile, "utf-8");
      const parsed = JSON.parse(data);
      this.state = {
        ...this.state,
        ...parsed,
      };
      // Ensure compatibility mirrors exist whenever the primary file is present
      await ensureCompatibilityLinks(this.stateFile);
      if (typeof this.state.testsCreated !== "boolean") {
        this.state.testsCreated = false;
      }
      if (typeof this.state.testsSkipped !== "boolean") {
        this.state.testsSkipped = false;
      }
      if (typeof this.state.testsSkippedReason !== "string") {
        this.state.testsSkippedReason = "";
      }
      if (typeof this.state.readyCheckCompleted !== "boolean") {
        this.state.readyCheckCompleted = false;
      }
      if (typeof this.state.released !== "boolean") {
        this.state.released = false;
      }
      if (typeof this.state.commitAndPushCompleted !== "boolean") {
        this.state.commitAndPushCompleted = false;
      }
      if (typeof this.state.releaseCommand !== "string") {
        this.state.releaseCommand = "";
      }
      if (typeof this.state.releaseNotes !== "string") {
        this.state.releaseNotes = "";
      }
      if (typeof this.state.lastCommitMessage !== "string") {
        this.state.lastCommitMessage = "";
      }
      if (typeof this.state.lastPushBranch !== "string") {
        this.state.lastPushBranch = "";
      }
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
      // Missing file is fine; bootstrap fresh artifacts for downstream consumers.
      await this.ensurePrimaryFile();
    }
  }

  async ensurePrimaryFile() {
    let created = false;
    try {
      await fs.access(this.stateFile);
    } catch {
      await fs.mkdir(path.dirname(this.stateFile), { recursive: true });
      await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
      created = true;
    }

    // Always ensure a fresh project summary so dependent tooling can read it immediately.
    await this.updateProjectSummary();
    await ensureCompatibilityLinks(this.stateFile);

    return created;
  }

  async save() {
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    await ensureCompatibilityLinks(this.stateFile);
    await this.updateProjectSummary();
    await this.syncToDatabase();
  }

  async updateProjectSummary() {
    const summaryPath = path.join(path.dirname(this.stateFile), PROJECT_SUMMARY_FILENAME);
    const summary = this.generateProjectSummaryData();
    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  async syncToDatabase() {
    try {
      const { insertHistoryEntry, updateSummaryForUser } = await import("./db/index.js");
      const userId = getCurrentUserId();
      for (const entry of this.state.history || []) {
        insertHistoryEntry(userId, entry);
      }
      updateSummaryForUser(userId);
    } catch {
      // SQLite not available; skip sync
    }
  }

  generateProjectSummaryData() {
    const history = this.state.history || [];
    if (!history || history.length === 0) {
      return {
        totalTasks: 0,
        taskTypes: {},
        lastActive: null,
        recentTasks: [],
        updatedAt: new Date().toISOString(),
      };
    }

    const taskTypes = {};
    const recentTasks = history.slice(-20);

    for (const entry of recentTasks) {
      const type = entry.taskType || "other";
      taskTypes[type] = (taskTypes[type] || 0) + 1;
    }

    const totalTasks = history.length;
    const lastTask = history[history.length - 1];
    const lastActive = lastTask ? lastTask.timestamp : null;

    return {
      totalTasks,
      taskTypes,
      lastActive,
      recentTasks: history.slice(-5).reverse().map((e) => ({
        description: e.taskDescription,
        type: e.taskType,
        timestamp: e.timestamp,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  reset() {
    this.state = {
      currentPhase: "idle",
      taskDescription: "",
      bugFixed: false,
      testsCreated: false,
      testsPassed: false,
      testsSkipped: false,
      testsSkippedReason: "",
      documentationCreated: false,
      readyToCommit: false,
      readyCheckCompleted: false,
      released: false,
      releaseCommand: "",
      releaseNotes: "",
      commitAndPushCompleted: false,
      lastCommitMessage: "",
      lastPushBranch: "",
      history: this.state.history,
    };
  }

  addToHistory(entry) {
    this.state.history.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }
}
