
import pg from 'pg';
const { Client } = pg;
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function healthCheck() {
    console.log('--- Database Health Check ---');

    if (!process.env.DEV_WORKFLOW_DB_URL) {
        console.error('❌ DEV_WORKFLOW_DB_URL is missing!');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DEV_WORKFLOW_DB_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connectivity: OK');

        // Simple query to verify schema access
        const res = await client.query('SELECT count(*) as count FROM workflow_history');
        console.log(`✅ Schema Access: OK (Found ${res.rows[0].count} history entries)`);

        // Check users table
        const users = await client.query('SELECT count(*) as count FROM users');
        console.log(`✅ Auth Table: OK (Found ${users.rows[0].count} users)`);

    } catch (err) {
        console.error('❌ Health Check Failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

healthCheck();
