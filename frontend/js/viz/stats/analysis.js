import { showToast } from '../core/utils.js';

// Exports at end

function calculateStatistics(values) {
    if (!values || values.length === 0) return null;

    // simple-statistics kÃ¼tÃ¼phanesi var mÄ± kontrol
    if (typeof ss === 'undefined') {
        console.warn('simple-statistics kÃ¼tÃ¼phanesi yÃ¼klenemedi, fallback hesaplama kullanÄ±lÄ±yor');
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
        console.error('Ä°statistik hesaplama hatasÄ±:', e);
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
            console.error('Trend Ã§izgisi hesaplama hatasÄ±:', e);
        }
    }

    // Fallback: Basit doÄŸrusal regresyon
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

export { calculateStatistics, calculateStatsFallback, calculateTrendLine };
