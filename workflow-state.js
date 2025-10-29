import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_DIR = ".state";
const STATE_FILENAME = "workflow-state.json";
const LEGACY_STATE_FILENAME = ".workflow-state.json";

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

function resolveDefaultStateFile() {
  if (process.env.DEV_WORKFLOW_STATE_FILE) {
    return path.resolve(process.env.DEV_WORKFLOW_STATE_FILE);
  }

  const cwd = process.cwd();
  if (!cwd.includes(`node_modules${path.sep}`) && !isRootPath(cwd)) {
    return path.join(cwd, STATE_DIR, STATE_FILENAME);
  }

  if (process.env.INIT_CWD && !isRootPath(process.env.INIT_CWD)) {
    return path.join(process.env.INIT_CWD, STATE_DIR, STATE_FILENAME);
  }

  const [beforeNodeModules] = cwd.split(`node_modules${path.sep}`);
  if (beforeNodeModules && !isRootPath(beforeNodeModules)) {
    return path.join(beforeNodeModules, STATE_DIR, STATE_FILENAME);
  }

  return path.join(__dirname, STATE_DIR, STATE_FILENAME);
}

export class WorkflowState {
  constructor(stateFilePath = resolveDefaultStateFile()) {
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
      // File doesn't exist yet, use default state
    }
  }

  async save() {
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
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
