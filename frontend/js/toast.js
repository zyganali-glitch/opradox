/**
 * OPRADOX CENTRAL TOAST SYSTEM (FAZ-5)
 * Minimal, standalone toast notifications
 * Used by: Visual Studio, Excel Studio, Hub, etc.
 */

const TOAST_MAX_VISIBLE = 3;
let TOAST_ACTIVE_COUNT = 0;

/**
 * Show a toast notification (bottom-right, stacking)
 * @param {string} message - Toast message text
 * @param {string} type - Toast type: 'success' | 'info' | 'warn' | 'error'
 * @param {number} duration - Duration in ms (default: 4000)
 */
window.showToast = function (message, type = 'info', duration = 4000) {
    // Ensure host container exists
    let host = document.querySelector('.op-toast-host');
    if (!host) {
        host = document.createElement('div');
        host.className = 'op-toast-host';
        document.body.appendChild(host);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `op-toast op-toast-${type}`;
    toast.innerHTML = `<span class="op-toast-message">${message}</span>`;

    // Queue management - max 3 visible at once
    if (TOAST_ACTIVE_COUNT >= TOAST_MAX_VISIBLE) {
        const oldestToast = host.querySelector('.op-toast.show');
        if (oldestToast) {
            dismissToast(oldestToast);
        }
    }

    // Add to DOM
    host.appendChild(toast);
    TOAST_ACTIVE_COUNT++;

    // Trigger show animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    // Auto dismiss after duration
    const dismissTimeout = setTimeout(() => {
        dismissToast(toast);
    }, duration);

    // Store timeout for potential early dismissal
    toast._dismissTimeout = dismissTimeout;

    function dismissToast(t) {
        if (t._dismissed) return;
        t._dismissed = true;

        clearTimeout(t._dismissTimeout);
        t.classList.remove('show');
        t.classList.add('hide');

        setTimeout(() => {
            if (t.parentNode) {
                t.parentNode.removeChild(t);
                TOAST_ACTIVE_COUNT = Math.max(0, TOAST_ACTIVE_COUNT - 1);
            }
        }, 300);
    }

    return toast;
};

console.log('✅ Central Toast System loaded (toast.js)');
