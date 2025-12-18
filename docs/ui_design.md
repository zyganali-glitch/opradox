# opradox - UI/UX Tasarım ve Genişleme Planı

Kullanıcının paylaştığı ekran görüntüsüne (Screenshot) ve yeni gereksinimlere (PDF, Word, PPT) dayanarak oluşturulan arayüz genişleme stratejisidir.

**Temel Kural:** Mevcut tasarımın (Renk paleti, 3 sütunlu yapı, yazı tipleri, kart yapısı) %100 korunacak. Sadece yeni modüller için "gezinme" (navigation) eklenecek.

## 1. Mevcut Tasarım Analizi
Ekran görüntüsündeki yapı şu şekildedir:
*   **Sol Sütun (Aksiyon):**
    *   **1. Dosyanı Yükle:** Dosya seçme alanı (Drag & Drop).
    *   **2. Senaryonu Seç:** Arama çubuğu ve senaryo listesi (Accordion/Liste yapısı).
*   **Orta/Sağ Geniş Alan (İşlem & Sonuç):**
    *   **Parametre Formu:** Seçilen senaryoya göre değişen input alanları (Örn: "Sütun Adı").
    *   **Aksiyon Butonu:** Hemen formun altında "Senaryoyu Çalıştır".
    *   **Sonuç Alanı:** İşlem çıktısının gösterildiği yer.
    *   **Alt Bilgi:** Mini Kullanım Kılavuzu.

## 2. Modüler Genişleme Stratejisi
Arayüzü bozmadan PDF, Word gibi yeni araçları eklemek için "Kategori Değiştirici" (Category Switcher) ekleyeceğiz.

### Öneri A: "Modül Sekmeleri" (Module Tabs)
"1. Dosyanı Yükle" kutusunun hemen üzerine veya "2. Senaryonu Seç" başlığının altına yatay, zarif bir sekme yapısı eklenir.

*   `[ 🟩 Excel ]` `[ 🟥 PDF ]` `[ 🟦 Word ]` `[ 🟧 PPT ]`
*   **Nasıl Çalışır?**
    *   Kullanıcı **PDF** sekmesine basarsa, "2. Senaryonu Seç" listesindeki Excel senaryoları gider, yerine "PDF Birleştir", "PDF Böl" seçenekleri gelir.
    *   Renkler, markanın kurumsal yapısına uygun (mevcut mor/bordo tonlarıyla uyumlu) mat renkler olur.

### Karar Verilen Navigasyon: Hibrit (Hybrid) ✅
Kullanıcı onayı ile **Hem Sekmeler Hem Akıllı Algılama** kullanılacak.
1.  **Sekmeler:** Kullanıcı manuel olarak modül (Excel/PDF/Word) seçebilir.
2.  **Auto-Detect:** Kullanıcı dosya sürüklediğinde (örn: .pdf), sistem otomatik olarak ilgili sekmeye ve senaryo listesine geçiş yapacak.

## 3. Akış Revizyonu (Workflow)

Yeni özellikler (PDF Merge vb.) için "Dosya Yükleme" alanının biraz "akıllanması" gerekiyor.

#### A. Çoklu Dosya Yükleme (Multi-Upload)
Mevcut kutu muhtemelen tek dosya alıyor. PDF Birleştirme için burayı:
*   *"Dosyaları buraya bırakın (Birden fazla seçebilirsiniz)"* şeklinde güncelleyeceğiz.
*   Seçilen dosyalar küçük "chip"ler (etiketler) halinde kutunun altında listelenecek. `[Rapor1.pdf x]`, `[Tablo.pdf x]`

#### B. Mobil & Kamera Butonu
Masaüstündeki 3 sütunlu yapı, mobilde tek sütuna (alt alta) dönecek.
*   **Kamera Butonu:** "Dosya Yükle" alanının hemen yanına eklenecek.
*   **Açıklama:** Kullanıcı ne olduğunu anlasın diye altında veya yanında küçük fontla: *"veya kamerayla tara"* (TR) / *"or scan with camera"* (EN) yazacak.

## 4. Renk, Stil ve Dil (Style & Language)
Mevcut screenshot'taki renkler (Bordo/Mor başlıklar, Açık mavi arka planlar, Dark/Light tema) korunacak.
*   **Çoklu Dil Desteği (Multi-Language):**
    *   Sistem tamamen **Türkçe ve İngilizce** uyumlu olacak.
    *   Tüm UI metinleri (Label, Placeholder, Button, Hata Mesajları) bir dil dosyasından (JSON/JS Object) çekilecek.
    *   Dil değiştirme butonu ile sayfa yenilenmeden metinler güncellenecek.
