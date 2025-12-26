/**
 * viz-widget-ui.js
 * Widget UI Generators - generateStatUIByType, getAnalysisRequirements, renderStatResults
 * Ported from legacy viz.js lines: 13690-13954, 14095-14408, 15010-15197
 */

(function () {
    'use strict';

    // =====================================================
    // GET STAT TITLE (viz.js line 13653)
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
    // GET ANALYSIS REQUIREMENTS (viz.js line 14095)
    // =====================================================

    function getAnalysisRequirements(statType) {
        const requirements = {
            'descriptive': {
                uiType: 'TYPE_E',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 1, maxColumns: 10, columnTypes: ['numeric'],
                description: 'Seçili sütun(lar)ın ortalama, medyan, standart sapma gibi istatistiklerini hesaplar.',
                descriptionEn: 'Calculates mean, median, standard deviation for selected column(s).'
            },
            'ttest': {
                uiType: 'TYPE_A',
                needsX: true, needsY: true, needsGroupSelection: true,
                xColumnType: 'categorical', yColumnType: 'numeric', groupCount: 2,
                description: 'X: kategorik grup sütunu, Y: sayısal değer. İki grup seçip ortalamalarını karşılaştırır.',
                descriptionEn: 'X: categorical group, Y: numeric. Compares means of two selected groups.'
            },
            'anova': {
                uiType: 'TYPE_G',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'categorical', yColumnType: 'numeric', autoUseAllGroups: true,
                description: 'X: grup sütunu, Y: değer sütunu. Tüm grupları karşılaştırır.',
                descriptionEn: 'X: group column, Y: value column. Compares all groups.'
            },
            'chi-square': {
                uiType: 'TYPE_H',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'categorical', yColumnType: 'categorical',
                description: 'X ve Y: iki kategorik sütun. Çapraz tablo bağımsızlık testi.',
                descriptionEn: 'X and Y: two categorical columns. Cross-tabulation independence test.'
            },
            'correlation': {
                uiType: 'TYPE_B',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 2, maxColumns: 10, columnTypes: ['numeric'],
                description: 'Seçili sayısal sütunlar arasındaki korelasyon matrisi.',
                descriptionEn: 'Correlation matrix between selected numeric columns.'
            },
            'normality': {
                uiType: 'TYPE_E',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 1, maxColumns: 1, columnTypes: ['numeric'],
                description: 'Seçili sütunun normal dağılıma uygunluğunu test eder.',
                descriptionEn: 'Tests if selected column follows normal distribution.'
            },
            'mann-whitney': {
                uiType: 'TYPE_A',
                needsX: true, needsY: true, needsGroupSelection: true,
                xColumnType: 'categorical', yColumnType: 'numeric', groupCount: 2,
                description: 'X: kategorik grup, Y: sayısal. Medyanları karşılaştırır (non-parametrik).',
                descriptionEn: 'X: categorical group, Y: numeric. Compares medians (non-parametric).'
            },
            'wilcoxon': {
                uiType: 'TYPE_C',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 2, maxColumns: 2, columnTypes: ['numeric'], paired: true,
                description: 'İki sayısal sütun seçin (eşleştirilmiş örnekler).',
                descriptionEn: 'Select two numeric columns (paired samples).'
            },
            'kruskal': {
                uiType: 'TYPE_G',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'categorical', yColumnType: 'numeric', autoUseAllGroups: true,
                description: 'Non-parametrik ANOVA - tüm grupları karşılaştırır.',
                descriptionEn: 'Non-parametric ANOVA - compares all groups.'
            },
            'levene': {
                uiType: 'TYPE_G',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'categorical', yColumnType: 'numeric', autoUseAllGroups: true,
                description: 'Tüm grupların varyans homojenliğini test eder.',
                descriptionEn: 'Tests variance homogeneity across all groups.'
            },
            'effect-size': {
                uiType: 'TYPE_A',
                needsX: true, needsY: true, needsGroupSelection: true,
                xColumnType: 'categorical', yColumnType: 'numeric', groupCount: 2,
                description: 'İki grup seçip Cohen\'s d etki büyüklüğü hesaplar.',
                descriptionEn: 'Calculates Cohen\'s d effect size for two groups.'
            },
            'frequency': {
                uiType: 'TYPE_E',
                needsX: true, needsY: false, needsGroupSelection: false,
                minColumns: 1, maxColumns: 1, columnTypes: ['categorical', 'numeric'],
                description: 'X sütunundaki kategorilerin frekansını hesaplar.',
                descriptionEn: 'Calculates frequency of categories in X column.'
            },
            'pca': {
                uiType: 'TYPE_B',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 3, maxColumns: 20, columnTypes: ['numeric'],
                description: 'Seçili sayısal sütunlar için PCA uygular.',
                descriptionEn: 'Applies PCA to selected numeric columns.'
            },
            'kmeans': {
                uiType: 'TYPE_B',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 2, maxColumns: 10, columnTypes: ['numeric'],
                extraParams: ['k'], defaultK: 3,
                description: 'K-Means kümeleme uygular.',
                descriptionEn: 'Applies K-Means clustering.'
            },
            'cronbach': {
                uiType: 'TYPE_B',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 2, maxColumns: 50, columnTypes: ['numeric'],
                description: 'Cronbach Alpha güvenilirlik katsayısı hesaplar.',
                descriptionEn: 'Calculates Cronbach Alpha reliability coefficient.'
            },
            'logistic': {
                uiType: 'TYPE_D',
                needsX: true, needsY: true, needsGroupSelection: false,
                targetType: 'binary', predictorTypes: ['numeric', 'categorical'],
                description: 'X: bağımlı değişken (0/1), Y: bağımsız değişkenler.',
                descriptionEn: 'X: dependent variable (0/1), Y: independent variables.'
            },
            'timeseries': {
                uiType: 'TYPE_F',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'date', yColumnType: 'numeric',
                description: 'X: tarih/zaman sütunu, Y: değer. Trend analizi.',
                descriptionEn: 'X: date/time column, Y: value. Trend analysis.'
            },
            'apa': {
                uiType: 'TYPE_E',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 0, maxColumns: 0, useFullData: true,
                description: 'Tüm veri için APA formatında rapor oluşturur.',
                descriptionEn: 'Creates APA format report for all data.'
            },
            'friedman': {
                uiType: 'TYPE_B',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 3, maxColumns: 10, columnTypes: ['numeric'], repeatedMeasures: true,
                description: 'Tekrarlı ölçümler için non-parametrik ANOVA.',
                descriptionEn: 'Non-parametric ANOVA for repeated measures.'
            },
            'power': {
                uiType: 'TYPE_E',
                needsX: false, needsY: true, needsGroupSelection: false,
                minColumns: 1, maxColumns: 1, columnTypes: ['numeric'],
                extraParams: ['effectSize', 'alpha', 'sampleSize'],
                description: 'İstatistiksel güç analizi.',
                descriptionEn: 'Statistical power analysis.'
            },
            'regression-coef': {
                uiType: 'TYPE_H',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'numeric', yColumnType: 'numeric',
                description: 'X: bağımsız, Y: bağımlı değişken. Regresyon katsayıları.',
                descriptionEn: 'X: independent, Y: dependent. Regression coefficients.'
            },
            'discriminant': {
                uiType: 'TYPE_D',
                needsX: true, needsY: true, needsGroupSelection: false,
                targetType: 'categorical', predictorTypes: ['numeric'],
                description: 'X: grup sütunu, Y: ayırt edici değişkenler.',
                descriptionEn: 'X: group column, Y: discriminant variables.'
            },
            'survival': {
                uiType: 'TYPE_F',
                needsX: true, needsY: true, needsGroupSelection: false,
                xColumnType: 'numeric', yColumnType: 'binary',
                description: 'X: süre sütunu, Y: olay sütunu (0/1).',
                descriptionEn: 'X: time column, Y: event column (0/1).'
            }
        };

        return requirements[statType] || {
            uiType: 'TYPE_G', needsX: true, needsY: true, needsGroupSelection: false,
            description: 'Analiz için X ve Y sütunları seçin.'
        };
    }

    // =====================================================
    // GENERATE STAT UI BY TYPE (viz.js line 13690)
    // =====================================================

    function generateStatUIByType(widgetId, statType, analysisInfo, dataset) {
        const lang = VIZ_STATE.lang || 'tr';
        const allCols = dataset.columns || [];
        const numericCols = dataset.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name) || allCols;
        const categoricalCols = dataset.columnsInfo?.filter(c => c.type !== 'numeric').map(c => c.name) || allCols;

        const makeOptions = (cols, selectedIdx = 0) => cols.map((c, i) =>
            `<option value="${c}" ${i === selectedIdx ? 'selected' : ''}>${c}</option>`
        ).join('');

        const makeCheckboxes = (cols, name, defaults = []) => cols.map(c =>
            `<label class="viz-checkbox-label">
                <input type="checkbox" name="${name}" value="${c}" ${defaults.includes(c) ? 'checked' : ''}>
                <span>${c}</span>
            </label>`
        ).join('');

        const description = lang === 'tr' ? analysisInfo.description : (analysisInfo.descriptionEn || analysisInfo.description);
        let html = description ? `<div class="viz-stat-description"><i class="fas fa-info-circle"></i> ${description}</div>` : '';

        const uiType = analysisInfo.uiType || 'TYPE_G';

        switch (uiType) {
            case 'TYPE_A': // 2 Grup Seçimi (t-Test, Mann-Whitney, Effect-Size)
                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group">
                            <label>X (Grup/Kategori):</label>
                            <select id="${widgetId}_xCol" onchange="onStatXColumnChange('${widgetId}', '${statType}')">
                                ${makeOptions(categoricalCols.length > 0 ? categoricalCols : allCols)}
                            </select>
                        </div>
                        <div class="viz-param-group">
                            <label>Y (Değer/Sayısal):</label>
                            <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(numericCols.length > 0 ? numericCols : allCols)}
                            </select>
                        </div>
                    </div>
                    <div class="viz-group-selector" id="${widgetId}_groupSelector">
                        <div class="viz-group-selector-title">
                            <i class="fas fa-users"></i> Karşılaştırılacak Gruplar:
                        </div>
                        <div class="viz-group-selectors-row">
                            <div class="viz-param-group">
                                <label>Grup 1:</label>
                                <select id="${widgetId}_group1" onchange="refreshStatWidget('${widgetId}')">
                                    <option value="">-- Grup seçin --</option>
                                </select>
                            </div>
                            <div class="viz-param-group">
                                <label>Grup 2:</label>
                                <select id="${widgetId}_group2" onchange="refreshStatWidget('${widgetId}')">
                                    <option value="">-- Grup seçin --</option>
                                </select>
                            </div>
                        </div>
                    </div>`;
                break;

            case 'TYPE_B': // Çoklu Sayısal Sütun (Correlation, PCA, Cronbach, K-Means)
                const minCols = analysisInfo.minColumns || 2;
                const maxCols = analysisInfo.maxColumns || 10;
                const defaultSelected = numericCols.slice(0, Math.min(3, numericCols.length));

                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group viz-multi-select">
                            <label>Sütunlar (en az ${minCols}, en fazla ${maxCols}):</label>
                            <div class="viz-checkbox-grid" id="${widgetId}_columns">
                                ${makeCheckboxes(numericCols.length > 0 ? numericCols : allCols, `${widgetId}_col`, defaultSelected)}
                            </div>
                        </div>
                        ${analysisInfo.extraParams?.includes('k') ? `
                        <div class="viz-param-group">
                            <label>K (Küme Sayısı):</label>
                            <input type="number" id="${widgetId}_k" value="${analysisInfo.defaultK || 3}" 
                                   min="2" max="10" onchange="refreshStatWidget('${widgetId}')">
                        </div>` : ''}
                    </div>`;
                break;

            case 'TYPE_C': // 2 Sütun Eşleştirme (Wilcoxon Paired)
                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group">
                            <label>Sütun 1 (Öncesi):</label>
                            <select id="${widgetId}_col1" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(numericCols.length > 0 ? numericCols : allCols, 0)}
                            </select>
                        </div>
                        <div class="viz-param-group">
                            <label>Sütun 2 (Sonrası):</label>
                            <select id="${widgetId}_col2" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(numericCols.length > 0 ? numericCols : allCols, 1)}
                            </select>
                        </div>
                    </div>`;
                break;

            case 'TYPE_D': // Binary Hedef + Predictorlar (Logistic, Discriminant)
                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group">
                            <label>Hedef (Y):</label>
                            <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(allCols)}
                            </select>
                        </div>
                        <div class="viz-param-group viz-multi-select">
                            <label>Predictor Sütunlar:</label>
                            <div class="viz-checkbox-grid" id="${widgetId}_predictors">
                                ${makeCheckboxes(numericCols, `${widgetId}_col`, numericCols.slice(0, 3))}
                            </div>
                        </div>
                    </div>`;
                break;

            case 'TYPE_E': // Tek Sütun (Normality, Frequency, Descriptive)
                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group">
                            <label>Sütun:</label>
                            <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(analysisInfo.columnTypes?.includes('numeric') ? numericCols : allCols)}
                            </select>
                        </div>
                    </div>`;
                break;

            case 'TYPE_F': // Tarih + Değer (Time Series, Survival)
                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group">
                            <label>X (Tarih/Süre):</label>
                            <select id="${widgetId}_xCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(allCols)}
                            </select>
                        </div>
                        <div class="viz-param-group">
                            <label>Y (Değer/Event):</label>
                            <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(numericCols.length > 0 ? numericCols : allCols)}
                            </select>
                        </div>
                    </div>`;
                break;

            case 'TYPE_G': // Grup + Değer - Tüm gruplar (ANOVA, Kruskal-Wallis, Levene)
            case 'TYPE_H': // İki Sütun (Chi-Square, Regression)
            default:
                html += `
                    <div class="viz-stat-selectors">
                        <div class="viz-param-group">
                            <label>X (Grup/Bağımsız):</label>
                            <select id="${widgetId}_xCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(uiType === 'TYPE_H' && analysisInfo.xColumnType === 'numeric' ? numericCols : (categoricalCols.length > 0 ? categoricalCols : allCols))}
                            </select>
                        </div>
                        <div class="viz-param-group">
                            <label>Y (Değer/Bağımlı):</label>
                            <select id="${widgetId}_yCol" onchange="refreshStatWidget('${widgetId}')">
                                ${makeOptions(uiType === 'TYPE_H' && analysisInfo.yColumnType === 'categorical' ? (categoricalCols.length > 0 ? categoricalCols : allCols) : (numericCols.length > 0 ? numericCols : allCols))}
                            </select>
                        </div>
                    </div>`;
        }

        return html;
    }

    // =====================================================
    // RENDER STAT RESULTS (viz.js line 15010)
    // =====================================================

    function renderStatResults(widgetId, statType, results) {
        const bodyEl = document.getElementById(`${widgetId}_body`);
        if (!bodyEl) return;

        if (results.error || results.detail) {
            let errorMsg = results.error || results.detail;
            if (typeof errorMsg === 'object') {
                errorMsg = errorMsg.message || errorMsg.msg || JSON.stringify(errorMsg);
            }
            bodyEl.innerHTML = `<div class="viz-stat-error"><i class="fas fa-exclamation-circle"></i> ${errorMsg}</div>`;
            return;
        }

        const lang = VIZ_STATE.lang || 'tr';
        const getLocalized = (val) => {
            if (typeof val === 'object' && val !== null && (val.tr || val.en)) {
                return val[lang] || val.tr || val.en;
            }
            return val;
        };

        const formatNumber = (n) => {
            if (n === null || n === undefined) return '-';
            if (typeof n === 'number') return n.toFixed(4);
            return n;
        };

        let html = '';

        // Grup bazlı testler (t-Test, ANOVA, Mann-Whitney vb.)
        if (results.groups && Array.isArray(results.groups)) {
            const testName = getLocalized(results.test) || statType;
            const interpretation = getLocalized(results.interpretation) || '';
            const isSignificant = results.significant;

            html = `
                <div class="viz-stat-result ${isSignificant ? 'viz-stat-success' : 'viz-stat-neutral'}">
                    <div class="viz-stat-header"><strong>${testName}</strong></div>
                    <div class="viz-stat-groups">
                        ${results.groups.map(g => `
                            <div class="viz-stat-group-card">
                                <div class="viz-stat-group-name">${g.name}</div>
                                <div class="viz-stat-group-stats">
                                    <span>n: ${g.n}</span>
                                    ${g.mean !== undefined ? `<span>Ort: ${formatNumber(g.mean)}</span>` : ''}
                                    ${g.median !== undefined ? `<span>Med: ${formatNumber(g.median)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="viz-stat-metrics">
                        ${results.t_statistic !== undefined ? `<div class="viz-stat-metric"><span>t</span><strong>${formatNumber(results.t_statistic)}</strong></div>` : ''}
                        ${results.f_statistic !== undefined ? `<div class="viz-stat-metric"><span>F</span><strong>${formatNumber(results.f_statistic)}</strong></div>` : ''}
                        ${results.u_statistic !== undefined ? `<div class="viz-stat-metric"><span>U</span><strong>${formatNumber(results.u_statistic)}</strong></div>` : ''}
                        ${results.h_statistic !== undefined ? `<div class="viz-stat-metric"><span>H</span><strong>${formatNumber(results.h_statistic)}</strong></div>` : ''}
                        ${results.chi2_statistic !== undefined ? `<div class="viz-stat-metric"><span>χ²</span><strong>${formatNumber(results.chi2_statistic)}</strong></div>` : ''}
                        <div class="viz-stat-metric ${isSignificant ? 'significant' : ''}">
                            <span>p</span><strong>${formatNumber(results.p_value)}</strong>
                        </div>
                    </div>
                    ${results.confidence_interval ? `
                    <div class="viz-stat-ci">
                        <span>%95 Güven Aralığı:</span>
                        <strong>[${formatNumber(results.confidence_interval[0])}, ${formatNumber(results.confidence_interval[1])}]</strong>
                    </div>` : ''}
                    <div class="viz-stat-interpretation ${isSignificant ? 'significant' : ''}">
                        <i class="fas ${isSignificant ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                        ${interpretation}
                    </div>
                </div>
            `;
        }
        // Betimsel istatistik tablosu
        else if (statType === 'descriptive' && (results.columns || results.descriptive)) {
            const cols = results.columns || results.descriptive || {};
            html = `<div class="viz-stat-table-wrapper"><table class="viz-stat-table">
                <thead><tr>
                    <th>${lang === 'tr' ? 'Sütun' : 'Column'}</th>
                    <th>${lang === 'tr' ? 'Ort.' : 'Mean'}</th>
                    <th>${lang === 'tr' ? 'Medyan' : 'Median'}</th>
                    <th>Std</th><th>Min</th><th>Max</th><th>N</th>
                </tr></thead><tbody>`;

            for (const [col, stats] of Object.entries(cols)) {
                html += `<tr>
                    <td><strong>${col}</strong></td>
                    <td>${formatNumber(stats.mean)}</td>
                    <td>${formatNumber(stats.median)}</td>
                    <td>${formatNumber(stats.stdev || stats.std)}</td>
                    <td>${formatNumber(stats.min)}</td>
                    <td>${formatNumber(stats.max)}</td>
                    <td>${stats.count || stats.n}</td>
                </tr>`;
            }
            html += '</tbody></table></div>';
        }
        // Normallik testi
        else if (statType === 'normality') {
            const isNormal = results.is_normal || results.isNormal || results.p_value > 0.05;
            const interpretation = getLocalized(results.interpretation) ||
                (isNormal ? 'Veri normal dağılım gösteriyor' : 'Veri normal dağılmıyor');

            html = `
                <div class="viz-stat-result ${isNormal ? 'viz-stat-success' : 'viz-stat-warning'}">
                    <div class="viz-stat-icon">
                        <i class="fas ${isNormal ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                    </div>
                    <div class="viz-stat-content">
                        <h4>${results.column || 'Normallik Testi'}</h4>
                        <p>${interpretation}</p>
                        ${results.p_value !== undefined ? `<p class="viz-stat-detail">p-değeri: ${formatNumber(results.p_value)}</p>` : ''}
                        ${results.statistic !== undefined ? `<p class="viz-stat-detail">Test istatistiği: ${formatNumber(results.statistic)}</p>` : ''}
                    </div>
                </div>
            `;
        }
        // Genel sonuç gösterimi
        else {
            const testName = getLocalized(results.test) || statType;
            const interpretation = getLocalized(results.interpretation);

            html = '<div class="viz-stat-results">';
            if (testName) html += `<div class="viz-stat-header"><strong>${testName}</strong></div>`;

            for (const [key, value] of Object.entries(results)) {
                if (['type', 'columns', 'test', 'interpretation', 'groups'].includes(key)) continue;

                if (typeof value === 'object' && value !== null) {
                    if (value.tr || value.en) {
                        html += `<div class="viz-stat-row"><span>${key}:</span> <strong>${getLocalized(value)}</strong></div>`;
                    } else if (Array.isArray(value)) {
                        html += `<div class="viz-stat-group"><h5>${key}</h5>`;
                        value.forEach(item => {
                            if (typeof item === 'object') {
                                html += `<div class="viz-stat-subgroup">`;
                                for (const [k, v] of Object.entries(item)) {
                                    html += `<span>${k}: ${formatStatValue(v)}</span> `;
                                }
                                html += `</div>`;
                            } else {
                                html += `<span>${formatStatValue(item)}</span> `;
                            }
                        });
                        html += '</div>';
                    } else {
                        html += `<div class="viz-stat-group"><h5>${key}</h5>`;
                        for (const [k2, v2] of Object.entries(value)) {
                            html += `<div class="viz-stat-row"><span>${k2}:</span> <strong>${formatStatValue(v2)}</strong></div>`;
                        }
                        html += '</div>';
                    }
                } else {
                    html += `<div class="viz-stat-row"><span>${key}:</span> <strong>${formatStatValue(value)}</strong></div>`;
                }
            }

            if (interpretation) {
                html += `<div class="viz-stat-interpretation ${results.significant ? 'significant' : ''}">
                    <i class="fas ${results.significant ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                    ${interpretation}
                </div>`;
            }

            html += '</div>';
        }

        bodyEl.innerHTML = html;
    }

    function formatStatValue(value) {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
        if (typeof value === 'number') {
            if (Number.isInteger(value)) return value.toLocaleString('tr-TR');
            return value.toFixed(4);
        }
        if (Array.isArray(value)) return value.map(v => formatStatValue(v)).join(', ');
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length <= 3) return keys.map(k => `${k}: ${formatStatValue(value[k])}`).join(', ');
            return JSON.stringify(value);
        }
        return String(value);
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.getStatTitle = getStatTitle;
    window.getAnalysisRequirements = getAnalysisRequirements;
    window.generateStatUIByType = generateStatUIByType;
    window.renderStatResults = renderStatResults;
    window.formatStatValue = formatStatValue;

    console.log('✅ viz-widget-ui.js loaded - UI generators ready');
})();
