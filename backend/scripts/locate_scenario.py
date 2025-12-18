
import json
from pathlib import Path

path = Path(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json")
data = json.loads(path.read_text(encoding="utf-8"))

for entry in data:
    title = entry.get("title_tr", "")
    if "seviye" in title.lower() or "özet" in title.lower():
        print(f"ID: {entry['id']}")
        print(f"Title: {title}")
        print("-" * 20)
