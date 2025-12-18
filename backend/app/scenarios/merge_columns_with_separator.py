from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    columns = params.get("columns")
    target_column = params.get("target_column")
    pattern = params.get("pattern")
    
    if columns is None or not isinstance(columns, list) or len(columns) == 0:
        raise HTTPException(status_code=400, detail="columns parametresi liste olarak ve en az bir eleman içermeli")
    if target_column is None or not isinstance(target_column, str) or target_column.strip() == "":
        raise HTTPException(status_code=400, detail="target_column parametresi zorunlu ve boş olmamalı")
    if pattern is None or not isinstance(pattern, str) or pattern.strip() == "":
        raise HTTPException(status_code=400, detail="pattern parametresi zorunlu ve boş olmamalı")
    
    missing_cols = [col for col in columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride bulunmayan sütunlar: {missing_cols}")
    
    # Hazırlık: tüm sütunları stringe çevir, NaN ise boş string yap
    df_str = df[columns].astype(str).fillna("")
    
    # pattern içindeki {col} ifadelerini ilgili sütun değerleri ile değiştir
    # Örnek pattern: "{Ad} {Soyad} ({Şehir})"
    def format_row(row):
        try:
            return pattern.format(**row)
        except KeyError as e:
            raise HTTPException(status_code=400, detail=f"Pattern içinde olmayan sütun: {e.args[0]}")
    
    merged_series = df_str.apply(format_row, axis=1)
    df[target_column] = merged_series
    
    summary = {
        "merged_rows": len(df),
        "target_column": target_column,
        "used_columns": columns,
        "pattern": pattern
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in columns])
    technical_details = {
        "scenario": "merge_columns_with_separator",
        "parameters": {"columns": columns, "pattern": pattern, "target_column": target_column},
        "stats": {"merged_rows": len(df)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Sütunları desene göre birleştir
columns = [{cols_str}]
pattern = '{pattern}'

def merge_row(row):
    return pattern.format(**row)

df['{target_column}'] = df[columns].astype(str).apply(merge_row, axis=1)

df.to_excel('birlestirilmis.xlsx', index=False)
```"""
    }
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "merged_columns.xlsx"
    }