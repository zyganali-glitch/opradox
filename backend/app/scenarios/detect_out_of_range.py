from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler: value_column, min_limit, max_limit
    value_column = params.get("value_column")
    min_limit = params.get("min_limit")
    max_limit = params.get("max_limit")
    group_column = params.get("group_column")  # opsiyonel
    date_column = params.get("date_column")    # opsiyonel
    start_date = params.get("start_date")      # opsiyonel
    end_date = params.get("end_date")          # opsiyonel

    if value_column is None:
        raise HTTPException(status_code=400, detail="value_column parametresi gerekli")
    if min_limit is None:
        raise HTTPException(status_code=400, detail="min_limit parametresi gerekli")
    if max_limit is None:
        raise HTTPException(status_code=400, detail="max_limit parametresi gerekli")

    # min_limit ve max_limit sayısal olmalı
    try:
        min_limit = float(min_limit)
        max_limit = float(max_limit)
    except Exception:
        raise HTTPException(status_code=400, detail="min_limit ve max_limit sayısal olmalı")

    if min_limit > max_limit:
        raise HTTPException(status_code=400, detail="min_limit max_limit'den büyük olamaz")

    # Gerekli sütunlar kontrolü
    required_cols = [value_column]
    if group_column:
        required_cols.append(group_column)
    if date_column:
        required_cols.append(date_column)

    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Eksik sütunlar: {missing_cols}")

    # Tarih filtresi varsa uygula
    if date_column:
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True, errors="raise")
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
            df = df[df[date_column] >= start_dt]
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True, errors="raise")
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")
            df = df[df[date_column] <= end_dt]

    # value_column sayısal yap
    df[value_column] = pd.to_numeric(df[value_column], errors="coerce")
    df_valid = df.dropna(subset=[value_column])
    total_count = len(df_valid)

    # Alt/üst sınır dışı değerler
    out_of_range_mask = (df_valid[value_column] < min_limit) | (df_valid[value_column] > max_limit)
    out_of_range_df = df_valid.loc[out_of_range_mask]

    out_of_range_count = len(out_of_range_df)

    # Grup bazlı özet (varsa)
    group_summary = None
    if group_column:
        group_summary_df = out_of_range_df.groupby(group_column)[value_column].agg(['count', 'min', 'max']).reset_index()
        group_summary = group_summary_df.to_dict(orient="records")

    # Excel oluştur
    excel_bytes = BytesIO()
    with pd.ExcelWriter(excel_bytes, engine="openpyxl") as writer:
        df_valid.to_excel(writer, sheet_name="FilteredData", index=False)
        out_of_range_df.to_excel(writer, sheet_name="OutOfRange", index=False)
        summary_df = pd.DataFrame({
            "Metric": ["Total Valid Rows", "Out of Range Rows", "Min Limit", "Max Limit"],
            "Value": [total_count, out_of_range_count, min_limit, max_limit]
        })
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
        if group_summary is not None:
            pd.DataFrame(group_summary).to_excel(writer, sheet_name="GroupSummary", index=False)
    excel_bytes.seek(0)

    summary = {
        "total_valid_rows": total_count,
        "out_of_range_count": out_of_range_count,
        "min_limit": min_limit,
        "max_limit": max_limit,
        "group_column": group_column,
        "group_summary": group_summary,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "detect_out_of_range",
        "parameters": {"value_column": value_column, "min_limit": min_limit, "max_limit": max_limit},
        "stats": {"out_of_range_count": out_of_range_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Aralık dışı değerleri tespit et
min_limit, max_limit = {min_limit}, {max_limit}
out_of_range = df[(df['{value_column}'] < min_limit) | (df['{value_column}'] > max_limit)]

# Sonuç: {out_of_range_count} aralık dışı değer
out_of_range.to_excel('aralik_disi.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": out_of_range_df,
        "excel_bytes": excel_bytes,
        "excel_filename": "out_of_range_report.xlsx"
    }