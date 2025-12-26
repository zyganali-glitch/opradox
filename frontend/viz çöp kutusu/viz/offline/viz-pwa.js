/**
 * viz-pwa.js
 * PWA & Offline Support Functions - CREATED FROM LEGACY viz.js
 * registerServiceWorker, checkOfflineMode, checkPWASupport
 */

(function () {
    'use strict';

    // =====================================================
    // OFFLINE MODE STATE
    // =====================================================

    const OFFLINE_MODE = {
        isOffline: false,
        cachedData: null,
        swRegistration: null
    };

    // =====================================================
    // REGISTER SERVICE WORKER
    // =====================================================

    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            OFFLINE_MODE.swRegistration = registration;

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (typeof showToast === 'function') {
                            showToast('Yeni sürüm mevcut. Sayfa yenilenecek.', 'info');
                        }
                    }
                });
            });

            console.log('✅ Service Worker registered');
            return true;

        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    // =====================================================
    // CHECK OFFLINE MODE
    // =====================================================

    function checkOfflineMode() {
        OFFLINE_MODE.isOffline = !navigator.onLine;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            OFFLINE_MODE.isOffline = false;
            if (typeof showToast === 'function') {
                showToast('Çevrimiçi moda geçildi', 'success');
            }
            syncOfflineData();
        });

        window.addEventListener('offline', () => {
            OFFLINE_MODE.isOffline = true;
            if (typeof showToast === 'function') {
                showToast('Çevrimdışı mod aktif. Veriler yerel olarak kaydedilecek.', 'warning');
            }
        });

        return OFFLINE_MODE.isOffline;
    }

    // =====================================================
    // CHECK PWA SUPPORT
    // =====================================================

    function checkPWASupport() {
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notification: 'Notification' in window,
            indexedDB: 'indexedDB' in window,
            cache: 'caches' in window,
            manifest: !!document.querySelector('link[rel="manifest"]')
        };

        console.log('PWA Support:', support);
        return support;
    }

    // =====================================================
    // CACHE DATA FOR OFFLINE USE
    // =====================================================

    function cacheDataForOffline() {
        const state = window.VIZ_STATE;
        if (!state || !state.data) return;

        try {
            const cacheData = {
                data: state.data,
                columns: state.columns,
                columnsInfo: state.columnsInfo,
                charts: state.charts,
                timestamp: Date.now()
            };

            localStorage.setItem('viz_offline_cache', JSON.stringify(cacheData));
            OFFLINE_MODE.cachedData = cacheData;

            if (typeof showToast === 'function') {
                showToast('Veri çevrimdışı kullanım için önbelleğe alındı', 'success');
            }
        } catch (error) {
            console.error('Offline cache error:', error);
        }
    }

    // =====================================================
    // LOAD CACHED DATA
    // =====================================================

    function loadCachedData() {
        try {
            const cached = localStorage.getItem('viz_offline_cache');
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            OFFLINE_MODE.cachedData = cacheData;

            const state = window.VIZ_STATE;
            if (state) {
                state.data = cacheData.data;
                state.columns = cacheData.columns;
                state.columnsInfo = cacheData.columnsInfo;
                state.charts = cacheData.charts || [];

                if (typeof renderColumnsList === 'function') renderColumnsList();
                if (typeof updateDropdowns === 'function') updateDropdowns();
                if (typeof updateDataProfile === 'function') updateDataProfile();
            }

            if (typeof showToast === 'function') {
                const age = Math.round((Date.now() - cacheData.timestamp) / 60000);
                showToast(`Önbellekten yüklendi (${age} dk önce)`, 'info');
            }

            return cacheData;
        } catch (error) {
            console.error('Load cached data error:', error);
            return null;
        }
    }

    // =====================================================
    // SYNC OFFLINE DATA
    // =====================================================

    async function syncOfflineData() {
        if (OFFLINE_MODE.isOffline) return;

        // Check if there's pending data to sync
        const pendingSync = localStorage.getItem('viz_pending_sync');
        if (!pendingSync) return;

        try {
            const pendingData = JSON.parse(pendingSync);

            // Attempt to sync with server
            const response = await fetch('/viz/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingData)
            });

            if (response.ok) {
                localStorage.removeItem('viz_pending_sync');
                if (typeof showToast === 'function') {
                    showToast('Çevrimdışı veriler senkronize edildi', 'success');
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    // =====================================================
    // INSTALL PROMPT
    // =====================================================

    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    function showInstallButton() {
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.style.display = 'inline-flex';
        }
    }

    async function promptInstall() {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            if (typeof showToast === 'function') {
                showToast('Uygulama yüklendi!', 'success');
            }
        }

        deferredPrompt = null;
    }

    // =====================================================
    // INITIALIZE PWA
    // =====================================================

    function initPWA() {
        checkPWASupport();
        checkOfflineMode();
        registerServiceWorker();

        // Try to load cached data if offline
        if (OFFLINE_MODE.isOffline) {
            loadCachedData();
        }

        console.log('✅ PWA module initialized');
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    window.OFFLINE_MODE = OFFLINE_MODE;
    window.registerServiceWorker = registerServiceWorker;
    window.checkOfflineMode = checkOfflineMode;
    window.checkPWASupport = checkPWASupport;
    window.cacheDataForOffline = cacheDataForOffline;
    window.loadCachedData = loadCachedData;
    window.syncOfflineData = syncOfflineData;
    window.promptInstall = promptInstall;
    window.initPWA = initPWA;

    console.log('✅ viz-pwa.js CREATED - PWA & Offline functions available');
})();
