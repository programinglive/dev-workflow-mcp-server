import bcrypt from 'bcrypt';
import pg from 'pg';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Create a new user
 */
export async function createUser(pool, username, password, email = null) {
    const passwordHash = await hashPassword(password);

    const result = await pool.query(
        'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, passwordHash, email]
    );

    return result.rows[0];
}

/**
 * Authenticate a user
 */
export async function authenticateUser(pool, username, password) {
    const result = await pool.query(
        'SELECT id, username, password_hash, email FROM users WHERE username = $1',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    // Update last login
    await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
    );

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Get user by ID
 */
export async function getUserById(pool, id) {
    const result = await pool.query(
        'SELECT id, username, email, created_at, last_login FROM users WHERE id = $1',
        [id]
    );

    return result.rows[0] || null;
}
