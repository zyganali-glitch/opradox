/**
 * viz-export-pdf.js
 * PDF Export Functions - Dashboard PDF, Portable HTML Dashboard
 * Requires jsPDF and html2canvas
 */

(function () {
    'use strict';

    /**
     * Export dashboard to PDF
     */
    async function exportToPDF() {
        if (typeof showToast === 'function') {
            showToast('PDF olusturuluyor...', 'info');
        }

        const dashboard = document.getElementById('vizDashboardGrid') ||
            document.getElementById('vizCanvas');

        if (!dashboard) {
            if (typeof showToast === 'function') {
                showToast('Dashboard bulunamadi', 'error');
            }
            return;
        }

        try {
            // Check dependencies
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas kutuphanesi yuklu degil');
            }
            if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
                throw new Error('jsPDF kutuphanesi yuklu degil');
            }

            const bgColor = document.body.classList.contains('day-mode') ? '#f5f5f5' : '#1a1a2e';

            // Capture dashboard screenshot
            const screenshot = await html2canvas(dashboard, {
                scale: 2,
                useCORS: true,
                backgroundColor: bgColor,
                logging: false
            });

            // Create PDF
            const jsPDFClass = window.jspdf?.jsPDF || jsPDF;
            const pdf = new jsPDFClass({
                orientation: 'landscape',
                unit: 'px',
                format: [screenshot.width / 2, screenshot.height / 2 + 80]
            });

            // Add header
            pdf.setFontSize(18);
            pdf.setTextColor(74, 144, 217);
            pdf.text('Opradox Visual Studio - Dashboard Report', 20, 30);

            // Add date
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Generated: ${new Date().toLocaleString('tr-TR')}`, 20, 45);

            // Add screenshot
            pdf.addImage(
                screenshot.toDataURL('image/png'),
                'PNG',
                0,
                60,
                screenshot.width / 2,
                screenshot.height / 2
            );

            // Download
            pdf.save(`opradox-dashboard-${Date.now()}.pdf`);

            if (typeof showToast === 'function') {
                showToast('PDF indirildi!', 'success');
            }

        } catch (error) {
            console.error('PDF olusturma hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('PDF olusturulamadi: ' + error.message, 'error');
            }
        }
    }

    /**
     * Export single chart to PDF
     * @param {string} chartId - Chart ID to export
     */
    async function exportChartToPDF(chartId) {
        const state = window.VIZ_STATE;
        if (!state) return;

        const targetId = chartId || state.selectedChart;
        if (!targetId) {
            if (typeof showToast === 'function') {
                showToast('Once bir grafik secin', 'warning');
            }
            return;
        }

        const chartContainer = document.getElementById(`${targetId}_chart`);
        if (!chartContainer) {
            if (typeof showToast === 'function') {
                showToast('Grafik bulunamadi', 'error');
            }
            return;
        }

        if (typeof showToast === 'function') {
            showToast('PDF olusturuluyor...', 'info');
        }

        try {
            if (typeof html2canvas === 'undefined' ||
                (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined')) {
                throw new Error('Gerekli kutuphaneler yuklu degil');
            }

            const bgColor = document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e';

            const screenshot = await html2canvas(chartContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: bgColor
            });

            const jsPDFClass = window.jspdf?.jsPDF || jsPDF;
            const pdf = new jsPDFClass({
                orientation: screenshot.width > screenshot.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [screenshot.width / 2 + 40, screenshot.height / 2 + 80]
            });

            const config = state.charts.find(c => c.id === targetId);
            const title = config?.title || 'Chart';

            pdf.setFontSize(16);
            pdf.setTextColor(74, 144, 217);
            pdf.text(title, 20, 25);

            pdf.setFontSize(9);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Opradox Visual Studio | ${new Date().toLocaleString('tr-TR')}`, 20, 40);

            pdf.addImage(
                screenshot.toDataURL('image/png'),
                'PNG',
                20,
                50,
                screenshot.width / 2,
                screenshot.height / 2
            );

            pdf.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);

            if (typeof showToast === 'function') {
                showToast('PDF indirildi!', 'success');
            }

        } catch (error) {
            console.error('Chart PDF hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('PDF olusturulamadi', 'error');
            }
        }
    }

    /**
     * Export portable self-contained HTML dashboard
     */
    async function exportPortableDashboard() {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (typeof showToast === 'function') {
            showToast('Portable Dashboard olusturuluyor...', 'info');
        }

        try {
            // Collect chart data
            const chartsData = state.charts.map(config => {
                const chart = state.echartsInstances[config.id];
                return {
                    id: config.id,
                    type: config.type,
                    title: config.title,
                    options: chart ? chart.getOption() : null
                };
            });

            // Generate self-contained HTML
            const html = generatePortableHTML(chartsData);

            // Download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            if (typeof downloadFile === 'function') {
                downloadFile(url, `opradox-dashboard-${Date.now()}.html`);
            } else {
                const link = document.createElement('a');
                link.download = `opradox-dashboard-${Date.now()}.html`;
                link.href = url;
                link.click();
            }

            URL.revokeObjectURL(url);

            if (typeof showToast === 'function') {
                showToast('Portable Dashboard olusturuldu!', 'success');
            }

        } catch (error) {
            console.error('Portable dashboard hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('Dashboard olusturulamadi', 'error');
            }
        }
    }

    /**
     * Generate portable HTML with embedded ECharts
     */
    function generatePortableHTML(chartsData) {
        const date = new Date().toLocaleDateString('tr-TR');

        return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Opradox Dashboard - ${date}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"><\/script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            text-align: center;
            color: #fff;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 2rem; color: #4a90d9; }
        .header p { color: #888; margin-top: 5px; }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            max-width: 1600px;
            margin: 0 auto;
        }
        .chart-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 15px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .chart-card h3 {
            color: #fff;
            margin-bottom: 10px;
            font-size: 0.9rem;
        }
        .chart-container {
            width: 100%;
            height: 300px;
        }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 30px;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Opradox Dashboard</h1>
        <p>Generated: ${new Date().toLocaleString('tr-TR')}</p>
    </div>
    
    <div class="grid">
        ${chartsData.map((chart, idx) => `
            <div class="chart-card">
                <h3>${chart.title || 'Chart ' + (idx + 1)}</h3>
                <div class="chart-container" id="chart_${idx}"></div>
            </div>
        `).join('')}
    </div>
    
    <div class="footer">
        Powered by Opradox Visual Studio
    </div>

    <script>
        const chartsData = ${JSON.stringify(chartsData)};
        
        chartsData.forEach((data, idx) => {
            const container = document.getElementById('chart_' + idx);
            if (container && data.options) {
                const chart = echarts.init(container, 'dark');
                chart.setOption(data.options);
                
                window.addEventListener('resize', () => chart.resize());
            }
        });
    <\/script>
</body>
</html>`;
    }

    /**
     * Export dashboard with data as Excel (if SheetJS available)
     */
    async function exportToExcel() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Export edilecek veri yok', 'warning');
            }
            return;
        }

        if (typeof XLSX === 'undefined') {
            if (typeof showToast === 'function') {
                showToast('Excel export icin SheetJS gerekli', 'error');
            }
            return;
        }

        try {
            const ws = XLSX.utils.json_to_sheet(state.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, `opradox_data_${Date.now()}.xlsx`);

            if (typeof showToast === 'function') {
                showToast('Excel dosyasi indirildi', 'success');
            }
        } catch (error) {
            console.error('Excel export hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('Excel export hatasi', 'error');
            }
        }
    }

    /**
     * Export data as CSV
     */
    function exportToCSV() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Export edilecek veri yok', 'warning');
            }
            return;
        }

        try {
            const columns = state.columns;
            const header = columns.join(',');
            const rows = state.data.map(row =>
                columns.map(col => {
                    const val = row[col];
                    // Escape quotes and wrap in quotes if contains comma
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                }).join(',')
            );

            const csv = [header, ...rows].join('\n');
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            if (typeof downloadFile === 'function') {
                downloadFile(url, `opradox_data_${Date.now()}.csv`);
            } else {
                const link = document.createElement('a');
                link.download = `opradox_data_${Date.now()}.csv`;
                link.href = url;
                link.click();
            }

            URL.revokeObjectURL(url);

            if (typeof showToast === 'function') {
                showToast('CSV dosyasi indirildi', 'success');
            }
        } catch (error) {
            console.error('CSV export hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('CSV export hatasi', 'error');
            }
        }
    }

    // Global exports
    window.exportToPDF = exportToPDF;
    window.exportChartToPDF = exportChartToPDF;
    window.exportPortableDashboard = exportPortableDashboard;
    window.generatePortableHTML = generatePortableHTML;
    window.exportToExcel = exportToExcel;
    window.exportToCSV = exportToCSV;

    console.log('✅ viz-export-pdf.js Loaded');
})();
