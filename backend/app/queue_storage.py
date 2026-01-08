"""
Queue Storage - Opradox Excel Studio
FAZ-ES-6: SQLite CRUD for queue_jobs table.
Uses existing excelstudio.db from FAZ-ES-5.
"""
from __future__ import annotations
import time
import json
import uuid
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

from .storage import get_cursor, _ensure_dirs, DB_PATH

# ============================================================
# DATA MODEL
# ============================================================

@dataclass
class QueueJob:
    """Queue job data model."""
    job_id: str
    user_key: str
    service: str
    action: str
    status: str = "queued"
    priority: int = 0
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    progress: float = 0.0
    message: str = ""
    params_json: str = "{}"
    limits_json: str = "{}"
    eta_ms: int = 0
    result_ref_json: Optional[str] = None
    error_short: Optional[str] = None
    
    @staticmethod
    def generate_id() -> str:
        return f"job_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "user_key": self.user_key,
            "service": self.service,
            "action": self.action,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "progress": self.progress,
            "message": self.message,
            "params": json.loads(self.params_json) if self.params_json else {},
            "limits": json.loads(self.limits_json) if self.limits_json else {},
            "eta_ms": self.eta_ms,
            "result_ref": json.loads(self.result_ref_json) if self.result_ref_json else None,
            "error_short": self.error_short,
        }


# ============================================================
# TABLE INITIALIZATION
# ============================================================

def init_queue_table():
    """Initialize queue_jobs table."""
    _ensure_dirs()
    
    with get_cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS queue_jobs (
                job_id TEXT PRIMARY KEY,
                user_key TEXT NOT NULL,
                service TEXT NOT NULL,
                action TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                priority INTEGER DEFAULT 0,
                created_at REAL NOT NULL,
                started_at REAL,
                finished_at REAL,
                progress REAL DEFAULT 0,
                message TEXT,
                params_json TEXT,
                limits_json TEXT,
                eta_ms INTEGER DEFAULT 0,
                result_ref_json TEXT,
                error_short TEXT
            )
        """)
        
        # Indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_queue_status_service 
            ON queue_jobs(status, service, created_at)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_queue_user_status 
            ON queue_jobs(user_key, status)
        """)
    
    print("[QUEUE] Queue table initialized")


# ============================================================
# CRUD OPERATIONS
# ============================================================

def insert_job(job: QueueJob) -> str:
    """Insert a new job into the queue."""
    with get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO queue_jobs 
            (job_id, user_key, service, action, status, priority, 
             created_at, started_at, finished_at, progress, message,
             params_json, limits_json, eta_ms, result_ref_json, error_short)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job.job_id, job.user_key, job.service, job.action, job.status,
            job.priority, job.created_at, job.started_at, job.finished_at,
            job.progress, job.message, job.params_json, job.limits_json,
            job.eta_ms, job.result_ref_json, job.error_short
        ))
    return job.job_id


def get_job(job_id: str) -> Optional[QueueJob]:
    """Get job by ID."""
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM queue_jobs WHERE job_id = ?", (job_id,))
        row = cursor.fetchone()
        if row:
            return _row_to_job(row)
    return None


def update_job_status(job_id: str, status: str, **fields) -> bool:
    """Update job status and optional fields."""
    set_parts = ["status = ?"]
    values = [status]
    
    for key, val in fields.items():
        if key in ("started_at", "finished_at", "progress", "message", 
                   "eta_ms", "result_ref_json", "error_short"):
            set_parts.append(f"{key} = ?")
            values.append(val)
    
    values.append(job_id)
    
    with get_cursor() as cursor:
        cursor.execute(
            f"UPDATE queue_jobs SET {', '.join(set_parts)} WHERE job_id = ?",
            values
        )
        return cursor.rowcount > 0


def delete_job(job_id: str) -> bool:
    """Delete a job."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM queue_jobs WHERE job_id = ?", (job_id,))
        return cursor.rowcount > 0


def get_queued_jobs(service: Optional[str] = None) -> List[QueueJob]:
    """Get all queued jobs, optionally filtered by service."""
    with get_cursor() as cursor:
        if service:
            cursor.execute(
                "SELECT * FROM queue_jobs WHERE status = 'queued' AND service = ? ORDER BY priority DESC, created_at ASC",
                (service,)
            )
        else:
            cursor.execute(
                "SELECT * FROM queue_jobs WHERE status = 'queued' ORDER BY priority DESC, created_at ASC"
            )
        return [_row_to_job(row) for row in cursor.fetchall()]


def get_running_jobs(service: Optional[str] = None) -> List[QueueJob]:
    """Get all running jobs, optionally filtered by service."""
    with get_cursor() as cursor:
        if service:
            cursor.execute(
                "SELECT * FROM queue_jobs WHERE status = 'running' AND service = ?",
                (service,)
            )
        else:
            cursor.execute("SELECT * FROM queue_jobs WHERE status = 'running'")
        return [_row_to_job(row) for row in cursor.fetchall()]


def count_by_status(status: str, service: Optional[str] = None) -> int:
    """Count jobs by status."""
    with get_cursor() as cursor:
        if service:
            cursor.execute(
                "SELECT COUNT(*) FROM queue_jobs WHERE status = ? AND service = ?",
                (status, service)
            )
        else:
            cursor.execute(
                "SELECT COUNT(*) FROM queue_jobs WHERE status = ?",
                (status,)
            )
        return cursor.fetchone()[0]


def get_position_in_queue(job_id: str) -> int:
    """Get position of job in queue (1-indexed, 0 if not queued)."""
    job = get_job(job_id)
    if not job or job.status != "queued":
        return 0
    
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM queue_jobs 
            WHERE status = 'queued' 
            AND service = ?
            AND (priority > ? OR (priority = ? AND created_at < ?))
        """, (job.service, job.priority, job.priority, job.created_at))
        return cursor.fetchone()[0] + 1


def get_user_recent_running_count(user_key: str) -> int:
    """Get count of jobs user ran in last minute (for anti-hog)."""
    one_min_ago = time.time() - 60
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM queue_jobs 
            WHERE user_key = ? AND started_at > ?
        """, (user_key, one_min_ago))
        return cursor.fetchone()[0]


def recover_stale_running_jobs(mode: str = "requeue") -> int:
    """Recover jobs that were running when server stopped."""
    with get_cursor() as cursor:
        if mode == "requeue":
            cursor.execute("""
                UPDATE queue_jobs 
                SET status = 'queued', 
                    started_at = NULL, 
                    message = 'Recovered after restart'
                WHERE status = 'running'
            """)
        else:  # fail
            cursor.execute("""
                UPDATE queue_jobs 
                SET status = 'fail', 
                    finished_at = ?,
                    error_short = 'Server restarted during execution'
                WHERE status = 'running'
            """, (time.time(),))
        
        count = cursor.rowcount
        if count > 0:
            print(f"[QUEUE] Recovered {count} stale running jobs (mode={mode})")
        return count


def _row_to_job(row) -> QueueJob:
    """Convert database row to QueueJob."""
    return QueueJob(
        job_id=row["job_id"],
        user_key=row["user_key"],
        service=row["service"],
        action=row["action"],
        status=row["status"],
        priority=row["priority"] or 0,
        created_at=row["created_at"],
        started_at=row["started_at"],
        finished_at=row["finished_at"],
        progress=row["progress"] or 0.0,
        message=row["message"] or "",
        params_json=row["params_json"] or "{}",
        limits_json=row["limits_json"] or "{}",
        eta_ms=row["eta_ms"] or 0,
        result_ref_json=row["result_ref_json"],
        error_short=row["error_short"],
    )
