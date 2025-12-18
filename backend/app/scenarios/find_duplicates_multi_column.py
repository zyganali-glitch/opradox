from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    cols = params.get("columns")
    if not cols:
        raise HTTPException(status_code=400, detail="columns parametresi eksik veya boş")
    if not isinstance(cols, list):
        raise HTTPException(status_code=400, detail="columns parametresi liste olmalı")
    missing_cols = [c for c in cols if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Eksik sütunlar: {missing_cols}. Mevcut sütunlar: {list(df.columns)}")

    # Tüm sütunları string yaparak karşılaştırma yapabiliriz (opsiyonel)
    # Ancak burada orijinal haliyle bırakıyoruz.

    duplicates_mask = df.duplicated(subset=cols, keep=False)
    duplicates_df = df.loc[duplicates_mask].copy()

    summary = {
        "total_rows": len(df),
        "checked_columns": cols,
        "duplicate_rows_count": len(duplicates_df),
        "unique_duplicate_groups": duplicates_df.groupby(cols).ngroups if not duplicates_df.empty else 0
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in cols])
    technical_details = {
        "scenario": "find_duplicates_multi_column",
        "parameters": {"columns": cols},
        "stats": {"duplicate_rows_count": len(duplicates_df)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu sütunda tekrarlayan kayıtları bul
columns = [{cols_str}]
duplicates = df[df.duplicated(subset=columns, keep=False)]

# Sonuç: {len(duplicates_df)} tekrarlayan satır
duplicates.to_excel('coklu_tekrarlar.xlsx', index=False)
```"""
    }

    if duplicates_df.empty:
        return {
            "summary": summary,
            "technical_details": technical_details,
            "excel_bytes": None,
            "excel_filename": None
        }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        duplicates_df.to_excel(writer, index=False, sheet_name="Duplicates")
        # Özet sayfası
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": duplicates_df,
        "excel_bytes": output,
        "excel_filename": "duplicates_by_columns.xlsx"
    }