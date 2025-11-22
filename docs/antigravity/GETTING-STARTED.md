# Getting Started with Dev-Workflow MCP Server in Antigravity

This guide will help you set up and use the dev-workflow MCP server in the Antigravity text editor.

## What is Dev-Workflow MCP Server?

The dev-workflow MCP server is a development discipline enforcer that guides you through proper software development workflows. It ensures you:

- ✅ Start with a clear task description
- ✅ Write tests for your changes
- ✅ Run tests (and block commits if they fail)
- ✅ Document your work
- ✅ Follow a structured commit and release process
- ✅ Track your development history

## Prerequisites

- **Node.js** (v18 or later)
- **Antigravity** text editor
- **Git** installed and configured
- Basic understanding of terminal commands

## Installation

### Option 1: Install in Your Project (Recommended)

This creates a project-specific workflow state:

```bash
cd your-project
npm install @programinglive/dev-workflow-mcp-server
```

This automatically creates `.state/workflow-state.json` in your project root.

### Option 2: Install from Source

```bash
git clone https://github.com/programinglive/dev-workflow-mcp-server.git
cd dev-workflow-mcp-server
npm install
```

## Configuration in Antigravity

Antigravity uses an MCP configuration file located at:

**Windows:** `%APPDATA%\Antigravity\mcp_config.json` or `C:\Users\<USERNAME>\.gemini\antigravity\mcp_config.json`

**macOS:** `~/Library/Application Support/Antigravity/mcp_config.json`

**Linux:** `~/.config/antigravity/mcp_config.json`

### Configuration File

Create or edit the `mcp_config.json` file:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": [
        "d:\\code\\dev-workflow-mcp-server\\index.js"
      ]
    }
  }
}
```

**Important Notes:**
- Use **absolute paths** to `index.js`
- On Windows, use **escaped backslashes** (`\\`) in JSON
- Restart Antigravity after editing the configuration

### Verify Installation

After restarting Antigravity, you should see dev-workflow tools available. You can verify by:

1. Opening Antigravity
2. Checking if MCP tools like `start_task`, `get_workflow_status` are available
3. Running `get_workflow_status` to see the initial state

## Your First Workflow

Let's walk through a complete development workflow:

### 1. Start a New Task

```
Use start_task to begin:
- description: "Add header component to landing page"
- type: "feature"
```

The MCP server responds with your task ID and current phase.

### 2. Write Your Code

Implement your feature as you normally would. The workflow doesn't interfere with your coding.

### 3. Mark as Fixed

Once you've completed the implementation:

```
Use mark_bug_fixed:
- summary: "Header component with logo and navigation menu"
```

### 4. Create Tests

The server will remind you to create tests. Write your tests, then:

```
Use create_tests (no parameters needed)
```

### 5. Run Tests

Execute your test suite and record the results:

```
Use run_tests:
- passed: true
- testCommand: "npm test"
- details: "All 25 tests passed"
```

> **Important:** If tests fail, the workflow will block you from proceeding!

### 6. Create Documentation

Update your documentation (README, inline comments, etc.):

```
Use create_documentation:
- documentationType: "README"
- summary: "Added header component documentation and usage examples"
```

### 7. Commit and Push

The server will automatically stage, commit, and push your changes:

```
Use commit_and_push:
- commitMessage: "feat: add header component with navigation"
```

The branch is auto-detected (main or master).

### 8. Perform Release

Record your release:

```
Use perform_release:
- command: "npm run release:patch"
- notes: "Released header component"
```

### 9. Complete Task

Finally, mark the task as complete:

```
Use complete_task:
- commitMessage: "feat: add header component with navigation"
```

## Antigravity vs. Windsurf

### Key Differences

| Feature | Antigravity | Windsurf |
|---------|-------------|----------|
| **Configuration** | `mcp_config.json` in `.gemini` | `config.json` in app data |
| **Tool Invocation** | Direct MCP tool calls | May use different interfaces |
| **Workflow State** | Per-user isolation with `DEV_WORKFLOW_USER_ID` | Shared state |
| **Path Format** | Windows requires `\\` escaping | Same |

### Avoiding Conflicts

If you use both Antigravity and Windsurf:

1. **Use separate user IDs** to isolate workflow states:
   
   ```bash
   # In Antigravity MCP config, add environment variable
   export DEV_WORKFLOW_USER_ID=antigravity-user
   
   # In Windsurf, use different ID
   export DEV_WORKFLOW_USER_ID=windsurf-user
   ```

2. **Don't run both simultaneously** on the same project to avoid state conflicts

3. **Use project-specific installations** to keep states isolated per project

## Common Workflows

### Quick Feature Development

For simple features, use `run_full_workflow`:

```
Use run_full_workflow with:
- summary: "Add contact form"
- testCommand: "npm test"
- documentationType: "README"
- documentationSummary: "Added contact form docs"
- commitMessage: "feat: add contact form"
- releaseCommand: "npm run release:minor"
- testsPassed: true
```

This executes all workflow steps in one go!

### Bug Fix Workflow

1. `start_task` with type "bugfix"
2. Fix the bug
3. `mark_bug_fixed`
4. Create regression tests
5. `create_tests`
6. `run_tests`
7. `create_documentation` (changelog)
8. `commit_and_push`
9. `perform_release`
10. `complete_task`

### When Tests Can't Be Automated

Sometimes automated tests aren't feasible (e.g., manual UI testing):

```
Use skip_tests:
- reason: "Mobile device testing requires manual QA on physical devices"
```

This flags the task for manual verification but allows the workflow to continue.

## Checking Your Status

At any time, check where you are:

```
Use get_workflow_status
```

This shows:
- Current task description
- Active phase (implementation, testing, documentation, etc.)
- Completed steps
- Next required step

## Viewing History

See your completed tasks:

```
Use view_history:
- limit: 10
```

This displays your recent workflow completions.

## Next Steps

- Read [EXAMPLES.md](./EXAMPLES.md) for detailed real-world examples
- Check [WORKFLOW-TEMPLATES.md](./WORKFLOW-TEMPLATES.md) for ready-to-use templates
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if you encounter issues

## Tips for Success

1. **Always start with `start_task`** - This clarifies your intention
2. **Never skip tests** - They're mandatory for production code
3. **Use conventional commit messages** - e.g., `feat:`, `fix:`, `docs:`
4. **Keep tasks focused** - One feature/bugfix per workflow
5. **Check status frequently** - Use `get_workflow_status` to stay on track
6. **Review history** - Learn from your past workflows

## Getting Help

- **Documentation:** [Main README](../../README.md)
- **GitHub Issues:** [Report bugs or request features](https://github.com/programinglive/dev-workflow-mcp-server/issues)
- **Troubleshooting:** [Common issues and solutions](./TROUBLESHOOTING.md)

---

**Ready to enforce development discipline with Antigravity? Start your first workflow now!** 🚀
