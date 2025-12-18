
import json

def find_dupes():
    with open("backend/config/scenarios_catalog.json", "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if '"id": "sum-between-dates"' in line:
            print(f"sum-between-dates found at line {i+1}")
        if '"id": "average-if"' in line:
            print(f"average-if found at line {i+1}")

if __name__ == "__main__":
    find_dupes()
