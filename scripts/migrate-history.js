import fs from 'fs/promises';
import path from 'path';
import { WorkflowState } from '../workflow-state.js';

async function migrate() {
    const projectRoot = process.cwd();
    const defaultStateFile = path.join(projectRoot, '.state', 'users', 'default', 'workflow-state.json');
    const targetUserId = 'programinglive';
    const targetStateDir = path.join(projectRoot, '.state', 'users', targetUserId);
    const targetStateFile = path.join(targetStateDir, 'workflow-state.json');

    console.log(`Checking for default state at: ${defaultStateFile}`);

    try {
        const data = await fs.readFile(defaultStateFile, 'utf-8');
        const state = JSON.parse(data);

        console.log(`Found history with ${state.history.length} entries.`);

        await fs.mkdir(targetStateDir, { recursive: true });
        await fs.writeFile(targetStateFile, JSON.stringify(state, null, 2));
        console.log(`✅ Migrated history to user: ${targetUserId}`);

        // Now sync
        const ws = new WorkflowState(targetStateFile);
        await ws.load();

        console.log('Attempting sync to database...');
        await ws.syncToDatabase();
        console.log('✅ Global sync triggered');

    } catch (e) {
        console.error('❌ Migration/Sync failed:', e.message);
    }

    process.exit(0);
}

migrate();
