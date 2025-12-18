import json

# Catalog'u yükle
with open('backend/config/scenarios_catalog.json', encoding='utf-8') as f:
    catalog = json.load(f)

# Catalog is a list, not a dict
scenarios = catalog

# 1. Özet döndüren senaryoları bul
print("=" * 80)
print("1. ÖZET DÖNDÜREN SENARYOLAR (return_mode parametresi olan)")
print("=" * 80)

summary_scenarios = []
for s in scenarios:
    params = s.get('params', [])
    for p in params:
        if p.get('name') == 'return_mode':
            summary_scenarios.append(s)
            print(f"[+] {s['id']}: {s.get('name_tr', 'N/A')}")
            break

print(f"\nToplam: {len(summary_scenarios)} senaryo")

# 2. available_options tanımlı senaryolar
print("\n" + "=" * 80)
print("2. AVAILABLE_OPTIONS TANIMI OLAN SENARYOLAR")
print("=" * 80)

opts_scenarios = [s for s in scenarios if s.get('available_options')]
print(f"Toplam: {len(opts_scenarios)} senaryo\n")

for s in opts_scenarios[:10]:
    print(f"{s['id']}: {s['available_options']}")

# 3. Sadece summary döndüren ama Excel çıktısı olmayan senaryolar
print("\n" + "=" * 80)
print("3. SADECE SUMMARY DÖNDÜREN (Excel yaklaşımı)?")
print("=" * 80)

for s in summary_scenarios:
    default_return_mode = None
    for p in s.get('params', []):
        if p.get('name') == 'return_mode' and 'default' in p:
            default_return_mode = p['default']
            break
    
    if default_return_mode == 'summary':
        print(f"[!] {s['id']}: default='summary' -> Excel dosyasi YOK")
    else:
        print(f"[+] {s['id']}: default='{default_return_mode}' -> Excel var")
