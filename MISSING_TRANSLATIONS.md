# 🌍 Eksik İngilizce Dil Karşılıkları Raporu

Bu rapor, Opradox projesinin `excel.html` (Excel Studio) ve `viz.html` (Visual Studio) modüllerinde bulunan ve İngilizce dil desteği olmayan (hardcoded Türkçe) öğeleri listeler.

---

## 1. 📗 Excel Studio & Rapor Stüdyosu PRO (`excel.html` & `app.js`)

### 🚩 UI Metinleri (HTML İçinde Hardcoded)
*   **Bilgi Notları:**
    *   `gm-info-note` (Satır 136): "💡 İşlem sayfasının başında birleştirilmiş hücrelerden oluşan başlık varsa..." (Tamamen Türkçe).
    *   Dosya yükleme alanı (Satır 129): "Ana Dosya Seç" (data-i18n var ama default text TR).
    *   İkinci dosya alanı: `gm-second-file-toggle` içindeki "İkinci Dosya Ekle" metni.
    *   Senaryo formu boş durumu: "Seçim Bekleniyor..." (`dynamicFormContainer` içi).
*   **Feedback Widget:**
    *   Başlık: "Bu sonuç işinize yaradı mı?"
    *   Placeholder: "İsminiz (opsiyonel)", "Görüşünüz..."
*   **Sonuç Alanı:**
    *   JSON önizleme: "// Sonuçlar burada görünecek."

### 🚩 Tooltip & Başlıklar (`title` öznitelikleri)
*   **Header Butonları:**
    *   Yardım butonu: `title="Kullanım Kılavuzu"`
    *   Logo: `title="Hub'a Dön"`
*   **Senaryo Kartları:** JavaScript ile oluşturulan kartlarda `card.title` genellikle Türkçe başlık ve açıklama içeriyor (DB'den gelen `title_tr` kullanılıyor olabilir, kontrol edilmeli).
*   **Feedback Butonları:** `title="Teşekkür"`, `title="Öneri"`, `title="Yorum"`.

### 🚩 JavaScript Mesajları (`app.js` Toast & Log)
*   **Toast Bildirimleri (Pop-up):**
    *   Link kopyalama: "Link kopyalandı"
    *   Özet kopyalama: "Özet kopyalandı"
    *   Kod kopyalama: "Kod kopyalandı!" (Kısmen dilli ama kontrol edilmeli).
    *   Senaryo listesi: "Yeni senaryo için listeden seçim yapın".
*   **E-posta Paylaşımı:** Konu ve içerik hardcoded olabilir (`Opradox Result` ingilizce, ama body kısmı kontrol edilmeli).

---

## 2. 📊 Visual Studio (`viz.html`)

Bu sayfa geliştirme aşamasında olduğu için **çok sayıda** eksik çeviri bulunmaktadır.

### 🚩 Butonlar & Araç Çubuğu (En Kritik Bölüm)
Aşağıdaki butonların neredeyse tamamı **sert kodlanmış (hardcoded) Türkçe** isimlendirmeye sahiptir:

*   **İstatistik Analizleri:**
    *   `Korelasyon` (Correlation)
    *   `Normallik` (Normality)
    *   `Betimsel` (Descriptive)
    *   `Frekans` (Frequency)
    *   `Zaman Serisi` (Time Series)
    *   `APA Raporu` (APA Report)
    *   `Sağkalım` (Survival)
    *   `Regresyon` (Regression)
    *   `Güç Analizi` (Power Analysis)
*   **Veri Yönetimi Araçları:**
    *   `Filtrele` (Filter)
    *   `Sırala` (Sort)
    *   `Profil` (Profile)
    *   `Eksik Doldur` (Fill Missing)
    *   `Aykırı Temizle` (Remove Outliers)
    *   `Kopyaları Sil` (Remove Duplicates)
    *   `Tip Dönüştür` (Convert Type)
    *   `Kolon Birleştir` (Merge Columns)
    *   `Kolon Böl` (Split Column)
    *   `Bul/Değiştir` (Find & Replace)
    *   `Hesaplanan` (Calculated Column)
    *   `URL'den Yükle` (Load from URL)
    *   `Dosya Ekle` (Add File)
*   **Özel Grafikler:**
    *   `Kelime Bulutu` (Word Cloud)
    *   `Takvim` (Calendar)
    *   `Mum` (Candlestick)
    *   `Yoğunluk` (Density)
    *   `Şelale` (Waterfall)
    *   `Isı Haritası` (Heatmap)
    *   `Gösterge` (Gauge)

### 🚩 Boş Durum & Yönlendirme Mesajları
*   **Canvas:**
    *   `Dashboard'unuz Boş` (Empty Dashboard)
    *   `Sol taraftan grafik tipini sürükleyin...` (Drag chart type from left...)
    *   `CANLI` rozeti (LIVE)
*   **Ayarlar Paneli:**
    *   `Düzenlemek için bir grafik seçin` (Select a chart to edit)
*   **Sütun Listesi:**
    *   `Veri yükleyin` (Load data)

### 🚩 Form Elemanları ve Dropdownlar
*   **Dosya Yükleme:**
    *   `Excel dosyası sürükleyin` (Drag Excel file)
    *   `.xlsx, .xls, .csv dosyaları desteklenir` (Supported files...)
*   **Seçiciler:**
    *   Sayfa Seçimi: `<option>Sayfa seçin...</option>` (Select sheet...)
    *   Başlık Satırı: "1. Satır", "2. Satır"... (Row 1, Row 2...)
*   **Grafik Ayarları:**
    *   `Renk` (Color)
    *   `Başlık...` (Placeholder)
    *   `Scatter için çoklu X seçimi aktif` (Hint)
    *   `Ctrl+Click ile çoklu seçim` (Hint)
    *   `İkinci seriyi sağ eksende göster` (Checkbox)
    *   `Otomatik (seçilen 2. sütun)` (Dropdown option)

### 🚩 Diğer Araçlar
*   **Yardım & Dışa Aktarım:**
    *   `Rapor Ayarları` (Report Settings)
    *   `Video Yardım` (Video Help)
    *   `Notlu Export` (Export with Annotations)
    *   `Watermark` (Watermark)
*   **Kaydet butonları:** `Kaydet` (Save), `Export` (Export).

---

## Özet & Öneri
Visual Studio (`viz.html`), Excel Studio'ya kıyasla **çok daha az** yerelleştirilmiştir. Özellikle butonlar ve ipucu metinleri tamamen Türkçe bırakılmıştır. 

**Öneri:** `EXTRA_TEXTS` sözlüğüne `viz_` önekiyle tüm bu terimlerin İngilizcelerini ekleyip, `data-i18n` özniteliklerini HTML elementlerine tanımlamak gerekmektedir.
