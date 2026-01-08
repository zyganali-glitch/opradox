"""
Selftest Runner - Opradox Excel Studio
Core selftest logic shared by /selftest endpoint and pytest.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Dict, Any, List, Literal
import time


def run_selftest(mode: Literal["quick", "full"] = "quick") -> Dict[str, Any]:
    """
    Run selftest checks for Excel Studio backend.
    
    Args:
        mode: "quick" (import + 1 scenario) or "full" (import + 5 scenarios)
    
    Returns:
        Structured result dict with status, checks, timing, summary
    """
    start_time = time.time()
    checks: List[Dict[str, Any]] = []
    
    # =====================================================
    # PHASE 1: IMPORT CHECKS
    # =====================================================
    
    # Check pandas
    try:
        import pandas as pd
        checks.append({
            "id": "import_pandas",
            "status": "PASS",
            "detail": f"pandas {pd.__version__}"
        })
    except ImportError as e:
        checks.append({
            "id": "import_pandas",
            "status": "FAIL",
            "detail": str(e)[:100]
        })
    
    # Check numpy
    try:
        import numpy as np
        checks.append({
            "id": "import_numpy",
            "status": "PASS",
            "detail": f"numpy {np.__version__}"
        })
    except ImportError as e:
        checks.append({
            "id": "import_numpy",
            "status": "FAIL",
            "detail": str(e)[:100]
        })
    
    # Check openpyxl
    try:
        import openpyxl
        checks.append({
            "id": "import_openpyxl",
            "status": "PASS",
            "detail": f"openpyxl {openpyxl.__version__}"
        })
    except ImportError as e:
        checks.append({
            "id": "import_openpyxl",
            "status": "FAIL",
            "detail": str(e)[:100]
        })
    
    # Check xlsxwriter (optional)
    try:
        import xlsxwriter
        checks.append({
            "id": "import_xlsxwriter",
            "status": "PASS",
            "detail": f"xlsxwriter {xlsxwriter.__version__}"
        })
    except ImportError:
        checks.append({
            "id": "import_xlsxwriter",
            "status": "SKIP",
            "detail": "xlsxwriter not installed (optional)"
        })
    
    # =====================================================
    # PHASE 2: MINI DF OPERATIONS
    # =====================================================
    
    try:
        import pandas as pd
        # Test 1: Sum/Mean
        df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [10, 20, 30, 40, 50]})
        total = df["a"].sum()
        avg = df["b"].mean()
        
        if total == 15 and avg == 30.0:
            checks.append({
                "id": "df_sum_mean",
                "status": "PASS",
                "detail": f"sum=15, mean=30.0"
            })
        else:
            checks.append({
                "id": "df_sum_mean",
                "status": "FAIL",
                "detail": f"Expected sum=15, mean=30; got sum={total}, mean={avg}"
            })
        
        # Test 2: GroupBy
        df2 = pd.DataFrame({
            "category": ["A", "A", "B", "B"],
            "value": [10, 20, 30, 40]
        })
        grouped = df2.groupby("category")["value"].sum()
        
        if grouped["A"] == 30 and grouped["B"] == 70:
            checks.append({
                "id": "df_groupby",
                "status": "PASS",
                "detail": "groupby sum: A=30, B=70"
            })
        else:
            checks.append({
                "id": "df_groupby",
                "status": "FAIL",
                "detail": f"groupby mismatch: {grouped.to_dict()}"
            })
    except Exception as e:
        checks.append({
            "id": "df_operations",
            "status": "FAIL",
            "detail": str(e)[:100]
        })
    
    # =====================================================
    # PHASE 3: SCENARIO RUNNER SMOKE TESTS
    # =====================================================
    
    # Define scenarios to test
    if mode == "quick":
        scenario_ids = ["filter-rows-by-condition"]
    else:  # full
        scenario_ids = [
            "filter-rows-by-condition",
            "pivot-sum-by-category",
            "text-to-date-converter",
            "concatenate-columns",
            "basic-summary-stats-column"
        ]
    
    for scenario_id in scenario_ids:
        check_result = _smoke_test_scenario(scenario_id)
        checks.append(check_result)
    
    # =====================================================
    # SUMMARY
    # =====================================================
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    pass_count = sum(1 for c in checks if c["status"] == "PASS")
    fail_count = sum(1 for c in checks if c["status"] == "FAIL")
    skip_count = sum(1 for c in checks if c["status"] == "SKIP")
    
    overall_status = "PASS" if fail_count == 0 else "FAIL"
    
    return {
        "status": overall_status,
        "mode": mode,
        "ts_utc": datetime.now(timezone.utc).isoformat(),
        "duration_ms": duration_ms,
        "checks": checks,
        "summary": {
            "pass": pass_count,
            "fail": fail_count,
            "skip": skip_count,
            "total": len(checks)
        }
    }


def _smoke_test_scenario(scenario_id: str) -> Dict[str, Any]:
    """
    Smoke test a single scenario runner.
    Creates minimal in-memory DataFrame, calls runner, verifies no crash.
    """
    try:
        from .scenario_registry import get_scenario
        import pandas as pd
        
        # Get scenario
        scenario = get_scenario(scenario_id)
        runner = scenario.get("runner")
        
        if runner is None:
            return {
                "id": f"scenario_{scenario_id}",
                "status": "SKIP",
                "detail": "No runner available"
            }
        
        # Create test DataFrame based on scenario type
        df, params = _get_test_data_for_scenario(scenario_id)
        
        # Run with timeout protection (simple approach)
        start = time.time()
        result = runner(df, params)
        elapsed = time.time() - start
        
        # Basic validation
        if result is None:
            return {
                "id": f"scenario_{scenario_id}",
                "status": "FAIL",
                "detail": "Runner returned None"
            }
        
        if elapsed > 2.0:
            return {
                "id": f"scenario_{scenario_id}",
                "status": "FAIL",
                "detail": f"Timeout: {elapsed:.2f}s > 2s limit"
            }
        
        return {
            "id": f"scenario_{scenario_id}",
            "status": "PASS",
            "detail": f"Completed in {int(elapsed*1000)}ms"
        }
        
    except Exception as e:
        return {
            "id": f"scenario_{scenario_id}",
            "status": "FAIL",
            "detail": str(e)[:150]
        }


def _get_test_data_for_scenario(scenario_id: str):
    """
    Return minimal test DataFrame and params for each scenario.
    All data is deterministic and in-memory.
    """
    import pandas as pd
    
    if scenario_id == "filter-rows-by-condition":
        df = pd.DataFrame({
            "Name": ["Alice", "Bob", "Charlie", "Diana"],
            "Age": [25, 30, 35, 28],
            "Status": ["Active", "Inactive", "Active", "Active"]
        })
        params = {
            "filter_column": "Status",
            "operator": "eq",
            "filter_value": "Active"
        }
    
    elif scenario_id == "pivot-sum-by-category":
        df = pd.DataFrame({
            "Category": ["A", "B", "A", "B", "A"],
            "Region": ["North", "North", "South", "South", "North"],
            "Sales": [100, 200, 150, 250, 300]
        })
        params = {
            "row_field": "Category",
            "value_field": "Sales",
            "agg": "sum"
        }
    
    elif scenario_id == "text-to-date-converter":
        df = pd.DataFrame({
            "DateText": ["2024-01-15", "2024-02-20", "2024-03-25"],
            "Value": [100, 200, 300]
        })
        params = {
            "column": "DateText",
            "format": "auto"
        }
    
    elif scenario_id == "concatenate-columns":
        df = pd.DataFrame({
            "First": ["John", "Jane", "Bob"],
            "Last": ["Doe", "Smith", "Jones"]
        })
        params = {
            "column1": "First",
            "column2": "Last",
            "separator": " "
        }
    
    elif scenario_id == "basic-summary-stats-column":
        df = pd.DataFrame({
            "Value": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        })
        params = {
            "column": "Value"
        }
    
    else:
        # Generic fallback
        df = pd.DataFrame({
            "A": [1, 2, 3],
            "B": ["x", "y", "z"]
        })
        params = {}
    
    return df, params
