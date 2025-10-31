/**
 * Migration Utility
 * Handles backward compatibility and data migration from legacy system to new configuration-based system
 */
class MigrationUtility {
    constructor() {
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
        
        this.migrationLog = [];
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
}
