# OPRADOX VISUAL STUDIO TODO LIST

Son Güncelleme: 2026-01-04
Durum: FAZ-7 Tamamlandı, FAZ-9 Sırada

## ✅ Tamamlananlar
- [x] **FAZ-1 — BASELINE SNAPSHOT:** Kaçış önleme ve sistem yedekleme.
- [x] **FAZ-5 — TOAST SİSTEMİ MERKEZİLEŞTİR:** Toast mesajları tek merkezden yönetiliyor, stil ve renkler Excel Studio ile eşitlendi.
- [x] **GATE-1.5 — BASELINE UI EVIDENCE:** UI bütünlüğü doğrulandı.
- [x] **FAZ-2 — PARSE / SYNTAX STOPPER SIFIRLAMA:** Kritik JS hataları giderildi.
- [x] **FAZ-3 — DOUBLE-LOAD / MODULE INIT TEKİLLEŞTİRME:** Modüllerin çift yüklenmesi engellendi.
- [x] **FAZ-4 — BUTONLARIN DİRİLTİLMESİ:** Visual Studio butonları aktif hale getirildi.
- [x] **FAZ-6 — DİL MOTORU TUTARLILIĞI:** `getText` ve dil değişimi (TR/EN) doğrulandı.
- [x] **FAZ-7 — MOJIBAKE TEMİZLİĞİ:** Dosyalardaki karakter kodlama hataları (DeÄŸiÅŸken vb.) giderildi. `stats.js` ve `app.js` temizlendi.
- [x] **FAZ-8 — EKSİK FONKSİYONLAR:** `interpretCohensD` ve `interpretEtaSquared` tanımları geri yüklendi.

## 🚀 Sırada (Yarınki İşler)
- [ ] **FAZ-9 — SPSS-LEVEL OUTPUT STANDARDI:** Çıktı formatlarının (CSS tabloları, hizalama) SPSS standardına getirilmesi.
- [ ] **FAZ-10 — EFFECT SIZE KALİTE:** Cohen's d, Eta Squared vb. hesaplamalarının doğrulanması.
- [ ] **FAZ-11 — MISSING DATA NOTLARI:** Akademik raporlarda eksik veri analizi notlarının eklenmesi.
- [ ] **FAZ-12 — DINAMİK SOL PANEL:** Sol paneldeki veri düzenlemelerinin anlık olarak grafiklere yansıması.
- [ ] **FAZ-13 — DASHBOARD "EN İLERİ":** Dashboard navigasyon iyileştirmeleri.
- [ ] **FAZ-14 — EXPORT / KAYDET:** Çıktıların PDF/Excel olarak indirilmesi.

## 📝 Notlar
- `stats.js` ve `app.js` dosyaları temiz bir Git commitinden restore edildi.
- Dil motoru çalışıyor ancak bazı hardcoded metinler (Export butonu, Dashboard başlığı) minör düzeltme gerektirebilir.
