from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException
import traceback

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    print(f"DEBUG vlookup parameters: {params.keys()}")
    try:
        # Gerekli parametreler: support alternative param names
        key_column = params.get("key_column") or params.get("lookup_column")
        lookup_key_column = params.get("lookup_key_column") or params.get("key_column") or key_column
        lookup_value_column = params.get("lookup_value_column") or params.get("return_column")
        lookup_df = params.get("lookup_df")
        if lookup_df is None:
            lookup_df = params.get("df2")

        # Auto-select: key_column (main df)
        if not key_column:
             if len(df.columns) > 0:
                 key_column = df.columns[0]
             else:
                 raise HTTPException(status_code=400, detail="Main df boş. key_column belirtin.")

        if lookup_df is not None and isinstance(lookup_df, pd.DataFrame):
            # Auto-select: lookup_key_column (lookup df ilk sütun)
            if not lookup_key_column:
                 if len(lookup_df.columns) > 0:
                     lookup_key_column = lookup_df.columns[0]
                 else:
                     raise HTTPException(status_code=400, detail="Lookup df boş. lookup_key_column belirtin.")
                     
            # Auto-select: lookup_value_column (lookup df ikinci sütun, yoksa ilk)
            if not lookup_value_column:
                 if len(lookup_df.columns) > 1:
                     lookup_value_column = lookup_df.columns[1]
                 elif len(lookup_df.columns) > 0:
                     lookup_value_column = lookup_df.columns[0] # Fallback to first
                 else:
                      raise HTTPException(status_code=400, detail="Lookup df boş. lookup_value_column belirtin.")

        if key_column is None:
            raise HTTPException(status_code=400, detail="key_column parametresi eksik")
        if lookup_key_column is None:
            raise HTTPException(status_code=400, detail="lookup_key_column parametresi eksik")
        if lookup_value_column is None:
            raise HTTPException(status_code=400, detail="lookup_value_column veya return_column parametresi eksik")
        if lookup_df is None:
            raise HTTPException(status_code=400, detail="lookup_df parametresi eksik veya geçersiz")

        if not isinstance(lookup_df, pd.DataFrame):
            raise HTTPException(status_code=400, detail="lookup_df parametresi DataFrame olmalı")

        missing_cols_main = [col for col in [key_column] if col not in df.columns]
        if missing_cols_main:
            raise HTTPException(status_code=400, detail=f"Main df'de eksik sütunlar: {missing_cols_main}")

        missing_cols_lookup = [col for col in [lookup_key_column, lookup_value_column] if col not in lookup_df.columns]
        if missing_cols_lookup:
            raise HTTPException(status_code=400, detail=f"Lookup df'de eksik sütunlar: {missing_cols_lookup}")

        # Merge işlemi, left join ile ana tabloyu koru
        lookup_subset = lookup_df[[lookup_key_column, lookup_value_column]].drop_duplicates(subset=[lookup_key_column])
        
        # Eğer sütun adı ana tabloda varsa çakışmayı önlemek için rename yap
        final_value_col = lookup_value_column
        if lookup_value_column in df.columns and lookup_value_column != key_column:
             final_value_col = f"{lookup_value_column}_lookup"
             lookup_subset = lookup_subset.rename(columns={lookup_value_column: final_value_col})

        merged = df.merge(
            lookup_subset,
            how="left",
            left_on=key_column,
            right_on=lookup_key_column,
            validate="many_to_one"
        )
        
        # lookup_value_column referansını güncelle (merged df içinde aramak için)
        lookup_value_column = final_value_col

        # Tekrar lookup_key_column sütunu gereksiz, kaldır
        merged.drop(columns=[lookup_key_column], inplace=True)

        # Özet bilgisi
        total_rows = int(len(df))
        matched_rows = int(merged[lookup_value_column].notna().sum())
        unmatched_rows = total_rows - matched_rows

        summary = {
            "total_rows": total_rows,
            "matched_rows": matched_rows,
            "unmatched_rows": unmatched_rows,
            "key_column": key_column,
            "lookup_value_column": lookup_value_column
        }
        
        # Python kod özeti
        technical_details = {
            "scenario": "vlookup_single_match",
            "parameters": {"key_column": key_column, "lookup_key_column": params.get("lookup_key_column"), "lookup_value_column": params.get("lookup_value_column")},
            "stats": {"matched_rows": matched_rows, "unmatched_rows": unmatched_rows},
            "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')
lookup_df = pd.read_excel('lookup.xlsx')

# VLOOKUP benzeri işlem
merged = df.merge(lookup_df[['key', 'value']], how='left', 
    left_on='{key_column}', right_on='key')

# Sonuç: {matched_rows} eşleşme, {unmatched_rows} eşleşmeme
merged.to_excel('vlookup_sonuc.xlsx', index=False)
```"""
        }

        # Excel oluştur
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            merged.to_excel(writer, index=False, sheet_name="Result")
            pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
        output.seek(0)

        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": merged,
            "excel_bytes": output,
            "excel_filename": "vlookup_result.xlsx"
        }
    except Exception as e:
        print(f"ERROR in vlookup_single_match: {repr(e)}")
        traceback.print_exc()
        raise e