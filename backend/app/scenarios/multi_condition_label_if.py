from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Gerekli parametreler: conditions (liste), label_column (str)
    # conditions: list of dicts with keys: "column", "operator", "value", "label"
    # Örnek:
    # conditions = [
    #   {"column": "age", "operator": ">", "value": 60, "label": "Senior"},
    #   {"column": "age", "operator": "<=", "value": 60, "label": "Adult"},
    #   {"column": "income", "operator": ">", "value": 5000, "label": "High Income"}
    # ]
    # label_column: str, yeni etiket sütunu adı

    conditions = params.get("conditions")
    label_column = params.get("label_column", "Label")  # default='Label'
    
    if not conditions:
        raise HTTPException(status_code=400, detail="conditions parametresi zorunludur. Örnek: [{column, operator, value, label}, ...]")

    if not isinstance(conditions, list) or len(conditions) == 0:
        raise HTTPException(status_code=400, detail="conditions parametresi boş veya liste değil")

    if not isinstance(conditions, list) or len(conditions) == 0:
        raise HTTPException(status_code=400, detail="conditions parametresi boş veya liste değil")

    # Tüm koşullarda belirtilen sütunların df'de olup olmadığını kontrol et
    required_columns = set()
    for cond in conditions:
        if not isinstance(cond, dict):
            raise HTTPException(status_code=400, detail="conditions listesinde dict olmayan eleman var")
        if "column" not in cond or "operator" not in cond or "value" not in cond or "label" not in cond:
            raise HTTPException(status_code=400, detail="conditions elemanlarında eksik anahtar var")
        required_columns.add(cond["column"])

    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"DataFrame'de eksik sütunlar: {missing_cols}")

    # Operatör fonksiyonları
    def op_func(series, op, val):
        if op == "==":
            return series == val
        elif op == "!=":
            return series != val
        elif op == ">":
            return series > val
        elif op == ">=":
            return series >= val
        elif op == "<":
            return series < val
        elif op == "<=":
            return series <= val
        elif op == "in":
            if not isinstance(val, (list, set, tuple)):
                raise HTTPException(status_code=400, detail="'in' operator value must be list/set/tuple")
            return series.isin(val)
        elif op == "not in":
            if not isinstance(val, (list, set, tuple)):
                raise HTTPException(status_code=400, detail="'not in' operator value must be list/set/tuple")
            return ~series.isin(val)
        else:
            raise HTTPException(status_code=400, detail=f"Desteklenmeyen operator: {op}")

    # Yeni sütun oluştur, default None
    df = df.copy()
    df[label_column] = None

    # Koşulları sırayla uygula, ilk eşleşen etiket atanır (nested if mantığı)
    for cond in conditions:
        col = cond["column"]
        op = cond["operator"]
        val = cond["value"]
        label = cond["label"]

        mask = op_func(df[col], op, val)
        df.loc[df[label_column].isna() & mask, label_column] = label

    # Atanmayanlara "Unlabeled" yaz
    df[label_column].fillna("Unlabeled", inplace=True)

    # Özet: kaç farklı etiket var, her etiketten kaç tane
    label_counts = df[label_column].value_counts(dropna=False).to_dict()

    summary = {
        "total_rows": len(df),
        "label_column": label_column,
        "unique_labels": len(label_counts),
        "label_counts": label_counts
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "multi_condition_label_if",
        "parameters": {"conditions": conditions, "label_column": label_column},
        "stats": {"unique_labels": len(label_counts)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu koşullu etiketleme (IF-ELSEIF-ELSE gibi)
conditions = {conditions[:2]}  # ilk 2 koşul
df['{label_column}'] = 'Unlabeled'

for cond in conditions:
    mask = df[cond['column']] ... cond['value']  # operator uygulanır
    df.loc[mask, '{label_column}'] = cond['label']

df.to_excel('etiketlenmis.xlsx', index=False)
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Labeled Data")
        pd.DataFrame.from_dict(label_counts, orient="index", columns=["Count"]).to_excel(writer, sheet_name="Summary")

    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": df,
        "excel_bytes": output,
        "excel_filename": "labeled_data.xlsx"
    }