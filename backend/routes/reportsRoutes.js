const express = require('express');
const { all, get, round2, localDateStr } = require('../config/db');

const router = express.Router();

function dateRange(req) {
    const from = (req.query.from || '').trim();
    const to = (req.query.to || '').trim();
    return { from, to };
}

/** رصيد الحساب = المدين - الدائن */
function accountBalance(accountId, from = '', to = '') {
    const r = get(
        'SELECT COALESCE(SUM(jl.debit),0) AS d, COALESCE(SUM(jl.credit),0) AS c FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id WHERE jl.account_id = ? AND (? IS NULL OR je.date >= ?) AND (? IS NULL OR je.date <= ?)',
        [accountId, from || null, from || null, to || null, to || null]
    );
    return round2((r.d || 0) - (r.c || 0));
}

/* ============================= ميزان المراجعة ============================= */
router.get('/trial-balance', (req, res) => {
    try {
        const { from, to } = dateRange(req);
        const rows = all(
            'SELECT a.id, a.code, a.name, a.type, COALESCE(SUM(jl.debit),0) AS debit, COALESCE(SUM(jl.credit),0) AS credit FROM accounts a LEFT JOIN journal_lines jl ON jl.account_id = a.id LEFT JOIN journal_entries je ON je.id = jl.entry_id AND (? IS NULL OR je.date >= ?) AND (? IS NULL OR je.date <= ?) GROUP BY a.id ORDER BY a.code',
            [from || null, from || null, to || null, to || null]
        ).map(r => ({ ...r, debit: round2(r.debit), credit: round2(r.credit), balance: round2((r.debit || 0) - (r.credit || 0)) }));
        const totals = rows.reduce((s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }), { debit: 0, credit: 0 });
        res.json({ success: true, data: { rows, totals: { debit: round2(totals.debit), credit: round2(totals.credit) } } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= دفتر الأستاذ ============================= */
router.get('/ledger', (req, res) => {
    try {
        const accId = Number(req.query.account_id);
        if (!accId) return res.status(400).json({ success: false, error: 'account_id is required' });
        const { from, to } = dateRange(req);
        const account = get('SELECT * FROM accounts WHERE id = ?', [accId]);
        if (!account) return res.status(404).json({ success: false, error: 'Account not found' });
        const rows = all(
            'SELECT je.date, je.number, je.note, jl.debit, jl.credit FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id WHERE jl.account_id = ? AND (? IS NULL OR je.date >= ?) AND (? IS NULL OR je.date <= ?) ORDER BY je.date, jl.id',
            [accId, from || null, from || null, to || null, to || null]
        );
        const debitPositive = ['asset', 'expense'].includes(account.type);
        let running = 0;
        const lines = rows.map(r => {
            running += round2((r.debit || 0) - (r.credit || 0)) * (debitPositive ? 1 : -1);
            return { date: r.date, number: r.number, note: r.note, debit: round2(r.debit), credit: round2(r.credit), balance: round2(running) };
        });
        res.json({ success: true, data: { account, lines, closing: round2(running) } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= قائمة الدخل ============================= */
router.get('/profit-loss', (req, res) => {
    try {
        const { from, to } = dateRange(req);
        const revenue = all(
            'SELECT a.id, a.code, a.name, COALESCE(SUM(jl.credit),0) - COALESCE(SUM(jl.debit),0) AS amount FROM accounts a LEFT JOIN journal_lines jl ON jl.account_id = a.id LEFT JOIN journal_entries je ON je.id = jl.entry_id AND (? IS NULL OR je.date >= ?) AND (? IS NULL OR je.date <= ?) WHERE a.type = ? GROUP BY a.id ORDER BY a.code',
            [from || null, from || null, to || null, to || null, 'revenue']
        );
        const expenses = all(
            'SELECT a.id, a.code, a.name, COALESCE(SUM(jl.debit),0) - COALESCE(SUM(jl.credit),0) AS amount FROM accounts a LEFT JOIN journal_lines jl ON jl.account_id = a.id LEFT JOIN journal_entries je ON je.id = jl.entry_id AND (? IS NULL OR je.date >= ?) AND (? IS NULL OR je.date <= ?) WHERE a.type = ? GROUP BY a.id ORDER BY a.code',
            [from || null, from || null, to || null, to || null, 'expense']
        );
        const totalRevenue = round2(revenue.reduce((s, r) => s + (r.amount || 0), 0));
        const totalExpenses = round2(expenses.reduce((s, r) => s + (r.amount || 0), 0));
        res.json({ success: true, data: { revenue, expenses, total_revenue: totalRevenue, total_expenses: totalExpenses, net: round2(totalRevenue - totalExpenses) } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= الميزانية العمومية ============================= */
router.get('/balance-sheet', (req, res) => {
    try {
        const asof = req.query.asof || '';
        const rows = all(
            'SELECT a.id, a.code, a.name, a.type, COALESCE(SUM(jl.debit),0) - COALESCE(SUM(jl.credit),0) AS net FROM accounts a LEFT JOIN journal_lines jl ON jl.account_id = a.id LEFT JOIN journal_entries je ON je.id = jl.entry_id AND (? IS NULL OR je.date <= ?) GROUP BY a.id ORDER BY a.code',
            [asof || null, asof || null]
        ).map(r => ({ ...r, net: round2(r.net) }));
        const pick = (type) => rows.filter(r => r.type === type);
        // صافي الدخل الإجمالي يندرج تحت حقوق الملكية
        const netIncome = accountBalance(12) - accountBalance(14);
        const assets = round2(pick('asset').reduce((s, r) => s + (r.net > 0 ? r.net : 0), 0));
        const liabilities = round2(pick('liability').reduce((s, r) => s + (-r.net > 0 ? -r.net : 0), 0));
        const equity = round2(pick('equity').reduce((s, r) => s + (-r.net > 0 ? -r.net : 0), 0) + netIncome);
        res.json({
            success: true, data: {
                asof, rows, sections: { assets: pick('asset'), liabilities: pick('liability'), equity: pick('equity') },
                totals: { assets, liabilities, equity, net_income: round2(netIncome) }
            }
        });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= التدفقات النقدية ============================= */
router.get('/cash-flow', (req, res) => {
    try {
        const { from, to } = dateRange(req);
        const rows = all(
            'SELECT je.date, je.number, je.note, jl.debit, jl.credit FROM journal_lines jl JOIN journal_entries je ON je.id = jl.entry_id WHERE jl.account_id = 3 AND (? IS NULL OR je.date >= ?) AND (? IS NULL OR je.date <= ?) ORDER BY je.date, jl.id',
            [from || null, from || null, to || null, to || null]
        );
        const list = rows.map(r => ({
            date: r.date, number: r.number, note: r.note,
            direction: (r.debit || 0) > 0 ? 'in' : 'out',
            amount: round2((r.debit || 0) > 0 ? r.debit : r.credit)
        }));
        const sumIn = round2(list.reduce((s, r) => s + (r.direction === 'in' ? r.amount : 0), 0));
        const sumOut = round2(list.reduce((s, r) => s + (r.direction === 'out' ? r.amount : 0), 0));
        res.json({ success: true, data: { rows: list, sum_in: sumIn, sum_out: sumOut, net: round2(sumIn - sumOut) } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= تقرير المخزون ============================= */
router.get('/stock', (req, res) => {
    try {
        const rows = all(
            'SELECT p.id, p.name, p.barcode, p.category_id, p.unit, p.cost, p.price, p.min_stock, p.active, COALESCE(i.qty,0) AS qty FROM products p LEFT JOIN inventory i ON i.product_id = p.id ORDER BY p.name'
        ).map(r => ({ ...r, value: round2(r.qty * r.cost), low_stock: r.qty <= r.min_stock }));
        const totalValue = round2(rows.reduce((s, r) => s + r.value, 0));
        const totalQty = round2(rows.reduce((s, r) => s + r.qty, 0));
        const low = rows.filter(r => r.low_stock);
        res.json({ success: true, data: { rows, total_value: totalValue, total_qty: totalQty, low_count: low.length } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= تقرير المبيعات ============================= */
router.get('/sales', (req, res) => {
    try {
        const { from, to } = dateRange(req);
        const invoices = all(
            'SELECT i.id, i.number, i.date, i.net, i.discount, c.name AS customer_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE (? IS NULL OR i.date >= ?) AND (? IS NULL OR i.date <= ?) ORDER BY i.date DESC, i.id DESC',
            [from || null, from || null, to || null, to || null]
        );
        const byProduct = all(
            'SELECT p.id, p.name, COALESCE(SUM(il.qty),0) AS qty, COALESCE(SUM(il.total),0) AS total FROM invoice_lines il JOIN products p ON p.id = il.product_id JOIN invoices i ON i.id = il.invoice_id WHERE (? IS NULL OR i.date >= ?) AND (? IS NULL OR i.date <= ?) GROUP BY p.id ORDER BY total DESC',
            [from || null, from || null, to || null, to || null]
        ).map(r => ({ ...r, qty: round2(r.qty), total: round2(r.total) }));
        const totalNet = round2(invoices.reduce((s, i) => s + (i.net || 0), 0));
        res.json({ success: true, data: { invoices, by_product: byProduct, total_net: totalNet, count: invoices.length } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ============================= لوحة التحكم ============================= */
router.get('/dashboard', (req, res) => {
    try {
        const today = localDateStr();
        const monthPrefix = today.slice(0, 7);
        const todaySales = round2(all('SELECT COALESCE(SUM(net),0) AS s FROM invoices WHERE date = ?', [today])[0].s);
        const monthSales = round2(all('SELECT COALESCE(SUM(net),0) AS s FROM invoices WHERE date LIKE ?', [monthPrefix + '%'])[0].s);
        const stockValue = round2(all('SELECT COALESCE(SUM(i.qty * p.cost),0) AS v FROM inventory i JOIN products p ON p.id = i.product_id')[0].v);
        const cashBalance = accountBalance(3);
        const customerDues = round2(-accountBalance(6)); // رصيد دائن للعميل
        const supplierDues = round2(-accountBalance(8)); // رصيد دائن للمورد
        const productCount = get('SELECT COUNT(*) AS c FROM products').c;
        const customerCount = get('SELECT COUNT(*) AS c FROM customers').c;
        const lowStock = all('SELECT p.id, p.name, p.min_stock, COALESCE(i.qty,0) AS qty FROM products p LEFT JOIN inventory i ON i.product_id = p.id WHERE COALESCE(i.qty,0) <= p.min_stock ORDER BY COALESCE(i.qty,0) ASC LIMIT 5');
        const pendingTasks = all('SELECT * FROM tasks WHERE status != ? ORDER BY id DESC LIMIT 5', ['done']);
        const pendingTasksCount = get('SELECT COUNT(*) AS c FROM tasks WHERE status != ?', ['done']).c;
        const expiringQuotes = all('SELECT * FROM quotations WHERE status = ? AND expiry != ? AND expiry <= ? ORDER BY expiry ASC LIMIT 5', ['open', '', localDateStr(new Date(Date.now() + 7 * 86400000))]);
        const recentInvoices = all('SELECT i.id, i.number, i.date, i.net, c.name AS customer_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id ORDER BY i.id DESC LIMIT 8');
        const recentTasks = all('SELECT * FROM tasks ORDER BY id DESC LIMIT 8');
        res.json({
            success: true, data: {
                kpi: { today_sales: todaySales, month_sales: monthSales, stock_value: stockValue, cash_balance: cashBalance, customer_dues: customerDues, supplier_dues: supplierDues, products: productCount, customers: customerCount },
                alerts: { low_stock: lowStock, pending_tasks: pendingTasksCount, expiring_quotations: expiringQuotes.length },
                low_stock: lowStock, pending_tasks: pendingTasks, expiring_quotations: expiringQuotes,
                recent_invoices: recentInvoices, recent_tasks: recentTasks
            }
        });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;