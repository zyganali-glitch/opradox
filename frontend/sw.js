// Opradox Visual Studio Service Worker
const CACHE_NAME = 'opradox-viz-v1';
const urlsToCache = [
    '/viz.html',
    '/css/style.css',
    '/js/viz.js',
    'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
    'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js',
    'https://cdn.jsdelivr.net/npm/simple-statistics@7.8.0/dist/simple-statistics.min.js',
    'https://cdn.jsdelivr.net/npm/jstat@1.9.6/dist/jstat.min.js',
    'https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('⚡ Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching resources...');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.warn('Cache failed:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests
    if (event.request.url.includes('/viz/') || event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).then(networkResponse => {
                    // Cache successful responses
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/viz.html');
                }
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-dashboard') {
        console.log('🔄 Syncing dashboard data...');
    }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
    const data = event.data?.json() || { title: 'Opradox', body: 'Yeni bildirim' };

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/img/logo.png',
            badge: '/img/badge.png'
        })
    );
});

console.log('🚀 Opradox Visual Studio Service Worker loaded');
