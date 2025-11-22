# Troubleshooting Dev-Workflow MCP Server in Antigravity

Common issues and solutions when using dev-workflow MCP server with Antigravity.

## Table of Contents

- [MCP Server Not Appearing](#mcp-server-not-appearing)
- [Workflow State Conflicts](#workflow-state-conflicts)
- [Git Conflicts with Automated Commits](#git-conflicts-with-automated-commits)
- [Path Resolution Issues on Windows](#path-resolution-issues-on-windows)
- [SQLite Database Locking](#sqlite-database-locking)
- [Multi-User Workflow Isolation Problems](#multi-user-workflow-isolation-problems)
- [Windsurf Editor Conflicts](#windsurf-editor-conflicts)
- [Tests Not Running](#tests-not-running)
- [Commit and Push Failures](#commit-and-push-failures)

---

## MCP Server Not Appearing

### Symptoms
- Dev-workflow tools not visible in Antigravity
- MCP server commands not available
- No response when trying to use workflow tools

### Solutions

#### 1. Verify Configuration Path

Check that `mcp_config.json` is in the correct location:

**Windows:**
```powershell
# Check if file exists
Test-Path "C:\Users\$env:USERNAME\.gemini\antigravity\mcp_config.json"

# Or alternative location
Test-Path "$env:APPDATA\Antigravity\mcp_config.json"
```

**macOS/Linux:**
```bash
# Check config file
ls -la ~/.gemini/antigravity/mcp_config.json
# or
ls -la ~/Library/Application\ Support/Antigravity/mcp_config.json
```

#### 2. Validate JSON Syntax

Ensure `mcp_config.json` has valid JSON:

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

Common mistakes:
- ❌ Missing quotes around strings
- ❌ Trailing commas
- ❌ Single quotes instead of double quotes
- ❌ Unescaped backslashes on Windows

Use a JSON validator: `node -e "console.log(JSON.parse(require('fs').readFileSync('path/to/mcp_config.json')))"`

#### 3. Check Node.js Path

Verify Node.js is accessible:

```bash
node --version
```

If not found, specify full Node.js path in config:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"]
    }
  }
}
```

#### 4. Verify Server Path

Check that `index.js` exists:

```powershell
# Windows
Test-Path "d:\code\dev-workflow-mcp-server\index.js"
```

```bash
# macOS/Linux
ls -la /path/to/dev-workflow-mcp-server/index.js
```

#### 5. Restart Antigravity

After configuration changes, **fully restart Antigravity**:
1. Close all Antigravity windows
2. Quit from system tray if present
3. Reopen Antigravity

#### 6. Check Server Logs

Run the server manually to see errors:

```bash
cd d:\code\dev-workflow-mcp-server
node index.js
```

Look for error messages. Common issues:
- Missing dependencies (`npm install`)
- Permission errors
- Port conflicts

---

## Workflow State Conflicts

### Symptoms
- Workflow shows incorrect phase
- History from different projects appearing
- State not persisting between sessions

### Solutions

#### 1. Check State File Location

Verify state file exists:

```bash
# In your project directory
ls -la .state/workflow-state.json
```

If missing, the server creates it on first use.

#### 2. Reset Workflow State

If state is corrupted:

```bash
# Backup existing state
cp .state/workflow-state.json .state/workflow-state.json.backup

# Start fresh (server recreates on next use)
rm .state/workflow-state.json
```

Re-run `get_workflow_status` to initialize.

#### 3. Per-Project Isolation

Ensure each project has its own state:

```bash
# Project A
cd ~/projects/app-frontend
npm install @programinglive/dev-workflow-mcp-server
# Creates .state/ in app-frontend/

# Project B
cd ~/projects/app-backend
npm install @programinglive/dev-workflow-mcp-server
# Creates .state/ in app-backend/
```

#### 4. Custom State File Path

Override state location with environment variable:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"],
      "env": {
        "DEV_WORKFLOW_STATE_FILE": "d:\\projects\\my-app\\.state\\workflow-state.json"
      }
    }
  }
}
```

---

## Git Conflicts with Automated Commits

### Symptoms
- `commit_and_push` fails with merge conflicts
- Diverged branch errors
- Uncommitted changes blocking workflow

### Solutions

#### 1. Pull Before Committing

Always pull latest changes first:

```bash
git pull origin main
```

Then run workflow commands.

#### 2. Resolve Conflicts Manually

If conflicts occur:

```bash
# See conflicts
git status

# Resolve conflicts in files
# Then:
git add .
git commit -m "resolve conflicts"
git push
```

Then resume workflow with `get_workflow_status`.

#### 3. Use Correct Branch

Ensure you're on the right branch:

```bash
git branch  # Check current branch
git checkout your-feature-branch
```

Then specify in workflow:

```
commit_and_push:
  commitMessage: "feat: add feature"
  branch: "your-feature-branch"
```

#### 4. Stash Uncommitted Changes

If you have uncommitted changes blocking the workflow:

```bash
# Stash changes
git stash

# Run workflow
# ...

# Restore changes
git stash pop
```

---

## Path Resolution Issues on Windows

### Symptoms
- "Cannot find module" errors
- Path not found errors
- Server fails to start

### Solutions

#### 1. Use Escaped Backslashes

In JSON, escape backslashes:

```json
{
  "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"]
}
```

Not:
```json
{
  "args": ["d:\code\dev-workflow-mcp-server\index.js"]  // ❌ Wrong
}
```

#### 2. Use Forward Slashes

Alternative: use forward slashes (works on Windows):

```json
{
  "args": ["d:/code/dev-workflow-mcp-server/index.js"]
}
```

#### 3. Use Absolute Paths

Always use full paths, not relative:

```json
{
  "args": ["C:\\Users\\Username\\Projects\\dev-workflow-mcp-server\\index.js"]
}
```

#### 4. Avoid Spaces in Paths

If path has spaces, ensure proper escaping:

```json
{
  "args": ["C:\\Program Files\\My Project\\dev-workflow-mcp-server\\index.js"]
}
```

Or move to path without spaces.

---

## SQLite Database Locking

### Symptoms
- "Database is locked" errors
- Cannot save workflow state
- Timeouts when updating workflow

### Solutions

#### 1. Close Other Processes

Ensure no other processes have the database open:

```powershell
# Windows: Find processes with file open
handle .state\users\

# macOS/Linux
lsof .state/users/*/workflow-state.db
```

Close conflicting processes.

#### 2. One MCP Server Per User

Don't run multiple MCP server instances for same user:

- Close other editors using the MCP server
- Ensure only one Antigravity instance is active

#### 3. Use Different User IDs

If multiple users/editors need simultaneous access:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "antigravity-user"
      }
    }
  }
}
```

In Windsurf:
```json
{
  "env": {
    "DEV_WORKFLOW_USER_ID": "windsurf-user"
  }
}
```

#### 4. Repair Database

If database is corrupted:

```bash
cd .state/users/your-user-id/

# Backup
cp workflow-state.db workflow-state.db.backup

# Check integrity
sqlite3 workflow-state.db "PRAGMA integrity_check;"

# If corrupted, start fresh
rm workflow-state.db
```

---

## Multi-User Workflow Isolation Problems

### Symptoms
- Users see each other's workflows
- History mixing between developers
- State conflicts on shared machines

### Solutions

#### 1. Set Unique User IDs

Each developer should have unique `DEV_WORKFLOW_USER_ID`:

**Developer Alice:**
```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "alice"
      }
    }
  }
}
```

**Developer Bob:**
```json
{
  "env": {
    "DEV_WORKFLOW_USER_ID": "bob"
  }
}
```

#### 2. Verify User Isolation

Check that separate DB files exist:

```bash
ls -la .state/users/
# Should see:
# alice/workflow-state.db
# bob/workflow-state.db
```

#### 3. View Specific User History

In web dashboard:

```bash
npm run web
# Open: http://localhost:3111?user=alice
# Or: http://localhost:3111?user=bob
```

---

## Windsurf Editor Conflicts

### Symptoms
- Workflow state corrupted when switching between Antigravity and Windsurf
- Both editors showing different workflow phases
- SQLite locking errors

### Root Cause

Both editors try to use the same workflow state file simultaneously.

### Solutions

#### Solution 1: Use Different User IDs (Recommended)

Most reliable approach - complete isolation:

**Antigravity config:**
```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "antigravity"
      }
    }
  }
}
```

**Windsurf config:**
```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "windsurf"
      }
    }
  }
}
```

This creates:
- `.state/users/antigravity/workflow-state.db` for Antigravity
- `.state/users/windsurf/workflow-state.db` for Windsurf

#### Solution 2: Use One Editor at a Time

If you want shared state:
1. **Close Windsurf completely** before opening Antigravity
2. Or **close Antigravity** before opening Windsurf
3. Only ONE editor should access workflow at a time

#### Solution 3: Separate Projects

Use the MCP server in different projects:

- Antigravity → Project A
- Windsurf → Project B

Each project has isolated `.state/` directory.

#### Solution 4: Disable in One Editor

Keep MCP server active in only one editor:

Remove or comment out from one config:

```json
{
  "mcpServers": {
    // "dev-workflow": { ... }  // Disabled
  }
}
```

---

## Tests Not Running

### Symptoms
- `run_tests` accepts any input
- Tests marked as passed but didn't actually run
- No test output shown

### Explanation

The MCP server **records** test results; it doesn't execute tests. You must run tests manually first.

### Solution

#### 1. Run Tests Manually

```bash
# Run your test suite
npm test
# or
npm run test
# or
yarn test
```

#### 2. Record Results

Then record in workflow:

```
run_tests:
  passed: true
  testCommand: "npm test"
  details: "127 tests passed"
```

#### 3. Workflow Blocking

The workflow **blocks commits if you record `passed: false`**:

```
run_tests:
  passed: false
  testCommand: "npm test"
  details: "3 tests failed"
```

Response:
```
❌ Tests FAILED!
🚫 Cannot proceed with failing tests
```

Fix tests, re-run, then record:

```
run_tests:
  passed: true
  testCommand: "npm test"
  details: "All 127 tests now pass"
```

---

## Commit and Push Failures

### Symptoms
- `commit_and_push` fails
- No changes committ push rejected
- Authentication errors

### Solutions

#### 1. Verify Git Configuration

```bash
git config --list

# Should have:
# user.name=Your Name
# user.email=your@email.com
```

If missing:
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

#### 2. Ensure Changes Exist

MCP server stages files with `git add .`. Verify changes:

```bash
git status
```

If no changes, the commit will fail.

#### 3. Check Remote Configuration

```bash
git remote -v
```

Should show:
```
origin  https://github.com/user/repo.git (fetch)
origin  https://github.com/user/repo.git (push)
```

If missing:
```bash
git remote add origin https://github.com/user/repo.git
```

#### 4. Authentication Issues

**GitHub HTTPS:**
```bash
# Use personal access token
git config --global credential.helper store
git push  # Enter token when prompted
```

**GitHub SSH:**
```bash
# Verify SSH key
ssh -T git@github.com

# Change remote to SSH
git remote set-url origin git@github.com:user/repo.git
```

#### 5. Branch Protection

If branch is protected:
- Create a feature branch
- Push to feature branch instead:

```
commit_and_push:
  commitMessage: "feat: add feature"
  branch: "feature/my-feature"
```

---

## Getting More Help

### Enable Debug Logging

Run server with debug output:

```bash
NODE_ENV=development node index.js
```

### Check Server Health

Test manually:

```bash
cd dev-workflow-mcp-server
node index.js

# Type to test:
# get_workflow_status
```

### Community Support

- **GitHub Issues:** [Report bugs](https://github.com/programinglive/dev-workflow-mcp-server/issues)
- **Discussions:** [Ask questions](https://github.com/programinglive/dev-workflow-mcp-server/discussions)

### Documentation

- [Getting Started](./GETTING-STARTED.md)
- [Examples](./EXAMPLES.md)
- [Workflow Templates](./WORKFLOW-TEMPLATES.md)
- [Main README](../../README.md)

---

**Still having issues?** Open a GitHub issue with:
1. Your `mcp_config.json` (redact sensitive paths)
2. Error messages
3. Steps to reproduce
4. Antigravity version
5. Node.js version (`node --version`)
6. Operating system

We're here to help! 🛠️
