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
      if (typeof this.state.releaseCommand !== "string") {
        this.state.releaseCommand = "";
      }
      if (typeof this.state.releaseNotes !== "string") {
        this.state.releaseNotes = "";
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
      if (allDone && !workflowState.state.released) {
        workflowState.state.currentPhase = "release";
      }
      if (!allDone) {
        workflowState.state.readyCheckCompleted = false;
      }
      await workflowState.save();

      if (allDone) {
        return {
          content: [
            {
              type: "text",
              text: `🎉 ALL CHECKS PASSED!\n\n${checkList}\n\n✅ Next actions:\n1. git add .\n2. git commit -m "your message"\n3. git push\n4. Run 'perform_release' to record the release\n5. Finish with 'complete_task'\n\nTask: ${status.taskDescription}`,
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

      workflowState.state.released = true;
      workflowState.state.releaseCommand = args.command;
      workflowState.state.releaseNotes =
        typeof args.notes === "string" ? args.notes : "";
      workflowState.state.currentPhase = "ready_to_complete";
      await workflowState.save();

      return {
        content: [
          {
            type: "text",
            text: `🚀 Release recorded!\n\nCommand: ${args.command}\n${workflowState.state.releaseNotes ? `Notes: ${workflowState.state.releaseNotes}\n` : ""}\n✅ Next: Run 'complete_task' to wrap up.`,
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
        release: "🚀 Ready to release",
        ready_to_complete: "✅ Release completed",
      };

      return {
        content: [
          {
            type: "text",
            text: `📋 Current Workflow Status\n\nTask: ${status.taskDescription}\nPhase: ${phaseMessages[status.currentPhase]}\n\nProgress:\n${status.bugFixed ? "✅" : "⏳"} Feature/bug fixed\n${status.testsCreated ? "✅" : "⏳"} Tests created\n${status.testsPassed ? "✅" : "⏳"} Tests passed\n${status.documentationCreated ? "✅" : "⏳"} Documentation created\n${status.readyCheckCompleted ? "✅" : "⏳"} Ready check completed\n${status.released ? "✅" : "⏳"} Release recorded\n\nNext: ${getNextStep(status)}`,
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
