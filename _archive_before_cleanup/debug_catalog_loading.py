from pathlib import Path
import json
import traceback

# Config path relative to where we run this script (root of workspace)
CATALOG_PATH = Path('backend/config/scenarios_catalog.json')

def load_catalog():
    print(f"Checking {CATALOG_PATH.absolute()}")
    if not CATALOG_PATH.exists():
        print(f"[UYARI] Katalog dosyası bulunamadı: {CATALOG_PATH}")
        return []
        
    try:
        raw = CATALOG_PATH.read_text(encoding="utf-8")
        print(f"Read {len(raw)} bytes")
        data = json.loads(raw)
        print(f"Successfully loaded {len(data)} items")
        return data
    except Exception as e:
        print(f"[HATA] Katalog okuma hatası: {e}")
        traceback.print_exc()
        return []

if __name__ == "__main__":
    load_catalog()
