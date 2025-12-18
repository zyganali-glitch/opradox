from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler: source_column, marker, part ('before' veya 'after')
    source_column = params.get("source_column")
    marker = params.get("marker")
    part = params.get("part")

    if source_column is None:
        raise HTTPException(status_code=400, detail="source_column parametresi eksik")
    if marker is None:
        raise HTTPException(status_code=400, detail="marker parametresi eksik")
    if part not in ("before", "after"):
        raise HTTPException(status_code=400, detail="part parametresi 'before' veya 'after' olmalı")

    if source_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{source_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}"
        )

    # Fonksiyon: verilen stringde marker'dan önceki veya sonraki kısmı alır
    def extract_text(s: Any) -> Any:
        if pd.isna(s):
            return None
        s = str(s)
        idx = s.find(marker)
        if idx == -1:
            return None
        if part == "before":
            return s[:idx]
        else:
            return s[idx+len(marker):]

    result_series = df[source_column].apply(extract_text)

    # Yeni sütun adı
    new_col_name = f"{source_column}_{part}_{marker}"
    df_result = df.copy()
    df_result[new_col_name] = result_series

    # Özet
    total_rows = len(df)
    extracted_count = result_series.notna().sum()
    missing_count = total_rows - extracted_count

    summary = {
        "source_column": source_column,
        "marker": marker,
        "part": part,
        "total_rows": total_rows,
        "extracted_count": int(extracted_count),
        "missing_marker_count": int(missing_count),
        "new_column": new_col_name
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "extract_text_before_after",
        "parameters": {"source_column": source_column, "marker": marker, "part": part},
        "stats": {"extracted_count": int(extracted_count), "missing_marker_count": int(missing_count)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# '{marker}' işaretinin {'öncesindeki' if part == 'before' else 'sonrasındaki'} metni çıkar
def extract(s):
    if pd.isna(s): return None
    idx = str(s).find('{marker}')
    if idx == -1: return None
    return str(s)[:idx] if '{part}' == 'before' else str(s)[idx+{len(marker)}:]

df['{new_col_name}'] = df['{source_column}'].apply(extract)

df.to_excel('metin_cikarimi.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_result.to_excel(writer, sheet_name="Result", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df_result,
        "excel_bytes": output,
        "excel_filename": f"extracted_text_{part}_{marker}.xlsx"
    }