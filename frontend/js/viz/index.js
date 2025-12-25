// ===========================================
// Opradox Visual Studio - Modular Bundle Entry
// ===========================================

// Core
import { VIZ_STATE } from './core/state.js';
import * as Utils from './core/utils.js';
import * as I18n from './core/i18n.js';

// Data
import * as DataManager from './data/manager.js';
import * as DataLoader from './data/loader.js';

// Charts
import * as ChartEngine from './charts/engine.js';
import * as ChartManager from './charts/manager.js';

// Stats
import * as StatManager from './stats/manager.js';
import * as StatTests from './stats/tests.js';
import * as StatAnalysis from './stats/analysis.js';
import * as StatAnomalies from './stats/anomalies.js';

// UI
import * as UIManager from './ui/manager.js';
import * as UIModals from './ui/modals.js';
import * as UISidebar from './ui/sidebar.js';
import * as UIExport from './ui/export.js';

// Global exports for backward compatibility (inline HTML onclick handlers)
window.VIZ_STATE = VIZ_STATE;
Object.assign(window, Utils);
Object.assign(window, I18n);
Object.assign(window, DataManager);
Object.assign(window, DataLoader);
Object.assign(window, ChartManager); // addChart, etc.
Object.assign(window, ChartEngine); // renderChart (needed for stats override)
Object.assign(window, StatManager);
Object.assign(window, StatTests);
Object.assign(window, StatAnalysis);
Object.assign(window, StatAnomalies);
Object.assign(window, UIManager);
Object.assign(window, UIModals);
Object.assign(window, UISidebar);
Object.assign(window, UIExport);

// Initialization
// Export everything to VizModule
export * from './core/state.js';
export * from './core/utils.js';
export * from './core/i18n.js';
export * from './data/manager.js';
export * from './data/loader.js';
export * from './charts/engine.js';
export * from './charts/manager.js';
export * from './stats/manager.js';
export * from './stats/tests.js';
export * from './stats/analysis.js';
export * from './stats/anomalies.js';
export * from './ui/manager.js';
export * from './ui/modals.js';
export * from './ui/sidebar.js';
export * from './ui/export.js';

// Initialization Logic
function initApp() {
    console.log('🚀 Viz Studio Bundle Initializing...');

    try {
        UIManager.initVizStudio();
        UIManager.loadSavedTheme();
        I18n.loadSavedLang();
        UIManager.setupEventListeners();

        // Setup Drag & Drop (Dashboard)
        if (UIManager.setupDragAndDrop) UIManager.setupDragAndDrop();

        // Attempt to load dashboard if exists
        if (ChartManager.loadDashboardFromStorage) {
            ChartManager.loadDashboardFromStorage();
        }

        // File handler setup
        console.log('📂 Calling setupVizFileHandlers...');
        DataLoader.setupVizFileHandlers();

        // Hub file transfer check
        if (window.loadFilesFromHub) {
            setTimeout(window.loadFilesFromHub, 500);
        }

        // Anomaly/CrossFilter/WhatIf listeners
        if (StatManager.setupBIListeners) StatManager.setupBIListeners();
        if (StatManager.setupOverlayListeners) StatManager.setupOverlayListeners();
        if (StatManager.setupSPSSListeners) StatManager.setupSPSSListeners();

        console.log('✅ Bundle Loaded. VIZ_STATE:', VIZ_STATE);

    } catch (err) {
        console.error('❌ Init Error:', err);
    }
}

// Auto-start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
