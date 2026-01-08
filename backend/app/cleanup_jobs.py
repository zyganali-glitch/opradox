"""
Cleanup Jobs - Opradox Excel Studio
Expiry cleanup functions for share links and old results.
"""
from __future__ import annotations
import time
from pathlib import Path
from typing import Tuple

from .storage import (
    get_expired_share_links,
    delete_share_link,
    safe_delete_file,
    SHARES_DIR
)


def cleanup_expired_shares() -> Tuple[int, int]:
    """
    Clean up expired share links and their files.
    
    Returns:
        (deleted_count, error_count)
    """
    deleted = 0
    errors = 0
    
    try:
        expired_links = get_expired_share_links()
        
        for link in expired_links:
            try:
                # Delete file (best-effort)
                file_path = Path(link.file_path)
                if file_path.is_absolute():
                    safe_delete_file(file_path)
                else:
                    safe_delete_file(SHARES_DIR / file_path.name)
                
                # Delete DB record
                if delete_share_link(link.share_id):
                    deleted += 1
            except Exception:
                errors += 1
    except Exception as e:
        print(f"[CLEANUP] Error getting expired shares: {e}")
    
    if deleted > 0:
        print(f"[CLEANUP] Cleaned {deleted} expired shares ({errors} errors)")
    
    return deleted, errors


def cleanup_old_results(max_age_days: int = 7) -> Tuple[int, int]:
    """
    Clean up old result files (optional, not enabled by default).
    
    Args:
        max_age_days: Maximum age in days before cleanup
    
    Returns:
        (deleted_count, error_count)
    """
    # This is P1 priority - implemented but not enabled by default
    # To enable, call this function from a scheduled job or startup
    deleted = 0
    errors = 0
    
    # Implementation can be added later if needed
    # For now, just return 0,0
    
    return deleted, errors


def run_all_cleanup() -> dict:
    """
    Run all cleanup jobs.
    Called on startup and periodically.
    """
    start = time.time()
    
    shares_deleted, shares_errors = cleanup_expired_shares()
    
    elapsed_ms = int((time.time() - start) * 1000)
    
    return {
        "elapsed_ms": elapsed_ms,
        "shares": {
            "deleted": shares_deleted,
            "errors": shares_errors
        }
    }
