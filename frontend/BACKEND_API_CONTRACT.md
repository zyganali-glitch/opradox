# BACKEND_API_CONTRACT.md — Stats Analysis Endpoints

Bu belge, frontend'de "stub" olarak bekletilen ileri istatistik analizleri için gerekli backend endpoint şemalarını tanımlar.

---

## 1. Logistic Regression

**Frontend Durumu:** `stats.js L3527` - Modal açılıyor, "Backend API gerekli" mesajı gösteriliyor.

### Endpoint
```
POST /viz/stats/logistic
```

### Request Schema
```json
{
  "dataset_id": "string",
  "dependent_column": "string",    // Binary: 0/1
  "independent_columns": ["string"],
  "options": {
    "regularization": "none|l1|l2",
    "max_iterations": 100,
    "threshold": 0.5
  }
}
```

### Response Schema
```json
{
  "success": true,
  "model": {
    "coefficients": {"column_name": 0.45, ...},
    "intercept": -1.23,
    "odds_ratios": {"column_name": 1.57, ...}
  },
  "metrics": {
    "accuracy": 0.85,
    "auc": 0.89,
    "confusion_matrix": [[TP, FP], [FN, TN]]
  },
  "interpretation": "string"
}
```

### Error Schema
```json
{
  "success": false,
  "error": "INSUFFICIENT_DATA | INVALID_COLUMN | CONVERGENCE_FAILED",
  "message": "string"
}
```

---

## 2. Discriminant Analysis

**Frontend Durumu:** `stats.js L3639` - Modal açılıyor, stub mesajı.

### Endpoint
```
POST /viz/stats/discriminant
```

### Request Schema
```json
{
  "dataset_id": "string",
  "group_column": "string",
  "predictor_columns": ["string"],
  "method": "lda|qda"
}
```

### Response Schema
```json
{
  "success": true,
  "classification": {
    "accuracy": 0.82,
    "confusion_matrix": [[...], [...]]
  },
  "discriminant_functions": [
    {"eigenvalue": 2.5, "variance_explained": 0.78}
  ],
  "group_centroids": {"group1": [0.5, -0.3], ...}
}
```

---

## 3. Survival Analysis (Kaplan-Meier)

**Frontend Durumu:** `stats.js L3652` - Modal açılıyor, stub mesajı.

### Endpoint
```
POST /viz/stats/survival
```

### Request Schema
```json
{
  "dataset_id": "string",
  "time_column": "string",
  "event_column": "string",     // 0=censored, 1=event
  "group_column": "string|null",
  "confidence_level": 0.95
}
```

### Response Schema
```json
{
  "success": true,
  "survival_table": [
    {"time": 0, "survival_prob": 1.0, "ci_lower": 1.0, "ci_upper": 1.0},
    {"time": 30, "survival_prob": 0.85, ...}
  ],
  "median_survival": 120,
  "log_rank_test": {
    "chi_square": 4.5,
    "p_value": 0.034,
    "df": 1
  }
}
```

---

## UI Davranışı

1. Modal açıldığında backend endpoint çağrılır
2. Loading state gösterilir
3. Başarılı response → modal içine tablo/grafik render
4. Error response → modal içinde hata mesajı (UI crash yok)
5. Network error → "Bağlantı hatası" toast

---

## Implementasyon Notu

Bu endpoint'ler mevcut değildir. Uydurma hesap yapılmamalıdır.
Frontend stub mesajı ("Backend API gerekli") korunmalıdır.

---

## General Notes (G3.2 QA)

### Authentication
- **Varsayım:** Mevcut session-based auth kullanılır (viz.html'de login varsa)
- **Header:** `Authorization: Bearer <token>` veya session cookie
- **Rate Limit:** Varsayılan 10 req/min per user (analiz ağır işlem)

### dataset_id Lifecycle
- Frontend'de `VIZ_STATE.activeDatasetId` ile tutulur
- `addDataset()` çağrısıyla oluşturulur
- Backend'e gönderilirken: ya ID referansı ya da inline data gönderilir
- **Öneri:** İlk versiyon inline data göndersin (daha basit)

### Numeric/Categorical Validation
- Backend, kolon tiplerini otomatik algılamalı
- Hata durumları:
  - `COLUMN_NOT_FOUND`: Kolon adı yanlış
  - `COLUMN_TYPE_MISMATCH`: Sayısal beklenirken text geldi
  - `INSUFFICIENT_DATA`: n < minimum sample size

### Response Table/Plot Metadata
```json
{
  "tables": [
    {"id": "coefficients", "title": "Katsayılar", "columns": [...], "rows": [...]}
  ],
  "plots": [
    {"id": "roc_curve", "type": "line", "data": {...}, "title": "ROC Eğrisi"}
  ]
}
```

### Network/Error Handling
- **Timeout:** 60 saniye (analiz uzun sürebilir)
- **Retry:** Otomatik retry yok (kullanıcı manuel tetikler)
- **Error UI:** Modal içinde kırmızı banner, UI crash yok

