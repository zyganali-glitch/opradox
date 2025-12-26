// =====================================================
// EXPORT MODAL VE EK EXPORT FONKSIYONLARI (Madde 9-12)
// =====================================================

function showExportModal() {
    const html = '<div class=\"viz-modal-form\"><h4><i class=\"fas fa-image\"></i> Grafik Export</h4><div style=\"display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;\"><button class=\"viz-btn-primary\" onclick=\"exportPNG(); closeStatResultModal();\"><i class=\"fas fa-image\"></i> PNG</button><button class=\"viz-btn-primary\" onclick=\"exportSVG(); closeStatResultModal();\"><i class=\"fas fa-vector-square\"></i> SVG</button><button class=\"viz-btn-primary\" onclick=\"exportAllChartsPNG(); closeStatResultModal();\"><i class=\"fas fa-images\"></i> Tum PNG</button><button class=\"viz-btn-primary\" onclick=\"exportPDF(); closeStatResultModal();\"><i class=\"fas fa-file-pdf\"></i> PDF</button></div><hr style=\"margin: 15px 0; border-color: var(--gm-divider);\"><h4><i class=\"fas fa-table\"></i> Veri Export</h4><div style=\"display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;\"><button class=\"viz-btn-secondary\" onclick=\"exportExcel(); closeStatResultModal();\"><i class=\"fas fa-file-excel\"></i> Excel</button><button class=\"viz-btn-secondary\" onclick=\"exportCSV(); closeStatResultModal();\"><i class=\"fas fa-file-csv\"></i> CSV</button></div><hr style=\"margin: 15px 0; border-color: var(--gm-divider);\"><h4><i class=\"fas fa-share-alt\"></i> Paylasim</h4><div style=\"display:grid; grid-template-columns: 1fr 1fr; gap:10px;\"><button class=\"viz-btn-secondary\" onclick=\"generateShareLink(); closeStatResultModal();\"><i class=\"fas fa-link\"></i> Link</button><button class=\"viz-btn-secondary\" onclick=\"getEmbedCode(); closeStatResultModal();\"><i class=\"fas fa-code\"></i> Embed</button></div></div>';
    showStatResultModal('Indir / Paylas', html);
}

function exportSVG() {
    if (!VIZ_STATE.selectedChart) { showToast('Once bir grafik secin', 'warning'); return; }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    var url = chart.getDataURL({ type: 'svg', pixelRatio: 2 });
    downloadFile(url, 'chart_' + VIZ_STATE.selectedChart + '.svg');
    showToast('SVG export edildi', 'success');
}

function exportPDF() {
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

function exportExcel() {
    var dataset = VIZ_STATE.getActiveDataset ? VIZ_STATE.getActiveDataset() : VIZ_STATE.datasets[VIZ_STATE.activeDatasetId];
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

function exportCSV() {
    var dataset = VIZ_STATE.getActiveDataset ? VIZ_STATE.getActiveDataset() : VIZ_STATE.datasets[VIZ_STATE.activeDatasetId];
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

function getEmbedCode() {
    var embedCode = '<iframe src="' + window.location.href + '" width="800" height="600" frameborder="0"></iframe>';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(embedCode).then(function () {
            showToast('Embed kodu panoya kopyalandi', 'success');
        });
    } else {
        prompt('Kopyalayin:', embedCode);
    }
}

window.showExportModal = showExportModal;
window.exportSVG = exportSVG;
window.exportPDF = exportPDF;
window.exportExcel = exportExcel;
window.exportCSV = exportCSV;
window.getEmbedCode = getEmbedCode;

// =====================================================
// HUB DOSYA TRANSFERI (Madde 24)
// =====================================================

function loadFilesFromHub() {
    try {
        var hubFilesMeta = sessionStorage.getItem('opradox_docker_meta');
        if (!hubFilesMeta) return;

        var files = JSON.parse(hubFilesMeta);
        if (!files || files.length === 0) return;

        var excelFiles = files.filter(function (f) {
            return f.moduleType === 'excel' ||
                f.name.indexOf('.xlsx') >= 0 ||
                f.name.indexOf('.xls') >= 0 ||
                f.name.indexOf('.csv') >= 0;
        });

        if (excelFiles.length > 0) {
            showToast('Hub dan ' + excelFiles.length + ' dosya bilgisi alindi. Dosyalarinizi VS de tekrar yukleyin.', 'info');
        }
    } catch (e) {
        console.error('Hub dosya yukleme hatasi:', e);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(loadFilesFromHub, 500);
});

window.loadFilesFromHub = loadFilesFromHub;

// =====================================================
// MADDE 16: ISTATISTIK OZETI EKSEN BILGISI
// =====================================================

// Enhanced updateStatsSummary - adds X and Y axis info display
var originalUpdateStatsSummary = window.updateStatsSummary;

window.updateStatsSummary = function (stats, xAxisName, yAxisName) {
    // Original function
    if (typeof originalUpdateStatsSummary === 'function') {
        originalUpdateStatsSummary(stats);
    }

    var summaryEl = document.getElementById('vizStatsSummary');
    if (!summaryEl || !stats) return;

    // Add axis info header if not exists
    var axisHeaderId = 'statAxisInfo';
    var axisHeader = document.getElementById(axisHeaderId);

    if (!axisHeader) {
        axisHeader = document.createElement('div');
        axisHeader.id = axisHeaderId;
        axisHeader.className = 'viz-stat-axis-info';
        axisHeader.style.cssText = 'background: rgba(74,144,217,0.1); padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 0.8rem;';

        // Insert after h4
        var h4 = summaryEl.querySelector('h4');
        if (h4 && h4.nextSibling) {
            summaryEl.insertBefore(axisHeader, h4.nextSibling);
        } else {
            summaryEl.appendChild(axisHeader);
        }
    }

    // Get axis names from selected chart
    var xAxis = xAxisName || 'Bilinmiyor';
    var yAxis = yAxisName || 'Bilinmiyor';

    if (window.VIZ_STATE && window.VIZ_STATE.selectedChart) {
        var config = window.VIZ_STATE.charts.find(function (c) { return c.id === window.VIZ_STATE.selectedChart; });
        if (config) {
            xAxis = config.xAxis || 'Kategori';
            yAxis = config.yAxis || 'Deger';
        }
    }

    axisHeader.innerHTML = '<i class="fas fa-crosshairs" style="color:var(--gm-primary);margin-right:5px;"></i>' +
        '<strong>X:</strong> ' + xAxis + ' | <strong>Y:</strong> ' + yAxis;
};

// =====================================================
// MADDE 18: ANOMALI TESTI EKSEN SECIMI
// =====================================================

function showAnomalyAxisModal() {
    var dataset = window.VIZ_STATE.getActiveDataset ? window.VIZ_STATE.getActiveDataset() : window.VIZ_STATE.datasets[window.VIZ_STATE.activeDatasetId];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        showToast('Once veri yukleyin', 'warning');
        return;
    }

    // Sayisal sutunlari bul
    var columns = Object.keys(dataset.data[0]);
    var numericCols = columns.filter(function (col) {
        return dataset.data.some(function (row) { return !isNaN(parseFloat(row[col])); });
    });

    if (numericCols.length === 0) {
        showToast('Sayisal sutun bulunamadi', 'warning');
        return;
    }

    var optionsHtml = numericCols.map(function (col) {
        return '<option value="' + col + '">' + col + '</option>';
    }).join('');

    var html = '<div class="viz-modal-form">' +
        '<label>Anomali Analizi Yapilacak Sutun:</label>' +
        '<select id="anomalyColumnSelect" style="width:100%; padding:8px; margin-bottom:15px;">' +
        optionsHtml +
        '</select>' +
        '<label>Z-Score Esik Degeri:</label>' +
        '<input type="range" id="anomalyThreshold" min="1.5" max="3" step="0.1" value="2" ' +
        'oninput="document.getElementById(\'thresholdVal\').textContent=this.value" style="width:100%;">' +
        '<div style="text-align:center; margin:5px 0;"><span id="thresholdVal">2</span> sigma</div>' +
        '<button class="viz-btn-primary" onclick="runAnomalyWithColumn(); closeStatResultModal();" style="width:100%; margin-top:10px;">' +
        '<i class="fas fa-search"></i> Anomali Tespit Et</button>' +
        '</div>';

    showStatResultModal('Anomali Tespiti - Eksen Secimi', html);
}

function runAnomalyWithColumn() {
    var colSelect = document.getElementById('anomalyColumnSelect');
    var thresholdInput = document.getElementById('anomalyThreshold');

    if (!colSelect) {
        detectAnomalies();
        return;
    }

    var column = colSelect.value;
    var threshold = parseFloat(thresholdInput ? thresholdInput.value : 2);

    var dataset = window.VIZ_STATE.getActiveDataset ? window.VIZ_STATE.getActiveDataset() : window.VIZ_STATE.datasets[window.VIZ_STATE.activeDatasetId];
    if (!dataset || !dataset.data) {
        showToast('Veri bulunamadi', 'warning');
        return;
    }

    var yData = dataset.data.map(function (row) { return parseFloat(row[column]); }).filter(function (v) { return !isNaN(v); });

    if (yData.length < 3) {
        showToast('Yeterli veri yok', 'warning');
        return;
    }

    // Z-score ile anomali tespit
    var mean = yData.reduce(function (a, b) { return a + b; }, 0) / yData.length;
    var std = Math.sqrt(yData.reduce(function (acc, v) { return acc + Math.pow(v - mean, 2); }, 0) / yData.length);

    var anomalies = [];
    yData.forEach(function (value, index) {
        var zScore = Math.abs((value - mean) / std);
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
    var resultsDiv = document.getElementById('anomalyResults');
    var countEl = document.getElementById('anomalyCount');
    var listEl = document.getElementById('anomalyList');

    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        countEl.textContent = anomalies.length;

        // Sutun ismini goster
        var headerHtml = '<div style="font-size:0.75rem;color:var(--gm-text-muted);margin-bottom:5px;">Sutun: <strong>' + column + '</strong></div>';

        if (anomalies.length > 0) {
            listEl.innerHTML = headerHtml + anomalies.slice(0, 5).map(function (a) {
                return '<div class="viz-anomaly-item ' + a.type + '">' +
                    '<span>#' + (a.index + 1) + '</span>' +
                    '<span>' + a.value + '</span>' +
                    '<span class="viz-zscore">Z=' + a.zScore + '</span>' +
                    '</div>';
            }).join('');
        } else {
            listEl.innerHTML = headerHtml + '<div class="viz-no-anomaly">Anomali bulunamadi</div>';
        }
    }

    showToast(anomalies.length + ' anomali tespit edildi (' + column + ')', anomalies.length > 0 ? 'warning' : 'success');
}

// Override detectAnomalies to show modal
var originalDetectAnomalies = window.detectAnomalies;
window.detectAnomalies = function () {
    // Check if we have multiple numeric columns - if so, show modal
    var dataset = window.VIZ_STATE.getActiveDataset ? window.VIZ_STATE.getActiveDataset() : (window.VIZ_STATE && window.VIZ_STATE.datasets[window.VIZ_STATE.activeDatasetId]);
    if (dataset && dataset.data && dataset.data.length > 0) {
        var columns = Object.keys(dataset.data[0]);
        var numericCols = columns.filter(function (col) {
            return dataset.data.some(function (row) { return !isNaN(parseFloat(row[col])); });
        });

        if (numericCols.length > 1) {
            showAnomalyAxisModal();
            return;
        }
    }

    // Otherwise run original
    if (typeof originalDetectAnomalies === 'function') {
        originalDetectAnomalies();
    }
};

window.showAnomalyAxisModal = showAnomalyAxisModal;
window.runAnomalyWithColumn = runAnomalyWithColumn;

// =====================================================
// MADDE 22: SOL PANEL SUTUN TIPI GOSTERIMI
// Enhanced column chip with type indicator
// =====================================================

function updateColumnsListWithTypes() {
    var dataset = window.VIZ_STATE.getActiveDataset ? window.VIZ_STATE.getActiveDataset() : window.VIZ_STATE.datasets[window.VIZ_STATE.activeDatasetId];
    var listEl = document.getElementById('vizColumnsList');

    if (!listEl || !dataset || !dataset.data || dataset.data.length === 0) return;

    var columns = Object.keys(dataset.data[0]);

    listEl.innerHTML = columns.map(function (col) {
        var sampleValues = dataset.data.slice(0, 10).map(function (r) { return r[col]; });
        var type = detectColumnType(sampleValues);
        var typeInfo = getTypeInfo(type);

        return '<div class="viz-column-chip" draggable="true" data-column="' + col + '" data-type="' + type + '" ' +
            'style="border-left: 3px solid ' + typeInfo.color + ';">' +
            '<i class="' + typeInfo.icon + '" style="color:' + typeInfo.color + ';"></i>' +
            '<span class="viz-col-name-chip">' + col + '</span>' +
            '<span class="viz-col-type-chip" style="font-size:0.65rem;color:var(--gm-text-muted);margin-left:auto;">' + typeInfo.label + '</span>' +
            '</div>';
    }).join('');

    // Re-attach drag handlers
    listEl.querySelectorAll('.viz-column-chip').forEach(function (chip) {
        chip.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', chip.dataset.column);
            chip.classList.add('dragging');
        });
        chip.addEventListener('dragend', function () {
            chip.classList.remove('dragging');
        });
    });
}

function detectColumnType(values) {
    var numericCount = 0;
    var dateCount = 0;
    var textCount = 0;

    values.forEach(function (v) {
        if (v === null || v === undefined || v === '') return;

        if (!isNaN(parseFloat(v)) && isFinite(v)) {
            numericCount++;
        } else if (!isNaN(Date.parse(v))) {
            dateCount++;
        } else {
            textCount++;
        }
    });

    var total = numericCount + dateCount + textCount;
    if (total === 0) return 'empty';

    if (numericCount / total > 0.7) return 'numeric';
    if (dateCount / total > 0.7) return 'date';
    return 'text';
}

function getTypeInfo(type) {
    var types = {
        'numeric': { icon: 'fas fa-hashtag', color: '#3b82f6', label: 'Sayi' },
        'date': { icon: 'fas fa-calendar', color: '#8b5cf6', label: 'Tarih' },
        'text': { icon: 'fas fa-font', color: '#10b981', label: 'Metin' },
        'empty': { icon: 'fas fa-minus', color: '#6b7280', label: 'Bos' }
    };
    return types[type] || types['text'];
}

window.updateColumnsListWithTypes = updateColumnsListWithTypes;
window.detectColumnType = detectColumnType;
window.getTypeInfo = getTypeInfo;

// MADDE 23: BASLIK SATIRI ONIZLEME
// DEPRECATED: Eski implementasyon encoding sorunu yaşıyordu
// Yeni implementasyon viz.js'te (Excel Studio ile aynı tarz)
// =====================================================

// Bu fonksiyon artık viz.js'teki yeni showHeaderPreview'a yönlendiriyor
// Eski kod encoding sorunu yaşıyordu (FileReader.readAsText)

// NOT: showHeaderPreview artık viz.js'te tanımlı ve daha iyi çalışıyor
// Bu dosyadaki tanım viz.js'ten SONRA yükleniyor olabilir
// Bu yüzden burada tanımlama yapmıyoruz

// Yardımcı fonksiyonlar (geriye uyumluluk için)
function selectHeaderRow(rowIndex) {
    // Yeni fonksiyonu kullan
    if (typeof applyVizHeaderFromPreview === 'function') {
        applyVizHeaderFromPreview(rowIndex);
    }
}

function applySelectedHeaderRow() {
    var selected = document.querySelector('input[name="headerRow"]:checked');
    if (selected) {
        var rowIndex = parseInt(selected.value);
        if (typeof applyVizHeaderFromPreview === 'function') {
            applyVizHeaderFromPreview(rowIndex);
        }
    }
}

// NOT: showHeaderPreview fonksiyonunu export etmiyoruz
// viz.js'teki yeni fonksiyon kullanılacak
window.selectHeaderRow = selectHeaderRow;
window.applySelectedHeaderRow = applySelectedHeaderRow;

// =====================================================
// VIDEO YARDIM MODAL (Tutorial Videos)
// =====================================================

function showVideoHelpModal() {
    const lang = VIZ_STATE.lang || 'tr';

    const tutorials = [
        {
            id: 'dosya_yukleme',
            title: { tr: 'Dosya Yükleme', en: 'File Upload' },
            desc: {
                tr: 'Excel veya CSV dosyanızı sürükleyip bırakın',
                en: 'Drag and drop your Excel or CSV file'
            },
            video: '/help/dosya_yukleme.webp'
        },
        {
            id: 'grafik_olusturma',
            title: { tr: 'Grafik Oluşturma', en: 'Create Charts' },
            desc: {
                tr: '"Grafik Ekle" butonuyla yeni grafik ekleyin',
                en: 'Add new charts with "Add Chart" button'
            },
            video: '/help/grafik_olusturma.webp'
        },
        {
            id: 'disa_aktarma',
            title: { tr: 'Dışa Aktarma', en: 'Export' },
            desc: {
                tr: 'PDF, PNG, Excel formatında indirin',
                en: 'Download as PDF, PNG, Excel'
            },
            video: '/help/disa_aktarma.webp'
        },
        {
            id: 'istatistik_overlay',
            title: { tr: 'İstatistik Katmanları', en: 'Statistical Overlays' },
            desc: {
                tr: 'Ortalama, medyan, trend çizgileri ekleyin',
                en: 'Add mean, median, trend lines'
            },
            video: '/help/istatistik_overlay.webp'
        },
        {
            id: 'watermark',
            title: { tr: 'Watermark / Filigran', en: 'Watermark' },
            desc: {
                tr: 'Dashboard\'a filigran ekleyin',
                en: 'Add watermark to dashboard'
            },
            video: '/help/watermark.webp'
        }
    ];

    let html = '<div class="viz-modal-form" style="max-height:70vh; overflow:auto;">';
    html += '<p style="margin-bottom:15px; color:var(--gm-text-muted);">' +
        (lang === 'tr' ? 'Bir konu seçerek video eğitimi izleyin:' : 'Select a topic to watch video tutorial:') + '</p>';

    html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">';

    tutorials.forEach(function (t) {
        html += '<div class="viz-help-card" onclick="playTutorialVideo(\'' + t.id + '\', \'' + t.video + '\')" style="' +
            'background: var(--gm-card-bg); border: 1px solid var(--gm-card-border); border-radius: 8px; ' +
            'padding: 12px; cursor: pointer; transition: all 0.2s; text-align:center;">' +
            '<i class="fas fa-play-circle" style="font-size:2rem; color:var(--gm-primary); margin-bottom:8px;"></i>' +
            '<h4 style="margin:0 0 5px 0; font-size:0.9rem;">' + t.title[lang] + '</h4>' +
            '<p style="margin:0; font-size:0.75rem; color:var(--gm-text-muted);">' + t.desc[lang] + '</p>' +
            '</div>';
    });

    html += '</div>';

    // Video player area
    html += '<div id="videoPlayerArea" style="margin-top:20px; display:none;">';
    html += '<h4 id="videoTitle" style="margin-bottom:10px;"></h4>';
    html += '<img id="tutorialVideo" src="" alt="Tutorial" style="width:100%; border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">';
    html += '</div>';

    html += '</div>';

    showStatResultModal(lang === 'tr' ? '📺 Video Yardım' : '📺 Video Help', html);

    // Add hover effect
    setTimeout(function () {
        document.querySelectorAll('.viz-help-card').forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                this.style.borderColor = 'var(--gm-primary)';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(74,144,217,0.2)';
            });
            card.addEventListener('mouseleave', function () {
                this.style.borderColor = 'var(--gm-card-border)';
                this.style.transform = 'none';
                this.style.boxShadow = 'none';
            });
        });
    }, 100);
}

function playTutorialVideo(id, videoUrl) {
    var playerArea = document.getElementById('videoPlayerArea');
    var videoEl = document.getElementById('tutorialVideo');
    var titleEl = document.getElementById('videoTitle');

    if (playerArea && videoEl) {
        playerArea.style.display = 'block';
        videoEl.src = videoUrl;

        // Find title
        var titles = {
            'dosya_yukleme': { tr: 'Dosya Yükleme', en: 'File Upload' },
            'grafik_olusturma': { tr: 'Grafik Oluşturma', en: 'Create Charts' },
            'disa_aktarma': { tr: 'Dışa Aktarma', en: 'Export' },
            'istatistik_overlay': { tr: 'İstatistik Katmanları', en: 'Statistical Overlays' },
            'watermark': { tr: 'Watermark', en: 'Watermark' }
        };

        var lang = VIZ_STATE.lang || 'tr';
        titleEl.textContent = '▶ ' + (titles[id] ? titles[id][lang] : id);

        // Scroll to video
        playerArea.scrollIntoView({ behavior: 'smooth' });
    }
}

window.showVideoHelpModal = showVideoHelpModal;
window.playTutorialVideo = playTutorialVideo;

// =====================================================
// MADDE 8: RAPOR AYARLARI YANSIMASI KONTROLU
// previewReport check
// =====================================================

// previewReport fonksiyonu mevcut, sadece log ekleyelim
console.log('viz_export_addon.js yuklendi - Madde 16, 17, 18, 22, 23 fonksiyonlari aktif');

