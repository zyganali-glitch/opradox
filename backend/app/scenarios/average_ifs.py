
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    avg_col = params.get("average_column")
    crit_cols = params.get("criteria_columns", [])
    crit_vals = params.get("criteria_values", [])

    if not avg_col or avg_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Ortalama sütunu '{avg_col}' bulunamadı.")
    
    # Ensure lists
    if isinstance(crit_cols, str): crit_cols = [c.strip() for c in crit_cols.split(",")]
    if isinstance(crit_vals, str): crit_vals = [v.strip() for v in crit_vals.split(",")]

    if len(crit_cols) != len(crit_vals):
         raise HTTPException(status_code=400, detail="Koşul sütun sayısı ile değer sayısı eşit olmalı.")

    # Filter
    filtered_df = df.copy()
    for col, val in zip(crit_cols, crit_vals):
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Koşul sütunu '{col}' bulunamadı.")
        
        # Try to match type (numeric vs string)
        if pd.api.types.is_numeric_dtype(df[col]):
            try:
                val = float(val)
            except:
                pass # keep as string
        
        filtered_df = filtered_df[filtered_df[col] == val]

    if filtered_df.empty:
         raise HTTPException(status_code=400, detail="Belirtilen kriterlere uygun veri bulunamadı.")

    try:
        result = filtered_df[avg_col].mean()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hesaplama hatası (Sayısal sütun seçtiğinize emin olun): {e}")

    # Python kod özeti
    conditions_str = " & ".join([f"(df['{c}'] == {repr(v)})" for c, v in zip(crit_cols, crit_vals)])
    technical_details = {
        "scenario": "average_ifs",
        "parameters": {
            "average_column": avg_col,
            "criteria_columns": crit_cols,
            "criteria_values": crit_vals
        },
        "stats": {
            "matched_rows": len(filtered_df),
            "result": result
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# AVERAGEIFS: Çoklu koşul ile ortalama
mask = {conditions_str}
filtered = df[mask]
average = filtered['{avg_col}'].mean()

# Sonuç: {result:.2f} ({len(filtered_df)} satır)
print(f"Ortalama: {{average}}")
```"""
    }

    return {
        "summary": "Ortalama hesaplandı.",
        "markdown_result": f"**Sonuç:** {result:,.2f}\n\n**Filtreler:**\n" + "\n".join([f"- {c}: {v}" for c,v in zip(crit_cols, crit_vals)]),
        "technical_details": technical_details,
        "df_out": filtered_df 
    }
