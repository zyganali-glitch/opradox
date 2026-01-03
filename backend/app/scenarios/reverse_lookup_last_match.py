from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Support multiple parameter name patterns
    lookup_col = params.get("lookup_column") or params.get("group_column")
    lookup_value = params.get("lookup_value") or params.get("search_value")
    value_col = params.get("value_column") or params.get("return_column") or params.get("target_column")
    date_col = params.get("date_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # lookup_col boşsa ilk kategorik auto-select
    if not lookup_col:
        object_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if object_cols:
            lookup_col = object_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Kategorik sütun bulunamadı. Lütfen lookup_column belirtin.")
    
    # value_col boşsa lookup_col olmayan ilk sütun (tercihen numeric ama object de olabilir)
    if not value_col:
        possible_cols = [c for c in df.columns if c != lookup_col]
        if possible_cols:
            value_col = possible_cols[0]
        else:
            raise HTTPException(status_code=400, detail="Değer sütunu bulunamadı. Lütfen value_column belirtin.")

    # Opsiyonel exception atılmıyor çünkü auto-select yaptık. Ama if kontrolü kalabilir
    # (Yukarıda zaten atadık veya hata fırlattık)

    missing_cols = [c for c in [lookup_col, value_col] if c not in df.columns]
    if date_col and date_col not in df.columns:
        missing_cols.append(date_col)
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}. Mevcut: {list(df.columns)}")

    df = df.copy()

    # Simple lookup mode: find last occurrence matching lookup_value
    if lookup_value is not None:
        # Convert to string for comparison
        df[lookup_col] = df[lookup_col].astype(str)
        lookup_value_str = str(lookup_value)
        
        # Filter rows matching lookup_value
        matches = df[df[lookup_col] == lookup_value_str]
        
        if matches.empty:
            summary = {
                "found": False,
                "lookup_column": lookup_col,
                "lookup_value": lookup_value,
                "message": "Eşleşen kayıt bulunamadı"
            }
            return {
                "summary": summary,
                "excel_bytes": None,
                "excel_filename": None
            }
        
        # Get last match (last row)
        last_match = matches.iloc[-1]
        result_value = last_match[value_col]
        
        summary = {
            "found": True,
            "lookup_column": lookup_col,
            "lookup_value": lookup_value,
            "value_column": value_col,
            "result_value": str(result_value),
            "total_matches": len(matches)
        }
        
        # Excel oluştur
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            matches.to_excel(writer, index=False, sheet_name="Matches")
            pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
        output.seek(0)
        
        return {
            "summary": summary,
            "excel_bytes": output,
            "excel_filename": "last_match_result.xlsx"
        }

    # Advanced mode: date-based last match per group
    if not date_col:
        raise HTTPException(status_code=400, detail="'date_column' parametresi eksik (ya da 'lookup_value' belirtin)")

    # Tarih kolonunu datetime yap
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    if df[date_col].isna().all():
        raise HTTPException(status_code=400, detail=f"'{date_col}' sütununda geçerli tarih yok")

    # Tarih aralığı filtrele
    if start_date:
        try:
            start_dt = pd.to_datetime(start_date, dayfirst=True)
            df = df[df[date_col] >= start_dt]
        except Exception:
            raise HTTPException(status_code=400, detail="start_date parametresi geçersiz tarih formatında")
    if end_date:
        try:
            end_dt = pd.to_datetime(end_date, dayfirst=True)
            df = df[df[date_col] <= end_dt]
        except Exception:
            raise HTTPException(status_code=400, detail="end_date parametresi geçersiz tarih formatında")

    # Son eşleşen kaydı bulmak için önce tarih sütununa göre azalan sırala
    df_sorted = df.sort_values(by=date_col, ascending=False)

    # group_column bazında ilk (yani en son tarihli) value_column değerini al
    last_matches = df_sorted.drop_duplicates(subset=[lookup_col], keep='first')[
        [lookup_col, value_col, date_col]
    ]

    summary = {
        "total_records": len(df),
        "filtered_records": len(df_sorted),
        "unique_groups": df[lookup_col].nunique(),
        "last_matches_count": len(last_matches)
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "reverse_lookup_last_match",
        "parameters": {"lookup_column": lookup_col, "value_column": value_col},
        "stats": {"last_matches_count": len(last_matches)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Ters arama - son eşleşen kayıt
df['tarih'] = pd.to_datetime(df['tarih'])
df_sorted = df.sort_values('tarih', ascending=False)
last = df_sorted.drop_duplicates('{lookup_col}', keep='first')

last.to_excel('son_eslesen.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Original Data")
        last_matches.to_excel(writer, index=False, sheet_name="Last Matches")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": last_matches,
        "excel_bytes": output,
        "excel_filename": "last_matches.xlsx"
    }