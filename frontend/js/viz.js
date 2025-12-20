// =====================================================
// VIZ.JS - Opradox Visual Studio
// Canlı Dashboard Builder - ECharts entegrasyonu
// =====================================================

// -----------------------------------------------------
// GLOBAL STATE
// -----------------------------------------------------
const VIZ_STATE = {
    data: null,           // Yüklenen veri (DataFrame)
    columns: [],          // Sütun isimleri
    charts: [],           // Oluşturulmuş grafikler
    selectedChart: null,  // Şu an seçili grafik
    chartCounter: 0,      // Grafik ID sayacı
    lang: 'tr'            // Dil
};

// Lokalizasyon
const VIZ_TEXTS = {
    tr: {
        viz_subtitle: 'Visual Studio',
        data_columns: 'Veri Sütunları',
        drop_excel: 'Excel dosyası sürükleyin',
        no_data_loaded: 'Veri yükleyin',
        chart_types: 'Grafik Tipleri',
        chart_bar: 'Sütun',
        chart_line: 'Çizgi',
        chart_pie: 'Pasta',
        chart_area: 'Alan',
        chart_scatter: 'Dağılım',
        chart_doughnut: 'Halka',
        dashboard: 'Dashboard',
        live: 'CANLI',
        add_chart: 'Grafik Ekle',
        empty_dashboard_title: "Dashboard'unuz Boş",
        empty_dashboard_desc: 'Sol taraftan grafik tipini sürükleyin veya "Grafik Ekle" butonuna tıklayın',
        chart_settings: 'Grafik Ayarları',
        select_chart: 'Düzenlemek için bir grafik seçin',
        chart_title: 'Grafik Başlığı',
        x_axis: 'X Ekseni (Kategori)',
        y_axis: 'Y Ekseni (Değer)',
        aggregation: 'Agregasyon',
        agg_sum: 'Toplam',
        agg_avg: 'Ortalama',
        agg_count: 'Sayı',
        agg_min: 'Minimum',
        agg_max: 'Maksimum',
        color: 'Renk',
        apply: 'Uygula',
        delete_chart: 'Grafiği Sil',
        save: 'Kaydet',
        export: 'Export',
        file_loaded: 'Dosya yüklendi',
        error: 'Hata',
        chart_added: 'Grafik eklendi'
    },
    en: {
        viz_subtitle: 'Visual Studio',
        data_columns: 'Data Columns',
        drop_excel: 'Drop Excel file here',
        no_data_loaded: 'Load data',
        chart_types: 'Chart Types',
        chart_bar: 'Bar',
        chart_line: 'Line',
        chart_pie: 'Pie',
        chart_area: 'Area',
        chart_scatter: 'Scatter',
        chart_doughnut: 'Doughnut',
        dashboard: 'Dashboard',
        live: 'LIVE',
        add_chart: 'Add Chart',
        empty_dashboard_title: 'Your Dashboard is Empty',
        empty_dashboard_desc: 'Drag a chart type from left panel or click "Add Chart"',
        chart_settings: 'Chart Settings',
        select_chart: 'Select a chart to edit',
        chart_title: 'Chart Title',
        x_axis: 'X Axis (Category)',
        y_axis: 'Y Axis (Value)',
        aggregation: 'Aggregation',
        agg_sum: 'Sum',
        agg_avg: 'Average',
        agg_count: 'Count',
        agg_min: 'Minimum',
        agg_max: 'Maximum',
        color: 'Color',
        apply: 'Apply',
        delete_chart: 'Delete Chart',
        save: 'Save',
        export: 'Export',
        file_loaded: 'File loaded',
        error: 'Error',
        chart_added: 'Chart added'
    }
};

// -----------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initVizStudio();
    loadSavedTheme();
    loadSavedLang();
    setupEventListeners();
    setupDragAndDrop();
});

function initVizStudio() {
    console.log('Visual Studio başlatıldı');
    updateEmptyState();
}

// -----------------------------------------------------
// THEME & LANGUAGE
// -----------------------------------------------------
function loadSavedTheme() {
    const saved = localStorage.getItem('opradox_theme');
    if (saved === 'day') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
    }
}

function loadSavedLang() {
    const saved = localStorage.getItem('opradox_lang') || 'tr';
    VIZ_STATE.lang = saved;
    updateLangLabel();
    applyLocalization();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', !isDark);
    document.body.classList.toggle('day-mode', isDark);
    localStorage.setItem('opradox_theme', isDark ? 'day' : 'dark');

    // Logo güncelle
    const logo = document.getElementById('vizLogo');
    if (logo) {
        logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
    }
}

function toggleLang() {
    VIZ_STATE.lang = VIZ_STATE.lang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('opradox_lang', VIZ_STATE.lang);
    updateLangLabel();
    applyLocalization();
}

function updateLangLabel() {
    const label = document.getElementById('langLabel');
    if (label) {
        label.textContent = VIZ_STATE.lang === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 En | Tr';
    }
}

function applyLocalization() {
    const texts = VIZ_TEXTS[VIZ_STATE.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });
}

// -----------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------
function setupEventListeners() {
    // Theme & Language
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('langToggle')?.addEventListener('click', toggleLang);

    // File Input
    document.getElementById('vizFileInput')?.addEventListener('change', handleFileSelect);
    document.getElementById('vizFileRemove')?.addEventListener('click', clearData);
    document.getElementById('loadDataBtn')?.addEventListener('click', () => {
        document.getElementById('vizFileInput')?.click();
    });

    // Add Chart
    document.getElementById('addChartBtn')?.addEventListener('click', () => addChart('bar'));
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearDashboard);

    // Settings panel
    document.getElementById('closeSettingsBtn')?.addEventListener('click', hideSettings);
    document.getElementById('applySettingsBtn')?.addEventListener('click', applyChartSettings);
    document.getElementById('deleteChartBtn')?.addEventListener('click', deleteSelectedChart);

    // Color picker update
    document.getElementById('chartColor')?.addEventListener('input', (e) => {
        const preview = document.querySelector('.viz-color-preview');
        if (preview) preview.style.background = e.target.value;
    });
}

// -----------------------------------------------------
// DRAG & DROP
// -----------------------------------------------------
function setupDragAndDrop() {
    // Dosya drop zone
    const dropZone = document.getElementById('vizDropZone');
    if (dropZone) {
        dropZone.addEventListener('click', () => {
            document.getElementById('vizFileInput')?.click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                loadFile(files[0]);
            }
        });
    }

    // Chart type drag
    document.querySelectorAll('.viz-chart-type').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('chartType', el.dataset.type);
        });
    });

    // Dashboard drop
    const dashboard = document.getElementById('vizDashboardGrid');
    if (dashboard) {
        dashboard.addEventListener('dragover', (e) => {
            e.preventDefault();
            dashboard.classList.add('drag-over');
        });

        dashboard.addEventListener('dragleave', () => {
            dashboard.classList.remove('drag-over');
        });

        dashboard.addEventListener('drop', (e) => {
            e.preventDefault();
            dashboard.classList.remove('drag-over');
            const chartType = e.dataTransfer.getData('chartType');
            if (chartType) {
                addChart(chartType);
            }
        });
    }
}

// -----------------------------------------------------
// FILE HANDLING
// -----------------------------------------------------
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadFile(file);
    }
}

async function loadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/ui/inspect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Dosya yüklenemedi');

        const data = await response.json();

        VIZ_STATE.data = data;
        VIZ_STATE.columns = data.columns || [];

        // UI güncelle
        document.getElementById('vizDropZone').style.display = 'none';
        document.getElementById('vizFileInfo').style.display = 'block';
        document.getElementById('vizFileName').textContent = file.name;

        renderColumnsList();
        updateDropdowns();

    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        alert(VIZ_TEXTS[VIZ_STATE.lang].error + ': ' + error.message);
    }
}

function clearData() {
    VIZ_STATE.data = null;
    VIZ_STATE.columns = [];

    document.getElementById('vizDropZone').style.display = 'flex';
    document.getElementById('vizFileInfo').style.display = 'none';
    document.getElementById('vizFileInput').value = '';

    renderColumnsList();
    updateDropdowns();
}

function renderColumnsList() {
    const container = document.getElementById('vizColumnsList');
    if (!container) return;

    if (VIZ_STATE.columns.length === 0) {
        container.innerHTML = `
            <div class="viz-no-data" data-i18n="no_data_loaded">
                <i class="fas fa-info-circle"></i>
                ${VIZ_TEXTS[VIZ_STATE.lang].no_data_loaded}
            </div>
        `;
        return;
    }

    container.innerHTML = VIZ_STATE.columns.map((col, i) => `
        <div class="viz-column-chip" draggable="true" data-column="${col}">
            <i class="fas fa-columns"></i>
            <span>${col}</span>
        </div>
    `).join('');

    // Sütun drag
    container.querySelectorAll('.viz-column-chip').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('column', el.dataset.column);
        });
    });
}

function updateDropdowns() {
    const xSelect = document.getElementById('chartXAxis');
    const ySelect = document.getElementById('chartYAxis');

    const optionsHtml = '<option value="">Seçin...</option>' +
        VIZ_STATE.columns.map(col => `<option value="${col}">${col}</option>`).join('');

    if (xSelect) xSelect.innerHTML = optionsHtml;
    if (ySelect) ySelect.innerHTML = optionsHtml;
}

// -----------------------------------------------------
// CHART MANAGEMENT
// -----------------------------------------------------
function addChart(type = 'bar') {
    const chartId = `chart_${++VIZ_STATE.chartCounter}`;

    const chartConfig = {
        id: chartId,
        type: type,
        title: `Grafik ${VIZ_STATE.chartCounter}`,
        xAxis: VIZ_STATE.columns[0] || '',
        yAxis: VIZ_STATE.columns[1] || VIZ_STATE.columns[0] || '',
        aggregation: 'sum',
        color: '#4a90d9'
    };

    VIZ_STATE.charts.push(chartConfig);

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
            <button class="viz-widget-settings" onclick="selectChart('${config.id}')">
                <i class="fas fa-cog"></i>
            </button>
        </div>
        <div class="viz-widget-chart" id="${config.id}_chart"></div>
    `;

    widget.addEventListener('click', () => selectChart(config.id));
    dashboard.appendChild(widget);

    // Grafik render
    renderChart(config);
}

function renderChart(config) {
    const chartDom = document.getElementById(`${config.id}_chart`);
    if (!chartDom) return;

    const chart = echarts.init(chartDom, document.body.classList.contains('day-mode') ? 'light' : 'dark');

    // Örnek veri (gerçek veri varsa kullan)
    let xData = ['A', 'B', 'C', 'D', 'E'];
    let yData = [120, 200, 150, 80, 70];

    if (VIZ_STATE.data && VIZ_STATE.data.preview_data) {
        // Gerçek veri varsa
        try {
            const rawData = VIZ_STATE.data.preview_data;
            if (config.xAxis && rawData.length > 0) {
                xData = rawData.map(row => row[config.xAxis] || '');
            }
            if (config.yAxis && rawData.length > 0) {
                yData = rawData.map(row => parseFloat(row[config.yAxis]) || 0);
            }
        } catch (e) {
            console.error('Veri işleme hatası:', e);
        }
    }

    let option = {};

    switch (config.type) {
        case 'bar':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData },
                yAxis: { type: 'value' },
                series: [{ data: yData, type: 'bar', itemStyle: { color: config.color } }]
            };
            break;

        case 'line':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData },
                yAxis: { type: 'value' },
                series: [{ data: yData, type: 'line', smooth: true, itemStyle: { color: config.color } }]
            };
            break;

        case 'pie':
        case 'doughnut':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item' },
                series: [{
                    type: 'pie',
                    radius: config.type === 'doughnut' ? ['40%', '70%'] : '70%',
                    data: xData.map((name, i) => ({ value: yData[i], name })),
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                }]
            };
            break;

        case 'area':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData, boundaryGap: false },
                yAxis: { type: 'value' },
                series: [{ data: yData, type: 'line', areaStyle: { color: config.color + '40' }, itemStyle: { color: config.color } }]
            };
            break;

        case 'scatter':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item' },
                xAxis: { type: 'value' },
                yAxis: { type: 'value' },
                series: [{
                    type: 'scatter',
                    data: yData.map((v, i) => [i * 10, v]),
                    itemStyle: { color: config.color }
                }]
            };
            break;

        default:
            option = {
                title: { text: config.title, left: 'center' },
                series: []
            };
    }

    chart.setOption(option);

    // Resize handler
    window.addEventListener('resize', () => chart.resize());
}

function selectChart(chartId) {
    // Önceki seçimi kaldır
    document.querySelectorAll('.viz-chart-widget').forEach(w => w.classList.remove('selected'));

    // Yeni seçimi uygula
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

    // Ayarları güncelle
    config.title = document.getElementById('chartTitle').value;
    config.xAxis = document.getElementById('chartXAxis').value;
    config.yAxis = document.getElementById('chartYAxis').value;
    config.aggregation = document.getElementById('chartAggregation').value;
    config.color = document.getElementById('chartColor').value;

    // Widget başlığını güncelle
    const widget = document.getElementById(config.id);
    if (widget) {
        widget.querySelector('.viz-widget-title').textContent = config.title;
    }

    // Grafiği yeniden render et
    renderChart(config);
}

function deleteSelectedChart() {
    if (!VIZ_STATE.selectedChart) return;

    const chartId = VIZ_STATE.selectedChart;

    // DOM'dan kaldır
    const widget = document.getElementById(chartId);
    if (widget) widget.remove();

    // State'den kaldır
    VIZ_STATE.charts = VIZ_STATE.charts.filter(c => c.id !== chartId);

    hideSettings();
    updateEmptyState();
}

function clearDashboard() {
    VIZ_STATE.charts.forEach(c => {
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
    if (empty) {
        empty.style.display = VIZ_STATE.charts.length === 0 ? 'flex' : 'none';
    }
}

// Global fonksiyonlar (HTML onclick için)
window.selectChart = selectChart;
