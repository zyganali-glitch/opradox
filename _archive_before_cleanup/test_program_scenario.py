
import pandas as pd
import numpy as np
import sys
import os

# Add the app directory to path
sys.path.append(r"C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\app\scenarios")
import custom_report_builder_pro

def create_program_data(n_rows=50):
    programs = ["Bilgisayar Müh.", "Tıp", "Hukuk", "Endüstri Müh.", "Diş Hekimliği"]
    uni_types = ["Devlet", "Vakıf", "KKTC", "Yurtdışı"]
    
    data = []
    for i in range(n_rows):
        prog = np.random.choice(programs)
        u_type = np.random.choice(uni_types)
        score = np.random.uniform(300, 550)
        
        data.append({
            "Program Kodu": 10000 + i,
            "Program Adı": prog,
            "Üniversite Türü": u_type,
            "Puan": score,
            "Kontenjan": np.random.randint(40, 100)
        })
    return pd.DataFrame(data)

def run_scenario():
    df = create_program_data(100)
    
    # Complex scenario configuration requested by user
    params = {
        "config": {
            # 1. Computed Columns for Counts (Helper columns)
            "computed_columns": [
                # IsDevlet: 1 if Devlet, else 0/Null
                {"name": "is_devlet", "type": "if_else", "condition_column": "Üniversite Türü", "operator": "==", "condition_value": "Devlet", "true_value": 1, "false_value": 0},
                # IsVakif: 1 if Vakıf, else 0/Null
                {"name": "is_vakif", "type": "if_else", "condition_column": "Üniversite Türü", "operator": "==", "condition_value": "Vakıf", "true_value": 1, "false_value": 0}
            ],
            
            # 2. Window Functions for Counts and Ranks
            "window_functions": [
                # Global Rank (Overall for the Program Name)
                {"type": "rank", "partition_by": ["Program Adı"], "order_by": "Puan", "ascending": False, "alias": "Genel Sıralama"},
                # Global Count (Total programs with this name)
                {"type": "count", "partition_by": ["Program Adı"], "order_by": "Program Kodu", "alias": "Toplam Program Sayısı"},
                
                # Devlet Rank (Only sensible within Devlet, but we'll try to partition by Name + Type)
                {"type": "rank", "partition_by": ["Program Adı", "Üniversite Türü"], "order_by": "Puan", "ascending": False, "alias": "Tür İçi Sıralama"},
                
                # Devlet Count (Sum of is_devlet for the Program Name partition)
                {"type": "sum", "partition_by": ["Program Adı"], "order_by": "is_devlet", "alias": "Devlet Program Sayısı"},
                
                # Vakif Count
                {"type": "sum", "partition_by": ["Program Adı"], "order_by": "is_vakif", "alias": "Vakıf Program Sayısı"}
            ],
            
            # 3. Output
            "output": {
                "type": "sheet_per_group",
                "group_by_sheet": "Program Adı",
                "summary_sheet": True
            }
        }
    }
    
    print("Running Custom Report Builder Pro Scenario...")
    try:
        result = custom_report_builder_pro.run(df, params)
        print("\nSuccess!")
        print(result["summary"])
        print(f"Generated Excel: {len(result['excel_bytes'].getvalue())} bytes")
        
        # Write to disk to inspect if needed
        with open("program_scenario_result.xlsx", "wb") as f:
            f.write(result["excel_bytes"].getvalue())
            
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_scenario()
