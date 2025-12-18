"""Quick test for PRO scenario API"""
import requests

try:
    r = requests.get('http://127.0.0.1:8000/ui/menu?lang=tr')
    d = r.json()
    rp = d.get('categories', {}).get('reporting_pivot', [])
    
    print("=== Reporting/Pivot Kategorisindeki Senaryolar ===")
    for s in rp[:5]:
        marker = "★ PRO" if 'pro' in s.get('id', '').lower() else ""
        print(f"  {marker} {s['id']}: {s['title']}")
    
    # PRO var mı?
    pros = [s for s in rp if 'pro' in s.get('id', '').lower()]
    if pros:
        print(f"\n✓ PRO senaryo bulundu: {pros[0]['id']}")
        print(f"  Params type: {pros[0].get('params', [{}])[0].get('type', 'N/A')}")
    else:
        print("\n✗ PRO senaryo bulunamadı!")
        
except Exception as e:
    print(f"Hata: {e}")
