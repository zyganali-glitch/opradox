"""
Health API - Opradox Excel Studio
Lightweight health check endpoint for boot guard and monitoring.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from pathlib import Path
import uuid
import time
import json
import os

router = APIRouter(tags=["health"])

# Track server start time for uptime calculation
_SERVER_START_TIME = time.time()

# Build identification (set by Docker/scripts)
_BUILD_ID = os.environ.get("BUILD_ID", "dev")

# Selftest cache path
_SELFTEST_CACHE_PATH = Path(__file__).resolve().parent.parent / "logs" / "selftest_last.json"
_SELFTEST_STALE_THRESHOLD_SECONDS = 24 * 60 * 60  # 24 saat


def _get_selftest_quick_last() -> Dict[str, Any]:
    """
    Read last selftest result from cache (cache-only, no execution).
    Returns summary dict for /health response.
    """
    try:
        if not _SELFTEST_CACHE_PATH.exists():
            return {"available": False}
        
        with open(_SELFTEST_CACHE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Check if stale
        ts_utc_str = data.get("ts_utc", "")
        stale = False
        if ts_utc_str:
            try:
                # Parse ISO timestamp
                ts = datetime.fromisoformat(ts_utc_str.replace("Z", "+00:00"))
                age_seconds = (datetime.now(timezone.utc) - ts).total_seconds()
                stale = age_seconds > _SELFTEST_STALE_THRESHOLD_SECONDS
            except Exception:
                stale = True
        
        return {
            "available": True,
            "status": data.get("status", "UNKNOWN"),
            "ts_utc": ts_utc_str,
            "duration_ms": data.get("duration_ms"),
            "summary": data.get("summary"),
            "stale": stale
        }
    except Exception:
        return {"available": False}


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Lightweight health check endpoint.
    Returns server status, versions, and basic self-check results.
    
    Returns:
        - status: "ok" | "degraded"
        - service: "excel_studio"
        - ts_utc: ISO timestamp
        - uptime_seconds: Server uptime
        - versions: Dict of library versions
        - scheduler_available: bool
        - selftest_quick_last: Last selftest result (cache-only)
        - notes: List of warnings/issues
        - request_id: Short UUID for tracking
    """
    notes: List[str] = []
    status = "ok"
    versions: Dict[str, str] = {}
    
    # Generate request ID
    request_id = str(uuid.uuid4())[:8]
    
    # Check Python version
    import sys
    versions["python"] = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    
    # Check FastAPI version
    try:
        import fastapi
        versions["fastapi"] = fastapi.__version__
    except Exception:
        versions["fastapi"] = "unknown"
    
    # Check pandas (critical for Excel processing)
    try:
        import pandas as pd
        versions["pandas"] = pd.__version__
        
        # Mini self-check: create small df and calculate
        test_df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
        _ = test_df["a"].sum()
        _ = test_df["b"].mean()
    except ImportError:
        versions["pandas"] = "NOT_INSTALLED"
        status = "degraded"
        notes.append("pandas not installed - Excel processing will fail")
    except Exception as e:
        status = "degraded"
        notes.append(f"pandas self-check failed: {str(e)[:50]}")
    
    # Check numpy
    try:
        import numpy as np
        versions["numpy"] = np.__version__
    except ImportError:
        versions["numpy"] = "NOT_INSTALLED"
    except Exception:
        versions["numpy"] = "unknown"
    
    # Check openpyxl (Excel reading)
    try:
        import openpyxl
        versions["openpyxl"] = openpyxl.__version__
    except ImportError:
        versions["openpyxl"] = "NOT_INSTALLED"
        status = "degraded"
        notes.append("openpyxl not installed - Excel file reading may fail")
    except Exception:
        versions["openpyxl"] = "unknown"
    
    # Check xlsxwriter (Excel writing)
    try:
        import xlsxwriter
        versions["xlsxwriter"] = xlsxwriter.__version__
    except ImportError:
        versions["xlsxwriter"] = "NOT_INSTALLED"
        notes.append("xlsxwriter not installed - Excel export may fail")
    except Exception:
        versions["xlsxwriter"] = "unknown"
    
    # Check APScheduler availability
    scheduler_available = False
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        scheduler_available = True
    except ImportError:
        pass
    
    # Calculate uptime
    uptime_seconds = int(time.time() - _SERVER_START_TIME)
    
    # Get selftest cache (FAZ-ES-3: cache-only, no execution)
    selftest_quick_last = _get_selftest_quick_last()
    
    # FAZ-ES-5: Get storage status
    storage_status = None
    try:
        from .storage import get_storage_status
        storage_status = get_storage_status()
    except Exception as e:
        storage_status = {"ok": False, "error": str(e)[:50]}
    
    # FAZ-ES-6: Get queue status
    queue_status = None
    try:
        from .queue_storage import count_by_status
        from .queue_engine import is_server_busy
        queue_status = {
            "ok": True,
            "queued": count_by_status("queued"),
            "running": count_by_status("running"),
            "global_busy": is_server_busy()
        }
    except Exception as e:
        queue_status = {"ok": False, "error": str(e)[:50]}
    
    return {
        "status": status,
        "service": "excel_studio",
        "build_id": _BUILD_ID,
        "ts_utc": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "versions": versions,
        "scheduler_available": scheduler_available,
        "storage": storage_status,
        "queue": queue_status,
        "selftest_quick_last": selftest_quick_last,
        "notes": notes if notes else None,
        "request_id": request_id
    }
