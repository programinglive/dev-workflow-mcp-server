# Workflow Templates for Dev-Workflow MCP Server

Ready-to-use workflow templates for common development scenarios in Antigravity.

## Table of Contents

- [Feature Development Template](#feature-development-template)
- [Bug Fix Template](#bug-fix-template)
- [Refactoring Template](#refactoring-template)
- [Hotfix Template](#hotfix-template)
- [Documentation Update Template](#documentation-update-template)
- [Release Preparation Template](#release-preparation-template)

---

## Feature Development Template

Use this template when adding new functionality to your application.

### Checklist

```markdown
## Feature: [Feature Name]

### Planning
- [ ] Define feature requirements
- [ ] Design API/component interface
- [ ] Identify affected files
- [ ] Plan test cases

### Implementation
- [ ] Start workflow task
- [ ] Implement feature code
- [ ] Mark as fixed

### Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create tests in workflow
- [ ] Run test suite
- [ ] Record passing tests

### Documentation
- [ ] Update README
- [ ] Add inline comments
- [ ] Update API documentation
- [ ] Create documentation in workflow

### Release
- [ ] Commit and push changes
- [ ] Perform release (minor version)
- [ ] Complete task
```

### Workflow Commands

```
# 1. Start
start_task:
  description: "Add [feature name] to [component/module]"
  type: "feature"

# 2. Code the feature
# ... your implementation ...

# 3. Mark as fixed
mark_bug_fixed:
  summary: "[Brief description of what was implemented]"

# 4. Create tests
# ... write your test files ...
create_tests

# 5. Run tests
run_tests:
  passed: true
  testCommand: "npm test"
  details: "[X tests passed, coverage Y%]"

# 6. Document
# ... update documentation ...
create_documentation:
  documentationType: "README"
  summary: "[What you documented]"

# 7. Commit
commit_and_push:
  commitMessage: "feat([scope]): [description]"

# 8. Release
perform_release:
  command: "npm run release:minor"
  notes: "v[X.Y.Z] - [Feature name]"

# 9. Complete
complete_task:
  commitMessage: "feat([scope]): [description]"
```

### Example

**Feature:** Add shopping cart functionality

```
start_task:
  description: "Add shopping cart with add/remove items and checkout"
  type: "feature"

mark_bug_fixed:
  summary: "Shopping cart with localStorage persistence and quantity controls"

create_tests

run_tests:
  passed: true
  testCommand: "npm test -- cart"
  details: "12 cart tests passed: add, remove, update quantity, persist"

create_documentation:
  documentationType: "README"
  summary: "Added shopping cart API reference and integration guide"

commit_and_push:
  commitMessage: "feat(cart): add shopping cart with persistence"

perform_release:
  command: "npm run release:minor"
  notes: "v1.5.0 - Shopping cart feature"

complete_task:
  commitMessage: "feat(cart): add shopping cart with persistence"
```

---

## Bug Fix Template

Use this template when fixing defects or unexpected behavior.

### Checklist

```markdown
## Bug Fix: [Bug Description]

### Investigation
- [ ] Reproduce the bug
- [ ] Identify root cause
- [ ] Document expected vs actual behavior

### Implementation
- [ ] Start workflow task
- [ ] Fix the bug
- [ ] Verify fix locally
- [ ] Mark as fixed

### Testing
- [ ] Write regression test
- [ ] Update existing tests if needed
- [ ] Create tests in workflow
- [ ] Run full test suite
- [ ] Record passing tests

### Documentation
- [ ] Update CHANGELOG
- [ ] Add code comments explaining the fix
- [ ] Create documentation in workflow

### Release
- [ ] Commit and push changes
- [ ] Perform release (patch version)
- [ ] Complete task
```

### Workflow Commands

```
# 1. Start
start_task:
  description: "Fix [bug description]"
  type: "bugfix"

# 2. Fix the bug
# ... your fix ...

# 3. Mark as fixed
mark_bug_fixed:
  summary: "[Brief description of the fix]"

# 4. Create regression tests
# ... write test to prevent recurrence ...
create_tests

# 5. Run tests
run_tests:
  passed: true
  testCommand: "npm test"
  details: "[Include regression test results]"

# 6. Document
# ... update CHANGELOG ...
create_documentation:
  documentationType: "changelog"
  summary: "[What you documented]"

# 7. Commit
commit_and_push:
  commitMessage: "fix([scope]): [description]"

# 8. Release
perform_release:
  command: "npm run release:patch"
  notes: "v[X.Y.Z] - Bugfix for [issue]"

# 9. Complete
complete_task:
  commitMessage: "fix([scope]): [description]"
```

### Example

**Bug:** Date picker shows wrong month on mobile

```
start_task:
  description: "Fix date picker showing incorrect month on iOS Safari"
  type: "bugfix"

mark_bug_fixed:
  summary: "Fixed timezone offset calculation in date picker for iOS Safari"

create_tests

run_tests:
  passed: true
  testCommand: "npm test -- datepicker"
  details: "Added timezone regression test, all 8 tests pass"

create_documentation:
  documentationType: "changelog"
  summary: "Added bug fix entry for date picker iOS issue"

commit_and_push:
  commitMessage: "fix(ui): correct date picker timezone handling on iOS"

perform_release:
  command: "npm run release:patch"
  notes: "v1.4.1 - iOS date picker fix"

complete_task:
  commitMessage: "fix(ui): correct date picker timezone handling on iOS"
```

---

## Refactoring Template

Use this template when improving code structure without changing behavior.

### Checklist

```markdown
## Refactoring: [What You're Refactoring]

### Planning
- [ ] Identify code smell or improvement opportunity
- [ ] Define refactoring goal
- [ ] Ensure test coverage exists
- [ ] Plan incremental changes

### Implementation
- [ ] Start workflow task
- [ ] Refactor code
- [ ] Verify behavior unchanged
- [ ] Mark as fixed

### Testing
- [ ] Update tests for new structure
- [ ] Ensure all existing tests still pass
- [ ] Create tests in workflow
- [ ] Run full test suite
- [ ] Record passing tests

### Documentation
- [ ] Update inline documentation
- [ ] Update architecture docs if needed
- [ ] Create documentation in workflow

### Release
- [ ] Commit and push changes
- [ ] Perform release (minor/patch)
- [ ] Complete task
```

### Workflow Commands

```
# 1. Start
start_task:
  description: "Refactor [component/module] to [improvement goal]"
  type: "refactor"

# 2. Refactor
# ... your refactoring ...

# 3. Mark as fixed
mark_bug_fixed:
  summary: "[Brief description of refactoring]"

# 4. Update tests
# ... update test structure ...
create_tests

# 5. Run tests
run_tests:
  passed: true
  testCommand: "npm test -- --coverage"
  details: "[All tests pass, coverage maintained/improved]"

# 6. Document
create_documentation:
  documentationType: "inline-comments"
  summary: "[Updated documentation]"

# 7. Commit
commit_and_push:
  commitMessage: "refactor([scope]): [description]"

# 8. Release
perform_release:
  command: "npm run release:minor"
  notes: "v[X.Y.Z] - Internal improvements"

# 9. Complete
complete_task:
  commitMessage: "refactor([scope]): [description]"
```

### Example

**Refactoring:** Extract authentication logic to custom hooks

```
start_task:
  description: "Refactor authentication logic into reusable custom hooks"
  type: "refactor"

mark_bug_fixed:
  summary: "Extracted useAuth and usePermissions hooks from component logic"

create_tests

run_tests:
  passed: true
  testCommand: "npm test -- --coverage"
  details: "All 145 tests pass, coverage improved from 89% to 92%"

create_documentation:
  documentationType: "inline-comments"
  summary: "Added JSDoc for custom hooks and usage examples"

commit_and_push:
  commitMessage: "refactor(auth): extract authentication logic to custom hooks"

perform_release:
  command: "npm run release:minor"
  notes: "v1.6.0 - Authentication refactoring (improved maintainability)"

complete_task:
  commitMessage: "refactor(auth): extract authentication logic to custom hooks"
```

---

## Hotfix Template

Use this for urgent production fixes that need immediate deployment.

### Checklist

```markdown
## Hotfix: [Critical Issue]

### Urgent Actions
- [ ] Identify production issue
- [ ] Create hotfix branch if using git-flow
- [ ] Start workflow task

### Fix
- [ ] Implement minimal fix
- [ ] Test fix locally
- [ ] Mark as fixed

### Testing
- [ ] Create focused regression test
- [ ] Run relevant test suite
- [ ] Manual verification in staging
- [ ] Record passing tests

### Documentation
- [ ] Update CHANGELOG with hotfix note
- [ ] Document in workflow

### Release
- [ ] Commit and push
- [ ] Perform PATCH release
- [ ] Deploy to production immediately
- [ ] Complete task
- [ ] Notify team
```

### Workflow Commands

```
# 1. Start immediately
start_task:
  description: "HOTFIX: [critical issue description]"
  type: "bugfix"

# 2. Minimal fix
# ... implement fix ...

# 3. Mark as fixed
mark_bug_fixed:
  summary: "[Brief description of hotfix]"

# 4. Focused test
create_tests

# 5. Run tests
run_tests:
  passed: true
  testCommand: "npm test -- [relevant-tests]"
  details: "[Critical path tests pass]"

# 6. Document urgency
create_documentation:
  documentationType: "changelog"
  summary: "HOTFIX: [issue] - [fix description]"

# 7. Commit
commit_and_push:
  commitMessage: "fix([scope])!: HOTFIX - [description]"

# 8. Emergency release
perform_release:
  command: "npm run release:patch"
  notes: "v[X.Y.Z] - HOTFIX: [issue]"

# 9. Complete
complete_task:
  commitMessage: "fix([scope])!: HOTFIX - [description]"
```

### Example

**Hotfix:** Payment processing fails on production

```
start_task:
  description: "HOTFIX: Payment gateway timeout causing checkout failures"
  type: "bugfix"

mark_bug_fixed:
  summary: "Increased payment API timeout from 5s to 30s and added retry logic"

create_tests

run_tests:
  passed: true
  testCommand: "npm test -- payment"
  details: "Payment flow tests pass with timeout scenarios"

create_documentation:
  documentationType: "changelog"
  summary: "HOTFIX: Resolved payment timeout failures with increased timeout and retry"

commit_and_push:
  commitMessage: "fix(payment)!: HOTFIX - increase timeout and add retry logic"

perform_release:
  command: "npm run release:patch"
  notes: "v1.4.2 - HOTFIX: Payment processing timeout"

complete_task:
  commitMessage: "fix(payment)!: HOTFIX - increase timeout and add retry logic"
```

---

## Documentation Update Template

Use this when updating documentation without code changes.

### Workflow Commands

```
# 1. Start
start_task:
  description: "Update documentation for [topic]"
  type: "other"

# 2. Update docs
# ... write documentation ...

# 3. Mark as complete
mark_bug_fixed:
  summary: "Updated [documentation type] with [additions]"

# 4. Skip tests (documentation only)
skip_tests:
  reason: "Documentation-only change, no code modified"

# 5. Document
create_documentation:
  documentationType: "README"
  summary: "[What documentation was added/updated]"

# 6. Commit
commit_and_push:
  commitMessage: "docs([scope]): [description]"

# 7. Release
perform_release:
  command: "npm run release:patch"
  notes: "v[X.Y.Z] - Documentation updates"

# 8. Complete
complete_task:
  commitMessage: "docs([scope]): [description]"
```

### Example

```
start_task:
  description: "Add migration guide for v2.0 breaking changes"
  type: "other"

mark_bug_fixed:
  summary: "Created comprehensive v2.0 migration guide with examples"

skip_tests:
  reason: "Documentation-only update, no code changes"

create_documentation:
  documentationType: "API-docs"
  summary: "Added MIGRATION_V2.md with breaking changes and upgrade steps"

commit_and_push:
  commitMessage: "docs(migration): add v2.0 migration guide"

perform_release:
  command: "npm run release:patch"
  notes: "v1.4.3 - v2.0 migration guide"

complete_task:
  commitMessage: "docs(migration): add v2.0 migration guide"
```

---

## Release Preparation Template

Use this when preparing a major/minor release with multiple features.

### Checklist

```markdown
## Release Preparation: v[X.Y.Z]

### Pre-Release
- [ ] Review all merged features
- [ ] Update version numbers
- [ ] Update CHANGELOG
- [ ] Run full test suite
- [ ] Check documentation completeness

### Workflow
- [ ] Start workflow task
- [ ] Mark preparation as complete
- [ ] Verify tests
- [ ] Create documentation
- [ ] Commit and push
- [ ] Perform release
- [ ] Complete task

### Post-Release
- [ ] Tag release in git
- [ ] Create GitHub release notes
- [ ] Publish to npm/registry
- [ ] Notify users
```

### Workflow Commands

```
start_task:
  description: "Prepare release v[X.Y.Z] with [feature list]"
  type: "other"

mark_bug_fixed:
  summary: "Release preparation complete: CHANGELOG updated, version bumped to [X.Y.Z]"

create_tests

run_tests:
  passed: true
  testCommand: "npm test -- --coverage"
  details: "Full test suite: [X tests pass], coverage [Y%]"

create_documentation:
  documentationType: "changelog"
  summary: "Updated CHANGELOG with all v[X.Y.Z] features and fixes"

commit_and_push:
  commitMessage: "chore(release): prepare v[X.Y.Z]"

perform_release:
  command: "npm run release:minor"
  notes: "v[X.Y.Z] - [Release highlights]"

complete_task:
  commitMessage: "chore(release): prepare v[X.Y.Z]"
```

---

## Using Templates in Antigravity

### Quick Template Application

1. **Choose your template** based on task type
2. **Copy the workflow commands** section
3. **Customize** brackets [...] with your specific details
4. **Execute** commands in Antigravity

### Template Variables

Replace these placeholders in templates:

- `[Feature Name]` - Your feature description
- `[Bug Description]` - Bug summary
- `[scope]` - Conventional commit scope (e.g., auth, ui, api)
- `[description]` - Commit description
- `[X.Y.Z]` - Version number
- `[X tests]` - Number of tests
- `[Y%]` - Coverage percentage

### Automation with Workflows

Save these as Antigravity workflow files in `.agent/workflows/`:

- `dev-workflow-feature.md`
- `dev-workflow-bugfix.md`
- `dev-workflow-refactor.md`
- `dev-workflow-hotfix.md`

Then use slash commands like `/dev-workflow-feature` to load templates!

---

## Next Steps

- See [EXAMPLES.md](./EXAMPLES.md) for real-world usage scenarios
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Return to [GETTING-STARTED.md](./GETTING-STARTED.md) for setup

---

**Consistent workflows lead to consistent quality!** ⚡
