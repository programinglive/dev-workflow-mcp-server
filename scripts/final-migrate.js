import fs from 'fs/promises';
import path from 'path';
import { WorkflowState } from '../workflow-state.js';

async function migrate() {
    const projectRoot = process.cwd();
    const sourceFile = path.join(projectRoot, '.state', 'users', 'default', 'workflow-state.json');
    const targetUserId = '1';
    const targetStateDir = path.join(projectRoot, '.state', 'users', targetUserId);
    const targetStateFile = path.join(targetStateDir, 'workflow-state.json');

    console.log(`Source: ${sourceFile}`);
    console.log(`Target: ${targetStateFile}`);

    try {
        const data = await fs.readFile(sourceFile, 'utf-8');
        const state = JSON.parse(data);

        console.log(`Found ${state.history ? state.history.length : 0} history entries.`);

        await fs.mkdir(targetStateDir, { recursive: true });
        await fs.writeFile(targetStateFile, JSON.stringify(state, null, 2));

        // Also write a mirror to .state/user-id to ensure MCP server picks it up
        await fs.writeFile(path.join(projectRoot, '.state', 'user-id'), targetUserId);

        console.log(`✅ Files migrated. Triggering sync...`);

        const ws = new WorkflowState(targetStateFile);
        await ws.load();

        // Ensure env vars are set (redundant but safe)
        process.env.DEV_WORKFLOW_USER_ID = targetUserId;

        await ws.syncToDatabase();
        console.log('✅ Sync call finished.');

    } catch (e) {
        console.error('❌ Failed:', e.message);
    }

    process.exit(0);
}

migrate();
