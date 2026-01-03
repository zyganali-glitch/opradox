from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    key_column = params.get("key_column")
    
    # key_column boşsa tüm sütunlara göre benzersizlik kontrolü
    if not key_column:
        key_column = df.columns.tolist()
    elif isinstance(key_column, str):
        key_column = [key_column]
    
    # key_column tek sütunsa string döndür
    if isinstance(key_column, list) and len(key_column) == 1:
        subset = key_column
    else:
        subset = key_column if isinstance(key_column, list) else [key_column]
    
    missing = [c for c in subset if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"{missing} sütunları bulunamadı, mevcut sütunlar: {list(df.columns)[:10]}")

    # Benzersiz kayıtları tut
    unique_df = df.drop_duplicates(subset=[key_column], keep=False)

    summary = {
        "original_row_count": len(df),
        "unique_row_count": len(unique_df),
        "dropped_duplicates_count": len(df) - len(unique_df)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "keep_uniques_only",
        "parameters": {"key_column": key_column},
        "stats": summary,
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Sadece benzersiz kayıtları tut (tekrarlayanları çıkar)
unique_df = df.drop_duplicates(subset=['{key_column}'], keep=False)

# Sonuç: {len(unique_df)} benzersiz kayıt (silinen: {len(df) - len(unique_df)})
unique_df.to_excel('benzersizler.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        unique_df.to_excel(writer, index=False, sheet_name="UniqueRecords")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": unique_df,
        "excel_bytes": output,
        "excel_filename": "unique_records.xlsx"
    }