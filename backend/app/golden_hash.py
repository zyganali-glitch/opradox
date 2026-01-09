"""
Golden Hash - Opradox Excel Studio
Canonical hash and metrics computation for golden suite regression testing.

NEDEN XLSX BYTES MD5 DEĞİL?
- Excel dosyasının metadata'sı (oluşturma tarihi, yazıcı bilgisi) her seferinde değişir
- Aynı veri için farklı hash oluşur = false fail
- Çözüm: DataFrame'i kanonikleştir -> CSV string hash'i al
"""
from __future__ import annotations
import hashlib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional
from io import BytesIO


def canonicalize_df(df: pd.DataFrame, float_round: int = 8) -> pd.DataFrame:
    """
    DataFrame'i kanonik forma dönüştür (deterministik karşılaştırma için).
    
    Kurallar:
    - Kolon sırası: alfabetik
    - NaN/None: pd.NA olarak standartlaştır
    - Float: belirtilen hassasiyete yuvarla
    - -0.0 -> 0.0
    - String: strip
    
    Args:
        df: Girdi DataFrame
        float_round: Float yuvarlama hassasiyeti (default 8)
    
    Returns:
        Kanonikleştirilmiş DataFrame kopyası
    """
    df2 = df.copy()
    
    # Kolon sırasını alfabetik yap
    df2 = df2.reindex(sorted(df2.columns), axis=1)
    
    for col in df2.columns:
        # Float sütunlar
        if pd.api.types.is_float_dtype(df2[col]):
            # Yuvarlama
            df2[col] = df2[col].round(float_round)
            # -0.0 -> 0.0
            df2[col] = df2[col].apply(lambda x: 0.0 if x == 0.0 else x)
        # String sütunlar
        elif pd.api.types.is_object_dtype(df2[col]) or pd.api.types.is_string_dtype(df2[col]):
            df2[col] = df2[col].apply(lambda x: str(x).strip() if pd.notna(x) else x)
    
    return df2


def hash_df_canonical(df: pd.DataFrame) -> str:
    """
    Kanonikleştirilmiş DataFrame'in MD5 hash'ini hesapla.
    
    Args:
        df: Kanonikleştirilmiş DataFrame
    
    Returns:
        MD5 hash (hex string)
    """
    # CSV string'e dönüştür (index yok, \n sabit line terminator)
    csv_str = df.to_csv(index=False, lineterminator="\n")
    
    # MD5 hash
    return hashlib.md5(csv_str.encode("utf-8")).hexdigest()


def compute_df_hash(df: pd.DataFrame, float_round: int = 8) -> str:
    """
    DataFrame için kanonik hash hesapla (tek adımlı).
    """
    canonical = canonicalize_df(df, float_round)
    return hash_df_canonical(canonical)


def compute_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    DataFrame için temel metrikler hesapla.
    
    Returns:
        - row_count: Satır sayısı
        - col_count: Sütun sayısı
        - columns: Sütun listesi
        - null_count: Toplam null sayısı
        - numeric_stats: Sayısal sütunların mean/sum değerleri (round'lu)
    """
    metrics: Dict[str, Any] = {
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": list(df.columns),
        "null_count": int(df.isnull().sum().sum())
    }
    
    # Sayısal sütunlar için istatistikler
    numeric_stats = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        try:
            numeric_stats[col] = {
                "mean": round(float(df[col].mean()), 6) if not df[col].isnull().all() else None,
                "sum": round(float(df[col].sum()), 6) if not df[col].isnull().all() else None
            }
        except Exception:
            pass
    
    if numeric_stats:
        metrics["numeric_stats"] = numeric_stats
    
    return metrics


def extract_df_from_result(result: Any) -> Optional[pd.DataFrame]:
    """
    Scenario runner sonucundan DataFrame çıkar.
    
    Desteklenen formatlar:
    - result["df_out"]: DataFrame
    - result["excel_bytes"]: BytesIO veya bytes -> pandas ile oku
    - result["data"]: dict/list -> DataFrame'e dönüştür
    
    Returns:
        DataFrame veya None
    """
    if result is None:
        return None
    
    if not isinstance(result, dict):
        return None
    
    # df_out varsa doğrudan kullan
    if "df_out" in result and isinstance(result["df_out"], pd.DataFrame):
        return result["df_out"]
    
    # excel_bytes varsa pandas ile oku
    if "excel_bytes" in result:
        excel_bytes = result["excel_bytes"]
        try:
            if isinstance(excel_bytes, bytes):
                return pd.read_excel(BytesIO(excel_bytes))
            elif hasattr(excel_bytes, "read"):
                excel_bytes.seek(0)
                return pd.read_excel(excel_bytes)
        except Exception:
            pass
    
    # data varsa DataFrame'e dönüştür
    if "data" in result:
        data = result["data"]
        try:
            if isinstance(data, list):
                return pd.DataFrame(data)
            elif isinstance(data, dict):
                return pd.DataFrame(data)
        except Exception:
            pass
    
    return None


def compare_metrics(
    actual: Dict[str, Any],
    expected: Dict[str, Any],
    tolerance: Optional[Dict[str, float]] = None
) -> Tuple[bool, list]:
    """
    Metrik karşılaştırması yap.
    
    Args:
        actual: Gerçek metrikler
        expected: Beklenen metrikler
        tolerance: Tolerans değerleri (varsayılan 1e-6)
    
    Returns:
        (passed, diff_list)
    """
    default_tolerance = 1e-6
    tolerance = tolerance or {}
    diffs = []
    passed = True
    
    # Exact match: row_count, col_count, columns
    for key in ["row_count", "col_count"]:
        if actual.get(key) != expected.get(key):
            diffs.append(f"{key}: actual={actual.get(key)}, expected={expected.get(key)}")
            passed = False
    
    # Columns exact match (sorted)
    actual_cols = sorted(actual.get("columns", []))
    expected_cols = sorted(expected.get("columns", []))
    if actual_cols != expected_cols:
        diffs.append(f"columns: actual={actual_cols}, expected={expected_cols}")
        passed = False
    
    # Numeric stats toleranslı karşılaştırma
    actual_stats = actual.get("numeric_stats", {})
    expected_stats = expected.get("numeric_stats", {})
    
    for col in set(actual_stats.keys()) | set(expected_stats.keys()):
        for stat in ["mean", "sum"]:
            actual_val = actual_stats.get(col, {}).get(stat)
            expected_val = expected_stats.get(col, {}).get(stat)
            
            if actual_val is None and expected_val is None:
                continue
            
            if actual_val is None or expected_val is None:
                diffs.append(f"{col}.{stat}: actual={actual_val}, expected={expected_val}")
                passed = False
                continue
            
            tol = tolerance.get(f"{col}.{stat}", tolerance.get(stat, default_tolerance))
            if abs(actual_val - expected_val) > tol:
                diffs.append(f"{col}.{stat}: actual={actual_val}, expected={expected_val} (tol={tol})")
                passed = False
    
    return passed, diffs
