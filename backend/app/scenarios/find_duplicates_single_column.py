from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    col = params.get("column")
    
    # column boşsa ilk sütunu kullan
    if not col:
        if len(df.columns) > 0:
            col = df.columns[0]
        else:
            raise HTTPException(status_code=400, detail="Veri seti boş. Lütfen column parametresi belirtin.")
    
    if col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{col}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)[:10]}")

    # Değerleri string yapıp boşları NaN yapalım
    series = df[col].astype(str).replace({"nan": pd.NA, "None": pd.NA, "": pd.NA})
    duplicates_mask = series.duplicated(keep=False) & series.notna()

    df_result = df.copy()
    df_result["is_duplicate"] = duplicates_mask

    duplicate_values = series[duplicates_mask].unique()
    count_duplicates = len(duplicate_values)
    count_rows_with_duplicates = duplicates_mask.sum()

    summary = {
        "column_checked": col,
        "duplicate_values_count": count_duplicates,
        "rows_with_duplicates_count": int(count_rows_with_duplicates)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "find_duplicates_single_column",
        "parameters": {"column": col},
        "stats": {
            "duplicate_values_count": count_duplicates,
            "rows_with_duplicates_count": int(count_rows_with_duplicates)
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# '{col}' sütunundaki tekrarlayan değerleri bul
duplicates = df[df['{col}'].duplicated(keep=False)]

# Sonuç: {count_duplicates} benzersiz tekrarlayan değer, {count_rows_with_duplicates} satır
print(f"Tekrarlayan: {{len(duplicates)}} satır")
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_result.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame(summary, index=[0]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_result,
        "excel_bytes": output,
        "excel_filename": f"duplicates_in_{col}.xlsx"
    }