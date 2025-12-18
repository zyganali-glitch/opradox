import requests
import json

BASE_URL = "http://localhost:8100"

def test_flow():
    # 1. RUN Scenario
    print(f"Testing RUN scenario...")
    files = {
        'file': ('test.csv', b'Sehir,Nufus\nIstanbul,15000\nankara,5000', 'text/csv')
    }
    params = {"column": "Sehir", "case": "upper"}
    
    resp_run = requests.post(
        f"{BASE_URL}/run/normalize-case",
        files=files,
        data={'params': json.dumps(params)}
    )
    
    if resp_run.status_code != 200:
        print(f"RUN Failed: {resp_run.text}")
        exit(1)
        
    print("RUN Validated. Response:", resp_run.json().get("summary"))
    
    # 2. DOWNLOAD JSON
    print("Testing DOWNLOAD JSON...")
    resp_json = requests.get(f"{BASE_URL}/download/normalize-case?format=json")
    if resp_json.status_code != 200:
        print(f"Download JSON Failed: {resp_json.status_code}")
        exit(1)
    
    try:
        data = resp_json.json()
        print(f"JSON Download Success. First row: {data[0]}")
    except:
        print("Invalid JSON content")
        exit(1)

    # 3. DOWNLOAD CSV
    print("Testing DOWNLOAD CSV...")
    resp_csv = requests.get(f"{BASE_URL}/download/normalize-case?format=csv")
    if resp_csv.status_code != 200:
        print(f"Download CSV Failed: {resp_csv.status_code}")
        exit(1)
        
    content = resp_csv.content.decode('utf-8')
    if "ISTANBUL" in content:
        print("CSV Download Success. Content verified.")
    else:
        print("CSV content mismatch:", content)
        exit(1)

if __name__ == "__main__":
    try:
        test_flow()
        print("\nALL TESTS PASSED ✅")
    except Exception as e:
        print(f"\nTEST FAILED ❌: {e}")
        exit(1)
