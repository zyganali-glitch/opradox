# opradox - Bulut Çalışma Rehberi (Windows Uyumlu)

Kral, işleri senin için Windows'a özel hale getirdim. Artık kod yazmana gerek yok, sadece bu iki durumu bilmen yeterli.

## 🟢 Durum 1: İşe veya Eve Yeni Geldin (İşi Başlat)
Bilgisayarı açtın, kahveni aldın. Çalışmaya başlamadan önce güncel hali çekmek için:

1. **Terminali aç** (opradox klasöründe).
2. Şu komutu yaz ve Enter'a bas:
   ```powershell
   git pull
   ```
   *(Bitti! Artık en güncel haldesin.)*

## 🔴 Durum 2: Gün Bitti, Çıkıyorsun (İşi Kaydet)
Bugünkü tüm çalışmalarını (kodlar + hafızamdaki planlar) tek tuşla kaydetmek için:

1. **Terminali aç**.
2. Şu komutu yaz ve Enter'a bas:
   ```cmd
   save_work.bat
   ```
   *(Ekranda "ISLEM TAMAMLANDI" yazana kadar bekle.)*

> **Not:** Bu komut arka planda benim sana hazırladığım `task.md` gibi hafıza dosyalarını da `documentation/memory` klasörüne yedekler. Böylece diğer bilgisayarda planlarımızı da görürsün.

## 🔵 Durum 3: Sıfır Bilgisayar (İlk Kurulum)
Evdeki bilgisayarda hiç proje yoksa:
1. `Git` yüklü olduğundan emin ol.
2. Terminali aç ve:
   ```powershell
   git clone https://github.com/zyganali-glitch/opradox.git
   ```
3. Klasörün içine girip çalışmaya başla.
