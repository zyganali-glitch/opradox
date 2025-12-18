
import json
import os

CATALOG_PATH = "backend/config/scenarios_catalog.json"
SCENARIOS_DIR = "backend/app/scenarios"

def check_params():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"Checking {len(catalog)} scenarios for ghost parameters...\n")
    
    ghosts_found = False

    for item in catalog:
        sid = item.get("id")
        impl = item.get("implementation", {})
        module = impl.get("module", "")
        
        # modül isminden dosya yolunu bul
        # app.scenarios.foo -> backend/app/scenarios/foo.py
        if not module.startswith("app.scenarios."):
            continue
            
        filename = module.split(".")[-1] + ".py"
        filepath = os.path.join(SCENARIOS_DIR, filename)
        
        if not os.path.exists(filepath):
            print(f"[ERROR] File not found: {filepath}")
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
            
        params = item.get("params", [])
        for p in params:
            p_name = p.get("name")
            # Basit kontrol: param ismi kodda geçiyor mu?
            if p_name not in code:
                print(f"[GHOST PARAM] Scenario: '{sid}' -> Param: '{p_name}' not found in {filename}")
                ghosts_found = True

    if not ghosts_found:
        print("All parameters seem to be used in python code.")

if __name__ == "__main__":
    check_params()
