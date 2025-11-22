# Practical Examples for Dev-Workflow MCP Server

This document provides real-world examples of using the dev-workflow MCP server in Antigravity.

## Table of Contents

- [Simple Feature Development](#simple-feature-development)
- [Bug Fix with Test Discovery](#bug-fix-with-test-discovery)
- [Refactoring Workflow](#refactoring-workflow)
- [Using run_full_workflow](#using-run_full_workflow)
- [Multi-Project Workflow](#multi-project-workflow)
- [Per-User Workflow Isolation](#per-user-workflow-isolation)
- [Handling Test Failures](#handling-test-failures)

---

## Simple Feature Development

**Scenario:** Adding a user profile avatar feature

### Step-by-Step

**1. Start the task:**
```
start_task:
  description: "Add user avatar upload and display"
  type: "feature"
```

**Response:**
```
✅ Task started: Add user avatar upload and display
📝 Task ID: task-20231122-001
🔄 Phase: implementation
Next: Implement the feature, then mark as fixed
```

**2. Implement the feature:**
- Create `components/Avatar.jsx`
- Add upload functionality
- Integrate with user profile page

**3. Mark as fixed:**
```
mark_bug_fixed:
  summary: "Avatar component with upload, preview, and persistence"
```

**4. Create tests:**
- Write `Avatar.test.jsx` with upload tests
- Add integration tests for profile page

```
create_tests
```

**5. Run tests:**
```bash
npm test
```

```
run_tests:
  passed: true
  testCommand: "npm test"
  details: "31 tests passed (27 existing + 4 new avatar tests)"
```

**6. Document:**
Update `README.md` with avatar component usage:

```
create_documentation:
  documentationType: "README"
  summary: "Added Avatar component documentation with API reference and examples"
```

**7. Commit and push:**
```
commit_and_push:
  commitMessage: "feat(profile): add user avatar upload and display"
```

**8. Release:**
```
perform_release:
  command: "npm run release:minor"
  notes: "v1.3.0 - User avatar feature"
```

**9. Complete:**
```
complete_task:
  commitMessage: "feat(profile): add user avatar upload and display"
```

---

## Bug Fix with Test Discovery

**Scenario:** Fixing a date formatting bug discovered in production

### Workflow

**1. Start:**
```
start_task:
  description: "Fix incorrect date format in transaction history"
  type: "bugfix"
```

**2. Reproduce and fix:**
- Find the bug in `utils/formatDate.js`
- Fix the formatting logic
- Verify the fix

**3. Mark as fixed:**
```
mark_bug_fixed:
  summary: "Corrected date formatting to use ISO 8601 format"
```

**4. Create regression test:**
Create `utils/formatDate.test.js`:

```javascript
describe('formatDate', () => {
  it('formats dates in ISO 8601 format', () => {
    const date = new Date('2023-11-22T10:30:00Z');
    expect(formatDate(date)).toBe('2023-11-22');
  });
  
  it('handles timezone correctly', () => {
    // Regression test for the bug
    const date = new Date('2023-11-22T23:00:00-05:00');
    expect(formatDate(date)).toBe('2023-11-22');
  });
});
```

```
create_tests
```

**5. Run tests:**
```
run_tests:
  passed: true
  testCommand: "npm test -- utils/formatDate.test.js"
  details: "2 new tests pass, including regression test"
```

**6. Document:**
Update `CHANGELOG.md`:

```
create_documentation:
  documentationType: "changelog"
  summary: "Added bug fix entry for date formatting issue"
```

**7. Commit:**
```
commit_and_push:
  commitMessage: "fix(utils): correct date formatting to use ISO 8601"
```

**8. Release:**
```
perform_release:
  command: "npm run release:patch"
  notes: "v1.2.1 - Hotfix for date formatting"
```

**9. Complete:**
```
complete_task:
  commitMessage: "fix(utils): correct date formatting to use ISO 8601"
```

---

## Refactoring Workflow

**Scenario:** Refactoring API service layer for better maintainability

### Workflow

**1. Start:**
```
start_task:
  description: "Refactor API service layer to use interceptors pattern"
  type: "refactor"
```

**2. Refactor code:**
- Extract common logic to interceptors
- Update all API calls to use new pattern
- Ensure backward compatibility

**3. Mark as fixed:**
```
mark_bug_fixed:
  summary: "Refactored API service to use axios interceptors for auth and error handling"
```

**4. Update existing tests:**
Since this is a refactor, update existing tests to work with new structure:

```
create_tests
```

**5. Run comprehensive test suite:**
```
run_tests:
  passed: true
  testCommand: "npm test -- --coverage"
  details: "All 127 tests pass. Coverage: 94% → 96%"
```

**6. Document changes:**
Update inline comments and architecture docs:

```
create_documentation:
  documentationType: "inline-comments"
  summary: "Added JSDoc comments for interceptors and updated architecture diagram"
```

**7. Commit:**
```
commit_and_push:
  commitMessage: "refactor(api): use interceptors pattern for auth and error handling"
```

**8. Release:**
```
perform_release:
  command: "npm run release:minor"
  notes: "v1.4.0 - API service refactoring (internal improvement)"
```

**9. Complete:**
```
complete_task:
  commitMessage: "refactor(api): use interceptors pattern for auth and error handling"
```

---

## Using run_full_workflow

**Scenario:** Quick feature when you know all the details upfront

The `run_full_workflow` tool executes all workflow steps in one call:

```
run_full_workflow:
  summary: "Add dark mode toggle to settings"
  testCommand: "npm test"
  testsPassed: true
  testDetails: "3 new tests for dark mode: all pass"
  documentationType: "README"
  documentationSummary: "Added dark mode section to README with usage"
  commitMessage: "feat(ui): add dark mode toggle to settings"
  releaseCommand: "npm run release:minor"
  releaseNotes: "v1.5.0 - Dark mode support"
```

This single call:
1. ✅ Marks the feature as fixed
2. ✅ Records test creation
3. ✅ Records test execution
4. ✅ Records documentation
5. ✅ Checks ready to commit
6. ✅ Commits and pushes
7. ✅ Performs release
8. ✅ Completes the task

**When to use:**
- Simple, well-defined features
- You've already done the work and just need to record it
- Batch processing multiple small changes

**When not to use:**
- Complex features requiring step-by-step verification
- When tests might fail (you need to fix them first)
- Learning the workflow for the first time

---

## Multi-Project Workflow

**Scenario:** Working on multiple projects with separate workflow histories

### Setup

Each project gets its own `.state/workflow-state.json`:

```bash
# Project A
cd ~/projects/frontend-app
npm install @programinglive/dev-workflow-mcp-server

# Project B  
cd ~/projects/backend-api
npm install @programinglive/dev-workflow-mcp-server
```

### Usage

Workflows are automatically isolated by project:

**In frontend-app:**
```
start_task:
  description: "Add checkout flow"
  type: "feature"

# Work on frontend...
# Complete workflow...
```

**In backend-api:**
```
start_task:
  description: "Add payment webhook endpoint"
  type: "feature"

# Work on backend...
# Complete workflow...
```

Each project tracks its own:
- Current task
- Workflow phase
- History

View history for current project:
```
view_history:
  limit: 5
```

This shows only the history for the current project!

---

## Per-User Workflow Isolation

**Scenario:** Multiple developers on the same machine or shared repository

### Configuration

Set unique user IDs for each developer:

**Developer 1 (Alice):**
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

**Developer 2 (Bob):**
```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "node",
      "args": ["d:\\code\\dev-workflow-mcp-server\\index.js"],
      "env": {
        "DEV_WORKFLOW_USER_ID": "bob"
      }
    }
  }
}
```

### Result

Workflow states are isolated:
- `.state/users/alice/workflow-state.db` - Alice's history
- `.state/users/bob/workflow-state.db` - Bob's history

Each developer can:
- Work on different tasks simultaneously
- Have independent workflow phases
- View their own history without seeing others

### Web Dashboard

View specific user's history:
```bash
npm run web
# Opens http://localhost:3111

# Filter by user:
# http://localhost:3111?user=alice
# http://localhost:3111?user=bob
```

---

## Handling Test Failures

**Scenario:** Tests fail during workflow

### Workflow with Failure

**1. Start and implement:**
```
start_task:
  description: "Add email validation to signup form"
  type: "feature"

mark_bug_fixed:
  summary: "Email validation with regex and domain verification"

create_tests
```

**2. Run tests (they fail!):**
```
run_tests:
  passed: false
  testCommand: "npm test"
  details: "2 of 4 tests failed: Invalid email format not caught"
```

**Response:**
```
❌ Tests FAILED!
🚫 Cannot proceed to commit with failing tests
📝 Current phase: testing (blocked)

You must:
1. Fix the failing tests
2. Re-run tests with passed: true
```

**3. Fix the bugs:**
- Update validation regex
- Fix edge case handling

**4. Run tests again:**
```
run_tests:
  passed: true
  testCommand: "npm test"
  details: "All 4 tests now pass"
```

**Response:**
```
✅ Tests passed!
✅ Testing phase complete
Next: Create documentation
```

**5. Continue workflow:**
```
create_documentation:
  documentationType: "inline-comments"
  summary: "Added validation rules documentation"

commit_and_push:
  commitMessage: "feat(auth): add email validation to signup"

perform_release:
  command: "npm run release:minor"

complete_task:
  commitMessage: "feat(auth): add email validation to signup"
```

### Key Takeaway

**The workflow blocks commits when tests fail!** This enforces quality and prevents broken code from reaching your repository.

---

## Advanced: Skipping Tests

**Scenario:** Manual testing required (mobile app, hardware integration, etc.)

```
start_task:
  description: "Add iOS biometric authentication"
  type: "feature"

mark_bug_fixed:
  summary: "Face ID and Touch ID integration complete"

skip_tests:
  reason: "Biometric auth requires physical iOS device testing; automated tests not feasible. Manual QA completed on iPhone 14 Pro and iPhone 12."
```

**Response:**
```
⚠️  Tests skipped with justification
✅ Testing phase marked as satisfied
📝 Task flagged for manual verification

Reason: Biometric auth requires physical iOS device testing; automated tests not feasible. Manual QA completed on iPhone 14 Pro and iPhone 12.

Next: Create documentation
```

**When to skip tests:**
- Hardware-dependent features
- Manual UI testing on specific devices
- Third-party service integration (with mocking limitations)

**Best practice:** Always provide detailed justification for audit trail.

---

## Next Steps

- Check [WORKFLOW-TEMPLATES.md](./WORKFLOW-TEMPLATES.md) for ready-to-use templates
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Return to [GETTING-STARTED.md](./GETTING-STARTED.md) for setup instructions

---

**Happy coding with disciplined workflows!** 🎯
