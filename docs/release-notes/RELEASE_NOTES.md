# Release Notes

Authoritative history of user-visible changes for the Development Workflow MCP Server. Each entry highlights the improvements that shipped with the tagged version.

## Unreleased

## 1.3.0 — 2025-11-22
- Added comprehensive Antigravity integration documentation and examples.
- Fixed Windows shell escaping for commit messages.
- Fixed release scripts to support ESM projects.
- Release guard now delegates to `@programinglive/commiter` and verifies the package is installed before running.

## 1.2.7 — 2025-11-13
- Delegated release process to `@programinglive/commiter`.

## 1.2.6 — 2025-11-11
- Exposed primary branch helper in CLI.
- Updated documentation regarding commiter delegation.

> **Notice:** Versions 1.2.2 through 1.2.5 were published briefly for packaging experiments and have been withdrawn.

## 1.2.1 — 2025-11-03
- Packaging touch-up; functionality remains identical to 1.2.0.

## 1.2.0 — 2025-11-03
- Reload the workflow state from disk for every tool call, preventing stale data when multiple clients manipulate the same project.

## 1.1.18 — 2025-11-03
- `commit_and_push` now auto-detects the primary branch (preferring `main`, then `master`) when none is supplied.

## 1.1.17 — 2025-10-31
- Release bookkeeping only; no user-facing changes.

## 1.1.16 — 2025-10-31
- Added npm provenance metadata so published packages include supply-chain attestations.

## 1.1.15 — 2025-10-31
- Documented the automated npm publish workflow and ensured CI builds include provenance before publishing.

## 1.1.14 — 2025-10-31
- Improved project-root detection for workflow state, fixing issues when the server runs from nested directories.

## 1.1.13 — 2025-10-30
- Version bump to distribute refreshed dashboard assets; no new functionality beyond 1.1.12.

## 1.1.12 — 2025-10-30
- Added a `node index.js call <tool>` CLI helper to invoke MCP tools without a client integration.
- Refreshed the web dashboard with a docs modal, dedicated docs API endpoints, and streamlined navigation.

## 1.1.11 — 2025-10-30
- Introduced per-user workflow state stored under `.state/users/<id>/` to avoid collisions on shared repos.
- Added a SQLite-backed project knowledge summary and the dashboard that visualizes history and trends.
- Hardened resumable workflows by re-checking persisted summaries between steps.

## 1.1.10 — 2025-10-29
- Shipped the initial project knowledge library with a persisted JSON summary for future database integrations.

## 1.1.9 — 2025-10-29
- Made `run_full_workflow` resume intelligently from the current phase.
- Expanded automated tests around README/exec updates and other workflow paths.

## 1.1.8 — 2025-10-27
- Documented the `DEV_WORKFLOW_STATE_FILE` override for relocating workflow state outside the repository.

## 1.1.7 — 2025-10-26
- Added prompts guiding developers to document changes immediately after tests pass.

## 1.1.6 — 2025-10-26
- Prevented `.state` from being created at filesystem roots.
- Enforced that commits must land before any release action can run.

## 1.1.5 — 2025-10-25
- Introduced the release guard, blocking `npm run release:*` until every prerequisite tool has run.
- Standardized per-project workflow state creation during installs.

## 1.1.4 — 2025-10-25
- Ensured the install script always targets the project root when initializing `.state`.

## 1.1.3 — 2025-10-25
- Packaged the MCP server for project-level installs with per-project workflow state isolation.

## 1.1.2 — 2025-10-25
- Version alignment release with no additional changes versus 1.1.1.

## 1.1.1 — 2025-10-25
- Added `force_complete_task`, letting teams close tasks early with an audit trail.

## 1.1.0 — 2025-10-25
- Added smart staging checks before commit, and made `continue_workflow` auto-run the next action in the commit phase.
- Enabled clean-tree commits to utilize `commit_and_push` and `perform_release` without manual staging.
- Clarified documentation for the commit/push step.

## 1.0.11 — 2025-10-25
- Added contextual "continue workflow" guidance describing the next recommended tool.
- Blocked releases until commits are safely pushed.

## 1.0.10 — 2025-10-24
- Modularized the workflow server internals for maintainability.
- Expanded automated tests around the release push flow.

## 1.0.9 — 2025-10-23
- Documented how local workflow state is managed across projects.

## 1.0.8 — 2025-10-21
- Added explicit workflows for skipping tests with justification and dropping tasks mid-flight.

## 1.0.7 — 2025-10-20
- Version alignment update; no new functionality recorded.

## 1.0.6 — 2025-10-20
- Strengthened release tests to ensure prerequisites are met before tagging.

## 1.0.5 — 2025-10-20
- Updated tests around `workflowState` persistence and validation.

## 1.0.4 — 2025-10-20
- Added an enforced release step after the ready check to ensure workflow order.
- Improved Windows compatibility by quoting commit messages safely.

## 1.0.3 — 2025-10-20
- Added a project `.gitignore` and clarified cross-platform installation steps.

## 1.0.2 — 2025-10-19
- Hardened `run_tests` argument validation and normalized tool call arguments.
- Expanded documentation around tool payload requirements.

## 1.0.1 — 2025-10-18
- Configured release tooling to support semantic version tagging moving forward.

## 1.0.0 — 2025-10-18
- Initial public release with the full MCP workflow (start → fix → tests → docs → commit → release → complete).
- Launched project governance, contribution guidelines, and tooling scaffolding.
