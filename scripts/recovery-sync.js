import pg from 'pg';
const { Client } = pg;

const history = [
    {
        taskDescription: 'Improve MCP server startup performance and database resilience',
        taskType: 'bugfix',
        commitMessage: 'fix: optimize startup performance and add database connection resilience',
        timestamp: '2025-12-19T22:35:01',
        testsPassed: true,
        documentationType: 'README'
    },
    {
        taskDescription: 'Verify history record creation and list update on the web app',
        taskType: 'feature',
        commitMessage: 'chore: history verification task complete',
        timestamp: '2025-12-19T16:43:56',
        testsPassed: true,
        documentationType: 'other'
    },
    {
        taskDescription: 'Commit all changes and release patch version',
        taskType: 'feature',
        commitMessage: 'chore(release): 1.7.14',
        timestamp: '2025-12-19T16:03:02',
        testsPassed: true,
        documentationType: 'other'
    },
    {
        taskDescription: 'Finalize project, commit fixes, and perform patch release',
        taskType: 'chore',
        commitMessage: 'fix: remote db connection, history api 500 errors, and windows startup',
        timestamp: '2025-12-18T21:54:25',
        testsPassed: true,
        documentationType: 'other'
    },
    {
        taskDescription: 'Finalize remote database configuration and authentication setup',
        taskType: 'feature',
        commitMessage: 'feat: configure remote postgres, auth, and health checks',
        timestamp: '2025-12-18T21:26:13',
        testsPassed: true,
        documentationType: 'other'
    },
    {
        taskDescription: 'Fix 500 Internal Server Error on /api/workflow/history and ensure database schema matches requirements',
        taskType: 'bugfix',
        commitMessage: 'fix: resolve 500 error on history API, auth sync, and UI warnings',
        timestamp: '2025-12-17T15:50:40',
        testsPassed: true,
        documentationType: 'other'
    },
    {
        taskDescription: 'Add workflow history display to website',
        taskType: 'feature',
        commitMessage: 'feat: add workflow history display with API endpoint and UI',
        timestamp: '2025-12-17T15:15:21',
        testsPassed: true,
        documentationType: 'other'
    }
];

async function sync() {
    const connectionString = 'postgres://udevworkflow:pdevworkflow@34.50.121.142:5432/devworkflow';
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to remote DB');

        for (const entry of history) {
            console.log(`Syncing: ${entry.taskDescription}`);
            // Check if exists
            const check = await client.query(
                'SELECT id FROM workflow_history WHERE user_id = $1 AND completed_at = $2 AND description = $3',
                [1, entry.timestamp, entry.taskDescription]
            );

            if (check.rows.length === 0) {
                await client.query(
                    'INSERT INTO workflow_history (user_id, task_type, description, commit_message, completed_at, tests_passed, documentation_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [1, entry.taskType, entry.taskDescription, entry.commitMessage, entry.timestamp, entry.testsPassed, entry.documentationType]
                );
                console.log('  Inserted.');
            } else {
                console.log('  Already exists.');
            }
        }

        console.log('✅ Manual recovery sync completed');
    } catch (e) {
        console.error('❌ Sync failed:', e.message);
    } finally {
        await client.end();
    }
    process.exit(0);
}

sync();
