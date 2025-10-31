/**
 * Dashboard Initialization with Database Support
 * Initializes Supabase, AuthService, DatabaseService, and integrates with dashboards
 */

// Global variables for services
let supabaseClient = null;
let authService = null;
let databaseService = null;
let databaseAdapters = {};
let isUsingDatabase = false;

/**
 * Initialize Supabase and authentication
 * This should be called on page load
 */
async function initializeDashboardWithDatabase() {
    try {
        // Check if Supabase is configured
        const supabaseUrl = localStorage.getItem('supabase_url');
        const supabaseKey = localStorage.getItem('supabase_anon_key');
        
        if (!supabaseUrl || !supabaseKey) {
            console.log('⚠️ Supabase not configured, using localStorage mode');
            isUsingDatabase = false;
            return false;
        }

        // Initialize Supabase client
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase library not loaded');
            return false;
        }

        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized');

        // Initialize AuthService
        authService = new AuthService(supabaseClient);
        const isAuthenticated = await authService.initialize();
        
        if (!isAuthenticated) {
            console.log('⚠️ User not authenticated');
            // Show login prompt instead of redirecting
            showLoginPrompt();
            return false;
        }

        console.log('✅ User authenticated:', authService.getCurrentUser().email);

        // Initialize DatabaseService
        databaseService = new DatabaseService(supabaseClient, authService);
        console.log('✅ Database service initialized');

        // Setup session timeout
        authService.setupSessionTimeout();

        // Apply role-based UI restrictions
        applyRoleBasedRestrictions();

        isUsingDatabase = true;
        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        isUsingDatabase = false;
        return false;
    }
}

/**
 * Show login prompt overlay
 */
function showLoginPrompt() {
    const overlay = document.createElement('div');
    overlay.id = 'loginPromptOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
    `;
    
    overlay.innerHTML = `
        <div style="background: linear-gradient(135deg, #232F3E 0%, #37475A 100%); padding: 40px; border-radius: 15px; text-align: center; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <h2 style="color: #FFD700; margin-bottom: 20px; font-size: 28px;">🔒 Authentication Required</h2>
            <p style="color: white; margin-bottom: 30px; font-size: 16px;">You need to sign in to access the TOM Analytics Dashboard with database features.</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="window.location.href='/demo/login.html'" style="background: #FF9900; border: none; padding: 12px 30px; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; font-size: 16px;">
                    Sign In
                </button>
                <button onclick="document.getElementById('loginPromptOverlay').remove()" style="background: #666; border: none; padding: 12px 30px; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; font-size: 16px;">
                    Continue Offline
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/**
 * Apply role-based UI restrictions
 * Hide/show features based on user role
 */
function applyRoleBasedRestrictions() {
    if (!authService || !authService.getCurrentUser()) {
        return;
    }

    const user = authService.getCurrentUser();
    const role = user.role;

    console.log(`Applying role-based restrictions for: ${role}`);

    // Manager role: Basic access (default, no restrictions)
    // Admin role: Can access admin features
    // Super Admin role: Full access

    // Hide admin-specific features for managers
    if (role === 'manager') {
        // Hide clear all data button (destructive action)
        const clearAllBtn = document.querySelector('button[onclick="clearAllData()"]');
        if (clearAllBtn) {
            clearAllBtn.style.display = 'none';
        }

        // Show limited access indicator
        console.log('✅ Manager role restrictions applied');
    }

    // Show admin panel link for admins and super admins
    if (role === 'admin' || role === 'super_admin') {
        addAdminPanelLink();
        console.log('✅ Admin features enabled');
    }
}

/**
 * Add admin panel link to navigation
 */
function addAdminPanelLink() {
    const navPanel = document.getElementById('navPanel');
    if (!navPanel) return;

    // Check if link already exists
    if (document.getElementById('adminPanelLink')) return;

    const adminLink = document.createElement('a');
    adminLink.id = 'adminPanelLink';
    adminLink.href = '/demo/admin-panel.html';
    adminLink.style.cssText = `
        display: block;
        color: #FFD700;
        text-decoration: none;
        padding: 10px;
        background: #D13212;
        border-radius: 5px;
        margin-bottom: 10px;
        font-weight: bold;
    `;
    adminLink.textContent = '⚙️ Admin Panel';

    // Insert at the top of nav panel
    navPanel.insertBefore(adminLink, navPanel.firstChild);
}

/**
 * Integrate database with existing dashboards
 * This should be called after dashboards are created
 */
async function integrateDatabaseWithDashboards() {
    if (!isUsingDatabase || !databaseService || !authService) {
        console.log('⚠️ Database not available, skipping integration');
        return;
    }

    try {
        // Get all dashboard instances
        const dashboardInstances = window.dashboards || {};
        
        if (Object.keys(dashboardInstances).length === 0) {
            console.warn('⚠️ No dashboards found to integrate');
            return;
        }

        // Initialize database adapters for all dashboards
        databaseAdapters = initializeDatabaseAdapters(
            dashboardInstances,
            databaseService,
            authService
        );

        console.log(`✅ Integrated database with ${Object.keys(databaseAdapters).length} dashboards`);

        // Load data from database for all dashboards
        await loadAllDashboardsFromDatabase();

    } catch (error) {
        console.error('❌ Error integrating database with dashboards:', error);
    }
}

/**
 * Load data from database for all dashboards
 */
async function loadAllDashboardsFromDatabase() {
    if (!isUsingDatabase || !databaseService) {
        return;
    }

    const dashboardInstances = window.dashboards || {};
    const loadPromises = [];

    Object.keys(dashboardInstances).forEach(tableId => {
        const dashboard = dashboardInstances[tableId];
        if (dashboard && typeof dashboard.loadPersistedData === 'function') {
            loadPromises.push(
                dashboard.loadPersistedData().catch(error => {
                    console.error(`Error loading data for ${tableId}:`, error);
                })
            );
        }
    });

    await Promise.all(loadPromises);
    console.log('✅ Loaded data from database for all dashboards');
}

/**
 * Save all dashboard data to database
 */
async function saveAllDashboardsToDatabase() {
    if (!isUsingDatabase || !databaseService) {
        console.log('⚠️ Database not available');
        return;
    }

    const dashboardInstances = window.dashboards || {};
    const savePromises = [];

    Object.keys(dashboardInstances).forEach(tableId => {
        const dashboard = dashboardInstances[tableId];
        if (dashboard && typeof dashboard.persistData === 'function') {
            savePromises.push(
                dashboard.persistData().catch(error => {
                    console.error(`Error saving data for ${tableId}:`, error);
                })
            );
        }
    });

    await Promise.all(savePromises);
    console.log('✅ Saved data to database for all dashboards');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
    return isUsingDatabase && authService && authService.isAuthenticated();
}

/**
 * Get current user information
 * @returns {Object|null} User object or null
 */
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }
    return authService.getCurrentUser();
}

/**
 * Logout current user
 */
async function logout() {
    if (!authService) {
        return;
    }

    try {
        await authService.signOut();
        window.location.href = '/demo/login.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

/**
 * Check if database mode is enabled
 * @returns {boolean} True if using database
 */
function isDatabaseMode() {
    return isUsingDatabase;
}

/**
 * Check if user has specific role
 * @param {string} requiredRole - The required role ('manager', 'admin', 'super_admin')
 * @returns {boolean} True if user has the role
 */
function hasRole(requiredRole) {
    if (!isAuthenticated()) {
        return false;
    }
    return authService.hasRole(requiredRole);
}

/**
 * Require authentication for an action
 * Shows login prompt if not authenticated
 * @returns {boolean} True if authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        showLoginPrompt();
        return false;
    }
    return true;
}

/**
 * Require specific role for an action
 * Shows error message if user doesn't have the role
 * @param {string} requiredRole - The required role
 * @returns {boolean} True if user has the role
 */
function requireRole(requiredRole) {
    if (!requireAuth()) {
        return false;
    }

    if (!hasRole(requiredRole)) {
        showRoleError(requiredRole);
        return false;
    }

    return true;
}

/**
 * Show role permission error
 * @param {string} requiredRole - The required role
 */
function showRoleError(requiredRole) {
    const message = `This action requires ${requiredRole.replace('_', ' ')} role. Your current role: ${authService.getCurrentUser().role.replace('_', ' ')}`;
    
    // Show error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #D13212;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: bold;
    `;
    notification.textContent = `🚫 ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Export functions to global scope
window.initializeDashboardWithDatabase = initializeDashboardWithDatabase;
window.integrateDatabaseWithDashboards = integrateDatabaseWithDashboards;
window.loadAllDashboardsFromDatabase = loadAllDashboardsFromDatabase;
window.saveAllDashboardsToDatabase = saveAllDashboardsToDatabase;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.isDatabaseMode = isDatabaseMode;
window.hasRole = hasRole;
window.requireAuth = requireAuth;
window.requireRole = requireRole;
