import { VIZ_STATE } from '../core/state.js';
import { showToast, formatNumber } from '../core/utils.js';
import { getText } from '../core/i18n.js';
import { runStatTest } from './tests.js';
import { calculateStatistics, calculateTrendLine } from './analysis.js';
import { detectAnomalies } from './anomalies.js';

// Exports at end

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

    // Ortalama Ã‡izgisi
    if (showMean) {
        overlays.markLines.push({
            yAxis: stats.mean,
            name: VIZ_TEXTS[VIZ_STATE.lang].stat_mean,
            lineStyle: { color: '#00d97e', type: 'solid', width: 2 },
            label: { formatter: `Î¼ = ${formatNumber(stats.mean)}`, position: 'end' }
        });
    }

    // Medyan Ã‡izgisi
    if (showMedian) {
        overlays.markLines.push({
            yAxis: stats.median,
            name: VIZ_TEXTS[VIZ_STATE.lang].stat_median,
            lineStyle: { color: '#ffc107', type: 'dashed', width: 2 },
            label: { formatter: `Med = ${formatNumber(stats.median)}`, position: 'end' }
        });
    }

    // Standart Sapma BandÄ± (Â±1Ïƒ)
    if (showStdBand) {
        const upper = stats.mean + stats.stdev;
        const lower = stats.mean - stats.stdev;
        overlays.markAreas.push([{
            yAxis: upper,
            name: '+1Ïƒ',
            itemStyle: { color: 'rgba(74, 144, 217, 0.15)' }
        }, {
            yAxis: lower
        }]);

        // Ãœst ve alt sÄ±nÄ±r Ã§izgileri
        overlays.markLines.push(
            { yAxis: upper, lineStyle: { color: '#4a90d9', type: 'dotted', width: 1 }, label: { show: false } },
            { yAxis: lower, lineStyle: { color: '#4a90d9', type: 'dotted', width: 1 }, label: { show: false } }
        );
    }

    return overlays;
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

    // Sadece bar, line, area grafikler iÃ§in overlay destekle
    const supportedTypes = ['bar', 'line'];
    const seriesType = currentOption.series[0].type;
    if (!supportedTypes.includes(seriesType)) {
        console.log('Bu grafik tipi overlay desteklemiyor:', seriesType);
        return;
    }

    // markLine ve markArea gÃ¼ncelle
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

    // Trend Ã§izgisi iÃ§in ayrÄ± seri ekle
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

// Overlay checkbox deÄŸiÅŸikliklerini dinle
function setupOverlayListeners() {
    const checkboxes = ['showMeanLine', 'showMedianLine', 'showStdBand', 'showTrendLine'];

    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (VIZ_STATE.selectedChart) {
                    const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                    if (config) {
                        // Overlay ayarlarÄ±nÄ± config'e kaydet
                        config.overlays = {
                            showMean: document.getElementById('showMeanLine')?.checked,
                            showMedian: document.getElementById('showMedianLine')?.checked,
                            showStdBand: document.getElementById('showStdBand')?.checked,
                            showTrend: document.getElementById('showTrendLine')?.checked
                        };

                        // GrafiÄŸi yeniden render et
                        renderChart(config);
                    }
                }
            });
        }
    });
}
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

            // SeÃ§ili grafiÄŸi gÃ¼ncelle
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
            showToast(e.target.checked ? 'Cross-filter aktif' : 'Cross-filter kapalÄ±', 'info');
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

    // What-If deÄŸiÅŸikliÄŸi uygula
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
        trendType = 'GÃ¼Ã§lÃ¼ artÄ±ÅŸ trendi';
        trendIcon = 'ğŸ“ˆ';
        trendClass = 'viz-trend-up';
    } else if (changePercent > 0) {
        trendType = 'Hafif artÄ±ÅŸ trendi';
        trendIcon = 'â†—ï¸';
        trendClass = 'viz-trend-up';
    } else if (changePercent < -10) {
        trendType = 'GÃ¼Ã§lÃ¼ dÃ¼ÅŸÃ¼ÅŸ trendi';
        trendIcon = 'ğŸ“‰';
        trendClass = 'viz-trend-down';
    } else if (changePercent < 0) {
        trendType = 'Hafif dÃ¼ÅŸÃ¼ÅŸ trendi';
        trendIcon = 'â†˜ï¸';
        trendClass = 'viz-trend-down';
    } else {
        trendType = 'Stabil';
        trendIcon = 'â¡ï¸';
        trendClass = 'viz-trend-stable';
    }

    trendDiv.style.display = 'flex';
    trendDiv.className = `viz-trend-insight ${trendClass}`;
    trendText.textContent = `${trendIcon} ${trendType} (${changePercent > 0 ? '+' : ''}${changePercent}%)`;
}

// Cross-filter: Bir grafikteki seÃ§im diÄŸerlerini filtreler
function applyCrossFilter(sourceChartId, selectedCategory) {
    if (!VIZ_STATE.crossFilterEnabled) return;

    VIZ_STATE.charts.forEach(config => {
        if (config.id !== sourceChartId) {
            const chart = VIZ_STATE.echartsInstances[config.id];
            if (chart && config.xAxis === VIZ_STATE.charts.find(c => c.id === sourceChartId)?.xAxis) {
                // AynÄ± X ekseni olan grafikleri highlight et
                chart.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    name: selectedCategory
                });
            }
        }
    });
}

export { updateStatsSummary, getStatisticalOverlays, applyStatisticalOverlays, setupOverlayListeners, setupSPSSListeners, setupBIListeners, applyWhatIfChange, updateTrendInsight, applyCrossFilter };
