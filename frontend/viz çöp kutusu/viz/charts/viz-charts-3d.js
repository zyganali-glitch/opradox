/**
 * viz-charts-3d.js
 * 3D Chart Types - Scatter3D, Bar3D, Surface3D, Line3D
 * Requires echarts-gl extension
 */

(function () {
    'use strict';

    /**
     * Check if ECharts GL is available
     */
    function isEchartsGLAvailable() {
        return typeof echarts !== 'undefined' &&
            typeof echarts.graphic !== 'undefined' &&
            typeof echarts.graphic.bindBindbindbindBindBindingbindbindbindbindBindBindingBindBinding !== 'undefined';
    }

    /**
     * Build 3D Scatter chart option
     * @param {Object} config - Chart configuration
     * @param {Array} data - 3D data points [[x, y, z], ...]
     */
    function buildScatter3DOption(config, data) {
        return {
            title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
            tooltip: {},
            xAxis3D: { type: 'value', name: config.xAxis || 'X' },
            yAxis3D: { type: 'value', name: config.yAxis || 'Y' },
            zAxis3D: { type: 'value', name: config.zAxis || 'Z' },
            grid3D: {
                viewControl: {
                    autoRotate: true,
                    autoRotateSpeed: 10
                }
            },
            series: [{
                type: 'scatter3D',
                data: data,
                symbolSize: 8,
                itemStyle: {
                    color: config.color || '#4a90d9',
                    opacity: 0.8
                }
            }]
        };
    }

    /**
     * Build 3D Bar chart option
     * @param {Object} config - Chart configuration
     * @param {Array} xData - X axis categories
     * @param {Array} yData - Y axis categories
     * @param {Array} zData - Z values (height of bars)
     */
    function buildBar3DOption(config, xData, yData, zData) {
        // Convert to 3D bar data format
        const data = [];
        xData.forEach((x, i) => {
            yData.forEach((y, j) => {
                const value = zData[i * yData.length + j] || 0;
                data.push([i, j, value]);
            });
        });

        return {
            title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
            tooltip: {},
            visualMap: {
                max: Math.max(...zData),
                inRange: {
                    color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
                        '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
                }
            },
            xAxis3D: { type: 'category', data: xData },
            yAxis3D: { type: 'category', data: yData },
            zAxis3D: { type: 'value' },
            grid3D: {
                boxWidth: 100,
                boxDepth: 80,
                viewControl: { distance: 200 }
            },
            series: [{
                type: 'bar3D',
                data: data,
                shading: 'lambert',
                label: { show: false }
            }]
        };
    }

    /**
     * Build 3D Surface chart option
     * @param {Object} config - Chart configuration
     * @param {Function} surfaceFunc - Function(x, y) => z
     * @param {Object} range - { xMin, xMax, yMin, yMax }
     */
    function buildSurface3DOption(config, surfaceFunc, range = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 }) {
        // Generate surface data
        const data = [];
        const step = 0.2;

        for (let x = range.xMin; x <= range.xMax; x += step) {
            for (let y = range.yMin; y <= range.yMax; y += step) {
                const z = surfaceFunc ? surfaceFunc(x, y) : Math.sin(x) * Math.cos(y);
                data.push([x, y, z]);
            }
        }

        return {
            title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
            tooltip: {},
            visualMap: {
                show: true,
                dimension: 2,
                min: -1,
                max: 1,
                inRange: {
                    color: ['#313695', '#4575b4', '#74add1', '#abd9e9',
                        '#fee090', '#fdae61', '#f46d43', '#d73027']
                }
            },
            xAxis3D: { type: 'value' },
            yAxis3D: { type: 'value' },
            zAxis3D: { type: 'value' },
            grid3D: {
                viewControl: { distance: 150, alpha: 20, beta: 40 }
            },
            series: [{
                type: 'surface',
                data: data,
                shading: 'color',
                wireframe: { show: false }
            }]
        };
    }

    /**
     * Build 3D Line chart option
     * @param {Object} config - Chart configuration
     * @param {Array} data - 3D line points [[x, y, z], ...]
     */
    function buildLine3DOption(config, data) {
        return {
            title: { text: config.title, left: 'center', textStyle: { fontSize: 14 } },
            tooltip: {},
            xAxis3D: { type: 'value', name: config.xAxis || 'X' },
            yAxis3D: { type: 'value', name: config.yAxis || 'Y' },
            zAxis3D: { type: 'value', name: config.zAxis || 'Z' },
            grid3D: {
                viewControl: { distance: 150 }
            },
            series: [{
                type: 'line3D',
                data: data,
                lineStyle: {
                    color: config.color || '#4a90d9',
                    width: 3
                }
            }]
        };
    }

    /**
     * Generate demo 3D scatter data from 2D data
     * @param {Array} data - Original data array
     * @param {string} xCol - X column
     * @param {string} yCol - Y column
     * @param {string} zCol - Z column (optional, will use Y if not provided)
     */
    function generate3DScatterData(data, xCol, yCol, zCol) {
        if (!data || data.length === 0) {
            // Demo data
            const demoData = [];
            for (let i = 0; i < 100; i++) {
                demoData.push([
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100
                ]);
            }
            return demoData;
        }

        return data.map((row, idx) => {
            const x = parseFloat(row[xCol]) || idx;
            const y = parseFloat(row[yCol]) || 0;
            const z = zCol ? (parseFloat(row[zCol]) || 0) : y;
            return [x, y, z];
        }).filter(d => !isNaN(d[0]) && !isNaN(d[1]) && !isNaN(d[2]));
    }

    /**
     * Generate helix data for demo
     */
    function generateHelixData(points = 100) {
        const data = [];
        for (let i = 0; i < points; i++) {
            const t = i / 10;
            data.push([
                Math.cos(t) * (10 + t),
                Math.sin(t) * (10 + t),
                t * 2
            ]);
        }
        return data;
    }

    /**
     * Generate sphere surface data
     */
    function generateSphereData(radius = 1, detail = 20) {
        const data = [];
        for (let theta = 0; theta <= Math.PI; theta += Math.PI / detail) {
            for (let phi = 0; phi < 2 * Math.PI; phi += 2 * Math.PI / detail) {
                data.push([
                    radius * Math.sin(theta) * Math.cos(phi),
                    radius * Math.sin(theta) * Math.sin(phi),
                    radius * Math.cos(theta)
                ]);
            }
        }
        return data;
    }

    /**
     * Render a 3D chart
     * @param {Object} config - Chart config with type: scatter3d, bar3d, surface3d, line3d
     * @param {string} containerId - Container element ID
     */
    function render3DChart(config, containerId) {
        const state = window.VIZ_STATE;
        const chartDom = document.getElementById(containerId);

        if (!chartDom) {
            console.warn('3D chart container not found:', containerId);
            return null;
        }

        // Check ECharts availability
        if (typeof echarts === 'undefined') {
            chartDom.innerHTML = '<div class="viz-no-chart-data">ECharts kutuphanes yuklu degil</div>';
            return null;
        }

        // Dispose old instance
        if (state && state.echartsInstances && state.echartsInstances[config.id]) {
            state.echartsInstances[config.id].dispose();
        }

        const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
        const chart = echarts.init(chartDom, theme);

        // Get data
        const chartData = state?.data || [];
        let option;

        switch (config.type) {
            case 'scatter3d':
                const scatter3DData = generate3DScatterData(chartData, config.xAxis, config.yAxis, config.zAxis);
                option = buildScatter3DOption(config, scatter3DData);
                break;

            case 'bar3d':
                // Simple demo for bar3d
                const xLabels = ['A', 'B', 'C', 'D', 'E'];
                const yLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                const zValues = Array(25).fill(0).map(() => Math.floor(Math.random() * 100));
                option = buildBar3DOption(config, xLabels, yLabels, zValues);
                break;

            case 'surface3d':
                option = buildSurface3DOption(config, (x, y) => Math.sin(x * x + y * y) * Math.exp(-0.1 * (x * x + y * y)));
                break;

            case 'line3d':
                const helixData = generateHelixData(100);
                option = buildLine3DOption(config, helixData);
                break;

            default:
                option = buildScatter3DOption(config, generate3DScatterData([], '', '', ''));
        }

        chart.setOption(option);

        // Store instance
        if (state) {
            if (!state.echartsInstances) state.echartsInstances = {};
            state.echartsInstances[config.id] = chart;
        }

        return chart;
    }

    // Global exports
    window.isEchartsGLAvailable = isEchartsGLAvailable;
    window.buildScatter3DOption = buildScatter3DOption;
    window.buildBar3DOption = buildBar3DOption;
    window.buildSurface3DOption = buildSurface3DOption;
    window.buildLine3DOption = buildLine3DOption;
    window.generate3DScatterData = generate3DScatterData;
    window.generateHelixData = generateHelixData;
    window.generateSphereData = generateSphereData;
    window.render3DChart = render3DChart;

    console.log('✅ viz-charts-3d.js Loaded');
})();
