/**
 * viz-stats-core.js
 * Complete Stat Widget Core Functions
 * Ported from legacy viz.js lines: 13653, 8926, 14607, 15403, 5338
 */

(function () {
    'use strict';

    // =====================================================
    // STAT TYPE TITLES (viz.js line 13653)
    // =====================================================

    function getStatTitle(statType) {
        const titles = {
            'ttest': 't-Test Analizi',
            'anova': 'ANOVA Analizi',
            'chi-square': 'Ki-Kare Testi',
            'correlation': 'Korelasyon Matrisi',
            'normality': 'Normallik Testi',
            'descriptive': 'Betimsel İstatistik',
            'mann-whitney': 'Mann-Whitney U',
            'wilcoxon': 'Wilcoxon Testi',
            'kruskal': 'Kruskal-Wallis',
            'levene': 'Levene Testi',
            'effect-size': 'Etki Büyüklüğü',
            'frequency': 'Frekans Analizi',
            'pca': 'PCA Analizi',
            'kmeans': 'K-Means Kümeleme',
            'cronbach': 'Cronbach Alpha',
            'logistic': 'Lojistik Regresyon',
            'timeseries': 'Zaman Serisi',
            'apa': 'APA Raporu',
            'friedman': 'Friedman Testi',
            'power': 'Güç Analizi',
            'regression-coef': 'Regresyon Katsayıları',
            'discriminant': 'Diskriminant Analizi',
            'survival': 'Sağkalım Analizi'
        };
        return titles[statType] || `${statType} Analizi`;
    }

    // =====================================================
    // ANALYSIS REQUIREMENTS - UI TYPES (viz.js line 13600+)
    // =====================================================

    /**
     * UI TİPLERİ:
     * - TYPE_A: 2 Grup Seçimi (t-Test, Mann-Whitney, Effect-Size)
     * - TYPE_B: Çoklu Sayısal Sütun (Correlation, PCA, Cronbach, K-Means)
     * - TYPE_C: 2 Sütun Eşleştirme (Wilcoxon Paired)
     * - TYPE_D: Binary Hedef + Predictorlar (Logistic Regression)
     * - TYPE_E: Tek Sütun (Normality, Frequency, Descriptive)
     * - TYPE_F: Tarih + Değer (Time Series)
     * - TYPE_G: Grup + Değer - Tüm gruplar (ANOVA, Kruskal-Wallis, Levene)
     * - TYPE_H: İki Kategorik Sütun (Chi-Square)
     */
    function getAnalysisRequirements(statType) {
        const requirements = {
            // TYPE_A: 2 Grup Seçimi
            'ttest': {
                uiType: 'TYPE_A',
                needsX: true,
                needsY: true,
                needsGroupSelection: true,
                xColumnType: 'categorical',
                yColumnType: 'numeric',
                groupCount: 2,
                description: 'X: kategorik grup sütunu, Y: sayısal. İki grup seçip ortalamalarını karşılaştırır.',
                descriptionEn: 'X: categorical group, Y: numeric. Compares means of two groups.'
            },
            'mann-whitney': {
                uiType: 'TYPE_A',
                needsX: true,
                needsY: true,
                needsGroupSelection: true,
                xColumnType: 'categorical',
                yColumnType: 'numeric',
                groupCount: 2,
                description: 'X: kategorik grup sütunu, Y: sayısal. İki grup seçip medyanlarını karşılaştırır (non-parametrik).',
                descriptionEn: 'X: categorical group, Y: numeric. Compares medians of two groups (non-parametric).'
            },
            'effect-size': {
                uiType: 'TYPE_A',
                needsX: true,
                needsY: true,
                needsGroupSelection: true,
                xColumnType: 'categorical',
                yColumnType: 'numeric',
                groupCount: 2,
                description: 'X: kategorik grup sütunu, Y: sayısal. Cohen\'s d etki büyüklüğü.',
                descriptionEn: 'X: categorical group, Y: numeric. Cohen\'s d effect size.'
            },

            // TYPE_B: Çoklu Sayısal Sütun
            'correlation': {
                uiType: 'TYPE_B',
                needsX: false,
                needsY: false,
                minColumns: 2,
                maxColumns: 10,
                columnTypes: ['numeric'],
                description: 'En az 2 sayısal sütun seçin. Pearson korelasyon matrisi.',
                descriptionEn: 'Select at least 2 numeric columns. Pearson correlation matrix.'
            },
            'pca': {
                uiType: 'TYPE_B',
                needsX: false,
                needsY: false,
                minColumns: 2,
                maxColumns: 10,
                columnTypes: ['numeric'],
                description: 'En az 2 sayısal sütun seçin. Principal Component Analysis.',
                descriptionEn: 'Select at least 2 numeric columns. Principal Component Analysis.'
            },
            'cronbach': {
                uiType: 'TYPE_B',
                needsX: false,
                needsY: false,
                minColumns: 2,
                maxColumns: 20,
                columnTypes: ['numeric'],
                description: 'En az 2 sayısal sütun seçin. Güvenilirlik analizi.',
                descriptionEn: 'Select at least 2 numeric columns. Reliability analysis.'
            },
            'kmeans': {
                uiType: 'TYPE_B',
                needsX: false,
                needsY: false,
                minColumns: 2,
                maxColumns: 10,
                columnTypes: ['numeric'],
                extraParams: ['k'],
                defaultK: 3,
                description: 'En az 2 sayısal sütun seçin. K-Means kümeleme.',
                descriptionEn: 'Select at least 2 numeric columns. K-Means clustering.'
            },
            'friedman': {
                uiType: 'TYPE_B',
                needsX: false,
                needsY: false,
                minColumns: 3,
                maxColumns: 10,
                columnTypes: ['numeric'],
                description: 'En az 3 sayısal sütun seçin (tekrarlı ölçümler).',
                descriptionEn: 'Select at least 3 numeric columns (repeated measures).'
            },

            // TYPE_C: 2 Sütun Eşleştirme
            'wilcoxon': {
                uiType: 'TYPE_C',
                needsX: true,
                needsY: true,
                xColumnType: 'numeric',
                yColumnType: 'numeric',
                description: 'İki eşleştirilmiş sayısal sütun seçin (öncesi/sonrası).',
                descriptionEn: 'Select two paired numeric columns (before/after).'
            },

            // TYPE_D: Binary Hedef + Predictorlar
            'logistic': {
                uiType: 'TYPE_D',
                needsTarget: true,
                needsPredictors: true,
                targetType: 'binary',
                predictorTypes: ['numeric'],
                description: 'Hedef: 0/1 kategorik, Predictorlar: sayısal sütunlar.',
                descriptionEn: 'Target: 0/1 categorical, Predictors: numeric columns.'
            },
            'discriminant': {
                uiType: 'TYPE_D',
                needsTarget: true,
                needsPredictors: true,
                targetType: 'categorical',
                predictorTypes: ['numeric'],
                description: 'Hedef: kategorik grup, Predictorlar: sayısal sütunlar.',
                descriptionEn: 'Target: categorical group, Predictors: numeric columns.'
            },

            // TYPE_E: Tek Sütun
            'normality': {
                uiType: 'TYPE_E',
                needsX: false,
                needsY: true,
                yColumnType: 'numeric',
                description: 'Tek sayısal sütun seçin. Shapiro-Wilk testi.',
                descriptionEn: 'Select a single numeric column. Shapiro-Wilk test.'
            },
            'frequency': {
                uiType: 'TYPE_E',
                needsX: true,
                needsY: false,
                columnTypes: ['categorical', 'numeric'],
                description: 'Tek sütun seçin. Frekans tablosu.',
                descriptionEn: 'Select a single column. Frequency table.'
            },
            'descriptive': {
                uiType: 'TYPE_E',
                needsX: false,
                needsY: true,
                yColumnType: 'numeric',
                description: 'Tek sayısal sütun seçin. Betimsel istatistikler.',
                descriptionEn: 'Select a single numeric column. Descriptive statistics.'
            },
            'power': {
                uiType: 'TYPE_E',
                needsX: false,
                needsY: true,
                yColumnType: 'numeric',
                extraParams: ['effectSize', 'alpha'],
                description: 'Güç analizi için etki büyüklüğü ve alfa girin.',
                descriptionEn: 'Enter effect size and alpha for power analysis.'
            },
            'apa': {
                uiType: 'TYPE_E',
                needsX: false,
                needsY: true,
                columnTypes: ['numeric'],
                description: 'Sayısal sütun seçin. APA formatında rapor.',
                descriptionEn: 'Select numeric column. APA format report.'
            },

            // TYPE_F: Tarih + Değer
            'timeseries': {
                uiType: 'TYPE_F',
                needsX: true,
                needsY: true,
                xColumnType: 'date',
                yColumnType: 'numeric',
                description: 'X: tarih sütunu, Y: sayısal. Zaman serisi analizi.',
                descriptionEn: 'X: date column, Y: numeric. Time series analysis.'
            },
            'survival': {
                uiType: 'TYPE_F',
                needsX: true,
                needsY: true,
                xColumnType: 'numeric',
                yColumnType: 'numeric',
                description: 'X: süre, Y: event (0/1). Kaplan-Meier analizi.',
                descriptionEn: 'X: duration, Y: event (0/1). Kaplan-Meier analysis.'
            },

            // TYPE_G: Grup + Değer - Tüm gruplar
            'anova': {
                uiType: 'TYPE_G',
                needsX: true,
                needsY: true,
                xColumnType: 'categorical',
                yColumnType: 'numeric',
                description: 'X: grup sütunu, Y: sayısal. Tüm gruplar karşılaştırılır.',
                descriptionEn: 'X: group column, Y: numeric. All groups compared.'
            },
            'kruskal': {
                uiType: 'TYPE_G',
                needsX: true,
                needsY: true,
                xColumnType: 'categorical',
                yColumnType: 'numeric',
                description: 'X: grup sütunu, Y: sayısal. Non-parametrik ANOVA.',
                descriptionEn: 'X: group column, Y: numeric. Non-parametric ANOVA.'
            },
            'levene': {
                uiType: 'TYPE_G',
                needsX: true,
                needsY: true,
                xColumnType: 'categorical',
                yColumnType: 'numeric',
                description: 'X: grup sütunu, Y: sayısal. Varyans homojenliği testi.',
                descriptionEn: 'X: group column, Y: numeric. Variance homogeneity test.'
            },

            // TYPE_H: İki Kategorik/Sayısal Sütun
            'chi-square': {
                uiType: 'TYPE_H',
                needsX: true,
                needsY: true,
                xColumnType: 'categorical',
                yColumnType: 'categorical',
                description: 'İki kategorik sütun seçin.',
                descriptionEn: 'Select two categorical columns.'
            },
            'regression-coef': {
                uiType: 'TYPE_H',
                needsX: true,
                needsY: true,
                xColumnType: 'numeric',
                yColumnType: 'numeric',
                description: 'X: bağımsız değişken, Y: bağımlı değişken.',
                descriptionEn: 'X: independent variable, Y: dependent variable.'
            }
        };

        return requirements[statType] || {
            uiType: 'TYPE_E',
            needsX: true,
            needsY: true,
            description: 'Analiz için sütunları seçin.'
        };
    }

    // =====================================================
    // API ENDPOINTS (viz.js line 14607)
    // =====================================================

    function getStatEndpoints() {
        const API_BASE = window.API_BASE || 'http://localhost:8100';
        return {
            'descriptive': `${API_BASE}/viz/descriptive`,
            'ttest': `${API_BASE}/viz/ttest`,
            'anova': `${API_BASE}/viz/anova`,
            'chi-square': `${API_BASE}/viz/chi-square`,
            'correlation': `${API_BASE}/viz/correlation-matrix`,
            'normality': `${API_BASE}/viz/normality`,
            'mann-whitney': `${API_BASE}/viz/mann-whitney`,
            'wilcoxon': `${API_BASE}/viz/wilcoxon`,
            'kruskal': `${API_BASE}/viz/kruskal-wallis`,
            'levene': `${API_BASE}/viz/levene`,
            'effect-size': `${API_BASE}/viz/effect-size`,
            'frequency': `${API_BASE}/viz/frequency`,
            'regression-coef': `${API_BASE}/viz/regression`,
            'logistic': `${API_BASE}/viz/regression`,
            'pca': `${API_BASE}/viz/pca`,
            'kmeans': `${API_BASE}/viz/kmeans`,
            'cronbach': `${API_BASE}/viz/cronbach`,
            'friedman': `${API_BASE}/viz/friedman`,
            'lda': `${API_BASE}/viz/lda`,
            'discriminant': `${API_BASE}/viz/lda`,
            'survival': `${API_BASE}/viz/survival`,
            'smart-insights': `${API_BASE}/viz/smart-insights`,
            'apa': `${API_BASE}/viz/apa-report`,
            'power': `${API_BASE}/viz/power-analysis`,
            'timeseries': `${API_BASE}/viz/time-series`
        };
    }

    // =====================================================
    // FORMULAS (viz.js line 15403)
    // =====================================================

    function getFormulaForTest(statType) {
        const formulas = {
            'ttest': '\\( t = \\frac{\\bar{X}_1 - \\bar{X}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}} \\)',
            'anova': '\\( F = \\frac{MS_{between}}{MS_{within}} = \\frac{\\sum n_i(\\bar{X}_i - \\bar{X})^2 / (k-1)}{\\sum\\sum(X_{ij} - \\bar{X}_i)^2 / (N-k)} \\)',
            'chi-square': '\\( \\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i} \\)',
            'correlation': '\\( r = \\frac{\\sum(X_i - \\bar{X})(Y_i - \\bar{Y})}{\\sqrt{\\sum(X_i - \\bar{X})^2 \\sum(Y_i - \\bar{Y})^2}} \\)',
            'mann-whitney': '\\( U = n_1 n_2 + \\frac{n_1(n_1+1)}{2} - R_1 \\)',
            'wilcoxon': '\\( W = \\sum_{i=1}^{n} [sgn(x_{2,i} - x_{1,i}) \\cdot R_i] \\)',
            'effect-size': '\\( d = \\frac{\\bar{X}_1 - \\bar{X}_2}{s_{pooled}} \\text{ where } s_{pooled} = \\sqrt{\\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}} \\)',
            'normality': '\\( W = \\frac{(\\sum_{i=1}^{n} a_i x_{(i)})^2}{\\sum_{i=1}^{n}(x_i - \\bar{x})^2} \\) (Shapiro-Wilk)',
            'kruskal': '\\( H = \\frac{12}{N(N+1)} \\sum_{i=1}^{k} \\frac{R_i^2}{n_i} - 3(N+1) \\)',
            'levene': '\\( W = \\frac{(N-k)}{(k-1)} \\cdot \\frac{\\sum_{i=1}^{k} n_i (\\bar{Z}_{i\\cdot} - \\bar{Z}_{\\cdot\\cdot})^2}{\\sum_{i=1}^{k} \\sum_{j=1}^{n_i} (Z_{ij} - \\bar{Z}_{i\\cdot})^2} \\)',
            'descriptive': '\\( \\bar{X} = \\frac{\\sum X_i}{n}, \\quad s = \\sqrt{\\frac{\\sum(X_i - \\bar{X})^2}{n-1}} \\)',
            'pca': '\\( \\text{Cov}(X) = \\frac{1}{n-1} X^T X, \\quad \\text{eigenvalue decomposition} \\)',
            'cronbach': '\\( \\alpha = \\frac{k}{k-1} \\left(1 - \\frac{\\sum s_i^2}{s_t^2}\\right) \\)',
            'friedman': '\\( \\chi_r^2 = \\frac{12}{nk(k+1)} \\sum R_j^2 - 3n(k+1) \\)',
            'logistic': '\\( P(Y=1) = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 X_1 + ... + \\beta_n X_n)}} \\)',
            'survival': '\\( \\hat{S}(t) = \\prod_{t_i \\leq t} \\left(1 - \\frac{d_i}{n_i}\\right) \\) (Kaplan-Meier)',
            'power': '\\( n = \\frac{(Z_{\\alpha/2} + Z_\\beta)^2 \\cdot 2\\sigma^2}{\\delta^2} \\)'
        };
        return formulas[statType] || '<em>Bu test için formül henüz eklenmedi.</em>';
    }

    // =====================================================
    // RUN STAT WIDGET ANALYSIS (viz.js line 8926)
    // =====================================================

    async function runStatWidgetAnalysis(widgetId, statType) {
        const contentDiv = document.getElementById(`${widgetId}-content`);
        if (!contentDiv) return;

        try {
            let result;

            if (['ttest', 'anova', 'chi-square', 'correlation-matrix', 'normality', 'descriptive',
                'mann-whitney', 'wilcoxon', 'kruskal-wallis', 'levene', 'effect-size', 'frequency'].includes(statType)) {
                // Backend API
                result = typeof callSpssApi === 'function' ? await callSpssApi(statType) : null;
            } else if (statType === 'pca') {
                const state = window.VIZ_STATE;
                const numCols = state?.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name) || [];
                result = typeof runPCA === 'function' ? runPCA(numCols.slice(0, 5)) : null;
            } else if (statType === 'kmeans') {
                const state = window.VIZ_STATE;
                const numCols = state?.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name) || [];
                result = typeof runKMeansClustering === 'function' ? runKMeansClustering(numCols.slice(0, 3), 3) : null;
            } else if (statType === 'cronbach') {
                const state = window.VIZ_STATE;
                const numCols = state?.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name) || [];
                result = typeof calculateCronbachAlpha === 'function' ? calculateCronbachAlpha(numCols) : null;
            } else if (statType === 'logistic') {
                result = typeof runLogisticRegression === 'function' ? runLogisticRegression() : null;
            } else if (statType === 'timeseries') {
                result = typeof runTimeSeriesAnalysis === 'function' ? runTimeSeriesAnalysis() : null;
            } else if (statType === 'apa') {
                result = typeof generateAPAReport === 'function' ? generateAPAReport() : null;
            }

            // Sonucu render et
            if (result) {
                contentDiv.innerHTML = formatStatResultForWidget(statType, result);
            } else {
                contentDiv.innerHTML = '<p class="viz-error">Analiz yapılamadı. Uygun veri seçin.</p>';
            }
        } catch (error) {
            contentDiv.innerHTML = `<p class="viz-error">Hata: ${error.message}</p>`;
        }
    }

    // =====================================================
    // FORMAT STAT RESULT (viz.js line 8967)
    // =====================================================

    function formatStatResultForWidget(statType, result) {
        let html = '<div class="viz-stat-result-compact">';

        if (result.error) {
            return `<p class="viz-error">${result.error}</p>`;
        }

        if (statType === 'descriptive' && result.stats) {
            html += `<table class="viz-mini-table">
                <tr><th>Ortalama</th><td>${result.stats.mean?.toFixed(2) || '-'}</td></tr>
                <tr><th>Medyan</th><td>${result.stats.median?.toFixed(2) || '-'}</td></tr>
                <tr><th>Std Sapma</th><td>${result.stats.std?.toFixed(2) || '-'}</td></tr>
                <tr><th>Min</th><td>${result.stats.min || '-'}</td></tr>
                <tr><th>Max</th><td>${result.stats.max || '-'}</td></tr>
            </table>`;
        } else if (result.p_value !== undefined) {
            const sig = result.p_value < 0.05 ? 'viz-significant' : 'viz-normal';
            html += `<div class="viz-stat-summary">
                <div class="viz-stat-value ${sig}">${result.test_name || getStatTitle(statType)}</div>
                <div class="viz-stat-detail">p = ${result.p_value?.toFixed(4)}</div>
                ${result.statistic ? `<div class="viz-stat-detail">Test İst. = ${result.statistic?.toFixed(3)}</div>` : ''}
                <div class="viz-interpretation">${result.interpretation || ''}</div>
            </div>`;
        } else if (typeof result === 'object') {
            html += '<pre class="viz-json-result">' + JSON.stringify(result, null, 2).substring(0, 500) + '</pre>';
        } else {
            html += `<p>${result}</p>`;
        }

        html += '</div>';
        return html;
    }

    // =====================================================
    // DISPLAY STAT RESULT (viz.js line 5338)
    // =====================================================

    function displayStatResult(testType, result) {
        const resultsDiv = document.getElementById('testResults');
        const testNameEl = document.getElementById('testName');
        const testPValueEl = document.getElementById('testPValue');
        const testBodyEl = document.getElementById('testResultBody');

        if (!resultsDiv) return;

        resultsDiv.style.display = 'block';

        if (result.test) {
            testNameEl.textContent = result.test;
        } else if (testType === 'descriptive') {
            testNameEl.textContent = 'Betimsel İstatistik';
        } else if (testType === 'correlation') {
            testNameEl.textContent = `Korelasyon Matrisi (${result.method})`;
        } else if (testType === 'frequency') {
            testNameEl.textContent = 'Frekans Tablosu';
        }

        if (result.p_value !== undefined) {
            const isSignificant = result.p_value < 0.05;
            testPValueEl.textContent = `p = ${result.p_value}`;
            testPValueEl.className = `viz-p-value ${isSignificant ? 'viz-significant' : 'viz-normal'}`;
        } else {
            testPValueEl.textContent = '';
        }

        // Sonuç içeriği
        let html = '';

        if (result.interpretation) {
            html += `<div class="viz-interpretation">${result.interpretation}</div>`;
        }

        if (result.descriptive) {
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
            html += '<table class="viz-stats-table"><thead><tr><th>Değer</th><th>Frekans</th><th>%</th></tr></thead><tbody>';
            result.table.slice(0, 10).forEach(row => {
                html += `<tr><td>${row.value}</td><td>${row.frequency}</td><td>${row.percent}%</td></tr>`;
            });
            html += '</tbody></table>';
        }

        if (result.group_stats) {
            html += '<div class="viz-group-stats">';
            result.group_stats.forEach(g => {
                html += `<span class="viz-group-item">${g.group}: μ=${g.mean} (n=${g.n})</span>`;
            });
            html += '</div>';
        }

        if (testBodyEl) testBodyEl.innerHTML = html;
    }

    // =====================================================
    // REFRESH & EMBED (viz.js line 9001, 9006)
    // =====================================================

    function refreshStatWidget(widgetId, statType) {
        runStatWidgetAnalysis(widgetId, statType);
    }

    function embedStatInChart(widgetId) {
        const state = window.VIZ_STATE;
        if (!state?.selectedChart) {
            if (typeof showToast === 'function') showToast('Önce bir grafik seçin', 'warning');
            return;
        }

        const widget = document.getElementById(widgetId);
        const content = document.getElementById(`${widgetId}-content`);
        if (!content || !widget) return;

        const chartWidget = document.getElementById(state.selectedChart);
        const chartContainer = chartWidget?.querySelector('.viz-chart-container');

        if (!chartContainer) {
            if (typeof showToast === 'function') showToast('Grafik container bulunamadı', 'error');
            return;
        }

        const embedDiv = document.createElement('div');
        embedDiv.className = 'viz-stat-overlay-embedded';
        embedDiv.id = `${widgetId}-embedded`;
        embedDiv.style.cssText = `
            position: absolute;
            top: 40px;
            right: 10px;
            min-width: 120px;
            max-width: 200px;
            min-height: 50px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(4px);
            border: 1px dashed var(--gm-primary);
            border-radius: 6px;
            padding: 8px;
            font-size: 0.7rem;
            z-index: 1000;
            cursor: move;
            resize: both;
            overflow: auto;
            color: var(--gm-text);
        `;

        embedDiv.innerHTML = `
            <div class="viz-embed-header" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold; font-size:0.65rem;">${widget.querySelector('.viz-stat-header span')?.textContent || 'İstatistik'}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; cursor:pointer; font-size:0.6rem; opacity:0.7;">✕</button>
            </div>
            <div class="viz-embed-content" style="font-size:0.65rem;">${content.innerHTML}</div>
        `;

        // Drag functionality
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        embedDiv.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = embedDiv.offsetLeft;
            startTop = embedDiv.offsetTop;
            embedDiv.style.opacity = '0.8';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            embedDiv.style.left = (startLeft + dx) + 'px';
            embedDiv.style.top = (startTop + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            embedDiv.style.opacity = '1';
        });

        chartContainer.style.position = 'relative';
        chartContainer.appendChild(embedDiv);

        widget.remove();

        if (typeof showToast === 'function') showToast('İstatistik grafiğe gömüldü (sürükleyebilir ve boyutlandırabilirsiniz)', 'success');
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.getStatTitle = getStatTitle;
    window.getAnalysisRequirements = getAnalysisRequirements;
    window.getStatEndpoints = getStatEndpoints;
    window.getFormulaForTest = getFormulaForTest;
    window.runStatWidgetAnalysis = runStatWidgetAnalysis;
    window.formatStatResultForWidget = formatStatResultForWidget;
    window.displayStatResult = displayStatResult;
    window.refreshStatWidget = refreshStatWidget;
    window.embedStatInChart = embedStatInChart;

    console.log('✅ viz-stats-core.js loaded - All 23 stat types supported');
})();
