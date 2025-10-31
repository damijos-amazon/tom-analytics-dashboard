# Implementation Plan

- [x] 1. Create default table configuration file





  - Create demo/assets/table-config.json with existing 6 tables configuration
  - Include all properties: tableId, tableName, displayName, direction, defaultBenchmark, visible, includeInLeaderboard, filePatterns, columns
  - Map legacy tableBodyId values (tableBody, tableBody2, etc.) to new configuration
  - _Requirements: 1.1, 1.2, 1.3, 10.1_

- [x] 2. Implement Table Configuration System




- [x] 2.1 Create TableConfigSystem class with config loading and validation


  - Write demo/js/table-config-system.js
  - Implement loadConfig() to load from localStorage with fallback to default config
  - Implement validateConfig() and validateTableConfig() with all validation rules
  - Implement getTableConfig() and getAllTables() methods
  - _Requirements: 1.1, 1.2, 1.3, 1.4_


- [x] 2.2 Implement config save and CRUD operations




  - Implement saveConfig() to save to localStorage and trigger updates
  - Implement addTable() with ID generation, defaults, validation, and save
  - Implement updateTable() with find, update, validate, and save
  - Implement deleteTable() with data archiving and save
  - Implement toggleTableVisibility() and toggleLeaderboardInclusion()
  - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.4, 7.5, 11.1, 11.2_
-

- [x] 3. Implement File Routing Engine



- [x] 3.1 Create FileRoutingEngine class with pattern matching


  - Write demo/js/file-routing-engine.js
  - Implement routeFile() to match filenames against patterns
  - Implement matchPattern() for exact, contains, prefix, suffix pattern types
  - Implement findMatches() to find all matching tables
  - Implement selectBestMatch() with priority-based selection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 4. Implement Dynamic Table Generator



- [x] 4.1 Create DynamicTableGenerator class with HTML generation


  - Write demo/js/dynamic-table-generator.js
  - Implement generateAllTables() to create all visible tables
  - Implement generateTable() to create complete table HTML structure
  - Implement generateTableHeader() for both custom and default columns
  - Implement generateControlButtons() for export, clear, backup buttons
  - Implement applyTableStyling() to apply color themes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.4, 8.5_
-

- [x] 4.2 Implement table removal and refresh






  - Implement removeTable() to remove table from DOM
  - Implement refreshTable() to regenerate table UI
  - _Requirements: 4.5, 7.3_
-

- [x] 5. Implement Dashboard Instance Manager




- [x] 5.1 Create DashboardManager class with instance management


  - Write demo/js/dashboard-manager.js
  - Implement initializeDashboards() to create all dashboard instances
  - Implement createTable() to generate HTML and create Dashboard instance
  - Implement getDashboard() to retrieve dashboard by ID
  - Implement getVisibleDashboards() to filter visible tables
  - Implement getLeaderboardDashboards() to filter tables included in leaderboard
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 5.2 Implement table visibility and removal operations


  - Implement hideTable() to remove from UI but preserve data
  - Implement showTable() to restore table to UI with data
  - Implement removeTable() to archive data and remove completely
  - Implement refreshTable() to update table after config changes
  - _Requirements: 7.3, 7.4, 7.5, 11.1, 11.2, 11.3_


- [x] 6. Refactor TOMDashboard class for dynamic columns





- [x] 6.1 Update TOMDashboard constructor to accept tableConfig object


  - Modify constructor to accept tableConfig instead of individual parameters
  - Extract tableId, tableName, storageKey, direction, defaultBenchmark, columns from config
  - Implement getDefaultColumns() for backward compatibility
  - _Requirements: 3.3, 3.4, 3.5, 6.7, 12.1, 12.2_

- [x] 6.2 Implement dynamic table rendering with custom columns


  - Update renderTable() to use dynamic column schema
  - Implement createRow() to generate rows based on column configuration
  - Implement formatCellValue() to format values by data type (text, number, percentage, date, status)
  - Handle both custom columns and default columns
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [x] 6.3 Implement dynamic file parsing with column mapping


  - Update parseFileData() to use fileColumnMapping from column schema
  - Map Excel columns (A, B, C) to table columns based on configuration
  - Support both custom column mapping and default parsing logic
  - _Requirements: 6.4, 6.5, 12.2_

- [x] 7. Create Configuration Modal UI





- [x] 7.1 Create ConfigModal class and modal HTML structure


  - Write demo/js/config-modal.js
  - Implement createModal() to generate modal HTML with table list and form sections
  - Implement show() and hide() methods
  - Add "Manage Tables" button to main dashboard UI
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.2 Implement table list display and navigation


  - Implement loadTableList() to display all configured tables
  - Show table properties: name, direction, visibility status
  - Add Edit and Delete buttons for each table
  - Add "Add New Table" button
  - Implement visibility toggle switches
  - _Requirements: 5.2, 7.1, 11.4_

- [x] 7.3 Implement table configuration form


  - Implement showAddForm() for new table creation
  - Implement showEditForm() to populate form with existing config
  - Create form fields: tableName, displayName, description, direction, defaultBenchmark, color, visible, includeInLeaderboard
  - _Requirements: 5.3, 5.4, 7.1, 7.2, 8.1, 8.2, 8.3_

- [x] 7.4 Implement column editor in configuration form


  - Implement renderColumnEditor() to display column list
  - Add/remove column buttons with dynamic form fields
  - Column property inputs: id, label, dataType, visible, sortable, editable, fileColumnMapping
  - Implement extractColumnsFromForm() to parse column definitions
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 7.5 Implement file pattern editor in configuration form


  - Implement renderFilePatternEditor() to display pattern list
  - Add/remove pattern buttons with dynamic form fields
  - Pattern property inputs: pattern, type, priority, exclude
  - Implement extractFilePatternsFromForm() to parse file patterns
  - Display pattern preview showing which filenames would match
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7.6 Implement form submission and validation


  - Implement getFormData() to extract and validate all form fields
  - Implement saveTable() with validation, error handling, and success messages
  - Handle both create and update operations
  - Implement deleteTable() with confirmation and data archiving
  - Implement toggleVisibility() to show/hide tables
  - _Requirements: 5.5, 7.2, 7.3, 7.4, 7.5, 9.3_

- [x] 8. Integrate all components and update initialization






- [x] 8.1 Update main application initialization

  - Modify demo/js/script-clean.js or create new initialization file
  - Initialize TableConfigSystem and load configuration
  - Initialize FileRoutingEngine with config system
  - Initialize DynamicTableGenerator with config system
  - Initialize DashboardManager with config system and table generator
  - Create all dashboard instances from configuration
  - _Requirements: 1.1, 1.5, 4.1_


- [x] 8.2 Wire up file upload routing to new system

  - Update file upload handlers to use FileRoutingEngine
  - Route files to correct dashboard instances based on patterns
  - Maintain existing drag-and-drop functionality
  - Support CSV, XLSX, and JSON file formats
  - _Requirements: 2.1, 2.5, 12.1, 12.2, 12.3_


- [x] 8.3 Update leaderboard to use visible tables only

  - Modify leaderboard calculation to use getLeaderboardDashboards()
  - Exclude hidden tables from leaderboard
  - Exclude tables with includeInLeaderboard=false
  - _Requirements: 11.2, 11.3_
-




- [x] 9. Implement backward compatibility and migration






- [x] 9.1 Create migration utility for existing data


  - Implement function to convert legacy localStorage data to new format

  - Map legacy tableBodyId values to new tableId values
  - Preserve all existing table data during migration
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 9.2 Test backward compatibility with existing features


  - Verify all 6 existing tables work with new system
  - Test import of old backup JSON files
  - Verify legacy table identifiers are recognized
  - Test all existing table operations: sort, edit, delete, export, backup
  - Verify keyboard shortcuts and UI interactions still work
  - _Requirements: 10.2, 10.4, 12.4, 12.5_

- [x] 10. Add CSS styling for configuration modal


  - Create styles for config-modal, config-modal-content, config-modal-header
  - Style table-list-section and table-form-section
  - Style form groups, inputs, buttons
  - Style column-editor and pattern-editor sections
  - Add responsive styles for mobile devices
  - Apply Amazon orange theme colors
  - _Requirements: 5.1, 8.4, 8.5_

- [x] 11. Create tables container in HTML


  - Add tables-container div to demo/index.html
  - Add "Manage Tables" button to dashboard header
  - Ensure proper placement for dynamically generated tables
  - _Requirements: 4.5_

- [x] 12. Test complete system end-to-end




  - Test adding new table via modal with custom columns
  - Test editing existing table configuration
  - Test deleting table and verifying data archival
  - Test file upload routing to correct tables
  - Test hiding/showing tables and leaderboard exclusion
  - Test custom column rendering and data parsing
  - Test file pattern matching for all pattern types
  - Verify configuration persists in localStorage
  - Test with multiple tables (10+ tables)
  - _Requirements: All requirements_
