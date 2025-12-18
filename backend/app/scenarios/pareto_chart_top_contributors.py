from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    group_col = params.get("group_column")
    value_col = params.get("value_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_col = params.get("date_column")

    if not group_col or not isinstance(group_col, str):
        raise HTTPException(status_code=400, detail="group_column parametresi eksik veya hatalı")
    if not value_col or not isinstance(value_col, str):
        raise HTTPException(status_code=400, detail="value_column parametresi eksik veya hatalı")

    missing_cols = [c for c in [group_col, value_col] if c not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}")

    if date_col:
        if date_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"date_column '{date_col}' veride yok")
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True, errors="raise")
            except Exception:
                raise HTTPException(status_code=400, detail="start_date parametresi geçersiz")
            df = df[df[date_col] >= start_dt]
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True, errors="raise")
            except Exception:
                raise HTTPException(status_code=400, detail="end_date parametresi geçersiz")
            df = df[df[date_col] <= end_dt]

    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df = df.dropna(subset=[group_col, value_col])

    grouped = df.groupby(group_col, dropna=False)[value_col].sum()
    grouped = grouped[grouped > 0]
    if grouped.empty:
        raise HTTPException(status_code=400, detail="Gruplama sonrası veri bulunamadı veya tüm değerler sıfır")

    sorted_contrib = grouped.sort_values(ascending=False)
    total = sorted_contrib.sum()
    cum_sum = sorted_contrib.cumsum()
    cum_perc = cum_sum / total * 100

    result_df = pd.DataFrame({
        group_col: sorted_contrib.index,
        "contribution": sorted_contrib.values,
        "cumulative_percentage": cum_perc.values
    })

    summary = {
        "total_contributors": len(sorted_contrib),
        "total_contribution": float(total) if hasattr(total, "item") or isinstance(total, (int, float)) else total,
        "top_5_contributors_sum": float(sorted_contrib.head(5).sum()) if hasattr(sorted_contrib.head(5).sum(), "item") else sorted_contrib.head(5).sum(),
        "top_5_contributors_percentage": float(round(sorted_contrib.head(5).sum() / total * 100, 2))
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "pareto_chart_top_contributors",
        "parameters": {"group_column": group_col, "value_column": value_col},
        "stats": {"top_5_percentage": summary["top_5_contributors_percentage"]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Pareto analizi (80/20 kuralı)
grouped = df.groupby('{group_col}')['{value_col}'].sum().sort_values(ascending=False)
cum_perc = grouped.cumsum() / grouped.sum() * 100

pareto = pd.DataFrame({{'contribution': grouped, 'cum_pct': cum_perc}})
pareto.to_excel('pareto.xlsx')
```"""
    }

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        result_df.to_excel(writer, index=False, sheet_name="Pareto Analysis")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": result_df,
        "excel_bytes": output,
        "excel_filename": "pareto_analysis.xlsx"
    }