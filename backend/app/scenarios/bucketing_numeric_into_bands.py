from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Parametre kontrolü - value_column zorunlu
    value_col = params.get("value_column")
    if not value_col:
        raise HTTPException(status_code=400, detail="value_column parametresi zorunludur.")
    
    # target_column default='Band'
    target_col = params.get("target_column", "Band")
    
    # buckets opsiyonel - boşsa otomatik çeyreklik bantlar oluştur
    buckets = params.get("buckets")

    # Sütun kontrolü
    if value_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{value_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)[:10]}")

    # buckets parametresi liste veya dict olmalı
    # Beklenen format: list of tuples (start, end, label) veya dict {label: (start, end)}
    # Örnek: [(0,100,"0-100"), (101,500,"101-500")]
    
    # buckets boşsa otomatik çeyreklik bantlar oluştur
    if buckets is None or buckets == "" or buckets == []:
        values_numeric = pd.to_numeric(df[value_col], errors="coerce").dropna()
        if len(values_numeric) > 0:
            q1 = values_numeric.quantile(0.25)
            q2 = values_numeric.quantile(0.50)
            q3 = values_numeric.quantile(0.75)
            min_val = values_numeric.min()
            max_val = values_numeric.max()
            buckets = [
                (min_val, q1, "Düşük (Q1)"),
                (q1 + 0.01, q2, "Orta-Alt (Q2)"),
                (q2 + 0.01, q3, "Orta-Üst (Q3)"),
                (q3 + 0.01, max_val, "Yüksek (Q4)")
            ]
        else:
            raise HTTPException(status_code=400, detail="Sayısal veri bulunamadı, bantlar oluşturulamadı.")
    
    if not isinstance(buckets, (list, dict)):
        raise HTTPException(status_code=400, detail="'buckets' parametresi liste veya sözlük olmalı")

    # buckets dict ise listeye çevir
    if isinstance(buckets, dict):
        try:
            buckets_list = []
            for label, rng in buckets.items():
                if not (isinstance(rng, (list, tuple)) and len(rng) == 2):
                    raise
                buckets_list.append((rng[0], rng[1], label))
            buckets = buckets_list
        except:
            raise HTTPException(status_code=400, detail="'buckets' sözlüğü {label: (start, end)} formatında olmalı")

    # buckets liste ise her eleman tuple ve 3 elemanlı olmalı
    for b in buckets:
        if not (isinstance(b, (list, tuple)) and len(b) == 3):
            raise HTTPException(status_code=400, detail="'buckets' listesi her eleman (start, end, label) olmalı")

    # value_col sayısal hale getir
    values = pd.to_numeric(df[value_col], errors="coerce")

    # Aralıkları kontrol et ve etiketle
    def assign_bucket(val):
        if pd.isna(val):
            return None
        for start, end, label in buckets:
            if start <= val <= end:
                return label
        return None

    df[target_col] = values.apply(assign_bucket)

    # Özet
    counts_series = df[target_col].value_counts(dropna=False)
    counts = {str(k): int(v) for k, v in counts_series.items()}
    total = len(df)
    null_count = int(df[target_col].isna().sum())

    summary = {
        "total_rows": total,
        "bucket_counts": counts,
        "unmatched_count": null_count,
        "value_column": value_col,
        "target_column": target_col,
        "buckets_defined": len(buckets)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "bucketing_numeric_into_bands",
        "parameters": {"value_column": value_col, "buckets": buckets},
        "stats": {"total_rows": total, "buckets_defined": len(buckets)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Sayısal değerleri aralıklara ayır
buckets = {buckets}
def assign_bucket(val):
    if pd.isna(val): return None
    for start, end, label in buckets:
        if start <= val <= end: return label
    return None

df['{target_col}'] = df['{value_col}'].apply(assign_bucket)

df.to_excel('aralikli.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Result", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "bucketed_result.xlsx"
    }