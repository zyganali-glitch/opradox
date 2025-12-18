
import sys
import os
import importlib

# Add backend to sys.path so 'app' is found
# Current dir is .../opradox/
sys.path.append(os.path.abspath("backend"))

try:
    print("Attempting to import app.scenarios.count_value...")
    mod = importlib.import_module("app.scenarios.count_value")
    print("Import SUCCESS")
    
    if hasattr(mod, "run"):
        print("run() function SUCCESS")
    else:
        print("run() function MISSING")
        
except Exception as e:
    print(f"Import FAILED: {e}")
    import traceback
    traceback.print_exc()
