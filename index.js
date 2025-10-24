#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";
import { exec } from "./exec.js";
import { normalizeRequestArgs, shellEscape } from "./utils.js";
import {
  getCurrentBranch,
  getLastCommitMessage,
  getStagedChanges,
  hasStagedChanges,
  hasTestChanges,
  hasWorkingChanges,
  workingTreeSummary,
} from "./git-helpers.js";
import {
  createCommitMessageParts,
  determineReleaseTypeFromCommit,
} from "./commit-helpers.js";
import { WorkflowState } from "./workflow-state.js";
import { getToolList } from "./tools/definitions.js";
import { handleToolCall } from "./tools/handlers.js";

export { createCommitMessageParts, determineReleaseTypeFromCommit } from "./commit-helpers.js";
export { containsTestFilesInStatus, workingTreeSummary } from "./git-helpers.js";
export { WorkflowState } from "./workflow-state.js";

export const workflowState = new WorkflowState();
await workflowState.load();

const __filename = fileURLToPath(import.meta.url);

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
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolList(),
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, (request) =>
  handleToolCall({
    request,
    normalizeRequestArgs,
    workflowState,
    exec,
    git: {
      hasWorkingChanges,
      hasTestChanges,
      hasStagedChanges,
      getStagedChanges,
      getCurrentBranch,
      getLastCommitMessage,
      workingTreeSummary,
    },
    utils: { shellEscape, determineReleaseTypeFromCommit, createCommitMessageParts },
  })
);

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
