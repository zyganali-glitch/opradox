"""
Stats Service - Opradox Visual Studio & Excel Studio Ortak İstatistik Servisi
Hem backend hesaplama hem frontend için JSON response sağlar.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
import pandas as pd
from io import BytesIO
import json
import math

router = APIRouter(prefix="/viz", tags=["visualization"])

# -------------------------------------------------------
# AGGREGATION FUNCTIONS
# -------------------------------------------------------
def aggregate_data(
    data: List[Dict[str, Any]], 
    x_col: str, 
    y_col: str, 
    agg_type: str = "sum"
) -> Dict[str, List]:
    """
    Veriyi X sütununa göre grupla, Y sütununu aggrege et.
    
    Args:
        data: Liste halinde veri (records)
        x_col: Kategori sütunu (X ekseni)
        y_col: Değer sütunu (Y ekseni)
        agg_type: sum, avg, count, min, max
    
    Returns:
        {"categories": [...], "values": [...]}
    """
    if not data:
        return {"categories": [], "values": []}
    
    df = pd.DataFrame(data)
    
    if x_col not in df.columns:
        return {"categories": [], "values": [], "error": f"X sütunu bulunamadı: {x_col}"}
    
    if y_col not in df.columns:
        return {"categories": [], "values": [], "error": f"Y sütunu bulunamadı: {y_col}"}
    
    # Y sütununu sayısala çevir
    df[y_col] = pd.to_numeric(df[y_col], errors='coerce').fillna(0)
    
    # Aggregation
    agg_map = {
        "sum": "sum",
        "avg": "mean",
        "mean": "mean",
        "count": "count",
        "min": "min",
        "max": "max"
    }
    
    agg_func = agg_map.get(agg_type, "sum")
    
    grouped = df.groupby(x_col, dropna=False)[y_col].agg(agg_func).reset_index()
    grouped = grouped.sort_values(y_col, ascending=False)
    
    # NaN/Inf temizle
    categories = grouped[x_col].fillna("(Boş)").astype(str).tolist()
    values = grouped[y_col].replace([float('inf'), float('-inf')], 0).fillna(0).tolist()
    
    return {"categories": categories, "values": values}


def calculate_stats(data: List[float]) -> Dict[str, float]:
    """
    Temel istatistik hesaplamaları.
    
    Returns:
        {mean, median, min, max, sum, count, stdev, variance, q1, q3, iqr}
    """
    if not data:
        return {}
    
    # NaN ve Inf temizle
    clean_data = [x for x in data if x is not None and not math.isnan(x) and not math.isinf(x)]
    
    if not clean_data:
        return {}
    
    n = len(clean_data)
    sorted_data = sorted(clean_data)
    
    # Temel istatistikler
    total = sum(clean_data)
    mean = total / n
    
    # Medyan
    mid = n // 2
    if n % 2 == 0:
        median = (sorted_data[mid - 1] + sorted_data[mid]) / 2
    else:
        median = sorted_data[mid]
    
    # Varyans ve standart sapma
    variance = sum((x - mean) ** 2 for x in clean_data) / n if n > 0 else 0
    stdev = math.sqrt(variance)
    
    # Quartiles
    def percentile(data, p):
        k = (len(data) - 1) * p / 100
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return data[int(k)]
        return data[int(f)] * (c - k) + data[int(c)] * (k - f)
    
    q1 = percentile(sorted_data, 25)
    q3 = percentile(sorted_data, 75)
    iqr = q3 - q1
    
    return {
        "mean": round(mean, 4),
        "median": round(median, 4),
        "min": round(min(clean_data), 4),
        "max": round(max(clean_data), 4),
        "sum": round(total, 4),
        "count": n,
        "stdev": round(stdev, 4),
        "variance": round(variance, 4),
        "q1": round(q1, 4),
        "q3": round(q3, 4),
        "iqr": round(iqr, 4)
    }


# -------------------------------------------------------
# API ENDPOINTS
# -------------------------------------------------------

@router.post("/data")
async def get_viz_data(
    file: UploadFile = File(...),
    sheet_name: str = Query(None),
    header_row: int = Query(0),
    limit: int = Query(10000, description="Max satır sayısı")
):
    """
    Görselleştirme için tam veri seti döner.
    Frontend'de aggregation yapılabilmesi için tüm veriyi çeker.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row, nrows=limit)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row, nrows=limit)
        
        # NaN değerleri None'a çevir (JSON uyumlu)
        df = df.fillna("")
        
        # Column info
        columns_info = []
        for col in df.columns:
            col_type = "text"
            if pd.api.types.is_numeric_dtype(df[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_type = "date"
            
            columns_info.append({
                "name": str(col),
                "type": col_type,
                "sample": str(df[col].iloc[0]) if len(df) > 0 else ""
            })
        
        return {
            "columns": [str(c) for c in df.columns],
            "columns_info": columns_info,
            "data": df.to_dict(orient="records"),
            "row_count": len(df),
            "truncated": len(df) >= limit
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/aggregate")
async def aggregate_endpoint(
    file: UploadFile = File(...),
    x_column: str = Form(...),
    y_column: str = Form(...),
    aggregation: str = Form("sum"),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Sunucu tarafında aggregation yapar (büyük veri setleri için).
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        data = df.to_dict(orient="records")
        result = aggregate_data(data, x_column, y_column, aggregation)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stats")
async def calculate_stats_endpoint(
    file: UploadFile = File(...),
    column: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Belirtilen sütun için istatistik hesaplar.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        if column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Sütun bulunamadı: {column}")
        
        # Sayısal veriye çevir
        values = pd.to_numeric(df[column], errors='coerce').dropna().tolist()
        
        if not values:
            return {"column": column, "stats": {}, "error": "Sayısal veri bulunamadı"}
        
        stats = calculate_stats(values)
        
        return {
            "column": column,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/multi-stats")
async def calculate_multi_stats(
    file: UploadFile = File(...),
    columns: str = Form(...),  # JSON array string
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Birden fazla sütun için istatistik hesaplar.
    Korelasyon matrisi için kullanılır.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        column_list = json.loads(columns)
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        results = {}
        for col in column_list:
            if col in df.columns:
                values = pd.to_numeric(df[col], errors='coerce').dropna().tolist()
                if values:
                    results[col] = calculate_stats(values)
        
        # Korelasyon matrisi (sayısal sütunlar için)
        numeric_cols = [c for c in column_list if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
        correlation = {}
        if len(numeric_cols) >= 2:
            corr_df = df[numeric_cols].corr()
            correlation = corr_df.fillna(0).to_dict()
        
        return {
            "stats": results,
            "correlation": correlation
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
