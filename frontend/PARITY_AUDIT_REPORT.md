# Parity Auditor Raporu: Opradox Viz Modüler Dönüşüm

## 3.1 Executive Summary

**Durum Özeti:**
Modüler dönüşüm (`frontend/js/modules/*.js`) incelendiğinde, mimarinin `adapters.js` üzerinden sağlanan **alias (takma ad)** ve **stub (yer tutucu)** yapılarıyla ayakta tutulduğu görülmüştür. Sistem, `viz.html`'in çökmesini engellemek için gerekli API imzalarını korumaktadır; ancak **veri görüntüleme (Grid)**, **veri dışa aktarma (Export)** ve **ileri istatistik/grafik** fonksiyonlarında %40'a varan işlevsel kesinti (regresyon) mevcuttur.

**Tespit İstatistikleri:**
*   **Missing (Kayıp):** 0 (Tüm çağrılar `adapters.js` ve `core.js` tarafından maskelenmiştir)
*   **Stub (Yer Tutucu):** 16+ adet kritik fonksiyon (Sadece toast mesajı veren veya boş değer dönen).
*   **Summarized (Özetlenmiş):** 2 adet (Grafik Ayarları Paneli ve State Yönetimi).
*   **API-Signature-Diff:** 0 (`adapters.js` imzaları karşılamaktadır).

**En Kritik 10 Kayıp / Stub:**
1.  **VirtualScrollTable (KRİTİK):** `adapters.js` içinde sınıf tanımlı ancak `init()` ve `render()` metodları **boş**. Veri yüklense bile ekranda tablo oluşmayacak.
2.  **Excel Export:** `exportAsExcel` fonksiyonu sadece "Geliştirilmekte" uyarısı veriyor.
3.  **PowerPoint Export:** `exportAsPowerPoint` stub.
4.  **Advanced Charts:** Violin, Sparkline, Dot Plot, Percent Stacked Bar grafik tipleri stub.
5.  **Correlation Matrix:** `calculateCorrelationMatrix` fonksiyonu boş dizi `[]` dönüyor.
6.  **Regression Coefficients:** Fonksiyon boş obje `{}` dönüyor.
7.  **Collaboration:** "Demo Mode" uyarısı veriyor, backend lojistiği yok.
8.  **Chart Settings:** `ui.js` sadece temel ayarları (Title, Axis, Color) içeriyor; kaynak dosyadaki detaylı ayarlar (Legend, Grid, Zoom) eksik.
9.  **Kaplan-Meier:** İstatistiksel analiz stub.
10. **Help/Examples:** İçerik aktarılmamış.

---

## 3.2 Evidence Matrix

| Feature / Fonksiyon | Source Evidence (viz_SOURCE.js Referans) | Modular Status | Modular Evidence (Dosya:Satır) | UI Reachability | Impact | Regression Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VirtualScrollTable** | Grid Rendering Logic | **STUB** | `adapters.js:39` - Class metodları boş. | Main Data Grid | **Kritik** (Veri Görünmez) | High | `DataGrid` implementasyonu ekle. |
| **Excel Export** | Export Logic | **STUB** | `adapters.js:689` - Toast Mesajı. | Export Menu | **High** (Data Lock) | High | `SheetJS` entegrasyonu. |
| **Violin Plot** | Chart Rendering Logic | **STUB** | `adapters.js:707` - Toast Mesajı. | Chart Picker | **Med** (Analiz Kaybı) | Med | ECharts custom series ekle. |
| **Correlation Matrix** | Stat Calculation | **STUB** | `adapters.js:723` - Returns `[]`. | Stats Panel | **High** (Yanlış Sonuç) | High | Hesaplama modülünü tamamla. |
| **Chart Settings** | Complex Config Pane | **SUMMARIZED** | `ui.js:100` - Sadece Title/Axis/Color. | Right Panel | **High** (UX Kaybı) | High | Formu zenginleştir. |
| **Collaboration** | Socket.io Logic | **STUB** | `adapters.js:697` - Toast Mesajı. | Top Bar | **High** (Multi-user) | High | Backend gerekliliğini not düş. |
| **PPT Export** | PPT Gen Logic | **STUB** | `adapters.js:690` - Toast Mesajı. | Export Menu | **Med** (Raporlama) | Med | Defer. |
| **Annotation Mode** | Fabric.js Logic | **OK/RISK** | `ui.js:650` - Logic var ama `fabric` objesi kontrol ediliyor. | Toolbar | **Low** | Low | Fabric.js yüklü mü? |
| **Word Cloud** | Chart Logic | **STUB** | `adapters.js:699` - Toast Mesajı. | Chart Picker | **Low** | Low | Defer. |
| **Scheduled Reports** | Timer UI | **STUB** | `adapters.js:698` - Toast Mesajı. | Menu | **Low** | Low | Defer. |

---

## 3.3 Call Graph & Ownership Map

**1. Data Loading & Grid Rendering (KIRIK AKIŞ):**
*   **Source:** `fileInput` -> `parseData` -> `VirtualScrollTable.render()`
*   **Modular:** `viz.html` -> `adapters.js` (`handleFileSelect`) -> `core.js` (`addDataset`) -> **`VirtualScrollTable.render()` (BOŞ)** -> *UI Update Failed*.
*   *Sonuç:* Veri state'e girer, konsolda görünür ancak kullanıcı tabloda göremez.

**2. Chart Creation:**
*   **Source:** `addChart` -> Logic -> `echarts.init`
*   **Modular:** `ui.js` -> `window.addChart` -> `core.js` (State) -> `charts.js` (Varsayılan).
*   *Not:* `adapters.js` L197'de `window.createChartWidget` aranıyor. Bu fonksiyon `charts.js` içinde tanımlı olmalı. Logic akışı doğru görünüyor (Stub hariç grafikler için).

**3. Settings & Configuration:**
*   **Source:** UI Change -> `updateModel` -> `render`
*   **Modular:** `ui.js` (`applyChartSettings`) -> `VIZ_STATE` Update -> `renderChart`.
*   *Özet:* Akış çalışır ancak sadece `ui.js`'in tanıdığı kısıtlı parametreler (X, Y, Renk) güncellenir. Legend'ı kapatmak isteyen kullanıcı bunu yapamaz.

---

## 3.4 UI Binding Audit

`viz.html` üzerindeki elementler ve `adapters.js`/`ui.js` karşılıkları:

| UI Element | Binding | Durum | Risk |
| :--- | :--- | :--- | :--- |
| `onclick="exportAsExcel()"` | `adapters.js` | **STUB** | Buton işlevsiz (Mesaj veriyor). |
| `onclick="renderViolinPlot()"` | `adapters.js` | **STUB** | Seçim işlevsiz. |
| `onclick="saveDashboard()"` | `ui.js` | **OK** | Çalışır. |
| `onclick="toggleTheme()"` | `core.js` | **OK** | Çalışır. |
| `onclick="showCollaborationModal()"` | `adapters.js` | **STUB** | Mesaj veriyor. |
| `id="vizCanvas"` | `ui.js` (Annotation) | **OK** | Eğer Fabric.js yoksa mesaj verir. |
| `id="vizSettingsForm"` | `ui.js` | **PARTIAL** | Tüm inputlar map edilmemiş. |

---

## 3.5 State & Side-Effects Audit

**State (`core.js` - VIZ_STATE):**
*   **Datasets:** `VIZ_STATE.datasets` yapısı ile çoklu dosya desteği (**Improvement**).
*   **History:** Undo/Redo yapısı mevcut (**OK**).
*   **Eksik:** `VIZ_STATE.rightPanel` (Panelin açık/kapalılığı, seçili tab state'i yok). Sayfa yenilenince veya Undo işleminde panelin UI durumu geri gelmez.

**Side-Effects:**
*   **LZString:** `shareViaURL` (`adapters.js` L388) `LZString` nesnesine ihtiyaç duyar. Eğer HTML'de import edilmediyse buton hataya düşer.
*   **Fabric.js:** `toggleAnnotationMode` (`ui.js` L679) `fabric` nesnesi arar. Yoksa hata mesajı döner.
*   **Memory:** `exportPortableDashboard` (`adapters.js` L237) tüm dashboard verisini string'e çevirip Blob yapar. Çok büyük datasetlerde tarayıcıyı dondurabilir.

---

## 3.6 Risk-ranked Recommendations

**P0: Kritik (Sistem Çalışmaz & Veri Kaybı):**
1.  **VirtualScrollTable Implementasyonu:** `adapters.js` içindeki sınıfın `render` metodunu acilen doldurun. Basit bir HTML tablosu çizse bile veri görünür olmalı. Aksi halde ürün kullanılamaz.
2.  **Excel Export Fix:** `exportAsExcel` fonksiyonuna `SheetJS` veya basit CSV Blob indirme mantığı ekleyin. Data lock-in (veri hapsi) kullanıcı güvenini sıfırlar.

**P1: Yüksek (UX ve Fonksiyonel Eksiklik):**
1.  **Stub Temizliği:** "Geliştirilmekte" mesajı veren butonları (`Violin`, `PPT`, `Scheduled Reports`) `viz.html` veya CSS üzerinden gizleyin. Bozuk ürün algısı yaratır.
2.  **Chart Settings Zenginleştirmesi:** `ui.js` panelini `viz_SOURCE` seviyesine yaklaştırın (Legend, Grid, Tooltip ayarları).
3.  **Dependency Check:** `LZString` ve `Fabric.js` kütüphanelerinin `viz.html`'de yüklü olduğundan emin olun.

**P2: Orta (Enterprise Features):**
1.  **Advanced Charts:** İleri seviye grafik tipleri için `charts.js` konfigürasyonlarını ekleyin.
2.  **Correlation Matrix:** İstatistiksel hesaplamayı implemente edin (boş dizi dönüyor).
3.  **Collaboration:** Butonu tamamen kaldırın veya "Demo" olarak işaretleyin.
