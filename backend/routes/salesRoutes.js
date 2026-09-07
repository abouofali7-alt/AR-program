const express = require('express');
const { db, all, get, run, tx, nextNumber, nowISO, localDateStr, round2, parseJson,
    CASH, CUSTOMER, SUPPLIER, SALES, PURCHASES, EXPENSE, OTHER_INCOME } = require('../config/db');

const router = express.Router();

/** تغيير الرصيد المخزني وحفظ الحركة */
function saveStock(productId, qtyDelta, direction, refType, refId, date, note) {
    const inv = get('SELECT qty FROM inventory WHERE product_id = ?', [productId]);
    const current = inv ? inv.qty : 0;
    run('INSERT INTO inventory (product_id, qty) VALUES (?, ?) ON CONFLICT(product_id) DO UPDATE SET qty = qty + ?', [productId, qtyDelta, qtyDelta]);
    run('INSERT INTO movements (date, product_id, qty, direction, ref_type, ref_id, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [date, productId, Math.abs(qtyDelta), direction, refType, refId, note || '']);
    return current + qtyDelta;
}

/** قيد يومية متوازن */
function addJournal(number, date, note, refType, refId, lines, label) {
    const rid = run('INSERT INTO journal_entries (number, date, note, ref_type, ref_id, created) VALUES (?, ?, ?, ?, ?, ?)',
        [number, date, (label || '') + ' - ' + note, refType, refId, nowISO()]).lastInsertRowid;
    const ins = db.prepare('INSERT INTO journal_lines (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)');
    for (const l of lines) {
        if (round2(l.debit || 0) || round2(l.credit || 0)) ins.run(rid, l.account_id, round2(l.debit || 0), round2(l.credit || 0));
    }
    return rid;
}

/* ================================ الفواتير ================================ */
router.get('/invoices', (req, res) => {
    try {
        const { customer_id, date_from, date_to } = req.query;
        let sql = 'SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE 1=1';
        const p = [];
        if (customer_id) { sql += ' AND i.customer_id = ?'; p.push(customer_id); }
        if (date_from) { sql += ' AND i.date >= ?'; p.push(date_from); }
        if (date_to) { sql += ' AND i.date <= ?'; p.push(date_to); }
        sql += ' ORDER BY i.id DESC';
        res.json({ success: true, data: all(sql, p) });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/invoices', (req, res) => {
    try {
        const { date, customer_id, discount = 0, note = '', items = [] } = req.body || {};
        if (!customer_id || !Array.isArray(items) || !items.length) {
            return res.status(400).json({ success: false, error: 'Customer and items are required' });
        }
        const d = date || localDateStr();
        const net = round2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0) - (Number(discount) || 0));
        const result = tx(() => {
            for (const it of items) {
                const cur = get('SELECT qty FROM inventory WHERE product_id = ?', [it.product_id])?.qty || 0;
                if (cur < (Number(it.qty) || 0)) throw new Error('الرصيد غير كافٍ للمنتج رقم ' + it.product_id);
            }
            const number = nextNumber('INV');
            const id = run('INSERT INTO invoices (number, date, customer_id, discount, net, note, created) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [number, d, customer_id, round2(discount), net, note, nowISO()]).lastInsertRowid;
            const insLine = db.prepare('INSERT INTO invoice_lines (invoice_id, product_id, qty, price, total) VALUES (?, ?, ?, ?, ?)');
            for (const it of items) {
                const total = round2((Number(it.qty) || 0) * (Number(it.price) || 0));
                insLine.run(id, it.product_id, Number(it.qty) || 0, Number(it.price) || 0, total);
                saveStock(it.product_id, -(Number(it.qty) || 0), 'out', 'invoice', id, d, 'فاتورة ' + number);
            }
            addJournal(nextNumber('JRN'), d, 'فاتورة بيع ' + number, 'invoice', id,
                [{ account_id: CUSTOMER, debit: net, credit: 0 }, { account_id: SALES, debit: 0, credit: net }], 'فاتورة بيع');
            return { id, number, net };
        });
        res.json({ success: true, data: result });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.get('/invoices/:id', (req, res) => {
    try {
        const inv = get('SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE i.id = ?', [req.params.id]);
        if (!inv) return res.status(404).json({ success: false, error: 'Not found' });
        inv.items = all('SELECT * FROM invoice_lines WHERE invoice_id = ?', [inv.id]);
        res.json({ success: true, data: inv });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ================================ المشتريات ================================ */
router.get('/purchases', (req, res) => {
    try {
        const rows = all('SELECT p.*, s.name AS supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.id DESC');
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/purchases', (req, res) => {
    try {
        const { date, supplier_id, discount = 0, note = '', items = [] } = req.body || {};
        if (!supplier_id || !Array.isArray(items) || !items.length) {
            return res.status(400).json({ success: false, error: 'Supplier and items are required' });
        }
        const d = date || localDateStr();
        const net = round2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0) - (Number(discount) || 0));
        const result = tx(() => {
            const number = nextNumber('PUR');
            const id = run('INSERT INTO purchases (number, date, supplier_id, discount, net, note, created) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [number, d, supplier_id, round2(discount), net, note, nowISO()]).lastInsertRowid;
            const insLine = db.prepare('INSERT INTO purchase_lines (purchase_id, product_id, qty, price, total) VALUES (?, ?, ?, ?, ?)');
            for (const it of items) {
                const total = round2((Number(it.qty) || 0) * (Number(it.price) || 0));
                insLine.run(id, it.product_id, Number(it.qty) || 0, Number(it.price) || 0, total);
                saveStock(it.product_id, Number(it.qty) || 0, 'in', 'purchase', id, d, 'شراء ' + number);
            }
            addJournal(nextNumber('JRN'), d, 'فاتورة شراء ' + number, 'purchase', id,
                [{ account_id: PURCHASES, debit: net, credit: 0 }, { account_id: SUPPLIER, debit: 0, credit: net }], 'فاتورة شراء');
            return { id, number, net };
        });
        res.json({ success: true, data: result });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.get('/purchases/:id', (req, res) => {
    try {
        const pur = get('SELECT p.*, s.name AS supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?', [req.params.id]);
        if (!pur) return res.status(404).json({ success: false, error: 'Not found' });
        pur.items = all('SELECT * FROM purchase_lines WHERE purchase_id = ?', [pur.id]);
        res.json({ success: true, data: pur });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= مرتجع المبيعات ============================= */
router.get('/returns', (req, res) => {
    try {
        res.json({ success: true, data: all('SELECT r.*, c.name AS customer_name FROM returns r LEFT JOIN customers c ON c.id = r.customer_id ORDER BY r.id DESC') });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/returns', (req, res) => {
    try {
        const { date, customer_id, note = '', items = [] } = req.body || {};
        if (!customer_id || !items.length) return res.status(400).json({ success: false, error: 'Customer and items are required' });
        const d = date || localDateStr();
        const net = round2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0));
        const result = tx(() => {
            const number = nextNumber('RET');
            const id = run('INSERT INTO returns (number, date, customer_id, net, note, created) VALUES (?, ?, ?, ?, ?, ?)',
                [number, d, customer_id, net, note, nowISO()]).lastInsertRowid;
            const insLine = db.prepare('INSERT INTO return_lines (return_id, product_id, qty, price, total) VALUES (?, ?, ?, ?, ?)');
            for (const it of items) {
                const total = round2((Number(it.qty) || 0) * (Number(it.price) || 0));
                insLine.run(id, it.product_id, Number(it.qty) || 0, Number(it.price) || 0, total);
                saveStock(it.product_id, Number(it.qty) || 0, 'in', 'return', id, d, 'مرتجع بيع ' + number);
            }
            addJournal(nextNumber('JRN'), d, 'مرتجع بيع ' + number, 'return', id,
                [{ account_id: SALES, debit: net, credit: 0 }, { account_id: CUSTOMER, debit: 0, credit: net }], 'مرتجع بيع');
            return { id, number, net };
        });
        res.json({ success: true, data: result });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* =========================== مرتجع المشتريات =========================== */
router.get('/purchase-returns', (req, res) => {
    try {
        res.json({ success: true, data: all('SELECT r.*, s.name AS supplier_name FROM purchase_returns r LEFT JOIN suppliers s ON s.id = r.supplier_id ORDER BY r.id DESC') });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/purchase-returns', (req, res) => {
    try {
        const { date, supplier_id, note = '', items = [] } = req.body || {};
        if (!supplier_id || !items.length) return res.status(400).json({ success: false, error: 'Supplier and items are required' });
        const d = date || localDateStr();
        const net = round2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0));
        const result = tx(() => {
            const number = nextNumber('PURR');
            const id = run('INSERT INTO purchase_returns (number, date, supplier_id, net, note, created) VALUES (?, ?, ?, ?, ?, ?)',
                [number, d, supplier_id, net, note, nowISO()]).lastInsertRowid;
            const insLine = db.prepare('INSERT INTO purchase_return_lines (return_id, product_id, qty, price, total) VALUES (?, ?, ?, ?, ?)');
            for (const it of items) {
                const total = round2((Number(it.qty) || 0) * (Number(it.price) || 0));
                insLine.run(id, it.product_id, Number(it.qty) || 0, Number(it.price) || 0, total);
                saveStock(it.product_id, -(Number(it.qty) || 0), 'out', 'purchase_return', id, d, 'مرتجع شراء ' + number);
            }
            addJournal(nextNumber('JRN'), d, 'مرتجع شراء ' + number, 'purchase_return', id,
                [{ account_id: SUPPLIER, debit: net, credit: 0 }, { account_id: PURCHASES, debit: 0, credit: net }], 'مرتجع شراء');
            return { id, number, net };
        });
        res.json({ success: true, data: result });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ============================= عروض الأسعار ============================= */
router.get('/quotations', (req, res) => {
    try {
        const rows = all('SELECT q.*, c.name AS customer_name FROM quotations q LEFT JOIN customers c ON c.id = q.customer_id ORDER BY q.id DESC')
            .map(q => ({ ...q, items: parseJson(q.items, []) }));
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/quotations', (req, res) => {
    try {
        const { date, customer_id, items = [], total = 0, status = 'open', expiry = '', note = '' } = req.body || {};
        const d = date || localDateStr();
        const number = nextNumber('QUO');
        const id = run('INSERT INTO quotations (number, date, customer_id, items, total, status, expiry, note, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [number, d, customer_id || null, JSON.stringify(items || []), round2(total), status, expiry, note, nowISO()]).lastInsertRowid;
        res.json({ success: true, data: { id, number } });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.put('/quotations/:id', (req, res) => {
    try {
        const now = get('SELECT * FROM quotations WHERE id = ?', [req.params.id]);
        if (!now) return res.status(404).json({ success: false, error: 'Not found' });
        const { date, customer_id, items, total, status, expiry, note } = req.body || {};
        db.prepare('UPDATE quotations SET date = ?, customer_id = ?, items = ?, total = ?, status = ?, expiry = ?, note = ? WHERE id = ?')
            .run(date ?? now.date, customer_id ?? now.customer_id, JSON.stringify(items ?? parseJson(now.items, [])),
                round2(total ?? now.total), status ?? now.status, expiry ?? now.expiry, note ?? now.note, now.id);
        res.json({ success: true, data: get('SELECT * FROM quotations WHERE id = ?', [now.id]) });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

module.exports = { router, saveStock, addJournal };