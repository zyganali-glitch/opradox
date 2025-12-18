import pandas as pd
from io import BytesIO
import sys

print("Starting Excel Test...")
try:
    import openpyxl
    print(f"openpyxl version: {openpyxl.__version__}")
except ImportError:
    print("openpyxl NOT INSTALLED")

try:
    df = pd.DataFrame({"A": [1, 2, 3], "B": ["x", "y", "z"]})
    output = BytesIO()
    df.to_excel(output, index=False)
    print("SUCCESS: DataFrame exported to Excel bytes.")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
