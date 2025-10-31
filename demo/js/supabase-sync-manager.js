/**
 * SupabaseSyncManager
 * Handles data synchronization between local state and Supabase
 */
class SupabaseSyncManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.supabase = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Initialize sync manager
     */
    initialize() {
        this.supabase = this.authManager.getSupabaseClient();
        console.log('Supabase sync manager initialized');
    }

    /**
     * Save table data to Supabase
     * @param {string} tableId - Table identifier
     * @param {Array} data - Table data array
     * @returns {boolean} Success status
     */
    async saveTableData(tableId, data) {
        try {
            if (!this.isOnline) {
                console.log('Offline - queueing table data save');
                this.syncQueue.push({ type: 'tableData', tableId, data });
                return false;
            }

            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.error('No authenticated user');
                return false;
            }

            // Check if data already exists for this table
            const { data: existing } = await this.supabase
                .from('table_data')
                .select('id')
                .eq('user_id', user.id)
                .eq('table_id', tableId)
                .single();

            if (existing) {
                // Update existing
                const { error } = await this.supabase
                    .from('table_data')
                    .update({
                        data: data,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
                console.log(`Updated table data for ${tableId}`);
            } else {
                // Insert new
                const { error } = await this.supabase
                    .from('table_data')
                    .insert({
                        user_id: user.id,
                        table_id: tableId,
                        data: data
                    });

                if (error) throw error;
                console.log(`Inserted table data for ${tableId}`);
            }

            // Also save to localStorage as backup
            const storageKey = tableId === 'tableBody' ? 'tom_analytics_data' : 
                              `tom_analytics_data_${tableId.replace('tableBody', '')}`;
            localStorage.setItem(storageKey, JSON.stringify(data));

            return true;

        } catch (error) {
            console.error('Failed to save table data:', error);
            // Fallback to localStorage
            const storageKey = tableId === 'tableBody' ? 'tom_analytics_data' : 
                              `tom_analytics_data_${tableId.replace('tableBody', '')}`;
            localStorage.setItem(storageKey, JSON.stringify(data));
            return false;
        }
    }

    /**
     * Load table data from Supabase
     * @param {string} tableId - Table identifier
     * @returns {Array|null} Table data or null
     */
    async loadTableData(tableId) {
        try {
            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.error('No authenticated user');
                return this.loadFromLocalStorage(tableId);
            }

            const { data, error } = await this.supabase
                .from('table_data')
                .select('data')
                .eq('user_id', user.id)
                .eq('table_id', tableId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No data found
                    console.log(`No data found for ${tableId}`);
                    return this.loadFromLocalStorage(tableId);
                }
                throw error;
            }

            console.log(`Loaded table data for ${tableId} from Supabase`);
            return data.data;

        } catch (error) {
            console.error('Failed to load table data:', error);
            return this.loadFromLocalStorage(tableId);
        }
    }

    /**
     * Load table data from localStorage (fallback)
     * @param {string} tableId - Table identifier
     * @returns {Array|null} Table data or null
     */
    loadFromLocalStorage(tableId) {
        try {
            const storageKey = tableId === 'tableBody' ? 'tom_analytics_data' : 
                              `tom_analytics_data_${tableId.replace('tableBody', '')}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    /**
     * Save table configuration to Supabase
     * @param {Object} config - Table configuration object
     * @returns {boolean} Success status
     */
    async saveTableConfig(config) {
        try {
            if (!this.isOnline) {
                console.log('Offline - queueing config save');
                this.syncQueue.push({ type: 'config', config });
                return false;
            }

            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.error('No authenticated user');
                return false;
            }

            // Check if config already exists
            const { data: existing } = await this.supabase
                .from('table_configs')
                .select('id')
                .eq('user_id', user.id)
                .eq('config->>tableId', config.tableId)
                .single();

            if (existing) {
                // Update existing
                const { error } = await this.supabase
                    .from('table_configs')
                    .update({
                        config: config,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
                console.log(`Updated config for ${config.tableId}`);
            } else {
                // Insert new
                const { error } = await this.supabase
                    .from('table_configs')
                    .insert({
                        user_id: user.id,
                        config: config
                    });

                if (error) throw error;
                console.log(`Inserted config for ${config.tableId}`);
            }

            return true;

        } catch (error) {
            console.error('Failed to save table config:', error);
            return false;
        }
    }

    /**
     * Load all table configurations from Supabase
     * @returns {Array} Array of table configurations
     */
    async loadAllConfigs() {
        try {
            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.error('No authenticated user');
                return [];
            }

            const { data, error } = await this.supabase
                .from('table_configs')
                .select('config')
                .eq('user_id', user.id);

            if (error) throw error;

            console.log(`Loaded ${data.length} configs from Supabase`);
            return data.map(row => row.config);

        } catch (error) {
            console.error('Failed to load configs:', error);
            return [];
        }
    }

    /**
     * Sync employee list to Supabase
     * @param {Array} employees - Employee list array
     * @returns {boolean} Success status
     */
    async syncEmployeeList(employees) {
        try {
            if (!this.isOnline) {
                console.log('Offline - queueing employee list sync');
                this.syncQueue.push({ type: 'employees', employees });
                return false;
            }

            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.error('No authenticated user');
                return false;
            }

            // Check if employee list exists
            const { data: existing } = await this.supabase
                .from('employee_list')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (existing) {
                // Update existing
                const { error } = await this.supabase
                    .from('employee_list')
                    .update({
                        employees: employees,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
                console.log('Updated employee list');
            } else {
                // Insert new
                const { error } = await this.supabase
                    .from('employee_list')
                    .insert({
                        user_id: user.id,
                        employees: employees
                    });

                if (error) throw error;
                console.log('Inserted employee list');
            }

            // Also save to localStorage
            localStorage.setItem('simpleEmployees', JSON.stringify(employees));

            return true;

        } catch (error) {
            console.error('Failed to sync employee list:', error);
            localStorage.setItem('simpleEmployees', JSON.stringify(employees));
            return false;
        }
    }

    /**
     * Load employee list from Supabase
     * @returns {Array} Employee list
     */
    async loadEmployeeList() {
        try {
            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.error('No authenticated user');
                return this.loadEmployeesFromLocalStorage();
            }

            const { data, error } = await this.supabase
                .from('employee_list')
                .select('employees')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('No employee list found');
                    return this.loadEmployeesFromLocalStorage();
                }
                throw error;
            }

            console.log('Loaded employee list from Supabase');
            return data.employees;

        } catch (error) {
            console.error('Failed to load employee list:', error);
            return this.loadEmployeesFromLocalStorage();
        }
    }

    /**
     * Load employees from localStorage (fallback)
     * @returns {Array} Employee list
     */
    loadEmployeesFromLocalStorage() {
        try {
            const data = localStorage.getItem('simpleEmployees');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load employees from localStorage:', error);
            return [];
        }
    }

    /**
     * Process queued sync operations when back online
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        console.log(`Processing ${this.syncQueue.length} queued sync operations`);

        while (this.syncQueue.length > 0) {
            const operation = this.syncQueue.shift();

            try {
                switch (operation.type) {
                    case 'tableData':
                        await this.saveTableData(operation.tableId, operation.data);
                        break;
                    case 'config':
                        await this.saveTableConfig(operation.config);
                        break;
                    case 'employees':
                        await this.syncEmployeeList(operation.employees);
                        break;
                }
            } catch (error) {
                console.error('Failed to process queued operation:', error);
                // Re-queue if failed
                this.syncQueue.push(operation);
            }
        }

        console.log('Sync queue processed');
    }
}

// Create global instance (will be initialized after authManager)
window.SupabaseSyncManager = SupabaseSyncManager;
