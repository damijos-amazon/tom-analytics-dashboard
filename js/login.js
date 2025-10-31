/**
 * Login Page Script
 * Handles SSO authentication and redirects to dashboard
 */

// Initialize Supabase client
// Note: Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase;
let authService;

// Initialize on page load
(async function initializeLogin() {
    try {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Initialize AuthService
        authService = new AuthService(supabase);
        
        // Check if already authenticated
        const isAuthenticated = await authService.initialize();
        if (isAuthenticated) {
            // User is already logged in, redirect to dashboard
            window.location.href = 'index.html';
            return;
        }
        
        // Check for OAuth callback
        await handleOAuthCallback();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize login page. Please refresh and try again.');
    }
})();

/**
 * Setup event listeners for SSO buttons
 */
function setupEventListeners() {
    document.getElementById('loginMicrosoft').addEventListener('click', () => {
        handleSSOLogin('azure');
    });
    
    document.getElementById('loginGoogle').addEventListener('click', () => {
        handleSSOLogin('google');
    });
    
    document.getElementById('loginOkta').addEventListener('click', () => {
        handleSSOLogin('okta');
    });
}

/**
 * Handle SSO login for a specific provider
 * @param {string} provider - The SSO provider (azure, google, okta)
 */
async function handleSSOLogin(provider) {
    try {
        showLoading(true);
        hideError();
        
        // Initiate SSO login
        await authService.signInWithSSO(provider);
        
        // Note: User will be redirected to provider's login page
        // After successful authentication, they'll be redirected back
        
    } catch (error) {
        console.error('SSO login error:', error);
        showError(error.message || 'Login failed. Please try again.');
        showLoading(false);
    }
}

/**
 * Handle OAuth callback after redirect from provider
 */
async function handleOAuthCallback() {
    // Check if this is an OAuth callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const hasAuthParams = hashParams.has('access_token') || 
                         queryParams.has('code') || 
                         queryParams.has('error');
    
    if (!hasAuthParams) {
        return; // Not an OAuth callback
    }
    
    try {
        showLoading(true);
        
        // Check for error in callback
        const error = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');
        
        if (error) {
            throw new Error(errorDescription || error);
        }
        
        // Supabase will automatically handle the session
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load user profile
        await authService.loadUserProfile();
        
        // Setup session timeout
        authService.setupSessionTimeout();
        
        // Redirect to dashboard
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('OAuth callback error:', error);
        showError(error.message || 'Authentication failed. Please try again.');
        showLoading(false);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

/**
 * Show error message to user
 * @param {string} message - The error message to display
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'flex';
}

/**
 * Hide error message
 */
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

/**
 * Show/hide loading state on buttons
 * @param {boolean} isLoading - Whether to show loading state
 */
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

/**
 * Display session warning modal (called by AuthService)
 * This function is referenced by auth-service.js
 */
window.showSessionWarningModal = function() {
    const modal = document.createElement('div');
    modal.className = 'session-warning-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Session Expiring Soon</h3>
            <p>Your session will expire in 30 minutes. Would you like to stay logged in?</p>
            <div>
                <button id="stayLoggedIn">Stay Logged In</button>
                <button id="logoutNow">Logout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('stayLoggedIn').addEventListener('click', async () => {
        try {
            await authService.refreshSession();
            modal.remove();
        } catch (error) {
            console.error('Failed to refresh session:', error);
            showError('Failed to refresh session. Please log in again.');
            modal.remove();
        }
    });
    
    document.getElementById('logoutNow').addEventListener('click', async () => {
        try {
            await authService.signOut();
            modal.remove();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            modal.remove();
            window.location.href = 'login.html';
        }
    });
};
