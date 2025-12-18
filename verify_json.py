import json

file_path = r"C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("JSON is valid.")
    # Check the last item structure specifically
    last_item = data[-1]
    if last_item['id'] == 'zscore-standardization':
         if 'help_tr' in last_item and 'help_en' in last_item:
             print("zscore-standardization structure looks correct.")
         else:
             print("zscore-standardization structure is missing keys.")
except json.JSONDecodeError as e:
    print(f"JSON Decode Error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
