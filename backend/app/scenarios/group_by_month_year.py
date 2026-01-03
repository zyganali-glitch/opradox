from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    date_col = params.get("date_column")
    row_field = params.get("row_field", "year")  # default='year'
    column_field = params.get("column_field", "month")  # default='month'
    aggfunc = params.get("aggfunc", "count").lower()
    value_col = params.get("value_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # date_column auto-detect
    if not date_col:
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        if datetime_cols:
            date_col = datetime_cols[0]
        else:
            for col in df.columns:
                if df[col].dtype == 'object':
                    try:
                        pd.to_datetime(df[col].dropna().head(10), dayfirst=True)
                        date_col = col
                        break
                    except:
                        continue
        if not date_col:
            raise HTTPException(status_code=400, detail="Tarih sütunu otomatik algılanamadı. Lütfen date_column belirtin.")
    
    if aggfunc not in ("count", "sum"):
        raise HTTPException(status_code=400, detail="aggfunc parametresi 'count' veya 'sum' olmalı")
    if aggfunc == "sum" and not value_col:
        raise HTTPException(status_code=400, detail="sum için value_column parametresi gerekli")

    # Sütun varlık kontrolü
    check_cols = [date_col]
    if row_field.lower() not in ["year", "month"]:
        check_cols.append(row_field)
    if column_field.lower() not in ["year", "month"]:
        check_cols.append(column_field)
        
    missing_cols = [c for c in check_cols if c not in df.columns]
    if aggfunc == "sum" and value_col and value_col not in df.columns:
        missing_cols.append(value_col)
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütunlar eksik: {missing_cols}. Mevcut sütunlar: {list(df.columns)[:10]}")

    # Tarih sütununu datetime yap
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if df[date_col].isna().all():
        raise HTTPException(status_code=400, detail=f"{date_col} sütunundaki tüm değerler geçersiz tarih")

    # Tarih filtreleme
    if start_date:
        try:
            start_dt = pd.to_datetime(start_date, dayfirst=True)
            df = df[df[date_col] >= start_dt]
        except Exception:
            raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
    if end_date:
        try:
            end_dt = pd.to_datetime(end_date, dayfirst=True)
            df = df[df[date_col] <= end_dt]
        except Exception:
            raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")

    if df.empty:
        raise HTTPException(status_code=400, detail="Filtreleme sonrası veri yok")

    # Ay ve yıl sütunları oluştur
    df["_year"] = df[date_col].dt.year
    df["_month"] = df[date_col].dt.month

    # Pivot tablosu için index ve columns
    # row_field ve column_field parametreleri ay/yıl içerebilir, onları destekle
    # Eğer row_field veya column_field "year" veya "month" ise df'deki _year/_month kullanılır
    def map_field(f):
        if f.lower() == "year":
            return "_year"
        if f.lower() == "month":
            return "_month"
        return f

    row_idx = map_field(row_field)
    col_idx = map_field(column_field)

    # aggfunc uygulama
    if aggfunc == "count":
        # count için value_col kullanılmaz, sadece sayım
        pivot = pd.pivot_table(df, index=row_idx, columns=col_idx, values=date_col, aggfunc="count", fill_value=0)
    else:
        # sum için value_col sayısal olmalı
        df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
        pivot = pd.pivot_table(df, index=row_idx, columns=col_idx, values=value_col, aggfunc="sum", fill_value=0)

    # Özet bilgi
    summary = {
        "rows": pivot.shape[0],
        "columns": pivot.shape[1],
        "aggfunc": aggfunc,
        "row_field": row_field,
        "column_field": column_field,
        "date_column": date_col,
        "filtered_rows": len(df),
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "group_by_month_year",
        "parameters": {
            "date_column": date_col,
            "row_field": row_field,
            "column_field": column_field,
            "aggfunc": aggfunc
        },
        "stats": {
            "output_rows": pivot.shape[0],
            "output_columns": pivot.shape[1],
            "filtered_rows": len(df)
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')
df['{date_col}'] = pd.to_datetime(df['{date_col}'])

# Ay/Yıl bazında gruplama
df['year'] = df['{date_col}'].dt.year
df['month'] = df['{date_col}'].dt.month

pivot = pd.pivot_table(df, index='{row_field}', columns='{column_field}', 
                        values='{date_col}', aggfunc='{aggfunc}', fill_value=0)

# Sonuç: {pivot.shape[0]} satır x {pivot.shape[1]} sütun
pivot.to_excel('aylik_yillik_ozet.xlsx')
```"""
    }

    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_sample = df.head(100)
        df_sample.to_excel(writer, sheet_name="SampleData", index=False)
        pivot.to_excel(writer, sheet_name="Summary")
        # Özet bilgiyi dataframe yapıp yazalım
        summary_df = pd.DataFrame(list(summary.items()), columns=["Key", "Value"])
        summary_df.to_excel(writer, sheet_name="Info", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "monthly_yearly_summary.xlsx"
    }