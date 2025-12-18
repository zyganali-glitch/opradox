from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_column = params.get("group_column")
    tag_column = params.get("tag_column", "is_first")

    if not group_column:
        raise HTTPException(status_code=400, detail="group_column parametresi gerekli")
    if group_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{group_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}"
        )

    df_copy = df.copy()
    df_copy[tag_column] = ~df_copy.duplicated(subset=[group_column])

    summary = {
        "group_column": group_column,
        "tag_column": tag_column,
        "total_rows": len(df_copy),
        "unique_groups": df_copy[group_column].nunique(),
        "first_occurrences": int(df_copy[tag_column].sum())
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "tag_first_occurrence",
        "parameters": {"group_column": group_column, "tag_column": tag_column},
        "stats": {"first_occurrences": int(df_copy[tag_column].sum())},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# İlk oluşumu işaretle
df['{tag_column}'] = ~df.duplicated(subset=['{group_column}'])

df.to_excel('ilk_isareti.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_copy.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")

    output.seek(0)
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_copy,
        "excel_bytes": output,
        "excel_filename": "tagged_first_occurrences.xlsx"
    }