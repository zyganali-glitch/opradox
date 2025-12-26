/**
 * viz-init.js
 * Visual Studio Initialization, Theme & Language Management
 * DOMContentLoaded entry point + event setup
 */

(function () {
    'use strict';

    // -----------------------------------------------------
    // INITIALIZATION
    // -----------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        initVizStudio();
        loadSavedTheme();
        loadSavedLang();
        setupEventListeners();
        setupDragAndDrop();
        loadDashboardFromStorage();

        // Initialize stat button drag-drop system (23 stat types)
        if (typeof initStatDragDropSystem === 'function') {
            initStatDragDropSystem();
        }
    });

    function initVizStudio() {
        console.log('Visual Studio baslatildi (Production v1.0)');
        if (typeof updateEmptyState === 'function') {
            updateEmptyState();
        }

        // --- INITIALIZE STAT DRAG-DROP SYSTEM ---
        if (typeof initStatDragDropSystem === 'function') {
            initStatDragDropSystem();
            console.log('✅ Stat Drag-Drop initialized');
        }

        // --- OPRADOX SWITCHBOARD (Event Delegation) ---
        document.body.addEventListener('click', function (e) {
            const target = e.target.closest('[data-stat-type]');
            if (!target) return;

            const statType = target.getAttribute('data-stat-type');
            console.log('🔘 Stat Click:', statType);

            // Widget-based stats (add to dashboard as widget)
            const widgetTypes = ['ttest', 't-test', 'anova', 'chi-square', 'correlation', 'normality', 'descriptive', 'mann-whitney', 'wilcoxon', 'kruskal', 'levene', 'effect-size', 'frequency'];

            // Modal-based stats (open modal dialog)
            const modalMap = {
                'pca': window.showPCAModal,
                'kmeans': window.showClusterModal,
                'cronbach': window.showCronbachModal,
                'logistic': window.showLogisticModal,
                'timeseries': window.showTimeSeriesModal,
                'apa': window.showAPAModal,
                'friedman': window.showFriedmanModal,
                'power': window.showPowerAnalysisModal,
                'regression-coef': window.showRegressionCoefModal,
                'discriminant': window.showDiscriminantModal,
                'survival': window.showSurvivalModal
            };

            // First check if it's a widget type
            if (widgetTypes.includes(statType) && typeof window.addStatWidget === 'function') {
                console.log('📊 Adding stat widget:', statType);
                window.addStatWidget(statType);
                return;
            }

            // Then check modal-based types
            if (modalMap[statType] && typeof modalMap[statType] === 'function') {
                console.log('📋 Opening modal:', statType);
                modalMap[statType]();
                return;
            }

            // Fallback: Try individual run function
            const fnName = 'run' + statType.charAt(0).toUpperCase() + statType.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            if (typeof window[fnName] === 'function') {
                console.log('⚙️ Running function:', fnName);
                window[fnName]();
            } else {
                console.warn('⚠️ No handler for:', statType);
            }
        });
        console.log('✅ Opradox Switchboard initialized');
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
        if (typeof updateAllChartsTheme === 'function') {
            updateAllChartsTheme();
        }
    }

    function loadSavedLang() {
        const saved = localStorage.getItem('opradox_lang') || 'tr';
        if (window.VIZ_STATE) {
            window.VIZ_STATE.lang = saved;
        }
        updateLangLabel();
        applyLocalization();
    }

    function toggleTheme() {
        const isDark = document.body.classList.contains('dark-mode');

        if (isDark) {
            // Dark moddan cik, day moduna gec
            document.body.classList.remove('dark-mode');
            document.body.classList.add('day-mode');
            localStorage.setItem('opradox_theme', 'day');
        } else {
            // Day moddan cik, dark moduna gec
            document.body.classList.remove('day-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('opradox_theme', 'dark');
        }

        // Logo guncelle
        const logo = document.getElementById('vizLogo');
        if (logo) {
            logo.src = isDark ? 'img/opradox_logo_light.png?v=5' : 'img/opradox_logo_dark.png?v=5';
        }

        // Toast goster
        if (typeof showToast === 'function' && typeof getText === 'function') {
            showToast(getText('theme_changed', 'Tema degistirildi'), 'success');
        }

        // Grafik temalarini guncelle
        if (typeof updateAllChartsTheme === 'function') {
            updateAllChartsTheme();
        }
    }

    function updateAllChartsTheme() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const theme = document.body.classList.contains('day-mode') ? 'light' : 'dark';
        state.charts.forEach(config => {
            const chartDom = document.getElementById(`${config.id}_chart`);
            if (chartDom) {
                const oldInstance = state.echartsInstances[config.id];
                if (oldInstance) {
                    oldInstance.dispose();
                }
                if (typeof renderChart === 'function') {
                    renderChart(config);
                }
            }
        });
    }

    function toggleLang() {
        const state = window.VIZ_STATE;
        if (!state) return;

        state.lang = state.lang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('opradox_lang', state.lang);
        updateLangLabel();
        applyLocalization();
    }

    function updateLangLabel() {
        const state = window.VIZ_STATE;
        const label = document.getElementById('langLabel');
        if (label && state) {
            label.textContent = state.lang === 'tr' ? 'TR | En' : 'EN | Tr';
        }
    }

    function applyLocalization() {
        const texts = window.VIZ_TEXTS ? window.VIZ_TEXTS[window.VIZ_STATE?.lang || 'tr'] : {};
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (texts && texts[key]) {
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

        // File Input - viz_file_handler.js tarafından yönetiliyor
        // Duplicate event listener'ları önlemek için burada yorum satırı

        // Add Chart
        document.getElementById('addChartBtn')?.addEventListener('click', () => {
            if (typeof addChart === 'function') {
                addChart('bar');
            }
        });
        document.getElementById('clearCanvasBtn')?.addEventListener('click', () => {
            if (typeof clearDashboard === 'function') {
                clearDashboard();
            }
        });

        // Settings panel
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
            if (typeof hideSettings === 'function') {
                hideSettings();
            }
        });
        document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
            if (typeof applyChartSettings === 'function') {
                applyChartSettings();
            }
        });
        document.getElementById('deleteChartBtn')?.addEventListener('click', () => {
            if (typeof deleteSelectedChart === 'function') {
                deleteSelectedChart();
            }
        });

        // Color picker update
        document.getElementById('chartColor')?.addEventListener('input', (e) => {
            const preview = document.querySelector('.viz-color-preview');
            if (preview) preview.style.background = e.target.value;
        });

        // Save & Export buttons
        document.getElementById('saveBtn')?.addEventListener('click', () => {
            if (typeof showSaveMenu === 'function') {
                showSaveMenu();
            }
        });
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            if (typeof showExportMenu === 'function') {
                showExportMenu();
            }
        });

        // Stats overlay checkbox listeners
        ['showMeanLine', 'showMedianLine', 'showStdBand', 'showTrendLine'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                const state = window.VIZ_STATE;
                if (state && state.selectedChart) {
                    const config = state.charts.find(c => c.id === state.selectedChart);
                    if (config && typeof renderChart === 'function') {
                        console.log(`Stats overlay guncellendi: ${id}`);
                        renderChart(config);
                    }
                }
            });
        });
    }

    // -----------------------------------------------------
    // DRAG & DROP
    // -----------------------------------------------------
    function setupDragAndDrop() {
        // Dosya drop zone - viz_file_handler.js tarafından yönetiliyor
        // Duplicate event listener'ları önlemek için burada yorum satırı

        // Chart type drag
        document.querySelectorAll('.viz-chart-type').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('chartType', el.dataset.type);
            });
        });

        // NOT: Istatistik butonlari icin drag initStatDragDropSystem'de handle ediliyor
        // Burada tekrar eklemek duplicate event'e neden oluyordu

        // Dashboard drop - hem chart hem stat tiplerini destekle
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

                // Check for chart type
                const chartType = e.dataTransfer.getData('chartType');
                if (chartType && typeof addChart === 'function') {
                    console.log('Chart dropped:', chartType);
                    addChart(chartType);
                    return;
                }

                // Check for stat type
                const statType = e.dataTransfer.getData('statType');
                if (statType && typeof addStatWidget === 'function') {
                    console.log('Stat widget dropped:', statType);
                    addStatWidget(statType);
                    return;
                }

                // Check for column drag
                const column = e.dataTransfer.getData('column');
                if (column) {
                    console.log('Column dropped:', column);
                }
            });
        }
    }

    // -----------------------------------------------------
    // DASHBOARD STORAGE
    // -----------------------------------------------------
    function loadDashboardFromStorage() {
        try {
            const saved = localStorage.getItem('opradox_viz_dashboard');
            if (saved) {
                const dashboardData = JSON.parse(saved);
                console.log('Dashboard storage found:', dashboardData);
                // TODO: Restore dashboard state
            }
        } catch (e) {
            console.warn('Dashboard load error:', e);
        }
    }

    // Global exports
    window.initVizStudio = initVizStudio;
    window.loadSavedTheme = loadSavedTheme;
    window.loadSavedLang = loadSavedLang;
    window.toggleTheme = toggleTheme;
    window.toggleLang = toggleLang;
    window.updateLangLabel = updateLangLabel;
    window.applyLocalization = applyLocalization;
    window.updateAllChartsTheme = updateAllChartsTheme;
    window.setupEventListeners = setupEventListeners;
    window.setupDragAndDrop = setupDragAndDrop;
    window.loadDashboardFromStorage = loadDashboardFromStorage;

    console.log('✅ viz-init.js Loaded');
})();
