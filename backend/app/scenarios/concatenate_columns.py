
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    raw_cols = params.get("columns", "")
    separator = params.get("separator", " ")
    
    # Clean separator keywords
    if separator.strip().lower() == "boşluk": separator = " "
    if separator.strip().lower() == "virgül": separator = ","
    if separator.strip().lower() == "tire": separator = "-"

    cols = [c.strip() for c in raw_cols.split(",") if c.strip()]
    
    if not cols:
        raise HTTPException(status_code=400, detail="Birleştirilecek sütunları giriniz.")
    
    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Sütunlar bulunamadı: {missing}")

    # Concatenate
    new_col_name = "Birleştirilmiş_" + "_".join(cols[:2])
    
    try:
        # Convert all to string and join
        df[new_col_name] = df[cols].astype(str).agg(separator.join, axis=1)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hata: {str(e)}")

    row_count = len(df)
    preview = df.head(20).to_markdown(index=False)
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in cols])
    technical_details = {
        "scenario": "concatenate_columns",
        "parameters": {
            "columns": cols,
            "separator": separator,
            "new_column_name": new_col_name
        },
        "stats": {
            "columns_merged": len(cols),
            "rows_affected": row_count
        },
        "python_code": f"""```python
import pandas as pd

# Dosyayı oku
df = pd.read_excel('dosya.xlsx')

# Sütunları birleştir: {cols}
columns_to_merge = [{cols_str}]
df['{new_col_name}'] = df[columns_to_merge].astype(str).agg('{separator}'.join, axis=1)

# Sonucu kaydet
df.to_excel('concatenated_result.xlsx', index=False)
```"""
    }

    return {
        "summary": "Sütun birleştirme tamamlandı.",
        "markdown_result": f"**Sonuç:** {cols} sütunları '{separator}' ile birleştirildi.\n\n### Önizleme\n\n{preview}",
        "technical_details": technical_details,
        "df_out": df
    }
