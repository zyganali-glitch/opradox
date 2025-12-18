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

# ==============================================================================
# 1. DEV PARAMETRE SÖZLÜĞÜ (KRAL'IN İSTEDİĞİ DETAY SEVİYESİ)
# ==============================================================================
PARAM_MAP = {
    # --- TEMEL SÜTUNLAR ---
    "column": {"tr": "İşlem Sütunu", "desc": "İşlemin yapılacağı sütunun başlığını (Excel'deki ilk satır) birebir buraya yazın. (Örn: 'Şehir' veya 'Ad Soyad')"},
    "columns": {"tr": "Sütunlar Listesi", "desc": "İşleme dahil etmek istediğiniz sütunların adlarını virgülle ayırarak yazın. (Örn: Ad, Soyad, Telefon)"},
    "value_column": {"tr": "Sayısal Değer Sütunu", "desc": "Hesaplama yapılacak (Toplama, Ortalama vb.) sayısal verilerin bulunduğu sütun. (Örn: 'Satış Tutarı', 'Not')"},
    "date_column": {"tr": "Tarih Sütunu", "desc": "Zaman analizi yapılacak tarih sütunu. Formatın 'GG.AA.YYYY' olduğundan emin olun."},
    "target_column": {"tr": "Yeni Sütun Adı", "desc": "İşlem sonucunda oluşacak yeni sütuna vermek istediğiniz isim. (Örn: 'Yeni Kategori')"},
    
    # --- VLOOKUP / JOIN / MATCHING ---
    "lookup_value": {"tr": "Aranan Değer", "desc": "Diğer tabloda bulmak istediğiniz spesifik değer."},
    "lookup_values": {"tr": "Aranan Değerler", "desc": "Toplu arama yapılacak değerler listesi."},
    "lookup_df": {"tr": "Kaynak Tablo (2. Dosya)", "desc": "⚠️ BU ALAN OTOMATİK DOLAR. Sol panelden yüklediğiniz 'İkinci Dosya' otomatik olarak kaynak kabul edilir."},
    "right_table": {"tr": "Birleştirilecek Tablo", "desc": "⚠️ BU ALAN OTOMATİK DOLAR. Sol panelden yüklediğiniz 'İkinci Dosya' kullanılır."},
    "key_column": {"tr": "Ortak Anahtar Sütun", "desc": "İki tabloyu birbirine bağlayan, her iki dosyada da bulunan ortak sütun. (Örn: TC Kimlik No, Barkod)."},
    "return_column": {"tr": "Getirilecek Veri Sütunu", "desc": "Eşleşme sağlandığında, diğer tablodan hangi sütundaki veriyi çekip getirelim? (Örn: 'Fiyat')"},
    
    # --- DETAYLI AYARLAR (KRAL'IN ŞİKAYET ETTİĞİ YERLER) ---
    "default_value": {"tr": "Bulunamazsa Ne Yazsın?", "desc": "Eğer aranan değer tabloda yoksa hücre boş kalmasın, ne yazılsın? (Örn: 'Yok', 'Bulunamadı' veya 0)."},
    "case_sensitive": {"tr": "Büyük/Küçük Harf Duyarlı?", "desc": "Harf büyüklüğü önemli mi? (Örn: 'elma' ile 'Elma' farklı sayılsın mı?). Evet için 'True', Hayır için 'False' yazın."},
    "match_mode": {"tr": "Eşleşme Modu", "desc": "Tam eşleşme mi arıyorsunuz (0), yoksa en yakın değeri mi? (Genellikle 0 kullanılır)."},
    "search_mode": {"tr": "Arama Yönü", "desc": "Listeyi baştan sona mı (1), sondan başa mı (-1) tarayalım? (Son kaydı bulmak için -1 yapın)."},
    "keep": {"tr": "Hangisi Tutulsun?", "desc": "Tekrar eden kayıtlardan hangisini saklayalım? ('first': İlkini, 'last': Sonuncusunu, 'false': Hiçbirini)."},
    "subset": {"tr": "Kontrol Sütunları", "desc": "Tekrarlar aranarken hangi sütunlara bakılsın? (Boş bırakırsanız tüm satıra bakar)."},
    
    # --- FİLTRE & KOŞUL ---
    "condition_column": {"tr": "Koşul Sütunu", "desc": "Filtrenin uygulanacağı sütun. (Örn: 'Departman' sütununda 'IT' olanları arıyorsanız, buraya 'Departman' yazın)."},
    "condition_value": {"tr": "Kriter Değeri", "desc": "Sütunda aradığınız spesifik değer. (Örn: 'Ankara', 'Aktif', '1000')."},
    "operator": {"tr": "Mantıksal Kural", "desc": "Değerin nasıl kıyaslanacağını seçin. (Eşittir, Büyüktür, İçerir vb.)"},
    "thresholds": {"tr": "Eşik Değerleri", "desc": "Limit değerleri virgülle girin (Örn: 100, 500). Bu değerlere göre gruplama yapılacaktır."},
    "labels": {"tr": "Etiket İsimleri", "desc": "Oluşturulacak gruplara verilecek isimler (Örn: Düşük, Orta, Yüksek)."},
    
    # --- PIVOT ---
    "group_column": {"tr": "Gruplama Sütunu", "desc": "Verileri neye göre gruplayacaksınız? (Örn: 'Şehir' bazında toplam almak için 'Şehir' yazın)."},
    "row_field": {"tr": "Satır Kategorisi", "desc": "Özet tablonun satırlarında hangi veri olsun? (Örn: Ürün Adı)."},
    "column_field": {"tr": "Sütun Kategorisi", "desc": "Özet tablonun sütunlarında hangi veri olsun? (Örn: Yıl, Ay)."},
    "aggfunc": {"tr": "Hesaplama Türü", "desc": "Hangi işlemi yapmak istiyorsunuz? (Toplam, Ortalama, Sayma...)"},
    
    # --- METİN İŞLEMLERİ ---
    "find_str": {"tr": "Aranan İfade", "desc": "Metin içinde değiştirmek veya bulmak istediğiniz kelime/harf grubu."},
    "replace_str": {"tr": "Yeni İfade", "desc": "Eski ifadenin yerine ne yazılsın? (Silmek için boş bırakabilirsiniz)."},
    "marker": {"tr": "Ayırıcı İşaret", "desc": "Metni bölmek için kullanılacak işaret (Örn: @, -, boşluk, virgül)."},
    "part": {"tr": "Hangi Kısım?", "desc": "İşaretin öncesini mi ('before') sonrasını mı ('after') istiyorsunuz?"},
    "case": {"tr": "Harf Formatı", "desc": "Metin nasıl dönüştürülsün? (upper: BÜYÜK, lower: küçük, proper: Baş Harf)."},
    
    # --- UNPIVOT / POWER QUERY ---
    "id_vars": {"tr": "Sabit Sütunlar (ID)", "desc": "Dönüştürme sırasında yapısı bozulmayacak, sabit kalacak sütunlar."},
    "value_vars": {"tr": "Dönüşecek Sütunlar", "desc": "Yataydan dikeye çevrilecek, verilerin olduğu sütunlar."},
    "var_name": {"tr": "Yeni Başlık Sütunu Adı", "desc": "Eski sütun başlıklarının geleceği yeni sütunun adı (Örn: 'Aylar')."},
    "value_name": {"tr": "Yeni Değer Sütunu Adı", "desc": "Sayısal verilerin geleceği yeni sütunun adı (Örn: 'Tutar')."},
    
    # --- DİĞER ---
    "n": {"tr": "Kayıt Sayısı (N)", "desc": "Kaç kayıt üzerinde işlem yapılsın? (Örn: En yüksek 5 kayıt için 5 yazın)."},
    "mode": {"tr": "Mod (Yön)", "desc": "En Yüksekler (top) mi, En Düşükler (bottom) mi?"},
    "min_limit": {"tr": "Alt Sınır", "desc": "Kabul edilecek en düşük değer."},
    "max_limit": {"tr": "Üst Sınır", "desc": "Kabul edilecek en yüksek değer."}
}

# İngilizce Karşılıkları (Otomatik Üretim İçin Helper)
def get_en_desc(tr_desc):
    # Basit bir eşleme, gerçek çeviri yerine placeholder
    return "Enter appropriate value."

def get_param_info(p_name):
    # 1. Tam Eşleşme
    if p_name in PARAM_MAP:
        info = PARAM_MAP[p_name]
        return {
            "tr": info["tr"], 
            "desc_tr": info["desc"],
            "en": info.get("en", p_name.title()), 
            "desc_en": info.get("desc_en", "Enter value.")
        }
    
    # 2. Kısmi Eşleşme (Akıllı Tahmin)
    for key, info in PARAM_MAP.items():
        if key in p_name:
            # Özel Durumlar: Start/End
            prefix_tr = ""
            prefix_en = ""
            if "start" in p_name: 
                prefix_tr = "Başlangıç "
                prefix_en = "Start "
            elif "end" in p_name: 
                prefix_tr = "Bitiş "
                prefix_en = "End "
            
            return {
                "tr": prefix_tr + info["tr"],
                "desc_tr": info["desc"], # Açıklama aynı kalabilir veya özelleştirilebilir
                "en": prefix_en + info.get("en", key.title()),
                "desc_en": info.get("desc_en", "Enter value.")
            }
    
    # 3. Bilinmeyen (Fallback - Ama Güzel Formatlı)
    clean_tr = p_name.replace("_", " ").title()
    return {
        "tr": clean_tr, 
        "desc_tr": f"'{clean_tr}' parametresi için uygun değeri girin.",
        "en": clean_tr, 
        "desc_en": "Enter value."
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
            
            # Duplicate önleme
            base = p.replace("_name", "")
            if base in seen: continue
            seen.add(base)

            info = get_param_info(p)
            
            # Select inputlar
            if p == "aggfunc":
                entry = {
                    "name": p, "type": "select", "default": "sum",
                    "label_tr": info["tr"], "label_en": info["en"],
                    "description_tr": info["desc_tr"], "description_en": info["desc_en"],
                    "options": ["sum", "mean", "count", "min", "max"],
                    "option_labels_tr": {"sum":"Toplam", "mean":"Ortalama", "count":"Sayma", "min":"En Düşük", "max":"En Yüksek"},
                    "option_labels_en": {"sum":"Sum", "mean":"Average", "count":"Count", "min":"Min", "max":"Max"}
                }
            elif p == "operator":
                entry = {
                    "name": p, "type": "select", "default": "eq",
                    "label_tr": info["tr"], "label_en": info["en"],
                    "description_tr": info["desc_tr"], "description_en": info["desc_en"],
                    "options": ["eq", "neq", "gt", "lt", "contains"],
                    "option_labels_tr": {"eq":"Eşittir", "neq":"Eşit Değil", "gt":"Büyüktür", "lt":"Küçüktür", "contains":"İçerir"},
                    "option_labels_en": {"eq":"Equals", "neq":"Not Equals", "gt":"Greater", "lt":"Less", "contains":"Contains"}
                }
            elif p == "mode":
                entry = {
                    "name": p, "type": "select", "default": "top",
                    "label_tr": info["tr"], "label_en": info["en"],
                    "description_tr": info["desc_tr"], "description_en": info["desc_en"],
                    "options": ["top", "bottom"],
                    "option_labels_tr": {"top":"En Yüksekler", "bottom":"En Düşükler"},
                    "option_labels_en": {"top":"Top", "bottom":"Bottom"}
                }
            elif p == "case":
                entry = {
                    "name": p, "type": "select", "default": "proper",
                    "label_tr": info["tr"], "label_en": info["en"],
                    "description_tr": info["desc_tr"], "description_en": info["desc_en"],
                    "options": ["upper", "lower", "proper"],
                    "option_labels_tr": {"upper":"TÜMÜ BÜYÜK", "lower":"tümü küçük", "proper":"Baş Harf Büyük"},
                    "option_labels_en": {"upper":"UPPER", "lower":"lower", "proper":"Title Case"}
                }
            # Çoklu Koşul Algılama
            elif p in ["columns", "operators", "values", "conditions"]:
                entry = {
                    "name": p, "type": "dynamic_list",
                    "label_tr": info["tr"], "label_en": info["en"],
                    "placeholder_tr": "Değer girin...", "placeholder_en": "Enter value...",
                    "description_tr": info["desc_tr"] + " (Çoklu ekleme yapabilirsiniz).",
                    "description_en": info["desc_en"]
                }
            # Standart Text
            else:
                p_type = "text"
                placeholder = f"Örn: {info['tr']}..."
                if "date" in p: placeholder = "GG.AA.YYYY"
                
                entry = {
                    "name": p, "type": p_type,
                    "label_tr": info["tr"], "label_en": info["en"],
                    "placeholder_tr": placeholder, "placeholder_en": "...",
                    "description_tr": info["desc_tr"], "description_en": info["desc_en"]
                }
            params.append(entry)
    except: pass
    return params

def generate_help(title_tr, title_en, desc_tr, desc_en, params, lang):
    is_tr = (lang == "tr")
    
    what_is = ""
    if is_tr:
        what_is = (
            f"<strong>{title_tr}</strong> işlemi;<br>{desc_tr}<br><br>"
            "Bu araç, karmaşık Excel formülleriyle vakit kaybetmeden verilerinizi saniyeler içinde analiz etmenizi sağlar."
        )
    else:
        what_is = f"<strong>{title_en}</strong><br>{desc_en}"

    how_to = ["1. Dosyanızı yükleyin ve soldan bu senaryoyu seçin." if is_tr else "1. Upload file and select scenario."]
    
    if params:
        how_to.append("2. <b>Ayarlar Paneli:</b> Aşağıdaki alanları doldurun:" if is_tr else "2. Fill settings:")
        for p in params:
            lbl = p.get("label_tr" if is_tr else "label_en", p["name"])
            dsc = p.get("description_tr" if is_tr else "description_en", "")
            how_to.append(f"   • <span style='color:var(--gm-primary)'><b>{lbl}:</b></span> {dsc}")
    else:
        how_to.append("2. Bu senaryo için ek ayar gerekmez, tam otomatiktir." if is_tr else "2. No settings needed.")
        
    how_to.append("3. 'Çalıştır' butonuna basın ve sonucu indirin." if is_tr else "3. Click Run.")
    
    examples = [f"Örnek: Listenizdeki verileri '{title_tr}' yöntemiyle düzenleyin." if is_tr else "Example usage."]

    return {
        f"what_is_{lang}": what_is,
        f"how_to_{lang}": how_to,
        f"examples_{lang}": examples
    }

def main():
    print("🚀 opradox Eğitmen v11 (Ultra Detaylı)...")
    final = []
    ids = set()
    
    # 1. Source'dan
    for raw in scenario_source.scenarios:
        sid = raw["id"]
        ids.add(sid)
        clean = fix_filename(sid)
        fpath = SCENARIOS_DIR / f"{clean}.py"
        
        detected = []
        if fpath.exists(): detected = extract_params(fpath)
        
        final_params = raw.get("params")
        if not final_params: final_params = detected

        t_tr = raw.get("title_tr", sid)
        t_en = raw.get("title_en", t_tr) 
        d_tr = raw.get("short_desc_tr", "")
        d_en = raw.get("short_desc_en", d_tr)

        hlp_tr = generate_help(t_tr, t_en, d_tr, d_en, final_params, "tr")
        hlp_en = generate_help(t_tr, t_en, d_tr, d_en, final_params, "en")
        full_help = {**hlp_tr, **hlp_en}
        
        final.append({
            "id": sid, "category": raw.get("category_id"),
            "title_tr": t_tr, "title_en": t_en,
            "short_tr": d_tr, "short_en": d_en,
            "status": "implemented" if fpath.exists() else "todo",
            "implementation": {"module": f"app.scenarios.{clean}", "func": "run"},
            "params": final_params, 
            "tags_tr": raw.get("tags_tr", []), "tags_en": [],
            "help_tr": full_help, "help_en": full_help
        })

    # 2. Other Files
    for f in SCENARIOS_DIR.glob("*.py"):
        if f.name.startswith("__") or f.name.startswith("app."): continue
        fid = f.stem.replace("_", "-")
        if fid in ids or fid.replace("-","_") in [i.replace("-","_") for i in ids]: continue
        
        det = extract_params(f)
        hum = fid.replace("-", " ").title()
        
        hlp_tr = generate_help(hum, hum, "Otomatik modül.", "Auto.", det, "tr")
        hlp_en = generate_help(hum, hum, "Otomatik modül.", "Auto.", det, "en")
        
        final.append({
            "id": fid, "category": "other",
            "title_tr": hum, "title_en": hum,
            "short_tr": "Sistem Modülü", "short_en": "System Module",
            "status": "implemented",
            "implementation": {"module": f"app.scenarios.{f.stem}", "func": "run"},
            "params": det, "tags_tr": [], "tags_en": [],
            "help_tr": {**hlp_tr, **hlp_en}, "help_en": {**hlp_tr, **hlp_en}
        })

    CONFIG_DIR.mkdir(exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")
    print("✅ Katalog Hazır.")

if __name__ == "__main__":
    main()
