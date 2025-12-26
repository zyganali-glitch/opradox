/**
 * viz-stats-spss.js
 * SPSS-Style Statistical Tests - FULLY RESTORED
 * t-Test, ANOVA, Correlation, Normality, Chi-Square, Mann-Whitney, Wilcoxon, Kruskal-Wallis, Levene, Effect Size
 */

(function () {
    'use strict';

    // =====================================================
    // SPSS LISTENERS
    // =====================================================

    function setupSPSSListeners() {
        const regressionSelect = document.getElementById('regressionType');
        if (regressionSelect) {
            regressionSelect.addEventListener('change', () => {
                if (typeof VIZ_STATE !== 'undefined' && VIZ_STATE.selectedChart) {
                    const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                    if (config) {
                        config.regressionType = regressionSelect.value;
                        if (typeof renderChart === 'function') renderChart(config);
                        updateRegressionResults(config);
                    }
                }
            });
        }
    }

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
        if (typeof VIZ_STATE !== 'undefined' && VIZ_STATE.data && VIZ_STATE.data.length > 0 && config.xAxis && config.yAxis) {
            const aggregated = typeof aggregateData === 'function'
                ? aggregateData(VIZ_STATE.data, config.xAxis, config.yAxis, config.aggregation)
                : { values: [] };
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
                if (rSquaredEl) rSquaredEl.textContent = result.r2.toFixed(4);
                if (equationEl) equationEl.textContent = result.string;
            }
        } else if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
    }

    // =====================================================
    // CORE STAT TEST DISPATCHER
    // =====================================================

    function runStatTest(testType) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || state.data.length === 0) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const yCol = state.columns.find(c => {
            const info = state.columnsInfo?.find(i => i.name === c);
            return info?.type === 'numeric';
        });

        if (!yCol) {
            if (typeof showToast === 'function') showToast('Sayısal sütun bulunamadı', 'error');
            return;
        }

        const values = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
        const resultsDiv = document.getElementById('testResults');
        const testNameEl = document.getElementById('testName');
        const testPValueEl = document.getElementById('testPValue');
        const testBodyEl = document.getElementById('testResultBody');

        if (!resultsDiv) return;

        resultsDiv.style.display = 'block';

        switch (testType) {
            case 'ttest':
                runTTest(values, testNameEl, testPValueEl, testBodyEl);
                break;
            case 'anova':
                runANOVA(values, testNameEl, testPValueEl, testBodyEl);
                break;
            case 'correlation':
                runCorrelation(values, testNameEl, testPValueEl, testBodyEl);
                break;
            case 'normality':
                runNormalityTest(values, testNameEl, testPValueEl, testBodyEl);
                break;
            case 'chi-square':
                runChiSquare(values, testNameEl, testPValueEl, testBodyEl);
                break;
            case 'descriptive':
                runDescriptive(values, testNameEl, testPValueEl, testBodyEl);
                break;
            default:
                // Backend'e yönlendir
                runBackendStatTest(testType);
                return;
        }

        const lang = state.lang || 'tr';
        const msg = lang === 'en' ? 'Test completed' : 'Test tamamlandı';
        if (typeof showToast === 'function') showToast(msg, 'success');
    }

    // =====================================================
    // PARAMETRIC TESTS
    // =====================================================

    function runTTest(data, nameEl, pEl, bodyEl) {
        // --- DATA ACCESS SAFETY CHECK ---
        if (!data || !Array.isArray(data) || data.length === 0) {
            // Fetch from global VIZ_STATE
            const state = window.VIZ_STATE;
            if (!state || !state.data || state.data.length === 0) {
                if (window.showToast) window.showToast('Lütfen önce veri yükleyin!', 'warning');
                else alert('Lütfen önce veri yükleyin!');
                return;
            }
            // Find first numeric column
            const yCol = (state.columns || []).find(c => {
                const info = (state.columnsInfo || []).find(i => i.name === c);
                return info?.type === 'numeric';
            });
            if (!yCol) {
                if (window.showToast) window.showToast('Sayısal sütun bulunamadı', 'error');
                return;
            }
            data = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
            if (data.length === 0) {
                if (window.showToast) window.showToast('Geçerli sayısal veri bulunamadı', 'error');
                return;
            }
            // Get DOM elements if not provided
            nameEl = nameEl || document.getElementById('testName');
            pEl = pEl || document.getElementById('testPValue');
            bodyEl = bodyEl || document.getElementById('testResultBody');
            const resultsDiv = document.getElementById('testResults');
            if (resultsDiv) resultsDiv.style.display = 'block';
        }

        if (nameEl) nameEl.textContent = 'Tek Örnek t-Test';

        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (data.length - 1));
        const se = std / Math.sqrt(data.length);
        const t = mean / se;

        // jStat ile p-değeri
        let pValue = 0.05; // fallback
        if (typeof jStat !== 'undefined') {
            pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), data.length - 1));
        }

        if (pEl) {
            pEl.textContent = `p = ${pValue.toFixed(4)}`;
            pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';
        }

        // Ekstra istatistikler
        const df = data.length - 1;
        let ciLower = mean, ciUpper = mean;
        if (typeof jStat !== 'undefined') {
            const tCrit = Math.abs(jStat.studentt.inv(0.025, df));
            ciLower = mean - tCrit * se;
            ciUpper = mean + tCrit * se;
        }
        const interpretation = pValue < 0.05 ? '✅ İstatistiksel olarak anlamlı fark var' : '❌ Anlamlı fark yok';

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div>n = ${data.length}</div>
                <div>Ortalama = ${mean.toFixed(2)}</div>
                <div>Std Sapma = ${std.toFixed(2)}</div>
                <div>t = ${t.toFixed(3)}</div>
                <div>df = ${df}</div>
                <div>Güven Aralığı (95%) = [${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]</div>
                <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${interpretation}</div>
            `;
        }

        const lang = window.VIZ_STATE?.lang || 'tr';
        const msg = lang === 'en' ? 't-Test completed' : 't-Test tamamlandı';
        if (typeof showToast === 'function') showToast(msg, 'success');
    }

    function runANOVA(data, nameEl, pEl, bodyEl) {
        // --- DATA ACCESS SAFETY CHECK ---
        if (!data || !Array.isArray(data) || data.length === 0) {
            const state = window.VIZ_STATE;
            if (!state || !state.data || state.data.length === 0) {
                if (window.showToast) window.showToast('Lütfen önce veri yükleyin!', 'warning');
                else alert('Lütfen önce veri yükleyin!');
                return;
            }
            const yCol = (state.columns || []).find(c => {
                const info = (state.columnsInfo || []).find(i => i.name === c);
                return info?.type === 'numeric';
            });
            if (!yCol) {
                if (window.showToast) window.showToast('Sayısal sütun bulunamadı', 'error');
                return;
            }
            data = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
            if (data.length === 0) {
                if (window.showToast) window.showToast('Geçerli sayısal veri bulunamadı', 'error');
                return;
            }
            nameEl = nameEl || document.getElementById('testName');
            pEl = pEl || document.getElementById('testPValue');
            bodyEl = bodyEl || document.getElementById('testResultBody');
            const resultsDiv = document.getElementById('testResults');
            if (resultsDiv) resultsDiv.style.display = 'block';
        }

        if (nameEl) nameEl.textContent = 'Tek Yönlü ANOVA';

        // Veriyi 3 gruba ayır
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

        // jStat ile p-değeri
        let pValue = 0.05;
        if (typeof jStat !== 'undefined') {
            pValue = 1 - jStat.centralF.cdf(f, dfb, dfw);
        }

        if (pEl) {
            pEl.textContent = `p = ${pValue.toFixed(4)}`;
            pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';
        }

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div>Gruplar: ${groups.length}</div>
                <div>F(${dfb}, ${dfw}) = ${f.toFixed(3)}</div>
                <div>MSB = ${msb.toFixed(2)}, MSW = ${msw.toFixed(2)}</div>
                <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? '✅ Gruplar arası fark anlamlı' : '❌ Anlamlı fark yok'}</div>
            `;
        }
    }

    function runCorrelation(data, nameEl, pEl, bodyEl) {
        // --- DATA ACCESS SAFETY CHECK ---
        if (!data || !Array.isArray(data) || data.length === 0) {
            const state = window.VIZ_STATE;
            if (!state || !state.data || state.data.length === 0) {
                if (window.showToast) window.showToast('Lütfen önce veri yükleyin!', 'warning');
                else alert('Lütfen önce veri yükleyin!');
                return;
            }
            const yCol = (state.columns || []).find(c => {
                const info = (state.columnsInfo || []).find(i => i.name === c);
                return info?.type === 'numeric';
            });
            if (!yCol) {
                if (window.showToast) window.showToast('Sayısal sütun bulunamadı', 'error');
                return;
            }
            data = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
            if (data.length < 2) {
                if (window.showToast) window.showToast('Korelasyon için en az 2 değer gerekli', 'error');
                return;
            }
            nameEl = nameEl || document.getElementById('testName');
            pEl = pEl || document.getElementById('testPValue');
            bodyEl = bodyEl || document.getElementById('testResultBody');
            const resultsDiv = document.getElementById('testResults');
            if (resultsDiv) resultsDiv.style.display = 'block';
        }

        if (nameEl) nameEl.textContent = 'Pearson Korelasyon';

        // İkinci veri seti oluştur (lag)
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

        if (pEl) {
            pEl.textContent = `p = ${pValue.toFixed(4)}`;
            pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';
        }

        const strength = Math.abs(r) > 0.7 ? 'Güçlü' : Math.abs(r) > 0.4 ? 'Orta' : 'Zayıf';
        const direction = r > 0 ? 'Pozitif' : 'Negatif';

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div>r = ${r.toFixed(4)}</div>
                <div>R² = ${(r * r).toFixed(4)}</div>
                <div>İlişki: ${direction} ${strength}</div>
                <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? '✅ Korelasyon anlamlı' : '❌ Anlamlı değil'}</div>
            `;
        }
    }

    function runNormalityTest(data, nameEl, pEl, bodyEl) {
        // --- DATA ACCESS SAFETY CHECK ---
        if (!data || !Array.isArray(data) || data.length === 0) {
            const state = window.VIZ_STATE;
            if (!state || !state.data || state.data.length === 0) {
                if (window.showToast) window.showToast('Lütfen önce veri yükleyin!', 'warning');
                else alert('Lütfen önce veri yükleyin!');
                return;
            }
            const yCol = (state.columns || []).find(c => {
                const info = (state.columnsInfo || []).find(i => i.name === c);
                return info?.type === 'numeric';
            });
            if (!yCol) {
                if (window.showToast) window.showToast('Sayısal sütun bulunamadı', 'error');
                return;
            }
            data = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
            if (data.length === 0) {
                if (window.showToast) window.showToast('Geçerli sayısal veri bulunamadı', 'error');
                return;
            }
            nameEl = nameEl || document.getElementById('testName');
            pEl = pEl || document.getElementById('testPValue');
            bodyEl = bodyEl || document.getElementById('testResultBody');
            const resultsDiv = document.getElementById('testResults');
            if (resultsDiv) resultsDiv.style.display = 'block';
        }

        if (nameEl) nameEl.textContent = 'Normallik Testi (Skewness/Kurtosis)';

        const n = data.length;
        const mean = data.reduce((a, b) => a + b, 0) / n;
        const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);

        // Skewness (çarpıklık)
        const skewness = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / n;

        // Kurtosis (basıklık)
        const kurtosis = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0) / n - 3;

        // Jarque-Bera testi
        const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);

        let pValue = 0.05;
        if (typeof jStat !== 'undefined') {
            pValue = 1 - jStat.chisquare.cdf(jb, 2);
        }

        if (pEl) {
            pEl.textContent = `p = ${pValue.toFixed(4)}`;
            pEl.className = pValue > 0.05 ? 'viz-p-value viz-normal' : 'viz-p-value viz-significant';
        }

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div>Çarpıklık (Skewness) = ${skewness.toFixed(3)}</div>
                <div>Basıklık (Kurtosis) = ${kurtosis.toFixed(3)}</div>
                <div>Jarque-Bera = ${jb.toFixed(3)}</div>
                <div class="${pValue > 0.05 ? 'viz-normal' : 'viz-significant'}">${pValue > 0.05 ? '✅ Normal dağılım' : '⚠️ Normal değil'}</div>
            `;
        }
    }

    // =====================================================
    // CHI-SQUARE TEST
    // =====================================================

    function runChiSquare(data, nameEl, pEl, bodyEl) {
        // --- DATA ACCESS SAFETY CHECK ---
        if (!data || !Array.isArray(data) || data.length === 0) {
            const state = window.VIZ_STATE;
            if (!state || !state.data || state.data.length === 0) {
                if (window.showToast) window.showToast('Lütfen önce veri yükleyin!', 'warning');
                else alert('Lütfen önce veri yükleyin!');
                return;
            }
            const yCol = (state.columns || []).find(c => {
                const info = (state.columnsInfo || []).find(i => i.name === c);
                return info?.type === 'numeric';
            });
            if (!yCol) {
                if (window.showToast) window.showToast('Sayısal sütun bulunamadı', 'error');
                return;
            }
            data = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
            if (data.length === 0) {
                if (window.showToast) window.showToast('Geçerli sayısal veri bulunamadı', 'error');
                return;
            }
            nameEl = nameEl || document.getElementById('testName');
            pEl = pEl || document.getElementById('testPValue');
            bodyEl = bodyEl || document.getElementById('testResultBody');
            const resultsDiv = document.getElementById('testResults');
            if (resultsDiv) resultsDiv.style.display = 'block';
        }

        if (nameEl) nameEl.textContent = 'Ki-Kare Testi';

        // Frekans tablosu oluştur (binning)
        const binCount = Math.min(5, Math.ceil(Math.sqrt(data.length)));
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / binCount;

        const observed = new Array(binCount).fill(0);
        data.forEach(v => {
            let bin = Math.floor((v - min) / binWidth);
            if (bin >= binCount) bin = binCount - 1;
            observed[bin]++;
        });

        const expected = data.length / binCount;
        let chiSquare = 0;
        observed.forEach(o => {
            chiSquare += Math.pow(o - expected, 2) / expected;
        });

        const df = binCount - 1;
        let pValue = 0.05;
        if (typeof jStat !== 'undefined') {
            pValue = 1 - jStat.chisquare.cdf(chiSquare, df);
        }

        if (pEl) {
            pEl.textContent = `p = ${pValue.toFixed(4)}`;
            pEl.className = pValue < 0.05 ? 'viz-p-value viz-significant' : 'viz-p-value';
        }

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div>χ² = ${chiSquare.toFixed(3)}</div>
                <div>df = ${df}</div>
                <div>Gözlenen: [${observed.join(', ')}]</div>
                <div>Beklenen: ${expected.toFixed(1)} (her bin)</div>
                <div class="${pValue < 0.05 ? 'viz-significant' : ''}">${pValue < 0.05 ? '✅ Dağılımlar farklı' : '❌ Dağılımlar benzer'}</div>
            `;
        }
    }

    // =====================================================
    // DESCRIPTIVE STATISTICS
    // =====================================================

    function runDescriptive(data, nameEl, pEl, bodyEl) {
        // --- DATA ACCESS SAFETY CHECK ---
        if (!data || !Array.isArray(data) || data.length === 0) {
            const state = window.VIZ_STATE;
            if (!state || !state.data || state.data.length === 0) {
                if (window.showToast) window.showToast('Lütfen önce veri yükleyin!', 'warning');
                else alert('Lütfen önce veri yükleyin!');
                return;
            }
            const yCol = (state.columns || []).find(c => {
                const info = (state.columnsInfo || []).find(i => i.name === c);
                return info?.type === 'numeric';
            });
            if (!yCol) {
                if (window.showToast) window.showToast('Sayısal sütun bulunamadı', 'error');
                return;
            }
            data = state.data.map(row => parseFloat(row[yCol])).filter(v => !isNaN(v));
            if (data.length === 0) {
                if (window.showToast) window.showToast('Geçerli sayısal veri bulunamadı', 'error');
                return;
            }
            nameEl = nameEl || document.getElementById('testName');
            pEl = pEl || document.getElementById('testPValue');
            bodyEl = bodyEl || document.getElementById('testResultBody');
            const resultsDiv = document.getElementById('testResults');
            if (resultsDiv) resultsDiv.style.display = 'block';
        }

        if (nameEl) nameEl.textContent = 'Betimsel İstatistik';
        if (pEl) pEl.textContent = '';

        const n = data.length;
        const mean = data.reduce((a, b) => a + b, 0) / n;
        const sortedData = [...data].sort((a, b) => a - b);
        const median = n % 2 === 0
            ? (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2
            : sortedData[Math.floor(n / 2)];
        const min = sortedData[0];
        const max = sortedData[n - 1];
        const range = max - min;
        const variance = data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
        const std = Math.sqrt(variance);
        const se = std / Math.sqrt(n);
        const q1 = sortedData[Math.floor(n * 0.25)];
        const q3 = sortedData[Math.floor(n * 0.75)];
        const iqr = q3 - q1;

        // Çarpıklık ve basıklık
        const skewness = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / n;
        const kurtosis = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0) / n - 3;

        if (bodyEl) {
            bodyEl.innerHTML = `
                <table class="viz-stats-table">
                    <tr><th>N</th><td>${n}</td></tr>
                    <tr><th>Ortalama</th><td>${mean.toFixed(4)}</td></tr>
                    <tr><th>Medyan</th><td>${median.toFixed(4)}</td></tr>
                    <tr><th>Std Sapma</th><td>${std.toFixed(4)}</td></tr>
                    <tr><th>Varyans</th><td>${variance.toFixed(4)}</td></tr>
                    <tr><th>Std Hata</th><td>${se.toFixed(4)}</td></tr>
                    <tr><th>Min</th><td>${min.toFixed(4)}</td></tr>
                    <tr><th>Max</th><td>${max.toFixed(4)}</td></tr>
                    <tr><th>Aralık</th><td>${range.toFixed(4)}</td></tr>
                    <tr><th>Q1</th><td>${q1.toFixed(4)}</td></tr>
                    <tr><th>Q3</th><td>${q3.toFixed(4)}</td></tr>
                    <tr><th>IQR</th><td>${iqr.toFixed(4)}</td></tr>
                    <tr><th>Çarpıklık</th><td>${skewness.toFixed(4)}</td></tr>
                    <tr><th>Basıklık</th><td>${kurtosis.toFixed(4)}</td></tr>
                </table>
            `;
        }
    }

    // =====================================================
    // INDEPENDENT SAMPLES T-TEST
    // =====================================================

    function independentTTest(group1, group2) {
        const n1 = group1.length;
        const n2 = group2.length;
        const mean1 = group1.reduce((a, b) => a + b, 0) / n1;
        const mean2 = group2.reduce((a, b) => a + b, 0) / n2;
        const var1 = group1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / (n1 - 1);
        const var2 = group2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / (n2 - 1);

        // Pooled variance
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
        const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
        const t = (mean1 - mean2) / se;
        const df = n1 + n2 - 2;

        let pValue = 0.05;
        if (typeof jStat !== 'undefined') {
            pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
        }

        return {
            t: t,
            df: df,
            pValue: pValue,
            mean1: mean1,
            mean2: mean2,
            std1: Math.sqrt(var1),
            std2: Math.sqrt(var2),
            significant: pValue < 0.05
        };
    }

    // =====================================================
    // EFFECT SIZE (Cohen's d)
    // =====================================================

    function cohensD(group1, group2) {
        const n1 = group1.length;
        const n2 = group2.length;
        const mean1 = group1.reduce((a, b) => a + b, 0) / n1;
        const mean2 = group2.reduce((a, b) => a + b, 0) / n2;
        const var1 = group1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / (n1 - 1);
        const var2 = group2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / (n2 - 1);

        // Pooled std
        const pooledStd = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
        const d = (mean1 - mean2) / pooledStd;

        let interpretation = '';
        const absD = Math.abs(d);
        if (absD < 0.2) interpretation = 'Küçük olmayan etki';
        else if (absD < 0.5) interpretation = 'Küçük etki';
        else if (absD < 0.8) interpretation = 'Orta etki';
        else interpretation = 'Büyük etki';

        return {
            d: d,
            interpretation: interpretation
        };
    }

    // =====================================================
    // BACKEND API CALLS
    // =====================================================

    async function callSpssApi(endpoint, formData) {
        try {
            const response = await fetch(`/viz/${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'API hatası');
            }

            return await response.json();
        } catch (error) {
            console.error(`SPSS API hatası (${endpoint}):`, error);
            if (typeof showToast === 'function') showToast(`Hata: ${error.message}`, 'error');
            return null;
        }
    }

    async function runBackendStatTest(testType) {
        const state = window.VIZ_STATE;
        if (!state || !state.file) {
            if (typeof showToast === 'function') showToast('Önce dosya yükleyin', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', state.file);

        // Sayısal sütunları bul
        const numericCols = (state.columnsInfo || [])
            .filter(c => c.type === 'numeric')
            .map(c => c.name);

        if (numericCols.length < 1) {
            if (typeof showToast === 'function') showToast('Sayısal sütun bulunamadı', 'error');
            return;
        }

        let result = null;

        switch (testType) {
            case 'ttest':
                formData.append('column1', numericCols[0]);
                if (numericCols.length > 1) {
                    formData.append('column2', numericCols[1]);
                    formData.append('test_type', 'independent');
                } else {
                    formData.append('test_type', 'one-sample');
                    formData.append('mu', '0');
                }
                result = await callSpssApi('ttest', formData);
                break;

            case 'anova':
                const catCol = (state.columnsInfo || []).find(c => c.type === 'text')?.name;
                if (!catCol) {
                    if (typeof showToast === 'function') showToast('Grup sütunu bulunamadı', 'error');
                    return;
                }
                formData.append('value_column', numericCols[0]);
                formData.append('group_column', catCol);
                result = await callSpssApi('anova', formData);
                break;

            case 'normality':
                formData.append('column', numericCols[0]);
                formData.append('test_type', 'shapiro');
                result = await callSpssApi('normality', formData);
                break;

            case 'correlation':
                if (numericCols.length < 2) {
                    if (typeof showToast === 'function') showToast('En az 2 sayısal sütun gerekli', 'error');
                    return;
                }
                formData.append('columns', JSON.stringify(numericCols.slice(0, 5)));
                formData.append('method', 'pearson');
                result = await callSpssApi('correlation-matrix', formData);
                break;

            case 'descriptive':
                formData.append('columns', JSON.stringify(numericCols.slice(0, 5)));
                result = await callSpssApi('descriptive', formData);
                break;

            case 'frequency':
                formData.append('column', state.columns[0]);
                result = await callSpssApi('frequency', formData);
                break;

            // Non-Parametrik Testler
            case 'chi-square':
                const textCols = (state.columnsInfo || []).filter(c => c.type === 'text').map(c => c.name);
                if (textCols.length < 2) {
                    if (typeof showToast === 'function') showToast('Ki-Kare için en az 2 kategorik sütun gerekli', 'error');
                    return;
                }
                formData.append('column1', textCols[0]);
                formData.append('column2', textCols[1]);
                result = await callSpssApi('chi-square', formData);
                break;

            case 'mann-whitney':
                if (numericCols.length < 2) {
                    if (typeof showToast === 'function') showToast('Mann-Whitney için en az 2 sayısal sütun gerekli', 'error');
                    return;
                }
                formData.append('column1', numericCols[0]);
                formData.append('column2', numericCols[1]);
                result = await callSpssApi('mann-whitney', formData);
                break;

            case 'wilcoxon':
                if (numericCols.length < 2) {
                    if (typeof showToast === 'function') showToast('Wilcoxon için en az 2 sayısal sütun gerekli', 'error');
                    return;
                }
                formData.append('column1', numericCols[0]);
                formData.append('column2', numericCols[1]);
                result = await callSpssApi('wilcoxon', formData);
                break;

            case 'kruskal-wallis':
            case 'kruskal':
                const kruskalCatCol = (state.columnsInfo || []).find(c => c.type === 'text')?.name;
                if (!kruskalCatCol) {
                    if (typeof showToast === 'function') showToast('Grup sütunu bulunamadı', 'error');
                    return;
                }
                formData.append('value_column', numericCols[0]);
                formData.append('group_column', kruskalCatCol);
                result = await callSpssApi('kruskal-wallis', formData);
                break;

            case 'levene':
                const leveneCatCol = (state.columnsInfo || []).find(c => c.type === 'text')?.name;
                if (!leveneCatCol) {
                    if (typeof showToast === 'function') showToast('Grup sütunu bulunamadı', 'error');
                    return;
                }
                formData.append('value_column', numericCols[0]);
                formData.append('group_column', leveneCatCol);
                result = await callSpssApi('levene', formData);
                break;

            case 'effect-size':
                if (numericCols.length < 2) {
                    if (typeof showToast === 'function') showToast('Effect Size için en az 2 sayısal sütun gerekli', 'error');
                    return;
                }
                formData.append('column1', numericCols[0]);
                formData.append('column2', numericCols[1]);
                formData.append('effect_type', 'cohens_d');
                result = await callSpssApi('effect-size', formData);
                break;
        }

        if (result) {
            displayStatResult(testType, result);
            if (typeof showToast === 'function') showToast(`${testType.toUpperCase()} analizi tamamlandı`, 'success');
        }
    }

    // =====================================================
    // DISPLAY STAT RESULT
    // =====================================================

    function displayStatResult(testType, result) {
        const resultsDiv = document.getElementById('testResults');
        const testNameEl = document.getElementById('testName');
        const testPValueEl = document.getElementById('testPValue');
        const testBodyEl = document.getElementById('testResultBody');

        if (!resultsDiv) return;

        resultsDiv.style.display = 'block';

        if (result.test) {
            if (testNameEl) testNameEl.textContent = result.test;
        } else if (testType === 'descriptive') {
            if (testNameEl) testNameEl.textContent = 'Betimsel İstatistik';
        } else if (testType === 'correlation') {
            if (testNameEl) testNameEl.textContent = `Korelasyon Matrisi (${result.method || 'pearson'})`;
        } else if (testType === 'frequency') {
            if (testNameEl) testNameEl.textContent = 'Frekans Tablosu';
        }

        if (result.p_value !== undefined && testPValueEl) {
            const isSignificant = result.p_value < 0.05;
            testPValueEl.textContent = `p = ${result.p_value}`;
            testPValueEl.className = `viz-p-value ${isSignificant ? 'viz-significant' : 'viz-normal'}`;
        } else if (testPValueEl) {
            testPValueEl.textContent = '';
        }

        // Sonuç içeriği
        let html = '';

        if (result.interpretation) {
            html += `<div class="viz-interpretation">${result.interpretation}</div>`;
        }

        if (result.descriptive) {
            // Betimsel istatistik tablosu
            html += '<table class="viz-stats-table"><thead><tr><th>Sütun</th><th>N</th><th>Ortalama</th><th>Std</th><th>Min</th><th>Max</th></tr></thead><tbody>';
            for (const [col, stats] of Object.entries(result.descriptive)) {
                html += `<tr><td>${col}</td><td>${stats.n}</td><td>${stats.mean}</td><td>${stats.std}</td><td>${stats.min}</td><td>${stats.max}</td></tr>`;
            }
            html += '</tbody></table>';
        }

        if (result.correlation) {
            html += '<div class="viz-correlation-hint">Heatmap için grafiğe sürükleyin</div>';
        }

        if (result.table) {
            // Frekans tablosu
            html += '<table class="viz-stats-table"><thead><tr><th>Değer</th><th>Frekans</th><th>%</th></tr></thead><tbody>';
            result.table.slice(0, 10).forEach(row => {
                html += `<tr><td>${row.value}</td><td>${row.frequency}</td><td>${row.percent}%</td></tr>`;
            });
            html += '</tbody></table>';
        }

        if (result.group_stats) {
            // ANOVA grup istatistikleri
            html += '<div class="viz-group-stats">';
            result.group_stats.forEach(g => {
                html += `<span class="viz-group-item">${g.group}: μ=${g.mean} (n=${g.n})</span>`;
            });
            html += '</div>';
        }

        if (testBodyEl) testBodyEl.innerHTML = html;
    }

    // =====================================================
    // STAT RESULT MODAL (for showing results in popup)
    // =====================================================

    function showStatResultModal(testType, data) {
        let modal = document.querySelector('.viz-stat-result-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'viz-stat-result-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100003;';
            modal.innerHTML = `
                <div style="background:var(--gm-card-bg, #1e1e1e);border-radius:12px;max-width:600px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid var(--gm-card-border, #333);">
                        <h3 id="statModalTitle" style="margin:0;font-size:1rem;"></h3>
                        <button onclick="this.closest('.viz-stat-result-modal').style.display='none'" style="background:none;border:none;color:var(--gm-text-muted, #888);font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    <div id="statModalContent" style="padding:20px;overflow-y:auto;"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const titleEl = document.getElementById('statModalTitle');
        const contentEl = document.getElementById('statModalContent');

        if (titleEl) titleEl.textContent = testType;
        if (contentEl) contentEl.innerHTML = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        modal.style.display = 'flex';
    }

    function closeStatResultModal() {
        const modal = document.querySelector('.viz-stat-result-modal');
        if (modal) modal.style.display = 'none';
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            setupSPSSListeners();
            console.log('✅ viz-stats-spss.js: SPSS Listeners initialized');
        }, 500);
    });

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.setupSPSSListeners = setupSPSSListeners;
    window.updateRegressionResults = updateRegressionResults;
    window.runStatTest = runStatTest;
    window.runTTest = runTTest;
    window.runANOVA = runANOVA;
    window.runCorrelation = runCorrelation;
    window.runNormalityTest = runNormalityTest;
    window.runChiSquare = runChiSquare;
    window.runDescriptive = runDescriptive;
    window.independentTTest = independentTTest;
    window.cohensD = cohensD;
    window.callSpssApi = callSpssApi;
    window.runBackendStatTest = runBackendStatTest;
    window.displayStatResult = displayStatResult;
    window.showStatResultModal = showStatResultModal;
    window.closeStatResultModal = closeStatResultModal;

    console.log('✅ viz-stats-spss.js FULLY RESTORED - All SPSS functions available');
})();
