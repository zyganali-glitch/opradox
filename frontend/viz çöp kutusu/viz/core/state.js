// =====================================================
// STATE.JS - VIZ_STATE Global State Management
// =====================================================

/**
 * Global state objesi - Multi-Dataset desteği
 */
export const VIZ_STATE = {
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

// Global erişim için (geriye uyumluluk)
window.VIZ_STATE = VIZ_STATE;
