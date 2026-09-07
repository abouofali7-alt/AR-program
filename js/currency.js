/* ============================================================
   AR-Program — نظام العملات المتعددة العالمي (Multi-Currency Engine)
   دعم: EGP (ج.م), USD ($), EUR (€), SAR (ر.س), AED (د.إ)
   ============================================================ */

const ARCurrency = (function () {
    const RATES = {
        EGP: { symbol: 'ج.م', name: 'جنيه مصري', rate: 1.0, dir: 'rtl' },
        USD: { symbol: '$', name: 'US Dollar', rate: 0.020, dir: 'ltr' },
        EUR: { symbol: '€', name: 'Euro', rate: 0.018, dir: 'ltr' },
        SAR: { symbol: 'ر.س', name: 'ريال سعودي', rate: 0.076, dir: 'rtl' },
        AED: { symbol: 'د.إ', name: 'درهم إماراتي', rate: 0.074, dir: 'rtl' }
    };

    function getActiveCurrency() {
        return localStorage.getItem('ar_active_currency') || 'EGP';
    }

    function setActiveCurrency(code) {
        if (RATES[code]) {
            localStorage.setItem('ar_active_currency', code);
            window.location.reload();
        }
    }

    function convert(amountBaseInEgp) {
        const active = getActiveCurrency();
        const info = RATES[active] || RATES.EGP;
        return (Number(amountBaseInEgp || 0) * info.rate);
    }

    function format(amountBaseInEgp) {
        const active = getActiveCurrency();
        const info = RATES[active] || RATES.EGP;
        const val = convert(amountBaseInEgp);
        const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return info.dir === 'ltr' ? `${info.symbol}${formatted}` : `${formatted} ${info.symbol}`;
    }

    return { RATES, getActiveCurrency, setActiveCurrency, convert, format };
})();
