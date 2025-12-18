
import json
import re
from pathlib import Path

# Path setup
BASE_DIR = Path(r"c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox")
CATALOG_PATH = BASE_DIR / "backend" / "config" / "scenarios_catalog.json"

def clean_text(text):
    if not isinstance(text, str):
        return text
    # Pattern to match "1. ", "**1. ", "**1.**", "Step 1:" at the start of the string
    # We want to remove the number part but keep the rest.
    
    # 1. Standard "1. ", "10. "
    # text = re.sub(r'^\s*\d+\.\s*', '', text)
    
    # 2. Markdown "1. **Text**" or "**1. Text**" or "**1.** Text"
    # Handling "**1. Filter:**" -> "**Filter:**"
    # Handling "1. **Filter:**" -> "**Filter:**"
    
    # Strategy: 
    # Check simple case first
    new_text = re.sub(r'^\s*\d+\.\s*', '', text)
    if new_text != text:
        return new_text
        
    # Check bold case: "**1. " or "**1.** " 
    # Remove number inside bold: "**1. Title**" -> "**Title**" ?
    # This matches "**" then digits then "." then spaces
    new_text = re.sub(r'^(\s*\*\*)\s*\d+\.\s*', r'\1', text)
    if new_text != text:
        return new_text

    # Check "Step 1:"
    new_text = re.sub(r'^\s*Step\s*\d+\s*:?\s*', '', text, flags=re.IGNORECASE)
    
    return new_text

def process_catalog():
    if not CATALOG_PATH.exists():
        print(f"Catalog not found at {CATALOG_PATH}")
        return

    try:
        data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    processed_count = 0
    
    for entry in data:
        # Fields to clean: help_tr keys, help_en keys
        for lang in ['tr', 'en']:
            help_key = f"help_{lang}"
            if help_key in entry and isinstance(entry[help_key], dict):
                help_obj = entry[help_key]
                
                # Check how_to
                hk = f"how_to_{lang}"
                if hk in help_obj and isinstance(help_obj[hk], list):
                    help_obj[hk] = [clean_text(line) for line in help_obj[hk]]
                    processed_count += 1
                    
                # Check examples (Optional: maybe user just wants bullet points here?)
                # User said "both bullet and number used... ugly".
                # If we strip numbers, we just rely on the list dot.
                # Let's clean examples too to be consistent.
                ek = f"examples_{lang}"
                if ek in help_obj and isinstance(help_obj[ek], list):
                    help_obj[ek] = [clean_text(line) for line in help_obj[ek]]

    # Save
    CATALOG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Processed {processed_count} entries. Saved to {CATALOG_PATH}")

if __name__ == "__main__":
    process_catalog()
