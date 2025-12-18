# Walkthrough - opradox Documentation Update

I have standardized the documentation for multiple analysis scenarios in `scenarios_catalog.json`. All updated scenarios now strictly follow the "Mini User Manual" format with detailed tables and process steps.

## Updates
The following scenarios were updated to the detailed **Scenario / Table / Process / Result** format:
- `average-ifs`
- `basic-summary-stats-column`
- `bucket-dates-into-periods`
- `bucketing-numeric-into-bands`
- `check-missing-values`
- `color-scale-by-value`
- `zscore-standardization` (Previously updated)

## Example Format (zscore-standardization)
```json
"examples_tr": [
  "**Senaryo:** Farklı zorluktaki iki sınavın sonuçlarını karşılaştırıp hangi öğrencinin sınıfına göre daha başarılı olduğunu bulmak istiyoruz.",
  "**Tablo:**\n| Öğrenci | Ders | Not |\n| :--- | :--- | :--- |\n| Ali | Mat (Zor) | 60 |\n| Ayşe | Fizik (Kolay)| 80 |",
  "**İşlem:**\n- Değer Sütunu: `Not`\n- Gruplama Sütunu: `Ders` (Her dersi kendi içinde değerlendir)\n- Yeni Sütun: `Başarı Skoru`",
  "**Sonuç:**\n- Ali: `+1.0` (Sınıf ortalamasının çok üstünde)\n- Ayşe: `+0.5` (Sınıf ortalamasının biraz üstünde)\n*Sonuç: Mutlak puanı düşük olsa da Ali, kendi sınıfına göre daha başarılıdır.*"
]
```

## Verification
- **JSON Validity**: Ensured file integrity via programmatic update using `json.load` and `json.dump`.
- **Content Check**: Verified that keys like `help_tr` and `help_en` are correctly placed and contain the updated tabular examples.
