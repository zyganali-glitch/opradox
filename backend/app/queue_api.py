"""
Queue API - Opradox Excel Studio
FAZ-ES-6: REST endpoints for queue management.
"""
from __future__ import annotations
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import time

from .queue_config import (
    JobStatus,
    get_avg_duration_ms,
    get_text,
    QUEUE_TEXTS
)
from .queue_storage import (
    QueueJob,
    insert_job,
    get_job,
    update_job_status,
    count_by_status,
    get_position_in_queue,
    get_queued_jobs,
    get_running_jobs
)
from .queue_engine import (
    can_start_job,
    is_server_busy,
    is_service_busy,
    start_job
)

router = APIRouter(prefix="/queue", tags=["queue"])


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class SubmitRequest(BaseModel):
    """Job submission request."""
    service: str  # "excel" | "pdf" | "ocr"
    action: str   # "run_scenario" | "extract" | "run"
    params: Dict[str, Any] = {}
    limits: Dict[str, Any] = {}
    user_key: str


class SubmitResponse(BaseModel):
    """Job submission response."""
    job_id: str
    status: str
    modal_required: bool
    position: int
    eta_ms: int
    server_busy: bool
    service_busy: bool


class JobStatusResponse(BaseModel):
    """Job status response."""
    job_id: str
    status: str
    progress: float
    message: str
    position: int
    eta_ms: int
    started_at: Optional[float]
    finished_at: Optional[float]
    result_ref: Optional[Dict[str, Any]]
    error_short: Optional[str]


class QueueStatusResponse(BaseModel):
    """Queue status response."""
    global_busy: bool
    service_busy: bool
    queued_count: int
    running_count: int


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/submit", response_model=SubmitResponse)
async def submit_job(request: SubmitRequest):
    """
    Submit a job to the queue.
    
    CRITICAL BEHAVIOR:
    - If server is free and job can start immediately:
        status="running", modal_required=false, position=0, eta_ms=0
    - If job is queued:
        status="queued", modal_required=true, position>=1, eta_ms>0
    """
    # Create job
    job_id = QueueJob.generate_id()
    
    job = QueueJob(
        job_id=job_id,
        user_key=request.user_key,
        service=request.service,
        action=request.action,
        status=JobStatus.QUEUED,
        params_json=json.dumps(request.params, ensure_ascii=False),
        limits_json=json.dumps(request.limits, ensure_ascii=False),
        created_at=time.time()
    )
    
    # Check if can start immediately
    server_busy = is_server_busy()
    service_busy = is_service_busy(request.service)
    can_start_now = not server_busy and not service_busy
    
    if can_start_now:
        # Start immediately - NO MODAL
        job.status = JobStatus.RUNNING
        job.started_at = time.time()
        job.eta_ms = 0
        insert_job(job)
        
        # Trigger execution
        import asyncio
        from .queue_engine import execute_job
        asyncio.create_task(execute_job(job))
        
        return SubmitResponse(
            job_id=job_id,
            status=JobStatus.RUNNING,
            modal_required=False,  # CRITICAL: No modal when starting immediately
            position=0,
            eta_ms=0,
            server_busy=False,
            service_busy=False
        )
    else:
        # Queue the job - MODAL REQUIRED
        insert_job(job)
        
        # Calculate position and ETA
        position = get_position_in_queue(job_id)
        avg_duration = get_avg_duration_ms(request.service)
        eta_ms = position * avg_duration
        
        # Update job with ETA
        update_job_status(job_id, JobStatus.QUEUED, eta_ms=eta_ms)
        
        return SubmitResponse(
            job_id=job_id,
            status=JobStatus.QUEUED,
            modal_required=True,  # CRITICAL: Modal required when queued
            position=position,
            eta_ms=eta_ms,
            server_busy=server_busy,
            service_busy=service_busy
        )


@router.get("/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get job status and details."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    position = get_position_in_queue(job_id) if job.status == JobStatus.QUEUED else 0
    
    result_ref = None
    if job.result_ref_json:
        try:
            result_ref = json.loads(job.result_ref_json)
        except:
            pass
    
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.progress,
        message=job.message,
        position=position,
        eta_ms=job.eta_ms,
        started_at=job.started_at,
        finished_at=job.finished_at,
        result_ref=result_ref,
        error_short=job.error_short
    )


@router.post("/cancel/{job_id}")
async def cancel_job(job_id: str, user_key: str):
    """
    Cancel a queued job.
    Only the owner (user_key) can cancel.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify ownership
    if job.user_key != user_key:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this job")
    
    # Can only cancel queued jobs
    if job.status != JobStatus.QUEUED:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot cancel job with status '{job.status}'"
        )
    
    # Cancel
    update_job_status(
        job_id, 
        JobStatus.CANCELED,
        finished_at=time.time(),
        message="Canceled by user"
    )
    
    return {"success": True, "message": "Job canceled"}


@router.get("/status", response_model=QueueStatusResponse)
async def get_queue_status(service: Optional[str] = None):
    """Get queue status summary."""
    if service:
        queued = count_by_status(JobStatus.QUEUED, service)
        running = count_by_status(JobStatus.RUNNING, service)
        service_busy = is_service_busy(service)
    else:
        queued = count_by_status(JobStatus.QUEUED)
        running = count_by_status(JobStatus.RUNNING)
        service_busy = False
    
    return QueueStatusResponse(
        global_busy=is_server_busy(),
        service_busy=service_busy,
        queued_count=queued,
        running_count=running
    )


@router.get("/texts/{lang}")
async def get_queue_texts(lang: str = "tr"):
    """Get localized queue texts for frontend."""
    texts = QUEUE_TEXTS.get(lang, QUEUE_TEXTS.get("en", {}))
    return {"lang": lang, "texts": texts}
