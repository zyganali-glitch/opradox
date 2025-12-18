
from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    column = params.get("column")

    if not column or not isinstance(column, str):
        raise HTTPException(status_code=400, detail="Sütun adı (column) gerekli.")

    if column not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{column}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}")

    # Frekans tablosu oluştur
    # value_counts() her değerden kaç tane olduğunu sayar
    freq = df[column].value_counts().reset_index()
    freq.columns = [column, 'Count'] # Kolon isimlerini düzenle
    
    # Yüzdelik ekleyelim (Opsiyonel ama şık olur)
    freq['Percentage'] = (freq['Count'] / freq['Count'].sum()) * 100
    freq['Percentage'] = freq['Percentage'].round(2).astype(str) + '%'

    # İstatistikler
    unique_count = df[column].nunique()
    most_frequent = freq.iloc[0][column] if not freq.empty else None
    
    summary = {
        "analyzed_column": column,
        "unique_values": unique_count,
        "most_frequent_value": str(most_frequent),
        "total_rows": len(df)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "frequency_table_single_column",
        "parameters": {"column": column},
        "stats": {"unique_values": unique_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Frekans tablosu
freq = df['{column}'].value_counts()
freq_df = freq.reset_index()
freq_df.columns = ['{column}', 'Count']
freq_df['Percentage'] = (freq_df['Count'] / freq_df['Count'].sum() * 100).round(2).astype(str) + '%'

freq_df.to_excel('frekans.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        freq.to_excel(writer, index=False, sheet_name="Frequency Table")
        # Orijinal veriyi de ekleyelim mi? Belki ayrı bir sheet'e.
        # df.to_excel(writer, index=False, sheet_name="Original Data") 
        
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": freq,
        "excel_bytes": output,
        "excel_filename": f"frequency_table_{column}.xlsx"
    }
