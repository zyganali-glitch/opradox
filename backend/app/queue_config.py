"""
Queue Config - Opradox Excel Studio
FAZ-ES-6: Central Smart Queue configuration and constants.
"""
from __future__ import annotations
from typing import Dict, Any

# ============================================================
# CAPACITY CONFIGURATION
# ============================================================

# Global maximum concurrent jobs across all services
GLOBAL_MAX_CONCURRENT = 1

# Per-service maximum concurrent jobs
SERVICE_CAPACITY: Dict[str, int] = {
    "excel": 1,
    "pdf": 1,
    "ocr": 1,
}

# Average duration per service (for ETA calculation)
SERVICE_AVG_DURATION_MS: Dict[str, int] = {
    "excel": 5000,   # 5 seconds
    "pdf": 3000,     # 3 seconds
    "ocr": 4000,     # 4 seconds
}

# ============================================================
# ENGINE CONFIGURATION
# ============================================================

# How often the engine checks for jobs to dispatch (ms)
ENGINE_POLL_INTERVAL_MS = 500

# What to do with "running" jobs found on startup
# "requeue" = move back to queued (safe retry)
# "fail" = mark as failed
RESTART_RECOVERY_MODE = "requeue"

# Anti-hog: max consecutive jobs from same user
MAX_CONSECUTIVE_SAME_USER = 2

# ============================================================
# JOB STATUS CONSTANTS
# ============================================================

class JobStatus:
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAIL = "fail"
    CANCELED = "canceled"

# ============================================================
# TR/EN MODAL TEXTS
# ============================================================

QUEUE_TEXTS: Dict[str, Dict[str, str]] = {
    "tr": {
        "modal.title_wait": "İşlem Sıraya Alındı",
        "modal.title_turn": "Sıranız Geldi",
        "modal.body_wait": "Sunucu kapasitesi sınırlı olduğu için işleminiz sıraya alındı. Kaynaklar müsait olduğunda otomatik olarak başlatılacaktır.",
        "modal.body_turn": "Kaynaklar müsait. İşleminiz başlatılıyor.",
        "modal.body_done": "İşlem tamamlandı.",
        "modal.body_fail": "İşlem tamamlanamadı. Lütfen tekrar deneyin veya tanı kayıtlarını kontrol edin.",
        "modal.queue_line": "Önünüzde {position} kişi var.",
        "modal.eta_line": "Yaklaşık süre: {mmss}",
        "modal.limit_note": "Kaynakları verimli kullanmak amacıyla bu işlem için geçerli limitler: {limits}. Bu limitler ileride artırılabilir.",
        "modal.limit_max_mb": "Maksimum dosya boyutu: {max_mb} MB",
        "modal.limit_max_rows": "Maksimum satır: {max_rows}",
        "modal.limit_max_pages": "Maksimum sayfa: {max_pages}",
        "modal.btn_cancel": "İptal Et",
        "modal.btn_close": "Kapat",
        "modal.safe_to_leave": "Bu pencereden çıkabilirsiniz, işlem sırada kalır.",
        "placeholder.not_enabled": "Bu modül henüz aktif değil. Yakında eklenecek.",
    },
    "en": {
        "modal.title_wait": "Job Queued",
        "modal.title_turn": "It's Your Turn",
        "modal.body_wait": "Due to limited server capacity, your job has been placed in a queue. It will start automatically when resources are available.",
        "modal.body_turn": "Resources are available. Your job is starting.",
        "modal.body_done": "Completed.",
        "modal.body_fail": "The job could not be completed. Please try again or check the diagnostics.",
        "modal.queue_line": "{position} people ahead of you.",
        "modal.eta_line": "Estimated time: {mmss}",
        "modal.limit_note": "To use resources efficiently, the current limits for this operation are: {limits}. These limits may be increased in the future.",
        "modal.limit_max_mb": "Maximum file size: {max_mb} MB",
        "modal.limit_max_rows": "Maximum rows: {max_rows}",
        "modal.limit_max_pages": "Maximum pages: {max_pages}",
        "modal.btn_cancel": "Cancel",
        "modal.btn_close": "Close",
        "modal.safe_to_leave": "You can leave this page, your job will remain in the queue.",
        "placeholder.not_enabled": "This module is not enabled yet. Coming soon.",
    }
}


def get_text(key: str, lang: str = "tr", **kwargs) -> str:
    """Get localized text with optional placeholders."""
    texts = QUEUE_TEXTS.get(lang, QUEUE_TEXTS["en"])
    text = texts.get(key, key)
    if kwargs:
        try:
            text = text.format(**kwargs)
        except KeyError:
            pass
    return text


def get_service_capacity(service: str) -> int:
    """Get capacity for a service."""
    return SERVICE_CAPACITY.get(service, 1)


def get_avg_duration_ms(service: str) -> int:
    """Get average duration for ETA calculation."""
    return SERVICE_AVG_DURATION_MS.get(service, 5000)
