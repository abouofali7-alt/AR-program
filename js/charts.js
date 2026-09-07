/* ============================================================
   AR-Program — محرك الرسوم البيانية المتطور (Advanced Canvas Analytics Engine)
   دعم: Donut Ring Charts, Horizontal Bar Charts, Monthly Profit/Loss Bars
   ============================================================ */

const ARCharts = (function () {

    // 1. العمودي الرأسي (Vertical Bar Chart)
    function renderBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.clientWidth || 400;
        const height = canvas.height = canvas.parentElement.clientHeight || 200;
        ctx.clearRect(0, 0, width, height);

        if (!data || !data.length) return;

        const maxVal = Math.max(...data.map(d => d.value), 10);
        const padding = 35;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const barWidth = Math.min((chartWidth / data.length) - 10, 36);

        // الشبكة الخفيفة
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = height - padding - (chartHeight / 4) * i;
            ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
        }

        // الأشرطة
        data.forEach((d, i) => {
            const x = padding + (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2;
            const barH = (d.value / maxVal) * chartHeight;
            const y = height - padding - barH;

            const grad = ctx.createLinearGradient(0, y, 0, height - padding);
            grad.addColorStop(0, d.color || '#00a2ff');
            grad.addColorStop(1, 'rgba(0, 162, 255, 0.2)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
            else ctx.rect(x, y, barWidth, barH);
            ctx.fill();

            // تسمية المحور
            ctx.fillStyle = 'rgba(248,250,252,0.7)';
            ctx.font = '11px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, height - padding + 16);
        });
    }

    // 2. الشريط الأفقي (Horizontal Bar Chart)
    function renderHorizontalBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.clientWidth || 400;
        const height = canvas.height = canvas.parentElement.clientHeight || 200;
        ctx.clearRect(0, 0, width, height);

        if (!data || !data.length) return;

        const maxVal = Math.max(...data.map(d => d.value), 10);
        const paddingLeft = 90;
        const paddingRight = 30;
        const paddingTop = 20;
        const paddingBottom = 20;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;
        const barHeight = Math.min((chartHeight / data.length) - 10, 24);

        data.forEach((d, i) => {
            const y = paddingTop + (chartHeight / data.length) * i + (chartHeight / data.length - barHeight) / 2;
            const barW = (d.value / maxVal) * chartWidth;

            // اسم العنصر
            ctx.fillStyle = 'rgba(248,250,252,0.85)';
            ctx.font = '11px Segoe UI, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(d.label, paddingLeft - 10, y + barHeight / 1.4);

            // الشريط الأفقي
            const grad = ctx.createLinearGradient(paddingLeft, 0, paddingLeft + barW, 0);
            grad.addColorStop(0, d.color || '#00a2ff');
            grad.addColorStop(1, d.colorEnd || '#00f0ff');

            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(paddingLeft, y, Math.max(barW, 4), barHeight, [0, 4, 4, 0]);
            else ctx.rect(paddingLeft, y, Math.max(barW, 4), barHeight);
            ctx.fill();
        });
    }

    // 3. المخطط الدائري (Donut Ring Chart)
    function renderDonutChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.clientWidth || 300;
        const height = canvas.height = canvas.parentElement.clientHeight || 200;
        ctx.clearRect(0, 0, width, height);

        if (!data || !data.length) return;

        const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
        const centerX = width * 0.45;
        const centerY = height * 0.5;
        const outerRadius = Math.min(centerX, centerY) - 15;
        const innerRadius = outerRadius * 0.62;

        let startAngle = -Math.PI / 2;

        data.forEach((d) => {
            const sliceAngle = (d.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = d.color || '#00a2ff';
            ctx.fill();

            startAngle = endAngle;
        });

        // قائمة العناصر (Legend)
        const legendX = width * 0.75;
        let legendY = 30;
        ctx.font = '11px Segoe UI, sans-serif';
        ctx.textAlign = 'right';

        data.forEach((d) => {
            const pct = Math.round((d.value / total) * 100);
            ctx.fillStyle = d.color || '#00a2ff';
            ctx.fillRect(legendX + 25, legendY - 8, 10, 10);

            ctx.fillStyle = 'rgba(248,250,252,0.85)';
            ctx.fillText(`${d.label} ${pct}%`, legendX + 18, legendY);
            legendY += 22;
        });
    }

    // 4. أرباح وخسائر الشهور (Monthly Profit/Loss Bar Chart)
    function renderMonthlyProfitChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.parentElement.clientWidth || 500;
        const height = canvas.height = canvas.parentElement.clientHeight || 220;
        ctx.clearRect(0, 0, width, height);

        if (!data || !data.length) return;

        const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 10);
        const padding = 35;
        const zeroY = height / 2 + 10; // خط المنتصف للأرباح والخسائر
        const chartWidth = width - padding * 2;
        const availableH = (height - padding * 2) / 2;
        const barWidth = Math.min((chartWidth / data.length) - 8, 26);

        // خط المنتصف (Baseline 0)
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(padding, zeroY); ctx.lineTo(width - padding, zeroY); ctx.stroke();

        data.forEach((d, i) => {
            const x = padding + (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2;
            const valH = (Math.abs(d.value) / maxVal) * availableH;

            if (d.value >= 0) {
                // ربح (أزرق)
                const y = zeroY - valH;
                const grad = ctx.createLinearGradient(0, y, 0, zeroY);
                grad.addColorStop(0, '#00a2ff');
                grad.addColorStop(1, '#0055ff');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, barWidth, valH);
            } else {
                // خسارة (برتقالي)
                const y = zeroY;
                const grad = ctx.createLinearGradient(0, zeroY, 0, zeroY + valH);
                grad.addColorStop(0, '#f97316');
                grad.addColorStop(1, '#ea580c');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, barWidth, valH);
            }

            // الشهر
            ctx.fillStyle = 'rgba(248,250,252,0.7)';
            ctx.font = '10px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, height - 8);
        });
    }

    return { renderBarChart, renderHorizontalBarChart, renderDonutChart, renderMonthlyProfitChart };
})();
