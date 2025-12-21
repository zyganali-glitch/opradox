// =====================================================
// VIZ.JS - Opradox Visual Studio (Production Version)
// Canlı Dashboard Builder - ECharts entegrasyonu
// =====================================================

// -----------------------------------------------------
// GLOBAL STATE
// -----------------------------------------------------
const VIZ_STATE = {
    file: null,           // Yüklenmş dosya (File object)
    data: null,           // Tam veri (records array)
    columns: [],          // Sütun isimleri
    columnsInfo: [],      // Sütun bilgileri (tip dahil)
    charts: [],           // Oluşturulmuş grafikler
    selectedChart: null,  // Şu an seçili grafik
    chartCounter: 0,      // Grafik ID sayacı
    lang: 'tr',           // Dil
    echartsInstances: {}  // ECharts instance'ları
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
        chart_added: 'Grafik eklendi',
        // Faz 1 yeni metinler
        export_png: 'PNG olarak indir',
        export_pdf: 'PDF olarak indir',
        save_dashboard: 'Dashboard kaydet',
        load_dashboard: 'Dashboard yükle',
        dashboard_saved: 'Dashboard kaydedildi',
        dashboard_loaded: 'Dashboard yüklendi',
        no_saved_dashboard: 'Kayıtlı dashboard bulunamadı',
        export_success: 'Export başarılı',
        loading: 'Yükleniyor...',
        // Faz 2 istatistik metinleri
        stats_overlay: 'İstatistik Overlay',
        show_mean: 'Ortalama Çizgisi',
        show_median: 'Medyan Çizgisi',
        show_std_band: 'Standart Sapma Bandı (±1σ)',
        show_trend: 'Trend Çizgisi',
        stats_summary: 'İstatistik Özeti',
        stat_mean: 'Ortalama',
        stat_median: 'Medyan',
        stat_stdev: 'Std Sapma',
        stat_min: 'Min',
        stat_max: 'Maks',
        stat_count: 'Sayı',
        // Faz 3 ileri grafik metinleri
        basic_charts: 'Temel',
        advanced_charts: 'İleri',
        chart_dual_axis: 'Dual-Axis',
        chart_stacked: 'Yığın',
        chart_treemap: 'Treemap',
        chart_heatmap: 'Isı Haritası',
        chart_funnel: 'Huni',
        chart_gauge: 'Gösterge',
        chart_waterfall: 'Şelale',
        chart_radar: 'Radar',
        chart_boxplot: 'Kutu',
        chart_pareto: 'Pareto',
        // Faz 4 3D grafik metinleri
        '3d_charts': '3D',
        chart_scatter3d: '3D Dağılım',
        chart_bar3d: '3D Sütun',
        chart_surface3d: '3D Yüzey',
        chart_line3d: '3D Çizgi',
        // Faz 5-9 yeni metinler
        statistical_analysis: 'İstatistiksel Analiz',
        bi_insights: 'BI İçgörüleri',
        data_profile: 'Veri Profili',
        run_analysis: 'Analiz Çalıştır',
        what_if_simulator: 'Ne Olur Simülatörü',
        anomaly_detection: 'Anomali Tespiti',
        trend_insight: 'Trend İçgörüsü',
        regression_type: 'Regresyon Tipi',
        linear: 'Doğrusal',
        polynomial: 'Polinom',
        exponential: 'Üstel',
        logarithmic: 'Logaritmik',
        t_test: 't-Test',
        anova: 'ANOVA',
        correlation: 'Korelasyon',
        normality: 'Normallik',
        cross_filter: 'Çapraz Filtre',
        detect_anomalies: 'Anomali Tespit',
        anomalies_found: 'anomali bulundu',
        no_anomaly: 'Anomali tespit edilmedi ✓',
        trend_up: 'Yukarı yönlü trend',
        trend_down: 'Aşağı yönlü trend',
        trend_stable: 'Stabil (belirgin trend yok)',
        data_analysis: 'Veri Analizi',
        total_rows: 'Toplam Satır',
        total_columns: 'Toplam Sütun',
        data_quality: 'Veri Kalitesi',
        column_types: 'Sütun Tipleri',
        missing_values: 'Eksik Değerler',
        no_missing: 'Eksik değer yok ✓'
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
        chart_added: 'Chart added',
        // Faz 1 yeni metinler
        export_png: 'Download as PNG',
        export_pdf: 'Download as PDF',
        save_dashboard: 'Save Dashboard',
        load_dashboard: 'Load Dashboard',
        dashboard_saved: 'Dashboard saved',
        dashboard_loaded: 'Dashboard loaded',
        no_saved_dashboard: 'No saved dashboard found',
        export_success: 'Export successful',
        loading: 'Loading...',
        // Faz 2 istatistik metinleri
        stats_overlay: 'Statistics Overlay',
        show_mean: 'Mean Line',
        show_median: 'Median Line',
        show_std_band: 'Std Deviation Band (±1σ)',
        show_trend: 'Trend Line',
        stats_summary: 'Statistics Summary',
        stat_mean: 'Mean',
        stat_median: 'Median',
        stat_stdev: 'Std Dev',
        stat_min: 'Min',
        stat_max: 'Max',
        stat_count: 'Count',
        // Faz 3 ileri grafik metinleri
        basic_charts: 'Basic',
        advanced_charts: 'Advanced',
        chart_dual_axis: 'Dual-Axis',
        chart_stacked: 'Stacked',
        chart_treemap: 'Treemap',
        chart_heatmap: 'Heatmap',
        chart_funnel: 'Funnel',
        chart_gauge: 'Gauge',
        chart_waterfall: 'Waterfall',
        chart_radar: 'Radar',
        chart_boxplot: 'Box Plot',
        chart_pareto: 'Pareto',
        // Faz 4 3D grafik metinleri
        '3d_charts': '3D',
        chart_scatter3d: '3D Scatter',
        chart_bar3d: '3D Bar',
        chart_surface3d: '3D Surface',
        chart_line3d: '3D Line',
        // Faz 5-9 yeni metinler
        statistical_analysis: 'Statistical Analysis',
        bi_insights: 'BI Insights',
        data_profile: 'Data Profile',
        run_analysis: 'Run Analysis',
        what_if_simulator: 'What-If Simulator',
        anomaly_detection: 'Anomaly Detection',
        trend_insight: 'Trend Insight',
        regression_type: 'Regression Type',
        linear: 'Linear',
        polynomial: 'Polynomial',
        exponential: 'Exponential',
        logarithmic: 'Logarithmic',
        t_test: 't-Test',
        anova: 'ANOVA',
        correlation: 'Correlation',
        normality: 'Normality',
        cross_filter: 'Cross Filter',
        detect_anomalies: 'Detect Anomalies',
        anomalies_found: 'anomalies found',
        no_anomaly: 'No anomaly detected ✓',
        trend_up: 'Upward trend detected',
        trend_down: 'Downward trend detected',
        trend_stable: 'Stable (no significant trend)',
        data_analysis: 'Data Analysis',
        total_rows: 'Total Rows',
        total_columns: 'Total Columns',
        data_quality: 'Data Quality',
        column_types: 'Column Types',
        missing_values: 'Missing Values',
        no_missing: 'No missing values ✓'
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
    loadDashboardFromStorage();
});

function initVizStudio() {
    console.log('🎨 Visual Studio başlatıldı (Production v1.0)');
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
    updateAllChartsTheme();
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

    // Grafik temalarını güncelle
    updateAllChartsTheme();
}

function updateAllChartsTheme() {
    const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
    VIZ_STATE.charts.forEach(config => {
        const chartDom = document.getElementById(`${config.id}_chart`);
        if (chartDom) {
            const oldInstance = VIZ_STATE.echartsInstances[config.id];
            if (oldInstance) {
                oldInstance.dispose();
            }
            renderChart(config);
        }
    });
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

    // Save & Export buttons
    document.getElementById('saveBtn')?.addEventListener('click', showSaveMenu);
    document.getElementById('exportBtn')?.addEventListener('click', showExportMenu);
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
        // Dosya referansını sakla
        VIZ_STATE.file = file;

        // Tam veri çek (aggregation için)
        const response = await fetch('/viz/data', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Dosya yüklenemedi');

        const data = await response.json();

        VIZ_STATE.data = data.data || [];
        VIZ_STATE.columns = data.columns || [];
        VIZ_STATE.columnsInfo = data.columns_info || [];

        // UI güncelle
        document.getElementById('vizDropZone').style.display = 'none';
        document.getElementById('vizFileInfo').style.display = 'block';
        document.getElementById('vizFileName').textContent = file.name;

        renderColumnsList();
        updateDropdowns();

        console.log(`✅ ${file.name} yüklendi: ${VIZ_STATE.data.length} satır, ${VIZ_STATE.columns.length} sütun`);

        // Mevcut grafikleri güncelle
        VIZ_STATE.charts.forEach(config => renderChart(config));

    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        alert(VIZ_TEXTS[VIZ_STATE.lang].error + ': ' + error.message);
    }
}

function clearData() {
    VIZ_STATE.file = null;
    VIZ_STATE.data = null;
    VIZ_STATE.columns = [];
    VIZ_STATE.columnsInfo = [];

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

    container.innerHTML = VIZ_STATE.columns.map((col, i) => {
        const info = VIZ_STATE.columnsInfo[i] || {};
        const typeIcon = info.type === 'numeric' ? 'fa-hashtag' :
            info.type === 'date' ? 'fa-calendar' : 'fa-font';
        return `
            <div class="viz-column-chip" draggable="true" data-column="${col}" title="${info.type || 'text'}">
                <i class="fas ${typeIcon}"></i>
                <span>${col}</span>
            </div>
        `;
    }).join('');

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
// AGGREGATION (Client-Side)
// -----------------------------------------------------
function aggregateData(data, xCol, yCol, aggType) {
    if (!data || !data.length || !xCol || !yCol) {
        console.warn('aggregateData: Eksik parametre', { dataLen: data?.length, xCol, yCol });
        return { categories: [], values: [] };
    }

    // Debug: İlk satırı göster
    console.log('📊 Aggregation:', { xCol, yCol, aggType, firstRow: data[0] });

    // Gruplama
    const groups = {};
    let parseErrors = 0;

    data.forEach(row => {
        const key = String(row[xCol] ?? '(Boş)');
        let rawVal = row[yCol];

        // Türkçe format düzeltme (virgül → nokta)
        if (typeof rawVal === 'string') {
            rawVal = rawVal.replace(/\./g, '').replace(',', '.'); // 1.234,56 → 1234.56
        }

        const val = parseFloat(rawVal);

        if (isNaN(val)) {
            parseErrors++;
        }

        const numVal = isNaN(val) ? 0 : val;

        if (!groups[key]) {
            groups[key] = { sum: 0, count: 0, values: [] };
        }
        groups[key].sum += numVal;
        groups[key].count++;
        groups[key].values.push(numVal);
    });

    if (parseErrors > 0) {
        console.warn(`⚠️ aggregateData: ${parseErrors} adet parse hatası (Y sütunu sayıya çevrilemedi)`);
    }
    console.log('📊 Sonuç:', { grupSayısı: Object.keys(groups).length, toplamSatır: data.length });

    // Aggregation hesapla
    const result = Object.entries(groups).map(([key, g]) => {
        let value;
        switch (aggType) {
            case 'sum':
                value = g.sum;
                break;
            case 'avg':
            case 'mean':
                value = g.count > 0 ? g.sum / g.count : 0;
                break;
            case 'count':
                value = g.count;
                break;
            case 'min':
                value = Math.min(...g.values);
                break;
            case 'max':
                value = Math.max(...g.values);
                break;
            default:
                value = g.sum;
        }
        return { category: key, value: Math.round(value * 100) / 100 };
    });

    // Değere göre sırala (büyükten küçüğe)
    result.sort((a, b) => b.value - a.value);

    // Top 20 limit (grafik okunabilirliği için)
    const limited = result.slice(0, 20);

    return {
        categories: limited.map(r => r.category),
        values: limited.map(r => r.value)
    };
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

    // Eski instance'ı temizle
    if (VIZ_STATE.echartsInstances[config.id]) {
        VIZ_STATE.echartsInstances[config.id].dispose();
    }

    const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
    const chart = echarts.init(chartDom, theme);
    VIZ_STATE.echartsInstances[config.id] = chart;

    // Veri aggregation
    let xData, yData;

    if (VIZ_STATE.data && VIZ_STATE.data.length > 0 && config.xAxis && config.yAxis) {
        const aggregated = aggregateData(VIZ_STATE.data, config.xAxis, config.yAxis, config.aggregation);
        xData = aggregated.categories;
        yData = aggregated.values;
    } else {
        // Demo veri
        xData = ['A', 'B', 'C', 'D', 'E'];
        yData = [120, 200, 150, 80, 70];
    }

    let option = {};

    switch (config.type) {
        case 'bar':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80 },
                series: [{ data: yData, type: 'bar', itemStyle: { color: config.color } }]
            };
            break;

        case 'line':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80 },
                series: [{ data: yData, type: 'line', smooth: true, itemStyle: { color: config.color } }]
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
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                }]
            };
            break;

        case 'area':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData, boundaryGap: false, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80 },
                series: [{ data: yData, type: 'line', areaStyle: { color: config.color + '40' }, itemStyle: { color: config.color } }]
            };
            break;

        case 'scatter':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item', formatter: (p) => `${xData[p.dataIndex]}: ${p.value[1]}` },
                xAxis: { type: 'value', name: config.xAxis },
                yAxis: { type: 'value', name: config.yAxis },
                series: [{
                    type: 'scatter',
                    data: yData.map((v, i) => [i, v]),
                    itemStyle: { color: config.color }
                }]
            };
            break;

        // =====================================================
        // İLERİ GRAFİKLER (Faz 3)
        // =====================================================

        case 'dual-axis':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                legend: { top: 30, data: ['Sütun', 'Çizgi'] },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: [
                    { type: 'value', name: 'Sol Eksen', position: 'left' },
                    { type: 'value', name: 'Sağ Eksen', position: 'right' }
                ],
                grid: { bottom: 80, top: 60 },
                series: [
                    { name: 'Sütun', type: 'bar', data: yData, itemStyle: { color: config.color } },
                    { name: 'Çizgi', type: 'line', yAxisIndex: 1, data: yData.map(v => v * 0.8), smooth: true, itemStyle: { color: '#ffc107' } }
                ]
            };
            break;

        case 'stacked-bar':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { top: 30, data: ['Kategori A', 'Kategori B', 'Kategori C'] },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80, top: 60 },
                series: [
                    { name: 'Kategori A', type: 'bar', stack: 'total', data: yData, itemStyle: { color: config.color } },
                    { name: 'Kategori B', type: 'bar', stack: 'total', data: yData.map(v => v * 0.6), itemStyle: { color: '#00d97e' } },
                    { name: 'Kategori C', type: 'bar', stack: 'total', data: yData.map(v => v * 0.4), itemStyle: { color: '#ffc107' } }
                ]
            };
            break;

        case 'treemap':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: '{b}: {c}' },
                series: [{
                    type: 'treemap',
                    data: xData.map((name, i) => ({
                        name: name,
                        value: yData[i],
                        itemStyle: { color: `hsl(${(i * 360 / xData.length)}, 70%, 50%)` }
                    })),
                    label: { show: true, formatter: '{b}\n{c}' },
                    breadcrumb: { show: false }
                }]
            };
            break;

        case 'heatmap':
            // Korelasyon matrisi için örnek veri
            const heatmapData = [];
            const categories = xData.slice(0, 5);
            for (let i = 0; i < categories.length; i++) {
                for (let j = 0; j < categories.length; j++) {
                    heatmapData.push([i, j, Math.round(Math.random() * 100) / 100]);
                }
            }
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { position: 'top', formatter: (p) => `${categories[p.data[0]]} - ${categories[p.data[1]]}: ${p.data[2]}` },
                xAxis: { type: 'category', data: categories, splitArea: { show: true } },
                yAxis: { type: 'category', data: categories, splitArea: { show: true } },
                visualMap: {
                    min: 0, max: 1,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: 10,
                    inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027'] }
                },
                series: [{
                    type: 'heatmap',
                    data: heatmapData,
                    label: { show: true, formatter: (p) => p.data[2].toFixed(2) },
                    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                }]
            };
            break;

        case 'funnel':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                series: [{
                    type: 'funnel',
                    left: '10%',
                    width: '80%',
                    top: 50,
                    bottom: 20,
                    sort: 'descending',
                    gap: 2,
                    label: { show: true, position: 'inside' },
                    data: xData.map((name, i) => ({
                        name: name,
                        value: yData[i]
                    })).sort((a, b) => b.value - a.value)
                }]
            };
            break;

        case 'gauge':
            const avgValue = yData.reduce((a, b) => a + b, 0) / yData.length;
            const maxVal = Math.max(...yData);
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: '{b}: {c}' },
                series: [{
                    type: 'gauge',
                    min: 0,
                    max: maxVal * 1.2,
                    progress: { show: true, width: 18 },
                    axisLine: { lineStyle: { width: 18 } },
                    axisTick: { show: false },
                    splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
                    axisLabel: { distance: 25, color: '#999', fontSize: 10 },
                    anchor: { show: true, size: 25, itemStyle: { borderWidth: 2 } },
                    title: { show: true },
                    detail: {
                        valueAnimation: true,
                        fontSize: 24,
                        offsetCenter: [0, '70%'],
                        formatter: '{value}'
                    },
                    data: [{ value: Math.round(avgValue), name: 'Ortalama' }]
                }]
            };
            break;

        case 'waterfall':
            const waterfallData = [];
            let cumulative = 0;
            yData.forEach((val, i) => {
                if (i === 0) {
                    waterfallData.push({ value: val, itemStyle: { color: config.color } });
                    cumulative = val;
                } else {
                    const change = val - yData[i - 1];
                    waterfallData.push({
                        value: change,
                        itemStyle: { color: change >= 0 ? '#00d97e' : '#dc3545' }
                    });
                    cumulative += change;
                }
            });
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80 },
                series: [{
                    type: 'bar',
                    stack: 'waterfall',
                    data: waterfallData,
                    label: { show: true, position: 'top', formatter: (p) => p.value >= 0 ? `+${p.value}` : p.value }
                }]
            };
            break;

        case 'radar':
            const maxRadar = Math.max(...yData) * 1.2;
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: {},
                radar: {
                    indicator: xData.slice(0, 6).map(name => ({ name, max: maxRadar })),
                    center: ['50%', '55%'],
                    radius: '65%'
                },
                series: [{
                    type: 'radar',
                    data: [{
                        value: yData.slice(0, 6),
                        name: config.title,
                        areaStyle: { color: config.color + '40' },
                        lineStyle: { color: config.color },
                        itemStyle: { color: config.color }
                    }]
                }]
            };
            break;

        case 'boxplot':
            // Box plot için istatistiksel hesaplama
            const sortedVals = [...yData].sort((a, b) => a - b);
            const n = sortedVals.length;
            const q1 = sortedVals[Math.floor(n * 0.25)];
            const median = sortedVals[Math.floor(n * 0.5)];
            const q3 = sortedVals[Math.floor(n * 0.75)];
            const min = sortedVals[0];
            const max = sortedVals[n - 1];

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item', formatter: (p) => `Min: ${min}<br>Q1: ${q1}<br>Medyan: ${median}<br>Q3: ${q3}<br>Max: ${max}` },
                xAxis: { type: 'category', data: [config.yAxis || 'Değer'] },
                yAxis: { type: 'value' },
                series: [{
                    type: 'boxplot',
                    data: [[min, q1, median, q3, max]],
                    itemStyle: { color: config.color, borderColor: config.color }
                }]
            };
            break;

        case 'pareto':
            // Pareto Chart (80/20 analizi)
            // Verileri büyükten küçüğe sırala
            const paretoSorted = yData.map((v, i) => ({ label: xData[i] || `Item ${i + 1}`, value: v }))
                .sort((a, b) => b.value - a.value);

            const paretoLabels = paretoSorted.map(d => d.label);
            const paretoValues = paretoSorted.map(d => d.value);
            const paretoTotal = paretoValues.reduce((a, b) => a + b, 0);

            // Kümülatif yüzde hesapla
            let paretoCumulative = 0;
            const cumulativePercent = paretoValues.map(v => {
                paretoCumulative += v;
                return ((paretoCumulative / paretoTotal) * 100).toFixed(1);
            });

            option = {
                title: { text: config.title || 'Pareto Analizi (80/20)', left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['Değer', 'Kümülatif %'], bottom: 0 },
                xAxis: { type: 'category', data: paretoLabels, axisLabel: { rotate: 45 } },
                yAxis: [
                    { type: 'value', name: 'Değer', position: 'left' },
                    { type: 'value', name: 'Kümülatif %', max: 100, position: 'right', axisLabel: { formatter: '{value}%' } }
                ],
                series: [
                    {
                        name: 'Değer',
                        type: 'bar',
                        data: paretoValues,
                        itemStyle: { color: config.color || '#3498db' }
                    },
                    {
                        name: 'Kümülatif %',
                        type: 'line',
                        yAxisIndex: 1,
                        data: cumulativePercent,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        itemStyle: { color: '#e74c3c' },
                        markLine: {
                            silent: true,
                            data: [{ yAxis: 80, name: '80%', lineStyle: { color: '#27ae60', type: 'dashed' } }]
                        }
                    }
                ]
            };
            break;

        // =====================================================
        // 3D GRAFİKLER (Faz 4) - echarts-gl
        // =====================================================

        case 'scatter3d':
            // 3D Scatter için örnek veri oluştur
            const scatter3dData = yData.map((v, i) => [
                i, v, Math.random() * v
            ]);
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: {},
                xAxis3D: { type: 'value', name: 'X' },
                yAxis3D: { type: 'value', name: 'Y' },
                zAxis3D: { type: 'value', name: 'Z' },
                grid3D: {
                    viewControl: {
                        autoRotate: true,
                        autoRotateSpeed: 10
                    },
                    light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
                },
                series: [{
                    type: 'scatter3D',
                    data: scatter3dData,
                    symbolSize: 12,
                    itemStyle: {
                        color: config.color,
                        opacity: 0.8
                    }
                }]
            };
            break;

        case 'bar3d':
            // 3D Bar için grid veri oluştur
            const bar3dData = [];
            const xLen = Math.min(xData.length, 5);
            for (let i = 0; i < xLen; i++) {
                for (let j = 0; j < 3; j++) {
                    bar3dData.push([i, j, yData[i] * (0.5 + Math.random() * 0.5)]);
                }
            }
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: {},
                visualMap: {
                    min: 0,
                    max: Math.max(...yData) * 1.5,
                    inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027'] },
                    show: false
                },
                xAxis3D: { type: 'category', data: xData.slice(0, 5), name: config.xAxis },
                yAxis3D: { type: 'category', data: ['A', 'B', 'C'], name: 'Grup' },
                zAxis3D: { type: 'value', name: 'Değer' },
                grid3D: {
                    boxWidth: 100,
                    boxDepth: 80,
                    viewControl: { autoRotate: true, autoRotateSpeed: 5 },
                    light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
                },
                series: [{
                    type: 'bar3D',
                    data: bar3dData.map(item => ({
                        value: [item[0], item[1], item[2]]
                    })),
                    shading: 'lambert',
                    label: { show: false },
                    emphasis: { label: { show: true, fontSize: 12 } }
                }]
            };
            break;

        case 'surface3d':
            // 3D Surface için matematiksel yüzey oluştur
            const surfaceData = [];
            for (let x = -3; x <= 3; x += 0.3) {
                for (let y = -3; y <= 3; y += 0.3) {
                    const z = Math.sin(Math.sqrt(x * x + y * y));
                    surfaceData.push([x, y, z]);
                }
            }
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: {},
                visualMap: {
                    min: -1, max: 1,
                    inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027'] },
                    show: true,
                    dimension: 2
                },
                xAxis3D: { type: 'value' },
                yAxis3D: { type: 'value' },
                zAxis3D: { type: 'value' },
                grid3D: {
                    viewControl: { autoRotate: true, autoRotateSpeed: 8 },
                    light: { main: { intensity: 1.5 }, ambient: { intensity: 0.2 } }
                },
                series: [{
                    type: 'surface',
                    data: surfaceData,
                    wireframe: { show: true },
                    shading: 'color'
                }]
            };
            break;

        case 'line3d':
            // 3D Line için spiral veri
            const line3dData = [];
            for (let t = 0; t < 25; t++) {
                const x = Math.cos(t);
                const y = Math.sin(t);
                const z = t / 10;
                line3dData.push([x * (1 + z), y * (1 + z), z]);
            }
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: {},
                xAxis3D: { type: 'value' },
                yAxis3D: { type: 'value' },
                zAxis3D: { type: 'value' },
                grid3D: {
                    viewControl: { autoRotate: true, autoRotateSpeed: 10 },
                    light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
                },
                series: [{
                    type: 'line3D',
                    data: line3dData,
                    lineStyle: { width: 4, color: config.color },
                    smooth: true
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

    // İstatistik overlay'ları uygula (Faz 2)
    if (config.overlays || document.getElementById('showMeanLine')?.checked ||
        document.getElementById('showMedianLine')?.checked ||
        document.getElementById('showStdBand')?.checked ||
        document.getElementById('showTrendLine')?.checked) {
        setTimeout(() => applyStatisticalOverlays(chart, config, yData), 100);
    }

    // Resize handler
    const resizeHandler = () => chart.resize();
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
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

    // ECharts instance'ı temizle
    if (VIZ_STATE.echartsInstances[chartId]) {
        VIZ_STATE.echartsInstances[chartId].dispose();
        delete VIZ_STATE.echartsInstances[chartId];
    }

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
    if (empty) {
        empty.style.display = VIZ_STATE.charts.length === 0 ? 'flex' : 'none';
    }
}

// -----------------------------------------------------
// SAVE & EXPORT
// -----------------------------------------------------
function showSaveMenu() {
    // Basit konfirm ile kaydet
    saveDashboard();
}

function showExportMenu() {
    // Export dropdown menü göster
    const menu = document.createElement('div');
    menu.className = 'viz-export-menu';
    menu.innerHTML = `
        <div class="viz-export-option" onclick="exportPNG()">
            <i class="fas fa-image"></i> ${VIZ_TEXTS[VIZ_STATE.lang].export_png}
        </div>
        <div class="viz-export-option" onclick="exportAllChartsPNG()">
            <i class="fas fa-images"></i> Tüm Grafikleri PNG
        </div>
    `;

    // Pozisyon ayarla
    const btn = document.getElementById('exportBtn');
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    menu.style.zIndex = '9999';

    // Tıklama dışında kapat
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
    console.log('💾 Dashboard kaydedildi');

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
            console.log('📂 Dashboard yüklendi:', dashboardData.charts.length, 'grafik');
        }
    } catch (e) {
        console.error('Dashboard yükleme hatası:', e);
    }
}

function exportPNG() {
    if (!VIZ_STATE.selectedChart) {
        showToast('Önce bir grafik seçin', 'warning');
        return;
    }

    const chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;

    const url = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e'
    });

    downloadFile(url, `chart_${VIZ_STATE.selectedChart}.png`);
    showToast(VIZ_TEXTS[VIZ_STATE.lang].export_success, 'success');
}

function exportAllChartsPNG() {
    VIZ_STATE.charts.forEach((config, index) => {
        const chart = VIZ_STATE.echartsInstances[config.id];
        if (chart) {
            setTimeout(() => {
                const url = chart.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e'
                });
                downloadFile(url, `chart_${index + 1}_${config.title.replace(/\s+/g, '_')}.png`);
            }, index * 500); // Stagger downloads
        }
    });
    showToast(`${VIZ_STATE.charts.length} grafik export ediliyor...`, 'success');
}

function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// -----------------------------------------------------
// TOAST NOTIFICATIONS
// -----------------------------------------------------
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `viz-toast viz-toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// -----------------------------------------------------
// GLOBAL FUNCTIONS (HTML onclick için)
// -----------------------------------------------------
window.selectChart = selectChart;
window.exportPNG = exportPNG;
window.exportAllChartsPNG = exportAllChartsPNG;

// -----------------------------------------------------
// STATISTICS OVERLAY (Faz 2)
// simple-statistics kütüphanesi ile
// -----------------------------------------------------

function calculateStatistics(values) {
    if (!values || values.length === 0) return null;

    // simple-statistics kütüphanesi var mı kontrol
    if (typeof ss === 'undefined') {
        console.warn('simple-statistics kütüphanesi yüklenemedi, fallback hesaplama kullanılıyor');
        return calculateStatsFallback(values);
    }

    try {
        return {
            mean: ss.mean(values),
            median: ss.median(values),
            stdev: ss.standardDeviation(values),
            min: ss.min(values),
            max: ss.max(values),
            count: values.length,
            q1: ss.quantile(values, 0.25),
            q3: ss.quantile(values, 0.75),
            variance: ss.variance(values)
        };
    } catch (e) {
        console.error('İstatistik hesaplama hatası:', e);
        return calculateStatsFallback(values);
    }
}

function calculateStatsFallback(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const mid = Math.floor(n / 2);
    const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;

    return {
        mean: mean,
        median: median,
        stdev: Math.sqrt(variance),
        min: sorted[0],
        max: sorted[n - 1],
        count: n,
        variance: variance
    };
}

function updateStatsSummary(stats) {
    const summaryEl = document.getElementById('vizStatsSummary');
    if (!summaryEl || !stats) {
        if (summaryEl) summaryEl.style.display = 'none';
        return;
    }

    summaryEl.style.display = 'block';

    document.getElementById('statMean').textContent = formatNumber(stats.mean);
    document.getElementById('statMedian').textContent = formatNumber(stats.median);
    document.getElementById('statStdev').textContent = formatNumber(stats.stdev);
    document.getElementById('statMin').textContent = formatNumber(stats.min);
    document.getElementById('statMax').textContent = formatNumber(stats.max);
    document.getElementById('statCount').textContent = stats.count;
}

function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '-';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
}

function getStatisticalOverlays(values, stats) {
    const overlays = {
        markLines: [],
        markAreas: []
    };

    if (!stats) return overlays;

    const showMean = document.getElementById('showMeanLine')?.checked;
    const showMedian = document.getElementById('showMedianLine')?.checked;
    const showStdBand = document.getElementById('showStdBand')?.checked;
    const showTrend = document.getElementById('showTrendLine')?.checked;

    // Ortalama Çizgisi
    if (showMean) {
        overlays.markLines.push({
            yAxis: stats.mean,
            name: VIZ_TEXTS[VIZ_STATE.lang].stat_mean,
            lineStyle: { color: '#00d97e', type: 'solid', width: 2 },
            label: { formatter: `μ = ${formatNumber(stats.mean)}`, position: 'end' }
        });
    }

    // Medyan Çizgisi
    if (showMedian) {
        overlays.markLines.push({
            yAxis: stats.median,
            name: VIZ_TEXTS[VIZ_STATE.lang].stat_median,
            lineStyle: { color: '#ffc107', type: 'dashed', width: 2 },
            label: { formatter: `Med = ${formatNumber(stats.median)}`, position: 'end' }
        });
    }

    // Standart Sapma Bandı (±1σ)
    if (showStdBand) {
        const upper = stats.mean + stats.stdev;
        const lower = stats.mean - stats.stdev;
        overlays.markAreas.push([{
            yAxis: upper,
            name: '+1σ',
            itemStyle: { color: 'rgba(74, 144, 217, 0.15)' }
        }, {
            yAxis: lower
        }]);

        // Üst ve alt sınır çizgileri
        overlays.markLines.push(
            { yAxis: upper, lineStyle: { color: '#4a90d9', type: 'dotted', width: 1 }, label: { show: false } },
            { yAxis: lower, lineStyle: { color: '#4a90d9', type: 'dotted', width: 1 }, label: { show: false } }
        );
    }

    return overlays;
}

function calculateTrendLine(xData, yData) {
    if (!xData || !yData || xData.length < 2) return null;

    // simple-statistics ile linear regresyon
    if (typeof ss !== 'undefined') {
        try {
            const data = yData.map((y, i) => [i, y]);
            const regression = ss.linearRegression(data);
            const line = ss.linearRegressionLine(regression);

            return {
                start: line(0),
                end: line(yData.length - 1),
                slope: regression.m,
                intercept: regression.b
            };
        } catch (e) {
            console.error('Trend çizgisi hesaplama hatası:', e);
        }
    }

    // Fallback: Basit doğrusal regresyon
    const n = yData.length;
    const sumX = yData.reduce((acc, _, i) => acc + i, 0);
    const sumY = yData.reduce((acc, v) => acc + v, 0);
    const sumXY = yData.reduce((acc, v, i) => acc + i * v, 0);
    const sumX2 = yData.reduce((acc, _, i) => acc + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
        start: intercept,
        end: slope * (n - 1) + intercept,
        slope: slope,
        intercept: intercept
    };
}

function applyStatisticalOverlays(chartInstance, config, yData) {
    if (!chartInstance || !yData || yData.length === 0) return;

    const stats = calculateStatistics(yData);
    updateStatsSummary(stats);

    const overlays = getStatisticalOverlays(yData, stats);
    const showTrend = document.getElementById('showTrendLine')?.checked;

    // Mevcut option'u al
    const currentOption = chartInstance.getOption();
    if (!currentOption.series || !currentOption.series[0]) return;

    // Sadece bar, line, area grafikler için overlay destekle
    const supportedTypes = ['bar', 'line'];
    const seriesType = currentOption.series[0].type;
    if (!supportedTypes.includes(seriesType)) {
        console.log('Bu grafik tipi overlay desteklemiyor:', seriesType);
        return;
    }

    // markLine ve markArea güncelle
    const newSeries = [{
        ...currentOption.series[0],
        markLine: overlays.markLines.length > 0 ? {
            silent: true,
            symbol: 'none',
            data: overlays.markLines
        } : undefined,
        markArea: overlays.markAreas.length > 0 ? {
            silent: true,
            data: overlays.markAreas
        } : undefined
    }];

    // Trend çizgisi için ayrı seri ekle
    if (showTrend && seriesType !== 'pie') {
        const xData = currentOption.xAxis?.[0]?.data || [];
        const trend = calculateTrendLine(xData, yData);
        if (trend) {
            newSeries.push({
                type: 'line',
                data: yData.map((_, i) => trend.slope * i + trend.intercept),
                smooth: false,
                lineStyle: { color: '#e74c3c', type: 'dashed', width: 2 },
                itemStyle: { color: '#e74c3c' },
                symbol: 'none',
                name: 'Trend'
            });
        }
    }

    chartInstance.setOption({ series: newSeries }, false);
}

// Overlay checkbox değişikliklerini dinle
function setupOverlayListeners() {
    const checkboxes = ['showMeanLine', 'showMedianLine', 'showStdBand', 'showTrendLine'];

    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (VIZ_STATE.selectedChart) {
                    const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                    if (config) {
                        // Overlay ayarlarını config'e kaydet
                        config.overlays = {
                            showMean: document.getElementById('showMeanLine')?.checked,
                            showMedian: document.getElementById('showMedianLine')?.checked,
                            showStdBand: document.getElementById('showStdBand')?.checked,
                            showTrend: document.getElementById('showTrendLine')?.checked
                        };

                        // Grafiği yeniden render et
                        renderChart(config);
                    }
                }
            });
        }
    });
}

// Initialization'ı güncelle
const originalInit = initVizStudio;
initVizStudio = function () {
    originalInit();
    setupOverlayListeners();
    setupSPSSListeners();
    console.log('📊 İstatistik overlay sistemi hazır');
    console.log('🧪 SPSS analiz sistemi hazır');
};

// -----------------------------------------------------
// SPSS ANALİZ FONKSİYONLARI (Faz 5)
// jStat ve regression.js ile
// -----------------------------------------------------

function setupSPSSListeners() {
    const regressionSelect = document.getElementById('regressionType');
    if (regressionSelect) {
        regressionSelect.addEventListener('change', () => {
            if (VIZ_STATE.selectedChart) {
                const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                if (config) {
                    config.regressionType = regressionSelect.value;
                    renderChart(config);
                    updateRegressionResults(config);
                }
            }
        });
    }
}

function updateRegressionResults(config) {
    const resultsDiv = document.getElementById('regressionResults');
    const rSquaredEl = document.getElementById('rSquared');
    const equationEl = document.getElementById('regressionEquation');

    if (!config.regressionType || config.regressionType === 'none') {
        if (resultsDiv) resultsDiv.style.display = 'none';
        return;
    }

    // Veriyi al
    let yData = [];
    if (VIZ_STATE.data && VIZ_STATE.data.length > 0 && config.xAxis && config.yAxis) {
        const aggregated = aggregateData(VIZ_STATE.data, config.xAxis, config.yAxis, config.aggregation);
        yData = aggregated.values;
    } else {
        yData = [120, 200, 150, 80, 70]; // Demo veri
    }

    // regression.js ile hesapla
    if (typeof regression !== 'undefined') {
        const data = yData.map((v, i) => [i, v]);
        let result;

        switch (config.regressionType) {
            case 'linear':
                result = regression.linear(data);
                break;
            case 'polynomial':
                result = regression.polynomial(data, { order: 2 });
                break;
            case 'exponential':
                result = regression.exponential(data);
                break;
            case 'logarithmic':
                result = regression.logarithmic(data);
                break;
            default:
                result = null;
        }

        if (result && resultsDiv) {
            resultsDiv.style.display = 'block';
            rSquaredEl.textContent = result.r2.toFixed(4);
            equationEl.textContent = result.string;
        }
    } else if (resultsDiv) {
        resultsDiv.style.display = 'none';
    }
}

function runStatTest(testType) {
    let yData = [];

    // Mevcut grafikten veri al
    if (VIZ_STATE.selectedChart) {
        const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
        if (config && VIZ_STATE.data && config.yAxis) {
            yData = VIZ_STATE.data.map(row => parseFloat(row[config.yAxis])).filter(v => !isNaN(v));
        }
    }

    // Demo veri yoksa
    if (yData.length < 3) {
        yData = [120, 200, 150, 80, 70, 130, 180, 95, 160, 140];
    }

    const resultsDiv = document.getElementById('testResults');
    const testNameEl = document.getElementById('testName');
    const pValueEl = document.getElementById('testPValue');
    const resultBodyEl = document.getElementById('testResultBody');

    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';

    switch (testType) {
        case 'ttest':
            runTTest(yData, testNameEl, pValueEl, resultBodyEl);
            break;
        case 'anova':
            runANOVA(yData, testNameEl, pValueEl, resultBodyEl);
            break;
        case 'correlation':
            runCorrelation(yData, testNameEl, pValueEl, resultBodyEl);
            break;
        case 'normality':
            runNormalityTest(yData, testNameEl, pValueEl, resultBodyEl);
            break;
    }

    showToast(VIZ_TEXTS[VIZ_STATE.lang].test_completed || 'Test tamamlandı', 'success');
}

function runTTest(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Tek Örnek t-Test';

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (data.length - 1));
    const se = std / Math.sqrt(data.length);
    const t = mean / se;

    // jStat ile p-değeri
    let pValue = 0.05; // fallback
    if (typeof jStat !== 'undefined') {
        pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), data.length - 1));
    }

    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';

    bodyEl.innerHTML = `
        <div>n = ${data.length}</div>
        <div>Ortalama = ${mean.toFixed(2)}</div>
        <div>Std Sapma = ${std.toFixed(2)}</div>
        <div>t = ${t.toFixed(3)}</div>
        <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? '✅ İstatistiksel olarak anlamlı' : '❌ Anlamlı değil'}</div>
    `;
}

function runANOVA(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Tek Yönlü ANOVA';

    // Veriyi 3 gruba ayır
    const third = Math.floor(data.length / 3);
    const groups = [
        data.slice(0, third),
        data.slice(third, 2 * third),
        data.slice(2 * third)
    ];

    const grandMean = data.reduce((a, b) => a + b, 0) / data.length;
    const groupMeans = groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);

    // Between-group varyans
    const ssb = groups.reduce((acc, g, i) => acc + g.length * Math.pow(groupMeans[i] - grandMean, 2), 0);
    const dfb = groups.length - 1;
    const msb = ssb / dfb;

    // Within-group varyans
    let ssw = 0;
    groups.forEach((g, i) => {
        g.forEach(v => { ssw += Math.pow(v - groupMeans[i], 2); });
    });
    const dfw = data.length - groups.length;
    const msw = ssw / dfw;

    const f = msb / msw;

    // jStat ile p-değeri
    let pValue = 0.05;
    if (typeof jStat !== 'undefined') {
        pValue = 1 - jStat.centralF.cdf(f, dfb, dfw);
    }

    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';

    bodyEl.innerHTML = `
        <div>Gruplar: ${groups.length}</div>
        <div>F(${dfb}, ${dfw}) = ${f.toFixed(3)}</div>
        <div>MSB = ${msb.toFixed(2)}, MSW = ${msw.toFixed(2)}</div>
        <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? '✅ Gruplar arası fark anlamlı' : '❌ Anlamlı fark yok'}</div>
    `;
}

function runCorrelation(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Pearson Korelasyon';

    // İkinci veri seti oluştur (lag)
    const x = data.slice(0, -1);
    const y = data.slice(1);

    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
        num += (x[i] - meanX) * (y[i] - meanY);
        denX += Math.pow(x[i] - meanX, 2);
        denY += Math.pow(y[i] - meanY, 2);
    }

    const r = num / Math.sqrt(denX * denY);
    const t = r * Math.sqrt((n - 2) / (1 - r * r));

    let pValue = 0.05;
    if (typeof jStat !== 'undefined') {
        pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));
    }

    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';

    const strength = Math.abs(r) > 0.7 ? 'Güçlü' : Math.abs(r) > 0.4 ? 'Orta' : 'Zayıf';
    const direction = r > 0 ? 'Pozitif' : 'Negatif';

    bodyEl.innerHTML = `
        <div>r = ${r.toFixed(4)}</div>
        <div>R² = ${(r * r).toFixed(4)}</div>
        <div>İlişki: ${direction} ${strength}</div>
        <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? '✅ Korelasyon anlamlı' : '❌ Anlamlı değil'}</div>
    `;
}

function runNormalityTest(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Normallik Testi (Skewness/Kurtosis)';

    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);

    // Skewness (çarpıklık)
    const skewness = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / n;

    // Kurtosis (basıklık)
    const kurtosis = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0) / n - 3;

    // Jarque-Bera testi
    const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);

    let pValue = 0.05;
    if (typeof jStat !== 'undefined') {
        pValue = 1 - jStat.chisquare.cdf(jb, 2);
    }

    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue > 0.05 ? 'viz-p-value viz-normal' : 'viz-p-value viz-significant';

    bodyEl.innerHTML = `
        <div>Çarpıklık (Skewness) = ${skewness.toFixed(3)}</div>
        <div>Basıklık (Kurtosis) = ${kurtosis.toFixed(3)}</div>
        <div>Jarque-Bera = ${jb.toFixed(3)}</div>
        <div class="${pValue > 0.05 ? 'viz-normal' : 'viz-significant'}">${pValue > 0.05 ? '✅ Normal dağılım' : '⚠️ Normal değil'}</div>
    `;
}

// Global fonksiyonlar
window.runStatTest = runStatTest;

// -----------------------------------------------------
// BI INSIGHTS FONKSİYONLARI (Faz 6)
// Cross-filter, What-If, Anomaly Detection
// -----------------------------------------------------

function setupBIListeners() {
    // What-If Slider
    const whatIfSlider = document.getElementById('whatIfSlider');
    const whatIfValue = document.getElementById('whatIfValue');

    if (whatIfSlider) {
        whatIfSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            whatIfValue.textContent = `${value >= 0 ? '+' : ''}${value}%`;
            whatIfValue.className = 'viz-whatif-percent ' +
                (value > 0 ? 'viz-positive' : value < 0 ? 'viz-negative' : '');

            // Seçili grafiği güncelle
            if (VIZ_STATE.selectedChart) {
                applyWhatIfChange(value);
            }
        });
    }

    // Cross-filter toggle
    const crossFilterCheckbox = document.getElementById('crossFilterEnabled');
    if (crossFilterCheckbox) {
        crossFilterCheckbox.addEventListener('change', (e) => {
            VIZ_STATE.crossFilterEnabled = e.target.checked;
            showToast(e.target.checked ? 'Cross-filter aktif' : 'Cross-filter kapalı', 'info');
        });
    }
}

function applyWhatIfChange(percentage) {
    const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
    if (!config) return;

    const chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) return;

    const currentOption = chart.getOption();
    if (!currentOption.series || !currentOption.series[0]) return;

    // Orijinal veriyi sakla
    if (!config.originalData) {
        config.originalData = [...currentOption.series[0].data];
    }

    // What-If değişikliği uygula
    const multiplier = 1 + (percentage / 100);
    const newData = config.originalData.map(v => {
        if (typeof v === 'number') return Math.round(v * multiplier);
        if (typeof v === 'object' && v.value !== undefined) {
            return { ...v, value: Math.round(v.value * multiplier) };
        }
        return v;
    });

    chart.setOption({
        series: [{ data: newData }]
    }, false);
}

function detectAnomalies() {
    let yData = [];

    // Mevcut grafikten veri al
    if (VIZ_STATE.selectedChart) {
        const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
        if (config && VIZ_STATE.data && config.yAxis) {
            yData = VIZ_STATE.data.map(row => parseFloat(row[config.yAxis])).filter(v => !isNaN(v));
        }
    }

    // Demo veri
    if (yData.length < 3) {
        yData = [120, 200, 150, 80, 70, 500, 130, 180, 95, 160, 10, 140];
    }

    // Z-score ile anomali tespit
    const mean = yData.reduce((a, b) => a + b, 0) / yData.length;
    const std = Math.sqrt(yData.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / yData.length);

    const anomalies = [];
    const threshold = 2; // Z-score > 2 = anomali

    yData.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / std);
        if (zScore > threshold) {
            anomalies.push({
                index: index,
                value: value,
                zScore: zScore.toFixed(2),
                type: value > mean ? 'high' : 'low'
            });
        }
    });

    // Sonuçları göster
    const resultsDiv = document.getElementById('anomalyResults');
    const countEl = document.getElementById('anomalyCount');
    const listEl = document.getElementById('anomalyList');

    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        countEl.textContent = anomalies.length;

        if (anomalies.length > 0) {
            listEl.innerHTML = anomalies.slice(0, 5).map(a => `
                <div class="viz-anomaly-item ${a.type}">
                    <span>#${a.index + 1}</span>
                    <span>${a.value}</span>
                    <span class="viz-zscore">Z=${a.zScore}</span>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = '<div class="viz-no-anomaly">✅ Anomali bulunamadı</div>';
        }
    }

    // Trend insight güncelle
    updateTrendInsight(yData);

    showToast(`${anomalies.length} anomali tespit edildi`, anomalies.length > 0 ? 'warning' : 'success');
}

function updateTrendInsight(data) {
    if (!data || data.length < 3) return;

    const trendDiv = document.getElementById('trendInsight');
    const trendText = document.getElementById('trendText');
    if (!trendDiv || !trendText) return;

    // Basit trend analizi
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);

    let trendType, trendIcon, trendClass;
    if (changePercent > 10) {
        trendType = 'Güçlü artış trendi';
        trendIcon = '📈';
        trendClass = 'viz-trend-up';
    } else if (changePercent > 0) {
        trendType = 'Hafif artış trendi';
        trendIcon = '↗️';
        trendClass = 'viz-trend-up';
    } else if (changePercent < -10) {
        trendType = 'Güçlü düşüş trendi';
        trendIcon = '📉';
        trendClass = 'viz-trend-down';
    } else if (changePercent < 0) {
        trendType = 'Hafif düşüş trendi';
        trendIcon = '↘️';
        trendClass = 'viz-trend-down';
    } else {
        trendType = 'Stabil';
        trendIcon = '➡️';
        trendClass = 'viz-trend-stable';
    }

    trendDiv.style.display = 'flex';
    trendDiv.className = `viz-trend-insight ${trendClass}`;
    trendText.textContent = `${trendIcon} ${trendType} (${changePercent > 0 ? '+' : ''}${changePercent}%)`;
}

// Cross-filter: Bir grafikteki seçim diğerlerini filtreler
function applyCrossFilter(sourceChartId, selectedCategory) {
    if (!VIZ_STATE.crossFilterEnabled) return;

    VIZ_STATE.charts.forEach(config => {
        if (config.id !== sourceChartId) {
            const chart = VIZ_STATE.echartsInstances[config.id];
            if (chart && config.xAxis === VIZ_STATE.charts.find(c => c.id === sourceChartId)?.xAxis) {
                // Aynı X ekseni olan grafikleri highlight et
                chart.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    name: selectedCategory
                });
            }
        }
    });
}

// Initialization'a BI listeners ekle
const originalInitWithSPSS = initVizStudio;
initVizStudio = function () {
    originalInitWithSPSS();
    setupBIListeners();
    console.log('🧠 BI Insights sistemi hazır');
};

// Global fonksiyonlar
window.detectAnomalies = detectAnomalies;
window.applyCrossFilter = applyCrossFilter;

// -----------------------------------------------------
// VERİ PROFİLİ FONKSİYONLARI (Faz 7)
// Sütun analizi, eksik değer tespiti, veri kalitesi
// -----------------------------------------------------

function runDataProfile() {
    const resultsDiv = document.getElementById('profileResults');
    const rowsEl = document.getElementById('profileRows');
    const colsEl = document.getElementById('profileCols');
    const qualityEl = document.getElementById('profileQuality');
    const typesEl = document.getElementById('columnTypes');
    const missingEl = document.getElementById('missingValuesList');

    if (!resultsDiv) return;

    // Veri kontrolü
    let data = VIZ_STATE.data;
    let columns = VIZ_STATE.columns;

    // Demo veri
    if (!data || data.length === 0) {
        data = [
            { 'Ürün': 'Laptop', 'Fiyat': 15000, 'Stok': 50, 'Tarih': '2024-01-15' },
            { 'Ürün': 'Telefon', 'Fiyat': 8000, 'Stok': null, 'Tarih': '2024-01-16' },
            { 'Ürün': 'Tablet', 'Fiyat': null, 'Stok': 30, 'Tarih': '2024-01-17' },
            { 'Ürün': 'Kulaklık', 'Fiyat': 500, 'Stok': 200, 'Tarih': null },
            { 'Ürün': null, 'Fiyat': 1200, 'Stok': 100, 'Tarih': '2024-01-19' }
        ];
        columns = ['Ürün', 'Fiyat', 'Stok', 'Tarih'];
    }

    const rowCount = data.length;
    const colCount = columns.length;

    // Sütun analizi
    const columnAnalysis = columns.map(col => {
        const values = data.map(row => row[col]);
        const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
        const nullCount = values.length - nonNull.length;

        // Tip tespiti
        let type = 'text';
        let icon = 'fa-font';
        let color = '#95a5a6';

        if (nonNull.length > 0) {
            const sample = nonNull[0];
            if (typeof sample === 'number' || !isNaN(parseFloat(sample))) {
                type = 'number';
                icon = 'fa-hashtag';
                color = '#3498db';
            } else if (/^\d{4}-\d{2}-\d{2}/.test(sample)) {
                type = 'date';
                icon = 'fa-calendar';
                color = '#9b59b6';
            } else if (typeof sample === 'boolean') {
                type = 'boolean';
                icon = 'fa-toggle-on';
                color = '#e67e22';
            }
        }

        return {
            name: col,
            type: type,
            icon: icon,
            color: color,
            nullCount: nullCount,
            nullPercent: ((nullCount / values.length) * 100).toFixed(1)
        };
    });

    // Veri kalitesi hesapla
    const totalCells = rowCount * colCount;
    const nullCells = columnAnalysis.reduce((acc, col) => acc + col.nullCount, 0);
    const quality = (((totalCells - nullCells) / totalCells) * 100).toFixed(1);

    // UI güncelle
    resultsDiv.style.display = 'block';
    rowsEl.textContent = rowCount.toLocaleString();
    colsEl.textContent = colCount;
    qualityEl.textContent = quality + '%';
    qualityEl.className = 'viz-profile-value ' +
        (quality >= 90 ? 'viz-quality-good' : quality >= 70 ? 'viz-quality-ok' : 'viz-quality-bad');

    // Sütun tipleri
    typesEl.innerHTML = columnAnalysis.map(col => `
        <div class="viz-column-type-item" style="border-left-color: ${col.color}">
            <i class="fas ${col.icon}" style="color: ${col.color}"></i>
            <span class="viz-col-name">${col.name}</span>
            <span class="viz-col-type">${col.type}</span>
        </div>
    `).join('');

    // Eksik değerler
    const missingCols = columnAnalysis.filter(col => col.nullCount > 0);
    if (missingCols.length > 0) {
        missingEl.innerHTML = missingCols.map(col => `
            <div class="viz-missing-item">
                <span class="viz-missing-col">${col.name}</span>
                <div class="viz-missing-bar">
                    <div class="viz-missing-fill" style="width: ${col.nullPercent}%"></div>
                </div>
                <span class="viz-missing-percent">${col.nullPercent}%</span>
            </div>
        `).join('');
    } else {
        missingEl.innerHTML = '<div class="viz-no-missing">✅ Eksik değer yok</div>';
    }

    showToast('Veri profili oluşturuldu', 'success');
}

// Global
window.runDataProfile = runDataProfile;

// -----------------------------------------------------
// KLAVYE KISAYOLLARI & KOMUT PALETİ (Faz 8)
// Mousetrap.js ile
// -----------------------------------------------------

const PALETTE_COMMANDS = [
    { id: 'add-chart', name: 'Grafik Ekle', shortcut: 'Ctrl+N', icon: 'fa-plus', action: () => addNewChart() },
    { id: 'save', name: 'Dashboard Kaydet', shortcut: 'Ctrl+S', icon: 'fa-save', action: () => saveDashboard() },
    { id: 'export', name: 'PNG Export', shortcut: 'Ctrl+E', icon: 'fa-download', action: () => exportDashboard() },
    { id: 'delete', name: 'Seçili Grafiği Sil', shortcut: 'Del', icon: 'fa-trash', action: () => deleteSelectedChart() },
    { id: 'profile', name: 'Veri Profili', shortcut: 'Ctrl+P', icon: 'fa-database', action: () => runDataProfile() },
    { id: 'anomaly', name: 'Anomali Tespit', shortcut: 'Ctrl+A', icon: 'fa-exclamation-triangle', action: () => detectAnomalies() },
    { id: 'theme', name: 'Tema Değiştir', shortcut: 'Ctrl+T', icon: 'fa-moon', action: () => toggleTheme() },
    { id: 'fullscreen', name: 'Tam Ekran', shortcut: 'F11', icon: 'fa-expand', action: () => toggleFullscreen() },
    { id: 'help', name: 'Kısayolları Göster', shortcut: '?', icon: 'fa-keyboard', action: () => showShortcuts() }
];

function setupKeyboardShortcuts() {
    if (typeof Mousetrap === 'undefined') {
        console.warn('Mousetrap kütüphanesi yüklenmedi');
        return;
    }

    // Command Palette
    Mousetrap.bind(['ctrl+k', 'command+k'], (e) => {
        e.preventDefault();
        toggleCommandPalette();
        return false;
    });

    // Grafik Ekle
    Mousetrap.bind(['ctrl+n', 'command+n'], (e) => {
        e.preventDefault();
        addNewChart();
        return false;
    });

    // Kaydet
    Mousetrap.bind(['ctrl+s', 'command+s'], (e) => {
        e.preventDefault();
        saveDashboard();
        return false;
    });

    // Export
    Mousetrap.bind(['ctrl+e', 'command+e'], (e) => {
        e.preventDefault();
        exportDashboard();
        return false;
    });

    // Sil
    Mousetrap.bind('del', () => {
        deleteSelectedChart();
        return false;
    });

    // Tema
    Mousetrap.bind(['ctrl+t', 'command+t'], (e) => {
        e.preventDefault();
        toggleTheme();
        return false;
    });

    // Help
    Mousetrap.bind('?', () => {
        showShortcuts();
        return false;
    });

    // ESC - paleti kapat
    Mousetrap.bind('escape', () => {
        closeCommandPalette();
        return false;
    });

    console.log('⌨️ Klavye kısayolları hazır (Ctrl+K ile komut paleti)');
}

function toggleCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (!palette) return;

    if (palette.style.display === 'none') {
        openCommandPalette();
    } else {
        closeCommandPalette();
    }
}

function openCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const searchInput = document.getElementById('paletteSearch');
    const commandsDiv = document.getElementById('paletteCommands');

    if (!palette) return;

    palette.style.display = 'flex';
    searchInput.value = '';
    searchInput.focus();

    renderPaletteCommands(PALETTE_COMMANDS);

    // Arama olayı
    searchInput.oninput = () => {
        const query = searchInput.value.toLowerCase();
        const filtered = PALETTE_COMMANDS.filter(cmd =>
            cmd.name.toLowerCase().includes(query) ||
            cmd.shortcut.toLowerCase().includes(query)
        );
        renderPaletteCommands(filtered);
    };

    // Enter ile seç
    searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            const firstCmd = commandsDiv.querySelector('.viz-palette-cmd');
            if (firstCmd) firstCmd.click();
        }
    };
}

function closeCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (palette) palette.style.display = 'none';
}

function renderPaletteCommands(commands) {
    const commandsDiv = document.getElementById('paletteCommands');
    if (!commandsDiv) return;

    commandsDiv.innerHTML = commands.map(cmd => `
        <div class="viz-palette-cmd" data-id="${cmd.id}">
            <i class="fas ${cmd.icon}"></i>
            <span class="viz-cmd-name">${cmd.name}</span>
            <kbd class="viz-cmd-shortcut">${cmd.shortcut}</kbd>
        </div>
    `).join('');

    // Click olayları
    commandsDiv.querySelectorAll('.viz-palette-cmd').forEach(el => {
        el.onclick = () => {
            const cmd = PALETTE_COMMANDS.find(c => c.id === el.dataset.id);
            if (cmd) {
                closeCommandPalette();
                cmd.action();
            }
        };
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    showToast('Tema değiştirildi', 'info');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function showShortcuts() {
    const shortcuts = PALETTE_COMMANDS.map(cmd => `${cmd.shortcut}: ${cmd.name}`).join('\n');
    showToast('Kısayollar: Ctrl+K (Palet), Ctrl+N (Grafik), Ctrl+S (Kaydet)', 'info');
}

function deleteSelectedChart() {
    if (VIZ_STATE.selectedChart) {
        const chartEl = document.getElementById(VIZ_STATE.selectedChart);
        if (chartEl) {
            chartEl.remove();
            VIZ_STATE.charts = VIZ_STATE.charts.filter(c => c.id !== VIZ_STATE.selectedChart);
            delete VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
            VIZ_STATE.selectedChart = null;
            showToast('Grafik silindi', 'success');
        }
    }
}

// Palette overlay click to close
document.addEventListener('DOMContentLoaded', () => {
    const palette = document.getElementById('commandPalette');
    if (palette) {
        palette.onclick = (e) => {
            if (e.target === palette) closeCommandPalette();
        };
    }
});

// Initialization'a keyboard shortcuts ekle
const originalInitWithBI = initVizStudio;
initVizStudio = function () {
    originalInitWithBI();
    setupKeyboardShortcuts();
};

// -----------------------------------------------------
// PDF EXPORT & PORTABLE DASHBOARD (Faz 9)
// jsPDF + html2canvas
// -----------------------------------------------------

async function exportToPDF() {
    showToast('PDF oluşturuluyor...', 'info');

    const canvas = document.getElementById('vizCanvas');
    if (!canvas) {
        showToast('Canvas bulunamadı', 'error');
        return;
    }

    try {
        // html2canvas ile ekran görüntüsü al
        const screenshot = await html2canvas(canvas, {
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--gm-bg') || '#1a1a2e'
        });

        // jsPDF ile PDF oluştur
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [screenshot.width / 2, screenshot.height / 2]
        });

        // Başlık ekle
        pdf.setFontSize(18);
        pdf.setTextColor(74, 144, 217);
        pdf.text('Opradox Visual Studio - Dashboard Report', 20, 30);

        // Tarih ekle
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated: ${new Date().toLocaleString('tr-TR')}`, 20, 45);

        // Screenshot ekle
        pdf.addImage(screenshot.toDataURL('image/png'), 'PNG', 0, 60, screenshot.width / 2, screenshot.height / 2);

        // İndir
        pdf.save(`opradox-dashboard-${Date.now()}.pdf`);
        showToast('PDF indirildi!', 'success');

    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        showToast('PDF oluşturulamadı', 'error');
    }
}

async function exportPortableDashboard() {
    showToast('Portable Dashboard oluşturuluyor...', 'info');

    try {
        // Grafik verilerini topla
        const chartsData = VIZ_STATE.charts.map(config => {
            const chart = VIZ_STATE.echartsInstances[config.id];
            return {
                id: config.id,
                type: config.type,
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
        .chart-container { height: 300px; }
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
        <h1>📊 Opradox Dashboard</h1>
        <p>Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p>
    </div>
    <div class="grid" id="dashboardGrid"></div>
    <div class="footer">
        Opradox Visual Studio ile oluşturuldu | opradox.com
    </div>
    <script>
        const chartsData = ${JSON.stringify(chartsData)};
        const grid = document.getElementById('dashboardGrid');
        
        chartsData.forEach((chartData, index) => {
            const card = document.createElement('div');
            card.className = 'chart-card';
            card.innerHTML = '<div class="chart-container" id="chart' + index + '"></div>';
            grid.appendChild(card);
            
            if (chartData.options) {
                const chart = echarts.init(document.getElementById('chart' + index));
                chart.setOption(chartData.options);
            }
        });
        
        window.addEventListener('resize', () => {
            document.querySelectorAll('.chart-container').forEach(el => {
                echarts.getInstanceByDom(el)?.resize();
            });
        });
    <\/script>
</body>
</html>`;

        // İndir
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opradox-portable-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Portable Dashboard indirildi!', 'success');

    } catch (error) {
        console.error('Portable dashboard hatası:', error);
        showToast('Dashboard oluşturulamadı', 'error');
    }
}

// Komut paletine ekle
PALETTE_COMMANDS.push(
    { id: 'pdf', name: 'PDF Export', shortcut: 'Ctrl+Shift+P', icon: 'fa-file-pdf', action: () => exportToPDF() },
    { id: 'portable', name: 'Portable Dashboard', shortcut: 'Ctrl+Shift+D', icon: 'fa-globe', action: () => exportPortableDashboard() },
    { id: 'json-export', name: 'JSON Config Export', shortcut: 'Ctrl+Shift+J', icon: 'fa-file-code', action: () => exportJSONConfig() },
    { id: 'json-import', name: 'JSON Config Import', shortcut: 'Ctrl+Shift+I', icon: 'fa-file-import', action: () => importJSONConfig() }
);

// JSON Config Export/Import (Faz 1 tamamlama)
function exportJSONConfig() {
    const config = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        charts: VIZ_STATE.charts,
        settings: {
            theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
        }
    };

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opradox-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('JSON config indirildi!', 'success');
}

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
                if (config.charts && Array.isArray(config.charts)) {
                    VIZ_STATE.charts = config.charts;
                    // Grafikleri yeniden render et
                    config.charts.forEach(chartConfig => {
                        const container = document.querySelector(`#${chartConfig.id}`);
                        if (container) {
                            const chart = echarts.init(container.querySelector('.viz-chart-render'));
                            renderChart(chart, chartConfig);
                        }
                    });
                    showToast(`${config.charts.length} grafik yüklendi!`, 'success');
                }
            } catch (err) {
                showToast('JSON dosyası okunamadı', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Global
window.exportToPDF = exportToPDF;
window.exportPortableDashboard = exportPortableDashboard;
window.exportJSONConfig = exportJSONConfig;
window.importJSONConfig = importJSONConfig;

// =====================================================
// SESSIONSTORAGE ENTEGRASYonu (Faz 1)
// Excel Studio'dan veri aktarımı
// =====================================================

function loadFromSessionStorage() {
    try {
        const excelData = sessionStorage.getItem('opradox_excel_data');
        if (excelData) {
            const parsed = JSON.parse(excelData);
            VIZ_STATE.data = parsed.data || [];
            VIZ_STATE.columns = parsed.columns || [];
            showToast(`Excel Studio'dan ${VIZ_STATE.data.length} satır veri yüklendi`, 'success');
            return true;
        }
    } catch (e) {
        console.warn('SessionStorage veri yükleme hatası:', e);
    }
    return false;
}

function saveToSessionStorage(data, columns) {
    try {
        sessionStorage.setItem('opradox_excel_data', JSON.stringify({ data, columns }));
        showToast('Veri sessionStorage\'a kaydedildi', 'success');
    } catch (e) {
        showToast('SessionStorage kayıt hatası', 'error');
    }
}

// Sayfa yüklendiğinde sessionStorage'dan veri kontrol et
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => loadFromSessionStorage(), 500);
});

// =====================================================
// SÜRÜKLE-BIRAK DÖNÜŞTÜRME UI (Faz 7)
// Basit formül builder
// =====================================================

function showTransformUI() {
    const existingModal = document.getElementById('transformModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'transformModal';
    modal.className = 'viz-transform-modal';
    modal.innerHTML = `
        <div class="viz-transform-content">
            <div class="viz-transform-header">
                <h3><i class="fas fa-magic"></i> Veri Dönüştürme</h3>
                <span class="viz-transform-close">&times;</span>
            </div>
            <div class="viz-transform-body">
                <div class="viz-transform-section">
                    <label>Kaynak Sütun:</label>
                    <select id="transformSource">
                        ${VIZ_STATE.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="viz-transform-section">
                    <label>Dönüşüm:</label>
                    <select id="transformType">
                        <option value="round">Yuvarla</option>
                        <option value="abs">Mutlak Değer</option>
                        <option value="log">Logaritma</option>
                        <option value="sqrt">Karekök</option>
                        <option value="percent">Yüzdeye Çevir</option>
                        <option value="normalize">Normalize (0-1)</option>
                        <option value="uppercase">Büyük Harf</option>
                        <option value="lowercase">Küçük Harf</option>
                    </select>
                </div>
                <div class="viz-transform-section">
                    <label>Yeni Sütun Adı:</label>
                    <input type="text" id="transformNewCol" placeholder="örn: transformed_column">
                </div>
                <button class="viz-transform-apply" onclick="applyTransform()">
                    <i class="fas fa-check"></i> Dönüştür
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.viz-transform-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function applyTransform() {
    const source = document.getElementById('transformSource').value;
    const type = document.getElementById('transformType').value;
    const newCol = document.getElementById('transformNewCol').value || `${source}_${type}`;

    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        showToast('Dönüştürülecek veri yok', 'error');
        return;
    }

    const transforms = {
        round: v => Math.round(parseFloat(v) || 0),
        abs: v => Math.abs(parseFloat(v) || 0),
        log: v => Math.log(parseFloat(v) || 1),
        sqrt: v => Math.sqrt(parseFloat(v) || 0),
        percent: v => ((parseFloat(v) || 0) * 100).toFixed(2) + '%',
        normalize: (v, arr) => {
            const min = Math.min(...arr);
            const max = Math.max(...arr);
            return ((parseFloat(v) - min) / (max - min)).toFixed(4);
        },
        uppercase: v => String(v).toUpperCase(),
        lowercase: v => String(v).toLowerCase()
    };

    const values = VIZ_STATE.data.map(row => parseFloat(row[source]) || 0);

    VIZ_STATE.data.forEach((row, i) => {
        row[newCol] = transforms[type](row[source], values);
    });

    if (!VIZ_STATE.columns.includes(newCol)) {
        VIZ_STATE.columns.push(newCol);
    }

    document.getElementById('transformModal')?.remove();
    showToast(`"${newCol}" sütunu oluşturuldu`, 'success');
}

// =====================================================
// PWA / SERVICE WORKER (Faz 8)
// =====================================================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker kayıtlı:', reg.scope))
            .catch(err => console.warn('Service Worker kayıt hatası:', err));
    }
}

// Service Worker dosyası oluştur (inline)
function createServiceWorker() {
    const swCode = `
const CACHE_NAME = 'opradox-viz-v1';
const urlsToCache = [
    '/viz.html',
    '/css/style.css',
    '/js/viz.js',
    'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
`;
    console.log('📦 Service Worker kodu hazır (manuel /sw.js oluşturulmalı)');
}

// =====================================================
// INDEXEDDB DEPOLAMA (Faz 8)
// =====================================================

const DB_NAME = 'OpradoxVizDB';
const DB_VERSION = 1;
let vizDB = null;

function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            vizDB = request.result;
            console.log('📀 IndexedDB hazır');
            resolve(vizDB);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('datasets')) {
                db.createObjectStore('datasets', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('dashboards')) {
                db.createObjectStore('dashboards', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function saveToIndexedDB(storeName, data) {
    if (!vizDB) await initIndexedDB();

    return new Promise((resolve, reject) => {
        const tx = vizDB.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add({ ...data, timestamp: Date.now() });

        request.onsuccess = () => {
            showToast('Veri IndexedDB\'ye kaydedildi', 'success');
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}

async function loadFromIndexedDB(storeName) {
    if (!vizDB) await initIndexedDB();

    return new Promise((resolve, reject) => {
        const tx = vizDB.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// =====================================================
// ANNOTATION KATMANI (Faz 9) - fabric.js
// =====================================================

let annotationCanvas = null;

function toggleAnnotationMode() {
    const canvas = document.getElementById('vizCanvas');
    if (!canvas) return;

    let fabricWrapper = document.getElementById('fabricWrapper');

    if (fabricWrapper) {
        fabricWrapper.remove();
        annotationCanvas = null;
        showToast('Annotation modu kapatıldı', 'info');
        return;
    }

    // Fabric canvas oluştur
    fabricWrapper = document.createElement('div');
    fabricWrapper.id = 'fabricWrapper';
    fabricWrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:1000;';

    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.id = 'annotationCanvas';
    fabricCanvas.width = canvas.offsetWidth;
    fabricCanvas.height = canvas.offsetHeight;
    fabricWrapper.appendChild(fabricCanvas);
    canvas.style.position = 'relative';
    canvas.appendChild(fabricWrapper);

    annotationCanvas = new fabric.Canvas('annotationCanvas', {
        isDrawingMode: true,
        selection: true
    });

    annotationCanvas.freeDrawingBrush.color = '#e74c3c';
    annotationCanvas.freeDrawingBrush.width = 3;

    // Toolbar ekle
    const toolbar = document.createElement('div');
    toolbar.className = 'viz-annotation-toolbar';
    toolbar.innerHTML = `
        <button onclick="setAnnotationTool('draw')" title="Çiz"><i class="fas fa-pen"></i></button>
        <button onclick="setAnnotationTool('text')" title="Yazı"><i class="fas fa-font"></i></button>
        <button onclick="setAnnotationTool('arrow')" title="Ok"><i class="fas fa-arrow-right"></i></button>
        <button onclick="clearAnnotations()" title="Temizle"><i class="fas fa-trash"></i></button>
        <button onclick="saveAnnotations()" title="Kaydet"><i class="fas fa-save"></i></button>
        <input type="color" id="annotationColor" value="#e74c3c" onchange="setAnnotationColor(this.value)">
    `;
    fabricWrapper.appendChild(toolbar);

    showToast('Annotation modu açıldı - Çizmeye başlayın!', 'success');
}

function setAnnotationTool(tool) {
    if (!annotationCanvas) return;

    if (tool === 'draw') {
        annotationCanvas.isDrawingMode = true;
    } else if (tool === 'text') {
        annotationCanvas.isDrawingMode = false;
        const text = new fabric.IText('Yazı ekle', {
            left: 100, top: 100, fontSize: 20, fill: '#e74c3c'
        });
        annotationCanvas.add(text);
    } else if (tool === 'arrow') {
        annotationCanvas.isDrawingMode = false;
        const arrow = new fabric.Line([50, 50, 200, 50], {
            stroke: '#e74c3c', strokeWidth: 3
        });
        annotationCanvas.add(arrow);
    }
}

function setAnnotationColor(color) {
    if (annotationCanvas) {
        annotationCanvas.freeDrawingBrush.color = color;
    }
}

function clearAnnotations() {
    if (annotationCanvas) {
        annotationCanvas.clear();
        showToast('Annotations temizlendi', 'info');
    }
}

function saveAnnotations() {
    if (annotationCanvas) {
        const json = annotationCanvas.toJSON();
        localStorage.setItem('viz_annotations', JSON.stringify(json));
        showToast('Annotations kaydedildi', 'success');
    }
}

// =====================================================
// URL-ENCODED PAYLAŞIM (Faz 9) - LZString
// =====================================================

function shareViaURL() {
    const config = {
        charts: VIZ_STATE.charts,
        version: '1.0'
    };

    try {
        const json = JSON.stringify(config);
        const compressed = LZString.compressToEncodedURIComponent(json);
        const shareURL = `${window.location.origin}${window.location.pathname}?share=${compressed}`;

        // Kopyala
        navigator.clipboard.writeText(shareURL).then(() => {
            showToast('Paylaşım linki kopyalandı!', 'success');
        });

        // Modal ile göster
        const modal = document.createElement('div');
        modal.className = 'viz-share-modal';
        modal.innerHTML = `
            <div class="viz-share-content">
                <h3><i class="fas fa-share-alt"></i> Paylaşım Linki</h3>
                <textarea readonly>${shareURL}</textarea>
                <button onclick="this.parentElement.parentElement.remove()">Kapat</button>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);

    } catch (e) {
        showToast('Paylaşım linki oluşturulamadı', 'error');
    }
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');

    if (shareData) {
        try {
            const json = LZString.decompressFromEncodedURIComponent(shareData);
            const config = JSON.parse(json);

            if (config.charts && Array.isArray(config.charts)) {
                VIZ_STATE.charts = config.charts;
                showToast(`Paylaşılan dashboard yüklendi (${config.charts.length} grafik)`, 'success');
                // URL'den parametreyi temizle
                window.history.replaceState({}, '', window.location.pathname);
            }
        } catch (e) {
            console.warn('Paylaşım verisi yüklenemedi:', e);
        }
    }
}

// Sayfa yüklendiğinde URL'den veri kontrol et
document.addEventListener('DOMContentLoaded', loadFromURL);

// Komut paletine yeni komutları ekle
PALETTE_COMMANDS.push(
    { id: 'transform', name: 'Veri Dönüştür', shortcut: 'Ctrl+Shift+T', icon: 'fa-magic', action: () => showTransformUI() },
    { id: 'annotate', name: 'Annotation Modu', shortcut: 'Ctrl+Shift+A', icon: 'fa-pen', action: () => toggleAnnotationMode() },
    { id: 'share-url', name: 'URL ile Paylaş', shortcut: 'Ctrl+Shift+U', icon: 'fa-share-alt', action: () => shareViaURL() },
    { id: 'save-idb', name: 'IndexedDB\'ye Kaydet', shortcut: 'Ctrl+Shift+S', icon: 'fa-database', action: () => saveToIndexedDB('dashboards', { charts: VIZ_STATE.charts }) },
    { id: 'session-load', name: 'SessionStorage\'dan Yükle', shortcut: '', icon: 'fa-sync', action: () => loadFromSessionStorage() }
);

// Global exports
window.showTransformUI = showTransformUI;
window.applyTransform = applyTransform;
window.toggleAnnotationMode = toggleAnnotationMode;
window.setAnnotationTool = setAnnotationTool;
window.setAnnotationColor = setAnnotationColor;
window.clearAnnotations = clearAnnotations;
window.saveAnnotations = saveAnnotations;
window.shareViaURL = shareViaURL;
window.loadFromSessionStorage = loadFromSessionStorage;
window.saveToSessionStorage = saveToSessionStorage;
window.initIndexedDB = initIndexedDB;
window.saveToIndexedDB = saveToIndexedDB;
window.loadFromIndexedDB = loadFromIndexedDB;

// IndexedDB başlat
initIndexedDB().catch(console.warn);

// =====================================================
// ACCORDION TOGGLE (Sidebar Collapsible Sections)
// =====================================================

function toggleAccordion(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.viz-accordion-icon');

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        headerElement.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        headerElement.classList.add('collapsed');
    }
}

// Global
window.toggleAccordion = toggleAccordion;
