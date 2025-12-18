import sys
import os
import pandas as pd
from fastapi.testclient import TestClient

# Add local path to sys.path to ensure imports work
sys.path.append(os.getcwd())

# Import app and store
from backend.app.main import app
from backend.app.scenario_registry import LAST_EXCEL_STORE

# Setup Client
client = TestClient(app)

def test_download():
    print("--- Setting up Dummy Data ---")
    # Simulate a scenario run result
    scenario_id = "debug_test_1"
    df = pd.DataFrame({"Col1": [1, 2, 3], "Col2": ["A", "B", "C"]})
    
    LAST_EXCEL_STORE[scenario_id] = {
        "type": "dataframe",
        "data": df,
        "filename_prefix": "debug_output"
    }
    
    print(f"Store populated: {LAST_EXCEL_STORE.keys()}")

    print("--- Attempting Download (XLSX) ---")
    try:
        response = client.get(f"/download/{scenario_id}?format=xlsx")
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Response Content:")
            print(response.text)
        else:
            print("Download Success! Content-Type:", response.headers["content-type"])
            print(f"Bytes received: {len(response.content)}")
    except Exception as e:
        print(f"CRITICAL EXCEPTION CAUGHT: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_download()
