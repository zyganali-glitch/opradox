/**
 * viz-widget-core.js
 * Widget Lifecycle Engine - Core Functions
 * Ported from legacy viz.js lines: 13959-14078, 14560-14906, 15233-15256
 */

(function () {
    'use strict';

    // =====================================================
    // CREATE STAT WIDGET (viz.js line 13959)
    // =====================================================

    async function createStatWidget(statType) {
        // Veri kontrolü
        if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
            showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const widgetId = `stat_${++VIZ_STATE.chartCounter}`;
        const datasetId = VIZ_STATE.activeDatasetId;
        const dataset = VIZ_STATE.getDatasetById(datasetId);

        if (!dataset) {
            showToast('Veri seti bulunamadı', 'error');
            return;
        }

        console.log(`📊 Stat widget oluşturuluyor: ${widgetId}, tip: ${statType}, dataset: ${datasetId}`);

        // Seçili grafikten varsayılan X/Y eksenlerini al
        let defaultX = dataset.columns[0] || '';
        let defaultY = dataset.columns[1] || dataset.columns[0] || '';

        if (VIZ_STATE.selectedChart) {
            const selectedConfig = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
            if (selectedConfig) {
                defaultX = selectedConfig.xAxis || defaultX;
                defaultY = selectedConfig.yAxis || defaultY;
            }
        }

        // Analiz türüne göre gerekli sütun bilgisi
        const analysisInfo = typeof getAnalysisRequirements === 'function' ?
            getAnalysisRequirements(statType) : { uiType: 'TYPE_G', description: '' };

        // Widget DOM oluştur
        const dashboard = document.getElementById('vizDashboardGrid');
        if (!dashboard) {
            console.error('Dashboard bulunamadı');
            return;
        }

        const widget = document.createElement('div');
        widget.className = 'viz-chart-widget viz-stat-widget';
        widget.id = widgetId;
        widget.dataset.statType = statType;
        widget.dataset.datasetId = datasetId;
        widget.dataset.uiType = analysisInfo.uiType || 'TYPE_G';

        // UI tipine göre dinamik parametre formu oluştur
        const paramsHTML = typeof generateStatUIByType === 'function' ?
            generateStatUIByType(widgetId, statType, analysisInfo, dataset) : '';

        const statTitle = typeof getStatTitle === 'function' ? getStatTitle(statType) : statType;

        widget.innerHTML = `
            <div class="viz-widget-header">
                <span class="viz-widget-title">${statTitle}</span>
                <div class="viz-widget-actions">
                    <button class="viz-mode-toggle" onclick="toggleStatMode('${widgetId}')" title="APA/Dashboard Modu">
                        <i class="fas fa-file-alt"></i> APA
                    </button>
                    <button class="viz-formula-btn" onclick="toggleFormula('${widgetId}')" title="Formül Göster">
                        <i class="fas fa-function">fx</i>
                    </button>
                    <div class="viz-copy-dropdown">
                        <button class="viz-copy-btn" title="Kopyala">
                            <i class="fas fa-copy"></i> <i class="fas fa-caret-down" style="font-size:0.6rem"></i>
                        </button>
                        <div class="viz-copy-menu">
                            <button onclick="copyStatAsHTML('${widgetId}')"><i class="fas fa-table"></i> Word Tablosu</button>
                            <button onclick="copyStatAsImage('${widgetId}')"><i class="fas fa-image"></i> Resim Olarak</button>
                            <button onclick="copyStatAsText('${widgetId}')"><i class="fas fa-align-left"></i> Düz Metin</button>
                        </div>
                    </div>
                    <button class="viz-widget-btn" onclick="refreshStatWidget('${widgetId}')" title="Yenile">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="viz-widget-btn" onclick="embedStatToChart('${widgetId}')" title="Grafiğe Göm">
                        <i class="fas fa-compress-arrows-alt"></i>
                    </button>
                    <button class="viz-widget-close" onclick="removeWidget('${widgetId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="viz-stat-params" id="${widgetId}_params">
                ${paramsHTML}
            </div>
            <div class="viz-widget-body viz-stat-body" id="${widgetId}_body">
                <div class="viz-loading"><i class="fas fa-spinner fa-spin"></i> Hesaplanıyor...</div>
            </div>
            <div class="viz-widget-resize-handle"></div>
        `;

        dashboard.appendChild(widget);
        if (typeof updateEmptyState === 'function') updateEmptyState();

        // Varsayılan sütun değerlerini ayarla
        const xColSelect = document.getElementById(`${widgetId}_xCol`);
        const yColSelect = document.getElementById(`${widgetId}_yCol`);
        if (xColSelect) xColSelect.value = defaultX;
        if (yColSelect) yColSelect.value = defaultY;

        // Grup seçimi gereken istatistikler için grup seçicileri doldur
        if (analysisInfo.needsGroupSelection) {
            populateGroupSelectors(widgetId);
            const bodyEl = document.getElementById(`${widgetId}_body`);
            if (bodyEl) {
                bodyEl.innerHTML = '<div class="viz-stat-info"><i class="fas fa-info-circle"></i> Karşılaştırılacak iki grup seçin ve Yenile butonuna basın.</div>';
            }
        } else {
            await runStatForWidget(widgetId, statType, datasetId, defaultX, defaultY);
        }
    }

    // =====================================================
    // RUN STAT FOR WIDGET (viz.js line 14560)
    // =====================================================

    async function runStatForWidget(widgetId, statType, datasetId, xCol, yCol) {
        const bodyEl = document.getElementById(`${widgetId}_body`);
        if (!bodyEl) return;

        bodyEl.innerHTML = '<div class="viz-loading"><i class="fas fa-spinner fa-spin"></i> Hesaplanıyor...</div>';

        const dataset = VIZ_STATE.getDatasetById(datasetId);
        if (!dataset) {
            bodyEl.innerHTML = '<div class="viz-stat-error"><i class="fas fa-exclamation-circle"></i> Veri seti bulunamadı</div>';
            return;
        }

        // Parametreleri widget'tan veya dropdown'lardan al
        if (!xCol) {
            const xColSelect = document.getElementById(`${widgetId}_xCol`);
            xCol = xColSelect ? xColSelect.value : dataset.columns[0];
        }
        if (!yCol) {
            const yColSelect = document.getElementById(`${widgetId}_yCol`);
            yCol = yColSelect ? yColSelect.value : dataset.columns[1] || dataset.columns[0];
        }

        let numericColumns = yCol ? [yCol] : [];
        let groupColumn = xCol || null;

        console.log(`📊 Stat analizi: ${statType}, X=${groupColumn}, Y=${numericColumns.join(',')}`);

        if (numericColumns.length === 0) {
            numericColumns = dataset.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name) || [];
            if (numericColumns.length === 0) {
                numericColumns.push(...dataset.columns.slice(0, 5));
            }
            groupColumn = dataset.columns.find(c => !numericColumns.includes(c)) || dataset.columns[0];
        }

        const API_BASE = window.API_BASE || 'http://localhost:8100';
        const endpoints = {
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
            'discriminant': `${API_BASE}/viz/lda`,
            'survival': `${API_BASE}/viz/survival`,
            'apa': `${API_BASE}/viz/apa-report`,
            'power': `${API_BASE}/viz/power-analysis`,
            'timeseries': `${API_BASE}/viz/time-series`
        };

        const endpoint = endpoints[statType];

        if (!dataset.file) {
            const results = { error: "Dosya referansı bulunamadı. Lütfen veriyi tekrar yükleyin." };
            if (typeof renderStatResults === 'function') renderStatResults(widgetId, statType, results);
            return;
        }

        if (!endpoint) {
            const results = typeof calculateLocalStat === 'function' ?
                calculateLocalStat(statType, dataset.data, numericColumns, groupColumn) : { error: 'Endpoint bulunamadı' };
            if (typeof renderStatResults === 'function') renderStatResults(widgetId, statType, results);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', dataset.file);

            // Her test türü için doğru parametreleri ekle
            switch (statType) {
                case 'descriptive':
                    formData.append('columns', JSON.stringify([yCol]));
                    break;

                case 'ttest':
                case 'mann-whitney':
                case 'effect-size':
                    const group1 = document.getElementById(`${widgetId}_group1`)?.value;
                    const group2 = document.getElementById(`${widgetId}_group2`)?.value;
                    if (!group1 || !group2) {
                        bodyEl.innerHTML = '<div class="viz-stat-error"><i class="fas fa-info-circle"></i> Karşılaştırılacak iki grup seçin.</div>';
                        return;
                    }
                    if (group1 === group2) {
                        bodyEl.innerHTML = '<div class="viz-stat-error"><i class="fas fa-exclamation-triangle"></i> Farklı iki grup seçin.</div>';
                        return;
                    }
                    formData.append('value_column', yCol);
                    formData.append('group_column', groupColumn);
                    formData.append('group1', group1);
                    formData.append('group2', group2);
                    if (statType === 'ttest') formData.append('test_type', 'independent');
                    if (statType === 'effect-size') formData.append('effect_type', 'cohens_d');
                    break;

                case 'anova':
                case 'kruskal':
                case 'levene':
                    formData.append('value_column', yCol);
                    formData.append('group_column', groupColumn);
                    break;

                case 'chi-square':
                    formData.append('column1', groupColumn);
                    formData.append('column2', yCol);
                    break;

                case 'correlation':
                case 'pca':
                case 'kmeans':
                case 'cronbach':
                case 'friedman':
                    let selectedCols = [];
                    const checkboxes = document.querySelectorAll(`[name="${widgetId}_col"]:checked`);
                    checkboxes.forEach(cb => selectedCols.push(cb.value));
                    if (selectedCols.length < 2) {
                        selectedCols = dataset.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name).slice(0, 5) || [yCol];
                    }
                    formData.append('columns', JSON.stringify(selectedCols));
                    if (statType === 'correlation') formData.append('method', 'pearson');
                    if (statType === 'pca') formData.append('n_components', 2);
                    if (statType === 'kmeans') formData.append('n_clusters', 3);
                    break;

                case 'normality':
                    formData.append('column', yCol);
                    formData.append('test_type', 'shapiro');
                    break;

                case 'wilcoxon':
                    const col1 = document.getElementById(`${widgetId}_col1`)?.value;
                    const col2 = document.getElementById(`${widgetId}_col2`)?.value;
                    formData.append('column1', col1 || yCol);
                    formData.append('column2', col2 || groupColumn);
                    break;

                case 'frequency':
                    formData.append('column', groupColumn || yCol);
                    break;

                case 'regression-coef':
                case 'logistic':
                    formData.append('target_column', yCol);
                    formData.append('predictor_columns', JSON.stringify([groupColumn]));
                    formData.append('regression_type', statType === 'logistic' ? 'logistic' : 'linear');
                    break;

                case 'survival':
                    formData.append('duration_column', yCol);
                    formData.append('event_column', groupColumn);
                    break;

                case 'timeseries':
                    formData.append('date_column', groupColumn);
                    formData.append('value_column', yCol);
                    break;

                case 'power':
                    formData.append('column', yCol);
                    formData.append('effect_size', document.getElementById(`${widgetId}_effectSize`)?.value || 0.5);
                    formData.append('alpha', document.getElementById(`${widgetId}_alpha`)?.value || 0.05);
                    formData.append('power', 0.8);
                    break;

                default:
                    formData.append('columns', JSON.stringify([yCol]));
                    if (groupColumn) formData.append('group_column', groupColumn);
            }

            const response = await fetch(endpoint, { method: 'POST', body: formData });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errJson = JSON.parse(errorText);
                    if (errJson.detail) errorMessage = errJson.detail;
                } catch (e) {
                    if (errorText.length < 200) errorMessage += `: ${errorText}`;
                }
                throw new Error(errorMessage);
            }

            const results = await response.json();
            console.log('📊 API sonucu:', results);
            if (typeof renderStatResults === 'function') renderStatResults(widgetId, statType, results);

            const usedCols = [groupColumn, yCol].filter(Boolean);
            if (typeof addAuditFooterToWidget === 'function') addAuditFooterToWidget(widgetId, usedCols);

        } catch (error) {
            console.error('Stat API hatası:', error);
            bodyEl.innerHTML = `<div class="viz-stat-error">
                <i class="fas fa-exclamation-triangle"></i> <strong>Analiz Hatası:</strong><br>
                ${error.message}<br>
                <small style="opacity:0.7">Parametrelerinizi kontrol edin.</small>
            </div>`;
        }
    }

    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function onStatXColumnChange(widgetId, statType) {
        const analysisInfo = typeof getAnalysisRequirements === 'function' ?
            getAnalysisRequirements(statType) : {};
        if (analysisInfo.needsGroupSelection) {
            populateGroupSelectors(widgetId);
        }
        refreshStatWidget(widgetId);
    }

    function populateGroupSelectors(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const datasetId = widget.dataset.datasetId;
        const dataset = VIZ_STATE.getDatasetById(datasetId);
        if (!dataset) return;

        const xColSelect = document.getElementById(`${widgetId}_xCol`);
        const group1Select = document.getElementById(`${widgetId}_group1`);
        const group2Select = document.getElementById(`${widgetId}_group2`);

        if (!xColSelect || !group1Select || !group2Select) return;

        const xCol = xColSelect.value;
        if (!xCol) return;

        let uniqueValues = [...new Set(dataset.data.map(row => row[xCol]))].filter(v => v !== null && v !== undefined && v !== '');
        const isNumeric = uniqueValues.length > 0 && uniqueValues.every(v => !isNaN(parseFloat(v)));
        if (isNumeric) {
            uniqueValues.sort((a, b) => parseFloat(a) - parseFloat(b));
        } else {
            uniqueValues.sort((a, b) => String(a).localeCompare(String(b), 'tr', { sensitivity: 'base' }));
        }

        const options = uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
        group1Select.innerHTML = '<option value="">-- Grup 1 Seçin --</option>' + options;
        group2Select.innerHTML = '<option value="">-- Grup 2 Seçin --</option>' + options;

        if (uniqueValues.length >= 2) {
            group1Select.value = uniqueValues[0];
            group2Select.value = uniqueValues[1];
        }
    }

    async function refreshStatWidget(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const statType = widget.dataset.statType;
        const datasetId = widget.dataset.datasetId;
        const xColSelect = document.getElementById(`${widgetId}_xCol`);
        const yColSelect = document.getElementById(`${widgetId}_yCol`);
        const xCol = xColSelect ? xColSelect.value : null;
        const yCol = yColSelect ? yColSelect.value : null;

        widget.dataset.xCol = xCol || '';
        widget.dataset.yCol = yCol || '';

        await runStatForWidget(widgetId, statType, datasetId, xCol, yCol);
    }

    function embedStatToChart(widgetId) {
        if (!VIZ_STATE.selectedChart) {
            showToast('Önce bir grafik seçin', 'warning');
            return;
        }

        const statWidget = document.getElementById(widgetId);
        const chartWidget = document.getElementById(VIZ_STATE.selectedChart);
        if (!statWidget || !chartWidget) return;

        const statBody = document.getElementById(`${widgetId}_body`);
        if (!statBody) return;

        const existingEmbed = chartWidget.querySelector('.viz-stat-embed');
        if (existingEmbed) existingEmbed.remove();

        const embed = document.createElement('div');
        embed.className = 'viz-stat-embed';
        embed.innerHTML = `
            <div class="viz-stat-embed-header">
                <span>${statWidget.querySelector('.viz-widget-title').textContent}</span>
                <button onclick="this.closest('.viz-stat-embed').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-embed-content">${statBody.innerHTML}</div>
        `;
        embed.style.cssText = 'position:absolute;right:10px;bottom:40px;width:250px;max-height:200px;overflow:auto;cursor:move;background:rgba(255,255,255,0.95);border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';

        chartWidget.appendChild(embed);
        showToast('İstatistik grafiğe gömüldü', 'success');
    }

    function removeWidget(widgetId) {
        const widget = document.getElementById(widgetId);
        if (widget) {
            widget.remove();
            console.log(`🗑️ Widget kaldırıldı: ${widgetId}`);
            VIZ_STATE.charts = VIZ_STATE.charts.filter(c => c.id !== widgetId);
            if (VIZ_STATE.echartsInstances && VIZ_STATE.echartsInstances[widgetId]) {
                VIZ_STATE.echartsInstances[widgetId].dispose();
                delete VIZ_STATE.echartsInstances[widgetId];
            }
            if (typeof updateEmptyState === 'function') updateEmptyState();
        }
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.createStatWidget = createStatWidget;
    window.runStatForWidget = runStatForWidget;
    window.onStatXColumnChange = onStatXColumnChange;
    window.populateGroupSelectors = populateGroupSelectors;
    window.refreshStatWidget = refreshStatWidget;
    window.embedStatToChart = embedStatToChart;
    window.removeWidget = removeWidget;

    console.log('✅ viz-widget-core.js loaded - Widget lifecycle engine ready');
})();
