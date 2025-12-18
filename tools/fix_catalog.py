#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Catalog Fixes Script
====================
1. Delete 'frequency-table' (duplicate of frequency-table-single-column)
2. Make 'aggfunc' optional in 'report-filter-then-group'
"""
import json
from pathlib import Path

CATALOG_PATH = Path('backend/config/scenarios_catalog.json')

def main():
    print("[i] Loading catalog...")
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    original_count = len(catalog)
    print(f"[i] Loaded {original_count} scenarios")
    
    # 1. Delete 'frequency-table' (duplicate)
    print("\n[1] Deleting 'frequency-table' (duplicate)...")
    catalog = [s for s in catalog if s.get('id') != 'frequency-table']
    print(f"    Removed. New count: {len(catalog)}")
    
    # 2. Make aggfunc optional in report-filter-then-group
    print("\n[2] Making 'aggfunc' optional in 'report-filter-then-group'...")
    for scenario in catalog:
        if scenario.get('id') == 'report-filter-then-group':
            for param in scenario.get('params', []):
                if param.get('name') == 'aggfunc':
                    # Change label to indicate optional
                    param['label_tr'] = 'Toplama Fonksiyonu (Opsiyonel)'
                    param['label_en'] = 'Aggregation Function (Optional)'
                    # Add default value
                    param['default'] = 'sum'
                    # Add description
                    param['description_tr'] = 'Gruplama sonrası hangi fonksiyon uygulanacak? Boş bırakırsanız sadece filtreleme yapılır.'
                    param['description_en'] = 'Which function to apply after grouping? Leave empty for filtering only.'
                    print(f"    Updated: {param}")
            break
    
    # Save
    print("\n[i] Saving catalog...")
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] Done! Catalog updated: {original_count} -> {len(catalog)} scenarios")

if __name__ == "__main__":
    main()
