# TODO - UI Simplification Phase 2

## Ertelenen İşler

### 1. XLOOKUP Multi-Dosya Desteği
- [ ] XLOOKUP backend'ine df2/lookup_df desteği ekle
- [ ] Catalog'a data_source param geri ekle
- [ ] Sıralama: lookup_value → key_column (primary) → data_source → lookup_column (secondary) → return_column (secondary)
- [ ] "Ana Dosya" seçilirse tüm sütunlar primary'den gelsin

### 2. Concatenate Duplicate Sorunu
- [ ] UI'da "Sütunları Birleştir (Concatenate)" senaryosu duplicate görünüyor
- [ ] Catalog'da duplicate kayıt var mı kontrol et
- [ ] Varsa temizle

### 3. Genel
- [ ] Tüm multi-dosya senaryolarında param sıralaması kontrol et
- [ ] Ana Dosya → İkinci Dosya → Farklı Sayfa mantıksal akışı sağla

---
Oluşturulma: 2026-01-05
