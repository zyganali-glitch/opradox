import os
import ast
import importlib.util
from pathlib import Path

# Yollar
ROOT_DIR = Path(__file__).resolve().parents[1]
SCENARIOS_DIR = ROOT_DIR / "app" / "scenarios"

def check_file(file_path):
    """
    Dosyanın Python sözdizimine uygun olup olmadığını ve 'run' fonksiyonunu içerip içermediğini kontrol eder.
    """
    try:
        content = file_path.read_text(encoding="utf-8")
        if not content.strip():
            return "BOŞ DOSYA"
        
        tree = ast.parse(content)
        
        has_run = False
        params_found = []
        
        for node in ast.walk(tree):
            # run fonksiyonu var mı?
            if isinstance(node, ast.FunctionDef) and node.name == "run":
                has_run = True
            
            # Parametre kullanımlarını yakala (params.get veya params['...'])
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute) and getattr(node.func.value, 'id', '') == 'params' and node.func.attr == 'get':
                    if node.args and isinstance(node.args[0], ast.Constant):
                         params_found.append(node.args[0].value)
            elif isinstance(node, ast.Subscript):
                if getattr(node.value, 'id', '') == 'params' and isinstance(node.slice, ast.Constant):
                     params_found.append(node.slice.value)

        if not has_run:
            return "FONKSİYON EKSİK (run yok)"
            
        return f"OK (Parametreler: {len(set(params_found))})"

    except SyntaxError as e:
        return f"SÖZDİZİMİ HATASI: {e.msg} (Satır: {e.lineno})"
    except Exception as e:
        return f"OKUMA HATASI: {str(e)}"

def main():
    print("🕵️  opradox Senaryo Denetçisi Başlatılıyor...\n")
    
    if not SCENARIOS_DIR.exists():
        print(f"❌ Klasör bulunamadı: {SCENARIOS_DIR}")
        return

    files = list(SCENARIOS_DIR.glob("*.py"))
    files.sort()
    
    report = {"OK": 0, "ERROR": 0}
    
    print(f"{'DURUM':<35} | {'DOSYA ADI'}")
    print("-" * 60)
    
    for f in files:
        if f.name.startswith("__") or f.name.startswith("app."): continue
        
        status = check_file(f)
        
        if "OK" in status:
            report["OK"] += 1
            icon = "✅"
        else:
            report["ERROR"] += 1
            icon = "❌"
            
        print(f"{icon} {status:<32} | {f.name}")

    print("-" * 60)
    print(f"TOPLAM: {len(files)} | SAĞLAM: {report['OK']} | BOZUK: {report['ERROR']}")
    
    if report["ERROR"] > 0:
        print("\n⚠️  ÖNERİ: Bozuk dosyalar tespit edildi. Tamir scriptini çalıştırmalısın.")
    else:
        print("\n🎉 Tebrikler! Tüm motorlar sağlam görünüyor.")

if __name__ == "__main__":
    main()
