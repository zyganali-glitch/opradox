
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    sum_col = params.get("sum_column")
    crit_cols = params.get("criteria_columns", [])
    crit_vals = params.get("criteria_values", [])

    # sum_col boşsa ilk numeric auto-select
    if not sum_col:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            sum_col = numeric_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Sayısal sütun bulunamadı. Lütfen sum_column belirtin.")

    if sum_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Toplama sütunu '{sum_col}' bulunamadı.")
    
    # Ensure lists (handle string input from frontend if not serialized as list)
    if isinstance(crit_cols, str): crit_cols = [c.strip() for c in crit_cols.split(",")]
    if isinstance(crit_vals, str): crit_vals = [v.strip() for v in crit_vals.split(",")]

    if len(crit_cols) != len(crit_vals):
         raise HTTPException(status_code=400, detail="Koşul sütun sayısı ile değer sayısı eşit olmalı.")

    filtered_df = df.copy()
    for col, val in zip(crit_cols, crit_vals):
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Koşul sütunu '{col}' bulunamadı.")
        
        # Simple equality check with type awareness try
        if pd.api.types.is_numeric_dtype(df[col]):
            try:
                val = float(val)
            except:
                pass
        
        filtered_df = filtered_df[filtered_df[col] == val]

    if filtered_df.empty:
         raise HTTPException(status_code=400, detail="Kriterlere uygun veri yok.")

    try:
        result = filtered_df[sum_col].sum()
    except:
        result = 0
    
    # Python kod özeti
    crit_str = ' & '.join([f"(df['{c}'] == '{v}')" for c, v in zip(crit_cols, crit_vals)])
    technical_details = {
        "scenario": "sum_ifs_multi",
        "parameters": {"sum_column": sum_col, "criteria_columns": crit_cols, "criteria_values": crit_vals},
        "stats": {"result": float(result), "matched_rows": len(filtered_df)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# SUMIFS - çoklu koşul ile toplam
mask = {crit_str}
result = df.loc[mask, '{sum_col}'].sum()

# Sonuç: {result}
print(f"Toplam: {{result}}")
```"""
    }

    return {
        "summary": "Toplama tamamlandı.",
        "markdown_result": f"**Toplam:** {result:,.2f}\n\n**Uygulanan Filtreler:**\n" + "\n".join([f"- {c} = {v}" for c,v in zip(crit_cols, crit_vals)]),
        "technical_details": technical_details,
        "df_out": filtered_df
    }
