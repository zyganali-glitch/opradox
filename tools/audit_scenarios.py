#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Opradox Senaryo Audit Scripti
==============================
Bu script senaryoları otomatik analiz ederek potansiyel sorunları tespit eder:
1. Yanlış "ikinci dosya gerekli" uyarıları
2. Zorunlu parametre uyumsuzluğu
3. Aşırı sert zorunlu parametreler
4. Benzer/tekrarlayan senaryolar (aynı motor kodu)

Kullanım: python audit_scenarios.py
Çıktı: audit_report.md (Türkçe)
"""

import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any

# Proje dizini
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent / "backend"
CONFIG_DIR = BACKEND_DIR / "config"
CATALOG_PATH = CONFIG_DIR / "scenarios_catalog.json"

# PRO Builder senaryoları - DOKUNULMAZ
PRO_BUILDER_IDS = {
    "custom-report-builder-pro",
    "pivot-builder-pro", 
    "custom-report-builder"  # Normal builder da exclude
}

# İkinci dosya gerektiren parametre isimleri
FILE2_INDICATORS = [
    "file2", "second_file", "lookup_file", "reference_file",
    "file2_column", "lookup_column", "key_column2", "right_column",
    "compare_column", "reference_column"
]

# Aggregation gerektiren senaryolar için uyumsuzluk tespiti
# Senaryo adı "filter" veya "grupla" içeriyorsa ama aggregation zorunluysa → uyumsuz olabilir
FILTER_KEYWORDS = ["filter", "filtre", "satır", "rows", "koşul"]
GROUP_KEYWORDS = ["group", "grup", "category", "kategori"]


def load_catalog() -> List[Dict]:
    """Catalog JSON dosyasını yükle"""
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def is_param_mandatory(param: Dict) -> bool:
    """Parametre zorunlu mu kontrolü"""
    # Opsiyonel alanlar genelde:
    # - "optional" kelimesi içerir
    # - "(Opsiyonel)" label'ında
    # - default değeri var
    label_tr = param.get("label_tr", "").lower()
    label_en = param.get("label_en", "").lower()
    
    if "opsiyonel" in label_tr or "optional" in label_en:
        return False
    if param.get("default") is not None:
        return False
    
    return True


def check_file2_requirement(scenario: Dict) -> Dict:
    """
    İkinci dosya gereksinimi analizi.
    Gerçekten ikinci dosya gerektiriyor mu yoksa tek dosyadan da çalışabilir mi?
    """
    result = {
        "has_file2_params": False,
        "file2_param_names": [],
        "likely_single_file_ok": False,
        "reason": ""
    }
    
    params = scenario.get("params", [])
    impl_module = scenario.get("implementation", {}).get("module", "")
    
    # Parametre adlarını kontrol et
    for param in params:
        param_name = param.get("name", "").lower()
        for indicator in FILE2_INDICATORS:
            if indicator in param_name:
                result["has_file2_params"] = True
                result["file2_param_names"].append(param.get("name"))
                break
    
    # Motor adını kontrol et
    # join, merge, compare, lookup, vlookup → muhtemelen ikinci dosya gerektirir
    # single column stats, summary → muhtemelen tek dosya yeterli
    module_lower = impl_module.lower()
    
    if any(kw in module_lower for kw in ["join", "merge", "compare", "vlookup", "lookup_single", "multi_column_lookup"]):
        result["likely_single_file_ok"] = False
        result["reason"] = "Motor kodu birleştirme/arama içeriyor"
    elif any(kw in module_lower for kw in ["summary", "stats", "count", "average", "sum_if", "filter"]):
        if result["has_file2_params"]:
            result["likely_single_file_ok"] = True
            result["reason"] = "İstatistik/özet senaryosu ama ikinci dosya parametresi var"
    
    return result


def check_param_mismatch(scenario: Dict) -> Dict:
    """
    Zorunlu parametre - senaryo ruhu uyumsuzluğu kontrolü.
    Örnek: "Filtrele ve Grupla" ama aggregation zorunlu
    """
    result = {
        "has_mismatch": False,
        "issues": []
    }
    
    title_tr = scenario.get("title_tr", "").lower()
    title_en = scenario.get("title_en", "").lower()
    params = scenario.get("params", [])
    
    # Filtre/Grupla senaryosu mu?
    is_filter_scenario = any(kw in title_tr or kw in title_en for kw in FILTER_KEYWORDS)
    is_group_scenario = any(kw in title_tr or kw in title_en for kw in GROUP_KEYWORDS)
    
    for param in params:
        param_name = param.get("name", "").lower()
        is_mandatory = is_param_mandatory(param)
        
        # Aggregation function zorunlu ama senaryo sadece filtreleme amaçlı mı?
        if is_mandatory and "aggfunc" in param_name:
            if is_filter_scenario and not is_group_scenario:
                result["has_mismatch"] = True
                result["issues"].append(
                    f"'aggfunc' zorunlu ama senaryo filtre odaklı görünüyor"
                )
        
        # Tarih zorunlu ama senaryo tarih-bağımsız çalışabilir mi?
        if is_mandatory and ("date" in param_name or "tarih" in param_name):
            # Senaryo adında tarih kelimesi yoksa potansiyel uyumsuzluk
            if "date" not in title_en.lower() and "tarih" not in title_tr.lower():
                result["issues"].append(
                    f"'{param.get('name')}' zorunlu ama senaryo tarih-spesifik değil"
                )
    
    if result["issues"]:
        result["has_mismatch"] = True
    
    return result


def check_overly_strict_params(scenario: Dict) -> Dict:
    """
    Aşırı sert zorunlu parametre kontrolü.
    Evrensel isimli senaryo ama spesifik uygulama zorunluluğu.
    """
    result = {
        "is_overly_strict": False,
        "mandatory_count": 0,
        "optional_count": 0,
        "high_mandatory_ratio": False
    }
    
    params = scenario.get("params", [])
    
    for param in params:
        if is_param_mandatory(param):
            result["mandatory_count"] += 1
        else:
            result["optional_count"] += 1
    
    total = result["mandatory_count"] + result["optional_count"]
    if total > 0:
        mandatory_ratio = result["mandatory_count"] / total
        # 4'ten fazla zorunlu parametre VEYA zorunlu oranı %80'den fazla → potansiyel sorun
        if result["mandatory_count"] >= 5 or (mandatory_ratio > 0.8 and total >= 3):
            result["is_overly_strict"] = True
            result["high_mandatory_ratio"] = True
    
    return result


def find_duplicate_implementations(scenarios: List[Dict]) -> Dict[str, List[str]]:
    """
    Aynı motor kodunu kullanan senaryoları bul.
    """
    impl_to_scenarios = defaultdict(list)
    
    for sc in scenarios:
        if sc.get("id") in PRO_BUILDER_IDS:
            continue
        impl = sc.get("implementation", {}).get("module", "")
        if impl:
            impl_to_scenarios[impl].append({
                "id": sc.get("id"),
                "title_tr": sc.get("title_tr", ""),
                "title_en": sc.get("title_en", "")
            })
    
    # Sadece birden fazla senaryo kullananları döndür
    return {k: v for k, v in impl_to_scenarios.items() if len(v) > 1}


def generate_report(catalog: List[Dict]) -> str:
    """Türkçe audit raporu oluştur"""
    
    # PRO Builder hariç senaryolar
    scenarios = [sc for sc in catalog if sc.get("id") not in PRO_BUILDER_IDS]
    
    report = []
    report.append("# Opradox Senaryo Audit Raporu")
    report.append("")
    report.append(f"**Analiz Edilen Senaryo Sayısı:** {len(scenarios)}")
    report.append(f"**Hariç Tutulan (PRO Builder):** {len(PRO_BUILDER_IDS)}")
    report.append("")
    report.append("---")
    report.append("")
    
    # 1. İkinci Dosya Gereksinimleri
    report.append("## 1. İkinci Dosya Uyarısı Sorunları")
    report.append("")
    report.append("Aşağıdaki senaryolar ikinci dosya parametresi içeriyor ama tek dosyadan da çalışabilir görünüyor:")
    report.append("")
    
    file2_issues = []
    for sc in scenarios:
        check = check_file2_requirement(sc)
        if check["has_file2_params"] and check["likely_single_file_ok"]:
            file2_issues.append({
                "id": sc.get("id"),
                "title_tr": sc.get("title_tr"),
                "params": check["file2_param_names"],
                "reason": check["reason"]
            })
    
    if file2_issues:
        for issue in file2_issues:
            report.append(f"### `{issue['id']}`")
            report.append(f"**Başlık:** {issue['title_tr']}")
            report.append(f"**Parametreler:** {', '.join(issue['params'])}")
            report.append(f"**Neden:** {issue['reason']}")
            report.append("")
    else:
        report.append("✅ Belirgin sorun tespit edilmedi.")
        report.append("")
    
    # 2. Parametre Uyumsuzlukları
    report.append("---")
    report.append("")
    report.append("## 2. Zorunlu Parametre Uyumsuzlukları")
    report.append("")
    report.append("Senaryo başlığı ile zorunlu parametrelerin uyumsuz olduğu durumlar:")
    report.append("")
    
    mismatch_issues = []
    for sc in scenarios:
        check = check_param_mismatch(sc)
        if check["has_mismatch"]:
            mismatch_issues.append({
                "id": sc.get("id"),
                "title_tr": sc.get("title_tr"),
                "issues": check["issues"]
            })
    
    if mismatch_issues:
        for issue in mismatch_issues:
            report.append(f"### `{issue['id']}`")
            report.append(f"**Başlık:** {issue['title_tr']}")
            report.append("**Sorunlar:**")
            for i in issue["issues"]:
                report.append(f"- {i}")
            report.append("")
    else:
        report.append("✅ Belirgin uyumsuzluk tespit edilmedi.")
        report.append("")
    
    # 3. Aşırı Sert Parametreler
    report.append("---")
    report.append("")
    report.append("## 3. Aşırı Zorunlu Parametre Sayısı")
    report.append("")
    report.append("5+ zorunlu parametre veya %80+ zorunlu oran içeren senaryolar:")
    report.append("")
    
    strict_issues = []
    for sc in scenarios:
        check = check_overly_strict_params(sc)
        if check["is_overly_strict"]:
            strict_issues.append({
                "id": sc.get("id"),
                "title_tr": sc.get("title_tr"),
                "mandatory": check["mandatory_count"],
                "optional": check["optional_count"]
            })
    
    if strict_issues:
        report.append("| Senaryo ID | Başlık | Zorunlu | Opsiyonel |")
        report.append("|------------|--------|---------|-----------|")
        for issue in strict_issues:
            report.append(f"| `{issue['id']}` | {issue['title_tr'][:40]}... | {issue['mandatory']} | {issue['optional']} |")
        report.append("")
    else:
        report.append("✅ Aşırı sert parametreli senaryo tespit edilmedi.")
        report.append("")
    
    # 4. Tekrarlayan Motor Kodları
    report.append("---")
    report.append("")
    report.append("## 4. Aynı Motor Kodunu Kullanan Senaryolar")
    report.append("")
    report.append("Farklı ID'lerle aynı modülü kullanan senaryolar (potansiyel tekrar):")
    report.append("")
    
    duplicates = find_duplicate_implementations(scenarios)
    
    if duplicates:
        for module, scs in duplicates.items():
            report.append(f"### `{module}`")
            report.append("")
            for s in scs:
                report.append(f"- **{s['id']}**: {s['title_tr']}")
            report.append("")
    else:
        report.append("✅ Tekrarlayan motor kodu tespit edilmedi.")
        report.append("")
    
    # Özet
    report.append("---")
    report.append("")
    report.append("## Özet İstatistikler")
    report.append("")
    report.append(f"- **Toplam Analiz Edilen:** {len(scenarios)} senaryo")
    report.append(f"- **İkinci Dosya Sorunları:** {len(file2_issues)} senaryo")
    report.append(f"- **Parametre Uyumsuzlukları:** {len(mismatch_issues)} senaryo")
    report.append(f"- **Aşırı Sert Parametreler:** {len(strict_issues)} senaryo")
    report.append(f"- **Tekrarlayan Motor Kodları:** {len(duplicates)} modül")
    report.append("")
    
    return "\n".join(report)


def main():
    print("[i] Opradox Senaryo Audit basliyor...")
    print(f"[i] Catalog: {CATALOG_PATH}")
    
    if not CATALOG_PATH.exists():
        print(f"[!] Hata: Catalog bulunamadi: {CATALOG_PATH}")
        return
    
    catalog = load_catalog()
    print(f"[i] {len(catalog)} senaryo yuklendi")
    
    report = generate_report(catalog)
    
    # Raporu kaydet
    report_path = SCRIPT_DIR / "audit_report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"[OK] Rapor olusturuldu: {report_path}")
    print("")
    print("="*60)
    # Raporu konsola yazma - sadece dosyaya kaydet
    print("[i] Raporu audit_report.md dosyasinda goruntuleyebilirsiniz.")


if __name__ == "__main__":
    main()
