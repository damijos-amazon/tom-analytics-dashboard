# Requirements Document

## Introduction

This specification addresses a comprehensive bug fix and quality assurance initiative for the TOM Analytics Dashboard application. The system is a complex web application that manages employee performance data across multiple tables with drag-and-drop file upload, dynamic table generation, database synchronization, and leaderboard calculations. The goal is to eliminate all bugs, ensure all buttons work correctly, and verify that all components are properly wired together.

## Glossary

- **TOM Dashboard**: The main application class that manages individual performance tables
- **Dashboard Manager**: System that manages multiple TOMDashboard instances
- **Config System**: Table Configuration System that manages table metadata
- **File Routing Engine**: Component that routes uploaded files to appropriate tables
- **Dynamic Table Generator**: Component that generates HTML table structures from configuration
- **Config Modal**: UI component for managing table configurations
- **Supabase**: Backend database service for data persistence
- **Leaderboard**: Unified ranking system across all performance tables

## Requirements

### Requirement 1: File Upload and Routing System

**User Story:** As a manager, I want to upload Excel/CSV/JSON files via drag-and-drop or file picker, so that the data is automatically routed to the correct performance table.

#### Acceptance Criteria

1. WHEN a user drags a file over the upload area, THE System SHALL display visual feedback indicating the drop zone is active
2. WHEN a user drops one or more files onto the upload area, THE System SHALL process each file and route it to the appropriate table based on filename patterns
3. WHEN a user clicks the upload area, THE System SHALL open the file picker dialog
4. WHEN a user selects files through the file picker, THE System SHALL process each file identically to dropped files
5. WHEN the File Routing Engine receives a file, THE System SHALL match the filename against configured patterns and route to the highest priority matching table
6. IF no pattern matches the filename, THEN THE System SHALL route the file to the default table
7. WHEN a file is successfully processed, THE System SHALL display a success message indicating the number of records loaded and the target table name
8. IF a file processing error occurs, THEN THE System SHALL display an error message with details

### Requirement 2: Table Rendering and Data Display

**User Story:** As a manager, I want all performance tables to render correctly with accurate data, so that I can review employee performance metrics.

#### Acceptance Criteria

1. WHEN data is loaded into a table, THE System SHALL calculate performance changes between prior and current month values
2. WHEN rendering a table row, THE System SHALL display rank, employee name, prior month value, current month value, change percentage, status, and action buttons
3. WHEN the direction is "higher", THE System SHALL mark positive changes as improvements and negative changes as declines
4. WHEN the direction is "lower", THE System SHALL mark negative changes as improvements and positive changes as declines
5. WHEN a table has no data, THE System SHALL display an empty state message
6. WHEN data changes occur, THE System SHALL automatically re-render the affected table
7. WHEN rendering completes, THE System SHALL update the corresponding podium with top 3 performers

### Requirement 3: Drag-and-Drop Row Reordering

**User Story:** As a manager, I want to manually reorder table rows by dragging them, so that I can customize the ranking display.

#### Acceptance Criteria

1. WHEN a user starts dragging a table row, THE System SHALL reduce the row opacity to 0.5 to indicate dragging state
2. WHEN a user drags a row over another row, THE System SHALL provide visual feedback for drop position
3. WHEN a user drops a row, THE System SHALL insert the dragged row at the drop position
4. WHEN row reordering completes, THE System SHALL update the internal data array to match the new visual order
5. WHEN row reordering completes, THE System SHALL update rank numbers to reflect the new order
6. WHEN row reordering completes, THE System SHALL persist the new order to storage
7. WHEN row reordering completes, THE System SHALL display a success message

### Requirement 4: Dashboard Manager Integration

**User Story:** As a system, I need the Dashboard Manager to correctly initialize and manage all table instances, so that tables can be created, hidden, shown, and refreshed dynamically.

#### Acceptance Criteria

1. WHEN the Dashboard Manager initializes, THE System SHALL create TOMDashboard instances for all visible tables in the configuration
2. WHEN a table is created, THE System SHALL generate the HTML structure if it doesn't exist
3. WHEN a table is created, THE System SHALL store the dashboard instance in both tableId and tableBodyId keys for backward compatibility
4. WHEN a table visibility is toggled to hidden, THE System SHALL remove the table from DOM but preserve the dashboard instance and data in memory
5. WHEN a table visibility is toggled to visible, THE System SHALL regenerate the HTML and restore the data
6. WHEN a table is deleted, THE System SHALL archive the data to localStorage with a timestamp and remove the dashboard instance
7. WHEN a table configuration is updated, THE System SHALL refresh the table while preserving existing data

### Requirement 5: Configuration Modal Functionality

**User Story:** As an admin, I want to manage table configurations through a visual interface, so that I can add, edit, delete, and configure tables without editing code.

#### Acceptance Criteria

1. WHEN the "Manage Tables" button is clicked, THE System SHALL display the configuration modal
2. WHEN the modal opens, THE System SHALL load and display all configured tables in the left panel
3. WHEN the "Add New Table" button is clicked, THE System SHALL display an empty form with default values
4. WHEN an "Edit" button is clicked for a table, THE System SHALL populate the form with that table's configuration
5. WHEN the form is submitted with valid data, THE System SHALL save the configuration to localStorage and Supabase
6. WHEN a table is saved, THE System SHALL trigger a configuration update event
7. WHEN a "Delete" button is clicked, THE System SHALL prompt for confirmation before deleting
8. WHEN a table is deleted, THE System SHALL archive its data and remove it from the configuration
9. WHEN a "Hide/Show" button is clicked, THE System SHALL toggle the table's visibility and update the UI accordingly
10. WHEN the modal is closed, THE System SHALL apply any configuration changes to the live dashboard

### Requirement 6: Leaderboard Calculation and Display

**User Story:** As a manager, I want to see a unified leaderboard that ranks employees across all performance tables, so that I can identify top performers.

#### Acceptance Criteria

1. WHEN any table data changes, THE System SHALL recalculate the unified leaderboard after a 500ms debounce
2. WHEN calculating leaderboard scores, THE System SHALL only include tables where includeInLeaderboard is true
3. WHEN calculating scores, THE System SHALL apply fair scoring algorithms that account for different table directions and benchmarks
4. WHEN rendering the leaderboard, THE System SHALL sort employees by improvement percentage first, then by performance score
5. WHEN rendering the leaderboard, THE System SHALL display rank badges (🥇🥈🥉) for top 3 positions
6. WHEN rendering the leaderboard, THE System SHALL display employee name, performance score, improvement percentage, and recognition level
7. WHEN the leaderboard is empty, THE System SHALL display an appropriate empty state message
8. WHEN the manual refresh button is clicked, THE System SHALL immediately recalculate and re-render the leaderboard

### Requirement 7: Data Persistence and Synchronization

**User Story:** As a user, I want my data to be automatically saved to localStorage and optionally synced to Supabase, so that my work is never lost.

#### Acceptance Criteria

1. WHEN data changes in any table, THE System SHALL automatically save to localStorage using the table's storageKey
2. WHEN the page loads, THE System SHALL attempt to load data from localStorage for each table
3. IF Supabase is configured and the user is authenticated, THEN THE System SHALL sync data to Supabase after local save
4. IF Supabase sync fails, THEN THE System SHALL log the error but continue with localStorage operation
5. WHEN configuration changes are saved, THE System SHALL save to both localStorage and Supabase
6. WHEN the application initializes, THE System SHALL load configuration from localStorage first, then Supabase, then fall back to default config

### Requirement 8: Button and Control Functionality

**User Story:** As a user, I want all buttons and controls to work correctly, so that I can perform all intended actions without errors.

#### Acceptance Criteria

1. WHEN the "Clear Data" button is clicked for a table, THE System SHALL prompt for confirmation and clear all data from that table
2. WHEN the "Export Excel" button is clicked, THE System SHALL generate and download an Excel file with the table data
3. WHEN the "Export CSV" button is clicked, THE System SHALL generate and download a CSV file with the table data
4. WHEN the "Backup" button is clicked, THE System SHALL generate and download a JSON backup file
5. WHEN the "Export All Data" button is clicked, THE System SHALL generate a complete backup of all tables
6. WHEN the "Clear All Data" button is clicked, THE System SHALL prompt for confirmation and clear all tables
7. WHEN the "Manage Tables" button is clicked, THE System SHALL open the configuration modal
8. WHEN navigation menu items are clicked, THE System SHALL scroll to the corresponding section
9. WHEN the "Logout" button is clicked, THE System SHALL sign out the user and redirect to login page
10. WHEN edit buttons are clicked in tables, THE System SHALL open edit modals with current values
11. WHEN delete buttons are clicked in table rows, THE System SHALL prompt for confirmation and remove the row

### Requirement 9: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback for all operations, so that I understand what's happening and can troubleshoot issues.

#### Acceptance Criteria

1. WHEN an operation succeeds, THE System SHALL display a success message with relevant details
2. WHEN an operation fails, THE System SHALL display an error message with the failure reason
3. WHEN a file upload fails, THE System SHALL display which file failed and why
4. WHEN a configuration validation fails, THE System SHALL display all validation errors
5. WHEN a network error occurs, THE System SHALL display a user-friendly message
6. WHEN messages are displayed, THE System SHALL auto-dismiss them after 4 seconds
7. WHEN critical errors occur, THE System SHALL log detailed information to the console for debugging

### Requirement 10: Initialization and Wiring

**User Story:** As a system, I need all components to be properly initialized and wired together in the correct order, so that the application functions correctly.

#### Acceptance Criteria

1. WHEN the page loads, THE System SHALL initialize in this order: Config System → File Routing Engine → Table Generator → Dashboard Manager → Database Integration
2. WHEN Config System initializes, THE System SHALL load configuration from storage
3. WHEN Table Generator initializes, THE System SHALL generate HTML for all visible tables
4. WHEN Dashboard Manager initializes, THE System SHALL create dashboard instances for all tables
5. WHEN Database Integration initializes, THE System SHALL check for Supabase configuration and authenticate if available
6. WHEN all components are initialized, THE System SHALL set up global event listeners for file upload
7. WHEN initialization completes, THE System SHALL load persisted data for all tables
8. WHEN initialization completes, THE System SHALL calculate and display the unified leaderboard
9. IF any initialization step fails, THEN THE System SHALL log the error and continue with remaining steps
10. WHEN the Config Modal is initialized, THE System SHALL be accessible via the global configModal variable
