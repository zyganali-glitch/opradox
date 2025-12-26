# OPRADOX PROJECT CONTEXT (REFRESHED)

## VİZYON
Opradox Visual Studio'nun tek parça halindeki `viz.js` dosyasını, modern, yönetilebilir ve modüler bir yapıya (ES6 Modules) dönüştürüyoruz.

## KAYNAK DOSYA
- **`viz_SOURCE.js`**: Tek ve değişmez hakikat kaynağıdır. Tüm kodlar buradan alınacaktır.

## KRİTİK KURALLAR (MÜDÜR NOTLARI)
1. **GLOBAL STATE KORUMASI:** `window.VIZ_STATE` yapısı olduğu gibi korunacak. Modüller bu global nesneye erişmeye devam edecek. State yapısını değiştirmek YASAK.
2. **FONKSİYON KAYBI YOK:** Kaynak dosyadaki 16.000 + satırın her bir mantığı (Logic) yeni dosyalara taşınacak. "Yorum satırı ile geçiştirme" veya "Basitleştirme" KESİNLİKLE YASAK.
3. **SPSS & API:** Backend'e giden (`/viz/ttest`, `/viz/anova` vb.) API çağrıları birebir korunacak.
4. **HTML BAĞIMLILIĞI:** `window.renderChart`, `window.runStatTest` gibi HTML üzerinden (onclick) çağrılan fonksiyonlar, modül içinde tanımlansa bile mutlaka tekrar `window` nesnesine atanmalı (Expose to window).

## HEDEF MİMARİ (KLASÖR: js/modules/)
- `core.js`: Başlatma (init), State tanımları, Event Listener'lar.
- `ui.js`: Modallar, Toast mesajları, DOM manipülasyonu, Tema.
- `data.js`: Dosya yükleme (Excel/CSV), Veri işleme, Filtreleme, Export.
- `charts.js`: ECharts yönetimi, Grafik render, Ayarlar.
- `stats.js`: İstatistik hesaplamaları, SPSS API çağrıları, Audit Trail.
- `advanced.js`: What-If, Anomaly Detection, Smart Insights.