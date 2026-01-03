from io import BytesIO
from typing import Any, Dict, List

import pandas as pd
from fastapi import HTTPException

from app.excel_utils import build_condition_mask


def _normalize_multi(params: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    column/op/value parametrelerini list'e çevirir.
    /run endpoint'inde aynı key birden çok gelebiliyor.
    """
    def ensure_list(v: Any) -> List[str]:
        if isinstance(v, list):
            return [str(x) for x in v]
        else:
            return [str(v)]

    columns_val = params.get("column") or params.get("columns")
    operators_val = params.get("op") or params.get("operators")
    values_val = params.get("value") or params.get("values")

    columns = ensure_list(columns_val) if columns_val is not None else []
    operators = ensure_list(operators_val) if operators_val is not None else []
    values = ensure_list(values_val) if values_val is not None else []

    return {
        "columns": columns,
        "operators": operators,
        "values": values,
    }


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo: Çoklu koşula göre toplam değer (SUMIFS mantığı).

    Beklenen params:
    - column / columns
    - op / operators
    - value / values
    - target_column
    - return_mode
    """
    normalized = _normalize_multi(params)
    columns = normalized["columns"]
    operators = normalized["operators"]
    values = normalized["values"]

    target_column = params.get("target_column")
    return_mode = params.get("return_mode", "summary")

    # target_column boşsa ilk numeric auto-select
    if not target_column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            target_column = numeric_cols[0]
        else:
            raise HTTPException(
                status_code=400,
                detail="target_column parametresi zorunludur ve sayısal sütun bulunamadı.",
            )

    if not (len(columns) == len(operators) == len(values)):
        raise HTTPException(
            status_code=400,
            detail=(
                "columns, operators (op) ve values listelerinin uzunlukları eşit olmalıdır. "
                f"Alınan uzunluklar: columns={len(columns)}, "
                f"operators={len(operators)}, values={len(values)}"
            ),
        )

    if len(columns) < 1:
        raise HTTPException(
            status_code=400,
            detail="En az bir koşul tanımlamalısınız.",
        )

    if target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{target_column}' adlı sütun bulunamadı. "
                f"Mevcut sütunlar: {list(df.columns)}"
            ),
        )

    mask = pd.Series([True] * len(df))
    conditions_detail = []

    for col, op, val in zip(columns, operators, values):
        # Helper for safer string conversion and case-insensitive check
        # Use na=False to handle missing values gracefully
        cond_mask = df[col].astype(str).str.contains(str(val), case=False, na=False)
        mask &= cond_mask

        conditions_detail.append(
            {
                "column": col,
                "operator": op,
                "value": val,
                "match_count_for_this_condition": int(cond_mask.sum()),
            }
        )

    filtered_df = df[mask].copy()
    match_count = int(mask.sum())
    total_rows = int(len(df))

    numeric_series = pd.to_numeric(filtered_df[target_column], errors="coerce")
    sum_value = float(numeric_series.sum()) if match_count > 0 else 0.0

    summary = {
        "scenario": "sum_by_multi_conditions",
        "target_column": target_column,
        "conditions": conditions_detail,
        "match_count_all_conditions": match_count,
        "total_rows": total_rows,
        "sum_value": sum_value,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "sum_multi",
        "parameters": {"target_column": target_column, "conditions_count": len(columns)},
        "stats": {"sum_value": sum_value, "match_count": match_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu koşullu toplam (SUMIFS)
mask = pd.Series([True] * len(df))
for col, op, val in conditions:
    mask &= df[col].astype(str).str.contains(val, case=False, na=False)  # Robusted
    
result = df.loc[mask, '{target_column}'].sum()

# Sonuç: {sum_value}
print(f"Toplam: {{result}}")
```"""
    }

    if return_mode == "summary":
        return {
            "summary": summary,
            "technical_details": technical_details,
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
        "excel_filename": "opradox_sum_by_multi_conditions.xlsx",
    }
