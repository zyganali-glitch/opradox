
import pandas as pd
import numpy as np
import time
import sys
import os

# Add the app directory to path so we can import the scenario
sys.path.append(r"C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\backend\app\scenarios")
import custom_report_builder_pro

def generate_large_dataset(n_rows=100000):
    print(f"Generating {n_rows} rows of dummy data...")
    
    # Create categorical data for grouping
    departments = ['Sales', 'IT', 'HR', 'Marketing', 'Finance', 'Operations', 'Legal', 'R&D']
    cities = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep']
    
    df = pd.DataFrame({
        'ID': range(1, n_rows + 1),
        'Department': np.random.choice(departments, n_rows),
        'City': np.random.choice(cities, n_rows),
        'Salary': np.random.randint(20000, 100000, n_rows),
        'Age': np.random.randint(20, 60, n_rows),
        'Score': np.random.uniform(0, 100, n_rows),
        'JoinDate': pd.to_datetime(np.random.choice(pd.date_range('2020-01-01', '2023-01-01'), n_rows))
    })
    
    print("Data generation complete.")
    return df

def run_stress_test():
    df = generate_large_dataset(100000)
    
    # Configuration that triggers multiple Excel sheets (the potential bottleneck)
    params = {
        "config": {
            "filters": [
                {"column": "Salary", "operator": ">", "value": 30000}
            ],
            "computed_columns": [
                {"name": "Bonus", "type": "arithmetic", "operation": "multiply", "columns": ["Salary"], "multiplier": 0.1}
            ],
            # "groups": ["Department"],
            # "aggregations": [
            #     {"column": "Salary", "func": "mean", "alias": "Avg_Salary"},
            #     {"column": "Bonus", "func": "sum", "alias": "Total_Bonus"}
            # ],
            "output": {
                "type": "sheet_per_group",  # This forces writing multiple sheets
                "group_by_sheet": "City",   # Grouping by City for sheets
                "summary_sheet": True
            }
        }
    }
    
    print("Starting scenario execution...")
    start_time = time.time()
    
    try:
        result = custom_report_builder_pro.run(df, params)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"Scenario completed successfully in {duration:.2f} seconds.")
        
        if result.get("excel_bytes"):
            print(f"Excel output generated. Size: {len(result['excel_bytes'].getvalue())} bytes")
        else:
            print("Warning: No Excel bytes returned.")
            
    except Exception as e:
        print(f"Scenario FAILED with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_stress_test()
