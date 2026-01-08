"""
Scheduled Reports API - Opradox Visual Studio
Zamanlanmış rapor gönderimi (APScheduler)
FAZ-ES-5: DB persistence eklendi
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from datetime import datetime
import json
import time

router = APIRouter(prefix="/viz/schedule", tags=["scheduled-reports"])

# Zamanlanmış görevleri saklamak için in-memory cache (runtime aktif kullanım)
# FAZ-ES-5: DB ile senkronize tutulacak
SCHEDULED_JOBS: dict = {}


def _persist_job_to_db(job_id: str, job_data: dict):
    """FAZ-ES-5: Job'u DB'ye persist et (best-effort)."""
    try:
        from .storage import upsert_scheduled_job
        from .storage_models import ScheduledJob
        
        now = time.time()
        scheduled_job = ScheduledJob(
            job_id=job_id,
            payload_json=json.dumps(job_data, ensure_ascii=False),
            created_at=job_data.get("_db_created_at", now),
            updated_at=now,
            enabled=job_data.get("enabled", True),
            last_run_at=None,
            next_run_at=None,
            error_last=None
        )
        upsert_scheduled_job(scheduled_job)
    except Exception as e:
        print(f"[SCHEDULE] DB persist warning: {e}")


def _delete_job_from_db(job_id: str):
    """FAZ-ES-5: Job'u DB'den sil (best-effort)."""
    try:
        from .storage import delete_scheduled_job
        delete_scheduled_job(job_id)
    except Exception as e:
        print(f"[SCHEDULE] DB delete warning: {e}")


def _load_jobs_from_db():
    """FAZ-ES-5: Startup'ta DB'den job'ları yükle."""
    try:
        from .storage import list_scheduled_jobs
        
        db_jobs = list_scheduled_jobs(enabled_only=False)
        loaded_count = 0
        
        for job in db_jobs:
            try:
                job_data = json.loads(job.payload_json)
                job_data["_db_created_at"] = job.created_at
                SCHEDULED_JOBS[job.job_id] = job_data
                loaded_count += 1
            except Exception:
                pass
        
        if loaded_count > 0:
            print(f"[SCHEDULE] Loaded {loaded_count} jobs from DB")
    except Exception as e:
        print(f"[SCHEDULE] DB load warning: {e}")


class ScheduleRequest(BaseModel):
    """Zamanlanmış rapor isteği"""
    name: str
    recipients: List[str]  # E-posta adresleri
    schedule_type: str  # daily, weekly, monthly
    schedule_time: str  # HH:MM formatında
    schedule_day: Optional[int] = None  # Haftalık için gün (0-6), aylık için gün (1-31)
    dashboard_id: str
    format: str = "pdf"  # pdf, xlsx, csv
    include_data: bool = False
    enabled: bool = True


class ScheduleResponse(BaseModel):
    """Zamanlanmış rapor yanıtı"""
    job_id: str
    name: str
    next_run: str
    enabled: bool


@router.post("/create")
async def create_scheduled_report(request: ScheduleRequest):
    """
    Yeni zamanlanmış rapor oluşturur.
    """
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger
        
        job_id = f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Cron trigger oluştur
        hour, minute = request.schedule_time.split(":")
        
        if request.schedule_type == "daily":
            trigger = CronTrigger(hour=int(hour), minute=int(minute))
        elif request.schedule_type == "weekly":
            day_of_week = request.schedule_day if request.schedule_day is not None else 0
            trigger = CronTrigger(day_of_week=day_of_week, hour=int(hour), minute=int(minute))
        elif request.schedule_type == "monthly":
            day = request.schedule_day if request.schedule_day is not None else 1
            trigger = CronTrigger(day=day, hour=int(hour), minute=int(minute))
        else:
            raise HTTPException(status_code=400, detail="Geçersiz schedule_type")
        
        # Job bilgilerini kaydet
        SCHEDULED_JOBS[job_id] = {
            "id": job_id,
            "name": request.name,
            "recipients": request.recipients,
            "schedule_type": request.schedule_type,
            "schedule_time": request.schedule_time,
            "schedule_day": request.schedule_day,
            "dashboard_id": request.dashboard_id,
            "format": request.format,
            "include_data": request.include_data,
            "enabled": request.enabled,
            "created_at": datetime.now().isoformat(),
            "last_run": None,
            "next_run": trigger.get_next_fire_time(None, datetime.now()).isoformat() if trigger else None
        }
        
        # FAZ-ES-5: DB'ye persist et
        _persist_job_to_db(job_id, SCHEDULED_JOBS[job_id])
        
        return {
            "success": True,
            "job_id": job_id,
            "message": f"'{request.name}' zamanlanmış raporu oluşturuldu",
            "next_run": SCHEDULED_JOBS[job_id]["next_run"]
        }
        
    except ImportError:
        # APScheduler yüklü değilse basit kayıt yap
        job_id = f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        SCHEDULED_JOBS[job_id] = {
            "id": job_id,
            "name": request.name,
            "recipients": request.recipients,
            "schedule_type": request.schedule_type,
            "schedule_time": request.schedule_time,
            "dashboard_id": request.dashboard_id,
            "format": request.format,
            "enabled": request.enabled,
            "created_at": datetime.now().isoformat(),
            "note": "APScheduler yüklü değil - pip install apscheduler"
        }
        
        # FAZ-ES-5: DB'ye persist et (APScheduler olmasa bile)
        _persist_job_to_db(job_id, SCHEDULED_JOBS[job_id])
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Rapor kaydedildi (APScheduler kurulu değil, manuel tetikleme gerekli)",
            "warning": "pip install apscheduler"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list")
async def list_scheduled_reports():
    """
    Tüm zamanlanmış raporları listeler.
    """
    return {
        "jobs": list(SCHEDULED_JOBS.values()),
        "count": len(SCHEDULED_JOBS)
    }


@router.get("/{job_id}")
async def get_scheduled_report(job_id: str):
    """
    Belirtilen zamanlanmış raporu getirir.
    """
    if job_id not in SCHEDULED_JOBS:
        raise HTTPException(status_code=404, detail="Zamanlanmış rapor bulunamadı")
    
    return SCHEDULED_JOBS[job_id]


@router.put("/{job_id}/toggle")
async def toggle_scheduled_report(job_id: str):
    """
    Zamanlanmış raporu etkinleştirir/devre dışı bırakır.
    """
    if job_id not in SCHEDULED_JOBS:
        raise HTTPException(status_code=404, detail="Zamanlanmış rapor bulunamadı")
    
    SCHEDULED_JOBS[job_id]["enabled"] = not SCHEDULED_JOBS[job_id]["enabled"]
    status = "etkinleştirildi" if SCHEDULED_JOBS[job_id]["enabled"] else "devre dışı bırakıldı"
    
    # FAZ-ES-5: DB güncellemesi
    _persist_job_to_db(job_id, SCHEDULED_JOBS[job_id])
    
    return {
        "success": True,
        "job_id": job_id,
        "enabled": SCHEDULED_JOBS[job_id]["enabled"],
        "message": f"Rapor {status}"
    }


@router.delete("/{job_id}")
async def delete_scheduled_report(job_id: str):
    """
    Zamanlanmış raporu siler.
    """
    if job_id not in SCHEDULED_JOBS:
        raise HTTPException(status_code=404, detail="Zamanlanmış rapor bulunamadı")
    
    del SCHEDULED_JOBS[job_id]
    
    # FAZ-ES-5: DB'den sil
    _delete_job_from_db(job_id)
    
    return {
        "success": True,
        "message": "Zamanlanmış rapor silindi"
    }


@router.post("/{job_id}/run-now")
async def run_report_now(job_id: str, background_tasks: BackgroundTasks):
    """
    Zamanlanmış raporu hemen çalıştırır.
    """
    if job_id not in SCHEDULED_JOBS:
        raise HTTPException(status_code=404, detail="Zamanlanmış rapor bulunamadı")
    
    job = SCHEDULED_JOBS[job_id]
    
    # Arka planda rapor gönder
    background_tasks.add_task(send_report_email, job)
    
    SCHEDULED_JOBS[job_id]["last_run"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": f"Rapor '{job['name']}' e-posta gönderimi başlatıldı",
        "recipients": job["recipients"]
    }


async def send_report_email(job: dict):
    """
    Rapor e-postası gönderir.
    Bu fonksiyon arka planda çalışır.
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email import encoders
    
    try:
        # E-posta ayarları (ortam değişkenlerinden alınmalı)
        SMTP_HOST = "smtp.gmail.com"
        SMTP_PORT = 587
        SMTP_USER = ""  # Ortam değişkeninden
        SMTP_PASS = ""  # Ortam değişkeninden
        
        if not SMTP_USER or not SMTP_PASS:
            print(f"[SCHEDULED REPORT] E-posta ayarları eksik: {job['name']}")
            return
        
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = ", ".join(job["recipients"])
        msg["Subject"] = f"Opradox Raporu: {job['name']}"
        
        body = f"""
        Merhaba,
        
        '{job['name']}' zamanlanmış raporunuz hazır.
        
        Dashboard ID: {job['dashboard_id']}
        Format: {job['format'].upper()}
        
        Bu e-posta otomatik olarak Opradox tarafından gönderilmiştir.
        """
        
        msg.attach(MIMEText(body, "plain"))
        
        # SMTP bağlantısı
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        print(f"[SCHEDULED REPORT] E-posta gönderildi: {job['name']} -> {job['recipients']}")
        
    except Exception as e:
        print(f"[SCHEDULED REPORT] E-posta hatası: {e}")


# E-posta test endpoint'i
@router.post("/test-email")
async def test_email(email: str, background_tasks: BackgroundTasks):
    """
    E-posta yapılandırmasını test eder.
    """
    test_job = {
        "name": "Test Raporu",
        "recipients": [email],
        "dashboard_id": "test",
        "format": "pdf"
    }
    
    background_tasks.add_task(send_report_email, test_job)
    
    return {
        "success": True,
        "message": f"Test e-postası {email} adresine gönderiliyor..."
    }
