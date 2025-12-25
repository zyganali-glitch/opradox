import { VIZ_STATE } from '../core/state.js';
import { VIZ_TEXTS } from '../core/i18n.js';

export function updateDataProfile() {
    const profile = document.getElementById('vizDataProfileFull');
    if (!profile) return;

    if (!VIZ_STATE.data || !VIZ_STATE.columns.length) {
        profile.style.display = 'none';
        return;
    }

    profile.style.display = 'block';

    // Temel istatistikler
    const rowEl = document.getElementById('vizRowCountFull');
    const colEl = document.getElementById('vizColCountFull');
    const qualEl = document.getElementById('vizQualityFull');

    if (rowEl) rowEl.textContent = VIZ_STATE.data.length.toLocaleString('tr-TR');
    if (colEl) colEl.textContent = VIZ_STATE.columns.length;

    // Veri kalitesi ve eksik değerler hesapla
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

    // Sütun tiplerini göster
    const colTypesEl = document.getElementById('columnTypesLeft');
    if (colTypesEl && VIZ_STATE.columnsInfo) {
        const colors = { numeric: '#4a90d9', date: '#9a3050', text: '#6b7280' };
        const icons = { numeric: 'fa-hashtag', date: 'fa-calendar', text: 'fa-font' };

        colTypesEl.innerHTML = VIZ_STATE.columnsInfo.map(info => `
            <div class="viz-column-type-item-left" style="border-left-color: ${colors[info.type] || colors.text}">
                <i class="fas ${icons[info.type] || icons.text}"></i>
                <span>${info.name}</span>
            </div>
        `).join('');
    }

    // Eksik değerleri göster
    const missingEl = document.getElementById('missingValuesListLeft');
    if (missingEl) {
        const missingCols = Object.entries(missingByColumn).filter(([_, count]) => count > 0);
        if (missingCols.length === 0) {
            missingEl.innerHTML = `<span class="viz-quality-good">${VIZ_TEXTS[VIZ_STATE.lang].no_missing || 'Eksik değer yok ✓'}</span>`;
        } else {
            missingEl.innerHTML = missingCols.map(([col, count]) => `
                <div class="viz-missing-item-left">
                    <span>${col}</span>
                    <span class="count">${count}</span>
                </div>
            `).join('');
        }
    }

    console.log(`📊 Tam Veri Profili: ${VIZ_STATE.data.length} satır, ${VIZ_STATE.columns.length} sütun, %${qualityPercent} kalite`);
}

export function renderColumnsList() {
    const dataset = VIZ_STATE.getActiveDataset();
    const listEl = document.getElementById('vizColumnsList');

    // Addon logic integration: Enhanced column list with types
    if (!listEl || !dataset || !dataset.data || dataset.data.length === 0) {
        if (listEl) {
            listEl.innerHTML = `
            <div class="viz-no-data" data-i18n="no_data_loaded">
                <i class="fas fa-info-circle"></i>
                ${VIZ_TEXTS[VIZ_STATE.lang].no_data_loaded}
            </div>`;
        }
        return;
    }

    const columns = Object.keys(dataset.data[0]);

    listEl.innerHTML = columns.map(function (col) {
        const sampleValues = dataset.data.slice(0, 10).map(r => r[col]);
        const type = detectColumnType(sampleValues);
        const typeInfo = getTypeInfo(type);

        return `<div class="viz-column-chip" draggable="true" data-column="${col}" data-type="${type}" 
            style="border-left: 3px solid ${typeInfo.color};">
            <i class="${typeInfo.icon}" style="color:${typeInfo.color};"></i>
            <span class="viz-col-name-chip">${col}</span>
            <span class="viz-col-type-chip" style="font-size:0.65rem;color:var(--gm-text-muted);margin-left:auto;">${typeInfo.label}</span>
            </div>`;
    }).join('');

    // Re-attach drag handlers
    listEl.querySelectorAll('.viz-column-chip').forEach(chip => {
        chip.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', chip.dataset.column);
            // Backwards compatibility for drop zones expecting 'column'
            e.dataTransfer.setData('column', chip.dataset.column);
            chip.classList.add('dragging');
        });
        chip.addEventListener('dragend', function () {
            chip.classList.remove('dragging');
        });
    });
}

export function detectColumnType(values) {
    let numericCount = 0;
    let dateCount = 0;
    let textCount = 0;

    values.forEach(v => {
        if (v === null || v === undefined || v === '') return;

        if (!isNaN(parseFloat(v)) && isFinite(v)) {
            numericCount++;
        } else if (!isNaN(Date.parse(v))) {
            dateCount++;
        } else {
            textCount++;
        }
    });

    const total = numericCount + dateCount + textCount;
    if (total === 0) return 'empty';

    if (numericCount / total > 0.7) return 'numeric';
    if (dateCount / total > 0.7) return 'date';
    return 'text';
}

export function getTypeInfo(type) {
    const types = {
        'numeric': { icon: 'fas fa-hashtag', color: '#3b82f6', label: 'Sayı' },
        'date': { icon: 'fas fa-calendar', color: '#8b5cf6', label: 'Tarih' },
        'text': { icon: 'fas fa-font', color: '#10b981', label: 'Metin' },
        'empty': { icon: 'fas fa-minus', color: '#6b7280', label: 'Boş' }
    };
    return types[type] || types['text'];
}

export function updateDropdowns() {
    const xSelect = document.getElementById('chartXAxis');
    const ySelect = document.getElementById('chartYAxis');

    if (!VIZ_STATE.columns) return;

    const optionsHtml = '<option value="">Seçin...</option>' +
        VIZ_STATE.columns.map(col => `<option value="${col}">${col}</option>`).join('');

    if (xSelect) xSelect.innerHTML = optionsHtml;
    if (ySelect) ySelect.innerHTML = optionsHtml;
}

// Global exports
window.renderColumnsList = renderColumnsList;
window.updateDataProfile = updateDataProfile;
window.updateDropdowns = updateDropdowns;
window.detectColumnType = detectColumnType;
window.getTypeInfo = getTypeInfo;
