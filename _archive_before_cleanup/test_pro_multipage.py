
import pandas as pd
import sys
import os
from io import BytesIO

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.scenarios.custom_report_builder_pro import generate_output

def test_multipage():
    # 1. Create Sample Data
    data = {
        "Group": ["A", "A", "B", "B", "C", "C"],
        "Value": [1, 2, 3, 4, 5, 6]
    }
    df = pd.DataFrame(data)
    
    # 2. Config
    output_config = {
        "type": "sheet_per_group",
        "group_by_sheet": "Group",
        "summary_sheet": True,
        "drill_down_index": True
    }
    
    print("Testing generate_output with sheet_per_group...")
    
    # 3. Generate
    excel_io = generate_output(df, output_config, original_df=df)
    
    # 4. Verify
    try:
        sheets = pd.read_excel(excel_io, sheet_name=None)
        print(f"Generated sheets: {list(sheets.keys())}")
        
        expected_sheets = ["📋 İndeks", "A", "B", "C", "Özet"]
        
        match = True
        for s in expected_sheets:
            if s not in sheets:
                print(f"ERROR: Missing sheet {s}")
                match = False
        
        if match:
            print("SUCCESS: All expected sheets found.")
            
            # Check content of sheet A
            df_a = sheets["A"]
            if len(df_a) == 2 and df_a["Group"].nunique() == 1 and df_a["Group"].iloc[0] == "A":
                print("SUCCESS: Sheet A content verified.")
            else:
                print(f"ERROR: Sheet A content mismatch. \n{df_a}")
                
        else:
            print("FAILURE: Sheet check failed.")
            
    except Exception as e:
        print(f"ERROR reading excel: {e}")

if __name__ == "__main__":
    test_multipage()
