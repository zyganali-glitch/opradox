/**
 * viz-charts-advanced.js
 * Advanced Chart Types - FULLY RESTORED
 * Candlestick, Violin, Gantt, Grouped Bar, Percent Stacked, Dot Plot, Error Bar
 * Sparkline, Word Cloud, Chord, Parallel Coordinates, Density, Range Area, Timeline
 */

(function () {
    'use strict';

    // =====================================================
    // CANDLESTICK CHART (OHLC)
    // =====================================================

    function renderCandlestick(containerId, ohlcData) {
        // ohlcData: [{date, open, high, low, close}, ...]
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        if (typeof echarts === 'undefined') {
            console.error('ECharts not loaded');
            return null;
        }

        const chart = echarts.init(chartDom);
        const dates = ohlcData.map(d => d.date);
        const values = ohlcData.map(d => [d.open, d.close, d.low, d.high]);

        chart.setOption({
            title: { text: 'Mum Grafiği (OHLC)', left: 'center' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
            xAxis: { type: 'category', data: dates },
            yAxis: { type: 'value', scale: true },
            series: [{
                type: 'candlestick',
                data: values,
                itemStyle: {
                    color: '#27ae60',
                    color0: '#e74c3c',
                    borderColor: '#27ae60',
                    borderColor0: '#e74c3c'
                }
            }]
        });

        return chart;
    }

    // From VIZ_STATE data
    function renderCandlestickFromData(containerId, config = {}) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const dateCol = config.date || state.columns[0];
        const openCol = config.open || state.columns[1];
        const highCol = config.high || state.columns[2];
        const lowCol = config.low || state.columns[3];
        const closeCol = config.close || state.columns[4];

        const ohlcData = state.data.map(row => ({
            date: row[dateCol],
            open: parseFloat(row[openCol]) || 0,
            high: parseFloat(row[highCol]) || 0,
            low: parseFloat(row[lowCol]) || 0,
            close: parseFloat(row[closeCol]) || 0
        }));

        return renderCandlestick(containerId, ohlcData);
    }

    // =====================================================
    // VIOLIN PLOT
    // =====================================================

    function renderViolinPlot(containerId, data, column) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom || !data) return null;

        if (typeof echarts === 'undefined') return null;

        const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;

        if (n === 0) return null;

        // Kernel density estimation (simplified)
        const min = sorted[0];
        const max = sorted[n - 1];
        const bandwidth = (max - min) / 20;
        const densityPoints = [];

        for (let x = min; x <= max; x += bandwidth) {
            let density = 0;
            values.forEach(v => {
                density += Math.exp(-Math.pow(x - v, 2) / (2 * bandwidth * bandwidth));
            });
            densityPoints.push([density / values.length, x]);
        }

        const chart = echarts.init(chartDom);
        chart.setOption({
            title: { text: 'Violin Plot', left: 'center' },
            xAxis: { type: 'value' },
            yAxis: { type: 'value' },
            series: [{
                type: 'line',
                data: densityPoints,
                smooth: true,
                areaStyle: { color: 'rgba(74, 144, 217, 0.3)' },
                lineStyle: { color: '#4a90d9' }
            }]
        });

        return chart;
    }

    function renderViolinPlotFromState(containerId, config = {}) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const column = config.column || config.yAxis || state.columns[0];
        return renderViolinPlot(containerId, state.data, column);
    }

    // =====================================================
    // GANTT CHART
    // =====================================================

    function renderGanttChart(containerId, tasks) {
        // tasks: [{name, start, end, progress}, ...]
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        if (typeof echarts === 'undefined') return null;

        const chart = echarts.init(chartDom);

        chart.setOption({
            title: { text: 'Gantt Şeması', left: 'center' },
            tooltip: { formatter: p => `${p.name}: ${p.value[1]} - ${p.value[2]}` },
            xAxis: { type: 'time' },
            yAxis: { type: 'category', data: tasks.map(t => t.name) },
            series: [{
                type: 'custom',
                renderItem: (params, api) => {
                    const start = api.coord([api.value(1), api.value(0)]);
                    const end = api.coord([api.value(2), api.value(0)]);
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
                data: tasks.map((t, i) => ({
                    value: [i, t.start, t.end],
                    itemStyle: { color: `hsl(${i * 360 / tasks.length}, 65%, 50%)` }
                }))
            }]
        });

        return chart;
    }

    function renderGanttFromData(containerId, config = {}) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const nameCol = config.name || state.columns[0];
        const startCol = config.start || state.columns[1];
        const endCol = config.end || state.columns[2];

        const tasks = state.data.map(row => ({
            name: row[nameCol],
            start: row[startCol],
            end: row[endCol]
        }));

        return renderGanttChart(containerId, tasks);
    }

    // =====================================================
    // GROUPED BAR CHART
    // =====================================================

    function renderGroupedBar(containerId, config) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const chart = echarts.init(chartDom);
        const categories = [...new Set(state.data.map(row => row[config.xAxis]))];
        const groups = [...new Set(state.data.map(row => row[config.groupBy]))];

        const series = groups.map(group => ({
            name: group,
            type: 'bar',
            data: categories.map(cat => {
                const rows = state.data.filter(row => row[config.xAxis] === cat && row[config.groupBy] === group);
                return rows.reduce((sum, r) => sum + (parseFloat(r[config.yAxis]) || 0), 0);
            })
        }));

        chart.setOption({
            title: { text: config.title || 'Gruplu Bar', left: 'center' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { bottom: 10 },
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'value' },
            series: series
        });

        return chart;
    }

    // =====================================================
    // PERCENT STACKED BAR (100% STACKED)
    // =====================================================

    function renderPercentStackedBar(containerId, config) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const chart = echarts.init(chartDom);
        const categories = [...new Set(state.data.map(row => row[config.xAxis]))];
        const groups = [...new Set(state.data.map(row => row[config.groupBy]))];

        // Her kategori için toplam hesapla
        const totals = {};
        categories.forEach(cat => {
            totals[cat] = state.data
                .filter(row => row[config.xAxis] === cat)
                .reduce((sum, r) => sum + (parseFloat(r[config.yAxis]) || 0), 0);
        });

        const series = groups.map(group => ({
            name: group,
            type: 'bar',
            stack: 'total',
            data: categories.map(cat => {
                const rows = state.data.filter(row => row[config.xAxis] === cat && row[config.groupBy] === group);
                const value = rows.reduce((sum, r) => sum + (parseFloat(r[config.yAxis]) || 0), 0);
                return totals[cat] ? ((value / totals[cat]) * 100).toFixed(1) : 0;
            }),
            label: { show: true, formatter: '{c}%' }
        }));

        chart.setOption({
            title: { text: config.title || '%100 Yığın Bar', left: 'center' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => p.map(s => `${s.seriesName}: ${s.value}%`).join('<br>') },
            legend: { bottom: 10 },
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
            series: series
        });

        return chart;
    }

    // =====================================================
    // DOT PLOT
    // =====================================================

    function renderDotPlot(containerId, xData, yData, config = {}) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        if (typeof echarts === 'undefined') return null;

        const chart = echarts.init(chartDom);

        chart.setOption({
            title: { text: config.title || 'Dot Plot', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: xData },
            yAxis: { type: 'value' },
            series: [{
                type: 'scatter',
                data: yData,
                symbolSize: 15,
                itemStyle: { color: config.color || '#4a90d9' }
            }]
        });

        return chart;
    }

    function renderDotPlotFromState(containerId, config = {}) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const xCol = config.xAxis || state.columns[0];
        const yCol = config.yAxis || state.columns[1];

        const xData = state.data.map(row => row[xCol]);
        const yData = state.data.map(row => parseFloat(row[yCol]) || 0);

        return renderDotPlot(containerId, xData, yData, config);
    }

    // =====================================================
    // ERROR BAR CHART
    // =====================================================

    function renderErrorBar(containerId, data, config = {}) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        if (typeof echarts === 'undefined') return null;

        const chart = echarts.init(chartDom);
        const categories = data.map(d => d.label);
        const values = data.map(d => d.value);
        const errors = data.map(d => [d.value - d.error, d.value + d.error]);

        chart.setOption({
            title: { text: config.title || 'Hata Çubuklu Grafik', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'value' },
            series: [
                { type: 'bar', data: values, itemStyle: { color: config.color || '#4a90d9' } },
                {
                    type: 'custom',
                    renderItem: (params, api) => {
                        const xValue = api.coord([api.value(0), 0]);
                        const lowPoint = api.coord([api.value(0), api.value(1)]);
                        const highPoint = api.coord([api.value(0), api.value(2)]);
                        const halfWidth = 5;

                        return {
                            type: 'group',
                            children: [
                                { type: 'line', shape: { x1: xValue[0], y1: highPoint[1], x2: xValue[0], y2: lowPoint[1] }, style: { stroke: '#333', lineWidth: 2 } },
                                { type: 'line', shape: { x1: xValue[0] - halfWidth, y1: highPoint[1], x2: xValue[0] + halfWidth, y2: highPoint[1] }, style: { stroke: '#333', lineWidth: 2 } },
                                { type: 'line', shape: { x1: xValue[0] - halfWidth, y1: lowPoint[1], x2: xValue[0] + halfWidth, y2: lowPoint[1] }, style: { stroke: '#333', lineWidth: 2 } }
                            ]
                        };
                    },
                    encode: { x: 0, y: [1, 2] },
                    data: errors.map((e, i) => [i, e[0], e[1]]),
                    z: 10
                }
            ]
        });

        return chart;
    }

    // =====================================================
    // SPARKLINE (Mini Inline Chart)
    // =====================================================

    function renderSparkline(containerId, values, type = 'line') {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        if (typeof echarts === 'undefined') return null;

        const chart = echarts.init(chartDom);

        chart.setOption({
            grid: { top: 5, bottom: 5, left: 5, right: 5 },
            xAxis: { type: 'category', show: false, data: values.map((_, i) => i) },
            yAxis: { type: 'value', show: false },
            series: [{
                type: type,
                data: values,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 2, color: '#4a90d9' },
                areaStyle: type === 'line' ? { color: 'rgba(74, 144, 217, 0.2)' } : undefined
            }]
        });

        return chart;
    }

    // =====================================================
    // WORD CLOUD
    // =====================================================

    function renderWordCloud(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const textColumn = config.x || state.columns.find(c => {
            const info = state.columnsInfo?.find(ci => ci.name === c);
            return info?.type === 'text';
        }) || state.columns[0];

        // Calculate word frequency
        const wordCount = {};
        state.data.forEach(row => {
            const text = String(row[textColumn] || '');
            const words = text.toLowerCase()
                .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length >= 3);

            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });

        const wordData = Object.entries(wordCount)
            .map(([word, count]) => ({ name: word, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, config.maxWords || 100);

        if (wordData.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#e74c3c;">Kelime bulunamadı</p>';
            return null;
        }

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

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
        return chart;
    }

    // =====================================================
    // CHORD DIAGRAM
    // =====================================================

    function renderChordDiagram(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const sourceCol = config.x || state.columns[0];
        const targetCol = config.y || state.columns[1];
        const valueCol = config.value || state.columns[2];

        // Kaynak-hedef ilişkilerini hesapla
        const links = {};
        const nodes = new Set();

        state.data.forEach(row => {
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

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

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
        return chart;
    }

    // =====================================================
    // PARALLEL COORDINATES
    // =====================================================

    function renderParallelCoordinates(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const numCols = state.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name)
            || state.columns.slice(0, 5);

        const parallelAxis = numCols.map((col, i) => ({
            dim: i,
            name: col,
            type: 'value'
        }));

        const seriesData = state.data.slice(0, 500).map(row =>
            numCols.map(col => parseFloat(row[col]) || 0)
        );

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

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
        return chart;
    }

    // =====================================================
    // DENSITY PLOT
    // =====================================================

    function renderDensityPlot(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const valueCol = config.x || state.columns[0];
        const values = state.data.map(r => parseFloat(r[valueCol])).filter(v => !isNaN(v));

        if (values.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Sayısal veri yok</p>';
            return null;
        }

        // Kernel Density Estimation (basit histogram bazlı yaklaşım)
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = 50;
        const binWidth = (max - min) / binCount;
        const bins = new Array(binCount).fill(0);

        values.forEach(v => {
            const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
            bins[binIndex]++;
        });

        // Normalize
        const total = values.length;
        const density = bins.map(b => b / total / binWidth);
        const xData = bins.map((_, i) => (min + (i + 0.5) * binWidth).toFixed(2));

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

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
        return chart;
    }

    // =====================================================
    // RANGE AREA CHART
    // =====================================================

    function renderRangeArea(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const xCol = config.x || state.columns[0];
        const minCol = config.min || state.columns[1];
        const maxCol = config.max || state.columns[2];

        const xData = state.data.map(r => r[xCol]);
        const minData = state.data.map(r => parseFloat(r[minCol]) || 0);
        const maxData = state.data.map(r => parseFloat(r[maxCol]) || 0);

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

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
        return chart;
    }

    // =====================================================
    // TIMELINE CHART
    // =====================================================

    function renderTimeline(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const dateCol = config.date || state.columns[0];
        const labelCol = config.label || state.columns[1];
        const valueCol = config.value || state.columns[2];

        const timelineData = state.data.map(row => ({
            date: row[dateCol],
            label: row[labelCol],
            value: parseFloat(row[valueCol]) || 0
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

        const option = {
            title: { text: config.title || 'Zaman Çizelgesi', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: timelineData.map(d => d.date) },
            yAxis: { type: 'value' },
            series: [{
                type: 'line',
                data: timelineData.map(d => d.value),
                smooth: true,
                markPoint: {
                    data: [
                        { type: 'max', name: 'En Yüksek' },
                        { type: 'min', name: 'En Düşük' }
                    ]
                },
                markLine: {
                    data: [{ type: 'average', name: 'Ortalama' }]
                }
            }]
        };

        chart.setOption(option);
        return chart;
    }

    // =====================================================
    // WATERFALL CHART
    // =====================================================

    function renderWaterfall(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const labelCol = config.x || state.columns[0];
        const valueCol = config.y || state.columns[1];

        const labels = state.data.map(r => r[labelCol]);
        const values = state.data.map(r => parseFloat(r[valueCol]) || 0);

        // Waterfall için kümülatif hesaplama
        let cumulative = 0;
        const baseData = [];
        const positiveData = [];
        const negativeData = [];

        values.forEach((v, i) => {
            if (v >= 0) {
                baseData.push(cumulative);
                positiveData.push(v);
                negativeData.push('-');
            } else {
                baseData.push(cumulative + v);
                positiveData.push('-');
                negativeData.push(-v);
            }
            cumulative += v;
        });

        // Final total
        labels.push('Toplam');
        baseData.push(0);
        positiveData.push(cumulative >= 0 ? cumulative : '-');
        negativeData.push(cumulative < 0 ? -cumulative : '-');

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

        const option = {
            title: { text: config.title || 'Waterfall', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: labels },
            yAxis: { type: 'value' },
            series: [
                { name: 'Base', type: 'bar', stack: 'wf', itemStyle: { color: 'transparent' }, data: baseData },
                { name: 'Artış', type: 'bar', stack: 'wf', itemStyle: { color: '#27ae60' }, data: positiveData },
                { name: 'Azalış', type: 'bar', stack: 'wf', itemStyle: { color: '#e74c3c' }, data: negativeData }
            ]
        };

        chart.setOption(option);
        return chart;
    }

    // =====================================================
    // BULLET CHART
    // =====================================================

    function renderBulletChart(containerId, data, config = {}) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        if (typeof echarts === 'undefined') return null;

        // data: [{label, actual, target, ranges: [poor, satisfactory, good]}]
        const chart = echarts.init(chartDom);

        const option = {
            title: { text: config.title || 'Bullet Chart', left: 'center' },
            tooltip: {},
            xAxis: { type: 'value', max: Math.max(...data.map(d => Math.max(d.target, d.actual, d.ranges[2]))) * 1.1 },
            yAxis: { type: 'category', data: data.map(d => d.label) },
            series: [
                {
                    name: 'Good',
                    type: 'bar',
                    barWidth: 30,
                    data: data.map(d => d.ranges[2]),
                    itemStyle: { color: 'rgba(39, 174, 96, 0.3)' }
                },
                {
                    name: 'Satisfactory',
                    type: 'bar',
                    barWidth: 20,
                    data: data.map(d => d.ranges[1]),
                    itemStyle: { color: 'rgba(39, 174, 96, 0.5)' },
                    barGap: '-100%'
                },
                {
                    name: 'Actual',
                    type: 'bar',
                    barWidth: 10,
                    data: data.map(d => d.actual),
                    itemStyle: { color: '#333' },
                    barGap: '-100%'
                }
            ]
        };

        chart.setOption(option);
        return chart;
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    // Candlestick
    window.renderCandlestick = renderCandlestick;
    window.renderCandlestickFromData = renderCandlestickFromData;

    // Violin
    window.renderViolinPlot = renderViolinPlot;
    window.renderViolinPlotFromState = renderViolinPlotFromState;

    // Gantt
    window.renderGanttChart = renderGanttChart;
    window.renderGanttFromData = renderGanttFromData;

    // Grouped & Stacked
    window.renderGroupedBar = renderGroupedBar;
    window.renderPercentStackedBar = renderPercentStackedBar;

    // Dot & Error
    window.renderDotPlot = renderDotPlot;
    window.renderDotPlotFromState = renderDotPlotFromState;
    window.renderErrorBar = renderErrorBar;

    // Sparkline
    window.renderSparkline = renderSparkline;

    // Word Cloud
    window.renderWordCloud = renderWordCloud;

    // Chord Diagram
    window.renderChordDiagram = renderChordDiagram;

    // Parallel Coordinates
    window.renderParallelCoordinates = renderParallelCoordinates;

    // Density
    window.renderDensityPlot = renderDensityPlot;

    // Range Area
    window.renderRangeArea = renderRangeArea;

    // Timeline
    window.renderTimeline = renderTimeline;

    // Waterfall
    window.renderWaterfall = renderWaterfall;

    // Bullet
    window.renderBulletChart = renderBulletChart;

    // =====================================================
    // SANKEY CHART (INJECTED)
    // =====================================================

    function createSankeyChart(containerId, data) {
        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        const state = window.VIZ_STATE;
        const chart = echarts.init(chartDom, document.body.classList.contains('day-mode') ? null : 'dark');

        // Data format: { nodes: [{name: 'A'}], links: [{source: 'A', target: 'B', value: 10}] }
        const option = {
            title: { text: 'Sankey Diagram', left: 'center' },
            tooltip: { trigger: 'item', triggerOn: 'mousemove' },
            series: [{
                type: 'sankey',
                layout: 'none',
                emphasis: { focus: 'adjacency' },
                data: data?.nodes || [],
                links: data?.links || [],
                lineStyle: { color: 'gradient', curveness: 0.5 },
                itemStyle: { borderWidth: 1 }
            }]
        };

        chart.setOption(option);

        if (state && state.echartsInstances) {
            state.echartsInstances[containerId] = chart;
        }

        return chart;
    }

    // =====================================================
    // CALENDAR HEATMAP (INJECTED)
    // =====================================================

    function createCalendarHeatmap(containerId, dateColumn, valueColumn) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) {
            if (typeof showToast === 'function') showToast('Veri yüklenmedi', 'warning');
            return null;
        }

        const chartDom = document.getElementById(containerId);
        if (!chartDom) return null;

        // Tarih-değer çiftleri
        const data = [];
        const yearSet = new Set();

        state.data.forEach(row => {
            const dateVal = row[dateColumn];
            const numVal = parseFloat(row[valueColumn]) || 0;

            if (dateVal) {
                const date = new Date(dateVal);
                if (!isNaN(date.getTime())) {
                    const dateStr = date.toISOString().split('T')[0];
                    yearSet.add(date.getFullYear());
                    data.push([dateStr, numVal]);
                }
            }
        });

        const years = Array.from(yearSet).sort();
        const currentYear = years[years.length - 1] || new Date().getFullYear();

        const chart = echarts.init(chartDom, document.body.classList.contains('day-mode') ? null : 'dark');

        const option = {
            title: { text: `${currentYear} Takvim Isı Haritası`, left: 'center' },
            tooltip: {
                formatter: params => `${params.value[0]}: ${params.value[1]}`
            },
            visualMap: {
                min: 0,
                max: Math.max(...data.map(d => d[1])) || 100,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                top: 'top'
            },
            calendar: {
                top: 80,
                left: 50,
                right: 50,
                cellSize: ['auto', 15],
                range: String(currentYear),
                itemStyle: { borderWidth: 0.5 },
                yearLabel: { show: true }
            },
            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                calendarIndex: 0,
                data: data
            }]
        };

        chart.setOption(option);

        if (state.echartsInstances) {
            state.echartsInstances[containerId] = chart;
        }

        return chart;
    }

    // Sankey & Calendar exports
    window.createSankeyChart = createSankeyChart;
    window.createCalendarHeatmap = createCalendarHeatmap;

    console.log('✅ viz-charts-advanced.js FULLY RESTORED - All 18+ advanced chart types + Sankey & Calendar available');
})();
