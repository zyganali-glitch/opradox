"""
Script to remove description from data_source parameters in scenarios_catalog.json
The description appears inside the dropdown, which is incorrect - it should only be in the label.
"""
import json

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

def update_catalog():
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    updated = 0
    for scenario in catalog:
        for param in scenario.get('params', []):
            if param.get('name') == 'data_source' and param.get('type') == 'data_source':
                # Remove description - it's already shown in the label
                if 'description_tr' in param:
                    del param['description_tr']
                    updated += 1
                if 'description_en' in param:
                    del param['description_en']
    
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"[DONE] Removed description from {updated} data_source parameters")

if __name__ == "__main__":
    update_catalog()
