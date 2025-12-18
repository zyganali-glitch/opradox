from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    # Parametre kontrolü
    group_col = params.get("group_column")
    # Support both value_column and value_columns parameter names
    value_col = params.get("value_column") or (params.get("value_columns")[0] if params.get("value_columns") else None)
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    date_col = params.get("date_column")

    if not group_col:
        raise HTTPException(status_code=400, detail="group_column parametresi eksik")
    if not value_col:
        raise HTTPException(status_code=400, detail="value_column parametresi eksik")

    # Sütun kontrolü
    missing_cols = [c for c in [group_col, value_col] if c not in df.columns]
    if date_col:
        if date_col not in df.columns:
            missing_cols.append(date_col)
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Sütunlar eksik: {missing_cols}")

    # Tarih filtresi varsa uygula
    if date_col and (start_date or end_date):
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_col] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_col] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")

    # value_col sayısal yap
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")

    # NaN'ları filtrele
    df_filtered = df.dropna(subset=[group_col, value_col])

    if df_filtered.empty:
        raise HTTPException(status_code=400, detail="Filtre sonrası veri yok")

    # Grup bazlı özetler
    grouped = df_filtered.groupby(group_col)[value_col]
    summary_df = pd.DataFrame({
        "count": grouped.count(),
        "average": grouped.mean(),
        "total": grouped.sum()
    }).reset_index()

    # Özet bilgisi
    summary = {
        "group_column": group_col,
        "value_column": value_col,
        "groups_count": summary_df.shape[0],
        "total_records": len(df_filtered),
        "overall_count": int(df_filtered[value_col].count()),
        "overall_average": float(df_filtered[value_col].mean()),
        "overall_total": float(df_filtered[value_col].sum())
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "report_multi_metric_summary",
        "parameters": {"group_column": group_col, "value_column": value_col},
        "stats": {"groups_count": summary_df.shape[0], "overall_total": summary["overall_total"]},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çoklu metrik özet
grouped = df.groupby('{group_col}')['{value_col}']
summary = pd.DataFrame({{'count': grouped.count(), 'average': grouped.mean(), 'total': grouped.sum()}})

summary.to_excel('coklu_metrik.xlsx')
```"""
    }

    # Excel oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
        # Genel özet sheet
        overall_df = pd.DataFrame([summary])
        overall_df.to_excel(writer, sheet_name="Overview", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": summary_df,
        "excel_bytes": output,
        "excel_filename": "group_multi_metric_summary.xlsx"
    }