# FAZ-0 AUDIT REPORT
## Opradox Visual Studio - Sağlık Kontrolü ve Denetim Raporu

**Tarih:** 2026-01-06  
**Hedef:** Sadece denetim - Kodda değişiklik YOK (0 dosya değişti)

---

## 1. PROJE DOSYA YAPISI

### JavaScript Dosyaları
| Dosya | Boyut | Path |
|-------|-------|------|
| adapters.js | 168 KB | js/adapters.js |
| app.js | 419 KB | js/app.js |
| selftest.js | 133 KB | js/selftest.js |
| visualBuilder.js | 107 KB | js/visualBuilder.js |
| hub-modals.js | 30 KB | js/hub-modals.js |
| admin.js | 22 KB | js/admin.js |
| pdf.js | 15 KB | js/pdf.js |
| fileDocker.js | 12 KB | js/fileDocker.js |
| optional_features.js | 12 KB | js/optional_features.js |
| ocr.js | 11 KB | js/ocr.js |
| crosssheet_functions.js | 11 KB | js/crosssheet_functions.js |
| hub.js | 10 KB | js/hub.js |
| proColumnSelector.js | 7 KB | js/proColumnSelector.js |
| toast.js | 2 KB | js/toast.js |

### Modül Dosyaları (js/modules/)
| Dosya | Boyut |
|-------|-------|
| stats.js | 287 KB |
| charts.js | 166 KB |
| data.js | 100 KB |
| advanced.js | 74 KB |
| ui.js | 38 KB |
| core.js | 32 KB |
| texts.js | 26 KB |
| preview.js | 15 KB |

---

## 2. SYNTAX CHECK SONUÇLARI

> [!WARNING]
> **Node.js ortamda bulunamadı** - `node --check` komutları çalıştırılamadı.

```powershell
# Sonuç: 'node' is not recognized as the name of a cmdlet...
```

**Öneri:** Node.js kurulumunu doğrulayın veya PATH değişkenini kontrol edin.

---

## 3. TARAYICI SELFTEST SONUÇLARI

> [!WARNING]
> **Browser selftest çalıştırılamadı** - Tarayıcı uzantısı zaman aşımına uğradı.

`viz.html?selftest=1` URL'si ile manuel test önerilir.

**selftest.js özellikleri:**
- 28+ critical function kontrolü
- 15+ smoke test
- 44 chart type testi (`?selftest=1` ile)
- Stat engine testleri (ANOVA, T-Test, Chi-Square, vb.)
- FAZ-3/4/5 regression testleri

---

## 4. RİSK ANALİZİ

### Risk 1: CDN Bağımlılığı ve Offline Modu

> [!CAUTION]
> **RİSK SEVİYESİ: YÜKSEK**

viz.html dosyasında **13 CDN bağımlılığı** tespit edildi:

| CDN | Kütüphane | Versiyon |
|-----|-----------|----------|
| cloudflare | Font Awesome | 6.4.2 |
| jsdelivr | ECharts | 5.4.3 |
| jsdelivr | simple-statistics | 7.8.3 |
| jsdelivr | echarts-gl | 2.0.9 |
| jsdelivr | jstat | 1.9.6 |
| jsdelivr | regression | 2.0.1 |
| jsdelivr | mousetrap | 1.6.5 |
| cloudflare | jspdf | 2.5.1 |
| jsdelivr | html2canvas | 1.4.1 |
| jsdelivr | MathJax | 3 |
| jsdelivr | fabric | 5.3.0 |
| jsdelivr | lz-string | 1.5.0 |
| jsdelivr | xlsx | 0.18.5 |

**sw.js Durumu:**
```javascript
// Only cache same-origin requests (skip CDN scripts)
if (url.origin !== location.origin) return;
```

**Sonuç:** Service Worker CDN'leri **cache'lemez**. Offline modda:
- Font iconları görünmeyebilir ❌
- ECharts grafikleri çalışmaz ❌
- İstatistik motorları çalışmaz ❌
- PDF/Excel export çalışmaz ❌

**Öneri:** CDN dosyalarını local olarak bundle edin veya sw.js'yi CDN URL'lerini de cache'leyecek şekilde güncelleyin.

---

### Risk 2: sw.js Asset Listesi Doğrulaması

> [!NOTE]
> **RİSK SEVİYESİ: DÜŞÜK**

sw.js ASSETS_TO_CACHE listesi (14 asset):
```javascript
const ASSETS_TO_CACHE = [
    '/viz.html',
    '/css/style.css',
    '/css/viz_fixes.css',
    '/js/adapters.js',
    '/js/toast.js',
    '/js/fileDocker.js',
    '/js/selftest.js',
    '/js/modules/core.js',
    '/js/modules/ui.js',
    '/js/modules/data.js',
    '/js/modules/charts.js',
    '/js/modules/stats.js',
    '/js/modules/advanced.js',
    '/js/modules/preview.js',
    '/js/modules/texts.js',
    '/manifest.json'
];
```

**Doğrulama:**
| Asset | Projede Var? |
|-------|--------------|
| viz.html | ✅ |
| css/style.css | ✅ |
| css/viz_fixes.css | ✅ |
| js/adapters.js | ✅ |
| js/toast.js | ✅ |
| js/fileDocker.js | ✅ |
| js/selftest.js | ✅ |
| js/modules/core.js | ✅ |
| js/modules/ui.js | ✅ |
| js/modules/data.js | ✅ |
| js/modules/charts.js | ✅ |
| js/modules/stats.js | ✅ |
| js/modules/advanced.js | ✅ |
| js/modules/preview.js | ✅ |
| js/modules/texts.js | ✅ |
| manifest.json | ✅ |

**Sonuç:** Tüm cache listesi dosyaları projede mevcut. ✅

**Eksik olabilecek önemli dosyalar:**
- `js/app.js` (419 KB - ana modül) - SW listesinde YOK
- `js/visualBuilder.js` (107 KB) - SW listesinde YOK
- `favicon.ico` - SW listesinde YOK

---

### Risk 3: adapters.js Lock Section Analizi

> [!IMPORTANT]
> **RİSK SEVİYESİ: ORTA**

**Lock mechanism (line 3064-3092):**
```javascript
// FINAL_AUDIT_FIX: LOCK SECTION - Prevent Override
window.__VIZ_MOD = window.__VIZ_MOD || {};

const lockFunctions = [
    'exportJSONConfig', 'importJSONConfig', 'exportPortableDashboard',
    'shareViaURL', 'loadFromURL', 'generateEmbedCode', 'generateQRCode',
    'detectColumnTypes', 'generateDataProfile', 'applyCrossFilter', 'clearFilters',
    'applyWhatIfChange', 'analyzeTrend', 'showToast', 'downloadFile'
];

// Re-apply locks on DOMContentLoaded (after any legacy scripts)
window.addEventListener('DOMContentLoaded', function () {
    lockFunctions.forEach(fn => {
        if (window.__VIZ_MOD[fn] && typeof window.__VIZ_MOD[fn] === 'function') {
            window[fn] = window.__VIZ_MOD[fn];
        }
    });
});
```

**Potansiyel Maskeleme Riskleri:**

1. **Script yükleme sırası bağımlılığı** - Lock mekanizması adapters.js'in modüllerden SONRA yüklenmesini gerektirir. Aksi halde modül fonksiyonları adapters stub'larıyla değiştirilebilir.

2. **DOMContentLoaded timing** - Lock, DOMContentLoaded'da çalışır. Dinamik olarak yüklenen scriptler (async/defer) bu lock'tan kaçabilir.

3. **Bug maskeleme senaryosu:**
   - Modüldeki gerçek bir bug → Hata fırlatır
   - adapters.js stub'ı → Toast gösterir, hatayı yutar
   - Lock mekanizması → Stub versiyonunu korur
   - **Sonuç:** Gerçek bug hiç görünmez

**adapters.js'deki try-catch blokları (13 adet):**
- Line 132, 145, 241, 370, 409, 473, 704
- Line 2389, 2758, 3112, 3270, 3329, 3380

Bunların çoğu hata yakalayıp `showToast` ile bildirir, gerçek stack trace'i gizler.

**Öneri:** 
- Debug modunda hataları console.error ile de logla
- `window.VIZ_SETTINGS.debugMode = true` ile ayrıntılı hata raporlaması etkinleştir

---

## 5. GLOBAL WINDOW BINDINGS

adapters.js tarafından window'a bağlanan başlıca fonksiyonlar:

| Kategori | Fonksiyonlar |
|----------|--------------|
| Export/Import | `exportJSONConfig`, `importJSONConfig`, `exportPortableDashboard`, `exportChartAsSVG`, `exportAsExcel` |
| Sharing | `shareViaURL`, `loadFromURL`, `generateEmbedCode`, `generateQRCode` |
| Collaboration | `joinCollaborationRoom`, `leaveCollaborationRoom`, `sendCollaborationAction` |
| Scheduled | `showScheduledReportsModal`, `createScheduledReport`, `loadScheduledReports` |
| UI Modals | `showPCAModal`, `showClusterModal`, `showCronbachModal`, `showLogisticModal`, `showTimeSeriesModal`, vb. |
| Data | `loadDemoData`, `safeFetch`, `normalizeConfig` |
| Utility | `downloadFile`, `showToast`, `undo`, `redo`, `removeWatermark` |
| Copy | `copyStatAsHTML`, `copyStatAsText`, `copyStatAsImage` |

**State Objects:**
- `VIZ_STATE` - Ana uygulama durumu
- `VIZ_TEXTS` - Çeviri metinleri
- `COLOR_PALETTES` - Renk paletleri
- `HISTORY` - Undo/Redo stack
- `VIZ_SETTINGS` - Backend/network kontrolü
- `OFFLINE_MODE` - Çevrimdışı modu durumu
- `VIZ_COLLAB` - Collaboration durumu
- `__VIZ_MOD` - Lock section referansları

---

## 6. ÖZET VE ÖNERİLER

| Risk | Seviye | Aksiyon |
|------|--------|---------|
| CDN Offline | 🔴 YÜKSEK | CDN'leri local bundle'a taşı veya SW'yu güncelle |
| SW Asset List | 🟢 DÜŞÜK | app.js, visualBuilder.js eklenmeli |
| Lock Masking | 🟡 ORTA | Debug modu ile console.error eklenmeli |
| Node.js | ⚪ BİLGİ | Node kurulumu/PATH kontrolü |

**Değişen Dosya Sayısı: 0** ✅

---

*Bu rapor FAZ-0 denetim aşaması için oluşturulmuştur. Hiçbir kod değişikliği yapılmamıştır.*
