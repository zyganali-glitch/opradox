import json
import os

# Path to the catalog file
CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

# List of parameter names that are ALMOST ALWAYS required
# valid if they don't have a default value.
REQUIRED_PARAM_NAMES = [
    "column",
    "value_column",
    "target_column",
    "filter_column",
    "date_column",
    "start_date_column",
    "end_date_column",
    "group_column"
    "operator",
    "filter_value",
    "find_str",
    "replace_str",
    "thresholds",
    "labels",
    "marker",
    "key_column",
    "lookup_column",
    "fallback_column",
    "period_type",
    "rows", # for pivot
    "values" # for pivot
]

# Specific scenario overrides if needed (scenario_id -> list of required params)
# This is for params that might not match the generic list or need special handling
SCENARIO_OVERRIDES = {
    "count_value": ["column", "value"],
    "bucket_dates_into_periods": ["date_column", "period_type"],
    "filter_rows_by_condition": ["filter_column", "operator", "filter_value"],
    "find_and_replace_substring": ["columns", "find_str", "replace_str"],
    "find_duplicates_multi_column": ["columns"],
    "sum_multi": ["target_column"],
    "detect_out_of_range": ["value_column", "min_limit", "max_limit"],
    "extract_text_before_after": ["source_column", "marker", "part"],
    "fallback_lookup": ["key_column", "lookup_column", "fallback_column", "value_column", "fallback_df"]
}

def fix_catalog():
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: Catalog file not found at {CATALOG_PATH}")
        return

    try:
        with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
    except Exception as e:
        print(f"Error reading catalog: {e}")
        return

    changes_count = 0
    
    for scenario in catalog:
        scenario_id = scenario.get("id")
        params = scenario.get("params", [])
        
        # Get specific required list for this scenario if exists
        specific_reqs = SCENARIO_OVERRIDES.get(scenario_id, [])
        if not specific_reqs:
             # Normalize keys (some IDs use underscores, some hyphens)
             specific_reqs = SCENARIO_OVERRIDES.get(scenario_id.replace("-", "_"), [])


        for p in params:
            p_name = p.get("name")
            
            # Skip if already required
            if p.get("required") is True:
                continue

            # Skip if has default value (usually implies optional)
            if "default" in p:
                continue
                
            should_be_required = False

            # Check specific overrides first
            if p_name in specific_reqs:
                should_be_required = True
            
            # Check generic list
            elif p_name in REQUIRED_PARAM_NAMES:
                # Special case: group_column is often optional (for grouping)
                # But sometimes required. In the generic list I included it, 
                # but let's be careful. 'group_column' is often optional.
                # Let's REMOVE 'group_column' from generic list dynamically if needed or just handle it.
                # Actually, in most 'analysis' scenarios, a group column is OPTIONAL.
                # So let's exclude group_column from the GENERIC list and only add it if specifically required in overrides.
                if p_name == "group_column":
                    should_be_required = False # Default to optional for group_column unless in overrides
                else:
                    should_be_required = True
            
            # Special check for "columns" (multi-select), often required if it's the main input
            if p_name == "columns" and p.get("type") == "dynamic_list":
                 should_be_required = True


            if should_be_required:
                p["required"] = True
                print(f"[{scenario_id}] Marked '{p_name}' as required.")
                changes_count += 1

    if changes_count > 0:
        print(f"Total changes: {changes_count}")
        try:
            with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
                json.dump(catalog, f, indent=2, ensure_ascii=False)
            print("Successfully updated scenarios_catalog.json")
        except Exception as e:
            print(f"Error writing catalog: {e}")
    else:
        print("No changes needed.")

if __name__ == "__main__":
    fix_catalog()
