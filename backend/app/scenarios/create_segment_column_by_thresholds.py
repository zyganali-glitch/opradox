from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    value_column = params.get("value_column")
    target_column = params.get("target_column")
    thresholds = params.get("thresholds")  # Örn: [1000, 5000]
    labels = params.get("labels")          # Örn: ["Düşük", "Orta", "Yüksek"]

    # Parametre kontrolü
    if not value_column:
        raise HTTPException(status_code=400, detail="value_column parametresi eksik")
    if not target_column:
        raise HTTPException(status_code=400, detail="target_column parametresi eksik")
    if thresholds is None:
        raise HTTPException(status_code=400, detail="thresholds parametresi eksik")
    if labels is None:
        raise HTTPException(status_code=400, detail="labels parametresi eksik")

    if not isinstance(thresholds, list) or not all(isinstance(x, (int, float)) for x in thresholds):
        raise HTTPException(status_code=400, detail="thresholds listesi sayısal değerler içermeli")
    if not isinstance(labels, list) or not all(isinstance(x, str) for x in labels):
        raise HTTPException(status_code=400, detail="labels listesi string değerler içermeli")

    # Sütun kontrolü
    missing_cols = [col for col in [value_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"'{missing_cols[0]}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")

    # Sayısal değerleri al, NaN olanları çıkar
    values = pd.to_numeric(df[value_column], errors="coerce")

    # thresholds sıralı olmalı
    thresholds_sorted = sorted(thresholds)

    # labels sayısı thresholds + 1 olmalı
    if len(labels) != len(thresholds_sorted) + 1:
        raise HTTPException(status_code=400, detail="labels sayısı thresholds sayısından 1 fazla olmalı")

    # Segment oluştur
    segments = pd.cut(values, bins=[-float("inf")] + thresholds_sorted + [float("inf")], labels=labels, right=True)

    # Yeni sütunu ekle
    df[target_column] = segments

    # Özet
    summary = {
        "total_rows": len(df),
        "value_column": value_column,
        "target_column": target_column,
        "thresholds": thresholds_sorted,
        "labels": labels,
        "segment_counts": df[target_column].value_counts(dropna=False).to_dict()
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "create_segment_column_by_thresholds",
        "parameters": {"value_column": value_column, "thresholds": thresholds_sorted, "labels": labels},
        "stats": {"segment_counts": df[target_column].value_counts(dropna=False).to_dict()},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Segment oluştur (eşik değerlerine göre)
thresholds = {thresholds_sorted}
labels = {labels}
df['{target_column}'] = pd.cut(df['{value_column}'], 
    bins=[-float('inf')] + thresholds + [float('inf')], 
    labels=labels)

df.to_excel('segmentli.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Segmented Data", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "segmented_data.xlsx"
    }