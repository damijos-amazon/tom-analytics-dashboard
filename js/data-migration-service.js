/**
 * DataMigrationService
 * Migrates localStorage data to Supabase on first login
 */
class DataMigrationService {
    constructor(authManager, syncManager) {
        this.authManager = authManager;
        this.syncManager = syncManager;
        this.migrationKey = 'supabase_migration_complete';
    }

    /**
     * Check if user has local data to migrate
     * @returns {boolean} True if local data exists
     */
    hasLocalData() {
        // Check for any localStorage keys that contain dashboard data
        const keys = Object.keys(localStorage);
        const dataKeys = keys.filter(key => 
            key.startsWith('tom_analytics_') || 
            key.startsWith('table_config_') ||
            key === 'simpleEmployees'
        );
        
        return dataKeys.length > 0;
    }

    /**
     * Check if migration has already been completed
     * @returns {boolean} True if migration is complete
     */
    isMigrationComplete() {
        return localStorage.getItem(this.migrationKey) === 'true';
    }

    /**
     * Migrate all user data from localStorage to Supabase
     * @param {string} userId - User's Supabase ID
     * @returns {Object} Migration result
     */
    async migrateUserData(userId) {
        try {
            console.log('Starting data migration for user:', userId);
            
            // Check if migration already done
            if (this.isMigrationComplete()) {
                console.log('Migration already completed');
                return {
                    success: true,
                    message: 'Data already migrated',
                    alreadyMigrated: true
                };
            }

            // Check if there's data to migrate
            if (!this.hasLocalData()) {
                console.log('No local data to migrate');
                localStorage.setItem(this.migrationKey, 'true');
                return {
                    success: true,
                    message: 'No data to migrate',
                    noData: true
                };
            }

            // Backup local data first
            const backup = this.backupLocalData();
            console.log('Local data backed up');

            let migratedItems = 0;

            // Migrate table data
            const tableKeys = Object.keys(localStorage).filter(key => key.startsWith('tom_analytics_data'));
            for (const key of tableKeys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && Array.isArray(data)) {
                        // Extract table ID from key (e.g., 'tom_analytics_data_2' -> 'tableBody2')
                        const tableId = key === 'tom_analytics_data' ? 'tableBody' : 
                                       key.replace('tom_analytics_data_', 'tableBody');
                        
                        await this.syncManager.saveTableData(tableId, data);
                        migratedItems++;
                        console.log(`Migrated table data: ${tableId}`);
                    }
                } catch (error) {
                    console.error(`Failed to migrate ${key}:`, error);
                }
            }

            // Migrate table configurations
            const configKeys = Object.keys(localStorage).filter(key => key.startsWith('table_config_'));
            for (const key of configKeys) {
                try {
                    const config = JSON.parse(localStorage.getItem(key));
                    if (config) {
                        await this.syncManager.saveTableConfig(config);
                        migratedItems++;
                        console.log(`Migrated table config: ${key}`);
                    }
                } catch (error) {
                    console.error(`Failed to migrate ${key}:`, error);
                }
            }

            // Migrate employee list
            const employeesData = localStorage.getItem('simpleEmployees');
            if (employeesData) {
                try {
                    const employees = JSON.parse(employeesData);
                    await this.syncManager.syncEmployeeList(employees);
                    migratedItems++;
                    console.log('Migrated employee list');
                } catch (error) {
                    console.error('Failed to migrate employees:', error);
                }
            }

            // Mark migration as complete
            localStorage.setItem(this.migrationKey, 'true');
            
            console.log(`Migration complete! Migrated ${migratedItems} items`);
            
            return {
                success: true,
                message: `Successfully migrated ${migratedItems} items to cloud`,
                itemCount: migratedItems
            };

        } catch (error) {
            console.error('Migration failed:', error);
            return {
                success: false,
                message: `Migration failed: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Create backup of localStorage data
     * @returns {Object} Backup data
     */
    backupLocalData() {
        const backup = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('tom_analytics_') || 
                key.startsWith('table_config_') ||
                key === 'simpleEmployees') {
                backup[key] = localStorage.getItem(key);
            }
        });
        
        // Store backup with timestamp
        const backupKey = `backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        return backup;
    }

    /**
     * Clear local data after successful migration (optional)
     * Keep data as fallback for now
     */
    clearLocalData() {
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('tom_analytics_') || 
                key.startsWith('table_config_') ||
                key === 'simpleEmployees') {
                // Don't actually clear - keep as fallback
                // localStorage.removeItem(key);
            }
        });
        
        console.log('Local data retained as fallback');
    }

    /**
     * Reset migration status (for testing)
     */
    resetMigration() {
        localStorage.removeItem(this.migrationKey);
        console.log('Migration status reset');
    }
}

// Create global instance (will be initialized after syncManager is created)
window.DataMigrationService = DataMigrationService;
