from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    date_col = params.get("date_column")
    new_col = params.get("age_column", "age")

    if not date_col:
        raise HTTPException(status_code=400, detail="date_column parametresi gerekli")
    if date_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"{date_col} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")

    dob_series = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if dob_series.isna().all():
        raise HTTPException(status_code=400, detail=f"{date_col} sütunundaki tüm değerler geçersiz tarih")

    today = pd.Timestamp.today().normalize()
    age_years = (today - dob_series).dt.days // 365
    df[new_col] = age_years.where(dob_series.notna(), None)

    summary = {
        "input_rows": len(df),
        "valid_dates": int(dob_series.notna().sum()),
        "age_column": new_col,
        "age_min": int(age_years.min()) if age_years.notna().any() else None,
        "age_max": int(age_years.max()) if age_years.notna().any() else None,
        "age_mean": float(round(age_years.mean(), 2)) if age_years.notna().any() else None
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "compute_age_from_dob",
        "parameters": {"date_column": date_col, "age_column": new_col},
        "stats": summary,
        "python_code": f"""```python
import pandas as pd
from datetime import datetime

df = pd.read_excel('dosya.xlsx')

# Doğum tarihinden yaş hesapla
df['{date_col}'] = pd.to_datetime(df['{date_col}'], dayfirst=True)
today = pd.Timestamp.today()
df['{new_col}'] = (today - df['{date_col}']).dt.days // 365

df.to_excel('yas_hesaplama.xlsx', index=False)
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
        "excel_filename": "age_calculation_result.xlsx"
    }