from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.excel_utils import read_table_from_upload

router = APIRouter(tags=["scenario - count value"])


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo motoru için core fonksiyon.

    Beklenen params:
    - column (veya column_name)
    - value (veya search_value)
    - return_mode: 'summary' veya 'summary_and_rows'
    """
    column_name = params.get("column") or params.get("column_name")
    search_value = params.get("value") or params.get("search_value")
    return_mode = params.get("return_mode", "summary")

    if not column_name:
        raise HTTPException(
            status_code=400,
            detail="column (veya column_name) parametresi zorunludur.",
        )
    if search_value is None:
        raise HTTPException(
            status_code=400,
            detail="value (veya search_value) parametresi zorunludur.",
        )

    if column_name not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{column_name}' adlı sütun bulunamadı. "
                f"Mevcut sütunlar: {list(df.columns)}"
            ),
        )

    mask = df[column_name].astype(str) == str(search_value)
    match_count = int(mask.sum())
    total_rows = int(len(df))

    summary = {
        "scenario": "count_value_in_column",
        "column_name": column_name,
        "search_value": search_value,
        "match_count": match_count,
        "total_rows": total_rows,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "count_value",
        "parameters": {
            "column_name": column_name,
            "search_value": search_value
        },
        "stats": {
            "match_count": match_count,
            "total_rows": total_rows
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# COUNTIF: {column_name} == {repr(search_value)}
count = (df['{column_name}'].astype(str) == {repr(str(search_value))}).sum()

# Sonuç: {match_count} eşleşme (toplam {total_rows} satır)
print(f"Sayım: {{count}}")
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
        "excel_filename": "opradox_count_value_result.xlsx",
    }


@router.post("/count-value")
async def count_value_in_column(
    file: UploadFile = File(
        ...,
        description="Excel veya CSV dosyanız (.xlsx, .xls, .csv)",
    ),
    column_name: str = Query(
        ...,
        description="Arama yapılacak sütun adı (örn. Durum)",
        alias="column",
    ),
    search_value: str = Query(
        ...,
        description="Aranacak değer (örn. Onaylandı)",
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
    Klasik endpoint: Mevcut frontend bunu kullanıyor.
    İçeride 'run' fonksiyonunu çağırıyoruz.
    """
    df = read_table_from_upload(file)

    params: Dict[str, Any] = {
        "column": column_name,
        "value": search_value,
        "return_mode": return_mode,
    }

    result = run(df, params)

    if result["excel_bytes"] is None:
        return {"summary": result["summary"]}

    excel_bytes = result["excel_bytes"]
    filename_safe = result.get("excel_filename") or "opradox_count_value_result.xlsx"

    return StreamingResponse(
        excel_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": f'attachment; filename=\"{filename_safe}\"'},
    )
