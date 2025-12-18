from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    col = params.get("column")
    if not col:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'column' gereklidir.")
    if col not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"'{col}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}"
        )
    series = df[col].dropna()
    counts = series.value_counts(dropna=True).sort_index()
    result_df = pd.DataFrame({col: counts.index, "count": counts.values})
    summary = {
        "column": col,
        "unique_count": len(counts),
        "total_non_null": len(series),
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "unique_list_with_counts",
        "parameters": {"column": col},
        "stats": {"unique_count": len(counts)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Benzersiz değerler ve sayıları
counts = df['{col}'].value_counts()

# {len(counts)} benzersiz değer bulundu
counts.to_excel('unique_counts.xlsx')
```"""
    }
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False, sheet_name="UniqueCounts")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result_df,
        "excel_bytes": output,
        "excel_filename": f"unique_counts_{col}.xlsx"
    }