# Requirements Document

## Introduction

This feature transforms the current hardcoded 6-table system into a dynamic, configuration-driven architecture. Users will be able to define tables, their properties, and file upload mappings through a JSON configuration file without modifying code. The system will automatically generate table UI, handle file routing, and manage data persistence based on the configuration.

## Glossary

- **Table Configuration System**: The JSON-based system that defines all table properties, behaviors, and file mappings
- **Dashboard Instance**: A JavaScript object that manages a single table's data, UI, and operations
- **File Routing Engine**: The component that maps uploaded files to target tables based on configuration rules
- **Dynamic Table Generator**: The component that creates HTML table elements from configuration
- **Configuration File**: A JSON file (table-config.json) that defines all tables and their properties

## Requirements

### Requirement 1

**User Story:** As a dashboard administrator, I want to define new tables in a JSON configuration file, so that I can add tables without modifying JavaScript or HTML code

#### Acceptance Criteria

1. WHEN the application initializes, THE Table Configuration System SHALL load table definitions from a JSON configuration file located at 'demo/assets/table-config.json'
2. THE Table Configuration System SHALL validate that each table definition contains required fields: tableId, tableName, tableBodyId, direction, defaultBenchmark, and filePatterns
3. IF the configuration file is missing or invalid, THEN THE Table Configuration System SHALL log an error message and fall back to default table definitions
4. THE Table Configuration System SHALL support a minimum of 10 table definitions in a single configuration file
5. WHEN a table definition is added to the configuration file, THE Dynamic Table Generator SHALL create the corresponding HTML table element without code changes

### Requirement 2

**User Story:** As a dashboard administrator, I want to specify file upload patterns for each table in the configuration, so that uploaded files are automatically routed to the correct table

#### Acceptance Criteria

1. WHEN a file is uploaded via drag-and-drop, THE File Routing Engine SHALL match the filename against filePatterns defined in the configuration
2. THE File Routing Engine SHALL support multiple pattern types: exact match, prefix match, suffix match, and contains match
3. WHEN multiple patterns match a filename, THE File Routing Engine SHALL route the file to the table with the highest priority pattern match
4. IF no patterns match the uploaded filename, THEN THE File Routing Engine SHALL route the file to the default table specified in the configuration
5. THE File Routing Engine SHALL log the routing decision with the matched pattern and target table name

### Requirement 3

**User Story:** As a dashboard administrator, I want to configure table-specific properties like scoring direction and benchmarks, so that each table calculates metrics correctly

#### Acceptance Criteria

1. THE Table Configuration System SHALL support a direction property with values 'higher' or 'lower' to indicate scoring direction
2. THE Table Configuration System SHALL support a defaultBenchmark numeric property for each table
3. WHEN calculating fair scores, THE Dashboard Instance SHALL use the direction property from configuration to determine if higher or lower values are better
4. THE Dashboard Instance SHALL use the defaultBenchmark value from configuration when no custom benchmark is set
5. WHEN the configuration is updated, THE Dashboard Instance SHALL apply new property values without requiring application restart

### Requirement 4

**User Story:** As a dashboard administrator, I want the system to automatically generate table UI from configuration, so that I don't need to manually create HTML for each table

#### Acceptance Criteria

1. WHEN the application loads, THE Dynamic Table Generator SHALL create HTML table elements for each table defined in configuration
2. THE Dynamic Table Generator SHALL generate table headers with columns: Name, Prior Month, Current Month, Change, Status, and Actions
3. THE Dynamic Table Generator SHALL apply consistent styling and classes to generated table elements
4. THE Dynamic Table Generator SHALL create associated upload zones and control buttons for each generated table
5. THE Dynamic Table Generator SHALL insert generated tables into a designated container element in the DOM

### Requirement 5

**User Story:** As a dashboard administrator, I want a visual modal interface to add and configure tables, so that I can manage tables without editing JSON files directly

#### Acceptance Criteria

1. WHEN the administrator clicks a "Manage Tables" button, THE Table Configuration System SHALL display a configuration modal interface
2. THE configuration modal SHALL display a list of all currently configured tables with their key properties
3. WHEN the administrator clicks "Add New Table", THE configuration modal SHALL display a form with fields for table properties
4. THE configuration modal form SHALL include fields for: table name, display name, scoring direction, default benchmark, file patterns, and column definitions
5. WHEN the administrator saves a new table configuration, THE Table Configuration System SHALL validate the input and add the table to the configuration file

### Requirement 6

**User Story:** As a dashboard administrator, I want to define custom columns for tables, so that I can create tables with completely different data structures than the default six tables

#### Acceptance Criteria

1. THE configuration modal SHALL allow administrators to define custom column schemas that differ from the default structure (Name, Prior Month, Current Month, Change, Status)
2. THE configuration modal SHALL support adding unlimited columns with properties: column name, data type (text, number, percentage, date, status), display label, and visibility
3. WHEN a table has custom columns defined, THE Dynamic Table Generator SHALL create table headers and data cells based entirely on the custom column schema
4. THE Dashboard Instance SHALL dynamically parse uploaded file data and map columns based on the custom schema definition
5. THE configuration modal SHALL allow specifying which file columns map to which table columns for custom structures
6. THE Dashboard Instance SHALL support tables with different numbers of columns (e.g., 3 columns, 8 columns, 15 columns)
7. IF a table has no custom columns defined, THEN THE Dynamic Table Generator SHALL use the default column schema for backward compatibility

### Requirement 7

**User Story:** As a dashboard administrator, I want to edit and delete existing table configurations through the modal, so that I can maintain my table setup over time

#### Acceptance Criteria

1. WHEN the administrator clicks "Edit" on a table in the configuration modal, THE Table Configuration System SHALL display the table's current configuration in an editable form
2. THE configuration modal SHALL allow modification of all table properties including name, columns, and file patterns
3. WHEN the administrator saves changes to a table, THE Table Configuration System SHALL update the configuration and refresh the affected table UI
4. WHEN the administrator clicks "Delete" on a table, THE Table Configuration System SHALL prompt for confirmation before removing the table
5. WHEN a table is deleted, THE Table Configuration System SHALL remove the table from the UI and archive its data in localStorage

### Requirement 8

**User Story:** As a dashboard administrator, I want to configure display properties for tables, so that I can customize table appearance and labels

#### Acceptance Criteria

1. THE Table Configuration System SHALL support a displayName property that defines the user-facing table title
2. THE Table Configuration System SHALL support a description property for table documentation
3. THE Table Configuration System SHALL support a color property to customize table theme colors
4. WHEN rendering a table, THE Dynamic Table Generator SHALL use the displayName property for the table header
5. THE Dynamic Table Generator SHALL apply the color property to table styling elements

### Requirement 9

**User Story:** As a dashboard administrator, I want to configure file upload patterns through the modal interface, so that I can easily set up file routing rules

#### Acceptance Criteria

1. THE configuration modal SHALL display a file patterns section for each table configuration
2. THE configuration modal SHALL allow adding multiple file patterns with pattern type selection (exact, contains, prefix, suffix)
3. WHEN adding a file pattern, THE configuration modal SHALL validate that the pattern is unique across all tables
4. THE configuration modal SHALL display a preview of which filenames would match the configured patterns
5. THE configuration modal SHALL allow setting pattern priority to control routing when multiple patterns match

### Requirement 10

**User Story:** As a developer, I want the system to maintain backward compatibility with existing data, so that current table data is preserved during the migration

#### Acceptance Criteria

1. THE Table Configuration System SHALL map legacy tableBodyId values (tableBody, tableBody2, etc.) to new configuration entries
2. WHEN importing existing backup JSON files, THE File Routing Engine SHALL recognize legacy table identifiers and route data correctly
3. THE Dashboard Instance SHALL load existing localStorage data using legacy keys during initial migration
4. WHEN exporting data, THE Table Configuration System SHALL include both legacy and new table identifiers for compatibility
5. THE Table Configuration System SHALL provide a migration utility that converts legacy data format to configuration-based format

### Requirement 11

**User Story:** As a dashboard administrator, I want to hide tables from view and exclude them from calculations, so that I can temporarily disable tables without deleting them

#### Acceptance Criteria

1. THE Table Configuration System SHALL support a visible property (boolean) for each table configuration
2. WHEN a table's visible property is set to false, THE Dynamic Table Generator SHALL hide the table from the UI
3. WHEN a table is hidden, THE Dashboard Instance SHALL exclude that table's data from leaderboard calculations
4. THE configuration modal SHALL provide a toggle switch to show/hide tables
5. WHEN a table is hidden, THE File Routing Engine SHALL still accept file uploads but SHALL not display the data until the table is made visible again

### Requirement 12

**User Story:** As a dashboard user, I want file upload and table operations to work identically after the refactor, so that my workflow is not disrupted

#### Acceptance Criteria

1. THE File Routing Engine SHALL support drag-and-drop file upload with the same user experience as the current system
2. THE Dashboard Instance SHALL support CSV, XLSX, and JSON file formats without changes to file processing logic
3. WHEN a file is uploaded, THE Dashboard Instance SHALL display the same success and error messages as the current system
4. THE Dashboard Instance SHALL maintain all existing table operations: sort, edit, delete, export, and backup
5. THE Table Configuration System SHALL preserve all existing keyboard shortcuts and UI interactions
