// =====================================================
// CHARTS.JS - Opradox Visual Studio Chart Management
// Chart creation, widget management, resizing, export
// =====================================================

import { VIZ_STATE, VIZ_TEXTS, getText } from './core.js';
import { showToast, showSettings, hideSettings, updateEmptyState, createModal } from './ui.js';
import { aggregateData, updateDataProfile } from './data.js';

// -----------------------------------------------------
// CHART CREATION & MANAGEMENT
// -----------------------------------------------------
export function addChart(type = 'bar') {
    const chartId = `chart_${++VIZ_STATE.chartCounter}`;

    const chartConfig = {
        id: chartId,
        type: type,
        title: `Grafik ${VIZ_STATE.chartCounter}`,
        xAxis: VIZ_STATE.columns[0] || '',
        yAxis: VIZ_STATE.columns[1] || VIZ_STATE.columns[0] || '',
        yAxes: [VIZ_STATE.columns[1] || VIZ_STATE.columns[0] || ''],
        y2Axis: null,
        useDualAxis: false,
        aggregation: 'sum',
        color: '#4a90d9',
        dataLimit: 20,
        datasetId: VIZ_STATE.activeDatasetId,
        // Advanced options defaults
        minLength: 3,
        maxWords: 100,
        minCol: null,
        maxCol: null
    };

    VIZ_STATE.charts.push(chartConfig);

    // Widget oluştur
    createChartWidget(chartConfig);
    updateEmptyState();

    // Seç ve ayarları göster
    selectChart(chartId);
}

export function createChartWidget(config) {
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

    // ResizeObserver ile otomatik boyutlandırma
    if (typeof ResizeObserver !== 'undefined') {
        const chartContainer = document.getElementById(`${config.id}_chart`);
        if (chartContainer) {
            const resizeObserver = new ResizeObserver(() => {
                const chart = VIZ_STATE.echartsInstances[config.id];
                if (chart) {
                    chart.resize();
                }
            });
            resizeObserver.observe(chartContainer);

            // Observer'ı temizleme için sakla
            if (!VIZ_STATE.resizeObservers) VIZ_STATE.resizeObservers = {};
            VIZ_STATE.resizeObservers[config.id] = resizeObserver;
        }
    }
}

export function removeWidget(chartId) {
    // ECharts instance'ı temizle
    if (VIZ_STATE.echartsInstances[chartId]) {
        VIZ_STATE.echartsInstances[chartId].dispose();
        delete VIZ_STATE.echartsInstances[chartId];
    }

    // ResizeObserver temizle
    if (VIZ_STATE.resizeObservers && VIZ_STATE.resizeObservers[chartId]) {
        VIZ_STATE.resizeObservers[chartId].disconnect();
        delete VIZ_STATE.resizeObservers[chartId];
    }

    // DOM'dan kaldır
    const widget = document.getElementById(chartId);
    if (widget) widget.remove();

    // State'den kaldır
    VIZ_STATE.charts = VIZ_STATE.charts.filter(c => c.id !== chartId);

    if (VIZ_STATE.selectedChart === chartId) {
        if (typeof hideSettings === 'function') hideSettings();
        VIZ_STATE.selectedChart = null;
    }

    if (typeof updateEmptyState === 'function') updateEmptyState();
    if (typeof showToast === 'function') showToast('Grafik silindi', 'success');
}

// -----------------------------------------------------
// WIDGET UTILITIES
// -----------------------------------------------------
export function selectChart(chartId) {
    // Önceki seçimi kaldır
    document.querySelectorAll('.viz-chart-widget').forEach(w => w.classList.remove('selected'));

    // Yeni seçimi uygula
    const widget = document.getElementById(chartId);
    if (widget) {
        widget.classList.add('selected');
    }

    VIZ_STATE.selectedChart = chartId;
    if (typeof showSettings === 'function') showSettings(configFromId(chartId));
}

function configFromId(id) {
    return VIZ_STATE.charts.find(c => c.id === id);
}

export function showWidgetMenu(chartId, event) {
    // Mevcut menüyü kapat
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

    // Pozisyon - fullscreen'de sola kaydır
    const rect = event.target.closest('button').getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.zIndex = '10001';

    // Ekran sağına taşmasın
    const menuWidth = 160;
    if (rect.left + menuWidth > window.innerWidth) {
        menu.style.right = `${window.innerWidth - rect.right}px`;
    } else {
        menu.style.left = `${rect.left}px`;
    }

    document.body.appendChild(menu);

    // Dışarı tıklayınca kapat
    setTimeout(() => {
        document.addEventListener('click', closeWidgetMenu);
    }, 100);
}

export function closeWidgetMenu() {
    const menu = document.getElementById('widgetActionMenu');
    if (menu) menu.remove();
    document.removeEventListener('click', closeWidgetMenu);
}

export function editWidget(chartId) {
    selectChart(chartId);

    // Sağ panel görünür yap
    const settingsPane = document.getElementById('vizSettingsPane');
    if (settingsPane) {
        settingsPane.scrollIntoView({ behavior: 'smooth' });
    }

    if (typeof showToast === 'function') showToast('Grafik seçildi - sağ panelden düzenleyebilirsiniz', 'info');
}

export function toggleWidgetFullscreen(chartId) {
    const widget = document.getElementById(chartId);
    if (!widget) return;

    const isFullscreen = widget.classList.contains('viz-widget-fullscreen');

    if (isFullscreen) {
        // Küçült - eski boyutlara dön
        widget.classList.remove('viz-widget-fullscreen');
        widget.style.width = '';
        widget.style.height = '';
        if (typeof showToast === 'function') showToast('Normal görünüm', 'info');
    } else {
        // Büyüt
        widget.classList.add('viz-widget-fullscreen');
        if (typeof showToast === 'function') showToast('Tam ekran - çarktan "Küçült" ile çıkın', 'info');
    }

    // Grafik boyutunu güncelle
    setTimeout(() => {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (chart) chart.resize();
    }, 350);
}

export function duplicateWidget(chartId) {
    const config = VIZ_STATE.charts.find(c => c.id === chartId);
    if (!config) return;

    const newConfig = {
        ...config,
        id: `chart_${++VIZ_STATE.chartCounter}`,
        title: `${config.title} (Kopya)`
    };

    VIZ_STATE.charts.push(newConfig);
    createChartWidget(newConfig);
    if (typeof showToast === 'function') showToast('Grafik kopyalandı', 'success');
}

export function startWidgetResize(event, chartId) {
    event.preventDefault();
    event.stopPropagation();

    const widget = document.getElementById(chartId);
    if (!widget) return;

    // Fullscreen modda resize yapma
    if (widget.classList.contains('viz-widget-fullscreen')) return;

    const chartContainer = document.getElementById(`${chartId}_chart`);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = widget.offsetWidth;
    const startHeight = widget.offsetHeight;
    const chart = VIZ_STATE.echartsInstances[chartId];
    const headerHeight = 45; // Widget header yüksekliği

    let resizeThrottle = null;

    function doResize(e) {
        const newWidth = Math.max(200, startWidth + e.clientX - startX);
        const newHeight = Math.max(150, startHeight + e.clientY - startY);

        widget.style.width = `${newWidth}px`;
        widget.style.height = `${newHeight}px`;

        // Chart container'a açık boyut ver
        if (chartContainer) {
            chartContainer.style.width = `${newWidth - 20}px`;
            chartContainer.style.height = `${newHeight - headerHeight - 10}px`;
        }

        // Throttled ECharts resize
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

        // Final ECharts resize
        if (chart) chart.resize();
    }

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

// -----------------------------------------------------
// DROPDOWN & UI UPDATES
// -----------------------------------------------------
export function updateDropdowns() {
    const xSelect = document.getElementById('chartXAxis');
    const ySelect = document.getElementById('chartYAxis');
    const y2Select = document.getElementById('chartY2Axis');

    const optionsHtml = '<option value="">Seçin...</option>' +
        VIZ_STATE.columns.map(col => `<option value="${col}">${col}</option>`).join('');

    if (xSelect) xSelect.innerHTML = optionsHtml;
    if (ySelect) ySelect.innerHTML = optionsHtml;
    if (y2Select) {
        y2Select.innerHTML = '<option value="">Otomatik (seçilen 2. sütun)</option>' +
            VIZ_STATE.columns.map(col => `<option value="${col}">${col}</option>`).join('');
    }

    // Dual axis toggle listener
    const useDualAxis = document.getElementById('useDualAxis');
    const y2AxisWrapper = document.getElementById('y2AxisWrapper');
    if (useDualAxis && y2AxisWrapper) {
        useDualAxis.onchange = function () {
            y2AxisWrapper.style.display = this.checked ? 'block' : 'none';
        };
    }
}

// -----------------------------------------------------
// EXPORT FUNCTIONS
// -----------------------------------------------------
export function exportChartAsPNG() {
    if (!VIZ_STATE.selectedChart) {
        if (typeof showToast === 'function') showToast('Önce bir grafik seçin', 'warning');
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
    if (typeof showToast === 'function') showToast(getText('export_success') || 'İndiriliyor...', 'success');
}

export function exportAllChartsPNG() {
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
    if (typeof showToast === 'function') showToast(`${VIZ_STATE.charts.length} grafik export ediliyor...`, 'success');
}

export async function exportChartAsPDF() {
    // PDF export charts specific logic or reuse dashboard export
    // Assuming this requests exporting the *selected* chart as PDF or the dashboard
    // Based on user request "exportChartAsPDF", likely similar to PNG but PDF
    // But libraries might be limited. For now, implement stub or reuse dashboard logic if applicable.
    // Viz Source had exportDashboardAsPDF. I'll implement that and alias if needed.

    // Fallback to dashboard export for now as single chart PDF isn't standard in ECharts without jsPDF
    const dashboard = document.getElementById('vizDashboardGrid');
    if (!dashboard) return;

    if (typeof html2canvas === 'undefined' || (typeof jspdf === 'undefined' && !window.jspdf)) {
        if (typeof showToast === 'function') showToast('PDF kütüphaneleri eksik', 'error');
        return;
    }

    if (typeof showToast === 'function') showToast('PDF oluşturuluyor...', 'info');

    try {
        const canvas = await html2canvas(dashboard, {
            backgroundColor: '#1a1a2e',
            scale: 2
        });

        const { jsPDF } = window.jspdf || window;
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgWidth = 287;
        const pageHeight = 200;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 5, 5, imgWidth, Math.min(imgHeight, pageHeight));
        pdf.save('dashboard.pdf');

        if (typeof showToast === 'function') showToast('PDF indirildi', 'success');
    } catch (error) {
        console.error('PDF hatası:', error);
        if (typeof showToast === 'function') showToast('PDF oluşturulamadı', 'error');
    }
}

function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportChartAsSVG(chartId) {
    const targetId = chartId || VIZ_STATE.selectedChart;
    if (!targetId) {
        if (typeof showToast === 'function') showToast('Önce bir grafik seçin', 'warning');
        return;
    }

    const chart = VIZ_STATE.echartsInstances[targetId];
    if (!chart) {
        if (typeof showToast === 'function') showToast('Grafik bulunamadı', 'error');
        return;
    }

    try {
        const svgUrl = chart.getDataURL({
            type: 'svg',
            pixelRatio: 2,
            backgroundColor: document.body.classList.contains('day-mode') ? '#fff' : '#1a1a2e'
        });

        downloadFile(svgUrl, `chart_${targetId}.svg`);
        if (typeof showToast === 'function') showToast('SVG indirildi', 'success');
    } catch (error) {
        console.error('SVG export hatası:', error);
        if (typeof showToast === 'function') showToast('SVG oluşturulamadı', 'error');
    }
}


// -----------------------------------------------------
// RENDER CHART (SKELETON)
// -----------------------------------------------------
export function renderChart(config) {
    const chartDom = document.getElementById(`${config.id}_chart`);
    if (!chartDom) return;

    // Eski instance'ı temizle
    if (VIZ_STATE.echartsInstances[config.id]) {
        VIZ_STATE.echartsInstances[config.id].dispose();
    }

    const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
    const chart = echarts.init(chartDom, theme);
    VIZ_STATE.echartsInstances[config.id] = chart;

    // Multi-Dataset Desteği: Widget kendi dataset'ini kullanır
    const dataset = config.datasetId
        ? VIZ_STATE.getDatasetById(config.datasetId)
        : VIZ_STATE.getActiveDataset();
    const chartData = dataset?.data || VIZ_STATE.data || [];

    // Veri aggregation - Çoklu Y Ekseni Desteği
    let xData, yData;
    let multiSeriesData = []; // Çoklu seri için veri yapısı
    const yColumns = config.yAxes || [config.yAxis]; // Geriye uyumlu

    // Renk paleti (çoklu seri için)
    const colorPalette = [
        config.color || '#4a90d9', '#00d97e', '#f6c23e', '#e74a3b', '#36b9cc',
        '#6f42c1', '#fd7e14', '#20c9a6', '#858796', '#5a5c69'
    ];

    if (chartData && chartData.length > 0 && config.xAxis && yColumns.length > 0) {
        // Cross-filter uygula
        let filteredData = chartData;
        if (VIZ_STATE.crossFilterEnabled && VIZ_STATE.crossFilterValue) {
            filteredData = chartData.filter(row =>
                Object.values(row).some(v => String(v) === VIZ_STATE.crossFilterValue)
            );
        }

        // Her Y sütunu için ayrı aggregation yap
        yColumns.forEach((yCol, idx) => {
            if (!yCol) return;
            const aggregated = aggregateData(filteredData, config.xAxis, yCol, config.aggregation, config.dataLimit || 20);

            // İlk seriden X verisini al (tüm seriler aynı X'i kullanır)
            if (idx === 0) {
                xData = aggregated.categories;
            }

            let values = aggregated.values;

            // What-If Simulator - çarpan SADECE SEÇİLİ GRAFİĞE uygula
            if (VIZ_STATE.whatIfMultiplier && VIZ_STATE.whatIfMultiplier !== 1 && config.id === VIZ_STATE.selectedChart) {
                values = values.map(v => v * VIZ_STATE.whatIfMultiplier);
            }

            multiSeriesData.push({
                name: yCol,
                values: values,
                color: colorPalette[idx % colorPalette.length],
                yAxisIndex: config.useDualAxis && idx > 0 ? 1 : 0
            });
        });

        // Geriye uyumluluk için ilk serinin değerlerini yData'ya ata
        yData = multiSeriesData[0]?.values || [];
    } else {
        // Demo veri
        xData = ['A', 'B', 'C', 'D', 'E'];
        yData = [120, 200, 150, 80, 70];
        multiSeriesData = [{ name: 'Demo', values: yData, color: config.color, yAxisIndex: 0 }];
    }


    let option = {};

    switch (config.type) {
        case 'bar':
            // Çoklu seri için series array oluştur
            const barSeries = multiSeriesData.map((s, idx) => ({
                name: s.name,
                type: 'bar',
                data: s.values,
                yAxisIndex: s.yAxisIndex,
                itemStyle: { color: s.color }
            }));

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: multiSeriesData.length > 1 ? {
                    top: 30,
                    data: multiSeriesData.map(s => s.name)
                } : undefined,
                xAxis: {
                    type: 'category',
                    data: xData,
                    name: config.xAxis || '',
                    nameLocation: 'center',
                    nameGap: 50,
                    axisLabel: {
                        rotate: 60,
                        interval: 0,
                        fontSize: 10,
                        formatter: function (value) {
                            // 8 karakter + ... ile kısalt
                            return String(value).length > 8 ? String(value).slice(0, 6) + '..' : value;
                        }
                    }
                },
                yAxis: config.useDualAxis && multiSeriesData.length > 1 ? [
                    { type: 'value', name: multiSeriesData[0]?.name || 'Sol Eksen', position: 'left', nameLocation: 'middle', nameGap: 50 },
                    { type: 'value', name: multiSeriesData[1]?.name || 'Sağ Eksen', position: 'right', nameLocation: 'middle', nameGap: 50 }
                ] : {
                    type: 'value',
                    name: config.yAxis || '',
                    nameLocation: 'middle',
                    nameGap: 50
                },
                grid: { bottom: 120, left: 80, right: config.useDualAxis ? 80 : 20, top: multiSeriesData.length > 1 ? 60 : 40 },
                series: barSeries
            };
            break;

        case 'line':
            // Çoklu seri için series array oluştur
            const lineSeries = multiSeriesData.map((s, idx) => ({
                name: s.name,
                type: 'line',
                data: s.values,
                yAxisIndex: s.yAxisIndex,
                smooth: true,
                itemStyle: { color: s.color }
            }));

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                legend: multiSeriesData.length > 1 ? {
                    top: 30,
                    data: multiSeriesData.map(s => s.name)
                } : undefined,
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
                        formatter: function (value) {
                            return String(value).length > 8 ? String(value).slice(0, 6) + '..' : value;
                        }
                    }
                },
                yAxis: config.useDualAxis && multiSeriesData.length > 1 ? [
                    { type: 'value', name: multiSeriesData[0]?.name || 'Sol Eksen', position: 'left', nameLocation: 'middle', nameGap: 50 },
                    { type: 'value', name: multiSeriesData[1]?.name || 'Sağ Eksen', position: 'right', nameLocation: 'middle', nameGap: 50 }
                ] : {
                    type: 'value',
                    name: config.yAxis || '',
                    nameLocation: 'middle',
                    nameGap: 50
                },
                grid: { bottom: 100, left: 80, right: config.useDualAxis ? 80 : 20, top: multiSeriesData.length > 1 ? 60 : 40 },
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
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
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
                        formatter: function (value) {
                            return String(value).length > 8 ? String(value).slice(0, 6) + '..' : value;
                        }
                    }
                },
                yAxis: {
                    type: 'value',
                    name: config.yAxis || '',
                    nameLocation: 'middle',
                    nameGap: 50
                },
                grid: { bottom: 100, left: 80 },
                series: [{ data: yData, type: 'line', areaStyle: { color: config.color + '40' }, itemStyle: { color: config.color } }]
            };
            break;

        case 'scatter':
            // Scatter Multi-X: Her X sütunu için ayrı seri oluştur
            // X eksenleri de çoklu seçilebilir (config.xAxes dizisi)
            const xColumns = config.xAxes || [config.xAxis];
            const scatterSeries = [];
            let useCategoryAxis = false; // Kategorik X ekseni mi?
            let categoryLabels = []; // Kategorik X için etiketler

            // Chartdata'dan gerçek [x, y] koordinat çiftleri oluştur
            xColumns.forEach((xCol, idx) => {
                if (!xCol) return;

                // Her X sütunu için Y sütunuyla eşleşen koordinat çiftleri oluştur
                const yCol = config.yAxis || (config.yAxes && config.yAxes[0]);
                if (!yCol) return;

                // X sütununun tipini kontrol et (sayısal mı kategorik mi?)
                const sampleXValues = chartData.slice(0, 10).map(row => row[xCol]);
                const numericCount = sampleXValues.filter(v => !isNaN(parseFloat(v))).length;
                const isXNumeric = numericCount > sampleXValues.length * 0.5; // %50'den fazla sayısal mı?

                let scatterData;

                if (isXNumeric) {
                    // Sayısal X: Gerçek [x, y] koordinatları
                    scatterData = chartData.map(row => {
                        const xVal = parseFloat(row[xCol]);
                        const yVal = parseFloat(row[yCol]);
                        return [xVal, yVal];
                    }).filter(d => !isNaN(d[0]) && !isNaN(d[1]));
                } else {
                    // Kategorik X: Index bazlı koordinat, etiket olarak kategori değeri
                    useCategoryAxis = true;
                    const uniqueCategories = [...new Set(chartData.map(row => String(row[xCol] || '(Boş)')))];
                    if (idx === 0) categoryLabels = uniqueCategories;

                    scatterData = chartData.map((row, rowIdx) => {
                        const xCategory = String(row[xCol] || '(Boş)');
                        const xIdx = uniqueCategories.indexOf(xCategory);
                        const yVal = parseFloat(row[yCol]);
                        return {
                            value: [xIdx, yVal],
                            name: xCategory
                        };
                    }).filter(d => !isNaN(d.value[1]));
                }

                if (scatterData.length > 0) {
                    scatterSeries.push({
                        name: `${xCol} vs ${yCol}`,
                        type: 'scatter',
                        data: scatterData,
                        symbolSize: 10,
                        itemStyle: { color: colorPalette[idx % colorPalette.length] }
                    });
                }
            });

            // Eğer hiç seri oluşturulamadıysa demo veri kullan
            if (scatterSeries.length === 0 || scatterSeries.every(s => s.data.length === 0)) {
                console.warn('⚠️ Scatter: Geçerli veri bulunamadı, demo veri kullanılıyor');
                scatterSeries.length = 0; // Temizle
                scatterSeries.push({
                    name: 'Demo (Veri Yok)',
                    type: 'scatter',
                    data: yData.map((v, i) => [i, v]),
                    symbolSize: 10,
                    itemStyle: { color: config.color }
                });
            }

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: {
                    trigger: 'item',
                    formatter: (p) => {
                        const xLabel = useCategoryAxis && p.data?.name ? p.data.name : (p.value[0]?.toFixed ? p.value[0].toFixed(2) : p.value[0]);
                        const yLabel = p.value[1]?.toFixed ? p.value[1].toFixed(2) : p.value[1];
                        return `${p.seriesName}<br/>X: ${xLabel}<br/>Y: ${yLabel}`;
                    }
                },
                legend: scatterSeries.length > 1 ? {
                    top: 30,
                    data: scatterSeries.map(s => s.name)
                } : undefined,
                xAxis: useCategoryAxis ? {
                    type: 'category',
                    data: categoryLabels,
                    name: xColumns.length === 1 ? xColumns[0] : 'Kategori',
                    nameLocation: 'middle',
                    nameGap: 30,
                    axisLabel: {
                        rotate: 45,
                        interval: 0,
                        fontSize: 9,
                        formatter: (v) => String(v).length > 10 ? String(v).slice(0, 8) + '..' : v
                    }
                } : {
                    type: 'value',
                    name: xColumns.length === 1 ? xColumns[0] : 'X',
                    nameLocation: 'middle',
                    nameGap: 30
                },
                yAxis: {
                    type: 'value',
                    name: config.yAxis || 'Y',
                    nameLocation: 'middle',
                    nameGap: 50
                },
                grid: {
                    bottom: useCategoryAxis ? 80 : 60,
                    left: 80,
                    right: 40,
                    top: scatterSeries.length > 1 ? 60 : 40
                },
                // DataZoom: Mouse ile zoom yapabilme
                dataZoom: [
                    { type: 'inside', xAxisIndex: 0 },
                    { type: 'inside', yAxisIndex: 0 },
                    { type: 'slider', xAxisIndex: 0, bottom: 5, height: 20 }
                ],
                series: scatterSeries
            };
            break;

        case 'polar':
        case 'rose':
            // Polar/Rose Chart
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item' },
                polar: { radius: [30, '80%'] },
                angleAxis: { type: 'category', data: xData.slice(0, 8), startAngle: 90 },
                radiusAxis: {},
                series: [{
                    type: 'bar',
                    data: yData.slice(0, 8),
                    coordinateSystem: 'polar',
                    itemStyle: { color: config.color }
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

        case 'heatmap':
            // Heatmap Implementation
            const heatmapData = [];
            const categories = xData.slice(0, 20); // Limit categories for heatmap
            const yCategories = yData ? xData.slice(0, 20) : categories; // Square if no separate Y

            // Generate heatmap data (dummy/aggregated)
            for (let i = 0; i < categories.length; i++) {
                for (let j = 0; j < yCategories.length; j++) {
                    heatmapData.push([i, j, Math.random() * 100]); // Placeholder logic if raw data not suitable
                }
            }

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { position: 'top' },
                xAxis: { type: 'category', data: categories, splitArea: { show: true } },
                yAxis: { type: 'category', data: yCategories, splitArea: { show: true } },
                visualMap: {
                    min: 0, max: 100,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: '0%'
                },
                series: [{
                    name: config.title,
                    type: 'heatmap',
                    data: heatmapData,
                    label: { show: true },
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 1
                    }
                }]
            };
            break;

        case 'step':
        case 'step-line':
            // Step Line - basamaklı çizgi
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80 },
                series: [{
                    type: 'line',
                    step: 'middle',
                    data: yData,
                    itemStyle: { color: config.color },
                    areaStyle: { color: config.color + '20' }
                }]
            };
            break;

        case 'lollipop':
            // Lollipop Chart - noktalı çubuk
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: xData, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                grid: { bottom: 80 },
                series: [
                    {
                        type: 'bar',
                        data: yData,
                        barWidth: 4,
                        itemStyle: { color: config.color }
                    },
                    {
                        type: 'scatter',
                        data: yData,
                        symbolSize: 15,
                        itemStyle: { color: config.color }
                    }
                ]
            };
            break;

        case 'bullet':
            // Bullet Chart - KPI hedef vs gerçek
            const bulletActual = yData.reduce((a, b) => a + b, 0) / (yData.length || 1);
            const bulletTarget = bulletActual * 1.2;

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: `Gerçek: ${bulletActual.toFixed(0)}<br>Hedef: ${bulletTarget.toFixed(0)}` },
                xAxis: { type: 'value', max: bulletTarget * 1.3 },
                yAxis: { type: 'category', data: ['KPI'] },
                series: [
                    {
                        type: 'bar',
                        data: [bulletTarget * 1.2],
                        barWidth: 30,
                        itemStyle: { color: '#e0e0e0' },
                        z: 1
                    },
                    {
                        type: 'bar',
                        data: [bulletActual],
                        barWidth: 15,
                        itemStyle: { color: bulletActual >= bulletTarget ? '#27ae60' : config.color },
                        z: 2
                    },
                    {
                        type: 'scatter',
                        data: [[bulletTarget, 0]],
                        symbol: 'rect',
                        symbolSize: [4, 35],
                        itemStyle: { color: '#333' },
                        z: 3
                    }
                ]
            };
            break;

        case 'calendar':
            // Calendar Heatmap - yıllık takvim görünümü
            const calendarData = [];
            const startDate = new Date();
            startDate.setDate(1);
            startDate.setMonth(0);

            for (let i = 0; i < 365; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                calendarData.push([dateStr, Math.floor(Math.random() * 100)]);
            }

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: p => `${p.data[0]}: ${p.data[1]}` },
                visualMap: {
                    min: 0, max: 100,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: 10,
                    inRange: { color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] }
                },
                calendar: {
                    top: 60,
                    left: 50,
                    right: 30,
                    cellSize: 13,
                    range: new Date().getFullYear(),
                    itemStyle: { borderWidth: 1, borderColor: '#fff' }
                },
                series: [{
                    type: 'heatmap',
                    coordinateSystem: 'calendar',
                    data: calendarData
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

        case 'treemap':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: '{b}: {c}' },
                series: [{
                    type: 'treemap',
                    data: xData.map((name, i) => ({
                        name: name,
                        value: yData[i],
                        itemStyle: { color: `hsl(${(i * 360 / xData.length)}, 65%, 50%)` }
                    })),
                    label: { show: true, formatter: '{b}\n{c}' },
                    breadcrumb: { show: false }
                }]
            };
            break;

        case 'sunburst':
            const sunburstData = xData.slice(0, 8).map((name, i) => ({
                name: name,
                value: yData[i],
                children: [{
                    name: `${name} A`,
                    value: yData[i] * 0.6
                }, {
                    name: `${name} B`,
                    value: yData[i] * 0.4
                }]
            }));
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: '{b}: {c}' },
                series: [{
                    type: 'sunburst',
                    data: sunburstData,
                    radius: [0, '90%'],
                    label: { show: true, fontSize: 10 },
                    itemStyle: { borderRadius: 4, borderWidth: 2 }
                }]
            };
            break;

        case 'sankey':
            const sankeyNodes = xData.slice(0, 6).map(name => ({ name }));
            sankeyNodes.push({ name: 'Toplam' });
            const sankeyLinks = xData.slice(0, 6).map((name, i) => ({
                source: name,
                target: 'Toplam',
                value: yData[i]
            }));
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'item', formatter: '{b}: {c}' },
                series: [{
                    type: 'sankey',
                    layout: 'none',
                    emphasis: { focus: 'adjacency' },
                    data: sankeyNodes,
                    links: sankeyLinks,
                    lineStyle: { color: 'gradient', curveness: 0.5 }
                }]
            };
            break;

        case 'boxplot':
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

        case 'bubble':
            // Bubble Chart - 3 boyutlu dağılım (x, y, size)
            const bubbleData = yData.map((v, i) => [
                i,
                v,
                Math.abs(v) / (Math.max(...yData.map(Math.abs)) || 1) * 50 + 10
            ]);

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: p => `${xData[p.data[0]]}: ${p.data[1]}` },
                xAxis: { type: 'value', name: 'X' },
                yAxis: { type: 'value', name: 'Y' },
                series: [{
                    type: 'scatter',
                    data: bubbleData,
                    symbolSize: (data) => data[2],
                    itemStyle: { color: config.color, opacity: 0.7 }
                }]
            };
            break;

        case 'candlestick':
            // Candlestick (Mum Grafiği) - OHLC verisi gerektirir
            // Basit simülasyon veya mevcut veri yapısına uyum
            const kData = yData.map(v => {
                if (Array.isArray(v) && v.length >= 4) return v; // Hazır OHLC
                if (typeof v === 'object' && v.open) return [v.open, v.close, v.low, v.high]; // Obje OHLC
                // Tekil değerden simülasyon (Fallback)
                const base = Number(v) || 0;
                return [base * 0.95, base * 1.05, base * 0.9, base * 1.1];
            });

            option = {
                title: { text: config.title, left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                xAxis: { type: 'category', data: xData, scale: true },
                yAxis: { scale: true, splitArea: { show: true } },
                grid: { bottom: 80 },
                series: [{
                    type: 'candlestick',
                    data: kData,
                    itemStyle: {
                        color: '#00da3c',
                        color0: '#ec0000',
                        borderColor: '#00da3c',
                        borderColor0: '#ec0000'
                    }
                }]
            };
            break;

        case 'violin':
            // Violin Plot - Boxplot varyasyonu
            // Veri hazırlığı boxplot ile benzer, kernel density estimation simülasyonu
            const vSorted = [...yData].sort((a, b) => a - b);
            option = {
                title: { text: config.title, left: 'center' },
                tooltip: { trigger: 'item' },
                xAxis: { type: 'category', data: [config.xAxis || 'Grup'] },
                yAxis: { type: 'value', scale: true },
                series: [{
                    type: 'boxplot', // Fallback olarak boxplot göster
                    data: [vSorted],
                    itemStyle: { color: config.color, borderColor: config.color },
                    label: { show: true, formatter: 'Violin (Preview)' }
                }, {
                    type: 'scatter', // Dağılım noktaları
                    data: yData.map(y => [0, y]),
                    symbolSize: 3,
                    itemStyle: { color: '#333', opacity: 0.5 }
                }]
            };
            break;

        case 'wordCloud':
            // Word Cloud
            // echarts-wordcloud uzantısı gerektirir
            const wordData = xData.map((text, i) => ({
                name: text,
                value: yData[i] || Math.random() * 100
            }));

            option = {
                title: { text: config.title, left: 'center' },
                tooltip: { show: true },
                series: [{
                    type: 'wordCloud',
                    shape: 'circle',
                    left: 'center',
                    top: 'center',
                    width: '90%',
                    height: '90%',
                    right: null,
                    bottom: null,
                    sizeRange: [12, 60],
                    rotationRange: [-90, 90],
                    rotationStep: 45,
                    gridSize: 8,
                    drawOutOfBound: false,
                    layoutAnimation: true,
                    textStyle: {
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold',
                        color: function () {
                            // Random color
                            return 'rgb(' + [
                                Math.round(Math.random() * 160),
                                Math.round(Math.random() * 160),
                                Math.round(Math.random() * 160)
                            ].join(',') + ')';
                        }
                    },
                    emphasis: {
                        focus: 'self',
                        textStyle: {
                            textShadowBlur: 10,
                            textShadowColor: '#333'
                        }
                    },
                    data: wordData
                }]
            };
            break;

        case 'gantt':
            // Gantt Chart - delegates to dedicated function
            renderGanttChart(config);
            return; // renderGanttChart handles its own chart creation

        case 'waterfall':
            // Waterfall Chart - delegates to dedicated function
            renderWaterfallChart(config);
            return; // renderWaterfallChart handles its own chart creation

        case 'errorbar':
        case 'error-bar':
            // Error Bar Chart - delegates to dedicated function
            renderErrorBar(config);
            return; // renderErrorBar handles its own chart creation

        default:
            option = {
                title: { text: config.title, left: 'center' },
                series: []
            };
    }

    chart.setOption(option);

    // Cross-filter: grafik öğesine tıklandığında diğer grafikleri filtrele
    chart.off('click'); // Önceki listener'ları temizle
    chart.on('click', (params) => {
        if (!VIZ_STATE.crossFilterEnabled) return;

        const clickedValue = params.name || params.data?.name || params.value;
        if (!clickedValue) return;

        console.log('🔗 Cross-filter tıklama:', clickedValue);

        // Aynı değere tekrar tıklandıysa filtreyi kaldır
        if (VIZ_STATE.crossFilterValue === clickedValue) {
            VIZ_STATE.crossFilterValue = null;
            if (typeof showToast === 'function') showToast('Cross-filter kaldırıldı', 'info');
        } else {
            VIZ_STATE.crossFilterValue = String(clickedValue);
            if (typeof showToast === 'function') showToast(`Filtre: "${clickedValue}"`, 'info');
        }

        // Tüm grafikleri yeniden render et
        if (typeof rerenderAllCharts === 'function') rerenderAllCharts();
    });

    // İstatistik overlay'ları uygula (Faz 2)
    if (typeof applyStatisticalOverlays === 'function') {
        if (config.overlays || document.getElementById('showMeanLine')?.checked ||
            document.getElementById('showMedianLine')?.checked ||
            document.getElementById('showStdBand')?.checked ||
            document.getElementById('showTrendLine')?.checked) {
            setTimeout(() => applyStatisticalOverlays(chart, config, yData), 100);
        }
    }

    // Resize handler
    const resizeHandler = () => chart.resize();
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
}

export function rerenderAllCharts() {
    VIZ_STATE.charts.forEach(config => {
        renderChart(config);
    });
}

// -----------------------------------------------------
// WINDOW BINDINGS
// -----------------------------------------------------
window.addChart = addChart;
window.createChartWidget = createChartWidget;
window.removeWidget = removeWidget;
window.selectChart = selectChart;
window.showWidgetMenu = showWidgetMenu;
window.closeWidgetMenu = closeWidgetMenu;
window.editWidget = editWidget;
window.toggleWidgetFullscreen = toggleWidgetFullscreen;
window.duplicateWidget = duplicateWidget;
window.startWidgetResize = startWidgetResize;
window.updateDropdowns = updateDropdowns;
window.exportChartAsPNG = exportChartAsPNG;
window.exportAllChartsPNG = exportAllChartsPNG;
window.exportChartAsPDF = exportChartAsPDF;
window.renderChart = renderChart;
window.rerenderAllCharts = rerenderAllCharts;

// -----------------------------------------------------
// ADVANCED CHART HELPERS
// -----------------------------------------------------

/**
 * Advanced Word Cloud Renderer
 * Daha karmaşık kelime bulutu özellikleri için
 */
export function renderWordCloudAdvanced(elementId, words, options = {}) {
    const chartDom = document.getElementById(elementId);
    if (!chartDom) return;

    const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);

    // Mask Image desteği eklenebilir

    const option = {
        series: [{
            type: 'wordCloud',
            shape: options.shape || 'circle',
            left: 'center',
            top: 'center',
            width: '95%',
            height: '95%',
            right: null,
            bottom: null,
            sizeRange: options.sizeRange || [12, 60],
            rotationRange: options.rotationRange || [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                color: function () {
                    return 'rgb(' + [
                        Math.round(Math.random() * 160),
                        Math.round(Math.random() * 160),
                        Math.round(Math.random() * 160)
                    ].join(',') + ')';
                }
            },
            emphasis: {
                focus: 'self',
                textStyle: {
                    textShadowBlur: 10,
                    textShadowColor: '#333'
                }
            },
            data: words.map(w => ({
                name: w.text || w.name,
                value: w.weight || w.value || Math.random() * 100
            }))
        }]
    };

    chart.setOption(option);
    return chart;
}

window.renderWordCloudAdvanced = renderWordCloudAdvanced;

console.log('✅ charts.js module loaded');
// -----------------------------------------------------
// ADVANCED CHART RENDERERS (MOVED FROM SOURCE)
// -----------------------------------------------------

// --- Word Cloud Helpers ---
const STOP_WORDS = {
    tr: ['ve', 'veya', 'bir', 'bu', 'şu', 'o', 'de', 'da', 'ile', 'için', 'gibi', 'kadar', 'çok', 'daha', 'en', 'mi', 'mı', 'mu', 'mü', 'ne', 'nasıl', 'neden', 'kim', 'kime', 'hangi', 'her', 'hiç', 'ben', 'sen', 'biz', 'siz', 'onlar', 'ama', 'fakat', 'ancak', 'eğer', 'ki', 'çünkü', 'olarak', 'olan', 'oldu', 'olur', 'olmuş', 'var', 'yok', 'ise', 'üzere', 'sonra', 'önce', 'dolayı', 'göre', 'karşı'],
    en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'did']
};

export function calculateWordFrequency(textColumn, options = {}) {
    if (!VIZ_STATE.data || !textColumn) return [];

    const minLength = options.minLength || 2;
    const maxWords = options.maxWords || 100;
    const removeStopWords = options.removeStopWords !== false;

    const wordCount = {};
    const stopWords = new Set([...STOP_WORDS.tr, ...STOP_WORDS.en]);

    VIZ_STATE.data.forEach(row => {
        const text = String(row[textColumn] || '');
        const words = text.toLowerCase()
            .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= minLength);

        words.forEach(word => {
            if (removeStopWords && stopWords.has(word)) return;
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
    });

    const sorted = Object.entries(wordCount)
        .map(([word, count]) => ({ name: word, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, maxWords);

    return sorted;
}

export function renderWordCloudAdvanced(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
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

    // Ensure ECharts instance exists
    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

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

// --- Chord Diagram ---
export function renderChordDiagram(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
    if (!container || !VIZ_STATE.data) return;

    const sourceCol = config.x || VIZ_STATE.columns[0];
    const targetCol = config.y || VIZ_STATE.columns[1];
    const valueCol = config.value || VIZ_STATE.columns[2];

    const links = {};
    const nodes = new Set();

    VIZ_STATE.data.forEach(row => {
        const source = String(row[sourceCol] || '');
        const target = String(row[targetCol] || '');
        const value = parseFloat(row[valueCol]) || 1;

        if (source && target) {
            nodes.add(source);
            nodes.add(target);
            const key = `${source}->${target}`;
            links[key] = (links[key] || 0) + value;
        }
    });

    const nodeArray = Array.from(nodes).map(n => ({ name: n }));
    const linkArray = Object.entries(links).map(([key, value]) => {
        const [source, target] = key.split('->');
        return { source, target, value };
    });

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

    const option = {
        title: { text: config.title || 'Chord Diagram', left: 'center' },
        tooltip: { trigger: 'item' },
        series: [{
            type: 'graph',
            layout: 'circular',
            circular: { rotateLabel: true },
            data: nodeArray.map((n, i) => ({
                ...n,
                symbolSize: 30,
                itemStyle: { color: `hsl(${i * 360 / nodeArray.length}, 70%, 50%)` }
            })),
            links: linkArray,
            emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
            lineStyle: { curveness: 0.3, opacity: 0.6 },
            label: { show: true, position: 'right' }
        }]
    };

    chart.setOption(option);
}

// --- Parallel Coordinates ---
export function renderParallelCoordinatesChart(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
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

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

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

// --- Density Plot ---
export function renderDensityPlot(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
    if (!container || !VIZ_STATE.data) return;

    const valueCol = config.x || VIZ_STATE.columns[0];
    const values = VIZ_STATE.data.map(r => parseFloat(r[valueCol])).filter(v => !isNaN(v));

    if (values.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Sayısal veri yok</p>';
        return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 50;
    const binWidth = (max - min) / binCount;
    const bins = new Array(binCount).fill(0);

    values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
        bins[binIndex]++;
    });

    const total = values.length;
    const density = bins.map(b => b / total / binWidth);
    const xData = bins.map((_, i) => (min + (i + 0.5) * binWidth).toFixed(2));

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

    const option = {
        title: { text: config.title || 'Yoğunluk Dağılımı', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: xData, name: valueCol },
        yAxis: { type: 'value', name: 'Yoğunluk' },
        series: [{
            type: 'line',
            data: density,
            smooth: true,
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2 }
        }]
    };

    chart.setOption(option);
}

// --- Range Area ---
export function renderRangeArea(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
    if (!container || !VIZ_STATE.data) return;

    const xCol = config.x || VIZ_STATE.columns[0];
    const minCol = config.min || VIZ_STATE.columns[1];
    const maxCol = config.max || VIZ_STATE.columns[2];

    const xData = VIZ_STATE.data.map(r => r[xCol]);
    const minData = VIZ_STATE.data.map(r => parseFloat(r[minCol]) || 0);
    const maxData = VIZ_STATE.data.map(r => parseFloat(r[maxCol]) || 0);

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

    const option = {
        title: { text: config.title || 'Range Area', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: xData },
        yAxis: { type: 'value' },
        series: [
            { name: 'Min', type: 'line', data: minData, areaStyle: {}, stack: 'range' },
            { name: 'Max', type: 'line', data: maxData, areaStyle: { opacity: 0.7 }, stack: 'range' }
        ]
    };

    chart.setOption(option);
}

// -----------------------------------------------------
// STATISTICAL OVERLAYS (Mean, Median, StdDev, Trend Line)
// -----------------------------------------------------
export function applyStatisticalOverlays(chart, config, yData) {
    if (!chart || !yData || yData.length === 0) return;

    const currentOption = chart.getOption();
    const newSeries = [...(currentOption.series || [])];
    const markLines = [];
    const markAreas = [];

    // Calculate statistics
    const n = yData.length;
    const sum = yData.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sortedData = [...yData].sort((a, b) => a - b);
    const median = n % 2 === 0
        ? (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2
        : sortedData[Math.floor(n / 2)];
    const variance = yData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Mean Line
    const showMean = document.getElementById('showMeanLine')?.checked || config.overlays?.mean;
    if (showMean) {
        markLines.push({
            name: 'Ortalama',
            yAxis: mean,
            label: { formatter: `Ort: ${mean.toFixed(2)}`, position: 'end' },
            lineStyle: { color: '#e74c3c', type: 'solid', width: 2 }
        });
    }

    // Median Line
    const showMedian = document.getElementById('showMedianLine')?.checked || config.overlays?.median;
    if (showMedian) {
        markLines.push({
            name: 'Medyan',
            yAxis: median,
            label: { formatter: `Med: ${median.toFixed(2)}`, position: 'end' },
            lineStyle: { color: '#27ae60', type: 'dashed', width: 2 }
        });
    }

    // Standard Deviation Band
    const showStd = document.getElementById('showStdBand')?.checked || config.overlays?.std;
    if (showStd) {
        markAreas.push([
            { yAxis: mean - stdDev, itemStyle: { color: 'rgba(74, 144, 217, 0.15)' } },
            { yAxis: mean + stdDev }
        ]);
        markLines.push({
            name: '+1σ',
            yAxis: mean + stdDev,
            label: { formatter: `+1σ: ${(mean + stdDev).toFixed(2)}`, position: 'start' },
            lineStyle: { color: '#9b59b6', type: 'dotted', width: 1 }
        });
        markLines.push({
            name: '-1σ',
            yAxis: mean - stdDev,
            label: { formatter: `-1σ: ${(mean - stdDev).toFixed(2)}`, position: 'start' },
            lineStyle: { color: '#9b59b6', type: 'dotted', width: 1 }
        });
    }

    // Trend Line (Linear Regression)
    const showTrend = document.getElementById('showTrendLine')?.checked || config.overlays?.trend;
    if (showTrend && yData.length >= 2) {
        // Linear regression: y = mx + b
        const xSum = yData.reduce((a, _, i) => a + i, 0);
        const ySum = sum;
        const xySum = yData.reduce((a, y, i) => a + i * y, 0);
        const x2Sum = yData.reduce((a, _, i) => a + i * i, 0);

        const m = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
        const b = (ySum - m * xSum) / n;

        // Create trend line data
        const trendData = yData.map((_, i) => m * i + b);

        // Add trend line as separate series
        newSeries.push({
            name: 'Trend',
            type: 'line',
            data: trendData,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#f39c12', type: 'dashed', width: 2 },
            itemStyle: { color: '#f39c12' },
            z: 10
        });
    }

    // Apply mark lines and areas to first series
    if (newSeries.length > 0 && (markLines.length > 0 || markAreas.length > 0)) {
        if (!newSeries[0].markLine) newSeries[0].markLine = { data: [] };
        if (!newSeries[0].markArea) newSeries[0].markArea = { data: [] };

        newSeries[0].markLine.data = [...(newSeries[0].markLine.data || []), ...markLines];
        newSeries[0].markArea.data = [...(newSeries[0].markArea.data || []), ...markAreas];
    }

    chart.setOption({ series: newSeries }, { replaceMerge: ['series'] });
}

// -----------------------------------------------------
// GANTT CHART
// -----------------------------------------------------
export function renderGanttChart(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
    if (!container || !VIZ_STATE.data) return;

    const taskCol = config.x || VIZ_STATE.columns[0];
    const startCol = config.start || VIZ_STATE.columns[1];
    const endCol = config.end || VIZ_STATE.columns[2];

    // Parse dates and create Gantt data
    const ganttData = [];
    const categories = [];

    VIZ_STATE.data.forEach((row, idx) => {
        const taskName = String(row[taskCol] || `Görev ${idx + 1}`);
        const startDate = new Date(row[startCol]);
        const endDate = new Date(row[endCol]);

        if (!isNaN(startDate) && !isNaN(endDate)) {
            categories.push(taskName);
            ganttData.push({
                name: taskName,
                value: [
                    idx,
                    startDate.getTime(),
                    endDate.getTime(),
                    endDate.getTime() - startDate.getTime()
                ],
                itemStyle: {
                    color: `hsl(${idx * 40 % 360}, 65%, 50%)`
                }
            });
        }
    });

    if (ganttData.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#e74c3c;">Gantt için geçerli tarih verisi bulunamadı</p>';
        return;
    }

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

    const option = {
        title: { text: config.title || 'Gantt Chart', left: 'center' },
        tooltip: {
            formatter: (params) => {
                const start = new Date(params.value[1]).toLocaleDateString('tr-TR');
                const end = new Date(params.value[2]).toLocaleDateString('tr-TR');
                const days = Math.ceil(params.value[3] / (1000 * 60 * 60 * 24));
                return `${params.name}<br/>Başlangıç: ${start}<br/>Bitiş: ${end}<br/>Süre: ${days} gün`;
            }
        },
        grid: { left: '15%', right: '5%', top: '15%', bottom: '10%' },
        xAxis: {
            type: 'time',
            axisLabel: { formatter: '{yyyy}-{MM}-{dd}' }
        },
        yAxis: {
            type: 'category',
            data: categories,
            inverse: true
        },
        series: [{
            type: 'custom',
            renderItem: (params, api) => {
                const categoryIndex = api.value(0);
                const start = api.coord([api.value(1), categoryIndex]);
                const end = api.coord([api.value(2), categoryIndex]);
                const height = api.size([0, 1])[1] * 0.6;

                return {
                    type: 'rect',
                    shape: {
                        x: start[0],
                        y: start[1] - height / 2,
                        width: end[0] - start[0],
                        height: height
                    },
                    style: api.style()
                };
            },
            encode: { x: [1, 2], y: 0 },
            data: ganttData
        }]
    };

    chart.setOption(option);
}

// -----------------------------------------------------
// WATERFALL CHART
// -----------------------------------------------------
export function renderWaterfallChart(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
    if (!container) return;

    const xCol = config.xAxis || config.x || VIZ_STATE.columns[0];
    const yCol = config.yAxis || config.y || VIZ_STATE.columns[1];

    // Get aggregated data or use existing
    let xData, yData;
    if (VIZ_STATE.data && xCol && yCol) {
        const aggregated = aggregateData(VIZ_STATE.data, xCol, yCol, config.aggregation || 'sum', config.dataLimit || 20);
        xData = aggregated.categories;
        yData = aggregated.values;
    } else {
        xData = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs'];
        yData = [100, 50, -30, 80, -20];
    }

    // Calculate waterfall values
    const baseData = [];  // Invisible base
    const positiveData = [];
    const negativeData = [];
    let cumulative = 0;

    yData.forEach((val, idx) => {
        if (val >= 0) {
            baseData.push(cumulative);
            positiveData.push(val);
            negativeData.push('-');
        } else {
            baseData.push(cumulative + val);
            positiveData.push('-');
            negativeData.push(Math.abs(val));
        }
        cumulative += val;
    });

    // Add total
    xData.push('Toplam');
    baseData.push(0);
    positiveData.push(cumulative >= 0 ? cumulative : '-');
    negativeData.push(cumulative < 0 ? Math.abs(cumulative) : '-');

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

    const option = {
        title: { text: config.title || 'Waterfall Chart', left: 'center' },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const total = params.reduce((sum, p) => sum + (typeof p.value === 'number' ? p.value : 0), 0);
                return `${params[0].name}: ${total.toFixed(2)}`;
            }
        },
        legend: { top: 30, data: ['Artış', 'Azalış'] },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '20%' },
        xAxis: {
            type: 'category',
            data: xData,
            axisLabel: { rotate: 45 }
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Base',
                type: 'bar',
                stack: 'total',
                silent: true,
                itemStyle: { color: 'transparent' },
                data: baseData
            },
            {
                name: 'Artış',
                type: 'bar',
                stack: 'total',
                label: { show: true, position: 'top', formatter: (p) => p.value !== '-' ? p.value.toFixed(0) : '' },
                itemStyle: { color: '#27ae60' },
                data: positiveData
            },
            {
                name: 'Azalış',
                type: 'bar',
                stack: 'total',
                label: { show: true, position: 'bottom', formatter: (p) => p.value !== '-' ? `-${p.value}` : '' },
                itemStyle: { color: '#e74c3c' },
                data: negativeData
            }
        ]
    };

    chart.setOption(option);
}

// -----------------------------------------------------
// WATERMARK (FILIGRAN)
// -----------------------------------------------------
export function showWatermarkModal() {
    const modalHtml = `
        <div class="viz-modal-overlay" id="watermarkModal">
            <div class="viz-modal" style="width:400px;">
                <div class="viz-modal-header">
                    <h3>Filigran Ekle</h3>
                    <button class="viz-modal-close" onclick="document.getElementById('watermarkModal').remove()">×</button>
                </div>
                <div class="viz-modal-body">
                    <div class="viz-form-group">
                        <label>Filigran Metni</label>
                        <input type="text" id="watermarkText" value="TASLAK" placeholder="Filigran metni...">
                    </div>
                    <div class="viz-form-group">
                        <label>Yazı Boyutu</label>
                        <input type="range" id="watermarkFontSize" min="20" max="100" value="48">
                        <span id="watermarkFontSizeValue">48px</span>
                    </div>
                    <div class="viz-form-group">
                        <label>Opaklık</label>
                        <input type="range" id="watermarkOpacity" min="5" max="50" value="15">
                        <span id="watermarkOpacityValue">15%</span>
                    </div>
                    <div class="viz-form-group">
                        <label>Renk</label>
                        <input type="color" id="watermarkColor" value="#888888">
                    </div>
                    <div class="viz-form-group">
                        <label>Açı (Derece)</label>
                        <input type="range" id="watermarkAngle" min="-90" max="90" value="-30">
                        <span id="watermarkAngleValue">-30°</span>
                    </div>
                </div>
                <div class="viz-modal-footer">
                    <button class="viz-btn viz-btn-secondary" onclick="document.getElementById('watermarkModal').remove()">İptal</button>
                    <button class="viz-btn viz-btn-primary" onclick="applyWatermark()">Uygula</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Update value displays
    document.getElementById('watermarkFontSize').oninput = (e) => {
        document.getElementById('watermarkFontSizeValue').textContent = e.target.value + 'px';
    };
    document.getElementById('watermarkOpacity').oninput = (e) => {
        document.getElementById('watermarkOpacityValue').textContent = e.target.value + '%';
    };
    document.getElementById('watermarkAngle').oninput = (e) => {
        document.getElementById('watermarkAngleValue').textContent = e.target.value + '°';
    };
}

export function applyWatermark() {
    const text = document.getElementById('watermarkText')?.value || 'TASLAK';
    const fontSize = parseInt(document.getElementById('watermarkFontSize')?.value || 48);
    const opacity = parseInt(document.getElementById('watermarkOpacity')?.value || 15) / 100;
    const color = document.getElementById('watermarkColor')?.value || '#888888';
    const angle = parseInt(document.getElementById('watermarkAngle')?.value || -30);

    // Apply to selected chart or all charts
    const chartId = VIZ_STATE.selectedChart;
    const charts = chartId ? [chartId] : VIZ_STATE.charts.map(c => c.id);

    charts.forEach(id => {
        const chart = VIZ_STATE.echartsInstances[id];
        if (chart) {
            const currentOption = chart.getOption();
            chart.setOption({
                graphic: [{
                    type: 'text',
                    z: 100,
                    left: 'center',
                    top: 'middle',
                    rotation: angle * Math.PI / 180,
                    style: {
                        text: text,
                        fontSize: fontSize,
                        fill: color,
                        opacity: opacity,
                        fontWeight: 'bold'
                    }
                }]
            });
        }
    });

    document.getElementById('watermarkModal')?.remove();
    if (typeof showToast === 'function') showToast('Filigran eklendi', 'success');
}

// -----------------------------------------------------
// ERROR BAR CHART
// -----------------------------------------------------
export function renderErrorBar(config = {}) {
    const container = config.container || document.getElementById(`${config.id}_chart`);
    if (!container) return;

    const xCol = config.xAxis || config.x || VIZ_STATE.columns[0];
    const yCol = config.yAxis || config.y || VIZ_STATE.columns[1];
    const errCol = config.error || VIZ_STATE.columns[2]; // Error column (optional)

    let xData, yData, errorData;

    if (VIZ_STATE.data && xCol && yCol) {
        const aggregated = aggregateData(VIZ_STATE.data, xCol, yCol, config.aggregation || 'mean', config.dataLimit || 20);
        xData = aggregated.categories;
        yData = aggregated.values;

        // Calculate error (standard error or use provided column)
        if (errCol && VIZ_STATE.data[0]?.[errCol] !== undefined) {
            // Use provided error column
            const errAgg = aggregateData(VIZ_STATE.data, xCol, errCol, 'mean', config.dataLimit || 20);
            errorData = errAgg.values;
        } else {
            // Calculate standard error from data
            errorData = xData.map((cat, idx) => {
                const values = VIZ_STATE.data
                    .filter(row => String(row[xCol]) === String(cat))
                    .map(row => parseFloat(row[yCol]))
                    .filter(v => !isNaN(v));

                if (values.length < 2) return yData[idx] * 0.1; // 10% default

                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
                const stdErr = Math.sqrt(variance / values.length);
                return stdErr;
            });
        }
    } else {
        xData = ['A', 'B', 'C', 'D', 'E'];
        yData = [50, 80, 60, 90, 70];
        errorData = [5, 8, 6, 10, 7];
    }

    // Create error bar data
    const errorBarData = yData.map((val, idx) => {
        const err = errorData[idx] || val * 0.1;
        return [idx, val - err, val + err];
    });

    let chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) {
        chart = echarts.init(container);
        VIZ_STATE.echartsInstances[config.id] = chart;
    }

    const option = {
        title: { text: config.title || 'Error Bar Chart', left: 'center' },
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const bar = params.find(p => p.seriesName === 'Değer');
                const err = params.find(p => p.seriesName === 'Hata');
                if (bar && err) {
                    return `${xData[bar.dataIndex]}<br/>Değer: ${bar.value.toFixed(2)}<br/>Aralık: ${err.value[1].toFixed(2)} - ${err.value[2].toFixed(2)}`;
                }
                return '';
            }
        },
        legend: { top: 30, data: ['Değer', 'Hata'] },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '20%' },
        xAxis: {
            type: 'category',
            data: xData,
            axisLabel: { rotate: 45 }
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: 'Değer',
                type: 'bar',
                data: yData,
                itemStyle: { color: config.color || '#4a90d9' },
                barWidth: '50%'
            },
            {
                name: 'Hata',
                type: 'custom',
                renderItem: (params, api) => {
                    const xValue = api.value(0);
                    const lowPoint = api.coord([xValue, api.value(1)]);
                    const highPoint = api.coord([xValue, api.value(2)]);
                    const halfWidth = 8;

                    return {
                        type: 'group',
                        children: [
                            // Vertical line
                            {
                                type: 'line',
                                shape: { x1: lowPoint[0], y1: lowPoint[1], x2: highPoint[0], y2: highPoint[1] },
                                style: { stroke: '#333', lineWidth: 2 }
                            },
                            // Top cap
                            {
                                type: 'line',
                                shape: { x1: highPoint[0] - halfWidth, y1: highPoint[1], x2: highPoint[0] + halfWidth, y2: highPoint[1] },
                                style: { stroke: '#333', lineWidth: 2 }
                            },
                            // Bottom cap
                            {
                                type: 'line',
                                shape: { x1: lowPoint[0] - halfWidth, y1: lowPoint[1], x2: lowPoint[0] + halfWidth, y2: lowPoint[1] },
                                style: { stroke: '#333', lineWidth: 2 }
                            }
                        ]
                    };
                },
                data: errorBarData,
                z: 10
            }
        ]
    };

    chart.setOption(option);
}

// -----------------------------------------------------
// GLOBAL EXPORTS
// -----------------------------------------------------
window.addChart = addChart;
window.renderChart = renderChart;
window.createChartWidget = createChartWidget;
window.removeWidget = removeWidget;
window.selectChart = selectChart;
window.showWidgetMenu = showWidgetMenu;
window.closeWidgetMenu = closeWidgetMenu;
window.editWidget = editWidget;
window.toggleWidgetFullscreen = toggleWidgetFullscreen;
window.duplicateWidget = duplicateWidget;
window.startWidgetResize = startWidgetResize;
window.updateDropdowns = updateDropdowns;
window.exportChartAsPNG = exportChartAsPNG;
window.exportAllChartsPNG = exportAllChartsPNG;
window.exportChartAsPDF = exportChartAsPDF;
window.renderWordCloudAdvanced = renderWordCloudAdvanced;
window.renderChordDiagram = renderChordDiagram;
window.renderParallelCoordinatesChart = renderParallelCoordinatesChart;
window.renderDensityPlot = renderDensityPlot;
window.renderRangeArea = renderRangeArea;
window.calculateWordFrequency = calculateWordFrequency;
// New critical functions
window.applyStatisticalOverlays = applyStatisticalOverlays;
window.renderGanttChart = renderGanttChart;
window.renderWaterfallChart = renderWaterfallChart;
window.showWatermarkModal = showWatermarkModal;
window.applyWatermark = applyWatermark;
window.renderErrorBar = renderErrorBar;
window.downloadFile = downloadFile;
window.rerenderAllCharts = rerenderAllCharts;
window.exportChartAsSVG = exportChartAsSVG;

