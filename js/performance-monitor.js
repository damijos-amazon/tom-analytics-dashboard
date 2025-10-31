/**
 * PerformanceMonitor
 * Monitors and reports on application performance metrics
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.thresholds = {
            slow: 1000, // 1 second
            verySlow: 3000 // 3 seconds
        };
    }

    /**
     * Start timing an operation
     * @param {string} operationName - Name of the operation
     * @returns {string} Timing ID
     */
    startTiming(operationName) {
        const id = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (!this.metrics.has(operationName)) {
            this.metrics.set(operationName, {
                count: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                slowCount: 0,
                verySlowCount: 0,
                timings: []
            });
        }

        const timing = {
            id,
            operationName,
            startTime: performance.now(),
            startTimestamp: Date.now()
        };

        return id;
    }

    /**
     * End timing an operation
     * @param {string} id - Timing ID from startTiming
     * @param {Object} metadata - Optional metadata about the operation
     */
    endTiming(id, metadata = {}) {
        const endTime = performance.now();
        const [operationName] = id.split('_');
        
        const metrics = this.metrics.get(operationName);
        if (!metrics) {
            console.warn(`No metrics found for operation: ${operationName}`);
            return;
        }

        // Calculate duration
        const duration = endTime - metrics.timings.find(t => t.id === id)?.startTime || 0;

        // Update metrics
        metrics.count++;
        metrics.totalTime += duration;
        metrics.minTime = Math.min(metrics.minTime, duration);
        metrics.maxTime = Math.max(metrics.maxTime, duration);

        if (duration > this.thresholds.verySlow) {
            metrics.verySlowCount++;
            console.warn(`Very slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`, metadata);
        } else if (duration > this.thresholds.slow) {
            metrics.slowCount++;
            console.log(`Slow operation: ${operationName} took ${duration.toFixed(2)}ms`, metadata);
        }

        // Store timing (keep last 100)
        metrics.timings.push({
            id,
            duration,
            timestamp: Date.now(),
            metadata
        });

        if (metrics.timings.length > 100) {
            metrics.timings.shift();
        }
    }

    /**
     * Wrap an async function with performance monitoring
     * @param {string} operationName - Name of the operation
     * @param {Function} fn - Async function to wrap
     * @param {Object} metadata - Optional metadata
     * @returns {Promise} Result of the function
     */
    async measure(operationName, fn, metadata = {}) {
        const startTime = performance.now();
        
        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            
            this.recordMetric(operationName, duration, metadata);
            
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordMetric(operationName, duration, { ...metadata, error: true });
            throw error;
        }
    }

    /**
     * Record a metric
     * @param {string} operationName - Name of the operation
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Optional metadata
     */
    recordMetric(operationName, duration, metadata = {}) {
        if (!this.metrics.has(operationName)) {
            this.metrics.set(operationName, {
                count: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                slowCount: 0,
                verySlowCount: 0,
                timings: []
            });
        }

        const metrics = this.metrics.get(operationName);
        
        metrics.count++;
        metrics.totalTime += duration;
        metrics.minTime = Math.min(metrics.minTime, duration);
        metrics.maxTime = Math.max(metrics.maxTime, duration);

        if (duration > this.thresholds.verySlow) {
            metrics.verySlowCount++;
            console.warn(`Very slow operation: ${operationName} took ${duration.toFixed(2)}ms`, metadata);
        } else if (duration > this.thresholds.slow) {
            metrics.slowCount++;
        }

        metrics.timings.push({
            duration,
            timestamp: Date.now(),
            metadata
        });

        if (metrics.timings.length > 100) {
            metrics.timings.shift();
        }
    }

    /**
     * Get metrics for an operation
     * @param {string} operationName - Name of the operation
     * @returns {Object} Metrics object
     */
    getMetrics(operationName) {
        const metrics = this.metrics.get(operationName);
        if (!metrics) return null;

        return {
            operationName,
            count: metrics.count,
            averageTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
            minTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
            maxTime: metrics.maxTime,
            slowCount: metrics.slowCount,
            verySlowCount: metrics.verySlowCount,
            slowPercentage: metrics.count > 0 ? (metrics.slowCount / metrics.count * 100).toFixed(2) : 0,
            recentTimings: metrics.timings.slice(-10)
        };
    }

    /**
     * Get all metrics
     * @returns {Array} Array of all metrics
     */
    getAllMetrics() {
        const allMetrics = [];
        
        for (const operationName of this.metrics.keys()) {
            allMetrics.push(this.getMetrics(operationName));
        }

        return allMetrics.sort((a, b) => b.averageTime - a.averageTime);
    }

    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getSummary() {
        const allMetrics = this.getAllMetrics();
        
        const totalOperations = allMetrics.reduce((sum, m) => sum + m.count, 0);
        const totalSlowOperations = allMetrics.reduce((sum, m) => sum + m.slowCount, 0);
        const totalVerySlowOperations = allMetrics.reduce((sum, m) => sum + m.verySlowCount, 0);

        return {
            totalOperations,
            totalSlowOperations,
            totalVerySlowOperations,
            slowPercentage: totalOperations > 0 ? (totalSlowOperations / totalOperations * 100).toFixed(2) : 0,
            operationCount: allMetrics.length,
            slowestOperations: allMetrics.slice(0, 5),
            mostFrequentOperations: allMetrics.sort((a, b) => b.count - a.count).slice(0, 5)
        };
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
    }

    /**
     * Reset metrics for a specific operation
     * @param {string} operationName - Name of the operation
     */
    resetOperation(operationName) {
        this.metrics.delete(operationName);
    }

    /**
     * Set performance thresholds
     * @param {Object} thresholds - Threshold values
     * @param {number} thresholds.slow - Slow threshold in ms
     * @param {number} thresholds.verySlow - Very slow threshold in ms
     */
    setThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    /**
     * Log performance report to console
     */
    logReport() {
        const summary = this.getSummary();
        
        console.group('Performance Report');
        console.log(`Total Operations: ${summary.totalOperations}`);
        console.log(`Slow Operations: ${summary.totalSlowOperations} (${summary.slowPercentage}%)`);
        console.log(`Very Slow Operations: ${summary.totalVerySlowOperations}`);
        
        console.group('Slowest Operations');
        summary.slowestOperations.forEach(op => {
            console.log(`${op.operationName}: avg ${op.averageTime.toFixed(2)}ms (${op.count} calls)`);
        });
        console.groupEnd();
        
        console.group('Most Frequent Operations');
        summary.mostFrequentOperations.forEach(op => {
            console.log(`${op.operationName}: ${op.count} calls, avg ${op.averageTime.toFixed(2)}ms`);
        });
        console.groupEnd();
        
        console.groupEnd();
    }

    /**
     * Export metrics as JSON
     * @returns {string} JSON string of all metrics
     */
    exportMetrics() {
        const data = {
            timestamp: new Date().toISOString(),
            thresholds: this.thresholds,
            summary: this.getSummary(),
            metrics: this.getAllMetrics()
        };
        
        return JSON.stringify(data, null, 2);
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, performanceMonitor };
}
