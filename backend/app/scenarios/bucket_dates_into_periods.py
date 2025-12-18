from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    date_col = params.get("date_column")
    period_type = params.get("period_type")  # "week", "month", "quarter"
    target_col = params.get("target_column", "period_label")

    if not date_col:
        raise HTTPException(status_code=400, detail="date_column parametresi gerekli")
    if not period_type:
        raise HTTPException(status_code=400, detail="period_type parametresi gerekli")
    if period_type not in {"week", "month", "quarter"}:
        raise HTTPException(status_code=400, detail="period_type 'week', 'month' veya 'quarter olmalı")

    if date_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"{date_col} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")

    # Tarih sütununu datetime yap
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if df[date_col].isna().all():
        raise HTTPException(status_code=400, detail=f"{date_col} sütunundaki tüm değerler geçersiz tarih")

    # Dönem etiketlerini oluştur
    if period_type == "week":
        # ISO yıl ve hafta numarası
        df[target_col] = df[date_col].dt.to_period("W").astype(str)
    elif period_type == "month":
        df[target_col] = df[date_col].dt.to_period("M").astype(str)
    else:  # quarter
        df[target_col] = df[date_col].dt.to_period("Q").astype(str)

    # Özet bilgisi
    unique_periods = df[target_col].nunique()
    total_rows = len(df)
    null_dates = df[date_col].isna().sum()

    summary = {
        "total_rows": total_rows,
        "null_dates": int(null_dates),
        "unique_period_labels": int(unique_periods),
        "period_type": period_type,
        "period_column": target_col
    }
    
    # Python kod özeti
    period_map = {"week": "W", "month": "M", "quarter": "Q"}
    technical_details = {
        "scenario": "bucket_dates_into_periods",
        "parameters": {"date_column": date_col, "period_type": period_type},
        "stats": summary,
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Tarihleri dönemlere ayır ({period_type})
df['{date_col}'] = pd.to_datetime(df['{date_col}'])
df['{target_col}'] = df['{date_col}'].dt.to_period('{period_map.get(period_type, "M")}').astype(str)

# Sonuç: {unique_periods} benzersiz dönem
df.to_excel('doneme_ayrilmis.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": f"period_bucketed_{period_type}.xlsx"
    }