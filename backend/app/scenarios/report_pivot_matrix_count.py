from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    row_field = params.get("row_field")
    column_field = params.get("column_field")

    if not row_field or not isinstance(row_field, str):
        raise HTTPException(status_code=400, detail="Eksik veya hatalı parametre: row_field")
    if not column_field or not isinstance(column_field, str):
        raise HTTPException(status_code=400, detail="Eksik veya hatalı parametre: column_field")

    missing_cols = [col for col in [row_field, column_field] if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"DataFrame'de eksik sütunlar: {missing_cols}"
        )

    # Pivot table with count of rows
    pivot = pd.pivot_table(
        df,
        index=row_field,
        columns=column_field,
        aggfunc='size',
        fill_value=0
    )

    # Summary info
    total_rows = len(df)
    unique_rows = df[row_field].nunique()
    unique_cols = df[column_field].nunique()

    summary = {
        "total_rows": total_rows,
        "unique_row_values": unique_rows,
        "unique_column_values": unique_cols,
        "pivot_shape": pivot.shape
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "report_pivot_matrix_count",
        "parameters": {"row_field": row_field, "column_field": column_field},
        "stats": {"total_rows": total_rows, "unique_row_values": unique_rows},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çapraz tablo (sayım - crosstab)
pivot = pd.crosstab(df['{row_field}'], df['{column_field}'])

pivot.to_excel('capraz_tablo_sayim.xlsx')
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="Pivot")
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "pivot_count_report.xlsx"
    }