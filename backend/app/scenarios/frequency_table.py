from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import HTTPException


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Senaryo: Tek sütun için frekans tablosu.

    Beklenen params:
    - column (zorunlu): hangi sütun için frekans bakılacak
    - sort_by (opsiyonel): 'value', 'count_desc', 'count_asc'
    - return_mode (opsiyonel): 'summary' veya 'summary_and_rows'
    """
    column = params.get("column") or params.get("target_column")
    sort_by = params.get("sort_by", "count_desc")
    return_mode = params.get("return_mode", "summary")

    if not column:
        raise HTTPException(
            status_code=400,
            detail="column (veya target_column) parametresi zorunludur.",
        )

    if column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{column}' adlı sütun bulunamadı. "
                f"Mevcut sütunlar: {list(df.columns)}"
            ),
        )

    # NaN'leri de sayıya dahil ederek value_counts
    freq_series = df[column].astype("object").value_counts(dropna=False)
    freq_df = freq_series.rename("count").reset_index()
    freq_df = freq_df.rename(columns={"index": column})

    # NaN görünen satırları daha anlamlı yazalım
    freq_df[column] = freq_df[column].where(
        freq_df[column].notna(),
        other="(BOŞ)",
    )

    # Sıralama seçenekleri
    if sort_by == "value":
        freq_df = freq_df.sort_values(by=column, ascending=True)
    elif sort_by == "count_asc":
        freq_df = freq_df.sort_values(by="count", ascending=True)
    else:  # default: count_desc
        freq_df = freq_df.sort_values(by="count", ascending=False)

    total_rows = int(len(df))
    distinct_values = int(len(freq_df))
    top_value = None
    if not freq_df.empty:
        top_row = freq_df.iloc[0]
        top_value = {
            "value": top_row[column],
            "count": int(top_row["count"]),
        }

    summary = {
        "scenario": "frequency_table_single_column",
        "column": column,
        "total_rows": total_rows,
        "distinct_values": distinct_values,
        "top_value": top_value,
        "sort_by": sort_by,
    }
    
    # Python kod özeti
    technical_details = {
        "scenario": "frequency_table",
        "parameters": {
            "column": column,
            "sort_by": sort_by
        },
        "stats": {
            "total_rows": total_rows,
            "distinct_values": distinct_values,
            "top_value": top_value
        },
        "python_code": f"""```python
import pandas as pd

# Dosyayı oku
df = pd.read_excel('dosya.xlsx')

# Frekans tablosu: '{column}' sütunu
freq_df = df['{column}'].value_counts(dropna=False).reset_index()
freq_df.columns = ['{column}', 'count']

# Sırala: {sort_by}
freq_df = freq_df.sort_values('count', ascending={sort_by == 'count_asc'})

# Sonuç: {distinct_values} benzersiz değer, {total_rows} toplam satır
freq_df.to_excel('frequency_result.xlsx', index=False)
```"""
    }

    if return_mode == "summary":
        return {
            "summary": summary,
            "technical_details": technical_details,
            "df_out": freq_df,
            "excel_bytes": None,
            "excel_filename": None,
        }

    # Excel çıktısı: frekans tablosu + özet sayfası
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        freq_df.to_excel(writer, index=False, sheet_name="Frequency")
        pd.DataFrame([summary]).to_excel(writer, index=False, sheet_name="Summary")

    output.seek(0)

    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": freq_df,
        "excel_bytes": output,
        "excel_filename": "opradox_frequency_table_single_column.xlsx",
    }
