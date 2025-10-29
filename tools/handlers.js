import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_SUMMARY_FILENAME = "project-summary.json";

const textResponse = (text) => ({
  content: [
    {
      type: "text",
      text,
    },
  ],
});

async function resetToCommitIfWorkingChanges(workflowState, git) {
  if (!workflowState.state.commitAndPushCompleted) {
    return false;
  }

  const hasWorkingChanges = await git.hasWorkingChanges();
  const hasStagedChanges = await git.hasStagedChanges();
  
  if (!hasWorkingChanges && !hasStagedChanges) {
    return false;
  }

  workflowState.state.commitAndPushCompleted = false;
  workflowState.state.released = false;
  workflowState.state.currentPhase = "commit";
  workflowState.state.releaseCommand = "";
  workflowState.state.releaseNotes = "";
  await workflowState.save();
  return true;
}

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

function generateProjectSummary(history) {
  if (!history || history.length === 0) {
    return "No workflow history available.";
  }

  const taskTypes = {};
  const recentTasks = history.slice(-20);

  for (const entry of recentTasks) {
    const type = entry.taskType || "other";
    taskTypes[type] = (taskTypes[type] || 0) + 1;
  }

  const typeSummary = Object.entries(taskTypes)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const totalTasks = history.length;
  const lastTask = history[history.length - 1];
  const lastActive = lastTask ? new Date(lastTask.timestamp).toLocaleDateString() : "Never";

  return `🧠 Project Knowledge Summary\n\n📊 Stats\n- Total tasks completed: ${totalTasks}\n- Recent task mix: ${typeSummary}\n- Last active: ${lastActive}\n\n📝 Recent tasks (last 5)\n${history.slice(-5).reverse().map((e, i) => `${i + 1}. ${e.taskDescription} (${e.taskType})`).join("\n")}`;
}

function getContinueGuidance(status) {
  switch (status.currentPhase) {
    case "coding": {
      const task = status.taskDescription ? ` "${status.taskDescription}"` : "";
      return `Finish implementing${task} and then run 'mark_bug_fixed' with a brief summary of the change.`;
    }
    case "testing":
      if (!status.testsCreated) {
        return "Create automated coverage now using 'create_tests' before recording any results.";
      }

      if (status.testsPassed) {
        return "With tests green, move on to 'create_documentation' and capture what changed.";
      }

      if (status.testsSkipped) {
        return "Document why tests were skipped using 'create_documentation' so the workflow can proceed.";
      }

      return status.testCommand
        ? `Fix any failing tests and re-run '${status.testCommand}'. Once they pass, record the results with 'run_tests'.`
        : "Run your automated tests and record the outcome with 'run_tests'. Fix any failures before moving forward.";
    case "documentation":
      return status.testsSkipped
        ? `Document the change (including manual QA for skipped tests) with 'create_documentation'. Reason recorded: ${
            status.testsSkippedReason || "(none provided)"
          }.`
        : "Capture your updates with 'create_documentation' (provide the documentation type and a short summary).";
    case "ready":
      return "Run 'check_ready_to_commit' to verify all prerequisite steps before committing.";
    case "commit":
      return "All checks passed—run 'commit_and_push' with your commit message (and optional branch).";
    case "release":
      return "Commit recorded. Execute 'perform_release' with the release command you ran to publish changes.";
    case "ready_to_complete":
      return "Release recorded. Finish up by calling 'complete_task' with the commit message you used.";
    default:
      return "Review your workflow progress and complete the next required step.";
  }
}

async function handleContinueWorkflow(workflowState, context) {
  const status = workflowState.state;

  if (!status || status.currentPhase === "idle") {
    return textResponse("⚠️ No active workflow. Use 'start_task' to kick off a new task before continuing.");
  }

  if (await resetToCommitIfWorkingChanges(workflowState, context.git)) {
    return textResponse(
      "⚠️ Detected new changes after the last commit. Workflow moved back to the commit phase. Run 'commit_and_push' to capture the latest updates before continuing."
    );
  }

  if (status.currentPhase === "ready") {
    return handleReadyCheck(workflowState);
  }

  if (status.currentPhase === "commit") {
    return handleCommitAndPush({}, context);
  }

  if (status.currentPhase === "release") {
    return textResponse(
      "⚠️ Release phase requires explicit command. Run 'perform_release' with your release command (e.g., 'npm run release')."
    );
  }

  const sections = [
    `📊 Current Phase: ${status.currentPhase}`,
    `📝 Task: ${status.taskDescription || "(none)"}`,
  ];

  if (status.testsSkipped) {
    sections.push(`⚠️ Tests skipped: ${status.testsSkippedReason || "(no reason provided)"}`);
  }

  if (
    status.currentPhase === "testing" &&
    status.testsCreated &&
    !status.testsPassed &&
    typeof status.testCommand === "string" &&
    status.testCommand.trim() !== ""
  ) {
    sections.push(`🧪 Last test command: ${status.testCommand}`);
  }

  sections.push(`➡️ ${getContinueGuidance(status)}`);

  return textResponse(sections.join("\n\n"));
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
    `✅ Task Started: ${args.description}\n\n🎯 Be conscious about what you're coding!\n\nWorkflow Steps:\n1. ✓ Start task (current)\n2. ⏳ Fix/implement the feature\n3. ⏳ Create tests\n4. ⏳ Run tests (must pass!)\n5. ⏳ Create documentation\n6. ⏳ Run 'check_ready_to_commit'\n7. ⏳ Run 'commit_and_push' (commits and pushes)\n8. ⏳ Run 'perform_release' (handles versioning and tags)\n9. ⏳ Complete task\n\nReminder: Focus on writing clean, maintainable code!`
  );
}

async function handleMarkBugFixed(args, workflowState) {
  if (workflowState.state.currentPhase === "idle") {
    return textResponse("⚠️ Please start a task first using 'start_task'!");
  }

  // Idempotent behavior: if already marked fixed, do not reset downstream flags.
  if (workflowState.state.bugFixed) {
    const summary = typeof args.summary === "string" ? args.summary : "";
    if (summary && summary.trim() !== "") {
      workflowState.state.fixSummary = summary;
    }

    // Preserve existing progress and set an appropriate phase.
    if (workflowState.state.testsPassed && workflowState.state.documentationCreated) {
      workflowState.state.currentPhase = "ready";
      workflowState.state.readyToCommit = true;
    } else if (workflowState.state.testsCreated) {
      workflowState.state.currentPhase = "testing";
    }
    workflowState.state.readyCheckCompleted = false;
    workflowState.state.commitAndPushCompleted = false;
    await workflowState.save();

    return textResponse(
      "ℹ️ Already marked as fixed; kept existing tests/documentation. Continue with the next step."
    );
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
    `✅ Feature/Bug marked as fixed!\n\n⚠️ CRITICAL REMINDER: You MUST create tests now!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ⏳ Create tests for: ${args.summary}\n3. ⏳ Run tests (must be green!)\n4. ⏳ Create documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Run 'commit_and_push'\n7. ⏳ Run 'perform_release'\n8. ⏳ Complete task\n\n🚫 DO NOT SKIP TESTING!`
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
    "✅ Tests recorded!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ⏳ Run tests (must be green!)\n4. ⏳ Create documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Run 'commit_and_push'\n7. ⏳ Run 'perform_release'\n8. ⏳ Complete task\n\n🧪 Run your test command and record the results using 'run_tests'."
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
5. ⏳ Run 'commit_and_push'
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
    `✅ All tests passed! 🎉\n\nTest command: ${args.testCommand}\n\n📝 Now create documentation using 'create_documentation' with:\n- documentationType: "README", "inline-comments", "API-docs", "changelog", or "other"\n- summary: Brief description of what was documented\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ✓ Run tests (GREEN!)\n4. ⏳ Create/update documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Run 'commit_and_push'\n7. ⏳ Run 'perform_release'\n8. ⏳ Complete task`
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
    `✅ Documentation created!\n\nType: ${args.documentationType}\nSummary: ${args.summary}\n\n🎉 You're ready to verify your work!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ✓ Run tests (GREEN!)\n4. ✓ Create documentation\n5. ⏳ Run 'check_ready_to_commit' to verify\n6. ⏳ Run 'commit_and_push'\n7. ⏳ Run 'perform_release'\n8. ⏳ Mark as complete with 'complete_task'`
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
      `🎉 ALL CHECKS PASSED!\n\n${checkList}\n\n✅ Next actions:\n1. Run 'commit_and_push' (commits and pushes your changes)\n2. Run 'perform_release' (handles versioning, tags, and final push)\n3. Finish with 'complete_task'\n\nTip: Provide the optional 'branch' argument to 'commit_and_push' to push to a non-default branch.\n\nTask: ${status.taskDescription}`
    );
  }

  return textResponse(`⚠️ NOT READY TO COMMIT!\n\n${checkList}\n\nPlease complete all steps before committing.`);
}

async function handleCommitAndPush(args, context) {
  const { workflowState, exec, git, utils } = context;
  if (!workflowState.state.readyToCommit || !workflowState.state.readyCheckCompleted) {
    // Be smart: auto-run the ready check and proceed if it passes.
    const readyResponse = await handleReadyCheck(workflowState);
    if (workflowState.state.currentPhase !== "commit") {
      return readyResponse;
    }
  }

  const providedCommitMessage =
    typeof args.commitMessage === "string" ? args.commitMessage.trim() : "";

  const requestedBranch = typeof args.branch === "string" ? args.branch.trim() : "";
  const currentBranch = await git.getCurrentBranch();
  const branchForPush = requestedBranch || currentBranch || "";

  const hasWorkingChanges = await git.hasWorkingChanges();

  if (!hasWorkingChanges) {
    const lastCommitMessage = await git.getLastCommitMessage();
    const effectiveCommitMessage = lastCommitMessage || providedCommitMessage;

    workflowState.state.commitAndPushCompleted = true;
    workflowState.state.lastCommitMessage = effectiveCommitMessage || "";
    workflowState.state.lastPushBranch = branchForPush;
    workflowState.state.currentPhase = workflowState.state.released ? "ready_to_complete" : "release";
    await workflowState.save();

    return textResponse(
      `ℹ️ No changes detected. Assuming commit and push already completed.\nLast commit: ${
        effectiveCommitMessage || "(unavailable)"
      }\n\nNext: Run 'perform_release' to handle the release and push tags.`
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

  try {
    const pushCommand = branchForPush
      ? `git push origin ${utils.shellEscape(branchForPush)}`
      : "git push";
    await exec(pushCommand);
  } catch (error) {
    return textResponse(
      `❌ git push failed:\n\n${error.stderr || error.stdout || error.message}`
    );
  }

  workflowState.state.commitAndPushCompleted = true;
  workflowState.state.lastCommitMessage = generatedSummary;
  workflowState.state.lastPushBranch = branchForPush;
  workflowState.state.currentPhase = workflowState.state.released ? "ready_to_complete" : "release";
  await workflowState.save();

  return textResponse(
    `✅ Commit and push completed!\n\nCommit message: ${generatedSummary}\nPushed to: ${
      branchForPush || "(default upstream)"
    }\n\nNext: Run 'perform_release' to handle the release and push tags.`
  );
}

async function handlePerformRelease(args, context) {
  const { workflowState, exec, git, utils } = context;

  if (workflowState.state.currentPhase === "idle") {
    return textResponse("⚠️ Please start a task first using 'start_task'!");
  }

  if (await resetToCommitIfWorkingChanges(workflowState, git)) {
    return textResponse(
      "⚠️ Detected new changes after the last commit. Please run 'commit_and_push' again before recording a release."
    );
  }

  if (!workflowState.state.readyCheckCompleted) {
    return textResponse(
      "⚠️ Please run 'check_ready_to_commit' and ensure all checks pass before releasing!"
    );
  }

  if (!workflowState.state.commitAndPushCompleted) {
    const hasWorkingChanges = await git.hasWorkingChanges();

    if (hasWorkingChanges) {
      return textResponse(
        "⚠️ Please run 'commit_and_push' after the ready check before recording a release!"
      );
    }

    workflowState.state.currentPhase = "commit";
    await workflowState.save();

    return textResponse(
      "⚠️ Please run 'commit_and_push' after the ready check before recording a release!"
    );
  }

  const rawReleaseCommand = typeof args.command === "string" ? args.command.trim() : "";
  const releaseTypeArg =
    typeof args.releaseType === "string" ? args.releaseType.trim().toLowerCase() : "";
  const presetArg = typeof args.preset === "string" ? args.preset.trim().toLowerCase() : "";
  const recognizedTypes = new Set(["major", "minor", "patch"]);

  const tokens = rawReleaseCommand
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  let releaseType = "";
  if (recognizedTypes.has(releaseTypeArg)) {
    releaseType = releaseTypeArg;
  } else if (recognizedTypes.has(presetArg)) {
    releaseType = presetArg;
  } else if (tokens.length > 0) {
    const possibleType = tokens[tokens.length - 1];
    if (recognizedTypes.has(possibleType)) {
      releaseType = possibleType;
    }
  }

  let releaseCommand = rawReleaseCommand;
  if (releaseCommand && recognizedTypes.has(releaseCommand.toLowerCase())) {
    releaseType = releaseCommand.toLowerCase();
    releaseCommand = "";
  }

  const scriptTypeMatch = /release:(major|minor|patch)/i.exec(releaseCommand);
  if (scriptTypeMatch) {
    releaseType = scriptTypeMatch[1].toLowerCase();
  }

  if (!releaseCommand && releaseType) {
    releaseCommand = `npm run release:${releaseType}`;
  }

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
  if (!releaseType) {
    releaseType = utils.determineReleaseTypeFromCommit(
      lastCommitMessage || workflowState.state.lastCommitMessage
    );
  }

  const finalCommand =
    releaseCommand.includes("--release-as") || /release:(major|minor|patch)/i.test(releaseCommand)
      ? releaseCommand
      : `${releaseCommand} -- --release-as ${releaseType}`;

  try {
    await exec(finalCommand);
  } catch (error) {
    return textResponse(
      `❌ Release command failed:\n\n${error.stderr || error.stdout || error.message}`
    );
  }

  const branchForPush = workflowState.state.lastPushBranch || (await git.getCurrentBranch()) || "";
  const pushCommand = branchForPush
    ? `git push --follow-tags origin ${utils.shellEscape(branchForPush)}`
    : "git push --follow-tags";

  try {
    await exec(pushCommand);
  } catch (error) {
    return textResponse(
      `❌ git push (with tags) failed:\n\n${error.stderr || error.stdout || error.message}`
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

async function handleForceCompleteTask(args, workflowState) {
  const commitMessageArg =
    typeof args.commitMessage === "string" ? args.commitMessage.trim() : "";
  const reason = typeof args.reason === "string" ? args.reason.trim() : "";

  const commitMessage =
    commitMessageArg || workflowState.state.lastCommitMessage || "(no commit recorded)";

  workflowState.addToHistory({
    taskDescription: workflowState.state.taskDescription,
    taskType: workflowState.state.taskType,
    commitMessage,
    forced: true,
    forceReason: reason,
  });

  workflowState.reset();
  await workflowState.save();

  const reasonText = reason ? reason : "(none provided)";

  return textResponse(
    `⚠️ Task force-completed.\n\nRecorded commit message: ${commitMessage}\nReason: ${reasonText}\nWorkflow state reset. Start a new task when ready.`
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

function handleProjectSummary(workflowState) {
  const summary = generateProjectSummary(workflowState.state.history);
  return textResponse(summary);
}

async function handleProjectSummaryData(workflowState) {
  const summaryPath = path.join(path.dirname(workflowState.stateFile), PROJECT_SUMMARY_FILENAME);
  try {
    const data = await fs.readFile(summaryPath, "utf-8");
    const parsed = JSON.parse(data);
    const formatted = `🧠 Project Knowledge Summary (from persisted data)\n\n📊 Stats\n- Total tasks completed: ${parsed.totalTasks}\n- Recent task mix: ${Object.entries(parsed.taskTypes).map(([t, c]) => `${t}: ${c}`).join(", ")}\n- Last active: ${parsed.lastActive ? new Date(parsed.lastActive).toLocaleDateString() : "Never"}\n- Updated: ${new Date(parsed.updatedAt).toLocaleString()}\n\n📝 Recent tasks (last 5)\n${parsed.recentTasks.map((e, i) => `${i + 1}. ${e.description} (${e.type})`).join("\n")}`;
    return textResponse(formatted);
  } catch (error) {
    // Fallback to in-memory generation if file doesn't exist
    return handleProjectSummary(workflowState);
  }
}

async function handleProjectSummaryDb(workflowState) {
  const { getSummaryForUser } = await import("../db/index.js");
  const userId = process.env.DEV_WORKFLOW_USER_ID || "default";
  const summary = getSummaryForUser(userId);
  if (!summary) {
    return textResponse("📜 No project summary in database yet.");
  }
  const formatted = `🧠 Project Knowledge Summary (from SQLite)\n\n📊 Stats\n- Total tasks completed: ${summary.totalTasks}\n- Recent task mix: ${Object.entries(summary.taskTypes).map(([t, c]) => `${t}: ${c}`).join(", ")}\n- Last active: ${summary.lastActive ? new Date(summary.lastActive).toLocaleDateString() : "Never"}\n- Updated: ${new Date(summary.updatedAt).toLocaleString()}\n\n📝 Recent tasks (last 5)\n${summary.recentTasks.map((e, i) => `${i + 1}. ${e.description} (${e.type})`).join("\n")}`;
  return textResponse(formatted);
}

async function handleRerunWorkflow(workflowState) {
  const currentDescription = workflowState.state.taskDescription;
  const currentType = workflowState.state.taskType;

  if (!currentDescription) {
    return textResponse("⚠️ No active task to rerun. Use 'start_task' to begin a new workflow.");
  }

  workflowState.reset();
  workflowState.state.currentPhase = "coding";
  workflowState.state.taskDescription = currentDescription;
  workflowState.state.taskType = currentType;
  await workflowState.save();

  return textResponse(
    `🔄 Rerunning workflow from the start!\n\nTask: ${currentDescription}\nType: ${currentType}\n\nWorkflow Steps:\n1. ✓ Start task (current)\n2. ⏳ Fix/implement the feature\n3. ⏳ Create tests\n4. ⏳ Run tests (must pass!)\n5. ⏳ Create documentation\n6. ⏳ Run 'check_ready_to_commit'\n7. ⏳ Run 'commit_and_push' (commits and pushes)\n8. ⏳ Run 'perform_release' (handles versioning and tags)\n9. ⏳ Complete task\n\n🎯 Be conscious about what you're coding!`
  );
}

function isErrorResponse(response) {
  const text = response?.content?.[0]?.text || "";
  return /^\s*[⚠️❌]/u.test(text);
}

function summarizeResponse(label, response) {
  const text = response?.content?.[0]?.text || "";
  const firstLine = text.split("\n")[0] || "";
  return `${label}: ${firstLine}`;
}

async function handleRunFullWorkflow(args, { workflowState, exec, git, utils }) {
  const description = workflowState.state.taskDescription;
  if (!description) {
    return textResponse("⚠️ Please start a task first using 'start_task' before running the full workflow.");
  }

  await workflowState.ensurePrimaryFile();

  const requiredStrings = [
    { key: "summary", message: "Provide a non-empty 'summary' for mark_bug_fixed." },
    { key: "testCommand", message: "Provide a non-empty 'testCommand' for run_tests." },
    { key: "documentationType", message: "Provide 'documentationType' for create_documentation." },
    { key: "documentationSummary", message: "Provide a non-empty 'documentationSummary'." },
    { key: "commitMessage", message: "Provide a non-empty 'commitMessage'." },
    { key: "releaseCommand", message: "Provide a non-empty 'releaseCommand'." },
  ];

  for (const { key, message } of requiredStrings) {
    const value = args[key];
    if (typeof value !== "string" || value.trim() === "") {
      return textResponse(`⚠️ ${message}`);
    }
  }

  const steps = [];
  const testsPassed = typeof args.testsPassed === "boolean" ? args.testsPassed : true;
  const testDetails = typeof args.testDetails === "string" ? args.testDetails : "";
  const releaseArgs = {
    command: args.releaseCommand,
  };
  if (typeof args.releaseNotes === "string" && args.releaseNotes.trim() !== "") {
    releaseArgs.notes = args.releaseNotes;
  }
  if (typeof args.releaseType === "string" && args.releaseType.trim() !== "") {
    releaseArgs.releaseType = args.releaseType;
  }
  if (typeof args.preset === "string" && args.preset.trim() !== "") {
    releaseArgs.preset = args.preset;
  }

  // Smart flow: detect current phase and run only remaining steps
  async function executeStep(name, handlerFn, handlerArgs = []) {
    if (isErrorResponse(handlerFn)) {
      return handlerFn;
    }
    const response = await handlerFn(...handlerArgs);
    if (isErrorResponse(response)) {
      return response;
    }
    steps.push(summarizeResponse(name, response));
    await workflowState.load();
    return response;
  }

  while (true) {
    const state = workflowState.state;

    if (!state.bugFixed) {
      const resp = await executeStep("mark_bug_fixed", handleMarkBugFixed, [{ summary: args.summary }, workflowState]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!state.testsCreated) {
      const resp = await executeStep("create_tests", handleCreateTests, [workflowState]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!state.testsPassed && !state.testsSkipped) {
      const resp = await executeStep("run_tests", handleRunTests, [
        { passed: testsPassed, testCommand: args.testCommand, details: testDetails },
        workflowState,
      ]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!state.documentationCreated) {
      const resp = await executeStep("create_documentation", handleCreateDocumentation, [
        { documentationType: args.documentationType, summary: args.documentationSummary },
        workflowState,
      ]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!state.readyCheckCompleted) {
      const resp = await executeStep("check_ready_to_commit", handleReadyCheck, [workflowState]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!state.commitAndPushCompleted) {
      const resp = await executeStep("commit_and_push", handleCommitAndPush, [
        {
          commitMessage: args.commitMessage,
          branch: typeof args.branch === "string" ? args.branch : "",
        },
        { workflowState, exec, git, utils },
      ]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!state.released) {
      const resp = await executeStep("perform_release", handlePerformRelease, [
        releaseArgs,
        { workflowState, exec, git, utils },
      ]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    const completeResponse = await handleCompleteTask({ commitMessage: args.commitMessage }, workflowState);
    if (isErrorResponse(completeResponse)) {
      return completeResponse;
    }
    steps.push(summarizeResponse("complete_task", completeResponse));
    break;
  }

  const summary = steps.map((line, index) => `${index + 1}. ${line}`).join("\n");
  const celebration = workflowState.state.history?.length
    ? "🎉 Cheers! We solved another issue and captured it in the knowledge base."
    : "";
  const message = [`✅ Full workflow completed successfully!`, celebration, summary].filter(Boolean).join("\n\n");
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
      case "force_complete_task":
        return handleForceCompleteTask(args, workflowState);
      case "drop_task":
        return handleDropTask(args, workflowState);
      case "get_workflow_status":
        return handleGetWorkflowStatus(workflowState);
      case "view_history":
        return handleViewHistory(args, workflowState);
      case "project_summary":
        return handleProjectSummary(workflowState);
      case "project_summary_data":
        return handleProjectSummaryData(workflowState);
      case "project_summary_db":
        return handleProjectSummaryDb(workflowState);
      case "continue_workflow":
        return handleContinueWorkflow(workflowState, { workflowState, exec, git, utils });
      case "rerun_workflow":
        return handleRerunWorkflow(workflowState);
      case "run_full_workflow":
        return handleRunFullWorkflow(args, { workflowState, exec, git, utils });
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
