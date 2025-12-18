
import requests
import pandas as pd
import json
import os
import time

BACKEND_URL = "http://localhost:8101"
TEST_FILE = "reproduce_join_test_main.xlsx"
TEST_FILE_2 = "reproduce_join_test_lookup.xlsx"

def create_files():
    # DF1 - Main
    df1 = pd.DataFrame({
        "Ad": ["Ahmet", "Mehmet"],
        "Maas": [5000, 6000]
    })
    df1.to_excel(TEST_FILE, index=False)

    # DF2 - Lookup
    df2 = pd.DataFrame({
        "Ad": ["Ahmet", "Mehmet"],
        "Bonus": [100, 200]
    })
    df2.to_excel(TEST_FILE_2, index=False)

def run_test():
    print("Creating test files...")
    create_files()
    
    # Wait for server
    print("Waiting for server...")
    time.sleep(2)
    
    files = {}
    with open(TEST_FILE, "rb") as f:
        files["file"] = (TEST_FILE, f.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    
    with open(TEST_FILE_2, "rb") as f:
        files["file2"] = (TEST_FILE_2, f.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    
    params = {
        "key_column": "Ad",
        "join_type": "left"
    }
    
    print(f"Sending request to {BACKEND_URL}/run/join-two-tables-key with params: {params}")
    
    try:
        res = requests.post(
            f"{BACKEND_URL}/run/join-two-tables-key",
            files=files,
            data={"params": json.dumps(params)},
            timeout=10
        )
        
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
        
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    run_test()
