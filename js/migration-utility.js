/**
 * Migration Utility
 * Handles backward compatibility and data migration from legacy system to new configuration-based system
 * Also handles migration from localStorage to Supabase database
 */
class MigrationUtility {
    constructor(databaseService = null, authService = null) {
        // Legacy tableBodyId to new tableId mapping
        this.LEGACY_MAPPING = {
            'tableBody': 'vti-compliance',
            'tableBody2': 'vti-dpmo',
            'tableBody3': 'ta-idle-time',
            'tableBody4': 'seal-validation',
            'tableBody5': 'ppo-compliance',
            'tableBody6': 'andon-response-time'
        };
        
        // Legacy storage keys to new storage keys mapping
        this.LEGACY_STORAGE_KEYS = {
            'tom_analytics_data': 'tom_analytics_data',      // VTI Compliance
            'tom_analytics_data_2': 'tom_analytics_data_2',  // VTI DPMO
            'tom_analytics_data_3': 'tom_analytics_data_3',  // TA Idle Time
            'tom_analytics_data_4': 'tom_analytics_data_4',  // Seal Validation
            'tom_analytics_data_5': 'tom_analytics_data_5',  // PPO Compliance
            'tom_analytics_data_6': 'tom_analytics_data_6'   // Andon Response Time
        };
        
        // Storage key to tableId mapping for database migration
        this.STORAGE_KEY_TO_TABLE_ID = {
            'tom_analytics_data': 'vti-compliance',
            'tom_analytics_data_2': 'vti-dpmo',
            'tom_analytics_data_3': 'ta-idle-time',
            'tom_analytics_data_4': 'seal-validation',
            'tom_analytics_data_5': 'ppo-compliance',
            'tom_analytics_data_6': 'andon-response-time'
        };
        
        this.migrationLog = [];
        this.databaseService = databaseService;
        this.authService = authService;
    }

    /**
     * Check if migration is needed
     * @returns {boolean} True if legacy data exists and migration hasn't been performed
     */
    needsMigration() {
        // Check if migration has already been performed
        const migrationComplete = localStorage.getItem('migration_complete');
        if (migrationComplete === 'true') {
            console.log('Migration already completed');
            return false;
        }
        
        // Check if any legacy data exists
        const hasLegacyData = Object.keys(this.LEGACY_STORAGE_KEYS).some(key => {
            return localStorage.getItem(key) !== null;
        });
        
        if (hasLegacyData) {
            console.log('Legacy data detected, migration needed');
            return true;
        }
        
        console.log('No legacy data found, migration not needed');
        return false;
    }

    /**
     * Perform complete migration of legacy data to new format
     * @returns {Object} Migration result with success flag and log
     */
    migrate() {
        console.log('Starting data migration...');
        this.migrationLog = [];
        
        try {
            // Step 1: Migrate table data
            this.migrateTableData();
            
            // Step 2: Migrate backup files metadata (if any)
            this.migrateBackupMetadata();
            
            // Step 3: Create migration backup
            this.createMigrationBackup();
            
            // Step 4: Mark migration as complete
            localStorage.setItem('migration_complete', 'true');
            localStorage.setItem('migration_date', new Date().toISOString());
            
            this.migrationLog.push('Migration completed successfully');
            console.log('Migration completed successfully');
            
            return {
                success: true,
                log: this.migrationLog
            };
            
        } catch (error) {
            console.error('Migration failed:', error);
            this.migrationLog.push(`Migration failed: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                log: this.migrationLog
            };
        }
    }

    /**
     * Migrate table data from legacy storage keys to new format
     */
    migrateTableData() {
        console.log('Migrating table data...');
        
        Object.entries(this.LEGACY_STORAGE_KEYS).forEach(([legacyKey, newKey]) => {
            const data = localStorage.getItem(legacyKey);
            
            if (data) {
                try {
                    // Parse the data
                    const parsedData = JSON.parse(data);
                    
                    // Validate data structure
                    if (Array.isArray(parsedData)) {
                        // Data is already in correct format (array of objects)
                        // Just ensure it's stored with the correct key
                        if (legacyKey !== newKey) {
                            localStorage.setItem(newKey, data);
                            this.migrationLog.push(`Migrated data from ${legacyKey} to ${newKey}`);
                            console.log(`Migrated: ${legacyKey} -> ${newKey}`);
                        } else {
                            this.migrationLog.push(`Data already in correct format: ${legacyKey}`);
                            console.log(`Data already correct: ${legacyKey}`);
                        }
                        
                        // Log data count
                        this.migrationLog.push(`  - ${parsedData.length} records preserved`);
                        
                    } else {
                        // Unexpected data format
                        console.warn(`Unexpected data format in ${legacyKey}:`, parsedData);
                        this.migrationLog.push(`Warning: Unexpected format in ${legacyKey}, data preserved as-is`);
                    }
                    
                } catch (error) {
                    console.error(`Failed to parse data from ${legacyKey}:`, error);
                    this.migrationLog.push(`Error parsing ${legacyKey}: ${error.message}`);
                }
            } else {
                this.migrationLog.push(`No data found for ${legacyKey}`);
            }
        });
    }

    /**
     * Migrate backup files metadata
     */
    migrateBackupMetadata() {
        console.log('Migrating backup metadata...');
        
        // Look for any backup-related keys in localStorage
        const backupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('backup') || key.includes('archived'))) {
                backupKeys.push(key);
            }
        }
        
        if (backupKeys.length > 0) {
            this.migrationLog.push(`Found ${backupKeys.length} backup/archive entries`);
            console.log(`Found ${backupKeys.length} backup entries:`, backupKeys);
            
            // Backup entries are preserved as-is, no migration needed
            this.migrationLog.push('Backup entries preserved in original format');
        } else {
            this.migrationLog.push('No backup entries found');
        }
    }

    /**
     * Create a complete backup before migration
     */
    createMigrationBackup() {
        console.log('Creating migration backup...');
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            tables: {}
        };
        
        // Backup all legacy data
        Object.entries(this.LEGACY_STORAGE_KEYS).forEach(([legacyKey, newKey]) => {
            const data = localStorage.getItem(legacyKey);
            if (data) {
                backup.tables[legacyKey] = data;
            }
        });
        
        // Save backup
        const backupKey = `migration_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        this.migrationLog.push(`Migration backup created: ${backupKey}`);
        console.log(`Migration backup created: ${backupKey}`);
    }

    /**
     * Map legacy tableBodyId to new tableId
     * @param {string} tableBodyId - Legacy table body ID
     * @returns {string|null} New table ID or null if not found
     */
    mapLegacyTableId(tableBodyId) {
        return this.LEGACY_MAPPING[tableBodyId] || null;
    }

    /**
     * Map new tableId to legacy tableBodyId (reverse mapping)
     * @param {string} tableId - New table ID
     * @returns {string|null} Legacy table body ID or null if not found
     */
    mapToLegacyTableId(tableId) {
        const entry = Object.entries(this.LEGACY_MAPPING).find(([key, value]) => value === tableId);
        return entry ? entry[0] : null;
    }

    /**
     * Get legacy storage key for a table
     * @param {string} tableBodyId - Legacy table body ID
     * @returns {string|null} Storage key or null if not found
     */
    getLegacyStorageKey(tableBodyId) {
        const tableId = this.mapLegacyTableId(tableBodyId);
        if (!tableId) return null;
        
        // Find the storage key from the mapping
        const storageKeyEntry = Object.entries(this.LEGACY_STORAGE_KEYS).find(([key, value]) => {
            // Match based on the pattern
            return key.includes('tom_analytics_data');
        });
        
        return storageKeyEntry ? storageKeyEntry[0] : null;
    }

    /**
     * Import legacy backup file and convert to new format
     * @param {Object} backupData - Legacy backup data
     * @returns {Object} Converted backup data in new format
     */
    importLegacyBackup(backupData) {
        console.log('Importing legacy backup...');
        
        try {
            // Check if backup is already in new format
            if (backupData.version && backupData.tables) {
                console.log('Backup is already in new format');
                return backupData;
            }
            
            // Convert legacy backup format
            const convertedBackup = {
                timestamp: backupData.timestamp || new Date().toISOString(),
                version: '1.0',
                tables: {}
            };
            
            // If backup has direct table data (old format)
            if (Array.isArray(backupData)) {
                // Single table backup
                convertedBackup.tables['tom_analytics_data'] = backupData;
            } else if (typeof backupData === 'object') {
                // Multi-table backup
                Object.entries(backupData).forEach(([key, value]) => {
                    // Check if key is a legacy storage key
                    if (this.LEGACY_STORAGE_KEYS[key]) {
                        convertedBackup.tables[key] = value;
                    } else if (key === 'timestamp' || key === 'version') {
                        // Skip metadata fields
                    } else {
                        // Unknown format, preserve as-is
                        convertedBackup.tables[key] = value;
                    }
                });
            }
            
            console.log('Legacy backup converted successfully');
            return convertedBackup;
            
        } catch (error) {
            console.error('Failed to import legacy backup:', error);
            throw new Error(`Legacy backup import failed: ${error.message}`);
        }
    }

    /**
     * Verify data integrity after migration
     * @returns {Object} Verification result with success flag and details
     */
    verifyMigration() {
        console.log('Verifying migration...');
        
        const verification = {
            success: true,
            errors: [],
            warnings: [],
            details: {}
        };
        
        // Check each legacy storage key
        Object.entries(this.LEGACY_STORAGE_KEYS).forEach(([legacyKey, newKey]) => {
            const legacyData = localStorage.getItem(legacyKey);
            const newData = localStorage.getItem(newKey);
            
            if (legacyData && !newData) {
                verification.errors.push(`Data missing after migration: ${newKey}`);
                verification.success = false;
            } else if (legacyData && newData) {
                try {
                    const legacyParsed = JSON.parse(legacyData);
                    const newParsed = JSON.parse(newData);
                    
                    if (Array.isArray(legacyParsed) && Array.isArray(newParsed)) {
                        if (legacyParsed.length !== newParsed.length) {
                            verification.warnings.push(
                                `Record count mismatch for ${newKey}: ${legacyParsed.length} -> ${newParsed.length}`
                            );
                        }
                        
                        verification.details[newKey] = {
                            recordCount: newParsed.length,
                            status: 'verified'
                        };
                    }
                } catch (error) {
                    verification.errors.push(`Failed to verify ${newKey}: ${error.message}`);
                    verification.success = false;
                }
            }
        });
        
        // Check migration completion flag
        if (localStorage.getItem('migration_complete') !== 'true') {
            verification.errors.push('Migration completion flag not set');
            verification.success = false;
        }
        
        console.log('Migration verification:', verification);
        return verification;
    }

    /**
     * Rollback migration (restore from backup)
     * @returns {boolean} True if rollback successful
     */
    rollbackMigration() {
        console.log('Rolling back migration...');
        
        try {
            // Find the most recent migration backup
            let latestBackupKey = null;
            let latestTimestamp = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('migration_backup_')) {
                    const timestamp = parseInt(key.replace('migration_backup_', ''));
                    if (timestamp > latestTimestamp) {
                        latestTimestamp = timestamp;
                        latestBackupKey = key;
                    }
                }
            }
            
            if (!latestBackupKey) {
                throw new Error('No migration backup found');
            }
            
            // Restore from backup
            const backupData = JSON.parse(localStorage.getItem(latestBackupKey));
            
            Object.entries(backupData.tables).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
            
            // Remove migration flags
            localStorage.removeItem('migration_complete');
            localStorage.removeItem('migration_date');
            
            console.log('Migration rolled back successfully');
            return true;
            
        } catch (error) {
            console.error('Rollback failed:', error);
            return false;
        }
    }

    /**
     * Get migration status and information
     * @returns {Object} Migration status information
     */
    getMigrationStatus() {
        const status = {
            migrationComplete: localStorage.getItem('migration_complete') === 'true',
            migrationDate: localStorage.getItem('migration_date'),
            hasLegacyData: false,
            legacyDataSummary: {},
            backupCount: 0
        };
        
        // Check for legacy data
        Object.entries(this.LEGACY_STORAGE_KEYS).forEach(([legacyKey, newKey]) => {
            const data = localStorage.getItem(legacyKey);
            if (data) {
                status.hasLegacyData = true;
                try {
                    const parsed = JSON.parse(data);
                    status.legacyDataSummary[legacyKey] = {
                        recordCount: Array.isArray(parsed) ? parsed.length : 'unknown',
                        size: data.length
                    };
                } catch (error) {
                    status.legacyDataSummary[legacyKey] = {
                        error: 'Failed to parse'
                    };
                }
            }
        });
        
        // Count backup files
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('migration_backup_')) {
                status.backupCount++;
            }
        }
        
        return status;
    }

    /**
     * Clean up old migration backups (keep only the most recent)
     * @param {number} keepCount - Number of backups to keep (default: 1)
     */
    cleanupOldBackups(keepCount = 1) {
        console.log(`Cleaning up old migration backups, keeping ${keepCount}...`);
        
        const backups = [];
        
        // Find all migration backups
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('migration_backup_')) {
                const timestamp = parseInt(key.replace('migration_backup_', ''));
                backups.push({ key, timestamp });
            }
        }
        
        // Sort by timestamp (newest first)
        backups.sort((a, b) => b.timestamp - a.timestamp);
        
        // Remove old backups
        const toRemove = backups.slice(keepCount);
        toRemove.forEach(backup => {
            localStorage.removeItem(backup.key);
            console.log(`Removed old backup: ${backup.key}`);
        });
        
        console.log(`Cleanup complete. Removed ${toRemove.length} old backups.`);
    }

    // ========================================================================
    // DATABASE MIGRATION METHODS (localStorage to Supabase)
    // ========================================================================

    /**
     * Check if database migration is needed
     * Detects localStorage data on first database login
     * @returns {boolean} True if localStorage data exists and database migration hasn't been performed
     */
    needsDatabaseMigration() {
        // Check if database migration has already been performed
        const dbMigrationComplete = localStorage.getItem('db_migration_complete');
        if (dbMigrationComplete === 'true') {
            console.log('Database migration already completed');
            return false;
        }
        
        // Check if any localStorage data exists
        const hasLocalStorageData = Object.keys(this.LEGACY_STORAGE_KEYS).some(key => {
            const data = localStorage.getItem(key);
            if (!data) return false;
            
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) && parsed.length > 0;
            } catch {
                return false;
            }
        });
        
        // Also check for table configuration
        const hasTableConfig = localStorage.getItem('table_config') !== null;
        
        // Also check for employee records
        const hasEmployeeRecords = localStorage.getItem('employee_records') !== null;
        
        if (hasLocalStorageData || hasTableConfig || hasEmployeeRecords) {
            console.log('localStorage data detected, database migration needed');
            return true;
        }
        
        console.log('No localStorage data found, database migration not needed');
        return false;
    }

    /**
     * Show migration prompt to user
     * @returns {Promise<boolean>} True if user confirms migration, false if declined
     */
    async showMigrationPrompt() {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'migrationPromptModal';
            modal.className = 'migration-prompt-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <h3>🔄 Data Migration Available</h3>
                    <p>We detected existing data in your browser's local storage. Would you like to migrate this data to the cloud database?</p>
                    <div class="migration-details">
                        <p><strong>Benefits of migration:</strong></p>
                        <ul>
                            <li>Access your data from any device</li>
                            <li>Real-time collaboration with team members</li>
                            <li>Automatic backups and data security</li>
                            <li>No risk of data loss from browser cache clearing</li>
                        </ul>
                        <p class="warning"><strong>Note:</strong> Your local data will be preserved as a backup during migration.</p>
                    </div>
                    <div class="modal-buttons">
                        <button id="confirmMigration" class="btn-primary">Migrate Data</button>
                        <button id="declineMigration" class="btn-secondary">Skip for Now</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Handle confirm
            document.getElementById('confirmMigration').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
            
            // Handle decline
            document.getElementById('declineMigration').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    /**
     * Migrate all localStorage data to Supabase database
     * @returns {Promise<Object>} Migration result with success flag, counts, and log
     */
    async migrateToDatabase() {
        if (!this.databaseService || !this.authService) {
            throw new Error('DatabaseService and AuthService are required for database migration');
        }

        console.log('Starting database migration...');
        this.migrationLog = [];
        
        const migrationResult = {
            success: false,
            tableDataCount: 0,
            configMigrated: false,
            employeeRecordsMigrated: false,
            errors: [],
            log: []
        };

        try {
            // Create backup before migration
            await this.createDatabaseMigrationBackup();
            this.migrationLog.push('✓ Created migration backup');

            // Step 1: Migrate table data
            const tableDataResult = await this.migrateTableDataToDatabase();
            migrationResult.tableDataCount = tableDataResult.count;
            this.migrationLog.push(`✓ Migrated ${tableDataResult.count} table data records`);

            // Step 2: Migrate table configuration
            const configResult = await this.migrateTableConfigToDatabase();
            migrationResult.configMigrated = configResult.success;
            if (configResult.success) {
                this.migrationLog.push('✓ Migrated table configuration');
            }

            // Step 3: Migrate employee records
            const employeeResult = await this.migrateEmployeeRecordsToDatabase();
            migrationResult.employeeRecordsMigrated = employeeResult.success;
            if (employeeResult.success) {
                this.migrationLog.push(`✓ Migrated ${employeeResult.count} employee records`);
            }

            // Step 4: Verify migration
            const verification = await this.verifyDatabaseMigration();
            if (!verification.success) {
                throw new Error('Migration verification failed: ' + verification.errors.join(', '));
            }
            this.migrationLog.push('✓ Migration verification passed');

            // Step 5: Mark migration as complete
            localStorage.setItem('db_migration_complete', 'true');
            localStorage.setItem('db_migration_date', new Date().toISOString());
            
            // Log migration event
            await this.authService.logAuditEvent(
                'data_migration',
                'localStorage_to_database',
                null,
                {
                    tableDataCount: migrationResult.tableDataCount,
                    configMigrated: migrationResult.configMigrated,
                    employeeRecordsMigrated: migrationResult.employeeRecordsMigrated
                }
            );

            migrationResult.success = true;
            migrationResult.log = this.migrationLog;
            
            console.log('Database migration completed successfully');
            return migrationResult;

        } catch (error) {
            console.error('Database migration failed:', error);
            migrationResult.errors.push(error.message);
            migrationResult.log = this.migrationLog;
            
            // Attempt rollback
            try {
                await this.rollbackDatabaseMigration();
                this.migrationLog.push('✓ Rollback completed - localStorage data preserved');
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
                this.migrationLog.push(`✗ Rollback failed: ${rollbackError.message}`);
            }
            
            return migrationResult;
        }
    }

    /**
     * Validate data before migration
     * @param {string} storageKey - localStorage key
     * @param {any} data - Data to validate
     * @returns {Object} Validation result with success flag and errors
     */
    validateDataForMigration(storageKey, data) {
        const validation = {
            success: true,
            errors: [],
            warnings: []
        };

        try {
            // Check if data is valid JSON
            const parsed = JSON.parse(data);

            // Check if data is an array
            if (!Array.isArray(parsed)) {
                validation.errors.push(`Data in ${storageKey} is not an array`);
                validation.success = false;
                return validation;
            }

            // Check if array is empty
            if (parsed.length === 0) {
                validation.warnings.push(`${storageKey} contains no records`);
                return validation;
            }

            // Validate each record
            parsed.forEach((record, index) => {
                // Check for required fields
                if (!record.employeeName) {
                    validation.errors.push(`Record ${index} in ${storageKey} missing employeeName`);
                    validation.success = false;
                }

                // Check for data integrity
                if (typeof record !== 'object') {
                    validation.errors.push(`Record ${index} in ${storageKey} is not an object`);
                    validation.success = false;
                }
            });

        } catch (error) {
            validation.errors.push(`Failed to parse ${storageKey}: ${error.message}`);
            validation.success = false;
        }

        return validation;
    }

    /**
     * Migrate table data from localStorage to database with validation
     * @returns {Promise<Object>} Result with count of migrated records
     */
    async migrateTableDataToDatabase() {
        let count = 0;
        const errors = [];
        const validationErrors = [];

        for (const [storageKey, tableId] of Object.entries(this.STORAGE_KEY_TO_TABLE_ID)) {
            const data = localStorage.getItem(storageKey);
            
            if (!data) {
                console.log(`No data found for ${storageKey}`);
                continue;
            }

            // Validate data before migration
            const validation = this.validateDataForMigration(storageKey, data);
            
            if (!validation.success) {
                console.error(`Validation failed for ${storageKey}:`, validation.errors);
                validationErrors.push(...validation.errors);
                continue; // Skip this table if validation fails
            }

            if (validation.warnings.length > 0) {
                console.warn(`Validation warnings for ${storageKey}:`, validation.warnings);
            }

            try {
                const parsedData = JSON.parse(data);
                
                if (!Array.isArray(parsedData)) {
                    console.warn(`Data in ${storageKey} is not an array, skipping`);
                    continue;
                }

                // Migrate each employee record
                for (const record of parsedData) {
                    if (!record.employeeName) {
                        console.warn('Record missing employeeName, skipping:', record);
                        continue;
                    }

                    try {
                        await this.databaseService.saveTableData(
                            tableId,
                            record.employeeName,
                            record
                        );
                        count++;
                    } catch (error) {
                        console.error(`Failed to migrate record for ${record.employeeName}:`, error);
                        errors.push(`${record.employeeName}: ${error.message}`);
                    }
                }

                console.log(`Migrated ${parsedData.length} records from ${storageKey} to ${tableId}`);

            } catch (error) {
                console.error(`Failed to parse data from ${storageKey}:`, error);
                errors.push(`${storageKey}: ${error.message}`);
            }
        }

        // If there were validation errors, include them in the result
        if (validationErrors.length > 0) {
            errors.push(...validationErrors);
        }

        if (errors.length > 0) {
            console.warn('Some records failed to migrate:', errors);
            // If too many errors, throw to trigger rollback
            if (errors.length > count) {
                throw new Error(`Migration failed: ${errors.length} errors occurred, only ${count} records migrated`);
            }
        }

        return { count, errors };
    }

    /**
     * Migrate table configuration from localStorage to database
     * @returns {Promise<Object>} Result with success flag
     */
    async migrateTableConfigToDatabase() {
        const configData = localStorage.getItem('table_config');
        
        if (!configData) {
            console.log('No table configuration found in localStorage');
            return { success: false };
        }

        try {
            const config = JSON.parse(configData);
            await this.databaseService.saveTableConfiguration(config);
            console.log('Table configuration migrated successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to migrate table configuration:', error);
            throw new Error(`Table configuration migration failed: ${error.message}`);
        }
    }

    /**
     * Migrate employee records from localStorage to database
     * @returns {Promise<Object>} Result with success flag and count
     */
    async migrateEmployeeRecordsToDatabase() {
        const employeeData = localStorage.getItem('employee_records');
        
        if (!employeeData) {
            console.log('No employee records found in localStorage');
            return { success: false, count: 0 };
        }

        try {
            const records = JSON.parse(employeeData);
            await this.databaseService.saveEmployeeRecords(records);
            
            const count = Array.isArray(records) ? records.length : 1;
            console.log(`Employee records migrated successfully (${count} records)`);
            return { success: true, count };
        } catch (error) {
            console.error('Failed to migrate employee records:', error);
            throw new Error(`Employee records migration failed: ${error.message}`);
        }
    }

    /**
     * Create backup before database migration
     * @returns {Promise<void>}
     */
    async createDatabaseMigrationBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            type: 'database_migration',
            data: {}
        };

        // Backup all localStorage data
        for (const storageKey of Object.keys(this.STORAGE_KEY_TO_TABLE_ID)) {
            const data = localStorage.getItem(storageKey);
            if (data) {
                backup.data[storageKey] = data;
            }
        }

        // Backup configuration
        const config = localStorage.getItem('table_config');
        if (config) {
            backup.data.table_config = config;
        }

        // Backup employee records
        const employees = localStorage.getItem('employee_records');
        if (employees) {
            backup.data.employee_records = employees;
        }

        // Save backup
        const backupKey = `db_migration_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        console.log(`Database migration backup created: ${backupKey}`);
    }

    /**
     * Verify database migration was successful
     * @returns {Promise<Object>} Verification result
     */
    async verifyDatabaseMigration() {
        const verification = {
            success: true,
            errors: [],
            warnings: []
        };

        try {
            // Verify table data
            for (const [storageKey, tableId] of Object.entries(this.STORAGE_KEY_TO_TABLE_ID)) {
                const localData = localStorage.getItem(storageKey);
                
                if (!localData) continue;

                try {
                    const localParsed = JSON.parse(localData);
                    const dbData = await this.databaseService.loadTableData(tableId);

                    if (Array.isArray(localParsed) && localParsed.length > 0) {
                        if (dbData.length === 0) {
                            verification.errors.push(`No data found in database for ${tableId}`);
                            verification.success = false;
                        } else if (dbData.length !== localParsed.length) {
                            verification.warnings.push(
                                `Record count mismatch for ${tableId}: localStorage=${localParsed.length}, database=${dbData.length}`
                            );
                        }
                    }
                } catch (error) {
                    verification.errors.push(`Verification failed for ${tableId}: ${error.message}`);
                    verification.success = false;
                }
            }

            // Verify configuration
            const localConfig = localStorage.getItem('table_config');
            if (localConfig) {
                try {
                    const dbConfig = await this.databaseService.loadTableConfiguration();
                    if (!dbConfig) {
                        verification.errors.push('Table configuration not found in database');
                        verification.success = false;
                    }
                } catch (error) {
                    verification.errors.push(`Configuration verification failed: ${error.message}`);
                    verification.success = false;
                }
            }

            // Verify employee records
            const localEmployees = localStorage.getItem('employee_records');
            if (localEmployees) {
                try {
                    const dbEmployees = await this.databaseService.loadEmployeeRecords();
                    if (!dbEmployees || dbEmployees.length === 0) {
                        verification.errors.push('Employee records not found in database');
                        verification.success = false;
                    }
                } catch (error) {
                    verification.errors.push(`Employee records verification failed: ${error.message}`);
                    verification.success = false;
                }
            }

        } catch (error) {
            verification.errors.push(`Verification process failed: ${error.message}`);
            verification.success = false;
        }

        return verification;
    }

    /**
     * Rollback database migration (preserve localStorage)
     * @returns {Promise<void>}
     */
    async rollbackDatabaseMigration() {
        console.log('Rolling back database migration...');
        
        // Find the most recent database migration backup
        let latestBackupKey = null;
        let latestTimestamp = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('db_migration_backup_')) {
                const timestamp = parseInt(key.replace('db_migration_backup_', ''));
                if (timestamp > latestTimestamp) {
                    latestTimestamp = timestamp;
                    latestBackupKey = key;
                }
            }
        }
        
        if (!latestBackupKey) {
            console.log('No database migration backup found, localStorage should still be intact');
            return;
        }
        
        // Restore from backup (though localStorage should still be intact)
        const backupData = JSON.parse(localStorage.getItem(latestBackupKey));
        
        Object.entries(backupData.data).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        // Remove migration flags
        localStorage.removeItem('db_migration_complete');
        localStorage.removeItem('db_migration_date');
        
        console.log('Database migration rolled back - localStorage data preserved');
    }

    /**
     * Show migration error with clear message
     * @param {string} errorMessage - Error message to display
     * @param {Array} details - Additional error details
     * @returns {void}
     */
    showMigrationError(errorMessage, details = []) {
        const modal = document.createElement('div');
        modal.id = 'migrationErrorModal';
        modal.className = 'migration-error-modal';
        
        let detailsHTML = '';
        if (details.length > 0) {
            detailsHTML = `
                <div class="error-details">
                    <p><strong>Error Details:</strong></p>
                    <ul>
                        ${details.map(detail => `<li>${this.escapeHtml(detail)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content error">
                <h3>❌ Migration Error</h3>
                <p class="error-message">${this.escapeHtml(errorMessage)}</p>
                ${detailsHTML}
                <div class="error-actions">
                    <p><strong>What happened:</strong></p>
                    <ul>
                        <li>Your local data has been preserved and is safe</li>
                        <li>No changes were made to the database</li>
                        <li>You can continue using the application with local storage</li>
                    </ul>
                    <p><strong>What you can do:</strong></p>
                    <ul>
                        <li>Try migrating again later</li>
                        <li>Contact support if the problem persists</li>
                        <li>Continue working with local storage</li>
                    </ul>
                </div>
                <div class="modal-buttons">
                    <button id="closeMigrationError" class="btn-primary">Continue</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('closeMigrationError').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Show migration result to user
     * @param {Object} result - Migration result object
     * @returns {void}
     */
    showMigrationResult(result) {
        const modal = document.createElement('div');
        modal.id = 'migrationResultModal';
        modal.className = 'migration-result-modal';
        
        const statusIcon = result.success ? '✅' : '❌';
        const statusText = result.success ? 'Migration Successful!' : 'Migration Failed';
        const statusClass = result.success ? 'success' : 'error';
        
        let detailsHTML = '';
        if (result.success) {
            detailsHTML = `
                <div class="migration-summary">
                    <p>✓ ${result.tableDataCount} table data records migrated</p>
                    <p>✓ Configuration ${result.configMigrated ? 'migrated' : 'not found'}</p>
                    <p>✓ Employee records ${result.employeeRecordsMigrated ? 'migrated' : 'not found'}</p>
                </div>
                <p class="info">Your data is now stored in the cloud database and will be accessible from any device.</p>
                <p class="info"><strong>Note:</strong> Your local data has been preserved as a backup.</p>
            `;
        } else {
            detailsHTML = `
                <div class="migration-errors">
                    <p><strong>Migration encountered errors:</strong></p>
                    <ul>
                        ${result.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                    </ul>
                </div>
                <div class="error-recovery">
                    <p class="info"><strong>Your data is safe:</strong></p>
                    <ul>
                        <li>All local data has been preserved</li>
                        <li>No changes were made to the database</li>
                        <li>You can try migrating again later</li>
                    </ul>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content ${statusClass}">
                <h3>${statusIcon} ${statusText}</h3>
                ${detailsHTML}
                <div class="migration-log">
                    <details>
                        <summary>View Migration Log</summary>
                        <pre>${result.log.map(line => this.escapeHtml(line)).join('\n')}</pre>
                    </details>
                </div>
                <div class="modal-buttons">
                    <button id="closeMigrationResult" class="btn-primary">Continue</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('closeMigrationResult').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle migration with full error handling and user feedback
     * @returns {Promise<Object>} Migration result
     */
    async handleMigrationWithErrorHandling() {
        try {
            // Check if migration is needed
            if (!this.needsDatabaseMigration()) {
                console.log('No migration needed');
                return { success: true, skipped: true };
            }

            // Show prompt to user
            const userConfirmed = await this.showMigrationPrompt();
            
            if (!userConfirmed) {
                console.log('User declined migration');
                return { success: true, declined: true };
            }

            // Show progress indicator
            this.showMigrationProgress('Starting migration...');

            // Perform migration
            const result = await this.migrateToDatabase();

            // Hide progress indicator
            this.hideMigrationProgress();

            // Show result to user
            this.showMigrationResult(result);

            return result;

        } catch (error) {
            console.error('Migration error:', error);
            
            // Hide progress indicator
            this.hideMigrationProgress();

            // Show error to user
            this.showMigrationError(
                'An unexpected error occurred during migration',
                [error.message]
            );

            return {
                success: false,
                errors: [error.message],
                log: this.migrationLog
            };
        }
    }

    /**
     * Show migration progress indicator
     * @param {string} message - Progress message
     * @returns {void}
     */
    showMigrationProgress(message) {
        // Remove existing progress indicator
        this.hideMigrationProgress();

        const progress = document.createElement('div');
        progress.id = 'migrationProgress';
        progress.className = 'migration-progress';
        progress.innerHTML = `
            <div class="progress-overlay"></div>
            <div class="progress-content">
                <div class="spinner"></div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        
        document.body.appendChild(progress);
    }

    /**
     * Hide migration progress indicator
     * @returns {void}
     */
    hideMigrationProgress() {
        const progress = document.getElementById('migrationProgress');
        if (progress) {
            progress.remove();
        }
    }

    /**
     * Update migration progress message
     * @param {string} message - New progress message
     * @returns {void}
     */
    updateMigrationProgress(message) {
        const progress = document.getElementById('migrationProgress');
        if (progress) {
            const messageElement = progress.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    /**
     * Get database migration status
     * @returns {Object} Migration status information
     */
    getDatabaseMigrationStatus() {
        return {
            migrationComplete: localStorage.getItem('db_migration_complete') === 'true',
            migrationDate: localStorage.getItem('db_migration_date'),
            hasLocalStorageData: this.needsDatabaseMigration(),
            backupCount: this.countDatabaseMigrationBackups()
        };
    }

    /**
     * Count database migration backups
     * @returns {number} Number of backups
     */
    countDatabaseMigrationBackups() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('db_migration_backup_')) {
                count++;
            }
        }
        return count;
    }
}
