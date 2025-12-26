/**
 * viz-stats-basic.js
 * Basic Statistics Calculations
 * Mean, median, std, trend line, overlays
 */

(function () {
    'use strict';

    /**
     * Calculate comprehensive statistics for an array of values
     * Uses simple-statistics library if available, falls back to manual calculation
     * @param {Array} values - Numeric values
     * @returns {Object} Statistics object
     */
    function calculateStatistics(values) {
        if (!values || values.length === 0) return null;

        // simple-statistics kutuphanesi var mi kontrol
        if (typeof ss === 'undefined') {
            console.warn('simple-statistics kutuphanesi yuklenemedi, fallback hesaplama kullaniliyor');
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
            console.error('Istatistik hesaplama hatasi:', e);
            return calculateStatsFallback(values);
        }
    }

    /**
     * Fallback statistics calculation without external library
     * @param {Array} values - Numeric values
     * @returns {Object} Statistics object
     */
    function calculateStatsFallback(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const n = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        const mid = Math.floor(n / 2);
        const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;

        // Quartiles
        const q1Index = Math.floor(n * 0.25);
        const q3Index = Math.floor(n * 0.75);

        return {
            mean: mean,
            median: median,
            stdev: Math.sqrt(variance),
            min: sorted[0],
            max: sorted[n - 1],
            count: n,
            variance: variance,
            q1: sorted[q1Index],
            q3: sorted[q3Index]
        };
    }

    /**
     * Update the statistics summary UI panel
     * @param {Object} stats - Statistics object
     */
    function updateStatsSummary(stats) {
        const summaryEl = document.getElementById('vizStatsSummary');
        if (!summaryEl || !stats) {
            if (summaryEl) summaryEl.style.display = 'none';
            return;
        }

        summaryEl.style.display = 'block';

        const meanEl = document.getElementById('statMean');
        const medianEl = document.getElementById('statMedian');
        const stdevEl = document.getElementById('statStdev');
        const minEl = document.getElementById('statMin');
        const maxEl = document.getElementById('statMax');
        const countEl = document.getElementById('statCount');

        if (meanEl) meanEl.textContent = formatNumber(stats.mean);
        if (medianEl) medianEl.textContent = formatNumber(stats.median);
        if (stdevEl) stdevEl.textContent = formatNumber(stats.stdev);
        if (minEl) minEl.textContent = formatNumber(stats.min);
        if (maxEl) maxEl.textContent = formatNumber(stats.max);
        if (countEl) countEl.textContent = stats.count;
    }

    /**
     * Format number for display with K/M suffix
     * @param {number} num - Number to format
     * @returns {string} Formatted string
     */
    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '-';
        if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    /**
     * Get statistical overlays for charts (mean line, median line, std band)
     * @param {Array} values - Y values
     * @param {Object} stats - Pre-calculated statistics
     * @returns {Object} { markLines: [], markAreas: [] }
     */
    function getStatisticalOverlays(values, stats) {
        const overlays = {
            markLines: [],
            markAreas: []
        };

        if (!stats) return overlays;

        const state = window.VIZ_STATE;
        const texts = window.VIZ_TEXTS ? window.VIZ_TEXTS[state?.lang || 'tr'] : {};

        const showMean = document.getElementById('showMeanLine')?.checked;
        const showMedian = document.getElementById('showMedianLine')?.checked;
        const showStdBand = document.getElementById('showStdBand')?.checked;

        // Ortalama Cizgisi
        if (showMean) {
            overlays.markLines.push({
                yAxis: stats.mean,
                name: texts.stat_mean || 'Mean',
                lineStyle: { color: '#00d97e', type: 'solid', width: 2 },
                label: {
                    formatter: `μ = ${formatNumber(stats.mean)}`,
                    position: 'insideEndTop',
                    distance: 5,
                    backgroundColor: 'rgba(0, 217, 126, 0.9)',
                    color: '#fff',
                    padding: [2, 5],
                    borderRadius: 3,
                    fontSize: 10
                }
            });
        }

        // Medyan Cizgisi
        if (showMedian) {
            overlays.markLines.push({
                yAxis: stats.median,
                name: texts.stat_median || 'Median',
                lineStyle: { color: '#ffc107', type: 'dashed', width: 2 },
                label: {
                    formatter: `Med = ${formatNumber(stats.median)}`,
                    position: 'insideEndBottom',
                    distance: 5,
                    backgroundColor: 'rgba(255, 193, 7, 0.9)',
                    color: '#000',
                    padding: [2, 5],
                    borderRadius: 3,
                    fontSize: 10
                }
            });
        }

        // Standart Sapma Bandi (+-1σ)
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

            // Ust ve alt sinir cizgileri
            overlays.markLines.push(
                { yAxis: upper, lineStyle: { color: '#4a90d9', type: 'dotted', width: 1 }, label: { formatter: '+1σ', position: 'start', fontSize: 9 } },
                { yAxis: lower, lineStyle: { color: '#4a90d9', type: 'dotted', width: 1 }, label: { formatter: '-1σ', position: 'start', fontSize: 9 } }
            );
        }

        return overlays;
    }

    /**
     * Calculate linear trend line
     * @param {Array} xData - X values (categories)
     * @param {Array} yData - Y values (numeric)
     * @returns {Object} { start, end, slope, intercept }
     */
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
                console.error('Trend cizgisi hesaplama hatasi:', e);
            }
        }

        // Fallback: Basit dogrusal regresyon
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

    /**
     * Apply statistical overlays to an ECharts instance
     * @param {Object} chartInstance - ECharts instance
     * @param {Object} config - Chart configuration
     * @param {Array} yData - Y data values
     */
    function applyStatisticalOverlays(chartInstance, config, yData) {
        if (!chartInstance || !yData || yData.length === 0) return;

        const stats = calculateStatistics(yData);
        if (!stats) return;

        const overlays = getStatisticalOverlays(yData, stats);

        // Update stats summary panel
        updateStatsSummary(stats);

        // Get current options and merge overlays
        const option = chartInstance.getOption();
        if (option && option.series && option.series[0]) {
            option.series[0].markLine = {
                data: overlays.markLines,
                silent: true
            };
            option.series[0].markArea = {
                data: overlays.markAreas,
                silent: true
            };
            chartInstance.setOption(option);
        }
    }

    // Global exports
    window.calculateStatistics = calculateStatistics;
    window.calculateStatsFallback = calculateStatsFallback;
    window.updateStatsSummary = updateStatsSummary;
    window.formatNumber = formatNumber;
    window.getStatisticalOverlays = getStatisticalOverlays;
    window.calculateTrendLine = calculateTrendLine;
    window.applyStatisticalOverlays = applyStatisticalOverlays;

    console.log('✅ viz-stats-basic.js Loaded');
})();
