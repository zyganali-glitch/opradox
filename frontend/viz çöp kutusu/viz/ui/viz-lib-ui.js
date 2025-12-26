/**
 * viz-lib-ui.js
 * UI & Settings Functions - Recovered from Legacy viz.js
 * Functions: show*, set*, toggle*, save*, restore*
 */

(function () {
    'use strict';

    // =====================================================
    // COLOR PALETTES CONSTANT (viz.js lines 6250-6257)
    // =====================================================

    const COLOR_PALETTES = {
        'default': ['#4a90d9', '#9a3050', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c', '#1abc9c', '#34495e'],
        'pastel': ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb'],
        'vibrant': ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6'],
        'earth': ['#8d6e63', '#795548', '#6d4c41', '#5d4037', '#4e342e', '#3e2723', '#bcaaa4', '#d7ccc8'],
        'ocean': ['#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5', '#5c6bc0', '#7986cb', '#9fa8da'],
        'sunset': ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff9f43', '#00d2d3', '#2e86de']
    };

    // =====================================================
    // VERSION HISTORY (viz.js lines 7118-7160)
    // =====================================================

    const VERSION_HISTORY = [];

    function saveVersion(label = null) {
        const version = {
            id: Date.now(),
            label: label || `v${VERSION_HISTORY.length + 1}`,
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(VIZ_STATE.data || [])),
            charts: JSON.parse(JSON.stringify(VIZ_STATE.charts || []))
        };

        VERSION_HISTORY.push(version);
        if (typeof showToast === 'function') showToast(`Versiyon kaydedildi: ${version.label}`, 'success');

        return version.id;
    }

    function restoreVersion(versionId) {
        const version = VERSION_HISTORY.find(v => v.id === versionId);
        if (!version) {
            if (typeof showToast === 'function') showToast('Versiyon bulunamadı', 'error');
            return;
        }

        if (typeof saveState === 'function') saveState(); // Mevcut durumu kaydet

        VIZ_STATE.data = version.data;
        VIZ_STATE.charts = version.charts;

        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        VIZ_STATE.charts.forEach(c => { if (typeof renderChart === 'function') renderChart(c); });

        if (typeof showToast === 'function') showToast(`Versiyon yüklendi: ${version.label}`, 'success');
    }

    function listVersions() {
        return VERSION_HISTORY.map(v => ({
            id: v.id,
            label: v.label,
            timestamp: v.timestamp
        }));
    }

    // =====================================================
    // SAVE FUNCTIONS (viz.js lines 2877-2912, 4318-4325)
    // =====================================================

    function saveDashboard() {
        const dashboardData = {
            charts: VIZ_STATE.charts,
            chartCounter: VIZ_STATE.chartCounter,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('viz_dashboard', JSON.stringify(dashboardData));
        console.log('💾 Dashboard kaydedildi');

        if (typeof showToast === 'function') showToast('Dashboard kaydedildi', 'success');
    }

    function loadDashboardFromStorage() {
        const saved = localStorage.getItem('viz_dashboard');
        if (!saved) return;

        try {
            const dashboardData = JSON.parse(saved);

            if (dashboardData.charts && dashboardData.charts.length > 0) {
                VIZ_STATE.chartCounter = dashboardData.chartCounter || 0;

                dashboardData.charts.forEach(config => {
                    VIZ_STATE.charts.push(config);
                    if (typeof createChartWidget === 'function') createChartWidget(config);
                });

                if (typeof updateEmptyState === 'function') updateEmptyState();
                console.log('📂 Dashboard yüklendi:', dashboardData.charts.length, 'grafik');
            }
        } catch (e) {
            console.error('Dashboard yükleme hatası:', e);
        }
    }

    function saveToSessionStorage(data, columns) {
        try {
            sessionStorage.setItem('opradox_excel_data', JSON.stringify({ data, columns }));
            if (typeof showToast === 'function') showToast('Veri sessionStorage\'a kaydedildi', 'success');
        } catch (e) {
            if (typeof showToast === 'function') showToast('SessionStorage kayıt hatası', 'error');
        }
    }

    // =====================================================
    // TOGGLE FUNCTIONS (viz.js lines 4021-4027, 6094-6226)
    // =====================================================

    function toggleFullscreen(chartId) {
        if (chartId) {
            // Specific chart fullscreen
            const widget = document.querySelector(`[data-chart-id="${chartId}"]`);
            if (!widget) return;

            if (widget.classList.contains('viz-fullscreen')) {
                widget.classList.remove('viz-fullscreen');
                document.body.style.overflow = '';
            } else {
                widget.classList.add('viz-fullscreen');
                document.body.style.overflow = 'hidden';
            }

            const chart = VIZ_STATE.echartsInstances[chartId];
            if (chart) {
                setTimeout(() => chart.resize(), 100);
            }
        } else {
            // Browser fullscreen
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    }

    function toggleZoomPan(chartId, enabled = true) {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        chart.setOption({
            dataZoom: enabled ? [
                { type: 'inside', xAxisIndex: 0 },
                { type: 'inside', yAxisIndex: 0 },
                { type: 'slider', xAxisIndex: 0, bottom: 10 }
            ] : [],
            toolbox: {
                show: true,
                feature: {
                    dataZoom: { show: enabled },
                    restore: { show: true },
                    saveAsImage: { show: true }
                },
                right: 20,
                top: 10
            }
        });

        if (typeof showToast === 'function') showToast(`Zoom/Pan ${enabled ? 'aktif' : 'devre dışı'}`, 'info');
    }

    function toggleDataLabels(chartId, show = true, position = 'top') {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        const option = chart.getOption();
        if (option.series) {
            option.series.forEach((s, i) => {
                chart.setOption({
                    series: [{
                        id: i,
                        label: {
                            show: show,
                            position: position,
                            formatter: '{c}'
                        }
                    }]
                }, { replaceMerge: ['series'] });
            });
        }

        if (typeof showToast === 'function') showToast(`Veri etiketleri ${show ? 'açık' : 'kapalı'}`, 'info');
    }

    function toggleGridLines(chartId, showMajor = true, showMinor = false) {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        chart.setOption({
            xAxis: {
                splitLine: { show: showMajor },
                minorSplitLine: { show: showMinor }
            },
            yAxis: {
                splitLine: { show: showMajor },
                minorSplitLine: { show: showMinor }
            }
        });

        if (typeof showToast === 'function') showToast('Grid çizgileri güncellendi', 'info');
    }

    // =====================================================
    // SET FUNCTIONS (viz.js lines 6078-6280)
    // =====================================================

    function setWidgetGrid(chartId, cols, rows) {
        const widget = document.querySelector(`[data-chart-id="${chartId}"]`);
        if (!widget) return;

        widget.style.gridColumn = `span ${cols}`;
        widget.style.gridRow = `span ${rows}`;

        const chart = VIZ_STATE.echartsInstances[chartId];
        if (chart) {
            setTimeout(() => chart.resize(), 100);
        }

        if (typeof showToast === 'function') showToast(`Widget ${cols}x${rows} boyutuna ayarlandı`, 'success');
    }

    function setLegendPosition(chartId, position) {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        const positions = {
            'top': { top: 30, left: 'center' },
            'bottom': { bottom: 10, left: 'center' },
            'left': { left: 10, top: 'middle', orient: 'vertical' },
            'right': { right: 10, top: 'middle', orient: 'vertical' },
            'top-left': { top: 30, left: 10 },
            'top-right': { top: 30, right: 10 },
            'hidden': { show: false }
        };

        chart.setOption({
            legend: positions[position] || positions['top']
        });

        if (typeof showToast === 'function') showToast(`Legend pozisyonu: ${position}`, 'info');
    }

    function setAnimationSpeed(chartId, speed = 'medium') {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        const speeds = {
            'slow': 2000,
            'medium': 1000,
            'fast': 300,
            'instant': 0
        };

        chart.setOption({
            animation: speed !== 'instant',
            animationDuration: speeds[speed] || 1000,
            animationEasing: 'cubicOut'
        });

        if (typeof showToast === 'function') showToast(`Animasyon hızı: ${speed}`, 'info');
    }

    function setColorPalette(chartId, paletteName) {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        const palette = COLOR_PALETTES[paletteName] || COLOR_PALETTES['default'];

        chart.setOption({
            color: palette
        });

        if (typeof showToast === 'function') showToast(`Renk paleti: ${paletteName}`, 'info');
    }

    function setChartTheme(chartId, theme) {
        const config = VIZ_STATE.charts.find(c => c.id === chartId);
        if (config) {
            config.theme = theme;
            if (typeof renderChart === 'function') renderChart(config);
            if (typeof showToast === 'function') showToast(`Tema: ${theme}`, 'info');
        }
    }

    function setFontFamily(chartId, fontFamily) {
        const chart = VIZ_STATE.echartsInstances[chartId];
        if (!chart) return;

        chart.setOption({
            textStyle: {
                fontFamily: fontFamily
            }
        });

        if (typeof showToast === 'function') showToast(`Font: ${fontFamily}`, 'info');
    }

    // =====================================================
    // SHOW MODALS (viz.js lines 8400-8456, 8748-8796)
    // =====================================================

    function showFilePreviewModal(rawData, fileName, sheets = null) {
        let modal = document.querySelector('.viz-file-preview-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'viz-file-preview-modal';
            modal.innerHTML = `
                <div class="viz-file-preview-content">
                    <div class="viz-file-preview-header">
                        <h3><i class="fas fa-file-excel"></i> <span id="previewFileName">Dosya Önizleme</span></h3>
                        <button class="viz-file-preview-close" onclick="closeFilePreviewModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="viz-file-preview-options">
                        <label><i class="fas fa-layer-group"></i> Sayfa:
                            <select id="previewSheetSelect" onchange="updatePreviewSheet()"></select>
                        </label>
                        <label><i class="fas fa-heading"></i> Başlık Satırı:
                            <select id="previewHeaderRow" onchange="updatePreviewHighlight()">
                                <option value="0">1. Satır</option>
                                <option value="1">2. Satır</option>
                                <option value="2">3. Satır</option>
                                <option value="3">4. Satır</option>
                                <option value="4">5. Satır</option>
                            </select>
                        </label>
                    </div>
                    <div class="viz-file-preview-table" id="previewTableContainer"></div>
                    <div class="viz-file-preview-footer">
                        <button class="viz-file-preview-cancel" onclick="closeFilePreviewModal()">İptal</button>
                        <button class="viz-file-preview-load" onclick="confirmFileLoad()">Veriyi Yükle</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        window.filePreviewData = { rawData, fileName, sheets };

        document.getElementById('previewFileName').textContent = fileName;

        const sheetSelect = document.getElementById('previewSheetSelect');
        sheetSelect.innerHTML = '';
        if (sheets && sheets.length > 1) {
            sheets.forEach((sheet, i) => {
                sheetSelect.innerHTML += `<option value="${i}">${sheet}</option>`;
            });
        } else {
            sheetSelect.innerHTML = '<option value="0">Sheet1</option>';
        }

        if (typeof renderPreviewTable === 'function') renderPreviewTable(rawData);

        modal.style.display = 'flex';
    }

    function showDataProfileModal() {
        if (!VIZ_STATE.data) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const profile = typeof generateDataProfile === 'function' ? generateDataProfile() : null;
        if (profile) {
            let content = '<div style="max-height:400px; overflow-y:auto;">';
            content += '<table class="viz-stat-table"><tr><th>Sütun</th><th>Tip</th><th>Unique</th><th>Missing</th><th>Min</th><th>Max</th></tr>';

            Object.entries(profile.columns || {}).forEach(([col, p]) => {
                content += `<tr>
                    <td>${col}</td>
                    <td>${p.data_type || '-'}</td>
                    <td>${p.unique_count || '-'}</td>
                    <td>${p.missing_count || '-'}</td>
                    <td>${p.min !== undefined ? p.min : '-'}</td>
                    <td>${p.max !== undefined ? p.max : '-'}</td>
                </tr>`;
            });

            content += '</table></div>';
            showStatResultModal('Veri Profili', content);
        }
    }

    function showStatResultModal(title, content) {
        let modal = document.querySelector('.viz-stat-result-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'viz-stat-result-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100003;';
            modal.innerHTML = `
                <div style="background:var(--gm-card-bg);border-radius:12px;max-width:700px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid var(--gm-card-border);">
                        <h3 id="statModalTitle" style="margin:0;font-size:1rem;"></h3>
                        <button onclick="this.closest('.viz-stat-result-modal').style.display='none'" style="background:none;border:none;color:var(--gm-text-muted);font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    <div id="statModalContent" style="padding:20px;overflow-y:auto;"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('statModalTitle').textContent = title;
        document.getElementById('statModalContent').innerHTML = content;
        modal.style.display = 'flex';
    }

    function showContextualHelp(topic) {
        const helps = {
            'chart-types': 'Grafik tipleri: Bar (kategoriler), Line (trend), Pie (oranlar), Scatter (ilişki), Histogram (dağılım)',
            'data-transform': 'Veri dönüştürme: Log, normalize, z-score, binning, hesaplanan sütun oluşturabilirsiniz',
            'statistics': 'İstatistik testleri: t-Test, ANOVA, Chi-Square, Korelasyon, Normallik testleri yapabilirsiniz',
            'export': 'Export: PNG, PDF, SVG, CSV, JSON ve tek dosya HTML olarak dışa aktarabilirsiniz',
            'filter': 'Filtreleme: Eşit, içerir, büyük, küçük operatörleri ile çoklu filtre uygulayabilirsiniz'
        };

        const help = helps[topic] || 'Yardım konusu bulunamadı';
        if (typeof showToast === 'function') showToast(help, 'info');
    }

    // =====================================================
    // JOIN MODAL (viz.js lines 12500-12637)
    // =====================================================

    function showJoinModal() {
        const datasets = VIZ_STATE.getDatasetList();

        if (datasets.length < 2) {
            if (typeof showToast === 'function') showToast('En az 2 veri seti gerekli', 'warning');
            return;
        }

        const getText = window.getText || ((k) => k);

        const modal = document.createElement('div');
        modal.className = 'viz-stat-modal-overlay';
        modal.innerHTML = `
            <div class="viz-stat-modal">
                <div class="viz-stat-modal-header">
                    <h3><i class="fas fa-code-merge"></i> Veri Birleştirme (JOIN)</h3>
                    <button onclick="this.closest('.viz-stat-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="viz-stat-modal-body">
                    <div class="viz-modal-form">
                        <div class="viz-form-row">
                            <label>Sol Tablo</label>
                            <select id="joinLeftDataset">
                                ${datasets.map(d => `<option value="${d.id}">${d.name} (${d.rowCount} satır)</option>`).join('')}
                            </select>
                        </div>
                        <div class="viz-form-row">
                            <label>Sol Anahtar</label>
                            <select id="joinLeftKey"></select>
                        </div>
                        <hr style="margin: 15px 0; border-color: var(--gm-divider);">
                        <div class="viz-form-row">
                            <label>Sağ Tablo</label>
                            <select id="joinRightDataset">
                                ${datasets.map((d, i) => `<option value="${d.id}" ${i === 1 ? 'selected' : ''}>${d.name} (${d.rowCount} satır)</option>`).join('')}
                            </select>
                        </div>
                        <div class="viz-form-row">
                            <label>Sağ Anahtar</label>
                            <select id="joinRightKey"></select>
                        </div>
                        <hr style="margin: 15px 0; border-color: var(--gm-divider);">
                        <div class="viz-form-row">
                            <label>Birleştirme Tipi</label>
                            <select id="joinType">
                                <option value="left">Left Join</option>
                                <option value="inner">Inner Join</option>
                                <option value="outer">Outer Join</option>
                                <option value="right">Right Join</option>
                            </select>
                        </div>
                        <button class="gm-gradient-btn" onclick="executeJoin()" style="width:100%;margin-top:15px;">
                            <i class="fas fa-play"></i> Birleştir
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const updateColumns = () => {
            const leftId = document.getElementById('joinLeftDataset').value;
            const rightId = document.getElementById('joinRightDataset').value;

            const leftDs = VIZ_STATE.getDatasetById(leftId);
            const rightDs = VIZ_STATE.getDatasetById(rightId);

            document.getElementById('joinLeftKey').innerHTML =
                leftDs?.columns.map(c => `<option value="${c}">${c}</option>`).join('') || '';
            document.getElementById('joinRightKey').innerHTML =
                rightDs?.columns.map(c => `<option value="${c}">${c}</option>`).join('') || '';
        };

        document.getElementById('joinLeftDataset').onchange = updateColumns;
        document.getElementById('joinRightDataset').onchange = updateColumns;
        updateColumns();
    }

    async function executeJoin() {
        const leftId = document.getElementById('joinLeftDataset').value;
        const rightId = document.getElementById('joinRightDataset').value;
        const leftKey = document.getElementById('joinLeftKey').value;
        const rightKey = document.getElementById('joinRightKey').value;
        const joinType = document.getElementById('joinType').value;

        const leftDs = VIZ_STATE.getDatasetById(leftId);
        const rightDs = VIZ_STATE.getDatasetById(rightId);

        if (!leftDs?.file || !rightDs?.file) {
            if (typeof showToast === 'function') showToast('Veri seti dosyaları bulunamadı', 'error');
            return;
        }

        if (typeof showToast === 'function') showToast('Birleştiriliyor...', 'info');

        const formData = new FormData();
        formData.append('left_file', leftDs.file);
        formData.append('right_file', rightDs.file);
        formData.append('left_key', leftKey);
        formData.append('right_key', rightKey);
        formData.append('join_type', joinType);

        try {
            const response = await fetch('/viz/join', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Birleştirme hatası');
            }

            const result = await response.json();

            const newFile = new File([JSON.stringify(result.data)], `join_${leftDs.name}_${rightDs.name}.json`, { type: 'application/json' });
            VIZ_STATE.addDataset(newFile, result.data, result.columns, result.columns_info, []);

            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
            if (typeof updateDataProfile === 'function') updateDataProfile();
            if (typeof updateDatasetSelector === 'function') updateDatasetSelector();

            document.querySelector('.viz-stat-modal-overlay')?.remove();

            if (typeof showToast === 'function') showToast(`Birleştirildi! ${result.row_count} satır oluşturuldu`, 'success');

        } catch (error) {
            console.error('JOIN hatası:', error);
            if (typeof showToast === 'function') showToast('Birleştirme hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // GOOGLE SHEETS MODAL (viz.js lines 12910-13012)
    // =====================================================

    function showGoogleSheetsModal() {
        const getText = window.getText || ((k) => k);

        const modal = document.createElement('div');
        modal.className = 'viz-stat-modal-overlay';
        modal.innerHTML = `
            <div class="viz-stat-modal" style="max-width:550px;">
                <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#4285F4,#34A853);">
                    <h3><i class="fab fa-google-drive"></i> Google Sheets</h3>
                    <button onclick="this.closest('.viz-stat-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="viz-stat-modal-body">
                    <div class="viz-modal-form">
                        <p style="color:var(--gm-text-muted);margin-bottom:15px;">
                            Google Sheets'ten veri çekmek için Spreadsheet ID girin.
                        </p>
                        
                        <div class="viz-form-row">
                            <label>Spreadsheet ID</label>
                            <input type="text" id="gsSpreadsheetId" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms">
                            <small style="color:var(--gm-text-muted);">URL'deki /d/ ile /edit arasındaki kısım</small>
                        </div>
                        
                        <div class="viz-form-row">
                            <label>Sayfa Adı (opsiyonel)</label>
                            <input type="text" id="gsSheetName" placeholder="Sheet1">
                        </div>
                        
                        <button class="gm-gradient-btn" onclick="importGoogleSheet()" style="width:100%;margin-top:10px;">
                            <i class="fas fa-download"></i> Veri Çek
                        </button>
                        
                        <hr style="margin:20px 0;border-color:var(--gm-divider);">
                        
                        <button class="viz-btn-secondary" onclick="connectGoogleOAuth()" style="width:100%;">
                            <i class="fab fa-google"></i> Google ile Bağlan
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async function importGoogleSheet() {
        const spreadsheetId = document.getElementById('gsSpreadsheetId').value.trim();
        const sheetName = document.getElementById('gsSheetName').value.trim();

        if (!spreadsheetId) {
            if (typeof showToast === 'function') showToast('Spreadsheet ID gerekli', 'warning');
            return;
        }

        if (typeof showToast === 'function') showToast('Google Sheets verisi çekiliyor...', 'info');

        try {
            const response = await fetch('/viz/google/import-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spreadsheet_id: spreadsheetId,
                    sheet_name: sheetName || null
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Import hatası');
            }

            const result = await response.json();

            const fakeFile = new File([JSON.stringify(result.data)], `${result.sheet_name}.json`, { type: 'application/json' });
            VIZ_STATE.addDataset(fakeFile, result.data, result.columns, result.columns_info, []);

            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
            if (typeof updateDataProfile === 'function') updateDataProfile();
            if (typeof updateDatasetSelector === 'function') updateDatasetSelector();

            document.querySelector('.viz-stat-modal-overlay')?.remove();
            if (typeof showToast === 'function') showToast(`${result.row_count} satır Google Sheets'ten yüklendi`, 'success');

        } catch (error) {
            if (typeof showToast === 'function') showToast('Google Sheets hatası: ' + error.message, 'error');
        }
    }

    async function connectGoogleOAuth() {
        try {
            const response = await fetch('/viz/google/auth-url');
            const data = await response.json();

            if (data.auth_url) {
                window.open(data.auth_url, '_blank', 'width=500,height=600');
                if (typeof showToast === 'function') showToast('Google OAuth penceresi açıldı', 'info');
            }
        } catch (error) {
            if (typeof showToast === 'function') showToast('OAuth hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // SQL MODAL (viz.js lines 13018-13165)
    // =====================================================

    function showSQLModal() {
        const getText = window.getText || ((k) => k);

        const modal = document.createElement('div');
        modal.className = 'viz-stat-modal-overlay';
        modal.innerHTML = `
            <div class="viz-stat-modal" style="max-width:650px;">
                <div class="viz-stat-modal-header" style="background:linear-gradient(135deg,#336791,#0d96f2);">
                    <h3><i class="fas fa-database"></i> SQL Sorgusu</h3>
                    <button onclick="this.closest('.viz-stat-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="viz-stat-modal-body">
                    <div class="viz-modal-form">
                        <div class="viz-form-row">
                            <label>Bağlantı String</label>
                            <input type="text" id="sqlConnString" placeholder="postgresql://user:pass@host:5432/dbname">
                            <small style="color:var(--gm-text-muted);">PostgreSQL, MySQL, SQLite desteklenir</small>
                        </div>
                        
                        <button class="viz-btn-secondary" onclick="testSQLConnection()" style="margin-bottom:15px;">
                            <i class="fas fa-plug"></i> Bağlantıyı Test Et
                        </button>
                        
                        <div class="viz-form-row">
                            <label>SQL Sorgusu</label>
                            <textarea id="sqlQuery" rows="4" placeholder="SELECT * FROM customers LIMIT 100" 
                                style="font-family:monospace;font-size:0.85rem;"></textarea>
                        </div>
                        
                        <div class="viz-form-row">
                            <label>Maksimum Satır</label>
                            <input type="number" id="sqlMaxRows" value="1000" min="1" max="10000">
                        </div>
                        
                        <button class="gm-gradient-btn" onclick="executeSQLQuery()" style="width:100%;margin-top:10px;">
                            <i class="fas fa-play"></i> Sorguyu Çalıştır
                        </button>
                        
                        <div id="sqlTablesPreview" style="margin-top:15px;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async function testSQLConnection() {
        const connString = document.getElementById('sqlConnString').value.trim();

        if (!connString) {
            if (typeof showToast === 'function') showToast('Bağlantı string gerekli', 'warning');
            return;
        }

        if (typeof showToast === 'function') showToast('Bağlantı test ediliyor...', 'info');

        try {
            const response = await fetch('/viz/sql/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connection_string: connString })
            });

            const result = await response.json();

            if (result.success) {
                if (typeof showToast === 'function') showToast(`Bağlantı başarılı! DB: ${result.database}`, 'success');

                const tablesRes = await fetch('/viz/sql/list-tables', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `connection_string=${encodeURIComponent(connString)}`
                });

                const tables = await tablesRes.json();

                if (tables.tables?.length > 0) {
                    let html = '<h5 style="margin:10px 0;color:var(--gm-primary);">Tablolar</h5>';
                    html += '<div style="max-height:150px;overflow-y:auto;">';
                    tables.tables.forEach(t => {
                        html += `<div style="padding:5px;cursor:pointer;border-radius:4px;" 
                            onclick="document.getElementById('sqlQuery').value='SELECT * FROM ${t.name} LIMIT 100'"
                            onmouseover="this.style.background='rgba(74,144,217,0.1)'"
                            onmouseout="this.style.background='transparent'">
                            <strong>${t.name}</strong> <small>(${t.column_count} sütun)</small>
                        </div>`;
                    });
                    html += '</div>';
                    document.getElementById('sqlTablesPreview').innerHTML = html;
                }
            } else {
                throw new Error(result.detail || 'Bağlantı başarısız');
            }
        } catch (error) {
            if (typeof showToast === 'function') showToast('Bağlantı hatası: ' + error.message, 'error');
        }
    }

    async function executeSQLQuery() {
        const connString = document.getElementById('sqlConnString').value.trim();
        const query = document.getElementById('sqlQuery').value.trim();
        const maxRows = parseInt(document.getElementById('sqlMaxRows').value) || 1000;

        if (!connString || !query) {
            if (typeof showToast === 'function') showToast('Bağlantı ve sorgu gerekli', 'warning');
            return;
        }

        if (typeof showToast === 'function') showToast('Sorgu çalıştırılıyor...', 'info');

        try {
            const response = await fetch('/viz/sql/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connection_string: connString,
                    query: query,
                    max_rows: maxRows
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Sorgu hatası');
            }

            const result = await response.json();

            const fakeFile = new File([JSON.stringify(result.data)], 'sql_query.json', { type: 'application/json' });
            VIZ_STATE.addDataset(fakeFile, result.data, result.columns, result.columns_info, []);

            if (typeof renderColumnsList === 'function') renderColumnsList();
            if (typeof updateDropdowns === 'function') updateDropdowns();
            if (typeof updateDataProfile === 'function') updateDataProfile();
            if (typeof updateDatasetSelector === 'function') updateDatasetSelector();

            document.querySelector('.viz-stat-modal-overlay')?.remove();
            if (typeof showToast === 'function') showToast(`${result.row_count} satır SQL'den yüklendi`, 'success');

        } catch (error) {
            if (typeof showToast === 'function') showToast('SQL hatası: ' + error.message, 'error');
        }
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.COLOR_PALETTES = COLOR_PALETTES;
    window.VERSION_HISTORY = VERSION_HISTORY;
    window.saveVersion = saveVersion;
    window.restoreVersion = restoreVersion;
    window.listVersions = listVersions;
    window.saveDashboard = saveDashboard;
    window.loadDashboardFromStorage = loadDashboardFromStorage;
    window.saveToSessionStorage = saveToSessionStorage;
    window.toggleFullscreen = toggleFullscreen;
    window.toggleZoomPan = toggleZoomPan;
    window.toggleDataLabels = toggleDataLabels;
    window.toggleGridLines = toggleGridLines;
    window.setWidgetGrid = setWidgetGrid;
    window.setLegendPosition = setLegendPosition;
    window.setAnimationSpeed = setAnimationSpeed;
    window.setColorPalette = setColorPalette;
    window.setChartTheme = setChartTheme;
    window.setFontFamily = setFontFamily;
    window.showFilePreviewModal = showFilePreviewModal;
    window.showDataProfileModal = showDataProfileModal;
    window.showStatResultModal = showStatResultModal;
    window.showContextualHelp = showContextualHelp;
    window.showJoinModal = showJoinModal;
    window.executeJoin = executeJoin;
    window.showGoogleSheetsModal = showGoogleSheetsModal;
    window.importGoogleSheet = importGoogleSheet;
    window.connectGoogleOAuth = connectGoogleOAuth;
    window.showSQLModal = showSQLModal;
    window.testSQLConnection = testSQLConnection;
    window.executeSQLQuery = executeSQLQuery;

    console.log('✅ viz-lib-ui.js loaded - UI & Settings functions ready');
})();
