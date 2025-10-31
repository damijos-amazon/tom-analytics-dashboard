# Data Migration Guide

## Overview

The Data Migration utility handles the migration of data from browser localStorage to the Supabase cloud database. This ensures data persistence, accessibility across devices, and enables real-time collaboration.

## Features

### Automatic Detection
- Detects localStorage data on first database login
- Prompts user to migrate existing data
- Preserves local data as backup during migration

### Data Validation
- Validates data structure before migration
- Checks for required fields (employeeName, etc.)
- Provides detailed error messages for invalid data

### Error Handling
- Automatic rollback on migration failure
- Preserves localStorage if migration fails
- Clear error messages and recovery instructions

### Migration Coverage
The utility migrates:
- **Table Data**: All employee performance records from 6 tables
- **Table Configuration**: Dashboard table settings and visibility
- **Employee Records**: Employee information and metadata

## Usage

### Basic Integration

```javascript
// Initialize with database and auth services
const migrationUtility = new MigrationUtility(databaseService, authService);

// Check if migration is needed
if (migrationUtility.needsDatabaseMigration()) {
    // Handle migration with full error handling
    const result = await migrationUtility.handleMigrationWithErrorHandling();
    
    if (result.success) {
        console.log('Migration completed successfully');
    }
}
```

### Manual Migration Flow

```javascript
// 1. Check if migration is needed
const needed = migrationUtility.needsDatabaseMigration();

if (needed) {
    // 2. Show prompt to user
    const confirmed = await migrationUtility.showMigrationPrompt();
    
    if (confirmed) {
        // 3. Perform migration
        const result = await migrationUtility.migrateToDatabase();
        
        // 4. Show result to user
        migrationUtility.showMigrationResult(result);
    }
}
```

### Get Migration Status

```javascript
const status = migrationUtility.getDatabaseMigrationStatus();

console.log('Migration complete:', status.migrationComplete);
console.log('Migration date:', status.migrationDate);
console.log('Has local data:', status.hasLocalStorageData);
console.log('Backup count:', status.backupCount);
```

## Migration Process

### Step 1: Detection
The utility checks for:
- Existing localStorage data in known keys
- Table configuration data
- Employee records
- Previous migration completion flag

### Step 2: User Prompt
If data is detected, a modal prompts the user with:
- Benefits of migration
- Data safety assurances
- Options to migrate or skip

### Step 3: Backup Creation
Before migration:
- Creates a timestamped backup in localStorage
- Includes all table data, configuration, and employee records
- Backup key format: `db_migration_backup_[timestamp]`

### Step 4: Data Validation
For each data source:
- Validates JSON structure
- Checks for required fields
- Verifies data types
- Reports validation errors

### Step 5: Migration
Migrates data in order:
1. Table data (all 6 tables)
2. Table configuration
3. Employee records

Each record is saved to Supabase with:
- User attribution (created_by, updated_by)
- Timestamps (created_at, updated_at)
- Audit logging

### Step 6: Verification
After migration:
- Compares localStorage and database record counts
- Verifies configuration exists
- Checks employee records
- Reports any discrepancies

### Step 7: Completion
On success:
- Sets `db_migration_complete` flag
- Records migration date
- Logs audit event
- Shows success message to user

On failure:
- Rolls back any partial changes
- Preserves localStorage data
- Shows error message with details
- Allows retry

## Error Handling

### Validation Errors
```javascript
// Example validation error
{
    success: false,
    errors: [
        "Record 5 in tom_analytics_data missing employeeName",
        "Data in tom_analytics_data_2 is not an array"
    ]
}
```

### Migration Errors
```javascript
// Example migration error
{
    success: false,
    errors: [
        "Failed to save table data: Network error",
        "Table configuration migration failed: Timeout"
    ],
    log: [
        "✓ Created migration backup",
        "✓ Migrated 15 table data records",
        "✗ Configuration migration failed",
        "✓ Rollback completed - localStorage data preserved"
    ]
}
```

### Rollback Process
If migration fails:
1. Stops migration immediately
2. Restores from backup (if needed)
3. Removes migration completion flags
4. Preserves all localStorage data
5. Shows clear error message to user

## Testing

### Test File
Use `demo/test-data-migration.html` to test migration:

1. **Create Test Data**: Generates sample localStorage data
2. **Check Migration**: Verifies if migration is needed
3. **Test Prompt**: Shows the migration prompt modal
4. **Perform Migration**: Executes full migration (with mock services)
5. **Rollback**: Tests rollback functionality
6. **View Data**: Displays localStorage contents

### Mock Services
The test file includes mock database and auth services for testing without a real Supabase connection.

## Storage Keys

### Legacy Storage Keys
- `tom_analytics_data` → VTI Compliance
- `tom_analytics_data_2` → VTI DPMO
- `tom_analytics_data_3` → TA Idle Time
- `tom_analytics_data_4` → Seal Validation
- `tom_analytics_data_5` → PPO Compliance
- `tom_analytics_data_6` → Andon Response Time

### Configuration Keys
- `table_config` → Table configuration
- `employee_records` → Employee records

### Migration Keys
- `db_migration_complete` → Migration completion flag
- `db_migration_date` → Migration timestamp
- `db_migration_backup_[timestamp]` → Migration backup

## Requirements Satisfied

### Requirement 11.1
✅ Detects localStorage data on first database login

### Requirement 11.2
✅ Prompts user to migrate existing data

### Requirement 11.3
✅ Transfers all table data, configurations, and employee records

### Requirement 11.4
✅ Validates data before migration

### Requirement 11.5
✅ Rollback on migration failure, preserves localStorage, displays clear error messages

## Best Practices

1. **Always check migration status** before attempting migration
2. **Handle user confirmation** - don't force migration
3. **Show progress indicators** during migration
4. **Provide clear feedback** on success or failure
5. **Keep backups** - don't delete localStorage immediately
6. **Log audit events** for compliance tracking
7. **Test thoroughly** with various data scenarios

## Troubleshooting

### Migration Not Detected
- Check if localStorage contains data
- Verify storage keys match expected format
- Check if migration was already completed

### Migration Fails
- Check network connectivity
- Verify Supabase credentials
- Check user permissions
- Review validation errors
- Check browser console for details

### Data Mismatch After Migration
- Run verification manually
- Compare record counts
- Check for validation warnings
- Review migration log

### Rollback Fails
- Check if backup exists
- Verify localStorage is accessible
- Try manual data restoration

## Support

For issues or questions:
1. Check the migration log for details
2. Review browser console errors
3. Verify Supabase connection
4. Contact system administrator
