from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Beklenen parametreler (support alternative names)
    key_col = params.get("key_column")
    lookup_col = params.get("lookup_column")
    fallback_col = params.get("fallback_column")
    value_col = params.get("value_column") or params.get("return_column")
    
    if not key_col:
        raise HTTPException(status_code=400, detail="'key_column' parametresi eksik veya boş")
    if not lookup_col:
        raise HTTPException(status_code=400, detail="'lookup_column' parametresi eksik veya boş")
    if not fallback_col:
        raise HTTPException(status_code=400, detail="'fallback_column' parametresi eksik veya boş")
    if not value_col:
        raise HTTPException(status_code=400, detail="'value_column' veya 'return_column' parametresi eksik veya boş")

    # İkinci tablo için parametre: fallback_df (opsiyonel) veya df2 (main.py'den gelen)
    fallback_df = params.get("fallback_df") or params.get("df2")
    if fallback_df is not None and not isinstance(fallback_df, pd.DataFrame):
        raise HTTPException(status_code=400, detail="'fallback_df' parametresi DataFrame olmalı")

    # Ana tabloda gerekli sütunlar
    # NOT: value_col ana tabloda yoksa, o değerleri NaN kabul ederiz (fallback mantığı)
    main_cols = [key_col, lookup_col]
    missing_main = [c for c in main_cols if c not in df.columns]
    if missing_main:
        raise HTTPException(status_code=400, detail=f"Ana tabloda eksik sütunlar: {missing_main}")

    # Fallback tablosu varsa kontrol et
    if fallback_df is not None:
        fallback_cols = [fallback_col, value_col]
        missing_fallback = [c for c in fallback_cols if c not in fallback_df.columns]
        if missing_fallback:
            raise HTTPException(status_code=400, detail=f"Yedek tabloda eksik sütunlar: {missing_fallback}")

    # Ana tablodan lookup için dict oluştur
    if value_col in df.columns:
        main_lookup = df.set_index(lookup_col)[value_col].to_dict()
    else:
        main_lookup = {}  # Ana tabloda yoksa boş dict -> hepsi fallback'e düşer

    # Fallback lookup dict
    fallback_lookup = {}
    if fallback_df is not None:
        fallback_lookup = fallback_df.set_index(fallback_col)[value_col].to_dict()

    # Sonuç için yeni sütun oluştur
    result_values = []
    found_in_main = 0
    found_in_fallback = 0
    not_found = 0

    for key in df[key_col]:
        val = main_lookup.get(key, None)
        if val is not None:
            found_in_main += 1
            result_values.append(val)
        else:
            val_fb = fallback_lookup.get(key, None)
            if val_fb is not None:
                found_in_fallback += 1
                result_values.append(val_fb)
            else:
                not_found += 1
                result_values.append(None)

    df_result = df.copy()
    result_col_name = params.get("result_column", f"{value_col}_lookup")
    df_result[result_col_name] = result_values

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_result.to_excel(writer, index=False, sheet_name="Result")
        summary_df = pd.DataFrame({
            "Found in main": [found_in_main],
            "Found in fallback": [found_in_fallback],
            "Not found": [not_found],
            "Total rows": [len(df)]
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    summary = {
        "found_in_main": found_in_main,
        "found_in_fallback": found_in_fallback,
        "not_found": not_found,
        "total_rows": len(df),
        "result_column": result_col_name
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "fallback_lookup",
        "parameters": {"key_column": key_col, "lookup_column": lookup_col, "fallback_column": fallback_col},
        "stats": {"found_in_main": found_in_main, "found_in_fallback": found_in_fallback, "not_found": not_found},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')
fallback_df = pd.read_excel('yedek.xlsx')

# VLOOKUP + yedek tablo (IFERROR mantığı)
main_lookup = df.set_index('{lookup_col}')['{value_col}'].to_dict()
fallback_lookup = fallback_df.set_index('{fallback_col}')['{value_col}'].to_dict()

df['{result_col_name}'] = df['{key_col}'].apply(
    lambda x: main_lookup.get(x) or fallback_lookup.get(x))

df.to_excel('sonuc.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_result,
        "excel_bytes": output,
        "excel_filename": "lookup_fallback_result.xlsx"
    }