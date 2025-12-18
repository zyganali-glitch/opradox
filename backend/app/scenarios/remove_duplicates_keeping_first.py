from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_column = params.get("group_column")
    if not group_column:
        raise HTTPException(status_code=400, detail="group_column parametresi eksik")
    if group_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"{group_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}")

    # Keep first occurrence of each duplicate group based on group_column
    before_count = len(df)
    df_cleaned = df.drop_duplicates(subset=[group_column], keep="first").reset_index(drop=True)
    after_count = len(df_cleaned)
    removed_count = before_count - after_count

    summary = {
        "group_column": group_column,
        "original_row_count": before_count,
        "removed_duplicates_count": removed_count,
        "remaining_row_count": after_count,
        "description": "Her duplicate grubunda ilk satır korundu, diğerleri silindi."
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "remove_duplicates_keeping_first",
        "parameters": {"group_column": group_column},
        "stats": {"removed_count": removed_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Tekrar eden kayıtları sil (ilki kalsın)
df_clean = df.drop_duplicates(subset=['{group_column}'], keep='first')

# {removed_count} satır silindi
df_clean.to_excel('temiz.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_cleaned.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_cleaned,
        "excel_bytes": output,
        "excel_filename": "duplicates_removed.xlsx"
    }