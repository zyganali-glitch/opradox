"""
opradox – JWT Authentication Module
Tek admin için basit JWT auth sistemi.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["authentication"])

# Konfigürasyon (environment variables veya default)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "opradox-super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

# Admin credentials (.env'den veya default)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "opradox2024")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# ============================================================
# MODELS
# ============================================================
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int  # seconds


class TokenData(BaseModel):
    username: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    username: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Şifreyi hash ile karşılaştır."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Şifreyi hashle."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT token oluştur."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_admin(username: str, password: str) -> bool:
    """Admin kimlik doğrulama."""
    if username != ADMIN_USERNAME:
        return False
    # İlk giriş için plain text karşılaştırma (sonra hash kullanılabilir)
    if password == ADMIN_PASSWORD:
        return True
    return False


async def get_current_admin(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    """JWT token'dan mevcut admin'i al."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if token is None:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if username != ADMIN_USERNAME:
        raise credentials_exception
    
    return username


async def get_current_admin_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[str]:
    """Opsiyonel JWT doğrulama (hata fırlatmaz)."""
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        return username
    except JWTError:
        return None


# ============================================================
# ENDPOINTS
# ============================================================
@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Admin login endpoint.
    OAuth2 password flow ile çalışır.
    """
    if not authenticate_admin(form_data.username, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        username=form_data.username
    )


@router.post("/verify")
async def verify_token(admin: str = Depends(get_current_admin)):
    """
    Token doğrulama endpoint.
    Frontend'den token geçerliliğini kontrol etmek için.
    """
    return {"valid": True, "username": admin}


@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    admin: str = Depends(get_current_admin)
):
    """
    Şifre değiştirme endpoint.
    NOT: Tek admin modunda şifre .env'de saklanır, 
    bu endpoint sadece runtime için çalışır.
    Production'da DB tablosu önerilir.
    """
    global ADMIN_PASSWORD
    
    if not authenticate_admin(admin, data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre hatalı"
        )
    
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yeni şifre en az 6 karakter olmalı"
        )
    
    # Runtime'da şifreyi güncelle (restart'ta resetlenir)
    ADMIN_PASSWORD = data.new_password
    
    return {"message": "Şifre başarıyla değiştirildi. NOT: Kalıcı yapmak için .env dosyasını güncelleyin."}


@router.post("/logout")
async def logout(admin: str = Depends(get_current_admin)):
    """
    Logout endpoint.
    JWT stateless olduğu için server-side invalidation yok.
    Frontend token'ı silmeli.
    """
    return {"message": "Çıkış yapıldı. Token'ı yerel depodan silin."}
