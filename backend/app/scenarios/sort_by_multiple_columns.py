from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    sort_columns = params.get("sort_columns")
    ascending = params.get("ascending")

    # sort_columns boşsa ilk sütuna göre sırala
    if sort_columns is None or sort_columns == [] or sort_columns == "":
        sort_columns = [df.columns[0]] if len(df.columns) > 0 else []
        if not sort_columns:
            raise HTTPException(status_code=400, detail="Veri seti boş, sıralama yapılamaz.")
    
    # String geldiyse listeye çevir
    if isinstance(sort_columns, str):
        sort_columns = [c.strip() for c in sort_columns.split(",") if c.strip()]
    
    if not isinstance(sort_columns, list):
        raise HTTPException(status_code=400, detail="sort_columns list of strings olmalı")
    
    # ascending default değeri
    if ascending is None or ascending == [] or ascending == "":
        ascending = [True] * len(sort_columns)
    
    # String değerleri bool'a çevir
    if isinstance(ascending, list):
        ascending = [a if isinstance(a, bool) else (str(a).lower() in ['true', '1', 'evet']) for a in ascending]
    
    # Uzunluk eşleştirme
    if len(ascending) != len(sort_columns):
        # Eksik varsa doldur
        ascending = ascending + [True] * (len(sort_columns) - len(ascending))
        ascending = ascending[:len(sort_columns)]

    missing_cols = [c for c in sort_columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}. Mevcut: {list(df.columns)[:10]}")

    sorted_df = df.sort_values(by=sort_columns, ascending=ascending).reset_index(drop=True)

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        sorted_df.to_excel(writer, index=False, sheet_name="Sorted")
        summary_df = pd.DataFrame({
            "Sorted Columns": sort_columns,
            "Ascending": ascending
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    summary = {
        "sorted_columns": sort_columns,
        "ascending_order": ascending,
        "row_count": len(sorted_df)
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in sort_columns])
    technical_details = {
        "scenario": "sort_by_multiple_columns",
        "parameters": {"sort_columns": sort_columns, "ascending": ascending},
        "stats": {"row_count": len(sorted_df)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu sütuna göre sırala
sorted_df = df.sort_values(by=[{cols_str}], ascending={ascending})

sorted_df.to_excel('siralanmis.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": sorted_df,
        "excel_bytes": output,
        "excel_filename": "sorted_result.xlsx"
    }