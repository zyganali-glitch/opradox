
import sys
import os

# Add backend to path so we can import 'app'
sys.path.append(os.path.abspath("backend"))

try:
    print("Attempting to import app.scenarios.basic_summary_stats_column...")
    import app.scenarios.basic_summary_stats_column
    print("Import SUCCESS")
except Exception as e:
    print(f"Import FAILED: {e}")
    import traceback
    traceback.print_exc()
