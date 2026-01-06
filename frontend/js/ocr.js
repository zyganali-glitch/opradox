// =====================================================
// OCR.JS - Opradox OCR Lab
// Görsellerden metin çıkarma
// =====================================================

// -----------------------------------------------------
// GLOBAL STATE
// -----------------------------------------------------
const OCR_STATE = {
    file: null,           // Yüklenen görsel/PDF
    previewUrl: null,     // Önizleme URL
    result: '',           // OCR sonucu
    lang: 'tr'
};

// Lokalizasyon
const OCR_TEXTS = {
    tr: {
        ocr_subtitle: 'OCR Lab',
        image_preview: 'Görsel Önizleme',
        ocr_drop_title: 'Görsel Yükleyin',
        ocr_drop_desc: 'PNG, JPG, PDF desteklenir',
        ocr_settings: 'Ayarlar',
        ocr_language: 'Dil',
        output_format: 'Çıktı Formatı',
        format_text: 'Düz Metin',
        format_json: 'JSON',
        format_table: 'Tablo (Excel)',
        run_ocr: 'OCR Çalıştır',
        ocr_output: 'Çıktı',
        ocr_output_empty: 'OCR sonucu burada görünecek',
        processing: 'İşleniyor...',
        copy_success: 'Panoya kopyalandı!',
        chars: 'karakter',
        words: 'kelime',
        no_image: 'Lütfen önce bir görsel yükleyin',
        error: 'Hata oluştu'
    },
    en: {
        ocr_subtitle: 'OCR Lab',
        image_preview: 'Image Preview',
        ocr_drop_title: 'Upload Image',
        ocr_drop_desc: 'PNG, JPG, PDF supported',
        ocr_settings: 'Settings',
        ocr_language: 'Language',
        output_format: 'Output Format',
        format_text: 'Plain Text',
        format_json: 'JSON',
        format_table: 'Table (Excel)',
        run_ocr: 'Run OCR',
        ocr_output: 'Output',
        ocr_output_empty: 'OCR result will appear here',
        processing: 'Processing...',
        copy_success: 'Copied to clipboard!',
        chars: 'characters',
        words: 'words',
        no_image: 'Please upload an image first',
        error: 'An error occurred'
    }
};

// -----------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initOcrLab();
    loadSavedTheme();
    loadSavedLang();
    setupEventListeners();
    setupDragAndDrop();
});

function initOcrLab() {
    console.log('OCR Lab başlatıldı');
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
    OCR_STATE.lang = saved;
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

    const logo = document.getElementById('ocrLogo');
    if (logo) {
        logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
    }
}

function toggleLang() {
    OCR_STATE.lang = OCR_STATE.lang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('opradox_lang', OCR_STATE.lang);
    updateLangLabel();
    applyLocalization();
}

function updateLangLabel() {
    const label = document.getElementById('langLabel');
    if (label) {
        label.textContent = OCR_STATE.lang === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 En | Tr';
    }
}

function applyLocalization() {
    const texts = OCR_TEXTS[OCR_STATE.lang];
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
    document.getElementById('ocrFileInput')?.addEventListener('change', handleFileSelect);
    document.getElementById('loadImageBtn')?.addEventListener('click', () => {
        document.getElementById('ocrFileInput')?.click();
    });
    document.getElementById('removeImageBtn')?.addEventListener('click', clearImage);

    // Run OCR
    document.getElementById('runOcrBtn')?.addEventListener('click', runOcr);

    // Output actions
    document.getElementById('copyOutputBtn')?.addEventListener('click', copyOutput);
    document.getElementById('downloadOutputBtn')?.addEventListener('click', downloadOutput);
}

// -----------------------------------------------------
// DRAG & DROP
// -----------------------------------------------------
function setupDragAndDrop() {
    const dropZone = document.getElementById('ocrDropZone');
    if (!dropZone) return;

    dropZone.addEventListener('click', () => {
        document.getElementById('ocrFileInput')?.click();
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
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            loadImage(files[0]);
        }
    });
}

// -----------------------------------------------------
// FILE HANDLING
// -----------------------------------------------------
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
}

function loadImage(file) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Lütfen görsel veya PDF dosyası seçin');
        return;
    }

    OCR_STATE.file = file;

    // Önizleme oluştur
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            OCR_STATE.previewUrl = e.target.result;
            showPreview(file.name, e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        // PDF için placeholder
        OCR_STATE.previewUrl = null;
        showPreview(file.name, null);
    }
}

function showPreview(fileName, imageUrl) {
    document.getElementById('ocrDropZone').style.display = 'none';
    document.getElementById('ocrPreviewContainer').style.display = 'block';
    document.getElementById('ocrSettings').style.display = 'block';

    document.getElementById('ocrFileName').textContent = fileName;

    const img = document.getElementById('ocrPreviewImg');
    if (imageUrl) {
        img.src = imageUrl;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
}

function clearImage() {
    OCR_STATE.file = null;
    OCR_STATE.previewUrl = null;

    document.getElementById('ocrDropZone').style.display = 'flex';
    document.getElementById('ocrPreviewContainer').style.display = 'none';
    document.getElementById('ocrSettings').style.display = 'none';
    document.getElementById('ocrFileInput').value = '';

    clearOutput();
}

// -----------------------------------------------------
// OCR OPERATIONS
// -----------------------------------------------------
async function runOcr() {
    if (!OCR_STATE.file) {
        alert(OCR_TEXTS[OCR_STATE.lang].no_image);
        return;
    }

    showProcessing();

    // Demo: Backend entegrasyonu için hazır
    // Gerçek OCR için Tesseract.js veya backend API kullanılabilir
    setTimeout(() => {
        const demoText = `Bu bir demo OCR sonucudur.

Opradox OCR Lab, görsellerden metin çıkarmanızı sağlar.
Tesseract veya benzeri bir OCR motoru ile backend entegrasyonu yapılabilir.

Desteklenen diller:
- Türkçe
- English
- Deutsch
- Français

Bu metin görselden çıkarılmış gibi görünmektedir.`;

        showOutput(demoText);
    }, 2000);
}

function showProcessing() {
    document.getElementById('ocrOutputEmpty').style.display = 'none';
    document.getElementById('ocrOutputProcessing').style.display = 'flex';
    document.getElementById('ocrOutputResult').style.display = 'none';
}

function showOutput(text) {
    OCR_STATE.result = text;

    document.getElementById('ocrOutputEmpty').style.display = 'none';
    document.getElementById('ocrOutputProcessing').style.display = 'none';
    document.getElementById('ocrOutputResult').style.display = 'block';

    document.getElementById('ocrOutputText').textContent = text;

    // İstatistikler
    const chars = text.length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const t = OCR_TEXTS[OCR_STATE.lang];

    document.getElementById('ocrCharCount').textContent = `${chars} ${t.chars}`;
    document.getElementById('ocrWordCount').textContent = `${words} ${t.words}`;
}

function clearOutput() {
    OCR_STATE.result = '';
    document.getElementById('ocrOutputEmpty').style.display = 'flex';
    document.getElementById('ocrOutputProcessing').style.display = 'none';
    document.getElementById('ocrOutputResult').style.display = 'none';
}

// -----------------------------------------------------
// OUTPUT ACTIONS
// -----------------------------------------------------
function copyOutput() {
    if (!OCR_STATE.result) return;

    navigator.clipboard.writeText(OCR_STATE.result).then(() => {
        // Feedback
        const btn = document.getElementById('copyOutputBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 1500);
    });
}

function downloadOutput() {
    if (!OCR_STATE.result) return;

    const format = document.getElementById('outputFormat').value;
    let content = OCR_STATE.result;
    let filename = 'ocr_result.txt';
    let mimeType = 'text/plain';

    if (format === 'json') {
        content = JSON.stringify({
            text: OCR_STATE.result,
            chars: OCR_STATE.result.length,
            words: OCR_STATE.result.split(/\s+/).filter(w => w.length > 0).length,
            timestamp: new Date().toISOString()
        }, null, 2);
        filename = 'ocr_result.json';
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
