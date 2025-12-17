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

async function createAdminUser() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';

    try {
        // Check if admin user already exists
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

        if (existing.rows.length > 0) {
            console.log(`✓ Admin user '${username}' already exists`);
            process.exit(0);
        }

        // Create admin user
        const user = await createUser(pool, username, password, email);
        console.log(`✓ Created admin user: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${password}`);
        console.log('\n⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('Error creating admin user:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createAdminUser();
