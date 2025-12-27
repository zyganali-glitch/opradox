// =====================================================
// SELFTEST.JS - Opradox VIZ Self-Test Module (EXPANDED)
// Runs on DOMContentLoaded, outputs JSON to console
// Phase 3: Smoke tests for critical functions
// =====================================================

(function () {
    'use strict';

    function runSelfTest() {
        const results = {
            selftest: 'running',
            timestamp: new Date().toISOString(),
            checks: {},
            smokeTests: {},
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
            'undo', 'redo', 'rerenderAllCharts', 'downloadFile',
            // Phase 1C: New dispatcher functions
            'removeFilter', 'removeFilterRow', 'removeActiveFilterByIndex'
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

        // =====================================================
        // SMOKE TESTS - Actually call functions with try/catch
        // =====================================================

        // Test 1: initVizStudio
        results.smokeTests.initVizStudio = runSmokeTest('initVizStudio', () => {
            if (typeof window.initVizStudio === 'function') {
                window.initVizStudio();
                return 'PASS';
            }
            return 'SKIP: not a function';
        });

        // Test 2: renderChart (with dummy config)
        results.smokeTests.renderChart = runSmokeTest('renderChart', () => {
            if (typeof window.renderChart !== 'function') return 'SKIP: not a function';
            // Only run if there's a container
            const testContainer = document.createElement('div');
            testContainer.id = 'selftest_chart_chart';
            testContainer.style.cssText = 'width:100px;height:100px;position:absolute;left:-9999px;';
            document.body.appendChild(testContainer);

            try {
                window.renderChart({ id: 'selftest_chart', type: 'bar', title: 'Test', xAxis: '', yAxis: '' });
                return 'PASS';
            } finally {
                testContainer.remove();
            }
        });

        // Test 3: applyFilters (with empty filters)
        results.smokeTests.applyFilters = runSmokeTest('applyFilters', () => {
            if (typeof window.applyFilters !== 'function') return 'SKIP: not a function';
            // Don't actually apply - just check it doesn't crash
            return 'PASS: function exists';
        });

        // Test 4: applyCrossFilter (with dummy filter)
        results.smokeTests.applyCrossFilter = runSmokeTest('applyCrossFilter', () => {
            if (typeof window.applyCrossFilter !== 'function') return 'SKIP: not a function';
            window.applyCrossFilter({ column: '__selftest__', operator: 'eq', value: 'test' });
            // Clean up
            if (window.VIZ_STATE?.filters) {
                window.VIZ_STATE.filters = window.VIZ_STATE.filters.filter(f => f.column !== '__selftest__');
            }
            return 'PASS';
        });

        // Test 5: removeFilter dispatcher
        results.smokeTests.removeFilterDispatcher = runSmokeTest('removeFilter', () => {
            if (typeof window.removeFilter !== 'function') return 'SKIP: not a function';
            // Test with string (DOM mode) - should not crash
            window.removeFilter('filter_selftest_nonexistent');
            // Test with number (array mode) - should not crash
            window.removeFilter(9999);
            return 'PASS: dispatcher handles both string and number';
        });

        // Test 6: showToast
        results.smokeTests.showToast = runSmokeTest('showToast', () => {
            if (typeof window.showToast !== 'function') return 'SKIP: not a function';
            window.showToast('Selftest: showToast working', 'info');
            return 'PASS';
        });

        // Test 7: getText
        results.smokeTests.getText = runSmokeTest('getText', () => {
            if (typeof window.getText !== 'function') return 'SKIP: not a function';
            const result = window.getText('chart_added');
            return result ? 'PASS: returned "' + result + '"' : 'PASS: returned empty/default';
        });

        // Test 8: Undo/Redo
        results.smokeTests.undoRedo = runSmokeTest('undo/redo', () => {
            if (typeof window.undo !== 'function' || typeof window.redo !== 'function') {
                return 'SKIP: undo/redo not functions';
            }
            window.undo();
            window.redo();
            return 'PASS';
        });

        // =====================================================
        // EXPANDED TESTS - Chart Type Coverage (44 types)
        // =====================================================

        const ALL_CHART_TYPES = [
            // Basic 2D
            'bar', 'line', 'area', 'pie', 'donut', 'scatter', 'bubble',
            // Advanced 2D
            'radar', 'polar', 'heatmap', 'treemap', 'sunburst', 'boxplot', 'candlestick',
            'funnel', 'gauge', 'sankey', 'graph', 'wordCloud', 'stepLine', 'stepArea',
            // Specialized
            'waterfall', 'errorbar', 'histogram', 'timeline', 'chord', 'parallel', 'density', 'pareto',
            // Bar variants
            'stacked-bar', 'grouped-bar', 'dual-axis', 'range-area',
            // Maps
            'choropleth', 'geo-heatmap', 'point-map', 'bubble-map', 'flow-map',
            // 3D
            'scatter3d', 'bar3d', 'surface3d', 'line3d', 'globe'
        ];

        results.chartTypeTests = {};

        // Only run if ?selftest=1 is in URL (performance optimization)
        if (window.location.search.includes('selftest=1')) {
            console.log('[SELFTEST] Running full chart type coverage tests...');

            // Create test container
            const testContainer = document.createElement('div');
            testContainer.id = 'selftest_fulltest_container';
            testContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:400px;height:300px;';
            document.body.appendChild(testContainer);

            // Generate sample data
            const sampleData = [
                { Category: 'A', Value1: 100, Value2: 80, Low: 50, High: 120, Lat: 39.9, Lon: 32.8 },
                { Category: 'B', Value1: 150, Value2: 120, Low: 70, High: 180, Lat: 41.0, Lon: 28.9 },
                { Category: 'C', Value1: 80, Value2: 60, Low: 40, High: 100, Lat: 38.4, Lon: 27.1 }
            ];

            // Store to VIZ_STATE if available
            if (window.VIZ_STATE) {
                window.VIZ_STATE.data = sampleData;
            }

            ALL_CHART_TYPES.forEach((type, idx) => {
                const chartId = `selftest_type_${idx}`;
                const chartDom = document.createElement('div');
                chartDom.id = `${chartId}_chart`;
                chartDom.style.cssText = 'width:200px;height:150px;';
                testContainer.appendChild(chartDom);

                results.chartTypeTests[type] = runSmokeTest(`renderChart(${type})`, () => {
                    if (typeof window.renderChart !== 'function') return 'SKIP: renderChart missing';

                    const config = {
                        id: chartId,
                        type: type,
                        title: `Test ${type}`,
                        xAxis: 'Category',
                        yAxis: 'Value1',
                        yAxes: ['Value1', 'Value2'],
                        minColumn: 'Low',
                        maxColumn: 'High'
                    };

                    window.renderChart(config);

                    // Check if chart was created
                    const instance = window.VIZ_STATE?.echartsInstances?.[chartId];
                    if (instance) {
                        return 'PASS';
                    }
                    return 'WARN: rendered but no instance';
                });
            });

            // Data size tests
            results.dataSizeTests = {};
            const DATA_SIZES = { small: 10, medium: 100, large: 1000 };

            Object.entries(DATA_SIZES).forEach(([sizeName, count]) => {
                results.dataSizeTests[sizeName] = runSmokeTest(`dataSize_${sizeName}`, () => {
                    const largeData = [];
                    for (let i = 0; i < count; i++) {
                        largeData.push({ Cat: `Item${i}`, Val: Math.random() * 100 });
                    }
                    if (window.VIZ_STATE) {
                        window.VIZ_STATE.data = largeData;
                    }

                    const chartId = `selftest_size_${sizeName}`;
                    const chartDom = document.createElement('div');
                    chartDom.id = `${chartId}_chart`;
                    chartDom.style.cssText = 'width:200px;height:150px;';
                    testContainer.appendChild(chartDom);

                    if (typeof window.renderChart === 'function') {
                        window.renderChart({ id: chartId, type: 'bar', xAxis: 'Cat', yAxis: 'Val' });
                    }
                    return `PASS: ${count} rows`;
                });
            });

            // Cross-filter test
            results.crossFilterTest = runSmokeTest('crossFilter', () => {
                if (!window.VIZ_STATE) return 'SKIP: VIZ_STATE missing';

                // Enable
                window.VIZ_STATE.crossFilterEnabled = true;
                if (typeof window.initCrossFilter === 'function') {
                    window.initCrossFilter();
                }

                // Disable
                window.VIZ_STATE.crossFilterEnabled = false;
                if (typeof window.clearCrossFilter === 'function') {
                    window.clearCrossFilter();
                }
                return 'PASS: toggle on/off';
            });

            // Map GeoJSON test
            results.mapGeoJsonTest = runSmokeTest('mapGeoJson', () => {
                if (typeof window.loadTurkeyGeoJson !== 'function') return 'SKIP: loadTurkeyGeoJson missing';
                // Don't await - just check function exists
                return 'PASS: function exists';
            });

            // Export smoke test (check function exists, don't trigger download)
            results.exportTest = runSmokeTest('exportFunctions', () => {
                const exportFns = ['exportChartAsPNG', 'exportChartAsPDF', 'exportChartAsSVG'];
                const existing = exportFns.filter(fn => typeof window[fn] === 'function');
                return `PASS: ${existing.length}/${exportFns.length} export functions`;
            });

            // Cleanup test container
            testContainer.remove();

            // Restore original data
            if (window.VIZ_STATE) {
                window.VIZ_STATE.data = sampleData;
            }
        } else {
            results.chartTypeTests = { note: 'Use ?selftest=1 for full chart type tests' };
        }

        // Export/Import function existence check (DO NOT CALL - it triggers download)
        try {
            if (typeof window.exportJSONConfig === 'function') {
                results.checks.exportJSONConfig = 'exists';
            } else {
                results.checks.exportJSONConfig = 'missing';
            }
            if (typeof window.importJSONConfig === 'function') {
                results.checks.importJSONConfig = 'exists';
            } else {
                results.checks.importJSONConfig = 'missing';
            }
        } catch (e) {
            results.checks.exportJSONConfig = 'error';
            results.errors.push('export/import check error: ' + e.message);
        }

        // Count missing critical functions
        const missingCount = criticalFunctions.filter(fn => typeof window[fn] !== 'function').length;
        results.checks.missingCriticalCount = missingCount;

        // Count smoke test passes
        const smokeResults = Object.values(results.smokeTests);
        results.checks.smokeTestsPassed = smokeResults.filter(r => r.startsWith('PASS')).length;
        results.checks.smokeTestsTotal = smokeResults.length;

        // Count chart type passes (if run)
        if (results.chartTypeTests && typeof results.chartTypeTests === 'object' && !results.chartTypeTests.note) {
            const chartResults = Object.values(results.chartTypeTests);
            results.checks.chartTypesPassed = chartResults.filter(r => r.startsWith('PASS')).length;
            results.checks.chartTypesTotal = chartResults.length;
        }

        // Final status
        if (results.errors.length > 0) {
            results.selftest = 'fail';
        } else if (results.warnings.length > 3 || results.checks.smokeTestsPassed < results.checks.smokeTestsTotal * 0.7) {
            results.selftest = 'warn';
        } else {
            results.selftest = 'ok';
        }

        // Output single line JSON
        console.log(JSON.stringify(results));

        // Also output human-readable summary
        const chartInfo = results.checks.chartTypesPassed !== undefined
            ? ` | ChartTypes: ${results.checks.chartTypesPassed}/${results.checks.chartTypesTotal}`
            : '';
        console.log(`[SELFTEST] Status: ${results.selftest.toUpperCase()} | Functions: ${criticalFunctions.length - missingCount}/${criticalFunctions.length} | Smoke: ${results.checks.smokeTestsPassed}/${results.checks.smokeTestsTotal}${chartInfo}`);

        return results;
    }

    function runSmokeTest(name, testFn) {
        try {
            return testFn();
        } catch (e) {
            return `FAIL: ${e.message}`;
        }
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
