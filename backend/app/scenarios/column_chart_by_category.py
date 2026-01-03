from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_column = params.get("group_column")
    value_column = params.get("value_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_column = params.get("date_column")

    # group_column boşsa ilk kategorik/object sütunu auto-seç
    if not group_column:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if object_cols:
            group_column = object_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Kategorik sütun bulunamadı. Lütfen group_column belirtin.")
    
    # value_column boşsa ilk numeric sütunu auto-seç
    if not value_column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_column = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")

    missing_cols = [col for col in [group_column, value_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"'{', '.join(missing_cols)}' sütunu(ları) eksik. Mevcut sütunlar: {list(df.columns)[:10]}")

    if date_column:
        if date_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_column}' sütunu eksik. Mevcut sütunlar: {list(df.columns)}")
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli bir tarih değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli bir tarih değil")

    df[value_column] = pd.to_numeric(df[value_column], errors="coerce")
    df = df.dropna(subset=[group_column, value_column])

    grouped = df.groupby(group_column)[value_column].sum().reset_index()
    grouped = grouped.sort_values(by=value_column, ascending=False)

    summary = {
        "group_column": group_column,
        "value_column": value_column,
        "total_groups": grouped.shape[0],
        "total_sum": grouped[value_column].sum().item() if hasattr(grouped[value_column].sum(), "item") else grouped[value_column].sum(),
        "top_group": grouped.iloc[0][group_column] if not grouped.empty else None,
        "top_group_value": grouped.iloc[0][value_column].item() if not grouped.empty and hasattr(grouped.iloc[0][value_column], "item") else (grouped.iloc[0][value_column] if not grouped.empty else None)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "column_chart_by_category",
        "parameters": {"group_column": group_column, "value_column": value_column},
        "stats": {"total_groups": grouped.shape[0]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Kategoriye göre toplam (sütun grafiği verisi)
grouped = df.groupby('{group_column}')['{value_column}'].sum().reset_index()
grouped = grouped.sort_values('{value_column}', ascending=False)

# En yüksek: {summary['top_group']} = {summary['top_group_value']}
grouped.to_excel('kategori_toplam.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        grouped.to_excel(writer, index=False, sheet_name="Result")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": grouped,
        "excel_bytes": output,
        "excel_filename": "column_chart_by_category.xlsx"
    }