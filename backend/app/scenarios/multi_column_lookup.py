from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Beklenen parametreler
    lookup_columns = params.get("lookup_columns")
    lookup_values = params.get("lookup_values")
    return_column = params.get("return_column")

    if lookup_columns is None or not isinstance(lookup_columns, list) or len(lookup_columns) == 0:
        raise HTTPException(status_code=400, detail="lookup_columns parametresi eksik veya boş liste.")
    if lookup_values is None or not isinstance(lookup_values, list) or len(lookup_values) != len(lookup_columns):
        raise HTTPException(status_code=400, detail="lookup_values parametresi eksik veya lookup_columns ile aynı uzunlukta değil.")
    if return_column is None or not isinstance(return_column, str) or return_column.strip() == "":
        raise HTTPException(status_code=400, detail="return_column parametresi eksik veya boş.")

    # Sütunların varlığı kontrolü
    missing_cols = [col for col in lookup_columns + [return_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veri çerçevesinde eksik sütunlar: {missing_cols}")

    # Filtreleme
    mask = pd.Series([True] * len(df))
    for col, val in zip(lookup_columns, lookup_values):
        mask &= df[col] == val

    filtered = df.loc[mask, return_column]
    
    # Python kod özeti
    lookup_str = ' & '.join([f"(df['{c}'] == {repr(v)})" for c, v in zip(lookup_columns, lookup_values)])
    technical_details = {
        "scenario": "multi_column_lookup",
        "parameters": {"lookup_columns": lookup_columns, "lookup_values": lookup_values, "return_column": return_column},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu sütunla arama (VLOOKUP benzeri)
mask = {lookup_str}
result = df.loc[mask, '{return_column}']

print(f"Bulunan: {{len(result)}} kayıt")
```"""
    }

    if filtered.empty:
        summary = {
            "found": False,
            "message": "Eşleşen kayıt bulunamadı.",
            "lookup_columns": lookup_columns,
            "lookup_values": lookup_values,
            "return_column": return_column
        }
        return {
            "summary": summary,
            "technical_details": technical_details,
            "excel_bytes": None,
            "excel_filename": None
        }

    # Eğer birden fazla eşleşme varsa tümünü döndür
    results = filtered.dropna().unique().tolist()

    summary = {
        "found": True,
        "matches_count": len(filtered),
        "unique_return_values_count": len(results),
        "lookup_columns": lookup_columns,
        "lookup_values": lookup_values,
        "return_column": return_column,
        "return_values": results
    }

    # Excel oluşturma
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # Eşleşen satırları yaz
        df.loc[mask].to_excel(writer, sheet_name="Matches", index=False)
        # Özet bilgiyi yaz
        summary_df = pd.DataFrame([summary])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df.loc[mask],
        "excel_bytes": output,
        "excel_filename": "lookup_results.xlsx"
    }