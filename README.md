# Development Workflow MCP Server

<p align="left">
  <a href="https://www.npmjs.com/package/@programinglive/dev-workflow-mcp-server"><img src="https://img.shields.io/npm/v/@programinglive/dev-workflow-mcp-server.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@programinglive/dev-workflow-mcp-server"><img src="https://img.shields.io/npm/dm/@programinglive/dev-workflow-mcp-server.svg" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license: MIT"></a>
</p>

An MCP (Model Context Protocol) server that helps enforce development discipline and workflow best practices. This server acts as your coding conscience, reminding you to follow proper development workflows.

### 🛡️ Resilience Features
- **Startup Resilience**: 5-second connection timeouts for external databases.
- **Background Loading**: Non-critical assets (compatibility mirrors) initialize in the background to ensure sub-second startup.
- **Diagnostic Mode**: Automatic startup timing logs displayed in stderr.

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

This will automatically create a `.state/workflow-state.json` file in the **project where you ran `npm install`** (using npm's `INIT_CWD`), keeping workflow history separate per project. If you're installing the package itself (inside `node_modules`), the script skips creation so it never pollutes the shared package directory.

### Option 2: Install from Source

```bash
git clone https://github.com/programinglive/dev-workflow-mcp-server.git
cd dev-workflow-mcp-server
npm install
```

> **Windows prerequisites:** Installing dependencies from source compiles native modules such as `better-sqlite3`. Make sure Python 3 (added to PATH) and the Visual Studio Build Tools “Desktop development with C++” workload are installed before running `npm install`. Without them, npm will fail with a “need python” or build error.

### Option 3: Install on Plesk Hosting

Plesk supports Node.js applications through its Node.js extension. To deploy the MCP server on a Plesk subscription:

1. **Enable Node.js support** – Ensure the Plesk administrator has installed the Node.js extension and enabled SSH access for your subscription.
2. **Upload the project** – Either clone the repository or upload an archive into the directory you will run it from (e.g., `httpdocs/dev-workflow-mcp-server`). From SSH you can run:
   ```bash
   cd httpdocs
   git clone https://github.com/programinglive/dev-workflow-mcp-server.git
   cd dev-workflow-mcp-server
   ```
3. **Install dependencies** – In Plesk’s **Node.js** panel use “NPM install” (or run `npm install --production` over SSH). Linux hosts already ship the Python/build toolchain required for `better-sqlite3`; if your plan uses a Windows host, install Python 3 and the Visual Studio Build Tools beforehand or ask your provider to enable them.
4. **Define environment variables** – In the Node.js panel add any environment variables you need (for example `DEV_WORKFLOW_USER_ID` or `DEV_WORKFLOW_STATE_FILE`). This keeps state files outside the web root if desired.
5. **Configure the application** – Set **Application startup file** to `index.js` and **Application mode** to `production`. Plesk will run the server with `node index.js`.
6. **Start/Restart the app** – Click “Restart App” so Plesk launches the MCP server with the new configuration. When you update the code, rerun “NPM install” and restart.

> **Tip:** The MCP server communicates over stdio. If you only need it as a CLI tool, you can also run `npx @programinglive/dev-workflow-mcp-server` directly in an SSH session without keeping it running under the Node.js panel.

> **Important:** MCP clients (Windsurf, Claude Desktop, etc.) must launch the server process locally via stdio. Hosting the dashboard on a public domain does **not** expose the MCP interface. Without SSH or another way to execute `node index.js` on the server, users cannot connect their MCP clients to the hosted instance.

### Option 4: Deploy with Docker on Google Cloud

Deploy the MCP server to Google Cloud Compute Engine using Docker and PostgreSQL for a production-ready, cloud-hosted setup.

**Quick Start:**
1. SSH into your GCP instance
2. Run the setup script: `bash scripts/setup-gcp-instance.sh`
3. Clone the repository and configure `.env`
4. Start containers: `docker-compose up -d`
5. Update your local MCP client config to connect via SSH

**Benefits:**
- ✅ PostgreSQL database for robust data persistence
- ✅ Containerized deployment for consistency
- ✅ Remote access via SSH tunneling
- ✅ Easy updates and rollbacks

See the [GCP Deployment Guide](./docs/GCP_DEPLOYMENT.md) for complete step-by-step instructions.


#### Two Usage Modes

- **Local (source)**: Point your MCP client to `index.js`. This runs directly from source and requires no build step. Recommended for MCP usage.
- **Production (built)**: Run `npm run build` once to generate `dist/`. This creates an optimized bundle but isn’t needed for MCP usage.

### 3. Configure in Windsurf/Claude Desktop

Point your MCP client to the server entry point. Replace `<PROJECT_ROOT>` with the absolute path to this repository on your machine.

#### macOS

- **Windsurf** (`~/Library/Application Support/Windsurf/config.json`):

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "cwd": "<PROJECT_ROOT>",
      "args": ["index.js"],
      "env": {
        "DEV_WORKFLOW_DB_TYPE": "postgres",
        "DEV_WORKFLOW_DB_URL": "postgres://USER:PASS@HOST:5432/devworkflow"
      }
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

#### Full Windsurf MCP Config Example (macOS)

If you keep this repository checked out at `/Users/alex/code/dev-workflow-mcp-server` and want to point Windsurf at a hosted PostgreSQL instance, drop the following into `~/Library/Application Support/Windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "cwd": "/Users/alex/code/dev-workflow-mcp-server",
      "args": ["index.js"],
      "env": {
        "DEV_WORKFLOW_DB_TYPE": "postgres",
        "DEV_WORKFLOW_DB_URL": "postgres://devworkflow:devworkflow_secure_password@34.50.121.142:5432/devworkflow"
      }
    }
  }
}
```

This mirrors the Windows configuration shared in previous releases, but avoids `npx` lookup issues on macOS by launching the local `index.js` directly.

### 4. Restart Windsurf/Claude Desktop

After adding the configuration, restart the application to load the MCP server.


### 5. Configure in Antigravity

Antigravity users should configure the MCP server in their `mcp_config.json`.

**Windows:** `%APPDATA%\Antigravity\mcp_config.json` or `C:\Users\<USERNAME>\.gemini\antigravity\mcp_config.json`

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

See [Antigravity Getting Started](./docs/antigravity/GETTING-STARTED.md) for detailed instructions and troubleshooting.

### ⚡ Performance Optimization (Recommended)

To ensure the fastest possible startup (critical for IDE-integrated clients like Claude Desktop), we recommend pointing directly to `index.js` using `node` rather than `npx`. This avoids the overhead of checking for package updates.

**Optimized Configuration:**

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["<PROJECT_ROOT>\\index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "your_user_id"
      }
    }
  }
}
```

The server automatically times its own startup and logs it to stderr:
`Dev Workflow MCP Server running on stdio (startup took 15ms)`

## ⚙️ Configuration

### Database Setup

The server supports **SQLite** (default), **MySQL**, and **PostgreSQL**.

#### Configuration via `.env`
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your settings:
   ```ini
   DEV_WORKFLOW_DB_TYPE=mysql
   DEV_WORKFLOW_DB_URL=mysql://user:pass@localhost:3306/db
   ```

#### Configuration via Environment Variables
Alternatively, export variables directly:.

| Variable | Description | Default |
|----------|-------------|---------|
| `DEV_WORKFLOW_DB_TYPE` | Database driver (`sqlite`, `mysql`, `postgres`) | `sqlite` |
| `DEV_WORKFLOW_DB_URL` | Connection string for MySQL/Postgres | `null` |
| `DEV_WORKFLOW_DB_PATH` | Override path for the SQLite database file | `<project>/.state/dev-workflow.db` |

#### Examples

**MySQL:**
```bash
export DEV_WORKFLOW_DB_TYPE=mysql
export DEV_WORKFLOW_DB_URL="mysql://user:password@localhost:3306/dev_workflow"
```

**PostgreSQL:**
```bash
export DEV_WORKFLOW_DB_TYPE=postgres
export DEV_WORKFLOW_DB_URL="postgresql://user:password@localhost:5432/dev_workflow"
```

#### 🛠️ Database Schema Normalization (Postgres/MySQL)
To ensure compatibility with existing reporting dashboards, the `PostgresAdapter` and `MysqlAdapter` automatically normalize column names:
- `task_description` → DB column: `description`
- `timestamp` → DB column: `completed_at`

The adapters use aliases in queries so the MCP tools still receive the expected `task_description` and `timestamp` fields.

#### 👤 User ID Handling (Postgres/MySQL)
These databases use an `INTEGER` column for `user_id`.
- **Numeric strings** (e.g., `"1"`) are parsed directly into integers.
- **Non-numeric strings** (e.g., `"programinglive"`) are automatically hashed into a consistent, positive integer to ensure compatibility with the schema while maintaining unique user isolation.


### User & State Management

| Variable | Description |
|----------|-------------|
| `DEV_WORKFLOW_USER_ID` | Override the auto-generated user ID (e.g., set to your name/email) |
| `DEV_WORKFLOW_STATE_FILE` | Override the location of the `workflow-state.json` file |

### Using Multiple Clients (Antigravity & Windsurf)

If you use multiple AI coding tools simultaneously (e.g., Antigravity and Windsurf) on the same project, they will share the same workflow state by default.

To maintain **separate, distinct sessions** for each tool, configure a unique `DEV_WORKFLOW_USER_ID` for each.

**Antigravity Config (`mcp_config.json`):**
```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["path/to/server/index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "antigravity_user"
      }
    }
  }
}
```

**Windsurf Config:**
Add the environment variable in your Windsurf MCP settings:
```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["path/to/server/index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "windsurf_user"
      }
    }
  }
}
```



### ✅ Testing

The project uses Node.js native test runner (`node --test`).

```bash
npm test
```

This runs:
- Unit tests for workflow logic
- Integration tests for `.env` configuration
- DB Adapter tests (SQLite always; MySQL/Postgres if configured)

#### Testing Database Adapters
To verify MySQL or PostgreSQL adapters, run tests with the environment variable set:

```bash
# Test MySQL
export DEV_WORKFLOW_DB_URL="mysql://root:pass@localhost:3306/test_db"
node --test tests/db-adapters.test.js

# Test PostgreSQL
export DEV_WORKFLOW_DB_URL="postgres://postgres:pass@localhost:5432/test_db"
node --test tests/db-adapters.test.js
```

### Scripts

- `npm run build` - Bundle the source into `dist/index.mjs` for distribution
- `npm run dev` - Run in development mode with file watching
- `npm run local` - Alias for running from source (same as `npm start`)
- `npm run web` - Launch the lightweight workflow dashboard for browsing task history (see [Web Dashboard docs](./docs/web-dashboard.md))

#### `npm run web`

This command starts the dashboard defined in `web/server.js`, giving you a quick view of workflow history and summary statistics.

```bash
npm run web
# 🌐 Dev Workflow Dashboard running at http://localhost:3111
```

- **Default port:** 3111 (or the next free port if occupied).
- **Environment overrides:** Honors `PORT` (common on hosts like Plesk/Render) or `DEV_WORKFLOW_WEB_PORT` before falling back to auto-selection.
- **Query parameter:** `?user=<id>` lets you inspect another user’s history (defaults to `default`).
- **API endpoints:**
  - `GET /api/version` → current package version from `package.json` (used by dashboard to display version dynamically).
  - `GET /api/summary?user=<id>` → overall stats for the user.
  - `GET /api/history?user=<id>&page=1&pageSize=20&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` → paginated task history.
  - `GET /api/history-summary?user=<id>&frequency=daily|monthly|yearly` → aggregated counts over time.

Open `http://localhost:3111` in a browser to view the dashboard UI (`web/index.html`).

### Build Output

Running `npm run build` generates:
- `dist/index.mjs` - Optimized ES module bundle
- Source maps and other build artifacts
- `dist/docs/` - Pre-rendered HTML documentation generated from Markdown via `scripts/build-docs.js`

The build bundles all source files while externalizing Node.js built-in modules and dependencies, resulting in a single file distribution.

### Usage

For MCP server usage, point your client at `index.js` (source) to avoid stdio transport compatibility issues. The built `dist/index.mjs` is primarily for:
- npm package distribution
- Performance optimization
- Embedding in other projects

### MCP Tools Registry (Publishing)

This package is configured for the official MCP Tools Registry using **npm package deployment**:

- `package.json` declares `mcpName: "io.github.programinglive/dev-workflow-mcp-server"`.
- `server.json` describes the server and links it to the npm package `@programinglive/dev-workflow-mcp-server`.

To publish a new server version to the registry:

1. Release a new npm version (for example):
   - `npm test`
   - `npm run release:patch` (runs your existing release pipeline and publishes to npm)
2. Verify the new version exists on npm:
   - `npm view @programinglive/dev-workflow-mcp-server version`
3. Install the MCP publisher CLI (once per machine):
   - `brew install mcp-publisher` (or follow the docs at https://modelcontextprotocol.info/tools/registry/publishing/)
4. From this repo root, authenticate and publish:
   - `mcp-publisher login github`
   - `mcp-publisher publish`
5. Optionally verify in the registry:
   - `curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.programinglive/dev-workflow-mcp-server"`

#### PowerShell CLI tip

When invoking the lightweight CLI from PowerShell, use `--%` to prevent PowerShell from rewriting JSON arguments, for example:

```powershell
node --% index.js call start_task --args "{\"description\":\"Convert docs to HTML during build\",\"type\":\"feature\"}"
```

The `--%` prefix and escaped double quotes ensure the JSON reaches the MCP server unchanged.

## 📁 Project-Specific Workflow State

When you install this package in a project, a `.state/workflow-state.json` file is automatically created in your project root. This file:

- **Stores workflow history** specific to that project
- **Tracks task progress** independently per project
- **Should be gitignored** (already in `.gitignore` by default)
- **Persists across sessions** so your workflow state is preserved
- **Stays centralized** even if you run the server from nested build outputs like `dist/`. The MCP server walks back to the project root (looking for `.git` or `package.json`) before reading or writing workflow state, so you never need duplicate copies under build directories.

Each project maintains its own isolated workflow history, so you can work on multiple projects without mixing their histories. Within that `.state` directory, the MCP server automatically creates a unique per-user subdirectory (e.g., `.state/users/user-abc123/`). The generated identifier persists locally so multiple developers sharing the same repository never clobber each other’s workflow files. If you prefer a specific name, set `DEV_WORKFLOW_USER_ID` before launching the server and that value will be used instead of the auto-generated ID.

#### Choosing a User ID

Use cases:

1. **Let the server choose** – Do nothing and the first time you run any MCP tool the server creates `.state/users/<random-id>/`. The dashboard `User ID` filter accepts that value (visible in the folder name or in workflow responses).
2. **Set an explicit ID** – Before starting the server, export `DEV_WORKFLOW_USER_ID`:

   ```bash
   # macOS/Linux
   export DEV_WORKFLOW_USER_ID=alice
   node index.js

   # Windows PowerShell
   $env:DEV_WORKFLOW_USER_ID = "alice"
   node index.js
   ```

   Now all history for that session lands in `.state/users/alice/` and the dashboard can be filtered with `alice`.
3. **Multiple users on one host** – Run separate processes (or MCP clients) with different `DEV_WORKFLOW_USER_ID` values. Each user’s workflow state remains isolated.

> **Tip:** The web dashboard simply reads existing records. Typing a new value into the `User ID` filter will only return results after a workflow session has written history into `.state/users/<that-id>/`.

### Adding to .gitignore

If you're using this package, add this to your project's `.gitignore`:

```
.state/
```

This keeps workflow state local to each developer's machine.

> **Need to override the location?** Set `DEV_WORKFLOW_STATE_FILE=/absolute/path/to/your/project/.state/workflow-state.json` before launching the server (or inside your MCP client config). The server will honor that path, letting you keep the package installed centrally while maintaining per-project workflow history.

## 🛠️ Available Tools

- `start_task` - Begin a new coding task
- `mark_bug_fixed` - Mark the feature/bug as fixed (requires tests next)
- `create_tests` - Mark that tests have been created
- `skip_tests` - Skip tests with justification
- `run_tests` - Record test results (must pass to proceed)
- `create_documentation` - Mark documentation as created
- `check_ready_to_commit` - Verify all steps are complete
- `commit_and_push` - Commit and push changes
- `perform_release` - Record release details
- `complete_task` - Mark task as complete and reset
- `force_complete_task` - Force completion with reason
- `drop_task` - Abandon current task
- `get_workflow_status` - Show current status
- `view_history` - View completed tasks
- `continue_workflow` - Get next-step guidance
- `rerun_workflow` - Reset and restart the current task from the beginning
- `run_full_workflow` - Execute every workflow step in sequence with a single command (requires supplying the details for each phase)

### `run_full_workflow`

Use this when you already have all the information needed for each workflow phase and want to execute them in one go.

```json
{
  "summary": "Add payment webhooks",
  "testCommand": "npm test",
  "documentationType": "README",
  "documentationSummary": "Document webhook configuration",
  "commitMessage": "feat: add payment webhooks",
  "releaseCommand": "npm run release:minor",
  "releaseNotes": "Release webhook support",
  "branch": "feature/payments",
  "testsPassed": true,
  "testDetails": "node --test; 42 tests",
  "releaseType": "minor",
  "preset": "minor"
}
```

The tool will:

1. `mark_bug_fixed` using `summary`
2. `create_tests`
3. `run_tests` with `testsPassed`, `testCommand`, and optional `testDetails`
4. `create_documentation` with `documentationType` and `documentationSummary`
   - **Requires**: `docs/product/PRD.md` must exist before documentation can be marked complete
5. `check_ready_to_commit`
6. `commit_and_push` with `commitMessage` and optional `branch`
7. `perform_release` with `releaseCommand`, plus optional `releaseNotes`, `releaseType`, and `preset`
8. `complete_task` reusing `commitMessage`

All arguments except the optional flags are required and must be non-empty strings.

### Documentation Requirements

The `create_documentation` step enforces that a PRD (Product Requirements Document) exists at `docs/product/PRD.md` before documentation can be marked as complete. This ensures all projects maintain a current PRD that describes the product's goals, features, and requirements.

## 🚫 Releasing Without the Workflow Steps

The package ships with a release guard (`release-wrapper.js`) that backs the `npm run release:*` scripts. The guard refuses to run unless:

- The current workflow phase is **release**
- `check_ready_to_commit` and `commit_and_push` have been completed
- A release has not already been recorded for the active task

If any requirements are missing, the guard exits with guidance to return to the MCP tools. This prevents accidentally bumping versions or tagging releases outside the managed workflow. To release correctly:

1. Use `perform_release {"command":"patch"}` (or `minor`/`major`) via the MCP client.
2. The guard runs automatically, verifies the workflow state, and records the release before letting you finish with `complete_task`.

### Automated npm Publishing

This repository ships with `.github/workflows/npm-publish.yml`, which publishes the package to npm whenever a git tag matching `v*` is pushed (for example, `v1.1.14`). To enable the workflow:

1. Create an npm automation token with publish rights (`npm token create --read-only false`).
2. In the repository settings, add a secret named **`NPM_TOKEN`** containing that token.
3. Ensure your release process pushes tags after running `npm run release:<type>` so the workflow triggers.
4. Confirm `npm run build` succeeds locally; the workflow runs the build before publishing so broken bundles block the release.
5. GitHub provenance is enabled via `npm publish --provenance`. Leave GitHub Actions' default OIDC permissions enabled so the job can request an ID token.
6. Keep the `repository.url` field in `package.json` pointing at this GitHub repo. Provenance validation fails if it does not match the repository that built the package.

The workflow verifies that the tag version matches `package.json` before publishing and fails fast if they diverge.

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
- `documentationType` (enum, required): "PRD", "README", "RELEASE_NOTES", "inline-comments", "API-docs", "changelog", or "other"
- `summary` (string, required): What was documented

### `check_ready_to_commit`
Check if all workflow steps are completed and you're ready to commit & push.

### `commit_and_push`
Automatically run `git add`, `git commit`, and `git push` after the ready check passes.

**Auto-detection of primary branch:** If no `branch` is specified, the tool automatically detects your project's primary branch by checking for `origin/main` first, then falling back to `origin/master`. This eliminates the need to specify the branch parameter for most projects.

**Parameters:**
- `commitMessage` (string, required): Conventional commit message to use
- `branch` (string, optional): Target branch to push. If omitted, auto-detects primary branch (main or master)

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

The server maintains state in `.state/workflow-state.json`:
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
