import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateUser, getUserById } from './lib/auth.js';

dotenv.config({ path: '../.env' });

const app = express();
const pgSession = connectPgSimple(session);
const { Pool } = pg;

const PORT = process.env.API_PORT || 8080;
const dbUrl = process.env.DEV_WORKFLOW_DB_URL;

if (!dbUrl) {
    console.error('❌ DEV_WORKFLOW_DB_URL is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

// CORS configuration - allow Netlify domain
const corsOptions = {
    origin: [
        'https://devworkflow.programinglive.com',
        'http://localhost:3000', // For local development
    ],
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
    session({
        store: new pgSession({
            pool,
            tableName: 'session',
        }),
        secret: process.env.SESSION_SECRET || 'dev-workflow-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-site for production
        },
    })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await authenticateUser(pool, username, password);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Store user in session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await getUserById(pool, req.session.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Workflow history endpoints
app.get('/api/history', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const result = await pool.query(
            `SELECT id, task_type, description, commit_message, completed_at, tests_passed, documentation_type
             FROM workflow_history
             WHERE user_id = $1
             ORDER BY completed_at DESC
             LIMIT 100`,
            [req.session.userId]
        );

        res.json({
            history: result.rows,
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.post('/api/history', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { task_type, description, commit_message, tests_passed, documentation_type } = req.body;

        const result = await pool.query(
            `INSERT INTO workflow_history (user_id, task_type, description, commit_message, tests_passed, documentation_type, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [req.session.userId, task_type, description, commit_message, tests_passed, documentation_type]
        );

        res.json({
            success: true,
            history: result.rows[0],
        });
    } catch (error) {
        console.error('Create history error:', error);
        res.status(500).json({ error: 'Failed to create history entry' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API server running on port ${PORT}`);
    console.log(`📊 Database: ${dbUrl.replace(/:[^:]*@/, ':****@')}`);
    console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});
