/**
 * AdminPanelService
 * Handles all admin panel operations including user management, audit logs, and system statistics
 */
class AdminPanelService {
    constructor(supabaseClient, authService, encryptionService = null) {
        this.supabase = supabaseClient;
        this.authService = authService;
        this.encryptionService = encryptionService || new EncryptionService();
    }

    /**
     * Get users with pagination
     * @param {Object} options - Pagination options
     * @param {number} options.page - Page number (0-indexed)
     * @param {number} options.pageSize - Number of records per page (default: 100)
     * @returns {Promise<Object>} Object containing users and pagination metadata
     */
    async getUsers(options = {}) {
        const { page = 0, pageSize = 100 } = options;
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error, count } = await this.supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) {
            throw new Error(`Failed to load users: ${error.message}`);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                pageSize,
                totalRecords: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize),
                hasNextPage: to < (count || 0) - 1,
                hasPreviousPage: page > 0
            }
        };
    }

    /**
     * Get all users (backward compatibility)
     * @returns {Promise<Array>} List of all users
     */
    async getAllUsers() {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error(`Failed to load users: ${error.message}`);
        }
        
        return data;
    }

    /**
     * Promote user to admin
     * @param {string} userId - User ID to promote
     */
    async promoteToAdmin(userId) {
        // Only super admin can promote
        if (!this.authService.hasRole('super_admin')) {
            throw new Error('Only super admin can promote users to admin');
        }
        
        const { error } = await this.supabase
            .from('users')
            .update({ 
                role: 'admin',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) {
            throw new Error(`Failed to promote user: ${error.message}`);
        }
        
        // Log role change
        await this.authService.logAuditEvent(
            'role_change',
            'user',
            userId,
            { new_role: 'admin' }
        );
    }

    /**
     * Demote admin to manager
     * @param {string} userId - User ID to demote
     */
    async demoteToManager(userId) {
        // Only super admin can demote
        if (!this.authService.hasRole('super_admin')) {
            throw new Error('Only super admin can demote admins');
        }
        
        // Cannot demote super admin
        const { data: user } = await this.supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (user.role === 'super_admin') {
            throw new Error('Cannot demote super admin');
        }
        
        const { error } = await this.supabase
            .from('users')
            .update({ 
                role: 'manager',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) {
            throw new Error(`Failed to demote user: ${error.message}`);
        }
        
        // Log role change
        await this.authService.logAuditEvent(
            'role_change',
            'user',
            userId,
            { new_role: 'manager' }
        );
    }

    /**
     * Block user
     * @param {string} userId - User ID to block
     * @param {string} reason - Reason for blocking (optional)
     */
    async blockUser(userId, reason = '') {
        // Admins and super admins can block
        if (!this.authService.hasRole('admin')) {
            throw new Error('Only admins can block users');
        }
        
        // Cannot block super admin
        const { data: user } = await this.supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (user.role === 'super_admin') {
            throw new Error('Cannot block super admin');
        }
        
        const { error } = await this.supabase
            .from('users')
            .update({ 
                status: 'blocked',
                blocked_at: new Date().toISOString(),
                blocked_by: this.authService.getCurrentUser().id,
                block_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) {
            throw new Error(`Failed to block user: ${error.message}`);
        }
        
        // Log block action
        await this.authService.logAuditEvent(
            'user_blocked',
            'user',
            userId,
            { reason }
        );
        
        // Send notification email
        await this.sendBlockNotification(userId, reason);
    }

    /**
     * Unblock user
     * @param {string} userId - User ID to unblock
     */
    async unblockUser(userId) {
        // Admins and super admins can unblock
        if (!this.authService.hasRole('admin')) {
            throw new Error('Only admins can unblock users');
        }
        
        const { error } = await this.supabase
            .from('users')
            .update({ 
                status: 'active',
                blocked_at: null,
                blocked_by: null,
                block_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) {
            throw new Error(`Failed to unblock user: ${error.message}`);
        }
        
        // Log unblock action
        await this.authService.logAuditEvent(
            'user_unblocked',
            'user',
            userId,
            {}
        );
        
        // Send notification email
        await this.sendUnblockNotification(userId);
    }

    /**
     * Send block notification email
     * @param {string} userId - User ID
     * @param {string} reason - Block reason
     */
    async sendBlockNotification(userId, reason) {
        // Get user email
        const { data: user } = await this.supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();
        
        // In production, integrate with email service (SendGrid, AWS SES, etc.)
        console.log(`Would send block notification to ${user.email}`);
        console.log(`Reason: ${reason || 'No reason provided'}`);
        
        // TODO: Implement actual email sending
        // Example:
        // await emailService.send({
        //     to: user.email,
        //     subject: 'Account Access Blocked',
        //     body: `Your account has been blocked. Reason: ${reason}`
        // });
    }

    /**
     * Send unblock notification email
     * @param {string} userId - User ID
     */
    async sendUnblockNotification(userId) {
        // Get user email
        const { data: user } = await this.supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();
        
        // In production, integrate with email service
        console.log(`Would send unblock notification to ${user.email}`);
        
        // TODO: Implement actual email sending
    }

    /**
     * Get audit logs with filtering and pagination
     * @param {Object} filters - Filter options (startDate, endDate, userId, action, page, pageSize)
     * @returns {Promise<Object>} Object containing audit logs and pagination metadata
     */
    async getAuditLogs(filters = {}) {
        const { page = 0, pageSize = 100 } = filters;
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        let query = this.supabase
            .from('audit_logs')
            .select(`
                *,
                users:user_id (email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });
        
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }
        
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        
        if (filters.action) {
            query = query.eq('action', filters.action);
        }
        
        const { data, error, count } = await query.range(from, to);
        
        if (error) {
            throw new Error(`Failed to load audit logs: ${error.message}`);
        }
        
        return {
            data: data || [],
            pagination: {
                page,
                pageSize,
                totalRecords: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize),
                hasNextPage: to < (count || 0) - 1,
                hasPreviousPage: page > 0
            }
        };
    }

    /**
     * Get all audit logs (backward compatibility)
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Filtered audit logs
     */
    async getAllAuditLogs(filters = {}) {
        let query = this.supabase
            .from('audit_logs')
            .select(`
                *,
                users:user_id (email)
            `)
            .order('created_at', { ascending: false });
        
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }
        
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        
        if (filters.action) {
            query = query.eq('action', filters.action);
        }
        
        const { data, error } = await query.limit(filters.limit || 100);
        
        if (error) {
            throw new Error(`Failed to load audit logs: ${error.message}`);
        }
        
        return data;
    }

    /**
     * Export audit logs to CSV
     * @param {Object} filters - Filter options
     * @returns {Promise<string>} CSV string
     */
    async exportAuditLogs(filters = {}) {
        const logs = await this.getAllAuditLogs({ ...filters, limit: 10000 });
        
        const csv = [
            ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details'].join(','),
            ...logs.map(log => [
                log.created_at,
                log.users?.email || 'Unknown',
                log.action,
                log.resource_type || '',
                log.resource_id || '',
                JSON.stringify(log.details || {}).replace(/,/g, ';') // Escape commas in JSON
            ].join(','))
        ].join('\n');
        
        return csv;
    }

    /**
     * Get system statistics
     * @returns {Promise<Object>} System statistics including user counts and activity
     */
    async getSystemStatistics() {
        // Get user counts
        const { data: users } = await this.supabase
            .from('users')
            .select('role, status');
        
        const stats = {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'active').length,
            blockedUsers: users.filter(u => u.status === 'blocked').length,
            adminCount: users.filter(u => ['admin', 'super_admin'].includes(u.role)).length,
            managerCount: users.filter(u => u.role === 'manager').length
        };
        
        // Get login activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: loginLogs } = await this.supabase
            .from('audit_logs')
            .select('created_at')
            .eq('action', 'login')
            .gte('created_at', thirtyDaysAgo.toISOString());
        
        stats.loginActivity = this.groupLoginsByDate(loginLogs);
        
        // Get most active users
        const { data: activityLogs } = await this.supabase
            .from('audit_logs')
            .select('user_id, users:user_id(email)')
            .in('action', ['data_update', 'data_delete'])
            .gte('created_at', thirtyDaysAgo.toISOString());
        
        stats.mostActiveUsers = this.getMostActiveUsers(activityLogs);
        
        return stats;
    }

    /**
     * Group logins by date
     * @param {Array} logs - Login logs
     * @returns {Object} Grouped login counts by date
     */
    groupLoginsByDate(logs) {
        const grouped = {};
        logs.forEach(log => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            grouped[date] = (grouped[date] || 0) + 1;
        });
        return grouped;
    }

    /**
     * Get most active users
     * @param {Array} logs - Activity logs
     * @returns {Array} Top 10 most active users
     */
    getMostActiveUsers(logs) {
        const userActivity = {};
        logs.forEach(log => {
            const email = log.users?.email || 'Unknown';
            userActivity[email] = (userActivity[email] || 0) + 1;
        });
        
        return Object.entries(userActivity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([email, count]) => ({ email, count }));
    }

    /**
     * Configure SSO provider
     * @param {string} provider - Provider name (azure, google, okta)
     * @param {Object} config - Provider configuration
     */
    async configureSSOProvider(provider, config) {
        // Only super admin can configure SSO
        if (!this.authService.hasRole('super_admin')) {
            throw new Error('Only super admin can configure SSO');
        }
        
        // Initialize encryption service if not already done
        if (!this.encryptionService.masterKey) {
            await this.encryptionService.initialize();
        }
        
        // Encrypt sensitive credentials before storing
        const encryptedConfig = await this.encryptionService.encryptSSOConfig(config);
        
        const { error } = await this.supabase
            .from('sso_config')
            .upsert({
                provider,
                config: encryptedConfig,
                updated_by: this.authService.getCurrentUser().id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'provider'
            });
        
        if (error) {
            throw new Error(`Failed to save SSO config: ${error.message}`);
        }
        
        // Log SSO configuration change
        await this.authService.logAuditEvent(
            'sso_config_update',
            'sso_config',
            provider,
            {}
        );
    }

    /**
     * Get SSO configuration
     * @param {string} provider - Provider name
     * @returns {Promise<Object>} Provider configuration
     */
    async getSSOConfiguration(provider) {
        const { data, error } = await this.supabase
            .from('sso_config')
            .select('*')
            .eq('provider', provider)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to load SSO config: ${error.message}`);
        }
        
        if (!data) {
            return null;
        }
        
        // Initialize encryption service if not already done
        if (!this.encryptionService.masterKey) {
            await this.encryptionService.initialize();
        }
        
        // Decrypt credentials before returning
        const decryptedConfig = await this.encryptionService.decryptSSOConfig(data.config);
        
        return {
            ...data,
            config: decryptedConfig
        };
    }



    /**
     * Export all system data
     * @returns {Promise<Object>} Complete system backup
     */
    async exportAllData() {
        // Only super admin can export all data
        if (!this.authService.hasRole('super_admin')) {
            throw new Error('Only super admin can export all data');
        }
        
        const backup = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            exportedBy: this.authService.getCurrentUser().email,
            data: {}
        };
        
        // Export users (without sensitive data)
        const { data: users } = await this.supabase
            .from('users')
            .select('id, email, role, status, created_at');
        backup.data.users = users;
        
        // Export table data
        const { data: tableData } = await this.supabase
            .from('table_data')
            .select('*');
        backup.data.tableData = tableData;
        
        // Export configurations
        const { data: configs } = await this.supabase
            .from('table_configurations')
            .select('*');
        backup.data.configurations = configs;
        
        // Export employee records
        const { data: employees } = await this.supabase
            .from('employee_records')
            .select('*');
        backup.data.employeeRecords = employees;
        
        // Export audit logs
        const { data: auditLogs } = await this.supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10000);
        backup.data.auditLogs = auditLogs;
        
        // Log export action
        await this.authService.logAuditEvent(
            'data_export',
            'backup',
            backup.exportDate,
            { recordCount: Object.keys(backup.data).length }
        );
        
        return backup;
    }

    /**
     * Import backup data
     * @param {Object} backup - Backup object to import
     * @returns {Promise<boolean>} Success status
     */
    async importBackupData(backup) {
        // Only super admin can import data
        if (!this.authService.hasRole('super_admin')) {
            throw new Error('Only super admin can import data');
        }
        
        // Validate backup format
        if (!backup.version || !backup.data) {
            throw new Error('Invalid backup format');
        }
        
        // Import in transaction-like manner (best effort)
        try {
            // Import configurations
            if (backup.data.configurations) {
                for (const config of backup.data.configurations) {
                    await this.supabase
                        .from('table_configurations')
                        .insert(config);
                }
            }
            
            // Import table data
            if (backup.data.tableData) {
                for (const data of backup.data.tableData) {
                    await this.supabase
                        .from('table_data')
                        .upsert(data);
                }
            }
            
            // Import employee records
            if (backup.data.employeeRecords) {
                for (const record of backup.data.employeeRecords) {
                    await this.supabase
                        .from('employee_records')
                        .upsert(record);
                }
            }
            
            // Log import
            await this.authService.logAuditEvent(
                'data_import',
                'backup',
                backup.exportDate,
                { recordCount: Object.keys(backup.data).length }
            );
            
            return true;
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelService;
}
