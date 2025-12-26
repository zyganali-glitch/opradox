/**
 * viz-data-profile.js
 * Data Profiling and Quality Analysis
 */

(function () {
    'use strict';

    /**
     * Run comprehensive data profile analysis
     * Analyzes column types, missing values, and data quality
     */
    function runDataProfile() {
        const state = window.VIZ_STATE;

        const resultsDiv = document.getElementById('profileResults');
        const rowsEl = document.getElementById('profileRows');
        const colsEl = document.getElementById('profileCols');
        const qualityEl = document.getElementById('profileQuality');
        const typesEl = document.getElementById('columnTypes');
        const missingEl = document.getElementById('missingValuesList');

        if (!resultsDiv) return;

        // Veri kontrolu
        let data = state ? state.data : null;
        let columns = state ? state.columns : [];

        // Demo veri (eger gercek veri yoksa)
        if (!data || data.length === 0) {
            data = [
                { 'Urun': 'Laptop', 'Fiyat': 15000, 'Stok': 50, 'Tarih': '2024-01-15' },
                { 'Urun': 'Telefon', 'Fiyat': 8000, 'Stok': null, 'Tarih': '2024-01-16' },
                { 'Urun': 'Tablet', 'Fiyat': null, 'Stok': 30, 'Tarih': '2024-01-17' },
                { 'Urun': 'Kulaklik', 'Fiyat': 500, 'Stok': 200, 'Tarih': null },
                { 'Urun': null, 'Fiyat': 1200, 'Stok': 100, 'Tarih': '2024-01-19' }
            ];
            columns = ['Urun', 'Fiyat', 'Stok', 'Tarih'];
        }

        const rowCount = data.length;
        const colCount = columns.length;

        // Sutun analizi
        const columnAnalysis = columns.map(col => {
            const values = data.map(row => row[col]);
            const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
            const nullCount = values.length - nonNull.length;

            // Tip tespiti
            let type = 'text';
            let icon = 'fa-font';
            let color = '#95a5a6';

            if (nonNull.length > 0) {
                const sample = nonNull[0];
                if (typeof sample === 'number' || !isNaN(parseFloat(sample))) {
                    type = 'number';
                    icon = 'fa-hashtag';
                    color = '#3498db';
                } else if (/^\d{4}-\d{2}-\d{2}/.test(sample)) {
                    type = 'date';
                    icon = 'fa-calendar';
                    color = '#9b59b6';
                } else if (typeof sample === 'boolean') {
                    type = 'boolean';
                    icon = 'fa-toggle-on';
                    color = '#e67e22';
                }
            }

            return {
                name: col,
                type: type,
                icon: icon,
                color: color,
                nullCount: nullCount,
                nullPercent: ((nullCount / values.length) * 100).toFixed(1)
            };
        });

        // Veri kalitesi hesapla
        const totalCells = rowCount * colCount;
        const nullCells = columnAnalysis.reduce((acc, col) => acc + col.nullCount, 0);
        const quality = (((totalCells - nullCells) / totalCells) * 100).toFixed(1);

        // UI guncelle
        resultsDiv.style.display = 'block';
        if (rowsEl) rowsEl.textContent = rowCount.toLocaleString();
        if (colsEl) colsEl.textContent = colCount;
        if (qualityEl) {
            qualityEl.textContent = quality + '%';
            qualityEl.className = 'viz-profile-value ' +
                (quality >= 90 ? 'viz-quality-good' : quality >= 70 ? 'viz-quality-ok' : 'viz-quality-bad');
        }

        // Sutun tipleri
        if (typesEl) {
            typesEl.innerHTML = columnAnalysis.map(col => `
                <div class="viz-column-type-item" style="border-left-color: ${col.color}">
                    <i class="fas ${col.icon}" style="color: ${col.color}"></i>
                    <span class="viz-col-name">${col.name}</span>
                    <span class="viz-col-type">${col.type}</span>
                </div>
            `).join('');
        }

        // Eksik degerler
        if (missingEl) {
            const missingCols = columnAnalysis.filter(col => col.nullCount > 0);
            if (missingCols.length > 0) {
                missingEl.innerHTML = missingCols.map(col => `
                    <div class="viz-missing-item">
                        <span class="viz-missing-col">${col.name}</span>
                        <div class="viz-missing-bar">
                            <div class="viz-missing-fill" style="width: ${col.nullPercent}%"></div>
                        </div>
                        <span class="viz-missing-percent">${col.nullPercent}%</span>
                    </div>
                `).join('');
            } else {
                missingEl.innerHTML = '<div class="viz-no-missing">Eksik deger yok</div>';
            }
        }

        if (typeof showToast === 'function') {
            showToast('Veri profili olusturuldu', 'success');
        }
    }

    /**
     * Generate detailed column statistics
     * @param {string} column - Column name
     * @returns {Object} Column statistics
     */
    function getColumnStats(column) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return null;

        const values = state.data.map(row => row[column]).filter(v => v != null && v !== '');
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));

        const stats = {
            column: column,
            totalCount: state.data.length,
            nonNullCount: values.length,
            nullCount: state.data.length - values.length,
            uniqueCount: new Set(values).size
        };

        if (numericValues.length > 0) {
            const sum = numericValues.reduce((a, b) => a + b, 0);
            stats.isNumeric = true;
            stats.min = Math.min(...numericValues);
            stats.max = Math.max(...numericValues);
            stats.sum = sum;
            stats.mean = sum / numericValues.length;

            // Median
            const sorted = [...numericValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            stats.median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

            // Standard deviation
            const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - stats.mean, 2), 0) / numericValues.length;
            stats.stdDev = Math.sqrt(variance);
        } else {
            stats.isNumeric = false;
        }

        return stats;
    }

    /**
     * Detect column data types for all columns
     * @returns {Object} Map of column names to detected types
     */
    function detectColumnTypes() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !state.columns) return {};

        const types = {};

        state.columns.forEach(col => {
            const sampleValues = state.data.slice(0, 20).map(r => r[col]).filter(v => v != null && v !== '');

            if (sampleValues.length === 0) {
                types[col] = 'empty';
                return;
            }

            let numericCount = 0, dateCount = 0, boolCount = 0;

            sampleValues.forEach(v => {
                if (typeof v === 'boolean' || v === 'true' || v === 'false') {
                    boolCount++;
                } else if (!isNaN(parseFloat(v)) && isFinite(v)) {
                    numericCount++;
                } else if (/^\d{4}-\d{2}-\d{2}/.test(v) || !isNaN(Date.parse(v))) {
                    dateCount++;
                }
            });

            const threshold = sampleValues.length * 0.7;

            if (numericCount >= threshold) types[col] = 'numeric';
            else if (dateCount >= threshold) types[col] = 'date';
            else if (boolCount >= threshold) types[col] = 'boolean';
            else types[col] = 'text';
        });

        return types;
    }

    /**
     * Get data quality report
     * @returns {Object} Quality report with metrics
     */
    function getDataQualityReport() {
        const state = window.VIZ_STATE;
        if (!state || !state.data) {
            return { quality: 0, issues: [] };
        }

        const issues = [];
        let totalCells = 0;
        let missingCells = 0;

        state.columns.forEach(col => {
            const values = state.data.map(row => row[col]);
            const missing = values.filter(v => v === null || v === undefined || v === '').length;

            totalCells += values.length;
            missingCells += missing;

            if (missing > 0) {
                issues.push({
                    column: col,
                    issue: 'missing_values',
                    count: missing,
                    percent: ((missing / values.length) * 100).toFixed(1)
                });
            }
        });

        const quality = totalCells > 0 ? ((totalCells - missingCells) / totalCells) * 100 : 0;

        return {
            quality: quality.toFixed(1),
            totalRows: state.data.length,
            totalColumns: state.columns.length,
            totalCells: totalCells,
            missingCells: missingCells,
            issues: issues
        };
    }

    /**
     * Update the left sidebar data profile (rows, cols, missing values)
     * Restored from old viz.js for backward compatibility
     */
    function updateDataProfileFull() {
        const state = window.VIZ_STATE;
        const profileDiv = document.getElementById('vizDataProfileFull');

        if (!profileDiv || !state || !state.data) return;

        profileDiv.style.display = 'block';

        // Row/Column counts
        const rowCountEl = document.getElementById('vizRowCountFull');
        const colCountEl = document.getElementById('vizColCountFull');

        if (rowCountEl) rowCountEl.textContent = state.data.length.toLocaleString();
        if (colCountEl) colCountEl.textContent = state.columns.length.toLocaleString();

        // Calculate Quality
        let totalCells = state.data.length * state.columns.length;
        let missingCells = 0;

        state.data.forEach(row => {
            state.columns.forEach(col => {
                const val = row[col];
                if (val === null || val === undefined || val === '') {
                    missingCells++;
                }
            });
        });

        const quality = totalCells > 0 ? Math.round((1 - missingCells / totalCells) * 100) : 0;
        const qualityEl = document.getElementById('vizQualityFull');
        if (qualityEl) qualityEl.textContent = quality + '%';

        // Column Types Summary
        const typesDiv = document.getElementById('columnTypesLeft');
        if (typesDiv && state.columnsInfo) {
            const typeCounts = { numeric: 0, text: 0, date: 0, boolean: 0 };
            state.columnsInfo.forEach(info => {
                const type = info.type || 'text';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            typesDiv.innerHTML = `
                <span class="viz-type-chip numeric" title="Sayısal"><i class="fas fa-hashtag"></i> ${typeCounts.numeric || 0}</span>
                <span class="viz-type-chip text" title="Metin"><i class="fas fa-font"></i> ${typeCounts.text || 0}</span>
                ${typeCounts.date ? `<span class="viz-type-chip date" title="Tarih"><i class="fas fa-calendar"></i> ${typeCounts.date}</span>` : ''}
            `;
        }

        // Missing Values List
        const missingDiv = document.getElementById('missingValuesListLeft');
        if (missingDiv) {
            const missingCols = [];
            state.columns.forEach(col => {
                const missing = state.data.filter(row => {
                    const val = row[col];
                    return val === null || val === undefined || val === '';
                }).length;

                if (missing > 0) {
                    missingCols.push({
                        col,
                        missing,
                        pct: Math.round((missing / state.data.length) * 100)
                    });
                }
            });

            if (missingCols.length === 0) {
                missingDiv.innerHTML = '<span style="color:var(--gm-success); font-size:0.8rem;"><i class="fas fa-check"></i> Eksik değer yok</span>';
            } else {
                // Show top 5 missing columns
                missingDiv.innerHTML = missingCols
                    .sort((a, b) => b.pct - a.pct)
                    .slice(0, 5)
                    .map(m => `
                        <div class="viz-missing-item-left">
                            <span class="name">${m.col}</span>
                            <span class="pct">${m.missing} (%${m.pct})</span>
                        </div>
                    `).join('');
            }
        }
    }

    // Global exports
    window.runDataProfile = runDataProfile;
    window.getColumnStats = getColumnStats;
    window.detectColumnTypes = detectColumnTypes;
    window.getDataQualityReport = getDataQualityReport;
    window.updateDataProfileFull = updateDataProfileFull;

    console.log('✅ viz-data-profile.js Loaded');
})();
