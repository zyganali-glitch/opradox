"""
VBA Analyzer - Opradox Macro Studio Pro
FAZ-3: Macro Doctor (ANALYZE MODE)

ALLOWLIST: VBA parser, Pattern library
YASAKLAR: VBA çalıştırmak, Kod yazdırmak
"""

import re
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import tempfile
import os

logger = logging.getLogger(__name__)

# =============================================================================
# SECURITY PATTERNS (High/Medium/Low severity)
# =============================================================================

SECURITY_PATTERNS = {
    # HIGH severity - potential malware indicators
    "shell_exec": {
        "pattern": r"Shell\s*\(",
        "severity": "HIGH",
        "description_tr": "Shell komutu çalıştırma",
        "description_en": "Shell command execution",
        "suggestion_tr": "Dış komut çalıştırma güvenlik riski oluşturabilir",
        "suggestion_en": "External command execution may pose security risks"
    },
    "powershell": {
        "pattern": r"powershell",
        "severity": "HIGH",
        "description_tr": "PowerShell çağrısı",
        "description_en": "PowerShell invocation",
        "suggestion_tr": "PowerShell script'leri kötü amaçlı olabilir",
        "suggestion_en": "PowerShell scripts can be malicious"
    },
    "wscript": {
        "pattern": r"WScript\.",
        "severity": "HIGH",
        "description_tr": "Windows Script Host kullanımı",
        "description_en": "Windows Script Host usage",
        "suggestion_tr": "WSH system komutları çalıştırabilir",
        "suggestion_en": "WSH can execute system commands"
    },
    
    # MEDIUM severity - potentially risky
    "createobject": {
        "pattern": r"CreateObject\s*\(",
        "severity": "MEDIUM",
        "description_tr": "COM nesnesi oluşturma",
        "description_en": "COM object creation",
        "suggestion_tr": "Hangi nesne oluşturulduğunu kontrol edin",
        "suggestion_en": "Check which object is being created"
    },
    "http_request": {
        "pattern": r"XMLHTTP|WinHttp|MSXML2\.ServerXMLHTTP",
        "severity": "MEDIUM",
        "description_tr": "HTTP isteği",
        "description_en": "HTTP request",
        "suggestion_tr": "Ağ istekleri veri sızıntısına neden olabilir",
        "suggestion_en": "Network requests may cause data leakage"
    },
    "registry": {
        "pattern": r"RegRead|RegWrite|RegDelete",
        "severity": "MEDIUM",
        "description_tr": "Kayıt defteri erişimi",
        "description_en": "Registry access",
        "suggestion_tr": "Sistem ayarlarını değiştirebilir",
        "suggestion_en": "Can modify system settings"
    },
    "filesystem": {
        "pattern": r"FileSystemObject|Kill\s+|RmDir\s+",
        "severity": "MEDIUM",
        "description_tr": "Dosya sistemi erişimi",
        "description_en": "File system access",
        "suggestion_tr": "Dosya oluşturma/silme işlemleri",
        "suggestion_en": "File create/delete operations"
    },
    
    # LOW severity - worth noting
    "autoopen": {
        "pattern": r"Auto_Open|Workbook_Open|Document_Open",
        "severity": "LOW",
        "description_tr": "Otomatik çalışma",
        "description_en": "Auto-execution",
        "suggestion_tr": "Dosya açıldığında otomatik çalışır",
        "suggestion_en": "Runs automatically when file opens"
    },
    "autoclose": {
        "pattern": r"Auto_Close|Workbook_BeforeClose|Document_Close",
        "severity": "LOW",
        "description_tr": "Kapanışta çalışma",
        "description_en": "Close-time execution",
        "suggestion_tr": "Dosya kapatılırken çalışır",
        "suggestion_en": "Runs when file closes"
    },
    "sendkeys": {
        "pattern": r"SendKeys",
        "severity": "LOW",
        "description_tr": "Tuş simülasyonu",
        "description_en": "Keystroke simulation",
        "suggestion_tr": "Kullanıcı etkileşimini taklit eder",
        "suggestion_en": "Simulates user input"
    }
}

# =============================================================================
# PERFORMANCE PATTERNS
# =============================================================================

PERFORMANCE_PATTERNS = {
    "select_usage": {
        "pattern": r"\.Select\b",
        "impact": "HIGH",
        "description_tr": ".Select kullanımı (yavaş)",
        "description_en": ".Select usage (slow)",
        "suggestion_tr": "Doğrudan Range referansı kullanın",
        "suggestion_en": "Use direct Range references"
    },
    "activate_usage": {
        "pattern": r"\.Activate\b",
        "impact": "HIGH",
        "description_tr": ".Activate kullanımı (yavaş)",
        "description_en": ".Activate usage (slow)",
        "suggestion_tr": "Sheet değişkeni ile çalışın",
        "suggestion_en": "Work with Sheet variables"
    },
    "selection_usage": {
        "pattern": r"\bSelection\b",
        "impact": "MEDIUM",
        "description_tr": "Selection kullanımı",
        "description_en": "Selection usage",
        "suggestion_tr": "Açık Range referansları tercih edin",
        "suggestion_en": "Prefer explicit Range references"
    },
    "activesheet_usage": {
        "pattern": r"\bActiveSheet\b",
        "impact": "LOW",
        "description_tr": "ActiveSheet kullanımı",
        "description_en": "ActiveSheet usage",
        "suggestion_tr": "Açık Worksheet referansları tercih edin",
        "suggestion_en": "Prefer explicit Worksheet references"
    },
    "goto_usage": {
        "pattern": r"\bGoTo\s+\w+",
        "impact": "MEDIUM",
        "description_tr": "GoTo kullanımı",
        "description_en": "GoTo usage",
        "suggestion_tr": "Yapısal kontrol akışı tercih edin",
        "suggestion_en": "Prefer structured control flow"
    },
    "nested_loops": {
        "pattern": r"For\s+.*\n(?:.*\n)*?.*For\s+",
        "impact": "MEDIUM",
        "description_tr": "İç içe döngüler",
        "description_en": "Nested loops",
        "suggestion_tr": "Dizi işleme veya Dictionary kullanın",
        "suggestion_en": "Use array processing or Dictionary"
    }
}

# Performance good practices (presence is good)
PERFORMANCE_GOOD_PRACTICES = {
    "screenupdating_off": {
        "pattern": r"ScreenUpdating\s*=\s*False",
        "description_tr": "ScreenUpdating kapatma",
        "description_en": "ScreenUpdating disabled"
    },
    "calculation_manual": {
        "pattern": r"Calculation\s*=\s*xl(Manual|CalculationManual)",
        "description_tr": "Manual hesaplama modu",
        "description_en": "Manual calculation mode"
    },
    "events_disabled": {
        "pattern": r"EnableEvents\s*=\s*False",
        "description_tr": "Events kapatma",
        "description_en": "Events disabled"
    },
    "statusbar_usage": {
        "pattern": r"StatusBar\s*=",
        "description_tr": "StatusBar ilerleme göstergesi",
        "description_en": "StatusBar progress indicator"
    }
}

# =============================================================================
# CODE QUALITY PATTERNS
# =============================================================================

QUALITY_GOOD_PATTERNS = {
    "option_explicit": {
        "pattern": r"Option Explicit",
        "weight": 20,
        "description_tr": "Option Explicit (değişken tanımlama zorunlu)",
        "description_en": "Option Explicit (variable declaration required)"
    },
    "error_handling": {
        "pattern": r"On Error\s+(GoTo|Resume)",
        "weight": 15,
        "description_tr": "Hata yakalama",
        "description_en": "Error handling"
    },
    "comments": {
        "pattern": r"'\s*\S+",
        "weight": 10,
        "description_tr": "Yorum satırları",
        "description_en": "Comment lines"
    },
    "constants": {
        "pattern": r"\bConst\s+\w+",
        "weight": 10,
        "description_tr": "Sabit tanımlama",
        "description_en": "Constant definitions"
    },
    "type_declarations": {
        "pattern": r"\bAs\s+(String|Integer|Long|Double|Boolean|Variant|Object)",
        "weight": 5,
        "description_tr": "Tip tanımlama",
        "description_en": "Type declarations"
    }
}

QUALITY_BAD_PATTERNS = {
    "magic_numbers": {
        "pattern": r"=\s*\d{3,}\b",
        "penalty": 5,
        "description_tr": "Sihirli sayılar (sabit kullanın)",
        "description_en": "Magic numbers (use constants)"
    },
    "long_lines": {
        "pattern": r".{150,}",
        "penalty": 3,
        "description_tr": "Çok uzun satırlar",
        "description_en": "Very long lines"
    },
    "empty_error_handling": {
        "pattern": r"On Error Resume Next\s*\n\s*\n",
        "penalty": 10,
        "description_tr": "Boş hata yakalama",
        "description_en": "Empty error handling"
    }
}

# =============================================================================
# INTENT DETECTION KEYWORDS
# =============================================================================

INTENT_KEYWORDS = {
    "data_processing": {
        "keywords": ["Range", "Cells", "Worksheet", "Copy", "Paste", "Value", "Offset"],
        "description_tr": "Veri işleme",
        "description_en": "Data processing"
    },
    "file_operations": {
        "keywords": ["Open", "Close", "Save", "Workbook", "Workbooks", "Path", "Dir"],
        "description_tr": "Dosya işlemleri",
        "description_en": "File operations"
    },
    "formatting": {
        "keywords": ["Font", "Interior", "Border", "Format", "Color", "Style", "Bold", "Italic"],
        "description_tr": "Biçimlendirme",
        "description_en": "Formatting"
    },
    "calculation": {
        "keywords": ["Sum", "Count", "Average", "Formula", "Calculate", "WorksheetFunction"],
        "description_tr": "Hesaplama",
        "description_en": "Calculation"
    },
    "automation": {
        "keywords": ["Timer", "OnTime", "Schedule", "Application.OnTime", "DoEvents"],
        "description_tr": "Otomasyon",
        "description_en": "Automation"
    },
    "reporting": {
        "keywords": ["Print", "Export", "PDF", "PrintOut", "PageSetup"],
        "description_tr": "Raporlama",
        "description_en": "Reporting"
    },
    "user_interface": {
        "keywords": ["MsgBox", "InputBox", "UserForm", "Dialog", "CommandButton"],
        "description_tr": "Kullanıcı arayüzü",
        "description_en": "User interface"
    },
    "database": {
        "keywords": ["Connection", "Recordset", "ADODB", "SQL", "Query", "Execute"],
        "description_tr": "Veritabanı",
        "description_en": "Database"
    }
}

# =============================================================================
# VBA EXTRACTOR
# =============================================================================

def extract_vba_modules(file_path: str) -> Dict[str, Any]:
    """
    Extract VBA modules from XLSM/XLSB file using oletools.
    
    Returns:
        {
            "success": bool,
            "modules": [{"name": str, "code": str, "type": str}],
            "error": str or None
        }
    """
    try:
        from oletools.olevba import VBA_Parser, TYPE_OLE, TYPE_OpenXML, TYPE_Word2003_XML, TYPE_MHTML
        
        vba_parser = VBA_Parser(file_path)
        
        if not vba_parser.detect_vba_macros():
            return {
                "success": True,
                "modules": [],
                "has_macros": False,
                "error": None
            }
        
        modules = []
        for (filename, stream_path, vba_filename, vba_code) in vba_parser.extract_macros():
            if vba_code and vba_code.strip():
                module_type = "Unknown"
                if vba_filename:
                    if vba_filename.startswith("ThisWorkbook") or vba_filename.startswith("ThisDocument"):
                        module_type = "Document"
                    elif vba_filename.startswith("Sheet"):
                        module_type = "Sheet"
                    elif vba_filename.endswith(".frm"):
                        module_type = "UserForm"
                    elif vba_filename.endswith(".cls"):
                        module_type = "Class"
                    else:
                        module_type = "Module"
                
                modules.append({
                    "name": vba_filename or "Unknown",
                    "code": vba_code,
                    "type": module_type,
                    "stream_path": stream_path,
                    "line_count": len(vba_code.split('\n'))
                })
        
        vba_parser.close()
        
        return {
            "success": True,
            "modules": modules,
            "has_macros": len(modules) > 0,
            "error": None
        }
        
    except ImportError:
        logger.error("oletools not installed")
        return {
            "success": False,
            "modules": [],
            "has_macros": False,
            "error": "oletools not installed"
        }
    except Exception as e:
        logger.error(f"VBA extraction error: {e}")
        return {
            "success": False,
            "modules": [],
            "has_macros": False,
            "error": str(e)
        }

# =============================================================================
# ANALYZERS
# =============================================================================

def analyze_security(modules: List[Dict]) -> Dict[str, Any]:
    """
    Analyze VBA code for security issues.
    
    Returns:
        {
            "risk_level": "HIGH" | "MEDIUM" | "LOW" | "NONE",
            "findings": [{type, severity, line, snippet, description}],
            "summary": {...}
        }
    """
    findings = []
    severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    
    for module in modules:
        code = module.get("code", "")
        lines = code.split('\n')
        
        for pattern_name, pattern_info in SECURITY_PATTERNS.items():
            regex = re.compile(pattern_info["pattern"], re.IGNORECASE)
            
            for line_num, line in enumerate(lines, 1):
                matches = regex.findall(line)
                if matches:
                    findings.append({
                        "type": pattern_name,
                        "severity": pattern_info["severity"],
                        "module": module["name"],
                        "line": line_num,
                        "snippet": line.strip()[:100],
                        "description_tr": pattern_info["description_tr"],
                        "description_en": pattern_info["description_en"],
                        "suggestion_tr": pattern_info["suggestion_tr"],
                        "suggestion_en": pattern_info["suggestion_en"]
                    })
                    severity_counts[pattern_info["severity"]] += 1
    
    # Determine overall risk level
    if severity_counts["HIGH"] > 0:
        risk_level = "HIGH"
    elif severity_counts["MEDIUM"] > 2:
        risk_level = "MEDIUM"
    elif severity_counts["MEDIUM"] > 0 or severity_counts["LOW"] > 3:
        risk_level = "LOW"
    else:
        risk_level = "NONE"
    
    return {
        "risk_level": risk_level,
        "findings": findings,
        "summary": severity_counts
    }


def analyze_performance(modules: List[Dict]) -> Dict[str, Any]:
    """
    Analyze VBA code for performance issues.
    
    Returns:
        {
            "score": 0-100,
            "issues": [{type, impact, count, suggestion}],
            "good_practices": [...]
        }
    """
    issues = []
    good_practices = []
    all_code = "\n".join(m.get("code", "") for m in modules)
    
    # Check for bad patterns
    total_penalty = 0
    for pattern_name, pattern_info in PERFORMANCE_PATTERNS.items():
        regex = re.compile(pattern_info["pattern"], re.IGNORECASE | re.MULTILINE)
        matches = regex.findall(all_code)
        count = len(matches)
        
        if count > 0:
            penalty = count * (5 if pattern_info["impact"] == "HIGH" else 3 if pattern_info["impact"] == "MEDIUM" else 1)
            total_penalty += penalty
            issues.append({
                "type": pattern_name,
                "impact": pattern_info["impact"],
                "count": count,
                "description_tr": pattern_info["description_tr"],
                "description_en": pattern_info["description_en"],
                "suggestion_tr": pattern_info["suggestion_tr"],
                "suggestion_en": pattern_info["suggestion_en"]
            })
    
    # Check for good practices
    total_bonus = 0
    for pattern_name, pattern_info in PERFORMANCE_GOOD_PRACTICES.items():
        regex = re.compile(pattern_info["pattern"], re.IGNORECASE)
        if regex.search(all_code):
            total_bonus += 10
            good_practices.append({
                "type": pattern_name,
                "description_tr": pattern_info["description_tr"],
                "description_en": pattern_info["description_en"]
            })
    
    # Calculate score (100 - penalties + bonuses, capped at 0-100)
    score = max(0, min(100, 100 - total_penalty + total_bonus))
    
    return {
        "score": score,
        "issues": issues,
        "good_practices": good_practices
    }


def analyze_quality(modules: List[Dict]) -> Dict[str, Any]:
    """
    Analyze VBA code for quality metrics.
    
    Returns:
        {
            "score": 0-100,
            "metrics": {...},
            "good_patterns": [...],
            "bad_patterns": [...]
        }
    """
    all_code = "\n".join(m.get("code", "") for m in modules)
    total_lines = sum(m.get("line_count", 0) for m in modules)
    
    good_found = []
    bad_found = []
    total_weight = 0
    total_penalty = 0
    
    # Check good patterns
    for pattern_name, pattern_info in QUALITY_GOOD_PATTERNS.items():
        regex = re.compile(pattern_info["pattern"], re.IGNORECASE | re.MULTILINE)
        matches = regex.findall(all_code)
        if matches:
            total_weight += pattern_info["weight"]
            good_found.append({
                "type": pattern_name,
                "count": len(matches),
                "description_tr": pattern_info["description_tr"],
                "description_en": pattern_info["description_en"]
            })
    
    # Check bad patterns
    for pattern_name, pattern_info in QUALITY_BAD_PATTERNS.items():
        regex = re.compile(pattern_info["pattern"], re.IGNORECASE | re.MULTILINE)
        matches = regex.findall(all_code)
        if matches:
            total_penalty += pattern_info["penalty"] * len(matches)
            bad_found.append({
                "type": pattern_name,
                "count": len(matches),
                "description_tr": pattern_info["description_tr"],
                "description_en": pattern_info["description_en"]
            })
    
    # Calculate procedure count
    proc_regex = re.compile(r"(Sub|Function)\s+\w+\s*\(", re.IGNORECASE)
    procedure_count = len(proc_regex.findall(all_code))
    
    # Calculate average procedure length
    avg_proc_lines = total_lines // max(procedure_count, 1)
    
    # Score calculation
    base_score = min(100, total_weight * 2)
    final_score = max(0, min(100, base_score - total_penalty))
    
    # Bonus for reasonable procedure length
    if 10 <= avg_proc_lines <= 50:
        final_score = min(100, final_score + 10)
    
    return {
        "score": final_score,
        "metrics": {
            "total_lines": total_lines,
            "module_count": len(modules),
            "procedure_count": procedure_count,
            "avg_procedure_lines": avg_proc_lines,
            "has_option_explicit": any(p["type"] == "option_explicit" for p in good_found),
            "has_error_handling": any(p["type"] == "error_handling" for p in good_found)
        },
        "good_patterns": good_found,
        "bad_patterns": bad_found
    }


def detect_intent(modules: List[Dict]) -> Dict[str, Any]:
    """
    Detect the intent/purpose of the VBA code using heuristics.
    
    Returns:
        {
            "primary": str,
            "secondary": [str],
            "confidence": float,
            "details": {...}
        }
    """
    all_code = "\n".join(m.get("code", "") for m in modules).lower()
    
    intent_scores = {}
    
    for intent_name, intent_info in INTENT_KEYWORDS.items():
        score = 0
        for keyword in intent_info["keywords"]:
            count = all_code.count(keyword.lower())
            score += count
        intent_scores[intent_name] = score
    
    # Sort by score
    sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Determine primary and secondary intents
    primary = None
    secondary = []
    total_score = sum(intent_scores.values())
    
    if sorted_intents and sorted_intents[0][1] > 0:
        primary = sorted_intents[0][0]
        primary_info = INTENT_KEYWORDS[primary]
        
        # Secondary intents (score > 20% of primary)
        threshold = sorted_intents[0][1] * 0.2
        for intent, score in sorted_intents[1:]:
            if score >= threshold and score > 0:
                secondary.append(intent)
    
    # Confidence based on how dominant the primary intent is
    confidence = 0.0
    if total_score > 0 and primary:
        confidence = min(1.0, intent_scores[primary] / total_score + 0.3)
    
    return {
        "primary": primary,
        "primary_description_tr": INTENT_KEYWORDS[primary]["description_tr"] if primary else None,
        "primary_description_en": INTENT_KEYWORDS[primary]["description_en"] if primary else None,
        "secondary": secondary,
        "confidence": round(confidence, 2),
        "scores": dict(sorted_intents[:5])
    }


# =============================================================================
# MAIN ANALYSIS FUNCTION
# =============================================================================

def analyze_vba_file(file_path: str) -> Dict[str, Any]:
    """
    Complete VBA analysis for a file.
    
    Returns comprehensive analysis report.
    """
    logger.info(f"Analyzing VBA in: {file_path}")
    
    # Extract VBA modules
    extraction = extract_vba_modules(file_path)
    
    if not extraction["success"]:
        return {
            "success": False,
            "error": extraction["error"],
            "has_macros": False
        }
    
    if not extraction["has_macros"]:
        return {
            "success": True,
            "has_macros": False,
            "message_tr": "Bu dosyada VBA makrosu bulunamadı",
            "message_en": "No VBA macros found in this file"
        }
    
    modules = extraction["modules"]
    
    # Run all analyses
    security = analyze_security(modules)
    performance = analyze_performance(modules)
    quality = analyze_quality(modules)
    intent = detect_intent(modules)
    
    # Build hybrid view data (code without exposing raw VBA)
    hybrid_view = []
    for module in modules:
        hybrid_view.append({
            "name": module["name"],
            "type": module["type"],
            "line_count": module["line_count"],
            "preview": module["code"][:500] + "..." if len(module["code"]) > 500 else module["code"],
            "parseable": True  # All oletools-extracted code is parseable
        })
    
    return {
        "success": True,
        "has_macros": True,
        "security": security,
        "performance": performance,
        "quality": quality,
        "intent": intent,
        "modules": hybrid_view,
        "summary": {
            "module_count": len(modules),
            "total_lines": sum(m["line_count"] for m in modules),
            "risk_level": security["risk_level"],
            "performance_score": performance["score"],
            "quality_score": quality["score"],
            "primary_intent": intent["primary"]
        }
    }
