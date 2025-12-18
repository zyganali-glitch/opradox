import pandas as pd
import tempfile
import os
import traceback

def test_excel_export():
    print("Testing Excel Export with xlsxwriter...")
    try:
        df = pd.DataFrame({'A': [1, 2, 3], 'B': ['a', 'b', 'c'], 'C': ['İ', 'ı', 'ğ']})
        
        fd, path = tempfile.mkstemp(suffix=".xlsx")
        os.close(fd)
        
        print(f"Temp file created at: {path}")
        
        try:
            df.to_excel(path, index=False, engine="xlsxwriter")
            print("Export successful!")
        except Exception as e:
            print(f"Export FAILED: {e}")
            traceback.print_exc()
        finally:
            try:
                os.remove(path)
                print("Temp file cleaned up.")
            except Exception as e:
                print(f"Cleanup failed: {e}")
                
    except Exception as e:
        print(f"General Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_excel_export()
