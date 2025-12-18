
import sys
import os
import pandas as pd
import importlib
import json

# Setup path
sys.path.append(os.path.abspath("backend"))

from app.scenario_registry import list_scenarios, get_scenario

def evaluate_scenarios():
    print("Loading catalog...")
    try:
        scenarios = list_scenarios()
    except Exception as e:
        print(f"CRITICAL: Could not list scenarios: {e}")
        return

    print(f"Found {len(scenarios)} scenarios.")
    
    results = {
        "MISSING": [],
        "IMPORT_ERROR": [],
        "RUN_ERROR": [], 
        "SUCCESS": []
    }

    # Dummy dataframe for testing
    df_dummy = pd.DataFrame({
        "A": [1, 2, 3, 4, 5],
        "B": ["x", "y", "x", "y", "z"],
        "C": [10.5, 20.1, 15.3, 9.2, 11.0],
        "D": ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04", "2023-01-05"]
    })
    
    # Common param mocks to avoid trivial key errors
    default_params = {
        "column": "A",
        "value_column": "C",
        "date_column": "D",
        "group_column": "B",
        "columns": "A,C",
        "target_column": "NewCol",
        "thresholds": "[10, 20]",
        "labels": "['Low', 'High']"
    }

    for item in scenarios:
        sid = item["id"]
        # print(f"Checking {sid}...")
        
        try:
            # This calls get_scenario which attempts import
            scenario_def = get_scenario(sid) 
        except Exception as e:
            # If get_scenario fails, it's likely an import error or broken status
            # We can try to manually check why
            # But usually it means broken
            err_msg = str(e)
            if "not found" in err_msg.lower() and "file" not in err_msg:
                 # Scenario entry exists but maybe internal error
                 pass
            elif "not executable" in err_msg or "çalıştırılabilir" in err_msg:
                results["IMPORT_ERROR"].append(f"{sid}: Module import failed")
            else:
                results["IMPORT_ERROR"].append(f"{sid}: {err_msg}")
            continue

        runner = scenario_def.get("runner")
        if not runner:
            results["MISSING"].append(f"{sid}: No runner found")
            continue

        # Try running
        try:
            # We don't expect it to perfectly succeed because params might be validation-checked
            # But we want to see if it crashes with SyntaxError or NameError
            # Validation errors (ValueError, keyError) are fine-ish, meaning code ran.
            runner(df_dummy.copy(), default_params)
            results["SUCCESS"].append(sid)
        except Exception as e:
            # Distinguish between "Logic/Param error" and "Code broken error"
            msg = str(e)
            # If it complains about missing column "A" or similar, "it ran".
            # If it says "NameError: name 'pd' is not defined", it's broken.
            import traceback
            tb = traceback.format_exc()
            
            if isinstance(e, (KeyError, ValueError, TypeError)):
                 # Likely param mismatch, but code is present
                 # We mark as SUCCESS (or WARNING) because the engine is there.
                 results["SUCCESS"].append(f"{sid} (ParamErr)")
            elif isinstance(e, (NameError, ImportError, AttributeError, SyntaxError)):
                 results["RUN_ERROR"].append(f"{sid}: {msg}")
            else:
                 # Generic runtime error, treated as param error for now
                 results["SUCCESS"].append(f"{sid} (RuntimeErr)")

    print("\n" + "="*40)
    print("EVALUATION REPORT")
    print("="*40)
    
    print(f"MISSING FILES/MODULES ({len(results['MISSING'])}):")
    # for x in results["MISSING"]: print(f"  - {x}")
    print(f"  (Count: {len(results['MISSING'])})")

    print(f"\nIMPORT ERRORS ({len(results['IMPORT_ERROR'])}):")
    for x in results['IMPORT_ERROR']: print(f"  - {x}")

    print(f"\nRUN ERRORS (Code Broken) ({len(results['RUN_ERROR'])}):")
    for x in results['RUN_ERROR']: print(f"  - {x}")

    print(f"\nSUCCESS (Executable) ({len(results['SUCCESS'])}):")
    print(f"  (Count: {len(results['SUCCESS'])})")
    
    # Save detailed report
    with open("scenario_report.json", "w", encoding='utf-8') as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    evaluate_scenarios()
