from __future__ import annotations
# Force Reload Trigger 2024-12-20-v3-HEADER-ROW-FIX

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import Dict, Any, List, Optional
import json
import pandas as pd
from io import BytesIO
from pathlib import Path

# Router tanımlaması
router = APIRouter(tags=["ui"])

# Katalog yolunu belirle
ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "config" / "scenarios_catalog.json"

def load_catalog() -> List[Dict[str, Any]]:
    """
    JSON dosyasını okur ve listeyi döner.
    Hata olursa boş liste dönerek UI'ın çökmesini engeller.
    """
    if not CATALOG_PATH.exists():
        print(f"[UYARI] Katalog dosyası bulunamadı: {CATALOG_PATH}")
        return []
        
    try:
        raw = CATALOG_PATH.read_text(encoding="utf-8")
        return json.loads(raw)
    except Exception as e:
        print(f"[HATA] Katalog okuma hatası: {e}")
        return []

# UI Metinleri (Dil Desteği)
UI_TEXT = {
    "tr": {
        "search_placeholder": "Senaryo ara...",
        "step1_title": "1. Dosyanı Yükle",
        "step1_desc": "Excel veya CSV dosyanı buradan seç.",
        "step2_title": "2. Senaryonu Seç",
        "step3_title": "3. Senaryo Ayarları",
        "file_placeholder": "Dosya Seç / Sürükle Bırak",
        "subtitle": "Verini Konuştur (test)",
        "contact": "Bize Ulaşın",
        "run_button": "Senaryoyu Çalıştır",
        "results_title": "Sonuç",
        "no_selection": "Soldan bir senaryo seçin.",
        "help_title": "Mini Kullanım Kılavuzu",
        "help_subtitle_what": "Nedir?",
        "help_subtitle_how": "Nasıl Kullanılır?",
        "help_subtitle_example": "Örnek",
        "community_title": "💬 Topluluk Panosu",
        "comment_placeholder": "Bir öneri veya yorum bırak...",
        "send_btn": "Gönder",
        "contact_modal_title": "Bize Ulaşın",
        "share_result_title": "Sonucu Paylaş"
    },
    "en": {
        "search_placeholder": "Search scenario...",
        "step1_title": "1. Upload File",
        "step1_desc": "Select your Excel or CSV file here.",
        "step2_title": "2. Select Scenario",
        "step3_title": "3. Scenario Settings",
        "file_placeholder": "Select File / Drag & Drop",
        "subtitle": "Make Your Data Speak (test)",
        "contact": "Contact Us",
        "run_button": "Run Scenario",
        "results_title": "Result",
        "no_selection": "Select a scenario from the left.",
        "help_title": "Mini User Guide",
        "help_subtitle_what": "What is it?",
        "help_subtitle_how": "How to use?",
        "help_subtitle_example": "Example",
        "community_title": "💬 Community Board",
        "comment_placeholder": "Leave a suggestion...",
        "send_btn": "Send",
        "contact_modal_title": "Contact Us",
        "share_result_title": "Share Result"
    },
}

THEME = {
    "light": { "name": "light", "background": "#e0f0ff", "text": "#0e1a2b" },
    "dark": { "name": "dark", "background": "#05060a", "text": "#f5f5f7" },
}

SETTINGS = {
    "show_language_switch": True,
    "show_theme_switch": True,
    "feedback_enabled": True,
}

@router.get("/ui/menu")
async def get_ui_menu(lang: str = "tr", status: Optional[str] = None):
    """
    Frontend sol menüsü için kategorize edilmiş senaryo listesini döner.
    """
    if lang not in ("tr", "en"):
        lang = "tr"

    catalog = load_catalog()
    categories: Dict[str, List[Dict[str, Any]]] = {}

    for entry in catalog:
        # Status filtresi varsa uygula
        if status and entry.get("status") != status:
            continue
            
        cat_id = entry.get("category") or "other"
        
        # Frontend'in ihtiyaç duyduğu tüm verileri hazırla
        # params verisini de buraya ekliyoruz ki frontend form oluşturabilsin
        categories.setdefault(cat_id, []).append({
            "id": entry["id"],
            "category": entry.get("category"),
            "title": entry.get(f"title_{lang}") or entry.get("title_tr"),
            "short": entry.get(f"short_{lang}") or entry.get("short_tr"),
            "status": entry.get("status", "todo"),
            "params": entry.get("params", []), 
            "available_options": entry.get("available_options", []),  # CRITICAL FIX!
            "tags": entry.get(f"tags_{lang}") or entry.get("tags_tr", []),
        })

    return {
        "text": UI_TEXT[lang],
        "categories": categories,
    }

@router.get("/ui/help/{scenario_id}")
async def get_help(scenario_id: str, lang: str = "tr"):
    """
    Seçilen senaryo için sağ alttaki yardım kartı içeriğini döner.
    """
    if lang not in ("tr", "en"):
        lang = "tr"
        
    catalog = load_catalog()
    # ID'si eşleşen senaryoyu bul
    target = next((e for e in catalog if e["id"] == scenario_id), None)
    
    if not target:
        raise HTTPException(status_code=404, detail="Senaryo bulunamadı.")

    # İlgili dildeki help objesini döndür
    help_obj = target.get(f"help_{lang}") or target.get("help_tr")
    return {"id": scenario_id, "help": help_obj}

@router.get("/ui/theme")
async def get_theme(mode: str = "light"):
    return THEME.get(mode, THEME["light"])

@router.get("/ui/settings")
async def get_ui_settings():
    return SETTINGS



@router.post("/ui/inspect")
async def inspect_file(
    file: UploadFile = File(...), 
    sheet_name: str = Query(None, description="Sheet adı"),
    header_row: int = Query(0, description="Başlık satırı (0-indexed)")
):
    """
    Yüklenen Excel/CSV dosyasının sütunlarını analiz eder ve listeyi döner.
    Frontend'de autocomplete ve bilgi paneli için kullanılır.
    YENİ: Sheet listesi döner ve seçilen sheet'i okur.
    YENİ: header_row parametresi ile hangi satırın başlık olarak kullanılacağı belirlenir.
    
    Parametreler Query string olarak gelir: /ui/inspect?sheet_name=Sheet1&header_row=1
    """
    # header_row'u güvenli şekilde int'e çevir
    try:
        header_row_int = int(header_row) if header_row is not None else 0
    except (ValueError, TypeError):
        header_row_int = 0
        
    print(f"[DEBUG] /ui/inspect called - sheet_name: '{sheet_name}', header_row: {header_row_int}")
    
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        # Sheet listesi ve aktif sheet
        sheet_names = []
        active_sheet = None
        
        # Header row için pandas parametresi (0-indexed)
        pandas_header = header_row_int if header_row_int >= 0 else 0
        
        if filename.endswith(".csv"):
            # CSV için header parametresi ve skiprows
            df_preview = pd.read_csv(BytesIO(content), header=pandas_header, nrows=10)
            df_full = pd.read_csv(BytesIO(content), header=pandas_header)
            
            # Ham satırları al (başlık seçimi UI için)
            raw_df = pd.read_csv(BytesIO(content), header=None, nrows=10)
        else:
            # Excel dosyası - sheet listesini al
            xls = pd.ExcelFile(BytesIO(content))
            sheet_names = xls.sheet_names
            
            # Aktif sheet: parametre veya ilk sayfa
            active_sheet = sheet_name if sheet_name in sheet_names else sheet_names[0]
            print(f"[DEBUG] sheet_names: {sheet_names}, active_sheet: {active_sheet}")
            
            # Header parametresi ile oku
            df_preview = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=pandas_header, nrows=10)
            df_full = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=pandas_header)
            
            # Ham satırları al (başlık seçimi UI için)
            raw_df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=None, nrows=10)
            
            print(f"[DEBUG] Read from '{active_sheet}': {len(df_full)} rows, columns: {list(df_preview.columns)[:3]}...")
        
        columns = list(df_preview.columns)
        row_count = len(df_full)
        
        # Excel harf kodu eşleştirmesi (A=0, B=1, ...)
        def index_to_letter(idx):
            result = ""
            idx += 1
            while idx > 0:
                idx, remainder = divmod(idx - 1, 26)
                result = chr(65 + remainder) + result
            return result
        
        column_letters = {index_to_letter(i): col for i, col in enumerate(columns)}
        
        # İlk 10 satırı HTML tablosuna çevir
        preview_html = df_preview.to_html(
            index=False, 
            classes="gm-preview-table",
            border=0,
            na_rep="-"
        )
        
        # BUG FIX: NaN değerlerini None'a çevir (JSON compliant)
        preview_records = df_preview.head(10).fillna("").to_dict(orient="records")
        
        # YENİ: Ham satırları da döndür (başlık seçimi UI için)
        raw_rows = []
        for idx, row in raw_df.iterrows():
            raw_rows.append({
                "cells": [str(cell) if pd.notna(cell) else "" for cell in row.values]
            })
        
        return {
            "columns": columns,
            "row_count": row_count,
            "column_count": len(columns),
            "column_letters": column_letters,
            "preview_html": preview_html,
            "preview_rows": preview_records,  # NaN-free
            "raw_rows": raw_rows,             # YENİ: Ham satırlar (başlık seçimi için)
            "sheet_names": sheet_names,       # YENİ
            "active_sheet": active_sheet,     # YENİ
            "header_row": header_row_int,         # YENİ: Seçili başlık satırı
        }
    except Exception as e:
        print(f"[HATA] Dosya analiz hatası: {e}")
        return {"columns": [], "row_count": 0, "column_count": 0, "sheet_names": [], "error": str(e)}



@router.post("/ui/unique-values")
async def get_unique_values(file: UploadFile = File(...), column: str = ""):
    """
    Belirtilen sütundaki benzersiz değerleri döndürür.
    Checkbox filtre UI için kullanılır.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content))
        else:
            # Header satırını atla (YKS verileri için genelde 2. satır)
            df = pd.read_excel(BytesIO(content))
        
        if column not in df.columns:
            # Sütun bulunamadı - belki Excel harfi olarak geldi?
            # A, B, C... şeklinde
            if column.isalpha() and len(column) <= 2:
                col_idx = 0
                for char in column.upper():
                    col_idx = col_idx * 26 + (ord(char) - ord('A') + 1)
                col_idx -= 1
                if 0 <= col_idx < len(df.columns):
                    column = df.columns[col_idx]
        
        if column not in df.columns:
            return {"values": [], "error": f"Sütun bulunamadı: {column}"}
        
        # Benzersiz değerleri al, NaN'ları at, sırala
        unique_values = df[column].dropna().unique().tolist()
        unique_values = [str(v) for v in unique_values]  # String'e çevir
        unique_values = sorted(set(unique_values))  # Sırala ve tekrarları kaldır
        
        # Max 200 değer (performans için)
        if len(unique_values) > 200:
            unique_values = unique_values[:200]
        
        return {
            "column": column,
            "values": unique_values,
            "total_count": len(unique_values)
        }
    except Exception as e:
        print(f"[HATA] Benzersiz değer çekme hatası: {e}")
        return {"values": [], "error": str(e)}
