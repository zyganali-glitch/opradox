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

    # Tarih filtresi opsiyonel
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_column = params.get("date_column")

    # row_field ve column_field boşsa ilk 2 kategorik sütunu seç
    if not row_field or not column_field:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if len(object_cols) >= 2:
            if not row_field:
                row_field = object_cols[0]
            if not column_field:
                column_field = object_cols[1]
        else:
             if not row_field:
                 raise HTTPException(status_code=400, detail="Satır alanı (row_field) için kategorik sütun bulunamadı.")
             if not column_field:
                 raise HTTPException(status_code=400, detail="Sütun alanı (column_field) için ikinci bir kategorik sütun bulunamadı.")
    
    # value_column boşsa ilk numeric auto-seç
    if not value_column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_column = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")

    # Sütun kontrolü
    missing_cols = [col for col in [row_field, column_field, value_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"DataFrame'de eksik sütunlar: {missing_cols}")

    if date_column:
        if date_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"DataFrame'de eksik tarih sütunu: {date_column}")
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date parametresi geçersiz")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date parametresi geçersiz")

    # value_column sayısal olmalı
    df[value_column] = pd.to_numeric(df[value_column], errors="coerce")
    df = df.dropna(subset=[value_column])

    # aggfunc kontrolü
    allowed_aggfuncs = {"sum", "mean", "count", "min", "max"}
    if aggfunc not in allowed_aggfuncs:
        raise HTTPException(status_code=400, detail=f"aggfunc parametresi geçersiz, izin verilenler: {sorted(allowed_aggfuncs)}")

    # Pivot table oluştur
    pivot = pd.pivot_table(
        df,
        index=row_field,
        columns=column_field,
        values=value_column,
        aggfunc=aggfunc,
        fill_value=0,
        dropna=False,
        margins=True,
        margins_name="Toplam"
    )

    # Özet bilgisi
    summary = {
        "rows": len(pivot) - 1,  # Toplam satır hariç
        "columns": len(pivot.columns) - 1,  # Toplam sütun hariç
        "aggfunc": aggfunc,
        "row_field": row_field,
        "column_field": column_field,
        "value_column": value_column,
        "date_filter_applied": bool(date_column and (start_date or end_date))
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "report_pivot_matrix_sum",
        "parameters": {"row_field": row_field, "column_field": column_field, "value_column": value_column},
        "stats": {"rows": len(pivot) - 1, "columns": len(pivot.columns) - 1},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çapraz tablo (toplam)
pivot = pd.pivot_table(df, index='{row_field}', columns='{column_field}',
    values='{value_column}', aggfunc='{aggfunc}', fill_value=0,
    margins=True, margins_name='Toplam')

pivot.to_excel('capraz_tablo_toplam.xlsx')
```"""
    }

    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="Pivot")
        # Özet sheet
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "pivot_report.xlsx"
    }