
import json

TARGET_CATS = ["duplicates_uniques", "data_quality_validation"]

def list_targets():
    with open("backend/config/scenarios_catalog.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    for cat in TARGET_CATS:
        scenarios = [item for item in data if item.get("category") == cat]
        print(f"\n--- Category: {cat} ({len(scenarios)}) ---")
        for s in scenarios:
            print(f"- {s['id']} ({s.get('title_en')}) -> {s['val'][0:20] if 'val' in s else ''}")

if __name__ == "__main__":
    list_targets()
