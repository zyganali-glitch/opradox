from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Parametreleri al (get ile, böylece eksikse None gelir)
    date_col = params.get("date_column")
    cat_col = params.get("category_column")
    val_col = params.get("value_column")
    aggfunc = params.get("aggfunc", "sum").lower()
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # date_col auto-detect
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

    # category_column auto-detect
    if not cat_col:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        # date_col olmamalı
        object_cols = [c for c in object_cols if c != date_col]
        if object_cols:
            cat_col = object_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Kategori sütunu bulunamadı. Lütfen category_column belirtin.")

    # value_column auto-detect
    if not val_col:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            val_col = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")

    # Sütun kontrolü - auto detect sonrası tekrar kontrol (zaten yukarıda bulduk ama emin olmak için)
    missing_cols = [c for c in [date_col, cat_col, val_col] if c not in df.columns]
    if missing_cols:
         # Auto detect çalışmış ama sütun yok olmuş olamaz ama yine de bırakalım
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}")

    # Tarih kolonunu datetime yap
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if df[date_col].isna().all():
        raise HTTPException(status_code=400, detail=f"'{date_col}' sütununda geçerli tarih yok")

    # Tarih aralığı filtrele
    try:
        start_dt = pd.to_datetime(start_date, dayfirst=True)
        end_dt = pd.to_datetime(end_date, dayfirst=True)
    except Exception:
        raise HTTPException(status_code=400, detail="start_date veya end_date geçerli tarih değil")

    df = df[(df[date_col] >= start_dt) & (df[date_col] <= end_dt)]
    if df.empty:
        raise HTTPException(status_code=400, detail="Veri belirtilen tarih aralığında boş")

    # Değer kolonunu sayısal yap
    df[val_col] = pd.to_numeric(df[val_col], errors="coerce")

    # Ay bazında grupla (yıl-ay)
    df["year_month"] = df[date_col].dt.to_period("M").dt.to_timestamp()

    # aggfunc kontrolü
    if aggfunc not in ["sum", "count"]:
        raise HTTPException(status_code=400, detail="aggfunc parametresi 'sum' veya 'count' olmalı")

    # Pivot tablosu oluştur
    if aggfunc == "sum":
        pivot = pd.pivot_table(df, index="year_month", columns=cat_col, values=val_col, aggfunc="sum", fill_value=0)
    else:  # count
        # count için val_col'da NaN olanlar sayılmaz, o yüzden önce filtrele
        pivot = pd.pivot_table(df.dropna(subset=[val_col]), index="year_month", columns=cat_col, values=val_col, aggfunc="count", fill_value=0)

    # Özet bilgileri
    total_periods = pivot.shape[0]
    total_categories = pivot.shape[1]
    total_records = len(df)
    total_value = df[val_col].sum() if aggfunc == "sum" else df[val_col].count()

    summary = {
        "aggfunc": aggfunc,
        "date_range": {"start": str(start_dt.date()), "end": str(end_dt.date())},
        "periods_count": total_periods,
        "categories_count": total_categories,
        "records_in_range": total_records,
        "total_value": float(total_value)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "summarize_by_month_and_category",
        "parameters": {"date_column": date_col, "category_column": cat_col, "value_column": val_col},
        "stats": {"periods_count": total_periods, "categories_count": total_categories},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Ay ve kategoriye göre özet
df['{date_col}'] = pd.to_datetime(df['{date_col}'])
df['year_month'] = df['{date_col}'].dt.to_period('M')
pivot = pd.pivot_table(df, index='year_month', columns='{cat_col}', values='{val_col}', aggfunc='{aggfunc}')

pivot.to_excel('ay_kategori_ozet.xlsx')
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="Pivot")
        # Summary sheet
        summary_df = pd.DataFrame.from_dict(summary, orient="index", columns=["Value"])
        summary_df.to_excel(writer, sheet_name="Summary")

    output.seek(0)
    filename = f"time_series_report_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.xlsx"

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": filename
    }