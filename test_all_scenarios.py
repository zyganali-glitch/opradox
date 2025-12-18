"""
opradox Scenario Test Suite (Windows Compatible)
Simulates a basic user testing all scenarios with realistic Excel data.
Tests each scenario as if a real person with minimal Excel knowledge was using the app.
"""
import requests
import pandas as pd
import json
import os
import sys
from datetime import datetime, timedelta

BACKEND_URL = "http://localhost:8101"
TEST_FILE = "test_data.xlsx"
TEST_FILE_2 = "test_data_lookup.xlsx"  # İkinci dosya gerektiren senaryolar için

# =============================================================================
# SENARYO-SPESİFİK PARAMETRE TANIMLARI
# Her senaryo için "en basit kullanıcı" ne yapar?
# =============================================================================
SCENARIO_PARAMS = {
    # === PIVTablo & Raporlama ===
    "pivot-multi-level": {
        "group_columns": ["Departman", "Sehir"],  # Liste olmalı, en az 2 eleman
        "value_column": "Maas",
        "aggfunc": "sum"
    },
    "pivot-sum-by-category": {
        "row_field": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum"
    },
    "pivot-with-percentage-of-total": {
        "group_column": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum"
    },
    "pivot-with-subtotals": {
        "group_column": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum"
    },
    "report-filter-then-group": {
        "date_column": "Tarih",
        "group_column": "Departman",
        "value_column": "Maas",
        "start_date": "2018-01-01",
        "end_date": "2023-12-31"
    },
    "report-group-summary": {
        "group_column": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum"
    },
    "report-multi-metric-summary": {
        "group_column": "Departman",
        "value_columns": ["Maas", "Puan"],
        "aggfuncs": ["sum", "mean"]
    },
    "report-pivot-matrix-count": {
        "row_field": "Departman",
        "column_field": "Sehir"
    },
    "report-pivot-matrix-sum": {
        "row_field": "Departman",
        "column_field": "Sehir",
        "value_column": "Maas"
    },
    "summarize-by-month-and-category": {
        "date_column": "Tarih",
        "category_column": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum",
        "start_date": "2018-01-01",
        "end_date": "2023-12-31"
    },
    
    # === Tarih İşlemleri ===
    "calculate-growth-rate": {
        "date_column": "Tarih",
        "value_column": "Maas",
        "period": "M"
    },
    "bucket-dates-into-periods": {
        "date_column": "Tarih",
        "period_type": "month",
        "target_column": "Donem"
    },
    "compute-age-from-dob": {
        "date_column": "Tarih",
        "target_column": "Yas_Hesap"
    },
    "days-between-dates": {
        "start_date_column": "Tarih",
        "end_date_column": "Tarih",  # Aynı sütun - 0 döner ama hata vermez
        "target_column": "Gun_Farki"
    },
    "fill-missing-dates": {
        "date_column": "Tarih",
        "start_date": "2018-01-01",
        "end_date": "2023-12-31"
    },
    "group-by-month-year": {
        "date_column": "Tarih",
        "value_column": "Maas",
        "row_field": "year",
        "column_field": "month",
        "aggfunc": "sum"
    },
    
    # === Metin İşlemleri ===
    "extract-text-before-after": {
        "source_column": "Email",  # Senaryo source_column bekliyor
        "marker": "@",
        "part": "before"
    },
    "find-and-replace-substring": {
        "column": "Ad",
        "find_str": "a",
        "replace_str": "X"
    },
    "split-column-by-delimiter": {
        "column": "Email",
        "delimiter": "@",
        "new_columns": ["Kullanici", "Domain"]
    },
    "trim-clean-text": {
        "text_columns": ["Soyad"]
    },
    
    # === Koşullu Hesaplamalar ===
    "sum-between-dates": {
        "date_column": "Tarih",
        "value_column": "Maas",
        "target_column": "Maas",
        "start_date": "2018-01-01",
        "end_date": "2023-12-31"
    },
    "average-ifs": {
        "average_column": "Maas",
        "criteria_columns": ["Departman"],
        "criteria_values": ["IT"]
    },
    "average-condition": {
        "condition_column": "Departman",
        "condition_value": "IT",
        "target_column": "Maas",
        "return_mode": "excel"
    },
    "sum-multi": {
        "columns": ["Departman"],
        "operators": ["eq"],
        "values": ["IT"],
        "target_column": "Maas",
        "return_mode": "excel"
    },
    "max-min-if": {
        "condition_column": "Departman",
        "condition_value": "IT",
        "value_column": "Maas",
        "aggfunc": "max"
    },
    "sum-ifs-multi": {
        "sum_column": "Maas",
        "criteria_columns": ["Departman"],
        "criteria_values": ["IT"]
    },
    "sum-if": {
        "condition_column": "Departman",
        "condition_value": "IT",
        "target_column": "Maas",
        "return_mode": "excel"
    },
    "running-total-by-group": {
        "group_column": "Departman",
        "value_column": "Maas",
        "sort_column": "Tarih"
    },
    
    # === İstatistik ===
    "basic-summary-stats-column": {
        "column": "Maas"  # Sayısal sütun olmalı!
    },
    "correlation-two-columns": {
        "column1": "Yas",
        "column2": "Maas"
    },
    "outlier-flagging": {
        "value_column": "Maas",
        "method": "iqr"
    },
    "percentiles-and-quartiles": {
        "value_column": "Maas",
        "percentiles": [25, 50, 75, 90]
    },
    "zscore-standardization": {
        "value_column": "Maas",
        "target_column": "Maas_ZScore"
    },
    "descriptive-stats": {
        "column": "Maas"
    },
    
    # === Segmentasyon ===
    "bucketing-numeric-into-bands": {
        "value_column": "Maas",
        "buckets": [(0, 5000, "Dusuk"), (5001, 10000, "Orta"), (10001, 50000, "Yuksek")],
        "target_column": "Maas_Segment"
    },
    "create-segment-column-by-thresholds": {
        "value_column": "Maas",
        "thresholds": [5000, 10000],
        "labels": ["Dusuk", "Orta", "Yuksek"],
        "target_column": "Segment"
    },
    "multi-condition-label-if": {
        "conditions": [
            {"column": "Maas", "operator": ">", "value": 10000, "label": "Yuksek"},
            {"column": "Maas", "operator": "<=", "value": 10000, "label": "Normal"}
        ],
        "label_column": "Maas_Etiket"
    },
    "score-cards-weighted-points": {
        "rules": [
            {"column": "Puan", "operator": ">", "value": 80, "points": 10},
            {"column": "Maas", "operator": ">", "value": 5000, "points": 5}
        ],
        "target_column": "Skor"
    },
    
    # === Veri Kalitesi ===
    "detect-out-of-range": {
        "value_column": "Yas",
        "min_limit": 18,
        "max_limit": 65
    },
    "find-inconsistent-casing": {
        "group_column": "Departman",  # Senaryo group_column + value_column bekliyor
        "value_column": "Ad"
    },
    "validate-values-against-list": {
        "value_column": "Departman",
        "valid_values": ["IT", "Satis", "Yonetim"]
    },
    "check-missing-values": {
        "columns": ["Ad", "Email"]
    },
    
    # === Koşullu Biçimlendirme ===
    "color-scale-by-value": {
        "value_column": "Maas"
    },
    "highlight-duplicates": {
        "columns": ["Ad"]
    },
    "highlight-top-bottom-n": {
        "value_column": "Maas",  # Senaryo value_column bekliyor, column değil!
        "n": 3,
        "mode": "top"
    },
    "highlight-values-by-threshold": {
        "value_column": "Maas",
        "lower_threshold": 5000,
        "upper_threshold": 10000
    },
    
    # === Grafikler ===
    "column-chart-by-category": {
        "group_column": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum"
    },
    "pareto-chart-top-contributors": {
        "group_column": "Departman",
        "value_column": "Maas"
    },
    "simple-line-chart-time": {
        "date_column": "Tarih",
        "value_column": "Maas"
    },
    "stacked-column-by-category": {
        "category_column": "Departman",
        "subcategory_column": "Sehir",
        "value_column": "Maas"
    },
    
    # === Sayma & Frekans ===
    "count-rows-multi": {
        "columns": ["Departman"],
        "operators": ["eq"],
        "values": ["IT"]
    },
    "count-value": {
        "column": "Departman",
        "value": "IT"
    },
    "distinct-count-by-group": {
        "group_column": "Departman",
        "distinct_column": "Sehir"
    },
    "frequency-table": {
        "column": "Departman",
        "return_mode": "excel"
    },
    "frequency-table-single-column": {
        "column": "Departman",
        "return_mode": "excel"
    },
    "unique-list-with-counts": {
        "column": "Departman"
    },
    
    # === Arama & Birleştirme (İkinci dosya gerekli) ===
    "fallback-lookup": {
        "key_column": "Ad",
        "lookup_column": "Ad",
        "return_column": "Bonus",
        "fallback_column": "Ad",  # Fallback df'de key olan sutun (genelde aynidir)
        "value_column": "Bonus"
    },
    "join-two-tables-key": {
        "key_column": "Ad",
        "join_type": "left",
        # right_table otomatik eklenir
    },
    "multi-column-lookup": {
        "lookup_columns": ["Ad"],
        "lookup_values": ["Ahmet"],
        "return_column": "Maas"
    },
    "pq-append-tables": {
        # İkinci dosya file2 olarak gönderilir
    },
    "reverse-lookup-last-match": {
        "lookup_column": "Departman",
        "lookup_value": "IT",
        "value_column": "Ad"
    },
    "vlookup-single-match": {
        "lookup_key_column": "Ad",
        "lookup_column": "Ad",
        "lookup_value": "Ahmet",
        "return_column": "Bonus"
    },
    "xlookup-single-match": {
        "lookup_column": "Ad",
        "lookup_value": "Ahmet",
        "return_column": "Maas"
    },
    
    # === Sıralama & Kopya ===
    "sort-by-multiple-columns": {
        "sort_columns": ["Departman", "Maas"],
        "ascending": [True, False]
    },
    "find-duplicates-multi-column": {
        "columns": ["Ad", "Soyad"]
    },
    "find-duplicates-single-column": {
        "column": "Ad"
    },
    "tag-first-occurrence": {
        "group_column": "Departman",  # column değil group_column bekliyor
        "tag_column": "Ilk_Mi"
    },
    "keep-uniques-only": {
        "key_column": "Ad"
    },
    "remove-duplicates-keeping-first": {
        "group_column": "Ad"
    },
    
    # === Power Query Tarzı ===
    "pq-unpivot-columns": {
        "id_vars": ["Ad", "Soyad"],
        "value_vars": ["Yas", "Maas", "Puan"],
        "value_name": "Deger",
        "var_name": "Metrik"
    },
    
    # === Diğer ===
    "filter-rows-by-condition": {
        "filter_column": "Departman",
        "operator": "eq",
        "value": "IT"
    },
    "flag-rows-that-meet-rule": {
        "condition_column": "Maas",
        "operator": ">",
        "value": 5000,
        "flag_column": "Yuksek_Maas"
    },
    "case-converter": {
        "column": "Ad",
        "mode": "upper",
        "locale": "tr"
    },
    "normalize-case": {
        "column": "Ad",
        "case": "proper",
        "locale": "tr"
    },
    "clean-spaces": {
        "column": "Soyad"
    },
    "concatenate-columns": {
        "columns": "Ad, Soyad",
        "separator": " "
    },
    "merge-columns-with-separator": {
        "columns": ["Ad", "Soyad"],
        "separator": " - ",
        "target_column": "Tam_Ad"
    },
    "count-nonblank-column": {
        "column": "Email"
    },
    "text-to-date-converter": {
        "column": "Tarih"
    },
    "custom-report-builder": {
        "config": {
            "filters": [{"column": "Departman", "operator": "==", "value": "IT"}],
            "groups": ["Sehir"],
            "aggregations": [{"column": "Maas", "func": "sum"}],
            "sorts": [],
            "selects": []
        }
    }
}

# İkinci dosya gerektiren senaryolar
NEEDS_SECOND_FILE = [
    "pq-append-tables",
    "join-two-tables-key",
    "vlookup-single-match",
    "xlookup-single-match",
    "fallback-lookup",
    "multi-column-lookup"
]


def create_test_excel():
    """Create a comprehensive test Excel file with various data types."""
    data = {
        "Ad": ["Ahmet", "Mehmet", "Ayse", "Fatma", "Ali", "Veli", "Zeynep", "Hasan", "Elif", "Burak"],
        "Soyad": ["Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Ozturk", "  Bosluk  ", "BUYUKHARF", "kucukharf", "Normal"],
        "Yas": [25, 30, 22, 45, 35, 28, 50, 19, 40, 33],
        "Maas": [5000, 7500, 4500, 12000, 8000, 6500, 9000, 3500, 11000, 7000],
        "Departman": ["IT", "Satis", "IT", "Yonetim", "Satis", "IT", "Yonetim", "Satis", "IT", "Satis"],
        "Sehir": ["Istanbul", "Ankara", "Izmir", "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Istanbul", "Izmir"],
        "Tarih": pd.to_datetime(["2020-01-15", "2019-06-20", "2021-03-10", "2015-08-05", "2018-11-25", 
                                 "2020-07-30", "2017-02-14", "2022-01-01", "2019-09-18", "2020-12-01"]),
        "Puan": [85, 90, 78, 95, 88, 72, 91, 65, 89, 82],
        "Durum": ["Aktif", "Aktif", "Pasif", "Aktif", "Pasif", "Aktif", "Aktif", "Pasif", "Aktif", "Aktif"],
        "Kategori": ["A", "B", "A", "C", "B", "A", "C", "A", "B", "C"],
        "Miktar": [100, 200, 150, 300, 250, 175, 225, 125, 275, 190],
        "BirimFiyat": [10.5, 20.0, 15.75, 30.25, 25.0, 18.5, 22.0, 12.0, 28.5, 19.0],
        "Email": ["ahmet@test.com", "mehmet@test.com", "", "fatma@test.com", "ali@test.com", 
                  "veli@test.com", "zeynep@test.com", "", "elif@test.com", "burak@test.com"],
    }
    df = pd.DataFrame(data)
    df.to_excel(TEST_FILE, index=False)
    print("[OK] Ana test Excel olusturuldu: " + TEST_FILE)
    return TEST_FILE


def create_lookup_excel():
    """Create a second Excel file for lookup/join scenarios."""
    data = {
        "Ad": ["Ahmet", "Mehmet", "Ayse", "Fatma", "Ali", "Yeni_Kisi"],
        "Bonus": [1000, 1500, 800, 2000, 1200, 500],
        "Unvan": ["Uzman", "Mudur", "Stajyer", "Direktor", "Uzman", "Stajyer"],
        "Bolge": ["Marmara", "Ic Anadolu", "Ege", "Marmara", "Ic Anadolu", "Karadeniz"]
    }
    df = pd.DataFrame(data)
    df.to_excel(TEST_FILE_2, index=False)
    print("[OK] Lookup test Excel olusturuldu: " + TEST_FILE_2)
    return TEST_FILE_2


def get_all_scenarios():
    """Fetch all scenarios from the menu API."""
    try:
        res = requests.get(BACKEND_URL + "/ui/menu?lang=tr", timeout=10)
        res.raise_for_status()
        data = res.json()
        scenarios = []
        for cat, items in data.get("categories", {}).items():
            for sc in items:
                scenarios.append({
                    "id": sc["id"], 
                    "title": sc["title"], 
                    "category": cat, 
                    "params": sc.get("params", [])
                })
        return scenarios
    except Exception as e:
        print("[FAIL] Senaryolar alinamadi: " + str(e))
        return []


def build_smart_params(scenario_id, catalog_params):
    """
    Build intelligent parameters for each scenario.
    Simulates what a basic user would enter.
    """
    # Önce özel tanım var mı bak
    if scenario_id in SCENARIO_PARAMS:
        params = SCENARIO_PARAMS[scenario_id].copy()
        return params
    
    # Yoksa genel mantık uygula
    params_dict = {}
    for p in catalog_params:
        name = p.get("name", "")
        ptype = p.get("type", "text")
        default = p.get("default", "")
        options = p.get("options", [])
        
        # Select tipinde ilk opsiyonu seç
        if ptype == "select" and options:
            params_dict[name] = options[0]
        
        # Sütun isimleri için akıllı seçim
        elif "column" in name.lower():
            if "date" in name.lower() or "tarih" in name.lower():
                params_dict[name] = "Tarih"
            elif "value" in name.lower() or "sum" in name.lower() or "agg" in name.lower() or "numeric" in name.lower():
                params_dict[name] = "Maas"
            elif "group" in name.lower() or "category" in name.lower():
                params_dict[name] = "Departman"
            elif "text" in name.lower():
                params_dict[name] = "Soyad"
            else:
                params_dict[name] = "Ad"
        
        # Sayısal değerler
        elif name in ["threshold", "min_value", "lower_threshold", "min_limit"]:
            params_dict[name] = 5000
        elif name in ["max_value", "upper_threshold", "max_limit"]:
            params_dict[name] = 10000
        elif name in ["n", "top_n"]:
            params_dict[name] = 3
        
        # Metin değerleri
        elif name in ["search", "find", "lookup_value", "search_value"]:
            params_dict[name] = "Ahmet"
        elif name in ["replace"]:
            params_dict[name] = "X"
        elif name in ["new_column_name", "output_column", "target_column"]:
            params_dict[name] = "Sonuc"
        elif name == "locale":
            params_dict[name] = "tr"
        elif name == "mode":
            params_dict[name] = "upper"
        elif name in ["delimiter", "separator"]:
            params_dict[name] = " "
        elif name == "value" or name == "condition_value":
            params_dict[name] = "IT"
        elif name == "operator":
            params_dict[name] = "=="
        
        # Varsayılan değer varsa kullan
        elif default:
            params_dict[name] = default
        else:
            params_dict[name] = ""
    
    return params_dict


def test_scenario(scenario_id, title, params, test_file, test_file_2=None):
    """Test a single scenario and return result."""
    try:
        files = {}
        
        # Ana dosyayı aç
        with open(test_file, "rb") as f:
            file_content = f.read()
        
        files["file"] = (test_file, file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        # İkinci dosya gerekiyorsa ekle
        if scenario_id in NEEDS_SECOND_FILE and test_file_2 and os.path.exists(test_file_2):
            with open(test_file_2, "rb") as f2:
                file2_content = f2.read()
            files["file2"] = (test_file_2, file2_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        # Parametreleri hazırla
        params_json = json.dumps(params, ensure_ascii=False, default=str)
        data = {"params": params_json}
        
        res = requests.post(
            BACKEND_URL + "/run/" + scenario_id,
            files=files,
            data=data,
            timeout=30
        )
        
        if res.status_code == 200:
            result = res.json()
            has_excel = result.get("excel_available", False)
            summary = result.get("summary", "")
            if isinstance(summary, dict):
                summary = str(summary)[:100]
            elif isinstance(summary, str):
                summary = summary[:100]
            else:
                summary = str(summary)[:100]
            return {"status": "OK", "excel": has_excel, "summary": summary}
        else:
            try:
                detail = res.json().get("detail", res.text[:200])
            except:
                detail = res.text[:200]
            return {"status": "FAIL", "error": str(detail)}
            
    except requests.exceptions.Timeout:
        return {"status": "ERROR", "error": "Timeout - 30 saniye icinde yanit alinamadi"}
    except requests.exceptions.ConnectionError:
        return {"status": "ERROR", "error": "Baglanti hatasi - Backend calisiyor mu?"}
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}


def main():
    print("=" * 70)
    print("opradox Senaryo Test Paketi")
    print("Simule edilen kullanici: En temel Excel bilgisine sahip ofis calisani")
    print("=" * 70)
    
    # Test dosyalarini olustur
    test_file = create_test_excel()
    test_file_2 = create_lookup_excel()
    
    print("")
    print("[INFO] Senaryolar aliniyor...")
    scenarios = get_all_scenarios()
    print("Toplam " + str(len(scenarios)) + " senaryo bulundu")
    print("")
    
    if not scenarios:
        print("Hic senaryo bulunamadi. Backend calisiyor mu?")
        return
    
    results = {"OK": [], "FAIL": [], "ERROR": [], "NO_EXCEL": []}
    
    for i, sc in enumerate(scenarios, 1):
        sid = sc["id"]
        title = sc["title"]
        catalog_params = sc["params"]
        
        # Akilli parametre olustur
        smart_params = build_smart_params(sid, catalog_params)
        
        # Baslik kisalt
        short_title = title[:45] if len(title) > 45 else title
        print("[" + str(i) + "/" + str(len(scenarios)) + "] " + short_title + "...", end=" ")
        sys.stdout.flush()
        
        result = test_scenario(sid, title, smart_params, test_file, test_file_2)
        
        if result["status"] == "OK":
            if result["excel"]:
                print("[OK] (Excel)")
                results["OK"].append({"id": sid, "title": title})
            else:
                print("[OK] (Ozet)")
                results["NO_EXCEL"].append({"id": sid, "title": title})
        elif result["status"] == "FAIL":
            err_short = result["error"][:60] if len(result["error"]) > 60 else result["error"]
            print("[FAIL]: " + err_short)
            results["FAIL"].append({"id": sid, "title": title, "error": result["error"], "params_used": smart_params})
        else:
            err_short = result["error"][:60] if len(result["error"]) > 60 else result["error"]
            print("[ERROR]: " + err_short)
            results["ERROR"].append({"id": sid, "title": title, "error": result["error"]})
    
    print("")
    print("=" * 70)
    print("TEST OZET RAPORU")
    print("=" * 70)
    print("BASARILI (Excel ciktisi):    " + str(len(results["OK"])))
    print("BASARILI (Sadece ozet):      " + str(len(results["NO_EXCEL"])))
    print("BASARISIZ:                   " + str(len(results["FAIL"])))
    print("HATA:                        " + str(len(results["ERROR"])))
    print("-" * 70)
    print("TOPLAM BASARI ORANI:         " + str(len(results["OK"]) + len(results["NO_EXCEL"])) + "/" + str(len(scenarios)))
    
    if results["FAIL"]:
        print("")
        print("--- BASARISIZ SENARYOLAR ---")
        for item in results["FAIL"][:15]:  # İlk 15'i göster
            print("  * " + item["id"])
            print("    Hata: " + item["error"][:80])
    
    if results["ERROR"]:
        print("")
        print("--- HATA VEREN SENARYOLAR ---")
        for item in results["ERROR"]:
            print("  * " + item["id"])
            print("    Hata: " + item["error"][:80])

    # JSON rapor kaydet
    report = {
        "test_date": datetime.now().isoformat(),
        "test_mode": "Basit kullanici simulasyonu",
        "total": len(scenarios),
        "ok": len(results["OK"]),
        "no_excel": len(results["NO_EXCEL"]),
        "fail": len(results["FAIL"]),
        "error": len(results["ERROR"]),
        "success_rate": round((len(results["OK"]) + len(results["NO_EXCEL"])) / len(scenarios) * 100, 1),
        "failed_details": results["FAIL"],
        "error_details": results["ERROR"],
        "no_excel_details": results["NO_EXCEL"],
        "ok_details": results["OK"]
    }
    
    with open("scenario_test_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)
    
    print("")
    print("[INFO] Detayli rapor kaydedildi: scenario_test_report.json")
    
    # Temizlik
    for f in [test_file, test_file_2]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except:
                pass


if __name__ == "__main__":
    main()
