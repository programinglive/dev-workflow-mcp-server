const textResponse = (text) => ({
  content: [
    {
      type: "text",
      text,
    },
  ],
});

function formatChecklist(checks) {
  return checks.map((c) => `${c.done ? "✅" : "❌"} ${c.name}`).join("\n");
}

function summarizeHistory(history, limit) {
  const recent = history.slice(-limit).reverse();
  if (recent.length === 0) {
    return null;
  }

  const historyText = recent
    .map(
      (entry, index) =>
        `${index + 1}. [${new Date(entry.timestamp).toLocaleString()}]\n   Task: ${entry.taskDescription}\n   Type: ${entry.taskType}\n   Commit: ${entry.commitMessage}\n`
    )
    .join("\n");

  return `📜 Workflow History (last ${recent.length} tasks)\n\n${historyText}`;
}

async function handleStartTask(args, workflowState) {
  workflowState.reset();
  workflowState.state.currentPhase = "coding";
  workflowState.state.taskDescription = args.description;
  workflowState.state.taskType = args.type;
  workflowState.state.testsSkipped = false;
  workflowState.state.testsSkippedReason = "";
  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.lastCommitMessage = "";
  workflowState.state.lastPushBranch = "";
  await workflowState.save();

  return textResponse(
    `✅ Task Started: ${args.description}\n\n🎯 Be conscious about what you're coding!\n\nWorkflow Steps:\n1. ✓ Start task (current)\n2. ⏳ Fix/implement the feature\n3. ⏳ Create tests\n4. ⏳ Run tests (must pass!)\n5. ⏳ Create documentation\n6. ⏳ Run 'check_ready_to_commit'\n7. ⏳ Commit & push, then run 'perform_release'\n8. ⏳ Complete task\n\nReminder: Focus on writing clean, maintainable code!`
  );
}

async function handleMarkBugFixed(args, workflowState) {
  if (workflowState.state.currentPhase === "idle") {
    return textResponse("⚠️ Please start a task first using 'start_task'!");
  }

  workflowState.state.bugFixed = true;
  workflowState.state.testsCreated = false;
  workflowState.state.currentPhase = "testing";
  workflowState.state.testsSkipped = false;
  workflowState.state.testsSkippedReason = "";
  workflowState.state.fixSummary = args.summary;
  workflowState.state.readyCheckCompleted = false;
  workflowState.state.released = false;
  workflowState.state.releaseCommand = "";
  workflowState.state.releaseNotes = "";
  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.lastCommitMessage = "";
  workflowState.state.lastPushBranch = "";
  await workflowState.save();

  return textResponse(
    `✅ Feature/Bug marked as fixed!\n\n⚠️ CRITICAL REMINDER: You MUST create tests now!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ⏳ Create tests for: ${args.summary}\n3. ⏳ Run tests (must be green!)\n4. ⏳ Create documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Complete task\n\n🚫 DO NOT SKIP TESTING!`
  );
}

async function handleCreateTests(workflowState) {
  if (!workflowState.state.bugFixed) {
    return textResponse("⚠️ Please mark your feature/bug as fixed first using 'mark_bug_fixed'!");
  }

  workflowState.state.testsCreated = true;
  workflowState.state.testsSkipped = false;
  workflowState.state.testsSkippedReason = "";
  workflowState.state.readyCheckCompleted = false;
  workflowState.state.released = false;
  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.lastCommitMessage = "";
  workflowState.state.lastPushBranch = "";
  await workflowState.save();

  return textResponse(
    "✅ Tests recorded!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ⏳ Run tests (must be green!)\n4. ⏳ Create documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Complete task\n\n🧪 Run your test command and record the results using 'run_tests'."
  );
}

async function handleSkipTests(args, workflowState) {
  if (workflowState.state.currentPhase === "idle") {
    return textResponse("⚠️ No active task. Use 'start_task' before skipping tests.");
  }

  if (!workflowState.state.bugFixed) {
    return textResponse("⚠️ Please mark your feature/bug as fixed first using 'mark_bug_fixed'!");
  }

  const reason = typeof args.reason === "string" ? args.reason.trim() : "";

  if (!reason) {
    return textResponse("⚠️ Provide a non-empty justification when skipping tests.");
  }

  workflowState.state.testsCreated = true;
  workflowState.state.testsPassed = true;
  workflowState.state.testsSkipped = true;
  workflowState.state.testsSkippedReason = reason;
  workflowState.state.currentPhase = "documentation";
  workflowState.state.readyToCommit = false;
  workflowState.state.readyCheckCompleted = false;
  workflowState.state.released = false;
  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.lastCommitMessage = "";
  workflowState.state.lastPushBranch = "";
  await workflowState.save();

  return textResponse(
    `⚠️ Tests skipped for this task.
Reason: ${reason}

Manual verification is now required.

Next Steps:
1. ✓ Fix/implement feature
2. ⚠️ Tests skipped (ensure manual QA)
3. ⏳ Create/update documentation
4. ⏳ Run 'check_ready_to_commit'
5. ⏳ Commit & push
6. ⏳ Run 'perform_release'
7. ⏳ Complete task`
  );
}

async function handleRunTests(args, workflowState) {
  if (!workflowState.state.bugFixed) {
    return textResponse("⚠️ Please mark your feature/bug as fixed first using 'mark_bug_fixed'!");
  }

  if (!workflowState.state.testsCreated) {
    return textResponse("⚠️ Please create tests first using 'create_tests' before recording test results!");
  }

  if (
    typeof args.passed !== "boolean" ||
    typeof args.testCommand !== "string" ||
    args.testCommand.trim() === ""
  ) {
    return textResponse(
      "⚠️ Please provide both 'passed' (boolean) and 'testCommand' (non-empty string) when recording test results."
    );
  }

  workflowState.state.testsPassed = args.passed;
  workflowState.state.testCommand = args.testCommand;
  workflowState.state.testDetails = typeof args.details === "string" ? args.details : "";
  workflowState.state.testsSkipped = false;
  workflowState.state.testsSkippedReason = "";
  workflowState.state.readyCheckCompleted = false;
  workflowState.state.released = false;
  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.lastCommitMessage = "";
  workflowState.state.lastPushBranch = "";

  if (!args.passed) {
    workflowState.state.currentPhase = "testing";
    await workflowState.save();

    return textResponse(
      `❌ TESTS FAILED!\n\n🚫 STOP! DO NOT COMMIT OR PUSH!\n\nYou must:\n1. Fix the failing tests\n2. Run tests again until they pass\n\nTest command: ${args.testCommand}\n\nNever skip or ignore failing tests!`
    );
  }

  workflowState.state.currentPhase = "documentation";
  await workflowState.save();

  return textResponse(
    `✅ All tests passed! 🎉\n\nTest command: ${args.testCommand}\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ✓ Run tests (GREEN!)\n4. ⏳ Create/update documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Complete task\n\nReminder: Document what you did before committing!`
  );
}

async function handleCreateDocumentation(args, workflowState) {
  if (!workflowState.state.testsPassed) {
    return textResponse("⚠️ Please ensure tests are passing first! Run 'run_tests' with passed=true.");
  }

  workflowState.state.documentationCreated = true;
  workflowState.state.documentationType = args.documentationType;
  workflowState.state.documentationSummary = args.summary;
  workflowState.state.currentPhase = "ready";
  workflowState.state.readyToCommit = true;
  workflowState.state.readyCheckCompleted = false;
  workflowState.state.released = false;
  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.lastCommitMessage = "";
  workflowState.state.lastPushBranch = "";
  await workflowState.save();

  return textResponse(
    `✅ Documentation created!\n\nType: ${args.documentationType}\nSummary: ${args.summary}\n\n🎉 You're ready to verify your work!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ✓ Run tests (GREEN!)\n4. ✓ Create documentation\n5. ⏳ Run 'check_ready_to_commit' to verify\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Mark as complete with 'complete_task'\n\nRemember: git add . && git commit && git push`
  );
}

async function handleReadyCheck(workflowState) {
  const status = workflowState.state;
  const testsCreatedDone = status.testsSkipped || status.testsCreated;
  const testsPassedDone = status.testsSkipped || status.testsPassed;
  const checks = [
    { name: "Task started", done: status.currentPhase !== "idle" },
    { name: "Feature/bug fixed", done: status.bugFixed },
    {
      name: status.testsSkipped ? "Tests skipped (manual QA documented)" : "Tests created",
      done: testsCreatedDone,
    },
    {
      name: status.testsSkipped ? "Tests skipped acknowledged" : "Tests passed",
      done: testsPassedDone,
    },
    { name: "Documentation created", done: status.documentationCreated },
  ];

  const allDone = checks.every((c) => c.done);
  const checkList = formatChecklist(checks);

  workflowState.state.readyCheckCompleted = allDone;
  if (allDone) {
    workflowState.state.currentPhase = workflowState.state.commitAndPushCompleted
      ? workflowState.state.released
        ? "ready_to_complete"
        : "release"
      : "commit";
  }
  await workflowState.save();

  if (allDone) {
    return textResponse(
      `🎉 ALL CHECKS PASSED!\n\n${checkList}\n\n✅ Next actions:\n1. Run 'commit_and_push' with your commit message\n2. Run 'perform_release' to record the release\n3. Finish with 'complete_task'\n\nTip: Provide the optional 'branch' argument to push to a non-default branch.\n\nTask: ${status.taskDescription}`
    );
  }

  return textResponse(`⚠️ NOT READY TO COMMIT!\n\n${checkList}\n\nPlease complete all steps before committing.`);
}

async function handleCommitAndPush(args, context) {
  const { workflowState, exec, git, utils } = context;
  if (!workflowState.state.readyToCommit) {
    return textResponse("⚠️ Not ready yet! Run 'check_ready_to_commit' and complete all steps first.");
  }

  if (!workflowState.state.readyCheckCompleted) {
    return textResponse(
      "⚠️ Please run 'check_ready_to_commit' and resolve any outstanding items before committing!"
    );
  }

  const providedCommitMessage =
    typeof args.commitMessage === "string" ? args.commitMessage.trim() : "";

  if (!(await git.hasWorkingChanges())) {
    return textResponse(
      "⚠️ No changes detected. Make sure you have modifications to commit before running 'commit_and_push'."
    );
  }

  if (!(await git.hasTestChanges()) && !workflowState.state.testsSkipped) {
    return textResponse(
      "⚠️ Please include test updates in your changes before running 'commit_and_push'. Ensure at least one test file is modified."
    );
  }

  try {
    await exec("git add .");
  } catch (error) {
    return textResponse(
      `❌ Failed to stage files:\n\n${error.stderr || error.stdout || error.message}`
    );
  }

  const stagedChanges = await git.getStagedChanges();
  const { summary: generatedSummary, body: commitBody } = utils.createCommitMessageParts(
    stagedChanges,
    providedCommitMessage
  );

  if (!generatedSummary) {
    return textResponse("⚠️ Unable to generate commit message. Please provide a 'commitMessage' manually.");
  }

  try {
    if (commitBody) {
      await exec(
        `git commit -m ${utils.shellEscape(generatedSummary)} -m ${utils.shellEscape(commitBody)}`
      );
    } else {
      await exec(`git commit -m ${utils.shellEscape(generatedSummary)}`);
    }
  } catch (error) {
    const output = error.stderr || error.stdout || error.message || "Unknown error";
    if (output.includes("nothing to commit")) {
      return textResponse(
        "⚠️ Nothing to commit. Make additional changes before running 'commit_and_push'."
      );
    }

    return textResponse(`❌ git commit failed:\n\n${output}`);
  }

  const requestedBranch = typeof args.branch === "string" ? args.branch.trim() : "";
  const currentBranch = await git.getCurrentBranch();
  const pushCommand = requestedBranch
    ? `git push origin ${utils.shellEscape(requestedBranch)}`
    : "git push";

  try {
    await exec(pushCommand);
  } catch (error) {
    return textResponse(
      `❌ git push failed:\n\n${error.stderr || error.stdout || error.message}`
    );
  }

  workflowState.state.commitAndPushCompleted = true;
  workflowState.state.lastCommitMessage = generatedSummary;
  workflowState.state.lastPushBranch = requestedBranch || currentBranch || "";
  workflowState.state.currentPhase = workflowState.state.released ? "ready_to_complete" : "release";
  await workflowState.save();

  return textResponse(
    `✅ Commit & push completed!\n\nCommit message: ${generatedSummary}\nPushed to: ${
      requestedBranch || currentBranch || "(default upstream)"
    }\n\nNext: Run 'perform_release' to record the release.`
  );
}

async function handlePerformRelease(args, context) {
  const { workflowState, exec, git, utils } = context;

  if (workflowState.state.currentPhase === "idle") {
    return textResponse("⚠️ Please start a task first using 'start_task'!");
  }

  if (!workflowState.state.commitAndPushCompleted) {
    return textResponse(
      "⚠️ Please run 'commit_and_push' after the ready check before recording a release!"
    );
  }

  if (!workflowState.state.readyCheckCompleted) {
    return textResponse(
      "⚠️ Please run 'check_ready_to_commit' and ensure all checks pass before releasing!"
    );
  }

  const releaseCommand = typeof args.command === "string" ? args.command.trim() : "";

  if (!releaseCommand) {
    return textResponse("⚠️ Please provide a non-empty 'command' when using 'perform_release'.");
  }

  let statusOutput;
  try {
    const { stdout } = await exec("git status --porcelain");
    statusOutput = stdout;
  } catch (error) {
    const details = error.stderr || error.stdout || error.message || "Unknown error";
    return textResponse(
      `⚠️ Unable to verify Git status. Refusing to run the release command until the repository state can be checked.\n\nDetails:\n${details}`
    );
  }

  const statusSummary = git.workingTreeSummary(statusOutput);
  if (statusSummary.hasChanges) {
    const changeDetails =
      statusSummary.lines.length > 0
        ? statusSummary.lines.map((line) => `• ${line}`).join("\n")
        : "• (unable to list changes)";

    return textResponse(
      `⚠️ Working tree not clean! Please commit or stash all changes before running 'perform_release'.\n\nDetected changes:\n${changeDetails}`
    );
  }

  const lastCommitMessage = await git.getLastCommitMessage();
  const releaseType = utils.determineReleaseTypeFromCommit(
    lastCommitMessage || workflowState.state.lastCommitMessage
  );

  const finalCommand = releaseCommand.includes("--release-as")
    ? releaseCommand
    : `${releaseCommand} -- --release-as ${releaseType}`;

  try {
    await exec(finalCommand);
  } catch (error) {
    return textResponse(
      `❌ Release command failed:\n\n${error.stderr || error.stdout || error.message}`
    );
  }

  workflowState.state.released = true;
  workflowState.state.releaseCommand = finalCommand;
  workflowState.state.releaseNotes = typeof args.notes === "string" ? args.notes : "";
  workflowState.state.currentPhase = "ready_to_complete";
  await workflowState.save();

  const message = summarizeHistory(workflowState.state.history, args.limit || 10);
  if (!message) {
    return textResponse("📜 No workflow history yet.");
  }

  return textResponse(message);
}

async function handleCompleteTask(args, workflowState) {
  const entry = {
    taskDescription: workflowState.state.taskDescription,
    taskType: workflowState.state.taskType,
    commitMessage: args.commitMessage,
  };

  workflowState.addToHistory(entry);
  workflowState.reset();
  await workflowState.save();

  return textResponse(
    `✅ Task completed!\n\nCommit message: ${args.commitMessage}\nHistory recorded.`
  );
}

async function handleDropTask(args, workflowState) {
  workflowState.addToHistory({
    taskDescription: workflowState.state.taskDescription,
    taskType: workflowState.state.taskType,
    commitMessage: workflowState.state.lastCommitMessage,
    dropped: true,
    dropReason: typeof args.reason === "string" ? args.reason : "",
  });
  workflowState.reset();
  await workflowState.save();

  return textResponse("⚠️ Task dropped. Workflow state reset.");
}

function handleGetWorkflowStatus(workflowState) {
  const status = workflowState.state;
  const nextStep = status ? status.currentPhase : "idle";

  return textResponse(
    `📊 Current Workflow Status:

Phase: ${status.currentPhase}
Task: ${status.taskDescription || "(none)"}
Bug fixed: ${status.bugFixed ? "✅" : "❌"}
Tests created: ${status.testsCreated ? "✅" : "❌"}
Tests passed: ${status.testsPassed ? "✅" : "❌"}
Documentation: ${status.documentationCreated ? "✅" : "❌"}
Ready check: ${status.readyCheckCompleted ? "✅" : "❌"}
Commit & push: ${status.commitAndPushCompleted ? "✅" : "❌"}
Released: ${status.released ? "✅" : "❌"}

Next step: ${nextStep}`
  );
}

function handleViewHistory(args, workflowState) {
  const message = summarizeHistory(workflowState.state.history, args.limit || 10);
  if (!message) {
    return textResponse("📜 No workflow history yet.");
  }

  return textResponse(message);
}

export async function handleToolCall({
  request,
  normalizeRequestArgs,
  workflowState,
  exec,
  git,
  utils,
}) {
  try {
    const { name } = request.params;
    const { args, error: argumentsError } = normalizeRequestArgs(request.params.arguments);

    if (argumentsError) {
      return textResponse(argumentsError);
    }

    switch (name) {
      case "start_task":
        return handleStartTask(args, workflowState);
      case "mark_bug_fixed":
        return handleMarkBugFixed(args, workflowState);
      case "create_tests":
        return handleCreateTests(workflowState);
      case "skip_tests":
        return handleSkipTests(args, workflowState);
      case "run_tests":
        return handleRunTests(args, workflowState);
      case "create_documentation":
        return handleCreateDocumentation(args, workflowState);
      case "check_ready_to_commit":
        return handleReadyCheck(workflowState);
      case "commit_and_push":
        return handleCommitAndPush(args, { workflowState, exec, git, utils });
      case "perform_release":
        return handlePerformRelease(args, { workflowState, exec, git, utils });
      case "complete_task":
        return handleCompleteTask(args, workflowState);
      case "drop_task":
        return handleDropTask(args, workflowState);
      case "get_workflow_status":
        return handleGetWorkflowStatus(workflowState);
      case "view_history":
        return handleViewHistory(args, workflowState);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error("Tool handler error:", error);
    return textResponse(
      "⚠️ Internal server error while processing the tool request. Please try again."
    );
  }
}
