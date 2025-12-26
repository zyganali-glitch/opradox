/**
 * viz-export.js
 * Export & Sharing Functions - FULLY RESTORED
 * PNG, PDF, CSV, JSON, Excel, PowerPoint, Embed, Share, QR, Email
 */

(function () {
    'use strict';

    // =====================================================
    // EXPORT CHART AS PNG
    // =====================================================

    function exportChartAsPNG(chartId = null) {
        const state = window.VIZ_STATE;
        if (!state) return;

        // Get chart ID
        const targetChartId = chartId || state.selectedChart || Object.keys(state.echartsInstances || {})[0];
        const chart = state.echartsInstances?.[targetChartId];

        if (!chart) {
            if (typeof showToast === 'function') showToast('Grafik bulunamadı', 'error');
            return;
        }

        const url = chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
        });

        const link = document.createElement('a');
        link.download = `grafik_${targetChartId}.png`;
        link.href = url;
        link.click();

        if (typeof showToast === 'function') showToast('PNG olarak indirildi', 'success');
    }

    function exportAllChartsPNG() {
        const state = window.VIZ_STATE;
        if (!state || !state.charts) return;

        state.charts.forEach(config => {
            exportChartAsPNG(config.id);
        });
    }

    // =====================================================
    // EXPORT CHART AS SVG
    // =====================================================

    function exportChartAsSVG(chartId = null) {
        const state = window.VIZ_STATE;
        if (!state) return;

        const targetChartId = chartId || state.selectedChart || Object.keys(state.echartsInstances || {})[0];
        const chart = state.echartsInstances?.[targetChartId];

        if (!chart) {
            if (typeof showToast === 'function') showToast('Grafik bulunamadı', 'error');
            return;
        }

        const url = chart.getDataURL({
            type: 'svg',
            pixelRatio: 2,
            backgroundColor: '#fff'
        });

        const link = document.createElement('a');
        link.download = `grafik_${targetChartId}.svg`;
        link.href = url;
        link.click();

        if (typeof showToast === 'function') showToast('SVG olarak indirildi', 'success');
    }

    // =====================================================
    // EXPORT CHART AS PDF
    // =====================================================

    async function exportChartAsPDF(chartId = null) {
        const state = window.VIZ_STATE;
        if (!state) return;

        const targetChartId = chartId || state.selectedChart || Object.keys(state.echartsInstances || {})[0];
        const chart = state.echartsInstances?.[targetChartId];

        if (!chart) {
            if (typeof showToast === 'function') showToast('Grafik bulunamadı', 'error');
            return;
        }

        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            if (typeof showToast === 'function') showToast('jsPDF kütüphanesi yüklenmedi', 'error');
            return;
        }

        const { jsPDF } = window.jspdf || window;
        if (!jsPDF) {
            if (typeof showToast === 'function') showToast('jsPDF yüklenemedi', 'error');
            return;
        }

        const pdf = new jsPDF('l', 'mm', 'a4');
        const url = chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
        });

        pdf.addImage(url, 'PNG', 10, 10, 277, 180);
        pdf.save(`grafik_${targetChartId}.pdf`);

        if (typeof showToast === 'function') showToast('PDF olarak indirildi', 'success');
    }

    // =====================================================
    // EXPORT DASHBOARD AS PDF
    // =====================================================

    async function exportDashboardAsPDF() {
        const dashboard = document.getElementById('vizDashboardGrid');
        if (!dashboard) {
            if (typeof showToast === 'function') showToast('Dashboard bulunamadı', 'error');
            return;
        }

        if (typeof html2canvas === 'undefined') {
            if (typeof showToast === 'function') showToast('html2canvas kütüphanesi yüklenmedi', 'error');
            return;
        }

        if (typeof showToast === 'function') showToast('Dashboard PDF oluşturuluyor...', 'info');

        try {
            const canvas = await html2canvas(dashboard, {
                backgroundColor: '#1a1a2e',
                scale: 2
            });

            const { jsPDF } = window.jspdf || window;
            if (!jsPDF) {
                if (typeof showToast === 'function') showToast('jsPDF yüklenemedi', 'error');
                return;
            }

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');

            const imgWidth = 287;
            const pageHeight = 200;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, Math.min(imgHeight, pageHeight));
            pdf.save('dashboard.pdf');

            if (typeof showToast === 'function') showToast('Dashboard PDF olarak indirildi', 'success');
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            if (typeof showToast === 'function') showToast('PDF oluşturulamadı', 'error');
        }
    }

    // =====================================================
    // EXPORT DATA AS CSV
    // =====================================================

    function exportDataAsCSV() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') showToast('Dışa aktarılacak veri yok', 'warning');
            return;
        }

        const headers = state.columns.join(',');
        const rows = state.data.map(row =>
            state.columns.map(col => {
                const val = row[col];
                // Virgül içeriyorsa tırnak içine al
                if (String(val).includes(',') || String(val).includes('"')) {
                    return `"${String(val).replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = 'veri_export.csv';
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast(`${state.data.length} satır CSV olarak indirildi`, 'success');
    }

    // =====================================================
    // EXPORT DATA AS JSON
    // =====================================================

    function exportDataAsJSON() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') showToast('Dışa aktarılacak veri yok', 'warning');
            return;
        }

        const json = JSON.stringify(state.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = 'veri_export.json';
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast(`${state.data.length} kayıt JSON olarak indirildi`, 'success');
    }

    // =====================================================
    // EXPORT AS EXCEL
    // =====================================================

    function exportAsExcel() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') showToast('Dışa aktarılacak veri yok', 'warning');
            return;
        }

        // Check for SheetJS (xlsx) library
        if (typeof XLSX === 'undefined') {
            // Fallback: CSV formatında indir
            if (typeof showToast === 'function') showToast('XLSX kütüphanesi yok, CSV olarak indiriliyor...', 'info');
            exportDataAsCSV();
            return;
        }

        try {
            const worksheet = XLSX.utils.json_to_sheet(state.data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Veri');

            // Sütun genişliklerini ayarla
            const maxWidth = 15;
            worksheet['!cols'] = state.columns.map(() => ({ wch: maxWidth }));

            XLSX.writeFile(workbook, 'veri_export.xlsx');
            if (typeof showToast === 'function') showToast('Excel olarak indirildi', 'success');
        } catch (error) {
            console.error('Excel export hatası:', error);
            if (typeof showToast === 'function') showToast('Excel oluşturulamadı', 'error');
        }
    }

    // =====================================================
    // EXPORT AS POWERPOINT
    // =====================================================

    async function exportAsPowerPoint() {
        const state = window.VIZ_STATE;
        if (!state || !state.echartsInstances || Object.keys(state.echartsInstances).length === 0) {
            if (typeof showToast === 'function') showToast('Dışa aktarılacak grafik yok', 'warning');
            return;
        }

        // Check for PptxGenJS library
        if (typeof PptxGenJS === 'undefined') {
            if (typeof showToast === 'function') showToast('PptxGenJS kütüphanesi yüklenmedi, PNG olarak indiriliyor...', 'info');
            exportAllChartsPNG();
            return;
        }

        try {
            const pptx = new PptxGenJS();
            pptx.author = 'Opradox Visual Studio';
            pptx.title = 'Dashboard Sunumu';

            // Her grafik için bir slide ekle
            for (const chartId of Object.keys(state.echartsInstances)) {
                const chart = state.echartsInstances[chartId];
                if (chart) {
                    const dataUrl = chart.getDataURL({
                        type: 'png',
                        pixelRatio: 2,
                        backgroundColor: '#fff'
                    });

                    const slide = pptx.addSlide();
                    slide.addImage({
                        data: dataUrl,
                        x: 0.5,
                        y: 1,
                        w: 9,
                        h: 5.5
                    });
                }
            }

            await pptx.writeFile('dashboard_sunumu.pptx');
            if (typeof showToast === 'function') showToast('PowerPoint olarak indirildi', 'success');
        } catch (error) {
            console.error('PowerPoint export hatası:', error);
            if (typeof showToast === 'function') showToast('PowerPoint oluşturulamadı', 'error');
        }
    }

    // =====================================================
    // GENERATE EMBED CODE
    // =====================================================

    function generateEmbedCode(chartId = null) {
        const state = window.VIZ_STATE;
        const targetChartId = chartId || state?.selectedChart || 'chart1';

        const embedCode = `<iframe 
    src="${window.location.origin}/embed/${targetChartId}" 
    width="800" 
    height="600" 
    frameborder="0"
    allowfullscreen>
</iframe>`;

        // Panoya kopyala
        navigator.clipboard.writeText(embedCode).then(() => {
            if (typeof showToast === 'function') showToast('Embed kodu panoya kopyalandı', 'success');
        }).catch(() => {
            // Fallback: modal ile göster
            const html = `
                <div class="viz-modal-form">
                    <label>Embed Kodu:</label>
                    <textarea id="embedCodeText" rows="6" style="width:100%;font-family:monospace;font-size:12px;">${embedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                    <button class="viz-btn-primary" onclick="document.getElementById('embedCodeText').select();document.execCommand('copy');showToast('Kopyalandı!','success');">Kopyala</button>
                </div>
            `;
            if (typeof showStatResultModal === 'function') {
                showStatResultModal('Embed Kodu', html);
            }
        });

        return embedCode;
    }

    // =====================================================
    // SHARE VIA URL
    // =====================================================

    function shareViaURL() {
        const state = window.VIZ_STATE;
        if (!state || !state.data) {
            if (typeof showToast === 'function') showToast('Paylaşılacak veri yok', 'warning');
            return;
        }

        // Generate share token (simulated)
        const shareToken = 'share_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        const shareUrl = `${window.location.origin}/viz/shared/${shareToken}`;

        // Panoya kopyala
        navigator.clipboard.writeText(shareUrl).then(() => {
            if (typeof showToast === 'function') showToast('Paylaşım linki panoya kopyalandı', 'success');
        }).catch(() => {
            if (typeof showToast === 'function') showToast('Link oluşturuldu: ' + shareUrl, 'info');
        });

        return shareUrl;
    }

    // =====================================================
    // GENERATE QR CODE
    // =====================================================

    function generateQRCode() {
        const shareUrl = shareViaURL();

        // Check for QRCode library
        if (typeof QRCode === 'undefined') {
            if (typeof showToast === 'function') showToast('QRCode kütüphanesi yüklenmedi', 'warning');
            return;
        }

        const html = `
            <div class="viz-modal-form" style="text-align:center;">
                <div id="qrCodeContainer" style="display:inline-block;margin:20px;"></div>
                <p style="font-size:0.8rem;color:var(--gm-text-muted);">${shareUrl}</p>
                <button class="viz-btn-primary" onclick="downloadQRCode()">QR Kodu İndir</button>
            </div>
        `;

        if (typeof showStatResultModal === 'function') {
            showStatResultModal('QR Kod', html);
        }

        // Generate QR code after modal is shown
        setTimeout(() => {
            const container = document.getElementById('qrCodeContainer');
            if (container) {
                new QRCode(container, {
                    text: shareUrl,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff'
                });
            }
        }, 100);
    }

    function downloadQRCode() {
        const container = document.getElementById('qrCodeContainer');
        if (!container) return;

        const canvas = container.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            if (typeof showToast === 'function') showToast('QR kod indirildi', 'success');
        }
    }

    // =====================================================
    // SEND VIA EMAIL
    // =====================================================

    function sendViaEmail(email = null) {
        const state = window.VIZ_STATE;

        // Get summary of data
        const rowCount = state?.data?.length || 0;
        const chartCount = state?.charts?.length || 0;

        const subject = encodeURIComponent('Opradox Dashboard Paylaşımı');
        const body = encodeURIComponent(`
Merhaba,

Opradox Visual Studio ile oluşturduğum dashboard'u paylaşmak istiyorum.

Veri Özeti:
- Satır sayısı: ${rowCount}
- Grafik sayısı: ${chartCount}

Dashboard'a erişmek için: ${window.location.href}

Saygılarımla
        `.trim());

        const mailtoUrl = `mailto:${email || ''}?subject=${subject}&body=${body}`;
        window.open(mailtoUrl);

        if (typeof showToast === 'function') showToast('E-posta istemcisi açılıyor...', 'info');
    }

    // =====================================================
    // SHARE TO SOCIAL
    // =====================================================

    function shareToSocial(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('Opradox Visual Studio Dashboard');
        const description = encodeURIComponent('Bu dashboard Opradox Visual Studio ile oluşturuldu.');

        const urls = {
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            whatsapp: `https://wa.me/?text=${title}%20${url}`,
            telegram: `https://t.me/share/url?url=${url}&text=${title}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
            if (typeof showToast === 'function') showToast(`${platform} paylaşımı açılıyor...`, 'info');
        } else {
            if (typeof showToast === 'function') showToast('Bilinmeyen platform', 'error');
        }
    }

    // =====================================================
    // GENERATE REPORT (HTML)
    // =====================================================

    function generateReport(options = {}) {
        const state = window.VIZ_STATE;
        const {
            title = 'Veri Raporu',
            subtitle = '',
            logo = null,
            includeCharts = true,
            includeData = true,
            includeStats = true
        } = options;

        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #4a90d9; border-bottom: 2px solid #4a90d9; }
                    h2 { color: #9a3050; }
                    .logo { max-height: 60px; margin-bottom: 20px; }
                    .chart-img { max-width: 100%; margin: 20px 0; }
                    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                    .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
                    .page-break { page-break-after: always; }
                    .stats-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
                </style>
            </head>
            <body>
                ${logo ? `<img src="${logo}" class="logo">` : ''}
                <h1>${title}</h1>
                ${subtitle ? `<h2>${subtitle}</h2>` : ''}
                <p>Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p>
        `;

        // Stats section
        if (includeStats && state && state.data) {
            const rowCount = state.data.length;
            const colCount = state.columns.length;
            html += `
                <div class="stats-box">
                    <h3>Veri Özeti</h3>
                    <p><strong>Satır Sayısı:</strong> ${rowCount}</p>
                    <p><strong>Sütun Sayısı:</strong> ${colCount}</p>
                    <p><strong>Grafik Sayısı:</strong> ${Object.keys(state.echartsInstances || {}).length}</p>
                </div>
            `;
        }

        // Charts section
        if (includeCharts && state && state.echartsInstances) {
            html += '<h2>Grafikler</h2>';
            Object.keys(state.echartsInstances).forEach((chartId, i) => {
                const chart = state.echartsInstances[chartId];
                if (chart) {
                    try {
                        const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2 });
                        html += `<img src="${dataUrl}" class="chart-img">`;
                        if (i < Object.keys(state.echartsInstances).length - 1) {
                            html += '<div class="page-break"></div>';
                        }
                    } catch (e) {
                        console.warn('Chart export error:', e);
                    }
                }
            });
        }

        // Data section
        if (includeData && state && state.data) {
            html += '<div class="page-break"></div><h2>Veri Tablosu</h2>';
            html += '<table><tr>' + state.columns.map(c => `<th>${c}</th>`).join('') + '</tr>';
            state.data.slice(0, 100).forEach(row => {
                html += '<tr>' + state.columns.map(c => `<td>${row[c] ?? ''}</td>`).join('') + '</tr>';
            });
            html += '</table>';
            if (state.data.length > 100) {
                html += `<p><em>... ve ${state.data.length - 100} satır daha</em></p>`;
            }
        }

        html += `
                <div class="footer">
                    <p>Bu rapor Opradox Visual Studio ile oluşturuldu.</p>
                </div>
            </body>
            </html>
        `;

        // Yeni pencerede aç veya indir
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        if (typeof showToast === 'function') showToast('Rapor oluşturuldu', 'success');

        return html;
    }

    // =====================================================
    // PRINT DASHBOARD
    // =====================================================

    function printDashboard() {
        window.print();
    }

    // =====================================================
    // COPY TO CLIPBOARD (CHART IMAGE)
    // =====================================================

    async function copyChartToClipboard(chartId = null) {
        const state = window.VIZ_STATE;
        if (!state) return;

        const targetChartId = chartId || state.selectedChart || Object.keys(state.echartsInstances || {})[0];
        const chart = state.echartsInstances?.[targetChartId];

        if (!chart) {
            if (typeof showToast === 'function') showToast('Grafik bulunamadı', 'error');
            return;
        }

        try {
            const dataUrl = chart.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#fff'
            });

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            if (typeof showToast === 'function') showToast('Grafik panoya kopyalandı', 'success');
        } catch (error) {
            console.error('Clipboard copy error:', error);
            if (typeof showToast === 'function') showToast('Panoya kopyalanamadı', 'error');
        }
    }

    // =====================================================
    // EXPORT CONFIGURATIONS
    // =====================================================

    function exportDashboardConfig() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const config = {
            charts: state.charts || [],
            columns: state.columns || [],
            columnsInfo: state.columnsInfo || [],
            filters: state.filters || [],
            theme: state.theme || 'dark',
            exportDate: new Date().toISOString()
        };

        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = 'dashboard_config.json';
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('Dashboard yapılandırması indirildi', 'success');
    }

    function importDashboardConfig(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    const state = window.VIZ_STATE;

                    if (state) {
                        state.charts = config.charts || [];
                        state.columns = config.columns || [];
                        state.columnsInfo = config.columnsInfo || [];
                        state.filters = config.filters || [];
                        state.theme = config.theme || 'dark';
                    }

                    if (typeof showToast === 'function') showToast('Yapılandırma yüklendi', 'success');
                    resolve(config);
                } catch (error) {
                    if (typeof showToast === 'function') showToast('Yapılandırma okunamadı', 'error');
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    // PNG/SVG
    window.exportChartAsPNG = exportChartAsPNG;
    window.exportAllChartsPNG = exportAllChartsPNG;
    window.exportChartAsSVG = exportChartAsSVG;

    // PDF
    window.exportChartAsPDF = exportChartAsPDF;
    window.exportDashboardAsPDF = exportDashboardAsPDF;

    // Data Formats
    window.exportDataAsCSV = exportDataAsCSV;
    window.exportDataAsJSON = exportDataAsJSON;
    window.exportAsExcel = exportAsExcel;
    window.exportAsPowerPoint = exportAsPowerPoint;

    // Sharing
    window.generateEmbedCode = generateEmbedCode;
    window.shareViaURL = shareViaURL;
    window.generateQRCode = generateQRCode;
    window.downloadQRCode = downloadQRCode;
    window.sendViaEmail = sendViaEmail;
    window.shareToSocial = shareToSocial;

    // Report
    window.generateReport = generateReport;
    window.printDashboard = printDashboard;

    // Clipboard
    window.copyChartToClipboard = copyChartToClipboard;

    // Config
    window.exportDashboardConfig = exportDashboardConfig;
    window.importDashboardConfig = importDashboardConfig;

    console.log('✅ viz-export.js FULLY RESTORED - All 20+ export functions available');
})();
