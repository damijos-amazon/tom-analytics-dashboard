/**
 * File Routing Engine
 * Routes uploaded files to appropriate tables based on filename patterns
 */
class FileRoutingEngine {
    /**
     * Create a new FileRoutingEngine
     * @param {TableConfigSystem} configSystem - The table configuration system
     */
    constructor(configSystem) {
        this.configSystem = configSystem;
    }

    /**
     * Route file to appropriate table based on filename patterns
     * @param {File} file - The uploaded file
     * @returns {string} The target table ID
     */
    routeFile(file) {
        const filename = file.name.toLowerCase();
        const tables = this.configSystem.getAllTables();
        
        // Match against patterns
        const matches = this.findMatches(filename, tables);
        
        // Select best match by priority
        const targetTable = this.selectBestMatch(matches);
        
        // Log routing decision
        console.log(`Routing ${file.name} -> ${targetTable.tableName} (tableId: ${targetTable.tableId})`);
        
        return targetTable.tableId;
    }

    /**
     * Find all matching tables for a filename
     * @param {string} filename - The filename to match (lowercase)
     * @param {Array} tables - Array of table configurations
     * @returns {Array} Array of match objects with tableId, tableName, priority, and pattern
     */
    findMatches(filename, tables) {
        const matches = [];
        
        tables.forEach(table => {
            if (!table.filePatterns || !Array.isArray(table.filePatterns)) {
                return;
            }
            
            table.filePatterns.forEach(pattern => {
                if (this.matchPattern(filename, pattern)) {
                    matches.push({
                        tableId: table.tableId,
                        tableName: table.tableName,
                        priority: pattern.priority,
                        pattern: pattern.pattern,
                        patternType: pattern.type
                    });
                }
            });
        });
        
        return matches;
    }

    /**
     * Match filename against a single pattern
     * @param {string} filename - The filename to match (lowercase)
     * @param {Object} pattern - Pattern object with pattern, type, and optional exclude
     * @returns {boolean} True if filename matches the pattern
     */
    matchPattern(filename, pattern) {
        // Remove file extension for matching
        const cleanName = filename.replace(/\.(xlsx|csv|json)$/i, '');
        const patternStr = pattern.pattern.toLowerCase();
        
        // Check pattern type
        let hasMatch = false;
        
        switch (pattern.type) {
            case 'exact':
                hasMatch = cleanName === patternStr;
                break;
                
            case 'contains':
                hasMatch = cleanName.includes(patternStr);
                break;
                
            case 'prefix':
                hasMatch = cleanName.startsWith(patternStr);
                break;
                
            case 'suffix':
                hasMatch = cleanName.endsWith(patternStr);
                break;
                
            default:
                console.warn(`Unknown pattern type: ${pattern.type}`);
                return false;
        }
        
        // If no match, return false
        if (!hasMatch) {
            return false;
        }
        
        // Check exclusion patterns
        if (pattern.exclude && Array.isArray(pattern.exclude)) {
            const hasExclusion = pattern.exclude.some(excludePattern => {
                return cleanName.includes(excludePattern.toLowerCase());
            });
            
            if (hasExclusion) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Select best match from multiple matches based on priority
     * @param {Array} matches - Array of match objects
     * @returns {Object} The table configuration for the best match
     */
    selectBestMatch(matches) {
        // If no matches, return default table
        if (matches.length === 0) {
            const defaultTableId = this.configSystem.config.defaultTable;
            const defaultTable = this.configSystem.getTableConfig(defaultTableId);
            
            if (!defaultTable) {
                console.error(`Default table not found: ${defaultTableId}`);
                // Return first table as fallback
                const tables = this.configSystem.getAllTables();
                if (tables.length > 0) {
                    return tables[0];
                }
                throw new Error('No tables available for routing');
            }
            
            console.log(`No pattern match found, using default table: ${defaultTable.tableName}`);
            return defaultTable;
        }
        
        // Sort by priority (lower number = higher priority)
        matches.sort((a, b) => {
            // First sort by priority
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            
            // If priorities are equal, prefer exact matches over other types
            const typeOrder = { exact: 1, prefix: 2, suffix: 3, contains: 4 };
            const aOrder = typeOrder[a.patternType] || 5;
            const bOrder = typeOrder[b.patternType] || 5;
            
            return aOrder - bOrder;
        });
        
        // Get the best match (first after sorting)
        const bestMatch = matches[0];
        
        // Log if multiple matches found
        if (matches.length > 1) {
            console.log(`Multiple matches found (${matches.length}), selected highest priority:`, bestMatch);
        }
        
        // Return the table configuration
        return this.configSystem.getTableConfig(bestMatch.tableId);
    }
}
