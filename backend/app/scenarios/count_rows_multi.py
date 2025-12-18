from io import BytesIO
from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.excel_utils import read_table_from_upload, build_condition_mask

router = APIRouter(tags=["scenario - count rows multi"])


def _normalize_params_for_multi(params: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    /run/{id} endpoint'inde query parametreleri dict olarak alıyoruz.
    Aynı key birden çok gelirse list'e çeviriyoruz.
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
    Senaryo motoru için core fonksiyon.

    Beklenen params:
    - column / columns (tekrar eden)
    - op / operators
    - value / values
    - return_mode
    """
    normalized = _normalize_params_for_multi(params)
    columns = normalized["columns"]
    operators = normalized["operators"]
    values = normalized["values"]

    return_mode = params.get("return_mode", "summary")

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

    mask = pd.Series([True] * len(df))
    conditions_detail = []

    for col, op, val in zip(columns, operators, values):
        cond_mask = build_condition_mask(df, col, op, val)
        mask &= cond_mask

        conditions_detail.append(
            {
                "column": col,
                "operator": op,
                "value": val,
                "match_count_for_this_condition": int(cond_mask.sum()),
            }
        )

    match_count = int(mask.sum())
    total_rows = int(len(df))

    summary = {
        "scenario": "count_rows_multi_conditions",
        "conditions": conditions_detail,
        "match_count_all_conditions": match_count,
        "total_rows": total_rows,
    }
    
    # Python kod özeti
    conditions_code = " & ".join([f"(df['{c['column']}'] {c['operator']} {repr(c['value'])})" for c in conditions_detail])
    technical_details = {
        "scenario": "count_rows_multi",
        "parameters": {"conditions": conditions_detail},
        "stats": {"match_count": match_count, "total_rows": total_rows},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu koşul sayımı
mask = {conditions_code}
count = mask.sum()

# Sonuç: {match_count} eşleşme (toplam {total_rows} satır)
print(f"Eşleşen: {{count}}")
```"""
    }

    if return_mode == "summary":
        return {
            "summary": summary,
            "technical_details": technical_details,
            "excel_bytes": None,
            "excel_filename": None,
        }

    filtered_df = df[mask].copy()

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
        "excel_filename": "opradox_count_rows_multi_result.xlsx",
    }


@router.post("/count-rows-multi")
async def count_rows_multi_conditions(
    file: UploadFile = File(
        ...,
        description="Excel veya CSV dosyanız (.xlsx, .xls, .csv)",
    ),
    columns: List[str] = Query(
        ...,
        description="Koşul uygulanacak sütun adları listesi (örn. Sehir, Durum)",
        alias="column",
    ),
    operators: List[str] = Query(
        ...,
        description=(
            "Her sütun için operator listesi (örn. eq, gt, contains, in). "
            "Sıra sütunlarla aynı olmalı."
        ),
        alias="op",
    ),
    values: List[str] = Query(
        ...,
        description="Her koşul için değer listesi (örn. Istanbul, Aktif, 01.01.2024)",
        alias="value",
    ),
    return_mode: str = Query(
        "summary",
        description=(
            "Dönüş tipi: "
            "'summary' yalnızca özet JSON döner; "
            "'summary_and_rows' ise ayrıca filtrelenmiş satırları Excel olarak döner."
        ),
    ),
):
    """
    Mevcut endpoint – frontend hâlâ bunu kullanıyor.
    İçeride 'run' fonksiyonuna delege ediyoruz.
    """
    if not (len(columns) == len(operators) == len(values)):
        raise HTTPException(
            status_code=400,
            detail=(
                "columns, operators (op) ve values listelerinin uzunlukları eşit olmalıdır. "
                f"Alınan uzunluklar: columns={len(columns)}, "
                f"operators={len(operators)}, values={len(values)}"
            ),
        )

    df = read_table_from_upload(file)

    params: Dict[str, Any] = {
        "column": columns,
        "op": operators,
        "value": values,
        "return_mode": return_mode,
    }

    result = run(df, params)

    if result["excel_bytes"] is None:
        return {"summary": result["summary"]}

    excel_bytes = result["excel_bytes"]
    filename_safe = result.get("excel_filename") or "opradox_count_rows_multi_result.xlsx"

    return StreamingResponse(
        excel_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": f'attachment; filename=\"{filename_safe}\"'},
    )
