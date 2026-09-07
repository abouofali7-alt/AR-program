/* ============================================================
   AR-Program — طبقة ربط API والباك إند (API Integration Layer)
   يدعم وضع الهجين: الاتصال بالسيرفر أو التحويل التلقائي لقاعدة البيانات المحلية (IndexedDB)
   ============================================================ */

const API = (function () {
    function getDefaultBaseUrl() {
        if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.protocol.startsWith('file')) {
            return window.location.origin.replace(/\/+$/, '') + '/api';
        }
        return 'http://localhost:8080/api';
    }
    
    // استرجاع الإعدادات المحفوظة أو استخدام الافتراضي
    function getBaseUrl() {
        return localStorage.getItem('ar_api_base_url') || getDefaultBaseUrl();
    }

    function setBaseUrl(url) {
        let cleanUrl = url.trim().replace(/\/+$/, '');
        if (!cleanUrl.endsWith('/api') && !cleanUrl.includes('/api/')) {
            cleanUrl += '/api';
        }
        localStorage.setItem('ar_api_base_url', cleanUrl);
    }

    function isApiModeEnabled() {
        const setting = localStorage.getItem('ar_api_mode');
        if (setting === 'true') return true;
        if (setting === 'false') return false;
        // عندما يعمل الموقع عبر خادم ويب HTTP/HTTPS، يتم تفعيل وضع الباك إند المركزية تلقائياً لجميع الأجهزة
        if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
            return true;
        }
        return false;
    }

    function setApiMode(enabled) {
        localStorage.setItem('ar_api_mode', enabled ? 'true' : 'false');
    }

    // فحص صحة وتوفر الباك إند
    async function checkHealth() {
        const baseUrl = getBaseUrl();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                setApiMode(true);
                return { status: 'online', mode: 'api', url: baseUrl };
            }
        } catch (e) {
            // السيرفر غير متصل
        }
        return { status: 'offline', mode: 'local', url: baseUrl };
    }

    // تحويل اسم المخزن في ARDB إلى اسم الـ Endpoint
    function storeToEndpoint(store) {
        const map = {
            settings: 'settings',
            sequences: 'sequences',
            roles: 'roles',
            users: 'users',
            departments: 'departments',
            employees: 'employees',
            attendance: 'attendance',
            payroll: 'payroll',
            leaveRequests: 'leave-requests',
            customers: 'customers',
            suppliers: 'suppliers',
            categories: 'categories',
            products: 'products',
            warehouses: 'warehouses',
            stockMovements: 'stock-movements',
            invoices: 'invoices',
            invoiceReturns: 'invoice-returns',
            purchases: 'purchases',
            purchaseReturns: 'purchase-returns',
            payments: 'payments',
            expenses: 'expenses',
            quotations: 'quotations',
            offers: 'offers',
            accounts: 'accounts',
            journalEntries: 'journal-entries',
            projects: 'projects',
            tasks: 'tasks'
        };
        return map[store] || store;
    }

    /* ---------- العمليات الأساسية (CRUD) ---------- */

    async function getAll(store) {
        if (isApiModeEnabled()) {
            try {
                const endpoint = storeToEndpoint(store);
                const res = await fetch(`${getBaseUrl()}/${endpoint}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn(`[API] فشل الاتصال بالباك إند لجلب ${store}، استخدام IndexedDB بدلاً عنه.`, e);
            }
        }
        return await ARDB.localGetAll(store);
    }

    async function getById(store, id) {
        if (isApiModeEnabled()) {
            try {
                const endpoint = storeToEndpoint(store);
                const res = await fetch(`${getBaseUrl()}/${endpoint}/${id}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn(`[API] فشل الاتصال بالباك إند لجلب ${store} #${id}`);
            }
        }
        return await ARDB.localGetById(store, id);
    }

    async function add(store, item) {
        if (isApiModeEnabled()) {
            try {
                const endpoint = storeToEndpoint(store);
                const res = await fetch(`${getBaseUrl()}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    const saved = await res.json();
                    try { await ARDB.localPut(store, saved); } catch(e){}
                    return saved;
                }
            } catch (e) {
                console.warn(`[API] تعذر الإضافة عبر الباك إند، الحفظ في IndexedDB المحلي`, e);
            }
        }
        return await ARDB.localAdd(store, item);
    }

    async function update(store, item) {
        if (isApiModeEnabled()) {
            try {
                const endpoint = storeToEndpoint(store);
                const res = await fetch(`${getBaseUrl()}/${endpoint}/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    const updated = await res.json();
                    try { await ARDB.localPut(store, updated); } catch(e){}
                    return updated;
                }
            } catch (e) {
                console.warn(`[API] تعذر التعديل عبر الباك إند، التعديل في IndexedDB المحلي`, e);
            }
        }
        return await ARDB.localPut(store, item);
    }

    async function remove(store, id) {
        if (isApiModeEnabled()) {
            try {
                const endpoint = storeToEndpoint(store);
                const res = await fetch(`${getBaseUrl()}/${endpoint}/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    try { await ARDB.localRemove(store, id); } catch(e){}
                    return true;
                }
            } catch (e) {
                console.warn(`[API] تعذر الحذف عبر الباك إند، الحذف من IndexedDB المحلي`, e);
            }
        }
        return await ARDB.localRemove(store, id);
    }

    return {
        getBaseUrl,
        setBaseUrl,
        isApiModeEnabled,
        setApiMode,
        checkHealth,
        getAll,
        getById,
        add,
        update,
        delete: remove
    };
})();
