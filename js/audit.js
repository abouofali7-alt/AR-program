/* ============================================================
   AR-Program — وحدة سجل الأنشطة والأمان (Audit Trail Log)
   تسجيل ومتابعة كافة العمليات المنفذة في النظام لأغراض الأمان والحماية
   ============================================================ */

const ARAudit = (function () {
    async function logAction(action, module, details) {
        try {
            const user = typeof ARDB !== 'undefined' ? ARDB.currentUser() : null;
            const logEntry = {
                timestamp: Date.now(),
                user: user ? (user.name || user.username) : 'النظام',
                action,
                module,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                ip: '127.0.0.1 (Local Environment)'
            };
            const logs = JSON.parse(localStorage.getItem('ar_audit_logs') || '[]');
            logs.unshift(logEntry);
            if (logs.length > 500) logs.pop(); // الاحتفاظ بآخر 500 إجراء
            localStorage.setItem('ar_audit_logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('[Audit] Error saving log:', e);
        }
    }

    function getLogs() {
        return JSON.parse(localStorage.getItem('ar_audit_logs') || '[]');
    }

    function clearLogs() {
        localStorage.removeItem('ar_audit_logs');
    }

    return { logAction, getLogs, clearLogs };
})();
