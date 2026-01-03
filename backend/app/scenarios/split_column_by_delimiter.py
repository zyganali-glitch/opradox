
from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    column = params.get("column")
    delimiter = params.get("delimiter", ",")  # default virgül
    new_columns = params.get("new_columns")

    # column zorunlu
    if column is None:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'column' gereklidir.")
    
    if column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"'{column}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)[:10]}"
        )
    
    # new_columns boşsa otomatik isim ver
    if new_columns is None or new_columns == [] or new_columns == "":
        # Örnek veriden parça sayısını tahmin et
        sample = df[column].dropna().head(10).astype(str)
        if len(sample) > 0:
            max_parts = max(len(str(s).split(delimiter)) for s in sample)
            new_columns = [f"{column}_part{i+1}" for i in range(max_parts)]
        else:
            new_columns = [f"{column}_part1", f"{column}_part2"]
    
    if isinstance(new_columns, str):
        new_columns = [c.strip() for c in new_columns.split(",") if c.strip()]
    
    if not isinstance(new_columns, list):
        raise HTTPException(status_code=400, detail="'new_columns' list of strings olmalıdır.")

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