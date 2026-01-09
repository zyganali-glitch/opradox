# FAZ-MS-0: Macro Studio Pro Kanıtlı Audit Raporu

**Tarih:** 2026-01-09  
**Amaç:** Neden çalışmadığını kanıt ile belirlemek (KOD DEĞİŞİKLİĞİ YOK)

---

## 🔴 KÖK NEDEN (ROOT CAUSE)

**Tek Cümle:** `macro-studio-pro` senaryosu backend'de runner modülü olmadığı için yüklenemiyor VE frontend'de `app.js` bu senaryo için özel UI renderer'ı (`MacroStudio.initWithinExcel`) çağırmıyor.

---

## 📋 CHECKLIST SONUÇLARI

### ✅ 1. macro-studio-pro senaryo seçilince hangi UI renderer tetikleniyor?

| Kaynak | Kanıt |
|--------|-------|
| `scenarios_catalog.json` L14-22 | `"type": "macro_builder_pro"` param tipi tanımlanmış |
| `app.js` | **BULUNAMADI** - grep `macro_builder_pro` = 0 sonuç |
| **SONUÇ** | ❌ `app.js`'de `macro_builder_pro` param tipi için **hiçbir handler yok** |

**AÇIKLAMA:** `custom-report-builder-pro` senaryosu `json_builder_pro` tipini kullanıyor ve `app.js` bunu `visualBuilder.js` ile render ediyor. Ancak `macro_builder_pro` tipi için karşılık gelen handler bulunmuyor.

---

### ✅ 2. Macro UI'nin beklediği DOM container ID'ler mevcut mu?

| Container ID | `excel.html`'de Var mı? |
|-------------|------------------------|
| `dynamicFormContainer` | ✅ Evet (L254) |
| `macroPipelinePalette` | ❌ **HAYIR** - sadece `macroStudio.js` tarafından dinamik oluşturuluyor |
| `macroPipelineCanvas` | ❌ **HAYIR** - sadece `macroStudio.js` tarafından dinamik oluşturuluyor |
| `macroPipelineSettings` | ❌ **HAYIR** - sadece `macroStudio.js` tarafından dinamik oluşturuluyor |

**AÇIKLAMA:** `macroStudio.js` → `renderEmbeddedUI()` (L254-379) kendi DOM elementlerini `container.innerHTML = ...` ile oluşturuyor, ancak bu fonksiyon hiç çağrılmıyor.

---

### ✅ 3. Macro Studio init fonksiyonu hangi koşulda çalışıyor?

| Fonksiyon | Koşul | Kanıt |
|-----------|-------|-------|
| `MacroStudio.init()` | Auto-init → DOMContentLoaded | `macroStudio.js` L750-754 |
| `MacroStudio.initWithinExcel(containerId, scenarioId)` | **HİÇBİR ZAMAN ÇAĞRILMIYOR** | grep `initWithinExcel` in `app.js` = 0 sonuç |

**AÇIKLAMA:** `macroStudio.js` DOMContentLoaded'da `init()` çağırıyor ama bu standalone mod için. Embedded mode için `initWithinExcel()` gerekiyor ve `app.js`'den senaryo seçildiğinde çağrılması lazım.

---

### ✅ 4. Macro Doctor çağrısı isim uyuşmazlığı var mı?

| Beklenen | Gerçek | Kanıt |
|----------|--------|-------|
| `MacroDoctor.analyze()` | `MacroDoctor.analyzeFile()` | `macroDoctor.js` L125 → `async function analyzeFile()` |
| Window export | `analyze: analyzeFile` değil, `analyzeFile` direkt | `macroDoctor.js` L738-747 |

```javascript
// macroDoctor.js L738-747
window.MacroDoctor = {
    init,
    analyzeFile,  // ✅ Doğru
    toggleModuleCode,
    getState: () => DOCTOR_STATE,
    ...
};
```

**SONUÇ:** ✅ İsim uyuşmazlığı yok, `MacroDoctor.analyzeFile()` doğru.

---

### ✅ 5. app.js backend'e hangi endpoint ile gidiyor?

| Senaryo | Endpoint | Kanıt |
|---------|----------|-------|
| Normal senaryolar | `/run/{scenarioId}` | `main.py` L192 |
| macro-studio-pro (pipeline) | `/api/scenario/run` | `scenario_api.py` L87 |

**AÇIKLAMA:** `scenario_api.py`'de unified runner mevcut (`/api/scenario/run`) ve `macro-studio-pro` + `mode=build` için `custom_report_builder_pro.run()` çağırıyor. Ancak frontend bu endpoint'i kullanmıyor.

---

### ✅ 6. Backend'de macro-studio-pro için gerçek runner var mı?

| Dosya | Durum |
|-------|-------|
| `backend/app/scenarios/macro_studio_pro.py` | ❌ **DOSYA YOK** |
| `scenarios_catalog.json` L11 | `"module": "app.scenarios.macro_studio_pro"` |
| `scenario_registry.py` import | **FAIL** → runner = None, status = "broken" |

```
# Terminal çıktısı (beklenen):
[SCENARIO ERROR] macro-studio-pro senaryosu yüklenirken hata: No module named 'app.scenarios.macro_studio_pro'
```

**SONUÇ:** ❌ **Backend runner dosyası mevcut değil.** Bu yüzden senaryo "broken" olarak işaretleniyor.

---

### ✅ 7. "Veri kaynağı okunmuyor" şikâyetinin zincir analizi

```
Dosya State (frontend)
    ↓ ❌ KOPMA NOKTASI #1
Scenario Config (macro_builder_pro handler yok)
    ↓ ❌ KOPMA NOKTASI #2  
MacroStudio.initWithinExcel() hiç çağrılmıyor
    ↓ ❌ KOPMA NOKTASI #3
POST formData (endpoint yanlış veya hiç gönderilmiyor)
    ↓ ❌ KOPMA NOKTASI #4
Runner (macro_studio_pro.py yok)
    ↓
Motor (çalışamıyor)
```

**KOPMA NOKTASI DETAYLARI:**

1. **#1 - Param Handler Eksik:** `app.js`'de `macro_builder_pro` tipi için render logic yok
2. **#2 - UI Mount Eksik:** `initWithinExcel()` fonksiyonu mevcut ama hiç çağrılmıyor
3. **#3 - Endpoint Uyumsuzluğu:** Frontend `/run/macro-studio-pro` kullanıyor, backend bu senaryoyu "broken" olarak görüyor
4. **#4 - Runner Eksik:** `macro_studio_pro.py` dosyası hiç oluşturulmamış

---

## 🔧 TAMİR PLANI (FAZ REFERANSLI)

### FAZ-MS-1: Backend Runner Stub Oluştur
- [ ] `backend/app/scenarios/macro_studio_pro.py` dosyası oluştur
- [ ] `custom_report_builder_pro.run()` fonksiyonuna proxy olarak yönlendir
- [ ] Scenario registry'de "implemented" olarak yüklendiğini doğrula

### FAZ-MS-2: Frontend Param Handler Ekle
- [ ] `app.js`'de `macro_builder_pro` param tipi için handler ekle
- [ ] `dynamicFormContainer` içine `MacroStudio.initWithinExcel()` çağrısı yap
- [ ] Mevcut file upload state'ini MacroStudio'ya aktar

### FAZ-MS-3: Scenario API Entegrasyonu
- [ ] `macroPipeline.js` → `run()` fonksiyonunda `/api/scenario/run` endpoint'i kullan
- [ ] Request body'yi `ScenarioRunRequest` formatına uygun hazırla

### FAZ-MS-4: End-to-End Test
- [ ] Senaryo listesinden `macro-studio-pro` seç
- [ ] UI'ın doğru render olduğunu doğrula
- [ ] Pipeline block ekle ve çalıştır

---

## 📊 KANIT ÖZETİ

| Kontrol | Durum | Kritiklik |
|---------|-------|-----------|
| Backend runner dosyası | ❌ YOK | 🔴 Kritik |
| Frontend param handler | ❌ YOK | 🔴 Kritik |
| initWithinExcel çağrısı | ❌ YOK | 🔴 Kritik |
| Unified scenario API | ✅ VAR | ✅ OK |
| MacroDoctor isim | ✅ DOGRU | ✅ OK |
| Pipeline block definitions | ✅ VAR | ✅ OK |
| DOM containers (static) | ❌ YOK | 🟡 Orta |

---

## 📁 KORUNAN DOSYALAR (HASH ÖNCESİ SNAPSHOT)

Bu dosyalar FAZ-MS-0'da **hiç değiştirilmedi** (readonly audit):

| Dosya | Boyut | Durum |
|-------|-------|-------|
| `backend/app/custom_report_builder_pro.py` | 112,811 bytes | ✅ DOKUNULMADI |
| `backend/app/vba_analyzer.py` | (mevcut) | ✅ DOKUNULMADI |
| `frontend/js/toast.js` | (mevcut) | ✅ DOKUNULMADI |
| `frontend/js/queueModal.js` | (mevcut) | ✅ DOKUNULMADI |
| `frontend/js/queueClient.js` | (mevcut) | ✅ DOKUNULMADI |

---

**FAZ-MS-0 COMPLETE ✅**  
*Sonraki Adım: FAZ-MS-1 - Backend Runner Stub*
