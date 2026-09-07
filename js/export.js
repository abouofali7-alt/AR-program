/* ============================================================
   AR-Program — مكتبة التصدير والطباعة العامة (Export & Print Utility)
   تصدير الجداول إلى Excel/CSV وطباعتها بسهولة
   ============================================================ */

const ARExport = (function () {
    function tableToCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) return;
        let csv = [];
        const rows = table.querySelectorAll('tr');
        for (let i = 0; i < rows.length; i++) {
            let row = [], cols = rows[i].querySelectorAll('td, th');
            for (let j = 0; j < cols.length; j++) {
                let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, '""');
                row.push('"' + data + '"');
            }
            csv.push(row.join(','));
        }
        const csvString = '\uFEFF' + csv.join('\n'); // BOM for UTF-8 Arabic support
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (filename || 'export') + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function printTable(tableId, title) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const win = window.open('', '', 'width=900,height=700');
        win.document.write(`
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="utf-8">
                <title>${title || 'طباعة تقرير'}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #1e293b; }
                    h2 { text-align: center; margin-bottom: 20px; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 14px; }
                    th { background: #f1f5f9; font-weight: bold; }
                    tr:nth-child(even) { background: #f8fafc; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <h2>${title || 'تقرير النظام — AR-Program'}</h2>
                ${table.outerHTML}
                <script>window.onload = function() { window.print(); window.close(); }<\/script>
            </body>
            </html>
        `);
        win.document.close();
    }

    return { tableToCSV, printTable };
})();
