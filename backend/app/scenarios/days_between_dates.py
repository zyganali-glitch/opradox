from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    start_col = params.get("start_date_column")
    end_col = params.get("end_date_column")
    output_col = params.get("output_column", "DaysDiff")  # default='DaysDiff'

    # start_date_column zorunlu
    if not start_col:
        raise HTTPException(status_code=400, detail="start_date_column parametresi zorunludur.")
    
    if start_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{start_col}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)[:10]}")

    start_dates = pd.to_datetime(df[start_col], dayfirst=True, errors="coerce")
    
    # end_date_column boşsa bugünün tarihini kullan
    if not end_col:
        end_dates = pd.Series([pd.Timestamp.today().normalize()] * len(df))
        end_col_info = "Bugün"
    else:
        if end_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"'{end_col}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)[:10]}")
        end_dates = pd.to_datetime(df[end_col], dayfirst=True, errors="coerce")
        end_col_info = end_col

    if start_dates.isna().all():
        raise HTTPException(status_code=400, detail=f"{start_col} sütunundaki tüm değerler geçersiz tarih")

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