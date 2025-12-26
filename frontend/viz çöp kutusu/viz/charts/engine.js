
/**
 * viz/charts/engine.js
 * Chart Rendering Engine - PORTED FROM LEGACY VIZ.JS (IIFE Version)
 * Handles ECharts initialization and rendering with full legacy compatibility.
 */

(function () {
    'use strict';

    // Access Global State
    // VIZ_STATE and VIZ_TEXTS are expected to be available globally

    // =====================================================
    // AGGREGATION HELPER (Local Helper)
    // =====================================================
    function aggregateData(data, xCol, yCol, aggType, dataLimit = 20) {
        if (!data || !data.length || !xCol || !yCol) {
            console.warn('aggregateData: Eksik parametre', { dataLen: data?.length, xCol, yCol });
            return { categories: [], values: [] };
        }

        // Gruplama
        const groups = {};
        let parseErrors = 0;

        data.forEach(row => {
            const key = String(row[xCol] ?? '(Boş)');
            let rawVal = row[yCol];

            // Türkçe format düzeltme (virgül -> nokta)
            if (typeof rawVal === 'string') {
                rawVal = rawVal.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
            }

            const val = parseFloat(rawVal);
            if (isNaN(val)) parseErrors++;
            const numVal = isNaN(val) ? 0 : val;

            if (!groups[key]) {
                groups[key] = { sum: 0, count: 0, values: [] };
            }
            groups[key].sum += numVal;
            groups[key].count++;
            groups[key].values.push(numVal);
        });

        // Aggregation hesapla
        const result = Object.entries(groups).map(([key, g]) => {
            let value;
            switch (aggType) {
                case 'sum': value = g.sum; break;
                case 'avg':
                case 'mean': value = g.count > 0 ? g.sum / g.count : 0; break;
                case 'count': value = g.count; break;
                case 'min': value = Math.min(...g.values); break;
                case 'max': value = Math.max(...g.values); break;
                default: value = g.sum;
            }
            return { category: key, value: Math.round(value * 100) / 100 };
        });

        // Değere göre sırala (büyükten küçüğe)
        result.sort((a, b) => b.value - a.value);

        // Veri limiti uygula
        const limited = dataLimit && dataLimit > 0 ? result.slice(0, dataLimit) : result;

        return {
            categories: limited.map(r => r.category),
            values: limited.map(r => r.value)
        };
    }

    // =====================================================
    // RENDER CHART (From Legacy viz.js)
    // =====================================================

    function renderChart(config) {
        const chartDom = document.getElementById(`${config.id}_chart`);
        if (!chartDom) return;

        // Dispose old instance
        if (window.VIZ_STATE.echartsInstances[config.id]) {
            window.VIZ_STATE.echartsInstances[config.id].dispose();
        }

        const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
        const chart = echarts.init(chartDom, theme);
        window.VIZ_STATE.echartsInstances[config.id] = chart;

        // Dataset handling
        const dataset = config.datasetId && window.VIZ_STATE.getDatasetById
            ? window.VIZ_STATE.getDatasetById(config.datasetId)
            : (window.VIZ_STATE.getActiveDataset ? window.VIZ_STATE.getActiveDataset() : null);

        const chartData = dataset?.data || window.VIZ_STATE.data || [];

        let xData, yData;
        let multiSeriesData = [];

        const xColName = config.xAxis;
        const yColumns = config.yAxes || (Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis]);

        // Renk paleti
        const colorPalette = [
            config.color || '#4a90d9', '#00d97e', '#f6c23e', '#e74a3b', '#36b9cc',
            '#6f42c1', '#fd7e14', '#20c9a6', '#858796', '#5a5c69'
        ];

        if (chartData && chartData.length > 0 && xColName && yColumns.length > 0) {
            let filteredData = chartData;
            // Cross-filter logic
            if (window.VIZ_STATE.crossFilterEnabled && window.VIZ_STATE.crossFilterValue) {
                filteredData = chartData.filter(row =>
                    Object.values(row).some(v => String(v) === window.VIZ_STATE.crossFilterValue)
                );
            }

            yColumns.forEach((yCol, idx) => {
                if (!yCol) return;
                const aggregated = aggregateData(filteredData, xColName, yCol, config.aggregation, config.dataLimit || 20);

                if (idx === 0) xData = aggregated.categories;
                let values = aggregated.values;

                multiSeriesData.push({
                    name: yCol,
                    values: values,
                    color: colorPalette[idx % colorPalette.length],
                    yAxisIndex: config.useDualAxis && idx > 0 ? 1 : 0
                });
            });

            yData = multiSeriesData[0]?.values || [];
        } else {
            // Demo veri
            xData = ['A', 'B', 'C', 'D', 'E'];
            yData = [120, 200, 150, 80, 70];
            multiSeriesData = [{ name: 'Demo', values: yData, color: config.color, yAxisIndex: 0 }];
        }

        // Dispatch logic starts here

        // =====================================================
        // DISPATCHER FOR NON-STANDARD CHARTS
        // =====================================================
        // If chart type is 3D, delegate to 3D renderer
        if (['scatter3d', 'bar3d', 'surface3d', 'line3d'].includes(config.type)) {
            if (typeof window.render3DChart === 'function') {
                return window.render3DChart(config, `${config.id}_chart`);
            }
        }

        // If chart type is Advanced, delegate to specific renderers
        const advancedMap = {
            'candlestick': 'renderCandlestickFromData',
            'violin': 'renderViolinPlotFromState',
            'gantt': 'renderGanttFromData',
            'dotplot': 'renderDotPlotFromState',
            'wordCloud': 'renderWordCloud',
            'chord': 'renderChordDiagram',
            'parallel': 'renderParallelCoordinates',
            'density': 'renderDensityPlot',
            'rangeArea': 'renderRangeArea',
            'timeline': 'renderTimeline',
            'waterfall': 'renderWaterfall' // Waterfall is technically in renderChart legacy, but if advanced has better one?
        };
        // Note: Waterfall is also in legacy below, so we can skip it here to use legacy logic, 
        // OR use advanced if preferred. User wants legacy, so I will stick to legacy for standard types.

        if (advancedMap[config.type] && typeof window[advancedMap[config.type]] === 'function') {
            // Special handling for containers
            if (['wordCloud', 'chord', 'parallel', 'density', 'rangeArea', 'timeline', 'waterfall'].includes(config.type)) {
                // These expect id in config or container
                return window[advancedMap[config.type]]({ ...config, container: chartDom });
            }
            return window[advancedMap[config.type]](`${config.id}_chart`, config);
        }


        let option = {};

        // Default grid with containLabel for all charts
        const defaultGrid = {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 60,
            containLabel: true
        };

        switch (config.type) {
            case 'bar':
                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    legend: multiSeriesData.length > 1 ? { top: 30, data: multiSeriesData.map(s => s.name) } : undefined,
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
                            formatter: v => String(v).length > 8 ? String(v).slice(0, 6) + '..' : v
                        }
                    },
                    yAxis: config.useDualAxis && multiSeriesData.length > 1 ? [
                        { type: 'value', name: multiSeriesData[0]?.name || 'Sol Eksen', position: 'left', nameLocation: 'middle', nameGap: 50 },
                        { type: 'value', name: multiSeriesData[1]?.name || 'Sağ Eksen', position: 'right', nameLocation: 'middle', nameGap: 50 }
                    ] : { type: 'value', name: config.yAxis || '', nameLocation: 'middle', nameGap: 50 },
                    grid: { bottom: 120, left: 80, right: config.useDualAxis ? 80 : 20, top: multiSeriesData.length > 1 ? 60 : 40, containLabel: true },
                    series: multiSeriesData.map(s => ({
                        name: s.name, type: 'bar', data: s.values, yAxisIndex: s.yAxisIndex, itemStyle: { color: s.color }
                    }))
                };
                break;

            case 'line':
                option = {
                    title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
                    tooltip: { trigger: 'axis' },
                    legend: multiSeriesData.length > 1 ? { top: 30, data: multiSeriesData.map(s => s.name) } : undefined,
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
                            formatter: v => String(v).length > 8 ? String(v).slice(0, 6) + '..' : v
                        }
                    },
                    yAxis: config.useDualAxis && multiSeriesData.length > 1 ? [
                        { type: 'value', name: multiSeriesData[0]?.name || 'Sol Eksen', position: 'left', nameLocation: 'middle', nameGap: 50 },
                        { type: 'value', name: multiSeriesData[1]?.name || 'Sağ Eksen', position: 'right', nameLocation: 'middle', nameGap: 50 }
                    ] : { type: 'value', name: config.yAxis || '', nameLocation: 'middle', nameGap: 50 },
                    grid: { bottom: 100, left: 80, right: config.useDualAxis ? 80 : 20, top: multiSeriesData.length > 1 ? 60 : 40, containLabel: true },
                    series: multiSeriesData.map(s => ({
                        name: s.name, type: 'line', data: s.values, smooth: true, yAxisIndex: s.yAxisIndex, itemStyle: { color: s.color }
                    }))
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
                    title: { text: config.title, left: 'center' },
                    tooltip: { trigger: 'axis' },
                    xAxis: { type: 'category', data: xData, boundaryGap: false },
                    yAxis: { type: 'value' },
                    grid: { ...defaultGrid, bottom: 60 },
                    series: multiSeriesData.map(s => ({
                        name: s.name, type: 'line', data: s.values, areaStyle: { color: s.color + '40' }, itemStyle: { color: s.color }, smooth: true
                    }))
                };
                break;

            case 'scatter':
                // Scatter Multi-X & Multi-Y Logic
                const xColumns = config.xAxes || [config.xAxis];
                const scatterSeries = [];
                let useCategoryAxis = false;
                let categoryLabels = [];
                const targetYAxes = Array.isArray(config.yAxis) ? config.yAxis : (config.yAxes || [config.yAxis]);

                xColumns.forEach((xCol, xIdx) => {
                    if (!xCol) return;
                    targetYAxes.forEach((yCol, yIdx) => {
                        if (!yCol) return;
                        const sampleXValues = chartData.slice(0, 100).map(row => row[xCol]);
                        const numericCount = sampleXValues.filter(v => !isNaN(parseFloat(v))).length;
                        const isXNumeric = numericCount > sampleXValues.length * 0.5;

                        let scatterData;
                        if (isXNumeric) {
                            scatterData = chartData.map(row => [parseFloat(row[xCol]), parseFloat(row[yCol])]).filter(d => !isNaN(d[0]) && !isNaN(d[1]));
                        } else {
                            useCategoryAxis = true;
                            const uniqueCategories = [...new Set(chartData.map(row => String(row[xCol] || '(Boş)')))];
                            if (xIdx === 0 && yIdx === 0) categoryLabels = uniqueCategories;
                            scatterData = chartData.map(row => ({ value: [uniqueCategories.indexOf(String(row[xCol])), parseFloat(row[yCol])], name: String(row[xCol]) })).filter(d => !isNaN(d.value[1]));
                        }

                        if (scatterData.length > 0) {
                            scatterSeries.push({
                                name: `${xCol} vs ${yCol}`,
                                type: 'scatter',
                                data: scatterData,
                                symbolSize: 10,
                                itemStyle: { color: colorPalette[(xIdx + yIdx) % colorPalette.length] }
                            });
                        }
                    });
                });

                if (scatterSeries.length === 0) {
                    scatterSeries.push({
                        name: 'Demo', type: 'scatter', data: yData.map((v, i) => [i, v]), symbolSize: 10, itemStyle: { color: config.color }
                    });
                }

                option = {
                    title: { text: config.title, left: 'center' },
                    tooltip: { trigger: 'item' },
                    legend: scatterSeries.length > 1 ? { top: 30, data: scatterSeries.map(s => s.name) } : undefined,
                    xAxis: useCategoryAxis ? { type: 'category', data: categoryLabels, name: xColumns[0] || 'Category', axisLabel: { rotate: 45 } }
                        : { type: 'value', name: xColumns[0] || 'X' },
                    yAxis: { type: 'value', name: config.yAxis || 'Y' },
                    grid: { bottom: useCategoryAxis ? 80 : 60, left: 80, right: 40, top: scatterSeries.length > 1 ? 60 : 40, containLabel: true },
                    series: scatterSeries
                };
                break;

            default:
                option = {
                    title: { text: config.title + ' (Fallback)', left: 'center' },
                    xAxis: { type: 'category', data: xData },
                    yAxis: { type: 'value' },
                    grid: defaultGrid,
                    series: [{ type: 'bar', data: yData }]
                };
                break;
        }

        chart.setOption(option, true);

        // Click Listener
        chart.off('click');
        chart.on('click', function (params) {
            if (typeof window.applyCrossFilter === 'function') {
                window.applyCrossFilter(config.id, params.name);
            }
        });

        return chart;
    }

    function rerenderAllCharts() {
        if (window.VIZ_STATE && window.VIZ_STATE.charts) {
            window.VIZ_STATE.charts.forEach(c => renderChart(c));
        }
    }

    // Window resize handler - resize all charts
    window.addEventListener('resize', function () {
        if (window.VIZ_STATE && window.VIZ_STATE.echartsInstances) {
            Object.values(window.VIZ_STATE.echartsInstances).forEach(chart => {
                if (chart && chart.resize) chart.resize();
            });
        }
    });

    // Explicitly expose to window
    window.renderChart = renderChart;
    window.rerenderAllCharts = rerenderAllCharts;
    window.aggregateData = aggregateData;

    console.log('✅ engine.js Loaded (IIFE + ContainLabel + Resize)');

})();

