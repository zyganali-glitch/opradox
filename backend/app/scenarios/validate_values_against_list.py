from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler: value_column, reference_list (liste veya csv/excel dosyası yolu olabilir)
    # Opsiyonel: group_column (gruplandırma için), ignore_case (büyük/küçük harf duyarsız kontrol)
    value_column = params.get("value_column")
    # Support both 'reference_list' and 'valid_values' parameter names
    reference_list = params.get("reference_list") or params.get("valid_values")
    group_column = params.get("group_column")
    ignore_case = params.get("ignore_case", False)

    # value_column boşsa ilk sütun auto-select
    if not value_column:
        if len(df.columns) > 0:
            value_column = df.columns[0]
        else:
            raise HTTPException(status_code=400, detail="Veri seti boş. Lütfen value_column belirtin.")

    if value_column is None:
        # Yukaridaki islemden sonra hala None ise
        raise HTTPException(status_code=400, detail="value_column parametresi eksik")
    if reference_list is None:
        raise HTTPException(status_code=400, detail="reference_list parametresi eksik")

    if value_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{value_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}"
        )

    # reference_list parametresi ya liste ya da string (dosya yolu) olabilir
    if isinstance(reference_list, str):
        # Dosya yolu ise csv veya excel olabilir
        try:
            if reference_list.lower().endswith((".xls", ".xlsx")):
                ref_df = pd.read_excel(reference_list)
            else:
                ref_df = pd.read_csv(reference_list)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"reference_list dosyası okunamadı: {str(e)}")

        # İlk sütunu referans liste olarak al
        if ref_df.shape[1] == 0:
            raise HTTPException(status_code=400, detail="reference_list dosyası boş")
        ref_values = ref_df.iloc[:, 0].dropna().astype(str).unique().tolist()
    elif isinstance(reference_list, list):
        ref_values = [str(x) for x in reference_list if x is not None]
    else:
        raise HTTPException(status_code=400, detail="reference_list parametresi liste veya dosya yolu olmalı")

    # Değerleri stringe çevir, NaN'ları boş string yap
    df_values = df[value_column].fillna("").astype(str)

    if ignore_case:
        ref_set = set(x.lower() for x in ref_values)
        df_check = df_values.str.lower()
    else:
        # Normalize reference set: string, strip, lower
        ref_set = set(str(x).strip().lower() for x in ref_values)
        # Normalize check values
        df_check = df_values.str.strip().str.lower()

    # Normalize for robust comparison
    if df_check.dtype == 'object':
        df_check = df_check.astype(str).str.strip().str.lower()
        
    ref_set_normalized = set()
    for v in ref_set:
        ref_set_normalized.add(str(v).strip().lower())
        
    is_valid = df_check.isin(ref_set_normalized)

    invalid_rows = df.loc[~is_valid, :].copy()
    invalid_count = len(invalid_rows)
    total_count = len(df)

    summary = {
        "total_rows": total_count,
        "invalid_count": invalid_count,
        "valid_count": total_count - invalid_count,
        "invalid_ratio": round(invalid_count / total_count if total_count > 0 else 0, 4),
        "value_column": value_column,
        "reference_list_count": len(ref_set),
        "ignore_case": ignore_case
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "validate_values_against_list",
        "parameters": {"value_column": value_column, "ignore_case": ignore_case},
        "stats": {"invalid_count": invalid_count, "valid_count": total_count - invalid_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Değerleri listeyle doğrula
valid_values = {list(ref_set)[:5]}  # ilk 5 değer
    # Normalize helper
    col_series = df['{value_column}'].astype(str).str.strip().str.lower()
    valid_vals_norm = [str(x).strip().lower() for x in valid_values]
    is_valid = col_series.isin(valid_vals_norm)
invalid_df = df[~is_valid]

# {invalid_count} geçersiz değer bulundu
invalid_df.to_excel('gecersiz_degerler.xlsx', index=False)
```"""
    }

    excel_bytes = None
    excel_filename = None

    if invalid_count > 0:
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            invalid_rows.to_excel(writer, index=False, sheet_name="Invalid Values")
            # Özet sheet
            pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
        output.seek(0)
        excel_bytes = output
        excel_filename = f"invalid_values_{value_column}.xlsx"

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": invalid_rows if invalid_count > 0 else df,
        "excel_bytes": excel_bytes,
        "excel_filename": excel_filename
    }