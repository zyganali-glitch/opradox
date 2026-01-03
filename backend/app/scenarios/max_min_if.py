from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    condition_column = params.get("condition_column")
    condition_value = params.get("condition_value")
    value_column = params.get("value_column")
    aggfunc = params.get("aggfunc", "max").lower()
    date_column = params.get("date_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # Parametre kontrolü
    if not condition_column:
        raise HTTPException(status_code=400, detail="condition_column parametresi zorunludur.")
    if not value_column:
        raise HTTPException(status_code=400, detail="value_column parametresi zorunludur.")
    if aggfunc not in ("max", "min"):
        raise HTTPException(status_code=400, detail="aggfunc parametresi 'max' veya 'min' olmalı")

    # Sütun kontrolü
    missing_cols = [col for col in [condition_column, value_column] if col not in df.columns]
    if date_column:
        missing_cols += [date_column] if date_column not in df.columns else []
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütunlar eksik: {missing_cols}. Mevcut: {list(df.columns)[:10]}")

    # Tarih filtresi
    if date_column:
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True, errors="raise")
                df = df[df[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True, errors="raise")
                df = df[df[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")

    # Koşula göre filtreleme
    cond_mask = df[condition_column] == condition_value
    filtered = df.loc[cond_mask, value_column]

    # Sayısal dönüşüm
    filtered_numeric = pd.to_numeric(filtered, errors="coerce").dropna()
    if filtered_numeric.empty:
        raise HTTPException(status_code=400, detail="Koşulu sağlayan satırda geçerli sayısal değer yok")

    # Hesaplama
    if aggfunc == "max":
        result_value = filtered_numeric.max()
    else:
        result_value = filtered_numeric.min()

    # Özet
    result_val = result_value.item() if hasattr(result_value, "item") else result_value
    summary = {
        "condition_column": condition_column,
        "condition_value": condition_value,
        "value_column": value_column,
        "aggfunc": aggfunc,
        "result": result_val,
        "filtered_rows_count": filtered_numeric.shape[0],
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "max_min_if",
        "parameters": {
            "condition_column": condition_column,
            "condition_value": condition_value,
            "value_column": value_column,
            "aggfunc": aggfunc
        },
        "stats": {"result": result_val, "filtered_rows_count": filtered_numeric.shape[0]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# {'MAXIF' if aggfunc == 'max' else 'MINIF'}: {condition_column} == {repr(condition_value)}
mask = df['{condition_column}'] == {repr(condition_value)}
result = df.loc[mask, '{value_column}'].{aggfunc}()

# Sonuç: {result_val}
print(f"{{'{aggfunc.upper()}'}} değeri: {{result}}")
```"""
    }

    # Excel oluşturma
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        filtered_numeric.to_frame(name=value_column).to_excel(writer, sheet_name="FilteredValues", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": filtered_numeric.to_frame(name=value_column),
        "excel_bytes": output,
        "excel_filename": f"{aggfunc}_{value_column}_by_{condition_column}.xlsx"
    }