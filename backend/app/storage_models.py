"""
Storage Models - Opradox Excel Studio
Dataclass definitions for persistent storage.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
import time


@dataclass
class RunResult:
    """Stored run result metadata."""
    scenario_id: str
    file_path: str
    format: str = "xlsx"
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    summary_json: Optional[str] = None
    build_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "file_path": self.file_path,
            "format": self.format,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "summary_json": self.summary_json,
            "build_id": self.build_id
        }


@dataclass
class ShareLink:
    """Stored share link metadata."""
    share_id: str
    scenario_id: str
    file_path: str
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(default_factory=lambda: time.time() + 24*60*60)  # 24h default
    watermark_applied: bool = False
    downloads_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "share_id": self.share_id,
            "scenario_id": self.scenario_id,
            "file_path": self.file_path,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "watermark_applied": self.watermark_applied,
            "downloads_count": self.downloads_count
        }
    
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


@dataclass
class ScheduledJob:
    """Stored scheduled job metadata."""
    job_id: str
    payload_json: str
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    enabled: bool = True
    last_run_at: Optional[float] = None
    next_run_at: Optional[float] = None
    error_last: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "payload_json": self.payload_json,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "enabled": self.enabled,
            "last_run_at": self.last_run_at,
            "next_run_at": self.next_run_at,
            "error_last": self.error_last
        }
