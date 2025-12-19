import { WorkflowState } from '../workflow-state.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sync() {
    const userId = process.env.DEV_WORKFLOW_USER_ID || 'programinglive';
    console.log(`Syncing for user: ${userId}`);

    // We need to point to the correct state file
    const ws = new WorkflowState();
    await ws.load();

    console.log(`Loaded state from: ${ws.stateFile}`);
    console.log(`History count: ${ws.state.history.length}`);

    // Force sync
    try {
        await ws.syncToDatabase();
        console.log('✅ Sync completed successfully');
    } catch (e) {
        console.error('❌ Sync failed:', e.message);
    }

    process.exit(0);
}

sync();
