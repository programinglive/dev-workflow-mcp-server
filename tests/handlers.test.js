import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { WorkflowState } from "../workflow-state.js";
import { handleToolCall } from "../tools/handlers.js";
import { normalizeRequestArgs, shellEscape } from "../utils.js";
import {
  createCommitMessageParts,
  determineReleaseTypeFromCommit,
} from "../commit-helpers.js";

async function withWorkflowState(callback) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "workflow-handlers-"));
  const stateFile = path.join(tempDir, "state.json");
  const state = new WorkflowState(stateFile);
  await state.load();

  try {
    await callback(state);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const utils = {
  shellEscape,
  determineReleaseTypeFromCommit,
  createCommitMessageParts,
};

function createRequest(name, args) {
  return {
    params: {
      name,
      arguments: args,
    },
  };
}

test("commit_and_push records commit without pushing", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.readyToCommit = true;
    workflowState.state.readyCheckCompleted = true;
    workflowState.state.testsSkipped = false;
    workflowState.state.testsCreated = true;
    workflowState.state.testsPassed = true;
    workflowState.state.currentPhase = "commit";
    await workflowState.save();

    const commands = [];
    const execStub = async (command) => {
      commands.push(command);
      return { stdout: "" };
    };

    const git = {
      hasWorkingChanges: async () => true,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [{ status: "M", path: "src/index.js" }],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    const response = await handleToolCall({
      request: createRequest("commit_and_push", { commitMessage: "" }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    assert.equal(
      commands.some((command) => command.startsWith("git push")),
      false,
      "git push should not be executed during commit"
    );
    assert.equal(
      commands.some((command) => command.startsWith("git commit")),
      true,
      "git commit should be executed"
    );
    assert.ok(
      response.content[0].text.includes("Commit recorded!"),
      "response should confirm commit recording"
    );
    assert.equal(workflowState.state.commitAndPushCompleted, true);
    assert.equal(workflowState.state.lastCommitMessage.length > 0, true);
    assert.equal(workflowState.state.currentPhase, "release");
  });
});

test("perform_release runs release command before pushing with tags", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "release";
    workflowState.state.commitAndPushCompleted = true;
    workflowState.state.readyCheckCompleted = true;
    workflowState.state.lastPushBranch = "feature/split";
    workflowState.state.lastCommitMessage = "fix: address issue";
    await workflowState.save();

    const commands = [];
    const execStub = async (command) => {
      commands.push(command);
      if (command === "git status --porcelain") {
        return { stdout: "" };
      }

      return { stdout: "" };
    };

    const git = {
      hasWorkingChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    const response = await handleToolCall({
      request: createRequest("perform_release", { command: "npm run release" }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    const releaseCommand = commands.find((command) => command.startsWith("npm run release"));
    assert.ok(releaseCommand, "release command should be executed");
    assert.ok(
      releaseCommand.includes("-- --release-as patch"),
      "release command should append release type"
    );

    const pushCommand = commands.find((command) => command.startsWith("git push"));
    assert.ok(pushCommand, "git push with tags should be executed after release");
    assert.ok(
      pushCommand.startsWith("git push --follow-tags"),
      "push command should include --follow-tags"
    );
    assert.ok(
      pushCommand.includes("feature/split"),
      "push command should target last recorded branch"
    );

    assert.equal(workflowState.state.released, true);
    assert.equal(workflowState.state.currentPhase, "ready_to_complete");
    assert.ok(
      response.content[0].text.includes("No workflow history yet") ||
        response.content[0].text.includes("Workflow History"),
      "response should describe workflow history or absence thereof"
    );
  });
});
