
import requests
import json
import sys

BASE_URL = "http://localhost:8100"

def check_help(scenario_id):
    url = f"{BASE_URL}/ui/help/{scenario_id}?lang=tr"
    print(f"Checking {url}...")
    try:
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            # print(json.dumps(data, indent=2, ensure_ascii=False))
            if "help" in data and data["help"]:
                print("Help content FOUND.")
                print(f"Keys: {list(data['help'].keys())}")
            else:
                print("Help content EMPTY key.")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

def check_menu():
    url = f"{BASE_URL}/ui/menu?lang=tr"
    print(f"Checking {url}...")
    try:
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            cats = data.get("categories", {})
            found = False
            for cat, items in cats.items():
                for item in items:
                    if item["id"] == "pivot-multi-level":
                        print("Found pivot-multi-level in menu.")
                        print(f"Params length: {len(item.get('params', []))}")
                        found = True
            if not found:
                print("pivot-multi-level NOT FOUND in menu.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_help("pivot-multi-level")
    check_help("create-segment-column-by-thresholds")
    check_menu()
