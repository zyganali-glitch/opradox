"""
Google Sheets API - Opradox Visual Studio
OAuth ile Google Sheets verisi çekme
"""
from __future__ import annotations
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import json

router = APIRouter(prefix="/viz/google", tags=["google-sheets"])

# Google Sheets kimlik bilgileri (ortam değişkenlerinden alınacak)
# NOT: Production'da bu bilgiler .env dosyasından okunmalı
GOOGLE_CREDENTIALS_FILE = "credentials.json"


class GoogleSheetRequest(BaseModel):
    """Google Sheet isteği için model"""
    spreadsheet_id: str
    sheet_name: Optional[str] = None
    range: Optional[str] = None


class GoogleAuthResponse(BaseModel):
    """OAuth yanıtı"""
    auth_url: str
    state: str


@router.get("/auth-url")
async def get_google_auth_url():
    """
    Google OAuth için yetkilendirme URL'si döndürür.
    Frontend bu URL'yi yeni pencerede açmalıdır.
    """
    try:
        from google_auth_oauthlib.flow import Flow
        
        # OAuth akışı oluştur
        flow = Flow.from_client_secrets_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=[
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                'https://www.googleapis.com/auth/drive.readonly'
            ],
            redirect_uri='http://localhost:8000/viz/google/callback'
        )
        
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return {
            "auth_url": auth_url,
            "state": state,
            "message": "Bu URL'yi yeni pencerede açın ve Google hesabınızla giriş yapın"
        }
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=500, 
            detail="Google credentials.json dosyası bulunamadı. Lütfen Google Cloud Console'dan indirin."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def google_callback(code: str, state: str):
    """
    Google OAuth callback endpoint.
    Kullanıcı Google'da yetkilendirme verdikten sonra buraya yönlendirilir.
    """
    try:
        from google_auth_oauthlib.flow import Flow
        from google.oauth2.credentials import Credentials
        
        flow = Flow.from_client_secrets_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=[
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                'https://www.googleapis.com/auth/drive.readonly'
            ],
            redirect_uri='http://localhost:8000/viz/google/callback',
            state=state
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Token'ı kaydet (session'da veya geçici olarak)
        # Production'da Redis veya veritabanı kullanılmalı
        token_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        # Başarılı - frontend'e yönlendir
        return {
            "success": True,
            "message": "Google hesabı başarıyla bağlandı!",
            "redirect_to": "/viz.html?google_connected=true"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth hatası: {str(e)}")


@router.post("/import-sheet")
async def import_google_sheet(request: GoogleSheetRequest):
    """
    Google Sheets'ten veri çeker.
    
    Args:
        spreadsheet_id: Google Sheets ID (URL'deki uzun kod)
        sheet_name: Sayfa adı (opsiyonel, ilk sayfa varsayılan)
        range: Hücre aralığı (opsiyonel, örn: A1:Z100)
    """
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        
        # Service account kimlik bilgileri
        # NOT: Production'da gspread.oauth() kullanılabilir
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
        
        creds = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=scopes
        )
        
        client = gspread.authorize(creds)
        
        # Spreadsheet'i aç
        spreadsheet = client.open_by_key(request.spreadsheet_id)
        
        # Sayfa seç
        if request.sheet_name:
            worksheet = spreadsheet.worksheet(request.sheet_name)
        else:
            worksheet = spreadsheet.sheet1
        
        # Veriyi al
        if request.range:
            data = worksheet.get(request.range)
        else:
            data = worksheet.get_all_values()
        
        if not data:
            return {"columns": [], "data": [], "row_count": 0}
        
        # İlk satır başlık
        columns = data[0]
        rows = data[1:]
        
        # Dict formatına çevir
        records = []
        for row in rows:
            record = {}
            for i, col in enumerate(columns):
                record[col] = row[i] if i < len(row) else ""
            records.append(record)
        
        # Sütun tiplerini belirle
        columns_info = []
        for col in columns:
            # Basit tip tahmini
            sample_vals = [r.get(col, "") for r in records[:100]]
            is_numeric = all(
                v == "" or v.replace(".", "").replace("-", "").replace(",", "").isdigit() 
                for v in sample_vals if v
            )
            columns_info.append({
                "name": col,
                "type": "numeric" if is_numeric else "text"
            })
        
        return {
            "source": "google_sheets",
            "spreadsheet_id": request.spreadsheet_id,
            "sheet_name": worksheet.title,
            "columns": columns,
            "columns_info": columns_info,
            "data": records[:5000],  # Max 5000 satır
            "row_count": len(records)
        }
        
    except gspread.SpreadsheetNotFound:
        raise HTTPException(status_code=404, detail="Spreadsheet bulunamadı veya erişim izniniz yok")
    except gspread.WorksheetNotFound:
        raise HTTPException(status_code=404, detail=f"'{request.sheet_name}' sayfası bulunamadı")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Google credentials dosyası bulunamadı")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list-spreadsheets")
async def list_user_spreadsheets():
    """
    Kullanıcının erişebildiği spreadsheet'leri listeler.
    """
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
        
        creds = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=scopes
        )
        
        client = gspread.authorize(creds)
        
        # Tüm spreadsheet'leri listele
        spreadsheets = client.openall()
        
        return {
            "spreadsheets": [
                {
                    "id": s.id,
                    "title": s.title,
                    "url": s.url
                }
                for s in spreadsheets[:50]  # Max 50 sonuç
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
