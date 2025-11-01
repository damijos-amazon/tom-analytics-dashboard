/**
 * Dashboard Instance Manager
 * Manages multiple TOMDashboard instances based on table configuration
 */
class DashboardManager {
    constructor(configSystem, tableGenerator) {
        this.configSystem = configSystem;
        this.tableGenerator = tableGenerator;
        this.dashboards = {};
    }

    /**
     * Initialize all dashboards from configuration
     * Creates dashboard instances for all visible tables
     */
    async initializeDashboards() {
        const tables = this.configSystem.getAllTables();
        
        console.log(`Initializing ${tables.length} dashboards...`);
        
        tables.forEach(tableConfig => {
            try {
                this.createTable(tableConfig.tableId);
            } catch (error) {
                console.error(`Failed to create dashboard for ${tableConfig.tableId}:`, error);
            }
        });
        
        // Set global dashboards object for backward compatibility
        window.dashboards = this.dashboards;
        
        console.log(`Initialized ${Object.keys(this.dashboards).length} dashboards`);
    }

    /**
     * Create a single dashboard instance
     * Generates HTML if needed and creates TOMDashboard instance
     * @param {string} tableId - The table identifier
     * @returns {TOMDashboard|null} The created dashboard instance or null if hidden
     */
    createTable(tableId) {
        const tableConfig = this.configSystem.getTableConfig(tableId);
        
        if (!tableConfig) {
            console.error(`Table configuration not found: ${tableId}`);
            return null;
        }
        
        // Skip if not visible
        if (tableConfig.visible === false) {
            console.log(`Skipping hidden table: ${tableId}`);
            return null;
        }
        
        // Generate HTML if not exists
        if (!document.getElementById(tableConfig.tableBodyId)) {
            this.tableGenerator.generateTable(tableConfig);
        }
        
        // Create Dashboard instance
        // Pass the full tableConfig object so TOMDashboard can access columns
        const podiumId = `podium_${tableConfig.tableBodyId}`;
        
        const dashboard = new TOMDashboard(
            tableConfig,
            podiumId,
            tableConfig.storageKey
        );
        
        // Store in both the new tableId and legacy tableBodyId for backward compatibility
        this.dashboards[tableId] = dashboard;
        this.dashboards[tableConfig.tableBodyId] = dashboard;
        
        console.log(`Created dashboard for table: ${tableId} (${tableConfig.tableName})`);
        return dashboard;
    }

    /**
     * Get a dashboard instance by table ID
     * @param {string} tableId - The table identifier
     * @returns {TOMDashboard|undefined} The dashboard instance
     */
    getDashboard(tableId) {
        return this.dashboards[tableId];
    }
    
    /**
     * Get all visible dashboard instances
     * Filters out hidden tables
     * @returns {Object} Object with tableId keys and dashboard values
     */
    getVisibleDashboards() {
        const visible = {};
        Object.keys(this.dashboards).forEach(tableId => {
            const config = this.configSystem.getTableConfig(tableId);
            if (config && config.visible !== false) {
                visible[tableId] = this.dashboards[tableId];
            }
        });
        return visible;
    }
    
    /**
     * Get dashboards that should be included in leaderboard calculations
     * Filters by both visibility and includeInLeaderboard flag
     * @returns {Object} Object with tableId keys and dashboard values
     */
    getLeaderboardDashboards() {
        const included = {};
        Object.keys(this.dashboards).forEach(tableId => {
            const config = this.configSystem.getTableConfig(tableId);
            if (config && config.includeInLeaderboard !== false && config.visible !== false) {
                included[tableId] = this.dashboards[tableId];
            }
        });
        return included;
    }

    /**
     * Get all dashboard instances
     * @returns {Object} Object with tableId keys and dashboard values
     */
    getAllDashboards() {
        return this.dashboards;
    }

    /**
     * Hide a table from the UI but preserve its data
     * Removes the table from DOM but keeps the dashboard instance in memory
     * @param {string} tableId - The table identifier
     */
    hideTable(tableId) {
        const dashboard = this.dashboards[tableId];
        if (!dashboard) {
            console.warn(`Dashboard not found for table: ${tableId}`);
            return;
        }
        
        console.log(`Hiding table: ${tableId}`);
        
        // Remove from DOM
        this.tableGenerator.removeTable(tableId);
        
        // Mark dashboard as hidden but keep instance and data
        dashboard.hidden = true;
        
        console.log(`Table ${tableId} hidden, data preserved in memory`);
    }
    
    /**
     * Show a previously hidden table
     * Restores the table to the UI with its data
     * @param {string} tableId - The table identifier
     */
    showTable(tableId) {
        const dashboard = this.dashboards[tableId];
        const tableConfig = this.configSystem.getTableConfig(tableId);
        
        if (!tableConfig) {
            console.error(`Table configuration not found: ${tableId}`);
            return;
        }
        
        if (dashboard && dashboard.hidden) {
            console.log(`Showing previously hidden table: ${tableId}`);
            
            // Regenerate UI
            this.tableGenerator.generateTable(tableConfig);
            
            // Mark as visible
            dashboard.hidden = false;
            
            // Re-render data if the dashboard has a renderTable method
            if (typeof dashboard.renderTable === 'function') {
                dashboard.renderTable();
            }
            
            console.log(`Table ${tableId} restored with data`);
        } else if (!dashboard) {
            // Create new dashboard if it doesn't exist
            console.log(`Creating new dashboard for table: ${tableId}`);
            this.createTable(tableId);
        } else {
            console.log(`Table ${tableId} is already visible`);
        }
    }

    /**
     * Remove a table completely
     * Archives the data to localStorage and removes the dashboard instance
     * @param {string} tableId - The table identifier
     */
    removeTable(tableId) {
        const dashboard = this.dashboards[tableId];
        if (!dashboard) {
            console.warn(`Dashboard not found for table: ${tableId}`);
            return;
        }
        
        console.log(`Removing table: ${tableId}`);
        
        // Archive data to localStorage
        const archiveKey = `${dashboard.storageKey}_archived_${Date.now()}`;
        const dataToArchive = {
            tableId: tableId,
            tableName: dashboard.tableConfig?.tableName || 'Unknown',
            archivedAt: new Date().toISOString(),
            data: dashboard.data || []
        };
        
        try {
            localStorage.setItem(archiveKey, JSON.stringify(dataToArchive));
            console.log(`Data archived to: ${archiveKey}`);
        } catch (error) {
            console.error(`Failed to archive data for ${tableId}:`, error);
        }
        
        // Remove from DOM
        this.tableGenerator.removeTable(tableId);
        
        // Remove dashboard instance
        delete this.dashboards[tableId];
        
        console.log(`Table ${tableId} removed completely`);
    }

    /**
     * Refresh a table after configuration changes
     * Preserves data while regenerating the UI
     * @param {string} tableId - The table identifier
     */
    refreshTable(tableId) {
        const dashboard = this.dashboards[tableId];
        const tableConfig = this.configSystem.getTableConfig(tableId);
        
        if (!tableConfig) {
            console.error(`Table configuration not found: ${tableId}`);
            return;
        }
        
        console.log(`Refreshing table: ${tableId}`);
        
        // Preserve data if dashboard exists
        let preservedData = null;
        if (dashboard && dashboard.data) {
            preservedData = [...dashboard.data];
            console.log(`Preserved ${preservedData.length} rows of data`);
        }
        
        // Regenerate UI
        this.tableGenerator.refreshTable(tableId);
        
        // Recreate dashboard
        const newDashboard = this.createTable(tableId);
        
        // Restore data if it was preserved
        if (newDashboard && preservedData) {
            newDashboard.data = preservedData;
            
            // Re-render the table if the method exists
            if (typeof newDashboard.renderTable === 'function') {
                newDashboard.renderTable();
            }
            
            console.log(`Table ${tableId} refreshed with ${preservedData.length} rows restored`);
        } else {
            console.log(`Table ${tableId} refreshed`);
        }
    }
}
