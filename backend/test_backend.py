import requests
import pandas as pd
from io import BytesIO

# Dummy data
df = pd.DataFrame({
    'group': ['A', 'A', 'B', 'B', 'C', 'C'],
    'value': [10, 12, 15, 14, 20, 22]
})
csv_content = df.to_csv(index=False).encode('utf-8')

files = {'file': ('test.csv', csv_content, 'text/csv')}
data = {
    'group_column': 'group',
    'value_column': 'value'
}

try:
    print("Testing ANOVA endpoint...")
    response = requests.post('http://localhost:8100/viz/anova', files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Connection Error: {e}")
