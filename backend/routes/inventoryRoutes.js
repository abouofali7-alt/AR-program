const express = require('express');
const { db, all, get, run, tx, nextNumber, nowISO, localDateStr, round2 } = require('../config/db');
const { saveStock, addJournal } = require('./salesRoutes');

const router = express.Router();

/* ================================ حركات المخزون ================================ */
router.get('/movements', (req, res) => {
    try {
        const { product_id } = req.query;
        let sql = 'SELECT m.*, p.name AS product_name FROM movements m LEFT JOIN products p ON p.id = m.product_id';
        const params = [];
        if (product_id) { sql += ' WHERE m.product_id = ?'; params.push(product_id); }
        sql += ' ORDER BY m.id DESC LIMIT 1000';
        res.json({ success: true, data: all(sql, params) });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/movements', (req, res) => {
    try {
        const { date, product_id, qty, direction, note = '' } = req.body || {};
        if (!product_id || !qty) return res.status(400).json({ success: false, error: 'product_id and qty are required' });
        const d = date || localDateStr();
        const delta = direction === 'out' ? -Math.abs(qty) : Math.abs(qty);
        const r = tx(() => {
            saveStock(product_id, delta, direction === 'out' ? 'out' : 'in', 'manual', 0, d, note || 'حركة يدوية');
            return { qty: get('SELECT qty FROM inventory WHERE product_id = ?', [product_id]).qty };
        });
        res.json({ success: true, data: r });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ================================ المصروفات ================================ */
router.get('/expenses', (req, res) => {
    try {
        const { direction } = req.query;
        let sql = 'SELECT * FROM expenses';
        const params = [];
        if (direction) { sql += ' WHERE direction = ?'; params.push(direction); }
        sql += ' ORDER BY id DESC';
        res.json({ success: true, data: all(sql, params) });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/expenses', (req, res) => {
    try {
        const { date, amount, category = '', direction = 'out', note = '' } = req.body || {};
        if (!amount) return res.status(400).json({ success: false, error: 'amount is required' });
        const d = date || localDateStr();
        const r = tx(() => {
            const id = run('INSERT INTO expenses (date, category, amount, direction, note, created) VALUES (?, ?, ?, ?, ?, ?)',
                [d, category, round2(amount), direction, note, nowISO()]).lastInsertRowid;
            const info = direction === 'in'
                ? { lines: [{ account_id: 3, debit: round2(amount), credit: 0 }, { account_id: 13, debit: 0, credit: round2(amount) }], label: 'إيراد يدوي' }
                : { lines: [{ account_id: 14, debit: round2(amount), credit: 0 }, { account_id: 3, debit: 0, credit: round2(amount) }], label: 'مصروف' };
            addJournal(nextNumber('JRN'), d, note || category || 'مصروف', 'expense', id, info.lines, info.label);
            return { id };
        });
        res.json({ success: true, data: r });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.delete('/expenses/:id', (req, res) => {
    try {
        tx(() => {
            run('DELETE FROM journal_entries WHERE ref_type = \'expense\' AND ref_id = ?', [req.params.id]);
            run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ================================ التحصيلات والمدفوعات ================================ */
router.get('/payments', (req, res) => {
    try {
        const rows = all('SELECT * FROM payments ORDER BY id DESC').map(p => {
            if (p.party_type === 'customer') { const c = get('SELECT name FROM customers WHERE id = ?', [p.party_id]); p.party_name = c ? c.name : '—'; }
            else if (p.party_type === 'supplier') { const s = get('SELECT name FROM suppliers WHERE id = ?', [p.party_id]); p.party_name = s ? s.name : '—'; }
            return p;
        });
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/payments', (req, res) => {
    try {
        const { date, party_type, party_id, type, amount, method = 'cash', note = '' } = req.body || {};
        if (!['customer', 'supplier'].includes(party_type) || !party_id || !['receipt', 'payment'].includes(type) || !amount) {
            return res.status(400).json({ success: false, error: 'Invalid payment data' });
        }
        const d = date || localDateStr();
        const amt = round2(amount);
        const r = tx(() => {
            const number = nextNumber('PAY');
            const id = run('INSERT INTO payments (number, date, party_type, party_id, type, amount, method, note, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [number, d, party_type, party_id, type, amt, method, note, nowISO()]).lastInsertRowid;
            // partyAccount: العملاء -> 6، الموردين -> 8
            const partyAccount = party_type === 'customer' ? 6 : 8;
            const lines = type === 'receipt'
                ? [{ account_id: 3, debit: amt, credit: 0 }, { account_id: partyAccount, debit: 0, credit: amt }]
                : [{ account_id: partyAccount, debit: amt, credit: 0 }, { account_id: 3, debit: 0, credit: amt }];
            addJournal(nextNumber('JRN'), d, (party_type === 'customer' ? 'تحصيل من عميل' : 'دفع لمورد') + ' ' + number,
                'payment', id, lines, type === 'receipt' ? 'تحصيل' : 'دفعة');
            return { id, number };
        });
        res.json({ success: true, data: r });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.delete('/payments/:id', (req, res) => {
    try {
        tx(() => {
            run('DELETE FROM journal_entries WHERE ref_type = \'payment\' AND ref_id = ?', [req.params.id]);
            run('DELETE FROM payments WHERE id = ?', [req.params.id]);
        });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

module.exports = router;