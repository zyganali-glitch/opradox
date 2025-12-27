// =====================================================
// DATA.JS - Opradox Visual Studio Data Module
// File handling, export, transform, aggregate, JOIN, SQL, Google Sheets
// =====================================================

import { VIZ_STATE, VIZ_TEXTS, getText } from './core.js';

// -----------------------------------------------------
// FILE HANDLING
// -----------------------------------------------------
export function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) loadFile(file);
}

export async function loadFile(file) {
    try {
        const datasetId = VIZ_STATE.addDataset(file, [], [], [], []);
        const sheetsFormData = new FormData();
        sheetsFormData.append('file', file);

        const sheetsResponse = await fetch('/viz/sheets', { method: 'POST', body: sheetsFormData });
        let sheets = [];

        if (sheetsResponse.ok) {
            const sheetsData = await sheetsResponse.json();
            sheets = sheetsData.sheets || [];
            VIZ_STATE.datasets[datasetId].sheets = sheets;

            const sheetWrapper = document.getElementById('vizSheetSelectorWrapper');
            const sheetSelector = document.getElementById('vizSheetSelector');
            const fileOptions = document.getElementById('vizFileOptions');

            if (fileOptions) fileOptions.style.display = 'block';

            if (sheets.length > 1 && sheetWrapper && sheetSelector) {
                sheetWrapper.style.display = 'block';
                sheetSelector.innerHTML = sheets.map((s, i) => `<option value="${s}" ${i === 0 ? 'selected' : ''}>${s}</option>`).join('');
                sheetSelector.onchange = () => reloadWithOptions();
            } else if (sheetWrapper) {
                sheetWrapper.style.display = 'none';
            }
        }

        const headerRowSelector = document.getElementById('vizHeaderRow');
        if (headerRowSelector) headerRowSelector.onchange = () => reloadWithOptions();

        await loadDataWithOptions();
        updateDatasetSelector();

    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        if (typeof showToast === 'function') showToast(getText('error') + ': ' + error.message, 'error');
    }
}

export function updateDatasetSelector() {
    const datasets = VIZ_STATE.getDatasetList();
    if (datasets.length <= 1) return;

    let selectorWrapper = document.getElementById('vizDatasetSelectorWrapper');
    if (!selectorWrapper) {
        const fileInfo = document.getElementById('vizFileInfo');
        if (fileInfo) {
            selectorWrapper = document.createElement('div');
            selectorWrapper.id = 'vizDatasetSelectorWrapper';
            selectorWrapper.className = 'viz-file-option';
            selectorWrapper.innerHTML = `<label><i class="fas fa-database"></i> <span data-i18n="select_dataset">Veri Seti</span></label><select id="vizDatasetSelector"></select>`;
            fileInfo.appendChild(selectorWrapper);
        }
    }

    const selector = document.getElementById('vizDatasetSelector');
    if (selector) {
        selector.innerHTML = datasets.map(d => `<option value="${d.id}" ${d.id === VIZ_STATE.activeDatasetId ? 'selected' : ''}>${d.name} (${d.rowCount} satır)</option>`).join('');
        selector.onchange = (e) => {
            VIZ_STATE.setActiveDataset(e.target.value);
            renderColumnsList();
            updateDropdowns();
            updateDataProfile();
            VIZ_STATE.charts.forEach(config => { if (typeof renderChart === 'function') renderChart(config); });
        };
    }
}

export async function loadDataWithOptions() {
    const file = VIZ_STATE.file;
    if (!file) return;

    const sheetSelector = document.getElementById('vizSheetSelector');
    const headerRowSelector = document.getElementById('vizHeaderRow');
    const selectedSheet = sheetSelector?.value || null;
    const headerRow = parseInt(headerRowSelector?.value || '0');

    const formData = new FormData();
    formData.append('file', file);

    let url = '/viz/data';
    const params = new URLSearchParams();
    if (selectedSheet) params.append('sheet_name', selectedSheet);
    params.append('header_row', headerRow.toString());
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Dosya yüklenemedi');

        const data = await response.json();
        VIZ_STATE.data = data.data || [];
        VIZ_STATE.columns = data.columns || [];
        VIZ_STATE.columnsInfo = data.columns_info || [];

        document.getElementById('vizDropZone').style.display = 'none';
        document.getElementById('vizFileInfo').style.display = 'block';
        document.getElementById('vizFileName').textContent = file.name;

        renderColumnsList();
        updateDropdowns();
        updateDataProfile();

        console.log(`✅ ${file.name} yüklendi: ${VIZ_STATE.data.length} satır, ${VIZ_STATE.columns.length} sütun`);
        if (typeof showToast === 'function') showToast(`${VIZ_STATE.data.length.toLocaleString('tr-TR')} satır yüklendi`, 'success');

        VIZ_STATE.charts.forEach(config => { if (typeof renderChart === 'function') renderChart(config); });

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        if (typeof showToast === 'function') showToast(getText('error') + ': ' + error.message, 'error');
    }
}

export function reloadWithOptions() { loadDataWithOptions(); }

export function clearData() {
    if (VIZ_STATE.activeDatasetId) VIZ_STATE.removeDataset(VIZ_STATE.activeDatasetId);

    const datasets = VIZ_STATE.getDatasetList();
    if (datasets.length > 0) {
        updateDatasetSelector();
        renderColumnsList();
        updateDropdowns();
        updateDataProfile();
        return;
    }

    document.getElementById('vizDropZone').style.display = 'flex';
    document.getElementById('vizFileInfo').style.display = 'none';
    document.getElementById('vizFileInput').value = '';

    const fileOptions = document.getElementById('vizFileOptions');
    if (fileOptions) fileOptions.style.display = 'none';

    const sheetWrapper = document.getElementById('vizSheetSelectorWrapper');
    if (sheetWrapper) sheetWrapper.style.display = 'none';

    const datasetWrapper = document.getElementById('vizDatasetSelectorWrapper');
    if (datasetWrapper) datasetWrapper.style.display = 'none';

    const headerRow = document.getElementById('vizHeaderRow');
    if (headerRow) headerRow.value = '0';

    const profile = document.getElementById('vizDataProfileFull');
    if (profile) profile.style.display = 'none';

    renderColumnsList();
    updateDropdowns();
}

// -----------------------------------------------------
// DATA PROFILE
// -----------------------------------------------------
export function updateDataProfile() {
    const profile = document.getElementById('vizDataProfileFull');
    if (!profile) return;

    if (!VIZ_STATE.data || !VIZ_STATE.columns.length) { profile.style.display = 'none'; return; }
    profile.style.display = 'block';

    const rowEl = document.getElementById('vizRowCountFull');
    const colEl = document.getElementById('vizColCountFull');
    const qualEl = document.getElementById('vizQualityFull');

    if (rowEl) rowEl.textContent = VIZ_STATE.data.length.toLocaleString('tr-TR');
    if (colEl) colEl.textContent = VIZ_STATE.columns.length;

    let emptyCount = 0;
    const missingByColumn = {};
    const totalCells = VIZ_STATE.data.length * VIZ_STATE.columns.length;

    VIZ_STATE.columns.forEach(col => missingByColumn[col] = 0);
    VIZ_STATE.data.forEach(row => {
        VIZ_STATE.columns.forEach(col => {
            if (row[col] === null || row[col] === '' || row[col] === undefined) {
                emptyCount++;
                missingByColumn[col]++;
            }
        });
    });

    const qualityPercent = totalCells > 0 ? Math.round((1 - emptyCount / totalCells) * 100) : 0;
    if (qualEl) {
        qualEl.textContent = `${qualityPercent}%`;
        qualEl.className = 'viz-profile-value-left ' + (qualityPercent >= 95 ? 'viz-quality-good' : 'viz-quality-warning');
    }

    const colTypesEl = document.getElementById('columnTypesLeft');
    if (colTypesEl && VIZ_STATE.columnsInfo) {
        const colors = { numeric: '#4a90d9', date: '#9a3050', text: '#6b7280' };
        const icons = { numeric: 'fa-hashtag', date: 'fa-calendar', text: 'fa-font' };
        colTypesEl.innerHTML = VIZ_STATE.columnsInfo.map(info => `<div class="viz-column-type-item-left" style="border-left-color: ${colors[info.type] || colors.text}"><i class="fas ${icons[info.type] || icons.text}"></i><span>${info.name}</span></div>`).join('');
    }

    const missingEl = document.getElementById('missingValuesListLeft');
    if (missingEl) {
        const missingCols = Object.entries(missingByColumn).filter(([_, count]) => count > 0);
        if (missingCols.length === 0) {
            missingEl.innerHTML = `<span class="viz-quality-good">${getText('no_missing')}</span>`;
        } else {
            missingEl.innerHTML = missingCols.map(([col, count]) => `<div class="viz-missing-item-left"><span>${col}</span><span class="count">${count}</span></div>`).join('');
        }
    }
}

export function renderColumnsList() {
    const container = document.getElementById('vizColumnsList');
    if (!container) return;

    if (VIZ_STATE.columns.length === 0) {
        container.innerHTML = `<div class="viz-no-data" data-i18n="no_data_loaded"><i class="fas fa-info-circle"></i>${getText('no_data_loaded')}</div>`;
        return;
    }

    const detectColType = (col) => {
        const dataset = VIZ_STATE.getActiveDataset();
        if (!dataset || !dataset.data) return 'text';
        const sampleValues = dataset.data.slice(0, 10).map(r => r[col]).filter(v => v != null && v !== '');
        let numericCount = 0, dateCount = 0;
        sampleValues.forEach(v => {
            if (!isNaN(parseFloat(v)) && isFinite(v)) numericCount++;
            else if (!isNaN(Date.parse(v))) dateCount++;
        });
        if (sampleValues.length === 0) return 'empty';
        if (numericCount / sampleValues.length > 0.7) return 'numeric';
        if (dateCount / sampleValues.length > 0.7) return 'date';
        return 'text';
    };

    const typeStyles = {
        'numeric': { icon: 'fa-hashtag', color: '#3b82f6', label: 'Sayı' },
        'date': { icon: 'fa-calendar', color: '#8b5cf6', label: 'Tarih' },
        'text': { icon: 'fa-font', color: '#10b981', label: 'Metin' },
        'empty': { icon: 'fa-minus', color: '#6b7280', label: 'Boş' }
    };

    container.innerHTML = VIZ_STATE.columns.map((col) => {
        const type = detectColType(col);
        const style = typeStyles[type] || typeStyles['text'];
        return `<div class="viz-column-chip" draggable="true" data-column="${col}" data-type="${type}" style="border-left: 3px solid ${style.color};" title="${col} (${style.label})"><i class="fas ${style.icon}" style="color: ${style.color};"></i><span class="viz-col-name">${col}</span><span class="viz-col-type" style="font-size:0.6rem; color:var(--gm-text-muted); margin-left:auto;">${style.label}</span></div>`;
    }).join('');

    container.querySelectorAll('.viz-column-chip').forEach(el => {
        el.addEventListener('dragstart', (e) => e.dataTransfer.setData('column', el.dataset.column));
    });
}

export function updateDropdowns() {
    const xSelect = document.getElementById('chartXAxis');
    const ySelect = document.getElementById('chartYAxis');
    const y2Select = document.getElementById('chartY2Axis');

    const optionsHtml = '<option value="">Seçin...</option>' + VIZ_STATE.columns.map(col => `<option value="${col}">${col}</option>`).join('');

    if (xSelect) xSelect.innerHTML = optionsHtml;
    if (ySelect) ySelect.innerHTML = optionsHtml;
    if (y2Select) y2Select.innerHTML = '<option value="">Otomatik (seçilen 2. sütun)</option>' + VIZ_STATE.columns.map(col => `<option value="${col}">${col}</option>`).join('');

    const useDualAxis = document.getElementById('useDualAxis');
    const y2AxisWrapper = document.getElementById('y2AxisWrapper');
    if (useDualAxis && y2AxisWrapper) {
        useDualAxis.onchange = function () { y2AxisWrapper.style.display = this.checked ? 'block' : 'none'; };
    }
}

// -----------------------------------------------------
// AGGREGATION (Client-Side)
// -----------------------------------------------------
export function aggregateData(data, xCol, yCol, aggType, dataLimit = 20) {
    if (!data || !data.length || !xCol || !yCol) {
        console.warn('aggregateData: Eksik parametre', { dataLen: data?.length, xCol, yCol });
        return { categories: [], values: [] };
    }

    const groups = {};
    let parseErrors = 0;

    data.forEach(row => {
        const key = String(row[xCol] ?? '(Boş)');
        let rawVal = row[yCol];
        if (typeof rawVal === 'string') rawVal = rawVal.replace(/\./g, '').replace(',', '.');
        const val = parseFloat(rawVal);
        if (isNaN(val)) parseErrors++;
        const numVal = isNaN(val) ? 0 : val;

        if (!groups[key]) groups[key] = { sum: 0, count: 0, values: [] };
        groups[key].sum += numVal;
        groups[key].count++;
        groups[key].values.push(numVal);
    });

    if (parseErrors > 0) console.warn(`⚠️ aggregateData: ${parseErrors} adet parse hatası`);

    const result = Object.entries(groups).map(([key, g]) => {
        let value;
        switch (aggType) {
            case 'sum': value = g.sum; break;
            case 'avg': case 'mean': value = g.count > 0 ? g.sum / g.count : 0; break;
            case 'count': value = g.count; break;
            case 'min': value = Math.min(...g.values); break;
            case 'max': value = Math.max(...g.values); break;
            default: value = g.sum;
        }
        return { category: key, value: Math.round(value * 100) / 100 };
    });

    result.sort((a, b) => b.value - a.value);
    const limited = dataLimit && dataLimit > 0 ? result.slice(0, dataLimit) : result;
    return { categories: limited.map(r => r.category), values: limited.map(r => r.value) };
}

// -----------------------------------------------------
// EXPORT FUNCTIONS
// -----------------------------------------------------
export function exportDataAsCSV() {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        if (typeof showToast === 'function') showToast('Dışa aktarılacak veri yok', 'warning');
        return;
    }

    const headers = VIZ_STATE.columns.join(',');
    const rows = VIZ_STATE.data.map(row => VIZ_STATE.columns.map(col => {
        const val = row[col];
        if (String(val).includes(',') || String(val).includes('"')) return `"${String(val).replace(/"/g, '""')}"`;
        return val;
    }).join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = 'veri_export.csv';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast(`${VIZ_STATE.data.length} satır CSV olarak indirildi`, 'success');
}

export function exportDataAsJSON() {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        if (typeof showToast === 'function') showToast('Dışa aktarılacak veri yok', 'warning');
        return;
    }

    const json = JSON.stringify(VIZ_STATE.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = 'veri_export.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast(`${VIZ_STATE.data.length} kayıt JSON olarak indirildi`, 'success');
}

// -----------------------------------------------------
// TRANSFORM FUNCTIONS
// -----------------------------------------------------
export function showTransformUI() {
    const existingModal = document.getElementById('transformModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'transformModal';
    modal.className = 'viz-transform-modal';
    modal.innerHTML = `
        <div class="viz-transform-content">
            <div class="viz-transform-header">
                <h3><i class="fas fa-magic"></i> Veri Dönüştürme</h3>
                <span class="viz-transform-close">&times;</span>
            </div>
            <div class="viz-transform-body">
                <div class="viz-transform-section">
                    <label>Kaynak Sütun:</label>
                    <select id="transformSource">${VIZ_STATE.columns.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                </div>
                <div class="viz-transform-section">
                    <label>Dönüşüm:</label>
                    <select id="transformType">
                        <option value="round">Yuvarla</option>
                        <option value="abs">Mutlak Değer</option>
                        <option value="log">Logaritma</option>
                        <option value="sqrt">Karekök</option>
                        <option value="percent">Yüzdeye Çevir</option>
                        <option value="normalize">Normalize (0-1)</option>
                        <option value="uppercase">Büyük Harf</option>
                        <option value="lowercase">Küçük Harf</option>
                    </select>
                </div>
                <div class="viz-transform-section">
                    <label>Yeni Sütun Adı:</label>
                    <input type="text" id="transformNewCol" placeholder="örn: transformed_column">
                </div>
                <button class="viz-transform-apply" onclick="applyTransform()">
                    <i class="fas fa-check"></i> Dönüştür
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.viz-transform-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

export function applyTransform() {
    const source = document.getElementById('transformSource').value;
    const type = document.getElementById('transformType').value;
    const newCol = document.getElementById('transformNewCol').value || `${source}_${type}`;

    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        if (typeof showToast === 'function') showToast('Dönüştürülecek veri yok', 'error');
        return;
    }

    const transforms = {
        round: v => Math.round(parseFloat(v) || 0),
        abs: v => Math.abs(parseFloat(v) || 0),
        log: v => Math.log(parseFloat(v) || 1),
        sqrt: v => Math.sqrt(parseFloat(v) || 0),
        percent: v => ((parseFloat(v) || 0) * 100).toFixed(2) + '%',
        normalize: (v, arr) => {
            const min = Math.min(...arr);
            const max = Math.max(...arr);
            return ((parseFloat(v) - min) / (max - min)).toFixed(4);
        },
        uppercase: v => String(v).toUpperCase(),
        lowercase: v => String(v).toLowerCase()
    };

    const values = VIZ_STATE.data.map(row => parseFloat(row[source]) || 0);
    VIZ_STATE.data.forEach((row, i) => { row[newCol] = transforms[type](row[source], values); });
    if (!VIZ_STATE.columns.includes(newCol)) VIZ_STATE.columns.push(newCol);

    document.getElementById('transformModal')?.remove();
    if (typeof showToast === 'function') showToast(`"${newCol}" sütunu oluşturuldu`, 'success');
}

// -----------------------------------------------------
// JOIN FUNCTIONS
// -----------------------------------------------------
export function showJoinModal() {
    const datasets = VIZ_STATE.getDatasetList();
    if (datasets.length < 2) {
        if (typeof showToast === 'function') showToast(getText('need_two_datasets'), 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.innerHTML = `
        <div class="viz-stat-modal">
            <div class="viz-stat-modal-header">
                <h3><i class="fas fa-code-merge"></i> ${getText('join_title')}</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div class="viz-form-row">
                        <label>${getText('left_table')}</label>
                        <select id="joinLeftDataset">${datasets.map(d => `<option value="${d.id}">${d.name} (${d.rowCount} ${getText('rows')})</option>`).join('')}</select>
                    </div>
                    <div class="viz-form-row"><label>${getText('left_key')}</label><select id="joinLeftKey"></select></div>
                    <hr style="margin: 15px 0; border-color: var(--gm-divider);">
                    <div class="viz-form-row">
                        <label>${getText('right_table')}</label>
                        <select id="joinRightDataset">${datasets.map((d, i) => `<option value="${d.id}" ${i === 1 ? 'selected' : ''}>${d.name} (${d.rowCount} ${getText('rows')})</option>`).join('')}</select>
                    </div>
                    <div class="viz-form-row"><label>${getText('right_key')}</label><select id="joinRightKey"></select></div>
                    <hr style="margin: 15px 0; border-color: var(--gm-divider);">
                    <div class="viz-form-row">
                        <label>${getText('join_type')}</label>
                        <select id="joinType">
                            <option value="left">${getText('left_join')}</option>
                            <option value="inner">${getText('inner_join')}</option>
                            <option value="outer">${getText('outer_join')}</option>
                            <option value="right">${getText('right_join')}</option>
                        </select>
                    </div>
                    <button class="gm-gradient-btn" onclick="executeJoin()" style="width:100%;margin-top:15px;">
                        <i class="fas fa-play"></i> ${getText('merge')}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const updateColumns = () => {
        const leftId = document.getElementById('joinLeftDataset').value;
        const rightId = document.getElementById('joinRightDataset').value;
        const leftDs = VIZ_STATE.getDatasetById(leftId);
        const rightDs = VIZ_STATE.getDatasetById(rightId);
        document.getElementById('joinLeftKey').innerHTML = leftDs?.columns.map(c => `<option value="${c}">${c}</option>`).join('') || '';
        document.getElementById('joinRightKey').innerHTML = rightDs?.columns.map(c => `<option value="${c}">${c}</option>`).join('') || '';
    };

    document.getElementById('joinLeftDataset').onchange = updateColumns;
    document.getElementById('joinRightDataset').onchange = updateColumns;
    updateColumns();
}

export async function executeJoin() {
    const leftId = document.getElementById('joinLeftDataset').value;
    const rightId = document.getElementById('joinRightDataset').value;
    const leftKey = document.getElementById('joinLeftKey').value;
    const rightKey = document.getElementById('joinRightKey').value;
    const joinType = document.getElementById('joinType').value;

    const leftDs = VIZ_STATE.getDatasetById(leftId);
    const rightDs = VIZ_STATE.getDatasetById(rightId);

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
        const response = await fetch('/viz/join', { method: 'POST', body: formData });
        if (!response.ok) { const error = await response.json(); throw new Error(error.detail || 'Birleştirme hatası'); }

        const result = await response.json();
        const newFile = new File([JSON.stringify(result.data)], `join_${leftDs.name}_${rightDs.name}.json`, { type: 'application/json' });
        VIZ_STATE.addDataset(newFile, result.data, result.columns, result.columns_info, []);

        renderColumnsList();
        updateDropdowns();
        updateDataProfile();
        updateDatasetSelector();

        document.querySelector('.viz-stat-modal-overlay')?.remove();
        if (typeof showToast === 'function') showToast(`Birleştirildi! ${result.row_count} satır oluşturuldu`, 'success');

    } catch (error) {
        console.error('JOIN hatası:', error);
        if (typeof showToast === 'function') showToast('Birleştirme hatası: ' + error.message, 'error');
    }
}

// -----------------------------------------------------
// GOOGLE SHEETS
// -----------------------------------------------------
export function showGoogleSheetsModal() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:550px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#4285F4,#34A853);">
                <h3><i class="fab fa-google-drive"></i> ${getText('google_sheets_title')}</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <p style="color:var(--gm-text-muted);margin-bottom:15px;">${getText('google_sheets_desc')}</p>
                    <div class="viz-form-row">
                        <label>${getText('spreadsheet_id')}</label>
                        <input type="text" id="gsSpreadsheetId" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms">
                        <small style="color:var(--gm-text-muted);">${getText('spreadsheet_id_hint')}</small>
                    </div>
                    <div class="viz-form-row">
                        <label>${getText('sheet_name')}</label>
                        <input type="text" id="gsSheetName" placeholder="Sheet1">
                    </div>
                    <button class="gm-gradient-btn" onclick="importGoogleSheet()" style="width:100%;margin-top:10px;">
                        <i class="fas fa-download"></i> ${getText('fetch_data')}
                    </button>
                    <hr style="margin:20px 0;border-color:var(--gm-divider);">
                    <button class="viz-btn-secondary" onclick="connectGoogleOAuth()" style="width:100%;">
                        <i class="fab fa-google"></i> ${getText('connect_google')}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export async function importGoogleSheet() {
    const spreadsheetId = document.getElementById('gsSpreadsheetId').value.trim();
    const sheetName = document.getElementById('gsSheetName').value.trim();

    if (!spreadsheetId) {
        if (typeof showToast === 'function') showToast('Spreadsheet ID gerekli', 'warning');
        return;
    }

    if (typeof showToast === 'function') showToast('Google Sheets verisi çekiliyor...', 'info');

    try {
        const response = await fetch('/viz/google/import-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spreadsheet_id: spreadsheetId, sheet_name: sheetName || null })
        });

        if (!response.ok) { const error = await response.json(); throw new Error(error.detail || 'Import hatası'); }

        const result = await response.json();
        const fakeFile = new File([JSON.stringify(result.data)], `${result.sheet_name}.json`, { type: 'application/json' });
        VIZ_STATE.addDataset(fakeFile, result.data, result.columns, result.columns_info, []);

        renderColumnsList();
        updateDropdowns();
        updateDataProfile();
        updateDatasetSelector();

        document.querySelector('.viz-stat-modal-overlay')?.remove();
        if (typeof showToast === 'function') showToast(`${result.row_count} satır Google Sheets'ten yüklendi`, 'success');

    } catch (error) {
        if (typeof showToast === 'function') showToast('Google Sheets hatası: ' + error.message, 'error');
    }
}

export async function connectGoogleOAuth() {
    try {
        const response = await fetch('/viz/google/auth-url');
        const data = await response.json();
        if (data.auth_url) {
            window.open(data.auth_url, '_blank', 'width=500,height=600');
            if (typeof showToast === 'function') showToast('Google OAuth penceresi açıldı', 'info');
        }
    } catch (error) {
        if (typeof showToast === 'function') showToast('OAuth hatası: ' + error.message, 'error');
    }
}

// -----------------------------------------------------
// SQL QUERY
// -----------------------------------------------------
export function showSQLModal() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:650px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#336791,#0d96f2);">
                <h3><i class="fas fa-database"></i> ${getText('sql_title')}</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div class="viz-form-row">
                        <label>${getText('connection_string')}</label>
                        <input type="text" id="sqlConnString" placeholder="postgresql://user:pass@host:5432/dbname">
                        <small style="color:var(--gm-text-muted);">${getText('connection_hint')}</small>
                    </div>
                    <button class="viz-btn-secondary" onclick="testSQLConnection()" style="margin-bottom:15px;">
                        <i class="fas fa-plug"></i> ${getText('test_connection')}
                    </button>
                    <div class="viz-form-row">
                        <label>${getText('sql_query')}</label>
                        <textarea id="sqlQuery" rows="4" placeholder="SELECT * FROM customers LIMIT 100" style="font-family:monospace;font-size:0.85rem;"></textarea>
                    </div>
                    <div class="viz-form-row">
                        <label>${getText('max_rows')}</label>
                        <input type="number" id="sqlMaxRows" value="1000" min="1" max="10000">
                    </div>
                    <button class="gm-gradient-btn" onclick="executeSQLQuery()" style="width:100%;margin-top:10px;">
                        <i class="fas fa-play"></i> ${getText('run_query')}
                    </button>
                    <div id="sqlTablesPreview" style="margin-top:15px;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export async function testSQLConnection() {
    const connString = document.getElementById('sqlConnString').value.trim();
    if (!connString) {
        if (typeof showToast === 'function') showToast('Bağlantı string gerekli', 'warning');
        return;
    }

    if (typeof showToast === 'function') showToast('Bağlantı test ediliyor...', 'info');

    try {
        const response = await fetch('/viz/sql/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connection_string: connString })
        });

        const result = await response.json();
        if (result.success) {
            if (typeof showToast === 'function') showToast(`Bağlantı başarılı! DB: ${result.database}`, 'success');

            const tablesRes = await fetch('/viz/sql/list-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `connection_string=${encodeURIComponent(connString)}`
            });

            const tables = await tablesRes.json();
            if (tables.tables?.length > 0) {
                let html = '<h5 style="margin:10px 0;color:var(--gm-primary);">Tablolar</h5><div style="max-height:150px;overflow-y:auto;">';
                tables.tables.forEach(t => { html += `<div style="padding:5px;cursor:pointer;border-radius:4px;" onclick="document.getElementById('sqlQuery').value='SELECT * FROM ${t.name} LIMIT 100'" onmouseover="this.style.background='rgba(74,144,217,0.1)'" onmouseout="this.style.background='transparent'"><strong>${t.name}</strong> <small>(${t.column_count} sütun)</small></div>`; });
                html += '</div>';
                document.getElementById('sqlTablesPreview').innerHTML = html;
            }
        } else { throw new Error(result.detail || 'Bağlantı başarısız'); }
    } catch (error) {
        if (typeof showToast === 'function') showToast('Bağlantı hatası: ' + error.message, 'error');
    }
}

export async function executeSQLQuery() {
    const connString = document.getElementById('sqlConnString').value.trim();
    const query = document.getElementById('sqlQuery').value.trim();
    const maxRows = parseInt(document.getElementById('sqlMaxRows').value) || 1000;

    if (!connString || !query) {
        if (typeof showToast === 'function') showToast('Bağlantı ve sorgu gerekli', 'warning');
        return;
    }

    if (typeof showToast === 'function') showToast('Sorgu çalıştırılıyor...', 'info');

    try {
        const response = await fetch('/viz/sql/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connection_string: connString, query: query, max_rows: maxRows })
        });

        if (!response.ok) { const error = await response.json(); throw new Error(error.detail || 'Sorgu hatası'); }

        const result = await response.json();
        const fakeFile = new File([JSON.stringify(result.data)], 'sql_query.json', { type: 'application/json' });
        VIZ_STATE.addDataset(fakeFile, result.data, result.columns, result.columns_info, []);

        renderColumnsList();
        updateDropdowns();
        updateDataProfile();
        updateDatasetSelector();

        document.querySelector('.viz-stat-modal-overlay')?.remove();

        const truncMsg = result.truncated ? ` (${maxRows} satır limiti)` : '';
        if (typeof showToast === 'function') showToast(`${result.row_count} satır SQL'den yüklendi${truncMsg}`, 'success');

    } catch (error) {
        if (typeof showToast === 'function') showToast('SQL hatası: ' + error.message, 'error');
    }
}

// -----------------------------------------------------
// FILTERING
// -----------------------------------------------------
export function showFilterPanel() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.id = 'filterModal';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:600px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#9b59b6,#3498db);">
                <h3><i class="fas fa-filter"></i> ${getText('filter_data') || 'Veri Filtrele'}</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div id="filterConditions"></div>
                    <button class="viz-btn-secondary" onclick="addFilter()" style="margin:10px 0;">
                        <i class="fas fa-plus"></i> Koşul Ekle
                    </button>
                    <hr style="margin:15px 0;border-color:var(--gm-divider);">
                    <button class="gm-gradient-btn" onclick="applyFilters()" style="width:100%;">
                        <i class="fas fa-check"></i> Filtreleri Uygula
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    addFilter(); // İlk koşulu ekle
}

export function addFilter() {
    const container = document.getElementById('filterConditions');
    if (!container) return;

    const filterId = `filter_${Date.now()}`;
    const columns = VIZ_STATE.columns || [];

    const filterRow = document.createElement('div');
    filterRow.className = 'viz-filter-row';
    filterRow.id = filterId;
    filterRow.style.cssText = 'display:flex;gap:10px;margin-bottom:10px;align-items:center;';
    filterRow.innerHTML = `
        <select class="filter-column" style="flex:1;">
            ${columns.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="filter-operator" style="width:120px;">
            <option value="eq">=</option>
            <option value="ne">≠</option>
            <option value="gt">&gt;</option>
            <option value="gte">≥</option>
            <option value="lt">&lt;</option>
            <option value="lte">≤</option>
            <option value="contains">İçerir</option>
            <option value="not_contains">İçermez</option>
            <option value="starts">Başlar</option>
            <option value="ends">Biter</option>
            <option value="empty">Boş</option>
            <option value="not_empty">Dolu</option>
        </select>
        <input type="text" class="filter-value" placeholder="Değer" style="flex:1;">
        <button onclick="removeFilter('${filterId}')" style="background:transparent;border:none;color:#e74c3c;cursor:pointer;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(filterRow);
}

export function removeFilter(filterId) {
    const row = document.getElementById(filterId);
    if (row) row.remove();
}

export function applyFilters() {
    const container = document.getElementById('filterConditions');
    if (!container || !VIZ_STATE.data) return;

    const filters = [];
    container.querySelectorAll('.viz-filter-row').forEach(row => {
        const column = row.querySelector('.filter-column')?.value;
        const operator = row.querySelector('.filter-operator')?.value;
        const value = row.querySelector('.filter-value')?.value;
        if (column && operator) filters.push({ column, operator, value });
    });

    if (filters.length === 0) {
        if (typeof showToast === 'function') showToast('En az bir filtre ekleyin', 'warning');
        return;
    }

    const originalCount = VIZ_STATE.data.length;
    VIZ_STATE.data = VIZ_STATE.data.filter(row => {
        return filters.every(f => {
            const cellValue = row[f.column];
            const filterValue = f.value;
            const numCell = parseFloat(cellValue);
            const numFilter = parseFloat(filterValue);

            switch (f.operator) {
                case 'eq': return String(cellValue) === filterValue;
                case 'ne': return String(cellValue) !== filterValue;
                case 'gt': return !isNaN(numCell) && numCell > numFilter;
                case 'gte': return !isNaN(numCell) && numCell >= numFilter;
                case 'lt': return !isNaN(numCell) && numCell < numFilter;
                case 'lte': return !isNaN(numCell) && numCell <= numFilter;
                case 'contains': return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                case 'not_contains': return !String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                case 'starts': return String(cellValue).toLowerCase().startsWith(filterValue.toLowerCase());
                case 'ends': return String(cellValue).toLowerCase().endsWith(filterValue.toLowerCase());
                case 'empty': return cellValue === null || cellValue === '' || cellValue === undefined;
                case 'not_empty': return cellValue !== null && cellValue !== '' && cellValue !== undefined;
                default: return true;
            }
        });
    });

    document.getElementById('filterModal')?.remove();
    const removedCount = originalCount - VIZ_STATE.data.length;
    if (typeof showToast === 'function') showToast(`${removedCount} satır filtrelendi, ${VIZ_STATE.data.length} satır kaldı`, 'success');

    renderColumnsList();
    updateDropdowns();
    updateDataProfile();
    if (typeof rerenderAllCharts === 'function') rerenderAllCharts();
}

// -----------------------------------------------------
// SORTING
// -----------------------------------------------------
export function showSortPanel() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.id = 'sortModal';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:450px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#27ae60,#2ecc71);">
                <h3><i class="fas fa-sort"></i> ${getText('sort_data') || 'Veri Sırala'}</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div class="viz-form-row">
                        <label>Sütun</label>
                        <select id="sortColumn">
                            ${VIZ_STATE.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="viz-form-row">
                        <label>Yön</label>
                        <select id="sortDirection">
                            <option value="asc">Artan (A→Z, 0→9)</option>
                            <option value="desc">Azalan (Z→A, 9→0)</option>
                        </select>
                    </div>
                    <button class="gm-gradient-btn" onclick="applySort()" style="width:100%;margin-top:15px;">
                        <i class="fas fa-check"></i> Sırala
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export function applySort() {
    const column = document.getElementById('sortColumn')?.value;
    const direction = document.getElementById('sortDirection')?.value;

    if (!column || !VIZ_STATE.data) return;

    VIZ_STATE.data.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];

        // Sayısal karşılaştırma dene
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
            return direction === 'asc' ? numA - numB : numB - numA;
        }

        // Metin karşılaştırması
        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        const cmp = strA.localeCompare(strB, 'tr');
        return direction === 'asc' ? cmp : -cmp;
    });

    document.getElementById('sortModal')?.remove();
    if (typeof showToast === 'function') showToast(`"${column}" sütununa göre sıralandı`, 'success');

    if (typeof rerenderAllCharts === 'function') rerenderAllCharts();
}

// -----------------------------------------------------
// DATA CLEANING - FILL MISSING
// -----------------------------------------------------
export function fillMissingData() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.id = 'fillMissingModal';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:500px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#e74c3c,#c0392b);">
                <h3><i class="fas fa-fill-drip"></i> Eksik Verileri Doldur</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div class="viz-form-row">
                        <label>Sütun</label>
                        <select id="fillColumn">
                            <option value="__all__">Tüm Sütunlar</option>
                            ${VIZ_STATE.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="viz-form-row">
                        <label>Doldurma Yöntemi</label>
                        <select id="fillMethod">
                            <option value="mean">Ortalama (Sayısal)</option>
                            <option value="median">Medyan (Sayısal)</option>
                            <option value="mode">Mod (En Sık)</option>
                            <option value="zero">0 ile Doldur</option>
                            <option value="custom">Özel Değer</option>
                            <option value="forward">Önceki Değer (Forward Fill)</option>
                            <option value="backward">Sonraki Değer (Backward Fill)</option>
                        </select>
                    </div>
                    <div class="viz-form-row" id="customValueRow" style="display:none;">
                        <label>Özel Değer</label>
                        <input type="text" id="fillCustomValue" placeholder="Doldurmak için değer">
                    </div>
                    <button class="gm-gradient-btn" onclick="applyFillMissing()" style="width:100%;margin-top:15px;">
                        <i class="fas fa-check"></i> Uygula
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('fillMethod').onchange = function () {
        document.getElementById('customValueRow').style.display = this.value === 'custom' ? 'block' : 'none';
    };
}

export function applyFillMissing() {
    const column = document.getElementById('fillColumn')?.value;
    const method = document.getElementById('fillMethod')?.value;
    const customValue = document.getElementById('fillCustomValue')?.value;

    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) return;

    const columnsToFill = column === '__all__' ? VIZ_STATE.columns : [column];
    let filledCount = 0;

    columnsToFill.forEach(col => {
        const values = VIZ_STATE.data.map(row => row[col]).filter(v => v !== null && v !== '' && v !== undefined);
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));

        let fillValue;
        switch (method) {
            case 'mean':
                fillValue = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
                break;
            case 'median':
                if (numericValues.length > 0) {
                    const sorted = [...numericValues].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    fillValue = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                } else fillValue = 0;
                break;
            case 'mode':
                const counts = {};
                values.forEach(v => counts[v] = (counts[v] || 0) + 1);
                fillValue = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
                break;
            case 'zero':
                fillValue = 0;
                break;
            case 'custom':
                fillValue = customValue;
                break;
        }

        VIZ_STATE.data.forEach((row, i) => {
            if (row[col] === null || row[col] === '' || row[col] === undefined) {
                if (method === 'forward') {
                    row[col] = i > 0 ? VIZ_STATE.data[i - 1][col] : fillValue;
                } else if (method === 'backward') {
                    row[col] = i < VIZ_STATE.data.length - 1 ? VIZ_STATE.data[i + 1][col] : fillValue;
                } else {
                    row[col] = fillValue;
                }
                filledCount++;
            }
        });
    });

    document.getElementById('fillMissingModal')?.remove();
    if (typeof showToast === 'function') showToast(`${filledCount} eksik değer dolduruldu`, 'success');
    updateDataProfile();
}

// -----------------------------------------------------
// DATA CLEANING - REMOVE OUTLIERS
// -----------------------------------------------------
export function removeOutliers() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.id = 'outlierModal';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:500px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#f39c12,#e67e22);">
                <h3><i class="fas fa-chart-line"></i> Aykırı Değerleri Kaldır</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div class="viz-form-row">
                        <label>Sütun</label>
                        <select id="outlierColumn">
                            ${VIZ_STATE.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="viz-form-row">
                        <label>Yöntem</label>
                        <select id="outlierMethod">
                            <option value="iqr">IQR (1.5x Çeyrekler Arası)</option>
                            <option value="zscore">Z-Score (±3 std)</option>
                            <option value="percentile">Yüzdelik (1-99)</option>
                        </select>
                    </div>
                    <button class="gm-gradient-btn" onclick="applyRemoveOutliers()" style="width:100%;margin-top:15px;">
                        <i class="fas fa-check"></i> Aykırıları Kaldır
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export function applyRemoveOutliers() {
    const column = document.getElementById('outlierColumn')?.value;
    const method = document.getElementById('outlierMethod')?.value;

    if (!VIZ_STATE.data || !column) return;

    const values = VIZ_STATE.data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
    if (values.length === 0) {
        if (typeof showToast === 'function') showToast('Sayısal değer bulunamadı', 'warning');
        return;
    }

    const sorted = [...values].sort((a, b) => a - b);
    let lowerBound, upperBound;

    if (method === 'iqr') {
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        lowerBound = q1 - 1.5 * iqr;
        upperBound = q3 + 1.5 * iqr;
    } else if (method === 'zscore') {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length);
        lowerBound = mean - 3 * std;
        upperBound = mean + 3 * std;
    } else if (method === 'percentile') {
        lowerBound = sorted[Math.floor(sorted.length * 0.01)];
        upperBound = sorted[Math.floor(sorted.length * 0.99)];
    }

    const originalCount = VIZ_STATE.data.length;
    VIZ_STATE.data = VIZ_STATE.data.filter(row => {
        const val = parseFloat(row[column]);
        if (isNaN(val)) return true; // Sayısal olmayanları koru
        return val >= lowerBound && val <= upperBound;
    });

    document.getElementById('outlierModal')?.remove();
    const removedCount = originalCount - VIZ_STATE.data.length;
    if (typeof showToast === 'function') showToast(`${removedCount} aykırı değer kaldırıldı`, 'success');

    updateDataProfile();
    if (typeof rerenderAllCharts === 'function') rerenderAllCharts();
}

// -----------------------------------------------------
// DATA CLEANING - BINNING
// -----------------------------------------------------
export function showBinningModal() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.id = 'binningModal';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width:500px;">
            <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#1abc9c,#16a085);">
                <h3><i class="fas fa-layer-group"></i> Veri Gruplama (Binning)</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-modal-form">
                    <div class="viz-form-row">
                        <label>Kaynak Sütun</label>
                        <select id="binColumn">
                            ${VIZ_STATE.columns.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="viz-form-row">
                        <label>Grup Sayısı</label>
                        <input type="number" id="binCount" value="5" min="2" max="20">
                    </div>
                    <div class="viz-form-row">
                        <label>Yeni Sütun Adı</label>
                        <input type="text" id="binNewColumn" placeholder="örn: yaş_grubu">
                    </div>
                    <button class="gm-gradient-btn" onclick="applyBinning()" style="width:100%;margin-top:15px;">
                        <i class="fas fa-check"></i> Grupla
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export function applyBinning() {
    const column = document.getElementById('binColumn')?.value;
    const binCount = parseInt(document.getElementById('binCount')?.value) || 5;
    const newColumn = document.getElementById('binNewColumn')?.value || `${column}_bin`;

    if (!VIZ_STATE.data || !column) return;

    const values = VIZ_STATE.data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
    if (values.length === 0) {
        if (typeof showToast === 'function') showToast('Sayısal değer bulunamadı', 'warning');
        return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;

    VIZ_STATE.data.forEach(row => {
        const val = parseFloat(row[column]);
        if (isNaN(val)) {
            row[newColumn] = 'Bilinmiyor';
        } else {
            const binIndex = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
            const binStart = min + binIndex * binWidth;
            const binEnd = binStart + binWidth;
            row[newColumn] = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
        }
    });

    if (!VIZ_STATE.columns.includes(newColumn)) VIZ_STATE.columns.push(newColumn);

    document.getElementById('binningModal')?.remove();
    if (typeof showToast === 'function') showToast(`"${newColumn}" sütunu oluşturuldu`, 'success');

    renderColumnsList();
    updateDropdowns();
}

// -----------------------------------------------------
// DATA CLEANING - REMOVE DUPLICATES
// -----------------------------------------------------
export function removeDuplicates() {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        if (typeof showToast === 'function') showToast('Veri yok', 'warning');
        return 0;
    }

    const originalCount = VIZ_STATE.data.length;
    const seen = new Set();
    VIZ_STATE.data = VIZ_STATE.data.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const removedCount = originalCount - VIZ_STATE.data.length;
    updateDataProfile();
    if (typeof rerenderAllCharts === 'function') rerenderAllCharts();
    return removedCount;
}

// =====================================================
// SHOW MODAL FUNCTIONS (viz.html onclick handlers)
// =====================================================

/**
 * Toggle accordion collapse/expand
 */
export function toggleAccordion(headerElement) {
    const content = headerElement.nextElementSibling;
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        headerElement.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        headerElement.classList.add('collapsed');
    }
}

/**
 * Show Fill Missing Modal
 */
export function showFillMissingModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Sütun:</label>
            <select id="fillMissingCol">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Doldurma Yöntemi:</label>
            <select id="fillMissingMethod">
                <option value="mean">Ortalama</option>
                <option value="median">Medyan</option>
                <option value="mode">Mod</option>
                <option value="zero">0</option>
                <option value="custom">Özel Değer</option>
            </select>
            <label>Özel Değer (isteğe bağlı):</label>
            <input type="text" id="fillMissingValue" placeholder="Değer">
            <button class="viz-btn-primary" onclick="applyFillMissingModal()">Uygula</button>
        </div>
    `;
    showStatResultModal('Eksik Veri Doldurma', html);
}

export function applyFillMissingModal() {
    const col = document.getElementById('fillMissingCol').value;
    const method = document.getElementById('fillMissingMethod').value;
    const customVal = document.getElementById('fillMissingValue').value;

    if (typeof saveState === 'function') saveState();
    applyFillMissing(col, method, customVal || null);
    if (typeof showToast === 'function') showToast('Eksik değerler dolduruldu', 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
}

/**
 * Show Outlier Modal
 */
export function showOutlierModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const numCols = VIZ_STATE.columnsInfo?.filter(c => c.type === 'numeric').map(c => c.name) || VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Sütun:</label>
            <select id="outlierCol">${numCols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Yöntem:</label>
            <select id="outlierMethod">
                <option value="iqr">IQR (1.5x)</option>
                <option value="zscore">Z-Score (±3)</option>
            </select>
            <button class="viz-btn-primary" onclick="applyRemoveOutliersModal()">Temizle</button>
        </div>
    `;
    showStatResultModal('Aykırı Değer Temizleme', html);
}

export function applyRemoveOutliersModal() {
    const col = document.getElementById('outlierCol').value;
    const method = document.getElementById('outlierMethod').value;

    if (typeof saveState === 'function') saveState();
    const count = removeOutliers(col, method);
    if (typeof showToast === 'function') showToast(`${count || 0} aykırı değer kaldırıldı`, 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
}

/**
 * Show Duplicate Modal
 */
export function showDuplicateModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const html = `
        <div class="viz-modal-form">
            <p>Tüm sütunlara göre tekrar eden satırlar kaldırılacak.</p>
            <button class="viz-btn-primary" onclick="applyRemoveDuplicatesModal()">Kaldır</button>
        </div>
    `;
    showStatResultModal('Tekrarlı Satır Silme', html);
}

export function applyRemoveDuplicatesModal() {
    if (typeof saveState === 'function') saveState();
    const count = removeDuplicates();
    if (typeof showToast === 'function') showToast(`${count} tekrarlı satır kaldırıldı`, 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
}

/**
 * Show Type Convert Modal
 */
export function showTypeConvertModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Sütun:</label>
            <select id="typeConvertCol">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Hedef Tip:</label>
            <select id="typeConvertType">
                <option value="number">Sayı</option>
                <option value="string">Metin</option>
                <option value="date">Tarih</option>
            </select>
            <button class="viz-btn-primary" onclick="applyTypeConvertModal()">Dönüştür</button>
        </div>
    `;
    showStatResultModal('Tip Dönüştürme', html);
}

export function applyTypeConvertModal() {
    const col = document.getElementById('typeConvertCol').value;
    const type = document.getElementById('typeConvertType').value;

    if (typeof saveState === 'function') saveState();
    convertColumnType(col, type);
    if (typeof showToast === 'function') showToast('Tip dönüştürüldü', 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
    if (typeof detectColumnTypes === 'function') detectColumnTypes();
    renderColumnsList();
    updateDataProfile();
}

export function convertColumnType(col, type) {
    if (!VIZ_STATE.data) return;

    VIZ_STATE.data.forEach(row => {
        const val = row[col];
        if (val === null || val === undefined || val === '') return;

        if (type === 'number') {
            row[col] = parseFloat(val) || 0;
        } else if (type === 'string') {
            row[col] = String(val);
        } else if (type === 'date') {
            const d = new Date(val);
            row[col] = isNaN(d.getTime()) ? val : d.toISOString().slice(0, 10);
        }
    });
}

/**
 * Show Merge Columns Modal
 */
export function showMergeColumnsModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Birinci Sütun:</label>
            <select id="mergeCol1">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>İkinci Sütun:</label>
            <select id="mergeCol2">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Ayraç:</label>
            <input type="text" id="mergeSeparator" value=" " placeholder="Boşluk">
            <label>Yeni Sütun Adı:</label>
            <input type="text" id="mergeNewName" placeholder="birlesik">
            <button class="viz-btn-primary" onclick="applyMergeColumnsModal()">Birleştir</button>
        </div>
    `;
    showStatResultModal('Sütun Birleştirme', html);
}

export function applyMergeColumnsModal() {
    const col1 = document.getElementById('mergeCol1').value;
    const col2 = document.getElementById('mergeCol2').value;
    const sep = document.getElementById('mergeSeparator').value;
    const newName = document.getElementById('mergeNewName').value || 'birlesik';

    if (typeof saveState === 'function') saveState();
    mergeColumns(col1, col2, sep, newName);
    if (typeof showToast === 'function') showToast('Sütunlar birleştirildi', 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
    renderColumnsList();
    updateDropdowns();
}

export function mergeColumns(col1, col2, sep, newName) {
    if (!VIZ_STATE.data) return;

    VIZ_STATE.data.forEach(row => {
        row[newName] = String(row[col1] || '') + sep + String(row[col2] || '');
    });

    if (!VIZ_STATE.columns.includes(newName)) {
        VIZ_STATE.columns.push(newName);
    }
}

/**
 * Show Split Column Modal
 */
export function showSplitColumnModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Sütun:</label>
            <select id="splitCol">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Ayraç:</label>
            <input type="text" id="splitSeparator" value="," placeholder=", veya -">
            <button class="viz-btn-primary" onclick="applySplitColumnModal()">Böl</button>
        </div>
    `;
    showStatResultModal('Sütun Bölme', html);
}

export function applySplitColumnModal() {
    const col = document.getElementById('splitCol').value;
    const sep = document.getElementById('splitSeparator').value;

    if (typeof saveState === 'function') saveState();
    splitColumn(col, sep);
    if (typeof showToast === 'function') showToast('Sütun bölündü', 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
    renderColumnsList();
    updateDropdowns();
}

export function splitColumn(col, sep) {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) return;

    // Find max parts
    let maxParts = 1;
    VIZ_STATE.data.forEach(row => {
        const val = String(row[col] || '');
        const parts = val.split(sep);
        if (parts.length > maxParts) maxParts = parts.length;
    });

    // Create new columns and split
    for (let i = 0; i < maxParts; i++) {
        const newCol = `${col}_${i + 1}`;
        if (!VIZ_STATE.columns.includes(newCol)) {
            VIZ_STATE.columns.push(newCol);
        }
        VIZ_STATE.data.forEach(row => {
            const val = String(row[col] || '');
            const parts = val.split(sep);
            row[newCol] = parts[i] || '';
        });
    }
}

/**
 * Show Find Replace Modal
 */
export function showFindReplaceModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Sütun:</label>
            <select id="findReplaceCol">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Bul:</label>
            <input type="text" id="findValue" placeholder="Aranacak değer">
            <label>Değiştir:</label>
            <input type="text" id="replaceValue" placeholder="Yeni değer">
            <button class="viz-btn-primary" onclick="applyFindReplaceModal()">Değiştir</button>
        </div>
    `;
    showStatResultModal('Bul ve Değiştir', html);
}

export function applyFindReplaceModal() {
    const col = document.getElementById('findReplaceCol').value;
    const find = document.getElementById('findValue').value;
    const replace = document.getElementById('replaceValue').value;

    if (typeof saveState === 'function') saveState();
    const count = findAndReplace(col, find, replace);
    if (typeof showToast === 'function') showToast(`${count} değer değiştirildi`, 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
}

export function findAndReplace(col, find, replace) {
    if (!VIZ_STATE.data) return 0;

    let count = 0;
    VIZ_STATE.data.forEach(row => {
        if (String(row[col]) === find) {
            row[col] = replace;
            count++;
        }
    });
    return count;
}

/**
 * Show Pivot Modal
 */
export function showPivotModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Satır (Index):</label>
            <select id="pivotIndex">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Sütun:</label>
            <select id="pivotColumn">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Değer:</label>
            <select id="pivotValue">${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            <label>Agregasyon:</label>
            <select id="pivotAgg">
                <option value="sum">Toplam</option>
                <option value="avg">Ortalama</option>
                <option value="count">Sayı</option>
            </select>
            <button class="viz-btn-primary" onclick="applyPivotModal()">Pivot Uygula</button>
        </div>
    `;
    showStatResultModal('Pivot Tablo', html);
}

export function applyPivotModal() {
    const index = document.getElementById('pivotIndex').value;
    const column = document.getElementById('pivotColumn').value;
    const value = document.getElementById('pivotValue').value;
    const agg = document.getElementById('pivotAgg').value;

    if (typeof saveState === 'function') saveState();
    pivotData(index, column, value, agg);
    if (typeof showToast === 'function') showToast('Pivot uygulandı', 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
}

export function pivotData(indexCol, pivotCol, valueCol, aggType) {
    if (!VIZ_STATE.data) return;

    const pivoted = {};
    const pivotValues = new Set();

    VIZ_STATE.data.forEach(row => {
        const indexVal = row[indexCol];
        const pivotVal = row[pivotCol];
        const value = parseFloat(row[valueCol]) || 0;

        pivotValues.add(pivotVal);

        if (!pivoted[indexVal]) pivoted[indexVal] = { [indexCol]: indexVal, _counts: {} };
        if (!pivoted[indexVal][pivotVal]) {
            pivoted[indexVal][pivotVal] = 0;
            pivoted[indexVal]._counts[pivotVal] = 0;
        }

        pivoted[indexVal][pivotVal] += value;
        pivoted[indexVal]._counts[pivotVal]++;
    });

    // Apply aggregation
    const result = Object.values(pivoted).map(row => {
        const newRow = { [indexCol]: row[indexCol] };
        pivotValues.forEach(pv => {
            if (aggType === 'avg' && row._counts[pv] > 0) {
                newRow[pv] = row[pv] / row._counts[pv];
            } else if (aggType === 'count') {
                newRow[pv] = row._counts[pv] || 0;
            } else {
                newRow[pv] = row[pv] || 0;
            }
        });
        return newRow;
    });

    VIZ_STATE.data = result;
    VIZ_STATE.columns = [indexCol, ...Array.from(pivotValues)];

    updateDataProfile();
    renderColumnsList();
    updateDropdowns();
}

/**
 * Show Calculated Column Modal
 */
export function showCalculatedColumnModal() {
    if (!VIZ_STATE.data) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    const cols = VIZ_STATE.columns;
    const html = `
        <div class="viz-modal-form">
            <label>Yeni Sütun Adı:</label>
            <input type="text" id="calcNewName" placeholder="yeni_sutun">
            <label>Formül (örn: col1 + col2):</label>
            <input type="text" id="calcFormula" placeholder="sütun1 * 2">
            <p style="font-size:0.75rem;color:var(--gm-text-muted);">Mevcut sütunlar: ${cols.join(', ')}</p>
            <button class="viz-btn-primary" onclick="applyCalculatedColumnModal()">Ekle</button>
        </div>
    `;
    showStatResultModal('Hesaplanan Sütun Ekle', html);
}

export function applyCalculatedColumnModal() {
    const name = document.getElementById('calcNewName').value || 'calculated';
    const formula = document.getElementById('calcFormula').value;

    if (typeof saveState === 'function') saveState();
    addCalculatedColumn(name, formula);
    if (typeof showToast === 'function') showToast('Hesaplanan sütun eklendi', 'success');
    document.querySelector('.viz-stat-result-modal').style.display = 'none';
    renderColumnsList();
    updateDropdowns();
}

export function addCalculatedColumn(name, formula) {
    if (!VIZ_STATE.data || !formula) return;

    // Replace column names with row[col]
    let evalFormula = formula;
    VIZ_STATE.columns.forEach(col => {
        const regex = new RegExp(`\\b${col}\\b`, 'g');
        evalFormula = evalFormula.replace(regex, `row['${col}']`);
    });

    VIZ_STATE.data.forEach(row => {
        try {
            row[name] = eval(evalFormula);
        } catch (e) {
            row[name] = null;
        }
    });

    if (!VIZ_STATE.columns.includes(name)) {
        VIZ_STATE.columns.push(name);
    }
}

/**
 * Show URL Load Modal
 */
export function showURLLoadModal() {
    const html = `
        <div class="viz-modal-form">
            <label>CSV/JSON URL:</label>
            <input type="text" id="urlLoadUrl" placeholder="https://...">
            <button class="viz-btn-primary" onclick="applyURLLoadModal()">Yükle</button>
        </div>
    `;
    showStatResultModal("URL'den Veri Yükle", html);
}

export async function applyURLLoadModal() {
    const url = document.getElementById('urlLoadUrl').value;
    if (!url) {
        if (typeof showToast === 'function') showToast('URL girin', 'warning');
        return;
    }

    document.querySelector('.viz-stat-result-modal').style.display = 'none';
    if (typeof loadFromURL === 'function') {
        await loadFromURL(url);
    } else {
        if (typeof showToast === 'function') showToast('loadFromURL fonksiyonu bulunamadı', 'error');
    }
}

/**
 * Show Data Profile Modal - wrapper for runDataProfile
 * Called from viz.html onclick handler
 */
export function showDataProfileModal() {
    if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
        if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
        return;
    }

    // Run the profile analysis
    runDataProfile();

    // Make sure the results section is visible
    const resultsDiv = document.getElementById('profileResults');
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
    }

    // Also update the left panel data profile if it exists
    const leftProfileDiv = document.getElementById('vizDataProfileFull');
    if (leftProfileDiv) {
        leftProfileDiv.style.display = 'block';
    }

    if (typeof showToast === 'function') showToast('Veri profili oluşturuldu', 'success');
}

/**
 * Run Data Profile
 */
export function runDataProfile() {
    const resultsDiv = document.getElementById('profileResults');
    const rowsEl = document.getElementById('profileRows');
    const colsEl = document.getElementById('profileCols');
    const qualityEl = document.getElementById('profileQuality');

    if (!resultsDiv) return;

    let data = VIZ_STATE.data;
    let columns = VIZ_STATE.columns;

    if (!data || data.length === 0) {
        if (rowsEl) rowsEl.textContent = '0';
        if (colsEl) colsEl.textContent = '0';
        if (qualityEl) qualityEl.textContent = '-';
        return;
    }

    const rowCount = data.length;
    const colCount = columns.length;

    if (rowsEl) rowsEl.textContent = rowCount.toLocaleString();
    if (colsEl) colsEl.textContent = colCount;

    // Calculate data quality
    let totalCells = rowCount * colCount;
    let nullCells = 0;
    data.forEach(row => {
        columns.forEach(col => {
            const val = row[col];
            if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
                nullCells++;
            }
        });
    });
    const quality = totalCells > 0 ? Math.round((1 - nullCells / totalCells) * 100) : 0;
    if (qualityEl) qualityEl.textContent = quality + '%';
}

// =====================================================
// PDF PREVIEW FUNCTIONS
// =====================================================
let currentPDFBlob = null;

export function closePDFPreviewModal() {
    const modal = document.getElementById('pdfPreviewModal');
    const iframe = document.getElementById('pdfPreviewIframe');
    if (modal) modal.style.display = 'none';
    if (iframe) {
        URL.revokeObjectURL(iframe.src);
        iframe.src = '';
    }
    currentPDFBlob = null;
}

export function downloadPDFFromPreview() {
    if (!currentPDFBlob) {
        if (typeof showToast === 'function') showToast('İndirilecek PDF yok', 'warning');
        return;
    }

    const filename = `Opradox_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(currentPDFBlob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    if (typeof showToast === 'function') showToast('PDF indirildi: ' + filename, 'success');
}

export async function exportWithAnnotations() {
    if (typeof showToast === 'function') showToast('Annotasyonlu export hazırlanıyor...', 'info');
    // This would call chart export with annotations
    if (typeof exportChartAsPNG === 'function') {
        await exportChartAsPNG();
    }
}

// =====================================================
// WINDOW BINDINGS (HTML onclick için)
// =====================================================
window.handleFileSelect = handleFileSelect;
window.loadFile = loadFile;
window.loadDataWithOptions = loadDataWithOptions;
window.reloadWithOptions = reloadWithOptions;
window.clearData = clearData;
window.updateDataProfile = updateDataProfile;
window.renderColumnsList = renderColumnsList;
window.updateDropdowns = updateDropdowns;
window.updateDatasetSelector = updateDatasetSelector;
window.aggregateData = aggregateData;
window.exportDataAsCSV = exportDataAsCSV;
window.exportDataAsJSON = exportDataAsJSON;
window.showTransformUI = showTransformUI;
window.applyTransform = applyTransform;
window.showJoinModal = showJoinModal;
window.executeJoin = executeJoin;
window.showGoogleSheetsModal = showGoogleSheetsModal;
window.importGoogleSheet = importGoogleSheet;
window.connectGoogleOAuth = connectGoogleOAuth;
window.showSQLModal = showSQLModal;
window.testSQLConnection = testSQLConnection;
window.executeSQLQuery = executeSQLQuery;

// Filter, Sort, Clean
window.showFilterPanel = showFilterPanel;
window.addFilter = addFilter;
window.removeFilter = removeFilter;
window.applyFilters = applyFilters;
window.showSortPanel = showSortPanel;
window.applySort = applySort;
window.fillMissingData = fillMissingData;
window.applyFillMissing = applyFillMissing;
window.removeOutliers = removeOutliers;
window.applyRemoveOutliers = applyRemoveOutliers;
window.showBinningModal = showBinningModal;
window.applyBinning = applyBinning;
window.removeDuplicates = removeDuplicates;

// NEW: Show Modal Functions (viz.html onclick handlers)
window.toggleAccordion = toggleAccordion;
window.showFillMissingModal = showFillMissingModal;
window.applyFillMissingModal = applyFillMissingModal;
window.showOutlierModal = showOutlierModal;
window.applyRemoveOutliersModal = applyRemoveOutliersModal;
window.showDuplicateModal = showDuplicateModal;
window.applyRemoveDuplicatesModal = applyRemoveDuplicatesModal;
window.showTypeConvertModal = showTypeConvertModal;
window.applyTypeConvertModal = applyTypeConvertModal;
window.convertColumnType = convertColumnType;
window.showMergeColumnsModal = showMergeColumnsModal;
window.applyMergeColumnsModal = applyMergeColumnsModal;
window.mergeColumns = mergeColumns;
window.showSplitColumnModal = showSplitColumnModal;
window.applySplitColumnModal = applySplitColumnModal;
window.splitColumn = splitColumn;
window.showFindReplaceModal = showFindReplaceModal;
window.applyFindReplaceModal = applyFindReplaceModal;
window.findAndReplace = findAndReplace;
window.showPivotModal = showPivotModal;
window.applyPivotModal = applyPivotModal;
window.pivotData = pivotData;
window.showCalculatedColumnModal = showCalculatedColumnModal;
window.applyCalculatedColumnModal = applyCalculatedColumnModal;
window.addCalculatedColumn = addCalculatedColumn;
window.showURLLoadModal = showURLLoadModal;
window.applyURLLoadModal = applyURLLoadModal;
window.runDataProfile = runDataProfile;
window.showDataProfileModal = showDataProfileModal;

// PDF Preview Functions
window.closePDFPreviewModal = closePDFPreviewModal;
window.downloadPDFFromPreview = downloadPDFFromPreview;
window.exportWithAnnotations = exportWithAnnotations;

// Aliases for backward compatibility
window.applyRemoveDuplicates = applyRemoveDuplicatesModal;
window.applyPivot = applyPivotModal;
window.applyCalculatedColumn = applyCalculatedColumnModal;
window.applyURLLoad = applyURLLoadModal;
window.applyFindReplace = applyFindReplaceModal;
window.applySplitColumn = applySplitColumnModal;
window.applyMergeColumns = applyMergeColumnsModal;
window.applyTypeConvert = applyTypeConvertModal;

// =====================================================
// LOAD MULTIPLE FILES - Dosya Ekle Button
// Merges additional files into existing VIZ_STATE.data
// =====================================================
function loadMultipleFiles() {
    const fileInput = document.getElementById('vizFileInput');
    if (!fileInput) {
        if (typeof showToast === 'function') showToast('Dosya input bulunamadı', 'error');
        return;
    }

    // Store original onchange handler
    const originalOnChange = fileInput.onchange;

    // Set merge mode
    fileInput.onchange = async function (e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (typeof showToast === 'function') {
            showToast(`${files.length} dosya yükleniyor...`, 'info');
        }

        for (const file of files) {
            try {
                const reader = new FileReader();
                const ext = file.name.split('.').pop().toLowerCase();

                await new Promise((resolve, reject) => {
                    reader.onload = async function (evt) {
                        try {
                            let newData = [];

                            if (ext === 'csv') {
                                // CSV parse
                                const text = evt.target.result;
                                const lines = text.split(/\r?\n/).filter(l => l.trim());
                                if (lines.length > 0) {
                                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                                    for (let i = 1; i < lines.length; i++) {
                                        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                                        const row = {};
                                        headers.forEach((h, idx) => {
                                            row[h] = values[idx] || '';
                                        });
                                        newData.push(row);
                                    }
                                }
                            } else if (ext === 'xlsx' || ext === 'xls') {
                                // Excel parse (requires XLSX library)
                                if (typeof XLSX !== 'undefined') {
                                    const workbook = XLSX.read(evt.target.result, { type: 'array' });
                                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                                    newData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                                }
                            }

                            // Merge into VIZ_STATE.data
                            if (newData.length > 0) {
                                if (!VIZ_STATE.data || VIZ_STATE.data.length === 0) {
                                    VIZ_STATE.data = newData;
                                } else {
                                    // Merge rows (append)
                                    VIZ_STATE.data = [...VIZ_STATE.data, ...newData];
                                }

                                // Update columns
                                if (newData.length > 0) {
                                    const newCols = Object.keys(newData[0]);
                                    const existingCols = VIZ_STATE.columns || [];
                                    VIZ_STATE.columns = [...new Set([...existingCols, ...newCols])];
                                }

                                if (typeof showToast === 'function') {
                                    showToast(`${file.name}: ${newData.length} satır eklendi`, 'success');
                                }
                            }
                            resolve();
                        } catch (err) {
                            console.error('Parse error:', err);
                            reject(err);
                        }
                    };
                    reader.onerror = reject;

                    if (ext === 'csv') {
                        reader.readAsText(file);
                    } else {
                        reader.readAsArrayBuffer(file);
                    }
                });
            } catch (err) {
                console.error(`Error loading ${file.name}:`, err);
                if (typeof showToast === 'function') {
                    showToast(`${file.name} yüklenemedi`, 'error');
                }
            }
        }

        // Refresh UI
        if (typeof updateColumnsList === 'function') updateColumnsList();
        if (typeof runDataProfile === 'function') runDataProfile();
        if (typeof rerenderAllCharts === 'function') rerenderAllCharts();

        // Reset input
        fileInput.value = '';
        fileInput.onchange = originalOnChange;
    };

    // Trigger file dialog
    fileInput.click();
}

window.loadMultipleFiles = loadMultipleFiles;

console.log('✅ data.js module loaded (with filter, sort, clean, all show modals)');

