/* ============================================================
   AR-Program — الإطار المشترك
   تهيئة المصادقة · الهيدر · التنقل · الثيم
   ============================================================ */

(function () {
    const MAP = {
        accounting: { label: 'المحاسبة', icon: 'fa-calculator', pages: [
            { href: 'accounting/accounts.html', label: 'شجرة الحسابات' },
            { href: 'accounting/journal.html', label: 'دفتر اليومية' },
            { href: 'accounting/ledger.html', label: 'دفتر الأستاذ' },
            { href: 'accounting/trial_balance.html', label: 'ميزان المراجعة' },
            { href: 'accounting/profit_loss.html', label: 'قائمة الدخل' },
            { href: 'accounting/balance_sheet.html', label: 'الميزانية العمومية' },
            { href: 'accounting/cash_flow.html', label: 'التدفقات النقدية' },
            { href: 'accounting/expenses.html', label: 'المصروفات' },
            { href: 'accounting/payments.html', label: 'الدفعات والتحصيلات' }
        ]},
        inventory: { label: 'المخزون', icon: 'fa-boxes-stacked', pages: [
            { href: 'inventory/products.html', label: 'المنتجات' },
            { href: 'inventory/categories.html', label: 'التصنيفات' },
            { href: 'inventory/inventory.html', label: 'الأرصدة' },
            { href: 'inventory/movements.html', label: 'حركات المخزون' },
            { href: 'inventory/purchases.html', label: 'فواتير الشراء' },
            { href: 'inventory/purchase_returns.html', label: 'مرتجعات المشتريات' },
            { href: 'inventory/offers.html', label: 'عروض المنتجات' },
            { href: 'inventory/suppliers.html', label: 'الموردون' },
            { href: 'inventory/stock_report.html', label: 'تقرير الأرصدة' }
        ]},
        hr: { label: 'الموارد البشرية', icon: 'fa-users', pages: [
            { href: 'hr/employees.html', label: 'الموظفون' },
            { href: 'hr/departments.html', label: 'الأقسام' },
            { href: 'hr/attendance.html', label: 'الحضور والانصراف' },
            { href: 'hr/payroll.html', label: 'الرواتب' },
            { href: 'hr/leaves.html', label: 'الإجازات' }
        ]},
        business: { label: 'إدارة الأعمال', icon: 'fa-briefcase', pages: [
            { href: 'business/pos.html', label: 'نقطة البيع (POS)' },
            { href: 'business/customers.html', label: 'العملاء' },
            { href: 'business/invoices.html', label: 'فواتير البيع' },
            { href: 'business/returns.html', label: 'مرتجعات المبيعات' },
            { href: 'business/quotations.html', label: 'عروض الأسعار' },
            { href: 'business/projects.html', label: 'المشاريع' },
            { href: 'business/tasks.html', label: 'المهام' },
            { href: 'business/sales_report.html', label: 'تقرير المبيعات' }
        ]},
        settings: { label: 'الإعدادات', icon: 'fa-gear', pages: [
            { href: 'settings/users.html', label: 'المستخدمون' },
            { href: 'settings/roles.html', label: 'الصلاحيات' },
            { href: 'settings/company.html', label: 'بيانات المنشأة' },
            { href: 'settings/audit.html', label: 'سجل الأنشطة والأمان' }
        ]}
    };

    function assetUrl(path) {
        return relPrefix() + path;
    }

    // بادئة نسبية حسب عمق الصفحة:
    //  index.html            → ''
    //  pages/xxx.html        → '../'
    //  pages/mod/page.html   → '../../'
    function relPrefix() {
        const p = window.location.pathname;
        const idx = p.indexOf('/pages/');
        if (idx === -1) return '';
        const rest = p.slice(idx + 7);
        const depth = (rest.match(/\//g) || []).length;
        return '../'.repeat(depth + 1);
    }

    async function loadShared() {
        // أيقونة مضمّنة بدلاً من طلب favicon.ico (القضاء على 404 في الكونسول)
        if (!document.querySelector('link[rel="icon"]')) {
            const f = document.createElement('link');
            f.rel = 'icon'; f.type = 'image/svg+xml';
            f.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231a73e8'/%3E%3Ctext x='16' y='21' font-size='13' fill='white' text-anchor='middle' font-family='Arial' font-weight='bold'%3EAR%3C/text%3E%3C/svg%3E";
            document.head.appendChild(f);
        }
        // CSS العام — الحقن يكون فقط إذا لم تكن الصفحة تضمنته ثابتًا
        if (!document.querySelector('link[href$="global.css"]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = assetUrl('css/global.css'); l.dataset.appCss = '1';
            document.head.appendChild(l);
        }
        if (!document.querySelector('link[href$="responsive.css"]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = assetUrl('css/responsive.css'); l.dataset.appCss2 = '1';
            document.head.appendChild(l);
        }
        // FontAwesome
        if (!document.querySelector('link[fa]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
            l.setAttribute('fa', '1');
            document.head.appendChild(l);
        }
        // السكربتات الأساسية — الانتظار حتى اكتمال تحميل المحركات الرئيسية
        await Promise.all([
            loadScript(assetUrl('js/ui.js')),
            loadScript(assetUrl('js/db.js')),
            loadScript(assetUrl('js/currency.js')),
            loadScript(assetUrl('js/i18n.js'))
        ]);

        // بقية الخدمات والسكربتات
        loadScript(assetUrl('js/location.js'));
        loadScript(assetUrl('js/payments.js'));
        loadScript(assetUrl('js/audit.js'));
        loadScript(assetUrl('js/backup.js'));
        loadScript(assetUrl('js/export.js'));
        loadScript(assetUrl('js/notifications.js')).then(() => {
            if (typeof ARNotifications !== 'undefined') ARNotifications.loadNotifications();
        });
        loadScript(assetUrl('js/api.js')).then(() => {
            if (typeof API !== 'undefined') {
                API.checkHealth().then(updateApiBadge);
            }
        });
        initQuickSearch();
    }

    function loadScript(src) {
        return new Promise((resolve) => {
            const name = src.split('/').pop();
            if (document.querySelector('script[src$="' + name + '"]')) return resolve();
            const s = document.createElement('script');
            s.src = src; s.onload = resolve; document.head.appendChild(s);
        });
    }

    function updateApiBadge(res) {
        let badge = document.getElementById('apiStatusBadge');
        if (!badge) return;
        const isEn = (typeof ARI18n !== 'undefined') && ARI18n.getLang() === 'en';
        if (res && res.status === 'online') {
            badge.style.background = 'rgba(34,197,94,0.15)';
            badge.style.color = '#22c55e';
            badge.style.border = '1px solid rgba(34,197,94,0.4)';
            badge.innerHTML = '<i class="fa-solid fa-server"></i> ' + (isEn ? 'Backend Connected' : 'متصل بالباك إند');
            badge.title = (isEn ? 'Server connected at: ' : 'السيرفر متصل على: ') + res.url;
        } else {
            badge.style.background = 'rgba(56,189,248,0.12)';
            badge.style.color = '#38bdf8';
            badge.style.border = '1px solid rgba(56,189,248,0.3)';
            badge.innerHTML = '<i class="fa-solid fa-database"></i> ' + (isEn ? 'Local Mode (IndexedDB)' : 'وضع محلي (IndexedDB)');
            badge.title = isEn ? 'Server offline, using local database IndexedDB' : 'السيرفر غير متصل، يتم استخدام قاعدة البيانات المحلية IndexedDB';
        }
    }

    /* ---------- البحث السريع (Quick Search / Command Palette Ctrl+K) ---------- */
    function initQuickSearch() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                openQuickSearchModal();
            }
        });
    }

    function openQuickSearchModal() {
        let modal = document.getElementById('quickSearchModal');
        const isEn = (typeof ARI18n !== 'undefined') && ARI18n.getLang() === 'en';
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quickSearchModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.75);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:80px;backdrop-filter:blur(4px);';
            modal.innerHTML =
                '<div style="background:var(--card-dark);border:1px solid var(--border-color);border-radius:14px;width:min(550px,92vw);box-shadow:var(--shadow-card);overflow:hidden;animation:fadeIn 0.2s;">' +
                    '<div style="padding:14px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:10px;">' +
                        '<i class="fa-solid fa-magnifying-glass" style="color:var(--accent-cyan);"></i>' +
                        '<input id="qsInput" placeholder="' + (isEn ? 'Search page or module... (Ctrl + K)' : 'ابحث عن صفحة أو وحدة... (Ctrl + K)') + '" style="width:100%;background:transparent;border:none;outline:none;color:var(--text-primary);font-size:1rem;">' +
                    '</div>' +
                    '<div id="qsResults" style="max-height:350px;overflow-y:auto;padding:8px;"></div>' +
                '</div>';
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
            document.getElementById('qsInput').addEventListener('input', renderSearchHits);
        }
        modal.style.display = 'flex';
        const inp = document.getElementById('qsInput');
        inp.value = '';
        inp.focus();
        renderSearchHits();
    }

    function renderSearchHits() {
        const query = (document.getElementById('qsInput').value || '').trim().toLowerCase();
        const resBox = document.getElementById('qsResults');
        const prefix = relPrefix();
        const isEn = (typeof ARI18n !== 'undefined') && ARI18n.getLang() === 'en';
        let hits = [];

        for (const key of Object.keys(MAP)) {
            const group = MAP[key];
            const groupLabel = (typeof ARI18n !== 'undefined') ? ARI18n.t(key) : group.label;
            for (const p of group.pages) {
                const pageKey = p.href.split('/').pop().replace('.html', '');
                const pageLabel = (typeof ARI18n !== 'undefined') ? ARI18n.t(pageKey) : p.label;
                if (!query || pageLabel.toLowerCase().includes(query) || groupLabel.toLowerCase().includes(query)) {
                    hits.push({ label: pageLabel, group: groupLabel, href: prefix + 'pages/' + p.href, icon: group.icon });
                }
            }
        }

        if (!hits.length) {
            resBox.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);font-size:0.9rem;">' + (isEn ? 'No results found' : 'لا توجد نتائج طابقت البحث') + '</div>';
            return;
        }

        resBox.innerHTML = hits.map(h =>
            `<a href="${h.href}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:8px;text-decoration:none;color:var(--text-primary);margin-bottom:4px;transition:background 0.2s;" onmouseover="this.style.background='var(--border-color)'" onmouseout="this.style.background='transparent'">` +
                `<div style="display:flex;align-items:center;gap:10px;"><i class="fa-solid ${h.icon}" style="color:var(--accent-cyan);"></i><span>${h.label}</span></div>` +
                `<span style="font-size:0.75rem;color:var(--text-secondary);background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:4px;">${h.group}</span>` +
            `</a>`
        ).join('');
    }

    async function requireAuth() {
        await loadScript(assetUrl('js/db.js'));
        const cfg = { dbReady: true };
        return cfg;
    }

    /* ---------- عارض التنقل (Mobile drawer) ---------- */
    function renderNav() {
        const container = document.getElementById('appNavHost');
        if (!container) return;
        const prefix = relPrefix();
        let html = '';

        const pageKeyMap = {
            'accounts.html': 'accounts',
            'journal.html': 'journal',
            'ledger.html': 'ledger',
            'trial_balance.html': 'trial_balance',
            'profit_loss.html': 'profit_loss',
            'balance_sheet.html': 'balance_sheet',
            'cash_flow.html': 'cash_flow',
            'expenses.html': 'expenses',
            'payments.html': 'payments',
            'products.html': 'products',
            'categories.html': 'categories',
            'inventory.html': 'inventory_balances',
            'movements.html': 'movements',
            'purchases.html': 'purchases',
            'purchase_returns.html': 'purchase_returns',
            'offers.html': 'offers',
            'suppliers.html': 'suppliers',
            'stock_report.html': 'stock_report',
            'employees.html': 'employees',
            'departments.html': 'departments',
            'attendance.html': 'attendance',
            'payroll.html': 'payroll',
            'leaves.html': 'leaves',
            'pos.html': 'pos',
            'customers.html': 'customers',
            'invoices.html': 'invoices',
            'returns.html': 'returns',
            'quotations.html': 'quotations',
            'projects.html': 'projects',
            'tasks.html': 'tasks',
            'sales_report.html': 'sales_report',
            'users.html': 'users',
            'roles.html': 'roles',
            'company.html': 'company',
            'audit.html': 'audit'
        };

        for (const key of Object.keys(MAP)) {
            const group = MAP[key];
            const groupLabel = (typeof ARI18n !== 'undefined') ? ARI18n.t(key) : group.label;
            html += '<div class="nav-group"><div class="nav-group-title"><i class="fa-solid ' + group.icon + '"></i>' + groupLabel + '</div>';
            for (const p of group.pages) {
                const page = p.href.split('/').pop();
                const cur = window.location.pathname.endsWith(page);
                const pageKey = pageKeyMap[page];
                const pageLabel = (typeof ARI18n !== 'undefined' && pageKey) ? ARI18n.t(pageKey) : p.label;
                html += '<a class="nav-link ' + (cur ? 'active' : '') + '" href="' + prefix + 'pages/' + p.href + '">' + pageLabel + '</a>';
            }
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function renderHeader() {
        const host = document.getElementById('appHeaderHost');
        if (!host) return;
        const prefix = relPrefix();
        const user = ARDB.currentUser();

        if (typeof ARI18n !== 'undefined') {
            ARI18n.applyLang();
        }

        const isEn = (typeof ARI18n !== 'undefined') && ARI18n.getLang() === 'en';
        const homeTxt = isEn ? 'Home' : 'الرئيسية';
        const searchTitle = isEn ? 'Quick Search (Ctrl + K)' : 'بحث سريع (Ctrl + K)';
        const notifTitle = isEn ? 'Notifications' : 'الإشعارات';

        host.innerHTML =
            '<header class="topbar">' +
                '<div class="topbar-right">' +
                    '<button id="appNavBtn" class="icon-btn"><i class="fa-solid fa-bars"></i></button>' +
                    '<a class="brand" href="' + prefix + 'index.html"><i class="fa-solid fa-cubes"></i> AR-Program</a>' +
                    '<a href="' + prefix + 'index.html" class="btn btn-secondary" style="margin-inline-start:10px;padding:4px 12px;font-size:0.82rem;text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-house"></i> ' + homeTxt + '</a>' +
                    '<span id="apiStatusBadge" style="font-size:0.75rem;padding:4px 10px;border-radius:20px;margin-inline-start:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;"><i class="fa-solid fa-spinner fa-spin"></i> ...</span>' +
                '</div>' +
                '<div class="topbar-left">' +
                    '<select id="currSelect" onchange="if(typeof ARCurrency!=\'undefined\')ARCurrency.setActiveCurrency(this.value)" style="background:var(--card-dark);border:1px solid var(--border-color);color:var(--text-primary);padding:4px 8px;border-radius:6px;font-size:0.78rem;outline:none;cursor:pointer;">' +
                        '<option value="EGP">EGP (ج.م)</option>' +
                        '<option value="USD">USD ($)</option>' +
                        '<option value="EUR">EUR (€)</option>' +
                        '<option value="SAR">SAR (ر.س)</option>' +
                        '<option value="AED">AED (د.إ)</option>' +
                    '</select>' +
                    '<select id="langSelect" onchange="if(typeof ARI18n!=\'undefined\')ARI18n.setLang(this.value)" style="background:var(--card-dark);border:1px solid var(--border-color);color:var(--text-primary);padding:4px 8px;border-radius:6px;font-size:0.78rem;outline:none;cursor:pointer;">' +
                        '<option value="ar">🇸🇦 العربية</option>' +
                        '<option value="en">🇬🇧 English</option>' +
                    '</select>' +
                    '<button id="notifBellBtn" class="icon-btn" title="' + notifTitle + '" style="position:relative;"><i class="fa-solid fa-bell"></i><span id="notifBadge" style="position:absolute;top:-2px;right:-2px;background:var(--danger);color:#fff;font-size:0.65rem;font-weight:bold;border-radius:10px;padding:1px 5px;display:none;"></span></button>' +
                    '<button id="quickSearchBtn" class="icon-btn" title="' + searchTitle + '"><i class="fa-solid fa-magnifying-glass"></i></button>' +
                    '<button id="themeToggle" class="icon-btn"><i class="fa-solid fa-moon"></i></button>' +
                    (user ? '<span class="user-badge"><i class="fa-solid fa-user-shield"></i> ' + (user.name || user.username || '') + '</span>' : '') +
                    (user ? '<button id="logoutBtn" class="icon-btn danger"><i class="fa-solid fa-right-from-bracket"></i></button>' : '') +
                '</div>' +
            '</header>' +
            '<div id="appDrawer" class="drawer"><div class="drawer-content">' +
                '<div class="drawer-head"><b>AR-Program</b><button id="drawerClose" class="icon-btn"><i class="fa-solid fa-xmark"></i></button></div>' +
                '<nav id="appNavHost" class="drawer-nav"></nav>' +
            '</div></div>';

        renderNav();

        const cs = document.getElementById('currSelect');
        if (cs && typeof ARCurrency !== 'undefined') cs.value = ARCurrency.getActiveCurrency();

        const ls = document.getElementById('langSelect');
        if (ls && typeof ARI18n !== 'undefined') ls.value = ARI18n.getLang();

        document.getElementById('quickSearchBtn').addEventListener('click', openQuickSearchModal);

        const bell = document.getElementById('notifBellBtn');
        if (bell) {
            bell.addEventListener('click', () => {
                if (typeof ARNotifications !== 'undefined') ARNotifications.toggleNotificationPanel();
            });
        }

        document.getElementById('apiStatusBadge').addEventListener('click', () => {
            window.location.href = prefix + 'pages/settings/company.html';
        });

        document.getElementById('appNavBtn').addEventListener('click', () => {
            document.getElementById('appDrawer').classList.add('open');
        });
        document.getElementById('drawerClose').addEventListener('click', () => {
            document.getElementById('appDrawer').classList.remove('open');
        });
        document.getElementById('appDrawer').addEventListener('click', (e) => {
            if (e.target.id === 'appDrawer') document.getElementById('appDrawer').classList.remove('open');
        });

        const tBtn = document.getElementById('themeToggle');
        const apply = (t) => {
            document.body.classList.toggle('light-mode', t === 'light');
            document.body.classList.toggle('dark-mode', t !== 'light');
            if (tBtn) tBtn.innerHTML = t === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('ar_theme', t);
        };
        apply(localStorage.getItem('ar_theme') || 'dark');
        tBtn.addEventListener('click', () => {
            const cur = localStorage.getItem('ar_theme') || 'dark';
            apply(cur === 'dark' ? 'light' : 'dark');
        });

        const lb = document.getElementById('logoutBtn');
        if (lb) lb.addEventListener('click', () => { ARDB.clearSession(); window.location.href = prefix + 'pages/login.html'; });
    }

    async function initApp() {
        await loadShared();
        await requireAuth();
        renderHeader();
    }

    window.ARUI = { MAP, assetUrl, initApp, renderHeader, updateApiBadge };
})();

/* تشغيل تلقائي إن وُجدت عناصر الهيدر */
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('appHeaderHost')) window.ARUI.initApp();
});