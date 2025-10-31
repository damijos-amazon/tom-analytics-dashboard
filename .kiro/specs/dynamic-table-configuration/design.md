# Design Document

## Overview

This design transforms the TOM Analytics Dashboard from a hardcoded 6-table system into a flexible, configuration-driven architecture. The system will support dynamic table creation, custom column schemas, and a visual configuration interface. The architecture consists of five main components: Table Configuration System, Dynamic Table Generator, File Routing Engine, Configuration Modal UI, and the refactored Dashboard Instance.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Config Modal │  │ File Upload  │  │ Table UI     │      │
│  │      UI      │  │   Handler    │  │  Renderer    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         │      Core System Layer              │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────▼──────┐      │
│  │   Table      │  │    File      │  │   Dynamic    │      │
│  │Configuration │◄─┤   Routing    │  │    Table     │      │
│  │   System     │  │   Engine     │  │  Generator   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                    │
│  ┌──────▼───────────────────────────────────────────┐      │
│  │         Dashboard Instance Manager                │      │
│  │  (Creates & manages multiple Dashboard instances) │      │
│  └──────┬───────────────────────────────────────────┘      │
└─────────┼──────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │table-config  │  │ localStorage │  │  Uploaded    │      │
│  │   .json      │  │  (table data)│  │    Files     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

1. **Table Configuration System**: Loads, validates, and manages table configurations
2. **Dynamic Table Generator**: Creates HTML table elements from configuration
3. **File Routing Engine**: Routes uploaded files to appropriate tables
4. **Configuration Modal UI**: Provides visual interface for managing tables
5. **Dashboard Instance Manager**: Creates and coordinates Dashboard instances

## Components and Interfaces

### 1. Table Configuration System

**File**: `demo/js/table-config-system.js`

**Purpose**: Central configuration management for all tables

**Class**: `TableConfigSystem`

```javascript
class TableConfigSystem {
    constructor(configPath = 'demo/assets/table-config.json') {
        this.configPath = configPath;
        this.config = null;
        this.defaultConfig = this.getDefaultConfig();
    }

    // Load configuration from JSON file
    async loadConfig() {
        // Fetch table-config.json
        // Validate structure
        // Merge with defaults if needed
        // Return config object
    }

    // Validate configuration structure
    validateConfig(config) {
        // Check required fields
        // Validate data types
        // Check for duplicate IDs
        // Return validation result
    }

    // Get table configuration by ID
    getTableConfig(tableId) {
        // Return specific table config
    }

    // Get all table configurations
    getAllTables() {
        // Return array of all tables
    }

    // Save configuration (called by modal)
    async saveConfig(newConfig) {
        // Validate new config
        const validation = this.validateConfig(newConfig);
        if (!validation.valid) {
            throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
        }
        
        // Save to localStorage (since we can't write files from browser)
        localStorage.setItem('table_config', JSON.stringify(newConfig));
        
        // Update in-memory config
        this.config = newConfig;
        
        // Trigger reload event
        window.dispatchEvent(new CustomEvent('tableConfigUpdated'));
        
        return true;
    }

    // Add new table
    addTable(tableConfig) {
        // Generate unique tableId if not provided
        if (!tableConfig.tableId) {
            tableConfig.tableId = this.generateTableId(tableConfig.tableName);
        }
        
        // Generate unique tableBodyId
        if (!tableConfig.tableBodyId) {
            tableConfig.tableBodyId = `tableBody${this.config.tables.length + 1}`;
        }
        
        // Set defaults
        tableConfig.visible = tableConfig.visible !== false;
        tableConfig.includeInLeaderboard = tableConfig.includeInLeaderboard !== false;
        tableConfig.storageKey = tableConfig.storageKey || `table_data_${tableConfig.tableId}`;
        
        // Validate table config
        const validation = this.validateTableConfig(tableConfig);
        if (!validation.valid) {
            throw new Error(`Invalid table config: ${validation.errors.join(', ')}`);
        }
        
        // Add to config
        this.config.tables.push(tableConfig);
        
        // Save config
        this.saveConfig(this.config);
        
        // Return new table ID
        return tableConfig.tableId;
    }

    // Update existing table
    updateTable(tableId, updates) {
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
        
        // Save config
        this.saveConfig(this.config);
        
        return true;
    }

    // Delete table
    deleteTable(tableId) {
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
        }
        
        // Remove from config
        this.config.tables.splice(tableIndex, 1);
        
        // Save config
        this.saveConfig(this.config);
        
        return true;
    }
    
    // Toggle table visibility
    toggleTableVisibility(tableId, visible) {
        return this.updateTable(tableId, { visible });
    }
    
    // Toggle leaderboard inclusion
    toggleLeaderboardInclusion(tableId, includeInLeaderboard) {
        return this.updateTable(tableId, { includeInLeaderboard });
    }
    
    // Generate table ID from name
    generateTableId(tableName) {
        return tableName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    // Validate table config
    validateTableConfig(tableConfig) {
        const errors = [];
        
        if (!tableConfig.tableId) errors.push('tableId is required');
        if (!tableConfig.tableName) errors.push('tableName is required');
        if (!tableConfig.tableBodyId) errors.push('tableBodyId is required');
        if (!tableConfig.direction || !['higher', 'lower'].includes(tableConfig.direction)) {
            errors.push('direction must be "higher" or "lower"');
        }
        if (typeof tableConfig.defaultBenchmark !== 'number') {
            errors.push('defaultBenchmark must be a number');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Get default configuration (fallback)
    getDefaultConfig() {
        // Return hardcoded config for 6 existing tables
    }
}
```

**Configuration Schema**:

```json
{
  "version": "1.0",
  "defaultTable": "vti-compliance",
  "tables": [
    {
      "tableId": "vti-compliance",
      "tableName": "VTI Compliance",
      "displayName": "VTI Compliance",
      "description": "VTI compliance metrics",
      "tableBodyId": "tableBody",
      "storageKey": "tom_analytics_data",
      "direction": "higher",
      "defaultBenchmark": 95,
      "color": "#FF9900",
      "visible": true,
      "includeInLeaderboard": true,
      "filePatterns": [
        {
          "pattern": "prior-vti",
          "type": "exact",
          "priority": 1
        },
        {
          "pattern": "current-vti",
          "type": "exact",
          "priority": 1
        },
        {
          "pattern": "vti",
          "type": "contains",
          "priority": 2,
          "exclude": ["dpmo"]
        }
      ],
      "columns": null
    }
  ]
}
```

**Column Schema** (for custom tables):

```json
{
  "columns": [
    {
      "id": "employee_name",
      "label": "Employee Name",
      "dataType": "text",
      "visible": true,
      "sortable": true,
      "editable": false,
      "fileColumnMapping": "A"
    },
    {
      "id": "score",
      "label": "Score",
      "dataType": "number",
      "visible": true,
      "sortable": true,
      "editable": true,
      "fileColumnMapping": "B"
    }
  ]
}
```

### 2. Dynamic Table Generator

**File**: `demo/js/dynamic-table-generator.js`

**Purpose**: Generate HTML table elements from configuration

**Class**: `DynamicTableGenerator`

```javascript
class DynamicTableGenerator {
    constructor(configSystem) {
        this.configSystem = configSystem;
        this.containerElement = document.getElementById('tables-container');
    }

    // Generate all tables from configuration
    generateAllTables() {
        const tables = this.configSystem.getAllTables();
        tables.forEach(tableConfig => {
            if (tableConfig.visible !== false) {
                this.generateTable(tableConfig);
            }
        });
    }

    // Generate single table
    generateTable(tableConfig) {
        // Skip if not visible
        if (tableConfig.visible === false) return;
        
        // Create table section container
        const section = document.createElement('div');
        section.className = 'dashboard-section';
        section.id = `section-${tableConfig.tableId}`;
        section.setAttribute('data-table-id', tableConfig.tableId);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <h2>${tableConfig.displayName || tableConfig.tableName}</h2>
            ${tableConfig.description ? `<p class="table-description">${tableConfig.description}</p>` : ''}
        `;
        section.appendChild(header);
        
        // Create table wrapper
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        
        // Create table element
        const table = document.createElement('table');
        table.className = 'analytics-table';
        
        // Generate table header
        const thead = this.generateTableHeader(tableConfig.columns);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        tbody.id = tableConfig.tableBodyId;
        tbody.className = 'table-body';
        table.appendChild(tbody);
        
        tableWrapper.appendChild(table);
        section.appendChild(tableWrapper);
        
        // Create control buttons
        const controls = this.generateControlButtons(tableConfig);
        section.appendChild(controls);
        
        // Apply styling
        this.applyTableStyling(section, tableConfig.color);
        
        // Insert into DOM
        this.containerElement.appendChild(section);
        
        return section;
    }

    // Generate table header based on columns
    generateTableHeader(columns) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Always add rank column first
        const rankHeader = document.createElement('th');
        rankHeader.textContent = 'Rank';
        rankHeader.className = 'rank-column';
        headerRow.appendChild(rankHeader);
        
        if (columns && columns.length > 0) {
            // Custom columns
            columns.forEach(column => {
                if (column.visible !== false) {
                    const th = document.createElement('th');
                    th.textContent = column.label;
                    th.className = `column-${column.id}`;
                    if (column.sortable !== false) {
                        th.classList.add('sortable');
                        th.style.cursor = 'pointer';
                    }
                    headerRow.appendChild(th);
                }
            });
        } else {
            // Default columns
            const defaultColumns = ['Name', 'Prior Month', 'Current Month', 'Change', 'Status'];
            defaultColumns.forEach(colName => {
                const th = document.createElement('th');
                th.textContent = colName;
                th.className = 'sortable';
                th.style.cursor = 'pointer';
                headerRow.appendChild(th);
            });
        }
        
        // Always add actions column last
        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Actions';
        actionsHeader.className = 'actions-column';
        headerRow.appendChild(actionsHeader);
        
        thead.appendChild(headerRow);
        return thead;
    }

    // Generate control buttons
    generateControlButtons(tableConfig) {
        const controls = document.createElement('div');
        controls.className = 'table-controls';
        controls.innerHTML = `
            <button class="btn-export" data-table-id="${tableConfig.tableId}">
                📊 Export
            </button>
            <button class="btn-clear" data-table-id="${tableConfig.tableId}">
                🗑️ Clear Data
            </button>
            <button class="btn-backup" data-table-id="${tableConfig.tableId}">
                💾 Backup
            </button>
        `;
        return controls;
    }

    // Apply table styling
    applyTableStyling(tableElement, color) {
        if (color) {
            tableElement.style.setProperty('--table-accent-color', color);
        }
    }

    // Remove table from DOM
    removeTable(tableId) {
        const section = document.getElementById(`section-${tableId}`);
        if (section) {
            section.remove();
        }
    }

    // Refresh table UI
    refreshTable(tableId) {
        const tableConfig = this.configSystem.getTableConfig(tableId);
        
        // Remove old table
        this.removeTable(tableId);
        
        // Regenerate from config
        this.generateTable(tableConfig);
    }
}
```

### 3. File Routing Engine

**File**: `demo/js/file-routing-engine.js`

**Purpose**: Route uploaded files to correct tables

**Class**: `FileRoutingEngine`

```javascript
class FileRoutingEngine {
    constructor(configSystem) {
        this.configSystem = configSystem;
    }

    // Route file to appropriate table
    routeFile(file) {
        const filename = file.name.toLowerCase();
        const tables = this.configSystem.getAllTables();
        
        // Match against patterns
        const matches = this.findMatches(filename, tables);
        
        // Select best match by priority
        const targetTable = this.selectBestMatch(matches);
        
        // Log routing decision
        console.log(`Routing ${file.name} -> ${targetTable.tableName}`);
        
        return targetTable.tableId;
    }

    // Find all matching tables
    findMatches(filename, tables) {
        const matches = [];
        
        tables.forEach(table => {
            table.filePatterns.forEach(pattern => {
                if (this.matchPattern(filename, pattern)) {
                    matches.push({
                        tableId: table.tableId,
                        tableName: table.tableName,
                        priority: pattern.priority,
                        pattern: pattern.pattern
                    });
                }
            });
        });
        
        return matches;
    }

    // Match filename against pattern
    matchPattern(filename, pattern) {
        const cleanName = filename.replace(/\.(xlsx|csv|json)$/, '');
        
        switch (pattern.type) {
            case 'exact':
                return cleanName === pattern.pattern;
            case 'contains':
                const hasPattern = cleanName.includes(pattern.pattern);
                const hasExclusion = pattern.exclude && 
                    pattern.exclude.some(ex => cleanName.includes(ex));
                return hasPattern && !hasExclusion;
            case 'prefix':
                return cleanName.startsWith(pattern.pattern);
            case 'suffix':
                return cleanName.endsWith(pattern.pattern);
            default:
                return false;
        }
    }

    // Select best match by priority
    selectBestMatch(matches) {
        if (matches.length === 0) {
            return this.configSystem.getTableConfig(
                this.configSystem.config.defaultTable
            );
        }
        
        // Sort by priority (lower number = higher priority)
        matches.sort((a, b) => a.priority - b.priority);
        
        return this.configSystem.getTableConfig(matches[0].tableId);
    }
}
```

### 4. Configuration Modal UI

**File**: `demo/js/config-modal.js`

**Purpose**: Visual interface for managing table configurations

**Class**: `ConfigModal`

```javascript
class ConfigModal {
    constructor(configSystem, dashboardManager) {
        this.configSystem = configSystem;
        this.dashboardManager = dashboardManager;
        this.modal = null;
        this.currentEditingTable = null;
    }

    // Show modal
    show() {
        this.createModal();
        this.loadTableList();
        this.modal.style.display = 'block';
    }

    // Hide modal
    hide() {
        this.modal.style.display = 'none';
    }

    // Create modal HTML
    createModal() {
        // Create modal structure
        // Add table list section
        // Add form section
        // Add buttons
    }

    // Load list of tables
    loadTableList() {
        const tables = this.configSystem.getAllTables();
        // Render table list with edit/delete buttons
    }

    // Show add table form
    showAddForm() {
        // Clear form
        // Show empty form for new table
    }

    // Show edit table form
    showEditForm(tableId) {
        const config = this.configSystem.getTableConfig(tableId);
        this.currentEditingTable = tableId;
        // Populate form with existing config
    }

    // Render column editor
    renderColumnEditor(columns) {
        // Show list of columns
        // Add/remove column buttons
        // Column property editors
    }

    // Render file pattern editor
    renderFilePatternEditor(patterns) {
        // Show list of patterns
        // Add/remove pattern buttons
        // Pattern type selector
        // Priority input
        // Pattern preview
    }

    // Save table configuration
    async saveTable() {
        try {
            const formData = this.getFormData();
            
            if (this.currentEditingTable) {
                // Update existing table
                await this.configSystem.updateTable(
                    this.currentEditingTable, 
                    formData
                );
                this.dashboardManager.refreshTable(this.currentEditingTable);
                this.showMessage('Table updated successfully', 'success');
            } else {
                // Add new table
                const newTableId = await this.configSystem.addTable(formData);
                this.dashboardManager.createTable(newTableId);
                this.showMessage('Table created successfully', 'success');
            }
            
            this.loadTableList();
            this.currentEditingTable = null;
            this.showAddForm(); // Reset form
            
        } catch (error) {
            console.error('Failed to save table:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    // Delete table
    async deleteTable(tableId) {
        const tableConfig = this.configSystem.getTableConfig(tableId);
        const confirmMsg = `Are you sure you want to delete "${tableConfig.tableName}"? Data will be archived.`;
        
        if (confirm(confirmMsg)) {
            try {
                await this.configSystem.deleteTable(tableId);
                this.dashboardManager.removeTable(tableId);
                this.loadTableList();
                this.showMessage('Table deleted and data archived', 'success');
                
                // Reset form if editing this table
                if (this.currentEditingTable === tableId) {
                    this.currentEditingTable = null;
                    this.showAddForm();
                }
            } catch (error) {
                console.error('Failed to delete table:', error);
                this.showMessage(`Error: ${error.message}`, 'error');
            }
        }
    }
    
    // Toggle table visibility
    async toggleVisibility(tableId) {
        try {
            const tableConfig = this.configSystem.getTableConfig(tableId);
            const newVisibility = !tableConfig.visible;
            
            await this.configSystem.toggleTableVisibility(tableId, newVisibility);
            
            if (newVisibility) {
                this.dashboardManager.createTable(tableId);
            } else {
                this.dashboardManager.hideTable(tableId);
            }
            
            this.loadTableList();
            this.showMessage(
                `Table ${newVisibility ? 'shown' : 'hidden'}`, 
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    // Get form data
    getFormData() {
        const form = document.getElementById('tableConfigForm');
        const formData = new FormData(form);
        
        // Extract basic fields
        const config = {
            tableName: formData.get('tableName').trim(),
            displayName: formData.get('displayName').trim() || formData.get('tableName').trim(),
            description: formData.get('description')?.trim() || '',
            direction: formData.get('direction'),
            defaultBenchmark: parseFloat(formData.get('defaultBenchmark')),
            color: formData.get('color') || '#FF9900',
            visible: formData.get('visible') !== 'false',
            includeInLeaderboard: formData.get('includeInLeaderboard') !== 'false'
        };
        
        // Extract columns
        config.columns = this.extractColumnsFromForm();
        
        // Extract file patterns
        config.filePatterns = this.extractFilePatternsFromForm();
        
        // Validate
        if (!config.tableName) {
            throw new Error('Table name is required');
        }
        if (!config.direction || !['higher', 'lower'].includes(config.direction)) {
            throw new Error('Invalid scoring direction');
        }
        if (isNaN(config.defaultBenchmark)) {
            throw new Error('Default benchmark must be a number');
        }
        if (!config.filePatterns || config.filePatterns.length === 0) {
            throw new Error('At least one file pattern is required');
        }
        
        return config;
    }
    
    // Extract columns from form
    extractColumnsFromForm() {
        const columnElements = document.querySelectorAll('.column-item');
        if (columnElements.length === 0) return null; // Use default columns
        
        const columns = [];
        columnElements.forEach((elem, index) => {
            const column = {
                id: elem.querySelector('[name="columnId"]').value.trim(),
                label: elem.querySelector('[name="columnLabel"]').value.trim(),
                dataType: elem.querySelector('[name="columnDataType"]').value,
                visible: elem.querySelector('[name="columnVisible"]').checked,
                sortable: elem.querySelector('[name="columnSortable"]').checked,
                editable: elem.querySelector('[name="columnEditable"]').checked,
                fileColumnMapping: elem.querySelector('[name="columnFileMapping"]').value.trim()
            };
            
            if (column.id && column.label) {
                columns.push(column);
            }
        });
        
        return columns.length > 0 ? columns : null;
    }
    
    // Extract file patterns from form
    extractFilePatternsFromForm() {
        const patternElements = document.querySelectorAll('.pattern-item');
        const patterns = [];
        
        patternElements.forEach((elem, index) => {
            const pattern = {
                pattern: elem.querySelector('[name="patternValue"]').value.trim(),
                type: elem.querySelector('[name="patternType"]').value,
                priority: parseInt(elem.querySelector('[name="patternPriority"]').value) || (index + 1)
            };
            
            const excludeInput = elem.querySelector('[name="patternExclude"]');
            if (excludeInput && excludeInput.value.trim()) {
                pattern.exclude = excludeInput.value.split(',').map(s => s.trim());
            }
            
            if (pattern.pattern) {
                patterns.push(pattern);
            }
        });
        
        return patterns;
    }

    // Show message
    showMessage(message, type) {
        // Display success/error message
    }
}
```

**Modal HTML Structure**:

```html
<div id="configModal" class="config-modal">
    <div class="config-modal-content">
        <div class="config-modal-header">
            <h2>Manage Tables</h2>
            <button class="close-btn">&times;</button>
        </div>
        
        <div class="config-modal-body">
            <!-- Left: Table List -->
            <div class="table-list-section">
                <h3>Existing Tables</h3>
                <button class="add-table-btn">+ Add New Table</button>
                <div id="tableList"></div>
            </div>
            
            <!-- Right: Table Form -->
            <div class="table-form-section">
                <form id="tableConfigForm">
                    <!-- Basic Info -->
                    <div class="form-group">
                        <label>Table Name</label>
                        <input type="text" name="tableName" required>
                    </div>
                    
                    <!-- Scoring Config -->
                    <div class="form-group">
                        <label>Scoring Direction</label>
                        <select name="direction">
                            <option value="higher">Higher is Better</option>
                            <option value="lower">Lower is Better</option>
                        </select>
                    </div>
                    
                    <!-- Column Editor -->
                    <div class="form-group">
                        <label>Columns</label>
                        <div id="columnEditor"></div>
                        <button type="button" class="add-column-btn">+ Add Column</button>
                    </div>
                    
                    <!-- File Pattern Editor -->
                    <div class="form-group">
                        <label>File Upload Patterns</label>
                        <div id="patternEditor"></div>
                        <button type="button" class="add-pattern-btn">+ Add Pattern</button>
                    </div>
                    
                    <button type="submit" class="save-btn">Save Table</button>
                </form>
            </div>
        </div>
    </div>
</div>
```

### 5. Refactored Dashboard Instance

**File**: `demo/js/script-clean.js` (refactored)

**Purpose**: Manage individual table data and operations

**Changes to TOMDashboard class**:

```javascript
class TOMDashboard {
    constructor(tableConfig) {
        // Accept tableConfig object instead of individual params
        this.tableId = tableConfig.tableBodyId;
        this.tableName = tableConfig.tableName;
        this.storageKey = tableConfig.storageKey;
        this.direction = tableConfig.direction;
        this.defaultBenchmark = tableConfig.defaultBenchmark;
        this.columns = tableConfig.columns || this.getDefaultColumns();
        this.data = [];
        this.init();
    }

    // Get default columns (backward compatibility)
    getDefaultColumns() {
        return [
            { id: 'name', label: 'Name', dataType: 'text', visible: true },
            { id: 'priorMonth', label: 'Prior Month', dataType: 'number', visible: true },
            { id: 'currentMonth', label: 'Current Month', dataType: 'number', visible: true },
            { id: 'change', label: 'Change', dataType: 'number', visible: true },
            { id: 'status', label: 'Status', dataType: 'status', visible: true }
        ];
    }

    // Render table with dynamic columns
    renderTable() {
        const tableBody = document.getElementById(this.tableId);
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        this.data.forEach((item, index) => {
            const row = this.createRow(item, index);
            tableBody.appendChild(row);
        });
    }

    // Create row based on column schema
    createRow(item, index) {
        const row = document.createElement('tr');
        row.className = 'table-row';
        row.draggable = true;
        
        // Rank column (always first)
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        row.appendChild(rankCell);
        
        // Dynamic columns
        this.columns.forEach(column => {
            if (column.visible) {
                const cell = document.createElement('td');
                cell.textContent = this.formatCellValue(item[column.id], column.dataType);
                if (column.editable) {
                    cell.contentEditable = true;
                }
                row.appendChild(cell);
            }
        });
        
        // Actions column (always last)
        const actionsCell = this.createActionsCell(item);
        row.appendChild(actionsCell);
        
        return row;
    }

    // Format cell value based on data type
    formatCellValue(value, dataType) {
        switch (dataType) {
            case 'percentage':
                return `${value}%`;
            case 'number':
                return typeof value === 'number' ? value.toFixed(2) : value;
            case 'date':
                return new Date(value).toLocaleDateString();
            default:
                return value;
        }
    }

    // Parse uploaded file with dynamic column mapping
    parseFileData(lines, filename) {
        const newData = [];
        
        // If custom columns, use file column mapping
        if (this.columns && this.columns[0].fileColumnMapping) {
            // Parse based on column mapping
            // Map file columns to table columns
        } else {
            // Use default parsing logic (backward compatibility)
            // Existing parseFileData logic
        }
        
        return newData;
    }
}
```

### 6. Dashboard Instance Manager

**File**: `demo/js/dashboard-manager.js`

**Purpose**: Create and manage multiple Dashboard instances

**Class**: `DashboardManager`

```javascript
class DashboardManager {
    constructor(configSystem, tableGenerator) {
        this.configSystem = configSystem;
        this.tableGenerator = tableGenerator;
        this.dashboards = {};
    }

    // Initialize all dashboards from config
    async initializeDashboards() {
        const tables = this.configSystem.getAllTables();
        
        tables.forEach(tableConfig => {
            this.createTable(tableConfig.tableId);
        });
    }

    // Create single dashboard instance
    createTable(tableId) {
        const tableConfig = this.configSystem.getTableConfig(tableId);
        
        // Skip if not visible
        if (tableConfig.visible === false) {
            console.log(`Skipping hidden table: ${tableId}`);
            return null;
        }
        
        // Generate HTML if not exists
        if (!document.getElementById(tableConfig.tableBodyId)) {
            this.tableGenerator.generateTable(tableConfig);
        }
        
        // Create Dashboard instance
        const dashboard = new TOMDashboard(tableConfig);
        this.dashboards[tableId] = dashboard;
        
        console.log(`Created dashboard for table: ${tableId}`);
        return dashboard;
    }

    // Get dashboard instance
    getDashboard(tableId) {
        return this.dashboards[tableId];
    }
    
    // Get visible dashboards only
    getVisibleDashboards() {
        const visible = {};
        Object.keys(this.dashboards).forEach(tableId => {
            const config = this.configSystem.getTableConfig(tableId);
            if (config.visible !== false) {
                visible[tableId] = this.dashboards[tableId];
            }
        });
        return visible;
    }
    
    // Get dashboards included in leaderboard
    getLeaderboardDashboards() {
        const included = {};
        Object.keys(this.dashboards).forEach(tableId => {
            const config = this.configSystem.getTableConfig(tableId);
            if (config.includeInLeaderboard !== false && config.visible !== false) {
                included[tableId] = this.dashboards[tableId];
            }
        });
        return included;
    }

    // Refresh table
    refreshTable(tableId) {
        const dashboard = this.dashboards[tableId];
        if (dashboard) {
            // Preserve data
            const data = dashboard.data;
            
            // Regenerate UI
            this.tableGenerator.refreshTable(tableId);
            
            // Recreate dashboard
            this.createTable(tableId);
            
            // Restore data
            if (this.dashboards[tableId]) {
                this.dashboards[tableId].data = data;
                this.dashboards[tableId].renderTable();
            }
        }
    }
    
    // Hide table (keep data, remove from UI)
    hideTable(tableId) {
        const dashboard = this.dashboards[tableId];
        if (dashboard) {
            // Keep data in memory
            console.log(`Hiding table: ${tableId}`);
            
            // Remove from DOM
            this.tableGenerator.removeTable(tableId);
            
            // Keep dashboard instance but mark as hidden
            dashboard.hidden = true;
        }
    }
    
    // Show table (restore to UI)
    showTable(tableId) {
        const dashboard = this.dashboards[tableId];
        if (dashboard && dashboard.hidden) {
            console.log(`Showing table: ${tableId}`);
            
            // Regenerate UI
            this.tableGenerator.generateTable(this.configSystem.getTableConfig(tableId));
            
            // Mark as visible
            dashboard.hidden = false;
            
            // Re-render data
            dashboard.renderTable();
        } else {
            // Create new if doesn't exist
            this.createTable(tableId);
        }
    }

    // Remove table
    removeTable(tableId) {
        const dashboard = this.dashboards[tableId];
        if (dashboard) {
            // Archive data
            const archiveKey = `${dashboard.storageKey}_archived_${Date.now()}`;
            localStorage.setItem(archiveKey, JSON.stringify(dashboard.data));
            console.log(`Archived data to: ${archiveKey}`);
            
            // Remove from DOM
            this.tableGenerator.removeTable(tableId);
            
            // Remove instance
            delete this.dashboards[tableId];
            
            console.log(`Removed table: ${tableId}`);
        }
    }

    // Get all dashboards
    getAllDashboards() {
        return this.dashboards;
    }
}
```

## Data Models

### Table Configuration Model

```typescript
interface TableConfig {
    tableId: string;              // Unique identifier (e.g., "vti-compliance")
    tableName: string;            // Internal name
    displayName: string;          // User-facing name
    description?: string;         // Optional description
    tableBodyId: string;          // DOM element ID (e.g., "tableBody")
    storageKey: string;           // localStorage key
    direction: 'higher' | 'lower'; // Scoring direction
    defaultBenchmark: number;     // Default benchmark value
    color?: string;               // Theme color (hex)
    visible: boolean;             // Show/hide table in UI (default: true)
    includeInLeaderboard: boolean; // Include in leaderboard calculations (default: true)
    filePatterns: FilePattern[];  // File routing patterns
    columns?: ColumnSchema[];     // Custom columns (null = use default)
}

interface FilePattern {
    pattern: string;              // Pattern to match
    type: 'exact' | 'contains' | 'prefix' | 'suffix';
    priority: number;             // Lower = higher priority
    exclude?: string[];           // Patterns to exclude
}

interface ColumnSchema {
    id: string;                   // Column identifier
    label: string;                // Display label
    dataType: 'text' | 'number' | 'percentage' | 'date' | 'status';
    visible: boolean;             // Show/hide column
    sortable: boolean;            // Enable sorting
    editable: boolean;            // Enable inline editing
    fileColumnMapping?: string;   // Excel column (A, B, C, etc.)
}
```

### Legacy Compatibility Mapping

```javascript
const LEGACY_MAPPING = {
    'tableBody': 'vti-compliance',
    'tableBody2': 'vti-dpmo',
    'tableBody3': 'ta-idle-time',
    'tableBody4': 'seal-validation',
    'tableBody5': 'ppo-compliance',
    'tableBody6': 'andon-response-time'
};
```

## Error Handling

### Configuration Loading Errors

```javascript
try {
    await configSystem.loadConfig();
} catch (error) {
    console.error('Failed to load configuration:', error);
    // Fall back to default config
    configSystem.config = configSystem.getDefaultConfig();
    showMessage('Using default configuration', 'warning');
}
```

### File Routing Errors

```javascript
try {
    const tableId = fileRoutingEngine.routeFile(file);
    const dashboard = dashboardManager.getDashboard(tableId);
    dashboard.handleFileUpload([file]);
} catch (error) {
    console.error('File routing failed:', error);
    // Route to default table
    const defaultTable = configSystem.config.defaultTable;
    dashboardManager.getDashboard(defaultTable).handleFileUpload([file]);
}
```

### Configuration Save Errors

```javascript
try {
    await configSystem.saveConfig(newConfig);
    showMessage('Configuration saved', 'success');
} catch (error) {
    console.error('Failed to save configuration:', error);
    showMessage('Failed to save configuration', 'error');
    // Revert to previous config
}
```

## Testing Strategy

### Unit Tests

1. **TableConfigSystem**
   - Test config loading and validation
   - Test add/update/delete operations
   - Test default config fallback

2. **FileRoutingEngine**
   - Test pattern matching (exact, contains, prefix, suffix)
   - Test priority selection
   - Test default routing

3. **DynamicTableGenerator**
   - Test table HTML generation
   - Test custom column rendering
   - Test default column rendering

### Integration Tests

1. **End-to-End Table Creation**
   - Add table via modal
   - Verify table appears in UI
   - Upload file to new table
   - Verify data loads correctly

2. **File Upload Routing**
   - Upload files with various names
   - Verify correct table routing
   - Test priority conflicts

3. **Configuration Persistence**
   - Add/edit/delete tables
   - Reload page
   - Verify changes persist

### Manual Testing

1. **Backward Compatibility**
   - Load existing localStorage data
   - Import old backup files
   - Verify all 6 tables work as before

2. **Custom Column Tables**
   - Create table with 3 columns
   - Create table with 10 columns
   - Upload files and verify parsing

3. **Modal UI**
   - Test all form inputs
   - Test validation
   - Test error messages

## Migration Strategy

### Phase 1: Add New System (No Breaking Changes)

1. Create new files (table-config-system.js, etc.)
2. Create default table-config.json with existing 6 tables
3. Initialize new system alongside existing code
4. Test in parallel

### Phase 2: Refactor Dashboard Initialization

1. Update script-clean.js to accept tableConfig object
2. Update dashboard initialization to use DashboardManager
3. Maintain backward compatibility with existing code

### Phase 3: Enable Dynamic Features

1. Add "Manage Tables" button to UI
2. Enable configuration modal
3. Test adding new tables
4. Test custom columns

### Phase 4: Clean Up

1. Remove hardcoded table initialization
2. Remove legacy routing code
3. Update documentation

## Performance Considerations

1. **Lazy Loading**: Only create Dashboard instances when needed
2. **Caching**: Cache parsed configuration in memory
3. **Debouncing**: Debounce configuration saves to prevent excessive writes
4. **Virtual Scrolling**: For tables with many rows (future enhancement)

## Security Considerations

1. **Input Validation**: Validate all configuration inputs
2. **XSS Prevention**: Sanitize user-provided table names and labels
3. **File Upload**: Maintain existing file type restrictions
4. **localStorage Limits**: Monitor storage usage and warn users

## Accessibility

1. **Keyboard Navigation**: Ensure modal is keyboard accessible
2. **ARIA Labels**: Add appropriate ARIA labels to form elements
3. **Focus Management**: Manage focus when opening/closing modal
4. **Screen Reader Support**: Ensure table structure is screen reader friendly

## Implementation Guarantees

**ALL functions in this design MUST be fully implemented and functional:**

1. **Configuration System**:
   - `loadConfig()` - MUST load from localStorage with fallback to defaults
   - `saveConfig()` - MUST save to localStorage and trigger updates
   - `addTable()` - MUST validate, add, save, and return tableId
   - `updateTable()` - MUST find, update, validate, and save
   - `deleteTable()` - MUST archive data, remove, and save
   - `toggleTableVisibility()` - MUST update visibility and save
   - `toggleLeaderboardInclusion()` - MUST update inclusion and save

2. **Dynamic Table Generator**:
   - `generateTable()` - MUST create complete HTML structure with all elements
   - `generateTableHeader()` - MUST handle both custom and default columns
   - `generateControlButtons()` - MUST create functional buttons
   - `removeTable()` - MUST completely remove from DOM
   - `refreshTable()` - MUST remove and regenerate

3. **File Routing Engine**:
   - `routeFile()` - MUST match patterns and return correct tableId
   - `matchPattern()` - MUST handle all pattern types (exact, contains, prefix, suffix)
   - `selectBestMatch()` - MUST prioritize correctly

4. **Configuration Modal**:
   - `saveTable()` - MUST validate, save, create/update table, and show success
   - `deleteTable()` - MUST confirm, archive, delete, and update UI
   - `toggleVisibility()` - MUST hide/show table and update leaderboard
   - `getFormData()` - MUST extract and validate all form fields
   - `extractColumnsFromForm()` - MUST parse all column definitions
   - `extractFilePatternsFromForm()` - MUST parse all file patterns

5. **Dashboard Manager**:
   - `createTable()` - MUST generate HTML and create Dashboard instance
   - `hideTable()` - MUST remove from UI but preserve data
   - `showTable()` - MUST restore to UI with data
   - `removeTable()` - MUST archive data and remove completely
   - `getLeaderboardDashboards()` - MUST return only visible + included tables

**Testing Requirements**:
- Every function must be tested with valid inputs
- Every function must handle errors gracefully
- Every save operation must persist to localStorage
- Every UI update must reflect immediately
- Hidden tables must not appear in leaderboard calculations
