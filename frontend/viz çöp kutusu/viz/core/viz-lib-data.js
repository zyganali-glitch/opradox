/**
 * viz-lib-data.js
 * Data Loaders & Generators - Recovered from Legacy viz.js
 * Functions: load*, generate*, render*, handle*, check*, confirm*
 */

(function () {
    'use strict';

    const API_BASE = window.API_BASE || 'http://localhost:8100';

    // =====================================================
    // FILE HANDLERS (viz.js lines 773-838)
    // =====================================================

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            loadFile(file);
        }
    }

    async function loadFile(file) {
        try {
            // Yeni dataset oluştur ve aktif yap
            const datasetId = VIZ_STATE.addDataset(file, [], [], [], []);

            // Önce sayfa listesini al (Excel için)
            const sheetsFormData = new FormData();
            sheetsFormData.append('file', file);

            const sheetsResponse = await fetch('/viz/sheets', {
                method: 'POST',
                body: sheetsFormData
            });

            let sheets = [];
            let selectedSheet = null;

            if (sheetsResponse.ok) {
                const sheetsData = await sheetsResponse.json();
                sheets = sheetsData.sheets || [];
                VIZ_STATE.datasets[datasetId].sheets = sheets;

                // Sayfa seçici göster (birden fazla sayfa varsa)
                const sheetWrapper = document.getElementById('vizSheetSelectorWrapper');
                const sheetSelector = document.getElementById('vizSheetSelector');
                const fileOptions = document.getElementById('vizFileOptions');

                if (fileOptions) fileOptions.style.display = 'block';

                if (sheets.length > 1 && sheetWrapper && sheetSelector) {
                    sheetWrapper.style.display = 'block';
                    sheetSelector.innerHTML = sheets.map((s, i) =>
                        `<option value="${s}" ${i === 0 ? 'selected' : ''}>${s}</option>`
                    ).join('');
                    selectedSheet = sheets[0];

                    // Sayfa değişikliğinde veriyi yeniden yükle
                    sheetSelector.onchange = () => reloadWithOptions();
                } else if (sheetWrapper) {
                    sheetWrapper.style.display = 'none';
                }
            }

            // Başlık satırı seçiciyi ayarla
            const headerRowSelector = document.getElementById('vizHeaderRow');
            if (headerRowSelector) {
                headerRowSelector.onchange = () => reloadWithOptions();
            }

            // Veriyi yükle
            await loadDataWithOptions();

            // Dataset seçici UI'ı güncelle
            if (typeof updateDatasetSelector === 'function') updateDatasetSelector();

        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            if (typeof showToast === 'function') showToast('Hata: ' + error.message, 'error');
        }
    }

    // =====================================================
    // MULTIPLE FILE & URL LOADERS (viz.js lines 7650-7763)
    // =====================================================

    async function loadMultipleFiles(files) {
        const allData = [];
        const allColumns = new Set();

        if (typeof showProgress === 'function') showProgress('Dosyalar yükleniyor...', 0);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API_BASE}/viz/data`, { method: 'POST', body: formData });
                const result = await response.json();

                if (result.data) {
                    result.data.forEach(row => {
                        row._source_file = file.name;
                        allData.push(row);
                    });
                    result.columns.forEach(col => allColumns.add(col));
                }

                if (typeof showProgress === 'function') showProgress('Dosyalar yükleniyor...', Math.round((i + 1) / files.length * 100));
            } catch (error) {
                console.error(`Dosya yükleme hatası: ${file.name}`, error);
            }
        }

        if (typeof hideProgress === 'function') hideProgress();

        VIZ_STATE.data = allData;
        VIZ_STATE.columns = [...allColumns, '_source_file'];

        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        if (typeof updateDataProfile === 'function') updateDataProfile();

        if (typeof showToast === 'function') showToast(`${files.length} dosya yüklendi (${allData.length} toplam satır)`, 'success');
    }

    // CSV URL'den yükleme
    async function loadFromURL(url) {
        if (typeof showProgress === 'function') showProgress('URL\'den veri yükleniyor...');

        try {
            const response = await fetch(url);
            const text = await response.text();

            // CSV parse
            const lines = text.trim().split('\n');
            const delimiter = lines[0].includes('\t') ? '\t' : ',';
            const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));

            const data = lines.slice(1).map(line => {
                const values = line.split(delimiter);
                const row = {};
                headers.forEach((h, i) => {
                    row[h] = values[i]?.trim().replace(/"/g, '') || '';
                });
                return row;
            });

            if (typeof hideProgress === 'function') hideProgress();

            VIZ_STATE.data = data;
            VIZ_STATE.columns = headers;

            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
            if (typeof updateDataProfile === 'function') updateDataProfile();

            if (typeof showToast === 'function') showToast(`URL'den ${data.length} satır yüklendi`, 'success');
        } catch (error) {
            if (typeof hideProgress === 'function') hideProgress();
            if (typeof showToast === 'function') showToast('URL yükleme hatası: ' + error.message, 'error');
        }
    }

    // JSON API'den veri yükleme
    async function loadFromAPI(url, dataPath = null) {
        if (typeof showProgress === 'function') showProgress('API\'den veri yükleniyor...');

        try {
            const response = await fetch(url);
            let data = await response.json();

            // Data path varsa (örn: "results.items")
            if (dataPath) {
                const pathParts = dataPath.split('.');
                pathParts.forEach(part => {
                    data = data[part];
                });
            }

            if (!Array.isArray(data)) {
                data = [data];
            }

            if (typeof hideProgress === 'function') hideProgress();

            VIZ_STATE.data = data;
            VIZ_STATE.columns = Object.keys(data[0] || {});

            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
            if (typeof updateDataProfile === 'function') updateDataProfile();

            if (typeof showToast === 'function') showToast(`API'den ${data.length} kayıt yüklendi`, 'success');
        } catch (error) {
            if (typeof hideProgress === 'function') hideProgress();
            if (typeof showToast === 'function') showToast('API yükleme hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // FILE PREVIEW & CONFIRM (viz.js lines 8458-8570)
    // =====================================================

    function renderPreviewTable(data) {
        const container = document.getElementById('previewTableContainer');
        if (!data || data.length === 0) {
            if (container) container.innerHTML = '<p>Veri bulunamadı</p>';
            return;
        }

        const headerRow = parseInt(document.getElementById('previewHeaderRow')?.value || 0);
        const previewRows = data.slice(0, 20);

        let html = '<table>';
        previewRows.forEach((row, idx) => {
            const isHeader = idx === headerRow;
            html += `<tr class="${isHeader ? 'header-row' : ''}">`;

            const values = Array.isArray(row) ? row : Object.values(row);
            values.forEach(cell => {
                const tag = isHeader ? 'th' : 'td';
                html += `<${tag}>${cell !== null && cell !== undefined ? cell : ''}</${tag}>`;
            });

            html += '</tr>';
        });
        html += '</table>';

        if (data.length > 20) {
            html += `<p style="text-align:center; color:var(--gm-text-muted); margin-top:10px;">... ve ${data.length - 20} satır daha</p>`;
        }

        if (container) container.innerHTML = html;
    }

    function updatePreviewHighlight() {
        if (window.filePreviewData && window.filePreviewData.rawData) {
            renderPreviewTable(window.filePreviewData.rawData);
        }
    }

    async function updatePreviewSheet() {
        const sheetIdx = document.getElementById('previewSheetSelect')?.value;
        if (window.filePreviewData && window.filePreviewData.sheets && VIZ_STATE.file) {
            const formData = new FormData();
            formData.append('file', VIZ_STATE.file);

            try {
                const response = await fetch(`${API_BASE}/viz/data?sheet_index=${sheetIdx}&limit=50`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.data) {
                    window.filePreviewData.rawData = result.data.slice(0, 20);
                    renderPreviewTable(window.filePreviewData.rawData);
                }
            } catch (e) {
                console.error('Sheet load error:', e);
            }
        }
    }

    function closeFilePreviewModal() {
        const modal = document.querySelector('.viz-file-preview-modal');
        if (modal) modal.style.display = 'none';
    }

    async function confirmFileLoad() {
        const headerRow = parseInt(document.getElementById('previewHeaderRow')?.value || 0);
        const sheetIdx = parseInt(document.getElementById('previewSheetSelect')?.value || 0);

        closeFilePreviewModal();

        if (VIZ_STATE.file) {
            await loadFileWithOptions(VIZ_STATE.file, sheetIdx, headerRow);
        }
    }

    async function loadFileWithOptions(file, sheetIndex = 0, headerRow = 0) {
        const formData = new FormData();
        formData.append('file', file);

        if (typeof showProgress === 'function') showProgress('Veri yükleniyor...');

        try {
            const url = `${API_BASE}/viz/data?sheet_index=${sheetIndex}&header_row=${headerRow}`;
            const response = await fetch(url, { method: 'POST', body: formData });
            const result = await response.json();

            if (typeof hideProgress === 'function') hideProgress();

            if (result.data) {
                VIZ_STATE.data = result.data;
                VIZ_STATE.columns = result.columns || Object.keys(result.data[0] || {});

                // Sütun tiplerini belirle
                if (typeof detectColumnTypes === 'function') detectColumnTypes();

                // UI güncelle
                if (typeof renderColumnsListWithTypes === 'function') renderColumnsListWithTypes();
                if (typeof updateDropdowns === 'function') updateDropdowns();
                if (typeof updateDataProfile === 'function') updateDataProfile();
                if (typeof updateDataProfileFull === 'function') updateDataProfileFull();

                if (typeof showToast === 'function') showToast(`${result.data.length} satır yüklendi`, 'success');
            }
        } catch (error) {
            if (typeof hideProgress === 'function') hideProgress();
            if (typeof showToast === 'function') showToast('Hata: ' + error.message, 'error');
        }
    }

    // =====================================================
    // DATA PROFILE & GENERATORS (viz.js lines 6698-6846)
    // =====================================================

    function generateDataProfile() {
        if (!VIZ_STATE.data || !VIZ_STATE.columns) {
            if (typeof showToast === 'function') showToast('Veri yüklenmedi', 'warning');
            return null;
        }

        const profile = {
            summary: {
                total_rows: VIZ_STATE.data.length,
                total_columns: VIZ_STATE.columns.length,
                memory_estimate: JSON.stringify(VIZ_STATE.data).length,
                timestamp: new Date().toISOString()
            },
            columns: {}
        };

        VIZ_STATE.columns.forEach(col => {
            const values = VIZ_STATE.data.map(row => row[col]);
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            const uniqueValues = new Set(values);
            const missingCount = values.filter(v => v === '' || v === null || v === undefined).length;

            // Tip algılama
            let dataType = 'text';
            if (numericValues.length === values.length - missingCount) {
                const hasDecimals = numericValues.some(v => !Number.isInteger(v));
                dataType = hasDecimals ? 'float' : 'integer';
            } else if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
                dataType = 'date';
            }

            const colProfile = {
                data_type: dataType,
                missing_count: missingCount,
                missing_percent: ((missingCount / values.length) * 100).toFixed(2),
                unique_count: uniqueValues.size,
                unique_percent: ((uniqueValues.size / values.length) * 100).toFixed(2)
            };

            if (numericValues.length > 0) {
                const sorted = [...numericValues].sort((a, b) => a - b);
                const n = sorted.length;
                const mean = numericValues.reduce((a, b) => a + b, 0) / n;
                const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
                const std = Math.sqrt(variance);

                // Percentiles
                const percentile = (p) => {
                    const index = Math.floor(n * p);
                    return sorted[Math.min(index, n - 1)];
                };

                // Skewness (çarpıklık)
                const skewness = numericValues.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;

                // Kurtosis (basıklık)
                const kurtosis = numericValues.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / n - 3;

                Object.assign(colProfile, {
                    min: sorted[0],
                    max: sorted[n - 1],
                    mean: mean.toFixed(4),
                    median: percentile(0.5),
                    std: std.toFixed(4),
                    variance: variance.toFixed(4),
                    p25: percentile(0.25),
                    p50: percentile(0.5),
                    p75: percentile(0.75),
                    p90: percentile(0.90),
                    p99: percentile(0.99),
                    skewness: skewness.toFixed(4),
                    kurtosis: kurtosis.toFixed(4),
                    skewness_interpretation: skewness > 0.5 ? 'Sağa çarpık' : skewness < -0.5 ? 'Sola çarpık' : 'Simetrik',
                    kurtosis_interpretation: kurtosis > 0 ? 'Sivri dağılım' : kurtosis < 0 ? 'Yassı dağılım' : 'Normal dağılım'
                });
            }

            // En sık değerler
            const valueCounts = {};
            values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });
            colProfile.top_values = Object.entries(valueCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([val, count]) => ({ value: val, count, percent: ((count / values.length) * 100).toFixed(1) }));

            profile.columns[col] = colProfile;
        });

        return profile;
    }

    // Korelasyon matrisi hesapla (client-side)
    function calculateCorrelationMatrix() {
        if (!VIZ_STATE.data || !VIZ_STATE.columns) return null;

        const numericCols = VIZ_STATE.columns.filter(col => {
            const values = VIZ_STATE.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            return values.length > VIZ_STATE.data.length * 0.5; // En az %50 sayısal
        });

        if (numericCols.length < 2) {
            if (typeof showToast === 'function') showToast('Korelasyon için en az 2 sayısal sütun gerekli', 'warning');
            return null;
        }

        const matrix = {};

        numericCols.forEach(col1 => {
            matrix[col1] = {};
            numericCols.forEach(col2 => {
                if (col1 === col2) {
                    matrix[col1][col2] = 1;
                } else {
                    const vals1 = VIZ_STATE.data.map(row => parseFloat(row[col1]));
                    const vals2 = VIZ_STATE.data.map(row => parseFloat(row[col2]));

                    // Pearson korelasyon
                    const n = vals1.length;
                    const mean1 = vals1.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / n;
                    const mean2 = vals2.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / n;

                    let num = 0, den1 = 0, den2 = 0;
                    for (let i = 0; i < n; i++) {
                        const v1 = isNaN(vals1[i]) ? mean1 : vals1[i];
                        const v2 = isNaN(vals2[i]) ? mean2 : vals2[i];
                        num += (v1 - mean1) * (v2 - mean2);
                        den1 += Math.pow(v1 - mean1, 2);
                        den2 += Math.pow(v2 - mean2, 2);
                    }

                    matrix[col1][col2] = den1 * den2 === 0 ? 0 : (num / Math.sqrt(den1 * den2));
                }
            });
        });

        return { columns: numericCols, matrix };
    }

    // Örnek veri tablosu
    function generateDataPreview(limit = 10) {
        if (!VIZ_STATE.data) return null;

        return {
            columns: VIZ_STATE.columns,
            data: VIZ_STATE.data.slice(0, limit),
            total_rows: VIZ_STATE.data.length,
            showing: Math.min(limit, VIZ_STATE.data.length)
        };
    }

    // =====================================================
    // DATA WARNINGS (viz.js lines 6853-6900)
    // =====================================================

    const DATA_WARNINGS = {
        non_numeric: { icon: 'fas fa-exclamation-triangle', color: '#f39c12', message: 'Sayısal olmayan veri tespit edildi' },
        missing_data: { icon: 'fas fa-question-circle', color: '#e74c3c', message: 'Eksik veri bulundu' },
        large_data: { icon: 'fas fa-database', color: '#3498db', message: 'Büyük veri seti (>10K satır)' },
        incompatible: { icon: 'fas fa-chart-line', color: '#9b59b6', message: 'Grafik tipi uyumsuz olabilir' }
    };

    function checkDataWarnings(column, chartType) {
        const warnings = [];

        if (!VIZ_STATE.data || !column) return warnings;

        const values = VIZ_STATE.data.map(row => row[column]);
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        const missingCount = values.filter(v => v === '' || v === null || v === undefined).length;

        // Sayısal olmayan veri uyarısı
        if (numericValues.length < values.length * 0.5 && ['line', 'area', 'scatter', 'histogram'].includes(chartType)) {
            warnings.push(DATA_WARNINGS.non_numeric);
        }

        // Missing veri uyarısı
        if (missingCount > values.length * 0.1) {
            warnings.push({ ...DATA_WARNINGS.missing_data, message: `${missingCount} eksik değer (%${((missingCount / values.length) * 100).toFixed(1)})` });
        }

        // Büyük veri uyarısı
        if (VIZ_STATE.data.length > 10000) {
            warnings.push({ ...DATA_WARNINGS.large_data, message: `${VIZ_STATE.data.length.toLocaleString()} satır - performans düşebilir` });
        }

        return warnings;
    }

    function showWarnings(warnings) {
        if (warnings.length === 0) return;

        const container = document.createElement('div');
        container.className = 'viz-warnings-container';
        container.innerHTML = warnings.map(w => `
            <div class="viz-warning-item" style="border-left-color: ${w.color}">
                <i class="${w.icon}" style="color: ${w.color}"></i>
                <span>${w.message}</span>
            </div>
        `).join('');

        // 5 saniye sonra kapat
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 5000);
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.handleFileSelect = handleFileSelect;
    window.loadFile = loadFile;
    window.loadMultipleFiles = loadMultipleFiles;
    window.loadFromURL = loadFromURL;
    window.loadFromAPI = loadFromAPI;
    window.renderPreviewTable = renderPreviewTable;
    window.updatePreviewHighlight = updatePreviewHighlight;
    window.updatePreviewSheet = updatePreviewSheet;
    window.closeFilePreviewModal = closeFilePreviewModal;
    window.confirmFileLoad = confirmFileLoad;
    window.loadFileWithOptions = loadFileWithOptions;
    window.generateDataProfile = generateDataProfile;
    window.calculateCorrelationMatrix = calculateCorrelationMatrix;
    window.generateDataPreview = generateDataPreview;
    window.checkDataWarnings = checkDataWarnings;
    window.showWarnings = showWarnings;
    window.DATA_WARNINGS = DATA_WARNINGS;

    console.log('✅ viz-lib-data.js loaded - Data loaders & generators ready');
})();
