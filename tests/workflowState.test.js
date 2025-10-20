import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { WorkflowState, getNextStep } from "../index.js";

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
    state.addToHistory({ taskDescription: "Sample task" });

    state.reset();

    assert.equal(state.state.currentPhase, "idle");
    assert.equal(state.state.testsCreated, false);
    assert.equal(state.state.testsPassed, false);
    assert.equal(state.state.documentationCreated, false);
    assert.equal(state.state.readyCheckCompleted, false);
    assert.equal(state.state.released, false);
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
  assert.equal(getNextStep(afterReadyCheck), "Run 'perform_release'");

  const afterRelease = { ...afterReadyCheck, released: true };
  assert.equal(getNextStep(afterRelease), "Complete the task");
});
