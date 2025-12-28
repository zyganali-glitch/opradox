// =====================================================
// PREVIEW.JS - Opradox Visual Studio File Preview
// Header row selection, scrollable preview table
// =====================================================

import { VIZ_STATE, VIZ_TEXTS, getText } from './core.js';

// -----------------------------------------------------
// GLOBAL STATE
// -----------------------------------------------------
window.VIZ_SELECTED_HEADER_ROW = 0;
window.VIZ_RAW_PREVIEW_ROWS = [];
window.VIZ_CURRENT_FILE = null;

// -----------------------------------------------------
// SHOW HEADER PREVIEW MODAL
// -----------------------------------------------------
export function showHeaderPreview() {
    const T = VIZ_TEXTS[VIZ_STATE.lang] || VIZ_TEXTS.tr;
    const rawRows = window.VIZ_RAW_PREVIEW_ROWS || [];
    const currentHeaderRow = window.VIZ_SELECTED_HEADER_ROW || 0;
    const lang = VIZ_STATE.lang || 'tr';

    console.log('👁 showHeaderPreview called:', { rawRowsLength: rawRows.length, currentHeaderRow });

    // Modal oluştur veya mevcut olanı kullan
    let modal = document.getElementById("vizFilePreviewModal");

    // Always recreate modal content to avoid stale structure
    if (modal) {
        modal.remove();
    }

    modal = document.createElement("div");
    modal.id = "vizFilePreviewModal";
    modal.className = "gm-modal";
    modal.style.display = "flex"; // Show immediately
    modal.innerHTML = `
        <div class="gm-modal-content" style="max-width: 95vw; width: 95vw; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="gm-modal-header" style="flex-shrink: 0;">
                <h3 id="vizPreviewModalTitle"><i class="fas fa-table"></i> ${lang === 'tr' ? 'Başlık Satırını Seçin' : 'Select Header Row'}</h3>
                <button class="gm-modal-close" onclick="closeVizPreviewModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="gm-modal-body" id="vizPreviewContent" style="flex: 1; overflow: auto; padding: 15px;"></div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // İçeriği yerleştir
    let content = document.getElementById("vizPreviewContent");
    if (!content) {
        console.error('Modal body not found - this should not happen');
        return;
    }

    if (rawRows && rawRows.length > 0) {
        const hintText = lang === 'tr'
            ? '📌 Başlık olarak kullanmak istediğiniz satırı tıklayın. Seçilen satırın üstündeki veriler atlanacak.'
            : '📌 Click the row you want to use as header. Rows above it will be skipped.';

        const maxCols = Math.max(...rawRows.map(r => r.cells ? r.cells.length : 0));

        let html = `
            <div style="margin-bottom: 15px; padding: 12px; background: rgba(74, 144, 217, 0.1); border-radius: 8px; font-size: 0.9rem;">
                ${hintText}
            </div>
            <div style="overflow-x: auto; border: 1px solid var(--gm-card-border); border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse; min-width: ${maxCols * 120}px;">
                    <thead>
                        <tr style="background: rgba(74, 144, 217, 0.1);">
                            <th style="padding: 10px; text-align: center; width: 80px; border-bottom: 2px solid var(--gm-card-border); position: sticky; left: 0; background: var(--gm-card-bg); z-index: 1;">
                                ${lang === 'tr' ? 'Seç' : 'Select'}
                            </th>
        `;

        // Sütun başlıkları (A, B, C, D...)
        for (let i = 0; i < maxCols; i++) {
            const colLetter = String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '');
            html += `<th style="padding: 10px; text-align: left; border-bottom: 2px solid var(--gm-card-border); min-width: 120px; white-space: nowrap;">${colLetter}</th>`;
        }

        html += `</tr></thead><tbody>`;

        // Satırlar
        rawRows.forEach((row, idx) => {
            const isSelected = idx === currentHeaderRow;
            const rowStyle = isSelected
                ? 'background: rgba(46, 204, 113, 0.2); border-left: 3px solid #27ae60;'
                : 'cursor: pointer;';
            const hoverStyle = !isSelected ? 'onmouseover="this.style.background=\'rgba(74, 144, 217, 0.1)\'" onmouseout="this.style.background=\'\'"' : '';

            html += `<tr style="${rowStyle}" ${hoverStyle} onclick="vizPreviewSelectRow(${idx})">`;

            // Satır numarası ve radio button
            html += `
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid var(--gm-card-border); position: sticky; left: 0; background: ${isSelected ? 'rgba(46, 204, 113, 0.2)' : 'var(--gm-card-bg)'}; z-index: 1;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="radio" name="vizPreviewHeaderRow" value="${idx}" ${isSelected ? 'checked' : ''} style="cursor: pointer;">
                        <span style="font-weight: ${isSelected ? '600' : '400'};">${idx + 1}</span>
                    </label>
                </td>
            `;

            // Hücreler
            const cells = row.cells || [];
            for (let i = 0; i < maxCols; i++) {
                const cellValue = cells[i] !== undefined ? String(cells[i]) : '';
                const displayValue = cellValue.length > 30 ? cellValue.substring(0, 27) + '...' : cellValue;
                const cellStyle = isSelected ? 'font-weight: 600; color: var(--gm-primary);' : '';
                html += `<td style="padding: 10px; border-bottom: 1px solid var(--gm-card-border); white-space: nowrap; ${cellStyle}" title="${cellValue.replace(/"/g, '&quot;')}">${displayValue || '<span style="color: var(--gm-text-muted); font-style: italic;">-</span>'}</td>`;
            }

            html += `</tr>`;
        });

        html += `</tbody></table></div>`;

        // Uygula butonu
        html += `
            <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeVizPreviewModal()" style="padding: 10px 20px; border-radius: 6px; border: 1px solid var(--gm-card-border); background: transparent; color: var(--gm-text); cursor: pointer;">
                    ${lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
                <button onclick="vizApplySelectedHeaderRow()" style="padding: 10px 20px; border-radius: 6px; border: none; background: linear-gradient(135deg, var(--gm-primary), var(--gm-accent)); color: white; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-check"></i> ${lang === 'tr' ? 'Uygula' : 'Apply'}
                </button>
            </div>
        `;

        content.innerHTML = html;
    } else {
        content.innerHTML = `<p style="color: var(--gm-text-muted); text-align: center; padding: 40px;">${T?.no_preview || 'Önizleme için önce dosya yükleyin.'}</p>`;
    }

    modal.style.display = "flex";
}

// -----------------------------------------------------
// ROW SELECTION
// -----------------------------------------------------
export function vizPreviewSelectRow(rowIndex) {
    // Radio button'ı seç
    const radio = document.querySelector(`input[name="vizPreviewHeaderRow"][value="${rowIndex}"]`);
    if (radio) radio.checked = true;

    // Görsel stil güncelle
    const modal = document.getElementById("vizFilePreviewModal");
    if (modal) {
        modal.querySelectorAll('tbody tr').forEach((tr, idx) => {
            if (idx === rowIndex) {
                tr.style.background = 'rgba(46, 204, 113, 0.2)';
                tr.style.borderLeft = '3px solid #27ae60';
                tr.querySelectorAll('td').forEach((td, i) => {
                    if (i === 0) td.style.background = 'rgba(46, 204, 113, 0.2)';
                    else {
                        td.style.fontWeight = '600';
                        td.style.color = 'var(--gm-primary)';
                    }
                });
            } else {
                tr.style.background = '';
                tr.style.borderLeft = '';
                tr.querySelectorAll('td').forEach((td, i) => {
                    if (i === 0) td.style.background = 'var(--gm-card-bg)';
                    else {
                        td.style.fontWeight = '';
                        td.style.color = '';
                    }
                });
            }
        });
    }
}

// -----------------------------------------------------
// APPLY SELECTED HEADER ROW
// -----------------------------------------------------
export async function vizApplySelectedHeaderRow() {
    const radio = document.querySelector('input[name="vizPreviewHeaderRow"]:checked');
    const rowIndex = radio ? parseInt(radio.value) : 0;
    const lang = VIZ_STATE.lang || 'tr';

    window.VIZ_SELECTED_HEADER_ROW = rowIndex;

    // vizHeaderRow dropdown'ı güncelle
    const headerSelect = document.getElementById('vizHeaderRow');
    if (headerSelect) headerSelect.value = rowIndex;

    // Modal'ı kapat
    closeVizPreviewModal();

    // Dosyayı yeni header_row ile yeniden yükle
    const currentFile = window.VIZ_CURRENT_FILE || VIZ_STATE.getActiveDataset()?.file;
    if (currentFile) {
        console.log(`🔄 Refreshing data with header_row=${rowIndex}...`);

        if (typeof window.showToast === 'function') {
            window.showToast(lang === 'tr' ? 'Veri yeniden yükleniyor...' : 'Reloading data...', 'info');
        }

        // Use reloadWithOptions which is properly bound to window and handles everything
        if (typeof window.reloadWithOptions === 'function') {
            await window.reloadWithOptions();
            console.log('✅ reloadWithOptions completed - UI should be updated');
        } else if (typeof window.loadDataWithOptions === 'function') {
            // Fallback to loadDataWithOptions
            await window.loadDataWithOptions();
            console.log('✅ loadDataWithOptions completed');
        } else {
            console.error('❌ No reload function available');
        }

        // Re-render all charts with new data
        if (window.VIZ_STATE && window.VIZ_STATE.charts) {
            window.VIZ_STATE.charts.forEach(config => {
                if (typeof window.renderChart === 'function') {
                    window.renderChart(config);
                }
            });
            console.log('✅ Charts re-rendered');
        }

        if (typeof window.showToast === 'function') {
            window.showToast(lang === 'tr'
                ? `${rowIndex + 1}. satır başlık olarak uygulandı`
                : `Row ${rowIndex + 1} applied as header`, 'success');
        }
    }

    console.log(`✓ Header row applied: Row ${rowIndex}`);
}

// -----------------------------------------------------
// CLOSE MODAL
// -----------------------------------------------------
export function closeVizPreviewModal() {
    const modal = document.getElementById("vizFilePreviewModal");
    if (modal) modal.style.display = "none";
}

// -----------------------------------------------------
// INIT FILE PREVIEW INTEGRATION
// -----------------------------------------------------
export function initFilePreviewIntegration() {
    // Drop zone'a preview desteği ekle
    const dropZone = document.getElementById('vizDropZone');
    if (dropZone) {
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file) {
                window.VIZ_CURRENT_FILE = file;
                await loadFileWithPreview(file);
            }
        });
    }

    // File input'a preview desteği ekle
    const fileInput = document.getElementById('vizFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                window.VIZ_CURRENT_FILE = file;
                await loadFileWithPreview(file);
            }
        });
    }

    console.log('👁 File preview integration initialized');
}

// -----------------------------------------------------
// LOAD FILE WITH PREVIEW
// -----------------------------------------------------
export async function loadFileWithPreview(file) {
    try {
        // Backend'den raw satırları al
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/viz/preview-rows?max_rows=20', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            window.VIZ_RAW_PREVIEW_ROWS = data.rows || [];
            window.VIZ_SELECTED_HEADER_ROW = 0;

            // Preview modal'ı göster
            if (window.VIZ_RAW_PREVIEW_ROWS.length > 0) {
                showHeaderPreview();
            } else {
                // Preview yoksa direkt yükle
                if (typeof loadFile === 'function') loadFile(file);
            }
        } else {
            // Preview endpoint yoksa direkt yükle
            if (typeof loadFile === 'function') loadFile(file);
        }
    } catch (e) {
        console.warn('Preview failed, loading directly:', e);
        if (typeof loadFile === 'function') loadFile(file);
    }
}

// -----------------------------------------------------
// WINDOW BINDINGS
// -----------------------------------------------------
window.showHeaderPreview = showHeaderPreview;
window.vizPreviewSelectRow = vizPreviewSelectRow;
window.vizApplySelectedHeaderRow = vizApplySelectedHeaderRow;
window.vizSelectHeaderRow = vizApplySelectedHeaderRow;
window.applyVizHeaderFromPreview = vizApplySelectedHeaderRow;
window.closeVizPreviewModal = closeVizPreviewModal;
window.initFilePreviewIntegration = initFilePreviewIntegration;
window.loadFileWithPreview = loadFileWithPreview;

console.log("👁 preview.js module loaded");
