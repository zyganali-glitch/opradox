// ============================================================================
// PHASE 1: CROSS-SHEET CORE FUNCTIONS
// Implementasyon: 2024-12-16
// ============================================================================

/**
 * İkinci dosya sütunlarını datalist'e ekle (file2-columns)
 * @param {Array<string>} columns - Sütun isimleri
 */
function updateFile2ColumnDatalist(columns) {
    if (!columns || !Array.isArray(columns)) {
        console.warn('updateFile2ColumnDatalist: Invalid columns', columns);
        return;
    }

    let datalist = document.getElementById('file2-columns');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'file2-columns';
        document.body.appendChild(datalist);
    }

    datalist.innerHTML = columns.map(col =>
        `<option value="${col}">${col}</option>`
    ).join('');

    console.log(`✓ updateFile2ColumnDatalist: ${columns.length} sütun eklendi`);
}

/**
 * Cross-sheet / ikinci dosya kaynağı seçim UI bloğu HTML'i üret
 * PRO Builder'daki merge block mantığını kullanır
 * @param {string} uniqueId - Unique identifier for event binding
 * @returns {string} HTML string
 */
function getInlineCrossSheetHTML(uniqueId = '') {
    const T = EXTRA_TEXTS[CURRENT_LANG];
    const hasMultipleSheets = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;
    const hasSecondFile = FILE2_COLUMNS && FILE2_COLUMNS.length > 0;

    // Ana dosyada çok sayfa varsa, aktif olmayan sayfaları listele
    const crossSheetOptions = hasMultipleSheets
        ? FILE_SHEET_NAMES.filter(s => s !== FILE_SELECTED_SHEET)
            .map(s => `<option value="${s}">${s}</option>`).join('')
        : '';

    return `
    <div class="gm-crosssheet-source" data-id="${uniqueId}" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; padding:8px; background:rgba(59,130,246,0.1); border-radius:6px; border:1px dashed var(--gm-primary);">
        
        ${hasMultipleSheets ? `
        <!-- Cross-Sheet Checkbox -->
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">
            <input type="checkbox" class="use-crosssheet" onchange="toggleCrossSheet(this)" style="width:16px; height:16px; accent-color:var(--gm-primary);">
            <span style="color:var(--gm-primary); font-weight:500;"><i class="fas fa-layer-group"></i> ${T.use_same_file_sheet || 'Aynı Dosyadan'}</span>
        </label>
        
        <!-- Cross-Sheet Selector (başlangıçta gizli) -->
        <div class="crosssheet-area" style="display:none; flex:1; min-width:200px; align-items:center; gap:6px;">
            <select class="crosssheet-select gm-sheet-select" style="padding:4px 8px; font-size:0.8rem; height:28px; max-width:140px;" onchange="onCrossSheetChange(this)">
                ${crossSheetOptions}
            </select>
            <!-- Sütun Preview -->
            <div class="crosssheet-columns" style="flex:1; min-width:0; background:var(--gm-bg); border:1px solid var(--gm-card-border); border-radius:4px; padding:2px 6px; height:28px; display:flex; align-items:center; overflow:hidden;">
                <div class="crosssheet-column-list" style="display:flex; gap:4px; overflow-x:auto; white-space:nowrap; align-items:center; width:100%; scrollbar-width:thin;">
                    <span style="color:var(--gm-text-muted); font-size:0.7rem; font-style:italic;">${T.select_sheet || 'Sayfa seçin...'}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- İkinci Dosya Gerekli Uyarısı -->
        <div class="sf-warning" style="color:#ef4444; font-size:0.75rem; ${!hasSecondFile ? '' : 'display:none;'} ${hasMultipleSheets ? '' : 'flex:1;'}">
            <i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_file_required || 'İkinci dosya yükleyin veya yukarıdan sayfa seçin'}
        </div>
    </div>
    `;
}

/**
 * Cross-sheet checkbox toggle handler
 * @param {HTMLInputElement} checkbox
 */
function toggleCrossSheet(checkbox) {
    const container = checkbox.closest('.gm-crosssheet-source');
    if (!container) {
        console.error('toggleCrossSheet: container not found');
        return;
    }

    const area = container.querySelector('.crosssheet-area');
    const warning = container.querySelector('.sf-warning');

    if (checkbox.checked) {
        // Cross-sheet modunu aç
        if (area) area.style.display = 'flex';
        if (warning) warning.style.display = 'none';

        // İlk sheet'i otomatik seç
        const select = container.querySelector('.crosssheet-select');
        if (select && select.options.length > 0) {
            // İlk seçeneği trigger et
            onCrossSheetChange(select);
        }
    } else {
        // İkinci dosya moduna dön
        if (area) area.style.display = 'none';
        if (warning && FILE2_COLUMNS.length === 0) {
            warning.style.display = 'block';
        }

        // Parametre datalist'ini file2-columns'a geri döndür
        updateFile2ColumnDatalist(FILE2_COLUMNS);
    }
}

/**
 * Cross-sheet sayfa değişikliği handler
 * Seçilen sayfanın sütunlarını fetch edip UI'ya yansıtır
 * @param {HTMLSelectElement} selectElement
 */
async function onCrossSheetChange(selectElement) {
    const sheetName = selectElement.value;
    const container = selectElement.closest('.crosssheet-area');
    if (!container) {
        console.error('onCrossSheetChange: container not found');
        return;
    }

    const columnList = container.querySelector('.crosssheet-column-list');
    if (!columnList) {
        console.error('onCrossSheetChange: columnList not found');
        return;
    }

    // Loading state
    columnList.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';

    // Ana dosyayı al
    const fileInput = document.getElementById('fileInput');
    if (!fileInput || !fileInput.files[0]) {
        columnList.innerHTML = '<span style="color:#ef4444;">Dosya bulunamadı!</span>';
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.columns && Array.isArray(data.columns)) {
            // Sütun chip'leri render et
            columnList.innerHTML = data.columns.map((col, i) => {
                const letter = indexToLetter(i);
                return `<span class="gm-col-chip"><strong>${letter}</strong>${col}</span>`;
            }).join('');

            // Parametre inputlarının datalist'ini bu sütunlarla güncelle
            updateFile2ColumnDatalist(data.columns);

            console.log(`✓ Cross-sheet: "${sheetName}" sayfası yüklendi, ${data.columns.length} sütun`);
        } else {
            columnList.innerHTML = '<span style="color:#ef4444;">Sütun bulunamadı!</span>';
        }
    } catch (err) {
        console.error('onCrossSheetChange error:', err);
        columnList.innerHTML = '<span style="color:#ef4444;">Hata!</span>';
    }
}

/**
 * Tüm cross-sheet blokların uyarı durumunu güncelle
 * İkinci dosya yüklendiğinde veya kaldırıldığında çağrılır
 */
function updateAllCrossSheetWarnings() {
    const hasSecondFile = FILE2_COLUMNS && FILE2_COLUMNS.length > 0;

    document.querySelectorAll('.gm-crosssheet-source').forEach(container => {
        const checkbox = container.querySelector('.use-crosssheet');
        const warning = container.querySelector('.sf-warning');

        if (warning) {
            // Eğer checkbox işaretliyse veya ikinci dosya varsa uyarıyı gizle
            if ((checkbox && checkbox.checked) || hasSecondFile) {
                warning.style.display = 'none';
            } else {
                warning.style.display = 'block';
            }
        }
    });
}

// ============================================================================
// END OF PHASE 1 FUNCTIONS
// ============================================================================
