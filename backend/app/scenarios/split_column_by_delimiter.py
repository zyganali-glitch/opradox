
from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    column = params.get("column")
    delimiter = params.get("delimiter")
    new_columns = params.get("new_columns")

    if column is None:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'column' gereklidir.")
    if delimiter is None:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'delimiter' gereklidir.")
    if new_columns is None:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'new_columns' gereklidir.")
    if not isinstance(new_columns, list) or not all(isinstance(c, str) for c in new_columns):
        raise HTTPException(status_code=400, detail="'new_columns' list of strings olmalıdır.")

    if column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"'{column}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}"
        )

    # Bölme işlemi
    split_df = df[column].astype(str).str.split(delimiter, n=len(new_columns)-1, expand=True)
    if split_df.shape[1] < len(new_columns):
        # Eksik sütunlar varsa NaN ile doldur
        for i in range(split_df.shape[1], len(new_columns)):
            split_df[i] = pd.NA

    split_df.columns = new_columns

    result_df = pd.concat([df.drop(columns=[column]), split_df], axis=1)

    summary = {
        "original_column": column,
        "delimiter": delimiter,
        "new_columns": new_columns,
        "rows_processed": len(df),
        "rows_with_missing_values": int(split_df.isna().any(axis=1).sum())
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in new_columns])
    technical_details = {
        "scenario": "split_column_by_delimiter",
        "parameters": {"column": column, "delimiter": delimiter, "new_columns": new_columns},
        "stats": {"rows_processed": len(df)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Sütunu ayırıcıya göre böl
split = df['{column}'].str.split('{delimiter}', expand=True)
split.columns = [{cols_str}]
df = pd.concat([df.drop(columns=['{column}']), split], axis=1)

df.to_excel('bolunmus.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result_df,
        "excel_bytes": output,
        "excel_filename": f"split_{column}.xlsx"
    }