
import json
import os
from pathlib import Path

BASE_DIR = Path(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox")
CATALOG_PATH = BASE_DIR / "backend" / "config" / "scenarios_catalog.json"
APP_DIR = BASE_DIR / "backend" / "app"

def check_catalog():
    if not CATALOG_PATH.exists():
        print("Catalog not found")
        return

    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    
    incomplete = []
    
    for entry in data:
        issues = []
        
        # Check params
        if "params" not in entry or not entry["params"]:
            issues.append("Missing params")
            
        # Check help
        if "help_tr" not in entry or not entry["help_tr"]:
            issues.append("Missing help_tr")
            
        # Check implementation module existence
        if "implementation" in entry:
            mod_path = entry["implementation"].get("module", "").replace("app.", "").replace(".", "/") + ".py"
            full_path = APP_DIR / mod_path
            if not full_path.exists():
                issues.append(f"Missing module: {mod_path}")
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
