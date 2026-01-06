console.log("­şöÑ opradox app.js VERSION: 2024-12-14-v3 - FLAGS AND ICONS ENABLED");

const BACKEND_BASE_URL = "http://127.0.0.1:8100"; // Direct backend URL for development



let SCENARIO_CATALOG = {};

let SCENARIO_LIST = [];



let UI_TEXTS = {};

let CURRENT_LANG = "tr";

let ACTIVE_SCENARIO_ID = null;

let LAST_RESULT_DATA = null;



// ===== UNIFIED TOAST NOTIFICATION SYSTEM =====

// Global toast function - single source for all pages (Excel Studio, Visual Studio, etc.)

const TOAST_MAX_VISIBLE = 3;

const TOAST_QUEUE = [];

let TOAST_ACTIVE_COUNT = 0;



/**

 * Show a toast notification (bottom-right, stacking, no icons)

 * @param {string} message - Toast message text

 * @param {string} type - Toast type: 'success' | 'info' | 'warn' | 'error'

 * @param {number} duration - Duration in ms (default: 4000)

 */

window.showToast = function (message, type = 'info', duration = 4000) {

    // Ensure host container exists

    let host = document.querySelector('.op-toast-host');

    if (!host) {

        host = document.createElement('div');

        host.className = 'op-toast-host';

        document.body.appendChild(host);

    }



    // Create toast element

    const toast = document.createElement('div');

    toast.className = `op-toast op-toast-${type}`;

    toast.innerHTML = `<span class="op-toast-message">${message}</span>`;



    // Queue management - max 3 visible at once

    if (TOAST_ACTIVE_COUNT >= TOAST_MAX_VISIBLE) {

        // Remove oldest toast to make room

        const oldestToast = host.querySelector('.op-toast.show');

        if (oldestToast) {

            dismissToast(oldestToast);

        }

    }



    // Add to DOM

    host.appendChild(toast);

    TOAST_ACTIVE_COUNT++;



    // Trigger show animation

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            toast.classList.add('show');

        });

    });



    // Auto dismiss after duration

    const dismissTimeout = setTimeout(() => {

        dismissToast(toast);

    }, duration);



    // Store timeout for potential early dismissal

    toast._dismissTimeout = dismissTimeout;



    function dismissToast(t) {

        if (t._dismissed) return;

        t._dismissed = true;



        clearTimeout(t._dismissTimeout);

        t.classList.remove('show');

        t.classList.add('hide');



        setTimeout(() => {

            if (t.parentNode) {

                t.parentNode.removeChild(t);

                TOAST_ACTIVE_COUNT = Math.max(0, TOAST_ACTIVE_COUNT - 1);

            }

        }, 300);

    }



    return toast;

};



// ===== RESULT DISPLAY SYSTEM =====

// Global result display function - used by VisualBuilder and scenario execution

// ===== RESULT DISPLAY SYSTEM =====

// Global result display function - used by VisualBuilder and scenario execution

window.displayResult = function (result) {

    console.log("­şôè displayResult called with:", result);



    // Store for later use (share, feedback, etc.)

    if (typeof LAST_RESULT_DATA !== 'undefined') {

        window.LAST_RESULT_DATA = result;

    }



    const resultContainer = document.getElementById("resultJson");

    const markdownResult = document.getElementById("markdownResult");

    const downloadPlaceholder = document.getElementById("downloadExcelPlaceholder");

    const statusMessage = document.getElementById("statusMessage");

    const feedbackWidget = document.getElementById("inlineFeedbackWidget");



    if (!resultContainer) {

        console.error("resultJson container not found");

        return;

    }



    // Clear previous content

    if (statusMessage) statusMessage.innerHTML = '';

    if (markdownResult) markdownResult.style.display = 'none';



    const T = typeof EXTRA_TEXTS !== 'undefined' && typeof CURRENT_LANG !== 'undefined'

        ? EXTRA_TEXTS[CURRENT_LANG] : {};



    // --- 1. SUMMARY SECTION ---

    // Try technical_details first, then summary, then fallback

    const tech = result.technical_details || {};

    const summ = result.summary || {};



    // Helper for safe value display

    const safeVal = (v, suffix = '') => (v !== undefined && v !== null && v !== '') ? `<strong>${v}</strong>${suffix}` : '—';



    const inputRows = safeVal(tech.input_rows ?? summ["Girdi Satır Sayısı"] ?? summ["Input Rows"], ' ' + (T.info_rows || 'satır'));

    const outputRows = safeVal(tech.output_rows ?? summ["Sonuç Satır Sayısı"] ?? summ["Output Rows"], ' ' + (T.info_rows || 'satır'));

    const outputCols = safeVal(tech.output_columns ?? summ["Sonuç Sütun Sayısı"] ?? summ["Output Columns"], ' ' + (T.info_cols || 'sütun'));

    const engine = safeVal(tech.engine ?? summ["Motor"] ?? result.engine);

    const operations = tech.operations ? tech.operations.join(', ') : (summ["Yapılan İşlemler"] ?? summ["Operations"] ?? '—');



    const summaryHtml = `

        <div class="gm-result-success" style="padding:16px; background:rgba(16,185,129,0.1); border-radius:8px; margin-bottom:12px; border-left:3px solid #10b981;">

            <h4 style="color:#10b981; margin:0 0 12px 0; font-size:1rem;">

                <i class="fas fa-check-circle"></i> ${CURRENT_LANG === 'tr' ? 'İşlem Tamamlandı' : 'Operation Complete'}

            </h4>

            <ul style="list-style:none; padding:0; margin:0; color:var(--gm-text); font-size:0.9rem;">

                <li style="margin-bottom:6px;">📤 ${CURRENT_LANG === 'tr' ? 'Girdi' : 'Input'}: ${inputRows}</li>

                <li style="margin-bottom:6px;">📤 ${CURRENT_LANG === 'tr' ? 'çıktı' : 'Output'}: ${outputRows}, ${outputCols}</li>

                <li style="margin-bottom:6px;">ÔÜÖ´©Å ${CURRENT_LANG === 'tr' ? 'İşlemler' : 'Operations'}: ${operations}</li>

                <li style="margin-bottom:6px;">­şöğ ${CURRENT_LANG === 'tr' ? 'Motor' : 'Engine'}: ${engine}</li>

            </ul>

        </div>

    `;



    // --- 2. DOWNLOAD BUTTONS (3 TYPES) ---

    const backendUrl = typeof BACKEND_BASE_URL !== 'undefined' ? BACKEND_BASE_URL : '';

    const dlUrl = (url) => url ? (url.startsWith('http') ? url : backendUrl + url) : null;



    const excelUrl = dlUrl(result.download_url);

    const csvUrl = dlUrl(result.csv_url);

    const jsonUrl = dlUrl(result.json_url);



    let downloadHtml = `<div class="gm-download-buttons" style="display:flex; gap:8px; flex-wrap:wrap; margin:12px 0;">`;



    if (excelUrl) {

        downloadHtml += `

            <a href="${excelUrl}" class="gm-gradient-btn" download style="display:inline-flex; align-items:center; gap:6px; text-decoration:none; font-size:0.85rem; padding:8px 16px;">

                <i class="fas fa-file-excel"></i> ${T.download_excel || 'Excel Olarak İndir'}

            </a>`;

    }



    if (csvUrl) {

        downloadHtml += `

            <a href="${csvUrl}" class="gm-pill-btn" download style="display:inline-flex; align-items:center; gap:6px;">

                <i class="fas fa-file-csv"></i> CSV

            </a>`;

    }



    if (jsonUrl) {

        downloadHtml += `

            <a href="${jsonUrl}" class="gm-pill-btn" download style="display:inline-flex; align-items:center; gap:6px;">

                <i class="fas fa-file-code"></i> JSON

            </a>`;

    } else if (result.data) {

        downloadHtml += `

            <button onclick="downloadResultAsJson()" class="gm-pill-btn" style="display:inline-flex; align-items:center; gap:6px;">

                 <i class="fas fa-file-code"></i> JSON

            </button>`;

    }



    downloadHtml += `</div>`;



    // --- 3. SHARE OPTIONS ---

    const shareHtml = `

        <div class="gm-share-section" style="margin-top:10px; display:flex; align-items:center; gap:8px;">

            <span style="font-size:0.85rem; color:var(--gm-text-muted);">${CURRENT_LANG === 'tr' ? 'Paylaş:' : 'Share:'}</span>

            <button onclick="copyResultLink()" class="gm-icon-btn is-sm" title="Link Kopyala"><i class="fas fa-link"></i></button>

            <button onclick="shareViaEmail()" class="gm-icon-btn is-sm" title="Email"><i class="fas fa-envelope"></i></button>

            <button onclick="copyResultSummary()" class="gm-icon-btn is-sm" title="Özet Kopyala"><i class="fas fa-copy"></i></button>

        </div>

    `;



    // --- 4. PYTHON CODE SECTION ---

    let codeHtml = '';

    if (result.generated_python_code) {

        codeHtml = `

            <div class="gm-code-section" style="margin-top:16px; border:1px solid var(--gm-card-border); border-radius:8px; overflow:hidden;">

                <div class="gm-code-header" style="padding:8px 12px; background:rgba(139,92,246,0.15); display:flex; justify-content:space-between; align-items:center;">

                    <span style="font-weight:600; color:var(--gm-text); font-size:0.85rem;">

                        <i class="fab fa-python" style="color:#3776ab;"></i> ${T.code_summary_title || 'Python Kodu'}

                    </span>

                    <button onclick="copyPythonCode()" class="gm-pill-btn" style="font-size:0.75rem; padding:4px 10px;">

                        <i class="fas fa-copy"></i> ${T.copy_code || 'Kopyala'}

                    </button>

                </div>

                <pre id="generatedPythonCode" style="margin:0; padding:12px; background:var(--gm-bg); font-size:0.8rem; overflow-x:auto; max-height:250px; overflow-y:auto;"><code class="language-python">${escapeHtml(result.generated_python_code)}</code></pre>

            </div>

        `;

    }



    // --- 5. NEW SCENARIO BUTTON ---

    const newScenarioHtml = `

        <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--gm-card-border); display:flex; justify-content:space-between;">

             <button onclick="clearResultAndReset()" class="gm-pill-btn" style="font-size:0.85rem; border:1px solid var(--gm-card-border);">

                <i class="fas fa-undo"></i> ${CURRENT_LANG === 'tr' ? 'Seçimleri Temizle' : 'Reset Inputs'}

            </button>

            <button onclick="showScenarioList()" class="gm-gradient-btn" style="font-size:0.85rem;">

                <i class="fas fa-plus"></i> ${CURRENT_LANG === 'tr' ? 'Yeni Senaryo Seç' : 'New Scenario'}

            </button>

        </div>

    `;



    // --- COMBINE ---

    resultContainer.innerHTML = summaryHtml + downloadHtml + shareHtml + codeHtml + newScenarioHtml;

    resultContainer.style.display = 'block';



    // Show download text/button in placeholder logic if needed

    if (downloadPlaceholder) {

        downloadPlaceholder.innerHTML = '';

    }



    // Show feedback widget

    if (feedbackWidget && typeof showInlineFeedbackWidget === 'function') {

        showInlineFeedbackWidget();

    } else if (feedbackWidget) {

        feedbackWidget.style.display = 'block';

    }



    // --- HIGHLIGHT ---

    if (typeof highlightPython === 'function') {

        highlightPython();

    } else if (typeof Prism !== 'undefined') {

        Prism.highlightAllInside && Prism.highlightAllInside(resultContainer) || Prism.highlightAll();

    }

};



// Start helpers for share/download

window.downloadResultAsJson = function () {

    if (!LAST_RESULT_DATA) return;

    const blob = new Blob([JSON.stringify(LAST_RESULT_DATA, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `result_${Date.now()}.json`;

    a.click();

    URL.revokeObjectURL(url);

};



window.copyResultLink = function () {

    const url = window.location.href;

    navigator.clipboard.writeText(url).then(() => showToast("Link kopyalandı", "success"));

};



window.shareViaEmail = function () {

    window.open('mailto:?subject=Opradox Result&body=Check this out');

};



window.copyResultSummary = function () {

    const text = document.querySelector('.gm-result-success')?.innerText || '';

    navigator.clipboard.writeText(text).then(() => showToast("Özet kopyalandı", "success"));

};



window.showScenarioList = function () {

    const scList = document.getElementById('scenarioListContainer');

    if (scList) {

        window.scrollTo({ top: 0, behavior: 'smooth' });

    }

    showToast("Yeni senaryo için listeden seçim yapın", "info");

};



// Helper: Escape HTML to prevent XSS

function escapeHtml(text) {

    if (!text) return '';

    const div = document.createElement('div');

    div.textContent = text;

    return div.innerHTML;

}



// Helper: Copy Python code to clipboard

window.copyPythonCode = function () {

    const codeEl = document.getElementById('generatedPythonCode');

    if (codeEl) {

        navigator.clipboard.writeText(codeEl.textContent).then(() => {

            if (typeof showToast === 'function') {

                showToast('✔ ' + (CURRENT_LANG === 'tr' ? 'Kod kopyalandı!' : 'Code copied!'), 'success', 2000);

            }

        });

    }

};



// Helper: Clear result and reset for new scenario

window.clearResultAndReset = function () {

    const resultContainer = document.getElementById("resultJson");

    const feedbackWidget = document.getElementById("inlineFeedbackWidget");



    if (resultContainer) {

        resultContainer.innerHTML = '// ' + (CURRENT_LANG === 'tr' ? 'Sonuçlar burada görünecek.' : 'Results will appear here.');

        resultContainer.style.whiteSpace = 'pre';

    }

    if (feedbackWidget) {

        feedbackWidget.style.display = 'none';

    }



    window.LAST_RESULT_DATA = null;

};



// UI İçin Sabit Metinler (Backend'den gelmeyenler)

const EXTRA_TEXTS = {

    "tr": {

        "file_ph_1": "Dosya Seç / Sürükle",

        "file_ph_2": "İkinci Dosya (Opsiyonel)",

        "file_change": "Dosya Değiştir",

        "modal_about_title": "Hakkımızda",

        "modal_about_desc": "opradox, ofis çalışanlarının veri analizi yükünü hafifletmek için tasarlanmış ücretsiz bir araçtır.<br><br>Reklam içermez, veri toplamaz. Amacımız Excel karmaşasını bitirmek.",

        "reply": "Yanıtla",

        "ph_search": "Senaryo ara...",

        "ph_comment": "Bir şeyler yaz...",

        "run_btn": "Senaryoyu çalıştır",

        "lbl_name": "Ad Soyad", "lbl_email": "E-posta", "lbl_msg": "Mesajınız",

        "send_btn": "Gönder",

        "add_btn": "Ekle",

        "download_btn": "Sonuç Dosyasını İndir",

        "result_summary_title": "Sonuç Özeti",

        "code_summary_title": "Meraklısına Kod Özeti",

        "download_excel": "Excel Olarak İndir",

        "download_csv": "CSV Olarak İndir",

        "download_json": "JSON Olarak İndir",

        "copy_code": "Kopyala",

        "copy_success": "Kopyalandı!",

        "add_second_file": "İkinci Dosya Ekle",

        "info_rows": "satır",

        "info_cols": "sütun",

        "column_ref_note": "­şÆí İşlem sayfasının başında birleştirilmiş hücrelerden oluşan başlık varsa <strong>Önizleme</strong> butonundan sütun isimlerinin olduğu satırı seçin. Buradan sütun adını <strong>tıklayarak kopyalayabilirsiniz</strong>. Ayrıca parametre alanına <strong>sütun adı</strong>, <strong>harf kodu (A, B...)</strong> da yazabilir ya da <strong>listeden seçebilirsiniz</strong>. Aynı parametrede birden fazla sütun için işlem yapılacaksa sütun isimlerini virgül ve boşluk bırakarak yazın.",



        // Builder

        "btn_filter": "Filtre", "btn_group": "Grup", "btn_agg": "İşlem", "btn_sort": "Sırala", "btn_select": "Sütun",

        "ph_column": "Sütun Adı", "ph_value": "Değer",

        "opt_sum": "Topla", "opt_count": "Say", "opt_mean": "Ort.",

        "opt_asc": "Artan", "opt_desc": "Azalan",

        "op_eq": "=", "op_gt": ">", "op_lt": "<", "op_contains": "~",



        // PRO Builder - Tabs

        "pro_tab_filters": "Filtreler",

        "pro_tab_computed": "Hesaplamalar",

        "pro_tab_grouping": "Gruplama",

        "pro_tab_window": "Sıralama (RANK)",

        "pro_tab_output": "çıktı",



        // PRO Builder - Operators

        "op_equals": "Eşittir (=)",

        "op_not_equals": "Eşit Değil (≠)",

        "op_greater": "Büyüktür (>)",

        "op_less": "Küçüktür (<)",

        "op_gte": "Büyük Eşit (≥)",

        "op_lte": "Küçük Eşit (≤)",

        "op_contains_pro": "İçerir",

        "op_not_contains": "İçermez",

        "op_starts_with": "İle Başlar",

        "op_ends_with": "İle Biter",

        "op_in_list": "Listede Var",

        "op_not_in": "Listede Yok",

        "op_is_null": "Boş",

        "op_is_not_null": "Dolu",

        "op_regex": "Regex",



        // PRO Builder - Aggregations

        "agg_sum": "Toplam",

        "agg_count": "Sayı",

        "agg_mean": "Ortalama",

        "agg_median": "Medyan",

        "agg_min": "Minimum",

        "agg_max": "Maksimum",

        "agg_std": "Std. Sapma",

        "agg_first": "İlk Değer",

        "agg_last": "Son Değer",

        "agg_nunique": "Benzersiz Sayı",



        // PRO Builder - Window Functions

        "wf_rank": "Sıralama (RANK)",

        "wf_dense_rank": "Kesintisiz Sıra",

        "wf_row_number": "Satır No",

        "wf_cumsum": "Kümülatif Toplam",

        "wf_percent_rank": "Yüzdelik Sıra",



        // PRO Builder - Computed

        "comp_arithmetic": "Aritmetik İşlem",

        "comp_if_else": "Koşullu Değer",

        "comp_concat": "Metin Birleştir",

        "comp_date_diff": "Tarih Farkı",

        "comp_text_transform": "Metin Dönüştürme",



        // PRO Builder - Text Transform Types

        "tt_remove_parentheses": "Parantez Sil",

        "tt_extract_parentheses": "Parantez İçini çıkar",

        "tt_first_n_words": "İlk N Kelime",

        "tt_remove_after_dash": "Tire Sonrasını Sil",

        "tt_regex": "Regex (İleri)",

        "tt_source_col": "Kaynak Sütun",

        "tt_word_count": "Kelime Sayısı",

        "tt_pattern": "Regex Pattern",

        "tt_replacement": "Yerine Koy",



        // PRO Builder - Output

        "out_single": "Tek Sayfa",

        "out_multi": "Özet + Detay",

        "out_per_group": "Grup Başına Sayfa",

        "out_summary": "Özet Sayfası Ekle",



        // PRO Builder - Labels

        "lbl_add_filter": "Filtre Ekle",

        "lbl_add_computed": "Hesaplama Ekle",

        "lbl_add_group": "Grup Ekle",

        "lbl_add_agg": "Toplama Ekle",

        "lbl_add_window": "RANK Ekle",

        "lbl_add_sort": "Sıralama Ekle",

        "lbl_partition_by": "Hangi sütuna göre grupla?",

        "lbl_order_by": "Hangi sütuna göre sırala?",

        "lbl_alias": "Oluşacak sütunun adı",

        "lbl_new_col_name": "Oluşacak sütunun adı",

        "lbl_formula_cols": "İşleme girecek sütunlar",

        "lbl_operation": "İşlem Türü",

        "lbl_logic": "Mantık",

        "logic_and": "ve",

        "logic_or": "veya",

        "arith_add": "Topla (+)",

        "arith_subtract": "çıkar (-)",

        "arith_multiply": "çarp (×)",

        "arith_divide": "Böl (÷)",

        "arith_percent": "Yüzde (%)",



        // Checkbox Filter

        "lbl_add_options": "Opsiyon Ekle",

        "lbl_value_filter": "Değer Filtresi",

        "lbl_value_filter_desc": "Sadece seçilen değerler sıralamaya dahil edilir",

        "lbl_search": "Ara...",

        "lbl_select_all": "Tümünü Seç",

        "lbl_clear_all": "Temizle",

        "lbl_selected": "seçildi",

        "lbl_loading": "Yükleniyor...",



        // İkinci Dosya İşlemleri

        "lbl_merge": "Birleştir (VLOOKUP)",

        "lbl_union": "Alt Alta Ekle",

        "lbl_diff": "Fark Bul",

        "lbl_validate": "Doğrula",

        "block_merge": "Birleştir",

        "block_union": "Alt Alta Ekle",

        "block_diff": "Fark Bul",

        "block_validate": "Doğrula",

        "block_window": "Rank / Pencere",

        "lbl_second_file_required": "Aynı veya farklı dosyadan seçim yapabilirsiniz",

        "lbl_second_source_success": "Kaynak: {filename}",

        "lbl_second_source_info": "İstersen aynı dosyadan farklı sayfa da seçebilirsin.",

        "lbl_second_source_warning": "Bu senaryo ikinci kaynak gerektirir: 2. dosya yükle veya sayfa seç.",

        "lbl_second_file_ref": "İkinci dosyadan referans liste seçebilirsiniz",

        "lbl_main_file_col": "Ana Dosya Sütunu:",

        "lbl_second_file_col": "İkinci Dosya Sütunu:",

        "lbl_join_type": "Birleştirme Tipi:",

        "lbl_check_col": "Kontrol Edilecek Sütun:",

        "lbl_ref_col": "Referans Liste Sütunu:",

        "lbl_result_col_name": "Sonuç Sütun Adı:",

        "join_left": "SOL (VLOOKUP)",

        "join_inner": "ORTAK (Sadece Eşleşen)",

        "join_right": "SAğ",

        "join_outer": "TAM (Tümü)",

        "union_desc": "İki dosya alt alta birleştirilecek. Sütunlar otomatik eşleştirilir.",

        "diff_result": "­şôî Sonuç: Ana dosyada olup ikinci dosyada OLMAYAN kayıtlar",

        "validate_result": "­şôî Sonuç: Yeni sütun eklenir → Geçerli / Geçersiz",

        "recommend_site": "Siteyi Tavsiye Et",

        "share_result": "Sonuç Paylaş",



        // === Veri Kaynağı Seçici ===

        "lbl_data_source": "Veri Kaynağı",

        "data_source_primary": "Ana Dosya",

        "data_source_secondary": "İkinci Dosya",

        "data_source_crosssheet": "Aynı Dosyadan Farklı Sayfa",

        "data_source_hint": "İkinci dosya yükleyin veya aynı dosyadan farklı sayfa seçin",



        // === YENİ ÖZELLİKLER (2024) ===

        // Koşullu Biçimlendirme

        "lbl_add_cf": "Koşullu Biçimlendirme",

        "block_cf": "Koşullu Biçimlendirme",

        "cf_color_scale": "Renk Skalası (3 Renk)",

        "cf_2_color_scale": "Renk Skalası (2 Renk)",

        "cf_data_bar": "Veri çubuğu",

        "cf_icon_set": "İkon Seti",

        "cf_threshold": "Eşik Değer",

        "cf_top_n": "En Yüksek N",

        "cf_bottom_n": "En Düşük N",

        "cf_duplicate": "Tekrarlananlar",

        "cf_unique": "Benzersizler",

        "cf_column": "Sütun",

        "cf_threshold_value": "Eşik Değeri",

        "cf_n_value": "N Değeri",

        "cf_min_color": "Min Renk",

        "cf_max_color": "Max Renk",

        "cf_bar_color": "çubuk Rengi",



        // Grafik

        "lbl_add_chart": "Grafik Ekle",

        "block_chart": "Grafik",

        "chart_column": "Sütun Grafik",

        "chart_bar": "çubuk Grafik",

        "chart_line": "çizgi Grafik",

        "chart_area": "Alan Grafik",

        "chart_pie": "Pasta Grafik",

        "chart_doughnut": "Halka Grafik",

        "chart_scatter": "Dağılım Grafiği",

        "chart_x_axis": "X Ekseni",

        "chart_y_axis": "Y Ekseni",

        "chart_title": "Grafik Başlığı",



        // Pivot

        "lbl_add_pivot": "Pivot Tablo",

        "block_pivot": "Pivot Tablo",

        "pivot_rows": "Satır Alanları",

        "pivot_cols": "Sütun Alanları",

        "pivot_values": "Değer Alanları",

        "pivot_show_totals": "Toplam Göster",

        "pivot_title": "Pivot Tablo Başlığı",

        "pivot_show_subtotals": "Ara Toplamları Göster",



        // === OPTIONAL FEATURES (YENİ) ===

        "opt_features_title": "İsteğe Bağlı Özellikler",

        "opt_features_empty": "İsteğe bağlı özellik eklemek için yukarıdaki butonları kullanın",

        "opt_already_added": "Zaten eklendi",



        // Date Filter

        "opt_date_filter": "Tarih Filtresi Ekle",

        "opt_date_column": "Tarih Sütunu",

        "opt_start_date": "Başlangıç Tarihi",

        "opt_end_date": "Bitiş Tarihi",



        // Grouping

        "opt_grouping": "Gruplama Ekle",

        "opt_group_column": "Grup Sütunu",



        // Sorting

        "opt_sorting": "Sıralama Ekle",

        "opt_sort_column": "Sıralama Sütunu",

        "opt_sort_order": "Sıra",

        "opt_sort_asc": "Artan (A→Z, 0→9)",

        "opt_sort_desc": "Azalan (Z→A, 9→0)",



        // Zaman Serisi

        "comp_ytd_sum": "YTD (Yıl Başından Bugüne)",

        "comp_mtd_sum": "MTD (Ay Başından Bugüne)",

        "comp_yoy_change": "YoY (Yıldan Yıla Değişim %)",

        "comp_qoq_change": "QoQ (çeyrekten çeyreğe %)",

        "comp_date_hierarchy": "Tarih Hiyerarşisi",

        "ts_date_column": "Tarih Sütunu",

        "ts_value_column": "Değer Sütunu",



        // çıktı Ayarları

        "lbl_add_output": "çıktı Ayarları",

        "block_output": "çıktı Ayarları",

        "out_freeze_header": "Başlık Dondur",

        "out_auto_fit": "Sütun Genişliği Otomatik",

        "out_number_format": "Sayı Formatı",

        "out_header_style": "Başlık Stili",



        // What-If Analizi

        "lbl_add_variable": "Değişken Tanımla",

        "block_variable": "Değişken",

        "var_name": "Değişken Adı",

        "var_value": "Değer",

        "var_hint": "Hesaplamalarda $DeğişkenAdı şeklinde kullanın",



        // Dosya Önizleme

        "preview_file": "Dosyayı Önizle",

        "file_preview_title": "Dosya Önizleme (İlk 10 Satır)",

        "no_preview": "Önizleme için önce dosya yükleyin.",



        // Cross-Sheet (Aynı dosyadan farklı sayfa)

        "use_same_file_sheet": "Ana dosyadan farklı sayfa kullan",

        "select_sheet": "Sayfa seç:",



        // Queue Modal

        "queue_pos": "Sıra",

        "elapsed_time": "Süre",

        "server_load": "Sunucu Yükü",

        "cancel_job": "İptal Et",



        // Feedback Widget

        "feedback_question": "Bu sonuç işinize yaradı mı?",

        "feedback_name_placeholder": "İsminiz (opsiyonel)",

        "feedback_message_placeholder": "Görüşünüz...",

        "feedback_type_thanks": "Teşekkür",

        "feedback_type_suggestion": "Öneri",

        "feedback_type_comment": "Yorum",

        "feedback_type_bug": "Hata",

        "feedback_submit_btn": "Gönder",

        "feedback_success_message": "✓ Teşekkürler! Görüşünüz bizim için değerli.",



        // === YENİ HESAPLAMA TİPLERİ (2024-12) ===

        "comp_running_total": "Kümülatif Toplam",

        "comp_moving_avg": "Hareketli Ortalama",

        "comp_growth_rate": "Büyüme Oranı (%)",

        "comp_percentile_rank": "Yüzdelik Sıralama",

        "comp_z_score": "Z-Skoru (Standart Sapma)",

        "comp_age": "Yaş Hesapla",

        "comp_split": "Sütun Böl",

        "comp_normalize_turkish": "Türkçe Düzelt (İ→I)",

        "comp_extract_numbers": "Sayı çıkar",

        "comp_weekday": "Haftanın Günü",

        "comp_business_days": "İş Günü Farkı",

        "comp_duplicate_flag": "Tekrar İşaretle",

        "comp_missing_flag": "Eksik Veri İşaretle",

        "comp_correlation": "Korelasyon",

        // Yeni hesaplama tipleri - parametreler

        "new_cc_value_col": "Değer Sütunu",

        "new_cc_group_col": "Gruplama Sütunu (Opsiyonel)",

        "new_cc_window_size": "Pencere Boyutu (N)",

        "new_cc_date_col": "Tarih Sütunu",

        "new_cc_source_col": "Kaynak Sütun",

        "new_cc_separator": "Ayraç (,/-/vb.)",

        "new_cc_part_index": "Parça No (0=ilk)",

        "new_cc_check_col": "Kontrol Sütunu",

        "new_cc_col1": "Birinci Sütun",

        "new_cc_col2": "İkinci Sütun",

        "new_cc_date1": "Başlangıç Tarihi Sütunu",

        "new_cc_date2": "Bitiş Tarihi Sütunu",



        // === EXCEL STUDIO V2 (2024-12) ===

        "pro_title": "Özel Rapor Oluşturucu",

        "pro_subtitle": "Sürükle, Bırak, Raporla",

        "add_file": "Dosya Ekle",

        "file_preview": "Önizleme",

        "search_scenarios": "Senaryo ara...",

        "active": "Aktif",

        "help_placeholder": "Detaylar için senaryo seçin.",

        "waiting_selection": "Seçim Bekleniyor...",

        "results_placeholder": "// Sonuçlar burada görünecek.",

        "step3_title": "Senaryo Ayarları",

        "pro_coming_soon": "Visual Builder yakında aktif olacak!",

        "new_file": "Yeni Dosya"

    },

    "en": {

        "file_ph_1": "Select File / Drag & Drop",

        "file_ph_2": "Second File (Optional)",

        "file_change": "Change File",

        "modal_about_title": "About Us",

        "modal_about_desc": "opradox is a free tool designed to ease data analysis for office workers.<br><br>No ads, no data collection. Our goal is to end Excel chaos.",

        "reply": "Reply",

        "ph_search": "Search scenario...",

        "ph_comment": "Write something...",

        "run_btn": "Run Scenario",

        "lbl_name": "Name", "lbl_email": "Email", "lbl_msg": "Message",

        "send_btn": "Send",

        "add_btn": "Add",

        "download_btn": "Download Result File",

        "result_summary_title": "Result Summary",

        "code_summary_title": "Code Summary for Enthusiasts",

        "download_excel": "Download as Excel",

        "download_csv": "Download as CSV",

        "download_json": "Download as JSON",

        "copy_code": "Copy",

        "copy_success": "Copied!",

        "add_second_file": "Add Second File",

        "info_rows": "rows",



        // File Preview

        "preview_file": "Preview File",

        "file_preview_title": "File Preview (First 10 Rows)",

        "no_preview": "Upload a file first to preview.",



        // Queue Modal

        "queue_pos": "Position",

        "elapsed_time": "Time",

        "server_load": "Server Load",

        "cancel_job": "Cancel",

        "info_cols": "columns",



        // Feedback Widget

        "feedback_question": "Was this result helpful?",

        "feedback_name_placeholder": "Your name (optional)",

        "feedback_message_placeholder": "Your feedback...",

        "feedback_type_thanks": "Thanks",

        "feedback_type_suggestion": "Suggestion",

        "feedback_type_comment": "Comment",

        "feedback_type_bug": "Bug",

        "feedback_submit_btn": "Submit",

        "feedback_success_message": "✓ Thank you! Your feedback is valuable to us.",

        "column_ref_note": "­şÆí If there are merged header cells at the top of your worksheet, use the <strong>Preview</strong> button to select the row containing column names. You can <strong>click to copy</strong> column names from there. You can also type <strong>column name</strong>, <strong>letter code (A, B...)</strong> in the parameter field, or <strong>select from dropdown</strong>. For multiple columns in the same parameter, separate column names with a comma and space.",



        // Cross-Sheet (Same file, different sheet)

        "use_same_file_sheet": "Use different sheet from same file",

        "select_sheet": "Select sheet:",



        // Builder

        "btn_filter": "Filter", "btn_group": "Group", "btn_agg": "Agg", "btn_sort": "Sort", "btn_select": "Select",

        "ph_column": "Column Name", "ph_value": "Value",

        "opt_sum": "Sum", "opt_count": "Count", "opt_mean": "Mean",

        "opt_asc": "Asc", "opt_desc": "Desc",

        "op_eq": "=", "op_gt": ">", "op_lt": "<", "op_contains": "~",



        // PRO Builder - Tabs

        "pro_tab_filters": "Filters",

        "pro_tab_computed": "Calculations",

        "pro_tab_grouping": "Grouping",

        "pro_tab_window": "Ranking (RANK)",

        "pro_tab_output": "Output",



        // PRO Builder - Operators

        "op_equals": "Equals (=)",

        "op_not_equals": "Not Equals (≠)",

        "op_greater": "Greater (>)",

        "op_less": "Less (<)",

        "op_gte": "Greater or Equal (≥)",

        "op_lte": "Less or Equal (≤)",

        "op_contains_pro": "Contains",

        "op_not_contains": "Does Not Contain",

        "op_starts_with": "Starts With",

        "op_ends_with": "Ends With",

        "op_in_list": "In List",

        "op_not_in": "Not In List",

        "op_is_null": "Is Empty",

        "op_is_not_null": "Is Not Empty",

        "op_regex": "Regex",



        // PRO Builder - Aggregations

        "agg_sum": "Sum",

        "agg_count": "Count",

        "agg_mean": "Average",

        "agg_median": "Median",

        "agg_min": "Minimum",

        "agg_max": "Maximum",

        "agg_std": "Std. Deviation",

        "agg_first": "First Value",

        "agg_last": "Last Value",

        "agg_nunique": "Distinct Count",



        // PRO Builder - Window Functions

        "wf_rank": "Rank",

        "wf_dense_rank": "Dense Rank",

        "wf_row_number": "Row Number",

        "wf_cumsum": "Cumulative Sum",

        "wf_percent_rank": "Percent Rank",



        // PRO Builder - Computed

        "comp_arithmetic": "Arithmetic",

        "comp_if_else": "Conditional",

        "comp_concat": "Concatenate",

        "comp_date_diff": "Date Difference",

        "comp_text_transform": "Text Transform",



        // PRO Builder - Text Transform Types

        "tt_remove_parentheses": "Remove Parentheses",

        "tt_extract_parentheses": "Extract Parentheses Content",

        "tt_first_n_words": "First N Words",

        "tt_remove_after_dash": "Remove After Dash",

        "tt_regex": "Regex (Advanced)",

        "tt_source_col": "Source Column",

        "tt_word_count": "Word Count",

        "tt_pattern": "Regex Pattern",

        "tt_replacement": "Replacement",



        // PRO Builder - Output

        "out_single": "Single Sheet",

        "out_multi": "Summary + Detail",

        "out_per_group": "Sheet Per Group",

        "out_summary": "Include Summary Sheet",



        // PRO Builder - Labels

        "lbl_add_filter": "Add Filter",

        "lbl_add_computed": "Add Calculation",

        "lbl_add_group": "Add Group",

        "lbl_add_agg": "Add Aggregation",

        "lbl_add_window": "Add RANK",

        "lbl_add_sort": "Add Sort",

        "lbl_partition_by": "Which column to partition by?",

        "lbl_order_by": "Which column to order by?",

        "lbl_alias": "Result column name",

        "lbl_new_col_name": "Result column name",

        "lbl_formula_cols": "Columns for operation",

        "lbl_operation": "Operation Type",

        "lbl_logic": "Logic",

        "logic_and": "and",

        "logic_or": "or",

        "arith_add": "Add (+)",

        "arith_subtract": "Subtract (-)",

        "arith_multiply": "Multiply (×)",

        "arith_divide": "Divide (÷)",

        "arith_percent": "Percent (%)",



        // Checkbox Filter

        "lbl_add_options": "Add Options",

        "lbl_value_filter": "Value Filter",

        "lbl_value_filter_desc": "Only selected values will be included in ranking",

        "lbl_search": "Search...",

        "lbl_select_all": "Select All",

        "lbl_clear_all": "Clear",

        "lbl_selected": "selected",

        "lbl_loading": "Loading...",



        // Second File Operations

        "lbl_merge": "Merge (VLOOKUP)",

        "lbl_union": "Union (Append)",

        "lbl_diff": "Find Diff",

        "lbl_validate": "Validate",

        "block_merge": "Merge",

        "block_union": "Union",

        "block_diff": "Diff",

        "block_validate": "Validate",

        "block_window": "Rank / Window",

        "lbl_second_file_required": "You can select from the same or a different file",

        "lbl_second_source_success": "Source: {filename}",

        "lbl_second_source_info": "You can also pick another sheet from the same workbook.",

        "lbl_second_source_warning": "This scenario requires a second source: upload a 2nd file or select a sheet.",

        "lbl_second_file_ref": "You can select a reference list from second file",

        "lbl_main_file_col": "Main File Column:",

        "lbl_second_file_col": "Second File Column:",

        "lbl_join_type": "Join Type:",

        "lbl_check_col": "Column to Check:",

        "lbl_ref_col": "Reference List Column:",

        "lbl_result_col_name": "Result Column Name:",

        "join_left": "LEFT (VLOOKUP)",

        "join_inner": "INNER (Only Matching)",

        "join_right": "RIGHT",

        "join_outer": "FULL (All)",

        "union_desc": "Two files will be appended. Columns are matched automatically.",

        "diff_result": "­şôî Result: Records in main file but NOT in second file",

        "validate_result": "­şôî Result: New column added → Valid / Invalid",

        "recommend_site": "Recommend Site",

        "share_result": "Share Result",



        // === Data Source Selector ===

        "lbl_data_source": "Data Source",

        "data_source_primary": "Main File",

        "data_source_secondary": "Second File",

        "data_source_crosssheet": "Different Sheet from Same File",

        "data_source_hint": "Upload a second file or select a different sheet from the same file",



        // === NEW FEATURES (2024) ===

        // Conditional Formatting

        "lbl_add_cf": "Conditional Formatting",

        "block_cf": "Conditional Formatting",

        "cf_color_scale": "Color Scale (3 Color)",

        "cf_2_color_scale": "Color Scale (2 Color)",

        "cf_data_bar": "Data Bar",

        "cf_icon_set": "Icon Set",

        "cf_threshold": "Threshold Value",

        "cf_top_n": "Top N",

        "cf_bottom_n": "Bottom N",

        "cf_duplicate": "Duplicates",

        "cf_unique": "Unique Values",

        "cf_column": "Column",

        "cf_threshold_value": "Threshold Value",

        "cf_n_value": "N Value",

        "cf_min_color": "Min Color",

        "cf_max_color": "Max Color",

        "cf_bar_color": "Bar Color",



        // Charts

        "lbl_add_chart": "Add Chart",

        "block_chart": "Chart",

        "chart_column": "Column Chart",

        "chart_bar": "Bar Chart",

        "chart_line": "Line Chart",

        "chart_area": "Area Chart",

        "chart_pie": "Pie Chart",

        "chart_doughnut": "Doughnut Chart",

        "chart_scatter": "Scatter Chart",

        "chart_x_axis": "X Axis",

        "chart_y_axis": "Y Axis",

        "chart_title": "Chart Title",



        // Pivot

        "lbl_add_pivot": "Pivot Table",

        "block_pivot": "Pivot Table",

        "pivot_rows": "Row Fields",

        "pivot_cols": "Column Fields",

        "pivot_values": "Value Fields",

        "pivot_show_totals": "Show Totals",



        // === OPTIONAL FEATURES (NEW) ===

        "opt_features_title": "Optional Features",

        "opt_features_empty": "Use buttons above to add optional features",

        "opt_already_added": "Already added",

        "opt_features_warning": "If the uploaded file does not contain data for the option you want to add, the operation will fail.",



        // Date Filter

        "opt_date_filter": "Add Date Filter",

        "opt_date_column": "Date Column",

        "opt_start_date": "Start Date",

        "opt_end_date": "End Date",



        // Grouping

        "opt_grouping": "Add Grouping",

        "opt_group_column": "Group Column",



        // Sorting

        "opt_sorting": "Add Sorting",

        "opt_sort_column": "Sort Column",

        "opt_sort_order": "Order",

        "opt_sort_asc": "Ascending (A→Z, 0→9)",

        "opt_sort_desc": "Descending (Z→A, 9→0)",



        // Time Series

        "comp_ytd_sum": "YTD (Year to Date)",

        "comp_mtd_sum": "MTD (Month to Date)",

        "comp_yoy_change": "YoY (Year over Year %)",

        "comp_qoq_change": "QoQ (Quarter over Quarter %)",

        "comp_date_hierarchy": "Date Hierarchy",

        "ts_date_column": "Date Column",

        "ts_value_column": "Value Column",



        // Output Settings

        "lbl_add_output": "Output Settings",

        "block_output": "Output Settings",

        "out_freeze_header": "Freeze Header",

        "out_auto_fit": "Auto-fit Columns",

        "out_number_format": "Number Format",

        "out_header_style": "Header Style",



        // What-If Analysis

        "lbl_add_variable": "Define Variable",

        "block_variable": "Variable",

        "var_name": "Variable Name",

        "var_value": "Value",

        "var_hint": "Use $VariableName in calculations",



        // File Preview

        "preview_file": "Preview File",

        "file_preview_title": "File Preview (First 10 Rows)",

        "no_preview": "Upload a file first to preview.",



        // === NEW COMPUTED TYPES (2024-12) ===

        "comp_running_total": "Running Total",

        "comp_moving_avg": "Moving Average",

        "comp_growth_rate": "Growth Rate (%)",

        "comp_percentile_rank": "Percentile Rank",

        "comp_z_score": "Z-Score (Std Dev)",

        "comp_age": "Calculate Age",

        "comp_split": "Split Column",

        "comp_normalize_turkish": "Normalize Turkish (İ→I)",

        "comp_extract_numbers": "Extract Numbers",

        "comp_weekday": "Weekday",

        "comp_business_days": "Business Days",

        "comp_duplicate_flag": "Flag Duplicates",

        "comp_missing_flag": "Flag Missing Data",

        "comp_correlation": "Correlation",

        // New computed types - parameters

        "new_cc_value_col": "Value Column",

        "new_cc_group_col": "Group Column (Optional)",

        "new_cc_window_size": "Window Size (N)",

        "new_cc_date_col": "Date Column",

        "new_cc_source_col": "Source Column",

        "new_cc_separator": "Separator (,/-/etc.)",

        "new_cc_part_index": "Part Index (0=first)",

        "new_cc_check_col": "Check Column",

        "new_cc_col1": "First Column",

        "new_cc_col2": "Second Column",

        "new_cc_date1": "Start Date Column",

        "new_cc_date2": "End Date Column",



        // === EXCEL STUDIO V2 (2024-12) ===

        "pro_title": "Custom Report Builder",

        "pro_subtitle": "Drag, Drop, Report",

        "add_file": "Add File",

        "file_preview": "Preview",

        "search_scenarios": "Search scenarios...",

        "active": "Active",

        "help_placeholder": "Select a scenario for details.",

        "waiting_selection": "Waiting for selection...",

        "results_placeholder": "// Results will appear here.",

        "step3_title": "Scenario Settings",

        "pro_coming_soon": "Visual Builder coming soon!",

        "new_file": "New File"

    }

};



// Sayfa Yüklendiğinde Başlat

window.addEventListener("DOMContentLoaded", () => {

    // Önce Eventleri Bağla (Butonlar hazır olsun)

    bindEvents();



    // Tema Kontrolü - FAZ-THEME-2: Guarantee XOR state

    document.body.classList.remove('dark-mode', 'day-mode');

    if (localStorage.getItem("gm_theme") === "day") {

        document.body.classList.add("day-mode");

    } else {

        document.body.classList.add("dark-mode");

    }



    // Metinleri İlk Dile Göre Ayarla

    updateUITexts();



    // ===== SENARYO ARAMA İşLEYİCİSİ =====

    const scenarioSearch = document.getElementById("scenarioSearch");

    if (scenarioSearch) {

        scenarioSearch.addEventListener("input", (e) => {

            const query = e.target.value.toLowerCase().trim();

            const container = document.getElementById("scenarioListContainer");

            if (!container) return;



            const cards = container.querySelectorAll(".gm-excel-scenario-card");

            const categories = container.querySelectorAll(".gm-excel-category-label");

            const categoryVisibility = {};



            // Tüm kartları filtrele

            cards.forEach(card => {

                const title = (card.dataset.title || "").toLowerCase();

                const catKey = card.dataset.category || "";

                const matches = query === "" || title.includes(query);



                card.style.display = matches ? "" : "none";



                // Kategori görünürlüğünü takip et

                if (!categoryVisibility[catKey]) categoryVisibility[catKey] = false;

                if (matches) categoryVisibility[catKey] = true;

            });



            // Kategori başlıklarını güncelle

            categories.forEach(cat => {

                const catKey = cat.dataset.category || "";

                cat.style.display = categoryVisibility[catKey] ? "" : "none";

            });

        });

    }



    // ===== SğRğKLE-BIRAK DROP HANDLER =====

    const middlePane = document.querySelector(".gm-middle-pane");

    if (middlePane) {

        middlePane.addEventListener("dragover", (e) => {

            e.preventDefault();

            middlePane.classList.add("drag-over");

        });



        middlePane.addEventListener("dragleave", (e) => {

            // Sadece pane dışına çıkıldığında kaldır

            if (!middlePane.contains(e.relatedTarget)) {

                middlePane.classList.remove("drag-over");

            }

        });



        middlePane.addEventListener("drop", (e) => {

            e.preventDefault();

            middlePane.classList.remove("drag-over");



            try {

                const data = JSON.parse(e.dataTransfer.getData("text/plain"));

                if (data && data.id) {

                    // Senaryo nesnesini bul

                    const scenario = SCENARIO_LIST.find(sc => sc.id === data.id);

                    if (scenario) {

                        // Kartı bul ve seç

                        const card = document.querySelector(`.gm-excel-scenario-card[data-id="${data.id}"]`);

                        selectScenario(scenario, card);

                        if (typeof showToast === "function") {

                            showToast(`✓ ${scenario.title} seçildi`, "success", 2000);

                        }

                    }

                }

            } catch (err) {

                console.error("Drop parse error:", err);

            }

        });

    }



    // Veriyi çek

    initApp();

});



async function initApp() {

    await loadMenuData(CURRENT_LANG);

}



async function loadMenuData(lang) {

    try {

        const res = await fetch(`${BACKEND_BASE_URL}/ui/menu?lang=${lang}`);

        if (!res.ok) throw new Error("API Error");

        const data = await res.json();



        // Dictionary for Menu

        SCENARIO_CATALOG = data.categories || {};



        // Flatten List for .find()

        SCENARIO_LIST = [];

        if (Array.isArray(SCENARIO_CATALOG)) {

            SCENARIO_LIST = SCENARIO_CATALOG; // Should not happen with current backend

        } else {

            Object.values(SCENARIO_CATALOG).forEach(list => {

                if (Array.isArray(list)) SCENARIO_LIST.push(...list);

            });

        }



        UI_TEXTS = data.text;



        updateUITexts();

        renderAccordionMenu();



        // Eğer aktif senaryo varsa içeriğini yenile

        if (ACTIVE_SCENARIO_ID) {

            loadScenarioHelp(ACTIVE_SCENARIO_ID);

            const btn = document.querySelector(`.gm-scenario-btn[data-id="${ACTIVE_SCENARIO_ID}"]`);

            if (btn) {

                document.getElementById("scenarioTitle").textContent = btn.textContent;

                // Parametreleri yeniden çiz

                let params = [];

                try { params = JSON.parse(btn.dataset.params || "[]"); } catch (e) { }

                renderDynamicForm(ACTIVE_SCENARIO_ID, params);

            }

        }



    } catch (err) {

        console.error("Menu load error:", err);

        document.getElementById("scenarioListContainer").innerHTML =

            `<div style="padding:20px; text-align:center; color:#ef4444;">Bağlantı Hatası<br>Backend çalışıyor mu?</div>`;

    }

}



function updateUITexts() {

    // Backend'den gelenler

    document.querySelectorAll("[data-i18n]").forEach(el => {

        const key = el.getAttribute("data-i18n");

        if (UI_TEXTS[key]) el.textContent = UI_TEXTS[key];

        else if (EXTRA_TEXTS[CURRENT_LANG][key]) el.textContent = EXTRA_TEXTS[CURRENT_LANG][key];

    });



    // Özel Alanlar

    const T = EXTRA_TEXTS[CURRENT_LANG];



    // Dosya Inputları

    const f1 = document.getElementById("fileLabelText");

    const inp1 = document.getElementById("fileInput");

    if (f1) f1.textContent = (inp1 && inp1.files.length > 0) ? T.file_change : T.file_ph_1;



    const f2 = document.getElementById("fileLabelText2");

    if (f2) f2.textContent = T.file_ph_2;



    // Modal

    const modalTitle = document.querySelector("[data-i18n='modal_about_title']");

    const modalDesc = document.querySelector("[data-i18n='modal_about_desc']");

    if (modalTitle) modalTitle.textContent = T.modal_about_title;

    if (modalDesc) modalDesc.innerHTML = T.modal_about_desc;



    // Placeholders

    const search = document.getElementById("scenarioSearch");

    const comm = document.getElementById("publicComment");

    if (search) search.placeholder = T.ph_search;

    if (comm) comm.placeholder = T.ph_comment;



    // Dil Etiketi - TR için yuvarlak Türk Bayrağı, EN için sadece metin

    const langLabel = document.getElementById("langLabel");

    const trFlag = '<img src="img/tr_flag.png" style="width:18px; height:18px; vertical-align:middle; margin-right:3px; border-radius:50%;" alt="TR">';

    if (CURRENT_LANG === 'tr') {

        langLabel.innerHTML = `<span style="font-weight:bold; text-decoration:underline;">${trFlag}Tr</span> | En`;

    } else {

        langLabel.innerHTML = `${trFlag}Tr | <span style="font-weight:bold; text-decoration:underline;">En</span>`;

    }



    // Dosya Bilgi Paneli (dil değiştiğinde güncelle)

    const infoNote = document.querySelector(".gm-info-note");

    if (infoNote && T.column_ref_note) {

        infoNote.innerHTML = T.column_ref_note;

    }

    const toggleText = document.querySelector("#secondFileToggle span");

    if (toggleText) toggleText.textContent = T.add_second_file;



    // Sheet dropdown metinleri (dil değişince güncelle)

    const sheetLabel = CURRENT_LANG === 'tr' ? 'Sayfa:' : 'Sheet:';

    const countText = CURRENT_LANG === 'tr' ? 'sayfa' : 'sheets';



    document.querySelectorAll(".gm-sheet-label").forEach(label => {

        label.innerHTML = `<i class="fas fa-layer-group"></i> ${sheetLabel}`;

    });



    document.querySelectorAll(".gm-sheet-count").forEach(badge => {

        const countMatch = badge.textContent.match(/\d+/);

        if (countMatch) {

            badge.textContent = `${countMatch[0]} ${countText}`;

        }

    });



    // Feedback widget placeholder ve title'ları (YENİ)

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {

        const key = el.getAttribute("data-i18n-placeholder");

        if (T[key]) el.placeholder = T[key];

    });



    document.querySelectorAll("[data-i18n-title]").forEach(el => {

        const key = el.getAttribute("data-i18n-title");

        if (T[key]) el.title = T[key];

    });



    // Önizle butonu metinleri

    document.querySelectorAll(".gm-btn-preview .gm-preview-text").forEach(text => {

        text.textContent = T.preview_file || 'Dosyayı Önizle';

    });

}



// Global Column Cache

let FILE_COLUMNS = [];

let FILE2_COLUMNS = [];



// Sheet tracking (YENİ: Multi-sheet Excel desteği)

let FILE_SHEET_NAMES = [];

let FILE_SELECTED_SHEET = null;

let FILE2_SHEET_NAMES = [];

let FILE2_SELECTED_SHEET = null;

let CURRENT_FILE = null;  // Ana dosya referansı

let CURRENT_FILE2 = null; // İkinci dosya referansı

let FILE2_NAME = null;    // İkinci dosya adı (UI'da göstermek için)







async function inspectFile(file, sheetName = null, skipDropdownRebuild = false, headerRow = null) {

    // headerRow null ise global değişkeni kullan

    const effectiveHeaderRow = headerRow !== null ? headerRow : SELECTED_HEADER_ROW;

    console.log("🔍 inspectFile called:", { fileName: file.name, sheetName, skipDropdownRebuild, headerRow: effectiveHeaderRow });



    const formData = new FormData();

    formData.append("file", file);



    // URL query params olarak gönder

    let url = `${BACKEND_BASE_URL}/ui/inspect`;

    const params = new URLSearchParams();

    if (sheetName) {

        params.append("sheet_name", sheetName);

    }

    if (effectiveHeaderRow > 0) {

        params.append("header_row", effectiveHeaderRow.toString());

    }

    if (params.toString()) {

        url += `?${params.toString()}`;

    }

    console.log("📄 inspect URL:", url);



    try {

        const res = await fetch(url, {

            method: "POST",

            body: formData

        });

        const data = await res.json();

        console.log(`✓ Backend: sheet="${data.active_sheet}" rows=${data.row_count} cols=${data.columns?.length} first="${data.columns?.[0]}"`);



        // Dosya yükleme toast bildirimi

        if (typeof showToast === 'function' && data.columns && data.row_count) {

            const T = EXTRA_TEXTS[CURRENT_LANG];

            const successMsg = CURRENT_LANG === 'tr'

                ? `📊 ${data.row_count} satır, ${data.columns.length} sütun yüklendi`

                : `📊 ${data.row_count} rows, ${data.columns.length} columns loaded`;

            showToast(successMsg, 'success', 3000);

        }



        if (data.columns) {

            FILE_COLUMNS = data.columns;



            // Sheet bilgilerini kaydet (sadece ilk yüklemede)

            if (!skipDropdownRebuild && data.sheet_names && data.sheet_names.length > 0) {

                FILE_SHEET_NAMES = data.sheet_names;

                window.SHEET_NAMES = data.sheet_names; // VisualBuilder için global erişim

                FILE_SELECTED_SHEET = data.active_sheet || data.sheet_names[0];

            }



            FILE_COLUMN_LETTERS = data.column_letters || {};

            updateColumnDatalist();



            // YENİ: Backend'den gelen ham satırları kaydet (başlık satırı seçimi için)

            // Backend artık doğrudan raw_rows formatında döndürüyor

            if (data.raw_rows && data.raw_rows.length > 0) {

                FILE_RAW_PREVIEW_ROWS = data.raw_rows;

                console.log('✔ FILE_RAW_PREVIEW_ROWS set:', FILE_RAW_PREVIEW_ROWS.length, 'rows');

            } else if (data.preview_rows && data.preview_rows.length > 0) {

                // Fallback: Eski format (preview_rows sözlük formatında)

                FILE_RAW_PREVIEW_ROWS = data.preview_rows.map(row => ({

                    cells: Object.values(row).map(val => val !== null && val !== undefined ? String(val) : '')

                }));

                // Başlık satırını da ekle (sütun isimleri)

                if (data.columns && data.columns.length > 0) {

                    FILE_RAW_PREVIEW_ROWS.unshift({

                        cells: data.columns.map(c => String(c))

                    });

                }

                console.log('✔ FILE_RAW_PREVIEW_ROWS set (fallback):', FILE_RAW_PREVIEW_ROWS.length, 'rows');

            }



            showFileInfo(data, 1, skipDropdownRebuild);



            // DYNAMIC REFRESH: Ana dosya yüklendiğinde aktif senaryo formunu güncelle

            // Bu sayede kullanıcı önce senaryo seçip sonra dosya yüklerse sütunlar anında yansır

            document.querySelectorAll('.pro-column-selector-wrapper[data-column-source="primary"]').forEach(widget => {

                const selectEl = widget.querySelector('select');

                if (selectEl) {

                    const currentVal = selectEl.value;

                    selectEl.innerHTML = '<option value="">-- Seçin --</option>' +

                        data.columns.map(col => `<option value="${col}"${col === currentVal ? ' selected' : ''}>${col}</option>`).join('');

                }

            });

            console.log('✔ Primary column selectors refreshed with new main file columns');



            // DYNAMIC ENABLE: Crosssheet option enable et (if multiple sheets)

            if (data.sheet_names && data.sheet_names.length > 1) {

                const otherSheets = data.sheet_names.filter(s => s !== data.active_sheet);

                const T = EXTRA_TEXTS[CURRENT_LANG] || EXTRA_TEXTS['tr'];



                document.querySelectorAll('.gm-data-source-select').forEach(select => {

                    // Enable crosssheet option

                    const crosssheetOpt = select.querySelector('option[value="crosssheet"]');

                    if (crosssheetOpt) {

                        crosssheetOpt.disabled = false;

                        crosssheetOpt.style.display = '';

                        console.log('✔ Crosssheet option enabled in data_source dropdown');

                    }



                    // Get or create crosssheet-area

                    const paramName = select.name || select.id.replace('data_source_', '');

                    let csArea = document.getElementById(`crosssheet_area_${paramName}`);



                    if (!csArea && otherSheets.length > 0) {

                        // CREATE crosssheet-area dynamically (wasn't created at render time)

                        csArea = document.createElement('div');

                        csArea.id = `crosssheet_area_${paramName}`;

                        csArea.className = 'crosssheet-area';

                        csArea.style.cssText = 'display: none; gap: 10px; align-items: center; margin-top: 8px;';

                        csArea.innerHTML = `

                            <span style="font-size:0.85rem; color:var(--gm-text-muted);">${T.lbl_sheet || 'Sayfa'}:</span>

                            <select class="crosssheet-select" style="flex:1; padding:6px 10px; border:1px solid var(--gm-border); border-radius:6px; background:var(--gm-bg); color:var(--gm-text);">

                                ${otherSheets.map(s => `<option value="${s}">${s}</option>`).join('')}

                            </select>

                        `;



                        // Insert after the dropdown row in the wrapper

                        const wrapper = select.closest('.gm-data-source-block');

                        if (wrapper) {

                            wrapper.appendChild(csArea);

                        }



                        // Add change handler for the new crosssheet-select

                        const csSelect = csArea.querySelector('.crosssheet-select');

                        if (csSelect) {

                            csSelect.onchange = async function () {

                                const sheetName = this.value;

                                const fileInput = document.getElementById('fileInput');

                                if (!fileInput || !fileInput.files[0]) return;



                                try {

                                    const formData = new FormData();

                                    formData.append('file', fileInput.files[0]);

                                    const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;

                                    const res = await fetch(url, { method: 'POST', body: formData });

                                    const fetchData = await res.json();



                                    if (fetchData.columns && Array.isArray(fetchData.columns)) {

                                        if (typeof updateFile2ColumnDatalist === 'function') {

                                            updateFile2ColumnDatalist(fetchData.columns);

                                        }



                                        // Update ProColumnSelector widgets

                                        document.querySelectorAll('.pro-column-selector-wrapper[data-column-source="secondary"]').forEach(widget => {

                                            const selectEl = widget.querySelector('select');

                                            if (selectEl) {

                                                const currentVal = selectEl.value;

                                                selectEl.innerHTML = '<option value="">-- Seçin --</option>' +

                                                    fetchData.columns.map(col => `<option value="${col}"${col === currentVal ? ' selected' : ''}>${col}</option>`).join('');

                                            }

                                        });



                                        console.log(`✔ Cross-sheet: "${sheetName}" - ${fetchData.columns.length} sütun yüklendi`);

                                    }

                                } catch (err) {

                                    console.error('Cross-sheet column fetch error:', err);

                                }

                            };

                        }



                        console.log('✔ Crosssheet area CREATED dynamically:', csArea.id);

                    } else if (csArea) {

                        // Update existing crosssheet-select options

                        const csSelect = csArea.querySelector('.crosssheet-select');

                        if (csSelect && otherSheets.length > 0) {

                            csSelect.innerHTML = otherSheets.map(s => `<option value="${s}">${s}</option>`).join('');

                            console.log('✔ Crosssheet sheet options updated:', otherSheets);

                        }

                    }



                    // Auto-select crosssheet if no second file loaded

                    if (!FILE2_COLUMNS || FILE2_COLUMNS.length === 0) {

                        select.value = 'crosssheet';

                        if (csArea) {

                            csArea.style.display = 'flex';

                            // Trigger fetch for first sheet

                            const csSelect = csArea.querySelector('.crosssheet-select');

                            if (csSelect && csSelect.value) {

                                csSelect.dispatchEvent(new Event('change'));

                            }

                        }

                        console.log('✔ Crosssheet auto-selected (no second file loaded)');

                    }

                });

            }



            // YENİ (BUG 2 FIX): Cross-sheet dropdown'ları senkronize et

            // Sol panelden sayfa değişirse, cross-sheet UI'daki dropdown'lar da güncellenmeli

            document.querySelectorAll('.crosssheet-select').forEach(select => {

                // Sadece bu sheet mevcut seçeneklerde varsa güncelle

                const hasOption = Array.from(select.options).some(opt => opt.value === FILE_SELECTED_SHEET);

                if (hasOption && select.value !== FILE_SELECTED_SHEET) {

                    select.value = FILE_SELECTED_SHEET;

                    // CRITICAL FIX: Direkt fonksiyonu çağır (inline handler için synthetic event çalışmıyor)

                    onCrossSheetChange(select);

                    console.log('✔ Cross-sheet dropdown senkronize + triggered:', FILE_SELECTED_SHEET);

                }

            });



            // Cross-sheet seçeneğini güncelle (ikinci dosya alanı açıksa)

            if (!skipDropdownRebuild && typeof updateCrossSheetOption === 'function') {

                updateCrossSheetOption();

            }

        }

    } catch (err) {

        console.error("File inspect error:", err);

    }

}



// İkinci dosya için inspect

async function inspectFile2(file, sheetName = null, skipDropdownRebuild = false, headerRow = null) {

    // headerRow null ise global değişkeni kullan

    const effectiveHeaderRow = headerRow !== null ? headerRow : SELECTED_HEADER_ROW_2;

    console.log("🔍 inspectFile2 called:", { fileName: file.name, sheetName, skipDropdownRebuild, headerRow: effectiveHeaderRow });



    const formData = new FormData();

    formData.append("file", file);



    // URL query params olarak gönder

    let url = `${BACKEND_BASE_URL}/ui/inspect`;

    const params = new URLSearchParams();

    if (sheetName) {

        params.append("sheet_name", sheetName);

    }

    if (effectiveHeaderRow > 0) {

        params.append("header_row", effectiveHeaderRow.toString());

    }

    if (params.toString()) {

        url += `?${params.toString()}`;

    }

    console.log("📄 file2 inspect URL:", url);



    try {

        console.log("📤 Sending file2 to backend:", url);

        const res = await fetch(url, {

            method: "POST",

            body: formData

        });



        if (!res.ok) {

            console.error("❌ Backend response not OK:", res.status, res.statusText);

            return;

        }



        const data = await res.json();

        console.log(`✓ Backend response for file2:`, {

            sheet: data.active_sheet,

            rows: data.row_count,

            cols: data.columns?.length,

            firstCol: data.columns?.[0],

            hasColumns: !!data.columns

        });



        if (data.columns) {

            FILE2_COLUMNS = data.columns;

            console.log(`✔ FILE2_COLUMNS set:`, FILE2_COLUMNS.length, 'columns');



            // Sheet bilgilerini kaydet (sadece ilk yüklemede)

            if (!skipDropdownRebuild && data.sheet_names && data.sheet_names.length > 0) {

                FILE2_SHEET_NAMES = data.sheet_names;

                FILE2_SELECTED_SHEET = data.active_sheet || data.sheet_names[0];

                console.log(`✔ FILE2 sheets:`, FILE2_SHEET_NAMES.length, 'sheets, selected:', FILE2_SELECTED_SHEET);

            }



            updateColumnDatalist();



            // YENİ: Backend'den gelen ham satırları kaydet (başlık satırı seçimi için)

            if (data.raw_rows && data.raw_rows.length > 0) {

                FILE2_RAW_PREVIEW_ROWS = data.raw_rows;

                console.log('✔ FILE2_RAW_PREVIEW_ROWS set:', FILE2_RAW_PREVIEW_ROWS.length, 'rows');

            } else if (data.preview_rows && data.preview_rows.length > 0) {

                // Fallback: Eski format

                FILE2_RAW_PREVIEW_ROWS = data.preview_rows.map(row => ({

                    cells: Object.values(row).map(val => val !== null && val !== undefined ? String(val) : '')

                }));

                if (data.columns && data.columns.length > 0) {

                    FILE2_RAW_PREVIEW_ROWS.unshift({

                        cells: data.columns.map(c => String(c))

                    });

                }

                console.log('✔ FILE2_RAW_PREVIEW_ROWS set (fallback):', FILE2_RAW_PREVIEW_ROWS.length, 'rows');

            }



            showFileInfo(data, 2, skipDropdownRebuild); // İkinci dosya için



            // YENİ (PHASE 1): İkinci dosya sütunlarını datalist'e ekle

            updateFile2ColumnDatalist(data.columns);

            console.log('✔ updateFile2ColumnDatalist called with', data.columns.length, 'columns');



            // DYNAMIC REFRESH: İkinci dosya yüklendiğinde aktif senaryo formunu güncelle

            // Bu sayede kullanıcı önce senaryo seçip sonra dosya yüklerse sütunlar anında yansır

            document.querySelectorAll('.pro-column-selector-wrapper[data-column-source="secondary"]').forEach(widget => {

                const selectEl = widget.querySelector('select');

                if (selectEl) {

                    const currentVal = selectEl.value;

                    selectEl.innerHTML = '<option value="">-- Seçin --</option>' +

                        data.columns.map(col => `<option value="${col}"${col === currentVal ? ' selected' : ''}>${col}</option>`).join('');

                }

            });

            console.log('✔ Secondary column selectors refreshed with new file2 columns');



            // data_source dropdown'ını "secondary" olarak seç ve crosssheet area'yı gizle

            document.querySelectorAll('.gm-data-source-select').forEach(select => {

                if (select.value === '' || select.value === 'crosssheet') {

                    select.value = 'secondary';

                    // Hide crosssheet area

                    const paramName = select.name || select.id.replace('data_source_', '');

                    const csArea = document.getElementById(`crosssheet_area_${paramName}`);

                    if (csArea) {

                        csArea.style.display = 'none';

                    }

                    console.log('✔ data_source set to secondary after file2 upload');

                }

            });



            // YENİ (PHASE 1): Tüm cross-sheet uyarılarını güncelle

            updateAllCrossSheetWarnings();

            console.log('✔ updateAllCrossSheetWarnings called after file2 inspect');



            // YENİ: PRO bloklarındaki uyarıları güncelle

            if (typeof updateProBlockWarnings === 'function') {

                updateProBlockWarnings();

            }

        } else {

            console.warn("⚠´©Å Backend returned NO columns for file2!");

        }

    } catch (err) {

        console.error("❌ File2 inspect error:", err);

        console.error("❌ Error details:", err.message, err.stack);

    }

}



// Dosya bilgi panelini göster

let FILE_PREVIEW_HTML = ''; // Ana dosya preview cache

let FILE2_PREVIEW_HTML = ''; // İkinci dosya preview cache



// YENİ: Header row seçimi için global state

let SELECTED_HEADER_ROW = 0;    // Ana dosya için seçili başlık satırı (0-indexed)

let SELECTED_HEADER_ROW_2 = 0;  // İkinci dosya için

let FILE_RAW_PREVIEW_ROWS = []; // Ana dosya ham satırları

let FILE2_RAW_PREVIEW_ROWS = []; // İkinci dosya ham satırları



function showFileInfo(data, fileNumber = 1, skipDropdownRebuild = false) {

    const panelId = fileNumber === 1 ? "fileInfoPanel" : "fileInfoPanel2";

    const rowCountId = fileNumber === 1 ? "fileRowCount" : "fileRowCount2";

    const colCountId = fileNumber === 1 ? "fileColCount" : "fileColCount2";

    const colListId = fileNumber === 1 ? "fileColumnList" : "fileColumnList2";

    const previewBtnId = fileNumber === 1 ? "filePreviewBtn" : "filePreviewBtn2";

    const sheetSelectId = fileNumber === 1 ? "fileSheetSelect" : "fileSheetSelect2";



    let panel = document.getElementById(panelId);

    if (!panel) {

        console.warn(`Panel bulunamadı: ${panelId}`);

        return;

    }



    // BUG 3 FIX: Panel görünür yap (her iki dosya için de)

    panel.style.display = "block";

    if (fileNumber === 2) {

        console.log('✔ fileInfoPanel2 görünür yapıldı');

    }

    const rowEl = document.getElementById(rowCountId);

    const colEl = document.getElementById(colCountId);

    if (rowEl) rowEl.textContent = data.row_count || 0;

    if (colEl) colEl.textContent = data.column_count || data.columns.length;



    // Preview HTML'i cache'le

    if (data.preview_html) {

        if (fileNumber === 1) FILE_PREVIEW_HTML = data.preview_html;

        else FILE2_PREVIEW_HTML = data.preview_html;

    }



    // YENİ: Ham satırları cache'le (başlık satırı seçimi için)

    if (data.raw_rows) {

        console.log('✓ raw_rows data received:', { fileNumber, rows: data.raw_rows.length, sample: data.raw_rows[0] });

        if (fileNumber === 1) FILE_RAW_PREVIEW_ROWS = data.raw_rows;

        else FILE2_RAW_PREVIEW_ROWS = data.raw_rows;

    } else {

        console.warn('⚠´©Å raw_rows not found in data:', Object.keys(data));

    }



    // YENİ: Sheet dropdown (çok sayfalı Excel için)

    // skipDropdownRebuild true ise dropdown'a dokunma

    if (!skipDropdownRebuild) {

        const sheetNames = data.sheet_names || [];

        const activeSheet = data.active_sheet;

        const sheetContainerId = `${sheetSelectId}Container`;

        let sheetContainer = document.getElementById(sheetContainerId);

        const existingSelect = document.getElementById(sheetSelectId);



        if (sheetNames.length > 1) {

            // Birden fazla sayfa var - dropdown göster

            // Sadece container yoksa veya sheet sayısı değiştiyse yeniden oluştur

            const shouldRebuild = !sheetContainer || !existingSelect ||

                existingSelect.options.length !== sheetNames.length;



            if (shouldRebuild) {

                if (!sheetContainer) {

                    sheetContainer = document.createElement("div");

                    sheetContainer.id = sheetContainerId;

                    sheetContainer.className = "gm-sheet-select-container";

                    panel.insertBefore(sheetContainer, panel.firstChild);

                }



                const sheetLabel = CURRENT_LANG === 'tr' ? 'Sayfa:' : 'Sheet:';

                const countText = CURRENT_LANG === 'tr' ? 'sayfa' : 'sheets';



                sheetContainer.innerHTML = `

                    <label class="gm-sheet-label">

                        <i class="fas fa-layer-group"></i> ${sheetLabel}

                    </label>

                    <select id="${sheetSelectId}" class="gm-sheet-select">

                        ${sheetNames.map(s => `<option value="${s}" ${s === activeSheet ? 'selected' : ''}>${s}</option>`).join('')}

                    </select>

                    <span class="gm-sheet-count">${sheetNames.length} ${countText}</span>

                `;

                sheetContainer.style.display = "flex";



                // Sheet değişikliği event listener - skipDropdownRebuild=true ile çağır

                const newSelectEl = document.getElementById(sheetSelectId);

                if (newSelectEl) {

                    newSelectEl.onchange = async (e) => {

                        const newSheet = e.target.value;

                        console.log("Sheet değiştiriliyor:", newSheet);



                        // FileInput'tan dosyayı al

                        const inputId = fileNumber === 1 ? "fileInput" : "fileInput2";

                        const fileInput = document.getElementById(inputId);



                        if (fileInput && fileInput.files[0]) {

                            if (fileNumber === 1) {

                                FILE_SELECTED_SHEET = newSheet;

                                await inspectFile(fileInput.files[0], newSheet, true);

                            } else {

                                FILE2_SELECTED_SHEET = newSheet;

                                await inspectFile2(fileInput.files[0], newSheet, true);

                            }

                        } else {

                            console.error("Dosya bulunamadı:", inputId);

                        }

                    };

                }

            } else {

                // Dropdown zaten var, sadece seçimi güncelle

                if (existingSelect && activeSheet) {

                    existingSelect.value = activeSheet;

                }

            }

        } else if (sheetContainer) {

            // Tek sayfa veya CSV - dropdown gizle

            sheetContainer.style.display = "none";

        }

    }



    // Sütun chip'leri

    const list = document.getElementById(colListId);

    if (list && data.column_letters) {

        list.innerHTML = Object.entries(data.column_letters).map(([letter, name]) =>

            `<span class="gm-col-chip" onclick="copyColumnRef('${letter}', '${name.replace(/'/g, "\\'")}', this)"><strong>${letter}</strong>${name}</span>`

        ).join("");

    } else if (list && data.columns) {

        list.innerHTML = data.columns.map((col, i) => {

            const letter = indexToLetter(i);

            return `<span class="gm-col-chip" onclick="copyColumnRef('${letter}', '${col.replace(/'/g, "\\'")}', this)"><strong>${letter}</strong>${col}</span>`;

        }).join("");

    }



    // Önizle butonunu ekle (header row indicator ile)

    let previewBtn = document.getElementById(previewBtnId);

    if (!previewBtn) {

        previewBtn = document.createElement("button");

        previewBtn.id = previewBtnId;

        previewBtn.className = "gm-btn-preview"; // Unified style

        previewBtn.onclick = () => showFilePreviewModal(fileNumber);

        panel.appendChild(previewBtn);

    }

    // Her seferinde içeriği güncelle (header row indicator için)

    updatePreviewButtonText(fileNumber);

}



// YENİ: Preview buton metnini güncelle (header row indicator ile)

function updatePreviewButtonText(fileNumber) {

    const previewBtnId = fileNumber === 1 ? "filePreviewBtn" : "filePreviewBtn2";

    const previewBtn = document.getElementById(previewBtnId);

    if (!previewBtn) return;



    const headerRow = fileNumber === 1 ? SELECTED_HEADER_ROW : SELECTED_HEADER_ROW_2;

    const T = EXTRA_TEXTS[CURRENT_LANG];

    const previewText = T?.preview_file || 'Dosyayı Önizle';



    if (headerRow > 0) {

        const rowLabel = CURRENT_LANG === 'tr' ? `Satır ${headerRow + 1} başlık` : `Row ${headerRow + 1} header`;

        previewBtn.innerHTML = `<i class="fas fa-table"></i> <span class="gm-preview-text">${previewText}</span> <span class="gm-header-row-badge">${rowLabel}</span>`;

    } else {

        previewBtn.innerHTML = `<i class="fas fa-table"></i> <span class="gm-preview-text">${previewText}</span>`;

    }

}



// Dosya önizleme modalını göster (fileNumber: 1=ana, 2=ikinci)

// YENİ: Başlık satırı seçimi için radio button'lı UI

window.showFilePreviewModal = function (fileNumber = 1) {

    const T = EXTRA_TEXTS[CURRENT_LANG];

    const rawRows = fileNumber === 1 ? FILE_RAW_PREVIEW_ROWS : FILE2_RAW_PREVIEW_ROWS;

    const currentHeaderRow = fileNumber === 1 ? SELECTED_HEADER_ROW : SELECTED_HEADER_ROW_2;

    const titlePrefix = fileNumber === 2 ? (CURRENT_LANG === 'tr' ? '(İkinci Dosya) ' : '(Second File) ') : '';



    console.log('🔍 showFilePreviewModal called:', { fileNumber, rawRowsLength: rawRows?.length || 0, rawRows: rawRows?.slice(0, 2) });



    // Modal oluştur veya mevcut olanı kullan

    let modal = document.getElementById("filePreviewModal");

    if (!modal) {

        modal = document.createElement("div");

        modal.id = "filePreviewModal";

        modal.className = "gm-modal";

        modal.innerHTML = `

            <div class="gm-modal-content" style="max-width: 90vw; max-height: 85vh; overflow: auto;">

                <div class="gm-modal-header">

                    <h3 id="previewModalTitle"><i class="fas fa-table"></i> ${T?.file_preview_title || 'Dosya Önizleme'}</h3>

                    <button class="gm-modal-close" onclick="document.getElementById('filePreviewModal').style.display='none'">

                        <i class="fas fa-times"></i>

                    </button>

                </div>

                <div class="gm-modal-body" id="filePreviewContent" style="overflow-x: auto;"></div>

            </div>

        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", (e) => {

            if (e.target === modal) modal.style.display = "none";

        });

    }



    // Başlığı güncelle

    const titleEl = modal.querySelector("h3");

    const headerSelectTitle = CURRENT_LANG === 'tr' ? 'Başlık Satırını Seçin' : 'Select Header Row';

    if (titleEl) {

        titleEl.innerHTML = `<i class="fas fa-table"></i> ${titlePrefix}${headerSelectTitle}`;

    }



    // İçeriği yerleştir - HTML'deki ID'yi kullan (previewModalBody veya filePreviewContent)

    let content = modal.querySelector("#previewModalBody") || modal.querySelector("#filePreviewContent");



    if (!content) {

        // Fallback: gm-modal-body class ile ara

        content = modal.querySelector(".gm-modal-body");

    }



    if (!content) {

        console.error('Modal body not found in modal');

        return;

    }



    if (rawRows && rawRows.length > 0) {

        // Hint mesajı

        const hintText = CURRENT_LANG === 'tr'

            ? '­şôî Seçilen satır <strong>başlık</strong> olarak kullanılacak. ğstündeki satırlar atlanacak.'

            : '­şôî Selected row will be used as <strong>header</strong>. Rows above will be skipped.';



        let html = `<div class="gm-header-row-hint">${hintText}</div>`;

        html += `<div class="gm-header-row-selector">`;



        rawRows.forEach((row, idx) => {

            const isSelected = idx === currentHeaderRow;

            const rowClass = isSelected ? 'gm-header-row-option selected' : 'gm-header-row-option';

            const radioName = `headerRowRadio_${fileNumber}`;



            // Hücreleri göster (max 8 hücre, kısalt)

            let cellsHtml = row.cells.slice(0, 8).map(cell => {

                const displayVal = cell.length > 20 ? cell.substring(0, 17) + '...' : (cell || '-');

                return `<span class="gm-header-cell">${displayVal}</span>`;

            }).join('');



            if (row.cells.length > 8) {

                cellsHtml += `<span class="gm-header-cell-more">+${row.cells.length - 8}</span>`;

            }



            html += `

                <label class="${rowClass}" data-row-index="${idx}">

                    <input type="radio" name="${radioName}" value="${idx}" ${isSelected ? 'checked' : ''} 

                           onchange="window.selectHeaderRow(${fileNumber}, ${idx})">

                    <span class="gm-header-row-num">${CURRENT_LANG === 'tr' ? 'Satır' : 'Row'} ${idx + 1}</span>

                    <div class="gm-header-cells">${cellsHtml}</div>

                </label>

            `;

        });



        html += `</div>`;

        content.innerHTML = html;

    } else {

        content.innerHTML = `<p style="color: var(--gm-text-muted);">${T?.no_preview || 'Önizleme için önce dosya yükleyin.'}</p>`;

    }



    modal.style.display = "flex";

};



// Önizleme modalını kapat

window.closePreviewModal = function () {

    const modal = document.getElementById("filePreviewModal");

    if (modal) {

        modal.style.display = "none";

    }

};



// YENİ: Başlık satırı seçildiğinde çağrılır

window.selectHeaderRow = async function (fileNumber, rowIndex) {

    if (fileNumber === 1) {

        SELECTED_HEADER_ROW = rowIndex;

    } else {

        SELECTED_HEADER_ROW_2 = rowIndex;

    }



    // UI'daki seçimi güncelle

    const modal = document.getElementById("filePreviewModal");

    if (modal) {

        modal.querySelectorAll('.gm-header-row-option').forEach(label => {

            const idx = parseInt(label.dataset.rowIndex);

            if (idx === rowIndex) {

                label.classList.add('selected');

            } else {

                label.classList.remove('selected');

            }

        });

    }



    // Preview butonunu güncelle (indicator göster)

    updatePreviewButtonText(fileNumber);



    // YENİ: Sütunları yeniden yükle (seçili başlık satırına göre)

    // Backend'den doğru sütun isimlerini al

    const fileInput = fileNumber === 1 ? document.getElementById("fileInput") : document.getElementById("fileInput2");

    if (fileInput && fileInput.files[0]) {

        const sheetName = fileNumber === 1 ? FILE_SELECTED_SHEET : FILE2_SELECTED_SHEET;

        console.log(`­şöä Refreshing columns with header_row=${rowIndex}...`);



        if (fileNumber === 1) {

            await inspectFile(fileInput.files[0], sheetName, true, rowIndex);

        } else {

            await inspectFile2(fileInput.files[0], sheetName, true, rowIndex);

        }



        // ✓ KRİTİK FIX: Sütunlar güncellendikten sonra aktif senaryo varsa formu yeniden render et

        // Bu sayede parametre alanlarındaki autocomplete listesi güncel sütunlarla yenilenir

        if (ACTIVE_SCENARIO_ID && fileNumber === 1) {

            console.log(`­şöä Re-rendering form for scenario: ${ACTIVE_SCENARIO_ID} with updated columns...`);

            const scenario = SCENARIO_LIST.find(s => s.id === ACTIVE_SCENARIO_ID);

            if (scenario) {

                renderDynamicForm(ACTIVE_SCENARIO_ID, scenario.params || []);

                console.log(`✓ Form re-rendered with ${FILE_COLUMNS.length} updated columns`);

            }

        }

    }



    console.log(`✔ Header row selected: File ${fileNumber}, Row ${rowIndex}`);

};



// Sütun referansını kopyala veya input'a yapıştır

window.copyColumnRef = function (letter, name, chipEl) {

    // Aktif input varsa oraya yaz

    const activeInput = document.activeElement;

    if (activeInput && activeInput.tagName === "INPUT" && activeInput.getAttribute("list") === "colOptions") {

        activeInput.value = name;

        activeInput.dispatchEvent(new Event('input', { bubbles: true }));

        showCopyFeedback(chipEl || event.target, "✔");

    } else {

        // Clipboard'a kopyala

        const T = EXTRA_TEXTS[CURRENT_LANG];

        navigator.clipboard.writeText(name).then(() => {

            showCopyFeedback(chipEl || event.target, T.copy_success || "Copied!");

        });

    }

};



// Chip üzerinde kopyalama feedback'i göster

function showCopyFeedback(chip, text) {

    if (!chip) return;

    const original = chip.innerHTML;

    const origBg = chip.style.background;

    const origBorder = chip.style.borderColor;



    // Yeşil arka plan, beyaz metin (okunabilir) - sadece tek ikon

    chip.innerHTML = `< i class="fas fa-check" ></i > ${text} `;

    chip.style.background = "var(--gm-success)";

    chip.style.borderColor = "var(--gm-success)";

    chip.style.color = "white";



    setTimeout(() => {

        chip.innerHTML = original;

        chip.style.background = origBg;

        chip.style.borderColor = origBorder;

        chip.style.color = "";

    }, 1200);

}



// Index'i Excel harf koduna çevir (A, B, ..., Z, AA, AB...)

function indexToLetter(idx) {

    let result = "";

    idx += 1;

    while (idx > 0) {

        idx--;

        result = String.fromCharCode(65 + (idx % 26)) + result;

        idx = Math.floor(idx / 26);

    }

    return result;

}



function updateColumnDatalist() {

    let dl = document.getElementById("colOptions");

    if (!dl) {

        dl = document.createElement("datalist");

        dl.id = "colOptions";

        document.body.appendChild(dl);

    }

    dl.innerHTML = "";

    FILE_COLUMNS.forEach(col => {

        const opt = document.createElement("option");

        opt.value = col;

        dl.appendChild(opt);

    });

}



// İkinci dosya alanını aç/kapat

window.toggleSecondFile = function () {

    const wrapper = document.getElementById("secondFileWrapper");

    const toggle = document.getElementById("secondFileToggle");

    if (wrapper.style.display === "none") {

        wrapper.style.display = "block";

        toggle.classList.add("open");

        toggle.querySelector("i").className = "fas fa-minus-circle";

        // Cross-sheet seçeneğini güncelle (eğer ana dosyada birden fazla sayfa varsa)

        updateCrossSheetOption();

    } else {

        wrapper.style.display = "none";

        toggle.classList.remove("open");

        toggle.querySelector("i").className = "fas fa-plus-circle";

    }

};



// YENİ: Cross-sheet modu aç/kapat

window.toggleCrossSheetMode = function () {

    const checkbox = document.getElementById("useSameFileDifferentSheet");

    const crossSheetSelector = document.getElementById("crossSheetSelector");

    const file2UploadArea = document.getElementById("file2UploadArea");



    if (checkbox.checked) {

        // Cross-sheet modu: dosya yükleme gizle, sayfa seçici göster

        crossSheetSelector.style.display = "flex";

        file2UploadArea.style.display = "none";



        // Dropdown'ı ana dosyanın sayfalarıyla doldur (seçili sayfa hariç)

        populateCrossSheetDropdown();



        // YENİ: Otomatik fetch

        const select = document.getElementById("crossSheetSelect");

        if (select && select.value) {

            fetchCrossSheetColumns(select);

        }

    } else {

        // Normal mod: dosya yükleme göster, sayfa seçici gizle

        crossSheetSelector.style.display = "none";

        file2UploadArea.style.display = "block";

    }

};



// YENİ: Cross-sheet dropdown'ı doldur

function populateCrossSheetDropdown() {

    const select = document.getElementById("crossSheetSelect");

    if (!select || !FILE_SHEET_NAMES || FILE_SHEET_NAMES.length < 2) return;



    select.innerHTML = FILE_SHEET_NAMES

        .filter(s => s !== FILE_SELECTED_SHEET) // Seçili sayfayı hariç tut

        .map(s => `<option value="${s}">${s}</option>`)

        .join('');

}



// YENİ: Cross-sheet seçeneğini güncelle (ana dosyada 2+ sayfa varsa göster)

function updateCrossSheetOption() {

    const crossSheetOption = document.getElementById("crossSheetOption");

    if (!crossSheetOption) return;



    if (FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1) {

        crossSheetOption.style.display = "block";

        populateCrossSheetDropdown();

    } else {

        crossSheetOption.style.display = "none";

    }

}



// YENİ: Cross-sheet modu aktif mi?

function isCrossSheetModeActive() {

    const checkbox = document.getElementById("useSameFileDifferentSheet");

    return checkbox && checkbox.checked;

}



// YENİ: Seçili cross-sheet sayfa adı

function getSelectedCrossSheet() {

    const select = document.getElementById("crossSheetSelect");

    return select ? select.value : null;

};



// YENİ: PRO Builder blokları için inline cross-sheet HTML

// YENİ: PRO Builder blokları için inline cross-sheet HTML

// YENİ: Cross-sheet sütunlarını getir (Backend çağrısı gerektirmez, inspectFile2 kullanır)

window.fetchCrossSheetColumns = async function (selectElement) {

    if (!selectElement) return;

    const sheetName = selectElement.value;

    console.log("[fetchCrossSheetColumns] Selected sheet:", sheetName);



    // Ana dosya inputunu bul

    const fileInput = document.getElementById("fileInput");

    if (fileInput && fileInput.files[0]) {

        // İkinci dosya slotuna (fileNumber=2) ana dosyayı yükle (farklı sheet ile)

        // Bu işlem FILE2_COLUMNS'u günceller ve updateFile2ColumnDatalist'i çağırır

        await inspectFile2(fileInput.files[0], sheetName, true);



        // Inline UI'deki sütun önizlemesini güncelle (varsa)

        // Sol paneldeki zaten inspectFile2 ile güncelleniyor (fileColumnList2)

        // Ancak PRO Builder inline paneli için manuel güncelleme gerekebilir

        const wrapper = selectElement.closest('.gm-inline-crosssheet-wrapper') || selectElement.closest('.gm-pro-merge-source');

        if (wrapper && FILE2_COLUMNS) {

            const colList = wrapper.querySelector('.pro-crosssheet-column-list');

            if (colList) {

                colList.innerHTML = FILE2_COLUMNS.map(c =>

                    `< span class="gm-col-chip" style = "font-size:0.75rem; padding:2px 6px; margin-right:4px; display:inline-block; background:rgba(255,255,255,0.1); border:1px solid var(--gm-card-border); border-radius:4px;" > ${c}</span > `

                ).join('');

            }

        }

    }

};



// YENİ: Inline Cross-sheet HTML (PRO Builder & Dynamic Forms)

function getInlineCrossSheetHTML(uniqueId = '') {

    const hasMultipleSheets = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;

    const hasSecondFile = !!FILE2_NAME; // Global ikinci dosya yüklü mü?



    const T = EXTRA_TEXTS[CURRENT_LANG];

    const crossSheetOptions = hasMultipleSheets

        ? (FILE_SHEET_NAMES || []).filter(s => s !== FILE_SELECTED_SHEET).map(s => `< option value = "${s}" > ${s}</option > `).join('')

        : '';



    return `

                    < !--Tek Satır Second File Source-- >

                        <div class="gm-pro-merge-source" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; padding:8px; background:rgba(59,130,246,0.1); border-radius:6px; border:1px dashed var(--gm-primary);">



                            ${hasMultipleSheets ? `

        <!-- Cross-Sheet Checkbox -->

        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">

            <input type="checkbox" class="pro-use-crosssheet" onchange="toggleProMergeSource(this)" style="width:16px; height:16px; accent-color:var(--gm-primary);">

            <span style="color:var(--gm-primary); font-weight:500;"><i class="fas fa-layer-group"></i> ${T.use_same_file_sheet || 'Aynı Dosyadan'}</span>

        </label>

        

        <!-- Cross-Sheet Selector (gizli başlar) -->

        <div class="pro-merge-crosssheet-area" style="display:none; flex:1; min-width:200px; align-items:center; gap:6px;">

            <select class="pro-crosssheet-select gm-sheet-select" style="padding:4px 8px; font-size:0.8rem; height:28px; max-width:140px;" onchange="fetchCrossSheetColumns(this)">

                ${crossSheetOptions}

            </select>

            <!-- Column Preview -->

            <div class="pro-crosssheet-columns" style="flex:1; min-width:0; background:var(--gm-bg); border:1px solid var(--gm-card-border); border-radius:4px; padding:2px 6px; height:28px; display:flex; align-items:center; overflow:hidden;">

                <div class="pro-crosssheet-column-list" style="display:flex; gap:4px; overflow-x:auto; white-space:nowrap; align-items:center; width:100%; scrollbar-width:thin;">

                    <span style="color:var(--gm-text-muted); font-size:0.7rem; font-style:italic;">Sayfa seçin...</span>

                </div>

            </div>

        </div>

        ` : ''}



                            <!-- İkinci Dosya Durum Mesajı - Conditional Visibility -->

                            ${(() => {

            const mode = getSecondSourceHintMode();

            const shouldShow = shouldShowSecondSourceHint();

            if (!shouldShow || mode === 'hidden') {

                return `<div class="gm-source-hint" style="display:none;"></div>`;

            }

            const T = EXTRA_TEXTS[CURRENT_LANG];

            let icon, text, cssClass;

            if (mode === 'success') {

                icon = 'fa-check-circle';

                text = (T.lbl_second_source_success || 'Source: {filename}').replace('{filename}', FILE2_NAME || 'File2');

                cssClass = 'gm-source-hint--success';

            } else if (mode === 'info') {

                icon = 'fa-info-circle';

                text = T.lbl_second_source_info || 'You can also pick another sheet from the same workbook.';

                cssClass = 'gm-source-hint--info';

            } else {

                icon = 'fa-exclamation-triangle';

                text = T.lbl_second_source_warning || 'This scenario requires a second source: upload a 2nd file or select a sheet.';

                cssClass = 'gm-source-hint--warning';

            }

            return `<div class="gm-source-hint ${cssClass}" style="${hasMultipleSheets ? '' : 'flex:1;'}"><i class="fas ${icon}"></i> ${text}</div>`;

        })()}

                        </div>`;

}



// ===== SECOND SOURCE HINT HELPERS =====

// Scenarios that truly require a second file source

const SECOND_FILE_SCENARIOS_GLOBAL = [

    'join-two-tables-key',

    'vlookup-single-match',

    'xlookup-single-match',

    'pq-append-tables',

    'validate-values-against-list',

    'fallback-lookup',

    'multi-column-lookup',

    'reverse-lookup-last-match'

];



// Determine if second source hint should be visible

function shouldShowSecondSourceHint() {

    // Check if active scenario requires second file

    const required = SECOND_FILE_SCENARIOS_GLOBAL.includes(ACTIVE_SCENARIO_ID);



    // Check if second file is loaded

    const hasSecondFile = !!FILE2_NAME || (FILE2_COLUMNS && FILE2_COLUMNS.length > 0);



    // Check if main file has multiple sheets

    const hasMultiSheet = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;



    // Check if user opened second file panel

    const userOpened = document.getElementById("secondFileWrapper")?.style?.display === "block";



    return required || hasSecondFile || hasMultiSheet || userOpened;

}



// Get the mode for second source hint: 'success' | 'info' | 'warning' | 'hidden'

function getSecondSourceHintMode() {

    const required = SECOND_FILE_SCENARIOS_GLOBAL.includes(ACTIVE_SCENARIO_ID);

    const hasSecondFile = !!FILE2_NAME || (FILE2_COLUMNS && FILE2_COLUMNS.length > 0);

    const hasMultiSheet = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;



    if (hasSecondFile) return 'success';   // ✓ Green status

    if (required) return 'warning';         // ⚠´©Å Red requirement

    if (hasMultiSheet) return 'info';       // Ôä╣´©Å Neutral info

    return 'hidden';

}





// Render the second source hint HTML based on mode

function renderSecondSourceHint(mode, containerClass = '') {

    const T = EXTRA_TEXTS[CURRENT_LANG];



    if (mode === 'hidden' || !shouldShowSecondSourceHint()) {

        return `<div class="gm-source-hint ${containerClass}" style="display:none;"></div>`;

    }



    let icon, text, cssClass;



    if (mode === 'success') {

        icon = 'fa-check-circle';

        text = (T.lbl_second_source_success || 'Source: {filename}').replace('{filename}', FILE2_NAME || 'File2');

        cssClass = 'gm-source-hint--success';

    } else if (mode === 'info') {

        icon = 'fa-info-circle';

        text = T.lbl_second_source_info || 'You can also pick another sheet from the same workbook.';

        cssClass = 'gm-source-hint--info';

    } else { // warning

        icon = 'fa-exclamation-triangle';

        text = T.lbl_second_source_warning || 'This scenario requires a second source: upload a 2nd file or select a sheet.';

        cssClass = 'gm-source-hint--warning';

    }



    return `<div class="gm-source-hint ${cssClass} ${containerClass}"><i class="fas ${icon}"></i> ${text}</div>`;

}





// YENİ: Inline cross-sheet toggle (PRO builder blokları için)

window.toggleInlineCrossSheet = function (checkbox) {

    // class ".gm-inline-crosssheet-wrapper" olarak getInlineCrossSheetHTML'de tanımlı

    const container = checkbox.closest('.gm-inline-crosssheet-wrapper');

    if (!container) {

        console.error("[toggleInlineCrossSheet] wrapper bulunamadı!");

        return;

    }



    const selector = container.querySelector('.pro-crosssheet-selector');

    const row = checkbox.closest('.gm-pro-action-block');

    const warning = row ? row.querySelector('.gm-sf-warning') : null;



    if (checkbox.checked) {

        selector.style.display = 'flex'; // flexbox layout kullan

        if (warning) warning.style.display = 'none';



        // Görünür olduğunda hemen ilk sayfanın sütunlarını çek

        const select = selector.querySelector('.pro-crosssheet-select');

        if (select && select.value) {

            console.log("[DEBUG] Checkbox açıldı, otomatik fetch tetikleniyor...");

            fetchCrossSheetColumns(select);

        }

    } else {

        selector.style.display = 'none';

        if (warning) warning.style.display = 'block';

    }

};



// YENİ: PRO Builder merge bloğu için cross-sheet toggle

window.toggleProMergeSource = function (checkbox) {

    const container = checkbox.closest('.gm-pro-merge-source');

    if (!container) {

        console.error("[toggleProMergeSource] container bulunamadı!");

        return;

    }



    const crossSheetArea = container.querySelector('.pro-merge-crosssheet-area');

    const warning = container.querySelector('.gm-sf-warning');



    if (checkbox.checked) {

        // Cross-sheet modu: sayfa seçici göster, uyarı gizle

        if (crossSheetArea) crossSheetArea.style.display = 'flex';

        if (warning) warning.style.display = 'none';



        // İlk sayfanın sütunlarını otomatik yükle

        const select = crossSheetArea?.querySelector('.pro-crosssheet-select');

        if (select && select.value) {

            fetchCrossSheetColumns(select);

        }

    } else {

        // Normal mod: sayfa seçici gizle, uyarı göster (ikinci dosya yoksa)

        if (crossSheetArea) crossSheetArea.style.display = 'none';

        // İkinci dosya varsa uyarıyı güncelle, yoksa kırmızı göster

        if (warning) {

            if (FILE2_NAME) {

                warning.innerHTML = `< i class="fas fa-check-circle" ></i > ${FILE2_NAME} `;

                warning.style.color = 'var(--gm-success)';

            } else {

                warning.innerHTML = `< i class="fas fa-exclamation-triangle" ></i > İkinci dosya yükleyin veya yukarıdan sayfa seçin`;

                warning.style.color = '#ef4444';

            }

            warning.style.display = 'block';

        }

    }

};



// YENİ: İkinci dosya yüklendiğinde tüm PRO bloklarındaki uyarıları güncelle

window.updateProBlockWarnings = function () {

    const T = EXTRA_TEXTS[CURRENT_LANG];

    const mode = getSecondSourceHintMode();

    const shouldShow = shouldShowSecondSourceHint();



    document.querySelectorAll('.gm-pro-merge-source').forEach(container => {

        const checkbox = container.querySelector('.pro-use-crosssheet');

        const warning = container.querySelector('.gm-sf-warning, .gm-source-hint');



        // Cross-sheet aktif değilse uyarıyı kontrol et

        if (!checkbox || !checkbox.checked) {

            if (warning) {

                // Gate: Gizle veya moduna göre göster

                if (!shouldShow || mode === 'hidden') {

                    warning.style.display = 'none';

                    return;

                }



                // Update content and styling based on mode

                warning.style.display = 'flex';

                warning.className = 'gm-source-hint gm-source-hint--' + mode;



                if (mode === 'success') {

                    const successText = (T.lbl_second_source_success || 'Source: {filename}').replace('{filename}', FILE2_NAME || 'File2');

                    warning.innerHTML = `<i class="fas fa-check-circle"></i> ${successText}`;

                } else if (mode === 'info') {

                    warning.innerHTML = `<i class="fas fa-info-circle"></i> ${T.lbl_second_source_info || 'You can also pick another sheet from the same workbook.'}`;

                } else { // warning

                    warning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_source_warning || 'This scenario requires a second source: upload a 2nd file or select a sheet.'}`;

                }

            }

        }

    });

    console.log(`[updateProBlockWarnings] mode: ${mode}, shouldShow: ${shouldShow}, FILE2_NAME: ${FILE2_NAME}`);

};



// YENİ: Cross-sheet sütunlarını getir ve arayüzü güncelle

window.fetchCrossSheetColumns = async function (select) {

    const sheetName = select.value;

    console.log(`[DEBUG] fetchCrossSheetColumns çağrıldı.Sheet: ${sheetName} `);



    // Container'ı bul - birden fazla olası parent'ı kontrol et

    let container = select.closest('.pro-crosssheet-selector')

        || select.closest('.pro-merge-crosssheet-area')

        || select.closest('.gm-pro-merge-source');

    if (!container) {

        console.error("[DEBUG] container bulunamadı!");

        return;

    }



    const columnList = container.querySelector('.pro-crosssheet-column-list');

    const columnsContainer = container.querySelector('.pro-crosssheet-columns');



    if (!sheetName) {

        // Boş seçimde placeholder göster

        columnList.innerHTML = '<span style="color:var(--gm-text-muted); font-size:0.7rem; font-style:italic;">Sayfa seçin...</span>';

        return;

    }



    // Loading göster

    columnList.innerHTML = '<div style="display:flex; align-items:center; gap:4px; color:var(--gm-text-muted); font-size:0.7rem;"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';



    // Global dosya inputunu bul

    const fileInput = document.getElementById("fileInput");

    if (!fileInput || !fileInput.files[0]) {

        console.error("[DEBUG] Dosya inputu veya dosya yok!");

        columnList.innerHTML = '<div style="color:var(--gm-danger);">Dosya bulunamadı!</div>';

        return;

    }



    const formData = new FormData();

    formData.append("file", fileInput.files[0]);

    const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;

    console.log(`[DEBUG] Fetching URL: ${url} `);



    try {

        const res = await fetch(url, { method: "POST", body: formData });

        const data = await res.json();

        console.log("[DEBUG] Fetch response:", data);



        if (data.columns) {

            // 1. Görsel listeyi güncelle (capsule biçiminde - modern stil)

            columnList.innerHTML = data.columns.map(col =>

                `<span class="gm-col-chip-modern" onclick="copyColumnToInput(this, '${col.replace(/'/g, "\\'")}')">${col}</span>`

            ).join('');



            // 2. Autocomplete listesini güncelle (file2-columns datalist)

            console.log("[DEBUG] auto-complete listesi güncelleniyor...");

            updateFile2ColumnDatalist(data.columns);



            // 3. Global değişkeni güncelle (senaryo çalışırken de kullanılabilir)

            FILE2_COLUMNS = data.columns;



        } else {

            columnList.innerHTML = '<div style="color:var(--gm-danger);">Sütunlar alınamadı.</div>';

        }

    } catch (e) {

        console.error("[DEBUG] Fetch error:", e);

        columnList.innerHTML = `<div style="color:var(--gm-danger);">Hata: ${e.message}</div>`;

    }

};



// Autocomplete listesini güncelle (file2-columns)

function updateFile2ColumnDatalist(columns) {

    const dl = document.getElementById("file2-columns");

    if (!dl) {

        console.error("[DEBUG] datalist#file2-columns bulunamadı!");

        return;

    }

    console.log(`[DEBUG] Updating datalist#file2-columns with ${columns.length} items`);

    dl.innerHTML = "";

    columns.forEach(col => {

        const opt = document.createElement("option");

        opt.value = col;

        dl.appendChild(opt);

    });

}



// Sütuna tıklayınca panoya kopyala ve görsel efekt ver

window.copyColumnToInput = function (chip, colName) {

    navigator.clipboard.writeText(colName);



    // Görsel geri bildirim

    const oldBg = chip.style.background;

    chip.style.background = 'var(--gm-success)';

    chip.style.color = '#fff';

    chip.style.borderColor = 'var(--gm-success)';



    setTimeout(() => {

        chip.style.background = oldBg;

        chip.style.color = '';

        chip.style.borderColor = 'var(--gm-border-color)';

    }, 600);



    // Basit toast mesajı

    const toast = document.createElement('div');

    toast.innerText = `${colName} kopyalandı!`;

    toast.style.position = 'fixed';

    toast.style.bottom = '20px';

    toast.style.right = '20px';

    toast.style.background = 'var(--gm-bg-header)';

    toast.style.color = 'var(--gm-text)';

    toast.style.padding = '8px 12px';

    toast.style.borderRadius = '4px';

    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    toast.style.fontSize = '0.8rem';

    toast.style.zIndex = '9999';

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);

};



function renderAccordionMenu() {

    const container = document.getElementById("scenarioListContainer");

    const premiumContainer = document.getElementById("premiumCardContainer");

    if (!container) return;

    container.innerHTML = "";



    // ===== PREMIUM FEATURE CARD - RAPOR STğDYOSU PRO =====

    // Premium Card ayrı container'a eklenir (sticky, scroll etmez)

    if (premiumContainer) {

        premiumContainer.innerHTML = ""; // Temizle



        const featureCard = document.createElement("div");

        featureCard.className = "gm-feature-card";

        featureCard.innerHTML = `

            <span class="gm-feature-badge">${CURRENT_LANG === 'tr' ? '✦ Öne çıkan' : '✦ Featured'}</span>

            <div class="gm-feature-content">

                <div class="gm-feature-icon">

                    <i class="fas fa-wand-magic-sparkles"></i>

                </div>

                <div class="gm-feature-text">

                    <h4 class="gm-feature-title">

                        ${CURRENT_LANG === 'tr' ? 'Rapor Stüdyosu PRO' : 'Report Studio PRO'}

                    </h4>

                    <p class="gm-feature-desc">

                        ${CURRENT_LANG === 'tr'

                ? 'Görsel akış tasarlayın. Filtreleme, RANK, çoklu sayfa çıktısı.'

                : 'Design visual pipelines. Filtering, RANK, multi-sheet exports.'}

                    </p>

                </div>

                <button class="gm-feature-cta">

                    <i class="fas fa-arrow-right"></i>

                </button>

            </div>

        `;



        // Feature card tıklama - Visual Builder'ı aktif et

        featureCard.addEventListener("click", () => {

            ACTIVE_SCENARIO_ID = "custom-report-builder-pro";

            const proScenario = SCENARIO_LIST.find(s => s.id === "custom-report-builder-pro");

            if (proScenario) {

                document.getElementById("scenarioTitle").textContent = proScenario.title;

                // Subtitle güncelleme - PRO açıklaması

                const subtitle = document.getElementById("scenarioSubtitle");

                if (subtitle) {

                    subtitle.textContent = proScenario.short || proScenario.description ||

                        (CURRENT_LANG === 'tr'

                            ? 'Görsel rapor akışı tasarlayın. Filtreleme, RANK ve çoklu sayfa çıktısı ile verinize hükmedin.'

                            : 'Design visual report pipelines. Master your data with filtering, RANK, and multi-sheet exports.');

                }

                renderDynamicForm("custom-report-builder-pro", proScenario.params || []);

                loadScenarioHelp("custom-report-builder-pro");

            }

            if (typeof VisualBuilder !== 'undefined' && VisualBuilder.init) {

                VisualBuilder.init();

            }

        });



        // Drag-and-drop support - Premium Card'ı dashboard'a sürükle

        featureCard.draggable = true;



        featureCard.addEventListener("dragstart", (e) => {

            e.dataTransfer.setData("text/plain", JSON.stringify({

                id: "custom-report-builder-pro",

                title: CURRENT_LANG === 'tr' ? 'Rapor Stüdyosu PRO' : 'Report Studio PRO',

                params: [],

                isPremium: true

            }));

            featureCard.classList.add("dragging");

        });



        featureCard.addEventListener("dragend", () => {

            featureCard.classList.remove("dragging");

        });



        premiumContainer.appendChild(featureCard);

    }

    // ===== END PREMIUM FEATURE CARD =====



    // Kategori İsimleri ve İkonları

    const categoryConfig = {

        "lookup_join": {

            name: CURRENT_LANG === 'tr' ? "Veri Birleştirme" : "Lookup & Join",

            icon: "fa-link", color: "#4a90d9"

        },

        "counting_frequency": {

            name: CURRENT_LANG === 'tr' ? "Sayma & Sıklık" : "Counting",

            icon: "fa-calculator", color: "#10b981"

        },

        "conditional_aggregation": {

            name: CURRENT_LANG === 'tr' ? "Toplama & Ortalama" : "Aggregation",

            icon: "fa-chart-bar", color: "#8b5cf6"

        },

        "data_tools_dynamic": {

            name: CURRENT_LANG === 'tr' ? "Veri Araçları" : "Data Tools",

            icon: "fa-tools", color: "#f59e0b"

        },

        "text_cleaning": {

            name: CURRENT_LANG === 'tr' ? "Metin Temizleme" : "Cleaning",

            icon: "fa-broom", color: "#06b6d4"

        },

        "reporting_pivot": {

            name: CURRENT_LANG === 'tr' ? "Rapor & Pivot" : "Reporting",

            icon: "fa-table", color: "#ec4899"

        },

        "charts_visualization": {

            name: CURRENT_LANG === 'tr' ? "Grafik" : "Charts",

            icon: "fa-chart-pie", color: "#14b8a6"

        },

        "dates_durations": {

            name: CURRENT_LANG === 'tr' ? "Tarih İşlemleri" : "Dates",

            icon: "fa-calendar-alt", color: "#f97316"

        },

        "duplicates_uniques": {

            name: CURRENT_LANG === 'tr' ? "Tekrar/Benzersiz" : "Duplicates",

            icon: "fa-clone", color: "#6366f1"

        },

        "stats": {

            name: CURRENT_LANG === 'tr' ? "İstatistik" : "Stats",

            icon: "fa-chart-line", color: "#3b82f6"

        },

        "conditional_formatting": {

            name: CURRENT_LANG === 'tr' ? "Renklendirme" : "Formatting",

            icon: "fa-palette", color: "#a855f7"

        },

        "conditional_logic_segmentation": {

            name: CURRENT_LANG === 'tr' ? "Mantıksal" : "Logic",

            icon: "fa-code-branch", color: "#22c55e"

        },

        "data_quality_validation": {

            name: CURRENT_LANG === 'tr' ? "Veri Kalitesi" : "Quality",

            icon: "fa-check-circle", color: "#eab308"

        },

        "other": {

            name: CURRENT_LANG === 'tr' ? "Diğer" : "Other",

            icon: "fa-ellipsis-h", color: "#64748b"

        }

    };



    Object.keys(SCENARIO_CATALOG).forEach(catKey => {

        const scenarios = SCENARIO_CATALOG[catKey];

        if (!scenarios || scenarios.length === 0) return;



        const config = categoryConfig[catKey] || {

            name: catKey.replace(/_/g, " "),

            icon: "fa-folder",

            color: "#64748b"

        };



        // Kategori başlığı

        const categoryLabel = document.createElement("div");

        categoryLabel.className = "gm-excel-category-label";

        categoryLabel.dataset.category = catKey; // Arama için kategori işareti

        categoryLabel.innerHTML = `<i class="fas ${config.icon}" style="margin-right:6px;"></i>${config.name}`;

        container.appendChild(categoryLabel);



        // Senaryo kartları

        scenarios.forEach(sc => {

            // Premium Card olarak gösterilen senaryoyu normal listeden atla (duplikasyon önleme)

            if (sc.id === "custom-report-builder-pro") return;



            const card = document.createElement("div");

            card.className = "gm-excel-scenario-card";

            card.dataset.id = sc.id;

            card.dataset.params = JSON.stringify(sc.params || []);

            card.dataset.title = sc.title;

            card.dataset.category = catKey; // Arama için kategori işareti

            card.draggable = true; // Sürükle-bırak için

            // Tooltip: başlık + açıklama

            const tooltipText = sc.title + (sc.short || sc.description ? '\n' + (sc.short || sc.description) : '');

            card.title = tooltipText;



            if (sc.id === ACTIVE_SCENARIO_ID) card.classList.add("active");



            // Scenario-specific icons based on ID or keywords

            const scenarioIcons = {

                "custom-report-builder-pro": { icon: "fa-wand-magic-sparkles", color: "#8b5cf6" },

                "pivot-builder-pro": { icon: "fa-table-cells", color: "#10b981" },

                "custom-report-builder": { icon: "fa-shapes", color: "#f97316" },

                "vlookup-basic": { icon: "fa-link", color: "#4a90d9" },

                "vlookup-multi-column": { icon: "fa-arrows-left-right", color: "#4a90d9" },

                "index-match": { icon: "fa-search-plus", color: "#4a90d9" },

                "countif-advanced": { icon: "fa-calculator", color: "#10b981" },

                "sumif-multicolumn": { icon: "fa-sigma", color: "#10b981" },

                "rank-simple": { icon: "fa-trophy", color: "#f59e0b" },

                "rank-grouped": { icon: "fa-medal", color: "#f59e0b" },

                "filter-advanced": { icon: "fa-filter", color: "#ec4899" },

                "text-split": { icon: "fa-scissors", color: "#06b6d4" },

                "text-clean": { icon: "fa-broom", color: "#06b6d4" },

                "date-diff": { icon: "fa-calendar-days", color: "#9a3050" },

                "pivot-multi-level": { icon: "fa-layer-group", color: "#8b5cf6" },

                "duplicate-finder": { icon: "fa-copy", color: "#ef4444" },

                "concatenate-columns": { icon: "fa-text-width", color: "#06b6d4" },

                "formula-column": { icon: "fa-function", color: "#f97316" },

            };



            // Get scenario icon or fall back to category icon

            let iconInfo = scenarioIcons[sc.id];

            if (!iconInfo) {

                // Try to match by keywords in title

                const title = (sc.title || "").toLowerCase();

                if (title.includes("vlookup") || title.includes("birleşt")) iconInfo = { icon: "fa-link", color: "#4a90d9" };

                else if (title.includes("rank") || title.includes("sıra")) iconInfo = { icon: "fa-trophy", color: "#f59e0b" };

                else if (title.includes("pivot") || title.includes("özet")) iconInfo = { icon: "fa-table-cells", color: "#8b5cf6" };

                else if (title.includes("filter") || title.includes("filtre")) iconInfo = { icon: "fa-filter", color: "#ec4899" };

                else if (title.includes("sayı") || title.includes("count") || title.includes("topla") || title.includes("sum")) iconInfo = { icon: "fa-calculator", color: "#10b981" };

                else if (title.includes("tarih") || title.includes("date")) iconInfo = { icon: "fa-calendar", color: "#9a3050" };

                else if (title.includes("metin") || title.includes("text") || title.includes("birleş")) iconInfo = { icon: "fa-font", color: "#06b6d4" };

                else iconInfo = { icon: config.icon, color: config.color };

            }



            card.innerHTML = `

                <div class="gm-excel-scenario-icon" data-color="${iconInfo.color}">

                    <i class="fas ${iconInfo.icon}"></i>

                </div>

                <div class="gm-excel-scenario-info">

                    <h4>${sc.title}</h4>

                    <p>${sc.short || sc.description || sc.hint || ''}</p>

                </div>

            `;



            // Click event

            card.addEventListener("click", () => selectScenario(sc, card));



            // Drag start event

            card.addEventListener("dragstart", (e) => {

                e.dataTransfer.setData("text/plain", JSON.stringify({

                    id: sc.id,

                    title: sc.title,

                    params: sc.params || []

                }));

                card.classList.add("dragging");

            });



            card.addEventListener("dragend", () => {

                card.classList.remove("dragging");

            });



            container.appendChild(card);

        });

    });

}



// ===== DRAG-DROP ZONE SETUP FOR MIDDLE PANE =====

// Senaryo kartlarını orta panele sürükleyerek aktif edebilme

function setupMiddlePaneDropZone() {

    const middlePane = document.querySelector('.gm-middle-pane');

    if (!middlePane) return;



    // Prevent default to allow drop

    middlePane.addEventListener('dragover', (e) => {

        e.preventDefault();

        middlePane.classList.add('drag-over');

    });



    middlePane.addEventListener('dragleave', (e) => {

        // Only remove if leaving the actual element, not children

        if (e.relatedTarget && middlePane.contains(e.relatedTarget)) return;

        middlePane.classList.remove('drag-over');

    });



    middlePane.addEventListener('drop', (e) => {

        e.preventDefault();

        middlePane.classList.remove('drag-over');



        try {

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));

            if (!data || !data.id) return;



            console.log('­şôĞ Scenario dropped:', data);



            // Find the scenario in SCENARIO_LIST

            const scenario = SCENARIO_LIST.find(s => s.id === data.id);



            if (data.isPremium || data.id === 'custom-report-builder-pro') {

                // Premium Card dropped - activate Visual Builder

                ACTIVE_SCENARIO_ID = 'custom-report-builder-pro';

                if (scenario) {

                    document.getElementById('scenarioTitle').textContent = scenario.title;

                    // Subtitle güncelleme - PRO açıklaması

                    const subtitle = document.getElementById('scenarioSubtitle');

                    if (subtitle) {

                        subtitle.textContent = scenario.short || scenario.description ||

                            (CURRENT_LANG === 'tr'

                                ? 'Görsel rapor akışı tasarlayın. Filtreleme, RANK ve çoklu sayfa çıktısı ile verinize hükmedin.'

                                : 'Design visual report pipelines. Master your data with filtering, RANK, and multi-sheet exports.');

                    }

                    renderDynamicForm('custom-report-builder-pro', scenario.params || []);

                    loadScenarioHelp('custom-report-builder-pro');

                }

                if (typeof VisualBuilder !== 'undefined' && VisualBuilder.init) {

                    VisualBuilder.init();

                }

                showToast(CURRENT_LANG === 'tr' ? '­şÄ¿ Visual Builder açıldı!' : '­şÄ¿ Visual Builder opened!', 'success');

            } else if (scenario) {

                // Normal scenario dropped

                selectScenario(scenario, null);

                showToast(CURRENT_LANG === 'tr' ? `✓ ${scenario.title} seçildi` : `✓ ${scenario.title} selected`, 'success');

            }

        } catch (err) {

            console.warn('Drop data parse error:', err);

        }

    });



    console.log('✓ Middle pane drop zone initialized');

}



// Call setup after renderAccordionMenu is called (deferred)

setTimeout(setupMiddlePaneDropZone, 500);



async function selectScenario(scenario, btnElement) {

    // Clear both old button format and new card format

    document.querySelectorAll(".gm-scenario-btn, .gm-excel-scenario-card").forEach(b => b.classList.remove("active"));

    if (btnElement) btnElement.classList.add("active");



    // Deselect PRO card

    const proCard = document.getElementById("proBuilderCard");

    if (proCard) proCard.classList.remove("active");



    // YENİ: Senaryo seçildiğinde dosya alanını otomatik daralt

    const filesSection = document.getElementById("filesSection");

    if (filesSection && !filesSection.classList.contains("collapsed")) {

        filesSection.classList.add("collapsed");

    }



    // YENİ: Dosya yüklenmemişse kullanıcıya uyarı göster

    const fileInput = document.getElementById("fileInput");

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {

        if (typeof showToast === 'function') {

            showToast("📊 Henüz dosya yüklenmedi. Devam etmeden önce dosyanızı yüklemeyi unutmayın!", "info", 4000);

        }

    }



    ACTIVE_SCENARIO_ID = scenario.id;

    document.getElementById("scenarioTitle").textContent = scenario.title;

    document.getElementById("scenarioSubtitle").textContent = scenario.short || scenario.description || "";



    // Use scenario.params directly instead of parsing from btnElement

    const params = scenario.params || [];

    renderDynamicForm(scenario.id, params);

    loadScenarioHelp(scenario.id);



    // YENİ: requiresSecondFile kontrolü - senaryo ikinci dosya gerektiriyorsa

    const secondFileWrapper = document.getElementById("secondFileWrapper");

    if (scenario.requiresSecondFile && secondFileWrapper) {

        secondFileWrapper.style.display = "block";

        // Toggle butonunu da güncelle

        const toggle = document.getElementById("secondFileToggle");

        if (toggle) {

            toggle.classList.add("open");

            toggle.querySelector("i").className = "fas fa-minus-circle";

        }

        // Cross-sheet seçeneğini göster (eğer birden fazla sayfa varsa)

        updateCrossSheetOption();

    }



    document.getElementById("resultJson").textContent = "// ...";

    document.getElementById("downloadExcelPlaceholder").innerHTML = "";

    document.getElementById("markdownResult").innerHTML = "";

    document.getElementById("markdownResult").style.display = "none";

}



// DİNAMİK FORM OLUşTURUCU (TğM TİPLER EKLENDİ)

function renderDynamicForm(scenarioId, params) {

    const container = document.getElementById("dynamicFormContainer");

    container.innerHTML = "";



    // ============================================================================

    // YENİ: PRO BUILDER BYPASS & GLOBAL OPTIONS INIT

    // ============================================================================



    // Visual Builder Container referansı

    const vbContainer = document.getElementById("visualBuilderContainer");



    // PRO Builder senaryosunu atla (dokunma!)

    if (scenarioId === 'custom-report-builder') {

        console.log('⚠´©Å PRO Builder detected - using existing code, skipping optional features');

        // Mevcut PRO Builder kodunu çalıştır (aşağıda devam ediyor)

        if (vbContainer) vbContainer.style.display = 'none';

    }

    // Visual Builder için özel senaryo - Oyun Hamuru PRO

    else if (scenarioId === 'custom-report-builder-pro') {

        console.log('­şÄ¿ Visual Builder PRO detected - opening Visual Builder');



        // Normal form container'ı gizle, Visual Builder'ı göster

        container.innerHTML = `

            <div class="gm-info-box" style="padding:12px; margin-bottom:10px;">

                <i class="fas fa-wand-magic-sparkles" style="color:#8b5cf6;"></i>

                <strong>Visual Builder Aktif</strong> - Blokları sürükleyerek veya tıklayarak pipeline oluşturun.

            </div>

        `;



        if (vbContainer) {

            vbContainer.style.display = 'grid';

            // Visual Builder'ı başlat

            if (typeof VisualBuilder !== 'undefined') {

                VisualBuilder.init();

            }

        }

        return; // Normal form render'ı atla

    } else {

        // Diğer senaryolarda Visual Builder'ı gizle

        if (vbContainer) vbContainer.style.display = 'none';

    }



    // Global opsiyonları yükle (ilk çağrıda)

    if (typeof window.loadGlobalOptions === 'function' && !window.LOADED_OPTIONS) {

        window.loadGlobalOptions().catch(err => {

            console.warn('Global options yüklenemedi:', err);

        });

    }



    // ============================================================================



    try {



        const T = EXTRA_TEXTS[CURRENT_LANG];



        if (!params || params.length === 0) {

            container.innerHTML = `<div class="gm-info-box"><i class="fas fa-magic"></i> Bu senaryo tam otomatik çalışır.</div>

                               <button id="runBtn" class="gm-gradient-btn" style="width:100%">${T.run_btn}</button>`;

            document.getElementById("runBtn").onclick = () => runScenario(scenarioId);

            return;

        }



        const form = document.createElement("form");

        form.id = `form_${scenarioId}`;

        form.onsubmit = (e) => { e.preventDefault(); runScenario(scenarioId); };





        // ============================================================================

        // PHASE 3: İkinci dosya gerektiren senaryolar için CROSS-SHEET UI bloğu ekle

        // ============================================================================

        const SECOND_FILE_SCENARIOS = [

            // Only scenarios that TRULY REQUIRE a second file source

            'join-two-tables-key',

            'vlookup-single-match',

            'xlookup-single-match',

            'pq-append-tables',

            'validate-values-against-list',

            'fallback-lookup',

            'multi-column-lookup',

            'reverse-lookup-last-match'

        ];



        const needsCrossSheet = SECOND_FILE_SCENARIOS.includes(scenarioId);



        // BUG 4 FIX: İkinci dosya sütunları datalist'ini önceden hazırla

        // Form render edilmeden önce datalist hazır olmalı ki autocomplete çalışsın

        // NOTE: Initially use FILE2_COLUMNS if available, otherwise empty

        if (FILE2_COLUMNS && FILE2_COLUMNS.length > 0) {

            updateFile2ColumnDatalist(FILE2_COLUMNS);

            console.log('✔ BUG 4 FIX: file2-columns datalist rendered before form');

        } else {

            // No second file loaded - file2-columns will be empty initially

            updateFile2ColumnDatalist([]);

        }



        // OLD CROSSSHEET UI REMOVED - Now using data_source parameter instead

        // ============================================================================
        // UI_LEVEL FILTERING: Kategorize params by visibility level
        // ============================================================================
        // SERT KURAL: Mevcut UI'a dokunmadan, sadece görünürlük kontrolü ekleniyor
        const coreParams = params.filter(p => !p.ui_level || p.ui_level === 'core');
        const advancedParams = params.filter(p => p.ui_level === 'advanced');
        // hidden params are completely skipped (not rendered at all)

        // Container for advanced params (will be added after core params)
        let advancedSection = null;
        let advancedContent = null;
        if (advancedParams.length > 0) {
            advancedSection = document.createElement('details');
            advancedSection.className = 'gm-advanced-section';
            advancedSection.style.cssText = 'margin-top: 16px; border: 1px dashed var(--gm-border); border-radius: 8px; padding: 0;';

            const summary = document.createElement('summary');
            summary.className = 'gm-advanced-toggle';
            summary.style.cssText = 'cursor: pointer; padding: 10px 14px; background: rgba(100,116,139,0.08); border-radius: 8px; font-size: 0.85rem; color: var(--gm-text-muted); display: flex; align-items: center; gap: 8px; user-select: none;';
            summary.innerHTML = `<i class="fas fa-cog" style="font-size: 0.8rem;"></i> ${CURRENT_LANG === 'tr' ? 'Gelişmiş Ayarlar' : 'Advanced Settings'} <span style="font-size: 0.7rem; background: var(--gm-primary); color: white; padding: 1px 6px; border-radius: 10px; margin-left: auto;">${advancedParams.length}</span>`;
            advancedSection.appendChild(summary);

            advancedContent = document.createElement('div');
            advancedContent.className = 'gm-advanced-content';
            advancedContent.style.cssText = 'padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;';
            advancedSection.appendChild(advancedContent);
        }

        // Helper function to render a single param row (used for both core and advanced)
        const renderParamRow = (p, targetContainer) => {
            const row = document.createElement("div");
            row.className = "gm-form-row";





            // Etiket ve Açıklama

            const lbl = (CURRENT_LANG === 'tr' ? p.label_tr : p.label_en) || p.name;

            const desc = (CURRENT_LANG === 'tr' ? p.description_tr : p.description_en) || "";

            const ph = (CURRENT_LANG === 'tr' ? p.placeholder_tr : p.placeholder_en) || "";



            // Açıklamayı label altına küçük not olarak ekle + required/optional indicator

            const isRequired = p.required === true;

            const requiredIndicator = isRequired ? '<span style="color:#ef4444; font-weight:bold;"> *</span>' : '';

            const optionalBadge = !isRequired ? `<span style="font-size:0.65rem; background:rgba(100,116,139,0.2); color:var(--gm-text-muted); padding:1px 6px; border-radius:8px; margin-left:6px;">${CURRENT_LANG === 'tr' ? 'Opsiyonel' : 'Optional'}</span>` : '';

            row.innerHTML = `<label>${lbl}${requiredIndicator}${optionalBadge} <span style="font-weight:400; font-size:0.75rem; color:var(--gm-primary); opacity:0.8; margin-left:5px;">${desc ? '(' + desc + ')' : ''}</span></label>`;



            if (p.type === 'select') {

                const sel = document.createElement("select");

                sel.name = p.name;

                const labels = (CURRENT_LANG === 'tr' ? p.option_labels_tr : p.option_labels_en) || {};

                (p.options || []).forEach(opt => {

                    const o = document.createElement("option");

                    o.value = opt;

                    o.textContent = labels[opt] || opt;

                    if (opt === p.default) o.selected = true;

                    sel.appendChild(o);

                });

                row.appendChild(sel);

            }

            else if (p.type === 'dynamic_list') {

                const listWrap = document.createElement("div");

                listWrap.className = "gm-dynamic-list";



                const addBtn = document.createElement("button");

                addBtn.type = "button";

                addBtn.className = "gm-pill-btn";

                addBtn.style.width = "100%";

                addBtn.style.justifyContent = "center";

                addBtn.innerHTML = `<i class="fas fa-plus-circle"></i> ${T.add_btn || "Yeni Ekle"}`;



                let count = 0;

                const addItem = () => {

                    count++;

                    const itemDiv = document.createElement("div");

                    itemDiv.style.display = "flex";

                    itemDiv.style.alignItems = "center";

                    itemDiv.style.gap = "8px";

                    itemDiv.style.marginBottom = "5px";



                    // Sıra numarası (Kullanıcı mantığı anlasın)

                    const badge = document.createElement("span");

                    badge.textContent = `#${count}`;

                    badge.style.fontSize = "0.7rem";

                    badge.style.color = "var(--gm-text-muted)";



                    const inp = document.createElement("input");

                    inp.type = "text";

                    inp.name = `${p.name}[]`;

                    inp.placeholder = ph;



                    // CORRECT LOGIC: İkinci dosya senaryolarında file2-columns VARSAYILAN

                    // Cross-sheet aktifse ona göre değişir

                    if (needsCrossSheet) {

                        inp.setAttribute('list', 'file2-columns'); // Default: ikinci dosya

                        inp.classList.add('crosssheet-aware-input'); // Marker for toggle updates

                    } else {

                        inp.setAttribute('list', 'colOptions');

                    }



                    inp.style.flex = "1";



                    const delBtn = document.createElement("button");

                    delBtn.type = "button";

                    delBtn.className = "gm-icon-btn";

                    delBtn.innerHTML = '<i class="fas fa-trash"></i>';

                    delBtn.style.color = "#ef4444";

                    delBtn.onclick = () => itemDiv.remove();



                    itemDiv.appendChild(badge);

                    itemDiv.appendChild(inp);

                    itemDiv.appendChild(delBtn);

                    listWrap.insertBefore(itemDiv, addBtn);

                };



                addBtn.onclick = addItem;

                listWrap.appendChild(addBtn);

                addItem(); // İlk satır

                row.appendChild(listWrap);

            } else if (p.type === 'data_source') {

                // ============================================================================

                // VERİ KAYNAğI SEçİCİ (PRO Data Source Block)

                // Ana Dosya | İkinci Dosya | Aynı Dosyadan Farklı Sayfa

                // ============================================================================

                const hasMultipleSheets = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;

                const hasSecondFile = !!FILE2_NAME;



                const wrapper = document.createElement('div');

                wrapper.className = 'gm-data-source-block';

                wrapper.style.cssText = `

                    display: flex;

                    flex-direction: column;

                    gap: 10px;

                    padding: 12px;

                    background: rgba(59,130,246,0.08);

                    border: 1px solid rgba(59,130,246,0.3);

                    border-radius: 8px;

                    margin-top: 4px;

                `;



                // Dropdown row

                const dropdownRow = document.createElement('div');

                dropdownRow.style.cssText = 'display: flex; align-items: center; gap: 10px; flex-wrap: wrap;';



                // Icon

                const icon = document.createElement('i');

                icon.className = 'fas fa-database';

                icon.style.cssText = 'color: var(--gm-primary); font-size: 1rem;';

                dropdownRow.appendChild(icon);



                // Select dropdown

                const select = document.createElement('select');

                select.name = p.name;

                select.id = `data_source_${p.name}`;

                select.className = 'gm-data-source-select';

                select.style.cssText = `

                    flex: 1;

                    min-width: 180px;

                    padding: 8px 12px;

                    border: 1px solid var(--gm-border);

                    border-radius: 6px;

                    background: var(--gm-bg);

                    color: var(--gm-text);

                    font-size: 0.9rem;

                `;



                // Options - Ana Dosya, İkinci Dosya OR Aynı Dosyadan Farklı Sayfa

                // Primary option - Ana Dosya (same file, same sheet)
                const optPrimary = document.createElement('option');
                optPrimary.value = 'primary';
                optPrimary.textContent = T.data_source_primary || 'Ana Dosya (Aynı Sayfa)';
                select.appendChild(optPrimary);

                // Crosssheet option ALWAYS added (may be disabled if no sheets yet)

                const optSecondary = document.createElement('option');

                optSecondary.value = 'secondary';

                optSecondary.textContent = T.data_source_secondary || 'İkinci Dosya';

                select.appendChild(optSecondary);



                // Always add crosssheet option - enable/disable based on sheet availability

                const optCrosssheet = document.createElement('option');

                optCrosssheet.value = 'crosssheet';

                optCrosssheet.textContent = T.data_source_crosssheet || 'Aynı Dosyadan Farklı Sayfa';

                optCrosssheet.disabled = !hasMultipleSheets;

                if (!hasMultipleSheets) {

                    optCrosssheet.style.display = 'none'; // Hide if no sheets

                }

                select.appendChild(optCrosssheet);



                console.log(`[data_source] hasMultipleSheets=${hasMultipleSheets}, FILE_SHEET_NAMES=`, FILE_SHEET_NAMES);


                // Auto-select best default:
                // 1. If second file is loaded → select "İkinci Dosya"
                // 2. If only main file with multiple sheets → select "Farklı Sayfa"
                // 3. Otherwise → select "Ana Dosya" (primary)
                if (FILE2_COLUMNS && FILE2_COLUMNS.length > 0) {
                    select.value = 'secondary';
                } else if (hasMultipleSheets) {
                    select.value = 'crosssheet';
                } else {
                    select.value = 'primary';
                }



                dropdownRow.appendChild(select);

                wrapper.appendChild(dropdownRow);



                // Cross-sheet selector (hidden by default, shown when crosssheet selected)

                if (hasMultipleSheets) {

                    const crossSheetOptions = (FILE_SHEET_NAMES || [])

                        .filter(s => s !== FILE_SELECTED_SHEET)

                        .map(s => `<option value="${s}">${s}</option>`)

                        .join('');



                    const csArea = document.createElement('div');

                    csArea.id = `crosssheet_area_${p.name}`;

                    csArea.className = 'crosssheet-area';

                    csArea.style.cssText = 'display: none; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px dashed var(--gm-border);';

                    csArea.innerHTML = `

                        <i class="fas fa-layer-group" style="color:var(--gm-primary); font-size:0.85rem;"></i>

                        <select class="crosssheet-select" style="flex:1; padding:6px 10px; border:1px solid var(--gm-border); border-radius:6px; background:var(--gm-bg); color:var(--gm-text);">

                            ${crossSheetOptions}

                        </select>

                    `;

                    wrapper.appendChild(csArea);



                    // Crosssheet select change handler - fetch columns from selected sheet

                    const csSelect = csArea.querySelector('.crosssheet-select');

                    if (csSelect) {

                        csSelect.onchange = async function () {

                            const sheetName = this.value;

                            const fileInput = document.getElementById('fileInput');

                            if (!fileInput || !fileInput.files[0]) return;



                            try {

                                const formData = new FormData();

                                formData.append('file', fileInput.files[0]);

                                const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;

                                const res = await fetch(url, { method: 'POST', body: formData });

                                const data = await res.json();



                                if (data.columns && Array.isArray(data.columns)) {

                                    if (typeof updateFile2ColumnDatalist === 'function') {

                                        updateFile2ColumnDatalist(data.columns);

                                    }



                                    // CRITICAL: Also update ProColumnSelector widgets with column_source="secondary"

                                    document.querySelectorAll('.pro-column-selector-wrapper[data-column-source="secondary"]').forEach(widget => {

                                        const selectEl = widget.querySelector('select');

                                        if (selectEl) {

                                            const currentVal = selectEl.value;

                                            selectEl.innerHTML = '<option value="">-- Seçin --</option>' +

                                                data.columns.map(col => `<option value="${col}"${col === currentVal ? ' selected' : ''}>${col}</option>`).join('');

                                        }

                                    });



                                    console.log(`✔ Cross-sheet: "${sheetName}" - ${data.columns.length} sütun yüklendi`);

                                }

                            } catch (err) {

                                console.error('Cross-sheet column fetch error:', err);

                            }

                        };



                        // Trigger initial fetch if crosssheet-select has a value

                        if (csSelect.value) {

                            csSelect.dispatchEvent(new Event('change'));

                        }

                    }

                }



                // Toggle crosssheet area and update columns based on selection

                select.onchange = async function () {

                    const csArea = document.getElementById(`crosssheet_area_${p.name}`);

                    if (csArea) {

                        csArea.style.display = this.value === 'crosssheet' ? 'flex' : 'none';

                    }



                    // Determine new columns based on selection (only secondary sources)

                    let newColumns = [];

                    if (this.value === 'primary') {
                        // Primary: use main file columns for "secondary" column fields
                        newColumns = FILE_COLUMNS || [];
                    } else if (this.value === 'secondary') {

                        newColumns = FILE2_COLUMNS || [];

                    } else if (this.value === 'crosssheet' && csArea) {

                        // Cross-sheet: fetch columns from selected sheet

                        const csSelect = csArea.querySelector('.crosssheet-select');

                        if (csSelect && csSelect.value) {

                            const fileInput = document.getElementById('fileInput');

                            if (fileInput && fileInput.files[0]) {

                                try {

                                    const formData = new FormData();

                                    formData.append('file', fileInput.files[0]);

                                    const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(csSelect.value)}`;

                                    const res = await fetch(url, { method: 'POST', body: formData });

                                    const data = await res.json();

                                    if (data.columns && Array.isArray(data.columns)) {

                                        newColumns = data.columns;

                                    }

                                } catch (err) {

                                    console.error('Cross-sheet column fetch error:', err);

                                }

                            }

                        }

                    }



                    // Update file2-columns datalist (for secondary columns)

                    if (typeof updateFile2ColumnDatalist === 'function') {

                        updateFile2ColumnDatalist(newColumns);

                    }



                    // Update all ProColumnSelector widgets with column_source="secondary"

                    document.querySelectorAll('.pro-column-selector-wrapper[data-column-source="secondary"]').forEach(widget => {

                        const selectEl = widget.querySelector('select');

                        if (selectEl) {

                            const currentVal = selectEl.value;

                            selectEl.innerHTML = '<option value="">-- Seçin --</option>' +

                                newColumns.map(col => `<option value="${col}"${col === currentVal ? ' selected' : ''}>${col}</option>`).join('');

                        }

                    });



                    console.log(`[data_source] Changed to ${this.value}, ${newColumns.length} secondary columns available`);

                };



                // Trigger initial column load based on current selection

                setTimeout(() => {

                    select.dispatchEvent(new Event('change'));

                }, 100);



                row.appendChild(wrapper);

            } else if (p.type === 'json_builder') {

                const builderContainer = document.createElement('div');

                builderContainer.className = 'gm-builder-container';



                // Hidden Input

                const hidden = document.createElement('input');

                hidden.type = 'hidden';

                hidden.name = p.name;

                hidden.id = p.name;

                builderContainer.appendChild(hidden);



                const T = EXTRA_TEXTS[CURRENT_LANG];



                // --- TOOLBAR (2 SATIR + STICKY + RENK GRUPLARI) ---

                const btns = document.createElement('div');

                btns.style.cssText = `

                position: sticky;

                top: 0;

                background: var(--gm-card-bg);

                z-index: 100;

                padding: 10px 0 15px 0;

                margin-bottom: 15px;

                border-bottom: 1px solid var(--gm-border-light);

            `;



                // Renk grupları

                const COLORS = {

                    transform: '#10b981',  // Yeşil - Dönüştürme

                    visualize: '#f59e0b'   // Turuncu - Görselleştirme

                };



                // Buton oluşturma fonksiyonu

                const createBtn = (type, label, icon, group) => {

                    const borderColor = COLORS[group] || '#64748b';

                    return `

                    <button type="button" class="gm-builder-row-btn" onclick="addBuilderRow('${p.name}', '${type}')"

                        style="background:transparent; border:1px solid ${borderColor}; color:var(--gm-text);

                               padding:6px 12px; border-radius:20px; cursor:pointer; font-size:0.8rem;

                               display:inline-flex; align-items:center; gap:5px; transition:all 0.2s;"

                        onmouseover="this.style.background='${borderColor}20'; this.style.transform='translateY(-1px)'"

                        onmouseout="this.style.background='transparent'; this.style.transform='translateY(0)'">

                        <i class="fas ${icon}" style="color:${borderColor}"></i> ${label}

                    </button>

                `;

                };



                btns.innerHTML = `

                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">

                    ${createBtn('filter', T.btn_filter, 'fa-filter', 'transform')}

                    ${createBtn('agg', T.btn_agg, 'fa-calculator', 'transform')}

                    ${createBtn('sort', T.btn_sort, 'fa-sort', 'transform')}

                </div>

                <div style="display:flex; gap:6px; flex-wrap:wrap;">

                    ${createBtn('group', T.btn_group, 'fa-layer-group', 'visualize')}

                    ${createBtn('select', T.btn_select, 'fa-columns', 'visualize')}

                </div>

            `;

                builderContainer.appendChild(btns);



                // Rows Area

                const rows = document.createElement('div');

                rows.id = `rows_${p.name}`;

                rows.style.display = 'flex';

                rows.style.flexDirection = 'column';

                rows.style.gap = '5px';

                builderContainer.appendChild(rows);



                row.appendChild(builderContainer);



                // Global Helper

                if (!window.addBuilderRow) {

                    window.addBuilderRow = (name, type) => {

                        const T = EXTRA_TEXTS[CURRENT_LANG];

                        const rc = document.getElementById(`rows_${name}`);

                        const div = document.createElement('div');

                        div.className = 'gm-builder-row';

                        div.dataset.type = type;

                        // Styling is now handled by CSS (.gm-builder-row)



                        let h = '';

                        if (type === 'filter') {

                            h = `<span class="gm-badge gm-badge-filter">${T.btn_filter}</span> <input class="row-col" placeholder="${T.ph_column}" style="flex:1"> <select class="row-op" style="width:60px"><option value="==">${T.op_eq}</option><option value=">">${T.op_gt}</option><option value="<">${T.op_lt}</option><option value="contains">${T.op_contains}</option></select> <input class="row-val" placeholder="${T.ph_value}" style="flex:1">`;

                        } else if (type === 'group') {

                            h = `<span class="gm-badge gm-badge-group">${T.btn_group}</span> <input class="row-col" list="colOptions" placeholder="${T.ph_column}" style="flex:1">`;

                        } else if (type === 'agg') {

                            h = `<span class="gm-badge gm-badge-agg">${T.btn_agg}</span> <input class="row-col" placeholder="${T.ph_column}" style="flex:1"> <select class="row-func" style="flex:1"><option value="sum">${T.opt_sum}</option><option value="count">${T.opt_count}</option><option value="mean">${T.opt_mean}</option></select>`;

                        } else if (type === 'sort') {

                            h = `<span class="gm-badge gm-badge-sort">${T.btn_sort}</span> <input class="row-col" placeholder="${T.ph_column}" style="flex:1"> <select class="row-dir" style="width:80px"><option value="asc">${T.opt_asc}</option><option value="desc">${T.opt_desc}</option></select>`;

                        } else if (type === 'select') {

                            h = `<span class="gm-badge gm-badge-select">${T.btn_select}</span> <input class="row-col" placeholder="${T.ph_column}" style="flex:1">`;

                        }

                        h += `<button type="button" onclick="this.parentElement.remove()" class="gm-icon-btn del-btn" style="color:#ef4444"><i class="fas fa-times"></i></button>`;

                        div.innerHTML = h;

                        rc.appendChild(div);

                    };

                }

            } else if (p.type === 'json_builder_pro') {

                // =====================================================

                // OYUN HAMURU PRO - Gelişmiş Dinamik Rapor Builder (Lineer Akış)

                // =====================================================

                const proContainer = document.createElement('div');

                proContainer.className = 'gm-pro-builder-linear';

                proContainer.style.background = 'var(--gm-bg-secondary)';

                proContainer.style.padding = '15px';

                proContainer.style.borderRadius = '8px';

                proContainer.style.border = '1px solid var(--gm-border)';



                // Hidden Input for JSON config

                const hidden = document.createElement('input');

                hidden.type = 'hidden';

                hidden.name = p.name;

                hidden.id = `pro_config_${p.name}`;

                proContainer.appendChild(hidden);



                const T = EXTRA_TEXTS[CURRENT_LANG];



                // --- 1. TOOLBAR (Araç çubuğu) - 2 SATIR + STICKY ---

                const toolbar = document.createElement('div');

                toolbar.className = 'gm-pro-toolbar';

                toolbar.style.cssText = `

                position: sticky;

                top: 0;

                background: var(--gm-card-bg);

                z-index: 100;

                padding: 10px 0 15px 0;

                margin-bottom: 15px;

                border-bottom: 1px solid var(--gm-border-light);

            `;



                // Renk grupları (transparent background, sadece border rengi)

                const COLORS = {

                    transform: '#10b981',  // Yeşil - Dönüştürme

                    combine: '#3b82f6',    // Mavi - Birleştirme

                    visualize: '#f59e0b'   // Turuncu - Görselleştirme

                };



                // ğST SATIR: Temel İşlemler

                const topRow = document.createElement('div');

                topRow.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;';



                const topTools = [

                    { id: 'filter', label: T.lbl_add_filter || 'Filtre', icon: 'fa-filter', group: 'transform' },

                    { id: 'computed', label: T.lbl_add_computed || 'Hesaplama', icon: 'fa-calculator', group: 'transform' },

                    { id: 'grouping', label: T.lbl_add_group || 'Grupla & Topla', icon: 'fa-layer-group', group: 'visualize' },

                    { id: 'sort', label: T.lbl_add_sort || 'Sıralama', icon: 'fa-sort', group: 'transform' },

                    { id: 'window', label: T.lbl_add_window || 'RANK', icon: 'fa-trophy', group: 'visualize' },

                    { id: 'pivot', label: T.lbl_add_pivot || 'Pivot', icon: 'fa-table', group: 'visualize' }

                ];



                // ALT SATIR: İleri İşlemler

                const bottomRow = document.createElement('div');

                bottomRow.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';



                const bottomTools = [

                    { id: 'merge', label: T.lbl_merge || 'Birleştir', icon: 'fa-link', group: 'combine' },

                    { id: 'union', label: T.lbl_union || 'Alt Alta', icon: 'fa-object-group', group: 'combine' },

                    { id: 'diff', label: T.lbl_diff || 'Fark Bul', icon: 'fa-code-compare', group: 'combine' },

                    { id: 'validate', label: T.lbl_validate || 'Doğrula', icon: 'fa-check-circle', group: 'combine' },

                    { id: 'conditional_format', label: T.lbl_add_cf || 'Koşullu Biçim', icon: 'fa-palette', group: 'transform' },

                    { id: 'chart', label: T.lbl_add_chart || 'Grafik', icon: 'fa-chart-bar', group: 'visualize' },

                    { id: 'variable', label: T.lbl_add_variable || 'Değişken', icon: 'fa-sliders-h', group: 'transform' },

                    { id: 'output', label: T.lbl_add_output || 'çıktı Ayarları', icon: 'fa-file-excel', group: 'visualize' }

                ];



                // Buton oluşturma fonksiyonu

                const createToolBtn = (tool) => {

                    const btn = document.createElement('button');

                    btn.type = 'button';

                    const borderColor = COLORS[tool.group] || '#64748b';

                    btn.className = 'gm-builder-row-btn';

                    btn.style.cssText = `

                    background: transparent;

                    border: 1px solid ${borderColor};

                    color: var(--gm-text);

                    padding: 6px 12px;

                    border-radius: 20px;

                    cursor: pointer;

                    font-size: 0.8rem;

                    display: inline-flex;

                    align-items: center;

                    gap: 5px;

                    transition: all 0.2s;

                `;

                    btn.innerHTML = `<i class="fas ${tool.icon}" style="color:${borderColor}"></i> ${tool.label}`;

                    btn.onmouseover = () => {

                        btn.style.background = `${borderColor}20`;

                        btn.style.transform = 'translateY(-1px)';

                    };

                    btn.onmouseout = () => {

                        btn.style.background = 'transparent';

                        btn.style.transform = 'translateY(0)';

                    };

                    btn.onclick = () => addProAction(p.name, tool.id);

                    return btn;

                };



                // ğst satır butonları

                topTools.forEach(tool => topRow.appendChild(createToolBtn(tool)));



                // Alt satır butonları

                bottomTools.forEach(tool => bottomRow.appendChild(createToolBtn(tool)));



                toolbar.appendChild(topRow);

                toolbar.appendChild(bottomRow);

                proContainer.appendChild(toolbar);



                // --- 2. ACTION LIST (İşlem Listesi) ---

                const actionList = document.createElement('div');

                actionList.id = `pro_actions_${p.name}`;

                actionList.className = 'gm-pro-action-list';

                actionList.style.display = 'flex';

                actionList.style.flexDirection = 'column';

                actionList.style.gap = '15px';



                // Empty State Hint

                const emptyHint = document.createElement('div');

                emptyHint.id = `pro_empty_${p.name}`;

                emptyHint.innerHTML = `<i class="fas fa-arrow-up"></i> ${CURRENT_LANG === 'tr' ? 'Yukarıdaki butonlarla bir işlem ekleyin. İşlem sırası önemlidir!' : 'Add an action using buttons above. Order matters!'}`;

                emptyHint.style.textAlign = 'center';

                emptyHint.style.color = 'var(--gm-text-muted)';

                emptyHint.style.padding = '20px';

                emptyHint.style.border = '2px dashed var(--gm-border-light)';

                emptyHint.style.borderRadius = '8px';

                actionList.appendChild(emptyHint);



                proContainer.appendChild(actionList);

                row.appendChild(proContainer);



                // --- 3. HELPER FUNCTIONS ---



                // Benzersiz değerleri yükle - Checkbox filtre için

                if (!window.loadUniqueValues) {

                    window.loadUniqueValues = async (container, columnName) => {

                        const list = container.querySelector('.pro-value-filter-list');

                        const countDiv = container.querySelector('.pro-value-count');

                        const searchInput = container.querySelector('.pro-value-search');

                        const selectAllBtn = container.querySelector('.pro-select-all');

                        const clearAllBtn = container.querySelector('.pro-clear-all');

                        const T = EXTRA_TEXTS[CURRENT_LANG];



                        if (!list) return;



                        list.innerHTML = `<div style="text-align:center; color:var(--gm-text-muted); padding:10px;"><i class="fas fa-spinner fa-spin"></i> ${T.lbl_loading || 'Yükleniyor...'}</div>`;



                        try {

                            const fileInput = document.getElementById('fileInput');

                            if (!fileInput || !fileInput.files[0]) {

                                list.innerHTML = `<div style="text-align:center; color:var(--gm-accent); padding:10px;">Önce dosya yükleyin</div>`;

                                return;

                            }



                            const formData = new FormData();

                            formData.append('file', fileInput.files[0]);

                            formData.append('column', columnName);



                            const response = await fetch('/ui/unique-values', {

                                method: 'POST',

                                body: formData

                            });



                            const data = await response.json();



                            if (data.error) {

                                list.innerHTML = `<div style="text-align:center; color:var(--gm-accent); padding:10px;">${data.error}</div>`;

                                return;

                            }



                            const values = data.values || [];

                            list.innerHTML = '';



                            values.forEach((value, idx) => {

                                const item = document.createElement('label');

                                item.style.cssText = 'display:flex; align-items:center; gap:6px; padding:4px 8px; cursor:pointer; font-size:0.8rem; border-radius:4px;';

                                item.innerHTML = `

                                <input type="checkbox" value="${value.replace(/"/g, '&quot;')}" style="cursor:pointer;">

                                <span class="value-text">${value}</span>

                            `;

                                item.addEventListener('mouseenter', () => item.style.background = 'rgba(44,123,229,0.1)');

                                item.addEventListener('mouseleave', () => item.style.background = '');

                                list.appendChild(item);

                            });



                            // Sayaç güncelle

                            const updateCount = () => {

                                const checked = list.querySelectorAll('input:checked').length;

                                countDiv.textContent = `${checked} ${T.lbl_selected || 'seçildi'}`;

                            };



                            list.addEventListener('change', updateCount);



                            // Tümünü Seç

                            if (selectAllBtn) {

                                selectAllBtn.onclick = () => {

                                    list.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);

                                    updateCount();

                                };

                            }



                            // Temizle

                            if (clearAllBtn) {

                                clearAllBtn.onclick = () => {

                                    list.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

                                    updateCount();

                                };

                            }



                            // Arama

                            if (searchInput) {

                                searchInput.oninput = () => {

                                    const query = searchInput.value.toLowerCase();

                                    list.querySelectorAll('label').forEach(lbl => {

                                        const text = lbl.querySelector('.value-text')?.textContent.toLowerCase() || '';

                                        lbl.style.display = text.includes(query) ? 'flex' : 'none';

                                    });

                                };

                            }



                        } catch (err) {

                            console.error('loadUniqueValues error:', err);

                            list.innerHTML = `<div style="text-align:center; color:var(--gm-accent); padding:10px;">Hata: ${err.message}</div>`;

                        }

                    };

                }



                if (!window.addProAction) {

                    window.addProAction = (name, type) => {

                        const list = document.getElementById(`pro_actions_${name}`);

                        const empty = document.getElementById(`pro_empty_${name}`);

                        if (empty) empty.style.display = 'none';



                        const actionId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

                        const T = EXTRA_TEXTS[CURRENT_LANG];



                        const block = document.createElement('div');

                        block.className = 'gm-pro-action-block';

                        block.dataset.type = type;

                        block.id = actionId;

                        block.style.background = 'var(--gm-bg-primary)';

                        block.style.padding = '12px';

                        block.style.borderRadius = '6px';

                        block.style.border = '1px solid var(--gm-border-light)';

                        block.style.position = 'relative';

                        block.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';



                        // Header (Badge + Controls)

                        const header = document.createElement('div');

                        header.style.display = 'flex';

                        header.style.justifyContent = 'space-between';

                        header.style.marginBottom = '10px';

                        header.style.borderBottom = '1px solid var(--gm-border-light)';

                        header.style.paddingBottom = '8px';



                        let typeLabel = type.toUpperCase();

                        let typeColor = '#666';

                        if (type === 'filter') { typeLabel = T.lbl_add_filter || 'FİLTRE'; typeColor = '#3b82f6'; }

                        if (type === 'computed') { typeLabel = T.lbl_add_computed || 'HESAPLAMA'; typeColor = '#10b981'; }

                        if (type === 'grouping') { typeLabel = T.lbl_add_group || 'GRUPLA'; typeColor = '#f59e0b'; }

                        if (type === 'window') { typeLabel = T.block_window || 'Rank / Pencere'; typeColor = '#8b5cf6'; }

                        if (type === 'sort') { typeLabel = T.lbl_add_sort || 'SIRALA'; typeColor = '#6366f1'; }

                        if (type === 'output') { typeLabel = T.pro_tab_output || 'çIKTI'; typeColor = '#ec4899'; }

                        // İkinci Dosya İşlemleri

                        if (type === 'merge') { typeLabel = T.block_merge || 'Birleştir'; typeColor = '#8b5cf6'; }

                        if (type === 'union') { typeLabel = T.block_union || 'Alt Alta Ekle'; typeColor = '#06b6d4'; }

                        if (type === 'diff') { typeLabel = T.block_diff || 'Fark Bul'; typeColor = '#f59e0b'; }

                        if (type === 'validate') { typeLabel = T.block_validate || 'Doğrula'; typeColor = '#22c55e'; }

                        // YENİ ÖZELLİKLER (2024)

                        if (type === 'conditional_format') { typeLabel = T.block_cf || 'Koşullu Biçimlendirme'; typeColor = '#ec4899'; }

                        if (type === 'chart') { typeLabel = T.block_chart || 'Grafik'; typeColor = '#3b82f6'; }

                        if (type === 'pivot') { typeLabel = T.block_pivot || 'Pivot Tablo'; typeColor = '#10b981'; }

                        if (type === 'variable') { typeLabel = T.block_variable || 'Değişken'; typeColor = '#f97316'; }



                        header.innerHTML = `

                        <div style="display:flex; align-items:center; gap:8px;">

                            <span style="background:${typeColor}; color:white; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${typeLabel}</span>

                            <div style="display:flex; gap:2px;">

                                <button type="button" onclick="moveProAction('${actionId}', -1)" style="border:none; cursor:pointer; background:none; opacity:0.6; color:var(--gm-text);"><i class="fas fa-arrow-up"></i></button>

                                <button type="button" onclick="moveProAction('${actionId}', 1)" style="border:none; cursor:pointer; background:none; opacity:0.6; color:var(--gm-text);"><i class="fas fa-arrow-down"></i></button>

                            </div>

                        </div>

                        <button type="button" onclick="document.getElementById('${actionId}').remove()" style="color:#ef4444; border:none; background:none; cursor:pointer;"><i class="fas fa-times"></i></button>

                    `;

                        block.appendChild(header);



                        // Content Body

                        const body = document.createElement('div');

                        body.className = 'gm-pro-action-body';



                        if (type === 'filter') {

                            body.innerHTML = `

                            <div style="display:flex; gap:5px; flex-wrap:wrap;">

                                <input type="text" class="pro-col" list="colOptions" placeholder="${T.ph_column}" style="flex:2; min-width:120px;">

                                <select class="pro-op" style="min-width:110px;">

                                    <option value="==">${T.op_equals}</option>

                                    <option value="!=">${T.op_not_equals}</option>

                                    <option value=">">${T.op_greater}</option>

                                    <option value="<">${T.op_less}</option>

                                    <option value=">=">${T.op_gte}</option>

                                    <option value="<=">${T.op_lte}</option>

                                    <option value="contains">${T.op_contains_pro}</option>

                                    <option value="not_contains">${T.op_not_contains}</option>

                                    <option value="starts_with">${T.op_starts_with}</option>

                                    <option value="ends_with">${T.op_ends_with}</option>

                                    <option value="in_list">${T.op_in_list}</option>

                                    <option value="not_in">${T.op_not_in}</option>

                                    <option value="is_null">${T.op_is_null}</option>

                                    <option value="is_not_null">${T.op_is_not_null}</option>

                                    <option value="regex">${T.op_regex}</option>

                                </select>

                                <input type="text" class="pro-val" placeholder="${T.ph_value}" style="flex:2; min-width:100px;">

                            </div>

                        `;

                        } else if (type === 'window') {

                            const uniqueWinId = `win_${Date.now()}`;

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; width:100%; margin-bottom:5px;">

                                <select class="pro-win-type" style="flex:1;">

                                    <option value="rank">${T.wf_rank}</option>

                                    <option value="dense_rank">${T.wf_dense_rank}</option>

                                    <option value="row_number">${T.wf_row_number}</option>

                                    <option value="percent_rank">${T.wf_percent_rank}</option>

                                    <option value="cumsum">${T.wf_cumsum}</option>

                                    <option value="count">${T.agg_count} (Grup)</option>

                                    <option value="sum">${T.agg_sum} (Grup)</option>

                                    <option value="mean">${T.agg_mean} (Grup)</option>

                                    <option value="min">${T.agg_min} (Grup)</option>

                                    <option value="max">${T.agg_max} (Grup)</option>

                                </select>

                                <input type="text" class="pro-win-alias" placeholder="${T.lbl_alias}" style="flex:1;">

                            </div>

                            <div style="display:flex; gap:8px; width:100%;">

                                <input type="text" class="pro-win-part" list="colOptions" placeholder="${T.lbl_partition_by}" style="flex:2;">

                                <input type="text" class="pro-win-order" list="colOptions" placeholder="${T.lbl_order_by}" style="flex:2;">

                                <select class="pro-win-dir" style="width:80px;">

                                    <option value="asc">${T.opt_asc}</option>

                                    <option value="desc">${T.opt_desc}</option>

                                </select>

                            </div>

                            <div style="margin-top:10px;">

                                <button type="button" class="gm-pill-btn pro-add-value-filter" style="font-size:0.75rem; padding:4px 10px;">

                                    <i class="fas fa-plus-circle"></i> ${T.lbl_add_options || 'Opsiyon Ekle'}

                                </button>

                            </div>

                            <div id="${uniqueWinId}" class="pro-value-filter-container" style="display:none; margin-top:10px; padding:10px; border:1px dashed var(--gm-primary); border-radius:6px; background:rgba(44,123,229,0.05);">

                                <div style="font-size:0.8rem; color:var(--gm-primary); margin-bottom:8px;">

                                    <i class="fas fa-filter"></i> ${T.lbl_value_filter || 'Değer Filtresi'}

                                    <span style="font-weight:normal; color:var(--gm-text-muted);"> - ${T.lbl_value_filter_desc || 'Sadece seçilen değerler sıralamaya dahil edilir'}</span>

                                </div>

                                <div style="display:flex; gap:5px; margin-bottom:8px;">

                                    <input type="text" class="pro-value-search" placeholder="${T.lbl_search || 'Ara...'}" style="flex:1; padding:4px 8px; font-size:0.8rem;">

                                    <button type="button" class="gm-pill-btn pro-select-all" style="font-size:0.7rem; padding:2px 8px;">${T.lbl_select_all || 'Tümünü Seç'}</button>

                                    <button type="button" class="gm-pill-btn pro-clear-all" style="font-size:0.7rem; padding:2px 8px;">${T.lbl_clear_all || 'Temizle'}</button>

                                </div>

                                <div class="pro-value-filter-list" style="max-height:150px; overflow-y:auto; border:1px solid var(--gm-card-border); border-radius:4px; padding:5px; background:var(--gm-bg);">

                                    <div class="pro-value-loading" style="text-align:center; color:var(--gm-text-muted); padding:10px;">

                                        <i class="fas fa-spinner fa-spin"></i> ${T.lbl_loading || 'Yükleniyor...'}

                                    </div>

                                </div>

                                <div class="pro-value-count" style="font-size:0.75rem; color:var(--gm-text-muted); margin-top:5px;">0 ${T.lbl_selected || 'seçildi'}</div>

                            </div>

                        `;

                            // Event bindings

                            setTimeout(() => {

                                const container = body.querySelector(`#${uniqueWinId}`);

                                const addBtn = body.querySelector('.pro-add-value-filter');

                                const partInput = body.querySelector('.pro-win-part');



                                if (addBtn && container) {

                                    addBtn.addEventListener('click', async () => {

                                        container.style.display = container.style.display === 'none' ? 'block' : 'none';

                                        if (container.style.display === 'block' && partInput.value.trim()) {

                                            await loadUniqueValues(container, partInput.value.trim());

                                        }

                                    });

                                }



                                // Partition değiştiğinde değerleri yenile

                                if (partInput) {

                                    partInput.addEventListener('blur', async () => {

                                        if (container.style.display === 'block' && partInput.value.trim()) {

                                            await loadUniqueValues(container, partInput.value.trim());

                                        }

                                    });

                                }

                            }, 10);

                        } else if (type === 'computed') {

                            const uniqueCompId = `comp_${Date.now()}`;

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; width:100%; align-items:center;">

                                <input type="text" class="pro-comp-name" placeholder="${T.lbl_new_col_name}" style="flex:2;">

                                <select class="pro-comp-type" onchange="updateProCompFields('${uniqueCompId}', this)" style="flex:1;">

                                    <option value="arithmetic">${T.comp_arithmetic}</option>

                                    <option value="if_else">${T.comp_if_else}</option>

                                    <option value="concat">${T.comp_concat}</option>

                                    <option value="date_diff">${T.comp_date_diff}</option>

                                    <option value="text_transform">${T.comp_text_transform || 'Metin Dönüştürme'}</option>

                                    <option value="countif">EğERSAY (COUNTIF)</option>

                                    <option value="sumif">EğERTOPLA (SUMIF)</option>

                                    <option disabled>ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ</option>

                                    <option value="ytd_sum">${T.comp_ytd_sum || 'YTD (Yıl Başından Bugüne)'}</option>

                                    <option value="mtd_sum">${T.comp_mtd_sum || 'MTD (Ay Başından Bugüne)'}</option>

                                    <option value="yoy_change">${T.comp_yoy_change || 'YoY Değişim (%)'}</option>

                                    <option value="qoq_change">${T.comp_qoq_change || 'QoQ Değişim (%)'}</option>

                                    <option value="date_hierarchy">${T.comp_date_hierarchy || 'Tarih Hiyerarşisi'}</option>

                                    <option disabled>ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ</option>

                                    <option value="running_total">${T.comp_running_total || 'Kümülatif Toplam'}</option>

                                    <option value="moving_avg">${T.comp_moving_avg || 'Hareketli Ortalama'}</option>

                                    <option value="growth_rate">${T.comp_growth_rate || 'Büyüme Oranı (%)'}</option>

                                    <option value="percentile_rank">${T.comp_percentile_rank || 'Yüzdelik Sıralama'}</option>

                                    <option value="z_score">${T.comp_z_score || 'Z-Skoru'}</option>

                                    <option value="age">${T.comp_age || 'Yaş Hesapla'}</option>

                                    <option value="split">${T.comp_split || 'Sütun Böl'}</option>

                                    <option value="normalize_turkish">${T.comp_normalize_turkish || 'Türkçe Düzelt'}</option>

                                    <option value="extract_numbers">${T.comp_extract_numbers || 'Sayı çıkar'}</option>

                                    <option value="weekday">${T.comp_weekday || 'Haftanın Günü'}</option>

                                    <option value="business_days">${T.comp_business_days || 'İş Günü Farkı'}</option>

                                    <option value="duplicate_flag">${T.comp_duplicate_flag || 'Tekrar İşaretle'}</option>

                                    <option value="missing_flag">${T.comp_missing_flag || 'Eksik Veri İşaretle'}</option>

                                    <option value="correlation">${T.comp_correlation || 'Korelasyon'}</option>

                                </select>

                            </div>

                            <div id="${uniqueCompId}" class="pro-comp-fields" style="display:flex; gap:8px; width:100%; margin-top:5px; flex-wrap:wrap;">

                                <input type="text" class="pro-comp-cols" placeholder="${T.lbl_formula_cols}" style="flex:2; min-width:150px;">

                                <select class="pro-comp-op" style="min-width:100px;">

                                    <option value="add">+ ${T.arith_add}</option>

                                    <option value="subtract">- ${T.arith_subtract}</option>

                                    <option value="multiply">× ${T.arith_multiply}</option>

                                    <option value="divide">÷ ${T.arith_divide}</option>

                                    <option value="percent">% ${T.arith_percent}</option>

                                </select>

                            </div>

                         `;

                        } else if (type === 'grouping') {

                            body.innerHTML = `

                            <div style="margin-bottom:8px;">

                                <label style="font-size:0.8rem; font-weight:600;">${T.lbl_add_group} (${T.ph_column}, virgülle):</label>

                                <input type="text" class="pro-group-cols" list="colOptions" placeholder="Bölge, şehir..." style="width:100%;">

                            </div>

                            <div>

                                <label style="font-size:0.8rem; font-weight:600;">Toplama Fonksiyonu:</label>

                                <div style="display:flex; gap:5px; flex-wrap:wrap;">

                                    <input type="text" class="pro-agg-col" list="colOptions" placeholder="${T.ph_column}" style="flex:1; min-width:100px;">

                                    <select class="pro-agg-func" style="flex:1; min-width:100px;">

                                        <option value="sum">${T.agg_sum}</option>

                                        <option value="count">${T.agg_count}</option>

                                        <option value="mean">${T.agg_mean}</option>

                                        <option value="median">${T.agg_median}</option>

                                        <option value="min">${T.agg_min}</option>

                                        <option value="max">${T.agg_max}</option>

                                        <option value="std">${T.agg_std}</option>

                                        <option value="first">${T.agg_first}</option>

                                        <option value="last">${T.agg_last}</option>

                                        <option value="nunique">${T.agg_nunique}</option>

                                    </select>

                                    <input type="text" class="pro-agg-alias" placeholder="${T.lbl_alias}" style="flex:1; min-width:80px;">

                                </div>

                            </div>

                        `;

                        } else if (type === 'sort') {

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; align-items:center;">

                                <input type="text" class="pro-sort-col" list="colOptions" placeholder="${T.ph_column}" style="flex:2; min-width:200px;">

                                <select class="pro-sort-dir" style="min-width:100px;">

                                    <option value="asc">${T.opt_asc}</option>

                                    <option value="desc">${T.opt_desc}</option>

                                </select>

                            </div>

                        `;

                        } else if (type === 'output') {

                            body.innerHTML = `

                            <div style="display:flex; flex-direction:column; gap:8px;">

                                <div>

                                    <label>${T.pro_tab_output}:</label>

                                    <select class="pro-out-type" style="width:100%;">

                                        <option value="single_sheet">${T.out_single}</option>

                                        <option value="multi_sheet">${T.out_multi}</option>

                                        <option value="sheet_per_group">${T.out_per_group}</option>

                                    </select>

                                </div>

                                <div>

                                    <label>${T.lbl_partition_by} (${T.out_per_group}):</label>

                                    <input type="text" class="pro-out-grp-col" list="colOptions" placeholder="${T.ph_column}" style="width:100%;">

                                </div>

                                <div style="display:flex; align-items:center; gap:8px;">

                                    <input type="checkbox" class="pro-out-summary" checked style="width:auto; margin:0;">

                                    <label style="margin:0;">${T.out_summary}</label>

                                </div>

                                <hr style="border:none; border-top:1px solid var(--gm-border-color); margin:5px 0;">

                                <div>

                                    <label>­şôè ${T.pro_slicers || 'Tablo Filtreleri (Slicer)'}:</label>

                                    <input type="text" class="pro-out-slicers" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Filtre sütunları (virgülle)' : 'Filter columns (comma-separated)'}" style="width:100%;">

                                    <small style="color:var(--gm-text-muted); font-size:0.7rem;">${CURRENT_LANG === 'tr' ? 'Veri Excel Tablosuna dönüştürülür, filtre okları aktif olur.' : 'Data will be converted to Excel Table with filter dropdowns.'}</small>

                                </div>

                                <div>

                                    <label>­şÆ¼ ${T.pro_col_descriptions || 'Sütun Açıklamaları'}:</label>

                                    <textarea class="pro-out-col-desc" placeholder='${CURRENT_LANG === 'tr' ? '{"SütunAdı": "Açıklama...", "Diğer": "Yorum..."}' : '{"ColumnName": "Description...", "Other": "Note..."}'}' style="width:100%; height:50px; font-size:0.75rem; resize:vertical;"></textarea>

                                    <small style="color:var(--gm-text-muted); font-size:0.7rem;">${CURRENT_LANG === 'tr' ? 'JSON formatında. Excel başlık hücrelerine yorum olarak eklenir.' : 'JSON format. Added as comments to Excel header cells.'}</small>

                                </div>

                                <hr style="border:none; border-top:1px solid var(--gm-border-color); margin:10px 0;">

                                <div>

                                    <label>­şôÉ ${CURRENT_LANG === 'tr' ? 'Excel Formatı' : 'Excel Formatting'}:</label>

                                    <div style="display:flex; gap:15px; flex-wrap:wrap; margin-top:5px;">

                                        <label style="font-size:0.75rem; display:flex; align-items:center; gap:5px; cursor:pointer;">

                                            <input type="checkbox" class="pro-out-freeze" checked style="cursor:pointer;">

                                            ${CURRENT_LANG === 'tr' ? 'Başlığı Dondur' : 'Freeze Header'}

                                        </label>

                                        <label style="font-size:0.75rem; display:flex; align-items:center; gap:5px; cursor:pointer;">

                                            <input type="checkbox" class="pro-out-autofit" checked style="cursor:pointer;">

                                            ${CURRENT_LANG === 'tr' ? 'Otomatik Genişlik' : 'Auto-Fit Columns'}

                                        </label>

                                        <label style="font-size:0.75rem; display:flex; align-items:center; gap:5px; cursor:pointer;">

                                            <input type="checkbox" class="pro-out-header-style" checked style="cursor:pointer;">

                                            ${CURRENT_LANG === 'tr' ? 'Başlık Stili' : 'Header Style'}

                                        </label>

                                    </div>

                                </div>

                                <div style="margin-top:8px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Sayı Formatı' : 'Number Format'}:</label>

                                    <select class="pro-out-numformat" style="width:100%;">

                                        <option value="">${CURRENT_LANG === 'tr' ? 'Varsayılan' : 'Default'}</option>

                                        <option value="#,##0">${CURRENT_LANG === 'tr' ? 'Tam Sayı (1.234)' : 'Integer (1,234)'}</option>

                                        <option value="#,##0.00">${CURRENT_LANG === 'tr' ? 'Ondalıklı (1.234,56)' : 'Decimal (1,234.56)'}</option>

                                        <option value="0.00%">${CURRENT_LANG === 'tr' ? 'Yüzde (12,34%)' : 'Percentage (12.34%)'}</option>

                                        <option value="Ôé║#,##0.00">${CURRENT_LANG === 'tr' ? 'Para Birimi (Ôé║)' : 'Currency (Ôé║)'}</option>

                                    </select>

                                </div>

                            </div>

                        `;

                        } else if (type === 'merge') {

                            // BİRLEşTİR - VLOOKUP / JOIN

                            const hasMultipleSheets = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;

                            const crossSheetOptions = hasMultipleSheets

                                ? (FILE_SHEET_NAMES || []).filter(s => s !== FILE_SELECTED_SHEET).map(s => `<option value="${s}">${s}</option>`).join('')

                                : '';



                            body.innerHTML = `

                            <!-- Tek Satır: Cross-Sheet veya İkinci Dosya Ekle -->

                            <div class="gm-pro-merge-source" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; padding:8px; background:rgba(59,130,246,0.1); border-radius:6px; border:1px dashed var(--gm-primary);">

                                

                                ${hasMultipleSheets ? `

                                <!-- Cross-Sheet Checkbox -->

                                <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">

                                    <input type="checkbox" class="pro-use-crosssheet" onchange="toggleProMergeSource(this)" style="width:16px; height:16px; accent-color:var(--gm-primary);">

                                    <span style="color:var(--gm-primary); font-weight:500;"><i class="fas fa-layer-group"></i> Aynı Dosyadan</span>

                                </label>

                                

                                <!-- Cross-Sheet Selector (gizli başlar) -->

                                <div class="pro-merge-crosssheet-area" style="display:none; flex:1; min-width:200px; align-items:center; gap:6px;">

                                    <select class="pro-crosssheet-select gm-sheet-select" style="padding:4px 8px; font-size:0.8rem; height:28px; max-width:140px;" onchange="fetchCrossSheetColumns(this)">

                                        ${crossSheetOptions}

                                    </select>

                                    <!-- Column Preview -->

                                    <div class="pro-crosssheet-columns" style="flex:1; min-width:0; background:var(--gm-bg); border:1px solid var(--gm-card-border); border-radius:4px; padding:2px 6px; height:28px; display:flex; align-items:center; overflow:hidden;">

                                        <div class="pro-crosssheet-column-list" style="display:flex; gap:4px; overflow-x:auto; white-space:nowrap; align-items:center; width:100%; scrollbar-width:thin;">

                                            <span style="color:var(--gm-text-muted); font-size:0.7rem; font-style:italic;">Sayfa seçin...</span>

                                        </div>

                                    </div>

                                </div>

                                ` : ''}

                                

                                <!-- İkinci Dosya Gerekli Uyarısı - Conditional Visibility -->

                                ${(() => {

                                    const mode = getSecondSourceHintMode();

                                    const shouldShow = shouldShowSecondSourceHint();

                                    if (!shouldShow || mode === 'hidden') {

                                        return `<div class="gm-source-hint" style="display:none;"></div>`;

                                    }

                                    let icon, text, cssClass;

                                    if (mode === 'success') {

                                        icon = 'fa-check-circle';

                                        text = (T.lbl_second_source_success || 'Source: {filename}').replace('{filename}', FILE2_NAME || 'File2');

                                        cssClass = 'gm-source-hint--success';

                                    } else if (mode === 'info') {

                                        icon = 'fa-info-circle';

                                        text = T.lbl_second_source_info || 'You can also pick another sheet from the same workbook.';

                                        cssClass = 'gm-source-hint--info';

                                    } else {

                                        icon = 'fa-exclamation-triangle';

                                        text = T.lbl_second_source_warning || 'This scenario requires a second source: upload a 2nd file or select a sheet.';

                                        cssClass = 'gm-source-hint--warning';

                                    }

                                    return `<div class="gm-source-hint ${cssClass}" style="${hasMultipleSheets ? '' : 'flex:1;'}"><i class="fas ${icon}"></i> ${text}</div>`;

                                })()}

                            </div>

                            

                            <!-- Birleştirme Parametreleri -->

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.lbl_main_file_col || 'Ana Dosya Sütunu:'}</label>

                                    <input type="text" class="pro-merge-left" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Örn: ğrün Kodu' : 'e.g. Product ID'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.lbl_second_file_col || 'İkinci Dosya Sütunu:'}</label>

                                    <input type="text" class="pro-merge-right" list="file2-columns" placeholder="${CURRENT_LANG === 'tr' ? 'Örn: ID' : 'e.g. ID'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${T.lbl_join_type || 'Birleştirme Tipi:'}</label>

                                    <select class="pro-merge-how" style="width:100%;">

                                        <option value="left">${T.join_left || 'SOL (VLOOKUP)'}</option>

                                        <option value="inner">${T.join_inner || 'ORTAK (Sadece Eşleşen)'}</option>

                                        <option value="right">${T.join_right || 'SAğ'}</option>

                                        <option value="outer">${T.join_outer || 'TAM (Tümü)'}</option>

                                    </select>

                                </div>

                            </div>

                        `;

                        } else if (type === 'union') {

                            // ALT ALTA EKLE - UNION/APPEND

                            body.innerHTML = `

                            ${getInlineCrossSheetHTML('union_' + Date.now())}

                            <div style="margin-top:4px; font-size:0.75rem; color:var(--gm-text-muted);">

                                ­şôî ${CURRENT_LANG === 'tr'

                                    ? 'İki dosya alt alta birleştirilecek. Sütunlar otomatik eşleştirilir.'

                                    : 'Two files will be appended. Columns are matched automatically.'}

                            </div>

                        `;

                        } else if (type === 'diff') {

                            // FARK BUL - DIFF

                            body.innerHTML = `

                            ${getInlineCrossSheetHTML('diff_' + Date.now())}

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Ana Dosya Sütunu:' : 'Main File Column:'}</label>

                                    <input type="text" class="pro-diff-left" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Karşılaştırma sütunu' : 'Compare column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'İkinci Dosya Sütunu:' : 'Second File Column:'}</label>

                                    <input type="text" class="pro-diff-right" list="file2-columns" placeholder="${CURRENT_LANG === 'tr' ? 'Karşılaştırma sütunu' : 'Compare column'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.75rem; color:var(--gm-text-muted);">

                                ${CURRENT_LANG === 'tr'

                                    ? '­şôî Sonuç: Ana dosyada olup ikinci dosyada OLMAYAN kayıtlar'

                                    : '­şôî Result: Records in main file but NOT in second file'}

                            </div>

                        `;

                        } else if (type === 'validate') {

                            // DOğRULA - VALIDATE

                            body.innerHTML = `

                            ${getInlineCrossSheetHTML('validate_' + Date.now())}

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Kontrol Edilecek Sütun:' : 'Column to Check:'}</label>

                                    <input type="text" class="pro-val-left" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Ana dosya sütunu' : 'Main file column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Referans Liste Sütunu:' : 'Reference List Column:'}</label>

                                    <input type="text" class="pro-val-right" list="file2-columns" placeholder="${CURRENT_LANG === 'tr' ? 'Geçerli değerler listesi' : 'Valid values list'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Sonuç Sütun Adı:' : 'Result Column Name:'}</label>

                                    <input type="text" class="pro-val-result" value="${CURRENT_LANG === 'tr' ? 'Doğrulama' : 'Validation'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.75rem; color:var(--gm-text-muted);">

                                ${CURRENT_LANG === 'tr'

                                    ? '­şôî Sonuç: Yeni sütun eklenir → Geçerli / Geçersiz'

                                    : '­şôî Result: New column added → Valid / Invalid'}

                            </div>

                        `;

                        } else if (type === 'conditional_format') {

                            // KOşULLU BİçİMLENDİRME - CONDITIONAL FORMATTING

                            const uniqueCfId = `cf_${Date.now()}`;

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:2; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.cf_column || 'Sütun'}</label>

                                    <input type="text" class="pro-cf-col" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Renklendirme yapılacak sütun' : 'Column to format'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Format Tipi' : 'Format Type'}</label>

                                    <select class="pro-cf-type" style="width:100%;">

                                        <option value="color_scale">${T.cf_color_scale || 'Renk Skalası (3 Renk)'}</option>

                                        <option value="2_color_scale">${T.cf_2_color_scale || 'Renk Skalası (2 Renk)'}</option>

                                        <option value="data_bar">${T.cf_data_bar || 'Veri çubuğu'}</option>

                                        <option value="icon_set">${T.cf_icon_set || 'İkon Seti'}</option>

                                        <option value="threshold">${T.cf_threshold || 'Eşik Değer'}</option>

                                        <option value="top_n">${T.cf_top_n || 'En Yüksek N'}</option>

                                        <option value="bottom_n">${T.cf_bottom_n || 'En Düşük N'}</option>

                                        <option value="duplicate">${T.cf_duplicate || 'Tekrarlananlar'}</option>

                                        <option value="unique">${T.cf_unique || 'Benzersizler'}</option>

                                        <option value="text_contains">${T.cf_text_contains || 'Metin İçerir'}</option>

                                        <option value="blanks">${T.cf_blanks || 'Boş Hücreler'}</option>

                                        <option value="no_blanks">${T.cf_no_blanks || 'Dolu Hücreler'}</option>

                                    </select>

                                </div>

                            </div>

                            <div id="${uniqueCfId}" class="pro-cf-options" style="margin-top:10px;">

                                <!-- 3 Renk Skalası (varsayılan) -->

                                <div class="cf-color-fields" style="display:flex; gap:8px; flex-wrap:wrap;">

                                    <div style="flex:1; min-width:90px;">

                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">­şö┤ ${CURRENT_LANG === 'tr' ? 'Min (Düşük)' : 'Min (Low)'}</label>

                                        <input type="color" class="pro-cf-min-color" value="#F8696B" style="width:100%; height:30px; border:none; cursor:pointer;">

                                    </div>

                                    <div class="cf-mid-color" style="flex:1; min-width:90px;">

                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">­şşí ${CURRENT_LANG === 'tr' ? 'Orta (Medyan)' : 'Mid (Median)'}</label>

                                        <input type="color" class="pro-cf-mid-color" value="#FFEB84" style="width:100%; height:30px; border:none; cursor:pointer;">

                                    </div>

                                    <div style="flex:1; min-width:90px;">

                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">­şşó ${CURRENT_LANG === 'tr' ? 'Max (Yüksek)' : 'Max (High)'}</label>

                                        <input type="color" class="pro-cf-max-color" value="#63BE7B" style="width:100%; height:30px; border:none; cursor:pointer;">

                                    </div>

                                </div>

                                <!-- Eşik / Top-Bottom N için -->

                                <div class="cf-threshold-fields" style="display:none; gap:8px; margin-top:8px;">

                                    <div style="flex:1;">

                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">${CURRENT_LANG === 'tr' ? 'Değer (Eşik veya N)' : 'Value (Threshold or N)'}</label>

                                        <input type="number" class="pro-cf-threshold" value="10" style="width:100%;">

                                    </div>

                                </div>

                                <!-- Text Contains için -->

                                <div class="cf-text-fields" style="display:none; gap:8px; margin-top:8px;">

                                    <div style="flex:1;">

                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">${CURRENT_LANG === 'tr' ? 'Aranacak Metin' : 'Search Text'}</label>

                                        <input type="text" class="pro-cf-text" placeholder="${CURRENT_LANG === 'tr' ? 'Örn: Hata' : 'e.g. Error'}" style="width:100%;">

                                    </div>

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.7rem; color:var(--gm-text-muted);">

                                ­şÆí ${CURRENT_LANG === 'tr' ? 'Renk kutularına tıklayarak renk seçebilirsiniz' : 'Click color boxes to choose colors'}

                            </div>

                        `;

                            // Format tipine göre alanları göster/gizle

                            setTimeout(() => {

                                const container = document.getElementById(uniqueCfId);

                                const typeSelect = body.querySelector('.pro-cf-type');

                                const colorFields = container?.querySelector('.cf-color-fields');

                                const midColor = container?.querySelector('.cf-mid-color');

                                const thresholdFields = container?.querySelector('.cf-threshold-fields');



                                const updateFields = () => {

                                    const cfType = typeSelect?.value;

                                    // Renk alanları: color_scale, 2_color_scale, data_bar

                                    if (colorFields) {

                                        colorFields.style.display = ['color_scale', '2_color_scale', 'data_bar'].includes(cfType) ? 'flex' : 'none';

                                    }

                                    // Mid renk: sadece 3 renk skalasında

                                    if (midColor) {

                                        midColor.style.display = cfType === 'color_scale' ? 'block' : 'none';

                                    }

                                    // Eşik/N alanı: threshold, top_n, bottom_n

                                    if (thresholdFields) {

                                        thresholdFields.style.display = ['threshold', 'top_n', 'bottom_n'].includes(cfType) ? 'flex' : 'none';

                                    }

                                    // Text alanı: text_contains

                                    const textFields = container?.querySelector('.cf-text-fields');

                                    if (textFields) {

                                        textFields.style.display = cfType === 'text_contains' ? 'flex' : 'none';

                                    }

                                };



                                if (typeSelect) {

                                    typeSelect.addEventListener('change', updateFields);

                                    updateFields(); // İlk yüklemede çalıştır

                                }

                            }, 10);

                        } else if (type === 'chart') {

                            // GRAFİK - CHART

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Grafik Tipi' : 'Chart Type'}</label>

                                    <select class="pro-chart-type" style="width:100%;">

                                        <option value="column">${T.chart_column || 'Sütun Grafik'}</option>

                                        <option value="bar">${T.chart_bar || 'çubuk Grafik'}</option>

                                        <option value="line">${T.chart_line || 'çizgi Grafik'}</option>

                                        <option value="area">${T.chart_area || 'Alan Grafik'}</option>

                                        <option value="pie">${T.chart_pie || 'Pasta Grafik'}</option>

                                        <option value="doughnut">${T.chart_doughnut || 'Halka Grafik'}</option>

                                        <option value="scatter">${T.chart_scatter || 'Dağılım Grafiği'}</option>

                                        <option value="radar">${T.chart_radar || 'Radar Grafik'}</option>

                                    </select>

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${T.chart_x_axis || 'X Ekseni'}</label>

                                    <input type="text" class="pro-chart-x" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Kategori sütunu' : 'Category column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${T.chart_y_axis || 'Y Ekseni'}</label>

                                    <input type="text" class="pro-chart-y" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Değer sütunu' : 'Value column'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="margin-top:8px;">

                                <label style="font-size:0.75rem;">${T.chart_title || 'Grafik Başlığı'}</label>

                                <input type="text" class="pro-chart-title" placeholder="${CURRENT_LANG === 'tr' ? 'Opsiyonel başlık' : 'Optional title'}" style="width:100%;">

                            </div>

                        `;

                        } else if (type === 'pivot') {

                            // PİVOT - PIVOT TABLE (GELİşTİRİLMİş)

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:2; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.pivot_rows || 'Satır Alanları'}</label>

                                    <input type="text" class="pro-pivot-rows" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Gruplama sütunları (virgülle)' : 'Group columns (comma separated)'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${T.pivot_cols || 'Sütun Alanları (Opsiyonel)'}</label>

                                    <input type="text" class="pro-pivot-cols" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'çapraz tablo için' : 'For cross-tab'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">

                                <div style="flex:2; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.pivot_values || 'Değer Alanları'}</label>

                                    <input type="text" class="pro-pivot-values" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Toplanacak sütun' : 'Value column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:100px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Fonksiyon' : 'Function'}</label>

                                    <select class="pro-pivot-func" style="width:100%;">

                                        <option value="sum">${T.agg_sum || 'Toplam'}</option>

                                        <option value="count">${T.agg_count || 'Sayı'}</option>

                                        <option value="mean">${T.agg_mean || 'Ortalama'}</option>

                                        <option value="median">${T.agg_median || 'Medyan'}</option>

                                        <option value="min">${T.agg_min || 'Minimum'}</option>

                                        <option value="max">${T.agg_max || 'Maksimum'}</option>

                                    </select>

                                </div>

                                <div style="flex:1; min-width:100px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'çıktı Adı (Alias)' : 'Output Name (Alias)'}</label>

                                    <input type="text" class="pro-pivot-alias" placeholder="${CURRENT_LANG === 'tr' ? 'Opsiyonel' : 'Optional'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; align-items:center;">

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Yüzde Gösterimi' : 'Percentage Display'}</label>

                                    <select class="pro-pivot-percent" style="width:100%;">

                                        <option value="">${CURRENT_LANG === 'tr' ? 'Yok (Ham Değer)' : 'None (Raw Value)'}</option>

                                        <option value="row">${CURRENT_LANG === 'tr' ? '% Satır (Row)' : '% of Row'}</option>

                                        <option value="column">${CURRENT_LANG === 'tr' ? '% Sütun (Column)' : '% of Column'}</option>

                                        <option value="total">${CURRENT_LANG === 'tr' ? '% Genel Toplam' : '% of Grand Total'}</option>

                                    </select>

                                </div>

                                <div style="flex:1; min-width:100px; display:flex; align-items:center; padding-top:15px;">

                                    <label style="font-size:0.75rem; display:flex; align-items:center; gap:5px; cursor:pointer;">

                                        <input type="checkbox" class="pro-pivot-totals" checked style="cursor:pointer;">

                                        ${T.pivot_show_totals || 'Toplam Göster'}

                                    </label>

                                </div>

                                <div style="flex:1; min-width:100px; display:flex; align-items:center; padding-top:15px;">

                                    <label style="font-size:0.75rem; display:flex; align-items:center; gap:5px; cursor:pointer;">

                                        <input type="checkbox" class="pro-pivot-subtotals" style="cursor:pointer;">

                                        ${CURRENT_LANG === 'tr' ? 'Ara Toplamlar' : 'Subtotals'}

                                    </label>

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.7rem; color:var(--gm-text-muted); background:rgba(16,185,129,0.1); padding:6px 10px; border-radius:4px;">

                                ­şÆí ${CURRENT_LANG === 'tr'

                                    ? 'İpucu: Alias ile çıktı sütun adını değiştirebilir, Yüzde ile değerleri oransal gösterebilirsiniz.'

                                    : 'Tip: Use Alias to rename output columns, Percentage to show values as ratios.'}

                            </div>

                        `;

                        } else if (type === 'variable') {

                            // WHAT-IF DEğİşKENİ - VARIABLE

                            body.innerHTML = `

                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.var_name || 'Değişken Adı'}</label>

                                    <input type="text" class="pro-var-name" placeholder="${CURRENT_LANG === 'tr' ? 'Örn: FiyatArtisi' : 'e.g. PriceIncrease'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.var_value || 'Değer'}</label>

                                    <input type="number" class="pro-var-value" step="any" placeholder="${CURRENT_LANG === 'tr' ? 'Sayısal değer' : 'Numeric value'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.75rem; color:var(--gm-text-muted); background:rgba(249,115,22,0.1); padding:8px; border-radius:4px;">

                                ­şÆí ${T.var_hint || (CURRENT_LANG === 'tr' ? 'Hesaplamalarda $DeğişkenAdı şeklinde kullanın' : 'Use $VariableName in calculations')}

                                <br><span style="opacity:0.8;">${CURRENT_LANG === 'tr' ? 'Örnek formül: Fiyat * (1 + $FiyatArtisi)' : 'Example: Price * (1 + $PriceIncrease)'}</span>

                            </div>

                        `;

                        }



                        block.appendChild(body);

                        list.appendChild(block);

                    };



                    window.moveProAction = (id, direction) => {

                        const block = document.getElementById(id);

                        if (!block) return;

                        if (direction === -1) { // Up

                            if (block.previousElementSibling && block.previousElementSibling.id.startsWith('act_')) {

                                block.parentNode.insertBefore(block, block.previousElementSibling);

                            }

                        } else { // Down

                            if (block.nextElementSibling) {

                                block.parentNode.insertBefore(block.nextElementSibling, block);

                            }

                        }

                    };



                    window.updateProCompFields = (id, selectElem) => {

                        const div = document.getElementById(id);

                        const type = selectElem.value;

                        const T = EXTRA_TEXTS[CURRENT_LANG];



                        if (type === 'arithmetic') {

                            div.innerHTML = `

                            <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${T.lbl_formula_cols}" style="flex:2; min-width:150px;">

                            <select class="pro-comp-op" style="min-width:80px;">

                                <option value="add">+ ${T.arith_add}</option>

                                <option value="subtract">- ${T.arith_subtract}</option>

                                <option value="multiply">× ${T.arith_multiply}</option>

                                <option value="divide">÷ ${T.arith_divide}</option>

                                <option value="percent">% ${T.arith_percent}</option>

                            </select>

                         `;

                        } else if (type === 'if_else') {

                            div.innerHTML = `

                            <div style="display:flex; gap:5px; flex-wrap:wrap; width:100%;">

                                <input type="text" class="pro-cond-col" list="colOptions" placeholder="Koşul Sütunu" style="flex:1; min-width:100px;">

                                <select class="pro-cond-op" style="min-width:80px;">

                                    <option value="==">${T.op_equals}</option>

                                    <option value="!=">${T.op_not_equals}</option>

                                    <option value=">">${T.op_greater}</option>

                                    <option value="<">${T.op_less}</option>

                                    <option value=">=">${T.op_gte}</option>

                                    <option value="<=">${T.op_lte}</option>

                                    <option value="contains">${T.op_contains_pro}</option>

                                    <option value="is_null">${T.op_is_null}</option>

                                </select>

                                <input type="text" class="pro-cond-val" placeholder="Koşul Değeri" style="flex:1; min-width:80px;">

                            </div>

                            <div style="display:flex; gap:5px; margin-top:5px; width:100%;">

                                <input type="text" class="pro-if-true" placeholder="Doğruysa" style="flex:1;">

                                <input type="text" class="pro-if-false" placeholder="Yanlışsa" style="flex:1;">

                            </div>

                         `;

                        } else if (type === 'concat') {

                            div.innerHTML = `

                            <input type="text" class="pro-comp-cols" list="colOptions" placeholder="Birleştirilecek Sütunlar (virgülle)" style="flex:2; min-width:200px;">

                            <input type="text" class="pro-comp-sep" placeholder="Ayraç (ör: -)" style="min-width:120px;">

                         `;

                        } else if (type === 'date_diff') {

                            div.innerHTML = `

                            <input type="text" class="pro-date-col1" list="colOptions" placeholder="Başlangıç Tarihi" style="flex:1;">

                            <input type="text" class="pro-date-col2" list="colOptions" placeholder="Bitiş Tarihi" style="flex:1;">

                            <select class="pro-date-unit" style="min-width:80px;">

                                <option value="days">Gün</option>

                                <option value="months">Ay</option>

                                <option value="years">Yıl</option>

                            </select>

                         `;

                        } else if (type === 'text_transform') {

                            div.innerHTML = `

                            <div style="display:flex; gap:5px; flex-wrap:wrap; width:100%;">

                                <input type="text" class="pro-tt-source" list="colOptions" placeholder="${T.tt_source_col || 'Kaynak Sütun'}" style="flex:2; min-width:150px;">

                                <select class="pro-tt-type" style="flex:1; min-width:150px;">

                                    <option value="remove_parentheses">${T.tt_remove_parentheses || 'Parantez Sil'}</option>

                                    <option value="extract_parentheses">${T.tt_extract_parentheses || 'Parantez İçini çıkar'}</option>

                                    <option value="first_n_words">${T.tt_first_n_words || 'İlk N Kelime'}</option>

                                    <option value="remove_after_dash">${T.tt_remove_after_dash || 'Tire Sonrasını Sil'}</option>

                                    <option value="regex_replace">${T.tt_regex || 'Regex (İleri)'}</option>

                                </select>

                            </div>

                            <div class="pro-tt-extra" style="display:none; gap:5px; margin-top:5px; width:100%;">

                                <input type="text" class="pro-tt-pattern" placeholder="${T.tt_pattern || 'Regex Pattern'}" style="flex:1;">

                                <input type="text" class="pro-tt-replacement" placeholder="${T.tt_replacement || 'Yerine Koy'}" style="flex:1;">

                            </div>

                            <div class="pro-tt-wordcount" style="display:none; gap:5px; margin-top:5px; width:100%;">

                                <input type="number" class="pro-tt-n" value="2" min="1" max="10" placeholder="${T.tt_word_count || 'Kelime Sayısı'}" style="width:100px;">

                                <span style="font-size:0.8rem; color:var(--gm-text-muted);">${T.tt_word_count || 'Kelime Sayısı'}</span>

                            </div>

                         `;

                            // Dinamik alan gösterimi

                            setTimeout(() => {

                                const typeSelect = div.querySelector('.pro-tt-type');

                                const extraDiv = div.querySelector('.pro-tt-extra');

                                const wordDiv = div.querySelector('.pro-tt-wordcount');

                                if (typeSelect) {

                                    typeSelect.addEventListener('change', () => {

                                        extraDiv.style.display = typeSelect.value === 'regex_replace' ? 'flex' : 'none';

                                        wordDiv.style.display = typeSelect.value === 'first_n_words' ? 'flex' : 'none';

                                    });

                                }

                            }, 10);

                        } else if (type === 'countif' || type === 'sumif') {

                            div.innerHTML = `

                            <div style="display:flex; gap:5px; flex-wrap:wrap; width:100%;">

                                <input type="text" class="pro-range-col" list="colOptions" placeholder="Aralık Sütunu" style="flex:1; min-width:100px;">

                                <select class="pro-cond-op" style="min-width:80px;">

                                    <option value="==">${T.op_equals}</option>

                                    <option value="!=">${T.op_not_equals}</option>

                                    <option value=">">${T.op_greater}</option>

                                    <option value="<">${T.op_less}</option>

                                </select>

                                <input type="text" class="pro-cond-val" placeholder="Kriter" style="flex:1; min-width:80px;">

                            </div>

                            ${type === 'sumif' ? '<input type="text" class="pro-sum-col" list="colOptions" placeholder="Toplanacak Sütun" style="width:100%; margin-top:5px;">' : ''}

                         `;

                        } else if (type === 'ytd_sum' || type === 'mtd_sum' || type === 'yoy_change' || type === 'qoq_change') {

                            // ZAMAN SERİSİ - TIME SERIES (YTD, MTD, YoY, QoQ)

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.ts_date_column || 'Tarih Sütunu'}</label>

                                    <input type="text" class="pro-ts-date" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Tarih sütunu' : 'Date column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.ts_value_column || 'Değer Sütunu'}</label>

                                    <input type="text" class="pro-ts-value" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Toplanacak/karşılaştırılacak' : 'Value column'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.75rem; color:var(--gm-text-muted);">

                                ${type === 'ytd_sum' ? '­şôè Yıl içinde kümülatif toplam hesaplar' :

                                    type === 'mtd_sum' ? '­şôè Ay içinde kümülatif toplam hesaplar' :

                                        type === 'yoy_change' ? '­şôè Geçen yılın aynı dönemiyle karşılaştırır (%)' :

                                            '­şôè Önceki çeyrekle karşılaştırır (%)'}

                            </div>

                         `;

                        } else if (type === 'date_hierarchy') {

                            // TARİH HİYERARşİSİ

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.ts_date_column || 'Tarih Sütunu'}</label>

                                    <input type="text" class="pro-ts-date" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Tarih sütunu' : 'Date column'}" style="width:100%;">

                                </div>

                            </div>

                            <div style="margin-top:8px; font-size:0.75rem; color:var(--gm-text-muted);">

                                ­şôà Otomatik olarak Yıl, Ay, Gün, çeyrek, Hafta sütunları oluşturur

                            </div>

                         `;

                        } else if (type === 'running_total') {

                            // KğMğLATİF TOPLAM

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:2; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_value_col || 'Değer Sütunu'}</label>

                                    <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Toplanacak sütun' : 'Value column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:120px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_group_col || 'Grup Sütunu (Opsiyonel)'}</label>

                                    <input type="text" class="pro-comp-group" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Gruplama için' : 'For grouping'}" style="width:100%;">

                                </div>

                            </div>

                         `;

                        } else if (type === 'moving_avg') {

                            // HAREKETLİ ORTALAMA

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:2; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_value_col || 'Değer Sütunu'}</label>

                                    <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Ortalama alınacak sütun' : 'Value column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:100px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_window_size || 'Pencere Boyutu (N)'}</label>

                                    <input type="number" class="pro-comp-window" value="3" min="1" max="100" style="width:100%;">

                                </div>

                            </div>

                         `;

                        } else if (type === 'growth_rate' || type === 'percentile_rank' || type === 'z_score') {

                            // BğYğME ORANI / YğZDELİK SIRALAMA / Z-SKORU (tek sütun)

                            const labels = {

                                growth_rate: CURRENT_LANG === 'tr' ? 'Karşılaştırılacak sütun' : 'Value column',

                                percentile_rank: CURRENT_LANG === 'tr' ? 'Sıralanacak sütun' : 'Value column',

                                z_score: CURRENT_LANG === 'tr' ? 'Analiz edilecek sütun' : 'Value column'

                            };

                            div.innerHTML = `

                            <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${labels[type]}" style="width:100%;">

                         `;

                        } else if (type === 'age' || type === 'weekday') {

                            // YAş HESAPLA / HAFTANIN GğNğ (tarih sütunu)

                            div.innerHTML = `

                            <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${T.new_cc_date_col || 'Tarih Sütunu'}" style="width:100%;">

                         `;

                        } else if (type === 'split') {

                            // SğTUN BÖL

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:2; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_source_col || 'Kaynak Sütun'}</label>

                                    <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Bölünecek sütun' : 'Source column'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:80px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_separator || 'Ayraç'}</label>

                                    <input type="text" class="pro-comp-sep" value="," placeholder=", - /" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:80px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_part_index || 'Parça No'}</label>

                                    <input type="number" class="pro-comp-index" value="0" min="0" max="10" style="width:100%;">

                                </div>

                            </div>

                         `;

                        } else if (type === 'normalize_turkish' || type === 'extract_numbers' || type === 'duplicate_flag' || type === 'missing_flag') {

                            // TğRKçE DğZELT / SAYI çIKAR / TEKRAR İşARETLE / EKSİK VERİ (tek sütun)

                            const labels = {

                                normalize_turkish: CURRENT_LANG === 'tr' ? 'Düzeltilecek sütun' : 'Source column',

                                extract_numbers: CURRENT_LANG === 'tr' ? 'Sayı çıkarılacak sütun' : 'Source column',

                                duplicate_flag: CURRENT_LANG === 'tr' ? 'Kontrol edilecek sütun' : 'Check column',

                                missing_flag: CURRENT_LANG === 'tr' ? 'Kontrol edilecek sütun' : 'Check column'

                            };

                            div.innerHTML = `

                            <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${labels[type]}" style="width:100%;">

                         `;

                        } else if (type === 'business_days') {

                            // İş GğNğ FARKI

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_date1 || 'Başlangıç Tarihi'}</label>

                                    <input type="text" class="pro-date-col1" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Başlangıç' : 'Start date'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_date2 || 'Bitiş Tarihi'}</label>

                                    <input type="text" class="pro-date-col2" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Bitiş' : 'End date'}" style="width:100%;">

                                </div>

                            </div>

                         `;

                        } else if (type === 'correlation') {

                            // KORELASYON

                            div.innerHTML = `

                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_col1 || 'Birinci Sütun'}</label>

                                    <input type="text" class="pro-comp-col1" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Sayısal sütun 1' : 'Numeric column 1'}" style="width:100%;">

                                </div>

                                <div style="flex:1; min-width:150px;">

                                    <label style="font-size:0.75rem;">${T.new_cc_col2 || 'İkinci Sütun'}</label>

                                    <input type="text" class="pro-comp-col2" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Sayısal sütun 2' : 'Numeric column 2'}" style="width:100%;">

                                </div>

                            </div>

                         `;

                        } else {

                            // Default: arithmetic

                            div.innerHTML = `

                            <input type="text" class="pro-comp-cols" list="colOptions" placeholder="${T.lbl_formula_cols}" style="flex:2; min-width:150px;">

                            <select class="pro-comp-op" style="min-width:80px;">

                                <option value="add">+ ${T.arith_add}</option>

                                <option value="subtract">- ${T.arith_subtract}</option>

                                <option value="multiply">× ${T.arith_multiply}</option>

                                <option value="divide">÷ ${T.arith_divide}</option>

                                <option value="percent">% ${T.arith_percent}</option>

                            </select>

                         `;

                        }

                    };



                    // Serialize Function for Linear List

                    window.serializeProConfig = (name) => {

                        const actions = [];

                        const list = document.getElementById(`pro_actions_${name}`);

                        if (!list) return { actions: [] };



                        list.querySelectorAll('.gm-pro-action-block').forEach(block => {

                            const type = block.dataset.type;

                            const body = block.querySelector('.gm-pro-action-body');



                            if (type === 'filter') {

                                const col = body.querySelector('.pro-col').value.trim();

                                if (col) {

                                    actions.push({

                                        type: 'filter',

                                        column: col,

                                        operator: body.querySelector('.pro-op').value,

                                        value: body.querySelector('.pro-val').value

                                    });

                                }

                            } else if (type === 'window') {

                                const alias = body.querySelector('.pro-win-alias').value.trim();

                                if (alias) {

                                    const windowAction = {

                                        type: 'window',

                                        wf_type: body.querySelector('.pro-win-type').value,

                                        alias: alias,

                                        partition_by: body.querySelector('.pro-win-part').value.trim(),

                                        order_by: body.querySelector('.pro-win-order').value.trim(),

                                        direction: body.querySelector('.pro-win-dir').value

                                    };

                                    // Checkbox filtre - include_values

                                    const checkboxContainer = body.querySelector('.pro-value-filter-list');

                                    if (checkboxContainer) {

                                        const checkedValues = [];

                                        checkboxContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {

                                            checkedValues.push(cb.value);

                                        });

                                        if (checkedValues.length > 0) {

                                            windowAction.include_values = checkedValues;

                                        }

                                    }

                                    actions.push(windowAction);

                                }

                            } else if (type === 'computed') {

                                const name = body.querySelector('.pro-comp-name').value.trim();

                                if (name) {

                                    const ctype = body.querySelector('.pro-comp-type').value;

                                    if (ctype === 'arithmetic') {

                                        actions.push({

                                            type: 'computed',

                                            name: name,

                                            ctype: 'arithmetic',

                                            columns: body.querySelector('.pro-comp-cols').value.split(',').map(c => c.trim()),

                                            operation: body.querySelector('.pro-comp-op').value

                                        });

                                    } else if (ctype === 'concat') {

                                        actions.push({

                                            type: 'computed',

                                            name: name,

                                            ctype: 'concat',

                                            columns: body.querySelector('.pro-comp-cols').value.split(',').map(c => c.trim()),

                                            separator: body.querySelector('.pro-comp-sep')?.value || ' '

                                        });

                                    } else if (ctype === 'if_else') {

                                        // EğER-İSE-DEğİLSE

                                        const condCol = body.querySelector('.pro-cond-col')?.value.trim();

                                        if (condCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'if_else',

                                                condition_column: condCol,

                                                operator: body.querySelector('.pro-cond-op')?.value || '==',

                                                condition_value: body.querySelector('.pro-cond-val')?.value || '',

                                                true_value: body.querySelector('.pro-if-true')?.value || '',

                                                false_value: body.querySelector('.pro-if-false')?.value || ''

                                            });

                                        }

                                    } else if (ctype === 'date_diff') {

                                        // TARİH FARKI

                                        const date1 = body.querySelector('.pro-date-col1')?.value.trim();

                                        const date2 = body.querySelector('.pro-date-col2')?.value.trim();

                                        if (date1 && date2) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'date_diff',

                                                date1_column: date1,

                                                date2_column: date2,

                                                unit: body.querySelector('.pro-date-unit')?.value || 'days'

                                            });

                                        }

                                    } else if (ctype === 'countif') {

                                        // EğERSAY (COUNTIF)

                                        const rangeCol = body.querySelector('.pro-range-col')?.value.trim();

                                        if (rangeCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'countif',

                                                range_column: rangeCol,

                                                operator: body.querySelector('.pro-cond-op')?.value || '==',

                                                criteria: body.querySelector('.pro-cond-val')?.value || ''

                                            });

                                        }

                                    } else if (ctype === 'sumif') {

                                        // EğERTOPLA (SUMIF)

                                        const rangeCol = body.querySelector('.pro-range-col')?.value.trim();

                                        const sumCol = body.querySelector('.pro-sum-col')?.value.trim();

                                        if (rangeCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'sumif',

                                                range_column: rangeCol,

                                                operator: body.querySelector('.pro-cond-op')?.value || '==',

                                                criteria: body.querySelector('.pro-cond-val')?.value || '',

                                                sum_column: sumCol || rangeCol

                                            });

                                        }

                                    } else if (ctype === 'text_transform') {

                                        const sourceCol = body.querySelector('.pro-tt-source')?.value.trim();

                                        const transformType = body.querySelector('.pro-tt-type')?.value || 'remove_parentheses';

                                        const action = {

                                            type: 'computed',

                                            name: name,

                                            ctype: 'text_transform',

                                            source_column: sourceCol,

                                            transform_type: transformType

                                        };

                                        // Ek parametreler

                                        if (transformType === 'first_n_words') {

                                            action.word_count = parseInt(body.querySelector('.pro-tt-n')?.value || '2');

                                        } else if (transformType === 'regex_replace') {

                                            action.pattern = body.querySelector('.pro-tt-pattern')?.value || '';

                                            action.replacement = body.querySelector('.pro-tt-replacement')?.value || '';

                                        }

                                        actions.push(action);

                                    } else if (ctype === 'ytd_sum' || ctype === 'mtd_sum' || ctype === 'yoy_change' || ctype === 'qoq_change') {

                                        // ZAMAN SERİSİ - TIME SERIES

                                        const dateCol = body.querySelector('.pro-ts-date')?.value.trim();

                                        const valueCol = body.querySelector('.pro-ts-value')?.value.trim();

                                        if (dateCol && valueCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: ctype,

                                                date_column: dateCol,

                                                value_column: valueCol

                                            });

                                        }

                                    } else if (ctype === 'date_hierarchy') {

                                        // TARİH HİYERARşİSİ

                                        const dateCol = body.querySelector('.pro-ts-date')?.value.trim();

                                        if (dateCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'date_hierarchy',

                                                date_column: dateCol

                                            });

                                        }

                                    } else if (ctype === 'running_total') {

                                        const valueCol = body.querySelector('.pro-comp-cols')?.value.trim();

                                        const groupCol = body.querySelector('.pro-comp-group')?.value.trim();

                                        if (valueCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'running_total',

                                                value_column: valueCol,

                                                group_column: groupCol || null

                                            });

                                        }

                                    } else if (ctype === 'moving_avg') {

                                        const valueCol = body.querySelector('.pro-comp-cols')?.value.trim();

                                        const windowSize = body.querySelector('.pro-comp-window')?.value || 3;

                                        if (valueCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'moving_avg',

                                                value_column: valueCol,

                                                window_size: parseInt(windowSize)

                                            });

                                        }

                                    } else if (ctype === 'growth_rate' || ctype === 'percentile_rank' || ctype === 'z_score') {

                                        const valueCol = body.querySelector('.pro-comp-cols')?.value.trim();

                                        if (valueCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: ctype,

                                                value_column: valueCol

                                            });

                                        }

                                    } else if (ctype === 'age' || ctype === 'weekday') {

                                        const dateCol = body.querySelector('.pro-comp-cols')?.value.trim();

                                        if (dateCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: ctype,

                                                date_column: dateCol

                                            });

                                        }

                                    } else if (ctype === 'split') {

                                        const sourceCol = body.querySelector('.pro-comp-cols')?.value.trim();

                                        const separator = body.querySelector('.pro-comp-sep')?.value || ',';

                                        const index = body.querySelector('.pro-comp-index')?.value || 0;

                                        if (sourceCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'split',

                                                source_column: sourceCol,

                                                separator: separator,

                                                index: parseInt(index)

                                            });

                                        }

                                    } else if (ctype === 'normalize_turkish' || ctype === 'extract_numbers' || ctype === 'duplicate_flag' || ctype === 'missing_flag') {

                                        const checkCol = body.querySelector('.pro-comp-cols')?.value.trim();

                                        if (checkCol) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: ctype,

                                                check_column: checkCol

                                            });

                                        }

                                    } else if (ctype === 'business_days') {

                                        const date1 = body.querySelector('.pro-date-col1')?.value.trim();

                                        const date2 = body.querySelector('.pro-date-col2')?.value.trim();

                                        if (date1 && date2) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'business_days',

                                                date1_column: date1,

                                                date2_column: date2

                                            });

                                        }

                                    } else if (ctype === 'correlation') {

                                        const col1 = body.querySelector('.pro-comp-col1')?.value.trim();

                                        const col2 = body.querySelector('.pro-comp-col2')?.value.trim();

                                        if (col1 && col2) {

                                            actions.push({

                                                type: 'computed',

                                                name: name,

                                                ctype: 'correlation',

                                                column1: col1,

                                                column2: col2

                                            });

                                        }

                                    }

                                }

                            } else if (type === 'grouping') {

                                const grps = body.querySelector('.pro-group-cols').value.split(',').map(s => s.trim()).filter(Boolean);

                                const aggCol = body.querySelector('.pro-agg-col').value.trim();

                                if (grps.length > 0 || aggCol) {

                                    const aggs = {};

                                    if (aggCol) {

                                        aggs[aggCol] = body.querySelector('.pro-agg-func').value;

                                    }

                                    actions.push({

                                        type: 'grouping',

                                        groups: grps,

                                        aggregations: aggs

                                    });

                                }

                            } else if (type === 'sort') {

                                const col = body.querySelector('.pro-sort-col').value.trim();

                                if (col) {

                                    actions.push({

                                        type: 'sort',

                                        column: col,

                                        direction: body.querySelector('.pro-sort-dir').value

                                    });

                                }

                            } else if (type === 'output') {

                                // Slicers - virgülle ayrılmış sütun listesi

                                const slicersInput = body.querySelector('.pro-out-slicers')?.value.trim();

                                const slicers = slicersInput ? slicersInput.split(',').map(s => s.trim()).filter(Boolean) : [];



                                // Column Descriptions - JSON parse

                                let colDescriptions = {};

                                const colDescRaw = body.querySelector('.pro-out-col-desc')?.value.trim();

                                if (colDescRaw) {

                                    try {

                                        colDescriptions = JSON.parse(colDescRaw);

                                    } catch (e) {

                                        console.warn('Sütun açıklamaları JSON parse edilemedi:', e);

                                    }

                                }



                                actions.push({

                                    type: 'output',

                                    output_type: body.querySelector('.pro-out-type').value,

                                    group_by_sheet: body.querySelector('.pro-out-grp-col').value.trim(),

                                    summary_sheet: body.querySelector('.pro-out-summary').checked,

                                    slicers: slicers.length > 0 ? slicers : null,

                                    column_descriptions: Object.keys(colDescriptions).length > 0 ? colDescriptions : null,

                                    // Excel Format Options (YENİ)

                                    freeze_header: body.querySelector('.pro-out-freeze')?.checked ?? true,

                                    auto_fit_columns: body.querySelector('.pro-out-autofit')?.checked ?? true,

                                    header_style: body.querySelector('.pro-out-header-style')?.checked ?? true,

                                    number_format: body.querySelector('.pro-out-numformat')?.value || null

                                });

                            } else if (type === 'merge') {

                                // İKİNCİ DOSYA - BİRLEşTİR (VLOOKUP/JOIN)

                                const leftOn = body.querySelector('.pro-merge-left')?.value.trim();

                                const rightOn = body.querySelector('.pro-merge-right')?.value.trim();

                                if (leftOn && rightOn) {

                                    const useCrosssheet = body.querySelector('.pro-use-crosssheet')?.checked || false;

                                    actions.push({

                                        type: 'merge',

                                        left_on: leftOn,

                                        right_on: rightOn,

                                        how: body.querySelector('.pro-merge-how')?.value || 'left',

                                        use_crosssheet: useCrosssheet,

                                        crosssheet_name: useCrosssheet ? body.querySelector('.pro-crosssheet-select')?.value : null

                                    });

                                }

                            } else if (type === 'union') {

                                // İKİNCİ DOSYA - ALT ALTA EKLE

                                const useCrosssheet = body.querySelector('.pro-use-crosssheet')?.checked || false;

                                actions.push({

                                    type: 'union',

                                    ignore_index: true,

                                    use_crosssheet: useCrosssheet,

                                    crosssheet_name: useCrosssheet ? body.querySelector('.pro-crosssheet-select')?.value : null

                                });

                            } else if (type === 'diff') {

                                // İKİNCİ DOSYA - FARK BUL

                                const leftOn = body.querySelector('.pro-diff-left')?.value.trim();

                                const rightOn = body.querySelector('.pro-diff-right')?.value.trim();

                                if (leftOn && rightOn) {

                                    const useCrosssheet = body.querySelector('.pro-use-crosssheet')?.checked || false;

                                    actions.push({

                                        type: 'diff',

                                        left_on: leftOn,

                                        right_on: rightOn,

                                        use_crosssheet: useCrosssheet,

                                        crosssheet_name: useCrosssheet ? body.querySelector('.pro-crosssheet-select')?.value : null

                                    });

                                }

                            } else if (type === 'validate') {

                                // İKİNCİ DOSYA - DOğRULA

                                const leftOn = body.querySelector('.pro-val-left')?.value.trim();

                                const rightOn = body.querySelector('.pro-val-right')?.value.trim();

                                if (leftOn && rightOn) {

                                    const useCrosssheet = body.querySelector('.pro-use-crosssheet')?.checked || false;

                                    actions.push({

                                        type: 'validate',

                                        left_on: leftOn,

                                        right_on: rightOn,

                                        result_column: body.querySelector('.pro-val-result')?.value.trim() || 'Doğrulama',

                                        use_crosssheet: useCrosssheet,

                                        crosssheet_name: useCrosssheet ? body.querySelector('.pro-crosssheet-select')?.value : null

                                    });

                                }

                            } else if (type === 'conditional_format') {

                                // KOşULLU BİçİMLENDİRME

                                const col = body.querySelector('.pro-cf-col')?.value.trim();

                                if (col) {

                                    const cfType = body.querySelector('.pro-cf-type')?.value || 'color_scale';

                                    const cfAction = {

                                        type: 'conditional_format',

                                        column: col,

                                        cf_type: cfType,

                                        min_color: body.querySelector('.pro-cf-min-color')?.value || '#F8696B',

                                        max_color: body.querySelector('.pro-cf-max-color')?.value || '#63BE7B'

                                    };

                                    // 3 renk skalası için mid_color ekle

                                    if (cfType === 'color_scale') {

                                        cfAction.mid_color = body.querySelector('.pro-cf-mid-color')?.value || '#FFEB84';

                                    }

                                    // Eşik değer veya N değeri

                                    if (['threshold', 'top_n', 'bottom_n'].includes(cfType)) {

                                        cfAction.threshold = parseInt(body.querySelector('.pro-cf-threshold')?.value || '10');

                                        cfAction.n = cfAction.threshold; // Alias

                                    }

                                    // text_contains için aranacak metin (YENİ)

                                    if (cfType === 'text_contains') {

                                        cfAction.text = body.querySelector('.pro-cf-text')?.value || '';

                                    }

                                    actions.push(cfAction);

                                }

                            } else if (type === 'chart') {

                                // GRAFİK

                                const xCol = body.querySelector('.pro-chart-x')?.value.trim();

                                const yCol = body.querySelector('.pro-chart-y')?.value.trim();

                                if (xCol || yCol) {

                                    actions.push({

                                        type: 'chart',

                                        chart_type: body.querySelector('.pro-chart-type')?.value || 'column',

                                        x_column: xCol,

                                        y_columns: yCol ? [yCol] : [],

                                        title: body.querySelector('.pro-chart-title')?.value.trim() || ''

                                    });

                                }

                            } else if (type === 'pivot') {

                                // PİVOT TABLO (GELİşTİRİLMİş)

                                const rows = body.querySelector('.pro-pivot-rows')?.value.trim();

                                if (rows) {

                                    const alias = body.querySelector('.pro-pivot-alias')?.value.trim();

                                    const percentType = body.querySelector('.pro-pivot-percent')?.value || '';

                                    actions.push({

                                        type: 'pivot',

                                        rows: rows.split(',').map(s => s.trim()).filter(Boolean),

                                        columns: body.querySelector('.pro-pivot-cols')?.value.split(',').map(s => s.trim()).filter(Boolean) || [],

                                        values: [{

                                            column: body.querySelector('.pro-pivot-values')?.value.trim(),

                                            aggfunc: body.querySelector('.pro-pivot-func')?.value || 'sum',

                                            alias: alias || undefined  // Alias varsa ekle

                                        }],

                                        show_totals: body.querySelector('.pro-pivot-totals')?.checked ?? true,

                                        show_subtotals: body.querySelector('.pro-pivot-subtotals')?.checked ?? false,

                                        percent_type: percentType || undefined  // "row", "column", "total" veya undefined

                                    });

                                }

                            } else if (type === 'variable') {

                                // WHAT-IF DEğİşKENİ

                                const varName = body.querySelector('.pro-var-name')?.value.trim();

                                const varValue = body.querySelector('.pro-var-value')?.value;

                                if (varName && varValue !== '') {

                                    actions.push({

                                        type: 'variable',

                                        name: varName,

                                        value: parseFloat(varValue) || 0

                                    });

                                }

                            }

                        });



                        return { actions: actions };

                    };

                }

            }

            else {

                // PARAMETRE KONTROLLERİ (Gelişmiş)

                const pName = p.name.toLowerCase();

                const pLabel = (lbl || "").toLowerCase();

                const isFileInput = pName.includes('file') || pName.includes('table') || pName.includes('df') || pName.includes('list') || pLabel.includes('dosya') || pLabel.includes('list');

                const isSecondFileParam = pName.includes('second') || pName.includes('lookup') || pName.includes('reference') || pName.includes('join') || pName.includes('comparison');

                const scenarioNeedsSecondFile = SCENARIO_LIST.find(s => s.id === scenarioId)?.requiresSecondFile;



                // 1. Eğer parametre bir dosya yükleme inputu (lookup_df vb.) VE senaryo 2. dosya istiyorsa -> GİZLE

                // çünkü kullanıcı bunu yukarıdaki Inline UI veya Sol Panelden yapacak.

                if (scenarioNeedsSecondFile && (pName === 'lookup_df' || (p.type === 'dynamic_list' && pLabel.includes('dosya')) || (pName === 'reference_list' && !pLabel.includes('değer')))) {

                    // Gizli input oluştur (Gerekiyorsa değer taşımak için, ama runScenario zaten file2 kullanıyor)

                    // Sadece ekrana basma.

                    return;

                }



                // 3. Conditional Column Datalist Assignment

                // First check explicit column_source property from catalog

                let listId = null;



                if (p.column_source === 'primary') {

                    // Ana dosya sütunları (colOptions)

                    listId = 'colOptions';

                } else if (p.column_source === 'secondary') {

                    // İkinci dosya / cross-sheet sütunları (file2-columns)

                    listId = 'file2-columns';

                } else {

                    // Fallback: Use heuristic logic for backward compatibility

                    // Only show column suggestions if the parameter name implies it requires a column.

                    const colKeywords = ['column', 'col', 'sütun', 'key', 'anahtar', 'field', 'alan', 'target', 'source', 'hedef', 'kaynak', 'rows', 'satırlar', 'group', 'grup', 'date', 'tarih'];

                    const excludeKeywords = ['value', 'değer', 'limit', 'threshold', 'eşik', 'count', 'sayı', 'name', 'isim', 'title', 'başlık', 'separator', 'ayraç'];



                    let shouldShowCols = false;

                    if (colKeywords.some(kw => pName.includes(kw))) shouldShowCols = true;

                    if (excludeKeywords.some(kw => pName.includes(kw))) shouldShowCols = false;



                    // FIX: 'value_column' should be a column selector despite having 'value' in name

                    if (pName.includes('value_column') || pName.includes('değer_sütunu') || pName.includes('value_columns') || pName === 'values' || pName === 'columns') {

                        shouldShowCols = true;

                    }



                    if (scenarioNeedsSecondFile && isSecondFileParam) {

                        if (pName.includes('lookup') || pName.includes('return') || pName.includes('target') || pName.includes('reference') || pName.includes('key') || pName.includes('right_on')) {

                            listId = 'file2-columns';

                        } else {

                            listId = 'colOptions';

                        }

                    } else if (shouldShowCols) {

                        listId = 'colOptions';

                    }

                }



                // --- PRO STYLE COLUMN SELECTOR INTEGRATION ---

                // 3. Özel Durum: Hedef Sütun / Yeni Sütun Adı (Manuel giriş ama şık stil)

                if (p.name === 'target_column' || p.name === 'result_column' || p.name === 'new_column_name') {

                    const inp = document.createElement("input");

                    inp.type = "text";

                    inp.name = p.name;

                    inp.placeholder = ph || (CURRENT_LANG === 'tr' ? 'Yeni Sütun Adı...' : 'New Column Name...');

                    // .vb-select sınıfını ekleyerek dropdown gibi görünmesini sağlıyoruz

                    inp.className = "vb-select";

                    inp.style.width = "100%";

                    // Normal input border/bg stillerini ezip vb-select stilini alması için

                    inp.style.border = "1px solid var(--gm-card-border, #444)";

                    inp.style.backgroundColor = "var(--gm-card-bg, #222)";

                    inp.style.color = "var(--gm-text, #eee)";



                    if (p.required === true) inp.required = true;



                    // Hafif focus efekti

                    inp.onfocus = function () { this.style.borderColor = "var(--gm-primary, #4a90d9)"; };

                    inp.onblur = function () { this.style.borderColor = "var(--gm-card-border, #444)"; };



                    row.appendChild(inp);

                    form.appendChild(row);

                    return; // Diğer koşullara girmesin

                }



                // 4. Varsayılan: Liste Bazlı Seçim (ProColumnSelector) veya Normal Input

                // listId yukarıda keyword analizi ile belirlenmişti. Onu kullanıyoruz.



                if (listId === 'colOptions' || listId === 'file2-columns') {

                    // Sütun listesini belirle

                    const columns = (listId === 'colOptions')

                        ? (typeof FILE_COLUMNS !== 'undefined' ? FILE_COLUMNS : [])

                        : (typeof FILE2_COLUMNS !== 'undefined' ? FILE2_COLUMNS : []);



                    // column_source attribute for dynamic updates

                    const columnSource = p.column_source || (listId === 'file2-columns' ? 'secondary' : 'primary');



                    if (typeof ProColumnSelector !== 'undefined') {

                        const proHtml = ProColumnSelector.render(p.name, p.default || "", columns, "", p.multiple || false);

                        const tempDiv = document.createElement('div');

                        tempDiv.innerHTML = proHtml;

                        const widget = tempDiv.firstElementChild;

                        widget.style.margin = "0";

                        widget.style.padding = "0";

                        widget.style.border = "none";

                        widget.setAttribute('data-column-source', columnSource);

                        const internalLabel = widget.querySelector('label');

                        if (internalLabel) internalLabel.style.display = 'none';



                        row.appendChild(widget);



                        if (p.required === true) {

                            const hiddenInput = widget.querySelector(`input[name="${p.name}"]`);

                            if (hiddenInput) hiddenInput.required = true;

                        }

                    } else {

                        const inp = document.createElement("input");

                        inp.type = "text";

                        inp.name = p.name;

                        inp.placeholder = ph;

                        inp.setAttribute('list', listId);

                        inp.setAttribute('data-column-source', columnSource);

                        if (p.required === true) inp.required = true;

                        row.appendChild(inp);

                    }

                } else {

                    const inp = document.createElement("input");

                    inp.type = "text";

                    inp.name = p.name;

                    inp.placeholder = ph;

                    if (p.required === true) inp.required = true;

                    row.appendChild(inp);

                }

            }

            targetContainer.appendChild(row);
        };

        // Render CORE params to form
        coreParams.forEach(p => renderParamRow(p, form));

        // Render ADVANCED params to accordion (if any)
        if (advancedParams.length > 0 && advancedContent) {
            advancedParams.forEach(p => renderParamRow(p, advancedContent));
            form.appendChild(advancedSection);
        }



        // ============================================================================


        // OPTIONAL FEATURES SECTION - Create dynamically and add to form

        // ============================================================================



        if (scenarioId !== 'custom-report-builder' && scenarioId !== 'custom-report-builder-pro') {

            const scenario = SCENARIO_LIST.find(s => s.id === scenarioId);

            const T = EXTRA_TEXTS[CURRENT_LANG]; // CRITICAL FIX: T was undefined!



            // DEBUG

            console.log('🔍 Optional Features Debug:', {

                scenarioId,

                scenarioFound: !!scenario,

                availableOptions: scenario?.available_options,

                LOADED_OPTIONS: window.LOADED_OPTIONS

            });



            if (scenario && scenario.available_options && scenario.available_options.length > 0) {

                // CREATE optional features section dynamically

                const optSection = document.createElement('div');

                optSection.id = 'optionalFeaturesSection';

                optSection.style.cssText = 'margin-top: 5px; padding: 5px; border: 1px solid var(--gm-border-light); border-radius: 8px; background: rgba(255,255,255,0.02); transition: all 0.3s ease;';



                // Buttons container (title & warning created by renderOptionalFeatureButtons)

                const btnContainer = document.createElement('div');

                btnContainer.id = 'optionalButtonsContainer';

                btnContainer.style.marginBottom = '0'; // Maximum compact - no bottom margin

                optSection.appendChild(btnContainer);



                // Added options container

                const addedContainer = document.createElement('div');

                addedContainer.id = 'added-options';

                addedContainer.style.cssText = 'margin-top: 10px; margin-bottom: 30px; display: flex; flex-direction: column; gap: 0px; transition: all 0.3s ease;'; // VERTICAL LAYOUT with increased spacing



                optSection.appendChild(addedContainer);



                // ADD TO FORM (before submit button!)

                form.appendChild(optSection);



                // Render buttons

                if (typeof window.renderOptionalFeatureButtons === 'function') {

                    if (window.LOADED_OPTIONS) {

                        window.renderOptionalFeatureButtons(scenario.available_options, btnContainer);

                    } else {

                        // Load global options first, then render

                        if (typeof window.loadGlobalOptions === 'function') {

                            window.loadGlobalOptions().then(() => {

                                window.renderOptionalFeatureButtons(scenario.available_options, btnContainer);

                            }).catch(err => {

                                console.error('Failed to load global options:', err);

                            });

                        }

                    }

                }

            }

        }



        // ============================================================================



        // FAZ 2.2: Buton container (çalıştır + Önizleme)

        const btnContainer = document.createElement("div");

        btnContainer.style.cssText = "display: flex; gap: 12px; margin-top: 10px;";



        // çalıştır butonu

        const btn = document.createElement("button");

        btn.type = "submit";

        btn.className = "gm-gradient-btn";

        btn.textContent = EXTRA_TEXTS[CURRENT_LANG].run_btn;

        btn.style.flex = "1";

        btnContainer.appendChild(btn);



        // FAZ 2.2: Önizleme butonu

        const previewBtn = document.createElement("button");

        previewBtn.type = "button";

        previewBtn.className = "preview-btn";

        previewBtn.innerHTML = `<i class="fas fa-eye"></i> ${CURRENT_LANG === 'tr' ? 'Önizleme' : 'Preview'}`;

        previewBtn.title = CURRENT_LANG === 'tr' ? 'İlk 100 satırı önizle (Excel oluşturmadan)' : 'Preview first 100 rows (without Excel generation)';

        previewBtn.onclick = (e) => {

            e.preventDefault();

            if (typeof window.previewScenario === 'function') {

                window.previewScenario(scenarioId);

            } else {

                console.error('previewScenario function not found');

                if (typeof showToast === 'function') {

                    showToast('Önizleme fonksiyonu bulunamadı', 'error', 3000);

                }

            }

        };

        btnContainer.appendChild(previewBtn);



        form.appendChild(btnContainer);

        container.appendChild(form);

    } catch (err) {

        console.error("Form Render Error:", err);

        container.innerHTML = `<div class="gm-info-box" style="border-left-color:#ef4444; background:rgba(239,68,68,0.1);">

            <i class="fas fa-bug" style="color:#ef4444"></i> <strong>Form Hatası:</strong> ${err.message}<br>

            <small style="opacity:0.8;">Lütfen sayfayı yenileyip tekrar deneyin.</small>

        </div>`;

    }

}



// SONUç GÖSTERME FONKSİYONU (Dil değişimi için ayrıldı)

function renderScenarioResult(data) {

    const mdDiv = document.getElementById("markdownResult");

    const jsonPre = document.getElementById("resultJson");

    const statusDiv = document.getElementById("statusMessage");

    const dlPlaceholder = document.getElementById("downloadExcelPlaceholder");

    const scenarioId = ACTIVE_SCENARIO_ID;



    mdDiv.style.display = "none";

    jsonPre.style.display = "none";

    dlPlaceholder.innerHTML = "";

    mdDiv.innerHTML = ""; // İçeriği sıfırla

    if (statusDiv) statusDiv.textContent = "";



    const T = EXTRA_TEXTS[CURRENT_LANG];



    // 1. ÖZET (EN ğSTTE) - Başlık + Tek Satır Format

    const rawSummary = data.markdown_result || data.summary;

    if (rawSummary && typeof marked !== 'undefined') {

        // Özet Container

        const summarySection = document.createElement("div");

        summarySection.style.marginBottom = "20px";

        summarySection.style.padding = "15px";

        summarySection.style.background = "rgba(255, 255, 255, 0.03)";

        summarySection.style.border = "1px solid var(--gm-card-border)";

        summarySection.style.borderRadius = "8px";



        // Özet Başlığı - Flexbox ile buton için yer açıldı

        const summaryHeader = document.createElement("div");

        summaryHeader.style.cssText = `

            display: flex;

            justify-content: space-between;

            align-items: center;

            margin-bottom: 12px;

        `;



        const summaryTitle = document.createElement("h5");

        summaryTitle.className = "gm-result-section-header";

        summaryTitle.style.margin = "0";

        summaryTitle.innerHTML = `<i class="fas fa-check-circle"></i> <span data-i18n="result_summary">${CURRENT_LANG === 'en' ? 'Result Summary' : 'Sonuç Özeti'}</span>`;



        // YENİ SENARYO BUTONU (ğstte, Kompakt, Başlangıçta Gizli)

        const newScenarioBtn = document.createElement("button");

        newScenarioBtn.id = "newScenarioBtn";

        newScenarioBtn.className = "gm-gradient-btn";

        newScenarioBtn.style.cssText = `

            padding: 6px 14px;

            font-size: 0.85rem;

            display: inline-flex;

            align-items: center;

            gap: 6px;

        `;

        newScenarioBtn.innerHTML = `<i class="fas fa-redo-alt"></i> ${CURRENT_LANG === 'en' ? 'New Scenario' : 'Yeni Senaryo'}`;



        // Tıklama eventi - Sayfa yenileme (F5 gibi)

        newScenarioBtn.onclick = () => {

            window.location.reload();

        };



        summaryHeader.appendChild(summaryTitle);

        summaryHeader.appendChild(newScenarioBtn);

        summarySection.appendChild(summaryHeader);



        // Özet İçeriği (Tek Satır - Pipe Separator)

        const mdContent = document.createElement("div");

        mdContent.className = "gm-markdown-content gm-summary-inline";

        mdContent.style.display = "flex";

        mdContent.style.flexWrap = "wrap";

        mdContent.style.gap = "8px";

        mdContent.style.alignItems = "center";



        // Localization Helper

        let finalMd = rawSummary;

        if (CURRENT_LANG === 'en') {

            const map = {

                "Girdi Satır Sayısı": "Input Rows",

                "Sonuç Satır Sayısı": "Output Rows",

                "Sonuç Sütun Sayısı": "Output Columns",

                "Yapılan İşlemler": "Actions Performed",

                "adım uygulandı": "steps applied",

                "Analiz Edilen Sütun": "Analyzed Column",

                "Benzersiz Değerler": "Unique Values",

                "En Sık Geçen Değer": "Most Frequent Value",

                "Toplam Satır": "Total Rows",

                // Basic Stats Translation

                "Sayım (Adet)": "Count",

                "Ortalama": "Mean",

                "Standart Sapma": "Std Dev",

                "En Küçük (Min)": "Min",

                "En Büyük (Max)": "Max",

                "Medyan (50%)": "Median",

                "25% (Q1)": "25% (Q1)",

                "75% (Q3)": "75% (Q3)",

                "Varyans": "Variance"

            };

            Object.keys(map).forEach(trKey => {

                finalMd = finalMd.split(trKey).join(map[trKey]);

            });

        }



        // Single line formatting: Convert list items to pipe-separated inline

        // Remove markdown list formatting and join with pipe

        const items = finalMd.replace(/^[-*]\s*/gm, '').split('\n').filter(line => line.trim());

        items.forEach((item, idx) => {

            const span = document.createElement("span");

            span.innerHTML = marked.parseInline(item.trim());

            mdContent.appendChild(span);

            // Add separator except for last item

            if (idx < items.length - 1) {

                const sep = document.createElement("span");

                sep.style.color = "var(--gm-text-muted)";

                sep.style.fontWeight = "300";

                sep.textContent = " | ";

                mdContent.appendChild(sep);

            }

        });



        summarySection.appendChild(mdContent);

        mdDiv.appendChild(summarySection);

        mdDiv.style.display = "block";

    }



    // 2. DOWNLOAD ALANI

    if (data.excel_available) {

        const dlContainer = document.createElement("div");

        dlContainer.style.marginBottom = "25px";

        dlContainer.style.padding = "15px";

        dlContainer.style.background = "rgba(255, 255, 255, 0.03)";

        dlContainer.style.border = "1px solid var(--gm-card-border)";

        dlContainer.style.borderRadius = "8px";



        const dlTitle = document.createElement("h5");

        dlTitle.className = "gm-result-section-header";

        const dlTitleText = CURRENT_LANG === 'en' ? 'Download and Share Results' : 'Sonuç Dosyasını İndir ve Paylaş';

        dlTitle.innerHTML = `<i class="fas fa-download"></i> <span data-i18n="download_share_title">${dlTitleText}</span>`;

        dlContainer.appendChild(dlTitle);



        // Format Buttons Row (Horizontal, Compact)

        const formatRow = document.createElement("div");

        formatRow.style.display = "flex";

        formatRow.style.gap = "10px";

        formatRow.style.flexWrap = "wrap";



        // Create Format Button Group (Icon + Label + Download + Share)

        const createFormatGroup = (format, icon, label, color) => {

            const group = document.createElement("div");

            group.style.display = "flex";

            group.style.alignItems = "center";

            group.style.gap = "8px";

            group.style.padding = "8px 12px";

            group.style.background = "var(--gm-bg)";

            group.style.border = "1px solid var(--gm-card-border)";

            group.style.borderRadius = "8px";

            group.style.minWidth = "220px";

            group.style.flex = "1";



            // Icon + Label (side by side)

            const labelSpan = document.createElement("span");

            labelSpan.style.display = "flex";

            labelSpan.style.alignItems = "center";

            labelSpan.style.gap = "6px";

            labelSpan.style.fontWeight = "600";

            labelSpan.style.minWidth = "60px";

            labelSpan.innerHTML = `<i class="fas ${icon}" style="color:${color};"></i> ${label}`;

            group.appendChild(labelSpan);



            // Buttons Container

            const btns = document.createElement("div");

            btns.style.display = "flex";

            btns.style.gap = "6px";

            btns.style.marginLeft = "auto";



            // Download Button (gm-pill-btn style - Siteyi Tavsiye Et ile aynı)

            const dlBtn = document.createElement("button");

            dlBtn.className = "gm-pill-btn";

            dlBtn.innerHTML = `<i class="fas fa-download"></i> ${CURRENT_LANG === 'en' ? 'Download' : 'İndir'}`;

            dlBtn.onclick = async () => {

                const originalHtml = dlBtn.innerHTML;

                dlBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

                dlBtn.disabled = true;

                try {

                    const res = await fetch(`${BACKEND_BASE_URL}/download/${scenarioId}?format=${format}`);

                    if (!res.ok) { const errJson = await res.json(); throw new Error(errJson.detail || `Hata: ${res.status}`); }

                    const blob = await res.blob();

                    const blobUrl = window.URL.createObjectURL(blob);

                    const a = document.createElement("a");

                    a.href = blobUrl;

                    const contentDisp = res.headers.get("Content-Disposition") || "";

                    const filenameMatch = contentDisp.match(/filename="?([^"]+)"?/);

                    a.download = filenameMatch ? filenameMatch[1] : `opradox_result.${format}`;

                    document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(blobUrl);

                    dlBtn.innerHTML = `<i class="fas fa-check"></i>`;

                    setTimeout(() => { dlBtn.innerHTML = originalHtml; }, 1500);

                } catch (err) {

                    alert(`İndirme Hatası: ${err.message}`);

                    dlBtn.innerHTML = originalHtml;

                } finally {

                    dlBtn.disabled = false;

                }

            };



            // Share Button with Dropdown

            const shareContainer = document.createElement("div");

            shareContainer.style.position = "relative";



            const shareBtn = document.createElement("button");

            shareBtn.className = "gm-pill-btn";

            shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> ${CURRENT_LANG === 'en' ? 'Share' : 'Paylaş'}`;



            // Dropdown Menu

            const dropdown = document.createElement("div");

            dropdown.style.display = "none";

            dropdown.style.position = "absolute";

            dropdown.style.top = "100%";

            dropdown.style.right = "0";

            dropdown.style.marginTop = "5px";

            dropdown.style.background = "var(--gm-card-bg)";

            dropdown.style.border = "1px solid var(--gm-card-border)";

            dropdown.style.borderRadius = "8px";

            dropdown.style.padding = "8px";

            dropdown.style.zIndex = "1000";

            dropdown.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

            dropdown.style.minWidth = "160px";



            let shareUrl = '';

            let shareText = '';



            shareBtn.onclick = async () => {

                // First create share link

                if (!shareUrl) {

                    shareBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

                    try {

                        const res = await fetch(`${BACKEND_BASE_URL}/share/${scenarioId}?format=${format}`, { method: 'POST' });

                        if (!res.ok) throw new Error('Link oluşturulamadı');

                        const shareData = await res.json();

                        shareUrl = `${window.location.origin}${shareData.share_url}`;

                        shareText = `­şôè opradox Raporu | ${shareData.filename}\n­şöù ${shareUrl}\nÔÅ░ 24 saat geçerli`;

                        shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> ${CURRENT_LANG === 'en' ? 'Share' : 'Paylaş'}`;

                    } catch (err) {

                        alert(CURRENT_LANG === 'en' ? 'Failed to create share link' : 'Paylaşım linki oluşturulamadı');

                        shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> ${CURRENT_LANG === 'en' ? 'Share' : 'Paylaş'}`;

                        return;

                    }

                }

                // Toggle dropdown

                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';

            };



            // Social/Email buttons in dropdown

            const socials = [

                // Social Media

                { name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366', fn: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank') },

                { name: 'Telegram', icon: 'fab fa-telegram', color: '#0088cc', fn: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank') },

                { name: 'X', icon: 'fab fa-x-twitter', color: '#71767b', fn: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank') },

                { name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F', fn: async () => { await navigator.clipboard.writeText(shareText); alert(CURRENT_LANG === 'en' ? 'Link copied! Paste on Instagram.' : 'Link kopyalandı! Instagram\'a yapıştır.'); window.open('https://instagram.com', '_blank'); } },

                { name: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0077b5', fn: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank') },

                { name: 'N-Sosyal', icon: 'fas fa-n', color: '#8b5cf6', fn: () => window.open('https://nextsosyal.co/', '_blank') },

                { sep: true }, // Separator

                // Email

                { name: 'Gmail', icon: 'fas fa-envelope', color: '#EA4335', fn: () => window.open(`https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(shareText)}`, '_blank') },

                { name: 'Outlook', icon: 'fab fa-microsoft', color: '#0078D4', fn: () => window.open(`https://outlook.live.com/mail/0/deeplink/compose?body=${encodeURIComponent(shareText)}`, '_blank') },

                { sep: true }, // Separator

                // Copy

                { name: CURRENT_LANG === 'en' ? 'Copy Link' : 'Linki Kopyala', icon: 'fas fa-copy', color: 'var(--gm-text)', fn: async () => { await navigator.clipboard.writeText(shareText); alert(CURRENT_LANG === 'en' ? 'Copied!' : 'Kopyalandı!'); } }

            ];



            socials.forEach(s => {

                // Separator

                if (s.sep) {

                    const sep = document.createElement("div");

                    sep.style.height = "1px";

                    sep.style.background = "var(--gm-card-border)";

                    sep.style.margin = "6px 0";

                    dropdown.appendChild(sep);

                    return;

                }

                // Regular item

                const item = document.createElement("div");

                item.style.display = "flex";

                item.style.alignItems = "center";

                item.style.gap = "8px";

                item.style.padding = "8px 10px";

                item.style.cursor = "pointer";

                item.style.borderRadius = "6px";

                item.style.transition = "background 0.2s";

                item.innerHTML = `<i class="${s.icon}" style="color:${s.color}; width:20px;"></i> ${s.name}`;

                item.onmouseover = () => item.style.background = "rgba(255,255,255,0.1)";

                item.onmouseout = () => item.style.background = "transparent";

                item.onclick = () => { s.fn(); dropdown.style.display = 'none'; };

                dropdown.appendChild(item);

            });



            shareContainer.appendChild(shareBtn);

            shareContainer.appendChild(dropdown);



            // Close dropdown when clicking outside

            document.addEventListener('click', (e) => {

                if (!shareContainer.contains(e.target)) dropdown.style.display = 'none';

            });



            btns.appendChild(dlBtn);

            btns.appendChild(shareContainer);

            group.appendChild(btns);

            return group;

        };



        // Add Format Groups

        formatRow.appendChild(createFormatGroup("xlsx", "fa-file-excel", "Excel", "#107c10"));

        formatRow.appendChild(createFormatGroup("csv", "fa-file-csv", "CSV", "#b94e48"));

        formatRow.appendChild(createFormatGroup("json", "fa-file-code", "JSON", "#5b21b6"));



        dlContainer.appendChild(formatRow);



        // 24-Hour Expiry Note

        const expiryNote = document.createElement("div");

        expiryNote.style.marginTop = "10px";

        expiryNote.style.fontSize = "0.75rem";

        expiryNote.style.color = "var(--gm-text-muted)";

        expiryNote.style.fontStyle = "italic";

        expiryNote.innerHTML = CURRENT_LANG === 'en'

            ? 'ÔÅ░ Shared links are valid for 24 hours. After that, the link will expire.'

            : 'ÔÅ░ Paylaşılan linkler 24 saat geçerlidir. Süre sonunda link kullanılamaz hale gelecektir.';

        dlContainer.appendChild(expiryNote);



        mdDiv.appendChild(dlContainer);

    }



    // YENİ: "Yeni Senaryoya Geç" Butonu (Tüm senaryolar için)

    const newScenarioBtn = document.createElement("button");

    newScenarioBtn.id = "newScenarioBtn";

    newScenarioBtn.className = "gm-pill-btn";

    newScenarioBtn.style.cssText = `

        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);

        color: white;

        padding: 12px 24px;

        border: none;

        border-radius: 8px;

        font-weight: 600;

        cursor: pointer;

        margin-top: 20px;

        width: 100%;

        box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);

        transition: all 0.3s;

        font-size: 0.95rem;

    `;

    newScenarioBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${CURRENT_LANG === 'en' ? 'New Scenario' : 'Yeni Senaryoya Geç'}`;



    // Hover efekti

    newScenarioBtn.onmouseover = () => {

        newScenarioBtn.style.transform = 'translateY(-2px)';

        newScenarioBtn.style.boxShadow = '0 6px 12px rgba(99, 102, 241, 0.4)';

    };

    newScenarioBtn.onmouseout = () => {

        newScenarioBtn.style.transform = 'translateY(0)';

        newScenarioBtn.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.3)';

    };



    // Tıklama eventi

    newScenarioBtn.onclick = () => {

        // Form temizle

        const dynamicForm = document.getElementById('dynamicForm');

        if (dynamicForm) dynamicForm.innerHTML = '';



        // Sonuç alanını gizle

        mdDiv.style.display = 'none';

        mdDiv.innerHTML = '';



        // Dosya inputunu sıfırla (opsiyonel)

        const fileInput = document.getElementById('fileInput');

        if (fileInput) {

            fileInput.value = '';

            const selectedFileName = document.getElementById('selectedFileName');

            if (selectedFileName) {

                selectedFileName.textContent = CURRENT_LANG === 'en' ? 'No file selected' : 'Dosya seçilmedi';

            }

            const dropZone = document.getElementById('dropZone');

            if (dropZone) dropZone.style.borderColor = 'var(--gm-card-border)';

        }



        // İkinci dosya inputunu da temizle

        const fileInput2 = document.getElementById('fileInput2');

        if (fileInput2) {

            fileInput2.value = '';

            const selectedFileName2 = document.getElementById('selectedFileName2');

            if (selectedFileName2) {

                selectedFileName2.textContent = CURRENT_LANG === 'en' ? 'No file selected' : 'Dosya seçilmedi';

            }

            const dropZone2 = document.getElementById('dropZone2');

            if (dropZone2) dropZone2.style.borderColor = 'var(--gm-card-border)';

        }



        // Global değişkenleri sıfırla

        ACTIVE_SCENARIO_ID = null;

        FILE_COLUMNS = [];

        FILE2_COLUMNS = [];

        FILE2_NAME = null;



        // Kullanıcıya bilgi

        const msg = CURRENT_LANG === 'en'

            ? '✓ Cleared! You can now select a new scenario from the left menu.'

            : '✓ Temizlendi! Sol menüden yeni bir senaryo seçebilirsiniz.';

        alert(msg);

    };



    // Eski buton kaldırıldı - artık üstte header'da var



    // 3. TEKNİK DETAYLAR

    if (data.technical_details) {

        const detBox = document.createElement("div");

        detBox.className = "gm-code-preview";

        detBox.style.marginTop = "20px";



        // Header

        const detHeader = document.createElement("div");

        detHeader.className = "gm-result-section-header gm-code-header";

        detHeader.style.display = "flex"; detHeader.style.justifyContent = "space-between"; detHeader.style.alignItems = "center";

        const headerLeft = document.createElement("span");

        headerLeft.innerHTML = `<i class="fas fa-terminal"></i> <span data-i18n="code_summary_title">${T.code_summary_title}</span>`;



        // Python Code Priority (PRO vs Standard)

        const pythonCode = data.technical_details.generated_python_code || data.technical_details.python_code || null;

        const textToCopyDefault = pythonCode ? pythonCode.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim() : JSON.stringify(data.technical_details, null, 2);



        // Button Container

        const btnContainer = document.createElement("div");

        btnContainer.style.display = "flex"; btnContainer.style.gap = "8px";



        // Copy Button

        const copyBtn = document.createElement("button");

        copyBtn.className = "gm-copy-btn";

        copyBtn.innerHTML = `<i class="fas fa-copy"></i> ${T.copy_code}`;

        copyBtn.onclick = async () => {

            try { await navigator.clipboard.writeText(textToCopyDefault); copyBtn.innerHTML = `<i class="fas fa-check"></i> ${T.copy_success}`; copyBtn.classList.add("copied"); setTimeout(() => { copyBtn.innerHTML = `<i class="fas fa-copy"></i> ${T.copy_code}`; copyBtn.classList.remove("copied"); }, 2000); } catch (err) { console.error(err); }

        };



        // ========== CODE SHARE DROPDOWN (BIREBIR DOSYA PAYLA FORMATINDA) ==========

        const codeShareContainer = document.createElement("div");

        codeShareContainer.style.position = "relative";



        const codeShareBtn = document.createElement("button");

        codeShareBtn.className = "gm-copy-btn";

        codeShareBtn.innerHTML = `<i class="fas fa-share-alt"></i> ${CURRENT_LANG === 'en' ? 'Share' : 'Paylaş'}`;



        // Dropdown element

        const codeShareDropdown = document.createElement("div");

        codeShareDropdown.style.display = "none";

        codeShareDropdown.style.position = "absolute";

        codeShareDropdown.style.right = "0";

        codeShareDropdown.style.background = "var(--gm-card-bg)";

        codeShareDropdown.style.border = "1px solid var(--gm-card-border)";

        codeShareDropdown.style.borderRadius = "8px";

        codeShareDropdown.style.padding = "8px";

        codeShareDropdown.style.zIndex = "9999";

        codeShareDropdown.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

        codeShareDropdown.style.minWidth = "180px";



        const scTitle = document.getElementById('scenarioTitle')?.textContent?.replace('3. ', '') || 'opradox';

        const codeText = `­şÉı opradox Kod\n\n# ${scTitle}\n\n${textToCopyDefault}\n\n#Python #opradox`;



        // Helper for safe sharing (URL limits)

        const safeShare = (url) => {

            if (url.length > 2000) {

                navigator.clipboard.writeText(codeText).then(() => {

                    alert(CURRENT_LANG === 'en' ? 'Code too long for direct share! Copied to clipboard.' : 'Kod paylaşım için çok uzun! Panoya kopyalandı.');

                });

            } else {

                window.open(url, '_blank');

            }

        };



        // Social/Email buttons in dropdown (TğM ÖğELER - FOTO 2 İKON STİLİ)

        const codeSocials = [

            { name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366', fn: () => safeShare(`https://wa.me/?text=${encodeURIComponent(codeText)}`) },

            { name: 'Telegram', icon: 'fab fa-telegram', color: '#0088cc', fn: () => safeShare(`https://t.me/share/url?text=${encodeURIComponent(codeText)}`) },

            { name: 'X', icon: 'fab fa-x-twitter', color: '#71767b', fn: () => safeShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(codeText.substring(0, 280))}`) },

            { name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F', fn: async () => { await navigator.clipboard.writeText(codeText); alert(CURRENT_LANG === 'en' ? 'Copied! Paste on Instagram.' : 'Kopyalandı! Instagram\'a yapıştır.'); window.open('https://instagram.com', '_blank'); } },

            { name: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0077b5', fn: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank') },

            { name: 'N-Sosyal', icon: 'fas fa-n', color: '#8b5cf6', fn: () => window.open('https://nextsosyal.co/', '_blank') },

            { sep: true },

            { name: 'Gmail', icon: 'fas fa-envelope', color: '#EA4335', fn: () => safeShare(`https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(codeText)}`) },

            { name: 'Outlook', icon: 'fab fa-microsoft', color: '#0078D4', fn: () => safeShare(`https://outlook.live.com/mail/0/deeplink/compose?body=${encodeURIComponent(codeText)}`) },

            { sep: true },

            { name: CURRENT_LANG === 'en' ? 'Save .py' : '.py Kaydet', icon: 'fas fa-download', color: '#10b981', fn: () => { const b = new Blob([textToCopyDefault], { type: 'text/x-python' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'opradox_code.py'; a.click(); URL.revokeObjectURL(u); } },

            { name: 'VS Code', icon: 'fas fa-code', color: '#007ACC', fn: async () => { await navigator.clipboard.writeText(textToCopyDefault); alert(CURRENT_LANG === 'en' ? 'Code copied! Open VS Code → Paste' : 'Kod kopyalandı! VS Code aç → Yapıştır'); } },

            { name: 'Jupyter', icon: 'fas fa-book-open', color: '#F37626', fn: async () => { await navigator.clipboard.writeText(textToCopyDefault); alert(CURRENT_LANG === 'en' ? 'Code copied! Open Jupyter → Paste' : 'Kod kopyalandı! Jupyter aç → Yapıştır'); } },

            { name: 'GitHub Gist', icon: 'fab fa-github', color: '#f0f6fc', fn: () => window.open('https://gist.github.com/', '_blank') },

            { name: 'CodePen', icon: 'fab fa-codepen', color: '#fff', fn: () => window.open('https://codepen.io/pen/', '_blank') }

        ];



        codeSocials.forEach(s => {

            if (s.sep) {

                const sep = document.createElement("div");

                sep.style.height = "1px";

                sep.style.background = "var(--gm-card-border)";

                sep.style.margin = "6px 0";

                codeShareDropdown.appendChild(sep);

                return;

            }

            const item = document.createElement("div");

            item.style.display = "flex";

            item.style.alignItems = "center";

            item.style.gap = "8px";

            item.style.padding = "8px 10px";

            item.style.cursor = "pointer";

            item.style.borderRadius = "6px";

            item.style.transition = "background 0.2s";



            // Icon element ayrı oluştur

            const iconEl = document.createElement("i");

            s.icon.split(" ").forEach(cls => iconEl.classList.add(cls));

            iconEl.style.color = s.color;

            iconEl.style.width = "20px";

            iconEl.style.textAlign = "center";



            // Text element

            const textEl = document.createElement("span");

            textEl.textContent = s.name;



            item.appendChild(iconEl);

            item.appendChild(textEl);



            item.onmouseover = () => item.style.background = "rgba(255,255,255,0.1)";

            item.onmouseout = () => item.style.background = "transparent";

            item.onclick = () => { s.fn(); codeShareDropdown.style.display = 'none'; };

            codeShareDropdown.appendChild(item);

        });



        codeShareContainer.appendChild(codeShareBtn);

        // NOT: Dropdown body'ye eklenmeyecek, container'a kalacak - ama pozisyonu fixed olacak

        document.body.appendChild(codeShareDropdown);



        // Toggle on button click - FIXED pozisyon ile her zaman görünür

        codeShareBtn.onclick = (e) => {

            e.stopPropagation();

            if (codeShareDropdown.style.display === 'none') {

                codeShareDropdown.style.display = 'block';

                codeShareDropdown.style.position = 'fixed';



                // Butonun pozisyonunu al

                const btnRect = codeShareBtn.getBoundingClientRect();

                const dropdownHeight = codeShareDropdown.offsetHeight;

                const spaceBelow = window.innerHeight - btnRect.bottom;



                // Yatay pozisyon - sağa hizala

                codeShareDropdown.style.left = 'auto';

                codeShareDropdown.style.right = (window.innerWidth - btnRect.right) + 'px';



                if (spaceBelow < dropdownHeight + 10) {

                    // Aşağıda yer yok, yukarı aç

                    codeShareDropdown.style.top = (btnRect.top - dropdownHeight - 5) + 'px';

                } else {

                    // Aşağıda yer var, aşağı aç

                    codeShareDropdown.style.top = (btnRect.bottom + 5) + 'px';

                }

            } else {

                codeShareDropdown.style.display = 'none';

            }

        };



        // Close when clicking outside

        document.addEventListener('click', (e) => {

            if (!codeShareContainer.contains(e.target) && !codeShareDropdown.contains(e.target)) {

                codeShareDropdown.style.display = 'none';

            }

        });



        btnContainer.appendChild(copyBtn);

        btnContainer.appendChild(codeShareContainer);

        detHeader.appendChild(headerLeft); detHeader.appendChild(btnContainer); detBox.appendChild(detHeader);



        // Content

        const detContent = document.createElement("div");

        detContent.style.fontSize = "0.85rem"; detContent.style.lineHeight = "1.6";



        if (pythonCode) {

            const codeClean = pythonCode.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim();

            detContent.innerHTML = `<pre class="gm-python-code">${highlightPython(codeClean)}</pre>`;



            // Stats

            if (data.technical_details.stats) {

                const statsDiv = document.createElement("div");

                statsDiv.className = "gm-code-stats"; // CSS handles style

                statsDiv.style.marginTop = "10px"; statsDiv.style.padding = "8px 12px"; statsDiv.style.borderRadius = "6px"; statsDiv.style.fontSize = "0.8rem";



                const statsItems = Object.entries(data.technical_details.stats).map(([k, v]) => {

                    let label = k, value = v;

                    if (CURRENT_LANG === 'en') {

                        const map = {

                            "Girdi Satır Sayısı": "Input Rows", "Sonuç Satır Sayısı": "Output Rows", "Sonuç Sütun Sayısı": "Output Columns",

                            "Yapılan İşlemler": "Actions Performed", "Analiz Edilen Sütun": "Analyzed Column",

                            "Benzersiz Değerler": "Unique Values", "En Sık Geçen Değer": "Most Frequent Value", "Toplam Satır": "Total Rows",

                            "unique_values": "Unique Values", "most_frequent_value": "Most Frequent Value", "total_rows": "Total Rows",

                            "Sayım (Adet)": "Count", "Ortalama": "Mean", "Standart Sapma": "Std Dev", "En Küçük (Min)": "Min",

                            "En Büyük (Max)": "Max", "Medyan (50%)": "Median", "25% (Q1)": "25% (Q1)", "75% (Q3)": "75% (Q3)", "Varyans": "Variance"

                        };

                        label = map[k] || k;

                        if (typeof v === 'number') value = v.toLocaleString('en-US');

                    } else { if (typeof v === 'number') value = v.toLocaleString('tr-TR'); }

                    return `<span class="gm-stat-item"><strong>${label}:</strong> ${value}</span>`;

                }).join(' ÔÇó ');

                statsDiv.innerHTML = `<i class="fas fa-chart-bar"></i> ${statsItems}`;

                detContent.appendChild(statsDiv);

            }

        } else {

            detContent.innerHTML = `<pre style="margin:0; white-space:pre-wrap;">${syntaxHighlight(data.technical_details)}</pre>`;

        }

        detBox.appendChild(detContent); mdDiv.appendChild(detBox);

        mdDiv.style.display = "block";

    }

}



// SENARYO çALIşTIRMA

async function runScenario(scenarioId) {

    const fileInput = document.getElementById("fileInput");

    if (!fileInput.files[0]) { alert(CURRENT_LANG === 'tr' ? "Lütfen dosya yükleyin!" : "Please upload a file!"); return; }



    const formData = new FormData();

    formData.append("file", fileInput.files[0]);



    // YENİ: Sheet parametresini ekle (seçili sayfa)

    if (FILE_SELECTED_SHEET) {

        formData.append("sheet_name", FILE_SELECTED_SHEET);

    }



    // YENİ: Header row parametresini ekle (birleştirilmiş başlıkları atlamak için)

    formData.append("header_row", SELECTED_HEADER_ROW.toString());

    console.log("­şôæ Header row:", SELECTED_HEADER_ROW);



    const fileInput2 = document.getElementById("fileInput2");



    // YENİ: PRO builder inline crosssheet kontrolü

    function getProBuilderCrossSheet() {

        const form = document.getElementById(`form_${scenarioId}`);

        if (!form) return null;

        // Tüm inline cross-sheet checkbox'ları kontrol et

        const checkedWrappers = form.querySelectorAll('.gm-inline-crosssheet-wrapper');

        for (let wrapper of checkedWrappers) {

            const cb = wrapper.querySelector('.pro-use-crosssheet');

            if (cb && cb.checked) {

                const select = wrapper.querySelector('.pro-crosssheet-select');

                if (select && select.value) return { sheet_name: select.value };

            }

        }

        return null;

    }



    const proCrossSheet = getProBuilderCrossSheet();

    const isGlobalCross = isCrossSheetModeActive();



    // Cross-sheet modu kontrolü (global VEYA PRO builder inline)

    if (isGlobalCross || proCrossSheet) {

        // Aynı dosyayı ikinci dosya olarak gönder, farklı sayfa ile

        formData.append("file2", fileInput.files[0]);



        let targetSheet;

        if (proCrossSheet) targetSheet = proCrossSheet.sheet_name;

        else targetSheet = getSelectedCrossSheet();



        console.log(`[DEBUG] runScenario Cross-Sheet Check: GlobalActive=${isGlobalCross}, ProSheet=${proCrossSheet ? proCrossSheet.sheet_name : 'null'}`);



        if (targetSheet) {

            formData.append("sheet_name2", targetSheet);

            console.log("📄 Cross-sheet mode ACTIVE. Sending sheet_name2 =", targetSheet);

        } else {

            console.warn("⚠´©Å Cross-sheet mode active but NO sheet name selected!");

        }

    } else if (fileInput2 && fileInput2.files[0]) {

        // Normal mod: ayrı dosya yükle

        formData.append("file2", fileInput2.files[0]);



        // İkinci dosya için sheet parametresi

        if (FILE2_SELECTED_SHEET) {

            formData.append("sheet_name2", FILE2_SELECTED_SHEET);

        }



        // İkinci dosya için header_row parametresi

        formData.append("header_row2", SELECTED_HEADER_ROW_2.toString());

    }



    const paramsData = {};

    const form = document.getElementById(`form_${scenarioId}`);



    if (form) {

        // Standart inputlar

        form.querySelectorAll("input:not([name*='[]']), select, textarea").forEach(el => {

            // OYUN HAMURU: Builder Serialization

            if (el.type === 'hidden' && document.getElementById(`rows_${el.name}`)) {

                const rowsContainer = document.getElementById(`rows_${el.name}`);

                const rows = rowsContainer.querySelectorAll('.gm-builder-row');

                const config = { filters: [], groups: [], aggregations: [], sorts: [], selects: [] };



                rows.forEach(r => {

                    const type = r.dataset.type;

                    const col = r.querySelector('.row-col')?.value.trim();

                    if (!col) return;



                    if (type === 'filter') {

                        config.filters.push({ column: col, operator: r.querySelector('.row-op').value, value: r.querySelector('.row-val').value });

                    } else if (type === 'group') {

                        config.groups.push(col);

                    } else if (type === 'agg') {

                        config.aggregations.push({ column: col, func: r.querySelector('.row-func').value });

                    } else if (type === 'sort') {

                        config.sorts.push({ column: col, direction: r.querySelector('.row-dir').value });

                    } else if (type === 'select') {

                        config.selects.push(col);

                    }

                });

                el.value = JSON.stringify(config);

            }



            // OYUN HAMURU PRO: Builder Serialization

            // FIX: Only serialize if pro_actions container exists (Linear Builder only, not VisualBuilder)

            if (el.type === 'hidden' && el.id && el.id.startsWith('pro_config_')) {

                const configName = el.name;

                const proActionsContainer = document.getElementById(`pro_actions_${configName}`);

                // Guard: Only override if Linear Builder's action list exists AND serializeProConfig is defined

                if (proActionsContainer && window.serializeProConfig) {

                    el.value = JSON.stringify(window.serializeProConfig(configName));

                }

                // If VisualBuilder already set the value, don't override it

            }



            // JSON Textarea ise parse etmeye çalış

            if (el.tagName === "TEXTAREA" && (el.value.trim().startsWith("[") || el.value.trim().startsWith("{"))) {

                try { paramsData[el.name] = JSON.parse(el.value); } catch (e) { paramsData[el.name] = el.value; }

            } else {

                paramsData[el.name] = el.value;

            }

        });

        // Dynamic List (Array)

        const arrays = {};

        form.querySelectorAll("input[name*='[]']").forEach(el => {

            const key = el.name.replace("[]", "");

            if (!arrays[key]) arrays[key] = [];

            if (el.value) arrays[key].push(el.value);

        });

        Object.assign(paramsData, arrays);

    }



    formData.append("params", JSON.stringify(paramsData));

    const statusDiv = document.getElementById("statusMessage");

    if (statusDiv) {

        statusDiv.style.display = "block";

        statusDiv.innerHTML = `<i class="fas fa-cog fa-spin"></i> ${CURRENT_LANG === 'tr' ? 'İşleniyor...' : 'Processing...'}`;

    }



    try {

        const res = await fetch(`${BACKEND_BASE_URL}/run/${scenarioId}`, { method: "POST", body: formData });

        const data = await res.json();

        if (statusDiv) statusDiv.textContent = ""; // Clear loading

        if (res.ok) {

            // State'i güncelle ve render et

            LAST_RESULT_DATA = data;

            renderScenarioResult(data);



            // FAZ 1.3: Warnings kontrolü - backend'den uyarı gelirse toast göster

            if (data.warnings && data.warnings.length > 0) {

                const warnCount = data.warnings.length;

                const warnMsg = CURRENT_LANG === 'tr'

                    ? `⚠´©Å ${warnCount} adımda uyarı oluştu. Detaylar için konsolu kontrol edin.`

                    : `⚠´©Å ${warnCount} step(s) had warnings. Check console for details.`;

                if (typeof showToast === 'function') {

                    showToast(warnMsg, 'warn', 7000);

                }

                console.warn('Pipeline Warnings:', data.warnings);

            }



            // YENİ: Feedback widget'ı göster

            if (typeof showInlineFeedbackWidget === 'function') {

                showInlineFeedbackWidget(scenarioId);

            }



            // GA4: Senaryo çalıştırma eventi

            if (typeof gtag === 'function') {

                gtag('event', 'scenario_run', {

                    'scenario_id': scenarioId,

                    'status': 'success'

                });

            }

        } else { throw new Error(data.detail); }

    } catch (e) {

        if (statusDiv) statusDiv.textContent = ""; // Clear loading on error

        // alert("Hata: " + e.message);

        if (typeof showToast === 'function') {

            showToast("❌ " + e.message, 'error', 5000);

        } else {

            alert("Hata: " + e.message);

        }

    }

}



// ===== FAZ 2.2: GLOBAL PREVIEW SYSTEM =====

/**

 * Canlı Önizleme - Tüm senaryolar için merkezi önizleme fonksiyonu

 * Backend'e is_preview: true göndererek sadece ilk 100 satırı işler

 */

async function previewScenario(scenarioId) {

    console.log('🔍 previewScenario called with:', scenarioId);



    const fileInput = document.getElementById("fileInput");

    if (!fileInput || !fileInput.files[0]) {

        if (typeof showToast === 'function') {

            showToast(CURRENT_LANG === 'tr' ? "📊 Önce dosya yükleyin" : "📊 Please upload a file first", "warning", 3000);

        }

        return;

    }



    const formData = new FormData();

    formData.append("file", fileInput.files[0]);

    formData.append("header_row", SELECTED_HEADER_ROW.toString());



    // Sheet name - doğru değişken adı

    if (typeof FILE_SELECTED_SHEET !== 'undefined' && FILE_SELECTED_SHEET) {

        formData.append("sheet_name", FILE_SELECTED_SHEET);

    }



    // Tüm form verilerini topla (runScenario ile aynı mantık)

    const paramsData = { is_preview: true };



    // Form ID'yi bul - normal senaryolar için form_scenarioId, PRO için vbSettings olabilir

    let form = document.getElementById(`form_${scenarioId}`);

    if (!form) {

        // Visual Builder için config'i al

        if (typeof VisualBuilder !== 'undefined' && VisualBuilder.exportToJSON) {

            const vbConfig = VisualBuilder.exportToJSON();

            paramsData.config = vbConfig;

            console.log('­şÄ¿ Visual Builder config:', vbConfig);

        }

    } else {

        form.querySelectorAll("input:not([name*='[]']), select, textarea").forEach(el => {

            if (el.name && el.value) {

                paramsData[el.name] = el.value;

            }

        });

    }



    formData.append("params", JSON.stringify(paramsData));

    console.log('📤 Preview params:', paramsData);



    // Preview loading state

    const previewBtn = document.querySelector('.preview-btn');

    if (previewBtn) {

        previewBtn.disabled = true;

        previewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (CURRENT_LANG === 'tr' ? 'Yükleniyor...' : 'Loading...');

    }



    try {

        console.log('­şîÉ Fetching preview from:', `${BACKEND_BASE_URL}/run/${scenarioId}`);

        const res = await fetch(`${BACKEND_BASE_URL}/run/${scenarioId}`, { method: "POST", body: formData });

        const data = await res.json();

        console.log('📤 Preview response:', data);



        if (res.ok && data.preview_data) {

            renderPreviewTable(data.preview_data);

            if (typeof showToast === 'function') {

                showToast(CURRENT_LANG === 'tr' ? '✔ Önizleme hazır' : '✔ Preview ready', 'success', 2000);

            }

        } else if (res.ok) {

            // Normal result but no preview_data - bu senaryo is_preview desteklemiyor olabilir

            console.warn('No preview_data in response. Backend may not support is_preview for this scenario.');

            if (typeof showToast === 'function') {

                showToast(CURRENT_LANG === 'tr' ? 'Bu senaryo önizleme desteklemiyor' : 'This scenario does not support preview', 'warning', 3000);

            }

        } else {

            throw new Error(data.detail || 'Preview failed');

        }

    } catch (e) {

        console.error('Preview error:', e);

        if (typeof showToast === 'function') {

            showToast('❌ ' + e.message, 'error', 5000);

        }

    } finally {

        if (previewBtn) {

            previewBtn.disabled = false;

            previewBtn.innerHTML = '<i class="fas fa-eye"></i> ' + (CURRENT_LANG === 'tr' ? 'Önizleme' : 'Preview');

        }

    }

}



/**

 * Önizleme Tablosu Render - Modal olarak gösterilir

 */

function renderPreviewTable(previewData) {

    console.log('­şôè renderPreviewTable called with:', previewData);



    // Mevcut modal'ı kaldır

    let existing = document.getElementById('previewTableContainer');

    if (existing) existing.remove();



    // Modal overlay oluştur

    const overlay = document.createElement('div');

    overlay.id = 'previewTableContainer';

    overlay.style.cssText = `

        position: fixed;

        top: 0;

        left: 0;

        right: 0;

        bottom: 0;

        background: rgba(0, 0, 0, 0.7);

        z-index: 10000;

        display: flex;

        align-items: center;

        justify-content: center;

        padding: 20px;

    `;



    // ESC ile kapatma

    overlay.onclick = (e) => {

        if (e.target === overlay) overlay.remove();

    };



    const { columns, rows, truncated, row_limit, total_rows } = previewData;



    // Truncation helper

    const truncateCell = (val) => {

        if (val === null || val === undefined) return '';

        const str = String(val);

        return str.length > 50 ? str.substring(0, 47) + '...' : str;

    };



    // Modal içeriği

    const modal = document.createElement('div');

    modal.className = 'gm-preview-container';

    modal.style.cssText = `

        max-width: 95vw;

        max-height: 90vh;

        overflow: hidden;

        display: flex;

        flex-direction: column;

    `;



    modal.innerHTML = `

        <div class="gm-preview-header">

            <h4><i class="fas fa-table"></i> ${CURRENT_LANG === 'tr' ? 'Önizleme' : 'Preview'}</h4>

            <span class="gm-preview-badge">

                ${CURRENT_LANG === 'tr' ? 'Sadece ilk ' + row_limit + ' satır' : 'First ' + row_limit + ' rows only'}

                ${truncated ? ' (' + (CURRENT_LANG === 'tr' ? 'toplam ' : 'total ') + total_rows + ')' : ''}

            </span>

            <button class="gm-preview-close" onclick="document.getElementById('previewTableContainer').remove()">

                <i class="fas fa-times"></i>

            </button>

        </div>

        <div class="gm-preview-note">

            <i class="fas fa-info-circle"></i> 

            ${CURRENT_LANG === 'tr'

            ? 'Not: Rank/Pivot gibi işlemler küçük örneklemde farklı sonuç verebilir.'

            : 'Note: Rank/Pivot operations may yield different results on small samples.'}

        </div>

        <div class="gm-preview-table-wrapper" style="flex: 1; overflow: auto;">

            <table class="gm-preview-table">

                <thead>

                    <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>

                </thead>

                <tbody>

                    ${rows.map(row => `<tr>${columns.map(col => `<td title="${String(row[col] || '')}">${truncateCell(row[col])}</td>`).join('')}</tr>`).join('')}

                </tbody>

            </table>

        </div>

    `;



    overlay.appendChild(modal);

    document.body.appendChild(overlay);



    console.log('✓ Preview modal rendered successfully');

}



// Global erişim için

window.previewScenario = previewScenario;

window.renderPreviewTable = renderPreviewTable;



// Yardımcı: JSON Syntax Highlighting

// Yardımcı: JSON Syntax Highlighting

function syntaxHighlight(json) {

    if (typeof json != 'string') {

        json = JSON.stringify(json, undefined, 2);

    }

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {

        var cls = 'gm-number';

        if (/^"/.test(match)) {

            if (/:$/.test(match)) {

                cls = 'gm-key';

            } else {

                cls = 'gm-string';

            }

        } else if (/true|false/.test(match)) {

            cls = 'gm-boolean';

        } else if (/null/.test(match)) {

            cls = 'gm-null';

        }

        return '<span class="' + cls + '">' + match + '</span>';

    });

}



// Yardımcı: Python Syntax Highlighting - Prism.js Kullanarak

function highlightPython(code) {

    if (!code) return '';



    // Prism.js yüklü mü kontrol et

    if (typeof Prism !== 'undefined' && Prism.languages.python) {

        // Prism.js ile highlight et

        return Prism.highlight(code, Prism.languages.python, 'python');

    }



    // Fallback: Prism yoksa basit HTML escape

    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

}





// KILAVUZ YğKLEME

async function loadScenarioHelp(id) {

    const contentArea = document.getElementById("helpContentArea");

    const template = document.getElementById("helpTemplate").cloneNode(true);

    template.style.display = "block"; template.id = "";



    try {

        const res = await fetch(`${BACKEND_BASE_URL}/ui/help/${id}?lang=${CURRENT_LANG}`);

        const data = await res.json();

        const help = data.help;



        if (help) {

            const suffix = CURRENT_LANG;

            if (typeof marked !== 'undefined') {

                template.querySelector("#scenarioWhatIs").innerHTML = marked.parse(help[`what_is_${suffix}`] || help.what_is_tr || "");

            } else {

                template.querySelector("#scenarioWhatIs").innerHTML = help[`what_is_${suffix}`] || help.what_is_tr || "";

            }

            fillList(template.querySelector("#scenarioHowTo"), help[`how_to_${suffix}`] || help.how_to_tr);

            fillList(template.querySelector("#scenarioExamples"), help[`examples_${suffix}`] || help.examples_tr);



            // Başlıklar

            template.querySelector("h4[data-i18n='help_subtitle_what']").textContent = UI_TEXTS["help_subtitle_what"];

            template.querySelector("h4[data-i18n='help_subtitle_how']").textContent = UI_TEXTS["help_subtitle_how"];

            template.querySelector("h4[data-i18n='help_subtitle_example']").textContent = UI_TEXTS["help_subtitle_example"];



            contentArea.innerHTML = "";

            contentArea.appendChild(template);

        }

    } catch (e) { }

}



function fillList(el, items) {

    el.innerHTML = "";

    if (items && Array.isArray(items)) {

        items.forEach(i => {

            const li = document.createElement("li");

            li.innerHTML = (typeof marked !== 'undefined') ? marked.parse(i) : i;

            el.appendChild(li);

        });

    }

}



// TOPLULUK FONKSİYONLARI

function renderComment(text, user = "Misafir") {

    const list = document.getElementById("commentsList");

    const id = Date.now();

    const item = document.createElement("div");

    item.className = "gm-comment-item";

    const replyTxt = EXTRA_TEXTS[CURRENT_LANG].reply;



    item.innerHTML = `

        <div class="gm-comment-avatar">${user.charAt(0)}</div>

        <div class="gm-comment-content" id="comment-${id}">

            <div class="gm-comment-header"><span>${user}</span> <span>Az önce</span></div>

            <div class="gm-comment-text">${text}</div>

            <div class="gm-comment-actions">

                <button class="gm-emoji-btn" onclick="toggleReaction(this)">­şæı 0</button>

                <button class="gm-emoji-btn" onclick="toggleReaction(this)">­şæÄ 0</button>

                <button class="gm-emoji-btn" onclick="toggleReaction(this)">­şöÑ 0</button>

                <button class="gm-emoji-btn" onclick="toggleReaction(this)">­şİé 0</button>

                <span class="gm-reply-link" onclick="openReplyBox(${id})">${replyTxt}</span>

            </div>

            <div class="gm-nested-replies"></div>

        </div>

    `;

    list.prepend(item);

}



window.toggleReaction = function (el) {

    el.classList.toggle("active");

    let count = parseInt(el.textContent.split(" ")[1]);

    if (el.classList.contains("active")) count++; else count--;

    el.innerHTML = `${el.textContent.split(" ")[0]} ${count}`;

}



window.openReplyBox = function (id) {

    const parent = document.getElementById(`comment-${id}`);

    if (parent.querySelector(".gm-reply-box")) return;



    const div = document.createElement("div");

    div.className = "gm-reply-box";

    div.innerHTML = `

        <input type="text" placeholder="${EXTRA_TEXTS[CURRENT_LANG].reply}..." onkeydown="if(event.key==='Enter') submitReply(this, ${id})">

        <button class="gm-pill-btn" onclick="this.parentElement.remove()" style="padding:2px 8px; font-size:0.7rem;">X</button>

    `;

    parent.appendChild(div);

    div.querySelector("input").focus();

}



window.submitReply = function (input, id) {

    const text = input.value.trim();

    if (!text) return;

    const parent = document.getElementById(`comment-${id}`);

    const repliesContainer = parent.querySelector(".gm-nested-replies");

    const replyDiv = document.createElement("div");

    replyDiv.style.marginTop = "5px"; replyDiv.style.fontSize = "0.85rem";

    replyDiv.innerHTML = `<strong>Misafir:</strong> ${text}`;

    repliesContainer.appendChild(replyDiv);

    input.parentElement.remove();

}



// BIND EVENTS (BUTONLARI BAğLA)

function bindEvents() {

    // 1. Arama

    const searchInput = document.getElementById("scenarioSearch");

    if (searchInput) {

        const searchWrapper = searchInput.parentElement;

        searchInput.addEventListener("input", (e) => {

            const term = e.target.value.toLowerCase();



            // Icon Toggle

            if (term.length > 0) searchWrapper.classList.add("has-text");

            else searchWrapper.classList.remove("has-text");



            const allContents = document.querySelectorAll(".gm-accordion-content");



            if (term === "") {

                allContents.forEach(c => c.classList.remove("open"));

                document.querySelectorAll(".gm-scenario-btn").forEach(b => b.style.display = "block");

                return;

            }

            document.querySelectorAll(".gm-scenario-btn").forEach(btn => {

                const match = btn.textContent.toLowerCase().includes(term);

                btn.style.display = match ? "block" : "none";

                if (match) btn.closest(".gm-accordion-content").classList.add("open");

            });

        });

    }



    // 2. Dosya Seçimi

    document.getElementById("fileInput").addEventListener("change", (e) => {

        if (e.target.files[0]) {

            const fileName = e.target.files[0].name;

            document.getElementById("selectedFileName").textContent = fileName;

            updateUITexts();

            const fileLabel = document.querySelector(".gm-file-label");

            if (fileLabel) fileLabel.style.borderColor = "var(--gm-success)";

            CURRENT_FILE = e.target.files[0]; // YENİ: Dosya referansını kaydet

            inspectFile(e.target.files[0]); // Inspect columns



            // Excel Studio V2: Create file tab in file bar

            if (typeof createFileTab === 'function') {

                createFileTab(fileName, 1);

            }

        }

    });

    const f2 = document.getElementById("fileInput2");

    if (f2) {

        f2.addEventListener("change", (e) => {

            console.log("­şôé File2 change event triggered:", e.target.files.length, "files");

            if (e.target.files[0]) {

                FILE2_NAME = e.target.files[0].name; // Global değişkeni güncelle

                console.log("✔ File2 selected:", FILE2_NAME);

                document.getElementById("selectedFileName2").textContent = FILE2_NAME;

                document.getElementById("dropZone2").style.borderColor = "var(--gm-success)";

                CURRENT_FILE2 = e.target.files[0]; // İkinci dosya referansını kaydet

                console.log("­şÜÇ Calling inspectFile2...");

                inspectFile2(e.target.files[0]); // İkinci dosyayı da analiz et

            } else {

                console.warn("⚠´©Å File2 change event but no file selected");

            }

        });

    } else {

        console.error("❌ fileInput2 element not found!");

    }



    // 2.5 DRAG & DROP - Ana Dosya

    const dropZone1 = document.getElementById("dropZone");

    const fileInput1 = document.getElementById("fileInput");

    if (dropZone1) {

        ['dragenter', 'dragover'].forEach(evt => {

            dropZone1.addEventListener(evt, (e) => {

                e.preventDefault();

                e.stopPropagation();

                dropZone1.classList.add("drag-over");

            });

        });

        ['dragleave', 'drop'].forEach(evt => {

            dropZone1.addEventListener(evt, (e) => {

                e.preventDefault();

                e.stopPropagation();

                dropZone1.classList.remove("drag-over");

            });

        });

        dropZone1.addEventListener('drop', (e) => {

            const files = e.dataTransfer.files;

            if (files.length > 0 && files[0].name.match(/\.(xlsx|xls|csv)$/i)) {

                fileInput1.files = files;

                fileInput1.dispatchEvent(new Event('change', { bubbles: true }));

            }

        });

    }



    // 2.6 DRAG & DROP - İkinci Dosya

    const dropZone2 = document.getElementById("dropZone2");

    const fileInput2 = document.getElementById("fileInput2");

    if (dropZone2 && fileInput2) {

        ['dragenter', 'dragover'].forEach(evt => {

            dropZone2.addEventListener(evt, (e) => {

                e.preventDefault();

                e.stopPropagation();

                dropZone2.classList.add("drag-over");

            });

        });

        ['dragleave', 'drop'].forEach(evt => {

            dropZone2.addEventListener(evt, (e) => {

                e.preventDefault();

                e.stopPropagation();

                dropZone2.classList.remove("drag-over");

            });

        });

        dropZone2.addEventListener('drop', (e) => {

            const files = e.dataTransfer.files;

            if (files.length > 0 && files[0].name.match(/\.(xlsx|xls|csv)$/i)) {

                fileInput2.files = files;

                fileInput2.dispatchEvent(new Event('change', { bubbles: true }));

                document.getElementById("selectedFileName2").textContent = files[0].name;

            }

        });

    }



    // 3. Paylaş Dropdown Sistemleri (Header = Siteyi Tavsiye Et, Result = Sonuç Paylaş)

    const SITE_URL = window.location.origin;



    // Ortak Dropdown Oluşturma Fonksiyonu

    function createShareDropdown(container, dropdown, platforms, getShareData) {

        dropdown.style.position = "absolute";

        dropdown.style.top = "100%";

        dropdown.style.right = "0";

        dropdown.style.marginTop = "5px";

        dropdown.style.background = "var(--gm-card-bg)";

        dropdown.style.border = "1px solid var(--gm-card-border)";

        dropdown.style.borderRadius = "8px";

        dropdown.style.padding = "8px";

        dropdown.style.zIndex = "1000";

        dropdown.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

        dropdown.style.minWidth = "180px";



        platforms.forEach(p => {

            // Separator

            if (p.sep) {

                const sep = document.createElement("div");

                sep.style.height = "1px";

                sep.style.background = "var(--gm-card-border)";

                sep.style.margin = "6px 0";

                dropdown.appendChild(sep);

                return;

            }

            // Regular item

            const item = document.createElement("div");

            item.style.display = "flex";

            item.style.alignItems = "center";

            item.style.gap = "8px";

            item.style.padding = "8px 10px";

            item.style.cursor = "pointer";

            item.style.borderRadius = "6px";

            item.style.transition = "background 0.2s";

            item.innerHTML = `<i class="${p.icon}" style="color:${p.color}; width:20px;"></i> ${p.name}`;

            item.onmouseover = () => item.style.background = "rgba(255,255,255,0.1)";

            item.onmouseout = () => item.style.background = "transparent";

            item.onclick = () => {

                const { shareText, shareUrl } = getShareData();

                p.fn(shareText, shareUrl);

                dropdown.style.display = 'none';

            };

            dropdown.appendChild(item);

        });



        // Close on outside click

        document.addEventListener('click', (e) => {

            if (!container.contains(e.target)) dropdown.style.display = 'none';

        });

    }



    // Platform Listesi - Dinamik dil desteği için getter kullanılıyor

    const getSharePlatforms = () => [

        // Social Media

        { name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366', fn: (t, u) => window.open(`https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}`, '_blank') },

        { name: 'Telegram', icon: 'fab fa-telegram', color: '#0088cc', fn: (t, u) => window.open(`https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`, '_blank') },

        { name: 'X', icon: 'fab fa-x-twitter', color: '#71767b', fn: (t, u) => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t + ' ' + u)}`, '_blank') },

        { name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F', fn: async (t, u) => { await navigator.clipboard.writeText(t + ' ' + u); alert(CURRENT_LANG === 'en' ? 'Copied! Paste on Instagram.' : 'Kopyalandı! Instagram\'a yapıştır.'); window.open('https://instagram.com', '_blank'); } },

        { name: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0077b5', fn: (t, u) => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`, '_blank') },

        { name: 'N-Sosyal', icon: 'fas fa-n', color: '#8b5cf6', fn: () => window.open('https://nextsosyal.co/', '_blank') },

        { sep: true },

        // Email

        { name: 'Gmail', icon: 'fas fa-envelope', color: '#EA4335', fn: (t, u) => window.open(`https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(t + '\n\n' + u)}`, '_blank') },

        { name: 'Outlook', icon: 'fab fa-microsoft', color: '#0078D4', fn: (t, u) => window.open(`https://outlook.live.com/mail/0/deeplink/compose?body=${encodeURIComponent(t + '\n\n' + u)}`, '_blank') },

        { sep: true },

        // Copy

        { name: CURRENT_LANG === 'en' ? 'Copy Link' : 'Linki Kopyala', icon: 'fas fa-copy', color: 'var(--gm-text)', fn: async (t, u) => { await navigator.clipboard.writeText(t + ' ' + u); alert(CURRENT_LANG === 'en' ? 'Copied!' : 'Kopyalandı!'); } }

    ];



    // Header Paylaş Butonu (Siteyi Tavsiye Et)

    const headerShareBtn = document.getElementById('headerShareBtn');

    const headerShareDropdown = document.getElementById('headerShareDropdown');

    const headerShareContainer = document.getElementById('headerShareContainer');

    if (headerShareBtn && headerShareDropdown && headerShareContainer) {

        // Style dropdown

        headerShareDropdown.style.position = "absolute";

        headerShareDropdown.style.top = "100%";

        headerShareDropdown.style.right = "0";

        headerShareDropdown.style.marginTop = "5px";

        headerShareDropdown.style.background = "var(--gm-card-bg)";

        headerShareDropdown.style.border = "1px solid var(--gm-card-border)";

        headerShareDropdown.style.borderRadius = "8px";

        headerShareDropdown.style.padding = "8px";

        headerShareDropdown.style.zIndex = "1000";

        headerShareDropdown.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

        headerShareDropdown.style.minWidth = "180px";



        headerShareBtn.onclick = () => {

            // Regenerate items on each open for proper localization

            headerShareDropdown.innerHTML = '';

            const shareText = '­şôè opradox - Excel Doktoru | Verini analiz et, raporla!';

            const shareUrl = SITE_URL;

            getSharePlatforms().forEach(p => {

                if (p.sep) {

                    const sep = document.createElement("div");

                    sep.style.height = "1px";

                    sep.style.background = "var(--gm-card-border)";

                    sep.style.margin = "6px 0";

                    headerShareDropdown.appendChild(sep);

                    return;

                }

                const item = document.createElement("div");

                item.style.display = "flex";

                item.style.alignItems = "center";

                item.style.gap = "8px";

                item.style.padding = "8px 10px";

                item.style.cursor = "pointer";

                item.style.borderRadius = "6px";

                item.style.transition = "background 0.2s";

                item.innerHTML = `<i class="${p.icon}" style="color:${p.color}; width:20px;"></i> ${p.name}`;

                item.onmouseover = () => item.style.background = "rgba(255,255,255,0.1)";

                item.onmouseout = () => item.style.background = "transparent";

                item.onclick = (e) => { e.stopPropagation(); p.fn(shareText, shareUrl); headerShareDropdown.style.display = 'none'; };

                headerShareDropdown.appendChild(item);

            });

            headerShareDropdown.style.display = headerShareDropdown.style.display === 'none' ? 'block' : 'none';

        };



        document.addEventListener('click', (e) => {

            if (!headerShareContainer.contains(e.target)) headerShareDropdown.style.display = 'none';

        });

    }



    // Result Paylaş Butonu (Sonuç Paylaş)

    const resultShareBtn = document.getElementById('resultShareBtn');

    const resultShareDropdown = document.getElementById('resultShareDropdown');

    const resultShareContainer = document.getElementById('resultShareContainer');

    if (resultShareBtn && resultShareDropdown && resultShareContainer) {

        // Style dropdown

        resultShareDropdown.style.position = "absolute";

        resultShareDropdown.style.top = "100%";

        resultShareDropdown.style.right = "0";

        resultShareDropdown.style.marginTop = "5px";

        resultShareDropdown.style.background = "var(--gm-card-bg)";

        resultShareDropdown.style.border = "1px solid var(--gm-card-border)";

        resultShareDropdown.style.borderRadius = "8px";

        resultShareDropdown.style.padding = "8px";

        resultShareDropdown.style.zIndex = "1000";

        resultShareDropdown.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

        resultShareDropdown.style.minWidth = "180px";



        resultShareBtn.onclick = () => {

            // Regenerate items on each open for proper localization

            resultShareDropdown.innerHTML = '';

            let shareText, shareUrl;

            if (LAST_RESULT_DATA) {

                const scenarioTitle = document.getElementById('scenarioTitle')?.textContent?.replace('3. ', '') || 'opradox Analizi';

                const summary = (LAST_RESULT_DATA.summary || LAST_RESULT_DATA.markdown_result || '').substring(0, 200);

                const cleanSummary = summary.replace(/[#*`\n]/g, ' ').replace(/\s+/g, ' ').trim();

                shareText = `­şôè opradox ile analiz yaptım!\n\n­şôî ${scenarioTitle}\n­şôê ${cleanSummary}...\n\n­şöù Sen de dene:`;

                shareUrl = SITE_URL;

            } else {

                shareText = '­şôè opradox - Excel Doktoru';

                shareUrl = SITE_URL;

            }

            getSharePlatforms().forEach(p => {

                if (p.sep) {

                    const sep = document.createElement("div");

                    sep.style.height = "1px";

                    sep.style.background = "var(--gm-card-border)";

                    sep.style.margin = "6px 0";

                    resultShareDropdown.appendChild(sep);

                    return;

                }

                const item = document.createElement("div");

                item.style.display = "flex";

                item.style.alignItems = "center";

                item.style.gap = "8px";

                item.style.padding = "8px 10px";

                item.style.cursor = "pointer";

                item.style.borderRadius = "6px";

                item.style.transition = "background 0.2s";

                item.innerHTML = `<i class="${p.icon}" style="color:${p.color}; width:20px;"></i> ${p.name}`;

                item.onmouseover = () => item.style.background = "rgba(255,255,255,0.1)";

                item.onmouseout = () => item.style.background = "transparent";

                item.onclick = (e) => { e.stopPropagation(); p.fn(shareText, shareUrl); resultShareDropdown.style.display = 'none'; };

                resultShareDropdown.appendChild(item);

            });

            resultShareDropdown.style.display = resultShareDropdown.style.display === 'none' ? 'block' : 'none';

        };



        document.addEventListener('click', (e) => {

            if (!resultShareContainer.contains(e.target)) resultShareDropdown.style.display = 'none';

        });

    }



    // 4. Topluluk Toggle

    const commHeader = document.querySelector(".gm-comments-header");

    if (commHeader) {

        const newHeader = commHeader.cloneNode(true); // Listener temizlemek için clone

        commHeader.parentNode.replaceChild(newHeader, commHeader);

        newHeader.addEventListener("click", () => {

            const wrapper = document.getElementById("commentsWrapper");

            wrapper.classList.toggle("collapsed");

            newHeader.querySelector("i").className = wrapper.classList.contains("collapsed") ? "fas fa-chevron-up" : "fas fa-chevron-down";

        });

    }



    // 5. Yorum Gönder

    document.getElementById("sendCommentBtn").addEventListener("click", async () => {

        const txt = document.getElementById("publicComment");

        const msg = txt.value.trim();

        if (!msg) return;



        const btn = document.getElementById("sendCommentBtn");

        const originalText = btn.innerHTML;

        btn.disabled = true;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';



        try {

            const res = await fetch(`${BACKEND_BASE_URL}/feedback`, {

                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({

                    message_type: "comment",

                    message: msg

                })

            });

            if (res.ok) {

                txt.value = "";

                loadCommunityComments(); // Listeyi yenile

            } else {

                alert(CURRENT_LANG === 'tr' ? 'Gönderilemedi.' : 'Failed to send.');

            }

        } catch (err) {

            console.error("Comment send error:", err);

            alert(CURRENT_LANG === 'tr' ? 'Hata oluştu.' : 'Error occurred.');

        } finally {

            btn.disabled = false;

            btn.innerHTML = originalText;

        }

    });



    // 6. Dil Değiştirme

    document.getElementById("langToggle").addEventListener("click", async () => {

        CURRENT_LANG = CURRENT_LANG === "tr" ? "en" : "tr";



        // 1. Statik UI Metinlerini Güncelle

        if (typeof updateUITexts === 'function') updateUITexts();



        // 2. Menüyü Yeni Dilde Yükle

        await loadMenuData(CURRENT_LANG);



        // 3. Aktif Senaryo Varsa Formu Yeniden Render Et (çeviriler için)

        if (ACTIVE_SCENARIO_ID && typeof SCENARIO_LIST !== 'undefined') {

            const activeScenario = SCENARIO_LIST.find(s => s.id === ACTIVE_SCENARIO_ID);

            if (activeScenario && typeof selectScenario === 'function') {

                // Formu ve başlıkları güncelle

                selectScenario(activeScenario);



                // Menüdeki butonu tekrar aktif yap

                const newBtns = document.querySelectorAll(".gm-scenario-btn");

                newBtns.forEach(btn => {

                    // Buton metni veya index kontrolü zor, basitçe aktif sınıfı ekleyelim mi?

                    // Genellikle loadMenuData sonrası butonlar sıfırlanır.

                    // şimdilik selectScenario(..., null) çağrıldığı için active class ekleme selectScenario içinde null kontrolüyle pass geçilir.

                    // İdeal çözüm: butonları ID ile bulmak. şimdilik formun düzelmesi yeterli.

                });

            }

        }



        // 4. Sonuç Alanını Güncelle

        if (LAST_RESULT_DATA && LAST_RESULT_DATA.scenario_id === ACTIVE_SCENARIO_ID) {

            renderScenarioResult(LAST_RESULT_DATA);

        } else {

            // Sonuç alanını temizle - senaryo uyumsuz

            const resultArea = document.getElementById("resultArea");

            if (resultArea) resultArea.innerHTML = "";

            LAST_RESULT_DATA = null;

        }

    });



    // 7. Tema Değiştirme - FAZ-THEME-2: Explicit XOR guarantee

    document.getElementById("themeToggle").addEventListener("click", () => {

        const isDark = document.body.classList.contains("dark-mode");

        if (isDark) {

            document.body.classList.remove("dark-mode");

            document.body.classList.add("day-mode");

            localStorage.setItem("gm_theme", "day");

        } else {

            document.body.classList.remove("day-mode");

            document.body.classList.add("dark-mode");

            localStorage.setItem("gm_theme", "dark");

        }

    });



    // 8. Modal (Bize Ulaşın)

    const modal = document.getElementById("contactModal");

    const contactBtn = document.getElementById("contactBtn");

    if (contactBtn) {

        contactBtn.addEventListener("click", () => modal.classList.add("show"));

    }

    const closeBtn = document.querySelector(".gm-close-modal");

    if (closeBtn) {

        closeBtn.addEventListener("click", () => modal.classList.remove("show"));

    }

    window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });



    const contactForm = document.getElementById("contactForm");

    if (contactForm) {

        contactForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const nameEl = document.getElementById("contactName");

            const emailEl = document.getElementById("contactEmail");

            const msgEl = document.getElementById("contactMessage");



            const name = nameEl ? nameEl.value.trim() : null;

            const email = emailEl ? emailEl.value.trim() : null;

            const message = msgEl ? msgEl.value.trim() : "";



            const submitBtn = contactForm.querySelector("button[type='submit']");

            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';



            try {

                const res = await fetch(`${BACKEND_BASE_URL}/feedback`, {

                    method: "POST",

                    headers: { "Content-Type": "application/json" },

                    body: JSON.stringify({

                        message_type: "contact",

                        message: message,

                        name: name || null,

                        email: email || null

                    })

                });

                if (res.ok) {

                    alert(CURRENT_LANG === 'tr' ? 'Mesajınız iletildi, teşekkürler!' : 'Message sent, thank you!');

                    contactForm.reset();

                    modal.classList.remove("show");

                } else {

                    const errorData = await res.json();

                    let errorMsg = errorData.detail;

                    if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg);

                    console.error("API Error Detail:", errorData);

                    throw new Error(errorMsg || "API call failed");

                }

            } catch (err) {

                console.error("Contact form error:", err);

                alert((CURRENT_LANG === 'tr' ? 'Gönderim sırasında hata oluştu: ' : 'Error sending message: ') + (err.message || ''));

            } finally {

                submitBtn.disabled = false;

                submitBtn.innerHTML = originalText;

            }

        });

    }



    // ============================================================================

    // EXCEL STUDIO V2 - NEW EVENT HANDLERS

    // ============================================================================



    // Help Panel Toggle Button - Support both header (helpToggle) and any other toggle (helpToggleBtn)

    const helpToggleBtn = document.getElementById("helpToggleBtn") || document.getElementById("helpToggle");

    const helpToggleHeader = document.getElementById("helpToggle"); // Header button

    const helpCloseBtn = document.getElementById("helpCloseBtn");

    const mainContent = document.getElementById("mainContent");



    function toggleExcelHelp() {

        if (!mainContent) return;



        if (mainContent.classList.contains("excel-help-closed")) {

            mainContent.classList.remove("excel-help-closed");

            mainContent.classList.add("excel-help-open");

            if (helpToggleBtn) helpToggleBtn.classList.add("active");

            if (helpToggleHeader) helpToggleHeader.classList.add("active");

        } else {

            mainContent.classList.remove("excel-help-open");

            mainContent.classList.add("excel-help-closed");

            if (helpToggleBtn) helpToggleBtn.classList.remove("active");

            if (helpToggleHeader) helpToggleHeader.classList.remove("active");

        }

    }



    if (helpToggleBtn) {

        helpToggleBtn.addEventListener("click", toggleExcelHelp);

    }

    // Also bind to header help toggle if different

    if (helpToggleHeader && helpToggleHeader !== helpToggleBtn) {

        helpToggleHeader.addEventListener("click", toggleExcelHelp);

    }



    if (helpCloseBtn) {

        helpCloseBtn.addEventListener("click", function () {

            if (mainContent) {

                mainContent.classList.remove("excel-help-open");

                mainContent.classList.add("excel-help-closed");

                if (helpToggleBtn) helpToggleBtn.classList.remove("active");

            }

        });

    }



    // Note: fileInput change handler is in bindEvents (line 4732) which calls both inspectFile and createFileTab



    // Add Second File Button

    const addSecondFileBtn = document.getElementById("addSecondFileBtn");

    if (addSecondFileBtn) {

        addSecondFileBtn.addEventListener("click", function () {

            // Trigger second file upload

            const fi2 = document.getElementById("fileInput2");

            if (fi2) fi2.click();

        });

    }



    // Second File Input change event

    const fileInput2El = document.getElementById("fileInput2");

    if (fileInput2El) {

        fileInput2El.addEventListener("change", function () {

            if (this.files && this.files.length > 0) {

                const fileName = this.files[0].name;

                createFileTab(fileName, 2);

            }

        });

    }

}



// Create file tab in the file bar

function createFileTab(fileName, fileNumber) {

    const container = document.getElementById("fileTabsContainer");

    if (!container) return;



    // Check if tab already exists

    const existingTab = document.querySelector(`.gm-excel-file-tab[data-file="${fileNumber}"]`);

    if (existingTab) {

        // Update existing tab

        const nameSpan = existingTab.querySelector(".tab-name");

        if (nameSpan) nameSpan.textContent = fileName;

        return;

    }



    // Find upload tab position

    const uploadTab = document.getElementById(`file${fileNumber}UploadTab`);



    // Create new file tab

    const tab = document.createElement("div");

    tab.className = "gm-excel-file-tab active";

    tab.dataset.file = fileNumber;

    tab.innerHTML = `

        <span class="tab-dot"></span>

        <span class="tab-name">${fileName}</span>

        <span class="tab-close" onclick="removeFileTab(${fileNumber})">&times;</span>

    `;



    // Insert after upload tab or at the end

    if (uploadTab) {

        uploadTab.style.display = "none"; // Hide upload tab when file is loaded

        container.insertBefore(tab, uploadTab.nextSibling);

    } else {

        container.appendChild(tab);

    }



    // Show + button for second file if it's first file

    if (fileNumber === 1) {

        const addBtn = document.getElementById("addSecondFileBtn");

        if (addBtn) addBtn.style.display = "flex";



        // Add file-loaded class to file bar

        const fileBar = container.closest(".gm-excel-file-bar");

        if (fileBar) fileBar.classList.add("file-loaded");

    }



    // Deactivate other tabs

    container.querySelectorAll(".gm-excel-file-tab").forEach(t => {

        if (t !== tab) t.classList.remove("active");

    });

}



// Remove file tab

function removeFileTab(fileNumber) {

    const tab = document.querySelector(`.gm-excel-file-tab[data-file="${fileNumber}"]`);

    if (tab) tab.remove();



    // Show upload tab again

    const uploadTab = document.getElementById(`file${fileNumber}UploadTab`);

    if (uploadTab) uploadTab.style.display = "flex";



    // Hide + button and remove file-loaded class if first file is removed

    if (fileNumber === 1) {

        const addBtn = document.getElementById("addSecondFileBtn");

        if (addBtn) addBtn.style.display = "none";



        const fileBar = document.querySelector(".gm-excel-file-bar");

        if (fileBar) fileBar.classList.remove("file-loaded");



        // Hide file info panel

        const fileInfoPanel = document.getElementById("fileInfoPanel");

        if (fileInfoPanel) fileInfoPanel.style.display = "none";

    }



    // Hide file info panel 2 if second file removed

    if (fileNumber === 2) {

        const fileInfoPanel2 = document.getElementById("fileInfoPanel2");

        if (fileInfoPanel2) fileInfoPanel2.style.display = "none";

    }



    // Clear file input

    const input = document.getElementById(fileNumber === 1 ? "fileInput" : "fileInput2");

    if (input) input.value = "";

}



// Open Visual Builder - Oyun Hamuru PRO (Gelişmiş Dinamik Rapor)

function openVisualBuilder() {

    // Find the custom-report-builder-pro scenario in SCENARIO_LIST (note: hyphen, not underscore)

    const proScenario = SCENARIO_LIST.find(sc => sc.id === "custom-report-builder-pro");



    if (proScenario) {

        // Use existing selectScenario logic with the found scenario

        const titleEl = document.getElementById("scenarioTitle");

        const subtitleEl = document.getElementById("scenarioSubtitle");



        if (titleEl) titleEl.textContent = proScenario.title;

        if (subtitleEl) subtitleEl.textContent = proScenario.short || proScenario.description || "";



        // Clear any previously selected scenario buttons

        document.querySelectorAll(".gm-excel-scenario-card.active, .gm-scenario-btn.active").forEach(btn => {

            btn.classList.remove("active");

        });



        // Highlight PRO card

        const proCard = document.getElementById("proBuilderCard");

        if (proCard) proCard.classList.add("active");



        // Set active scenario

        ACTIVE_SCENARIO_ID = proScenario.id;



        // Render the dynamic form

        renderDynamicForm(proScenario.id, proScenario.params || []);



        // Load help content

        loadScenarioHelp(proScenario.id);

    } else {

        // Fallback: Show placeholder if scenario not found

        const T = EXTRA_TEXTS[CURRENT_LANG];

        const formContainer = document.getElementById("dynamicFormContainer");

        const titleEl = document.getElementById("scenarioTitle");

        const subtitleEl = document.getElementById("scenarioSubtitle");



        if (titleEl) titleEl.textContent = T.pro_title || "Özel Rapor Oluşturucu";

        if (subtitleEl) subtitleEl.textContent = T.pro_subtitle || "Sürükle, Bırak, Raporla";



        if (formContainer) {

            formContainer.innerHTML = `

                <div style="text-align:center; padding:60px 20px;">

                    <div style="font-size:4rem; margin-bottom:20px;">­şÜÇ</div>

                    <h3 style="color:var(--gm-primary); margin-bottom:10px;">Oyun Hamuru PRO</h3>

                    <p style="color:var(--gm-text-muted); font-size:0.9rem;">${T.pro_coming_soon || "Yükleniyor..."}</p>

                    <p style="font-size:0.8rem; color:#ef4444; margin-top:20px;">

                        ⚠´©Å Senaryo yüklenemedi. Lütfen sayfayı yenileyin veya backend'in çalıştığından emin olun.

                    </p>

                </div>

            `;

        }



        // Clear active scenario - this is a special mode

        ACTIVE_SCENARIO_ID = null;



        // Clear any previously selected scenario buttons

        document.querySelectorAll(".gm-excel-scenario-card.active, .gm-scenario-btn.active").forEach(btn => {

            btn.classList.remove("active");

        });



        // Highlight PRO card

        const proCard = document.getElementById("proBuilderCard");

        if (proCard) proCard.classList.add("active");

    }

}



// Export new functions to window for onclick handlers

window.openVisualBuilder = openVisualBuilder;

window.createFileTab = createFileTab;

window.removeFileTab = removeFileTab;



// ============================================================================

// PHASE 1: CROSS-SHEET CORE FUNCTIONS

// Implementasyon: 2024-12-16

// ============================================================================



/**

 * İkinci dosya sütunlarını datalist'e ekle (file2-columns)

 * @param {Array<string>} columns - Sütun isimleri

 */

function updateFile2ColumnDatalist(columns) {

    if (!columns || !Array.isArray(columns)) {

        console.warn('updateFile2ColumnDatalist: Invalid columns', columns);

        return;

    }



    let datalist = document.getElementById('file2-columns');

    if (!datalist) {

        datalist = document.createElement('datalist');

        datalist.id = 'file2-columns';

        document.body.appendChild(datalist);

    }



    datalist.innerHTML = columns.map(col =>

        `<option value="${col}">${col}</option>`

    ).join('');



    console.log(`✔ updateFile2ColumnDatalist: ${columns.length} sütun eklendi`);

}



/**

 * Cross-sheet / ikinci dosya kaynağı seçim UI bloğu HTML'i üret

 * PRO Builder'daki merge block mantığını kullanır

 * @param {string} uniqueId - Unique identifier for event binding

 * @returns {string} HTML string

 */

function getInlineCrossSheetHTML(uniqueId = '') {

    const T = EXTRA_TEXTS[CURRENT_LANG];

    const hasMultipleSheets = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;

    const hasSecondFile = FILE2_COLUMNS && FILE2_COLUMNS.length > 0;



    // Ana dosyada çok sayfa varsa, aktif olmayan sayfaları listele

    const crossSheetOptions = hasMultipleSheets

        ? FILE_SHEET_NAMES.filter(s => s !== FILE_SELECTED_SHEET)

            .map(s => `<option value="${s}">${s}</option>`).join('')

        : '';



    return `

    <div class="gm-crosssheet-source" data-id="${uniqueId}" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; padding:8px; background:rgba(59,130,246,0.1); border-radius:6px; border:1px dashed var(--gm-primary);">

        

        ${hasMultipleSheets ? `

        <!-- Cross-Sheet Checkbox -->

        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">

            <input type="checkbox" class="use-crosssheet" onchange="toggleCrossSheet(this)" style="width:16px; height:16px; accent-color:var(--gm-primary);">

            <span style="color:var(--gm-primary); font-weight:500;"><i class="fas fa-layer-group"></i> ${T.use_same_file_sheet || 'Aynı Dosyadan'}</span>

        </label>

        

        <!-- Cross-Sheet Selector (başlangıçta gizli) -->

        <div class="crosssheet-area" style="display:none; flex:1; min-width:200px; align-items:center; gap:6px;">

            <select class="crosssheet-select gm-sheet-select" style="padding:4px 8px; font-size:0.8rem; height:28px; max-width:140px;" onchange="onCrossSheetChange(this)">

                ${crossSheetOptions}

            </select>

            <!-- Sütun Preview -->

            <div class="crosssheet-columns" style="flex:1; min-width:0; background:var(--gm-bg); border:1px solid var(--gm-card-border); border-radius:4px; padding:2px 6px; height:28px; display:flex; align-items:center; overflow:hidden;">

                <div class="crosssheet-column-list" style="display:flex; gap:4px; overflow-x:auto; white-space:nowrap; align-items:center; width:100%; scrollbar-width:thin;">

                    <span style="color:var(--gm-text-muted); font-size:0.7rem; font-style:italic;">${T.select_sheet || 'Sayfa seçin...'}</span>

                </div>

            </div>

        </div>

        ` : ''}

        

        <!-- İkinci Dosya Gerekli Uyarısı - Conditional Visibility -->

        ${(() => {

            const mode = typeof getSecondSourceHintMode === 'function' ? getSecondSourceHintMode() : 'hidden';

            const shouldShow = typeof shouldShowSecondSourceHint === 'function' ? shouldShowSecondSourceHint() : false;

            if (!shouldShow || mode === 'hidden') {

                return `<div class="gm-source-hint" style="display:none;"></div>`;

            }

            let icon, text, cssClass;

            if (mode === 'success') {

                icon = 'fa-check-circle';

                text = (T.lbl_second_source_success || 'Source: {filename}').replace('{filename}', FILE2_NAME || 'File2');

                cssClass = 'gm-source-hint--success';

            } else if (mode === 'info') {

                icon = 'fa-info-circle';

                text = T.lbl_second_source_info || 'You can also pick another sheet from the same workbook.';

                cssClass = 'gm-source-hint--info';

            } else {

                icon = 'fa-exclamation-triangle';

                text = T.lbl_second_source_warning || 'This scenario requires a second source: upload a 2nd file or select a sheet.';

                cssClass = 'gm-source-hint--warning';

            }

            return `<div class="gm-source-hint ${cssClass}" style="${hasMultipleSheets ? '' : 'flex:1;'}"><i class="fas ${icon}"></i> ${text}</div>`;

        })()}

    </div>

    `;

}



// DİNAMİK FORM OLUşTURUCU (TğM TİPLER EKLENDİ)

// ============================================================================

// PHASE 1: CROSS-SHEET CORE FUNCTIONS

// Implementasyon: 2024-12-16

// ============================================================================



/**

 * İkinci dosya sütunlarını datalist'e ekle (file2-columns)

 * @param {Array<string>} columns - Sütun isimleri

 */

function updateFile2ColumnDatalist(columns) {

    if (!columns || !Array.isArray(columns)) {

        console.warn('updateFile2ColumnDatalist: Invalid columns', columns);

        return;

    }



    let datalist = document.getElementById('file2-columns');

    if (!datalist) {

        datalist = document.createElement('datalist');

        datalist.id = 'file2-columns';

        document.body.appendChild(datalist);

    }



    datalist.innerHTML = columns.map(col =>

        `<option value="${col}">${col}</option>`

    ).join('');



    console.log(`✔ updateFile2ColumnDatalist: ${columns.length} sütun eklendi`);

}



/**

 * Cross-sheet / ikinci dosya kaynağı seçim UI bloğu HTML'i üret

 * PRO Builder'daki merge block mantığını kullanır

 * @param {string} uniqueId - Unique identifier for event binding

 * @returns {string} HTML string

 */

function getInlineCrossSheetHTML(uniqueId = '') {

    const T = EXTRA_TEXTS[CURRENT_LANG];

    const hasMultipleSheets = FILE_SHEET_NAMES && FILE_SHEET_NAMES.length > 1;

    const hasSecondFile = FILE2_COLUMNS && FILE2_COLUMNS.length > 0;



    // Ana dosyada çok sayfa varsa, aktif olmayan sayfaları listele

    const crossSheetOptions = hasMultipleSheets

        ? FILE_SHEET_NAMES.filter(s => s !== FILE_SELECTED_SHEET)

            .map(s => `<option value="${s}">${s}</option>`).join('')

        : '';



    return `

    <div class="gm-crosssheet-source" data-id="${uniqueId}" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; padding:8px; background:rgba(59,130,246,0.1); border-radius:6px; border:1px dashed var(--gm-primary);">

        

        ${hasMultipleSheets ? `

        <!-- Cross-Sheet Checkbox -->

        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">

            <input type="checkbox" class="use-crosssheet" onchange="toggleCrossSheet(this)" style="width:16px; height:16px; accent-color:var(--gm-primary);">

            <span style="color:var(--gm-primary); font-weight:500;"><i class="fas fa-layer-group"></i> ${T.use_same_file_sheet || 'Aynı Dosyadan'}</span>

        </label>

        

        <!-- Cross-Sheet Selector (başlangıçta gizli) -->

        <div class="crosssheet-area" style="display:none; flex:1; min-width:200px; align-items:center; gap:6px;">

            <select class="crosssheet-select gm-sheet-select" style="padding:4px 8px; font-size:0.8rem; height:28px; max-width:140px;" onchange="onCrossSheetChange(this)">

                ${crossSheetOptions}

            </select>

            <!-- Sütun Preview -->

            <div class="crosssheet-columns" style="flex:1; min-width:0; background:var(--gm-bg); border:1px solid var(--gm-card-border); border-radius:4px; padding:2px 6px; height:28px; display:flex; align-items:center; overflow:hidden;">

                <div class="crosssheet-column-list" style="display:flex; gap:4px; overflow-x:auto; white-space:nowrap; align-items:center; width:100%; scrollbar-width:thin;">

                    <span style="color:var(--gm-text-muted); font-size:0.7rem; font-style:italic;">${T.select_sheet || 'Sayfa seçin...'}</span>

                </div>

            </div>

        </div>

        ` : ''}

        

        <!-- İkinci Dosya Gerekli Uyarısı - Conditional Visibility -->

        ${(() => {

            const mode = typeof getSecondSourceHintMode === 'function' ? getSecondSourceHintMode() : 'hidden';

            const shouldShow = typeof shouldShowSecondSourceHint === 'function' ? shouldShowSecondSourceHint() : false;

            if (!shouldShow || mode === 'hidden') {

                return `<div class="gm-source-hint" style="display:none;"></div>`;

            }

            let icon, text, cssClass;

            if (mode === 'success') {

                icon = 'fa-check-circle';

                text = (T.lbl_second_source_success || 'Source: {filename}').replace('{filename}', FILE2_NAME || 'File2');

                cssClass = 'gm-source-hint--success';

            } else if (mode === 'info') {

                icon = 'fa-info-circle';

                text = T.lbl_second_source_info || 'You can also pick another sheet from the same workbook.';

                cssClass = 'gm-source-hint--info';

            } else {

                icon = 'fa-exclamation-triangle';

                text = T.lbl_second_source_warning || 'This scenario requires a second source: upload a 2nd file or select a sheet.';

                cssClass = 'gm-source-hint--warning';

            }

            return `<div class="gm-source-hint ${cssClass}" style="${hasMultipleSheets ? '' : 'flex:1;'}"><i class="fas ${icon}"></i> ${text}</div>`;

        })()}

    </div>

    `;

}



/**

 * Cross-sheet checkbox toggle handler

 * @param {HTMLInputElement} checkbox

 */

function toggleCrossSheet(checkbox) {

    const container = checkbox.closest('.gm-crosssheet-source');

    if (!container) {

        console.error('toggleCrossSheet: container not found');

        return;

    }



    const area = container.querySelector('.crosssheet-area');

    const warning = container.querySelector('.sf-warning');



    if (checkbox.checked) {

        // Cross-sheet modunu aç → ana dosyanın başka sayfası

        if (area) area.style.display = 'flex';

        if (warning) warning.style.display = 'none';



        // İlk sheet'i otomatik seç

        const select = container.querySelector('.crosssheet-select');

        if (select && select.options.length > 0) {

            onCrossSheetChange(select);

        }



        // CRITICAL: Tüm crosssheet-aware inputları colOptions'a çevir

        document.querySelectorAll('.crosssheet-aware-input').forEach(input => {

            input.setAttribute('list', 'colOptions');

        });

        console.log('✔ Cross-sheet mode: inputlar colOptions kullanıyor');



    } else {

        // İkinci dosya moduna dön → farklı dosya

        if (area) area.style.display = 'none';

        if (warning && FILE2_COLUMNS.length === 0) {

            warning.style.display = 'block';

        }



        // CRITICAL: Tüm crosssheet-aware inputları file2-columns'a çevir

        document.querySelectorAll('.crosssheet-aware-input').forEach(input => {

            input.setAttribute('list', 'file2-columns');

        });

        console.log('✔ İkinci dosya mode: inputlar file2-columns kullanıyor');



        // file2-columns datalist'ini güncelle

        updateFile2ColumnDatalist(FILE2_COLUMNS);

    }

}



/**

 * Cross-sheet sayfa değişikliği handler

 * Seçilen sayfanın sütunlarını fetch edip UI'ya yansıtır

 * @param {HTMLSelectElement} selectElement

 */

async function onCrossSheetChange(selectElement) {

    const sheetName = selectElement.value;

    const container = selectElement.closest('.crosssheet-area');

    if (!container) {

        console.error('onCrossSheetChange: container not found');

        return;

    }



    const columnList = container.querySelector('.crosssheet-column-list');

    if (!columnList) {

        console.error('onCrossSheetChange: columnList not found');

        return;

    }



    // Loading state

    columnList.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';



    // Ana dosyayı al

    const fileInput = document.getElementById('fileInput');

    if (!fileInput || !fileInput.files[0]) {

        columnList.innerHTML = '<span style="color:#ef4444;">Dosya bulunamadı!</span>';

        return;

    }



    try {

        const formData = new FormData();

        formData.append('file', fileInput.files[0]);



        const url = `${BACKEND_BASE_URL}/ui/inspect?sheet_name=${encodeURIComponent(sheetName)}`;

        const res = await fetch(url, { method: 'POST', body: formData });

        const data = await res.json();



        if (data.columns && Array.isArray(data.columns)) {

            // Sütun chip'leri render et

            columnList.innerHTML = data.columns.map((col, i) => {

                const letter = indexToLetter(i);

                return `<span class="gm-col-chip"><strong>${letter}</strong>${col}</span>`;

            }).join('');



            // CRITICAL FIX: Cross-sheet ana dosyanın başka sayfası olduğu için colOptions datalist'ini güncelle

            // file2-columns DEğİL!

            let datalist = document.getElementById('colOptions');

            if (!datalist) {

                datalist = document.createElement('datalist');

                datalist.id = 'colOptions';

                document.body.appendChild(datalist);

            }

            datalist.innerHTML = data.columns.map(col =>

                `<option value="${col}">${col}</option>`

            ).join('');



            console.log(`✔ Cross-sheet: "${sheetName}" sayfası yüklendi, ${data.columns.length} sütun, colOptions güncellendi`);

        } else {

            columnList.innerHTML = '<span style="color:#ef4444;">Sütun bulunamadı!</span>';

        }

    } catch (err) {

        console.error('onCrossSheetChange error:', err);

        columnList.innerHTML = '<span style="color:#ef4444;">Hata!</span>';

    }

}



/**

 * Tüm cross-sheet blokların uyarı durumunu güncelle

 * İkinci dosya yüklendiğinde veya kaldırıldığında çağrılır

 */

function updateAllCrossSheetWarnings() {

    const hasSecondFile = FILE2_COLUMNS && FILE2_COLUMNS.length > 0;

    console.log('🔍 updateAllCrossSheetWarnings called: FILE2_COLUMNS.length=', FILE2_COLUMNS?.length || 0);



    document.querySelectorAll('.gm-crosssheet-source').forEach(container => {

        const checkbox = container.querySelector('.use-crosssheet');

        const warning = container.querySelector('.sf-warning');



        if (warning) {

            // Eğer checkbox işaretliyse (cross-sheet modu) uyarıyı gizle

            // VEYA ikinci dosya yüklüyse uyarıyı gizle

            const isCheckboxChecked = checkbox && checkbox.checked;



            if (isCheckboxChecked || hasSecondFile) {

                warning.style.display = 'none';

                console.log('✔ Warning gizlendi:', isCheckboxChecked ? 'cross-sheet aktif' : 'file2 var');

            } else {

                warning.style.display = 'block';

                console.log('⚠ Warning gösterildi: checkbox=', isCheckboxChecked, 'file2=', hasSecondFile);

            }

        }

    });

}



// ============================================================================

// END OF PHASE 1 FUNCTIONS

// ============================================================================



// ============================================================================

// QUEUE SYSTEM (Smart Guard)

// ============================================================================



let POLL_INTERVAL = null;



function showQueueModal() {

    const modal = document.getElementById("queueModal");

    if (modal && !modal.classList.contains("open")) {

        modal.classList.add("open");

        // Reset UI

        const statusText = CURRENT_LANG === 'tr' ? 'Sıra Bekleniyor...' : 'Waiting in Queue...';

        document.getElementById("qm_status").innerHTML = `<i class="fas fa-hourglass-half"></i> ${statusText}`;

        document.getElementById("qm_position").textContent = "-";

        document.getElementById("qm_time").textContent = "0s";

        document.getElementById("qm_load_bar").style.width = "0%";

        document.getElementById("qm_load_text").textContent = CURRENT_LANG === 'tr' ? '%0' : '0%';

    }

}



function closeQueueModal() {

    const modal = document.getElementById("queueModal");

    if (modal) modal.classList.remove("open");

    if (POLL_INTERVAL) {

        clearInterval(POLL_INTERVAL);

        POLL_INTERVAL = null;

    }

}



function updateQueueModal(status, position, elapsed, load) {

    const modal = document.getElementById("queueModal");

    if (!modal || !modal.classList.contains("open")) return;



    const statusEl = document.getElementById("qm_status");

    const posEl = document.getElementById("qm_position");

    const timeEl = document.getElementById("qm_time");

    const loadBar = document.getElementById("qm_load_bar");

    const loadText = document.getElementById("qm_load_text");



    // Status text (localized)

    if (status === 'queued') {

        const txt = CURRENT_LANG === 'tr' ? 'Sırada Bekliyor' : 'Waiting in Queue';

        statusEl.innerHTML = `<span style="color:#f59e0b"><i class="fas fa-clock"></i> ${txt}</span>`;

        const posTxt = CURRENT_LANG === 'tr' ? `. Sırada` : ` in line`;

        posEl.textContent = position > 0 ? `${position}${posTxt}` : "-";

    } else if (status === 'processing') {

        const txt = CURRENT_LANG === 'tr' ? 'İşleniyor...' : 'Processing...';

        statusEl.innerHTML = `<span style="color:#3b82f6"><i class="fas fa-cog fa-spin"></i> ${txt}</span>`;

        posEl.textContent = CURRENT_LANG === 'tr' ? "İşlemde" : "Processing";

    }



    // Time

    if (elapsed !== undefined) timeEl.textContent = `${Math.round(elapsed)}s`;



    // Load bar

    if (load !== undefined && load !== null) {

        loadBar.style.width = `${load}%`;

        loadText.textContent = CURRENT_LANG === 'tr' ? `%${load}` : `${load}%`;

        // Color based on load

        if (load > 80) loadBar.style.backgroundColor = "#ef4444";

        else if (load > 50) loadBar.style.backgroundColor = "#f59e0b";

        else loadBar.style.backgroundColor = "#10b981";

    }

}



// ============================================================

// YENİ: INLINE FEEDBACK WİDGET SİSTEMİ

// ============================================================

let SELECTED_RATING = 0;

let SELECTED_FEEDBACK_TYPE = "comment";

let CURRENT_SCENARIO_FOR_FEEDBACK = null;



// Sayfa yüklendiğinde feedback sistemini başlat

document.addEventListener("DOMContentLoaded", () => {

    initFeedbackWidget();

    loadCommunityComments();

});



function initFeedbackWidget() {

    // Yıldız rating olayları

    document.querySelectorAll("#starRating .gm-star").forEach(star => {

        star.addEventListener("click", () => {

            SELECTED_RATING = parseInt(star.dataset.value);

            updateStarDisplay(SELECTED_RATING);

            // Formu göster

            document.getElementById("feedbackForm").style.display = "block";

        });



        star.addEventListener("mouseenter", () => {

            updateStarDisplay(parseInt(star.dataset.value));

        });



        star.addEventListener("mouseleave", () => {

            updateStarDisplay(SELECTED_RATING);

        });

    });



    // Feedback türü butonları

    document.querySelectorAll(".gm-type-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".gm-type-btn").forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            SELECTED_FEEDBACK_TYPE = btn.dataset.type;

        });

    });



    // Gönder butonu

    const submitBtn = document.getElementById("submitFeedbackBtn");

    if (submitBtn) {

        submitBtn.addEventListener("click", submitInlineFeedback);

    }

}



function updateStarDisplay(activeCount) {

    document.querySelectorAll("#starRating .gm-star").forEach(star => {

        const val = parseInt(star.dataset.value);

        if (val <= activeCount) {

            star.classList.add("active");

        } else {

            star.classList.remove("active");

        }

    });

}



// Sonuç render edildiğinde widget'ı göster

function showInlineFeedbackWidget(scenarioId) {

    CURRENT_SCENARIO_FOR_FEEDBACK = scenarioId;

    SELECTED_RATING = 0;

    SELECTED_FEEDBACK_TYPE = "comment";



    // Reset widget

    updateStarDisplay(0);

    document.getElementById("feedbackForm").style.display = "none";

    document.getElementById("feedbackSuccess").style.display = "none";

    document.getElementById("feedbackName").value = "";

    document.getElementById("feedbackMessage").value = "";

    document.querySelectorAll(".gm-type-btn").forEach(b => b.classList.remove("active"));

    document.querySelector(".gm-type-btn[data-type='comment']")?.classList.add("active");



    // Widget'ı göster

    const widget = document.getElementById("inlineFeedbackWidget");

    if (widget) {

        widget.style.display = "block";

    }

}



async function submitInlineFeedback() {

    const message = document.getElementById("feedbackMessage").value.trim();

    const name = document.getElementById("feedbackName").value.trim();



    // En az rating veya mesaj olmalı

    if (!SELECTED_RATING && !message) {

        alert(CURRENT_LANG === 'tr' ? 'Lütfen puan verin veya yorum yazın.' : 'Please rate or leave a comment.');

        return;

    }



    const submitBtn = document.getElementById("submitFeedbackBtn");

    submitBtn.disabled = true;

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';



    try {

        const res = await fetch(`${BACKEND_BASE_URL}/feedback`, {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

                message_type: SELECTED_FEEDBACK_TYPE,

                message: message || `${SELECTED_RATING} yıldız puan`,

                name: name || null,

                scenario_id: CURRENT_SCENARIO_FOR_FEEDBACK,

                rating: SELECTED_RATING || null

            })

        });



        if (res.ok) {

            // Başarı göster

            document.getElementById("feedbackForm").style.display = "none";

            document.getElementById("starRating").style.display = "none";

            document.getElementById("feedbackSuccess").style.display = "flex";



            // GA4: Feedback gönderme eventi

            if (typeof gtag === 'function') {

                gtag('event', 'feedback_submit', {

                    'scenario_id': CURRENT_SCENARIO_FOR_FEEDBACK,

                    'rating': SELECTED_RATING,

                    'feedback_type': SELECTED_FEEDBACK_TYPE

                });

            }



            // Topluluk yorumlarını yenile

            setTimeout(() => loadCommunityComments(), 1000);

        } else {

            throw new Error("Gönderim başarısız");

        }

    } catch (err) {

        console.error("Feedback gönderme hatası:", err);

        alert(CURRENT_LANG === 'tr' ? 'Gönderim sırasında hata oluştu.' : 'Error sending feedback.');

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gönder';

    }

}



// ============================================================

// TOPLULUK YORUMLARI (Public Comments)

// ============================================================

async function loadCommunityComments() {

    const container = document.getElementById("commentsList");

    if (!container) return;



    try {

        const res = await fetch(`${BACKEND_BASE_URL}/feedback/public?limit=15`);

        if (!res.ok) return;



        const comments = await res.json();



        if (!comments.length) {

            container.innerHTML = `<div class="gm-no-comments">${CURRENT_LANG === 'tr' ? 'Henüz yorum yok. İlk yorumu sen yap!' : 'No comments yet. Be the first!'}</div>`;

            return;

        }



        container.innerHTML = comments.map(c => {

            const ratingHtml = c.rating ? `<span class="gm-comment-rating">${'Ô¡É'.repeat(c.rating)}</span>` : '';

            const replyHtml = c.admin_reply ? `

                <div class="gm-admin-reply">

                    <span class="gm-admin-badge">✔ Opradox</span>

                    ${c.admin_reply}

                </div>

            ` : '';



            return `

                <div class="gm-community-comment">

                    <div class="gm-comment-header">

                        <span class="gm-comment-name">${c.name || 'Anonim'}</span>

                        ${ratingHtml}

                        <span class="gm-comment-date">${formatRelativeTime(c.created_at)}</span>

                    </div>

                    <div class="gm-comment-message">${c.message}</div>

                    ${replyHtml}

                </div>

            `;

        }).join('');



    } catch (err) {

        console.error("Topluluk yorumları yüklenemedi:", err);

    }

}



function formatRelativeTime(isoDate) {

    const date = new Date(isoDate);

    const now = new Date();

    const diffMs = now - date;

    const diffMins = Math.floor(diffMs / 60000);

    const diffHours = Math.floor(diffMs / 3600000);

    const diffDays = Math.floor(diffMs / 86400000);



    if (diffMins < 1) return CURRENT_LANG === 'tr' ? 'Az önce' : 'Just now';

    if (diffMins < 60) return `${diffMins} ${CURRENT_LANG === 'tr' ? 'dk önce' : 'min ago'}`;

    if (diffHours < 24) return `${diffHours} ${CURRENT_LANG === 'tr' ? 'saat önce' : 'hours ago'}`;

    if (diffDays < 7) return `${diffDays} ${CURRENT_LANG === 'tr' ? 'gün önce' : 'days ago'}`;

    return date.toLocaleDateString(CURRENT_LANG === 'tr' ? 'tr-TR' : 'en-US');

}



// Export for global access

window.showInlineFeedbackWidget = showInlineFeedbackWidget;

window.loadCommunityComments = loadCommunityComments;



console.log("­şôØ Feedback widget system loaded");

