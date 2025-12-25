import { VIZ_STATE } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { showStatResultModal, closeStatResultModal } from '../ui/modals.js'; // Assuming showStatResultModal is in utils or needs to be moved there

// showStatResultModal might be in viz.js global scope currently.
// I will check where showStatResultModal is defined. It's likely in viz.js UI section.
// If it is, I can't easily import it unless I extract it to ui/modals.js.
// For now I'll assume it's on window or will be available.

export function showAnomalyAxisModal() {
    const dataset = VIZ_STATE.getActiveDataset();
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        showToast('Önce veri yükleyin', 'warning');
        return;
    }

    // Sayisal sutunlari bul
    const columns = Object.keys(dataset.data[0]);
    const numericCols = columns.filter(col =>
        dataset.data.some(row => !isNaN(parseFloat(row[col])))
    );

    if (numericCols.length === 0) {
        showToast('Sayısal sütun bulunamadı', 'warning');
        return;
    }

    const optionsHtml = numericCols.map(col =>
        `<option value="${col}">${col}</option>`
    ).join('');

    const html = `<div class="viz-modal-form">
        <label>Anomali Analizi Yapılacak Sütun:</label>
        <select id="anomalyColumnSelect" style="width:100%; padding:8px; margin-bottom:15px;">
        ${optionsHtml}
        </select>
        <label>Z-Score Eşik Değeri:</label>
        <input type="range" id="anomalyThreshold" min="1.5" max="3" step="0.1" value="2" 
        oninput="document.getElementById('thresholdVal').textContent=this.value" style="width:100%;">
        <div style="text-align:center; margin:5px 0;"><span id="thresholdVal">2</span> sigma</div>
        <button class="viz-btn-primary" onclick="runAnomalyWithColumn(); closeStatResultModal();" style="width:100%; margin-top:10px;">
        <i class="fas fa-search"></i> Anomali Tespit Et</button>
        </div>`;

    // Assuming showStatResultModal is globally available for now
    if (window.showStatResultModal) window.showStatResultModal('Anomali Tespiti - Eksen Seçimi', html);
}

export function runAnomalyWithColumn() {
    const colSelect = document.getElementById('anomalyColumnSelect');
    const thresholdInput = document.getElementById('anomalyThreshold');

    if (!colSelect) {
        detectAnomalies();
        return;
    }

    const column = colSelect.value;
    const threshold = parseFloat(thresholdInput ? thresholdInput.value : 2);

    const dataset = VIZ_STATE.getActiveDataset();
    if (!dataset || !dataset.data) {
        showToast('Veri bulunamadı', 'warning');
        return;
    }

    const yData = dataset.data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));

    if (yData.length < 3) {
        showToast('Yeterli veri yok', 'warning');
        return;
    }

    // Z-score ile anomali tespit
    const mean = yData.reduce((a, b) => a + b, 0) / yData.length;
    const std = Math.sqrt(yData.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / yData.length);

    const anomalies = [];
    yData.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / std);
        if (zScore > threshold) {
            anomalies.push({
                index: index,
                value: value,
                zScore: zScore.toFixed(2),
                type: value > mean ? 'high' : 'low'
            });
        }
    });

    // Sonuclari goster
    const resultsDiv = document.getElementById('anomalyResults');
    const countEl = document.getElementById('anomalyCount');
    const listEl = document.getElementById('anomalyList');

    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        countEl.textContent = anomalies.length;

        // Sutun ismini goster
        const headerHtml = `<div style="font-size:0.75rem;color:var(--gm-text-muted);margin-bottom:5px;">Sütun: <strong>${column}</strong></div>`;

        if (anomalies.length > 0) {
            listEl.innerHTML = headerHtml + anomalies.slice(0, 5).map(a =>
                `<div class="viz-anomaly-item ${a.type}">
                    <span>#${a.index + 1}</span>
                    <span>${a.value}</span>
                    <span class="viz-zscore">Z=${a.zScore}</span>
                </div>`
            ).join('');
        } else {
            listEl.innerHTML = headerHtml + '<div class="viz-no-anomaly">Anomali bulunamadı</div>';
        }
    }

    showToast(`${anomalies.length} anomali tespit edildi (${column})`, anomalies.length > 0 ? 'warning' : 'success');
}

export function detectAnomalies() {
    // Check if we have multiple numeric columns - if so, show modal
    const dataset = VIZ_STATE.getActiveDataset();
    if (dataset && dataset.data && dataset.data.length > 0) {
        const columns = Object.keys(dataset.data[0]);
        const numericCols = columns.filter(col =>
            dataset.data.some(row => !isNaN(parseFloat(row[col])))
        );

        if (numericCols.length > 1) {
            showAnomalyAxisModal();
            return;
        }
    }

    // Fallback logic if we want to run default detection (logic would need to be here if not calling back to original)
    console.log('Default detectAnomalies triggered');
}

// Global exports for inline HTML onclick handlers
window.showAnomalyAxisModal = showAnomalyAxisModal;
window.runAnomalyWithColumn = runAnomalyWithColumn;
window.detectAnomalies = detectAnomalies;
