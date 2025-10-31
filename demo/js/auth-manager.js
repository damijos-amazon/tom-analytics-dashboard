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
     * Sign in with email (magic link)
     * @param {string} email - User's email address
     * @returns {Object} Result object with success status and message
     */
    async signIn(email) {
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
            
            // Send magic link
            const { data, error } = await this.supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: {
                    emailRedirectTo: window.location.origin + '/index.html'
                }
            });
            
            if (error) {
                console.error('Sign in error:', error);
                return {
                    success: false,
                    message: `Error: ${error.message}`
                };
            }
            
            return {
                success: true,
                message: `Magic link sent to ${email}! Check your email and click the link to log in.`
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
}

// Create global instance
window.authManager = new AuthManager();
