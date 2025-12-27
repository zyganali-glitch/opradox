# Deep Gap Analysis & Restoration Plan (vs. viz_SOURCE.js)

Bu plan, `viz_SOURCE.js` kaynak dosyası ile mevcut modüler yapı (`frontend/js/modules/`) arasındaki **TÜM** eksiklikleri ve basitleştirmeleri detaylıca raporlar.

## 1. Kritik Eksikler (Tamamen Kayıp)

Bu özellikler kaynak dosyada mevcut olup, modüler sisteme hiç aktarılmamıştır.

| Fonksiyon/Özellik | Kaynak Dosya (viz_SOURCE.js) | Durum | Öncelik |
|---|---|---|---|
| **Simple Statistics Overlay** | `calculateStatistics`, `getStatisticalOverlays`, `applyStatisticalOverlays` (L2990-3235) | **YOK** (Charts.js içinde yok) | Yüksek |
| **Anomaly Detection (BI)** | `detectAnomalies`, `updateTrendInsight` (L3613-3718) | **YOK** (Advanced.js içinde yok) | Yüksek |
| **What-If Analysis (BI)** | `applyWhatIfChange`, `setupBIListeners` (L3583-3611) | **YOK** (Advanced.js içinde yok) | Orta |
| **Audit Trail (Smart Card)** | `generateAuditNote`, `toggleStatMode` (APA), `copyStatAsHTML` (L15270-15567) | **YOK** (Stats.js/UI.js içinde yok) | Orta |
| **Chart Stats Overlay** | `calculateTrendLine` (L3143-3180) | **YOK** (Charts.js içinde yok) | Orta |

## 2. Kısmi / Özeti Geçilmiş Özellikler

Bu özellikler modüler sisteme aktarılmış ancak kaynak koda göre basitleştirilmiştir.

| Fonksiyon/Özellik | Kaynak (viz_SOURCE.js) | Modüler (Stats.js / Data.js) | Fark |
|---|---|---|---|
| **SPSS / T-Test Call** | `runTTest` (L3390) - DOM manipülasyonu ve özel rapor formatı içeriyor | `runStatWidgetAnalysis` - Sadece matematiksel hesaplama yapıyor | Kaynaktaki **özel raporlama HTML template'leri** (APA stili tablolar) eksik. Modüler sistem daha jenerik. |
| **Cross-Filter** | `applyCrossFilter` (L3720) | `advanced.js` (L2001) | Modülerdeki implementasyon daha modern `VIZ_STATE` kullanıyor ancak kaynaktaki gibi **"seçimi vurgulama" (opacity adjustment)** mantığı tam taşınmamış olabilir. |

## 3. Önerilen Aksiyon Planı

### Adım 1: "Statistics Overlay" (Grafik Üzeri İstatistik) Modülünü Geri Getir (Charts.js + UI)
- `viz_SOURCE.js` L2990-3235 arasını `frontend/js/modules/charts_addon.js` veya `charts.js` içine taşı.
- Global `window.calculateStatistics` bağlamasını yap.
- `renderChart` fonksiyonunun içine `applyStatisticalOverlays` kancasını (hook) ekle.

### Adım 2: "BI Insights" (Anomali & What-If) Modülünü Geri Getir (Advanced.js)
- `viz_SOURCE.js` L3550-3720 arasını `advanced.js` içine taşı.
- `detectAnomalies` ve `applyWhatIfChange` fonksiyonlarını global yap.
- UI tarafında bu butonları aktif et (HTML'de onclick="detectAnomalies()" vb. mevcut).

### Adım 3: "Smart Audit & APA Mode" Modülünü Geri Getir (Stats.js)
- `viz_SOURCE.js` L15270-15567 arasını `stats.js` içine ekle.
- `toggleStatMode` (APA/Dashboard toggle) fonksiyonunu çalışır hale getir.
- `copyStatAsHTML` fonksiyonunu ekle (Word'e yapıştırma özelliği için kritik).

## 4. Doğrulama
- Her bir adım sonrası ilgili butona (örn: "Anomali Tespiti") basılıp fonksiyonun çalıştığı görülecek.
- Konsolda `ReferenceError` kalmayacak.
