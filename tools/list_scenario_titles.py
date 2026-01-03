import json
import os

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

def list_titles():
    try:
        with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
            
        print(f"{'ID':<40} | {'Title (TR)':<60} | {'Title (EN)'}")
        print("-" * 120)
        for s in catalog:
            print(f"{s.get('id'):<40} | {s.get('title_tr', '')[:58]:<60} | {s.get('title_en', '')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_titles()
