# Opradox Senaryo Audit Raporu

**Analiz Edilen Senaryo Sayısı:** 75
**Hariç Tutulan (PRO Builder):** 3

---

## 1. İkinci Dosya Uyarısı Sorunları

Aşağıdaki senaryolar ikinci dosya parametresi içeriyor ama tek dosyadan da çalışabilir görünüyor:

✅ Belirgin sorun tespit edilmedi.

---

## 2. Zorunlu Parametre Uyumsuzlukları

Senaryo başlığı ile zorunlu parametrelerin uyumsuz olduğu durumlar:

### `max-min-if`
**Başlık:** Koşula göre maksimum / minimum değeri bul (MAXIF / MINIF mantığı)
**Sorunlar:**
- 'aggfunc' zorunlu ama senaryo filtre odaklı görünüyor

---

## 3. Aşırı Zorunlu Parametre Sayısı

5+ zorunlu parametre veya %80+ zorunlu oran içeren senaryolar:

| Senaryo ID | Başlık | Zorunlu | Opsiyonel |
|------------|--------|---------|-----------|
| `average-condition` | Koşullu Ortalama (Average Condition)... | 4 | 0 |
| `sum-between-dates` | Tarih Aralığına Göre Toplama (Sum Betwee... | 3 | 0 |
| `average-ifs` | Çoklu Koşula Göre Ortalama (AVERAGEIFS)... | 3 | 0 |
| `bucketing-numeric-into-bands` | Sayısal değerleri aralıklara (0-100, 101... | 3 | 0 |
| `count-value` | Tek sütunda belirli bir değeri say (COUN... | 5 | 0 |
| `create-segment-column-by-thresholds` | Tutar gibi sayısal değerlere göre segmen... | 4 | 0 |
| `extract-text-before-after` | Metinde belirli bir işaretten önceki/son... | 3 | 0 |
| `fallback-lookup` | İlk tabloda yoksa ikinci tablodan bul (y... | 7 | 0 |
| `filter-rows-by-condition` | Koşula uyan satırları filtreleyip ayrı s... | 4 | 0 |
| `find-and-replace-substring` | Metin içinde belirli kelime/ifade ile de... | 4 | 0 |
| `flag-rows-that-meet-rule` | Belirli kurala uyan satırları bayrakla (... | 6 | 0 |
| `group-by-month-year` | Ay / yıl bazında özet tablo oluştur... | 4 | 0 |
| `highlight-values-by-threshold` | Alt/üst eşiklere göre hücreleri renklend... | 5 | 0 |
| `max-min-if` | Koşula göre maksimum / minimum değeri bu... | 4 | 0 |
| `multi-column-lookup` | Birden çok sütuna göre arama yap ve değe... | 3 | 0 |
| `percentiles-and-quartiles` | Yüzdelik ve çeyreklik değerleri hesapla... | 3 | 0 |
| `pivot-multi-level` | İki veya daha fazla seviyede özet (şehir... | 3 | 0 |
| `pivot-with-subtotals` | Alt toplamlar içeren grup bazlı rapor... | 3 | 0 |
| `pq-unpivot-columns` | Sütunları Çöz (Unpivot)... | 3 | 0 |
| `report-filter-then-group` | Filtrele ve Grupla Raporu... | 3 | 0 |
| `report-multi-metric-summary` | Çoklu Metrik Özeti... | 3 | 0 |
| `report-pivot-matrix-sum` | Pivot Matris Toplam Raporu... | 4 | 0 |
| `reverse-lookup-last-match` | Son eşleşen kaydı bul (sondan arama)... | 7 | 0 |
| `running-total-by-group` | Grup içinde kümülatif toplam (running to... | 3 | 0 |
| `split-column-by-delimiter` | Bir sütunu ayırıcıya göre birden çok süt... | 3 | 0 |
| `stacked-column-by-category` | Yığılmış sütun grafik (kategori + alt ka... | 4 | 0 |
| `sum-if` | Tek koşula göre toplam değer (SUMIF)... | 4 | 0 |
| `sum-ifs-multi` | Birden çok koşula göre toplam (SUMIFS)... | 3 | 0 |
| `summarize-by-month-and-category` | Ay + kategori bazında zaman serisi rapor... | 3 | 0 |
| `vlookup-single-match` | Tek anahtara göre başka tablodan bilgi ç... | 6 | 0 |
| `xlookup-single-match` | Esnek arama ile tek değer çek (XLOOKUP t... | 6 | 0 |
| `zscore-standardization` | Z-skoru ile değerleri standartlaştır... | 3 | 0 |

---

## 4. Aynı Motor Kodunu Kullanan Senaryolar

Farklı ID'lerle aynı modülü kullanan senaryolar (potansiyel tekrar):

### `app.scenarios.frequency_table_single_column`

- **frequency-table**: Frekans Tablosu (Frequency Table)
- **frequency-table-single-column**: Tek sütun için frekans tablosu oluştur

---

## Özet İstatistikler

- **Toplam Analiz Edilen:** 75 senaryo
- **İkinci Dosya Sorunları:** 0 senaryo
- **Parametre Uyumsuzlukları:** 1 senaryo
- **Aşırı Sert Parametreler:** 32 senaryo
- **Tekrarlayan Motor Kodları:** 1 modül
