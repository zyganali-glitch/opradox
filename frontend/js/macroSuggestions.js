/**
 * Macro Suggestions - Opradox Macro Studio Pro
 * FAZ-5: Smart Suggestions & NBA (Next Best Action)
 * 
 * ALLOWLIST: Rule-based suggestions, Soft glow UI
 * YASAKLAR: Dış AI, Ücretli API
 */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================

    const MAX_SUGGESTIONS = 3; // Aynı anda gösterilecek maksimum öneri
    const SUGGESTION_COOLDOWN_MS = 30000; // Reddedilen öneri için bekleme süresi

    // ============================================================
    // SUGGESTION RULES
    // ============================================================

    const SUGGESTION_RULES = [
        {
            id: 'groupby_needs_aggregate',
            trigger: (ctx) => {
                // GROUP BY bloğu var ama aggregate yok
                const hasGroupBy = ctx.blocks.some(b => b.type === 'grouping');
                const hasAggregate = ctx.blocks.some(b =>
                    ['sum_column', 'count_rows', 'avg_column'].includes(b.type)
                );
                return hasGroupBy && !hasAggregate;
            },
            suggestion: {
                icon: 'fa-calculator',
                color: '#8b5cf6',
                textKey: 'suggest_add_aggregate',
                action: {
                    type: 'add_block',
                    blockType: 'sum_column'
                }
            },
            priority: 10
        },
        {
            id: 'filter_may_empty',
            trigger: (ctx) => {
                // FILTER bloğu var ve strict koşul kullanılmış
                const hasStrictFilter = ctx.blocks.some(b =>
                    b.type === 'filter' &&
                    ['equals', 'not_equals'].includes(b.config?.operator)
                );
                return hasStrictFilter && ctx.rowCount > 100;
            },
            suggestion: {
                icon: 'fa-exclamation-circle',
                color: '#f59e0b',
                textKey: 'suggest_check_empty',
                action: {
                    type: 'add_block',
                    blockType: 'if_condition',
                    config: { operator: 'is_null' }
                }
            },
            priority: 8
        },
        {
            id: 'numeric_column_sum',
            trigger: (ctx) => {
                // Sayısal sütun seçildi ama toplama yok
                const hasNumericCols = ctx.columns.some(col => col.isNumeric);
                const hasAggregate = ctx.blocks.some(b =>
                    ['sum_column', 'avg_column'].includes(b.type)
                );
                return hasNumericCols && ctx.blocks.length > 0 && !hasAggregate;
            },
            suggestion: {
                icon: 'fa-plus',
                color: '#22c55e',
                textKey: 'suggest_numeric_sum',
                action: {
                    type: 'add_block',
                    blockType: 'sum_column'
                }
            },
            priority: 5
        },
        {
            id: 'date_column_extract',
            trigger: (ctx) => {
                // Tarih sütunu var ama date transform yok
                const hasDateCols = ctx.columns.some(col => col.isDate);
                const hasDateTransform = ctx.blocks.some(b => b.type === 'date_transform');
                return hasDateCols && !hasDateTransform;
            },
            suggestion: {
                icon: 'fa-calendar-days',
                color: '#9a3050',
                textKey: 'suggest_date_extract',
                action: {
                    type: 'add_block',
                    blockType: 'date_transform'
                }
            },
            priority: 4
        },
        {
            id: 'duplicates_detected',
            trigger: (ctx) => {
                // Veri içinde tekrar eden değerler var
                if (!ctx.previewRows || ctx.previewRows.length < 10) return false;
                const firstCol = ctx.columns[0]?.name;
                if (!firstCol) return false;

                const values = ctx.previewRows.map(r => r[firstCol]);
                const uniqueCount = new Set(values).size;
                const duplicateRatio = 1 - (uniqueCount / values.length);

                return duplicateRatio > 0.2; // %20'den fazla tekrar
            },
            suggestion: {
                icon: 'fa-clone',
                color: '#f59e0b',
                textKey: 'suggest_duplicates',
                action: {
                    type: 'add_block',
                    blockType: 'remove_duplicates'
                }
            },
            priority: 6
        },
        {
            id: 'nulls_detected',
            trigger: (ctx) => {
                // Veri içinde boş değerler var
                if (!ctx.previewRows || ctx.previewRows.length < 5) return false;

                const hasNulls = ctx.previewRows.some(row =>
                    Object.values(row).some(v => v == null || v === '')
                );

                const hasNullRemover = ctx.blocks.some(b => b.type === 'remove_nulls');
                return hasNulls && !hasNullRemover;
            },
            suggestion: {
                icon: 'fa-eraser',
                color: '#ef4444',
                textKey: 'suggest_nulls',
                action: {
                    type: 'add_block',
                    blockType: 'remove_nulls'
                }
            },
            priority: 7
        },
        {
            id: 'text_column_transform',
            trigger: (ctx) => {
                // Metin sütunu var ve whitespace içeriyor olabilir
                const hasTextCols = ctx.columns.some(col => col.isText);
                const hasTextTransform = ctx.blocks.some(b => b.type === 'text_transform');
                return hasTextCols && ctx.blocks.length > 0 && !hasTextTransform;
            },
            suggestion: {
                icon: 'fa-font',
                color: '#84cc16',
                textKey: 'suggest_text_clean',
                action: {
                    type: 'add_block',
                    blockType: 'text_transform',
                    config: { transform_type: 'trim' }
                }
            },
            priority: 3
        }
    ];

    // ============================================================
    // TEXTS (TR/EN)
    // ============================================================

    const SUGGEST_TEXTS = {
        tr: {
            suggest_title: 'Akıllı Öneri',
            suggest_add_aggregate: 'Gruplama sonrası toplama işlemi önerilir',
            suggest_check_empty: 'Filtre sonucu boş olabilir, kontrol ekleyin',
            suggest_numeric_sum: 'Sayısal sütun için toplama uygundur',
            suggest_date_extract: 'Tarih sütunundan yıl/ay çıkarabilirsiniz',
            suggest_duplicates: 'Tekrar eden değerler tespit edildi',
            suggest_nulls: 'Boş değerler mevcut, temizleme önerilir',
            suggest_text_clean: 'Metin sütunları temizlenebilir',
            suggest_apply: 'Uygula',
            suggest_dismiss: 'Reddet',
            suggest_dismissed: 'Öneri reddedildi'
        },
        en: {
            suggest_title: 'Smart Suggestion',
            suggest_add_aggregate: 'Adding aggregation after grouping is recommended',
            suggest_check_empty: 'Filter result may be empty, consider adding a check',
            suggest_numeric_sum: 'Sum operation is suitable for numeric column',
            suggest_date_extract: 'You can extract year/month from date column',
            suggest_duplicates: 'Duplicate values detected',
            suggest_nulls: 'Empty values present, cleaning recommended',
            suggest_text_clean: 'Text columns can be cleaned',
            suggest_apply: 'Apply',
            suggest_dismiss: 'Dismiss',
            suggest_dismissed: 'Suggestion dismissed'
        }
    };

    // ============================================================
    // STATE
    // ============================================================

    const SUGGEST_STATE = {
        currentLang: 'tr',
        activeSuggestions: [],
        dismissedSuggestions: {}, // {ruleId: dismissedTimestamp}
        lastContext: null
    };

    // ============================================================
    // LANGUAGE HELPER
    // ============================================================

    function getText(key) {
        const lang = SUGGEST_STATE.currentLang || 'tr';
        return SUGGEST_TEXTS[lang]?.[key] || SUGGEST_TEXTS['tr']?.[key] || key;
    }

    // ============================================================
    // CONTEXT BUILDER
    // ============================================================

    /**
     * Build context for rule evaluation
     */
    function buildContext() {
        const macroState = window.MacroStudio?.getState?.() || {};
        const pipelineState = window.MacroPipeline?.getState?.() || {};

        // Detect column types
        const columns = (macroState.columns || []).map(colName => {
            const samples = (macroState.previewRows || []).slice(0, 10).map(r => r[colName]);

            const isNumeric = samples.every(s => s == null || !isNaN(parseFloat(s)));
            const isDate = samples.some(s => s && !isNaN(Date.parse(s)));
            const isText = !isNumeric && !isDate;

            return {
                name: colName,
                isNumeric,
                isDate,
                isText
            };
        });

        return {
            blocks: pipelineState.blocks || [],
            columns: columns,
            rowCount: macroState.rowCount || 0,
            colCount: macroState.colCount || 0,
            previewRows: macroState.previewRows || [],
            fileName: macroState.currentFileName || '',
            hasFile: !!macroState.currentFile
        };
    }

    // ============================================================
    // RULE EVALUATION
    // ============================================================

    /**
     * Evaluate all rules and return active suggestions
     */
    function evaluate() {
        const context = buildContext();
        SUGGEST_STATE.lastContext = context;

        if (!context.hasFile) {
            SUGGEST_STATE.activeSuggestions = [];
            return [];
        }

        const now = Date.now();
        const activeRules = [];

        SUGGESTION_RULES.forEach(rule => {
            // Skip dismissed suggestions (within cooldown)
            const dismissedAt = SUGGEST_STATE.dismissedSuggestions[rule.id];
            if (dismissedAt && (now - dismissedAt) < SUGGESTION_COOLDOWN_MS) {
                return;
            }

            // Evaluate trigger
            try {
                if (rule.trigger(context)) {
                    activeRules.push({
                        ruleId: rule.id,
                        ...rule.suggestion,
                        priority: rule.priority,
                        action: rule.suggestion.action
                    });
                }
            } catch (err) {
                console.warn('[MacroSuggestions] Rule error:', rule.id, err);
            }
        });

        // Sort by priority and limit
        activeRules.sort((a, b) => b.priority - a.priority);
        SUGGEST_STATE.activeSuggestions = activeRules.slice(0, MAX_SUGGESTIONS);

        console.log('[MacroSuggestions] Evaluated:', SUGGEST_STATE.activeSuggestions.length, 'active');
        return SUGGEST_STATE.activeSuggestions;
    }

    /**
     * Get current active suggestions
     */
    function getSuggestions() {
        return SUGGEST_STATE.activeSuggestions;
    }

    // ============================================================
    // ACTIONS
    // ============================================================

    /**
     * Apply a suggestion (add the suggested block)
     */
    function applySuggestion(ruleId) {
        const suggestion = SUGGEST_STATE.activeSuggestions.find(s => s.ruleId === ruleId);
        if (!suggestion) return;

        console.log('[MacroSuggestions] Applying:', ruleId);

        if (suggestion.action?.type === 'add_block' && window.MacroPipeline) {
            const blockType = suggestion.action.blockType;

            // Add block via pipeline
            if (typeof window.MacroPipeline.addBlock === 'function') {
                window.MacroPipeline.addBlock(blockType);
            }

            // Apply config if specified
            if (suggestion.action.config && window.MacroPipeline.updateLastBlockConfig) {
                window.MacroPipeline.updateLastBlockConfig(suggestion.action.config);
            }
        }

        // Remove from active suggestions
        SUGGEST_STATE.activeSuggestions = SUGGEST_STATE.activeSuggestions.filter(
            s => s.ruleId !== ruleId
        );

        // Re-render
        renderSuggestionPanel();

        // Show toast
        if (typeof window.showToast === 'function') {
            window.showToast(getText('suggest_applied') || 'Öneri uygulandı', 'success', 2000);
        }
    }

    /**
     * Dismiss a suggestion
     */
    function dismissSuggestion(ruleId) {
        console.log('[MacroSuggestions] Dismissing:', ruleId);

        // Record dismissal
        SUGGEST_STATE.dismissedSuggestions[ruleId] = Date.now();

        // Remove from active suggestions
        SUGGEST_STATE.activeSuggestions = SUGGEST_STATE.activeSuggestions.filter(
            s => s.ruleId !== ruleId
        );

        // Re-render
        renderSuggestionPanel();

        // Show toast
        if (typeof window.showToast === 'function') {
            window.showToast(getText('suggest_dismissed'), 'info', 1500);
        }
    }

    // ============================================================
    // UI RENDERING
    // ============================================================

    /**
     * Render suggestion panel with soft glow effect
     */
    function renderSuggestionPanel(containerId) {
        const container = document.getElementById(containerId || 'embeddedMacroSuggestionsPanel') ||
            document.getElementById('macroSuggestionsPanel');

        if (!container) return;

        const suggestions = SUGGEST_STATE.activeSuggestions;

        if (suggestions.length === 0) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="suggest-panel">';

        suggestions.forEach(suggestion => {
            html += `
                <div class="suggest-card" data-rule="${suggestion.ruleId}">
                    <div class="suggest-glow"></div>
                    <div class="suggest-content">
                        <div class="suggest-header">
                            <div class="suggest-icon" style="color: ${suggestion.color};">
                                <i class="fas ${suggestion.icon}"></i>
                            </div>
                            <span class="suggest-title">${getText('suggest_title')}</span>
                            <button class="suggest-close" onclick="MacroSuggestions.dismiss('${suggestion.ruleId}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="suggest-text">
                            ${getText(suggestion.textKey)}
                        </div>
                        <div class="suggest-actions">
                            <button class="suggest-btn suggest-btn-apply" onclick="MacroSuggestions.apply('${suggestion.ruleId}')">
                                <i class="fas fa-check"></i> ${getText('suggest_apply')}
                            </button>
                            <button class="suggest-btn suggest-btn-dismiss" onclick="MacroSuggestions.dismiss('${suggestion.ruleId}')">
                                <i class="fas fa-times"></i> ${getText('suggest_dismiss')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // ============================================================
    // CSS INJECTION
    // ============================================================

    function injectStyles() {
        if (document.getElementById('macro-suggestions-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'macro-suggestions-styles';
        styles.textContent = `
            /* Suggestion Panel */
            .suggest-panel {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin: 10px 0;
            }

            /* Suggestion Card with Soft Glow */
            .suggest-card {
                position: relative;
                background: var(--gm-card-bg, #1e1e2e);
                border-radius: 12px;
                padding: 15px;
                border: 1px solid rgba(139, 92, 246, 0.3);
                overflow: hidden;
            }

            /* Soft Glow Effect */
            .suggest-glow {
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(
                    circle at center,
                    rgba(139, 92, 246, 0.15) 0%,
                    rgba(99, 102, 241, 0.1) 30%,
                    transparent 70%
                );
                animation: suggestGlow 3s ease-in-out infinite;
                pointer-events: none;
            }

            @keyframes suggestGlow {
                0%, 100% {
                    opacity: 0.5;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
            }

            .suggest-content {
                position: relative;
                z-index: 1;
            }

            .suggest-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }

            .suggest-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                background: rgba(139, 92, 246, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
            }

            .suggest-title {
                flex: 1;
                font-weight: 600;
                font-size: 0.9rem;
                color: var(--gm-text, #fff);
            }

            .suggest-close {
                background: transparent;
                border: none;
                color: var(--gm-text-muted, #888);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .suggest-close:hover {
                color: var(--gm-danger, #ef4444);
                background: rgba(239, 68, 68, 0.1);
            }

            .suggest-text {
                font-size: 0.85rem;
                color: var(--gm-text-muted, #aaa);
                line-height: 1.4;
                margin-bottom: 12px;
            }

            .suggest-actions {
                display: flex;
                gap: 8px;
            }

            .suggest-btn {
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s;
            }

            .suggest-btn-apply {
                background: linear-gradient(135deg, #8b5cf6, #6366f1);
                color: white;
            }

            .suggest-btn-apply:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            }

            .suggest-btn-dismiss {
                background: rgba(255, 255, 255, 0.05);
                color: var(--gm-text-muted, #888);
                border: 1px solid var(--gm-border, #333);
            }

            .suggest-btn-dismiss:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--gm-text, #fff);
            }

            /* Light mode adjustments */
            .light-mode .suggest-card {
                background: #fff;
                border-color: rgba(139, 92, 246, 0.2);
            }

            .light-mode .suggest-glow {
                background: radial-gradient(
                    circle at center,
                    rgba(139, 92, 246, 0.1) 0%,
                    rgba(99, 102, 241, 0.05) 30%,
                    transparent 70%
                );
            }
        `;

        document.head.appendChild(styles);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        console.log('[MacroSuggestions] Initializing...');
        injectStyles();

        // Sync language
        if (typeof window.MacroStudio !== 'undefined') {
            const state = window.MacroStudio.getState?.();
            if (state?.currentLang) {
                SUGGEST_STATE.currentLang = state.currentLang;
            }
        } else if (typeof CURRENT_LANG !== 'undefined') {
            SUGGEST_STATE.currentLang = CURRENT_LANG;
        }

        console.log('[MacroSuggestions] Initialized');
    }

    function setLanguage(lang) {
        SUGGEST_STATE.currentLang = lang;
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.MacroSuggestions = {
        init,
        evaluate,
        getSuggestions,
        renderSuggestionPanel,
        apply: applySuggestion,
        dismiss: dismissSuggestion,
        setLanguage,
        getState: () => SUGGEST_STATE
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 150);
    }

})();
