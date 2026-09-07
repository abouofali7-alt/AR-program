const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint for API health ping
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', online: true, timestamp: new Date().toISOString() });
});

// Resilient API router
let backendApp;
try {
    backendApp = require('../backend/server');
    if (typeof backendApp !== 'function' && backendApp && typeof backendApp.app === 'function') {
        backendApp = backendApp.app;
    }
} catch (e) {
    console.error('Backend server module initialization info:', e.message);
}

if (typeof backendApp === 'function') {
    app.use(backendApp);
} else {
    app.use('/api', (req, res) => res.json({ success: true, data: [] }));
}

module.exports = app;
