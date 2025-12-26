
/**
 * viz/charts/manager.js
 * Chart Management System - PORTED FROM LEGACY VIZ.JS (IIFE Version)
 */

(function () {
    'use strict';

    // Access Global State
    // window.VIZ_STATE expected

    // =====================================================
    // CHART MANAGEMENT (Legacy Implementation)
    // =====================================================

    function addChart(type = 'bar') {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (!state.charts) state.charts = [];

        state.chartCounter = (state.chartCounter || 0) + 1;
        const chartId = `chart_${state.chartCounter}`;

        const chartConfig = {
            id: chartId,
            type: type,
            title: `Grafik ${state.chartCounter}`,
            xAxis: state.columns[0] || '',
            yAxis: state.columns[1] || state.columns[0] || '',
            yAxes: [state.columns[1] || state.columns[0] || ''],
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
        updateEmptyState();

        // Seç ve ayarları göster
        selectChart(chartId);
    }

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

        // Grafik render (Call global renderChart)
        if (typeof window.renderChart === 'function') {
            window.renderChart(config);
        }

        // ResizeObserver
        if (typeof ResizeObserver !== 'undefined') {
            const chartContainer = document.getElementById(`${config.id}_chart`);
            if (chartContainer) {
                const resizeObserver = new ResizeObserver(() => {
                    const chart = window.VIZ_STATE.echartsInstances[config.id];
                    if (chart) chart.resize();
                });
                resizeObserver.observe(chartContainer);

                if (!window.VIZ_STATE.resizeObservers) window.VIZ_STATE.resizeObservers = {};
                window.VIZ_STATE.resizeObservers[config.id] = resizeObserver;
            }
        }
    }

    function showWidgetMenu(chartId, event) {
        closeWidgetMenu();

        const widget = document.getElementById(chartId);
        const isFullscreen = widget && widget.classList.contains('viz-widget-fullscreen');

        const menu = document.createElement('div');
        menu.id = 'widgetActionMenu';
        menu.className = 'viz-widget-menu';
        menu.innerHTML = `
            <div class="viz-widget-menu-item" onclick="editWidget('${chartId}'); closeWidgetMenu();">
                <i class="fas fa-edit"></i> Düzenle
            </div>
            <div class="viz-widget-menu-item" onclick="toggleWidgetFullscreen('${chartId}'); closeWidgetMenu();">
                <i class="fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}"></i> ${isFullscreen ? 'Küçült' : 'Büyüt'}
            </div>
            <div class="viz-widget-menu-item" onclick="duplicateWidget('${chartId}'); closeWidgetMenu();">
                <i class="fas fa-copy"></i> Kopyala
            </div>
            <div class="viz-widget-menu-item viz-menu-danger" onclick="removeWidget('${chartId}'); closeWidgetMenu();">
                <i class="fas fa-trash"></i> Sil
            </div>
        `;

        const rect = event.target.closest('button').getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.zIndex = '10001';

        const menuWidth = 160;
        if (rect.left + menuWidth > window.innerWidth) {
            menu.style.right = `${window.innerWidth - rect.right}px`;
        } else {
            menu.style.left = `${rect.left}px`;
        }

        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener('click', closeWidgetMenu);
        }, 100);
    }

    function closeWidgetMenu() {
        const menu = document.getElementById('widgetActionMenu');
        if (menu) menu.remove();
        document.removeEventListener('click', closeWidgetMenu);
    }

    function editWidget(chartId) {
        selectChart(chartId);
        const settingsPane = document.getElementById('vizSettingsPane');
        if (settingsPane) {
            settingsPane.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function toggleWidgetFullscreen(chartId) {
        const widget = document.getElementById(chartId);
        if (!widget) return;

        const isFullscreen = widget.classList.contains('viz-widget-fullscreen');

        if (isFullscreen) {
            widget.classList.remove('viz-widget-fullscreen');
            widget.style.width = '';
            widget.style.height = '';
        } else {
            widget.classList.add('viz-widget-fullscreen');
        }

        setTimeout(() => {
            const chart = window.VIZ_STATE.echartsInstances[chartId];
            if (chart) chart.resize();
        }, 350);
    }

    function duplicateWidget(chartId) {
        const state = window.VIZ_STATE;
        const config = state.charts.find(c => c.id === chartId);
        if (!config) return;

        state.chartCounter++;
        const newConfig = {
            ...config,
            id: `chart_${state.chartCounter}`,
            title: `${config.title} (Kopya)`
        };

        state.charts.push(newConfig);
        createChartWidget(newConfig);
    }

    function startWidgetResize(event, chartId) {
        event.preventDefault();
        event.stopPropagation();

        const widget = document.getElementById(chartId);
        if (!widget) return;
        if (widget.classList.contains('viz-widget-fullscreen')) return;

        const chartContainer = document.getElementById(`${chartId}_chart`);
        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = widget.offsetWidth;
        const startHeight = widget.offsetHeight;
        const chart = window.VIZ_STATE.echartsInstances[chartId];
        const headerHeight = 45;

        let resizeThrottle = null;

        function doResize(e) {
            const newWidth = Math.max(200, startWidth + e.clientX - startX);
            const newHeight = Math.max(150, startHeight + e.clientY - startY);

            widget.style.width = `${newWidth}px`;
            widget.style.height = `${newHeight}px`;

            if (chartContainer) {
                chartContainer.style.width = `${newWidth - 20}px`;
                chartContainer.style.height = `${newHeight - headerHeight - 10}px`;
            }

            if (!resizeThrottle) {
                resizeThrottle = setTimeout(() => {
                    if (chart) chart.resize();
                    resizeThrottle = null;
                }, 30);
            }
        }

        function stopResize() {
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            if (chart) chart.resize();
        }

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }

    function selectChart(chartId) {
        window.VIZ_STATE.selectedChart = chartId;

        document.querySelectorAll('.viz-chart-widget').forEach(el => el.classList.remove('active'));
        document.getElementById(chartId)?.classList.add('active');

        if (typeof window.showSettings === 'function') {
            window.showSettings(chartId);
        } else {
            // Fallback
            const noSel = document.getElementById('vizNoSelection');
            const form = document.getElementById('vizSettingsForm');
            if (noSel) noSel.style.display = 'none';
            if (form) form.style.display = 'block';
        }
    }

    function updateEmptyState() {
        const empty = document.getElementById('vizEmptyCanvas');
        const dashboard = document.getElementById('vizDashboardGrid');
        if (empty && dashboard) {
            // Tüm widget'ları say (grafik ve stat widget'ları dahil)
            const widgetCount = dashboard.querySelectorAll('.viz-chart-widget').length;
            empty.style.display = widgetCount === 0 ? 'flex' : 'none';
        }
    }

    function populateSettingsPanel(config) {
        // config parametresi yoksa selectedChart'tan al
        const state = window.VIZ_STATE;
        if (!config && state.selectedChart) {
            config = state.charts.find(c => c.id === state.selectedChart);
        }
        if (!config) return;

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
        if (config.type === 'scatter') {
            if (xSelect) {
                xSelect.multiple = true;
                xSelect.style.height = '100px';
            }
            if (scatterXHint) {
                scatterXHint.style.display = 'block';
            }
        } else {
            // Reset to single select for other chart types
            if (xSelect) {
                xSelect.multiple = false;
                xSelect.style.height = '';
            }
            if (scatterXHint) {
                scatterXHint.style.display = 'none';
            }
        }

        // Update dropdowns with current columns if global function exists
        if (typeof window.updateDropdowns === 'function') {
            window.updateDropdowns();
        }

        // Re-select current values after dropdown update (timeout to ensure options are rendered)
        setTimeout(() => {
            // X ekseni
            if (xSelect) {
                if (config.type === 'scatter' && (Array.isArray(config.xAxis) || Array.isArray(config.xAxes))) {
                    const xVals = config.xAxes || config.xAxis;
                    Array.from(xSelect.options).forEach(opt => opt.selected = false);
                    xVals.forEach(x => {
                        const option = xSelect.querySelector(`option[value="${x}"]`);
                        if (option) option.selected = true;
                    });
                } else {
                    xSelect.value = Array.isArray(config.xAxis) ? config.xAxis[0] : (config.xAxis || '');
                }
            }

            // Y ekseni - her zaman dizi olabilir (Multi-Y support)
            if (ySelect) {
                Array.from(ySelect.options).forEach(opt => opt.selected = false);
                // config.yAxis string veya array olabilir, config.yAxes arraydir.
                const yAxes = config.yAxes || (Array.isArray(config.yAxis) ? config.yAxis : (config.yAxis ? [config.yAxis] : []));

                yAxes.forEach(y => {
                    // Option value değerleri bazen selector ile uyuşmayabilir, dikkat
                    // Burada basitleştirilmiş bir eşleştirme yapıyoruz
                    const option = ySelect.querySelector(`option[value="${y}"]`);
                    if (option) option.selected = true;
                });
            }
        }, 50);
    }

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

        // X ekseni
        if (xSelect) {
            if (config.type === 'scatter' && xSelect.multiple) {
                const selectedXAxes = Array.from(xSelect.selectedOptions).map(opt => opt.value).filter(v => v);
                config.xAxis = selectedXAxes; // Scatter için array kaydet
                config.xAxes = selectedXAxes;
            } else {
                config.xAxis = xSelect.value;
            }
        }

        // Y ekseni - selectedOptions'dan dizi olarak al
        if (ySelect) {
            const selectedYAxes = Array.from(ySelect.selectedOptions).map(opt => opt.value).filter(v => v);
            config.yAxis = selectedYAxes; // Her zaman dizi veya ana değer
            config.yAxes = selectedYAxes;
        }

        if (aggSelect) config.aggregation = aggSelect.value;
        if (colorInput) config.color = colorInput.value;

        // Update widget title
        const widget = document.getElementById(config.id);
        const titleEl = widget?.querySelector('.viz-widget-title');
        if (titleEl) titleEl.textContent = config.title;

        // Re-render chart
        if (typeof window.renderChart === 'function') {
            window.renderChart(config);
        }

        if (typeof showToast === 'function') {
            showToast('Grafik güncellendi', 'success');
        }
    }

    // Explicitly add showSettings alias
    window.showSettings = populateSettingsPanel;

    function removeWidget(chartId) {
        const state = window.VIZ_STATE;
        const idx = state.charts.findIndex(c => c.id === chartId);
        if (idx > -1) state.charts.splice(idx, 1);

        const widget = document.getElementById(chartId);
        if (widget) widget.remove();

        if (state.selectedChart === chartId) {
            state.selectedChart = null;
            const noSel = document.getElementById('vizNoSelection');
            const form = document.getElementById('vizSettingsForm');
            if (noSel) noSel.style.display = 'flex';
            if (form) form.style.display = 'none';
        }
        updateEmptyState();
    }

    // Global Exports
    window.addChart = addChart;
    window.createChartWidget = createChartWidget;
    window.showWidgetMenu = showWidgetMenu;
    window.closeWidgetMenu = closeWidgetMenu;
    window.editWidget = editWidget;
    window.toggleWidgetFullscreen = toggleWidgetFullscreen;
    window.duplicateWidget = duplicateWidget;
    window.startWidgetResize = startWidgetResize;
    window.removeWidget = removeWidget;
    window.selectChart = selectChart;

    console.log('✅ manager.js Loaded (IIFE)');

})();
