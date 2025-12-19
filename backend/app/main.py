from __future__ import annotations

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

        
    # --- 6) JSON Yanıtını hazırla ---
    summary_raw = result.get("summary", "Senaryo başarıyla çalıştırıldı.")
    
    # Frontend string bekliyor, dict gelirse markdown listesine çevir
    if isinstance(summary_raw, dict):
        summary_lines = []
        for k, v in summary_raw.items():
            formatted_key = k.replace("_", " ").title()
            summary_lines.append(f"- **{formatted_key}:** {v}")
        summary = "\n".join(summary_lines)
    else:
        summary = str(summary_raw)
    technical_details = result.get("technical_details")

    # Eğer senaryo teknik detay vermediyse otomatik üret (Code Summary)
    if not technical_details:
         technical_details = {
             "scenario_id": scenario_id,
             "parameters": params_dict,
             "input_rows": len(df),
             "input_columns": list(df.columns),
             "note": "Auto-generated summary because scenario did not return details."
         }

    return {
        "summary": summary,
        "technical_details": technical_details,
        "excel_available": has_output,
        "excel_filename": "", # Artık dinamik
        "scenario_id": scenario_id,
        "data_columns": list(df.columns) 
    }


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
    
    # Store'a kaydet
    SHARE_STORE[share_id] = {
        "path": str(path),
        "filename": filename,
        "created_at": time.time(),
        "format": format
    }
    
    # Temizlik (eski share'leri sil)
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
        "full_url": f"http://localhost:8000/s/{share_id}",  # Production'da domain ile değişecek
        "expires_in": "24 saat",
        "filename": filename
    }


@app.get("/s/{share_id}")
async def get_shared_file(share_id: str):
    """
    Paylaşılan dosyayı indir.
    """
    from fastapi.responses import FileResponse
    
    if share_id not in SHARE_STORE:
        raise HTTPException(status_code=404, detail="Paylaşım linki bulunamadı veya süresi dolmuş.")
    
    share_data = SHARE_STORE[share_id]
    
    # Expiry check
    if time.time() - share_data["created_at"] > SHARE_EXPIRY_SECONDS:
        del SHARE_STORE[share_id]
        raise HTTPException(status_code=410, detail="Bu paylaşım linkinin süresi dolmuş.")
    
    return FileResponse(
        share_data["path"], 
        filename=share_data["filename"],
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

# JS dosyaları için özel endpoint (no-cache headers ile)
@app.get("/js/{filename:path}")
async def serve_js_no_cache(filename: str):
    from fastapi.responses import FileResponse
    js_path = FRONTEND_DIR / "js" / filename
    if js_path.exists():
        return FileResponse(
            js_path, 
            media_type="application/javascript",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    raise HTTPException(status_code=404, detail="JS file not found")

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

# Ana sayfa için özel endpoint:

@app.get("/")
async def read_index():
    return FileResponse(
        FRONTEND_DIR / "index.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

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

# -------------------------------------------------------
# LOCAL SERVER
# -------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8100, reload=True)
