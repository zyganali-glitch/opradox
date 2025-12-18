import importlib
import json
from pathlib import Path
from typing import Any, Dict, List, Callable

from fastapi import HTTPException

# Proje kökünden config/scenarios_catalog.json'u oku
# (app/scenario_registry.py konumundan 1 yukarı = backend/)
ROOT_DIR = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT_DIR / "config" / "scenarios_catalog.json"

# Fix import path: Add 'backend/' to sys.path so 'app.scenarios...' works
import sys
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

# -------------------------------------------------------
# EXCEL ÇIKTISI GEÇİCİ DEPOLAMA (GÖREV 1.1)
# main.py'daki /run endpoint'i buraya yazar, /download buradan okur.
# -------------------------------------------------------
LAST_EXCEL_STORE: Dict[str, Dict[str, Any]] = {}

SCENARIOS: Dict[str, Dict[str, Any]] = {}


def _load_catalog_raw() -> List[Dict[str, Any]]:
    if not CATALOG_PATH.exists():
        raise RuntimeError(f"Senaryo katalog dosyası bulunamadı: {CATALOG_PATH}")
    text = CATALOG_PATH.read_text(encoding="utf-8")
    data = json.loads(text)
    if not isinstance(data, list):
        raise RuntimeError("scenarios_catalog.json beklenen formatta değil (liste olmalı).")
    return data


def _build_scenarios() -> Dict[str, Dict[str, Any]]:
    """
    config/scenarios_catalog.json içindeki her kaydı
    runtime'da kullanılacak SCENARIOS dict'ine çevirir.
    """
    catalog = _load_catalog_raw()
    scenarios: Dict[str, Dict[str, Any]] = {}

    for item in catalog:
        sid = item.get("id")
        if not sid:
            continue

        impl = item.get("implementation") or {}
        module_name = impl.get("module")
        func_name = impl.get("func", "run")
        status = impl.get("status", item.get("status", "todo"))

        runner: Callable[..., Any] | None = None
        final_status = status or "todo"

        if module_name:
            try:
                module = importlib.import_module(module_name)
                runner = getattr(module, func_name)
                # Eğer modül başarıyla import edildiyse, en azından "implemented" / "generated" sayalım
                if final_status in (None, "", "todo"):
                    final_status = "implemented"
            except Exception as e: # Hata nesnesini yakala
                # Modül yüklenemezse, senaryoyu listede tut ama çalıştırılamaz olarak işaretle
                print(f"[SCENARIO ERROR] {sid} senaryosu yüklenirken hata: {e}") # TERMINALE YAZDIR
                runner = None
                final_status = "broken" # KIRIK OLARAK İŞARETLE

        scenario: Dict[str, Any] = {
            
            "id": sid,
            "category": item.get("category"),
            "title_tr": item.get("title_tr"),
            "title_en": item.get("title_en"),
            "short_tr": item.get("short_tr"),
            "short_en": item.get("short_en"),
            "tags": item.get("tags") or item.get("tags_tr") or [],
            "tags_tr": item.get("tags_tr", []),
            "tags_en": item.get("tags_en", []),
            "engine_hint": item.get("engine_hint"),
            "status": final_status,
            "implementation": {
                "module": module_name,
                "func": func_name,
                "status": final_status,
            },
            # Mini kullanım kılavuzu (LLM ile üretmiştik)
            "help_tr": item.get("help_tr") or {},
        }

        if runner is not None:
            scenario["runner"] = runner

        scenarios[sid] = scenario

    return scenarios


def _ensure_loaded() -> None:
    global SCENARIOS
    if not SCENARIOS:
        SCENARIOS = _build_scenarios()


def get_scenario(scenario_id: str) -> Dict[str, Any]:
    """
    Çalıştırmak istediğimiz senaryonun tam tanımını (runner dahil) döner.
    """
    _ensure_loaded()
    scenario = SCENARIOS.get(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Senaryo bulunamadı: {scenario_id}")

    if "runner" not in scenario:
        # UI yine de bunu listeleyebilir ama /run'da hata alsın:
        raise HTTPException(
            status_code=400,
            detail=f"Bu senaryo henüz çalıştırılabilir durumda değil: {scenario_id}",
        )

    return scenario


def list_scenarios() -> List[Dict[str, Any]]:
    """
    Frontend için senaryoların özet listesini döner.
    Burada mini kılavuzu da (help_tr) veriyoruz ki sağdaki rehber kartı doldurulabilsin.
    """
    _ensure_loaded()
    items: List[Dict[str, Any]] = []

    # ID'ye göre sıralı gitsin (istersen kategori + başlık bazlı da yapabiliriz)
    for sid in sorted(SCENARIOS.keys()):
        s = SCENARIOS[sid]
        items.append(
            {
                "id": s["id"],
                "category": s.get("category"),
                "title_tr": s.get("title_tr"),
                "title_en": s.get("title_en"),
                "short_tr": s.get("short_tr"),
                "short_en": s.get("short_en"),
                "tags": s.get("tags", []),
                "status": s.get("status"),
                # Yeni: mini kullanım kılavuzu
                "help_tr": s.get("help_tr") or {},
            }
        )
    return items
