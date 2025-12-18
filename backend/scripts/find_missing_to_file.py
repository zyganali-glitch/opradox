
import json
import os
from pathlib import Path

BASE_DIR = Path(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox")
CATALOG_PATH = BASE_DIR / "backend" / "config" / "scenarios_catalog.json"
APP_DIR = BASE_DIR / "backend" / "app"
LOG_PATH = BASE_DIR / "missing_scenarios.log"

def check_catalog():
    if not CATALOG_PATH.exists():
        return

    try:
        data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return
    
    incomplete = []
    
    for entry in data:
        issues = []
        
        # Check params
        if "params" not in entry or not entry["params"]:
            issues.append("Missing params")
            
        # Check help
        if "help_tr" not in entry or not entry["help_tr"]:
            issues.append("Missing help_tr")

        # Check implementation
        if "implementation" in entry:
            mod = entry["implementation"].get("module", "")
            if mod.startswith("app."):
                rel = mod.replace("app.", "").replace(".", "/") + ".py"
                full = APP_DIR / rel
                if not full.exists():
                    issues.append(f"Missing file: {rel}")
        else:
             issues.append("Missing implementation config")

        if issues:
            incomplete.append({
                "id": entry["id"],
                "title": entry.get("title_tr", "Unknown"),
                "issues": issues
            })

    LOG_PATH.write_text(json.dumps(incomplete, indent=2, ensure_ascii=False), encoding="utf-8")

if __name__ == "__main__":
    check_catalog()
