# Development Workflow MCP Server

An MCP (Model Context Protocol) server that helps enforce development discipline and workflow best practices. This server acts as your coding conscience, reminding you to follow proper development workflows.

## 🎯 Purpose

This MCP server guides you through a disciplined development workflow:

1. **Start Conscious** - Be clear about what you're coding
2. **Fix/Implement** - Write your code
3. **Create Tests** - Always test your changes
4. **Run Tests** - Tests must pass (GREEN)
5. **Document** - Update documentation
6. **Commit & Push** - Only when all steps are complete

## 🚀 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure in Windsurf/Claude Desktop

Add to your MCP settings file:

**For Windsurf** (`~/Library/Application Support/Windsurf/config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["/Users/mahardhika/code/project/mine/app/CascadeProjects/windsurf-project/index.js"]
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["/Users/mahardhika/code/project/mine/app/CascadeProjects/windsurf-project/index.js"]
    }
  }
}
```

### 3. Restart Windsurf/Claude Desktop

After adding the configuration, restart the application to load the MCP server.

## 🛠️ Available Tools

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

### `complete_task`
Mark the task as complete after successful commit & push. Resets workflow for next task.

**Parameters:**
- `commitMessage` (string, required): The commit message used

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

6. **Document:**
   ```
   "Create documentation: type=README, summary='Added user profile section to docs'"
   ```

7. **Check readiness:**
   ```
   "Check if I'm ready to commit"
   ```

8. **Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: add user profile page with tests and docs"
   git push
   ```

9. **Complete:**
   ```
   "Complete the task with commit message: 'feat: add user profile page'"
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
2. **Never skip tests** - The server will remind you!
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
