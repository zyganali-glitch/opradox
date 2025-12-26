// =====================================================
// VIZ.BUNDLE.JS - Opradox Visual Studio (Modular v2.0)
// Bu dosya otomatik oluşturuldu - elle düzenlemeyin
// =====================================================

// =====================================================
// CORE/STATE.JS - Global State Management
// =====================================================

const VIZ_STATE = {
    // Multi-dataset yapısı
    datasets: {},           // { "dataset_1": { file, data, columns, columnsInfo, sheets, audit_log } }
    activeDatasetId: null,  // Aktif veri seti ID'si
    datasetCounter: 0,      // Dataset ID sayacı

    // Grafik yönetimi
    charts: [],             // Her grafik datasetId içerecek
    selectedChart: null,    // Şu an seçili grafik
    chartCounter: 0,        // Grafik ID sayacı

    // UI state
    lang: 'tr',             // Dil
    echartsInstances: {},   // ECharts instance'ları

    // Geriye uyumluluk için getter'lar (mevcut kod çalışmaya devam etsin)
    get file() { return this.getActiveFile(); },
    get data() { return this.getActiveData(); },
    get columns() { return this.getActiveColumns(); },
    get columnsInfo() { return this.getActiveColumnsInfo(); },
    get sheets() { return this.getActiveDataset()?.sheets || []; },

    // Setter'lar (mevcut kod çalışmaya devam etsin)
    set file(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].file = val; },
    set data(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].data = val; },
    set columns(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].columns = val; },
    set columnsInfo(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].columnsInfo = val; },
    set sheets(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].sheets = val; },

    // Yardımcı metodlar
    getActiveDataset() {
        return this.activeDatasetId ? this.datasets[this.activeDatasetId] : null;
    },
    getActiveData() {
        return this.getActiveDataset()?.data || null;
    },
    getActiveColumns() {
        return this.getActiveDataset()?.columns || [];
    },
    getActiveColumnsInfo() {
        return this.getActiveDataset()?.columnsInfo || [];
    },
    getActiveFile() {
        return this.getActiveDataset()?.file || null;
    },
    getDatasetById(id) {
        return this.datasets[id] || null;
    },
    addDataset(file, data, columns, columnsInfo, sheets = []) {
        const id = `dataset_${++this.datasetCounter}`;
        this.datasets[id] = {
            id, file, data, columns, columnsInfo, sheets,
            name: file?.name || id,
            audit_log: {} // { "column_name": { method, original_missing, filled, timestamp } }
        };
        this.activeDatasetId = id;
        console.log(`📁 Yeni dataset eklendi: ${id} (${file?.name})`);
        return id;
    },
    setActiveDataset(id) {
        if (this.datasets[id]) {
            this.activeDatasetId = id;
            console.log(`📁 Aktif dataset değişti: ${id}`);
            return true;
        }
        return false;
    },
    removeDataset(id) {
        if (this.datasets[id]) {
            delete this.datasets[id];
            if (this.activeDatasetId === id) {
                const keys = Object.keys(this.datasets);
                this.activeDatasetId = keys.length > 0 ? keys[0] : null;
            }
            return true;
        }
        return false;
    },
    getDatasetList() {
        return Object.values(this.datasets).map(d => ({ id: d.id, name: d.name, rowCount: d.data?.length || 0 }));
    }
};

// =====================================================
// CORE/UTILS.JS - Utility Functions
// =====================================================

/**
 * Sayıyı formatlar (binlik ayracı)
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}

/**
 * Debounce fonksiyonu
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Değerin sayısal olup olmadığını kontrol eder
 */
function isNumeric(val) {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(parseFloat(val)) && isFinite(val);
}

/**
 * Değeri sayıya çevirir
 */
function toNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

/**
 * Truncate text
 */
function truncate(str, length = 20) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Eksen etiketlerini truncate et
 */
function truncateAxisLabel(label, maxLength = 15) {
    if (!label) return '';
    const str = String(label);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * İstatistik hesaplama yardımcıları
 */
function calculateMean(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calculateMedian(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number).sort((a, b) => a - b);
    if (nums.length === 0) return null;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function calculateStdDev(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    if (nums.length < 2) return null;
    const mean = calculateMean(nums);
    const squareDiffs = nums.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / nums.length;
    return Math.sqrt(avgSquareDiff);
}

function calculateMin(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    return nums.length > 0 ? Math.min(...nums) : null;
}

function calculateMax(values) {
    const nums = values.filter(v => isNumeric(v)).map(Number);
    return nums.length > 0 ? Math.max(...nums) : null;
}

// =====================================================
// ORİJİNAL viz.js İÇERİĞİ BAŞLANGIÇ
// Aşağıdaki kod orijinal viz.js'ten gelecek
// =====================================================

console.log('📦 VIZ Bundle v2.0 - Modüler yapı hazır');

// Orijinal viz.js içeriği burada yüklenecek
// Şimdilik orijinal dosyayı include etmek için script tag kullanılacak
