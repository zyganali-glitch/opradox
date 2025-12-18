
try:
    with open('backend/config/scenarios_catalog.json', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if '"id": "custom-report-builder"' in line:
                print(f"Line: {i+1}")
except Exception as e:
    print(e)
