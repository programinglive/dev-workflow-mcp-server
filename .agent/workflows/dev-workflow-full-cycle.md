---
description: Complete workflow demonstration showing all dev-workflow MCP server phases
---

# Full Cycle Workflow Demonstration

This workflow demonstrates a complete dev-workflow cycle from start to finish, showing all phases and tools.

## Purpose

This is a reference workflow showing:
- All workflow phases
- All MCP tools in action
- Complete development cycle
- Best practices

## Scenario

**Task:** Add user profile page with avatar upload

## Complete Workflow

### Phase 1: Task Start

```
Use start_task tool:
- description: "Add user profile page with avatar upload and bio"
- type: "feature"
```

**Response:**
```
✅ Task started
📝 Task ID: task-20231122-001
🔄 Phase: implementation
Next: Implement the feature, then mark as fixed
```

---

### Phase 2: Implementation

Code the feature:

**Files created/modified:**
- `components/ProfilePage.jsx`
- `components/AvatarUpload.jsx`
- `api/profile.js`
- `styles/profile.css`

**Implementation includes:**
- Avatar upload with preview
- Bio text editor
- Form validation
- API integration

---

### Phase 3: Mark as Fixed

```
Use mark_bug_fixed tool:
- summary: "User profile page with avatar upload, bio editor, and form validation"
```

**Response:**
```
✅ Feature marked as fixed
⚠️  Reminder: Create tests now!
🔄 Phase: testing
Next: Create tests covering your changes
```

---

### Phase 4: Create Tests

Write comprehensive tests:

**Test files:**
- `components/ProfilePage.test.jsx`
- `components/AvatarUpload.test.jsx`
- `api/profile.test.js`

**Test coverage:**
- Avatar upload flow
- Image preview
- Form validation
- API calls
- Error handling

```
Use create_tests tool
```

**Response:**
```
✅ Tests created
📝 Phase: testing
Next: Run tests and record results
```

---

### Phase 5: Run Tests

// turbo
Execute test suite:

```bash
npm test
```

**Output:**
```
 PASS  components/ProfilePage.test.jsx
 PASS  components/AvatarUpload.test.jsx
 PASS  api/profile.test.js

Tests: 18 passed, 18 total
Coverage: 94.2%
```

Record results:

```
Use run_tests tool:
- passed: true
- testCommand: "npm test"
- details: "18 new profile tests added. All tests pass. Coverage: 94.2%"
```

**Response:**
```
✅ Tests passed!
🔄 Phase: documentation
Next: Create or update documentation
```

---

### Phase 6: Create Documentation

Update documentation:

**Updated files:**
- `README.md` - Added profile page usage section
- `docs/API.md` - Documented profile endpoints
- `CHANGELOG.md` - Added feature entry

**Documentation includes:**
- Component API reference
- Usage examples
- Screenshot of profile page
- Migration notes if needed

```
Use create_documentation tool:
- documentationType: "README"
- summary: "Added profile page documentation with API reference, usage examples, and screenshots"
```

**Response:**
```
✅ Documentation created
🔄 Phase: ready_to_commit
Next: Check if ready to commit
```

---

### Phase 7: Ready Check

```
Use check_ready_to_commit tool
```

**Response:**
```
✅ All required steps completed
✅ Fixed: Yes
✅ Tests created: Yes
✅ Tests passed: Yes
✅ Documentation: Yes
🎉 Ready to commit and push!
```

---

### Phase 8: Commit and Push

```
Use commit_and_push tool:
- commitMessage: "feat(profile): add user profile page with avatar upload"
```

**Execution:**
```bash
git add .
git commit -m "feat(profile): add user profile page with avatar upload"
git push origin main
```

**Response:**
```
✅ Changes committed and pushed
📦 Commit: feat(profile): add user profile page with avatar upload
🌿 Branch: main
🔄 Phase: release
Next: Perform release
```

---

### Phase 9: Perform Release

```
Use perform_release tool:
- command: "npm run release:minor"
- notes: "v1.5.0 - User profile page feature"
```

**Execution:**
```bash
npm run release:minor
# Creates tag v1.5.0
# Updates CHANGELOG
# Bumps version in package.json
```

**Response:**
```
✅ Release recorded
📦 Release: npm run release:minor
📝 Notes: v1.5.0 - User profile page feature
🔄 Phase: complete
Next: Complete the task
```

---

### Phase 10: Complete Task

```
Use complete_task tool:
- commitMessage: "feat(profile): add user profile page with avatar upload"
```

**Response:**
```
✅ Task completed successfully!
📋 Summary:
   - Type: feature
   - Description: Add user profile page with avatar upload and bio
   - Tests: Passed (18 tests)
   - Documentation: README
   - Commit: feat(profile): add user profile page with avatar upload
   - Release: npm run release:minor

🎉 Workflow reset - ready for next task!
📊 Task added to history
```

---

## View History

Check completed tasks:

```
Use view_history tool:
- limit: 5
```

**Response:**
```
📜 Recent Workflow History (5 tasks)

1. feat(profile): add user profile page with avatar upload
   Type: feature
   Completed: 2023-11-22 14:30
   Tests: Passed
   Release: npm run release:minor

2. fix(auth): correct token expiration handling
   Type: bugfix
   Completed: 2023-11-21 10:15
   Tests: Passed
   Release: npm run release:patch

[... more history ...]
```

---

## Alternative: Quick Workflow with run_full_workflow

For simple, well-defined tasks, use `run_full_workflow` to execute all steps at once:

```
Use run_full_workflow tool:
  summary: "User profile page with avatar upload and bio editor"
  testCommand: "npm test"
  testsPassed: true
  testDetails: "18 profile tests added, all pass, coverage 94.2%"
  documentationType: "README"
  documentationSummary: "Added profile page docs with API reference and examples"
  commitMessage: "feat(profile): add user profile page with avatar upload"
  releaseCommand: "npm run release:minor"
  releaseNotes: "v1.5.0 - User profile page feature"
```

This executes all 9 steps in one call!

---

## Workflow State Tracking

Check status at any time:

```
Use get_workflow_status tool
```

**Example response (mid-workflow):**
```
📋 Current Workflow Status

Task: Add user profile page with avatar upload and bio
Type: feature
Phase: documentation

✅ Completed:
   ✓ Task started
   ✓ Feature fixed
   ✓ Tests created
   ✓ Tests passed

⏳ Pending:
   ○ Documentation
   ○ Commit & push
   ○ Release
   ○ Complete

Next step: Create documentation
```

---

## Complete Tool Summary

Tools used in this workflow:

1. **start_task** - Begin new task
2. **mark_bug_fixed** - Mark implementation complete
3. **create_tests** - Record test creation
4. **run_tests** - Record test execution (blocks if failed)
5. **create_documentation** - Record documentation
6. **check_ready_to_commit** - Verify all steps complete
7. **commit_and_push** - Automated git commit & push
8. **perform_release** - Record release details
9. **complete_task** - Finish and reset workflow
10. **view_history** - See completed tasks
11. **get_workflow_status** - Check current phase

Optional tools:
- **skip_tests** - Skip with justification (manual testing)
- **drop_task** - Abandon task without completing
- **force_complete_task** - Force complete (emergency use)
- **rerun_workflow** - Restart current task
- **run_full_workflow** - Execute all steps at once

---

## Workflow Benefits

This disciplined workflow ensures:

- ✅ **Clear intent** - Every task starts with description
- ✅ **Test coverage** - Tests are mandatory
- ✅ **Quality gates** - Failing tests block commits
- ✅ **Documentation** - Documentation is required
- ✅ **Conventional commits** - Consistent commit messages
- ✅ **Release tracking** - All releases are recorded
- ✅ **Audit trail** - Complete history of all tasks

---

## Next Steps

- Use this as a reference for your own workflows
- Customize for your project's needs
- See other workflow templates:
  - [dev-workflow-feature.md](./dev-workflow-feature.md)
  - [dev-workflow-bugfix.md](./dev-workflow-bugfix.md)
  - [dev-workflow-refactor.md](./dev-workflow-refactor.md)

---

**Disciplined development leads to quality software!** 🚀
