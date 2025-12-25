# Opradox - Gelişmiş Veri İşleme Platformu
> Advanced Data Processing Platform

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-red.svg)](https://fastapi.tiangolo.com)

## 🎯 Özellikler / Features

### Excel Studio
- 85+ senaryo (scenario) ile Excel işleme
- Pivot tablolar, koşullu biçimlendirme
- Formül ve hesaplama desteği
- Çoklu sayfa (multi-sheet) çıktı

### Visual Studio
- 15+ grafik tipi (2D ve 3D)
- 23 istatistiksel analiz
- Gerçek zamanlı dashboard
- Cross-filtering ve drill-down

### PDF Tools
- PDF birleştirme / bölme
- Metin/OCR çıkarma
- Sayfa yönetimi

### OCR Lab
- Görüntüden metin çıkarma
- Çoklu dil desteği

---

## 🚀 Kurulum / Installation

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run build:viz  # Bundle oluştur
```

Tarayıcıda: `http://localhost:8000`

---

## 🧪 Testler / Tests

### Backend (pytest)
```bash
cd backend
pytest                    # Tüm testler
pytest tests/ -v          # Detaylı
pytest --cov=app          # Coverage ile
```

### Frontend (Jest - kurulum gerekli)
```bash
cd frontend
npm test
```

---

## 📁 Proje Yapısı / Structure

```
opradox/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry
│   │   ├── routers/          # API endpoints
│   │   ├── scenarios/        # 85+ işlem senaryosu
│   │   └── engines/          # Modüler motorlar
│   └── tests/                # pytest testleri
├── frontend/
│   ├── css/                  # Stiller
│   ├── js/
│   │   ├── app.js            # Ana uygulama
│   │   ├── viz.js            # Visual Studio
│   │   └── viz/              # Modüler yapı
│   ├── index.html            # Ana sayfa
│   └── viz.html              # Dashboard
└── README.md
```

---

## 🌐 API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/scenarios` | GET | Tüm senaryolar |
| `/process` | POST | Excel işleme |
| `/viz/data` | POST | Dashboard veri yükleme |
| `/viz/stats/*` | POST | İstatistiksel analizler |

Swagger UI: `http://localhost:8000/docs`

---

## 🌍 Dil Desteği / Localization

Tüm mesajlar TR/EN destekli:
```javascript
getText('err_file_load')  
// TR: "Dosya yüklenemedi"
// EN: "Failed to load file"
```

---

## 📊 Analytics

Google Analytics entegre. Admin panelinden erişilebilir.

---

## 📜 Lisans / License

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

**Opradox Team** © 2024
