"""
Storage - Opradox Excel Studio
SQLite adapter for persistent storage of run results, share links, scheduled jobs.
"""
from __future__ import annotations
import sqlite3
import json
import time
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
import threading

from .storage_models import RunResult, ShareLink, ScheduledJob

# Thread-local storage for connections
_local = threading.local()

# Database path
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "excelstudio.db"

# File storage paths
SHARED_FILES_DIR = Path(__file__).resolve().parent.parent / "shared_files"
RESULTS_DIR = SHARED_FILES_DIR / "results"
SHARES_DIR = SHARED_FILES_DIR / "shares"


def _ensure_dirs():
    """Ensure all required directories exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    SHARES_DIR.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    """Get thread-local database connection."""
    if not hasattr(_local, 'connection') or _local.connection is None:
        _ensure_dirs()
        _local.connection = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        _local.connection.row_factory = sqlite3.Row
    return _local.connection


@contextmanager
def get_cursor():
    """Context manager for database cursor with auto-commit."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def init_db():
    """Initialize database schema."""
    _ensure_dirs()
    
    with get_cursor() as cursor:
        # run_results table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS run_results (
                scenario_id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                format TEXT DEFAULT 'xlsx',
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                summary_json TEXT,
                build_id TEXT
            )
        """)
        
        # share_links table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS share_links (
                share_id TEXT PRIMARY KEY,
                scenario_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                created_at REAL NOT NULL,
                expires_at REAL NOT NULL,
                watermark_applied INTEGER DEFAULT 0,
                downloads_count INTEGER DEFAULT 0
            )
        """)
        
        # scheduled_jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_jobs (
                job_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                enabled INTEGER DEFAULT 1,
                last_run_at REAL,
                next_run_at REAL,
                error_last TEXT
            )
        """)
        
        # Indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_share_expires 
            ON share_links(expires_at)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_jobs_enabled 
            ON scheduled_jobs(enabled)
        """)
    
    print("[STORAGE] Database initialized")


# ============================================================
# RUN RESULTS CRUD
# ============================================================

def upsert_run_result(result: RunResult) -> None:
    """Insert or update a run result."""
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO run_results 
            (scenario_id, file_path, format, created_at, updated_at, summary_json, build_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(scenario_id) DO UPDATE SET
                file_path = excluded.file_path,
                format = excluded.format,
                updated_at = excluded.updated_at,
                summary_json = excluded.summary_json,
                build_id = excluded.build_id
        """, (
            result.scenario_id,
            result.file_path,
            result.format,
            result.created_at,
            result.updated_at,
            result.summary_json,
            result.build_id
        ))


def get_run_result(scenario_id: str) -> Optional[RunResult]:
    """Get run result by scenario ID."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM run_results WHERE scenario_id = ?",
            (scenario_id,)
        )
        row = cursor.fetchone()
        if row:
            return RunResult(
                scenario_id=row["scenario_id"],
                file_path=row["file_path"],
                format=row["format"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                summary_json=row["summary_json"],
                build_id=row["build_id"]
            )
    return None


def delete_run_result(scenario_id: str) -> bool:
    """Delete run result."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM run_results WHERE scenario_id = ?", (scenario_id,))
        return cursor.rowcount > 0


def count_run_results() -> int:
    """Count total run results."""
    with get_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM run_results")
        return cursor.fetchone()[0]


# ============================================================
# SHARE LINKS CRUD
# ============================================================

def insert_share_link(link: ShareLink) -> None:
    """Insert a share link."""
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO share_links 
            (share_id, scenario_id, file_path, created_at, expires_at, watermark_applied, downloads_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            link.share_id,
            link.scenario_id,
            link.file_path,
            link.created_at,
            link.expires_at,
            1 if link.watermark_applied else 0,
            link.downloads_count
        ))


def get_share_link(share_id: str) -> Optional[ShareLink]:
    """Get share link by ID."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM share_links WHERE share_id = ?",
            (share_id,)
        )
        row = cursor.fetchone()
        if row:
            return ShareLink(
                share_id=row["share_id"],
                scenario_id=row["scenario_id"],
                file_path=row["file_path"],
                created_at=row["created_at"],
                expires_at=row["expires_at"],
                watermark_applied=bool(row["watermark_applied"]),
                downloads_count=row["downloads_count"]
            )
    return None


def increment_share_downloads(share_id: str) -> None:
    """Increment download count for a share link."""
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE share_links SET downloads_count = downloads_count + 1 WHERE share_id = ?",
            (share_id,)
        )


def delete_share_link(share_id: str) -> bool:
    """Delete share link."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM share_links WHERE share_id = ?", (share_id,))
        return cursor.rowcount > 0


def get_expired_share_links() -> List[ShareLink]:
    """Get all expired share links."""
    now = time.time()
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM share_links WHERE expires_at < ?",
            (now,)
        )
        return [
            ShareLink(
                share_id=row["share_id"],
                scenario_id=row["scenario_id"],
                file_path=row["file_path"],
                created_at=row["created_at"],
                expires_at=row["expires_at"],
                watermark_applied=bool(row["watermark_applied"]),
                downloads_count=row["downloads_count"]
            )
            for row in cursor.fetchall()
        ]


def count_share_links() -> int:
    """Count total share links."""
    with get_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM share_links")
        return cursor.fetchone()[0]


# ============================================================
# SCHEDULED JOBS CRUD
# ============================================================

def upsert_scheduled_job(job: ScheduledJob) -> None:
    """Insert or update a scheduled job."""
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO scheduled_jobs 
            (job_id, payload_json, created_at, updated_at, enabled, last_run_at, next_run_at, error_last)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                payload_json = excluded.payload_json,
                updated_at = excluded.updated_at,
                enabled = excluded.enabled,
                last_run_at = excluded.last_run_at,
                next_run_at = excluded.next_run_at,
                error_last = excluded.error_last
        """, (
            job.job_id,
            job.payload_json,
            job.created_at,
            job.updated_at,
            1 if job.enabled else 0,
            job.last_run_at,
            job.next_run_at,
            job.error_last
        ))


def get_scheduled_job(job_id: str) -> Optional[ScheduledJob]:
    """Get scheduled job by ID."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM scheduled_jobs WHERE job_id = ?",
            (job_id,)
        )
        row = cursor.fetchone()
        if row:
            return ScheduledJob(
                job_id=row["job_id"],
                payload_json=row["payload_json"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                enabled=bool(row["enabled"]),
                last_run_at=row["last_run_at"],
                next_run_at=row["next_run_at"],
                error_last=row["error_last"]
            )
    return None


def list_scheduled_jobs(enabled_only: bool = False) -> List[ScheduledJob]:
    """List all scheduled jobs."""
    with get_cursor() as cursor:
        if enabled_only:
            cursor.execute("SELECT * FROM scheduled_jobs WHERE enabled = 1")
        else:
            cursor.execute("SELECT * FROM scheduled_jobs")
        
        return [
            ScheduledJob(
                job_id=row["job_id"],
                payload_json=row["payload_json"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                enabled=bool(row["enabled"]),
                last_run_at=row["last_run_at"],
                next_run_at=row["next_run_at"],
                error_last=row["error_last"]
            )
            for row in cursor.fetchall()
        ]


def delete_scheduled_job(job_id: str) -> bool:
    """Delete scheduled job."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM scheduled_jobs WHERE job_id = ?", (job_id,))
        return cursor.rowcount > 0


def update_job_run_status(job_id: str, last_run_at: float, next_run_at: Optional[float], error: Optional[str] = None) -> None:
    """Update job run status."""
    with get_cursor() as cursor:
        cursor.execute("""
            UPDATE scheduled_jobs 
            SET last_run_at = ?, next_run_at = ?, error_last = ?, updated_at = ?
            WHERE job_id = ?
        """, (last_run_at, next_run_at, error, time.time(), job_id))


def count_scheduled_jobs() -> int:
    """Count total scheduled jobs."""
    with get_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM scheduled_jobs")
        return cursor.fetchone()[0]


# ============================================================
# ATOMIC FILE WRITE HELPERS
# ============================================================

def atomic_write_bytes(path: Path, data: bytes) -> None:
    """Write bytes to file atomically (temp + rename)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    try:
        with open(temp_path, "wb") as f:
            f.write(data)
        temp_path.replace(path)
    except Exception:
        if temp_path.exists():
            temp_path.unlink()
        raise


def safe_delete_file(path: Path) -> bool:
    """Safely delete a file (best-effort)."""
    try:
        if path.exists():
            path.unlink()
            return True
    except Exception:
        pass
    return False


# ============================================================
# STORAGE STATUS
# ============================================================

def get_storage_status() -> Dict[str, Any]:
    """Get storage status for health check."""
    try:
        return {
            "type": "sqlite+disk",
            "db_path": str(DB_PATH),
            "ok": True,
            "counts": {
                "run_results": count_run_results(),
                "share_links": count_share_links(),
                "scheduled_jobs": count_scheduled_jobs()
            }
        }
    except Exception as e:
        return {
            "type": "sqlite+disk",
            "db_path": str(DB_PATH),
            "ok": False,
            "error": str(e)[:100]
        }
