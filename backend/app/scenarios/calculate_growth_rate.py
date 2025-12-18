
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    date_col = params.get("date_column")
    value_col = params.get("value_column")
    period = params.get("period", "M") # M, Y, Q

    if not date_col or date_col not in df.columns:
        raise HTTPException(status_code=400, detail="Tarih sütunu seçilmedi.")
    if not value_col or value_col not in df.columns:
         raise HTTPException(status_code=400, detail="Değer sütunu seçilmedi.")

    try:
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True)
        df = df.sort_values(date_col)
        
        # Resample logic
        df_resampled = df.set_index(date_col).resample(period)[value_col].sum().reset_index()
        
        # Calculate Growth
        df_resampled["Growth_Rate"] = df_resampled[value_col].pct_change() * 100
        df_resampled["Growth_Rate"] = df_resampled["Growth_Rate"].round(2)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hesaplama hatası: {str(e)}")

    preview = df_resampled.head(20).to_markdown(index=False)
    
    # Python kod özeti
    technical_details = {
        "scenario": "calculate_growth_rate",
        "parameters": {"date_column": date_col, "value_column": value_col, "period": period},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Büyüme oranı hesapla ({period} bazında)
df['{date_col}'] = pd.to_datetime(df['{date_col}'])
df_resampled = df.set_index('{date_col}').resample('{period}')['{value_col}'].sum().reset_index()
df_resampled['Growth_Rate'] = df_resampled['{value_col}'].pct_change() * 100

df_resampled.to_excel('buyume_orani.xlsx', index=False)
```"""
    }
    
    return {
        "summary": "Büyüme oranı hesaplandı.",
        "markdown_result": f"**Sonuç:** {period} bazında büyüme oranları.\n\n### Önizleme\n\n{preview}",
        "technical_details": technical_details,
        "df_out": df_resampled
    }
