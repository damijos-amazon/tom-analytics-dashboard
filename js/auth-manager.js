/**
 * AuthManager
 * Handles Supabase authentication with @amazon.com email restriction
 */
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.authStateCallbacks = [];
    }

    /**
     * Initialize Supabase client and check for existing session
     */
    async initialize() {
        try {
            // Initialize Supabase client
            this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            
            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                console.log('User already authenticated:', this.currentUser.email);
            }
            
            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                if (session) {
                    this.currentUser = session.user;
                } else {
                    this.currentUser = null;
                }
                
                // Notify all callbacks
                this.authStateCallbacks.forEach(callback => callback(event, session));
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            return false;
        }
    }

    /**
     * Sign up with email and password
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Object} Result object with success status and message
     */
    async signUp(email, password) {
        try {
            // Validate email format
            if (!email || !email.includes('@')) {
                return {
                    success: false,
                    message: 'Please enter a valid email address'
                };
            }
            
            // Check if email ends with @amazon.com
            if (!email.toLowerCase().endsWith('@amazon.com')) {
                return {
                    success: false,
                    message: 'Only Amazon employees can access this dashboard. Please use your @amazon.com email address.'
                };
            }
            
            // Validate password
            if (!password || password.length < 6) {
                return {
                    success: false,
                    message: 'Password must be at least 6 characters long'
                };
            }
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) {
                console.error('Sign up error:', error);
                return {
                    success: false,
                    message: `Error: ${error.message}`
                };
            }
            
            return {
                success: true,
                message: 'Account created successfully! You are now logged in.',
                user: data.user
            };
            
        } catch (error) {
            console.error('Sign up exception:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.'
            };
        }
    }

    /**
     * Sign in with email and password
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Object} Result object with success status and message
     */
    async signIn(email, password) {
        try {
            // Validate email format
            if (!email || !email.includes('@')) {
                return {
                    success: false,
                    message: 'Please enter a valid email address'
                };
            }
            
            // Check if email ends with @amazon.com
            if (!email.toLowerCase().endsWith('@amazon.com')) {
                return {
                    success: false,
                    message: 'Only Amazon employees can access this dashboard. Please use your @amazon.com email address.'
                };
            }
            
            // Validate password
            if (!password) {
                return {
                    success: false,
                    message: 'Please enter your password'
                };
            }
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase(),
                password: password
            });
            
            if (error) {
                console.error('Sign in error:', error);
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            
            return {
                success: true,
                message: 'Successfully logged in!',
                user: data.user
            };
            
        } catch (error) {
            console.error('Sign in exception:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.'
            };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                console.error('Sign out error:', error);
                return false;
            }
            
            this.currentUser = null;
            console.log('User signed out successfully');
            return true;
            
        } catch (error) {
            console.error('Sign out exception:', error);
            return false;
        }
    }

    /**
     * Register callback for auth state changes
     * @param {Function} callback - Function to call when auth state changes
     */
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
    }

    /**
     * Get current session
     * @returns {Object|null} Current session or null
     */
    async getSession() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            return session;
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get Supabase client instance
     * @returns {Object} Supabase client
     */
    getSupabaseClient() {
        return this.supabase;
    }

    /**
     * Request password reset email
     * @param {string} email - User's email address
     * @returns {Object} Result object with success status and message
     */
    async requestPasswordReset(email) {
        try {
            // Validate email format
            if (!email || !email.includes('@')) {
                return {
                    success: false,
                    message: 'Please enter a valid email address'
                };
            }
            
            // Check if email ends with @amazon.com
            if (!email.toLowerCase().endsWith('@amazon.com')) {
                return {
                    success: false,
                    message: 'Only Amazon employees can access this dashboard. Please use your @amazon.com email address.'
                };
            }
            
            const { error } = await this.supabase.auth.resetPasswordForEmail(
                email.toLowerCase(),
                {
                    redirectTo: `${window.location.origin}/demo/reset-password.html`
                }
            );
            
            if (error) {
                console.error('Password reset request error:', error);
            }
            
            // Always return success message for security (don't reveal if account exists)
            return {
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link shortly.'
            };
            
        } catch (error) {
            console.error('Password reset request exception:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.'
            };
        }
    }

    /**
     * Reset password with new password
     * @param {string} newPassword - New password
     * @returns {Object} Result object with success status and message
     */
    async resetPassword(newPassword) {
        try {
            // Validate password
            if (!newPassword || newPassword.length < 6) {
                return {
                    success: false,
                    message: 'Password must be at least 6 characters long'
                };
            }
            
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                console.error('Password reset error:', error);
                
                // Handle specific error cases
                if (error.message.includes('token') || error.message.includes('session')) {
                    return {
                        success: false,
                        message: 'Invalid or expired reset link. Please request a new one.'
                    };
                }
                
                return {
                    success: false,
                    message: `Error: ${error.message}`
                };
            }
            
            return {
                success: true,
                message: 'Password reset successful! Redirecting to login...'
            };
            
        } catch (error) {
            console.error('Password reset exception:', error);
            return {
                success: false,
                message: 'An unexpected error occurred. Please try again.'
            };
        }
    }

    /**
     * Verify if user has a valid reset token
     * @returns {Promise<boolean>} True if valid token exists
     */
    async hasValidResetToken() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            // Check if this is a password recovery session
            if (session && session.user) {
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
}

// Create global instance
window.authManager = new AuthManager();
