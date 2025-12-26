import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const PROJECT_SUMMARY_FILENAME = "project-summary.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const textResponse = (text) => ({
  content: [
    {
      type: "text",
      text,
    },
  ],
});

export function isReleaseSatisfied(state) {
  return Boolean(state?.released || state?.releaseSkipped);
}

export async function resetToCommitIfWorkingChanges(workflowState, git) {
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
  workflowState.state.releaseSkipped = false;
  workflowState.state.releaseSkippedReason = "";
  workflowState.state.currentPhase = "commit";
  workflowState.state.releaseCommand = "";
  workflowState.state.releaseNotes = "";
  await workflowState.save();
  return true;
}

export function formatChecklist(checks) {
  return checks.map((c) => `${c.done ? "✅" : "❌"} ${c.name}`).join("\n");
}

export function summarizeHistory(history, limit) {
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

export function generateProjectSummary(history) {
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

export function getContinueGuidance(status) {
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
        ? `Document the change (including manual QA for skipped tests) with 'create_documentation'. Reason recorded: ${status.testsSkippedReason || "(none provided)"}.`
        : "Capture your updates with 'create_documentation' (provide the documentation type and a short summary).";
    case "ready":
      return "Run 'check_ready_to_commit' to verify all prerequisite steps before committing.";
    case "commit":
      return "All checks passed—run 'commit_and_push' with your commit message (and optional branch).";
    case "release":
      return "Commit recorded. Execute 'perform_release' with the release command you ran to publish changes, or call 'skip_release' with a justification if no release is required.";
    case "ready_to_complete":
      return "Release recorded. Finish up by calling 'complete_task' with the commit message you used.";
    default:
      return "Review your workflow progress and complete the next required step.";
  }
}

export async function handleReadyCheck(workflowState) {
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
    if (workflowState.state.commitAndPushCompleted) {
      workflowState.state.currentPhase = isReleaseSatisfied(workflowState.state) ? "ready_to_complete" : "release";
    } else {
      workflowState.state.currentPhase = "commit";
    }
  }
  await workflowState.save();

  if (allDone) {
    return textResponse(
      `🎉 ALL CHECKS PASSED!\n\n${checkList}\n\n✅ Next actions:\n1. Run 'commit_and_push' (commits and pushes your changes)\n2. Run 'perform_release' (handles versioning, tags, and final push)\n3. Finish with 'complete_task'\n\nTip: Provide the optional 'branch' argument to 'commit_and_push' to push to a non-default branch.\n\nTask: ${status.taskDescription}`
    );
  }

  return textResponse(`⚠️ NOT READY TO COMMIT!\n\n${checkList}\n\nPlease complete all steps before committing.`);
}

export async function loadProjectSummary(workflowState) {
  const summaryPath = path.join(path.dirname(workflowState.stateFile), PROJECT_SUMMARY_FILENAME);
  try {
    const data = await fs.readFile(summaryPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export const prdPath = path.join(__dirname, "..", "docs", "product", "PRD.md");

export function ensurePrdExists() {
  return existsSync(prdPath);
}
