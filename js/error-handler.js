/**
 * Global Error Handler Service
 * Handles all application errors, provides user-friendly messages,
 * implements retry logic, and manages offline queue
 */

class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.retryQueue = [];
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        this.isOnline = navigator.onLine;
        
        this.setupGlobalHandlers();
        this.loadQueuesFromStorage();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            event.preventDefault();
            this.handleError(event.error || event.message, 'Global Error');
        });

        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored');
            this.processRetryQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost');
        });
    }

    /**
     * Main error handling method
     * @param {Error|string} error - The error object or message
     * @param {string} context - Context where error occurred
     * @param {Object} metadata - Additional error metadata
     */
    handleError(error, context = 'Unknown', metadata = {}) {
        const errorInfo = {
            message: error?.message || error,
            context,
            metadata,
            timestamp: new Date().toISOString(),
            stack: error?.stack,
            userAgent: navigator.userAgent
        };

        // Log error to console for debugging
        console.error(`[${context}]`, error);

        // Store error in queue
        this.errorQueue.push(errorInfo);
        this.saveErrorQueue();

        // Display user-friendly message
        this.displayErrorMessage(error, context);

        // Send to logging service if online
        if (this.isOnline) {
            this.logErrorToService(errorInfo);
        }

        return errorInfo;
    }

    /**
     * Display user-friendly error message
     * @param {Error|string} error - The error
     * @param {string} context - Error context
     */
    displayErrorMessage(error, context) {
        const message = this.getUserFriendlyMessage(error, context);
        this.showErrorToast(message);
    }

    /**
     * Convert technical error to user-friendly message
     * @param {Error|string} error - The error
     * @param {string} context - Error context
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(error, context) {
        const errorMsg = error?.message || error?.toString() || '';

        // Database connection errors
        if (errorMsg.includes('Failed to fetch') || 
            errorMsg.includes('NetworkError') ||
            errorMsg.includes('network')) {
            return 'Unable to connect to database. Please check your internet connection.';
        }

        // Authentication errors
        if (errorMsg.includes('auth') || 
            errorMsg.includes('login') ||
            errorMsg.includes('credentials') ||
            context.includes('Auth')) {
            return 'Login failed. Please check your credentials and try again.';
        }

        // Permission errors
        if (errorMsg.includes('permission') || 
            errorMsg.includes('unauthorized') ||
            errorMsg.includes('forbidden')) {
            return "You don't have permission to perform this action.";
        }

        // Session errors
        if (errorMsg.includes('session') || 
            errorMsg.includes('token') ||
            errorMsg.includes('expired')) {
            return 'Your session has expired. Please log in again.';
        }

        // Data validation errors
        if (errorMsg.includes('validation') || 
            errorMsg.includes('invalid')) {
            return 'Invalid data provided. Please check your input and try again.';
        }

        // Timeout errors
        if (errorMsg.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }

        // Default message
        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Show error toast notification
     * @param {string} message - Error message to display
     */
    showErrorToast(message) {
        // Remove existing error toast if present
        const existingToast = document.getElementById('errorToast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create error toast
        const toast = document.createElement('div');
        toast.id = 'errorToast';
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="error-toast-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Queue an action for retry when network fails
     * @param {Function} action - The action to retry
     * @param {Object} options - Retry options
     * @returns {Promise} Promise that resolves when action succeeds
     */
    async queueAction(action, options = {}) {
        const {
            maxRetries = this.maxRetries,
            retryDelay = this.retryDelay,
            context = 'Action',
            metadata = {}
        } = options;

        const queueItem = {
            id: Date.now() + Math.random(),
            action,
            context,
            metadata,
            retries: 0,
            maxRetries,
            retryDelay,
            timestamp: new Date().toISOString()
        };

        // Try to execute immediately if online
        if (this.isOnline) {
            try {
                const result = await this.executeWithRetry(queueItem);
                return result;
            } catch (error) {
                // If it's a network error, queue it
                if (this.isNetworkError(error)) {
                    this.retryQueue.push(queueItem);
                    this.saveRetryQueue();
                    this.showQueuedMessage();
                }
                throw error;
            }
        } else {
            // Offline - queue for later
            this.retryQueue.push(queueItem);
            this.saveRetryQueue();
            this.showQueuedMessage();
            throw new Error('Action queued - currently offline');
        }
    }

    /**
     * Execute action with retry logic
     * @param {Object} queueItem - Queue item to execute
     * @returns {Promise} Result of action
     */
    async executeWithRetry(queueItem) {
        while (queueItem.retries < queueItem.maxRetries) {
            try {
                const result = await queueItem.action();
                return result;
            } catch (error) {
                queueItem.retries++;
                
                if (queueItem.retries >= queueItem.maxRetries) {
                    this.handleError(error, queueItem.context, {
                        ...queueItem.metadata,
                        retriesExhausted: true
                    });
                    throw error;
                }

                // Wait before retry
                await this.delay(queueItem.retryDelay * queueItem.retries);
                
                // Check if still a network error
                if (!this.isNetworkError(error)) {
                    throw error;
                }
            }
        }
    }

    /**
     * Check if error is network-related
     * @param {Error} error - Error to check
     * @returns {boolean} True if network error
     */
    isNetworkError(error) {
        const errorMsg = error?.message || error?.toString() || '';
        return errorMsg.includes('Failed to fetch') ||
               errorMsg.includes('NetworkError') ||
               errorMsg.includes('network') ||
               errorMsg.includes('timeout') ||
               !this.isOnline;
    }

    /**
     * Process retry queue when connection is restored
     */
    async processRetryQueue() {
        if (this.retryQueue.length === 0) return;

        console.log(`Processing ${this.retryQueue.length} queued actions...`);
        
        const queue = [...this.retryQueue];
        this.retryQueue = [];

        for (const item of queue) {
            try {
                await this.executeWithRetry(item);
                console.log(`Successfully executed queued action: ${item.context}`);
            } catch (error) {
                console.error(`Failed to execute queued action: ${item.context}`, error);
                // Re-queue if still failing
                if (this.isNetworkError(error) && item.retries < item.maxRetries) {
                    this.retryQueue.push(item);
                }
            }
        }

        this.saveRetryQueue();

        if (this.retryQueue.length === 0) {
            this.showSuccessMessage('All queued actions completed successfully');
        }
    }

    /**
     * Show message that action was queued
     */
    showQueuedMessage() {
        this.showInfoToast(`Action queued. Will retry when connection is restored. (${this.retryQueue.length} queued)`);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="success-toast-content">
                <span class="success-icon">✓</span>
                <span class="success-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show info toast
     * @param {string} message - Info message
     */
    showInfoToast(message) {
        const toast = document.createElement('div');
        toast.className = 'info-toast';
        toast.innerHTML = `
            <div class="info-toast-content">
                <span class="info-icon">ℹ️</span>
                <span class="info-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Log error to remote service
     * @param {Object} errorInfo - Error information
     */
    async logErrorToService(errorInfo) {
        // In production, send to logging service (e.g., Sentry, LogRocket)
        // For now, just log to console
        console.log('Would log to service:', errorInfo);
        
        // TODO: Implement actual logging service integration
        // Example:
        // await fetch('/api/logs', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(errorInfo)
        // });
    }

    /**
     * Save error queue to localStorage
     */
    saveErrorQueue() {
        try {
            // Keep only last 100 errors
            const recentErrors = this.errorQueue.slice(-100);
            localStorage.setItem('error_queue', JSON.stringify(recentErrors));
        } catch (e) {
            console.error('Failed to save error queue:', e);
        }
    }

    /**
     * Save retry queue to localStorage
     */
    saveRetryQueue() {
        try {
            // Store queue items without the action function
            const serializableQueue = this.retryQueue.map(item => ({
                id: item.id,
                context: item.context,
                metadata: item.metadata,
                retries: item.retries,
                maxRetries: item.maxRetries,
                retryDelay: item.retryDelay,
                timestamp: item.timestamp
            }));
            localStorage.setItem('retry_queue', JSON.stringify(serializableQueue));
        } catch (e) {
            console.error('Failed to save retry queue:', e);
        }
    }

    /**
     * Load queues from localStorage
     */
    loadQueuesFromStorage() {
        try {
            const errorQueue = localStorage.getItem('error_queue');
            if (errorQueue) {
                this.errorQueue = JSON.parse(errorQueue);
            }

            // Note: We can't restore action functions from localStorage
            // Retry queue will be rebuilt by the application
            const retryQueue = localStorage.getItem('retry_queue');
            if (retryQueue) {
                const stored = JSON.parse(retryQueue);
                console.log(`Found ${stored.length} queued actions from previous session`);
            }
        } catch (e) {
            console.error('Failed to load queues from storage:', e);
        }
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            totalErrors: this.errorQueue.length,
            queuedActions: this.retryQueue.length,
            isOnline: this.isOnline,
            recentErrors: this.errorQueue.slice(-10)
        };
    }

    /**
     * Clear error queue
     */
    clearErrorQueue() {
        this.errorQueue = [];
        localStorage.removeItem('error_queue');
    }

    /**
     * Clear retry queue
     */
    clearRetryQueue() {
        this.retryQueue = [];
        localStorage.removeItem('retry_queue');
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
window.errorHandler = new ErrorHandler();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
