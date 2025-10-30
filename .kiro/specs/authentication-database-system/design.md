# Design Document

## Overview

This design adds enterprise authentication and cloud database capabilities to the TOM Analytics Dashboard. The system integrates Supabase for authentication, database storage, and real-time sync. It implements a three-tier role system (Super Admin, Admin, Manager) with comprehensive user management and audit logging.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Application                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Login Page  │  │  Dashboard   │  │ Admin Panel  │      │
│  │              │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         │      Authentication & Data Layer    │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────▼──────┐      │
│  │   Supabase   │  │   Supabase   │  │   Supabase   │      │
│  │     Auth     │  │   Database   │  │   Realtime   │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

1. **Authentication Service**: Handles SSO login, session management, role verification
2. **Database Service**: Manages all data operations with Supabase
3. **Admin Panel**: User management, role assignment, audit logs, statistics
4. **Sync Manager**: Handles offline/online data synchronization
5. **Audit Logger**: Records all system actions for compliance

## Components and Interfaces

### 1. Supabase Setup

**Database Schema**:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('super_admin', 'admin', 'manager')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES public.users(id),
    block_reason TEXT
);

-- Table data storage
CREATE TABLE public.table_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table configurations
CREATE TABLE public.table_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee records
CREATE TABLE public.employee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_data JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO configuration (encrypted)
CREATE TABLE public.sso_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL UNIQUE,
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Row-Level Security Policies**:

```sql
-- Users can read their own record
CREATE POLICY "Users can view own record"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Only super admin can modify roles
CREATE POLICY "Super admin can modify users"
ON public.users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- All authenticated users can read table data
CREATE POLICY "Authenticated users can read table data"
ON public.table_data FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert/update table data
CREATE POLICY "Authenticated users can modify table data"
ON public.table_data FOR ALL
USING (auth.role() = 'authenticated');

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);
```


### 2. Authentication Service

**File**: `demo/js/auth-service.js`

**Purpose**: Handle all authentication operations

**Class**: `AuthService`

```javascript
class AuthService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.session = null;
    }

    // Initialize authentication
    async initialize() {
        // Check for existing session
        const { data: { session } } = await this.supabase.auth.getSession();
        
        if (session) {
            this.session = session;
            await this.loadUserProfile();
            return true;
        }
        
        return false;
    }

    // Sign in with SSO provider
    async signInWithSSO(provider) {
        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: provider, // 'azure', 'google', 'okta'
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
        
        if (error) {
            throw new Error(`SSO login failed: ${error.message}`);
        }
        
        return data;
    }

    // Load user profile and role
    async loadUserProfile() {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', this.session.user.id)
            .single();
        
        if (error) {
            throw new Error(`Failed to load user profile: ${error.message}`);
        }
        
        // Check if blocked
        if (data.status === 'blocked') {
            await this.signOut();
            throw new Error('Your account has been blocked. Please contact your administrator.');
        }
        
        this.currentUser = data;
        
        // Update last login
        await this.updateLastLogin();
        
        // Log login event
        await this.logAuditEvent('login', null, null, {});
        
        return data;
    }

    // Update last login timestamp
    async updateLastLogin() {
        await this.supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', this.currentUser.id);
    }

    // Sign out
    async signOut() {
        // Log logout event
        if (this.currentUser) {
            await this.logAuditEvent('logout', null, null, {});
        }
        
        const { error } = await this.supabase.auth.signOut();
        
        if (error) {
            throw new Error(`Sign out failed: ${error.message}`);
        }
        
        this.currentUser = null;
        this.session = null;
    }

    // Check if user has role
    hasRole(role) {
        if (!this.currentUser) return false;
        
        if (role === 'super_admin') {
            return this.currentUser.role === 'super_admin';
        }
        
        if (role === 'admin') {
            return ['admin', 'super_admin'].includes(this.currentUser.role);
        }
        
        return true; // All authenticated users are at least managers
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if authenticated
    isAuthenticated() {
        return this.session !== null && this.currentUser !== null;
    }

    // Setup session timeout warning
    setupSessionTimeout() {
        const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
        const WARNING_TIME = 30 * 60 * 1000; // 30 minutes before expiry
        
        const sessionStart = new Date(this.session.expires_at).getTime() - SESSION_DURATION;
        const warningTime = sessionStart + SESSION_DURATION - WARNING_TIME;
        
        const timeUntilWarning = warningTime - Date.now();
        
        if (timeUntilWarning > 0) {
            setTimeout(() => {
                this.showSessionWarning();
            }, timeUntilWarning);
        }
    }

    // Show session timeout warning
    showSessionWarning() {
        const modal = document.createElement('div');
        modal.className = 'session-warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Session Expiring Soon</h3>
                <p>Your session will expire in 30 minutes. Would you like to stay logged in?</p>
                <button id="stayLoggedIn">Stay Logged In</button>
                <button id="logoutNow">Logout</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('stayLoggedIn').addEventListener('click', async () => {
            await this.refreshSession();
            modal.remove();
        });
        
        document.getElementById('logoutNow').addEventListener('click', async () => {
            await this.signOut();
            window.location.href = '/login';
        });
    }

    // Refresh session
    async refreshSession() {
        const { data, error } = await this.supabase.auth.refreshSession();
        
        if (error) {
            throw new Error(`Failed to refresh session: ${error.message}`);
        }
        
        this.session = data.session;
        this.setupSessionTimeout();
    }

    // Log audit event
    async logAuditEvent(action, resourceType, resourceId, details) {
        await this.supabase
            .from('audit_logs')
            .insert({
                user_id: this.currentUser?.id,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                details,
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent
            });
    }

    // Get client IP (best effort)
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }
}
```


### 3. Database Service

**File**: `demo/js/database-service.js`

**Purpose**: Handle all database operations

**Class**: `DatabaseService`

```javascript
class DatabaseService {
    constructor(supabaseClient, authService) {
        this.supabase = supabaseClient;
        this.authService = authService;
    }

    // Save table data
    async saveTableData(tableId, employeeName, data) {
        const { data: result, error } = await this.supabase
            .from('table_data')
            .upsert({
                table_id: tableId,
                employee_name: employeeName,
                data: data,
                updated_by: this.authService.getCurrentUser().id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'table_id,employee_name'
            });
        
        if (error) {
            throw new Error(`Failed to save table data: ${error.message}`);
        }
        
        // Log data modification
        await this.authService.logAuditEvent(
            'data_update',
            'table_data',
            tableId,
            { employee_name: employeeName }
        );
        
        return result;
    }

    // Load table data
    async loadTableData(tableId) {
        const { data, error } = await this.supabase
            .from('table_data')
            .select('*')
            .eq('table_id', tableId)
            .order('employee_name');
        
        if (error) {
            throw new Error(`Failed to load table data: ${error.message}`);
        }
        
        return data;
    }

    // Delete table data
    async deleteTableData(tableId, employeeName) {
        const { error } = await this.supabase
            .from('table_data')
            .delete()
            .eq('table_id', tableId)
            .eq('employee_name', employeeName);
        
        if (error) {
            throw new Error(`Failed to delete table data: ${error.message}`);
        }
        
        // Log deletion
        await this.authService.logAuditEvent(
            'data_delete',
            'table_data',
            tableId,
            { employee_name: employeeName }
        );
    }

    // Save table configuration
    async saveTableConfiguration(config) {
        const { data, error } = await this.supabase
            .from('table_configurations')
            .insert({
                config: config,
                created_by: this.authService.getCurrentUser().id
            })
            .select()
            .single();
        
        if (error) {
            throw new Error(`Failed to save configuration: ${error.message}`);
        }
        
        // Log configuration change
        await this.authService.logAuditEvent(
            'config_update',
            'table_configuration',
            data.id,
            {}
        );
        
        return data;
    }

    // Load latest table configuration
    async loadTableConfiguration() {
        const { data, error } = await this.supabase
            .from('table_configurations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // Not found is ok
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
        
        return data?.config || null;
    }

    // Save employee records
    async saveEmployeeRecords(records) {
        const { data, error } = await this.supabase
            .from('employee_records')
            .upsert({
                employee_data: records,
                updated_by: this.authService.getCurrentUser().id,
                updated_at: new Date().toISOString()
            });
        
        if (error) {
            throw new Error(`Failed to save employee records: ${error.message}`);
        }
        
        return data;
    }

    // Load employee records
    async loadEmployeeRecords() {
        const { data, error } = await this.supabase
            .from('employee_records')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to load employee records: ${error.message}`);
        }
        
        return data?.employee_data || [];
    }

    // Subscribe to real-time changes
    subscribeToTableData(tableId, callback) {
        return this.supabase
            .channel(`table_data:${tableId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'table_data',
                    filter: `table_id=eq.${tableId}`
                },
                callback
            )
            .subscribe();
    }

    // Unsubscribe from real-time changes
    unsubscribeFromTableData(subscription) {
        this.supabase.removeChannel(subscription);
    }
}
```


### 4. Admin Panel Service

**File**: `demo/js/admin-panel-service.js`

**Purpose**: Handle admin panel operations

**Class**: `AdminPanelService`

```javascript
class AdminPanelService {
    constructor(supabaseClient, authService) {
        this.supabase = supabaseClient;
        this.authService = authService;
    }

    // Get all users
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

    // Promote user to admin
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

    // Demote admin to manager
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

    // Block user
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

    // Unblock user
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
    }

    // Get audit logs
    async getAuditLogs(filters = {}) {
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

    // Export audit logs to CSV
    async exportAuditLogs(filters = {}) {
        const logs = await this.getAuditLogs({ ...filters, limit: 10000 });
        
        const csv = [
            ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details'].join(','),
            ...logs.map(log => [
                log.created_at,
                log.users?.email || 'Unknown',
                log.action,
                log.resource_type || '',
                log.resource_id || '',
                JSON.stringify(log.details || {})
            ].join(','))
        ].join('\n');
        
        return csv;
    }

    // Get system statistics
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

    // Group logins by date
    groupLoginsByDate(logs) {
        const grouped = {};
        logs.forEach(log => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            grouped[date] = (grouped[date] || 0) + 1;
        });
        return grouped;
    }

    // Get most active users
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

    // Send block notification email
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
    }

    // Configure SSO provider
    async configureSSOProvider(provider, config) {
        // Only super admin can configure SSO
        if (!this.authService.hasRole('super_admin')) {
            throw new Error('Only super admin can configure SSO');
        }
        
        const { error } = await this.supabase
            .from('sso_config')
            .upsert({
                provider,
                config,
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

    // Get SSO configuration
    async getSSOConfiguration(provider) {
        const { data, error } = await this.supabase
            .from('sso_config')
            .select('*')
            .eq('provider', provider)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to load SSO config: ${error.message}`);
        }
        
        return data?.config || null;
    }

    // Export all system data
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
        
        return backup;
    }

    // Import backup data
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
```


### 5. Sync Manager

**File**: `demo/js/sync-manager.js`

**Purpose**: Handle offline/online synchronization

**Class**: `SyncManager`

```javascript
class SyncManager {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.lastSyncTime = null;
        
        this.setupEventListeners();
    }

    // Setup online/offline event listeners
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showSyncStatus('online');
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showSyncStatus('offline');
        });
    }

    // Save data (online or queue for offline)
    async saveData(operation, data) {
        if (this.isOnline) {
            try {
                await this.executeOperation(operation, data);
                this.lastSyncTime = new Date();
                this.updateSyncIndicator();
                return true;
            } catch (error) {
                console.error('Save failed, queuing for retry:', error);
                this.queueOperation(operation, data);
                return false;
            }
        } else {
            // Save to localStorage and queue for sync
            this.saveToLocalStorage(operation, data);
            this.queueOperation(operation, data);
            return false;
        }
    }

    // Execute database operation
    async executeOperation(operation, data) {
        switch (operation.type) {
            case 'saveTableData':
                return await this.databaseService.saveTableData(
                    data.tableId,
                    data.employeeName,
                    data.data
                );
            case 'deleteTableData':
                return await this.databaseService.deleteTableData(
                    data.tableId,
                    data.employeeName
                );
            case 'saveConfiguration':
                return await this.databaseService.saveTableConfiguration(data.config);
            case 'saveEmployeeRecords':
                return await this.databaseService.saveEmployeeRecords(data.records);
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    // Queue operation for later sync
    queueOperation(operation, data) {
        this.syncQueue.push({
            operation,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Save queue to localStorage
        localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    }

    // Process sync queue
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`Processing ${this.syncQueue.length} queued operations...`);
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                await this.executeOperation(item.operation, item.data);
                console.log('Synced:', item.operation.type);
            } catch (error) {
                console.error('Sync failed, re-queuing:', error);
                this.syncQueue.push(item);
            }
        }
        
        // Update localStorage
        localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
        
        this.lastSyncTime = new Date();
        this.updateSyncIndicator();
        
        if (this.syncQueue.length > 0) {
            // Retry failed operations after delay
            setTimeout(() => this.processSyncQueue(), 30000);
        }
    }

    // Save to localStorage as fallback
    saveToLocalStorage(operation, data) {
        const key = `offline_${operation.type}_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Load sync queue from localStorage
    loadSyncQueue() {
        const stored = localStorage.getItem('sync_queue');
        if (stored) {
            this.syncQueue = JSON.parse(stored);
        }
    }

    // Show sync status banner
    showSyncStatus(status) {
        let banner = document.getElementById('syncStatusBanner');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'syncStatusBanner';
            banner.className = 'sync-status-banner';
            document.body.prepend(banner);
        }
        
        if (status === 'offline') {
            banner.textContent = '⚠️ Offline Mode - Changes will sync when connection is restored';
            banner.className = 'sync-status-banner offline';
        } else {
            banner.textContent = '✓ Online - Syncing changes...';
            banner.className = 'sync-status-banner online';
            
            setTimeout(() => {
                banner.remove();
            }, 3000);
        }
    }

    // Update sync indicator
    updateSyncIndicator() {
        const indicator = document.getElementById('syncIndicator');
        if (indicator && this.lastSyncTime) {
            const timeAgo = this.getTimeAgo(this.lastSyncTime);
            indicator.textContent = `Last synced: ${timeAgo}`;
        }
    }

    // Get time ago string
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            queuedOperations: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime
        };
    }
}
```

### 6. Login Page

**File**: `demo/login.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TOM Analytics - Login</title>
    <link rel="stylesheet" href="css/login.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <h1>TOM Analytics Dashboard</h1>
            <p class="subtitle">Sign in to continue</p>
            
            <div class="sso-buttons">
                <button id="loginMicrosoft" class="sso-button microsoft">
                    <img src="assets/microsoft-logo.svg" alt="Microsoft">
                    Sign in with Microsoft
                </button>
                
                <button id="loginGoogle" class="sso-button google">
                    <img src="assets/google-logo.svg" alt="Google">
                    Sign in with Google
                </button>
                
                <button id="loginOkta" class="sso-button okta">
                    <img src="assets/okta-logo.svg" alt="Okta">
                    Sign in with Okta
                </button>
            </div>
            
            <div id="errorMessage" class="error-message" style="display: none;"></div>
            
            <div class="login-footer">
                <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/auth-service.js"></script>
    <script src="js/login.js"></script>
</body>
</html>
```

**File**: `demo/js/login.js`

```javascript
// Initialize Supabase client
const supabase = supabase.createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
);

const authService = new AuthService(supabase);

// Handle SSO button clicks
document.getElementById('loginMicrosoft').addEventListener('click', async () => {
    await handleSSOLogin('azure');
});

document.getElementById('loginGoogle').addEventListener('click', async () => {
    await handleSSOLogin('google');
});

document.getElementById('loginOkta').addEventListener('click', async () => {
    await handleSSOLogin('okta');
});

async function handleSSOLogin(provider) {
    try {
        showLoading(true);
        await authService.signInWithSSO(provider);
    } catch (error) {
        showError(error.message);
        showLoading(false);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showLoading(isLoading) {
    const buttons = document.querySelectorAll('.sso-button');
    buttons.forEach(button => {
        button.disabled = isLoading;
        if (isLoading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    });
}

// Check if already authenticated
(async () => {
    const isAuthenticated = await authService.initialize();
    if (isAuthenticated) {
        window.location.href = '/dashboard';
    }
})();
```

