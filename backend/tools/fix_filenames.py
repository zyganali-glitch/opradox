import os
import shutil
from pathlib import Path

# Yolları ayarla
ROOT_DIR = Path(__file__).resolve().parents[1]
SCENARIOS_DIR = ROOT_DIR / "app" / "scenarios"

def clean_directory():
    print("🧹 Senaryo Klasörü Temizliği Başlıyor...")
    
    if not SCENARIOS_DIR.exists():
        print("HATA: Senaryo klasörü bulunamadı!")
        return

    count = 0
    
    # 1. Adım: Hatalı "app.scenarios." öneklerini temizle
    for file in SCENARIOS_DIR.glob("app.scenarios.*.py"):
        new_name = file.name.replace("app.scenarios.", "")
        new_path = SCENARIOS_DIR / new_name
        
        # Eğer hedef dosya zaten varsa, eskisini silip üzerine yazmayalım, 
        # kaynak dosyayı silelim (içerik aynıdır muhtemelen)
        if new_path.exists():
            print(f"🗑️ Siliniyor (Duplicate): {file.name}")
            os.remove(file)
        else:
            print(f"✏️ Yeniden Adlandırılıyor: {file.name} -> {new_name}")
            os.rename(file, new_path)
        count += 1

    # 2. Adım: Tireleri (-) Alt Tireye (_) Çevir ve Hataları Düzelt
    # Özel düzeltmeler (Screenshot'taki hatalara göre)
    typo_map = {
        "grou_by": "group_by",
        "valuesby": "values_by",
        "single-match": "single_match",
        "multi-column": "multi_column",
        "clean-text": "clean_text",
        "uniques_only": "uniques_only",
        "top-contributors": "top_contributors",
        "against_list": "against_list"
    }

    for file in SCENARIOS_DIR.glob("*.py"):
        if file.name == "__init__.py": continue
        
        original_name = file.name
        new_name = original_name.replace("-", "_") # Tireleri yok et
        
        # Yazım hatalarını düzelt
        for bad, good in typo_map.items():
            if bad in new_name:
                new_name = new_name.replace(bad, good)
        
        if new_name != original_name:
            new_path = SCENARIOS_DIR / new_name
            if new_path.exists():
                print(f"🗑️ Siliniyor (Çakışma): {original_name}")
                os.remove(file)
            else:
                print(f"🔧 Düzeltiliyor: {original_name} -> {new_name}")
                os.rename(file, new_path)
            count += 1

    print(f"✅ Temizlik Tamamlandı! {count} dosya düzenlendi.")
    print("👉 Şimdi 'python -m tools.generate_catalog' komutunu tekrar çalıştır.")

if __name__ == "__main__":
    clean_directory()
