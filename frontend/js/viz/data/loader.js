import { VIZ_STATE } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { addDataset, removeDataset } from './manager.js';

/**
 * Dosya Yükleme İşleyicilerini Kur
 */
export function setupVizFileHandlers() {
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
        console.log('🖱️ Drop zone clicked!');
        // Remove butonuna tıklandıysa event'i durdur
        if (e.target.closest('.viz-file-remove')) return;

        if (fileInput) {
            console.log('📂 Triggering file input click...');
            fileInput.click();
        } else {
            console.error('❌ File input not found!');
        }
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

/**
 * Dosya Yükle (Metadata ve Sheets)
 */
export async function loadVizFile(file) {
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
        const datasetId = addDataset(file, [], [], [], []);

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

        // Veriyi yükle
        await loadVizDataWithOptions(file);

        // Toast göster
        showToast(`${file.name} yüklendi`, 'success');

    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showToast('Dosya yüklenemedi: ' + error.message, 'error');
    }
}

/**
 * Seçeneklerle Veri Yükle (Sheet, Header Row)
 */
export async function loadVizDataWithOptions(file) {
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
        }

        // UI'ı güncelle (Global fonksiyonları çağır - loose coupling)
        if (window.renderColumnsList) window.renderColumnsList();
        if (window.updateDropdowns) window.updateDropdowns();
        if (window.updateDataProfile) window.updateDataProfile();

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showToast('Veri yüklenemedi: ' + error.message, 'error');
    }
}

/**
 * Veriyi Temizle
 */
export function clearVizData() {
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
        removeDataset(VIZ_STATE.activeDatasetId);
    }

    showToast('Veri temizlendi', 'info');
}
