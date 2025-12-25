import { VIZ_STATE } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { getText } from '../core/i18n.js';

// Exports at end

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

    showToast(VIZ_TEXTS[VIZ_STATE.lang].test_completed || 'Test tamamlandÄ±', 'success');
}

function runTTest(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Tek Ã–rnek t-Test';

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (data.length - 1));
    const se = std / Math.sqrt(data.length);
    const t = mean / se;

    // jStat ile p-deÄŸeri
    let pValue = 0.05; // fallback
    if (typeof jStat !== 'undefined') {
        pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), data.length - 1));
    }

    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.5 ? 'viz-p-value viz-significant' : 'viz-p-value';

    // Ekstra istatistikler
    const df = data.length - 1;
    let ciLower = mean, ciUpper = mean;
    if (typeof jStat !== 'undefined') {
        const tCrit = Math.abs(jStat.studentt.inv(0.025, df));
        ciLower = mean - tCrit * se;
        ciUpper = mean + tCrit * se;
    }
    const interpretation = pValue < 0.05 ? 'âœ… Ä°statistiksel olarak anlamlÄ± fark var' : 'âŒ AnlamlÄ± fark yok';

    bodyEl.innerHTML = `
        <div>n = ${data.length}</div>
        <div>Ortalama = ${mean.toFixed(2)}</div>
        <div>Std Sapma = ${std.toFixed(2)}</div>
        <div>t = ${t.toFixed(3)}</div>
        <div>df = ${df}</div>
        <div>GÃ¼ven AralÄ±ÄŸÄ± (95%) = [${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]</div>
        <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${interpretation}</div>
    `;
}

function runANOVA(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Tek YÃ¶nlÃ¼ ANOVA';

    // Veriyi 3 gruba ayÄ±r
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

    // jStat ile p-deÄŸeri
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
        <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? 'âœ… Gruplar arasÄ± fark anlamlÄ±' : 'âŒ AnlamlÄ± fark yok'}</div>
    `;
}

function runCorrelation(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Pearson Korelasyon';

    // Ä°kinci veri seti oluÅŸtur (lag)
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

    const strength = Math.abs(r) > 0.7 ? 'GÃ¼Ã§lÃ¼' : Math.abs(r) > 0.4 ? 'Orta' : 'ZayÄ±f';
    const direction = r > 0 ? 'Pozitif' : 'Negatif';

    bodyEl.innerHTML = `
        <div>r = ${r.toFixed(4)}</div>
        <div>RÂ² = ${(r * r).toFixed(4)}</div>
        <div>Ä°liÅŸki: ${direction} ${strength}</div>
        <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? 'âœ… Korelasyon anlamlÄ±' : 'âŒ AnlamlÄ± deÄŸil'}</div>
    `;
}

function runNormalityTest(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = 'Normallik Testi (Skewness/Kurtosis)';

    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);

    // Skewness (Ã§arpÄ±klÄ±k)
    const skewness = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / n;

    // Kurtosis (basÄ±klÄ±k)
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
        <div>Ã‡arpÄ±klÄ±k (Skewness) = ${skewness.toFixed(3)}</div>
        <div>BasÄ±klÄ±k (Kurtosis) = ${kurtosis.toFixed(3)}</div>
        <div>Jarque-Bera = ${jb.toFixed(3)}</div>
        <div class="${pValue > 0.05 ? 'viz-normal' : 'viz-significant'}">${pValue > 0.05 ? 'âœ… Normal daÄŸÄ±lÄ±m' : 'âš ï¸ Normal deÄŸil'}</div>
    `;
}

export { runStatTest, runTTest, runANOVA, runCorrelation, runNormalityTest, updateRegressionResults };
