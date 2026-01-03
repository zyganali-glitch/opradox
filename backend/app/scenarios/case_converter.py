
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    col = params.get("column")
    mode = params.get("mode", "upper")  # upper, lower, title, capitalize

    # column boşsa tüm metin sütunlarına uygula
    if not col:
        text_cols = df.select_dtypes(include=['object']).columns.tolist()
        if text_cols:
            cols_to_process = text_cols
        else:
            raise HTTPException(status_code=400, detail="Metin sütunu bulunamadı. Lütfen column belirtin.")
    else:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"'{col}' sütunu bulunamadı. Mevcut: {list(df.columns)[:10]}")
        cols_to_process = [col]

    try:
        s = df[col].astype(str)
        locale_opt = params.get("locale", "en") # 'tr' or 'en'
        
        if mode == "upper":
             if locale_opt == "tr":
                 from app.turkish_utils import turkish_upper
                 df[col] = s.apply(turkish_upper)
             else:
                 df[col] = s.str.upper()
        elif mode == "lower":
             if locale_opt == "tr":
                 from app.turkish_utils import turkish_lower
                 df[col] = s.apply(turkish_lower)
             else:
                 df[col] = s.str.lower()
        elif mode == "title":
             if locale_opt == "tr":
                 from app.turkish_utils import turkish_title
                 df[col] = s.apply(turkish_title)
             else:
                 df[col] = s.str.title()
        elif mode == "capitalize":
             if locale_opt == "tr":
                 from app.turkish_utils import turkish_capitalize
                 df[col] = s.apply(turkish_capitalize)
             else:
                 df[col] = s.str.capitalize()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dönüştürme hatası: {str(e)}")

    preview = df.head(20).to_markdown(index=False)
    
    # Python kod özeti
    mode_tr = {"upper": "büyük harf", "lower": "küçük harf", "title": "başlık", "capitalize": "ilk harf büyük"}
    technical_details = {
        "scenario": "case_converter",
        "parameters": {"column": col, "mode": mode, "locale": params.get("locale", "en")},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Büyük/küçük harf dönüşümü: {mode}
df['{col}'] = df['{col}'].astype(str).str.{mode}()

df.to_excel('donusturulmus.xlsx', index=False)
```"""
    }
    
    return {
        "summary": "Büyük/Küçük harf dönüşümü tamamlandı.",
        "markdown_result": f"**Sonuç:** '{col}' sütunu başarıyla dönüştürüldü ({mode}).\n\n### Önizleme\n\n{preview}",
        "technical_details": technical_details,
        "df_out": df
    }
