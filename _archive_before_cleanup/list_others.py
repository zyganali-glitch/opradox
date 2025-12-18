
import json

def list_others():
    with open("backend/config/scenarios_catalog.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    others = [item for item in data if item.get("category") == "other"]
    print(f"Found {len(others)} scenarios in 'other':")
    for o in others:
        print(f"- {o['id']} ({o.get('title_en')})")

if __name__ == "__main__":
    list_others()
