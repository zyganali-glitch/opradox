from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    col1 = params.get("column1")
    col2 = params.get("column2")

    if not col1 or not col2:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'column1' ve 'column2' gereklidir.")

    missing_cols = [c for c in [col1, col2] if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride bulunmayan sütunlar: {missing_cols}")

    # Sayısal hale getir
    s1 = pd.to_numeric(df[col1], errors="coerce")
    s2 = pd.to_numeric(df[col2], errors="coerce")

    valid = s1.notna() & s2.notna()
    if valid.sum() == 0:
        raise HTTPException(status_code=400, detail="İki sütunda da sayısal geçerli veri yok.")

    corr = s1[valid].corr(s2[valid], method="pearson")

    summary = {
        "column1": col1,
        "column2": col2,
        "valid_pairs": int(valid.sum()),
        "pearson_correlation": None if pd.isna(corr) else round(corr, 6)
    }
    
    # Python kod özeti
    corr_val = None if pd.isna(corr) else round(corr, 6)
    technical_details = {
        "scenario": "correlation_two_columns",
        "parameters": {"column1": col1, "column2": col2},
        "stats": {"pearson_correlation": corr_val, "valid_pairs": int(valid.sum())},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# İki sütun arası korelasyon: {col1} vs {col2}
corr = df['{col1}'].corr(df['{col2}'], method='pearson')

# Sonuç: Pearson korelasyon = {corr_val}
print(f"Korelasyon: {{corr}}")
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_filtered = df.loc[valid, [col1, col2]].copy()
        df_filtered.to_excel(writer, index=False, sheet_name="Data")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")

    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_filtered,
        "excel_bytes": output,
        "excel_filename": f"correlation_{col1}_{col2}.xlsx"
    }