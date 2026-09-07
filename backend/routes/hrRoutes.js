const express = require('express');
const { db, all, get, run, nowISO, round2 } = require('../config/db');

const router = express.Router();

/* ================================ الحضور ================================ */
router.get('/attendance', (req, res) => {
    try {
        const { date, employee_id } = req.query;
        let sql = 'SELECT a.*, e.name AS employee_name FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id WHERE 1=1';
        const p = [];
        if (date) { sql += ' AND a.date = ?'; p.push(date); }
        if (employee_id) { sql += ' AND a.employee_id = ?'; p.push(employee_id); }
        sql += ' ORDER BY a.date DESC, a.employee_id';
        res.json({ success: true, data: all(sql, p) });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/attendance', (req, res) => {
    try {
        const { date, rows = [] } = req.body || {};
        if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ success: false, error: 'rows are required' });
        const d = date || new Date().toISOString().slice(0, 10);
        const r = txRows(rows.map(row => ({
            sql: 'INSERT INTO attendance (date, employee_id, status, hours, note) VALUES (?, ?, ?, ?, ?)',
            params: [d, row.employee_id, row.status || 'present', row.hours || 0, row.note || '']
        })));
        res.json({ success: true, data: { inserted: r } });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ================================ الإجازات ================================ */
router.get('/leaves', (req, res) => {
    try {
        const rows = all('SELECT l.*, e.name AS employee_name FROM leaves l LEFT JOIN employees e ON e.id = l.employee_id ORDER BY l.id DESC');
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/leaves', (req, res) => {
    try {
        const { employee_id, from_date, to_date, type = 'annual', status = 'pending', reason = '', note = '' } = req.body || {};
        if (!employee_id || !from_date) return res.status(400).json({ success: false, error: 'employee_id and from_date are required' });
        const id = run('INSERT INTO leaves (employee_id, from_date, to_date, type, status, reason, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employee_id, from_date, to_date || from_date, type, status, reason, note]).lastInsertRowid;
        res.json({ success: true, data: { id } });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.put('/leaves/:id', (req, res) => {
    try {
        const now = get('SELECT * FROM leaves WHERE id = ?', [req.params.id]);
        if (!now) return res.status(404).json({ success: false, error: 'Not found' });
        const b = req.body || {};
        db.prepare('UPDATE leaves SET employee_id = ?, from_date = ?, to_date = ?, type = ?, status = ?, reason = ?, note = ? WHERE id = ?')
            .run(b.employee_id ?? now.employee_id, b.from_date ?? now.from_date, b.to_date ?? now.to_date,
                b.type ?? now.type, b.status ?? now.status, b.reason ?? now.reason, b.note ?? now.note, now.id);
        res.json({ success: true, data: get('SELECT * FROM leaves WHERE id = ?', [now.id]) });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ================================ الرواتب ================================ */
router.get('/payroll', (req, res) => {
    try {
        const rows = all('SELECT p.*, e.name AS employee_name FROM payroll p LEFT JOIN employees e ON e.id = p.employee_id ORDER BY p.id DESC');
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/payroll', (req, res) => {
    try {
        const { employee_id, period, gross = 0, deductions = 0, status = 'draft', paid_on = '', note = '' } = req.body || {};
        if (!employee_id) return res.status(400).json({ success: false, error: 'employee_id is required' });
        const net = round2((Number(gross) || 0) - (Number(deductions) || 0));
        const id = run('INSERT INTO payroll (employee_id, period, gross, deductions, net, status, paid_on, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [employee_id, period || '', round2(gross), round2(deductions), net, status, paid_on, note]).lastInsertRowid;
        res.json({ success: true, data: { id, net } });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.put('/payroll/:id', (req, res) => {
    try {
        const now = get('SELECT * FROM payroll WHERE id = ?', [req.params.id]);
        if (!now) return res.status(404).json({ success: false, error: 'Not found' });
        const b = req.body || {};
        const gross = round2(b.gross ?? now.gross);
        const deductions = round2(b.deductions ?? now.deductions);
        db.prepare('UPDATE payroll SET employee_id = ?, period = ?, gross = ?, deductions = ?, net = ?, status = ?, paid_on = ?, note = ? WHERE id = ?')
            .run(b.employee_id ?? now.employee_id, b.period ?? now.period, gross, deductions, round2(gross - deductions),
                b.status ?? now.status, b.paid_on ?? now.paid_on, b.note ?? now.note, now.id);
        res.json({ success: true, data: get('SELECT * FROM payroll WHERE id = ?', [now.id]) });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

function txRows(ops) {
    const { db } = require('../config/db');
    db.exec('BEGIN');
    try { for (const op of ops) run(op.sql, op.params); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
    return ops.length;
}

module.exports = router;