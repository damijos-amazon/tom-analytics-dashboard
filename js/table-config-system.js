/**
 * Table Configuration System
 * Manages table configurations, loading, validation, and CRUD operations
 */
class TableConfigSystem {
    constructor(configPath = 'assets/table-config.json') {
        this.configPath = configPath;
        this.config = null;
        this.defaultConfig = this.getDefaultConfig();
    }

    /**
     * Load configuration from localStorage with fallback to JSON file
     * @returns {Promise<Object>} The loaded configuration
     */
    async loadConfig() {
        try {
            // First, try to load from localStorage (user customizations)
            const storedConfig = localStorage.getItem('table_config');
            
            if (storedConfig) {
                console.log('Loading configuration from localStorage');
                const parsedConfig = JSON.parse(storedConfig);
                const validation = this.validateConfig(parsedConfig);
                
                if (validation.valid) {
                    this.config = parsedConfig;
                    console.log('Configuration loaded successfully from localStorage');
                    return this.config;
                } else {
                    console.warn('Stored configuration is invalid:', validation.errors);
                    // Fall through to load from file
                }
            }
            
            // Load from JSON file (default configuration)
            console.log('Loading configuration from file:', this.configPath);
            const response = await fetch(this.configPath);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch config: ${response.status}`);
            }
            
            const fileConfig = await response.json();
            const validation = this.validateConfig(fileConfig);
            
            if (!validation.valid) {
                throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
            }
            
            this.config = fileConfig;
            console.log('Configuration loaded successfully from file');
            return this.config;
            
        } catch (error) {
            console.error('Failed to load configuration:', error);
            console.log('Falling back to default configuration');
            this.config = this.defaultConfig;
            return this.config;
        }
    }

    /**
     * Validate configuration structure
     * @param {Object} config - Configuration object to validate
     * @returns {Object} Validation result with valid flag and errors array
     */
    validateConfig(config) {
        const errors = [];
        
        // Check required top-level fields
        if (!config) {
            errors.push('Configuration is null or undefined');
            return { valid: false, errors };
        }
        
        if (!config.version) {
            errors.push('version is required');
        }
        
        if (!config.defaultTable) {
            errors.push('defaultTable is required');
        }
        
        if (!config.tables || !Array.isArray(config.tables)) {
            errors.push('tables must be an array');
            return { valid: false, errors };
        }
        
        if (config.tables.length === 0) {
            errors.push('tables array cannot be empty');
        }
        
        // Check for duplicate table IDs
        const tableIds = new Set();
        const tableBodyIds = new Set();
        
        config.tables.forEach((table, index) => {
            // Validate each table
            const tableValidation = this.validateTableConfig(table);
            if (!tableValidation.valid) {
                errors.push(`Table ${index}: ${tableValidation.errors.join(', ')}`);
            }
            
            // Check for duplicate IDs
            if (table.tableId) {
                if (tableIds.has(table.tableId)) {
                    errors.push(`Duplicate tableId: ${table.tableId}`);
                }
                tableIds.add(table.tableId);
            }
            
            if (table.tableBodyId) {
                if (tableBodyIds.has(table.tableBodyId)) {
                    errors.push(`Duplicate tableBodyId: ${table.tableBodyId}`);
                }
                tableBodyIds.add(table.tableBodyId);
            }
        });
        
        // Verify defaultTable exists
        if (config.defaultTable && !tableIds.has(config.defaultTable)) {
            errors.push(`defaultTable "${config.defaultTable}" does not exist in tables array`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate individual table configuration
     * @param {Object} tableConfig - Table configuration to validate
     * @returns {Object} Validation result with valid flag and errors array
     */
    validateTableConfig(tableConfig) {
        const errors = [];
        
        // Required fields
        if (!tableConfig.tableId) {
            errors.push('tableId is required');
        }
        
        if (!tableConfig.tableName) {
            errors.push('tableName is required');
        }
        
        if (!tableConfig.tableBodyId) {
            errors.push('tableBodyId is required');
        }
        
        if (!tableConfig.direction) {
            errors.push('direction is required');
        } else if (!['higher', 'lower'].includes(tableConfig.direction)) {
            errors.push('direction must be "higher" or "lower"');
        }
        
        if (typeof tableConfig.defaultBenchmark !== 'number') {
            errors.push('defaultBenchmark must be a number');
        }
        
        if (!tableConfig.filePatterns || !Array.isArray(tableConfig.filePatterns)) {
            errors.push('filePatterns must be an array');
        } else if (tableConfig.filePatterns.length === 0) {
            errors.push('filePatterns array cannot be empty');
        } else {
            // Validate file patterns
            tableConfig.filePatterns.forEach((pattern, index) => {
                if (!pattern.pattern) {
                    errors.push(`filePatterns[${index}]: pattern is required`);
                }
                if (!pattern.type) {
                    errors.push(`filePatterns[${index}]: type is required`);
                } else if (!['exact', 'contains', 'prefix', 'suffix'].includes(pattern.type)) {
                    errors.push(`filePatterns[${index}]: type must be exact, contains, prefix, or suffix`);
                }
                if (typeof pattern.priority !== 'number') {
                    errors.push(`filePatterns[${index}]: priority must be a number`);
                }
            });
        }
        
        // Optional fields validation
        if (tableConfig.columns !== null && tableConfig.columns !== undefined) {
            if (!Array.isArray(tableConfig.columns)) {
                errors.push('columns must be an array or null');
            } else {
                // Validate column schema
                tableConfig.columns.forEach((column, index) => {
                    if (!column.id) {
                        errors.push(`columns[${index}]: id is required`);
                    }
                    if (!column.label) {
                        errors.push(`columns[${index}]: label is required`);
                    }
                    if (!column.dataType) {
                        errors.push(`columns[${index}]: dataType is required`);
                    } else if (!['text', 'number', 'percentage', 'date', 'status'].includes(column.dataType)) {
                        errors.push(`columns[${index}]: dataType must be text, number, percentage, date, or status`);
                    }
                });
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get table configuration by ID
     * @param {string} tableId - Table identifier
     * @returns {Object|null} Table configuration or null if not found
     */
    getTableConfig(tableId) {
        if (!this.config || !this.config.tables) {
            console.error('Configuration not loaded');
            return null;
        }
        
        const table = this.config.tables.find(t => t.tableId === tableId);
        
        if (!table) {
            console.warn(`Table not found: ${tableId}`);
            return null;
        }
        
        return table;
    }

    /**
     * Get all table configurations
     * @returns {Array} Array of all table configurations
     */
    getAllTables() {
        if (!this.config || !this.config.tables) {
            console.error('Configuration not loaded');
            return [];
        }
        
        return this.config.tables;
    }

    /**
     * Get default configuration (fallback)
     * @returns {Object} Default configuration with 6 existing tables
     */
    getDefaultConfig() {
        return {
            version: '1.0',
            defaultTable: 'vti-compliance',
            tables: [
                {
                    tableId: 'vti-compliance',
                    tableName: 'VTI Compliance',
                    displayName: 'VTI Compliance',
                    description: 'VTI compliance metrics tracking',
                    tableBodyId: 'tableBody',
                    storageKey: 'tom_analytics_data',
                    direction: 'higher',
                    defaultBenchmark: 100,
                    color: '#FF9900',
                    visible: true,
                    includeInLeaderboard: true,
                    filePatterns: [
                        { pattern: 'prior-vti', type: 'exact', priority: 1 },
                        { pattern: 'current-vti', type: 'exact', priority: 1 },
                        { pattern: 'vti', type: 'contains', priority: 2, exclude: ['dpmo'] }
                    ],
                    columns: null
                },
                {
                    tableId: 'vti-dpmo',
                    tableName: 'VTI DPMO',
                    displayName: 'VTI DPMO',
                    description: 'VTI Defects Per Million Opportunities tracking',
                    tableBodyId: 'tableBody2',
                    storageKey: 'tom_analytics_data_2',
                    direction: 'lower',
                    defaultBenchmark: 0,
                    color: '#FF9900',
                    visible: true,
                    includeInLeaderboard: true,
                    filePatterns: [
                        { pattern: 'prior-vti-dpmo', type: 'exact', priority: 1 },
                        { pattern: 'current-vti-dpmo', type: 'exact', priority: 1 },
                        { pattern: 'vti-dpmo', type: 'exact', priority: 1 }
                    ],
                    columns: null
                },
                {
                    tableId: 'ta-idle-time',
                    tableName: 'TA Idle Time',
                    displayName: 'TA Idle Time',
                    description: 'Transportation Associate idle time tracking in minutes',
                    tableBodyId: 'tableBody3',
                    storageKey: 'tom_analytics_data_3',
                    direction: 'lower',
                    defaultBenchmark: 5.0,
                    color: '#FF9900',
                    visible: true,
                    includeInLeaderboard: true,
                    filePatterns: [
                        { pattern: 'prior-ta-idle-time', type: 'exact', priority: 1 },
                        { pattern: 'current-ta-idle-time', type: 'exact', priority: 1 },
                        { pattern: 'ta-idle-time', type: 'exact', priority: 1 }
                    ],
                    columns: null
                },
                {
                    tableId: 'seal-validation',
                    tableName: 'Seal Validation Accuracy',
                    displayName: 'Seal Validation Accuracy %',
                    description: 'Seal validation accuracy percentage tracking',
                    tableBodyId: 'tableBody4',
                    storageKey: 'tom_analytics_data_4',
                    direction: 'higher',
                    defaultBenchmark: 100,
                    color: '#FF9900',
                    visible: true,
                    includeInLeaderboard: true,
                    filePatterns: [
                        { pattern: 'prior-seal-validation', type: 'exact', priority: 1 },
                        { pattern: 'current-seal-validation', type: 'exact', priority: 1 },
                        { pattern: 'seal-validation', type: 'exact', priority: 1 }
                    ],
                    columns: null
                },
                {
                    tableId: 'ppo-compliance',
                    tableName: 'PPO Compliance',
                    displayName: 'PPO Compliance',
                    description: 'PPO compliance violations tracking',
                    tableBodyId: 'tableBody5',
                    storageKey: 'tom_analytics_data_5',
                    direction: 'lower',
                    defaultBenchmark: 0,
                    color: '#FF9900',
                    visible: true,
                    includeInLeaderboard: true,
                    filePatterns: [
                        { pattern: 'prior-ppo-compliance', type: 'exact', priority: 1 },
                        { pattern: 'current-ppo-compliance', type: 'exact', priority: 1 },
                        { pattern: 'ppo-compliance', type: 'exact', priority: 1 }
                    ],
                    columns: null
                },
                {
                    tableId: 'andon-response-time',
                    tableName: 'Andon Response Time',
                    displayName: 'Andon Response Time',
                    description: 'Andon response time tracking in minutes',
                    tableBodyId: 'tableBody6',
                    storageKey: 'tom_analytics_data_6',
                    direction: 'lower',
                    defaultBenchmark: 3.0,
                    color: '#FF9900',
                    visible: true,
                    includeInLeaderboard: true,
                    filePatterns: [
                        { pattern: 'prior-andon-response-time', type: 'exact', priority: 1 },
                        { pattern: 'current-andon-response-time', type: 'exact', priority: 1 },
                        { pattern: 'andon-response-time', type: 'exact', priority: 1 },
                        { pattern: 'andon', type: 'contains', priority: 2 }
                    ],
                    columns: null
                }
            ]
        };
    }

    /**
     * Save configuration to localStorage and trigger updates
     * @param {Object} newConfig - New configuration to save
     * @returns {Promise<boolean>} True if save successful
     */
    async saveConfig(newConfig) {
        try {
            // Validate new config
            const validation = this.validateConfig(newConfig);
            if (!validation.valid) {
                throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
            }
            
            // Save to localStorage
            localStorage.setItem('table_config', JSON.stringify(newConfig));
            console.log('Configuration saved to localStorage');
            
            // Update in-memory config
            this.config = newConfig;
            
            // Trigger reload event
            window.dispatchEvent(new CustomEvent('tableConfigUpdated', {
                detail: { config: newConfig }
            }));
            
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            throw error;
        }
    }

    /**
     * Add new table to configuration
     * @param {Object} tableConfig - Table configuration to add
     * @returns {string} The new table ID
     */
    addTable(tableConfig) {
        try {
            // Generate unique tableId if not provided
            if (!tableConfig.tableId) {
                tableConfig.tableId = this.generateTableId(tableConfig.tableName);
            }
            
            // Generate unique tableBodyId
            if (!tableConfig.tableBodyId) {
                const maxBodyId = this.config.tables.reduce((max, table) => {
                    const match = table.tableBodyId.match(/tableBody(\d+)?$/);
                    if (match) {
                        const num = match[1] ? parseInt(match[1]) : 1;
                        return Math.max(max, num);
                    }
                    return max;
                }, 0);
                tableConfig.tableBodyId = maxBodyId === 0 ? 'tableBody' : `tableBody${maxBodyId + 1}`;
            }
            
            // Set defaults
            tableConfig.visible = tableConfig.visible !== false;
            tableConfig.includeInLeaderboard = tableConfig.includeInLeaderboard !== false;
            tableConfig.storageKey = tableConfig.storageKey || `table_data_${tableConfig.tableId}`;
            tableConfig.displayName = tableConfig.displayName || tableConfig.tableName;
            tableConfig.color = tableConfig.color || '#FF9900';
            tableConfig.description = tableConfig.description || '';
            
            // Validate table config
            const validation = this.validateTableConfig(tableConfig);
            if (!validation.valid) {
                throw new Error(`Invalid table config: ${validation.errors.join(', ')}`);
            }
            
            // Check for duplicate IDs
            if (this.config.tables.some(t => t.tableId === tableConfig.tableId)) {
                throw new Error(`Table with ID "${tableConfig.tableId}" already exists`);
            }
            if (this.config.tables.some(t => t.tableBodyId === tableConfig.tableBodyId)) {
                throw new Error(`Table with tableBodyId "${tableConfig.tableBodyId}" already exists`);
            }
            
            // Add to config
            this.config.tables.push(tableConfig);
            console.log(`Added table: ${tableConfig.tableId}`);
            
            // Save config
            this.saveConfig(this.config);
            
            // Return new table ID
            return tableConfig.tableId;
        } catch (error) {
            console.error('Failed to add table:', error);
            throw error;
        }
    }

    /**
     * Update existing table configuration
     * @param {string} tableId - Table ID to update
     * @param {Object} updates - Properties to update
     * @returns {boolean} True if update successful
     */
    updateTable(tableId, updates) {
        try {
            // Find table
            const tableIndex = this.config.tables.findIndex(t => t.tableId === tableId);
            if (tableIndex === -1) {
                throw new Error(`Table not found: ${tableId}`);
            }
            
            // Apply updates
            this.config.tables[tableIndex] = {
                ...this.config.tables[tableIndex],
                ...updates
            };
            
            // Validate updated config
            const validation = this.validateTableConfig(this.config.tables[tableIndex]);
            if (!validation.valid) {
                throw new Error(`Invalid table config: ${validation.errors.join(', ')}`);
            }
            
            console.log(`Updated table: ${tableId}`);
            
            // Save config
            this.saveConfig(this.config);
            
            return true;
        } catch (error) {
            console.error('Failed to update table:', error);
            throw error;
        }
    }

    /**
     * Delete table from configuration
     * @param {string} tableId - Table ID to delete
     * @returns {boolean} True if delete successful
     */
    deleteTable(tableId) {
        try {
            // Find table
            const tableIndex = this.config.tables.findIndex(t => t.tableId === tableId);
            if (tableIndex === -1) {
                throw new Error(`Table not found: ${tableId}`);
            }
            
            // Archive data
            const table = this.config.tables[tableIndex];
            const existingData = localStorage.getItem(table.storageKey);
            if (existingData) {
                const archiveKey = `${table.storageKey}_archived_${Date.now()}`;
                localStorage.setItem(archiveKey, existingData);
                console.log(`Archived data to: ${archiveKey}`);
            }
            
            // Remove from config
            this.config.tables.splice(tableIndex, 1);
            console.log(`Deleted table: ${tableId}`);
            
            // Save config
            this.saveConfig(this.config);
            
            return true;
        } catch (error) {
            console.error('Failed to delete table:', error);
            throw error;
        }
    }

    /**
     * Toggle table visibility
     * @param {string} tableId - Table ID
     * @param {boolean} visible - Visibility state
     * @returns {boolean} True if update successful
     */
    toggleTableVisibility(tableId, visible) {
        try {
            console.log(`Toggling visibility for ${tableId}: ${visible}`);
            return this.updateTable(tableId, { visible });
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            throw error;
        }
    }

    /**
     * Toggle leaderboard inclusion
     * @param {string} tableId - Table ID
     * @param {boolean} includeInLeaderboard - Leaderboard inclusion state
     * @returns {boolean} True if update successful
     */
    toggleLeaderboardInclusion(tableId, includeInLeaderboard) {
        try {
            console.log(`Toggling leaderboard inclusion for ${tableId}: ${includeInLeaderboard}`);
            return this.updateTable(tableId, { includeInLeaderboard });
        } catch (error) {
            console.error('Failed to toggle leaderboard inclusion:', error);
            throw error;
        }
    }

    /**
     * Generate table ID from name
     * @param {string} tableName - Table name
     * @returns {string} Generated table ID in kebab-case
     */
    generateTableId(tableName) {
        return tableName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
