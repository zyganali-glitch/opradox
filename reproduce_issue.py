
import pandas as pd
import sys
import os

# Add the path to scenarios to sys.path
sys.path.append(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\app\scenarios")

try:
    import custom_report_builder_pro
except ImportError as e:
    print(f"Failed to import: {e}")
    sys.exit(1)

# Create dummy data
df = pd.DataFrame({
    "Program Adı": ["Med", "Med", "Eng", "Eng", "Art"],
    "Type": ["State", "Foundation", "State", "State", "State"],
    "Score": [100, 90, 80, 85, 70]
})

print("Df created. Columns:", df.columns)

# Config causing the error (Hypothetically)
# User says "raw_col_name not defined". 
# Maybe in filters?
filters = [
    {"column": "Program Adı", "operator": "contains", "value": "M", "logic": "AND"}
]

config = {
    "filters": filters,
    "computed_columns": [],
    "window_functions": []
}

params = {
    "config": config
}

print("Running scenario...")
try:
    result = custom_report_builder_pro.run(df, params)
    print("Scenario finished successfully.")
    print(result.get("summary"))
except Exception as e:
    print(f"Caught expected error: {e}")
    import traceback
    traceback.print_exc()

# Test with potentially missing column in filter to see if it triggers the name error
filters_missing = [
    {"column": "NonExistent", "operator": "==", "value": "X"}
]
config["filters"] = filters_missing
print("\nRunning scenario with missing column...")
try:
    custom_report_builder_pro.run(df, {"config": config})
except Exception as e:
    print(f"Caught error 2: {e}")
    import traceback
    traceback.print_exc()
