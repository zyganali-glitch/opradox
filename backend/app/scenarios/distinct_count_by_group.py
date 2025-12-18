from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_col = params.get("group_column")
    distinct_col = params.get("distinct_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_col = params.get("date_column")

    if not group_col:
        raise HTTPException(status_code=400, detail="group_column parametresi gerekli")
    if not distinct_col:
        raise HTTPException(status_code=400, detail="distinct_column parametresi gerekli")

    missing_cols = [c for c in [group_col, distinct_col] if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"'{', '.join(missing_cols)}' sütunu(ları) eksik, mevcut sütunlar: {list(df.columns)}")

    if date_col:
        if date_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_col}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_col] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih formatında değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_col] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih formatında değil")

    grouped = df.groupby(group_col)[distinct_col].nunique(dropna=True).reset_index()
    grouped = grouped.rename(columns={distinct_col: "distinct_count"})

    summary = {
        "group_column": group_col,
        "distinct_column": distinct_col,
        "groups_count": grouped.shape[0],
        "total_distinct_count": int(grouped["distinct_count"].sum())
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "distinct_count_by_group",
        "parameters": {"group_column": group_col, "distinct_column": distinct_col},
        "stats": {"groups_count": grouped.shape[0], "total_distinct": int(grouped["distinct_count"].sum())},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Grup bazında benzersiz değer sayısı
result = df.groupby('{group_col}')['{distinct_col}'].nunique().reset_index()
result.columns = ['{group_col}', 'distinct_count']

# Sonuç: {grouped.shape[0]} grup, toplam {int(grouped["distinct_count"].sum())} benzersiz değer
result.to_excel('benzersiz_sayim.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        grouped.to_excel(writer, index=False, sheet_name="DistinctCountByGroup")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": grouped,
        "excel_bytes": output,
        "excel_filename": "distinct_count_by_group.xlsx"
    }