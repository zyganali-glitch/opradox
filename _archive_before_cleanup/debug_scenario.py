
import sys
import os
import pandas as pd
import traceback
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.scenario_registry import get_scenario
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def create_test_df():
    data = {
        "Ad": ["Ahmet", "Mehmet", "Ayse", "Fatma", "Ali", "Veli", "Zeynep", "Hasan", "Elif", "Burak"],
        "Soyad": ["Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Ozturk", "  Bosluk  ", "BUYUKHARF", "kucukharf", "Normal"],
        "Yas": [25, 30, 22, 45, 35, 28, 50, 19, 40, 33],
        "Maas": [5000, 7500, 4500, 12000, 8000, 6500, 9000, 3500, 11000, 7000],
        "Departman": ["IT", "Satis", "IT", "Yonetim", "Satis", "IT", "Yonetim", "Satis", "IT", "Satis"],
        "Sehir": ["Istanbul", "Ankara", "Izmir", "Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Istanbul", "Izmir"]
    }
    return pd.DataFrame(data)

def debug_scenario(scenario_id, params):
    print(f"DEBUGGING SCENARIO: {scenario_id}")
    print(f"Params: {params}")
    
    try:
        scenario = get_scenario(scenario_id)
        runner = scenario.get("runner")
        if not runner:
            print("No runner found!")
            return
        
        df = create_test_df()
        
        print("Running...")
        result = runner(df, params)
        print("SUCCESS!")
        print("Result Summary:", result.get("summary"))
    except Exception:
        print("FAILED!")
        traceback.print_exc()

if __name__ == "__main__":
    # Test case for pivot-with-subtotals
    params = {
        "group_column": "Departman",
        "value_column": "Maas",
        "aggfunc": "sum"
    }
    debug_scenario("pivot-with-subtotals", params)
