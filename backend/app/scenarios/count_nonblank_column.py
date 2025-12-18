
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    col = params.get("column")
    if not col or col not in df.columns:
        raise HTTPException(status_code=400, detail="Sütun seçilmedi.")

    count = df[col].count() # pandas count ignores NaN
    total = len(df)
    empty = total - count
    
    # Python kod özeti
    technical_details = {
        "scenario": "count_nonblank_column",
        "parameters": {"column": col},
        "stats": {"filled_count": int(count), "empty_count": int(empty), "total": total},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Dolu hücre sayımı
filled = df['{col}'].count()  # NaN'leri saymaz
empty = len(df) - filled

# Sonuç: {count} dolu, {empty} boş
print(f"Dolu: {{filled}}, Boş: {{empty}}")
```"""
    }

    return {
        "summary": "Dolu hücre sayımı yapıldı.",
        "markdown_result": f"**Sütun:** {col}\n\n- **Dolu Hücre:** {count}\n- **Boş Hücre:** {empty}\n- **Toplam Satır:** {total}",
        "technical_details": technical_details,
        "df_out": df
    }
