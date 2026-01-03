from io import BytesIO
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from fastapi import HTTPException


def _ensure_list(v: Any) -> List[str]:
    if isinstance(v, list):
        return [str(x) for x in v]
    else:
        return [str(v)]


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo: Temel istatistik özetleri.

    Beklenen params:
    - numeric_columns / columns / column  (biri yeterli)
    - return_mode
    """
    cols_param = (
        params.get("numeric_columns")
        or params.get("columns")
        or params.get("column")
    )

    # cols_param boşsa tüm numeric sütunları kullan
    if cols_param is None:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            columns = numeric_cols
        else:
            raise HTTPException(
                status_code=400,
                detail="Sayısal sütun bulunamadı. Lütfen numeric_columns belirtin.",
            )
    else:
        columns = _ensure_list(cols_param)

    missing_cols = [c for c in columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Aşağıdaki sütun(lar) bulunamadı: {missing_cols}. "
                f"Mevcut sütunlar: {list(df.columns)[:10]}"
            ),
        )

    metrics = ["count", "mean", "median", "min", "max", "std"]
    stats_rows = []

    for col in columns:
        series = pd.to_numeric(df[col], errors="coerce")

        stats_rows.append(
            {
                "column": col,
                "count": int(series.count()),
                "mean": float(series.mean()) if series.count() > 0 else np.nan,
                "median": float(series.median()) if series.count() > 0 else np.nan,
                "min": float(series.min()) if series.count() > 0 else np.nan,
                "max": float(series.max()) if series.count() > 0 else np.nan,
                "std": float(series.std(ddof=1)) if series.count() > 1 else np.nan,
            }
        )

    stats_df = pd.DataFrame(stats_rows, columns=["column"] + metrics)

    summary = {
        "scenario": "basic_descriptive_stats",
        "columns": columns,
        "n_columns": len(columns),
    }
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in columns])
    technical_details = {
        "scenario": "descriptive_stats",
        "parameters": {"columns": columns},
        "stats": {"n_columns": len(columns), "metrics": metrics},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Seçilen sütunlar için temel istatistikler
columns = [{cols_str}]
stats = df[columns].describe()

print(stats)
# count, mean, std, min, 25%, 50%, 75%, max
```"""
    }

    return_mode = params.get("return_mode", "summary")

    if return_mode == "summary":
        # JSON'da istatistik tablosunu da döndürelim
        summary["stats_table"] = stats_rows
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": stats_df,
            "excel_bytes": None,
            "excel_filename": None,
        }

    # Excel çıktısı: Stats sayfası + Info sayfası
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        stats_df.to_excel(writer, index=False, sheet_name="Stats")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Info")

    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": stats_df,
        "excel_bytes": output,
        "excel_filename": "opradox_basic_descriptive_stats.xlsx",
    }
