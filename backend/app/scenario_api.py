"""
Scenario API - Opradox Unified Scenario Runner
FAZ-A: Merkezi Scenario Router

POST /api/scenario/run - Tek endpoint ile tüm senaryoları yönetir.

ALLOWLIST: custom_report_builder_pro.run(), vba_analyzer.analyze()
YASAKLAR: custom_report_builder_pro.py değiştirmek
"""

import logging
import tempfile
import os
import json
from io import BytesIO
from typing import Dict, Any, List, Optional, Literal

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scenario", tags=["Scenario Runner"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class DataSourceInput(BaseModel):
    """Veri kaynağı bilgileri."""
    sheet_name: Optional[str] = None
    header_row: int = 0
    file_id: Optional[str] = None  # Future: cached file reference


class ScenarioAction(BaseModel):
    """Tek bir pipeline action."""
    type: str
    column: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[Any] = None
    params: Optional[Dict[str, Any]] = None


class ScenarioOptions(BaseModel):
    """Çalıştırma seçenekleri."""
    preview: bool = False
    lang: str = "tr"
    row_limit: int = 100


class ScenarioRunRequest(BaseModel):
    """Unified scenario run request."""
    scenario_id: Literal["report-studio-pro", "macro-studio-pro"]
    mode: Literal["build", "doctor"] = "build"
    input: Optional[Dict[str, Any]] = None
    options: Optional[ScenarioOptions] = None


class PreviewData(BaseModel):
    """Preview response data."""
    columns: List[str]
    rows: List[Dict[str, Any]]
    truncated: bool
    row_limit: int
    total_rows: int


class ScenarioRunResponse(BaseModel):
    """Unified scenario run response."""
    success: bool
    scenario_id: str
    mode: str
    summary: Optional[str] = None
    preview_data: Optional[PreviewData] = None
    excel_available: bool = False
    download_url: Optional[str] = None
    error: Optional[str] = None
    technical_details: Optional[Dict[str, Any]] = None


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/run")
async def run_scenario(
    file: UploadFile = File(...),
    request_json: str = Form(...),
    file2: UploadFile = File(None),
):
    """
    Unified scenario runner endpoint.
    
    Routes to appropriate engine based on scenario_id and mode:
    - report-studio-pro → custom_report_builder_pro.run()
    - macro-studio-pro + build → custom_report_builder_pro.run()
    - macro-studio-pro + doctor → vba_analyzer.analyze()
    
    **CRITICAL**: custom_report_builder_pro.py is NEVER modified.
    """
    import pandas as pd
    import numpy as np
    import time
    
    start_time = time.time()
    
    # Parse request JSON
    try:
        request_data = json.loads(request_json)
        request = ScenarioRunRequest(**request_data)
    except Exception as e:
        logger.error(f"Request parse error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    
    scenario_id = request.scenario_id
    mode = request.mode
    input_data = request.input or {}
    options = request.options or ScenarioOptions()
    
    logger.info(f"[SCENARIO API] scenario_id={scenario_id}, mode={mode}")
    
    # =========================================================================
    # ROUTER DECISION
    # =========================================================================
    
    if scenario_id == "report-studio-pro":
        # Report Studio Pro → custom_report_builder_pro.run()
        return await _run_report_engine(file, file2, input_data, options, scenario_id, start_time)
    
    elif scenario_id == "macro-studio-pro":
        if mode == "build":
            # Macro Studio BUILD mode → custom_report_builder_pro.run()
            return await _run_report_engine(file, file2, input_data, options, scenario_id, start_time)
        elif mode == "doctor":
            # Macro Studio DOCTOR mode → vba_analyzer.analyze()
            return await _run_doctor_engine(file, input_data, options, scenario_id, start_time)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown mode: {mode}")
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario_id: {scenario_id}")


async def _run_report_engine(
    file: UploadFile,
    file2: Optional[UploadFile],
    input_data: Dict[str, Any],
    options: ScenarioOptions,
    scenario_id: str,
    start_time: float
) -> Dict[str, Any]:
    """
    Report engine wrapper - calls custom_report_builder_pro.run()
    """
    import pandas as pd
    import numpy as np
    import time
    
    from .excel_utils import read_table_from_upload
    from .scenarios.custom_report_builder_pro import run as report_runner
    from .scenario_registry import LAST_EXCEL_STORE
    
    # Read primary file
    data_source = input_data.get("data_source", {})
    sheet_name = data_source.get("sheet_name")
    header_row = data_source.get("header_row", 0)
    
    try:
        df = read_table_from_upload(file, sheet_name=sheet_name, header_row=header_row)
    except Exception as e:
        logger.error(f"File read error: {e}")
        raise HTTPException(status_code=400, detail=f"Dosya okuma hatası: {str(e)}")
    
    # Prepare params for runner
    actions = input_data.get("actions", [])
    params_dict = {
        "config": json.dumps({"actions": actions}) if actions else "{}",
        "is_preview": options.preview
    }
    
    # Read secondary file if provided
    if file2:
        try:
            df2 = read_table_from_upload(file2)
            params_dict["df2"] = df2
        except Exception as e:
            logger.warning(f"Second file read warning: {e}")
    
    # Run the engine (DOES NOT MODIFY custom_report_builder_pro.py)
    try:
        result = report_runner(df, params_dict)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Engine error: {e}")
        raise HTTPException(status_code=500, detail=f"Motor hatası: {str(e)}")
    
    # Build response
    time_ms = int((time.time() - start_time) * 1000)
    
    response = {
        "success": True,
        "scenario_id": scenario_id,
        "mode": "build",
        "technical_details": {
            "input_rows": len(df),
            "time_ms": time_ms
        }
    }
    
    # Handle preview response
    if options.preview and isinstance(result, dict):
        if "preview_data" in result:
            response["preview_data"] = result["preview_data"]
        elif "df_out" in result and result["df_out"] is not None:
            df_out = result["df_out"]
            total_rows = len(df_out)
            preview_df = df_out.head(options.row_limit)
            
            response["preview_data"] = {
                "columns": list(preview_df.columns),
                "rows": preview_df.replace({np.nan: None}).to_dict(orient='records'),
                "truncated": total_rows > options.row_limit,
                "row_limit": options.row_limit,
                "total_rows": total_rows
            }
        response["summary"] = result.get("summary", f"İşlem tamamlandı ({time_ms}ms)")
    else:
        # Full run response
        response["summary"] = result.get("summary") if isinstance(result, dict) else str(result)
        
        # Store for download
        if isinstance(result, dict):
            has_output = False
            store_data = {}
            
            if "df_out" in result and result["df_out"] is not None:
                store_data["dataframe"] = result["df_out"]
                has_output = True
                
            if "excel_bytes" in result and result["excel_bytes"] is not None:
                store_data["bytes"] = result["excel_bytes"]
                has_output = True
            
            if has_output:
                store_data["filename_prefix"] = result.get("excel_filename", f"opradox_{scenario_id}")
                LAST_EXCEL_STORE[scenario_id] = store_data
                response["excel_available"] = True
                response["download_url"] = f"/download/{scenario_id}?format=xlsx"
    
    return response


async def _run_doctor_engine(
    file: UploadFile,
    input_data: Dict[str, Any],
    options: ScenarioOptions,
    scenario_id: str,
    start_time: float
) -> Dict[str, Any]:
    """
    Doctor engine wrapper - calls vba_analyzer.analyze()
    """
    import time
    from . import vba_analyzer
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Dosya adı gerekli")
    
    ext = file.filename.lower().split('.')[-1]
    if ext not in ['xlsm', 'xlsb', 'xls', 'doc', 'docm']:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya türü: {ext}. Desteklenen: xlsm, xlsb, xls, doc, docm"
        )
    
    # Save to temp file for analysis
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Run VBA analysis
        analysis_result = vba_analyzer.analyze_vba_file(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
    except Exception as e:
        logger.error(f"VBA analysis error: {e}")
        if 'tmp_path' in locals():
            try:
                os.unlink(tmp_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Analiz hatası: {str(e)}")
    
    time_ms = int((time.time() - start_time) * 1000)
    
    # Build response with analysis results
    response = {
        "success": analysis_result.get("success", True),
        "scenario_id": scenario_id,
        "mode": "doctor",
        "summary": f"VBA analizi tamamlandı ({time_ms}ms)",
        "technical_details": {
            "time_ms": time_ms,
            "has_macros": analysis_result.get("has_macros", False)
        },
        "analysis": analysis_result
    }
    
    return response


# =============================================================================
# HEALTH CHECK
# =============================================================================

@router.get("/health")
async def scenario_api_health():
    """Scenario API health check."""
    return {
        "status": "ok",
        "service": "scenario-api",
        "supported_scenarios": ["report-studio-pro", "macro-studio-pro"],
        "supported_modes": ["build", "doctor"]
    }
