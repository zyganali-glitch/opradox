/**
 * Macro Pipeline - Opradox Macro Studio Pro
 * FAZ-2: Bloklar & Pipeline (BUILD MODE)
 * 
 * ALLOWLIST: visualBuilder.js pattern, IndexedDB cache
 * YASAKLAR: Kod editörü, Serbest script
 */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================

    const CACHE_DB_NAME = 'macro_step_cache';
    const CACHE_DB_VERSION = 1;
    const CACHE_STORE_NAME = 'steps';
    const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 dakika

    // ============================================================
    // BLOCK TYPES - Full Report Studio PRO Parity
    // Imported from visualBuilder.js for complete operator support
    // ============================================================

    const MACRO_BLOCK_TYPES = {
        // ===== VERİ KAYNAĞI BLOKLARI =====
        data_source: {
            name: { tr: "Veri Kaynağı", en: "Data Source" },
            icon: "fa-database",
            color: "#3b82f6",
            description: { tr: "Dosya ve sayfa seçimi", en: "File and sheet selection" },
            category: "source"
        },

        // ===== FİLTRE VE DÖNÜŞÜM BLOKLARI =====
        filter: {
            name: { tr: "Filtre", en: "Filter" },
            icon: "fa-filter",
            color: "#ec4899",
            description: { tr: "Verileri koşula göre filtrele", en: "Filter data by condition" },
            category: "transform",
            operators: [
                { value: "equals", label: { tr: "Eşittir (=)", en: "Equals (=)" } },
                { value: "not_equals", label: { tr: "Eşit Değil (≠)", en: "Not Equals (≠)" } },
                { value: "greater", label: { tr: "Büyüktür (>)", en: "Greater (>)" } },
                { value: "less", label: { tr: "Küçüktür (<)", en: "Less (<)" } },
                { value: "gte", label: { tr: "Büyük Eşit (≥)", en: "Greater or Equal (≥)" } },
                { value: "lte", label: { tr: "Küçük Eşit (≤)", en: "Less or Equal (≤)" } },
                { value: "contains", label: { tr: "İçerir", en: "Contains" } },
                { value: "not_contains", label: { tr: "İçermez", en: "Not Contains" } },
                { value: "starts_with", label: { tr: "İle Başlar", en: "Starts With" } },
                { value: "ends_with", label: { tr: "İle Biter", en: "Ends With" } },
                { value: "in_list", label: { tr: "Listede Var", en: "In List" } },
                { value: "not_in_list", label: { tr: "Listede Yok", en: "Not In List" } },
                { value: "is_null", label: { tr: "Boş", en: "Is Empty" } },
                { value: "is_not_null", label: { tr: "Dolu", en: "Not Empty" } }
            ]
        },

        // ===== HESAPLAMA BLOKLARI =====
        computed: {
            name: { tr: "Hesaplama", en: "Calculation" },
            icon: "fa-calculator",
            color: "#10b981",
            description: { tr: "Yeni sütun hesapla", en: "Calculate new column" },
            category: "transform",
            operations: [
                { value: "add", label: { tr: "Topla (+)", en: "Add (+)" } },
                { value: "subtract", label: { tr: "Çıkar (-)", en: "Subtract (-)" } },
                { value: "multiply", label: { tr: "Çarp (×)", en: "Multiply (×)" } },
                { value: "divide", label: { tr: "Böl (÷)", en: "Divide (÷)" } },
                { value: "percent", label: { tr: "Yüzde (%)", en: "Percent (%)" } },
                { value: "multiply_var", label: { tr: "Değişkenle Çarp (What-If)", en: "Multiply by Variable (What-If)" } },
                { value: "divide_multiply", label: { tr: "Böl ve Çarp (÷×)", en: "Divide & Multiply" } },
                { value: "concat", label: { tr: "Metin Birleştir", en: "Concatenate" } },
                { value: "date_diff", label: { tr: "Tarih Farkı (Gün)", en: "Date Diff (Days)" } },
                { value: "running_total", label: { tr: "Kümülatif Toplam", en: "Running Total" } },
                { value: "moving_avg", label: { tr: "Hareketli Ortalama", en: "Moving Average" } },
                { value: "growth_rate", label: { tr: "Büyüme Oranı (%)", en: "Growth Rate (%)" } }
            ]
        },

        // ===== FORMÜL =====
        formula: {
            name: { tr: "Formül", en: "Formula" },
            icon: "fa-superscript",
            color: "#0891b2",
            description: { tr: "Serbest formül yazın (ör: A/B*100)", en: "Write free formula" },
            category: "transform"
        },

        // ===== IF-ELSE (Koşullu Değer) =====
        if_else: {
            name: { tr: "Koşullu Değer (IF)", en: "If-Else" },
            icon: "fa-code-branch",
            color: "#f43f5e",
            description: { tr: "Koşula göre değer ata", en: "Assign value by condition" },
            category: "transform",
            conditionTypes: [
                { value: ">", label: { tr: "Büyüktür (>)", en: "Greater (>)" } },
                { value: "<", label: { tr: "Küçüktür (<)", en: "Less (<)" } },
                { value: ">=", label: { tr: "Büyük Eşit (>=)", en: "Greater or Equal (>=)" } },
                { value: "<=", label: { tr: "Küçük Eşit (<=)", en: "Less or Equal (<=)" } },
                { value: "==", label: { tr: "Eşittir (=)", en: "Equals (=)" } },
                { value: "!=", label: { tr: "Eşit Değil (!=)", en: "Not Equals (!=)" } },
                { value: "contains", label: { tr: "İçerir", en: "Contains" } },
                { value: "is_null", label: { tr: "Boş ise", en: "Is Empty" } }
            ]
        },

        // ===== METİN DÖNÜŞTÜRME =====
        text_transform: {
            name: { tr: "Metin Dönüştür", en: "Text Transform" },
            icon: "fa-font",
            color: "#84cc16",
            description: { tr: "Metin işlemleri (trim, upper, parantez çıkar)", en: "Text operations" },
            category: "transform",
            transformTypes: [
                { value: "to_upper", label: { tr: "BÜYÜK HARF", en: "UPPERCASE" } },
                { value: "to_lower", label: { tr: "küçük harf", en: "lowercase" } },
                { value: "trim", label: { tr: "Boşlukları Temizle", en: "Trim Whitespace" } },
                { value: "remove_parentheses", label: { tr: "Parantez İçini Sil", en: "Remove Parentheses" } },
                { value: "extract_parentheses", label: { tr: "Parantez İçini Çıkar", en: "Extract Parentheses" } },
                { value: "remove_numbers", label: { tr: "Sayıları Sil", en: "Remove Numbers" } },
                { value: "extract_numbers", label: { tr: "Sadece Sayıları Al", en: "Extract Numbers Only" } },
                { value: "normalize_turkish", label: { tr: "Türkçe Karakterleri Normalize Et", en: "Normalize Turkish Chars" } }
            ]
        },

        // ===== GRUPLAMA VE TOPLAMA =====
        grouping: {
            name: { tr: "Grupla ve Topla", en: "Group & Aggregate" },
            icon: "fa-object-group",
            color: "#6366f1",
            description: { tr: "Gruplama ve toplama işlemleri", en: "Group by and aggregate" },
            category: "aggregate",
            aggregations: [
                { value: "sum", label: { tr: "Toplam", en: "Sum" } },
                { value: "count", label: { tr: "Sayı", en: "Count" } },
                { value: "mean", label: { tr: "Ortalama", en: "Average" } },
                { value: "min", label: { tr: "Minimum", en: "Min" } },
                { value: "max", label: { tr: "Maksimum", en: "Max" } },
                { value: "std", label: { tr: "Standart Sapma", en: "Std Dev" } },
                { value: "var", label: { tr: "Varyans", en: "Variance" } },
                { value: "first", label: { tr: "İlk Değer", en: "First" } },
                { value: "last", label: { tr: "Son Değer", en: "Last" } },
                { value: "nunique", label: { tr: "Benzersiz Sayısı", en: "Distinct Count" } },
                { value: "mode", label: { tr: "En Sık (Mod)", en: "Mode" } }
            ]
        },

        // ===== PİVOT TABLO =====
        pivot: {
            name: { tr: "Pivot Tablo", en: "Pivot Table" },
            icon: "fa-table-cells",
            color: "#8b5cf6",
            description: { tr: "Özet tablo oluştur", en: "Create summary table" },
            category: "aggregate",
            aggregations: [
                { value: "sum", label: { tr: "Toplam", en: "Sum" } },
                { value: "count", label: { tr: "Sayı", en: "Count" } },
                { value: "mean", label: { tr: "Ortalama", en: "Average" } },
                { value: "min", label: { tr: "Minimum", en: "Min" } },
                { value: "max", label: { tr: "Maksimum", en: "Max" } },
                { value: "median", label: { tr: "Medyan", en: "Median" } },
                { value: "std", label: { tr: "Standart Sapma", en: "Std Dev" } }
            ],
            percentTypes: [
                { value: "", label: { tr: "Yüzde Yok", en: "No Percent" } },
                { value: "row", label: { tr: "% Satır Toplamı", en: "% of Row" } },
                { value: "column", label: { tr: "% Sütun Toplamı", en: "% of Column" } },
                { value: "total", label: { tr: "% Genel Toplam", en: "% of Total" } }
            ]
        },

        // ===== SIRALAMA / RANK =====
        window_function: {
            name: { tr: "Sıralama/Rank", en: "Ranking" },
            icon: "fa-trophy",
            color: "#f97316",
            description: { tr: "RANK, Dense Rank, Lead/Lag", en: "RANK, Dense Rank, Lead/Lag" },
            category: "aggregate",
            windowTypes: [
                { value: "rank", label: { tr: "RANK (Sıralama)", en: "RANK" } },
                { value: "dense_rank", label: { tr: "Dense RANK (Kesintisiz Sıra)", en: "Dense RANK" } },
                { value: "row_number", label: { tr: "Satır Numarası", en: "Row Number" } },
                { value: "percent_rank", label: { tr: "Yüzdelik Sıra", en: "Percent Rank" } },
                { value: "ntile", label: { tr: "N'e Böl (Quartile/Decile)", en: "NTile (Quartile)" } },
                { value: "cumsum", label: { tr: "Kümülatif Toplam", en: "Cumulative Sum" } },
                { value: "cummean", label: { tr: "Kümülatif Ortalama", en: "Cumulative Mean" } },
                { value: "count", label: { tr: "Grup Sayısı (Count)", en: "Group Count" } },
                { value: "sum", label: { tr: "Grup Toplamı", en: "Group Sum" } },
                { value: "mean", label: { tr: "Grup Ortalaması", en: "Group Average" } },
                { value: "min", label: { tr: "Grup Minimumu", en: "Group Min" } },
                { value: "max", label: { tr: "Grup Maksimumu", en: "Group Max" } }
            ]
        },

        // ===== ZAMAN SERİSİ =====
        time_series: {
            name: { tr: "Zaman Serisi", en: "Time Series" },
            icon: "fa-calendar-days",
            color: "#9a3050",
            description: { tr: "Tarih bazlı analiz (YTD, YoY, QoQ)", en: "Date-based analysis" },
            category: "analysis",
            analysisTypes: [
                { value: "ytd_sum", label: { tr: "YTD Toplam (Yıl Başından Bugüne)", en: "YTD Sum" } },
                { value: "mtd_sum", label: { tr: "MTD Toplam (Ay Başından Bugüne)", en: "MTD Sum" } },
                { value: "yoy_change", label: { tr: "YoY Değişim (Yıldan Yıla %)", en: "YoY Change (%)" } },
                { value: "qoq_change", label: { tr: "QoQ Değişim (Çeyrekten Çeyreğe %)", en: "QoQ Change (%)" } },
                { value: "date_hierarchy", label: { tr: "Tarih Hiyerarşisi (Yıl/Çeyrek/Ay/Gün)", en: "Date Hierarchy" } }
            ]
        },

        // ===== İLERİ HESAPLAMALAR =====
        advanced_computed: {
            name: { tr: "İleri Hesaplama", en: "Advanced Calculation" },
            icon: "fa-square-root-variable",
            color: "#d946ef",
            description: { tr: "Z-Score, Percentile, Yaş, vs.", en: "Z-Score, Percentile, Age, etc." },
            category: "analysis",
            advancedTypes: [
                { value: "z_score", label: { tr: "Z-Score (Standart Sapma)", en: "Z-Score" } },
                { value: "percentile_rank", label: { tr: "Yüzdelik Sıralama", en: "Percentile Rank" } },
                { value: "age", label: { tr: "Yaş Hesapla", en: "Calculate Age" } },
                { value: "split", label: { tr: "Sütun Böl (Ayraç ile)", en: "Split Column" } },
                { value: "weekday", label: { tr: "Haftanın Günü", en: "Weekday" } },
                { value: "business_days", label: { tr: "İş Günü Farkı", en: "Business Days Diff" } },
                { value: "duplicate_flag", label: { tr: "Tekrar İşaretle", en: "Flag Duplicates" } },
                { value: "missing_flag", label: { tr: "Eksik Veri İşaretle", en: "Flag Missing" } },
                { value: "extract_year", label: { tr: "Yıl Çıkar", en: "Extract Year" } },
                { value: "extract_month", label: { tr: "Ay Çıkar", en: "Extract Month" } },
                { value: "extract_day", label: { tr: "Gün Çıkar", en: "Extract Day" } },
                { value: "extract_week", label: { tr: "Hafta Çıkar", en: "Extract Week" } }
            ]
        },

        // ===== SIRALAMA =====
        sort: {
            name: { tr: "Sıralama", en: "Sort" },
            icon: "fa-arrow-up-wide-short",
            color: "#f59e0b",
            description: { tr: "Verileri sırala", en: "Sort data" },
            category: "transform"
        },

        // ===== TEKRARLARİ SİL =====
        remove_duplicates: {
            name: { tr: "Tekrarları Sil", en: "Remove Duplicates" },
            icon: "fa-clone",
            color: "#ef4444",
            description: { tr: "Tekrar eden satırları sil", en: "Remove duplicate rows" },
            category: "clean"
        },

        // ===== GRAFİK =====
        chart: {
            name: { tr: "Grafik", en: "Chart" },
            icon: "fa-chart-column",
            color: "#14b8a6",
            description: { tr: "Görselleştirme ekle", en: "Add visualization" },
            category: "output",
            chartTypes: [
                { value: "column", label: { tr: "Sütun Grafik", en: "Column Chart" } },
                { value: "bar", label: { tr: "Çubuk Grafik", en: "Bar Chart" } },
                { value: "line", label: { tr: "Çizgi Grafik", en: "Line Chart" } },
                { value: "pie", label: { tr: "Pasta Grafik", en: "Pie Chart" } },
                { value: "doughnut", label: { tr: "Halka Grafik", en: "Doughnut Chart" } },
                { value: "area", label: { tr: "Alan Grafik", en: "Area Chart" } },
                { value: "scatter", label: { tr: "Dağılım", en: "Scatter" } }
            ]
        },

        // ===== KOŞULLU FORMAT =====
        conditional_format: {
            name: { tr: "Koşullu Format", en: "Conditional Format" },
            icon: "fa-palette",
            color: "#a855f7",
            description: { tr: "Renk kuralları uygula", en: "Apply color rules" },
            category: "output",
            formatTypes: [
                { value: "color_scale", label: { tr: "Renk Skalası (3 Renk)", en: "Color Scale (3 Color)" } },
                { value: "2_color_scale", label: { tr: "Renk Skalası (2 Renk)", en: "Color Scale (2 Color)" } },
                { value: "data_bar", label: { tr: "Veri Çubuğu", en: "Data Bar" } },
                { value: "icon_set", label: { tr: "İkon Seti", en: "Icon Set" } },
                { value: "threshold", label: { tr: "Eşik Değer", en: "Threshold" } },
                { value: "top_n", label: { tr: "En Yüksek N", en: "Top N" } },
                { value: "bottom_n", label: { tr: "En Düşük N", en: "Bottom N" } },
                { value: "duplicate", label: { tr: "Tekrarlananları İşaretle", en: "Highlight Duplicates" } },
                { value: "unique", label: { tr: "Benzersizleri İşaretle", en: "Highlight Unique" } }
            ]
        },

        // ===== LOOKUP & JOIN BLOKLARI (FAZ-MS-P2: PRO Parity) =====
        lookup_join: {
            name: { tr: "VLOOKUP / Birleştir", en: "VLOOKUP / Join" },
            icon: "fa-link",
            color: "#4a90d9",
            description: { tr: "İki tabloyu birleştir (VLOOKUP/Merge)", en: "Join two tables" },
            category: "combine",
            requiresSecondFile: true,
            joinTypes: [
                { value: "vlookup", label: { tr: "VLOOKUP (Eşleşen değerleri getir)", en: "VLOOKUP (Fetch matching values)" } },
                { value: "left", label: { tr: "Sol Birleşim (Tüm ana tablo + eşleşenler)", en: "Left Join" } },
                { value: "inner", label: { tr: "İç Birleşim (Sadece eşleşenler)", en: "Inner Join" } },
                { value: "outer", label: { tr: "Dış Birleşim (Tümü)", en: "Outer Join" } },
                { value: "cross_sheet", label: { tr: "Aynı Dosyadan Farklı Sayfa", en: "Cross-Sheet (Same File)" } }
            ]
        },

        // ===== UNION (Alt Alta Birleştir) =====
        union: {
            name: { tr: "Alt Alta Birleştir", en: "Union (Append)" },
            icon: "fa-layer-group",
            color: "#0ea5e9",
            description: { tr: "İki tabloyu alt alta ekle", en: "Append two tables" },
            category: "combine",
            requiresSecondFile: true
        },

        // ===== DIFF (Fark Bul) =====
        diff: {
            name: { tr: "Fark Bul", en: "Find Difference" },
            icon: "fa-not-equal",
            color: "#ef4444",
            description: { tr: "Ana dosyada olup ikincide olmayan", en: "Records only in main file" },
            category: "combine",
            requiresSecondFile: true
        },

        // ===== VALIDATE (Doğrula) =====
        validate: {
            name: { tr: "Doğrula", en: "Validate" },
            icon: "fa-check-double",
            color: "#22c55e",
            description: { tr: "Referans listeden doğrula", en: "Validate against reference" },
            category: "combine",
            requiresSecondFile: true
        },

        // ===== WHAT-IF VARIABLE (Senaryo Değişkeni) =====
        what_if_variable: {
            name: { tr: "Senaryo Değişkeni", en: "What-If Variable" },
            icon: "fa-sliders",
            color: "#7c3aed",
            description: { tr: "What-If analizi için değişken tanımla", en: "Define variable for What-If" },
            category: "analysis"
        },

        // ===== ÇIKTI AYARLARI =====
        output_settings: {
            name: { tr: "Çıktı Ayarları", en: "Output Settings" },
            icon: "fa-cog",
            color: "#64748b",
            description: { tr: "Excel çıktı seçenekleri", en: "Excel output options" },
            category: "output"
        }
    };

    // ============================================================
    // PALETTE CATEGORIES - Report Studio PRO Structure
    // ============================================================

    const MACRO_PALETTE_CATEGORIES = [
        {
            id: 'source',
            name: { tr: 'Kaynak', en: 'Source' },
            icon: 'fa-database',
            blocks: ['data_source']
        },
        {
            id: 'clean',
            name: { tr: 'Temizleme', en: 'Clean' },
            icon: 'fa-broom',
            blocks: ['filter', 'remove_duplicates', 'text_transform']
        },
        {
            id: 'transform',
            name: { tr: 'Dönüştürme', en: 'Transform' },
            icon: 'fa-wand-magic-sparkles',
            blocks: ['what_if_variable', 'computed', 'formula', 'if_else', 'advanced_computed', 'sort']
        },
        {
            id: 'aggregate',
            name: { tr: 'Toplama & Analiz', en: 'Aggregate & Analysis' },
            icon: 'fa-calculator',
            blocks: ['grouping', 'pivot', 'window_function', 'time_series']
        },
        {
            id: 'combine',
            name: { tr: 'Birleştirme', en: 'Combine' },
            icon: 'fa-link',
            blocks: ['lookup_join', 'union', 'diff', 'validate']
        },
        {
            id: 'output',
            name: { tr: 'Çıktı & Görsel', en: 'Output & Visual' },
            icon: 'fa-file-export',
            blocks: ['chart', 'conditional_format', 'output_settings']
        }
    ];

    // ============================================================
    // PIPELINE STATE
    // ============================================================

    const PIPELINE_STATE = {
        blocks: [],
        selectedBlockId: null,
        blockIdCounter: 0,
        cacheDB: null,
        isDragging: false,
        draggedBlockType: null,
        dropHandlerAttached: false,
        paletteHandlerAttached: false
    };

    // ============================================================
    // LANGUAGE HELPER
    // ============================================================

    function getText(obj) {
        const lang = window.MacroStudio?.getState()?.currentLang || 'tr';
        if (typeof obj === 'string') return obj;
        return obj?.[lang] || obj?.['tr'] || obj;
    }

    // ============================================================
    // INDEXEDDB CACHE
    // ============================================================

    async function openCacheDB() {
        if (PIPELINE_STATE.cacheDB) return PIPELINE_STATE.cacheDB;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                PIPELINE_STATE.cacheDB = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                    db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'hash' });
                }
            };
        });
    }

    function generateStepHash(blocks) {
        // Create a hash from block configs up to this point
        const configStr = JSON.stringify(blocks.map(b => ({
            type: b.type,
            config: b.config
        })));

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < configStr.length; i++) {
            const char = configStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'step_' + Math.abs(hash).toString(16);
    }

    async function getCachedStep(hash) {
        try {
            const db = await openCacheDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
                const store = tx.objectStore(CACHE_STORE_NAME);
                const request = store.get(hash);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result && (Date.now() - result.timestamp) < CACHE_MAX_AGE_MS) {
                        console.log('[MacroPipeline] Cache HIT:', hash);
                        resolve(result.data);
                    } else {
                        console.log('[MacroPipeline] Cache MISS:', hash);
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.warn('[MacroPipeline] Cache read error:', err);
            return null;
        }
    }

    async function cacheStep(hash, data) {
        try {
            const db = await openCacheDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
                const store = tx.objectStore(CACHE_STORE_NAME);
                const request = store.put({
                    hash: hash,
                    data: data,
                    timestamp: Date.now()
                });

                request.onsuccess = () => {
                    console.log('[MacroPipeline] Cache WRITE:', hash);
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.warn('[MacroPipeline] Cache write error:', err);
        }
    }

    async function invalidateCacheFrom(stepIndex) {
        // Clear all cached steps from this index onward
        console.log('[MacroPipeline] Invalidating cache from step:', stepIndex);
        // For simplicity, we use content-based hashing, so changed blocks
        // will naturally miss the cache
    }

    async function clearAllCache() {
        try {
            const db = await openCacheDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
                const store = tx.objectStore(CACHE_STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('[MacroPipeline] Cache CLEARED');
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.warn('[MacroPipeline] Cache clear error:', err);
        }
    }

    // ============================================================
    // BLOCK OPERATIONS
    // ============================================================

    function addBlock(blockType, atIndex = -1) {
        const config = MACRO_BLOCK_TYPES[blockType];
        if (!config) {
            console.error('[MacroPipeline] Unknown block type:', blockType);
            return;
        }

        const block = {
            id: ++PIPELINE_STATE.blockIdCounter,
            type: blockType,
            config: getDefaultBlockConfig(blockType)
        };

        if (atIndex >= 0 && atIndex < PIPELINE_STATE.blocks.length) {
            PIPELINE_STATE.blocks.splice(atIndex, 0, block);
        } else {
            PIPELINE_STATE.blocks.push(block);
        }

        renderPipeline();
        selectBlock(block.id);

        showToast(getText({ tr: 'Blok eklendi', en: 'Block added' }) + ': ' + getText(config.name), 'success', 1500);

        // FAZ-5: Evaluate suggestions after block added
        if (typeof window.MacroSuggestions !== 'undefined') {
            setTimeout(() => {
                window.MacroSuggestions.evaluate();
                window.MacroSuggestions.renderSuggestionPanel();
            }, 100);
        }
    }

    function removeBlock(blockId) {
        const index = PIPELINE_STATE.blocks.findIndex(b => b.id === blockId);
        if (index >= 0) {
            PIPELINE_STATE.blocks.splice(index, 1);
            if (PIPELINE_STATE.selectedBlockId === blockId) {
                PIPELINE_STATE.selectedBlockId = null;
            }
            invalidateCacheFrom(index);
            renderPipeline();
            renderSettings();
        }
    }

    function moveBlock(blockId, direction) {
        const index = PIPELINE_STATE.blocks.findIndex(b => b.id === blockId);
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < PIPELINE_STATE.blocks.length) {
            const block = PIPELINE_STATE.blocks.splice(index, 1)[0];
            PIPELINE_STATE.blocks.splice(newIndex, 0, block);
            invalidateCacheFrom(Math.min(index, newIndex));
            renderPipeline();
        }
    }

    function selectBlock(blockId) {
        PIPELINE_STATE.selectedBlockId = blockId;
        renderPipeline();
        renderSettings();
    }

    function updateBlockConfig(blockId, key, value) {
        const block = PIPELINE_STATE.blocks.find(b => b.id === blockId);
        if (block) {
            block.config[key] = value;
            const index = PIPELINE_STATE.blocks.findIndex(b => b.id === blockId);
            invalidateCacheFrom(index);
            renderPipeline();

            // FAZ-5: Evaluate suggestions after config change
            if (typeof window.MacroSuggestions !== 'undefined') {
                setTimeout(() => {
                    window.MacroSuggestions.evaluate();
                    window.MacroSuggestions.renderSuggestionPanel();
                }, 100);
            }
        }
    }

    function getDefaultBlockConfig(blockType) {
        const defaults = {
            // Source
            data_source: { source_type: 'main', sheet_name: '' },
            // Transform
            if_condition: { column: '', operator: '==', value: '' },
            loop: { variable: 'row' },
            switch_case: { column: '', cases: [] },
            computed: { name: '', columns: [], operation: 'add' },
            formula: { name: '', expression: '' },
            if_else: { name: '', column: '', condition: '==', compare_value: '', true_value: '', false_value: '' },
            text_transform: { column: '', transform_type: 'trim', output_name: '' },
            date_transform: { column: '', transform_type: 'extract_year' },
            filter: { column: '', operator: 'equals', value: '' },
            sort: { column: '', order: 'asc' },
            remove_duplicates: { columns: [] },
            remove_nulls: { columns: [] },
            // Aggregate
            grouping: { group_by: [], agg_column: '', agg_func: 'sum', agg_alias: '' },
            pivot: { rows: [], columns: [], values: [], aggregation: 'sum', percent_type: '', show_totals: true },
            window_function: { window_type: 'rank', value_column: '', direction: 'desc', partition_by: [], output_name: '' },
            time_series: { analysis_type: 'ytd_sum', date_column: '', value_column: '', output_name: '' },
            advanced_computed: { advanced_type: 'z_score', column: '', output_name: '', separator: ',' },
            sum_column: { column: '' },
            count_rows: {},
            avg_column: { column: '' },
            // Combine
            lookup_join: { join_type: 'vlookup', main_key: '', source_key: '', fetch_columns: [], source_type: 'second_file', source_sheet: '' },
            union: { source_type: 'second_file', source_sheet: '', ignore_index: true },
            diff: { left_on: '', source_type: 'second_file', right_on: '' },
            validate: { left_on: '', source_type: 'second_file', right_on: '', valid_label: 'Geçerli', invalid_label: 'Geçersiz' },
            // Output
            chart: { chart_type: 'column', x_column: '', y_columns: [], title: '', show_legend: true },
            conditional_format: { column: '', cf_type: 'color_scale', threshold_value: 10 },
            output_settings: { filename: 'output', format: 'xlsx' },
            export_excel: { filename: 'output.xlsx' },
            export_csv: { filename: 'output.csv', delimiter: ',' },
            // Analysis
            what_if_variable: { name: '', value: 1 }
        };
        return defaults[blockType] || {};
    }

    function getBlockSummary(block) {
        const config = block.config;
        switch (block.type) {
            case 'filter':
                return config.column ? `${config.column} ${config.operator} ${config.value}` : '';
            case 'computed':
                return config.name ? `→ ${config.name}` : '';
            case 'formula':
                return config.expression ? config.expression.substring(0, 20) : '';
            case 'grouping':
                return config.group_by?.length ? `by: ${config.group_by.join(', ')}` : '';
            case 'text_transform':
            case 'date_transform':
                return config.column ? `${config.column}` : '';
            // FAZ-MS-P2: New block summaries
            case 'lookup_join':
                return config.join_type ? `${config.join_type}: ${config.main_key || '?'} ↔ ${config.source_key || '?'}` : '';
            case 'union':
                return config.append_type ? `(${config.append_type})` : '';
            case 'diff':
                return config.key_columns?.length ? `keys: ${config.key_columns.join(', ')}` : '';
            case 'validate':
                return config.key_column ? `${config.key_column} → ${config.action || 'flag'}` : '';
            case 'what_if_variable':
                return config.variable_name ? `$${config.variable_name} = ${config.default_value}` : '';
            default:
                return '';
        }
    }

    // ============================================================
    // PIPELINE EXECUTION
    // ============================================================

    async function executePipeline() {
        if (PIPELINE_STATE.blocks.length === 0) {
            showToast(getText({ tr: 'Pipeline boş!', en: 'Pipeline is empty!' }), 'warning');
            return null;
        }

        const state = window.MacroStudio?.getState();
        if (!state?.previewRows?.length) {
            showToast(getText({ tr: 'Önce dosya yükleyin', en: 'Load a file first' }), 'error');
            return null;
        }

        showToast(getText({ tr: 'Pipeline çalıştırılıyor...', en: 'Running pipeline...' }), 'info');

        const originalData = [...state.previewRows]; // Clone input data
        let data = [...originalData];

        // FAZ-4: Track step results for diff and decision trace
        const stepResults = [];

        for (let i = 0; i < PIPELINE_STATE.blocks.length; i++) {
            const blocksUpToHere = PIPELINE_STATE.blocks.slice(0, i + 1);
            const cacheKey = generateStepHash(blocksUpToHere);

            const beforeData = [...data]; // Snapshot before
            const startTime = performance.now();

            // Check cache first
            const cached = await getCachedStep(cacheKey);
            if (cached) {
                data = cached;
                console.log(`[MacroPipeline] Step ${i + 1} from cache`);
            } else {
                // Execute step
                console.log(`[MacroPipeline] Executing step ${i + 1}:`, PIPELINE_STATE.blocks[i].type);
                data = await executeBlock(PIPELINE_STATE.blocks[i], data);

                // Cache result
                await cacheStep(cacheKey, data);
            }

            const endTime = performance.now();

            // FAZ-4: Record step result for decision trace
            stepResults.push({
                before: beforeData,
                after: [...data],
                duration: Math.round(endTime - startTime)
            });
        }

        // FAZ-4: Generate diff and decision trace
        if (typeof window.MacroDiffTrace !== 'undefined') {
            try {
                // Generate overall diff (original vs final)
                const diff = window.MacroDiffTrace.generateDiff(originalData, data);

                // Build decision trace
                const trace = window.MacroDiffTrace.buildDecisionTrace(
                    PIPELINE_STATE.blocks,
                    stepResults
                );

                // Render panels (embedded mode containers)
                const diffContainer = document.getElementById('embeddedMacroDiffPanel') ||
                    document.getElementById('macroDiffPanel');
                const traceContainer = document.getElementById('embeddedMacroTracePanel') ||
                    document.getElementById('macroTracePanel');

                if (diffContainer) {
                    window.MacroDiffTrace.renderDiffPanel(diff, diffContainer.id);
                }
                if (traceContainer) {
                    window.MacroDiffTrace.renderTracePanel(trace, traceContainer.id);
                }

                console.log('[MacroPipeline] FAZ-4 Diff & Trace generated', { diff, trace });
            } catch (err) {
                console.warn('[MacroPipeline] Diff/Trace error:', err);
            }
        }

        showToast(getText({ tr: 'Pipeline tamamlandı!', en: 'Pipeline complete!' }), 'success');
        return data;
    }

    async function executeBlock(block, data) {
        const config = block.config;
        let result = [...data];

        switch (block.type) {
            case 'filter':
                result = data.filter(row => {
                    const val = row[config.column];
                    const cmp = config.value;
                    switch (config.operator) {
                        case 'equals': return val == cmp;
                        case 'not_equals': return val != cmp;
                        case 'greater': return parseFloat(val) > parseFloat(cmp);
                        case 'less': return parseFloat(val) < parseFloat(cmp);
                        case 'contains': return String(val).includes(cmp);
                        case 'not_contains': return !String(val).includes(cmp);
                        default: return true;
                    }
                });
                break;

            case 'if_condition':
                result = data.filter(row => {
                    const val = row[config.column];
                    const cmp = config.value;
                    switch (config.operator) {
                        case '>': return parseFloat(val) > parseFloat(cmp);
                        case '<': return parseFloat(val) < parseFloat(cmp);
                        case '>=': return parseFloat(val) >= parseFloat(cmp);
                        case '<=': return parseFloat(val) <= parseFloat(cmp);
                        case '==': return val == cmp;
                        case '!=': return val != cmp;
                        case 'contains': return String(val).includes(cmp);
                        case 'is_null': return val == null || val === '';
                        default: return true;
                    }
                });
                break;

            case 'remove_duplicates':
                const seen = new Set();
                const keys = config.columns?.length ? config.columns : Object.keys(data[0] || {});
                result = data.filter(row => {
                    const key = keys.map(k => row[k]).join('||');
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                break;

            case 'remove_nulls':
                const nullCols = config.columns?.length ? config.columns : Object.keys(data[0] || {});
                result = data.filter(row => {
                    return nullCols.every(col => row[col] != null && row[col] !== '');
                });
                break;

            case 'computed':
                const cols = config.columns || [];
                result = data.map(row => {
                    const newRow = { ...row };
                    let calcResult = 0;

                    if (cols.length >= 2) {
                        const a = parseFloat(row[cols[0]]) || 0;
                        const b = parseFloat(row[cols[1]]) || 0;

                        switch (config.operation) {
                            case 'add': calcResult = a + b; break;
                            case 'subtract': calcResult = a - b; break;
                            case 'multiply': calcResult = a * b; break;
                            case 'divide': calcResult = b !== 0 ? a / b : 0; break;
                            case 'percent': calcResult = b !== 0 ? (a / b) * 100 : 0; break;
                            case 'concat': calcResult = String(row[cols[0]] || '') + String(row[cols[1]] || ''); break;
                            default: calcResult = a;
                        }
                    }

                    if (config.name) {
                        newRow[config.name] = calcResult;
                    }
                    return newRow;
                });
                break;

            case 'text_transform':
                result = data.map(row => {
                    const newRow = { ...row };
                    const val = String(row[config.column] || '');

                    switch (config.transform_type) {
                        case 'to_upper': newRow[config.column] = val.toUpperCase(); break;
                        case 'to_lower': newRow[config.column] = val.toLowerCase(); break;
                        case 'trim': newRow[config.column] = val.trim(); break;
                        case 'replace':
                            newRow[config.column] = val.replace(config.find || '', config.replace_with || '');
                            break;
                    }
                    return newRow;
                });
                break;

            case 'date_transform':
                result = data.map(row => {
                    const newRow = { ...row };
                    const dateVal = new Date(row[config.column]);

                    if (!isNaN(dateVal.getTime())) {
                        switch (config.transform_type) {
                            case 'extract_year':
                                newRow[config.column + '_year'] = dateVal.getFullYear();
                                break;
                            case 'extract_month':
                                newRow[config.column + '_month'] = dateVal.getMonth() + 1;
                                break;
                            case 'extract_day':
                                newRow[config.column + '_day'] = dateVal.getDate();
                                break;
                        }
                    }
                    return newRow;
                });
                break;

            case 'grouping':
                const groups = {};
                data.forEach(row => {
                    const key = (config.group_by || []).map(col => row[col]).join('||');
                    if (!groups[key]) {
                        groups[key] = { rows: [], first: row };
                    }
                    groups[key].rows.push(row);
                });

                result = Object.values(groups).map(group => {
                    const aggRow = { ...group.first };
                    (config.aggregations || []).forEach(agg => {
                        const vals = group.rows.map(r => parseFloat(r[agg.column]) || 0);
                        switch (agg.func) {
                            case 'sum': aggRow[agg.column + '_sum'] = vals.reduce((a, b) => a + b, 0); break;
                            case 'count': aggRow[agg.column + '_count'] = vals.length; break;
                            case 'avg': aggRow[agg.column + '_avg'] = vals.reduce((a, b) => a + b, 0) / vals.length; break;
                            case 'min': aggRow[agg.column + '_min'] = Math.min(...vals); break;
                            case 'max': aggRow[agg.column + '_max'] = Math.max(...vals); break;
                        }
                    });
                    return aggRow;
                });
                break;

            case 'sum_column':
                const sumVal = data.reduce((acc, row) => acc + (parseFloat(row[config.column]) || 0), 0);
                result = [{ [config.column + '_total']: sumVal, _type: 'aggregate' }];
                break;

            case 'count_rows':
                result = [{ row_count: data.length, _type: 'aggregate' }];
                break;

            case 'avg_column':
                const avgVal = data.reduce((acc, row) => acc + (parseFloat(row[config.column]) || 0), 0) / data.length;
                result = [{ [config.column + '_average']: avgVal, _type: 'aggregate' }];
                break;

            default:
                // Pass through for output blocks
                result = data;
        }

        return result;
    }

    // ============================================================
    // UI RENDERING
    // ============================================================

    function renderPalette() {
        console.log('[MacroPipeline] renderPalette called');
        const container = document.getElementById('macroPipelinePalette');
        console.log('[MacroPipeline] macroPipelinePalette container:', container);
        if (!container) {
            console.warn('[MacroPipeline] macroPipelinePalette container NOT FOUND!');
            return;
        }

        let html = `<h3 class="vb-palette-title"><i class="fas fa-cubes"></i> ${getText({ tr: 'Blok Paleti', en: 'Block Palette' })}</h3>`;

        html += `<div class="vb-palette-categories">`;

        MACRO_PALETTE_CATEGORIES.forEach((category, idx) => {
            const isExpanded = idx < 2;

            html += `
                <div class="vb-palette-category ${isExpanded ? 'expanded' : ''}" data-category="${category.id}">
                    <div class="vb-category-header" onclick="MacroPipeline.toggleCategory('${category.id}')">
                        <i class="fas ${category.icon}"></i>
                        <span>${getText(category.name)}</span>
                        <i class="fas fa-chevron-down vb-category-chevron"></i>
                    </div>
                    <div class="vb-category-blocks">
            `;

            category.blocks.forEach(blockType => {
                const config = MACRO_BLOCK_TYPES[blockType];
                if (!config) return;

                html += `
                    <div class="vb-palette-block" draggable="true" data-block-type="${blockType}">
                        <div class="vb-palette-icon" style="background:${config.color};">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <div class="vb-palette-info">
                            <span class="vb-palette-name">${getText(config.name)}</span>
                            <span class="vb-palette-desc">${getText(config.description)}</span>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Setup drag listeners
        container.querySelectorAll('.vb-palette-block').forEach(block => {
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.dataset.blockType);
                PIPELINE_STATE.isDragging = true;
                PIPELINE_STATE.draggedBlockType = block.dataset.blockType;
                block.classList.add('dragging');
            });

            block.addEventListener('dragend', () => {
                PIPELINE_STATE.isDragging = false;
                PIPELINE_STATE.draggedBlockType = null;
                block.classList.remove('dragging');
            });

            block.addEventListener('click', () => {
                addBlock(block.dataset.blockType);
            });
        });
    }

    function renderPipeline() {
        const container = document.getElementById('macroPipelineCanvas');
        if (!container) return;

        if (PIPELINE_STATE.blocks.length === 0) {
            container.innerHTML = `
                <div class="vb-canvas-empty">
                    <i class="fas fa-arrow-left"></i>
                    <p>${getText({ tr: 'Soldan blok sürükleyin veya tıklayın', en: 'Drag or click blocks from left' })}</p>
                </div>
            `;
            return;
        }

        let html = `<div class="vb-pipeline">`;

        PIPELINE_STATE.blocks.forEach((block, index) => {
            const config = MACRO_BLOCK_TYPES[block.type];
            const isSelected = block.id === PIPELINE_STATE.selectedBlockId;

            html += `
                <div class="vb-block ${isSelected ? 'selected' : ''}" data-block-id="${block.id}">
                    <div class="vb-block-header" style="border-left-color:${config.color};">
                        <div class="vb-block-step-num">${index + 1}</div>
                        <div class="vb-block-icon" style="background:${config.color};">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <div class="vb-block-title">
                            <span class="vb-block-type">${getText(config.name)}</span>
                            <span class="vb-block-summary">${getBlockSummary(block)}</span>
                        </div>
                        <div class="vb-block-actions">
                            <button class="vb-btn-move-up" title="Yukarı" ${index === 0 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="vb-btn-move-down" title="Aşağı" ${index === PIPELINE_STATE.blocks.length - 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <button class="vb-btn-delete" title="Sil">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (index < PIPELINE_STATE.blocks.length - 1) {
                html += `<div class="vb-connector"><i class="fas fa-arrow-down"></i></div>`;
            }
        });

        html += `</div>`;

        // Footer buttons
        html += `
            <div class="vb-canvas-footer">
                <button class="gm-gradient-btn vb-run-btn" onclick="MacroPipeline.run()">
                    <i class="fas fa-play"></i> ${getText({ tr: 'Çalıştır', en: 'Run' })}
                </button>
                <button class="gm-pill-btn" onclick="MacroPipeline.clearPipeline()">
                    <i class="fas fa-trash"></i> ${getText({ tr: 'Temizle', en: 'Clear' })}
                </button>
            </div>
        `;

        container.innerHTML = html;

        // Setup event listeners
        container.querySelectorAll('.vb-block').forEach(blockEl => {
            const blockId = parseInt(blockEl.dataset.blockId);

            blockEl.addEventListener('click', (e) => {
                if (!e.target.closest('.vb-block-actions')) {
                    selectBlock(blockId);
                }
            });

            blockEl.querySelector('.vb-btn-delete')?.addEventListener('click', () => removeBlock(blockId));
            blockEl.querySelector('.vb-btn-move-up')?.addEventListener('click', () => moveBlock(blockId, -1));
            blockEl.querySelector('.vb-btn-move-down')?.addEventListener('click', () => moveBlock(blockId, 1));
        });

        // Drop handlers are now setup once in init() via setupDropHandlers()
    }

    function renderSettings() {
        const container = document.getElementById('macroPipelineSettings');
        if (!container) return;

        if (!PIPELINE_STATE.selectedBlockId) {
            container.innerHTML = `
                <div class="vb-settings-empty">
                    <i class="fas fa-sliders"></i>
                    <p>${getText({ tr: 'Blok seçin', en: 'Select a block' })}</p>
                </div>
            `;
            return;
        }

        const block = PIPELINE_STATE.blocks.find(b => b.id === PIPELINE_STATE.selectedBlockId);
        if (!block) return;

        const config = MACRO_BLOCK_TYPES[block.type];
        const columns = window.MacroStudio?.getState()?.columns || [];

        let html = `
            <div class="vb-settings-header">
                <div class="vb-settings-icon" style="background:${config.color};">
                    <i class="fas ${config.icon}"></i>
                </div>
                <h3>${getText(config.name)}</h3>
            </div>
            <div class="vb-settings-body">
        `;

        // Render block-specific settings
        html += renderBlockSettings(block, columns);

        html += `</div>`;
        container.innerHTML = html;

        // Setup change listeners
        container.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', (e) => {
                let value = e.target.value;
                if (e.target.type === 'checkbox') value = e.target.checked;
                if (e.target.multiple) {
                    value = Array.from(e.target.selectedOptions).map(o => o.value);
                }
                updateBlockConfig(PIPELINE_STATE.selectedBlockId, e.target.name, value);
            });
        });
    }

    function renderBlockSettings(block, columns) {
        const config = block.config;
        const blockDef = MACRO_BLOCK_TYPES[block.type];
        const sheets = window.MacroStudio?.getState()?.sheetNames || [];
        let html = '';

        switch (block.type) {
            // ===== VERİ KAYNAĞI =====
            case 'data_source':
                html += renderSelect('source_type', config.source_type, [
                    { value: 'main', label: { tr: 'Ana Dosya', en: 'Main File' } },
                    { value: 'second', label: { tr: 'İkinci Dosya', en: 'Second File' } },
                    { value: 'cross_sheet', label: { tr: 'Aynı Dosyadan Farklı Sayfa', en: 'Cross-Sheet' } }
                ], { tr: 'Kaynak Tipi', en: 'Source Type' });
                if (config.source_type === 'cross_sheet' && sheets.length > 0) {
                    html += renderSelect('sheet_name', config.sheet_name,
                        sheets.map(s => ({ value: s, label: s })),
                        { tr: 'Sayfa Seçimi', en: 'Sheet Selection' });
                }
                break;

            // ===== FİLTRE =====
            case 'filter':
            case 'if_condition':
                html += renderColumnSelect('column', config.column, columns, { tr: 'Sütun', en: 'Column' });
                html += renderSelect('operator', config.operator,
                    MACRO_BLOCK_TYPES[block.type]?.operators || MACRO_BLOCK_TYPES.filter.operators,
                    { tr: 'Operatör', en: 'Operator' });
                html += renderInput('value', config.value, { tr: 'Değer', en: 'Value' });
                break;

            // ===== HESAPLAMA =====
            case 'computed':
                html += renderInput('name', config.name, { tr: 'Yeni Sütun Adı', en: 'New Column Name' });
                html += renderColumnSelect('columns', config.columns, columns, { tr: 'Kaynak Sütunlar', en: 'Source Columns' }, true);
                html += renderSelect('operation', config.operation,
                    MACRO_BLOCK_TYPES.computed.operations, { tr: 'İşlem', en: 'Operation' });
                break;

            // ===== FORMÜL =====
            case 'formula':
                html += renderInput('name', config.name, { tr: 'Çıktı Sütun Adı', en: 'Output Column Name' });
                html += renderInput('expression', config.expression, { tr: 'Formül (örn: A+B*100)', en: 'Formula (e.g. A+B*100)' });
                break;

            // ===== IF-ELSE =====
            case 'if_else':
                html += renderInput('name', config.name, { tr: 'Yeni Sütun Adı', en: 'New Column Name' });
                html += renderColumnSelect('column', config.column, columns, { tr: 'Koşul Sütunu', en: 'Condition Column' });
                html += renderSelect('condition', config.condition,
                    MACRO_BLOCK_TYPES.if_else.conditionTypes, { tr: 'Koşul', en: 'Condition' });
                html += renderInput('compare_value', config.compare_value, { tr: 'Karşılaştırma Değeri', en: 'Compare Value' });
                html += renderInput('true_value', config.true_value, { tr: 'Doğruysa Değer', en: 'If True Value' });
                html += renderInput('false_value', config.false_value, { tr: 'Yanlışsa Değer', en: 'If False Value' });
                break;

            // ===== METİN DÖNÜŞTÜR =====
            case 'text_transform':
                html += renderColumnSelect('column', config.column, columns, { tr: 'Kaynak Sütun', en: 'Source Column' });
                html += renderSelect('transform_type', config.transform_type,
                    MACRO_BLOCK_TYPES.text_transform.transformTypes, { tr: 'Dönüşüm Tipi', en: 'Transform Type' });
                html += renderInput('output_name', config.output_name, { tr: 'Çıktı Sütun Adı (boşsa üzerine yazar)', en: 'Output Name (empty overwrites)' });
                break;

            // ===== SIRALAMA =====
            case 'sort':
                html += renderColumnSelect('column', config.column, columns, { tr: 'Sıralama Sütunu', en: 'Sort Column' });
                html += renderSelect('order', config.order || 'asc', [
                    { value: 'asc', label: { tr: 'Artan (A→Z)', en: 'Ascending' } },
                    { value: 'desc', label: { tr: 'Azalan (Z→A)', en: 'Descending' } }
                ], { tr: 'Sıra', en: 'Order' });
                break;

            // ===== TEKRARLARİ SİL =====
            case 'remove_duplicates':
            case 'remove_nulls':
                html += renderColumnSelect('columns', config.columns, columns,
                    { tr: 'Sütunlar (boş = tümü)', en: 'Columns (empty = all)' }, true);
                break;

            // ===== GRUPLAMA =====
            case 'grouping':
                html += renderColumnSelect('group_by', config.group_by, columns, { tr: 'Gruplama Sütunları', en: 'Group By Columns' }, true);
                html += renderColumnSelect('agg_column', config.agg_column, columns, { tr: 'Toplanacak Sütun', en: 'Aggregate Column' });
                html += renderSelect('agg_func', config.agg_func,
                    MACRO_BLOCK_TYPES.grouping.aggregations, { tr: 'Toplama Fonksiyonu', en: 'Aggregate Function' });
                html += renderInput('agg_alias', config.agg_alias, { tr: 'Sonuç Sütun Adı', en: 'Result Column Name' });
                break;

            // ===== PİVOT =====
            case 'pivot':
                html += renderColumnSelect('rows', config.rows, columns, { tr: 'Satır Alanları', en: 'Row Fields' }, true);
                html += renderColumnSelect('columns', config.columns, columns, { tr: 'Sütun Alanları (Opsiyonel)', en: 'Column Fields' }, true);
                html += renderColumnSelect('values', config.values, columns, { tr: 'Değer Alanları', en: 'Value Fields' }, true);
                html += renderSelect('aggregation', config.aggregation,
                    MACRO_BLOCK_TYPES.pivot.aggregations, { tr: 'Toplama', en: 'Aggregation' });
                html += renderSelect('percent_type', config.percent_type,
                    MACRO_BLOCK_TYPES.pivot.percentTypes, { tr: 'Yüzde Tipi', en: 'Percent Type' });
                html += renderCheckbox('show_totals', config.show_totals, { tr: 'Genel Toplam Göster', en: 'Show Grand Total' });
                break;

            // ===== WINDOW FONKSİYONLARI =====
            case 'window_function':
                html += renderSelect('window_type', config.window_type,
                    MACRO_BLOCK_TYPES.window_function.windowTypes, { tr: 'Fonksiyon', en: 'Function' });
                html += renderColumnSelect('value_column', config.value_column, columns, { tr: 'Değer Sütunu', en: 'Value Column' });
                html += renderSelect('direction', config.direction || 'desc', [
                    { value: 'asc', label: { tr: 'Artan (1=En Düşük)', en: 'Ascending (Lowest = 1)' } },
                    { value: 'desc', label: { tr: 'Azalan (1=En Yüksek)', en: 'Descending (Highest = 1)' } }
                ], { tr: 'Sıralama Yönü', en: 'Sort Direction' });
                html += renderColumnSelect('partition_by', config.partition_by, columns,
                    { tr: 'Gruplama Sütunları (Opsiyonel)', en: 'Partition By (Optional)' }, true);
                html += renderInput('output_name', config.output_name, { tr: 'Çıktı Sütun Adı', en: 'Output Column Name' });
                break;

            // ===== ZAMAN SERİSİ =====
            case 'time_series':
                html += renderSelect('analysis_type', config.analysis_type,
                    MACRO_BLOCK_TYPES.time_series.analysisTypes, { tr: 'Analiz Tipi', en: 'Analysis Type' });
                html += renderColumnSelect('date_column', config.date_column, columns, { tr: 'Tarih Sütunu', en: 'Date Column' });
                html += renderColumnSelect('value_column', config.value_column, columns, { tr: 'Değer Sütunu', en: 'Value Column' });
                html += renderInput('output_name', config.output_name, { tr: 'Çıktı Sütun Adı', en: 'Output Column Name' });
                break;

            // ===== İLERİ HESAPLAMALAR =====
            case 'advanced_computed':
                html += renderSelect('advanced_type', config.advanced_type,
                    MACRO_BLOCK_TYPES.advanced_computed.advancedTypes, { tr: 'Hesaplama Tipi', en: 'Calculation Type' });
                html += renderColumnSelect('column', config.column, columns, { tr: 'Kaynak Sütun', en: 'Source Column' });
                if (['split', 'business_days'].includes(config.advanced_type)) {
                    html += renderInput('separator', config.separator || ',', { tr: 'Ayraç', en: 'Separator' });
                }
                html += renderInput('output_name', config.output_name, { tr: 'Çıktı Sütun Adı', en: 'Output Column Name' });
                break;

            // ===== WHAT-IF DEĞİŞKEN =====
            case 'what_if_variable':
                html += renderInput('name', config.name, { tr: 'Değişken Adı', en: 'Variable Name' });
                html += renderInput('value', config.value, { tr: 'Değer (Sayı)', en: 'Value (Number)' });
                break;

            // ===== LOOKUP & JOIN =====
            case 'lookup_join':
                html += renderSelect('join_type', config.join_type,
                    MACRO_BLOCK_TYPES.lookup_join.joinTypes, { tr: 'Birleştirme Tipi', en: 'Join Type' });
                html += renderColumnSelect('main_key', config.main_key, columns, { tr: 'Ana Anahtar Sütun', en: 'Main Key Column' });
                html += renderSelect('source_type', config.source_type, [
                    { value: 'second_file', label: { tr: 'İkinci Dosya', en: 'Second File' } },
                    { value: 'same_file_sheet', label: { tr: 'Aynı Dosya - Farklı Sayfa', en: 'Same File - Different Sheet' } }
                ], { tr: 'Kaynak', en: 'Source' });
                if (config.source_type === 'same_file_sheet' && sheets.length > 0) {
                    html += renderSelect('source_sheet', config.source_sheet,
                        sheets.map(s => ({ value: s, label: s })),
                        { tr: 'Sayfa', en: 'Sheet' });
                }
                html += renderInput('source_key', config.source_key, { tr: 'Kaynak Anahtar Sütun', en: 'Source Key Column' });
                html += renderInput('fetch_columns', (config.fetch_columns || []).join(', '),
                    { tr: 'Getirilecek Sütunlar (virgülle)', en: 'Columns to Fetch (comma-separated)' });
                break;

            // ===== UNION =====
            case 'union':
                html += renderSelect('source_type', config.source_type || 'second_file', [
                    { value: 'second_file', label: { tr: 'İkinci Dosya', en: 'Second File' } },
                    { value: 'same_file_sheet', label: { tr: 'Aynı Dosya - Farklı Sayfa', en: 'Same File - Different Sheet' } }
                ], { tr: 'Kaynak', en: 'Source' });
                if (config.source_type === 'same_file_sheet' && sheets.length > 0) {
                    html += renderSelect('source_sheet', config.source_sheet,
                        sheets.map(s => ({ value: s, label: s })),
                        { tr: 'Sayfa', en: 'Sheet' });
                }
                html += renderCheckbox('ignore_index', config.ignore_index, { tr: 'İndeksi Sıfırla', en: 'Reset Index' });
                break;

            // ===== DIFF =====
            case 'diff':
                html += renderColumnSelect('left_on', config.left_on, columns, { tr: 'Karşılaştırma Sütunu', en: 'Compare Column' });
                html += renderSelect('source_type', config.source_type || 'second_file', [
                    { value: 'second_file', label: { tr: 'İkinci Dosya', en: 'Second File' } },
                    { value: 'same_file_sheet', label: { tr: 'Aynı Dosya - Farklı Sayfa', en: 'Same File - Different Sheet' } }
                ], { tr: 'Kaynak', en: 'Source' });
                html += renderInput('right_on', config.right_on, { tr: 'Kaynak Eşleşme Sütunu', en: 'Source Match Column' });
                break;

            // ===== VALIDATE =====
            case 'validate':
                html += renderColumnSelect('left_on', config.left_on, columns, { tr: 'Doğrulanacak Sütun', en: 'Column to Validate' });
                html += renderSelect('source_type', config.source_type || 'second_file', [
                    { value: 'second_file', label: { tr: 'İkinci Dosya', en: 'Second File' } },
                    { value: 'same_file_sheet', label: { tr: 'Aynı Dosya - Farklı Sayfa', en: 'Same File - Different Sheet' } }
                ], { tr: 'Referans Kaynak', en: 'Reference Source' });
                html += renderInput('right_on', config.right_on, { tr: 'Referans Sütunu', en: 'Reference Column' });
                html += renderInput('valid_label', config.valid_label || 'Geçerli', { tr: 'Geçerli Etiketi', en: 'Valid Label' });
                html += renderInput('invalid_label', config.invalid_label || 'Geçersiz', { tr: 'Geçersiz Etiketi', en: 'Invalid Label' });
                break;

            // ===== GRAFİK =====
            case 'chart':
                html += renderSelect('chart_type', config.chart_type,
                    MACRO_BLOCK_TYPES.chart.chartTypes, { tr: 'Grafik Tipi', en: 'Chart Type' });
                html += renderColumnSelect('x_column', config.x_column, columns, { tr: 'X Ekseni', en: 'X Axis' });
                html += renderColumnSelect('y_columns', config.y_columns, columns, { tr: 'Y Ekseni', en: 'Y Axis' }, true);
                html += renderInput('title', config.title, { tr: 'Başlık', en: 'Title' });
                html += renderCheckbox('show_legend', config.show_legend, { tr: 'Gösterge Göster', en: 'Show Legend' });
                break;

            // ===== KOŞULLU FORMAT =====
            case 'conditional_format':
                html += renderColumnSelect('column', config.column, columns, { tr: 'Sütun', en: 'Column' });
                html += renderSelect('cf_type', config.cf_type,
                    MACRO_BLOCK_TYPES.conditional_format.formatTypes, { tr: 'Format Tipi', en: 'Format Type' });
                if (['threshold', 'top_n', 'bottom_n'].includes(config.cf_type)) {
                    html += renderInput('threshold_value', config.threshold_value || 10, { tr: 'Eşik/N Değeri', en: 'Threshold/N Value' });
                }
                break;

            // ===== ÇIKTI AYARLARI =====
            case 'output_settings':
                html += renderInput('filename', config.filename || 'output', { tr: 'Dosya Adı', en: 'Filename' });
                html += renderSelect('format', config.format || 'xlsx', [
                    { value: 'xlsx', label: 'Excel (.xlsx)' },
                    { value: 'csv', label: 'CSV (.csv)' },
                    { value: 'json', label: 'JSON (.json)' }
                ], { tr: 'Format', en: 'Format' });
                break;

            // ===== ESKI BLOKLAR (legacy uyumluluk) =====
            case 'sum_column':
            case 'avg_column':
                html += renderColumnSelect('column', config.column, columns, { tr: 'Sütun', en: 'Column' });
                break;

            case 'export_excel':
            case 'export_csv':
                html += renderInput('filename', config.filename, { tr: 'Dosya Adı', en: 'Filename' });
                break;

            default:
                html += `<p style="color:var(--gm-text-muted);font-size:0.85rem;">${getText({ tr: 'Bu blok için özel ayar yok.', en: 'No specific settings for this block.' })}</p>`;
        }

        return html;
    }

    function renderSelect(name, value, options, label) {
        let html = `
            <div class="vb-form-group">
                <label class="vb-form-label">${getText(label)}</label>
                <select name="${name}" class="vb-select">
                    <option value="">-- ${getText({ tr: 'Seçin', en: 'Select' })} --</option>
        `;
        options.forEach(opt => {
            const optLabel = typeof opt.label === 'object' ? getText(opt.label) : opt.label;
            html += `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${optLabel}</option>`;
        });
        html += `</select></div>`;
        return html;
    }

    function renderMultiSelect(name, values, options, label) {
        let html = `
            <div class="vb-form-group">
                <label class="vb-form-label">${getText(label)}</label>
                <select name="${name}" class="vb-select" multiple size="4">
        `;
        options.forEach(opt => {
            const optLabel = typeof opt.label === 'object' ? getText(opt.label) : opt.label;
            const isSelected = (values || []).includes(opt.value);
            html += `<option value="${opt.value}" ${isSelected ? 'selected' : ''}>${optLabel}</option>`;
        });
        html += `</select></div>`;
        return html;
    }

    function renderInput(name, value, label) {
        return `
            <div class="vb-form-group">
                <label class="vb-form-label">${getText(label)}</label>
                <input type="text" name="${name}" value="${value || ''}" class="vb-input" />
            </div>
        `;
    }

    // Column selector with manual input support (Report Studio PRO pattern)
    function renderColumnSelect(name, value, columns, label, isMultiple = false) {
        const cols = columns || [];
        if (isMultiple) {
            return renderMultiSelect(name, value || [], cols.map(c => ({ value: c, label: c })), label);
        }
        let html = `
            <div class="vb-form-group">
                <label class="vb-form-label">${getText(label)}</label>
                <select name="${name}" class="vb-select">
                    <option value="">-- ${getText({ tr: 'Seçin', en: 'Select' })} --</option>
        `;
        cols.forEach(col => {
            html += `<option value="${col}" ${value === col ? 'selected' : ''}>${col}</option>`;
        });
        html += `</select>
                <input type="text" name="${name}_manual" value="" class="vb-input vb-manual-input" 
                       placeholder="${getText({ tr: 'veya manuel yazın', en: 'or type manually' })}" 
                       style="margin-top:4px;font-size:0.8rem;" />
            </div>
        `;
        return html;
    }

    function renderCheckbox(name, value, label) {
        return `
            <div class="vb-form-group vb-form-checkbox">
                <label class="vb-checkbox-label">
                    <input type="checkbox" name="${name}" ${value ? 'checked' : ''} />
                    <span>${getText(label)}</span>
                </label>
            </div>
        `;
    }

    function toggleCategory(categoryId) {
        const el = document.querySelector(`.vb-palette-category[data-category="${categoryId}"]`);
        if (el) el.classList.toggle('expanded');
    }

    // ============================================================
    // STEP-WISE CACHE (IndexedDB) - FAZ-MS-5
    // ============================================================

    let cacheDB = null;

    /**
     * Open/create IndexedDB for step caching
     */
    function openCacheDB() {
        if (cacheDB) return Promise.resolve(cacheDB);

        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

                request.onerror = () => {
                    console.warn('[MacroPipeline] Cache DB open error');
                    resolve(null);
                };

                request.onsuccess = (e) => {
                    cacheDB = e.target.result;
                    console.log('[MacroPipeline] Cache DB opened');
                    resolve(cacheDB);
                };

                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
                        console.log('[MacroPipeline] Cache store created');
                    }
                };
            } catch (err) {
                console.warn('[MacroPipeline] IndexedDB not available:', err.message);
                resolve(null);
            }
        });
    }

    /**
     * Generate cache key from file fingerprint + actions hash
     */
    function generateCacheKey(fileInfo, actions, sheetName) {
        const fingerprint = fileInfo
            ? `${fileInfo.name || 'unknown'}_${fileInfo.size || 0}_${fileInfo.lastModified || 0}`
            : 'no_file';

        const actionsHash = actions && actions.length > 0
            ? simpleHash(JSON.stringify(actions))
            : 'no_actions';

        const sheet = sheetName || 'default';

        return `${fingerprint}_${actionsHash}_${sheet}`;
    }

    /**
     * Simple hash function for cache key
     */
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get cached step result by key
     */
    async function getCachedStep(key) {
        if (!cacheDB) await openCacheDB();
        if (!cacheDB) return null;

        return new Promise((resolve) => {
            try {
                const tx = cacheDB.transaction(CACHE_STORE_NAME, 'readonly');
                const store = tx.objectStore(CACHE_STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        // Check if expired
                        const age = Date.now() - (result.timestamp || 0);
                        if (age < CACHE_MAX_AGE_MS) {
                            console.log('[MacroPipeline] Cache HIT:', key);
                            resolve(result.data);
                        } else {
                            console.log('[MacroPipeline] Cache EXPIRED:', key);
                            resolve(null);
                        }
                    } else {
                        console.log('[MacroPipeline] Cache MISS:', key);
                        resolve(null);
                    }
                };

                request.onerror = () => resolve(null);
            } catch (err) {
                console.warn('[MacroPipeline] Cache get error:', err.message);
                resolve(null);
            }
        });
    }

    /**
     * Store step result in cache
     */
    async function setCachedStep(key, data) {
        if (!cacheDB) await openCacheDB();
        if (!cacheDB) return false;

        return new Promise((resolve) => {
            try {
                const tx = cacheDB.transaction(CACHE_STORE_NAME, 'readwrite');
                const store = tx.objectStore(CACHE_STORE_NAME);

                store.put({
                    key: key,
                    data: data,
                    timestamp: Date.now()
                });

                tx.oncomplete = () => {
                    console.log('[MacroPipeline] Cache SET:', key);
                    resolve(true);
                };

                tx.onerror = () => resolve(false);
            } catch (err) {
                console.warn('[MacroPipeline] Cache set error:', err.message);
                resolve(false);
            }
        });
    }

    /**
     * Clear all cached steps
     */
    function clearAllCache() {
        if (!cacheDB) {
            console.log('[MacroPipeline] No cache DB to clear');
            return;
        }

        try {
            const tx = cacheDB.transaction(CACHE_STORE_NAME, 'readwrite');
            const store = tx.objectStore(CACHE_STORE_NAME);
            store.clear();
            console.log('[MacroPipeline] Cache cleared');
            showToast(getText({ tr: 'Önbellek temizlendi', en: 'Cache cleared' }), 'info');
        } catch (err) {
            console.warn('[MacroPipeline] Cache clear error:', err.message);
        }
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    async function run() {
        // FAZ-MS-5: Get file info for cache key
        const fileInput = document.getElementById("fileInput");
        const file = fileInput?.files?.[0];
        const fileInfo = file ? { name: file.name, size: file.size, lastModified: file.lastModified } : null;
        const actions = toReportActions();
        const sheetName = document.getElementById('sheetSelect')?.value || null;
        const cacheKey = generateCacheKey(fileInfo, actions, sheetName);

        // FAZ-MS-5: Check cache first
        const cached = await getCachedStep(cacheKey);
        if (cached) {
            console.log('[MacroPipeline] Using cached result');
            displayResult(cached);
            return;
        }

        // FAZ-D: Call unified API for backend execution
        const unifiedResult = await callUnifiedScenarioAPI();
        if (unifiedResult) {
            console.log('[MacroPipeline] Unified API result:', unifiedResult);
            displayResult(unifiedResult); // FAZ-MS-4: Pass full response for download button

            // FAZ-MS-5: Cache the result
            await setCachedStep(cacheKey, unifiedResult);
            return;
        }

        // Fallback: Local execution
        const result = await executePipeline();
        if (result) {
            console.log('[MacroPipeline] Result:', result);
            displayResult(result);

            // FAZ-MS-5: Cache the result
            await setCachedStep(cacheKey, result);
        }
    }

    /**
     * FAZ-D: Convert macro blocks to report action format
     * Maps block types to custom_report_builder_pro action types
     */
    function toReportActions() {
        const typeMapping = {
            'data_source': 'data_source',
            'filter': 'filter',
            'computed': 'computed',
            'formula': 'computed',
            'text_transform': 'computed',
            'advanced_computed': 'computed',
            'grouping': 'grouping',
            'pivot': 'pivot',
            'window_function': 'window',
            'time_series': 'computed',
            'sort': 'sort',
            'remove_duplicates': 'filter',
            'chart': 'chart',
            'conditional_format': 'conditional_format',
            'output_settings': 'output'
        };

        const actions = PIPELINE_STATE.blocks.map(block => {
            const backendType = typeMapping[block.type] || block.type;
            const config = block.config;
            const action = { type: backendType };

            switch (block.type) {
                case 'filter':
                    action.column = config.column;
                    action.operator = config.operator;
                    action.value = config.value;
                    break;

                case 'computed':
                    action.ctype = 'arithmetic';
                    action.name = config.name;
                    action.columns = config.columns;
                    action.operation = config.operation;
                    break;

                case 'formula':
                    action.ctype = 'formula';
                    action.name = config.name;
                    action.formula = config.expression;
                    break;

                case 'text_transform':
                    action.ctype = 'text_transform';
                    action.name = config.output_name || config.column;
                    action.source_column = config.column;
                    action.transform_type = config.transform_type;
                    break;

                case 'grouping':
                    action.groups = config.group_by || [];
                    action.aggregations = (config.aggregations || []).map(agg => ({
                        column: agg.column,
                        func: agg.func,
                        alias: agg.column + '_' + agg.func
                    }));
                    break;

                case 'pivot':
                    action.rows = config.rows;
                    action.columns = config.columns;
                    action.values = (config.values || []).map(v => ({
                        column: v,
                        aggfunc: config.agg || 'sum'
                    }));
                    break;

                case 'window_function':
                    action.wf_type = config.window_type;
                    action.order_by = config.value_column;
                    action.partition_by = config.partition_by || [];
                    break;

                case 'sort':
                    action.column = config.column;
                    action.direction = config.order || 'asc';
                    break;

                case 'remove_duplicates':
                    action.type = 'filter';
                    action.filter_type = 'remove_duplicates';
                    action.columns = config.columns;
                    break;

                case 'output_settings':
                    action.output_type = config.output_type || 'single_sheet';
                    action.freeze_header = config.freeze_header !== false;
                    action.auto_fit_columns = config.auto_fit_columns !== false;
                    break;

                default:
                    Object.assign(action, config);
            }

            return action;
        });

        return actions;
    }

    /**
     * FAZ-D: Call unified scenario API for backend execution
     */
    async function callUnifiedScenarioAPI() {
        try {
            const fileInput = document.getElementById("fileInput");
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                console.log('[MacroPipeline] No file loaded, skipping unified API');
                return null;
            }

            if (PIPELINE_STATE.blocks.length === 0) {
                console.log('[MacroPipeline] Pipeline empty, skipping unified API');
                return null;
            }

            const actions = toReportActions();
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            // Second file if exists
            const fileInput2 = document.getElementById("fileInput2");
            if (fileInput2 && fileInput2.files && fileInput2.files.length > 0) {
                formData.append('file2', fileInput2.files[0]);
            }

            // Get current mode from MacroStudio
            const macroState = window.MacroStudio?.getState();
            const mode = macroState?.currentMode === 'doctor' ? 'doctor' : 'build';

            // Request JSON  
            const requestJson = {
                scenario_id: 'macro-studio-pro',
                mode: mode,
                input: {
                    data_source: {
                        sheet_name: document.getElementById('sheetSelect')?.value || macroState?.selectedSheet || null,
                        header_row: 0
                    },
                    actions: actions
                },
                options: {
                    preview: true,
                    lang: typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr',
                    row_limit: 100
                }
            };
            formData.append('request_json', JSON.stringify(requestJson));

            console.log('[MacroPipeline] Calling /api/scenario/run with:', requestJson.scenario_id, mode, actions.length, 'actions');

            const response = await fetch('/api/scenario/run', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[MacroPipeline] Unified API response:', result.success ? 'SUCCESS' : 'FAILED');
                if (result.success) {
                    showToast(getText({ tr: 'Pipeline tamamlandı!', en: 'Pipeline complete!' }), 'success');
                    return result;
                }
            } else {
                console.warn('[MacroPipeline] Unified API request failed:', response.status);
            }
            return null;
        } catch (err) {
            console.warn('[MacroPipeline] Unified API error (falling back to local):', err.message);
            return null;
        }
    }

    function displayResult(data) {
        const resultContainer = document.getElementById('macroResultJson');
        const statusContainer = document.getElementById('embeddedMacroStatusMessage');
        if (!resultContainer) return;

        // Check if this is a full API response or just rows array
        const isFullResponse = data && typeof data === 'object' && !Array.isArray(data) && ('success' in data || 'preview_data' in data);

        if (isFullResponse) {
            // Full API response - FAZ-MS-4 Enhanced
            renderFullResult(data, resultContainer, statusContainer);
        } else if (Array.isArray(data)) {
            // Legacy: just rows array
            renderPreviewRows(data, resultContainer);
        } else {
            resultContainer.textContent = getText({ tr: 'Sonuç boş', en: 'Empty result' });
        }
    }

    /**
     * FAZ-MS-4: Render full API response with download button
     */
    function renderFullResult(response, container, statusContainer) {
        const lang = typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr';
        const previewData = response.preview_data;
        const rows = previewData?.rows || [];
        const totalRows = previewData?.total_rows || rows.length;
        const truncated = previewData?.truncated || false;
        const downloadUrl = response.download_url;
        const excelAvailable = response.excel_available;

        // Build result HTML
        let html = '';

        // Status message
        if (statusContainer) {
            statusContainer.innerHTML = `
                <span style="color: var(--gm-success);"><i class="fas fa-check-circle"></i></span>
                ${response.summary || (lang === 'tr' ? 'İşlem tamamlandı' : 'Operation complete')}
            `;
        }

        // Download/Share buttons
        if (excelAvailable && downloadUrl) {
            html += `
                <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <a href="${downloadUrl}" class="gm-pill-btn" style="background: linear-gradient(135deg, #10b981, #059669); text-decoration: none;">
                        <i class="fas fa-download"></i> ${lang === 'tr' ? 'Excel İndir' : 'Download Excel'}
                    </a>
                    <button class="gm-pill-btn" onclick="MacroPipeline.shareResult()" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                        <i class="fas fa-share-alt"></i> ${lang === 'tr' ? 'Paylaş' : 'Share'}
                    </button>
                </div>
            `;
        }

        // Preview info
        const truncatedMsg = truncated
            ? `<span style="color: var(--gm-warning);"><i class="fas fa-exclamation-triangle"></i> ${lang === 'tr' ? `İlk ${rows.length} satır gösteriliyor (toplam: ${totalRows})` : `Showing first ${rows.length} rows (total: ${totalRows})`}</span>`
            : `<span style="color: var(--gm-text-muted);">${totalRows} ${lang === 'tr' ? 'satır' : 'rows'}</span>`;

        html += `<div style="margin-bottom: 8px; font-size: 0.85rem;">${truncatedMsg}</div>`;

        // Preview table (first 10 rows max for display)
        if (rows.length > 0) {
            const displayRows = rows.slice(0, 10);
            const columns = previewData?.columns || Object.keys(displayRows[0] || {});

            html += `<div style="overflow-x: auto; max-height: 200px; overflow-y: auto;">`;
            html += `<table class="gm-preview-table" style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">`;
            html += `<thead><tr>`;
            columns.forEach(col => {
                html += `<th style="padding: 4px 8px; background: var(--gm-bg-alt); border: 1px solid var(--gm-border); white-space: nowrap;">${col}</th>`;
            });
            html += `</tr></thead>`;
            html += `<tbody>`;
            displayRows.forEach(row => {
                html += `<tr>`;
                columns.forEach(col => {
                    const val = row[col];
                    html += `<td style="padding: 4px 8px; border: 1px solid var(--gm-border); white-space: nowrap;">${val !== null && val !== undefined ? val : ''}</td>`;
                });
                html += `</tr>`;
            });
            html += `</tbody></table></div>`;

            if (displayRows.length < rows.length) {
                html += `<div style="font-size: 0.75rem; color: var(--gm-text-muted); margin-top: 4px;">... ${lang === 'tr' ? 've' : 'and'} ${rows.length - displayRows.length} ${lang === 'tr' ? 'satır daha' : 'more rows'}</div>`;
            }
        }

        container.innerHTML = html;
        showToast(getText({ tr: 'Pipeline tamamlandı!', en: 'Pipeline complete!' }), 'success');
    }

    /**
     * Legacy: Render just rows array
     */
    function renderPreviewRows(rows, container) {
        if (!rows || rows.length === 0) {
            container.textContent = getText({ tr: 'Sonuç boş', en: 'Empty result' });
            return;
        }

        // Show preview of first 10 rows as JSON
        const preview = rows.slice(0, 10);
        container.textContent = JSON.stringify(preview, null, 2);
        showToast(getText({ tr: 'Sonuç:', en: 'Result:' }) + ` ${rows.length} ${getText({ tr: 'satır', en: 'rows' })}`, 'success');
    }

    /**
     * FAZ-MS-4: Share result via share endpoint
     */
    async function shareResult() {
        const lang = typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr';
        try {
            const response = await fetch('/share/macro-studio-pro?format=xlsx', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                if (data.share_url) {
                    await navigator.clipboard.writeText(data.share_url);
                    showToast(lang === 'tr' ? 'Paylaşım linki kopyalandı!' : 'Share link copied!', 'success');
                }
            } else {
                showToast(lang === 'tr' ? 'Paylaşım hatası' : 'Share error', 'error');
            }
        } catch (err) {
            console.error('[MacroPipeline] Share error:', err);
            showToast(lang === 'tr' ? 'Paylaşım hatası' : 'Share error', 'error');
        }
    }

    function clearPipeline() {
        PIPELINE_STATE.blocks = [];
        PIPELINE_STATE.selectedBlockId = null;
        clearAllCache();
        renderPipeline();
        renderSettings();
    }

    function init() {
        console.log('[MacroPipeline] Initializing...');
        openCacheDB();
        renderPalette();
        renderPipeline();
        renderSettings();
        setupDropHandlers();
        console.log('[MacroPipeline] Initialized');
    }

    /**
     * Toggle category accordion expansion
     * @param {string} categoryId - ID of category to toggle
     */
    function toggleCategory(categoryId) {
        const category = document.querySelector(`.vb-palette-category[data-category="${categoryId}"]`);
        if (category) {
            category.classList.toggle('expanded');
        }
    }

    /**
     * Set cached step data (FAZ-MS-5)
     * @param {string} hash - Cache key hash
     * @param {any} data - Data to cache
     */
    async function setCachedStep(hash, data) {
        return cacheStep(hash, data);
    }

    /**
     * Generate cache key for pipeline state (FAZ-MS-5)
     * @param {Array} blocks - Pipeline blocks
     * @returns {string} Cache key hash
     */
    function generateCacheKey(blocks) {
        return generateStepHash(blocks || PIPELINE_STATE.blocks);
    }

    /**
     * Setup drop handlers on canvas - called once during init
     * Uses event delegation to persist across innerHTML changes
     */
    function setupDropHandlers() {
        const canvas = document.getElementById('macroPipelineCanvas');
        if (!canvas || PIPELINE_STATE.dropHandlerAttached) return;

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            canvas.classList.add('drag-over');
        });

        canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            canvas.classList.remove('drag-over');
            const blockType = e.dataTransfer.getData('text/plain');
            console.log('[MacroPipeline] Drop event, blockType:', blockType);
            if (blockType && MACRO_BLOCK_TYPES[blockType]) {
                addBlock(blockType);
            }
        });

        PIPELINE_STATE.dropHandlerAttached = true;
        console.log('[MacroPipeline] Drop handlers setup complete');
    }

    function showToast(msg, type, duration) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type, duration);
        } else {
            console.log(`[Toast] ${type}: ${msg}`);
        }
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.MacroPipeline = {
        init,
        run,
        addBlock,
        removeBlock,
        moveBlock,
        selectBlock,
        clearPipeline,
        toggleCategory,
        getState: () => PIPELINE_STATE,
        getBlockTypes: () => MACRO_BLOCK_TYPES,
        getCachedStep,
        setCachedStep,     // FAZ-MS-5
        generateCacheKey,  // FAZ-MS-5
        clearAllCache,
        shareResult        // FAZ-MS-4
    };

})();
