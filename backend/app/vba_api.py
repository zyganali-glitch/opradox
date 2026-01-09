"""
VBA API - Opradox Macro Studio Pro
FAZ-3: Macro Doctor (ANALYZE MODE)

API endpoints for VBA analysis.
"""

import logging
import tempfile
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

from . import vba_analyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vba", tags=["VBA Analysis"])


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class SecurityFinding(BaseModel):
    type: str
    severity: str
    module: str
    line: int
    snippet: str
    description_tr: str
    description_en: str
    suggestion_tr: str
    suggestion_en: str


class SecurityAnalysis(BaseModel):
    risk_level: str
    findings: List[SecurityFinding]
    summary: Dict[str, int]


class PerformanceIssue(BaseModel):
    type: str
    impact: str
    count: int
    description_tr: str
    description_en: str
    suggestion_tr: str
    suggestion_en: str


class PerformanceGoodPractice(BaseModel):
    type: str
    description_tr: str
    description_en: str


class PerformanceAnalysis(BaseModel):
    score: int
    issues: List[PerformanceIssue]
    good_practices: List[PerformanceGoodPractice]


class QualityMetrics(BaseModel):
    total_lines: int
    module_count: int
    procedure_count: int
    avg_procedure_lines: int
    has_option_explicit: bool
    has_error_handling: bool


class QualityPattern(BaseModel):
    type: str
    count: int
    description_tr: str
    description_en: str


class QualityAnalysis(BaseModel):
    score: int
    metrics: QualityMetrics
    good_patterns: List[QualityPattern]
    bad_patterns: List[QualityPattern]


class IntentAnalysis(BaseModel):
    primary: Optional[str]
    primary_description_tr: Optional[str]
    primary_description_en: Optional[str]
    secondary: List[str]
    confidence: float
    scores: Dict[str, int]


class ModuleInfo(BaseModel):
    name: str
    type: str
    line_count: int
    preview: str
    parseable: bool


class AnalysisSummary(BaseModel):
    module_count: int
    total_lines: int
    risk_level: str
    performance_score: int
    quality_score: int
    primary_intent: Optional[str]


class VBAAnalysisResponse(BaseModel):
    success: bool
    has_macros: bool
    error: Optional[str] = None
    message_tr: Optional[str] = None
    message_en: Optional[str] = None
    security: Optional[SecurityAnalysis] = None
    performance: Optional[PerformanceAnalysis] = None
    quality: Optional[QualityAnalysis] = None
    intent: Optional[IntentAnalysis] = None
    modules: Optional[List[ModuleInfo]] = None
    summary: Optional[AnalysisSummary] = None


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/analyze", response_model=VBAAnalysisResponse)
async def analyze_vba(file: UploadFile = File(...)):
    """
    Analyze VBA macros in an uploaded XLSM file.
    
    Returns security, performance, quality analysis and intent detection.
    
    **SECURITY NOTE**: VBA code is NEVER executed, only parsed and analyzed.
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = file.filename.lower().split('.')[-1]
    if ext not in ['xlsm', 'xlsb', 'xls', 'doc', 'docm']:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {ext}. Supported: xlsm, xlsb, xls, doc, docm"
        )
    
    # Save to temp file for analysis
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Run analysis
        result = vba_analyzer.analyze_vba_file(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return result
        
    except Exception as e:
        logger.error(f"VBA analysis error: {e}")
        # Clean up if temp file exists
        if 'tmp_path' in locals():
            try:
                os.unlink(tmp_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/patterns/security")
async def get_security_patterns():
    """
    Get list of security patterns that are checked.
    """
    return {
        "patterns": [
            {
                "name": name,
                "severity": info["severity"],
                "description_tr": info["description_tr"],
                "description_en": info["description_en"]
            }
            for name, info in vba_analyzer.SECURITY_PATTERNS.items()
        ]
    }


@router.get("/patterns/performance")
async def get_performance_patterns():
    """
    Get list of performance patterns that are checked.
    """
    return {
        "bad_patterns": [
            {
                "name": name,
                "impact": info["impact"],
                "description_tr": info["description_tr"],
                "description_en": info["description_en"]
            }
            for name, info in vba_analyzer.PERFORMANCE_PATTERNS.items()
        ],
        "good_practices": [
            {
                "name": name,
                "description_tr": info["description_tr"],
                "description_en": info["description_en"]
            }
            for name, info in vba_analyzer.PERFORMANCE_GOOD_PRACTICES.items()
        ]
    }


@router.get("/patterns/quality")
async def get_quality_patterns():
    """
    Get list of code quality patterns that are checked.
    """
    return {
        "good_patterns": [
            {
                "name": name,
                "weight": info["weight"],
                "description_tr": info["description_tr"],
                "description_en": info["description_en"]
            }
            for name, info in vba_analyzer.QUALITY_GOOD_PATTERNS.items()
        ],
        "bad_patterns": [
            {
                "name": name,
                "penalty": info["penalty"],
                "description_tr": info["description_tr"],
                "description_en": info["description_en"]
            }
            for name, info in vba_analyzer.QUALITY_BAD_PATTERNS.items()
        ]
    }


@router.get("/intents")
async def get_intent_categories():
    """
    Get list of intent categories for macro classification.
    """
    return {
        "intents": [
            {
                "name": name,
                "keywords": info["keywords"],
                "description_tr": info["description_tr"],
                "description_en": info["description_en"]
            }
            for name, info in vba_analyzer.INTENT_KEYWORDS.items()
        ]
    }
