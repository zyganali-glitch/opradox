"""
Selftest API - Opradox Excel Studio
Token-protected /selftest endpoints for ops health verification.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import os
import json
from pathlib import Path

from .selftest_runner import run_selftest

router = APIRouter(prefix="/selftest", tags=["selftest"])

# Token from environment variable
SELFTEST_TOKEN = os.environ.get("SELFTEST_TOKEN", "")

# Logs directory for caching results
LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"


def _validate_token(token: Optional[str]) -> None:
    """
    Validate the selftest token.
    Raises HTTPException if invalid or missing.
    """
    if not SELFTEST_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="SELFTEST_TOKEN environment variable not configured"
        )
    
    if not token:
        raise HTTPException(
            status_code=403,
            detail="Missing X-SELFTEST-TOKEN header"
        )
    
    if token != SELFTEST_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Invalid selftest token"
        )


def _save_result_atomically(result: dict) -> None:
    """
    Save selftest result to logs/selftest_last.json atomically.
    Uses temp file + rename pattern.
    """
    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        
        target_path = LOGS_DIR / "selftest_last.json"
        temp_path = LOGS_DIR / "selftest_last.json.tmp"
        
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        # Atomic rename
        temp_path.replace(target_path)
    except Exception as e:
        # Log but don't fail the request
        print(f"[SELFTEST] Failed to save result: {e}")


@router.get("/run")
async def run_selftest_endpoint(
    mode: str = "quick",
    x_selftest_token: Optional[str] = Header(None, alias="X-SELFTEST-TOKEN")
):
    """
    Run selftest checks and return results.
    
    Query params:
        mode: "quick" (default) or "full"
    
    Headers:
        X-SELFTEST-TOKEN: Required authentication token
    
    Returns:
        Structured selftest result with status, checks, timing
    """
    # Validate token
    _validate_token(x_selftest_token)
    
    # Validate mode
    if mode not in ("quick", "full"):
        raise HTTPException(
            status_code=400,
            detail="mode must be 'quick' or 'full'"
        )
    
    # Run selftest
    result = run_selftest(mode=mode)
    
    # Cache result
    _save_result_atomically(result)
    
    return result


@router.get("/last")
async def get_last_result(
    x_selftest_token: Optional[str] = Header(None, alias="X-SELFTEST-TOKEN")
):
    """
    Get the last cached selftest result.
    
    Headers:
        X-SELFTEST-TOKEN: Required authentication token
    
    Returns:
        Last selftest result or 404 if none exists
    """
    # Validate token
    _validate_token(x_selftest_token)
    
    result_path = LOGS_DIR / "selftest_last.json"
    
    if not result_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No selftest results found. Run /selftest/run first."
        )
    
    try:
        with open(result_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read cached result: {str(e)[:100]}"
        )
