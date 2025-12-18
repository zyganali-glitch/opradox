import json
import re
import os
from pathlib import Path
from typing import Any, Dict, List

try:
    from . import scenario_source
except ImportError:
    import scenario_source

ROOT_DIR = Path(__file__).resolve().parents[1]
APP_DIR = ROOT_DIR / "app"
SCENARIOS_DIR = APP_DIR / "scenarios"
CONFIG_DIR = ROOT_DIR / "config"
CATALOG_PATH = CONFIG_DIR / "scenarios_catalog.json"

def fix_filename(sid: str) -> str:
    return sid.replace("-", "_")

# === 1. DETAYLI EĞİTMEN SÖZLÜĞÜ ===
# Burası "Sıradan Ofis Çalışanı"nın anlayacağı dilin kaynağıdır.
PARAM_DETAILS = {
    "column": {
        "tr": {"label": "İşlem Sütunu", "desc": "Excel dosyanızda işlemin yapılacağı sütunun başlığını (ilk satır) tam olarak buraya yazın. (Örn: 'Şehir' veya 'Ürün Adı')"},
        "en": {"label": "Target Column", "desc": "Type the exact header name of the column to process. (e.g., 'City' or 'Product Name')"}
    },
    "columns": {
        "tr": {"label": "Sütunlar Listesi", "desc": "İşleme dahil etmek istediğiniz tüm sütunları, aralarına virgül koyarak yazın. (Örn: Ad, Soyad, Telefon)"},
        "en": {"label": "Columns List", "desc": "Type all column headers separated by commas. (e.g., Name, Surname, Phone)"}
    },
    "value_column": {
        "tr": {"label": "Sayısal Değer Sütunu", "desc": "Hesaplama yapılacak (toplanacak veya ortalaması alınacak) sayısal verilerin olduğu sütun başlığı. (Örn: 'Satış Tutarı' veya 'Not')"},
        "en": {"label": "Numeric Value Column", "desc": "The column containing numeric data to be calculated. (e.g., 'Sales Amount')"}
    },
    "date_column": {
        "tr": {"label": "Tarih Sütunu", "desc": "Zaman analizi için kullanılacak tarih sütunu. Formatın düzgün olduğundan emin olun (GG.AA.YYYY)."},
        "en": {"label": "Date Column", "desc": "The column containing dates for time analysis. Ensure format is DD.MM.YYYY."}
    },
    "group_column": {
        "tr": {"label": "Gruplama Sütunu", "desc": "Verileri hangi kategoriye göre özetlemek istiyorsunuz? (Örn: Her 'Şehir' için ayrı toplam almak istiyorsanız buraya 'Şehir' yazın)."},
        "en": {"label": "Group Column", "desc": "Which category do you want to summarize by? (e.g., Type 'City' to get totals per city)."}
    },
    "target_column": {
        "tr": {"label": "Yeni Sütun Adı", "desc": "İşlem sonucunda oluşacak yeni sütuna vermek istediğiniz isim. (Örn: 'Yeni Kategori' veya 'Hesaplanan Puan')"},
        "en": {"label": "New Column Name", "desc": "The name you want to give to the newly created column."}
    },
    "lookup_df": {
        "tr": {"label": "Kaynak Tablo (Veri Kaynağı)", "desc": "BU ALANI BOŞ BIRAKABİLİRSİNİZ. Sistem, yüklediğiniz Excel dosyasının diğer sayfalarını otomatik tarayarak veri kaynağını bulur."},
        "en": {"label": "Source Table", "desc": "LEAVE THIS BLANK. The system automatically scans other sheets in your Excel file."}
    },
    "key_column": {
        "tr": {"label": "Ortak Anahtar Sütun", "desc": "İki tabloyu birbirine bağlayan ortak verinin olduğu sütun. (Örn: İki tabloda da 'TC Kimlik No' veya 'Ürün Kodu' varsa onu yazın)."},
        "en": {"label": "Common Key Column", "desc": "The column that links two tables together (e.g., 'ID' or 'Product Code' present in both tables)."}
    },
    "find_str": {
        "tr": {"label": "Aranan İfade", "desc": "Metin içinde değiştirmek veya bulmak istediğiniz kelime/harf grubu."},
        "en": {"label": "Search Text", "desc": "The word or phrase you want to find/replace."}
    },
    "replace_str": {
        "tr": {"label": "Yeni İfade", "desc": "Eski ifadenin yerine ne yazılsın? (Silmek için boş bırakabilirsiniz veya boşluk yazabilirsiniz)."},
        "en": {"label": "Replacement Text", "desc": "What should replace the old text?"}
    },
    "aggfunc": {
        "tr": {"label": "İşlem Türü", "desc": "Veriler üzerinde hangi matematiksel işlemi yapmak istiyorsunuz? (Toplam, Ortalama, Sayma...)"},
        "en": {"label": "Operation Type", "desc": "Which mathematical operation to perform? (Sum, Mean, Count...)"}
    },
    "operator": {
        "tr": {"label": "Mantıksal Kural", "desc": "Karşılaştırma kuralını seçin. (Eşittir, Büyüktür, İçerir vb.)"},
        "en": {"label": "Logic Rule", "desc": "Select the comparison rule (Equals, Greater Than, Contains, etc.)"}
    },
    "condition_value": {
        "tr": {"label": "Kriter Değeri", "desc": "Filtreleme veya koşul için baz alınacak değer. (Örn: 'Ankara' veya '1000')"},
        "en": {"label": "Condition Value", "desc": "The value to filter or check against. (e.g., 'London' or '1000')"}
    }
}

def get_param_info(p_name):
    # 1. Tam eşleşme
    if p_name in PARAM_DETAILS: return PARAM_DETAILS[p_name]
    
    # 2. Kısmi eşleşme (Akıllı Tahmin)
    for key, info in PARAM_DETAILS.items():
        if key in p_name:
            # Özel Durumlar
            if "start" in p_name: 
                return {"tr": {"label": "Başlangıç " + info["tr"]["label"], "desc": "Analizin başlayacağı tarih sınırını girin."}, "en": {"label": "Start " + info["en"]["label"], "desc": "Enter start date."}}
            if "end" in p_name: 
                return {"tr": {"label": "Bitiş " + info["tr"]["label"], "desc": "Analizin biteceği tarih sınırını girin."}, "en": {"label": "End " + info["en"]["label"], "desc": "Enter end date."}}
            return info
    
    # 3. Bilinmeyen
    clean_tr = p_name.replace("_", " ").title()
    return {
        "tr": {"label": clean_tr, "desc": f"'{clean_tr}' parametresi için uygun değeri girin."},
        "en": {"label": clean_tr, "desc": "Enter value."}
    }

def extract_params(file_path: Path) -> List[Dict[str, Any]]:
    params = []
    seen = set()
    try:
        content = file_path.read_text(encoding="utf-8")
        matches = re.findall(r'params\.get\(\s*["\']([^"\']+)["\']', content)
        matches += re.findall(r'params\[\s*["\']([^"\']+)["\']', content)
        unique = sorted(list(set(matches)))
        
        for p in unique:
            if p in ["return_mode"]: continue
            
            # Duplicate önleme (column vs column_name)
            base = p.replace("_name", "")
            if base in seen: continue
            seen.add(base)

            info = get_param_info(p)
            
            # Select inputlar
            if p == "aggfunc":
                entry = {
                    "name": p, "type": "select", "default": "sum",
                    "label_tr": info["tr"]["label"], "label_en": info["en"]["label"],
                    "description_tr": info["tr"]["desc"], "description_en": info["en"]["desc"],
                    "options": ["sum", "mean", "count", "min", "max"],
                    "option_labels_tr": {"sum":"Toplam", "mean":"Ortalama", "count":"Sayma", "min":"En Düşük", "max":"En Yüksek"},
                    "option_labels_en": {"sum":"Sum", "mean":"Average", "count":"Count", "min":"Min", "max":"Max"}
                }
            elif p == "operator":
                entry = {
                    "name": p, "type": "select", "default": "eq",
                    "label_tr": info["tr"]["label"], "label_en": info["en"]["label"],
                    "description_tr": info["tr"]["desc"], "description_en": info["en"]["desc"],
                    "options": ["eq", "neq", "gt", "lt", "contains"],
                    "option_labels_tr": {"eq":"Eşittir", "neq":"Eşit Değildir", "gt":"Büyüktür", "lt":"Küçüktür", "contains":"İçerir"},
                    "option_labels_en": {"eq":"Equals", "neq":"Not Equals", "gt":"Greater Than", "lt":"Less Than", "contains":"Contains"}
                }
            # Çoklu Koşul Algılama (Dynamic List)
            elif p in ["columns", "operators", "values", "conditions"]:
                entry = {
                    "name": p, "type": "dynamic_list",
                    "label_tr": info["tr"]["label"], "label_en": info["en"]["label"],
                    "placeholder_tr": "Değer girin...", "placeholder_en": "Enter value...",
                    "description_tr": info["tr"]["desc"] + " Birden fazla eklemek için 'Ekle' butonunu kullanın.",
                    "description_en": info["en"]["desc"]
                }
            else:
                p_type = "text"
                placeholder_tr = f"Örn: {info['tr']['label']}..."
                if "date" in p: placeholder_tr = "GG.AA.YYYY"
                
                entry = {
                    "name": p, "type": p_type,
                    "label_tr": info["tr"]["label"], "label_en": info["en"]["label"],
                    "placeholder_tr": placeholder_tr, "placeholder_en": "...",
                    "description_tr": info["tr"]["desc"], "description_en": info["en"]["desc"]
                }
            params.append(entry)
    except: pass
    return params

def generate_help(title_tr, title_en, desc_tr, desc_en, params, lang):
    is_tr = (lang == "tr")
    
    # 1. NEDİR?
    what_is = ""
    if is_tr:
        what_is = (
            f"<h3 style='color:var(--gm-accent); margin-bottom:5px;'>{title_tr} Nedir?</h3>"
            f"<p>{desc_tr}</p>"
            "<p>Bu senaryo, manuel olarak saatlerce sürebilecek Excel işlemlerini otomatize eder. "
            "Aşağıdaki adımları takip ederek verilerinizi hızlıca işleyebilirsiniz.</p>"
        )
    else:
        what_is = f"<h3>What is {title_en}?</h3><p>{desc_en}</p>"

    # 2. NASIL KULLANILIR? (ADIM ADIM REHBER)
    how_to = []
    if is_tr:
        how_to.append("<strong>1. Dosya Yükleme:</strong> İşlem yapmak istediğiniz Excel veya CSV dosyasını sol üstteki alana sürükleyip bırakın.")
        if params:
            how_to.append("<strong>2. Parametre Girişi:</strong> Orta paneldeki sihirbaz kutucuklarını doldurun:")
            for p in params:
                lbl = p.get("label_tr", p["name"])
                desc = p.get("description_tr", "")
                how_to.append(f"   • <span style='color:var(--gm-primary); font-weight:bold;'>{lbl}:</span> {desc}")
            
            # Çoklu parametre uyarısı
            if any(p["type"] == "dynamic_list" for p in params):
                how_to.append("   • <em>İpucu: 'Ekle' butonunu kullanarak birden fazla koşul veya sütun ekleyebilirsiniz. Bu, 'VE' (AND) mantığıyla çalışır.</em>")
                
        else:
            how_to.append("<strong>2. Ayarlar:</strong> Bu senaryo akıllıdır, ek bir ayar yapmanıza gerek yoktur.")
            
        how_to.append("<strong>3. Çalıştır:</strong> 'Senaryoyu Çalıştır' butonuna basın ve sonucu sağ alttan indirin.")
    else:
        how_to.append("1. Upload your file.")
        how_to.append("2. Fill in the parameters.")
        how_to.append("3. Click Run.")

    # 3. ÖRNEK
    examples = []
    if is_tr:
        if "vlookup" in title_tr.lower() or "lookup" in title_tr.lower():
            examples.append("Örnek: 'Satışlar' listenize, ürün koduna göre 'Fiyat Listesi' sayfasından fiyatları çekmek.")
        elif "pivot" in title_tr.lower() or "özet" in title_tr.lower():
            examples.append("Örnek: Hangi şehirden ne kadar ciro yapıldığını tek tabloda özetlemek.")
        elif "filtre" in title_tr.lower():
            examples.append("Örnek: Sadece 'İstanbul' şehrindeki ve tutarı 1000 TL üzeri olan satışları ayıklamak.")
        else:
            examples.append(f"Örnek: Listenizdeki verileri '{title_tr}' yöntemini kullanarak düzenlemek.")
    else:
        examples.append("Example usage...")

    return {
        f"what_is_{lang}": what_is,
        f"how_to_{lang}": how_to,
        f"examples_{lang}": examples
    }

def main():
    print("🚀 opradox Storyteller Engine v8...")
    final = []
    ids = set()
    
    # Kaynaktan oku
    for raw in scenario_source.scenarios:
        sid = raw["id"]
        ids.add(sid)
        clean = fix_filename(sid)
        fpath = SCENARIOS_DIR / f"{clean}.py"
        
        det = []
        if fpath.exists(): det = extract_params(fpath)
        par = raw.get("params") or det
        
        t_tr = raw.get("title_tr", sid)
        t_en = raw.get("title_en", t_tr)
        d_tr = raw.get("short_desc_tr", "")
        d_en = raw.get("short_desc_en", "")
        
        hlp_tr = generate_help(t_tr, t_en, d_tr, d_en, par, "tr")
        hlp_en = generate_help(t_tr, t_en, d_tr, d_en, par, "en")
        full_help = {**hlp_tr, **hlp_en}
        
        final.append({
            "id": sid, "category": raw.get("category_id"),
            "title_tr": t_tr, "title_en": t_en,
            "short_tr": d_tr, "short_en": d_en,
            "status": "implemented" if fpath.exists() else "todo",
            "implementation": {"module": f"app.scenarios.{clean}", "func": "run"},
            "params": par, "tags_tr": [], "tags_en": [],
            "help_tr": full_help, "help_en": full_help
        })

    # Diğer dosyaları bul
    for f in SCENARIOS_DIR.glob("*.py"):
        if f.name.startswith("__") or f.name.startswith("app."): continue
        fid = f.stem.replace("_", "-")
        if fid in ids or fid.replace("-","_") in [i.replace("-","_") for i in ids]: continue
        
        det = extract_params(f)
        hum = fid.replace("-", " ").title()
        
        hlp_tr = generate_help(hum, hum, "Otomatik algılanan modül.", "Auto module.", det, "tr")
        hlp_en = generate_help(hum, hum, "Otomatik algılanan modül.", "Auto module.", det, "en")
        full_help = {**hlp_tr, **hlp_en}
        
        final.append({
            "id": fid, "category": "other",
            "title_tr": hum, "title_en": hum,
            "short_tr": "Sistem Modülü", "short_en": "System Module",
            "status": "implemented",
            "implementation": {"module": f"app.scenarios.{f.stem}", "func": "run"},
            "params": det, "tags_tr": [], "tags_en": [],
            "help_tr": full_help, "help_en": full_help
        })

    CONFIG_DIR.mkdir(exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")
    print("✅ Katalog Hazır.")

if __name__ == "__main__":
    main()
