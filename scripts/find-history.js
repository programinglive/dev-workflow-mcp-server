import { WorkflowState } from '../workflow-state.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function findIt() {
    console.log('--- Search Started ---');
    const ws = new WorkflowState();
    console.log('Likely state file:', ws.stateFile);

    // Search possible locations
    const locations = [
        ws.stateFile,
        path.join(os.homedir(), '.state', 'workflow-state.json'),
        path.join(os.homedir(), '.state', 'users', 'default', 'workflow-state.json'),
        path.join(process.cwd(), '.state', 'workflow-state.json'),
        path.join(process.cwd(), '.state', 'users', 'default', 'workflow-state.json')
    ];

    for (const loc of locations) {
        if (fs.existsSync(loc)) {
            const stat = fs.statSync(loc);
            console.log(`Found: ${loc} (${stat.size} bytes)`);
            if (stat.size > 2000) {
                const data = fs.readFileSync(loc, 'utf8');
                const json = JSON.parse(data);
                console.log(`History length: ${json.history ? json.history.length : 'N/A'}`);
                if (json.history && json.history.length > 0) {
                    console.log('--- TARGET FOUND ---');
                }
            }
        }
    }
    process.exit(0);
}

findIt();
