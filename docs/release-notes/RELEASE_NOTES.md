# Release Notes

Authoritative history of user-visible changes for the Development Workflow MCP Server. Each entry highlights the improvements that shipped with the tagged version.

| Version | Date | Notes |
|---------|------|-------|
| 1.7.12 | 2025-12-17 | post-release cleanup v1.7.11 (c2ee733) |
| 1.7.11 | 2025-12-17 | test: comprehensive DB adapter tests, env support, and warning fixes (64b029a) |
| 1.7.10 | 2025-12-16 | update release notes and finalize ci config (92ac78a) |
| 1.7.9 | 2025-12-16 | **ci:** apply official npm trusted publishing config (9256583) |
| 1.7.8 | 2025-12-16 | **ci:** remove all token config for pure OIDC publishing (d4759cc) |
| 1.7.7 | 2025-12-16 | **ci:** remove duplicates and apply robust trusted publishing config (eedb661) |
| 1.7.6 | 2025-12-16 | **ci:** restore registry config with token fallback for Trusted Publishing (542615c) |
| 1.7.5 | 2025-12-16 | **ci:** switch to tokenless trusted publishing (fdfc4a9) |
| 1.7.4 | 2025-12-16 | **ci:** add id-token permission for npm provenance (8930338) |
| 1.7.3 | 2025-12-16 | **ci:** add web dependencies installation step (7d5dc62) |
| 1.7.2 | 2025-12-16 | **ci:** consolidate release and publish workflows (98e5b31) |
| 1.7.1 | 2025-12-16 | build errors and warnings (dc24831) |
| 1.7.0 | 2025-12-16 | See CHANGELOG for details. |
| 1.6.3 | 2025-12-06 | update release notes for 1.6.2 (f0c2d49) |
| 1.6.2 | 2025-12-06 | update release notest for 1.6.1 (72a9284) |
| 1.6.1 | 2025-12-06 | add table header to release notes for release script compatibility (44e47fc) |

















## 1.7.12 – 📝 Documentation

Released on **2025-12-17**.

- post-release cleanup v1.7.11 (c2ee733)
- add authentication system with login page and protected routes (2acb20e)
- add Docker deployment support with PostgreSQL for GCP (3adb4cb)
- expose PostgreSQL port for remote access (b1d4066)
- revamp history page UI and remove history from landing (a9d0e4e)
- simplify docker-compose to only PostgreSQL, improve logout button UI (4530862)
- suppress 401 auth errors in console (b63e63b)
- **web:** resolve 500 error on history API and auth sync (88bbff0)
- configure commitlint and husky via commiter setup (4de6c84)
- update website to v1.7.11 and fix dependencies (da80b1c)

## 1.7.11 – 📝 Documentation

Released on **2025-12-16**.

- fix version status in PRD (fa7912b)
- implement .env support and fix mysql date persistence (096797c)
## 1.7.11 – 📝 Documentation & 🧪 Testing

Released on **2025-12-17**.

- test: comprehensive DB adapter tests for MySQL, PostgreSQL, and SQLite (64b029a)
- test: implemented env support verification (64b029a)
- test: fixed deprecation warnings and missing mock exports (64b029a)
- docs: updated PRD and README with testing guide (64b029a)

## 1.7.10 – 🧹 Chores

Released on **2025-12-16**.

- update release notes and finalize ci config (92ac78a)
- update PRD and release notes for v1.7.9 (024b3c2)

## 1.7.9 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** apply official npm trusted publishing config (9256583)
  - Fixed recurring ENEEDAUTH errors by adhering strictly to npm's Trusted Publishing documentation.
  - Configuration now includes `registry-url` in `setup-node` combined with `id-token: write` permission.
  - Ensures a seamless, tokenless release process via OIDC.

## 1.7.8 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** remove all token config for pure OIDC publishing (d4759cc)

## 1.7.7 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** remove duplicates and apply robust trusted publishing config (eedb661)

## 1.7.6 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** restore registry config with token fallback for Trusted Publishing (542615c)

## 1.7.5 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** switch to tokenless trusted publishing (fdfc4a9)

## 1.7.4 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** add id-token permission for npm provenance (8930338)

## 1.7.3 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** add web dependencies installation step (7d5dc62)

## 1.7.2 – 🐛 Bug Fixes

Released on **2025-12-16**.

- **ci:** consolidate release and publish workflows (98e5b31)

## 1.7.1 – 🐛 Bug Fixes

Released on **2025-12-16**.

- build errors and warnings (dc24831)
- suppress remaining build warnings (f7d9b2d)
- handle null CustPL in birthday-customers.blade.php (ERP-19) (71b8f7e)
- integrate database adapters into workflow state (370cbb4)
- update PRD and add configuration guide (1dfccf5)
- update release notes for 1.6.3 (afb9fb9)
- add mysql2 and pg dependencies (94423d7)
- **release:** null 🚀 (93a17e2)
- **release:** null 🚀 (033097e)
- **release:** null 🚀 (91c800a)
- **release:** null 🚀 (f0958c4)
- **release:** null 🚀 (ac3cc6e)
- **release:** null 🚀 (f3f9a00)
- **release:** null 🚀 (bcf7d95)
- **release:** null 🚀 (74df6d6)
- **release:** null 🚀 (0d9dc4d)
- **release:** null 🚀 (9667012)
- **release:** null 🚀 (db25d0c)
- **release:** null 🚀 (50d5353)
- **release:** null 🚀 (ee0a540)
- **release:** null 🚀 (92558af)
- **release:** null 🚀 (cd851ac)
- **release:** null 🚀 (49ec562)
- **release:** null 🚀 (bcc7a3c)
- implement database adapters for sqlite, mysql, postgres (8e7416a)
- persist active workflow state to database (d29546d)

## 1.7.0

Released on **2025-12-16**.

- See CHANGELOG for details.

## 1.6.3 – 📝 Documentation

Released on **2025-12-06**.

- update release notes for 1.6.2 (f0c2d49)
- add light mode support to docs page (490cf22)

## 1.6.2 – 📝 Documentation

Released on **2025-12-06**.

- update release notest for 1.6.1 (72a9284)
- update create_documentation test to verify PRD check and remove incompatible jest test (a7f2b28)
- add PRD file existence check to create_documentation workflow step (62cdee3)
- add PRD file existence check to create_documentation workflow step (6c51012)

## 1.6.1 – 🐛 Bug Fixes

Released on **2025-12-06**.

- add table header to release notes for release script compatibility (44e47fc)
- add responsive vertical monitor support and dark/light mode toggle (5565765)

## Unreleased

## 1.5.11 — 2025-12-05
- See CHANGELOG for details.

## 1.5.10 — 2025-12-05
- See CHANGELOG for details.

## 1.5.9 — 2025-12-05
- See CHANGELOG for details.

## 1.5.8 — 2025-12-05 — 🐛 Bug Fixes
- **release:** amend tag to include release notes, remove build-docs.js and dist/docs (a3cea9b)

## 1.5.7 — 2025-12-05 — 🐛 Bug Fixes
- **ci:** checkout main branch for release notes and remove RELEASE_NOTES.html generation (5d50dc0)

## 1.5.6 — 2025-12-05 — 🐛 Bug Fixes
- **ci:** update github release workflow to use github-script (0990808)

## 1.5.5 — 2025-12-05 — 📝 Documentation
- add unreleased note for release automation (a5478dc)
- ensure GitHub release workflow writes release notes correctly

## 1.5.4 — 2025-12-05 — 🧹 Chores
- **ci:** add github release automation workflow (80d5ded)
- **release:** version 1.5.3 changes and changelog (c2698a7)
- run release scripts via cjs (bc241c8)
- **web:** update version display to 1.5.3 in docs page (25e37f3)
- **web:** update version display to 1.5.3 in Hero component (b478449)

## 1.5.3 — 2025-12-05 — 🐛 Bug Fixes
- correct package.json version from null to 1.5.2 for npm publish (be60c99)
- **news:** improve error handling and form accessibility (5e0a1a8)
- switch to static export for Netlify deployment (acddfd7)
- **release:** null 🚀 (55d7f99)
- **release:** prepare patch release 1.5.3 (5b92c42)

## 1.5.0 — 2025-12-02
- See CHANGELOG for details.

## 1.4.11 — 2025-12-01 — 🐛 Bug Fixes
- move vite to dependencies to ensure build works on production (62fc4c0)
- resolve sentry permission issues (c739f8e)

## 1.4.10 — 2025-12-01 — ✨ Features
- **dashboard:** implement random data generation for analytics chart (17e2073)
- move dompdf to require and resolve debugbar production error (e5d1cb6)

## 1.4.9 — 2025-11-30 — ♻️ Refactors
- **dashboard:** combine analytics charts and use local Chart.js (86ed3f4)

## 1.4.8 — 2025-11-30 — 🐛 Bug Fixes
- **dashboard:** improve responsive layout for admin stats cards (33d5b39)
- **dashboard:** improve responsive layout for admin stats cards (530400d)

## 1.4.7 — 2025-11-29 — ✨ Features
- add core doc types (PRD/README/RELEASE_NOTES) and fix CI build (8ed0567)
- update hero text and meta description to emphasize Indonesian programmer community (681547b)
- display dynamic version in web dashboard from /api/version (69f561d)
- add 1.4.3 release notes (8b165f7)
- add MCP registry metadata (mcpName & server.json) (66caea1)
- align MCP registry schema and docs (e4e732d)
- **release:** 1.4.4 🚀 (05a968f)
- **release:** 1.4.5 🚀 (7e823b9)
- **release:** 1.4.6 🚀 (7e0b672)

## 1.4.6 — 2025-11-27 — 🧹 Chores
- add MCP registry metadata (mcpName & server.json) (66caea1)

## 1.4.5 — 2025-11-27 — 🐛 Bug Fixes
- display dynamic version in web dashboard from /api/version (69f561d)

## 1.4.4 — 2025-11-27 — ♻️ Refactors
- consolidate workflow state to root .state folder only (3d69a14)
- ensure release guard uses freshest workflow state (e07eb42)
- remove invalid turbopack experimental config from next.config.ts (af0a7ea)
- **web:** configure next.js root to silence warnings (22ed002)
- **web:** improve mobile layout for hero section (53b26bf)
- add Plesk deployment guide (de35675)
- add 1.4.3 release notes (8b165f7)
- fix release state detection (ed5dfd1)
- prepare for release (a6ea2d0)
- **release:** 1.4.2 (fac8999)
- **release:** 1.4.2 🚀 (01b0b3c)
- **release:** 1.4.3 🚀 (04d8c3b)
- update task list (35663dd)
- **web:** fix next.js lockfile warning (05ffce0)
- add core doc types (PRD/README/RELEASE_NOTES) and fix CI build (8ed0567)
- update hero text and meta description to emphasize Indonesian programmer community (681547b)
- update program tracks and fix fast refresh warning (aa5bc9c)

## 1.4.3 — 2025-11-27 — 🧹 Chores
- **release:** 1.4.2 (fac8999)
- remove invalid turbopack experimental config from next.config.ts (af0a7ea)
- add Plesk deployment guide (de35675)
- update program tracks and fix fast refresh warning (aa5bc9c)

## 1.4.2 — 2025-11-27 — 🧹 Chores
- fix release state detection (ed5dfd1)
- prepare for release (a6ea2d0)
- update task list (35663dd)
- **web:** fix next.js lockfile warning (05ffce0)
- ensure release guard uses freshest workflow state (e07eb42)
- **web:** configure next.js root to silence warnings (22ed002)
- **web:** improve mobile layout for hero section (53b26bf)
- consolidate workflow state to root .state folder only (3d69a14)

## 1.4.1 — 2025-11-27 — 🐛 Bug Fixes
- update build test to include postbuild (b1e2f48)
- add custom server.js for Plesk (b3912cd)
- migrate dashboard to Next.js with TypeScript and Tailwind CSS (bce1fec)
- fix package.json scripts (fb25e98)
- fix tsconfig and remove dist artifact (282759f)

## 1.4.0 — 2025-11-26
- See CHANGELOG for details.

## 1.3.11 — 2025-11-23
- Re-applied Plesk security fix (moved static files to `web/public/`).
- Updated build configuration and server paths.

## 1.3.10 — 2025-11-23
- Fixed workflow state synchronization issue that caused forced releases.
- Added `docs/WORKFLOW-BEST-PRACTICES.md`.

## 1.3.9 — 2025-11-23
- Improved documentation modal layout and readability.

## 1.3.8 — 2025-11-23
- Fixed documentation loading in production by tracking `dist/docs` in git.

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
