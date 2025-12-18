
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    cols = params.get("columns")
    if isinstance(cols, str):
        cols = [c.strip() for c in cols.split(",")]
    
    if not cols:
        raise HTTPException(status_code=400, detail="Lütfen en az bir sütun adı girin.")
    
    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Bulunamayan sütunlar: {missing}")

    try:
        # Value counts for combination
        res = df.value_counts(subset=cols).reset_index(name='Frekans (Adet)')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hata: {e}")

    preview = res.head(20).to_markdown(index=False)
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in cols])
    technical_details = {
        "scenario": "frequency_table_multi_column",
        "parameters": {"columns": cols},
        "stats": {"unique_combinations": len(res)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu sütun frekans tablosu
columns = [{cols_str}]
freq = df.value_counts(subset=columns).reset_index(name='Frekans')

freq.to_excel('coklu_frekans.xlsx', index=False)
```"""
    }
    
    return {
        "summary": "Çoklu sütun frekans tablosu oluşturuldu.",
        "markdown_result": f"**Sonuç Önizleme:**\n\n{preview}",
        "technical_details": technical_details,
        "df_out": res
    }
