# Opradox Senaryo Detaylı Kullanıcı Analizi

Bu rapor her senaryoyu gerçek bir kullanıcı perspektifinden değerlendirir.
'Şu işi yapmak istedim ama X zorunlu tutulmuş' gibi notlar içerir.

**Toplam Analiz:** 74 senaryo
**Sorunlu:** 3 senaryo
**Notlu:** 24 senaryo
**İkinci Dosya Parametreli:** 6 senaryo

---

## 🔴 Sorunlu Senaryolar (Düzeltilmeli)

### `fallback-lookup`
**Başlık:** İlk tabloda yoksa ikinci tablodan bul (yedeğe düşen arama)
**Zorunlu/Opsiyonel:** 5/2

**Zorunlu Parametreler:**
- `key_column`: Anahtar Sütun
- `lookup_column`: Arama Sütunu
- `fallback_column`: Yedek Sütun
- `value_column`: Değer Sütunu
- `fallback_df`: İkinci Dosya

**Sorunlar:**
- ⚠️ 5 adet zorunlu parametre - kullanıcı için karmaşık olabilir

**Kullanıcı Deneyimi Notu:**
> "Çok fazla alan doldurmam gerekiyor. Bazıları gerçekten gerekli mi?"

---

### `max-min-if`
**Başlık:** Koşula göre maksimum / minimum değeri bul (MAXIF / MINIF mantığı)
**Zorunlu/Opsiyonel:** 4/0

**Zorunlu Parametreler:**
- `condition_column`: Koşul Sütunu
- `condition_value`: Koşul Değeri
- `value_column`: Değer Sütunu
- `aggfunc`: Hesaplama Türü

**Sorunlar:**
- ⚠️ 'Aggregation' zorunlu ama senaryo adı filtreleme/satır işlemi vaat ediyor

**Kullanıcı Deneyimi Notu:**
> "Bu senaryoda sadece filtreleme yapmak istedim ama benden toplam/ortalama seçmemi istiyor. Ben sadece satırları görmek istiyorum!"

---

### `vlookup-single-match`
**Başlık:** Tek anahtara göre başka tablodan bilgi çek (VLOOKUP tarzı)
**Zorunlu/Opsiyonel:** 5/1

**Zorunlu Parametreler:**
- `key_column`: Anahtar Sütun Adı
- `lookup_df`: İkinci Dosya
- `lookup_key_column`: Lookup Anahtar Sütun Adı
- `lookup_column`: Arama Sütunu
- `return_column`: Dönüş Sütunu

**Sorunlar:**
- ⚠️ 5 adet zorunlu parametre - kullanıcı için karmaşık olabilir

**Kullanıcı Deneyimi Notu:**
> "Çok fazla alan doldurmam gerekiyor. Bazıları gerçekten gerekli mi?"

---

## 🟡 Gözden Geçirilmeli Senaryolar

### `average-condition`
**Başlık:** Koşullu Ortalama (Average Condition)
**Zorunlu/Opsiyonel:** 4/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `sum-between-dates`
**Başlık:** Tarih Aralığına Göre Toplama (Sum Between Dates)
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `average-ifs`
**Başlık:** Çoklu Koşula Göre Ortalama (AVERAGEIFS)
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `bucketing-numeric-into-bands`
**Başlık:** Sayısal değerleri aralıklara (0-100, 101-500...) böl
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `create-segment-column-by-thresholds`
**Başlık:** Tutar gibi sayısal değerlere göre segment sütunu oluştur
**Zorunlu/Opsiyonel:** 4/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `extract-text-before-after`
**Başlık:** Metinde belirli bir işaretten önceki/sonraki kısmı çıkar
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `filter-rows-by-condition`
**Başlık:** Koşula uyan satırları filtreleyip ayrı sayfaya al
**Zorunlu/Opsiyonel:** 4/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `find-and-replace-substring`
**Başlık:** Metin içinde belirli kelime/ifade ile değiştir (SUBSTITUTE)
**Zorunlu/Opsiyonel:** 4/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `group-by-month-year`
**Başlık:** Ay / yıl bazında özet tablo oluştur
**Zorunlu/Opsiyonel:** 4/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `multi-column-lookup`
**Başlık:** Birden çok sütuna göre arama yap ve değer getir
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `percentiles-and-quartiles`
**Başlık:** Yüzdelik ve çeyreklik değerleri hesapla
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `pivot-multi-level`
**Başlık:** İki veya daha fazla seviyede özet (şehir > ürün gibi)
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `pivot-with-subtotals`
**Başlık:** Alt toplamlar içeren grup bazlı rapor
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `pq-unpivot-columns`
**Başlık:** Sütunları Çöz (Unpivot)
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

### `report-multi-metric-summary`
**Başlık:** Çoklu Metrik Özeti
**Zorunlu/Opsiyonel:** 3/0

- 📝 Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?

... ve 9 senaryo daha

---

## 📁 İkinci Dosya Parametresi İçeren Senaryolar

Bu senaryolar için 'İkinci Dosya Gerekli' yerine daha yumuşak bir mesaj önerilir:
> "Aynı veya farklı dosyadan seçim yapabilirsiniz"

- `fallback-lookup`: İlk tabloda yoksa ikinci tablodan bul (yedeğe düşen arama)
  - `lookup_column`
- `multi-column-lookup`: Birden çok sütuna göre arama yap ve değer getir
  - `lookup_columns`
  - `lookup_values`
- `reverse-lookup-last-match`: Son eşleşen kaydı bul (sondan arama)
  - `lookup_column`
  - `lookup_value`
- `validate-values-against-list`: Değerleri referans listeye göre doğrula
  - `reference_list`
- `vlookup-single-match`: Tek anahtara göre başka tablodan bilgi çek (VLOOKUP tarzı)
  - `lookup_df`
  - `lookup_key_column`
  - `lookup_column`
  - `lookup_value_column`
- `xlookup-single-match`: Esnek arama ile tek değer çek (XLOOKUP tarzı)
  - `lookup_value`
  - `lookup_column`
