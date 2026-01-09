"""
Golden Suite Tests - Regression Testing
Kütüphane/kod değişince çıktı değişti mi kontrolü.
"""
import pytest
import json
import sys
from pathlib import Path
from datetime import datetime, timezone

# Backend modüllerine erişim
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.golden_hash import (
    compute_df_hash,
    compute_metrics,
    extract_df_from_result,
    canonicalize_df,
    compare_metrics
)
from app.scenario_registry import get_scenario
import pandas as pd


GOLDEN_EXPECTED_PATH = BACKEND_DIR / "golden" / "expected" / "golden_expected.json"
GOLDEN_INPUTS_DIR = BACKEND_DIR / "golden" / "inputs"
REPORT_PATH = BACKEND_DIR / "tests" / "_reports" / "golden_last.json"


def load_golden_expected():
    """Load golden_expected.json"""
    if not GOLDEN_EXPECTED_PATH.exists():
        pytest.skip(f"Golden expected not found: {GOLDEN_EXPECTED_PATH}")
    
    with open(GOLDEN_EXPECTED_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def golden_data():
    """Load golden expected fixture"""
    return load_golden_expected()


def run_golden_case(case: dict) -> dict:
    """
    Tek bir golden case'i çalıştır ve sonucu döndür.
    """
    case_id = case["case_id"]
    scenario_id = case["scenario_id"]
    input_file = case["input_file"]
    params = case["params"]
    expected = case["expect"]
    tolerance = case.get("tolerance", {}).get("metrics", {})
    
    result = {
        "case_id": case_id,
        "passed": False,
        "diffs": []
    }
    
    try:
        # Input yükle
        input_path = BACKEND_DIR / input_file
        if not input_path.exists():
            result["diffs"].append(f"Input not found: {input_path}")
            return result
        
        df_input = pd.read_excel(input_path)
        
        # Runner çalıştır
        scenario = get_scenario(scenario_id)
        runner = scenario.get("runner")
        if runner is None:
            result["diffs"].append(f"No runner for: {scenario_id}")
            return result
        
        run_result = runner(df_input, params)
        df_out = extract_df_from_result(run_result)
        
        if df_out is None:
            result["diffs"].append("Runner returned no DataFrame")
            return result
        
        # Kanonikleştir ve karşılaştır
        df_canonical = canonicalize_df(df_out)
        actual_hash = compute_df_hash(df_out)
        actual_metrics = compute_metrics(df_canonical)
        
        # Shape kontrolü
        expected_shape = expected.get("shape", [])
        actual_shape = [actual_metrics["row_count"], actual_metrics["col_count"]]
        if actual_shape != expected_shape:
            result["diffs"].append(f"shape: actual={actual_shape}, expected={expected_shape}")
        
        # Columns kontrolü
        expected_columns = sorted(expected.get("columns", []))
        actual_columns = sorted(actual_metrics["columns"])
        if actual_columns != expected_columns:
            result["diffs"].append(f"columns: actual={actual_columns}, expected={expected_columns}")
        
        # Hash kontrolü
        expected_hash = expected.get("hash", "")
        if actual_hash != expected_hash:
            result["diffs"].append(f"hash: actual={actual_hash[:16]}..., expected={expected_hash[:16]}...")
        
        # Metrik kontrolü (toleranslı)
        expected_metrics = expected.get("metrics", {})
        metrics_passed, metrics_diffs = compare_metrics(actual_metrics, expected_metrics, tolerance)
        if not metrics_passed:
            result["diffs"].extend(metrics_diffs)
        
        # Sonuç
        result["passed"] = len(result["diffs"]) == 0
        result["actual_hash"] = actual_hash
        result["actual_metrics"] = actual_metrics
        
    except Exception as e:
        result["diffs"].append(f"Exception: {str(e)[:200]}")
    
    return result


def test_golden_suite(golden_data):
    """
    Tüm golden case'leri çalıştır ve raporla.
    """
    cases = golden_data.get("cases", [])
    
    if not cases:
        pytest.skip("No golden cases defined")
    
    results = []
    all_passed = True
    
    for case in cases:
        result = run_golden_case(case)
        results.append(result)
        if not result["passed"]:
            all_passed = False
    
    # Rapor oluştur
    report = {
        "ts_utc": datetime.now(timezone.utc).isoformat(),
        "golden_version": golden_data.get("version", "unknown"),
        "status": "PASS" if all_passed else "FAIL",
        "summary": {
            "total": len(results),
            "passed": sum(1 for r in results if r["passed"]),
            "failed": sum(1 for r in results if not r["passed"])
        },
        "cases": results
    }
    
    # Raporu kaydet
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    # Fail varsa detay göster
    if not all_passed:
        failed_cases = [r for r in results if not r["passed"]]
        diff_summary = []
        for fc in failed_cases:
            diff_summary.append(f"\n[{fc['case_id']}]:")
            for d in fc["diffs"]:
                diff_summary.append(f"  - {d}")
        
        pytest.fail(f"Golden suite FAIL ({len(failed_cases)} cases):" + "".join(diff_summary))


# Ayrı case testleri (parametric)
@pytest.fixture(scope="module")
def golden_cases(golden_data):
    """Get all golden cases"""
    return golden_data.get("cases", [])


def test_golden_cases_exist(golden_cases):
    """En az 1 golden case tanımlı olmalı"""
    assert len(golden_cases) >= 1, "No golden cases defined"
