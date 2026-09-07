const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DB_FILE = process.env.AR_DB_PATH || path.join(__dirname, 'ar_program.db');
const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA foreign_keys = ON;');
try { db.prepare('PRAGMA journal_mode = WAL').get(); } catch (e) {}

function round2(v) {
    return Math.round(((Number(v) || 0) + Number.EPSILON) * 100) / 100;
}

function nowISO() {
    return new Date().toISOString();
}

function localDateStr(d) {
    const x = d ? new Date(d) : new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const dd = String(x.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  org_name TEXT NOT NULL DEFAULT 'AR-Program',
  org_phone TEXT DEFAULT '',
  org_address TEXT DEFAULT '',
  org_tax TEXT DEFAULT '',
  org_logo TEXT DEFAULT '',
  currency TEXT DEFAULT 'ج.م'
);
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  created TEXT
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '',
  role_id INTEGER,
  active INTEGER DEFAULT 1,
  created TEXT
);
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  manager TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  department_id INTEGER,
  salary REAL DEFAULT 0,
  job TEXT DEFAULT '',
  hire_date TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created TEXT
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER,
  unit TEXT DEFAULT '',
  cost REAL DEFAULT 0,
  price REAL DEFAULT 0,
  min_stock REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  created TEXT
);
CREATE TABLE IF NOT EXISTS inventory (
  product_id INTEGER PRIMARY KEY,
  qty REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  product_id INTEGER,
  qty REAL,
  direction TEXT,
  ref_type TEXT DEFAULT '',
  ref_id INTEGER DEFAULT 0,
  note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  customer_id INTEGER,
  discount REAL DEFAULT 0,
  net REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS invoice_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER,
  product_id INTEGER,
  qty REAL,
  price REAL,
  total REAL
);
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  supplier_id INTEGER,
  discount REAL DEFAULT 0,
  net REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS purchase_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER,
  product_id INTEGER,
  qty REAL,
  price REAL,
  total REAL
);
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  note TEXT DEFAULT '',
  ref_type TEXT DEFAULT '',
  ref_id INTEGER DEFAULT 0,
  created TEXT
);
CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER,
  account_id INTEGER,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  category TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  direction TEXT DEFAULT 'out',
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  party_type TEXT,
  party_id INTEGER,
  type TEXT,
  amount REAL DEFAULT 0,
  method TEXT DEFAULT 'cash',
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  customer_id INTEGER,
  net REAL DEFAULT 0,
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS return_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER,
  product_id INTEGER,
  qty REAL,
  price REAL,
  total REAL
);
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  supplier_id INTEGER,
  net REAL DEFAULT 0,
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS purchase_return_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER,
  product_id INTEGER,
  qty REAL,
  price REAL,
  total REAL
);
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  date TEXT,
  customer_id INTEGER,
  items TEXT DEFAULT '[]',
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'open',
  expiry TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created TEXT
);
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  product_ids TEXT DEFAULT '[]',
  discount_type TEXT DEFAULT 'percent',
  discount_value REAL DEFAULT 0,
  start TEXT DEFAULT '',
  end TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created TEXT
);
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  employee_id INTEGER,
  status TEXT DEFAULT 'present',
  hours REAL DEFAULT 0,
  note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  from_date TEXT,
  to_date TEXT,
  type TEXT DEFAULT 'annual',
  status TEXT DEFAULT 'pending',
  reason TEXT DEFAULT '',
  note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  period TEXT,
  gross REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  paid_on TEXT DEFAULT '',
  note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assignee_id INTEGER DEFAULT 0,
  due TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created TEXT
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  start TEXT DEFAULT '',
  end TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  progress REAL DEFAULT 0,
  budget REAL DEFAULT 0,
  created TEXT
);
CREATE TABLE IF NOT EXISTS seqs (
  name TEXT PRIMARY KEY,
  value INTEGER DEFAULT 0
);
`;

db.exec(SCHEMA);

const ACCOUNTS = [
    [1000, 'رأس المال', 'equity'],
    [1100, 'الأرباح المحتجزة', 'equity'],
    [1200, 'صندوق النقدية', 'asset'],
    [1300, 'البنك', 'asset'],
    [1400, 'المخزون', 'asset'],
    [1500, 'حسابات العملاء', 'asset'],
    [1600, 'مصروفات مقدمة', 'asset'],
    [2000, 'حسابات الموردين', 'liability'],
    [2100, 'ضريبة القيمة المضافة', 'liability'],
    [2200, 'سلف العملاء', 'liability'],
    [3000, 'قروض', 'liability'],
    [4000, 'المبيعات', 'revenue'],
    [4100, 'إيرادات أخرى', 'revenue'],
    [5000, 'المصروفات', 'expense'],
    [5100, 'المشتريات', 'expense'],
    [5200, 'تكلفة المبيعات', 'expense']
];

const CASH_ACCOUNT_ID = 3; // code 1200 صندوق النقدية
const CUSTOMER_ACCOUNT_ID = 6; // code 1500
const SUPPLIER_ACCOUNT_ID = 8; // code 2000
const SALES_ACCOUNT_ID = 12; // code 4000
const PURCHASES_ACCOUNT_ID = 15; // code 5100
const EXPENSE_ACCOUNT_ID = 14; // code 5000
const OTHER_INCOME_ACCOUNT_ID = 13; // code 4100

function seedIfEmpty() {
    const cnt = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    if (cnt > 0) return;

    const insert = db.prepare('INSERT INTO users (username, password_hash, name, role_id, active, created) VALUES (?, ?, ?, ?, 1, ?)');
    db.prepare('INSERT INTO roles (name, permissions, created) VALUES (?, ?, ?)').run('admin', '["*"]', nowISO());
    db.prepare('INSERT INTO roles (name, permissions, created) VALUES (?, ?, ?)').run('manager', '["sales","inventory","hr","reports"]', nowISO());
    db.prepare('INSERT INTO roles (name, permissions, created) VALUES (?, ?, ?)').run('accountant', '["accounting","reports"]', nowISO());
    db.prepare('INSERT INTO roles (name, permissions, created) VALUES (?, ?, ?)').run('user', '["sales"]', nowISO());
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin').id;
    insert.run('admin', bcrypt.hashSync('admin123', 10), 'مدير النظام', adminRole, nowISO());

    const insAcc = db.prepare('INSERT INTO accounts (code, name, type, created) VALUES (?, ?, ?, ?)');
    ACCOUNTS.forEach(a => insAcc.run(String(a[0]), a[1], a[2], nowISO()));

    db.prepare('INSERT INTO settings (id, org_name, currency) VALUES (1, ?, ?)').run('AR-Program', 'ج.م');
}

seedIfEmpty();

/** أدوات */
function all(sql, params) {
    return db.prepare(sql).all(...(params || [])).map(r => ({ ...r }));
}
function get(sql, params) {
    const r = db.prepare(sql).get(...(params || []));
    return r ? { ...r } : undefined;
}
function run(sql, params) {
    const r = db.prepare(sql).run(...(params || []));
    return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.changes };
}
function tx(fn) {
    db.exec('BEGIN');
    try {
        const out = fn();
        db.exec('COMMIT');
        return out;
    } catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }
}
function nextNumber(prefix) {
    const row = db.prepare('INSERT INTO seqs (name, value) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET value = value + 1 RETURNING value').get(prefix);
    const v = row.value;
    return prefix + '-' + String(v).padStart(6, '0');
}
function parseJson(s, def) {
    try { return JSON.parse(s); } catch (e) { return def; }
}

const CASH = CASH_ACCOUNT_ID;
const CUSTOMER = CUSTOMER_ACCOUNT_ID;
const SUPPLIER = SUPPLIER_ACCOUNT_ID;
const SALES = SALES_ACCOUNT_ID;
const PURCHASES = PURCHASES_ACCOUNT_ID;
const EXPENSE = EXPENSE_ACCOUNT_ID;
const OTHER_INCOME = OTHER_INCOME_ACCOUNT_ID;

module.exports = {
    db, all, get, run, tx, nextNumber, parseJson, round2, nowISO, localDateStr,
    CASH, CUSTOMER, SUPPLIER, SALES, PURCHASES, EXPENSE, OTHER_INCOME
};