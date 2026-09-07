const express = require('express');
const bcrypt = require('bcryptjs');
const { get } = require('../config/db');
const { sign, auth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ success: false, error: 'Missing credentials' });
        const u = get(
            'SELECT u.id, u.username, u.password_hash, u.name, u.role_id, u.active, r.name AS role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.username = ?',
            [username]
        );
        if (!u || !u.active || !bcrypt.compareSync(String(password), u.password_hash)) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
        const token = sign(u);
        res.json({ success: true, data: { token, user: { id: u.id, username: u.username, name: u.name, role_id: u.role_id, role_name: u.role_name } } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/me', auth, (req, res) => {
    res.json({ success: true, data: { id: req.user.id, username: req.user.username, name: req.user.name, role_id: req.user.role_id, role_name: req.user.role_name, permissions: req.perms } });
});

module.exports = router;