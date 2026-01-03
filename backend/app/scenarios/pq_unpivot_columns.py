from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Beklenen parametreler:
    # id_vars: unpivot yapılmayacak, sabit kalacak sütunlar (list of str)
    # value_name: unpivot sonrası değer sütunu adı (str)
    # var_name: unpivot sonrası değişken sütunu adı (str)
    # opsiyonel: start_date, end_date (str, YYYY-MM-DD formatında) - var_name sütunundaki tarihleri filtrelemek için
    
    id_vars = params.get("id_vars")
    value_name = params.get("value_name", "Value") # default='Value'
    var_name = params.get("var_name", "Variable")  # default='Variable'
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # id_vars boşsa ilk sütunu id_var olarak al
    if not id_vars:
        if len(df.columns) > 0:
            id_vars = [df.columns[0]]
        else:
            raise HTTPException(status_code=400, detail="Veri seti boş. Unpivot yapılamaz.")

    if isinstance(id_vars, str):
        id_vars = [c.strip() for c in id_vars.split(",") if c.strip()]
    
    if id_vars is None or not isinstance(id_vars, list):
         # Yukaridaki auto-detect calismazsa diye extra catch
         raise HTTPException(status_code=400, detail="id_vars parametresi eksik veya liste değil")
    
    missing_cols = [col for col in id_vars if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"id_vars sütunları eksik: {missing_cols} mevcut sütunlar: {list(df.columns)}")
    
    # unpivot yapılacak sütunlar = df.columns - id_vars
    value_vars = [col for col in df.columns if col not in id_vars]
    if not value_vars:
        raise HTTPException(status_code=400, detail="Unpivot yapılacak sütun yok (id_vars dışındaki sütunlar boş)")
    
    # melt işlemi
    melted = pd.melt(df, id_vars=id_vars, value_vars=value_vars, var_name=var_name, value_name=value_name)
    
    # Eğer start_date veya end_date varsa var_name sütununu datetime yap ve filtre uygula
    if start_date or end_date:
        melted[var_name] = pd.to_datetime(melted[var_name], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
            except Exception:
                raise HTTPException(status_code=400, detail="start_date parametresi geçersiz tarih formatında")
            melted = melted[melted[var_name] >= start_dt]
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
            except Exception:
                raise HTTPException(status_code=400, detail="end_date parametresi geçersiz tarih formatında")
            melted = melted[melted[var_name] <= end_dt]
    
    # Özet bilgileri
    summary = {
        "original_row_count": len(df),
        "unpivoted_row_count": len(melted),
        "id_vars_count": len(id_vars),
        "value_vars_count": len(value_vars),
        "value_name": value_name,
        "var_name": var_name,
    }
    
    # Python kod özeti
    id_vars_str = ', '.join([f"'{c}'" for c in id_vars])
    technical_details = {
        "scenario": "pq_unpivot_columns",
        "parameters": {"id_vars": id_vars, "value_name": value_name, "var_name": var_name},
        "stats": {"original_row_count": len(df), "unpivoted_row_count": len(melted)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Unpivot (melt) işlemi - sütunları satıra çevir
id_vars = [{id_vars_str}]
melted = pd.melt(df, id_vars=id_vars, var_name='{var_name}', value_name='{value_name}')

melted.to_excel('unpivot_sonuc.xlsx', index=False)
```"""
    }
    
    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Original", index=False)
        melted.to_excel(writer, sheet_name="Unpivoted", index=False)
        pd.DataFrame([summary]).to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": melted,
        "excel_bytes": output,
        "excel_filename": "unpivot_result.xlsx"
    }