from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_column = params.get("group_column")
    value_column = params.get("value_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_column = params.get("date_column")

    if not group_column:
        raise HTTPException(status_code=400, detail="group_column parametresi gerekli")
    if not value_column:
        raise HTTPException(status_code=400, detail="value_column parametresi gerekli")

    missing_cols = [col for col in [group_column, value_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"'{', '.join(missing_cols)}' sütunu(ları) bulunamadı. Mevcut sütunlar: {list(df.columns)}")

    df_filtered = df.copy()

    if date_column:
        if date_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_column}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}")
        df_filtered[date_column] = pd.to_datetime(df_filtered[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df_filtered = df_filtered[df_filtered[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli bir tarih değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df_filtered = df_filtered[df_filtered[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli bir tarih değil")

    df_filtered[value_column] = pd.to_numeric(df_filtered[value_column], errors="coerce")
    df_filtered = df_filtered.dropna(subset=[group_column, value_column])

    grouped = df_filtered.groupby(group_column)[value_column].agg(['count', 'sum']).reset_index()
    grouped.rename(columns={'count': 'record_count', 'sum': 'total_sum'}, inplace=True)

    summary = {
        "group_column": group_column,
        "value_column": value_column,
        "total_groups": grouped.shape[0],
        "total_records": int(grouped['record_count'].sum()),
        "total_sum": grouped['total_sum'].sum().item() if hasattr(grouped['total_sum'].sum(), "item") else grouped['total_sum'].sum()
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "report_group_summary",
        "parameters": {"group_column": group_column, "value_column": value_column},
        "stats": {"total_groups": grouped.shape[0], "total_sum": summary["total_sum"]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Grup özeti raporu
grouped = df.groupby('{group_column}')['{value_column}'].agg(['count', 'sum'])
grouped.columns = ['record_count', 'total_sum']

grouped.to_excel('grup_ozeti.xlsx')
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        grouped.to_excel(writer, sheet_name="Grouped Summary", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": grouped,
        "excel_bytes": output,
        "excel_filename": f"grouped_summary_{group_column}_{value_column}.xlsx"
    }