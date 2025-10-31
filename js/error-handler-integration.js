/**
 * Error Handler Integration Examples
 * Shows how to integrate error handler with existing services
 */

// Example 1: Wrapping AuthService methods with error handling
class AuthServiceWithErrorHandling {
    constructor(authService, errorHandler) {
        this.authService = authService;
        this.errorHandler = errorHandler;
    }

    async signInWithSSO(provider) {
        try {
            return await this.authService.signInWithSSO(provider);
        } catch (error) {
            this.errorHandler.handleError(error, 'Authentication', { provider });
            throw error;
        }
    }

    async signOut() {
        try {
            return await this.authService.signOut();
        } catch (error) {
            this.errorHandler.handleError(error, 'Sign Out');
            throw error;
        }
    }

    async loadUserProfile() {
        try {
            return await this.authService.loadUserProfile();
        } catch (error) {
            this.errorHandler.handleError(error, 'Load User Profile');
            throw error;
        }
    }
}

// Example 2: Wrapping DatabaseService methods with retry logic
class DatabaseServiceWithRetry {
    constructor(databaseService, errorHandler) {
        this.databaseService = databaseService;
        this.errorHandler = errorHandler;
    }

    async saveTableData(tableId, employeeName, data) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.databaseService.saveTableData(tableId, employeeName, data);
            },
            {
                context: 'Save Table Data',
                metadata: { tableId, employeeName },
                maxRetries: 3,
                retryDelay: 2000
            }
        );
    }

    async loadTableData(tableId) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.databaseService.loadTableData(tableId);
            },
            {
                context: 'Load Table Data',
                metadata: { tableId },
                maxRetries: 3,
                retryDelay: 1000
            }
        );
    }

    async deleteTableData(tableId, employeeName) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.databaseService.deleteTableData(tableId, employeeName);
            },
            {
                context: 'Delete Table Data',
                metadata: { tableId, employeeName },
                maxRetries: 2,
                retryDelay: 1500
            }
        );
    }

    async saveTableConfiguration(config) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.databaseService.saveTableConfiguration(config);
            },
            {
                context: 'Save Configuration',
                metadata: { configVersion: config.version },
                maxRetries: 3,
                retryDelay: 2000
            }
        );
    }
}

// Example 3: Wrapping AdminPanelService methods
class AdminPanelServiceWithErrorHandling {
    constructor(adminPanelService, errorHandler) {
        this.adminPanelService = adminPanelService;
        this.errorHandler = errorHandler;
    }

    async getAllUsers() {
        try {
            return await this.adminPanelService.getAllUsers();
        } catch (error) {
            this.errorHandler.handleError(error, 'Get All Users');
            throw error;
        }
    }

    async promoteToAdmin(userId) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.adminPanelService.promoteToAdmin(userId);
            },
            {
                context: 'Promote User',
                metadata: { userId, action: 'promote' },
                maxRetries: 2,
                retryDelay: 1000
            }
        );
    }

    async blockUser(userId, reason) {
        return await this.errorHandler.queueAction(
            async () => {
                return await this.adminPanelService.blockUser(userId, reason);
            },
            {
                context: 'Block User',
                metadata: { userId, reason },
                maxRetries: 2,
                retryDelay: 1000
            }
        );
    }

    async getAuditLogs(filters) {
        try {
            return await this.adminPanelService.getAuditLogs(filters);
        } catch (error) {
            this.errorHandler.handleError(error, 'Get Audit Logs', { filters });
            throw error;
        }
    }
}

// Example 4: Global fetch wrapper with error handling
async function fetchWithErrorHandling(url, options = {}) {
    const errorHandler = window.errorHandler;
    
    return await errorHandler.queueAction(
        async () => {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },
        {
            context: 'API Request',
            metadata: { url, method: options.method || 'GET' },
            maxRetries: 3,
            retryDelay: 2000
        }
    );
}

// Example 5: Form submission with error handling
async function handleFormSubmit(formData, submitFunction) {
    const errorHandler = window.errorHandler;
    
    try {
        const result = await errorHandler.queueAction(
            async () => await submitFunction(formData),
            {
                context: 'Form Submission',
                metadata: { formType: formData.type },
                maxRetries: 2,
                retryDelay: 1500
            }
        );
        
        errorHandler.showSuccessMessage('Form submitted successfully');
        return result;
    } catch (error) {
        // Error already handled by errorHandler
        return null;
    }
}

// Example 6: Batch operations with error handling
async function batchOperationWithErrorHandling(items, operationFunction) {
    const errorHandler = window.errorHandler;
    const results = [];
    const errors = [];

    for (const item of items) {
        try {
            const result = await errorHandler.queueAction(
                async () => await operationFunction(item),
                {
                    context: 'Batch Operation',
                    metadata: { itemId: item.id },
                    maxRetries: 2,
                    retryDelay: 1000
                }
            );
            results.push({ item, result, success: true });
        } catch (error) {
            errors.push({ item, error, success: false });
        }
    }

    return {
        results,
        errors,
        successCount: results.length,
        errorCount: errors.length
    };
}

// Example 7: Initialize services with error handling
function initializeServicesWithErrorHandling(supabase) {
    const errorHandler = window.errorHandler;
    
    // Create base services
    const authService = new AuthService(supabase);
    const databaseService = new DatabaseService(supabase, authService);
    const adminPanelService = new AdminPanelService(supabase, authService);
    
    // Wrap with error handling
    const authServiceWrapped = new AuthServiceWithErrorHandling(authService, errorHandler);
    const databaseServiceWrapped = new DatabaseServiceWithRetry(databaseService, errorHandler);
    const adminPanelServiceWrapped = new AdminPanelServiceWithErrorHandling(adminPanelService, errorHandler);
    
    return {
        auth: authServiceWrapped,
        database: databaseServiceWrapped,
        admin: adminPanelServiceWrapped
    };
}

// Example 8: Event listener with error handling
function addEventListenerWithErrorHandling(element, event, handler) {
    const errorHandler = window.errorHandler;
    
    element.addEventListener(event, async (e) => {
        try {
            await handler(e);
        } catch (error) {
            errorHandler.handleError(error, `Event Handler: ${event}`, {
                elementId: element.id,
                elementClass: element.className
            });
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AuthServiceWithErrorHandling,
        DatabaseServiceWithRetry,
        AdminPanelServiceWithErrorHandling,
        fetchWithErrorHandling,
        handleFormSubmit,
        batchOperationWithErrorHandling,
        initializeServicesWithErrorHandling,
        addEventListenerWithErrorHandling
    };
}
