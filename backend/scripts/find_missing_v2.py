
import json
import os
from pathlib import Path

# Use absolute path
BASE_DIR = Path(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox")
CATALOG_PATH = BASE_DIR / "backend" / "config" / "scenarios_catalog.json"
APP_DIR = BASE_DIR / "backend" / "app"

def check_catalog():
    if not CATALOG_PATH.exists():
        print(f"Catalog not found at {CATALOG_PATH}")
        return

    try:
        data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"JSON Error: {e}")
        return
    
    incomplete = []
    
    for entry in data:
        issues = []
        
        # Check params (should be list and not empty)
        if "params" not in entry or not entry["params"]:
            issues.append("Missing params")
            
        # Check help (should be dict and contain keys)
        if "help_tr" not in entry or not entry["help_tr"]:
            issues.append("Missing help_tr")
            
        # Check implementation
        if "implementation" in entry:
            mod_name = entry["implementation"].get("module", "")
            # app.scenarios.foo -> scenarios/foo.py
            if mod_name.startswith("app."):
                rel_path = mod_name.replace("app.", "").replace(".", "/") + ".py"
                full_path = APP_DIR / rel_path
                if not full_path.exists():
                    issues.append(f"Missing file: {rel_path}")
            else:
                 issues.append(f"Invalid module format: {mod_name}")
        else:
            issues.append("Missing implementation config")

        if issues:
            incomplete.append({
                "id": entry["id"],
                "title": entry.get("title_tr", "Unknown"),
                "issues": issues
            })

    print(json.dumps(incomplete, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    check_catalog()
