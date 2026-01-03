from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    date_col = params.get("date_column")
    value_col = params.get("value_column")
    group_col = params.get("group_column", None)
    start_date = params.get("start_date", None)
    end_date = params.get("end_date", None)
    aggfunc = params.get("aggfunc", "sum")

    # date_col boşsa auto-detect
    if not date_col:
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        if datetime_cols:
            date_col = datetime_cols[0]
        else:
             # object columnlardan parse dene
             for col in df.columns:
                 if df[col].dtype == 'object':
                     try:
                         pd.to_datetime(df[col].dropna().head(10), dayfirst=True)
                         date_col = col
                         break
                     except:
                         continue
        if not date_col:
             raise HTTPException(status_code=400, detail="Tarih sütunu bulunamadı. Lütfen date_column belirtin.")

    # value_col boşsa auto-detect (ilk numeric)
    if not value_col:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_col = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")

    if date_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{date_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")
    if value_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{value_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")
    if group_col and group_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{group_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")

    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if df[date_col].isna().all():
        raise HTTPException(status_code=400, detail=f"'{date_col}' sütunundaki tüm değerler geçerli tarih değil")

    if start_date:
        try:
            start_date_parsed = pd.to_datetime(start_date, dayfirst=True)
            df = df[df[date_col] >= start_date_parsed]
        except Exception:
            raise HTTPException(status_code=400, detail="start_date parametresi geçerli tarih değil")
    if end_date:
        try:
            end_date_parsed = pd.to_datetime(end_date, dayfirst=True)
            df = df[df[date_col] <= end_date_parsed]
        except Exception:
            raise HTTPException(status_code=400, detail="end_date parametresi geçerli tarih değil")

    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df = df.dropna(subset=[date_col, value_col])
    if df.empty:
        raise HTTPException(status_code=400, detail="Filtreleme sonrası veri bulunamadı")

    aggfuncs = {
        "sum": pd.Series.sum,
        "mean": pd.Series.mean,
        "count": pd.Series.count,
        "max": pd.Series.max,
        "min": pd.Series.min,
        "median": pd.Series.median,
    }
    if aggfunc not in aggfuncs:
        raise HTTPException(status_code=400, detail=f"aggfunc parametresi geçersiz, desteklenenler: {list(aggfuncs.keys())}")

    if group_col:
        grouped = df.groupby([date_col, group_col])[value_col].agg(aggfuncs[aggfunc]).reset_index()
        pivot = grouped.pivot(index=date_col, columns=group_col, values=value_col).fillna(0)
    else:
        grouped = df.groupby(date_col)[value_col].agg(aggfuncs[aggfunc]).reset_index()
        pivot = grouped.set_index(date_col)

    summary = {
        "date_range": {
            "min": str(df[date_col].min().date()),
            "max": str(df[date_col].max().date())
        },
        "total_records": len(df),
        "aggregation": aggfunc,
        "groups": list(pivot.columns) if group_col else None,
        "data_points": len(pivot)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "simple_line_chart_time",
        "parameters": {"date_column": date_col, "value_column": value_col},
        "stats": {"data_points": len(pivot)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Zaman serisi verisi (çizgi grafik için)
df['{date_col}'] = pd.to_datetime(df['{date_col}'])
grouped = df.groupby('{date_col}')['{value_col}'].{aggfunc}()

grouped.to_excel('zaman_serisi.xlsx')
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="Result")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, sheet_name="Summary")

    output.seek(0)
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "line_chart_data.xlsx"
    }