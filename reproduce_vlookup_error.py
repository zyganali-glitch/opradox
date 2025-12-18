import pandas as pd
from typing import Dict, Any

def run_test():
    # Simulate Main DF
    df = pd.DataFrame({
        "Ad": ["Ahmet", "Mehmet"],
        "Maas": [5000, 6000]
    })

    # Simulate Lookup DF
    lookup_df = pd.DataFrame({
        "Ad": ["Ahmet", "Veli"],
        "Bonus": [100, 200]
    })

    params = {
        "key_column": "Ad",
        "lookup_key_column": "Ad",
        "lookup_value_column": "Bonus",
        "df2": lookup_df
    }
    
    # Logic extracted from vlookup_single_match.py
    key_column = params.get("key_column")
    lookup_key_column = params.get("lookup_key_column")
    lookup_value_column = params.get("lookup_value_column")
    
    print(f"Key: {key_column}, LookupKey: {lookup_key_column}")

    # Merge logic
    # subset drop duplicates
    lookup_clean = lookup_df[[lookup_key_column, lookup_value_column]].drop_duplicates(subset=[lookup_key_column])
    
    print("Pre-merge columns:")
    print("Main:", df.columns)
    print("Lookup:", lookup_clean.columns)

    merged = df.merge(
        lookup_clean,
        how="left",
        left_on=key_column,
        right_on=lookup_key_column,
        validate="many_to_one"
    )
    
    print("Post-merge columns:", merged.columns)

    # The line suspected to fail
    try:
        merged.drop(columns=[lookup_key_column], inplace=True)
        print("Drop success!")
    except KeyError as e:
        print(f"Caught expected error: {e}")

if __name__ == "__main__":
    run_test()
