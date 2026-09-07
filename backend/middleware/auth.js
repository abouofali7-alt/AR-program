const jwt = require('jsonwebtoken');
const { get } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ar-program-local-secret-2026';

function sign(user) {
    return jwt.sign({ uid: user.id, role: user.role_name }, JWT_SECRET, { expiresIn: '12h' });
}

function auth(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const u = get(
            'SELECT u.id, u.username, u.name, u.role_id, u.active, r.name AS role_name, r.permissions FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?',
            [payload.uid]
        );
        if (!u || !u.active) return res.status(401).json({ success: false, error: 'User inactive' });
        req.user = u;
        try { req.perms = JSON.parse(u.permissions); } catch (e) { req.perms = []; }
        next();
    } catch (e) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

function requirePerm(...perms) {
    return (req, res, next) => {
        if (req.perms.includes('*') || perms.some(p => req.perms.includes(p))) return next();
        return res.status(403).json({ success: false, error: 'Forbidden' });
    };
}

module.exports = { auth, requirePerm, sign, JWT_SECRET };