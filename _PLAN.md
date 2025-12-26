# REFACTORING PLAN

Durum: [ ] Başlamadı
Hedef: Parçala ve Yönet

## ADIM 1: CORE Modülü
- [ ] `viz_SOURCE.js`'den `VIZ_STATE`, `VIZ_TEXTS` ve `init` fonksiyonlarını al.
- [ ] `js/modules/core.js` oluştur.
- [ ] `window` atamalarını kontrol et.

## ADIM 2: UI Modülü
- [ ] UI helper fonksiyonlarını `viz_SOURCE.js`'den çek.
- [ ] `js/modules/ui.js` oluştur.

## ADIM 2.5: PREVIEW Modülü (EKLENECEK KISIM)
- [ ] Dosya önizleme ve onaylama mantığını (`loadFileWithPreview`, `showFilePreviewModal`, `renderPreviewTable` vb.) çek.
- [ ] `js/modules/preview.js` oluştur.

## ADIM 3: DATA Modülü
- [ ] Dosya yükleme ve veri işleme fonksiyonlarını çek.
- [ ] `js/modules/data.js` oluştur.

## ADIM 4: CHARTS Modülü
- [ ] Grafik ve ECharts yönetimini çek.
- [ ] `js/modules/charts.js` oluştur.

## ADIM 5: STATS Modülü
- [ ] İstatistik ve API mantığını çek.
- [ ] `js/modules/stats.js` oluştur.

## ADIM 6: BİRLEŞTİRME
- [ ] `index.html` dosyasında `<script src="viz.js">` yerine yeni modülleri sırasıyla ekle.
- [ ] Test et.