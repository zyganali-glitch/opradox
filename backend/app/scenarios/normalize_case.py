from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Parametre kontrolü
    if "column" not in params:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'column' gereklidir.")
    if "case" not in params:
        raise HTTPException(status_code=400, detail="Eksik parametre: 'case' gereklidir.")
    
    column = params["column"]
    case = params["case"].lower()
    valid_cases = {"upper", "lower", "proper"}
    if case not in valid_cases:
        raise HTTPException(status_code=400, detail=f"Geçersiz 'case' parametresi. Beklenen: {valid_cases}")
    
    if column not in df.columns:
        raise HTTPException(status_code=400, detail=f"'{column}' sütunu bulunamadı. Mevcut sütunlar: {list(df.columns)}")
    
    # Orijinal sütun tipini korumak için kopya al
    df_copy = df.copy()
    
    # Sadece string tipteki değerlere uygulama, NaN'lar korunur
    def normalize_text(val):
        if pd.isna(val):
            return val
        if not isinstance(val, str):
            val = str(val)
        if case == "upper":
            return val.upper()
        elif case == "lower":
            return val.lower()
        else:  # proper
            # Her kelimenin baş harfi büyük, diğerleri küçük
            return val.title()
    
    df_copy[column] = df_copy[column].apply(normalize_text)
    
    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_copy.to_excel(writer, index=False, sheet_name="Normalized")
        summary_df = pd.DataFrame({
            "Original Non-Null Count": [df[column].notna().sum()],
            "Normalized Non-Null Count": [df_copy[column].notna().sum()],
            "Case Applied": [case]
        })
        summary_df.to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)
    
    technical_details = {
        "column": column,
        "case_applied": case,
        "original_non_null_count": int(df[column].notna().sum()),
        "normalized_non_null_count": int(df_copy[column].notna().sum()),
        "total_rows": int(len(df))
    }
    
    return {
        "summary": f"'{column}' sütunundaki metinler başarıyla '{case}' formatına dönüştürüldü.",
        "technical_details": technical_details,
        "excel_bytes": output,
        "excel_filename": f"normalized_{column}.xlsx",
        "df_out": df_copy
    }