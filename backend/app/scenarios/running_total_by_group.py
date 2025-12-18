from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_column = params.get("group_column")
    value_column = params.get("value_column")
    target_column = params.get("target_column", "running_total")
    date_column = params.get("date_column", None)
    start_date = params.get("start_date", None)
    end_date = params.get("end_date", None)

    if not group_column or not value_column:
        raise HTTPException(status_code=400, detail="group_column ve value_column parametreleri zorunludur")

    missing_cols = [col for col in [group_column, value_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Eksik sütunlar: {missing_cols}. Mevcut sütunlar: {list(df.columns)}")

    df = df.copy()

    if date_column:
        if date_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_column}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}")
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_date_parsed = pd.to_datetime(start_date, dayfirst=True, errors="raise")
                df = df[df[date_column] >= start_date_parsed]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date parametresi geçerli bir tarih değil")
        if end_date:
            try:
                end_date_parsed = pd.to_datetime(end_date, dayfirst=True, errors="raise")
                df = df[df[date_column] <= end_date_parsed]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date parametresi geçerli bir tarih değil")
        df = df.sort_values(by=[group_column, date_column])
    else:
        df = df.sort_values(by=[group_column])

    df[value_column] = pd.to_numeric(df[value_column], errors="coerce")
    df[target_column] = df.groupby(group_column)[value_column].cumsum()

    summary = {
        "group_column": group_column,
        "value_column": value_column,
        "target_column": target_column,
        "row_count": len(df),
        "groups_count": df[group_column].nunique(),
        "date_filtered": bool(date_column and (start_date or end_date))
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "running_total_by_group",
        "parameters": {"group_column": group_column, "value_column": value_column},
        "stats": {"groups_count": int(df[group_column].nunique())},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Grup bazlı kümülatif toplam
df = df.sort_values('{group_column}')
df['{target_column}'] = df.groupby('{group_column}')['{value_column}'].cumsum()

df.to_excel('kumulatif_toplam.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Result")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "running_total_by_group.xlsx"
    }