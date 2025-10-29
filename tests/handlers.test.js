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

    const git = {
      hasWorkingChanges: async () => true,
      hasStagedChanges: async () => false,
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

test("project_summary_data reads persisted file and falls back", async () => {
  await withWorkflowState(async (workflowState) => {
    // Seed some history
    workflowState.addToHistory({ taskDescription: "Add login feature", taskType: "feature", commitMessage: "feat: login" });
    await workflowState.save(); // This should create project-summary.json

    const response = await handleToolCall({
      request: createRequest("project_summary_data", {}),
      normalizeRequestArgs,
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: {},
      utils,
    });

    const text = response.content[0].text;
    assert.ok(text.includes("from persisted data"), "should indicate persisted source");
    assert.ok(text.includes("Total tasks completed: 1"), "should count tasks");
    assert.ok(text.includes("feature: 1"), "should show feature count");
    assert.ok(text.includes("Updated:"), "should show updated timestamp");
  });
});

test("project_summary aggregates task types and recent activity", async () => {
  await withWorkflowState(async (workflowState) => {
    // Seed some history
    workflowState.addToHistory({ taskDescription: "Add login feature", taskType: "feature", commitMessage: "feat: login" });
    workflowState.addToHistory({ taskDescription: "Fix auth bug", taskType: "bugfix", commitMessage: "fix: auth" });
    workflowState.addToHistory({ taskDescription: "Refactor utils", taskType: "refactor", commitMessage: "refactor: utils" });
    await workflowState.save();

    const response = await handleToolCall({
      request: createRequest("project_summary", {}),
      normalizeRequestArgs,
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: {},
      utils,
    });

    const text = response.content[0].text;
    assert.ok(text.includes("Project Knowledge Summary"), "should include summary title");
    assert.ok(text.includes("Total tasks completed: 3"), "should count tasks");
    assert.ok(text.includes("feature: 1"), "should show feature count");
    assert.ok(text.includes("bugfix: 1"), "should show bugfix count");
    assert.ok(text.includes("refactor: 1"), "should show refactor count");
    assert.ok(text.includes("Add login feature"), "should list recent tasks");
  });
});

test("run_full_workflow executes all steps successfully", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.taskDescription = "Ship feature";
    workflowState.state.taskType = "feature";
    workflowState.state.currentPhase = "coding";
    await workflowState.save();

    const commands = [];
    let workingChanges = true;
    const execStub = async (command) => {
      commands.push(command);
      if (command.startsWith("git commit") || command.startsWith("git push")) {
        workingChanges = false;
      }
      if (command === "git status --porcelain") {
        return { stdout: workingChanges ? " M src/app.js" : "" };
      }
      return { stdout: "" };
    };

    const git = {
      hasWorkingChanges: async () => workingChanges,
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [{ status: "M", path: "src/app.js" }],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "",
      workingTreeSummary: () =>
        workingChanges
          ? { hasChanges: true, lines: ["M src/app.js"] }
          : { hasChanges: false, lines: [] },
    };

    const response = await handleToolCall({
      request: createRequest("run_full_workflow", {
        summary: "Implement feature",
        testCommand: "npm test",
        documentationType: "README",
        documentationSummary: "Document feature",
        commitMessage: "feat: add feature",
        releaseCommand: "npm run release:patch",
        releaseNotes: "Automated release",
      }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    assert.ok(
      response.content[0].text.includes("✅ Full workflow completed successfully"),
      "run_full_workflow should report success"
    );
    assert.ok(
      commands.some((command) => command.startsWith("git add")),
      "git add should be executed"
    );
    assert.ok(
      commands.some((command) => command.startsWith("git commit")),
      "git commit should be executed"
    );
    assert.ok(
      commands.some((command) => command.startsWith("git push")),
      "git push should be executed"
    );
    assert.ok(
      commands.some((command) => command.startsWith("npm run release")),
      "release command should be executed"
    );
    assert.equal(workflowState.state.currentPhase, "idle");
  });
});

test("run_full_workflow resumes from current phase when steps are already completed", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.taskDescription = "Ship feature";
    workflowState.state.taskType = "feature";
    workflowState.state.currentPhase = "release";
    workflowState.state.bugFixed = true;
    workflowState.state.testsCreated = true;
    workflowState.state.testsPassed = true;
    workflowState.state.documentationCreated = true;
    workflowState.state.readyCheckCompleted = true;
    workflowState.state.commitAndPushCompleted = true;
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
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    const response = await handleToolCall({
      request: createRequest("run_full_workflow", {
        summary: "Implement feature",
        testCommand: "npm test",
        documentationType: "README",
        documentationSummary: "Document feature",
        commitMessage: "feat: add feature",
        releaseCommand: "npm run release:patch",
        releaseNotes: "Automated release",
      }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    assert.ok(
      response.content[0].text.includes("✅ Full workflow completed successfully"),
      "run_full_workflow should report success"
    );
    // Should only run release and complete since earlier steps are done
    assert.ok(
      commands.some((command) => command.startsWith("npm run release")),
      "release command should be executed"
    );
    assert.equal(
      commands.filter((c) => c.startsWith("git commit")).length,
      0,
      "git commit should not be executed when already completed"
    );
    assert.equal(workflowState.state.currentPhase, "idle");
  });
});

test("run_full_workflow validates required arguments", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.taskDescription = "Ship feature";
    workflowState.state.taskType = "feature";
    workflowState.state.currentPhase = "coding";
    await workflowState.save();

    const response = await handleToolCall({
      request: createRequest("run_full_workflow", {
        summary: "",
        testCommand: "npm test",
        documentationType: "README",
        documentationSummary: "Doc",
        commitMessage: "feat: add feature",
        releaseCommand: "npm run release:patch",
      }),
      normalizeRequestArgs,
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: {},
      utils,
    });

    assert.ok(
      response.content[0].text.includes("Provide a non-empty 'summary'"),
      "run_full_workflow should validate required fields"
    );
  });
});

test("force_complete_task records entry and resets state", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.taskDescription = "Improve caching";
    workflowState.state.taskType = "feature";
    workflowState.state.lastCommitMessage = "chore: wip";
    workflowState.state.currentPhase = "release";
    await workflowState.save();

    const response = await handleToolCall({
      request: createRequest("force_complete_task", {
        commitMessage: "chore: force finish",
        reason: "Deadline hit",
      }),
      normalizeRequestArgs,
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: {},
      utils,
    });

    assert.ok(response.content[0].text.includes("Task force-completed."));
    assert.equal(workflowState.state.currentPhase, "idle");
    assert.equal(workflowState.state.history.length, 1);
    assert.equal(workflowState.state.history[0].commitMessage, "chore: force finish");
    assert.equal(workflowState.state.history[0].forced, true);
    assert.equal(workflowState.state.history[0].forceReason, "Deadline hit");
  });
});

test("perform_release blocks when new changes detected", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "release";
    workflowState.state.commitAndPushCompleted = true;
    workflowState.state.readyCheckCompleted = true;
    await workflowState.save();

    const commands = [];
    const execStub = async (command) => {
      commands.push(command);
      if (command === "git status --porcelain") {
        return { stdout: "?? new-file.js" };
      }

      return { stdout: "" };
    };

    const git = {
      hasWorkingChanges: async () => true,
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "fix: adjust layout",
      workingTreeSummary: () => ({ hasChanges: true, lines: ["?? new-file.js"] }),
    };

    const response = await handleToolCall({
      request: createRequest("perform_release", { command: "patch" }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    assert.ok(
      response.content[0].text.includes("run 'commit_and_push' again"),
      "response should instruct to recommit"
    );
    assert.equal(workflowState.state.currentPhase, "commit");
    assert.equal(workflowState.state.commitAndPushCompleted, false);
  });
});

test("continue_workflow warns when workflow is idle", async () => {
  await withWorkflowState(async (workflowState) => {
    const git = {
      hasWorkingChanges: async () => false,
      hasStagedChanges: async () => false,
      hasTestChanges: async () => false,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    const response = await handleToolCall({
      request: createRequest("continue_workflow", {}),
      normalizeRequestArgs,
      workflowState,
      exec: async () => ({ stdout: "" }),
      git,
      utils,
    });

    assert.ok(
      response.content[0].text.includes("No active workflow"),
      "Idle workflow should prompt user to start a task"
    );
  });
});

test("continue_workflow resets to commit when new changes detected", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "release";
    workflowState.state.commitAndPushCompleted = true;
    workflowState.state.readyCheckCompleted = true;
    await workflowState.save();

    const git = {
      hasWorkingChanges: async () => true,
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "fix: adjust layout",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    const response = await handleToolCall({
      request: createRequest("continue_workflow", {}),
      normalizeRequestArgs,
      workflowState,
      exec: async () => ({ stdout: "" }),
      git,
      utils,
    });

    assert.ok(
      response.content[0].text.includes("Workflow moved back to the commit phase"),
      "response should warn that workflow reset to commit"
    );
    assert.equal(workflowState.state.currentPhase, "commit");
    assert.equal(workflowState.state.commitAndPushCompleted, false);
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

    const git = {
      hasWorkingChanges: async () => false,
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "fix: previous work",
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

    assert.equal(commands.length, 0, "no git commands should run when work is already committed");
    assert.ok(
      response.content[0].text.includes("No changes detected"),
      "response should note that no changes were detected"
    );
    assert.equal(workflowState.state.commitAndPushCompleted, true);
    assert.equal(workflowState.state.lastCommitMessage, "fix: previous work");
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
      hasStagedChanges: async () => false,
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

test("perform_release accepts shorthand patch command", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "release";
    workflowState.state.commitAndPushCompleted = true;
    workflowState.state.readyCheckCompleted = true;
    workflowState.state.lastCommitMessage = "fix: adjust labels";
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
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "fix: adjust labels",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    await handleToolCall({
      request: createRequest("perform_release", { command: "patch" }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    const releaseCommand = commands.find((command) => command.startsWith("npm run release:patch"));
    assert.ok(releaseCommand, "shorthand patch command should map to release:patch script");
    const pushCommand = commands.find((command) => command.startsWith("git push --follow-tags"));
    assert.ok(pushCommand, "git push with tags should run after shorthand release");
  });
});

test("perform_release respects explicit releaseType option", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "release";
    workflowState.state.commitAndPushCompleted = true;
    workflowState.state.readyCheckCompleted = true;
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
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "feat: import improvements",
      workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    };

    await handleToolCall({
      request: createRequest("perform_release", {
        command: "npm run release",
        releaseType: "minor",
      }),
      normalizeRequestArgs,
      workflowState,
      exec: execStub,
      git,
      utils,
    });

    const releaseCommand = commands.find((command) => command.startsWith("npm run release"));
    assert.ok(releaseCommand, "release command should run");
    assert.ok(
      releaseCommand.includes("-- --release-as minor"),
      "release command should append provided releaseType"
    );
  });
});

test("perform_release requires commit_and_push completion when tree is clean", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "release";
    workflowState.state.commitAndPushCompleted = false;
    workflowState.state.readyCheckCompleted = true;
    workflowState.state.lastPushBranch = "";
    workflowState.state.lastCommitMessage = "";
    await workflowState.save();

    const commands = [];
    const execStub = async (command) => {
      commands.push(command);
      return { stdout: "" };
    };

    const git = {
      hasWorkingChanges: async () => false,
      hasStagedChanges: async () => false,
      hasTestChanges: async () => true,
      getStagedChanges: async () => [],
      getCurrentBranch: async () => "main",
      getLastCommitMessage: async () => "chore: already pushed",
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

    assert.equal(commands.length, 0, "no release commands should run when commit_and_push not completed");
    assert.equal(workflowState.state.currentPhase, "commit");
    assert.equal(workflowState.state.commitAndPushCompleted, false);
    assert.ok(
      response.content[0].text.includes("Please run 'commit_and_push' after the ready check"),
      "response should instruct user to run commit_and_push"
    );
  });
});
