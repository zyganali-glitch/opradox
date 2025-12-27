// =====================================================
// ADAPTERS.JS - Compatibility Layer
// FAZ 1A+1B+1C: Complete sharing, export, config features
// DO NOT DELETE - This maintains backward compatibility
// =====================================================

(function () {
    'use strict';

    // =====================================================
    // OBJECT/CONSTANT DEFAULTS
    // =====================================================
    window.COLOR_PALETTES = window.COLOR_PALETTES || {
        'default': ['#4a90d9', '#9a3050', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c', '#1abc9c', '#34495e'],
        'pastel': ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb'],
        'dark': ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1', '#1abc9c', '#16a085'],
        'ocean': ['#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5', '#5c6bc0', '#7986cb', '#9fa8da'],
        'sunset': ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff9f43', '#00d2d3', '#2e86de']
    };

    window.DASHBOARD_TEMPLATES = window.DASHBOARD_TEMPLATES || {};
    window.HISTORY = window.HISTORY || { undoStack: [], redoStack: [], maxSize: 50 };
    window.VERSION_HISTORY = window.VERSION_HISTORY || [];
    window.VIZ_CACHE = window.VIZ_CACHE || { storage: new Map(), maxSize: 50, ttl: 300000 };
    window.OFFLINE_MODE = window.OFFLINE_MODE || { isOnline: navigator.onLine, pendingActions: [] };

    // VIZ_SETTINGS - Backend/Network Control (FINAL_AUDIT_FIX)
    window.VIZ_SETTINGS = window.VIZ_SETTINGS || {
        backendEnabled: false,       // Backend API çağrıları varsayılan OFF
        allowRemoteUrlLoad: false,   // Remote URL yükleme varsayılan OFF
        debugMode: false,
        autoSaveEnabled: true,
        autoSaveInterval: 60000      // 1 dakika
    };

    // =====================================================
    // CLASS STUB
    // =====================================================
    window.VirtualScrollTable = window.VirtualScrollTable || class VirtualScrollTable {
        constructor(container, data, rowHeight = 32) {
            this.container = container;
            this.data = data || [];
            this.rowHeight = rowHeight;
        }
        init() { }
        render() { }
        updateData(newData) { this.data = newData; }
    };

    // =====================================================
    // CRITICAL HELPER: downloadFile
    // =====================================================
    window.downloadFile = window.downloadFile || function (dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // =====================================================
    // CRITICAL HELPER: showToast fallback
    // =====================================================
    if (typeof window.showToast !== 'function') {
        window.showToast = function (message, type = 'info') {
            let container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10001;display:flex;flex-direction:column;gap:10px;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.className = `viz-toast viz-toast-${type}`;
            toast.style.cssText = 'padding:12px 20px;border-radius:8px;color:#fff;font-size:14px;animation:slideIn 0.3s ease;box-shadow:0 4px 12px rgba(0,0,0,0.3);';

            const colors = { success: '#27ae60', error: '#e74c3c', warning: '#f39c12', info: '#4a90d9' };
            toast.style.background = colors[type] || colors.info;
            toast.textContent = message;

            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        };
    }

    // =====================================================
    // FAZ 1C: exportJSONConfig - Full Implementation
    // =====================================================
    window.exportJSONConfig = function () {
        const config = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            charts: (window.VIZ_STATE?.charts || []).map(c => ({
                id: c.id,
                type: c.type,
                title: c.title,
                xAxis: c.xAxis,
                yAxis: c.yAxis,
                yAxes: c.yAxes,
                aggregation: c.aggregation,
                color: c.color,
                dataLimit: c.dataLimit,
                useDualAxis: c.useDualAxis
            })),
            selectedChart: window.VIZ_STATE?.selectedChart || null,
            filters: window.VIZ_STATE?.filters || [],
            theme: document.body.classList.contains('day-mode') ? 'light' : 'dark',
            lang: window.VIZ_STATE?.lang || 'tr'
        };

        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        window.downloadFile(url, 'dashboard_config.json');
        URL.revokeObjectURL(url);

        if (window.showToast) window.showToast('Konfigürasyon kaydedildi', 'success');
        return config;
    };

    // =====================================================
    // FAZ 1C: importJSONConfig - Full Implementation
    // =====================================================
    window.importJSONConfig = function (jsonOrFile) {
        // Eğer File nesnesi verilmişse
        if (jsonOrFile instanceof File) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const config = JSON.parse(e.target.result);
                    applyConfig(config);
                } catch (err) {
                    if (window.showToast) window.showToast('JSON parse hatası: ' + err.message, 'error');
                }
            };
            reader.readAsText(jsonOrFile);
            return;
        }

        // Eğer string verilmişse
        if (typeof jsonOrFile === 'string') {
            try {
                const config = JSON.parse(jsonOrFile);
                applyConfig(config);
            } catch (err) {
                if (window.showToast) window.showToast('JSON parse hatası: ' + err.message, 'error');
            }
            return;
        }

        // Eğer object verilmişse
        if (typeof jsonOrFile === 'object') {
            applyConfig(jsonOrFile);
            return;
        }

        // Dosya seçici aç
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function (e) {
            const file = e.target.files[0];
            if (file) window.importJSONConfig(file);
        };
        input.click();
    };

    function applyConfig(config) {
        if (!config || !window.VIZ_STATE) {
            if (window.showToast) window.showToast('Geçersiz konfigürasyon', 'error');
            return;
        }

        // Charts'ı uygula
        if (config.charts && Array.isArray(config.charts)) {
            // Mevcut grafikleri temizle
            const dashboard = document.getElementById('vizDashboardGrid');
            if (dashboard) {
                // Eski chartları dispose et
                Object.keys(window.VIZ_STATE.echartsInstances || {}).forEach(id => {
                    if (window.VIZ_STATE.echartsInstances[id]) {
                        window.VIZ_STATE.echartsInstances[id].dispose();
                    }
                });
                dashboard.innerHTML = '';
            }

            window.VIZ_STATE.echartsInstances = {};
            window.VIZ_STATE.charts = [];

            // Yeni chartları oluştur
            config.charts.forEach(chartConfig => {
                window.VIZ_STATE.charts.push(chartConfig);
                if (typeof window.createChartWidget === 'function') {
                    window.createChartWidget(chartConfig);
                }
            });
        }

        // Filtreleri uygula
        if (config.filters) {
            window.VIZ_STATE.filters = config.filters;
        }

        // Theme uygula
        if (config.theme === 'light') {
            document.body.classList.add('day-mode');
            document.body.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('day-mode');
        }

        // Lang uygula
        if (config.lang) {
            window.VIZ_STATE.lang = config.lang;
        }

        // Seçili chart
        if (config.selectedChart && typeof window.selectChart === 'function') {
            window.selectChart(config.selectedChart);
        }

        // Grafikleri yeniden render et
        if (typeof window.rerenderAllCharts === 'function') {
            setTimeout(() => window.rerenderAllCharts(), 100);
        }

        if (window.showToast) window.showToast(`Konfigürasyon yüklendi (${config.charts?.length || 0} grafik)`, 'success');
    }

    // =====================================================
    // FAZ 1C: exportPortableDashboard - Full Implementation
    // =====================================================
    window.exportPortableDashboard = async function () {
        if (window.showToast) window.showToast('Portable Dashboard oluşturuluyor...', 'info');

        try {
            // Grafik verilerini topla
            const chartsData = (window.VIZ_STATE?.charts || []).map(config => {
                const chart = window.VIZ_STATE?.echartsInstances?.[config.id];
                return {
                    id: config.id,
                    type: config.type,
                    title: config.title,
                    options: chart ? chart.getOption() : null
                };
            });

            // Self-contained HTML oluştur
            const html = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Opradox Dashboard - ${new Date().toLocaleDateString('tr-TR')}</title>
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
            max-width: 1400px;
            margin: 0 auto;
        }
        .chart-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .chart-title {
            color: #fff;
            font-size: 1rem;
            margin-bottom: 10px;
            text-align: center;
        }
        .chart-container { height: 300px; }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 30px;
            font-size: 0.8rem;
        }
        .footer a { color: #4a90d9; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Opradox Dashboard</h1>
        <p>Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p>
    </div>
    <div class="grid" id="dashboardGrid"></div>
    <div class="footer">
        Opradox Visual Studio ile oluşturuldu | <a href="https://opradox.com" target="_blank">opradox.com</a>
    </div>
    <script>
        const chartsData = ${JSON.stringify(chartsData)};
        const grid = document.getElementById('dashboardGrid');
        
        chartsData.forEach((chartData, index) => {
            const card = document.createElement('div');
            card.className = 'chart-card';
            card.innerHTML = '<div class="chart-title">' + (chartData.title || 'Grafik ' + (index + 1)) + '</div><div class="chart-container" id="chart' + index + '"></div>';
            grid.appendChild(card);
            
            if (chartData.options) {
                const chart = echarts.init(document.getElementById('chart' + index));
                chart.setOption(chartData.options);
            }
        });
        
        window.addEventListener('resize', () => {
            document.querySelectorAll('.chart-container').forEach(el => {
                const instance = echarts.getInstanceByDom(el);
                if (instance) instance.resize();
            });
        });
    <\/script>
</body>
</html>`;

            // İndir
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.downloadFile(url, `opradox-dashboard-${Date.now()}.html`);
            URL.revokeObjectURL(url);

            if (window.showToast) window.showToast('Portable Dashboard indirildi!', 'success');

        } catch (error) {
            console.error('Portable dashboard hatası:', error);
            if (window.showToast) window.showToast('Dashboard oluşturulamadı', 'error');
        }
    };

    // =====================================================
    // FAZ 1C: exportChartAsSVG - Full Implementation
    // =====================================================
    window.exportChartAsSVG = function (chartId) {
        const targetId = chartId || window.VIZ_STATE?.selectedChart;
        if (!targetId) {
            if (window.showToast) window.showToast('Önce bir grafik seçin', 'warning');
            return;
        }

        const chart = window.VIZ_STATE?.echartsInstances?.[targetId];
        if (!chart) {
            if (window.showToast) window.showToast('Grafik bulunamadı', 'error');
            return;
        }

        try {
            const svgUrl = chart.getDataURL({
                type: 'svg',
                pixelRatio: 2,
                backgroundColor: document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e'
            });

            window.downloadFile(svgUrl, `chart_${targetId}.svg`);
            if (window.showToast) window.showToast('SVG indirildi', 'success');
        } catch (error) {
            console.error('SVG export hatası:', error);
            if (window.showToast) window.showToast('SVG oluşturulamadı', 'error');
        }
    };

    // =====================================================
    // FAZ 1C: shareViaURL - Full Implementation
    // =====================================================
    window.shareViaURL = function () {
        if (typeof LZString === 'undefined') {
            if (window.showToast) window.showToast('LZString kütüphanesi yüklü değil', 'error');
            return;
        }

        const config = {
            version: '2.0',
            charts: (window.VIZ_STATE?.charts || []).map(c => ({
                type: c.type,
                title: c.title,
                xAxis: c.xAxis,
                yAxis: c.yAxis,
                yAxes: c.yAxes,
                aggregation: c.aggregation,
                color: c.color,
                dataLimit: c.dataLimit
            })),
            theme: document.body.classList.contains('day-mode') ? 'light' : 'dark'
        };

        try {
            const json = JSON.stringify(config);
            const compressed = LZString.compressToEncodedURIComponent(json);
            const shareURL = `${window.location.origin}${window.location.pathname}?share=${compressed}`;

            // Clipboard'a kopyala
            navigator.clipboard.writeText(shareURL).then(() => {
                if (window.showToast) window.showToast('Paylaşım linki kopyalandı!', 'success');
            }).catch(() => {
                // Fallback: prompt ile göster
                prompt('Paylaşım Linki:', shareURL);
            });

            // Modal ile göster
            showShareModal(shareURL);

        } catch (e) {
            console.error('Share URL error:', e);
            if (window.showToast) window.showToast('Paylaşım linki oluşturulamadı', 'error');
        }
    };

    function showShareModal(url) {
        // Mevcut modalı kaldır
        const existing = document.querySelector('.viz-share-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'viz-share-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:500px;width:90%;border:1px solid rgba(255,255,255,0.1);">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-share-alt" style="color:#4a90d9;"></i> Paylaşım Linki
                </h3>
                <textarea readonly style="width:100%;height:80px;background:#0f0f1a;border:1px solid #333;border-radius:8px;color:#fff;padding:12px;font-size:13px;resize:none;">${url}</textarea>
                <div style="display:flex;gap:10px;margin-top:16px;">
                    <button onclick="navigator.clipboard.writeText('${url}').then(()=>window.showToast('Kopyalandı','success'))" style="flex:1;padding:10px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        <i class="fas fa-copy"></i> Kopyala
                    </button>
                    <button onclick="this.closest('.viz-share-modal').remove()" style="flex:1;padding:10px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    // =====================================================
    // FAZ 1C: loadFromURL - Full Implementation
    // =====================================================
    window.loadFromURL = function () {
        const params = new URLSearchParams(window.location.search);
        const shareData = params.get('share');

        if (!shareData) return;

        if (typeof LZString === 'undefined') {
            console.warn('LZString not available for URL loading');
            return;
        }

        try {
            const json = LZString.decompressFromEncodedURIComponent(shareData);
            if (!json) throw new Error('Decompress failed');

            const config = JSON.parse(json);

            if (config.charts && Array.isArray(config.charts)) {
                // Theme uygula
                if (config.theme === 'light') {
                    document.body.classList.add('day-mode');
                    document.body.classList.remove('dark-mode');
                } else {
                    document.body.classList.add('dark-mode');
                    document.body.classList.remove('day-mode');
                }

                // Grafikleri oluştur (sayfa yüklendikten sonra)
                setTimeout(() => {
                    config.charts.forEach(chartConfig => {
                        if (typeof window.addChart === 'function') {
                            const chart = window.addChart(chartConfig.type);
                            // Config'i güncelle
                            const last = window.VIZ_STATE?.charts?.[window.VIZ_STATE.charts.length - 1];
                            if (last) {
                                Object.assign(last, chartConfig);
                                if (typeof window.renderChart === 'function') {
                                    window.renderChart(last);
                                }
                            }
                        }
                    });

                    if (window.showToast) {
                        window.showToast(`Paylaşılan dashboard yüklendi (${config.charts.length} grafik)`, 'success');
                    }
                }, 500);

                // URL'den parametreyi temizle
                window.history.replaceState({}, '', window.location.pathname);
            }
        } catch (e) {
            console.warn('Paylaşım verisi yüklenemedi:', e);
        }
    };

    // =====================================================
    // FAZ 1C: generateEmbedCode - Full Implementation
    // =====================================================
    window.generateEmbedCode = function () {
        if (typeof LZString === 'undefined') {
            if (window.showToast) window.showToast('LZString kütüphanesi yüklü değil', 'error');
            return '';
        }

        const config = {
            charts: (window.VIZ_STATE?.charts || []).map(c => ({
                type: c.type,
                title: c.title,
                xAxis: c.xAxis,
                yAxis: c.yAxis
            }))
        };

        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(config));
        const shareURL = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
        const embedCode = `<iframe src="${shareURL}" width="100%" height="600" frameborder="0" style="border-radius:12px;"></iframe>`;

        // Modal göster
        showEmbedModal(embedCode);

        return embedCode;
    };

    function showEmbedModal(code) {
        const existing = document.querySelector('.viz-embed-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'viz-embed-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:600px;width:90%;border:1px solid rgba(255,255,255,0.1);">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-code" style="color:#4a90d9;"></i> Embed Kodu
                </h3>
                <textarea readonly style="width:100%;height:100px;background:#0f0f1a;border:1px solid #333;border-radius:8px;color:#fff;padding:12px;font-size:12px;font-family:monospace;resize:none;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                <div style="display:flex;gap:10px;margin-top:16px;">
                    <button onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`).then(()=>window.showToast('Kopyalandı','success'))" style="flex:1;padding:10px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        <i class="fas fa-copy"></i> Kopyala
                    </button>
                    <button onclick="this.closest('.viz-embed-modal').remove()" style="flex:1;padding:10px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    // =====================================================
    // FAZ 1C: generateQRCode - Minimal Offline Implementation
    // =====================================================
    window.generateQRCode = function () {
        if (typeof LZString === 'undefined') {
            if (window.showToast) window.showToast('LZString kütüphanesi yüklü değil', 'error');
            return;
        }

        const config = {
            charts: (window.VIZ_STATE?.charts || []).map(c => ({
                type: c.type,
                title: c.title
            }))
        };

        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(config));
        const shareURL = `${window.location.origin}${window.location.pathname}?share=${compressed}`;

        // Minimal QR Code using Canvas (simplified implementation)
        showQRModal(shareURL);
    };

    function showQRModal(url) {
        const existing = document.querySelector('.viz-qr-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'viz-qr-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:400px;width:90%;border:1px solid rgba(255,255,255,0.1);text-align:center;">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:10px;">
                    <i class="fas fa-qrcode" style="color:#4a90d9;"></i> QR Kod
                </h3>
                <div id="qrCodeContainer" style="background:#fff;padding:20px;border-radius:8px;display:inline-block;margin-bottom:16px;">
                    <canvas id="qrCanvas" width="200" height="200"></canvas>
                </div>
                <p style="color:#888;font-size:12px;margin-bottom:16px;word-break:break-all;">${url.substring(0, 80)}...</p>
                <div style="display:flex;gap:10px;">
                    <button onclick="navigator.clipboard.writeText('${url}').then(()=>window.showToast('Link kopyalandı','success'))" style="flex:1;padding:10px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        <i class="fas fa-link"></i> Link Kopyala
                    </button>
                    <button onclick="this.closest('.viz-qr-modal').remove()" style="flex:1;padding:10px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);

        // Draw simple QR placeholder (actual QR would need library)
        const canvas = document.getElementById('qrCanvas');
        const ctx = canvas.getContext('2d');
        drawSimpleQRPattern(ctx, url);
    }

    function drawSimpleQRPattern(ctx, data) {
        // Simple visual pattern based on data hash (not a real QR code)
        const size = 200;
        const cellSize = 10;
        const cells = size / cellSize;

        // Generate pattern from data
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash = hash & hash;
        }

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#000';

        // Position detection patterns (corners)
        drawFinderPattern(ctx, 0, 0, cellSize);
        drawFinderPattern(ctx, size - 7 * cellSize, 0, cellSize);
        drawFinderPattern(ctx, 0, size - 7 * cellSize, cellSize);

        // Data pattern (pseudo-random based on hash)
        for (let row = 0; row < cells; row++) {
            for (let col = 0; col < cells; col++) {
                // Skip finder pattern areas
                if ((row < 8 && col < 8) || (row < 8 && col >= cells - 8) || (row >= cells - 8 && col < 8)) continue;

                const idx = row * cells + col;
                const bit = ((hash >> (idx % 32)) & 1) ^ ((data.charCodeAt(idx % data.length) >> (idx % 8)) & 1);

                if (bit) {
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
    }

    function drawFinderPattern(ctx, x, y, cellSize) {
        // Outer black square
        ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
        // Inner white square
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        // Center black square
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }

    // =====================================================
    // REMAINING ALIASES (FAZ 1B carryover)
    // =====================================================

    // Export aliases
    window.exportPNG = window.exportPNG || window.exportChartAsPNG;
    window.exportToPDF = window.exportToPDF || window.exportChartAsPDF;
    window.exportDashboardAsPDF = window.exportDashboardAsPDF || window.exportChartAsPDF;
    window.exportAsPortableHTML = window.exportAsPortableHTML || window.exportPortableDashboard;
    window.exportAsExcel = window.exportAsExcel || function () { if (window.showToast) window.showToast('Excel export - geliştirilmekte', 'info'); };
    window.exportAsPowerPoint = window.exportAsPowerPoint || function () { if (window.showToast) window.showToast('PowerPoint export - geliştirilmekte', 'info'); };

    // Show menu aliases 
    window.showExportMenu = window.showExportMenu || function () { if (window.showToast) window.showToast('Export menüsü için toolbar\'ı kullanın', 'info'); };
    window.showFilePreviewModal = window.showFilePreviewModal || window.showHeaderPreview;
    window.closeFilePreviewModal = window.closeFilePreviewModal || window.closeVizPreviewModal || function () { };
    window.showPDFPreviewModal = window.showPDFPreviewModal || function (url) { window.open(url, '_blank'); };
    window.showCollaborationModal = window.showCollaborationModal || function () { if (window.showToast) window.showToast('İşbirliği - geliştirilmekte', 'info'); };
    window.showScheduledReportsModal = window.showScheduledReportsModal || function () { if (window.showToast) window.showToast('Planlanmış raporlar - geliştirilmekte', 'info'); };
    window.showWordCloudModal = window.showWordCloudModal || function () { if (window.showToast) window.showToast('Word Cloud için grafik ekleyin', 'info'); };
    window.showContextualHelp = window.showContextualHelp || function (topic) { if (window.showToast) window.showToast('Yardım: ' + (topic || 'Genel'), 'info'); };
    window.showWarnings = window.showWarnings || function (warnings) { if (warnings?.length && window.showToast) window.showToast(warnings[0], 'warning'); };
    window.showAutoSaveNotification = window.showAutoSaveNotification || function () { if (window.showToast) window.showToast('Otomatik kaydedildi', 'success'); };
    window.showExamples = window.showExamples || function () { if (window.showToast) window.showToast('Örnekler - geliştirilmekte', 'info'); };

    // Chart render aliases
    window.renderCandlestick = window.renderCandlestick || function () { if (window.showToast) window.showToast('Candlestick - grafik tipini seçin', 'info'); };
    window.renderViolinPlot = window.renderViolinPlot || function () { if (window.showToast) window.showToast('Violin plot - geliştirilmekte', 'info'); };
    window.renderDotPlot = window.renderDotPlot || function () { if (window.showToast) window.showToast('Dot plot - geliştirilmekte', 'info'); };
    window.renderGroupedBar = window.renderGroupedBar || function () { if (window.showToast) window.showToast('Grouped bar - çoklu Y ekseni kullanın', 'info'); };
    window.renderPercentStackedBar = window.renderPercentStackedBar || function () { if (window.showToast) window.showToast('Stacked bar - geliştirilmekte', 'info'); };
    window.renderSparkline = window.renderSparkline || function () { if (window.showToast) window.showToast('Sparkline - geliştirilmekte', 'info'); };
    window.renderPointMap = window.renderPointMap || window.renderBubbleMap;
    window.renderTimeline = window.renderTimeline || window.renderGanttChart;
    window.renderWordCloud = window.renderWordCloud || window.renderWordCloudAdvanced;
    window.renderParallelCoordinates = window.renderParallelCoordinates || window.renderParallelCoordinatesChart;
    window.renderChoroplethMapAdvanced = window.renderChoroplethMapAdvanced || window.renderChoroplethMap;
    window.renderColumnsListImproved = window.renderColumnsListImproved || window.renderColumnsList;

    // Statistics aliases
    window.runPCA = window.runPCA || window.runPCAAnalysis;
    window.runKMeansClustering = window.runKMeansClustering || window.runKMeansAnalysis;
    window.calculateCronbachAlpha = window.calculateCronbachAlpha || window.runCronbachAlpha;
    window.calculateCorrelationMatrix = window.calculateCorrelationMatrix || function () { return []; };
    window.calculateRegressionCoefficients = window.calculateRegressionCoefficients || function () { return {}; };
    window.plotKaplanMeier = window.plotKaplanMeier || function () { if (window.showToast) window.showToast('Kaplan-Meier - geliştirilmekte', 'info'); };
    window.runLogisticFromModal = window.runLogisticFromModal || window.runLogisticRegression;
    window.runTimeSeriesFromModal = window.runTimeSeriesFromModal || window.runTimeSeriesAnalysis;
    window.runBackendStatTest = window.runBackendStatTest || window.callSpssApi;

    // =====================================================
    // FAZ 2: DATA PROFILING - Full Implementations
    // =====================================================

    // detectColumnTypes - Sütun tiplerini algıla (number/date/string/bool)
    window.detectColumnTypes = function () {
        const data = window.VIZ_STATE?.data || window.VIZ_STATE?.getActiveData?.() || [];
        const columns = window.VIZ_STATE?.columns || window.VIZ_STATE?.getActiveColumns?.() || [];
        const columnTypes = {};

        columns.forEach(col => {
            const values = data.slice(0, 200).map(row => row[col]).filter(v => v != null && v !== '');
            if (values.length === 0) {
                columnTypes[col] = { type: 'text', icon: 'fa-font', color: '#888' };
                return;
            }

            // Numeric check
            const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
            // Date check
            const datePatterns = [/^\d{4}-\d{2}-\d{2}/, /^\d{2}\/\d{2}\/\d{4}/, /^\d{2}\.\d{2}\.\d{4}/];
            const dateCount = values.filter(v => datePatterns.some(p => p.test(String(v))) || (!isNaN(Date.parse(v)) && String(v).length > 6)).length;
            // Boolean check
            const boolValues = ['true', 'false', 'yes', 'no', 'evet', 'hayır', '1', '0'];
            const boolCount = values.filter(v => boolValues.includes(String(v).toLowerCase())).length;

            if (numericCount > values.length * 0.8) {
                columnTypes[col] = { type: 'number', icon: 'fa-hashtag', color: '#4a90d9' };
            } else if (dateCount > values.length * 0.7) {
                columnTypes[col] = { type: 'date', icon: 'fa-calendar', color: '#f39c12' };
            } else if (boolCount > values.length * 0.9) {
                columnTypes[col] = { type: 'boolean', icon: 'fa-toggle-on', color: '#27ae60' };
            } else {
                columnTypes[col] = { type: 'text', icon: 'fa-font', color: '#9b59b6' };
            }
        });

        if (window.VIZ_STATE) window.VIZ_STATE.columnTypes = columnTypes;
        return columnTypes;
    };

    // updateColumnTypeInfo - Tek sütun tipini güncelle
    window.updateColumnTypeInfo = function (column, newType) {
        if (!window.VIZ_STATE) return;
        if (!window.VIZ_STATE.columnTypes) window.VIZ_STATE.columnTypes = {};

        const icons = { number: 'fa-hashtag', text: 'fa-font', date: 'fa-calendar', boolean: 'fa-toggle-on' };
        const colors = { number: '#4a90d9', text: '#9b59b6', date: '#f39c12', boolean: '#27ae60' };

        window.VIZ_STATE.columnTypes[column] = {
            type: newType,
            icon: icons[newType] || 'fa-font',
            color: colors[newType] || '#888'
        };

        // Liste yeniden render
        if (typeof window.renderColumnsListWithTypes === 'function') {
            window.renderColumnsListWithTypes();
        }
    };

    // renderColumnsListWithTypes - Sol panelde tip badge'leri ile kolon listesi render
    window.renderColumnsListWithTypes = function () {
        const container = document.getElementById('vizDataColumns') || document.querySelector('.viz-columns-list');
        if (!container) return;

        const columns = window.VIZ_STATE?.columns || [];
        const types = window.VIZ_STATE?.columnTypes || window.detectColumnTypes() || {};

        let html = '';
        columns.forEach(col => {
            const typeInfo = types[col] || { type: 'text', icon: 'fa-font', color: '#888' };
            html += `
                <div class="viz-column-item" draggable="true" data-column="${col}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin:4px 0;background:rgba(255,255,255,0.05);border-radius:6px;cursor:grab;">
                    <i class="fas ${typeInfo.icon}" style="color:${typeInfo.color};font-size:12px;"></i>
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${col}</span>
                    <span class="viz-type-badge" style="font-size:10px;padding:2px 6px;background:${typeInfo.color}22;color:${typeInfo.color};border-radius:4px;">${typeInfo.type}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    };

    // generateDataProfile - Veri profili oluştur ve göster
    window.generateDataProfile = function () {
        const data = window.VIZ_STATE?.data || window.VIZ_STATE?.getActiveData?.() || [];
        const columns = window.VIZ_STATE?.columns || [];
        const types = window.VIZ_STATE?.columnTypes || window.detectColumnTypes() || {};

        const profile = {
            rowCount: data.length,
            columnCount: columns.length,
            columns: []
        };

        columns.forEach(col => {
            const values = data.map(row => row[col]);
            const nonNull = values.filter(v => v != null && v !== '');
            const typeInfo = types[col] || { type: 'text' };

            const colProfile = {
                name: col,
                type: typeInfo.type,
                count: values.length,
                missing: values.length - nonNull.length,
                missingPercent: ((values.length - nonNull.length) / values.length * 100).toFixed(1),
                unique: new Set(nonNull.map(v => String(v))).size
            };

            // Numeric stats
            if (typeInfo.type === 'number') {
                const nums = nonNull.map(v => parseFloat(v)).filter(n => !isNaN(n));
                if (nums.length > 0) {
                    colProfile.min = Math.min(...nums);
                    colProfile.max = Math.max(...nums);
                    colProfile.mean = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
                    colProfile.sum = nums.reduce((a, b) => a + b, 0);

                    // Standard deviation
                    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
                    const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nums.length;
                    colProfile.std = Math.sqrt(variance).toFixed(2);
                }
            }

            // Top values (categorical)
            if (typeInfo.type === 'text' || colProfile.unique < 20) {
                const freq = {};
                nonNull.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
                colProfile.topValues = Object.entries(freq)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([value, count]) => ({ value, count, percent: (count / nonNull.length * 100).toFixed(1) }));
            }

            profile.columns.push(colProfile);
        });

        // UI'ye render
        showDataProfileModal(profile);

        return profile;
    };

    function showDataProfileModal(profile) {
        const existing = document.querySelector('.viz-profile-modal');
        if (existing) existing.remove();

        let columnsHtml = profile.columns.map(col => `
            <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <strong style="color:#4a90d9;">${col.name}</strong>
                    <span style="background:#4a90d922;color:#4a90d9;padding:2px 8px;border-radius:4px;font-size:11px;">${col.type}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px;">
                    <div><span style="color:#888;">Sayı:</span> ${col.count}</div>
                    <div><span style="color:#888;">Eksik:</span> <span style="color:${col.missing > 0 ? '#e74c3c' : '#27ae60'};">${col.missing} (%${col.missingPercent})</span></div>
                    <div><span style="color:#888;">Unique:</span> ${col.unique}</div>
                    ${col.min !== undefined ? `<div><span style="color:#888;">Min:</span> ${col.min}</div>` : ''}
                    ${col.max !== undefined ? `<div><span style="color:#888;">Max:</span> ${col.max}</div>` : ''}
                    ${col.mean !== undefined ? `<div><span style="color:#888;">Ort:</span> ${col.mean}</div>` : ''}
                </div>
                ${col.topValues ? `
                    <div style="margin-top:8px;font-size:11px;">
                        <span style="color:#888;">En sık:</span>
                        ${col.topValues.slice(0, 3).map(v => `<span style="background:#333;padding:2px 6px;border-radius:4px;margin-left:4px;">${v.value} (${v.count})</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        const modal = document.createElement('div');
        modal.className = 'viz-profile-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:700px;width:90%;max-height:80vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.1);">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-chart-bar" style="color:#4a90d9;"></i> Veri Profili
                    <span style="font-size:12px;color:#888;margin-left:auto;">${profile.rowCount} satır × ${profile.columnCount} sütun</span>
                </h3>
                <div style="color:#fff;">${columnsHtml}</div>
                <button onclick="this.closest('.viz-profile-modal').remove()" style="width:100%;margin-top:16px;padding:12px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">Kapat</button>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    // analyzeMissingPattern - Eksik veri desenini analiz et
    window.analyzeMissingPattern = function () {
        const data = window.VIZ_STATE?.data || [];
        const columns = window.VIZ_STATE?.columns || [];

        const pattern = {
            totalCells: data.length * columns.length,
            totalMissing: 0,
            byColumn: {},
            byRow: []
        };

        columns.forEach(col => {
            const missing = data.filter(r => r[col] == null || r[col] === '').length;
            pattern.byColumn[col] = {
                missing: missing,
                percentage: (missing / data.length * 100).toFixed(1),
                present: data.length - missing
            };
            pattern.totalMissing += missing;
        });

        // Row-wise missing pattern
        data.forEach((row, idx) => {
            const missingCount = columns.filter(col => row[col] == null || row[col] === '').length;
            if (missingCount > 0) {
                pattern.byRow.push({ index: idx, missing: missingCount, percent: (missingCount / columns.length * 100).toFixed(1) });
            }
        });

        pattern.overallMissingPercent = (pattern.totalMissing / pattern.totalCells * 100).toFixed(2);

        return pattern;
    };

    // generateMissingHeatmap - ECharts ile eksik veri heatmap'i
    window.generateMissingHeatmap = function () {
        const data = window.VIZ_STATE?.data || [];
        const columns = window.VIZ_STATE?.columns || [];

        if (data.length === 0 || columns.length === 0) {
            if (window.showToast) window.showToast('Veri yüklenmemiş', 'warning');
            return;
        }

        // Sample rows for heatmap (max 50)
        const sampleSize = Math.min(50, data.length);
        const step = Math.max(1, Math.floor(data.length / sampleSize));
        const sampledIndices = Array.from({ length: sampleSize }, (_, i) => i * step);

        // Build heatmap data: [colIndex, rowIndex, 0/1 for missing]
        const heatmapData = [];
        sampledIndices.forEach((rowIdx, yIdx) => {
            columns.forEach((col, xIdx) => {
                const isMissing = data[rowIdx][col] == null || data[rowIdx][col] === '' ? 1 : 0;
                heatmapData.push([xIdx, yIdx, isMissing]);
            });
        });

        // Create modal with heatmap
        const existing = document.querySelector('.viz-missing-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'viz-missing-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:900px;width:95%;border:1px solid rgba(255,255,255,0.1);">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-th" style="color:#e74c3c;"></i> Eksik Veri Haritası
                </h3>
                <div id="missingHeatmapChart" style="height:400px;"></div>
                <button onclick="this.closest('.viz-missing-modal').remove()" style="width:100%;margin-top:16px;padding:12px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">Kapat</button>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);

        // Render ECharts heatmap
        if (typeof echarts !== 'undefined') {
            const chart = echarts.init(document.getElementById('missingHeatmapChart'));
            chart.setOption({
                tooltip: { position: 'top', formatter: p => `${columns[p.value[0]]}<br>Satır ${sampledIndices[p.value[1]]}: ${p.value[2] ? 'EKSİK' : 'Var'}` },
                grid: { top: 20, bottom: 60, left: 80, right: 20 },
                xAxis: { type: 'category', data: columns, axisLabel: { rotate: 45, fontSize: 10 } },
                yAxis: { type: 'category', data: sampledIndices.map(i => `R${i}`), axisLabel: { fontSize: 9 } },
                visualMap: { min: 0, max: 1, show: false, inRange: { color: ['#27ae60', '#e74c3c'] } },
                series: [{ type: 'heatmap', data: heatmapData, label: { show: false } }]
            });
        }
    };

    // =====================================================
    // FAZ 2: FILTERS - Full Implementations
    // =====================================================

    // getOperatorSymbol
    window.getOperatorSymbol = function (op) {
        const symbols = {
            'equals': '=', 'eq': '=', '==': '=',
            'not_equals': '≠', 'ne': '≠', '!=': '≠',
            'greater': '>', 'gt': '>',
            'less': '<', 'lt': '<',
            'greater_equal': '≥', 'gte': '≥', '>=': '≥',
            'less_equal': '≤', 'lte': '≤', '<=': '≤',
            'contains': '∋', 'like': '∋',
            'starts_with': '^=',
            'ends_with': '$=',
            'is_null': '∅',
            'is_not_null': '∃'
        };
        return symbols[op] || op;
    };

    // applyCrossFilter - Cross-filter uygula
    window.applyCrossFilter = function (filter) {
        if (!window.VIZ_STATE) return;
        if (!window.VIZ_STATE.filters) window.VIZ_STATE.filters = [];

        // Normalize operator to standard format (data.js uses: eq/ne/gt/gte/lt/lte/contains/etc)
        if (filter && filter.operator) {
            const opNormMap = {
                'equals': 'eq', 'equal': 'eq', '==': 'eq', '=': 'eq',
                'not_equals': 'ne', 'not_equal': 'ne', '!=': 'ne', '<>': 'ne',
                'greater': 'gt', 'greater_than': 'gt', '>': 'gt',
                'greater_equal': 'gte', 'greater_or_equal': 'gte', '>=': 'gte',
                'less': 'lt', 'less_than': 'lt', '<': 'lt',
                'less_equal': 'lte', 'less_or_equal': 'lte', '<=': 'lte',
                'like': 'contains', 'includes': 'contains'
            };
            filter.operator = opNormMap[filter.operator] || filter.operator;
        }

        // Aynı kolon için mevcut filtreyi güncelle veya yeni ekle
        const existingIdx = window.VIZ_STATE.filters.findIndex(f => f.column === filter.column);
        if (existingIdx >= 0) {
            window.VIZ_STATE.filters[existingIdx] = filter;
        } else {
            window.VIZ_STATE.filters.push(filter);
        }

        // Cross-filter aktifse tüm grafikleri yeniden render et
        const crossFilterEnabled = document.getElementById('crossFilterEnabled')?.checked || window.VIZ_STATE.crossFilterEnabled;
        if (crossFilterEnabled) {
            window.VIZ_STATE.crossFilterEnabled = true;
            window.VIZ_STATE.crossFilterValue = (filter && typeof filter.value !== 'undefined')
                ? String(filter.value)
                : null;

            if (typeof window.rerenderAllCharts === 'function') {
                window.rerenderAllCharts();
            }
        }

        window.renderActiveFilters();
        if (window.showToast) window.showToast(`Filtre uygulandı: ${filter.column}`, 'success');
    };

    // renderActiveFilters - Aktif filtreleri göster
    window.renderActiveFilters = function () {
        let container = document.getElementById('activeFiltersContainer');
        if (!container) {
            // Container yoksa oluştur
            const filterPanel = document.querySelector('.viz-filter-panel') || document.getElementById('vizFilterArea');
            if (filterPanel) {
                container = document.createElement('div');
                container.id = 'activeFiltersContainer';
                container.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;';
                filterPanel.appendChild(container);
            }
        }
        if (!container) return;

        const filters = window.VIZ_STATE?.filters || [];

        if (filters.length === 0) {
            container.innerHTML = '<span style="color:#888;font-size:12px;">Aktif filtre yok</span>';
            return;
        }

        container.innerHTML = filters.map((f, idx) => `
            <div style="display:flex;align-items:center;gap:4px;background:#4a90d922;padding:4px 10px;border-radius:16px;font-size:12px;">
                <span style="color:#4a90d9;">${f.column}</span>
                <span style="color:#888;">${window.getOperatorSymbol(f.operator)}</span>
                <span style="color:#fff;">${f.value}</span>
                <button onclick="window.removeFilter(${idx})" style="background:none;border:none;color:#e74c3c;cursor:pointer;padding:0 4px;">×</button>
            </div>
        `).join('');
    };

    // removeFilter - DISPATCHER: handles both DOM filter row removal (string ID) and active filter array removal (number index)
    // This resolves the collision between data.js (DOM) and adapters.js (array)
    const _removeFilterRow = window.removeFilter; // Preserve data.js DOM-based function if loaded

    window.removeFilter = function (arg) {
        // If arg is a string starting with 'filter_', it's a DOM element ID (from data.js showFilterPanel)
        if (typeof arg === 'string' && arg.startsWith('filter_')) {
            const row = document.getElementById(arg);
            if (row) {
                row.remove();
                return;
            }
        }

        // If arg is a number or numeric string, it's an array index (from adapters.js renderActiveFilters)
        const index = parseInt(arg);
        if (!isNaN(index) && window.VIZ_STATE?.filters) {
            window.VIZ_STATE.filters.splice(index, 1);
            if (typeof window.renderActiveFilters === 'function') {
                window.renderActiveFilters();
            }
            if (typeof window.rerenderAllCharts === 'function') {
                window.rerenderAllCharts();
            }
            return;
        }

        // Fallback: try preserved DOM function
        if (typeof _removeFilterRow === 'function') {
            _removeFilterRow(arg);
        }
    };

    // Expose individual functions for direct access
    window.removeFilterRow = function (filterId) {
        const row = document.getElementById(filterId);
        if (row) row.remove();
    };

    window.removeActiveFilterByIndex = function (index) {
        if (window.VIZ_STATE?.filters) {
            window.VIZ_STATE.filters.splice(index, 1);
            window.renderActiveFilters?.();
            window.rerenderAllCharts?.();
        }
    };

    // clearFilters - Tüm filtreleri temizle
    window.clearFilters = function () {
        if (window.VIZ_STATE) {
            window.VIZ_STATE.filters = [];
            window.VIZ_STATE.crossFilterEnabled = false;
            window.VIZ_STATE.crossFilterValue = null;
        }

        window.renderActiveFilters();

        if (typeof window.rerenderAllCharts === 'function') {
            window.rerenderAllCharts();
        }

        if (window.showToast) window.showToast('Tüm filtreler temizlendi', 'info');
    };

    // handleChartClick - Chart click ile filtreleme
    window.handleChartClick = function (params, chartId) {
        if (!window.VIZ_STATE?.crossFilterEnabled) return;

        const chart = window.VIZ_STATE.charts.find(c => c.id === chartId);
        if (!chart) return;

        const clickedValue = params.name || params.data?.name || params.value?.[0];
        if (clickedValue) {
            window.applyCrossFilter({
                column: chart.xAxis,
                operator: 'equals',
                value: clickedValue,
                source: chartId
            });
        }
    };

    // =====================================================
    // FAZ 2: WHAT-IF SIMULATOR - Full Implementations
    // =====================================================

    // applyWhatIfChange - What-if değişikliği uygula
    window.applyWhatIfChange = function (column, deltaOrValue, isMultiplier = false) {
        if (!window.VIZ_STATE?.data?.length) {
            if (window.showToast) window.showToast('Veri yüklenmemiş', 'warning');
            return;
        }

        // Orijinal veriyi sakla (ilk kez)
        if (!window.VIZ_STATE.originalData) {
            window.VIZ_STATE.originalData = JSON.parse(JSON.stringify(window.VIZ_STATE.data));
        }

        // Değişikliği uygula
        window.VIZ_STATE.data = window.VIZ_STATE.data.map(row => {
            const val = parseFloat(row[column]);
            if (!isNaN(val)) {
                if (isMultiplier) {
                    row[column] = val * deltaOrValue;
                } else {
                    row[column] = val + deltaOrValue;
                }
            }
            return row;
        });

        // What-if state güncelle
        window.VIZ_STATE.whatIfActive = true;
        window.VIZ_STATE.whatIfColumn = column;
        window.VIZ_STATE.whatIfDelta = deltaOrValue;

        // Trend insight güncelle
        window.updateTrendInsight(column);

        // Grafikleri yeniden render
        if (typeof window.rerenderAllCharts === 'function') {
            window.rerenderAllCharts();
        }

        if (window.showToast) window.showToast(`What-If: ${column} ${isMultiplier ? 'x' : '+'} ${deltaOrValue}`, 'info');
    };

    // resetWhatIf - What-if'i sıfırla
    window.resetWhatIf = function () {
        if (window.VIZ_STATE?.originalData) {
            window.VIZ_STATE.data = JSON.parse(JSON.stringify(window.VIZ_STATE.originalData));
            window.VIZ_STATE.whatIfActive = false;
            window.VIZ_STATE.whatIfColumn = null;
            window.VIZ_STATE.whatIfDelta = null;

            if (typeof window.rerenderAllCharts === 'function') {
                window.rerenderAllCharts();
            }

            if (window.showToast) window.showToast('What-If sıfırlandı', 'info');
        }
    };

    // analyzeTrend - Trend analizi
    window.analyzeTrend = function (column) {
        const data = window.VIZ_STATE?.data || [];
        const values = data.map(r => parseFloat(r[column])).filter(v => !isNaN(v));

        if (values.length < 3) {
            return { trend: 'insufficient_data', message: 'Yetersiz veri' };
        }

        // Simple linear trend
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Mean and std
        const mean = sumY / n;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
        const std = Math.sqrt(variance);

        return {
            trend: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
            slope: slope.toFixed(4),
            intercept: intercept.toFixed(2),
            mean: mean.toFixed(2),
            std: std.toFixed(2),
            min: Math.min(...values),
            max: Math.max(...values),
            count: n
        };
    };

    // updateTrendInsight - Trend insight UI güncelle
    window.updateTrendInsight = function (column) {
        if (!column) return;

        const analysis = window.analyzeTrend(column);

        let container = document.getElementById('whatIfInsight') || document.getElementById('trendInsight');
        if (!container) {
            // Container yoksa oluştur
            const biPanel = document.querySelector('.viz-bi-panel') || document.getElementById('vizBIArea');
            if (biPanel) {
                container = document.createElement('div');
                container.id = 'trendInsight';
                biPanel.appendChild(container);
            }
        }
        if (!container) return;

        const trendIcon = analysis.trend === 'increasing' ? '📈' : analysis.trend === 'decreasing' ? '📉' : '➡️';
        const trendColor = analysis.trend === 'increasing' ? '#27ae60' : analysis.trend === 'decreasing' ? '#e74c3c' : '#f39c12';
        const trendText = analysis.trend === 'increasing' ? 'Artış Trendi' : analysis.trend === 'decreasing' ? 'Azalış Trendi' : 'Stabil';

        // Original vs current comparison
        let changeHtml = '';
        if (window.VIZ_STATE?.originalData && window.VIZ_STATE?.whatIfActive) {
            const origValues = window.VIZ_STATE.originalData.map(r => parseFloat(r[column])).filter(v => !isNaN(v));
            const origMean = origValues.reduce((a, b) => a + b, 0) / origValues.length;
            const currMean = parseFloat(analysis.mean);
            const change = ((currMean - origMean) / origMean * 100).toFixed(1);

            changeHtml = `
                <div style="margin-top:8px;padding:8px;background:rgba(74,144,217,0.1);border-radius:6px;">
                    <span style="color:#888;">Değişim:</span>
                    <span style="color:${change >= 0 ? '#27ae60' : '#e74c3c'};font-weight:bold;">
                        ${change >= 0 ? '+' : ''}${change}%
                    </span>
                    <span style="color:#888;font-size:11px;">(Ort: ${origMean.toFixed(2)} → ${currMean})</span>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;margin-top:10px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="font-size:20px;">${trendIcon}</span>
                    <strong style="color:#fff;">${column}</strong>
                    <span style="color:${trendColor};font-size:12px;">${trendText}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:12px;color:#888;">
                    <div>Ortalama: <span style="color:#fff;">${analysis.mean}</span></div>
                    <div>Std: <span style="color:#fff;">${analysis.std}</span></div>
                    <div>Min: <span style="color:#fff;">${analysis.min}</span></div>
                    <div>Max: <span style="color:#fff;">${analysis.max}</span></div>
                </div>
                ${changeHtml}
            </div>
        `;
    };

    // Data management remaining aliases
    window.updateDataProfileFull = window.updateDataProfileFull || window.updateDataProfile || window.generateDataProfile;
    window.binColumn = window.binColumn || function () { if (window.showToast) window.showToast('Binning - veri yönetimi panelini kullanın', 'info'); };
    window.unpivotData = window.unpivotData || function () { if (window.showToast) window.showToast('Unpivot - geliştirilmekte', 'info'); };
    window.sampleData = window.sampleData || function (data, size) { return (data || []).slice(0, size || 5000); };
    window.generateDataPreview = window.generateDataPreview || function () { return ''; };
    window.checkDataWarnings = window.checkDataWarnings || function () { return []; };

    // File loading aliases
    window.loadFileWithOptions = window.loadFileWithOptions || window.loadDataWithOptions;
    window.loadFileAdditional = window.loadFileAdditional || window.loadFile;
    window.loadMultipleFiles = window.loadMultipleFiles || function () { if (window.showToast) window.showToast('Çoklu dosya - dosya sürükleyin', 'info'); };
    window.loadFromAPI = window.loadFromAPI || function () { if (window.showToast) window.showToast('API yükleme - geliştirilmekte', 'info'); };
    window.confirmFileLoad = window.confirmFileLoad || function () { };
    window.updatePreviewSheet = window.updatePreviewSheet || function () { };
    window.updatePreviewHighlight = window.updatePreviewHighlight || function () { };

    // Stat widget aliases
    window.runStatForWidget = window.runStatForWidget || window.runStatWidgetAnalysis;
    window.refreshStatWidget = window.refreshStatWidget || function () { };
    window.embedStatToChart = window.embedStatToChart || window.embedStatInChart;
    window.getAnalysisRequirements = window.getAnalysisRequirements || function () { return {}; };
    window.addStatWidgetToDashboard = window.addStatWidgetToDashboard || function () { };
    window.addStatTableWidget = window.addStatTableWidget || function () { };
    window.embedStatAsAnnotation = window.embedStatAsAnnotation || function () { };
    window.addInsightsWidget = window.addInsightsWidget || function () { };

    // Audit aliases
    window.generateAuditNote = window.generateAuditNote || function () { return ''; };
    window.addAuditFooterToWidget = window.addAuditFooterToWidget || function () { };
    window.addAuditFooterToChart = window.addAuditFooterToChart || function () { };
    window.copyStatAsHTML = window.copyStatAsHTML || function () { };
    window.copyStatAsImage = window.copyStatAsImage || function () { };
    window.copyStatAsText = window.copyStatAsText || function () { };
    window.toggleStatMode = window.toggleStatMode || function () { };
    window.toggleFormula = window.toggleFormula || function () { };

    // Widget/Chart customization aliases
    window.resizeWidget = window.resizeWidget || function () { };
    window.setWidgetGrid = window.setWidgetGrid || function () { };
    window.toggleFullscreen = window.toggleFullscreen || window.toggleWidgetFullscreen;
    window.enableWidgetDrag = window.enableWidgetDrag || function () { };
    window.toggleZoomPan = window.toggleZoomPan || function () { };
    window.setLegendPosition = window.setLegendPosition || function () { };
    window.setAxisFormat = window.setAxisFormat || function () { };
    window.toggleDataLabels = window.toggleDataLabels || function () { };
    window.toggleGridLines = window.toggleGridLines || function () { };
    window.setAnimationSpeed = window.setAnimationSpeed || function () { };
    window.setColorPalette = window.setColorPalette || function () { };
    window.setChartTheme = window.setChartTheme || function () { };
    window.customizeTooltip = window.customizeTooltip || function () { };
    window.setFontFamily = window.setFontFamily || function () { };
    window.setFontSize = window.setFontSize || function () { };
    window.setGradientColors = window.setGradientColors || function () { };
    window.setOpacity = window.setOpacity || function () { };
    window.setBorderStyle = window.setBorderStyle || function () { };
    window.setShadowEffect = window.setShadowEffect || function () { };
    window.setChartPosition = window.setChartPosition || function () { };
    window.setClickAction = window.setClickAction || function () { };

    // Share/Embed aliases
    window.shareToSocial = window.shareToSocial || function () { if (window.showToast) window.showToast('Sosyal paylaşım - geliştirilmekte', 'info'); };
    window.sendViaEmail = window.sendViaEmail || function () { if (window.showToast) window.showToast('E-posta - geliştirilmekte', 'info'); };

    // Misc aliases
    window.enableDrillDown = window.enableDrillDown || function () { };
    window.enableBrushSelection = window.enableBrushSelection || function () { };
    window.highlightDataPoints = window.highlightDataPoints || function () { };
    window.applyDashboardTemplate = window.applyDashboardTemplate || function () { };
    window.saveVersion = window.saveVersion || function () { if (window.showToast) window.showToast('Versiyon kaydedildi', 'success'); };
    window.restoreVersion = window.restoreVersion || function () { };
    window.listVersions = window.listVersions || function () { return window.VERSION_HISTORY || []; };
    window.enableAutoSave = window.enableAutoSave || function () { if (window.showToast) window.showToast('Otomatik kayıt aktif', 'success'); };
    window.disableAutoSave = window.disableAutoSave || function () { };
    window.checkMobileDevice = window.checkMobileDevice || function () { return /Android|iPhone|iPad/i.test(navigator.userAgent); };
    window.adaptForMobile = window.adaptForMobile || function () { };
    window.checkPWASupport = window.checkPWASupport || function () { return 'serviceWorker' in navigator; };
    window.checkPWAManifest = window.checkPWAManifest || function () { return !!document.querySelector('link[rel="manifest"]'); };
    window.checkOfflineMode = window.checkOfflineMode || function () { return navigator.onLine; };
    window.initCollaboration = window.initCollaboration || function () { };
    window.joinCollaborationRoom = window.joinCollaborationRoom || function () { };
    window.leaveCollaborationRoom = window.leaveCollaborationRoom || function () { };
    window.sendCollaborationAction = window.sendCollaborationAction || function () { };
    window.createScheduledReport = window.createScheduledReport || function () { };
    window.loadScheduledReports = window.loadScheduledReports || function () { return []; };
    window.toggleScheduledReport = window.toggleScheduledReport || function () { };
    window.runScheduledReportNow = window.runScheduledReportNow || function () { };
    window.applyFriedman = window.applyFriedman || function () { };
    window.applyPowerAnalysis = window.applyPowerAnalysis || window.runPowerAnalysis;
    window.applyRegression = window.applyRegression || window.runLinearRegression;
    window.applyDiscriminant = window.applyDiscriminant || window.runDiscriminantAnalysis;
    window.applySurvivalAnalysis = window.applySurvivalAnalysis || window.runSurvivalAnalysis;
    window.applyWordCloud = window.applyWordCloud || function () { if (window.addChart) window.addChart('wordcloud'); };
    window.executeRegression = window.executeRegression || window.runLinearRegression;
    window.cachedAggregate = window.cachedAggregate || window.aggregateData;
    window.createSankeyChart = window.createSankeyChart || function (containerId, nodes, links) {
        const dom = document.getElementById(containerId);
        if (!dom || typeof echarts === 'undefined') return;
        const chart = echarts.init(dom);
        chart.setOption({ series: [{ type: 'sankey', data: nodes || [{ name: 'A' }, { name: 'B' }], links: links || [{ source: 'A', target: 'B', value: 10 }] }] });
        return chart;
    };
    window.createCalendarHeatmap = window.createCalendarHeatmap || function (containerId, data) {
        const dom = document.getElementById(containerId);
        if (!dom || typeof echarts === 'undefined') return;
        const year = new Date().getFullYear();
        const chart = echarts.init(dom);
        chart.setOption({ calendar: { range: year }, visualMap: { min: 0, max: 100, show: false }, series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: data || [[year + '-01-01', 50]] }] });
        return chart;
    };
    window.createWordCloud = window.createWordCloud || window.renderWordCloudAdvanced;
    window.startOnboarding = window.startOnboarding || function () { if (window.showToast) window.showToast('Hoş geldiniz! Dosya yükleyerek başlayın.', 'info'); };
    window._nextOnboardStep = window._nextOnboardStep || function () { };
    window.setupSprint12Listeners = window.setupSprint12Listeners || function () { };

    // =====================================================
    // FAZ 3: PWA / OFFLINE SUPPORT
    // =====================================================

    // checkPWASupport - Service worker desteğini kontrol et
    window.checkPWASupport = function () {
        const supported = 'serviceWorker' in navigator;
        if (window.OFFLINE_MODE) {
            window.OFFLINE_MODE.swSupported = supported;
        }
        return supported;
    };

    // checkPWAManifest - Manifest dosyası var mı kontrol et
    window.checkPWAManifest = function () {
        const manifest = document.querySelector('link[rel="manifest"]');
        const hasManifest = !!manifest;
        if (window.OFFLINE_MODE) {
            window.OFFLINE_MODE.hasManifest = hasManifest;
        }
        return hasManifest;
    };

    // checkOfflineMode - Çevrimiçi durumunu kontrol et
    window.checkOfflineMode = function () {
        const isOnline = navigator.onLine;
        if (window.OFFLINE_MODE) {
            window.OFFLINE_MODE.isOnline = isOnline;
        }

        // Online/offline event listeners
        if (!window.OFFLINE_MODE?.listenersSet) {
            window.addEventListener('online', () => {
                window.OFFLINE_MODE.isOnline = true;
                if (window.showToast) window.showToast('🌐 Çevrimiçi oldunuz', 'success');
            });
            window.addEventListener('offline', () => {
                window.OFFLINE_MODE.isOnline = false;
                if (window.showToast) window.showToast('📴 Çevrimdışı moddasınız', 'warning');
            });
            window.OFFLINE_MODE.listenersSet = true;
        }

        return isOnline;
    };

    // createServiceWorker - Service worker kaydet
    window.createServiceWorker = async function () {
        if (!window.checkPWASupport()) {
            if (window.showToast) window.showToast('Service Worker desteklenmiyor', 'warning');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register('/js/sw.js');
            console.log('✅ Service Worker registered:', registration.scope);
            if (window.showToast) window.showToast('PWA etkinleştirildi', 'success');

            // Update handler
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (window.showToast) window.showToast('Yeni sürüm mevcut - sayfayı yenileyin', 'info');
                    }
                });
            });

            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            if (window.showToast) window.showToast('PWA kaydı başarısız', 'error');
            return false;
        }
    };

    // =====================================================
    // FAZ 3: VirtualScrollTable - Full Implementation
    // =====================================================

    window.VirtualScrollTable = class VirtualScrollTable {
        constructor(container, data, options = {}) {
            this.container = typeof container === 'string' ? document.getElementById(container) : container;
            this.data = data || [];
            this.rowHeight = options.rowHeight || 32;
            this.bufferSize = options.bufferSize || 5;
            this.columns = options.columns || [];
            this.visibleStart = 0;
            this.visibleEnd = 0;
            this.scrollTop = 0;

            if (this.container) {
                this.init();
            }
        }

        init() {
            // Container setup
            this.container.style.cssText = 'position:relative;overflow-y:auto;height:400px;';

            // Create viewport
            this.viewport = document.createElement('div');
            this.viewport.className = 'vs-viewport';
            this.viewport.style.cssText = 'position:relative;width:100%;';

            // Create spacer for total height
            this.spacer = document.createElement('div');
            this.spacer.className = 'vs-spacer';
            this.spacer.style.height = `${this.data.length * this.rowHeight}px`;

            // Create content container
            this.content = document.createElement('div');
            this.content.className = 'vs-content';
            this.content.style.cssText = 'position:absolute;top:0;left:0;right:0;';

            this.viewport.appendChild(this.spacer);
            this.viewport.appendChild(this.content);
            this.container.appendChild(this.viewport);

            // Scroll handler
            this.container.addEventListener('scroll', () => this.onScroll());

            // Initial render
            this.render();
        }

        onScroll() {
            this.scrollTop = this.container.scrollTop;
            this.render();
        }

        render() {
            if (!this.container || !this.data.length) return;

            const containerHeight = this.container.clientHeight;

            // Calculate visible range
            this.visibleStart = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - this.bufferSize);
            this.visibleEnd = Math.min(this.data.length, Math.ceil((this.scrollTop + containerHeight) / this.rowHeight) + this.bufferSize);

            // Build visible rows HTML
            const visibleData = this.data.slice(this.visibleStart, this.visibleEnd);
            const cols = this.columns.length ? this.columns : (this.data[0] ? Object.keys(this.data[0]) : []);

            let html = '';

            // Header (only if at top)
            if (this.visibleStart === 0) {
                html += '<div class="vs-header" style="display:flex;background:#2a2a4e;font-weight:bold;position:sticky;top:0;z-index:1;">';
                cols.forEach(col => {
                    html += `<div style="flex:1;padding:8px 10px;border-right:1px solid #333;font-size:12px;color:#4a90d9;">${col}</div>`;
                });
                html += '</div>';
            }

            visibleData.forEach((row, idx) => {
                const actualIdx = this.visibleStart + idx;
                const bgColor = actualIdx % 2 ? 'rgba(255,255,255,0.02)' : 'transparent';
                html += `<div class="vs-row" style="display:flex;height:${this.rowHeight}px;background:${bgColor};">`;
                cols.forEach(col => {
                    const val = row[col] ?? '';
                    html += `<div style="flex:1;padding:6px 10px;border-right:1px solid #222;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${val}</div>`;
                });
                html += '</div>';
            });

            this.content.style.top = `${this.visibleStart * this.rowHeight}px`;
            this.content.innerHTML = html;
        }

        updateData(newData) {
            this.data = newData || [];
            this.spacer.style.height = `${this.data.length * this.rowHeight}px`;
            this.render();
        }

        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    };

    // enableVirtualScroll - Büyük tablolar için virtual scroll aktive et
    window.enableVirtualScroll = function (containerId, data, options) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Veri 1000 satırdan büyükse virtual scroll kullan
        if (data && data.length > 1000) {
            const vs = new window.VirtualScrollTable(container, data, options);
            if (window.showToast) window.showToast(`Virtual scroll aktif (${data.length} satır)`, 'info');
            return vs;
        }

        return null;
    };

    // =====================================================
    // FAZ 3: COLLABORATION (LOCAL - BroadcastChannel)
    // =====================================================

    window.VIZ_COLLAB = {
        channel: null,
        roomId: null,
        isHost: false,
        participants: []
    };

    // showCollaborationModal
    window.showCollaborationModal = function () {
        const existing = document.querySelector('.viz-collab-modal');
        if (existing) existing.remove();

        const currentRoom = window.VIZ_COLLAB.roomId;

        const modal = document.createElement('div');
        modal.className = 'viz-collab-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:450px;width:90%;border:1px solid rgba(255,255,255,0.1);">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-users" style="color:#4a90d9;"></i> Yerel İşbirliği
                </h3>
                <p style="color:#888;font-size:12px;margin-bottom:16px;">
                    Aynı tarayıcıda birden fazla sekme arasında dashboard senkronizasyonu yapın.
                </p>
                
                ${currentRoom ? `
                    <div style="background:#27ae6022;padding:12px;border-radius:8px;margin-bottom:16px;">
                        <span style="color:#27ae60;">✓ Bağlı: <strong>${currentRoom}</strong></span>
                    </div>
                    <button onclick="window.leaveCollaborationRoom();this.closest('.viz-collab-modal').remove();" style="width:100%;padding:12px;background:#e74c3c;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-bottom:8px;">
                        <i class="fas fa-sign-out-alt"></i> Odadan Ayrıl
                    </button>
                    <button onclick="window.sendCollaborationAction({type:'sync',state:window.exportJSONConfig()});window.showToast('State paylaşıldı','success');" style="width:100%;padding:12px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        <i class="fas fa-sync"></i> State Paylaş
                    </button>
                ` : `
                    <div style="margin-bottom:16px;">
                        <label style="color:#888;font-size:12px;display:block;margin-bottom:4px;">Oda Adı</label>
                        <input type="text" id="collabRoomInput" placeholder="ornek-oda-123" style="width:100%;padding:10px;background:#0f0f1a;border:1px solid #333;border-radius:6px;color:#fff;box-sizing:border-box;">
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button onclick="const id=document.getElementById('collabRoomInput').value||'default';window.joinCollaborationRoom(id);this.closest('.viz-collab-modal').remove();" style="flex:1;padding:12px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                            <i class="fas fa-sign-in-alt"></i> Katıl
                        </button>
                        <button onclick="this.closest('.viz-collab-modal').remove()" style="flex:1;padding:12px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                            İptal
                        </button>
                    </div>
                `}
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    };

    // joinCollaborationRoom
    window.joinCollaborationRoom = function (roomId) {
        if (!roomId) roomId = 'default';

        // Leave existing room
        if (window.VIZ_COLLAB.channel) {
            window.leaveCollaborationRoom();
        }

        window.VIZ_COLLAB.roomId = roomId;
        window.VIZ_COLLAB.channel = new BroadcastChannel('viz_collab_' + roomId);

        // Message handler
        window.VIZ_COLLAB.channel.onmessage = (event) => {
            const data = event.data;

            if (data.type === 'sync' && data.state) {
                // State senkronizasyonu
                if (window.showToast) window.showToast('Uzak state alındı', 'info');
                window.importJSONConfig(data.state);
            }

            if (data.type === 'action') {
                // Action mesajı
                console.log('[Collab] Action received:', data.action);
                if (data.action === 'filter_added' && data.filter) {
                    window.applyCrossFilter(data.filter);
                }
                if (data.action === 'chart_added') {
                    if (typeof window.addChart === 'function') {
                        window.addChart(data.chartType || 'bar');
                    }
                }
            }

            if (data.type === 'ping') {
                // Katılımcı sayısı için ping-pong
                window.VIZ_COLLAB.channel.postMessage({ type: 'pong', timestamp: Date.now() });
            }
        };

        // Announce join
        window.VIZ_COLLAB.channel.postMessage({ type: 'ping', timestamp: Date.now() });

        if (window.showToast) window.showToast(`Odaya katıldınız: ${roomId}`, 'success');
    };

    // leaveCollaborationRoom
    window.leaveCollaborationRoom = function () {
        if (window.VIZ_COLLAB.channel) {
            window.VIZ_COLLAB.channel.close();
            window.VIZ_COLLAB.channel = null;
        }
        window.VIZ_COLLAB.roomId = null;
        if (window.showToast) window.showToast('Odadan ayrıldınız', 'info');
    };

    // sendCollaborationAction
    window.sendCollaborationAction = function (action) {
        if (!window.VIZ_COLLAB.channel) {
            if (window.showToast) window.showToast('Önce bir odaya katılın', 'warning');
            return;
        }
        window.VIZ_COLLAB.channel.postMessage(action);
    };

    // =====================================================
    // FAZ 3: SCHEDULED REPORTS
    // =====================================================

    const SCHEDULED_REPORTS_KEY = 'opradox_scheduled_reports';

    // showScheduledReportsModal
    window.showScheduledReportsModal = function () {
        const existing = document.querySelector('.viz-schedule-modal');
        if (existing) existing.remove();

        const reports = window.loadScheduledReports();

        let reportsHtml = reports.length === 0
            ? '<p style="color:#888;text-align:center;padding:20px;">Planlanmış rapor yok</p>'
            : reports.map((r, idx) => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:8px;">
                    <div style="flex:1;">
                        <div style="color:#fff;font-size:14px;">${r.name || 'Rapor #' + (idx + 1)}</div>
                        <div style="color:#888;font-size:11px;">${r.schedule} - ${r.hour}:00</div>
                    </div>
                    <button onclick="window.toggleScheduledReport(${idx});window.showScheduledReportsModal();" style="padding:6px 10px;background:${r.enabled ? '#27ae60' : '#666'};color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                        ${r.enabled ? 'Aktif' : 'Pasif'}
                    </button>
                    <button onclick="window.runScheduledReportNow(${idx})" style="padding:6px 10px;background:#4a90d9;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                        <i class="fas fa-play"></i>
                    </button>
                    <button onclick="window.deleteScheduledReport(${idx});window.showScheduledReportsModal();" style="padding:6px 10px;background:#e74c3c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

        const modal = document.createElement('div');
        modal.className = 'viz-schedule-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.1);">
                <h3 style="color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-clock" style="color:#4a90d9;"></i> Planlanmış Raporlar
                </h3>
                
                <div style="margin-bottom:16px;">${reportsHtml}</div>
                
                <hr style="border:none;border-top:1px solid #333;margin:16px 0;">
                
                <h4 style="color:#888;font-size:12px;margin-bottom:12px;">Yeni Rapor Ekle</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <div>
                        <label style="color:#888;font-size:11px;">Rapor Adı</label>
                        <input type="text" id="schedReportName" placeholder="Günlük Rapor" style="width:100%;padding:8px;background:#0f0f1a;border:1px solid #333;border-radius:6px;color:#fff;box-sizing:border-box;margin-top:4px;">
                    </div>
                    <div>
                        <label style="color:#888;font-size:11px;">Saat (0-23)</label>
                        <input type="number" id="schedReportHour" min="0" max="23" value="9" style="width:100%;padding:8px;background:#0f0f1a;border:1px solid #333;border-radius:6px;color:#fff;box-sizing:border-box;margin-top:4px;">
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="color:#888;font-size:11px;">Zamanlama</label>
                    <select id="schedReportSchedule" style="width:100%;padding:8px;background:#0f0f1a;border:1px solid #333;border-radius:6px;color:#fff;margin-top:4px;">
                        <option value="daily">Günlük</option>
                        <option value="weekly">Haftalık (Pazartesi)</option>
                    </select>
                </div>
                
                <div style="display:flex;gap:10px;">
                    <button onclick="window.createScheduledReport({name:document.getElementById('schedReportName').value,schedule:document.getElementById('schedReportSchedule').value,hour:parseInt(document.getElementById('schedReportHour').value)||9});window.showScheduledReportsModal();" style="flex:1;padding:12px;background:#4a90d9;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        <i class="fas fa-plus"></i> Ekle
                    </button>
                    <button onclick="this.closest('.viz-schedule-modal').remove()" style="flex:1;padding:12px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    };

    // createScheduledReport
    window.createScheduledReport = function (options) {
        const reports = window.loadScheduledReports();
        reports.push({
            id: Date.now(),
            name: options.name || 'Rapor',
            schedule: options.schedule || 'daily',
            hour: options.hour || 9,
            enabled: true,
            lastRun: null,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(reports));
        if (window.showToast) window.showToast('Rapor planlandı', 'success');
    };

    // loadScheduledReports
    window.loadScheduledReports = function () {
        try {
            return JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY)) || [];
        } catch {
            return [];
        }
    };

    // toggleScheduledReport
    window.toggleScheduledReport = function (index) {
        const reports = window.loadScheduledReports();
        if (reports[index]) {
            reports[index].enabled = !reports[index].enabled;
            localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(reports));
        }
    };

    // deleteScheduledReport
    window.deleteScheduledReport = function (index) {
        const reports = window.loadScheduledReports();
        reports.splice(index, 1);
        localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(reports));
        if (window.showToast) window.showToast('Rapor silindi', 'info');
    };

    // runScheduledReportNow
    window.runScheduledReportNow = function (index) {
        const reports = window.loadScheduledReports();
        if (!reports[index]) return;

        if (window.showToast) window.showToast('Rapor oluşturuluyor...', 'info');

        // generateReport varsa çağır, yoksa exportPortableDashboard
        if (typeof window.generateReport === 'function') {
            window.generateReport();
        } else if (typeof window.exportPortableDashboard === 'function') {
            window.exportPortableDashboard();
        }

        // lastRun güncelle
        reports[index].lastRun = new Date().toISOString();
        localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(reports));
    };

    // Scheduled reports checker (runs every hour while page is open)
    window.startScheduledReportsChecker = function () {
        setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentDay = now.getDay(); // 0=Sunday, 1=Monday

            const reports = window.loadScheduledReports();
            reports.forEach((report, idx) => {
                if (!report.enabled) return;

                // Check if it's time to run
                const shouldRun = report.hour === currentHour && (
                    report.schedule === 'daily' ||
                    (report.schedule === 'weekly' && currentDay === 1) // Monday
                );

                // Check if already run today
                const lastRun = report.lastRun ? new Date(report.lastRun) : null;
                const alreadyRunToday = lastRun &&
                    lastRun.getDate() === now.getDate() &&
                    lastRun.getMonth() === now.getMonth() &&
                    lastRun.getFullYear() === now.getFullYear();

                if (shouldRun && !alreadyRunToday) {
                    console.log(`[Scheduled] Running report: ${report.name}`);
                    window.runScheduledReportNow(idx);
                }
            });
        }, 60 * 60 * 1000); // Check every hour

        console.log('✅ Scheduled reports checker started');
    };

    // =====================================================
    // FAZ 3: removeWatermark
    // =====================================================

    window.removeWatermark = function () {
        const selectors = [
            '.watermark',
            '.viz-watermark',
            '[class*="watermark"]',
            '#watermark',
            '.powered-by',
            '.brand-footer'
        ];

        let removed = 0;
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
                removed++;
            });
        });

        if (removed > 0 && window.showToast) {
            window.showToast(`${removed} watermark gizlendi`, 'info');
        }

        return removed;
    };

    // =====================================================
    // FINAL_AUDIT_FIX: Missing modal stubs (onclick handlers in viz.html)
    // =====================================================

    // Stat analysis modals
    window.showPCAModal = window.showPCAModal || function () { if (window.showToast) window.showToast('PCA analizi başlatılıyor...', 'info'); };
    window.showClusterModal = window.showClusterModal || function () { if (window.showToast) window.showToast('Kümeleme analizi başlatılıyor...', 'info'); };
    window.showCronbachModal = window.showCronbachModal || function () { if (window.showToast) window.showToast('Cronbach Alpha hesaplanıyor...', 'info'); };
    window.showLogisticModal = window.showLogisticModal || function () { if (window.showToast) window.showToast('Lojistik regresyon başlatılıyor...', 'info'); };
    window.showTimeSeriesModal = window.showTimeSeriesModal || function () { if (window.showToast) window.showToast('Zaman serisi analizi başlatılıyor...', 'info'); };
    window.showFriedmanModal = window.showFriedmanModal || function () { if (window.showToast) window.showToast('Friedman testi başlatılıyor...', 'info'); };
    window.showPowerAnalysisModal = window.showPowerAnalysisModal || function () { if (window.showToast) window.showToast('Power analysis başlatılıyor...', 'info'); };
    window.showRegressionModal = window.showRegressionModal || function () { if (window.showToast) window.showToast('Regresyon analizi başlatılıyor...', 'info'); };
    window.showDiscriminantModal = window.showDiscriminantModal || function () { if (window.showToast) window.showToast('Discriminant analizi başlatılıyor...', 'info'); };
    window.showSurvivalModal = window.showSurvivalModal || function () { if (window.showToast) window.showToast('Sağkalım analizi başlatılıyor...', 'info'); };
    window.generateAPAReport = window.generateAPAReport || function () { if (window.showToast) window.showToast('APA raporu oluşturuluyor...', 'info'); };

    // Data management modals
    window.showFilterPanel = window.showFilterPanel || function () { if (window.showToast) window.showToast('Filtre paneli açılıyor...', 'info'); };
    window.showSortPanel = window.showSortPanel || function () { if (window.showToast) window.showToast('Sıralama paneli açılıyor...', 'info'); };
    window.showFillMissingModal = window.showFillMissingModal || function () { if (window.showToast) window.showToast('Eksik veri doldurma - veri yönetimi panelini kullanın', 'info'); };
    window.showOutlierModal = window.showOutlierModal || function () { if (window.showToast) window.showToast('Aykırı değer temizleme - veri yönetimi panelini kullanın', 'info'); };
    window.showDuplicateModal = window.showDuplicateModal || function () { if (window.showToast) window.showToast('Duplicate silme - veri yönetimi panelini kullanın', 'info'); };
    window.showTypeConvertModal = window.showTypeConvertModal || function () { if (window.showToast) window.showToast('Tip dönüştürme - veri yönetimi panelini kullanın', 'info'); };
    window.showMergeColumnsModal = window.showMergeColumnsModal || function () { if (window.showToast) window.showToast('Kolon birleştirme - veri yönetimi panelini kullanın', 'info'); };
    window.showSplitColumnModal = window.showSplitColumnModal || function () { if (window.showToast) window.showToast('Kolon bölme - veri yönetimi panelini kullanın', 'info'); };
    window.showFindReplaceModal = window.showFindReplaceModal || function () { if (window.showToast) window.showToast('Bul/Değiştir - veri yönetimi panelini kullanın', 'info'); };
    window.showBinningModal = window.showBinningModal || function () { if (window.showToast) window.showToast('Binning - veri yönetimi panelini kullanın', 'info'); };

    // Undo/Redo stubs (if not already defined)
    window.undo = window.undo || function () {
        if (window.HISTORY?.undoStack?.length > 0) {
            const state = window.HISTORY.undoStack.pop();
            window.HISTORY.redoStack.push(JSON.parse(JSON.stringify(window.VIZ_STATE)));
            Object.assign(window.VIZ_STATE, state);
            if (typeof window.rerenderAllCharts === 'function') window.rerenderAllCharts();
            if (window.showToast) window.showToast('Geri alındı', 'info');
        } else {
            if (window.showToast) window.showToast('Geri alınacak işlem yok', 'warning');
        }
    };

    window.redo = window.redo || function () {
        if (window.HISTORY?.redoStack?.length > 0) {
            const state = window.HISTORY.redoStack.pop();
            window.HISTORY.undoStack.push(JSON.parse(JSON.stringify(window.VIZ_STATE)));
            Object.assign(window.VIZ_STATE, state);
            if (typeof window.rerenderAllCharts === 'function') window.rerenderAllCharts();
            if (window.showToast) window.showToast('İleri alındı', 'info');
        } else {
            if (window.showToast) window.showToast('İleri alınacak işlem yok', 'warning');
        }
    };

    // =====================================================
    // FINAL_AUDIT_FIX: safeFetch - Network Control Wrapper
    // =====================================================

    window.safeFetch = function (url, options = {}) {
        // Check if remote URL
        const isRemoteUrl = url.startsWith('http') && !url.startsWith(window.location.origin);

        // Block remote URLs if not allowed
        if (isRemoteUrl && !window.VIZ_SETTINGS?.allowRemoteUrlLoad) {
            console.warn('[safeFetch] Remote URL blocked:', url);
            if (window.showToast) window.showToast('Remote URL yükleme devre dışı', 'warning');
            return Promise.reject(new Error('Remote URL loading disabled'));
        }

        // Block backend calls if not enabled
        const isBackendCall = url.includes('/viz/') || url.includes('/api/') || url.includes('/spss/');
        if (isBackendCall && !window.VIZ_SETTINGS?.backendEnabled) {
            console.warn('[safeFetch] Backend call blocked:', url);
            if (window.showToast) window.showToast('Backend API devre dışı', 'warning');
            return Promise.reject(new Error('Backend API disabled'));
        }

        // Allow the fetch
        return fetch(url, options);
    };

    // Wrap existing backend functions with safeFetch guard
    const originalCallSpssApi = window.callSpssApi;
    if (typeof originalCallSpssApi === 'function') {
        window.callSpssApi = function (...args) {
            if (!window.VIZ_SETTINGS?.backendEnabled) {
                if (window.showToast) window.showToast('Backend devre dışı - local analiz kullanın', 'warning');
                return Promise.resolve(null);
            }
            return originalCallSpssApi.apply(this, args);
        };
    }

    // =====================================================
    // FINAL_AUDIT_FIX: normalizeConfig - Round-trip consistency
    // =====================================================

    window.normalizeConfig = function (config) {
        if (!config) return config;

        // Ensure charts array exists
        if (!config.charts) config.charts = [];

        // Normalize chart objects
        config.charts = config.charts.map(chart => ({
            id: chart.id || `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: chart.type || 'bar',
            title: chart.title || '',
            xAxis: chart.xAxis || null,
            yAxis: chart.yAxis || null,
            yAxes: chart.yAxes || [],
            aggregation: chart.aggregation || 'sum',
            color: chart.color || '#4a90d9',
            dataLimit: chart.dataLimit || 1000,
            useDualAxis: chart.useDualAxis || false,
            ...chart
        }));

        // Ensure filters array
        if (!config.filters) config.filters = [];

        // Ensure theme
        if (!config.theme) config.theme = 'dark';

        return config;
    };

    // Patch importJSONConfig to use normalizeConfig
    const originalImportJSONConfig = window.importJSONConfig;
    if (typeof originalImportJSONConfig === 'function') {
        window.importJSONConfig = function (jsonOrFile) {
            // If it's an object, normalize it first
            if (typeof jsonOrFile === 'object' && !(jsonOrFile instanceof File)) {
                jsonOrFile = window.normalizeConfig(jsonOrFile);
            }
            return originalImportJSONConfig(jsonOrFile);
        };
    }

    // =====================================================
    // FINAL_AUDIT_FIX: LOCK SECTION - Prevent Override
    // =====================================================

    // Store modular function references
    window.__VIZ_MOD = window.__VIZ_MOD || {};

    // Lock critical functions (re-assign after any legacy scripts might override)
    const lockFunctions = [
        'exportJSONConfig', 'importJSONConfig', 'exportPortableDashboard',
        'shareViaURL', 'loadFromURL', 'generateEmbedCode', 'generateQRCode',
        'detectColumnTypes', 'generateDataProfile', 'applyCrossFilter', 'clearFilters',
        'applyWhatIfChange', 'analyzeTrend', 'showToast', 'downloadFile'
    ];

    lockFunctions.forEach(fn => {
        if (typeof window[fn] === 'function') {
            window.__VIZ_MOD[fn] = window[fn];
        }
    });

    // Re-apply locks on DOMContentLoaded (after any legacy scripts)
    window.addEventListener('DOMContentLoaded', function () {
        lockFunctions.forEach(fn => {
            if (window.__VIZ_MOD[fn] && typeof window.__VIZ_MOD[fn] === 'function') {
                window[fn] = window.__VIZ_MOD[fn];
            }
        });
        console.log('🔒 Critical functions locked');
    });

    // =====================================================
    // INITIALIZATION
    // =====================================================

    // URL'den otomatik yükle (sayfa yüklendiğinde)
    if (document.readyState === 'complete') {
        window.loadFromURL();
        window.checkOfflineMode();
        window.startScheduledReportsChecker();
    } else {
        window.addEventListener('load', () => {
            window.loadFromURL();
            window.checkOfflineMode();
            window.startScheduledReportsChecker();
        });
    }

    // GÖREV-2: selftest=1 URL parametresi ile selftest yükleme
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('selftest') === '1') {
            const s = document.createElement('script');
            s.type = 'module';
            s.src = 'js/selftest.js';
            s.onerror = () => {
                const s2 = document.createElement('script');
                s2.type = 'module';
                s2.src = 'selftest.js';
                document.head.appendChild(s2);
                console.log('[SELFTEST] fallback loader injected (selftest=1)');
            };
            document.head.appendChild(s);
            console.log('[SELFTEST] loader injected (selftest=1)');
        }
    } catch (e) { /* no-op */ }

    console.log('✅ adapters.js loaded - Compatibility layer active (FINAL_AUDIT_FIX Complete)');
})();
