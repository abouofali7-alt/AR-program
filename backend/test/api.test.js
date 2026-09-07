const fs = require('fs');
const path = require('path');
const os = require('os');

// قاعدة بيانات اختبار مستقلة تُمسح قبل كل تشغيل
const testDb = path.join(os.tmpdir(), 'ar_program_test_' + Date.now() + '.db');
for (const f of [testDb, testDb + '-wal', testDb + '-shm']) { try { fs.unlinkSync(f); } catch (e) {} }
process.env.AR_DB_PATH = testDb;

const { start } = require('../server');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
    if (cond) { pass++; console.log('  PASS  ' + name); }
    else { fail++; console.log('  FAIL  ' + name + (extra !== undefined ? '  -> ' + extra : '')); }
}

const base = () => 'http://127.0.0.1:' + process.env.__TEST_PORT__;
let token = null;
async function api(method, path, body) {
    const r = await fetch(base() + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    let j = null;
    try { j = await r.json(); } catch (e) {}
    return { status: r.status, json: j };
}

(async () => {
    const server = await start(0);
    process.env.__TEST_PORT__ = String(server.address().port);
    console.log('== اختبارات تكامل الـ Backend (Express + SQLite + JWT) ==');

    // الوصول بدون توكن مرفوض
    let r = await api('GET', '/api/customers');
    ok('auth: رفض الطلب بدون توكن 401', r.status === 401, 'status=' + r.status);

    // تسجيل الدخول
    r = await api('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    ok('auth: تسجيل دخول admin', r.status === 200 && r.json.success && r.json.data.token, JSON.stringify(r.json).slice(0, 200));
    token = r.json.data.token;

    r = await api('POST', '/api/auth/login', { username: 'admin', password: 'wrong' });
    ok('auth: كلمة سر خاطئة مرفوضة', r.status === 401, 'status=' + r.status);

    r = await api('GET', '/api/auth/me');
    ok('auth: me يرجع admin', r.json.success && r.json.data.username === 'admin' && Array.isArray(r.json.data.permissions), JSON.stringify(r.json.data).slice(0, 150));

    r = await api('GET', '/api/accounts');
    const accounts = r.json.data;
    ok('master: 16 حسابًا في دليل الحسابات', accounts.length === 16, 'count=' + accounts.length);

    // الإعدادات
    r = await api('GET', '/api/settings');
    ok('master: إعدادات المنشأة', r.json.success && r.json.data[0].org_name === 'AR-Program');

    // عميل + مورد + منتج
    r = await api('POST', '/api/customers', { name: 'عميل الاختبار', phone: '01000000000' });
    const custId = r.json.data.id;
    ok('master: إنشاء عميل', !!custId, JSON.stringify(r.json));

    r = await api('POST', '/api/suppliers', { name: 'مورد الاختبار' });
    const suppId = r.json.data.id;
    ok('master: إنشاء مورد', !!suppId);

    r = await api('POST', '/api/products', { name: 'منتج API', barcode: 'API-0001', unit: 'قطعة', cost: 60, price: 100, min_stock: 2 });
    const prodId = r.json.data.id;
    ok('master: إنشاء منتج', !!prodId, JSON.stringify(r.json));

    // توريد مخزون
    r = await api('POST', '/api/movements', { product_id: prodId, qty: 10, direction: 'in', note: 'توريد يدوي' });
    r = await api('GET', '/api/reports/stock');
    const stockRow = r.json.data.rows.find(p => p.id === prodId);
    ok('مخزون: الرصيد 10 بعد التوريد', stockRow && stockRow.qty === 10, 'qty=' + (stockRow && stockRow.qty));

    // فاتورة بيع
    r = await api('POST', '/api/invoices', { customer_id: custId, items: [{ product_id: prodId, qty: 3, price: 100 }], discount: 0 });
    ok('فاتورة: أنشئت برقم INV-000001 وصافي 300', r.json.data && r.json.data.number === 'INV-000001' && r.json.data.net === 300, JSON.stringify(r.json).slice(0, 150));
    const invId = r.json.data.id;

    r = await api('GET', '/api/invoices/' + invId);
    ok('فاتورة: سطر واحد بكمية 3 وصافي 300', r.json.data.items.length === 1 && r.json.data.items[0].qty === 3 && r.json.data.net === 300, 'lines=' + (r.json.data.items || []).length);

    r = await api('GET', '/api/reports/stock');
    const stockAfterSale = r.json.data.rows.find(p => p.id === prodId);
    ok('مخزون: الرصيد صار 7 بعد البيع', stockAfterSale && stockAfterSale.qty === 7, 'qty=' + (stockAfterSale && stockAfterSale.qty));

    r = await api('POST', '/api/invoices', { customer_id: custId, items: [{ product_id: prodId, qty: 999, price: 100 }] });
    ok('فاتورة: رفض البيع عند نقص الرصيد', r.status === 400, 'status=' + r.status);

    // شراء 5 × 40
    r = await api('POST', '/api/purchases', { supplier_id: suppId, items: [{ product_id: prodId, qty: 5, price: 40 }] });
    ok('شراء: رقم PUR-000001 وإجمالي 200', r.json.data && r.json.data.number === 'PUR-000001' && r.json.data.net === 200, JSON.stringify(r.json).slice(0, 150));

    r = await api('GET', '/api/reports/stock');
    const stockAfterPurchase = r.json.data.rows.find(p => p.id === prodId);
    ok('مخزون: الرصيد 12 بعد الشراء', stockAfterPurchase && stockAfterPurchase.qty === 12, 'qty=' + (stockAfterPurchase && stockAfterPurchase.qty));

    // تحصيل 300 من العميل
    r = await api('POST', '/api/payments', { party_type: 'customer', party_id: custId, type: 'receipt', amount: 300, method: 'cash' });
    ok('تحصيل: مقبوض 300 مسجل بحركة نقدية', r.json.data && !!r.json.data.id, JSON.stringify(r.json).slice(0, 150));

    // مصروف 50
    r = await api('POST', '/api/expenses', { amount: 50, category: 'نثريات', note: 'مصروف اختبار' });
    ok('مصروف: مسجل 50', r.json.data && !!r.json.data.id, JSON.stringify(r.json).slice(0, 150));

    // ===== التقارير =====
    r = await api('GET', '/api/reports/cash-flow');
    const cf = r.json.data;
    ok('تقارير: التدفق الداخل 300', cf.sum_in === 300, 'in=' + cf.sum_in);
    ok('تقارير: التدفق الخارج 50', cf.sum_out === 50, 'out=' + cf.sum_out);
    ok('تقارير: صافي التدفق 250', cf.net === 250, 'net=' + cf.net);

    r = await api('GET', '/api/reports/profit-loss');
    ok('تقارير: إيرادات 300', r.json.data.total_revenue === 300, 'rev=' + r.json.data.total_revenue);
    ok('تقارير: مصروفات 250 (مصروف+مشتريات)', r.json.data.total_expenses === 250, 'exp=' + r.json.data.total_expenses);
    ok('تقارير: صافي الدخل 50', r.json.data.net === 50, 'net=' + r.json.data.net);

    r = await api('GET', '/api/reports/trial-balance');
    ok('تقارير: ميزان المراجعة متوازن (مدين=دائن=850)', r.json.data.totals.debit === r.json.data.totals.credit && r.json.data.totals.debit === 850, JSON.stringify(r.json.data.totals));

    r = await api('GET', '/api/reports/ledger?account_id=3');
    ok('تقارير: دفتر الأستاذ للخزينة رصيد 250', r.json.data.lines.length === 2 && r.json.data.closing === 250, 'lines=' + r.json.data.lines.length + ' closing=' + r.json.data.closing);

    r = await api('GET', '/api/reports/dashboard');
    const k = r.json.data.kpi;
    ok('تقارير: مبيعات اليوم 300', k.today_sales === 300, 'sales=' + k.today_sales);
    ok('تقارير: رصيد الخزينة 250', k.cash_balance === 250, 'cash=' + k.cash_balance);
    ok('تقارير: مستحقات العملاء 0 (محصلة)', k.customer_dues === 0, 'dues=' + k.customer_dues);
    ok('تقارير: مستحقات الموردين 200', k.supplier_dues === 200, 'dues=' + k.supplier_dues);
    ok('تقارير: قيمة المخزون 720 (12×60)', k.stock_value === 720, 'val=' + k.stock_value);

    // حذف مستندات تحقق الإلغاء
    const exp = await api('GET', '/api/expenses');
    const expId = exp.json.data[0].id;
    await api('DELETE', '/api/expenses/' + expId);
    r = await api('GET', '/api/reports/cash-flow');
    ok('إلغاء: حذف مصروف يسحب من التدفقات (out 0)', r.json.data.sum_out === 0, 'out=' + r.json.data.sum_out);

    console.log('===============================================');
    console.log('النتيجة: ' + pass + ' نجحت، ' + fail + ' فشلت');
    server.close();
    process.exit(fail ? 1 : 0);
})().catch(e => { console.error('EXCEPTION', e); process.exit(1); });