/* ============================================================
   AR-Program — محرك اللغات المتعددة العالمي (Multi-Language i18n Engine)
   دعم العربية (RTL) والإنجليزية (LTR)
   ============================================================ */

const ARI18n = (function () {
    const DICT = {
        ar: {
            appTitle: 'AR-Program — نظام إدارة الأعمال العالمي',
            home: 'الرئيسية',
            pos: 'نقطة البيع (POS)',
            accounting: 'المحاسبة',
            inventory: 'المخزون',
            hr: 'الموارد البشرية',
            business: 'إدارة الأعمال',
            settings: 'الإعدادات',
            search: 'بحث سريع (Ctrl + K)',
            notifications: 'الإشعارات',
            totalSales: 'إجمالي المبيعات',
            totalProfit: 'إجمالي الأرباح',
            totalQty: 'الكميات المباعة',
            aov: 'متوسط قيمة الطلب',
            backendConnected: 'متصل بالباك إند',
            localMode: 'وضع محلي (IndexedDB)',
            langName: 'العربية',
            accounts: 'شجرة الحسابات',
            journal: 'دفتر اليومية',
            ledger: 'دفتر الأستاذ',
            trial_balance: 'ميزان المراجعة',
            profit_loss: 'قائمة الدخل',
            balance_sheet: 'الميزانية العمومية',
            cash_flow: 'التدفقات النقدية',
            expenses: 'المصروفات',
            payments: 'الدفعات والتحصيلات',
            products: 'المنتجات',
            categories: 'التصنيفات',
            inventory_balances: 'الأرصدة',
            movements: 'حركات المخزون',
            purchases: 'فواتير الشراء',
            purchase_returns: 'مرتجعات المشتريات',
            offers: 'عروض المنتجات',
            suppliers: 'الموردون',
            stock_report: 'تقرير الأرصدة',
            employees: 'الموظفون',
            departments: 'الأقسام',
            attendance: 'الحضور والانصراف',
            payroll: 'الرواتب',
            leaves: 'الإجازات',
            customers: 'العملاء',
            invoices: 'فواتير البيع',
            returns: 'مرتجعات المبيعات',
            quotations: 'عروض الأسعار',
            projects: 'المشاريع',
            tasks: 'المهام',
            sales_report: 'تقرير المبيعات',
            users: 'المستخدمون',
            roles: 'الصلاحيات',
            company: 'بيانات المنشأة',
            audit: 'سجل الأنشطة والأمان'
        },
        en: {
            appTitle: 'AR-Program — Enterprise Global ERP',
            home: 'Home',
            pos: 'POS Cashier',
            accounting: 'Accounting',
            inventory: 'Inventory',
            hr: 'Human Resources',
            business: 'Business Admin',
            settings: 'Settings',
            search: 'Quick Search (Ctrl + K)',
            notifications: 'Notifications',
            totalSales: 'Total Sales',
            totalProfit: 'Total Profit',
            totalQty: 'Total Quantity',
            aov: 'Avg Order Value',
            backendConnected: 'Backend Connected',
            localMode: 'Local Mode (IndexedDB)',
            langName: 'English',
            accounts: 'Chart of Accounts',
            journal: 'General Journal',
            ledger: 'General Ledger',
            trial_balance: 'Trial Balance',
            profit_loss: 'Profit & Loss Statement',
            balance_sheet: 'Balance Sheet',
            cash_flow: 'Cash Flow',
            expenses: 'Expenses',
            payments: 'Payments & Collections',
            products: 'Products',
            categories: 'Categories',
            inventory_balances: 'Stock Balances',
            movements: 'Stock Movements',
            purchases: 'Purchase Invoices',
            purchase_returns: 'Purchase Returns',
            offers: 'Product Offers',
            suppliers: 'Suppliers',
            stock_report: 'Stock Report',
            employees: 'Employees',
            departments: 'Departments',
            attendance: 'Attendance',
            payroll: 'Payroll',
            leaves: 'Leaves',
            customers: 'Customers',
            invoices: 'Sales Invoices',
            returns: 'Sales Returns',
            quotations: 'Quotations',
            projects: 'Projects',
            tasks: 'Tasks',
            sales_report: 'Sales Report',
            users: 'Users',
            roles: 'Roles & Permissions',
            company: 'Company Profile',
            audit: 'Audit Log & Security'
        }
    };

    const PHRASES = {
        // Dashboard
        'لوحة تحكم المبيعات والأداء — AR-PROGRAM': 'Sales & Performance Dashboard — AR-PROGRAM',
        'لوحة التحليلات والمبيعات — AR-Program': 'Analytics & Sales Dashboard — AR-Program',
        'الربع 1': 'Q1',
        'الربع 2': 'Q2',
        'الربع 3': 'Q3',
        'الربع 4': 'Q4',
        'إجمالي المبيعات (Sum of Amount)': 'Total Sales (Sum of Amount)',
        'إجمالي الأرباح (Sum of Profit)': 'Total Profit (Sum of Profit)',
        'الكميات المباعة (Sum of Quantity)': 'Sold Quantity (Sum of Quantity)',
        'متوسط قيمة الطلب (Sum of AOV)': 'Avg Order Value (Sum of AOV)',
        'المبيعات حسب المناطق (Sum of Amount by Region)': 'Sales by Region',
        'الكميات حسب التصنيف (Quantity by Category)': 'Quantity by Category',
        'الأرباح الشهرية (Profit by Month)': 'Monthly Profit',
        'أعلى العملاء مبيعات (Amount by Customer)': 'Top Customers by Sales',
        'توزيع طرق الدفع (Quantity by PaymentMode)': 'Payment Methods Distribution',
        'الأرباح حسب الفئات الفرعية (Profit by Sub-Category)': 'Profit by Sub-Category',
        'وصول سريع وتنفيذ فوري': 'Quick Access & Fast Actions',
        'وحدات النظام الأساسية': 'Core System Modules',
        'نقطة البيع الكاشير': 'POS Cashier',
        'شاشة بيع سريعة، قارئ باركود، طباعة إيصالات مباشرة': 'Fast checkout screen, barcode scanner, direct receipt printing',
        'شجرة الحسابات، اليومية، دفتر الأستاذ، القوائم المالية، المصروفات': 'Chart of Accounts, Journal, Ledger, Financial Statements, Expenses',
        'المنتجات، الأرصدة، المشتريات ومرتجعاتها، الموردون، العروض': 'Products, Stock, Purchases, Returns, Suppliers & Offers',
        'الموظفون، الحضور، الرواتب، الإجازات، الأقسام': 'Employees, Attendance, Payroll, Leaves & Departments',
        'العملاء، الفواتير ومرتجعاتها، عروض الأسعار، المشاريع والمهام': 'Customers, Invoices, Returns, Quotes, Projects & Tasks',
        'المستخدمون، الصلاحيات، بيانات المنشأة': 'Users, Permissions & Company Profile',

        // POS
        'نقطة البيع (POS)': 'POS Cashier',
        'نظام الكاشير والمبيعات السريعة': 'Fast POS & Cashier System',
        '🔍 ابحث بالاسم أو الباركوود...': '🔍 Search name or barcode...',
        'الفاتورة الحالية': 'Current Invoice',
        'تفريغ': 'Clear',
        'السلة فارغة، انقر على المنتجات لإضافتها': 'Cart is empty, click products to add',
        'المجموع:': 'Subtotal:',
        'الإجمالي المستحق:': 'Grand Total:',
        'إتمام الدفع وطباعة الفاتورة': 'Complete Payment & Print Invoice',

        // Buttons & Labels
        'الرئيسية': 'Home',
        'إضافة جديد': 'Add New',
        'إضافة منتج': 'Add Product',
        'إضافة عميل': 'Add Customer',
        'إضافة موظف': 'Add Employee',
        'إضافة فاتورة': 'Add Invoice',
        'إضافة مصروف': 'Add Expense',
        'إضافة مورد': 'Add Supplier',
        'إضافة قسم': 'Add Department',
        'إضافة حساب': 'Add Account',
        'تعديل': 'Edit',
        'حذف': 'Delete',
        'حفظ': 'Save',
        'إلغاء': 'Cancel',
        'تصدير': 'Export',
        'طباعة': 'Print',
        'بحث': 'Search',
        'الكل': 'All',
        'نشط': 'Active',
        'غير نشط': 'Inactive',
        'العمليات': 'Actions',
        'اسم المنتج': 'Product Name',
        'السعر': 'Price',
        'الكمية': 'Quantity',
        'التصنيف': 'Category',
        'الرمز': 'Code',
        'التاريخ': 'Date',
        'الحالة': 'Status',
        'الهاتف': 'Phone',
        'البريد الإلكتروني': 'Email',
        'العنوان': 'Address',
        'الملاحظات': 'Notes',
        'الإجمالي': 'Total',
        'إجمالي': 'Total',
        'الرصيد الافتتاحي': 'Opening Balance',
        'الرصيد الافتتاحي (مدين / عليك)': 'Opening Balance (Debit)',
        'الرصيد الافتتاحي (دائن / له)': 'Opening Balance (Credit)',
        'الرصيد الحالي': 'Current Balance',
        'إجمالي المديونية الحالية': 'Total Current Receivables',
        'إجمالي المستحق للموردين': 'Total Current Payables',
        'إجمالي العملاء': 'Total Customers',
        'إجمالي الموردين': 'Total Suppliers',
        'سجل الأنشطة والأمان': 'Audit Log & Security',
        'بيانات المنشأة': 'Company Profile'
    };

    const DYNAMIC_DICT = {
        // Names & Transliteration
        'محمد': 'Mohamed', 'أحمد': 'Ahmed', 'محمود': 'Mahmoud', 'مصطفى': 'Mostafa', 'علي': 'Ali',
        'حسن': 'Hassan', 'حسين': 'Hussein', 'عمر': 'Omar', 'عمرو': 'Amr', 'خالد': 'Khaled',
        'طارق': 'Tarek', 'يوسف': 'Youssef', 'إبراهيم': 'Ibrahim', 'سعيد': 'Saeed', 'سامح': 'Sameh',
        'أيمن': 'Ayman', 'كريم': 'Kareem', 'شريف': 'Sherif', 'وائل': 'Wael', 'هاني': 'Hany',
        'ياسر': 'Yasser', 'عادل': 'Adel', 'مجدى': 'Magdy', 'مجدي': 'Magdy', 'سامي': 'Samy',
        'زياد': 'Ziad', 'حمزة': 'Hamza', 'فاطمة': 'Fatma', 'مريم': 'Maryam', 'سارة': 'Sara',
        'منى': 'Mona', 'نهى': 'Noha', 'رانيا': 'Rania', 'دينا': 'Dina', 'إيمان': 'Eman',
        'أمل': 'Amal', 'نور': 'Nour', 'هدى': 'Hoda', 'آية': 'Aya', 'شيماء': 'Shaimaa', 'هبة': 'Heba',
        'عبد الله': 'Abdullah', 'عبدالرحمن': 'Abdulrahman', 'عبد الرحمن': 'Abdulrahman',

        // Business Entities & Customer Types
        'عميل نقدي': 'Cash Customer', 'عميل ممتاز': 'VIP Customer', 'عميل رئيسي': 'Key Customer',
        'شركة': 'Company', 'مؤسسة': 'Establishment', 'محل': 'Store', 'معرض': 'Showroom',
        'مصنع': 'Factory', 'مكتب': 'Office', 'فرع': 'Branch', 'الرئيسي': 'Main',

        // Products & Categories & Items
        'قهوة': 'Coffee', 'شاي': 'Tea', 'عصير': 'Juice', 'ماء': 'Water', 'مشروب': 'Drink',
        'أغذية': 'Food', 'وجبة': 'Meal', 'ساندوتش': 'Sandwich', 'حلويات': 'Sweets',
        'إلكترونيات': 'Electronics', 'شاشة': 'Monitor', 'جوال': 'Mobile Phone', 'هاتف': 'Phone',
        'كمبيوتر': 'Computer', 'لابتوب': 'Laptop', 'طابعة': 'Printer', 'ورق': 'Paper', 'حبر': 'Ink',
        'طاولة': 'Table', 'كرسي': 'Chair', 'مكتبية': 'Office Supplies', 'أدوات': 'Tools',

        // Expenses & Accounting Terms
        'إيجار': 'Rent', 'كهرباء': 'Electricity', 'مياه': 'Water Utility', 'صيانة': 'Maintenance',
        'رواتب': 'Salaries', 'أجور': 'Wages', 'دعاية': 'Advertising', 'تسويق': 'Marketing',
        'نثريات': 'Miscellaneous', 'بنزين': 'Fuel', 'وقود': 'Fuel', 'ضيافة': 'Hospitality',
        'تأمين': 'Insurance', 'ضرائب': 'Taxes', 'رسوم': 'Fees',

        // Job Titles & Roles
        'مدير': 'Manager', 'محاسب': 'Accountant', 'مندوب': 'Sales Rep', 'كاشير': 'Cashier',
        'موظف': 'Employee', 'مهندس': 'Engineer', 'سائق': 'Driver', 'فني': 'Technician'
    };

    function getLang() {
        return localStorage.getItem('ar_lang') || 'ar';
    }

    function applyLang(lang) {
        const curLang = lang || getLang();
        document.documentElement.lang = curLang;
        document.documentElement.dir = curLang === 'ar' ? 'rtl' : 'ltr';
        
        const sel = document.getElementById('langSelect');
        if (sel) sel.value = curLang;

        if (curLang === 'en') {
            document.body.classList.add('lang-en');
        } else {
            document.body.classList.remove('lang-en');
        }
    }

    function setLang(lang) {
        if (DICT[lang]) {
            localStorage.setItem('ar_lang', lang);
            applyLang(lang);
            window.location.reload();
        }
    }

    function t(key) {
        const lang = getLang();
        return (DICT[lang] && DICT[lang][key]) || DICT.ar[key] || key;
    }

    function translateUserText(text, node) {
        if (!text || !/[\u0600-\u06FF]/.test(text)) return text;
        const trimmed = text.trim();

        // 1. Direct match in PHRASES
        if (PHRASES[trimmed]) return text.replace(trimmed, PHRASES[trimmed]);
        // 2. Direct match in DYNAMIC_DICT
        if (DYNAMIC_DICT[trimmed]) return text.replace(trimmed, DYNAMIC_DICT[trimmed]);

        // 3. Substring phrase replacements
        let res = text;
        for (const [ar, en] of Object.entries(PHRASES)) {
            if (res.includes(ar)) {
                res = res.split(ar).join(en);
            }
        }
        for (const [ar, en] of Object.entries(DYNAMIC_DICT)) {
            if (res.includes(ar)) {
                res = res.split(ar).join(en);
            }
        }
        if (res !== text) return res;

        // 4. Local Storage Cache
        const cacheKey = 'ar_translation_cache';
        let cache = {};
        try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch(e){}
        if (cache[trimmed]) {
            return text.replace(trimmed, cache[trimmed]);
        }

        // 5. Word-by-word Dictionary Replacements
        const words = trimmed.split(/(\s+|[,\-_\/\(\)])/);
        let hasReplacement = false;
        const translatedWords = words.map(w => {
            const clean = w.trim();
            if (DYNAMIC_DICT[clean]) { hasReplacement = true; return DYNAMIC_DICT[clean]; }
            if (PHRASES[clean]) { hasReplacement = true; return PHRASES[clean]; }
            return w;
        });

        if (hasReplacement) {
            const wordRes = translatedWords.join('');
            cache[trimmed] = wordRes;
            try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch(e){}
            return text.replace(trimmed, wordRes);
        }

        // 6. Asynchronous Free Online Machine Translation (MyMemory API) with fallback
        if (node && typeof fetch !== 'undefined') {
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=ar|en`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.responseData && data.responseData.translatedText) {
                        const translatedText = data.responseData.translatedText;
                        cache[trimmed] = translatedText;
                        try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch(e){}
                        if (node && node.nodeValue && node.nodeValue.includes(trimmed)) {
                            node.nodeValue = node.nodeValue.replace(trimmed, translatedText);
                        }
                    }
                })
                .catch(() => {});
        }

        return text;
    }

    function translateDOM(targetNode) {
        if (getLang() !== 'en') return;
        const root = targetNode || document.body;
        if (!root) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function(n) {
                if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
                if (n.parentNode && ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(n.parentNode.tagName)) return NodeFilter.FILTER_SKIP;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        let n;
        while ((n = walker.nextNode())) {
            let val = n.nodeValue.trim();
            if (val && /[\u0600-\u06FF]/.test(val)) {
                const newVal = translateUserText(val, n);
                if (newVal !== val) {
                    n.nodeValue = n.nodeValue.replace(val, newVal);
                }
            }
        }

        if (root.querySelectorAll) {
            root.querySelectorAll('[placeholder]').forEach(el => {
                const ph = el.getAttribute('placeholder');
                if (ph && /[\u0600-\u06FF]/.test(ph)) {
                    const newPh = translateUserText(ph.trim());
                    el.setAttribute('placeholder', newPh);
                }
            });
        }
    }

    function autoRunTranslate() {
        if (getLang() === 'en') {
            translateDOM();
            setTimeout(translateDOM, 100);
            setTimeout(translateDOM, 400);
            setTimeout(translateDOM, 1000);

            if (typeof MutationObserver !== 'undefined' && document.body) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(m => {
                        m.addedNodes.forEach(node => {
                            if (node.nodeType === 1) translateDOM(node);
                        });
                    });
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }
    }

    // تطبيق الاتجاه وترجمة DOM فور تحميل السكربت
    applyLang();
    autoRunTranslate();

    return { getLang, setLang, applyLang, t, translateDOM, translateUserText, autoRunTranslate, DICT, PHRASES, DYNAMIC_DICT };
})();



