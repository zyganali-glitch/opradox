from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException
import re

def clean_text(s: Any) -> Any:
    if pd.isna(s):
        return s
    if not isinstance(s, str):
        s = str(s)
    # Remove leading/trailing spaces and multiple spaces inside
    s = s.strip()
    s = re.sub(r'\s+', ' ', s)
    # Remove hidden/control characters except normal printable ones
    s = ''.join(ch for ch in s if ch.isprintable())
    return s

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    text_columns = params.get("text_columns")
    if text_columns is None:
        raise HTTPException(status_code=400, detail="text_columns parametresi gerekli")
    if not isinstance(text_columns, list) or not all(isinstance(c, str) for c in text_columns):
        raise HTTPException(status_code=400, detail="text_columns list of strings olmalı")
    missing_cols = [c for c in text_columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Metin sütunları eksik: {missing_cols} mevcut sütunlar: {list(df.columns)}")

    df_cleaned = df.copy()
    for col in text_columns:
        df_cleaned[col] = df_cleaned[col].apply(clean_text)

    summary = {
        "original_rows": len(df),
        "cleaned_columns": text_columns,
        "cleaned_rows": len(df_cleaned)
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in text_columns])
    technical_details = {
        "scenario": "trim_clean_text",
        "parameters": {"text_columns": text_columns},
        "stats": {"cleaned_rows": len(df_cleaned)},
        "python_code": f"""```python
import pandas as pd
import re

df = pd.read_excel('dosya.xlsx')

# Metin temizleme (boşlukları düzelt)
for col in [{cols_str}]:
    df[col] = df[col].str.strip()
    df[col] = df[col].str.replace(r'\\s+', ' ', regex=True)

df.to_excel('temizlenmis.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_cleaned.to_excel(writer, index=False, sheet_name="Cleaned")
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_cleaned,
        "excel_bytes": output,
        "excel_filename": "cleaned_text.xlsx"
    }