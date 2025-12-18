from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler
    required_params = ["group_column", "value_column", "aggfunc"]
    for p in required_params:
        if p not in params or not params[p]:
            raise HTTPException(status_code=400, detail=f"'{p}' parametresi eksik veya boş")

    group_col = params["group_column"]
    value_col = params["value_column"]
    aggfunc = params["aggfunc"]

    # aggfunc kontrolü
    valid_aggfuncs = ["sum", "mean", "count", "min", "max", "median", "std"]
    if aggfunc not in valid_aggfuncs:
        raise HTTPException(status_code=400, detail=f"aggfunc '{aggfunc}' geçersiz. Geçerli: {valid_aggfuncs}")

    # Sütun kontrolü
    missing_cols = [c for c in [group_col, value_col] if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütun(lar) eksik: {missing_cols}. Mevcut sütunlar: {list(df.columns)}")

    # Sayısal değer sütunu dönüşümü
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")

    # NaN değerleri hariç tut
    df_filtered = df.dropna(subset=[group_col, value_col])

    # Grup bazlı toplama
    grouped = df_filtered.groupby(group_col)[value_col].agg(aggfunc).reset_index()

    # Alt toplam satırları eklemek için
    # Alt toplam satırı için group_col = "Alt Toplam"
    subtotal_label = "Alt Toplam"

    # Alt toplam satırı eklemek için:
    # grouped DataFrame'ine alt toplam satırı ekle
    subtotal_value = getattr(grouped[value_col], aggfunc)()
    subtotal_row = pd.DataFrame({group_col: [subtotal_label], value_col: [subtotal_value]})

    result_df = pd.concat([grouped, subtotal_row], ignore_index=True)

    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, sheet_name="Result", index=False)
        summary = {
            "group_column": group_col,
            "value_column": value_col,
            "aggfunc": aggfunc,
            "groups_count": grouped.shape[0],
            "subtotal_label": subtotal_label,
            "subtotal_value": subtotal_value.item() if hasattr(subtotal_value, "item") else subtotal_value,
        }
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)

    output.seek(0)
    
    # Python kod özeti
    technical_details = {
        "scenario": "pivot_with_subtotals",
        "parameters": {"group_column": group_col, "value_column": value_col, "aggfunc": aggfunc},
        "stats": {"groups_count": grouped.shape[0], "subtotal_value": summary["subtotal_value"]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Grup bazlı toplama + alt toplam
grouped = df.groupby('{group_col}')['{value_col}'].{aggfunc}().reset_index()
subtotal = grouped['{value_col}'].{aggfunc}()
result = pd.concat([grouped, pd.DataFrame({{'{group_col}': ['Alt Toplam'], '{value_col}': [subtotal]}})])

result.to_excel('alt_toplam.xlsx', index=False)
```"""
    }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result_df,
        "excel_bytes": output,
        "excel_filename": "grouped_report_with_subtotals.xlsx"
    }