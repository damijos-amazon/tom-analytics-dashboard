/**
 * Configuration Modal UI
 * Provides visual interface for managing table configurations
 */
class ConfigModal {
    constructor(configSystem, dashboardManager) {
        this.configSystem = configSystem;
        this.dashboardManager = dashboardManager;
        this.modal = null;
        this.currentEditingTable = null;
    }

    /**
     * Create modal HTML structure
     * Generates the complete modal DOM structure
     */
    createModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('configModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'configModal';
        modal.className = 'config-modal';
        modal.style.display = 'none';

        // Create modal content
        modal.innerHTML = `
            <div class="config-modal-content">
                <div class="config-modal-header">
                    <h2>Manage Tables</h2>
                    <button class="close-btn" onclick="configModal.hide()">&times;</button>
                </div>
                
                <div class="config-modal-body">
                    <!-- Left: Table List -->
                    <div class="table-list-section">
                        <div class="table-list-header">
                            <h3>Existing Tables</h3>
                            <button class="btn btn-success add-table-btn" onclick="configModal.showAddForm()">
                                + Add New Table
                            </button>
                        </div>
                        <div id="tableList" class="table-list"></div>
                    </div>
                    
                    <!-- Right: Table Form -->
                    <div class="table-form-section">
                        <h3 id="formTitle">Add New Table</h3>
                        <form id="tableConfigForm" onsubmit="event.preventDefault(); configModal.saveTable();">
                            <!-- Basic Info -->
                            <div class="form-group">
                                <label for="tableName">Table Name *</label>
                                <input type="text" id="tableName" name="tableName" required 
                                       placeholder="e.g., VTI Compliance">
                            </div>
                            
                            <div class="form-group">
                                <label for="displayName">Display Name</label>
                                <input type="text" id="displayName" name="displayName" 
                                       placeholder="Leave empty to use Table Name">
                            </div>
                            
                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea id="description" name="description" rows="2" 
                                          placeholder="Optional description"></textarea>
                            </div>
                            
                            <!-- Scoring Config -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="direction">Scoring Direction *</label>
                                    <select id="direction" name="direction" required>
                                        <option value="higher">Higher is Better</option>
                                        <option value="lower">Lower is Better</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="defaultBenchmark">Default Benchmark *</label>
                                    <input type="number" id="defaultBenchmark" name="defaultBenchmark" 
                                           step="0.01" required placeholder="e.g., 95">
                                </div>
                            </div>
                            
                            <!-- Display Config -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="color">Theme Color</label>
                                    <input type="color" id="color" name="color" value="#FF9900">
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="visible" name="visible" checked>
                                        Visible in UI
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="includeInLeaderboard" name="includeInLeaderboard" checked>
                                        Include in Leaderboard
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Column Editor -->
                            <div class="form-group">
                                <label>Columns (leave empty for default columns)</label>
                                <div id="columnEditor" class="editor-container"></div>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="configModal.addColumnField()">
                                    + Add Column
                                </button>
                            </div>
                            
                            <!-- File Pattern Editor -->
                            <div class="form-group">
                                <label>File Upload Patterns *</label>
                                <div id="patternEditor" class="editor-container"></div>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="configModal.addPatternField()">
                                    + Add File Name Rule
                                </button>
                            </div>
                            
                            <!-- Form Actions -->
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Save Table</button>
                                <button type="button" class="btn btn-secondary" onclick="configModal.showAddForm()">
                                    Reset Form
                                </button>
                            </div>
                        </form>
                        
                        <!-- Message Display -->
                        <div id="formMessage" class="form-message"></div>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(modal);
        this.modal = modal;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });

        console.log('Config modal created');
    }

    /**
     * Show the modal
     */
    show() {
        if (!this.modal) {
            this.createModal();
        }
        
        this.loadTableList();
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        console.log('Config modal shown');
    }

    /**
     * Hide the modal
     */
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
        
        console.log('Config modal hidden');
    }

    /**
     * Load and display list of all configured tables
     */
    loadTableList() {
        const tableList = document.getElementById('tableList');
        if (!tableList) {
            console.error('Table list element not found');
            return;
        }

        const tables = this.configSystem.getAllTables();
        
        if (tables.length === 0) {
            tableList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No tables configured yet</div>
                </div>
            `;
            return;
        }

        // Generate table list items
        tableList.innerHTML = tables.map(table => {
            const isActive = this.currentEditingTable === table.tableId;
            const visibleBadge = table.visible !== false 
                ? '<span class="badge badge-visible">Visible</span>' 
                : '<span class="badge badge-hidden">Hidden</span>';
            const leaderboardBadge = table.includeInLeaderboard !== false 
                ? '<span class="badge badge-leaderboard">Leaderboard</span>' 
                : '';
            
            return `
                <div class="table-list-item ${isActive ? 'active' : ''}" data-table-id="${table.tableId}">
                    <div class="table-item-header">
                        <div class="table-item-name">${table.displayName || table.tableName}</div>
                        <div class="table-item-badges">
                            ${visibleBadge}
                            ${leaderboardBadge}
                        </div>
                    </div>
                    <div class="table-item-info">
                        Direction: ${table.direction === 'higher' ? '↑ Higher is Better' : '↓ Lower is Better'} | 
                        Benchmark: ${table.defaultBenchmark}
                    </div>
                    <div class="table-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="configModal.showEditForm('${table.tableId}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="configModal.deleteTable('${table.tableId}')">
                            🗑️ Delete
                        </button>
                        <button class="btn btn-info btn-sm" onclick="configModal.toggleVisibility('${table.tableId}')">
                            ${table.visible !== false ? '👁️ Hide' : '👁️ Show'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        console.log(`Loaded ${tables.length} tables in list`);
    }

    /**
     * Show add table form
     * Resets the form for creating a new table
     */
    showAddForm() {
        this.currentEditingTable = null;
        
        // Update form title
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = 'Add New Table';
        }

        // Reset form
        const form = document.getElementById('tableConfigForm');
        if (form && typeof form.reset === 'function') {
            form.reset();
        } else if (form) {
            // Manual reset if form.reset doesn't exist
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }

        // Set default values
        document.getElementById('color').value = '#FF9900';
        document.getElementById('visible').checked = true;
        document.getElementById('includeInLeaderboard').checked = true;
        document.getElementById('direction').value = 'higher';

        // Clear editors
        document.getElementById('columnEditor').innerHTML = '';
        document.getElementById('patternEditor').innerHTML = '';

        // Add one default pattern field
        this.addPatternField();

        // Clear message
        const messageDiv = document.getElementById('formMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }

        // Update table list to remove active state
        this.loadTableList();

        console.log('Add form displayed');
    }

    /**
     * Show edit table form
     * Populates the form with existing table configuration
     * @param {string} tableId - Table identifier
     */
    showEditForm(tableId) {
        const tableConfig = this.configSystem.getTableConfig(tableId);
        if (!tableConfig) {
            this.showMessage(`Table not found: ${tableId}`, 'error');
            return;
        }

        this.currentEditingTable = tableId;

        // Update form title
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = `Edit Table: ${tableConfig.tableName}`;
        }

        // Populate basic fields
        document.getElementById('tableName').value = tableConfig.tableName || '';
        document.getElementById('displayName').value = tableConfig.displayName || '';
        document.getElementById('description').value = tableConfig.description || '';
        document.getElementById('direction').value = tableConfig.direction || 'higher';
        document.getElementById('defaultBenchmark').value = tableConfig.defaultBenchmark || 0;
        document.getElementById('color').value = tableConfig.color || '#FF9900';
        document.getElementById('visible').checked = tableConfig.visible !== false;
        document.getElementById('includeInLeaderboard').checked = tableConfig.includeInLeaderboard !== false;

        // Populate columns (will be implemented in sub-task 7.4)
        this.renderColumnEditor(tableConfig.columns);

        // Populate file patterns (will be implemented in sub-task 7.5)
        this.renderFilePatternEditor(tableConfig.filePatterns);

        // Clear message
        const messageDiv = document.getElementById('formMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }

        // Update table list to show active state
        this.loadTableList();

        // Scroll form into view
        document.querySelector('.table-form-section').scrollTop = 0;

        console.log(`Edit form displayed for table: ${tableId}`);
    }

    /**
     * Render column editor with existing columns
     * @param {Array|null} columns - Array of column configurations or null
     */
    renderColumnEditor(columns) {
        const columnEditor = document.getElementById('columnEditor');
        if (!columnEditor) return;

        columnEditor.innerHTML = '';

        if (!columns || columns.length === 0) {
            columnEditor.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No custom columns defined. Default columns will be used.</p>';
            return;
        }

        columns.forEach((column, index) => {
            this.addColumnField(column);
        });

        console.log(`Rendered ${columns.length} columns in editor`);
    }

    /**
     * Add a column field to the editor
     * @param {Object|null} columnData - Existing column data or null for new column
     */
    addColumnField(columnData = null) {
        const columnEditor = document.getElementById('columnEditor');
        if (!columnEditor) return;

        // Remove empty state message if present
        const emptyMsg = columnEditor.querySelector('p');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        const columnIndex = columnEditor.children.length;
        const column = columnData || {
            id: '',
            label: '',
            dataType: 'text',
            visible: true,
            sortable: true,
            editable: false,
            fileColumnMapping: ''
        };

        const columnItem = document.createElement('div');
        columnItem.className = 'editor-item column-item';
        columnItem.innerHTML = `
            <div class="editor-item-header">
                <div class="editor-item-title">Column ${columnIndex + 1}</div>
                <button type="button" class="remove-btn" onclick="this.closest('.column-item').remove()">Remove</button>
            </div>
            <div class="editor-item-fields">
                <div class="editor-field">
                    <label>Column ID *</label>
                    <input type="text" name="columnId" value="${column.id}" placeholder="e.g., employee_name" required>
                </div>
                <div class="editor-field">
                    <label>Display Label *</label>
                    <input type="text" name="columnLabel" value="${column.label}" placeholder="e.g., Employee Name" required>
                </div>
                <div class="editor-field">
                    <label>Data Type</label>
                    <select name="columnDataType">
                        <option value="text" ${column.dataType === 'text' ? 'selected' : ''}>Text</option>
                        <option value="number" ${column.dataType === 'number' ? 'selected' : ''}>Number</option>
                        <option value="percentage" ${column.dataType === 'percentage' ? 'selected' : ''}>Percentage</option>
                        <option value="date" ${column.dataType === 'date' ? 'selected' : ''}>Date</option>
                        <option value="status" ${column.dataType === 'status' ? 'selected' : ''}>Status</option>
                    </select>
                </div>
                <div class="editor-field">
                    <label>File Column Mapping</label>
                    <input type="text" name="columnFileMapping" value="${column.fileColumnMapping || ''}" placeholder="e.g., A, B, C">
                </div>
                <div class="editor-field editor-field-full" style="display: flex; gap: 15px; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="checkbox" name="columnVisible" ${column.visible !== false ? 'checked' : ''}>
                        Visible
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="checkbox" name="columnSortable" ${column.sortable !== false ? 'checked' : ''}>
                        Sortable
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="checkbox" name="columnEditable" ${column.editable === true ? 'checked' : ''}>
                        Editable
                    </label>
                </div>
            </div>
        `;

        columnEditor.appendChild(columnItem);
        console.log('Added column field');
    }

    /**
     * Extract columns from form
     * @returns {Array|null} Array of column configurations or null for default columns
     */
    extractColumnsFromForm() {
        const columnElements = document.querySelectorAll('.column-item');
        
        if (columnElements.length === 0) {
            return null; // Use default columns
        }

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

            // Validate required fields
            if (column.id && column.label) {
                columns.push(column);
            } else {
                console.warn(`Column ${index + 1} missing required fields, skipping`);
            }
        });

        return columns.length > 0 ? columns : null;
    }

    /**
     * Render file pattern editor with existing patterns
     * @param {Array} patterns - Array of file pattern configurations
     */
    renderFilePatternEditor(patterns) {
        const patternEditor = document.getElementById('patternEditor');
        if (!patternEditor) return;

        patternEditor.innerHTML = '';

        if (!patterns || patterns.length === 0) {
            this.addPatternField();
            return;
        }

        patterns.forEach((pattern, index) => {
            this.addPatternField(pattern);
        });

        console.log(`Rendered ${patterns.length} patterns in editor`);
    }

    /**
     * Add a file pattern field to the editor
     * @param {Object|null} patternData - Existing pattern data or null for new pattern
     */
    addPatternField(patternData = null) {
        const patternEditor = document.getElementById('patternEditor');
        if (!patternEditor) return;

        const patternIndex = patternEditor.children.length;
        const pattern = patternData || {
            pattern: '',
            type: 'exact',
            priority: patternIndex + 1,
            exclude: []
        };

        const patternItem = document.createElement('div');
        patternItem.className = 'editor-item pattern-item';
        patternItem.innerHTML = `
            <div class="editor-item-header">
                <div class="editor-item-title">Pattern ${patternIndex + 1}</div>
                <button type="button" class="remove-btn" onclick="this.closest('.pattern-item').remove()">Remove</button>
            </div>
            <div class="editor-item-fields">
                <div class="editor-field">
                    <label>Pattern *</label>
                    <input type="text" name="patternValue" value="${pattern.pattern}" placeholder="e.g., vti-compliance" required>
                </div>
                <div class="editor-field">
                    <label>Pattern Type</label>
                    <select name="patternType">
                        <option value="exact" ${pattern.type === 'exact' ? 'selected' : ''}>Exact Match</option>
                        <option value="contains" ${pattern.type === 'contains' ? 'selected' : ''}>Contains</option>
                        <option value="prefix" ${pattern.type === 'prefix' ? 'selected' : ''}>Starts With</option>
                        <option value="suffix" ${pattern.type === 'suffix' ? 'selected' : ''}>Ends With</option>
                    </select>
                </div>
                <div class="editor-field">
                    <label>Priority (lower = higher priority)</label>
                    <input type="number" name="patternPriority" value="${pattern.priority}" min="1" placeholder="1">
                </div>
                <div class="editor-field">
                    <label>Exclude Patterns (comma-separated)</label>
                    <input type="text" name="patternExclude" value="${pattern.exclude ? pattern.exclude.join(', ') : ''}" placeholder="e.g., dpmo, test">
                </div>
                <div class="editor-field editor-field-full">
                    <label style="font-size: 11px; color: #999;">
                        💡 Examples: "prior-vti" (exact), "vti" (contains), "current-" (prefix), "-data" (suffix)
                    </label>
                </div>
            </div>
        `;

        patternEditor.appendChild(patternItem);
        console.log('Added pattern field');
    }

    /**
     * Extract file patterns from form
     * @returns {Array} Array of file pattern configurations
     */
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
                pattern.exclude = excludeInput.value.split(',').map(s => s.trim()).filter(s => s);
            }

            // Validate required fields
            if (pattern.pattern) {
                patterns.push(pattern);
            } else {
                console.warn(`Pattern ${index + 1} missing required pattern value, skipping`);
            }
        });

        return patterns;
    }

    /**
     * Toggle table visibility
     * @param {string} tableId - Table identifier
     */
    async toggleVisibility(tableId) {
        try {
            const tableConfig = this.configSystem.getTableConfig(tableId);
            if (!tableConfig) {
                throw new Error(`Table not found: ${tableId}`);
            }

            const newVisibility = !tableConfig.visible;
            
            // Update visibility
            this.configSystem.toggleTableVisibility(tableId, newVisibility);
            
            // When hiding, also exclude from leaderboard
            // When showing, restore leaderboard inclusion
            this.configSystem.toggleLeaderboardInclusion(tableId, newVisibility);
            
            // Update dashboard manager if it exists
            if (this.dashboardManager) {
                if (newVisibility) {
                    if (typeof this.dashboardManager.showTable === 'function') {
                        this.dashboardManager.showTable(tableId);
                    }
                    this.showMessage(`Table "${tableConfig.tableName}" is now visible and included in leaderboard`, 'success');
                } else {
                    if (typeof this.dashboardManager.hideTable === 'function') {
                        this.dashboardManager.hideTable(tableId);
                    }
                    this.showMessage(`Table "${tableConfig.tableName}" is now hidden and excluded from leaderboard`, 'success');
                }
            } else {
                this.showMessage(`Table "${tableConfig.tableName}" visibility updated. Refresh page to see changes.`, 'success');
            }
            
            // Reload table list
            this.loadTableList();
            
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            this.showMessage(`Error: ${error.message || error.toString() || 'Unknown error'}`, 'error');
        }
    }

    /**
     * Delete table with confirmation
     * @param {string} tableId - Table identifier
     */
    async deleteTable(tableId) {
        try {
            const tableConfig = this.configSystem.getTableConfig(tableId);
            if (!tableConfig) {
                throw new Error(`Table not found: ${tableId}`);
            }

            const confirmMsg = `Are you sure you want to delete "${tableConfig.tableName}"?\n\nData will be archived to localStorage.`;
            
            if (!confirm(confirmMsg)) {
                return;
            }

            // Delete from configuration
            await this.configSystem.deleteTable(tableId);
            
            // Remove from dashboard manager if available
            if (this.dashboardManager && typeof this.dashboardManager.removeTable === 'function') {
                this.dashboardManager.removeTable(tableId);
            }
            
            // Show success message
            this.showMessage(`Table "${tableConfig.tableName}" deleted and data archived`, 'success');
            
            // Reload table list
            this.loadTableList();
            
            // Reset form if editing this table
            if (this.currentEditingTable === tableId) {
                this.currentEditingTable = null;
                this.showAddForm();
            }
            
        } catch (error) {
            console.error('Failed to delete table:', error);
            this.showMessage(`Error: ${error.message || error.toString() || 'Unknown error'}`, 'error');
        }
    }

    /**
     * Get form data and validate
     * @returns {Object} Table configuration object
     */
    getFormData() {
        console.log('getFormData called');
        // Read directly from input elements since tableConfigForm is a div, not a form
        const tableNameInput = document.getElementById('tableName');
        const displayNameInput = document.getElementById('displayName');
        const descriptionInput = document.getElementById('description');
        const directionInput = document.getElementById('direction');
        const defaultBenchmarkInput = document.getElementById('defaultBenchmark');
        const colorInput = document.getElementById('color');
        const visibleInput = document.getElementById('visible');
        const includeInLeaderboardInput = document.getElementById('includeInLeaderboard');
        
        console.log('tableNameInput:', tableNameInput, 'value:', tableNameInput?.value);
        
        const tableName = tableNameInput ? tableNameInput.value.trim() : '';
        const displayName = displayNameInput ? displayNameInput.value.trim() : '';
        
        if (!tableName) {
            throw new Error('Table name is required');
        }
        
        const config = {
            tableName: tableName,
            displayName: displayName || tableName,
            description: descriptionInput ? descriptionInput.value.trim() : '',
            direction: directionInput ? directionInput.value : 'higher',
            defaultBenchmark: defaultBenchmarkInput ? parseFloat(defaultBenchmarkInput.value) || 0 : 0,
            color: colorInput ? colorInput.value : '#FF9900',
            visible: visibleInput ? visibleInput.checked : true,
            includeInLeaderboard: includeInLeaderboardInput ? includeInLeaderboardInput.checked : true
        };

        // Extract columns
        config.columns = this.extractColumnsFromForm();

        // Extract file patterns
        config.filePatterns = this.extractFilePatternsFromForm();

        // Validate required fields
        if (!config.tableName) {
            throw new Error('Table name is required');
        }

        if (!config.direction || !['higher', 'lower'].includes(config.direction)) {
            throw new Error('Invalid scoring direction. Must be "higher" or "lower"');
        }

        if (isNaN(config.defaultBenchmark)) {
            throw new Error('Default benchmark must be a valid number');
        }

        if (!config.filePatterns || config.filePatterns.length === 0) {
            throw new Error('At least one file pattern is required');
        }

        // Validate file patterns
        config.filePatterns.forEach((pattern, index) => {
            if (!pattern.pattern) {
                throw new Error(`Pattern ${index + 1} is missing a pattern value`);
            }
            if (!['exact', 'contains', 'prefix', 'suffix'].includes(pattern.type)) {
                throw new Error(`Pattern ${index + 1} has invalid type`);
            }
        });

        return config;
    }

    /**
     * Save table configuration
     * Handles both create and update operations
     */
    async saveTable() {
        try {
            // Get and validate form data
            console.log('saveTable called');
            const formData = this.getFormData();
            console.log('Form data:', formData);

            if (this.currentEditingTable) {
                // Update existing table
                console.log(`Updating table: ${this.currentEditingTable}`);
                
                await this.configSystem.updateTable(this.currentEditingTable, formData);
                
                // Refresh the table in dashboard manager if available
                if (this.dashboardManager && typeof this.dashboardManager.refreshTable === 'function') {
                    this.dashboardManager.refreshTable(this.currentEditingTable);
                }
                
                this.showMessage(`Table "${formData.tableName}" updated successfully`, 'success');
                
            } else {
                // Add new table
                console.log('Adding new table');
                
                const newTableId = await this.configSystem.addTable(formData);
                
                // Create the table in dashboard manager if available
                if (this.dashboardManager && typeof this.dashboardManager.createTable === 'function') {
                    this.dashboardManager.createTable(newTableId);
                }
                
                this.showMessage(`Table "${formData.tableName}" created successfully`, 'success');
            }

            // Reload table list
            this.loadTableList();

            // Reset form to add mode
            this.currentEditingTable = null;
            this.showAddForm();

        } catch (error) {
            console.error('Failed to save table:', error);
            this.showMessage(`Error: ${error.message || error.toString() || 'Unknown error'}`, 'error');
        }
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type: 'success', 'error', 'info'
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('formMessage');
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}
