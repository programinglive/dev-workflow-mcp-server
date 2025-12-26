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
            enum: ["PRD", "README", "RELEASE_NOTES", "inline-comments", "API-docs", "changelog", "other"],
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
      name: "skip_release",
      description:
        "Record that the release step was intentionally skipped (e.g., non-Node projects or documentation-only work). Requires a justification.",
      inputSchema: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Why the release step is being skipped",
          },
        },
        required: ["reason"],
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
    {
      name: "run_full_workflow",
      description:
        "Execute every workflow step in sequence using the provided arguments (mark fixed → tests → run tests → docs → ready check → commit → release → complete).",
      inputSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Brief summary recorded when marking the bug/feature as fixed",
          },
          testsPassed: {
            type: "boolean",
            description: "Whether tests passed (defaults to true)",
          },
          testCommand: {
            type: "string",
            description: "Command used to run tests",
          },
          testDetails: {
            type: "string",
            description: "Additional test output or notes",
          },
          documentationType: {
            type: "string",
            enum: ["PRD", "README", "RELEASE_NOTES", "inline-comments", "API-docs", "changelog", "other"],
            description: "Type of documentation created",
          },
          documentationSummary: {
            type: "string",
            description: "Summary of documentation updates",
          },
          commitMessage: {
            type: "string",
            description: "Commit message used for commit_and_push and complete_task",
          },
          branch: {
            type: "string",
            description: "Optional branch name to push to",
          },
          releaseCommand: {
            type: "string",
            description: "Release command executed during perform_release",
          },
          releaseNotes: {
            type: "string",
            description: "Optional release notes to record",
          },
          releaseType: {
            type: "string",
            description: "Optional release type override (major/minor/patch)",
          },
          preset: {
            type: "string",
            description: "Optional preset argument for perform_release",
          },
        },
        required: [
          "summary",
          "testCommand",
          "documentationType",
          "documentationSummary",
          "commitMessage",
          "releaseCommand",
        ],
      },
    },
    {
      name: "project_summary",
      description:
        "Get a project knowledge summary that aggregates completed tasks, task types, and recent activity to help understand the project and fix bugs faster over time.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "project_summary_data",
      description:
        "Get the persisted project knowledge summary from a structured JSON file (project-summary.json). Falls back to in-memory if the file doesn't exist. This file can be used as a simple database for future features.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "project_summary_db",
      description:
        "Get the per-user project knowledge summary from SQLite. Use DEV_WORKFLOW_USER_ID env var to isolate users.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ];
}
