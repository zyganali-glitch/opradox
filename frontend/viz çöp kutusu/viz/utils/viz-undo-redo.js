/**
 * viz-undo-redo.js
 * Undo/Redo History System with Auto-Save
 * Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)
 */

(function () {
    'use strict';

    // Undo/Redo sistemi
    const HISTORY = {
        undoStack: [],
        redoStack: [],
        maxSize: 50
    };

    function saveState() {
        const state = window.VIZ_STATE;
        if (!state) return;

        const snapshot = {
            data: JSON.parse(JSON.stringify(state.data || [])),
            columns: [...(state.columns || [])],
            charts: JSON.parse(JSON.stringify(state.charts || [])),
            timestamp: Date.now()
        };

        HISTORY.undoStack.push(snapshot);
        HISTORY.redoStack = [];

        if (HISTORY.undoStack.length > HISTORY.maxSize) {
            HISTORY.undoStack.shift();
        }
    }

    function undo() {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (HISTORY.undoStack.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Geri alinacak islem yok', 'info');
            }
            return;
        }

        // Mevcut durumu redo stack'e kaydet
        HISTORY.redoStack.push({
            data: JSON.parse(JSON.stringify(state.data || [])),
            columns: [...(state.columns || [])],
            charts: JSON.parse(JSON.stringify(state.charts || []))
        });

        // Son durumu geri yukle
        const snapshot = HISTORY.undoStack.pop();
        state.data = snapshot.data;
        state.columns = snapshot.columns;
        state.charts = snapshot.charts;

        // UI guncelle
        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        state.charts.forEach(c => {
            if (typeof renderChart === 'function') renderChart(c);
        });

        if (typeof showToast === 'function') {
            showToast('Islem geri alindi (Ctrl+Z)', 'success');
        }
    }

    function redo() {
        const state = window.VIZ_STATE;
        if (!state) return;

        if (HISTORY.redoStack.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Yinelenecek islem yok', 'info');
            }
            return;
        }

        // Mevcut durumu undo stack'e kaydet
        HISTORY.undoStack.push({
            data: JSON.parse(JSON.stringify(state.data || [])),
            columns: [...(state.columns || [])],
            charts: JSON.parse(JSON.stringify(state.charts || []))
        });

        // Redo durumunu yukle
        const snapshot = HISTORY.redoStack.pop();
        state.data = snapshot.data;
        state.columns = snapshot.columns;
        state.charts = snapshot.charts;

        // UI guncelle
        if (typeof renderColumnsList === 'function') renderColumnsList();
        if (typeof updateDropdowns === 'function') updateDropdowns();
        state.charts.forEach(c => {
            if (typeof renderChart === 'function') renderChart(c);
        });

        if (typeof showToast === 'function') {
            showToast('Islem yinelendi (Ctrl+Y)', 'success');
        }
    }

    // Ctrl+Z / Ctrl+Y kisayollari
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
        }
    });

    // Auto-save
    let autoSaveInterval = null;

    function enableAutoSave(intervalMs = 30000) {
        if (autoSaveInterval) clearInterval(autoSaveInterval);

        autoSaveInterval = setInterval(() => {
            const state = window.VIZ_STATE;
            if (state && state.data && state.data.length > 0) {
                if (typeof saveToIndexedDB === 'function') {
                    saveToIndexedDB();
                }
                console.log('Auto-save completed');
            }
        }, intervalMs);

        if (typeof showToast === 'function') {
            showToast('Otomatik kayit aktif (30 saniyede bir)', 'success');
        }
    }

    function disableAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
        if (typeof showToast === 'function') {
            showToast('Otomatik kayit devre disi', 'info');
        }
    }

    function getHistoryStats() {
        return {
            undoCount: HISTORY.undoStack.length,
            redoCount: HISTORY.redoStack.length,
            maxSize: HISTORY.maxSize
        };
    }

    // Global exports
    window.HISTORY = HISTORY;
    window.saveState = saveState;
    window.undo = undo;
    window.redo = redo;
    window.enableAutoSave = enableAutoSave;
    window.disableAutoSave = disableAutoSave;
    window.getHistoryStats = getHistoryStats;

    console.log('✅ viz-undo-redo.js Loaded');
})();
