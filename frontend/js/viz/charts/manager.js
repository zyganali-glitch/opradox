import { VIZ_STATE } from '../core/state.js';
import { createChartWidget, renderChart, rerenderAllCharts } from './engine.js';
import { showToast } from '../core/utils.js';
import { VIZ_TEXTS, getText } from '../core/i18n.js';

// Will add exports at the end

function addChart(type = 'bar') {
    const chartId = `chart_${++VIZ_STATE.chartCounter}`;

    const chartConfig = {
        id: chartId,
        type: type,
        title: `Grafik ${VIZ_STATE.chartCounter}`,
        xAxis: VIZ_STATE.columns[0] || '',
        yAxis: VIZ_STATE.columns[1] || VIZ_STATE.columns[0] || '',
        aggregation: 'sum',
        color: '#4a90d9',
        dataLimit: 20,  // VarsayÄ±lan veri limiti (0 = sÄ±nÄ±rsÄ±z)
        datasetId: VIZ_STATE.activeDatasetId  // Multi-dataset desteÄŸi
    };

    VIZ_STATE.charts.push(chartConfig);

    // Widget oluÅŸtur
    createChartWidget(chartConfig);
    updateEmptyState();

    // SeÃ§ ve ayarlarÄ± gÃ¶ster
    selectChart(chartId);
}
/**
 * Widget ayar menÃ¼sÃ¼nÃ¼ gÃ¶ster
 */
function showWidgetMenu(chartId, event) {
    // Mevcut menÃ¼yÃ¼ kapat
    closeWidgetMenu();

    const widget = document.getElementById(chartId);
    const isFullscreen = widget && widget.classList.contains('viz-widget-fullscreen');

    const menu = document.createElement('div');
    menu.id = 'widgetActionMenu';
    menu.className = 'viz-widget-menu';
    menu.innerHTML = `
        <div class="viz-widget-menu-item" onclick="editWidget('${chartId}'); closeWidgetMenu();">
            <i class="fas fa-edit"></i> DÃ¼zenle
        </div>
        <div class="viz-widget-menu-item" onclick="toggleWidgetFullscreen('${chartId}'); closeWidgetMenu();">
            <i class="fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}"></i> ${isFullscreen ? 'KÃ¼Ã§Ã¼lt' : 'BÃ¼yÃ¼t'}
        </div>
        <div class="viz-widget-menu-item" onclick="duplicateWidget('${chartId}'); closeWidgetMenu();">
            <i class="fas fa-copy"></i> Kopyala
        </div>
        <div class="viz-widget-menu-item viz-menu-danger" onclick="removeWidget('${chartId}'); closeWidgetMenu();">
            <i class="fas fa-trash"></i> Sil
        </div>
    `;

    // Pozisyon - fullscreen'de sola kaydÄ±r
    const rect = event.target.closest('button').getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.zIndex = '10001';

    // Ekran saÄŸÄ±na taÅŸmasÄ±n
    const menuWidth = 160;
    if (rect.left + menuWidth > window.innerWidth) {
        menu.style.right = `${window.innerWidth - rect.right}px`;
    } else {
        menu.style.left = `${rect.left}px`;
    }

    document.body.appendChild(menu);

    // DÄ±ÅŸarÄ± tÄ±klayÄ±nca kapat
    setTimeout(() => {
        document.addEventListener('click', closeWidgetMenu);
    }, 100);
}

function closeWidgetMenu() {
    const menu = document.getElementById('widgetActionMenu');
    if (menu) menu.remove();
    document.removeEventListener('click', closeWidgetMenu);
}

/**
 * Widget dÃ¼zenleme - saÄŸ paneli aÃ§ ve grafiÄŸi seÃ§
 */
function editWidget(chartId) {
    selectChart(chartId);

    // SaÄŸ panel gÃ¶rÃ¼nÃ¼r yap
    const settingsPane = document.getElementById('vizSettingsPane');
    if (settingsPane) {
        settingsPane.scrollIntoView({ behavior: 'smooth' });
    }

    showToast('Grafik seÃ§ildi - saÄŸ panelden dÃ¼zenleyebilirsiniz', 'info');
}

/**
 * Widget tam ekran toggle
 */
function toggleWidgetFullscreen(chartId) {
    const widget = document.getElementById(chartId);
    if (!widget) return;

    const isFullscreen = widget.classList.contains('viz-widget-fullscreen');

    if (isFullscreen) {
        // KÃ¼Ã§Ã¼lt - eski boyutlara dÃ¶n
        widget.classList.remove('viz-widget-fullscreen');
        widget.style.width = '';
        widget.style.height = '';
        showToast('Normal gÃ¶rÃ¼nÃ¼m', 'info');
    } else {
        // BÃ¼yÃ¼t
        widget.classList.add('viz-widget-fullscreen');
        showToast('Tam ekran - Ã§arktan "KÃ¼Ã§Ã¼lt" ile Ã§Ä±kÄ±n', 'info');
    }

    // Grafik boyutunu gÃ¼ncelle
    setTimeout(() => {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (chart) chart.resize();
    }, 350);
}

/**
 * Widget kopyala
 */
function duplicateWidget(chartId) {
    const config = VIZ_STATE.charts.find(c => c.id === chartId);
    if (!config) return;

    const newConfig = {
        ...config,
        id: `chart_${++VIZ_STATE.chartCounter}`,
        title: `${config.title} (Kopya)`
    };

    VIZ_STATE.charts.push(newConfig);
    createChartWidget(newConfig);
    showToast('Grafik kopyalandÄ±', 'success');
}
function selectChart(chartId) {
    // Ã–nceki seÃ§imi kaldÄ±r
    document.querySelectorAll('.viz-chart-widget').forEach(w => w.classList.remove('selected'));

    // Yeni seÃ§imi uygula
    const widget = document.getElementById(chartId);
    if (widget) {
        widget.classList.add('selected');
    }

    VIZ_STATE.selectedChart = chartId;
    showSettings(chartId);
}

function showSettings(chartId) {
    const config = VIZ_STATE.charts.find(c => c.id === chartId);
    if (!config) return;

    document.getElementById('vizNoSelection').style.display = 'none';
    document.getElementById('vizSettingsForm').style.display = 'block';

    // Form doldur
    document.getElementById('chartTitle').value = config.title;
    document.getElementById('chartXAxis').value = config.xAxis;
    document.getElementById('chartYAxis').value = config.yAxis;
    document.getElementById('chartAggregation').value = config.aggregation;
    document.getElementById('chartColor').value = config.color;
    document.querySelector('.viz-color-preview').style.background = config.color;

    // Veri limiti - yeni alan
    const dataLimitInput = document.getElementById('chartDataLimit');
    if (dataLimitInput) {
        dataLimitInput.value = config.dataLimit || 20;
    }
}

function hideSettings() {
    document.getElementById('vizNoSelection').style.display = 'flex';
    document.getElementById('vizSettingsForm').style.display = 'none';
    VIZ_STATE.selectedChart = null;

    document.querySelectorAll('.viz-chart-widget').forEach(w => w.classList.remove('selected'));
}

function applyChartSettings() {
    if (!VIZ_STATE.selectedChart) return;

    const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
    if (!config) return;

    // AyarlarÄ± gÃ¼ncelle
    config.title = document.getElementById('chartTitle').value;
    config.xAxis = document.getElementById('chartXAxis').value;
    config.yAxis = document.getElementById('chartYAxis').value;
    config.aggregation = document.getElementById('chartAggregation').value;
    config.color = document.getElementById('chartColor').value;

    // Veri limiti
    const dataLimitInput = document.getElementById('chartDataLimit');
    if (dataLimitInput) {
        config.dataLimit = parseInt(dataLimitInput.value) || 0;
    }

    // Widget baÅŸlÄ±ÄŸÄ±nÄ± gÃ¼ncelle
    const widget = document.getElementById(config.id);
    if (widget) {
        widget.querySelector('.viz-widget-title').textContent = config.title;
    }

    // GrafiÄŸi yeniden render et
    renderChart(config);
    showToast('Grafik ayarlarÄ± uygulandÄ±', 'success');
}
function deleteSelectedChart() {
    if (!VIZ_STATE.selectedChart) return;

    const chartId = VIZ_STATE.selectedChart;

    // ECharts instance'Ä± temizle
    if (VIZ_STATE.echartsInstances[chartId]) {
        VIZ_STATE.echartsInstances[chartId].dispose();
        delete VIZ_STATE.echartsInstances[chartId];
    }

    // DOM'dan kaldÄ±r
    const widget = document.getElementById(chartId);
    if (widget) widget.remove();

    // State'den kaldÄ±r
    VIZ_STATE.charts = VIZ_STATE.charts.filter(c => c.id !== chartId);

    hideSettings();
    updateEmptyState();
}

function clearDashboard() {
    VIZ_STATE.charts.forEach(c => {
        if (VIZ_STATE.echartsInstances[c.id]) {
            VIZ_STATE.echartsInstances[c.id].dispose();
            delete VIZ_STATE.echartsInstances[c.id];
        }
        const widget = document.getElementById(c.id);
        if (widget) widget.remove();
    });

    VIZ_STATE.charts = [];
    VIZ_STATE.chartCounter = 0;

    hideSettings();
    updateEmptyState();
}

function updateEmptyState() {
    const empty = document.getElementById('vizEmptyCanvas');
    const dashboard = document.getElementById('vizDashboardGrid');
    if (empty && dashboard) {
        // TÃ¼m widget'larÄ± say (.viz-chart-widget tÃ¼m tipler iÃ§in kullanÄ±lÄ±yor)
        const widgetCount = dashboard.querySelectorAll('.viz-chart-widget').length;
        empty.style.display = widgetCount === 0 ? 'flex' : 'none';
    }
}

export { addChart, showWidgetMenu, closeWidgetMenu, editWidget, toggleWidgetFullscreen, duplicateWidget, selectChart, showSettings, hideSettings, applyChartSettings, deleteSelectedChart, clearDashboard, updateEmptyState };
// -----------------------------------------------------
// SAVE & EXPORT
// -----------------------------------------------------
function showSaveMenu() {
    // Basit konfirm ile kaydet
    saveDashboard();
}

function showExportMenu() {
    // Export dropdown menÃ¼ gÃ¶ster
    const menu = document.createElement('div');
    menu.className = 'viz-export-menu';
    menu.innerHTML = `
        <div class="viz-export-option" onclick="exportPNG()">
            <i class="fas fa-image"></i> ${VIZ_TEXTS[VIZ_STATE.lang].export_png}
        </div>
        <div class="viz-export-option" onclick="exportAllChartsPNG()">
            <i class="fas fa-images"></i> TÃ¼m Grafikleri PNG
        </div>
    `;

    // Pozisyon ayarla
    const btn = document.getElementById('exportBtn');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    menu.style.zIndex = '9999';

    // TÄ±klama dÄ±ÅŸÄ±nda kapat
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };

    setTimeout(() => document.addEventListener('click', closeMenu), 100);
    document.body.appendChild(menu);
}

function saveDashboard() {
    const dashboardData = {
        charts: VIZ_STATE.charts,
        chartCounter: VIZ_STATE.chartCounter,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('viz_dashboard', JSON.stringify(dashboardData));
    console.log('ğŸ’¾ Dashboard kaydedildi');

    // Toast bildirimi
    showToast(VIZ_TEXTS[VIZ_STATE.lang].dashboard_saved, 'success');
}

function loadDashboardFromStorage() {
    const saved = localStorage.getItem('viz_dashboard');
    if (!saved) return;

    try {
        const dashboardData = JSON.parse(saved);

        if (dashboardData.charts && dashboardData.charts.length > 0) {
            VIZ_STATE.chartCounter = dashboardData.chartCounter || 0;

            dashboardData.charts.forEach(config => {
                VIZ_STATE.charts.push(config);
                createChartWidget(config);
            });

            updateEmptyState();
            console.log('ğŸ“‚ Dashboard yÃ¼klendi:', dashboardData.charts.length, 'grafik');
        }
    } catch (e) {
        console.error('Dashboard yÃ¼kleme hatasÄ±:', e);
    }
}

export { saveDashboard, loadDashboardFromStorage, showSaveMenu };
