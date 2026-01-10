/**
 * Macro Diff Trace - Opradox Macro Studio Pro
 * FAZ-4: Diff + Decision Trace
 * 
 * ALLOWLIST: Diff renderer, Report panel
 * YASAKLAR: Veri değiştirmek, Backend çağrısı
 */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================

    const MAX_DIFF_ROWS_DISPLAY = 50; // Görüntülenecek maksimum diff satırı
    const MAX_SAMPLE_ROWS = 5; // Örnek satır sayısı

    // ============================================================
    // TEXTS (TR/EN)
    // ============================================================

    const DIFF_TEXTS = {
        tr: {
            diff_title: 'Değişiklik Özeti',
            rows_added: 'satır eklendi',
            rows_removed: 'satır silindi',
            cols_changed: 'sütun değişti',
            cols_added: 'yeni sütun',
            cols_removed: 'sütun kaldırıldı',
            detailed_diff: 'Detaylı Diff',
            decision_trace: 'İşlem Geçmişi',
            what_happened: 'Ne yapıldı',
            result: 'Sonuç',
            duration: 'Süre',
            risk_score: 'Risk Skoru',
            data_loss_risk: 'Veri Kaybı Riski',
            type_mismatch_risk: 'Tip Uyumsuzluğu',
            estimated_time: 'Tahmini Süre',
            no_changes: 'Değişiklik yok',
            collapse_diff: 'Daralt',
            expand_diff: 'Genişlet',
            show_more: 'Daha fazla göster',
            row: 'Satır',
            before: 'Önce',
            after: 'Sonra',
            unchanged: 'Değişmedi',
            performance_estimate: 'Performans Tahmini',
            risk_analysis: 'Risk Analizi',
            low_risk: 'Düşük',
            medium_risk: 'Orta',
            high_risk: 'Yüksek',
            block_summary: 'Blok Özeti',
            total_time: 'Toplam Süre',
            rows_processed: 'İşlenen Satır'
        },
        en: {
            diff_title: 'Change Summary',
            rows_added: 'rows added',
            rows_removed: 'rows removed',
            cols_changed: 'columns changed',
            cols_added: 'new columns',
            cols_removed: 'columns removed',
            detailed_diff: 'Detailed Diff',
            decision_trace: 'Decision Trace',
            what_happened: 'What happened',
            result: 'Result',
            duration: 'Duration',
            risk_score: 'Risk Score',
            data_loss_risk: 'Data Loss Risk',
            type_mismatch_risk: 'Type Mismatch',
            estimated_time: 'Estimated Time',
            no_changes: 'No changes',
            collapse_diff: 'Collapse',
            expand_diff: 'Expand',
            show_more: 'Show more',
            row: 'Row',
            before: 'Before',
            after: 'After',
            unchanged: 'Unchanged',
            performance_estimate: 'Performance Estimate',
            risk_analysis: 'Risk Analysis',
            low_risk: 'Low',
            medium_risk: 'Medium',
            high_risk: 'High',
            block_summary: 'Block Summary',
            total_time: 'Total Time',
            rows_processed: 'Rows Processed'
        }
    };

    // Block type descriptions for decision trace
    const BLOCK_DESCRIPTIONS = {
        tr: {
            filter: 'Filtre uygulandı',
            if_condition: 'Koşul kontrolü yapıldı',
            computed: 'Hesaplama yapıldı',
            formula: 'Formül uygulandı',
            text_transform: 'Metin dönüşümü uygulandı',
            date_transform: 'Tarih dönüşümü uygulandı',
            remove_duplicates: 'Tekrar eden satırlar silindi',
            remove_nulls: 'Boş satırlar silindi',
            grouping: 'Gruplama yapıldı',
            pivot: 'Pivot tablo oluşturuldu',
            sum_column: 'Sütun toplamı hesaplandı',
            count_rows: 'Satır sayısı hesaplandı',
            avg_column: 'Ortalama hesaplandı',
            // FAZ-MS-P2: New block types
            lookup_join: 'VLOOKUP/Join uygulandı',
            union: 'Tablolar birleştirildi',
            diff: 'Fark analizi yapıldı',
            validate: 'Doğrulama yapıldı',
            what_if_variable: 'Senaryo değişkeni tanımlandı',
            if_else: 'Koşullu değer atandı',
            window_function: 'Pencere fonksiyonu uygulandı',
            time_series: 'Zaman serisi analizi yapıldı',
            advanced_computed: 'İleri hesaplama yapıldı',
            sort: 'Sıralama yapıldı',
            chart: 'Grafik oluşturuldu',
            conditional_format: 'Koşullu format uygulandı',
            output_settings: 'Çıktı ayarları belirlendi'
        },
        en: {
            filter: 'Filter applied',
            if_condition: 'Condition checked',
            computed: 'Calculation performed',
            formula: 'Formula applied',
            text_transform: 'Text transformation applied',
            date_transform: 'Date transformation applied',
            remove_duplicates: 'Duplicate rows removed',
            remove_nulls: 'Empty rows removed',
            grouping: 'Grouping performed',
            pivot: 'Pivot table created',
            sum_column: 'Column sum calculated',
            count_rows: 'Row count calculated',
            avg_column: 'Average calculated',
            // FAZ-MS-P2: New block types
            lookup_join: 'VLOOKUP/Join applied',
            union: 'Tables merged',
            diff: 'Difference analysis performed',
            validate: 'Validation performed',
            what_if_variable: 'What-if variable defined',
            if_else: 'Conditional value assigned',
            window_function: 'Window function applied',
            time_series: 'Time series analysis performed',
            advanced_computed: 'Advanced calculation performed',
            sort: 'Sorting applied',
            chart: 'Chart created',
            conditional_format: 'Conditional format applied',
            output_settings: 'Output settings configured'
        }
    };

    // ============================================================
    // STATE
    // ============================================================

    const DIFF_STATE = {
        currentLang: 'tr',
        lastDiff: null,
        lastTrace: null,
        isExpanded: false
    };

    // ============================================================
    // LANGUAGE HELPER
    // ============================================================

    function getText(key) {
        const lang = DIFF_STATE.currentLang || 'tr';
        return DIFF_TEXTS[lang]?.[key] || DIFF_TEXTS['tr']?.[key] || key;
    }

    function getBlockDesc(blockType) {
        const lang = DIFF_STATE.currentLang || 'tr';
        return BLOCK_DESCRIPTIONS[lang]?.[blockType] || BLOCK_DESCRIPTIONS['tr']?.[blockType] || blockType;
    }

    // ============================================================
    // DIFF GENERATION
    // ============================================================

    /**
     * Generate diff between two datasets
     * @param {Array} before - Data before transformation
     * @param {Array} after - Data after transformation
     * @returns {Object} Diff result
     */
    function generateDiff(before, after) {
        const beforeRows = before || [];
        const afterRows = after || [];

        // Get columns
        const beforeCols = beforeRows.length > 0 ? Object.keys(beforeRows[0]) : [];
        const afterCols = afterRows.length > 0 ? Object.keys(afterRows[0]) : [];

        // Column changes
        const addedCols = afterCols.filter(c => !beforeCols.includes(c));
        const removedCols = beforeCols.filter(c => !afterCols.includes(c));
        const commonCols = beforeCols.filter(c => afterCols.includes(c));

        // Row changes
        const rowsAdded = Math.max(0, afterRows.length - beforeRows.length);
        const rowsRemoved = Math.max(0, beforeRows.length - afterRows.length);

        // Sample changed rows (for display)
        const changedSamples = [];
        const minLen = Math.min(beforeRows.length, afterRows.length, MAX_SAMPLE_ROWS);

        for (let i = 0; i < minLen; i++) {
            const beforeRow = beforeRows[i];
            const afterRow = afterRows[i];
            const changes = {};
            let hasChanges = false;

            commonCols.forEach(col => {
                if (beforeRow[col] !== afterRow[col]) {
                    changes[col] = {
                        before: beforeRow[col],
                        after: afterRow[col]
                    };
                    hasChanges = true;
                }
            });

            if (hasChanges || addedCols.length > 0) {
                changedSamples.push({
                    rowIndex: i,
                    before: beforeRow,
                    after: afterRow,
                    changes: changes,
                    newCols: addedCols.reduce((acc, col) => {
                        acc[col] = afterRow[col];
                        return acc;
                    }, {})
                });
            }
        }

        // Calculate overall change stats
        const totalCellsBefore = beforeRows.length * beforeCols.length;
        const totalCellsAfter = afterRows.length * afterCols.length;
        const changePercent = totalCellsBefore > 0
            ? Math.round(Math.abs(totalCellsAfter - totalCellsBefore) / totalCellsBefore * 100)
            : 0;

        const diff = {
            summary: {
                rowsBefore: beforeRows.length,
                rowsAfter: afterRows.length,
                rowsAdded: rowsAdded,
                rowsRemoved: rowsRemoved,
                colsBefore: beforeCols.length,
                colsAfter: afterCols.length,
                colsAdded: addedCols,
                colsRemoved: removedCols,
                changePercent: changePercent
            },
            samples: changedSamples,
            hasChanges: rowsAdded > 0 || rowsRemoved > 0 || addedCols.length > 0 || removedCols.length > 0 || changedSamples.length > 0
        };

        DIFF_STATE.lastDiff = diff;
        return diff;
    }

    // ============================================================
    // DECISION TRACE
    // ============================================================

    /**
     * Build decision trace from pipeline execution
     * @param {Array} blocks - Pipeline blocks
     * @param {Array} stepResults - Results after each step {before, after, duration}
     * @returns {Array} Decision trace entries
     */
    function buildDecisionTrace(blocks, stepResults) {
        const trace = [];

        blocks.forEach((block, index) => {
            const stepResult = stepResults[index] || {};
            const before = stepResult.before || [];
            const after = stepResult.after || [];
            const duration = stepResult.duration || 0;

            // Generate block-specific explanation
            const explanation = generateBlockExplanation(block, before, after);
            const risk = calculateRiskScore(block, before, after);
            const perfEstimate = estimatePerformance(block, before.length);

            trace.push({
                stepIndex: index + 1,
                blockType: block.type,
                blockConfig: block.config,
                description: getBlockDesc(block.type),
                explanation: explanation,
                rowsBefore: before.length,
                rowsAfter: after.length,
                rowsDelta: after.length - before.length,
                duration: duration,
                riskScore: risk,
                performanceEstimate: perfEstimate
            });
        });

        DIFF_STATE.lastTrace = trace;
        return trace;
    }

    /**
     * Generate human-readable explanation for a block operation
     */
    function generateBlockExplanation(block, before, after) {
        const config = block.config || {};
        const lang = DIFF_STATE.currentLang || 'tr';
        const rowDelta = after.length - before.length;

        switch (block.type) {
            case 'filter':
                return lang === 'tr'
                    ? `"${config.column}" ${config.operator} "${config.value}" koşuluna göre filtrelendi → ${Math.abs(rowDelta)} satır ${rowDelta < 0 ? 'kaldırıldı' : 'eklendi'}`
                    : `Filtered by "${config.column}" ${config.operator} "${config.value}" → ${Math.abs(rowDelta)} rows ${rowDelta < 0 ? 'removed' : 'added'}`;

            case 'if_condition':
                return lang === 'tr'
                    ? `"${config.column}" ${config.operator} "${config.value}" koşulu kontrol edildi → ${after.length} satır kaldı`
                    : `Checked "${config.column}" ${config.operator} "${config.value}" → ${after.length} rows remain`;

            case 'computed':
                return lang === 'tr'
                    ? `"${config.name}" sütunu hesaplandı (${config.operation} işlemi)`
                    : `Calculated "${config.name}" column (${config.operation} operation)`;

            case 'text_transform':
                return lang === 'tr'
                    ? `"${config.column}" sütununa ${config.transform_type} dönüşümü uygulandı`
                    : `Applied ${config.transform_type} transformation to "${config.column}"`;

            case 'remove_duplicates':
                return lang === 'tr'
                    ? `${Math.abs(rowDelta)} tekrar eden satır silindi`
                    : `${Math.abs(rowDelta)} duplicate rows removed`;

            case 'remove_nulls':
                return lang === 'tr'
                    ? `${Math.abs(rowDelta)} boş satır silindi`
                    : `${Math.abs(rowDelta)} empty rows removed`;

            case 'grouping':
                const groupBy = (config.group_by || []).join(', ');
                return lang === 'tr'
                    ? `"${groupBy}" alanlarına göre gruplandı → ${after.length} grup oluştu`
                    : `Grouped by "${groupBy}" → ${after.length} groups created`;

            case 'sum_column':
            case 'count_rows':
            case 'avg_column':
                return lang === 'tr'
                    ? `Toplama işlemi yapıldı → 1 özet satır`
                    : `Aggregation performed → 1 summary row`;

            default:
                return lang === 'tr'
                    ? `${rowDelta >= 0 ? '+' : ''}${rowDelta} satır değişiklik`
                    : `${rowDelta >= 0 ? '+' : ''}${rowDelta} row change`;
        }
    }

    // ============================================================
    // RISK ANALYSIS
    // ============================================================

    /**
     * Calculate risk score for a block operation
     * @returns {Object} {dataLoss: 0-10, typeMismatch: 0-10, overall: 0-10}
     */
    function calculateRiskScore(block, before, after) {
        let dataLossRisk = 0;
        let typeMismatchRisk = 0;

        const rowDelta = after.length - before.length;
        const rowLossPercent = before.length > 0 ? Math.abs(Math.min(0, rowDelta)) / before.length * 100 : 0;

        // Data loss risk
        if (rowLossPercent > 50) dataLossRisk = 8;
        else if (rowLossPercent > 25) dataLossRisk = 5;
        else if (rowLossPercent > 10) dataLossRisk = 3;
        else if (rowLossPercent > 0) dataLossRisk = 1;

        // Type-specific risks
        switch (block.type) {
            case 'remove_duplicates':
            case 'remove_nulls':
                dataLossRisk = Math.max(dataLossRisk, 4);
                break;
            case 'filter':
            case 'if_condition':
                dataLossRisk = Math.max(dataLossRisk, 3);
                break;
            case 'computed':
            case 'formula':
                typeMismatchRisk = 3; // Hesaplama hataları olabilir
                break;
            case 'date_transform':
                typeMismatchRisk = 5; // Tarih format sorunları
                break;
            case 'grouping':
            case 'pivot':
                dataLossRisk = Math.max(dataLossRisk, 6); // Satır kaybı yüksek
                break;
        }

        const overall = Math.round((dataLossRisk + typeMismatchRisk) / 2);

        return {
            dataLoss: dataLossRisk,
            typeMismatch: typeMismatchRisk,
            overall: overall,
            level: overall <= 3 ? 'low' : overall <= 6 ? 'medium' : 'high'
        };
    }

    // ============================================================
    // PERFORMANCE ESTIMATION
    // ============================================================

    /**
     * Estimate performance for a block operation
     * @param {Object} block - The block
     * @param {number} rowCount - Number of rows
     * @returns {Object} {estimatedMs, memoryMB}
     */
    function estimatePerformance(block, rowCount) {
        // Base estimates (ms per 1000 rows)
        const baseEstimates = {
            filter: 2,
            if_condition: 2,
            computed: 5,
            formula: 10,
            text_transform: 3,
            date_transform: 5,
            remove_duplicates: 8,
            remove_nulls: 2,
            grouping: 15,
            pivot: 20,
            sum_column: 1,
            count_rows: 0.5,
            avg_column: 1
        };

        const baseMsPerK = baseEstimates[block.type] || 5;
        const estimatedMs = Math.round((rowCount / 1000) * baseMsPerK);

        // Memory estimate (rough)
        const bytesPerRow = 200; // Approximate
        const memoryMB = Math.round((rowCount * bytesPerRow) / (1024 * 1024) * 10) / 10;

        return {
            estimatedMs: estimatedMs,
            estimatedStr: estimatedMs < 1000 ? `${estimatedMs}ms` : `${(estimatedMs / 1000).toFixed(1)}s`,
            memoryMB: memoryMB,
            memoryStr: `~${memoryMB}MB`
        };
    }

    // ============================================================
    // UI RENDERING
    // ============================================================

    /**
     * Render diff panel
     * @param {Object} diffResult - Result from generateDiff
     * @param {string} containerId - Container element ID
     */
    function renderDiffPanel(diffResult, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[MacroDiffTrace] Container not found:', containerId);
            return;
        }

        const s = diffResult.summary;

        if (!diffResult.hasChanges) {
            container.innerHTML = `
                <div class="diff-panel diff-no-changes">
                    <i class="fas fa-check-circle"></i>
                    <span>${getText('no_changes')}</span>
                </div>
            `;
            return;
        }

        let html = `
            <div class="diff-panel">
                <div class="diff-header" onclick="MacroDiffTrace.toggleExpand()">
                    <h4><i class="fas fa-code-compare"></i> ${getText('diff_title')}</h4>
                    <i class="fas fa-chevron-${DIFF_STATE.isExpanded ? 'up' : 'down'}"></i>
                </div>
                
                <div class="diff-summary">
                    <div class="diff-stat diff-stat-add">
                        <span class="diff-stat-icon">🟩</span>
                        <span class="diff-stat-value">+${s.rowsAdded}</span>
                        <span class="diff-stat-label">${getText('rows_added')}</span>
                    </div>
                    <div class="diff-stat diff-stat-remove">
                        <span class="diff-stat-icon">🟥</span>
                        <span class="diff-stat-value">-${s.rowsRemoved}</span>
                        <span class="diff-stat-label">${getText('rows_removed')}</span>
                    </div>
                    ${s.colsAdded.length > 0 ? `
                    <div class="diff-stat diff-stat-col">
                        <span class="diff-stat-icon">🟦</span>
                        <span class="diff-stat-value">+${s.colsAdded.length}</span>
                        <span class="diff-stat-label">${getText('cols_added')}</span>
                    </div>
                    ` : ''}
                    ${s.colsRemoved.length > 0 ? `
                    <div class="diff-stat diff-stat-col-remove">
                        <span class="diff-stat-icon">🟧</span>
                        <span class="diff-stat-value">-${s.colsRemoved.length}</span>
                        <span class="diff-stat-label">${getText('cols_removed')}</span>
                    </div>
                    ` : ''}
                </div>
        `;

        // Detailed diff (expandable)
        if (DIFF_STATE.isExpanded && diffResult.samples.length > 0) {
            html += `
                <div class="diff-details">
                    <h5><i class="fas fa-list"></i> ${getText('detailed_diff')}</h5>
                    <div class="diff-samples">
            `;

            diffResult.samples.slice(0, MAX_DIFF_ROWS_DISPLAY).forEach(sample => {
                html += renderDiffRow(sample);
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    /**
     * Render a single diff row
     */
    function renderDiffRow(sample) {
        let html = `<div class="diff-row">`;
        html += `<div class="diff-row-index">${getText('row')} ${sample.rowIndex + 1}</div>`;

        // Show changes
        Object.keys(sample.changes).forEach(col => {
            const change = sample.changes[col];
            html += `
                <div class="diff-change">
                    <span class="diff-col-name">${col}:</span>
                    <span class="diff-before">🟥 ${formatValue(change.before)}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-after">🟩 ${formatValue(change.after)}</span>
                </div>
            `;
        });

        // Show new columns
        Object.keys(sample.newCols).forEach(col => {
            html += `
                <div class="diff-change diff-new-col">
                    <span class="diff-col-name">${col}:</span>
                    <span class="diff-after">🟩 ${formatValue(sample.newCols[col])}</span>
                    <span class="diff-badge">NEW</span>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    /**
     * Render decision trace panel
     * @param {Array} trace - Result from buildDecisionTrace
     * @param {string} containerId - Container element ID
     */
    function renderTracePanel(trace, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[MacroDiffTrace] Trace container not found:', containerId);
            return;
        }

        if (!trace || trace.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Calculate totals
        const totalDuration = trace.reduce((acc, t) => acc + t.duration, 0);
        const avgRisk = Math.round(trace.reduce((acc, t) => acc + t.riskScore.overall, 0) / trace.length);

        let html = `
            <div class="trace-panel">
                <div class="trace-header">
                    <h4><i class="fas fa-history"></i> ${getText('decision_trace')}</h4>
                    <div class="trace-totals">
                        <span><i class="fas fa-clock"></i> ${totalDuration}ms</span>
                        <span class="risk-badge risk-${avgRisk <= 3 ? 'low' : avgRisk <= 6 ? 'medium' : 'high'}">
                            <i class="fas fa-shield-alt"></i> ${getText('risk_score')}: ${avgRisk}/10
                        </span>
                    </div>
                </div>
                
                <div class="trace-steps">
        `;

        trace.forEach((step, idx) => {
            const riskClass = step.riskScore.level;
            html += `
                <div class="trace-step">
                    <div class="trace-step-number">${step.stepIndex}</div>
                    <div class="trace-step-content">
                        <div class="trace-step-header">
                            <strong>${step.description}</strong>
                            <span class="trace-duration">${step.duration}ms</span>
                        </div>
                        <div class="trace-step-explanation">
                            ${step.explanation}
                        </div>
                        <div class="trace-step-meta">
                            <span class="trace-rows">
                                ${step.rowsBefore} → ${step.rowsAfter} ${getText('rows_processed').toLowerCase()}
                                <span class="trace-delta ${step.rowsDelta >= 0 ? 'positive' : 'negative'}">
                                    (${step.rowsDelta >= 0 ? '+' : ''}${step.rowsDelta})
                                </span>
                            </span>
                            <span class="risk-indicator risk-${riskClass}">
                                <i class="fas fa-exclamation-triangle"></i> ${getText(riskClass + '_risk')}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // ============================================================
    // HELPERS
    // ============================================================

    function formatValue(val) {
        if (val === null || val === undefined) return '<em>null</em>';
        if (typeof val === 'object') return JSON.stringify(val);
        const str = String(val);
        return str.length > 30 ? str.substring(0, 27) + '...' : str;
    }

    function toggleExpand() {
        DIFF_STATE.isExpanded = !DIFF_STATE.isExpanded;
        if (DIFF_STATE.lastDiff) {
            const container = document.getElementById('embeddedMacroDiffPanel') ||
                document.getElementById('macroDiffPanel');
            if (container) {
                renderDiffPanel(DIFF_STATE.lastDiff, container.id);
            }
        }
    }

    function setLanguage(lang) {
        DIFF_STATE.currentLang = lang;
    }

    // ============================================================
    // CSS INJECTION
    // ============================================================

    function injectStyles() {
        if (document.getElementById('macro-diff-trace-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'macro-diff-trace-styles';
        styles.textContent = `
            /* Diff Panel */
            .diff-panel {
                background: var(--gm-card-bg, #1e1e2e);
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                border: 1px solid var(--gm-border, #333);
            }
            
            .diff-panel.diff-no-changes {
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--gm-success, #22c55e);
                padding: 15px;
            }
            
            .diff-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--gm-border, #333);
                margin-bottom: 10px;
            }
            
            .diff-header h4 {
                margin: 0;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .diff-summary {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .diff-stat {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: rgba(0,0,0,0.2);
                border-radius: 20px;
                font-size: 0.85rem;
            }
            
            .diff-stat-value {
                font-weight: 600;
            }
            
            .diff-stat-add .diff-stat-value { color: #22c55e; }
            .diff-stat-remove .diff-stat-value { color: #ef4444; }
            .diff-stat-col .diff-stat-value { color: #3b82f6; }
            
            /* Diff Details */
            .diff-details {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid var(--gm-border, #333);
            }
            
            .diff-details h5 {
                margin: 0 0 10px 0;
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            .diff-samples {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .diff-row {
                padding: 8px 12px;
                background: rgba(0,0,0,0.15);
                border-radius: 6px;
                font-size: 0.85rem;
            }
            
            .diff-row-index {
                font-weight: 600;
                margin-bottom: 5px;
                color: var(--gm-text-muted, #888);
            }
            
            .diff-change {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                margin: 4px 0;
            }
            
            .diff-col-name {
                font-weight: 500;
                min-width: 80px;
            }
            
            .diff-before {
                color: #ef4444;
                text-decoration: line-through;
                opacity: 0.8;
            }
            
            .diff-after {
                color: #22c55e;
            }
            
            .diff-arrow {
                color: var(--gm-text-muted, #888);
            }
            
            .diff-badge {
                background: #3b82f6;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
            }
            
            /* Trace Panel */
            .trace-panel {
                background: var(--gm-card-bg, #1e1e2e);
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                border: 1px solid var(--gm-border, #333);
            }
            
            .trace-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--gm-border, #333);
                margin-bottom: 10px;
            }
            
            .trace-header h4 {
                margin: 0;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .trace-totals {
                display: flex;
                gap: 15px;
                font-size: 0.85rem;
            }
            
            .risk-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.8rem;
            }
            
            .risk-badge.risk-low { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
            .risk-badge.risk-medium { background: rgba(249, 115, 22, 0.2); color: #f97316; }
            .risk-badge.risk-high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
            
            .trace-steps {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .trace-step {
                display: flex;
                gap: 12px;
                padding: 10px;
                background: rgba(0,0,0,0.15);
                border-radius: 8px;
            }
            
            .trace-step-number {
                width: 28px;
                height: 28px;
                background: var(--gm-primary, #8b5cf6);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.85rem;
                flex-shrink: 0;
            }
            
            .trace-step-content {
                flex: 1;
            }
            
            .trace-step-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }
            
            .trace-duration {
                font-size: 0.8rem;
                color: var(--gm-text-muted, #888);
            }
            
            .trace-step-explanation {
                font-size: 0.85rem;
                color: var(--gm-text-muted, #aaa);
                margin-bottom: 6px;
            }
            
            .trace-step-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.8rem;
            }
            
            .trace-rows {
                color: var(--gm-text-muted, #888);
            }
            
            .trace-delta {
                margin-left: 5px;
            }
            
            .trace-delta.positive { color: #22c55e; }
            .trace-delta.negative { color: #ef4444; }
            
            .risk-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.75rem;
            }
            
            .risk-indicator.risk-low { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
            .risk-indicator.risk-medium { background: rgba(249, 115, 22, 0.1); color: #f97316; }
            .risk-indicator.risk-high { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        `;

        document.head.appendChild(styles);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        console.log('[MacroDiffTrace] Initializing...');
        injectStyles();

        // Sync language with MacroStudio
        if (typeof window.MacroStudio !== 'undefined') {
            const state = window.MacroStudio.getState?.();
            if (state?.currentLang) {
                DIFF_STATE.currentLang = state.currentLang;
            }
        }

        console.log('[MacroDiffTrace] Initialized');
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.MacroDiffTrace = {
        init,
        generateDiff,
        buildDecisionTrace,
        renderDiffPanel,
        renderTracePanel,
        calculateRiskScore,
        estimatePerformance,
        toggleExpand,
        setLanguage,
        getState: () => DIFF_STATE,
        getLastDiff: () => DIFF_STATE.lastDiff,
        getLastTrace: () => DIFF_STATE.lastTrace
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})();
