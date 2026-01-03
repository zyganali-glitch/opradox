from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    group_column = params.get("group_column")
    value_column = params.get("value_column")
    date_column = params.get("date_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    aggfunc = params.get("aggfunc", "sum").lower()

    # group_column boşsa ilk kategorik auto-select
    if not group_column:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if object_cols:
            group_column = object_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Kategorik sütun bulunamadı. Lütfen group_column belirtin.")

    # value_column boşsa ilk numeric auto-select
    if not value_column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_column = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")

    # date_column yoksa filtreleme adımı opsiyonel olsun
    # Ancak eğer start/end date verildiyse date_column aranmalı
    if (start_date or end_date) and not date_column:
         # Auto-detect date column
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        if datetime_cols:
            date_column = datetime_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Tarih filtresi için date_column belirtilmeli veya bulunamadı.")

    # Sütun kontrolü
    missing_cols = [col for col in [group_column, value_column, date_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütunlar eksik: {missing_cols}")

    # Tarih kolonunu datetime yap
    df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
    if df[date_column].isna().all():
        raise HTTPException(status_code=400, detail=f"{date_column} sütununda geçerli tarih yok")

    # Filtreleme
    mask = pd.Series(True, index=df.index)
    if start_date:
        try:
            start_dt = pd.to_datetime(start_date, dayfirst=True)
            mask &= df[date_column] >= start_dt
        except Exception:
            raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
    if end_date:
        try:
            end_dt = pd.to_datetime(end_date, dayfirst=True)
            mask &= df[date_column] <= end_dt
        except Exception:
            raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")

    df_filtered = df.loc[mask].copy()
    if df_filtered.empty:
        raise HTTPException(status_code=400, detail="Filtre sonrası veri yok")

    # value_column sayısal yap
    df_filtered[value_column] = pd.to_numeric(df_filtered[value_column], errors="coerce")
    df_filtered = df_filtered.dropna(subset=[value_column])
    if df_filtered.empty:
        raise HTTPException(status_code=400, detail=f"{value_column} sütununda sayısal veri yok")

    # Gruplama ve özet
    aggfuncs = {
        "sum": "sum",
        "mean": "mean",
        "count": "count",
        "min": "min",
        "max": "max",
        "median": "median"
    }
    if aggfunc not in aggfuncs:
        raise HTTPException(status_code=400, detail=f"aggfunc geçersiz, desteklenenler: {list(aggfuncs.keys())}")

    grouped = df_filtered.groupby(group_column)[value_column].agg(aggfuncs[aggfunc]).reset_index()

    # Özet
    summary = {
        "filtered_rows": len(df_filtered),
        "groups_count": grouped.shape[0],
        "aggregation": aggfunc,
        "group_column": group_column,
        "value_column": value_column,
        "date_filter": {
            "start_date": start_date,
            "end_date": end_date
        }
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "report_filter_then_group",
        "parameters": {"group_column": group_column, "value_column": value_column},
        "stats": {"filtered_rows": len(df_filtered), "groups_count": grouped.shape[0]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Filtrele ve grupla
df['{date_column}'] = pd.to_datetime(df['{date_column}'])
mask = (df['{date_column}'] >= '{start_date}') & (df['{date_column}'] <= '{end_date}')
filtered = df[mask]

grouped = filtered.groupby('{group_column}')['{value_column}'].{aggfunc}()
grouped.to_excel('rapor.xlsx')
```"""
    }

    # Excel oluşturma
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_filtered.to_excel(writer, sheet_name="Filtered", index=False)
        grouped.to_excel(writer, sheet_name="Grouped_Summary", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    filename = f"report_{group_column}_{aggfunc}.xlsx"

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": grouped,
        "excel_bytes": output,
        "excel_filename": filename
    }