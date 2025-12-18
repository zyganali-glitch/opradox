from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler: columns (list), find_str (str), replace_str (str)
    # Support both 'column' (singular) and 'columns' (plural) parameter names
    if "columns" not in params and "column" not in params:
        raise HTTPException(status_code=400, detail="Eksik parametre: columns")
    
    # Convert singular 'column' to 'columns' list if needed
    if "columns" not in params and "column" in params:
        params["columns"] = [params["column"]] if isinstance(params["column"], str) else params["column"]
    if "find_str" not in params:
        raise HTTPException(status_code=400, detail="Eksik parametre: find_str")
    if "replace_str" not in params:
        raise HTTPException(status_code=400, detail="Eksik parametre: replace_str")

    columns = params["columns"]
    find_str = params["find_str"]
    replace_str = params["replace_str"]

    if not isinstance(columns, list) or not all(isinstance(c, str) for c in columns):
        raise HTTPException(status_code=400, detail="columns parametresi string listesi olmalı")
    if not isinstance(find_str, str) or not isinstance(replace_str, str):
        raise HTTPException(status_code=400, detail="find_str ve replace_str string olmalı")

    missing_cols = [c for c in columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Belirtilen sütunlar bulunamadı: {missing_cols}")

    df_copy = df.copy()
    total_replacements = 0
    for col in columns:
        if not pd.api.types.is_string_dtype(df_copy[col]):
            # Sayısal veya başka tip ise stringe çevir
            df_copy[col] = df_copy[col].astype(str)
        # Değiştirme işlemi
        replaced_series = df_copy[col].str.replace(find_str, replace_str, regex=False)
        # Kaç değişiklik oldu?
        changes = (df_copy[col] != replaced_series).sum()
        total_replacements += changes
        df_copy[col] = replaced_series

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_copy.to_excel(writer, index=False, sheet_name="Result")
        summary_df = pd.DataFrame({
            "Parameter": ["find_str", "replace_str", "columns", "total_replacements"],
            "Value": [find_str, replace_str, ", ".join(columns), total_replacements]
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    summary = {
        "find_str": find_str,
        "replace_str": replace_str,
        "columns_replaced": columns,
        "total_replacements": int(total_replacements),
        "rows": len(df),
        "columns": len(df.columns)
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in columns])
    technical_details = {
        "scenario": "find_and_replace_substring",
        "parameters": {"columns": columns, "find_str": find_str, "replace_str": replace_str},
        "stats": {"total_replacements": int(total_replacements)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Bul ve değiştir: '{find_str}' -> '{replace_str}'
columns = [{cols_str}]
for col in columns:
    df[col] = df[col].astype(str).str.replace('{find_str}', '{replace_str}', regex=False)

# {total_replacements} değişiklik yapıldı
df.to_excel('degistirilmis.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_copy,
        "excel_bytes": output,
        "excel_filename": "find_and_replace_result.xlsx"
    }