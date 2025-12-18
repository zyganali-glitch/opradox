
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    col = params.get("column")
    if not col or col not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{col}' sütunu bulunamadı.")

    # Convert to datetime
    try:
        # errors='coerce' will set invalid parsing to NaT
        df[col] = pd.to_datetime(df[col], errors='coerce', dayfirst=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dönüştürme hatası: {str(e)}")

    row_count = len(df)
    preview = df.head(20).to_markdown(index=False)
    
    # Python kod özeti
    technical_details = {
        "scenario": "text_to_date",
        "parameters": {"column": col},
        "stats": {"row_count": row_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Metni tarihe çevir
df['{col}'] = pd.to_datetime(df['{col}'], errors='coerce', dayfirst=True)

df.to_excel('tarih_donusturulmus.xlsx', index=False)
```"""
    }

    return {
        "summary": "Tarih dönüştürme tamamlandı.",
        "markdown_result": f"**Sonuç:** '{col}' sütunu tarih formatına başarıyla çevrildi.\n\n### Önizleme\n\n{preview}",
        "technical_details": technical_details,
        "df_out": df
    }
