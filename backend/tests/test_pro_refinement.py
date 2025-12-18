import pandas as pd
import sys
import os
import json

# Add backend path to sys.path
sys.path.append(r"C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend")

from app.scenarios.custom_report_builder_pro import run

def test_sequential_logic():
    print("--- Testing Sequential Logic (Rank then Filter) ---")
    
    # 1. Setup Data
    data = {
        "University": ["Uni A", "Uni A", "Uni B", "Uni B", "Uni C"],
        "Program": ["Engineering", "Medicine", "Engineering", "Medicine", "Engineering"],
        "Score": [100, 150, 90, 160, 110]
    }
    df = pd.DataFrame(data)
    print("Original Data:")
    print(df)
    
    # 2. Define Actions
    # Scenario: 
    # 1. Rank users by Score (Global Rank) -> "GlobalRank"
    # 2. Filter for "Uni B"
    # Expected: Uni B Engineering (Score 90) should have Rank 5 (lowest score)
    #           Uni B Medicine (Score 160) should have Rank 1 (highest score)
    #           (Assuming descending rank)
    
    actions = [
        {
            "type": "window",
            "wf_type": "rank",
            "partition_by": "", # Global
            "order_by": "Score",
            "direction": "desc",
            "alias": "GlobalRank"
        },
        {
            "type": "filter",
            "column": "University",
            "operator": "==",
            "value": "Uni B"
        },
        {
            "type": "output",
            "output_type": "single_sheet"
        }
    ]
    
    params = {
        "config": json.dumps({"actions": actions})
    }
    
    # 3. Run Scenario
    print("\nRunning Scenario...")
    result = run(df, params)
    
    # 4. Verify
    # Result content is in binary, but we need to inspect the processed DF.
    # The 'run' function returns a dict, but doesn't return the DF directly.
    # However, for testing, we can modify 'run' or just rely on 'generate_python_script' verification?
    # Actually, verify the OUTPUT excel content?
    
    # Let's inspect the generated python code to see if it makes sense
    tech_details = result.get("technical_details", {})
    generated_code = tech_details.get("generated_python_code", "")
    print("\nGenerated Code Snippet:")
    print(generated_code[:500]) # First 500 chars
    
    # To verify data correctness, we ideally need the DF.
    # But since 'run' operates on a copy and returns bytes, we might need a workaround.
    # Actually, we can check if the output content can be read back.
    
    excel_bytes = result.get("content")
    if excel_bytes:
        from io import BytesIO
        output_df = pd.read_excel(BytesIO(excel_bytes))
        print("\nOutput DataFrame:")
        print(output_df)
        
        # Verify Rank logic
        # Uni B Medicine (160) -> Rank 1
        # Uni B Engineering (90) -> Rank 5 (Uni A 100(4), Uni A 150(2), Uni B 90(5), Uni B 160(1), Uni C 110(3))
        # Wait, ranks:
        # 160 (1)
        # 150 (2)
        # 110 (3)
        # 100 (4)
        # 90 (5)
        
        row_med = output_df[output_df['Program'] == 'Medicine'].iloc[0]
        row_eng = output_df[output_df['Program'] == 'Engineering'].iloc[0]
        
        print(f"\nUni B Medicine Rank: {row_med['GlobalRank']} (Expected: 1)")
        print(f"Uni B Engineering Rank: {row_eng['GlobalRank']} (Expected: 5)")
        
        if row_med['GlobalRank'] == 1 and row_eng['GlobalRank'] == 5:
            print("✅ VERIFICATION SUCCESS: Rank calculated before filter!")
        else:
            print("❌ VERIFICATION FAILED: Ranks are incorrect.")
            
    else:
        print("❌ No output content generated.")

if __name__ == "__main__":
    try:
        test_sequential_logic()
    except Exception as e:
        print(f"❌ Error: {e}")
