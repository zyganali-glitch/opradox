import requests
import pandas as pd
import json
import os
import io

BACKEND_URL = "http://localhost:8101"

def create_test_excel():
    data = {"Ad": ["Ahmet", "Mehmet"], "Maas": [5000, 6000]}
    df = pd.DataFrame(data)
    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    buf.seek(0)
    return buf

def create_lookup_excel():
    data = {"Ad": ["Ahmet", "Veli"], "Bonus": [100, 200]}
    df = pd.DataFrame(data)
    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    buf.seek(0)
    return buf

def test():
    file1 = create_test_excel()
    file2 = create_lookup_excel()
    
    files = {
        "file": ("test.xlsx", file1, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "file2": ("lookup.xlsx", file2, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    
    params = {
        "lookup_key_column": "Ad",
        "lookup_column": "Ad",
        "lookup_value": "Ahmet",
        "return_column": "Bonus"
    }
    
    data = {"params": json.dumps(params)}
    
    try:
        print(f"Sending request to {BACKEND_URL}/run/vlookup-single-match")
        res = requests.post(BACKEND_URL + "/run/vlookup-single-match", files=files, data=data)
        print("Status Code:", res.status_code)
        print("Response:", res.text)
    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    test()
