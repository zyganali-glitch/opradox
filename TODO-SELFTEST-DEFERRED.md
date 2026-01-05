# SELFTEST Deferred Items

Bu dosya, SELFTEST MASTER PROMPT implementasyonundan ertelenen maddeleri içerir.

## FAZ-ST3 — Parameter Combinations (✅ COMPLETED)

- [x] **Comprehensive alpha 0.01/0.10 tests**
  - ✅ Alpha=0.01 testleri: t-tests, ANOVA, Chi-Square, Correlation (8 test)
  - ✅ Alpha=0.10 testleri: t-tests, ANOVA, Chi-Square (6 test)
  - `selftest.js` kategori: `L-AlphaParams`

## FAZ-ST5 — SPSS Output Format (✅ COMPLETED)

- [x] **Explicit MS=SS/df validation**
  - ✅ One-Way ANOVA: MS_between ve MS_within doğrulaması
  - ✅ Two-Way ANOVA: factorA, factorB, interaction, error MS doğrulaması
  - ✅ Repeated Measures ANOVA: treatment MS doğrulaması
  - `selftest.js` kategori: `M-SPSSFormat`

---

**Not:** Bu maddeler core implementasyon tamamlandıktan sonra eklenecektir.

**Dosyalar:**
- `frontend/js/selftest.js`
- `frontend/js/modules/stats.js`

**Tarih:** 2026-01-05
