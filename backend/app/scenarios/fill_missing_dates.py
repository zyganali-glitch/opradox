from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    required_params = ["date_column", "start_date", "end_date"]
    for p in required_params:
        if p not in params or not params[p]:
            raise HTTPException(status_code=400, detail=f"'{p}' parametresi eksik veya boş")
    date_col = params["date_column"]
    start_date = params["start_date"]
    end_date = params["end_date"]
    group_col = params.get("group_column")
    value_col = params.get("value_column")
    aggfunc = params.get("aggfunc", "sum")
    if date_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{date_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")
    if group_col and group_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{group_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")
    if value_col and value_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{value_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")
    try:
        start_dt = pd.to_datetime(start_date, dayfirst=True, errors="raise")
        end_dt = pd.to_datetime(end_date, dayfirst=True, errors="raise")
    except Exception:
        raise HTTPException(status_code=400, detail="start_date veya end_date geçerli tarih formatında değil")
    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="start_date end_date'den büyük olamaz")
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if df[date_col].isna().all():
        raise HTTPException(status_code=400, detail=f"'{date_col}' sütunundaki tüm değerler geçersiz tarih")
    df = df[(df[date_col] >= start_dt) & (df[date_col] <= end_dt)]
    if df.empty:
        raise HTTPException(status_code=400, detail="Veri belirtilen tarih aralığında boş")
    full_dates = pd.date_range(start=start_dt, end=end_dt, freq="D")
    if group_col:
        groups = df[group_col].dropna().unique()
        result_frames = []
        for g in groups:
            sub = df[df[group_col] == g]
            if value_col:
                agg_df = sub.groupby(date_col)[value_col].agg(aggfunc).reset_index()
            else:
                agg_df = sub[[date_col]].drop_duplicates()
            full_df = pd.DataFrame({date_col: full_dates})
            full_df[group_col] = g
            merged = pd.merge(full_df, agg_df, on=date_col, how="left")
            result_frames.append(merged)
        result_df = pd.concat(result_frames, ignore_index=True)
    else:
        if value_col:
            agg_df = df.groupby(date_col)[value_col].agg(aggfunc).reset_index()
        else:
            agg_df = df[[date_col]].drop_duplicates()
        full_df = pd.DataFrame({date_col: full_dates})
        result_df = pd.merge(full_df, agg_df, on=date_col, how="left")
    missing_count = result_df[value_col].isna().sum() if value_col else 0
    excel_bytes = BytesIO()
    with pd.ExcelWriter(excel_bytes, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False, sheet_name="FilledDates")
        summary_df = pd.DataFrame({
            "Parameter": ["Start Date", "End Date", "Total Days", "Groups", "Missing Values"],
            "Value": [start_dt.strftime("%Y-%m-%d"), end_dt.strftime("%Y-%m-%d"), len(full_dates),
                      len(groups) if group_col else 1, missing_count]
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    excel_bytes.seek(0)
    summary = {
        "start_date": start_dt.strftime("%Y-%m-%d"),
        "end_date": end_dt.strftime("%Y-%m-%d"),
        "total_days": len(full_dates),
        "groups_count": len(groups) if group_col else 1,
        "missing_value_count": int(missing_count)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "fill_missing_dates",
        "parameters": {"date_column": date_col, "start_date": str(start_dt.date()), "end_date": str(end_dt.date())},
        "stats": summary,
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Eksik tarihleri doldur
df['{date_col}'] = pd.to_datetime(df['{date_col}'])
full_dates = pd.date_range(start='{start_dt.date()}', end='{end_dt.date()}', freq='D')
full_df = pd.DataFrame({{'{date_col}': full_dates}})
result = pd.merge(full_df, df, on='{date_col}', how='left')

result.to_excel('tarihleri_doldurulmus.xlsx', index=False)
```"""
    }
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result_df,
        "excel_bytes": excel_bytes,
        "excel_filename": "filled_dates.xlsx"
    }