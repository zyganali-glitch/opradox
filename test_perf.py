
import pandas as pd
import sys
import os
import numpy as np
import time

# Backend yolunu ekle
sys.path.append(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\app")
sys.path.append(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend")

from scenarios.custom_report_builder_pro import run

def run_test(row_count=100000):
    print(f"--- Running Test with {row_count} rows ---")
    
    # Dummy Data creation
    start_time = time.time()
    programs = [f"Program_{i}" for i in range(50)] # 50 unique groups
    
    # Repeat programs to match row_count roughly
    repeats = row_count // 50
    if repeats == 0: repeats = 1
    
    data = {
        "Program Adı": (programs * repeats)[:row_count], 
        "Puan": np.random.randint(200, 500, row_count),
        "Kontenjan": np.random.randint(10, 100, row_count),
        "Yerleşen": np.random.randint(0, 100, row_count)
    }
    df = pd.DataFrame(data)
    print(f"Data Generation took: {time.time() - start_time:.2f}s")
    
    # Config mimicking the user scenario
    params = {
        "config": {
            "filters": [],
            "computed_columns": [
                {"name": "Doluluk", "type": "arithmetic", "columns": ["Yerleşen", "Kontenjan"], "operation": "percent"}
            ],
            "window_functions": [
                {"type": "rank", "partition_by": "Program Adı", "order_by": "Puan", "alias": "Sıralama"}
            ],
            "output": {
                "type": "sheet_per_group",
                "group_by_sheet": "Program Adı",
                "summary_sheet": True
            }
        }
    }
    
    print("Calling run()...")
    run_start = time.time()
    try:
        result = run(df, params)
        print(f"Run finished in: {time.time() - run_start:.2f}s")
        if result["df_out"] is not None:
             print(f"Result Rows: {len(result['df_out'])}")
        
        # Check excel bytes size
        excel_bytes = result.get("excel_bytes")
        if excel_bytes:
             print(f"Excel Size: {len(excel_bytes.getvalue()) / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"FAILED: {e}")
        raise e

if __name__ == "__main__":
    # First try small to warmup/verify
    # run_test(1000) 
    
    # Then try the problematic size
    run_test(100000)
