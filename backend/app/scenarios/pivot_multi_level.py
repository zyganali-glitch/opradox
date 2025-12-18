from io import BytesIO
from typing import Any, Dict
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    required_params = ["group_columns", "value_column", "aggfunc"]
    for p in required_params:
        if p not in params:
            raise HTTPException(status_code=400, detail=f"'{p}' parametresi eksik")

    group_columns = params["group_columns"]
    if not isinstance(group_columns, list) or len(group_columns) < 2:
        raise HTTPException(status_code=400, detail="'group_columns' en az iki elemanlı liste olmalı")

    value_column = params["value_column"]
    aggfunc = params["aggfunc"]

    # Optional date filtering
    date_column = params.get("date_column")
    start_date = params.get("start_date")
    end_date = params.get("end_date")

    # Kontrol: group_columns ve value_column df'de var mı?
    missing_cols = [col for col in group_columns + [value_column] if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Veride eksik sütunlar: {missing_cols}")

    # Tarih filtresi varsa uygula
    if date_column:
        if date_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"'{date_column}' sütunu veri içinde yok")
        df[date_column] = pd.to_datetime(df[date_column], dayfirst=True, errors="coerce")
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date, dayfirst=True)
                df = df[df[date_column] >= start_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="start_date geçerli tarih değil")
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date, dayfirst=True)
                df = df[df[date_column] <= end_dt]
            except Exception:
                raise HTTPException(status_code=400, detail="end_date geçerli tarih değil")

    # value_column sayısal olmalı
    df[value_column] = pd.to_numeric(df[value_column], errors="coerce")
    df = df.dropna(subset=group_columns + [value_column])
    if df.empty:
        raise HTTPException(status_code=400, detail="Filtreleme sonrası veri boş")

    # aggfunc kontrolü
    allowed_aggfuncs = ["sum", "mean", "count", "min", "max", "median"]
    if aggfunc not in allowed_aggfuncs:
        raise HTTPException(status_code=400, detail=f"aggfunc '{aggfunc}' desteklenmiyor")

    # Pivot table oluştur
    try:
        pivot = pd.pivot_table(
            df,
            index=group_columns,
            values=value_column,
            aggfunc=aggfunc,
            fill_value=0,
            dropna=False
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Pivot oluşturulurken hata: {str(e)}")

    # Özet bilgisi
    summary = {
        "group_levels": len(group_columns),
        "group_columns": group_columns,
        "value_column": value_column,
        "aggfunc": aggfunc,
        "rows": len(pivot),
        "original_rows": len(df),
    }
    
    # Python kod özeti
    group_cols_str = ', '.join([f"'{c}'" for c in group_columns])
    technical_details = {
        "scenario": "pivot_multi_level",
        "parameters": {
            "group_columns": group_columns,
            "value_column": value_column,
            "aggfunc": aggfunc
        },
        "stats": {
            "group_levels": len(group_columns),
            "output_rows": len(pivot),
            "original_rows": len(df)
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Çok seviyeli pivot tablo
pivot = pd.pivot_table(
    df,
    index=[{group_cols_str}],
    values='{value_column}',
    aggfunc='{aggfunc}',
    fill_value=0
)

# Sonuç: {len(pivot)} satır ({len(group_columns)} gruplama seviyesi)
pivot.to_excel('pivot_result.xlsx')
```"""
    }

    # Excel dosyası oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pivot.to_excel(writer, sheet_name="MultiLevelSummary")
        # Özet bilgiyi dataframe olarak yaz
        summary_df = pd.DataFrame(list(summary.items()), columns=["Key", "Value"])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot.reset_index(),
        "excel_bytes": output,
        "excel_filename": "multi_level_summary.xlsx"
    }