/**
 * QueryCache
 * Implements caching for database queries to improve performance
 */
class QueryCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
        this.maxSize = options.maxSize || 100; // Maximum cache entries
        this.enabled = options.enabled !== false;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    /**
     * Generate cache key from query parameters
     * @param {string} queryName - Name of the query
     * @param {Object} params - Query parameters
     * @returns {string} Cache key
     */
    generateKey(queryName, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});
        return `${queryName}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Get cached result
     * @param {string} queryName - Name of the query
     * @param {Object} params - Query parameters
     * @returns {*} Cached result or null if not found/expired
     */
    get(queryName, params = {}) {
        if (!this.enabled) return null;

        const key = this.generateKey(queryName, params);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // Update access time for LRU
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        return entry.data;
    }

    /**
     * Set cache entry
     * @param {string} queryName - Name of the query
     * @param {Object} params - Query parameters
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    set(queryName, params = {}, data, ttl = null) {
        if (!this.enabled) return;

        const key = this.generateKey(queryName, params);
        const expiresAt = Date.now() + (ttl || this.defaultTTL);

        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            expiresAt,
            lastAccessed: Date.now(),
            createdAt: Date.now()
        });
    }

    /**
     * Invalidate cache entries by query name or pattern
     * @param {string|RegExp} pattern - Query name or pattern to match
     */
    invalidate(pattern) {
        if (!this.enabled) return;

        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (typeof pattern === 'string') {
                if (key.startsWith(pattern)) {
                    keysToDelete.push(key);
                }
            } else if (pattern instanceof RegExp) {
                if (pattern.test(key)) {
                    keysToDelete.push(key);
                }
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Invalidate all cache entries
     */
    invalidateAll() {
        this.cache.clear();
    }

    /**
     * Evict oldest (least recently used) entry
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Wrap a query function with caching
     * @param {string} queryName - Name of the query
     * @param {Function} queryFn - Async query function
     * @param {Object} params - Query parameters
     * @param {Object} options - Cache options (ttl, forceRefresh)
     * @returns {Promise} Query result
     */
    async wrap(queryName, queryFn, params = {}, options = {}) {
        if (!this.enabled || options.forceRefresh) {
            const result = await queryFn();
            if (!options.skipCache) {
                this.set(queryName, params, result, options.ttl);
            }
            return result;
        }

        // Try to get from cache
        const cached = this.get(queryName, params);
        if (cached !== null) {
            return cached;
        }

        // Execute query and cache result
        const result = await queryFn();
        this.set(queryName, params, result, options.ttl);
        return result;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: `${hitRate}%`,
            enabled: this.enabled
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    /**
     * Enable cache
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable cache
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
        return keysToDelete.length;
    }

    /**
     * Start automatic cleanup interval
     * @param {number} interval - Cleanup interval in milliseconds (default: 60000)
     */
    startAutoCleanup(interval = 60000) {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            const cleaned = this.cleanup();
            if (cleaned > 0) {
                console.log(`QueryCache: Cleaned up ${cleaned} expired entries`);
            }
        }, interval);
    }

    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Create singleton instance
const queryCache = new QueryCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enabled: true
});

// Start automatic cleanup
queryCache.startAutoCleanup();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QueryCache, queryCache };
}
