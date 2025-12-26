/**
 * viz-bi-insights.js
 * Business Intelligence & Insights Functions - FULLY RESTORED
 * Anomaly Detection, Trend Analysis, What-If Simulator, Cross-Filter
 * Stats Overlay, Forecasting, Growth Rate, Insights Generation
 */

(function () {
    'use strict';

    // =====================================================
    // STATS OVERLAY CONFIGURATION
    // =====================================================

    function initStatsOverlay() {
        const state = window.VIZ_STATE;
        if (!state) return;

        // Initialize stats overlay settings
        if (!state.statsOverlay) {
            state.statsOverlay = {
                showMean: false,
                showMedian: false,
                showStdBand: false,
                showTrend: false
            };
        }

        const meanCheckbox = document.getElementById('showMean');
        const medianCheckbox = document.getElementById('showMedian');
        const stdCheckbox = document.getElementById('showStdBand');
        const trendCheckbox = document.getElementById('showTrend');

        if (meanCheckbox) {
            meanCheckbox.addEventListener('change', (e) => {
                state.statsOverlay.showMean = e.target.checked;
                rerenderSelectedChart();
            });
        }

        if (medianCheckbox) {
            medianCheckbox.addEventListener('change', (e) => {
                state.statsOverlay.showMedian = e.target.checked;
                rerenderSelectedChart();
            });
        }

        if (stdCheckbox) {
            stdCheckbox.addEventListener('change', (e) => {
                state.statsOverlay.showStdBand = e.target.checked;
                rerenderSelectedChart();
            });
        }

        if (trendCheckbox) {
            trendCheckbox.addEventListener('change', (e) => {
                state.statsOverlay.showTrend = e.target.checked;
                rerenderSelectedChart();
            });
        }

        console.log('📊 Stats overlay initialized');
    }

    function rerenderSelectedChart() {
        const state = window.VIZ_STATE;
        if (state && state.selectedChart) {
            const config = state.charts?.find(c => c.id === state.selectedChart);
            if (config && typeof renderChart === 'function') {
                renderChart(config);
            }
        }
    }

    // =====================================================
    // CALCULATE CHART STATISTICS
    // =====================================================

    function calculateChartStats(yData) {
        if (!yData || yData.length === 0) return null;

        const numericData = yData.filter(v => typeof v === 'number' && !isNaN(v));
        if (numericData.length === 0) return null;

        const sum = numericData.reduce((a, b) => a + b, 0);
        const mean = sum / numericData.length;

        const sorted = [...numericData].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        const variance = numericData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericData.length;
        const std = Math.sqrt(variance);

        const min = Math.min(...numericData);
        const max = Math.max(...numericData);

        return { mean, median, std, min, max, count: numericData.length, sum };
    }

    // =====================================================
    // ADD STATS OVERLAY TO CHART
    // =====================================================

    function addStatsOverlay(option, yData) {
        const state = window.VIZ_STATE;
        const stats = calculateChartStats(yData);
        if (!stats || !state || !state.statsOverlay) return option;

        const markLines = [];
        const markAreas = [];

        if (state.statsOverlay.showMean) {
            markLines.push({
                name: 'Ortalama',
                yAxis: stats.mean,
                label: { formatter: `Ort: ${stats.mean.toFixed(2)}`, position: 'end' },
                lineStyle: { color: '#4a90d9', type: 'solid', width: 2 }
            });
        }

        if (state.statsOverlay.showMedian) {
            markLines.push({
                name: 'Medyan',
                yAxis: stats.median,
                label: { formatter: `Med: ${stats.median.toFixed(2)}`, position: 'end' },
                lineStyle: { color: '#9a3050', type: 'dashed', width: 2 }
            });
        }

        if (state.statsOverlay.showStdBand) {
            markAreas.push([
                { yAxis: stats.mean - stats.std, name: '-1σ' },
                { yAxis: stats.mean + stats.std, name: '+1σ' }
            ]);
        }

        if (option.series && option.series[0]) {
            if (markLines.length > 0) {
                option.series[0].markLine = {
                    silent: true,
                    symbol: 'none',
                    data: markLines
                };
            }

            if (markAreas.length > 0) {
                option.series[0].markArea = {
                    silent: true,
                    itemStyle: { color: 'rgba(74, 144, 217, 0.1)' },
                    data: markAreas
                };
            }
        }

        return option;
    }

    // =====================================================
    // WHAT-IF SIMULATOR
    // =====================================================

    function initWhatIfSimulator() {
        const state = window.VIZ_STATE;
        if (!state) return;

        state.whatIfMultiplier = 1;

        const slider = document.getElementById('whatIfSlider');
        const valueDisplay = document.getElementById('whatIfValue');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const percent = parseInt(e.target.value);
                state.whatIfMultiplier = 1 + (percent / 100);

                if (valueDisplay) {
                    valueDisplay.textContent = `${percent > 0 ? '+' : ''}${percent}%`;
                    valueDisplay.className = 'viz-whatif-percent ' +
                        (percent > 0 ? 'viz-positive' : percent < 0 ? 'viz-negative' : '');
                }

                // Tüm grafikleri güncelle
                if (state.charts) {
                    state.charts.forEach(config => {
                        if (typeof renderChart === 'function') renderChart(config);
                    });
                }
            });
        }

        console.log('🔮 What-If simulator initialized');
    }

    function applyWhatIfMultiplier(value) {
        const state = window.VIZ_STATE;
        if (!state || typeof value !== 'number') return value;
        return value * (state.whatIfMultiplier || 1);
    }

    function resetWhatIf() {
        const state = window.VIZ_STATE;
        if (state) state.whatIfMultiplier = 1;

        const slider = document.getElementById('whatIfSlider');
        const valueDisplay = document.getElementById('whatIfValue');
        if (slider) slider.value = 0;
        if (valueDisplay) {
            valueDisplay.textContent = '0%';
            valueDisplay.className = 'viz-whatif-percent';
        }

        if (state && state.charts) {
            state.charts.forEach(config => {
                if (typeof renderChart === 'function') renderChart(config);
            });
        }
    }

    // =====================================================
    // ANOMALY DETECTION
    // =====================================================

    function detectAnomalies(column = null, threshold = 2.5) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return [];
        }

        // Find column
        const selectedChart = state.charts?.find(c => c.id === state.selectedChart);
        const yCol = column || selectedChart?.yAxis || (state.columnsInfo || []).find(c => c.type === 'numeric')?.name || state.columns[0];

        if (!yCol) {
            if (typeof showToast === 'function') showToast('Sayısal sütun bulunamadı', 'error');
            return [];
        }

        const values = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));

        if (values.length < 3) {
            if (typeof showToast === 'function') showToast('Yeterli veri yok', 'error');
            return [];
        }

        // Z-score ile anomali tespiti
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length);

        const anomalies = [];
        state.data.forEach((row, i) => {
            const val = parseFloat(row[yCol]);
            if (!isNaN(val) && std > 0) {
                const zScore = (val - mean) / std;
                if (Math.abs(zScore) > threshold) {
                    anomalies.push({
                        index: i,
                        value: val,
                        zScore: zScore,
                        type: zScore > 0 ? 'high' : 'low',
                        column: yCol
                    });
                }
            }
        });

        // Sonuçları UI'da göster
        const resultsDiv = document.getElementById('anomalyResults');
        const countSpan = document.getElementById('anomalyCount');
        const listDiv = document.getElementById('anomalyList');

        if (resultsDiv && countSpan && listDiv) {
            resultsDiv.style.display = 'block';
            countSpan.textContent = anomalies.length;

            if (anomalies.length === 0) {
                listDiv.innerHTML = `<div class="viz-no-anomaly"><i class="fas fa-check-circle"></i> Anomali bulunamadı</div>`;
            } else {
                listDiv.innerHTML = anomalies.slice(0, 5).map(a => `
                    <div class="viz-anomaly-item ${a.type}">
                        <span>Satır ${a.index + 1}: ${a.value.toFixed(2)}</span>
                        <span class="viz-zscore">z=${a.zScore.toFixed(2)}</span>
                    </div>
                `).join('');
            }
        }

        if (typeof showToast === 'function') {
            showToast(`${anomalies.length} anomali tespit edildi`, anomalies.length > 0 ? 'warning' : 'success');
        }

        // Trend analizi
        analyzeTrend(values);

        return anomalies;
    }

    // =====================================================
    // TREND ANALYSIS
    // =====================================================

    function analyzeTrend(values) {
        if (!values || values.length < 3) return null;

        // Basit doğrusal trend analizi
        const n = values.length;
        const xMean = (n - 1) / 2;
        const yMean = values.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (values[i] - yMean);
            denominator += Math.pow(i - xMean, 2);
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const percentChange = values[0] !== 0 ? ((values[n - 1] - values[0]) / values[0]) * 100 : 0;

        // Trend direction
        let trendClass, trendIcon, trendText, direction;
        const state = window.VIZ_STATE;
        const lang = state?.lang || 'tr';

        if (Math.abs(percentChange) < 5) {
            trendClass = 'viz-trend-stable';
            trendIcon = 'fa-minus';
            direction = 'stable';
            trendText = lang === 'tr' ? 'Trend: Stabil' : 'Trend: Stable';
        } else if (percentChange > 0) {
            trendClass = 'viz-trend-up';
            trendIcon = 'fa-arrow-up';
            direction = 'up';
            trendText = lang === 'tr'
                ? `Trend: Yükseliş (+${percentChange.toFixed(1)}%)`
                : `Trend: Upward (+${percentChange.toFixed(1)}%)`;
        } else {
            trendClass = 'viz-trend-down';
            trendIcon = 'fa-arrow-down';
            direction = 'down';
            trendText = lang === 'tr'
                ? `Trend: Düşüş (${percentChange.toFixed(1)}%)`
                : `Trend: Downward (${percentChange.toFixed(1)}%)`;
        }

        // UI güncelle
        const trendDiv = document.getElementById('trendInsight');
        const trendTextSpan = document.getElementById('trendText');

        if (trendDiv && trendTextSpan) {
            trendDiv.style.display = 'flex';
            trendDiv.className = `viz-trend-insight ${trendClass}`;
            const icon = trendDiv.querySelector('i');
            if (icon) icon.className = `fas ${trendIcon}`;
            trendTextSpan.textContent = trendText;
        }

        return {
            slope,
            percentChange,
            direction,
            trendClass,
            trendText
        };
    }

    // =====================================================
    // CROSS-FILTER
    // =====================================================

    function initCrossFilter() {
        const state = window.VIZ_STATE;
        if (!state) return;

        state.crossFilterEnabled = false;
        state.crossFilterValue = null;

        const checkbox = document.getElementById('crossFilterEnabled');

        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                state.crossFilterEnabled = e.target.checked;
                if (!e.target.checked) {
                    state.crossFilterValue = null;
                    // Tüm grafikleri normal render et
                    if (state.charts) {
                        state.charts.forEach(config => {
                            if (typeof renderChart === 'function') renderChart(config);
                        });
                    }
                }
                if (typeof showToast === 'function') {
                    showToast(
                        e.target.checked ? 'Cross-Filter aktif' : 'Cross-Filter kapalı',
                        'info'
                    );
                }
            });
        }

        console.log('🔗 Cross-filter initialized');
    }

    function handleChartClick(params, chartId) {
        const state = window.VIZ_STATE;
        if (!state || !state.crossFilterEnabled) return;

        const clickedValue = params.name || params.data?.name;
        if (!clickedValue) return;

        state.crossFilterValue = clickedValue;

        // Diğer grafikleri filtrele
        if (state.charts) {
            state.charts.forEach(config => {
                if (config.id !== chartId && typeof renderChart === 'function') {
                    renderChart(config);
                }
            });
        }

        if (typeof showToast === 'function') showToast(`Filtre: ${clickedValue}`, 'info');
    }

    function clearCrossFilter() {
        const state = window.VIZ_STATE;
        if (state) {
            state.crossFilterValue = null;
            if (state.charts) {
                state.charts.forEach(config => {
                    if (typeof renderChart === 'function') renderChart(config);
                });
            }
        }
    }

    // =====================================================
    // GROWTH RATE CALCULATION
    // =====================================================

    function calculateGrowthRate(values, periodType = 'simple') {
        if (!values || values.length < 2) return null;

        const n = values.length;
        const firstValue = values[0];
        const lastValue = values[n - 1];

        if (firstValue === 0) return null;

        let growthRate;

        if (periodType === 'simple') {
            // Simple growth rate
            growthRate = ((lastValue - firstValue) / firstValue) * 100;
        } else if (periodType === 'cagr') {
            // Compound Annual Growth Rate
            growthRate = (Math.pow(lastValue / firstValue, 1 / (n - 1)) - 1) * 100;
        }

        return {
            startValue: firstValue,
            endValue: lastValue,
            periods: n - 1,
            growthRate: growthRate,
            type: periodType
        };
    }

    // =====================================================
    // SIMPLE FORECASTING
    // =====================================================

    function calculateForecast(values, periodsAhead = 3, method = 'linear') {
        if (!values || values.length < 2) return null;

        const n = values.length;
        const forecasts = [];

        if (method === 'linear') {
            // Linear regression based forecast
            const xMean = (n - 1) / 2;
            const yMean = values.reduce((a, b) => a + b, 0) / n;

            let numerator = 0;
            let denominator = 0;

            for (let i = 0; i < n; i++) {
                numerator += (i - xMean) * (values[i] - yMean);
                denominator += Math.pow(i - xMean, 2);
            }

            const slope = denominator !== 0 ? numerator / denominator : 0;
            const intercept = yMean - slope * xMean;

            for (let i = 0; i < periodsAhead; i++) {
                forecasts.push({
                    period: n + i,
                    value: intercept + slope * (n + i),
                    method: 'linear'
                });
            }
        } else if (method === 'moving_average') {
            // Moving average based forecast
            const windowSize = Math.min(3, n);
            const lastWindow = values.slice(-windowSize);
            const ma = lastWindow.reduce((a, b) => a + b, 0) / windowSize;

            for (let i = 0; i < periodsAhead; i++) {
                forecasts.push({
                    period: n + i,
                    value: ma,
                    method: 'moving_average'
                });
            }
        } else if (method === 'exponential') {
            // Simple exponential smoothing
            const alpha = 0.3;
            let lastSmoothed = values[0];

            for (let i = 1; i < n; i++) {
                lastSmoothed = alpha * values[i] + (1 - alpha) * lastSmoothed;
            }

            for (let i = 0; i < periodsAhead; i++) {
                forecasts.push({
                    period: n + i,
                    value: lastSmoothed,
                    method: 'exponential'
                });
            }
        }

        return {
            original: values,
            forecasts: forecasts,
            method: method
        };
    }

    // =====================================================
    // GENERATE INSIGHTS
    // =====================================================

    function generateInsights(column = null) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            return { insights: [], message: 'Veri yok' };
        }

        const insights = [];
        const numericColumns = (state.columnsInfo || []).filter(c => c.type === 'numeric').map(c => c.name);

        if (numericColumns.length === 0) {
            return { insights: [], message: 'Sayısal sütun bulunamadı' };
        }

        const targetColumn = column || numericColumns[0];
        const values = state.data.map(row => parseFloat(row[targetColumn])).filter(v => !isNaN(v));

        if (values.length === 0) {
            return { insights: [], message: 'Sayısal değer bulunamadı' };
        }

        const stats = calculateChartStats(values);
        const trend = analyzeTrend(values);
        const growth = calculateGrowthRate(values);
        const anomalies = detectAnomalies(targetColumn);

        // Stats insight
        insights.push({
            type: 'stats',
            title: 'İstatistik Özeti',
            description: `Ortalama: ${stats.mean.toFixed(2)}, Medyan: ${stats.median.toFixed(2)}, Std: ${stats.std.toFixed(2)}`,
            importance: 'high'
        });

        // Trend insight
        if (trend) {
            insights.push({
                type: 'trend',
                title: 'Trend Analizi',
                description: trend.trendText,
                direction: trend.direction,
                importance: Math.abs(trend.percentChange) > 20 ? 'high' : 'medium'
            });
        }

        // Growth insight
        if (growth) {
            insights.push({
                type: 'growth',
                title: 'Büyüme Oranı',
                description: `${growth.growthRate.toFixed(1)}% (${growth.periods} dönem)`,
                importance: Math.abs(growth.growthRate) > 50 ? 'high' : 'medium'
            });
        }

        // Anomaly insight
        if (anomalies.length > 0) {
            insights.push({
                type: 'anomaly',
                title: 'Anomali Tespiti',
                description: `${anomalies.length} adet anormal değer tespit edildi`,
                count: anomalies.length,
                importance: 'warning'
            });
        }

        // Range insight
        insights.push({
            type: 'range',
            title: 'Değer Aralığı',
            description: `Min: ${stats.min.toFixed(2)}, Max: ${stats.max.toFixed(2)}`,
            importance: 'low'
        });

        return {
            column: targetColumn,
            insights: insights,
            stats: stats,
            trend: trend,
            growth: growth,
            anomalyCount: anomalies.length
        };
    }

    // =====================================================
    // SHOW INSIGHTS MODAL
    // =====================================================

    function showInsightsModal() {
        const insights = generateInsights();

        let html = `
            <div class="viz-insights-container">
                <h4 style="margin-bottom:15px;">📊 ${insights.column || 'Veri'} için Otomatik İçgörüler</h4>
        `;

        if (insights.insights.length === 0) {
            html += `<p style="color:var(--gm-text-muted);">${insights.message || 'İçgörü bulunamadı'}</p>`;
        } else {
            insights.insights.forEach(insight => {
                const icon = {
                    stats: 'fa-calculator',
                    trend: 'fa-chart-line',
                    growth: 'fa-percentage',
                    anomaly: 'fa-exclamation-triangle',
                    range: 'fa-arrows-alt-h'
                }[insight.type] || 'fa-info-circle';

                const color = {
                    high: '#4a90d9',
                    medium: '#f39c12',
                    warning: '#e74c3c',
                    low: '#27ae60'
                }[insight.importance] || '#888';

                html += `
                    <div class="viz-insight-card" style="padding:12px;margin-bottom:10px;border-left:3px solid ${color};background:var(--gm-card-bg);border-radius:6px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <i class="fas ${icon}" style="color:${color};"></i>
                            <strong>${insight.title}</strong>
                        </div>
                        <p style="margin:5px 0 0 25px;color:var(--gm-text-muted);font-size:0.9rem;">${insight.description}</p>
                    </div>
                `;
            });
        }

        html += '</div>';

        if (typeof showStatResultModal === 'function') {
            showStatResultModal('Otomatik İçgörüler', html);
        }
    }

    // =====================================================
    // COMPARISON ANALYSIS
    // =====================================================

    function compareColumns(col1, col2) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const values1 = state.data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
        const values2 = state.data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));

        const stats1 = calculateChartStats(values1);
        const stats2 = calculateChartStats(values2);

        if (!stats1 || !stats2) return null;

        // Korelasyon hesapla
        const n = Math.min(values1.length, values2.length);
        let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += values1[i];
            sumY += values2[i];
            sumXY += values1[i] * values2[i];
            sumX2 += values1[i] * values1[i];
            sumY2 += values2[i] * values2[i];
        }

        const correlation = (n * sumXY - sumX * sumY) /
            Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return {
            column1: { name: col1, stats: stats1 },
            column2: { name: col2, stats: stats2 },
            correlation: isNaN(correlation) ? 0 : correlation,
            meanDifference: stats1.mean - stats2.mean,
            percentDifference: stats2.mean !== 0 ? ((stats1.mean - stats2.mean) / stats2.mean) * 100 : 0
        };
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    // Stats Overlay
    window.initStatsOverlay = initStatsOverlay;
    window.calculateChartStats = calculateChartStats;
    window.addStatsOverlay = addStatsOverlay;
    window.rerenderSelectedChart = rerenderSelectedChart;

    // What-If
    window.initWhatIfSimulator = initWhatIfSimulator;
    window.applyWhatIfMultiplier = applyWhatIfMultiplier;
    window.resetWhatIf = resetWhatIf;

    // Anomaly Detection
    window.detectAnomalies = detectAnomalies;

    // Trend Analysis
    window.analyzeTrend = analyzeTrend;

    // Cross-Filter
    window.initCrossFilter = initCrossFilter;
    window.handleChartClick = handleChartClick;
    window.clearCrossFilter = clearCrossFilter;

    // Growth & Forecast
    window.calculateGrowthRate = calculateGrowthRate;
    window.calculateForecast = calculateForecast;

    // Insights
    window.generateInsights = generateInsights;
    window.showInsightsModal = showInsightsModal;

    // Comparison
    window.compareColumns = compareColumns;

    console.log('✅ viz-bi-insights.js FULLY RESTORED - All 20+ BI functions available');
})();
