from __future__ import annotations
# Trigger reload 4

import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO
import json 

# Opradox 2.0 Modüller
# get_runner yerine get_scenario import edildi (ÇÖZÜM)
from .scenario_registry import list_scenarios, get_scenario
from .ui_api import router as ui_router
from .feedback_api import router as feedback_router
from .feedback_store import init_feedback_db
from .scenario_registry import LAST_EXCEL_STORE
from .excel_utils import read_table_from_upload 
from .auth import router as auth_router
from .stats_service import router as viz_router

# Yeni API modülleri (Faz 6 - Opsiyonel Özellikler)
from .google_sheets_api import router as google_sheets_router
from .sql_api import router as sql_router
from .websocket_api import router as websocket_router
from .scheduled_reports_api import router as scheduled_router
from .health_api import router as health_router
from .selftest_api import router as selftest_router

# FAZ-ES-6: Queue API
from .queue_api import router as queue_router
from .queue_ws import router as queue_ws_router

# FAZ-3: VBA Analysis API (Macro Doctor)
from .vba_api import router as vba_router

# FAZ-A: Unified Scenario Runner API
from .scenario_api import router as scenario_router

# -------------------------------------------------------
# Opradox 2.0 – Main Application
# -------------------------------------------------------

app = FastAPI(
    title="Opradox 2.0 API",
    version="2.0",
    description="Excel Doktoru – API tabanlı dinamik UI + Senaryo motoru"
)

# -------------------------------------------------------
# VERİTABANI BAŞLATMA GARANTİSİ (GÖREV 1.2)
# -------------------------------------------------------
init_feedback_db()


# -------------------------------------------------------
# CORS – frontend için gerekli
# -------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# Include Routers
# -------------------------------------------------------
app.include_router(auth_router)         # /auth/*
app.include_router(ui_router)          # /ui/*
app.include_router(feedback_router)    # /feedback + /admin/feedback
app.include_router(viz_router)         # /viz/* (Visual Studio)

# Yeni router'lar (Faz 6)
app.include_router(google_sheets_router)  # /viz/google/* (Google Sheets)
app.include_router(sql_router)            # /viz/sql/* (SQL Query)
app.include_router(websocket_router)      # /viz/ws/* (WebSocket Collaboration)
app.include_router(scheduled_router)      # /viz/schedule/* (Zamanlanmış Raporlar)
app.include_router(health_router)         # /health (Health Check)
app.include_router(selftest_router)       # /selftest/* (Selftest API)

# FAZ-ES-6: Queue API
app.include_router(queue_router)          # /queue/* (Central Queue)
app.include_router(queue_ws_router)       # /ws/queue (Queue WebSocket)

# FAZ-3: VBA Analysis API (Macro Doctor)
app.include_router(vba_router)            # /vba/* (VBA Analysis)

# FAZ-A: Unified Scenario Runner API
app.include_router(scenario_router)       # /api/scenario/* (Unified Runner)

# -------------------------------------------------------
# STARTUP INIT (FAZ-ES-5: Storage + Cleanup)
# -------------------------------------------------------
@app.on_event("startup")
async def startup_init():
    """
    Startup'ta:
    - Storage DB init
    - Expired shares cleanup
    - Eski shared_files temizliği (48 saat)
    Hata olursa server açılışını engellemez.
    """
    import os
    import time
    from pathlib import Path
    
    # FAZ-ES-5: Storage init
    try:
        from .storage import init_db
        from .cleanup_jobs import run_all_cleanup
        
        init_db()
        cleanup_result = run_all_cleanup()
        if cleanup_result.get("shares", {}).get("deleted", 0) > 0:
            print(f"[STARTUP] Cleanup: {cleanup_result}")
    except Exception as e:
        print(f"[STARTUP] Storage init warning: {e}")
    
    # FAZ-ES-5: Scheduled jobs restore from DB
    try:
        from .scheduled_reports_api import _load_jobs_from_db
        _load_jobs_from_db()
    except Exception as e:
        print(f"[STARTUP] Scheduled jobs restore warning: {e}")
    
    # FAZ-ES-6: Queue init and engine start
    try:
        from .queue_storage import init_queue_table
        from .queue_engine import start_engine
        
        init_queue_table()
        start_engine()
    except Exception as e:
        print(f"[STARTUP] Queue init warning: {e}")
    
    # FAZ-ES-1: shared_files eski dosya temizliği
    try:
        base_dir = Path(__file__).resolve().parents[2]
        shared_dir = base_dir / "shared_files"
        
        if not shared_dir.exists():
            return
        
        max_age_seconds = 48 * 60 * 60  # 48 saat
        current_time = time.time()
        cleaned_count = 0
        
        for file_path in shared_dir.iterdir():
            if file_path.is_file():
                try:
                    file_age = current_time - file_path.stat().st_mtime
                    if file_age > max_age_seconds:
                        file_path.unlink()
                        cleaned_count += 1
                except Exception:
                    pass
        
        if cleaned_count > 0:
            print(f"[STARTUP] shared_files cleanup: {cleaned_count} old files removed")
    except Exception as e:
        print(f"[STARTUP] shared_files cleanup skipped: {e}")

# -------------------------------------------------------
# GET SHEET COLUMNS (Visual Builder için dinamik sütun çekme)
# -------------------------------------------------------
@app.post("/get-sheet-columns")
async def get_sheet_columns(
    file: UploadFile = File(...),
    sheet_name: str = Form(...)
):
    """
    Excel dosyasından belirli bir sayfanın sütun isimlerini döndürür.
    Visual Builder'da farklı sayfa seçildiğinde sütunları dinamik güncellemek için kullanılır.
    """
    try:
        df = read_table_from_upload(file, sheet_name=sheet_name, header_row=0)
        columns = list(df.columns)
        return {
            "sheet_name": sheet_name,
            "columns": columns,
            "row_count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sayfa okunamadı: {str(e)}")


# -------------------------------------------------------
# SCENARIO RUNNER
# -------------------------------------------------------
@app.post("/run/{scenario_id}")
async def run_scenario(
    scenario_id: str,
    file: UploadFile = File(...),
    file2: UploadFile = File(None),
    params: str = Form("{}"),
    sheet_name: str = Form(None),    # YENİ: Ana dosya sayfa seçimi
    sheet_name2: str = Form(None),   # YENİ: İkinci dosya sayfa seçimi
    header_row: str = Form("0"),     # YENİ: Başlık satırı (birleştirilmiş hücreleri atlamak için)
    header_row2: str = Form("0"),    # YENİ: İkinci dosya başlık satırı
):
    """
    Senaryoyu Excel dosyası ve parametrelerle çalıştırır.
    sheet_name: Ana Excel dosyasının okunacak sayfası
    sheet_name2: İkinci Excel dosyasının okunacak sayfası
    header_row: Başlık satırı indeksi (0-indexed, birleştirilmiş başlıkları atlamak için)
    header_row2: İkinci dosya için başlık satırı indeksi
    """
    # Header row'u int'e çevir
    try:
        header_row_int = int(header_row)
    except:
        header_row_int = 0
    
    try:
        header_row2_int = int(header_row2)
    except:
        header_row2_int = 0
    
    import time
    start_time = time.time()
    
    # DEBUG LOGGING TO FILE
    try:
        with open("server_debug.log", "a", encoding="utf-8") as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"REQUEST RECEIVED AT {pd.Timestamp.now()}\n")
            f.write(f"Scenario ID: {scenario_id}\n")
            f.write(f"Filename: {file.filename}\n")
            f.write(f"Sheet: {sheet_name}\n")
            f.write(f"Header Row: {header_row_int}\n")
            f.write(f"Params Raw: {params[:200]}...\n")
    except Exception as e:
        print(f"Log yazma hatası: {e}")

    # --- 1) Excel okuma (sheet_name + header_row desteği eklendi) ---
    try:
        df = read_table_from_upload(file, sheet_name=sheet_name, header_row=header_row_int)
    except Exception as e:
        with open("server_debug.log", "a") as f: f.write(f"Excel Read Error: {e}\n")
        raise HTTPException(status_code=500, detail=f"Dosya okuma hatası: {str(e)}")
    
    # --- 2) Parametreleri JSON'dan Python dict'e dönüştür ---
    try:
        params_dict = json.loads(params)
        if not isinstance(params_dict, dict):
             raise ValueError
    except Exception as e:
        with open("server_debug.log", "a") as f: f.write(f"JSON Parse Error: {e}\n")
        raise HTTPException(status_code=400, detail="Parametreler geçersiz JSON formatında.")

    # --- 3) Senaryo runner'ını al (ÇÖZÜM: get_scenario kullanıldı) ---
    scenario = get_scenario(scenario_id) # senaryo tanımını çek
    runner = scenario.get("runner")      # runner fonksiyonunu sözlükten al

    if runner is None:
        with open("server_debug.log", "a") as f: f.write(f"Runner Not Found: {scenario_id}\n")
        raise HTTPException(status_code=400, detail=f"Bu senaryonun çalıştırma motoru bulunamadı: {scenario_id}")

    # --- 4) Senaryoyu çalıştır ---
    try:
        # İkinci dosya varsa params'a ekle (sheet_name2 + header_row2 desteği eklendi)
        if file2:
            try:
                df2 = read_table_from_upload(file2, sheet_name=sheet_name2, header_row=header_row2_int)
                params_dict["df2"] = df2
            except Exception as e:
                with open("server_debug.log", "a") as f: f.write(f"Second File Error: {e}\n")
                raise HTTPException(status_code=400, detail=f"İkinci dosya okunamadı: {str(e)}")
        
        # YENİ: Crosssheet durumunda df2 yoksa ana dosyayı farklı sheet olarak oku
        if "df2" not in params_dict:
            raw_config = params_dict.get("config", "")
            crosssheet_name = None
            try:
                parsed = json.loads(raw_config) if isinstance(raw_config, str) and raw_config else (raw_config if isinstance(raw_config, list) else [])
                actions_list = parsed if isinstance(parsed, list) else parsed.get("actions", [])
                for action in actions_list:
                    if action.get("use_crosssheet") and action.get("crosssheet_name"):
                        crosssheet_name = action.get("crosssheet_name")
                        break
            except:
                pass
            
            if crosssheet_name:
                try:
                    file.file.seek(0)
                    df2 = read_table_from_upload(file, sheet_name=crosssheet_name)
                    params_dict["df2"] = df2
                    with open("server_debug.log", "a") as f:
                        f.write(f"CROSSSHEET: '{crosssheet_name}' sayfası okundu, {len(df2)} satır\n")
                except Exception as e:
                    with open("server_debug.log", "a") as f: f.write(f"CROSSSHEET Error: {e}\n")
        
        # RUNNER ÇAĞRISI
        with open("server_debug.log", "a") as f: f.write(f"Calling runner for {scenario_id}...\n")
        result = runner(df, params_dict)
        with open("server_debug.log", "a") as f: f.write(f"Runner finished successfully.\n")

    except ValueError as e:
        with open("server_debug.log", "a") as f: f.write(f"Runner ValueError: {e}\n")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        with open("server_debug.log", "a") as f: f.write(f"Runner Exception: {e}\nTRACEBACK:\n{tb}\n")
        print(f"Senaryo hatası: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Senaryo hatası: {str(e)}")


        # Varsayım: runner(df, params) -> { summary: ..., df_out: DataFrame | None }
        result = runner(df, params_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Senaryo çalışırken hata oluştu: {e}")
    
    # --- 5) EXCEL ÇIKTISINI DEPOLA (GÖREV 1.3) ---
    # --- 5) SONUÇ DEPOLAMA (GÖREV 1.3 - REFACTOR) ---
    # DataFrame'i hafızada tutuyoruz ki kullanıcı istediği formatta (xls, csv, json) indirebilsin via /download
    
    has_output = False
    
    if isinstance(result, dict):
        store_data = {}
        
        # 1. DataFrame (JSON/CSV/Fallback için)
        if "df_out" in result and result["df_out"] is not None:
            store_data["dataframe"] = result["df_out"]
            has_output = True
        
        # 2. Hazır Excel Bytes (PRO çıktıları için)
        if "excel_bytes" in result and result["excel_bytes"] is not None:
            store_data["bytes"] = result["excel_bytes"]
            has_output = True
            
        if has_output:
            store_data["filename_prefix"] = result.get("excel_filename", f"opradox_{scenario_id}")
            LAST_EXCEL_STORE[scenario_id] = store_data
        
            LAST_EXCEL_STORE[scenario_id] = store_data
        
        # DEBUG TRACE
        # print(f"DEBUG: Storing result for {scenario_id}. Has output: {has_output}")
        # if has_output:
        #      keys = list(store_data.keys())
        #      print(f"DEBUG: Store keys: {keys}")
        #      if "bytes" in store_data:
        #          print(f"DEBUG: Bytes length: {store_data['bytes'].getbuffer().nbytes}")
        # else:
        #      print("DEBUG: No output stored!")

        
    # --- 6) JSON Yanıtını hazırla (STANDARDIZED) ---
    import time
    time_ms = int((time.time() - (start_time if 'start_time' in locals() else time.time())) * 1000)
    
    technical_details = result.get("technical_details") or {}
    
    # 1. Input Stats (Garanti)
    technical_details["input_rows"] = technical_details.get("input_rows", len(df))
    technical_details["input_columns"] = technical_details.get("input_columns", list(df.columns))
    technical_details["input_cols"] = len(df.columns) # Convenience aliases
    
    # 2. Output Stats (Garanti)
    if "df_out" in result and result["df_out"] is not None:
        out_rows = len(result["df_out"])
        out_cols = len(result["df_out"].columns)
    else:
        out_rows = technical_details.get("output_rows", 0)
        out_cols = technical_details.get("output_columns", 0)
        
    technical_details["output_rows"] = out_rows
    technical_details["output_columns"] = out_cols # Consistent naming
    technical_details["output_cols"] = out_cols
    
    # 3. Meta Stats
    technical_details["engine"] = scenario_id
    technical_details["time_ms"] = time_ms
    
    # 4. Summary Calculation (Fallback logic)
    summary_raw = result.get("summary")
    if not summary_raw:
        # Auto-summary if missing
        summary = (
            f"İşlem tamamlandı ({time_ms}ms).\n"
            f"- Girdi: {technical_details['input_rows']} satır\n"
            f"- Çıktı: {technical_details['output_rows']} satır, {technical_details['output_cols']} sütun"
        )
    elif isinstance(summary_raw, dict):
        # Dict to Markdown list
        summary_lines = []
        for k, v in summary_raw.items():
            formatted_key = k.replace("_", " ").title()
            summary_lines.append(f"- **{formatted_key}:** {v}")
        summary = "\n".join(summary_lines)
    else:
        summary = str(summary_raw)

    # ===== GLOBAL PREVIEW WRAPPER (FAZ 2.2) =====
    # Eğer is_preview=true ve senaryo kendi preview_data'sını döndürmediyse,
    # df_out'tan otomatik preview_data oluştur
    is_preview = params_dict.get("is_preview", False)
    
    # Senaryo zaten preview_data döndürdüyse direkt onu kullan
    if isinstance(result, dict) and "preview_data" in result:
        return result
    
    # Preview mode ve df_out varsa, otomatik preview_data oluştur
    if is_preview and isinstance(result, dict) and "df_out" in result and result["df_out"] is not None:
        import numpy as np
        df_out = result["df_out"]
        total_rows = len(df_out)
        preview_df = df_out.head(100)
        
        return {
            "preview_data": {
                "columns": list(preview_df.columns),
                "rows": preview_df.replace({np.nan: None}).to_dict(orient='records'),
                "truncated": total_rows > 100,
                "row_limit": 100,
                "total_rows": total_rows
            },
            "summary": {
                "Girdi Satır Sayısı": len(df),
                "Sonuç Satır Sayısı": total_rows,
                "Önizleme": "Sadece ilk 100 satır gösteriliyor."
            },
            "scenario_id": scenario_id
        }

    # 5. Download URLs (Normal akış)
    response_data = {
        "summary": summary,
        "technical_details": technical_details,
        "excel_available": has_output,
        "excel_filename": "", # Deprecated, use download_url
        "scenario_id": scenario_id,
        "data_columns": list(df.columns),
        "generated_python_code": result.get("generated_python_code")
    }
    
    if has_output:
        response_data["download_url"] = f"/download/{scenario_id}?format=xlsx"
        response_data["csv_url"] = f"/download/{scenario_id}?format=csv"
        response_data["json_url"] = f"/download/{scenario_id}?format=json"

    return response_data


# -------------------------------------------------------
# EXCEL / CSV / JSON DOWNLOAD
# -------------------------------------------------------
@app.get("/download/{scenario_id}")
async def download_result(scenario_id: str, format: str = "xlsx"):
    """
    Senaryo sonucunu istenen formatta indirir (Temp dosyası ve xlsxwriter ile).
    """
    import traceback
    import tempfile
    import os
    from fastapi.responses import FileResponse
    from fastapi.background import BackgroundTasks

    try:
        if scenario_id not in LAST_EXCEL_STORE:
             raise HTTPException(
                status_code=404, 
                detail="Sonuç dosyası bulunamadı. Lütfen senaryoyu tekrar çalıştırın."
            )

        item = LAST_EXCEL_STORE[scenario_id]
        
        # DEBUG TRACE
        # print(f"DEBUG: Download request for {scenario_id}, format={format}")
        # print(f"DEBUG: Item keys available: {list(item.keys())}")
        
        prefix = item.get("filename_prefix", "result").replace(".xlsx", "")
        suffix = f".{format}"
        filename = f"{prefix}{suffix}"

        # Temp dosya
        fd, path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)

        # === SMART DOWNLOAD LOGIC ===
        # Öncelik: Eğer format XLSX ise ve elimizde hazır "bytes" varsa onu kullan.
        # Yoksa veya format CSV/JSON ise "dataframe" kullan.
        
        handled = False
        
        # 1. Hazır Bytes Kullanımı (Sadece XLSX için)
        if format == "xlsx" and "bytes" in item:
            try:
                with open(path, "wb") as f:
                    item["bytes"].seek(0)
                    f.write(item["bytes"].read())
                handled = True
            except Exception as e:
                print(f"Bytes yazma hatası (Fallback DF): {e}")
                # Hata olursa DF'e düş
        
        # 2. DataFrame Kullanımı (CSV, JSON veya Bytes yoksa)
        if not handled and "dataframe" in item:
            df: pd.DataFrame = item["dataframe"]
            try:
                if format == "csv":
                    # BOM for UTF-8 Excel compatibility
                    df.to_csv(path, index=False, sep=";", encoding="utf-8-sig")
                elif format == "json":
                    df.to_json(path, orient="records", force_ascii=False, indent=2)
                else:
                    # XLSX Fallback
                    df.to_excel(path, index=False, engine="xlsxwriter")
                handled = True
            except Exception as e:
                try: os.remove(path)
                except: pass
                print(f"Export Hatası: {e}")
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Dosya oluşturma hatası: {e}")
        
        if not handled:
             raise HTTPException(status_code=500, detail="İstenen format için uygun veri bulunamadı.")

        # Cleanup task
        def cleanup():
            try: os.remove(path)
            except: pass

        response = FileResponse(path, filename=filename)
        response.background = BackgroundTasks()
        response.background.add_task(cleanup)
        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Genel İndirme Hatası: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")


# -------------------------------------------------------
# SHARE ENDPOINT (Temporary Public Links with Watermark)
# -------------------------------------------------------
import uuid
import time
from typing import Dict

# In-memory share store (production'da Redis kullanılmalı)
SHARE_STORE: Dict[str, dict] = {}
SHARE_EXPIRY_SECONDS = 24 * 60 * 60  # 24 saat

# Watermark config (domain alınca güncellenir)
SITE_DOMAIN = "opradox.com"  # Production domain

@app.post("/share/{scenario_id}")
async def create_share_link(scenario_id: str, format: str = "xlsx"):
    """
    Sonuç dosyası için geçici paylaşım linki oluşturur.
    Dosyaya watermark ekler.
    24 saat geçerli.
    """
    import tempfile
    import os
    from datetime import datetime
    
    if scenario_id not in LAST_EXCEL_STORE:
        raise HTTPException(
            status_code=404, 
            detail="Sonuç dosyası bulunamadı. Lütfen senaryoyu tekrar çalıştırın."
        )
    
    item = LAST_EXCEL_STORE[scenario_id]
    
    if "dataframe" not in item:
        raise HTTPException(status_code=400, detail="Bu veri tipi için paylaşım (watermark) desteklenmiyor.")
    
    df: pd.DataFrame = item["dataframe"].copy()
    
    # Watermark ekle
    watermark_text = f"Bu rapor Opradox ile oluşturuldu - {SITE_DOMAIN}"
    
    prefix = item.get("filename_prefix", "result").replace(".xlsx", "")
    suffix = f".{format}"
    share_id = str(uuid.uuid4())[:8]
    filename = f"{prefix}_{share_id}{suffix}"
    
    # Temp dosyaya kaydet (watermark ile)
    shares_dir = BASE_DIR / "shared_files"
    shares_dir.mkdir(exist_ok=True)
    path = shares_dir / filename
    
    try:
        if format == "csv":
            # CSV: Son satıra watermark
            df_with_wm = pd.concat([df, pd.DataFrame([[watermark_text] + [''] * (len(df.columns)-1)], columns=df.columns)], ignore_index=True)
            df_with_wm.to_csv(path, index=False, sep=";", encoding="utf-8-sig")
        elif format == "json":
            # JSON: Metadata alanı ekle
            data = df.to_dict(orient="records")
            output = {
                "_generated_by": "Opradox",
                "_website": SITE_DOMAIN,
                "_generated_at": datetime.now().isoformat(),
                "data": data
            }
            with open(path, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)
        else:
            # Excel: Son satıra watermark
            df_with_wm = pd.concat([df, pd.DataFrame([[watermark_text] + [''] * (len(df.columns)-1)], columns=df.columns)], ignore_index=True)
            df_with_wm.to_excel(path, index=False, engine="xlsxwriter")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya oluşturma hatası: {e}")
    
    # In-memory store'a kaydet (mevcut davranış)
    SHARE_STORE[share_id] = {
        "path": str(path),
        "filename": filename,
        "created_at": time.time(),
        "format": format
    }
    
    # FAZ-ES-5: DB'ye de persist et (restart sonrası kalıcılık)
    try:
        from .storage import insert_share_link
        from .storage_models import ShareLink
        
        share_link = ShareLink(
            share_id=share_id,
            scenario_id=scenario_id,
            file_path=str(path),
            created_at=time.time(),
            expires_at=time.time() + SHARE_EXPIRY_SECONDS,
            watermark_applied=True
        )
        insert_share_link(share_link)
    except Exception as e:
        print(f"[SHARE] DB persist warning: {e}")
    
    # Temizlik (eski share'leri sil - in-memory)
    current_time = time.time()
    expired_ids = [sid for sid, sdata in SHARE_STORE.items() 
                   if current_time - sdata["created_at"] > SHARE_EXPIRY_SECONDS]
    for sid in expired_ids:
        try:
            os.remove(SHARE_STORE[sid]["path"])
        except:
            pass
        del SHARE_STORE[sid]
    
    return {
        "share_id": share_id,
        "share_url": f"/s/{share_id}",
        "full_url": f"http://localhost:8000/s/{share_id}",
        "expires_in": "24 saat",
        "filename": filename
    }


@app.get("/s/{share_id}")
async def get_shared_file(share_id: str):
    """
    Paylaşılan dosyayı indir.
    FAZ-ES-5: Önce in-memory, sonra DB'ye fallback (restart sonrası kalıcılık).
    """
    from fastapi.responses import FileResponse
    from pathlib import Path
    import os
    
    share_data = None
    from_db = False
    
    # 1. Önce in-memory SHARE_STORE'a bak
    if share_id in SHARE_STORE:
        share_data = SHARE_STORE[share_id]
        created_at = share_data["created_at"]
        file_path = share_data["path"]
        filename = share_data["filename"]
    else:
        # 2. In-memory'de yoksa DB'ye bak (FAZ-ES-5: restart persistence)
        try:
            from .storage import get_share_link, delete_share_link, safe_delete_file, increment_share_downloads
            
            db_link = get_share_link(share_id)
            if db_link:
                from_db = True
                created_at = db_link.created_at
                file_path = db_link.file_path
                filename = Path(db_link.file_path).name
                
                # Expiry check (DB)
                if db_link.is_expired():
                    # Cleanup: dosya sil, DB kaydı sil
                    safe_delete_file(Path(file_path))
                    delete_share_link(share_id)
                    raise HTTPException(status_code=410, detail="Bu paylaşım linkinin süresi dolmuş.")
        except HTTPException:
            raise
        except Exception as e:
            print(f"[SHARE] DB lookup error: {e}")
    
    # 3. Hiçbirinde bulunamadıysa 404
    if share_data is None and not from_db:
        raise HTTPException(status_code=404, detail="Paylaşım linki bulunamadı veya süresi dolmuş.")
    
    # 4. In-memory expiry check
    if share_data and time.time() - created_at > SHARE_EXPIRY_SECONDS:
        del SHARE_STORE[share_id]
        raise HTTPException(status_code=410, detail="Bu paylaşım linkinin süresi dolmuş.")
    
    # 5. Dosya var mı kontrol et
    if not os.path.exists(file_path):
        # DB veya in-memory'den temizle
        if share_id in SHARE_STORE:
            del SHARE_STORE[share_id]
        try:
            from .storage import delete_share_link
            delete_share_link(share_id)
        except:
            pass
        raise HTTPException(status_code=404, detail="Paylaşım dosyası bulunamadı.")
    
    # 6. Download count güncelle (DB varsa)
    if from_db:
        try:
            from .storage import increment_share_downloads
            increment_share_downloads(share_id)
        except:
            pass
    
    return FileResponse(
        file_path, 
        filename=filename,
        media_type="application/octet-stream"
    )


# -------------------------------------------------------
# STATIC FILES & FRONTEND SERVING
# -------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

# Frontend dizinini belirle (backend/app/main.py -> backend/ -> root -> frontend)
# main.py bir alt klasörde (backend/app), bu yüzden 2 üst dizine çıkıp frontend'e gidiyoruz.
# Ancak scratch/opradox yapısına göre:
# backend/app/main.py -> parent -> backend -> parent -> opradox -> frontend
# Yani 3 seviye mi? Hayır:
# main.py konumu: .../opradox/backend/app/main.py
# parents[0] = .../opradox/backend/app
# parents[1] = .../opradox/backend
# parents[2] = .../opradox
# frontend = .../opradox/frontend

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
# app.mount("/img", StaticFiles(directory=FRONTEND_DIR / "img"), name="img")

# IMG dosyaları için özel endpoint (no-cache headers ile) - LOGO/CACHE PRB ÇÖZÜMÜ
@app.get("/img/{filename:path}")
async def serve_img_no_cache(filename: str):
    from fastapi.responses import FileResponse
    img_path = FRONTEND_DIR / "img" / filename
    if img_path.exists():
        return FileResponse(
            img_path, 
            media_type="image/png", 
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    raise HTTPException(status_code=404, detail="Image file not found")

app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")

# JS dosyaları için özel endpoint (DEVRE DIŞI - Module Loading Fix)
# @app.get("/js/{filename:path}")
# async def serve_js_no_cache(filename: str):
#     from fastapi.responses import FileResponse
#     js_path = FRONTEND_DIR / "js" / filename
#     if js_path.exists():
#         return FileResponse(
#             js_path, 
#             media_type="application/javascript",
#             headers={
#                 "Cache-Control": "no-cache, no-store, must-revalidate",
#                 "Pragma": "no-cache",
#                 "Expires": "0"
#             }
#         )
#     raise HTTPException(status_code=404, detail="JS file not found")

# HELP dosyaları için endpoint (video tutorials)
@app.get("/help/{filename:path}")
async def serve_help_files(filename: str):
    from fastapi.responses import FileResponse
    help_path = FRONTEND_DIR / "help" / filename
    if help_path.exists():
        media_type = "image/webp" if filename.endswith(".webp") else "application/octet-stream"
        return FileResponse(
            help_path, 
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=86400"  # 1 day cache for videos
            }
        )
    raise HTTPException(status_code=404, detail="Help file not found")

# Admin paneli veya diğer statik dosyalar için root mount
# DİKKAT: Root mount diğer rotaları ezebilir, bu yüzden özel statik klasörleri yukarıda tanımladık.
# Config dosyaları için endpoint (global_options.json)
@app.get("/config/{filename:path}")
async def serve_config(filename: str):
    from fastapi.responses import FileResponse
    config_path = FRONTEND_DIR / "config" / filename
    if config_path.exists():
        return FileResponse(
            config_path,
            media_type="application/json",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    raise HTTPException(status_code=404, detail=f"Config file not found: {filename}")

# Ana sayfa için özel endpoint (Hub):

@app.get("/")
async def read_index():
    return FileResponse(
        FRONTEND_DIR / "hub.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

# Legacy index.html isteklerini excel.html'e yönlendir
@app.get("/index.html")
async def redirect_index():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/excel.html", status_code=301)

@app.get("/login.html")
async def read_login():
    return FileResponse(
        FRONTEND_DIR / "login.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/admin.html")
async def read_admin():
    return FileResponse(
        FRONTEND_DIR / "admin.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/hub.html")
async def read_hub():
    return FileResponse(
        FRONTEND_DIR / "hub.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/excel.html")
async def read_excel():
    return FileResponse(
        FRONTEND_DIR / "excel.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/viz.html")
async def read_viz():
    return FileResponse(
        FRONTEND_DIR / "viz.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/pdf.html")
async def read_pdf():
    return FileResponse(
        FRONTEND_DIR / "pdf.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/ocr.html")
async def read_ocr():
    return FileResponse(
        FRONTEND_DIR / "ocr.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

# -------------------------------------------------------
# LOCAL SERVER
# -------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8100, reload=True)
