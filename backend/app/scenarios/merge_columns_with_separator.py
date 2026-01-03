from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    columns = params.get("columns")
    target_column = params.get("target_column", "MergedColumn")  # default='MergedColumn'
    pattern = params.get("pattern")
    
    # columns boşsa ilk iki metin sütununu kullan
    if columns is None or len(columns) == 0:
        text_cols = df.select_dtypes(include=['object']).columns.tolist()
        if len(text_cols) >= 2:
            columns = text_cols[:2]
        elif len(text_cols) == 1:
            columns = text_cols
        else:
            raise HTTPException(status_code=400, detail="Metin sütunu bulunamadı. Lütfen columns belirtin.")
    
    if isinstance(columns, str):
        columns = [c.strip() for c in columns.split(",") if c.strip()]
    
    # pattern boşsa basit birleştirme oluştur
    if pattern is None or pattern.strip() == "":
        pattern = " - ".join(["{" + col + "}" for col in columns])
    
    missing_cols = [col for col in columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride bulunmayan sütunlar: {missing_cols}. Mevcut: {list(df.columns)[:10]}")
    
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