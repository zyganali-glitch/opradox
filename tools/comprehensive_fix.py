#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Kapsamlı Senaryo Düzeltme Scripti
=================================
1. Sorunlu senaryolardaki gereksiz zorunlu parametreleri opsiyonel yap
2. İkinci dosya mesajlarını yumuşat
3. Kılavuzları güncelle (TR/EN)
"""
import json
from pathlib import Path

CATALOG_PATH = Path('backend/config/scenarios_catalog.json')

def load_catalog():
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_catalog(catalog):
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

def make_param_optional(param, default_value=None):
    """Parametreyi opsiyonel yap"""
    # Label güncelle
    if 'label_tr' in param and 'opsiyonel' not in param['label_tr'].lower():
        param['label_tr'] = param['label_tr'] + ' (Opsiyonel)'
    if 'label_en' in param and 'optional' not in param['label_en'].lower():
        param['label_en'] = param['label_en'] + ' (Optional)'
    
    # Default değer ekle
    if default_value is not None:
        param['default'] = default_value
    
    return param

def fix_count_value(scenario):
    """count-value: Tekrar eden parametreleri kaldır"""
    params = scenario.get('params', [])
    
    # column ve column_name tekrar - birini sil
    # value ve search_value tekrar - birini sil
    keep_names = ['column', 'value', 'return_mode']
    scenario['params'] = [p for p in params if p.get('name') in keep_names]
    
    # return_mode'a default ekle
    for p in scenario['params']:
        if p.get('name') == 'return_mode':
            p['default'] = 'summary'
            if 'label_tr' in p:
                p['label_tr'] = 'Dönüş Tipi (Opsiyonel)'
            if 'label_en' in p:
                p['label_en'] = 'Return Type (Optional)'
    
    print(f"  [OK] count-value: 5 -> {len(scenario['params'])} parametre")
    return scenario

def fix_fallback_lookup(scenario):
    """fallback-lookup: Gereksiz parametreleri opsiyonel yap"""
    for p in scenario.get('params', []):
        name = p.get('name', '')
        # result_column ve return_column opsiyonel yapılabilir (varsayılan isim verilebilir)
        if name in ['result_column', 'return_column']:
            make_param_optional(p, 'Sonuç')
    
    print(f"  [OK] fallback-lookup: result/return_column opsiyonel yapıldı")
    return scenario

def fix_flag_rows(scenario):
    """flag-rows-that-meet-rule: Tekrar eden parametreleri kaldır"""
    params = scenario.get('params', [])
    
    # value ve condition_value tekrar
    # operator ve condition_operator tekrar
    keep_names = ['flag_column', 'condition_column', 'condition_operator', 'condition_value']
    scenario['params'] = [p for p in params if p.get('name') in keep_names]
    
    # flag_column'a varsayılan değer
    for p in scenario['params']:
        if p.get('name') == 'flag_column':
            p['default'] = 'Bayrak'
            if 'label_tr' in p:
                p['label_tr'] = 'Bayrak Sütunu Adı (Opsiyonel)'
            if 'label_en' in p:
                p['label_en'] = 'Flag Column Name (Optional)'
    
    print(f"  [OK] flag-rows-that-meet-rule: 6 -> {len(scenario['params'])} parametre")
    return scenario

def fix_highlight_values(scenario):
    """highlight-values-by-threshold: Renk parametrelerine varsayılan değer"""
    for p in scenario.get('params', []):
        name = p.get('name', '')
        if name == 'lower_color':
            make_param_optional(p, '#FF6B6B')  # Kırmızı
        elif name == 'upper_color':
            make_param_optional(p, '#4ECDC4')  # Yeşil
        elif name == 'lower_threshold':
            make_param_optional(p)
            p['description_tr'] = 'Alt eşik değeri. Boş bırakılırsa otomatik hesaplanır (Q1 - 1.5*IQR).'
            p['description_en'] = 'Lower threshold. If empty, calculated automatically (Q1 - 1.5*IQR).'
        elif name == 'upper_threshold':
            make_param_optional(p)
            p['description_tr'] = 'Üst eşik değeri. Boş bırakılırsa otomatik hesaplanır (Q3 + 1.5*IQR).'
            p['description_en'] = 'Upper threshold. If empty, calculated automatically (Q3 + 1.5*IQR).'
    
    print(f"  [OK] highlight-values-by-threshold: Renk/eşik parametreleri opsiyonel")
    return scenario

def fix_max_min_if(scenario):
    """max-min-if: aggfunc zaten adında var, ama yine de daha açıklayıcı yapalım"""
    # Bu senaryo aslında MAXIF/MINIF mantığı - aggfunc gerekli
    # Ama senaryo adı yanıltıcı olabilir, kılavuzu güncelleyelim
    if 'help_tr' in scenario:
        scenario['help_tr']['what_is_tr'] = (
            "Bu senaryo, belirli bir koşulu sağlayan satırlar arasından "
            "maksimum veya minimum değeri bulur. Excel'deki MAXIF/MINIF fonksiyonları gibi çalışır. "
            "Örneğin: 'IT departmanındaki en yüksek maaşı bul'."
        )
    if 'help_en' in scenario:
        scenario['help_en']['what_is_en'] = (
            "This scenario finds the maximum or minimum value among rows "
            "that meet a specific condition. Works like Excel's MAXIF/MINIF functions. "
            "Example: 'Find the highest salary in IT department'."
        )
    
    print(f"  [OK] max-min-if: Kılavuz güncellendi (aggfunc zorunlu kalmalı)")
    return scenario

def fix_reverse_lookup(scenario):
    """reverse-lookup-last-match: Tekrar eden parametreleri kaldır"""
    params = scenario.get('params', [])
    
    # lookup_value ve search_value tekrar
    keep_names = ['lookup_column', 'lookup_value', 'return_column']
    scenario['params'] = [p for p in params if p.get('name') in keep_names]
    
    print(f"  [OK] reverse-lookup-last-match: 7 -> {len(scenario['params'])} parametre")
    return scenario

def fix_vlookup(scenario):
    """vlookup-single-match: Tekrarları kaldır, bazılarını opsiyonel yap"""
    params = scenario.get('params', [])
    
    # lookup_column tekrar ediyor olabilir
    seen = set()
    new_params = []
    for p in params:
        name = p.get('name', '')
        if name not in seen:
            seen.add(name)
            new_params.append(p)
    
    scenario['params'] = new_params
    
    # lookup_value_column opsiyonel yapılabilir (tüm sütunları getir seçeneği)
    for p in scenario['params']:
        if p.get('name') == 'lookup_value_column':
            make_param_optional(p)
            p['description_tr'] = 'Getirilecek sütun. Boş bırakılırsa tüm eşleşen satır getirilir.'
            p['description_en'] = 'Column to return. If empty, returns entire matching row.'
    
    print(f"  [OK] vlookup-single-match: {len(scenario['params'])} parametre (tekrarlar temizlendi)")
    return scenario

def fix_xlookup(scenario):
    """xlookup-single-match: Varsayılan değerler ekle"""
    for p in scenario.get('params', []):
        name = p.get('name', '')
        if name == 'default_value':
            make_param_optional(p, '')
            p['description_tr'] = 'Eşleşme bulunamazsa döndürülecek değer. Boş bırakılabilir.'
            p['description_en'] = 'Value to return if no match found. Can be left empty.'
        elif name == 'search_mode':
            make_param_optional(p, 'exact')
        elif name == 'case_sensitive':
            make_param_optional(p, False)
    
    print(f"  [OK] xlookup-single-match: Varsayılan değerler eklendi")
    return scenario

def update_file2_messages(catalog):
    """
    İkinci dosya gerektiren senaryolar için mesajları yumuşat.
    Kılavuzlara not ekle.
    """
    file2_scenarios = [
        'fallback-lookup',
        'multi-column-lookup',
        'reverse-lookup-last-match',
        'validate-values-against-list',
        'vlookup-single-match',
        'xlookup-single-match'
    ]
    
    soft_message_tr = (
        "💡 **İpucu:** Bu senaryo için aynı dosyadan farklı bir sayfa seçebilir "
        "veya ikinci bir dosya yükleyebilirsiniz. Tek dosyadan da çalışabilir."
    )
    soft_message_en = (
        "💡 **Tip:** You can select a different sheet from the same file "
        "or upload a second file. Can also work with a single file."
    )
    
    for scenario in catalog:
        if scenario.get('id') in file2_scenarios:
            # help_tr güncelle
            if 'help_tr' in scenario:
                if 'how_to_tr' in scenario['help_tr']:
                    # İlk satıra ekle
                    if isinstance(scenario['help_tr']['how_to_tr'], list):
                        if soft_message_tr not in scenario['help_tr']['how_to_tr']:
                            scenario['help_tr']['how_to_tr'].insert(0, soft_message_tr)
            
            # help_en güncelle
            if 'help_en' in scenario:
                if 'how_to_en' in scenario['help_en']:
                    if isinstance(scenario['help_en']['how_to_en'], list):
                        if soft_message_en not in scenario['help_en']['how_to_en']:
                            scenario['help_en']['how_to_en'].insert(0, soft_message_en)
            
            print(f"  [OK] {scenario.get('id')}: Yumuşak mesaj eklendi")
    
    return catalog

def main():
    print("=" * 60)
    print("KAPSAMLI SENARYO DÜZELTME")
    print("=" * 60)
    
    catalog = load_catalog()
    print(f"[i] {len(catalog)} senaryo yüklendi\n")
    
    # 1. Sorunlu senaryoları düzelt
    print("[1] Sorunlu senaryolar düzeltiliyor...")
    
    fixes = {
        'count-value': fix_count_value,
        'fallback-lookup': fix_fallback_lookup,
        'flag-rows-that-meet-rule': fix_flag_rows,
        'highlight-values-by-threshold': fix_highlight_values,
        'max-min-if': fix_max_min_if,
        'reverse-lookup-last-match': fix_reverse_lookup,
        'vlookup-single-match': fix_vlookup,
        'xlookup-single-match': fix_xlookup,
    }
    
    for scenario in catalog:
        sid = scenario.get('id', '')
        if sid in fixes:
            fixes[sid](scenario)
    
    print()
    
    # 2. İkinci dosya mesajlarını yumuşat
    print("[2] İkinci dosya mesajları yumuşatılıyor...")
    catalog = update_file2_messages(catalog)
    
    print()
    
    # 3. Kaydet
    print("[3] Catalog kaydediliyor...")
    save_catalog(catalog)
    
    print()
    print("=" * 60)
    print("[OK] TAMAMLANDI!")
    print("=" * 60)

if __name__ == "__main__":
    main()
