from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # aggfunc is optional with default value
    category_col = params.get("category_column")
    subcategory_col = params.get("subcategory_column")
    value_col = params.get("value_column")
    aggfunc = params.get("aggfunc", "sum").lower()  # Default to sum if not specified

    # Auto-select logic
    if not category_col or not subcategory_col:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if len(object_cols) >= 2:
            if not category_col:
                category_col = object_cols[0]
            if not subcategory_col:
                subcategory_col = object_cols[1]
        else:
             if not category_col:
                 raise HTTPException(status_code=400, detail="Kategori sütunu (category_column) bulunamadı veya belirtilmedi.")
             if not subcategory_col:
                 raise HTTPException(status_code=400, detail="Alt kategori sütunu (subcategory_column) bulunamadı veya belirtilmedi.")

    if not value_col:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_col = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Değer sütunu (value_column) bulunamadı veya belirtilmedi.")

    if category_col not in df.columns or subcategory_col not in df.columns or value_col not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"'{category_col}', '{subcategory_col}' veya '{value_col}' sütunları bulunamadı. Mevcut sütunlar: {list(df.columns)}"
        )

    if aggfunc not in ["sum", "mean", "count", "min", "max", "median"]:
        raise HTTPException(status_code=400, detail="aggfunc parametresi geçersiz. sum, mean, count, min, max, median olabilir")

    # Eğer tarih filtreleme varsa uygula
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_col = params.get("date_column")

    if (start_date or end_date) and not date_col:
        raise HTTPException(status_code=400, detail="start_date veya end_date verilmişse date_column parametresi zorunludur")

    if date_col:
        if date_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_col}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}")
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_col] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date parametresi geçersiz tarih formatında")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_col] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date parametresi geçersiz tarih formatında")

    # value_col sayısal hale getir
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df = df.dropna(subset=[value_col, category_col, subcategory_col])

    if df.empty:
        raise HTTPException(status_code=400, detail="Filtreleme sonrası veri bulunamadı")

    agg_map = {
        "sum": "sum",
        "mean": "mean",
        "count": "count",
        "min": "min",
        "max": "max",
        "median": "median"
    }

    grouped = df.groupby([category_col, subcategory_col])[value_col].agg(agg_map[aggfunc]).reset_index()

    # Pivot table oluştur (kategori satır, alt kategori sütun)
    pivot = grouped.pivot(index=category_col, columns=subcategory_col, values=value_col).fillna(0)

    # Özet bilgisi
    total_categories = pivot.shape[0]
    total_subcategories = pivot.shape[1]
    total_values = pivot.values.sum()

    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="StackedData")
        summary_df = pd.DataFrame({
            "Toplam Kategori": [total_categories],
            "Toplam Alt Kategori": [total_subcategories],
            "Toplam Değer": [total_values],
            "AggFunc": [aggfunc]
        })
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    summary = {
        "total_categories": total_categories,
        "total_subcategories": total_subcategories,
        "total_aggregated_value": total_values,
        "aggregation_function": aggfunc
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "stacked_column_by_category",
        "parameters": {"category_column": category_col, "subcategory_column": subcategory_col, "value_column": value_col},
        "stats": {"total_categories": total_categories, "total_subcategories": total_subcategories},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Yığın sütun grafiği verisi
grouped = df.groupby(['{category_col}', '{subcategory_col}'])['{value_col}'].{aggfunc}()
pivot = grouped.unstack().fillna(0)

pivot.to_excel('yigin_sutun.xlsx')
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "stacked_column_data.xlsx"
    }