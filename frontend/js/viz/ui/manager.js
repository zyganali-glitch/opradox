import { VIZ_STATE } from '../core/state.js';
import { VIZ_TEXTS, getText, toggleLang, loadSavedLang, applyLocalization } from '../core/i18n.js';
import { setupVizFileHandlers } from '../data/loader.js';
import { setupOverlayListeners } from '../stats/manager.js';
import { showToast } from '../core/utils.js';
import { showExportModal } from './export.js';
import { renderChart } from '../charts/engine.js';
import {
    addChart, clearDashboard, showSaveMenu, hideSettings,
    applyChartSettings, deleteSelectedChart, updateEmptyState
} from '../charts/manager.js';

// Exports at end


function initVizStudio() {
    console.log('ÄŸÅ¸ÂÂ¨ Visual Studio baÃ…Å¸latÃ„Â±ldÃ„Â± (Production v1.0)');
    updateEmptyState();
}

// -----------------------------------------------------
// THEME & LANGUAGE
// -----------------------------------------------------
function loadSavedTheme() {
    const saved = localStorage.getItem('opradox_theme');
    if (saved === 'day') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
    }
    updateAllChartsTheme();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
        // Dark moddan ÃƒÂ§Ã„Â±k, day moduna geÃƒÂ§
        document.body.classList.remove('dark-mode');
        document.body.classList.add('day-mode');
        localStorage.setItem('opradox_theme', 'day');
    } else {
        // Day moddan ÃƒÂ§Ã„Â±k, dark moduna geÃƒÂ§
        document.body.classList.remove('day-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('opradox_theme', 'dark');
    }

    // Logo gÃƒÂ¼ncelle
    const logo = document.getElementById('vizLogo');
    if (logo) {
        logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
    }

    // Toast gÃƒÂ¶ster
    showToast(getText('theme_changed', 'Tema deÃ„Å¸iÃ…Å¸tirildi'), 'success');

    // Grafik temalarÃ„Â±nÃ„Â± gÃƒÂ¼ncelle
    updateAllChartsTheme();
}


function updateAllChartsTheme() {
    const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
    VIZ_STATE.charts.forEach(config => {
        const chartDom = document.getElementById(`${config.id}_chart`);
        if (chartDom) {
            const oldInstance = VIZ_STATE.echartsInstances[config.id];
            if (oldInstance) {
                oldInstance.dispose();
            }
            renderChart(config);
        }
    });
}



// -----------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------
function setupEventListeners() {
    // Theme & Language
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('langToggle')?.addEventListener('click', () => {
        toggleLang();
        loadSavedLang(); // Update UI
    });

    // File Input - HANDLED BY data/loader.js setupVizFileHandlers()
    // lines 80-85 removed to avoid redundancy and ReferenceErrors

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
    document.getElementById('exportBtn')?.addEventListener('click', showExportModal);

    // Stats overlay checkbox listeners - checkbox deÃ„Å¸iÃ…Å¸tiÃ„Å¸inde grafiÃ„Å¸i yeniden render et
    ['showMeanLine', 'showMedianLine', 'showStdBand', 'showTrendLine'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (VIZ_STATE.selectedChart) {
                const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
                if (config) {
                    console.log(`ÄŸÅ¸â€œÅ  Stats overlay gÃƒÂ¼ncellendi: ${id}`);
                    renderChart(config);
                }
            }
        });
    });
}

// -----------------------------------------------------
// DRAG & DROP
// -----------------------------------------------------



// -----------------------------------------------------

// -----------------------------------------------------
// DRAG & DROP
// -----------------------------------------------------
function setupDragAndDrop() {
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
            if (chartType) {
                addChart(chartType);
            }
        });
    }
}

export { initVizStudio, loadSavedTheme, toggleTheme, updateAllChartsTheme, setupEventListeners, setupDragAndDrop };
