const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { auth, requirePerm } = require('./middleware/auth');
const { mountCrud, mountUsers } = require('./masterRoutes');

const ROOT = path.join(__dirname, '..');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// تسجيل الأخطاء لمنع انهيار الخادم
const CRASH_LOG = path.join(__dirname, 'server.log');
function logCrash(tag, err) {
    try { fs.appendFileSync(CRASH_LOG, `[${new Date().toISOString()}] [${tag}] ${(err && err.stack) || err}\n`); } catch (e) {}
}
process.on('uncaughtException', (err) => logCrash('uncaught', err));
process.on('unhandledRejection', (reason) => logCrash('rejection', reason));

// عام: تسجيل الدخول وحالة الخادم
app.use('/api/auth', require('./routes/authRoutes'));
app.get('/api/health', (req, res) => res.json({ success: true, data: { ok: true, time: new Date().toISOString() } }));

// كل باقي واجهات الـ API محمية بالتوكن
app.use('/api', auth);

mountUsers(app, { auth, requirePerm });
mountCrud(app);
app.use('/api', require('./routes/salesRoutes').router);
app.use('/api', require('./routes/inventoryRoutes'));
app.use('/api', require('./routes/hrRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

// الأصول الثابتة للواجهة + نقطة دخول التطبيق
app.use(express.static(ROOT));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// معالج خطأ أخير
app.use((err, req, res, next) => {
    logCrash('route', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

function start(port) {
    const p = (port === undefined || port === null) ? 8080 : port;
    return new Promise((resolve) => {
        const server = app.listen(p, '0.0.0.0', () => {
            console.log(`AR-Program backend running on http://localhost:${server.address().port}`);
            resolve(server);
        });
    });
}

if (require.main === module) {
    start(process.env.PORT || 8080).catch((e) => logCrash('start', e));
}

module.exports = app;
module.exports.app = app;
module.exports.start = start;