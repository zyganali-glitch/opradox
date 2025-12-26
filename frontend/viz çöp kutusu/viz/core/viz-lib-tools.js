/**
 * viz-lib-tools.js
 * Advanced Tools & Calculations - Recovered from Legacy viz.js
 * Functions: calculate*, render*, export*, check*, embed*
 */

(function () {
    'use strict';

    // =====================================================
    // STOP WORDS FOR WORD CLOUD (viz.js dependencies)
    // =====================================================

    const STOP_WORDS = {
        tr: ['ve', 'ile', 'bir', 'bu', 'da', 'de', 'için', 'gibi', 'ama', 'ancak', 'fakat', 'çünkü', 'eğer', 'ki', 'ne', 'nasıl', 'neden', 'her', 'tüm', 'bütün', 'bazı', 'birkaç', 'hiç', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar', 'olan', 'olarak', 'ise', 'daha', 'çok', 'az', 'kadar'],
        en: ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between']
    };

    // =====================================================
    // SKEWNESS & KURTOSIS CALCULATIONS (viz.js lines 14989-15004)
    // =====================================================

    /**
     * Çarpıklık hesaplama
     */
    function calculateSkewness(values, mean, stdev) {
        if (!values.length || stdev === 0) return 0;
        const n = values.length;
        const sum = values.reduce((acc, v) => acc + Math.pow((v - mean) / stdev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }

    /**
     * Basıklık hesaplama
     */
    function calculateKurtosis(values, mean, stdev) {
        if (!values.length || stdev === 0) return 0;
        const n = values.length;
        const sum = values.reduce((acc, v) => acc + Math.pow((v - mean) / stdev, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    }

    // =====================================================
    // WORD FREQUENCY CALCULATION (viz.js lines 10012-10044)
    // =====================================================

    function calculateWordFrequency(textColumn, options = {}) {
        if (!VIZ_STATE.data || !textColumn) return [];

        const minLength = options.minLength || 2;
        const maxWords = options.maxWords || 100;
        const removeStopWords = options.removeStopWords !== false;
        const lang = options.lang || 'tr';

        const wordCount = {};
        const stopWords = new Set([...STOP_WORDS.tr, ...STOP_WORDS.en]);

        VIZ_STATE.data.forEach(row => {
            const text = String(row[textColumn] || '');

            // Kelimelere ayır (sadece harfler)
            const words = text.toLowerCase()
                .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length >= minLength);

            words.forEach(word => {
                if (removeStopWords && stopWords.has(word)) return;
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });

        // Frekansa göre sırala ve limitle
        const sorted = Object.entries(wordCount)
            .map(([word, count]) => ({ name: word, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, maxWords);

        return sorted;
    }

    // =====================================================
    // TOOLTIP CUSTOMIZATION (viz.js lines 6284-6318)
    // =====================================================

    function customizeTooltip(chartId, format = 'default') {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        const formatters = {
            'default': null,
            'detailed': (params) => {
                if (Array.isArray(params)) {
                    return params.map(p => `${p.marker} ${p.seriesName}: <b>${p.value}</b>`).join('<br/>');
                }
                return `${params.marker} ${params.name}: <b>${params.value}</b>`;
            },
            'percentage': (params) => {
                return `${params.name}: ${params.value} (${params.percent}%)`;
            },
            'full': (params) => {
                if (Array.isArray(params)) {
                    let html = `<div style="font-weight:bold;margin-bottom:5px">${params[0].name}</div>`;
                    params.forEach(p => {
                        html += `${p.marker} ${p.seriesName}: <b>${p.value}</b><br/>`;
                    });
                    return html;
                }
                return `<b>${params.name}</b><br/>Değer: ${params.value}`;
            }
        };

        chart.setOption({
            tooltip: {
                formatter: formatters[format]
            }
        });

        if (typeof showToast === 'function') showToast(`Tooltip formatı: ${format}`, 'info');
    }

    // =====================================================
    // EXPORT AS PORTABLE HTML (viz.js lines 6346-6385)
    // =====================================================

    async function exportAsPortableHTML() {
        const dashboard = document.getElementById('vizDashboardGrid');
        if (!dashboard) return;

        // Basit HTML oluştur
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Opradox Dashboard Export</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
        .chart { width: 600px; height: 400px; margin: 20px auto; background: #16213e; border-radius: 8px; }
    </style>
</head>
<body>
    <h1 style="text-align:center">Dashboard Export - ${new Date().toLocaleDateString('tr-TR')}</h1>
    ${VIZ_STATE.charts.map((c, i) => `
        <div id="chart${i}" class="chart"></div>
        <script>
            var chart${i} = echarts.init(document.getElementById('chart${i}'));
            chart${i}.setOption(${JSON.stringify(VIZ_STATE.echartsInstances[c.id]?.getOption() || {})});
        <\/script>
    `).join('')}
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = 'dashboard_export.html';
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('Portable HTML olarak indirildi', 'success');
    }

    // =====================================================
    // MOBILE DEVICE SUPPORT (viz.js lines 7089-7108)
    // =====================================================

    function checkMobileDevice() {
        return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function adaptForMobile() {
        if (!checkMobileDevice()) return;

        // Dashboard grid'i tek sütuna çevir
        const dashboard = document.getElementById('vizDashboardGrid');
        if (dashboard) {
            dashboard.style.gridTemplateColumns = '1fr';
        }

        // Sol ve sağ paneli gizle/accordion yap
        document.querySelectorAll('.viz-left-pane, .viz-right-pane').forEach(pane => {
            pane.style.maxHeight = '300px';
        });

        if (typeof showToast === 'function') showToast('Mobil görünüm aktif', 'info');
    }

    // =====================================================
    // FLOW MAP RENDERING (viz.js lines 7849-7875)
    // =====================================================

    function renderFlowMap(containerId, flows, config = {}) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return;

        const chart = echarts.init(chartDom);

        // Lines series ile akış okları
        chart.setOption({
            title: { text: config.title || 'Akış Haritası', left: 'center' },
            tooltip: { trigger: 'item' },
            xAxis: { type: 'value', show: false },
            yAxis: { type: 'value', show: false },
            series: [{
                type: 'lines',
                coordinateSystem: 'cartesian2d',
                polyline: false,
                lineStyle: { width: 2, curveness: 0.3 },
                effect: { show: true, period: 4, symbol: 'arrow', symbolSize: 8 },
                data: flows.map(f => ({
                    coords: [[f.fromLng, f.fromLat], [f.toLng, f.toLat]],
                    lineStyle: { color: f.color || '#4a90d9', width: Math.sqrt(f.value) }
                }))
            }]
        });

        return chart;
    }

    // =====================================================
    // WORD CLOUD ADVANCED (viz.js lines 10048-10107)
    // =====================================================

    function renderWordCloudAdvanced(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        if (!container) return;

        const textColumn = config.x || VIZ_STATE.columns.find(c => {
            const info = VIZ_STATE.columnsInfo?.find(ci => ci.name === c);
            return info?.type === 'text';
        }) || VIZ_STATE.columns[0];

        const wordData = calculateWordFrequency(textColumn, {
            maxWords: config.maxWords || 100,
            minLength: config.minLength || 3,
            removeStopWords: true
        });

        if (wordData.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#e74c3c;">Kelime bulunamadı</p>';
            return;
        }

        const chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;

        // Kelime boyutlarını normalize et
        const maxValue = Math.max(...wordData.map(w => w.value));
        const minSize = 12;
        const maxSize = 60;

        const option = {
            title: { text: config.title || 'Kelime Bulutu', left: 'center' },
            tooltip: { trigger: 'item', formatter: '{b}: {c} kez' },
            series: [{
                type: 'wordCloud',
                gridSize: 8,
                sizeRange: [minSize, maxSize],
                rotationRange: [-45, 45],
                shape: 'circle',
                width: '90%',
                height: '90%',
                textStyle: {
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    color: function () {
                        const colors = ['#4a90d9', '#9a3050', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c', '#1abc9c'];
                        return colors[Math.floor(Math.random() * colors.length)];
                    }
                },
                emphasis: {
                    textStyle: { shadowBlur: 10, shadowColor: '#333' }
                },
                data: wordData.map(w => ({
                    name: w.name,
                    value: w.value,
                    textStyle: { fontSize: minSize + (w.value / maxValue) * (maxSize - minSize) }
                }))
            }]
        };

        chart.setOption(option);
    }

    // =====================================================
    // EMBED STAT AS ANNOTATION (viz.js lines 10270-10321)
    // =====================================================

    function embedStatAsAnnotation(statResult, annotationType = 'markLine') {
        if (!VIZ_STATE.selectedChart) {
            if (typeof showToast === 'function') showToast('Önce bir grafik seçin', 'warning');
            return;
        }

        const chartInstance = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
        if (!chartInstance) return;

        const option = chartInstance.getOption();

        if (!option.series || option.series.length === 0) return;

        // İlk seriye annotation ekle
        const series = option.series[0];

        if (annotationType === 'markLine') {
            // Ortalama, medyan vb. için yatay çizgi
            if (!series.markLine) series.markLine = { data: [] };

            if (statResult.mean !== undefined) {
                series.markLine.data.push({
                    name: 'Ortalama',
                    yAxis: statResult.mean,
                    lineStyle: { color: '#e74c3c', type: 'dashed' },
                    label: { formatter: 'Ort: {c}' }
                });
            }

            if (statResult.median !== undefined) {
                series.markLine.data.push({
                    name: 'Medyan',
                    yAxis: statResult.median,
                    lineStyle: { color: '#3498db', type: 'solid' },
                    label: { formatter: 'Med: {c}' }
                });
            }
        } else if (annotationType === 'markArea') {
            // Güven aralığı için alan
            if (!series.markArea) series.markArea = { data: [] };

            if (statResult.ci_lower !== undefined && statResult.ci_upper !== undefined) {
                series.markArea.data.push([
                    { yAxis: statResult.ci_lower, itemStyle: { color: 'rgba(46, 204, 113, 0.2)' } },
                    { yAxis: statResult.ci_upper }
                ]);
            }
        }

        chartInstance.setOption(option);
        if (typeof showToast === 'function') showToast('İstatistik grafiğe eklendi', 'success');
    }

    // =====================================================
    // PARALLEL COORDINATES CHART (viz.js lines 10452-10485)
    // =====================================================

    function renderParallelCoordinatesChart(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        if (!container || !VIZ_STATE.data) return;

        const numCols = VIZ_STATE.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name)
            || VIZ_STATE.columns.slice(0, 5);

        const parallelAxis = numCols.map((col, i) => ({
            dim: i,
            name: col,
            type: 'value'
        }));

        const seriesData = VIZ_STATE.data.slice(0, 500).map(row =>
            numCols.map(col => parseFloat(row[col]) || 0)
        );

        const chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;

        const option = {
            title: { text: config.title || 'Parallel Coordinates', left: 'center' },
            parallelAxis: parallelAxis,
            parallel: { left: '5%', right: '13%', bottom: '10%', top: '20%' },
            series: [{
                type: 'parallel',
                lineStyle: { width: 1, opacity: 0.3 },
                emphasis: { lineStyle: { width: 2, opacity: 1 } },
                data: seriesData
            }]
        };

        chart.setOption(option);
    }

    // =====================================================
    // DOWNLOAD PDF FROM URL (viz.js lines 11673-11679)
    // =====================================================

    function downloadPDFFromUrl(blobUrl) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `opradox_report_${Date.now()}.pdf`;
        link.click();
        if (typeof showToast === 'function') showToast('PDF indirildi', 'success');
    }

    // =====================================================
    // WEB WORKER SUPPORT (viz.js lines 12034-12065)
    // =====================================================

    function checkWebWorkerSupport() {
        return typeof Worker !== 'undefined';
    }

    // Heavy calculation offloader (placeholder for Web Worker)
    function offloadCalculation(type, data, callback) {
        if (checkWebWorkerSupport()) {
            // In a full implementation, this would use a Web Worker
            console.log('Web Worker supported - offloading:', type);
            // For now, run synchronously with timeout to prevent UI blocking
            setTimeout(() => {
                try {
                    let result;
                    switch (type) {
                        case 'correlation':
                            result = typeof calculateCorrelationMatrix === 'function' ? calculateCorrelationMatrix(data.columns) : null;
                            break;
                        case 'descriptive':
                            result = typeof calculateDescriptiveStats === 'function' ? calculateDescriptiveStats(data.column) : null;
                            break;
                        default:
                            result = data;
                    }
                    callback(null, result);
                } catch (e) {
                    callback(e, null);
                }
            }, 0);
        } else {
            console.warn('Web Workers not supported');
            callback(new Error('Web Workers not supported'), null);
        }
    }

    // =====================================================
    // AUDIT FOOTER (viz.js lines 15587-15601)
    // =====================================================

    function addAuditFooterToChart(chartId, config) {
        const widget = document.querySelector(`[data-chart-id="${chartId}"]`);
        if (!widget) return;

        const usedColumns = [config.xAxis, config.yAxis].filter(Boolean);

        let footer = widget.querySelector('.viz-chart-audit-footer');
        if (!footer) {
            footer = document.createElement('div');
            footer.className = 'viz-chart-audit-footer viz-stat-audit-footer';
            widget.appendChild(footer);
        }

        footer.innerHTML = typeof generateAuditNote === 'function' ? generateAuditNote(usedColumns) : `<i class="fas fa-info-circle"></i> Kolonlar: ${usedColumns.join(', ')}`;
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.STOP_WORDS = STOP_WORDS;
    window.calculateSkewness = calculateSkewness;
    window.calculateKurtosis = calculateKurtosis;
    window.calculateWordFrequency = calculateWordFrequency;
    window.customizeTooltip = customizeTooltip;
    window.exportAsPortableHTML = exportAsPortableHTML;
    window.checkMobileDevice = checkMobileDevice;
    window.adaptForMobile = adaptForMobile;
    window.renderFlowMap = renderFlowMap;
    window.renderWordCloudAdvanced = renderWordCloudAdvanced;
    window.embedStatAsAnnotation = embedStatAsAnnotation;
    window.renderParallelCoordinatesChart = renderParallelCoordinatesChart;
    window.downloadPDFFromUrl = downloadPDFFromUrl;
    window.checkWebWorkerSupport = checkWebWorkerSupport;
    window.offloadCalculation = offloadCalculation;
    window.addAuditFooterToChart = addAuditFooterToChart;

    console.log('✅ viz-lib-tools.js loaded - Advanced tools & calculations ready');
})();
