from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    start_col = params.get("start_date_column")
    end_col = params.get("end_date_column")

    if not start_col or not end_col:
        raise HTTPException(status_code=400, detail="start_date_column ve end_date_column parametreleri zorunludur")

    missing_cols = [c for c in [start_col, end_col] if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Eksik sütunlar: {missing_cols}. Mevcut sütunlar: {list(df.columns)}")

    start_dates = pd.to_datetime(df[start_col], dayfirst=True, errors="coerce")
    end_dates = pd.to_datetime(df[end_col], dayfirst=True, errors="coerce")

    if start_dates.isna().all():
        raise HTTPException(status_code=400, detail=f"{start_col} sütunundaki tüm değerler geçersiz tarih")
    if end_dates.isna().all():
        raise HTTPException(status_code=400, detail=f"{end_col} sütunundaki tüm değerler geçersiz tarih")

    df = df.copy()
    df["days_between"] = (end_dates - start_dates).dt.days

    valid_days = df["days_between"].dropna()
    summary = {
        "total_rows": len(df),
        "valid_days_count": int(valid_days.count()),
        "min_days": int(valid_days.min()) if not valid_days.empty else None,
        "max_days": int(valid_days.max()) if not valid_days.empty else None,
        "mean_days": float(round(valid_days.mean(), 2)) if not valid_days.empty else None,
        "null_days_count": int(df["days_between"].isna().sum())
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "days_between_dates",
        "parameters": {"start_date_column": start_col, "end_date_column": end_col},
        "stats": summary,
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# İki tarih arasındaki gün farkı
df['{start_col}'] = pd.to_datetime(df['{start_col}'], dayfirst=True)
df['{end_col}'] = pd.to_datetime(df['{end_col}'], dayfirst=True)
df['days_between'] = (df['{end_col}'] - df['{start_col}']).dt.days

df.to_excel('gun_farki.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "days_between_dates_result.xlsx"
    }