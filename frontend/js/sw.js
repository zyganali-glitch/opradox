// =====================================================
// SERVICE WORKER - Opradox VIZ PWA
// Basic cache-first strategy for offline support
// FAZ-10: Version bump for stats/adapters/ui updates
// =====================================================

const CACHE_NAME = 'opradox-viz-v4';
const ASSETS_TO_CACHE = [
    '/viz.html',
    '/js/viz.js',
    '/js/adapters.js',
    '/js/modules/core.js',
    '/js/modules/ui.js',
    '/js/modules/data.js',
    '/js/modules/charts.js',
    '/js/modules/stats.js',
    '/js/modules/advanced.js',
    '/js/modules/preview.js',
    '/js/modules/texts.js',
    '/css/viz.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                    console.warn('[SW] Some assets failed to cache:', err);
                    // Continue even if some assets fail
                    return Promise.resolve();
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip non-http(s) requests
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, networkResponse));
                            }
                        })
                        .catch(() => { }); // Ignore network errors for background update

                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then(networkResponse => {
                        // Cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.warn('[SW] Fetch failed:', error);
                        // Return offline fallback if available
                        return caches.match('/viz.html');
                    });
            })
    );
});

// Message handler for manual cache control
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
            event.ports[0].postMessage({ success: true });
        });
    }

    if (event.data && event.data.type === 'UPDATE_CACHE') {
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => {
                console.log('[SW] Cache updated');
                event.ports[0].postMessage({ success: true });
            });
    }
});

console.log('[SW] Service worker loaded');
