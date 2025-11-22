---
description: Feature development workflow using dev-workflow MCP server
---

# Feature Development Workflow

This workflow guides you through developing a new feature with the dev-workflow MCP server.

## When to Use

- Adding new functionality
- Building new components
- Implementing new features

## Workflow Steps

### 1. Start the Task

Begin by defining your feature:

```
Use start_task tool:
- description: "Add [feature name] to [component/area]"
- type: "feature"
```

The server confirms task start and moves you to the implementation phase.

### 2. Implement the Feature

Write your code as usual. The workflow doesn't interfere with your development process.

Tips:
- Keep commits atomic
- Follow coding standards
- Write clean, maintainable code

### 3. Mark as Fixed

Once implementation is complete:

```
Use mark_bug_fixed tool:
- summary: "[Brief description of what was implemented]"
```

The server reminds you that tests are now mandatory.

### 4. Create Tests

Write comprehensive tests:
- Unit tests for new functions/components
- Integration tests for interactions
- End-to-end tests for user flows (if applicable)

Then mark tests as created:

```
Use create_tests tool
(no parameters needed)
```

### 5. Run Tests

// turbo
Execute your test suite:

```bash
npm test
```

Record the results:

```
Use run_tests tool:
- passed: true (or false if tests failed)
- testCommand: "npm test"
- details: "[Number of tests, coverage, etc.]"
```

**Important:** If tests fail, fix them before proceeding. The workflow blocks commits with failing tests.

### 6. Create Documentation

Update relevant documentation:
- README with feature usage
- Inline code comments
- API documentation
- CHANGELOG entry

Then mark documentation as complete:

```
Use create_documentation tool:
- documentationType: "README" (or "inline-comments", "API-docs", "changelog")
- summary: "[What you documented]"
```

### 7. Commit and Push

The MCP server automatically stages, commits, and pushes:

```
Use commit_and_push tool:
- commitMessage: "feat([scope]): [description]"
```

Use conventional commit format:
- `feat(auth): add social login`
- `feat(ui): add dark mode toggle`

The branch is auto-detected (main or master). To specify a branch:

```
Use commit_and_push tool:
- commitMessage: "feat([scope]): [description]"
- branch: "feature/your-branch"
```

### 8. Perform Release

Record the release:

```
Use perform_release tool:
- command: "npm run release:minor" (features are usually minor versions)
- notes: "v[X.Y.Z] - [Feature highlights]"
```

### 9. Complete Task

Mark the task as complete:

```
Use complete_task tool:
- commitMessage: "feat([scope]): [description]" (same as commit message)
```

This resets the workflow for your next task.

## Example: Adding Shopping Cart

```
1. start_task:
     description: "Add shopping cart functionality"
     type: "feature"

2. [Implement cart component, add/remove logic, localStorage persistence]

3. mark_bug_fixed:
     summary: "Shopping cart with add/remove items and localStorage persistence"

4. [Write cart tests: add item, remove item, update quantity, persistence]

5. create_tests

6. Run: npm test
   
7. run_tests:
     passed: true
     testCommand: "npm test"
     details: "12 cart tests added, all pass. Coverage: 94%"

8. [Update README with cart API, add inline comments]

9. create_documentation:
     documentationType: "README"
     summary: "Added shopping cart API documentation and usage examples"

10. commit_and_push:
      commitMessage: "feat(cart): add shopping cart with localStorage persistence"

11. perform_release:
      command: "npm run release:minor"
      notes: "v1.5.0 - Shopping cart feature"

12. complete_task:
      commitMessage: "feat(cart): add shopping cart with localStorage persistence"
```

## Quick Reference

```
1. start_task → 2. Code → 3. mark_bug_fixed → 4. Write tests
→ 5. create_tests → 6. run_tests → 7. Document → 8. create_documentation
→ 9. commit_and_push → 10. perform_release → 11. complete_task
```

## Tips

- **Keep features small** - One complete feature per workflow
- **Test thoroughly** - Don't skip tests 
- **Document as you go** - Don't wait until the end
- **Use conventional commits** - feat(scope): description
- **Minor versions** - Features bump minor version (X.Y.0)

## Need Help?

- Check `get_workflow_status` to see where you are
- Review [EXAMPLES.md](../docs/antigravity/EXAMPLES.md) for detailed examples
- See [TROUBLESHOOTING.md](../docs/antigravity/TROUBLESHOOTING.md) for common issues
