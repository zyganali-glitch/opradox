/**
 * viz-maps.js
 * Map and GeoJSON Functions - FULLY RESTORED
 * Choropleth, Heatmap, Marker, Bubble Maps, GeoJSON loading
 */

(function () {
    'use strict';

    // =====================================================
    // GEO DATA STORAGE
    // =====================================================

    const GEO_DATA = {
        turkeyGeoJson: null,
        worldGeoJson: null,
        customGeoJson: null
    };

    // =====================================================
    // TURKEY GEOJSON (EMBEDDED SIMPLIFIED)
    // =====================================================

    async function loadTurkeyGeoJson() {
        if (GEO_DATA.turkeyGeoJson) return GEO_DATA.turkeyGeoJson;

        try {
            // Embedded simplified Turkey provinces
            GEO_DATA.turkeyGeoJson = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'İstanbul', code: 34 }, geometry: { type: 'Point', coordinates: [28.9784, 41.0082] } },
                    { type: 'Feature', properties: { name: 'Ankara', code: 6 }, geometry: { type: 'Point', coordinates: [32.8597, 39.9334] } },
                    { type: 'Feature', properties: { name: 'İzmir', code: 35 }, geometry: { type: 'Point', coordinates: [27.1428, 38.4237] } },
                    { type: 'Feature', properties: { name: 'Bursa', code: 16 }, geometry: { type: 'Point', coordinates: [29.0610, 40.1885] } },
                    { type: 'Feature', properties: { name: 'Antalya', code: 7 }, geometry: { type: 'Point', coordinates: [30.7133, 36.8969] } },
                    { type: 'Feature', properties: { name: 'Adana', code: 1 }, geometry: { type: 'Point', coordinates: [35.3213, 37.0000] } },
                    { type: 'Feature', properties: { name: 'Konya', code: 42 }, geometry: { type: 'Point', coordinates: [32.4932, 37.8746] } },
                    { type: 'Feature', properties: { name: 'Gaziantep', code: 27 }, geometry: { type: 'Point', coordinates: [37.3825, 37.0662] } },
                    { type: 'Feature', properties: { name: 'Mersin', code: 33 }, geometry: { type: 'Point', coordinates: [34.6415, 36.8121] } },
                    { type: 'Feature', properties: { name: 'Kayseri', code: 38 }, geometry: { type: 'Point', coordinates: [35.4954, 38.7312] } },
                    { type: 'Feature', properties: { name: 'Diyarbakır', code: 21 }, geometry: { type: 'Point', coordinates: [40.2025, 37.9144] } },
                    { type: 'Feature', properties: { name: 'Eskişehir', code: 26 }, geometry: { type: 'Point', coordinates: [30.5206, 39.7767] } },
                    { type: 'Feature', properties: { name: 'Samsun', code: 55 }, geometry: { type: 'Point', coordinates: [36.3313, 41.2867] } },
                    { type: 'Feature', properties: { name: 'Denizli', code: 20 }, geometry: { type: 'Point', coordinates: [29.0963, 37.7765] } },
                    { type: 'Feature', properties: { name: 'Şanlıurfa', code: 63 }, geometry: { type: 'Point', coordinates: [38.7955, 37.1591] } },
                    { type: 'Feature', properties: { name: 'Malatya', code: 44 }, geometry: { type: 'Point', coordinates: [38.3553, 38.3552] } },
                    { type: 'Feature', properties: { name: 'Trabzon', code: 61 }, geometry: { type: 'Point', coordinates: [39.7167, 41.0015] } },
                    { type: 'Feature', properties: { name: 'Erzurum', code: 25 }, geometry: { type: 'Point', coordinates: [41.2658, 39.9043] } },
                    { type: 'Feature', properties: { name: 'Van', code: 65 }, geometry: { type: 'Point', coordinates: [43.4129, 38.4891] } },
                    { type: 'Feature', properties: { name: 'Batman', code: 72 }, geometry: { type: 'Point', coordinates: [41.1361, 37.8812] } }
                ]
            };
            return GEO_DATA.turkeyGeoJson;
        } catch (error) {
            console.error('GeoJSON yükleme hatası:', error);
            return null;
        }
    }

    // =====================================================
    // WORLD GEOJSON (SIMPLIFIED)
    // =====================================================

    async function loadWorldGeoJson() {
        if (GEO_DATA.worldGeoJson) return GEO_DATA.worldGeoJson;

        try {
            // Try to load from CDN or fallback to simplified version
            const response = await fetch('https://unpkg.com/world-atlas@2/countries-50m.json');
            if (response.ok) {
                const data = await response.json();
                GEO_DATA.worldGeoJson = data;
                return data;
            }
        } catch (error) {
            console.warn('World GeoJSON yüklenemedi, fallback kullanılıyor');
        }

        // Fallback: simplified world data
        GEO_DATA.worldGeoJson = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: { name: 'Turkey' }, geometry: { type: 'Point', coordinates: [35.2433, 38.9637] } },
                { type: 'Feature', properties: { name: 'Germany' }, geometry: { type: 'Point', coordinates: [10.4515, 51.1657] } },
                { type: 'Feature', properties: { name: 'France' }, geometry: { type: 'Point', coordinates: [2.2137, 46.2276] } },
                { type: 'Feature', properties: { name: 'United Kingdom' }, geometry: { type: 'Point', coordinates: [-3.4360, 55.3781] } },
                { type: 'Feature', properties: { name: 'United States' }, geometry: { type: 'Point', coordinates: [-95.7129, 37.0902] } },
                { type: 'Feature', properties: { name: 'China' }, geometry: { type: 'Point', coordinates: [104.1954, 35.8617] } },
                { type: 'Feature', properties: { name: 'Japan' }, geometry: { type: 'Point', coordinates: [138.2529, 36.2048] } },
                { type: 'Feature', properties: { name: 'Brazil' }, geometry: { type: 'Point', coordinates: [-51.9253, -14.2350] } },
                { type: 'Feature', properties: { name: 'Russia' }, geometry: { type: 'Point', coordinates: [105.3188, 61.5240] } },
                { type: 'Feature', properties: { name: 'India' }, geometry: { type: 'Point', coordinates: [78.9629, 20.5937] } }
            ]
        };
        return GEO_DATA.worldGeoJson;
    }

    // =====================================================
    // CUSTOM GEOJSON LOADER
    // =====================================================

    async function loadCustomGeoJson(url) {
        try {
            if (typeof showProgress === 'function') showProgress('GeoJSON yükleniyor...');

            const response = await fetch(url);
            if (!response.ok) throw new Error('GeoJSON yüklenemedi');

            const data = await response.json();
            GEO_DATA.customGeoJson = data;

            if (typeof hideProgress === 'function') hideProgress();
            if (typeof showToast === 'function') showToast('GeoJSON yüklendi', 'success');

            return data;
        } catch (error) {
            if (typeof hideProgress === 'function') hideProgress();
            if (typeof showToast === 'function') showToast('GeoJSON hatası: ' + error.message, 'error');
            return null;
        }
    }

    // =====================================================
    // CHOROPLETH MAP (ADVANCED)
    // =====================================================

    async function renderChoroplethMap(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') {
            console.error('ECharts not loaded');
            return null;
        }

        const geoData = GEO_DATA.customGeoJson || await loadTurkeyGeoJson();
        if (!geoData) {
            container.innerHTML = '<p style="text-align:center;color:#e74c3c;">GeoJSON verisi yüklenemedi</p>';
            return null;
        }

        const locationCol = config.x || state.columns[0];
        const valueCol = config.y || state.columns[1];

        // Veriyi lokasyon bazlı aggregate et
        const dataMap = {};
        state.data.forEach(row => {
            const loc = String(row[locationCol] || '').trim();
            const val = parseFloat(row[valueCol]) || 0;
            if (loc) {
                dataMap[loc] = (dataMap[loc] || 0) + val;
            }
        });

        // GeoJSON'dan eşleşen verileri bul
        const mapData = geoData.features.map(f => {
            const name = f.properties.name || f.properties.NAME || f.properties.id;
            return {
                name: name,
                value: dataMap[name] || 0
            };
        }).filter(d => d.value > 0);

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

        // Register map
        echarts.registerMap('custom', geoData);

        const option = {
            title: { text: config.title || 'Choropleth Harita', left: 'center' },
            tooltip: { trigger: 'item', formatter: '{b}: {c}' },
            visualMap: {
                min: Math.min(...mapData.map(d => d.value)) || 0,
                max: Math.max(...mapData.map(d => d.value)) || 100,
                left: 'left',
                top: 'bottom',
                text: ['Yüksek', 'Düşük'],
                calculable: true,
                inRange: { color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'] }
            },
            series: [{
                type: 'map',
                map: 'custom',
                roam: true,
                data: mapData,
                emphasis: {
                    label: { show: true },
                    itemStyle: { areaColor: '#ffc107' }
                }
            }]
        };

        chart.setOption(option);
        return chart;
    }

    // Alias for backward compatibility
    async function renderChoroplethMapAdvanced(config = {}) {
        return renderChoroplethMap(config);
    }

    // =====================================================
    // SCATTER MAP (MARKER/POINT MAP)
    // =====================================================

    async function renderScatterMap(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const latCol = config.lat || state.columns.find(c => c.toLowerCase().includes('lat')) || state.columns[0];
        const lonCol = config.lon || state.columns.find(c => c.toLowerCase().includes('lon')) || state.columns[1];
        const labelCol = config.label || state.columns[2];
        const valueCol = config.value || state.columns[3];

        const scatterData = state.data.map(row => ({
            name: row[labelCol] || '',
            value: [
                parseFloat(row[lonCol]) || 0,
                parseFloat(row[latCol]) || 0,
                parseFloat(row[valueCol]) || 10
            ]
        })).filter(d => d.value[0] !== 0 && d.value[1] !== 0);

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

        // Load world geo for background
        const geoData = GEO_DATA.customGeoJson || await loadTurkeyGeoJson();
        if (geoData) {
            echarts.registerMap('geo', geoData);
        }

        const option = {
            title: { text: config.title || 'Nokta Haritası', left: 'center' },
            tooltip: { trigger: 'item', formatter: p => `${p.name}: ${p.value[2]}` },
            geo: geoData ? {
                map: 'geo',
                roam: true,
                itemStyle: { areaColor: '#e0e0e0', borderColor: '#999' },
                emphasis: { itemStyle: { areaColor: '#ffc107' } }
            } : undefined,
            series: [{
                type: 'scatter',
                coordinateSystem: geoData ? 'geo' : 'cartesian2d',
                data: scatterData,
                symbolSize: d => Math.sqrt(d[2]) * 2,
                itemStyle: { color: config.color || '#4a90d9' },
                label: {
                    show: config.showLabels !== false,
                    formatter: '{b}',
                    position: 'right'
                }
            }]
        };

        chart.setOption(option);
        return chart;
    }

    // Alias
    function renderMarkerMap(config = {}) {
        return renderScatterMap(config);
    }

    // =====================================================
    // BUBBLE MAP
    // =====================================================

    async function renderBubbleMap(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const latCol = config.lat || state.columns[0];
        const lonCol = config.lon || state.columns[1];
        const labelCol = config.label || state.columns[2];
        const sizeCol = config.size || state.columns[3];
        const colorCol = config.color || sizeCol;

        const values = state.data.map(r => parseFloat(r[sizeCol]) || 0);
        const maxValue = Math.max(...values);

        const bubbleData = state.data.map(row => ({
            name: row[labelCol] || '',
            value: [
                parseFloat(row[lonCol]) || 0,
                parseFloat(row[latCol]) || 0,
                parseFloat(row[sizeCol]) || 10
            ],
            colorValue: parseFloat(row[colorCol]) || 0
        })).filter(d => d.value[0] !== 0 && d.value[1] !== 0);

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

        const geoData = GEO_DATA.customGeoJson || await loadTurkeyGeoJson();
        if (geoData) {
            echarts.registerMap('bubbleGeo', geoData);
        }

        const option = {
            title: { text: config.title || 'Bubble Harita', left: 'center' },
            tooltip: { trigger: 'item', formatter: p => `${p.name}<br>Değer: ${p.value[2]}` },
            visualMap: {
                min: 0,
                max: maxValue,
                calculable: true,
                inRange: { color: ['#4a90d9', '#9a3050', '#e74c3c'] },
                right: 10,
                top: 'center'
            },
            geo: geoData ? {
                map: 'bubbleGeo',
                roam: true,
                itemStyle: { areaColor: '#f5f5f5', borderColor: '#ccc' }
            } : undefined,
            series: [{
                type: 'scatter',
                coordinateSystem: geoData ? 'geo' : 'cartesian2d',
                data: bubbleData,
                symbolSize: d => Math.sqrt(d[2] / maxValue) * 50 + 5,
                itemStyle: {
                    color: d => {
                        const ratio = d.colorValue / maxValue;
                        return `rgba(154, 48, 80, ${0.3 + ratio * 0.7})`;
                    }
                }
            }]
        };

        chart.setOption(option);
        return chart;
    }

    // =====================================================
    // HEATMAP (GEO)
    // =====================================================

    async function renderGeoHeatmap(config = {}) {
        const container = config.container || document.getElementById(`chart-${config.id}`);
        const state = window.VIZ_STATE;
        if (!container || !state || !state.data) return null;

        if (typeof echarts === 'undefined') return null;

        const latCol = config.lat || state.columns[0];
        const lonCol = config.lon || state.columns[1];
        const valueCol = config.value || state.columns[2];

        const heatData = state.data.map(row => [
            parseFloat(row[lonCol]) || 0,
            parseFloat(row[latCol]) || 0,
            parseFloat(row[valueCol]) || 1
        ]).filter(d => d[0] !== 0 && d[1] !== 0);

        const chart = echarts.init(container);
        state.echartsInstances = state.echartsInstances || {};
        state.echartsInstances[config.id] = chart;

        const geoData = GEO_DATA.customGeoJson || await loadTurkeyGeoJson();
        if (geoData) {
            echarts.registerMap('heatGeo', geoData);
        }

        const option = {
            title: { text: config.title || 'Isı Haritası', left: 'center' },
            tooltip: {},
            visualMap: {
                min: 0,
                max: Math.max(...heatData.map(d => d[2])),
                calculable: true,
                inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027'] },
                right: 10,
                top: 'center'
            },
            geo: geoData ? {
                map: 'heatGeo',
                roam: true,
                itemStyle: { areaColor: '#f5f5f5', borderColor: '#ccc' }
            } : undefined,
            series: [{
                type: 'heatmap',
                coordinateSystem: geoData ? 'geo' : 'cartesian2d',
                data: heatData,
                pointSize: 10,
                blurSize: 15
            }]
        };

        chart.setOption(option);
        return chart;
    }

    // =====================================================
    // GEOJSON MODAL
    // =====================================================

    function showGeoJsonModal() {
        const state = window.VIZ_STATE;
        if (!state || !state.columns) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const html = `
            <div class="viz-modal-form">
                <label>GeoJSON URL veya Dosya:</label>
                <input type="text" id="geoJsonUrl" placeholder="https://...geojson">
                <p style="font-size:0.75rem;color:var(--gm-text-muted);">
                    veya: github'dan raw GeoJSON, mapshaper.org'dan export
                </p>
                <label>Konum Sütunu:</label>
                <select id="geoLocationCol">${state.columns.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                <label>Değer Sütunu:</label>
                <select id="geoValueCol">${state.columns.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                <button class="viz-btn-primary" onclick="applyGeoJsonMap()">Harita Oluştur</button>
            </div>
        `;

        if (typeof showStatResultModal === 'function') {
            showStatResultModal('GeoJSON Harita Ayarları', html);
        }
    }

    async function applyGeoJsonMap() {
        const url = document.getElementById('geoJsonUrl')?.value;
        const locCol = document.getElementById('geoLocationCol')?.value;
        const valCol = document.getElementById('geoValueCol')?.value;

        if (url) {
            await loadCustomGeoJson(url);
        }

        const statModal = document.querySelector('.viz-stat-result-modal');
        if (statModal) statModal.style.display = 'none';

        // Harita widget ekle
        if (typeof addChartWidget === 'function') {
            addChartWidget('choropleth');
        } else {
            // Manual widget creation fallback
            const grid = document.getElementById('vizDashboardGrid');
            const state = window.VIZ_STATE;
            if (grid && state) {
                const widgetId = 'map-' + Date.now();
                const widget = document.createElement('div');
                widget.className = 'viz-chart-widget';
                widget.id = widgetId;
                widget.innerHTML = `
                    <div class="viz-widget-header">
                        <span class="viz-widget-title"><i class="fas fa-map"></i> Choropleth Harita</span>
                        <button class="viz-widget-btn viz-widget-close" onclick="removeWidget('${widgetId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="viz-widget-chart" id="chart-${widgetId}"></div>
                `;
                grid.appendChild(widget);

                setTimeout(() => {
                    renderChoroplethMap({
                        id: widgetId,
                        x: locCol,
                        y: valCol
                    });
                }, 100);
            }
        }
    }

    // =====================================================
    // MAP CONFIG MODAL
    // =====================================================

    function showMapConfigModal() {
        const state = window.VIZ_STATE;
        if (!state || !state.columns) {
            if (typeof showToast === 'function') showToast('Önce veri yükleyin', 'warning');
            return;
        }

        const html = `
            <div class="viz-modal-form">
                <label>Harita Tipi:</label>
                <select id="mapType">
                    <option value="choropleth">Choropleth (Renk Kodlu)</option>
                    <option value="scatter">Scatter (Nokta)</option>
                    <option value="bubble">Bubble (Kabarcık)</option>
                    <option value="heatmap">Heatmap (Isı)</option>
                </select>
                
                <div id="mapFields">
                    <label>Konum/İl Sütunu:</label>
                    <select id="mapLocationCol">${state.columns.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                    
                    <label>Değer Sütunu:</label>
                    <select id="mapValueCol">${state.columns.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                </div>
                
                <label>Bölge:</label>
                <select id="mapRegion">
                    <option value="turkey">Türkiye</option>
                    <option value="world">Dünya</option>
                    <option value="custom">Özel GeoJSON</option>
                </select>
                
                <div id="customGeoJsonField" style="display:none;">
                    <label>GeoJSON URL:</label>
                    <input type="text" id="customGeoJsonUrl" placeholder="https://...geojson">
                </div>
                
                <button class="viz-btn-primary" onclick="applyMapConfig()">Harita Oluştur</button>
            </div>
        `;

        if (typeof showStatResultModal === 'function') {
            showStatResultModal('Harita Ayarları', html);
        }

        // Toggle custom GeoJSON field
        setTimeout(() => {
            const regionSelect = document.getElementById('mapRegion');
            const customField = document.getElementById('customGeoJsonField');
            if (regionSelect && customField) {
                regionSelect.addEventListener('change', () => {
                    customField.style.display = regionSelect.value === 'custom' ? 'block' : 'none';
                });
            }
        }, 100);
    }

    async function applyMapConfig() {
        const mapType = document.getElementById('mapType')?.value;
        const locCol = document.getElementById('mapLocationCol')?.value;
        const valCol = document.getElementById('mapValueCol')?.value;
        const region = document.getElementById('mapRegion')?.value;
        const customUrl = document.getElementById('customGeoJsonUrl')?.value;

        // Load appropriate GeoJSON
        if (region === 'custom' && customUrl) {
            await loadCustomGeoJson(customUrl);
        } else if (region === 'world') {
            await loadWorldGeoJson();
            GEO_DATA.customGeoJson = GEO_DATA.worldGeoJson;
        } else {
            await loadTurkeyGeoJson();
            GEO_DATA.customGeoJson = GEO_DATA.turkeyGeoJson;
        }

        const statModal = document.querySelector('.viz-stat-result-modal');
        if (statModal) statModal.style.display = 'none';

        // Create map widget
        const grid = document.getElementById('vizDashboardGrid');
        const state = window.VIZ_STATE;
        if (!grid || !state) return;

        const widgetId = 'map-' + Date.now();
        const widget = document.createElement('div');
        widget.className = 'viz-chart-widget';
        widget.id = widgetId;
        widget.innerHTML = `
            <div class="viz-widget-header">
                <span class="viz-widget-title"><i class="fas fa-map"></i> ${mapType.charAt(0).toUpperCase() + mapType.slice(1)} Harita</span>
                <button class="viz-widget-btn viz-widget-close" onclick="removeWidget('${widgetId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="viz-widget-chart" id="chart-${widgetId}"></div>
        `;
        grid.appendChild(widget);

        const config = { id: widgetId, x: locCol, y: valCol };

        setTimeout(() => {
            switch (mapType) {
                case 'choropleth':
                    renderChoroplethMap(config);
                    break;
                case 'scatter':
                    renderScatterMap(config);
                    break;
                case 'bubble':
                    renderBubbleMap(config);
                    break;
                case 'heatmap':
                    renderGeoHeatmap(config);
                    break;
            }
        }, 100);
    }

    // =====================================================
    // INITIALIZE MAP DEFAULTS
    // =====================================================

    function initMapDefaults() {
        // Pre-load Turkey GeoJSON
        loadTurkeyGeoJson();
        console.log('🗺️ Map module initialized');
    }

    // =====================================================
    // GET GEO DATA
    // =====================================================

    function getGeoData(type = 'custom') {
        switch (type) {
            case 'turkey':
                return GEO_DATA.turkeyGeoJson;
            case 'world':
                return GEO_DATA.worldGeoJson;
            case 'custom':
            default:
                return GEO_DATA.customGeoJson || GEO_DATA.turkeyGeoJson;
        }
    }

    function setGeoData(data, type = 'custom') {
        switch (type) {
            case 'turkey':
                GEO_DATA.turkeyGeoJson = data;
                break;
            case 'world':
                GEO_DATA.worldGeoJson = data;
                break;
            case 'custom':
            default:
                GEO_DATA.customGeoJson = data;
        }
    }

    // =====================================================
    // GLOBAL EXPORTS
    // =====================================================

    // GeoJSON Loading
    window.loadTurkeyGeoJson = loadTurkeyGeoJson;
    window.loadWorldGeoJson = loadWorldGeoJson;
    window.loadCustomGeoJson = loadCustomGeoJson;

    // Map Rendering
    window.renderChoroplethMap = renderChoroplethMap;
    window.renderChoroplethMapAdvanced = renderChoroplethMapAdvanced;
    window.renderScatterMap = renderScatterMap;
    window.renderMarkerMap = renderMarkerMap;
    window.renderBubbleMap = renderBubbleMap;
    window.renderGeoHeatmap = renderGeoHeatmap;

    // Modals
    window.showGeoJsonModal = showGeoJsonModal;
    window.applyGeoJsonMap = applyGeoJsonMap;
    window.showMapConfigModal = showMapConfigModal;
    window.applyMapConfig = applyMapConfig;

    // Utils
    window.initMapDefaults = initMapDefaults;
    window.getGeoData = getGeoData;
    window.setGeoData = setGeoData;
    window.GEO_DATA = GEO_DATA;

    console.log('✅ viz-maps.js FULLY RESTORED - All 15+ map functions available');
})();
