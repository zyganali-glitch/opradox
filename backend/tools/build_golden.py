#!/usr/bin/env python
"""
Build Golden Expected - Opradox Excel Studio
Generate/update golden_expected.json from current correct output.

Usage:
    python backend/tools/build_golden.py

NOT: Bu script sadece dev/CI ortamında çalıştırılmalı.
"""
from __future__ import annotations
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Backend modüllerine erişim için path ekle
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.golden_hash import (
    compute_df_hash,
    compute_metrics,
    extract_df_from_result,
    canonicalize_df
)
from app.scenario_registry import get_scenario
import pandas as pd


# Golden dizinleri
GOLDEN_INPUTS_DIR = BACKEND_DIR / "golden" / "inputs"
GOLDEN_EXPECTED_PATH = BACKEND_DIR / "golden" / "expected" / "golden_expected.json"


# Test case tanımları
GOLDEN_CASES = [
    {
        "case_id": "filter_active_status",
        "scenario_id": "filter-rows-by-condition",
        "input_file": "test_filter.xlsx",
        "params": {
            "filter_column": "Status",
            "operator": "eq",
            "filter_value": "Active"
        },
        "description": "Status=Active olan satırları filtrele"
    },
    {
        "case_id": "pivot_sum_by_category",
        "scenario_id": "pivot-sum-by-category",
        "input_file": "test_pivot.xlsx",
        "params": {
            "row_field": "Category",
            "value_field": "Value",
            "agg": "sum"
        },
        "description": "Category'ye göre Value toplamı pivot"
    }
]


def build_golden():
    """Generate golden_expected.json from current runner outputs."""
    print("=" * 60)
    print("BUILD GOLDEN EXPECTED")
    print("=" * 60)
    
    cases = []
    errors = []
    
    for case_def in GOLDEN_CASES:
        case_id = case_def["case_id"]
        scenario_id = case_def["scenario_id"]
        input_file = case_def["input_file"]
        params = case_def["params"]
        
        print(f"\n[{case_id}] Processing...")
        
        try:
            # Input dosyasını yükle
            input_path = GOLDEN_INPUTS_DIR / input_file
            if not input_path.exists():
                raise FileNotFoundError(f"Input file not found: {input_path}")
            
            df_input = pd.read_excel(input_path)
            print(f"  - Input: {len(df_input)} rows, {len(df_input.columns)} cols")
            
            # Scenario runner'ı al ve çalıştır
            scenario = get_scenario(scenario_id)
            runner = scenario.get("runner")
            if runner is None:
                raise ValueError(f"No runner for scenario: {scenario_id}")
            
            result = runner(df_input, params)
            
            # Çıktı DataFrame'i çıkar
            df_out = extract_df_from_result(result)
            if df_out is None:
                raise ValueError("Runner did not return a DataFrame")
            
            # Kanonikleştir ve hash hesapla
            df_canonical = canonicalize_df(df_out)
            hash_value = compute_df_hash(df_out)
            metrics = compute_metrics(df_canonical)
            
            print(f"  - Output: {metrics['row_count']} rows, {metrics['col_count']} cols")
            print(f"  - Hash: {hash_value[:16]}...")
            
            # Case oluştur
            case_out = {
                "case_id": case_id,
                "scenario_id": scenario_id,
                "input_file": f"golden/inputs/{input_file}",
                "params": params,
                "description": case_def.get("description", ""),
                "expect": {
                    "type": "dataframe",
                    "shape": [metrics["row_count"], metrics["col_count"]],
                    "columns": metrics["columns"],
                    "hash": hash_value,
                    "metrics": metrics
                },
                "tolerance": {
                    "metrics": {"mean": 1e-6, "sum": 1e-6}
                }
            }
            
            cases.append(case_out)
            print(f"  - OK")
            
        except Exception as e:
            print(f"  - ERROR: {e}")
            errors.append({"case_id": case_id, "error": str(e)})
    
    # JSON oluştur
    golden_data = {
        "version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generator": "EXCEL_STUDIO_GOLDEN_SUITE",
        "cases": cases
    }
    
    # Atomik yaz
    temp_path = GOLDEN_EXPECTED_PATH.with_suffix(".json.tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(golden_data, f, indent=2, ensure_ascii=False)
    temp_path.replace(GOLDEN_EXPECTED_PATH)
    
    print("\n" + "=" * 60)
    print(f"Generated: {GOLDEN_EXPECTED_PATH}")
    print(f"Cases: {len(cases)} OK, {len(errors)} errors")
    
    if errors:
        print("\nErrors:")
        for err in errors:
            print(f"  - {err['case_id']}: {err['error']}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(build_golden())
