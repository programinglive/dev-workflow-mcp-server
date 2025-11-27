# Workflow Best Practices

## Correct Release Workflow Order

To avoid needing `--force` flag for releases, follow this exact order:

1. **Start Task**: `mcp0_start_task`
2. **Fix/Implement**: Make your code changes
3. **Mark Fixed**: `mcp0_mark_bug_fixed`
4. **Tests**: `mcp0_create_tests` + `mcp0_run_tests` (or `mcp0_skip_tests` with reason)
5. **Documentation**: `mcp0_create_documentation`
6. **Ready Check**: `mcp0_check_ready_to_commit`
7. **Commit & Push**: `mcp0_commit_and_push`
8. **Release**: `mcp0_perform_release` ⚠️ **MUST come BEFORE complete_task**
9. **Complete**: `mcp0_complete_task`

## Common Mistakes

### ❌ Wrong Order (causes forced releases)
```
check_ready → commit → complete → release  // WRONG!
```

### ✅ Correct Order
```
check_ready → commit → release → complete  // CORRECT!
```

## Why This Matters

- `complete_task` **resets the workflow state**
- `perform_release` **checks the workflow state** before running
- If you complete before releasing, the state is cleared and release guards fail
- Using `--force` bypasses guards but doesn't fix the root cause

## State Transitions

1. After `commit_and_push`: `currentPhase = "release"`
2. After `perform_release`: `currentPhase = "ready_to_complete"`, `released = true`
3. After `complete_task`: State is reset to idle

## Solution

Always call `perform_release` BEFORE `complete_task`. Never use `--force` unless absolutely necessary.

## Documentation Phase Expectations

During the documentation step (`mcp0_create_documentation`), make sure the core project docs are created or updated as needed:

1. `docs/product/PRD.md` – Product Requirements Document
2. `README.md` – Project overview and usage
3. `docs/release-notes/RELEASE_NOTES.md` – Release notes for changes in this task/version

If one or more of these files already exist, **update them** instead of creating new variants. Use the `documentationType` argument to reflect what you touched:

- `"PRD"` when you added/updated the PRD
- `"README"` when you updated the main README
- `"RELEASE_NOTES"` when you updated the release notes
