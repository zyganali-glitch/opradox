"""
Queue Engine - Opradox Excel Studio
FAZ-ES-6: Dispatcher with fairness, capacity control, and restart recovery.
"""
from __future__ import annotations
import asyncio
import time
import json
import traceback
from typing import Dict, Callable, Any, Optional, Set
from pathlib import Path

from .queue_config import (
    GLOBAL_MAX_CONCURRENT, 
    SERVICE_CAPACITY,
    ENGINE_POLL_INTERVAL_MS,
    RESTART_RECOVERY_MODE,
    MAX_CONSECUTIVE_SAME_USER,
    JobStatus,
    get_avg_duration_ms,
    get_text
)
from .queue_storage import (
    QueueJob,
    get_queued_jobs,
    get_running_jobs,
    count_by_status,
    update_job_status,
    get_job,
    get_user_recent_running_count,
    recover_stale_running_jobs,
    get_position_in_queue
)

# ============================================================
# EXECUTOR REGISTRY
# ============================================================

# Map (service, action) -> async executor function
# Executor signature: async def executor(job: QueueJob) -> Dict[str, Any]
# Returns: {"success": bool, "result_ref": {...} | None, "error": str | None}

EXECUTOR_REGISTRY: Dict[tuple, Callable] = {}

def register_executor(service: str, action: str, func: Callable):
    """Register an executor function for a service/action pair."""
    EXECUTOR_REGISTRY[(service, action)] = func
    print(f"[QUEUE] Registered executor: {service}/{action}")


# ============================================================
# WEBSOCKET BROADCAST (will be set by queue_ws.py)
# ============================================================

_ws_broadcast_func: Optional[Callable] = None

def set_ws_broadcast(func: Callable):
    """Set the WebSocket broadcast function."""
    global _ws_broadcast_func
    _ws_broadcast_func = func


async def broadcast_job_update(job: QueueJob, modal_required: bool = False):
    """Broadcast job update to connected clients."""
    if _ws_broadcast_func:
        position = get_position_in_queue(job.job_id) if job.status == JobStatus.QUEUED else 0
        event = {
            "type": "queue_update",
            "job_id": job.job_id,
            "status": job.status,
            "progress": job.progress,
            "message": job.message,
            "position": position,
            "eta_ms": job.eta_ms,
            "modal_required": modal_required and job.status == JobStatus.QUEUED,
        }
        await _ws_broadcast_func(job.user_key, event)


# ============================================================
# CAPACITY CHECKS
# ============================================================

def can_start_job_globally() -> bool:
    """Check if we can start a job globally."""
    running_count = count_by_status(JobStatus.RUNNING)
    return running_count < GLOBAL_MAX_CONCURRENT


def can_start_job_for_service(service: str) -> bool:
    """Check if we can start a job for a specific service."""
    capacity = SERVICE_CAPACITY.get(service, 1)
    running_count = count_by_status(JobStatus.RUNNING, service)
    return running_count < capacity


def can_start_job(service: str) -> bool:
    """Check both global and service capacity."""
    return can_start_job_globally() and can_start_job_for_service(service)


def is_server_busy() -> bool:
    """Check if server is at global capacity."""
    return not can_start_job_globally()


def is_service_busy(service: str) -> bool:
    """Check if a service is at capacity."""
    return not can_start_job_for_service(service)


# ============================================================
# JOB DISPATCH (FAIR QUEUE)
# ============================================================

async def dispatch_next_job() -> Optional[str]:
    """Try to dispatch the next job from queue. Returns job_id if dispatched."""
    # Get all running jobs to check capacity
    if not can_start_job_globally():
        return None
    
    # Get queued jobs (ordered by priority desc, created_at asc)
    queued_jobs = get_queued_jobs()
    if not queued_jobs:
        return None
    
    # Find first job that can start (respect service capacity + anti-hog)
    recent_users: Set[str] = set()
    
    for job in queued_jobs:
        # Service capacity check
        if not can_start_job_for_service(job.service):
            continue
        
        # Anti-hog: skip if user ran too many recently
        user_recent = get_user_recent_running_count(job.user_key)
        if user_recent >= MAX_CONSECUTIVE_SAME_USER:
            recent_users.add(job.user_key)
            continue
        
        # Start this job
        await start_job(job)
        return job.job_id
    
    # If all eligible jobs are from hogged users, just start the first one anyway
    if queued_jobs and recent_users:
        first_eligible = next(
            (j for j in queued_jobs if can_start_job_for_service(j.service)), 
            None
        )
        if first_eligible:
            await start_job(first_eligible)
            return first_eligible.job_id
    
    return None


async def start_job(job: QueueJob):
    """Start executing a job."""
    # Update status to running
    update_job_status(
        job.job_id, 
        JobStatus.RUNNING,
        started_at=time.time(),
        eta_ms=0,
        message="Starting..."
    )
    
    # Refresh job from DB
    job = get_job(job.job_id)
    
    # Broadcast update (modal_required=False since now running)
    await broadcast_job_update(job, modal_required=False)
    
    # Execute in background
    asyncio.create_task(execute_job(job))


async def execute_job(job: QueueJob):
    """Execute job using registered executor."""
    executor = EXECUTOR_REGISTRY.get((job.service, job.action))
    
    try:
        if not executor:
            # No executor registered - fail with placeholder message
            raise NotImplementedError(
                get_text("placeholder.not_enabled", "en")
            )
        
        # Run executor
        result = await executor(job)
        
        if result.get("success"):
            # Success
            result_ref = result.get("result_ref")
            update_job_status(
                job.job_id,
                JobStatus.DONE,
                finished_at=time.time(),
                progress=1.0,
                message="Completed",
                result_ref_json=json.dumps(result_ref) if result_ref else None
            )
        else:
            # Executor returned failure
            update_job_status(
                job.job_id,
                JobStatus.FAIL,
                finished_at=time.time(),
                error_short=result.get("error", "Unknown error")[:200]
            )
    
    except Exception as e:
        print(f"[QUEUE] Job {job.job_id} failed: {e}")
        traceback.print_exc()
        update_job_status(
            job.job_id,
            JobStatus.FAIL,
            finished_at=time.time(),
            error_short=str(e)[:200]
        )
    
    # Broadcast final status
    final_job = get_job(job.job_id)
    if final_job:
        await broadcast_job_update(final_job, modal_required=False)
    
    # Update ETAs for remaining queued jobs
    await update_queued_etas(job.service)


async def update_queued_etas(service: str):
    """Update ETA for all queued jobs in a service after a job completes."""
    queued = get_queued_jobs(service)
    avg_duration = get_avg_duration_ms(service)
    
    for i, job in enumerate(queued):
        position = i + 1
        eta_ms = position * avg_duration
        update_job_status(job.job_id, job.status, eta_ms=eta_ms)
        
        # Broadcast updated position/eta
        updated_job = get_job(job.job_id)
        if updated_job:
            await broadcast_job_update(updated_job, modal_required=True)


# ============================================================
# ENGINE LOOP
# ============================================================

_engine_running = False
_engine_task: Optional[asyncio.Task] = None


async def engine_loop():
    """Main engine loop that dispatches jobs."""
    global _engine_running
    _engine_running = True
    
    poll_interval = ENGINE_POLL_INTERVAL_MS / 1000.0
    
    print("[QUEUE] Engine started")
    
    while _engine_running:
        try:
            dispatched = await dispatch_next_job()
            if dispatched:
                print(f"[QUEUE] Dispatched job: {dispatched}")
        except Exception as e:
            print(f"[QUEUE] Engine error: {e}")
            traceback.print_exc()
        
        await asyncio.sleep(poll_interval)
    
    print("[QUEUE] Engine stopped")


def start_engine():
    """Start the queue engine (call from startup)."""
    global _engine_task
    
    # Recovery on startup
    recover_stale_running_jobs(RESTART_RECOVERY_MODE)
    
    # Start engine loop
    loop = asyncio.get_event_loop()
    _engine_task = loop.create_task(engine_loop())
    
    print("[QUEUE] Engine scheduled to start")


def stop_engine():
    """Stop the queue engine."""
    global _engine_running, _engine_task
    _engine_running = False
    if _engine_task:
        _engine_task.cancel()


# ============================================================
# EXCEL EXECUTOR (PLACEHOLDER - CONNECTS TO EXISTING /run LOGIC)
# ============================================================

async def excel_run_scenario_executor(job: QueueJob) -> Dict[str, Any]:
    """
    Execute Excel run_scenario via queue.
    This is a placeholder that reuses existing scenario logic.
    """
    # Parse params
    try:
        params = json.loads(job.params_json) if job.params_json else {}
    except:
        params = {}
    
    # For now, return success with reference to run_results
    # In full implementation, this would call the actual scenario runner
    
    # Update progress
    update_job_status(job.job_id, JobStatus.RUNNING, progress=0.5, message="Processing...")
    
    # Simulate work (replace with actual scenario execution)
    await asyncio.sleep(2)
    
    # Mark complete
    return {
        "success": True,
        "result_ref": {
            "scenario_id": params.get("scenario_id", "unknown"),
            "download_url": f"/download/{params.get('scenario_id', 'unknown')}?format=xlsx"
        }
    }


async def placeholder_executor(job: QueueJob) -> Dict[str, Any]:
    """Placeholder executor for unimplemented services."""
    return {
        "success": False,
        "error": get_text("placeholder.not_enabled", "en")
    }


# Register default executors
register_executor("excel", "run_scenario", excel_run_scenario_executor)
register_executor("pdf", "extract", placeholder_executor)
register_executor("ocr", "run", placeholder_executor)
