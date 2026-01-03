from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    row_field = params.get("row_field")
    column_field = params.get("column_field")
    value_column = params.get("value_column")
    aggfunc = params.get("aggfunc", "sum")
    date_column = params.get("date_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # row_field boşsa ilk kategorik auto-seç
    if not row_field:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if object_cols:
            row_field = object_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Kategorik sütun bulunamadı. Lütfen row_field belirtin.")
    
    # value_column boşsa ilk numeric auto-seç
    if not value_column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_column = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")
    
    if aggfunc not in ["sum", "mean", "count", "min", "max", "median"]:
        raise HTTPException(status_code=400, detail="aggfunc parametresi geçersiz, sum, mean, count, min, max, median olabilir")

    # Sütun kontrolü
    required_cols = {row_field, value_column}
    if column_field:
        required_cols.add(column_field)
    if date_column:
        required_cols.add(date_column)
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}. Mevcut: {list(df.columns)[:10]}")

    # Tarih filtresi varsa uygula
    if date_column:
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date parametresi geçersiz tarih formatında")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date parametresi geçersiz tarih formatında")

    # value_column sayısal olmalı
    df[value_column] = pd.to_numeric(df[value_column], errors="coerce")
    df = df.dropna(subset=[value_column])

    # Pivot tablosu oluştur
    try:
        pivot = pd.pivot_table(
            df,
            index=row_field,
            columns=column_field if column_field else None,
            values=value_column,
            aggfunc=aggfunc,
            fill_value=0,
            dropna=False,
            margins=True,
            margins_name="Toplam"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Pivot tablo oluşturulamadı: {str(e)}")

    # Özet bilgi
    summary = {
        "rows": pivot.shape[0],
        "columns": pivot.shape[1],
        "aggfunc": aggfunc,
        "row_field": row_field,
        "column_field": column_field if column_field else None,
        "value_column": value_column,
        "date_filter_applied": bool(date_column and (start_date or end_date)),
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "pivot_sum_by_category",
        "parameters": {"row_field": row_field, "column_field": column_field, "value_column": value_column, "aggfunc": aggfunc},
        "stats": {"rows": pivot.shape[0], "columns": pivot.shape[1]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Pivot tablo oluştur
pivot = pd.pivot_table(df, index='{row_field}', 
    columns={repr(column_field) if column_field else None},
    values='{value_column}', aggfunc='{aggfunc}',
    fill_value=0, margins=True, margins_name='Toplam')

pivot.to_excel('pivot_ozet.xlsx')
```"""
    }

    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="PivotSummary")
        # Özet bilgiyi dataframe olarak yaz
        summary_df = pd.DataFrame(list(summary.items()), columns=["Key", "Value"])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "pivot_summary.xlsx"
    }