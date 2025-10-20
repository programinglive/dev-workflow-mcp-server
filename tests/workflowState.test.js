import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  WorkflowState,
  getNextStep,
  containsTestFilesInStatus,
  createCommitMessageParts,
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
  });
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
    state.addToHistory({ taskDescription: "Sample task" });

    state.reset();

    assert.equal(state.state.currentPhase, "idle");
    assert.equal(state.state.testsCreated, false);
    assert.equal(state.state.testsPassed, false);
    assert.equal(state.state.documentationCreated, false);
    assert.equal(state.state.readyCheckCompleted, false);
    assert.equal(state.state.released, false);
    assert.equal(state.state.commitAndPushCompleted, false);
    assert.equal(state.state.history.length, 1);
    assert.equal(state.state.history[0].taskDescription, "Sample task");
  });
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
