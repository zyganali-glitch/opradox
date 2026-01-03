from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_col = params.get("group_column")
    value_col = params.get("value_column")

    # group_column boşsa ilk kategorik auto-seç
    if not group_col:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if object_cols:
            group_col = object_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Kategorik sütun bulunamadı. Lütfen group_column belirtin.")
    
    # value_column boşsa group_column'dan farklı ilk kategorik auto-seç
    if not value_col:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        available = [c for c in object_cols if c != group_col]
        if available:
            value_col = available[0]
        else:
            raise HTTPException(status_code=400, detail="İkinci kategorik sütun bulunamadı. Lütfen value_column belirtin.")

    missing_cols = [c for c in [group_col, value_col] if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}. Mevcut: {list(df.columns)[:10]}")

    df_subset = df[[group_col, value_col]].copy()
    df_subset[value_col] = df_subset[value_col].astype(str).str.strip()
    df_subset["lower_value"] = df_subset[value_col].str.lower()

    # Grup ve lower_value bazında kaç farklı orijinal value var kontrolü
    grouped = df_subset.groupby([group_col, "lower_value"])[value_col].nunique().reset_index(name="unique_casing_count")

    # Aynı group_col ve lower_value için birden fazla farklı casing varsa tutarsızlık var demektir
    inconsistent = grouped[grouped["unique_casing_count"] > 1]
    
    # Python kod özeti (tutarsızlık bulunduğunda veya bulunmadığında aynı)
    technical_details = {
        "scenario": "find_inconsistent_casing",
        "parameters": {"group_column": group_col, "value_column": value_col},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Büyük/küçük harf tutarsızlığı tespiti
df['{value_col}'] = df['{value_col}'].astype(str).str.strip()
df['lower_value'] = df['{value_col}'].str.lower()

grouped = df.groupby(['{group_col}', 'lower_value'])['{value_col}'].nunique()
inconsistent = grouped[grouped > 1]

print(f"Tutarsız grup sayısı: {{len(inconsistent)}}")
```"""
    }

    # İlgili satırları bulmak için merge yapalım
    if inconsistent.empty:
        summary = {
            "message": "Tutarsız büyük/küçük harf kullanımı bulunamadı.",
            "inconsistent_groups": 0,
            "total_groups": df[group_col].nunique()
        }
        return {"summary": summary, "technical_details": technical_details, "excel_bytes": None, "excel_filename": None}

    merged = pd.merge(df_subset, inconsistent[[group_col, "lower_value"]], on=[group_col, "lower_value"], how="inner")

    # Özet
    inconsistent_groups_count = inconsistent[group_col].nunique()
    total_groups_count = df[group_col].nunique()

    summary = {
        "message": "Tutarsız büyük/küçük harf kullanımı tespit edildi.",
        "inconsistent_groups": inconsistent_groups_count,
        "total_groups": total_groups_count,
        "inconsistent_rows": len(merged)
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        merged.drop(columns=["lower_value"]).to_excel(writer, index=False, sheet_name="InconsistentRows")
        inconsistent.to_excel(writer, index=False, sheet_name="Summary")

    output.seek(0)
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": merged.drop(columns=["lower_value"]),
        "excel_bytes": output,
        "excel_filename": "inconsistent_casing_report.xlsx"
    }