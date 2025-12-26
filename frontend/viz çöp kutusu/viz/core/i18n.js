// =====================================================
// I18N.JS - Localization / Çoklu Dil Desteği
// =====================================================

import { VIZ_STATE } from './state.js';

/**
 * Lokalizasyon metinleri (TR/EN)
 */
export const VIZ_TEXTS = {
    tr: {
        viz_subtitle: 'Visual Studio',
        data_columns: 'Veri Sütunları',
        drop_excel: 'Excel dosyası sürükleyin',
        no_data_loaded: 'Veri yükleyin',
        chart_types: 'Grafik Tipleri',
        chart_bar: 'Sütun',
        chart_line: 'Çizgi',
        chart_pie: 'Pasta',
        chart_area: 'Alan',
        chart_scatter: 'Dağılım',
        chart_doughnut: 'Halka',
        dashboard: 'Dashboard',
        live: 'CANLI',
        add_chart: 'Grafik Ekle',
        empty_dashboard_title: "Dashboard'unuz Boş",
        empty_dashboard_desc: 'Sol taraftan grafik tipini sürükleyin veya "Grafik Ekle" butonuna tıklayın',
        chart_settings: 'Grafik Ayarları',
        select_chart: 'Düzenlemek için bir grafik seçin',
        chart_title: 'Grafik Başlığı',
        x_axis: 'X Ekseni (Kategori)',
        y_axis: 'Y Ekseni (Değer)',
        aggregation: 'Agregasyon',
        agg_sum: 'Toplam',
        agg_avg: 'Ortalama',
        agg_count: 'Sayı',
        agg_min: 'Minimum',
        agg_max: 'Maksimum',
        color: 'Renk',
        apply: 'Uygula',
        delete_chart: 'Grafiği Sil',
        save: 'Kaydet',
        export: 'Export',
        file_loaded: 'Dosya yüklendi',
        error: 'Hata',
        chart_added: 'Grafik eklendi',
        // Faz 1 yeni metinler
        export_png: 'PNG olarak indir',
        export_pdf: 'PDF olarak indir',
        save_dashboard: 'Dashboard kaydet',
        load_dashboard: 'Dashboard yükle',
        dashboard_saved: 'Dashboard kaydedildi',
        dashboard_loaded: 'Dashboard yüklendi',
        no_saved_dashboard: 'Kayıtlı dashboard bulunamadı',
        export_success: 'Export başarılı',
        loading: 'Yükleniyor...',
        // Faz 2 istatistik metinleri
        stats_overlay: 'İstatistik Overlay',
        show_mean: 'Ortalama Çizgisi',
        show_median: 'Medyan Çizgisi',
        show_std_band: 'Standart Sapma Bandı (±1σ)',
        show_trend: 'Trend Çizgisi',
        stats_summary: 'İstatistik Özeti',
        stat_mean: 'Ortalama',
        stat_median: 'Medyan',
        stat_stdev: 'Std Sapma',
        stat_min: 'Min',
        stat_max: 'Maks',
        stat_count: 'Sayı',
        // Faz 3 ileri grafik metinleri
        basic_charts: 'Temel',
        advanced_charts: 'İleri',
        chart_dual_axis: 'Dual-Axis',
        chart_stacked: 'Yığın',
        chart_treemap: 'Treemap',
        chart_heatmap: 'Isı Haritası',
        chart_funnel: 'Huni',
        chart_gauge: 'Gösterge',
        chart_waterfall: 'Şelale',
        chart_radar: 'Radar',
        chart_boxplot: 'Kutu',
        chart_pareto: 'Pareto',
        // Faz 4 3D grafik metinleri
        '3d_charts': '3D',
        chart_scatter3d: '3D Dağılım',
        chart_bar3d: '3D Sütun',
        chart_surface3d: '3D Yüzey',
        chart_line3d: '3D Çizgi',
        // Faz 5-9 yeni metinler
        statistical_analysis: 'İstatistiksel Analiz',
        bi_insights: 'BI İçgörüleri',
        data_profile: 'Veri Profili',
        run_analysis: 'Analiz Çalıştır',
        what_if_simulator: 'Ne Olur Simülatörü',
        anomaly_detection: 'Anomali Tespiti',
        trend_insight: 'Trend İçgörüsü',
        regression_type: 'Regresyon Tipi',
        linear: 'Doğrusal',
        polynomial: 'Polinom',
        exponential: 'Üstel',
        logarithmic: 'Logaritmik',
        t_test: 't-Test',
        anova: 'ANOVA',
        correlation: 'Korelasyon',
        normality: 'Normallik',
        cross_filter: 'Çapraz Filtre',
        detect_anomalies: 'Anomali Tespit',
        anomalies_found: 'anomali bulundu',
        no_anomaly: 'Anomali tespit edilmedi ✓',
        trend_up: 'Yukarı yönlü trend',
        trend_down: 'Aşağı yönlü trend',
        trend_stable: 'Stabil (belirgin trend yok)',
        data_analysis: 'Veri Analizi',
        total_rows: 'Toplam Satır',
        total_columns: 'Toplam Sütun',
        data_quality: 'Veri Kalitesi',
        column_types: 'Sütun Tipleri',
        missing_values: 'Eksik Değerler',
        no_missing: 'Eksik değer yok ✓',
        // Faz 6 - Yeni Modal Metinleri
        google_sheets_title: 'Google Sheets Bağlantısı',
        google_sheets_desc: 'Google Sheets\'ten veri çekmek için Spreadsheet ID girin veya OAuth ile bağlanın.',
        spreadsheet_id: 'Spreadsheet ID',
        spreadsheet_id_hint: 'URL\'deki /d/ ile /edit arasındaki kod',
        sheet_name: 'Sayfa Adı (opsiyonel)',
        fetch_data: 'Veriyi Çek',
        connect_google: 'Google ile Bağlan (OAuth)',
        sql_title: 'SQL Veri Kaynağı',
        connection_string: 'Bağlantı String\'i',
        connection_hint: 'PostgreSQL, MySQL, SQLite, SQL Server desteklenir',
        test_connection: 'Bağlantıyı Test Et',
        sql_query: 'SQL Sorgusu (sadece SELECT)',
        max_rows: 'Max Satır',
        run_query: 'Sorguyu Çalıştır',
        tables: 'Tablolar',
        collab_title: 'Canlı İşbirliği',
        collab_desc: 'Aynı dashboard üzerinde gerçek zamanlı çalışın.',
        room_id: 'Oda ID',
        username: 'Kullanıcı Adı',
        join_room: 'Odaya Katıl',
        connected: 'Bağlı',
        users: 'Kullanıcı',
        schedule_title: 'Zamanlanmış Raporlar',
        report_name: 'Rapor Adı',
        recipients: 'Alıcılar (virgülle ayırın)',
        period: 'Periyot',
        daily: 'Günlük',
        weekly: 'Haftalık',
        monthly: 'Aylık',
        time: 'Saat',
        format: 'Format',
        create_report: 'Rapor Oluştur',
        existing_reports: 'Mevcut Raporlar',
        active: 'Aktif',
        inactive: 'Pasif',
        stop: 'Durdur',
        start: 'Başlat',
        run_now: 'Şimdi Çalıştır',
        join_title: 'Veri Birleştirme (JOIN)',
        left_table: 'Sol Tablo',
        right_table: 'Sağ Tablo',
        left_key: 'Sol Anahtar Sütun',
        right_key: 'Sağ Anahtar Sütun',
        join_type: 'Birleştirme Tipi',
        left_join: 'Left Join (Sol tablo tüm satırlar)',
        inner_join: 'Inner Join (Ortak satırlar)',
        outer_join: 'Outer Join (Tüm satırlar)',
        right_join: 'Right Join (Sağ tablo tüm satırlar)',
        merge: 'Birleştir',
        merging: 'Birleştiriliyor...',
        merged_success: 'Birleştirildi!',
        rows_created: 'satır oluşturuldu',
        regression_title: 'Regresyon Analizi',
        target_variable: 'Hedef Değişken (Y)',
        predictor_variables: 'Tahmin Değişkenleri (X)',
        regression_type_label: 'Regresyon Tipi',
        linear_reg: 'Doğrusal (Linear)',
        polynomial_reg: 'Polinom (2. derece)',
        logistic_reg: 'Logistic (Binary hedef için)',
        analyze: 'Analiz Et',
        coefficients: 'Katsayılar',
        regression_complete: 'Regresyon tamamlandı',
        insights_title: 'Akıllı İçgörüler',
        analyzed: 'Analiz Edilen',
        rows: 'satır',
        columns: 'sütun',
        add_as_widget: 'Widget Olarak Ekle',
        calculating_insights: 'İçgörüler hesaplanıyor...',
        need_two_datasets: 'JOIN için en az 2 veri seti gerekli. Önce iki dosya yükleyin.',
        dataset_files_not_found: 'Veri seti dosyaları bulunamadı',
        load_data_first: 'Önce dosya yükleyin',
        need_two_numeric: 'Regresyon için en az 2 sayısal sütun gerekli',
        select_one_predictor: 'En az 1 tahmin değişkeni seçin',
        spreadsheet_id_required: 'Spreadsheet ID gerekli',
        connection_required: 'Bağlantı ve sorgu gerekli',
        room_id_required: 'Oda ID gerekli',
        report_name_required: 'Rapor adı ve en az 1 alıcı gerekli',
        connection_success: 'Bağlantı başarılı!',
        joined_room: 'odasına bağlandı!',
        left_room: 'İşbirliği odasından çıkıldı',
        connection_closed: 'İşbirliği bağlantısı kapandı',
        user_joined: 'odaya katıldı',
        user_left: 'odadan ayrıldı',
        loading_reports: 'Yükleniyor...',
        no_reports_yet: 'Henüz zamanlanmış rapor yok',
        oauth_window_opened: 'Google OAuth penceresi açıldı',
        loaded_from_sheets: 'satır Google Sheets\'ten yüklendi',
        loaded_from_sql: 'satır SQL\'den yüklendi',
        row_limit: 'satır limiti',
        // PDF Preview & Eksik Anahtarlar
        pdf_preview: 'PDF Önizleme',
        download_pdf: 'PDF İndir',
        close: 'Kapat',
        statistics: 'İstatistik Analizleri',
        special_charts: 'Özel Grafikler',
        map_charts: 'Harita Grafikleri',
        data_management: 'Veri Yönetimi',
        select_dataset: 'Veri Seti',
        theme_changed: 'Tema değiştirildi',
        pdf_generating: 'PDF oluşturuluyor...',
        pdf_ready: 'PDF hazır',

        // =====================================================
        // HATA MESAJLARI / ERROR MESSAGES (Kritik TR/EN)
        // =====================================================

        // Dosya/Veri Hataları
        err_file_load: 'Dosya yüklenemedi',
        err_file_type: 'Desteklenmeyen dosya türü. Excel (.xlsx, .xls) veya CSV (.csv) yükleyin.',
        err_file_empty: 'Dosya boş veya okunamadı',
        err_file_too_large: 'Dosya çok büyük. Maksimum 50MB destekleniyor.',
        err_parse_error: 'Dosya ayrıştırılamadı. Format hatası olabilir.',
        err_no_data: 'Veri bulunamadı',
        err_no_columns: 'Sütun bulunamadı',
        err_invalid_header: 'Geçersiz başlık satırı',

        // Grafik Hataları
        err_chart_render: 'Grafik oluşturulamadı',
        err_chart_no_data: 'Grafik için veri yok',
        err_chart_invalid_config: 'Geçersiz grafik yapılandırması',
        err_chart_3d_not_supported: '3D grafikler için ECharts GL gerekli',
        err_no_numeric_column: 'Sayısal sütun bulunamadı',
        err_select_columns: 'Lütfen X ve Y eksenlerini seçin',

        // Backend/API Hataları
        err_server_error: 'Sunucu hatası oluştu',
        err_network_error: 'Ağ bağlantısı başarısız',
        err_timeout: 'İstek zaman aşımına uğradı',
        err_unauthorized: 'Yetkilendirme hatası',
        err_forbidden: 'Bu işlem için yetkiniz yok',
        err_not_found: 'Kaynak bulunamadı',
        err_bad_request: 'Geçersiz istek',

        // İstatistik Hataları
        err_stat_no_data: 'Analiz için yeterli veri yok',
        err_stat_non_numeric: 'Bu analiz için sayısal veri gerekli',
        err_stat_min_rows: 'En az 3 satır veri gerekli',
        err_stat_column_not_found: 'Seçilen sütun bulunamadı',
        err_stat_calculation: 'İstatistik hesaplanamadı',

        // Genel Uyarılar
        warn_partial_data: 'Bazı veriler eksik veya hatalı',
        warn_truncated: 'Sonuçlar kısaltıldı',
        warn_slow_operation: 'Bu işlem uzun sürebilir',

        // Başarı Mesajları
        success_file_loaded: 'Dosya başarıyla yüklendi',
        success_chart_created: 'Grafik oluşturuldu',
        success_data_saved: 'Veriler kaydedildi',
        success_export_complete: 'Export tamamlandı',
        success_analysis_complete: 'Analiz tamamlandı',

        // UI Aksiyon Mesajları
        ui_chart_selected: 'Grafik seçildi - sağ panelden düzenleyebilirsiniz',
        ui_normal_view: 'Normal görünüm',
        ui_fullscreen_exit: 'Tam ekran - çarktan "Küçült" ile çıkın',
        ui_chart_copied: 'Grafik kopyalandı',
        ui_widget_removed: 'Widget silindi',
        ui_no_data_for_analysis: 'Analiz için veri yükleyin',
        ui_select_x_y: 'X ve Y eksenlerini seçin',
        ui_processing: 'İşleniyor...',
        ui_done: 'Tamamlandı'
    },

    en: {
        viz_subtitle: 'Visual Studio',
        data_columns: 'Data Columns',
        drop_excel: 'Drop Excel file here',
        no_data_loaded: 'Load data',
        chart_types: 'Chart Types',
        chart_bar: 'Bar',
        chart_line: 'Line',
        chart_pie: 'Pie',
        chart_area: 'Area',
        chart_scatter: 'Scatter',
        chart_doughnut: 'Doughnut',
        dashboard: 'Dashboard',
        live: 'LIVE',
        add_chart: 'Add Chart',
        empty_dashboard_title: 'Your Dashboard is Empty',
        empty_dashboard_desc: 'Drag a chart type from left panel or click "Add Chart"',
        chart_settings: 'Chart Settings',
        select_chart: 'Select a chart to edit',
        chart_title: 'Chart Title',
        x_axis: 'X Axis (Category)',
        y_axis: 'Y Axis (Value)',
        aggregation: 'Aggregation',
        agg_sum: 'Sum',
        agg_avg: 'Average',
        agg_count: 'Count',
        agg_min: 'Minimum',
        agg_max: 'Maximum',
        color: 'Color',
        apply: 'Apply',
        delete_chart: 'Delete Chart',
        save: 'Save',
        export: 'Export',
        file_loaded: 'File loaded',
        error: 'Error',
        chart_added: 'Chart added',
        // Phase 1
        export_png: 'Download as PNG',
        export_pdf: 'Download as PDF',
        save_dashboard: 'Save Dashboard',
        load_dashboard: 'Load Dashboard',
        dashboard_saved: 'Dashboard saved',
        dashboard_loaded: 'Dashboard loaded',
        no_saved_dashboard: 'No saved dashboard found',
        export_success: 'Export successful',
        loading: 'Loading...',
        // Phase 2
        stats_overlay: 'Statistics Overlay',
        show_mean: 'Mean Line',
        show_median: 'Median Line',
        show_std_band: 'Std Deviation Band (±1σ)',
        show_trend: 'Trend Line',
        stats_summary: 'Statistics Summary',
        stat_mean: 'Mean',
        stat_median: 'Median',
        stat_stdev: 'Std Dev',
        stat_min: 'Min',
        stat_max: 'Max',
        stat_count: 'Count',
        // Phase 3
        basic_charts: 'Basic',
        advanced_charts: 'Advanced',
        chart_dual_axis: 'Dual-Axis',
        chart_stacked: 'Stacked',
        chart_treemap: 'Treemap',
        chart_heatmap: 'Heatmap',
        chart_funnel: 'Funnel',
        chart_gauge: 'Gauge',
        chart_waterfall: 'Waterfall',
        chart_radar: 'Radar',
        chart_boxplot: 'Box Plot',
        chart_pareto: 'Pareto',
        // Phase 4 3D
        '3d_charts': '3D',
        chart_scatter3d: '3D Scatter',
        chart_bar3d: '3D Bar',
        chart_surface3d: '3D Surface',
        chart_line3d: '3D Line',
        // Phase 5-9
        statistical_analysis: 'Statistical Analysis',
        bi_insights: 'BI Insights',
        data_profile: 'Data Profile',
        run_analysis: 'Run Analysis',
        what_if_simulator: 'What-If Simulator',
        anomaly_detection: 'Anomaly Detection',
        trend_insight: 'Trend Insight',
        regression_type: 'Regression Type',
        linear: 'Linear',
        polynomial: 'Polynomial',
        exponential: 'Exponential',
        logarithmic: 'Logarithmic',
        t_test: 't-Test',
        anova: 'ANOVA',
        correlation: 'Correlation',
        normality: 'Normality',
        cross_filter: 'Cross Filter',
        detect_anomalies: 'Detect Anomalies',
        anomalies_found: 'anomalies found',
        no_anomaly: 'No anomaly detected ✓',
        trend_up: 'Upward trend detected',
        trend_down: 'Downward trend detected',
        trend_stable: 'Stable (no significant trend)',
        data_analysis: 'Data Analysis',
        total_rows: 'Total Rows',
        total_columns: 'Total Columns',
        data_quality: 'Data Quality',
        column_types: 'Column Types',
        missing_values: 'Missing Values',
        no_missing: 'No missing values ✓',
        // Phase 6 - Modal Texts
        google_sheets_title: 'Google Sheets Connection',
        google_sheets_desc: 'Enter Spreadsheet ID to fetch data from Google Sheets or connect via OAuth.',
        spreadsheet_id: 'Spreadsheet ID',
        spreadsheet_id_hint: 'Code between /d/ and /edit in URL',
        sheet_name: 'Sheet Name (optional)',
        fetch_data: 'Fetch Data',
        connect_google: 'Connect with Google (OAuth)',
        sql_title: 'SQL Data Source',
        connection_string: 'Connection String',
        connection_hint: 'PostgreSQL, MySQL, SQLite, SQL Server supported',
        test_connection: 'Test Connection',
        sql_query: 'SQL Query (SELECT only)',
        max_rows: 'Max Rows',
        run_query: 'Run Query',
        tables: 'Tables',
        collab_title: 'Live Collaboration',
        collab_desc: 'Work together on the same dashboard in real-time.',
        room_id: 'Room ID',
        username: 'Username',
        join_room: 'Join Room',
        connected: 'Connected',
        users: 'User',
        schedule_title: 'Scheduled Reports',
        report_name: 'Report Name',
        recipients: 'Recipients (comma separated)',
        period: 'Period',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        time: 'Time',
        format: 'Format',
        create_report: 'Create Report',
        existing_reports: 'Existing Reports',
        active: 'Active',
        inactive: 'Inactive',
        stop: 'Stop',
        start: 'Start',
        run_now: 'Run Now',
        join_title: 'Data Join (JOIN)',
        left_table: 'Left Table',
        right_table: 'Right Table',
        left_key: 'Left Key Column',
        right_key: 'Right Key Column',
        join_type: 'Join Type',
        left_join: 'Left Join (All rows from left)',
        inner_join: 'Inner Join (Common rows)',
        outer_join: 'Outer Join (All rows)',
        right_join: 'Right Join (All rows from right)',
        merge: 'Merge',
        merging: 'Merging...',
        merged_success: 'Merged!',
        rows_created: 'rows created',
        regression_title: 'Regression Analysis',
        target_variable: 'Target Variable (Y)',
        predictor_variables: 'Predictor Variables (X)',
        regression_type_label: 'Regression Type',
        linear_reg: 'Linear',
        polynomial_reg: 'Polynomial (2nd degree)',
        logistic_reg: 'Logistic (For binary target)',
        analyze: 'Analyze',
        coefficients: 'Coefficients',
        regression_complete: 'Regression complete',
        insights_title: 'Smart Insights',
        analyzed: 'Analyzed',
        rows: 'rows',
        columns: 'columns',
        add_as_widget: 'Add as Widget',
        calculating_insights: 'Calculating insights...',
        need_two_datasets: 'At least 2 datasets required for JOIN. Load two files first.',
        dataset_files_not_found: 'Dataset files not found',
        load_data_first: 'Load a file first',
        need_two_numeric: 'At least 2 numeric columns required for regression',
        select_one_predictor: 'Select at least 1 predictor variable',
        spreadsheet_id_required: 'Spreadsheet ID required',
        connection_required: 'Connection and query required',
        room_id_required: 'Room ID required',
        report_name_required: 'Report name and at least 1 recipient required',
        connection_success: 'Connection successful!',
        joined_room: 'joined room!',
        left_room: 'Left collaboration room',
        connection_closed: 'Collaboration connection closed',
        user_joined: 'joined the room',
        user_left: 'left the room',
        loading_reports: 'Loading...',
        no_reports_yet: 'No scheduled reports yet',
        oauth_window_opened: 'Google OAuth window opened',
        loaded_from_sheets: 'rows loaded from Google Sheets',
        loaded_from_sql: 'rows loaded from SQL',
        row_limit: 'row limit',
        // PDF Preview & Missing Keys
        pdf_preview: 'PDF Preview',
        download_pdf: 'Download PDF',
        close: 'Close',
        statistics: 'Statistical Analysis',
        special_charts: 'Special Charts',
        map_charts: 'Map Charts',
        data_management: 'Data Management',
        select_dataset: 'Dataset',
        theme_changed: 'Theme changed',
        pdf_generating: 'Generating PDF...',
        pdf_ready: 'PDF ready',

        // =====================================================
        // ERROR MESSAGES (Critical TR/EN)
        // =====================================================

        // File/Data Errors
        err_file_load: 'Failed to load file',
        err_file_type: 'Unsupported file type. Please upload Excel (.xlsx, .xls) or CSV (.csv).',
        err_file_empty: 'File is empty or cannot be read',
        err_file_too_large: 'File is too large. Maximum 50MB supported.',
        err_parse_error: 'Failed to parse file. There may be a format error.',
        err_no_data: 'No data found',
        err_no_columns: 'No columns found',
        err_invalid_header: 'Invalid header row',

        // Chart Errors
        err_chart_render: 'Failed to render chart',
        err_chart_no_data: 'No data available for chart',
        err_chart_invalid_config: 'Invalid chart configuration',
        err_chart_3d_not_supported: 'ECharts GL required for 3D charts',
        err_no_numeric_column: 'No numeric column found',
        err_select_columns: 'Please select X and Y axes',

        // Backend/API Errors
        err_server_error: 'Server error occurred',
        err_network_error: 'Network connection failed',
        err_timeout: 'Request timed out',
        err_unauthorized: 'Authorization error',
        err_forbidden: 'You do not have permission for this action',
        err_not_found: 'Resource not found',
        err_bad_request: 'Invalid request',

        // Statistics Errors
        err_stat_no_data: 'Not enough data for analysis',
        err_stat_non_numeric: 'Numeric data required for this analysis',
        err_stat_min_rows: 'At least 3 rows of data required',
        err_stat_column_not_found: 'Selected column not found',
        err_stat_calculation: 'Failed to calculate statistics',

        // General Warnings
        warn_partial_data: 'Some data is missing or invalid',
        warn_truncated: 'Results have been truncated',
        warn_slow_operation: 'This operation may take a while',

        // Success Messages
        success_file_loaded: 'File loaded successfully',
        success_chart_created: 'Chart created',
        success_data_saved: 'Data saved',
        success_export_complete: 'Export completed',
        success_analysis_complete: 'Analysis completed',

        // UI Action Messages
        ui_chart_selected: 'Chart selected - edit from right panel',
        ui_normal_view: 'Normal view',
        ui_fullscreen_exit: 'Fullscreen - click gear icon to minimize',
        ui_chart_copied: 'Chart copied',
        ui_widget_removed: 'Widget removed',
        ui_no_data_for_analysis: 'Load data for analysis',
        ui_select_x_y: 'Select X and Y axes',
        ui_processing: 'Processing...',
        ui_done: 'Done'
    }
};

/**
 * VIZ_TEXTS'ten aktif dile göre metin alır
 * @param {string} key - Lokalizasyon anahtarı
 * @param {string} fallback - Bulunamazsa dönecek değer (opsiyonel)
 * @returns {string} Çevrilmiş metin
 */
export function getText(key, fallback = '') {
    const texts = VIZ_TEXTS[VIZ_STATE.lang] || VIZ_TEXTS.tr;
    return texts[key] || VIZ_TEXTS.tr[key] || fallback || key;
}

/**
 * Tüm [data-i18n] elementlerine lokalizasyon uygular
 */
export function applyLocalization() {
    const texts = VIZ_TEXTS[VIZ_STATE.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });
}

/**
 * Dil label'ını günceller
 */
export function updateLangLabel() {
    const label = document.getElementById('langLabel');
    if (label) {
        label.textContent = VIZ_STATE.lang === 'tr' ? '🇹🇷 Tr | En' : '🇬🇧 En | Tr';
    }
}

/**
 * Dil değiştirme
 */
export function toggleLang() {
    VIZ_STATE.lang = VIZ_STATE.lang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('opradox_lang', VIZ_STATE.lang);
    updateLangLabel();
    applyLocalization();
}

/**
 * Kaydedilmiş dili yükler
 */
export function loadSavedLang() {
    const saved = localStorage.getItem('opradox_lang') || 'tr';
    VIZ_STATE.lang = saved;
    updateLangLabel();
    applyLocalization();
}

// Global erişim (geriye uyumluluk)
window.getText = getText;
window.VIZ_TEXTS = VIZ_TEXTS;
