
import pandas as pd
from fastapi import HTTPException

def run(df: pd.DataFrame, params: dict) -> dict:

    # Yeni parametreler (dropdown tabanlı)
    column1 = params.get("column1", "").strip()
    column2 = params.get("column2", "").strip()
    separator = params.get("separator", " ")
    data_source = params.get("data_source", "primary")
    
    # Eski parametre (backward compatibility)
    raw_cols = params.get("columns", "")
    
    # İkinci dosya/sayfa desteği
    df2 = params.get("df2") or params.get("lookup_df")
    
    # Ayırıcı anahtar kelimelerini temizle
    if separator.strip().lower() == "boşluk": separator = " "
    if separator.strip().lower() == "virgül": separator = ","
    if separator.strip().lower() == "tire": separator = "-"

    # Sütun listesini belirle
    if column1 and column2:
        # Yeni format: dropdown tabanlı
        cols = [column1, column2]
    elif raw_cols:
        # Eski format: virgülle ayrılmış metin
        cols = [c.strip() for c in raw_cols.split(",") if c.strip()]
    else:
        raise HTTPException(status_code=400, detail="Birleştirilecek sütunları giriniz.")
    
    if len(cols) < 2:
        raise HTTPException(status_code=400, detail="En az 2 sütun seçilmelidir.")
    
    # DataFrame seçimi: column2 için data_source'a göre
    working_df = df.copy()
    
    if df2 is not None and isinstance(df2, pd.DataFrame):
        if data_source == "secondary":
            # İkinci sütun df2'den alınacak
            if column2 not in df2.columns:
                raise HTTPException(status_code=400, detail=f"'{column2}' sütunu ikinci dosyada bulunamadı. Mevcut sütunlar: {list(df2.columns)}")
            # df2'den column2'yi working_df'e ekle
            working_df[column2] = df2[column2].values[:len(working_df)] if len(df2) >= len(working_df) else df2[column2].reindex(working_df.index).values
        else:
            # Eski mantık: df2 sütunlarını working_df'e ekle (çakışma varsa sonuna _file2 ekle)
            for col in df2.columns:
                if col in working_df.columns:
                    working_df[f"{col}_file2"] = df2[col].values[:len(working_df)] if len(df2) >= len(working_df) else df2[col].reindex(working_df.index).values
                else:
                    working_df[col] = df2[col].values[:len(working_df)] if len(df2) >= len(working_df) else df2[col].reindex(working_df.index).values
    
    # column1 ana dosyada olmalı
    if column1 and column1 not in working_df.columns:
        raise HTTPException(status_code=400, detail=f"'{column1}' sütunu ana dosyada bulunamadı. Mevcut sütunlar: {list(df.columns)}")
    
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
