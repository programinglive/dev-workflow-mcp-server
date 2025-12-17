#!/usr/bin/env node
import 'dotenv/config';
import pg from 'pg';
import { createUser } from '../web/lib/auth.js';

const { Pool } = pg;

// Get database configuration from environment
const dbUrl = process.env.DEV_WORKFLOW_DB_URL;

if (!dbUrl) {
    console.error('Error: DEV_WORKFLOW_DB_URL environment variable is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function addUser() {
    const username = process.argv[2];
    const password = process.argv[3];
    const email = process.argv[4];

    if (!username || !password) {
        console.error('Usage: node scripts/add-user.js <username> <password> [email]');
        process.exit(1);
    }

    try {
        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

        if (existing.rows.length > 0) {
            console.log(`✗ User '${username}' already exists`);
            process.exit(1);
        }

        // Create user
        const user = await createUser(pool, username, password, email);
        console.log(`✓ Created user: ${user.username}`);
        if (user.email) {
            console.log(`  Email: ${user.email}`);
        }

    } catch (error) {
        console.error('Error creating user:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addUser();
