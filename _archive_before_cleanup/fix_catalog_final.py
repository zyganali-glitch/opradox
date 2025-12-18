
import json
import os

CATALOG_PATH = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\backend\config\scenarios_catalog.json"

def apply_fixes():
    if not os.path.exists(CATALOG_PATH):
        print("Catalog not found!")
        return

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    new_data = []
    
    # IDs to remove (Duplicates or Deprecated)
    # user mentioned: "Birden fazla sütunu birleştirip tek sütun yap" -> merge-columns-with-separator
    # we have concatenate-columns. merge-columns-with-separator seems older.
    ids_to_remove = ["merge-columns-with-separator", "unpivot-columns-to-rows"]

    for item in data:
        sid = item.get("id")
        
        if sid in ids_to_remove:
            print(f"Removing duplicate/deprecated: {sid}")
            continue

        # --- FIX 1: Add missing English Guides for new scenarios ---
        if sid == "custom-report-builder":
             help_en = item.get("help_en", {})
             if not help_en.get("what_is_en"):
                 item["help_en"] = {
                     "what_is_en": "This module allows you to design your report freely. Just like Play-Doh; analyze whatever you want.",
                     "how_to_en": [
                         "1. **Add Filter:** To select specific rows.",
                         "2. **Add Group:** To summarize data.",
                         "3. **Add Aggregation:** To calculate Sum, Count, etc.",
                         "4. **Select Columns:** To see only specific columns.",
                         "5. **Sort:** To order your results."
                     ],
                     "examples_en": ["**Scenario:** Analyzing sales data.", "**Process:** Filter City=NY, Group by Category, Sum Amount."]
                 }

        if sid == "text-to-date-converter":
             item["help_en"] = {
                 "what_is_en": "Converts text-formatted dates (e.g., '2023.01.01') into actual Excel date objects.",
                 "how_to_en": ["1. Upload file.", "2. Enter the Date Column name.", "3. Run."],
                 "examples_en": ["Text '12.05.2023' becomes actual Date 12-May-2023"]
             }
             
        if sid == "concatenate-columns":
             item["help_en"] = {
                 "what_is_en": "Joins text from multiple columns into a new single column with a separator.",
                 "how_to_en": ["1. Enter column names comma separated.", "2. Choose separator.", "3. Run."],
                 "examples_en": ["First Name, Last Name -> First Name Last Name"]
             }

        if sid == "calculate-growth-rate":
             item["help_en"] = {
                 "what_is_en": "Calculates the percentage growth or decline between periods (Month, Year).",
                 "how_to_en": ["1. Select Date Column.", "2. Select Value Column.", "3. Choose Period (Month/Year)."],
                 "examples_en": ["Sales in Jan: 100, Feb: 120 -> Growth: 20%"]
             }
        
        # --- FIX 2: Missing Params for Append ---
        if sid == "pq-append-tables":
             # Append needs a secondary file usually, logic handles it but catalog needs param definition to not look broken in UI??
             # Actually append usually takes 2 files. The UI handles file2 upload.
             # Let's add a dummy instruction param or just verify it has something.
             if not item.get("params"):
                 item["params"] = [{
                     "name": "info", 
                     "type": "text", 
                     "label_tr": "Bilgi", 
                     "label_en": "Info", 
                     "placeholder_tr": "İkinci dosyayı 'Dosya 2' alanına yükleyiniz.", 
                     "placeholder_en": "Upload the second file to 'File 2' area.",
                     "readonly": True
                 }]

        # --- FIX 3: Translate Titles ---
        if sid == "report-group-summary":
            item["title_tr"] = "Grup Özeti Raporu"
        if sid == "report-multi-metric-summary":
            item["title_tr"] = "Çoklu Metrik Özeti"
        if sid == "report-pivot-matrix-sum":
            item["title_tr"] = "Pivot Matris Toplam Raporu"
            
        new_data.append(item)

    # Save back
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
    print("Catalog final fixes applied.")

if __name__ == "__main__":
    apply_fixes()
