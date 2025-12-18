console.log("🔥 opradox app.js VERSION: 2024-12-14-v3 - FLAGS AND ICONS ENABLED");
const BACKEND_BASE_URL = "http://127.0.0.1:8100"; // Direct backend URL for development

let SCENARIO_CATALOG = {};
let SCENARIO_LIST = [];

let UI_TEXTS = {};
let CURRENT_LANG = "tr";
let ACTIVE_SCENARIO_ID = null;
let LAST_RESULT_DATA = null;

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
        "run_btn": "Senaryoyu Çalıştır",
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
        "column_ref_note": "💡 Sütun adını <strong>tıklayarak kopyalayın</strong>, veya parametre alanına <strong>sütun adı</strong>, <strong>harf kodu (A, B...)</strong> yazın ya da <strong>listeden seçin</strong>. Birden fazla sütun için virgülle ayırın.",

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
        "pro_tab_output": "Çıktı",

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
        "tt_extract_parentheses": "Parantez İçini Çıkar",
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
        "arith_subtract": "Çıkar (-)",
        "arith_multiply": "Çarp (×)",
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
        "lbl_second_file_required": "İkinci Dosya Gerekli",
        "lbl_second_file_ref": "İkinci Dosya (Referans Liste) Gerekli",
        "lbl_main_file_col": "Ana Dosya Sütunu:",
        "lbl_second_file_col": "İkinci Dosya Sütunu:",
        "lbl_join_type": "Birleştirme Tipi:",
        "lbl_check_col": "Kontrol Edilecek Sütun:",
        "lbl_ref_col": "Referans Liste Sütunu:",
        "lbl_result_col_name": "Sonuç Sütun Adı:",
        "join_left": "SOL (VLOOKUP)",
        "join_inner": "ORTAK (Sadece Eşleşen)",
        "join_right": "SAĞ",
        "join_outer": "TAM (Tümü)",
        "union_desc": "İki dosya alt alta birleştirilecek. Sütunlar otomatik eşleştirilir.",
        "diff_result": "📌 Sonuç: Ana dosyada olup ikinci dosyada OLMAYAN kayıtlar",
        "validate_result": "📌 Sonuç: Yeni sütun eklenir → Geçerli / Geçersiz",
        "recommend_site": "Siteyi Tavsiye Et",
        "share_result": "Sonuç Paylaş",

        // === YENİ ÖZELLİKLER (2024) ===
        // Koşullu Biçimlendirme
        "lbl_add_cf": "Koşullu Biçimlendirme",
        "block_cf": "Koşullu Biçimlendirme",
        "cf_color_scale": "Renk Skalası (3 Renk)",
        "cf_2_color_scale": "Renk Skalası (2 Renk)",
        "cf_data_bar": "Veri Çubuğu",
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
        "cf_bar_color": "Çubuk Rengi",

        // Grafik
        "lbl_add_chart": "Grafik Ekle",
        "block_chart": "Grafik",
        "chart_column": "Sütun Grafik",
        "chart_bar": "Çubuk Grafik",
        "chart_line": "Çizgi Grafik",
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
        "comp_qoq_change": "QoQ (Çeyrekten Çeyreğe %)",
        "comp_date_hierarchy": "Tarih Hiyerarşisi",
        "ts_date_column": "Tarih Sütunu",
        "ts_value_column": "Değer Sütunu",

        // Çıktı Ayarları
        "lbl_add_output": "Çıktı Ayarları",
        "block_output": "Çıktı Ayarları",
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
        "cancel_job": "İptal Et"
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
        "column_ref_note": "💡 <strong>Click to copy</strong> column name, or type <strong>column name</strong>, <strong>letter code (A, B...)</strong> in parameter field, or <strong>select from dropdown</strong>. For multiple columns, separate with commas.",

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
        "lbl_second_file_required": "Second File Required",
        "lbl_second_file_ref": "Second File (Reference List) Required",
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
        "diff_result": "📌 Result: Records in main file but NOT in second file",
        "validate_result": "📌 Result: New column added → Valid / Invalid",
        "recommend_site": "Recommend Site",
        "share_result": "Share Result",

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
        "no_preview": "Upload a file first to preview."
    }
};

// Sayfa Yüklendiğinde Başlat
window.addEventListener("DOMContentLoaded", () => {
    // Önce Eventleri Bağla (Butonlar hazır olsun)
    bindEvents();

    // Tema Kontrolü
    if (localStorage.getItem("gm_theme") === "day") {
        document.body.classList.add("day-mode");
    }

    // Metinleri İlk Dile Göre Ayarla
    updateUITexts();

    // Veriyi Çek
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

async function inspectFile(file, sheetName = null, skipDropdownRebuild = false) {
    console.log("🔍 inspectFile called:", { fileName: file.name, sheetName, skipDropdownRebuild });

    const formData = new FormData();
    formData.append("file", file);

    // sheet_name'i URL query param olarak gönder (Form() ile sorun var)
    let url = `${BACKEND_BASE_URL}/ui/inspect`;
    if (sheetName) {
        url += `?sheet_name=${encodeURIComponent(sheetName)}`;
        console.log("📄 sheet_name in URL:", sheetName);
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        console.log(`✅ Backend: sheet="${data.active_sheet}" rows=${data.row_count} cols=${data.columns?.length} first="${data.columns?.[0]}"`);

        if (data.columns) {
            FILE_COLUMNS = data.columns;

            // Sheet bilgilerini kaydet (sadece ilk yüklemede)
            if (!skipDropdownRebuild && data.sheet_names && data.sheet_names.length > 0) {
                FILE_SHEET_NAMES = data.sheet_names;
                FILE_SELECTED_SHEET = data.active_sheet || data.sheet_names[0];
            }

            FILE_COLUMN_LETTERS = data.column_letters || {};
            updateColumnDatalist();
            showFileInfo(data, 1, skipDropdownRebuild);

            // YENİ (BUG 2 FIX): Cross-sheet dropdown'ları senkronize et
            // Sol panelden sayfa değişirse, cross-sheet UI'daki dropdown'lar da güncellenmeli
            document.querySelectorAll('.crosssheet-select').forEach(select => {
                // Sadece bu sheet mevcut seçeneklerde varsa güncelle
                const hasOption = Array.from(select.options).some(opt => opt.value === FILE_SELECTED_SHEET);
                if (hasOption && select.value !== FILE_SELECTED_SHEET) {
                    select.value = FILE_SELECTED_SHEET;
                    // CRITICAL FIX: Direkt fonksiyonu çağır (inline handler için synthetic event çalışmıyor)
                    onCrossSheetChange(select);
                    console.log('✓ Cross-sheet dropdown senkronize + triggered:', FILE_SELECTED_SHEET);
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
async function inspectFile2(file, sheetName = null, skipDropdownRebuild = false) {
    console.log("🔍 inspectFile2 called:", { fileName: file.name, sheetName, skipDropdownRebuild });

    const formData = new FormData();
    formData.append("file", file);

    // sheet_name'i URL query param olarak gönder
    let url = `${BACKEND_BASE_URL}/ui/inspect`;
    if (sheetName) {
        url += `?sheet_name=${encodeURIComponent(sheetName)}`;
        console.log("📄 file2 sheet_name in URL:", sheetName);
    }

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
        console.log(`✅ Backend response for file2:`, {
            sheet: data.active_sheet,
            rows: data.row_count,
            cols: data.columns?.length,
            firstCol: data.columns?.[0],
            hasColumns: !!data.columns
        });

        if (data.columns) {
            FILE2_COLUMNS = data.columns;
            console.log(`✓ FILE2_COLUMNS set:`, FILE2_COLUMNS.length, 'columns');

            // Sheet bilgilerini kaydet (sadece ilk yüklemede)
            if (!skipDropdownRebuild && data.sheet_names && data.sheet_names.length > 0) {
                FILE2_SHEET_NAMES = data.sheet_names;
                FILE2_SELECTED_SHEET = data.active_sheet || data.sheet_names[0];
                console.log(`✓ FILE2 sheets:`, FILE2_SHEET_NAMES.length, 'sheets, selected:', FILE2_SELECTED_SHEET);
            }

            updateColumnDatalist();
            showFileInfo(data, 2, skipDropdownRebuild); // İkinci dosya için

            // YENİ (PHASE 1): İkinci dosya sütunlarını datalist'e ekle
            updateFile2ColumnDatalist(data.columns);
            console.log('✓ updateFile2ColumnDatalist called with', data.columns.length, 'columns');

            // YENİ (PHASE 1): Tüm cross-sheet uyarılarını güncelle
            updateAllCrossSheetWarnings();
            console.log('✓ updateAllCrossSheetWarnings called after file2 inspect');

            // YENİ: PRO bloklarındaki uyarıları güncelle
            if (typeof updateProBlockWarnings === 'function') {
                updateProBlockWarnings();
            }
        } else {
            console.warn("⚠️ Backend returned NO columns for file2!");
        }
    } catch (err) {
        console.error("❌ File2 inspect error:", err);
        console.error("❌ Error details:", err.message, err.stack);
    }
}

// Dosya bilgi panelini göster
let FILE_PREVIEW_HTML = ''; // Ana dosya preview cache
let FILE2_PREVIEW_HTML = ''; // İkinci dosya preview cache

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
        console.log('✓ fileInfoPanel2 görünür yapıldı');
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

    // Önizle butonunu ekle
    let previewBtn = document.getElementById(previewBtnId);
    if (!previewBtn) {
        previewBtn = document.createElement("button");
        previewBtn.id = previewBtnId;
        previewBtn.className = "gm-btn-preview"; // Unified style
        // İkon mavi, yazı koyu/bold olması için span içine aldık
        previewBtn.innerHTML = `<i class="fas fa-table"></i> <span class="gm-preview-text">${EXTRA_TEXTS[CURRENT_LANG]?.preview_file || 'Dosyayı Önizle'}</span>`;
        previewBtn.onclick = () => showFilePreviewModal(fileNumber);
        panel.appendChild(previewBtn);
    }
}

// Dosya önizleme modalını göster (fileNumber: 1=ana, 2=ikinci)
window.showFilePreviewModal = function (fileNumber = 1) {
    const T = EXTRA_TEXTS[CURRENT_LANG];
    const previewHtml = fileNumber === 1 ? FILE_PREVIEW_HTML : FILE2_PREVIEW_HTML;
    const titlePrefix = fileNumber === 2 ? (CURRENT_LANG === 'tr' ? '(İkinci Dosya) ' : '(Second File) ') : '';

    // Modal oluştur veya mevcut olanı kullan
    let modal = document.getElementById("filePreviewModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "filePreviewModal";
        modal.className = "gm-modal";
        modal.innerHTML = `
            <div class="gm-modal-content" style="max-width: 90vw; max-height: 85vh; overflow: auto;">
                <div class="gm-modal-header">
                    <h3 id="previewModalTitle"><i class="fas fa-table"></i> ${T?.file_preview_title || 'Dosya Önizleme (İlk 10 Satır)'}</h3>
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
    const titleEl = document.getElementById("previewModalTitle");
    if (titleEl) {
        titleEl.innerHTML = `<i class="fas fa-table"></i> ${titlePrefix}${T?.file_preview_title || 'Dosya Önizleme (İlk 10 Satır)'}`;
    }

    // İçeriği yerleştir
    const content = document.getElementById("filePreviewContent");
    if (previewHtml) {
        content.innerHTML = previewHtml;
    } else {
        content.innerHTML = `<p style="color: var(--gm-text-muted);">${T?.no_preview || 'Önizleme için önce dosya yükleyin.'}</p>`;
    }

    modal.style.display = "flex";
};

// Sütun referansını kopyala veya input'a yapıştır
window.copyColumnRef = function (letter, name, chipEl) {
    // Aktif input varsa oraya yaz
    const activeInput = document.activeElement;
    if (activeInput && activeInput.tagName === "INPUT" && activeInput.getAttribute("list") === "colOptions") {
        activeInput.value = name;
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        showCopyFeedback(chipEl || event.target, "✓");
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
    chip.innerHTML = `<i class="fas fa-check"></i> ${text}`;
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
                    `<span class="gm-col-chip" style="font-size:0.75rem; padding:2px 6px; margin-right:4px; display:inline-block; background:rgba(255,255,255,0.1); border:1px solid var(--gm-card-border); border-radius:4px;">${c}</span>`
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
        ? (FILE_SHEET_NAMES || []).filter(s => s !== FILE_SELECTED_SHEET).map(s => `<option value="${s}">${s}</option>`).join('')
        : '';

    return `
    <!-- Tek Satır Second File Source -->
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
        
        <!-- İkinci Dosya Durum Mesajı -->
        <div class="gm-sf-warning" style="color:${hasSecondFile ? 'var(--gm-success)' : '#ef4444'}; font-size:0.75rem; ${hasMultipleSheets ? '' : 'flex:1;'}">
            ${hasSecondFile
            ? `<i class="fas fa-check-circle"></i> ${FILE2_NAME}`
            : `<i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_file_required || 'İkinci dosya yükleyin veya yukarıdan sayfa seçin'}`
        }
        </div>
    </div>`;
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
                warning.innerHTML = `<i class="fas fa-check-circle"></i> ${FILE2_NAME}`;
                warning.style.color = 'var(--gm-success)';
            } else {
                warning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> İkinci dosya yükleyin veya yukarıdan sayfa seçin`;
                warning.style.color = '#ef4444';
            }
            warning.style.display = 'block';
        }
    }
};

// YENİ: İkinci dosya yüklendiğinde tüm PRO bloklarındaki uyarıları güncelle
window.updateProBlockWarnings = function () {
    const T = EXTRA_TEXTS[CURRENT_LANG];
    document.querySelectorAll('.gm-pro-merge-source').forEach(container => {
        const checkbox = container.querySelector('.pro-use-crosssheet');
        const warning = container.querySelector('.gm-sf-warning');

        // Cross-sheet aktif değilse uyarıyı kontrol et
        if (!checkbox || !checkbox.checked) {
            if (warning) {
                if (FILE2_NAME) {
                    warning.innerHTML = `<i class="fas fa-check-circle"></i> ${FILE2_NAME}`;
                    warning.style.color = 'var(--gm-success)';
                } else {
                    warning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_file_required || 'İkinci dosya yükleyin veya yukarıdan sayfa seçin'}`;
                    warning.style.color = '#ef4444';
                }
            }
        }
    });
    console.log(`[updateProBlockWarnings] FILE2_NAME: ${FILE2_NAME}`);
};

// YENİ: Cross-sheet sütunlarını getir ve arayüzü güncelle
window.fetchCrossSheetColumns = async function (select) {
    const sheetName = select.value;
    console.log(`[DEBUG] fetchCrossSheetColumns çağrıldı. Sheet: ${sheetName}`);

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
    console.log(`[DEBUG] Fetching URL: ${url}`);

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
    if (!container) return;
    container.innerHTML = "";

    // Kategori İsimleri
    const niceNames = {
        "lookup_join": CURRENT_LANG === 'tr' ? "Veri Birleştirme" : "Lookup & Join",
        "counting_frequency": CURRENT_LANG === 'tr' ? "Sayma & Sıklık" : "Counting",
        "conditional_aggregation": CURRENT_LANG === 'tr' ? "Toplama & Ortalama" : "Aggregation",
        "data_tools_dynamic": CURRENT_LANG === 'tr' ? "Veri Araçları" : "Data Tools",
        "text_cleaning": CURRENT_LANG === 'tr' ? "Metin Temizleme" : "Cleaning",
        "reporting_pivot": CURRENT_LANG === 'tr' ? "Rapor & Pivot" : "Reporting",
        "charts_visualization": CURRENT_LANG === 'tr' ? "Grafik" : "Charts",
        "dates_durations": CURRENT_LANG === 'tr' ? "Tarih İşlemleri" : "Dates",
        "duplicates_uniques": CURRENT_LANG === 'tr' ? "Tekrar/Benzersiz" : "Duplicates",
        "stats": CURRENT_LANG === 'tr' ? "İstatistik" : "Stats",
        "conditional_formatting": CURRENT_LANG === 'tr' ? "Renklendirme" : "Formatting",
        "conditional_logic_segmentation": CURRENT_LANG === 'tr' ? "Mantıksal" : "Logic",
        "data_quality_validation": CURRENT_LANG === 'tr' ? "Veri Kalitesi" : "Quality",
        "other": CURRENT_LANG === 'tr' ? "Diğer" : "Other"
    };

    Object.keys(SCENARIO_CATALOG).forEach(catKey => {
        const scenarios = SCENARIO_CATALOG[catKey];
        if (!scenarios || scenarios.length === 0) return;

        const itemDiv = document.createElement("div");
        itemDiv.className = "gm-accordion-item";

        // Başlık Formatlama
        let title = niceNames[catKey] || catKey.replace(/_/g, " ");
        title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

        const headerBtn = document.createElement("button");
        headerBtn.className = "gm-accordion-header";
        headerBtn.innerHTML = `<span>${title}</span> <i class="fas fa-chevron-down"></i>`;

        const contentDiv = document.createElement("div");
        contentDiv.className = "gm-accordion-content";

        scenarios.forEach(sc => {
            const btn = document.createElement("button");
            btn.className = "gm-scenario-btn";
            btn.textContent = sc.title;
            btn.dataset.id = sc.id;
            btn.dataset.params = JSON.stringify(sc.params || []);

            if (sc.id === ACTIVE_SCENARIO_ID) btn.classList.add("active");

            btn.addEventListener("click", () => selectScenario(sc, btn));
            contentDiv.appendChild(btn);
        });

        headerBtn.addEventListener("click", () => {
            contentDiv.classList.toggle("open");
            headerBtn.querySelector("i").className = contentDiv.classList.contains("open") ? "fas fa-chevron-up" : "fas fa-chevron-down";
        });

        itemDiv.appendChild(headerBtn);
        itemDiv.appendChild(contentDiv);
        container.appendChild(itemDiv);
    });
}

async function selectScenario(scenario, btnElement) {
    document.querySelectorAll(".gm-scenario-btn").forEach(b => b.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");

    ACTIVE_SCENARIO_ID = scenario.id;
    document.getElementById("scenarioTitle").textContent = scenario.title;
    document.getElementById("scenarioSubtitle").textContent = scenario.short || "";

    let params = [];
    try { params = JSON.parse(btnElement.dataset.params); } catch (e) { }
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

// DİNAMİK FORM OLUŞTURUCU (TÜM TİPLER EKLENDİ)
function renderDynamicForm(scenarioId, params) {
    const container = document.getElementById("dynamicFormContainer");
    container.innerHTML = "";

    // ============================================================================
    // YENİ: PRO BUILDER BYPASS & GLOBAL OPTIONS INIT
    // ============================================================================

    // PRO Builder senaryosunu atla (dokunma!)
    if (scenarioId === 'custom-report-builder') {
        console.log('⚠️ PRO Builder detected - using existing code, skipping optional features');
        // Mevcut PRO Builder kodunu çalıştır (aşağıda devam ediyor)
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
            // Gerçek catalog ID'ler (verified from scenarios_catalog.json)
            'join-two-tables-key',
            'vlookup-single-match',
            'xlookup-single-match',
            'pq-append-tables',
            'validate-values-against-list',
            'concatenate-columns',
            'fallback-lookup',
            // Multi-column scenarios that benefit from cross-sheet
            'correlation-two-columns',
            'days-between-dates',
            'sum-between-dates',
            'pivot-multi-level',
            'percentiles-and-quartiles',
            'compute-age-from-dob',
            'find-inconsistent-casing',
            'highlight-top-bottom-n',
            'multi-condition-label-if',
            'outlier-flagging',
            'running-total-by-group',
            'score-cards-weighted-points',
            'filter-rows-by-condition'
        ];

        const needsCrossSheet = SECOND_FILE_SCENARIOS.includes(scenarioId);

        // BUG 4 FIX: İkinci dosya sütunları datalist'ini önceden hazırla
        // Form render edilmeden önce datalist hazır olmalı ki autocomplete çalışsın
        if (FILE2_COLUMNS && FILE2_COLUMNS.length > 0) {
            updateFile2ColumnDatalist(FILE2_COLUMNS);
            console.log('✓ BUG 4 FIX: file2-columns datalist rendered before form');
        }

        // TEMPORARY DEBUG: Force render for testing
        if (true) { // Was: if (needsCrossSheet)
            // Cross-sheet UI bloğunu formun başına ekle
            const csBlock = document.createElement('div');
            csBlock.className = 'gm-form-row';
            csBlock.innerHTML = getInlineCrossSheetHTML(`scenario_${scenarioId}`);
            form.appendChild(csBlock);
        }
        // ============================================================================

        // YENİ: Inline Cross-Sheet UI (Oyun Hamuru PRO tarzı)
        // Eğer senaryo ikinci dosya gerektiriyorsa, formun başına ekle
        const scenario = SCENARIO_LIST.find(s => s.id === scenarioId);
        if (scenario && scenario.requiresSecondFile) {

            const inlineCS = document.createElement('div');
            inlineCS.className = "gm-form-row";
            inlineCS.style.marginBottom = "20px";
            inlineCS.style.padding = "10px";
            inlineCS.style.border = "1px solid var(--gm-border)";
            inlineCS.style.borderRadius = "8px";
            inlineCS.style.backgroundColor = "var(--gm-bg-secondary)";

            // Başlık
            inlineCS.innerHTML = `<label style="color:var(--gm-primary); margin-bottom:10px; display:block;"><i class="fas fa-link"></i> İkinci Dosya / Cross-Sheet Kaynağı</label>`;

            // getInlineCrossSheetHTML fonksiyonunu kullan (PRO Builder ile aynı yapı)
            // ID çakışmasını önlemek için prefix kullanabiliriz veya direct DOM verip listener ekleyebiliriz.
            // Ancak getInlineCrossSheetHTML string dönüyor. Biz bunu 'dynamic-form' ID'si ile çağıralım.
            const csHTML = getInlineCrossSheetHTML("dynamic_form_cross_sheet");
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = csHTML;
            inlineCS.appendChild(contentDiv);

            form.appendChild(inlineCS);

            // Listenerları bağla (Inputlar DOM'a eklendikten sonra çalışacak, ama burada tanımlı olsun)
            setTimeout(() => {
                const toggle = document.querySelector(`input[name="cross_sheet_dynamic_form_cross_sheet"]`);
                if (toggle) {
                    toggle.onchange = (e) => {
                        toggleProMergeSource('dynamic_form_cross_sheet', e.target.checked);
                        // Sol paneli de güncelle (Senkronizasyon)
                        const globalOption = document.getElementById("crossSheetOption");
                        if (globalOption && globalOption.checked !== e.target.checked) {
                            globalOption.click();
                        }
                    };

                    // Başlangıç durumu (Global state ile senkronize et)
                    const globalOption = document.getElementById("crossSheetOption");
                    if (globalOption && globalOption.checked) {
                        toggle.checked = true;
                        toggleProMergeSource('dynamic_form_cross_sheet', true);
                    } else {
                        // Default olarak false ise uyarısını göster
                        updateProBlockWarnings();
                    }
                }
            }, 100);
        }

        params.forEach(p => {
            const row = document.createElement("div");
            row.className = "gm-form-row";

            // Etiket ve Açıklama
            const lbl = (CURRENT_LANG === 'tr' ? p.label_tr : p.label_en) || p.name;
            const desc = (CURRENT_LANG === 'tr' ? p.description_tr : p.description_en) || "";
            const ph = (CURRENT_LANG === 'tr' ? p.placeholder_tr : p.placeholder_en) || "";

            // Açıklamayı label altına küçük not olarak ekle
            row.innerHTML = `<label>${lbl} <span style="font-weight:400; font-size:0.75rem; color:var(--gm-primary); opacity:0.8; margin-left:5px;">(${desc})</span></label>`;

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
                    if (true) { // TEMP DEBUG: was needsCrossSheet
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

                // --- 1. TOOLBAR (Araç Çubuğu) - 2 SATIR + STICKY ---
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

                // ÜST SATIR: Temel İşlemler
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
                    { id: 'output', label: T.lbl_add_output || 'Çıktı Ayarları', icon: 'fa-file-excel', group: 'visualize' }
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

                // Üst satır butonları
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
                        if (type === 'output') { typeLabel = T.pro_tab_output || 'ÇIKTI'; typeColor = '#ec4899'; }
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
                                    <option value="countif">EĞERSAY (COUNTIF)</option>
                                    <option value="sumif">EĞERTOPLA (SUMIF)</option>
                                    <option disabled>──────────</option>
                                    <option value="ytd_sum">${T.comp_ytd_sum || 'YTD (Yıl Başından Bugüne)'}</option>
                                    <option value="mtd_sum">${T.comp_mtd_sum || 'MTD (Ay Başından Bugüne)'}</option>
                                    <option value="yoy_change">${T.comp_yoy_change || 'YoY Değişim (%)'}</option>
                                    <option value="qoq_change">${T.comp_qoq_change || 'QoQ Değişim (%)'}</option>
                                    <option value="date_hierarchy">${T.comp_date_hierarchy || 'Tarih Hiyerarşisi'}</option>
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
                                <input type="text" class="pro-group-cols" list="colOptions" placeholder="Bölge, Şehir..." style="width:100%;">
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
                                    <label>📊 ${T.pro_slicers || 'Tablo Filtreleri (Slicer)'}:</label>
                                    <input type="text" class="pro-out-slicers" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Filtre sütunları (virgülle)' : 'Filter columns (comma-separated)'}" style="width:100%;">
                                    <small style="color:var(--gm-text-muted); font-size:0.7rem;">${CURRENT_LANG === 'tr' ? 'Veri Excel Tablosuna dönüştürülür, filtre okları aktif olur.' : 'Data will be converted to Excel Table with filter dropdowns.'}</small>
                                </div>
                                <div>
                                    <label>💬 ${T.pro_col_descriptions || 'Sütun Açıklamaları'}:</label>
                                    <textarea class="pro-out-col-desc" placeholder='${CURRENT_LANG === 'tr' ? '{"SütunAdı": "Açıklama...", "Diğer": "Yorum..."}' : '{"ColumnName": "Description...", "Other": "Note..."}'}' style="width:100%; height:50px; font-size:0.75rem; resize:vertical;"></textarea>
                                    <small style="color:var(--gm-text-muted); font-size:0.7rem;">${CURRENT_LANG === 'tr' ? 'JSON formatında. Excel başlık hücrelerine yorum olarak eklenir.' : 'JSON format. Added as comments to Excel header cells.'}</small>
                                </div>
                            </div>
                        `;
                        } else if (type === 'merge') {
                            // BİRLEŞTİR - VLOOKUP / JOIN
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
                                
                                <!-- İkinci Dosya Gerekli Uyarısı -->
                                <div class="gm-sf-warning" style="color:#ef4444; font-size:0.75rem; ${hasMultipleSheets ? '' : 'flex:1;'}">
                                    <i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_file_required || 'İkinci dosya yükleyin veya yukarıdan sayfa seçin'}
                                </div>
                            </div>
                            
                            <!-- Birleştirme Parametreleri -->
                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">
                                <div style="flex:1; min-width:150px;">
                                    <label style="font-size:0.75rem;">${T.lbl_main_file_col || 'Ana Dosya Sütunu:'}</label>
                                    <input type="text" class="pro-merge-left" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Örn: Ürün Kodu' : 'e.g. Product ID'}" style="width:100%;">
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
                                        <option value="right">${T.join_right || 'SAĞ'}</option>
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
                                📌 ${CURRENT_LANG === 'tr'
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
                                    ? '📌 Sonuç: Ana dosyada olup ikinci dosyada OLMAYAN kayıtlar'
                                    : '📌 Result: Records in main file but NOT in second file'}
                            </div>
                        `;
                        } else if (type === 'validate') {
                            // DOĞRULA - VALIDATE
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
                                    ? '📌 Sonuç: Yeni sütun eklenir → Geçerli / Geçersiz'
                                    : '📌 Result: New column added → Valid / Invalid'}
                            </div>
                        `;
                        } else if (type === 'conditional_format') {
                            // KOŞULLU BİÇİMLENDİRME - CONDITIONAL FORMATTING
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
                                        <option value="data_bar">${T.cf_data_bar || 'Veri Çubuğu'}</option>
                                        <option value="icon_set">${T.cf_icon_set || 'İkon Seti'}</option>
                                        <option value="threshold">${T.cf_threshold || 'Eşik Değer'}</option>
                                        <option value="top_n">${T.cf_top_n || 'En Yüksek N'}</option>
                                        <option value="bottom_n">${T.cf_bottom_n || 'En Düşük N'}</option>
                                        <option value="duplicate">${T.cf_duplicate || 'Tekrarlananlar'}</option>
                                        <option value="unique">${T.cf_unique || 'Benzersizler'}</option>
                                    </select>
                                </div>
                            </div>
                            <div id="${uniqueCfId}" class="pro-cf-options" style="margin-top:10px;">
                                <!-- 3 Renk Skalası (varsayılan) -->
                                <div class="cf-color-fields" style="display:flex; gap:8px; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:90px;">
                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">🔴 ${CURRENT_LANG === 'tr' ? 'Min (Düşük)' : 'Min (Low)'}</label>
                                        <input type="color" class="pro-cf-min-color" value="#F8696B" style="width:100%; height:30px; border:none; cursor:pointer;">
                                    </div>
                                    <div class="cf-mid-color" style="flex:1; min-width:90px;">
                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">🟡 ${CURRENT_LANG === 'tr' ? 'Orta (Medyan)' : 'Mid (Median)'}</label>
                                        <input type="color" class="pro-cf-mid-color" value="#FFEB84" style="width:100%; height:30px; border:none; cursor:pointer;">
                                    </div>
                                    <div style="flex:1; min-width:90px;">
                                        <label style="font-size:0.7rem; color:var(--gm-text-muted);">🟢 ${CURRENT_LANG === 'tr' ? 'Max (Yüksek)' : 'Max (High)'}</label>
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
                            </div>
                            <div style="margin-top:8px; font-size:0.7rem; color:var(--gm-text-muted);">
                                💡 ${CURRENT_LANG === 'tr' ? 'Renk kutularına tıklayarak renk seçebilirsiniz' : 'Click color boxes to choose colors'}
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
                                        <option value="bar">${T.chart_bar || 'Çubuk Grafik'}</option>
                                        <option value="line">${T.chart_line || 'Çizgi Grafik'}</option>
                                        <option value="area">${T.chart_area || 'Alan Grafik'}</option>
                                        <option value="pie">${T.chart_pie || 'Pasta Grafik'}</option>
                                        <option value="doughnut">${T.chart_doughnut || 'Halka Grafik'}</option>
                                        <option value="scatter">${T.chart_scatter || 'Dağılım Grafiği'}</option>
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
                            // PİVOT - PIVOT TABLE (GELİŞTİRİLMİŞ)
                            body.innerHTML = `
                            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">
                                <div style="flex:2; min-width:150px;">
                                    <label style="font-size:0.75rem;">${T.pivot_rows || 'Satır Alanları'}</label>
                                    <input type="text" class="pro-pivot-rows" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Gruplama sütunları (virgülle)' : 'Group columns (comma separated)'}" style="width:100%;">
                                </div>
                                <div style="flex:1; min-width:120px;">
                                    <label style="font-size:0.75rem;">${T.pivot_cols || 'Sütun Alanları (Opsiyonel)'}</label>
                                    <input type="text" class="pro-pivot-cols" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Çapraz tablo için' : 'For cross-tab'}" style="width:100%;">
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
                                    <label style="font-size:0.75rem;">${CURRENT_LANG === 'tr' ? 'Çıktı Adı (Alias)' : 'Output Name (Alias)'}</label>
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
                                💡 ${CURRENT_LANG === 'tr'
                                    ? 'İpucu: Alias ile çıktı sütun adını değiştirebilir, Yüzde ile değerleri oransal gösterebilirsiniz.'
                                    : 'Tip: Use Alias to rename output columns, Percentage to show values as ratios.'}
                            </div>
                        `;
                        } else if (type === 'variable') {
                            // WHAT-IF DEĞİŞKENİ - VARIABLE
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
                                💡 ${T.var_hint || (CURRENT_LANG === 'tr' ? 'Hesaplamalarda $DeğişkenAdı şeklinde kullanın' : 'Use $VariableName in calculations')}
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
                                    <option value="extract_parentheses">${T.tt_extract_parentheses || 'Parantez İçini Çıkar'}</option>
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
                                ${type === 'ytd_sum' ? '📊 Yıl içinde kümülatif toplam hesaplar' :
                                    type === 'mtd_sum' ? '📊 Ay içinde kümülatif toplam hesaplar' :
                                        type === 'yoy_change' ? '📊 Geçen yılın aynı dönemiyle karşılaştırır (%)' :
                                            '📊 Önceki çeyrekle karşılaştırır (%)'}
                            </div>
                         `;
                        } else if (type === 'date_hierarchy') {
                            // TARİH HİYERARŞİSİ
                            div.innerHTML = `
                            <div style="display:flex; gap:8px; flex-wrap:wrap; width:100%;">
                                <div style="flex:1; min-width:150px;">
                                    <label style="font-size:0.75rem;">${T.ts_date_column || 'Tarih Sütunu'}</label>
                                    <input type="text" class="pro-ts-date" list="colOptions" placeholder="${CURRENT_LANG === 'tr' ? 'Tarih sütunu' : 'Date column'}" style="width:100%;">
                                </div>
                            </div>
                            <div style="margin-top:8px; font-size:0.75rem; color:var(--gm-text-muted);">
                                📅 Otomatik olarak Yıl, Ay, Gün, Çeyrek, Hafta sütunları oluşturur
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
                                        // TARİH HİYERARŞİSİ
                                        const dateCol = body.querySelector('.pro-ts-date')?.value.trim();
                                        if (dateCol) {
                                            actions.push({
                                                type: 'computed',
                                                name: name,
                                                ctype: 'date_hierarchy',
                                                date_column: dateCol
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
                                    column_descriptions: Object.keys(colDescriptions).length > 0 ? colDescriptions : null
                                });
                            } else if (type === 'merge') {
                                // İKİNCİ DOSYA - BİRLEŞTİR (VLOOKUP/JOIN)
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
                                // İKİNCİ DOSYA - DOĞRULA
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
                                // KOŞULLU BİÇİMLENDİRME
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
                                        y_column: yCol,
                                        title: body.querySelector('.pro-chart-title')?.value.trim() || ''
                                    });
                                }
                            } else if (type === 'pivot') {
                                // PİVOT TABLO (GELİŞTİRİLMİŞ)
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
                                // WHAT-IF DEĞİŞKENİ
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
                // Çünkü kullanıcı bunu yukarıdaki Inline UI veya Sol Panelden yapacak.
                if (scenarioNeedsSecondFile && (pName === 'lookup_df' || (p.type === 'dynamic_list' && pLabel.includes('dosya')) || (pName === 'reference_list' && !pLabel.includes('değer')))) {
                    // Gizli input oluştur (Gerekiyorsa değer taşımak için, ama runScenario zaten file2 kullanıyor)
                    // Sadece ekrana basma.
                    return;
                }

                const inp = document.createElement("input");
                inp.type = "text"; // Default to text input
                inp.name = p.name;
                inp.placeholder = ph;

                // 2. Sütun Datalist Kaynağı Seçimi
                if (scenarioNeedsSecondFile && isSecondFileParam && !pName.includes('key_column') && !pName.includes('anahtar')) { // Anahtar sütun bazen 1. dosyadır, dikkat.
                    // Genellikle 'key_column' 1. dosya, 'lookup_key_column' 2. dosyadır.
                    if (pName.includes('lookup') || pName.includes('return') || pName.includes('target') || pName.includes('reference')) {
                        inp.setAttribute('list', 'file2-columns');
                    } else {
                        inp.setAttribute('list', 'colOptions');
                    }
                } else if (scenarioNeedsSecondFile && isSecondFileParam && (pName.includes('lookup_key') || pName.includes('right_on'))) {
                    // Explicit 2. dosya anahtar isimleri
                    inp.setAttribute('list', 'file2-columns');
                } else {
                    inp.setAttribute('list', 'colOptions'); // Varsayılan: 1. dosya
                }

                if (p.required !== false) inp.required = true;
                row.appendChild(inp);
            }
            form.appendChild(row);
        });

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

        const btn = document.createElement("button");
        btn.type = "submit";
        btn.className = "gm-gradient-btn";
        btn.textContent = EXTRA_TEXTS[CURRENT_LANG].run_btn;
        btn.style.width = "100%";
        form.appendChild(btn);
        container.appendChild(form);
    } catch (err) {
        console.error("Form Render Error:", err);
        container.innerHTML = `<div class="gm-info-box" style="border-left-color:#ef4444; background:rgba(239,68,68,0.1);">
            <i class="fas fa-bug" style="color:#ef4444"></i> <strong>Form Hatası:</strong> ${err.message}<br>
            <small style="opacity:0.8;">Lütfen sayfayı yenileyip tekrar deneyin.</small>
        </div>`;
    }
}

// SONUÇ GÖSTERME FONKSİYONU (Dil değişimi için ayrıldı)
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

    // 1. ÖZET (EN ÜSTTE) - Başlık + Tek Satır Format
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

        // YENİ SENARYO BUTONU (Üstte, Kompakt, Başlangıçta Gizli)
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
                        shareText = `📊 opradox Raporu | ${shareData.filename}\n🔗 ${shareUrl}\n⏰ 24 saat geçerli`;
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
            ? '⏰ Shared links are valid for 24 hours. After that, the link will expire.'
            : '⏰ Paylaşılan linkler 24 saat geçerlidir. Süre sonunda link kullanılamaz hale gelecektir.';
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
            ? '✅ Cleared! You can now select a new scenario from the left menu.'
            : '✅ Temizlendi! Sol menüden yeni bir senaryo seçebilirsiniz.';
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
        const codeText = `🐍 opradox Kod\n\n# ${scTitle}\n\n${textToCopyDefault}\n\n#Python #opradox`;

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

        // Social/Email buttons in dropdown (TÜM ÖĞELER - FOTO 2 İKON STİLİ)
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
                }).join(' • ');
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

// SENARYO ÇALIŞTIRMA
async function runScenario(scenarioId) {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files[0]) { alert(CURRENT_LANG === 'tr' ? "Lütfen dosya yükleyin!" : "Please upload a file!"); return; }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    // YENİ: Sheet parametresini ekle (seçili sayfa)
    if (FILE_SELECTED_SHEET) {
        formData.append("sheet_name", FILE_SELECTED_SHEET);
    }

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
            console.warn("⚠️ Cross-sheet mode active but NO sheet name selected!");
        }
    } else if (fileInput2 && fileInput2.files[0]) {
        // Normal mod: ayrı dosya yükle
        formData.append("file2", fileInput2.files[0]);

        // İkinci dosya için sheet parametresi
        if (FILE2_SELECTED_SHEET) {
            formData.append("sheet_name2", FILE2_SELECTED_SHEET);
        }
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
            if (el.type === 'hidden' && el.id && el.id.startsWith('pro_config_')) {
                const configName = el.name;
                if (window.serializeProConfig) {
                    el.value = JSON.stringify(window.serializeProConfig(configName));
                }
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
        } else { throw new Error(data.detail); }
    } catch (e) {
        if (statusDiv) statusDiv.textContent = ""; // Clear loading on error
        alert("Hata: " + e.message);
    }
}

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


// KILAVUZ YÜKLEME
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
                <button class="gm-emoji-btn" onclick="toggleReaction(this)">👍 0</button>
                <button class="gm-emoji-btn" onclick="toggleReaction(this)">👎 0</button>
                <button class="gm-emoji-btn" onclick="toggleReaction(this)">🔥 0</button>
                <button class="gm-emoji-btn" onclick="toggleReaction(this)">😂 0</button>
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

// BIND EVENTS (BUTONLARI BAĞLA)
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
            document.getElementById("selectedFileName").textContent = e.target.files[0].name;
            updateUITexts();
            document.querySelector(".gm-file-label").style.borderColor = "var(--gm-success)";
            CURRENT_FILE = e.target.files[0]; // YENİ: Dosya referansını kaydet
            inspectFile(e.target.files[0]); // Inspect columns
        }
    });
    const f2 = document.getElementById("fileInput2");
    if (f2) {
        f2.addEventListener("change", (e) => {
            console.log("📂 File2 change event triggered:", e.target.files.length, "files");
            if (e.target.files[0]) {
                FILE2_NAME = e.target.files[0].name; // Global değişkeni güncelle
                console.log("✓ File2 selected:", FILE2_NAME);
                document.getElementById("selectedFileName2").textContent = FILE2_NAME;
                document.getElementById("dropZone2").style.borderColor = "var(--gm-success)";
                CURRENT_FILE2 = e.target.files[0]; // İkinci dosya referansını kaydet
                console.log("🚀 Calling inspectFile2...");
                inspectFile2(e.target.files[0]); // İkinci dosyayı da analiz et
            } else {
                console.warn("⚠️ File2 change event but no file selected");
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
            const shareText = '📊 opradox - Excel Doktoru | Verini analiz et, raporla!';
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
                shareText = `📊 opradox ile analiz yaptım!\n\n📌 ${scenarioTitle}\n📈 ${cleanSummary}...\n\n🔗 Sen de dene:`;
                shareUrl = SITE_URL;
            } else {
                shareText = '📊 opradox - Excel Doktoru';
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
    document.getElementById("sendCommentBtn").addEventListener("click", () => {
        const txt = document.getElementById("publicComment");
        if (txt.value.trim()) { renderComment(txt.value); txt.value = ""; }
    });

    // 6. Dil Değiştirme
    document.getElementById("langToggle").addEventListener("click", async () => {
        CURRENT_LANG = CURRENT_LANG === "tr" ? "en" : "tr";
        await loadMenuData(CURRENT_LANG);

        // Eğer LAST_RESULT_DATA aktif senaryoya aitse yeniden render et, değilse temizle
        if (LAST_RESULT_DATA && LAST_RESULT_DATA.scenario_id === ACTIVE_SCENARIO_ID) {
            renderScenarioResult(LAST_RESULT_DATA);
        } else {
            // Sonuç alanını temizle - senaryo uyumsuz
            const resultArea = document.getElementById("resultArea");
            if (resultArea) resultArea.innerHTML = "";
            LAST_RESULT_DATA = null;
        }
    });

    // 7. Tema Değiştirme
    document.getElementById("themeToggle").addEventListener("click", () => {
        document.body.classList.toggle("day-mode");
        const mode = document.body.classList.contains("day-mode") ? "day" : "dark";
        localStorage.setItem("gm_theme", mode);
    });

    // 8. Modal (Bize Ulaşın)
    const modal = document.getElementById("contactModal");
    document.querySelector(".gm-close-modal").addEventListener("click", () => modal.classList.remove("show"));
    window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });
}

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

    console.log(`✓ updateFile2ColumnDatalist: ${columns.length} sütun eklendi`);
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
        
        <!-- İkinci Dosya Gerekli Uyarısı -->
        <div class="sf-warning" style="color:#ef4444; font-size:0.75rem; ${!hasSecondFile ? '' : 'display:none;'} ${hasMultipleSheets ? '' : 'flex:1;'}">
            <i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_file_required || 'İkinci dosya yükleyin veya yukarıdan sayfa seçin'}
        </div>
    </div>
    `;
}

// DİNAMİK FORM OLUŞTURUCU (TÜM TİPLER EKLENDİ)
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

    console.log(`✓ updateFile2ColumnDatalist: ${columns.length} sütun eklendi`);
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
        
        <!-- İkinci Dosya Gerekli Uyarısı -->
        <div class="sf-warning" style="color:#ef4444; font-size:0.75rem; ${!hasSecondFile ? '' : 'display:none;'} ${hasMultipleSheets ? '' : 'flex:1;'}">
            <i class="fas fa-exclamation-triangle"></i> ${T.lbl_second_file_required || 'İkinci dosya yükleyin veya yukarıdan sayfa seçin'}
        </div>
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
        console.log('✓ Cross-sheet mode: inputlar colOptions kullanıyor');

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
        console.log('✓ İkinci dosya mode: inputlar file2-columns kullanıyor');

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
            // file2-columns DEĞİL!
            let datalist = document.getElementById('colOptions');
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = 'colOptions';
                document.body.appendChild(datalist);
            }
            datalist.innerHTML = data.columns.map(col =>
                `<option value="${col}">${col}</option>`
            ).join('');

            console.log(`✓ Cross-sheet: "${sheetName}" sayfası yüklendi, ${data.columns.length} sütun, colOptions güncellendi`);
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
                console.log('✓ Warning gizlendi:', isCheckboxChecked ? 'cross-sheet aktif' : 'file2 var');
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
