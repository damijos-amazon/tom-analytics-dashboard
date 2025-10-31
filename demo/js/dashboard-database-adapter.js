/**
 * Dashboard Database Adapter
 * Extends TOMDashboard to use Supabase DatabaseService instead of localStorage
 * This adapter wraps the existing TOMDashboard class and overrides storage methods
 */

class DashboardDatabaseAdapter {
    constructor(dashboard, databaseService, authService) {
        this.dashboard = dashboard;
        this.databaseService = databaseService;
        this.authService = authService;
        this.tableId = dashboard.tableId;
        this.storageKey = dashboard.storageKey;
        this.subscription = null;
        this.lastUpdateTime = Date.now();
        this.updateDebounceTimer = null;
        
        // Override the dashboard's persist and load methods
        this.overrideMethods();
        
        // Setup real-time subscriptions
        this.setupRealtimeSubscription();
    }

    /**
     * Override the dashboard's storage methods to use database instead of localStorage
     */
    overrideMethods() {
        const originalPersistData = this.dashboard.persistData.bind(this.dashboard);
        const originalLoadPersistedData = this.dashboard.loadPersistedData.bind(this.dashboard);

        // Override persistData to use database
        this.dashboard.persistData = async () => {
            try {
                // Mark this as a local update to avoid double-refresh from real-time
                this.markLocalUpdate();
                
                // Save each employee's data to the database
                const savePromises = this.dashboard.data.map(async (employee) => {
                    return await this.databaseService.saveTableData(
                        this.tableId,
                        employee.name,
                        employee
                    );
                });

                await Promise.all(savePromises);
                console.log(`✅ Persisted ${this.dashboard.data.length} records to database for ${this.tableId}`);
                
                // Also save to localStorage as fallback
                originalPersistData();
            } catch (error) {
                console.error('Error persisting data to database:', error);
                // Fallback to localStorage on error
                originalPersistData();
                throw error;
            }
        };

        // Override loadPersistedData to use database
        this.dashboard.loadPersistedData = async () => {
            try {
                const data = await this.databaseService.loadTableData(this.tableId);
                
                if (data && data.length > 0) {
                    // Transform database records to dashboard format
                    this.dashboard.data = data.map(record => record.data);
                    this.dashboard.calculateChanges();
                    this.dashboard.renderTable();
                    this.dashboard.updatePodium();
                    console.log(`✅ Loaded ${data.length} records from database for ${this.tableId}`);
                } else {
                    // Try loading from localStorage as fallback
                    console.log(`No database records found for ${this.tableId}, trying localStorage...`);
                    originalLoadPersistedData();
                }
            } catch (error) {
                console.error('Error loading data from database:', error);
                // Fallback to localStorage on error
                originalLoadPersistedData();
            }
        };
    }

    /**
     * Delete data for a specific employee
     * @param {string} employeeName - The employee name to delete
     */
    async deleteEmployeeData(employeeName) {
        try {
            await this.databaseService.deleteTableData(this.tableId, employeeName);
            console.log(`✅ Deleted data for ${employeeName} from database`);
        } catch (error) {
            console.error('Error deleting employee data:', error);
            throw error;
        }
    }

    /**
     * Setup real-time subscription for table data changes
     */
    setupRealtimeSubscription() {
        try {
            this.subscription = this.databaseService.subscribeToTableData(
                this.tableId,
                (payload) => this.handleRealtimeUpdate(payload)
            );
            console.log(`✅ Real-time subscription active for ${this.tableId}`);
        } catch (error) {
            console.error(`Error setting up real-time subscription for ${this.tableId}:`, error);
        }
    }

    /**
     * Handle real-time update from Supabase
     * @param {Object} payload - The real-time event payload
     */
    handleRealtimeUpdate(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        console.log(`📡 Real-time update for ${this.tableId}:`, eventType, newRecord);

        // Debounce updates to avoid too frequent refreshes
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }

        this.updateDebounceTimer = setTimeout(async () => {
            try {
                // Check if this update was made by current user (avoid double-refresh)
                const timeSinceLastUpdate = Date.now() - this.lastUpdateTime;
                if (timeSinceLastUpdate < 2000) {
                    console.log('⏭️ Skipping update (recent local change)');
                    return;
                }

                // Reload data from database
                await this.dashboard.loadPersistedData();
                
                // Show notification
                this.showUpdateNotification(eventType, newRecord);
                
            } catch (error) {
                console.error('Error handling real-time update:', error);
            }
        }, 500);
    }

    /**
     * Show notification when data is updated by another user
     * @param {string} eventType - The type of event (INSERT, UPDATE, DELETE)
     * @param {Object} record - The affected record
     */
    showUpdateNotification(eventType, record) {
        const employeeName = record?.data?.name || record?.employee_name || 'Unknown';
        let message = '';
        
        switch (eventType) {
            case 'INSERT':
                message = `📥 New data added for ${employeeName}`;
                break;
            case 'UPDATE':
                message = `🔄 Data updated for ${employeeName}`;
                break;
            case 'DELETE':
                message = `🗑️ Data deleted for ${employeeName}`;
                break;
            default:
                message = `📡 Data changed for ${employeeName}`;
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'realtime-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            font-weight: bold;
        `;

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Unsubscribe from real-time updates
     */
    unsubscribe() {
        if (this.subscription) {
            this.databaseService.unsubscribeFromTableData(this.subscription);
            this.subscription = null;
            console.log(`✅ Unsubscribed from real-time updates for ${this.tableId}`);
        }
    }

    /**
     * Update the last update timestamp (call this after local changes)
     */
    markLocalUpdate() {
        this.lastUpdateTime = Date.now();
    }
}

/**
 * Initialize database adapters for all dashboards
 * @param {Object} dashboards - Object containing all dashboard instances
 * @param {DatabaseService} databaseService - The database service instance
 * @param {AuthService} authService - The auth service instance
 * @returns {Object} Object containing all database adapters
 */
function initializeDatabaseAdapters(dashboards, databaseService, authService) {
    const adapters = {};
    
    Object.keys(dashboards).forEach(tableId => {
        const dashboard = dashboards[tableId];
        if (dashboard) {
            adapters[tableId] = new DashboardDatabaseAdapter(
                dashboard,
                databaseService,
                authService
            );
            console.log(`✅ Initialized database adapter for ${tableId}`);
        }
    });
    
    return adapters;
}
