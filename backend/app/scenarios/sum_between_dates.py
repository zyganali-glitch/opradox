from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import HTTPException


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo: Tarih aralığına göre toplam tutar.

    Beklenen params:
    - date_column
    - start_date
    - end_date
    - target_column
    - return_mode
    """
    date_column = params.get("date_column")
    start_date_str = params.get("start_date")
    end_date_str = params.get("end_date")
    target_column = params.get("target_column") or params.get("value_column")
    return_mode = params.get("return_mode", "summary")

    missing = []
    if not date_column:
        missing.append("date_column")
    # start_date ve end_date artık opsiyonel
    if not target_column:
        missing.append("target_column")

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Zorunlu parametre(ler) eksik: {missing}",
        )

    if date_column not in df.columns or target_column not in df.columns:
        missing_cols = [
            col for col in [date_column, target_column] if col not in df.columns
        ]
        raise HTTPException(
            status_code=400,
            detail=(
                f"Aşağıdaki sütun(lar) bulunamadı: {missing_cols}. "
                f"Mevcut sütunlar: {list(df.columns)}"
            ),
        )

    # Optional date parsing
    try:
        if start_date_str:
            start_date = pd.to_datetime(start_date_str, dayfirst=True)
        else:
            start_date = pd.Timestamp.min

        if end_date_str:
            end_date = pd.to_datetime(end_date_str, dayfirst=True)
        else:
            end_date = pd.Timestamp.max
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Tarih formatı geçersiz (start_date/end_date). Örn: 01.01.2024",
        )

    date_series = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
    mask = (date_series >= start_date) & (date_series <= end_date)

    filtered_df = df[mask].copy()
    match_count = int(mask.sum())
    total_rows = int(len(df))

    numeric_series = pd.to_numeric(filtered_df[target_column], errors="coerce")
    sum_value = float(numeric_series.sum()) if match_count > 0 else 0.0

    summary = {
        "scenario": "sum_between_dates",
        "date_column": date_column,
        "start_date": start_date_str,
        "end_date": end_date_str,
        "target_column": target_column,
        "match_count": match_count,
        "total_rows": total_rows,
        "sum_value": sum_value,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "sum_between_dates",
        "parameters": {"date_column": date_column, "start_date": start_date_str, "end_date": end_date_str, "target_column": target_column},
        "stats": {"sum_value": sum_value, "match_count": match_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Tarih aralığında toplam
df['{date_column}'] = pd.to_datetime(df['{date_column}'])
mask = (df['{date_column}'] >= '{start_date_str}') & (df['{date_column}'] <= '{end_date_str}')
total = df.loc[mask, '{target_column}'].sum()

# Sonuç: {sum_value}
print(f"Toplam: {{total}}")
```"""
    }

    if return_mode == "summary":
        return {
            "summary": summary,
            "technical_details": technical_details,
            "excel_bytes": None,
            "excel_filename": None,
        }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        filtered_df.to_excel(writer, index=False, sheet_name="Matches")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")

    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": filtered_df,
        "excel_bytes": output,
        "excel_filename": "opradox_sum_between_dates.xlsx",
    }
