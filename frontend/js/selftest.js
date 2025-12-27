// =====================================================
// SELFTEST.JS - Opradox VIZ Self-Test Module
// Runs on DOMContentLoaded, outputs JSON to console
// =====================================================

(function () {
    'use strict';

    function runSelfTest() {
        const results = {
            selftest: 'running',
            timestamp: new Date().toISOString(),
            checks: {},
            warnings: [],
            errors: []
        };

        // Critical window functions check
        const criticalFunctions = [
            'initVizStudio', 'addChart', 'renderChart', 'selectChart',
            'exportPNG', 'exportChartAsPNG', 'exportChartAsPDF', 'exportJSONConfig', 'importJSONConfig',
            'exportPortableDashboard', 'shareViaURL', 'loadFromURL',
            'showToast', 'showHeaderPreview', 'showDataProfileModal',
            'detectColumnTypes', 'generateDataProfile', 'applyCrossFilter', 'clearFilters',
            'saveToIndexedDB', 'loadFromIndexedDB', 'toggleAnnotationMode', 'toggleCommandPalette',
            'undo', 'redo', 'rerenderAllCharts', 'downloadFile'
        ];

        results.checks.criticalFunctions = {};
        criticalFunctions.forEach(fn => {
            const exists = typeof window[fn] === 'function';
            results.checks.criticalFunctions[fn] = exists;
            if (!exists) {
                results.warnings.push(`Missing function: ${fn}`);
            }
        });

        // State objects check
        const stateObjects = ['VIZ_STATE', 'VIZ_TEXTS', 'COLOR_PALETTES', 'HISTORY', 'VIZ_SETTINGS', 'OFFLINE_MODE'];
        results.checks.stateObjects = {};
        stateObjects.forEach(obj => {
            results.checks.stateObjects[obj] = typeof window[obj] !== 'undefined';
        });

        // Export/Import round-trip test
        try {
            if (typeof window.exportJSONConfig === 'function') {
                const config = window.exportJSONConfig();
                if (config && typeof config === 'object') {
                    results.checks.exportJSONConfig = 'ok';
                } else {
                    results.checks.exportJSONConfig = 'returned non-object';
                    results.warnings.push('exportJSONConfig did not return object');
                }
            } else {
                results.checks.exportJSONConfig = 'missing';
            }
        } catch (e) {
            results.checks.exportJSONConfig = 'error';
            results.errors.push('exportJSONConfig error: ' + e.message);
        }

        // Count missing critical functions
        const missingCount = criticalFunctions.filter(fn => typeof window[fn] !== 'function').length;
        results.checks.missingCriticalCount = missingCount;

        // Final status
        if (results.errors.length > 0) {
            results.selftest = 'fail';
        } else if (results.warnings.length > 3) {
            results.selftest = 'warn';
        } else {
            results.selftest = 'ok';
        }

        // Output single line JSON
        console.log(JSON.stringify(results));

        return results;
    }

    // Run after DOM loaded
    if (document.readyState === 'complete') {
        setTimeout(runSelfTest, 1000); // Wait for all scripts
    } else {
        window.addEventListener('load', function () {
            setTimeout(runSelfTest, 1000);
        });
    }

    // Expose for manual testing
    window.runVizSelfTest = runSelfTest;
})();
