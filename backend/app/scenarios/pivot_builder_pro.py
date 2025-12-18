"""
Pivot Builder PRO - Gelişmiş Pivot Tablo Oluşturucu
Advanced Pivot Table Builder

Excel Pivot Table mantığı ile çalışan, kullanıcı dostu ayrı senaryo.
Oyun Hamuru PRO'dan bağımsız, daha basit UI için optimize edilmiş.

Features / Özellikler:
- Satır alanları (Row fields)
- Sütun alanları (Column fields)  
- Değer alanları (Value fields) with multiple aggregations
- Grand Total / Subtotals
- Percentage of Total calculations
- Multi-value pivot support

Author: opradox Team
"""

import pandas as pd
import numpy as np
from io import BytesIO
from typing import Any, Dict, List, Optional
from fastapi import HTTPException


def resolve_column(df: pd.DataFrame, col_ref: str) -> Optional[str]:
    """Kullanıcı girdisini dataframe sütun adına çevirir."""
    if not col_ref:
        return None
    s = str(col_ref).strip()
    
    # Tam eşleşme
    if s in df.columns:
        return s
    
    # Excel Harfi (A, B, AA...)
    if s.isalpha() and len(s) <= 3:
        col_idx = 0
        for char in s.upper():
            col_idx = col_idx * 26 + (ord(char) - ord('A') + 1)
        col_idx -= 1
        if 0 <= col_idx < len(df.columns):
            return df.columns[col_idx]
    
    return None


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pivot Builder PRO - Ana çalıştırma fonksiyonu
    
    params:
        rows: ["Sütun1", "Sütun2"] - Satır alanları
        columns: ["Sütun3"] - Sütun alanları (opsiyonel)
        values: [{"column": "Değer", "aggfunc": "sum", "alias": "Toplam"}] - Değer alanları
        show_totals: True/False - Grand Total göster
        show_percentage: True/False - Yüzde hesapla
        fill_value: 0 - Boş hücreleri doldur
    """
    
    # Parametreleri al
    rows = params.get("rows", [])
    columns = params.get("columns", [])
    values_config = params.get("values", [])
    show_totals = params.get("show_totals", True)
    show_percentage = params.get("show_percentage", False)
    fill_value = params.get("fill_value", 0)
    
    # Listeye çevir (string gelirse)
    if isinstance(rows, str):
        rows = [r.strip() for r in rows.split(",")]
    if isinstance(columns, str):
        columns = [c.strip() for c in columns.split(",") if c.strip()]
    
    # Sütunları çöz
    resolved_rows = [resolve_column(df, r) for r in rows]
    resolved_rows = [r for r in resolved_rows if r and r in df.columns]
    
    resolved_columns = [resolve_column(df, c) for c in columns]
    resolved_columns = [c for c in resolved_columns if c and c in df.columns]
    
    if not resolved_rows:
        raise HTTPException(
            status_code=400, 
            detail="En az bir satır alanı (rows) seçmelisiniz. Mevcut sütunlar: " + ", ".join(df.columns[:10].tolist())
        )
    
    # Değer sütunları ve aggregation fonksiyonları
    values = []
    aggfuncs = {}
    value_aliases = {}
    
    # UI'dan gelen basit format: values = "Kontenjan" (string), aggfunc = "sum"
    # veya gelişmiş format: values = [{"column": "X", "aggfunc": "sum"}]
    
    # Ayrı aggfunc parametresi varsa (UI'dan)
    ui_aggfunc = params.get("aggfunc", "sum")
    
    # Values string ise
    if isinstance(values_config, str) and values_config.strip():
        col = resolve_column(df, values_config.strip())
        if col and col in df.columns:
            values.append(col)
            aggfuncs[col] = ui_aggfunc
    elif isinstance(values_config, list):
        for vc in values_config:
            if isinstance(vc, str):
                # Basit format: sadece sütun adı
                col = resolve_column(df, vc)
                if col and col in df.columns:
                    values.append(col)
                    aggfuncs[col] = ui_aggfunc
            elif isinstance(vc, dict):
                col = resolve_column(df, vc.get("column"))
                if col and col in df.columns:
                    values.append(col)
                    aggfuncs[col] = vc.get("aggfunc", ui_aggfunc)
                    if vc.get("alias"):
                        value_aliases[col] = vc.get("alias")
    
    if not values:
        # Değer yoksa ilk sayısal sütunu kullan
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            values = [numeric_cols[0]]
            aggfuncs = {numeric_cols[0]: "sum"}
        else:
            # Sayısal sütun yoksa count yap
            values = [resolved_rows[0]]
            aggfuncs = {resolved_rows[0]: "count"}
    
    # Pivot tablo oluştur
    try:
        pivot_df = pd.pivot_table(
            df,
            index=resolved_rows,
            columns=resolved_columns if resolved_columns else None,
            values=values,
            aggfunc=aggfuncs,
            margins=show_totals,
            margins_name="Toplam",
            fill_value=fill_value
        )
        
        # MultiIndex'i düzleştir
        if isinstance(pivot_df.columns, pd.MultiIndex):
            pivot_df.columns = ['_'.join(map(str, col)).strip('_') for col in pivot_df.columns.values]
        
        pivot_df = pivot_df.reset_index()
        
        # Yüzde hesapla
        if show_percentage:
            numeric_cols = pivot_df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                total = pivot_df[col].sum()
                if total != 0:
                    pivot_df[f"{col}_Yüzde"] = (pivot_df[col] / total * 100).round(2)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pivot tablo oluşturulurken hata: {str(e)}")
    
    # Excel çıktısı oluştur
    output = BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        pivot_df.to_excel(writer, index=False, sheet_name="Pivot")
        
        workbook = writer.book
        worksheet = writer.sheets["Pivot"]
        
        # Başlık satırını dondur
        worksheet.freeze_panes(1, 0)
        
        # Başlık stili
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        for col_idx, col_name in enumerate(pivot_df.columns):
            worksheet.write(0, col_idx, col_name, header_format)
        
        # Sütun genişlikleri
        for idx, col in enumerate(pivot_df.columns):
            max_len = max(len(str(col)), pivot_df[col].astype(str).str.len().max() or 10)
            worksheet.set_column(idx, idx, min(max_len + 2, 50))
        
        # Toplam satırını vurgula
        if show_totals:
            total_format = workbook.add_format({
                'bold': True,
                'bg_color': '#E2EFDA',
                'border': 1
            })
            last_row = len(pivot_df)
            for col_idx in range(len(pivot_df.columns)):
                cell_value = pivot_df.iloc[-1, col_idx]
                worksheet.write(last_row, col_idx, cell_value, total_format)
    
    output.seek(0)
    
    # Özet bilgi
    summary = {
        "Satır Alanları": ", ".join(resolved_rows),
        "Sütun Alanları": ", ".join(resolved_columns) if resolved_columns else "Yok",
        "Değer Alanları": ", ".join(values),
        "Sonuç Satır Sayısı": len(pivot_df),
        "Sonuç Sütun Sayısı": len(pivot_df.columns),
        "Grand Total": "Evet" if show_totals else "Hayır",
        "Yüzde Hesaplama": "Evet" if show_percentage else "Hayır"
    }
    
    # Python kod özeti
    agg_str = str(aggfuncs).replace("'", '"')
    technical_details = {
        "scenario": "pivot_builder_pro",
        "parameters": {
            "rows": resolved_rows,
            "columns": resolved_columns,
            "values": values,
            "aggfuncs": aggfuncs
        },
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosyaniz.xlsx')

# Pivot Tablo Oluştur
pivot = pd.pivot_table(
    df,
    index={resolved_rows},
    columns={resolved_columns if resolved_columns else None},
    values={values},
    aggfunc={agg_str},
    margins={show_totals},
    margins_name="Toplam",
    fill_value={fill_value}
)

pivot = pivot.reset_index()
pivot.to_excel('pivot_sonuc.xlsx', index=False)
```"""
    }
    
    return {
        "summary": summary,
        "technical_details": technical_details,
        "df_out": pivot_df,
        "excel_bytes": output,
        "excel_filename": "pivot_builder_pro_sonuc.xlsx"
    }
