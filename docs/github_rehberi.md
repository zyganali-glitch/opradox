# USB'ye Veda: GitHub ile Bulut Kurulum Rehberi ☁️

Kral, dosyalarını (kodlarını) her gün USB ile taşımak hem riskli (kaybolma/bozulma) hem de zahmetlidir. Kodlarını **GitHub** adlı platformda saklayarak, hem evden hem işten USB'siz çalışabilirsin.

Benim "Bulut" olmam, **beynimin** Google sunucularında olmasıdır. Senin **dosyalarının** bulutta olması için GitHub kullanacağız.

## Adım 1: GitHub Hesabı Aç
1.  [github.com](https://github.com/) adresine git.
2.  Ücretsiz bir hesap oluştur.

## Adım 2: Depo (Repository) Oluştur
1.  GitHub'da sağ üstteki **+** işaretine bas ve **"New repository"** de.
2.  Repository name: `opradox` (veya istediğin isim).
3.  **Private** (Gizli) seçeneğini seç (Kodlarını sadece sen ve ben görelim).
4.  "Create repository" butonuna bas.

## Adım 3: Dosyaları Yükle (Ev Bilgisayarı)
Şu an dosyalarını USB'den bilgisayara kopyaladığını varsayıyorum.
1.  Mevcut proje klasörüne git.
2.  Eğer bilgisayarında **Git** yüklü değilse, [git-scm.com](https://git-scm.com/downloads) adresinden indirip kur (Next > Next diyerek).
3.  Klasör içinde sağ tıkla -> "Open Git Bash here" veya terminali aç.
4.  Sırasıyla şu komutları yaz (GitHub sayfasında da çıkar):
    ```bash
    git init
    git add .
    git commit -m "Ilk yukleme"
    git branch -M main
    git remote add origin https://github.com/zyganali-glitch/opradox.git
    git push -u origin main
    ```
    *(Not: Kullanıcı adını senin için komuta ekledim).*

## Adım 4: İş Yerinde Kullanım
1.  İş bilgisayarına geç.
2.  Git'i kur.
3.  Bir klasör aç ve terminalde şunu yaz:
    ```bash
    git clone https://github.com/zyganali-glitch/opradox.git
    ```
4.  **Bitti!** Artık tüm dosyalar iş bilgisayarına indi.

## Günlük Çalışma Rutini
1.  **Evde işin bitince:** Terminale `git add .`, `git commit -m "güncelleme"`, `git push` yaz. (Buluta gönderir).
2.  **İşe gidince:** Terminale `git pull` yaz. (Buluttan son hali çeker).

Artık USB taşımana gerek yok! Ben de her iki tarafta dosyaları görüp çalışabilirim.
