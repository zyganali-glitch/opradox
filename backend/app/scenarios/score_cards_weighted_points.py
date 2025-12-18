from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Beklenen parametreler: rules (list of dict), id_column (optional)
    # rules her biri: {"column": str, "operator": str, "value": Any, "points": float}
    # operator: one of "==", "!=", ">", ">=", "<", "<="
    # id_column: satır bazında kimlik için (opsiyonel)
    
    # Kontrol: rules parametre var mı?
    if "rules" not in params:
        raise HTTPException(status_code=400, detail="Eksik parametre: rules")
    rules = params["rules"]
    if not isinstance(rules, list) or len(rules) == 0:
        raise HTTPException(status_code=400, detail="rules parametresi boş veya liste değil")
    
    # id_column opsiyonel
    id_column = params.get("id_column", None)
    if id_column is not None and id_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"id_column '{id_column}' mevcut değil, mevcut sütunlar: {list(df.columns)}")
    
    # Tüm kurallarda belirtilen sütunlar df'de olmalı
    required_columns = set()
    for r in rules:
        if not isinstance(r, dict):
            raise HTTPException(status_code=400, detail="rules içindeki her eleman dict olmalı")
        if "column" not in r or "operator" not in r or "value" not in r or "points" not in r:
            raise HTTPException(status_code=400, detail="rules içindeki her dict 'column','operator','value','points' içermeli")
        required_columns.add(r["column"])
    missing_cols = [c for c in required_columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Kurallarda belirtilen sütunlar eksik: {missing_cols}, mevcut sütunlar: {list(df.columns)}")
    
    # Operatör fonksiyonları
    ops = {
        "==": lambda a, b: a == b,
        "!=": lambda a, b: a != b,
        ">": lambda a, b: a > b,
        ">=": lambda a, b: a >= b,
        "<": lambda a, b: a < b,
        "<=": lambda a, b: a <= b,
    }
    
    # Her kural için puan sütunu oluştur
    score_cols = []
    for i, rule in enumerate(rules):
        col = rule["column"]
        op = rule["operator"]
        val = rule["value"]
        pts = rule["points"]
        if op not in ops:
            raise HTTPException(status_code=400, detail=f"Geçersiz operator: {op}")
        # Koşulu uygula
        try:
            cond = ops[op](df[col], val)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Koşul uygulanırken hata: {str(e)}")
        # Puan sütunu adı
        score_col = f"score_rule_{i+1}"
        df[score_col] = cond.astype(float) * float(pts)
        score_cols.append(score_col)
    
    # Toplam puan
    df["total_score"] = df[score_cols].sum(axis=1)
    
    # Özet
    summary = {
        "total_rows": len(df),
        "rules_count": len(rules),
        "total_score_min": df["total_score"].min(),
        "total_score_max": df["total_score"].max(),
        "total_score_mean": df["total_score"].mean(),
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "score_cards_weighted_points",
        "parameters": {"rules_count": len(rules)},
        "stats": {"score_min": float(summary["total_score_min"]), "score_max": float(summary["total_score_max"])},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Ağırlıklı puan kartı
# Her kurala göre puan hesapla
df['score1'] = (df['kolon'] > deger) * 10  # örnek kural
df['total_score'] = df[['score1']].sum(axis=1)

df.to_excel('puanli.xlsx', index=False)
```"""
    }
    
    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Scored Data")
        # Özet sheet
        summary_df = pd.DataFrame.from_dict(summary, orient="index", columns=["value"])
        summary_df.to_excel(writer, sheet_name="Summary")
    output.seek(0)
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "scorecard_results.xlsx"
    }