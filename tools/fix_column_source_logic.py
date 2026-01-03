"""
Script to fix column_source assignments for all second-file scenarios.
The correct logic is:
- Primary columns: The values/keys from YOUR data that you want to search WITH
- Secondary columns: Where you're searching and what you want to return

Examples:
- lookup_value, key_column, key → PRIMARY (these are from your main data)
- lookup_column, return_column, lookup_key_column, lookup_value_column → SECONDARY
"""
import json

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

# These params should ALWAYS be PRIMARY (from main file)
PRIMARY_PARAMS = [
    "key_column",    # Your matching key
    "key",           # Your matching key
    "lookup_value",  # The value YOU want to search for
    "value_column",  # Value column in YOUR data (for fallback-lookup)
    "lookup_columns", # Multi-column keys from YOUR data
]

# These params should ALWAYS be SECONDARY (from second source)
SECONDARY_PARAMS = [
    "lookup_column",       # Where to search in second source
    "lookup_key_column",   # Matching key in second source
    "lookup_value_column", # Value to return from second source
    "return_column",       # What to return from second source
    "fallback_column",     # Fallback column in second source
    "reference_column",    # Reference column in second source
    "reference_list_column", # Reference list in second source
]

def update_catalog():
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    primary_fixed = 0
    secondary_fixed = 0
    
    for scenario in catalog:
        if not scenario.get('requiresSecondFile'):
            continue
            
        for param in scenario.get('params', []):
            param_name = param.get('name', '')
            
            # Check primary params
            if param_name in PRIMARY_PARAMS:
                if param.get('column_source') != 'primary':
                    param['column_source'] = 'primary'
                    primary_fixed += 1
                    print(f"[FIX] {scenario['id']}.{param_name} -> PRIMARY")
            
            # Check secondary params  
            elif param_name in SECONDARY_PARAMS:
                if param.get('column_source') != 'secondary':
                    param['column_source'] = 'secondary'
                    secondary_fixed += 1
                    print(f"[FIX] {scenario['id']}.{param_name} -> SECONDARY")
    
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"\n[DONE] Fixed {primary_fixed} primary and {secondary_fixed} secondary assignments")

if __name__ == "__main__":
    update_catalog()
