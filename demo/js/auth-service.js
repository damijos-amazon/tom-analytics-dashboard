/**
 * AuthService - Handles all authentication operations for TOM Analytics Dashboard
 * Manages SSO login, session management, role-based access control, and audit logging
 */
class AuthService {
    constructor(supabaseClient, tokenManager = null) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.session = null;
        this.sessionTimeoutId = null;
        this.sessionWarningId = null;
        this.tokenManager = tokenManager || new TokenManager(supabaseClient);
    }

    /**
     * Initialize authentication - check for existing session
     * @returns {Promise<boolean>} True if authenticated, false otherwise
     */
    async initialize() {
        try {
            // Check for existing session
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Failed to get session:', error);
                return false;
            }
            
            if (session) {
                this.session = session;
                
                // Store tokens securely
                this.tokenManager.storeTokens(session);
                
                await this.loadUserProfile();
                this.setupSessionTimeout();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Initialize failed:', error);
            return false;
        }
    }

    /**
     * Sign in with SSO provider (Azure, Google, Okta)
     * @param {string} provider - OAuth provider name
     * @returns {Promise<object>} Authentication data
     */
    async signInWithSSO(provider) {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider, // 'azure', 'google', 'okta'
                options: {
                    redirectTo: `${window.location.origin}/demo/index.html`
                }
            });
            
            if (error) {
                throw new Error(`SSO login failed: ${error.message}`);
            }
            
            return data;
        } catch (error) {
            console.error('SSO login error:', error);
            throw error;
        }
    }

    /**
     * Load user profile and role from database
     * @returns {Promise<object>} User profile data
     */
    async loadUserProfile() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', this.session.user.id)
                .single();
            
            if (error) {
                throw new Error(`Failed to load user profile: ${error.message}`);
            }
            
            // Check if user is blocked
            if (data.status === 'blocked') {
                await this.signOut();
                throw new Error('Your account has been blocked. Please contact your administrator.');
            }
            
            this.currentUser = data;
            
            // Update last login timestamp
            await this.updateLastLogin();
            
            // Log login event
            await this.logAuditEvent('login', null, null, {});
            
            return data;
        } catch (error) {
            console.error('Load user profile error:', error);
            throw error;
        }
    }

    /**
     * Update last login timestamp for current user
     * @returns {Promise<void>}
     */
    async updateLastLogin() {
        try {
            await this.supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', this.currentUser.id);
        } catch (error) {
            console.error('Failed to update last login:', error);
        }
    }

    /**
     * Sign out current user with audit logging
     * @returns {Promise<void>}
     */
    async signOut() {
        try {
            // Log logout event before clearing session
            if (this.currentUser) {
                await this.logAuditEvent('logout', null, null, {});
            }
            
            // Clear session timeouts
            if (this.sessionTimeoutId) {
                clearTimeout(this.sessionTimeoutId);
            }
            if (this.sessionWarningId) {
                clearTimeout(this.sessionWarningId);
            }
            
            // Invalidate tokens
            await this.tokenManager.invalidateTokens();
            
            this.currentUser = null;
            this.session = null;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Setup session timeout warning (8-hour duration, 30-minute warning)
     * @returns {void}
     */
    setupSessionTimeout() {
        const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const WARNING_TIME = 30 * 60 * 1000; // 30 minutes before expiry
        
        // Calculate when session expires
        const sessionStart = new Date(this.session.expires_at).getTime() - SESSION_DURATION;
        const warningTime = sessionStart + SESSION_DURATION - WARNING_TIME;
        const expiryTime = sessionStart + SESSION_DURATION;
        
        const timeUntilWarning = warningTime - Date.now();
        const timeUntilExpiry = expiryTime - Date.now();
        
        // Clear any existing timeouts
        if (this.sessionWarningId) {
            clearTimeout(this.sessionWarningId);
        }
        if (this.sessionTimeoutId) {
            clearTimeout(this.sessionTimeoutId);
        }
        
        // Set warning timeout
        if (timeUntilWarning > 0) {
            this.sessionWarningId = setTimeout(() => {
                this.showSessionWarning();
            }, timeUntilWarning);
        }
        
        // Set automatic logout timeout
        if (timeUntilExpiry > 0) {
            this.sessionTimeoutId = setTimeout(async () => {
                await this.signOut();
                window.location.href = '/demo/login.html?reason=session_expired';
            }, timeUntilExpiry);
        }
    }

    /**
     * Show session timeout warning modal
     * @returns {void}
     */
    showSessionWarning() {
        // Remove any existing modal
        const existingModal = document.getElementById('sessionWarningModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'sessionWarningModal';
        modal.className = 'session-warning-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>Session Expiring Soon</h3>
                <p>Your session will expire in 30 minutes. Would you like to stay logged in?</p>
                <div class="modal-buttons">
                    <button id="stayLoggedIn" class="btn-primary">Stay Logged In</button>
                    <button id="logoutNow" class="btn-secondary">Logout</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle stay logged in
        document.getElementById('stayLoggedIn').addEventListener('click', async () => {
            try {
                await this.refreshSession();
                modal.remove();
            } catch (error) {
                console.error('Failed to refresh session:', error);
                alert('Failed to refresh session. Please log in again.');
                await this.signOut();
                window.location.href = '/demo/login.html';
            }
        });
        
        // Handle logout
        document.getElementById('logoutNow').addEventListener('click', async () => {
            modal.remove();
            await this.signOut();
            window.location.href = '/demo/login.html';
        });
    }

    /**
     * Refresh session to extend timeout
     * @returns {Promise<void>}
     */
    async refreshSession() {
        try {
            // Use token manager to rotate tokens
            const newSession = await this.tokenManager.rotateTokens();
            
            this.session = newSession;
            this.setupSessionTimeout();
            
            // Log session refresh
            await this.logAuditEvent('session_refresh', null, null, {});
        } catch (error) {
            console.error('Refresh session error:', error);
            throw error;
        }
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check ('super_admin', 'admin', 'manager')
     * @returns {boolean} True if user has role
     */
    hasRole(role) {
        if (!this.currentUser) return false;
        
        if (role === 'super_admin') {
            return this.currentUser.role === 'super_admin';
        }
        
        if (role === 'admin') {
            return ['admin', 'super_admin'].includes(this.currentUser.role);
        }
        
        if (role === 'manager') {
            return ['manager', 'admin', 'super_admin'].includes(this.currentUser.role);
        }
        
        return false;
    }

    /**
     * Get current user object
     * @returns {object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return this.session !== null && this.currentUser !== null;
    }

    /**
     * Log audit event to database
     * @param {string} action - Action type (login, logout, data_update, etc.)
     * @param {string} resourceType - Type of resource affected
     * @param {string} resourceId - ID of resource affected
     * @param {object} details - Additional details
     * @returns {Promise<void>}
     */
    async logAuditEvent(action, resourceType, resourceId, details) {
        try {
            const ipAddress = await this.getClientIP();
            
            await this.supabase
                .from('audit_logs')
                .insert({
                    user_id: this.currentUser?.id,
                    action,
                    resource_type: resourceType,
                    resource_id: resourceId,
                    details,
                    ip_address: ipAddress,
                    user_agent: navigator.userAgent
                });
        } catch (error) {
            console.error('Failed to log audit event:', error);
            // Don't throw - audit logging failure shouldn't break functionality
        }
    }

    /**
     * Get client IP address (best effort)
     * @returns {Promise<string>} IP address or 'unknown'
     */
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get IP address:', error);
            return 'unknown';
        }
    }
}
