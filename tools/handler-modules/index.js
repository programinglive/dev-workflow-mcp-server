import { textResponse, isReleaseSatisfied } from "./shared.js";
import { handleStartTask, handleMarkBugFixed, handleCreateTests, handleSkipTests, handleRunTests, handleCreateDocumentation } from "./workflow-handlers.js";
import { handleSkipRelease, handlePerformRelease } from "./release-handlers.js";
import { handleCommitAndPush, handleCompleteTask, handleForceCompleteTask, handleDropTask } from "./commit-handlers.js";
import { handleProjectSummary, handleProjectSummaryData, handleProjectSummaryDb, handleViewHistory } from "./summary-handlers.js";
import { handleGetWorkflowStatus, handleReadyCheck, handleContinueWorkflow, handleRerunWorkflow } from "./status-handlers.js";

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

  const requestedBranch = typeof args.branch === "string" ? args.branch.trim() : "";
  if (requestedBranch) {
    workflowState.state.lastPushBranch = requestedBranch;
    await workflowState.save();
  }

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
          branch: requestedBranch,
        },
        { workflowState, exec, git, utils },
      ]);
      if (isErrorResponse(resp)) return resp;
      continue;
    }

    if (!isReleaseSatisfied(state)) {
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
      case "skip_release":
        return handleSkipRelease(args, workflowState);
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
