
from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Parametreleri al
    id_vars = params.get("id_vars")
    value_vars = params.get("value_vars")
    var_name = params.get("var_name", "variable")
    value_name = params.get("value_name", "value")
    
    if not id_vars:
        raise HTTPException(status_code=400, detail="id_vars parametresi eksik")
    
    # Unpivot işlemi
    if value_vars:
        melted = pd.melt(df, id_vars=id_vars, value_vars=value_vars, var_name=var_name, value_name=value_name)
    else:
        value_vars = [col for col in df.columns if col not in id_vars]
        melted = pd.melt(df, id_vars=id_vars, value_vars=value_vars, var_name=var_name, value_name=value_name)
    
    summary = {
        "original_rows": len(df),
        "unpivoted_rows": len(melted),
        "id_vars": id_vars
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "unpivot_columns_to_rows",
        "parameters": {"id_vars": id_vars, "var_name": var_name, "value_name": value_name},
        "stats": {"unpivoted_rows": len(melted)},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Sütunları satırlara çevir (Unpivot)
id_vars = {id_vars}
melted = pd.melt(df, id_vars=id_vars, var_name='{var_name}', value_name='{value_name}')

melted.to_excel('unpivot.xlsx', index=False)
```"""
    }
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        melted.to_excel(writer, index=False, sheet_name="Unpivoted")
    output.seek(0)
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": melted,
        "excel_bytes": output,
        "excel_filename": "unpivot_result.xlsx"
    }
