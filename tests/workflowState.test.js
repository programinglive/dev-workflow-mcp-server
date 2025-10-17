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
    await state.save();

    const reloaded = new WorkflowState(state.stateFile);
    await reloaded.load();

    assert.equal(reloaded.state.currentPhase, "testing");
    assert.equal(reloaded.state.taskDescription, "Test persistence");
    assert.equal(reloaded.state.bugFixed, true);
  });
});

test("WorkflowState reset keeps history but clears progress", async () => {
  await withWorkflowState(async (state) => {
    state.state.currentPhase = "ready";
    state.state.testsPassed = true;
    state.state.documentationCreated = true;
    state.addToHistory({ taskDescription: "Sample task" });

    state.reset();

    assert.equal(state.state.currentPhase, "idle");
    assert.equal(state.state.testsPassed, false);
    assert.equal(state.state.documentationCreated, false);
    assert.equal(state.state.history.length, 1);
    assert.equal(state.state.history[0].taskDescription, "Sample task");
  });
});

test("getNextStep guides workflow progression", () => {
  const baseState = {
    bugFixed: false,
    testsPassed: false,
    documentationCreated: false,
    readyToCommit: false,
  };

  assert.equal(
    getNextStep(baseState),
    "Mark feature/bug as fixed"
  );

  const afterFix = { ...baseState, bugFixed: true };
  assert.equal(
    getNextStep(afterFix),
    "Create and run tests"
  );

  const afterTests = { ...afterFix, testsPassed: true };
  assert.equal(
    getNextStep(afterTests),
    "Create documentation"
  );

  const afterDocs = { ...afterTests, documentationCreated: true };
  assert.equal(
    getNextStep(afterDocs),
    "Check if ready to commit"
  );

  const ready = { ...afterDocs, readyToCommit: true };
  assert.equal(getNextStep(ready), "Commit and push!");
});
