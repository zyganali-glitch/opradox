from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    row_field = params.get("row_field")
    column_field = params.get("column_field")

    # row_field ve column_field boşsa ilk 2 kategorik sütunu seç
    if not row_field or not column_field:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if len(object_cols) >= 2:
            if not row_field:
                row_field = object_cols[0]
            if not column_field:
                column_field = object_cols[1]
        else:
             if not row_field:
                 raise HTTPException(status_code=400, detail="Satır alanı (row_field) için kategorik sütun bulunamadı.")
             if not column_field:
                 raise HTTPException(status_code=400, detail="Sütun alanı (column_field) için ikinci bir kategorik sütun bulunamadı.")

    if not isinstance(row_field, str):
         # list gelirse str yap
         if isinstance(row_field, list) and len(row_field) > 0:
             row_field = row_field[0]
         else:
             raise HTTPException(status_code=400, detail="Eksik veya hatalı parametre: row_field")

    if not isinstance(column_field, str):
         if isinstance(column_field, list) and len(column_field) > 0:
             column_field = column_field[0]
         else:
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