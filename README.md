# Development Workflow MCP Server

An MCP (Model Context Protocol) server that helps enforce development discipline and workflow best practices. This server acts as your coding conscience, reminding you to follow proper development workflows.

## 🎯 Purpose

This MCP server guides you through a disciplined development workflow:

1. **Start Conscious** - Be clear about what you're coding
2. **Fix/Implement** - Write your code
3. **Create Tests** - Always test your changes
4. **Run Tests** - Tests must pass (GREEN)
5. **Document** - Update documentation
6. **Commit & Push** - Let the server stage, commit, **and push** your changes once verification passes (if you make new edits afterward, the workflow moves back to this step automatically)
7. **Release** - After the push succeeds, record the release details before closing out the task

## 🚀 Installation

### Option 1: Install as Dependency in Your Project (Recommended)

Each project gets its own isolated workflow state file.

```bash
npm install @programinglive/dev-workflow-mcp-server
```

This will automatically create a `.workflow-state.json` file in your project root, keeping workflow history separate per project.

### Option 2: Install from Source

```bash
git clone https://github.com/programinglive/dev-workflow-mcp-server.git
cd dev-workflow-mcp-server
npm install
```

### 3. Configure in Windsurf/Claude Desktop

Point your MCP client to the server entry point. Replace `<PROJECT_ROOT>` with the absolute path to this repository on your machine.

#### macOS

- **Windsurf** (`~/Library/Application Support/Windsurf/config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>/index.js"]
    }
  }
}
```

- **Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>/index.js"]
    }
  }
}
```

#### Windows

- **Windsurf** (`%APPDATA%\Windsurf\config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>\\index.js"]
    }
  }
}
```

- **Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>\\index.js"]
    }
  }
}
```

#### Linux

- **Windsurf** (`~/.config/windsurf/config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>/index.js"]
    }
  }
}
```

- **Claude Desktop** (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>/index.js"]
    }
  }
}
```

> **Note:** On Windows paths in JSON require escaped backslashes (e.g., `"C:\\path\\to\\project"`).

### 4. Restart Windsurf/Claude Desktop

After adding the configuration, restart the application to load the MCP server.

## 📁 Project-Specific Workflow State

When you install this package in a project, a `.workflow-state.json` file is automatically created in your project root. This file:

- **Stores workflow history** specific to that project
- **Tracks task progress** independently per project
- **Should be gitignored** (already in `.gitignore` by default)
- **Persists across sessions** so your workflow state is preserved

Each project maintains its own isolated workflow history, so you can work on multiple projects without mixing their histories.

### Adding to .gitignore

If you're using this package, add this to your project's `.gitignore`:

```
.workflow-state.json
```

This keeps workflow state local to each developer's machine.

## 🛠️ Available Tools

### Tool Argument Requirements

All tool invocations validate their `arguments` payload before running:
- Strings are parsed as JSON and must resolve to an object (key/value pairs).
- Passing non-object data (numbers, arrays, plain text) triggers a guidance error.
- Missing or malformed arguments safely default to empty input so the tool can respond with actionable reminders.

Example (stringified JSON object):
```
{
  "name": "start_task",
  "arguments": "{\"description\":\"Add reporting endpoint\",\"type\":\"feature\"}"
}
```

### `start_task`
Start a new coding task. This is your first step - be conscious about what you're coding.

**Parameters:**
- `description` (string, required): Clear description of what you're going to code
- `type` (enum, required): Type of task - "feature", "bugfix", "refactor", or "other"

**Example:**
```
Use the start_task tool with:
- description: "Add user authentication to the login page"
- type: "feature"
```

### `mark_bug_fixed`
Mark that the bug/feature is fixed. **Reminder: Now you MUST create tests!**

**Parameters:**
- `summary` (string, required): Brief summary of what was fixed/implemented

### `create_tests`
Confirm that you've created the necessary tests covering your change. Required before recording test results.

**Parameters:** _none_

### `skip_tests`
Record an explicit justification when automated tests aren't feasible. Marks testing as satisfied so you can proceed with documentation and verification, while flagging the task for manual QA.

**Parameters:**
- `reason` (string, required): Why automated tests were skipped

### `run_tests`
Record test results. **NEVER commit if tests fail!** Only proceed if all tests are green.

**Parameters:**
- `passed` (boolean, required): Did all tests pass?
- `testCommand` (string, required): The test command that was run
- `details` (string, optional): Test results details

**Example:**
```
Use run_tests with:
- passed: true
- testCommand: "npm test"
- details: "All 15 tests passed"
```

### `create_documentation`
Mark that documentation has been created/updated. This is required before committing.

**Parameters:**
- `documentationType` (enum, required): "README", "inline-comments", "API-docs", "changelog", or "other"
- `summary` (string, required): What was documented

### `check_ready_to_commit`
Check if all workflow steps are completed and you're ready to commit & push.

### `commit_and_push`
Automatically run `git add`, `git commit`, and `git push` after the ready check passes.

**Parameters:**
- `commitMessage` (string, required): Conventional commit message to use
- `branch` (string, optional): Target branch to push (defaults to current branch)

### `perform_release`
Record the release after you've committed and pushed. Required before you can complete the task.

**Parameters:**
- `command` (string, required): Release command that was executed (e.g., `npm run release`)
- `notes` (string, optional): Additional release notes

### `complete_task`
Mark the task as complete after successful commit & push. Resets workflow for next task.

**Parameters:**
- `commitMessage` (string, required): The commit message used

### `drop_task`
Abandon the current task without completing the workflow. Preserves an audit entry with context, then resets the state so you can start fresh.

**Parameters:**
- `reason` (string, optional): Additional detail about why the task was dropped

### `get_workflow_status`
Get current workflow status and what needs to be done next.

### `view_history`
View workflow history of completed tasks.

**Parameters:**
- `limit` (number, optional): Number of recent tasks to show (default: 10)

## 📋 Available Prompts

### `workflow_reminder`
Get a complete reminder of the development workflow discipline.

### `pre_commit_checklist`
Get a pre-commit checklist to ensure nothing is missed before committing.

## 🔄 Typical Workflow

Here's how you'd use this MCP server in a typical coding session:

1. **Start your task:**
   ```
   Ask Cascade to use start_task:
   "Start a new task: implementing user profile page, type: feature"
   ```

2. **Code your feature/fix**
   - Write your code as usual

3. **Mark as fixed:**
   ```
   "Mark the feature as fixed: User profile page with avatar and bio completed"
   ```

4. **Create tests:**
   - Write your tests
   - The server will remind you this is mandatory!

5. **Run tests:**
   ```
   "Record test results: passed=true, command='npm test'"
   ```
   - If tests fail, the server will **block** you from proceeding!

7. **Document:**
   ```
   "Create documentation: type=README, summary='Added user profile section to docs'"
   ```

8. **Check readiness:**
   ```
   "Check if I'm ready to commit"
   ```

9. **Commit & Push:**
   ```
   "Commit and push: commitMessage='feat: add user profile page with tests and docs'"
   ```

10. **Record release:**
   ```
   "Record release: command='npm run release', notes='v1.2.3'"
   ```

11. **Complete:**
   ```
   "Complete the task with commit message: 'feat: add user profile page'"
   ```

12. **Drop task (optional):**
   ```
   "Drop task: reason='Switching to a different feature'"
   ```

## 🎯 Key Features

- **Enforces discipline**: Won't let you skip steps
- **Test-driven**: Blocks commits if tests fail
- **Documentation reminder**: Ensures you document your work
- **State tracking**: Remembers where you are in the workflow
- **History**: Keeps track of completed tasks
- **Prompts**: Quick reminders of best practices

## 🚫 What This Server Prevents

- ❌ Committing without tests
- ❌ Committing with failing tests
- ❌ Committing without documentation
- ❌ Losing track of what you're working on
- ❌ Skipping important workflow steps

## 💡 Tips

1. **Always start with `start_task`** - This sets your intention
2. **Never skip tests without justification** - Use `skip_tests` only when absolutely necessary and document the reason for manual QA
3. **Use `get_workflow_status`** - Check where you are anytime
4. **Review history** - Learn from your past tasks
5. **Follow the prompts** - They contain best practices

## 🔧 Customization

You can modify the workflow in `index.js`:
- Add more workflow phases
- Customize reminders
- Add integration with your test runner
- Add custom validation rules

## 📝 State Management

The server maintains state in `.workflow-state.json`:
- Current phase
- Task description
- Completion status of each step
- History of completed tasks

This file is automatically created and managed by the server.
It contains local, machine-specific progress and is ignored by git so each environment can manage its own workflow history without cross-contamination.

## 🤝 Integration with Your Rules

This MCP server aligns with your existing development rules:
- ✅ Enforces test-first discipline
- ✅ Prevents commits with failing tests
- ✅ Reminds about documentation
- ✅ Tracks workflow state
- ✅ Maintains history

## 📄 License

MIT

## 🙏 Contributing

Feel free to customize this server to match your specific workflow needs!

## 📜 Project Governance

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [License](./LICENSE)
