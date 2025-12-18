
import json
import sys

try:
    with open("backend/config/scenarios_catalog.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    with open("audit_results.txt", "w", encoding="utf-8") as out:
        for entry in data:
            entry_id = entry.get("id")
            has_params = "params" in entry and len(entry["params"]) > 0
            has_help_tr = "help_tr" in entry
            
            # check module existence
            impl = entry.get("implementation", {})
            mod = impl.get("module", "")
            has_file = False
            if mod:
                path = mod.replace("app.", "backend/app/").replace(".", "/") + ".py"
                try: 
                    with open(path, "r") as mf: pass
                    has_file = True
                except: pass
            
            if not has_params or not has_help_tr or not has_file:
                out.write(f"ID: {entry_id} | Params: {has_params} | Help: {has_help_tr} | File: {has_file}\n")
except Exception as e:
    with open("audit_error.txt", "w") as err:
        err.write(str(e))
