/* ============================================================
   AR-Program — مكتبة الواجهات (UI) المشتركة
   جداول · نماذج · نوافذ تأكيد · تنبيهات · تنسيق أرقام/تواريخ
   ============================================================ */

const UI = (function () {
    /* ---------- تنسيق ---------- */
    function money(n) {
        const v = Number(n || 0);
        return '<span dir="ltr">' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>';
    }

    function date(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString('ar-EG');
    }

    function datetime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString('ar-EG') + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }

    function todayInput() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function icon(name) { return '<i class="fa-solid ' + name + '"></i> '; }

    /* ---------- تنبيهات (Toast) ---------- */
    function toast(msg, type) {
        let box = document.getElementById('toastBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'toastBox';
            box.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(box);
        }
        const colors = {
            ok: '#22c55e', error: '#ef4444', warn: '#f59e0b', info: '#38bdf8'
        };
        const el = document.createElement('div');
        el.style.cssText = 'background:var(--card-dark);color:var(--text-primary);border:1px solid ' + (colors[type] || colors.info) +
            ';padding:12px 18px;border-radius:10px;font-size:0.95rem;box-shadow:var(--shadow-card);' +
            'border-inline-start:5px solid ' + (colors[type] || colors.info) + ';max-width:340px;';
        el.textContent = msg;
        box.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(() => el.remove(), 400); }, 3500);
    }

    /* ---------- نافذة تأكيد ---------- */
    function confirmBox(message, title) {
        return new Promise((resolve) => {
            const ov = document.createElement('div');
            ov.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,.7);z-index:99990;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
            const box = document.createElement('div');
            box.style.cssText = 'background:var(--card-dark);border:1px solid var(--border-color);border-radius:14px;padding:24px;width:min(420px,90vw);box-shadow:var(--shadow-card);';
            box.innerHTML =
                '<h3 style="margin-bottom:12px;color:var(--accent-cyan);font-size:1.1rem;">' + (title || 'تأكيد') + '</h3>' +
                '<p style="margin-bottom:20px;color:var(--text-secondary);line-height:1.6;">' + message + '</p>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
                '<button class="btn-secondary" data-act="no">إلغاء</button>' +
                '<button class="btn-primary-soft" data-act="yes">موافق</button>' +
                '</div>';
            ov.appendChild(box);
            document.body.appendChild(ov);
            ov.addEventListener('click', (ev) => {
                const act = ev.target.dataset && ev.target.dataset.act;
                if (act) { ov.remove(); resolve(act === 'yes'); }
            });
        });
    }

    /* ---------- قالب توكن لكل ملء لوحة ---------- */
    function bodyTemplate(content, opts) {
        const o = Object.assign({ title: '', subtitle: '', actions: '' }, opts || {});
        return content;
    }

    return { money, date, datetime, todayInput, icon, toast, confirmBox, bodyTemplate };
})();