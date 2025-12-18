from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException
import traceback

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    print(f"DEBUG join parameters: {params.keys()}")
    try:
        # Beklenen parametreler: right_table (pd.DataFrame), key (str), how (str, optional)
        # right_table parametresi dict içinde DataFrame olarak gelmeli
        # how parametresi: 'inner', 'left', 'right', 'outer' (default 'inner')
        
        right_table = params.get("right_table")
        if right_table is None:
            right_table = params.get("df2")
        if right_table is None:
            raise HTTPException(status_code=400, detail="Eksik parametre: 'right_table' (veya 'df2') gereklidir.")
        if not isinstance(right_table, pd.DataFrame):
            raise HTTPException(status_code=400, detail="'right_table' parametresi DataFrame olmalıdır.")
        
        key = params.get("key") or params.get("key_column")
        if not isinstance(key, str) or not key:
            raise HTTPException(status_code=400, detail="'key' (veya 'key_column') parametresi boş olmayan string olmalıdır.")
        
        how = params.get("how", "inner")
        if how not in ("inner", "left", "right", "outer"):
            raise HTTPException(status_code=400, detail="'how' parametresi 'inner', 'left', 'right' veya 'outer' olmalıdır.")
        
        missing_left = [col for col in [key] if col not in df.columns]
        missing_right = [col for col in [key] if col not in right_table.columns]
        if missing_left:
            raise HTTPException(status_code=400, detail=f"Sol tabloda eksik sütunlar: {missing_left}, mevcut sütunlar: {list(df.columns)}")
        if missing_right:
            raise HTTPException(status_code=400, detail=f"Sağ tabloda eksik sütunlar: {missing_right}, mevcut sütunlar: {list(right_table.columns)}")
        
        merged = pd.merge(df, right_table, on=key, how=how, suffixes=('_left', '_right'))
        
        summary = {
            "left_rows": len(df),
            "right_rows": len(right_table),
            "merged_rows": len(merged),
            "join_type": how,
            "key_column": key
        }
        
        # Python kod özeti
        technical_details = {
            "scenario": "join_two_tables_key",
            "parameters": {
                "key_column": key,
                "join_type": how
            },
            "stats": {
                "left_rows": len(df),
                "right_rows": len(right_table),
                "merged_rows": len(merged)
            },
            "python_code": f"""```python
import pandas as pd

df1 = pd.read_excel('ana_dosya.xlsx')
df2 = pd.read_excel('ikinci_dosya.xlsx')

# VLOOKUP/JOIN: '{key}' sütunuyla birleştir
merged = pd.merge(df1, df2, on='{key}', how='{how}')

# Sonuç: {len(merged)} satır (sol: {len(df)}, sağ: {len(right_table)})
merged.to_excel('birlestirilmis.xlsx', index=False)
```"""
        }
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            merged.to_excel(writer, index=False, sheet_name="Merged")
            pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
        output.seek(0)
        
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": merged,
            "excel_bytes": output,
            "excel_filename": "joined_table.xlsx"
        }
    except Exception as e:
        print(f"ERROR in join_two_tables_key: {repr(e)}")
        traceback.print_exc()
        raise e