/**
 * viz_file_handler.js - Dosya Yükleme İşleyicileri
 * viz.html için dosya drop ve file input event handler'ları
 */

console.log('📁 viz_file_handler.js yüklendi');

// DOMContentLoaded'da event listener'ları ekle
document.addEventListener('DOMContentLoaded', () => {
    setupVizFileHandlers();
});

function setupVizFileHandlers() {
    const dropZone = document.getElementById('vizDropZone');
    const fileInput = document.getElementById('vizFileInput');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const fileRemoveBtn = document.getElementById('vizFileRemove');

    console.log('🔧 Dosya handler\'ları ayarlanıyor...', { dropZone: !!dropZone, fileInput: !!fileInput });

    if (!dropZone) {
        console.warn('⚠️ vizDropZone elementi bulunamadı');
        return;
    }

    // Load Data butonu tıklaması
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput?.click();
        });
    }

    // Drop zone tıklaması
    dropZone.addEventListener('click', (e) => {
        // Remove butonuna tıklandıysa event'i durdur
        if (e.target.closest('.viz-file-remove')) return;
        fileInput?.click();
    });

    // Dosya seçildiğinde
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('📄 Dosya seçildi:', file.name);
                loadVizFile(file);
            }
            e.target.value = ''; // Reset for same file selection
        });
    }

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            console.log('📄 Dosya bırakıldı:', file.name);
            loadVizFile(file);
        }
    });

    // Dosya kaldırma butonu
    if (fileRemoveBtn) {
        fileRemoveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearVizData();
        });
    }

    console.log('✅ Dosya handler\'ları kuruldu');
}

async function loadVizFile(file) {
    try {
        console.log('📤 Dosya yükleniyor:', file.name, file.size, 'bytes');

        // UI güncelle - dosya bilgisi göster
        const fileInfo = document.getElementById('vizFileInfo');
        const fileName = document.getElementById('vizFileName');
        const dropZone = document.getElementById('vizDropZone');
        const fileOptions = document.getElementById('vizFileOptions');

        if (dropZone) dropZone.style.display = 'none';
        if (fileInfo) fileInfo.style.display = 'block';
        if (fileName) fileName.textContent = file.name;
        if (fileOptions) fileOptions.style.display = 'block';

        // Yeni dataset oluştur
        const datasetId = VIZ_STATE.addDataset(file, [], [], [], []);

        // Backend'e dosya gönder - önce sayfa listesini al
        const sheetsFormData = new FormData();
        sheetsFormData.append('file', file);

        try {
            const sheetsResponse = await fetch('/viz/sheets', {
                method: 'POST',
                body: sheetsFormData
            });

            if (sheetsResponse.ok) {
                const sheetsData = await sheetsResponse.json();
                const sheets = sheetsData.sheets || [];

                // Sheets'i state'e kaydet
                if (VIZ_STATE.datasets[datasetId]) {
                    VIZ_STATE.datasets[datasetId].sheets = sheets;
                }

                // Sayfa seçici göster (birden fazla sayfa varsa)
                const sheetWrapper = document.getElementById('vizSheetSelectorWrapper');
                const sheetSelector = document.getElementById('vizSheetSelector');

                if (sheets.length > 1 && sheetWrapper && sheetSelector) {
                    sheetWrapper.style.display = 'block';
                    sheetSelector.innerHTML = sheets.map((s, i) =>
                        `<option value="${s}" ${i === 0 ? 'selected' : ''}>${s}</option>`
                    ).join('');

                    // Sayfa değişikliğinde veriyi yeniden yükle
                    sheetSelector.onchange = () => loadVizDataWithOptions(file);
                } else if (sheetWrapper) {
                    sheetWrapper.style.display = 'none';
                }
            }
        } catch (err) {
            console.warn('Sayfa listesi alınamadı:', err);
        }

        // Başlık satırı seçiciyi ayarla
        const headerRowSelector = document.getElementById('vizHeaderRow');
        if (headerRowSelector) {
            headerRowSelector.onchange = () => loadVizDataWithOptions(file);
        }

        // KRİTİK: Raw rows'u dosyadan direkt oku (header parsing öncesi)
        // Bu Excel Studio'nun inspectFile mantığıyla aynı
        try {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Tüm hücreleri raw olarak al (header=1 = satırları array olarak al)
                    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                    // İlk 15 satırı VIZ_RAW_PREVIEW_ROWS'a kaydet
                    const rawRows = [];
                    for (let i = 0; i < Math.min(15, rawData.length); i++) {
                        const cells = rawData[i].map(cell => String(cell ?? ''));
                        rawRows.push({ cells });
                    }

                    window.VIZ_RAW_PREVIEW_ROWS = rawRows;
                    window.VIZ_CURRENT_FILE = file;
                    console.log('📋 Raw preview rows loaded via SheetJS:', rawRows.length, 'rows');
                } catch (parseErr) {
                    console.warn('Raw rows parsing failed:', parseErr);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (rawErr) {
            console.warn('Raw rows loading failed:', rawErr);
        }

        // Veriyi yükle
        await loadVizDataWithOptions(file);

        // Toast göster
        if (typeof showToast === 'function') {
            showToast(`${file.name} yüklendi`, 'success');
        }

    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        if (typeof showToast === 'function') {
            showToast('Dosya yüklenemedi: ' + error.message, 'error');
        }
    }
}

async function loadVizDataWithOptions(file) {
    try {
        const sheetSelector = document.getElementById('vizSheetSelector');
        const headerRowSelector = document.getElementById('vizHeaderRow');

        const selectedSheet = sheetSelector?.value || '';
        const headerRow = parseInt(headerRowSelector?.value || '0');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('sheet_name', selectedSheet);
        formData.append('header_row', headerRow.toString());

        console.log('📊 Veri yükleniyor...', { sheet: selectedSheet, headerRow });

        const response = await fetch('/viz/data', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Veri alındı:', result.data?.length, 'satır,', result.columns?.length, 'sütun');

        // VIZ_STATE'i güncelle
        const dataset = VIZ_STATE.getActiveDataset();
        if (dataset) {
            dataset.data = result.data || [];
            dataset.columns = result.columns || [];
            dataset.columnsInfo = result.columns_info || [];
            dataset.file = file; // Dosyayı cache'le
        }

        // KRİTİK: VIZ_STATE kök seviyesini de güncelle (updateDataProfile bunları kullanıyor)
        VIZ_STATE.data = result.data || [];
        VIZ_STATE.columns = result.columns || [];
        VIZ_STATE.columnsInfo = result.columns_info || [];
        console.log('🔄 VIZ_STATE synced:', VIZ_STATE.columns.length, 'columns');

        // Raw rows'u cache'le (önizleme için) - ilk 15 satır
        if (result.data && result.data.length > 0) {
            const columns = result.columns || [];
            const rawRows = [];

            // İlk 15 satırı raw rows formatına çevir
            for (let i = 0; i < Math.min(15, result.data.length); i++) {
                const row = result.data[i];
                const cells = columns.map(col => String(row[col] ?? ''));
                rawRows.push({ cells });
            }

            // Global cache
            window.VIZ_RAW_PREVIEW_ROWS = rawRows;
            window.VIZ_CURRENT_FILE = file;
            console.log('📋 Raw preview rows cached:', rawRows.length);
        }

        // UI'ı güncelle
        if (typeof renderColumnsList === 'function') {
            renderColumnsList();
        }
        if (typeof updateDropdowns === 'function') {
            updateDropdowns();
        }
        if (typeof updateDataProfile === 'function') {
            updateDataProfile();
        }

        // Yeni: Sütun listesini güncelle (varsa)
        if (typeof updateColumnsListWithTypes === 'function') {
            updateColumnsListWithTypes();
        }

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        if (typeof showToast === 'function') {
            showToast('Veri yüklenemedi: ' + error.message, 'error');
        }
    }
}

function clearVizData() {
    // UI'ı sıfırla
    const fileInfo = document.getElementById('vizFileInfo');
    const dropZone = document.getElementById('vizDropZone');
    const fileOptions = document.getElementById('vizFileOptions');
    const columnsList = document.getElementById('vizColumnsList');

    if (dropZone) dropZone.style.display = 'block';
    if (fileInfo) fileInfo.style.display = 'none';
    if (fileOptions) fileOptions.style.display = 'none';
    if (columnsList) columnsList.innerHTML = '';

    // State'i temizle
    if (VIZ_STATE.activeDatasetId) {
        VIZ_STATE.removeDataset(VIZ_STATE.activeDatasetId);
    }

    if (typeof showToast === 'function') {
        showToast('Veri temizlendi', 'info');
    }
}

// Global erişim için export
window.loadVizFile = loadVizFile;
window.loadVizDataWithOptions = loadVizDataWithOptions;
window.clearVizData = clearVizData;
window.setupVizFileHandlers = setupVizFileHandlers;
