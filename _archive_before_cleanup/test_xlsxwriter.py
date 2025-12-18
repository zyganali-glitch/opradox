import pandas as pd
import xlsxwriter
import sys

print("Testing xlsxwriter...")
try:
    df = pd.DataFrame({"Data": [1, 2, 3], "Label": ["A", "B", "C"]})
    df.to_excel("test_output.xlsx", engine="xlsxwriter", index=False)
    print("SUCCESS: xlsxwriter wrote file.")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
