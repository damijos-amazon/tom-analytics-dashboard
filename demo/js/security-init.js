/**
 * Security Initialization
 * 
 * This script initializes all security measures for the TOM Analytics Dashboard:
 * - HTTPS enforcement and secure headers
 * - Token management
 * - Encryption services
 * - Supabase client configuration with security settings
 */

/**
 * Initialize security configuration
 * @returns {Object} Initialized security services
 */
async function initializeSecurity() {
    console.log('Initializing security measures...');
    
    // 1. Initialize Security Config (HTTPS, CSP, secure headers)
    const securityConfig = new SecurityConfig();
    securityConfig.initialize();
    
    // 2. Verify secure environment
    if (!securityConfig.isSecureEnvironment()) {
        console.error('Application is not running in a secure environment');
        throw new Error('Secure environment required');
    }
    
    // 3. Initialize Encryption Service
    const encryptionService = new EncryptionService();
    await encryptionService.initialize();
    
    console.log('Security measures initialized successfully');
    
    return {
        securityConfig,
        encryptionService
    };
}

/**
 * Create Supabase client with security configuration
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase anon key
 * @param {SecurityConfig} securityConfig - Security configuration instance
 * @returns {Object} Configured Supabase client
 */
function createSecureSupabaseClient(supabaseUrl, supabaseKey, securityConfig) {
    // Validate URLs are secure
    if (!securityConfig.validateSecureURL(supabaseUrl)) {
        throw new Error('Supabase URL must use HTTPS');
    }
    
    // Get cookie configuration
    const cookieConfig = securityConfig.getCookieConfig();
    
    // Create Supabase client with security options
    const supabase = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            // Use secure storage
            storage: window.sessionStorage,
            
            // Auto-refresh tokens
            autoRefreshToken: true,
            
            // Persist session
            persistSession: true,
            
            // Detect session in URL
            detectSessionInUrl: true,
            
            // Cookie options for secure session management
            cookieOptions: {
                name: cookieConfig.name,
                domain: cookieConfig.domain,
                path: cookieConfig.path,
                sameSite: cookieConfig.sameSite,
                secure: cookieConfig.secure,
                maxAge: cookieConfig.maxAge || 28800 // 8 hours
            }
        },
        
        // Global fetch options
        global: {
            headers: {
                'X-Client-Info': 'tom-analytics-dashboard',
                'X-Requested-With': 'XMLHttpRequest'
            }
        },
        
        // Realtime options
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    });
    
    return supabase;
}

/**
 * Initialize all security services
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase anon key
 * @returns {Promise<Object>} All initialized services
 */
async function initializeSecurityServices(supabaseUrl, supabaseKey) {
    try {
        // Initialize security configuration
        const { securityConfig, encryptionService } = await initializeSecurity();
        
        // Create secure Supabase client
        const supabase = createSecureSupabaseClient(supabaseUrl, supabaseKey, securityConfig);
        
        // Initialize token manager
        const tokenManager = new TokenManager(supabase);
        
        // Initialize auth service with token manager
        const authService = new AuthService(supabase, tokenManager);
        
        // Initialize database service
        const databaseService = new DatabaseService(supabase, authService);
        
        // Initialize admin panel service with encryption
        const adminPanelService = new AdminPanelService(supabase, authService, encryptionService);
        
        console.log('All security services initialized');
        
        return {
            supabase,
            securityConfig,
            encryptionService,
            tokenManager,
            authService,
            databaseService,
            adminPanelService
        };
    } catch (error) {
        console.error('Failed to initialize security services:', error);
        throw error;
    }
}

/**
 * Setup security event listeners
 * @param {SecurityConfig} securityConfig - Security configuration instance
 */
function setupSecurityEventListeners(securityConfig) {
    // Monitor for security violations
    window.addEventListener('securitypolicyviolation', (event) => {
        securityConfig.logSecurityEvent('CSP_VIOLATION', {
            violatedDirective: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber
        });
    });
    
    // Monitor for unhandled errors that might be security-related
    window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('security')) {
            securityConfig.logSecurityEvent('SECURITY_ERROR', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno
            });
        }
    });
    
    // Monitor for protocol changes
    if (window.location.protocol === 'http:' && 
        !window.location.hostname.includes('localhost')) {
        securityConfig.logSecurityEvent('INSECURE_PROTOCOL', {
            url: window.location.href
        });
    }
}

/**
 * Validate security requirements before app initialization
 * @returns {boolean} True if all security requirements are met
 */
function validateSecurityRequirements() {
    const checks = {
        crypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        https: window.location.protocol === 'https:' || 
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1'
    };
    
    const allPassed = Object.values(checks).every(check => check === true);
    
    if (!allPassed) {
        console.error('Security requirements not met:', checks);
        return false;
    }
    
    return true;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeSecurity,
        createSecureSupabaseClient,
        initializeSecurityServices,
        setupSecurityEventListeners,
        validateSecurityRequirements
    };
}
