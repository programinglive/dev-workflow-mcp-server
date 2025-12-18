import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pgSession = connectPgSimple(session);
const { Pool } = pg;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize PostgreSQL pool for sessions
const dbUrl = process.env.DEV_WORKFLOW_DB_URL;
const pool = dbUrl ? new Pool({ connectionString: dbUrl }) : null;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import auth utilities
let authenticateUser, getUserById;
if (pool) {
    import('./lib/auth.js').then(module => {
        authenticateUser = module.authenticateUser;
        getUserById = module.getUserById;
    });
}

app.prepare().then(() => {
    const server = express();

    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    // Session middleware
    if (pool) {
        server.use(
            session({
                store: new pgSession({
                    pool,
                    tableName: 'session'
                }),
                secret: process.env.SESSION_SECRET || 'dev-workflow-secret-change-in-production',
                resave: false,
                saveUninitialized: false,
                cookie: {
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production'
                }
            })
        );
    }

    // Auth API routes
    server.post('/api/auth/login', async (req, res) => {
        if (!pool || !authenticateUser) {
            return res.status(500).json({ error: 'Database not configured' });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        try {
            const user = await authenticateUser(pool, username, password);

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            req.session.userId = user.id;
            req.session.username = user.username;

            res.json({ success: true, user: { username: user.username, email: user.email } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    server.post('/api/auth/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ success: true });
        });
    });

    server.get('/api/auth/me', async (req, res) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!pool || !getUserById) {
            return res.status(500).json({ error: 'Database not configured' });
        }

        try {
            const user = await getUserById(pool, req.session.userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user: { username: user.username, email: user.email } });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get workflow history
    server.get('/api/workflow/history', async (req, res) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!pool) {
            return res.status(500).json({ error: 'Database not configured' });
        }

        try {
            // Get user details to filter history
            // We assume workflow_history.user_id stores the username (based on schema)
            // We use userId (integer) to query the foreign key column
            const userId = req.session.userId;

            let query = `
                SELECT 
                    id, 
                    task_type, 
                    task_description as description, 
                    commit_message, 
                    timestamp as completed_at, 
                    tests_passed, 
                    documentation_type 
                FROM workflow_history 
            `;

            const params = [];

            if (userId) {
                query += ` WHERE user_id = $1 `;
                params.push(userId);
            }

            query += ` ORDER BY timestamp DESC LIMIT 100`;

            const result = await pool.query(query, params);

            res.json({ history: result.rows });
        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Next.js handler for all other routes
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
