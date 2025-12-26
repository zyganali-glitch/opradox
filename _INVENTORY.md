# VIZ.JS FINAL INVENTORY (FULL RECOVERY - 16K LINES)

## 1. MODULE: js/modules/core.js
- `VIZ_STATE` (Tüm Global State)
- `VIZ_TEXTS` (Dil Dosyası)
- `initVizStudio` (Ana Başlatıcı)
- `setupEventListeners`
- `setupDragAndDrop` (Genel)
- `setupKeyboardShortcuts`
- `registerServiceWorker`
- `toggleTheme`, `loadSavedTheme`
- `toggleLang`, `getText`
- **SONDAKİ CSS:** `viz.js`'in en sonundaki `const style = ...` bloğunu buraya al ve `document.head.appendChild(style)` yapan kodu ekle.

## 2. MODULE: js/modules/data.js
- `handleFileSelect`, `loadFile`
- `loadDataWithOptions`, `reloadWithOptions`
- `exportDataAsCSV`, `exportDataAsJSON`
- `transform` fonksiyonları (`showTransformUI`, `applyTransform`)
- `filter` fonksiyonları (`showFilterPanel`, `addFilter`, `applyFilters`)
- `sort` fonksiyonları (`showSortPanel`, `applySort`)
- `clean` fonksiyonları (`fillMissingData`, `removeOutliers`)
- `join` fonksiyonları (`executeJoin`)
- `google` & `sql` entegrasyonları

## 3. MODULE: js/modules/preview.js (YENİ - O Eksik 3000 Satırın Bir Kısmı)
- `showFilePreviewModal`, `closeFilePreviewModal`
- `renderPreviewTable`, `updatePreviewSheet`
- `confirmFileLoad`
- `showHeaderPreview` (Scrollable Table)
- `window.VIZ_SELECTED_HEADER_ROW`
- `loadFileWithPreview`, `initFilePreviewIntegration`

## 4. MODULE: js/modules/charts.js
- `addChart`, `createChartWidget`
- `renderChart` (Devasa Switch-Case)
- `updateDropdowns`, `renderColumnsList`
- `showWidgetMenu`, `editWidget`, `toggleWidgetFullscreen`
- `resizeWidget`, `setWidgetGrid`
- `exportChartAsPNG`, `exportChartAsPDF`
- `setupSprint12Listeners` (Font, Opacity, Gradient ayarları)
- `showWatermarkModal`, `applyWatermark` (Arka plan)

## 5. MODULE: js/modules/stats.js (O 23 Widget Burada)
- **Sistem:** `initStatDragDropSystem`, `createStatWidget`
- **Analiz:** `runStatWidgetAnalysis`, `runStatForWidget`
- **Render:** `renderStatResults`, `formatStatResultForWidget`
- **Helper:** `getStatTitle`, `getAnalysisRequirements`, `makeOptions`
- **Audit:** `generateAuditNote`, `addAuditFooterToWidget`, `toggleStatMode`
- **Embed:** `embedStatToChart`, `embedStatAsAnnotation`
- **Formül:** `toggleFormula`, `getFormulaForTest`
- **API:** `callSpssApi`, `runBackendStatTest`

## 6. MODULE: js/modules/advanced.js
- `initWhatIfSimulator`, `applyWhatIfChange`
- `initCrossFilter`, `applyCrossFilter`
- `detectAnomalies`, `analyzeTrend`
- `getSmartInsights`, `showSmartInsightsModal`
- `generateReport`, `showReportCustomizationModal` (PDF Rapor)
- `renderWordCloudAdvanced`, `showWordCloudModal`
- `renderChoroplethMap`, `applyGeoJsonMap`