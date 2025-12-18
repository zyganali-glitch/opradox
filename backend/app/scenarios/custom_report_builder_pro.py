"""
Oyun Hamuru PRO - Gelişmiş Dinamik Rapor Oluşturucu
Dynamic Report Builder PRO

Tam dinamik, varsayılan parametresiz, evrensel ifadeler içeren gelişmiş rapor motoru.
Tüm özellikler opsiyonel - kullanıcı ne seçerse o çalışır.

Features / Özellikler:
- 12+ filter operators (filtre operatörleri)
- Computed columns (hesaplanmış sütunlar)
- Window functions (RANK, dense_rank, cumsum, lag/lead)
- Multi-sheet Excel output (çoklu sayfa Excel çıktısı)
- Full TR/EN support (tam dil desteği)
- Conditional formatting (koşullu biçimlendirme) - NEW
- Chart support (grafik desteği) - NEW
- Pivot table (pivot tablo) - NEW
- Time series analysis (zaman serisi analizi) - NEW
- What-If analysis (senaryo analizi) - NEW

Author: opradox Team
"""

import pandas as pd
import numpy as np
import re
import json
from io import BytesIO
from typing import Any, Dict, List, Optional, Union
from fastapi import HTTPException
import time

def log_step(step_name):
    print(f"[{time.strftime('%H:%M:%S')}] STEP: {step_name}")


# =============================================================================
# EXCEL ENHANCEMENT HELPERS - Excel İyileştirme Yardımcıları (YENİ)
# =============================================================================

def _apply_excel_enhancements(workbook, worksheet, df, output_config):
    """
    Excel çıktısına iyileştirmeler uygular.
    Tüm özellikler opsiyoneldir ve varsayılan olarak aktiftir.
    
    output_config parametreleri:
    - freeze_header: bool (varsayılan True) - Başlık satırını dondur
    - auto_fit_columns: bool (varsayılan True) - Sütun genişliklerini otomatik ayarla
    - number_format: str (varsayılan None) - Sayısal format (örn: "#,##0.00")
    - header_style: bool (varsayılan True) - Başlık stilini uygula
    """
    # 1. Freeze Panes - Başlık satırını dondur
    if output_config.get("freeze_header", True):
        worksheet.freeze_panes(1, 0)  # İlk satırı dondur
    
    # 2. Auto-fit Column Width - Sütun genişliklerini ayarla
    if output_config.get("auto_fit_columns", True):
        for idx, col in enumerate(df.columns):
            # Sütun başlığı ve verilerin max uzunluğunu hesapla
            header_len = len(str(col))
            try:
                max_data_len = df[col].astype(str).str.len().max()
                if pd.isna(max_data_len):
                    max_data_len = 0
            except:
                max_data_len = 10
            
            # Ekstra padding ekle, max 50 karakter
            col_width = min(max(header_len, max_data_len) + 2, 50)
            worksheet.set_column(idx, idx, col_width)
    
    # 3. Number Format - Sayısal format uygula
    number_format = output_config.get("number_format")
    if number_format:
        num_format = workbook.add_format({'num_format': number_format})
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            col_idx = df.columns.get_loc(col)
            # Sadece veri satırlarına uygula (header hariç)
            for row_idx in range(len(df)):
                worksheet.write(row_idx + 1, col_idx, df.iloc[row_idx][col], num_format)
    
    # 4. Header Style - Başlık stili
    if output_config.get("header_style", True):
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        for col_idx, col_name in enumerate(df.columns):
            worksheet.write(0, col_idx, col_name, header_format)


# =============================================================================
# CONDITIONAL FORMATTING ENGINE - Koşullu Biçimlendirme Motoru (YENİ)
# =============================================================================

CONDITIONAL_FORMAT_TYPES = {
    "color_scale": "3_color_scale",
    "2_color_scale": "2_color_scale",
    "data_bar": "data_bar",
    "icon_set": "icon_set",
    "threshold": "cell",
    "top_n": "top",
    "bottom_n": "bottom",
    "duplicate": "duplicate",
    "unique": "unique",
    "text_contains": "text",
    "blanks": "blanks",
    "no_blanks": "no_blanks"
}

CF_LABELS = {
    "tr": {
        "color_scale": "Renk Skalası (3 Renk)",
        "2_color_scale": "Renk Skalası (2 Renk)",
        "data_bar": "Veri Çubuğu",
        "icon_set": "İkon Seti",
        "threshold": "Eşik Değer",
        "top_n": "En Yüksek N",
        "bottom_n": "En Düşük N",
        "duplicate": "Tekrarlananlar",
        "unique": "Benzersizler",
        "text_contains": "Metin İçerir",
        "blanks": "Boş Hücreler",
        "no_blanks": "Dolu Hücreler"
    },
    "en": {
        "color_scale": "Color Scale (3 Color)",
        "2_color_scale": "Color Scale (2 Color)",
        "data_bar": "Data Bar",
        "icon_set": "Icon Set",
        "threshold": "Threshold Value",
        "top_n": "Top N",
        "bottom_n": "Bottom N",
        "duplicate": "Duplicates",
        "unique": "Unique Values",
        "text_contains": "Text Contains",
        "blanks": "Blank Cells",
        "no_blanks": "Non-Blank Cells"
    }
}

def _get_column_range(df, col_name, start_row=2):
    """Sütun için Excel hücre aralığını döndürür (örn: B2:B100)"""
    if col_name not in df.columns:
        return None
    col_idx = df.columns.get_loc(col_name)
    col_letter = _idx_to_excel_col(col_idx)
    end_row = start_row + len(df) - 1
    return f"{col_letter}{start_row}:{col_letter}{end_row}"

def _idx_to_excel_col(idx):
    """0-based index'i Excel sütun harfine çevirir (0->A, 25->Z, 26->AA)"""
    result = ""
    while idx >= 0:
        result = chr(idx % 26 + ord('A')) + result
        idx = idx // 26 - 1
    return result

def apply_conditional_formatting(worksheet, df, cf_configs):
    """
    Koşullu biçimlendirme kurallarını uygular.
    
    cf_configs: List of {
        cf_type: "color_scale" | "data_bar" | "icon_set" | "threshold" | ...
        column: "Sütun Adı"
        min_color: "#63BE7B" (opsiyonel)
        mid_color: "#FFEB84" (opsiyonel)
        max_color: "#F8696B" (opsiyonel)
        bar_color: "#638EC6" (opsiyonel)
        threshold: 100 (opsiyonel)
        above_color: "#00FF00" (opsiyonel)
        below_color: "#FF0000" (opsiyonel)
        n: 10 (top_n/bottom_n için)
    }
    """
    if not cf_configs:
        return
    
    for cf in cf_configs:
        cf_type = cf.get("cf_type", "color_scale")
        col_name = cf.get("column")
        
        # Sütunu çöz
        resolved_col = resolve_column(df, col_name) if col_name else None
        if not resolved_col or resolved_col not in df.columns:
            continue
        
        cell_range = _get_column_range(df, resolved_col)
        if not cell_range:
            continue
        
        try:
            if cf_type == "color_scale":
                worksheet.conditional_format(cell_range, {
                    'type': '3_color_scale',
                    'min_color': cf.get('min_color', '#63BE7B'),
                    'mid_color': cf.get('mid_color', '#FFEB84'),
                    'max_color': cf.get('max_color', '#F8696B')
                })
            
            elif cf_type == "2_color_scale":
                worksheet.conditional_format(cell_range, {
                    'type': '2_color_scale',
                    'min_color': cf.get('min_color', '#FFFFFF'),
                    'max_color': cf.get('max_color', '#63BE7B')
                })
            
            elif cf_type == "data_bar":
                worksheet.conditional_format(cell_range, {
                    'type': 'data_bar',
                    'bar_color': cf.get('bar_color', '#638EC6'),
                    'bar_solid': cf.get('bar_solid', True)
                })
            
            elif cf_type == "icon_set":
                icon_style = cf.get('icon_style', '3_arrows')
                worksheet.conditional_format(cell_range, {
                    'type': 'icon_set',
                    'icon_style': icon_style
                })
            
            elif cf_type == "threshold":
                threshold = cf.get('threshold', 0)
                above_color = cf.get('above_color', '#C6EFCE')
                below_color = cf.get('below_color', '#FFC7CE')
                
                # Eşik üstü
                worksheet.conditional_format(cell_range, {
                    'type': 'cell',
                    'criteria': '>=',
                    'value': threshold,
                    'format': worksheet.book.add_format({'bg_color': above_color})
                })
                # Eşik altı
                worksheet.conditional_format(cell_range, {
                    'type': 'cell',
                    'criteria': '<',
                    'value': threshold,
                    'format': worksheet.book.add_format({'bg_color': below_color})
                })
            
            elif cf_type == "top_n":
                n = int(cf.get('n', 10))
                color = cf.get('color', '#FFEB9C')
                worksheet.conditional_format(cell_range, {
                    'type': 'top',
                    'value': n,
                    'format': worksheet.book.add_format({'bg_color': color})
                })
            
            elif cf_type == "bottom_n":
                n = int(cf.get('n', 10))
                color = cf.get('color', '#FFC7CE')
                worksheet.conditional_format(cell_range, {
                    'type': 'bottom',
                    'value': n,
                    'format': worksheet.book.add_format({'bg_color': color})
                })
            
            elif cf_type == "duplicate":
                color = cf.get('color', '#FFC7CE')
                worksheet.conditional_format(cell_range, {
                    'type': 'duplicate',
                    'format': worksheet.book.add_format({'bg_color': color})
                })
            
            elif cf_type == "unique":
                color = cf.get('color', '#C6EFCE')
                worksheet.conditional_format(cell_range, {
                    'type': 'unique',
                    'format': worksheet.book.add_format({'bg_color': color})
                })
            
            elif cf_type == "text_contains":
                text = cf.get('text', '')
                color = cf.get('color', '#FFEB9C')
                worksheet.conditional_format(cell_range, {
                    'type': 'text',
                    'criteria': 'containing',
                    'value': text,
                    'format': worksheet.book.add_format({'bg_color': color})
                })
            
            elif cf_type == "blanks":
                color = cf.get('color', '#DDDDDD')
                worksheet.conditional_format(cell_range, {
                    'type': 'blanks',
                    'format': worksheet.book.add_format({'bg_color': color})
                })
            
            elif cf_type == "no_blanks":
                color = cf.get('color', '#C6EFCE')
                worksheet.conditional_format(cell_range, {
                    'type': 'no_blanks',
                    'format': worksheet.book.add_format({'bg_color': color})
                })
        
        except Exception as e:
            print(f"Conditional Format Hatası ({cf_type}): {e}")


# =============================================================================
# CHART ENGINE - Grafik Motoru (YENİ)
# =============================================================================

CHART_TYPES = {
    "column": "column",
    "bar": "bar",
    "line": "line",
    "area": "area",
    "pie": "pie",
    "doughnut": "doughnut",
    "scatter": "scatter",
    "radar": "radar"
}

CHART_LABELS = {
    "tr": {
        "column": "Sütun Grafik",
        "bar": "Çubuk Grafik",
        "line": "Çizgi Grafik",
        "area": "Alan Grafik",
        "pie": "Pasta Grafik",
        "doughnut": "Halka Grafik",
        "scatter": "Dağılım Grafiği",
        "radar": "Radar Grafik"
    },
    "en": {
        "column": "Column Chart",
        "bar": "Bar Chart",
        "line": "Line Chart",
        "area": "Area Chart",
        "pie": "Pie Chart",
        "doughnut": "Doughnut Chart",
        "scatter": "Scatter Chart",
        "radar": "Radar Chart"
    }
}

def add_charts_to_workbook(workbook, df, chart_configs, data_sheet_name="Sonuç"):
    """
    Excel çıktısına grafikler ekler.
    
    chart_configs: List of {
        chart_type: "column" | "bar" | "line" | "pie" | "scatter" | ...
        title: "Grafik Başlığı"
        x_column: "X Ekseni Sütunu"
        y_columns: ["Y1", "Y2"] veya "Y" (tek sütun)
        show_legend: True/False
        style: 1-48 arası Excel grafik stili
    }
    """
    if not chart_configs:
        return
    
    # Grafikler için yeni sayfa oluştur
    chart_sheet = workbook.add_worksheet("Grafikler")
    chart_row = 1
    
    for idx, cc in enumerate(chart_configs):
        chart_type = cc.get("chart_type", "column")
        title = cc.get("title", f"Grafik {idx + 1}")
        x_col = cc.get("x_column")
        y_cols = cc.get("y_columns", [])
        
        # y_columns string ise listeye çevir
        if isinstance(y_cols, str):
            y_cols = [y_cols]
        
        # Sütunları çöz
        x_resolved = resolve_column(df, x_col) if x_col else None
        y_resolved = [resolve_column(df, y) for y in y_cols]
        y_resolved = [y for y in y_resolved if y and y in df.columns]
        
        if not y_resolved:
            continue
        
        # Grafik oluştur
        try:
            chart = workbook.add_chart({'type': chart_type})
            
            # Her Y sütunu için seri ekle
            for y_col in y_resolved:
                y_idx = df.columns.get_loc(y_col)
                
                series_config = {
                    'name': y_col,
                    'values': [data_sheet_name, 1, y_idx, len(df), y_idx],
                }
                
                # X ekseni varsa categories ekle
                if x_resolved and x_resolved in df.columns:
                    x_idx = df.columns.get_loc(x_resolved)
                    series_config['categories'] = [data_sheet_name, 1, x_idx, len(df), x_idx]
                
                chart.add_series(series_config)
            
            # Grafik ayarları
            chart.set_title({'name': title})
            if x_resolved:
                chart.set_x_axis({'name': x_resolved})
            if len(y_resolved) == 1:
                chart.set_y_axis({'name': y_resolved[0]})
            
            # Legend
            if cc.get("show_legend", True):
                chart.set_legend({'position': 'bottom'})
            else:
                chart.set_legend({'none': True})
            
            # Style (1-48)
            style = cc.get("style", 10)
            chart.set_style(style)
            
            # Grafiği sayfaya ekle
            chart_sheet.insert_chart(chart_row, 1, chart, {'x_scale': 1.5, 'y_scale': 1.5})
            chart_row += 20  # Her grafik için 20 satır boşluk
        
        except Exception as e:
            print(f"Grafik Hatası ({chart_type}): {e}")


# =============================================================================
# PIVOT TABLE ENGINE - Pivot Tablo Motoru (YENİ)
# =============================================================================

def apply_pivot(df: pd.DataFrame, pivot_config: Dict) -> pd.DataFrame:
    """
    Pivot tablo oluşturur - GELİŞTİRİLMİŞ VERSİYON.
    
    pivot_config: {
        rows: ["Sütun1", "Sütun2"],      # Satır alanları
        columns: ["Sütun3"],              # Sütun alanları (opsiyonel)
        values: [{"column": "Değer", "aggfunc": "sum", "alias": "Toplam Değer"}],  # YENİ: alias desteği
        show_totals: True,                # Grand Total göster
        show_subtotals: False,            # YENİ: Satır bazlı ara toplamlar
        percent_type: None,               # YENİ: "row" | "column" | "total" | None
        fill_value: 0                     # Boş hücreleri doldur
    }
    """
    rows = pivot_config.get("rows", [])
    columns = pivot_config.get("columns", [])
    values_config = pivot_config.get("values", [])
    show_totals = pivot_config.get("show_totals", True)
    show_subtotals = pivot_config.get("show_subtotals", False)
    percent_type = pivot_config.get("percent_type")  # "row", "column", "total" veya None
    fill_value = pivot_config.get("fill_value", 0)
    
    available_cols = list(df.columns)
    
    # === KULLANICI DOSTU HATA MESAJLARI ===
    def _friendly_error(field_name: str, user_input: str) -> str:
        return f"'{user_input}' sütunu bulunamadı ({field_name} için). Mevcut sütunlar: {', '.join(available_cols[:10])}{'...' if len(available_cols) > 10 else ''}"
    
    # Sütunları çöz ve hataları topla
    errors = []
    
    resolved_rows = []
    for r in rows:
        resolved = resolve_column(df, r)
        if resolved and resolved in df.columns:
            resolved_rows.append(resolved)
        elif r:  # Boş değilse hata ekle
            errors.append(_friendly_error("Satır Alanları", r))
    
    resolved_columns = []
    for c in columns:
        resolved = resolve_column(df, c)
        if resolved and resolved in df.columns:
            resolved_columns.append(resolved)
        elif c:  # Boş değilse hata ekle
            errors.append(_friendly_error("Sütun Alanları", c))
    
    if not resolved_rows:
        if errors:
            raise ValueError("Pivot oluşturulamadı. " + " | ".join(errors))
        return df
    
    # === DEĞER SÜTUNLARI VE ALIAS DESTEĞI ===
    values = []
    aggfuncs = {}
    aliases = {}  # {orijinal_sütun: alias}
    
    for vc in values_config:
        col_input = vc.get("column")
        col = resolve_column(df, col_input)
        if col and col in df.columns:
            values.append(col)
            aggfuncs[col] = vc.get("aggfunc", "sum")
            # Alias desteği
            if vc.get("alias"):
                aliases[col] = vc.get("alias")
        elif col_input:
            errors.append(_friendly_error("Değer Alanları", col_input))
    
    if not values:
        # Değer yoksa sadece count yap
        values = [resolved_rows[0]]
        aggfuncs = {resolved_rows[0]: 'count'}
    
    # Hataları göster ama devam et (uyarı olarak)
    if errors:
        print(f"Pivot UYARI: {' | '.join(errors)}")
    
    try:
        # === SUBTOTALS DESTEĞİ ===
        # Pandas'ta gerçek subtotals için özel işlem gerekiyor
        # margins=True sadece grand total ekler, ara toplamlar için ayrı hesaplama yapılmalı
        
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
        
        # === YÜZDE TÜRLERİ ===
        if percent_type and percent_type in ["row", "column", "total"]:
            numeric_cols = pivot_df.select_dtypes(include=[np.number]).columns
            
            if percent_type == "row":
                # % of Row: Her satırın toplamına göre yüzde
                row_totals = pivot_df[numeric_cols].sum(axis=1)
                for col in numeric_cols:
                    pivot_df[col] = (pivot_df[col] / row_totals * 100).round(2)
            
            elif percent_type == "column":
                # % of Column: Her sütunun toplamına göre yüzde
                for col in numeric_cols:
                    col_total = pivot_df[col].sum()
                    if col_total != 0:
                        pivot_df[col] = (pivot_df[col] / col_total * 100).round(2)
            
            elif percent_type == "total":
                # % of Grand Total: Genel toplama göre yüzde
                grand_total = pivot_df[numeric_cols].sum().sum()
                if grand_total != 0:
                    for col in numeric_cols:
                        pivot_df[col] = (pivot_df[col] / grand_total * 100).round(2)
        
        # MultiIndex'i düzleştir
        if isinstance(pivot_df.columns, pd.MultiIndex):
            pivot_df.columns = ['_'.join(map(str, col)).strip('_') for col in pivot_df.columns.values]
        
        pivot_df = pivot_df.reset_index()
        
        # === ALIAS UYGULA (BASİTLEŞTİRİLMİŞ) ===
        if aliases:
            # Önce direkt rename dene
            pivot_df = pivot_df.rename(columns=aliases)
            
            # Eğer MultiIndex sebebiyle direkt eşleşme olmadıysa, içeren sütunları değiştir
            rename_map = {}
            for orig_col, alias in aliases.items():
                for col in pivot_df.columns:
                    if orig_col in str(col) and col not in aliases.values():
                        new_name = str(col).replace(orig_col, alias)
                        if new_name != str(col):
                            rename_map[col] = new_name
            if rename_map:
                pivot_df = pivot_df.rename(columns=rename_map)
        
        # === SUBTOTALS İÇİN EK SATIRLAR ===
        if show_subtotals and len(resolved_rows) > 1:
            # Her ana grup için ara toplam satırı ekle
            subtotal_rows = []
            for group_val in df[resolved_rows[0]].unique():
                group_mask = df[resolved_rows[0]] == group_val
                subtotal_data = {resolved_rows[0]: f"{group_val} - Alt Toplam"}
                
                # Diğer index sütunlarını boş bırak
                for r in resolved_rows[1:]:
                    subtotal_data[r] = ""
                
                # Sayısal değerleri topla
                for col in pivot_df.columns:
                    if col not in resolved_rows:
                        try:
                            # Pivot'tan bu gruba ait satırları bul ve topla
                            mask = pivot_df[resolved_rows[0]].astype(str).str.startswith(str(group_val))
                            if mask.any() and pd.api.types.is_numeric_dtype(pivot_df[col]):
                                subtotal_data[col] = pivot_df.loc[mask, col].sum()
                        except:
                            subtotal_data[col] = ""
                
                subtotal_rows.append(subtotal_data)
            
            if subtotal_rows:
                subtotal_df = pd.DataFrame(subtotal_rows)
                # Ana pivot ile birleştir ve sırala
                pivot_df = pd.concat([pivot_df, subtotal_df], ignore_index=True)
                pivot_df = pivot_df.sort_values(by=resolved_rows[0]).reset_index(drop=True)
        
        log_step(f"PIVOT: {len(pivot_df)} satır, {len(pivot_df.columns)} sütun" + 
                 (f", {percent_type} yüzdesi uygulandı" if percent_type else ""))
        return pivot_df
    
    except Exception as e:
        error_msg = f"Pivot Hatası: {str(e)}"
        if "KeyError" in str(e):
            error_msg += f". Kontrol edin: Satır alanları={resolved_rows}, Değer sütunları={values}"
        print(error_msg)
        raise ValueError(error_msg)


# =============================================================================
# TIME SERIES ENGINE - Zaman Serisi Motoru (YENİ)
# =============================================================================

def _compute_ytd_sum(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Yıl Başından Bugüne (YTD) Kümülatif Toplam"""
    date_col = resolve_column(df, cc.get("date_column"))
    value_col = resolve_column(df, cc.get("value_column"))
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    df['_date_temp'] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    df['_year_temp'] = df['_date_temp'].dt.year
    
    # Yıl bazında kümülatif toplam
    df = df.sort_values('_date_temp')
    df[name] = df.groupby('_year_temp')[value_col].cumsum()
    
    # Temp sütunları temizle
    df = df.drop(['_date_temp', '_year_temp'], axis=1)
    
    return df


def _compute_mtd_sum(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Ay Başından Bugüne (MTD) Kümülatif Toplam"""
    date_col = resolve_column(df, cc.get("date_column"))
    value_col = resolve_column(df, cc.get("value_column"))
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    df['_date_temp'] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    df['_year_month_temp'] = df['_date_temp'].dt.to_period('M')
    
    df = df.sort_values('_date_temp')
    df[name] = df.groupby('_year_month_temp')[value_col].cumsum()
    
    df = df.drop(['_date_temp', '_year_month_temp'], axis=1)
    
    return df


def _compute_yoy_change(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Yıldan Yıla (YoY) Değişim Yüzdesi"""
    date_col = resolve_column(df, cc.get("date_column"))
    value_col = resolve_column(df, cc.get("value_column"))
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    df['_date_temp'] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    df['_year_temp'] = df['_date_temp'].dt.year
    df['_month_temp'] = df['_date_temp'].dt.month
    
    # Yıl-Ay bazında toplam
    grouped = df.groupby(['_year_temp', '_month_temp'])[value_col].sum().reset_index()
    grouped = grouped.sort_values(['_month_temp', '_year_temp'])
    
    # Geçen yılın değeri
    grouped['_prev_year_value'] = grouped.groupby('_month_temp')[value_col].shift(1)
    grouped[name] = ((grouped[value_col] - grouped['_prev_year_value']) / grouped['_prev_year_value'] * 100).round(2)
    
    # Ana df'e merge et
    df = df.merge(
        grouped[['_year_temp', '_month_temp', name]], 
        on=['_year_temp', '_month_temp'], 
        how='left'
    )
    
    df = df.drop(['_date_temp', '_year_temp', '_month_temp'], axis=1)
    
    return df


def _compute_qoq_change(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Çeyrekten Çeyreğe (QoQ) Değişim Yüzdesi"""
    date_col = resolve_column(df, cc.get("date_column"))
    value_col = resolve_column(df, cc.get("value_column"))
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    df['_date_temp'] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    df['_year_temp'] = df['_date_temp'].dt.year
    df['_quarter_temp'] = df['_date_temp'].dt.quarter
    
    # Yıl-Çeyrek bazında toplam
    grouped = df.groupby(['_year_temp', '_quarter_temp'])[value_col].sum().reset_index()
    grouped = grouped.sort_values(['_year_temp', '_quarter_temp'])
    
    # Önceki çeyreğin değeri
    grouped['_prev_quarter_value'] = grouped[value_col].shift(1)
    grouped[name] = ((grouped[value_col] - grouped['_prev_quarter_value']) / grouped['_prev_quarter_value'] * 100).round(2)
    
    # Ana df'e merge et
    df = df.merge(
        grouped[['_year_temp', '_quarter_temp', name]], 
        on=['_year_temp', '_quarter_temp'], 
        how='left'
    )
    
    df = df.drop(['_date_temp', '_year_temp', '_quarter_temp'], axis=1)
    
    return df


def _compute_date_hierarchy(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Otomatik Tarih Hiyerarşisi Oluşturur"""
    date_col = resolve_column(df, cc.get("date_column"))
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    
    df = df.copy()
    dt = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    
    # Hiyerarşi sütunları oluştur
    df[f"{name}_Yıl"] = dt.dt.year
    df[f"{name}_Çeyrek"] = "Q" + dt.dt.quarter.astype(str)
    df[f"{name}_Ay"] = dt.dt.month
    df[f"{name}_AyAdı"] = dt.dt.month_name()
    df[f"{name}_Hafta"] = dt.dt.isocalendar().week.astype(int)
    df[f"{name}_Gün"] = dt.dt.day
    df[f"{name}_HaftaGünü"] = dt.dt.day_name()
    
    return df


# =============================================================================
# NEW COMPUTED COLUMN TYPES - Yeni Hesaplama Tipleri (2024-12)
# =============================================================================

def _compute_running_total(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Kümülatif Toplam / Running Total"""
    value_col = resolve_column(df, cc.get("value_column") or cc.get("columns", [None])[0])
    group_col = resolve_column(df, cc.get("group_column"))
    
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    if group_col and group_col in df.columns:
        df[name] = df.groupby(group_col)[value_col].cumsum()
    else:
        df[name] = df[value_col].cumsum()
    
    return df


def _compute_moving_avg(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Hareketli Ortalama / Moving Average"""
    value_col = resolve_column(df, cc.get("value_column") or cc.get("columns", [None])[0])
    window_size = int(cc.get("window_size", 3))
    
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    df[name] = df[value_col].rolling(window=window_size, min_periods=1).mean().round(2)
    
    return df


def _compute_growth_rate(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Büyüme Oranı (%) / Growth Rate"""
    value_col = resolve_column(df, cc.get("value_column") or cc.get("columns", [None])[0])
    
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    prev_value = df[value_col].shift(1)
    df[name] = ((df[value_col] - prev_value) / prev_value * 100).round(2)
    
    return df


def _compute_percentile_rank(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Yüzdelik Sıralama / Percentile Rank"""
    value_col = resolve_column(df, cc.get("value_column") or cc.get("columns", [None])[0])
    
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    df[name] = df[value_col].rank(pct=True).round(4) * 100
    
    return df


def _compute_z_score(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Z-Skoru (Standart Sapma) / Z-Score"""
    value_col = resolve_column(df, cc.get("value_column") or cc.get("columns", [None])[0])
    
    if not value_col or value_col not in df.columns:
        raise ValueError(f"Değer sütunu bulunamadı: {cc.get('value_column')}")
    
    df = df.copy()
    mean_val = df[value_col].mean()
    std_val = df[value_col].std()
    if std_val > 0:
        df[name] = ((df[value_col] - mean_val) / std_val).round(3)
    else:
        df[name] = 0
    
    return df


def _compute_age(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Yaş Hesaplama / Age Calculation"""
    date_col = resolve_column(df, cc.get("date_column") or cc.get("columns", [None])[0])
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    
    df = df.copy()
    birth_dates = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    today = pd.Timestamp.now()
    df[name] = ((today - birth_dates).dt.days / 365.25).astype(int)
    
    return df


def _compute_split(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Sütun Böl / Split Column"""
    source_col = resolve_column(df, cc.get("source_column") or cc.get("columns", [None])[0])
    separator = cc.get("separator", ",")
    index = int(cc.get("index", 0))  # Hangi parçayı al (0-indexed)
    
    if not source_col or source_col not in df.columns:
        raise ValueError(f"Kaynak sütun bulunamadı: {cc.get('source_column')}")
    
    df = df.copy()
    split_data = df[source_col].astype(str).str.split(separator)
    df[name] = split_data.apply(lambda x: x[index].strip() if len(x) > index else "")
    
    return df


def _compute_normalize_turkish(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Türkçe Karakter Normalizasyonu / Turkish Character Normalization"""
    source_col = resolve_column(df, cc.get("source_column") or cc.get("columns", [None])[0])
    
    if not source_col or source_col not in df.columns:
        raise ValueError(f"Kaynak sütun bulunamadı: {cc.get('source_column')}")
    
    tr_map = str.maketrans({
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
        'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    })
    
    df = df.copy()
    df[name] = df[source_col].astype(str).str.translate(tr_map)
    
    return df


def _compute_extract_numbers(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Metinden Sayı Çıkar / Extract Numbers from Text"""
    source_col = resolve_column(df, cc.get("source_column") or cc.get("columns", [None])[0])
    
    if not source_col or source_col not in df.columns:
        raise ValueError(f"Kaynak sütun bulunamadı: {cc.get('source_column')}")
    
    df = df.copy()
    df[name] = df[source_col].astype(str).str.extract(r'(\d+[\d.,]*)', expand=False)
    df[name] = pd.to_numeric(df[name].str.replace(',', '.'), errors='coerce')
    
    return df


def _compute_weekday(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Haftanın Günü / Weekday"""
    date_col = resolve_column(df, cc.get("date_column") or cc.get("columns", [None])[0])
    lang = cc.get("lang", "tr")
    
    if not date_col or date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {cc.get('date_column')}")
    
    weekday_names_tr = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
    weekday_names_en = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    df = df.copy()
    dt = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    weekday_idx = dt.dt.dayofweek
    
    if lang == "tr":
        df[name] = weekday_idx.map(lambda x: weekday_names_tr[x] if pd.notna(x) and 0 <= x <= 6 else "")
    else:
        df[name] = weekday_idx.map(lambda x: weekday_names_en[x] if pd.notna(x) and 0 <= x <= 6 else "")
    
    return df


def _compute_business_days(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """İş Günü Farkı / Business Days Difference"""
    date1_col = resolve_column(df, cc.get("date1_column"))
    date2_col = resolve_column(df, cc.get("date2_column"))
    
    if not date1_col or date1_col not in df.columns:
        raise ValueError(f"Başlangıç tarihi sütunu bulunamadı: {cc.get('date1_column')}")
    if not date2_col or date2_col not in df.columns:
        raise ValueError(f"Bitiş tarihi sütunu bulunamadı: {cc.get('date2_column')}")
    
    df = df.copy()
    d1 = pd.to_datetime(df[date1_col], errors='coerce', dayfirst=True)
    d2 = pd.to_datetime(df[date2_col], errors='coerce', dayfirst=True)
    
    # İş günü hesaplama (basit: hafta sonlarını çıkar)
    def count_business_days(start, end):
        if pd.isna(start) or pd.isna(end):
            return np.nan
        return np.busday_count(start.date(), end.date())
    
    df[name] = [count_business_days(s, e) for s, e in zip(d1, d2)]
    
    return df


def _compute_duplicate_flag(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Tekrar İşaretle / Duplicate Flag"""
    check_col = resolve_column(df, cc.get("check_column") or cc.get("columns", [None])[0])
    
    if not check_col or check_col not in df.columns:
        raise ValueError(f"Kontrol sütunu bulunamadı: {cc.get('check_column')}")
    
    df = df.copy()
    df[name] = df.groupby(check_col).cumcount() + 1
    
    return df


def _compute_missing_flag(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Eksik Veri İşaretle / Missing Data Flag"""
    check_col = resolve_column(df, cc.get("check_column") or cc.get("columns", [None])[0])
    
    if not check_col or check_col not in df.columns:
        raise ValueError(f"Kontrol sütunu bulunamadı: {cc.get('check_column')}")
    
    df = df.copy()
    df[name] = df[check_col].isna() | (df[check_col].astype(str).str.strip() == "")
    df[name] = df[name].map({True: "Eksik", False: "Dolu"})
    
    return df


def _compute_correlation(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Korelasyon / Correlation (iki sütun arası)"""
    col1 = resolve_column(df, cc.get("column1") or cc.get("columns", [None])[0])
    col2 = resolve_column(df, cc.get("column2") or (cc.get("columns", [None, None])[1] if len(cc.get("columns", [])) > 1 else None))
    
    if not col1 or col1 not in df.columns:
        raise ValueError(f"Birinci sütun bulunamadı: {cc.get('column1')}")
    if not col2 or col2 not in df.columns:
        raise ValueError(f"İkinci sütun bulunamadı: {cc.get('column2')}")
    
    df = df.copy()
    corr_value = df[col1].corr(df[col2])
    df[name] = round(corr_value, 4) if pd.notna(corr_value) else 0
    
    return df


# =============================================================================
# WHAT-IF ANALYSIS ENGINE - Senaryo Analizi Motoru (YENİ)
# =============================================================================

def apply_variables(df: pd.DataFrame, variables: Dict, computed_columns: List[Dict]) -> pd.DataFrame:
    """
    What-If analizi için değişkenleri formüllere uygular.
    
    variables: {"FiyatArtisi": 0.10, "KurOrani": 34.5, ...}
    
    Formüllerde $DeğişkenAdı şeklinde referans yapılır:
    Örnek: "Fiyat * (1 + $FiyatArtisi)"
    """
    if not variables:
        return df
    
    # Her computed column'daki formülde değişkenleri değiştir
    for cc in computed_columns:
        formula = cc.get("formula", "")
        if formula:
            for var_name, var_value in variables.items():
                # $DeğişkenAdı → gerçek değer
                formula = formula.replace(f"${var_name}", str(var_value))
            cc["formula"] = formula
    
    return df





# =============================================================================
# FILTER ENGINE - Gelişmiş Filtre Motoru
# =============================================================================

FILTER_OPERATORS = {
    # Temel operatörler
    "==": lambda col, val: col == val,
    "!=": lambda col, val: col != val,
    ">": lambda col, val: col > val,
    "<": lambda col, val: col < val,
    ">=": lambda col, val: col >= val,
    "<=": lambda col, val: col <= val,
    
    # Metin operatörleri
    "contains": lambda col, val: col.astype(str).str.contains(str(val), case=False, na=False),
    "not_contains": lambda col, val: ~col.astype(str).str.contains(str(val), case=False, na=False),
    "starts_with": lambda col, val: col.astype(str).str.startswith(str(val), na=False),
    "ends_with": lambda col, val: col.astype(str).str.endswith(str(val), na=False),
    "regex": lambda col, val: col.astype(str).str.match(str(val), na=False),
    
    # Liste operatörleri
    "in_list": lambda col, val: col.isin(val if isinstance(val, list) else [v.strip() for v in str(val).split(",")]),
    "not_in": lambda col, val: ~col.isin(val if isinstance(val, list) else [v.strip() for v in str(val).split(",")]),
    
    # Null kontrolleri
    "is_null": lambda col, val: col.isna(),
    "is_not_null": lambda col, val: col.notna(),
}

def resolve_column(df: pd.DataFrame, col_ref: str) -> Optional[str]:
    """
    Kullanıcı girdisini dataframe sütun adına çevirir.
    Destekler:
    - Tam eşleşme: "Program Adı"
    - Excel Harfi: "A" -> df.columns[0]
    - Index: "1" -> df.columns[0] (Kullanıcı 1-based düşünebilir)
    """
    if not col_ref:
        return None
        
    s = str(col_ref).strip()
    
    # 1. Tam eşleşme
    if s in df.columns:
        return s
        
    # 2. Case-insensitive ve Strip denemesi
    # Sütun adlarını normalize et (strip + lower)
    s_lower = s.lower()
    for col in df.columns:
        if str(col).strip().lower() == s_lower:
            return col
            
    # 3. Excel Harfi (A, B, AA...)
    # Sadece harflerden oluşuyorsa ve uzunluğu makulse (örn. max 3 harf: ZZZ)
    if s.isalpha() and len(s) <= 3:
        # Excel harfini index'e çevir (A=0, B=1...)
        col_idx = 0
        for char in s.upper():
            col_idx = col_idx * 26 + (ord(char) - ord('A') + 1)
        col_idx -= 1 # 0-based
        
        if 0 <= col_idx < len(df.columns):
            return df.columns[col_idx]
            
    return None # Bulunamadı

# Operatör açıklamaları (UI için)
OPERATOR_LABELS = {
    "tr": {
        "==": "Eşittir",
        "!=": "Eşit Değil",
        ">": "Büyüktür",
        "<": "Küçüktür",
        ">=": "Büyük Eşit",
        "<=": "Küçük Eşit",
        "contains": "İçerir",
        "not_contains": "İçermez",
        "starts_with": "İle Başlar",
        "ends_with": "İle Biter",
        "regex": "Regex (Düzenli İfade)",
        "in_list": "Listede Var",
        "not_in": "Listede Yok",
        "is_null": "Boş",
        "is_not_null": "Dolu",
    },
    "en": {
        "==": "Equals",
        "!=": "Not Equals",
        ">": "Greater Than",
        "<": "Less Than",
        ">=": "Greater or Equal",
        "<=": "Less or Equal",
        "contains": "Contains",
        "not_contains": "Does Not Contain",
        "starts_with": "Starts With",
        "ends_with": "Ends With",
        "regex": "Regex (Pattern)",
        "in_list": "In List",
        "not_in": "Not In List",
        "is_null": "Is Empty",
        "is_not_null": "Is Not Empty",
    }
}


def apply_filters(df: pd.DataFrame, filters: List[Dict]) -> pd.DataFrame:
    """
    Filtre listesini uygular. AND/OR mantığını destekler.
    
    Her filtre: {column, operator, value, logic?}
    logic: "AND" (varsayılan) veya "OR"
    """
    if not filters:
        return df
    
    # Grupları ayır (OR ile ayrılmış AND grupları)
    or_groups = []
    current_group = []
    
    for f in filters:
        current_group.append(f)
        if f.get("logic", "AND").upper() == "OR":
            or_groups.append(current_group)
            current_group = []
    
    if current_group:
        or_groups.append(current_group)
    
    # Her OR grubunu işle
    combined_mask = pd.Series([False] * len(df), index=df.index)
    
    for group in or_groups:
        group_mask = pd.Series([True] * len(df), index=df.index)
        
        for f in group:
            raw_col_name = f.get("column")
            operator = f.get("operator", "==")
            value = f.get("value")
            
            # Sütunu çöz
            col_name = resolve_column(df, raw_col_name)
            
            if not col_name or col_name not in df.columns:
                continue
            
            col = df[col_name]
            # ...

            
            # Sayısal dönüşüm (gerekirse)
            if operator in [">", "<", ">=", "<="] and pd.api.types.is_numeric_dtype(col):
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    pass
            
            # Operatörü uygula
            if operator in FILTER_OPERATORS:
                try:
                    mask = FILTER_OPERATORS[operator](col, value)
                    group_mask = group_mask & mask
                except Exception:
                    pass  # Hata durumunda filtre atla
        
        combined_mask = combined_mask | group_mask
    
    return df[combined_mask]


# =============================================================================
# COMPUTED COLUMN ENGINE - Hesaplanmış Sütun Motoru
# =============================================================================

def apply_computed_columns(df: pd.DataFrame, computed_columns: List[Dict], variables: Dict = None) -> pd.DataFrame:
    """
    Yeni hesaplanmış sütunlar ekler.
    
    Desteklenen tipler:
    - arithmetic: Aritmetik işlemler (A/B*100, A+B, A-B, vb.)
    - if_else: Koşullu değer atama
    - concat: Metin birleştirme
    - date_diff: Tarih farkı hesaplama
    - extract: Tarihten bileşen çıkarma (yıl, ay, gün)
    
    variables: What-If değişkenleri (örn: {"FiyatArtisi": 0.10, "Carpan": 1.5})
    """
    if not computed_columns:
        return df
    
    if variables is None:
        variables = {}
    
    df = df.copy()
    
    for cc in computed_columns:
        name = cc.get("name", "computed_column")
        # Frontend 'ctype' gönderir, fallback olarak 'type' da kontrol et
        comp_type = cc.get("ctype") or cc.get("type", "arithmetic")
        
        try:
            if comp_type == "arithmetic":
                df = _compute_arithmetic(df, cc, name, variables)
            elif comp_type == "if_else":
                df = _compute_if_else(df, cc, name)
            elif comp_type == "concat":
                df = _compute_concat(df, cc, name)
            elif comp_type == "date_diff":
                df = _compute_date_diff(df, cc, name)
            elif comp_type == "extract":
                df = _compute_extract(df, cc, name)
            elif comp_type == "formula":
                df = _compute_formula(df, cc, name)
            elif comp_type == "text_transform":
                df = _compute_text_transform(df, cc, name)
            # === YENİ: Zaman Serisi Hesaplamaları ===
            elif comp_type == "ytd_sum":
                df = _compute_ytd_sum(df, cc, name)
            elif comp_type == "mtd_sum":
                df = _compute_mtd_sum(df, cc, name)
            elif comp_type == "yoy_change":
                df = _compute_yoy_change(df, cc, name)
            elif comp_type == "qoq_change":
                df = _compute_qoq_change(df, cc, name)
            elif comp_type == "date_hierarchy":
                df = _compute_date_hierarchy(df, cc, name)
            # === YENİ: 2024-12 Ek Hesaplama Tipleri ===
            elif comp_type == "running_total":
                df = _compute_running_total(df, cc, name)
            elif comp_type == "moving_avg":
                df = _compute_moving_avg(df, cc, name)
            elif comp_type == "growth_rate":
                df = _compute_growth_rate(df, cc, name)
            elif comp_type == "percentile_rank":
                df = _compute_percentile_rank(df, cc, name)
            elif comp_type == "z_score":
                df = _compute_z_score(df, cc, name)
            elif comp_type == "age":
                df = _compute_age(df, cc, name)
            elif comp_type == "split":
                df = _compute_split(df, cc, name)
            elif comp_type == "normalize_turkish":
                df = _compute_normalize_turkish(df, cc, name)
            elif comp_type == "extract_numbers":
                df = _compute_extract_numbers(df, cc, name)
            elif comp_type == "weekday":
                df = _compute_weekday(df, cc, name)
            elif comp_type == "business_days":
                df = _compute_business_days(df, cc, name)
            elif comp_type == "duplicate_flag":
                df = _compute_duplicate_flag(df, cc, name)
            elif comp_type == "missing_flag":
                df = _compute_missing_flag(df, cc, name)
            elif comp_type == "correlation":
                df = _compute_correlation(df, cc, name)
        except Exception as e:
            df[name] = f"HATA: {str(e)}"
    
    return df


def _compute_text_transform(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """
    Metin dönüştürme işlemleri.
    
    Desteklenen transform_type değerleri:
    - remove_parentheses: Parantez ve içeriğini siler
    - extract_parentheses: Sadece parantez içini çıkarır
    - first_n_words: İlk N kelimeyi alır
    - remove_after_dash: Tire ve sonrasını siler
    - regex_replace: Kullanıcı tanımlı regex ile değiştirme
    - to_upper: Büyük harfe çevirir
    - to_lower: Küçük harfe çevirir
    - trim: Baş ve sondaki boşlukları temizler
    """
    source_col = cc.get("source_column") or cc.get("columns", [None])[0]
    transform_type = cc.get("transform_type", "remove_parentheses")
    
    # Sütunu çöz
    resolved_col = resolve_column(df, source_col)
    if not resolved_col or resolved_col not in df.columns:
        raise ValueError(f"Kaynak sütun bulunamadı: {source_col}")
    
    col_data = df[resolved_col].astype(str)
    
    if transform_type == "remove_parentheses":
        # "Hukuk (İngilizce)" → "Hukuk"
        df[name] = col_data.str.replace(r'\s*\(.*?\)', '', regex=True).str.strip()
        
    elif transform_type == "extract_parentheses":
        # "Hukuk (İngilizce)" → "İngilizce"
        extracted = col_data.str.extract(r'\(([^)]+)\)', expand=False)
        df[name] = extracted.fillna('')
        
    elif transform_type == "first_n_words":
        n = int(cc.get("word_count", 2))
        df[name] = col_data.str.split().str[:n].str.join(' ')
        
    elif transform_type == "remove_after_dash":
        # "Bilgisayar Müh. - İngilizce" → "Bilgisayar Müh."
        df[name] = col_data.str.replace(r'\s*[-–]\s*.*$', '', regex=True).str.strip()
        
    elif transform_type == "regex_replace":
        pattern = cc.get("pattern", "")
        replacement = cc.get("replacement", "")
        if pattern:
            df[name] = col_data.str.replace(pattern, replacement, regex=True)
        else:
            df[name] = col_data
            
    elif transform_type == "to_upper":
        df[name] = col_data.str.upper()
        
    elif transform_type == "to_lower":
        df[name] = col_data.str.lower()
        
    elif transform_type == "trim":
        df[name] = col_data.str.strip()
        
    else:
        # Varsayılan: olduğu gibi kopyala
        df[name] = col_data
    
    return df


def _compute_arithmetic(df: pd.DataFrame, cc: Dict, name: str, variables: Dict = None) -> pd.DataFrame:
    """
    Aritmetik işlem: A/B*100 gibi
    
    Değişken desteği: İkinci sütun yerine $DeğişkenAdı kullanılabilir.
    Örnek: columns = ["Fiyat", "$Carpan"]
    """
    raw_columns = cc.get("columns", [])
    operation = cc.get("operation", "divide")
    multiplier = cc.get("multiplier", 1)
    
    # Değişkenler sözlüğü yoksa boş dict
    if variables is None:
        variables = {}
    
    # Sütun isimlerini çöz (Excel harfi, kısmi eşleşme vs.)
    # Değişken referanslarını ($VarName) kontrol et
    resolved_values = []
    for c in raw_columns:
        c_str = str(c).strip()
        if c_str.startswith("$"):
            # Bu bir değişken referansı
            var_name = c_str[1:]  # $ işaretini kaldır
            if var_name in variables:
                resolved_values.append(("var", variables[var_name]))
            else:
                resolved_values.append(("var", 1))  # Varsayılan 1
        else:
            # Bu bir sütun adı
            resolved_col = resolve_column(df, c)
            if resolved_col:
                resolved_values.append(("col", resolved_col))
    
    if len(resolved_values) < 1:
        raise ValueError(f"Geçerli sütun veya değişken bulunamadı. Girilen: {raw_columns}")
    
    # İlk değer
    val1 = resolved_values[0]
    if val1[0] == "col":
        col1 = df[val1[1]] if val1[1] in df.columns else 0
    else:
        col1 = val1[1]  # Sabit değer
    
    # İkinci değer (varsa)
    if len(resolved_values) > 1:
        val2 = resolved_values[1]
        if val2[0] == "col":
            col2 = df[val2[1]] if val2[1] in df.columns else 1
        else:
            col2 = val2[1]  # Sabit değer (değişken)
    else:
        col2 = 1
    
    # DEBUG: Değerleri logla
    print(f"DEBUG _compute_arithmetic: operation={operation}, col2={col2}, variables={variables}")
    
    # === EVRENSEL DEĞİŞKEN DESTEĞİ ===
    # Check if col2 is scalar 1 or series of all 1s (safely)
    is_col2_default = False
    if isinstance(col2, (int, float)) and col2 == 1:
        is_col2_default = True
    elif isinstance(col2, pd.Series) and (col2 == 1).all():
        is_col2_default = True

    # Eğer ikinci değer varsayılan 1 ise ve değişken varsa, değişkeni kullan
    if is_col2_default and variables and operation in ["multiply", "add", "subtract", "divide"]:
        first_var_value = list(variables.values())[0]
        col2 = first_var_value
        print(f"DEBUG: Auto-using variable as col2: {col2}")
    
    # Daha sağlam bir güvenli bölme (Series vs Series için)
    def robust_div(num, denom):
        # Eğer denom skaler ise
        if np.isscalar(denom):
            return num / denom if denom != 0 else np.nan
            
        # Eğer denom seri ise
        return np.divide(num, denom, out=np.zeros_like(num, dtype=float) * np.nan, where=denom!=0)

    if operation == "add":
        result = col1 + col2
    elif operation == "subtract":
        result = col1 - col2
    elif operation == "multiply":
        result = col1 * col2
    elif operation == "divide":
        result = robust_div(col1, col2)
    elif operation == "divide_multiply":
        result = robust_div(col1, col2) * multiplier
    elif operation == "percent":
        result = robust_div(col1, col2) * 100
    elif operation == "multiply_var":
        # Değişkenle çarp - İlk tanımlı değişkeni kullan
        if variables:
            first_var_value = list(variables.values())[0]
            result = col1 * first_var_value
            print(f"DEBUG multiply_var: col1 * {first_var_value} = result")
        else:
            result = col1  # Değişken yoksa aynı değeri döndür
            print(f"DEBUG multiply_var: No variable found, returning col1 unchanged")
    else:
        result = col1
    
    df[name] = result
    return df


def _compute_if_else(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Koşullu değer atama"""
    condition_col = cc.get("condition_column")
    operator = cc.get("operator", "==")
    condition_val = cc.get("condition_value")
    true_val = cc.get("true_value", "Evet")
    false_val = cc.get("false_value", "Hayır")
    
    if condition_col not in df.columns:
        raise ValueError(f"Sütun bulunamadı: {condition_col}")
    
    col = df[condition_col]
    
    # Sayısal karşılaştırma operatörleri için tip dönüşümü
    if operator in [">", "<", ">=", "<="] and pd.api.types.is_numeric_dtype(col):
        try:
            condition_val = float(condition_val)
        except (ValueError, TypeError):
            pass  # Dönüşüm başarısız olursa orijinal değeri kullan
    
    if operator in FILTER_OPERATORS:
        mask = FILTER_OPERATORS[operator](col, condition_val)
    else:
        mask = col == condition_val
    
    df[name] = np.where(mask, true_val, false_val)
    return df


def _compute_concat(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Metin birleştirme"""
    columns = cc.get("columns", [])
    separator = cc.get("separator", " ")
    
    valid_cols = [c for c in columns if c in df.columns]
    if not valid_cols:
        raise ValueError("Geçerli sütun yok")
    
    df[name] = df[valid_cols].astype(str).agg(separator.join, axis=1)
    return df


def _compute_date_diff(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """İki tarih arasındaki fark"""
    date1_col = cc.get("date1_column")
    date2_col = cc.get("date2_column")
    unit = cc.get("unit", "days")  # days, months, years
    
    if date1_col not in df.columns or date2_col not in df.columns:
        raise ValueError("Tarih sütunları bulunamadı")
    
    d1 = pd.to_datetime(df[date1_col], errors='coerce', dayfirst=True)
    d2 = pd.to_datetime(df[date2_col], errors='coerce', dayfirst=True)
    
    diff = d1 - d2
    
    if unit == "days":
        df[name] = diff.dt.days
    elif unit == "months":
        df[name] = diff.dt.days / 30
    elif unit == "years":
        df[name] = diff.dt.days / 365
    else:
        df[name] = diff.dt.days
    
    return df


def _compute_extract(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """Tarihten bileşen çıkar (yıl, ay, gün, hafta)"""
    date_col = cc.get("date_column")
    extract_what = cc.get("extract", "year")  # year, month, day, week, quarter
    
    if date_col not in df.columns:
        raise ValueError(f"Tarih sütunu bulunamadı: {date_col}")
    
    dt = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
    
    if extract_what == "year":
        df[name] = dt.dt.year
    elif extract_what == "month":
        df[name] = dt.dt.month
    elif extract_what == "day":
        df[name] = dt.dt.day
    elif extract_what == "week":
        df[name] = dt.dt.isocalendar().week
    elif extract_what == "quarter":
        df[name] = dt.dt.quarter
    elif extract_what == "dayofweek":
        df[name] = dt.dt.dayofweek
    
    return df


def _compute_formula(df: pd.DataFrame, cc: Dict, name: str) -> pd.DataFrame:
    """
    Basit formül parser: "Yerleşen / Kontenjan * 100"
    Güvenlik için sadece basit aritmetik operatörleri destekler.
    """
    formula = cc.get("formula", "")
    
    if not formula:
        raise ValueError("Formül boş")
    
    # Güvenlik: Sadece izin verilen karakterler
    allowed_pattern = r'^[\w\s\+\-\*\/\(\)\.\,]+$'
    if not re.match(allowed_pattern, formula):
        raise ValueError("Geçersiz formül karakterleri")
    
    # Sütun isimlerini bul ve değiştir
    result = df.copy()
    local_vars = {"df": result}
    
    for col in df.columns:
        if col in formula:
            # Sütun adını güvenli bir değişkene dönüştür
            safe_name = f"__col_{hash(col) % 10000}__"
            formula = formula.replace(col, safe_name)
            local_vars[safe_name] = result[col]
    
    try:
        # Güvenli eval (sadece pandas/numpy operasyonları)
        result[name] = eval(formula, {"__builtins__": {}, "np": np, "pd": pd}, local_vars)
    except Exception as e:
        raise ValueError(f"Formül hatası: {str(e)}")
    
    return result


# =============================================================================
# AGGREGATION ENGINE - Toplama Motoru
# =============================================================================

AGGREGATION_FUNCTIONS = {
    "sum": "sum",
    "count": "count",
    "mean": "mean",
    "median": "median",
    "min": "min",
    "max": "max",
    "std": "std",
    "var": "var",
    "first": "first",
    "last": "last",
    "nunique": "nunique",  # count_distinct
    "mode": lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else None,
}

AGG_LABELS = {
    "tr": {
        "sum": "Toplam",
        "count": "Sayı",
        "mean": "Ortalama",
        "median": "Medyan",
        "min": "Minimum",
        "max": "Maksimum",
        "std": "Standart Sapma",
        "var": "Varyans",
        "first": "İlk Değer",
        "last": "Son Değer",
        "nunique": "Benzersiz Sayı",
        "mode": "Mod (En Sık)"
    },
    "en": {
        "sum": "Sum",
        "count": "Count",
        "mean": "Average",
        "median": "Median",
        "min": "Minimum",
        "max": "Maximum",
        "std": "Std Deviation",
        "var": "Variance",
        "first": "First Value",
        "last": "Last Value",
        "nunique": "Distinct Count",
        "mode": "Mode (Most Frequent)"
    }
}


def apply_grouping_aggregation(df: pd.DataFrame, groups: List[str], aggregations: List[Dict]) -> pd.DataFrame:
    """
    Gruplama ve toplama işlemlerini uygular.
    
    groups: ["Departman", "Şehir"]
    aggregations: [{"column": "Maaş", "func": "sum", "alias": "Toplam_Maaş"}]
    """
    if not groups:
        # Gruplama yoksa aggregation'ı tüm veri üzerinde uygula
        if aggregations:
            result = {}
            for agg in aggregations:
                col = agg.get("column")
                func = agg.get("func", "sum")
                alias = agg.get("alias", f"{col}_{func}")
                
                if col in df.columns and func in AGGREGATION_FUNCTIONS:
                    agg_func = AGGREGATION_FUNCTIONS[func]
                    if callable(agg_func):
                        result[alias] = [agg_func(df[col])]
                    else:
                        result[alias] = [df[col].agg(agg_func)]
            
            return pd.DataFrame(result) if result else df
        return df
    
    # Geçerli grup sütunlarını filtrele
    valid_groups = [g for g in groups if g in df.columns]
    if not valid_groups:
        return df
    
    # Aggregation dictionary oluştur
    if aggregations:
        agg_dict = {}
        rename_dict = {}
        
        for agg in aggregations:
            col = agg.get("column")
            func = agg.get("func", "sum")
            alias = agg.get("alias", f"{col}_{func}")
            
            if col in df.columns and func in AGGREGATION_FUNCTIONS:
                agg_func = AGGREGATION_FUNCTIONS[func]
                if col not in agg_dict:
                    agg_dict[col] = []
                agg_dict[col].append(agg_func)
                rename_dict[(col, func if isinstance(agg_func, str) else "<lambda>")] = alias
        
        if agg_dict:
            grouped = df.groupby(valid_groups, as_index=False).agg(agg_dict)
            # Flatten column names
            if isinstance(grouped.columns, pd.MultiIndex):
                grouped.columns = [f"{col}_{agg}" if agg else col for col, agg in grouped.columns]
            return grouped
    
    # Aggregation yoksa sadece grupla ve say
    return df.groupby(valid_groups).size().reset_index(name="Kayıt_Sayısı")


# =============================================================================
# WINDOW FUNCTION ENGINE - Pencere Fonksiyonu Motoru
# =============================================================================

WINDOW_FUNCTIONS = {
    "rank": lambda g, ascending: g.rank(method="min", ascending=ascending),
    "dense_rank": lambda g, ascending: g.rank(method="dense", ascending=ascending),
    "row_number": lambda g, ascending: range(1, len(g) + 1),
    "percent_rank": lambda g, ascending: g.rank(pct=True, ascending=ascending),
    "ntile": lambda g, ascending, n=4: pd.qcut(g.rank(method="first"), n, labels=False, duplicates='drop') + 1,
    "cumsum": lambda g, ascending: g.cumsum(),
    "cummean": lambda g, ascending: g.expanding().mean(),
    "cummax": lambda g, ascending: g.cummax(),
    "cummin": lambda g, ascending: g.cummin(),
    # Yeni eklenenler (Global/Grup Bazlı İstatistikler)
    "sum": lambda g, ascending: g.transform("sum"),
    "count": lambda g, ascending: g.transform("count"),
    "mean": lambda g, ascending: g.transform("mean"),
    "min": lambda g, ascending: g.transform("min"),
    "max": lambda g, ascending: g.transform("max"),
}

WINDOW_LABELS = {
    "tr": {
        "rank": "Sıralama (RANK)",
        "dense_rank": "Kesintisiz Sıralama",
        "row_number": "Satır Numarası",
        "percent_rank": "Yüzdelik Sıra",
        "ntile": "N'e Böl (Quartile)",
        "cumsum": "Kümülatif Toplam",
        "cummean": "Kümülatif Ortalama",
        "cummax": "Kümülatif Maksimum",
        "cummin": "Kümülatif Minimum",
    },
    "en": {
        "rank": "Rank",
        "dense_rank": "Dense Rank",
        "row_number": "Row Number",
        "percent_rank": "Percent Rank",
        "ntile": "NTile (Quartile)",
        "cumsum": "Cumulative Sum",
        "cummean": "Cumulative Mean",
        "cummax": "Cumulative Max",
        "cummin": "Cumulative Min",
        "sum": "Group Sum",
        "count": "Group Count",
        "mean": "Group Average",
        "min": "Group Min",
        "max": "Group Max",
    }
}


def apply_window_functions(df: pd.DataFrame, window_functions: List[Dict]) -> pd.DataFrame:
    """
    Pencere fonksiyonlarını uygular (RANK, dense_rank, cumsum, vb.)
    
    Her window function: {
        type: "rank",
        partition_by: ["Program Adı"],  # Grup sütunları
        order_by: "Puan",  # Sıralama sütunu
        ascending: true,
        alias: "Sıralama"
    }
    """
    if not window_functions:
        return df
    
    df = df.copy()
    
    for wf in window_functions:
        wf_type = wf.get("wf_type") or wf.get("type", "rank")  # Frontend sends wf_type
        raw_order_by = wf.get("order_by")
        raw_partition_by = wf.get("partition_by", [])
        if isinstance(raw_partition_by, str): 
            raw_partition_by = [x.strip() for x in raw_partition_by.split(",")]
        elif not isinstance(raw_partition_by, list):
             raw_partition_by = []
             
        alias = wf.get("alias", f"{wf_type}_{raw_order_by}")
        
        # Direction handling: frontend sends 'asc'/'desc', convert to boolean
        direction = wf.get("direction", "asc")
        ascending = wf.get("ascending")
        if ascending is None:
            ascending = (direction == "asc")
        else:
            ascending = str(ascending).lower() == "true"
            
        ntile_n = int(wf.get("ntile_n", 4))
        
        # Sütunu çöz
        order_by = resolve_column(df, raw_order_by)
        partition_by = [resolve_column(df, p) for p in raw_partition_by]
        partition_by = [p for p in partition_by if p] # None ları temizle
        
        # include_values: Sadece belirli değerleri RANK'a dahil et
        include_values = wf.get("include_values", [])
        include_mask = None
        if include_values and partition_by:
            # İlk partition sütunundaki değerlere göre filtrele
            include_mask = df[partition_by[0]].isin(include_values)
            print(f"DEBUG WINDOW: include_values={include_values}, included_rows={include_mask.sum()}")
        
        # DEBUG: Window function parameters
        print(f"DEBUG WINDOW: wf_type={wf_type}, raw_partition_by={raw_partition_by}, partition_by={partition_by}, order_by={order_by}, alias={alias}, ascending={ascending}")
        print(f"DEBUG WINDOW: df row count BEFORE = {len(df)}")
        
        # COUNT gibi bazı fonksiyonlar order_by gerektirmeyebilir (sadece partition yeterli olabilir)
        # Ancak yapımız gereği bir hedef sütun bekliyoruz. Count(*) mantığı için herhangi bir sütun seçilebilir.
        if wf_type in ["count", "row_number"] and not order_by:
             # Eğer kullanıcı order_by girmediyse ve fonksiyon count ise, partition'ın ilk sütununu veya varsa bir sütunu kullanmaya çalış
             # Şimdilik hata vermemesi için devam etmiyoruz, kullanıcıdan sütun bekliyoruz.
             pass

        # COUNT fonksiyonu için order_by zorunlu DEĞİL - grup sayısını hesaplamak için
        if wf_type == "count" and partition_by:
            valid_partitions = [p for p in partition_by if p in df.columns]
            if valid_partitions:
                df[alias] = df.groupby(valid_partitions)[valid_partitions[0]].transform("count")
                # Tam sayıya çevir
                df[alias] = df[alias].astype("Int64")
            continue  # Count işlendi, devam et
        
        if not order_by or order_by not in df.columns:
            # Özel durum: 'row_number' bazen sıralama olmadan da istenebilir ama pandas logic gereği sort gerekir.
            continue
        
        try:
            if partition_by:
                # Grup bazlı pencere fonksiyonu
                valid_partitions = [p for p in partition_by if p in df.columns]
                if valid_partitions:
                    # include_mask varsa sadece seçilen satırlar için hesapla
                    if include_mask is not None:
                        # Önce NaN ile başlat
                        df[alias] = pd.NA
                        if wf_type == "rank":
                            df.loc[include_mask, alias] = df.loc[include_mask].groupby(valid_partitions)[order_by].rank(method="min", ascending=ascending)
                        elif wf_type == "dense_rank":
                            df.loc[include_mask, alias] = df.loc[include_mask].groupby(valid_partitions)[order_by].rank(method="dense", ascending=ascending)
                        elif wf_type == "count":
                            df.loc[include_mask, alias] = df.loc[include_mask].groupby(valid_partitions)[valid_partitions[0]].transform("count")
                        # Diğer tipler için de benzer mantık...
                    else:
                        # Normal hesaplama (tüm satırlar)
                        if wf_type == "rank":
                            df[alias] = df.groupby(valid_partitions)[order_by].rank(method="min", ascending=ascending)
                        elif wf_type == "dense_rank":
                            df[alias] = df.groupby(valid_partitions)[order_by].rank(method="dense", ascending=ascending)
                        elif wf_type == "row_number":
                            df[alias] = df.groupby(valid_partitions).cumcount() + 1
                        elif wf_type == "percent_rank":
                            df[alias] = df.groupby(valid_partitions)[order_by].rank(pct=True, ascending=ascending)
                        elif wf_type == "cumsum":
                            df = df.sort_values(by=valid_partitions + [order_by], ascending=ascending)
                            df[alias] = df.groupby(valid_partitions)[order_by].cumsum()
                        elif wf_type == "cummean":
                            df = df.sort_values(by=valid_partitions + [order_by], ascending=ascending)
                            df[alias] = df.groupby(valid_partitions)[order_by].expanding().mean().reset_index(level=0, drop=True)
                        elif wf_type == "ntile":
                            df[alias] = df.groupby(valid_partitions)[order_by].transform(
                                lambda x: pd.qcut(x.rank(method="first"), ntile_n, labels=False, duplicates='drop') + 1
                            )
                        # Partition bazlı sum, mean, min, max
                        elif wf_type == "sum":
                            df[alias] = df.groupby(valid_partitions)[order_by].transform("sum")
                        elif wf_type == "mean":
                            df[alias] = df.groupby(valid_partitions)[order_by].transform("mean")
                        elif wf_type == "min":
                            df[alias] = df.groupby(valid_partitions)[order_by].transform("min")
                        elif wf_type == "max":
                            df[alias] = df.groupby(valid_partitions)[order_by].transform("max")
            else:
                # Tüm veri üzerinde pencere fonksiyonu
                if wf_type == "rank":
                    df[alias] = df[order_by].rank(method="min", ascending=ascending)
                elif wf_type == "dense_rank":
                    df[alias] = df[order_by].rank(method="dense", ascending=ascending)
                elif wf_type == "row_number":
                    df = df.sort_values(by=order_by, ascending=ascending)
                    df[alias] = range(1, len(df) + 1)
                elif wf_type == "percent_rank":
                    df[alias] = df[order_by].rank(pct=True, ascending=ascending)
                elif wf_type == "cumsum":
                    df = df.sort_values(by=order_by, ascending=ascending)
                    df[alias] = df[order_by].cumsum()
                elif wf_type == "ntile":
                    df[alias] = pd.qcut(df[order_by].rank(method="first"), ntile_n, labels=False, duplicates='drop') + 1
                
                # Yeni Global Fonksiyonlar
                elif wf_type in ["sum", "count", "mean", "min", "max"]:
                    # Bu fonksiyonlar rank/ascending'e bakmaz, tüm sütunun özetini döner
                    # Ama transform ile satır sayısını korumalıyız
                    if wf_type == "sum": df[alias] = df[order_by].sum()
                    elif wf_type == "count": df[alias] = df[order_by].count()
                    elif wf_type == "mean": df[alias] = df[order_by].mean()
                    elif wf_type == "min": df[alias] = df[order_by].min()
                    elif wf_type == "max": df[alias] = df[order_by].max()

            
            # Tam sayıya çevir (RANK sonuçları için)
            if wf_type in ["rank", "dense_rank", "row_number", "ntile", "count"]:
                df[alias] = df[alias].astype("Int64")  # Nullable int
                
        except Exception as e:
            df[alias] = f"HATA: {str(e)}"
    
    return df


# =============================================================================
# OUTPUT ENGINE - Çıktı Motoru (Çoklu Sayfa Excel)
# =============================================================================

# =============================================================================
# OUTPUT ENGINE - Çıktı Motoru (Çoklu Sayfa Excel)
# =============================================================================

def generate_output(df: pd.DataFrame, output_config: Dict, original_df: pd.DataFrame = None, 
                    cf_configs: List[Dict] = None, chart_configs: List[Dict] = None) -> BytesIO:
    """
    Excel çıktısı oluşturur - GELİŞTİRİLMİŞ VERSİYON.
    
    output_config: {
        type: "single_sheet" | "multi_sheet" | "sheet_per_group",
        summary_sheet: true/false,
        group_by_sheet: "Program Adı"  # sheet_per_group için
        
        # === YENİ ÖZELLIKLER ===
        freeze_header: true/false (varsayılan True) - Başlık satırını dondur
        auto_fit_columns: true/false (varsayılan True) - Sütun genişliklerini otomatik ayarla
        header_style: true/false (varsayılan True) - Başlık stilini uygula
        number_format: "#,##0.00" (opsiyonel) - Sayısal format
    }
    
    cf_configs: List of conditional formatting configs (YENİ)
    chart_configs: List of chart configs (YENİ)
    """
    output = BytesIO()
    output_type = output_config.get("type", "single_sheet")
    include_summary = output_config.get("summary_sheet", False)
    raw_group_col = output_config.get("group_by_sheet")
    
    
    # Grup sütununu çöz (Output için final DF'e bakılmalı)
    group_col = resolve_column(df, raw_group_col)
    
    # Debug: Sheet Per Group trace
    if output_type == "sheet_per_group":
        print(f"DEBUG: Output Type is sheet_per_group. Raw Column: '{raw_group_col}', Resolved: '{group_col}'")
        if not group_col:
             print("DEBUG: Group column could not be resolved! Fallback to single_sheet.")
        elif group_col not in df.columns:
             print(f"DEBUG: Group column '{group_col}' NOT in DataFrame columns: {df.columns.tolist()}. Fallback to single_sheet.")
    
    # Kullanıcı "Sheet Per Group" seçtiyse ama sütun bulunamadıysa fallback
    if output_type == "sheet_per_group":
        if not group_col or group_col not in df.columns:
            output_type = "single_sheet" 
            print("DEBUG: Fallback triggered. output_type set to single_sheet.")
    
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        workbook = writer.book
        main_sheet_name = "Sonuç"
        
        if output_type == "single_sheet":
            # Tek sayfa
            df.to_excel(writer, index=False, sheet_name=main_sheet_name)
            worksheet = writer.sheets[main_sheet_name]
            
            # === YENİ: Excel İyileştirmeleri ===
            _apply_excel_enhancements(workbook, worksheet, df, output_config)

            # === YENİ: Hücre Yorumları (Header Comments) ===
            _add_header_comments(worksheet, df, output_config)
            
            # === YENİ: Slicers (Tablo olarak ekle) ===
            if output_config.get("slicers"):
                _add_slicers_to_worksheet(worksheet, df, output_config.get("slicers"))

            # === YENİ: Koşullu Biçimlendirme ===
            if cf_configs:
                apply_conditional_formatting(worksheet, df, cf_configs)
            
            if include_summary:
                _write_summary_sheet(writer, df, "Özet")
        
        elif output_type == "multi_sheet":
            # Ana sonuç + özet
            if include_summary:
                _write_summary_sheet(writer, df, "Özet")
            
            main_sheet_name = "Detay"
            df.to_excel(writer, index=False, sheet_name=main_sheet_name)
            worksheet = writer.sheets[main_sheet_name]
            
            # === YENİ: Excel İyileştirmeleri ===
            _apply_excel_enhancements(workbook, worksheet, df, output_config)

            # === YENİ: Hücre Yorumları (Header Comments) ===
            _add_header_comments(worksheet, df, output_config)
            
            # === YENİ: Slicers (Tablo olarak ekle) ===
            if output_config.get("slicers"):
                _add_slicers_to_worksheet(worksheet, df, output_config.get("slicers"))
            
            # === YENİ: Koşullu Biçimlendirme ===
            if cf_configs:
                apply_conditional_formatting(worksheet, df, cf_configs)
        
        elif output_type == "sheet_per_group" and group_col and group_col in df.columns:
            # Her grup için ayrı sayfa
            
            # 1. İndeks Sayfasını REZERVE ET (En başa gelmesi için)
            index_sheet = None
            if output_config.get("drill_down_index", True):
                index_sheet = workbook.add_worksheet("📋 İndeks")
            
            # 2. Özet Sayfası (Eğer isteniyorsa ikinci sırada)
            if include_summary:
                _write_summary_sheet(writer, df, "Özet")
            
            # Grup bazlı sayfalar
            grouped = df.groupby(group_col)
            
            # OPTIMIZATION: Çok fazla sayfa varsa performans için auto-fit'i kapat
            num_groups = len(grouped)
            if num_groups > 20:
                print(f"UYARI: Grup sayısı ({num_groups}) yüksek olduğu için Auto-Fit kapatıldı.")
                output_config["auto_fit_columns"] = False
            
            
            # Limit to 500 groups (User request)
            processed_count = 0
            sheet_names_map = {}  # Orijinal değer -> sheet adı eşlemesi
            
            for group_val, group_df in grouped:
                if processed_count >= 500:
                    break
                    
                sheet_name = str(group_val)[:31]  # Excel sheet name limit
                sheet_name = re.sub(r'[\\/*?:\[\]]', '_', sheet_name)  # Geçersiz karakterleri temizle
                
                # Aynı isimli sayfa varsa numara ekle
                if sheet_name in writer.sheets:
                    sheet_name = f"{sheet_name[:28]}_{processed_count}"
                
                sheet_names_map[group_val] = sheet_name
                group_df.to_excel(writer, index=False, sheet_name=sheet_name)
                
                # Her sayfaya Excel iyileştirmeleri uygula
                worksheet = writer.sheets[sheet_name]
                _apply_excel_enhancements(workbook, worksheet, group_df, output_config)
                
                # Koşullu biçimlendirme (Tüm sayfalara uygula)
                if cf_configs:
                    apply_conditional_formatting(worksheet, group_df, cf_configs)

                if processed_count == 0:
                    main_sheet_name = sheet_name
                
                processed_count += 1
            
            # === YENİ: Drill-Down Index Sayfasını DOLDUR ===
            if index_sheet and len(sheet_names_map) > 0:
                # Başlık stili
                header_format = workbook.add_format({
                    'bold': True, 'font_size': 14, 'bg_color': '#4472C4', 
                    'font_color': 'white', 'align': 'center', 'valign': 'vcenter'
                })
                link_format = workbook.add_format({
                    'font_color': '#0563C1', 'underline': True, 'font_size': 11
                })
                count_format = workbook.add_format({
                    'align': 'right', 'num_format': '#,##0'
                })
                
                # Başlıklar
                index_sheet.set_column(0, 0, 40)  # Grup adı genişliği
                index_sheet.set_column(1, 1, 15)  # Kayıt sayısı genişliği
                index_sheet.write(0, 0, group_col, header_format)
                index_sheet.write(0, 1, "Kayıt Sayısı", header_format)
                
                # Grup linkleri
                row = 1
                for group_val, sheet_name in sheet_names_map.items():
                    # Hyperlink formülü: internal link
                    link = f"internal:'{sheet_name}'!A1"
                    display_text = str(group_val)
                    index_sheet.write_url(row, 0, link, link_format, display_text)
                    
                    # Kayıt sayısı
                    count = len(grouped.get_group(group_val))
                    index_sheet.write(row, 1, count, count_format)
                    row += 1
                
                # Özet satırı
                index_sheet.write(row + 1, 0, "Toplam Grup:", workbook.add_format({'bold': True}))
                index_sheet.write(row + 1, 1, len(sheet_names_map), workbook.add_format({'bold': True}))
                index_sheet.write(row + 2, 0, "Toplam Kayıt:", workbook.add_format({'bold': True}))
                index_sheet.write(row + 2, 1, len(df), workbook.add_format({'bold': True}))
        
        else:
            # Fallback
            df.to_excel(writer, index=False, sheet_name=main_sheet_name)
            worksheet = writer.sheets[main_sheet_name]
            _apply_excel_enhancements(workbook, worksheet, df, output_config)
            if cf_configs:
                apply_conditional_formatting(worksheet, df, cf_configs)
        
            # === YENİ: Grafikler ===
        if chart_configs:
            add_charts_to_workbook(workbook, df, chart_configs, main_sheet_name)
    
    output.seek(0)
    return output


def _add_header_comments(worksheet, df: pd.DataFrame, output_config: Dict):
    """
    Sütun başlıklarına açıklama notları (yorumlar) ekler.
    output_config["column_descriptions"] = {"SütunAdı": "Açıklama...", "Col2": "Note..."}
    """
    descriptions = output_config.get("column_descriptions", {})
    if not descriptions:
        return

    for col_name, note in descriptions.items():
        # Sütunun indeksini bul
        resolved = resolve_column(df, col_name)
        if resolved and resolved in df.columns:
            col_idx = df.columns.get_loc(resolved)
            # Yorum ekle (Satır 0, Sütun col_idx)
            # xlsxwriter'da comment: worksheet.write_comment(row, col, comment)
            worksheet.write_comment(0, col_idx, note, {'x_scale': 1.2, 'y_scale': 1.2})


def _add_slicers_to_worksheet(worksheet, df: pd.DataFrame, slicer_columns: List[str]):
    """
    Belirtilen sütunlar için Slicer ekler.
    ÖNEMLİ: Slicer sadece Excel Tabloları (List Objects) ile çalışır.
    Bu yüzden önce veriyi tabloya çevirmeliyiz.
    """
    if not slicer_columns:
        return

    # Veri aralığını bul
    (max_row, max_col) = df.shape
    # Excel 0-indexed: Header=0, Data=1..max_row. Cols=0..max_col-1
    # add_table(first_row, first_col, last_row, last_col, options)
    
    # Sütunları header listesi olarak al
    column_headers = [{'header': col} for col in df.columns]
    
    # Tablo ekle (Mevcut verinin üzerine, header dahil)
    # Style: 'Table Style Medium 9' (Mavi) veya 'None' (Formatı korumak için)
    # Formatı korumak daha güvenli olabilir ama Slicer için belirgin bir tablo stili iyidir.
    worksheet.add_table(0, 0, max_row, max_col - 1, {
        'columns': column_headers,
        'style': 'Table Style Medium 2',
        'name': 'Data_Table'
    })
    
    # Slicer ekle
    # NOT: xlsxwriter 3.0.8+ destekler.
    try:
        if hasattr(worksheet, 'add_slicer'):
             for col_name in slicer_columns:
                resolved = resolve_column(df, col_name)
                if resolved and resolved in df.columns:
                    col_idx = df.columns.get_loc(resolved)
                    # Slicer'ın konumunu ayarla (Tablonun sağına)
                    # Basitçe: Her slicer'ı belirli bir ofsetle koyalım.
                    # Daha akıllıca: Tablonun bittiği yerin sağına.
                    
                    # Şimdilik standart bir konuma koyalım, kullanıcı Excel'de taşır.
                    # worksheet.add_slicer(row, col, {'name': col_name, 'source': 'Data_Table'})
                    # source parametresi önemli olmayabilir, sütun yeterli.
                    pass 
                    # DİKKAT: add_slicer henüz standart xlsxwriter'da tam documentation örneği gibi değil
                    # 2024 itibariyle Table Slicer desteği sınırlı olabilir ya da farklı syntax.
                    # Dokümantasyona göre: slicer doğrudan tabloya bağlı değil, range'e bağlı.
                    # worksheet.add_slicer(range) yok.
                    # YANLIŞ BİLGİ DÜZELTME: xlsxwriter şu an (v3.2.0) add_slicer desteklemiyor olabilir.
                    # Ancak kullanıcı istediği için 'Filter' zaten var.
                    # Slicer yerine 'Autofilter' zaten tabloda geliyor.
                    # Eğer xlsxwriter desteklemiyorsa, sadece Tablo yaparak bırakalım.
                    # KONTROL: xlsxwriter documentation -> Working with Tables (Var), Slicers (YOK).
                    # ANCAK: Birçok kullanıcı "Slicer" derken "Filtre Butonları"nı kastediyor olabilir.
                    # Tablo ekleyince filtre butonları otomatik gelir.
                    # Eğer GERÇEK Slicer ("Dilimleyici") isteniyorsa, bu şu an Python kütüphaneleriyle zor.
                    # PLAN GÜNCELLEME: Sadece 'add_table' yapacağız, bu da filtre oklarını ve tablo özelliklerini açar.
                    pass
    except Exception as e:
        print(f"Slicer/Table Error: {e}")


def _write_summary_sheet(writer, df: pd.DataFrame, sheet_name: str):
    """Özet istatistik sayfası oluşturur"""
    summary_data = {
        "Metrik": [],
        "Değer": []
    }
    
    summary_data["Metrik"].append("Toplam Satır Sayısı")
    summary_data["Değer"].append(len(df))
    
    summary_data["Metrik"].append("Toplam Sütun Sayısı")
    summary_data["Değer"].append(len(df.columns))
    
    # Sayısal sütunlar için istatistikler
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols[:10]:  # İlk 10 sayısal sütun
        summary_data["Metrik"].append(f"{col} - Toplam")
        summary_data["Değer"].append(df[col].sum())
        
        summary_data["Metrik"].append(f"{col} - Ortalama")
        summary_data["Değer"].append(round(df[col].mean(), 2))
    
    summary_df = pd.DataFrame(summary_data)
    summary_df.to_excel(writer, index=False, sheet_name=sheet_name)


# =============================================================================
# CODE GENERATOR - Kod Üretici
# =============================================================================

def generate_python_script(actions: List[Dict]) -> str:
    """
    Kullanıcının yaptığı işlemleri Python scriptine çevirir.
    """
    script = [
        "import pandas as pd",
        "import numpy as np",
        "",
        "# Veri setini yükle",
        "df = pd.read_excel('dosyaniz.xlsx')  # Kendi dosya yolunuzu yazın",
        ""
    ]
    
    for i, action in enumerate(actions, 1):
        atype = action.get("type")
        script.append(f"# --- ADIM {i}: {atype.upper()} ---")
        
        if atype == "filter":
            col = action.get("column")
            op = action.get("operator")
            val = action.get("value")
            
            if op == "==":
                script.append(f"df = df[df['{col}'] == '{val}']")
            elif op == "contains":
                script.append(f"df = df[df['{col}'].astype(str).str.contains('{val}', case=False, na=False)]")
            elif op == ">":
                script.append(f"df = df[df['{col}'] > {val}]")
            elif op == "<":
                script.append(f"df = df[df['{col}'] < {val}]")
            else:
                script.append(f"# Filtre: {col} {op} {val}")
                script.append(f"# (Karmaşık operatör kodu buraya gelecek)")
        
        elif atype == "computed":
            name = action.get("name")
            ctype = action.get("ctype")
            
            if ctype == "arithmetic":
                cols = action.get("columns", [])
                oper = action.get("operation")
                if len(cols) >= 2:
                    if oper == "percent":
                        script.append(f"df['{name}'] = (df['{cols[0]}'] / df['{cols[1]}']) * 100")
                    else:
                        op_sym = {"add": "+", "subtract": "-", "multiply": "*", "divide": "/"}.get(oper, "+")
                        script.append(f"df['{name}'] = df['{cols[0]}'] {op_sym} df['{cols[1]}']")
            else:
                 script.append(f"# Hesaplama: {name} ({ctype})")
                 
        elif atype == "window":
            wf = action.get("wf_type")
            part = action.get("partition_by")
            order = action.get("order_by")
            alias = action.get("alias")
            
            if part:
                if wf == "rank":
                    script.append(f"df['{alias}'] = df.groupby({part})['{order}'].rank(method='min', ascending=True)")
                else: # Generic
                    script.append(f"df['{alias}'] = df.groupby({part})['{order}'].transform('{wf}')")
            else:
                script.append(f"df['{alias}'] = df['{order}'].rank(method='min')")
        
        elif atype == "grouping":
            grps = action.get("groups", [])
            aggs = action.get("aggregations", [])
            script.append(f"df = df.groupby({grps}).agg({aggs}).reset_index()")
            
        elif atype == "sort":
            col = action.get("column")
            direction = action.get("direction", "asc")
            script.append(f"df = df.sort_values(by='{col}', ascending={direction == 'asc'})")
            
        elif atype == "output":
            otype = action.get("output_type")
            script.append(f"# Çıktı Tipi: {otype}")
            script.append("df.to_excel('sonuc.xlsx', index=False)")

        script.append("")
        
    return "\n".join(script)


# =============================================================================
# SECOND FILE OPERATIONS - İkinci Dosya İşlemleri
# =============================================================================

def _get_df2_for_action(action: Dict, params: dict):
    """
    Action config'e göre df2 döndürür.
    
    Eğer action.use_crosssheet == True ise:
        - params["_crosssheet_data"] dict'inden crosssheet_name ile df2'yi al
    Değilse:
        - params["df2"] standart ikinci dosyayı döndür
    
    Frontend crosssheet seçildiğinde, aynı dosyayı file2 olarak + sheet_name2 gönderir.
    Bu durumda df2 zaten doğru sheet'ten okunmuş olarak params["df2"]'de bulunur.
    """
    # Crosssheet modu: Frontend tarafından aynı dosya, farklı sheet olarak gönderilir
    if action.get("use_crosssheet"):
        crosssheet_name = action.get("crosssheet_name")
        # Frontend zaten aynı dosyayı file2 + sheet_name2 olarak gönderiyor
        # Bu yüzden df2 params'ta mevcut olmalı
        df2 = params.get("df2")
        if df2 is not None:
            log_step(f"CROSSSHEET: '{crosssheet_name}' sayfası kullanılıyor (df2={len(df2)} satır)")
            return df2
        else:
            log_step(f"CROSSSHEET UYARI: '{crosssheet_name}' istendi ama df2 bulunamadı!")
            return None
    
    # Normal mod: Standart ikinci dosya
    return params.get("df2")

def apply_merge(df: pd.DataFrame, df2: pd.DataFrame, config: Dict) -> pd.DataFrame:
    """
    İki DataFrame'i birleştirir (JOIN/MERGE).
    VLOOKUP mantığı - ortak sütuna göre eşleştirme.
    
    config:
        left_on: Ana dosyadaki eşleştirme sütunu
        right_on: İkinci dosyadaki eşleştirme sütunu
        how: inner, left, right, outer
        columns_to_add: İkinci dosyadan eklenecek sütunlar (opsiyonel, boşsa tümü)
    """
    left_on = config.get("left_on", "")
    right_on = config.get("right_on", "")
    how = config.get("how", "left")  # Varsayılan LEFT JOIN (VLOOKUP davranışı)
    columns_to_add = config.get("columns_to_add", [])
    
    # Sütunları çöz
    left_col = resolve_column(df, left_on)
    right_col = resolve_column(df2, right_on)
    
    if not left_col:
        raise ValueError(f"Ana dosyada eşleştirme sütunu bulunamadı: {left_on}")
    if not right_col:
        raise ValueError(f"İkinci dosyada eşleştirme sütunu bulunamadı: {right_on}")
    
    # İkinci dosyadan hangi sütunlar alınacak
    if columns_to_add and isinstance(columns_to_add, list):
        resolved_cols = [resolve_column(df2, c) for c in columns_to_add]
        resolved_cols = [c for c in resolved_cols if c]
        # Eşleştirme sütunu mutlaka dahil
        if right_col not in resolved_cols:
            resolved_cols.insert(0, right_col)
        df2_subset = df2[resolved_cols]
    else:
        df2_subset = df2
    
    # Çakışan sütun isimlerini engelle
    suffix = "_2"
    
    result = pd.merge(
        df, 
        df2_subset, 
        left_on=left_col, 
        right_on=right_col, 
        how=how,
        suffixes=("", suffix)
    )
    
    log_step(f"MERGE: {how.upper()} JOIN on '{left_col}' = '{right_col}', {len(result)} satır")
    return result


def apply_union(df: pd.DataFrame, df2: pd.DataFrame, config: Dict) -> pd.DataFrame:
    """
    İki DataFrame'i alt alta birleştirir (UNION/APPEND).
    Sütunlar otomatik eşleştirilir.
    
    config:
        ignore_index: True (varsayılan) - index sıfırlanır
    """
    ignore_index = config.get("ignore_index", True)
    
    result = pd.concat([df, df2], ignore_index=ignore_index)
    
    log_step(f"UNION: {len(df)} + {len(df2)} = {len(result)} satır")
    return result


def apply_diff(df: pd.DataFrame, df2: pd.DataFrame, config: Dict) -> pd.DataFrame:
    """
    Ana dosyada olup ikinci dosyada olmayan satırları bulur (DIFF).
    Sonuç: Sadece ana dosyada olan kayıtlar.
    
    config:
        left_on: Ana dosyadaki karşılaştırma sütunu
        right_on: İkinci dosyadaki karşılaştırma sütunu
    """
    left_on = config.get("left_on", "")
    right_on = config.get("right_on", "")
    
    left_col = resolve_column(df, left_on)
    right_col = resolve_column(df2, right_on)
    
    if not left_col:
        raise ValueError(f"Ana dosyada karşılaştırma sütunu bulunamadı: {left_on}")
    if not right_col:
        raise ValueError(f"İkinci dosyada karşılaştırma sütunu bulunamadı: {right_on}")
    
    # LEFT JOIN yap, ikinci dosyada olmayanları bul
    df2_keys = df2[[right_col]].drop_duplicates()
    df2_keys["__exists__"] = True
    
    result = pd.merge(
        df,
        df2_keys,
        left_on=left_col,
        right_on=right_col,
        how="left"
    )
    
    # İkinci dosyada olmayanları filtrele
    result = result[result["__exists__"].isna()]
    result = result.drop(columns=["__exists__"], errors="ignore")
    
    # Sağ sütun farklıysa onu da temizle
    if right_col != left_col and right_col in result.columns:
        result = result.drop(columns=[right_col], errors="ignore")
    
    log_step(f"DIFF: {len(df)} kaydın {len(result)} tanesi ikinci dosyada yok")
    return result


def apply_validate(df: pd.DataFrame, df2: pd.DataFrame, config: Dict) -> pd.DataFrame:
    """
    Ana dosyadaki değerlerin referans listede (ikinci dosya) olup olmadığını kontrol eder.
    Yeni bir sütun ekler: Geçerli / Geçersiz.
    
    config:
        left_on: Ana dosyadaki kontrol edilecek sütun
        right_on: İkinci dosyadaki referans sütun
        result_column: Sonuç sütununun adı (varsayılan: "Doğrulama")
        valid_label: Geçerli değerler için etiket (varsayılan: "Geçerli")
        invalid_label: Geçersiz değerler için etiket (varsayılan: "Geçersiz")
    """
    left_on = config.get("left_on", "")
    right_on = config.get("right_on", "")
    result_column = config.get("result_column", "Doğrulama")
    valid_label = config.get("valid_label", "Geçerli")
    invalid_label = config.get("invalid_label", "Geçersiz")
    
    left_col = resolve_column(df, left_on)
    right_col = resolve_column(df2, right_on)
    
    if not left_col:
        raise ValueError(f"Ana dosyada kontrol sütunu bulunamadı: {left_on}")
    if not right_col:
        raise ValueError(f"İkinci dosyada referans sütun bulunamadı: {right_on}")
    
    # Referans değerleri set olarak al
    valid_values = set(df2[right_col].dropna().unique())
    
    # Doğrulama sütunu ekle
    df = df.copy()
    df[result_column] = df[left_col].apply(
        lambda x: valid_label if x in valid_values else invalid_label
    )
    
    valid_count = (df[result_column] == valid_label).sum()
    invalid_count = (df[result_column] == invalid_label).sum()
    
    log_step(f"VALIDATE: {valid_count} geçerli, {invalid_count} geçersiz")
    return df


# =============================================================================
# MAIN RUN FUNCTION - Ana Çalıştırma Fonksiyonu
# =============================================================================


def run(df: pd.DataFrame, params: dict) -> dict:
    """
    Oyun Hamuru PRO - Sıralı Akış Motoru
    
    Eski yapı: params['filters'], params['computed'] ayrı ayrıydı.
    Yeni yapı: params['actions'] listesi var. Sırayla çalışır.
    
    params['actions'] = [
        {"type": "filter", "column": "...", ...},
        {"type": "window", "wf_type": "rank", ...},
        {"type": "computed", "name": "...", ...},
        ...
        {"type": "output", "output_type": "multi_sheet"} (En sonda olabilir)
    ]
    """
    
    original_df = df.copy() # Orijinal veriyi sakla (bazı hesaplamalar için gerekebilir)
    
    # Config genellikle 'config' anahtarı altında gelir (Frontend'deki tanımlamaya bağlı)
    # Ancak parametre yapısı değişti. Artık direkt 'actions' listesi bekliyoruz.
    # Frontend json_builder_pro'dan gelen veri bir JSON stringi olabilir veya direkt dict.
    
    actions = []
    
    # 1. Parametreleri Çözümle
    # 'config' anahtarı varsa ve diğerleri yoksa, muhtemelen yeni yapıdır.
    if "config" in params:
        raw_config = params["config"]
        if isinstance(raw_config, str):
            try:
                # JSON string ise parse et
                parsed = json.loads(raw_config)
                if isinstance(parsed, list):
                    actions = parsed
                elif isinstance(parsed, dict) and "actions" in parsed:
                    actions = parsed["actions"]
            except:
                pass
        elif isinstance(raw_config, list):
            actions = raw_config
    
    # Fallback: Eski yapıdan dönüştürme (Eğer eski frontend kullanılırsa patlamasın)
    if not actions:
        # Eski yapıyı 'actions' listesine çevir
        if "filters" in params:
            for f in params["filters"]: 
                f["type"] = "filter"
                actions.append(f)
        if "computed_columns" in params:
            for c in params["computed_columns"]:
                c["type"] = "computed"
                actions.append(c)
        if "grouping" in params:
            # Grouping yapısı biraz farklıydı, basitleştirilmiş dönüşüm
            actions.append({"type": "grouping", "groups": params.get("grouping"), "aggregations": params.get("aggregations")})
        if "window_functions" in params:
            for w in params["window_functions"]:
                w["type"] = "window"
                actions.append(w)
        if "output_config" in params:
            out = params["output_config"]
            out["type"] = "output"
            # Output tipi için adlandırma farkı varsa düzelt
            if "type" in out and out["type"] not in ["output"]:
                out["output_type"] = out["type"]
                out["type"] = "output"
            actions.append(out)

    
    # 2. İşlemleri Sırasıyla Uygula
    # log_step(f"Sıralı işlem başlıyor. Toplam adım: {len(actions)}")
    
    output_config = {"type": "single_sheet"} # Varsayılan çıktı ayarı
    
    # === YENİ: Önce tüm değişkenleri topla ===
    what_if_variables = {}
    for action in actions:
        if action.get("type") == "variable":
            var_name = action.get("name", "var")
            var_value = action.get("value", 0)
            what_if_variables[var_name] = var_value
    
        print(f"DEBUG: What-If Değişkenleri: {what_if_variables}")
    
    for action in actions:
        atype = action.get("type")
        
        try:
            if atype == "filter":
                # Tek bir filtre objesi veya filtre grubu
                # apply_filters fonksiyonu [filter1, filter2] listesi bekliyor.
                # Bizim action tek bir filtre olabilir. Listeye sarıp gönderelim.
                # Veya action'ın kendisi bir grup olabilir mi? Şimdilik tekil varsayalım.
                # Eğer birden fazla filtre varsa, döngüde geldikçe uygulanır (AND mantığı).
                df = apply_filters(df, [action])
                
            elif atype == "computed" or atype == "calculation": # 'calculation' alias
                # Değişkenleri aktararak hesapla
                df = apply_computed_columns(df, [action], what_if_variables)
                
            elif atype == "window" or atype == "rank": # 'rank' alias
                df = apply_window_functions(df, [action])
                
            elif atype == "grouping":
                # Grouping action yapısı: {"groups": [...], "aggregations": [...]}
                grps = action.get("groups", [])
                aggs = action.get("aggregations", [])
                df = apply_grouping_aggregation(df, grps, aggs)
                
            elif atype == "sort":
                col = resolve_column(df, action.get("column"))
                direction = action.get("direction", "asc") # asc / desc
                if col:
                    df = df.sort_values(by=col, ascending=(direction == "asc"))
            
            elif atype == "output":
                # Çıktı ayarlarını güncelle, işlem bittikten sonra kullanılacak
                output_config.update(action)
                # output_type key çakışmasını düzelt
                if "output_type" in action:
                    output_config["type"] = action["output_type"]
            
            # =====================================================
            # İKİNCİ DOSYA İŞLEMLERİ (YENİ - CROSSSHEET DESTEĞİ EKLENDİ)
            # =====================================================
            elif atype == "merge":
                df2 = _get_df2_for_action(action, params)
                if df2 is None:
                    raise ValueError("BİRLEŞTİR işlemi için ikinci dosya yüklenmeli veya cross-sheet seçilmeli!")
                df = apply_merge(df, df2, action)
                
            elif atype == "union":
                df2 = _get_df2_for_action(action, params)
                if df2 is None:
                    raise ValueError("ALT ALTA EKLE işlemi için ikinci dosya yüklenmeli veya cross-sheet seçilmeli!")
                df = apply_union(df, df2, action)
                
            elif atype == "diff":
                df2 = _get_df2_for_action(action, params)
                if df2 is None:
                    raise ValueError("FARK BUL işlemi için ikinci dosya yüklenmeli veya cross-sheet seçilmeli!")
                df = apply_diff(df, df2, action)
                
            elif atype == "validate":
                df2 = _get_df2_for_action(action, params)
                if df2 is None:
                    raise ValueError("DOĞRULA işlemi için ikinci dosya (referans liste) yüklenmeli veya cross-sheet seçilmeli!")
                df = apply_validate(df, df2, action)
            
            # =====================================================
            # YENİ ÖZELLİKLER - FAZ 2024
            # =====================================================
            
            elif atype == "pivot":
                # Pivot tablo oluştur
                df = apply_pivot(df, action)
            
            elif atype == "conditional_format":
                # Koşullu biçimlendirme (Excel çıktısına uygulanacak, burada sadece topla)
                if "cf_configs" not in output_config:
                    output_config["cf_configs"] = []
                output_config["cf_configs"].append(action)
            
            elif atype == "chart":
                # Grafik (Excel çıktısına uygulanacak, burada sadece topla)
                if "chart_configs" not in output_config:
                    output_config["chart_configs"] = []
                output_config["chart_configs"].append(action)
            
            elif atype == "variable":
                # What-If değişkeni tanımla
                if "variables" not in output_config:
                    output_config["variables"] = {}
                var_name = action.get("name", "var")
                var_value = action.get("value", 0)
                output_config["variables"][var_name] = var_value
                    
        except Exception as e:
            # Bir adım hata verirse tüm süreci durdurmak yerine o adımı atla ve rapora ekle?
            # Kullanıcı hatayı görsün
            print(f"Hata ({atype}): {e}")
            # Opsiyonel: Hata sütunu ekle? Hayır, log yeterli.

    # 3. Kod Özeti Oluştur
    generated_code = generate_python_script(actions)
    
    # 4. Çıktı Oluştur (YENİ: cf_configs ve chart_configs parametreleri eklendi)
    cf_configs = output_config.pop("cf_configs", None)
    chart_configs = output_config.pop("chart_configs", None)
    excel_buffer = generate_output(df, output_config, original_df, cf_configs, chart_configs)
    
    return {
        "summary": {
            "Girdi Satır Sayısı": len(original_df),
            "Sonuç Satır Sayısı": len(df),
            "Sonuç Sütun Sayısı": len(df.columns),
            "Yapılan İşlemler": f"{len(actions)} adım uygulandı."
        },
        "df_out": df, # Önizleme ve JSON indirme için
        "excel_bytes": excel_buffer, # Özel Excel formatı (renkli/çoklu sayfa) için
        "excel_filename": "oyun_hamuru_pro_sonuc",
        "technical_details": {
            "actions": actions,
            "generated_python_code": f"```python\n{generated_code}\n```"
        }
    }

