"""
opradox – JWT Authentication Module
Pop-up engellemek için radikal sessiz yetkilendirme.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["authentication"])

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "opradox-super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "opradox2024")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    username: str

def authenticate_admin(username: str, password: str) -> bool:
    if username != ADMIN_USERNAME: return False
    if password == ADMIN_PASSWORD: return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_admin(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    """
    Sessiz yetkilendirme: Hatalarda 401 fırlatmaz, boş string döner.
    Bu sayede tarayıcı pop-up tetiklemez.
    """
    if not token:
        return ""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username == ADMIN_USERNAME:
            return username
    except:
        pass
    return ""

@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if not authenticate_admin(form_data.username, form_data.password):
        return JSONResponse(status_code=400, content={"detail": "Hatalı kimlik bilgileri"})
    
    access_token = create_access_token(data={"sub": form_data.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        "username": form_data.username
    }

@router.post("/check-status")
async def verify_token_status(admin: str = Depends(get_current_admin)):
    if not admin:
        return {"valid": False, "reason": "Invalid or expired token"}
    return {"valid": True, "username": admin}
