const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
    res.json({ success: true, data: { ok: true, serverless: true } });
});

app.all('/api/:resource*', (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = app;
