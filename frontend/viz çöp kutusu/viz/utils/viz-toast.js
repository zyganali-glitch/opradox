/**
 * viz-toast.js
 * Toast Notification System for Visual Studio
 */

(function () {
    'use strict';

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `viz-toast viz-toast-${type}`;

        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        else if (type === 'warning') icon = 'fa-exclamation-triangle';
        else if (type === 'error') icon = 'fa-times-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Global export
    window.showToast = showToast;

    console.log('✅ viz-toast.js Loaded');
})();
