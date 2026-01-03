from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.excel_utils import read_table_from_upload

router = APIRouter(tags=["scenario - sum if"])


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo motoru için core fonksiyon.

    Beklenen params:
    - condition_column
    - condition_value
    - target_column
    - return_mode
    """
    condition_column = params.get("condition_column")
    condition_value = params.get("condition_value")
    target_column = params.get("target_column")
    return_mode = params.get("return_mode", "summary")

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
    sum_value = float(numeric_series.sum()) if match_count > 0 else 0.0

    summary = {
        "scenario": "sum_by_condition",
        "condition_column": condition_column,
        "condition_value": condition_value,
        "target_column": target_column,
        "match_count": match_count,
        "total_rows": total_rows,
        "sum_value": sum_value,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "sum_if",
        "parameters": {
            "condition_column": condition_column,
            "condition_value": condition_value,
            "target_column": target_column
        },
        "stats": {"match_count": match_count, "sum_value": sum_value},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# SUMIF: {condition_column} == {repr(condition_value)} iken {target_column} toplamı
mask = df['{condition_column}'].astype(str) == {repr(str(condition_value))}
total = df.loc[mask, '{target_column}'].sum()

# Sonuç: {sum_value:.2f} ({match_count} eşleşen satır)
print(f"Toplam: {{total}}")
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
        "excel_filename": "opradox_sum_by_condition_result.xlsx",
    }


@router.post("/sum-by-condition")
async def sum_by_condition(
    file: UploadFile = File(
        ...,
        description="Excel veya CSV dosyanız (.xlsx, .xls, .csv)",
    ),
    condition_column: str = Query(
        ...,
        description="Koşulun kontrol edileceği sütun (örn. Durum)",
    ),
    condition_value: str = Query(
        ...,
        description="Koşul değeri (örn. Ödendi)",
    ),
    target_column: str = Query(
        ...,
        description="Toplanacak sayısal sütun (örn. Tutar)",
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
    Klasik endpoint – içeride run() fonksiyonuna delege ediyor.
    """
    df = read_table_from_upload(file)

    params: Dict[str, Any] = {
        "condition_column": condition_column,
        "condition_value": condition_value,
        "target_column": target_column,
        "return_mode": return_mode,
    }

    result = run(df, params)

    if result["excel_bytes"] is None:
        return {"summary": result["summary"]}

    excel_bytes = result["excel_bytes"]
    filename_safe = result.get("excel_filename") or "opradox_sum_by_condition_result.xlsx"

    return StreamingResponse(
        excel_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": f'attachment; filename=\"{filename_safe}\"'},
    )
