#!/bin/bash
echo "Dokumanlar GitHub'a yukleniyor..."

# 1. Dokuman klasoru olustur
mkdir -p documentation

# 2. Dosyalari kopyala (Git Bash uyumlu yol)
# Not: Space karakteri oldugu icin tirnak icinde kullaniyoruz.
SOURCE_DIR="/c/Users/ASUS 6410/.gemini/antigravity/brain/b5352580-741d-429a-8040-7be44ae5c847"

cp "$SOURCE_DIR/task.md" documentation/
cp "$SOURCE_DIR/ui_design.md" documentation/
cp "$SOURCE_DIR/github_rehberi.md" documentation/
cp "$SOURCE_DIR/zaman_cizelgesi.md" documentation/
cp "$SOURCE_DIR/fikirler_ve_isimler.md" documentation/

# 3. Git'e ekle ve gonder
git add documentation/
git commit -m "Proje dokumanlari eklendi (Planlar, Cizelgeler)"
git push

echo "Dokumanlar basariyla yuklendi!"
read -p "Cikmak icin Enter'a basin..."
