import json
import importlib
import inspect
from pathlib import Path
import sys
import pandas as pd
import numpy as np

# Setup paths
ROOT_DIR = Path.cwd()
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.append(str(BACKEND_DIR))

from app.scenario_registry import _load_catalog_raw

def analyze_scenarios():
    print("="*80)
    print("OPRADOX COMPREHENSIVE SCENARIO AUDIT")
    print("="*80)
    
    catalog = _load_catalog_raw()
    valid_scenarios = [s for s in catalog if s.get("status") == "implemented"]
    
    print(f"Total Implemented Scenarios: {len(valid_scenarios)}\n")
    
    issues = []
    
    for sc in valid_scenarios:
        sid = sc['id']
        module_name = sc['implementation']['module']
        params_catalog = sc.get('params', [])
        
        # 1. Module & Function Check
        try:
            module = importlib.import_module(module_name)
            if not hasattr(module, 'run'):
                issues.append(f"[{sid}] Missing 'run' function in {module_name}")
                continue
        except ImportError:
            issues.append(f"[{sid}] Module not found: {module_name}")
            continue
            
        # 2. Parameter Usage Check (Static Analysis of Code)
        # We read the source code to see what params.get("...") calls are made.
        source_code = inspect.getsource(module.run)
        
        # Find all quoted strings inside params.get(...)
        # This is a naive regex approach but sufficient for this audit
        import re
        # Pattern: params.get("key") or params.get('key')
        usage_matches = re.findall(r'params\.get\([\"\'](\w+)[\"\']', source_code)
        # Pattern: params["key"] or params['key']
        usage_matches += re.findall(r'params\[[\"\'](\w+)[\"\']\]', source_code)
        
        used_params = set(usage_matches)
        
        # Catalog definitions
        defined_params = set([p['name'] for p in params_catalog])
        
        # Exceptions logic (common/optional params)
        used_params.discard('df2') # Internal
        used_params.discard('lookup_df') # Internal/Legacy
        
        # Check Undefined but Used (Code expects it, Catalog doesn't show it -> User can't enter it!)
        undefined_used = used_params - defined_params
        if undefined_used:
            issues.append(f"[{sid}] Code uses params NOT in Catalog (Hidden inputs): {undefined_used}")
            
        # Check Defined but Unused (Catalog shows it, Code ignores it -> User confused)
        # Note: Some params might be used via iteration or dynamic access, so this is a soft warning.
        unused_defined = defined_params - used_params
        # Filter out common false positives if any
        if unused_defined:
            # Check if code handles dynamic iteration (e.g. for p in params)
            if "params.items()" not in source_code and "params.keys()" not in source_code:
                 issues.append(f"[{sid}] Catalog has params NOT used in Code (Useless inputs): {unused_defined}")

    if not issues:
        print("[SUCCESS] All scenarios pass Code <-> Catalog consistency check.")
    else:
        print(f"[FAIL] Found {len(issues)} consistency issues:")
        for i in issues:
            print("  " + i)
            
    return issues

if __name__ == "__main__":
    analyze_scenarios()
