#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec as execCallback } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workflow state management
export class WorkflowState {
  constructor(stateFilePath = path.join(__dirname, ".workflow-state.json")) {
    this.stateFile = stateFilePath;
    this.state = {
      currentPhase: "idle",
      taskDescription: "",
      bugFixed: false,
      testsCreated: false,
      testsPassed: false,
      documentationCreated: false,
      readyToCommit: false,
      readyCheckCompleted: false,
      released: false,
      releaseCommand: "",
      releaseNotes: "",
      commitAndPushCompleted: false,
      lastCommitMessage: "",
      lastPushBranch: "",
      history: [],
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.stateFile, "utf-8");
      const parsed = JSON.parse(data);
      this.state = {
        ...this.state,
        ...parsed,
      };
      if (typeof this.state.testsCreated !== "boolean") {
        this.state.testsCreated = false;
      }
      if (typeof this.state.readyCheckCompleted !== "boolean") {
        this.state.readyCheckCompleted = false;
      }
      if (typeof this.state.released !== "boolean") {
        this.state.released = false;
      }
      if (typeof this.state.commitAndPushCompleted !== "boolean") {
        this.state.commitAndPushCompleted = false;
      }
      if (typeof this.state.releaseCommand !== "string") {
        this.state.releaseCommand = "";
      }
      if (typeof this.state.releaseNotes !== "string") {
        this.state.releaseNotes = "";
      }
      if (typeof this.state.lastCommitMessage !== "string") {
        this.state.lastCommitMessage = "";
      }
      if (typeof this.state.lastPushBranch !== "string") {
        this.state.lastPushBranch = "";
      }
    } catch (error) {
      // File doesn't exist yet, use default state
    }
  }

  async save() {
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  reset() {
    this.state = {
      currentPhase: "idle",
      taskDescription: "",
      bugFixed: false,
      testsCreated: false,
      testsPassed: false,
      documentationCreated: false,
      readyToCommit: false,
      readyCheckCompleted: false,
      released: false,
      releaseCommand: "",
      releaseNotes: "",
      commitAndPushCompleted: false,
      lastCommitMessage: "",
      lastPushBranch: "",
      history: this.state.history,
    };
  }

  addToHistory(entry) {
    this.state.history.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }
}

export const workflowState = new WorkflowState();
await workflowState.load();

const exec = promisify(execCallback);

const isWindows = process.platform === "win32";

function shellEscape(value) {
  const stringValue = String(value);
  if (isWindows) {
    // Use PowerShell-friendly single quotes, escape embedded single quotes by doubling
    return `'${stringValue.replace(/'/g, "''")}'`;
  }

  return `'${stringValue.replace(/'/g, "'\\''")}'`;
}

function normalizeRequestArgs(rawArgs) {
  if (rawArgs === undefined || rawArgs === null) {
    return { args: {}, error: null };
  }

  if (typeof rawArgs === "string") {
    try {
      const parsed = JSON.parse(rawArgs);
      if (parsed && typeof parsed === "object") {
        return { args: parsed, error: null };
      }

      return {
        args: {},
        error:
          "⚠️ Tool arguments must be a JSON object. Please provide key/value pairs.",
      };
    } catch (parseError) {
      return {
        args: {},
        error:
          "⚠️ Unable to parse tool arguments. Please provide valid JSON-formatted data.",
      };
    }
  }

  if (typeof rawArgs === "object") {
    return { args: rawArgs, error: null };
  }

  return {
    args: {},
    error: "⚠️ Unsupported tool arguments format. Expected a JSON object.",
  };
}

async function hasStagedChanges() {
  try {
    const { stdout } = await exec("git status --porcelain");
    return stdout
      .split("\n")
      .filter(Boolean)
      .some((line) => {
        const indexStatus = line[0];
        return indexStatus && indexStatus !== " " && indexStatus !== "?";
      });
  } catch (error) {
    return false;
  }
}

async function hasWorkingChanges() {
  try {
    const { stdout } = await exec("git status --porcelain");
    return stdout.split("\n").some((line) => line && line.trim().length > 0);
  } catch (error) {
    return false;
  }
}

function isTestFilePath(filePath) {
  if (!filePath) {
    return false;
  }

  if (/\.(test|spec)\.[^.]+$/i.test(filePath)) {
    return true;
  }

  return /(\/|^)(__tests__|tests?|spec)\//i.test(filePath);
}

function extractPathFromStatusLine(line) {
  if (!line || line.length < 4) {
    return "";
  }

  const rawPath = line.slice(3).trim();
  if (!rawPath) {
    return "";
  }

  if (rawPath.includes(" -> ")) {
    const parts = rawPath.split(" -> ");
    return parts[parts.length - 1].trim();
  }

  return rawPath;
}

export function containsTestFilesInStatus(statusOutput) {
  if (typeof statusOutput !== "string" || statusOutput.trim() === "") {
    return false;
  }

  return statusOutput
    .split("\n")
    .map((line) => extractPathFromStatusLine(line))
    .some((path) => isTestFilePath(path));
}

function isDocumentationFilePath(filePath) {
  if (!filePath) {
    return false;
  }

  const normalized = filePath.toLowerCase();
  return (
    normalized.startsWith("docs/") ||
    normalized.startsWith("documentation/") ||
    normalized.endsWith(".md") ||
    normalized.endsWith(".rst") ||
    normalized.endsWith(".adoc") ||
    normalized.includes("readme")
  );
}

function parseNameStatusLine(line) {
  if (!line) {
    return null;
  }

  const parts = line.split("\t").map((part) => part.trim());
  const status = parts[0];
  if (!status) {
    return null;
  }

  if (status.startsWith("R") || status.startsWith("C")) {
    const originalPath = parts[1] || "";
    const newPath = parts[2] || originalPath;
    return {
      status,
      path: newPath,
      originalPath,
    };
  }

  return {
    status,
    path: parts[1] || "",
    originalPath: "",
  };
}

function formatFileList(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  if (uniquePaths.length === 0) {
    return "updates";
  }

  if (uniquePaths.length === 1) {
    return uniquePaths[0];
  }

  if (uniquePaths.length === 2) {
    return `${uniquePaths[0]} and ${uniquePaths[1]}`;
  }

  if (uniquePaths.length === 3) {
    return `${uniquePaths[0]}, ${uniquePaths[1]}, and ${uniquePaths[2]}`;
  }

  const remaining = uniquePaths.length - 3;
  return `${uniquePaths[0]}, ${uniquePaths[1]}, ${uniquePaths[2]} +${remaining} more`;
}

function determineCommitType(changes) {
  const hasTestChange = changes.some((change) =>
    [change.path, change.originalPath].some((p) => isTestFilePath(p))
  );
  const hasDocsChange = changes.some((change) =>
    [change.path, change.originalPath].some((p) => isDocumentationFilePath(p))
  );

  if (hasTestChange) {
    return "test";
  }

  if (hasDocsChange) {
    return "docs";
  }

  return "chore";
}

function describeChange(change) {
  const statusCode = change.status || "";
  const path = change.path || change.originalPath || "";

  if (statusCode.startsWith("R")) {
    return `renamed ${change.originalPath} -> ${change.path}`;
  }

  if (statusCode.startsWith("C")) {
    return `copied ${change.originalPath} -> ${change.path}`;
  }

  switch (statusCode[0]) {
    case "A":
      return `added ${path}`;
    case "M":
      return `modified ${path}`;
    case "D":
      return `removed ${path}`;
    case "U":
      return `updated ${path}`;
    default:
      return `${statusCode} ${path}`.trim();
  }
}

export function createCommitMessageParts(changes, providedSummary = "") {
  const summaryInput = typeof providedSummary === "string" ? providedSummary.trim() : "";

  if (!Array.isArray(changes) || changes.length === 0) {
    return {
      summary: summaryInput,
      body: "",
    };
  }

  const commitType = determineCommitType(changes);
  const summaryPaths = changes
    .map((change) => change.path || change.originalPath)
    .filter(Boolean);
  const generatedSummary = `${commitType}: update ${formatFileList(summaryPaths)}`;
  const summary = summaryInput || generatedSummary;

  const detailLines = changes
    .map((change) => describeChange(change))
    .filter((line) => line && line.trim().length > 0)
    .map((line) => `- ${line}`);

  return {
    summary,
    body: detailLines.join("\n"),
  };
}

async function getStagedChanges() {
  try {
    const { stdout } = await exec("git diff --cached --name-status");
    return stdout
      .split("\n")
      .map((line) => parseNameStatusLine(line))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function hasTestChanges() {
  try {
    const { stdout } = await exec("git status --porcelain");
    return containsTestFilesInStatus(stdout);
  } catch (error) {
    return false;
  }
}

async function getCurrentBranch() {
  try {
    const { stdout } = await exec("git rev-parse --abbrev-ref HEAD");
    return stdout.trim();
  } catch (error) {
    return "";
  }
}

// Create MCP server
export const server = new Server(
  {
    name: "@programinglive/dev-workflow-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "start_task",
        description:
          "Start a new coding task. This is the first step - be conscious about what you're coding.",
        inputSchema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Clear description of what you're going to code",
            },
            type: {
              type: "string",
              enum: ["feature", "bugfix", "refactor", "other"],
              description: "Type of task",
            },
          },
          required: ["description", "type"],
        },
      },
      {
        name: "mark_bug_fixed",
        description:
          "Mark that the bug/feature is fixed. Reminder: Now you MUST create tests!",
        inputSchema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Brief summary of what was fixed/implemented",
            },
          },
          required: ["summary"],
        },
      },
      {
        name: "create_tests",
        description: "Mark that tests covering the change have been created.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "run_tests",
        description:
          "Record test results. NEVER commit if tests fail! Only proceed if all tests are green.",
        inputSchema: {
          type: "object",
          properties: {
            passed: {
              type: "boolean",
              description: "Did all tests pass?",
            },
            testCommand: {
              type: "string",
              description: "The test command that was run",
            },
            details: {
              type: "string",
              description: "Test results details",
            },
          },
          required: ["passed", "testCommand"],
        },
      },
      {
        name: "create_documentation",
        description:
          "Mark that documentation has been created/updated. This is required before committing.",
        inputSchema: {
          type: "object",
          properties: {
            documentationType: {
              type: "string",
              enum: ["README", "inline-comments", "API-docs", "changelog", "other"],
              description: "Type of documentation created",
            },
            summary: {
              type: "string",
              description: "What was documented",
            },
          },
          required: ["documentationType", "summary"],
        },
      },
      {
        name: "check_ready_to_commit",
        description:
          "Check if all workflow steps are completed and you're ready to commit & push.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "commit_and_push",
        description:
          "Automatically run git add, commit, and push once the ready check passes.",
        inputSchema: {
          type: "object",
          properties: {
            commitMessage: {
              type: "string",
              description: "Commit message to use",
            },
            branch: {
              type: "string",
              description:
                "Optional branch name to push to (defaults to current branch)",
            },
          },
          required: [],
        },
      },
      {
        name: "perform_release",
        description:
          "Record release details after committing and pushing your changes.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "Release command that was executed",
            },
            notes: {
              type: "string",
              description: "Optional release notes",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "complete_task",
        description:
          "Mark the task as complete after successful commit & push. Resets workflow for next task.",
        inputSchema: {
          type: "object",
          properties: {
            commitMessage: {
              type: "string",
              description: "The commit message used",
            },
          },
          required: ["commitMessage"],
        },
      },
      {
        name: "get_workflow_status",
        description: "Get current workflow status and what needs to be done next.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "view_history",
        description: "View workflow history of completed tasks.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of recent tasks to show (default: 10)",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name } = request.params;
    const { args, error: argumentsError } = normalizeRequestArgs(
      request.params.arguments
    );

    if (argumentsError) {
      return {
        content: [
          {
            type: "text",
            text: argumentsError,
          },
        ],
      };
    }

    switch (name) {
      case "start_task": {
        workflowState.reset();
        workflowState.state.currentPhase = "coding";
        workflowState.state.taskDescription = args.description;
        workflowState.state.taskType = args.type;
        workflowState.state.commitAndPushCompleted = false;
        workflowState.state.lastCommitMessage = "";
        workflowState.state.lastPushBranch = "";
        await workflowState.save();

        return {
          content: [
            {
              type: "text",
              text: `✅ Task Started: ${args.description}\n\n🎯 Be conscious about what you're coding!\n\nWorkflow Steps:\n1. ✓ Start task (current)\n2. ⏳ Fix/implement the feature\n3. ⏳ Create tests\n4. ⏳ Run tests (must pass!)\n5. ⏳ Create documentation\n6. ⏳ Run 'check_ready_to_commit'\n7. ⏳ Commit & push, then run 'perform_release'\n8. ⏳ Complete task\n\nReminder: Focus on writing clean, maintainable code!`,
            },
          ],
        };
      }

      case "mark_bug_fixed": {
        if (workflowState.state.currentPhase === "idle") {
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Please start a task first using 'start_task'!",
              },
            ],
          };
        }

        workflowState.state.bugFixed = true;
        workflowState.state.testsCreated = false;
        workflowState.state.currentPhase = "testing";
        workflowState.state.fixSummary = args.summary;
        workflowState.state.readyCheckCompleted = false;
        workflowState.state.released = false;
        workflowState.state.releaseCommand = "";
        workflowState.state.releaseNotes = "";
        workflowState.state.readyToCommit = false;
        workflowState.state.commitAndPushCompleted = false;
        workflowState.state.lastCommitMessage = "";
        workflowState.state.lastPushBranch = "";
        await workflowState.save();

        return {
          content: [
            {
              type: "text",
              text: `✅ Feature/Bug marked as fixed!\n\n⚠️ CRITICAL REMINDER: You MUST create tests now!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ⏳ Create tests for: ${args.summary}\n3. ⏳ Run tests (must be green!)\n4. ⏳ Create documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Complete task\n\n🚫 DO NOT SKIP TESTING!`,
            },
          ],
        };
      }

      case "create_tests": {
        if (!workflowState.state.bugFixed) {
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Please mark your feature/bug as fixed first using 'mark_bug_fixed'!",
              },
            ],
          };
        }

        workflowState.state.testsCreated = true;
        workflowState.state.readyCheckCompleted = false;
        workflowState.state.released = false;
        workflowState.state.commitAndPushCompleted = false;
        workflowState.state.lastCommitMessage = "";
        workflowState.state.lastPushBranch = "";
        await workflowState.save();

        return {
          content: [
            {
              type: "text",
              text: "✅ Tests recorded!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ⏳ Run tests (must be green!)\n4. ⏳ Create documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Complete task\n\n🧪 Run your test command and record the results using 'run_tests'.",
            },
          ],
        };
      }

      case "run_tests": {
        if (!workflowState.state.bugFixed) {
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Please mark your feature/bug as fixed first using 'mark_bug_fixed'!",
              },
            ],
          };
        }

        if (!workflowState.state.testsCreated) {
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Please create tests first using 'create_tests' before recording test results!",
              },
            ],
          };
        }

        if (
          typeof args.passed !== "boolean" ||
          typeof args.testCommand !== "string" ||
          args.testCommand.trim() === ""
        ) {
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Please provide both 'passed' (boolean) and 'testCommand' (non-empty string) when recording test results.",
              },
            ],
          };
        }

        workflowState.state.testsPassed = args.passed;
        workflowState.state.testCommand = args.testCommand;
        workflowState.state.testDetails =
          typeof args.details === "string" ? args.details : "";
        workflowState.state.readyCheckCompleted = false;
        workflowState.state.released = false;
        workflowState.state.commitAndPushCompleted = false;
        workflowState.state.lastCommitMessage = "";
        workflowState.state.lastPushBranch = "";

        if (!args.passed) {
          workflowState.state.currentPhase = "testing";
          await workflowState.save();

          return {
            content: [
              {
                type: "text",
                text: `❌ TESTS FAILED!\n\n🚫 STOP! DO NOT COMMIT OR PUSH!\n\nYou must:\n1. Fix the failing tests\n2. Run tests again until they pass\n\nTest command: ${args.testCommand}\n\nNever skip or ignore failing tests!`,
              },
            ],
          };
        }

        workflowState.state.currentPhase = "documentation";
        await workflowState.save();

        return {
          content: [
            {
              type: "text",
              text: `✅ All tests passed! 🎉\n\nTest command: ${args.testCommand}\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ✓ Run tests (GREEN!)\n4. ⏳ Create/update documentation\n5. ⏳ Run 'check_ready_to_commit'\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Complete task\n\nReminder: Document what you did before committing!`,
            },
          ],
        };
      }

    case "create_documentation": {
      if (!workflowState.state.testsPassed) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please ensure tests are passing first! Run 'run_tests' with passed=true.",
            },
          ],
        };
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

      return {
        content: [
          {
            type: "text",
            text: `✅ Documentation created!\n\nType: ${args.documentationType}\nSummary: ${args.summary}\n\n🎉 You're ready to verify your work!\n\nNext Steps:\n1. ✓ Fix/implement feature\n2. ✓ Create tests\n3. ✓ Run tests (GREEN!)\n4. ✓ Create documentation\n5. ⏳ Run 'check_ready_to_commit' to verify\n6. ⏳ Commit & push, then run 'perform_release'\n7. ⏳ Mark as complete with 'complete_task'\n\nRemember: git add . && git commit && git push`,
          },
        ],
      };
    }

    case "check_ready_to_commit": {
      const status = workflowState.state;
      const checks = [
        { name: "Task started", done: status.currentPhase !== "idle" },
        { name: "Feature/bug fixed", done: status.bugFixed },
        { name: "Tests created", done: status.testsCreated },
        { name: "Tests created and passed", done: status.testsPassed },
        { name: "Documentation created", done: status.documentationCreated },
      ];

      const allDone = checks.every((c) => c.done);
      const checkList = checks
        .map((c) => `${c.done ? "✅" : "❌"} ${c.name}`)
        .join("\n");

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
        return {
          content: [
            {
              type: "text",
              text: `🎉 ALL CHECKS PASSED!\n\n${checkList}\n\n✅ Next actions:\n1. Run 'commit_and_push' with your commit message\n2. Run 'perform_release' to record the release\n3. Finish with 'complete_task'\n\nTip: Provide the optional 'branch' argument to push to a non-default branch.\n\nTask: ${status.taskDescription}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ NOT READY TO COMMIT!\n\n${checkList}\n\nPlease complete all steps before committing.`,
            },
          ],
        };
      }
    }

    case "commit_and_push": {
      if (!workflowState.state.readyToCommit) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Not ready yet! Run 'check_ready_to_commit' and complete all steps first.",
            },
          ],
        };
      }

      if (!workflowState.state.readyCheckCompleted) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please run 'check_ready_to_commit' and resolve any outstanding items before committing!",
            },
          ],
        };
      }

      const providedCommitMessage =
        typeof args.commitMessage === "string" ? args.commitMessage.trim() : "";

      if (!(await hasWorkingChanges())) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ No changes detected. Make sure you have modifications to commit before running 'commit_and_push'.",
            },
          ],
        };
      }

      if (!(await hasTestChanges())) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please include test updates in your changes before running 'commit_and_push'. Ensure at least one test file is modified.",
            },
          ],
        };
      }

      try {
        await exec("git add .");
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to stage files:\n\n${error.stderr || error.stdout || error.message}`,
            },
          ],
        };
      }

      const stagedChanges = await getStagedChanges();
      const { summary: generatedSummary, body: commitBody } =
        createCommitMessageParts(stagedChanges, providedCommitMessage);

      if (!generatedSummary) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Unable to generate commit message. Please provide a 'commitMessage' manually.",
            },
          ],
        };
      }

      try {
        if (commitBody) {
          await exec(
            `git commit -m ${shellEscape(generatedSummary)} -m ${shellEscape(commitBody)}`
          );
        } else {
          await exec(`git commit -m ${shellEscape(generatedSummary)}`);
        }
      } catch (error) {
        const output = error.stderr || error.stdout || error.message || "Unknown error";
        if (output.includes("nothing to commit")) {
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Nothing to commit. Make additional changes before running 'commit_and_push'.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `❌ git commit failed:\n\n${output}`,
            },
          ],
        };
      }

      const requestedBranch =
        typeof args.branch === "string" ? args.branch.trim() : "";
      const currentBranch = await getCurrentBranch();
      const pushCommand = requestedBranch
        ? `git push origin ${shellEscape(requestedBranch)}`
        : "git push";

      try {
        await exec(pushCommand);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ git push failed:\n\n${error.stderr || error.stdout || error.message}`,
            },
          ],
        };
      }

      workflowState.state.commitAndPushCompleted = true;
      workflowState.state.lastCommitMessage = generatedSummary;
      workflowState.state.lastPushBranch =
        requestedBranch || currentBranch || "";
      workflowState.state.currentPhase = workflowState.state.released
        ? "ready_to_complete"
        : "release";
      await workflowState.save();

      return {
        content: [
          {
            type: "text",
            text: `✅ Commit & push completed!\n\nCommit message: ${generatedSummary}\nPushed to: ${
              requestedBranch || currentBranch || "(default upstream)"
            }\n\nNext: Run 'perform_release' to record the release.`,
          },
        ],
      };
    }

    case "perform_release": {
      if (workflowState.state.currentPhase === "idle") {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please start a task first using 'start_task'!",
            },
          ],
        };
      }

      if (!workflowState.state.commitAndPushCompleted) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please run 'commit_and_push' after the ready check before recording a release!",
            },
          ],
        };
      }

      if (!workflowState.state.readyCheckCompleted) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please run 'check_ready_to_commit' and ensure all checks pass before releasing!",
            },
          ],
        };
      }

      const releaseCommand =
        typeof args.command === "string" ? args.command.trim() : "";

      if (!releaseCommand) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please provide a non-empty 'command' when using 'perform_release'.",
            },
          ],
        };
      }

      try {
        await exec(releaseCommand);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Release command failed:\n\n${error.stderr || error.stdout || error.message}`,
            },
          ],
        };
      }

      workflowState.state.released = true;
      workflowState.state.releaseCommand = releaseCommand;
      workflowState.state.releaseNotes =
        typeof args.notes === "string" ? args.notes : "";
      workflowState.state.currentPhase = "ready_to_complete";
      await workflowState.save();

      return {
        content: [
          {
            type: "text",
            text: `🚀 Release recorded!\n\nCommand: ${releaseCommand}\n${workflowState.state.releaseNotes ? `Notes: ${workflowState.state.releaseNotes}\n` : ""}\n✅ Next: Run 'complete_task' to wrap up.`,
          },
        ],
      };
    }

    case "complete_task": {
      if (!workflowState.state.readyToCommit) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Not ready to complete! Run 'check_ready_to_commit' first.",
            },
          ],
        };
      }

      if (!workflowState.state.readyCheckCompleted) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Please run 'check_ready_to_commit' and ensure all checks pass before completing the task!",
            },
          ],
        };
      }

      if (!workflowState.state.commitAndPushCompleted) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Commit and push not completed! Run 'commit_and_push' first.",
            },
          ],
        };
      }

      if (!workflowState.state.released) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Release not recorded! Run 'perform_release' after committing and pushing.",
            },
          ],
        };
      }

      if (await hasStagedChanges()) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️ Staged files detected! Please commit or unstage all files before pushing. Run 'git status' to confirm a clean working tree, then try again.",
            },
          ],
        };
      }

      workflowState.addToHistory({
        taskDescription: workflowState.state.taskDescription,
        taskType: workflowState.state.taskType,
        fixSummary: workflowState.state.fixSummary,
        testCommand: workflowState.state.testCommand,
        documentationType: workflowState.state.documentationType,
        commitMessage: args.commitMessage,
        releaseCommand: workflowState.state.releaseCommand,
        releaseNotes: workflowState.state.releaseNotes,
      });

      const completedTask = workflowState.state.taskDescription;
      workflowState.reset();
      workflowState.state.currentPhase = "idle";
      await workflowState.save();

      return {
        content: [
          {
            type: "text",
            text: `🎉 Task completed successfully!\n\nCompleted: ${completedTask}\nCommit: ${args.commitMessage}\n\n✅ Workflow reset. Ready for next task!\n\nUse 'start_task' when you begin your next coding session.`,
          },
        ],
      };
    }

    case "get_workflow_status": {
      const status = workflowState.state;

      if (status.currentPhase === "idle") {
        return {
          content: [
            {
              type: "text",
              text: "📋 No active task.\n\nUse 'start_task' to begin a new coding session.",
            },
          ],
        };
      }

      const phaseMessages = {
        coding: "🔨 Currently coding",
        testing: "🧪 Ready for testing",
        documentation: "📝 Ready for documentation",
        ready: "✅ Ready for verification",
        commit: "📦 Ready to commit & push",
        release: "🚀 Ready to release",
        ready_to_complete: "✅ Release completed",
      };

      return {
        content: [
          {
            type: "text",
            text: `📋 Current Workflow Status\n\nTask: ${status.taskDescription}\nPhase: ${phaseMessages[status.currentPhase]}\n\nProgress:\n${status.bugFixed ? "✅" : "⏳"} Feature/bug fixed\n${status.testsCreated ? "✅" : "⏳"} Tests created\n${status.testsPassed ? "✅" : "⏳"} Tests passed\n${status.documentationCreated ? "✅" : "⏳"} Documentation created\n${status.readyCheckCompleted ? "✅" : "⏳"} Ready check completed\n${status.commitAndPushCompleted ? "✅" : "⏳"} Commit & push completed\n${status.released ? "✅" : "⏳"} Release recorded\n\nNext: ${getNextStep(status)}`,
          },
        ],
      };
    }

    case "view_history": {
      const limit = args.limit || 10;
      const history = workflowState.state.history.slice(-limit).reverse();

      if (history.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📜 No workflow history yet.",
            },
          ],
        };
      }

      const historyText = history
        .map(
          (entry, index) =>
            `${index + 1}. [${new Date(entry.timestamp).toLocaleString()}]\n   Task: ${entry.taskDescription}\n   Type: ${entry.taskType}\n   Commit: ${entry.commitMessage}\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📜 Workflow History (last ${history.length} tasks)\n\n${historyText}`,
          },
        ],
      };
    }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error("Tool handler error:", error);
    return {
      content: [
        {
          type: "text",
          text: "⚠️ Internal server error while processing the tool request. Please try again.",
        },
      ],
    };
  }
});

// Helper function
export function getNextStep(status) {
  if (!status.bugFixed) return "Mark feature/bug as fixed";
  if (!status.testsCreated) return "Create tests";
  if (!status.testsPassed) return "Run tests";
  if (!status.documentationCreated) return "Create documentation";
  if (!status.readyCheckCompleted) return "Run 'check_ready_to_commit'";
  if (!status.commitAndPushCompleted) return "Run 'commit_and_push'";
  if (!status.released) return "Run 'perform_release'";
  return "Complete the task";
}

// Define prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "workflow_reminder",
        description: "Get a reminder of the complete development workflow",
      },
      {
        name: "pre_commit_checklist",
        description: "Pre-commit checklist to ensure nothing is missed",
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === "workflow_reminder") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Development Workflow Discipline:

1. 🎯 START CONSCIOUS
   - Use 'start_task' to declare what you're coding
   - Be clear about your intention

2. 🔨 CODE WITH PURPOSE
   - Implement your feature or fix
   - Follow best practices

3. 🧪 ALWAYS CREATE TESTS
   - After fixing/implementing, create tests
   - Use 'mark_bug_fixed' when done

4. ✅ TESTS MUST PASS
   - Run your tests with 'run_tests'
   - If tests fail: FIX THEM, never skip!
   - Only proceed when all tests are GREEN

5. 📝 DOCUMENT YOUR WORK
   - Update README, comments, or docs
   - Use 'create_documentation' when done

6. 🚀 COMMIT & PUSH
   - Use 'check_ready_to_commit' to verify
   - git add . && git commit && git push
   - Use 'complete_task' to finish

Remember: No shortcuts! Each step is important for code quality.`,
          },
        },
      ],
    };
  }

  if (name === "pre_commit_checklist") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Pre-Commit Checklist:

Before you commit and push, verify:

□ Feature/bug is fully implemented
□ Tests are created for the changes
□ All tests pass (GREEN) - run 'run_tests'
□ Documentation is updated
□ Code is clean (no console.logs, unused imports)
□ No TypeScript 'any' types
□ Followed project coding standards

Use 'check_ready_to_commit' to verify workflow completion.

🚫 NEVER commit if tests are failing!
✅ Only commit when everything is green!`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// Start server
export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dev Workflow MCP Server running on stdio");
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
