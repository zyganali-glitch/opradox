// =====================================================
// CORE.JS - Opradox Visual Studio Core Module
// VIZ_STATE, VIZ_TEXTS, Init, Theme, Language
// =====================================================

import { VIZ_TEXTS } from './texts.js';

// -----------------------------------------------------
// GLOBAL STATE - Multi-Dataset Desteği
// -----------------------------------------------------
export const VIZ_STATE = {
    datasets: {},
    activeDatasetId: null,
    datasetCounter: 0,
    charts: [],
    selectedChart: null,
    chartCounter: 0,
    lang: 'tr',
    echartsInstances: {},
    // Undo/Redo History
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    isUndoing: false,

    // FAZ-4B: Academic Change Log
    changeLog: [],

    // FAZ-ADV-5: Feature Flags (Optional Advanced Features)
    enableCox: false,  // Cox Proportional Hazards Regression

    get file() { return this.getActiveFile(); },
    get data() { return this.getActiveData(); },
    get columns() { return this.getActiveColumns(); },
    get columnsInfo() { return this.getActiveColumnsInfo(); },
    get sheets() { return this.getActiveDataset()?.sheets || []; },

    set file(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].file = val; },
    set data(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].data = val; },
    set columns(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].columns = val; },
    set columnsInfo(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].columnsInfo = val; },
    set sheets(val) { if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].sheets = val; },

    getActiveDataset() { return this.activeDatasetId ? this.datasets[this.activeDatasetId] : null; },
    getActiveData() { return this.getActiveDataset()?.data || null; },
    getActiveColumns() { return this.getActiveDataset()?.columns || []; },
    getActiveColumnsInfo() { return this.getActiveDataset()?.columnsInfo || []; },
    getActiveFile() { return this.getActiveDataset()?.file || null; },
    getDatasetById(id) { return this.datasets[id] || null; },
    addDataset(file, data, columns, columnsInfo, sheets = []) {
        const id = `dataset_${++this.datasetCounter}`;
        this.datasets[id] = { id, file, data, columns, columnsInfo, sheets, name: file?.name || id, audit_log: [] };
        this.activeDatasetId = id;
        console.log(`📁 Yeni dataset eklendi: ${id} (${file?.name})`);
        return id;
    },
    setActiveDataset(id) {
        if (this.datasets[id]) { this.activeDatasetId = id; console.log(`📁 Aktif dataset değişti: ${id}`); return true; }
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
    getDatasetList() { return Object.values(this.datasets).map(d => ({ id: d.id, name: d.name, rowCount: d.data?.length || 0 })); }
};

/**
 * FAZ-4: Central Data Pipeline Broadcast
 * Single source of truth for updating all UI components after data changes.
 * @param {object} options - { source: 'transform'|'filter'|'load', type: string, log: string }
 */
/**
 * FAZ-4: Central Data Pipeline Broadcast
 * Single source of truth for updating all UI components after data changes.
 * FAZ-7: Performance optimized (Staggered updates)
 * @param {object} options - { source: 'transform'|'filter'|'load', type: string, log: string }
 */
export function broadcastDataChange(options = {}) {
    console.log('📡 broadcastDataChange:', options);

    // 1. Log to Academic History
    if (options.log) {
        const entry = {
            timestamp: new Date().toISOString(),
            source: options.source || 'unknown',
            type: options.type || 'modification',
            note: options.log
        };
        VIZ_STATE.changeLog.push(entry);
        // Also log to active dataset's specific audit log if exists
        const ds = VIZ_STATE.getActiveDataset();
        if (ds) {
            if (!ds.audit_log) ds.audit_log = [];
            ds.audit_log.push(entry);
        }
    }

    // 2. Update Core UI
    if (typeof window.renderColumnsList === 'function') window.renderColumnsList(); // data.js
    if (typeof window.updateDropdowns === 'function') window.updateDropdowns(); // data.js
    if (typeof window.updateDataProfile === 'function') window.updateDataProfile(); // data.js

    // 3. Rerender All Charts (FAZ-7: Staggered)
    if (VIZ_STATE.charts && VIZ_STATE.charts.length > 0) {
        if (typeof window.renderChart === 'function') {
            // Determine stagger delay based on data size
            const rowCount = VIZ_STATE.data ? VIZ_STATE.data.length : 0;
            const staggerDelay = rowCount > 20000 ? 300 : (rowCount > 5000 ? 100 : 20);

            if (rowCount > 5000) {
                console.log(`🚀 Performance Mode: Staggering updates (${staggerDelay}ms delay)`);
                if (typeof showToast === 'function') showToast('Görselleştirmeler güncelleniyor...', 'info');
            }

            VIZ_STATE.charts.forEach((config, index) => {
                setTimeout(() => {
                    try {
                        window.renderChart(config);
                    } catch (e) {
                        console.warn(`Chart update failed for ${config.id}:`, e);
                    }
                }, index * staggerDelay);
            });
        }
    }

    // 4. Refresh All Stat Widgets
    if (typeof window.refreshAllStatWidgets === 'function') {
        // Wait for charts to start updating
        setTimeout(() => window.refreshAllStatWidgets(), 500);
    }

    // 5. User Feedback
    if (options.log && typeof showToast === 'function') {
        // Toast type: load=success, diğer durumlar=info
        const toastType = options.source === 'load' ? 'success' : 'info';
        showToast(options.log, toastType);
    }
}

/**
 * FAZ-7: Global Debounce Utility
 */
export function debounce(func, wait) {
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

// Global erişim
window.VIZ_STATE = VIZ_STATE;
window.broadcastDataChange = broadcastDataChange;
window.VIZ_TEXTS = VIZ_TEXTS;
export { VIZ_TEXTS };

// -----------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------
export function initVizStudio() {
    // FAZ-3: Duplicate load guard
    if (window.__VIZ_STUDIO_INITIALIZED__) {
        console.warn('⚠️ initVizStudio already called, skipping duplicate initialization');
        return;
    }
    window.__VIZ_STUDIO_INITIALIZED__ = true;

    console.log('🎨 Visual Studio başlatıldı (Production v1.0)');
    injectCoreStyles();

    // CRITICAL: Initialize all event listeners for buttons to work
    setupEventListeners();
    setupDragAndDrop();
    setupKeyboardShortcuts();

    // Load saved preferences
    loadSavedTheme();
    loadSavedLang();

    // CRITICAL: Initialize stat buttons (click + drag-drop)
    // Wait for DOM to be fully ready
    setTimeout(() => {
        setupStatButtonListeners();
        if (typeof window.initStatDragDropSystem === 'function') {
            window.initStatDragDropSystem();
            console.log('📊 Stat drag-drop system initialized');
        }
    }, 100);

    if (typeof updateEmptyState === 'function') updateEmptyState();
    console.log('✅ Tüm event listener\'lar yüklendi');
}

/**
 * Setup click listeners for stat buttons in left panel
 */
function setupStatButtonListeners() {
    const statButtons = document.querySelectorAll('.viz-stat-btn, .viz-stat-draggable, [data-stat-type]');

    if (statButtons.length === 0) {
        console.warn('No stat buttons found');
        return;
    }

    console.log(`📊 Setting up ${statButtons.length} stat button listeners`);

    statButtons.forEach(btn => {
        const statType = btn.dataset.statType || btn.dataset.type || btn.getAttribute('data-stat-type');
        if (!statType) return;

        // Add click listener (don't duplicate if already has onclick)
        if (!btn.onclick) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                console.log(`📊 Stat button clicked: ${statType}`);

                // Call createStatWidget if available
                if (typeof window.createStatWidget === 'function') {
                    window.createStatWidget(statType);
                } else {
                    console.error('createStatWidget function not found');
                    if (typeof showToast === 'function') {
                        showToast(`Stat modülü yüklenemedi: ${statType}`, 'error');
                    }
                }
            });
        }
    });
}

// -----------------------------------------------------
// THEME & LANGUAGE
// -----------------------------------------------------
export function loadSavedTheme() {
    const saved = localStorage.getItem('opradox_theme');
    // FAZ-THEME-2: Guarantee XOR state - remove BOTH classes first, then add only one
    document.body.classList.remove('dark-mode', 'day-mode');
    if (saved === 'day') {
        document.body.classList.add('day-mode');
    } else {
        // Default to dark mode
        document.body.classList.add('dark-mode');
    }
    if (typeof updateAllChartsTheme === 'function') updateAllChartsTheme();
}

export function loadSavedLang() {
    const saved = localStorage.getItem('opradox_lang') || 'tr';
    VIZ_STATE.lang = saved;
    updateLangLabel();
    applyLocalization();
}

export function getText(key, fallback = '') {
    const texts = VIZ_TEXTS[VIZ_STATE.lang] || VIZ_TEXTS.tr;
    return texts[key] || VIZ_TEXTS.tr[key] || fallback || key;
}

export function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
        localStorage.setItem('opradox_theme', 'day');
    } else {
        document.body.classList.remove('day-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('opradox_theme', 'dark');
    }
    const logo = document.getElementById('vizLogo');
    if (logo) logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
    if (typeof showToast === 'function') showToast(getText('theme_changed', 'Tema değiştirildi'), 'success');
    if (typeof updateAllChartsTheme === 'function') updateAllChartsTheme();
}

export function toggleLang() {
    VIZ_STATE.lang = VIZ_STATE.lang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('opradox_lang', VIZ_STATE.lang);
    updateLangLabel();
    applyLocalization();
}

function updateLangLabel() {
    const label = document.getElementById('langLabel');
    if (label) label.textContent = VIZ_STATE.lang === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 En | Tr';
}

function applyLocalization() {
    const texts = VIZ_TEXTS[VIZ_STATE.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) el.textContent = texts[key];
    });
}

// -----------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------
// -----------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------
export function setupEventListeners() {
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('langToggle')?.addEventListener('click', toggleLang);
    document.getElementById('vizFileInput')?.addEventListener('change', (e) => {
        if (typeof window.handleFileSelect === 'function') window.handleFileSelect(e);
    });
    document.getElementById('vizFileRemove')?.addEventListener('click', () => {
        if (typeof window.clearData === 'function') window.clearData();
    });
    document.getElementById('loadDataBtn')?.addEventListener('click', () => {
        document.getElementById('vizFileInput')?.click();
    });
    document.getElementById('addChartBtn')?.addEventListener('click', () => {
        if (typeof window.addChart === 'function') window.addChart('bar');
    });
    document.getElementById('clearCanvasBtn')?.addEventListener('click', () => {
        if (typeof window.clearDashboard === 'function') window.clearDashboard();
    });
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
        if (typeof window.hideSettings === 'function') window.hideSettings();
    });
    document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
        if (typeof window.applyChartSettings === 'function') window.applyChartSettings();
    });
    document.getElementById('deleteChartBtn')?.addEventListener('click', () => {
        if (typeof window.deleteSelectedChart === 'function') window.deleteSelectedChart();
    });
    document.getElementById('chartColor')?.addEventListener('input', (e) => {
        const preview = document.querySelector('.viz-color-preview');
        if (preview) preview.style.background = e.target.value;
    });
    document.getElementById('saveBtn')?.addEventListener('click', () => {
        if (typeof window.showSaveMenu === 'function') window.showSaveMenu();
    });
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        if (typeof window.showExportMenu === 'function') window.showExportMenu();
    });
    ['showMeanLine', 'showMedianLine', 'showStdBand', 'showTrendLine'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (VIZ_STATE.selectedChart && typeof window.renderChart === 'function') {
                const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                if (config) window.renderChart(config);
            }
        });
    });
}

// -----------------------------------------------------
// DRAG & DROP
// -----------------------------------------------------
export function setupDragAndDrop() {
    const dropZone = document.getElementById('vizDropZone');
    if (dropZone) {
        dropZone.addEventListener('click', () => document.getElementById('vizFileInput')?.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    }
    document.querySelectorAll('.viz-chart-type').forEach(el => {
        el.addEventListener('dragstart', (e) => e.dataTransfer.setData('chartType', el.dataset.type));
    });
    const dashboard = document.getElementById('vizDashboardGrid');
    if (dashboard) {
        dashboard.addEventListener('dragover', (e) => { e.preventDefault(); dashboard.classList.add('drag-over'); });
        dashboard.addEventListener('dragleave', () => dashboard.classList.remove('drag-over'));
        dashboard.addEventListener('drop', (e) => {
            e.preventDefault();
            dashboard.classList.remove('drag-over');
            const chartType = e.dataTransfer.getData('chartType');
            if (chartType && typeof window.addChart === 'function') window.addChart(chartType);
        });
    }
}

// -----------------------------------------------------
// KEYBOARD SHORTCUTS
// -----------------------------------------------------
export function setupKeyboardShortcuts() {
    if (typeof Mousetrap !== 'undefined') {
        Mousetrap.bind('ctrl+k', (e) => { e.preventDefault(); if (typeof window.toggleCommandPalette === 'function') window.toggleCommandPalette(); });
        Mousetrap.bind('ctrl+s', (e) => { e.preventDefault(); if (typeof window.saveDashboard === 'function') window.saveDashboard(); });
        Mousetrap.bind('delete', () => { if (typeof window.deleteSelectedChart === 'function') window.deleteSelectedChart(); });
        Mousetrap.bind('ctrl+e', (e) => { e.preventDefault(); if (typeof window.exportPNG === 'function') window.exportPNG(); });
        Mousetrap.bind('f11', (e) => { e.preventDefault(); if (typeof window.toggleFullscreen === 'function') window.toggleFullscreen(); });
        Mousetrap.bind('ctrl+d', (e) => { e.preventDefault(); toggleTheme(); });
        Mousetrap.bind('?', () => { if (typeof window.showShortcuts === 'function') window.showShortcuts(); });
    }
}

// -----------------------------------------------------
// SERVICE WORKER - FAZ-KONSOL-3: Single entry point
// Delegates to adapters.js/createServiceWorker for full PWA support
// -----------------------------------------------------
export function registerServiceWorker() {
    // Guard: check if already registered (flag owned by createServiceWorker)
    if (window.__SW_REGISTERED__) {
        console.log('⚠️ Service Worker already registered, skipping');
        return;
    }

    if ('serviceWorker' in navigator) {
        // Prefer full implementation from adapters.js if available
        if (typeof window.createServiceWorker === 'function') {
            // Delegate to adapters.js - IT will set the flag
            window.createServiceWorker().catch(err => {
                console.warn('SW registration delegated call failed:', err);
            });
        } else {
            // Fallback: direct registration - WE own the flag here
            window.__SW_REGISTERED__ = true;
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('✅ Service Worker registered (scope: /)'))
                .catch(err => console.warn('SW registration failed:', err));
        }
    }
}

// -----------------------------------------------------
// INDEXEDDB STORAGE (From viz_SOURCE.js:4469-4523)
// Persistent local storage for datasets and dashboards
// -----------------------------------------------------
const DB_NAME = 'OpradoxVizDB';
const DB_VERSION = 1;
let vizDB = null;

export function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            vizDB = request.result;
            console.log('📀 IndexedDB hazır');
            resolve(vizDB);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('datasets')) {
                db.createObjectStore('datasets', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('dashboards')) {
                db.createObjectStore('dashboards', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

export async function saveToIndexedDB(storeName, data) {
    if (!vizDB) await initIndexedDB();

    return new Promise((resolve, reject) => {
        const tx = vizDB.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add({ ...data, timestamp: Date.now() });

        request.onsuccess = () => {
            if (typeof showToast === 'function') showToast('Veri IndexedDB\'ye kaydedildi', 'success');
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function loadFromIndexedDB(storeName) {
    if (!vizDB) await initIndexedDB();

    return new Promise((resolve, reject) => {
        const tx = vizDB.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// -----------------------------------------------------
// INJECT CORE STYLES (from viz_SOURCE.js end)
// -----------------------------------------------------
function injectCoreStyles() {
    const style = document.createElement('style');
    style.id = 'viz-core-styles';
    style.textContent = `
        .viz-stat-audit-footer, .viz-chart-audit-footer { font-size: 0.75rem; color: var(--text-muted, #888); padding: 8px 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1)); background: var(--bg-subtle, rgba(0,0,0,0.1)); border-radius: 0 0 8px 8px; margin-top: auto; }
        .viz-stat-audit-footer i, .viz-chart-audit-footer i { margin-right: 6px; opacity: 0.8; }
        .viz-stat-widget.apa-mode, .viz-chart-widget.apa-mode { background: #FFFFFF !important; color: #000000 !important; font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important; border-radius: 0 !important; box-shadow: none !important; border: 1px solid #000 !important; }
        .viz-stat-widget.apa-mode .viz-widget-header, .viz-stat-widget.apa-mode .viz-stat-params { display: none !important; }
        .viz-stat-widget.apa-mode .viz-stat-table { border-collapse: collapse; width: 100%; }
        .viz-stat-widget.apa-mode .viz-stat-table th, .viz-stat-widget.apa-mode .viz-stat-table td { border: none; border-bottom: 1px solid #000; padding: 4px 8px; text-align: left; }
        .viz-stat-widget.apa-mode .viz-stat-table thead tr { border-bottom: 2px solid #000; }
        .viz-stat-widget.apa-mode .viz-stat-audit-footer { background: transparent; border-top: 1px solid #000; color: #666; font-style: italic; }
        .viz-copy-btn { padding: 4px 8px; font-size: 0.75rem; background: var(--bg-card, #2a2a3e); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); color: var(--text-primary, #fff); border-radius: 4px; cursor: pointer; transition: all 0.2s ease; }
        .viz-copy-btn:hover { background: var(--primary, #4a90d9); }
        .viz-mode-toggle { padding: 4px 8px; font-size: 0.7rem; background: transparent; border: 1px solid var(--border-color, rgba(255,255,255,0.2)); color: var(--text-muted, #888); border-radius: 4px; cursor: pointer; transition: all 0.2s ease; }
        .viz-mode-toggle:hover { border-color: var(--primary, #4a90d9); color: var(--primary, #4a90d9); }
        .viz-stat-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.05)); }
        .viz-stat-row span { color: var(--text-muted, #888); font-size: 0.85rem; min-width: 120px; }
        .viz-stat-row strong { color: var(--text-primary, #fff); font-size: 0.9rem; }
        .viz-stat-metrics { display: flex; flex-wrap: wrap; gap: 10px; padding: 10px 0; }
        .viz-stat-metric { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--bg-subtle, rgba(0,0,0,0.2)); border-radius: 6px; }
        .viz-stat-metric span { font-weight: bold; color: var(--text-muted, #888); font-size: 0.8rem; }
        .viz-stat-metric strong { color: var(--text-primary, #fff); font-size: 0.9rem; }
        .viz-stat-metric.significant { background: rgba(46, 204, 113, 0.2); border: 1px solid rgba(46, 204, 113, 0.4); }
        .viz-stat-metric.significant span, .viz-stat-metric.significant strong { color: #2ecc71; }
        .viz-stat-groups { display: flex; flex-wrap: wrap; gap: 12px; padding: 10px 0; }
        .viz-stat-group-card { flex: 1; min-width: 120px; max-width: 200px; padding: 10px; background: var(--bg-subtle, rgba(0,0,0,0.2)); border-radius: 8px; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); }
        .viz-stat-group-name { font-weight: bold; color: var(--text-primary, #fff); margin-bottom: 6px; font-size: 0.85rem; }
        .viz-stat-group-stats { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.75rem; color: var(--text-muted, #888); }
        .viz-stat-group-stats span { background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; }
        .viz-group-selector-title { font-size: 0.75rem !important; font-weight: 600; color: var(--text-muted, #888); margin: 10px 0 6px 0; padding: 6px 10px; border-radius: 6px; background: var(--bg-subtle, rgba(255,255,255,0.03)); display: flex; align-items: center; gap: 8px; }
        .viz-group-selector-title i { font-size: 0.7rem; opacity: 0.8; color: var(--primary, #4a90d9); }
        .viz-group-selectors-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .viz-group-selectors-row .viz-param-group { flex: 1; min-width: 100px; }
        .viz-group-selectors-row label { font-size: 0.7rem !important; color: var(--text-muted, #888); }
        body:not(.dark-mode) .viz-mode-toggle, body:not(.dark-mode) .viz-formula-btn { background: #f8f9fa; border: 1px solid #dee2e6; color: #495057; }
        body:not(.dark-mode) .viz-copy-btn { background: #f8f9fa; border: 1px solid #dee2e6; color: #495057; }
        body:not(.dark-mode) .viz-copy-btn:hover { background: #4a90d9; color: #fff; }
        body:not(.dark-mode) .viz-stat-metric { background: #f8f9fa; border: 1px solid #e9ecef; }
        body:not(.dark-mode) .viz-stat-metric span { color: #6c757d; }
        body:not(.dark-mode) .viz-stat-metric strong { color: #212529; }
        body:not(.dark-mode) .viz-stat-group-card { background: #fff; border: 1px solid #e9ecef; }
        body:not(.dark-mode) .viz-stat-group-name { color: #212529; }
        body:not(.dark-mode) .viz-stat-group-stats { color: #6c757d; }
        body:not(.dark-mode) .viz-stat-group-stats span { background: #f1f3f4; }
        body:not(.dark-mode) .viz-stat-row { border-bottom-color: #e9ecef; }
        body:not(.dark-mode) .viz-stat-row span { color: #6c757d; }
        body:not(.dark-mode) .viz-stat-row strong { color: #212529; }
        body:not(.dark-mode) .viz-group-selector-title { background: #f8f9fa; color: #6c757d; border: 1px solid #e9ecef; }
        body:not(.dark-mode) .viz-group-selectors-row label { color: #6c757d; }
        body:not(.dark-mode) .viz-stat-audit-footer, body:not(.dark-mode) .viz-chart-audit-footer { background: #f8f9fa; border-top: 1px solid #e9ecef; color: #6c757d; }
    `;
    if (!document.getElementById('viz-core-styles')) document.head.appendChild(style);
}

// -----------------------------------------------------
// UNDO / REDO SYSTEM
// -----------------------------------------------------
export function saveState(action = 'unknown') {
    // Don't save during undo/redo operations
    if (VIZ_STATE.isUndoing) return;

    // Create a deep snapshot of current state
    const snapshot = {
        timestamp: Date.now(),
        action: action,
        data: {
            datasets: JSON.parse(JSON.stringify(VIZ_STATE.datasets)),
            activeDatasetId: VIZ_STATE.activeDatasetId,
            charts: JSON.parse(JSON.stringify(VIZ_STATE.charts)),
            selectedChart: VIZ_STATE.selectedChart,
            chartCounter: VIZ_STATE.chartCounter,
            datasetCounter: VIZ_STATE.datasetCounter
        }
    };

    // If we're not at the end of history, remove future states
    if (VIZ_STATE.historyIndex < VIZ_STATE.history.length - 1) {
        VIZ_STATE.history = VIZ_STATE.history.slice(0, VIZ_STATE.historyIndex + 1);
    }

    // Add new snapshot
    VIZ_STATE.history.push(snapshot);
    VIZ_STATE.historyIndex = VIZ_STATE.history.length - 1;

    // Limit history size
    if (VIZ_STATE.history.length > VIZ_STATE.maxHistory) {
        VIZ_STATE.history.shift();
        VIZ_STATE.historyIndex--;
    }

    console.log(`📝 State saved: "${action}" (${VIZ_STATE.historyIndex + 1}/${VIZ_STATE.history.length})`);
}

export function undo() {
    if (VIZ_STATE.historyIndex <= 0) {
        if (typeof showToast === 'function') showToast('Geri alınacak işlem yok', 'info');
        return false;
    }

    VIZ_STATE.isUndoing = true;
    VIZ_STATE.historyIndex--;
    const snapshot = VIZ_STATE.history[VIZ_STATE.historyIndex];

    if (snapshot && snapshot.data) {
        restoreState(snapshot.data);
        console.log(`⏪ Undo: "${snapshot.action}" (${VIZ_STATE.historyIndex + 1}/${VIZ_STATE.history.length})`);
        if (typeof showToast === 'function') showToast(`Geri alındı: ${snapshot.action}`, 'info');
    }

    VIZ_STATE.isUndoing = false;
    return true;
}

export function redo() {
    if (VIZ_STATE.historyIndex >= VIZ_STATE.history.length - 1) {
        if (typeof showToast === 'function') showToast('Yinelenecek işlem yok', 'info');
        return false;
    }

    VIZ_STATE.isUndoing = true;
    VIZ_STATE.historyIndex++;
    const snapshot = VIZ_STATE.history[VIZ_STATE.historyIndex];

    if (snapshot && snapshot.data) {
        restoreState(snapshot.data);
        console.log(`⏩ Redo: "${snapshot.action}" (${VIZ_STATE.historyIndex + 1}/${VIZ_STATE.history.length})`);
        if (typeof showToast === 'function') showToast(`Yeniden yapıldı: ${snapshot.action}`, 'info');
    }

    VIZ_STATE.isUndoing = false;
    return true;
}

function restoreState(data) {
    VIZ_STATE.datasets = JSON.parse(JSON.stringify(data.datasets));
    VIZ_STATE.activeDatasetId = data.activeDatasetId;
    VIZ_STATE.charts = JSON.parse(JSON.stringify(data.charts));
    VIZ_STATE.selectedChart = data.selectedChart;
    VIZ_STATE.chartCounter = data.chartCounter;
    VIZ_STATE.datasetCounter = data.datasetCounter;

    // Re-render UI if functions available
    if (typeof rerenderAllCharts === 'function') rerenderAllCharts();
    if (typeof updateDataProfile === 'function') updateDataProfile();
    if (typeof updateEmptyState === 'function') updateEmptyState();
}

export function canUndo() {
    return VIZ_STATE.historyIndex > 0;
}

export function canRedo() {
    return VIZ_STATE.historyIndex < VIZ_STATE.history.length - 1;
}

export function clearHistory() {
    VIZ_STATE.history = [];
    VIZ_STATE.historyIndex = -1;
    console.log('🗑️ History cleared');
}


// -----------------------------------------------------
// WINDOW BINDINGS (HTML onclick için)
// -----------------------------------------------------
window.initVizStudio = initVizStudio;
window.loadSavedTheme = loadSavedTheme;
window.loadSavedLang = loadSavedLang;
window.getText = getText;
window.toggleTheme = toggleTheme;
window.toggleLang = toggleLang;
window.setupEventListeners = setupEventListeners;
window.setupDragAndDrop = setupDragAndDrop;
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
window.registerServiceWorker = registerServiceWorker;
// Undo/Redo
window.saveState = saveState;
window.undo = undo;
window.redo = redo;
window.canUndo = canUndo;
window.canRedo = canRedo;
window.clearHistory = clearHistory;

// IndexedDB
window.initIndexedDB = initIndexedDB;
window.saveToIndexedDB = saveToIndexedDB;
window.loadFromIndexedDB = loadFromIndexedDB;

console.log('✅ core.js module loaded (with IndexedDB)');

