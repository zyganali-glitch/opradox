/**
 * viz-charts-basic.js
 * Basic Chart Functions - Bar, Line, Pie, Area, Scatter, Doughnut
 * Chart widget management and rendering
 */

(function () {
    'use strict';

    // Color palette for multiple series
    const CHART_COLORS = [
        '#4a90d9', '#00d97e', '#ffc107', '#e91e63', '#9c27b0',
        '#00bcd4', '#ff5722', '#795548', '#607d8b', '#3f51b5'
    ];

    /**
     * Add a new chart to the dashboard
     * @param {string} type - Chart type: bar, line, pie, area, scatter, doughnut
     */
    function addChart(type = 'bar') {
        const state = window.VIZ_STATE;
        if (!state) return;

        const chartId = `chart_${++state.chartCounter}`;

        // i18n destekli başlık
        const lang = state.lang || 'tr';
        const chartTitle = lang === 'tr' ? `Grafik ${state.chartCounter}` : `Chart ${state.chartCounter}`;

        const chartConfig = {
            id: chartId,
            type: type,
            title: chartTitle,
            xAxis: '',  // Boş başlat - kullanıcı seçsin
            yAxis: [],  // Boş dizi - multi Y için
            yAxes: [],  // Boş dizi - multi Y için
            y2Axis: null,
            useDualAxis: false,
            aggregation: 'sum',
            color: '#4a90d9',
            dataLimit: 20,
            datasetId: state.activeDatasetId
        };

        state.charts.push(chartConfig);

        // Widget oluştur
        createChartWidget(chartConfig);

        if (typeof updateEmptyState === 'function') {
            updateEmptyState();
        }

        // Seç ve ayarları göster
        selectChart(chartId);
    }


    /**
     * Create chart widget DOM element
     * @param {Object} config - Chart configuration
     */
    function createChartWidget(config) {
        const dashboard = document.getElementById('vizDashboardGrid');
        if (!dashboard) return;

        const widget = document.createElement('div');
        widget.className = 'viz-chart-widget';
        widget.id = config.id;
        widget.innerHTML = `
            <div class="viz-widget-header">
                <span class="viz-widget-title">${config.title}</span>
                <button class="viz-widget-settings" onclick="event.stopPropagation(); showWidgetMenu('${config.id}', event)">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
            <div class="viz-widget-chart" id="${config.id}_chart"></div>
            <div class="viz-widget-resize-handle" onmousedown="startWidgetResize(event, '${config.id}')"></div>
        `;

        widget.addEventListener('click', () => selectChart(config.id));
        dashboard.appendChild(widget);

        // Grafik render
        renderChart(config);

        // ResizeObserver ile otomatik boyutlandirma
        if (typeof ResizeObserver !== 'undefined') {
            const state = window.VIZ_STATE;
            const chartContainer = document.getElementById(`${config.id}_chart`);
            if (chartContainer && state) {
                const resizeObserver = new ResizeObserver(() => {
                    const chart = state.echartsInstances[config.id];
                    if (chart) {
                        chart.resize();
                    }
                });
                resizeObserver.observe(chartContainer);

                // Observer'i temizleme icin sakla
                if (!state.resizeObservers) state.resizeObservers = {};
                state.resizeObservers[config.id] = resizeObserver;
            }
        }
    }

    /**
     * Render chart using ECharts
     * @param {Object} config - Chart configuration
     */
    function renderChart(config) {
        const state = window.VIZ_STATE;
        if (!state) return;

        const chartDom = document.getElementById(`${config.id}_chart`);
        if (!chartDom) return;

        // Use dataset specific to chart, or active dataset
        const dataset = config.datasetId ? state.getDatasetById(config.datasetId) : state.getActiveDataset();
        const chartData = dataset?.data || state.data;

        if (!chartData || chartData.length === 0) {
            chartDom.innerHTML = '<div class="viz-no-chart-data">Veri yükleyin</div>';
            return;
        }

        // Dispose old instance
        if (state.echartsInstances[config.id]) {
            state.echartsInstances[config.id].dispose();
        }

        // Theme
        const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
        const chart = echarts.init(chartDom, theme);
        state.echartsInstances[config.id] = chart;

        // Multi Y desteği - yAxis dizi veya string olabilir
        const yAxes = Array.isArray(config.yAxis) ? config.yAxis : (config.yAxis ? [config.yAxis] : []);
        let xData = [];
        let yData = [];
        let multiYData = {};

        // DEBUG LOG
        console.log('🔍 renderChart DEBUG - config.yAxis:', JSON.stringify(config.yAxis));
        console.log('🔍 renderChart DEBUG - yAxes array:', JSON.stringify(yAxes));
        console.log('🔍 renderChart DEBUG - isArray:', Array.isArray(config.yAxis));

        const hasValidConfig = config.xAxis && yAxes.length > 0;


        if (hasValidConfig && typeof aggregateData === 'function') {
            // Her Y sütunu için ayrı aggregation
            yAxes.forEach((yCol, idx) => {
                const agg = aggregateData(chartData, config.xAxis, yCol, config.aggregation, config.dataLimit || 20);
                if (idx === 0) {
                    xData = agg.categories;
                }
                multiYData[yCol] = agg.values;
            });

            // İlk Y için varsayılan yData (geriye uyumluluk)
            yData = multiYData[yAxes[0]] || [];
        } else if (config.xAxis && yAxes.length > 0) {
            xData = chartData.slice(0, 20).map(r => r[config.xAxis] || '');
            yData = chartData.slice(0, 20).map(r => parseFloat(r[yAxes[0]]) || 0);
            multiYData[yAxes[0]] = yData;
        } else {
            // Demo veri
            xData = ['A', 'B', 'C', 'D', 'E'];
            yData = [120, 200, 150, 80, 70];
        }

        // Build option based on chart type - multiYData'yı da geç
        let option = buildChartOption(config, xData, yData, chartData, multiYData);

        chart.setOption(option);

        // Apply statistical overlays if enabled
        if (typeof applyStatisticalOverlays === 'function') {
            applyStatisticalOverlays(chart, config, yData);
        }
    }


    /**
     * Build ECharts option based on chart type
     * @param {Object} multiYData - Her Y sütunu için ayrı veri objesi
     */
    function buildChartOption(config, xData, yData, chartData, multiYData = {}) {
        const colorPalette = CHART_COLORS;
        let option = {};

        switch (config.type) {
            case 'bar':
                // Multi Y series oluştur
                const barSeries = [];
                const yKeys = Object.keys(multiYData);

                if (yKeys.length > 0) {
                    yKeys.forEach((yCol, idx) => {
                        barSeries.push({
                            name: yCol,
                            type: 'bar',
                            data: multiYData[yCol],
                            itemStyle: { color: idx === 0 ? config.color : colorPalette[idx % colorPalette.length] }
                        });
                    });
                } else {
                    barSeries.push({
                        type: 'bar',
                        data: yData,
                        itemStyle: { color: config.color }
                    });
                }

                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    legend: yKeys.length > 1 ? { top: 30, data: yKeys } : undefined,
                    xAxis: {
                        type: 'category',
                        data: xData,
                        name: config.xAxis || '',
                        nameLocation: 'center',
                        nameGap: 55,
                        axisLabel: {
                            rotate: 45,
                            interval: 0,
                            fontSize: 9,
                            formatter: (value) => String(value).length > 6 ? String(value).slice(0, 5) + '..' : value
                        }
                    },
                    yAxis: {
                        type: 'value',
                        nameLocation: 'middle',
                        nameGap: 60
                    },
                    grid: { bottom: 100, left: 90, right: 20, top: yKeys.length > 1 ? 60 : 50 },
                    series: barSeries
                };
                break;


            case 'line':
                // Multi Y series oluştur
                const lineSeries = [];
                const lineYKeys = Object.keys(multiYData);

                if (lineYKeys.length > 0) {
                    lineYKeys.forEach((yCol, idx) => {
                        lineSeries.push({
                            name: yCol,
                            type: 'line',
                            smooth: true,
                            data: multiYData[yCol],
                            itemStyle: { color: idx === 0 ? config.color : colorPalette[idx % colorPalette.length] }
                        });
                    });
                } else {
                    lineSeries.push({
                        type: 'line',
                        data: yData,
                        smooth: true,
                        itemStyle: { color: config.color }
                    });
                }

                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'axis' },
                    legend: lineYKeys.length > 1 ? { top: 30, data: lineYKeys } : undefined,
                    xAxis: {
                        type: 'category',
                        data: xData,
                        name: config.xAxis || '',
                        nameLocation: 'center',
                        nameGap: 35,
                        axisLabel: {
                            rotate: 60,
                            interval: 0,
                            fontSize: 10,
                            formatter: (value) => String(value).length > 8 ? String(value).slice(0, 6) + '..' : value
                        }
                    },
                    yAxis: {
                        type: 'value',
                        nameLocation: 'middle',
                        nameGap: 50
                    },
                    grid: { bottom: 100, left: 80, right: 20, top: lineYKeys.length > 1 ? 60 : 40 },
                    series: lineSeries
                };
                break;


            case 'pie':
            case 'doughnut':
                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                    series: [{
                        type: 'pie',
                        radius: config.type === 'doughnut' ? ['40%', '70%'] : '70%',
                        data: xData.map((name, i) => ({ value: yData[i], name })),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                break;

            case 'area':
                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'axis' },
                    xAxis: {
                        type: 'category',
                        data: xData,
                        name: config.xAxis || '',
                        nameLocation: 'center',
                        nameGap: 35,
                        boundaryGap: false,
                        axisLabel: {
                            rotate: 60,
                            interval: 0,
                            fontSize: 10,
                            formatter: (value) => String(value).length > 8 ? String(value).slice(0, 6) + '..' : value
                        }
                    },
                    yAxis: {
                        type: 'value',
                        name: config.yAxis || '',
                        nameLocation: 'middle',
                        nameGap: 50
                    },
                    grid: { bottom: 100, left: 80 },
                    series: [{
                        type: 'line',
                        data: yData,
                        areaStyle: { color: config.color + '40' },
                        itemStyle: { color: config.color }
                    }]
                };
                break;

            case 'scatter':
                // Multi X ve Y desteği - dizi veya string olabilir
                const scatterXCols = Array.isArray(config.xAxis) ? config.xAxis : (config.xAxis ? [config.xAxis] : []);
                const scatterYCols = Array.isArray(config.yAxis) ? config.yAxis : (config.yAxis ? [config.yAxis] : []);

                // İlk X ve Y sütunlarını kullan (scatter için en az 1'er tane gerekli)
                const scatterXCol = scatterXCols[0] || '';
                const scatterYCol = scatterYCols[0] || '';

                // Scatter data oluştur
                const scatterData = [];
                const scatterLimit = config.dataLimit || 500; // Scatter için daha fazla nokta

                if (scatterXCol && scatterYCol) {
                    for (let i = 0; i < Math.min(chartData.length, scatterLimit); i++) {
                        const xVal = parseFloat(chartData[i][scatterXCol]);
                        const yVal = parseFloat(chartData[i][scatterYCol]);
                        if (!isNaN(xVal) && !isNaN(yVal)) {
                            scatterData.push([xVal, yVal]);
                        }
                    }
                }

                console.log('🔍 Scatter DEBUG - X:', scatterXCol, 'Y:', scatterYCol, 'Points:', scatterData.length);

                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: {
                        trigger: 'item',
                        formatter: (p) => `${scatterXCol}: ${p.value[0]}<br/>${scatterYCol}: ${p.value[1]}`
                    },
                    xAxis: {
                        type: 'value',
                        name: scatterXCol || 'X',
                        nameLocation: 'middle',
                        nameGap: 35
                    },
                    yAxis: {
                        type: 'value',
                        name: scatterYCol || 'Y',
                        nameLocation: 'middle',
                        nameGap: 55
                    },
                    grid: { bottom: 60, left: 80, right: 20, top: 40 },
                    series: [{
                        type: 'scatter',
                        data: scatterData,
                        symbolSize: 10,
                        itemStyle: { color: config.color }
                    }]
                };
                break;


            default:
                // Fallback to bar
                option = buildChartOption({ ...config, type: 'bar' }, xData, yData, chartData);
        }

        return option;
    }

    /**
     * Select a chart for editing
     * @param {string} chartId - Chart ID
     */
    function selectChart(chartId) {
        const state = window.VIZ_STATE;
        if (!state) return;

        state.selectedChart = chartId;

        // Remove selection from all
        document.querySelectorAll('.viz-chart-widget').forEach(w => {
            w.classList.remove('selected');
        });

        // Add selection to current
        const widget = document.getElementById(chartId);
        if (widget) {
            widget.classList.add('selected');
        }

        // Update settings panel
        const config = state.charts.find(c => c.id === chartId);
        if (config) {
            populateSettingsPanel(config);
        }
    }

    /**
     * Populate the settings panel with chart config
     */
    function populateSettingsPanel(config) {
        const state = window.VIZ_STATE;

        const titleInput = document.getElementById('chartTitle');
        const xSelect = document.getElementById('chartXAxis');
        const ySelect = document.getElementById('chartYAxis');
        const aggSelect = document.getElementById('chartAggregation');
        const colorInput = document.getElementById('chartColor');
        const scatterXHint = document.getElementById('scatterXHint');

        // Populate form fields
        if (titleInput) titleInput.value = config.title || '';
        if (aggSelect) aggSelect.value = config.aggregation || 'sum';
        if (colorInput) colorInput.value = config.color || '#4a90d9';

        // Show settings form, hide "no selection" message
        const settingsForm = document.getElementById('vizSettingsForm');
        const noSelection = document.getElementById('vizNoSelection');

        if (settingsForm) settingsForm.style.display = 'block';
        if (noSelection) noSelection.style.display = 'none';

        // Show settings pane (make it visible/active)
        const settingsPane = document.getElementById('vizSettingsPane');
        if (settingsPane) {
            settingsPane.classList.add('active');
        }

        // SCATTER MULTI-X: Enable multi-select for X axis when scatter is selected
        console.log('📊 populateSettingsPanel - Chart type:', config.type);
        if (config.type === 'scatter') {
            console.log('🔵 Enabling multi-X for scatter chart');
            if (xSelect) {
                xSelect.multiple = true;
                xSelect.size = 4; // Y ile aynı boyut
            }
            if (scatterXHint) {
                scatterXHint.style.display = 'block';
            }
        } else {
            // Reset to single select for other chart types
            if (xSelect) {
                xSelect.multiple = false;
                xSelect.size = 1;
            }
            if (scatterXHint) {
                scatterXHint.style.display = 'none';
            }
        }

        // Update dropdowns with current columns
        if (typeof updateDropdowns === 'function') {
            updateDropdowns();
        }

        // Re-select current values after dropdown update (multi-select destekli)
        setTimeout(() => {
            // X ekseni - scatter için dizi, diğerleri için string
            if (xSelect) {
                if (config.type === 'scatter' && Array.isArray(config.xAxis)) {
                    Array.from(xSelect.options).forEach(opt => opt.selected = false);
                    config.xAxis.forEach(x => {
                        const option = xSelect.querySelector(`option[value="${x}"]`);
                        if (option) option.selected = true;
                    });
                } else {
                    xSelect.value = Array.isArray(config.xAxis) ? config.xAxis[0] : (config.xAxis || '');
                }
            }

            // Y ekseni - her zaman dizi olabilir
            if (ySelect) {
                Array.from(ySelect.options).forEach(opt => opt.selected = false);
                const yAxes = Array.isArray(config.yAxis) ? config.yAxis : (config.yAxis ? [config.yAxis] : []);
                yAxes.forEach(y => {
                    const option = ySelect.querySelector(`option[value="${y}"]`);
                    if (option) option.selected = true;
                });
            }
        }, 50);

        console.log('Settings panel populated for:', config.id);
    }


    /**
     * Apply chart settings from panel
     */
    function applyChartSettings() {
        const state = window.VIZ_STATE;
        if (!state || !state.selectedChart) return;

        const config = state.charts.find(c => c.id === state.selectedChart);
        if (!config) return;

        // Get values from form
        const titleInput = document.getElementById('chartTitle');
        const xSelect = document.getElementById('chartXAxis');
        const ySelect = document.getElementById('chartYAxis');
        const aggSelect = document.getElementById('chartAggregation');
        const colorInput = document.getElementById('chartColor');

        if (titleInput) config.title = titleInput.value;

        // X ekseni - scatter için multi-select, diğerleri için tekli
        if (xSelect) {
            if (config.type === 'scatter' && xSelect.multiple) {
                const selectedXAxes = Array.from(xSelect.selectedOptions)
                    .map(opt => opt.value)
                    .filter(v => v);
                console.log('🔍 applySettings DEBUG - selectedXAxes (scatter):', JSON.stringify(selectedXAxes));
                config.xAxis = selectedXAxes;
            } else {
                config.xAxis = xSelect.value;
            }
        }

        // Y ekseni - multi-select desteği (selectedOptions'dan dizi olarak al)
        if (ySelect) {
            const selectedYAxes = Array.from(ySelect.selectedOptions)
                .map(opt => opt.value)
                .filter(v => v); // Boş değerleri filtrele
            console.log('🔍 applySettings DEBUG - selectedYAxes:', JSON.stringify(selectedYAxes));
            config.yAxis = selectedYAxes; // Her zaman dizi olarak kaydet
        }


        if (aggSelect) config.aggregation = aggSelect.value;
        if (colorInput) config.color = colorInput.value;

        // Update widget title
        const widget = document.getElementById(config.id);
        const titleEl = widget?.querySelector('.viz-widget-title');
        if (titleEl) titleEl.textContent = config.title;

        // Re-render chart
        renderChart(config);

        if (typeof showToast === 'function') {
            showToast('Grafik güncellendi', 'success');
        }
    }


    /**
     * Delete selected chart
     */
    function deleteSelectedChart() {
        const state = window.VIZ_STATE;
        if (!state || !state.selectedChart) return;

        const chartId = state.selectedChart;

        // Remove from DOM
        const widget = document.getElementById(chartId);
        if (widget) widget.remove();

        // Dispose ECharts instance
        if (state.echartsInstances[chartId]) {
            state.echartsInstances[chartId].dispose();
            delete state.echartsInstances[chartId];
        }

        // Remove resize observer
        if (state.resizeObservers && state.resizeObservers[chartId]) {
            state.resizeObservers[chartId].disconnect();
            delete state.resizeObservers[chartId];
        }

        // Remove from charts array
        state.charts = state.charts.filter(c => c.id !== chartId);
        state.selectedChart = null;

        if (typeof updateEmptyState === 'function') {
            updateEmptyState();
        }

        if (typeof showToast === 'function') {
            showToast('Grafik silindi', 'info');
        }
    }

    /**
     * Show/hide settings panel
     */
    function hideSettings() {
        const settingsPane = document.getElementById('vizSettingsPane');
        const settingsForm = document.getElementById('vizSettingsForm');
        const noSelection = document.getElementById('vizNoSelection');

        if (settingsPane) {
            settingsPane.classList.remove('active');
        }
        if (settingsForm) settingsForm.style.display = 'none';
        if (noSelection) noSelection.style.display = 'flex';

        const state = window.VIZ_STATE;
        if (state) state.selectedChart = null;
    }

    /**
     * Update empty state message
     */
    function updateEmptyState() {
        const state = window.VIZ_STATE;
        const dashboard = document.getElementById('vizDashboardGrid');
        // Try both possible IDs for backward compatibility
        const emptyState = document.getElementById('vizEmptyCanvas') || document.getElementById('vizEmptyState');

        if (!dashboard || !emptyState) return;

        const hasCharts = state && state.charts && state.charts.length > 0;
        const hasWidgets = dashboard.querySelectorAll('.viz-chart-widget, .viz-stat-widget').length > 0;

        if (hasCharts || hasWidgets) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'flex';
        }
    }

    /**
     * Clear all charts from dashboard
     */
    function clearDashboard() {
        const state = window.VIZ_STATE;
        if (!state) return;

        // Dispose all ECharts instances
        Object.keys(state.echartsInstances).forEach(id => {
            if (state.echartsInstances[id]) {
                state.echartsInstances[id].dispose();
            }
        });
        state.echartsInstances = {};

        // Clear resize observers
        if (state.resizeObservers) {
            Object.values(state.resizeObservers).forEach(obs => obs.disconnect());
            state.resizeObservers = {};
        }

        // Clear charts array
        state.charts = [];
        state.selectedChart = null;

        // Clear DOM
        const dashboard = document.getElementById('vizDashboardGrid');
        if (dashboard) {
            dashboard.querySelectorAll('.viz-chart-widget, .viz-stat-widget').forEach(w => w.remove());
        }

        updateEmptyState();

        if (typeof showToast === 'function') {
            showToast('Dashboard temizlendi', 'info');
        }
    }

    // Global exports
    window.addChart = addChart;
    window.createChartWidget = createChartWidget;
    window.renderChart = renderChart;
    window.buildChartOption = buildChartOption;
    window.selectChart = selectChart;
    window.populateSettingsPanel = populateSettingsPanel;
    window.applyChartSettings = applyChartSettings;
    window.deleteSelectedChart = deleteSelectedChart;
    window.hideSettings = hideSettings;
    window.updateEmptyState = updateEmptyState;
    window.clearDashboard = clearDashboard;
    window.CHART_COLORS = CHART_COLORS;

    console.log('✅ viz-charts-basic.js Loaded');
})();
