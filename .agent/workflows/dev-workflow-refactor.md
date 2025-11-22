---
description: Refactoring workflow using dev-workflow MCP server
---

# Refactoring Workflow

This workflow guides you through refactoring code while maintaining functionality with the dev-workflow MCP server.

## When to Use

- Improving code structure
- Removing code smells
- Optimizing performance
- Simplifying complex code

## Workflow Steps

### 1. Start the Task

Define your refactoring goal:

```
Use start_task tool:
- description: "Refactor [component/module] to [improvement goal]"
- type: "refactor"
```

### 2. Ensure Test Coverage

**Before refactoring**, verify you have good test coverage:

```bash
npm test -- --coverage
```

If coverage is low, write tests first to ensure refactoring doesn't break functionality.

### 3. Refactor Code

Make your improvements:
- Extract methods/components
- Simplify complex logic
- Remove duplication
- Optimize performance

**Key principle:** Behavior should remain unchanged.

### 4. Mark as Fixed

```
Use mark_bug_fixed tool:
- summary: "[Brief description of refactoring]"
```

### 5. Update Tests

Adapt tests to new structure if needed:
- Update test structure for new organization
- Ensure all existing tests still pass
- Add tests for new abstractions

```
Use create_tests tool
```

### 6. Run Tests

// turbo
Verify all tests still pass:

```bash
npm test -- --coverage
```

Coverage should maintain or improve:

```
Use run_tests tool:
- passed: true
- testCommand: "npm test -- --coverage"
- details: "[All tests pass, coverage maintained/improved]"
```

### 7. Document Changes

Update documentation for new structure:
- **Inline comments** - Document new abstractions
- **Architecture docs** - Update diagrams if structure changed
- **README** - Update examples if API changed

```
Use create_documentation tool:
- documentationType: "inline-comments"
- summary: "[What you documented]"
```

### 8. Commit and Push

Use `refactor` commit type:

```
Use commit_and_push tool:
- commitMessage: "refactor([scope]): [description]"
```

Examples:
- `refactor(auth): extract authentication logic to custom hooks`
- `refactor(api): simplify error handling with interceptors`

### 9. Perform Release

Refactoring can be minor or patch:
- **Minor** - Significant internal improvements
- **Patch** - Small structural improvements

```
Use perform_release tool:
- command: "npm run release:minor"
- notes: "v[X.Y.Z] - Internal improvements (refactoring)"
```

### 10. Complete Task

```
Use complete_task tool:
- commitMessage: "refactor([scope]): [description]"
```

## Example: Extract Custom Hooks

```
1. start_task:
     description: "Refactor authentication logic into reusable custom hooks"
     type: "refactor"

2. [Check test coverage: 89%]

3. [Extract useAuth and usePermissions hooks from components]

4. mark_bug_fixed:
     summary: "Extracted useAuth and usePermissions hooks from component logic"

5. [Update component tests to work with hooks]

6. create_tests

7. Run: npm test -- --coverage
   
8. run_tests:
     passed: true
     testCommand: "npm test -- --coverage"
     details: "All 145 tests pass, coverage improved from 89% to 92%"

9. [Add JSDoc comments to hooks, update README with hook examples]

10. create_documentation:
       documentationType: "inline-comments"
       summary: "Added JSDoc for custom hooks and usage examples in README"

11. commit_and_push:
       commitMessage: "refactor(auth): extract authentication logic to custom hooks"

12. perform_release:
       command: "npm run release:minor"
       notes: "v1.6.0 - Authentication refactoring (improved maintainability)"

13. complete_task:
       commitMessage: "refactor(auth): extract authentication logic to custom hooks"
```

## Refactoring Checklist

Before starting:
- [ ] Current code has adequate test coverage
- [ ] Tests are passing
- [ ] Refactoring goal is clear

During refactoring:
- [ ] Run tests frequently
- [ ] Make small, incremental changes
- [ ] Commit logical chunks if needed locally

After refactoring:
- [ ] All tests pass
- [ ] Coverage maintained or improved
- [ ] Code is simpler/cleaner
- [ ] Documentation updated

## Quick Reference

```
1. start_task → 2. Verify tests → 3. Refactor → 4. mark_bug_fixed
→ 5. Update tests → 6. create_tests → 7. run_tests
→ 8. Document → 9. create_documentation → 10. commit_and_push
→ 11. perform_release → 12. complete_task
```

## Tips

- **Test first** - Ensure good coverage before refactoring
- **Small changes** - Refactor incrementally
- **Keep tests passing** - Run tests frequently
- **No behavior changes** - Functionality stays the same
- **Document abstractions** - Explain new patterns
- **Coverage goal** - Maintain or improve test coverage

## Common Refactoring Patterns

### Extract Method
```
refactor(utils): extract validation logic to separate functions
```

### Extract Component
```
refactor(ui): extract UserCard component from UserList
```

### Simplify Logic
```
refactor(cart): simplify price calculation logic
```

### Remove Duplication
```
refactor(api): consolidate duplicate request handlers
```

### Optimize Performance
```
refactor(search): optimize search algorithm complexity
```

## Need Help?

- `get_workflow_status` - Check current phase
- [EXAMPLES.md](../docs/antigravity/EXAMPLES.md) - Refactoring examples
- [TROUBLESHOOTING.md](../docs/antigravity/TROUBLESHOOTING.md) - Common issues
