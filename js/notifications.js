/* ============================================================
   AR-Program — مركز الإشعارات والتنبيهات الذكي (Smart Notifications)
   فحص المخزون المنخفض، الفواتير المتأخرة، والمهام المستحقة
   ============================================================ */

const ARNotifications = (function () {
    let _notifications = [];

    async function loadNotifications() {
        _notifications = [];
        try {
            const [products, movements, invoices, tasks] = await Promise.all([
                ARDB.getAll('products'),
                ARDB.getAll('stockMovements'),
                ARDB.getAll('invoices'),
                ARDB.getAll('tasks')
            ]);

            // 1. تنبيهات المخزون المنخفض
            const qtyMap = {};
            (movements || []).forEach(m => {
                if (qtyMap[m.productId] === undefined) qtyMap[m.productId] = 0;
                qtyMap[m.productId] += (m.quantity || 0) * (m.direction === 'in' ? 1 : -1);
            });

            (products || []).forEach(p => {
                const currentQty = qtyMap[p.id] || 0;
                const min = p.minStock || 5;
                if (currentQty <= min) {
                    _notifications.push({
                        id: 'p_' + p.id,
                        type: 'warning',
                        icon: 'fa-boxes-stacked',
                        title: 'تنبيه مخزون منخفض',
                        msg: `المنتج (${p.name}) شارف على النفاد (المتبقي: ${currentQty})`,
                        href: 'inventory/inventory.html'
                    });
                }
            });

            // 2. تنبيهات المهام المعلقة
            (tasks || []).forEach(t => {
                if (t.status === 'pending' || t.status === 'in_progress') {
                    _notifications.push({
                        id: 't_' + t.id,
                        type: 'info',
                        icon: 'fa-list-check',
                        title: 'مهمة قيد الانتظار',
                        msg: `المهمة: (${t.title || t.name}) قيد التنفيذ`,
                        href: 'business/tasks.html'
                    });
                }
            });

        } catch (e) {
            console.warn('[Notifications] Error loading alerts:', e);
        }

        updateNotificationUI();
        return _notifications;
    }

    function updateNotificationUI() {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        const count = _notifications.length;
        if (count > 0) {
            badge.style.display = 'inline-flex';
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }

    function toggleNotificationPanel() {
        let panel = document.getElementById('notifPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notifPanel';
            panel.style.cssText = 'position:fixed;top:60px;left:20px;width:340px;max-height:450px;background:var(--card-dark);border:1px solid var(--border-color);border-radius:14px;box-shadow:var(--shadow-card);z-index:99999;display:flex;flex-direction:column;overflow:hidden;animation:fadeIn 0.2s;';
            document.body.appendChild(panel);
        }

        if (panel.style.display === 'flex') {
            panel.style.display = 'none';
            return;
        }

        const prefix = ARUI ? ARUI.assetUrl('') : '';
        let listHtml = '';
        if (!_notifications.length) {
            listHtml = '<div style="padding:30px;text-align:center;color:var(--text-secondary);"><i class="fa-solid fa-bell-slash" style="font-size:2rem;margin-bottom:8px;opacity:0.5;"></i><div>لا توجد تنبيهات جديدة</div></div>';
        } else {
            listHtml = _notifications.map(n => `
                <a href="${prefix + 'pages/' + n.href}" style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--border-color);text-decoration:none;color:var(--text-primary);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <div style="font-size:1.2rem;color:${n.type === 'warning' ? '#f59e0b' : '#38bdf8'};"><i class="fa-solid ${n.icon}"></i></div>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.85rem;margin-bottom:2px;">${n.title}</div>
                        <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.4;">${n.msg}</div>
                    </div>
                </a>
            `).join('');
        }

        panel.innerHTML = `
            <div style="padding:14px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;">
                <b style="font-size:0.95rem;"><i class="fa-solid fa-bell" style="color:var(--accent-cyan);"></i> مركز الإشعارات (${_notifications.length})</b>
                <button onclick="document.getElementById('notifPanel').style.display='none'" class="icon-btn" style="width:26px;height:26px;font-size:0.8rem;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="overflow-y:auto;flex:1;">${listHtml}</div>
        `;

        panel.style.display = 'flex';
    }

    return { loadNotifications, toggleNotificationPanel };
})();
