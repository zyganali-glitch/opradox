import pandas as pd

df = pd.read_excel('yks_tablo4_2025.xlsx', header=2)

# Gerçek sütun isimleri
print('=== GERCEK SUTUN ISIMLERI ===')
for i, col in enumerate(df.columns[:10]):
    print(f'{i}: {repr(col)}')

# Partition parsing test
test_input = 'Program Adı, Üniversite Türü'
parsed = [x.strip() for x in test_input.split(',')]
print(f'\nParsed partition: {parsed}')

# Eşleşme kontrolü
for p in parsed:
    if p in df.columns:
        print(f'  OK: [{p}] bulundu')
    else:
        print(f'  HATA: [{p}] BULUNAMADI!')
        # Benzer sütun var mı?
        for col in df.columns:
            if 'niversite' in col.lower() or 'rogram' in col.lower():
                print(f'    Benzer: {repr(col)}')

# Test: Partition ile RANK hesapla
puan_col = df.columns[8]
program_col = df.columns[4]
uni_turu_col = df.columns[1]

print(f'\nKullanilacak sutunlar:')
print(f'  Puan: {repr(puan_col)}')
print(f'  Program: {repr(program_col)}')
print(f'  UniTuru: {repr(uni_turu_col)}')

# Sayısal yap
df[puan_col] = pd.to_numeric(df[puan_col], errors='coerce')

# RANK hesapla - [Program, UniTuru] partition ile
df['TurSira'] = df.groupby([program_col, uni_turu_col])[puan_col].rank(method='min', ascending=False)

# İKÇÜ Tıp sonucu
uni_adi_col = df.columns[2]
tip_mask = df[program_col].astype(str).str.strip().str.lower().str.match(r'^t[ıi]p$', na=False)
ikcu_mask = df[uni_adi_col].astype(str).str.contains('Katip', case=False, na=False)

ikcu_tip = df[tip_mask & ikcu_mask]
print('\n=== IKCU TIP SONUCU ===')
print(ikcu_tip[[uni_adi_col, program_col, puan_col, uni_turu_col, 'TurSira']].to_string())
