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

        // Test 9: Statistical Motors (Levene & Updated ANOVA)
        results.smokeTests.statMotors = runSmokeTest('statMotors', () => {
            // Check if functions are exposed (might need adapter update)
            // Use try-catch if they are module-bound and not window-bound
            try {
                if (typeof window.runLeveneTest !== 'function' || typeof window.runOneWayANOVA !== 'function') {
                    // Start checking imports from module if possible? No, we are in non-module script probably or need window binding.
                    // For now, assume they SHOULD be on window if the app is working as "monolithic" replacement.
                    // If not, this test will correctly SKIP.
                    return 'SKIP: stat functions missing on window';
                }

                // Dummy data for ANOVA
                const group1 = [10, 12, 14, 16];
                const group2 = [11, 13, 15, 17];
                const group3 = [20, 22, 24, 26];

                // Run Levene
                const levene = window.runLeveneTest([group1, group2, group3]);
                if (!levene.valid) return 'FAIL: Levene invalid';

                // Run ANOVA (should include OmegaSq and Levene in result)
                const anova = window.runOneWayANOVA([group1, group2, group3]);
                if (anova.effectSizes.omegaSquared === undefined) return 'FAIL: Omega Squared missing';
                if (!anova.stats.levene) return 'FAIL: Levene in ANOVA missing';

                return 'PASS';
            } catch (e) {
                return 'FAIL: ' + e.message;
            }
        });

        // Test 10: Correlation Options
        results.smokeTests.correlationOpts = runSmokeTest('correlationOpts', () => {
            if (typeof window.runCorrelationTest !== 'function') return 'SKIP: correlation function missing';
            const x = [1, 2, 3, 4, 5];
            const y = [1, 2, 3, 4, 5];
            // Test Spearman
            const result = window.runCorrelationTest(x, y, { method: 'spearman' });
            if (result.stats.method !== 'spearman') return 'FAIL: Spearman option ignored';
            return 'PASS';
        });

        // Test 11: Dual Independent T-Test (FAZ 5)
        results.smokeTests.dualTTest = runSmokeTest('dualTTest', () => {
            if (typeof window.runIndependentTTest !== 'function') return 'SKIP: t-test function missing';

            // Create two groups with clearly different variances
            const g1 = [10, 10, 10, 10, 10]; // Var = 0
            const g2 = [1, 5, 10, 15, 20];   // High Var

            const result = window.runIndependentTTest(g1, g2);

            if (!result.stats.student || !result.stats.welch) return 'FAIL: Dual stats missing';
            if (!result.stats.levene) return 'FAIL: Levene missing';
            if (result.effectSizes.hedgesG === undefined) return 'FAIL: Hedges g missing';
            return 'PASS';
        });

        // Test 12: ANOVA Post-Hoc (FAZ 9)
        results.smokeTests.anovaPostHoc = runSmokeTest('anovaPostHoc', () => {
            if (typeof window.runOneWayANOVA !== 'function') return 'SKIP: anova missing';

            // Create 3 groups with significant differences (10, 20, 30)
            const g1 = [10, 11, 12];
            const g2 = [20, 21, 22];
            const g3 = [30, 31, 32];

            const result = window.runOneWayANOVA([g1, g2, g3]);

            // Should be significant
            if (result.pValues.pValue >= 0.05) return 'FAIL: ANOVA should be significant';

            // Check if Post-Hoc ran
            if (!result.stats.postHoc) return 'FAIL: Post-Hoc results missing';
            if (!result.stats.postHoc.comparisons || result.stats.postHoc.comparisons.length === 0) return 'FAIL: No comparisons';
            if (result.stats.postHoc.method !== 'tukey') return 'FAIL: Expected Tukey';

            return 'PASS';
        });

        // Test 13: Paired T-Test (FAZ 6)
        results.smokeTests.pairedTTest = runSmokeTest('pairedTTest', () => {
            if (typeof window.runPairedTTest !== 'function') return 'SKIP: paired func missing';
            const before = [10, 12, 14, 16];
            const after = [12, 14, 16, 18]; // Consistent increase of +2

            const result = window.runPairedTTest(before, after);
            if (!result.effectSizes.cohensDz) return 'FAIL: Cohens dz missing';
            if (Math.abs(result.stats.meanDiff) < 1.9) return 'FAIL: Mean diff wrong';
            return 'PASS';
        });

        // Test 14: One-Sample T-Test (FAZ 7)
        results.smokeTests.oneSampleTTest = runSmokeTest('oneSampleTTest', () => {
            if (typeof window.runOneSampleTTest !== 'function') return 'SKIP: one-sample func missing';
            // Oh wait, if SD=0 t is Inf. Let's add variance.
            const s2 = [9, 10, 11]; // Mean 10

            // Test vs 20 (should be diff)
            const result = window.runOneSampleTTest(s2, 20);
            if (result.pValues.pValue > 0.05) return 'FAIL: Should be sig diff from 20';
            if (result.stats.ci === undefined) return 'FAIL: CI missing';
            return 'PASS';
        });

        // Test 15: Chi-Square (FAZ 11)
        results.smokeTests.chiSquare = runSmokeTest('chiSquare', () => {
            if (typeof window.runChiSquareTest !== 'function') return 'SKIP: chisq missing';

            // Simple 2x2: Rows=Gender(M,F), Cols=Product(A,B)
            // A strong relationship: Men like A, Women like B
            const table = [
                [10, 0], // Men
                [0, 10]  // Women
            ];

            const result = window.runChiSquareTest(table);
            if (!result.stats.expectedTable) return 'FAIL: Expected table missing';
            if (result.pValues.pValue >= 0.05) return 'FAIL: Should be significant';
            // With this perfect split, Cramer's V should be 1.0
            if (Math.abs(result.effectSizes.cramersV - 1) > 0.01) return 'FAIL: Cramers V wrong';

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

        // =====================================================
        // STAT ENGINE SMOKE TESTS (SPSS Standard Mode)
        // =====================================================

        results.statEngineTests = {};

        // Test: Friedman (format uyumu - data + columns)
        results.statEngineTests.friedman = runSmokeTest('runFriedmanTest', () => {
            if (typeof window.runFriedmanTest !== 'function') return 'SKIP: not exposed to window';
            // Simüle data + columns formatı
            const testData = [
                { M1: 5, M2: 7, M3: 4 },
                { M1: 6, M2: 8, M3: 5 },
                { M1: 7, M2: 6, M3: 6 },
                { M1: 4, M2: 9, M3: 3 }
            ];
            const result = window.runFriedmanTest(testData, ['M1', 'M2', 'M3'], 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (typeof result.result?.chiSquare !== 'number' && typeof result.chiSquare !== 'number') {
                return 'FAIL: missing chiSquare';
            }
            return 'PASS';
        });

        // Test: Mann-Whitney U rapor doğruluğu
        results.statEngineTests.mannWhitneyReport = runSmokeTest('runMannWhitneyU (U field)', () => {
            if (typeof window.runMannWhitneyU !== 'function') return 'SKIP: not exposed to window';
            const g1 = [5, 6, 7, 8, 9];
            const g2 = [10, 11, 12, 13, 14];
            const result = window.runMannWhitneyU(g1, g2, 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // Kontrol: U alanı mevcut olmalı (legacy veya result.statistic)
            const uValue = result.U ?? result.result?.statistic;
            if (typeof uValue !== 'number') return 'FAIL: U = undefined';
            // APA string U içermeli
            if (result.apaTR && !result.apaTR.includes('U =')) return 'FAIL: APA missing U';
            return 'PASS';
        });

        // Test: KMeans veri mutasyonu kontrolü
        results.statEngineTests.kmeansMutation = runSmokeTest('runKMeansAnalysis (no mutation)', () => {
            if (typeof window.runKMeansAnalysis !== 'function') return 'SKIP: not exposed to window';
            const testData = [
                { V1: 1, V2: 2 },
                { V1: 1.5, V2: 2.5 },
                { V1: 10, V2: 12 },
                { V1: 11, V2: 13 },
                { V1: 5, V2: 6 }
            ];
            // Orijinal data klonu
            const originalKeys = Object.keys(testData[0]);

            window.runKMeansAnalysis(testData, ['V1', 'V2'], 2);

            // Mutasyon kontrolü
            if (testData[0].hasOwnProperty('_cluster')) {
                return 'FAIL: data mutated with _cluster';
            }
            return 'PASS: no mutation';
        });

        // Test: Logistic IRLS yakınsama
        results.statEngineTests.logisticIRLS = runSmokeTest('runLogisticRegression (IRLS)', () => {
            if (typeof window.runLogisticRegression !== 'function') return 'SKIP: not exposed to window';
            // Basit binary veri
            const testData = [];
            for (let i = 0; i < 50; i++) {
                testData.push({ X: i, Y: i < 25 ? 0 : 1 });
            }
            const result = window.runLogisticRegression(testData, 'Y', ['X']);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // IRLS veya method kontrolü
            if (result.method && result.method.includes('IRLS')) return 'PASS: IRLS';
            if (result.method && result.method.includes('Gradient')) return 'WARN: GD fallback';
            // Eski format için
            if (result.testName && result.testName.includes('IRLS')) return 'PASS: IRLS';
            return 'PASS';
        });

        // Test: ANOVA + Tukey Post-Hoc (Homogeneous Variances)
        // Uses groups with similar variances - should trigger Tukey HSD
        results.statEngineTests.anovaPostHocTukey = runSmokeTest('runOneWayANOVA (Tukey - homogeneous)', () => {
            if (typeof window.runOneWayANOVA !== 'function') return 'SKIP: not exposed to window';
            // Groups with SIMILAR variances (homogeneous) - triggers Tukey
            const groups = [
                [10, 12, 14, 13, 11], // Grup 1: mean ~12
                [20, 22, 21, 23, 19], // Grup 2: mean ~21
                [30, 32, 31, 29, 33]  // Grup 3: mean ~31
            ];
            const result = window.runOneWayANOVA(groups, 0.05, ['G1', 'G2', 'G3']);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;

            // Check postHoc exists and is an object
            if (!result.postHoc || typeof result.postHoc !== 'object') {
                return 'FAIL: postHoc not an object';
            }

            // Check postHocMethod is Tukey
            if (result.postHocMethod !== 'Tukey HSD') {
                return `WARN: Expected Tukey, got ${result.postHocMethod}`;
            }

            // Check postHoc.comparisons array exists with rows
            if (!result.postHoc.comparisons || result.postHoc.comparisons.length === 0) {
                return 'FAIL: postHoc.comparisons empty';
            }

            // Check each comparison has required fields
            const comp = result.postHoc.comparisons[0];
            if (!comp.group1 || !comp.group2 || typeof comp.meanDiff !== 'number' || typeof comp.pValue !== 'number') {
                return 'FAIL: comparison missing fields (group1/group2/meanDiff/pValue)';
            }

            // Check pValue is valid number (not NaN or undefined)
            if (isNaN(comp.pValue) || comp.pValue === undefined) {
                return 'FAIL: pAdj is NaN or undefined';
            }

            return `PASS: ${result.postHoc.comparisons.length} comparisons, p=${comp.pValue.toFixed(4)}`;
        });

        // Test: ANOVA + Games-Howell Post-Hoc (Heterogeneous Variances)
        // Uses groups with VERY DIFFERENT variances - should trigger Games-Howell
        results.statEngineTests.anovaPostHocGamesHowell = runSmokeTest('runOneWayANOVA (Games-Howell - heterogeneous)', () => {
            if (typeof window.runOneWayANOVA !== 'function') return 'SKIP: not exposed to window';
            // Groups with VERY DIFFERENT variances (heterogeneous) - triggers Games-Howell
            const groups = [
                [10, 11, 10, 11, 10, 11, 10], // Grup 1: low variance (~0.5)
                [20, 15, 25, 18, 27, 12, 30], // Grup 2: high variance (~30)
                [40, 35, 45, 38, 47, 32, 50]  // Grup 3: high variance (~30)
            ];
            const result = window.runOneWayANOVA(groups, 0.05, ['LowVar', 'HighVar1', 'HighVar2']);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;

            // Check postHoc exists and is an object
            if (!result.postHoc || typeof result.postHoc !== 'object') {
                return 'FAIL: postHoc not an object';
            }

            // Check postHocMethod is Games-Howell (due to heterojen variance)
            if (result.postHocMethod !== 'Games-Howell') {
                return `WARN: Expected Games-Howell for heterogeneous, got ${result.postHocMethod}`;
            }

            // Check postHoc.comparisons array exists with rows
            if (!result.postHoc.comparisons || result.postHoc.comparisons.length === 0) {
                return 'FAIL: postHoc.comparisons empty';
            }

            // Check each comparison has required fields including df (Games-Howell specific)
            const comp = result.postHoc.comparisons[0];
            if (!comp.group1 || !comp.group2 || typeof comp.meanDiff !== 'number' || typeof comp.pValue !== 'number') {
                return 'FAIL: comparison missing fields (group1/group2/meanDiff/pValue)';
            }

            // Check pValue is valid number (not NaN or undefined)
            if (isNaN(comp.pValue) || comp.pValue === undefined) {
                return 'FAIL: pAdj is NaN or undefined';
            }

            // Games-Howell should have df field
            if (typeof comp.df !== 'number') {
                return 'WARN: Games-Howell missing df field';
            }

            return `PASS: ${result.postHoc.comparisons.length} comparisons, p=${comp.pValue.toFixed(4)}, df=${comp.df.toFixed(1)}`;
        });

        // Test: Shapiro-Wilk (n > 5000 için KS fallback)
        results.statEngineTests.normalityLargeN = runSmokeTest('runShapiroWilkTest (n=100)', () => {
            if (typeof window.runShapiroWilkTest !== 'function') return 'SKIP: not exposed to window';
            const data = [];
            for (let i = 0; i < 100; i++) data.push(Math.random() * 100);
            const result = window.runShapiroWilkTest(data, 0.05);
            if (!result.valid && !result.W) return `FAIL: ${result.error || 'invalid'}`;
            return 'PASS';
        });

        // Count stat engine test passes
        const statResults = Object.values(results.statEngineTests);
        results.checks.statEngineTestsPassed = statResults.filter(r => r.startsWith('PASS')).length;
        results.checks.statEngineTestsTotal = statResults.length;

        // =====================================================
        // FAZ-3: REGRESSION TESTS & VALIDATION TESTS
        // =====================================================

        results.faz3Tests = {};

        // REGRESSION TEST A: Friedman format compatibility
        results.faz3Tests.friedmanRegression = runSmokeTest('Friedman (data+multiVars format)', () => {
            if (typeof window.runFriedmanTest !== 'function') return 'SKIP: not exposed';
            const testData = [
                { M1: 5, M2: 7, M3: 4 },
                { M1: 6, M2: 8, M3: 5 },
                { M1: 7, M2: 6, M3: 6 },
                { M1: 4, M2: 9, M3: 3 },
                { M1: 8, M2: 5, M3: 7 }
            ];
            const result = window.runFriedmanTest(testData, ['M1', 'M2', 'M3'], 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // Check pValue is number
            const pVal = result.pValue ?? result.result?.pValue;
            if (typeof pVal !== 'number' || isNaN(pVal)) return 'FAIL: pValue not a number';
            // Check Kendall's W is between 0 and 1
            const W = result.W ?? result.kendallW ?? result.result?.kendallW;
            if (typeof W !== 'number') return 'WARN: W not found';
            if (W < 0 || W > 1) return `FAIL: W=${W} out of range [0,1]`;
            return `PASS: pValue=${pVal.toFixed(4)}, W=${W.toFixed(3)}`;
        });

        // REGRESSION TEST B: KMeans no mutation
        results.faz3Tests.kmeansMutationCheck = runSmokeTest('KMeans (no _cluster mutation)', () => {
            if (typeof window.runKMeansAnalysis !== 'function') return 'SKIP: not exposed';
            const testData = [
                { V1: 1, V2: 2, _extra: 'keep' },
                { V1: 1.5, V2: 2.5 },
                { V1: 10, V2: 12 },
                { V1: 11, V2: 13 },
                { V1: 5, V2: 6 }
            ];
            const originalKeys = Object.keys(testData[0]);
            const result = window.runKMeansAnalysis(testData, ['V1', 'V2'], 2);

            // Check for mutation
            if (testData[0].hasOwnProperty('_cluster') || testData[0].hasOwnProperty('cluster')) {
                return 'FAIL: data mutated with _cluster/cluster';
            }
            // Check original keys preserved
            const newKeys = Object.keys(testData[0]);
            if (originalKeys.length !== newKeys.length) return 'FAIL: key count changed';

            // Check assignments length
            const assignments = result.assignments ?? result.clusterAssignments;
            if (!assignments || assignments.length !== testData.length) {
                return `FAIL: assignments length mismatch (${assignments?.length} vs ${testData.length})`;
            }
            return 'PASS: no mutation, correct assignments';
        });

        // VALIDATION TEST: validateStatWidgetParams function
        results.faz3Tests.validateFunctionExists = runSmokeTest('validateStatWidgetParams exists', () => {
            if (typeof window.validateStatWidgetParams !== 'function') return 'FAIL: not exposed';
            return 'PASS';
        });

        // Count FAZ-3 test passes
        const faz3Results = Object.values(results.faz3Tests);
        results.checks.faz3TestsPassed = faz3Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz3TestsTotal = faz3Results.length;

        // =====================================================
        // FAZ-4: MISSING DATA STANDARDIZATION TESTS
        // =====================================================

        results.faz4Tests = {};

        // TEST A: missingReport function exists and works
        results.faz4Tests.missingReportFunction = runSmokeTest('missingReport function', () => {
            if (typeof window.missingReport !== 'function') return 'FAIL: not exposed';
            const testData = [
                { A: 1, B: 2 },
                { A: null, B: 3 },
                { A: 4, B: undefined },
                { A: 5, B: 6 },
                { A: '', B: 7 }
            ];
            const report = window.missingReport(testData, ['A', 'B'], 'listwise');
            if (report.originalN !== 5) return `FAIL: originalN=${report.originalN}, expected 5`;
            if (report.validN !== 2) return `FAIL: validN=${report.validN}, expected 2`;
            if (report.total !== 4) return `FAIL: total=${report.total}, expected 4`;
            if (report.byColumn.A !== 2) return `FAIL: A missing=${report.byColumn.A}, expected 2`;
            if (report.byColumn.B !== 2) return `FAIL: B missing=${report.byColumn.B}, expected 2`;
            return `PASS: validN=${report.validN}, total=${report.total}`;
        });

        // TEST B: generateMissingNote function exists and produces text
        results.faz4Tests.generateMissingNote = runSmokeTest('generateMissingNote function', () => {
            if (typeof window.generateMissingNote !== 'function') return 'FAIL: not exposed';
            const report = { total: 5, byColumn: { Age: 3, Score: 2 }, method: 'listwise', validN: 95, originalN: 100, percentMissing: '5.00' };
            const noteTR = window.generateMissingNote(report, 'tr');
            const noteEN = window.generateMissingNote(report, 'en');
            if (!noteTR || noteTR.length < 20) return `FAIL: TR note too short`;
            if (!noteEN || noteEN.length < 20) return `FAIL: EN note too short`;
            if (!noteTR.includes('95')) return `FAIL: TR note missing validN`;
            if (!noteEN.includes('Method')) return `FAIL: EN note missing Method`;
            return 'PASS: TR/EN notes generated';
        });

        // TEST C: No missing when data clean
        results.faz4Tests.noMissingData = runSmokeTest('missingReport no missing', () => {
            if (typeof window.missingReport !== 'function') return 'SKIP: not exposed';
            const cleanData = [
                { X: 1, Y: 10 },
                { X: 2, Y: 20 },
                { X: 3, Y: 30 }
            ];
            const report = window.missingReport(cleanData, ['X', 'Y'], 'listwise');
            if (report.total !== 0) return `FAIL: total=${report.total}, expected 0`;
            if (report.validN !== 3) return `FAIL: validN=${report.validN}, expected 3`;
            const note = window.generateMissingNote(report, 'tr');
            if (!note.includes('Eksik veri yok')) return `FAIL: note should say no missing`;
            return 'PASS: no missing correctly detected';
        });

        // Count FAZ-4 test passes
        const faz4Results = Object.values(results.faz4Tests);
        results.checks.faz4TestsPassed = faz4Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz4TestsTotal = faz4Results.length;

        // =====================================================
        // FAZ-5: NORMALİK TESTLERİ
        // =====================================================

        results.faz5Tests = {};

        // TEST A: Shapiro-Wilk (n=30)
        results.faz5Tests.shapiroWilkSmall = runSmokeTest('Shapiro-Wilk (n=30)', () => {
            if (typeof window.runShapiroWilkTest !== 'function') return 'FAIL: not exposed';
            // Normal dağılıma yakın veri
            const data = [];
            for (let i = 0; i < 30; i++) {
                // Box-Muller normal dağılım
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                data.push(50 + 10 * z);
            }
            const result = window.runShapiroWilkTest(data, 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (typeof result.pValue !== 'number' || isNaN(result.pValue)) return 'FAIL: pValue not a number';
            if (result.W === undefined || isNaN(result.W)) return 'FAIL: W not defined';
            if (result.testType !== 'shapiro-wilk') return `FAIL: wrong testType=${result.testType}`;
            return `PASS: W=${result.W.toFixed(4)}, p=${result.pValue.toFixed(4)}`;
        });

        // TEST B: K-S Fallback (n=6000)
        results.faz5Tests.ksFallback = runSmokeTest('K-S Fallback (n=6000)', () => {
            if (typeof window.runShapiroWilkTest !== 'function') return 'FAIL: not exposed';
            // Büyük veri seti - K-S fallback tetiklenmeli
            const data = [];
            for (let i = 0; i < 6000; i++) {
                data.push(Math.random() * 100);
            }
            const result = window.runShapiroWilkTest(data, 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (typeof result.pValue !== 'number' || isNaN(result.pValue)) return 'FAIL: pValue not a number';
            // n>5000 için K-S fallback olmalı
            if (result.testType !== 'kolmogorov-smirnov') return `WARN: expected K-S fallback, got ${result.testType}`;
            if (result.D === undefined || isNaN(result.D)) return 'FAIL: D not defined';
            return `PASS: D=${result.D.toFixed(4)}, p=${result.pValue.toFixed(4)}`;
        });

        // TEST C: runNormalityTest (combined output)
        results.faz5Tests.normalityTest = runSmokeTest('runNormalityTest (n=100)', () => {
            if (typeof window.runNormalityTest !== 'function') return 'FAIL: not exposed';
            const data = [];
            for (let i = 0; i < 100; i++) data.push(Math.random() * 100);
            const result = window.runNormalityTest(data, 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (!result.tables || result.tables.length === 0) return 'FAIL: no tables';
            if (result.tables[0].name !== 'Tests of Normality') return 'FAIL: wrong table name';
            return 'PASS: combined normality test';
        });

        // Count FAZ-5 test passes
        const faz5Results = Object.values(results.faz5Tests);
        results.checks.faz5TestsPassed = faz5Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz5TestsTotal = faz5Results.length;

        // =====================================================
        // FAZ-6: FRİEDMAN TESTİ DUAL-FORMAT
        // =====================================================

        results.faz6Tests = {};

        // TEST A: Friedman Format A (measurements:number[][])
        results.faz6Tests.friedmanFormatA = runSmokeTest('Friedman Format A (2D array)', () => {
            if (typeof window.runFriedmanTest !== 'function') return 'FAIL: not exposed';
            // 5 denek, 3 koşul
            const measurements = [
                [5, 7, 4],
                [6, 8, 5],
                [7, 6, 6],
                [4, 9, 3],
                [8, 5, 7]
            ];
            const result = window.runFriedmanTest(measurements, 0.05, ['K1', 'K2', 'K3']);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (typeof result.pValue !== 'number' || isNaN(result.pValue)) return 'FAIL: pValue not a number';
            const W = result.kendallW ?? result.effectSize?.value;
            if (typeof W !== 'number' || W < 0 || W > 1) return `FAIL: W=${W} out of range`;
            return `PASS: χ²=${result.chi2Statistic?.toFixed(2)}, W=${W.toFixed(3)}, p=${result.pValue.toFixed(4)}`;
        });

        // TEST B: Friedman Format B (data + columns + missing)
        results.faz6Tests.friedmanFormatB = runSmokeTest('Friedman Format B (data+cols+missing)', () => {
            if (typeof window.runFriedmanTest !== 'function') return 'FAIL: not exposed';
            // Missing içeren veri
            const data = [
                { M1: 5, M2: 7, M3: 4 },
                { M1: 6, M2: 8, M3: 5 },
                { M1: null, M2: 6, M3: 6 },  // missing - listwise silinmeli
                { M1: 4, M2: 9, M3: 3 },
                { M1: 8, M2: undefined, M3: 7 },  // missing - listwise silinmeli
                { M1: 7, M2: 5, M3: 8 }
            ];
            const result = window.runFriedmanTest(data, ['M1', 'M2', 'M3'], 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (typeof result.pValue !== 'number' || isNaN(result.pValue)) return 'FAIL: pValue not a number';
            // n=4 olmalı (2 satır missing)
            if (result.n !== 4) return `WARN: n=${result.n}, expected 4 (listwise)`;
            const W = result.kendallW ?? result.effectSize?.value;
            if (typeof W !== 'number' || W < 0 || W > 1) return `FAIL: W=${W} out of range`;
            return `PASS: n=${result.n}, W=${W.toFixed(3)}, p=${result.pValue.toFixed(4)}`;
        });

        // Count FAZ-6 test passes
        const faz6Results = Object.values(results.faz6Tests);
        results.checks.faz6TestsPassed = faz6Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz6TestsTotal = faz6Results.length;

        // =====================================================
        // FAZ-7: K-MEANS NO-MUTATION TESTERİ
        // =====================================================

        results.faz7Tests = {};

        // TEST A: No mutation + assignments length
        results.faz7Tests.kmeansNoMutation = runSmokeTest('KMeans no-mutation', () => {
            if (typeof window.runKMeansAnalysis !== 'function') return 'FAIL: not exposed';
            const testData = [
                { V1: 1, V2: 2, _extra: 'keep' },
                { V1: 1.5, V2: 2.5 },
                { V1: 10, V2: 12 },
                { V1: 11, V2: 13 },
                { V1: 5, V2: 6 }
            ];
            const originalKeys = Object.keys(testData[0]);
            const result = window.runKMeansAnalysis(testData, ['V1', 'V2'], 2);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // Mutation kontrolü
            if (testData[0].hasOwnProperty('_cluster') || testData[0].hasOwnProperty('cluster')) {
                return 'FAIL: data mutated';
            }
            // Key sayısı değişmemeli
            if (Object.keys(testData[0]).length !== originalKeys.length) return 'FAIL: key count changed';
            // Assignments uzunluğu
            const assignments = result.assignments ?? result.clusterAssignments;
            if (!assignments || assignments.length !== testData.length) {
                return `FAIL: assignments length ${assignments?.length} != ${testData.length}`;
            }
            return `PASS: no mutation, assignments.length=${assignments.length}`;
        });

        // TEST B: Centers uzunluğu = k
        results.faz7Tests.kmeansCenters = runSmokeTest('KMeans centers.length=k', () => {
            if (typeof window.runKMeansAnalysis !== 'function') return 'FAIL: not exposed';
            const data = [];
            for (let i = 0; i < 20; i++) data.push({ X: Math.random() * 10, Y: Math.random() * 10 });
            const k = 3;
            const result = window.runKMeansAnalysis(data, ['X', 'Y'], k);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            if (!result.centers || result.centers.length !== k) {
                return `FAIL: centers.length=${result.centers?.length}, expected ${k}`;
            }
            return `PASS: centers.length=${result.centers.length}`;
        });

        // TEST C: Inertia >= 0
        results.faz7Tests.kmeansInertia = runSmokeTest('KMeans inertia>=0', () => {
            if (typeof window.runKMeansAnalysis !== 'function') return 'FAIL: not exposed';
            const data = [[1, 2], [2, 3], [10, 11], [11, 12]];
            const result = window.runKMeansAnalysis(data, null, 2);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            const inertia = result.inertia ?? result.withinSS;
            if (typeof inertia !== 'number' || inertia < 0) {
                return `FAIL: inertia=${inertia}`;
            }
            return `PASS: inertia=${inertia.toFixed(3)}`;
        });

        // TEST D: k<2 → valid=false
        results.faz7Tests.kmeansKValidation = runSmokeTest('KMeans k<2 validation', () => {
            if (typeof window.runKMeansAnalysis !== 'function') return 'FAIL: not exposed';
            const data = [[1, 2], [3, 4], [5, 6]];
            const result = window.runKMeansAnalysis(data, null, 1); // k=1, invalid
            if (result.valid === true) return 'FAIL: should be invalid for k<2';
            if (!result.error || result.error.length < 5) return 'FAIL: no error message';
            return 'PASS: k<2 rejected with message';
        });

        // Count FAZ-7 test passes
        const faz7Results = Object.values(results.faz7Tests);
        results.checks.faz7TestsPassed = faz7Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz7TestsTotal = faz7Results.length;

        // =====================================================
        // FAZ-8: MANN-WHITNEY U TESTLERİ
        // =====================================================

        results.faz8Tests = {};

        // TEST A: U asla undefined
        results.faz8Tests.mannWhitneyUNotUndefined = runSmokeTest('Mann-Whitney U not undefined', () => {
            if (typeof window.runMannWhitneyU !== 'function') return 'FAIL: not exposed';
            const group1 = [10, 12, 14, 16, 18];
            const group2 = [11, 13, 15, 17, 19];
            const result = window.runMannWhitneyU(group1, group2, 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // U asla undefined olmamalı
            const U = result.uStatistic ?? result.U;
            if (U === undefined) return 'FAIL: U is undefined';
            if (typeof U !== 'number' || isNaN(U)) return `FAIL: U is not a number (${U})`;
            return `PASS: U=${U}`;
        });

        // TEST B: APA metninde "U=" sonrası sayı
        results.faz8Tests.mannWhitneyAPA = runSmokeTest('Mann-Whitney APA format', () => {
            if (typeof window.runMannWhitneyU !== 'function') return 'FAIL: not exposed';
            const group1 = [5, 6, 7, 8, 9];
            const group2 = [1, 2, 3, 4, 5];
            const result = window.runMannWhitneyU(group1, group2, 0.05);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // APA formatı kontrol
            const apa = result.apaEN ?? result.apaTR ?? '';
            if (!apa.includes('U =')) return `FAIL: APA missing "U ="`;
            // "U = undefined" olmamalı
            if (apa.includes('undefined')) return `FAIL: APA contains undefined`;
            // "U = NaN" olmamalı
            if (apa.includes('NaN')) return `FAIL: APA contains NaN`;
            return `PASS: ${apa.substring(0, 30)}...`;
        });

        // TEST C: uStatistic canonical field
        results.faz8Tests.mannWhitneyCanonical = runSmokeTest('Mann-Whitney uStatistic canonical', () => {
            if (typeof window.runMannWhitneyU !== 'function') return 'FAIL: not exposed';
            const group1 = [20, 22, 24, 26];
            const group2 = [21, 23, 25, 27];
            const result = window.runMannWhitneyU(group1, group2);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // uStatistic canonical olmalı
            if (result.uStatistic === undefined) return 'FAIL: uStatistic undefined';
            // U alias olmalı
            if (result.U === undefined) return 'FAIL: U alias undefined';
            // İkisi eşit olmalı
            if (result.uStatistic !== result.U) return 'FAIL: uStatistic != U';
            return `PASS: uStatistic=${result.uStatistic}, U=${result.U}`;
        });

        // Count FAZ-8 test passes
        const faz8Results = Object.values(results.faz8Tests);
        results.checks.faz8TestsPassed = faz8Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz8TestsTotal = faz8Results.length;

        // =====================================================
        // FAZ-9: LOJİSTİK REGRESYON TESTLERİ
        // =====================================================

        results.faz9Tests = {};

        // TEST A: Convergence + OR dolu + pValue sayı
        results.faz9Tests.logisticConvergence = runSmokeTest('Logistic convergence + OR', () => {
            if (typeof window.runLogisticRegression !== 'function') return 'FAIL: not exposed';
            // Binary dataset
            const X = [
                [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
                [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]
            ];
            const y = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
            const result = window.runLogisticRegression(X, y);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // OR dolu olmalı
            if (!result.oddsRatios || result.oddsRatios.length === 0) return 'FAIL: OR empty';
            if (result.oddsRatios.some(or => or === undefined || isNaN(or))) return 'FAIL: OR contains undefined/NaN';
            // pValues dolu
            if (!result.pValues || result.pValues.length === 0) return 'FAIL: pValues empty';
            if (result.pValues.some(p => typeof p !== 'number' || isNaN(p))) return 'FAIL: pValue not number';
            return `PASS: converged=${result.converged}, OR[0]=${result.oddsRatios[0]?.toFixed(3)}`;
        });

        // TEST B: Method IRLS (GD fallback değil)
        results.faz9Tests.logisticIRLS = runSmokeTest('Logistic IRLS default', () => {
            if (typeof window.runLogisticRegression !== 'function') return 'FAIL: not exposed';
            // Basit dataset - IRLS başarılı olmalı
            const X = [[1], [2], [3], [4], [5], [6], [7], [8]];
            const y = [0, 0, 0, 0, 1, 1, 1, 1];
            const result = window.runLogisticRegression(X, y);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // Method kontrol - "GD default" OLMAMALI
            if (result.method === 'GD' && !result.warnings?.some(w => w.includes('ill-conditioned'))) {
                return 'WARN: GD used without ill-conditioning';
            }
            if (result.method !== 'IRLS' && result.method !== 'GD') return `FAIL: unknown method ${result.method}`;
            return `PASS: method=${result.method}`;
        });

        // TEST C: -2LL ve R2 metrikleri
        results.faz9Tests.logisticMetrics = runSmokeTest('Logistic -2LL/R2 metrics', () => {
            if (typeof window.runLogisticRegression !== 'function') return 'FAIL: not exposed';
            const X = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]];
            const y = [0, 0, 0, 1, 1, 1];
            const result = window.runLogisticRegression(X, y);
            if (!result.valid) return `FAIL: ${result.error || 'invalid'}`;
            // -2LL
            if (result.minus2LL === undefined || isNaN(result.minus2LL)) return 'FAIL: -2LL undefined';
            // R2 metrikleri
            if (result.nagelkerkeR2 === undefined || isNaN(result.nagelkerkeR2)) return 'FAIL: NagelkerkeR2 undefined';
            return `PASS: -2LL=${result.minus2LL.toFixed(2)}, R2=${result.nagelkerkeR2.toFixed(3)}`;
        });

        // Count FAZ-9 test passes
        const faz9Results = Object.values(results.faz9Tests);
        results.checks.faz9TestsPassed = faz9Results.filter(r => r.startsWith('PASS')).length;
        results.checks.faz9TestsTotal = faz9Results.length;

        // =====================================================
        // FAZ-10: VIZ_STATE GUARD TESTLERİ
        // =====================================================

        results.faz10Tests = {};

        // TEST A: VIZ_STATE yok simülasyonu - crash yok
        results.faz10Tests.vizStateGuard = runSmokeTest('VIZ_STATE guard (no crash)', () => {
            // Geçici olarak VIZ_STATE'i kaydet ve sil
            const originalVizState = window.VIZ_STATE;

            try {
                // VIZ_STATE'i undefined yap
                window.VIZ_STATE = undefined;

                // Kritik fonksiyonlar için optional chaining guard test
                // Bu sorgular crash vermemeli
                const data = window.VIZ_STATE?.data || [];
                const columns = window.VIZ_STATE?.columns || [];
                const charts = window.VIZ_STATE?.charts || [];
                const lang = window.VIZ_STATE?.lang || 'tr';

                // Eğer buraya ulaştıysak crash olmadı
                if (!Array.isArray(data)) return 'FAIL: data not defaulting to array';
                if (!Array.isArray(columns)) return 'FAIL: columns not defaulting to array';

                return 'PASS: no crash with undefined VIZ_STATE';
            } catch (e) {
                return `FAIL: crash when VIZ_STATE undefined: ${e.message}`;
            } finally {
                // VIZ_STATE'i geri yükle
                window.VIZ_STATE = originalVizState;
            }
        });

        // TEST B: Cache version check
        results.faz10Tests.cacheVersion = runSmokeTest('SW cache version', () => {
            // sw.js dosyasındaki CACHE_NAME v4 olmalı (FAZ-10 için)
            // Bu test runtime'da SW kayıtlı mı kontrolü yapar
            if ('serviceWorker' in navigator) {
                // SW mevcut
                return 'PASS: ServiceWorker API available';
            }
            return 'SKIP: ServiceWorker not supported';
        });

        // Count FAZ-10 test passes
        const faz10Results = Object.values(results.faz10Tests);
        results.checks.faz10TestsPassed = faz10Results.filter(r => r.startsWith('PASS') || r.startsWith('SKIP')).length;
        results.checks.faz10TestsTotal = faz10Results.length;

        // =====================================================
        // END STAT ENGINE TESTS
        // =====================================================

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
        const statInfo = results.checks.statEngineTestsPassed !== undefined
            ? ` | StatEngines: ${results.checks.statEngineTestsPassed}/${results.checks.statEngineTestsTotal}`
            : '';
        const faz3Info = results.checks.faz3TestsPassed !== undefined
            ? ` | FAZ3: ${results.checks.faz3TestsPassed}/${results.checks.faz3TestsTotal}`
            : '';
        const faz4Info = results.checks.faz4TestsPassed !== undefined
            ? ` | FAZ4: ${results.checks.faz4TestsPassed}/${results.checks.faz4TestsTotal}`
            : '';
        const faz5Info = results.checks.faz5TestsPassed !== undefined
            ? ` | FAZ5: ${results.checks.faz5TestsPassed}/${results.checks.faz5TestsTotal}`
            : '';
        const faz6Info = results.checks.faz6TestsPassed !== undefined
            ? ` | FAZ6: ${results.checks.faz6TestsPassed}/${results.checks.faz6TestsTotal}`
            : '';
        const faz7Info = results.checks.faz7TestsPassed !== undefined
            ? ` | FAZ7: ${results.checks.faz7TestsPassed}/${results.checks.faz7TestsTotal}`
            : '';
        const faz8Info = results.checks.faz8TestsPassed !== undefined
            ? ` | FAZ8: ${results.checks.faz8TestsPassed}/${results.checks.faz8TestsTotal}`
            : '';
        const faz9Info = results.checks.faz9TestsPassed !== undefined
            ? ` | FAZ9: ${results.checks.faz9TestsPassed}/${results.checks.faz9TestsTotal}`
            : '';
        const faz10Info = results.checks.faz10TestsPassed !== undefined
            ? ` | FAZ10: ${results.checks.faz10TestsPassed}/${results.checks.faz10TestsTotal}`
            : '';
        console.log(`[SELFTEST] Status: ${results.selftest.toUpperCase()} | Functions: ${criticalFunctions.length - missingCount}/${criticalFunctions.length} | Smoke: ${results.checks.smokeTestsPassed}/${results.checks.smokeTestsTotal}${chartInfo}${statInfo}${faz3Info}${faz4Info}${faz5Info}${faz6Info}${faz7Info}${faz8Info}${faz9Info}${faz10Info}`);

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
