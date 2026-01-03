from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    value_column = params.get("value_column")
    target_column = params.get("target_column", "Segment")  # default="Segment"
    thresholds = params.get("thresholds")  # Örn: [1000, 5000]
    labels = params.get("labels")          # Örn: ["Düşük", "Orta", "Yüksek"]

    # value_column boşsa ilk numeric auto-seç
    if not value_column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_column = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")
    
    # Sütun kontrolü
    if value_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{value_column}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)[:10]}")
    
    # thresholds ve labels boşsa otomatik çeyreklik oluştur
    if thresholds is None or thresholds == []:
        values = pd.to_numeric(df[value_column], errors="coerce").dropna()
        if len(values) > 0:
            q1 = values.quantile(0.33)
            q2 = values.quantile(0.66)
            thresholds = [float(q1), float(q2)]
            labels = ["Düşük", "Orta", "Yüksek"]
        else:
            raise HTTPException(status_code=400, detail="Sayısal veri bulunamadı, thresholds oluşturulamadı.")
    
    if labels is None or labels == []:
        labels = [f"Segment {i+1}" for i in range(len(thresholds) + 1)]

    if not isinstance(thresholds, list) or not all(isinstance(x, (int, float)) for x in thresholds):
        raise HTTPException(status_code=400, detail="thresholds listesi sayısal değerler içermeli")
    if not isinstance(labels, list) or not all(isinstance(x, str) for x in labels):
        raise HTTPException(status_code=400, detail="labels listesi string değerler içermeli")

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