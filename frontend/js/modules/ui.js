// =====================================================
// UI.JS - Opradox Visual Studio UI Helpers
// Toast notifications, Modals, Settings, Empty states
// =====================================================

import { VIZ_STATE, VIZ_TEXTS, getText } from './core.js';

// -----------------------------------------------------
// TOAST NOTIFICATIONS - FAZ-5: Delegated to Central System
// Now uses window.showToast from toast.js
// -----------------------------------------------------

/**
 * Proxy to central Toast system (FAZ-5)
 * Delegates all calls to window.showToast from toast.js
 */
export function showToast(message, type = 'info', duration = 5000) {
    // FAZ-5: Use central Toast system
    if (typeof window.showToast === 'function') {
        return window.showToast(message, type, duration);
    }
    // Fallback: console log if central system not loaded
    console.warn('[UI.JS] Central Toast not available, message:', message);
}

// Legacy repositionToasts - no longer needed with central system
function repositionToasts() {
    // Kept for backward compatibility - central system handles positioning
}

// Make repositionToasts available globally for close button
window.repositionToasts = repositionToasts;


// -----------------------------------------------------
// SETTINGS PANEL
// -----------------------------------------------------
export function showSettings(config) {
    document.getElementById('vizNoSelection').style.display = 'none';
    document.getElementById('vizSettingsForm').style.display = 'block';

    document.getElementById('chartTitle').value = config.title;

    // X Ekseni
    const xAxisSelect = document.getElementById('chartXAxis');
    if (xAxisSelect) {
        if (config.type === 'scatter') {
            xAxisSelect.multiple = true;
            xAxisSelect.size = 4;
            Array.from(xAxisSelect.options).forEach(opt => {
                opt.selected = (config.xAxes || [config.xAxis]).includes(opt.value);
            });
        } else {
            xAxisSelect.multiple = false;
            xAxisSelect.size = 1;
            xAxisSelect.value = config.xAxis;
        }
    }

    // Y Ekseni (çoklu seçim desteği)
    const yAxisSelect = document.getElementById('chartYAxis');
    if (yAxisSelect) {
        yAxisSelect.multiple = true;
        yAxisSelect.size = 4;
        Array.from(yAxisSelect.options).forEach(opt => {
            opt.selected = (config.yAxes || [config.yAxis]).includes(opt.value);
        });
    }

    // Dual axis
    const useDualAxis = document.getElementById('useDualAxis');
    const y2AxisSelect = document.getElementById('chartY2Axis');
    const y2AxisWrapper = document.getElementById('y2AxisWrapper');

    if (useDualAxis) useDualAxis.checked = config.useDualAxis || false;
    if (y2AxisWrapper) y2AxisWrapper.style.display = config.useDualAxis ? 'block' : 'none';
    if (y2AxisSelect && config.y2Axis) y2AxisSelect.value = config.y2Axis;

    document.getElementById('chartAggregation').value = config.aggregation;
    document.getElementById('chartColor').value = config.color;

    const colorPreview = document.querySelector('.viz-color-preview');
    if (colorPreview) colorPreview.style.background = config.color;

    const dataLimitInput = document.getElementById('chartDataLimit');
    if (dataLimitInput) dataLimitInput.value = config.dataLimit || 20;
}

export function hideSettings() {
    document.getElementById('vizNoSelection').style.display = 'flex';
    document.getElementById('vizSettingsForm').style.display = 'none';
    VIZ_STATE.selectedChart = null;
    document.querySelectorAll('.viz-chart-widget').forEach(w => w.classList.remove('selected'));
}

export function applyChartSettings() {
    if (!VIZ_STATE.selectedChart) return;

    const config = VIZ_STATE.charts.find(c => c.id === VIZ_STATE.selectedChart);
    if (!config) return;

    config.title = document.getElementById('chartTitle').value;

    // X Ekseni
    const xAxisSelect = document.getElementById('chartXAxis');
    if (xAxisSelect) {
        if (config.type === 'scatter' && xAxisSelect.multiple) {
            const selectedXAxes = Array.from(xAxisSelect.selectedOptions).map(opt => opt.value).filter(v => v);
            config.xAxes = selectedXAxes.length > 0 ? selectedXAxes : [config.xAxis];
            config.xAxis = config.xAxes[0];
        } else {
            config.xAxis = xAxisSelect.value;
            config.xAxes = [config.xAxis];
        }
    }

    // Y Ekseni
    const yAxisSelect = document.getElementById('chartYAxis');
    if (yAxisSelect) {
        const selectedYAxes = Array.from(yAxisSelect.selectedOptions).map(opt => opt.value).filter(v => v);
        config.yAxes = selectedYAxes.length > 0 ? selectedYAxes : [config.yAxis];
        config.yAxis = config.yAxes[0];
    }

    // Dual axis
    const useDualAxisCheck = document.getElementById('useDualAxis');
    const y2AxisSelect = document.getElementById('chartY2Axis');
    config.useDualAxis = useDualAxisCheck?.checked || false;
    config.y2Axis = y2AxisSelect?.value || null;

    config.aggregation = document.getElementById('chartAggregation').value;
    config.color = document.getElementById('chartColor').value;

    const dataLimitInput = document.getElementById('chartDataLimit');
    if (dataLimitInput) config.dataLimit = parseInt(dataLimitInput.value) || 0;

    // Widget başlığını güncelle
    const widget = document.getElementById(config.id);
    if (widget) {
        const titleEl = widget.querySelector('.viz-widget-title');
        if (titleEl) titleEl.textContent = config.title;
    }

    // Grafiği yeniden render et
    if (typeof renderChart === 'function') renderChart(config);
    showToast(getText('toast_chart_settings_applied'), 'success');
}

// -----------------------------------------------------
// EMPTY STATE
// -----------------------------------------------------
export function updateEmptyState() {
    const empty = document.getElementById('vizEmptyCanvas');
    const dashboard = document.getElementById('vizDashboardGrid');
    if (empty && dashboard) {
        const widgetCount = dashboard.querySelectorAll('.viz-chart-widget').length;
        empty.style.display = widgetCount === 0 ? 'flex' : 'none';
    }
}

// -----------------------------------------------------
// CLEAR & DELETE
// -----------------------------------------------------
export function deleteSelectedChart() {
    if (!VIZ_STATE.selectedChart) return;

    const chartId = VIZ_STATE.selectedChart;

    // ECharts instance'ı temizle
    if (VIZ_STATE.echartsInstances[chartId]) {
        VIZ_STATE.echartsInstances[chartId].dispose();
        delete VIZ_STATE.echartsInstances[chartId];
    }

    // DOM'dan kaldır
    const widget = document.getElementById(chartId);
    if (widget) widget.remove();

    // State'den kaldır
    VIZ_STATE.charts = VIZ_STATE.charts.filter(c => c.id !== chartId);

    hideSettings();
    updateEmptyState();
}

export function clearDashboard() {
    VIZ_STATE.charts.forEach(c => {
        if (VIZ_STATE.echartsInstances[c.id]) {
            VIZ_STATE.echartsInstances[c.id].dispose();
            delete VIZ_STATE.echartsInstances[c.id];
        }
        const widget = document.getElementById(c.id);
        if (widget) widget.remove();
    });

    VIZ_STATE.charts = [];
    VIZ_STATE.chartCounter = 0;

    hideSettings();
    updateEmptyState();
}

// -----------------------------------------------------
// SAVE & LOAD DASHBOARD
// -----------------------------------------------------
// FAZ-5: Global Export Menu
export function showExportMenu() {
    const modal = document.createElement('div');
    modal.className = 'viz-stat-modal-overlay';
    modal.innerHTML = `
        <div class="viz-stat-modal" style="max-width: 450px;">
            <div class="viz-stat-modal-header" style="background: linear-gradient(135deg, #2c3e50, #4ca1af);">
                <h3><i class="fas fa-file-export"></i> Dışa Aktar / Export</h3>
                <button onclick="this.closest('.viz-stat-modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">
                <div class="viz-export-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <!-- Dashboard Image -->
                    <div class="viz-export-card" onclick="exportPNG()" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                        <i class="fas fa-image" style="font-size: 2rem; color: #4a90d9; margin-bottom: 10px;"></i>
                        <h4 style="margin: 0; font-size: 0.9rem;">Dashboard (PNG)</h4>
                        <small style="color: #888;">Görüntüyü İndir</small>
                    </div>

                    <!-- Dashboard PDF -->
                    <div class="viz-export-card" onclick="exportPDF()" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                        <i class="fas fa-file-pdf" style="font-size: 2rem; color: #e74c3c; margin-bottom: 10px;"></i>
                        <h4 style="margin: 0; font-size: 0.9rem;">Smart Report (PDF)</h4>
                        <small style="color: #888;">A4 Rapor Formatı</small>
                    </div>

                    <!-- Data CSV -->
                    <div class="viz-export-card" onclick="if(window.exportDataAsCSV) window.exportDataAsCSV(); else console.error('CSV export missing')" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                        <i class="fas fa-file-csv" style="font-size: 2rem; color: #2ecc71; margin-bottom: 10px;"></i>
                        <h4 style="margin: 0; font-size: 0.9rem;">Veri (CSV)</h4>
                        <small style="color: #888;">Excel Uyumlu</small>
                    </div>

                    <!-- Data JSON -->
                    <div class="viz-export-card" onclick="if(window.exportDataAsJSON) window.exportDataAsJSON(); else console.error('JSON export missing')" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                        <i class="fas fa-code" style="font-size: 2rem; color: #f39c12; margin-bottom: 10px;"></i>
                        <h4 style="margin: 0; font-size: 0.9rem;">Veri (JSON)</h4>
                        <small style="color: #888;">Ham Veri</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Hover effect via JS
    modal.querySelectorAll('.viz-export-card').forEach(card => {
        card.onmouseenter = () => { card.style.background = 'rgba(255,255,255,0.1)'; card.style.borderColor = '#4a90d9'; };
        card.onmouseleave = () => { card.style.background = 'rgba(255,255,255,0.05)'; card.style.borderColor = 'rgba(255,255,255,0.1)'; };
    });
}

// FAZ-5: Export PNG
export async function exportPNG() {
    if (typeof html2canvas === 'undefined') { showToast('html2canvas kütüphanesi yüklenemedi', 'error'); return; }

    showToast('Dashboard görüntüleniyor (PNG)...', 'info');
    const dashboard = document.getElementById('vizDashboardGrid'); // Capture only the grid

    try {
        const canvas = await html2canvas(dashboard || document.body, {
            backgroundColor: '#1a1a2e', // Dark theme bg
            scale: 2
        });

        const link = document.createElement('a');
        link.download = `dashboard_export_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        showToast('PNG başarıyla indirildi', 'success');
        document.querySelector('.viz-stat-modal-overlay')?.remove();
    } catch (e) {
        console.error('PNG Export Error:', e);
        showToast('Görüntü oluşturulamadı: ' + e.message, 'error');
    }
}

// FAZ-5: Export PDF (Smart Report)
export async function exportPDF() {
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        showToast('PDF kütüphaneleri (html2canvas/jspdf) eksik', 'error');
        return;
    }
    const { jsPDF } = jspdf;

    showToast('PDF Raporu hazırlanıyor...', 'info');
    const dashboard = document.getElementById('vizDashboardGrid');

    try {
        const canvas = await html2canvas(dashboard || document.body, {
            backgroundColor: '#1a1a2e',
            scale: 2
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add Header
        pdf.setFillColor(40, 40, 40);
        pdf.rect(0, 0, pdfWidth, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('Opradox Visual Studio Report', 10, 13);
        pdf.setFontSize(10);
        pdf.text(new Date().toLocaleString(), pdfWidth - 50, 13);

        // Add Image
        let heightLeft = imgHeight;
        let position = 25; // Margin top

        // Simple fit for single page view usually preferred for dashboard
        if (imgHeight < pdfHeight - 30) {
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        } else {
            // Fit to page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight - 30);
        }

        pdf.save(`opradox_report_${new Date().toISOString().slice(0, 10)}.pdf`);

        showToast('PDF başarıyla indirildi', 'success');
        document.querySelector('.viz-stat-modal-overlay')?.remove();
    } catch (e) {
        console.error('PDF Export Error:', e);
        showToast('PDF oluşturulamadı: ' + e.message, 'error');
    }
}
export function showSaveMenu() {
    saveDashboard();
}

export function saveDashboard() {
    const dashboardData = {
        charts: VIZ_STATE.charts,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('opradox_viz_dashboard', JSON.stringify(dashboardData));
    showToast(getText('dashboard_saved'), 'success');
}

export function loadDashboardFromStorage() {
    try {
        const saved = localStorage.getItem('opradox_viz_dashboard');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.charts && Array.isArray(data.charts)) {
                data.charts.forEach(config => {
                    VIZ_STATE.charts.push(config);
                    if (typeof createChartWidget === 'function') createChartWidget(config);
                });
                updateEmptyState();
                console.log(`📊 Dashboard yüklendi: ${data.charts.length} grafik`);
            }
        }
    } catch (e) {
        console.warn('Dashboard yükleme hatası:', e);
    }
}

// -----------------------------------------------------
// MODAL HELPERS
// -----------------------------------------------------
export function createModal(id, title, content, options = {}) {
    const existingModal = document.getElementById(id);
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'viz-stat-modal-overlay';

    const headerStyle = options.headerStyle || '';

    modal.innerHTML = `
        <div class="viz-stat-modal" style="${options.width ? `max-width:${options.width};` : ''}">
            <div class="viz-stat-modal-header" style="${headerStyle}">
                <h3>${title}</h3>
                <button onclick="document.getElementById('${id}').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="viz-stat-modal-body">${content}</div>
        </div>
    `;

    document.body.appendChild(modal);

    // Dışarı tıklayınca kapat
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    return modal;
}

export function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
}

// -----------------------------------------------------
// SESSION STORAGE
// -----------------------------------------------------
export function loadFromSessionStorage() {
    try {
        const excelData = sessionStorage.getItem('opradox_excel_data');
        if (excelData) {
            const parsed = JSON.parse(excelData);
            VIZ_STATE.data = parsed.data || [];
            VIZ_STATE.columns = parsed.columns || [];
            showToast(getText('toast_data_loaded_from_excel').replace('{0}', VIZ_STATE.data.length), 'success');
            return true;
        }
    } catch (e) {
        console.warn('SessionStorage veri yükleme hatası:', e);
    }
    return false;
}

export function saveToSessionStorage(data, columns) {
    try {
        sessionStorage.setItem('opradox_excel_data', JSON.stringify({ data, columns }));
        showToast(getText('toast_data_saved_to_session'), 'success');
    } catch (e) {
        showToast(getText('toast_session_save_error'), 'error');
    }
}

// -----------------------------------------------------
// PROGRESS BAR (LOADING INDICATOR)
// -----------------------------------------------------
let progressElement = null;

export function showProgress(message = 'Yükleniyor...', percent = null) {
    // Remove existing progress if any
    hideProgress();

    const progressHtml = `
        <div id="vizProgressOverlay" class="viz-progress-overlay">
            <div class="viz-progress-container">
                <div class="viz-progress-spinner"></div>
                <p class="viz-progress-message">${message}</p>
                ${percent !== null ? `
                    <div class="viz-progress-bar-wrapper">
                        <div class="viz-progress-bar" style="width: ${percent}%"></div>
                    </div>
                    <span class="viz-progress-percent">${percent}%</span>
                ` : ''}
            </div>
        </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('viz-progress-styles')) {
        const style = document.createElement('style');
        style.id = 'viz-progress-styles';
        style.textContent = `
            .viz-progress-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                backdrop-filter: blur(4px);
            }
            .viz-progress-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                padding: 40px 60px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .viz-progress-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: #4a90d9;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: vizSpin 1s linear infinite;
            }
            @keyframes vizSpin {
                to { transform: rotate(360deg); }
            }
            .viz-progress-message {
                color: #fff;
                font-size: 16px;
                margin: 0 0 15px 0;
            }
            .viz-progress-bar-wrapper {
                width: 200px;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin: 0 auto;
            }
            .viz-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4a90d9, #27ae60);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            .viz-progress-percent {
                color: #4a90d9;
                font-size: 14px;
                margin-top: 8px;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.insertAdjacentHTML('beforeend', progressHtml);
    progressElement = document.getElementById('vizProgressOverlay');
}

export function hideProgress() {
    const overlay = document.getElementById('vizProgressOverlay');
    if (overlay) {
        overlay.remove();
    }
    progressElement = null;
}

export function updateProgress(message, percent) {
    const overlay = document.getElementById('vizProgressOverlay');
    if (overlay) {
        const msgEl = overlay.querySelector('.viz-progress-message');
        const barEl = overlay.querySelector('.viz-progress-bar');
        const pctEl = overlay.querySelector('.viz-progress-percent');

        if (msgEl && message) msgEl.textContent = message;
        if (barEl && percent !== undefined) barEl.style.width = `${percent}%`;
        if (pctEl && percent !== undefined) pctEl.textContent = `${percent}%`;
    }
}

// -----------------------------------------------------
// VIDEO HELP MODAL
// -----------------------------------------------------
const HELP_VIDEOS = {
    'file-upload': { title: 'Dosya Yükleme', src: 'videos/help_file_upload.mp4' },
    'chart-creation': { title: 'Grafik Oluşturma', src: 'videos/help_chart_creation.mp4' },
    'data-cleaning': { title: 'Veri Temizleme', src: 'videos/help_data_cleaning.mp4' },
    'statistical-analysis': { title: 'İstatistiksel Analiz', src: 'videos/help_stats.mp4' },
    'export-share': { title: 'Dışa Aktarma', src: 'videos/help_export.mp4' }
};

export function showVideoHelpModal() {
    const videoList = Object.entries(HELP_VIDEOS).map(([key, video]) => `
        <div class="viz-video-item" onclick="playHelpVideo('${key}')">
            <i class="fas fa-play-circle"></i>
            <span>${video.title}</span>
        </div>
    `).join('');

    const modalHtml = `
        <div class="viz-modal-overlay" id="videoHelpModal">
            <div class="viz-modal" style="width: 700px; max-height: 80vh;">
                <div class="viz-modal-header">
                    <h3><i class="fas fa-video"></i> Video Yardım</h3>
                    <button class="viz-modal-close" onclick="closeModal('videoHelpModal')">×</button>
                </div>
                <div class="viz-modal-body">
                    <div class="viz-video-list">
                        ${videoList}
                    </div>
                    <div class="viz-video-player" id="helpVideoPlayer" style="display:none;">
                        <video id="helpVideoElement" controls style="width:100%; border-radius: 8px;"></video>
                        <button class="viz-btn viz-btn-secondary" onclick="document.getElementById('helpVideoPlayer').style.display='none'; document.querySelector('.viz-video-list').style.display='grid';" style="margin-top:10px;">
                            <i class="fas fa-arrow-left"></i> Listeye Dön
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add styles
    if (!document.getElementById('viz-video-help-styles')) {
        const style = document.createElement('style');
        style.id = 'viz-video-help-styles';
        style.textContent = `
            .viz-video-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            .viz-video-item {
                background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .viz-video-item:hover {
                transform: translateY(-3px);
                border-color: #4a90d9;
                box-shadow: 0 10px 30px rgba(74, 144, 217, 0.2);
            }
            .viz-video-item i {
                font-size: 24px;
                color: #4a90d9;
            }
            .viz-video-item span {
                color: #fff;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function playHelpVideo(videoKey) {
    const video = HELP_VIDEOS[videoKey];
    if (!video) {
        showToast(getText('toast_video_not_found'), 'error');
        return;
    }

    const player = document.getElementById('helpVideoPlayer');
    const videoEl = document.getElementById('helpVideoElement');
    const list = document.querySelector('.viz-video-list');

    if (player && videoEl && list) {
        list.style.display = 'none';
        player.style.display = 'block';
        videoEl.src = video.src;
        videoEl.play().catch(() => {
            showToast(getText('toast_video_load_failed'), 'warning');
        });
    }
}

// -----------------------------------------------------
// FEEDBACK MODAL
// -----------------------------------------------------
export function showFeedbackModal() {
    const modalHtml = `
        <div class="viz-modal-overlay" id="feedbackModal">
            <div class="viz-modal" style="width: 500px;">
                <div class="viz-modal-header">
                    <h3><i class="fas fa-comment-dots"></i> Geri Bildirim</h3>
                    <button class="viz-modal-close" onclick="closeModal('feedbackModal')">×</button>
                </div>
                <div class="viz-modal-body">
                    <div class="viz-form-group">
                        <label>Geri Bildirim Türü</label>
                        <select id="feedbackType" class="viz-select">
                            <option value="bug">🐛 Hata Bildirimi</option>
                            <option value="feature">💡 Özellik İsteği</option>
                            <option value="improvement">✨ İyileştirme Önerisi</option>
                            <option value="question">❓ Soru</option>
                            <option value="praise">👍 Övgü</option>
                        </select>
                    </div>
                    <div class="viz-form-group">
                        <label>E-posta (isteğe bağlı)</label>
                        <input type="email" id="feedbackEmail" placeholder="ornek@email.com" class="viz-input">
                    </div>
                    <div class="viz-form-group">
                        <label>Mesajınız</label>
                        <textarea id="feedbackMessage" rows="5" placeholder="Geri bildiriminizi buraya yazın..." class="viz-textarea" style="width:100%; resize:vertical;"></textarea>
                    </div>
                    <div class="viz-form-group">
                        <label>
                            <input type="checkbox" id="feedbackIncludeState"> Mevcut durumu ekle (debug için)
                        </label>
                    </div>
                </div>
                <div class="viz-modal-footer">
                    <button class="viz-btn viz-btn-secondary" onclick="closeModal('feedbackModal')">İptal</button>
                    <button class="viz-btn viz-btn-primary" onclick="submitFeedback()">
                        <i class="fas fa-paper-plane"></i> Gönder
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function submitFeedback() {
    const type = document.getElementById('feedbackType')?.value;
    const email = document.getElementById('feedbackEmail')?.value;
    const message = document.getElementById('feedbackMessage')?.value;
    const includeState = document.getElementById('feedbackIncludeState')?.checked;

    if (!message || message.trim().length < 10) {
        showToast(getText('toast_feedback_min_chars'), 'warning');
        return;
    }

    const feedbackData = {
        type,
        email,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    if (includeState && typeof VIZ_STATE !== 'undefined') {
        feedbackData.state = {
            chartsCount: VIZ_STATE.charts?.length || 0,
            dataRowCount: VIZ_STATE.data?.length || 0,
            columnsCount: VIZ_STATE.columns?.length || 0
        };
    }

    // In a real implementation, this would send to a server
    console.log('📧 Feedback submitted:', feedbackData);

    // For now, store locally and show success
    try {
        const existingFeedback = JSON.parse(localStorage.getItem('opradox_feedback') || '[]');
        existingFeedback.push(feedbackData);
        localStorage.setItem('opradox_feedback', JSON.stringify(existingFeedback));
    } catch (e) {
        console.warn('Could not store feedback locally');
    }

    closeModal('feedbackModal');
    showToast(getText('toast_feedback_thanks'), 'success');
}

// -----------------------------------------------------
// WINDOW BINDINGS
// -----------------------------------------------------
// NOTE: showToast is now provided by app.js (central Toast system - FAZ-5)
// window.showToast = showToast;  // REMOVED - using central op-toast from app.js
window.showExportMenu = showExportMenu;
window.exportPNG = exportPNG;
window.exportPDF = exportPDF;
window.showSettings = showSettings;
window.hideSettings = hideSettings;
window.applyChartSettings = applyChartSettings;
window.updateEmptyState = updateEmptyState;
window.deleteSelectedChart = deleteSelectedChart;
window.clearDashboard = clearDashboard;
window.showSaveMenu = showSaveMenu;
window.saveDashboard = saveDashboard;
window.loadDashboardFromStorage = loadDashboardFromStorage;
window.createModal = createModal;
window.closeModal = closeModal;
window.loadFromSessionStorage = loadFromSessionStorage;
window.saveToSessionStorage = saveToSessionStorage;
// New functions
window.showProgress = showProgress;
window.hideProgress = hideProgress;
window.updateProgress = updateProgress;
window.showVideoHelpModal = showVideoHelpModal;
window.playHelpVideo = playHelpVideo;
window.showFeedbackModal = showFeedbackModal;
window.submitFeedback = submitFeedback;

// -----------------------------------------------------
// ANNOTATION MODE (From viz_SOURCE.js:4531-4620)
// Fabric.js annotation layer for charts
// -----------------------------------------------------
let annotationCanvas = null;

export function toggleAnnotationMode() {
    const canvas = document.getElementById('vizCanvas') || document.getElementById('vizDashboardGrid');
    if (!canvas) {
        showToast(getText('toast_dashboard_area_not_found'), 'warning');
        return;
    }

    let fabricWrapper = document.getElementById('fabricWrapper');

    if (fabricWrapper) {
        fabricWrapper.remove();
        annotationCanvas = null;
        showToast(getText('toast_annotation_off'), 'info');
        return;
    }

    // Fabric canvas oluştur
    fabricWrapper = document.createElement('div');
    fabricWrapper.id = 'fabricWrapper';
    fabricWrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:1000;';

    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.id = 'annotationCanvas';
    fabricCanvas.width = canvas.offsetWidth;
    fabricCanvas.height = canvas.offsetHeight;
    fabricWrapper.appendChild(fabricCanvas);
    canvas.style.position = 'relative';
    canvas.appendChild(fabricWrapper);

    if (typeof fabric !== 'undefined') {
        annotationCanvas = new fabric.Canvas('annotationCanvas', {
            isDrawingMode: true,
            selection: true
        });

        annotationCanvas.freeDrawingBrush.color = '#e74c3c';
        annotationCanvas.freeDrawingBrush.width = 3;

        // Toolbar ekle
        const toolbar = document.createElement('div');
        toolbar.className = 'viz-annotation-toolbar';
        toolbar.innerHTML = `
            <button onclick="setAnnotationTool('draw')" title="Çiz"><i class="fas fa-pen"></i></button>
            <button onclick="setAnnotationTool('text')" title="Yazı"><i class="fas fa-font"></i></button>
            <button onclick="setAnnotationTool('arrow')" title="Ok"><i class="fas fa-arrow-right"></i></button>
            <button onclick="clearAnnotations()" title="Temizle"><i class="fas fa-trash"></i></button>
            <button onclick="saveAnnotations()" title="Kaydet"><i class="fas fa-save"></i></button>
            <input type="color" id="annotationColor" value="#e74c3c" onchange="setAnnotationColor(this.value)">
        `;
        fabricWrapper.appendChild(toolbar);

        showToast(getText('toast_annotation_on'), 'success');
    } else {
        showToast(getText('toast_fabric_not_loaded'), 'error');
    }
}

export function setAnnotationTool(tool) {
    if (!annotationCanvas) return;

    if (tool === 'draw') {
        annotationCanvas.isDrawingMode = true;
    } else if (tool === 'text') {
        annotationCanvas.isDrawingMode = false;
        if (typeof fabric !== 'undefined') {
            const text = new fabric.IText('Yazı ekle', {
                left: 100, top: 100, fontSize: 20, fill: '#e74c3c'
            });
            annotationCanvas.add(text);
        }
    } else if (tool === 'arrow') {
        annotationCanvas.isDrawingMode = false;
        if (typeof fabric !== 'undefined') {
            const arrow = new fabric.Line([50, 50, 200, 50], {
                stroke: '#e74c3c', strokeWidth: 3
            });
            annotationCanvas.add(arrow);
        }
    }
}

export function setAnnotationColor(color) {
    if (annotationCanvas) {
        annotationCanvas.freeDrawingBrush.color = color;
    }
}

export function clearAnnotations() {
    if (annotationCanvas) {
        annotationCanvas.clear();
        showToast(getText('toast_annotations_cleared'), 'info');
    }
}

export function saveAnnotations() {
    if (annotationCanvas) {
        const json = annotationCanvas.toJSON();
        localStorage.setItem('viz_annotations', JSON.stringify(json));
        showToast(getText('toast_annotations_saved'), 'success');
    }
}

// Get annotation canvas for external use (e.g., exportWithAnnotations)
export function getAnnotationCanvas() {
    return annotationCanvas;
}

// -----------------------------------------------------
// COMMAND PALETTE (From viz_SOURCE.js:3946-4014)
// Toggle command palette overlay
// -----------------------------------------------------
export function toggleCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (!palette) return;

    if (palette.style.display === 'none' || palette.style.display === '') {
        openCommandPalette();
    } else {
        closeCommandPalette();
    }
}

export function openCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const searchInput = document.getElementById('paletteSearch');

    if (!palette) return;

    palette.style.display = 'flex';
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
}

export function closeCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (palette) palette.style.display = 'none';
}

// Core UI Bindings
// NOTE: window.showToast is provided by toast.js (FAZ-5 central system)
// window.showToast = showToast; // REMOVED - causes recursion with proxy
window.createModal = createModal;
window.showSettings = showSettings;
window.hideSettings = hideSettings;
window.updateEmptyState = updateEmptyState;
// Note: closeVizPreviewModal, downloadPDFFromPreview, closePDFPreviewModal are exported from preview.js

// Annotation bindings
window.toggleAnnotationMode = toggleAnnotationMode;
window.setAnnotationTool = setAnnotationTool;
window.setAnnotationColor = setAnnotationColor;
window.clearAnnotations = clearAnnotations;
window.saveAnnotations = saveAnnotations;
window.getAnnotationCanvas = getAnnotationCanvas;

// Command palette bindings
window.toggleCommandPalette = toggleCommandPalette;
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;

// -----------------------------------------------------
// FAZ-GUIDE-2: GUIDED ANALYSIS TOGGLE BUTTON
// Minimal 🧠 toggle for assumption wizard
// -----------------------------------------------------

/**
 * Toggle the Guided Analysis feature ON/OFF
 */
export function toggleGuidedAnalysis() {
    // Ensure VIZ_SETTINGS exists
    window.VIZ_SETTINGS = window.VIZ_SETTINGS || {};

    // Toggle the flag
    const newState = !window.VIZ_SETTINGS.guidedAnalysis;
    window.VIZ_SETTINGS.guidedAnalysis = newState;

    // Update button visual
    const btn = document.getElementById('guidedAnalysisToggle');
    if (btn) {
        btn.classList.toggle('viz-guided-active', newState);
        btn.setAttribute('aria-pressed', newState.toString());
        btn.title = newState ? getText('guided_toggle_on') : getText('guided_toggle_off');
    }

    // Show toast with status
    const msgKey = newState ? 'guided_toggle_on' : 'guided_toggle_off';
    showToast(getText(msgKey), newState ? 'success' : 'info');
}

/**
 * Initialize the Guided Analysis toggle button
 * Appends to stat panel or fallback location
 */
export function initGuidedAnalysisButton() {
    // Avoid duplicate
    if (document.getElementById('guidedAnalysisToggle')) return;

    // Find target container - stat buttons area
    const statButtonsArea = document.querySelector('.viz-stat-buttons')
        || document.querySelector('.viz-analysis-panel')
        || document.querySelector('#vizLeftPanel .viz-section:last-child');

    if (!statButtonsArea) {
        console.log('[GUIDE] Stat panel not found, deferring button init');
        return;
    }

    // Create button
    const btn = document.createElement('button');
    btn.id = 'guidedAnalysisToggle';
    btn.className = 'viz-stat-btn viz-guided-toggle';
    btn.setAttribute('aria-label', 'Guided Analysis');
    btn.setAttribute('aria-pressed', 'false');
    btn.title = getText('guided_toggle_off');
    btn.innerHTML = '<span class="viz-guided-icon">🧠</span>';
    btn.onclick = toggleGuidedAnalysis;

    // Append to stat buttons area
    statButtonsArea.appendChild(btn);
}

// Window bindings for guided analysis
window.toggleGuidedAnalysis = toggleGuidedAnalysis;
window.initGuidedAnalysisButton = initGuidedAnalysisButton;

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGuidedAnalysisButton);
} else {
    // DOM already loaded, init with a small delay to ensure other elements exist
    setTimeout(initGuidedAnalysisButton, 500);
}

console.log('✅ ui.js module loaded (with annotations and command palette)');
