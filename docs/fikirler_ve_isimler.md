# opradox - Geliştirme ve İsimlendirme Fikirleri

Bu belge, opradox projesini bir "Ofis İsviçre Çakısı"na dönüştürmek için beyin fırtılası yaptığımız özellik senaryolarını ve proje için yeni isim/domain önerilerini içerir.

## 🚀 Yeni Özellik Senaryoları (Feature Scenarios)

Mevcut Excel yeteneklerine ek olarak, aşağıdaki PDF ve Word otomasyonlarını sisteme entegre edebiliriz:

### 1. PDF İmparatorluğu (PDF Tools)
*   **PDF Birleştirme (Merge):** Birden fazla PDF dosyasını tek bir dosyada birleştirme. (Örn: Farklı departman raporlarını birleştirme)
*   **PDF Bölme/Ayıklama (Split/Extract):** Büyük bir rapordan belirli sayfaları ayıklayıp yeni PDF yapma.
*   **PDF to Image / Image to PDF:** Taranmış evrakları PDF'e veya PDF sayfalarını sunumlar için JPG/PNG'ye çevirme.
*   **Filigran Ekleme (Watermark):** Kurumsal kimlik veya "GİZLİDİR" ibaresi ekleme.
*   **PDF Sıkıştırma (Compress):** E-posta kotalarına takılmamak için dosya boyutunu küçültme.
*   **Şifre İşlemleri:** PDF şifreleme veya (şifresi bilinen) dosyaların kilidini açma.
*   **PDF to Word/Excel:** Tablo içeren PDF'leri Excel'e, metin ağırlıklı olanları Word'e çevirme.
*   **Sayfa Döndürme/Sıralama:** Yan duran sayfaları düzeltme veya sırasını değiştirme.

### 2. Gelişmiş Excel Büyücülüğü (Advanced Excel)
*   **Akıllı Sayfa Ayırıcı (Sheet Splitter):** "Tüm Şubeler" verisini içeren ana dosyayı, tek tıkla her şube için ayrı Excel dosyalarına bölme.
*   **Evrensel Dönüştürücü:** Excel verilerini yazılımcılar için JSON, XML, SQL veya CSV formatına çevirme.
*   **KVKK Anonimleştirici:** İsim, TC Kimlik, Telefon gibi sütunları otomatik maskeleme (*yıldızlama*).
*   **Tablo Karşılaştırıcı:** İki Excel dosyası arasındaki farkları bulup raporlama.
*   **Veri Temizleyici:** Yinelenen satırları (duplicates) silme, baştaki/sondaki boşlukları (trim) temizleme.

### 3. Word & Belge Otomasyonu
*   **Toplu Belge Üretici (Mail Merge 2.0):** Excel listesindeki her satır için bir Word şablonunu (Sözleşme, Davetiye, Sertifika) doldurup ayrı dosyalar oluşturma.
*   **Belge Temizleyici:** Word dosyasındaki tüm yorumları, değişiklik izleme (track changes) geçmişini tek tıkla temizleme.
*   **Markdown/HTML to Word:** Blog yazılarını veya web içeriklerini düzgün formatlı Word belgesine çevirme.

### 4. PowerPoint (Sunum) Sihirbazı
*   **PPTX to PDF:** Sunumları dağıtılabilir PDF'e çevirme.
*   **Görsel Ayıklayıcı:** Sunum içindeki tüm resimleri tek seferde klasör olarak indirme.
*   **Not Çıkarıcı:** Slayt altındaki "Konuşmacı Notlarını" metin dosyası olarak ayıklama.
*   **Slayt Birleştirici:** Farklı sunum dosyalarını uç uca ekleme.


---

## 🏷️ İsim ve Domain Önerileri (Naming & Domains)

Projenin kapsamı genişlediği için "Grid" (Izgara/Excel) kökünü koruyarak veya daha kapsayıcı isimlere yönelerek şu seçenekleri değerlendirebiliriz:

### Modern & Teknolojik
*   **OmniFile:** (Omni = Her şey) Her türlü dosyayı yöneten araç.
    *   *Öneri:* `omnifile.io`, `omnifile.app`
*   **DocuFlow:** Belge akışını ve dönüşümünü vurgular.
    *   *Öneri:* `docuflow.net`, `docuflow.io`
*   **GridSmith:** Veriyi işleyen usta/demirci.
    *   *Öneri:* `gridsmith.co`
*   **DataWeave:** Verileri ve dosyaları birbirine dokuyan/işleyen.

### Yaratıcı & Havalı
*   **OfficeAlchemist:** Ofis dosyalarını altına dönüştüren simyacı. (Favorim! 🧙‍♂️)
*   **FileVantage:** Dosyalar üzerinde üstünlük/avantaj sağlayan.
*   **DocuMorph:** Belgeleri dönüştüren, şekil değiştiren.

### "Medic" Temasını Koruyanlar
*   **DocuMedic:** Sadece ızgara (grid) değil, tüm dökümanların doktoru.
*   **FileClinic:** Dosya kliniği.

---

## 📱 Mobil Geliştirme ve Rakipler (Mobile & Competitors)

### Rakip Analizi (SmallPDF & PDF24)
Gönderdiğin siteleri (SmallPDF, PDF24) inceledim. Bizim projemiz bu özelliklerin **tamamını** ve daha fazlasını (özelleşmiş Excel motorları sayesinde) yapabilir.

1.  **SmallPDF:** Kullanıcı dostu arayüz ve bulut entegrasyonu ile öne çıkıyor. Mobil uygulaması var.
2.  **PDF24:** Tamamen ücretsiz ve çok geniş araç seti sunuyor. Masaüstü uygulaması var.

**Bizim Farkımız:**
*   İkisinin birleşimi + **Gelişmiş Excel Otomasyonu**.
*   Tamamen tarayıcı tabanlı (kurulumsuz) ama **uygulama gibi çalışan (PWA)** yapı.

### Mobilde "Kameradan Tarama" ve Galeri (Mobile Scan & Upload)
Kullanıcılar hem **canlı kamera** ile çekim yapabilir hem de **galerideki kayıtlı fotoğrafları** yükleyebilir.

1.  **Format Seçeneği:** "Tara ve [X] Yap" diyebileceğiz.
    *   **Tara -> PDF:** Standart belge tarama.
    *   **Tara -> Word:** OCR (Yazı Tanıma) ile resimdeki metinleri Word'e dökme.
    *   **Tara -> Excel:** Tablo içeren kağıtları Excel'e çevirme. (Not: Karışık tablolar için Python kütüphaneleri %80-90 başarıyla çalışır, mükemmel olması zordur ama iş görür).

### PWA'dan APK'ya Dönüşüm (Native App)
Sistemi önce **PWA (Web Uygulaması)** olarak kurmak en kolayıdır. Ancak istersen bunu **APK'ya çevirmek ZOR DEĞİLDİR.**
*   **Capacitor / Cordova:** Hazırladığımız web sitesini "paketleyip" marketlere koyulacak APK dosyasına çeviren araçlar var.
*   **Strateji:** Önce siteyi oturtalım, sistem tıkır tıkır çalışınca 1-2 gün içinde bunu paketleyip APK haline getirebiliriz. Sıfırdan kod yazmaya gerek yok!

---


## 🏗️ Teknik Analiz ve Maliyet (Architecture & Costs)

Projeyi tamamen **açık kaynaklı (open-source)** ve **ücretsiz** kütüphaneler üzerine kuracağız. Harici API (OpenAI, Adobe API vb.) kullanılmayacağı için **lisans/API maliyeti 0 TL** olacaktır.

### Kullanılacak "Ücretsiz" Motorlar
*   **Excel:** `pandas`, `openpyxl`, `xlsxwriter`
*   **PDF:** `pypdf`, `pdf2image`, `reportlab`
*   **Word:** `python-docx`
*   **PowerPoint:** `python-pptx`
*   **Resim/OCR:** `Pillow` (Tesseract OCR gerekirse sunucuya kurulabilir, ücretsizdir ama CPU yorar).

### Sunucu ve Maliyet Tahmini
Kullanıcıdan ücret almayacağınız için sunucu maliyeti önemlidir. Bu tür işlem ağırlıklı (CPU intensive) projeler için:

1.  **Başlangıç (MVP) Seviyesi:**
    *   **Donanım:** 2 vCPU, 4GB RAM (DigitalOcean, Hetzner, AWS Lightsail vb.)
    *   **Maliyet:** Aylık yaklaşık **$10 - $20**.
    *   **Kapasite:** Aynı anda 5-10 kişi *ağır işlem* (büyük PDF çevirme vb.) yapabilir. Basit Excel işlemlerini 50+ kişi aynı anda yapabilir.
    *   **Disk:** Kullanıcı dosyalarını işledikten hemen sonra silersek (ephemeral storage), ekstra disk maliyeti olmaz.

2.  **Ölçeklenme (Kullanıcı Artarsa):**
    *   Python doğası gereği biraz yavaştır. Kullanıcı sayısı artarsa (örn: aynı anda 100 kişi), bir "kuyruk sistemi" (Celery/Redis) kurmamız gerekir.
    *   Kullanıcı "Dosyanız hazırlanıyor, sırada 3. kişisiniz" mesajı görür.
    *   Bu yapı ile $20'lık sunucu bile binlerce günlük kullanıcıyı idare eder, sadece bekleme süreleri uzar. **Sistem çökmez.**

### Özet Strateji
*   **API Ücreti:** Yok.
*   **Yazılım:** Tamamen ücretsiz Python kütüphaneleri.
*   **Sunucu:** Aylık ~15$ (Başlangıç).
*   **Dayanıklılık:** Kuyruk yapısı ile sunucuyu kilitlemeden sınırsız istek karşılama.


---
**Sonraki Adımlar:**
Dosyalar yüklendikten sonra bu özelliklerden hangilerine öncelik vereceğimizi seçip `implementation_plan.md` dosyamızı oluşturabiliriz.
