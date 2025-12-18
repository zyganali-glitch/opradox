import json
import re

# Catalog'u yükle
with open('backend/config/scenarios_catalog.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Değişiklik sayacı
changes = {
    'date_params_removed': 0,
    'available_options_added': 0,
    'scenarios_updated': []
}

# Her senaryoyu kontrol et
for scenario in catalog:
    scenario_id = scenario.get('id', '')
    
    # PRO Builder'ları atla
    if 'custom-report-builder' in scenario_id:
        continue
    
    # Parametreleri kontrol et
    params = scenario.get('params', [])
    original_param_count = len(params)
    
    # Gereksiz tarih parametrelerini bul
    date_params_to_remove = ['start_date', 'end_date', 'date_column']
    has_date_params = False
    
    for param_name in date_params_to_remove:
        if any(p['name'] == param_name for p in params):
            has_date_params = True
            break
    
    if has_date_params:
        # Tarih parametrelerini kaldır
        new_params = [p for p in params if p['name'] not in date_params_to_remove]
        scenario['params'] = new_params
        
        removed_count = original_param_count - len(new_params)
        changes['date_params_removed'] += removed_count
        
        # available_options ekle (eğer yoksa)
        if 'available_options' not in scenario:
            scenario['available_options'] = ['date_filter', 'grouping', 'sorting']
            changes['available_options_added'] += 1
        
        changes['scenarios_updated'].append({
            'id': scenario_id,
            'title': scenario.get('title_tr', ''),
            'removed_params': removed_count
        })

# Catalog'u kaydet
with open('backend/config/scenarios_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

# Rapor
print("=" * 60)
print("CATALOG TEMİZLEME RAPORU")
print("=" * 60)
print(f"Toplam parametre kaldırıldı: {changes['date_params_removed']}")
print(f"Toplam senaryo güncellendi: {len(changes['scenarios_updated'])}")
print(f"available_options eklendi: {changes['available_options_added']}")
print("\nGüncellenen Senaryolar:")
print("-" * 60)
for s in changes['scenarios_updated']:
    print(f"- {s['id']}: {s['title']} ({s['removed_params']} param)")
print("=" * 60)
