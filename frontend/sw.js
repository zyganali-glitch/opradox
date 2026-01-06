// =====================================================
// OPRADOX VISUAL STUDIO - Service Worker v6
// FAZ-SW-1: Resilient offline caching with correct assets
// FAZ-2B: Added app.js, visualBuilder.js, favicon.ico per audit
// =====================================================

const CACHE_NAME = 'opradox-viz-v6';

// Actual project files - verified against project structure
const ASSETS_TO_CACHE = [
    // Pages
    '/viz.html',

    // Stylesheets (verified: css/style.css, css/viz_fixes.css)
    '/css/style.css',
    '/css/viz_fixes.css',

    // Core JS (FAZ-2B: Added app.js, visualBuilder.js)
    '/js/app.js',
    '/js/adapters.js',
    '/js/visualBuilder.js',
    '/js/toast.js',
    '/js/fileDocker.js',
    '/js/selftest.js',

    // ES6 Modules
    '/js/modules/core.js',
    '/js/modules/ui.js',
    '/js/modules/data.js',
    '/js/modules/charts.js',
    '/js/modules/stats.js',
    '/js/modules/advanced.js',
    '/js/modules/preview.js',
    '/js/modules/texts.js',

    // PWA Manifest & Icons
    '/manifest.json',
    '/favicon.ico'
];

// =====================================================
// 1. INSTALL - Resilient caching (Promise.allSettled)
// =====================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v5...');

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            let successCount = 0;
            let failCount = 0;
            const failedAssets = [];

            // Use Promise.allSettled to continue even if some assets fail
            const results = await Promise.allSettled(
                ASSETS_TO_CACHE.map(async (url) => {
                    try {
                        const response = await fetch(url, { cache: 'no-cache' });
                        if (response.ok) {
                            await cache.put(url, response);
                            return { url, success: true };
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (err) {
                        return { url, success: false, error: err.message };
                    }
                })
            );

            // Count results
            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successCount++;
                } else {
                    failCount++;
                    const failedUrl = result.status === 'fulfilled'
                        ? result.value.url
                        : 'unknown';
                    failedAssets.push(failedUrl);
                }
            });

            console.log(`[SW] Cache updated: ${successCount} assets cached, ${failCount} failed`);
            if (failedAssets.length > 0) {
                console.warn('[SW] Failed assets:', failedAssets);
            }

            return self.skipWaiting();
        })
    );
});

// =====================================================
// 2. ACTIVATE - Clean old caches
// =====================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v5...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name.startsWith('opradox-'))
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// =====================================================
// 3. FETCH - Cache-first with navigation fallback
// =====================================================
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Only cache same-origin requests (skip CDN scripts)
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Stale-while-revalidate: return cached, update in background
                fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.ok) {
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, networkResponse));
                        }
                    })
                    .catch(() => { }); // Ignore network errors for background update

                return cachedResponse;
            }

            // Not in cache, try network
            return fetch(event.request)
                .then((networkResponse) => {
                    // Cache successful same-origin responses
                    if (networkResponse && networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch((error) => {
                    console.warn('[SW] Fetch failed:', event.request.url, error);

                    // Navigation requests: return viz.html as fallback
                    if (event.request.mode === 'navigate') {
                        return caches.match('/viz.html');
                    }

                    // Other requests: return nothing (let browser handle)
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
        })
    );
});

// =====================================================
// 4. MESSAGE - Manual cache control
// =====================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
            if (event.ports[0]) {
                event.ports[0].postMessage({ success: true });
            }
        });
    }

    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        caches.open(CACHE_NAME).then((cache) => {
            cache.keys().then((keys) => {
                if (event.ports[0]) {
                    event.ports[0].postMessage({
                        cacheName: CACHE_NAME,
                        cachedCount: keys.length,
                        assets: keys.map(r => r.url)
                    });
                }
            });
        });
    }
});

console.log('[SW] Service worker v5 loaded');