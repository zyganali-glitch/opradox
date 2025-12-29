# 🚀 TODO: Visual Query Builder Integration (Oyun Hamuru PRO)

Bu döküman, Opradox'un en güçlü motoru olan `custom_report_builder_pro.py`'ın tüm yeteneklerini kullanıcıya sürükle-bırak bir arayüzle sunmak için hazırlanan stratejik yol haritasıdır.

## 🎯 Vizyon
Kullanıcının Excel formülleriyle boğuşması yerine, "Aksiyon Blokları"nı (Filtre -> Pivot -> Grafik) bir zincir gibi dizerek kendi özel raporunu "kod yazmadan" oluşturmasını sağlamak.

---

## 📋 Görev Listesi

### 1. UI/UX Hazırlık
- [ ] `excel.html` üzerindeki senaryo kartlarının yanına "Özel Rapor Oluşturucu" girişini ekle.
- [ ] Canvas (Çalışma Alanı) arayüzü tasarla:
    - Sol: Aksiyon Kütüphanesi (Bloklar)
    - Orta: İşlem Zinciri (Pipeline)
    - Sağ: Blok Ayarları & Değişkenler
- [ ] Mobil uyumluluk için sürükle-bırak yerine "Tıkla-Ekle" alternatifini geliştir.

### 2. Blok Geliştirme (Engine Bridge)
- [ ] **Filtre Blokları:** `custom_report_builder_pro` içindeki 12+ operatörü UI elementlerine bağla.
- [ ] **Lookup & Join Blokları:** `merge`, `union`, `diff` aksiyonları için "Dosya Seçici" entegre et.
- [ ] **Matematik Motoru:** `computed_column` için basit bir formül editörü (Suggest: Math.js veya Row expressions).
- [ ] **Pivot & Analiz:** Satır, sütun ve değer seçimlerini görsel picker-lara dönüştür.

### 3. Dinamik JSON Pipeline
- [ ] Canvas üzerindeki dizilimi `actions: []` listesine çeviren `PipelineExporter` sınıfını yaz.
- [ ] Hata yakalama: Zincirde birbirine uymayan veri tiplerini (örn: Sayı bekleyen yere Metin gelmesi) görsel olarak işaretle.

### 4. What-If & Simülasyon
- [ ] "Global Değişkenler" panelini aktive et.
- [ ] Kullanıcı bu panelden bir değeri (örn: Kur, Faiz, Hedef) değiştirdiğinde tüm pipeline-ın yeniden tetiklenmesini sağla.

### 5. Şablon Sistemi (Marketplace Hazırlığı)
- [ ] Kullanıcıların oluşturduğu bu görsel zincirleri `.oprdx` uzantısıyla veya JSON olarak kaydedip paylaşabilmesini sağla.
- [ ] "En Çok Kullanılan Zincirler" galerisi oluştur.

---

## 🛠️ Teknik Gereksinimler
- **Frontend:** Vanilla JS Modülleri (Mevcut yapı korunacak).
- **Backend:** `custom_report_builder_pro.py` (Değişiklik gerektirmez, sadece parametre bekliyor).
- **Kütüphane Önerisi:** `Sortable.js` (Hız ve hafiflik için).

---
*Bu dosya, Opradox projesinin değerini 10x artırmak amacıyla oluşturulmuştur.*
