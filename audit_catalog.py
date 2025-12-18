
import json
import os
from collections import defaultdict

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

def audit_catalog():
    if not os.path.exists(CATALOG_PATH):
        print("Catalog not found!")
        return

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Missing Params / Guides / Titles
    missing_english_guide = []
    missing_params = []
    missing_tr_title = []
    
    # 2. Duplicate Detection
    seen_titles = defaultdict(list)
    seen_short = defaultdict(list)
    
    for item in data:
        sid = item.get("id")
        
        # Check Params
        if not item.get("params"):
             missing_params.append(sid)
             
        # Check Guides
        help_en = item.get("help_en", {})
        if not help_en.get("what_is_en") or not help_en.get("how_to_en"):
            missing_english_guide.append(sid)

        # Check Titles
        if not item.get("title_tr") or item["title_tr"] == item.get("title_en"):
             missing_tr_title.append(sid)
             
        # Duplicates
        t_tr = (item.get("title_tr") or "").lower().strip()
        seen_titles[t_tr].append(sid)

    print("--- Missing English Guides ---")
    for s in missing_english_guide: print(s)

    print("\n--- Missing Params ---")
    for s in missing_params: print(s)
    
    print("\n--- Missing/Same TR Titles ---")
    for s in missing_tr_title: print(s)

    print("\n--- Potential Duplicates (By Title) ---")
    for title, ids in seen_titles.items():
        if len(ids) > 1:
            print(f"'{title}': {ids}")

if __name__ == "__main__":
    audit_catalog()
