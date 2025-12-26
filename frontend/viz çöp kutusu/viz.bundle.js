var VizModule = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // js/viz/index.js
  var index_exports = {};
  __export(index_exports, {
    COLOR_PALETTES: () => COLOR_PALETTES,
    VIZ_STATE: () => VIZ_STATE,
    VIZ_TEXTS: () => VIZ_TEXTS2,
    addChart: () => addChart,
    addDataset: () => addDataset,
    applyChartSettings: () => applyChartSettings,
    applyCrossFilter: () => applyCrossFilter,
    applyLocalization: () => applyLocalization,
    applyStatisticalOverlays: () => applyStatisticalOverlays2,
    applyWhatIfChange: () => applyWhatIfChange,
    calculateMax: () => calculateMax,
    calculateMean: () => calculateMean,
    calculateMedian: () => calculateMedian,
    calculateMin: () => calculateMin,
    calculateStatistics: () => calculateStatistics,
    calculateStatsFallback: () => calculateStatsFallback,
    calculateStdDev: () => calculateStdDev,
    calculateTrendLine: () => calculateTrendLine,
    clearDashboard: () => clearDashboard,
    clearVizData: () => clearVizData,
    closeStatResultModal: () => closeStatResultModal,
    closeWidgetMenu: () => closeWidgetMenu,
    createChartWidget: () => createChartWidget,
    debounce: () => debounce,
    deepClone: () => deepClone,
    deleteSelectedChart: () => deleteSelectedChart,
    detectAnomalies: () => detectAnomalies,
    detectColumnType: () => detectColumnType,
    downloadFile: () => downloadFile,
    duplicateWidget: () => duplicateWidget,
    editWidget: () => editWidget,
    exportAllChartsPNG: () => exportAllChartsPNG,
    exportCSV: () => exportCSV,
    exportExcel: () => exportExcel,
    exportPDF: () => exportPDF,
    exportPNG: () => exportPNG,
    exportSVG: () => exportSVG,
    formatNumber: () => formatNumber,
    generateId: () => generateId,
    getActiveDataset: () => getActiveDataset,
    getChartColor: () => getChartColor,
    getDatasetList: () => getDatasetList,
    getEmbedCode: () => getEmbedCode,
    getStatisticalOverlays: () => getStatisticalOverlays,
    getText: () => getText,
    getTypeInfo: () => getTypeInfo,
    hideSettings: () => hideSettings,
    initVizStudio: () => initVizStudio,
    isDate: () => isDate,
    isNumeric: () => isNumeric,
    loadDashboardFromStorage: () => loadDashboardFromStorage,
    loadSavedLang: () => loadSavedLang,
    loadSavedTheme: () => loadSavedTheme,
    loadVizDataWithOptions: () => loadVizDataWithOptions,
    loadVizFile: () => loadVizFile,
    removeDataset: () => removeDataset,
    renderChart: () => renderChart2,
    renderColumnsList: () => renderColumnsList,
    rerenderAllCharts: () => rerenderAllCharts,
    runANOVA: () => runANOVA,
    runAnomalyWithColumn: () => runAnomalyWithColumn,
    runCorrelation: () => runCorrelation,
    runNormalityTest: () => runNormalityTest,
    runStatTest: () => runStatTest,
    runTTest: () => runTTest,
    saveDashboard: () => saveDashboard,
    selectChart: () => selectChart2,
    setupBIListeners: () => setupBIListeners,
    setupDragAndDrop: () => setupDragAndDrop,
    setupEventListeners: () => setupEventListeners,
    setupOverlayListeners: () => setupOverlayListeners,
    setupSPSSListeners: () => setupSPSSListeners,
    setupVizFileHandlers: () => setupVizFileHandlers,
    showAnomalyAxisModal: () => showAnomalyAxisModal,
    showExportModal: () => showExportModal,
    showSaveMenu: () => showSaveMenu,
    showSettings: () => showSettings,
    showStatResultModal: () => showStatResultModal,
    showToast: () => showToast2,
    showWatermarkModal: () => showWatermarkModal,
    showWidgetMenu: () => showWidgetMenu,
    startWidgetResize: () => startWidgetResize,
    toNumber: () => toNumber,
    toggleLang: () => toggleLang,
    toggleTheme: () => toggleTheme,
    toggleWidgetFullscreen: () => toggleWidgetFullscreen,
    truncate: () => truncate,
    truncateAxisLabel: () => truncateAxisLabel,
    updateAllChartsTheme: () => updateAllChartsTheme,
    updateDataProfile: () => updateDataProfile,
    updateDropdowns: () => updateDropdowns,
    updateEmptyState: () => updateEmptyState,
    updateLangLabel: () => updateLangLabel,
    updateRegressionResults: () => updateRegressionResults2,
    updateStatsSummary: () => updateStatsSummary,
    updateTrendInsight: () => updateTrendInsight
  });

  // js/viz/core/state.js
  var VIZ_STATE = {
    // Multi-dataset yapısı
    datasets: {},
    // { "dataset_1": { file, data, columns, columnsInfo, sheets, audit_log } }
    activeDatasetId: null,
    // Aktif veri seti ID'si
    datasetCounter: 0,
    // Dataset ID sayacı
    // Grafik yönetimi
    charts: [],
    // Her grafik datasetId içerecek
    selectedChart: null,
    // Şu an seçili grafik
    chartCounter: 0,
    // Grafik ID sayacı
    // UI state
    lang: "tr",
    // Dil
    echartsInstances: {},
    // ECharts instance'ları
    // Geriye uyumluluk için getter'lar (mevcut kod çalışmaya devam etsin)
    get file() {
      return this.getActiveFile();
    },
    get data() {
      return this.getActiveData();
    },
    get columns() {
      return this.getActiveColumns();
    },
    get columnsInfo() {
      return this.getActiveColumnsInfo();
    },
    get sheets() {
      return this.getActiveDataset()?.sheets || [];
    },
    // Setter'lar (mevcut kod çalışmaya devam etsin)
    set file(val) {
      if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].file = val;
    },
    set data(val) {
      if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].data = val;
    },
    set columns(val) {
      if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].columns = val;
    },
    set columnsInfo(val) {
      if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].columnsInfo = val;
    },
    set sheets(val) {
      if (this.activeDatasetId && this.datasets[this.activeDatasetId]) this.datasets[this.activeDatasetId].sheets = val;
    },
    // Yardımcı metodlar
    getActiveDataset() {
      return this.activeDatasetId ? this.datasets[this.activeDatasetId] : null;
    },
    getActiveData() {
      return this.getActiveDataset()?.data || null;
    },
    getActiveColumns() {
      return this.getActiveDataset()?.columns || [];
    },
    getActiveColumnsInfo() {
      return this.getActiveDataset()?.columnsInfo || [];
    },
    getActiveFile() {
      return this.getActiveDataset()?.file || null;
    },
    getDatasetById(id) {
      return this.datasets[id] || null;
    },
    addDataset(file, data, columns, columnsInfo, sheets = []) {
      const id = `dataset_${++this.datasetCounter}`;
      this.datasets[id] = {
        id,
        file,
        data,
        columns,
        columnsInfo,
        sheets,
        name: file?.name || id,
        audit_log: {}
        // { "column_name": { method, original_missing, filled, timestamp } }
      };
      this.activeDatasetId = id;
      console.log(`\u{1F4C1} Yeni dataset eklendi: ${id} (${file?.name})`);
      return id;
    },
    setActiveDataset(id) {
      if (this.datasets[id]) {
        this.activeDatasetId = id;
        console.log(`\u{1F4C1} Aktif dataset de\u011Fi\u015Fti: ${id}`);
        return true;
      }
      return false;
    },
    removeDataset(id) {
      if (this.datasets[id]) {
        delete this.datasets[id];
        if (this.activeDatasetId === id) {
          const keys = Object.keys(this.datasets);
          this.activeDatasetId = keys.length > 0 ? keys[0] : null;
        }
        return true;
      }
      return false;
    },
    getDatasetList() {
      return Object.values(this.datasets).map((d) => ({ id: d.id, name: d.name, rowCount: d.data?.length || 0 }));
    }
  };
  window.VIZ_STATE = VIZ_STATE;

  // js/viz/core/utils.js
  var utils_exports = {};
  __export(utils_exports, {
    COLOR_PALETTES: () => COLOR_PALETTES,
    calculateMax: () => calculateMax,
    calculateMean: () => calculateMean,
    calculateMedian: () => calculateMedian,
    calculateMin: () => calculateMin,
    calculateStdDev: () => calculateStdDev,
    debounce: () => debounce,
    deepClone: () => deepClone,
    downloadFile: () => downloadFile,
    formatNumber: () => formatNumber,
    generateId: () => generateId,
    getChartColor: () => getChartColor,
    isDate: () => isDate,
    isNumeric: () => isNumeric,
    showToast: () => showToast2,
    toNumber: () => toNumber,
    truncate: () => truncate,
    truncateAxisLabel: () => truncateAxisLabel
  });

  // js/viz/core/i18n.js
  var i18n_exports = {};
  __export(i18n_exports, {
    VIZ_TEXTS: () => VIZ_TEXTS2,
    applyLocalization: () => applyLocalization,
    getText: () => getText,
    loadSavedLang: () => loadSavedLang,
    toggleLang: () => toggleLang,
    updateLangLabel: () => updateLangLabel
  });
  var VIZ_TEXTS2 = {
    tr: {
      viz_subtitle: "Visual Studio",
      data_columns: "Veri S\xFCtunlar\u0131",
      drop_excel: "Excel dosyas\u0131 s\xFCr\xFCkleyin",
      no_data_loaded: "Veri y\xFCkleyin",
      chart_types: "Grafik Tipleri",
      chart_bar: "S\xFCtun",
      chart_line: "\xC7izgi",
      chart_pie: "Pasta",
      chart_area: "Alan",
      chart_scatter: "Da\u011F\u0131l\u0131m",
      chart_doughnut: "Halka",
      dashboard: "Dashboard",
      live: "CANLI",
      add_chart: "Grafik Ekle",
      empty_dashboard_title: "Dashboard'unuz Bo\u015F",
      empty_dashboard_desc: 'Sol taraftan grafik tipini s\xFCr\xFCkleyin veya "Grafik Ekle" butonuna t\u0131klay\u0131n',
      chart_settings: "Grafik Ayarlar\u0131",
      select_chart: "D\xFCzenlemek i\xE7in bir grafik se\xE7in",
      chart_title: "Grafik Ba\u015Fl\u0131\u011F\u0131",
      x_axis: "X Ekseni (Kategori)",
      y_axis: "Y Ekseni (De\u011Fer)",
      aggregation: "Agregasyon",
      agg_sum: "Toplam",
      agg_avg: "Ortalama",
      agg_count: "Say\u0131",
      agg_min: "Minimum",
      agg_max: "Maksimum",
      color: "Renk",
      apply: "Uygula",
      delete_chart: "Grafi\u011Fi Sil",
      save: "Kaydet",
      export: "Export",
      file_loaded: "Dosya y\xFCklendi",
      error: "Hata",
      chart_added: "Grafik eklendi",
      // Faz 1 yeni metinler
      export_png: "PNG olarak indir",
      export_pdf: "PDF olarak indir",
      save_dashboard: "Dashboard kaydet",
      load_dashboard: "Dashboard y\xFCkle",
      dashboard_saved: "Dashboard kaydedildi",
      dashboard_loaded: "Dashboard y\xFCklendi",
      no_saved_dashboard: "Kay\u0131tl\u0131 dashboard bulunamad\u0131",
      export_success: "Export ba\u015Far\u0131l\u0131",
      loading: "Y\xFCkleniyor...",
      // Faz 2 istatistik metinleri
      stats_overlay: "\u0130statistik Overlay",
      show_mean: "Ortalama \xC7izgisi",
      show_median: "Medyan \xC7izgisi",
      show_std_band: "Standart Sapma Band\u0131 (\xB11\u03C3)",
      show_trend: "Trend \xC7izgisi",
      stats_summary: "\u0130statistik \xD6zeti",
      stat_mean: "Ortalama",
      stat_median: "Medyan",
      stat_stdev: "Std Sapma",
      stat_min: "Min",
      stat_max: "Maks",
      stat_count: "Say\u0131",
      // Faz 3 ileri grafik metinleri
      basic_charts: "Temel",
      advanced_charts: "\u0130leri",
      chart_dual_axis: "Dual-Axis",
      chart_stacked: "Y\u0131\u011F\u0131n",
      chart_treemap: "Treemap",
      chart_heatmap: "Is\u0131 Haritas\u0131",
      chart_funnel: "Huni",
      chart_gauge: "G\xF6sterge",
      chart_waterfall: "\u015Eelale",
      chart_radar: "Radar",
      chart_boxplot: "Kutu",
      chart_pareto: "Pareto",
      // Faz 4 3D grafik metinleri
      "3d_charts": "3D",
      chart_scatter3d: "3D Da\u011F\u0131l\u0131m",
      chart_bar3d: "3D S\xFCtun",
      chart_surface3d: "3D Y\xFCzey",
      chart_line3d: "3D \xC7izgi",
      // Faz 5-9 yeni metinler
      statistical_analysis: "\u0130statistiksel Analiz",
      bi_insights: "BI \u0130\xE7g\xF6r\xFCleri",
      data_profile: "Veri Profili",
      run_analysis: "Analiz \xC7al\u0131\u015Ft\u0131r",
      what_if_simulator: "Ne Olur Sim\xFClat\xF6r\xFC",
      anomaly_detection: "Anomali Tespiti",
      trend_insight: "Trend \u0130\xE7g\xF6r\xFCs\xFC",
      regression_type: "Regresyon Tipi",
      linear: "Do\u011Frusal",
      polynomial: "Polinom",
      exponential: "\xDCstel",
      logarithmic: "Logaritmik",
      t_test: "t-Test",
      anova: "ANOVA",
      correlation: "Korelasyon",
      normality: "Normallik",
      cross_filter: "\xC7apraz Filtre",
      detect_anomalies: "Anomali Tespit",
      anomalies_found: "anomali bulundu",
      no_anomaly: "Anomali tespit edilmedi \u2713",
      trend_up: "Yukar\u0131 y\xF6nl\xFC trend",
      trend_down: "A\u015Fa\u011F\u0131 y\xF6nl\xFC trend",
      trend_stable: "Stabil (belirgin trend yok)",
      data_analysis: "Veri Analizi",
      total_rows: "Toplam Sat\u0131r",
      total_columns: "Toplam S\xFCtun",
      data_quality: "Veri Kalitesi",
      column_types: "S\xFCtun Tipleri",
      missing_values: "Eksik De\u011Ferler",
      no_missing: "Eksik de\u011Fer yok \u2713",
      // Faz 6 - Yeni Modal Metinleri
      google_sheets_title: "Google Sheets Ba\u011Flant\u0131s\u0131",
      google_sheets_desc: "Google Sheets'ten veri \xE7ekmek i\xE7in Spreadsheet ID girin veya OAuth ile ba\u011Flan\u0131n.",
      spreadsheet_id: "Spreadsheet ID",
      spreadsheet_id_hint: "URL'deki /d/ ile /edit aras\u0131ndaki kod",
      sheet_name: "Sayfa Ad\u0131 (opsiyonel)",
      fetch_data: "Veriyi \xC7ek",
      connect_google: "Google ile Ba\u011Flan (OAuth)",
      sql_title: "SQL Veri Kayna\u011F\u0131",
      connection_string: "Ba\u011Flant\u0131 String'i",
      connection_hint: "PostgreSQL, MySQL, SQLite, SQL Server desteklenir",
      test_connection: "Ba\u011Flant\u0131y\u0131 Test Et",
      sql_query: "SQL Sorgusu (sadece SELECT)",
      max_rows: "Max Sat\u0131r",
      run_query: "Sorguyu \xC7al\u0131\u015Ft\u0131r",
      tables: "Tablolar",
      collab_title: "Canl\u0131 \u0130\u015Fbirli\u011Fi",
      collab_desc: "Ayn\u0131 dashboard \xFCzerinde ger\xE7ek zamanl\u0131 \xE7al\u0131\u015F\u0131n.",
      room_id: "Oda ID",
      username: "Kullan\u0131c\u0131 Ad\u0131",
      join_room: "Odaya Kat\u0131l",
      connected: "Ba\u011Fl\u0131",
      users: "Kullan\u0131c\u0131",
      schedule_title: "Zamanlanm\u0131\u015F Raporlar",
      report_name: "Rapor Ad\u0131",
      recipients: "Al\u0131c\u0131lar (virg\xFClle ay\u0131r\u0131n)",
      period: "Periyot",
      daily: "G\xFCnl\xFCk",
      weekly: "Haftal\u0131k",
      monthly: "Ayl\u0131k",
      time: "Saat",
      format: "Format",
      create_report: "Rapor Olu\u015Ftur",
      existing_reports: "Mevcut Raporlar",
      active: "Aktif",
      inactive: "Pasif",
      stop: "Durdur",
      start: "Ba\u015Flat",
      run_now: "\u015Eimdi \xC7al\u0131\u015Ft\u0131r",
      join_title: "Veri Birle\u015Ftirme (JOIN)",
      left_table: "Sol Tablo",
      right_table: "Sa\u011F Tablo",
      left_key: "Sol Anahtar S\xFCtun",
      right_key: "Sa\u011F Anahtar S\xFCtun",
      join_type: "Birle\u015Ftirme Tipi",
      left_join: "Left Join (Sol tablo t\xFCm sat\u0131rlar)",
      inner_join: "Inner Join (Ortak sat\u0131rlar)",
      outer_join: "Outer Join (T\xFCm sat\u0131rlar)",
      right_join: "Right Join (Sa\u011F tablo t\xFCm sat\u0131rlar)",
      merge: "Birle\u015Ftir",
      merging: "Birle\u015Ftiriliyor...",
      merged_success: "Birle\u015Ftirildi!",
      rows_created: "sat\u0131r olu\u015Fturuldu",
      regression_title: "Regresyon Analizi",
      target_variable: "Hedef De\u011Fi\u015Fken (Y)",
      predictor_variables: "Tahmin De\u011Fi\u015Fkenleri (X)",
      regression_type_label: "Regresyon Tipi",
      linear_reg: "Do\u011Frusal (Linear)",
      polynomial_reg: "Polinom (2. derece)",
      logistic_reg: "Logistic (Binary hedef i\xE7in)",
      analyze: "Analiz Et",
      coefficients: "Katsay\u0131lar",
      regression_complete: "Regresyon tamamland\u0131",
      insights_title: "Ak\u0131ll\u0131 \u0130\xE7g\xF6r\xFCler",
      analyzed: "Analiz Edilen",
      rows: "sat\u0131r",
      columns: "s\xFCtun",
      add_as_widget: "Widget Olarak Ekle",
      calculating_insights: "\u0130\xE7g\xF6r\xFCler hesaplan\u0131yor...",
      need_two_datasets: "JOIN i\xE7in en az 2 veri seti gerekli. \xD6nce iki dosya y\xFCkleyin.",
      dataset_files_not_found: "Veri seti dosyalar\u0131 bulunamad\u0131",
      load_data_first: "\xD6nce dosya y\xFCkleyin",
      need_two_numeric: "Regresyon i\xE7in en az 2 say\u0131sal s\xFCtun gerekli",
      select_one_predictor: "En az 1 tahmin de\u011Fi\u015Fkeni se\xE7in",
      spreadsheet_id_required: "Spreadsheet ID gerekli",
      connection_required: "Ba\u011Flant\u0131 ve sorgu gerekli",
      room_id_required: "Oda ID gerekli",
      report_name_required: "Rapor ad\u0131 ve en az 1 al\u0131c\u0131 gerekli",
      connection_success: "Ba\u011Flant\u0131 ba\u015Far\u0131l\u0131!",
      joined_room: "odas\u0131na ba\u011Fland\u0131!",
      left_room: "\u0130\u015Fbirli\u011Fi odas\u0131ndan \xE7\u0131k\u0131ld\u0131",
      connection_closed: "\u0130\u015Fbirli\u011Fi ba\u011Flant\u0131s\u0131 kapand\u0131",
      user_joined: "odaya kat\u0131ld\u0131",
      user_left: "odadan ayr\u0131ld\u0131",
      loading_reports: "Y\xFCkleniyor...",
      no_reports_yet: "Hen\xFCz zamanlanm\u0131\u015F rapor yok",
      oauth_window_opened: "Google OAuth penceresi a\xE7\u0131ld\u0131",
      loaded_from_sheets: "sat\u0131r Google Sheets'ten y\xFCklendi",
      loaded_from_sql: "sat\u0131r SQL'den y\xFCklendi",
      row_limit: "sat\u0131r limiti",
      // PDF Preview & Eksik Anahtarlar
      pdf_preview: "PDF \xD6nizleme",
      download_pdf: "PDF \u0130ndir",
      close: "Kapat",
      statistics: "\u0130statistik Analizleri",
      special_charts: "\xD6zel Grafikler",
      map_charts: "Harita Grafikleri",
      data_management: "Veri Y\xF6netimi",
      select_dataset: "Veri Seti",
      theme_changed: "Tema de\u011Fi\u015Ftirildi",
      pdf_generating: "PDF olu\u015Fturuluyor...",
      pdf_ready: "PDF haz\u0131r",
      // =====================================================
      // HATA MESAJLARI / ERROR MESSAGES (Kritik TR/EN)
      // =====================================================
      // Dosya/Veri Hataları
      err_file_load: "Dosya y\xFCklenemedi",
      err_file_type: "Desteklenmeyen dosya t\xFCr\xFC. Excel (.xlsx, .xls) veya CSV (.csv) y\xFCkleyin.",
      err_file_empty: "Dosya bo\u015F veya okunamad\u0131",
      err_file_too_large: "Dosya \xE7ok b\xFCy\xFCk. Maksimum 50MB destekleniyor.",
      err_parse_error: "Dosya ayr\u0131\u015Ft\u0131r\u0131lamad\u0131. Format hatas\u0131 olabilir.",
      err_no_data: "Veri bulunamad\u0131",
      err_no_columns: "S\xFCtun bulunamad\u0131",
      err_invalid_header: "Ge\xE7ersiz ba\u015Fl\u0131k sat\u0131r\u0131",
      // Grafik Hataları
      err_chart_render: "Grafik olu\u015Fturulamad\u0131",
      err_chart_no_data: "Grafik i\xE7in veri yok",
      err_chart_invalid_config: "Ge\xE7ersiz grafik yap\u0131land\u0131rmas\u0131",
      err_chart_3d_not_supported: "3D grafikler i\xE7in ECharts GL gerekli",
      err_no_numeric_column: "Say\u0131sal s\xFCtun bulunamad\u0131",
      err_select_columns: "L\xFCtfen X ve Y eksenlerini se\xE7in",
      // Backend/API Hataları
      err_server_error: "Sunucu hatas\u0131 olu\u015Ftu",
      err_network_error: "A\u011F ba\u011Flant\u0131s\u0131 ba\u015Far\u0131s\u0131z",
      err_timeout: "\u0130stek zaman a\u015F\u0131m\u0131na u\u011Frad\u0131",
      err_unauthorized: "Yetkilendirme hatas\u0131",
      err_forbidden: "Bu i\u015Flem i\xE7in yetkiniz yok",
      err_not_found: "Kaynak bulunamad\u0131",
      err_bad_request: "Ge\xE7ersiz istek",
      // İstatistik Hataları
      err_stat_no_data: "Analiz i\xE7in yeterli veri yok",
      err_stat_non_numeric: "Bu analiz i\xE7in say\u0131sal veri gerekli",
      err_stat_min_rows: "En az 3 sat\u0131r veri gerekli",
      err_stat_column_not_found: "Se\xE7ilen s\xFCtun bulunamad\u0131",
      err_stat_calculation: "\u0130statistik hesaplanamad\u0131",
      // Genel Uyarılar
      warn_partial_data: "Baz\u0131 veriler eksik veya hatal\u0131",
      warn_truncated: "Sonu\xE7lar k\u0131salt\u0131ld\u0131",
      warn_slow_operation: "Bu i\u015Flem uzun s\xFCrebilir",
      // Başarı Mesajları
      success_file_loaded: "Dosya ba\u015Far\u0131yla y\xFCklendi",
      success_chart_created: "Grafik olu\u015Fturuldu",
      success_data_saved: "Veriler kaydedildi",
      success_export_complete: "Export tamamland\u0131",
      success_analysis_complete: "Analiz tamamland\u0131",
      // UI Aksiyon Mesajları
      ui_chart_selected: "Grafik se\xE7ildi - sa\u011F panelden d\xFCzenleyebilirsiniz",
      ui_normal_view: "Normal g\xF6r\xFCn\xFCm",
      ui_fullscreen_exit: 'Tam ekran - \xE7arktan "K\xFC\xE7\xFClt" ile \xE7\u0131k\u0131n',
      ui_chart_copied: "Grafik kopyaland\u0131",
      ui_widget_removed: "Widget silindi",
      ui_no_data_for_analysis: "Analiz i\xE7in veri y\xFCkleyin",
      ui_select_x_y: "X ve Y eksenlerini se\xE7in",
      ui_processing: "\u0130\u015Fleniyor...",
      ui_done: "Tamamland\u0131"
    },
    en: {
      viz_subtitle: "Visual Studio",
      data_columns: "Data Columns",
      drop_excel: "Drop Excel file here",
      no_data_loaded: "Load data",
      chart_types: "Chart Types",
      chart_bar: "Bar",
      chart_line: "Line",
      chart_pie: "Pie",
      chart_area: "Area",
      chart_scatter: "Scatter",
      chart_doughnut: "Doughnut",
      dashboard: "Dashboard",
      live: "LIVE",
      add_chart: "Add Chart",
      empty_dashboard_title: "Your Dashboard is Empty",
      empty_dashboard_desc: 'Drag a chart type from left panel or click "Add Chart"',
      chart_settings: "Chart Settings",
      select_chart: "Select a chart to edit",
      chart_title: "Chart Title",
      x_axis: "X Axis (Category)",
      y_axis: "Y Axis (Value)",
      aggregation: "Aggregation",
      agg_sum: "Sum",
      agg_avg: "Average",
      agg_count: "Count",
      agg_min: "Minimum",
      agg_max: "Maximum",
      color: "Color",
      apply: "Apply",
      delete_chart: "Delete Chart",
      save: "Save",
      export: "Export",
      file_loaded: "File loaded",
      error: "Error",
      chart_added: "Chart added",
      // Phase 1
      export_png: "Download as PNG",
      export_pdf: "Download as PDF",
      save_dashboard: "Save Dashboard",
      load_dashboard: "Load Dashboard",
      dashboard_saved: "Dashboard saved",
      dashboard_loaded: "Dashboard loaded",
      no_saved_dashboard: "No saved dashboard found",
      export_success: "Export successful",
      loading: "Loading...",
      // Phase 2
      stats_overlay: "Statistics Overlay",
      show_mean: "Mean Line",
      show_median: "Median Line",
      show_std_band: "Std Deviation Band (\xB11\u03C3)",
      show_trend: "Trend Line",
      stats_summary: "Statistics Summary",
      stat_mean: "Mean",
      stat_median: "Median",
      stat_stdev: "Std Dev",
      stat_min: "Min",
      stat_max: "Max",
      stat_count: "Count",
      // Phase 3
      basic_charts: "Basic",
      advanced_charts: "Advanced",
      chart_dual_axis: "Dual-Axis",
      chart_stacked: "Stacked",
      chart_treemap: "Treemap",
      chart_heatmap: "Heatmap",
      chart_funnel: "Funnel",
      chart_gauge: "Gauge",
      chart_waterfall: "Waterfall",
      chart_radar: "Radar",
      chart_boxplot: "Box Plot",
      chart_pareto: "Pareto",
      // Phase 4 3D
      "3d_charts": "3D",
      chart_scatter3d: "3D Scatter",
      chart_bar3d: "3D Bar",
      chart_surface3d: "3D Surface",
      chart_line3d: "3D Line",
      // Phase 5-9
      statistical_analysis: "Statistical Analysis",
      bi_insights: "BI Insights",
      data_profile: "Data Profile",
      run_analysis: "Run Analysis",
      what_if_simulator: "What-If Simulator",
      anomaly_detection: "Anomaly Detection",
      trend_insight: "Trend Insight",
      regression_type: "Regression Type",
      linear: "Linear",
      polynomial: "Polynomial",
      exponential: "Exponential",
      logarithmic: "Logarithmic",
      t_test: "t-Test",
      anova: "ANOVA",
      correlation: "Correlation",
      normality: "Normality",
      cross_filter: "Cross Filter",
      detect_anomalies: "Detect Anomalies",
      anomalies_found: "anomalies found",
      no_anomaly: "No anomaly detected \u2713",
      trend_up: "Upward trend detected",
      trend_down: "Downward trend detected",
      trend_stable: "Stable (no significant trend)",
      data_analysis: "Data Analysis",
      total_rows: "Total Rows",
      total_columns: "Total Columns",
      data_quality: "Data Quality",
      column_types: "Column Types",
      missing_values: "Missing Values",
      no_missing: "No missing values \u2713",
      // Phase 6 - Modal Texts
      google_sheets_title: "Google Sheets Connection",
      google_sheets_desc: "Enter Spreadsheet ID to fetch data from Google Sheets or connect via OAuth.",
      spreadsheet_id: "Spreadsheet ID",
      spreadsheet_id_hint: "Code between /d/ and /edit in URL",
      sheet_name: "Sheet Name (optional)",
      fetch_data: "Fetch Data",
      connect_google: "Connect with Google (OAuth)",
      sql_title: "SQL Data Source",
      connection_string: "Connection String",
      connection_hint: "PostgreSQL, MySQL, SQLite, SQL Server supported",
      test_connection: "Test Connection",
      sql_query: "SQL Query (SELECT only)",
      max_rows: "Max Rows",
      run_query: "Run Query",
      tables: "Tables",
      collab_title: "Live Collaboration",
      collab_desc: "Work together on the same dashboard in real-time.",
      room_id: "Room ID",
      username: "Username",
      join_room: "Join Room",
      connected: "Connected",
      users: "User",
      schedule_title: "Scheduled Reports",
      report_name: "Report Name",
      recipients: "Recipients (comma separated)",
      period: "Period",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      time: "Time",
      format: "Format",
      create_report: "Create Report",
      existing_reports: "Existing Reports",
      active: "Active",
      inactive: "Inactive",
      stop: "Stop",
      start: "Start",
      run_now: "Run Now",
      join_title: "Data Join (JOIN)",
      left_table: "Left Table",
      right_table: "Right Table",
      left_key: "Left Key Column",
      right_key: "Right Key Column",
      join_type: "Join Type",
      left_join: "Left Join (All rows from left)",
      inner_join: "Inner Join (Common rows)",
      outer_join: "Outer Join (All rows)",
      right_join: "Right Join (All rows from right)",
      merge: "Merge",
      merging: "Merging...",
      merged_success: "Merged!",
      rows_created: "rows created",
      regression_title: "Regression Analysis",
      target_variable: "Target Variable (Y)",
      predictor_variables: "Predictor Variables (X)",
      regression_type_label: "Regression Type",
      linear_reg: "Linear",
      polynomial_reg: "Polynomial (2nd degree)",
      logistic_reg: "Logistic (For binary target)",
      analyze: "Analyze",
      coefficients: "Coefficients",
      regression_complete: "Regression complete",
      insights_title: "Smart Insights",
      analyzed: "Analyzed",
      rows: "rows",
      columns: "columns",
      add_as_widget: "Add as Widget",
      calculating_insights: "Calculating insights...",
      need_two_datasets: "At least 2 datasets required for JOIN. Load two files first.",
      dataset_files_not_found: "Dataset files not found",
      load_data_first: "Load a file first",
      need_two_numeric: "At least 2 numeric columns required for regression",
      select_one_predictor: "Select at least 1 predictor variable",
      spreadsheet_id_required: "Spreadsheet ID required",
      connection_required: "Connection and query required",
      room_id_required: "Room ID required",
      report_name_required: "Report name and at least 1 recipient required",
      connection_success: "Connection successful!",
      joined_room: "joined room!",
      left_room: "Left collaboration room",
      connection_closed: "Collaboration connection closed",
      user_joined: "joined the room",
      user_left: "left the room",
      loading_reports: "Loading...",
      no_reports_yet: "No scheduled reports yet",
      oauth_window_opened: "Google OAuth window opened",
      loaded_from_sheets: "rows loaded from Google Sheets",
      loaded_from_sql: "rows loaded from SQL",
      row_limit: "row limit",
      // PDF Preview & Missing Keys
      pdf_preview: "PDF Preview",
      download_pdf: "Download PDF",
      close: "Close",
      statistics: "Statistical Analysis",
      special_charts: "Special Charts",
      map_charts: "Map Charts",
      data_management: "Data Management",
      select_dataset: "Dataset",
      theme_changed: "Theme changed",
      pdf_generating: "Generating PDF...",
      pdf_ready: "PDF ready",
      // =====================================================
      // ERROR MESSAGES (Critical TR/EN)
      // =====================================================
      // File/Data Errors
      err_file_load: "Failed to load file",
      err_file_type: "Unsupported file type. Please upload Excel (.xlsx, .xls) or CSV (.csv).",
      err_file_empty: "File is empty or cannot be read",
      err_file_too_large: "File is too large. Maximum 50MB supported.",
      err_parse_error: "Failed to parse file. There may be a format error.",
      err_no_data: "No data found",
      err_no_columns: "No columns found",
      err_invalid_header: "Invalid header row",
      // Chart Errors
      err_chart_render: "Failed to render chart",
      err_chart_no_data: "No data available for chart",
      err_chart_invalid_config: "Invalid chart configuration",
      err_chart_3d_not_supported: "ECharts GL required for 3D charts",
      err_no_numeric_column: "No numeric column found",
      err_select_columns: "Please select X and Y axes",
      // Backend/API Errors
      err_server_error: "Server error occurred",
      err_network_error: "Network connection failed",
      err_timeout: "Request timed out",
      err_unauthorized: "Authorization error",
      err_forbidden: "You do not have permission for this action",
      err_not_found: "Resource not found",
      err_bad_request: "Invalid request",
      // Statistics Errors
      err_stat_no_data: "Not enough data for analysis",
      err_stat_non_numeric: "Numeric data required for this analysis",
      err_stat_min_rows: "At least 3 rows of data required",
      err_stat_column_not_found: "Selected column not found",
      err_stat_calculation: "Failed to calculate statistics",
      // General Warnings
      warn_partial_data: "Some data is missing or invalid",
      warn_truncated: "Results have been truncated",
      warn_slow_operation: "This operation may take a while",
      // Success Messages
      success_file_loaded: "File loaded successfully",
      success_chart_created: "Chart created",
      success_data_saved: "Data saved",
      success_export_complete: "Export completed",
      success_analysis_complete: "Analysis completed",
      // UI Action Messages
      ui_chart_selected: "Chart selected - edit from right panel",
      ui_normal_view: "Normal view",
      ui_fullscreen_exit: "Fullscreen - click gear icon to minimize",
      ui_chart_copied: "Chart copied",
      ui_widget_removed: "Widget removed",
      ui_no_data_for_analysis: "Load data for analysis",
      ui_select_x_y: "Select X and Y axes",
      ui_processing: "Processing...",
      ui_done: "Done"
    }
  };
  function getText(key, fallback = "") {
    const texts = VIZ_TEXTS2[VIZ_STATE.lang] || VIZ_TEXTS2.tr;
    return texts[key] || VIZ_TEXTS2.tr[key] || fallback || key;
  }
  function applyLocalization() {
    const texts = VIZ_TEXTS2[VIZ_STATE.lang];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (texts[key]) {
        el.textContent = texts[key];
      }
    });
  }
  function updateLangLabel() {
    const label = document.getElementById("langLabel");
    if (label) {
      label.textContent = VIZ_STATE.lang === "tr" ? "\u{1F1F9}\u{1F1F7} Tr | En" : "\u{1F1EC}\u{1F1E7} En | Tr";
    }
  }
  function toggleLang() {
    VIZ_STATE.lang = VIZ_STATE.lang === "tr" ? "en" : "tr";
    localStorage.setItem("opradox_lang", VIZ_STATE.lang);
    updateLangLabel();
    applyLocalization();
  }
  function loadSavedLang() {
    const saved = localStorage.getItem("opradox_lang") || "tr";
    VIZ_STATE.lang = saved;
    updateLangLabel();
    applyLocalization();
  }
  window.getText = getText;
  window.VIZ_TEXTS = VIZ_TEXTS2;

  // js/viz/core/utils.js
  function showToast2(message, type = "info") {
    if (typeof window.showToast === "function" && window.showToast !== showToast2) {
      return window.showToast(message, type);
    }
    const toastId = "viz-toast-" + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="viz-toast viz-toast-${type}" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ">
            ${message}
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", toastHtml);
    setTimeout(() => {
      const toast = document.getElementById(toastId);
      if (toast) toast.remove();
    }, 3e3);
  }
  function formatNumber(num, decimals = 2) {
    if (num === null || num === void 0 || isNaN(num)) return "-";
    return Number(num).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }
  function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function isNumeric(val) {
    if (val === null || val === void 0 || val === "") return false;
    return !isNaN(parseFloat(val)) && isFinite(val);
  }
  function toNumber(val) {
    if (val === null || val === void 0 || val === "") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }
  function isDate(val) {
    if (!val) return false;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }
  var COLOR_PALETTES = {
    default: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"],
    pastel: ["#8ecae6", "#219ebc", "#023047", "#ffb703", "#fb8500", "#e63946", "#a8dadc", "#457b9d", "#1d3557"],
    vivid: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9", "#74b9ff", "#a29bfe", "#fd79a8"],
    monochrome: ["#2d3436", "#636e72", "#b2bec3", "#dfe6e9", "#74b9ff", "#0984e3", "#6c5ce7", "#a29bfe", "#81ecec"]
  };
  function getChartColor(index = 0, palette = "default") {
    const colors = COLOR_PALETTES[palette] || COLOR_PALETTES.default;
    return colors[index % colors.length];
  }
  function generateId(prefix = "viz") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    return JSON.parse(JSON.stringify(obj));
  }
  function truncate(str, length = 20) {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  }
  function truncateAxisLabel(label, maxLength = 15) {
    if (!label) return "";
    const str = String(label);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + "...";
  }
  function calculateMean(values) {
    const nums = values.filter((v) => isNumeric(v)).map(Number);
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  function calculateMedian(values) {
    const nums = values.filter((v) => isNumeric(v)).map(Number).sort((a, b) => a - b);
    if (nums.length === 0) return null;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  }
  function calculateStdDev(values) {
    const nums = values.filter((v) => isNumeric(v)).map(Number);
    if (nums.length < 2) return null;
    const mean = calculateMean(nums);
    const squareDiffs = nums.map((v) => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / nums.length;
    return Math.sqrt(avgSquareDiff);
  }
  function calculateMin(values) {
    const nums = values.filter((v) => isNumeric(v)).map(Number);
    return nums.length > 0 ? Math.min(...nums) : null;
  }
  function calculateMax(values) {
    const nums = values.filter((v) => isNumeric(v)).map(Number);
    return nums.length > 0 ? Math.max(...nums) : null;
  }
  window.formatNumber = formatNumber;
  window.isNumeric = isNumeric;
  window.truncateAxisLabel = truncateAxisLabel;
  function downloadFile(dataUrl, filename) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  window.downloadFile = downloadFile;

  // js/viz/data/manager.js
  var manager_exports = {};
  __export(manager_exports, {
    addDataset: () => addDataset,
    getActiveDataset: () => getActiveDataset,
    getDatasetList: () => getDatasetList,
    removeDataset: () => removeDataset
  });
  function addDataset(file, data, columns, columnsInfo, sheets = []) {
    return VIZ_STATE.addDataset(file, data, columns, columnsInfo, sheets);
  }
  function removeDataset(id) {
    return VIZ_STATE.removeDataset(id);
  }
  function getActiveDataset() {
    return VIZ_STATE.getActiveDataset();
  }
  function getDatasetList() {
    return VIZ_STATE.getDatasetList();
  }

  // js/viz/data/loader.js
  var loader_exports = {};
  __export(loader_exports, {
    clearVizData: () => clearVizData,
    loadVizDataWithOptions: () => loadVizDataWithOptions,
    loadVizFile: () => loadVizFile,
    setupVizFileHandlers: () => setupVizFileHandlers
  });
  function setupVizFileHandlers() {
    const dropZone = document.getElementById("vizDropZone");
    const fileInput = document.getElementById("vizFileInput");
    const loadDataBtn = document.getElementById("loadDataBtn");
    const fileRemoveBtn = document.getElementById("vizFileRemove");
    console.log("\u{1F527} Dosya handler'lar\u0131 ayarlan\u0131yor...", { dropZone: !!dropZone, fileInput: !!fileInput });
    if (!dropZone) {
      console.warn("\u26A0\uFE0F vizDropZone elementi bulunamad\u0131");
      return;
    }
    if (loadDataBtn) {
      loadDataBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput?.click();
      });
    }
    dropZone.addEventListener("click", (e) => {
      console.log("\u{1F5B1}\uFE0F Drop zone clicked!");
      if (e.target.closest(".viz-file-remove")) return;
      if (fileInput) {
        console.log("\u{1F4C2} Triggering file input click...");
        fileInput.click();
      } else {
        console.error("\u274C File input not found!");
      }
    });
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log("\u{1F4C4} Dosya se\xE7ildi:", file.name);
          loadVizFile(file);
        }
        e.target.value = "";
      });
    }
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log("\u{1F4C4} Dosya b\u0131rak\u0131ld\u0131:", file.name);
        loadVizFile(file);
      }
    });
    if (fileRemoveBtn) {
      fileRemoveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearVizData();
      });
    }
    console.log("\u2705 Dosya handler'lar\u0131 kuruldu");
  }
  async function loadVizFile(file) {
    try {
      console.log("\u{1F4E4} Dosya y\xFCkleniyor:", file.name, file.size, "bytes");
      const fileInfo = document.getElementById("vizFileInfo");
      const fileName = document.getElementById("vizFileName");
      const dropZone = document.getElementById("vizDropZone");
      const fileOptions = document.getElementById("vizFileOptions");
      if (dropZone) dropZone.style.display = "none";
      if (fileInfo) fileInfo.style.display = "block";
      if (fileName) fileName.textContent = file.name;
      if (fileOptions) fileOptions.style.display = "block";
      const datasetId = addDataset(file, [], [], [], []);
      const sheetsFormData = new FormData();
      sheetsFormData.append("file", file);
      try {
        const sheetsResponse = await fetch("/viz/sheets", {
          method: "POST",
          body: sheetsFormData
        });
        if (sheetsResponse.ok) {
          const sheetsData = await sheetsResponse.json();
          const sheets = sheetsData.sheets || [];
          if (VIZ_STATE.datasets[datasetId]) {
            VIZ_STATE.datasets[datasetId].sheets = sheets;
          }
          const sheetWrapper = document.getElementById("vizSheetSelectorWrapper");
          const sheetSelector = document.getElementById("vizSheetSelector");
          if (sheets.length > 1 && sheetWrapper && sheetSelector) {
            sheetWrapper.style.display = "block";
            sheetSelector.innerHTML = sheets.map(
              (s, i) => `<option value="${s}" ${i === 0 ? "selected" : ""}>${s}</option>`
            ).join("");
            sheetSelector.onchange = () => loadVizDataWithOptions(file);
          } else if (sheetWrapper) {
            sheetWrapper.style.display = "none";
          }
        }
      } catch (err) {
        console.warn("Sayfa listesi al\u0131namad\u0131:", err);
      }
      const headerRowSelector = document.getElementById("vizHeaderRow");
      if (headerRowSelector) {
        headerRowSelector.onchange = () => loadVizDataWithOptions(file);
      }
      await loadVizDataWithOptions(file);
      showToast2(`${file.name} y\xFCklendi`, "success");
    } catch (error) {
      console.error("Dosya y\xFCkleme hatas\u0131:", error);
      showToast2("Dosya y\xFCklenemedi: " + error.message, "error");
    }
  }
  async function loadVizDataWithOptions(file) {
    try {
      const sheetSelector = document.getElementById("vizSheetSelector");
      const headerRowSelector = document.getElementById("vizHeaderRow");
      const selectedSheet = sheetSelector?.value || "";
      const headerRow = parseInt(headerRowSelector?.value || "0");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheet_name", selectedSheet);
      formData.append("header_row", headerRow.toString());
      console.log("\u{1F4CA} Veri y\xFCkleniyor...", { sheet: selectedSheet, headerRow });
      const response = await fetch("/viz/data", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log("\u2705 Veri al\u0131nd\u0131:", result.data?.length, "sat\u0131r,", result.columns?.length, "s\xFCtun");
      const dataset = VIZ_STATE.getActiveDataset();
      if (dataset) {
        dataset.data = result.data || [];
        dataset.columns = result.columns || [];
        dataset.columnsInfo = result.columns_info || [];
      }
      if (window.renderColumnsList) window.renderColumnsList();
      if (window.updateDropdowns) window.updateDropdowns();
      if (window.updateDataProfile) window.updateDataProfile();
    } catch (error) {
      console.error("Veri y\xFCkleme hatas\u0131:", error);
      showToast2("Veri y\xFCklenemedi: " + error.message, "error");
    }
  }
  function clearVizData() {
    const fileInfo = document.getElementById("vizFileInfo");
    const dropZone = document.getElementById("vizDropZone");
    const fileOptions = document.getElementById("vizFileOptions");
    const columnsList = document.getElementById("vizColumnsList");
    if (dropZone) dropZone.style.display = "block";
    if (fileInfo) fileInfo.style.display = "none";
    if (fileOptions) fileOptions.style.display = "none";
    if (columnsList) columnsList.innerHTML = "";
    if (VIZ_STATE.activeDatasetId) {
      removeDataset(VIZ_STATE.activeDatasetId);
    }
    showToast2("Veri temizlendi", "info");
  }

  // js/viz/charts/engine.js
  var engine_exports = {};
  __export(engine_exports, {
    createChartWidget: () => createChartWidget,
    renderChart: () => renderChart2,
    rerenderAllCharts: () => rerenderAllCharts,
    startWidgetResize: () => startWidgetResize
  });
  function createChartWidget(config) {
    const dashboard = document.getElementById("vizDashboardGrid");
    if (!dashboard) return;
    const widget = document.createElement("div");
    widget.className = "viz-chart-widget";
    widget.id = config.id;
    widget.innerHTML = `
        <div class="viz-widget-header">
            <span class="viz-widget-title">${config.title}</span>
            <button class="viz-widget-settings" onclick="event.stopPropagation(); showWidgetMenu('${config.id}', event)">
                <i class="fas fa-cog"></i>
            </button>
        </div>
        <div class="viz-widget-chart" id="${config.id}_chart"></div>
        <div class="viz-widget-resize-handle" onmousedown="startWidgetResize(event, '${config.id}')"></div>
    `;
    widget.addEventListener("click", () => selectChart(config.id));
    dashboard.appendChild(widget);
    renderChart2(config);
    if (typeof ResizeObserver !== "undefined") {
      const chartContainer = document.getElementById(`${config.id}_chart`);
      if (chartContainer) {
        const resizeObserver = new ResizeObserver(() => {
          const chart = VIZ_STATE.echartsInstances[config.id];
          if (chart) {
            chart.resize();
          }
        });
        resizeObserver.observe(chartContainer);
        if (!VIZ_STATE.resizeObservers) VIZ_STATE.resizeObservers = {};
        VIZ_STATE.resizeObservers[config.id] = resizeObserver;
      }
    }
  }
  function startWidgetResize(event, chartId) {
    event.preventDefault();
    event.stopPropagation();
    const widget = document.getElementById(chartId);
    if (!widget) return;
    if (widget.classList.contains("viz-widget-fullscreen")) return;
    const chartContainer = document.getElementById(`${chartId}_chart`);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = widget.offsetWidth;
    const startHeight = widget.offsetHeight;
    const chart = VIZ_STATE.echartsInstances[chartId];
    const headerHeight = 45;
    let resizeThrottle = null;
    function doResize(e) {
      const newWidth = Math.max(200, startWidth + e.clientX - startX);
      const newHeight = Math.max(150, startHeight + e.clientY - startY);
      widget.style.width = `${newWidth}px`;
      widget.style.height = `${newHeight}px`;
      if (chartContainer) {
        chartContainer.style.width = `${newWidth - 20}px`;
        chartContainer.style.height = `${newHeight - headerHeight - 10}px`;
      }
      if (!resizeThrottle) {
        resizeThrottle = setTimeout(() => {
          if (chart) chart.resize();
          resizeThrottle = null;
        }, 30);
      }
    }
    function stopResize() {
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
      if (chart) chart.resize();
    }
    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  }
  function renderChart2(config) {
    const chartDom = document.getElementById(`${config.id}_chart`);
    if (!chartDom) return;
    if (VIZ_STATE.echartsInstances[config.id]) {
      VIZ_STATE.echartsInstances[config.id].dispose();
    }
    const theme = document.body.classList.contains("day-mode") ? "light" : "dark";
    const chart = echarts.init(chartDom, theme);
    VIZ_STATE.echartsInstances[config.id] = chart;
    const dataset = config.datasetId ? VIZ_STATE.getDatasetById(config.datasetId) : VIZ_STATE.getActiveDataset();
    const chartData = dataset?.data || VIZ_STATE.data || [];
    let xData, yData;
    if (chartData && chartData.length > 0 && config.xAxis && config.yAxis) {
      let filteredData = chartData;
      if (VIZ_STATE.crossFilterEnabled && VIZ_STATE.crossFilterValue) {
        filteredData = chartData.filter(
          (row) => Object.values(row).some((v) => String(v) === VIZ_STATE.crossFilterValue)
        );
      }
      const aggregated = aggregateData(filteredData, config.xAxis, config.yAxis, config.aggregation, config.dataLimit || 20);
      xData = aggregated.categories;
      yData = aggregated.values;
      if (VIZ_STATE.whatIfMultiplier && VIZ_STATE.whatIfMultiplier !== 1 && config.id === VIZ_STATE.selectedChart) {
        yData = yData.map((v) => v * VIZ_STATE.whatIfMultiplier);
      }
    } else {
      xData = ["A", "B", "C", "D", "E"];
      yData = [120, 200, 150, 80, 70];
    }
    let option = {};
    switch (config.type) {
      case "bar":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          xAxis: {
            type: "category",
            data: xData,
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 50,
            axisLabel: {
              rotate: 60,
              interval: 0,
              fontSize: 10,
              formatter: function(value) {
                return String(value).length > 8 ? String(value).slice(0, 6) + ".." : value;
              }
            }
          },
          yAxis: {
            type: "value",
            name: config.yAxis || "",
            nameLocation: "middle",
            nameGap: 50
          },
          grid: { bottom: 120, left: 80, right: 20 },
          series: [{ data: yData, type: "bar", itemStyle: { color: config.color } }]
        };
        break;
      case "line":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: xData,
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 35,
            axisLabel: {
              rotate: 60,
              interval: 0,
              fontSize: 10,
              formatter: function(value) {
                return String(value).length > 8 ? String(value).slice(0, 6) + ".." : value;
              }
            }
          },
          yAxis: {
            type: "value",
            name: config.yAxis || "",
            nameLocation: "middle",
            nameGap: 50
          },
          grid: { bottom: 100, left: 80 },
          series: [{ data: yData, type: "line", smooth: true, itemStyle: { color: config.color } }]
        };
        break;
      case "pie":
      case "doughnut":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
          series: [{
            type: "pie",
            radius: config.type === "doughnut" ? ["40%", "70%"] : "70%",
            data: xData.map((name, i) => ({ value: yData[i], name })),
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0, 0, 0, 0.5)" } }
          }]
        };
        break;
      case "area":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: xData,
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 35,
            boundaryGap: false,
            axisLabel: {
              rotate: 60,
              interval: 0,
              fontSize: 10,
              formatter: function(value) {
                return String(value).length > 8 ? String(value).slice(0, 6) + ".." : value;
              }
            }
          },
          yAxis: {
            type: "value",
            name: config.yAxis || "",
            nameLocation: "middle",
            nameGap: 50
          },
          grid: { bottom: 100, left: 80 },
          series: [{ data: yData, type: "line", areaStyle: { color: config.color + "40" }, itemStyle: { color: config.color } }]
        };
        break;
      case "scatter":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "item", formatter: (p) => `${xData[p.dataIndex]}: ${p.value[1]}` },
          xAxis: { type: "value", name: config.xAxis },
          yAxis: { type: "value", name: config.yAxis },
          series: [{
            type: "scatter",
            data: yData.map((v, i) => [i, v]),
            itemStyle: { color: config.color }
          }]
        };
        break;
      // =====================================================
      // Ä°LERÄ° GRAFÄ°KLER (Faz 3)
      // =====================================================
      case "dual-axis":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
          legend: { top: 30, data: ["S\xC3\xBCtun", "\xC3\u2021izgi"] },
          xAxis: {
            type: "category",
            data: xData,
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 50,
            axisLabel: {
              rotate: 60,
              interval: 0,
              fontSize: 10,
              formatter: function(value) {
                return String(value).length > 8 ? String(value).slice(0, 6) + ".." : value;
              }
            }
          },
          yAxis: [
            { type: "value", name: config.yAxis || "Sol Eksen", position: "left", nameLocation: "middle", nameGap: 50 },
            { type: "value", name: "Sa\xC4\u0178 Eksen", position: "right" }
          ],
          grid: { bottom: 120, left: 80, top: 60 },
          series: [
            { name: "S\xC3\xBCtun", type: "bar", data: yData, itemStyle: { color: config.color } },
            { name: "\xC3\u2021izgi", type: "line", yAxisIndex: 1, data: yData.map((v) => v * 0.8), smooth: true, itemStyle: { color: "#ffc107" } }
          ]
        };
        break;
      case "stacked-bar":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          legend: { top: 30, data: ["Kategori A", "Kategori B", "Kategori C"] },
          xAxis: {
            type: "category",
            data: xData,
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 50,
            axisLabel: {
              rotate: 60,
              interval: 0,
              fontSize: 10,
              formatter: function(value) {
                return String(value).length > 8 ? String(value).slice(0, 6) + ".." : value;
              }
            }
          },
          yAxis: {
            type: "value",
            name: config.yAxis || "",
            nameLocation: "middle",
            nameGap: 50
          },
          grid: { bottom: 120, left: 80, top: 60 },
          series: [
            { name: "Kategori A", type: "bar", stack: "total", data: yData, itemStyle: { color: config.color } },
            { name: "Kategori B", type: "bar", stack: "total", data: yData.map((v) => v * 0.6), itemStyle: { color: "#00d97e" } },
            { name: "Kategori C", type: "bar", stack: "total", data: yData.map((v) => v * 0.4), itemStyle: { color: "#ffc107" } }
          ]
        };
        break;
      case "treemap":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { formatter: "{b}: {c}" },
          series: [{
            type: "treemap",
            data: xData.map((name, i) => ({
              name,
              value: yData[i],
              itemStyle: { color: `hsl(${i * 360 / xData.length}, 70%, 50%)` }
            })),
            label: { show: true, formatter: "{b}\n{c}" },
            breadcrumb: { show: false }
          }]
        };
        break;
      case "heatmap":
        const heatmapData = [];
        const categories = xData.slice(0, 5);
        for (let i = 0; i < categories.length; i++) {
          for (let j = 0; j < categories.length; j++) {
            heatmapData.push([i, j, Math.round(Math.random() * 100) / 100]);
          }
        }
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { position: "top", formatter: (p) => `${categories[p.data[0]]} - ${categories[p.data[1]]}: ${p.data[2]}` },
          xAxis: {
            type: "category",
            data: categories.map((c) => String(c).length > 8 ? String(c).slice(0, 6) + ".." : c),
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 35,
            splitArea: { show: true },
            axisLabel: { fontSize: 10, rotate: 45 }
          },
          yAxis: {
            type: "category",
            data: categories.map((c) => String(c).length > 8 ? String(c).slice(0, 6) + ".." : c),
            name: config.yAxis || "",
            nameLocation: "middle",
            nameGap: 50,
            splitArea: { show: true },
            axisLabel: { fontSize: 10 }
          },
          grid: { bottom: 80, left: 80 },
          visualMap: {
            min: 0,
            max: 1,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: 10,
            inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027"] }
          },
          series: [{
            type: "heatmap",
            data: heatmapData,
            label: { show: true, formatter: (p) => p.data[2].toFixed(2) },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" } }
          }]
        };
        break;
      case "funnel":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
          series: [{
            type: "funnel",
            left: "10%",
            width: "80%",
            top: 50,
            bottom: 20,
            sort: "descending",
            gap: 2,
            label: { show: true, position: "inside" },
            data: xData.map((name, i) => ({
              name,
              value: yData[i]
            })).sort((a, b) => b.value - a.value)
          }]
        };
        break;
      case "gauge":
        const avgValue = yData.reduce((a, b) => a + b, 0) / yData.length;
        const maxVal = Math.max(...yData);
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { formatter: "{b}: {c}" },
          series: [{
            type: "gauge",
            min: 0,
            max: maxVal * 1.2,
            progress: { show: true, width: 18 },
            axisLine: { lineStyle: { width: 18 } },
            axisTick: { show: false },
            splitLine: { length: 15, lineStyle: { width: 2, color: "#999" } },
            axisLabel: { distance: 25, color: "#999", fontSize: 10 },
            anchor: { show: true, size: 25, itemStyle: { borderWidth: 2 } },
            title: { show: true },
            detail: {
              valueAnimation: true,
              fontSize: 24,
              offsetCenter: [0, "70%"],
              formatter: "{value}"
            },
            data: [{ value: Math.round(avgValue), name: "Ortalama" }]
          }]
        };
        break;
      case "waterfall":
        const waterfallData = [];
        let cumulative = 0;
        yData.forEach((val, i) => {
          if (i === 0) {
            waterfallData.push({ value: val, itemStyle: { color: config.color } });
            cumulative = val;
          } else {
            const change = val - yData[i - 1];
            waterfallData.push({
              value: change,
              itemStyle: { color: change >= 0 ? "#00d97e" : "#dc3545" }
            });
            cumulative += change;
          }
        });
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          xAxis: {
            type: "category",
            data: xData,
            name: config.xAxis || "",
            nameLocation: "center",
            nameGap: 50,
            axisLabel: {
              rotate: 60,
              interval: 0,
              fontSize: 10,
              formatter: function(value) {
                return String(value).length > 8 ? String(value).slice(0, 6) + ".." : value;
              }
            }
          },
          yAxis: {
            type: "value",
            name: config.yAxis || "",
            nameLocation: "middle",
            nameGap: 50
          },
          grid: { bottom: 120, left: 80 },
          series: [{
            type: "bar",
            stack: "waterfall",
            data: waterfallData,
            label: { show: true, position: "top", formatter: (p) => p.value >= 0 ? `+${p.value}` : p.value }
          }]
        };
        break;
      case "radar":
        const maxRadar = Math.max(...yData) * 1.2;
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: {},
          radar: {
            indicator: xData.slice(0, 6).map((name) => ({ name, max: maxRadar })),
            center: ["50%", "55%"],
            radius: "65%"
          },
          series: [{
            type: "radar",
            data: [{
              value: yData.slice(0, 6),
              name: config.title,
              areaStyle: { color: config.color + "40" },
              lineStyle: { color: config.color },
              itemStyle: { color: config.color }
            }]
          }]
        };
        break;
      case "boxplot":
        const sortedVals = [...yData].sort((a, b) => a - b);
        const n = sortedVals.length;
        const q1 = sortedVals[Math.floor(n * 0.25)];
        const median = sortedVals[Math.floor(n * 0.5)];
        const q3 = sortedVals[Math.floor(n * 0.75)];
        const min = sortedVals[0];
        const max = sortedVals[n - 1];
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "item", formatter: (p) => `Min: ${min}<br>Q1: ${q1}<br>Medyan: ${median}<br>Q3: ${q3}<br>Max: ${max}` },
          xAxis: { type: "category", data: [config.yAxis || "De\xC4\u0178er"] },
          yAxis: { type: "value" },
          series: [{
            type: "boxplot",
            data: [[min, q1, median, q3, max]],
            itemStyle: { color: config.color, borderColor: config.color }
          }]
        };
        break;
      case "pareto":
        const paretoSorted = yData.map((v, i) => ({ label: xData[i] || `Item ${i + 1}`, value: v })).sort((a, b) => b.value - a.value);
        const paretoLabels = paretoSorted.map((d) => d.label);
        const paretoValues = paretoSorted.map((d) => d.value);
        const paretoTotal = paretoValues.reduce((a, b) => a + b, 0);
        let paretoCumulative = 0;
        const cumulativePercent = paretoValues.map((v) => {
          paretoCumulative += v;
          return (paretoCumulative / paretoTotal * 100).toFixed(1);
        });
        option = {
          title: { text: config.title || "Pareto Analizi (80/20)", left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          legend: { data: ["De\xC4\u0178er", "K\xC3\xBCm\xC3\xBClatif %"], bottom: 0 },
          xAxis: { type: "category", data: paretoLabels, axisLabel: { rotate: 45 } },
          yAxis: [
            { type: "value", name: "De\xC4\u0178er", position: "left" },
            { type: "value", name: "K\xC3\xBCm\xC3\xBClatif %", max: 100, position: "right", axisLabel: { formatter: "{value}%" } }
          ],
          series: [
            {
              name: "De\xC4\u0178er",
              type: "bar",
              data: paretoValues,
              itemStyle: { color: config.color || "#3498db" }
            },
            {
              name: "K\xC3\xBCm\xC3\xBClatif %",
              type: "line",
              yAxisIndex: 1,
              data: cumulativePercent,
              smooth: true,
              symbol: "circle",
              symbolSize: 8,
              itemStyle: { color: "#e74c3c" },
              markLine: {
                silent: true,
                data: [{ yAxis: 80, name: "80%", lineStyle: { color: "#27ae60", type: "dashed" } }]
              }
            }
          ]
        };
        break;
      // =====================================================
      // 3D GRAFÄ°KLER (Faz 4) - echarts-gl
      // =====================================================
      case "scatter3d":
        const scatter3dData = yData.map((v, i) => [
          i,
          v,
          Math.random() * v
        ]);
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: {},
          xAxis3D: { type: "value", name: "X" },
          yAxis3D: { type: "value", name: "Y" },
          zAxis3D: { type: "value", name: "Z" },
          grid3D: {
            viewControl: {
              autoRotate: true,
              autoRotateSpeed: 10
            },
            light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
          },
          series: [{
            type: "scatter3D",
            data: scatter3dData,
            symbolSize: 12,
            itemStyle: {
              color: config.color,
              opacity: 0.8
            }
          }]
        };
        break;
      case "bar3d":
        const bar3dData = [];
        const xLen = Math.min(xData.length, 5);
        for (let i = 0; i < xLen; i++) {
          for (let j = 0; j < 3; j++) {
            bar3dData.push([i, j, yData[i] * (0.5 + Math.random() * 0.5)]);
          }
        }
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: {},
          visualMap: {
            min: 0,
            max: Math.max(...yData) * 1.5,
            inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#fee090", "#fdae61", "#f46d43", "#d73027"] },
            show: false
          },
          xAxis3D: { type: "category", data: xData.slice(0, 5), name: config.xAxis },
          yAxis3D: { type: "category", data: ["A", "B", "C"], name: "Grup" },
          zAxis3D: { type: "value", name: "De\xC4\u0178er" },
          grid3D: {
            boxWidth: 100,
            boxDepth: 80,
            viewControl: { autoRotate: true, autoRotateSpeed: 5 },
            light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
          },
          series: [{
            type: "bar3D",
            data: bar3dData.map((item) => ({
              value: [item[0], item[1], item[2]]
            })),
            shading: "lambert",
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12 } }
          }]
        };
        break;
      case "surface3d":
        const surfaceData = [];
        for (let x = -3; x <= 3; x += 0.3) {
          for (let y = -3; y <= 3; y += 0.3) {
            const z = Math.sin(Math.sqrt(x * x + y * y));
            surfaceData.push([x, y, z]);
          }
        }
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: {},
          visualMap: {
            min: -1,
            max: 1,
            inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027"] },
            show: true,
            dimension: 2
          },
          xAxis3D: { type: "value" },
          yAxis3D: { type: "value" },
          zAxis3D: { type: "value" },
          grid3D: {
            viewControl: { autoRotate: true, autoRotateSpeed: 8 },
            light: { main: { intensity: 1.5 }, ambient: { intensity: 0.2 } }
          },
          series: [{
            type: "surface",
            data: surfaceData,
            wireframe: { show: true },
            shading: "color"
          }]
        };
        break;
      case "line3d":
        const line3dData = [];
        for (let t = 0; t < 25; t++) {
          const x = Math.cos(t);
          const y = Math.sin(t);
          const z = t / 10;
          line3dData.push([x * (1 + z), y * (1 + z), z]);
        }
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: {},
          xAxis3D: { type: "value" },
          yAxis3D: { type: "value" },
          zAxis3D: { type: "value" },
          grid3D: {
            viewControl: { autoRotate: true, autoRotateSpeed: 10 },
            light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
          },
          series: [{
            type: "line3D",
            data: line3dData,
            lineStyle: { width: 4, color: config.color },
            smooth: true
          }]
        };
        break;
      // =====================================================
      // YENÄ° GRAFÄ°K TÄ°PLERÄ° (Sprint 3 - Faz 2)
      // =====================================================
      case "histogram":
        const binCount = 10;
        const histMin = Math.min(...yData);
        const histMax = Math.max(...yData);
        const binWidth = (histMax - histMin) / binCount;
        const bins = new Array(binCount).fill(0);
        const binLabels = [];
        for (let i = 0; i < binCount; i++) {
          binLabels.push(`${(histMin + i * binWidth).toFixed(1)}`);
        }
        yData.forEach((v) => {
          const binIndex = Math.min(Math.floor((v - histMin) / binWidth), binCount - 1);
          if (binIndex >= 0) bins[binIndex]++;
        });
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          xAxis: { type: "category", data: binLabels, name: "Aral\xC4\xB1k" },
          yAxis: { type: "value", name: "Frekans" },
          series: [{
            type: "bar",
            data: bins,
            barWidth: "90%",
            itemStyle: { color: config.color }
          }]
        };
        break;
      case "bubble":
        const bubbleData = yData.map((v, i) => [
          i,
          v,
          Math.abs(v) / Math.max(...yData.map(Math.abs)) * 50 + 10
        ]);
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { formatter: (p) => `${xData[p.data[0]]}: ${p.data[1]}` },
          xAxis: { type: "value", name: "X" },
          yAxis: { type: "value", name: "Y" },
          series: [{
            type: "scatter",
            data: bubbleData,
            symbolSize: (data) => data[2],
            itemStyle: { color: config.color, opacity: 0.7 }
          }]
        };
        break;
      case "sunburst":
        const sunburstData = xData.slice(0, 8).map((name, i) => ({
          name,
          value: yData[i],
          children: [{
            name: `${name} A`,
            value: yData[i] * 0.6
          }, {
            name: `${name} B`,
            value: yData[i] * 0.4
          }]
        }));
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { formatter: "{b}: {c}" },
          series: [{
            type: "sunburst",
            data: sunburstData,
            radius: [0, "90%"],
            label: { show: true, fontSize: 10 },
            itemStyle: { borderRadius: 4, borderWidth: 2 }
          }]
        };
        break;
      case "sankey":
        const sankeyNodes = xData.slice(0, 6).map((name) => ({ name }));
        sankeyNodes.push({ name: "Toplam" });
        const sankeyLinks = xData.slice(0, 6).map((name, i) => ({
          source: name,
          target: "Toplam",
          value: yData[i]
        }));
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "item", formatter: "{b}: {c}" },
          series: [{
            type: "sankey",
            layout: "none",
            emphasis: { focus: "adjacency" },
            data: sankeyNodes,
            links: sankeyLinks,
            lineStyle: { color: "gradient", curveness: 0.5 }
          }]
        };
        break;
      case "step":
      case "step-line":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: xData, axisLabel: { rotate: 45, interval: 0 } },
          yAxis: { type: "value" },
          grid: { bottom: 80 },
          series: [{
            type: "line",
            step: "middle",
            data: yData,
            itemStyle: { color: config.color },
            areaStyle: { color: config.color + "20" }
          }]
        };
        break;
      case "lollipop":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: xData, axisLabel: { rotate: 45, interval: 0 } },
          yAxis: { type: "value" },
          grid: { bottom: 80 },
          series: [
            {
              type: "bar",
              data: yData,
              barWidth: 4,
              itemStyle: { color: config.color }
            },
            {
              type: "scatter",
              data: yData,
              symbolSize: 15,
              itemStyle: { color: config.color }
            }
          ]
        };
        break;
      case "bullet":
        const bulletActual = yData.reduce((a, b) => a + b, 0) / yData.length;
        const bulletTarget = bulletActual * 1.2;
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { formatter: `Ger\xC3\xA7ek: ${bulletActual.toFixed(0)}<br>Hedef: ${bulletTarget.toFixed(0)}` },
          xAxis: { type: "value", max: bulletTarget * 1.3 },
          yAxis: { type: "category", data: ["KPI"] },
          series: [
            {
              type: "bar",
              data: [bulletTarget * 1.2],
              barWidth: 30,
              itemStyle: { color: "#e0e0e0" },
              z: 1
            },
            {
              type: "bar",
              data: [bulletActual],
              barWidth: 15,
              itemStyle: { color: bulletActual >= bulletTarget ? "#27ae60" : config.color },
              z: 2
            },
            {
              type: "scatter",
              data: [[bulletTarget, 0]],
              symbol: "rect",
              symbolSize: [4, 35],
              itemStyle: { color: "#333" },
              z: 3
            }
          ]
        };
        break;
      case "polar":
      case "rose":
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { trigger: "item" },
          polar: { radius: [30, "80%"] },
          angleAxis: { type: "category", data: xData.slice(0, 8), startAngle: 90 },
          radiusAxis: {},
          series: [{
            type: "bar",
            data: yData.slice(0, 8),
            coordinateSystem: "polar",
            itemStyle: { color: config.color }
          }]
        };
        break;
      case "calendar":
        const calendarData = [];
        const startDate = /* @__PURE__ */ new Date();
        startDate.setDate(1);
        startDate.setMonth(0);
        for (let i = 0; i < 365; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          calendarData.push([dateStr, Math.floor(Math.random() * 100)]);
        }
        option = {
          title: { text: config.title, left: "center", textStyle: { fontSize: 14 } },
          tooltip: { formatter: (p) => `${p.data[0]}: ${p.data[1]}` },
          visualMap: {
            min: 0,
            max: 100,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: 10,
            inRange: { color: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"] }
          },
          calendar: {
            top: 60,
            left: 50,
            right: 30,
            cellSize: 13,
            range: (/* @__PURE__ */ new Date()).getFullYear(),
            itemStyle: { borderWidth: 1, borderColor: "#fff" }
          },
          series: [{
            type: "heatmap",
            coordinateSystem: "calendar",
            data: calendarData
          }]
        };
        break;
      default:
        option = {
          title: { text: config.title, left: "center" },
          series: []
        };
    }
    chart.setOption(option);
    chart.off("click");
    chart.on("click", (params) => {
      if (!VIZ_STATE.crossFilterEnabled) return;
      const clickedValue = params.name || params.data?.name || params.value;
      if (!clickedValue) return;
      console.log("\u011F\u0178\u201D\u2014 Cross-filter t\xC4\xB1klama:", clickedValue);
      if (VIZ_STATE.crossFilterValue === clickedValue) {
        VIZ_STATE.crossFilterValue = null;
        showToast("Cross-filter kald\xC4\xB1r\xC4\xB1ld\xC4\xB1", "info");
      } else {
        VIZ_STATE.crossFilterValue = String(clickedValue);
        showToast(`Filtre: "${clickedValue}"`, "info");
      }
      rerenderAllCharts();
    });
    if (config.overlays || document.getElementById("showMeanLine")?.checked || document.getElementById("showMedianLine")?.checked || document.getElementById("showStdBand")?.checked || document.getElementById("showTrendLine")?.checked) {
      setTimeout(() => applyStatisticalOverlays(chart, config, yData), 100);
    }
    const resizeHandler = () => chart.resize();
    window.removeEventListener("resize", resizeHandler);
    window.addEventListener("resize", resizeHandler);
  }
  function rerenderAllCharts() {
    VIZ_STATE.charts.forEach((config) => {
      renderChart2(config);
    });
  }

  // js/viz/charts/manager.js
  var manager_exports2 = {};
  __export(manager_exports2, {
    addChart: () => addChart,
    applyChartSettings: () => applyChartSettings,
    clearDashboard: () => clearDashboard,
    closeWidgetMenu: () => closeWidgetMenu,
    deleteSelectedChart: () => deleteSelectedChart,
    duplicateWidget: () => duplicateWidget,
    editWidget: () => editWidget,
    hideSettings: () => hideSettings,
    loadDashboardFromStorage: () => loadDashboardFromStorage,
    saveDashboard: () => saveDashboard,
    selectChart: () => selectChart2,
    showSaveMenu: () => showSaveMenu,
    showSettings: () => showSettings,
    showWidgetMenu: () => showWidgetMenu,
    toggleWidgetFullscreen: () => toggleWidgetFullscreen,
    updateEmptyState: () => updateEmptyState
  });
  function addChart(type = "bar") {
    const chartId = `chart_${++VIZ_STATE.chartCounter}`;
    const chartConfig = {
      id: chartId,
      type,
      title: `Grafik ${VIZ_STATE.chartCounter}`,
      xAxis: VIZ_STATE.columns[0] || "",
      yAxis: VIZ_STATE.columns[1] || VIZ_STATE.columns[0] || "",
      aggregation: "sum",
      color: "#4a90d9",
      dataLimit: 20,
      // VarsayÄ±lan veri limiti (0 = sÄ±nÄ±rsÄ±z)
      datasetId: VIZ_STATE.activeDatasetId
      // Multi-dataset desteÄŸi
    };
    VIZ_STATE.charts.push(chartConfig);
    createChartWidget(chartConfig);
    updateEmptyState();
    selectChart2(chartId);
  }
  function showWidgetMenu(chartId, event) {
    closeWidgetMenu();
    const widget = document.getElementById(chartId);
    const isFullscreen = widget && widget.classList.contains("viz-widget-fullscreen");
    const menu = document.createElement("div");
    menu.id = "widgetActionMenu";
    menu.className = "viz-widget-menu";
    menu.innerHTML = `
        <div class="viz-widget-menu-item" onclick="editWidget('${chartId}'); closeWidgetMenu();">
            <i class="fas fa-edit"></i> D\xC3\xBCzenle
        </div>
        <div class="viz-widget-menu-item" onclick="toggleWidgetFullscreen('${chartId}'); closeWidgetMenu();">
            <i class="fas ${isFullscreen ? "fa-compress" : "fa-expand"}"></i> ${isFullscreen ? "K\xC3\xBC\xC3\xA7\xC3\xBClt" : "B\xC3\xBCy\xC3\xBCt"}
        </div>
        <div class="viz-widget-menu-item" onclick="duplicateWidget('${chartId}'); closeWidgetMenu();">
            <i class="fas fa-copy"></i> Kopyala
        </div>
        <div class="viz-widget-menu-item viz-menu-danger" onclick="removeWidget('${chartId}'); closeWidgetMenu();">
            <i class="fas fa-trash"></i> Sil
        </div>
    `;
    const rect = event.target.closest("button").getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.zIndex = "10001";
    const menuWidth = 160;
    if (rect.left + menuWidth > window.innerWidth) {
      menu.style.right = `${window.innerWidth - rect.right}px`;
    } else {
      menu.style.left = `${rect.left}px`;
    }
    document.body.appendChild(menu);
    setTimeout(() => {
      document.addEventListener("click", closeWidgetMenu);
    }, 100);
  }
  function closeWidgetMenu() {
    const menu = document.getElementById("widgetActionMenu");
    if (menu) menu.remove();
    document.removeEventListener("click", closeWidgetMenu);
  }
  function editWidget(chartId) {
    selectChart2(chartId);
    const settingsPane = document.getElementById("vizSettingsPane");
    if (settingsPane) {
      settingsPane.scrollIntoView({ behavior: "smooth" });
    }
    showToast2("Grafik se\xC3\xA7ildi - sa\xC4\u0178 panelden d\xC3\xBCzenleyebilirsiniz", "info");
  }
  function toggleWidgetFullscreen(chartId) {
    const widget = document.getElementById(chartId);
    if (!widget) return;
    const isFullscreen = widget.classList.contains("viz-widget-fullscreen");
    if (isFullscreen) {
      widget.classList.remove("viz-widget-fullscreen");
      widget.style.width = "";
      widget.style.height = "";
      showToast2("Normal g\xC3\xB6r\xC3\xBCn\xC3\xBCm", "info");
    } else {
      widget.classList.add("viz-widget-fullscreen");
      showToast2('Tam ekran - \xC3\xA7arktan "K\xC3\xBC\xC3\xA7\xC3\xBClt" ile \xC3\xA7\xC4\xB1k\xC4\xB1n', "info");
    }
    setTimeout(() => {
      const chart = VIZ_STATE.echartsInstances[chartId];
      if (chart) chart.resize();
    }, 350);
  }
  function duplicateWidget(chartId) {
    const config = VIZ_STATE.charts.find((c) => c.id === chartId);
    if (!config) return;
    const newConfig = {
      ...config,
      id: `chart_${++VIZ_STATE.chartCounter}`,
      title: `${config.title} (Kopya)`
    };
    VIZ_STATE.charts.push(newConfig);
    createChartWidget(newConfig);
    showToast2("Grafik kopyaland\xC4\xB1", "success");
  }
  function selectChart2(chartId) {
    document.querySelectorAll(".viz-chart-widget").forEach((w) => w.classList.remove("selected"));
    const widget = document.getElementById(chartId);
    if (widget) {
      widget.classList.add("selected");
    }
    VIZ_STATE.selectedChart = chartId;
    showSettings(chartId);
  }
  function showSettings(chartId) {
    const config = VIZ_STATE.charts.find((c) => c.id === chartId);
    if (!config) return;
    document.getElementById("vizNoSelection").style.display = "none";
    document.getElementById("vizSettingsForm").style.display = "block";
    document.getElementById("chartTitle").value = config.title;
    document.getElementById("chartXAxis").value = config.xAxis;
    document.getElementById("chartYAxis").value = config.yAxis;
    document.getElementById("chartAggregation").value = config.aggregation;
    document.getElementById("chartColor").value = config.color;
    document.querySelector(".viz-color-preview").style.background = config.color;
    const dataLimitInput = document.getElementById("chartDataLimit");
    if (dataLimitInput) {
      dataLimitInput.value = config.dataLimit || 20;
    }
  }
  function hideSettings() {
    document.getElementById("vizNoSelection").style.display = "flex";
    document.getElementById("vizSettingsForm").style.display = "none";
    VIZ_STATE.selectedChart = null;
    document.querySelectorAll(".viz-chart-widget").forEach((w) => w.classList.remove("selected"));
  }
  function applyChartSettings() {
    if (!VIZ_STATE.selectedChart) return;
    const config = VIZ_STATE.charts.find((c) => c.id === VIZ_STATE.selectedChart);
    if (!config) return;
    config.title = document.getElementById("chartTitle").value;
    config.xAxis = document.getElementById("chartXAxis").value;
    config.yAxis = document.getElementById("chartYAxis").value;
    config.aggregation = document.getElementById("chartAggregation").value;
    config.color = document.getElementById("chartColor").value;
    const dataLimitInput = document.getElementById("chartDataLimit");
    if (dataLimitInput) {
      config.dataLimit = parseInt(dataLimitInput.value) || 0;
    }
    const widget = document.getElementById(config.id);
    if (widget) {
      widget.querySelector(".viz-widget-title").textContent = config.title;
    }
    renderChart2(config);
    showToast2("Grafik ayarlar\xC4\xB1 uyguland\xC4\xB1", "success");
  }
  function deleteSelectedChart() {
    if (!VIZ_STATE.selectedChart) return;
    const chartId = VIZ_STATE.selectedChart;
    if (VIZ_STATE.echartsInstances[chartId]) {
      VIZ_STATE.echartsInstances[chartId].dispose();
      delete VIZ_STATE.echartsInstances[chartId];
    }
    const widget = document.getElementById(chartId);
    if (widget) widget.remove();
    VIZ_STATE.charts = VIZ_STATE.charts.filter((c) => c.id !== chartId);
    hideSettings();
    updateEmptyState();
  }
  function clearDashboard() {
    VIZ_STATE.charts.forEach((c) => {
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
  function updateEmptyState() {
    const empty = document.getElementById("vizEmptyCanvas");
    const dashboard = document.getElementById("vizDashboardGrid");
    if (empty && dashboard) {
      const widgetCount = dashboard.querySelectorAll(".viz-chart-widget").length;
      empty.style.display = widgetCount === 0 ? "flex" : "none";
    }
  }
  function showSaveMenu() {
    saveDashboard();
  }
  function saveDashboard() {
    const dashboardData = {
      charts: VIZ_STATE.charts,
      chartCounter: VIZ_STATE.chartCounter,
      savedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    localStorage.setItem("viz_dashboard", JSON.stringify(dashboardData));
    console.log("\u011F\u0178\u2019\xBE Dashboard kaydedildi");
    showToast2(VIZ_TEXTS2[VIZ_STATE.lang].dashboard_saved, "success");
  }
  function loadDashboardFromStorage() {
    const saved = localStorage.getItem("viz_dashboard");
    if (!saved) return;
    try {
      const dashboardData = JSON.parse(saved);
      if (dashboardData.charts && dashboardData.charts.length > 0) {
        VIZ_STATE.chartCounter = dashboardData.chartCounter || 0;
        dashboardData.charts.forEach((config) => {
          VIZ_STATE.charts.push(config);
          createChartWidget(config);
        });
        updateEmptyState();
        console.log("\u011F\u0178\u201C\u201A Dashboard y\xC3\xBCklendi:", dashboardData.charts.length, "grafik");
      }
    } catch (e) {
      console.error("Dashboard y\xC3\xBCkleme hatas\xC4\xB1:", e);
    }
  }

  // js/viz/stats/manager.js
  var manager_exports3 = {};
  __export(manager_exports3, {
    applyCrossFilter: () => applyCrossFilter,
    applyStatisticalOverlays: () => applyStatisticalOverlays2,
    applyWhatIfChange: () => applyWhatIfChange,
    getStatisticalOverlays: () => getStatisticalOverlays,
    setupBIListeners: () => setupBIListeners,
    setupOverlayListeners: () => setupOverlayListeners,
    setupSPSSListeners: () => setupSPSSListeners,
    updateStatsSummary: () => updateStatsSummary,
    updateTrendInsight: () => updateTrendInsight
  });

  // js/viz/stats/tests.js
  var tests_exports = {};
  __export(tests_exports, {
    runANOVA: () => runANOVA,
    runCorrelation: () => runCorrelation,
    runNormalityTest: () => runNormalityTest,
    runStatTest: () => runStatTest,
    runTTest: () => runTTest,
    updateRegressionResults: () => updateRegressionResults2
  });
  function updateRegressionResults2(config) {
    const resultsDiv = document.getElementById("regressionResults");
    const rSquaredEl = document.getElementById("rSquared");
    const equationEl = document.getElementById("regressionEquation");
    if (!config.regressionType || config.regressionType === "none") {
      if (resultsDiv) resultsDiv.style.display = "none";
      return;
    }
    let yData = [];
    if (VIZ_STATE.data && VIZ_STATE.data.length > 0 && config.xAxis && config.yAxis) {
      const aggregated = aggregateData(VIZ_STATE.data, config.xAxis, config.yAxis, config.aggregation);
      yData = aggregated.values;
    } else {
      yData = [120, 200, 150, 80, 70];
    }
    if (typeof regression !== "undefined") {
      const data = yData.map((v, i) => [i, v]);
      let result;
      switch (config.regressionType) {
        case "linear":
          result = regression.linear(data);
          break;
        case "polynomial":
          result = regression.polynomial(data, { order: 2 });
          break;
        case "exponential":
          result = regression.exponential(data);
          break;
        case "logarithmic":
          result = regression.logarithmic(data);
          break;
        default:
          result = null;
      }
      if (result && resultsDiv) {
        resultsDiv.style.display = "block";
        rSquaredEl.textContent = result.r2.toFixed(4);
        equationEl.textContent = result.string;
      }
    } else if (resultsDiv) {
      resultsDiv.style.display = "none";
    }
  }
  function runStatTest(testType) {
    let yData = [];
    if (VIZ_STATE.selectedChart) {
      const config = VIZ_STATE.charts.find((c) => c.id === VIZ_STATE.selectedChart);
      if (config && VIZ_STATE.data && config.yAxis) {
        yData = VIZ_STATE.data.map((row) => parseFloat(row[config.yAxis])).filter((v) => !isNaN(v));
      }
    }
    if (yData.length < 3) {
      yData = [120, 200, 150, 80, 70, 130, 180, 95, 160, 140];
    }
    const resultsDiv = document.getElementById("testResults");
    const testNameEl = document.getElementById("testName");
    const pValueEl = document.getElementById("testPValue");
    const resultBodyEl = document.getElementById("testResultBody");
    if (!resultsDiv) return;
    resultsDiv.style.display = "block";
    switch (testType) {
      case "ttest":
        runTTest(yData, testNameEl, pValueEl, resultBodyEl);
        break;
      case "anova":
        runANOVA(yData, testNameEl, pValueEl, resultBodyEl);
        break;
      case "correlation":
        runCorrelation(yData, testNameEl, pValueEl, resultBodyEl);
        break;
      case "normality":
        runNormalityTest(yData, testNameEl, pValueEl, resultBodyEl);
        break;
    }
    showToast2(VIZ_TEXTS[VIZ_STATE.lang].test_completed || "Test tamamland\xC4\xB1", "success");
  }
  function runTTest(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = "Tek \xC3\u2013rnek t-Test";
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (data.length - 1));
    const se = std / Math.sqrt(data.length);
    const t = mean / se;
    let pValue = 0.05;
    if (typeof jStat !== "undefined") {
      pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), data.length - 1));
    }
    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.5 ? "viz-p-value viz-significant" : "viz-p-value";
    const df = data.length - 1;
    let ciLower = mean, ciUpper = mean;
    if (typeof jStat !== "undefined") {
      const tCrit = Math.abs(jStat.studentt.inv(0.025, df));
      ciLower = mean - tCrit * se;
      ciUpper = mean + tCrit * se;
    }
    const interpretation = pValue < 0.05 ? "\xE2\u0153\u2026 \xC4\xB0statistiksel olarak anlaml\xC4\xB1 fark var" : "\xE2\x9D\u0152 Anlaml\xC4\xB1 fark yok";
    bodyEl.innerHTML = `
        <div>n = ${data.length}</div>
        <div>Ortalama = ${mean.toFixed(2)}</div>
        <div>Std Sapma = ${std.toFixed(2)}</div>
        <div>t = ${t.toFixed(3)}</div>
        <div>df = ${df}</div>
        <div>G\xC3\xBCven Aral\xC4\xB1\xC4\u0178\xC4\xB1 (95%) = [${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]</div>
        <div class="${pValue < 0.05 ? "viz-significant" : ""}">${interpretation}</div>
    `;
  }
  function runANOVA(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = "Tek Y\xC3\xB6nl\xC3\xBC ANOVA";
    const third = Math.floor(data.length / 3);
    const groups = [
      data.slice(0, third),
      data.slice(third, 2 * third),
      data.slice(2 * third)
    ];
    const grandMean = data.reduce((a, b) => a + b, 0) / data.length;
    const groupMeans = groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
    const ssb = groups.reduce((acc, g, i) => acc + g.length * Math.pow(groupMeans[i] - grandMean, 2), 0);
    const dfb = groups.length - 1;
    const msb = ssb / dfb;
    let ssw = 0;
    groups.forEach((g, i) => {
      g.forEach((v) => {
        ssw += Math.pow(v - groupMeans[i], 2);
      });
    });
    const dfw = data.length - groups.length;
    const msw = ssw / dfw;
    const f = msb / msw;
    let pValue = 0.05;
    if (typeof jStat !== "undefined") {
      pValue = 1 - jStat.centralF.cdf(f, dfb, dfw);
    }
    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.05 ? "viz-p-value viz-significant" : "viz-p-value";
    bodyEl.innerHTML = `
        <div>Gruplar: ${groups.length}</div>
        <div>F(${dfb}, ${dfw}) = ${f.toFixed(3)}</div>
        <div>MSB = ${msb.toFixed(2)}, MSW = ${msw.toFixed(2)}</div>
        <div class="${pValue < 0.05 ? "viz-significant" : ""}">${pValue < 0.05 ? "\xE2\u0153\u2026 Gruplar aras\xC4\xB1 fark anlaml\xC4\xB1" : "\xE2\x9D\u0152 Anlaml\xC4\xB1 fark yok"}</div>
    `;
  }
  function runCorrelation(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = "Pearson Korelasyon";
    const x = data.slice(0, -1);
    const y = data.slice(1);
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      denX += Math.pow(x[i] - meanX, 2);
      denY += Math.pow(y[i] - meanY, 2);
    }
    const r = num / Math.sqrt(denX * denY);
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    let pValue = 0.05;
    if (typeof jStat !== "undefined") {
      pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 2));
    }
    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue < 0.05 ? "viz-p-value viz-significant" : "viz-p-value";
    const strength = Math.abs(r) > 0.7 ? "G\xC3\xBC\xC3\xA7l\xC3\xBC" : Math.abs(r) > 0.4 ? "Orta" : "Zay\xC4\xB1f";
    const direction = r > 0 ? "Pozitif" : "Negatif";
    bodyEl.innerHTML = `
        <div>r = ${r.toFixed(4)}</div>
        <div>R\xC2\xB2 = ${(r * r).toFixed(4)}</div>
        <div>\xC4\xB0li\xC5\u0178ki: ${direction} ${strength}</div>
        <div class="${pValue < 0.05 ? "viz-significant" : ""}">${pValue < 0.05 ? "\xE2\u0153\u2026 Korelasyon anlaml\xC4\xB1" : "\xE2\x9D\u0152 Anlaml\xC4\xB1 de\xC4\u0178il"}</div>
    `;
  }
  function runNormalityTest(data, nameEl, pEl, bodyEl) {
    nameEl.textContent = "Normallik Testi (Skewness/Kurtosis)";
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);
    const skewness = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / n;
    const kurtosis = data.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0) / n - 3;
    const jb = n / 6 * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);
    let pValue = 0.05;
    if (typeof jStat !== "undefined") {
      pValue = 1 - jStat.chisquare.cdf(jb, 2);
    }
    pEl.textContent = `p = ${pValue.toFixed(4)}`;
    pEl.className = pValue > 0.05 ? "viz-p-value viz-normal" : "viz-p-value viz-significant";
    bodyEl.innerHTML = `
        <div>\xC3\u2021arp\xC4\xB1kl\xC4\xB1k (Skewness) = ${skewness.toFixed(3)}</div>
        <div>Bas\xC4\xB1kl\xC4\xB1k (Kurtosis) = ${kurtosis.toFixed(3)}</div>
        <div>Jarque-Bera = ${jb.toFixed(3)}</div>
        <div class="${pValue > 0.05 ? "viz-normal" : "viz-significant"}">${pValue > 0.05 ? "\xE2\u0153\u2026 Normal da\xC4\u0178\xC4\xB1l\xC4\xB1m" : "\xE2\u0161\xA0\xEF\xB8\x8F Normal de\xC4\u0178il"}</div>
    `;
  }

  // js/viz/stats/analysis.js
  var analysis_exports = {};
  __export(analysis_exports, {
    calculateStatistics: () => calculateStatistics,
    calculateStatsFallback: () => calculateStatsFallback,
    calculateTrendLine: () => calculateTrendLine
  });
  function calculateStatistics(values) {
    if (!values || values.length === 0) return null;
    if (typeof ss === "undefined") {
      console.warn("simple-statistics k\xC3\xBCt\xC3\xBCphanesi y\xC3\xBCklenemedi, fallback hesaplama kullan\xC4\xB1l\xC4\xB1yor");
      return calculateStatsFallback(values);
    }
    try {
      return {
        mean: ss.mean(values),
        median: ss.median(values),
        stdev: ss.standardDeviation(values),
        min: ss.min(values),
        max: ss.max(values),
        count: values.length,
        q1: ss.quantile(values, 0.25),
        q3: ss.quantile(values, 0.75),
        variance: ss.variance(values)
      };
    } catch (e) {
      console.error("\xC4\xB0statistik hesaplama hatas\xC4\xB1:", e);
      return calculateStatsFallback(values);
    }
  }
  function calculateStatsFallback(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const mid = Math.floor(n / 2);
    const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    return {
      mean,
      median,
      stdev: Math.sqrt(variance),
      min: sorted[0],
      max: sorted[n - 1],
      count: n,
      variance
    };
  }
  function calculateTrendLine(xData, yData) {
    if (!xData || !yData || xData.length < 2) return null;
    if (typeof ss !== "undefined") {
      try {
        const data = yData.map((y, i) => [i, y]);
        const regression2 = ss.linearRegression(data);
        const line = ss.linearRegressionLine(regression2);
        return {
          start: line(0),
          end: line(yData.length - 1),
          slope: regression2.m,
          intercept: regression2.b
        };
      } catch (e) {
        console.error("Trend \xC3\xA7izgisi hesaplama hatas\xC4\xB1:", e);
      }
    }
    const n = yData.length;
    const sumX = yData.reduce((acc, _, i) => acc + i, 0);
    const sumY = yData.reduce((acc, v) => acc + v, 0);
    const sumXY = yData.reduce((acc, v, i) => acc + i * v, 0);
    const sumX2 = yData.reduce((acc, _, i) => acc + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return {
      start: intercept,
      end: slope * (n - 1) + intercept,
      slope,
      intercept
    };
  }

  // js/viz/stats/anomalies.js
  var anomalies_exports = {};
  __export(anomalies_exports, {
    detectAnomalies: () => detectAnomalies,
    runAnomalyWithColumn: () => runAnomalyWithColumn,
    showAnomalyAxisModal: () => showAnomalyAxisModal
  });

  // js/viz/ui/modals.js
  var modals_exports = {};
  __export(modals_exports, {
    closeStatResultModal: () => closeStatResultModal,
    showStatResultModal: () => showStatResultModal,
    showWatermarkModal: () => showWatermarkModal
  });
  function showStatResultModal(title, contentHtml) {
    let modal = document.getElementById("vizStatResultModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "vizStatResultModal";
      modal.className = "viz-modal";
      modal.innerHTML = `
            <div class="viz-modal-content">
                <div class="viz-modal-header">
                    <h3 id="vizStatModalTitle">Sonu\xE7lar</h3>
                    <span class="viz-close-modal" onclick="closeStatResultModal()">&times;</span>
                </div>
                <div class="viz-modal-body" id="vizStatModalBody"></div>
            </div>`;
      document.body.appendChild(modal);
      window.onclick = function(event) {
        if (event.target === modal) {
          closeStatResultModal();
        }
      };
    }
    const titleEl = document.getElementById("vizStatModalTitle");
    const bodyEl = document.getElementById("vizStatModalBody");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = contentHtml;
    modal.style.display = "block";
  }
  function closeStatResultModal() {
    const modal = document.getElementById("vizStatResultModal");
    if (modal) {
      modal.style.display = "none";
    }
  }
  function showWatermarkModal() {
    console.warn("showWatermarkModal not fully modularized yet");
    if (window.showWatermarkModal && window.showWatermarkModal !== showWatermarkModal) {
      window.showWatermarkModal();
    } else {
      const html = `
            <div class="viz-modal-form">
                <label>Metin:</label>
                <input type="text" id="wmText" placeholder="\xD6rn: G\u0130ZL\u0130" style="width:100%; padding:8px; margin-bottom:10px;">
                <button class="viz-btn-primary" onclick="applyWatermark()">Uygula</button>
            </div>
        `;
      showStatResultModal("Filigran Ekle", html);
    }
  }
  window.showStatResultModal = showStatResultModal;
  window.closeStatResultModal = closeStatResultModal;

  // js/viz/stats/anomalies.js
  function showAnomalyAxisModal() {
    const dataset = VIZ_STATE.getActiveDataset();
    if (!dataset || !dataset.data || dataset.data.length === 0) {
      showToast2("\xD6nce veri y\xFCkleyin", "warning");
      return;
    }
    const columns = Object.keys(dataset.data[0]);
    const numericCols = columns.filter(
      (col) => dataset.data.some((row) => !isNaN(parseFloat(row[col])))
    );
    if (numericCols.length === 0) {
      showToast2("Say\u0131sal s\xFCtun bulunamad\u0131", "warning");
      return;
    }
    const optionsHtml = numericCols.map(
      (col) => `<option value="${col}">${col}</option>`
    ).join("");
    const html = `<div class="viz-modal-form">
        <label>Anomali Analizi Yap\u0131lacak S\xFCtun:</label>
        <select id="anomalyColumnSelect" style="width:100%; padding:8px; margin-bottom:15px;">
        ${optionsHtml}
        </select>
        <label>Z-Score E\u015Fik De\u011Feri:</label>
        <input type="range" id="anomalyThreshold" min="1.5" max="3" step="0.1" value="2" 
        oninput="document.getElementById('thresholdVal').textContent=this.value" style="width:100%;">
        <div style="text-align:center; margin:5px 0;"><span id="thresholdVal">2</span> sigma</div>
        <button class="viz-btn-primary" onclick="runAnomalyWithColumn(); closeStatResultModal();" style="width:100%; margin-top:10px;">
        <i class="fas fa-search"></i> Anomali Tespit Et</button>
        </div>`;
    if (window.showStatResultModal) window.showStatResultModal("Anomali Tespiti - Eksen Se\xE7imi", html);
  }
  function runAnomalyWithColumn() {
    const colSelect = document.getElementById("anomalyColumnSelect");
    const thresholdInput = document.getElementById("anomalyThreshold");
    if (!colSelect) {
      detectAnomalies();
      return;
    }
    const column = colSelect.value;
    const threshold = parseFloat(thresholdInput ? thresholdInput.value : 2);
    const dataset = VIZ_STATE.getActiveDataset();
    if (!dataset || !dataset.data) {
      showToast2("Veri bulunamad\u0131", "warning");
      return;
    }
    const yData = dataset.data.map((row) => parseFloat(row[column])).filter((v) => !isNaN(v));
    if (yData.length < 3) {
      showToast2("Yeterli veri yok", "warning");
      return;
    }
    const mean = yData.reduce((a, b) => a + b, 0) / yData.length;
    const std = Math.sqrt(yData.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / yData.length);
    const anomalies = [];
    yData.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / std);
      if (zScore > threshold) {
        anomalies.push({
          index,
          value,
          zScore: zScore.toFixed(2),
          type: value > mean ? "high" : "low"
        });
      }
    });
    const resultsDiv = document.getElementById("anomalyResults");
    const countEl = document.getElementById("anomalyCount");
    const listEl = document.getElementById("anomalyList");
    if (resultsDiv) {
      resultsDiv.style.display = "block";
      countEl.textContent = anomalies.length;
      const headerHtml = `<div style="font-size:0.75rem;color:var(--gm-text-muted);margin-bottom:5px;">S\xFCtun: <strong>${column}</strong></div>`;
      if (anomalies.length > 0) {
        listEl.innerHTML = headerHtml + anomalies.slice(0, 5).map(
          (a) => `<div class="viz-anomaly-item ${a.type}">
                    <span>#${a.index + 1}</span>
                    <span>${a.value}</span>
                    <span class="viz-zscore">Z=${a.zScore}</span>
                </div>`
        ).join("");
      } else {
        listEl.innerHTML = headerHtml + '<div class="viz-no-anomaly">Anomali bulunamad\u0131</div>';
      }
    }
    showToast2(`${anomalies.length} anomali tespit edildi (${column})`, anomalies.length > 0 ? "warning" : "success");
  }
  function detectAnomalies() {
    const dataset = VIZ_STATE.getActiveDataset();
    if (dataset && dataset.data && dataset.data.length > 0) {
      const columns = Object.keys(dataset.data[0]);
      const numericCols = columns.filter(
        (col) => dataset.data.some((row) => !isNaN(parseFloat(row[col])))
      );
      if (numericCols.length > 1) {
        showAnomalyAxisModal();
        return;
      }
    }
    console.log("Default detectAnomalies triggered");
  }
  window.showAnomalyAxisModal = showAnomalyAxisModal;
  window.runAnomalyWithColumn = runAnomalyWithColumn;
  window.detectAnomalies = detectAnomalies;

  // js/viz/stats/manager.js
  function updateStatsSummary(stats) {
    const summaryEl = document.getElementById("vizStatsSummary");
    if (!summaryEl || !stats) {
      if (summaryEl) summaryEl.style.display = "none";
      return;
    }
    summaryEl.style.display = "block";
    document.getElementById("statMean").textContent = formatNumber(stats.mean);
    document.getElementById("statMedian").textContent = formatNumber(stats.median);
    document.getElementById("statStdev").textContent = formatNumber(stats.stdev);
    document.getElementById("statMin").textContent = formatNumber(stats.min);
    document.getElementById("statMax").textContent = formatNumber(stats.max);
    document.getElementById("statCount").textContent = stats.count;
  }
  function getStatisticalOverlays(values, stats) {
    const overlays = {
      markLines: [],
      markAreas: []
    };
    if (!stats) return overlays;
    const showMean = document.getElementById("showMeanLine")?.checked;
    const showMedian = document.getElementById("showMedianLine")?.checked;
    const showStdBand = document.getElementById("showStdBand")?.checked;
    const showTrend = document.getElementById("showTrendLine")?.checked;
    if (showMean) {
      overlays.markLines.push({
        yAxis: stats.mean,
        name: VIZ_TEXTS[VIZ_STATE.lang].stat_mean,
        lineStyle: { color: "#00d97e", type: "solid", width: 2 },
        label: { formatter: `\xCE\xBC = ${formatNumber(stats.mean)}`, position: "end" }
      });
    }
    if (showMedian) {
      overlays.markLines.push({
        yAxis: stats.median,
        name: VIZ_TEXTS[VIZ_STATE.lang].stat_median,
        lineStyle: { color: "#ffc107", type: "dashed", width: 2 },
        label: { formatter: `Med = ${formatNumber(stats.median)}`, position: "end" }
      });
    }
    if (showStdBand) {
      const upper = stats.mean + stats.stdev;
      const lower = stats.mean - stats.stdev;
      overlays.markAreas.push([{
        yAxis: upper,
        name: "+1\xCF\u0192",
        itemStyle: { color: "rgba(74, 144, 217, 0.15)" }
      }, {
        yAxis: lower
      }]);
      overlays.markLines.push(
        { yAxis: upper, lineStyle: { color: "#4a90d9", type: "dotted", width: 1 }, label: { show: false } },
        { yAxis: lower, lineStyle: { color: "#4a90d9", type: "dotted", width: 1 }, label: { show: false } }
      );
    }
    return overlays;
  }
  function applyStatisticalOverlays2(chartInstance, config, yData) {
    if (!chartInstance || !yData || yData.length === 0) return;
    const stats = calculateStatistics(yData);
    updateStatsSummary(stats);
    const overlays = getStatisticalOverlays(yData, stats);
    const showTrend = document.getElementById("showTrendLine")?.checked;
    const currentOption = chartInstance.getOption();
    if (!currentOption.series || !currentOption.series[0]) return;
    const supportedTypes = ["bar", "line"];
    const seriesType = currentOption.series[0].type;
    if (!supportedTypes.includes(seriesType)) {
      console.log("Bu grafik tipi overlay desteklemiyor:", seriesType);
      return;
    }
    const newSeries = [{
      ...currentOption.series[0],
      markLine: overlays.markLines.length > 0 ? {
        silent: true,
        symbol: "none",
        data: overlays.markLines
      } : void 0,
      markArea: overlays.markAreas.length > 0 ? {
        silent: true,
        data: overlays.markAreas
      } : void 0
    }];
    if (showTrend && seriesType !== "pie") {
      const xData = currentOption.xAxis?.[0]?.data || [];
      const trend = calculateTrendLine(xData, yData);
      if (trend) {
        newSeries.push({
          type: "line",
          data: yData.map((_, i) => trend.slope * i + trend.intercept),
          smooth: false,
          lineStyle: { color: "#e74c3c", type: "dashed", width: 2 },
          itemStyle: { color: "#e74c3c" },
          symbol: "none",
          name: "Trend"
        });
      }
    }
    chartInstance.setOption({ series: newSeries }, false);
  }
  function setupOverlayListeners() {
    const checkboxes = ["showMeanLine", "showMedianLine", "showStdBand", "showTrendLine"];
    checkboxes.forEach((id) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener("change", () => {
          if (VIZ_STATE.selectedChart) {
            const config = VIZ_STATE.charts.find((c) => c.id === VIZ_STATE.selectedChart);
            if (config) {
              config.overlays = {
                showMean: document.getElementById("showMeanLine")?.checked,
                showMedian: document.getElementById("showMedianLine")?.checked,
                showStdBand: document.getElementById("showStdBand")?.checked,
                showTrend: document.getElementById("showTrendLine")?.checked
              };
              renderChart(config);
            }
          }
        });
      }
    });
  }
  function setupSPSSListeners() {
    const regressionSelect = document.getElementById("regressionType");
    if (regressionSelect) {
      regressionSelect.addEventListener("change", () => {
        if (VIZ_STATE.selectedChart) {
          const config = VIZ_STATE.charts.find((c) => c.id === VIZ_STATE.selectedChart);
          if (config) {
            config.regressionType = regressionSelect.value;
            renderChart(config);
            updateRegressionResults(config);
          }
        }
      });
    }
  }
  function setupBIListeners() {
    const whatIfSlider = document.getElementById("whatIfSlider");
    const whatIfValue = document.getElementById("whatIfValue");
    if (whatIfSlider) {
      whatIfSlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        whatIfValue.textContent = `${value >= 0 ? "+" : ""}${value}%`;
        whatIfValue.className = "viz-whatif-percent " + (value > 0 ? "viz-positive" : value < 0 ? "viz-negative" : "");
        if (VIZ_STATE.selectedChart) {
          applyWhatIfChange(value);
        }
      });
    }
    const crossFilterCheckbox = document.getElementById("crossFilterEnabled");
    if (crossFilterCheckbox) {
      crossFilterCheckbox.addEventListener("change", (e) => {
        VIZ_STATE.crossFilterEnabled = e.target.checked;
        showToast2(e.target.checked ? "Cross-filter aktif" : "Cross-filter kapal\xC4\xB1", "info");
      });
    }
  }
  function applyWhatIfChange(percentage) {
    const config = VIZ_STATE.charts.find((c) => c.id === VIZ_STATE.selectedChart);
    if (!config) return;
    const chart = VIZ_STATE.echartsInstances[config.id];
    if (!chart) return;
    const currentOption = chart.getOption();
    if (!currentOption.series || !currentOption.series[0]) return;
    if (!config.originalData) {
      config.originalData = [...currentOption.series[0].data];
    }
    const multiplier = 1 + percentage / 100;
    const newData = config.originalData.map((v) => {
      if (typeof v === "number") return Math.round(v * multiplier);
      if (typeof v === "object" && v.value !== void 0) {
        return { ...v, value: Math.round(v.value * multiplier) };
      }
      return v;
    });
    chart.setOption({
      series: [{ data: newData }]
    }, false);
  }
  function updateTrendInsight(data) {
    if (!data || data.length < 3) return;
    const trendDiv = document.getElementById("trendInsight");
    const trendText = document.getElementById("trendText");
    if (!trendDiv || !trendText) return;
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const changePercent = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
    let trendType, trendIcon, trendClass;
    if (changePercent > 10) {
      trendType = "G\xC3\xBC\xC3\xA7l\xC3\xBC art\xC4\xB1\xC5\u0178 trendi";
      trendIcon = "\u011F\u0178\u201C\u02C6";
      trendClass = "viz-trend-up";
    } else if (changePercent > 0) {
      trendType = "Hafif art\xC4\xB1\xC5\u0178 trendi";
      trendIcon = "\xE2\u2020\u2014\xEF\xB8\x8F";
      trendClass = "viz-trend-up";
    } else if (changePercent < -10) {
      trendType = "G\xC3\xBC\xC3\xA7l\xC3\xBC d\xC3\xBC\xC5\u0178\xC3\xBC\xC5\u0178 trendi";
      trendIcon = "\u011F\u0178\u201C\u2030";
      trendClass = "viz-trend-down";
    } else if (changePercent < 0) {
      trendType = "Hafif d\xC3\xBC\xC5\u0178\xC3\xBC\xC5\u0178 trendi";
      trendIcon = "\xE2\u2020\u02DC\xEF\xB8\x8F";
      trendClass = "viz-trend-down";
    } else {
      trendType = "Stabil";
      trendIcon = "\xE2\x9E\xA1\xEF\xB8\x8F";
      trendClass = "viz-trend-stable";
    }
    trendDiv.style.display = "flex";
    trendDiv.className = `viz-trend-insight ${trendClass}`;
    trendText.textContent = `${trendIcon} ${trendType} (${changePercent > 0 ? "+" : ""}${changePercent}%)`;
  }
  function applyCrossFilter(sourceChartId, selectedCategory) {
    if (!VIZ_STATE.crossFilterEnabled) return;
    VIZ_STATE.charts.forEach((config) => {
      if (config.id !== sourceChartId) {
        const chart = VIZ_STATE.echartsInstances[config.id];
        if (chart && config.xAxis === VIZ_STATE.charts.find((c) => c.id === sourceChartId)?.xAxis) {
          chart.dispatchAction({
            type: "highlight",
            seriesIndex: 0,
            name: selectedCategory
          });
        }
      }
    });
  }

  // js/viz/ui/manager.js
  var manager_exports4 = {};
  __export(manager_exports4, {
    initVizStudio: () => initVizStudio,
    loadSavedTheme: () => loadSavedTheme,
    setupDragAndDrop: () => setupDragAndDrop,
    setupEventListeners: () => setupEventListeners,
    toggleTheme: () => toggleTheme,
    updateAllChartsTheme: () => updateAllChartsTheme
  });

  // js/viz/ui/export.js
  var export_exports = {};
  __export(export_exports, {
    exportAllChartsPNG: () => exportAllChartsPNG,
    exportCSV: () => exportCSV,
    exportExcel: () => exportExcel,
    exportPDF: () => exportPDF,
    exportPNG: () => exportPNG,
    exportSVG: () => exportSVG,
    getEmbedCode: () => getEmbedCode,
    showExportModal: () => showExportModal
  });
  function showExportModal() {
    const html = '<div class="viz-modal-form"><h4><i class="fas fa-image"></i> Grafik Export</h4><div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;"><button class="viz-btn-primary" onclick="exportPNG(); closeStatResultModal();"><i class="fas fa-image"></i> PNG</button><button class="viz-btn-primary" onclick="exportSVG(); closeStatResultModal();"><i class="fas fa-vector-square"></i> SVG</button><button class="viz-btn-primary" onclick="exportAllChartsPNG(); closeStatResultModal();"><i class="fas fa-images"></i> Tum PNG</button><button class="viz-btn-primary" onclick="exportPDF(); closeStatResultModal();"><i class="fas fa-file-pdf"></i> PDF</button></div><hr style="margin: 15px 0; border-color: var(--gm-divider);"><h4><i class="fas fa-table"></i> Veri Export</h4><div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;"><button class="viz-btn-secondary" onclick="exportExcel(); closeStatResultModal();"><i class="fas fa-file-excel"></i> Excel</button><button class="viz-btn-secondary" onclick="exportCSV(); closeStatResultModal();"><i class="fas fa-file-csv"></i> CSV</button></div><hr style="margin: 15px 0; border-color: var(--gm-divider);"><h4><i class="fas fa-share-alt"></i> Paylasim</h4><div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;"><button class="viz-btn-secondary" onclick="generateShareLink(); closeStatResultModal();"><i class="fas fa-link"></i> Link</button><button class="viz-btn-secondary" onclick="getEmbedCode(); closeStatResultModal();"><i class="fas fa-code"></i> Embed</button></div></div>';
    if (window.showStatResultModal) window.showStatResultModal("Indir / Paylas", html);
  }
  function exportPNG() {
    if (!VIZ_STATE.selectedChart) {
      showToast2("Once bir grafik secin", "warning");
      return;
    }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    var url = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    downloadFile(url, "chart_" + VIZ_STATE.selectedChart + ".png");
    showToast2("PNG export edildi", "success");
  }
  function exportAllChartsPNG() {
    VIZ_STATE.charts.forEach((c) => {
      var chart = VIZ_STATE.echartsInstances[c.id];
      if (chart) {
        var url = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
        downloadFile(url, c.title.replace(/\s+/g, "_") + ".png");
      }
    });
    showToast2("Tum grafikler indirildi", "success");
  }
  function exportSVG() {
    if (!VIZ_STATE.selectedChart) {
      showToast2("Once bir grafik secin", "warning");
      return;
    }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    var url = chart.getDataURL({ type: "svg", pixelRatio: 2 });
    downloadFile(url, "chart_" + VIZ_STATE.selectedChart + ".svg");
    showToast2("SVG export edildi", "success");
  }
  function exportPDF() {
    if (!VIZ_STATE.selectedChart) {
      showToast2("Once bir grafik secin", "warning");
      return;
    }
    var chart = VIZ_STATE.echartsInstances[VIZ_STATE.selectedChart];
    if (!chart) return;
    if (typeof window.jspdf === "undefined") {
      showToast2("PDF icin jsPDF yukleniyor...", "info");
      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = function() {
        var pdf2 = new window.jspdf.jsPDF("landscape", "mm", "a4");
        var imgData2 = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
        pdf2.addImage(imgData2, "PNG", 10, 10, 277, 190);
        pdf2.save("chart_" + VIZ_STATE.selectedChart + ".pdf");
        showToast2("PDF export edildi", "success");
      };
      document.head.appendChild(script);
      return;
    }
    var pdf = new window.jspdf.jsPDF("landscape", "mm", "a4");
    var imgData = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    pdf.addImage(imgData, "PNG", 10, 10, 277, 190);
    pdf.save("chart_" + VIZ_STATE.selectedChart + ".pdf");
    showToast2("PDF export edildi", "success");
  }
  function exportExcel() {
    var dataset = VIZ_STATE.getActiveDataset();
    if (!dataset || !dataset.data) {
      showToast2("Export edilecek veri yok", "warning");
      return;
    }
    if (typeof XLSX === "undefined") {
      showToast2("XLSX yukleniyor...", "info");
      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = function() {
        var ws2 = XLSX.utils.json_to_sheet(dataset.data);
        var wb2 = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb2, ws2, "Data");
        XLSX.writeFile(wb2, "data_" + Date.now() + ".xlsx");
        showToast2("Excel export edildi", "success");
      };
      document.head.appendChild(script);
      return;
    }
    var ws = XLSX.utils.json_to_sheet(dataset.data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "data_" + Date.now() + ".xlsx");
    showToast2("Excel export edildi", "success");
  }
  function exportCSV() {
    var dataset = VIZ_STATE.getActiveDataset();
    if (!dataset || !dataset.data || dataset.data.length === 0) {
      showToast2("Export edilecek veri yok", "warning");
      return;
    }
    var headers = Object.keys(dataset.data[0]);
    var csvContent = headers.join(",") + "\n";
    dataset.data.forEach(function(row) {
      csvContent += headers.map(function(h) {
        return typeof row[h] === "string" && row[h].indexOf(",") >= 0 ? '"' + row[h] + '"' : row[h];
      }).join(",") + "\n";
    });
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    downloadFile(url, "data_" + Date.now() + ".csv");
    URL.revokeObjectURL(url);
    showToast2("CSV export edildi", "success");
  }
  function getEmbedCode() {
    var embedCode = '<iframe src="' + window.location.href + '" width="800" height="600" frameborder="0"></iframe>';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(embedCode).then(function() {
        showToast2("Embed kodu panoya kopyalandi", "success");
      });
    } else {
      prompt("Kopyalayin:", embedCode);
    }
  }
  window.showExportModal = showExportModal;
  window.exportSVG = exportSVG;
  window.exportPDF = exportPDF;
  window.exportExcel = exportExcel;
  window.exportCSV = exportCSV;
  window.exportAllChartsPNG = exportAllChartsPNG;
  window.exportPNG = exportPNG;
  window.getEmbedCode = getEmbedCode;

  // js/viz/ui/manager.js
  function initVizStudio() {
    console.log("\xC4\u0178\xC5\xB8\xC2\x8E\xC2\xA8 Visual Studio ba\xC3\u2026\xC5\xB8lat\xC3\u201E\xC2\xB1ld\xC3\u201E\xC2\xB1 (Production v1.0)");
    updateEmptyState();
  }
  function loadSavedTheme() {
    const saved = localStorage.getItem("opradox_theme");
    if (saved === "day") {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("day-mode");
    }
    updateAllChartsTheme();
  }
  function toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    if (isDark) {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("day-mode");
      localStorage.setItem("opradox_theme", "day");
    } else {
      document.body.classList.remove("day-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("opradox_theme", "dark");
    }
    const logo = document.getElementById("vizLogo");
    if (logo) {
      logo.src = isDark ? "img/opradox_logo_light.png?v=5" : "img/opradox_logo_dark.png?v=5";
    }
    showToast2(getText("theme_changed", "Tema de\xC3\u201E\xC5\xB8i\xC3\u2026\xC5\xB8tirildi"), "success");
    updateAllChartsTheme();
  }
  function updateAllChartsTheme() {
    const theme = document.body.classList.contains("day-mode") ? "light" : "dark";
    VIZ_STATE.charts.forEach((config) => {
      const chartDom = document.getElementById(`${config.id}_chart`);
      if (chartDom) {
        const oldInstance = VIZ_STATE.echartsInstances[config.id];
        if (oldInstance) {
          oldInstance.dispose();
        }
        renderChart2(config);
      }
    });
  }
  function setupEventListeners() {
    document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
    document.getElementById("langToggle")?.addEventListener("click", () => {
      toggleLang();
      loadSavedLang();
    });
    document.getElementById("addChartBtn")?.addEventListener("click", () => addChart("bar"));
    document.getElementById("clearCanvasBtn")?.addEventListener("click", clearDashboard);
    document.getElementById("closeSettingsBtn")?.addEventListener("click", hideSettings);
    document.getElementById("applySettingsBtn")?.addEventListener("click", applyChartSettings);
    document.getElementById("deleteChartBtn")?.addEventListener("click", deleteSelectedChart);
    document.getElementById("chartColor")?.addEventListener("input", (e) => {
      const preview = document.querySelector(".viz-color-preview");
      if (preview) preview.style.background = e.target.value;
    });
    document.getElementById("saveBtn")?.addEventListener("click", showSaveMenu);
    document.getElementById("exportBtn")?.addEventListener("click", showExportModal);
    ["showMeanLine", "showMedianLine", "showStdBand", "showTrendLine"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => {
        if (VIZ_STATE.selectedChart) {
          const config = VIZ_STATE.charts.find((c) => c.id === VIZ_STATE.selectedChart);
          if (config) {
            console.log(`\xC4\u0178\xC5\xB8\xE2\u20AC\u0153\xC5\xA0 Stats overlay g\xC3\u0192\xC2\xBCncellendi: ${id}`);
            renderChart2(config);
          }
        }
      });
    });
  }
  function setupDragAndDrop() {
    document.querySelectorAll(".viz-chart-type").forEach((el) => {
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("chartType", el.dataset.type);
      });
    });
    const dashboard = document.getElementById("vizDashboardGrid");
    if (dashboard) {
      dashboard.addEventListener("dragover", (e) => {
        e.preventDefault();
        dashboard.classList.add("drag-over");
      });
      dashboard.addEventListener("dragleave", () => {
        dashboard.classList.remove("drag-over");
      });
      dashboard.addEventListener("drop", (e) => {
        e.preventDefault();
        dashboard.classList.remove("drag-over");
        const chartType = e.dataTransfer.getData("chartType");
        if (chartType) {
          addChart(chartType);
        }
      });
    }
  }

  // js/viz/ui/sidebar.js
  var sidebar_exports = {};
  __export(sidebar_exports, {
    detectColumnType: () => detectColumnType,
    getTypeInfo: () => getTypeInfo,
    renderColumnsList: () => renderColumnsList,
    updateDataProfile: () => updateDataProfile,
    updateDropdowns: () => updateDropdowns
  });
  function updateDataProfile() {
    const profile = document.getElementById("vizDataProfileFull");
    if (!profile) return;
    if (!VIZ_STATE.data || !VIZ_STATE.columns.length) {
      profile.style.display = "none";
      return;
    }
    profile.style.display = "block";
    const rowEl = document.getElementById("vizRowCountFull");
    const colEl = document.getElementById("vizColCountFull");
    const qualEl = document.getElementById("vizQualityFull");
    if (rowEl) rowEl.textContent = VIZ_STATE.data.length.toLocaleString("tr-TR");
    if (colEl) colEl.textContent = VIZ_STATE.columns.length;
    let emptyCount = 0;
    const missingByColumn = {};
    const totalCells = VIZ_STATE.data.length * VIZ_STATE.columns.length;
    VIZ_STATE.columns.forEach((col) => missingByColumn[col] = 0);
    VIZ_STATE.data.forEach((row) => {
      VIZ_STATE.columns.forEach((col) => {
        if (row[col] === null || row[col] === "" || row[col] === void 0) {
          emptyCount++;
          missingByColumn[col]++;
        }
      });
    });
    const qualityPercent = totalCells > 0 ? Math.round((1 - emptyCount / totalCells) * 100) : 0;
    if (qualEl) {
      qualEl.textContent = `${qualityPercent}%`;
      qualEl.className = "viz-profile-value-left " + (qualityPercent >= 95 ? "viz-quality-good" : "viz-quality-warning");
    }
    const colTypesEl = document.getElementById("columnTypesLeft");
    if (colTypesEl && VIZ_STATE.columnsInfo) {
      const colors = { numeric: "#4a90d9", date: "#9a3050", text: "#6b7280" };
      const icons = { numeric: "fa-hashtag", date: "fa-calendar", text: "fa-font" };
      colTypesEl.innerHTML = VIZ_STATE.columnsInfo.map((info) => `
            <div class="viz-column-type-item-left" style="border-left-color: ${colors[info.type] || colors.text}">
                <i class="fas ${icons[info.type] || icons.text}"></i>
                <span>${info.name}</span>
            </div>
        `).join("");
    }
    const missingEl = document.getElementById("missingValuesListLeft");
    if (missingEl) {
      const missingCols = Object.entries(missingByColumn).filter(([_, count]) => count > 0);
      if (missingCols.length === 0) {
        missingEl.innerHTML = `<span class="viz-quality-good">${VIZ_TEXTS2[VIZ_STATE.lang].no_missing || "Eksik de\u011Fer yok \u2713"}</span>`;
      } else {
        missingEl.innerHTML = missingCols.map(([col, count]) => `
                <div class="viz-missing-item-left">
                    <span>${col}</span>
                    <span class="count">${count}</span>
                </div>
            `).join("");
      }
    }
    console.log(`\u{1F4CA} Tam Veri Profili: ${VIZ_STATE.data.length} sat\u0131r, ${VIZ_STATE.columns.length} s\xFCtun, %${qualityPercent} kalite`);
  }
  function renderColumnsList() {
    const dataset = VIZ_STATE.getActiveDataset();
    const listEl = document.getElementById("vizColumnsList");
    if (!listEl || !dataset || !dataset.data || dataset.data.length === 0) {
      if (listEl) {
        listEl.innerHTML = `
            <div class="viz-no-data" data-i18n="no_data_loaded">
                <i class="fas fa-info-circle"></i>
                ${VIZ_TEXTS2[VIZ_STATE.lang].no_data_loaded}
            </div>`;
      }
      return;
    }
    const columns = Object.keys(dataset.data[0]);
    listEl.innerHTML = columns.map(function(col) {
      const sampleValues = dataset.data.slice(0, 10).map((r) => r[col]);
      const type = detectColumnType(sampleValues);
      const typeInfo = getTypeInfo(type);
      return `<div class="viz-column-chip" draggable="true" data-column="${col}" data-type="${type}" 
            style="border-left: 3px solid ${typeInfo.color};">
            <i class="${typeInfo.icon}" style="color:${typeInfo.color};"></i>
            <span class="viz-col-name-chip">${col}</span>
            <span class="viz-col-type-chip" style="font-size:0.65rem;color:var(--gm-text-muted);margin-left:auto;">${typeInfo.label}</span>
            </div>`;
    }).join("");
    listEl.querySelectorAll(".viz-column-chip").forEach((chip) => {
      chip.addEventListener("dragstart", function(e) {
        e.dataTransfer.setData("text/plain", chip.dataset.column);
        e.dataTransfer.setData("column", chip.dataset.column);
        chip.classList.add("dragging");
      });
      chip.addEventListener("dragend", function() {
        chip.classList.remove("dragging");
      });
    });
  }
  function detectColumnType(values) {
    let numericCount = 0;
    let dateCount = 0;
    let textCount = 0;
    values.forEach((v) => {
      if (v === null || v === void 0 || v === "") return;
      if (!isNaN(parseFloat(v)) && isFinite(v)) {
        numericCount++;
      } else if (!isNaN(Date.parse(v))) {
        dateCount++;
      } else {
        textCount++;
      }
    });
    const total = numericCount + dateCount + textCount;
    if (total === 0) return "empty";
    if (numericCount / total > 0.7) return "numeric";
    if (dateCount / total > 0.7) return "date";
    return "text";
  }
  function getTypeInfo(type) {
    const types = {
      "numeric": { icon: "fas fa-hashtag", color: "#3b82f6", label: "Say\u0131" },
      "date": { icon: "fas fa-calendar", color: "#8b5cf6", label: "Tarih" },
      "text": { icon: "fas fa-font", color: "#10b981", label: "Metin" },
      "empty": { icon: "fas fa-minus", color: "#6b7280", label: "Bo\u015F" }
    };
    return types[type] || types["text"];
  }
  function updateDropdowns() {
    const xSelect = document.getElementById("chartXAxis");
    const ySelect = document.getElementById("chartYAxis");
    if (!VIZ_STATE.columns) return;
    const optionsHtml = '<option value="">Se\xE7in...</option>' + VIZ_STATE.columns.map((col) => `<option value="${col}">${col}</option>`).join("");
    if (xSelect) xSelect.innerHTML = optionsHtml;
    if (ySelect) ySelect.innerHTML = optionsHtml;
  }
  window.renderColumnsList = renderColumnsList;
  window.updateDataProfile = updateDataProfile;
  window.updateDropdowns = updateDropdowns;
  window.detectColumnType = detectColumnType;
  window.getTypeInfo = getTypeInfo;

  // js/viz/index.js
  window.VIZ_STATE = VIZ_STATE;
  Object.assign(window, utils_exports);
  Object.assign(window, i18n_exports);
  Object.assign(window, manager_exports);
  Object.assign(window, loader_exports);
  Object.assign(window, manager_exports2);
  Object.assign(window, engine_exports);
  Object.assign(window, manager_exports3);
  Object.assign(window, tests_exports);
  Object.assign(window, analysis_exports);
  Object.assign(window, anomalies_exports);
  Object.assign(window, manager_exports4);
  Object.assign(window, modals_exports);
  Object.assign(window, sidebar_exports);
  Object.assign(window, export_exports);
  function initApp() {
    console.log("\u{1F680} Viz Studio Bundle Initializing...");
    try {
      initVizStudio();
      loadSavedTheme();
      loadSavedLang();
      setupEventListeners();
      if (setupDragAndDrop) setupDragAndDrop();
      if (loadDashboardFromStorage) {
        loadDashboardFromStorage();
      }
      console.log("\u{1F4C2} Calling setupVizFileHandlers...");
      setupVizFileHandlers();
      if (window.loadFilesFromHub) {
        setTimeout(window.loadFilesFromHub, 500);
      }
      if (setupBIListeners) setupBIListeners();
      if (setupOverlayListeners) setupOverlayListeners();
      if (setupSPSSListeners) setupSPSSListeners();
      console.log("\u2705 Bundle Loaded. VIZ_STATE:", VIZ_STATE);
    } catch (err) {
      console.error("\u274C Init Error:", err);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
  return __toCommonJS(index_exports);
})();
