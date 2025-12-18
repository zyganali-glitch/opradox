
from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Main.py'den df2 parametreler içinde gelecek
    df2 = params.get("df2")

    if df2 is None or not isinstance(df2, pd.DataFrame):
        raise HTTPException(status_code=400, detail="İkinci dosya yüklenmedi. Lütfen 'İkinci Dosya' alanından bir tablo yükleyin.")

    # Kolon eşleşmesini kontrol et (Opsiyonel: Hata vermek yerine outer join yapabiliriz ama kullanıcıya uyarı daha iyi)
    # Basitlik için outer join (tüm kolonları al) yapalım, pd.concat varsayılanı.
    
    # Append
    result_df = pd.concat([df, df2], ignore_index=True)

    summary = {
        "table1_rows": len(df),
        "table2_rows": len(df2),
        "total_rows_after_append": len(result_df),
        "common_columns": list(set(df.columns) & set(df2.columns))
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "pq_append_tables",
        "parameters": {},
        "stats": {"total_rows": len(result_df)},
        "python_code": f"""```python
import pandas as pd

df1 = pd.read_excel('dosya1.xlsx')
df2 = pd.read_excel('dosya2.xlsx')

# İki tabloyu birleştir (alt alta ekle)
result = pd.concat([df1, df2], ignore_index=True)

# {len(result_df)} satır oluştu
result.to_excel('birlesik.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False, sheet_name="Appended Data")
        
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result_df,
        "excel_bytes": output,
        "excel_filename": "appended_tables.xlsx"
    }