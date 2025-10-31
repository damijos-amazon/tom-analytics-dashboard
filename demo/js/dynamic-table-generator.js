/**
 * Dynamic Table Generator
 * Generates HTML table elements from configuration
 */
class DynamicTableGenerator {
    constructor(configSystem) {
        this.configSystem = configSystem;
        this.containerElement = document.getElementById('tables-container');
    }

    /**
     * Detect which data columns are available in the dataset
     * @param {Array} data - Array of data rows
     * @returns {Object} Object indicating which columns have data
     */
    detectAvailableData(data) {
        if (!data || data.length === 0) {
            return { hasPriorMonth: true, hasCurrentMonth: true }; // Default to showing all
        }

        let hasPriorMonth = false;
        let hasCurrentMonth = false;

        // Check if any row has prior month or current month data
        for (const row of data) {
            if (row.priorMonth !== undefined && row.priorMonth !== null && row.priorMonth !== '') {
                hasPriorMonth = true;
            }
            if (row.currentMonth !== undefined && row.currentMonth !== null && row.currentMonth !== '') {
                hasCurrentMonth = true;
            }
            // Early exit if both are found
            if (hasPriorMonth && hasCurrentMonth) {
                break;
            }
        }

        return { hasPriorMonth, hasCurrentMonth };
    }

    /**
     * Generate all visible tables from configuration
     */
    generateAllTables() {
        if (!this.containerElement) {
            console.error('tables-container element not found in DOM');
            return;
        }

        const tables = this.configSystem.getAllTables();
        console.log(`Generating ${tables.length} tables`);

        tables.forEach(tableConfig => {
            if (tableConfig.visible !== false) {
                this.generateTable(tableConfig);
            } else {
                console.log(`Skipping hidden table: ${tableConfig.tableId}`);
            }
        });
    }

    /**
     * Generate single table HTML structure
     * @param {Object} tableConfig - Table configuration object
     * @returns {HTMLElement} The generated table section element
     */
    generateTable(tableConfig) {
        // Skip if not visible
        if (tableConfig.visible === false) {
            console.log(`Table ${tableConfig.tableId} is not visible, skipping generation`);
            return null;
        }

        console.log(`Generating table: ${tableConfig.tableId}`);

        // Create table section container
        const section = document.createElement('section');
        section.className = 'table-section';
        section.id = tableConfig.tableId;
        section.setAttribute('data-table-id', tableConfig.tableId);

        // Create header with title and description
        const header = document.createElement('div');
        header.className = 'section-header';
        header.style.marginBottom = '20px';

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.justifyContent = 'space-between';
        titleContainer.style.alignItems = 'center';

        const title = document.createElement('h2');
        title.className = 'table-title';
        title.style.margin = '0';
        title.textContent = tableConfig.displayName || tableConfig.tableName;
        titleContainer.appendChild(title);

        header.appendChild(titleContainer);

        // Add description if provided
        if (tableConfig.description) {
            const description = document.createElement('p');
            description.className = 'table-description';
            description.style.color = '#666';
            description.style.marginTop = '8px';
            description.textContent = tableConfig.description;
            header.appendChild(description);
        }

        section.appendChild(header);

        // Create control buttons section
        const controls = this.generateControlButtons(tableConfig);
        section.appendChild(controls);

        // Create table wrapper
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-container';

        // Create table element
        const table = document.createElement('table');
        table.className = 'compliance-table';
        table.id = `table-${tableConfig.tableId}`;

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

        // Apply styling
        this.applyTableStyling(section, tableConfig.color);

        // Insert into DOM
        if (!this.containerElement) {
            console.error('tables-container element not found, cannot insert table');
            return null;
        }

        this.containerElement.appendChild(section);

        // Generate podium for this table
        this.generatePodium(tableConfig);

        // Add section divider after podium
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        this.containerElement.appendChild(divider);

        console.log(`Table ${tableConfig.tableId} generated successfully with podium`);

        return section;
    }

    /**
     * Generate table header based on column configuration
     * @param {Array|null} columns - Column schema array or null for default columns
     * @param {Object} dataAvailability - Object indicating which data columns are available
     * @returns {HTMLElement} The thead element
     */
    generateTableHeader(columns, dataAvailability = { hasPriorMonth: true, hasCurrentMonth: true }) {
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
            // Default columns for backward compatibility
            const defaultColumns = [
                { name: 'Associate Name', show: true },
                { name: 'Prior Month', show: dataAvailability.hasPriorMonth },
                { name: 'Current Month', show: true },
                { name: 'Change', show: dataAvailability.hasPriorMonth },
                { name: 'Status', show: true }
            ];
            
            defaultColumns.forEach(col => {
                if (col.show) {
                    const th = document.createElement('th');
                    th.textContent = col.name;
                    th.className = 'sortable';
                    th.style.cursor = 'pointer';
                    headerRow.appendChild(th);
                }
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

    /**
     * Generate control buttons for table operations
     * @param {Object} tableConfig - Table configuration object
     * @returns {HTMLElement} The controls container element
     */
    generateControlButtons(tableConfig) {
        const controls = document.createElement('div');
        controls.className = 'table-controls';
        controls.style.marginBottom = '15px';

        // Create actions section
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'table-actions';

        // Clear Data button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-danger';
        clearBtn.textContent = 'Clear Data';
        clearBtn.setAttribute('data-table-id', tableConfig.tableId);
        clearBtn.onclick = () => {
            if (confirm(`Are you sure you want to clear all data from ${tableConfig.tableName}?`)) {
                // This will be handled by the dashboard instance
                console.log(`Clear data requested for ${tableConfig.tableId}`);
            }
        };
        actionsDiv.appendChild(clearBtn);

        controls.appendChild(actionsDiv);

        // Create export section
        const exportDiv = document.createElement('div');
        exportDiv.className = 'export-controls';

        // Export Excel button
        const exportExcelBtn = document.createElement('button');
        exportExcelBtn.className = 'btn btn-export';
        exportExcelBtn.textContent = '📊 Export Excel';
        exportExcelBtn.setAttribute('data-table-id', tableConfig.tableId);
        exportExcelBtn.onclick = () => {
            console.log(`Export Excel requested for ${tableConfig.tableId}`);
            // This will be handled by the dashboard instance
        };
        exportDiv.appendChild(exportExcelBtn);

        // Export CSV button
        const exportCsvBtn = document.createElement('button');
        exportCsvBtn.className = 'btn btn-export';
        exportCsvBtn.textContent = '📄 Export CSV';
        exportCsvBtn.setAttribute('data-table-id', tableConfig.tableId);
        exportCsvBtn.onclick = () => {
            console.log(`Export CSV requested for ${tableConfig.tableId}`);
            // This will be handled by the dashboard instance
        };
        exportDiv.appendChild(exportCsvBtn);

        // Backup button
        const backupBtn = document.createElement('button');
        backupBtn.className = 'btn btn-export';
        backupBtn.textContent = '💾 Backup';
        backupBtn.setAttribute('data-table-id', tableConfig.tableId);
        backupBtn.onclick = () => {
            console.log(`Backup requested for ${tableConfig.tableId}`);
            // This will be handled by the dashboard instance
        };
        exportDiv.appendChild(backupBtn);

        controls.appendChild(exportDiv);

        return controls;
    }

    /**
     * Apply table styling based on color theme
     * @param {HTMLElement} tableElement - The table section element
     * @param {string} color - Hex color code for theme
     */
    applyTableStyling(tableElement, color) {
        if (color) {
            // Apply color as CSS custom property for theming
            tableElement.style.setProperty('--table-accent-color', color);
            
            // Apply color to specific elements
            const title = tableElement.querySelector('.table-title');
            if (title) {
                title.style.color = color;
            }
            
            // Apply subtle border color
            const tableContainer = tableElement.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.style.borderTop = `3px solid ${color}`;
            }
        }
    }

    /**
     * Remove table from DOM
     * @param {string} tableId - Table identifier
     */
    removeTable(tableId) {
        const section = document.querySelector(`[data-table-id="${tableId}"]`);
        if (section) {
            section.remove();
            console.log(`Removed table from DOM: ${tableId}`);
        } else {
            console.warn(`Table section not found for removal: ${tableId}`);
        }
    }

    /**
     * Generate podium for table's top 3 performers
     * @param {Object} tableConfig - Table configuration object
     * @returns {HTMLElement} The generated podium section element
     */
    generatePodium(tableConfig) {
        const podiumSection = document.createElement('section');
        podiumSection.className = 'podium-section';
        podiumSection.id = `podium-${tableConfig.tableId}`;

        const title = document.createElement('h2');
        title.className = 'podium-title';
        title.textContent = 'Top 3 Performers';
        podiumSection.appendChild(title);

        const podiumContainer = document.createElement('div');
        podiumContainer.className = 'podium';
        podiumContainer.id = `podium_${tableConfig.tableBodyId}`;

        // Create three podium places: second, first, third (visual order)
        const places = [
            { position: 'second', trophy: '🥈', rank: 2 },
            { position: 'first', trophy: '🏆', rank: 1 },
            { position: 'third', trophy: '🥉', rank: 3 }
        ];

        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.className = `podium-place ${place.position}`;

            placeDiv.innerHTML = `
                <div class="performer-avatar">
                    <div class="avatar-circle">-</div>
                </div>
                <div class="performer-name">-</div>
                <div class="trophy trophy-${place.position === 'first' ? 'gold' : place.position === 'second' ? 'silver' : 'bronze'}">${place.trophy}</div>
                <div class="performer-score">- <span class="status-badge">-</span></div>
            `;

            podiumContainer.appendChild(placeDiv);
        });

        podiumSection.appendChild(podiumContainer);

        // Insert into DOM
        if (this.containerElement) {
            this.containerElement.appendChild(podiumSection);
        }

        return podiumSection;
    }

    /**
     * Refresh table UI by regenerating from config
     * @param {string} tableId - Table identifier
     */
    refreshTable(tableId) {
        console.log(`Refreshing table: ${tableId}`);
        
        const tableConfig = this.configSystem.getTableConfig(tableId);
        if (!tableConfig) {
            console.error(`Cannot refresh table: config not found for ${tableId}`);
            return;
        }

        // Remove old table and podium
        this.removeTable(tableId);
        this.removePodium(tableId);

        // Regenerate from config
        this.generateTable(tableConfig);
        
        console.log(`Table refreshed: ${tableId}`);
    }

    /**
     * Remove podium from DOM
     * @param {string} tableId - Table identifier
     */
    removePodium(tableId) {
        const podium = document.getElementById(`podium-${tableId}`);
        if (podium) {
            podium.remove();
            console.log(`Removed podium from DOM: ${tableId}`);
        }
    }
}
