/**
 * DatabaseService - Handles all database operations with Supabase
 * 
 * This service manages:
 * - Table data storage and retrieval
 * - Configuration management with versioning
 * - Employee records management
 * - Real-time subscriptions for data synchronization
 */

class DatabaseService {
    constructor(supabaseClient, authService, loadingIndicator = null, queryCache = null) {
        this.supabase = supabaseClient;
        this.authService = authService;
        this.loadingIndicator = loadingIndicator;
        this.queryCache = queryCache;
    }

    /**
     * Save table data to the database
     * @param {string} tableId - Unique identifier for the table
     * @param {string} employeeName - Name of the employee
     * @param {Object} data - Data object to store
     * @returns {Promise<Object>} The saved data record
     */
    async saveTableData(tableId, employeeName, data) {
        const { data: result, error } = await this.supabase
            .from('table_data')
            .upsert({
                table_id: tableId,
                employee_name: employeeName,
                data: data,
                updated_by: this.authService.getCurrentUser().id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'table_id,employee_name'
            });
        
        if (error) {
            throw new Error(`Failed to save table data: ${error.message}`);
        }
        
        // Invalidate cache for this table
        if (this.queryCache) {
            this.queryCache.invalidate(`loadTableData:{"tableId":"${tableId}"`);
        }
        
        // Log data modification
        await this.authService.logAuditEvent(
            'data_update',
            'table_data',
            tableId,
            { employee_name: employeeName }
        );
        
        return result;
    }

    /**
     * Load table data from the database
     * @param {string} tableId - Unique identifier for the table
     * @param {Object} options - Optional pagination and filtering options
     * @param {number} options.page - Page number (0-indexed)
     * @param {number} options.pageSize - Number of records per page (default: 100)
     * @param {boolean} options.useCache - Whether to use cache (default: true)
     * @returns {Promise<Object>} Object containing data array and pagination metadata
     */
    async loadTableData(tableId, options = {}) {
        const { page = 0, pageSize = 100, useCache = true } = options;
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        // Use cache if available
        if (this.queryCache && useCache) {
            return await this.queryCache.wrap(
                'loadTableData',
                async () => {
                    const { data, error, count } = await this.supabase
                        .from('table_data')
                        .select('*', { count: 'exact' })
                        .eq('table_id', tableId)
                        .order('employee_name')
                        .range(from, to);
                    
                    if (error) {
                        throw new Error(`Failed to load table data: ${error.message}`);
                    }
                    
                    return {
                        data: data || [],
                        pagination: {
                            page,
                            pageSize,
                            totalRecords: count || 0,
                            totalPages: Math.ceil((count || 0) / pageSize),
                            hasNextPage: to < (count || 0) - 1,
                            hasPreviousPage: page > 0
                        }
                    };
                },
                { tableId, page, pageSize },
                { ttl: 2 * 60 * 1000 } // 2 minutes cache
            );
        }
        
        // Direct query without cache
        const { data, error, count } = await this.supabase
            .from('table_data')
            .select('*', { count: 'exact' })
            .eq('table_id', tableId)
            .order('employee_name')
            .range(from, to);
        
        if (error) {
            throw new Error(`Failed to load table data: ${error.message}`);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                pageSize,
                totalRecords: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize),
                hasNextPage: to < (count || 0) - 1,
                hasPreviousPage: page > 0
            }
        };
    }

    /**
     * Load all table data (backward compatibility)
     * @param {string} tableId - Unique identifier for the table
     * @returns {Promise<Array>} Array of all table data records
     */
    async loadAllTableData(tableId) {
        const { data, error } = await this.supabase
            .from('table_data')
            .select('*')
            .eq('table_id', tableId)
            .order('employee_name');
        
        if (error) {
            throw new Error(`Failed to load table data: ${error.message}`);
        }
        
        return data;
    }

    /**
     * Delete table data from the database
     * @param {string} tableId - Unique identifier for the table
     * @param {string} employeeName - Name of the employee
     * @returns {Promise<void>}
     */
    async deleteTableData(tableId, employeeName) {
        const { error } = await this.supabase
            .from('table_data')
            .delete()
            .eq('table_id', tableId)
            .eq('employee_name', employeeName);
        
        if (error) {
            throw new Error(`Failed to delete table data: ${error.message}`);
        }
        
        // Invalidate cache for this table
        if (this.queryCache) {
            this.queryCache.invalidate(`loadTableData:{"tableId":"${tableId}"`);
        }
        
        // Log deletion
        await this.authService.logAuditEvent(
            'data_delete',
            'table_data',
            tableId,
            { employee_name: employeeName }
        );
    }

    /**
     * Save table configuration with versioning
     * @param {Object} config - Configuration object to store
     * @returns {Promise<Object>} The saved configuration record
     */
    async saveTableConfiguration(config) {
        const { data, error } = await this.supabase
            .from('table_configurations')
            .insert({
                config: config,
                created_by: this.authService.getCurrentUser().id
            })
            .select()
            .single();
        
        if (error) {
            throw new Error(`Failed to save configuration: ${error.message}`);
        }
        
        // Invalidate configuration cache
        if (this.queryCache) {
            this.queryCache.invalidate('loadTableConfiguration');
        }
        
        // Log configuration change
        await this.authService.logAuditEvent(
            'config_update',
            'table_configuration',
            data.id,
            {}
        );
        
        return data;
    }

    /**
     * Load the latest table configuration
     * @param {Object} options - Optional configuration options
     * @param {boolean} options.useCache - Whether to use cache (default: true)
     * @returns {Promise<Object|null>} The latest configuration or null if none exists
     */
    async loadTableConfiguration(options = {}) {
        const { useCache = true } = options;
        
        // Use cache if available
        if (this.queryCache && useCache) {
            return await this.queryCache.wrap(
                'loadTableConfiguration',
                async () => {
                    const { data, error } = await this.supabase
                        .from('table_configurations')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    
                    if (error && error.code !== 'PGRST116') { // Not found is ok
                        throw new Error(`Failed to load configuration: ${error.message}`);
                    }
                    
                    return data?.config || null;
                },
                {},
                { ttl: 10 * 60 * 1000 } // 10 minutes cache
            );
        }
        
        const { data, error } = await this.supabase
            .from('table_configurations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // Not found is ok
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
        
        return data?.config || null;
    }

    /**
     * Save employee records to the database
     * @param {Array|Object} records - Employee records to store
     * @returns {Promise<Object>} The saved employee records
     */
    async saveEmployeeRecords(records) {
        const { data, error } = await this.supabase
            .from('employee_records')
            .upsert({
                employee_data: records,
                updated_by: this.authService.getCurrentUser().id,
                updated_at: new Date().toISOString()
            });
        
        if (error) {
            throw new Error(`Failed to save employee records: ${error.message}`);
        }
        
        return data;
    }

    /**
     * Load employee records from the database
     * @returns {Promise<Array>} Array of employee records or empty array if none exist
     */
    async loadEmployeeRecords() {
        const { data, error } = await this.supabase
            .from('employee_records')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to load employee records: ${error.message}`);
        }
        
        return data?.employee_data || [];
    }

    /**
     * Subscribe to real-time changes for table data
     * @param {string} tableId - Unique identifier for the table
     * @param {Function} callback - Callback function to handle real-time events
     * @returns {Object} Subscription object for cleanup
     */
    subscribeToTableData(tableId, callback) {
        return this.supabase
            .channel(`table_data:${tableId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'table_data',
                    filter: `table_id=eq.${tableId}`
                },
                callback
            )
            .subscribe();
    }

    /**
     * Unsubscribe from real-time changes
     * @param {Object} subscription - Subscription object returned from subscribeToTableData
     * @returns {Promise<void>}
     */
    unsubscribeFromTableData(subscription) {
        this.supabase.removeChannel(subscription);
    }
}
