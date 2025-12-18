from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    sort_columns = params.get("sort_columns")
    ascending = params.get("ascending")

    if sort_columns is None:
        raise HTTPException(status_code=400, detail="sort_columns parametresi eksik")
    if not isinstance(sort_columns, list) or not all(isinstance(c, str) for c in sort_columns):
        raise HTTPException(status_code=400, detail="sort_columns list of strings olmalı")
    if ascending is None:
        raise HTTPException(status_code=400, detail="ascending parametresi eksik")
    if not (isinstance(ascending, list) and all(isinstance(a, bool) for a in ascending)):
        raise HTTPException(status_code=400, detail="ascending list of bool olmalı")
    if len(sort_columns) != len(ascending):
        raise HTTPException(status_code=400, detail="sort_columns ve ascending listeleri aynı uzunlukta olmalı")

    missing_cols = [c for c in sort_columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}")

    sorted_df = df.sort_values(by=sort_columns, ascending=ascending).reset_index(drop=True)

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        sorted_df.to_excel(writer, index=False, sheet_name="Sorted")
        summary_df = pd.DataFrame({
            "Sorted Columns": sort_columns,
            "Ascending": ascending
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    summary = {
        "sorted_columns": sort_columns,
        "ascending_order": ascending,
        "row_count": len(sorted_df)
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in sort_columns])
    technical_details = {
        "scenario": "sort_by_multiple_columns",
        "parameters": {"sort_columns": sort_columns, "ascending": ascending},
        "stats": {"row_count": len(sorted_df)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu sütuna göre sırala
sorted_df = df.sort_values(by=[{cols_str}], ascending={ascending})

sorted_df.to_excel('siralanmis.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": sorted_df,
        "excel_bytes": output,
        "excel_filename": "sorted_result.xlsx"
    }