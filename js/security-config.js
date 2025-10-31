/**
 * SecurityConfig - Handles security configurations for TOM Analytics Dashboard
 * 
 * This service manages:
 * - HTTPS enforcement
 * - Secure cookie flags
 * - Content Security Policy headers
 * - Security best practices
 */

class SecurityConfig {
    constructor() {
        this.isProduction = window.location.protocol === 'https:';
    }

    /**
     * Initialize security configurations
     * Enforces HTTPS and sets up security headers
     */
    initialize() {
        this.enforceHTTPS();
        this.setupContentSecurityPolicy();
        this.configureSecureCookies();
        this.preventClickjacking();
        this.disableContentTypeSniffing();
    }

    /**
     * Enforce HTTPS in production
     * Redirects HTTP requests to HTTPS
     */
    enforceHTTPS() {
        // Only enforce in production (not localhost)
        if (window.location.protocol === 'http:' && 
            !window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1')) {
            
            console.warn('Redirecting to HTTPS...');
            window.location.href = window.location.href.replace('http://', 'https://');
        }
    }

    /**
     * Setup Content Security Policy
     * Defines trusted sources for content loading
     */
    setupContentSecurityPolicy() {
        // Create meta tag for CSP if it doesn't exist
        let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        
        if (!cspMeta) {
            cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = 'Content-Security-Policy';
            
            // Define CSP directives
            const cspDirectives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' https://*.supabase.co https://api.ipify.org",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'"
            ];
            
            cspMeta.content = cspDirectives.join('; ');
            document.head.appendChild(cspMeta);
        }
    }

    /**
     * Configure secure cookie settings
     * Sets flags for session cookies
     */
    configureSecureCookies() {
        // This is primarily handled by Supabase, but we can add additional checks
        // and ensure our application respects secure cookie practices
        
        // Store cookie configuration for reference
        this.cookieConfig = {
            secure: this.isProduction, // Only send over HTTPS in production
            sameSite: 'Strict', // Prevent CSRF attacks
            httpOnly: true, // Prevent XSS access to cookies
            maxAge: 8 * 60 * 60 // 8 hours (matches session duration)
        };
    }

    /**
     * Prevent clickjacking attacks
     * Sets X-Frame-Options header via meta tag
     */
    preventClickjacking() {
        let frameMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
        
        if (!frameMeta) {
            frameMeta = document.createElement('meta');
            frameMeta.httpEquiv = 'X-Frame-Options';
            frameMeta.content = 'DENY';
            document.head.appendChild(frameMeta);
        }
    }

    /**
     * Disable content type sniffing
     * Prevents MIME type confusion attacks
     */
    disableContentTypeSniffing() {
        let noSniffMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
        
        if (!noSniffMeta) {
            noSniffMeta = document.createElement('meta');
            noSniffMeta.httpEquiv = 'X-Content-Type-Options';
            noSniffMeta.content = 'nosniff';
            document.head.appendChild(noSniffMeta);
        }
    }

    /**
     * Validate that all API calls use HTTPS
     * @param {string} url - URL to validate
     * @returns {boolean} True if URL is secure
     */
    validateSecureURL(url) {
        try {
            const urlObj = new URL(url);
            
            // Allow localhost for development
            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                return true;
            }
            
            // Require HTTPS for all other URLs
            if (urlObj.protocol !== 'https:') {
                console.error(`Insecure URL detected: ${url}`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Invalid URL:', url);
            return false;
        }
    }

    /**
     * Create secure fetch wrapper that enforces HTTPS
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async secureFetch(url, options = {}) {
        // Validate URL is secure
        if (!this.validateSecureURL(url)) {
            throw new Error('Insecure URL not allowed. All API calls must use HTTPS.');
        }

        // Add security headers to request
        const secureOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'X-Content-Type-Options': 'nosniff'
            },
            credentials: 'same-origin', // Only send cookies to same origin
            mode: 'cors'
        };

        return fetch(url, secureOptions);
    }

    /**
     * Get cookie configuration for Supabase client
     * @returns {Object} Cookie configuration object
     */
    getCookieConfig() {
        return {
            name: 'sb-auth-token',
            domain: window.location.hostname,
            path: '/',
            sameSite: 'Strict',
            secure: this.isProduction
        };
    }

    /**
     * Sanitize user input to prevent XSS attacks
     * @param {string} input - User input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        // Create a temporary div to use browser's HTML parser
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML;
    }

    /**
     * Validate and sanitize JSON data
     * @param {string} jsonString - JSON string to validate
     * @returns {Object|null} Parsed JSON or null if invalid
     */
    sanitizeJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Recursively sanitize string values
            const sanitize = (obj) => {
                if (typeof obj === 'string') {
                    return this.sanitizeInput(obj);
                } else if (Array.isArray(obj)) {
                    return obj.map(sanitize);
                } else if (obj !== null && typeof obj === 'object') {
                    const sanitized = {};
                    for (const [key, value] of Object.entries(obj)) {
                        sanitized[key] = sanitize(value);
                    }
                    return sanitized;
                }
                return obj;
            };
            
            return sanitize(parsed);
        } catch (error) {
            console.error('Invalid JSON:', error);
            return null;
        }
    }

    /**
     * Check if current environment is secure
     * @returns {boolean} True if environment is secure
     */
    isSecureEnvironment() {
        return this.isProduction || 
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    }

    /**
     * Log security event
     * @param {string} eventType - Type of security event
     * @param {Object} details - Event details
     */
    logSecurityEvent(eventType, details = {}) {
        console.warn(`[SECURITY] ${eventType}:`, details);
        
        // In production, this should be sent to a security monitoring service
        if (this.isProduction) {
            // TODO: Send to security monitoring service
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityConfig;
}
