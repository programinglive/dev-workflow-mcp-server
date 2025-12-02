# Product Requirements Document (PRD)

## 1. Overview
- **Product**: Development Workflow MCP Server
- **Prepared by**: Cascade (AI assistant)
- **Date**: 2025-10-31
- **Status**: Draft v0.1

## 2. Problem Statement
Developers need structured guidance to maintain disciplined workflows across projects. Existing tooling lacks enforcement of sequential best practices (testing, documentation, release hygiene) and offers limited visibility into historical task execution.

## 3. Goals & Objectives
1. Enforce a consistent, auditable development workflow across teams.
2. Provide actionable guidance for each workflow phase within IDE-integrated environments.
3. Maintain per-project, per-user workflow state while supporting shared infrastructure (e.g., SQLite summaries, dashboard).

## 4. Non-Goals
- Replacing full-featured project management tools.
- Implementing source control hosting or CI/CD pipelines.
- Providing opinionated task estimation or prioritization features.

## 5. Target Users & Personas
- **Individual developers** seeking workflow discipline.
- **Team leads** requiring enforced process compliance.
- **Tool integrators** embedding MCP capabilities into IDEs or agents.

## 6. User Stories
1. As a developer, I want to be guided through the workflow steps so I can avoid skipping critical tasks.
2. As a team lead, I want an auditable history of workflow completion so I can ensure compliance.
3. As an integrator, I want a simple API (tools/prompts) so I can plug the MCP server into existing agent workflows.

## 7. Functional Requirements
- Provide MCP tools covering the full workflow lifecycle (start task, fix, test, document, commit, release, complete).
- Persist workflow state per project and per user, with compatibility handling for legacy locations.
- Offer aggregated project summaries (JSON artifacts, SQLite sync, optional web dashboard).
- Guard release commands to ensure prerequisites are satisfied.
- Support `run_full_workflow` for scripted execution of all steps with validation.
- Web dashboard displays version dynamically from `package.json` via `/api/version` endpoint to stay in sync after releases.

## 8. Technical Considerations
- Node.js (ESM) codebase leveraging `@modelcontextprotocol/sdk`.
- File-based state stored under `.state/users/<user>/workflow-state.json` with compatibility symlinks.
- Optional SQLite integration for history and summary caching.
- Vite build pipeline for distribution bundle; source usage recommended for MCP.
- Windows compatibility requirements (Python, Build Tools for native modules).
- **Deployment options**: Local development, Netlify (static), Plesk (full-featured).

## 9. Success Metrics
- ≥90% of workflow operations executed via MCP tools (vs. manual overrides).
- Reduction in release guard violations to <5% of attempts.
- Positive qualitative feedback on guidance clarity from pilot teams.

## 10. Milestones
1. **MVP**: Core workflow tools, state persistence, basic history (complete).
2. **Enhancements**: Improved project root detection, compatibility mirrors, `run_full_workflow` automation (complete).
3. **v1.5.0**: Netlify deployment support for static web dashboard (complete).
4. **Future**: Expanded dashboard analytics, customizable workflows, richer integrations.

## 11. Risks & Mitigations
- **Risk**: Workflow feels overly prescriptive. **Mitigation**: Provide escape hatches (`force_complete_task`, `drop_task`) with audit trails.
- **Risk**: State corruption due to concurrent access. **Mitigation**: File locking and defensive JSON parsing (existing code handles gracefully, but monitor).
- **Risk**: Integration friction with IDE clients. **Mitigation**: Maintain detailed README instructions and example configurations.

## 12. Open Questions
- Should additional workflow phases (e.g., design review) be supported?
- How should multi-branch workflows be represented in history summaries?
- What telemetry or analytics are acceptable within privacy constraints?
