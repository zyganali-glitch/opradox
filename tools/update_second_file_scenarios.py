"""
Script to add data_source parameter and column_source properties to all second-file scenarios.
"""
import json
import os

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

# Second-file scenario IDs
SECOND_FILE_SCENARIOS = [
    "fallback-lookup",
    "join-two-tables-key",
    "multi-column-lookup",
    "pq-append-tables",
    "reverse-lookup-last-match",
    "validate-values-against-list",
    "vlookup-single-match",
    "xlookup-single-match"
]

# Data source parameter template
DATA_SOURCE_PARAM = {
    "name": "data_source",
    "type": "data_source",
    "label_tr": "Veri Kaynağı",
    "label_en": "Data Source",
    "description_tr": "İkinci dosya yükleyin veya aynı dosyadan farklı bir sayfa seçin.",
    "description_en": "Upload a second file or select a different sheet from the same workbook.",
    "required": True
}

# Parameters that should use primary (main file) columns
PRIMARY_COLUMN_PARAMS = [
    "key_column",
    "key",
    "value_column",  # Value column in main file for fallback-lookup
    "lookup_columns",  # Multi-column lookup - main file columns
]

# Parameters that should use secondary (second file) columns
SECONDARY_COLUMN_PARAMS = [
    "lookup_column",
    "fallback_column",
    "lookup_key_column",
    "lookup_value_column",
    "return_column",
    "reference_column",
    "reference_list_column",
    "target_column",
]

def update_catalog():
    # Read catalog
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    updated_count = 0
    
    for scenario in catalog:
        if scenario.get("id") not in SECOND_FILE_SCENARIOS:
            continue
        
        # Skip if already has data_source param
        has_data_source = any(p.get("name") == "data_source" for p in scenario.get("params", []))
        if has_data_source:
            print(f"[SKIP] {scenario['id']}: Already has data_source")
            continue
        
        # Add data_source param as second parameter (after first key param)
        params = scenario.get("params", [])
        if len(params) > 0:
            params.insert(1, DATA_SOURCE_PARAM.copy())
        else:
            params.append(DATA_SOURCE_PARAM.copy())
        
        # Add column_source to existing params
        for param in params:
            if param.get("name") == "data_source":
                continue
            
            param_name = param.get("name", "").lower()
            
            # Check for primary column source
            if any(kw in param_name for kw in ["key_column", "key"]) and param_name not in ["lookup_key_column"]:
                param["column_source"] = "primary"
            # Check for secondary column source
            elif any(kw in param_name for kw in ["lookup", "fallback", "return", "reference", "target"]):
                if "key_column" not in param_name or param_name == "lookup_key_column":
                    param["column_source"] = "secondary"
        
        scenario["params"] = params
        updated_count += 1
        print(f"[OK] {scenario['id']}: Updated with data_source and column_source")
    
    # Write back
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"\n[DONE] Updated {updated_count} scenarios")

if __name__ == "__main__":
    update_catalog()
