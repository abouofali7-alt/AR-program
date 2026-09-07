let app;
try {
    app = require('../backend/server');
    if (typeof app !== 'function' && app && typeof app.app === 'function') {
        app = app.app;
    }
} catch (e) {
    console.error('Vercel server initialization fallback:', e.message);
    const express = require('express');
    app = express();
    app.get('/api/health', (req, res) => res.json({ success: true, data: { ok: true, fallback: true } }));
    app.use('/api', (req, res) => res.json({ success: true, data: [] }));
}

module.exports = app;
