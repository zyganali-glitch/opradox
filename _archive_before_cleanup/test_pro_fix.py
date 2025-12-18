
import pandas as pd
import sys
import os
import numpy as np

# Backend yolunu ekle
sys.path.append(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\app")
sys.path.append(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend")

from scenarios.custom_report_builder_pro import run

# Dummy Data
# Dummy Data - Huge
programs = [f"Program_{i}" for i in range(50)] # 50 unique groups
data = {
    "Program Adı": (programs * 2000), # 100k rows
    "Puan": np.random.randint(200, 500, 100000),
    "Kontenjan": np.random.randint(10, 100, 100000),
    "Yerleşen": np.random.randint(0, 100, 100000)
}
df = pd.DataFrame(data)

# Config mimicking the user scenario
params = {
    "config": {
        "filters": [
             # No filter to process all data
        ],
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

print("Running Scenario...")
try:
    result = run(df, params)
    print("SUCCESS!")
    if result["df_out"] is not None:
        print(result["df_out"].head())
        print(f"Shape: {result['df_out'].shape}")
except Exception as e:
    print("FAILED!")
    raise e
