/**
 * Connection Status Indicator
 * Displays online/offline status and manages auto-sync of queued actions
 */

class ConnectionStatus {
    constructor(errorHandler = null) {
        this.errorHandler = errorHandler || window.errorHandler;
        this.isOnline = navigator.onLine;
        this.statusElement = null;
        this.syncInProgress = false;
        this.queuedActionsCount = 0;
        
        this.init();
    }

    /**
     * Initialize connection status indicator
     */
    init() {
        this.createStatusElement();
        this.setupEventListeners();
        this.updateStatus();
    }

    /**
     * Create status indicator element
     */
    createStatusElement() {
        // Remove existing if present
        const existing = document.getElementById('connectionStatus');
        if (existing) {
            existing.remove();
        }

        // Create status bar
        this.statusElement = document.createElement('div');
        this.statusElement.id = 'connectionStatus';
        this.statusElement.className = 'connection-status hidden';
        
        document.body.appendChild(this.statusElement);
    }

    /**
     * Setup event listeners for online/offline events
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });

        // Listen for visibility change to check connection
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkConnection();
            }
        });

        // Periodic connection check
        setInterval(() => this.checkConnection(), 30000); // Every 30 seconds
    }

    /**
     * Handle online event
     */
    async handleOnline() {
        console.log('Connection restored');
        this.showStatus('online', 'Back online', 'Syncing queued actions...');
        
        // Wait a moment for connection to stabilize
        await this.delay(1000);
        
        // Sync queued actions
        await this.syncQueuedActions();
        
        // Hide status after successful sync
        setTimeout(() => this.hideStatus(), 3000);
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('Connection lost');
        this.showStatus('offline', 'No internet connection', 'Changes will be saved locally and synced when connection is restored');
    }

    /**
     * Check connection status
     */
    async checkConnection() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;

        // If browser says online, verify with actual request
        if (this.isOnline) {
            try {
                const response = await fetch('/favicon.ico', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                this.isOnline = response.ok;
            } catch (e) {
                this.isOnline = false;
            }
        }

        // Status changed
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.handleOnline();
            } else {
                this.handleOffline();
            }
        }
    }

    /**
     * Show status indicator
     * @param {string} type - Status type: 'online', 'offline', 'reconnecting'
     * @param {string} message - Main message
     * @param {string} details - Additional details
     */
    showStatus(type, message, details = '') {
        if (!this.statusElement) return;

        const icons = {
            online: '✓',
            offline: '⚠️',
            reconnecting: '🔄'
        };

        this.statusElement.className = `connection-status ${type}`;
        this.statusElement.innerHTML = `
            <span class="connection-status-icon">${icons[type]}</span>
            <span class="connection-status-message">${message}</span>
            ${details ? `<span class="connection-status-details">${details}</span>` : ''}
        `;
    }

    /**
     * Hide status indicator
     */
    hideStatus() {
        if (this.statusElement) {
            this.statusElement.classList.add('hidden');
        }
    }

    /**
     * Update status display
     */
    updateStatus() {
        if (this.isOnline) {
            this.hideStatus();
        } else {
            this.handleOffline();
        }
    }

    /**
     * Sync queued actions when connection is restored
     */
    async syncQueuedActions() {
        if (this.syncInProgress) {
            console.log('Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        this.showStatus('reconnecting', 'Syncing...', 'Processing queued actions');

        try {
            // Get queued actions count
            if (this.errorHandler && this.errorHandler.retryQueue) {
                this.queuedActionsCount = this.errorHandler.retryQueue.length;
            }

            // Process retry queue if error handler is available
            if (this.errorHandler && typeof this.errorHandler.processRetryQueue === 'function') {
                await this.errorHandler.processRetryQueue();
            }

            // Trigger custom sync event for other components
            window.dispatchEvent(new CustomEvent('connection-restored', {
                detail: { queuedActions: this.queuedActionsCount }
            }));

            // Show success message
            if (this.queuedActionsCount > 0) {
                this.showStatus('online', 'Sync complete', `${this.queuedActionsCount} action(s) synced successfully`);
            } else {
                this.showStatus('online', 'Back online', 'All data is up to date');
            }

            this.queuedActionsCount = 0;
        } catch (error) {
            console.error('Sync failed:', error);
            this.showStatus('offline', 'Sync failed', 'Will retry automatically');
            
            // Retry after delay
            setTimeout(() => this.syncQueuedActions(), 10000);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Get current connection status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            queuedActions: this.queuedActionsCount
        };
    }

    /**
     * Manually trigger sync
     */
    async triggerSync() {
        if (!this.isOnline) {
            console.warn('Cannot sync while offline');
            return false;
        }

        await this.syncQueuedActions();
        return true;
    }

    /**
     * Show temporary status message
     * @param {string} type - Status type
     * @param {string} message - Message to display
     * @param {number} duration - Duration in ms
     */
    showTemporaryStatus(type, message, duration = 3000) {
        this.showStatus(type, message);
        setTimeout(() => this.hideStatus(), duration);
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Destroy connection status indicator
     */
    destroy() {
        if (this.statusElement) {
            this.statusElement.remove();
            this.statusElement = null;
        }
    }
}

// Create global instance
window.connectionStatus = new ConnectionStatus();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConnectionStatus;
}
