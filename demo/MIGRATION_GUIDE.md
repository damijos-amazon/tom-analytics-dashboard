# Migration Guide: Legacy to Configuration-Based System

## Overview

This guide explains how to migrate from the legacy hardcoded 6-table system to the new configuration-based dynamic table system.

## What's New

The new system replaces hardcoded table definitions with a flexible JSON configuration file (`demo/assets/table-config.json`). This allows you to:

- Add new tables without modifying code
- Configure table properties through a visual interface
- Define custom columns for different data structures
- Control file routing with flexible patterns
- Hide/show tables dynamically
- Manage tables through a configuration modal

## Migration Process

### Automatic Migration

The system includes an automatic migration utility that:

1. **Detects legacy data** - Checks for existing table data in localStorage
2. **Preserves all data** - Ensures no data is lost during migration
3. **Creates backup** - Makes a safety backup before any changes
4. **Maps identifiers** - Converts legacy table IDs to new format
5. **Verifies success** - Checks that migration completed correctly

### When Migration Runs

Migration runs automatically when:
- Legacy data is detected in localStorage
- Migration has not been performed yet (no `migration_complete` flag)

### Manual Migration

You can also run migration manually using the test interface:

1. Open `demo/test-migration.html` in your browser
2. Click "Run Migration" to start the migration process
3. Click "Verify Migration" to check the results
4. Review the migration log for details

## Testing Migration

### Interactive Testing

Use `demo/test-migration.html` for interactive testing:

**Setup:**
```
1. Click "Create Legacy Test Data" to create sample data
2. Click "Run Migration" to perform migration
3. Click "Verify Migration" to check results
```

**Features:**
- View migration status
- Create test data
- Run migration manually
- Verify migration success
- Test legacy backup import
- Rollback migration if needed
- Cleanup old backups

### Automated Testing

Use `demo/test-backward-compatibility.html` for comprehensive automated tests:

**Run Tests:**
```
1. Click "Setup Test Environment" to prepare test data
2. Click "Run All Tests" to execute all 12 tests
3. View results in the summary cards
4. Check detailed log for test output
```

**Tests Included:**
- Legacy table ID mapping (6 tables)
- Reverse table ID mapping
- Data preservation during migration
- Migration backup creation
- Migration verification
- Legacy backup import (array format)
- Legacy backup import (object format)
- New format backup recognition
- Migration rollback
- Migration status reporting
- Table configuration compatibility
- Storage key mapping

## Backward Compatibility

### What's Preserved

✅ **All Data** - Every record in all 6 tables is preserved
✅ **Storage Keys** - Original localStorage keys remain unchanged
✅ **Table Identifiers** - Legacy tableBodyId values are recognized
✅ **File Patterns** - Existing file routing patterns work
✅ **Table Operations** - Sort, edit, delete, export, backup all work
✅ **Backup Files** - Old backup JSON files can be imported

### Legacy Mappings

The system maintains these mappings for backward compatibility:

| Legacy ID | New Table ID | Storage Key |
|-----------|--------------|-------------|
| tableBody | vti-compliance | tom_analytics_data |
| tableBody2 | vti-dpmo | tom_analytics_data_2 |
| tableBody3 | ta-idle-time | tom_analytics_data_3 |
| tableBody4 | seal-validation | tom_analytics_data_4 |
| tableBody5 | ppo-compliance | tom_analytics_data_5 |
| tableBody6 | andon-response-time | tom_analytics_data_6 |

## Migration Utility API

### Core Functions

```javascript
const migrationUtility = new MigrationUtility();

// Check if migration is needed
const needed = migrationUtility.needsMigration();

// Run migration
const result = migrationUtility.migrate();
// Returns: { success: true/false, log: [...], error: '...' }

// Verify migration
const verification = migrationUtility.verifyMigration();
// Returns: { success: true/false, errors: [...], warnings: [...], details: {...} }

// Get migration status
const status = migrationUtility.getMigrationStatus();
// Returns: { migrationComplete, migrationDate, hasLegacyData, legacyDataSummary, backupCount }

// Map legacy table ID to new ID
const newId = migrationUtility.mapLegacyTableId('tableBody');
// Returns: 'vti-compliance'

// Map new table ID to legacy ID
const legacyId = migrationUtility.mapToLegacyTableId('vti-compliance');
// Returns: 'tableBody'

// Import legacy backup
const converted = migrationUtility.importLegacyBackup(legacyBackupData);
// Returns: { version: '1.0', timestamp: '...', tables: {...} }

// Rollback migration
const success = migrationUtility.rollbackMigration();
// Returns: true/false

// Cleanup old backups (keep only most recent)
migrationUtility.cleanupOldBackups(1);
```

## Safety Features

### Automatic Backup

Before migration, the system automatically creates a backup:
- Backup key: `migration_backup_<timestamp>`
- Contains: All table data from all 6 tables
- Format: JSON with version and timestamp

### Rollback Capability

If something goes wrong, you can rollback:

```javascript
migrationUtility.rollbackMigration();
```

This will:
1. Restore data from the most recent migration backup
2. Remove migration completion flags
3. Allow migration to run again

### Verification

After migration, verify success:

```javascript
const verification = migrationUtility.verifyMigration();

if (verification.success) {
    console.log('Migration successful!');
} else {
    console.error('Migration issues:', verification.errors);
}
```

## Troubleshooting

### Migration Not Running

**Problem:** Migration doesn't start automatically

**Solutions:**
1. Check if migration already completed: Look for `migration_complete` flag in localStorage
2. Check if legacy data exists: Look for `tom_analytics_data` keys
3. Run migration manually using test interface
4. Reset migration flag if needed: `localStorage.removeItem('migration_complete')`

### Data Missing After Migration

**Problem:** Some data is missing after migration

**Solutions:**
1. Run verification: `migrationUtility.verifyMigration()`
2. Check migration log for errors
3. Rollback migration: `migrationUtility.rollbackMigration()`
4. Check localStorage for backup: Look for `migration_backup_*` keys
5. Restore from backup manually if needed

### Migration Fails

**Problem:** Migration returns error

**Solutions:**
1. Check browser console for detailed error messages
2. Verify localStorage is not full (quota exceeded)
3. Check that data format is valid JSON
4. Try clearing browser cache and reloading
5. Use test interface to diagnose specific issue

### Legacy Backup Won't Import

**Problem:** Old backup file won't import

**Solutions:**
1. Check backup file format (should be JSON)
2. Use `importLegacyBackup()` function to convert
3. Check console for conversion errors
4. Verify backup contains expected keys
5. Try importing through test interface

## Best Practices

### Before Migration

1. **Export all data** using existing backup functions
2. **Save backup files** to your computer
3. **Document customizations** if you made any code changes
4. **Test on copy** if possible (duplicate localStorage data)

### During Migration

1. **Don't interrupt** the migration process
2. **Keep browser tab open** until complete
3. **Check console** for any error messages
4. **Review migration log** for warnings

### After Migration

1. **Verify all tables** display correctly
2. **Test file uploads** to ensure routing works
3. **Test table operations** (sort, edit, delete, export)
4. **Check leaderboard** calculations
5. **Keep migration backup** for at least a few days

### Cleanup

1. **Wait a few days** before cleanup to ensure everything works
2. **Keep one backup** for safety
3. **Document migration date** for your records
4. **Remove old backups** using cleanup function

## Configuration File

After migration, your tables are defined in `demo/assets/table-config.json`:

```json
{
  "version": "1.0",
  "defaultTable": "vti-compliance",
  "tables": [
    {
      "tableId": "vti-compliance",
      "tableName": "VTI Compliance",
      "tableBodyId": "tableBody",
      "storageKey": "tom_analytics_data",
      "direction": "higher",
      "defaultBenchmark": 100,
      "columns": null,
      ...
    }
  ]
}
```

You can now:
- Edit this file to change table properties
- Use the configuration modal to add new tables
- Define custom columns for new tables
- Configure file routing patterns

## Next Steps

After successful migration:

1. **Explore the configuration modal** - Click "Manage Tables" button
2. **Try adding a new table** - Use the modal interface
3. **Test custom columns** - Create a table with different columns
4. **Configure file patterns** - Set up routing for new file types
5. **Hide/show tables** - Use visibility toggles
6. **Exclude from leaderboard** - Control which tables count

## Support

If you encounter issues:

1. Check the test interfaces for diagnostic information
2. Review the migration log for specific errors
3. Use the verification function to check data integrity
4. Consult the BACKWARD_COMPATIBILITY_TEST_RESULTS.md document
5. Use rollback if needed to restore original state

## Summary

The migration process is designed to be safe, automatic, and reversible. All your existing data is preserved, and you can rollback if needed. The new system maintains full backward compatibility while adding powerful new features for dynamic table management.

Key points:
- ✅ Migration is automatic and safe
- ✅ All data is preserved
- ✅ Backups are created automatically
- ✅ Rollback is available if needed
- ✅ Full backward compatibility maintained
- ✅ Comprehensive testing tools provided
