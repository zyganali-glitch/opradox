# backend/tools/catalog.py
"""
opradox - Senaryo Kataloğu Üretici
------------------------------------

Amacı:
- tools/scenario_source.py içindeki 'scenarios' listesini (senin uzun add(...) dizin)
  okuyup tek bir katalog haline getirmek.
- Her senaryo için:
  - id, kategori, TR/EN başlık, kısa açıklama, tag'ler
  - implementation: hangi Python modulü + fonksiyonu (varsa)
  - status: "implemented" veya "todo"
  - help_tr: Nedir / Nasıl / Örnekler (mini kullanım kılavuzu)
- Sonuçları backend/config/scenarios_catalog.json dosyasına yazmak.

Kullanım (terminalden):

    cd backend

    # Sadece katalog (LLM kullanmadan, ucuz, hızlı):
    python -m tools.catalog

    # Katalog + mini kullanım kılavuzları (LLM ile, tahmini < 1 USD):
    python -m tools.catalog --with-llm

    # Katalog + mini kılavuz + eksik motorları da üret (LLM ile):
    python -m tools.catalog --with-llm --generate-engines

Notlar:
- OPENAI_API_KEY ortam değişkeni tanımlı olmalı (llm_client için).
- GM_LLM_SMALL_MODEL tanımlı değilse varsayılan: gpt-4.1-mini
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

# Hem "python -m tools.catalog" hem "python tools/catalog.py" çalışsın diye:
try:
    from . import llm_client, scenario_source
except ImportError:
    import llm_client, scenario_source  # type: ignore


# --- Yol ve dosya ayarları ---

# backend/ klasörü
ROOT_DIR = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT_DIR / "config"
CATALOG_PATH = CONFIG_DIR / "scenarios_catalog.json"

# Ham senaryolar (senin add(...) ile doldurduğun liste)
RAW_SCENARIOS: List[Dict[str, Any]] = scenario_source.scenarios


# --- Engine eşlemesi: engine_hint -> Python modül/fonksiyon ---

ENGINE_HINT_TO_IMPLEMENTATION: Dict[str, Dict[str, str]] = {
    # SAYMA / FREKANS
    # Tek kolon + belirli değeri say (COUNTIF tipi)
    "count_rows": {"module": "app.scenarios.count_value", "func": "run"},
    # Çoklu koşula göre satır say (COUNTIFS tipi)
    "count_rows_multi": {"module": "app.scenarios.count_rows_multi", "func": "run"},
    # Boş olmayan hücre sayımı (COUNTA mantığı) – şimdilik aynı motor
    "count_nonblank": {"module": "app.scenarios.count_value", "func": "run"},

    # Tek/multi kolon frekans tablosu
    "frequency_table": {"module": "app.scenarios.frequency_table", "func": "run"},
    "frequency_table_multi": {"module": "app.scenarios.frequency_table", "func": "run"},

    # KOŞULLU TOPLAM / ORTALAMA
    "sum_if": {"module": "app.scenarios.sum_if", "func": "run"},
    "sum_ifs": {"module": "app.scenarios.sum_multi", "func": "run"},
    "avg_if": {"module": "app.scenarios.average_condition", "func": "run"},
    "avg_ifs": {"module": "app.scenarios.average_condition", "func": "run"},

    # TEMEL İSTATİSTİK
    "stats_basic": {"module": "app.scenarios.descriptive_stats", "func": "run"},

    # POWER QUERY TARZI
    "dt_unpivot": {"module": "app.scenarios.pq_unpivot_columns", "func": "run"},
    # İleride ekleyebiliriz:
    # "pq_append_tables": {"module": "app.scenarios.pq_append_tables", "func": "run"},
}

# Gerekirse ID bazlı eşleştirme (UI ile birebir uyum için)
ID_TO_IMPLEMENTATION: Dict[str, Dict[str, str]] = {
    # Eski MVP'de kullanılan ID'ler:
    "count-value": {"module": "app.scenarios.count_value", "func": "run"},
    "count-multi": {"module": "app.scenarios.count_rows_multi", "func": "run"},
    "count-rows-multi": {"module": "app.scenarios.count_rows_multi", "func": "run"},
    "sum-if": {"module": "app.scenarios.sum_if", "func": "run"},
}


# --- Yardımcı fonksiyonlar ---

def strip_code_fences(text: str) -> str:
    """
    LLM bazen çıktıyı ```json ... ``` blokları içinde dönebiliyor.
    Bu fonksiyon o çitleri kaldırır.
    """
    text = text.strip()
    if text.startswith("```"):
        # ```json ... ``` veya ``` ... ``` kalıbını parçala
        parts = text.split("```")
        # Kod bloğu genelde ikinci parçada
        for part in parts:
            part = part.strip()
            if part and not part.startswith("```"):
                text = part
                break
    return text.strip()


# --- 1) Ham senaryolardan temel katalog üretimi ---

def build_base_catalog() -> List[Dict[str, Any]]:
    """
    scenario_source.scenarios içindeki ham kayıtları,
    scenario_registry'nin beklediği katalog formatına çevirir.
    """
    items: List[Dict[str, Any]] = []

    for raw in RAW_SCENARIOS:
        sid = raw["id"]
        category_id = raw.get("category_id")
        title_tr = raw.get("title_tr")
        title_en = raw.get("title_en")
        short_tr = raw.get("short_desc_tr")
        short_en = raw.get("short_desc_en")
        tags_tr = raw.get("tags_tr", [])
        tags_en = raw.get("tags_en", [])
        engine_hint = raw.get("engine_hint")

        entry: Dict[str, Any] = {
            "id": sid,
            "category": category_id,
            "title_tr": title_tr,
            "title_en": title_en,
            "short_tr": short_tr,
            "short_en": short_en,
            "tags": tags_tr,      # list_scenarios bunu kullanıyor
            "tags_tr": tags_tr,
            "tags_en": tags_en,
            "engine_hint": engine_hint,
        }

        # Implementation / runner eşlemesi
        impl: Dict[str, Any] | None = None

        # 1) ID bazlı eşleşme
        if sid in ID_TO_IMPLEMENTATION:
            base_impl = ID_TO_IMPLEMENTATION[sid]
            impl = {**base_impl, "status": "implemented"}

        # 2) engine_hint bazlı eşleşme
        elif engine_hint and engine_hint in ENGINE_HINT_TO_IMPLEMENTATION:
            base_impl = ENGINE_HINT_TO_IMPLEMENTATION[engine_hint]
            impl = {**base_impl, "status": "implemented"}

        # 3) Hiçbiri yoksa: şimdilik TODO
        if impl is None:
            impl = {"status": "todo"}

        entry["implementation"] = impl
        entry["status"] = impl["status"]

        items.append(entry)

    return items


# --- 2) LLM ile mini kullanım kılavuzu üretimi ---

def _build_help_for_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tek bir senaryo için:
    - what_is_tr
    - how_to_tr (list)
    - examples_tr (list)
    alanlarını LLM ile üretir.

    Tamamen Türkçe, Excel bilmeyen ofis çalışanına göre sade anlatım ister.
    """
    sid = entry.get("id")
    title_tr = entry.get("title_tr") or ""
    short_tr = entry.get("short_tr") or ""
    category = entry.get("category") or ""

    system_msg = {
        "role": "system",
        "content": (
            "Sen, Excel'i hiç formül bilmeyen ofis çalışanlarına anlatan, "
            "sabırlı ve sade konuşan bir eğitmensin. "
            "opradox adlı bir web uygulaması için senaryo yardım metinleri yazıyorsun. "
            "Kullanıcı formül ismi bilmek zorunda değil; günlük dil kullan."
        ),
    }

    user_msg = {
        "role": "user",
        "content": (
            f"Aşağıdaki senaryo için Türkçe mini kullanım kılavuzu hazırla.\n\n"
            f"- Senaryo ID: {sid}\n"
            f"- Kategori (teknik isim): {category}\n"
            f"- Başlık (TR): {title_tr}\n"
            f"- Kısa açıklama (TR): {short_tr}\n\n"
            "İstediğim çıktı formatı, SADECE JSON olsun. Ekstra açıklama yazma.\n\n"
            "{\n"
            '  "what_is_tr": "Bu senaryo nedir? 1 paragraf.",\n'
            '  "how_to_tr": ["Adım 1...", "Adım 2...", "Adım 3..."],\n'
            '  "examples_tr": ["Örnek 1...", "Örnek 2...", "Örnek 3..."]\n'
            "}\n\n"
            "Kurallar:\n"
            "- Excel fonksiyon isimlerini (COUNTIF, SUMIFS vb.) mümkün olduğunca az kullan; "
            "kullanırsan parantez içinde kısaca açıkla.\n"
            "- Gerçek hayattan örnekler ver (satış listesi, öğrenci listesi, stok vb.).\n"
            "- Cümleler kısa ve net olsun.\n"
        ),
    }

    raw = llm_client.chat(
        messages=[system_msg, user_msg],
        model=None,  # DEFAULT_SMALL_MODEL
        temperature=0.2,
        max_tokens=800,
    )

    cleaned = strip_code_fences(raw)
    try:
        data = json.loads(cleaned)
        if not isinstance(data, dict):
            raise ValueError("JSON bekleniyordu")
    except Exception:
        # Parse edilemezse, en azından temel alanları dolduralım
        data = {
            "what_is_tr": short_tr
            or f"{title_tr} senaryosu, Excel'de bu işi kolayca yapmanı sağlar.",
            "how_to_tr": [
                "Excel dosyanı opradox'e yükle.",
                "Sol taraftan bu senaryoyu seç.",
                "Senaryonun istediği sütun ve koşul bilgilerini gir.",
                "Senaryoyu çalıştır; sonuç özetini ve istersen Excel çıktısını indir."
            ],
            "examples_tr": [
                f"{title_tr} senaryosunu, günlük raporlarını daha hızlı hazırlamak için kullanabilirsin."
            ],
        }

    return {
        "what_is_tr": str(data.get("what_is_tr", "")).strip(),
        "how_to_tr": [
            str(x).strip() for x in data.get("how_to_tr", []) if str(x).strip()
        ],
        "examples_tr": [
            str(x).strip() for x in data.get("examples_tr", []) if str(x).strip()
        ],
    }


def enrich_catalog_with_help(
    catalog: List[Dict[str, Any]],
    use_llm: bool,
) -> List[Dict[str, Any]]:
    """
    Katalogdaki her senaryoya 'help_tr' alanı ekler.
    use_llm=False ise sadece basit bir template koyar.
    """
    enriched: List[Dict[str, Any]] = []

    for entry in catalog:
        entry = dict(entry)  # kopya

        if use_llm:
            print(f"[LLM] Mini kılavuz üretiliyor: {entry.get('id')}")
            help_tr = _build_help_for_entry(entry)
        else:
            help_tr = {
                "what_is_tr": entry.get("short_tr", "") or "",
                "how_to_tr": [],
                "examples_tr": [],
            }

        entry["help_tr"] = help_tr
        enriched.append(entry)

    return enriched


# --- 3) Katalog kaydetme ---

def save_catalog(catalog: List[Dict[str, Any]]) -> None:
    CONFIG_DIR.mkdir(exist_ok=True)
    CATALOG_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[OK] {len(catalog)} kayıtlı katalog yazıldı -> {CATALOG_PATH}")


# --- 4) İsteğe bağlı: eksik motorları tetikleme ---

def generate_missing_engines() -> None:
    """
    tools/generate_scenarios_from_catalog.py script'ini ayrı bir Python süreci
    olarak çalıştırır. Bu script, implementation.status == "todo" olan senaryolar
    için app/scenarios/<id>.py dosyalarını üretir.
    """
    print("[INFO] Eksik senaryo motorları için generate_scenarios_from_catalog.py çalıştırılıyor...")
    cmd = [sys.executable, "tools/generate_scenarios_from_catalog.py"]
    proc = subprocess.run(cmd)
    if proc.returncode != 0:
        print("[WARN] generate_scenarios_from_catalog.py çalışırken bir hata oluştu.")
    else:
        print("[OK] generate_scenarios_from_catalog.py başarıyla tamamlandı.")


# --- 5) CLI main ---

def main() -> None:
    parser = argparse.ArgumentParser(description="opradox senaryo kataloğu üretici")
    parser.add_argument(
        "--with-llm",
        action="store_true",
        help="Her senaryo için LLM ile mini kullanım kılavuzu üret",
    )
    parser.add_argument(
        "--generate-engines",
        action="store_true",
        help="Katalog yazıldıktan sonra eksik motorları generate_scenarios_from_catalog ile üret",
    )
    args = parser.parse_args()

    print("[INFO] Ham senaryo sayısı (scenario_source.scenarios):", len(RAW_SCENARIOS))

    base_catalog = build_base_catalog()
    implemented_count = sum(1 for e in base_catalog if e.get("status") == "implemented")
    todo_count = sum(1 for e in base_catalog if e.get("status") == "todo")
    print(f"[INFO] Implemented: {implemented_count}, TODO: {todo_count}")

    final_catalog = enrich_catalog_with_help(base_catalog, use_llm=args.with_llm)
    save_catalog(final_catalog)

    if args.generate_engines:
        generate_missing_engines()


if __name__ == "__main__":
    main()
