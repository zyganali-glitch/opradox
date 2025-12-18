from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_column = params.get("group_column")
    if group_column is not None and group_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"group_column '{group_column}' mevcut değil, mevcut sütunlar: {list(df.columns)}")

    # Eğer group_column verilmişse, gruplayarak eksik değer sayısı hesapla
    if group_column:
        missing_counts = df.isna().groupby(df[group_column]).sum()
        missing_counts = missing_counts.astype(int)
        summary = {
            "group_column": group_column,
            "groups_count": missing_counts.shape[0],
            "columns_count": missing_counts.shape[1],
            "missing_counts_per_group": missing_counts.to_dict(orient="index")
        }
        
        # Python kod özeti
        technical_details = {
            "scenario": "check_missing_values",
            "parameters": {"group_column": group_column},
            "stats": {"groups_count": missing_counts.shape[0]},
            "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Grup bazında eksik değer analizi
missing_by_group = df.isna().groupby(df['{group_column}']).sum()
print(missing_by_group)
```"""
        }
        
        # Excel'e yaz
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            missing_counts.to_excel(writer, sheet_name="MissingCountsByGroup")
            total_missing = df.isna().sum().astype(int)
            total_missing.to_frame(name="missing_count").to_excel(writer, sheet_name="TotalMissing")
        output.seek(0)
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": missing_counts.reset_index(),
            "excel_bytes": output,
            "excel_filename": "missing_values_summary.xlsx"
        }
    else:
        # Tüm df için eksik değer sayısı
        missing_counts = df.isna().sum()
        missing_counts = missing_counts[missing_counts > 0].astype(int)
        summary = {
            "total_columns": len(df.columns),
            "columns_with_missing": len(missing_counts),
            "missing_counts": missing_counts.to_dict()
        }
        
        # Python kod özeti
        technical_details = {
            "scenario": "check_missing_values",
            "parameters": {},
            "stats": {
                "total_columns": len(df.columns),
                "columns_with_missing": len(missing_counts)
            },
            "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Eksik değer analizi
missing = df.isna().sum()
missing = missing[missing > 0]
print(missing)
# Sonuç: {len(missing_counts)} sütunda eksik değer var
```"""
        }
        
        if missing_counts.empty:
            return {
                "summary": summary,
                "technical_details": technical_details,
                "excel_bytes": None,
                "excel_filename": None
            }
        # Excel'e yaz
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            missing_counts.to_frame(name="missing_count").to_excel(writer, sheet_name="MissingCounts")
        output.seek(0)
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": missing_counts.reset_index(),
            "excel_bytes": output,
            "excel_filename": "missing_values_summary.xlsx"
        }