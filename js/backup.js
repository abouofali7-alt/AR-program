/* ============================================================
   AR-Program — وحدة التصدير والاستيراد (Export / Import Backup)
   تسمح بتصدير واسترجاع كافّة بيانات النظام بسهولة
   ============================================================ */

const ARBackup = (function () {
    const STORES = [
        'settings','sequences','roles','users','departments','employees','attendance','payroll','leaveRequests',
        'customers','suppliers','categories','products','warehouses','stockMovements',
        'invoices','invoiceReturns','purchases','purchaseReturns','payments','expenses','quotations','offers',
        'accounts','journalEntries','projects','tasks'
    ];

    async function exportAllData() {
        const backup = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            data: {}
        };
        for (const s of STORES) {
            backup.data[s] = await ARDB.localGetAll(s);
        }
        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `AR-Program-Backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function importDataFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (!parsed.data) throw new Error('ملف نسبي غير صالح');
                    for (const s of Object.keys(parsed.data)) {
                        if (STORES.includes(s)) {
                            const items = parsed.data[s] || [];
                            for (const item of items) {
                                await ARDB.localPut(s, item);
                            }
                        }
                    }
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }

    return { exportAllData, importDataFromFile };
})();
