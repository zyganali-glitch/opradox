# Stat Motors - TODO (2025-12-29)

## ❌ Bekleyen Sorunlar

### 1. Eksik Veri Akademik Notu Düzgün Çalışmıyor
- **Sorun:** Doldurma işlemi sonrası widget'ta note hala "undefined" gösteriyor
- **Sebep:** VIZ_STATE.dataActions düzgün okunmuyor veya action objeleri eksik field içeriyor
- **Çözüm Önerisi:** 
  - Console.log ile VIZ_STATE.dataActions içeriğini debug et
  - fillResults array'inin doğru doldurulduğunu kontrol et
  - Action oluşturma anında fillValue'nun doğru hesaplandığını doğrula

### 2. Bazı Stat Widget'ları Çalışmıyor
- **Test Edilecekler:**
  - [ ] Power Analysis
  - [ ] Friedman Test
  - [ ] PCA
  - [ ] Factor Analysis
  - [ ] Cluster Analysis
  - [ ] Logistic Regression
  - [ ] Discriminant Analysis
  - [ ] Survival Analysis
  - [ ] Reliability (Cronbach's Alpha)

---

## ✅ Bugün Tamamlananlar

### P1.3 - X/Y Diagnostics
- `renderColumnDiagnostics()` fonksiyonu eklendi
- Widget'larda diagnostics paneli görünüyor

### P1.4 - Eksik Veri Akademik Notu (Kısmen)
- `generateMissingDataNote()` fonksiyonu eklendi
- VIZ_STATE.dataActions logging eklendi
- Per-column count tracking eklendi

### P1.5 - APA Raporu
- `copyStatAsAPA()` geliştirildi
- Akademik format eklendi

### P1.6 - Tablo Kopyala
- `copyStatAsTable()` fonksiyonu eklendi
- TSV format desteği

### P2.1 - Light Mode
- CSS zaten mevcut

### Formüller
- 23 stat için formül bilgisi eklendi (adapters.js)

---

## Değiştirilen Dosyalar
- `stats.js` - diagnostics, missing notes, type hints
- `data.js` - VIZ_STATE.dataActions logging, per-column tracking
- `adapters.js` - 23 stat formulas, enhanced APA
- `viz_fixes.css` - diagnostics/missing note styles
