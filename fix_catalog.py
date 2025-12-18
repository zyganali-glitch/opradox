
import json
import os

CATALOG_PATH = "backend/config/scenarios_catalog.json"

def fix_catalog():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Remove Duplicates
    # We will track IDs we've seen. If we see a duplicate, we decide which to keep.
    # We prefer the one with category != "other".
    unique_scenarios = {}
    
    # First pass: Collect all generic/other scenarios vs specific ones
    # But order matters? No, we just want to keep the "good" one.
    # Actually, the file is a LIST.
    
    cleaned_list = []
    seen_ids = set()
    
    # We iterate and keep the better version if duplicate exists
    # Or simpler: Filter out the specific bad ones we found.
    # frequency-table (other) -> Remove
    # sum-multi (other) -> Remove
    
    for scenario in data:
        sid = scenario["id"]
        cat = scenario.get("category", "")
        
        # Specific removal of known bad duplicates
        if sid == "frequency-table" and cat == "other":
            print(f"Removing duplicate/bad scenario: {sid} (category: other)")
            continue
        if sid == "sum-multi" and cat == "other":
            print(f"Removing duplicate/bad scenario: {sid} (category: other)")
            continue
        if sid == "descriptive-stats":
            print(f"Removing duplicate/bad scenario: {sid}")
            continue
        if sid == "sum-between-dates" and (cat == "other" or scenario.get("short_tr") == "Otomatik analiz edilen senaryo."):
            print(f"Removing duplicate/bad scenario: {sid}")
            continue
            
        cleaned_list.append(scenario)

    data = cleaned_list

    # Update Generic Descriptions
    generic_updates = {
        "report-multi-metric-summary": {
            "short_tr": "Birden çok metriği (toplam, ortalama vb.) tek raporda özetler.",
            "short_en": "Summarizes multiple metrics (sum, mean etc.) in a single report."
        },
        "report-pivot-matrix-sum": {
            "short_tr": "Verileri satır ve sütun kriterlerine göre matris formatında toplar.",
            "short_en": "Sums data in a matrix format based on row and column criteria."
        },
        "report-group-summary": {
            "short_tr": "Verileri gruplayıp özet istatistiklerini hesaplar.",
            "short_en": "Groups data and calculates summary statistics."
        },
        "pq-unpivot-columns": {
            "short_tr": "Sütunları satırlara (unpivot) dönüştürerek normalize eder.",
            "short_en": "Unpivots columns into rows to normalize data."
        },
        "report-pivot-matrix-count": {
            "short_tr": "Verileri satır/sütun matrisinde sayarak özet tablo oluşturur.",
            "short_en": "Creates a summary table by counting data in a row/column matrix."
        },
        "report-filter-then-group": {
            "short_tr": "Verileri önce filtreler, ardından belirli kriterlere göre gruplar.",
            "short_en": "Filters data first, then groups by specific criteria.",
            "title_tr": "Filtrele ve Grupla Raporu",
            "title_en": "Filter and Group Report"
        },
        "pq-unpivot-columns": {
            "short_tr": "Sütunları satırlara (unpivot) dönüştürerek normalize eder.",
            "short_en": "Unpivots columns into rows to normalize data.",
            "title_tr": "Sütunları Çöz (Unpivot)",
            "title_en": "Unpivot Columns"
        },
        "average-ifs": {
            "title_tr": "Çoklu Koşula Göre Ortalama (AVERAGEIFS)",
             "title_en": "Average by multiple conditions (AVERAGEIFS)"
        },
        "sum-multi": {
            "title_tr": "Çoklu Sütun Toplama (Sum Multi)",
            "title_en": "Sum Multiple Columns"
        },
        "report-pivot-matrix-count": {
            "short_tr": "Verileri satır/sütun matrisinde sayarak özet tablo oluşturur.",
            "short_en": "Creates a summary table by counting data in a row/column matrix.",
            "title_tr": "Pivot Matris Sayım Raporu",
            "title_en": "Report Pivot Matrix Count"
        }
    }

    # 2. Fix Parameter Formats
    for scenario in data:
        sid = scenario["id"]
        
        if sid in generic_updates:
            updates = generic_updates[sid]
            for user_key, user_val in updates.items():
                scenario[user_key] = user_val
            print(f"Updated description/title for {sid}")
        
        if sid == "fallback-lookup": # User called it lookup-with-fallback
             for param in scenario["params"]:
                 if param["name"] == "fallback_df":
                     param["type"] = "file"
                     print(f"Fixed fallback-lookup param type for {sid}")

        if sid == "split-column-by-delimiter": # split-column
             for param in scenario["params"]:
                 if param["name"] == "delimiter":
                     param["type"] = "text"
                     print(f"Fixed delimiter param type for {sid}")

        if sid == "text-to-columns": # If it exists
             for param in scenario["params"]:
                 if param["name"] == "delimiter":
                     param["type"] = "text"
                     print(f"Fixed delimiter param type for {sid}")

        if sid == "sum-if":
             for param in scenario["params"]:
                 if param["name"] == "condition_value":
                     param["type"] = "text"
                     print(f"Fixed condition_value param type for {sid}")

        if sid == "run-sql-query": # run_sql_query
             for param in scenario["params"]:
                 if param["name"] == "sql":
                     param["type"] = "text" # or 'textarea' if supported
                     print(f"Fixed sql param type for {sid}")

        if sid == "rename-columns":
             for param in scenario["params"]:
                 if param["name"] == "column_mapping":
                     param["type"] = "text" # Placeholder for dict
                     print(f"Fixed column_mapping param type for {sid}")
        
        # Fix category for frequency-table and sum-multi if missed (but we kept the good ones)
        # The good ones had correct categories.
        
        # 3. Remove Optional Date Params
        # List of IDs to remove start_date, end_date, date_column
        ids_to_remove_all_dates = [
            "column-chart-by-category",
            "correlation-two-columns",
            "count-nonblank-column",
            "count-rows-multi",
            "count-value",
            "create-segment-column-by-thresholds",
            "detect-out-of-range",
            "distinct-count-by-group",
            "frequency-table-multi-column",
            "highlight-duplicates",
            "highlight-top-bottom-n",
            "join-two-tables-key", # join-two-tables
            "merge-columns-with-separator", # merge-columns
            "remove-duplicates-keeping-first", # remove-duplicates
            "find-and-replace-substring", # replace-values? "replace-values" ID check
            "sort-by-multiple-columns", # sort-data?
            "split-column-by-delimiter", # split-column
            "stacked-column-by-category",
            "unique-list-with-counts", # unique-values? no unique-list-with-counts
            "zscore-standardization"
        ]
        
        # Special logic for simple-line-chart-time, group-by-month-year, summarize-by-month-and-category
        # Remove start_date, end_date ONLY. Keep date_column.
        ids_to_remove_start_end = [
            "simple-line-chart-time",
            "group-by-month-year",
            "summarize-by-month-and-category",
             "sum-between-dates" # Keep date_column? Actually user list said remove optional dates. 
             # sum-between-dates implies dates are needed. But start/end might be the range? 
             # If I remove them, how does it sum between dates? It probably requires them. I will SKIP removing for sum-between-dates.
        ]

        # Map short names to actual IDs if needed
        # I used exact IDs from my grep list where possible.
        # "replace-values" -> find-and-replace-substring (2719 is find-and-replace-substring, 
        # is there a replace-values? No. Use find-and-replace-substring)
        # "sort-data" -> sort-by-multiple-columns (7800)
        # "unique-values" -> keep-uniques-only (4358)? or unique-list-with-counts (9108)?
        # User said "unique-values". I'll check "keep-uniques-only".
        
        if sid in ids_to_remove_all_dates or sid == "keep-uniques-only":
            new_params = []
            for param in scenario.get("params", []):
                if param["name"] in ["start_date", "end_date", "date_column"]:
                    continue # Skip
                new_params.append(param)
            scenario["params"] = new_params
            
        elif sid in ids_to_remove_start_end:
            new_params = []
            for param in scenario.get("params", []):
                if param["name"] in ["start_date", "end_date"]:
                    continue # Skip
                new_params.append(param)
            scenario["params"] = new_params


    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Catalog fixed successfully.")

if __name__ == "__main__":
    fix_catalog()
