"""
Macro Studio Pro - Backend Runner
FAZ-MS-1: Registry "broken" -> "implemented"

Bu modül, macro-studio-pro senaryosunun backend çalıştırıcısıdır.
custom_report_builder_pro engine'ini wrap eder.

KRITIK: custom_report_builder_pro.py DOKUNULMAZ (0 byte değişim)

Author: opradox Team
"""

import pandas as pd
import json
from io import BytesIO
from typing import Any, Dict

from fastapi import HTTPException


def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Macro Studio Pro senaryosunu çalıştırır.
    
    Bu fonksiyon, custom_report_builder_pro.run() fonksiyonuna delegate eder.
    Macro Studio'nun pipeline blokları, Report Studio Pro ile aynı engine'i kullanır.
    
    Args:
        df: Pandas DataFrame (yüklenen Excel verisi)
        params: Senaryo parametreleri
            - config: JSON string içinde { actions: [...] } yapısı
            - is_preview: bool (opsiyonel)
    
    Returns:
        Dict with:
            - summary: Özet bilgi
            - df_out: Çıktı DataFrame
            - excel_bytes: Excel dosyası (BytesIO)
            - excel_filename: Dosya adı
            - technical_details: Teknik detaylar
    """
    
    # Import here to avoid circular imports
    from .custom_report_builder_pro import run as report_runner
    
    # Parse config from params
    config_str = params.get("config", "{}")
    is_preview = params.get("is_preview", False)
    
    # Parse config JSON
    try:
        if isinstance(config_str, str):
            config_data = json.loads(config_str) if config_str else {}
        else:
            config_data = config_str or {}
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz config JSON: {str(e)}"
        )
    
    # Extract actions from config
    actions = config_data.get("actions", [])
    
    # Log pipeline info
    action_count = len(actions)
    action_types = [a.get("type", "unknown") for a in actions] if actions else []
    
    # Prepare params for report runner
    # Report runner expects config as JSON string
    runner_params = {
        "config": json.dumps({"actions": actions}) if actions else "{}",
        "is_preview": is_preview
    }
    
    # Copy any additional params (df2, etc.)
    if "df2" in params:
        runner_params["df2"] = params["df2"]
    
    # Delegate to report engine
    # CRITICAL: custom_report_builder_pro.py is NOT modified
    try:
        result = report_runner(df, runner_params)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Macro Studio motor hatası: {str(e)}"
        )
    
    # Enhance result with Macro Studio metadata
    if isinstance(result, dict):
        # Add Macro Studio specific info
        if "technical_details" not in result:
            result["technical_details"] = {}
        
        result["technical_details"]["macro_studio"] = {
            "action_count": action_count,
            "action_types": action_types,
            "mode": "build"
        }
        
        # Update filename prefix
        if "excel_filename" not in result or not result.get("excel_filename"):
            result["excel_filename"] = "opradox_macro_studio_pro.xlsx"
        
        # Ensure summary exists
        if "summary" not in result or not result.get("summary"):
            result["summary"] = {
                "scenario": "macro-studio-pro",
                "action_count": action_count,
                "input_rows": len(df),
                "output_rows": len(result.get("df_out", df)) if result.get("df_out") is not None else len(df)
            }
    
    return result
