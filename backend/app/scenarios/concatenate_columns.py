
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    raw_cols = params.get("columns", "")
    separator = params.get("separator", " ")
    
    # İkinci dosya/sayfa desteği
    df2 = params.get("df2") or params.get("lookup_df")
    
    # Ayırıcı anahtar kelimelerini temizle
    if separator.strip().lower() == "boşluk": separator = " "
    if separator.strip().lower() == "virgül": separator = ","
    if separator.strip().lower() == "tire": separator = "-"

    cols = [c.strip() for c in raw_cols.split(",") if c.strip()]
    
    if not cols:
        raise HTTPException(status_code=400, detail="Birleştirilecek sütunları giriniz.")
    
    # Her sütun için hangi dataframe'in kullanılacağını belirle
    # df2 varsa ve sütun df2'de ama df'de yoksa, df2'den al
    working_df = df.copy()
    
    if df2 is not None and isinstance(df2, pd.DataFrame):
        # df2 sütunlarını working_df'e ekle (çakışma varsa sonuna _file2 ekle)
        for col in df2.columns:
            if col in working_df.columns:
                working_df[f"{col}_file2"] = df2[col].values[:len(working_df)] if len(df2) >= len(working_df) else df2[col].reindex(working_df.index).values
            else:
                working_df[col] = df2[col].values[:len(working_df)] if len(df2) >= len(working_df) else df2[col].reindex(working_df.index).values
    
    missing = [c for c in cols if c not in working_df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Sütunlar bulunamadı: {missing}")

    # Birleştirme işlemi
    new_col_name = "Birleştirilmiş_" + "_".join(cols[:2])
    
    try:
        # Hepsini string'e çevir ve birleştir
        working_df[new_col_name] = working_df[cols].astype(str).agg(separator.join, axis=1)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hata: {str(e)}")

    row_count = len(working_df)
    preview = working_df.head(20).to_markdown(index=False)
    
    # Python kod özeti
    cols_str = ', '.join([f"'{c}'" for c in cols])
    technical_details = {
        "scenario": "concatenate_columns",
        "parameters": {
            "columns": cols,
            "separator": separator,
            "new_column_name": new_col_name
        },
        "stats": {
            "columns_merged": len(cols),
            "rows_affected": row_count
        },
        "python_code": f"""```python
import pandas as pd

# Dosyayı oku
df = pd.read_excel('dosya.xlsx')

# Sütunları birleştir: {cols}
columns_to_merge = [{cols_str}]
df['{new_col_name}'] = df[columns_to_merge].astype(str).agg('{separator}'.join, axis=1)

# Sonucu kaydet
df.to_excel('concatenated_result.xlsx', index=False)
```"""
    }

    return {
        "summary": "Sütun birleştirme tamamlandı.",
        "markdown_result": f"**Sonuç:** {cols} sütunları '{separator}' ile birleştirildi.\n\n### Önizleme\n\n{preview}",
        "technical_details": technical_details,
        "df_out": working_df
    }
