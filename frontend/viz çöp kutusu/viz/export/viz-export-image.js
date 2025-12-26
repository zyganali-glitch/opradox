/**
 * viz-export-image.js
 * Image Export Functions - PNG, SVG, Batch Export
 */

(function () {
    'use strict';

    /**
     * Export selected chart as PNG
     */
    function exportPNG() {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (!state.selectedChart) {
            if (typeof showToast === 'function') {
                showToast('Once bir grafik secin', 'warning');
            }
            return;
        }

        const chart = state.echartsInstances[state.selectedChart];
        if (!chart) {
            if (typeof showToast === 'function') {
                showToast('Grafik bulunamadi', 'error');
            }
            return;
        }

        const bgColor = document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e';

        const url = chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: bgColor
        });

        downloadFile(url, `chart_${state.selectedChart}.png`);

        if (typeof showToast === 'function') {
            const texts = window.VIZ_TEXTS ? window.VIZ_TEXTS[state.lang || 'tr'] : {};
            showToast(texts.export_success || 'Export basarili', 'success');
        }
    }

    /**
     * Export selected chart as SVG
     */
    function exportSVG() {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (!state.selectedChart) {
            if (typeof showToast === 'function') {
                showToast('Once bir grafik secin', 'warning');
            }
            return;
        }

        const chart = state.echartsInstances[state.selectedChart];
        if (!chart) return;

        const url = chart.getDataURL({
            type: 'svg',
            pixelRatio: 2
        });

        downloadFile(url, `chart_${state.selectedChart}.svg`);

        if (typeof showToast === 'function') {
            showToast('SVG export basarili', 'success');
        }
    }

    // NOTE: exportAllChartsPNG removed - use viz-export.js version instead


    /**
     * Export chart with custom settings
     * @param {string} chartId - Chart ID to export
     * @param {Object} options - Export options
     */
    function exportChartWithOptions(chartId, options = {}) {
        const state = window.VIZ_STATE;
        if (!state) return;

        const chart = state.echartsInstances[chartId];
        if (!chart) return;

        const format = options.format || 'png';
        const pixelRatio = options.pixelRatio || 2;
        const bgColor = options.backgroundColor ||
            (document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e');

        const url = chart.getDataURL({
            type: format,
            pixelRatio: pixelRatio,
            backgroundColor: format === 'png' ? bgColor : undefined
        });

        const config = state.charts.find(c => c.id === chartId);
        const filename = options.filename ||
            `${config?.title || 'chart'}_${Date.now()}.${format}`;

        downloadFile(url, filename);
    }

    /**
     * Export dashboard screenshot using html2canvas
     */
    async function exportDashboardImage() {
        const dashboard = document.getElementById('vizDashboardGrid');
        if (!dashboard) {
            if (typeof showToast === 'function') {
                showToast('Dashboard bulunamadi', 'error');
            }
            return;
        }

        if (typeof showToast === 'function') {
            showToast('Screenshot aliniyor...', 'info');
        }

        try {
            // Check if html2canvas is available
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas kutuphanesi yuklu degil');
            }

            const bgColor = document.body.classList.contains('day-mode') ? '#f5f5f5' : '#1a1a2e';

            const canvas = await html2canvas(dashboard, {
                scale: 2,
                useCORS: true,
                backgroundColor: bgColor,
                logging: false
            });

            const url = canvas.toDataURL('image/png');
            downloadFile(url, `dashboard_${Date.now()}.png`);

            if (typeof showToast === 'function') {
                showToast('Dashboard screenshot kaydedildi', 'success');
            }
        } catch (error) {
            console.error('Dashboard screenshot hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('Screenshot alinamadi: ' + error.message, 'error');
            }
        }
    }

    /**
     * Export chart to clipboard (if supported)
     */
    async function exportToClipboard() {
        const state = window.VIZ_STATE;
        if (!state || !state.selectedChart) {
            if (typeof showToast === 'function') {
                showToast('Once bir grafik secin', 'warning');
            }
            return;
        }

        const chart = state.echartsInstances[state.selectedChart];
        if (!chart) return;

        try {
            const bgColor = document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e';
            const dataUrl = chart.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: bgColor
            });

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Write to clipboard
            if (navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                if (typeof showToast === 'function') {
                    showToast('Grafik panoya kopyalandi', 'success');
                }
            } else {
                throw new Error('Clipboard API desteklenmiyor');
            }
        } catch (error) {
            console.error('Clipboard hatasi:', error);
            if (typeof showToast === 'function') {
                showToast('Panoya kopyalanamadi', 'error');
            }
        }
    }

    /**
     * Download file from data URL
     * @param {string} dataUrl - Data URL or Blob URL
     * @param {string} filename - Download filename
     */
    function downloadFile(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Export JSON configuration
     */
    function exportJSONConfig() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const config = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            charts: state.charts,
            chartCounter: state.chartCounter,
            columns: state.columns,
            dataRowCount: state.data ? state.data.length : 0
        };

        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        downloadFile(url, `opradox_config_${Date.now()}.json`);
        URL.revokeObjectURL(url);

        if (typeof showToast === 'function') {
            showToast('JSON config export edildi', 'success');
        }
    }

    /**
     * Import JSON configuration
     */
    function importJSONConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    applyJSONConfig(config);
                } catch (error) {
                    console.error('JSON parse hatasi:', error);
                    if (typeof showToast === 'function') {
                        showToast('Gecersiz JSON dosyasi', 'error');
                    }
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    /**
     * Apply imported JSON configuration
     */
    function applyJSONConfig(config) {
        const state = window.VIZ_STATE;
        if (!state || !config) return;

        // Clear existing charts
        if (typeof clearDashboard === 'function') {
            clearDashboard();
        }

        // Apply new config
        if (config.charts && config.charts.length > 0) {
            state.chartCounter = config.chartCounter || 0;

            config.charts.forEach(chartConfig => {
                state.charts.push(chartConfig);
                if (typeof createChartWidget === 'function') {
                    createChartWidget(chartConfig);
                }
            });
        }

        if (typeof updateEmptyState === 'function') {
            updateEmptyState();
        }

        if (typeof showToast === 'function') {
            showToast(`${config.charts?.length || 0} grafik import edildi`, 'success');
        }
    }

    // Global exports
    window.exportPNG = exportPNG;
    window.exportSVG = exportSVG;
    // NOTE: exportAllChartsPNG export removed - use viz-export.js version
    window.exportChartWithOptions = exportChartWithOptions;
    window.exportDashboardImage = exportDashboardImage;
    window.exportToClipboard = exportToClipboard;
    window.downloadFile = downloadFile;
    window.exportJSONConfig = exportJSONConfig;
    window.importJSONConfig = importJSONConfig;
    window.applyJSONConfig = applyJSONConfig;

    console.log('✅ viz-export-image.js Loaded');
})();
