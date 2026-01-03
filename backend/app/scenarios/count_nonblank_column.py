
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    col = params.get("column")
    
    # column boşsa tüm sütunlar için rapor oluştur
    if not col:
        # Tüm sütunlar için dolu/boş hücre sayımı
        results = []
        for column in df.columns:
            count = df[column].count()
            total = len(df)
            empty = total - count
            results.append({
                "Sütun": column,
                "Dolu": int(count),
                "Boş": int(empty),
                "Toplam": total
            })
        
        result_df = pd.DataFrame(results)
        
        technical_details = {
            "scenario": "count_nonblank_column",
            "parameters": {"column": "TÜM SÜTUNLAR"},
            "stats": {"columns_analyzed": len(df.columns)},
            "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Tüm sütunlar için dolu/boş hücre sayımı
for col in df.columns:
    filled = df[col].count()
    empty = len(df) - filled
    print(f"{{col}}: Dolu={{filled}}, Boş={{empty}}")
```"""
        }
        
        return {
            "summary": "Tüm sütunlar için dolu/boş hücre sayımı yapıldı.",
            "markdown_result": f"**Tüm sütunlar için analiz yapıldı**\\n\\n{result_df.to_markdown(index=False)}",
            "technical_details": technical_details,
            "df_out": result_df
        }
    
    # Belirli bir sütun için
    if col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Sütun '{col}' bulunamadı. Mevcut sütunlar: {list(df.columns)[:10]}")

    count = df[col].count()  # pandas count ignores NaN
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
        "markdown_result": f"**Sütun:** {col}\\n\\n- **Dolu Hücre:** {count}\\n- **Boş Hücre:** {empty}\\n- **Toplam Satır:** {total}",
        "technical_details": technical_details,
        "df_out": df
    }
