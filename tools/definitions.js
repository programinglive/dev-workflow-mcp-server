export function getToolList() {
  return [
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
      name: "skip_tests",
      description:
        "Record that tests were intentionally skipped, with a justification.",
      inputSchema: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Why tests cannot be created or executed",
          },
        },
        required: ["reason"],
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
            description: "Optional branch name to push to (defaults to current branch)",
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
      name: "force_complete_task",
      description:
        "Force completion of the current task even if workflow steps are incomplete. Records history entry and resets the workflow.",
      inputSchema: {
        type: "object",
        properties: {
          commitMessage: {
            type: "string",
            description: "Commit message or summary to record (optional)",
          },
          reason: {
            type: "string",
            description: "Why the task was force completed",
          },
        },
      },
    },
    {
      name: "drop_task",
      description:
        "Abandon the current task and reset the workflow without completing it.",
      inputSchema: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Optional explanation for dropping the task",
          },
        },
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
    {
      name: "continue_workflow",
      description:
        "Get guidance on the next workflow step. Automatically performs the ready check when appropriate.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "rerun_workflow",
      description:
        "Reset and restart the current task from the beginning. Useful when you want to replay the entire workflow from start to finish.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ];
}
