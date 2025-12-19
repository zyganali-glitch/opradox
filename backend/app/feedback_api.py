from __future__ import annotations

import os
import secrets
from typing import Literal, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, EmailStr, Field

from .feedback_store import (
    insert_feedback,
    list_feedback,
    update_feedback,
    delete_feedback,
    get_feedback_stats,
)

router = APIRouter(tags=["feedback"])

security = HTTPBasic()

ADMIN_USERNAME = os.getenv("GM_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("GM_ADMIN_PASSWORD", "opradox-secret")


def get_current_admin(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    """
    Basit HTTP Basic auth.
    """
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yetkisiz erişim",
            headers={"WWW-Authenticate": "Basic"},
        )

    return credentials.username


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
    email: Optional[EmailStr] = Field(
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
    """
    Basit bir yardımcı: ID'ye göre tek bir feedback kaydı döndürür.
    """
    rows = list_feedback(limit=1000)
    for r in rows:
        if r["id"] == feedback_id:
            return r
    return None


@router.post("/feedback", status_code=201)
async def create_feedback(payload: FeedbackCreate):
    """
    Kullanıcıların yorum / öneri / teşekkür / hata bildirimi / bize ulaşın
    göndereceği endpoint. Auth gerektirmez.
    """
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
    status: Optional[str] = Query(
        None,
        description="Filtre: visible / hidden veya boş (tümü)",
    ),
    message_type: Optional[str] = Query(
        None,
        description="Filtre: comment / suggestion / thanks / bug / contact",
    ),
    scenario_id: Optional[str] = Query(
        None,
        description="Filtre: belirli bir senaryo ID'si",
    ),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin: str = Depends(get_current_admin),
):
    """
    Admin için geri bildirim listesi.
    """
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
    admin: str = Depends(get_current_admin),
):
    """
    Admin için:
    - status: visible / hidden
    - liked: true / false
    - admin_reply: cevap metni
    """
    changed = update_feedback(
        feedback_id,
        status=payload.status,
        liked=payload.liked,
        admin_reply=payload.admin_reply,
    )

    if not changed:
        raise HTTPException(
            status_code=404,
            detail="Kayıt bulunamadı veya değişiklik yok.",
        )

    target = _load_feedback_by_id(feedback_id)
    if target is None:
        raise HTTPException(
            status_code=404,
            detail="Güncellenen kayıt tekrar alınamadı.",
        )

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
    """
    Admin için kaydı tamamen silme endpoint'i.
    """
    ok = delete_feedback(feedback_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı.")
    return


# ============================================================
# YENİ ENDPOINT'LER: Dashboard Stats + Public Comments
# ============================================================

class FeedbackPublicItem(BaseModel):
    """Topluluk panelinde gösterilecek public yorumlar."""
    id: int
    created_at: str
    name: Optional[str]
    message_type: str
    message: str
    scenario_id: Optional[str]
    rating: Optional[int]
    admin_reply: Optional[str]
    admin_replied_at: Optional[str]


@router.get("/admin/stats")
async def get_admin_stats(
    admin: str = Depends(get_current_admin),
):
    """
    Admin dashboard için istatistikler.
    """
    return get_feedback_stats()


@router.get("/feedback/public", response_model=List[FeedbackPublicItem])
async def get_public_feedback(
    limit: int = Query(20, ge=1, le=100),
    scenario_id: Optional[str] = Query(None),
):
    """
    Topluluk paneli için public yorumlar.
    Sadece visible ve admin_reply olan yorumlar öncelikli.
    """
    rows = list_feedback(
        status="visible",
        scenario_id=scenario_id,
        limit=limit,
    )
    
    # Admin yanıtı olanları öne al
    rows_sorted = sorted(rows, key=lambda x: (x.get("admin_reply") is not None, x["created_at"]), reverse=True)
    
    items: List[FeedbackPublicItem] = []
    for r in rows_sorted[:limit]:
        items.append(
            FeedbackPublicItem(
                id=r["id"],
                created_at=r["created_at"],
                name=r.get("name"),
                message_type=r["message_type"],
                message=r["message"],
                scenario_id=r.get("scenario_id"),
                rating=r.get("rating"),
                admin_reply=r.get("admin_reply"),
                admin_replied_at=r.get("admin_replied_at"),
            )
        )
    return items
