from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import HTTPException


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo: Tek koşula göre ortalama (AVERAGEIF mantığı).

    Beklenen params:
    - condition_column
    - condition_value
    - target_column
    - return_mode
    """
    condition_column = params.get("condition_column")
    condition_value = params.get("condition_value")
    target_column = params.get("target_column")
    return_mode = params.get("return_mode", "summary")  # default: summary

    # Zorunlu parametreler kontrolü
    if not condition_column:
        raise HTTPException(
            status_code=400,
            detail="Zorunlu alanlar eksik: condition_column parametresi gerekli."
        )
    if not target_column:
        raise HTTPException(
            status_code=400,
            detail="Zorunlu alanlar eksik: target_column parametresi gerekli."
        )

    missing_cols = [
        col for col in [condition_column, target_column] if col not in df.columns
    ]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Aşağıdaki sütun(lar) bulunamadı: {missing_cols}. "
                f"Mevcut sütunlar: {list(df.columns)[:10]}"
            ),
        )

    # condition_value boşsa boş/NaN değerleri filtrele
    if condition_value is None or condition_value == "":
        mask = df[condition_column].isna() | (df[condition_column].astype(str).str.strip() == "")
        filter_desc = "boş/NaN değerler"
    else:
        mask = df[condition_column].astype(str) == str(condition_value)
        filter_desc = str(condition_value)
    
    filtered_df = df[mask].copy()
    match_count = int(mask.sum())
    total_rows = int(len(df))

    numeric_series = pd.to_numeric(filtered_df[target_column], errors="coerce")
    mean_value = float(numeric_series.mean()) if match_count > 0 else 0.0

    summary = {
        "scenario": "average_by_condition",
        "condition_column": condition_column,
        "condition_value": condition_value,
        "target_column": target_column,
        "match_count": match_count,
        "total_rows": total_rows,
        "average_value": mean_value,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "average_condition",
        "parameters": {
            "condition_column": condition_column,
            "condition_value": condition_value,
            "target_column": target_column
        },
        "stats": {
            "match_count": match_count,
            "total_rows": total_rows,
            "average_value": mean_value
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# AVERAGEIF: {condition_column} == {repr(condition_value)} iken {target_column} ortalaması
mask = df['{condition_column}'].astype(str) == {repr(str(condition_value))}
filtered = df[mask]
average = filtered['{target_column}'].mean()

# Sonuç: {mean_value:.2f} ({match_count} eşleşen satır)
print(f"Ortalama: {{average}}")
```"""
    }

    if return_mode == "summary":
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": filtered_df,
            "excel_bytes": None,
            "excel_filename": None,
        }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        filtered_df.to_excel(writer, index=False, sheet_name="Matches")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")

    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": filtered_df,
        "excel_bytes": output,
        "excel_filename": "opradox_average_by_condition.xlsx",
    }
