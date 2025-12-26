/**
 * viz-cache.js
 * Caching Strategy for Repeated Calculations
 * 5-minute TTL, FIFO eviction at 50 items
 */

(function () {
    'use strict';

    const VIZ_CACHE = {
        storage: new Map(),
        maxSize: 50,
        ttl: 5 * 60 * 1000, // 5 dakika

        generateKey(type, params) {
            return `${type}:${JSON.stringify(params)}`;
        },

        get(type, params) {
            const key = this.generateKey(type, params);
            const cached = this.storage.get(key);

            if (!cached) return null;

            // TTL kontrolu
            if (Date.now() - cached.timestamp > this.ttl) {
                this.storage.delete(key);
                return null;
            }

            console.log('Cache hit:', key);
            return cached.data;
        },

        set(type, params, data) {
            const key = this.generateKey(type, params);

            // Max size kontrolu (FIFO)
            if (this.storage.size >= this.maxSize) {
                const oldest = this.storage.keys().next().value;
                this.storage.delete(oldest);
            }

            this.storage.set(key, {
                data,
                timestamp: Date.now()
            });

            console.log('Cache set:', key);
        },

        clear() {
            this.storage.clear();
            console.log('Cache cleared');
        },

        stats() {
            return {
                size: this.storage.size,
                maxSize: this.maxSize,
                ttl: this.ttl
            };
        }
    };

    /**
     * Cached aggregation wrapper
     * @param {Array} data - Data array
     * @param {string} xCol - X column name
     * @param {string} yCol - Y column name
     * @param {string} aggType - Aggregation type (sum, avg, count, min, max)
     * @returns {Object} Aggregated result
     */
    function cachedAggregate(data, xCol, yCol, aggType) {
        const cached = VIZ_CACHE.get('aggregate', { xCol, yCol, aggType, dataHash: data.length });
        if (cached) return cached;

        if (typeof aggregateData === 'function') {
            const result = aggregateData(data, xCol, yCol, aggType);
            VIZ_CACHE.set('aggregate', { xCol, yCol, aggType, dataHash: data.length }, result);
            return result;
        }

        return null;
    }

    // Global exports
    window.VIZ_CACHE = VIZ_CACHE;
    window.cachedAggregate = cachedAggregate;

    console.log('✅ viz-cache.js Loaded');
})();
