import { formatNumber, truncateAxisLabel, truncate, getChartColor, isNumeric } from '../core/utils.js';
import { getText } from '../core/i18n.js';
import { VIZ_STATE } from '../core/state.js';

// Global exports (for potential inline usage compatibility if needed, though we prefer modules)
// But wait, renderChart uses 'echarts' global. That's fine.

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

    // ResizeObserver ile otomatik boyutlandÄ±rma
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

            // Observer'Ä± temizleme iÃ§in sakla
            if (!VIZ_STATE.resizeObservers) VIZ_STATE.resizeObservers = {};
            VIZ_STATE.resizeObservers[config.id] = resizeObserver;
        }
    }
}
/**
 * Widget boyutlandÄ±rma baÅŸlat - canlÄ± ECharts gÃ¼ncellemesi
 */
function startWidgetResize(event, chartId) {
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
    const headerHeight = 45; // Widget header yÃ¼ksekliÄŸi

    let resizeThrottle = null;

    function doResize(e) {
        const newWidth = Math.max(200, startWidth + e.clientX - startX);
        const newHeight = Math.max(150, startHeight + e.clientY - startY);

        widget.style.width = `${newWidth}px`;
        widget.style.height = `${newHeight}px`;

        // Chart container'a aÃ§Ä±k boyut ver
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
function renderChart(config) {
    const chartDom = document.getElementById(`${config.id}_chart`);
    if (!chartDom) return;

    // Eski instance'Ä± temizle
    if (VIZ_STATE.echartsInstances[config.id]) {
        VIZ_STATE.echartsInstances[config.id].dispose();
    }

    const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
    const chart = echarts.init(chartDom, theme);
    VIZ_STATE.echartsInstances[config.id] = chart;

    // Multi-Dataset DesteÄŸi: Widget kendi dataset'ini kullanÄ±r
    const dataset = config.datasetId
        ? VIZ_STATE.getDatasetById(config.datasetId)
        : VIZ_STATE.getActiveDataset();
    const chartData = dataset?.data || VIZ_STATE.data || [];

    // Veri aggregation
    let xData, yData;

    if (chartData && chartData.length > 0 && config.xAxis && config.yAxis) {
        // Cross-filter uygula
        let filteredData = chartData;
        if (VIZ_STATE.crossFilterEnabled && VIZ_STATE.crossFilterValue) {
            filteredData = chartData.filter(row =>
                Object.values(row).some(v => String(v) === VIZ_STATE.crossFilterValue)
            );
        }

        const aggregated = aggregateData(filteredData, config.xAxis, config.yAxis, config.aggregation, config.dataLimit || 20);
        xData = aggregated.categories;
        yData = aggregated.values;

        // What-If Simulator - Ã§arpan SADECE SEÃ‡Ä°LÄ° GRAFÄ°ÄE uygula
        if (VIZ_STATE.whatIfMultiplier && VIZ_STATE.whatIfMultiplier !== 1 && config.id === VIZ_STATE.selectedChart) {
            yData = yData.map(v => v * VIZ_STATE.whatIfMultiplier);
        }
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
                            // 8 karakter + ... ile kÄ±salt
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
                grid: { bottom: 120, left: 80, right: 20 },
                series: [{ data: yData, type: 'bar', itemStyle: { color: config.color } }]
            };
            break;

        case 'line':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis' },
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
                yAxis: {
                    type: 'value',
                    name: config.yAxis || '',
                    nameLocation: 'middle',
                    nameGap: 50
                },
                grid: { bottom: 100, left: 80 },
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
        // Ä°LERÄ° GRAFÄ°KLER (Faz 3)
        // =====================================================

        case 'dual-axis':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                legend: { top: 30, data: ['SÃ¼tun', 'Ã‡izgi'] },
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
                            return String(value).length > 8 ? String(value).slice(0, 6) + '..' : value;
                        }
                    }
                },
                yAxis: [
                    { type: 'value', name: config.yAxis || 'Sol Eksen', position: 'left', nameLocation: 'middle', nameGap: 50 },
                    { type: 'value', name: 'SaÄŸ Eksen', position: 'right' }
                ],
                grid: { bottom: 120, left: 80, top: 60 },
                series: [
                    { name: 'SÃ¼tun', type: 'bar', data: yData, itemStyle: { color: config.color } },
                    { name: 'Ã‡izgi', type: 'line', yAxisIndex: 1, data: yData.map(v => v * 0.8), smooth: true, itemStyle: { color: '#ffc107' } }
                ]
            };
            break;

        case 'stacked-bar':
            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { top: 30, data: ['Kategori A', 'Kategori B', 'Kategori C'] },
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
                grid: { bottom: 120, left: 80, top: 60 },
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
            // Korelasyon matrisi iÃ§in Ã¶rnek veri
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
                xAxis: {
                    type: 'category',
                    data: categories.map(c => String(c).length > 8 ? String(c).slice(0, 6) + '..' : c),
                    name: config.xAxis || '',
                    nameLocation: 'center',
                    nameGap: 35,
                    splitArea: { show: true },
                    axisLabel: { fontSize: 10, rotate: 45 }
                },
                yAxis: {
                    type: 'category',
                    data: categories.map(c => String(c).length > 8 ? String(c).slice(0, 6) + '..' : c),
                    name: config.yAxis || '',
                    nameLocation: 'middle',
                    nameGap: 50,
                    splitArea: { show: true },
                    axisLabel: { fontSize: 10 }
                },
                grid: { bottom: 80, left: 80 },
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
                grid: { bottom: 120, left: 80 },
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
            // Box plot iÃ§in istatistiksel hesaplama
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
                xAxis: { type: 'category', data: [config.yAxis || 'DeÄŸer'] },
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
            // Verileri bÃ¼yÃ¼kten kÃ¼Ã§Ã¼ÄŸe sÄ±rala
            const paretoSorted = yData.map((v, i) => ({ label: xData[i] || `Item ${i + 1}`, value: v }))
                .sort((a, b) => b.value - a.value);

            const paretoLabels = paretoSorted.map(d => d.label);
            const paretoValues = paretoSorted.map(d => d.value);
            const paretoTotal = paretoValues.reduce((a, b) => a + b, 0);

            // KÃ¼mÃ¼latif yÃ¼zde hesapla
            let paretoCumulative = 0;
            const cumulativePercent = paretoValues.map(v => {
                paretoCumulative += v;
                return ((paretoCumulative / paretoTotal) * 100).toFixed(1);
            });

            option = {
                title: { text: config.title || 'Pareto Analizi (80/20)', left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['DeÄŸer', 'KÃ¼mÃ¼latif %'], bottom: 0 },
                xAxis: { type: 'category', data: paretoLabels, axisLabel: { rotate: 45 } },
                yAxis: [
                    { type: 'value', name: 'DeÄŸer', position: 'left' },
                    { type: 'value', name: 'KÃ¼mÃ¼latif %', max: 100, position: 'right', axisLabel: { formatter: '{value}%' } }
                ],
                series: [
                    {
                        name: 'DeÄŸer',
                        type: 'bar',
                        data: paretoValues,
                        itemStyle: { color: config.color || '#3498db' }
                    },
                    {
                        name: 'KÃ¼mÃ¼latif %',
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
        // 3D GRAFÄ°KLER (Faz 4) - echarts-gl
        // =====================================================

        case 'scatter3d':
            // 3D Scatter iÃ§in Ã¶rnek veri oluÅŸtur
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
            // 3D Bar iÃ§in grid veri oluÅŸtur
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
                zAxis3D: { type: 'value', name: 'DeÄŸer' },
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
            // 3D Surface iÃ§in matematiksel yÃ¼zey oluÅŸtur
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
            // 3D Line iÃ§in spiral veri
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

        // =====================================================
        // YENÄ° GRAFÄ°K TÄ°PLERÄ° (Sprint 3 - Faz 2)
        // =====================================================

        case 'histogram':
            // Histogram - frekans daÄŸÄ±lÄ±mÄ±
            const binCount = 10;
            const histMin = Math.min(...yData);
            const histMax = Math.max(...yData);
            const binWidth = (histMax - histMin) / binCount;
            const bins = new Array(binCount).fill(0);
            const binLabels = [];

            for (let i = 0; i < binCount; i++) {
                binLabels.push(`${(histMin + i * binWidth).toFixed(1)}`);
            }

            yData.forEach(v => {
                const binIndex = Math.min(Math.floor((v - histMin) / binWidth), binCount - 1);
                if (binIndex >= 0) bins[binIndex]++;
            });

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { type: 'category', data: binLabels, name: 'AralÄ±k' },
                yAxis: { type: 'value', name: 'Frekans' },
                series: [{
                    type: 'bar',
                    data: bins,
                    barWidth: '90%',
                    itemStyle: { color: config.color }
                }]
            };
            break;

        case 'bubble':
            // Bubble Chart - 3 boyutlu daÄŸÄ±lÄ±m (x, y, size)
            const bubbleData = yData.map((v, i) => [
                i,
                v,
                Math.abs(v) / Math.max(...yData.map(Math.abs)) * 50 + 10
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



        case 'sunburst':
            // Sunburst - hiyerarÅŸik halka
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
            // Sankey - akÄ±ÅŸ diyagramÄ±
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

        case 'step':
        case 'step-line':
            // Step Line - basamaklÄ± Ã§izgi
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
            // Lollipop Chart - noktalÄ± Ã§ubuk
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
            // Bullet Chart - KPI hedef vs gerÃ§ek
            const bulletActual = yData.reduce((a, b) => a + b, 0) / yData.length;
            const bulletTarget = bulletActual * 1.2;

            option = {
                title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                tooltip: { formatter: `GerÃ§ek: ${bulletActual.toFixed(0)}<br>Hedef: ${bulletTarget.toFixed(0)}` },
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

        case 'calendar':
            // Calendar Heatmap - yÄ±llÄ±k takvim gÃ¶rÃ¼nÃ¼mÃ¼
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

        default:
            option = {
                title: { text: config.title, left: 'center' },
                series: []
            };
    }

    chart.setOption(option);

    // Cross-filter: grafik Ã¶ÄŸesine tÄ±klandÄ±ÄŸÄ±nda diÄŸer grafikleri filtrele
    chart.off('click'); // Ã–nceki listener'larÄ± temizle
    chart.on('click', (params) => {
        if (!VIZ_STATE.crossFilterEnabled) return;

        const clickedValue = params.name || params.data?.name || params.value;
        if (!clickedValue) return;

        console.log('ğŸ”— Cross-filter tÄ±klama:', clickedValue);

        // AynÄ± deÄŸere tekrar tÄ±klandÄ±ysa filtreyi kaldÄ±r
        if (VIZ_STATE.crossFilterValue === clickedValue) {
            VIZ_STATE.crossFilterValue = null;
            showToast('Cross-filter kaldÄ±rÄ±ldÄ±', 'info');
        } else {
            VIZ_STATE.crossFilterValue = String(clickedValue);
            showToast(`Filtre: "${clickedValue}"`, 'info');
        }

        // TÃ¼m grafikleri yeniden render et
        rerenderAllCharts();
    });

    // Ä°statistik overlay'larÄ± uygula (Faz 2)
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
/**
 * TÃ¼m grafikleri yeniden render et (cross-filter iÃ§in)
 */
function rerenderAllCharts() {
    VIZ_STATE.charts.forEach(config => {
        renderChart(config);
    });
}

export { createChartWidget, startWidgetResize, renderChart, rerenderAllCharts };
