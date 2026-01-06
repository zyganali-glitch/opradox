// =====================================================
// PDF.JS - Opradox PDF Tools
// Merge, Split, Compress, Convert
// =====================================================

// -----------------------------------------------------
// GLOBAL STATE
// -----------------------------------------------------
const PDF_STATE = {
    files: [],           // Yüklenen PDF dosyaları
    currentTool: 'merge', // Aktif araç
    convertFormat: 'jpg', // Dönüştürme formatı
    lang: 'tr'
};

// Lokalizasyon
const PDF_TEXTS = {
    tr: {
        pdf_subtitle: 'PDF Tools',
        pdf_merge: 'Birleştir',
        pdf_split: 'Böl',
        pdf_compress: 'Sıkıştır',
        pdf_convert: 'Dönüştür',
        pdf_drop_title: 'PDF Dosyalarını Sürükleyin',
        pdf_drop_desc: 'veya tıklayarak seçin',
        uploaded_files: 'Yüklenen Dosyalar',
        merge_desc: 'Birden fazla PDF dosyasını tek bir dosyada birleştirin.',
        split_desc: "PDF'i sayfa aralıklarına veya tek tek sayfalara bölün.",
        compress_desc: 'PDF dosya boyutunu küçültün.',
        convert_desc: "PDF'i farklı formatlara dönüştürün.",
        output_filename: 'Çıktı Dosya Adı',
        split_mode: 'Bölme Modu',
        split_all_pages: 'Her Sayfayı Ayrı',
        split_range: 'Sayfa Aralığı',
        split_extract: 'Belirli Sayfaları Çıkar',
        page_range: 'Sayfa Aralığı (örn: 1-5, 8, 10-12)',
        compression_level: 'Sıkıştırma Seviyesi',
        compress_low: 'Düşük (Kaliteli)',
        compress_medium: 'Orta',
        compress_high: 'Yüksek (Küçük Boyut)',
        convert_to: 'Dönüştür:',
        run: 'Çalıştır',
        result: 'Sonuç',
        download: 'İndir',
        no_files: 'Lütfen önce PDF dosyası yükleyin',
        processing: 'İşleniyor...',
        success: 'İşlem tamamlandı!',
        error: 'Hata oluştu'
    },
    en: {
        pdf_subtitle: 'PDF Tools',
        pdf_merge: 'Merge',
        pdf_split: 'Split',
        pdf_compress: 'Compress',
        pdf_convert: 'Convert',
        pdf_drop_title: 'Drop PDF Files Here',
        pdf_drop_desc: 'or click to select',
        uploaded_files: 'Uploaded Files',
        merge_desc: 'Combine multiple PDF files into one.',
        split_desc: 'Split PDF into page ranges or individual pages.',
        compress_desc: 'Reduce PDF file size.',
        convert_desc: 'Convert PDF to different formats.',
        output_filename: 'Output Filename',
        split_mode: 'Split Mode',
        split_all_pages: 'Each Page Separate',
        split_range: 'Page Range',
        split_extract: 'Extract Specific Pages',
        page_range: 'Page Range (e.g. 1-5, 8, 10-12)',
        compression_level: 'Compression Level',
        compress_low: 'Low (Quality)',
        compress_medium: 'Medium',
        compress_high: 'High (Small Size)',
        convert_to: 'Convert to:',
        run: 'Run',
        result: 'Result',
        download: 'Download',
        no_files: 'Please upload PDF files first',
        processing: 'Processing...',
        success: 'Operation completed!',
        error: 'An error occurred'
    }
};

// -----------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initPdfTools();
    loadSavedTheme();
    loadSavedLang();
    setupEventListeners();
    setupDragAndDrop();
});

function initPdfTools() {
    console.log('PDF Tools başlatıldı');
    updateToolUI('merge');
}

// -----------------------------------------------------
// THEME & LANGUAGE
// -----------------------------------------------------
function loadSavedTheme() {
    const saved = localStorage.getItem('opradox_theme');
    // FAZ-THEME-2: Guarantee XOR - always remove both, then add exactly one
    document.body.classList.remove('dark-mode', 'day-mode');
    if (saved === 'day') {
        document.body.classList.add('day-mode');
    } else {
        document.body.classList.add('dark-mode');
    }
}

function loadSavedLang() {
    const saved = localStorage.getItem('opradox_lang') || 'tr';
    PDF_STATE.lang = saved;
    updateLangLabel();
    applyLocalization();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    // FAZ-THEME-2: Explicit remove/add for XOR guarantee
    if (isDark) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
        localStorage.setItem('opradox_theme', 'day');
    } else {
        document.body.classList.remove('day-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('opradox_theme', 'dark');
    }

    const logo = document.getElementById('pdfLogo');
    if (logo) {
        logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
    }
}

function toggleLang() {
    PDF_STATE.lang = PDF_STATE.lang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('opradox_lang', PDF_STATE.lang);
    updateLangLabel();
    applyLocalization();
}

function updateLangLabel() {
    const label = document.getElementById('langLabel');
    if (label) {
        label.textContent = PDF_STATE.lang === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 En | Tr';
    }
}

function applyLocalization() {
    const texts = PDF_TEXTS[PDF_STATE.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });
}

// -----------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------
function setupEventListeners() {
    // Theme & Language
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('langToggle')?.addEventListener('click', toggleLang);

    // File Input
    document.getElementById('pdfFileInput')?.addEventListener('change', handleFileSelect);
    document.getElementById('clearFilesBtn')?.addEventListener('click', clearFiles);

    // Tool buttons
    document.querySelectorAll('.pdf-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            selectTool(tool);
        });
    });

    // Split mode change
    document.getElementById('splitMode')?.addEventListener('change', (e) => {
        const rangeOptions = document.getElementById('splitRangeOptions');
        if (rangeOptions) {
            rangeOptions.style.display = e.target.value !== 'pages' ? 'block' : 'none';
        }
    });

    // Convert format buttons
    document.querySelectorAll('.pdf-convert-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pdf-convert-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            PDF_STATE.convertFormat = btn.dataset.format;
        });
    });

    // Run buttons
    document.getElementById('runMergeBtn')?.addEventListener('click', runMerge);
    document.getElementById('runSplitBtn')?.addEventListener('click', runSplit);
    document.getElementById('runCompressBtn')?.addEventListener('click', runCompress);
    document.getElementById('runConvertBtn')?.addEventListener('click', runConvert);
}

// -----------------------------------------------------
// TOOL SELECTION
// -----------------------------------------------------
function selectTool(tool) {
    PDF_STATE.currentTool = tool;

    // Button states
    document.querySelectorAll('.pdf-tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    // Show/hide settings panels
    updateToolUI(tool);
}

function updateToolUI(tool) {
    const panels = ['mergeSettings', 'splitSettings', 'compressSettings', 'convertSettings'];
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const activePanel = document.getElementById(`${tool}Settings`);
    if (activePanel) activePanel.style.display = 'block';
}

// -----------------------------------------------------
// DRAG & DROP
// -----------------------------------------------------
function setupDragAndDrop() {
    const dropZone = document.getElementById('pdfDropZone');
    if (!dropZone) return;

    dropZone.addEventListener('click', () => {
        document.getElementById('pdfFileInput')?.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length > 0) {
            addFiles(files);
        }
    });
}

// -----------------------------------------------------
// FILE HANDLING
// -----------------------------------------------------
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function addFiles(files) {
    files.forEach(file => {
        if (!PDF_STATE.files.some(f => f.name === file.name)) {
            PDF_STATE.files.push(file);
        }
    });

    renderFileList();
}

function clearFiles() {
    PDF_STATE.files = [];
    document.getElementById('pdfFileInput').value = '';
    renderFileList();
}

function removeFile(index) {
    PDF_STATE.files.splice(index, 1);
    renderFileList();
}

function renderFileList() {
    const container = document.getElementById('pdfFilesContainer');
    const listSection = document.getElementById('pdfFileList');
    const dropZone = document.getElementById('pdfDropZone');

    if (PDF_STATE.files.length === 0) {
        listSection.style.display = 'none';
        dropZone.style.display = 'flex';
        return;
    }

    listSection.style.display = 'block';
    dropZone.style.display = 'none';

    container.innerHTML = PDF_STATE.files.map((file, i) => `
        <div class="pdf-file-item" draggable="true" data-index="${i}">
            <div class="pdf-file-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="pdf-file-info">
                <span class="pdf-file-name">${file.name}</span>
                <span class="pdf-file-size">${formatFileSize(file.size)}</span>
            </div>
            <button class="pdf-file-remove" onclick="removeFile(${i})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Dosya sıralama için drag
    setupFileDrag();
}

function setupFileDrag() {
    const container = document.getElementById('pdfFilesContainer');
    const items = container.querySelectorAll('.pdf-file-item');

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('fileIndex', item.dataset.index);
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('fileIndex'));
            const toIndex = parseInt(item.dataset.index);

            if (fromIndex !== toIndex) {
                const files = [...PDF_STATE.files];
                const [moved] = files.splice(fromIndex, 1);
                files.splice(toIndex, 0, moved);
                PDF_STATE.files = files;
                renderFileList();
            }
        });
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// -----------------------------------------------------
// PDF OPERATIONS (Frontend - Backend çağıracak)
// -----------------------------------------------------
async function runMerge() {
    if (PDF_STATE.files.length < 2) {
        showResult('error', PDF_TEXTS[PDF_STATE.lang].no_files + ' (min 2)');
        return;
    }

    showResult('processing', PDF_TEXTS[PDF_STATE.lang].processing);

    // Backend entegrasyonu için hazır
    // Şimdilik demo mesajı
    setTimeout(() => {
        showResult('success', PDF_TEXTS[PDF_STATE.lang].success + '<br>Birleştirilen dosya: merged.pdf');
    }, 1500);
}

async function runSplit() {
    if (PDF_STATE.files.length === 0) {
        showResult('error', PDF_TEXTS[PDF_STATE.lang].no_files);
        return;
    }

    showResult('processing', PDF_TEXTS[PDF_STATE.lang].processing);

    setTimeout(() => {
        const mode = document.getElementById('splitMode').value;
        showResult('success', PDF_TEXTS[PDF_STATE.lang].success + '<br>Mod: ' + mode);
    }, 1500);
}

async function runCompress() {
    if (PDF_STATE.files.length === 0) {
        showResult('error', PDF_TEXTS[PDF_STATE.lang].no_files);
        return;
    }

    showResult('processing', PDF_TEXTS[PDF_STATE.lang].processing);

    setTimeout(() => {
        const level = document.getElementById('compressionLevel').value;
        showResult('success', PDF_TEXTS[PDF_STATE.lang].success + '<br>Seviye: ' + level);
    }, 1500);
}

async function runConvert() {
    if (PDF_STATE.files.length === 0) {
        showResult('error', PDF_TEXTS[PDF_STATE.lang].no_files);
        return;
    }

    showResult('processing', PDF_TEXTS[PDF_STATE.lang].processing);

    setTimeout(() => {
        showResult('success', PDF_TEXTS[PDF_STATE.lang].success + '<br>Format: ' + PDF_STATE.convertFormat.toUpperCase());
    }, 1500);
}

function showResult(type, message) {
    const card = document.getElementById('pdfResultCard');
    const content = document.getElementById('pdfResultContent');

    card.style.display = 'block';

    let icon = 'check-circle';
    let color = 'var(--gm-success)';

    if (type === 'processing') {
        icon = 'spinner fa-spin';
        color = 'var(--gm-primary)';
    } else if (type === 'error') {
        icon = 'exclamation-circle';
        color = '#ef4444';
    }

    content.innerHTML = `
        <div class="pdf-result-message" style="color: ${color}">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
}

// Global fonksiyonlar
window.removeFile = removeFile;
