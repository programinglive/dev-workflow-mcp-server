# Contributing to dev-workflow-mcp-server

Thanks for your interest in contributing! Follow the guidelines below to keep the development process smooth and aligned with the workflow enforced by this project.

## Development Workflow

1. **Start a task** using the MCP server's `start_task` tool with a clear description and task type.
2. **Implement the change** following the single flow rules documented in the README.
3. **Write or update tests**. All code changes must include tests when applicable.
4. **Run tests** with `npm test` and ensure they pass.
5. **Document changes**. Update `README.md` or other docs as needed.
6. **Commit** following conventional commits (e.g., `feat: add new tool`).
7. **Push** your branch and open a pull request using the provided template.

## Getting Started

- Fork the repository and clone it locally.
- Install dependencies:

```bash
npm install
```

- Run the test suite to verify your setup:

```bash
npm test
```

## Pull Requests

- Use a descriptive branch name (e.g., `feat/new-tool` or `fix/workflow-reset`).
- Fill out the pull request template completely, including tests and documentation details.
- Link related issues in the PR description.
- Ensure CI checks pass before requesting review.

## Coding Standards

- Use TypeScript-friendly patterns even in JavaScript (avoid dynamic typing pitfalls).
- Remove unused imports and variables before committing.
- Follow existing code style and formatting.

## Commit Messages

- Follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).
- Example: `feat: enforce documentation reminder before commit`.

## Reporting Issues

- Search open issues to avoid duplicates.
- When filing a bug, include reproduction steps, expected behavior, and environment details.
- Feature requests should explain the problem being solved and potential benefits.

## Code of Conduct

By participating, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Contact

Questions? Reach out at `opensource@programinglive.com`.
