---
description: Bug fix workflow using dev-workflow MCP server
---

# Bug Fix Workflow

This workflow guides you through fixing bugs with the dev-workflow MCP server, ensuring proper testing and documentation.

## When to Use

- Fixing defects
-修复 unexpected behavior
- Addressing user-reported issues
- Fixing regressions

## Workflow Steps

### 1. Start the Task

Begin by defining the bug:

```
Use start_task tool:
- description: "Fix [bug description]"
- type: "bugfix"
```

### 2. Reproduce and Fix

1. **Reproduce** the bug locally
2. **Identify** the root cause
3. **Fix** the issue
4. **Verify** the fix works

Tips:
- Document expected vs actual behavior
- Take notes on the root cause
- Test edge cases

### 3. Mark as Fixed

Once the fix is implemented:

```
Use mark_bug_fixed tool:
- summary: "[Brief description of the fix]"
```

### 4. Create Regression Tests

**Critical:** Write tests that would have caught this bug!

Create regression tests:
- Test the specific bug scenario
- Test edge cases around the bug
- Update existing tests if needed

Then mark tests as created:

```
Use create_tests tool
```

### 5. Run Tests

// turbo
Execute your test suite:

```bash
npm test
```

Ensure the new regression tests pass:

```
Use run_tests tool:
- passed: true
- testCommand: "npm test"
- details: "[Include regression test results]"
```

### 6. Document the Fix

Update documentation:
- **CHANGELOG** - Add bug fix entry
- **Code comments** - Explain why the fix was necessary
- **Issue tracker** - Reference issue number

```
Use create_documentation tool:
- documentationType: "changelog"
- summary: "[What you documented]"
```

### 7. Commit and Push

Use conventional commit with `fix` type:

```
Use commit_and_push tool:
- commitMessage: "fix([scope]): [description]"
```

Examples:
- `fix(auth): prevent token expiration edge case`
- `fix(ui): correct button alignment on mobile`

### 8. Perform Release

Bug fixes are patch releases:

```
Use perform_release tool:
- command: "npm run release:patch"
- notes: "v[X.Y.Z] - Bugfix for [issue]"
```

### 9. Complete Task

```
Use complete_task tool:
- commitMessage: "fix([scope]): [description]"
```

## Example: Date Formatting Bug

```
1. start_task:
     description: "Fix incorrect date format in transaction history"
     type: "bugfix"

2. [Reproduce bug, find issue in formatDate.js, implement fix]

3. mark_bug_fixed:
     summary: "Corrected date formatting to use ISO 8601 format"

4. [Write regression test in formatDate.test.js]

5. create_tests

6. Run: npm test
   
7. run_tests:
     passed: true
     testCommand: "npm test -- utils/formatDate.test.js"
     details: "2 new regression tests pass, all 45 tests pass"

8. [Update CHANGELOG.md with fix entry]

9. create_documentation:
     documentationType: "changelog"
     summary: "Added bug fix entry for date formatting issue"

10. commit_and_push:
      commitMessage: "fix(utils): correct date formatting to use ISO 8601"

11. perform_release:
      command: "npm run release:patch"
      notes: "v1.2.1 - Date formatting hotfix"

12. complete_task:
      commitMessage: "fix(utils): correct date formatting to use ISO 8601"
```

## Handling Test Failures

If tests fail during development:

```
run_tests:
  passed: false
  testCommand: "npm test"
  details: "3 tests failed in auth module"
```

Response:
```
❌ Tests FAILED!
🚫 Cannot proceed with failing tests
```

Fix the issues, then re-run:

```
run_tests:
  passed: true
  testCommand: "npm test"
  details: "All tests now pass"
```

## Quick Reference

```
1. start_task → 2. Reproduce & fix → 3. mark_bug_fixed 
→ 4. Write regression tests → 5. create_tests → 6. run_tests
→ 7. Document → 8. create_documentation → 9. commit_and_push
→ 10. perform_release → 11. complete_task
```

## Tips

- **Regression tests** - Always write tests that would catch this bug
- **Root cause** - Fix the underlying issue, not just symptoms
- **Documentation** - Update CHANGELOG for user visibility
- **Patch versions** - Bug fixes bump patch version (X.Y.Z)
- **Conventional commits** - Use `fix` prefix

## Hotfix Workflow

For critical production bugs:

```
start_task:
  description: "HOTFIX: [critical issue]"
  type: "bugfix"

[Implement minimal fix]

mark_bug_fixed:
  summary: "[Fix description]"

[Focused regression test]

create_tests

run_tests:
  passed: true
  testCommand: "npm test -- [critical-path]"
  details: "[Critical tests pass]"

create_documentation:
  documentationType: "changelog"
  summary: "HOTFIX: [issue] - [fix]"

commit_and_push:
  commitMessage: "fix([scope])!: HOTFIX - [description]"

perform_release:
  command: "npm run release:patch"
  notes: "v[X.Y.Z] - HOTFIX: [issue]"

complete_task:
  commitMessage: "fix([scope])!: HOTFIX - [description]"
```

## Need Help?

- `get_workflow_status` - Check current phase
- [EXAMPLES.md](../docs/antigravity/EXAMPLES.md) - Detailed examples
- [TROUBLESHOOTING.md](../docs/antigravity/TROUBLESHOOTING.md) - Common issues
