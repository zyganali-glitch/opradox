# SELFTEST Deferred Items

Bu dosya, SELFTEST MASTER PROMPT implementasyonundan ertelenen maddeleri içerir.

## FAZ-ST3 — Parameter Combinations (Deferred)

- [ ] **Comprehensive alpha 0.01/0.10 tests**
  - Tüm istatistiksel testler için `alpha=0.01` ve `alpha=0.10` parametreleriyle golden dataset testleri eklenecek
  - Mevcut testler sadece `alpha=0.05` için yapıldı
  - Her test fonksiyonu için ayrı alpha değerleriyle sonuç doğrulaması gerekli

## FAZ-ST5 — SPSS Output Format (Deferred)

- [ ] **Explicit MS=SS/df validation**
  - ANOVA çıktılarında Mean Square (MS) = Sum of Squares (SS) / degrees of freedom (df) formülünün doğrulanması
  - Two-Way ANOVA ve Repeated Measures ANOVA için bu doğrulama testleri eklenecek
  - SPSS çıktı formatı ile uyumluluk kontrolü

---

**Not:** Bu maddeler core implementasyon tamamlandıktan sonra eklenecektir.

**Dosyalar:**
- `frontend/js/selftest.js`
- `frontend/js/modules/stats.js`

**Tarih:** 2026-01-05
