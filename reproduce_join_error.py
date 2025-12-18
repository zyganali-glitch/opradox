
import pandas as pd
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.scenarios import join_two_tables_key
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def create_df1():
    data = {
        "Ad": ["Ahmet", "Mehmet"],
        "Maas": [5000, 6000]
    }
    return pd.DataFrame(data)

def create_df2():
    data = {
        "Ad": ["Ahmet", "Mehmet"],
        "Bonus": [100, 200]
    }
    return pd.DataFrame(data)

def run_test():
    print("Testing join_two_tables_key...")
    df1 = create_df1()
    df2 = create_df2()
    
    params = {
        "key_column": "Ad",
        "join_type": "left",
        "df2": df2
    }
    
    try:
        result = join_two_tables_key.run(df1, params)
        print("Success!")
        print(result["summary"])
    except Exception as e:
        print(f"FAILED with error: {repr(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
