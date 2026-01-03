import json
import os
import re

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

# Parameters that are logically required in almost all analysis/pivot contexts
# We will force these to be required: true unless they have a default value.
ALWAYS_REQUIRED_PARAMS = [
    "value_column",
    "date_column",
    "target_column",
    "row_field",     # Pivot row - essential
    "aggfunc",       # Aggregation function - essential
    "period_type",
    "period",
    "compare_column"
]

# Parameters that are often optional, but if they have "(Opsiyonel)" text hardcoded, we just clean the text.
# We won't force them to be required/optional, just clean the label.

def clean_label(text):
    if not text:
        return text
    # Remove (Opsiyonel), (Optional), (Zorunlu), (Required) case insensitive
    # Handles parens and slight spacing variations
    cleaned = re.sub(r'\s*\(\s*Opsiyonel\s*\)', '', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\(\s*Optional\s*\)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\(\s*Zorunlu\s*\)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\(\s*Required\s*\)', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

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
    param_fix_count = 0
    label_fix_count = 0

    for scenario in catalog:
        params = scenario.get("params", [])
        scenario_id = scenario.get("id", "")
        
        for p in params:
            p_name = p.get("name")
            
            # 1. Clean Labels
            old_label_tr = p.get("label_tr", "")
            old_label_en = p.get("label_en", "")
            
            new_label_tr = clean_label(old_label_tr)
            new_label_en = clean_label(old_label_en)
            
            if new_label_tr != old_label_tr:
                p["label_tr"] = new_label_tr
                label_fix_count += 1
                changes_count += 1
                
            if new_label_en != old_label_en:
                p["label_en"] = new_label_en
                label_fix_count += 1
                changes_count += 1

            # 2. Enforce Required on Core Params
            # Skip if has default value (usually ok to be optional/defaulted)
            if "default" in p:
                continue

            # Check logical requirement
            if p_name in ALWAYS_REQUIRED_PARAMS:
                if p.get("required") is not True:
                    p["required"] = True
                    print(f"[{scenario_id}] Enforcing required:true for '{p_name}'")
                    param_fix_count += 1
                    changes_count += 1
            
            # Special Case: 'column_field' in pivots might be optional (to show just rows), 
            # but user complained about it. If it's pure pivot matrix, usually you want both.
            # But let's stick to the list above which are DEFINITES.
            
            # Special Case: 'group_column'
            # If scenario ID contains 'summary' or 'group', usually group_column is required.
            if p_name == "group_column" and ("summary" in scenario_id or "group" in scenario_id):
                 if p.get("required") is not True:
                    p["required"] = True
                    print(f"[{scenario_id}] Enforcing required:true for '{p_name}' (Context: Group/Summary)")
                    param_fix_count += 1
                    changes_count += 1

            # 3. Enforce Required based on Description
            # If description implies mandatory behavior, force required=True
            desc_tr = p.get("description_tr", "").lower()
            desc_en = p.get("description_en", "").lower()
            
            mandatory_phrases_tr = [
                "işlem gerçekleşmeyecek",
                "hata alırsınız",
                "hata mesajı",
                "zorunludur"
            ]
            mandatory_phrases_en = [
                "process will not occur",
                "process will not proceed",
                "receive an error",
                "is required"
            ]

            is_mandatory_by_desc = False
            for phrase in mandatory_phrases_tr:
                if phrase in desc_tr:
                    is_mandatory_by_desc = True
                    break
            
            if not is_mandatory_by_desc:
                for phrase in mandatory_phrases_en:
                    if phrase in desc_en:
                        is_mandatory_by_desc = True
                        break

            if is_mandatory_by_desc and not "default" in p:
                if p.get("required") is not True:
                    p["required"] = True
                    print(f"[{scenario_id}] Enforcing required:true for '{p_name}' (Context: Description warning)")
                    param_fix_count += 1
                    changes_count += 1

    if changes_count > 0:
        print(f"Total changes: {changes_count} (Labels Cleaned: {label_fix_count}, Required Enforced: {param_fix_count})")
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
