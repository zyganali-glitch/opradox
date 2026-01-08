/**
 * Queue Modal - Opradox Excel Studio
 * FAZ-ES-6: Global modal control for queue status display
 * 
 * CRITICAL RULES:
 * - Modal ONLY opens when modal_required=true (job is queued)
 * - Modal NEVER opens when status="running" (job started immediately)
 * - Modal auto-closes when status becomes "running"
 */

(function () {
    'use strict';

    // ============================================================
    // TEXTS (TR/EN)
    // ============================================================

    const TEXTS = {
        tr: {
            'modal.title_wait': 'İşlem Sıraya Alındı',
            'modal.title_turn': 'Sıranız Geldi',
            'modal.body_wait': 'Sunucu kapasitesi sınırlı olduğu için işleminiz sıraya alındı. Kaynaklar müsait olduğunda otomatik olarak başlatılacaktır.',
            'modal.body_turn': 'Kaynaklar müsait. İşleminiz başlatılıyor.',
            'modal.body_done': 'İşlem tamamlandı.',
            'modal.body_fail': 'İşlem tamamlanamadı. Lütfen tekrar deneyin veya tanı kayıtlarını kontrol edin.',
            'modal.queue_line': 'Önünüzde {position} kişi var.',
            'modal.eta_line': 'Yaklaşık süre: {mmss}',
            'modal.limit_note': 'Kaynakları verimli kullanmak amacıyla bu işlem için geçerli limitler: {limits}. Bu limitler ileride artırılabilir.',
            'modal.limit_max_mb': 'Maksimum dosya boyutu: {max_mb} MB',
            'modal.limit_max_rows': 'Maksimum satır: {max_rows}',
            'modal.limit_max_pages': 'Maksimum sayfa: {max_pages}',
            'modal.btn_cancel': 'İptal Et',
            'modal.btn_close': 'Kapat',
            'modal.safe_to_leave': 'Bu pencereden çıkabilirsiniz, işlem sırada kalır.'
        },
        en: {
            'modal.title_wait': 'Job Queued',
            'modal.title_turn': "It's Your Turn",
            'modal.body_wait': 'Due to limited server capacity, your job has been placed in a queue. It will start automatically when resources are available.',
            'modal.body_turn': 'Resources are available. Your job is starting.',
            'modal.body_done': 'Completed.',
            'modal.body_fail': 'The job could not be completed. Please try again or check the diagnostics.',
            'modal.queue_line': '{position} people ahead of you.',
            'modal.eta_line': 'Estimated time: {mmss}',
            'modal.limit_note': 'To use resources efficiently, the current limits for this operation are: {limits}. These limits may be increased in the future.',
            'modal.limit_max_mb': 'Maximum file size: {max_mb} MB',
            'modal.limit_max_rows': 'Maximum rows: {max_rows}',
            'modal.limit_max_pages': 'Maximum pages: {max_pages}',
            'modal.btn_cancel': 'Cancel',
            'modal.btn_close': 'Close',
            'modal.safe_to_leave': 'You can leave this page, your job will remain in the queue.'
        }
    };

    // ============================================================
    // STATE
    // ============================================================

    let currentLang = 'tr';
    let currentJobId = null;
    let countdownInterval = null;
    let currentEtaMs = 0;
    let modalElement = null;
    let onCancelCallback = null;
    let onCloseCallback = null;

    // ============================================================
    // TEXT HELPERS
    // ============================================================

    function getText(key, replacements) {
        const texts = TEXTS[currentLang] || TEXTS.tr;
        let text = texts[key] || key;

        if (replacements) {
            Object.keys(replacements).forEach(k => {
                text = text.replace('{' + k + '}', replacements[k]);
            });
        }

        return text;
    }

    function formatTime(ms) {
        if (ms <= 0) return '00:00';
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }

    function setLang(lang) {
        currentLang = lang === 'en' ? 'en' : 'tr';
    }

    // Detect language from page
    function detectLang() {
        // Check for global lang variable or html lang attribute
        if (typeof window.VIZ_STATE !== 'undefined' && window.VIZ_STATE.lang) {
            return window.VIZ_STATE.lang;
        }
        if (typeof window.LANG !== 'undefined') {
            return window.LANG;
        }
        const htmlLang = document.documentElement.lang;
        if (htmlLang && htmlLang.startsWith('en')) {
            return 'en';
        }
        return 'tr';
    }

    // ============================================================
    // MODAL DOM
    // ============================================================

    function renderQueueModal() {
        if (document.getElementById('queue-modal')) {
            modalElement = document.getElementById('queue-modal');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'queue-modal';
        modal.className = 'queue-modal-overlay';
        modal.innerHTML = `
            <div class="queue-modal-content">
                <div class="queue-modal-header">
                    <h3 id="queue-modal-title"></h3>
                </div>
                <div class="queue-modal-body">
                    <p id="queue-modal-message"></p>
                    <div id="queue-modal-status" class="queue-modal-status">
                        <div id="queue-modal-position"></div>
                        <div id="queue-modal-eta" class="queue-modal-eta"></div>
                    </div>
                    <div id="queue-modal-limits" class="queue-modal-limits"></div>
                    <p id="queue-modal-note" class="queue-modal-note"></p>
                </div>
                <div class="queue-modal-footer">
                    <button id="queue-modal-cancel" class="queue-modal-btn queue-modal-btn-cancel"></button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modalElement = modal;

        // Cancel button handler
        document.getElementById('queue-modal-cancel').addEventListener('click', function () {
            if (currentJobId && onCancelCallback) {
                onCancelCallback(currentJobId);
            }
            closeQueueModal();
        });
    }

    // ============================================================
    // MODAL CONTROL
    // ============================================================

    /**
     * Open modal for a queued job
     * CRITICAL: Only call when modal_required=true
     */
    function openQueueModal(payload, options) {
        // CRITICAL: Never open if status is not queued
        if (payload.status !== 'queued') {
            console.log('[QueueModal] Not opening - status is:', payload.status);
            return;
        }

        // CRITICAL: Never open if modal_required is false
        if (payload.modal_required === false) {
            console.log('[QueueModal] Not opening - modal_required is false');
            return;
        }

        currentLang = detectLang();
        renderQueueModal();

        currentJobId = payload.job_id;
        currentEtaMs = payload.eta_ms || 0;

        if (options) {
            onCancelCallback = options.onCancel;
            onCloseCallback = options.onClose;
        }

        // Set texts
        document.getElementById('queue-modal-title').textContent = getText('modal.title_wait');
        document.getElementById('queue-modal-message').textContent = getText('modal.body_wait');
        document.getElementById('queue-modal-cancel').textContent = getText('modal.btn_cancel');
        document.getElementById('queue-modal-note').textContent = getText('modal.safe_to_leave');

        // Update position and ETA
        updateQueueModal(payload);

        // Start countdown
        startCountdown(currentEtaMs);

        // Show modal
        modalElement.classList.add('active');
    }

    /**
     * Update modal with new data
     */
    function updateQueueModal(event) {
        if (!modalElement) return;

        // CRITICAL: Close modal immediately when status becomes "running"
        if (event.status === 'running') {
            console.log('[QueueModal] Status is running - closing modal');
            closeQueueModal();
            return;
        }

        // Also close for done/fail
        if (event.status === 'done' || event.status === 'fail' || event.status === 'canceled') {
            console.log('[QueueModal] Status is', event.status, '- closing modal');
            closeQueueModal();
            return;
        }

        // Update position
        const position = event.position || 0;
        if (position > 0) {
            document.getElementById('queue-modal-position').textContent =
                getText('modal.queue_line', { position: position });
            document.getElementById('queue-modal-position').style.display = 'block';
        } else {
            document.getElementById('queue-modal-position').style.display = 'none';
        }

        // Update ETA
        currentEtaMs = event.eta_ms || 0;
        updateEtaDisplay();

        // Update limits if provided
        if (event.limits) {
            updateLimitsDisplay(event.limits);
        }
    }

    function updateEtaDisplay() {
        const etaElement = document.getElementById('queue-modal-eta');
        if (currentEtaMs > 0) {
            etaElement.textContent = getText('modal.eta_line', { mmss: formatTime(currentEtaMs) });
            etaElement.style.display = 'block';
        } else {
            etaElement.style.display = 'none';
        }
    }

    function updateLimitsDisplay(limits) {
        const limitsElement = document.getElementById('queue-modal-limits');
        if (!limits || Object.keys(limits).length === 0) {
            limitsElement.style.display = 'none';
            return;
        }

        const parts = [];
        if (limits.max_mb) {
            parts.push(getText('modal.limit_max_mb', { max_mb: limits.max_mb }));
        }
        if (limits.max_rows) {
            parts.push(getText('modal.limit_max_rows', { max_rows: limits.max_rows }));
        }
        if (limits.max_pages) {
            parts.push(getText('modal.limit_max_pages', { max_pages: limits.max_pages }));
        }

        if (parts.length > 0) {
            limitsElement.textContent = getText('modal.limit_note', { limits: parts.join(', ') });
            limitsElement.style.display = 'block';
        } else {
            limitsElement.style.display = 'none';
        }
    }

    // ============================================================
    // COUNTDOWN
    // ============================================================

    function startCountdown(etaMs) {
        stopCountdown();
        currentEtaMs = etaMs;

        if (etaMs <= 0) return;

        countdownInterval = setInterval(function () {
            currentEtaMs = Math.max(0, currentEtaMs - 1000);
            updateEtaDisplay();

            if (currentEtaMs <= 0) {
                stopCountdown();
            }
        }, 1000);
    }

    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    // ============================================================
    // CLOSE MODAL
    // ============================================================

    function closeQueueModal() {
        stopCountdown();
        currentJobId = null;

        if (modalElement) {
            modalElement.classList.remove('active');
        }

        if (onCloseCallback) {
            try {
                onCloseCallback();
            } catch (e) {
                console.error('[QueueModal] Close callback error:', e);
            }
        }
    }

    /**
     * Check if modal is open
     */
    function isModalOpen() {
        return modalElement && modalElement.classList.contains('active');
    }

    // ============================================================
    // AUTO-REGISTER EVENT HANDLER
    // ============================================================

    // Listen for queue events and update modal
    if (typeof window.QueueClient !== 'undefined') {
        window.QueueClient.onQueueEvent(function (event) {
            if (event.job_id === currentJobId) {
                updateQueueModal(event);
            }
        });
    }

    // ============================================================
    // EXPORT
    // ============================================================

    window.QueueModal = {
        renderQueueModal: renderQueueModal,
        openQueueModal: openQueueModal,
        updateQueueModal: updateQueueModal,
        closeQueueModal: closeQueueModal,
        isModalOpen: isModalOpen,
        setLang: setLang
    };

})();
