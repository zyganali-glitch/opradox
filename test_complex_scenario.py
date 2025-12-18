import pandas as pd
import sys
import os
import numpy as np

# Setup paths
sys.path.append(r"C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\app\scenarios")
import custom_report_builder_pro

def run_complex_scenario():
    print("Loading data...")
    # Try to load real data, else fallback to dummy
    try:
        # Assuming the file structure based on file list
        df = pd.read_excel(r"C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\yks_tablo4_2025.xlsx")
        print(f"Loaded real data: {len(df)} rows")
        # Ensure column names match what we expect or print them
        print("Columns:", df.columns.tolist())
    except Exception as e:
        print(f"Could not load real data ({e}), using dummy data.")
        df = pd.DataFrame({
            "Program Adı": ["Tıp"]*50 + ["Hukuk"]*50 + ["Bilgisayar"]*50,
            "Üniversite Türü": np.random.choice(["Devlet", "Vakıf"], 150),
            "Puan": np.random.uniform(300, 550, 150),
            "Kontenjan": np.random.randint(40, 100, 150),
            "Program Kodu": range(10001, 10151)
        })

    # Complex Configuration matching User Request
    # "toplam program sayısı, sıralaması; devlet program sayısı, sıralaması; vakıf program sayısı, sıralaması"
    # "ilk sayfada bu bilgilerin yer aldığı özet, diğer sayfalarda ise her bir program için..."
    
    params = {
        "config": {
            # 1. Computed Columns: Create Indicators
            "computed_columns": [
                {"name": "is_devlet", "type": "if_else", "condition_column": "Üniversite Türü", "operator": "==", "condition_value": "Devlet", "true_value": 1, "false_value": 0},
                {"name": "is_vakif", "type": "if_else", "condition_column": "Üniversite Türü", "operator": "==", "condition_value": "Vakıf", "true_value": 1, "false_value": 0}
            ],
            
            # 2. Window Functions: Counts and Ranks
            "window_functions": [
                # Global (Per Program Name)
                {"type": "count", "partition_by": ["Program Adı"], "order_by": "Program Kodu", "alias": "Toplam_Program_Sayısı"},
                {"type": "rank", "partition_by": ["Program Adı"], "order_by": "Puan", "ascending": False, "alias": "Genel_Sıralama"},
                
                # Devlet Specific (Using partition by Type as well)
                # Note: This ranks Devlet within Devlet, and Vakif within Vakif.
                # If user wants "Devlet Rank" column to be empty for Vakif, that's harder. 
                # But "Tür İçi Sıralama" is usually what's meant.
                {"type": "rank", "partition_by": ["Program Adı", "Üniversite Türü"], "order_by": "Puan", "ascending": False, "alias": "Tür_İçi_Sıralama"},
                {"type": "sum", "partition_by": ["Program Adı", "Üniversite Türü"], "order_by": "is_devlet", "alias": "Tür_İçi_Sayı"}, # This effectively counts rows in that type group
                
                # Aggregated Sums via Window (Total Devlet Count for this Program Name - across all rows of that program)
                # This is tricky without "SumIf" window function.
                # But we computed is_devlet (1/0). Summing this partitioned by Program Name gives total devlet programs.
                {"type": "sum", "partition_by": ["Program Adı"], "order_by": "is_devlet", "alias": "Toplam_Devlet_Programı_Sayısı"},
                {"type": "sum", "partition_by": ["Program Adı"], "order_by": "is_vakif", "alias": "Toplam_Vakıf_Programı_Sayısı"},
            ],
            
            # 3. Output
            "output": {
                "type": "sheet_per_group",
                "group_by_sheet": "Program Adı",
                "summary_sheet": True
            }
        }
    }

    print("\nRunning Scenario...")
    try:
        result = custom_report_builder_pro.run(df, params)
        print("Scenario Success!")
        if "excel_bytes" in result:
             print(f"Excel generated: {len(result['excel_bytes'].getvalue())} bytes")
             with open("complex_test_output.xlsx", "wb") as f:
                 f.write(result["excel_bytes"].getvalue())
    except Exception as e:
        print(f"Scenario FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_complex_scenario()
