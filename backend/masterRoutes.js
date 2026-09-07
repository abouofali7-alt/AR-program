const express = require('express');
const bcrypt = require('bcryptjs');
const { db, all, get, run, tx, nextNumber, nowISO, localDateStr, round2, parseJson,
    CASH, CUSTOMER, SUPPLIER, SALES, PURCHASES, EXPENSE, OTHER_INCOME } = require('./config/db');

function crud(table, { fields = [], search = [], orderBy = 'id DESC' } = {}) {
    const fieldsJoined = fields.join(', ');
    const placeholders = fields.map(() => '?').join(', ');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const where = search.map(f => `${f} LIKE ?`).join(' OR ');

    const router = express.Router();
    router.get('/', (req, res) => {
        try {
            let rows;
            if (req.query.q && search.length) {
                const like = '%' + req.query.q + '%';
                const params = search.map(() => like);
                rows = all(`SELECT * FROM ${table} WHERE (${where}) ORDER BY ${orderBy}`, params);
            } else {
                rows = all(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
            }
            res.json({ success: true, data: rows });
        } catch (e) { res.status(500).json({ success: false, error: e.message }); }
    });
    router.post('/', (req, res) => {
        try {
            const vals = fields.map(f => req.body[f] ?? null);
            const r = run(`INSERT INTO ${table} (${fieldsJoined}) VALUES (${placeholders})`, vals);
            res.json({ success: true, data: { id: r.lastInsertRowid, ...req.body } });
        } catch (e) { res.status(400).json({ success: false, error: e.message }); }
    });
    router.put('/:id', (req, res) => {
        try {
            const vals = fields.map(f => req.body[f] ?? null);
            vals.push(req.params.id);
            run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, vals);
            res.json({ success: true, data: get(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]) });
        } catch (e) { res.status(400).json({ success: false, error: e.message }); }
    });
    router.delete('/:id', (req, res) => {
        try {
            run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (e) { res.status(400).json({ success: false, error: e.message }); }
    });
    return router;
}

function makeRoutes(prefix, table, opts) {
    return (app) => app.use(prefix, crud(table, opts));
}

/** ===== الصلاحيات والأدوار ===== */
function mountUsers(app, { auth, requirePerm }) {
    app.use('/api/users', requirePerm('users', 'admin'), crud('users', {
        fields: ['username', 'password_hash', 'name', 'role_id', 'active'], orderBy: 'id ASC'
    }));
    app.use('/api/roles', requirePerm('users', 'admin'), crud('roles', {
        fields: ['name', 'permissions'], orderBy: 'id ASC'
    }));
}

/** ===== كل الجداول الأساسية ===== */
const CRUD_MAP = [
    ['api/settings', 'settings', ['org_name', 'org_phone', 'org_address', 'org_tax', 'org_logo', 'currency']],
    ['api/accounts', 'accounts', ['code', 'name', 'type']],
    ['api/departments', 'departments', ['name', 'manager']],
    ['api/categories', 'categories', ['name', 'parent']],
    ['api/customers', 'customers', ['name', 'phone', 'email', 'address']],
    ['api/suppliers', 'suppliers', ['name', 'phone', 'email', 'address']],
    ['api/products', 'products', ['barcode', 'name', 'category_id', 'unit', 'cost', 'price', 'min_stock', 'active']],
    ['api/employees', 'employees', ['name', 'phone', 'department_id', 'salary', 'job', 'hire_date']],
    ['api/tasks', 'tasks', ['title', 'description', 'assignee_id', 'due', 'status', 'priority']],
    ['api/projects', 'projects', ['name', 'description', 'start', 'end', 'status', 'progress', 'budget']],
    ['api/offers', 'offers', ['name', 'product_ids', 'discount_type', 'discount_value', 'start', 'end', 'active']]
];

function mountCrud(app) {
    for (const [prefix, table, fields] of CRUD_MAP) {
        app.use('/' + prefix, crud(table, { fields, search: ['name'], orderBy: 'id DESC' }));
    }
}

module.exports = { mountCrud, mountUsers, crud };
