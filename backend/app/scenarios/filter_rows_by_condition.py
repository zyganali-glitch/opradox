from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Beklenen parametreler: filter_column, operator, filter_value
    # operator: eq, neq, lt, lte, gt, gte, contains
    filter_column = params.get("filter_column")
    operator = params.get("operator", "eq")  # default='eq'
    # Support both 'filter_value' and 'value' parameter names
    filter_value = params.get("filter_value") if params.get("filter_value") is not None else params.get("value")
    
    # filter_column zorunlu
    if not filter_column:
        raise HTTPException(status_code=400, detail="filter_column parametresi zorunludur.")

    if filter_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"'{filter_column}' sütunu bulunamadı, mevcut sütunlar: {list(df.columns)[:10]}"
        )
    
    # filter_value None ise NaN değerleri filtrele modu
    if filter_value is None:
        filter_value = ""
        # Boş/NaN değerlere sahip satırları bul

    # Filtreleme için desteklenen operatörler
    operators = {"eq", "neq", "lt", "lte", "gt", "gte", "contains"}
    if operator not in operators:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz operator '{operator}'. Desteklenenler: {sorted(operators)}"
        )

    # Filtreleme işlemi
    series = df[filter_column]

    # Sayısal dönüşüm denemesi (eğer mümkünse)
    series_numeric = pd.to_numeric(series, errors="coerce")
    filter_value_numeric = None
    try:
        filter_value_numeric = float(filter_value)
    except Exception:
        filter_value_numeric = None

    if operator == "contains":
        # contains sadece string sütunlarda anlamlı
        mask = series.astype(str).str.contains(str(filter_value), na=False)
    else:
        # Sayısal karşılaştırma varsa sayısal kullan, değilse string karşılaştırması yap
        if filter_value_numeric is not None and series_numeric.notna().all():
            s = series_numeric
            v = filter_value_numeric
        else:
            s = series
            v = filter_value

        if operator == "eq":
            mask = s == v
        elif operator == "neq":
            mask = s != v
        elif operator == "lt":
            mask = s < v
        elif operator == "lte":
            mask = s <= v
        elif operator == "gt":
            mask = s > v
        elif operator == "gte":
            mask = s >= v
        else:
            raise HTTPException(status_code=400, detail="Bilinmeyen operator")

    filtered_df = df[mask].copy()

    summary = {
        "total_rows": len(df),
        "filtered_rows": len(filtered_df),
        "filter_column": filter_column,
        "operator": operator,
        "filter_value": filter_value
    }
    
    # Python kod özeti oluştur
    operator_map = {
        "eq": "==", "neq": "!=", "lt": "<", "lte": "<=", 
        "gt": ">", "gte": ">=", "contains": ".str.contains()"
    }
    op_symbol = operator_map.get(operator, operator)
    
    if operator == "contains":
        code_line = f"df = df[df['{filter_column}'].astype(str).str.contains('{filter_value}', na=False)]"
    else:
        code_line = f"df = df[df['{filter_column}'] {op_symbol} {repr(filter_value)}]"
    
    technical_details = {
        "scenario": "filter_rows_by_condition",
        "parameters": {
            "filter_column": filter_column,
            "operator": operator,
            "filter_value": filter_value
        },
        "stats": {
            "input_rows": len(df),
            "output_rows": len(filtered_df),
            "removed_rows": len(df) - len(filtered_df)
        },
        "python_code": f"""```python
import pandas as pd

# Dosyayı oku
df = pd.read_excel('dosya.xlsx')

# Filtreleme: {filter_column} {op_symbol} {repr(filter_value)}
{code_line}

# Sonuç: {len(filtered_df)} satır (toplam {len(df)} satırdan)
df.to_excel('filtered_result.xlsx', index=False)
```"""
    }

    if len(filtered_df) == 0:
        # Excel üretmeye gerek yok
        return {
            "summary": summary,
            "technical_details": technical_details,
            "excel_bytes": None,
            "excel_filename": None
        }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Original", index=False)
        filtered_df.to_excel(writer, sheet_name="Filtered", index=False)
        # Özet sayfası
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)

    output.seek(0)
    filename = "filtered_rows.xlsx"

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": filtered_df,
        "excel_bytes": output,
        "excel_filename": filename
    }