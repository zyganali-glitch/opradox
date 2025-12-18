from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    required_params = ["group_column", "value_column"]
    for p in required_params:
        if p not in params or not params[p]:
            raise HTTPException(status_code=400, detail=f"'{p}' parametresi eksik veya boş")

    group_col = params["group_column"]
    value_col = params["value_column"]
    row_field = params.get("row_field")
    column_field = params.get("column_field")
    aggfunc = params.get("aggfunc", "sum")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_column = params.get("date_column")

    # Kontrol: Gerekli sütunlar df'de var mı?
    needed_cols = {group_col, value_col}
    if row_field:
        needed_cols.add(row_field)
    if column_field:
        needed_cols.add(column_field)
    if date_column:
        needed_cols.add(date_column)

    missing_cols = [c for c in needed_cols if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütunlar eksik: {missing_cols} mevcut sütunlar: {list(df.columns)}")

    # Tarih filtresi uygula
    if date_column and (start_date or end_date):
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")

    # value_column sayısal olmalı
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df = df.dropna(subset=[value_col])
    if df.empty:
        raise HTTPException(status_code=400, detail="İşlem sonrası veri boş kaldı")

    # Pivot tablosu oluştur
    index = []
    if group_col:
        index.append(group_col)
    if row_field and row_field != group_col:
        index.append(row_field)
    columns = [column_field] if column_field else None

    # aggfunc kontrolü
    allowed_aggfuncs = {"sum", "mean", "count", "min", "max", "median"}
    if aggfunc not in allowed_aggfuncs:
        raise HTTPException(status_code=400, detail=f"aggfunc '{aggfunc}' desteklenmiyor, desteklenenler: {list(allowed_aggfuncs)}")

    pivot = pd.pivot_table(
        df,
        values=value_col,
        index=index if index else None,
        columns=columns,
        aggfunc=aggfunc,
        fill_value=0,
        dropna=False,
        margins=False,
    )

    # Toplamı hesapla
    total_sum = pivot.values.sum()
    if total_sum == 0:
        raise HTTPException(status_code=400, detail="Pivot tablosundaki toplam değer 0, yüzde hesaplanamaz")

    # Yüzde tablosu oluştur
    pct = pivot / total_sum * 100
    pct = pct.round(2)

    # Sonuçları birleştir
    # Çoklu sütun varsa çoklu index olabilir, düzelt
    if isinstance(pivot.columns, pd.MultiIndex):
        pivot.columns = ['|'.join(map(str, col)).strip() for col in pivot.columns.values]
        pct.columns = pivot.columns
    if isinstance(pivot.index, pd.MultiIndex):
        pivot.index = ['|'.join(map(str, idx)).strip() for idx in pivot.index.values]
        pct.index = pivot.index

    # Yeni DataFrame: her değer ve yanında yüzde
    combined_cols = []
    combined_data = {}
    for col in pivot.columns:
        combined_cols.append(col)
        combined_cols.append(f"{col} %")
        combined_data[col] = pivot[col]
        combined_data[f"{col} %"] = pct[col]

    combined_df = pd.DataFrame(combined_data, index=pivot.index)[combined_cols]

    # Özet
    summary = {
        "total_sum": float(total_sum),
        "rows": len(combined_df),
        "columns": len(combined_df.columns),
        "group_column": group_col,
        "value_column": value_col,
        "aggfunc": aggfunc,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "pivot_with_percentage_of_total",
        "parameters": {"group_column": group_col, "value_column": value_col},
        "stats": {"total_sum": float(total_sum)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Pivot + yüzde hesaplama
pivot = df.groupby('{group_col}')['{value_col}'].sum()
total = pivot.sum()
pct = (pivot / total * 100).round(2)

result = pd.DataFrame({{'Değer': pivot, 'Yüzde %': pct}})
result.to_excel('yuzdelik_pivot.xlsx')
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        combined_df.to_excel(writer, sheet_name="Pivot with %")
        # Özet sheet
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": combined_df.reset_index(),
        "excel_bytes": output,
        "excel_filename": "pivot_with_percentage_of_total.xlsx"
    }