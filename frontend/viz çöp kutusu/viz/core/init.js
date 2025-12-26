// =====================================================
// INIT.JS - Initialization & Event Setup
// =====================================================

import { VIZ_STATE } from './state.js';
import { loadSavedLang, toggleLang, applyLocalization, getText, VIZ_TEXTS } from './i18n.js';
import { showToast } from './utils.js';

// Bu dosya, diğer modüller yüklendikten sonra çalıştırılacak
// Şimdilik placeholder - tam implementasyon bundle sırasında yapılacak

/**
 * DOMContentLoaded handler
 */
export function initVizStudio() {
    console.log('🎨 Visual Studio başlatıldı (Modular v2.0)');

    // Empty state kontrol
    if (typeof updateEmptyState === 'function') {
        updateEmptyState();
    }
}

/**
 * Tema yükleme
 */
export function loadSavedTheme() {
    const saved = localStorage.getItem('opradox_theme');
    if (saved === 'day') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
    }

    // Grafik temalarını güncelle
    if (typeof updateAllChartsTheme === 'function') {
        updateAllChartsTheme();
    }
}

/**
 * Tema değiştirme
 */
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

    // Logo güncelle
    const logo = document.getElementById('vizLogo');
    if (logo) {
        logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
    }

    // Toast göster
    showToast(getText('theme_changed', 'Tema değiştirildi'), 'success');

    // Grafik temalarını güncelle
    if (typeof updateAllChartsTheme === 'function') {
        updateAllChartsTheme();
    }
}

/**
 * Grafik temalarını günceller
 */
export function updateAllChartsTheme() {
    const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
    VIZ_STATE.charts.forEach(config => {
        const chartDom = document.getElementById(`${config.id}_chart`);
        if (chartDom) {
            const oldInstance = VIZ_STATE.echartsInstances[config.id];
            if (oldInstance) {
                oldInstance.dispose();
            }
            // renderChart modülden çağrılacak - bu şimdilik placeholder
            if (typeof renderChart === 'function') {
                renderChart(config);
            }
        }
    });
}

/**
 * Event listener kurulumu
 */
export function setupEventListeners() {
    // Theme & Language
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('langToggle')?.addEventListener('click', toggleLang);

    // File Input - viz_file_handler.js tarafından yönetiliyor
    // Duplicate event listener'ları önlemek için burada yorum satırı

    // Add Chart
    document.getElementById('addChartBtn')?.addEventListener('click', () => addChart('bar'));
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearDashboard);

    // Settings panel
    document.getElementById('closeSettingsBtn')?.addEventListener('click', hideSettings);
    document.getElementById('applySettingsBtn')?.addEventListener('click', applyChartSettings);
    document.getElementById('deleteChartBtn')?.addEventListener('click', deleteSelectedChart);

    // Color picker update
    document.getElementById('chartColor')?.addEventListener('input', (e) => {
        const preview = document.querySelector('.viz-color-preview');
        if (preview) preview.style.background = e.target.value;
    });

    // Save & Export buttons
    document.getElementById('saveBtn')?.addEventListener('click', showSaveMenu);
    document.getElementById('exportBtn')?.addEventListener('click', showExportMenu);

    // Stats overlay checkbox listeners
    ['showMeanLine', 'showMedianLine', 'showStdBand', 'showTrendLine'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (VIZ_STATE.selectedChart) {
                const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                if (config && typeof renderChart === 'function') {
                    console.log(`📊 Stats overlay güncellendi: ${id}`);
                    renderChart(config);
                }
            }
        });
    });
}

/**
 * Drag & Drop kurulumu
 */
export function setupDragAndDrop() {
    // Dosya drop zone - viz_file_handler.js tarafından yönetiliyor
    // Duplicate event listener'ları önlemek için burada yorum satırı

    // Chart type drag
    document.querySelectorAll('.viz-chart-type').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('chartType', el.dataset.type);
        });
    });

    // Dashboard drop
    const dashboard = document.getElementById('vizDashboardGrid');
    if (dashboard) {
        dashboard.addEventListener('dragover', (e) => {
            e.preventDefault();
            dashboard.classList.add('drag-over');
        });

        dashboard.addEventListener('dragleave', () => {
            dashboard.classList.remove('drag-over');
        });

        dashboard.addEventListener('drop', (e) => {
            e.preventDefault();
            dashboard.classList.remove('drag-over');

            const chartType = e.dataTransfer.getData('chartType');
            if (chartType && typeof addChart === 'function') {
                addChart(chartType);
            }
        });
    }
}

// Global erişim (geriye uyumluluk)
window.toggleTheme = toggleTheme;
window.initVizStudio = initVizStudio;
