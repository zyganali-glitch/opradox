from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_col = params.get("group_column")
    value_col = params.get("value_column")
    lower_quantile = params.get("lower_quantile", 0.05)
    upper_quantile = params.get("upper_quantile", 0.95)
    flag_col = params.get("flag_column", "outlier_flag")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_col = params.get("date_column")

    # value_column boşsa ilk numeric auto-seç
    if not value_col:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            value_col = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen value_column belirtin.")
    if group_col is not None and not isinstance(group_col, str):
        raise HTTPException(status_code=400, detail="group_column parametresi string olmalı")
    if not (0 <= lower_quantile < upper_quantile <= 1):
        raise HTTPException(status_code=400, detail="lower_quantile ve upper_quantile 0-1 aralığında ve lower < upper olmalı")
    if date_col is not None and (start_date is not None or end_date is not None):
        if date_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_col}' mevcut değil, mevcut sütunlar: {list(df.columns)}")
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
        if start_date is not None:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
            df = df[df[date_col] >= start_dt]
        if end_date is not None:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")
            df = df[df[date_col] <= end_dt]

    required_cols = [value_col]
    if group_col:
        required_cols.append(group_col)
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"'{missing_cols}' sütunları eksik, mevcut sütunlar: {list(df.columns)}")

    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df_filtered = df.dropna(subset=[value_col])
    if df_filtered.empty:
        raise HTTPException(status_code=400, detail=f"value_column '{value_col}' sayısal veri içermiyor veya tümü NaN")

    def flag_outliers(group):
        q_low = group[value_col].quantile(lower_quantile)
        q_high = group[value_col].quantile(upper_quantile)
        flags = group[value_col].apply(lambda x: 1 if (x < q_low or x > q_high) else 0)
        return flags

    if group_col:
        df_filtered[flag_col] = df_filtered.groupby(group_col, group_keys=False).apply(flag_outliers)
    else:
        q_low = df_filtered[value_col].quantile(lower_quantile)
        q_high = df_filtered[value_col].quantile(upper_quantile)
        df_filtered[flag_col] = df_filtered[value_col].apply(lambda x: 1 if (x < q_low or x > q_high) else 0)

    total_rows = len(df_filtered)
    outlier_count = df_filtered[flag_col].sum()
    outlier_ratio = outlier_count / total_rows if total_rows > 0 else 0

    output_df = df_filtered.copy()

    excel_bytes = BytesIO()
    with pd.ExcelWriter(excel_bytes, engine="openpyxl") as writer:
        output_df.to_excel(writer, index=False, sheet_name="Flagged Data")
        summary_df = pd.DataFrame({
            "Metric": ["Total Rows", "Outlier Count", "Outlier Ratio"],
            "Value": [total_rows, outlier_count, outlier_ratio]
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    excel_bytes.seek(0)

    summary = {
        "total_rows": total_rows,
        "outlier_count": int(outlier_count),
        "outlier_ratio": round(outlier_ratio, 4),
        "flag_column": flag_col,
        "lower_quantile": lower_quantile,
        "upper_quantile": upper_quantile,
        "group_column": group_col if group_col else None
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "outlier_flagging",
        "parameters": {
            "value_column": value_col,
            "lower_quantile": lower_quantile,
            "upper_quantile": upper_quantile,
            "group_column": group_col
        },
        "stats": {"outlier_count": int(outlier_count), "outlier_ratio": round(outlier_ratio, 4)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Outlier/aykırı değer tespiti (quantile yöntemi)
q_low = df['{value_col}'].quantile({lower_quantile})
q_high = df['{value_col}'].quantile({upper_quantile})
df['{flag_col}'] = ((df['{value_col}'] < q_low) | (df['{value_col}'] > q_high)).astype(int)

# Sonuç: {outlier_count} aykırı değer ({outlier_ratio:.2%})
df.to_excel('aykiri_degerler.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": output_df,
        "excel_bytes": excel_bytes,
        "excel_filename": "outlier_flagged_data.xlsx"
    }