import { VIZ_STATE } from '../core/state.js';
import { showToast, downloadFile } from '../core/utils.js';
import { showStatResultModal, closeStatResultModal } from './modals.js';

export function showExportModal() {
    const html = '<div class=\"viz-modal-form\"><h4><i class=\"fas fa-image\"></i> Grafik Export</h4><div style=\"display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;\"><button class=\"viz-btn-primary\" onclick=\"exportPNG(); closeStatResultModal();\"><i class=\"fas fa-image\"></i> PNG</button><button class=\"viz-btn-primary\" onclick=\"exportSVG(); closeStatResultModal();\"><i class=\"fas fa-vector-square\"></i> SVG</button><button class=\"viz-btn-primary\" onclick=\"exportAllChartsPNG(); closeStatResultModal();\"><i class=\"fas fa-images\"></i> Tum PNG</button><button class=\"viz-btn-primary\" onclick=\"exportPDF(); closeStatResultModal();\"><i class=\"fas fa-file-pdf\"></i> PDF</button></div><hr style=\"margin: 15px 0; border-color: var(--gm-divider);\"><h4><i class=\"fas fa-table\"></i> Veri Export</h4><div style=\"display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;\"><button class=\"viz-btn-secondary\" onclick=\"exportExcel(); closeStatResultModal();\"><i class=\"fas fa-file-excel\"></i> Excel</button><button class=\"viz-btn-secondary\" onclick=\"exportCSV(); closeStatResultModal();\"><i class=\"fas fa-file-csv\"></i> CSV</button></div><hr style=\"margin: 15px 0; border-color: var(--gm-divider);\"><h4><i class=\"fas fa-share-alt\"></i> Paylasim</h4><div style=\"display:grid; grid-template-columns: 1fr 1fr; gap:10px;\"><button class=\"viz-btn-secondary\" onclick=\"generateShareLink(); closeStatResultModal();\"><i class=\"fas fa-link\"></i> Link</button><button class=\"viz-btn-secondary\" onclick=\"getEmbedCode(); closeStatResultModal();\"><i class=\"fas fa-code\"></i> Embed</button></div></div>';
    if (window.showStatResultModal) window.showStatResultModal('Indir / Paylas', html);
}

export function exportPNG() {
    if (!VIZ_STATE.selectedChart) { showToast('Once bir grafik secin', 'warning'); return; }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    var url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
    downloadFile(url, 'chart_' + VIZ_STATE.selectedChart + '.png');
    showToast('PNG export edildi', 'success');
}

export function exportAllChartsPNG() {
    // Basic implementation for now - loop through charts
    VIZ_STATE.charts.forEach(c => {
        var chart = VIZ_STATE.echartsInstances[c.id];
        if (chart) {
            var url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
            downloadFile(url, c.title.replace(/\s+/g, '_') + '.png');
        }
    });
    showToast('Tum grafikler indirildi', 'success');
}

export function exportSVG() {
    if (!VIZ_STATE.selectedChart) { showToast('Once bir grafik secin', 'warning'); return; }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    var url = chart.getDataURL({ type: 'svg', pixelRatio: 2 });
    downloadFile(url, 'chart_' + VIZ_STATE.selectedChart + '.svg');
    showToast('SVG export edildi', 'success');
}

export function exportPDF() {
    if (!VIZ_STATE.selectedChart) { showToast('Once bir grafik secin', 'warning'); return; }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF icin jsPDF yukleniyor...', 'info');
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function () {
            var pdf = new window.jspdf.jsPDF('landscape', 'mm', 'a4');
            var imgData = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
            pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
            pdf.save('chart_' + VIZ_STATE.selectedChart + '.pdf');
            showToast('PDF export edildi', 'success');
        };
        document.head.appendChild(script);
        return;
    }
    var pdf = new window.jspdf.jsPDF('landscape', 'mm', 'a4');
    var imgData = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
    pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
    pdf.save('chart_' + VIZ_STATE.selectedChart + '.pdf');
    showToast('PDF export edildi', 'success');
}

export function exportExcel() {
    var dataset = VIZ_STATE.getActiveDataset(); // Fixed: object access
    if (!dataset || !dataset.data) { showToast('Export edilecek veri yok', 'warning'); return; }
    if (typeof XLSX === 'undefined') {
        showToast('XLSX yukleniyor...', 'info');
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = function () {
            var ws = XLSX.utils.json_to_sheet(dataset.data);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, 'data_' + Date.now() + '.xlsx');
            showToast('Excel export edildi', 'success');
        };
        document.head.appendChild(script);
        return;
    }
    var ws = XLSX.utils.json_to_sheet(dataset.data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, 'data_' + Date.now() + '.xlsx');
    showToast('Excel export edildi', 'success');
}

export function exportCSV() {
    var dataset = VIZ_STATE.getActiveDataset(); // Fixed: object access
    if (!dataset || !dataset.data || dataset.data.length === 0) { showToast('Export edilecek veri yok', 'warning'); return; }
    var headers = Object.keys(dataset.data[0]);
    var csvContent = headers.join(',') + '\n';
    dataset.data.forEach(function (row) {
        csvContent += headers.map(function (h) {
            return (typeof row[h] === 'string' && row[h].indexOf(',') >= 0) ? '"' + row[h] + '"' : row[h];
        }).join(',') + '\n';
    });
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    downloadFile(url, 'data_' + Date.now() + '.csv');
    URL.revokeObjectURL(url);
    showToast('CSV export edildi', 'success');
}

export function getEmbedCode() {
    var embedCode = '<iframe src="' + window.location.href + '" width="800" height="600" frameborder="0"></iframe>';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(embedCode).then(function () {
            showToast('Embed kodu panoya kopyalandi', 'success');
        });
    } else {
        prompt('Kopyalayin:', embedCode);
    }
}

// Global exports
window.showExportModal = showExportModal;
window.exportSVG = exportSVG;
window.exportPDF = exportPDF;
window.exportExcel = exportExcel;
window.exportCSV = exportCSV;
window.exportAllChartsPNG = exportAllChartsPNG;
window.exportPNG = exportPNG;
window.getEmbedCode = getEmbedCode;
