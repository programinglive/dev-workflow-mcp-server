# Dev Workflow Web Dashboard

Learn how to start and use the Dev Workflow dashboard included with the MCP server. The dashboard exposes project history, summaries, and aggregates through a small Node.js service.

## Prerequisites

Before launching the dashboard, confirm the following:

- Node.js 18+ installed (same requirement as the MCP server)
- Project dependencies installed with `npm install`
- Workflow history stored under `.state/` (created automatically when using the MCP server)

> **Plesk users:** follow the [Plesk installation guide](../README.md#option-3-install-on-plesk-hosting) first and ensure SSH access is enabled.

## Features

- **Task history browser** – Paginated list of completed workflow entries.
- **Summary stats** – Counts of tasks by type and recent activity timeline.
- **Aggregated trends** – Daily, monthly, or yearly breakdowns of workflow activity.
- **Multi-user support** – Switch between user identifiers recorded in the `.state` directory.

## Getting Started

Launch the dashboard from your project directory:

```bash
npm run web
```

When the server is ready you will see:

```
🌐 Dev Workflow Dashboard running at http://localhost:3111
```

Open the URL in your browser. If port 3111 is in use, the script automatically selects a nearby free port.

### Choosing a Port

Set `DEV_WORKFLOW_WEB_PORT` to force a specific port:

```bash
DEV_WORKFLOW_WEB_PORT=5000 npm run web
```

### Selecting a User

The dashboard defaults to the `default` user. Append `?user=<USER_ID>` to view another user’s data. User IDs map to the subdirectories under `.state/users/`.

```
http://localhost:3111/?user=my-teammate
```

## Navigation

The HTML frontend lives in `web/index.html`. The default UI includes:

- **Summary cards** – Total tasks completed and last active date.
- **Recent tasks table** – Paginated entries with task descriptions and timestamps.
- **Charts** (if script extensions are enabled) – Visual trends per frequency selection.

## API Reference

Interact with the dashboard programmatically using the JSON endpoints served by `web/server.js`.

### `GET /api/summary`

Returns aggregate statistics for a user.

**Query parameters**

- `user` *(optional, string)* – User identifier (default `default`).

**Response**

```json
{
  "summary": {
    "totalTasks": 12,
    "taskTypes": { "feature": 8, "bugfix": 3, "refactor": 1 },
    "lastActive": "2025-10-01T09:25:41.123Z",
    "recentTasks": [
      { "description": "feat: add billing webhooks", "type": "feature", "timestamp": "2025-10-01T09:25:41.123Z" }
    ],
    "updatedAt": "2025-10-01T09:30:00.000Z"
  }
}
```

### `GET /api/history`

Returns paginated task history.

**Query parameters**

- `user` *(optional, string)* – User identifier (default `default`).
- `page` *(optional, number)* – Page number (default `1`).
- `pageSize` *(optional, number)* – Items per page (default `20`, max `100`).
- `startDate` *(optional, string)* – Filter by ISO date (inclusive).
- `endDate` *(optional, string)* – Filter by ISO date (inclusive).

**Response**

```json
{
  "entries": [
    {
      "id": 42,
      "user_id": "default",
      "task_description": "feat: add reporting endpoint",
      "task_type": "feature",
      "commit_message": "feat: add reporting endpoint",
      "timestamp": "2025-09-30T09:18:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### `GET /api/history-summary`

Returns an array of task counts grouped by period.

**Query parameters**

- `user` *(optional, string)* – User identifier (default `default`).
- `frequency` *(optional, string)* – `daily`, `monthly`, or `yearly` (default `daily`).
- `startDate`, `endDate` *(optional, string)* – Limit range by ISO dates.

**Response**

```json
{
  "summary": [
    { "period": "2025-09-30", "count": 3 },
    { "period": "2025-09-29", "count": 1 }
  ]
}
```

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `DEV_WORKFLOW_WEB_PORT` | Port for the dashboard | `3111` or next available |
| `DEV_WORKFLOW_USER_ID` | User identifier when launching via MCP | auto-generated |
| `DEV_WORKFLOW_STATE_FILE` | Overrides path to workflow state JSON | auto-detected |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Server fails with `better-sqlite3` build error | Install Python 3 and build tools (Windows) or ensure SQLite build dependencies exist (Linux/macOS). |
| Dashboard shows empty data | Confirm the MCP server has generated `.state/users/<user>/workflow-state.json` and that the chosen `user` matches. |
| Port already in use | Set `DEV_WORKFLOW_WEB_PORT` to a free port before running `npm run web`. |

## Related Topics

- [Main README](../README.md)
- [Workflow State Internals](./state.md) *(coming soon)*
- [CLI Tools](../README.md#🛠️-available-tools)
