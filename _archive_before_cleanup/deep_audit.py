
import json
import collections

CATALOG_PATH = r"backend\config\scenarios_catalog.json"

try:
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Total entries: {len(data)}")

    # Check for duplicates
    ids = [entry.get("id") for entry in data]
    duplicates = [item for item, count in collections.Counter(ids).items() if count > 1]
    if duplicates:
        print(f"DUPLICATE IDS FOUND: {duplicates}")

    incomplete = []
    for i, entry in enumerate(data):
        entry_id = entry.get("id", f"INDEX_{i}")
        title = entry.get("title_tr", "No Title")
        issues = []

        # Check params type
        if "params" not in entry:
            issues.append("MISSING 'params' key")
        elif not isinstance(entry["params"], list):
             issues.append("'params' is not a list")
        elif len(entry["params"]) == 0:
             issues.append("'params' list is EMPTY")

        # Check help structure
        if "help_tr" not in entry:
            issues.append("MISSING 'help_tr' key")
        else:
            h = entry["help_tr"]
            if not isinstance(h, dict):
                issues.append("'help_tr' is not a dict")
            else:
                if not h.get("what_is_tr"): issues.append("Missing help_tr.what_is_tr")
                if not h.get("how_to_tr"): issues.append("Missing help_tr.how_to_tr")

        if issues:
            incomplete.append({
                "id": entry_id,
                "title": title,
                "issues": issues
            })

    print(json.dumps(incomplete, indent=2, ensure_ascii=False))

except Exception as e:
    print(f"Error: {e}")
