
import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

async function testHistoryScript() {
    console.log('--- Testing db-query-history.js execution ---');

    // Simulate what route.ts does:
    // 1. Path to script
    // 2. Env vars
    // 3. Child process exec

    const scriptPath = path.join(__dirname, '../web/scripts/db-query-history.js');
    console.log('Script Path:', scriptPath);

    // Simulate "programinglive" session if possible, or empty string (fallback to admin)
    // We don't have a valid session ID handy without login, so let's pass empty, which triggers the fallback logic (find admin/any user)
    const sid = '';

    try {
        const { stdout, stderr } = await execPromise(`node "${scriptPath}" "${sid}"`, {
            env: { ...process.env, DEV_WORKFLOW_DB_URL: process.env.DEV_WORKFLOW_DB_URL }
        });

        console.log('STDOUT:', stdout);
        if (stderr) console.error('STDERR:', stderr);

        try {
            const data = JSON.parse(stdout);
            console.log('✅ Success! Parsed JSON:', data);
            if (data.history && data.history.length === 0) {
                console.warn('⚠️  History is empty (check user_id linkage)');
            }
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e.message);
        }

    } catch (err) {
        console.error('❌ Execution Failed:', err.message);
        console.error('STDOUT:', err.stdout);
        console.error('STDERR:', err.stderr);
    }
}

// We need to load .env for this test script itself to run?
// Actually the exec inherits process.env.
// But we are running THIS script with node, so we need dotenv here if relying on process.env passing through.
import 'dotenv/config'; // simplistic load

testHistoryScript();
