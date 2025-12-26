// =====================================================
// OPRADOX VISUAL STUDIO - Service Worker v3 (Conductor Plan)
// =====================================================

const CACHE_NAME = 'opradox-viz-v3-final';
const ASSETS_TO_CACHE = [
    // Ana Sayfalar
    './',
    './index.html',
    
    // Stiller (Varsa CSS klasöründekiler)
    './css/style.css', 
    // Not: Eğer başka CSS dosyan varsa buraya ekle

    // BİZİM YENİ MODÜLLER (Conductor Planına Uygun)
    './js/modules/core.js',
    './js/modules/ui.js',
    './js/modules/data.js',
    './js/modules/preview.js', // O son eklediğimiz kritik dosya
    './js/modules/charts.js',
    './js/modules/stats.js',
    './js/modules/advanced.js',
    
    // Kaynak Dosya (Geliştirme için gerekebilir, opsiyonel)
    // './viz_SOURCE.js' 
];

// 1. KURULUM (Dosyaları Önbelleğe Al)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Dosyalar önbelleğe alınıyor...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 2. AKTİF OLMA (Eski Cache'leri Temizle)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Eski önbellek temizlendi:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. FETCH (İnternet yoksa Cache'den ver)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache'de varsa onu ver, yoksa internetten çek
                return response || fetch(event.request);
            })
    );
});