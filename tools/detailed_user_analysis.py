#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Detaylı Kullanıcı Perspektifi Analizi
=====================================
Her senaryoyu gerçek bir kullanıcı gözüyle inceleyip
zorunlu parametrelerin mantıklı olup olmadığını değerlendirir.
"""
import json
from pathlib import Path

CATALOG_PATH = Path('backend/config/scenarios_catalog.json')

def analyze_scenario_like_user(scenario):
    """
    Senaryoyu kullanıcı gözüyle analiz et.
    Soruları sor:
    - Bu senaryonun adı ne vaat ediyor?
    - Zorunlu parametreler bu vaade uygun mu?
    - Gereksiz zorlamalar var mı?
    """
    id = scenario.get('id', '')
    title_tr = scenario.get('title_tr', '')
    title_en = scenario.get('title_en', '')
    params = scenario.get('params', [])
    
    # Mandatory/Optional ayrımı
    mandatory_params = []
    optional_params = []
    
    for p in params:
        name = p.get('name', '')
        label_tr = p.get('label_tr', '')
        label_en = p.get('label_en', '')
        ptype = p.get('type', '')
        default = p.get('default')
        
        is_optional = (
            'opsiyonel' in label_tr.lower() or
            'optional' in label_en.lower() or
            default is not None
        )
        
        info = {
            'name': name,
            'label_tr': label_tr,
            'type': ptype,
            'default': default
        }
        
        if is_optional:
            optional_params.append(info)
        else:
            mandatory_params.append(info)
    
    # Analiz yap
    issues = []
    notes = []
    
    # 1. Aggregation zorunlu ama senaryo sadece filter/liste amaçlı mı?
    filter_keywords = ['filtre', 'filter', 'koşul', 'condition', 'satır', 'row']
    agg_keywords = ['toplam', 'sum', 'ortalama', 'mean', 'average', 'özet', 'summary', 'grupla', 'group']
    
    title_lower = (title_tr + ' ' + title_en).lower()
    has_filter_in_name = any(kw in title_lower for kw in filter_keywords)
    has_agg_in_name = any(kw in title_lower for kw in agg_keywords)
    
    has_aggfunc_mandatory = any(
        'aggfunc' in p['name'].lower() or 'fonksiyon' in p['label_tr'].lower()
        for p in mandatory_params
    )
    
    if has_aggfunc_mandatory and has_filter_in_name and not has_agg_in_name:
        issues.append("'Aggregation' zorunlu ama senaryo adı filtreleme/satır işlemi vaat ediyor")
    
    # 2. Tarih zorunlu ama senaryo adında tarih yok mu?
    date_keywords = ['tarih', 'date', 'ay', 'month', 'yıl', 'year', 'dönem', 'period']
    has_date_in_name = any(kw in title_lower for kw in date_keywords)
    has_date_mandatory = any(
        'date' in p['name'].lower() or 'tarih' in p['name'].lower()
        for p in mandatory_params
    )
    
    if has_date_mandatory and not has_date_in_name:
        notes.append("Tarih parametresi zorunlu ama senaryo adında tarih belirtilmemiş")
    
    # 3. Çok fazla zorunlu parametre (5+)?
    if len(mandatory_params) >= 5:
        issues.append(f"{len(mandatory_params)} adet zorunlu parametre - kullanıcı için karmaşık olabilir")
    
    # 4. Hiç opsiyonel parametre yok mu?
    if len(mandatory_params) >= 3 and len(optional_params) == 0:
        notes.append("Tüm parametreler zorunlu - bazıları opsiyonel yapılabilir mi?")
    
    # 5. İkinci dosya gerekliliği var mı?
    file2_keywords = ['file2', 'second', 'ikinci', 'lookup', 'reference', 'compare']
    has_file2_param = any(
        any(kw in p['name'].lower() for kw in file2_keywords)
        for p in mandatory_params + optional_params
    )
    
    return {
        'id': id,
        'title_tr': title_tr,
        'mandatory_count': len(mandatory_params),
        'optional_count': len(optional_params),
        'mandatory_params': mandatory_params,
        'optional_params': optional_params,
        'issues': issues,
        'notes': notes,
        'has_file2_param': has_file2_param
    }


def generate_detailed_report(catalog):
    """Detaylı Türkçe rapor oluştur"""
    
    # PRO Builder hariç
    pro_ids = {'custom-report-builder-pro', 'pivot-builder-pro', 'custom-report-builder'}
    scenarios = [s for s in catalog if s.get('id') not in pro_ids]
    
    analyses = [analyze_scenario_like_user(s) for s in scenarios]
    
    # Sorunlu olanları filtrele
    with_issues = [a for a in analyses if a['issues']]
    with_notes = [a for a in analyses if a['notes'] and not a['issues']]
    with_file2 = [a for a in analyses if a['has_file2_param']]
    
    report = []
    report.append("# Opradox Senaryo Detaylı Kullanıcı Analizi")
    report.append("")
    report.append("Bu rapor her senaryoyu gerçek bir kullanıcı perspektifinden değerlendirir.")
    report.append("'Şu işi yapmak istedim ama X zorunlu tutulmuş' gibi notlar içerir.")
    report.append("")
    report.append(f"**Toplam Analiz:** {len(analyses)} senaryo")
    report.append(f"**Sorunlu:** {len(with_issues)} senaryo")
    report.append(f"**Notlu:** {len(with_notes)} senaryo")
    report.append(f"**İkinci Dosya Parametreli:** {len(with_file2)} senaryo")
    report.append("")
    report.append("---")
    report.append("")
    
    # SORUNLU SENARYOLAR
    report.append("## 🔴 Sorunlu Senaryolar (Düzeltilmeli)")
    report.append("")
    
    if with_issues:
        for a in with_issues:
            report.append(f"### `{a['id']}`")
            report.append(f"**Başlık:** {a['title_tr']}")
            report.append(f"**Zorunlu/Opsiyonel:** {a['mandatory_count']}/{a['optional_count']}")
            report.append("")
            report.append("**Zorunlu Parametreler:**")
            for p in a['mandatory_params']:
                report.append(f"- `{p['name']}`: {p['label_tr']}")
            report.append("")
            report.append("**Sorunlar:**")
            for i in a['issues']:
                report.append(f"- ⚠️ {i}")
            report.append("")
            report.append("**Kullanıcı Deneyimi Notu:**")
            # Özel yorum ekle
            if 'aggregation' in ' '.join(a['issues']).lower():
                report.append("> \"Bu senaryoda sadece filtreleme yapmak istedim ama benden toplam/ortalama seçmemi istiyor. Ben sadece satırları görmek istiyorum!\"")
            elif 'zorunlu parametre' in ' '.join(a['issues']).lower():
                report.append("> \"Çok fazla alan doldurmam gerekiyor. Bazıları gerçekten gerekli mi?\"")
            report.append("")
            report.append("---")
            report.append("")
    else:
        report.append("✅ Kritik sorunlu senaryo tespit edilmedi.")
        report.append("")
    
    # NOTLU SENARYOLAR
    report.append("## 🟡 Gözden Geçirilmeli Senaryolar")
    report.append("")
    
    if with_notes:
        for a in with_notes[:15]:  # İlk 15
            report.append(f"### `{a['id']}`")
            report.append(f"**Başlık:** {a['title_tr']}")
            report.append(f"**Zorunlu/Opsiyonel:** {a['mandatory_count']}/{a['optional_count']}")
            report.append("")
            for n in a['notes']:
                report.append(f"- 📝 {n}")
            report.append("")
        
        if len(with_notes) > 15:
            report.append(f"... ve {len(with_notes) - 15} senaryo daha")
            report.append("")
    else:
        report.append("✅ İncelenmesi gereken ek senaryo yok.")
        report.append("")
    
    # İKİNCİ DOSYA PARAMETRELİ SENARYOLAR
    report.append("---")
    report.append("")
    report.append("## 📁 İkinci Dosya Parametresi İçeren Senaryolar")
    report.append("")
    report.append("Bu senaryolar için 'İkinci Dosya Gerekli' yerine daha yumuşak bir mesaj önerilir:")
    report.append("> \"Aynı veya farklı dosyadan seçim yapabilirsiniz\"")
    report.append("")
    
    if with_file2:
        for a in with_file2:
            file2_params = [p for p in a['mandatory_params'] + a['optional_params'] 
                          if any(kw in p['name'].lower() for kw in ['file2', 'second', 'lookup', 'reference', 'compare'])]
            report.append(f"- `{a['id']}`: {a['title_tr']}")
            for p in file2_params:
                report.append(f"  - `{p['name']}`")
        report.append("")
    else:
        report.append("Bu kategoride senaryo bulunamadı.")
        report.append("")
    
    return '\n'.join(report)


def main():
    print("[i] Loading catalog...")
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"[i] Analyzing {len(catalog)} scenarios...")
    
    report = generate_detailed_report(catalog)
    
    report_path = Path('tools/detailed_user_analysis.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"[OK] Report saved: {report_path}")


if __name__ == "__main__":
    main()
