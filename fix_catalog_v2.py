
import json
import os

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

def fix_catalog():
    if not os.path.exists(CATALOG_PATH):
        print("Catalog not found!")
        return

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data:
        # 1. Title Translations Fix
        if item.get("category") == "reporting_pivot":
             if item.get("id") == "pivot-with-percentage-of-total" and item["title_tr"].startswith("Toplam"):
                 pass # Correct
             # Check for English titles in TR fields if any (manual check mostly needed, but let's see)

        # 2. Add Example to Custom Report Builder
        if item.get("id") == "custom-report-builder":
            if "examples_tr" not in item.get("help_tr", {}):
                 item.setdefault("help_tr", {})["examples_tr"] = [
                     "**Örnek:** Satış verilerini analiz ediyoruz.",
                     "1. **Filtre:** `Şehir` sütunu `İstanbul` olanları seç.",
                     "2. **Grup:** `Ürün Kategorisi`ne göre grupla.",
                     "3. **İşlem:** `Tutar` sütununun `Toplam`ını al.",
                     "4. **Sonuç:** İstanbul'daki her kategorinin toplam satışını görürsünüz."
                 ]

        # 3. Fix standard deviation visibility
        if item.get("id") == "basic-summary-stats-column":
            # Ensure description mentions standard deviation prominently
            desc = item.get("help_tr", {}).get("what_is_tr", "")
            if "standart sapma" not in desc.lower():
                 item["help_tr"]["what_is_tr"] = desc + " Ayrıca Standart Sapma, Varyans gibi detaylı istatistikleri de içerir."

    # Save back
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Catalog fixes applied.")

if __name__ == "__main__":
    fix_catalog()
