
import json

TARGETS = [
    "average-condition",
    "frequency-table", 
    "pq-append-tables",
    "sum-between-dates",
    "sum-multi"
]

def find_lines():
    with open("backend/config/scenarios_catalog.json", "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    print(f"Total lines: {len(lines)}")
    
    for target in TARGETS:
        start_line = -1
        end_line = -1
        depth = 0
        found = False
        
        for i, line in enumerate(lines):
            # Find start of object with id
            if f'"id": "{target}"' in line:
                # helper to find the opening brace before this line
                # scan backwards
                for j in range(i, -1, -1):
                    if "{" in lines[j]:
                        start_line = j + 1 # 1-based
                        found = True
                        break
                
                # Now find the matching closing brace
                # scan forwards from start_line-1
                brace_count = 0
                for k in range(start_line-1, len(lines)):
                    brace_count += lines[k].count("{")
                    brace_count -= lines[k].count("}")
                    if brace_count == 0:
                        end_line = k + 1 # 1-based
                        break
                break
        
        if found:
            print(f"{target}: {start_line}-{end_line}")
        else:
            print(f"{target}: NOT FOUND")

if __name__ == "__main__":
    find_lines()
