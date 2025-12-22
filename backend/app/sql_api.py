"""
SQL Query API - Opradox Visual Studio
Harici veritabanlarından veri çekme (READ-ONLY)
"""
from __future__ import annotations
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
import json

router = APIRouter(prefix="/viz/sql", tags=["sql-query"])


class SQLConnectionRequest(BaseModel):
    """SQL bağlantı isteği"""
    connection_string: str
    query: str
    max_rows: Optional[int] = 1000


class SQLConnectionTest(BaseModel):
    """Bağlantı testi"""
    connection_string: str


# Güvenlik için izin verilen SQL komutları (sadece okuma)
ALLOWED_SQL_KEYWORDS = ['SELECT', 'WITH']
FORBIDDEN_SQL_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE']


def validate_query(query: str) -> bool:
    """
    SQL sorgusunun güvenli olup olmadığını kontrol eder.
    Sadece SELECT sorgularına izin verilir.
    """
    query_upper = query.strip().upper()
    
    # Yasaklı komutları kontrol et
    for keyword in FORBIDDEN_SQL_KEYWORDS:
        if keyword in query_upper:
            return False
    
    # İzin verilen komutlarla başlamalı
    starts_valid = any(query_upper.startswith(kw) for kw in ALLOWED_SQL_KEYWORDS)
    
    return starts_valid


@router.post("/test-connection")
async def test_sql_connection(request: SQLConnectionTest):
    """
    Veritabanı bağlantısını test eder.
    """
    try:
        from sqlalchemy import create_engine, text
        
        engine = create_engine(request.connection_string, pool_pre_ping=True)
        
        with engine.connect() as conn:
            # Basit bir test sorgusu
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        
        return {
            "success": True,
            "message": "Bağlantı başarılı!",
            "database": engine.url.database
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bağlantı hatası: {str(e)}")


@router.post("/execute")
async def execute_sql_query(request: SQLConnectionRequest):
    """
    SQL sorgusu çalıştırır (sadece SELECT).
    
    connection_string örnekleri:
    - PostgreSQL: postgresql://user:pass@host:5432/dbname
    - MySQL: mysql+pymysql://user:pass@host:3306/dbname
    - SQLite: sqlite:///path/to/db.sqlite
    - SQL Server: mssql+pyodbc://user:pass@server/db?driver=ODBC+Driver+17+for+SQL+Server
    """
    try:
        from sqlalchemy import create_engine, text
        import pandas as pd
        
        # Sorgu güvenlik kontrolü
        if not validate_query(request.query):
            raise HTTPException(
                status_code=400, 
                detail="Güvenlik: Sadece SELECT sorguları çalıştırılabilir. INSERT, UPDATE, DELETE gibi komutlar yasaktır."
            )
        
        # Bağlantı oluştur
        engine = create_engine(request.connection_string, pool_pre_ping=True)
        
        # Sorguyu çalıştır
        with engine.connect() as conn:
            df = pd.read_sql(text(request.query), conn)
        
        # Max satır limiti
        if len(df) > request.max_rows:
            df = df.head(request.max_rows)
            truncated = True
        else:
            truncated = False
        
        # Sütun tiplerini belirle
        columns_info = []
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_type = "date"
            else:
                col_type = "text"
            columns_info.append({"name": col, "type": col_type})
        
        return {
            "source": "sql",
            "query": request.query,
            "columns": df.columns.tolist(),
            "columns_info": columns_info,
            "data": df.to_dict(orient="records"),
            "row_count": len(df),
            "truncated": truncated,
            "max_rows": request.max_rows
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sorgu hatası: {str(e)}")


@router.post("/list-tables")
async def list_database_tables(connection_string: str = Form(...)):
    """
    Veritabanındaki tabloları listeler.
    """
    try:
        from sqlalchemy import create_engine, inspect
        
        engine = create_engine(connection_string, pool_pre_ping=True)
        inspector = inspect(engine)
        
        tables = []
        for table_name in inspector.get_table_names():
            columns = inspector.get_columns(table_name)
            tables.append({
                "name": table_name,
                "columns": [col['name'] for col in columns],
                "column_count": len(columns)
            })
        
        return {
            "database": engine.url.database,
            "tables": tables,
            "table_count": len(tables)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tablo listesi hatası: {str(e)}")


@router.post("/table-preview")
async def preview_table(
    connection_string: str = Form(...),
    table_name: str = Form(...),
    limit: int = Form(100)
):
    """
    Belirtilen tablonun önizlemesini döndürür.
    """
    try:
        from sqlalchemy import create_engine, text
        import pandas as pd
        
        # Güvenlik: Tablo adını sanitize et
        if not table_name.replace("_", "").isalnum():
            raise HTTPException(status_code=400, detail="Geçersiz tablo adı")
        
        engine = create_engine(connection_string, pool_pre_ping=True)
        
        # Limit kontrolü
        limit = min(limit, 1000)
        
        with engine.connect() as conn:
            df = pd.read_sql(text(f"SELECT * FROM {table_name} LIMIT {limit}"), conn)
        
        # Sütun tiplerini belirle
        columns_info = []
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_type = "date"
            else:
                col_type = "text"
            columns_info.append({"name": col, "type": col_type})
        
        return {
            "table": table_name,
            "columns": df.columns.tolist(),
            "columns_info": columns_info,
            "data": df.to_dict(orient="records"),
            "row_count": len(df),
            "preview": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Önizleme hatası: {str(e)}")
