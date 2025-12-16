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

function normalizeAndStoreCandidate(list, candidate) {
  if (!candidate) {
    return;
  }

  const resolved = path.resolve(candidate);
  if (!list.includes(resolved)) {
    list.push(resolved);
  }
}

function addAncestorCandidates(list, start) {
  if (!start) {
    return;
  }

  let current = path.resolve(start);
  while (!isRootPath(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    if (!isRootPath(parent)) {
      normalizeAndStoreCandidate(list, parent);
    }
    current = parent;
  }
}

function selectProjectRoot(candidates, moduleRoot) {
  const cwdResolved = path.resolve(process.cwd());
  const prioritized = [];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const resolved = path.resolve(candidate);
    if (prioritized.some((entry) => entry.resolved === resolved)) {
      continue;
    }

    prioritized.push({
      resolved,
      hasMarkers: hasProjectMarkers(resolved),
      isRoot: isRootPath(resolved),
      isCwdAncestor: cwdResolved === resolved || cwdResolved.startsWith(`${resolved}${path.sep}`),
    });
  }

  const ancestorWithMarkers = prioritized.find((entry) => entry.isCwdAncestor && entry.hasMarkers);
  if (ancestorWithMarkers) {
    return ancestorWithMarkers.resolved;
  }

  const ancestorWithoutMarkers = prioritized
    .filter((entry) => entry.isCwdAncestor && !entry.hasMarkers && !entry.isRoot)
    .sort((a, b) => b.resolved.length - a.resolved.length);
  if (ancestorWithoutMarkers.length > 0) {
    return ancestorWithoutMarkers[0].resolved;
  }

  if (moduleRoot) {
    const moduleResolved = path.resolve(moduleRoot);
    const moduleEntry = prioritized.find((entry) => entry.resolved === moduleResolved && !entry.isRoot);
    if (moduleEntry) {
      return moduleEntry.resolved;
    }
  }

  const withMarkers = prioritized.find((entry) => entry.hasMarkers);
  if (withMarkers) {
    return withMarkers.resolved;
  }

  const nonRoot = prioritized.find((entry) => !entry.isRoot);
  if (nonRoot) {
    return nonRoot.resolved;
  }

  return prioritized.length > 0 ? prioritized[0].resolved : null;
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

  const moduleRoot = path.resolve(__dirname, "..");
  const cwdResolved = path.resolve(process.cwd());
  const initCwd = process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD) : null;

  // 1. Prefer the project rooted at the current working directory
  let projectRoot = findProjectRoot(cwdResolved);

  // 2. Fall back to the project rooted at INIT_CWD if different
  if (!projectRoot && initCwd) {
    projectRoot = findProjectRoot(initCwd);
  }

  // 3. Fall back to the project containing this module
  if (!projectRoot) {
    projectRoot = findProjectRoot(moduleRoot);
  }

  // 4. Final fallback: use a non-root working directory or the module root
  if (!projectRoot) {
    projectRoot = !isRootPath(cwdResolved) ? cwdResolved : moduleRoot;
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
      // Use the project directory (parent of .state) as the project identifier
      // this.stateFile is .../.state/users/<user>/workflow-state.json
      // so we want resolution logic. For now, let's use the absolute path to the project root.
      // We can derive it from stateFile path logic in resolveStateFile or just use the directory we are in.
      // A safe bet that is unique per project on this machine is the project root found by resolveStateFile.
      // Let's perform a simple resolution:

      const stateDir = path.dirname(path.dirname(path.dirname(this.stateFile)));
      // stateFile = <root>/.state/users/<user>/workflow-state.json
      // dirname = <root>/.state/users/<user>
      // dirname = <root>/.state/users
      // dirname = <root>/.state
      // dirname = <root>

      // Wait, let's look at the path structure from resolveStateFile:
      // path.join(userDir, STATE_FILENAME); where userDir is path.join(stateDir, "users", userId);
      // and stateDir is path.join(projectRoot, STATE_DIR);
      // So: projectRoot/.state/users/userId/workflow-state.json
      // 1. dirname -> .../userId
      // 2. dirname -> .../users
      // 3. dirname -> .../.state
      // 4. dirname -> .../projectRoot

      const projectRoot = path.dirname(path.dirname(path.dirname(path.dirname(this.stateFile))));

      for (const entry of this.state.history || []) {
        await insertHistoryEntry(userId, projectRoot, entry);
      }
      await updateSummaryForUser(userId, projectRoot);
    } catch (error) {
      // Database sync failed; log it but don't crash
      console.error("Database sync failed:", error.message);
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
