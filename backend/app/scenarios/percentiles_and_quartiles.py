from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    value_column = params.get("value_column")
    percentiles = params.get("percentiles", [25, 50, 75])
    group_column = params.get("group_column")

    if value_column is None:
        raise HTTPException(status_code=400, detail="value_column parametresi gerekli")
    if value_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{value_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}"
        )
    if group_column is not None and group_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{group_column} sütunu bulunamadı, mevcut sütunlar: {list(df.columns)}"
        )
    # Validate percentiles param
    if not isinstance(percentiles, (list, tuple)):
        raise HTTPException(status_code=400, detail="percentiles parametresi liste olmalı")
    try:
        percentiles = [float(p) for p in percentiles]
    except Exception:
        raise HTTPException(status_code=400, detail="percentiles parametresi sayılardan oluşmalı")
    for p in percentiles:
        if not (0 <= p <= 100):
            raise HTTPException(status_code=400, detail="percentiles değerleri 0-100 arasında olmalı")

    # Convert value column to numeric, drop NaN
    values = pd.to_numeric(df[value_column], errors="coerce")
    if group_column:
        groups = df[group_column]
        data = pd.DataFrame({value_column: values, group_column: groups}).dropna(subset=[value_column, group_column])
    else:
        data = pd.DataFrame({value_column: values}).dropna(subset=[value_column])

    if data.empty:
        raise HTTPException(status_code=400, detail="İşlem için uygun veri yok (NaN veya boş)")

    def calc_percentiles(s: pd.Series, ps: list) -> pd.Series:
        q = s.quantile([p/100 for p in ps])
        q.index = [f"p{int(p)}" if p.is_integer() else f"p{p}" for p in ps]
        return q

    if group_column:
        result = data.groupby(group_column)[value_column].apply(lambda s: calc_percentiles(s, percentiles))
        result = result.unstack(level=-1)
    else:
        result = calc_percentiles(data[value_column], percentiles).to_frame().T

    # Quartiles are 25,50,75 by default, ensure they are included in summary
    quartiles = [25, 50, 75]
    quartiles_included = {f"p{int(q)}": None for q in quartiles if q in percentiles}
    if group_column:
        quartile_values = {}
        for q in quartiles_included.keys():
            if q in result.columns:
                quartile_values[q] = result[q].to_dict()
        summary = {
            "grouped": True,
            "groups_count": data[group_column].nunique(),
            "percentiles_calculated": percentiles,
            "quartiles": quartile_values
        }
    else:
        # Access by position instead of label to avoid KeyError when index is not 0
        quartiles_dict = {}
        for q in quartiles:
            col_name = f"p{int(q)}"
            if col_name in result.columns:
                quartiles_dict[col_name] = result.iloc[0][col_name]
        summary = {
            "grouped": False,
            "percentiles_calculated": percentiles,
            "quartiles": quartiles_dict
        }

    # Excel output
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        if group_column:
            result.to_excel(writer, sheet_name="Percentiles")
        else:
            result.T.to_excel(writer, sheet_name="Percentiles")
        # Summary sheet
        summary_df = pd.DataFrame.from_dict(summary, orient="index")
        summary_df.to_excel(writer, sheet_name="Summary")

    output.seek(0)
    
    # Python kod özeti
    technical_details = {
        "scenario": "percentiles_and_quartiles",
        "parameters": {"value_column": value_column, "percentiles": percentiles},
        "stats": summary,
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Yüzdelik dilim ve çeyrekler hesapla
percentiles = {percentiles}
q = df['{value_column}'].quantile([p/100 for p in percentiles])

print(q)
```"""
    }
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result.reset_index() if group_column else result.T,
        "excel_bytes": output,
        "excel_filename": "percentiles_and_quartiles.xlsx"
    }