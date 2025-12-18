import pandas as pd

# Veriyi yükle
df = pd.read_excel('yks_tablo4_2025.xlsx', header=2)

# Sütun isimlerini al
print("Orijinal sütunlar:", list(df.columns)[:6])

# En Küçük Puan sütununu bul
puan_col = [c for c in df.columns if 'Puan' in c and 'K' in c][0] if any('Puan' in c for c in df.columns) else df.columns[8]
uni_adi_col = df.columns[2]
program_col = df.columns[4]
uni_turu_col = df.columns[1]

print(f"Puan sütunu: {puan_col}")
print(f"Üniversite Adı: {uni_adi_col}")
print(f"Program Adı: {program_col}")
print(f"Üniversite Türü: {uni_turu_col}")

# En Küçük Puan sayısal yap
df[puan_col] = pd.to_numeric(df[puan_col], errors='coerce')

# Tıp programlarını bul (tam eşleşme veya yakın)
tip_programlar = df[df[program_col].astype(str).str.strip().str.lower().str.match(r'^t[ıi]p$', na=False)]
print(f"\nToplam 'Tıp' programı: {len(tip_programlar)}")

# Alternatif: Encoding sorunlarına karşı
if len(tip_programlar) == 0:
    tip_programlar = df[df[program_col].astype(str).str.contains('p$', regex=True, na=False) & 
                         df[program_col].astype(str).str.len() < 5]
    print(f"Alternatif arama sonucu: {len(tip_programlar)}")

# İKÇÜ Tıp'ı bul
ikcu_tip = tip_programlar[tip_programlar[uni_adi_col].astype(str).str.contains('Katip', case=False, na=False)]
print(f"\nİKÇÜ Tıp satır sayısı: {len(ikcu_tip)}")

if len(ikcu_tip) > 0:
    ikcu_row = ikcu_tip.iloc[0]
    ikcu_puan = ikcu_row[puan_col]
    ikcu_tur = ikcu_row[uni_turu_col]
    
    print(f"İKÇÜ Tıp puanı: {ikcu_puan}")
    print(f"İKÇÜ Üniversite türü: {ikcu_tur}")
    
    # TÜM Tıp programları içinde sıra (yüksek puan = düşük sıra)
    tum_sira = (tip_programlar[puan_col] > ikcu_puan).sum() + 1
    print(f"\n=== TÜM TIP PROGRAMLARI İÇİNDE SIRA: {tum_sira} / {len(tip_programlar)} ===")
    
    # DEVLET Tıp programları içinde sıra
    devlet_tip = tip_programlar[tip_programlar[uni_turu_col] == ikcu_tur]
    devlet_sira = (devlet_tip[puan_col] > ikcu_puan).sum() + 1
    print(f"=== {ikcu_tur} TIP PROGRAMLARI İÇİNDE SIRA: {devlet_sira} / {len(devlet_tip)} ===")
    
    # Top 5 ve İKÇÜ civarı
    tip_sorted = tip_programlar.sort_values(puan_col, ascending=False).reset_index(drop=True)
    tip_sorted['SIRA'] = range(1, len(tip_sorted)+1)
    
    print("\n--- EN YÜKSEK PUANLI 5 TIP PROGRAMI ---")
    print(tip_sorted[[uni_adi_col, program_col, puan_col, uni_turu_col, 'SIRA']].head(5).to_string())
    
    # İKÇÜ'nün sırası civarındaki programlar
    ikcu_idx = tip_sorted[tip_sorted[uni_adi_col].astype(str).str.contains('Katip', case=False, na=False)].index[0]
    start = max(0, ikcu_idx - 2)
    end = min(len(tip_sorted), ikcu_idx + 3)
    
    print(f"\n--- İKÇÜ CİVARI (sıra {ikcu_idx+1}) ---")
    print(tip_sorted[[uni_adi_col, program_col, puan_col, uni_turu_col, 'SIRA']].iloc[start:end].to_string())
