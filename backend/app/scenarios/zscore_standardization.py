from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Parametre kontrolü
    value_col = params.get("value_column")
    target_col = params.get("target_column")
    group_col = params.get("group_column")
    date_col = params.get("date_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    if not value_col or not target_col:
        raise HTTPException(status_code=400, detail="value_column ve target_column parametreleri zorunludur")

    # Only check value_col exists (target_col is a new column to be created)
    missing_cols = []
    if value_col not in df.columns:
        missing_cols.append(value_col)
    if group_col and group_col not in df.columns:
        missing_cols.append(group_col)
    if date_col and date_col not in df.columns:
        missing_cols.append(date_col)
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Eksik sütunlar: {missing_cols}")

    # Tarih filtresi uygula
    if date_col:
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
        if start_date:
            start_dt = pd.to_datetime(start_date, dayfirst=True, errors="coerce")
            if pd.isna(start_dt):
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
            df = df[df[date_col] >= start_dt]
        if end_date:
            end_dt = pd.to_datetime(end_date, dayfirst=True, errors="coerce")
            if pd.isna(end_dt):
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")
            df = df[df[date_col] <= end_dt]

    # value_col sayısal yap
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df_valid = df.dropna(subset=[value_col])

    if df_valid.empty:
        raise HTTPException(status_code=400, detail="value_column sütununda geçerli sayısal veri yok")

    # Z-skor hesaplama
    if group_col:
        grouped = df_valid.groupby(group_col)[value_col]
        mean_series = grouped.transform("mean")
        std_series = grouped.transform("std")
    else:
        mean_val = df_valid[value_col].mean()
        std_val = df_valid[value_col].std()
        mean_series = pd.Series(mean_val, index=df_valid.index)
        std_series = pd.Series(std_val, index=df_valid.index)

    # std 0 ise hata veya NaN yap
    z_scores = (df_valid[value_col] - mean_series) / std_series.replace(0, pd.NA)

    # Orijinal df'ye zscore sütunu ekle
    df_result = df.copy()
    df_result[target_col] = pd.NA
    df_result.loc[df_valid.index, target_col] = z_scores

    # Özet
    summary = {
        "total_rows": len(df),
        "valid_rows": len(df_valid),
        "zscore_column": target_col,
        "grouped_by": group_col if group_col else None,
        "date_filtered": bool(date_col and (start_date or end_date))
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "zscore_standardization",
        "parameters": {"value_column": value_col, "target_column": target_col},
        "stats": {"valid_rows": len(df_valid)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Z-skor standardizasyonu
mean_val = df['{value_col}'].mean()
std_val = df['{value_col}'].std()
df['{target_col}'] = (df['{value_col}'] - mean_val) / std_val

df.to_excel('zscore.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_result.to_excel(writer, index=False, sheet_name="Result")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_result,
        "excel_bytes": output,
        "excel_filename": "zscore_standardized.xlsx"
    }