import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '../.env' });

const app = express();
const { Pool } = pg;

const PORT = process.env.API_PORT || 8080;
const dbUrl = process.env.DEV_WORKFLOW_DB_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-workflow-jwt-secret-change-me';

if (!dbUrl) {
    console.error('❌ DEV_WORKFLOW_DB_URL is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

// Authentication helper functions
async function authenticateUser(pool, username, password) {
    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email,
    };
}

async function getUserById(pool, userId) {
    const result = await pool.query(
        'SELECT id, username, email FROM users WHERE id = $1',
        [userId]
    );

    return result.rows[0] || null;
}

// CORS configuration - allow Netlify domain
const corsOptions = {
    origin: [
        'https://devworkflow.programinglive.com',
        'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// Middleware to verify JWT
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    return res.status(401).json({ error: 'Authentication required' });
};

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

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
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
    // Client-side only action for JWT
    res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const user = await getUserById(pool, req.user.userId);

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
app.get('/api/history', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, task_type, description, commit_message, completed_at, tests_passed, documentation_type
             FROM workflow_history
             WHERE user_id = $1
             ORDER BY completed_at DESC
             LIMIT 100`,
            [req.user.userId]
        );

        res.json({
            history: result.rows,
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.post('/api/history', requireAuth, async (req, res) => {
    try {
        const { task_type, description, commit_message, tests_passed, documentation_type } = req.body;

        const result = await pool.query(
            `INSERT INTO workflow_history (user_id, task_type, description, commit_message, tests_passed, documentation_type, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [req.user.userId, task_type, description, commit_message, tests_passed, documentation_type]
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
