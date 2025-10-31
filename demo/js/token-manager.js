/**
 * TokenManager - Handles secure token storage and management
 * 
 * This service manages:
 * - Secure token storage
 * - Token invalidation on logout
 * - Token rotation on refresh
 * - Token validation and expiry checks
 */

class TokenManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.tokenKey = 'sb-auth-token';
        this.refreshTokenKey = 'sb-refresh-token';
        this.tokenExpiryKey = 'sb-token-expiry';
    }

    /**
     * Store session tokens securely
     * @param {Object} session - Supabase session object
     */
    storeTokens(session) {
        if (!session || !session.access_token) {
            console.error('Invalid session object');
            return;
        }

        try {
            // Store access token
            this.setSecureItem(this.tokenKey, session.access_token);
            
            // Store refresh token
            if (session.refresh_token) {
                this.setSecureItem(this.refreshTokenKey, session.refresh_token);
            }
            
            // Store expiry time
            if (session.expires_at) {
                this.setSecureItem(this.tokenExpiryKey, session.expires_at.toString());
            }
            
            // Set up automatic token rotation before expiry
            this.scheduleTokenRotation(session.expires_at);
            
        } catch (error) {
            console.error('Failed to store tokens:', error);
            throw new Error('Token storage failed');
        }
    }

    /**
     * Retrieve stored access token
     * @returns {string|null} Access token or null if not found
     */
    getAccessToken() {
        try {
            const token = this.getSecureItem(this.tokenKey);
            
            // Validate token hasn't expired
            if (token && this.isTokenExpired()) {
                console.warn('Token has expired');
                this.clearTokens();
                return null;
            }
            
            return token;
        } catch (error) {
            console.error('Failed to retrieve access token:', error);
            return null;
        }
    }

    /**
     * Retrieve stored refresh token
     * @returns {string|null} Refresh token or null if not found
     */
    getRefreshToken() {
        try {
            return this.getSecureItem(this.refreshTokenKey);
        } catch (error) {
            console.error('Failed to retrieve refresh token:', error);
            return null;
        }
    }

    /**
     * Check if current token is expired
     * @returns {boolean} True if token is expired
     */
    isTokenExpired() {
        try {
            const expiryTime = this.getSecureItem(this.tokenExpiryKey);
            
            if (!expiryTime) {
                return true;
            }
            
            const expiryTimestamp = parseInt(expiryTime, 10);
            const currentTimestamp = Math.floor(Date.now() / 1000);
            
            // Consider token expired if within 5 minutes of expiry
            const bufferTime = 5 * 60; // 5 minutes in seconds
            
            return currentTimestamp >= (expiryTimestamp - bufferTime);
        } catch (error) {
            console.error('Failed to check token expiry:', error);
            return true;
        }
    }

    /**
     * Get time until token expires
     * @returns {number} Seconds until expiry, or 0 if expired
     */
    getTimeUntilExpiry() {
        try {
            const expiryTime = this.getSecureItem(this.tokenExpiryKey);
            
            if (!expiryTime) {
                return 0;
            }
            
            const expiryTimestamp = parseInt(expiryTime, 10);
            const currentTimestamp = Math.floor(Date.now() / 1000);
            
            const timeRemaining = expiryTimestamp - currentTimestamp;
            
            return Math.max(0, timeRemaining);
        } catch (error) {
            console.error('Failed to calculate time until expiry:', error);
            return 0;
        }
    }

    /**
     * Rotate tokens by refreshing the session
     * @returns {Promise<Object>} New session object
     */
    async rotateTokens() {
        try {
            const refreshToken = this.getRefreshToken();
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            // Use Supabase to refresh the session
            const { data, error } = await this.supabase.auth.refreshSession({
                refresh_token: refreshToken
            });
            
            if (error) {
                throw new Error(`Token rotation failed: ${error.message}`);
            }
            
            if (!data.session) {
                throw new Error('No session returned from refresh');
            }
            
            // Store new tokens
            this.storeTokens(data.session);
            
            console.log('Tokens rotated successfully');
            
            return data.session;
        } catch (error) {
            console.error('Token rotation error:', error);
            
            // Clear invalid tokens
            this.clearTokens();
            
            throw error;
        }
    }

    /**
     * Schedule automatic token rotation before expiry
     * @param {number} expiryTimestamp - Token expiry timestamp
     */
    scheduleTokenRotation(expiryTimestamp) {
        // Clear any existing rotation timer
        if (this.rotationTimer) {
            clearTimeout(this.rotationTimer);
        }
        
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiryTimestamp - currentTimestamp;
        
        // Rotate 10 minutes before expiry
        const rotationBuffer = 10 * 60; // 10 minutes in seconds
        const timeUntilRotation = Math.max(0, (timeUntilExpiry - rotationBuffer) * 1000);
        
        if (timeUntilRotation > 0) {
            this.rotationTimer = setTimeout(async () => {
                try {
                    await this.rotateTokens();
                } catch (error) {
                    console.error('Automatic token rotation failed:', error);
                }
            }, timeUntilRotation);
        }
    }

    /**
     * Invalidate all tokens (on logout)
     * @returns {Promise<void>}
     */
    async invalidateTokens() {
        try {
            // Sign out from Supabase (invalidates tokens on server)
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                console.error('Server-side token invalidation failed:', error);
            }
            
            // Clear local tokens
            this.clearTokens();
            
            // Clear rotation timer
            if (this.rotationTimer) {
                clearTimeout(this.rotationTimer);
                this.rotationTimer = null;
            }
            
            console.log('Tokens invalidated successfully');
        } catch (error) {
            console.error('Token invalidation error:', error);
            
            // Still clear local tokens even if server call fails
            this.clearTokens();
            
            throw error;
        }
    }

    /**
     * Clear all stored tokens from local storage
     */
    clearTokens() {
        try {
            this.removeSecureItem(this.tokenKey);
            this.removeSecureItem(this.refreshTokenKey);
            this.removeSecureItem(this.tokenExpiryKey);
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }

    /**
     * Securely store item in sessionStorage (more secure than localStorage)
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     */
    setSecureItem(key, value) {
        try {
            // Use sessionStorage for better security (cleared on tab close)
            // In production, consider using encrypted storage
            sessionStorage.setItem(key, value);
        } catch (error) {
            console.error('Failed to set secure item:', error);
            throw error;
        }
    }

    /**
     * Retrieve item from secure storage
     * @param {string} key - Storage key
     * @returns {string|null} Stored value or null
     */
    getSecureItem(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (error) {
            console.error('Failed to get secure item:', error);
            return null;
        }
    }

    /**
     * Remove item from secure storage
     * @param {string} key - Storage key
     */
    removeSecureItem(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove secure item:', error);
        }
    }

    /**
     * Validate token format and structure
     * @param {string} token - Token to validate
     * @returns {boolean} True if token is valid format
     */
    validateTokenFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // JWT tokens have 3 parts separated by dots
        const parts = token.split('.');
        
        if (parts.length !== 3) {
            return false;
        }
        
        // Each part should be base64 encoded
        try {
            parts.forEach(part => {
                atob(part.replace(/-/g, '+').replace(/_/g, '/'));
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Decode JWT token payload (without verification)
     * @param {string} token - JWT token
     * @returns {Object|null} Decoded payload or null
     */
    decodeToken(token) {
        try {
            if (!this.validateTokenFormat(token)) {
                return null;
            }
            
            const parts = token.split('.');
            const payload = parts[1];
            
            // Decode base64
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    }

    /**
     * Get token information for debugging
     * @returns {Object} Token information
     */
    getTokenInfo() {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        
        return {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            isExpired: this.isTokenExpired(),
            timeUntilExpiry: this.getTimeUntilExpiry(),
            tokenPayload: accessToken ? this.decodeToken(accessToken) : null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TokenManager;
}
