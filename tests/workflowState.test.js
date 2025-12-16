import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
  mkdir,
  realpath,
  readFile,
  writeFile,
  access,
  copyFile,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Isolate these tests from the real database configuration
delete process.env.DEV_WORKFLOW_DB_TYPE;
delete process.env.DEV_WORKFLOW_DB_URL;
delete process.env.TEST_MYSQL_URL;
delete process.env.TEST_POSTGRES_URL;

import {
  WorkflowState,
  getNextStep,
  containsTestFilesInStatus,
  createCommitMessageParts,
  determineReleaseTypeFromCommit,
  workingTreeSummary,
} from "../index.js";

async function withWorkflowState(callback) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "workflow-state-"));
  const stateFile = path.join(tempDir, "state.json");
  const state = new WorkflowState(stateFile);
  await state.load();

  try {
    await callback(state);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("resolveStateFile prefers current working directory when multiple project markers exist", async () => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "workflow-prefers-cwd-"));
  const moduleDir = path.join(tempRoot, "module");
  const projectA = path.join(tempRoot, "project-a");
  const projectB = path.join(tempRoot, "project-b");
  const projectBNested = path.join(projectB, "sub", "app");

  await mkdir(moduleDir, { recursive: true });
  await mkdir(projectA, { recursive: true });
  await mkdir(projectBNested, { recursive: true });

  const sourceModulePath = fileURLToPath(new URL("../workflow-state.js", import.meta.url));
  await copyFile(sourceModulePath, path.join(moduleDir, "workflow-state.js"));

  await writeFile(path.join(moduleDir, "package.json"), JSON.stringify({ name: "module", type: "module" }));
  await mkdir(path.join(moduleDir, "db"), { recursive: true });
  await writeFile(path.join(moduleDir, "db", "index.js"), 'export function getDbAdapter() { return { connect: async () => {}, saveState: async () => {}, getState: async () => null }; } export async function insertHistoryEntry() {} export async function updateSummaryForUser() {} export async function saveState() {} export async function getState() {} export async function getSummaryForUser() { return { totalTasks: 0, taskTypes: {} }; } export async function getHistoryForUser() { return { entries: [], total: 0 }; }');
  await writeFile(path.join(projectA, "package.json"), JSON.stringify({ name: "project-a" }));
  await writeFile(path.join(projectB, "package.json"), JSON.stringify({ name: "project-b" }));

  const moduleUrl = pathToFileURL(path.join(moduleDir, "workflow-state.js"));
  const { WorkflowState: TempWorkflowState } = await import(`${moduleUrl.href}?preferCwd=${Date.now()}`);

  const originalCwd = process.cwd();
  const initWasSet = Object.prototype.hasOwnProperty.call(process.env, "INIT_CWD");
  const originalInitCwd = process.env.INIT_CWD;

  try {
    process.chdir(projectBNested);
    process.env.INIT_CWD = projectA;

    const state = new TempWorkflowState();
    const resolvedStateFile = state.stateFile;
    const resolvedProjectA = await realpath(projectA);
    const resolvedProjectB = await realpath(projectB);

    assert.ok(
      resolvedStateFile.startsWith(path.join(resolvedProjectB, ".state", "users")),
      "State file should resolve under the current working directory's project"
    );

    assert.ok(
      !resolvedStateFile.startsWith(path.join(resolvedProjectA, ".state")),
      "State file should not use INIT_CWD project when cwd has its own markers"
    );
  } finally {
    process.chdir(originalCwd);
    if (initWasSet) {
      process.env.INIT_CWD = originalInitCwd;
    } else {
      delete process.env.INIT_CWD;
    }
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("WorkflowState mirrors state file to compatibility locations", async () => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "workflow-compat-"));
  const moduleDir = path.join(tempRoot, "module");
  const projectRoot = path.join(tempRoot, "project");
  const stateDir = path.join(projectRoot, ".state");
  const sourceModulePath = fileURLToPath(new URL("../workflow-state.js", import.meta.url));
  await mkdir(moduleDir, { recursive: true });
  await mkdir(path.join(moduleDir, "dist"), { recursive: true });
  await mkdir(path.join(tempRoot, "dist"), { recursive: true });
  await mkdir(stateDir, { recursive: true });
  await copyFile(sourceModulePath, path.join(moduleDir, "workflow-state.js"));
  await writeFile(path.join(moduleDir, "package.json"), JSON.stringify({ name: "module", type: "module" }));
  await mkdir(path.join(moduleDir, "db"), { recursive: true });
  await writeFile(path.join(moduleDir, "db", "index.js"), 'export function getDbAdapter() { return { connect: async () => {}, saveState: async () => {}, getState: async () => null }; } export async function insertHistoryEntry() {} export async function updateSummaryForUser() {} export async function saveState() {} export async function getState() {} export async function getSummaryForUser() { return { totalTasks: 0, taskTypes: {} }; } export async function getHistoryForUser() { return { entries: [], total: 0 }; }');
  await writeFile(path.join(projectRoot, "package.json"), JSON.stringify({ name: "temp" }));

  const stateFile = path.join(stateDir, "workflow-state.json");
  await writeFile(stateFile, JSON.stringify({ currentPhase: "testing" }, null, 2));

  const moduleUrl = pathToFileURL(path.join(moduleDir, "workflow-state.js"));
  const { WorkflowState: TempWorkflowState } = await import(moduleUrl.href);

  const state = new TempWorkflowState(stateFile);
  await state.load();
  state.state.currentPhase = "commit";
  await state.save();

  // Ensure primary state file was written correctly
  const primaryContent = await readFile(stateFile, "utf-8");
  const primaryParsed = JSON.parse(primaryContent);
  assert.equal(primaryParsed.currentPhase, "commit", "primary state file should be updated");

  await rm(tempRoot, { recursive: true, force: true });
});

test("WorkflowState avoids filesystem root when no project markers found", async () => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "workflow-rootless-"));
  const moduleDir = path.join(tempRoot, "module");
  await mkdir(moduleDir, { recursive: true });

  const sourceModulePath = fileURLToPath(new URL("../workflow-state.js", import.meta.url));
  await copyFile(sourceModulePath, path.join(moduleDir, "workflow-state.js"));
  await writeFile(path.join(moduleDir, "package.json"), JSON.stringify({ name: "module", type: "module" }));
  await mkdir(path.join(moduleDir, "db"), { recursive: true });
  await writeFile(path.join(moduleDir, "db", "index.js"), 'export function getDbAdapter() { return { connect: async () => {}, saveState: async () => {}, getState: async () => null }; } export async function insertHistoryEntry() {} export async function updateSummaryForUser() {} export async function saveState() {} export async function getState() {} export async function getSummaryForUser() { return { totalTasks: 0, taskTypes: {} }; } export async function getHistoryForUser() { return { entries: [], total: 0 }; }');

  const moduleUrl = pathToFileURL(path.join(moduleDir, "workflow-state.js"));
  const { WorkflowState: TempWorkflowState } = await import(moduleUrl.href);

  const originalCwd = process.cwd();
  const initWasSet = Object.prototype.hasOwnProperty.call(process.env, "INIT_CWD");
  const originalInitCwd = process.env.INIT_CWD;

  try {
    const cwdWithoutMarkers = path.join(tempRoot, "random", "deep");
    await mkdir(cwdWithoutMarkers, { recursive: true });

    process.chdir(cwdWithoutMarkers);
    process.env.INIT_CWD = cwdWithoutMarkers;

    const state = new TempWorkflowState();
    const resolvedTempRoot = await realpath(tempRoot);

    assert.ok(
      state.stateFile.startsWith(resolvedTempRoot),
      "state file should remain inside the temporary root when no project markers exist"
    );
    assert.ok(
      !state.stateFile.startsWith(path.join(path.sep, ".state")),
      "state file should not resolve to filesystem root"
    );
  } finally {
    process.chdir(originalCwd);
    if (initWasSet) {
      process.env.INIT_CWD = originalInitCwd;
    } else {
      delete process.env.INIT_CWD;
    }

    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolveUserId persists generated ID", async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), "workflow-userid-"));
  await writeFile(path.join(projectRoot, "package.json"), JSON.stringify({ name: "temp" }));

  const originalCwd = process.cwd();
  const initWasSet = Object.prototype.hasOwnProperty.call(process.env, "INIT_CWD");
  const originalInitCwd = process.env.INIT_CWD;
  const userEnvWasSet = Object.prototype.hasOwnProperty.call(process.env, "DEV_WORKFLOW_USER_ID");
  const originalUserEnv = process.env.DEV_WORKFLOW_USER_ID;

  try {
    process.chdir(projectRoot);
    process.env.INIT_CWD = projectRoot;
    if (userEnvWasSet) {
      delete process.env.DEV_WORKFLOW_USER_ID;
    }

    const firstModuleHref = new URL("../workflow-state.js?resolveUserId1", import.meta.url).href;
    const { WorkflowState: FirstWorkflowState } = await import(firstModuleHref);

    const state = new FirstWorkflowState();
    await state.ensurePrimaryFile();

    const userDir = path.dirname(state.stateFile);
    const userId = path.basename(userDir);
    assert.ok(userId.startsWith("user-"), "Generated user ID should use user- prefix");

    const userIdFile = path.join(projectRoot, ".state", "user-id");
    const persistedId = (await readFile(userIdFile, "utf-8")).trim();
    assert.equal(persistedId, userId, "user-id file should match generated user ID");

    const secondModuleHref = new URL("../workflow-state.js?resolveUserId2", import.meta.url).href;
    const { WorkflowState: SecondWorkflowState } = await import(secondModuleHref);

    const reloadedState = new SecondWorkflowState();
    await reloadedState.ensurePrimaryFile();

    assert.equal(reloadedState.stateFile, state.stateFile, "State file path should persist across reloads");
    const reloadedUserId = path.basename(path.dirname(reloadedState.stateFile));
    assert.equal(reloadedUserId, userId, "Reloaded module should reuse persisted user ID");
  } finally {
    process.chdir(originalCwd);
    if (initWasSet) {
      process.env.INIT_CWD = originalInitCwd;
    } else {
      delete process.env.INIT_CWD;
    }
    if (userEnvWasSet) {
      process.env.DEV_WORKFLOW_USER_ID = originalUserEnv;
    } else {
      delete process.env.DEV_WORKFLOW_USER_ID;
    }
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("WorkflowState generates project summary on load and updates on save", async () => {
  await withWorkflowState(async (state) => {
    const summaryPath = path.join(path.dirname(state.stateFile), "project-summary.json");

    const initialSummary = JSON.parse(await readFile(summaryPath, "utf-8"));
    assert.equal(initialSummary.totalTasks, 0);
    assert.deepEqual(initialSummary.taskTypes, {});

    state.addToHistory({
      taskDescription: "Seed summary",
      taskType: "feature",
      commitMessage: "feat: seed",
    });
    await state.save();

    const updatedSummary = JSON.parse(await readFile(summaryPath, "utf-8"));
    assert.equal(updatedSummary.totalTasks, 1);
    assert.equal(updatedSummary.taskTypes.feature, 1);
    assert.equal(updatedSummary.recentTasks[0].description, "Seed summary");
  });
});

test("WorkflowState persists data across save/load", async () => {
  await withWorkflowState(async (state) => {
    state.state.currentPhase = "testing";
    state.state.taskDescription = "Test persistence";
    state.state.bugFixed = true;
    state.state.testsCreated = true;
    state.state.readyCheckCompleted = true;
    state.state.released = true;
    state.state.releaseCommand = "npm run release";
    state.state.releaseNotes = "Automated release";
    state.state.commitAndPushCompleted = true;
    state.state.lastCommitMessage = "test: persistence";
    state.state.lastPushBranch = "main";
    state.state.testsSkipped = true;
    state.state.testsSkippedReason = "Legacy app uses manual QA";
    await state.save();

    const reloaded = new WorkflowState(state.stateFile);
    await reloaded.load();

    assert.equal(reloaded.state.currentPhase, "testing");
    assert.equal(reloaded.state.taskDescription, "Test persistence");
    assert.equal(reloaded.state.bugFixed, true);
    assert.equal(reloaded.state.testsCreated, true);
    assert.equal(reloaded.state.readyCheckCompleted, true);
    assert.equal(reloaded.state.released, true);
    assert.equal(reloaded.state.releaseCommand, "npm run release");
    assert.equal(reloaded.state.releaseNotes, "Automated release");
    assert.equal(reloaded.state.commitAndPushCompleted, true);
    assert.equal(reloaded.state.lastCommitMessage, "test: persistence");
    assert.equal(reloaded.state.lastPushBranch, "main");
    assert.equal(reloaded.state.testsSkipped, true);
    assert.equal(
      reloaded.state.testsSkippedReason,
      "Legacy app uses manual QA"
    );
  });
});

test("WorkflowState resolves state file relative to project root", async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), "workflow-project-"));
  const originalCwd = process.cwd();
  const initWasSet = Object.prototype.hasOwnProperty.call(process.env, "INIT_CWD");
  const originalInitCwd = process.env.INIT_CWD;
  const devStateWasSet = Object.prototype.hasOwnProperty.call(
    process.env,
    "DEV_WORKFLOW_STATE_FILE"
  );
  const originalDevState = process.env.DEV_WORKFLOW_STATE_FILE;

  try {
    await mkdir(path.join(projectRoot, ".git"));
    const nestedDir = path.join(projectRoot, "dist", "server");
    await mkdir(nestedDir, { recursive: true });

    process.chdir(projectRoot);
    process.env.INIT_CWD = projectRoot;
    if (devStateWasSet) {
      delete process.env.DEV_WORKFLOW_STATE_FILE;
    }
    const resolvedProjectRoot = await realpath(projectRoot);

    const state = new WorkflowState();
    assert.ok(
      state.stateFile.startsWith(path.join(resolvedProjectRoot, ".state", "users")),
      "state file should resolve under project .state/users directory"
    );

    process.chdir(nestedDir);
    delete process.env.INIT_CWD;
    delete process.env.DEV_WORKFLOW_STATE_FILE;

    const state2 = new WorkflowState();
    assert.ok(
      state2.stateFile.startsWith(path.join(resolvedProjectRoot, ".state", "users")),
      "state file should resolve to project root"
    );
  } finally {
    process.chdir(originalCwd);
    if (initWasSet) {
      process.env.INIT_CWD = originalInitCwd;
    } else {
      delete process.env.INIT_CWD;
    }
    if (devStateWasSet) {
      process.env.DEV_WORKFLOW_STATE_FILE = originalDevState;
    } else {
      delete process.env.DEV_WORKFLOW_STATE_FILE;
    }
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("WorkflowState reset keeps history but clears progress", async () => {
  await withWorkflowState(async (state) => {
    state.state.currentPhase = "ready";
    state.state.testsCreated = true;
    state.state.testsPassed = true;
    state.state.documentationCreated = true;
    state.state.readyCheckCompleted = true;
    state.state.released = true;
    state.state.commitAndPushCompleted = true;
    state.state.testsSkipped = true;
    state.state.testsSkippedReason = "Manual QA";
    state.addToHistory({ taskDescription: "Sample task" });

    state.reset();

    assert.equal(state.state.currentPhase, "idle");
    assert.equal(state.state.testsCreated, false);
    assert.equal(state.state.testsPassed, false);
    assert.equal(state.state.documentationCreated, false);
    assert.equal(state.state.readyCheckCompleted, false);
    assert.equal(state.state.released, false);
    assert.equal(state.state.commitAndPushCompleted, false);
    assert.equal(state.state.testsSkipped, false);
    assert.equal(state.state.testsSkippedReason, "");
    assert.equal(state.state.history.length, 1);
    assert.equal(state.state.history[0].taskDescription, "Sample task");
  });
});

test("getNextStep treats skipped tests as satisfied", () => {
  const skippedState = {
    bugFixed: true,
    testsCreated: true,
    testsPassed: true,
    testsSkipped: true,
    testsSkippedReason: "Legacy system",
    documentationCreated: false,
    readyCheckCompleted: false,
    commitAndPushCompleted: false,
    released: false,
  };

  assert.equal(getNextStep(skippedState), "Create documentation");
});

test("getNextStep guides workflow progression", () => {
  const baseState = {
    bugFixed: false,
    testsCreated: false,
    testsPassed: false,
    documentationCreated: false,
    readyCheckCompleted: false,
    commitAndPushCompleted: false,
    released: false,
  };

  assert.equal(
    getNextStep(baseState),
    "Mark feature/bug as fixed"
  );

  const afterFix = { ...baseState, bugFixed: true };
  assert.equal(
    getNextStep(afterFix),
    "Create tests"
  );

  const afterTestsCreated = { ...afterFix, testsCreated: true };
  assert.equal(getNextStep(afterTestsCreated), "Run tests");

  const afterTests = { ...afterTestsCreated, testsPassed: true };
  assert.equal(
    getNextStep(afterTests),
    "Create documentation"
  );

  const afterDocs = { ...afterTests, documentationCreated: true };
  assert.equal(getNextStep(afterDocs), "Run 'check_ready_to_commit'");

  const afterReadyCheck = { ...afterDocs, readyCheckCompleted: true };
  assert.equal(getNextStep(afterReadyCheck), "Run 'commit_and_push'");

  const afterCommit = { ...afterReadyCheck, commitAndPushCompleted: true };
  assert.equal(getNextStep(afterCommit), "Run 'perform_release'");

  const afterRelease = { ...afterCommit, released: true };
  assert.equal(getNextStep(afterRelease), "Complete the task");
});

test("containsTestFilesInStatus detects modified test files", () => {
  const statusOutput = [
    " M src/app.test.js",
    "A  tests/helpers/util.js",
    "R  src/old.js -> src/new.spec.ts",
  ].join("\n");

  assert.equal(containsTestFilesInStatus(statusOutput), true);
});

test("containsTestFilesInStatus returns false when no test files present", () => {
  const statusOutput = [
    " M src/app.js",
    "A  docs/README.md",
    "?? assets/logo.png",
  ].join("\n");

  assert.equal(containsTestFilesInStatus(statusOutput), false);
});

test("createCommitMessageParts generates test prefixed summary with details", () => {
  const changes = [
    { status: "M", path: "src/app.test.js" },
    { status: "A", path: "tests/helpers/util.js" },
  ];

  const { summary, body } = createCommitMessageParts(changes);

  assert.equal(summary.startsWith("test:"), true);
  assert.equal(body.includes("- modified src/app.test.js"), true);
  assert.equal(body.includes("- added tests/helpers/util.js"), true);
});

test("createCommitMessageParts respects provided summary when present", () => {
  const changes = [{ status: "M", path: "docs/guide.md" }];
  const provided = "docs: update guide";

  const { summary, body } = createCommitMessageParts(changes, provided);

  assert.equal(summary, provided);
  assert.equal(body.includes("- modified docs/guide.md"), true);
});

test("determineReleaseTypeFromCommit returns major for breaking change", () => {
  const message = "feat!: overhaul API\n\nBREAKING CHANGE: new behavior";
  assert.equal(determineReleaseTypeFromCommit(message), "major");
});

test("determineReleaseTypeFromCommit returns minor for feat", () => {
  const message = "feat: add dashboard";
  assert.equal(determineReleaseTypeFromCommit(message), "minor");
});

test("determineReleaseTypeFromCommit returns patch for fix", () => {
  const message = "fix: resolve login issue";
  assert.equal(determineReleaseTypeFromCommit(message), "patch");
});

test("determineReleaseTypeFromCommit defaults to patch for other commit types", () => {
  const message = "chore: update dependencies";
  assert.equal(determineReleaseTypeFromCommit(message), "patch");
});

test("workingTreeSummary reports no changes for empty output", () => {
  const summary = workingTreeSummary("\n  \n");
  assert.equal(summary.hasChanges, false);
  assert.deepEqual(summary.lines, []);
});

test("workingTreeSummary lists trimmed status lines", () => {
  const statusOutput = " M src/app.js\nA  tests/new.test.js\n";
  const summary = workingTreeSummary(statusOutput);

  assert.equal(summary.hasChanges, true);
  assert.deepEqual(summary.lines, ["M src/app.js", "A tests/new.test.js"]);
});
