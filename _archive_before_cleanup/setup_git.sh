#!/bin/bash
echo "opradox GitHub Kurulumu Basliyor..."

# 1. Kimlik Tanimlama
git config --global user.email "opradox@example.com"
git config --global user.name "opradoxAdmin"

# 2. Paketleme
git add .
git commit -m "Ilk yukleme"

# 3. Gonderme
git branch -M main
git remote remove origin
git remote add origin https://github.com/zyganali-glitch/opradox.git
git push -u origin main

echo "Islem Tamamlandi!"
read -p "Cikmak icin Enter'a basin..."
