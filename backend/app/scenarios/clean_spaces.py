
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    col = params.get("column")
    if not col or col not in df.columns:
        # If no column specified, clean all string columns ? No, better be safe.
        # Or auto-detect string columns
        raise HTTPException(status_code=400, detail="Lütfen temizlenecek sütunu seçin.")

    try:
        # Trim whitespace
        df[col] = df[col].astype(str).str.strip().str.replace(r'\s+', ' ', regex=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"İşlem hatası: {str(e)}")

    preview = df.head(20).to_markdown(index=False)
    
    # Python kod özeti
    technical_details = {
        "scenario": "clean_spaces",
        "parameters": {"column": col},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# '{col}' sütunundaki gereksiz boşlukları temizle
df['{col}'] = df['{col}'].astype(str).str.strip().str.replace(r'\\s+', ' ', regex=True)

df.to_excel('temizlenmis.xlsx', index=False)
```"""
    }
    
    return {
        "summary": "Boşluk temizleme tamamlandı.",
        "markdown_result": f"**Sonuç:** '{col}' sütunundaki gereksiz boşluklar temizlendi.\n\n### Önizleme\n\n{preview}",
        "technical_details": technical_details,
        "df_out": df
    }
