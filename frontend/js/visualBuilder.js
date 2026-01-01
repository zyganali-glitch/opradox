/**
 * Visual Query Builder - Opradox Excel Studio
 * custom_report_builder_pro.py motoruyla entegre görsel rapor oluşturucu
 * 
 * @version 1.0.0
 * @author Opradox Team
 */

console.log("🎨 Visual Builder Module loaded");

// NOTE: showToast is now provided globally by app.js (Unified Toast System)
// Old local toast function removed - see app.js window.showToast


const VisualBuilder = {
    // ===== STATE =====
    blocks: [],              // Kullanıcının eklediği bloklar
    selectedBlockId: null,   // Seçili blok ID'si
    blockIdCounter: 0,       // Benzersiz blok ID'leri için sayaç

    // ===== BLOK TİPLERİ (custom_report_builder_pro.py'dan - TAM KAPSAMLI) =====
    blockTypes: {
        // ===== VERİ KAYNAĞI BLOKLARI =====
        data_source: {
            name: { tr: "📁 Veri Kaynağı", en: "📁 Data Source" },
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

        // ===== LOOKUP & JOIN BLOKLARI (İKİNCİ DOSYA DESTEĞİ) =====
        lookup_join: {
            name: { tr: "🔗 VLOOKUP / Birleştir", en: "🔗 VLOOKUP / Join" },
            icon: "fa-link",
            color: "#4a90d9",
            description: { tr: "İki tabloyu birleştir (VLOOKUP/Merge)", en: "Join two tables" },
            category: "join",
            joinTypes: [
                { value: "vlookup", label: { tr: "VLOOKUP (Eşleşen değerleri getir)", en: "VLOOKUP (Fetch matching values)" } },
                { value: "left", label: { tr: "Sol Birleşim (Tüm ana tablo + eşleşenler)", en: "Left Join" } },
                { value: "inner", label: { tr: "İç Birleşim (Sadece eşleşenler)", en: "Inner Join" } },
                { value: "outer", label: { tr: "Dış Birleşim (Tümü)", en: "Outer Join" } },
                { value: "cross_sheet", label: { tr: "Aynı Dosyadan Farklı Sayfa", en: "Cross-Sheet (Same File)" } }
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
                { value: "concat", label: { tr: "Metin Birleştir", en: "Concatenate" } },
                { value: "date_diff", label: { tr: "Tarih Farkı (Gün)", en: "Date Diff (Days)" } },
                { value: "running_total", label: { tr: "Kümülatif Toplam", en: "Running Total" } },
                { value: "moving_avg", label: { tr: "Hareketli Ortalama", en: "Moving Average" } },
                { value: "growth_rate", label: { tr: "Büyüme Oranı (%)", en: "Growth Rate (%)" } }
            ]
        },

        // ===== ZAMAN SERİSİ BLOKLARI =====
        time_series: {
            name: { tr: "📅 Zaman Serisi", en: "📅 Time Series" },
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

        // ===== WINDOW FONKSİYONLARI =====
        window_function: {
            name: { tr: "🏆 Sıralama/Rank", en: "🏆 Ranking" },
            icon: "fa-trophy",
            color: "#f97316",
            description: { tr: "RANK, Dense Rank, Lead/Lag", en: "RANK, Dense Rank, Lead/Lag" },
            category: "analysis",
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

        // ===== PİVOT TABLO =====
        pivot: {
            name: { tr: "Pivot Tablo", en: "Pivot Table" },
            icon: "fa-table-cells",
            color: "#8b5cf6",
            description: { tr: "Özet tablo oluştur", en: "Create summary table" },
            category: "analysis",
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
                { value: "scatter", label: { tr: "Dağılım", en: "Scatter" } },
                { value: "radar", label: { tr: "Radar Grafik", en: "Radar Chart" } }
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

        // ===== ÇIKTI AYARLARI =====
        output_settings: {
            name: { tr: "⚙️ Çıktı Ayarları", en: "⚙️ Output Settings" },
            icon: "fa-cog",
            color: "#64748b",
            description: { tr: "Excel çıktı seçenekleri", en: "Excel output options" },
            category: "output"
        },

        // ===== YENİ: UNION (Alt Alta Birleştir) =====
        union: {
            name: { tr: "📋 Alt Alta Birleştir", en: "📋 Union (Append)" },
            icon: "fa-layer-group",
            color: "#0ea5e9",
            description: { tr: "İki tabloyu alt alta ekle", en: "Append two tables" },
            category: "join"
        },

        // ===== YENİ: DIFF (Fark Bul) =====
        diff: {
            name: { tr: "🔍 Fark Bul", en: "🔍 Find Difference" },
            icon: "fa-not-equal",
            color: "#ef4444",
            description: { tr: "Ana dosyada olup ikincide olmayan", en: "Records only in main file" },
            category: "join"
        },

        // ===== YENİ: VALIDATE (Doğrula) =====
        validate: {
            name: { tr: "✅ Doğrula", en: "✅ Validate" },
            icon: "fa-check-double",
            color: "#22c55e",
            description: { tr: "Referans listeden doğrula", en: "Validate against reference" },
            category: "join"
        },

        // ===== YENİ: GROUPING (Gruplama ve Toplama) =====
        grouping: {
            name: { tr: "📊 Grupla ve Topla", en: "📊 Group & Aggregate" },
            icon: "fa-object-group",
            color: "#6366f1",
            description: { tr: "Gruplama ve toplama işlemleri", en: "Group by and aggregate" },
            category: "analysis",
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

        // ===== YENİ: TEXT TRANSFORM (Metin Dönüştürme) =====
        text_transform: {
            name: { tr: "📝 Metin Dönüştür", en: "📝 Text Transform" },
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

        // ===== YENİ: ADVANCED COMPUTED (İleri Hesaplamalar) =====
        advanced_computed: {
            name: { tr: "🧮 İleri Hesaplama", en: "🧮 Advanced Calculation" },
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
                { value: "correlation", label: { tr: "Korelasyon", en: "Correlation" } },
                { value: "extract_year", label: { tr: "Yıl Çıkar", en: "Extract Year" } },
                { value: "extract_month", label: { tr: "Ay Çıkar", en: "Extract Month" } },
                { value: "extract_day", label: { tr: "Gün Çıkar", en: "Extract Day" } },
                { value: "extract_week", label: { tr: "Hafta Çıkar", en: "Extract Week" } }
            ]
        },

        // ===== YENİ: IF-ELSE (Koşullu Değer) =====
        if_else: {
            name: { tr: "🔀 Koşullu Değer", en: "🔀 If-Else" },
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

        // ===== YENİ: FORMULA (Serbest Formül) =====
        formula: {
            name: { tr: "📐 Formül", en: "📐 Formula" },
            icon: "fa-superscript",
            color: "#0891b2",
            description: { tr: "Serbest formül yazın (ör: A/B*100)", en: "Write free formula" },
            category: "transform"
        },

        // ===== YENİ: WHAT-IF VARIABLE (Senaryo Değişkeni) =====
        what_if_variable: {
            name: { tr: "🎯 Senaryo Değişkeni", en: "🎯 What-If Variable" },
            icon: "fa-sliders",
            color: "#7c3aed",
            description: { tr: "What-If analizi için değişken tanımla", en: "Define variable for What-If" },
            category: "analysis"
        }
    },

    // ===== INITIALIZATION =====
    init() {
        console.log("🎨 VisualBuilder.init()");
        this.blocks = [];
        this.selectedBlockId = null;
        this.blockIdCounter = 0;

        this.renderPalette();
        this.renderCanvas();
        this.renderSettings();
        this.setupEventListeners();
    },

    // ===== LANGUAGE HELPER =====
    getText(obj) {
        const lang = typeof CURRENT_LANG !== 'undefined' ? CURRENT_LANG : 'tr';
        return obj[lang] || obj['tr'] || obj;
    },

    // ===== RENDER PALETTE (Sol Panel - Blok Listesi) =====
    renderPalette() {
        const palette = document.getElementById("vbPalette");
        if (!palette) return;

        let html = `<h3 class="vb-palette-title"><i class="fas fa-cubes"></i> ${this.getText({ tr: "Blok Paleti", en: "Block Palette" })}</h3>`;
        html += `<div class="vb-palette-blocks">`;

        Object.entries(this.blockTypes).forEach(([type, config]) => {
            const tooltipText = this.getText(config.name) + '\n' + this.getText(config.description);
            html += `
                <div class="vb-palette-block" draggable="true" data-block-type="${type}" title="${tooltipText}">
                    <div class="vb-palette-icon" data-color="${config.color}">
                        <i class="fas ${config.icon}"></i>
                    </div>
                    <div class="vb-palette-info">
                        <span class="vb-palette-name">${this.getText(config.name)}</span>
                        <span class="vb-palette-desc">${this.getText(config.description)}</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        palette.innerHTML = html;

        // Palette blokları için drag events
        palette.querySelectorAll(".vb-palette-block").forEach(block => {
            block.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", block.dataset.blockType);
                block.classList.add("dragging");
            });
            block.addEventListener("dragend", () => {
                block.classList.remove("dragging");
            });
            // Mobil için tıkla-ekle
            block.addEventListener("click", () => {
                this.addBlock(block.dataset.blockType);
            });
        });
    },

    // ===== RENDER CANVAS (Orta Panel - İşlem Zinciri) =====
    renderCanvas() {
        const canvas = document.getElementById("vbCanvas");
        if (!canvas) return;

        if (this.blocks.length === 0) {
            canvas.innerHTML = `
                <div class="vb-canvas-empty">
                    <i class="fas fa-arrow-left"></i>
                    <p>${this.getText({ tr: "Soldan blok sürükleyin veya tıklayın", en: "Drag or click blocks from left" })}</p>
                </div>
            `;
            return;
        }

        let html = `<div class="vb-pipeline">`;

        this.blocks.forEach((block, index) => {
            const config = this.blockTypes[block.type];
            const isSelected = block.id === this.selectedBlockId;

            html += `
                <div class="vb-block ${isSelected ? 'selected' : ''}" 
                     data-block-id="${block.id}" 
                     draggable="true">
                    <div class="vb-block-header" style="border-left-color:${config.color};">
                        <div class="vb-block-icon" style="background:${config.color};">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <div class="vb-block-title">
                            <span class="vb-block-type">${this.getText(config.name)}</span>
                            <span class="vb-block-summary">${this.getBlockSummary(block)}</span>
                        </div>
                        <div class="vb-block-actions">
                            <button class="vb-btn-move-up" title="${this.getText({ tr: "Yukarı", en: "Up" })}" ${index === 0 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="vb-btn-move-down" title="${this.getText({ tr: "Aşağı", en: "Down" })}" ${index === this.blocks.length - 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <button class="vb-btn-delete" title="${this.getText({ tr: "Sil", en: "Delete" })}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Bloklar arası bağlantı oku
            if (index < this.blocks.length - 1) {
                html += `<div class="vb-connector"><i class="fas fa-arrow-down"></i></div>`;
            }
        });

        html += `</div>`;

        // Çalıştır butonu
        html += `
            <div class="vb-canvas-footer">
                <button class="gm-gradient-btn vb-run-btn" onclick="VisualBuilder.run()">
                    <i class="fas fa-play"></i> ${this.getText({ tr: "Çalıştır", en: "Run" })}
                </button>
            </div>
        `;

        canvas.innerHTML = html;

        // Canvas blokları için event listeners
        canvas.querySelectorAll(".vb-block").forEach(blockEl => {
            const blockId = parseInt(blockEl.dataset.blockId);

            blockEl.addEventListener("click", (e) => {
                if (!e.target.closest(".vb-block-actions")) {
                    this.selectBlock(blockId);
                }
            });

            blockEl.querySelector(".vb-btn-delete")?.addEventListener("click", () => {
                this.removeBlock(blockId);
            });

            blockEl.querySelector(".vb-btn-move-up")?.addEventListener("click", () => {
                this.moveBlock(blockId, -1);
            });

            blockEl.querySelector(".vb-btn-move-down")?.addEventListener("click", () => {
                this.moveBlock(blockId, 1);
            });
        });
    },

    // ===== RENDER SETTINGS (Sağ Panel - Blok Ayarları) =====
    renderSettings() {
        const settings = document.getElementById("vbSettings");
        if (!settings) return;

        if (!this.selectedBlockId) {
            settings.innerHTML = `
                <div class="vb-settings-empty">
                    <i class="fas fa-sliders"></i>
                    <p>${this.getText({ tr: "Ayarları görmek için blok seçin", en: "Select a block to see settings" })}</p>
                </div>
            `;
            return;
        }

        const block = this.blocks.find(b => b.id === this.selectedBlockId);
        if (!block) return;

        const config = this.blockTypes[block.type];
        let html = `
            <div class="vb-settings-header">
                <div class="vb-settings-icon" style="background:${config.color};">
                    <i class="fas ${config.icon}"></i>
                </div>
                <h3>${this.getText(config.name)}</h3>
            </div>
            <div class="vb-settings-body">
        `;

        // Blok tipine göre ayar formları
        html += this.renderBlockSettings(block);

        html += `</div>`;
        settings.innerHTML = html;

        // Settings form değişikliklerini dinle (input, select, textarea)
        settings.querySelectorAll("input, select, textarea").forEach(input => {
            const handler = (e) => {
                let value;
                const target = e.target;

                // Handle different input types properly
                if (target.type === 'checkbox') {
                    // Checkbox: use checked property, not value
                    value = target.checked;
                } else if (target.multiple) {
                    // Multi-select: get array of selected values
                    value = Array.from(target.selectedOptions).map(o => o.value);
                } else if (target.type === 'number') {
                    // Number fields: parse as float
                    value = target.value ? parseFloat(target.value) : null;
                } else {
                    // Text, select, textarea: use value
                    value = target.value;
                }

                // Hibrit sütun seçici mantığı:
                // Eğer bu bir _manual suffix'li input ise, asıl field adını bul
                let fieldName = target.name;
                if (fieldName && fieldName.endsWith('_manual')) {
                    const baseFieldName = fieldName.replace('_manual', '');
                    // Manuel değer varsa, dropdown'u geçersiz kıl
                    if (value && value.trim()) {
                        this.updateBlockConfig(this.selectedBlockId, baseFieldName, value.trim());
                        // Dropdown'ı temizle
                        const dropdown = settings.querySelector(`[name="${baseFieldName}"]`);
                        if (dropdown) dropdown.value = '';
                    }
                    return; // Manuel input işlendi, çık
                }

                // Dropdown değiştiğinde manuel alanı temizle (hibrit senkronizasyon)
                const manualInput = settings.querySelector(`[name="${fieldName}_manual"]`);
                if (manualInput && value) {
                    manualInput.value = '';
                }

                this.updateBlockConfig(this.selectedBlockId, target.name, value);
            };

            // Listen to change event for all
            input.addEventListener("change", handler);

            // Also listen to input event for textarea and manual inputs (real-time updates)
            if (input.tagName === 'TEXTAREA' || input.classList.contains('vb-manual-input')) {
                input.addEventListener("input", handler);
            }
        });
    },

    // ===== BLOK AYAR FORMLARI =====
    renderBlockSettings(block) {
        const config = this.blockTypes[block.type];
        const baseColumns = typeof FILE_COLUMNS !== 'undefined' ? FILE_COLUMNS : [];
        const columns2 = typeof FILE2_COLUMNS !== 'undefined' ? FILE2_COLUMNS : [];
        const sheets = typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : [];
        // Crosssheet için dinamik sütunlar (sayfa seçildiğinde güncellenir)
        const crosssheetColumns = typeof CROSSSHEET_COLUMNS !== 'undefined' ? CROSSSHEET_COLUMNS : [];

        // Pipeline'daki data_source bloğuna bak - crosssheet seçilmişse o sütunları kullan
        let columns = baseColumns;
        const dataSourceBlock = this.blocks.find(b => b.type === 'data_source');
        if (dataSourceBlock && dataSourceBlock.config.source_type === 'cross_sheet' && crosssheetColumns.length > 0) {
            columns = crosssheetColumns;
        }

        let html = '';

        switch (block.type) {
            // ===== VERİ KAYNAĞI =====
            case 'data_source':
                html += this.renderSelect("source_type", block.config.source_type, [
                    { value: "main", label: { tr: "Ana Dosya", en: "Main File" } },
                    { value: "second", label: { tr: "İkinci Dosya", en: "Second File" } },
                    { value: "cross_sheet", label: { tr: "Aynı Dosyadan Farklı Sayfa", en: "Cross-Sheet" } }
                ], { tr: "Kaynak Tipi", en: "Source Type" });
                if (block.config.source_type === 'cross_sheet' && sheets.length > 0) {
                    html += this.renderSelect("sheet_name", block.config.sheet_name,
                        sheets.map(s => ({ value: s, label: s })),
                        { tr: "Sayfa Seçimi", en: "Sheet Selection" });
                    // Crosssheet sütunları yüklendiyse göster
                    if (crosssheetColumns.length > 0) {
                        html += `<div class="vb-form-section" style="font-size:0.75rem;color:var(--gm-primary);">
                            ✅ ${crosssheetColumns.length} ${this.getText({ tr: "sütun yüklendi", en: "columns loaded" })}
                        </div>`;
                    }
                }
                break;

            // ===== LOOKUP & JOIN =====
            case 'lookup_join':
                html += this.renderSelect("join_type", block.config.join_type, config.joinTypes, { tr: "Birleştirme Tipi", en: "Join Type" });
                html += `<div class="vb-form-section"><strong>${this.getText({ tr: "Ana Tablo", en: "Main Table" })}</strong></div>`;
                html += this.renderColumnSelect("main_key", block.config.main_key, columns, { tr: "Anahtar Sütun", en: "Key Column" });
                html += `<div class="vb-form-section"><strong>${this.getText({ tr: "Kaynak Tablo", en: "Source Table" })}</strong></div>`;
                html += this.renderSelect("source_type", block.config.source_type, [
                    { value: "second_file", label: { tr: "İkinci Dosya", en: "Second File" } },
                    { value: "same_file_sheet", label: { tr: "Aynı Dosya - Farklı Sayfa", en: "Same File - Different Sheet" } }
                ], { tr: "Kaynak", en: "Source" });

                // Crosssheet seçiliyse sayfa listesi göster
                if (block.config.source_type === 'same_file_sheet' && sheets.length > 0) {
                    html += this.renderSelect("source_sheet", block.config.source_sheet,
                        sheets.map(s => ({ value: s, label: s })),
                        { tr: "Sayfa", en: "Sheet" });
                }

                // Kaynak sütunları: Crosssheet seçiliyse ve sütunlar yüklendiyse crosssheet sütunlarını kullan
                const sourceColumns = (block.config.source_type === 'same_file_sheet' && crosssheetColumns.length > 0)
                    ? crosssheetColumns
                    : (columns2.length > 0 ? columns2 : columns);

                html += this.renderColumnSelect("source_key", block.config.source_key, sourceColumns, { tr: "Eşleşme Sütunu", en: "Match Column" });
                html += this.renderColumnSelect("fetch_columns", block.config.fetch_columns, sourceColumns, { tr: "Getirilecek Sütunlar", en: "Columns to Fetch" }, true);

                // Bilgi mesajı
                if (block.config.source_type === 'same_file_sheet') {
                    if (crosssheetColumns.length > 0) {
                        html += `<div class="vb-form-section" style="font-size:0.75rem;color:var(--gm-success);">
                            ✅ ${crosssheetColumns.length} ${this.getText({ tr: "sütun yüklendi", en: "columns loaded" })}
                        </div>`;
                    } else if (block.config.source_sheet) {
                        html += `<div class="vb-form-section" style="font-size:0.75rem;color:var(--gm-warning);">
                            ⏳ ${this.getText({ tr: "Sayfa sütunları yükleniyor...", en: "Loading sheet columns..." })}
                        </div>`;
                    }
                }
                break;

            // ===== FİLTRE =====
            case 'filter':
                html += this.renderColumnSelect("column", block.config.column, columns, { tr: "Sütun", en: "Column" });
                html += this.renderSelect("operator", block.config.operator, config.operators, { tr: "Operatör", en: "Operator" });
                html += this.renderInput("value", block.config.value, { tr: "Değer", en: "Value" });
                break;

            // ===== HESAPLAMA =====
            case 'computed':
                html += this.renderInput("name", block.config.name, { tr: "Yeni Sütun Adı", en: "New Column Name" });
                html += this.renderColumnSelect("columns", block.config.columns, columns, { tr: "Kaynak Sütunlar", en: "Source Columns" }, true);
                html += this.renderSelect("operation", block.config.operation, config.operations, { tr: "İşlem", en: "Operation" });
                // Hareketli ortalama için pencere boyutu
                if (block.config.operation === 'moving_avg') {
                    html += this.renderInput("window_size", block.config.window_size || 3, { tr: "Pencere Boyutu", en: "Window Size" });
                }
                break;

            // ===== ZAMAN SERİSİ =====
            case 'time_series':
                html += this.renderSelect("analysis_type", block.config.analysis_type, config.analysisTypes, { tr: "Analiz Tipi", en: "Analysis Type" });
                html += this.renderColumnSelect("date_column", block.config.date_column, columns, { tr: "Tarih Sütunu", en: "Date Column" });
                html += this.renderColumnSelect("value_column", block.config.value_column, columns, { tr: "Değer Sütunu", en: "Value Column" });
                html += this.renderInput("output_name", block.config.output_name, { tr: "Çıktı Sütun Adı", en: "Output Column Name" });
                break;

            // ===== WINDOW FONKSİYONLARI =====
            case 'window_function':
                html += this.renderSelect("window_type", block.config.window_type, config.windowTypes, { tr: "Fonksiyon", en: "Function" });
                html += this.renderColumnSelect("value_column", block.config.value_column, columns, { tr: "Değer Sütunu (Sıralama için)", en: "Value Column (for ordering)" });

                // YENİ: Sıralama yönü (ascending/descending)
                html += this.renderSelect("direction", block.config.direction || "desc", [
                    { value: "asc", label: { tr: "Artan (Küçükten Büyüğe → 1=En Düşük)", en: "Ascending (Lowest = 1)" } },
                    { value: "desc", label: { tr: "Azalan (Büyükten Küçüğe → 1=En Yüksek)", en: "Descending (Highest = 1)" } }
                ], { tr: "Sıralama Yönü", en: "Sort Direction" });

                // YENİ: Çoklu partition_by (grup bazlı rank için)
                html += this.renderColumnSelect("partition_by", block.config.partition_by, columns,
                    { tr: "Gruplama Sütunları (Opsiyonel - Grup Bazlı Rank)", en: "Partition By (Optional - Group-based Rank)" }, true);

                // YENİ: ntile için N değeri
                if (block.config.window_type === 'ntile') {
                    html += this.renderInput("ntile_n", block.config.ntile_n || 4,
                        { tr: "Kaç Gruba Böl (N)", en: "Number of Buckets (N)" });
                }

                // Çıktı sütun adı
                html += this.renderInput("output_name", block.config.output_name, { tr: "Çıktı Sütun Adı", en: "Output Column Name" });

                // YENİ: Manuel sütun girişi için ipucu
                html += `<div class="vb-form-hint" style="font-size:0.7rem; color:var(--gm-text-muted); margin-top:8px; padding:8px; background:var(--gm-bg); border-radius:4px;">
                    💡 ${this.getText({
                    tr: "İpucu: Önceki blokta oluşturduğunuz sütunları kullanmak için Değer Sütununu manuel yazabilirsiniz.",
                    en: "Tip: You can manually type column names created in previous blocks."
                })}
                </div>`;
                break;

            // ===== PİVOT =====
            case 'pivot':
                html += this.renderColumnSelect("rows", block.config.rows, columns, { tr: "Satır Alanları", en: "Row Fields" }, true);
                html += this.renderColumnSelect("columns", block.config.columns, columns, { tr: "Sütun Alanları (Opsiyonel)", en: "Column Fields" }, true);
                html += this.renderColumnSelect("values", block.config.values, columns, { tr: "Değer Alanları", en: "Value Fields" }, true);
                html += this.renderSelect("aggregation", block.config.aggregation, config.aggregations, { tr: "Toplama", en: "Aggregation" });
                html += this.renderSelect("percent_type", block.config.percent_type, config.percentTypes, { tr: "Yüzde Tipi", en: "Percent Type" });
                html += this.renderCheckbox("show_totals", block.config.show_totals, { tr: "Genel Toplam Göster", en: "Show Grand Total" });
                break;

            // ===== GRAFİK =====
            case 'chart':
                html += this.renderSelect("chart_type", block.config.chart_type, config.chartTypes, { tr: "Grafik Tipi", en: "Chart Type" });
                html += this.renderColumnSelect("x_column", block.config.x_column, columns, { tr: "X Ekseni", en: "X Axis" });
                html += this.renderColumnSelect("y_columns", block.config.y_columns, columns, { tr: "Y Ekseni (Çoklu Seçilebilir)", en: "Y Axis" }, true);
                html += this.renderInput("title", block.config.title, { tr: "Başlık", en: "Title" });
                html += this.renderCheckbox("show_legend", block.config.show_legend, { tr: "Gösterge Göster", en: "Show Legend" });
                break;

            // ===== SIRALAMA =====
            case 'sort':
                html += this.renderColumnSelect("column", block.config.column, columns, { tr: "Sıralama Sütunu", en: "Sort Column" });
                html += this.renderSelect("order", block.config.order, [
                    { value: "asc", label: { tr: "Artan (A→Z)", en: "Ascending" } },
                    { value: "desc", label: { tr: "Azalan (Z→A)", en: "Descending" } }
                ], { tr: "Sıra", en: "Order" });
                break;

            // ===== KOŞULLU FORMAT =====
            case 'conditional_format':
                html += this.renderColumnSelect("column", block.config.column, columns, { tr: "Sütun", en: "Column" });
                html += this.renderSelect("cf_type", block.config.cf_type, config.formatTypes, { tr: "Format Tipi", en: "Format Type" });
                if (['threshold', 'top_n', 'bottom_n'].includes(block.config.cf_type)) {
                    html += this.renderInput("threshold_value", block.config.threshold_value || 10, { tr: "Eşik/N Değeri", en: "Threshold/N Value" });
                }
                break;

            // ===== ÇIKTI AYARLARI =====
            case 'output_settings':
                html += this.renderCheckbox("freeze_header", block.config.freeze_header, { tr: "Başlık Satırını Dondur", en: "Freeze Header Row" });
                html += this.renderCheckbox("auto_fit_columns", block.config.auto_fit_columns, { tr: "Sütun Genişliklerini Otomatik Ayarla", en: "Auto-fit Columns" });
                html += this.renderInput("number_format", block.config.number_format, { tr: "Sayı Formatı (örn: #,##0.00)", en: "Number Format" });
                html += this.renderCheckbox("header_style", block.config.header_style, { tr: "Başlık Stilini Uygula", en: "Apply Header Style" });
                break;

            // ===== UNION (Alt Alta Birleştir) =====
            case 'union':
                html += `<div class="vb-form-section"><strong>${this.getText({ tr: "İkinci dosya alt alta eklenir", en: "Second file will be appended" })}</strong></div>`;
                html += this.renderCheckbox("ignore_index", block.config.ignore_index, { tr: "İndeksi Sıfırla", en: "Reset Index" });
                break;

            // ===== DIFF (Fark Bul) =====
            case 'diff':
                html += `<div class="vb-form-section"><strong>${this.getText({ tr: "Ana Tablo", en: "Main Table" })}</strong></div>`;
                html += this.renderColumnSelect("left_on", block.config.left_on, columns, { tr: "Karşılaştırma Sütunu", en: "Compare Column" });
                html += `<div class="vb-form-section"><strong>${this.getText({ tr: "Kaynak Tablo", en: "Source Table" })}</strong></div>`;
                html += this.renderColumnSelect("right_on", block.config.right_on, columns2.length > 0 ? columns2 : columns, { tr: "Eşleşme Sütunu", en: "Match Column" });
                break;

            // ===== VALIDATE (Doğrula) =====
            case 'validate':
                html += this.renderColumnSelect("left_on", block.config.left_on, columns, { tr: "Doğrulanacak Sütun", en: "Column to Validate" });
                html += this.renderColumnSelect("right_on", block.config.right_on, columns2.length > 0 ? columns2 : columns, { tr: "Referans Liste Sütunu", en: "Reference Column" });
                html += this.renderInput("valid_label", block.config.valid_label || "Geçerli", { tr: "Geçerli Etiketi", en: "Valid Label" });
                html += this.renderInput("invalid_label", block.config.invalid_label || "Geçersiz", { tr: "Geçersiz Etiketi", en: "Invalid Label" });
                break;

            // ===== GROUPING (Grupla ve Topla) =====
            case 'grouping':
                html += this.renderColumnSelect("groups", block.config.groups, columns, { tr: "Gruplama Sütunları", en: "Group By Columns" }, true);
                html += `<div class="vb-form-section"><strong>${this.getText({ tr: "Toplama İşlemleri", en: "Aggregations" })}</strong></div>`;
                html += this.renderColumnSelect("agg_column", block.config.agg_column, columns, { tr: "Toplanacak Sütun", en: "Aggregate Column" });
                html += this.renderSelect("agg_func", block.config.agg_func, config.aggregations, { tr: "Toplama Fonksiyonu", en: "Aggregate Function" });
                html += this.renderInput("agg_alias", block.config.agg_alias, { tr: "Sonuç Sütun Adı", en: "Result Column Name" });
                break;

            // ===== TEXT TRANSFORM (Metin Dönüştür) =====
            case 'text_transform':
                html += this.renderColumnSelect("column", block.config.column, columns, { tr: "Kaynak Sütun", en: "Source Column" });
                html += this.renderSelect("transform_type", block.config.transform_type, config.transformTypes, { tr: "Dönüşüm Tipi", en: "Transform Type" });
                html += this.renderInput("output_name", block.config.output_name, { tr: "Çıktı Sütun Adı (boşsa üzerine yazar)", en: "Output Name (empty overwrites)" });
                break;

            // ===== ADVANCED COMPUTED (İleri Hesaplama) =====
            case 'advanced_computed':
                html += this.renderSelect("advanced_type", block.config.advanced_type, config.advancedTypes, { tr: "Hesaplama Tipi", en: "Calculation Type" });
                html += this.renderColumnSelect("column", block.config.column, columns, { tr: "Kaynak Sütun", en: "Source Column" });
                // İkinci sütun gerektiren tipler için
                if (['correlation', 'business_days', 'split'].includes(block.config.advanced_type)) {
                    html += this.renderColumnSelect("column2", block.config.column2, columns, { tr: "İkinci Sütun / Ayraç", en: "Second Column / Separator" });
                }
                if (block.config.advanced_type === 'split') {
                    html += this.renderInput("separator", block.config.separator || ",", { tr: "Ayraç Karakter", en: "Separator" });
                    html += this.renderInput("part_index", block.config.part_index || 0, { tr: "Parça İndeksi (0'dan başlar)", en: "Part Index (0-based)" });
                }
                html += this.renderInput("output_name", block.config.output_name, { tr: "Çıktı Sütun Adı", en: "Output Column Name" });
                break;

            // ===== IF-ELSE (Koşullu Değer) =====
            case 'if_else':
                html += this.renderInput("name", block.config.name, { tr: "Yeni Sütun Adı", en: "New Column Name" });
                html += this.renderColumnSelect("column", block.config.column, columns, { tr: "Koşul Sütunu", en: "Condition Column" });
                html += this.renderSelect("condition", block.config.condition, config.conditionTypes, { tr: "Koşul", en: "Condition" });
                html += this.renderInput("compare_value", block.config.compare_value, { tr: "Karşılaştırma Değeri", en: "Compare Value" });
                html += this.renderInput("true_value", block.config.true_value, { tr: "Doğruysa Değer", en: "If True Value" });
                html += this.renderInput("false_value", block.config.false_value, { tr: "Yanlışsa Değer", en: "If False Value" });
                break;

            // ===== FORMULA (Serbest Formül) =====
            case 'formula':
                html += this.renderInput("name", block.config.name, { tr: "Yeni Sütun Adı", en: "New Column Name" });
                html += `<div class="vb-form-row">
                    <label>${this.getText({ tr: "Formül", en: "Formula" })}</label>
                    <textarea name="formula" class="vb-input" rows="3" placeholder="Örn: Satış / Adet * 100">${block.config.formula || ''}</textarea>
                </div>`;
                html += `<div class="vb-form-section" style="font-size:0.7rem;color:var(--gm-text-muted);">
                    ${this.getText({ tr: "Sütun adlarını olduğu gibi yazın. Operatörler: +, -, *, /, (, )", en: "Use column names as-is. Operators: +, -, *, /, (, )" })}
                </div>`;
                break;

            // ===== WHAT-IF VARIABLE =====
            case 'what_if_variable':
                html += this.renderInput("name", block.config.name, { tr: "Değişken Adı", en: "Variable Name" });
                html += this.renderInput("value", block.config.value, { tr: "Değer", en: "Value" });
                html += `<div class="vb-form-section" style="font-size:0.7rem;color:var(--gm-text-muted);">
                    ${this.getText({ tr: "Formüllerde $DeğişkenAdı şeklinde kullanın", en: "Use as $VariableName in formulas" })}
                </div>`;
                break;
        }

        return html;
    },

    // ===== YARDIMCI RENDER FONKSİYONLARI =====
    renderInput(name, value, label) {
        return `
            <div class="vb-form-row">
                <label>${this.getText(label)}</label>
                <input type="text" name="${name}" value="${value || ''}" class="vb-input">
            </div>
        `;
    },

    renderSelect(name, value, options, label) {
        let html = `
            <div class="vb-form-row">
                <label>${this.getText(label)}</label>
                <select name="${name}" class="vb-select">
        `;
        options.forEach(opt => {
            const selected = opt.value === value ? 'selected' : '';
            html += `<option value="${opt.value}" ${selected}>${this.getText(opt.label)}</option>`;
        });
        html += `</select></div>`;
        return html;
    },

    renderColumnSelect(name, value, columns, label, multiple = false) {
        // Hibrit yapı: Dropdown + Manuel giriş
        // Eğer value dropdown'da yoksa manuel girişe aktarılır
        const isManualEntry = value && !columns.includes(value) && !Array.isArray(value);
        const manualValue = isManualEntry ? value : '';
        const selectValue = isManualEntry ? '' : value;

        let html = `
            <div class="vb-form-row">
                <label>${this.getText(label)}</label>
                <select name="${name}" class="vb-select" ${multiple ? 'multiple' : ''}>
        `;
        if (!multiple) {
            html += `<option value="">-- ${this.getText({ tr: "Seçin", en: "Select" })} --</option>`;
        }
        columns.forEach(col => {
            const selected = multiple ?
                (Array.isArray(selectValue) && selectValue.includes(col) ? 'selected' : '') :
                (col === selectValue ? 'selected' : '');
            html += `<option value="${col}" ${selected}>${col}</option>`;
        });
        html += `</select>`;

        // Manuel giriş alanı (tek seçim için)
        if (!multiple) {
            html += `
                <input type="text" 
                       name="${name}_manual" 
                       value="${manualValue}" 
                       class="vb-input vb-manual-input" 
                       placeholder="${this.getText({ tr: "veya manuel yazın...", en: "or type manually..." })}"
                       style="margin-top:4px; font-size:0.8rem; background:var(--gm-card-bg); border:1px dashed var(--gm-card-border);">
            `;
        }

        html += `</div>`;
        return html;
    },

    renderCheckbox(name, value, label) {
        const checked = value ? 'checked' : '';
        return `
            <div class="vb-form-row vb-checkbox-row">
                <label>
                    <input type="checkbox" name="${name}" ${checked} class="vb-checkbox">
                    <span>${this.getText(label)}</span>
                </label>
            </div>
        `;
    },

    // ===== BLOK İŞLEMLERİ =====
    addBlock(type) {
        const id = ++this.blockIdCounter;
        const block = {
            id,
            type,
            config: this.getDefaultConfig(type)
        };
        this.blocks.push(block);
        this.selectedBlockId = id;
        this.renderCanvas();
        this.renderSettings();

        if (typeof showToast === 'function') {
            const config = this.blockTypes[type];
            showToast(`✅ ${this.getText(config.name)} bloku eklendi`, "success", 2000);
        }
    },

    removeBlock(id) {
        this.blocks = this.blocks.filter(b => b.id !== id);
        if (this.selectedBlockId === id) {
            this.selectedBlockId = null;
        }
        this.renderCanvas();
        this.renderSettings();
    },

    moveBlock(id, direction) {
        const index = this.blocks.findIndex(b => b.id === id);
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.blocks.length) return;

        [this.blocks[index], this.blocks[newIndex]] = [this.blocks[newIndex], this.blocks[index]];
        this.renderCanvas();
    },

    selectBlock(id) {
        this.selectedBlockId = id;
        this.renderCanvas();
        this.renderSettings();
    },

    updateBlockConfig(id, key, value) {
        const block = this.blocks.find(b => b.id === id);
        if (block) {
            block.config[key] = value;

            // Sayfa değişikliğinde sütunları dinamik olarak güncelle
            if ((key === 'sheet_name' || key === 'source_sheet') && value) {
                this.loadCrossSheetColumns(value);
            }

            // source_type değişikliğinde de ayarları yenile
            if (key === 'source_type') {
                this.renderSettings();
            }

            this.renderCanvas(); // Özeti güncelle
        }
    },

    // Farklı sayfanın sütunlarını backend'den çek
    async loadCrossSheetColumns(sheetName) {
        const fileInput = document.getElementById("fileInput");
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            console.warn("VisualBuilder: Sütun çekmek için dosya yüklü değil");
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sheet_name", sheetName);

        try {
            // Backend'e istek at
            const response = await fetch("/get-sheet-columns", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.columns && Array.isArray(data.columns)) {
                    // Global değişkene kaydet
                    window.CROSSSHEET_COLUMNS = data.columns;
                    console.log(`✅ ${sheetName} sayfası sütunları yüklendi:`, data.columns.length, "sütun");

                    // Ayarlar panelini yenile (yeni sütunlarla)
                    this.renderSettings();

                    if (typeof showToast === 'function') {
                        showToast(`📄 ${sheetName} sayfası: ${data.columns.length} sütun yüklendi`, "success", 2000);
                    }
                }
            } else {
                console.warn("Sütun çekme hatası:", response.status);
            }
        } catch (err) {
            console.error("Crosssheet sütun çekme hatası:", err);
        }
    },

    getDefaultConfig(type) {
        switch (type) {
            case 'data_source': return { source_type: 'main', sheet_name: '' };
            case 'lookup_join': return { join_type: 'vlookup', main_key: '', source_type: 'second_file', source_sheet: '', source_key: '', fetch_columns: [] };
            case 'filter': return { column: '', operator: 'equals', value: '' };
            case 'computed': return { name: '', columns: [], operation: 'add', window_size: 3 };
            case 'time_series': return { analysis_type: 'ytd_sum', date_column: '', value_column: '', output_name: '' };
            case 'window_function': return { window_type: 'rank', value_column: '', partition_by: '', order_by: '', output_name: '' };
            case 'pivot': return { rows: [], columns: [], values: [], aggregation: 'sum', percent_type: '', show_totals: true };
            case 'chart': return { chart_type: 'column', x_column: '', y_columns: [], title: '', show_legend: true };
            case 'sort': return { column: '', order: 'asc' };
            case 'conditional_format': return { column: '', cf_type: 'color_scale', threshold_value: 10 };
            case 'output_settings': return { freeze_header: true, auto_fit_columns: true, number_format: '', header_style: true };
            // ===== YENİ BLOK TİPLERİ =====
            case 'union': return { ignore_index: true };
            case 'diff': return { left_on: '', right_on: '' };
            case 'validate': return { left_on: '', right_on: '', valid_label: 'Geçerli', invalid_label: 'Geçersiz' };
            case 'grouping': return { groups: [], agg_column: '', agg_func: 'sum', agg_alias: '' };
            case 'text_transform': return { column: '', transform_type: 'trim', output_name: '' };
            case 'advanced_computed': return { advanced_type: 'z_score', column: '', column2: '', separator: ',', part_index: 0, output_name: '' };
            case 'if_else': return { name: '', column: '', condition: '>', compare_value: '', true_value: '', false_value: '' };
            case 'formula': return { name: '', formula: '' };
            case 'what_if_variable': return { name: '', value: 0 };
            default: return {};
        }
    },

    getBlockSummary(block) {
        const c = block.config;
        const notConfigured = this.getText({ tr: "Yapılandırılmadı", en: "Not configured" });

        switch (block.type) {
            case 'data_source':
                if (c.source_type === 'main') return this.getText({ tr: "Ana Dosya", en: "Main File" });
                if (c.source_type === 'second') return this.getText({ tr: "İkinci Dosya", en: "Second File" });
                if (c.source_type === 'cross_sheet') return c.sheet_name ? `📄 ${c.sheet_name}` : this.getText({ tr: "Sayfa seçin", en: "Select sheet" });
                return this.getText({ tr: "Kaynak seçildi", en: "Source selected" });
            case 'lookup_join':
                return c.main_key ? `${c.main_key} ⇔ ${c.source_key || '?'}` : notConfigured;
            case 'filter':
                return c.column ? `${c.column} ${c.operator} "${c.value}"` : notConfigured;
            case 'computed':
                return c.name || notConfigured;
            case 'time_series':
                return c.output_name || c.analysis_type || notConfigured;
            case 'window_function':
                return c.output_name || c.window_type || notConfigured;
            case 'pivot':
                return c.rows?.length ? `${c.rows.join(", ")}` : notConfigured;
            case 'chart':
                return c.title || c.chart_type || notConfigured;
            case 'sort':
                return c.column ? `${c.column} (${c.order})` : notConfigured;
            case 'conditional_format':
                return c.column ? `${c.column} - ${c.cf_type}` : notConfigured;
            case 'output_settings':
                return this.getText({ tr: "Excel Çıktı Ayarları", en: "Excel Output Settings" });
            // ===== YENİ BLOK TİPLERİ =====
            case 'union':
                return this.getText({ tr: "İkinci dosya alt alta", en: "Append second file" });
            case 'diff':
                return c.left_on ? `${c.left_on} ⊄ ${c.right_on || '?'}` : notConfigured;
            case 'validate':
                return c.left_on ? `${c.left_on} ✓ ${c.right_on || '?'}` : notConfigured;
            case 'grouping':
                return c.groups?.length ? `${c.groups.join(", ")} → ${c.agg_func}` : notConfigured;
            case 'text_transform':
                return c.column ? `${c.column} → ${c.transform_type}` : notConfigured;
            case 'advanced_computed':
                return c.output_name || c.advanced_type || notConfigured;
            case 'if_else':
                return c.name || notConfigured;
            case 'formula':
                return c.name || (c.formula ? c.formula.substring(0, 20) + '...' : notConfigured);
            case 'what_if_variable':
                return c.name ? `$${c.name} = ${c.value}` : notConfigured;
            default:
                return "";
        }
    },

    // ===== CANVAS EVENTS =====
    setupEventListeners() {
        const canvas = document.getElementById("vbCanvas");
        if (!canvas) return;

        // Drop zone
        canvas.addEventListener("dragover", (e) => {
            e.preventDefault();
            canvas.classList.add("drag-over");
        });

        canvas.addEventListener("dragleave", (e) => {
            if (!canvas.contains(e.relatedTarget)) {
                canvas.classList.remove("drag-over");
            }
        });

        canvas.addEventListener("drop", (e) => {
            e.preventDefault();
            canvas.classList.remove("drag-over");

            const blockType = e.dataTransfer.getData("text/plain");
            if (blockType && this.blockTypes[blockType]) {
                this.addBlock(blockType);
            }
        });
    },

    // ===== PIPELINE VALIDATION =====
    // Required fields per block type (empty array means no required fields)
    REQUIRED_FIELDS: {
        data_source: ['source_type'],
        filter: ['column', 'operator'],
        lookup_join: ['main_key', 'source_key', 'fetch_columns'],
        computed: ['name', 'columns', 'operation'],
        time_series: ['analysis_type', 'date_column', 'value_column'],
        window_function: ['window_type', 'value_column'],  // direction opsiyonel (default: desc)
        pivot: ['rows', 'values', 'aggregation'],
        chart: ['chart_type', 'x_column', 'y_columns'],
        sort: ['column', 'order'],
        conditional_format: ['column', 'cf_type'],
        output_settings: [],
        union: [],
        diff: ['left_on', 'right_on'],
        validate: ['left_on', 'right_on'],
        grouping: ['groups', 'agg_column', 'agg_func'],
        text_transform: ['column', 'transform_type'],
        advanced_computed: ['advanced_type', 'column'],
        if_else: ['name', 'column', 'condition'],
        formula: ['name', 'formula'],
        what_if_variable: ['name']
    },

    validatePipeline() {
        const errors = [];
        let firstInvalidId = null;

        // Clear previous invalid states
        document.querySelectorAll('.vb-block-invalid').forEach(el => {
            el.classList.remove('vb-block-invalid');
        });

        this.blocks.forEach(block => {
            const required = this.REQUIRED_FIELDS[block.type] || [];
            const missing = [];

            required.forEach(field => {
                const val = block.config[field];
                // Check for empty/null/undefined/empty array
                if (val === undefined || val === null || val === '' ||
                    (Array.isArray(val) && val.length === 0)) {
                    missing.push(field);
                }
            });

            if (missing.length > 0) {
                const blockName = this.getText(this.blockTypes[block.type]?.name) || block.type;
                errors.push({ id: block.id, blockName, missing, type: block.type });
                if (!firstInvalidId) firstInvalidId = block.id;

                // Add invalid class to block element
                const el = document.querySelector(`[data-block-id="${block.id}"]`);
                if (el) el.classList.add('vb-block-invalid');
            }
        });

        return { valid: errors.length === 0, errors, firstInvalidId };
    },

    // ===== JSON EXPORT (Backend ile 1:1 uyumlu) =====
    exportToJSON() {
        // Backend action type'ları ile eşleştirme
        const typeMapping = {
            'data_source': 'data_source',  // Backend'de özel işlem yok ama config'te saklanır
            'lookup_join': 'merge',         // VLOOKUP/Join -> merge action
            'filter': 'filter',
            'computed': 'computed',
            'time_series': 'computed',      // Zaman serisi -> computed tipinde işlenir
            'window_function': 'window',    // Window function -> window
            'pivot': 'pivot',
            'chart': 'chart',
            'sort': 'sort',
            'conditional_format': 'conditional_format',
            'output_settings': 'output'
        };

        const actions = this.blocks.map(block => {
            const backendType = typeMapping[block.type] || block.type;
            const action = { type: backendType };

            // Her blok tipine göre özel dönüşüm
            switch (block.type) {
                case 'filter':
                    action.column = block.config.column;
                    action.operator = block.config.operator;
                    action.value = block.config.value;
                    break;

                case 'lookup_join':
                    action.left_on = block.config.main_key;
                    action.right_on = block.config.source_key;
                    action.how = block.config.join_type === 'vlookup' ? 'left' : block.config.join_type;
                    action.columns_to_add = block.config.fetch_columns;
                    action.use_crosssheet = block.config.source_type === 'same_file_sheet';
                    action.crosssheet_name = block.config.source_sheet;
                    break;

                case 'computed':
                    // Backend expects: type="computed", ctype="arithmetic", columns, operation
                    action.ctype = 'arithmetic';
                    action.name = block.config.name;
                    action.columns = block.config.columns;
                    action.operation = block.config.operation;
                    if (block.config.window_size) action.window_size = parseInt(block.config.window_size);
                    break;

                case 'time_series':
                    // Backend expects: type="computed", ctype=analysis_type, date_column, value_column
                    action.ctype = block.config.analysis_type; // ytd_sum, mtd_sum, yoy_change, qoq_change, date_hierarchy
                    action.name = block.config.output_name || `TS_${block.config.analysis_type}`;
                    action.date_column = block.config.date_column;
                    action.value_column = block.config.value_column;
                    break;

                case 'window_function':
                    action.wf_type = block.config.window_type;
                    action.order_by = block.config.value_column; // UI'da value_column, backend'de order_by

                    // YENİ: Sıralama yönü (default: desc - en yüksek=1)
                    action.direction = block.config.direction || 'desc';

                    // YENİ: Çoklu partition_by desteği (array olarak gönder)
                    if (block.config.partition_by) {
                        action.partition_by = Array.isArray(block.config.partition_by)
                            ? block.config.partition_by
                            : [block.config.partition_by];
                    } else {
                        action.partition_by = [];
                    }

                    // YENİ: ntile için N değeri
                    if (block.config.window_type === 'ntile' && block.config.ntile_n) {
                        action.ntile_n = parseInt(block.config.ntile_n);
                    }

                    action.alias = block.config.output_name || `${block.config.window_type}_result`;
                    break;

                case 'pivot':
                    action.rows = block.config.rows;
                    action.columns = block.config.columns;
                    action.values = block.config.values?.map(v => ({ column: v, aggfunc: block.config.aggregation })) || [];
                    action.show_totals = block.config.show_totals;
                    action.percent_type = block.config.percent_type || null;
                    break;

                case 'chart':
                    action.chart_type = block.config.chart_type;
                    action.x_column = block.config.x_column;
                    action.y_columns = block.config.y_columns;
                    action.title = block.config.title;
                    action.show_legend = block.config.show_legend;
                    break;

                case 'sort':
                    action.column = block.config.column;
                    action.direction = block.config.order;
                    break;

                case 'conditional_format':
                    action.cf_type = block.config.cf_type;
                    action.column = block.config.column;
                    if (block.config.threshold_value) action.n = parseInt(block.config.threshold_value);
                    if (block.config.threshold_value) action.threshold = parseFloat(block.config.threshold_value);
                    break;

                case 'output_settings':
                    action.freeze_header = block.config.freeze_header;
                    action.auto_fit_columns = block.config.auto_fit_columns;
                    action.number_format = block.config.number_format;
                    action.header_style = block.config.header_style;
                    break;

                case 'data_source':
                    // Data source bilgisi ayrıca işlenir
                    action.source_type = block.config.source_type;
                    action.sheet_name = block.config.sheet_name;
                    break;

                // ===== YENİ BLOK TİPLERİ =====
                case 'union':
                    action.type = 'union';
                    action.ignore_index = block.config.ignore_index;
                    break;

                case 'diff':
                    action.type = 'diff';
                    action.left_on = block.config.left_on;
                    action.right_on = block.config.right_on;
                    break;

                case 'validate':
                    action.type = 'validate';
                    action.left_on = block.config.left_on;
                    action.right_on = block.config.right_on;
                    action.valid_label = block.config.valid_label;
                    action.invalid_label = block.config.invalid_label;
                    break;

                case 'grouping':
                    action.type = 'grouping';
                    action.groups = block.config.groups;
                    action.aggregations = [{
                        column: block.config.agg_column,
                        func: block.config.agg_func,
                        alias: block.config.agg_alias || `${block.config.agg_column}_${block.config.agg_func}`
                    }];
                    break;

                case 'text_transform':
                    // Backend expects: type="computed", ctype="text_transform", source_column, transform_type
                    action.type = 'computed';
                    action.ctype = 'text_transform';
                    action.name = block.config.output_name || block.config.column;
                    action.source_column = block.config.column;  // Backend expects source_column
                    action.transform_type = block.config.transform_type;
                    // Optional params for specific transform types
                    if (block.config.word_count) action.word_count = parseInt(block.config.word_count);
                    if (block.config.pattern) action.pattern = block.config.pattern;
                    if (block.config.replacement) action.replacement = block.config.replacement;
                    break;

                case 'advanced_computed':
                    // Backend expects: type="computed", ctype=advanced_type
                    action.type = 'computed';
                    action.ctype = block.config.advanced_type;
                    action.name = block.config.output_name || `${block.config.advanced_type}_result`;

                    // Type-specific parameter mapping
                    const advType = block.config.advanced_type;

                    if (advType === 'split') {
                        // Backend expects: source_column, separator, index
                        action.source_column = block.config.column;
                        action.separator = block.config.separator || ',';
                        action.index = parseInt(block.config.part_index) || 0;
                    } else if (advType === 'business_days') {
                        // Backend expects: date1_column, date2_column
                        action.date1_column = block.config.column;
                        action.date2_column = block.config.column2;
                    } else if (advType === 'correlation') {
                        // Backend expects: column1, column2
                        action.column1 = block.config.column;
                        action.column2 = block.config.column2;
                    } else if (['z_score', 'percentile_rank', 'running_total', 'moving_avg', 'growth_rate'].includes(advType)) {
                        // Backend expects: value_column or columns[0]
                        action.value_column = block.config.column;
                        action.columns = [block.config.column];
                        if (block.config.column2) action.group_column = block.config.column2;
                        if (block.config.window_size) action.window_size = parseInt(block.config.window_size);
                    } else if (['age', 'weekday', 'extract_year', 'extract_month', 'extract_day', 'extract_week'].includes(advType)) {
                        // Backend expects: date_column
                        action.date_column = block.config.column;
                        action.columns = [block.config.column];
                    } else if (['duplicate_flag', 'missing_flag', 'normalize_turkish', 'extract_numbers'].includes(advType)) {
                        // Backend expects: check_column or source_column
                        action.source_column = block.config.column;
                        action.check_column = block.config.column;
                        action.columns = [block.config.column];
                    } else {
                        // Fallback: send columns array
                        action.columns = [block.config.column];
                        if (block.config.column2) action.columns.push(block.config.column2);
                    }
                    break;

                case 'if_else':
                    // Backend expects: type="computed", ctype="if_else", condition_column, operator, condition_value
                    action.type = 'computed';
                    action.ctype = 'if_else';
                    action.name = block.config.name;
                    action.condition_column = block.config.column;  // Backend expects condition_column
                    action.operator = block.config.condition;       // Backend expects operator
                    action.condition_value = block.config.compare_value;  // Backend expects condition_value
                    action.true_value = block.config.true_value;
                    action.false_value = block.config.false_value;
                    break;

                case 'formula':
                    // Backend expects: type="computed", ctype="formula", formula
                    action.type = 'computed';
                    action.ctype = 'formula';
                    action.name = block.config.name;
                    action.formula = block.config.formula;
                    break;

                case 'what_if_variable':
                    action.type = 'variable';
                    action.name = block.config.name;
                    action.value = parseFloat(block.config.value) || 0;
                    break;
            }

            return action;
        });

        return actions;
    },

    // ===== ÇALIŞTIR (BACKEND İLE TAM UYUMLU) =====
    async run() {
        if (this.blocks.length === 0) {
            if (typeof showToast === 'function') {
                showToast("⚠️ Önce blok ekleyin", "warning", 3000);
            }
            return;
        }

        // Validate pipeline before running
        const validation = this.validatePipeline();
        if (!validation.valid) {
            // Build error message
            const firstError = validation.errors[0];
            const errorMsg = `❌ ${firstError.blockName}: ${firstError.missing.join(', ')} eksik`;

            if (typeof showToast === 'function') {
                showToast(errorMsg, "warning", 5000);
            }

            // Select first invalid block to help user
            if (validation.firstInvalidId) {
                this.selectBlock(validation.firstInvalidId);
            }

            console.warn("Pipeline validation failed:", validation.errors);
            return;
        }

        // Çalıştırılıyor göstergesi
        if (typeof showToast === 'function') {
            showToast("⏳ İşlem başlatılıyor...", "info", 2000);
        }

        const actions = this.exportToJSON();
        console.log("🚀 Running pipeline:", actions);

        try {
            // Ana dosya kontrolü
            const fileInput = document.getElementById("fileInput");
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                if (typeof showToast === 'function') {
                    showToast("📁 Önce dosya yükleyin", "warning", 3000);
                }
                return;
            }

            // Serialize block configuration
            const configJson = JSON.stringify(actions);

            // --- DELEGATION TO STANDARD RUNNER ---

            // 1. Ensure hidden config input exists (Robustness Check)
            // app.js renderDynamicForm creates #pro_config_config, but we check just in case.
            let configInput = document.getElementById('pro_config_config');
            if (!configInput) {
                console.warn("VisualBuilder: #pro_config_config not found, creating fallback container.");

                // Check or create container form
                let form = document.getElementById('form_custom-report-builder-pro');
                if (!form) {
                    const formContainer = document.getElementById("dynamicFormContainer") || document.body;
                    form = document.createElement("form");
                    form.id = "form_custom-report-builder-pro";
                    form.style.display = "none";
                    formContainer.appendChild(form);
                }

                // Create input
                configInput = document.createElement("input");
                configInput.type = "hidden";
                configInput.id = "pro_config_config";
                configInput.name = "config";
                form.appendChild(configInput);
            }

            // 2. Set the config value
            if (configInput) {
                configInput.value = configJson;
                // Also trigger change event just in case listeners are watching
                configInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log("VisualBuilder: Config saved to hidden input.", { actions_count: actions.length });
            }

            // 3. Call standard scenario runner
            if (typeof window.runScenario === 'function') {
                console.log("VisualBuilder: Delegating to window.runScenario...");

                // Show loading state on button manually since runScenario might not see the specific vbRunBtn immediately
                const runBtn = document.getElementById("vbRunBtn");
                if (runBtn) {
                    const originalText = runBtn.innerHTML;
                    runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
                    runBtn.disabled = true;

                    // Restore button state after a delay or when result is ready
                    // Note: runScenario usually handles global loading state, but we do this for immediate feedback
                    // The standard runner will trigger its own UI updates
                    setTimeout(() => {
                        runBtn.innerHTML = originalText;
                        runBtn.disabled = false;
                    }, 2000);
                }

                window.runScenario('custom-report-builder-pro');
            } else {
                console.error("CRITICAL: window.runScenario is not defined!");
                if (typeof showToast === 'function') {
                    showToast("❌ Sistem hatası: Senaryo çalıştırıcı bulunamadı.", "error");
                } else {
                    alert("Sistem hatası: Senaryo çalıştırıcı bulunamadı.");
                }
            }

        } catch (err) {
            console.error("Pipeline run error:", err);
            if (typeof showToast === 'function') {
                showToast("❌ Hata: " + err.message, "error", 5000);
            }
        }
    },

    // ===== JSON IMPORT =====
    importFromJSON(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;
            this.blocks = [];
            this.blockIdCounter = 0;

            (data.blocks || []).forEach(action => {
                const id = ++this.blockIdCounter;
                this.blocks.push({
                    id,
                    type: action.type,
                    config: { ...action }
                });
            });

            this.renderCanvas();
            this.renderSettings();
        } catch (err) {
            console.error("Import error:", err);
        }
    }
};

// Global erişim
window.VisualBuilder = VisualBuilder;

// ===== TÜM DÜZELTMELERİ TEK YERDE TOPLA =====

// 1. SENARYO İKON STİLİ DÜZELTMESİ (MutationObserver ile)
function applyTransparentIconStyle(icon) {
    const style = icon.getAttribute('style') || '';
    if (style.includes('background')) {
        // Yarı-şeffaf glassmorphism stil
        icon.style.setProperty('background', 'rgba(74, 144, 217, 0.18)', 'important');
        icon.style.setProperty('border', '1px solid rgba(74, 144, 217, 0.3)', 'important');
        icon.style.borderRadius = '8px';
    }
}

function fixAllScenarioIcons() {
    // Tüm olası seçicileri dene
    const selectors = [
        '#scenarioListContainer span[style*="background"]',
        '.gm-accordion-container span[style*="background"]',
        '[data-scenario-id] span[style*="background"]',
        '.gm-accord-item span[style*="background"]',
        'button[data-scenario] span[style*="background"]'
    ];

    let totalFixed = 0;
    selectors.forEach(sel => {
        const icons = document.querySelectorAll(sel);
        icons.forEach(applyTransparentIconStyle);
        totalFixed += icons.length;
    });

    if (totalFixed > 0) {
        console.log(`🎨 ${totalFixed} senaryo ikonu yarı-şeffaf yapıldı`);
    }
    return totalFixed;
}

// MutationObserver ile yeni eklenen ikonları da yakala
function observeScenarioList() {
    const container = document.getElementById('scenarioListContainer');
    if (!container) {
        console.log('⚠️ scenarioListContainer bulunamadı, 1 saniye sonra tekrar deneniyor...');
        setTimeout(observeScenarioList, 1000);
        return;
    }

    const observer = new MutationObserver((mutations) => {
        let hasNewSpans = false;
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) hasNewSpans = true;
        });
        if (hasNewSpans) {
            setTimeout(fixAllScenarioIcons, 100);
        }
    });

    observer.observe(container, { childList: true, subtree: true });
    console.log('👁️ Senaryo listesi MutationObserver aktif');

    // İlk çalıştırma
    setTimeout(fixAllScenarioIcons, 200);
    setTimeout(fixAllScenarioIcons, 1000);
    setTimeout(fixAllScenarioIcons, 3000);
}

// 2. VB PRO BUTON DÜZELTMESİ - Açıklama ekle ve tıklamayı düzelt
function fixVBProButton() {
    const btn = document.getElementById('vbProShortcut');
    if (!btn) return;

    // Buton içeriğini güncelle - açıklama ekle
    btn.innerHTML = `
        <i class="fas fa-magic"></i>
        <div class="vb-btn-content">
            <span class="vb-btn-title">✨ Visual Builder PRO</span>
            <span class="vb-btn-desc">Sürükle-bırak ile rapor oluştur</span>
        </div>
    `;

    // Butona stil ekle
    btn.style.flexDirection = 'row';
    btn.style.textAlign = 'left';

    // Açıklama stilini CSS ile ekle
    const style = document.createElement('style');
    style.textContent = `
        .vb-btn-content { display: flex; flex-direction: column; align-items: flex-start; }
        .vb-btn-title { font-weight: 600; }
        .vb-btn-desc { font-size: 0.75rem; opacity: 0.7; margin-top: 2px; }
    `;
    document.head.appendChild(style);

    // Onclick - Oyun Hamuru PRO senaryosunu seç
    btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Senaryo butonlarını bul
        const scenarioBtns = document.querySelectorAll('[data-scenario-id]');
        let targetBtn = null;

        scenarioBtns.forEach(b => {
            if (b.getAttribute('data-scenario-id') === 'custom-report-builder-pro') {
                targetBtn = b;
            }
        });

        if (targetBtn) {
            targetBtn.click();
            console.log('✅ VB PRO senaryosu seçildi');
        } else {
            // Alternatif: Senaro katalogdan bul ve seç
            if (typeof SCENARIO_CATALOG !== 'undefined' && typeof doSelectScenario === 'function') {
                const scenario = SCENARIO_CATALOG['custom-report-builder-pro'];
                if (scenario) {
                    doSelectScenario(scenario);
                }
            }
            console.log('⚠️ Senaryo butonu bulunamadı, katalogdan arandı');
        }
    };

    console.log('✅ VB PRO buton düzeltildi ve açıklama eklendi');
}

// 3. SAĞ PANELDEKİ TOAST - Bildirim alanını düzelt
function fixRightPanelNotification() {
    // Sağ paneldeki tüm bildirim elementlerini bul
    const notifications = document.querySelectorAll('.gm-right-pane .notification, .gm-middle-pane .notification, [class*="toast"][style*="position: fixed"], [class*="notification"]');

    // Eğer sağ paneli kaplayan büyük bir element varsa gizle
    notifications.forEach(n => {
        if (n.offsetWidth > 300 || n.offsetHeight > 200) {
            n.style.display = 'none';
        }
    });
}

// 4. BLOK ÇOKLU EKLEME SORUNU DÜZELTMESİ
// addBlock fonksiyonunu debounce ile sar
let lastBlockAddTime = 0;
const originalAddBlock = VisualBuilder.addBlock;
if (originalAddBlock) {
    VisualBuilder.addBlock = function (type) {
        const now = Date.now();
        if (now - lastBlockAddTime < 300) {
            console.log('⚠️ Çoklu blok ekleme engellendi (debounce)');
            return;
        }
        lastBlockAddTime = now;
        return originalAddBlock.call(this, type);
    };
    console.log('✅ Blok ekleme debounce aktif');
}

// 5. BAŞLATMA
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 Düzeltmeler başlatılıyor...');

    // Inject CSS for invalid block state
    const vbStyles = document.createElement('style');
    vbStyles.textContent = `
        .vb-block-invalid {
            border: 2px solid #ef4444 !important;
            animation: vb-pulse-red 1s ease-in-out infinite !important;
        }
        
        @keyframes vb-pulse-red {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        
        .vb-block-invalid .vb-block-summary {
            color: #ef4444 !important;
            font-weight: 600;
        }
    `;
    document.head.appendChild(vbStyles);

    // VB PRO buton
    setTimeout(fixVBProButton, 100);

    // Senaryo ikonları (MutationObserver)
    setTimeout(observeScenarioList, 500);

    // Sağ panel bildirimi
    setTimeout(fixRightPanelNotification, 1000);
});

// Global erişim
window.fixAllScenarioIcons = fixAllScenarioIcons;
window.fixVBProButton = fixVBProButton;

