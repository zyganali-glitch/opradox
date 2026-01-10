/**
 * Macro Doctor - Opradox Macro Studio Pro
 * FAZ-3: ANALYZE MODE
 * 
 * ALLOWLIST: VBA parser, Pattern library
 * YASAKLAR: VBA çalıştırmak, Kod yazdırmak
 */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================

    const BACKEND_BASE_URL = window.BACKEND_BASE_URL || 'http://127.0.0.1:8100';
    const SEVERITY_COLORS = {
        HIGH: '#ef4444',
        MEDIUM: '#f97316',
        LOW: '#eab308',
        NONE: '#22c55e'
    };

    // ============================================================
    // STATE
    // ============================================================

    const DOCTOR_STATE = {
        isAnalyzing: false,
        lastResult: null,
        currentFile: null
    };

    // ============================================================
    // TEXTS
    // ============================================================

    const DOCTOR_TEXTS = {
        tr: {
            title: 'Makro Doktor',
            analyze_btn: 'Analiz Et',
            analyzing: 'Analiz ediliyor...',
            no_macros: 'Bu dosyada makro bulunamadı',
            security_title: 'Güvenlik Analizi',
            performance_title: 'Performans Analizi',
            quality_title: 'Kod Kalitesi',
            intent_title: 'Makro Amacı',
            modules_title: 'VBA Modülleri',
            risk_level: 'Risk Seviyesi',
            score: 'Skor',
            findings: 'Bulgular',
            issues: 'Sorunlar',
            good_practices: 'İyi Uygulamalar',
            line: 'Satır',
            severity: {
                HIGH: 'Yüksek',
                MEDIUM: 'Orta',
                LOW: 'Düşük',
                NONE: 'Yok'
            },
            impact: {
                HIGH: 'Yüksek',
                MEDIUM: 'Orta',
                LOW: 'Düşük'
            },
            intent_confidence: 'Güven',
            primary_intent: 'Ana Amaç',
            secondary_intent: 'İkincil Amaçlar',
            hybrid_view: 'Kod Önizleme (Salt Okunur)',
            read_only_warning: 'Not: Kod görüntüleme salt okunurdur. Düzenleme yapılamaz.',
            analysis_complete: 'Analiz tamamlandı',
            upload_first: 'Önce XLSM dosyası yükleyin'
        },
        en: {
            title: 'Macro Doctor',
            analyze_btn: 'Analyze',
            analyzing: 'Analyzing...',
            no_macros: 'No macros found in this file',
            security_title: 'Security Analysis',
            performance_title: 'Performance Analysis',
            quality_title: 'Code Quality',
            intent_title: 'Macro Intent',
            modules_title: 'VBA Modules',
            risk_level: 'Risk Level',
            score: 'Score',
            findings: 'Findings',
            issues: 'Issues',
            good_practices: 'Good Practices',
            line: 'Line',
            severity: {
                HIGH: 'High',
                MEDIUM: 'Medium',
                LOW: 'Low',
                NONE: 'None'
            },
            impact: {
                HIGH: 'High',
                MEDIUM: 'Medium',
                LOW: 'Low'
            },
            intent_confidence: 'Confidence',
            primary_intent: 'Primary Intent',
            secondary_intent: 'Secondary Intents',
            hybrid_view: 'Code Preview (Read-Only)',
            read_only_warning: 'Note: Code view is read-only. Editing is not allowed.',
            analysis_complete: 'Analysis complete',
            upload_first: 'Upload an XLSM file first',
            // FAZ-MS-P3: Decision Trace texts
            decision_trace_title: 'Decision Trace',
            why_flagged: 'Why Flagged',
            evidence: 'Evidence',
            suggested_fix: 'Suggested Fix',
            before: 'Before',
            after: 'After',
            view_fix: 'View Fix',
            hide_fix: 'Hide Fix',
            rule: 'Rule',
            category: 'Category',
            no_trace: 'No findings to trace'
        }
    };

    // FAZ-MS-P3: Additional TR texts (injected)
    DOCTOR_TEXTS.tr.decision_trace_title = 'Karar İzleme';
    DOCTOR_TEXTS.tr.why_flagged = 'Neden İşaretlendi';
    DOCTOR_TEXTS.tr.evidence = 'Kanıt';
    DOCTOR_TEXTS.tr.suggested_fix = 'Önerilen Düzeltme';
    DOCTOR_TEXTS.tr.before = 'Önce';
    DOCTOR_TEXTS.tr.after = 'Sonra';
    DOCTOR_TEXTS.tr.view_fix = 'Düzeltmeyi Gör';
    DOCTOR_TEXTS.tr.hide_fix = 'Düzeltmeyi Gizle';
    DOCTOR_TEXTS.tr.rule = 'Kural';
    DOCTOR_TEXTS.tr.category = 'Kategori';
    DOCTOR_TEXTS.tr.no_trace = 'İzlenecek bulgu yok';

    function getText(key, subKey = null) {
        const lang = window.MacroStudio?.getState()?.currentLang || 'tr';
        const texts = DOCTOR_TEXTS[lang] || DOCTOR_TEXTS['tr'];

        if (subKey) {
            return texts[key]?.[subKey] || subKey;
        }
        return texts[key] || key;
    }

    // ============================================================
    // ANALYSIS
    // ============================================================

    async function analyzeFile() {
        const file = window.MacroStudio?.getState()?.currentFile;

        if (!file) {
            showToast(getText('upload_first'), 'warning');
            return;
        }

        // Check if XLSM
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'xlsm' && ext !== 'xlsb') {
            showToast('Only .xlsm files contain VBA macros', 'warning');
            return;
        }

        DOCTOR_STATE.isAnalyzing = true;
        DOCTOR_STATE.currentFile = file;
        updateAnalyzeButton(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_BASE_URL}/vba/analyze`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Analysis failed');
            }

            const result = await response.json();
            DOCTOR_STATE.lastResult = result;

            if (!result.has_macros) {
                renderNoMacros();
            } else {
                renderAnalysisReport(result);
            }

            showToast(getText('analysis_complete'), 'success');

        } catch (err) {
            console.error('[MacroDoctor] Analysis error:', err);
            showToast(err.message, 'error');
        } finally {
            DOCTOR_STATE.isAnalyzing = false;
            updateAnalyzeButton(false);
        }
    }

    function updateAnalyzeButton(isLoading) {
        const btn = document.getElementById('macroDoctorBtn');
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${getText('analyzing')}`;
        } else {
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-stethoscope"></i> ${getText('analyze_btn')}`;
        }
    }

    // ============================================================
    // RENDERING
    // ============================================================

    function renderNoMacros() {
        const container = document.getElementById('macroDoctorResults');
        if (!container) return;

        container.innerHTML = `
            <div class="gm-info-box" style="text-align: center; padding: 40px;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #22c55e; margin-bottom: 15px;"></i>
                <h3>${getText('no_macros')}</h3>
            </div>
        `;
    }

    function renderAnalysisReport(result) {
        const container = document.getElementById('macroDoctorResults');
        if (!container) return;

        const lang = window.MacroStudio?.getState()?.currentLang || 'tr';

        let html = '<div class="macro-doctor-report">';

        // Summary Cards
        html += `
            <div class="doctor-summary-cards">
                ${renderSummaryCard('security', result.security?.risk_level, 'fa-shield-halved')}
                ${renderSummaryCard('performance', result.performance?.score, 'fa-gauge-high', true)}
                ${renderSummaryCard('quality', result.quality?.score, 'fa-code', true)}
                ${renderIntentCard(result.intent)}
            </div>
        `;

        // Security Section
        html += renderSecuritySection(result.security, lang);

        // Performance Section
        html += renderPerformanceSection(result.performance, lang);

        // Quality Section
        html += renderQualitySection(result.quality, lang);

        // Intent Section
        html += renderIntentSection(result.intent, lang);

        // FAZ-MS-P3: Decision Trace Section
        html += renderDecisionTraceSection(result.decision_trace, lang);

        // Modules / Hybrid View
        html += renderModulesSection(result.modules, lang);

        html += '</div>';

        container.innerHTML = html;

        // Setup collapsible sections
        setupCollapsibles();
    }

    function renderSummaryCard(type, value, icon, isScore = false) {
        let color, displayValue;

        if (isScore) {
            const score = parseInt(value) || 0;
            if (score >= 80) color = '#22c55e';
            else if (score >= 60) color = '#eab308';
            else if (score >= 40) color = '#f97316';
            else color = '#ef4444';
            displayValue = `${score}/100`;
        } else {
            color = SEVERITY_COLORS[value] || SEVERITY_COLORS.NONE;
            displayValue = getText('severity', value);
        }

        const title = type === 'security' ? getText('security_title') :
            type === 'performance' ? getText('performance_title') :
                getText('quality_title');

        return `
            <div class="doctor-summary-card" style="border-left: 4px solid ${color};">
                <div class="summary-icon" style="color: ${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="summary-info">
                    <span class="summary-label">${title}</span>
                    <span class="summary-value" style="color: ${color};">${displayValue}</span>
                </div>
            </div>
        `;
    }

    function renderIntentCard(intent) {
        if (!intent?.primary) {
            return '';
        }

        const lang = window.MacroStudio?.getState()?.currentLang || 'tr';
        const descKey = lang === 'tr' ? 'primary_description_tr' : 'primary_description_en';
        const desc = intent[descKey] || intent.primary;
        const confidence = Math.round((intent.confidence || 0) * 100);

        return `
            <div class="doctor-summary-card" style="border-left: 4px solid #6366f1;">
                <div class="summary-icon" style="color: #6366f1;">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div class="summary-info">
                    <span class="summary-label">${getText('intent_title')}</span>
                    <span class="summary-value" style="color: #6366f1;">${desc}</span>
                    <span class="summary-confidence">${confidence}% ${getText('intent_confidence')}</span>
                </div>
            </div>
        `;
    }

    function renderSecuritySection(security, lang) {
        if (!security) return '';

        const descKey = lang === 'tr' ? 'description_tr' : 'description_en';
        const suggKey = lang === 'tr' ? 'suggestion_tr' : 'suggestion_en';

        let html = `
            <div class="doctor-section collapsible">
                <div class="section-header">
                    <h3><i class="fas fa-shield-halved"></i> ${getText('security_title')}</h3>
                    <span class="risk-badge" style="background: ${SEVERITY_COLORS[security.risk_level]};">
                        ${getText('severity', security.risk_level)}
                    </span>
                    <i class="fas fa-chevron-down section-toggle"></i>
                </div>
                <div class="section-content">
        `;

        if (security.findings?.length > 0) {
            html += `<div class="findings-list">`;
            security.findings.forEach(finding => {
                html += `
                    <div class="finding-item severity-${finding.severity.toLowerCase()}">
                        <div class="finding-header">
                            <span class="finding-type">${finding.type}</span>
                            <span class="finding-severity" style="background: ${SEVERITY_COLORS[finding.severity]};">
                                ${getText('severity', finding.severity)}
                            </span>
                        </div>
                        <div class="finding-details">
                            <p>${finding[descKey]}</p>
                            <div class="finding-location">
                                <span><i class="fas fa-file-code"></i> ${finding.module}</span>
                                <span><i class="fas fa-hashtag"></i> ${getText('line')} ${finding.line}</span>
                            </div>
                            <code class="finding-snippet">${escapeHtml(finding.snippet)}</code>
                            <p class="finding-suggestion"><i class="fas fa-lightbulb"></i> ${finding[suggKey]}</p>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        } else {
            html += `<p class="no-findings"><i class="fas fa-check-circle"></i> ${getText('no_macros')}</p>`;
        }

        html += `</div></div>`;
        return html;
    }

    function renderPerformanceSection(performance, lang) {
        if (!performance) return '';

        const descKey = lang === 'tr' ? 'description_tr' : 'description_en';
        const suggKey = lang === 'tr' ? 'suggestion_tr' : 'suggestion_en';

        let html = `
            <div class="doctor-section collapsible">
                <div class="section-header">
                    <h3><i class="fas fa-gauge-high"></i> ${getText('performance_title')}</h3>
                    <span class="score-badge">${performance.score}/100</span>
                    <i class="fas fa-chevron-down section-toggle"></i>
                </div>
                <div class="section-content">
        `;

        // Issues
        if (performance.issues?.length > 0) {
            html += `<h4>${getText('issues')}</h4><div class="issues-list">`;
            performance.issues.forEach(issue => {
                html += `
                    <div class="issue-item impact-${issue.impact.toLowerCase()}">
                        <span class="issue-type">${issue.type}</span>
                        <span class="issue-count">${issue.count}x</span>
                        <span class="issue-impact">${getText('impact', issue.impact)}</span>
                        <p>${issue[descKey]}</p>
                        <p class="issue-suggestion"><i class="fas fa-lightbulb"></i> ${issue[suggKey]}</p>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Good Practices
        if (performance.good_practices?.length > 0) {
            html += `<h4 style="color: #22c55e;"><i class="fas fa-check"></i> ${getText('good_practices')}</h4><div class="good-practices-list">`;
            performance.good_practices.forEach(practice => {
                html += `
                    <div class="good-practice-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${practice[descKey]}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `</div></div>`;
        return html;
    }

    function renderQualitySection(quality, lang) {
        if (!quality) return '';

        const descKey = lang === 'tr' ? 'description_tr' : 'description_en';

        let html = `
            <div class="doctor-section collapsible">
                <div class="section-header">
                    <h3><i class="fas fa-code"></i> ${getText('quality_title')}</h3>
                    <span class="score-badge">${quality.score}/100</span>
                    <i class="fas fa-chevron-down section-toggle"></i>
                </div>
                <div class="section-content">
        `;

        // Metrics
        if (quality.metrics) {
            html += `
                <div class="quality-metrics">
                    <div class="metric"><span>Satır</span><strong>${quality.metrics.total_lines}</strong></div>
                    <div class="metric"><span>Modül</span><strong>${quality.metrics.module_count}</strong></div>
                    <div class="metric"><span>Prosedür</span><strong>${quality.metrics.procedure_count}</strong></div>
                    <div class="metric"><span>Ort. Satır/Prosedür</span><strong>${quality.metrics.avg_procedure_lines}</strong></div>
                    <div class="metric ${quality.metrics.has_option_explicit ? 'good' : 'bad'}">
                        <span>Option Explicit</span>
                        <i class="fas ${quality.metrics.has_option_explicit ? 'fa-check' : 'fa-times'}"></i>
                    </div>
                    <div class="metric ${quality.metrics.has_error_handling ? 'good' : 'bad'}">
                        <span>Hata Yakalama</span>
                        <i class="fas ${quality.metrics.has_error_handling ? 'fa-check' : 'fa-times'}"></i>
                    </div>
                </div>
            `;
        }

        // Good patterns
        if (quality.good_patterns?.length > 0) {
            html += `<h4 style="color: #22c55e;"><i class="fas fa-check"></i> İyi Özellikler</h4><ul class="pattern-list good">`;
            quality.good_patterns.forEach(p => {
                html += `<li><strong>${p.type}:</strong> ${p[descKey]} (${p.count}x)</li>`;
            });
            html += `</ul>`;
        }

        // Bad patterns
        if (quality.bad_patterns?.length > 0) {
            html += `<h4 style="color: #f97316;"><i class="fas fa-exclamation-triangle"></i> İyileştirme Alanları</h4><ul class="pattern-list bad">`;
            quality.bad_patterns.forEach(p => {
                html += `<li><strong>${p.type}:</strong> ${p[descKey]} (${p.count}x)</li>`;
            });
            html += `</ul>`;
        }

        html += `</div></div>`;
        return html;
    }

    function renderIntentSection(intent, lang) {
        if (!intent?.primary) return '';

        const descKey = lang === 'tr' ? 'description' : 'description';

        let html = `
            <div class="doctor-section collapsible">
                <div class="section-header">
                    <h3><i class="fas fa-lightbulb"></i> ${getText('intent_title')}</h3>
                    <i class="fas fa-chevron-down section-toggle"></i>
                </div>
                <div class="section-content">
                    <div class="intent-info">
                        <div class="primary-intent">
                            <span class="label">${getText('primary_intent')}:</span>
                            <span class="value">${intent[lang === 'tr' ? 'primary_description_tr' : 'primary_description_en'] || intent.primary}</span>
                            <span class="confidence">${Math.round(intent.confidence * 100)}%</span>
                        </div>
        `;

        if (intent.secondary?.length > 0) {
            html += `
                <div class="secondary-intents">
                    <span class="label">${getText('secondary_intent')}:</span>
                    ${intent.secondary.map(s => `<span class="secondary-tag">${s}</span>`).join('')}
                </div>
            `;
        }

        html += `</div></div></div>`;
        return html;
    }

    // ============================================================
    // FAZ-MS-P3: Decision Trace Section
    // ============================================================

    function renderDecisionTraceSection(decisionTrace, lang) {
        if (!decisionTrace || decisionTrace.length === 0) {
            return `
                <div class="doctor-section">
                    <div class="section-header">
                        <h3><i class="fas fa-route"></i> ${getText('decision_trace_title')}</h3>
                    </div>
                    <div class="section-content">
                        <p class="no-trace-message"><i class="fas fa-check-circle"></i> ${getText('no_trace')}</p>
                    </div>
                </div>
            `;
        }

        const becauseKey = lang === 'tr' ? 'because_tr' : 'because_en';
        const fixKey = lang === 'tr' ? 'fix_tr' : 'fix_en';

        let html = `
            <div class="doctor-section collapsible">
                <div class="section-header">
                    <h3><i class="fas fa-route"></i> ${getText('decision_trace_title')}</h3>
                    <span class="trace-count">${decisionTrace.length}</span>
                    <i class="fas fa-chevron-down section-toggle"></i>
                </div>
                <div class="section-content">
                    <div class="decision-trace-list">
        `;

        decisionTrace.forEach((entry, idx) => {
            const severityColor = SEVERITY_COLORS[entry.severity] || '#888';
            const categoryIcon = getCategoryIcon(entry.category);

            html += `
                <div class="trace-entry severity-${entry.severity?.toLowerCase() || 'low'}">
                    <div class="trace-header">
                        <span class="trace-icon" style="color:${severityColor};">
                            <i class="fas ${categoryIcon}"></i>
                        </span>
                        <span class="trace-rule">${entry.rule_id}</span>
                        <span class="trace-category">${entry.category}</span>
                        <span class="trace-severity" style="background:${severityColor};">${entry.severity}</span>
                    </div>
                    <div class="trace-body">
                        <div class="trace-because">
                            <strong>${getText('why_flagged')}:</strong> ${entry[becauseKey]}
                        </div>
                        <div class="trace-evidence">
                            <strong>${getText('evidence')}:</strong>
                            <code>${escapeHtml(entry.evidence)}</code>
                            ${entry.module ? `<span class="trace-module">(${entry.module}${entry.line ? ':' + entry.line : ''})</span>` : ''}
                        </div>
            `;

            // Render fix suggestion if available
            if (entry.suggested_fix) {
                html += `
                    <div class="trace-fix">
                        <button class="fix-toggle-btn" onclick="MacroDoctor.toggleFixDiff(${idx})">
                            <i class="fas fa-wrench"></i> ${getText('view_fix')}
                        </button>
                        <div class="fix-diff" id="fixDiff_${idx}" style="display:none;">
                            <div class="fix-description">
                                <i class="fas fa-lightbulb"></i> ${entry.suggested_fix[fixKey]}
                            </div>
                            <div class="fix-code-diff">
                                <div class="diff-before">
                                    <span class="diff-label">${getText('before')}:</span>
                                    <pre><code>${escapeHtml(entry.suggested_fix.before)}</code></pre>
                                </div>
                                <div class="diff-arrow"><i class="fas fa-arrow-right"></i></div>
                                <div class="diff-after">
                                    <span class="diff-label">${getText('after')}:</span>
                                    <pre><code>${escapeHtml(entry.suggested_fix.after)}</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    function getCategoryIcon(category) {
        switch (category) {
            case 'security': return 'fa-shield-halved';
            case 'performance': return 'fa-gauge-high';
            case 'quality': return 'fa-code';
            default: return 'fa-circle-info';
        }
    }

    function toggleFixDiff(idx) {
        const diffEl = document.getElementById(`fixDiff_${idx}`);
        const btn = diffEl?.previousElementSibling;
        if (diffEl) {
            const isHidden = diffEl.style.display === 'none';
            diffEl.style.display = isHidden ? 'block' : 'none';
            if (btn) {
                btn.innerHTML = `<i class="fas fa-wrench"></i> ${isHidden ? getText('hide_fix') : getText('view_fix')}`;
            }
        }
    }

    function renderModulesSection(modules, lang) {
        if (!modules?.length) return '';

        let html = `
            <div class="doctor-section collapsible">
                <div class="section-header">
                    <h3><i class="fas fa-file-code"></i> ${getText('modules_title')}</h3>
                    <span class="module-count">${modules.length}</span>
                    <i class="fas fa-chevron-down section-toggle"></i>
                </div>
                <div class="section-content">
                    <p class="read-only-warning"><i class="fas fa-lock"></i> ${getText('read_only_warning')}</p>
                    <div class="modules-list">
        `;

        modules.forEach((module, idx) => {
            html += `
                <div class="module-item">
                    <div class="module-header" onclick="MacroDoctor.toggleModuleCode(${idx})">
                        <span class="module-icon"><i class="fas fa-file-code"></i></span>
                        <span class="module-name">${module.name}</span>
                        <span class="module-type">${module.type}</span>
                        <span class="module-lines">${module.line_count} lines</span>
                        <i class="fas fa-chevron-down module-toggle"></i>
                    </div>
                    <div class="module-code" id="moduleCode_${idx}" style="display: none;">
                        <pre><code>${escapeHtml(module.preview)}</code></pre>
                    </div>
                </div>
            `;
        });

        html += `</div></div></div>`;
        return html;
    }

    function toggleModuleCode(idx) {
        const codeEl = document.getElementById(`moduleCode_${idx}`);
        if (codeEl) {
            codeEl.style.display = codeEl.style.display === 'none' ? 'block' : 'none';
        }
    }

    function setupCollapsibles() {
        document.querySelectorAll('.doctor-section.collapsible .section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.doctor-section');
                section.classList.toggle('collapsed');
            });
        });
    }

    /**
     * FAZ-E: Create suggested pipeline blocks from VBA analysis
     * Maps detected intents to macro blocks
     */
    function createPipelineFromAnalysis(analysisResult) {
        const pipeline = [];
        const intent = analysisResult?.intent;

        if (!intent) return pipeline;

        // Intent -> Block mapping
        const intentBlockMapping = {
            'data_processing': [
                { type: 'filter', config: { column: '', operator: '==', value: '' } },
                { type: 'computed', config: { name: 'computed_value', columns: [], operation: 'add' } }
            ],
            'reporting': [
                { type: 'grouping', config: { group_by: [], aggregations: [] } },
                { type: 'pivot', config: { rows: [], columns: [], values: [] } },
                { type: 'output_settings', config: { output_type: 'single_sheet', freeze_header: true } }
            ],
            'data_validation': [
                { type: 'filter', config: { column: '', operator: 'contains', value: '' } },
                { type: 'remove_duplicates', config: { columns: [] } }
            ],
            'file_operations': [
                { type: 'data_source', config: { source_type: 'primary' } },
                { type: 'output_settings', config: { output_type: 'single_sheet' } }
            ],
            'formatting': [
                { type: 'conditional_format', config: { cf_type: 'color_scale' } },
                { type: 'sort', config: { column: '', order: 'asc' } }
            ],
            'automation': [
                { type: 'filter', config: { column: '', operator: '==', value: '' } },
                { type: 'computed', config: { name: 'result', columns: [], operation: 'add' } },
                { type: 'output_settings', config: { output_type: 'single_sheet' } }
            ]
        };

        // Add blocks based on primary intent
        const primaryBlocks = intentBlockMapping[intent.primary] || intentBlockMapping['data_processing'];
        pipeline.push(...primaryBlocks);

        // Add blocks from secondary intents
        if (intent.secondary?.length > 0) {
            intent.secondary.forEach(sec => {
                const secBlocks = intentBlockMapping[sec];
                if (secBlocks) {
                    // Add only non-duplicate types
                    secBlocks.forEach(block => {
                        if (!pipeline.find(p => p.type === block.type)) {
                            pipeline.push(block);
                        }
                    });
                }
            });
        }

        console.log('[MacroDoctor] Generated pipeline suggestion:', pipeline);
        return pipeline;
    }

    /**
     * FAZ-E: Run suggested pipeline through unified scenario API
     */
    async function runSuggestedPipeline(suggestedPipeline) {
        try {
            const file = DOCTOR_STATE.currentFile || window.LAST_FILE;
            if (!file) {
                showToast(getText('upload_first'), 'warning');
                return null;
            }

            const formData = new FormData();
            formData.append('file', file);

            const requestJson = {
                scenario_id: 'macro-studio-pro',
                mode: 'doctor',
                input: {
                    data_source: { sheet_name: null, header_row: 0 },
                    actions: suggestedPipeline.map((block, idx) => ({
                        type: block.type,
                        ...block.config,
                        _source: 'doctor_suggestion',
                        _order: idx
                    }))
                },
                options: {
                    preview: true,
                    lang: window.MacroStudio?.getState()?.currentLang || 'tr',
                    row_limit: 100
                }
            };
            formData.append('request_json', JSON.stringify(requestJson));

            console.log('[MacroDoctor] Running suggested pipeline via unified API...');

            const response = await fetch('/api/scenario/run', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[MacroDoctor] Suggested pipeline result:', result.success ? 'SUCCESS' : 'FAILED');
                if (result.success) {
                    showToast(getText('analysis_complete'), 'success');
                    return result;
                }
            } else {
                console.warn('[MacroDoctor] Suggested pipeline failed:', response.status);
            }
            return null;
        } catch (err) {
            console.error('[MacroDoctor] Suggested pipeline error:', err);
            showToast(err.message, 'error');
            return null;
        }
    }

    /**
     * FAZ-E: Apply suggested pipeline to Studio mode
     */
    function applySuggestedPipeline(suggestedPipeline) {
        if (!suggestedPipeline?.length) {
            showToast('No pipeline to apply', 'warning');
            return;
        }

        // Switch to Studio mode
        if (typeof window.MacroStudio !== 'undefined' && window.MacroStudio.setMode) {
            window.MacroStudio.setMode('studio');
        }

        // Clear current pipeline and add suggested blocks
        if (typeof window.MacroPipeline !== 'undefined') {
            window.MacroPipeline.clearPipeline();
            suggestedPipeline.forEach(block => {
                window.MacroPipeline.addBlock(block.type);
            });
            showToast(`Added ${suggestedPipeline.length} suggested blocks`, 'success');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ============================================================
    // FAZ-MS-P3: CSS Styles for Decision Trace
    // ============================================================

    function injectDecisionTraceStyles() {
        if (document.getElementById('macro-doctor-trace-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'macro-doctor-trace-styles';
        styles.textContent = `
            /* Decision Trace Section */
            .decision-trace-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .trace-entry {
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                padding: 12px;
                border-left: 4px solid var(--trace-color, #888);
            }
            
            .trace-entry.severity-high { --trace-color: #ef4444; }
            .trace-entry.severity-medium { --trace-color: #f97316; }
            .trace-entry.severity-low { --trace-color: #eab308; }
            
            .trace-header {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 8px;
            }
            
            .trace-icon {
                font-size: 1.1rem;
            }
            
            .trace-rule {
                font-weight: 600;
                font-family: monospace;
                background: rgba(255,255,255,0.1);
                padding: 2px 8px;
                border-radius: 4px;
            }
            
            .trace-category {
                font-size: 0.8rem;
                opacity: 0.7;
                text-transform: uppercase;
            }
            
            .trace-severity {
                font-size: 0.75rem;
                padding: 2px 8px;
                border-radius: 4px;
                color: white;
                font-weight: 600;
            }
            
            .trace-body {
                font-size: 0.9rem;
            }
            
            .trace-because {
                margin-bottom: 6px;
            }
            
            .trace-evidence code {
                background: rgba(0,0,0,0.3);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 0.85rem;
            }
            
            .trace-module {
                font-size: 0.8rem;
                opacity: 0.7;
                margin-left: 8px;
            }
            
            .trace-fix {
                margin-top: 10px;
            }
            
            .fix-toggle-btn {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .fix-toggle-btn:hover {
                filter: brightness(1.1);
            }
            
            .fix-diff {
                margin-top: 10px;
                background: rgba(0,0,0,0.25);
                border-radius: 6px;
                padding: 12px;
            }
            
            .fix-description {
                margin-bottom: 10px;
                color: #eab308;
                font-size: 0.9rem;
            }
            
            .fix-code-diff {
                display: flex;
                gap: 15px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            
            .diff-before, .diff-after {
                flex: 1;
                min-width: 200px;
            }
            
            .diff-label {
                display: block;
                font-size: 0.8rem;
                margin-bottom: 5px;
                opacity: 0.7;
            }
            
            .diff-before pre {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 4px;
                padding: 8px;
                overflow-x: auto;
            }
            
            .diff-after pre {
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 4px;
                padding: 8px;
                overflow-x: auto;
            }
            
            .diff-arrow {
                color: var(--gm-text-muted, #888);
                padding-top: 25px;
            }
            
            .trace-count {
                background: var(--gm-primary, #6366f1);
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.8rem;
                margin-left: 10px;
            }
            
            .no-trace-message {
                color: #22c55e;
                padding: 20px;
                text-align: center;
            }
        `;
        document.head.appendChild(styles);
    }

    // ============================================================
    // UI INIT
    // ============================================================

    function init() {
        console.log('[MacroDoctor] Initializing...');

        // FAZ-MS-P3: Inject decision trace styles
        injectDecisionTraceStyles();

        // Create results container if not exists
        const resultsContainer = document.getElementById('macroDoctorResults');
        if (!resultsContainer) {
            console.warn('[MacroDoctor] Results container not found');
        }

        // Add analyze button listener
        const btn = document.getElementById('macroDoctorBtn');
        if (btn) {
            btn.addEventListener('click', analyzeFile);
        }

        console.log('[MacroDoctor] Initialized');
    }

    function showToast(msg, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            console.log(`[Toast] ${type}: ${msg}`);
        }
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.MacroDoctor = {
        init,
        analyzeFile,
        analyze: analyzeFile,  // FAZ-MS-P0: Alias for backward compatibility (macroStudio.js calls analyze)
        toggleModuleCode,
        toggleFixDiff,  // FAZ-MS-P3: Toggle fix suggestion diff
        getState: () => DOCTOR_STATE,
        getLastResult: () => DOCTOR_STATE.lastResult,
        // FAZ-E: Pipeline suggestion functions
        createPipelineFromAnalysis,
        runSuggestedPipeline,
        applySuggestedPipeline
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 200);
    }

})();
