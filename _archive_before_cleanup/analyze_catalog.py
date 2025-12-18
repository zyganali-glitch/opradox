
import json
import os

path = "backend/config/scenarios_catalog.json"

try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"Total Items: {len(data)}")
    
    missing_impl = []
    has_impl_but_missing_file = []
    
    for item in data:
        sid = item.get("id", "UNKNOWN")
        impl = item.get("implementation", {})
        module = impl.get("module")
        
        if not module:
            missing_impl.append(sid)
        else:
            # Check file existence relative to backend/app
            if module.startswith("app."):
                rel_path = module.replace("app.", "").replace(".", "/") + ".py"
                full_path = os.path.abspath(os.path.join("backend/app", rel_path))
                if not os.path.exists(full_path):
                     has_impl_but_missing_file.append(f"{sid} -> {full_path}")

    print(f"Missing Implementation Block/Module: {len(missing_impl)}")
    print(f"Has Module but File Missing: {len(has_impl_but_missing_file)}")
    
    with open("missing_report.json", "w") as f:
        json.dump({
            "missing_impl": missing_impl,
            "missing_files": has_impl_but_missing_file
        }, f, indent=2)

except Exception as e:
    print(f"Error: {e}")
