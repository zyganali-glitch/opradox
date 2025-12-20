/**
 * fileDocker.js - Opradox Dosya Docker Yönetimi
 * Tarayıcı tarafında dosya yönetimi (sessionStorage kullanarak)
 * Sunucuya dosya gönderilmez, sadece referanslar tutulur.
 */

console.log("📁 fileDocker.js v1.0 yüklendi");

// =====================================================
// GLOBAL STATE
// =====================================================
const FILE_DOCKER = {
    files: [],           // { id, name, type, size, file, moduleType }
    maxFiles: 20,
    supportedTypes: {
        excel: ['.xlsx', '.xls', '.csv'],
        pdf: ['.pdf'],
        image: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']
    }
};

// =====================================================
// DOSYA TİPİ TESPİTİ
// =====================================================
function getFileModuleType(filename) {
    const ext = '.' + filename.split('.').pop().toLowerCase();

    if (FILE_DOCKER.supportedTypes.excel.includes(ext)) return 'excel';
    if (FILE_DOCKER.supportedTypes.pdf.includes(ext)) return 'pdf';
    if (FILE_DOCKER.supportedTypes.image.includes(ext)) return 'ocr';

    return 'unknown';
}

function getFileIcon(moduleType) {
    const icons = {
        excel: 'fa-file-excel',
        pdf: 'fa-file-pdf',
        ocr: 'fa-image',
        viz: 'fa-chart-bar',
        unknown: 'fa-file'
    };
    return icons[moduleType] || icons.unknown;
}

function getFileColor(moduleType) {
    const colors = {
        excel: '#217346',
        pdf: '#d32f2f',
        ocr: '#7b1fa2',
        viz: '#1976d2',
        unknown: '#757575'
    };
    return colors[moduleType] || colors.unknown;
}

// =====================================================
// DOSYA EKLEME/ÇIKARMA
// =====================================================
function addFileToDocker(file) {
    if (FILE_DOCKER.files.length >= FILE_DOCKER.maxFiles) {
        showDockerNotification('Maksimum dosya sayısına ulaşıldı!', 'warning');
        return false;
    }

    const moduleType = getFileModuleType(file.name);

    if (moduleType === 'unknown') {
        showDockerNotification('Desteklenmeyen dosya formatı: ' + file.name, 'error');
        return false;
    }

    const fileEntry = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        moduleType: moduleType,
        addedAt: new Date().toISOString()
    };

    FILE_DOCKER.files.push(fileEntry);
    saveDockerState();
    renderDockerFiles();
    updateModuleBadges();
    updateSmartSuggestion();

    return true;
}

function removeFileFromDocker(fileId) {
    FILE_DOCKER.files = FILE_DOCKER.files.filter(f => f.id !== fileId);
    saveDockerState();
    renderDockerFiles();
    updateModuleBadges();
    updateSmartSuggestion();
}

function clearDocker() {
    FILE_DOCKER.files = [];
    saveDockerState();
    renderDockerFiles();
    updateModuleBadges();
    updateSmartSuggestion();
}

// =====================================================
// DOSYA FİLTRELEME
// =====================================================
function getFilesByType(moduleType) {
    return FILE_DOCKER.files.filter(f => f.moduleType === moduleType);
}

function getFileCount(moduleType) {
    if (!moduleType) return FILE_DOCKER.files.length;
    return getFilesByType(moduleType).length;
}

// =====================================================
// AKILLI YÖNLENDİRME
// =====================================================
function getSuggestedModule() {
    if (FILE_DOCKER.files.length === 0) return null;

    const counts = {
        excel: getFileCount('excel'),
        pdf: getFileCount('pdf'),
        ocr: getFileCount('ocr')
    };

    // En çok dosyası olan modülü öner
    const maxCount = Math.max(...Object.values(counts));
    if (maxCount === 0) return null;

    for (const [module, count] of Object.entries(counts)) {
        if (count === maxCount) {
            return module;
        }
    }

    return 'excel'; // Varsayılan
}

function updateSmartSuggestion() {
    const suggestionEl = document.getElementById('smartRouteSuggestion');
    const suggestionBtn = document.getElementById('suggestionBtn');
    const suggestionName = document.getElementById('suggestionModuleName');

    if (!suggestionEl) return;

    const suggested = getSuggestedModule();

    if (suggested && FILE_DOCKER.files.length > 0) {
        const moduleNames = {
            excel: 'Excel Studio',
            pdf: 'PDF Tools',
            ocr: 'OCR Lab',
            viz: 'Visual Studio'
        };

        suggestionEl.style.display = 'flex';
        suggestionName.textContent = moduleNames[suggested] || suggested;
        suggestionBtn.onclick = () => navigateToModule(suggested);
    } else {
        suggestionEl.style.display = 'none';
    }
}

// =====================================================
// UI RENDER
// =====================================================
function renderDockerFiles() {
    const listEl = document.getElementById('dockerFileList');
    const emptyEl = document.getElementById('dockerEmptyState');
    const clearBtn = document.getElementById('dockerClearBtn');

    if (!listEl) return;

    if (FILE_DOCKER.files.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'flex';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'inline-flex';

    listEl.innerHTML = FILE_DOCKER.files.map(f => `
        <div class="docker-file-chip" data-id="${f.id}" style="--chip-color: ${getFileColor(f.moduleType)}">
            <i class="fas ${getFileIcon(f.moduleType)}"></i>
            <span class="chip-name" title="${f.name}">${truncateFilename(f.name, 20)}</span>
            <span class="chip-size">${formatFileSize(f.size)}</span>
            <button class="chip-remove" onclick="removeFileFromDocker('${f.id}')" title="Kaldır">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function updateModuleBadges() {
    const modules = ['excel', 'viz', 'pdf', 'ocr'];

    modules.forEach(mod => {
        const badge = document.getElementById(mod + 'Badge');
        if (badge) {
            const count = getFileCount(mod === 'viz' ? 'excel' : mod);
            if (count > 0) {
                badge.style.display = 'flex';
                badge.querySelector('span:first-child').textContent = count;
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

// =====================================================
// STATE PERSISTENCE (sessionStorage)
// =====================================================
function saveDockerState() {
    // Dosya objelerini kaydedemeyiz, sadece metadata
    const metadata = FILE_DOCKER.files.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        moduleType: f.moduleType,
        addedAt: f.addedAt
    }));

    try {
        sessionStorage.setItem('opradox_docker_meta', JSON.stringify(metadata));
    } catch (e) {
        console.warn('Docker state kaydetme hatası:', e);
    }
}

function loadDockerState() {
    // Sayfa yenilenince File objeleri kaybolur, sadece metadata yüklenir
    // Gerçek dosyalar için tekrar sürükleme gerekir
    try {
        const saved = sessionStorage.getItem('opradox_docker_meta');
        if (saved) {
            // Sadece metadata göster, dosya yoktur
            console.log('Docker metadata yüklendi (dosyalar gerekirse tekrar sürüklenecek)');
        }
    } catch (e) {
        console.warn('Docker state yükleme hatası:', e);
    }
}

// =====================================================
// MODÜLE GEÇİŞ
// =====================================================
function navigateToModule(module) {
    const urls = {
        excel: 'excel.html',
        viz: 'viz.html',
        pdf: 'pdf.html',
        ocr: 'ocr.html'
    };

    const url = urls[module];
    if (url) {
        // Dosyaları sessionStorage'a kaydet (metadata olarak)
        saveDockerState();

        // Modül sayfasına git
        window.location.href = url;
    } else {
        showDockerNotification('Bu modül henüz hazır değil!', 'info');
    }
}

function transferFilesToModule() {
    // Modül sayfasında çağrılır - Docker'daki dosyaları modüle aktar
    return FILE_DOCKER.files;
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================
function truncateFilename(name, maxLen) {
    if (name.length <= maxLen) return name;
    const ext = name.split('.').pop();
    const base = name.slice(0, name.length - ext.length - 1);
    const available = maxLen - ext.length - 4; // "..." ve "." için
    return base.slice(0, available) + '...' + '.' + ext;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showDockerNotification(message, type = 'info') {
    // Basit bildirim - geliştirilebilir
    console.log(`[Docker ${type.toUpperCase()}]: ${message}`);

    // Toast notification varsa kullan
    if (typeof showToast === 'function') {
        showToast(message, type);
    }
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function initDockerEvents() {
    const dropZone = document.getElementById('dockerDropZone');
    const fileInput = document.getElementById('dockerFileInput');
    const clearBtn = document.getElementById('dockerClearBtn');

    if (!dropZone) return;

    // Tıklama ile dosya seçimi
    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('.chip-remove')) return;
        fileInput?.click();
    });

    // Dosya input değişikliği
    fileInput?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(f => addFileToDocker(f));
        e.target.value = '';
    });

    // Sürükle bırak
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        let addedCount = 0;

        files.forEach(f => {
            if (addFileToDocker(f)) addedCount++;
        });

        if (addedCount > 0) {
            showDockerNotification(`${addedCount} dosya eklendi`, 'success');
        }
    });

    // Temizle butonu
    clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Tüm dosyalar kaldırılsın mı?')) {
            clearDocker();
        }
    });
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📁 Docker başlatılıyor...');
    loadDockerState();
    initDockerEvents();
    renderDockerFiles();
    updateModuleBadges();
    updateSmartSuggestion();
});

// Global erişim için export
window.FILE_DOCKER = FILE_DOCKER;
window.addFileToDocker = addFileToDocker;
window.removeFileFromDocker = removeFileFromDocker;
window.clearDocker = clearDocker;
window.getFilesByType = getFilesByType;
window.navigateToModule = navigateToModule;
window.transferFilesToModule = transferFilesToModule;
