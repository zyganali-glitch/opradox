import json
import importlib
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import traceback

# Setup paths
ROOT_DIR = Path.cwd()
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.append(str(BACKEND_DIR))

from app.scenario_registry import _load_catalog_raw

def generate_test_data(params_catalog):
    """
    Generates a DataFrame and a params dictionary based on the catalog definition.
    """
    data = {}
    row_count = 10
    
    # Standard columns that are always useful
    data["ID"] = range(1, row_count + 1)
    data["Name"] = ["Item " + str(i) for i in range(row_count)]
    data["Category"] = ["A", "B"] * 5
    data["Date"] = pd.date_range(start="2024-01-01", periods=row_count)
    data["Value"] = np.random.randint(10, 100, row_count)
    data["Value2"] = np.random.randint(10, 100, row_count)  # For correlation
    
    params = {}
    
    for p in params_catalog:
        name = p["name"]
        ptype = p.get("type", "text")
        
        # Intellligently assign value based on name/type
        if "column" in name or "field" in name:
            if "date" in name or ptype == "date":
                params[name] = "Date"
            elif "value" in name or "numeric" in name or "target" in name or "return" in name:
                params[name] = "Value"
            elif "column1" == name or "column2" == name: # Optimization for Correlation
                 params[name] = "Value" if name == "column1" else "Value2"
            elif "lookup_value_column" == name:
                 params[name] = "Value2"
            elif "group" in name or "cat" in name:
                params[name] = "Category"
            elif "key" in name or "id" in name:
                 params[name] = "ID"
            else:
                params[name] = "Name"
        
        elif "date" in name and "start" in name:
             params[name] = "01.01.2024"
        elif "date" in name and "end" in name:
             params[name] = "31.12.2024"
             
        elif ptype == "select":
            options = p.get("options", [])
            params[name] = options[0] if options else "option1"
        
        elif "key" == name: # Direct key param
             params[name] = "ID"
            
        elif ptype == "dynamic_list":
            if "column" in name:
                params[name] = ["Category", "Name"]
            else:
                params[name] = ["A", "B"]
        
        elif name == "buckets":
            params[name] = [(0, 50, "Low"), (51, 100, "High")]

        elif ptype == "json_builder": # Custom Report
             params[name] = {"filters": [], "groups": ["Category"], "aggregations": [{"column": "Value", "func": "sum"}], "sorts": [], "selects": []}

        else:
            # Fallback for generic text/numeric
            if "threshold" in name or "limit" in name or "min" in name or "max" in name:
                params[name] = 50
            elif "n" == name:
                 params[name] = 3
            else:
                params[name] = "A" # Default string

    df = pd.DataFrame(data)
    return df, params

def verify_runtime():
    print("="*80)
    print("OPRADOX RUNTIME VERIFICATION (SPIRIT-APPROPRIATE TESTING)")
    print("="*80)
    
    catalog = _load_catalog_raw()
    valid_scenarios = [s for s in catalog if s.get("status") == "implemented"]
    
    results = {"OK": [], "FAIL": []}
    
    for sc in valid_scenarios:
        sid = sc['id']
        module_name = sc['implementation']['module']
        
        try:
            module = importlib.import_module(module_name)
            runner = getattr(module, 'run')
            
            # Generate tailored test data
            df, params = generate_test_data(sc.get('params', []))
            
            # Special Handling for scenarios needing lookup_df / df2
            # We blindly inject df2 if the code looks for it (based on common errors)
            # or if the scenario id suggests it.
            if "lookup" in sid or "join" in sid or "merge" in sid:
                df2 = df.copy()
                df2["Value"] = df2["Value"] * 2 # Different values
                params["df2"] = df2
                params["lookup_df"] = df2
                params["right_table"] = df2 # Cover all bases
            
            # --- EXECUTE ---
            result = runner(df, params)
            
            # Check Result
            is_ok = False
            if isinstance(result, dict):
                 if "summary" in result or "excel_bytes" in result or "df_out" in result:
                     is_ok = True
            
            if is_ok:
                results["OK"].append(sid)
                # print(f"[OK] {sid}")
            else:
                results["FAIL"].append((sid, "Returned invalid result format (No summary/excel)"))
                
        except Exception as e:
            # traceback.print_exc()
            results["FAIL"].append((sid, str(e)))
            
    print(f"\nSummary: {len(results['OK'])} OK, {len(results['FAIL'])} FAIL")
    
    if results['FAIL']:
        print("\n--- FAILURES ---")
        for sid, err in results['FAIL']:
            print(f"[{sid}] {err}")

if __name__ == "__main__":
    verify_runtime()
