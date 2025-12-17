/**
 * Middleware to require authentication
 */
export function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }

    // If it's an API request, return 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Otherwise redirect to login
    res.redirect('/login');
}

/**
 * Middleware to redirect if already authenticated
 */
export function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    next();
}
