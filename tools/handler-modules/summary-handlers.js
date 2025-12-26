import fs from "fs/promises";
import path from "path";
import { textResponse, generateProjectSummary, summarizeHistory, PROJECT_SUMMARY_FILENAME } from "./shared.js";

export function handleProjectSummary(workflowState) {
  const summary = generateProjectSummary(workflowState.state.history);
  return textResponse(summary);
}

export async function handleProjectSummaryData(workflowState) {
  const summaryPath = path.join(path.dirname(workflowState.stateFile), PROJECT_SUMMARY_FILENAME);
  try {
    const data = await fs.readFile(summaryPath, "utf-8");
    const parsed = JSON.parse(data);
    const formatted = `🧠 Project Knowledge Summary (from persisted data)\n\n📊 Stats\n- Total tasks completed: ${parsed.totalTasks}\n- Recent task mix: ${Object.entries(parsed.taskTypes).map(([t, c]) => `${t}: ${c}`).join(", ")}\n- Last active: ${parsed.lastActive ? new Date(parsed.lastActive).toLocaleDateString() : "Never"}\n- Updated: ${new Date(parsed.updatedAt).toLocaleString()}\n\n📝 Recent tasks (last 5)\n${parsed.recentTasks.map((e, i) => `${i + 1}. ${e.description} (${e.type})`).join("\n")}`;
    return textResponse(formatted);
  } catch (error) {
    return handleProjectSummary(workflowState);
  }
}

export async function handleProjectSummaryDb(workflowState) {
  try {
    const { getSummaryForUser } = await import("../../db/index.js");
    const userId = process.env.DEV_WORKFLOW_USER_ID || "default";
    const projectPath = path.dirname(path.dirname(path.dirname(path.dirname(workflowState.stateFile))));

    const summary = await getSummaryForUser(userId, projectPath);
    if (!summary) {
      return textResponse("📜 No project summary in database yet.");
    }
    const formatted = `🧠 Project Knowledge Summary (from SQLite)\n\n📊 Stats\n- Total tasks completed: ${summary.totalTasks}\n- Recent task mix: ${Object.entries(summary.taskTypes).map(([t, c]) => `${t}: ${c}`).join(", ")}\n- Last active: ${summary.lastActive ? new Date(summary.lastActive).toLocaleDateString() : "Never"}\n- Updated: ${new Date(summary.updatedAt).toLocaleString()}\n\n📝 Recent tasks (last 5)\n${summary.recentTasks.map((e, i) => `${i + 1}. ${e.description} (${e.type})`).join("\n")}`;
    return textResponse(formatted);
  } catch (error) {
    return textResponse("📜 Database module not available. Use 'project_summary' or 'project_summary_data' instead.");
  }
}

export function handleViewHistory(args, workflowState) {
  const message = summarizeHistory(workflowState.state.history, args.limit || 10);
  if (!message) {
    return textResponse("📜 No workflow history yet.");
  }

  return textResponse(message);
}
