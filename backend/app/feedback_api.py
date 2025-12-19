from __future__ import annotations

import os
from typing import Literal, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

# Email utility import
from .email_utils import send_admin_reply_email

# JWT BASE AUTH İMPORT (DÜZELTME)
from .auth import get_current_admin 
from .email_utils import log_to_file

from .feedback_store import (
    insert_feedback,
    list_feedback,
    update_feedback,
    delete_feedback,
    get_feedback,
    get_feedback_stats,
)

router = APIRouter(tags=["feedback"])

# ESKİ HTTP BASIC AUTH SİLİNDİ (POP-UP SEBEBİ BUYDU)

class FeedbackCreate(BaseModel):
    message_type: Literal["comment", "suggestion", "thanks", "bug", "contact"] = Field(
        "comment",
        description="Mesaj türü",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Mesaj içeriği",
    )
    name: Optional[str] = Field(
        None,
        max_length=200,
        description="İsim / takma ad (opsiyonel)",
    )
    email: Optional[str] = Field(
        None,
        description="E-posta (opsiyonel)",
    )
    scenario_id: Optional[str] = Field(
        None,
        description="Mesajın ilişkilendirildiği senaryo ID'si (opsiyonel)",
    )
    rating: Optional[int] = Field(
        None,
        ge=1,
        le=5,
        description="1-5 arası yıldız puanı (opsiyonel)",
    )


class FeedbackAdminItem(BaseModel):
    id: int
    created_at: str
    name: Optional[str]
    email: Optional[str]
    message_type: str
    message: str
    scenario_id: Optional[str]
    status: str
    liked: bool
    admin_reply: Optional[str]
    admin_replied_at: Optional[str]
    rating: Optional[int]


class FeedbackUpdate(BaseModel):
    status: Optional[Literal["visible", "hidden"]] = None
    liked: Optional[bool] = None
    admin_reply: Optional[str] = None


def _load_feedback_by_id(feedback_id: int) -> Optional[dict]:
    return get_feedback(feedback_id)


@router.post("/feedback", status_code=201)
async def create_feedback(payload: FeedbackCreate):
    feedback_id = insert_feedback(
        name=payload.name,
        email=payload.email,
        message_type=payload.message_type,
        message=payload.message.strip(),
        scenario_id=payload.scenario_id,
        rating=payload.rating,
    )
    return {
        "id": feedback_id,
        "message": "Geri bildirimin alındı. Teşekkür ederiz.",
    }


@router.get("/admin/feedback", response_model=List[FeedbackAdminItem])
async def admin_list_feedback(
    status: Optional[str] = Query(None),
    message_type: Optional[str] = Query(None),
    scenario_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin: str = Depends(get_current_admin),
):
    # POP-UP ENGELLEME CHECK (Şık ve güvenli)
    if not admin:
        return JSONResponse(status_code=200, content=[]) # Sessizce boş liste dön

    rows = list_feedback(
        status=status,
        message_type=message_type,
        scenario_id=scenario_id,
        limit=limit,
        offset=offset,
    )

    items: List[FeedbackAdminItem] = []
    for r in rows:
        items.append(
            FeedbackAdminItem(
                id=r["id"],
                created_at=r["created_at"],
                name=r["name"],
                email=r["email"],
                message_type=r["message_type"],
                message=r["message"],
                scenario_id=r["scenario_id"],
                status=r["status"],
                liked=bool(r["liked"]),
                admin_reply=r["admin_reply"],
                admin_replied_at=r["admin_replied_at"],
                rating=r.get("rating"),
            )
        )
    return items


@router.patch("/admin/feedback/{feedback_id}", response_model=FeedbackAdminItem)
async def admin_update_feedback(
    feedback_id: int,
    payload: FeedbackUpdate,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
):
    if not admin:
        raise HTTPException(status_code=403, detail="Yetkisiz")

    # Get target before update to see if email exists and if reply is new
    target = get_feedback(feedback_id)
    print(f"DEBUG: Found target for feedback_id {feedback_id}: {target}")

    changed = update_feedback(
        feedback_id,
        status=payload.status,
        liked=payload.liked,
        admin_reply=payload.admin_reply,
    )

    if not changed:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı.")

    # Email sending logic
    if payload.admin_reply and target:
        user_email = target.get("email")
        original_msg = target.get("message")
        log_to_file(f"DEBUG: admin_reply found for ID {feedback_id}, user_email: {user_email}")
        if user_email:
            # Send email in background
            log_to_file(f"DEBUG: Adding background task send_admin_reply_email to {user_email}")
            background_tasks.add_task(
                send_admin_reply_email, 
                user_email, 
                original_msg, 
                payload.admin_reply
            )
        else:
            log_to_file(f"DEBUG: No email found for feedback ID {feedback_id}")

    target = get_feedback(feedback_id)
    return FeedbackAdminItem(
        id=target["id"],
        created_at=target["created_at"],
        name=target["name"],
        email=target["email"],
        message_type=target["message_type"],
        message=target["message"],
        scenario_id=target["scenario_id"],
        status=target["status"],
        liked=bool(target["liked"]),
        admin_reply=target["admin_reply"],
        admin_replied_at=target["admin_replied_at"],
        rating=target.get("rating"),
    )


@router.delete("/admin/feedback/{feedback_id}", status_code=204)
async def admin_delete_feedback(
    feedback_id: int,
    admin: str = Depends(get_current_admin),
):
    if not admin:
        raise HTTPException(status_code=403, detail="Yetkisiz")
    delete_feedback(feedback_id)
    return


@router.get("/admin/stats")
async def get_admin_stats(
    admin: str = Depends(get_current_admin),
):
    # POP-UP ENGELLEME CHECK
    if not admin:
        return JSONResponse(status_code=200, content={"total": 0, "today": 0, "unanswered": 0})
        
    return get_feedback_stats()


@router.get("/feedback/public")
async def get_public_feedback(
    limit: int = Query(20, ge=1, le=100),
    scenario_id: Optional[str] = Query(None),
):
    rows = list_feedback(status="visible", scenario_id=scenario_id, limit=limit * 2) # Get more to allow filtering
    # Exclude contact messages from public view
    rows = [r for r in rows if r.get("message_type") != "contact"]
    
    rows_sorted = sorted(rows, key=lambda x: (x.get("admin_reply") is not None, x["created_at"]), reverse=True)
    
    items = []
    for r in rows_sorted[:limit]:
        items.append({
            "id": r["id"],
            "created_at": r["created_at"],
            "name": r.get("name"),
            "message_type": r["message_type"],
            "message": r["message"],
            "scenario_id": r.get("scenario_id"),
            "rating": r.get("rating"),
            "admin_reply": r.get("admin_reply"),
            "admin_replied_at": r.get("admin_replied_at"),
        })
    return items
