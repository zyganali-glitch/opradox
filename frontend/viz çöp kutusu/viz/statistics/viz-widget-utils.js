/**
 * viz-widget-utils.js
 * Widget Utility Functions - toggleStatMode, toggleFormula, copy functions
 * Ported from legacy viz.js lines: 15332-15398, 15426-15567
 */

(function () {
    'use strict';

    // =====================================================
    // TOGGLE STAT MODE (APA/Dashboard) - viz.js line 15332
    // =====================================================

    function toggleStatMode(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const isAPA = widget.classList.toggle('apa-mode');

        // Toggle butonunu güncelle
        const toggleBtn = widget.querySelector('.viz-mode-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = isAPA ?
                '<i class="fas fa-desktop"></i> Dashboard' :
                '<i class="fas fa-file-alt"></i> APA';
        }

        // APA modunda floating exit butonu ekle/kaldır
        let exitBtn = widget.querySelector('.viz-apa-exit-btn');
        if (isAPA) {
            if (!exitBtn) {
                exitBtn = document.createElement('button');
                exitBtn.className = 'viz-apa-exit-btn';
                exitBtn.innerHTML = '<i class="fas fa-times"></i> Dashboard\'a Dön';
                exitBtn.onclick = () => toggleStatMode(widgetId);
                widget.insertBefore(exitBtn, widget.firstChild);
            }
        } else {
            if (exitBtn) exitBtn.remove();
        }

        if (typeof showToast === 'function') {
            showToast(isAPA ? 'APA Rapor Modu aktif' : 'Dashboard Modu aktif', 'info');
        }
    }

    // =====================================================
    // TOGGLE FORMULA PANEL - viz.js line 15366
    // =====================================================

    function toggleFormula(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        let formulaPanel = widget.querySelector('.viz-formula-panel');
        if (formulaPanel) {
            formulaPanel.remove();
            return;
        }

        const statType = widget.dataset.statType;
        const formula = getFormulaForTest(statType);
        const statTitle = typeof getStatTitle === 'function' ? getStatTitle(statType) : statType;

        formulaPanel = document.createElement('div');
        formulaPanel.className = 'viz-formula-panel';
        formulaPanel.innerHTML = `
            <div class="viz-formula-header">
                <span>📐 Formül: ${statTitle}</span>
                <button onclick="this.closest('.viz-formula-panel').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-formula-content">${formula}</div>
        `;

        const body = widget.querySelector('.viz-widget-body, .viz-stat-body');
        if (body) {
            body.parentNode.insertBefore(formulaPanel, body);
        }

        // MathJax varsa render et
        if (window.MathJax) {
            MathJax.typesetPromise([formulaPanel]).catch(console.error);
        }
    }

    function getFormulaForTest(statType) {
        const formulas = {
            'ttest': '\\( t = \\frac{\\bar{X}_1 - \\bar{X}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}} \\)',
            'anova': '\\( F = \\frac{MS_{between}}{MS_{within}} \\)',
            'chi-square': '\\( \\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i} \\)',
            'correlation': '\\( r = \\frac{\\sum(X_i - \\bar{X})(Y_i - \\bar{Y})}{\\sqrt{\\sum(X_i - \\bar{X})^2 \\sum(Y_i - \\bar{Y})^2}} \\)',
            'mann-whitney': '\\( U = n_1 n_2 + \\frac{n_1(n_1+1)}{2} - R_1 \\)',
            'wilcoxon': '\\( W = \\sum_{i=1}^{n} [sgn(x_{2,i} - x_{1,i}) \\cdot R_i] \\)',
            'effect-size': '\\( d = \\frac{\\bar{X}_1 - \\bar{X}_2}{s_{pooled}} \\)',
            'normality': '\\( W = \\frac{(\\sum_{i=1}^{n} a_i x_{(i)})^2}{\\sum_{i=1}^{n}(x_i - \\bar{x})^2} \\) (Shapiro-Wilk)',
            'kruskal': '\\( H = \\frac{12}{N(N+1)} \\sum_{i=1}^{k} \\frac{R_i^2}{n_i} - 3(N+1) \\)',
            'levene': '\\( W = \\frac{(N-k)}{(k-1)} \\cdot \\frac{\\sum n_i (\\bar{Z}_{i} - \\bar{Z})^2}{\\sum\\sum (Z_{ij} - \\bar{Z}_i)^2} \\)',
            'descriptive': '\\( \\bar{X} = \\frac{\\sum X_i}{n}, \\quad s = \\sqrt{\\frac{\\sum(X_i - \\bar{X})^2}{n-1}} \\)',
            'pca': '\\( \\text{Cov}(X) = \\frac{1}{n-1} X^T X \\) (eigenvalue decomposition)',
            'cronbach': '\\( \\alpha = \\frac{k}{k-1} \\left(1 - \\frac{\\sum s_i^2}{s_t^2}\\right) \\)',
            'friedman': '\\( \\chi_r^2 = \\frac{12}{nk(k+1)} \\sum R_j^2 - 3n(k+1) \\)',
            'logistic': '\\( P(Y=1) = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 X)}} \\)',
            'survival': '\\( \\hat{S}(t) = \\prod_{t_i \\leq t} \\left(1 - \\frac{d_i}{n_i}\\right) \\) (Kaplan-Meier)',
            'power': '\\( n = \\frac{(Z_{\\alpha/2} + Z_\\beta)^2 \\cdot 2\\sigma^2}{\\delta^2} \\)'
        };
        return formulas[statType] || '<em>Bu test için formül henüz eklenmedi.</em>';
    }

    // =====================================================
    // COPY STAT AS HTML - viz.js line 15426
    // =====================================================

    async function copyStatAsHTML(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const bodyEl = widget.querySelector('.viz-widget-body, .viz-stat-body');
        if (!bodyEl) return;

        try {
            const title = widget.querySelector('.viz-widget-title')?.textContent || 'Sonuç';
            const auditNote = widget.querySelector('.viz-stat-audit-footer')?.textContent?.replace(/[^\w\sçğıöşüÇĞİÖŞÜ.,():→'-]/gi, '').trim() || '';

            let htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; }
                        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                        th, td { border: none; border-bottom: 1px solid #000; padding: 6px 10px; text-align: left; }
                        thead tr { border-bottom: 2px solid #000; }
                        .note { font-size: 10pt; font-style: italic; color: #666; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <h4>${title}</h4>
                    ${bodyEl.innerHTML}
                    ${auditNote ? `<p class="note">${auditNote}</p>` : ''}
                </body>
                </html>
            `;

            // İkonları kaldır
            htmlContent = htmlContent.replace(/<i class="fas[^>]*><\/i>/g, '');
            htmlContent = htmlContent.replace(/<i class="fa[^>]*>[^<]*<\/i>/g, '');

            if (navigator.clipboard && ClipboardItem) {
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const plainText = bodyEl.innerText;
                const textBlob = new Blob([plainText], { type: 'text/plain' });

                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': blob,
                        'text/plain': textBlob
                    })
                ]);
                if (typeof showToast === 'function') showToast('✅ Word tablosu olarak kopyalandı!', 'success');
            } else {
                // Fallback
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = bodyEl.innerHTML;
                tempDiv.style.cssText = 'position:fixed;left:-9999px;background:#fff;color:#000;font-family:Times New Roman;';
                document.body.appendChild(tempDiv);

                const range = document.createRange();
                range.selectNodeContents(tempDiv);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('copy');
                selection.removeAllRanges();
                document.body.removeChild(tempDiv);

                if (typeof showToast === 'function') showToast('📋 Kopyalandı', 'success');
            }
        } catch (error) {
            console.error('Kopyalama hatası:', error);
            if (typeof showToast === 'function') showToast('Kopyalama hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // COPY STAT AS IMAGE - viz.js line 15501
    // =====================================================

    async function copyStatAsImage(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        try {
            // html2canvas yükle (yoksa CDN'den)
            if (!window.html2canvas) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }

            // Geçici olarak APA moduna al
            const wasAPA = widget.classList.contains('apa-mode');
            if (!wasAPA) widget.classList.add('apa-mode');

            const canvas = await html2canvas(widget, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true
            });

            if (!wasAPA) widget.classList.remove('apa-mode');

            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    if (typeof showToast === 'function') showToast('🖼️ Resim olarak kopyalandı!', 'success');
                } catch (err) {
                    // Fallback: İndir
                    const link = document.createElement('a');
                    link.download = `stat_${widgetId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    if (typeof showToast === 'function') showToast('📥 Resim indirildi', 'info');
                }
            }, 'image/png');

        } catch (error) {
            console.error('Resim kopyalama hatası:', error);
            if (typeof showToast === 'function') showToast('Resim oluşturma hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // COPY STAT AS TEXT - viz.js line 15551
    // =====================================================

    async function copyStatAsText(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const bodyEl = widget.querySelector('.viz-widget-body, .viz-stat-body');
        if (!bodyEl) return;

        try {
            const title = widget.querySelector('.viz-widget-title')?.textContent || '';
            const text = title + '\n' + '='.repeat(40) + '\n' + bodyEl.innerText;

            await navigator.clipboard.writeText(text);
            if (typeof showToast === 'function') showToast('📋 Metin olarak kopyalandı!', 'success');
        } catch (error) {
            if (typeof showToast === 'function') showToast('Kopyalama hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // AUDIT HELPERS - viz.js line 15277
    // =====================================================

    function generateAuditNote(usedColumns, datasetId) {
        const dataset = datasetId ? VIZ_STATE.getDatasetById(datasetId) : VIZ_STATE.getActiveDataset();
        if (!dataset || !dataset.audit_log) {
            return '<i class="fas fa-exclamation-triangle"></i> ⚠️ Bu değişkenlere eksik veri işlemi uygulanmamıştır.';
        }

        const notes = [];
        const processedCols = [];
        const unprocessedCols = [];

        usedColumns.forEach(col => {
            if (dataset.audit_log[col]) {
                const info = dataset.audit_log[col];
                processedCols.push(col);
                notes.push(`'${col}' (${info.original_missing} eksik → ${info.method_label})`);
            } else {
                unprocessedCols.push(col);
            }
        });

        if (notes.length > 0) {
            let html = `<i class="fas fa-info-circle"></i> Ön işleme: ${notes.join(', ')}.`;
            if (unprocessedCols.length > 0) {
                html += ` <span style="opacity:0.7">(${unprocessedCols.join(', ')} orijinal haliyle kullanıldı)</span>`;
            }
            return html;
        } else {
            return '<i class="fas fa-exclamation-triangle"></i> ⚠️ Bu değişkenlere eksik veri işlemi uygulanmamıştır. Ham veri kullanılmaktadır.';
        }
    }

    function addAuditFooterToWidget(widgetId, usedColumns) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        let footer = widget.querySelector('.viz-stat-audit-footer');
        if (!footer) {
            footer = document.createElement('div');
            footer.className = 'viz-stat-audit-footer';
            widget.querySelector('.viz-widget-body, .viz-stat-body')?.after(footer);
        }

        footer.innerHTML = generateAuditNote(usedColumns);
    }

    // =====================================================
    // SCRIPT LOADER
    // =====================================================

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.toggleStatMode = toggleStatMode;
    window.toggleFormula = toggleFormula;
    window.getFormulaForTest = getFormulaForTest;
    window.copyStatAsHTML = copyStatAsHTML;
    window.copyStatAsImage = copyStatAsImage;
    window.copyStatAsText = copyStatAsText;
    window.generateAuditNote = generateAuditNote;
    window.addAuditFooterToWidget = addAuditFooterToWidget;
    window.loadScript = loadScript;

    console.log('✅ viz-widget-utils.js loaded - Widget utilities ready');
})();
