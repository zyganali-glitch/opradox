import pandas as pd

# Veriyi yükle
df = pd.read_excel('yks_tablo4_2025.xlsx', header=2)

# Sütun isimleri
print("Sütunlar:", list(df.columns)[:6])

puan_col = df.columns[8]  # En Küçük Puan
uni_adi_col = df.columns[2]
program_col = df.columns[4]
uni_turu_col = df.columns[1]

# En Küçük Puan sayısal yap
df[puan_col] = pd.to_numeric(df[puan_col], errors='coerce')

# SENARYO 1: Partition = sadece "Program Adı" 
# Bu, TÜM üniversitelerdeki aynı isimli programları bir grupta toplar
df['TumSira'] = df.groupby(program_col)[puan_col].rank(method='min', ascending=False)

# SENARYO 2: Partition = "Program Adı" + "Üniversite Türü"
# Bu, her üniversite TÜRÜ için ayrı grup yapar (DEVLET Tıp ayrı, VAKIF Tıp ayrı)
df['TurSira'] = df.groupby([program_col, uni_turu_col])[puan_col].rank(method='min', ascending=False)

# İKÇÜ Tıp'ı bul
tip_mask = df[program_col].astype(str).str.strip().str.lower().str.match(r'^t[ıi]p$', na=False)
ikcu_mask = df[uni_adi_col].astype(str).str.contains('Katip', case=False, na=False)

ikcu_tip = df[tip_mask & ikcu_mask]

print("\n=== İKÇÜ TIP SONUÇLARI ===")
print(ikcu_tip[[uni_adi_col, program_col, puan_col, uni_turu_col, 'TumSira', 'TurSira']].to_string())

# Tüm Tıp programlarını göster
tip_all = df[tip_mask].sort_values(puan_col, ascending=False)
print(f"\nToplam Tıp programı: {len(tip_all)}")
print(f"DEVLET Tıp: {len(tip_all[tip_all[uni_turu_col] == 'DEVLET'])}")
print(f"VAKIF Tıp: {len(tip_all[tip_all[uni_turu_col] == 'VAKIF'])}")

# Peki 67 nereden geliyor? Belki başka bir programla karışıyor
# İKÇÜ'nün tüm programlarında 67 olan var mı?
ikcu_all = df[ikcu_mask]
has_67 = ikcu_all[ikcu_all['TurSira'] == 67]
print("\n=== İKÇÜ'de TürSıra = 67 olan satırlar ===")
if len(has_67) > 0:
    print(has_67[[uni_adi_col, program_col, puan_col, uni_turu_col, 'TumSira', 'TurSira']].to_string())
else:
    print("Bulunamadı")

# İKÇÜ tüm programları göster
print("\n=== İKÇÜ TÜM PROGRAMLARI (ilk 10) ===")
print(ikcu_all[[uni_adi_col, program_col, puan_col, 'TumSira', 'TurSira']].head(10).to_string())
