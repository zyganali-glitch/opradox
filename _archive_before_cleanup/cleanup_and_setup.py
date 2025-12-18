
import os
import sys

# Silinecek dosyalar listesi
FILES_TO_DELETE = [
    "opradox_master.py",
    "opradox_master_manifest_v2_final.py",
    "opradox_master_manifest_v3.py",
    "gm_ui_patcher.py",
    "opradox_diagnose.py",
    "opradox_fixengine.py",
    "backend/tools/llm_client.py",
    "backend/tools/build_with_ai.py",
    "backend/tools/generate_scenarios_from_catalog.py"
]

def cleanup():
    print(">>> opradox Temizligi Basliyor...")
    cwd = os.getcwd()
    print(f"Calisma dizini: {cwd}")

    for file_path in FILES_TO_DELETE:
        full_path = os.path.join(cwd, file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
                print(f"[SILINDI] {file_path}")
            except Exception as e:
                print(f"[HATA] {file_path} silinemedi: {e}")
        else:
            print(f"[YOK] {file_path} zaten yok.")

def create_run_script():
    run_py_content = """
import uvicorn

if __name__ == "__main__":
    print(">>> opradox 2.0 Baslatiliyor...")
    print(">>> Tarayicidan http://localhost:8100 adresine gidin.")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8100, reload=True)
"""
    with open("run.py", "w", encoding="utf-8") as f:
        f.write(run_py_content.strip())
    print("[OLUSTURULDU] run.py")

if __name__ == "__main__":
    cleanup()
    create_run_script()
