
/**
 * viz-data-loader.js
 * Data Loading, Column Management, and Aggregation
 */

(function () {
    'use strict';

    /**
     * Update data profile summary with row/column counts and quality
     */
    function updateDataProfile() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const profileStats = document.getElementById('vizProfileStats');

        if (!state.data || state.data.length === 0) {
            if (profileStats) {
                profileStats.innerHTML = `
                    <div class="viz-stat-item">
                        <span class="viz-stat-icon"><i class="fas fa-info-circle"></i></span>
                        <span class="viz-stat-value">-</span>
                        <span class="viz-stat-label">Veri yok</span>
                    </div>
                `;
            }
            return;
        }

        const rowCount = state.data.length;
        const colCount = state.columns.length;

        // Eksik deger hesaplama
        let missingCount = 0;
        let totalCells = rowCount * colCount;

        state.data.forEach(row => {
            state.columns.forEach(col => {
                const val = row[col];
                if (val === null || val === undefined || val === '' || val === 'NaN') {
                    missingCount++;
                }
            });
        });

        const qualityPercent = totalCells > 0
            ? Math.round(((totalCells - missingCount) / totalCells) * 100)
            : 0;

        if (profileStats) {
            const lang = state.lang || 'tr';
            profileStats.innerHTML = `
                <div class="viz-stat-item">
                    <span class="viz-stat-icon"><i class="fas fa-table"></i></span>
                    <span class="viz-stat-value">${rowCount.toLocaleString()}</span>
                    <span class="viz-stat-label">${lang === 'tr' ? 'Satir' : 'Rows'}</span>
                </div>
                <div class="viz-stat-item">
                    <span class="viz-stat-icon"><i class="fas fa-columns"></i></span>
                    <span class="viz-stat-value">${colCount}</span>
                    <span class="viz-stat-label">${lang === 'tr' ? 'Sutun' : 'Columns'}</span>
                </div>
                <div class="viz-stat-item">
                    <span class="viz-stat-icon"><i class="fas fa-check-circle"></i></span>
                    <span class="viz-stat-value">${qualityPercent}%</span>
                    <span class="viz-stat-label">${lang === 'tr' ? 'Kalite' : 'Quality'}</span>
                </div>
            `;
        }

        // Trigger Detailed Profile Update (Legacy Port)
        if (typeof window.updateDataProfileFull === 'function') {
            window.updateDataProfileFull();
        }
    }

    /**
     * Render columns list with type detection and missing value count
     */
    function renderColumnsList() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const container = document.getElementById('vizColumnsList');
        if (!container) return;

        const texts = window.VIZ_TEXTS ? window.VIZ_TEXTS[state.lang || 'tr'] : {};

        if (state.columns.length === 0) {
            container.innerHTML = `
                <div class="viz-no-data" data-i18n="no_data_loaded">
                    <i class="fas fa-info-circle"></i>
                    ${texts.no_data_loaded || 'Veri yukleyin'}
                </div>
            `;
            return;
        }

        // Helper function to detect column type
        const analyzeColumn = (col) => {
            const dataset = state.getActiveDataset ? state.getActiveDataset() : null;
            const data = dataset?.data || state.data || [];
            if (!data || data.length === 0) return { type: 'text', missing: 0 };

            let numericCount = 0, dateCount = 0, emptyCount = 0;
            const total = data.length;

            data.forEach(row => {
                const v = row[col];
                if (v == null || v === '' || v === undefined) {
                    emptyCount++;
                } else if (!isNaN(parseFloat(v)) && isFinite(v)) {
                    numericCount++;
                } else if (!isNaN(Date.parse(v))) {
                    dateCount++;
                }
            });

            const validCount = total - emptyCount;
            let type = 'text';
            if (validCount === 0) type = 'empty';
            else if (numericCount / validCount > 0.7) type = 'numeric';
            else if (dateCount / validCount > 0.7) type = 'date';

            return { type, missing: emptyCount, total };
        };

        const typeStyles = {
            'numeric': { icon: 'fa-hashtag', color: '#3b82f6', label: 'Sayi', labelEn: 'Number' },
            'date': { icon: 'fa-calendar', color: '#8b5cf6', label: 'Tarih', labelEn: 'Date' },
            'text': { icon: 'fa-font', color: '#10b981', label: 'Metin', labelEn: 'Text' },
            'empty': { icon: 'fa-minus', color: '#6b7280', label: 'Bos', labelEn: 'Empty' }
        };

        container.innerHTML = state.columns.map((col) => {
            const analysis = analyzeColumn(col);
            const style = typeStyles[analysis.type] || typeStyles['text'];
            const missingLabel = state.lang === 'en' ? 'missing' : 'eksik';
            const typeLabel = state.lang === 'en' ? style.labelEn : style.label;
            const tooltip = `${col} (${typeLabel})${analysis.missing > 0 ? ` - ${analysis.missing} ${missingLabel}` : ''}`;

            return `
                <div class="viz-column-chip" draggable="true" data-column="${col}" data-type="${analysis.type}" 
                     style="border-left: 3px solid ${style.color}; flex-direction: column; align-items: flex-start;" title="${tooltip}">
                    <div style="display:flex; align-items:center; width:100%;">
                        <i class="fas ${style.icon}" style="color: ${style.color}; margin-right:6px;"></i>
                        <span class="viz-col-name">${col}</span>
                        <span class="viz-col-type" style="font-size:0.6rem; color:var(--gm-text-muted); margin-left:auto;">${typeLabel}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Sutun drag
        container.querySelectorAll('.viz-column-chip').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('column', el.dataset.column);
            });
        });
    }

    /**
     * Update X/Y axis dropdown selectors
     */
    function updateDropdowns() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const xSelect = document.getElementById('chartXAxis');
        const ySelect = document.getElementById('chartYAxis');
        const y2Select = document.getElementById('chartY2Axis');

        const lang = state.lang || 'tr';
        const selectText = lang === 'tr' ? 'Seçiniz...' : 'Select...';
        const autoText = lang === 'tr' ? 'Otomatik (seçilen 2. sütun)' : 'Auto (2nd selected column)';

        const optionsHtml = `<option value="">${selectText}</option>` +
            state.columns.map(col => `<option value="${col}">${col}</option>`).join('');

        if (xSelect) xSelect.innerHTML = optionsHtml;
        if (ySelect) {
            ySelect.innerHTML = optionsHtml;
            ySelect.multiple = true;
            ySelect.size = 4;
        }
        if (y2Select) {
            y2Select.innerHTML = `<option value="">${autoText}</option>` +
                state.columns.map(col => `<option value="${col}">${col}</option>`).join('');
        }

        // Settings form update logic handled in manager selectChart
    }

    /**
     * Clear all data and reset UI
     */
    function clearData() {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (state.activeDatasetId && state.datasets) {
            delete state.datasets[state.activeDatasetId];
        }
        state.activeDatasetId = null;
        state.data = [];
        state.columns = [];

        const fileInfo = document.getElementById('vizFileInfo');
        const dropZone = document.getElementById('vizDropZone');
        const fileOptions = document.getElementById('vizFileOptions');

        if (fileInfo) fileInfo.style.display = 'none';
        if (dropZone) dropZone.style.display = 'flex';
        if (fileOptions) fileOptions.style.display = 'none';

        renderColumnsList();
        updateDataProfile();
        updateDropdowns();

        if (typeof showToast === 'function') {
            showToast('Veri temizlendi', 'info');
        }
    }

    // ===================================
    // LOAD FILE & PREVIEW LOGIC
    // ===================================

    async function loadVizDataWithOptions(file) {
        if (!file) return;

        console.log('loadVizDataWithOptions:', file.name);
        window.VIZ_CURRENT_FILE = file;

        // Reset state
        const state = window.VIZ_STATE;
        state.data = [];
        state.columns = [];

        // Show loading
        const dropZone = document.getElementById('vizDropZone');
        if (dropZone) dropZone.innerHTML = '<div class="viz-loading"><i class="fas fa-spinner fa-spin"></i> Dosya okunuyor...</div>';

        try {
            const reader = new FileReader();

            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // First sheet by default
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Raw rows for preview
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
                window.VIZ_RAW_PREVIEW_ROWS = rawRows.slice(0, 20).map(row => ({ cells: row })); // Cache first 20 rows

                // Parse actual data with header
                const headerRowIndex = window.VIZ_SELECTED_HEADER_ROW || 0;
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });

                state.data = jsonData;
                state.columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

                // UI Updates
                const fileInfo = document.getElementById('vizFileInfo');
                const fileName = document.getElementById('vizFileName');
                const fileMeta = document.getElementById('vizFileMeta');

                if (dropZone) dropZone.style.display = 'none';
                if (fileInfo) fileInfo.style.display = 'flex';
                if (fileName) fileName.textContent = file.name;
                if (fileMeta) fileMeta.textContent = `${(file.size / 1024).toFixed(1)} KB • ${state.data.length} satır`;

                document.getElementById('vizFileOptions').style.display = 'block';

                // Initial UI Render
                renderColumnsList();
                updateDropdowns();
                updateDataProfile(); // Crucial call for missing values display

                if (typeof showToast === 'function') {
                    showToast(`${state.data.length} satır yüklendi`, 'success');
                }
            };

            reader.readAsArrayBuffer(file);

        } catch (err) {
            console.error(err);
            if (dropZone) dropZone.innerHTML = '<div class="error">Dosya okunamadı.</div>';
            if (typeof showToast === 'function') showToast('Dosya hatası: ' + err.message, 'error');
        }
    }

    // Alias definition
    window.loadFileWithOptions = loadVizDataWithOptions;

    // ===================================
    // HEADER PREVIEW LOGIC
    // ===================================

    function showHeaderPreview() {
        const modal = document.getElementById("vizFilePreviewModal");
        if (!modal) return;

        const table = document.getElementById("vizPreviewTable");
        if (!table) return;

        const rawRows = window.VIZ_RAW_PREVIEW_ROWS || [];
        if (rawRows.length === 0) {
            table.innerHTML = '<tr><td>Önizleme verisi yok. Lütfen dosyayı tekrar yükleyin.</td></tr>';
            modal.style.display = "flex";
            return;
        }

        const selectedIndex = window.VIZ_SELECTED_HEADER_ROW || 0;

        let html = '';
        rawRows.forEach((rowObj, idx) => {
            const isSelected = idx === selectedIndex;
            const cells = rowObj.cells || [];

            // Satır stili
            const bgClass = isSelected ? 'background-color: rgba(74, 144, 217, 0.2);' : '';
            const borderClass = isSelected ? 'border: 2px solid var(--gm-primary);' : 'border-bottom: 1px solid var(--gm-card-border);';

            html += `<tr style="${bgClass} ${borderClass} cursor: pointer;" onclick="vizSelectHeaderRow(${idx})">`;

            // Satır numarası
            html += `<td style="width: 40px; text-align: center; color: var(--gm-text-muted); padding: 8px;">
                ${isSelected ? '<i class="fas fa-check" style="color: var(--gm-primary);"></i>' : (idx + 1)}
            </td>`;

            // Hücreler
            cells.forEach(cell => {
                const cellContent = (cell === null || cell === undefined) ? '' : String(cell);
                const cellStyle = isSelected ? 'font-weight: bold; color: var(--gm-primary);' : 'color: var(--gm-text);';
                html += `<td style="padding: 8px; border-left: 1px solid var(--gm-card-border); ${cellStyle}">${cellContent}</td>`;
            });

            html += '</tr>';
        });

        table.innerHTML = html;
        modal.style.display = "flex";

        // Global row selection handler definition
        if (!window.vizSelectHeaderRow) {
            window.vizSelectHeaderRow = function (idx) {
                window.VIZ_SELECTED_HEADER_ROW = idx;

                // Update selector dropdown in UI if exists
                const rowSelector = document.getElementById('vizHeaderRow');
                if (rowSelector) rowSelector.value = idx;

                // Reload data with new header
                if (window.VIZ_CURRENT_FILE) {
                    window.loadVizDataWithOptions(window.VIZ_CURRENT_FILE);
                }

                window.closeVizPreviewModal();
                if (typeof showToast === 'function') {
                    showToast(`${idx + 1}. satır başlık olarak ayarlandı`, 'success');
                }
            };
        }
    }

    function closeVizPreviewModal() {
        const modal = document.getElementById("vizFilePreviewModal");
        if (modal) modal.style.display = "none";
    }

    // Global exports
    window.updateDataProfile = updateDataProfile;
    window.renderColumnsList = renderColumnsList;
    window.updateDropdowns = updateDropdowns;
    window.clearData = clearData;
    window.loadVizDataWithOptions = loadVizDataWithOptions;
    window.showHeaderPreview = showHeaderPreview;
    window.closeVizPreviewModal = closeVizPreviewModal;

    console.log('✅ viz-data-loader.js Loaded (Fixed + loadVizDataWithOptions)');
})();
