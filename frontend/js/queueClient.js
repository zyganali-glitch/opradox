/**
 * Queue Client - Opradox Excel Studio
 * FAZ-ES-6: Client library for queue management
 * Used by all pages (Excel, PDF, OCR)
 */

(function () {
    'use strict';

    // ============================================================
    // USER KEY MANAGEMENT
    // ============================================================

    const USER_KEY_STORAGE = 'opradox_queue_user_key';

    /**
     * Get or create anonymous user key
     */
    function getUserKey() {
        let key = localStorage.getItem(USER_KEY_STORAGE);
        if (!key) {
            key = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(USER_KEY_STORAGE, key);
        }
        return key;
    }

    // ============================================================
    // WEBSOCKET CONNECTION
    // ============================================================

    let wsConnection = null;
    let wsReconnectTimer = null;
    const wsEventHandlers = [];

    /**
     * Connect to queue WebSocket
     */
    function connectQueueEvents(userKey) {
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            return;
        }

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${location.host}/ws/queue?user_key=${encodeURIComponent(userKey || getUserKey())}`;

        try {
            wsConnection = new WebSocket(wsUrl);

            wsConnection.onopen = function () {
                console.log('[Queue] WebSocket connected');
                if (wsReconnectTimer) {
                    clearTimeout(wsReconnectTimer);
                    wsReconnectTimer = null;
                }
            };

            wsConnection.onmessage = function (event) {
                try {
                    const data = JSON.parse(event.data);

                    // Handle ping/pong
                    if (data.type === 'ping') {
                        wsConnection.send(JSON.stringify({ type: 'pong' }));
                        return;
                    }

                    // Dispatch to handlers
                    if (data.type === 'queue_update') {
                        wsEventHandlers.forEach(handler => {
                            try {
                                handler(data);
                            } catch (e) {
                                console.error('[Queue] Handler error:', e);
                            }
                        });
                    }
                } catch (e) {
                    console.error('[Queue] Parse error:', e);
                }
            };

            wsConnection.onclose = function () {
                console.log('[Queue] WebSocket closed');
                scheduleReconnect(userKey);
            };

            wsConnection.onerror = function (err) {
                console.error('[Queue] WebSocket error:', err);
            };

        } catch (e) {
            console.error('[Queue] Connection failed:', e);
            scheduleReconnect(userKey);
        }
    }

    function scheduleReconnect(userKey) {
        if (wsReconnectTimer) return;
        wsReconnectTimer = setTimeout(() => {
            wsReconnectTimer = null;
            connectQueueEvents(userKey);
        }, 5000);
    }

    /**
     * Add event handler for queue updates
     */
    function onQueueEvent(handler) {
        wsEventHandlers.push(handler);
    }

    /**
     * Remove event handler
     */
    function offQueueEvent(handler) {
        const idx = wsEventHandlers.indexOf(handler);
        if (idx >= 0) wsEventHandlers.splice(idx, 1);
    }

    // ============================================================
    // API CALLS
    // ============================================================

    /**
     * Submit a job to the queue
     * @param {string} service - "excel" | "pdf" | "ocr"
     * @param {string} action - "run_scenario" | "extract" | "run"
     * @param {object} params - Job parameters
     * @param {object} limits - Optional limits
     * @returns {Promise<object>} Submit response
     */
    async function submitJob(service, action, params, limits) {
        const userKey = getUserKey();

        const response = await fetch('/queue/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: service,
                action: action,
                params: params || {},
                limits: limits || {},
                user_key: userKey
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Submit failed' }));
            throw new Error(error.detail || 'Submit failed');
        }

        const result = await response.json();

        // Connect WebSocket if not connected
        connectQueueEvents(userKey);

        return result;
    }

    /**
     * Get job status
     * @param {string} jobId 
     * @returns {Promise<object>}
     */
    async function getJobStatus(jobId) {
        const response = await fetch(`/queue/job/${encodeURIComponent(jobId)}`);
        if (!response.ok) {
            throw new Error('Job not found');
        }
        return response.json();
    }

    /**
     * Cancel a queued job
     * @param {string} jobId 
     * @returns {Promise<object>}
     */
    async function cancelJob(jobId) {
        const userKey = getUserKey();
        const response = await fetch(`/queue/cancel/${encodeURIComponent(jobId)}?user_key=${encodeURIComponent(userKey)}`, {
            method: 'POST'
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Cancel failed' }));
            throw new Error(error.detail || 'Cancel failed');
        }
        return response.json();
    }

    /**
     * Get queue status
     * @param {string} service - Optional service filter
     * @returns {Promise<object>}
     */
    async function getQueueStatus(service) {
        const url = service ? `/queue/status?service=${encodeURIComponent(service)}` : '/queue/status';
        const response = await fetch(url);
        return response.json();
    }

    /**
     * Get localized texts
     * @param {string} lang - "tr" | "en"
     * @returns {Promise<object>}
     */
    async function getQueueTexts(lang) {
        const response = await fetch(`/queue/texts/${lang || 'tr'}`);
        return response.json();
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.QueueClient = {
        getUserKey: getUserKey,
        connectQueueEvents: connectQueueEvents,
        onQueueEvent: onQueueEvent,
        offQueueEvent: offQueueEvent,
        submitJob: submitJob,
        getJobStatus: getJobStatus,
        cancelJob: cancelJob,
        getQueueStatus: getQueueStatus,
        getQueueTexts: getQueueTexts
    };

})();
