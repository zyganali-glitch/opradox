import requests
import pandas as pd
import io
import json

# 1. Create a sample Excel file in memory
df = pd.DataFrame({
    'Department': ['IT', 'Sales', 'IT', 'Marketing'],
    'Salary': [5000, 4000, 7000, 4500]
})
excel_buffer = io.BytesIO()
df.to_excel(excel_buffer, index=False)
excel_buffer.seek(0)

# 2. Prepare parameters
files = {'file': ('test.xlsx', excel_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
params = {
    "condition_column": "Department",
    "condition_value": "IT",
    "target_column": "Salary",
    "return_mode": "summary"
}
data = {"params": json.dumps(params)}

# 3. Send Request to running backend
url = "http://127.0.0.1:8000/run/average-condition"
try:
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files, data=data) 
    
    if response.status_code == 200:
        print("SUCCESS: API returned 200 OK")
        result = response.json()
        print("Response:", json.dumps(result, indent=2))
        
        # 4. Verify Calculation (Average of 5000 and 7000 is 6000)
        summary_text = str(result.get("summary", ""))
        if "6000" in summary_text or "6000.0" in summary_text:
            print("VERIFICATION PASSED: Result contains expected average (6000)")
        else:
            print("VERIFICATION FAILED: Expected 6000 in result")
    else:
        print(f"FAILURE: API returned {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"EXCEPTION: {e}")
