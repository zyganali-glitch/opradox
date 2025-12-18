
from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    condition_column = params.get("condition_column")
    condition_value = params.get("condition_value")
    target_column = params.get("target_column")
    return_mode = params.get("return_mode", "summary")
    
    # Zorunlu alan kontrolü
    if not condition_column or not target_column:
        raise HTTPException(status_code=400, detail="Koşul sütunu ve Hedef sütun zorunludur.")
        
    if condition_column not in df.columns or target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Sütun bulunamadı. Mevcut: {list(df.columns)}")
        
    # Filtreleme
    # Condition value boşsa 'boş olanları' mı kast ediyor? 
    # Varsayım: kesin eşleşme arıyoruz. Value str gelebilir, df numerik olabilir.
    
    # Basit eşleşme filter
    if condition_value is None:
        # Belki boş olanları arıyordur? Şimdilik pass.
        mask = df[condition_column].isna()
    else:
        # Tip dönüşümü denemeden direkt string karşılaştırma daha güvenli olabilir genel kullanım için
        # Ama numerik eşleşme de lazım. 
        # Pandas query gibi davranmak zor, basit == yapalım.
        # Stringe çevirip karşılaştırmak en güvenlisi opradox basitliği için.
        mask = df[condition_column].astype(str) == str(condition_value)
        
    filtered = df[mask].copy()
    
    # Ortalama Hesapla
    # Hedef sütun numerik olmalı
    numeric_series = pd.to_numeric(filtered[target_column], errors='coerce')
    
    if len(numeric_series) == 0:
        avg_val = 0.0
    else:
        avg_val = float(numeric_series.mean())
        
    summary = {
        "condition_column": condition_column,
        "condition_value": condition_value,
        "matched_rows": len(filtered),
        "average": avg_val
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "average_if",
        "parameters": {
            "condition_column": condition_column,
            "condition_value": condition_value,
            "target_column": target_column
        },
        "stats": {
            "matched_rows": len(filtered),
            "average": avg_val
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# AVERAGEIF: {condition_column} == {repr(condition_value)}
mask = df['{condition_column}'].astype(str) == {repr(str(condition_value))}
filtered = df[mask]
average = filtered['{target_column}'].mean()

# Sonuç: {avg_val:.2f} ({len(filtered)} satır)
print(f"Ortalama: {{average}}")
```"""
    }
    
    if return_mode == "summary":
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": filtered,
            "excel_bytes": None,
            "excel_filename": None
        }
    
    # Excel döndür
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        filtered.to_excel(writer, index=False, sheet_name="Filtered Data")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": filtered,
        "excel_bytes": output,
        "excel_filename": "average_if_result.xlsx"
    }
