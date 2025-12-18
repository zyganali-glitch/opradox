from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    flag_column = params.get("flag_column")
    condition_column = params.get("condition_column")
    # Support both 'operator' and 'condition_operator' parameter names
    condition_operator = params.get("condition_operator") or params.get("operator")
    # Support both 'value' and 'condition_value' parameter names
    condition_value = params.get("condition_value") if params.get("condition_value") is not None else params.get("value")

    if not flag_column:
        raise HTTPException(status_code=400, detail="flag_column parametresi eksik")
    if not condition_column:
        raise HTTPException(status_code=400, detail="condition_column parametresi eksik")
    if not condition_operator:
        raise HTTPException(status_code=400, detail="condition_operator parametresi eksik")
    if condition_value is None:
        raise HTTPException(status_code=400, detail="condition_value parametresi eksik")

    if condition_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{condition_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}"
        )

    # Operatör fonksiyonları
    ops = {
        "==": lambda x, y: x == y,
        "!=": lambda x, y: x != y,
        ">": lambda x, y: x > y,
        "<": lambda x, y: x < y,
        ">=": lambda x, y: x >= y,
        "<=": lambda x, y: x <= y,
        "in": lambda x, y: x.isin(y) if isinstance(y, (list, set, tuple)) else x == y,
        "not in": lambda x, y: ~x.isin(y) if isinstance(y, (list, set, tuple)) else x != y,
    }

    if condition_operator not in ops:
        raise HTTPException(status_code=400, detail=f"condition_operator geçersiz, desteklenenler: {list(ops.keys())}")

    # Eğer condition_value liste veya string ise uygun hale getir
    val = condition_value
    if condition_operator in ["in", "not in"]:
        if isinstance(condition_value, str):
            # virgülle ayrılmış string ise liste yap
            val = [v.strip() for v in condition_value.split(",")]
        elif not isinstance(condition_value, (list, set, tuple)):
            val = [condition_value]

    # Koşulu uygula
    try:
        condition_series = ops[condition_operator](df[condition_column], val)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Koşul uygulanırken hata: {str(e)}")

    df_flagged = df.copy()
    df_flagged[flag_column] = condition_series.map({True: "EVET", False: "HAYIR"})

    summary = {
        "total_rows": len(df_flagged),
        "flag_column": flag_column,
        "flagged_yes_count": int(condition_series.sum()),
        "flagged_no_count": int(len(df_flagged) - condition_series.sum())
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "flag_rows_that_meet_rule",
        "parameters": {"condition_column": condition_column, "condition_operator": condition_operator, "condition_value": condition_value},
        "stats": {"flagged_yes_count": int(condition_series.sum())},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Kurala uyan satırları işaretle
mask = df['{condition_column}'] {condition_operator} {repr(val)}
df['{flag_column}'] = mask.map({{True: 'EVET', False: 'HAYIR'}})

# Sonuç: {int(condition_series.sum())} satır işaretlendi
df.to_excel('isaretlenmis.xlsx', index=False)
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_flagged.to_excel(writer, index=False, sheet_name="Result")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_flagged,
        "excel_bytes": output,
        "excel_filename": "flagged_rows.xlsx"
    }