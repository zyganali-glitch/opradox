from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    lookup_value = params.get("lookup_value")
    lookup_column = params.get("lookup_column")
    return_column = params.get("return_column")
    default_value = params.get("default_value", None)
    search_mode = params.get("search_mode", "left-to-right")  # "left-to-right" veya "right-to-left"
    case_sensitive = params.get("case_sensitive", False)

    # Parametre kontrolü
    if lookup_value is None:
        raise HTTPException(status_code=400, detail="lookup_value parametresi eksik")

    # lookup_column boşsa ilk sütun auto-select
    if not lookup_column:
         if len(df.columns) > 0:
             lookup_column = df.columns[0]
         else:
             raise HTTPException(status_code=400, detail="Veri seti boş. lookup_column belirtin.")

    # return_column boşsa ikinci sütun (veya ilk) auto-select
    if not return_column:
         if len(df.columns) > 1:
             return_column = df.columns[1]
         elif len(df.columns) > 0:
             return_column = df.columns[0]
         else:
              raise HTTPException(status_code=400, detail="Veri seti boş. return_column belirtin.")

    if not lookup_column:
        raise HTTPException(status_code=400, detail="lookup_column parametresi eksik")
    if not return_column:
        raise HTTPException(status_code=400, detail="return_column parametresi eksik")

    # Sütun kontrolü
    missing_cols = [col for col in [lookup_column, return_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütun(lar) eksik: {missing_cols} mevcut sütunlar: {list(df.columns)}")

    # Arama için DataFrame kopyası
    df_search = df[[lookup_column, return_column]].copy()

    # Case insensitive için dönüşüm
    if not case_sensitive:
        df_search[lookup_column] = df_search[lookup_column].astype(str).str.lower()
        lookup_value_cmp = str(lookup_value).lower()
    else:
        lookup_value_cmp = lookup_value

    # Arama sırası
    if search_mode == "right-to-left":
        df_search = df_search.iloc[::-1]
    elif search_mode != "left-to-right":
        raise HTTPException(status_code=400, detail="search_mode parametresi 'left-to-right' veya 'right-to-left' olmalı")

    # Eşleşme bulma
    mask = df_search[lookup_column] == lookup_value_cmp
    matched_rows = df_search.loc[mask]

    if matched_rows.empty:
        result_value = default_value
        found = False
    else:
        result_value = matched_rows.iloc[0][return_column]
        found = True

    summary = {
        "lookup_value": lookup_value,
        "lookup_column": lookup_column,
        "return_column": return_column,
        "search_mode": search_mode,
        "case_sensitive": case_sensitive,
        "found": found,
        "result_value": result_value.item() if hasattr(result_value, "item") else result_value,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "xlookup_single_match",
        "parameters": {"lookup_value": lookup_value, "lookup_column": lookup_column, "return_column": return_column},
        "stats": {"found": found, "result_value": summary["result_value"]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# XLOOKUP benzeri işlem
mask = df['{lookup_column}'] == {repr(lookup_value)}
result = df.loc[mask, '{return_column}'].iloc[0] if mask.any() else {repr(default_value)}

# Sonuç: {summary["result_value"]}
print(f"Bulunan: {{result}}")
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "excel_bytes": None,
        "excel_filename": None,
    }