/**
 * viz-data-transform.js
 * Data Transformation Functions - FULLY RESTORED
 * Filter, Sort, Fill Missing, Remove Outliers, Binning, Calculated Columns
 * Type Conversion, Merge/Split Columns, Find/Replace, Pivot/Unpivot
 */

(function () {
    'use strict';

    // =====================================================
    // FILTER FUNCTIONS
    // =====================================================

    function showFilterPanel() {
        const existingPanel = document.getElementById('filterPanel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const state = window.VIZ_STATE;
        if (!state || !state.columns || state.columns.length === 0) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'filterPanel';
        panel.className = 'viz-filter-panel';
        panel.innerHTML = `
            <div class="viz-filter-header">
                <h4><i class="fas fa-filter"></i> Veri Filtreleme</h4>
                <span class="viz-filter-close" onclick="document.getElementById('filterPanel').remove();">&times;</span>
            </div>
            <div class="viz-filter-body">
                <div class="viz-filter-row">
                    <select id="filterColumn">
                        ${state.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                    <select id="filterOperator">
                        <option value="equals">Eşit (=)</option>
                        <option value="not_equals">Eşit Değil (!=)</option>
                        <option value="contains">İçerir</option>
                        <option value="greater">Büyük (>)</option>
                        <option value="less">Küçük (<)</option>
                        <option value="greater_eq">Büyük Eşit (>=)</option>
                        <option value="less_eq">Küçük Eşit (<=)</option>
                    </select>
                    <input type="text" id="filterValue" placeholder="Değer...">
                    <button onclick="addFilter()"><i class="fas fa-plus"></i></button>
                </div>
                <div id="activeFilters" class="viz-active-filters"></div>
                <div class="viz-filter-actions">
                    <button onclick="applyFilters()"><i class="fas fa-check"></i> Uygula</button>
                    <button onclick="clearFilters()"><i class="fas fa-trash"></i> Temizle</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    function addFilter() {
        const column = document.getElementById('filterColumn')?.value;
        const operator = document.getElementById('filterOperator')?.value;
        const value = document.getElementById('filterValue')?.value;
        const state = window.VIZ_STATE;

        if (!value) {
            if (typeof showToast === 'function') showToast('Filtre değeri girin', 'warning');
            return;
        }

        if (!state.filters) state.filters = [];
        state.filters.push({ column, operator, value });
        renderActiveFilters();
        const filterInput = document.getElementById('filterValue');
        if (filterInput) filterInput.value = '';
    }

    function renderActiveFilters() {
        const container = document.getElementById('activeFilters');
        const state = window.VIZ_STATE;
        if (!container || !state.filters) return;

        container.innerHTML = state.filters.map((f, i) => `
            <span class="viz-filter-tag">
                ${f.column} ${getOperatorSymbol(f.operator)} ${f.value}
                <i class="fas fa-times" onclick="removeFilter(${i})"></i>
            </span>
        `).join('');
    }

    function getOperatorSymbol(op) {
        const symbols = {
            'equals': '=', 'not_equals': '≠', 'contains': '∋',
            'greater': '>', 'less': '<', 'greater_eq': '≥', 'less_eq': '≤'
        };
        return symbols[op] || op;
    }

    function removeFilter(index) {
        const state = window.VIZ_STATE;
        if (state.filters) {
            state.filters.splice(index, 1);
            renderActiveFilters();
        }
    }

    function applyFilters() {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !state.filters || state.filters.length === 0) {
            if (typeof showToast === 'function') showToast('Filtre yok veya veri yüklenmedi', 'warning');
            return;
        }

        const originalCount = state.data.length;

        state.data = state.data.filter(row => {
            return state.filters.every(f => {
                const val = row[f.column];
                const filterVal = f.value;

                switch (f.operator) {
                    case 'equals': return String(val) === filterVal;
                    case 'not_equals': return String(val) !== filterVal;
                    case 'contains': return String(val).toLowerCase().includes(filterVal.toLowerCase());
                    case 'greater': return parseFloat(val) > parseFloat(filterVal);
                    case 'less': return parseFloat(val) < parseFloat(filterVal);
                    case 'greater_eq': return parseFloat(val) >= parseFloat(filterVal);
                    case 'less_eq': return parseFloat(val) <= parseFloat(filterVal);
                    default: return true;
                }
            });
        });

        const newCount = state.data.length;
        if (typeof showToast === 'function') showToast(`${originalCount - newCount} satır filtrelendi (${newCount} kaldı)`, 'success');

        document.getElementById('filterPanel')?.remove();
        if (state.charts) state.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });
        if (typeof updateDataProfile === 'function') updateDataProfile();
    }

    function clearFilters() {
        const state = window.VIZ_STATE;
        if (state) state.filters = [];
        renderActiveFilters();
        if (typeof showToast === 'function') showToast('Filtreler temizlendi', 'info');
    }

    // =====================================================
    // SORT FUNCTIONS
    // =====================================================

    function showSortPanel() {
        const existingPanel = document.getElementById('sortPanel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const state = window.VIZ_STATE;
        if (!state || !state.columns || state.columns.length === 0) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'sortPanel';
        panel.className = 'viz-filter-panel';
        panel.innerHTML = `
            <div class="viz-filter-header">
                <h4><i class="fas fa-sort"></i> Veri Sıralama</h4>
                <span class="viz-filter-close" onclick="document.getElementById('sortPanel').remove();">&times;</span>
            </div>
            <div class="viz-filter-body">
                <div class="viz-filter-row">
                    <select id="sortColumn">
                        ${state.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                    <select id="sortOrder">
                        <option value="asc">Artan (A-Z, 0-9)</option>
                        <option value="desc">Azalan (Z-A, 9-0)</option>
                    </select>
                </div>
                <button onclick="applySort()" class="gm-gradient-btn" style="width:100%; margin-top:15px;">
                    <i class="fas fa-sort"></i> Sırala
                </button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    function applySort() {
        const column = document.getElementById('sortColumn')?.value;
        const order = document.getElementById('sortOrder')?.value;
        const state = window.VIZ_STATE;

        if (!state || !state.data) return;

        state.data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // Sayısal mı kontrol et
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return order === 'asc' ? numA - numB : numB - numA;
            }

            // String karşılaştırma
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();

            if (order === 'asc') {
                return valA.localeCompare(valB);
            } else {
                return valB.localeCompare(valA);
            }
        });

        document.getElementById('sortPanel')?.remove();
        if (typeof showToast === 'function') showToast(`"${column}" sütununa göre sıralandı (${order === 'asc' ? 'artan' : 'azalan'})`, 'success');
        if (state.charts) state.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });
    }

    // Alias for new modular system
    function sortData(column, order = 'asc') {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        state.data.sort((a, b) => {
            const numA = parseFloat(a[column]);
            const numB = parseFloat(b[column]);

            if (!isNaN(numA) && !isNaN(numB)) {
                return order === 'asc' ? numA - numB : numB - numA;
            }

            const strA = String(a[column] || '').toLowerCase();
            const strB = String(b[column] || '').toLowerCase();
            return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });

        if (typeof showToast === 'function') showToast(`Sıralama uygulandı: ${column} (${order})`, 'success');
    }

    function filterData(column, operator, value) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        const originalCount = state.data.length;

        state.data = state.data.filter(row => {
            const val = row[column];
            switch (operator) {
                case 'equals': return String(val) === String(value);
                case 'not_equals': return String(val) !== String(value);
                case 'contains': return String(val).toLowerCase().includes(String(value).toLowerCase());
                case 'greater': return parseFloat(val) > parseFloat(value);
                case 'less': return parseFloat(val) < parseFloat(value);
                case 'greater_eq': return parseFloat(val) >= parseFloat(value);
                case 'less_eq': return parseFloat(val) <= parseFloat(value);
                default: return true;
            }
        });

        if (typeof showToast === 'function') showToast(`${originalCount - state.data.length} satır filtrelendi`, 'success');
    }

    // =====================================================
    // FILL MISSING DATA
    // =====================================================

    function fillMissingData(column, method = 'mean') {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        const values = state.data
            .map(row => parseFloat(row[column]))
            .filter(v => !isNaN(v));

        if (values.length === 0) {
            if (typeof showToast === 'function') showToast('Sayısal veri bulunamadı', 'error');
            return;
        }

        let fillValue;

        switch (method) {
            case 'mean':
                fillValue = values.reduce((a, b) => a + b, 0) / values.length;
                break;
            case 'median':
                const sorted = [...values].sort((a, b) => a - b);
                fillValue = sorted.length % 2 === 0
                    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                    : sorted[Math.floor(sorted.length / 2)];
                break;
            case 'mode':
                const freq = {};
                values.forEach(v => freq[v] = (freq[v] || 0) + 1);
                fillValue = parseFloat(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
                break;
            case 'zero':
                fillValue = 0;
                break;
            default:
                fillValue = 0;
        }

        let filledCount = 0;
        state.data.forEach(row => {
            const val = row[column];
            if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
                row[column] = fillValue;
                filledCount++;
            }
        });

        if (typeof showToast === 'function') showToast(`${filledCount} eksik değer "${fillValue.toFixed ? fillValue.toFixed(2) : fillValue}" ile dolduruldu`, 'success');
        if (state.charts) state.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });

        return filledCount;
    }

    // =====================================================
    // REMOVE OUTLIERS
    // =====================================================

    function removeOutliers(column, method = 'iqr', threshold = 1.5) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        const values = state.data
            .map((row, i) => ({ index: i, value: parseFloat(row[column]) }))
            .filter(v => !isNaN(v.value));

        if (values.length === 0) {
            if (typeof showToast === 'function') showToast('Sayısal veri bulunamadı', 'error');
            return;
        }

        let outlierIndices = [];

        if (method === 'iqr') {
            const sorted = values.map(v => v.value).sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lower = q1 - threshold * iqr;
            const upper = q3 + threshold * iqr;

            outlierIndices = values
                .filter(v => v.value < lower || v.value > upper)
                .map(v => v.index);
        } else { // z-score
            const mean = values.reduce((a, b) => a + b.value, 0) / values.length;
            const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b.value - mean, 2), 0) / values.length);

            outlierIndices = values
                .filter(v => Math.abs((v.value - mean) / std) > threshold)
                .map(v => v.index);
        }

        const originalCount = state.data.length;
        state.data = state.data.filter((_, i) => !outlierIndices.includes(i));
        const removedCount = originalCount - state.data.length;

        if (typeof showToast === 'function') showToast(`${removedCount} outlier temizlendi (${method.toUpperCase()}, threshold=${threshold})`, 'success');
        if (state.charts) state.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });
        if (typeof updateDataProfile === 'function') updateDataProfile();
    }

    // =====================================================
    // BINNING (DISCRETIZATION)
    // =====================================================

    function binColumn(column, binCount = 5, newColumnName = null) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        const values = state.data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
        if (values.length === 0) {
            if (typeof showToast === 'function') showToast('Sayısal veri bulunamadı', 'error');
            return;
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / binCount;

        const newCol = newColumnName || `${column}_binned`;

        state.data.forEach(row => {
            const val = parseFloat(row[column]);
            if (!isNaN(val)) {
                const binIndex = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
                const binStart = (min + binIndex * binWidth).toFixed(1);
                const binEnd = (min + (binIndex + 1) * binWidth).toFixed(1);
                row[newCol] = `${binStart}-${binEnd}`;
            } else {
                row[newCol] = 'Missing';
            }
        });

        if (!state.columns.includes(newCol)) {
            state.columns.push(newCol);
        }

        if (typeof showToast === 'function') showToast(`"${newCol}" sütunu oluşturuldu (${binCount} bin)`, 'success');
        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
    }

    // =====================================================
    // CALCULATED COLUMN
    // =====================================================

    function addCalculatedColumn(formula, newColumnName) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !formula || !newColumnName) return;

        try {
            state.data.forEach(row => {
                // Formülü değerlendir
                let evalFormula = formula;
                state.columns.forEach(col => {
                    const val = parseFloat(row[col]) || 0;
                    evalFormula = evalFormula.replace(new RegExp(`\\[${col}\\]`, 'g'), val);
                });

                row[newColumnName] = eval(evalFormula);
            });

            if (!state.columns.includes(newColumnName)) {
                state.columns.push(newColumnName);
            }

            if (typeof showToast === 'function') showToast(`"${newColumnName}" sütunu oluşturuldu`, 'success');
            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
        } catch (error) {
            if (typeof showToast === 'function') showToast('Formül hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // REMOVE DUPLICATES
    // =====================================================

    function removeDuplicates(columns = null) {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return;

        const checkColumns = columns || state.columns;
        const seen = new Set();
        const originalCount = state.data.length;

        state.data = state.data.filter(row => {
            const key = checkColumns.map(c => row[c]).join('|');
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });

        const removedCount = originalCount - state.data.length;
        if (typeof showToast === 'function') showToast(`${removedCount} duplicate satır kaldırıldı`, 'success');
        if (state.charts) state.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });
        if (typeof updateDataProfile === 'function') updateDataProfile();
    }

    // =====================================================
    // TYPE CONVERSION
    // =====================================================

    function convertColumnType(column, toType) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        let convertedCount = 0;

        state.data.forEach(row => {
            const val = row[column];

            try {
                switch (toType) {
                    case 'number':
                        row[column] = parseFloat(val) || 0;
                        break;
                    case 'integer':
                        row[column] = parseInt(val) || 0;
                        break;
                    case 'string':
                        row[column] = String(val);
                        break;
                    case 'boolean':
                        row[column] = val === 'true' || val === '1' || val === true;
                        break;
                    case 'date':
                        row[column] = new Date(val).toISOString().split('T')[0];
                        break;
                }
                convertedCount++;
            } catch (e) {
                console.warn(`Dönüştürme hatası: ${val}`);
            }
        });

        if (typeof showToast === 'function') showToast(`${convertedCount} değer ${toType} tipine dönüştürüldü`, 'success');
    }

    // =====================================================
    // MERGE COLUMNS
    // =====================================================

    function mergeColumns(col1, col2, newColName, delimiter = ' ') {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return;

        state.data.forEach(row => {
            row[newColName] = `${row[col1] || ''}${delimiter}${row[col2] || ''}`;
        });

        if (!state.columns.includes(newColName)) {
            state.columns.push(newColName);
        }

        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        if (typeof showToast === 'function') showToast(`"${newColName}" sütunu oluşturuldu`, 'success');
    }

    // =====================================================
    // SPLIT COLUMN
    // =====================================================

    function splitColumn(column, delimiter, newColNames) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        state.data.forEach(row => {
            const parts = String(row[column]).split(delimiter);
            newColNames.forEach((name, i) => {
                row[name] = parts[i] || '';
            });
        });

        newColNames.forEach(name => {
            if (!state.columns.includes(name)) {
                state.columns.push(name);
            }
        });

        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        if (typeof showToast === 'function') showToast(`${newColNames.length} yeni sütun oluşturuldu`, 'success');
    }

    // =====================================================
    // FIND AND REPLACE
    // =====================================================

    function findAndReplace(column, find, replace, useRegex = false) {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        let replacedCount = 0;

        state.data.forEach(row => {
            const val = String(row[column]);
            let newVal;

            if (useRegex) {
                const regex = new RegExp(find, 'g');
                newVal = val.replace(regex, replace);
            } else {
                newVal = val.split(find).join(replace);
            }

            if (newVal !== val) {
                row[column] = newVal;
                replacedCount++;
            }
        });

        if (typeof showToast === 'function') showToast(`${replacedCount} değer değiştirildi`, 'success');
        if (state.charts) state.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });
    }

    // =====================================================
    // PIVOT DATA
    // =====================================================

    function pivotData(rowField, colField, valueField, aggFunc = 'sum') {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const rows = [...new Set(state.data.map(d => d[rowField]))];
        const cols = [...new Set(state.data.map(d => d[colField]))];

        const pivot = {};
        rows.forEach(row => {
            pivot[row] = {};
            cols.forEach(col => {
                const values = state.data
                    .filter(d => d[rowField] === row && d[colField] === col)
                    .map(d => parseFloat(d[valueField]) || 0);

                switch (aggFunc) {
                    case 'sum':
                        pivot[row][col] = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'avg':
                        pivot[row][col] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                        break;
                    case 'count':
                        pivot[row][col] = values.length;
                        break;
                    case 'min':
                        pivot[row][col] = values.length ? Math.min(...values) : 0;
                        break;
                    case 'max':
                        pivot[row][col] = values.length ? Math.max(...values) : 0;
                        break;
                }
            });
        });

        if (typeof showToast === 'function') showToast('Pivot tablosu oluşturuldu', 'success');
        return { rows, cols, data: pivot };
    }

    // =====================================================
    // UNPIVOT DATA (MELT)
    // =====================================================

    function unpivotData(idColumns, valueColumns, varName = 'Variable', valueName = 'Value') {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return null;

        const unpivoted = [];

        state.data.forEach(row => {
            valueColumns.forEach(col => {
                const newRow = {};
                idColumns.forEach(id => newRow[id] = row[id]);
                newRow[varName] = col;
                newRow[valueName] = row[col];
                unpivoted.push(newRow);
            });
        });

        state.data = unpivoted;
        state.columns = [...idColumns, varName, valueName];

        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        if (typeof showToast === 'function') showToast(`Unpivot tamamlandı (${unpivoted.length} satır)`, 'success');

        return unpivoted;
    }

    // =====================================================
    // NORMALIZE DATA
    // =====================================================

    function normalizeColumn(column, method = 'minmax') {
        const state = window.VIZ_STATE;
        if (!state || !state.data || !column) return;

        const values = state.data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

        const newCol = `${column}_normalized`;

        state.data.forEach(row => {
            const val = parseFloat(row[column]);
            if (!isNaN(val)) {
                if (method === 'minmax') {
                    row[newCol] = (val - min) / (max - min);
                } else if (method === 'zscore') {
                    row[newCol] = (val - mean) / std;
                }
            } else {
                row[newCol] = 0;
            }
        });

        if (!state.columns.includes(newCol)) {
            state.columns.push(newCol);
        }

        if (typeof showToast === 'function') showToast(`"${newCol}" sütunu oluşturuldu (${method})`, 'success');
        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
    }

    // =====================================================
    // SAMPLE DATA
    // =====================================================

    function sampleData(n, method = 'random') {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return;

        const originalCount = state.data.length;
        if (n >= originalCount) return;

        if (method === 'random') {
            // Fisher-Yates shuffle and take first n
            const shuffled = [...state.data];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            state.data = shuffled.slice(0, n);
        } else if (method === 'systematic') {
            const step = Math.floor(originalCount / n);
            state.data = state.data.filter((_, i) => i % step === 0).slice(0, n);
        } else if (method === 'first') {
            state.data = state.data.slice(0, n);
        } else if (method === 'last') {
            state.data = state.data.slice(-n);
        }

        if (typeof showToast === 'function') showToast(`${n} satır örneklendi (${method})`, 'success');
        if (typeof updateDataProfile === 'function') updateDataProfile();
    }

    // =====================================================
    // EXECUTE JOIN (INJECTED)
    // =====================================================

    async function executeJoin() {
        const leftId = document.getElementById('joinLeftDataset')?.value;
        const rightId = document.getElementById('joinRightDataset')?.value;
        const leftKey = document.getElementById('joinLeftKey')?.value;
        const rightKey = document.getElementById('joinRightKey')?.value;
        const joinType = document.getElementById('joinType')?.value || 'inner';

        const state = window.VIZ_STATE;
        if (!state) return;

        const leftDs = typeof state.getDatasetById === 'function' ? state.getDatasetById(leftId) : null;
        const rightDs = typeof state.getDatasetById === 'function' ? state.getDatasetById(rightId) : null;

        if (!leftDs?.file || !rightDs?.file) {
            if (typeof showToast === 'function') showToast('Veri seti dosyaları bulunamadı', 'error');
            return;
        }

        if (typeof showToast === 'function') showToast('Birleştiriliyor...', 'info');

        const formData = new FormData();
        formData.append('left_file', leftDs.file);
        formData.append('right_file', rightDs.file);
        formData.append('left_key', leftKey);
        formData.append('right_key', rightKey);
        formData.append('join_type', joinType);

        try {
            const response = await fetch('/viz/join', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Birleştirme hatası');
            }

            const result = await response.json();

            // Yeni dataset olarak ekle
            const newFile = new File([JSON.stringify(result.data)], `join_${leftDs.name}_${rightDs.name}.json`, { type: 'application/json' });
            if (typeof state.addDataset === 'function') {
                state.addDataset(newFile, result.data, result.columns, result.columns_info, []);
            }

            // UI güncelle
            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
            if (typeof updateDataProfile === 'function') updateDataProfile();
            if (typeof updateDatasetSelector === 'function') updateDatasetSelector();

            // Modal kapat
            const modal = document.querySelector('.viz-stat-modal-overlay');
            if (modal) modal.remove();

            if (typeof showToast === 'function') {
                showToast(`Birleştirildi! ${result.row_count || result.data?.length || 0} satır oluşturuldu`, 'success');
            }

        } catch (error) {
            console.error('JOIN hatası:', error);
            if (typeof showToast === 'function') {
                showToast('Birleştirme hatası: ' + error.message, 'error');
            }
        }
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    // Filter
    window.showFilterPanel = showFilterPanel;
    window.addFilter = addFilter;
    window.removeFilter = removeFilter;
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    window.renderActiveFilters = renderActiveFilters;
    window.getOperatorSymbol = getOperatorSymbol;
    window.filterData = filterData;

    // Sort
    window.showSortPanel = showSortPanel;
    window.applySort = applySort;
    window.sortData = sortData;

    // Missing Data
    window.fillMissingData = fillMissingData;

    // Outliers
    window.removeOutliers = removeOutliers;

    // Binning
    window.binColumn = binColumn;

    // Calculated Column
    window.addCalculatedColumn = addCalculatedColumn;

    // Duplicates
    window.removeDuplicates = removeDuplicates;

    // Type Conversion
    window.convertColumnType = convertColumnType;

    // Merge/Split
    window.mergeColumns = mergeColumns;
    window.splitColumn = splitColumn;

    // Find/Replace
    window.findAndReplace = findAndReplace;

    // Pivot/Unpivot
    window.pivotData = pivotData;
    window.unpivotData = unpivotData;

    // Normalize
    window.normalizeColumn = normalizeColumn;

    // Sample
    window.sampleData = sampleData;

    // Join
    window.executeJoin = executeJoin;

    console.log('✅ viz-data-transform.js FULLY RESTORED - with executeJoin');
})();
