import test from "node:test";
import assert from "node:assert/strict";
import { handleToolCall } from "../tools/handlers.js";
import { withWorkflowState, testUtils, createRequest, createGitMock } from "./test-helpers.js";

test("commit_and_push commits changes and pushes", async () => {
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

    const response = await handleToolCall({
      request: createRequest("commit_and_push", { commitMessage: "" }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: execStub,
      git: createGitMock({
        hasWorkingChanges: async () => true,
        getStagedChanges: async () => [{ status: "M", path: "src/index.js" }],
        getStatusOutput: async () => "M tests/handlers.test.js\nM src/index.js",
        containsTestFilesInStatus: (statusOutput) => statusOutput.includes("tests/"),
      }),
      utils: testUtils,
    });

    const pushCommand = commands.find((command) => command.startsWith("git push"));
    assert.ok(pushCommand, "git push should be executed during commit");
    assert.ok(
      pushCommand.startsWith("git push origin"),
      "push command should target origin"
    );
    assert.equal(
      commands.some((command) => command.startsWith("git commit")),
      true,
      "git commit should be executed"
    );
    assert.ok(
      response.content[0].text.includes("Commit and push completed!"),
      "response should confirm commit and push"
    );
    assert.equal(workflowState.state.commitAndPushCompleted, true);
    assert.equal(workflowState.state.lastCommitMessage.length > 0, true);
    assert.equal(workflowState.state.currentPhase, "release");
  });
});

test("commit_and_push uses primary branch when no branch specified", async () => {
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

    const response = await handleToolCall({
      request: createRequest("commit_and_push", { commitMessage: "feat: test" }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: execStub,
      git: createGitMock({
        hasWorkingChanges: async () => true,
        getStagedChanges: async () => [{ status: "M", path: "src/index.js" }],
        getCurrentBranch: async () => "feature/test",
        getStatusOutput: async () => "M tests/handlers.test.js\nM src/index.js",
        containsTestFilesInStatus: (statusOutput) => statusOutput.includes("tests/"),
      }),
      utils: testUtils,
    });

    const pushCommand = commands.find((command) => command.startsWith("git push"));
    assert.ok(pushCommand, "git push should be executed");
    assert.ok(
      /origin\s+['"]?main['"]?/.test(pushCommand),
      "push should use primary branch (main) when no branch specified"
    );
  });
});

test("commit_and_push falls back to master when main not found", async () => {
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

    const response = await handleToolCall({
      request: createRequest("commit_and_push", { commitMessage: "feat: test" }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: execStub,
      git: createGitMock({
        hasWorkingChanges: async () => true,
        getStagedChanges: async () => [{ status: "M", path: "src/index.js" }],
        getPrimaryBranch: async () => "master",
        getStatusOutput: async () => "M tests/handlers.test.js\nM src/index.js",
        containsTestFilesInStatus: (statusOutput) => statusOutput.includes("tests/"),
      }),
      utils: testUtils,
    });

    const pushCommand = commands.find((command) => command.startsWith("git push"));
    assert.ok(pushCommand, "git push should be executed");
    assert.ok(
      /origin\s+['"]?master['"]?/.test(pushCommand),
      "push should use master when main not found"
    );
  });
});

test("commit_and_push recognizes already committed work", async () => {
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

    const response = await handleToolCall({
      request: createRequest("commit_and_push", { commitMessage: "" }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: execStub,
      git: createGitMock({
        hasWorkingChanges: async () => false,
        getLastCommitMessage: async () => "fix: previous work",
        getStatusOutput: async () => "",
        containsTestFilesInStatus: (statusOutput) => statusOutput.includes("tests/"),
      }),
      utils: testUtils,
    });

    assert.ok(
      response.content[0].text.includes("No changes detected"),
      "response should indicate no changes"
    );
    assert.equal(workflowState.state.commitAndPushCompleted, true);
    assert.equal(workflowState.state.currentPhase, "release");
  });
});
