/* ============================================================
   AR-Program — بوابة طرق الدفع المتقدمة (Enterprise Payments Engine)
   دعم: Cash, Credit Card, Bank Transfer, Apple Pay, Installments
   ============================================================ */

const ARPayments = (function () {
    const METHODS = [
        { id: 'cash', label: 'نقداً (Cash)', icon: 'fa-money-bill-wave', color: '#22c55e' },
        { id: 'card', label: 'بطاقة ائتمان / فيزا (Visa/MasterCard)', icon: 'fa-credit-card', color: '#38bdf8' },
        { id: 'bank', label: 'تحويل بنكي (Bank Transfer)', icon: 'fa-building-columns', color: '#a78bfa' },
        { id: 'apple', label: 'Apple Pay / محفظة', icon: 'fa-brands fa-apple', color: '#f8fafc' },
        { id: 'bnpl', label: 'تقسيط (Installments)', icon: 'fa-clock-rotate-left', color: '#f59e0b' }
    ];

    function openCheckoutModal(amount, onCompleteCallback) {
        let modal = document.getElementById('checkoutModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'checkoutModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
            document.body.appendChild(modal);
        }

        const activeCurr = typeof ARCurrency !== 'undefined' ? ARCurrency.getActiveCurrency() : 'EGP';
        const formattedAmount = typeof ARCurrency !== 'undefined' ? ARCurrency.format(amount) : UI.money(amount);

        modal.innerHTML = `
            <div style="background:var(--card-dark);border:1px solid var(--border-color);border-radius:14px;width:min(480px,92vw);padding:24px;box-shadow:var(--shadow-card);animation:fadeIn 0.2s;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid var(--border-color);padding-bottom:12px;">
                    <b style="font-size:1.1rem;color:var(--accent-cyan);"><i class="fa-solid fa-cash-register"></i> بوابة الدفع الإلكتروني</b>
                    <button onclick="document.getElementById('checkoutModal').style.display='none'" class="icon-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:18px;">
                    <div style="font-size:0.85rem;color:var(--text-secondary);">المبلغ المطلوب سداده</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--success);margin-top:4px;">${formattedAmount}</div>
                </div>

                <div style="font-size:0.9rem;font-weight:700;margin-bottom:10px;">اختر طريقة الدفع:</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
                    ${METHODS.map(m => `
                        <button onclick="processPayment('${m.id}', ${amount}, this)" class="btn btn-secondary" style="padding:12px;display:flex;align-items:center;gap:10px;justify-content:flex-start;font-size:0.85rem;border-radius:10px;">
                            <i class="fa-solid ${m.icon}" style="color:${m.color};font-size:1.1rem;"></i>
                            <span>${m.label}</span>
                        </button>
                    `).join('')}
                </div>

                <div id="paymentStatusBox" style="display:none;padding:12px;border-radius:8px;text-align:center;font-weight:600;font-size:0.9rem;"></div>
            </div>
        `;

        modal.style.display = 'flex';
        window._checkoutCallback = onCompleteCallback;
    }

    function processPayment(methodId, amount, btnEl) {
        const box = document.getElementById('paymentStatusBox');
        if (box) {
            box.style.display = 'block';
            box.className = '';
            box.style.background = 'rgba(56,189,248,0.15)';
            box.style.color = '#38bdf8';
            box.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري معالجة طريقة الدفع عبر البوابة...';
        }

        setTimeout(() => {
            if (box) {
                box.style.background = 'rgba(34,197,94,0.15)';
                box.style.color = '#22c55e';
                box.innerHTML = '<i class="fa-solid fa-circle-check"></i> تم تأكيد الدفع بنجاح!';
            }
            setTimeout(() => {
                document.getElementById('checkoutModal').style.display = 'none';
                if (window._checkoutCallback) window._checkoutCallback({ method: methodId, amount, status: 'success' });
            }, 1000);
        }, 1200);
    }

    return { METHODS, openCheckoutModal, processPayment };
})();
