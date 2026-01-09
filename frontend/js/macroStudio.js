/**
 * Macro Studio Pro - Opradox
 * FAZ-1: Veri Kaynağı & Önizleme (RSP PARITY)
 * 
 * ALLOWLIST: Mevcut data source block kodları (reuse), queueClient.js, queueModal.js
 * YASAKLAR: Özel popup, yeni preview mantığı, Toast override, VBA execute
 */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS & STATE
    // ============================================================

    const QUEUE_ROW_THRESHOLD = 50000;
    const PREVIEW_MAX_ROWS = 100;
    // Use global BACKEND_BASE_URL from app.js if available, otherwise default
    const BACKEND_BASE_URL = window.BACKEND_BASE_URL || 'http://127.0.0.1:8100';

    // Embedded mode state (when running within excel.html)
    let EMBEDDED_MODE = false;
    let EMBEDDED_CONTAINER_ID = null;

    // Macro Studio State
    const MACRO_STATE = {
        currentFile: null,
        currentFileName: '',
        sheetNames: [],
        selectedSheet: '',
        columns: [],
        rowCount: 0,
        colCount: 0,
        previewRows: [],
        currentLang: 'tr',
        activeScenarioId: null
    };

    // ============================================================
    // TEXTS (TR/EN)
    // ============================================================

    const MACRO_TEXTS = {
        tr: {
            title: 'Macro Studio Pro',
            file_select: 'Dosya Seç',
            sheet_select: 'Sayfa Seç',
            column_select: 'Sütun Seç',
            preview: 'Önizleme',
            run: 'Çalıştır',
            queue_info: 'Büyük dosya kuyruğa alınıyor...',
            loading: 'Yükleniyor...',
            file_loaded: 'Dosya yüklendi',
            sheet_changed: 'Sayfa değiştirildi',
            error_no_file: 'Lütfen önce dosya yükleyin',
            error_upload: 'Dosya yükleme hatası',
            rows: 'satır',
            cols: 'sütun',
            copy_column: 'Sütun adı kopyalandı',
            no_preview: 'Önizleme için önce dosya yükleyin',
            queue_submitted: 'İş kuyruğa eklendi',
            scenario_list: 'Makro Senaryoları',
            no_macros: 'Henüz makro senaryosu bulunmuyor'
        },
        en: {
            title: 'Macro Studio Pro',
            file_select: 'Select File',
            sheet_select: 'Select Sheet',
            column_select: 'Select Column',
            preview: 'Preview',
            run: 'Run',
            queue_info: 'Large file is being queued...',
            loading: 'Loading...',
            file_loaded: 'File loaded',
            sheet_changed: 'Sheet changed',
            error_no_file: 'Please upload a file first',
            error_upload: 'File upload error',
            rows: 'rows',
            cols: 'columns',
            copy_column: 'Column name copied',
            no_preview: 'Upload a file to preview',
            queue_submitted: 'Job submitted to queue',
            scenario_list: 'Macro Scenarios',
            no_macros: 'No macro scenarios available yet'
        }
    };

    function getText(key) {
        const lang = MACRO_STATE.currentLang || 'tr';
        return MACRO_TEXTS[lang]?.[key] || MACRO_TEXTS['tr']?.[key] || key;
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {
        console.log('[MacroStudio] Initializing...');

        // Detect language
        detectLanguage();

        // Setup file input handlers
        setupFileHandlers();

        // Setup theme toggle
        setupThemeToggle();

        // Setup language toggle
        setupLanguageToggle();

        // Setup help panel toggle
        setupHelpPanel();

        // FAZ-2: Initialize Pipeline
        setTimeout(() => {
            if (typeof window.MacroPipeline !== 'undefined') {
                window.MacroPipeline.init();
                console.log('[MacroStudio] Pipeline initialized');
            }
        }, 100);

        console.log('[MacroStudio] Initialized' + (EMBEDDED_MODE ? ' (embedded mode)' : ''));
    }

    /**
     * Initialize MacroStudio within excel.html (embedded mode)
     * Uses global file upload from excel.html, no separate file handling needed
     * @param {string} containerId - ID of the container element
     * @param {string} scenarioId - Active scenario ID
     */
    function initWithinExcel(containerId, scenarioId) {
        console.log('[MacroStudio] Initializing in embedded mode:', containerId, scenarioId);

        EMBEDDED_MODE = true;
        EMBEDDED_CONTAINER_ID = containerId;
        MACRO_STATE.activeScenarioId = scenarioId;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[MacroStudio] Container not found:', containerId);
            return;
        }

        // Detect language from existing app
        if (typeof CURRENT_LANG !== 'undefined') {
            MACRO_STATE.currentLang = CURRENT_LANG;
        } else {
            detectLanguage();
        }

        // Render embedded UI (now uses global file upload, includes palette and canvas)
        renderEmbeddedUI(container);

        // Listen for global file changes
        setupGlobalFileListener();

        // FAZ-2: Initialize Pipeline - uses standard IDs now (macroPipelinePalette, macroPipelineCanvas, macroPipelineSettings)
        setTimeout(() => {
            if (typeof window.MacroPipeline !== 'undefined' && window.MacroPipeline.init) {
                window.MacroPipeline.init();
                console.log('[MacroStudio] Pipeline initialized (embedded)');
            } else {
                console.warn('[MacroStudio] MacroPipeline module not loaded');
            }
        }, 150);

        console.log('[MacroStudio] Embedded mode initialized');
    }

    /**
     * Sync state with global file state from app.js (window.LAST_FILE_INFO or window.EXCEL_STATE)
     * FAZ-C: Enhanced to support EXCEL_STATE.uploadedFiles as additional source
     */
    function syncWithGlobalFileState() {
        // FAZ-C: Try EXCEL_STATE first (new unified state)
        if (typeof window.EXCEL_STATE !== 'undefined' && window.EXCEL_STATE?.uploadedFiles?.length > 0) {
            const fileInfo = window.EXCEL_STATE.uploadedFiles[0];
            MACRO_STATE.currentFileName = fileInfo.name || '';
            MACRO_STATE.columns = fileInfo.columns || [];
            MACRO_STATE.rowCount = fileInfo.row_count || 0;
            MACRO_STATE.colCount = fileInfo.col_count || fileInfo.columns?.length || 0;
            MACRO_STATE.sheetNames = fileInfo.sheets || [];
            MACRO_STATE.selectedSheet = fileInfo.current_sheet || fileInfo.sheets?.[0] || '';
            console.log('[MacroStudio] Synced with EXCEL_STATE:', MACRO_STATE);
            return;
        }

        // Fallback: Use LAST_FILE_INFO (legacy support)
        if (typeof window.LAST_FILE_INFO !== 'undefined' && window.LAST_FILE_INFO) {
            const info = window.LAST_FILE_INFO;
            MACRO_STATE.columns = info.columns || [];
            MACRO_STATE.rowCount = info.row_count || 0;
            MACRO_STATE.colCount = info.col_count || info.columns?.length || 0;
            MACRO_STATE.sheetNames = info.sheets || [];
            MACRO_STATE.selectedSheet = info.current_sheet || info.sheets?.[0] || '';
            console.log('[MacroStudio] Synced with LAST_FILE_INFO:', MACRO_STATE);
        }
    }

    /**
     * Setup listener for global file upload changes
     */
    function setupGlobalFileListener() {
        // Listen for file events from app.js
        window.addEventListener('opradox-file-loaded', (e) => {
            console.log('[MacroStudio] Global file loaded event:', e.detail);
            if (e.detail) {
                MACRO_STATE.columns = e.detail.columns || [];
                MACRO_STATE.rowCount = e.detail.row_count || 0;
                MACRO_STATE.colCount = e.detail.col_count || e.detail.columns?.length || 0;
                MACRO_STATE.sheetNames = e.detail.sheets || [];
                MACRO_STATE.selectedSheet = e.detail.current_sheet || e.detail.sheets?.[0] || '';
                MACRO_STATE.currentFileName = e.detail.filename || '';

                // Update datalist for column autocomplete
                updateMacroColumnDatalist();

                // Show Doctor button for XLSM files
                const ext = (MACRO_STATE.currentFileName || '').split('.').pop().toLowerCase();
                const doctorBtn = document.getElementById('embeddedMacroDoctorBtn');
                if (doctorBtn) {
                    if (ext === 'xlsm' || ext === 'xlsb') {
                        doctorBtn.style.display = 'inline-flex';
                        doctorBtn.onclick = () => {
                            if (typeof window.MacroDoctor !== 'undefined' && window.MacroDoctor.analyze) {
                                window.MacroDoctor.analyze(window.LAST_FILE);
                            }
                        };
                    } else {
                        doctorBtn.style.display = 'none';
                    }
                }
            }
        });
    }

    /**
     * Update macro-columns datalist for autocomplete
     */
    function updateMacroColumnDatalist() {
        const datalist = document.getElementById('macro-columns');
        if (datalist) {
            datalist.innerHTML = MACRO_STATE.columns.map(col => `<option value="${col}">`).join('');
        }
    }


    /**
     * Render the embedded UI inside the container
     * NOTE: Uses global file upload, no separate file upload area
     * Includes Studio/Doctor mode selection tabs
     */
    function renderEmbeddedUI(container) {
        const T = MACRO_TEXTS[MACRO_STATE.currentLang] || MACRO_TEXTS.tr;
        const lang = MACRO_STATE.currentLang || 'tr';

        // Sync state with global file state from app.js
        syncWithGlobalFileState();

        // Default mode is 'studio'
        MACRO_STATE.currentMode = MACRO_STATE.currentMode || 'studio';

        // Passive button styles - visible border and subtle gradient
        const passiveStudioStyle = 'background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05)); color: var(--gm-text); border: 2px solid rgba(59,130,246,0.4);';
        const passiveDoctorStyle = 'background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05)); color: var(--gm-text); border: 2px solid rgba(139,92,246,0.4);';
        // Active button styles - full gradient
        const activeStudioStyle = 'background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: 2px solid transparent; box-shadow: 0 4px 15px rgba(59,130,246,0.4);';
        const activeDoctorStyle = 'background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: 2px solid transparent; box-shadow: 0 4px 15px rgba(139,92,246,0.4);';

        container.innerHTML = `
            <!-- MODE TABS: Studio / Doctor -->
            <div class="macro-mode-tabs" style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button id="macroModeStudio" class="macro-mode-tab ${MACRO_STATE.currentMode === 'studio' ? 'active' : ''}" 
                        onclick="MacroStudio.setMode('studio')"
                        style="flex: 1; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.25s ease;
                               ${MACRO_STATE.currentMode === 'studio' ? activeStudioStyle : passiveStudioStyle}">
                    <i class="fas fa-stream" style="margin-right: 8px;"></i>
                    ${lang === 'tr' ? 'Pipeline Builder (Studio)' : 'Pipeline Builder (Studio)'}
                </button>
                <button id="macroModeDoctor" class="macro-mode-tab ${MACRO_STATE.currentMode === 'doctor' ? 'active' : ''}" 
                        onclick="MacroStudio.setMode('doctor')"
                        style="flex: 1; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.25s ease;
                               ${MACRO_STATE.currentMode === 'doctor' ? activeDoctorStyle : passiveDoctorStyle}">
                    <i class="fas fa-stethoscope" style="margin-right: 8px;"></i>
                    ${lang === 'tr' ? 'VBA Analiz (Doctor)' : 'VBA Analyzer (Doctor)'}
                </button>
            </div>

            <!-- INFO: Global dosya yüklemesi kullanılıyor -->
            <div class="gm-info-box" style="padding:10px; margin-bottom:12px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);">
                <i class="fas fa-info-circle" style="color:#3b82f6;"></i>
                <span>${lang === 'tr' ? 'Yukarıdaki dosya yükleme alanından .xlsx veya .xlsm dosyanızı yükleyin.' : 'Upload your .xlsx or .xlsm file using the file upload area above.'}</span>
            </div>

            <!-- STUDIO MODE: Pipeline Builder -->
            <div id="macroStudioPanel" style="display: ${MACRO_STATE.currentMode === 'studio' ? 'block' : 'none'};">
                <!-- PIPELINE LAYOUT: Palette + Canvas -->
                <div style="display: grid; grid-template-columns: 280px 1fr; gap: 15px; min-height: 350px;">
                    <!-- BLOCK PALETTE -->
                    <div class="gm-card" style="max-height: 500px; overflow-y: auto;">
                        <div id="macroPipelinePalette" class="vb-palette" style="padding: 10px;">
                            <!-- Palette will be rendered by MacroPipeline.init() -->
                            <div style="text-align: center; color: var(--gm-text-muted); padding: 20px;">
                                <i class="fas fa-spinner fa-spin"></i> ${lang === 'tr' ? 'Bloklar yükleniyor...' : 'Loading blocks...'}
                            </div>
                        </div>
                    </div>

                    <!-- PIPELINE CANVAS -->
                    <div class="gm-card" style="display: flex; flex-direction: column;">
                        <div class="gm-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0;"><i class="fas fa-stream"></i> Pipeline</h3>
                            <div style="display: flex; gap: 8px;">
                                <button class="gm-pill-btn" onclick="MacroPipeline.run()" style="background: linear-gradient(135deg, #10b981, #059669);">
                                    <i class="fas fa-play"></i> ${lang === 'tr' ? 'Çalıştır' : 'Run'}
                                </button>
                                <button class="gm-pill-btn" onclick="MacroPipeline.clearPipeline()" style="opacity: 0.7;">
                                    <i class="fas fa-trash"></i> ${lang === 'tr' ? 'Temizle' : 'Clear'}
                                </button>
                            </div>
                        </div>
                        <div id="macroPipelineCanvas" class="vb-canvas" style="flex: 1; min-height: 200px; padding: 15px; overflow-y: auto;">
                            <div style="text-align: center; color: var(--gm-text-muted); padding: 30px;">
                                <i class="fas fa-arrow-left"></i> ${lang === 'tr' ? 'Soldaki paletden blok ekleyin' : 'Add blocks from the palette on the left'}
                            </div>
                        </div>
                        <!-- Block Settings Panel -->
                        <div id="macroPipelineSettings" class="vb-settings" style="border-top: 1px solid var(--gm-border); padding: 10px; max-height: 200px; overflow-y: auto;">
                            <!-- Settings rendered by MacroPipeline -->
                        </div>
                    </div>
                </div>

                <!-- FAZ-5: SMART SUGGESTIONS PANEL -->
                <div id="embeddedMacroSuggestionsPanel" style="margin-top: 15px;"></div>

                <!-- FAZ-4: DIFF PANEL -->
                <div id="embeddedMacroDiffPanel" style="margin-top: 15px;"></div>

                <!-- FAZ-4: DECISION TRACE PANEL -->
                <div id="embeddedMacroTracePanel" style="margin-top: 15px;"></div>

                <!-- RESULT -->
                <div class="gm-card" style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
                    <div class="gm-card-header">
                        <h3 style="margin: 0;"><i class="fas fa-check-circle"></i> ${lang === 'tr' ? 'Sonuç' : 'Result'}</h3>
                    </div>
                    <div id="embeddedMacroStatusMessage" class="gm-status"></div>
                    <pre id="macroResultJson" class="gm-result-json" style="margin: 10px; font-size: 0.85rem;">// ${lang === 'tr' ? 'Sonuçlar burada görünecek.' : 'Results will appear here.'}</pre>
                </div>
            </div>

            <!-- DOCTOR MODE: VBA Analyzer -->
            <div id="macroDoctorPanel" style="display: ${MACRO_STATE.currentMode === 'doctor' ? 'block' : 'none'};">
                <div class="gm-card">
                    <div class="gm-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;"><i class="fas fa-stethoscope"></i> ${lang === 'tr' ? 'VBA Makro Analizi' : 'VBA Macro Analysis'}</h3>
                        <button id="macroDoctorAnalyzeBtn" class="gm-pill-btn" style="background: linear-gradient(135deg, #8b5cf6, #6366f1);">
                            <i class="fas fa-search"></i> ${lang === 'tr' ? 'Analiz Et' : 'Analyze'}
                        </button>
                    </div>
                    <div id="macroDoctorContent" style="padding: 15px;">
                        <div style="text-align: center; color: var(--gm-text-muted); padding: 40px;">
                            <i class="fas fa-file-code" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>${lang === 'tr' ? '.xlsm dosyanızı yükleyip "Analiz Et" butonuna basın.' : 'Upload your .xlsm file and click "Analyze".'}</p>
                            <p style="font-size: 0.85rem; margin-top: 10px;">
                                <i class="fas fa-shield-alt" style="color: #ef4444;"></i> ${lang === 'tr' ? 'Güvenlik Taraması' : 'Security Scan'} &nbsp;|&nbsp;
                                <i class="fas fa-tachometer-alt" style="color: #f59e0b;"></i> ${lang === 'tr' ? 'Performans Analizi' : 'Performance Analysis'} &nbsp;|&nbsp;
                                <i class="fas fa-code" style="color: #3b82f6;"></i> ${lang === 'tr' ? 'Kod Kalitesi' : 'Code Quality'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Datalist for column autocomplete -->
            <datalist id="macro-columns"></datalist>
        `;

        // Setup Doctor analyze button
        const doctorBtn = container.querySelector('#macroDoctorAnalyzeBtn');
        if (doctorBtn) {
            doctorBtn.onclick = () => {
                if (typeof window.MacroDoctor !== 'undefined' && window.MacroDoctor.analyze && window.LAST_FILE) {
                    window.MacroDoctor.analyze(window.LAST_FILE);
                } else if (!window.LAST_FILE) {
                    showToast(lang === 'tr' ? 'Önce dosya yükleyin' : 'Upload a file first', 'warning');
                }
            };
        }
    }

    /**
     * Set the current mode (studio/doctor) and update UI
     */
    function setMode(mode) {
        MACRO_STATE.currentMode = mode;

        const studioPanel = document.getElementById('macroStudioPanel');
        const doctorPanel = document.getElementById('macroDoctorPanel');
        const studioTab = document.getElementById('macroModeStudio');
        const doctorTab = document.getElementById('macroModeDoctor');

        if (mode === 'studio') {
            if (studioPanel) studioPanel.style.display = 'block';
            if (doctorPanel) doctorPanel.style.display = 'none';
            if (studioTab) {
                studioTab.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                studioTab.style.color = 'white';
                studioTab.style.boxShadow = '0 4px 15px rgba(59,130,246,0.4)';
                studioTab.style.border = '2px solid transparent';
            }
            if (doctorTab) {
                doctorTab.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))';
                doctorTab.style.color = 'var(--gm-text)';
                doctorTab.style.boxShadow = 'none';
                doctorTab.style.border = '2px solid rgba(139,92,246,0.4)';
            }
        } else {
            if (studioPanel) studioPanel.style.display = 'none';
            if (doctorPanel) doctorPanel.style.display = 'block';
            if (doctorTab) {
                doctorTab.style.background = 'linear-gradient(135deg, #8b5cf6, #6366f1)';
                doctorTab.style.color = 'white';
                doctorTab.style.boxShadow = '0 4px 15px rgba(139,92,246,0.4)';
                doctorTab.style.border = '2px solid transparent';
            }
            if (studioTab) {
                studioTab.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))';
                studioTab.style.color = 'var(--gm-text)';
                studioTab.style.boxShadow = 'none';
                studioTab.style.border = '2px solid rgba(59,130,246,0.4)';
            }
        }

        console.log('[MacroStudio] Mode changed to:', mode);
    }

    /**
     * Setup file handlers for embedded UI
     */
    function setupEmbeddedFileHandlers(container) {
        const fileInput = container.querySelector('#embeddedMacroFileInput');
        const dropZone = container.querySelector('#embeddedMacroDropZone');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) loadEmbeddedFile(file);
            });
        }

        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput?.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) loadEmbeddedFile(files[0]);
            });
        }
    }

    /**
     * Load file in embedded mode
     */
    async function loadEmbeddedFile(file) {
        console.log('[MacroStudio] Loading file (embedded):', file.name);

        // Validate extension
        const validExtensions = ['.xlsx', '.xlsm', '.xls'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            showToast(getText('error_upload') + ': ' + ext, 'error');
            return;
        }

        MACRO_STATE.currentFile = file;
        MACRO_STATE.currentFileName = file.name;

        // Update UI
        const container = document.getElementById(EMBEDDED_CONTAINER_ID);
        if (!container) return;

        const fileNameEl = container.querySelector('#embeddedMacroSelectedFileName');
        if (fileNameEl) fileNameEl.textContent = file.name;

        // Call backend to inspect file
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_BASE_URL}/ui/inspect`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Inspect failed');

            const data = await response.json();
            console.log('[MacroStudio] Inspect result (embedded):', data);

            // Update state
            MACRO_STATE.sheetNames = data.sheets || [];
            MACRO_STATE.selectedSheet = data.sheets?.[0] || '';
            MACRO_STATE.columns = data.columns || [];
            MACRO_STATE.rowCount = data.row_count || 0;
            MACRO_STATE.colCount = data.col_count || 0;

            // Update embedded UI
            updateEmbeddedSheetSelector(container);
            updateEmbeddedFileInfoPanel(container);
            await fetchEmbeddedPreviewRows();

            // Show preview button
            const previewBtn = container.querySelector('#embeddedMacroPreviewBtn');
            if (previewBtn) previewBtn.style.display = 'inline-flex';

            // Show Doctor button for XLSM files
            const doctorBtn = container.querySelector('#embeddedMacroDoctorBtn');
            if (doctorBtn && (ext === '.xlsm' || ext === '.xlsb')) {
                doctorBtn.style.display = 'inline-flex';
                // Setup Doctor button click
                doctorBtn.onclick = () => {
                    if (typeof window.MacroDoctor !== 'undefined' && window.MacroDoctor.analyze) {
                        window.MacroDoctor.analyze(file);
                    }
                };
            } else if (doctorBtn) {
                doctorBtn.style.display = 'none';
            }

            showToast(getText('file_loaded') + ': ' + file.name, 'success');

        } catch (err) {
            console.error('[MacroStudio] File load error (embedded):', err);
            showToast(getText('error_upload'), 'error');
        }
    }

    function updateEmbeddedSheetSelector(container) {
        const sheetPanel = container.querySelector('#embeddedMacroSheetPanel');
        const sheetSelect = container.querySelector('#embeddedMacroSheetSelect');

        if (!sheetSelect) return;

        sheetSelect.innerHTML = '';
        MACRO_STATE.sheetNames.forEach((sheet, index) => {
            const option = document.createElement('option');
            option.value = sheet;
            option.textContent = sheet;
            if (index === 0) option.selected = true;
            sheetSelect.appendChild(option);
        });

        if (sheetPanel && MACRO_STATE.sheetNames.length > 1) {
            sheetPanel.style.display = 'block';
        }
    }

    function updateEmbeddedFileInfoPanel(container) {
        const panel = container.querySelector('#embeddedMacroFileInfoPanel');
        const rowCount = container.querySelector('#embeddedMacroFileRowCount');
        const colCount = container.querySelector('#embeddedMacroFileColCount');
        const columnList = container.querySelector('#embeddedMacroFileColumnList');

        if (panel) panel.style.display = 'block';
        if (rowCount) rowCount.textContent = MACRO_STATE.rowCount.toLocaleString();
        if (colCount) colCount.textContent = MACRO_STATE.colCount;

        if (columnList) {
            columnList.innerHTML = MACRO_STATE.columns.map(col =>
                `<span class="gm-column-chip" onclick="MacroStudio.copyColumnName('${col.replace(/'/g, "\\'")}')" title="${getText('copy_column')}">${col}</span>`
            ).join('');
        }

        const datalist = container.querySelector('#embedded-macro-columns');
        if (datalist) {
            datalist.innerHTML = MACRO_STATE.columns.map(col => `<option value="${col}">`).join('');
        }
    }

    async function fetchEmbeddedPreviewRows() {
        if (!MACRO_STATE.currentFile) return;

        try {
            const formData = new FormData();
            formData.append('file', MACRO_STATE.currentFile);

            let url = `${BACKEND_BASE_URL}/ui/inspect?max_rows=${PREVIEW_MAX_ROWS}`;
            if (MACRO_STATE.selectedSheet) {
                url += `&sheet_name=${encodeURIComponent(MACRO_STATE.selectedSheet)}`;
            }

            const response = await fetch(url, { method: 'POST', body: formData });
            if (response.ok) {
                const data = await response.json();
                MACRO_STATE.previewRows = data.preview_rows || data.rows || [];
            }
        } catch (err) {
            console.warn('[MacroStudio] Preview fetch failed (embedded):', err);
        }
    }

    async function onEmbeddedSheetChange(sheetName) {
        if (!MACRO_STATE.currentFile) return;
        MACRO_STATE.selectedSheet = sheetName;

        const container = document.getElementById(EMBEDDED_CONTAINER_ID);
        if (!container) return;

        try {
            const formData = new FormData();
            formData.append('file', MACRO_STATE.currentFile);

            const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;
            const response = await fetch(url, { method: 'POST', body: formData });

            if (!response.ok) throw new Error('Sheet inspect failed');

            const data = await response.json();
            MACRO_STATE.columns = data.columns || [];
            MACRO_STATE.rowCount = data.row_count || 0;
            MACRO_STATE.colCount = data.col_count || 0;

            updateEmbeddedFileInfoPanel(container);
            await fetchEmbeddedPreviewRows();

            showToast(getText('sheet_changed') + ': ' + sheetName, 'info');
        } catch (err) {
            console.error('[MacroStudio] Sheet change error (embedded):', err);
        }
    }

    function showEmbeddedPreview() {
        // Use existing showPreview for now, or implement embedded modal
        showPreview();
    }

    function detectLanguage() {
        const stored = localStorage.getItem('opradox_lang');
        if (stored) {
            MACRO_STATE.currentLang = stored;
        } else {
            MACRO_STATE.currentLang = navigator.language?.startsWith('en') ? 'en' : 'tr';
        }
        updatePageTexts();
    }

    function updatePageTexts() {
        // Update page subtitle
        const subtitle = document.getElementById('pageSubtitle');
        if (subtitle) subtitle.textContent = getText('title');

        // Update other texts
        const langLabel = document.getElementById('langLabel');
        if (langLabel) {
            langLabel.textContent = MACRO_STATE.currentLang === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 Tr | En';
        }
    }

    // ============================================================
    // FILE HANDLING (RSP PATTERN)
    // ============================================================

    function setupFileHandlers() {
        const fileInput = document.getElementById('macroFileInput');
        const dropZone = document.getElementById('macroDropZone');

        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    loadFile(files[0]);
                }
            });
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            loadFile(file);
        }
    }

    async function loadFile(file) {
        console.log('[MacroStudio] Loading file:', file.name);

        // Validate extension
        const validExtensions = ['.xlsx', '.xlsm', '.xls'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            showToast(getText('error_upload') + ': ' + ext, 'error');
            return;
        }

        MACRO_STATE.currentFile = file;
        MACRO_STATE.currentFileName = file.name;

        // Update UI
        const fileNameEl = document.getElementById('macroSelectedFileName');
        if (fileNameEl) fileNameEl.textContent = file.name;

        const badge = document.getElementById('macroFile1Badge');
        const badgeName = document.getElementById('macroFile1BadgeName');
        if (badge && badgeName) {
            badge.style.display = 'inline-flex';
            badgeName.textContent = file.name;
        }

        // Call backend to inspect file
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_BASE_URL}/ui/inspect`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Inspect failed');
            }

            const data = await response.json();
            console.log('[MacroStudio] Inspect result:', data);

            // Update state
            MACRO_STATE.sheetNames = data.sheets || [];
            MACRO_STATE.selectedSheet = data.sheets?.[0] || '';
            MACRO_STATE.columns = data.columns || [];
            MACRO_STATE.rowCount = data.row_count || 0;
            MACRO_STATE.colCount = data.col_count || 0;

            // Update Sheet selector
            updateSheetSelector(MACRO_STATE.sheetNames);

            // Update file info panel
            updateFileInfoPanel();

            // Fetch preview rows (cached)
            await fetchPreviewRows();

            // Show preview button
            const previewBtn = document.getElementById('macroPreviewBtn');
            if (previewBtn) previewBtn.style.display = 'inline-flex';

            // FAZ-3: Show Doctor button for XLSM files
            const doctorBtn = document.getElementById('macroDoctorBtn');
            const doctorSection = document.getElementById('macroDoctorSection');
            const ext = file.name.split('.').pop().toLowerCase();
            if (doctorBtn && (ext === 'xlsm' || ext === 'xlsb')) {
                doctorBtn.style.display = 'inline-flex';
                if (doctorSection) doctorSection.style.display = 'block';
            } else if (doctorBtn) {
                doctorBtn.style.display = 'none';
                if (doctorSection) doctorSection.style.display = 'none';
            }

            showToast(getText('file_loaded') + ': ' + file.name, 'success');

        } catch (err) {
            console.error('[MacroStudio] File load error:', err);
            showToast(getText('error_upload'), 'error');
        }
    }

    function updateSheetSelector(sheetNames) {
        const sheetPanel = document.getElementById('macroSheetPanel');
        const sheetSelect = document.getElementById('macroSheetSelect');

        if (!sheetSelect) return;

        // Clear existing options
        sheetSelect.innerHTML = '';

        // Add options
        sheetNames.forEach((sheet, index) => {
            const option = document.createElement('option');
            option.value = sheet;
            option.textContent = sheet;
            if (index === 0) option.selected = true;
            sheetSelect.appendChild(option);
        });

        // Show panel if multiple sheets
        if (sheetPanel && sheetNames.length > 1) {
            sheetPanel.style.display = 'block';
        }
    }

    async function onSheetChange(sheetName) {
        console.log('[MacroStudio] Sheet changed to:', sheetName);

        if (!MACRO_STATE.currentFile) return;

        MACRO_STATE.selectedSheet = sheetName;

        // Re-inspect with new sheet
        try {
            const formData = new FormData();
            formData.append('file', MACRO_STATE.currentFile);

            const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Sheet inspect failed');

            const data = await response.json();

            // Update state
            MACRO_STATE.columns = data.columns || [];
            MACRO_STATE.rowCount = data.row_count || 0;
            MACRO_STATE.colCount = data.col_count || 0;

            // Update UI
            updateFileInfoPanel();
            await fetchPreviewRows();

            showToast(getText('sheet_changed') + ': ' + sheetName, 'info');

        } catch (err) {
            console.error('[MacroStudio] Sheet change error:', err);
        }
    }

    function updateFileInfoPanel() {
        const panel = document.getElementById('macroFileInfoPanel');
        const rowCount = document.getElementById('macroFileRowCount');
        const colCount = document.getElementById('macroFileColCount');
        const columnList = document.getElementById('macroFileColumnList');

        if (panel) panel.style.display = 'block';
        if (rowCount) rowCount.textContent = MACRO_STATE.rowCount.toLocaleString();
        if (colCount) colCount.textContent = MACRO_STATE.colCount;

        // Render column chips (RSP pattern)
        if (columnList) {
            columnList.innerHTML = MACRO_STATE.columns.map(col =>
                `<span class="gm-column-chip" onclick="MacroStudio.copyColumnName('${col}')" title="${getText('copy_column')}">${col}</span>`
            ).join('');
        }

        // Update datalist for autocomplete
        const datalist = document.getElementById('macro-columns');
        if (datalist) {
            datalist.innerHTML = MACRO_STATE.columns.map(col =>
                `<option value="${col}">`
            ).join('');
        }
    }

    function copyColumnName(colName) {
        navigator.clipboard.writeText(colName).then(() => {
            showToast(getText('copy_column') + ': ' + colName, 'success', 1500);
        }).catch(err => {
            console.error('[MacroStudio] Copy failed:', err);
        });
    }

    // ============================================================
    // PREVIEW (RSP PATTERN - Partial/Cached)
    // ============================================================

    async function fetchPreviewRows() {
        if (!MACRO_STATE.currentFile) return;

        try {
            const formData = new FormData();
            formData.append('file', MACRO_STATE.currentFile);

            let url = `${BACKEND_BASE_URL}/ui/inspect?max_rows=${PREVIEW_MAX_ROWS}`;
            if (MACRO_STATE.selectedSheet) {
                url += `&sheet_name=${encodeURIComponent(MACRO_STATE.selectedSheet)}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                MACRO_STATE.previewRows = data.preview_rows || data.rows || [];
                console.log('[MacroStudio] Preview rows cached:', MACRO_STATE.previewRows.length);
            }
        } catch (err) {
            console.warn('[MacroStudio] Preview fetch failed:', err);
        }
    }

    function showPreview() {
        if (!MACRO_STATE.currentFile || MACRO_STATE.previewRows.length === 0) {
            showToast(getText('no_preview'), 'warning');
            return;
        }

        const modal = document.getElementById('macroPreviewModal');
        const body = document.getElementById('macroPreviewModalBody');

        if (!modal || !body) return;

        // Build preview table (RSP pattern)
        const columns = MACRO_STATE.columns;
        const rows = MACRO_STATE.previewRows;

        let html = `
            <div style="overflow-x: auto; max-height: 60vh;">
                <table class="gm-preview-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: var(--gm-primary); color: white;">
                            ${columns.map(col => `<th style="padding: 8px 12px; text-align: left; white-space: nowrap;">${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        rows.forEach((row, idx) => {
            const bgColor = idx % 2 === 0 ? 'var(--gm-bg)' : 'var(--gm-card-bg)';
            html += `<tr style="background: ${bgColor};">`;
            columns.forEach(col => {
                const val = row[col] ?? '';
                html += `<td style="padding: 6px 12px; border-bottom: 1px solid var(--gm-border);">${val}</td>`;
            });
            html += `</tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem; color: var(--gm-text-muted);">
                ${getText('rows')}: ${rows.length} / ${MACRO_STATE.rowCount.toLocaleString()}
            </div>
        `;

        body.innerHTML = html;
        modal.style.display = 'flex';
    }

    function closePreviewModal() {
        const modal = document.getElementById('macroPreviewModal');
        if (modal) modal.style.display = 'none';
    }

    // ============================================================
    // QUEUE FALLBACK (50k+ rows)
    // ============================================================

    async function submitJob(scenarioId, params) {
        const rowCount = MACRO_STATE.rowCount;

        if (rowCount > QUEUE_ROW_THRESHOLD) {
            // Use queue system
            console.log('[MacroStudio] Large file detected, using queue...');
            showToast(getText('queue_info'), 'info');

            try {
                const result = await window.QueueClient.submitJob('macro', 'run_macro', {
                    scenario_id: scenarioId,
                    file_name: MACRO_STATE.currentFileName,
                    sheet_name: MACRO_STATE.selectedSheet,
                    ...params
                });

                if (result.modal_required) {
                    window.QueueModal.openQueueModal(result);
                }

                return result;

            } catch (err) {
                console.error('[MacroStudio] Queue submit error:', err);
                showToast(err.message || 'Queue error', 'error');
                throw err;
            }
        } else {
            // Direct execution
            return runMacroDirect(scenarioId, params);
        }
    }

    async function runMacroDirect(scenarioId, params) {
        // Direct API call (no queue)
        // Implementation depends on backend macro execution endpoint
        console.log('[MacroStudio] Running macro directly:', scenarioId, params);
        // TODO: Implement direct macro execution when backend is ready
    }

    // ============================================================
    // SCENARIO LIST
    // ============================================================

    async function loadScenarioList() {
        const container = document.getElementById('macroScenarioListContainer');
        if (!container) return;

        // Placeholder - will be populated when macro scenarios are defined
        container.innerHTML = `
            <div class="gm-info-box" style="text-align: center; padding: 40px; opacity: 0.6;">
                <i class="fas fa-code" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>${getText('no_macros')}</p>
            </div>
        `;
    }

    // ============================================================
    // FILES PANEL TOGGLE
    // ============================================================

    function toggleFilesPanel() {
        const section = document.getElementById('macroFilesSection');
        if (section) {
            section.classList.toggle('collapsed');
        }
    }

    // ============================================================
    // THEME & LANGUAGE
    // ============================================================

    function setupThemeToggle() {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('opradox_theme', isDark ? 'dark' : 'light');
        });

        // Apply saved theme
        const saved = localStorage.getItem('opradox_theme');
        if (saved === 'light') {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        }
    }

    function setupLanguageToggle() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;

        btn.addEventListener('click', () => {
            MACRO_STATE.currentLang = MACRO_STATE.currentLang === 'tr' ? 'en' : 'tr';
            localStorage.setItem('opradox_lang', MACRO_STATE.currentLang);
            updatePageTexts();
            loadScenarioList();
        });
    }

    // ============================================================
    // HELP PANEL
    // ============================================================

    function setupHelpPanel() {
        const closeBtn = document.getElementById('macroHelpCloseBtn');
        const mainContent = document.getElementById('mainContent');

        if (closeBtn && mainContent) {
            closeBtn.addEventListener('click', () => {
                mainContent.classList.toggle('help-collapsed');
            });
        }

        // Default collapsed
        if (mainContent) {
            mainContent.classList.add('help-collapsed');
        }
    }

    // ============================================================
    // TOAST (Uses existing toast.js)
    // ============================================================

    function showToast(message, type = 'info', duration = 3000) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, duration);
        } else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.MacroStudio = {
        init: init,
        initWithinExcel: initWithinExcel,
        loadFile: loadFile,
        onSheetChange: onSheetChange,
        onEmbeddedSheetChange: onEmbeddedSheetChange,
        showPreview: showPreview,
        showEmbeddedPreview: showEmbeddedPreview,
        closePreviewModal: closePreviewModal,
        toggleFilesPanel: toggleFilesPanel,
        copyColumnName: copyColumnName,
        submitJob: submitJob,
        getText: getText,
        getState: () => MACRO_STATE,
        isEmbedded: () => EMBEDDED_MODE,
        setMode: setMode
    };

    // Auto-init only in standalone mode (macroStudio.html - removed)
    // When embedded in excel.html, initWithinExcel() will be called explicitly
    const isStandalonePage = document.querySelector('title')?.textContent?.includes('Macro Studio');
    if (isStandalonePage) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    } else {
        console.log('[MacroStudio] Module loaded, waiting for initWithinExcel() call');
    }

})();
