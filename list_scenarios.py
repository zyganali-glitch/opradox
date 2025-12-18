
import json
import os

try:
    with open('backend/config/scenarios_catalog.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        for s in data:
            title = s.get('title_tr', 'No Title')
            sid = s.get('id', 'No ID')
            if 'Oyun' in title or 'Rapor' in title or 'Hamur' in title or 'custom' in sid:
                print(f"MATCH: {sid} - {title}")
except Exception as e:
    print(f"Error: {e}")
