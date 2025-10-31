// Initialize Supabase client
const supabase = supabase.createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_ANON_KEY'
);

// Initialize services
const authService = new AuthService(supabase);
const databaseService = new DatabaseService(supabase, authService);
const adminPanelService = new AdminPanelService(supabase, authService);

// State
let currentUsers = [];
let currentAuditLogs = [];
let currentStats = null;
let selectedUserId = null;
let selectedProvider = null;
let loginActivityChart = null;

// Initialize admin panel
(async () => {
    try {
        // Check authentication
        const isAuthenticated = await authService.initialize();
        if (!isAuthenticated) {
            window.location.href = '/login.html';
            return;
        }

        // Check if user is admin
        if (!authService.hasRole('admin')) {
            showNotification('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
            return;
        }

        // Display current user
        const currentUser = authService.getCurrentUser();
        document.getElementById('currentUserEmail').textContent = currentUser.email;

        // Setup event listeners
        setupEventListeners();

        // Load initial data
        await loadUsers();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize admin panel', 'error');
    }
})();

// Setup event listeners
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await authService.signOut();
            window.location.href = '/login.html';
        } catch (error) {
            showNotification('Logout failed', 'error');
        }
    });

    // User management
    document.getElementById('userSearchInput').addEventListener('input', filterUsers);
    document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);

    // Audit logs
    document.getElementById('applyAuditFiltersBtn').addEventListener('click', loadAuditLogs);
    document.getElementById('exportAuditLogsBtn').addEventListener('click', exportAuditLogs);

    // Backup/Restore
    document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);
    document.getElementById('importBackupBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', handleImportFile);

    // Modal close handlers
    document.getElementById('cancelBlockBtn').addEventListener('click', () => closeModal('blockUserModal'));
    document.getElementById('cancelUnblockBtn').addEventListener('click', () => closeModal('unblockUserModal'));
    document.getElementById('cancelRoleChangeBtn').addEventListener('click', () => closeModal('roleChangeModal'));
    document.getElementById('cancelSSOConfigBtn').addEventListener('click', () => closeModal('ssoConfigModal'));

    // Modal confirm handlers
    document.getElementById('confirmBlockBtn').addEventListener('click', confirmBlockUser);
    document.getElementById('confirmUnblockBtn').addEventListener('click', confirmUnblockUser);
    document.getElementById('confirmRoleChangeBtn').addEventListener('click', confirmRoleChange);

    // SSO configuration form
    document.getElementById('ssoConfigForm').addEventListener('submit', saveSSOConfig);

    // SSO provider toggles
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', handleSSOToggle);
    });
}

// Switch tabs
function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}-section`).classList.add('active');

    // Load data for the tab
    switch (tabName) {
        case 'users':
            if (currentUsers.length === 0) loadUsers();
            break;
        case 'audit':
            if (currentAuditLogs.length === 0) loadAuditLogs();
            break;
        case 'statistics':
            loadStatistics();
            break;
        case 'sso':
            loadSSOConfiguration();
            break;
    }
}

// ===== USER MANAGEMENT =====

async function loadUsers() {
    try {
        showLoading('usersLoading', true);
        currentUsers = await adminPanelService.getAllUsers();
        renderUsersTable(currentUsers);
    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users', 'error');
    } finally {
        showLoading('usersLoading', false);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        // Email
        const emailTd = document.createElement('td');
        emailTd.textContent = user.email;
        tr.appendChild(emailTd);

        // Role
        const roleTd = document.createElement('td');
        const roleBadge = document.createElement('span');
        roleBadge.className = `role-badge role-${user.role}`;
        roleBadge.textContent = formatRole(user.role);
        roleTd.appendChild(roleBadge);
        tr.appendChild(roleTd);

        // Status
        const statusTd = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge status-${user.status}`;
        statusBadge.textContent = user.status.charAt(0).toUpperCase() + user.status.slice(1);
        statusTd.appendChild(statusBadge);
        tr.appendChild(statusTd);

        // Last Login
        const lastLoginTd = document.createElement('td');
        lastLoginTd.textContent = user.last_login ? formatDate(user.last_login) : 'Never';
        tr.appendChild(lastLoginTd);

        // Actions
        const actionsTd = document.createElement('td');
        actionsTd.appendChild(createUserActionButtons(user));
        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    });
}

function createUserActionButtons(user) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '0.3rem';
    container.style.flexWrap = 'wrap';

    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = authService.hasRole('super_admin');

    // Can't modify super admin or self
    if (user.role === 'super_admin' || user.id === currentUser.id) {
        container.textContent = '-';
        return container;
    }

    // Promote/Demote buttons (only super admin)
    if (isSuperAdmin) {
        if (user.role === 'manager') {
            const promoteBtn = document.createElement('button');
            promoteBtn.className = 'action-btn action-btn-promote';
            promoteBtn.textContent = 'Promote';
            promoteBtn.onclick = () => showRoleChangeModal(user, 'promote');
            container.appendChild(promoteBtn);
        } else if (user.role === 'admin') {
            const demoteBtn = document.createElement('button');
            demoteBtn.className = 'action-btn action-btn-demote';
            demoteBtn.textContent = 'Demote';
            demoteBtn.onclick = () => showRoleChangeModal(user, 'demote');
            container.appendChild(demoteBtn);
        }
    }

    // Block/Unblock buttons (admin and super admin)
    if (user.status === 'active') {
        const blockBtn = document.createElement('button');
        blockBtn.className = 'action-btn action-btn-block';
        blockBtn.textContent = 'Block';
        blockBtn.onclick = () => showBlockModal(user);
        container.appendChild(blockBtn);
    } else {
        const unblockBtn = document.createElement('button');
        unblockBtn.className = 'action-btn action-btn-unblock';
        unblockBtn.textContent = 'Unblock';
        unblockBtn.onclick = () => showUnblockModal(user);
        container.appendChild(unblockBtn);
    }

    return container;
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const filtered = currentUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm) ||
        user.status.toLowerCase().includes(searchTerm)
    );
    renderUsersTable(filtered);
}

// Block user modal
function showBlockModal(user) {
    selectedUserId = user.id;
    document.getElementById('blockUserEmail').textContent = user.email;
    document.getElementById('blockReason').value = '';
    openModal('blockUserModal');
}

async function confirmBlockUser() {
    try {
        const reason = document.getElementById('blockReason').value;
        await adminPanelService.blockUser(selectedUserId, reason);
        showNotification('User blocked successfully', 'success');
        closeModal('blockUserModal');
        await loadUsers();
    } catch (error) {
        console.error('Failed to block user:', error);
        showNotification(error.message, 'error');
    }
}

// Unblock user modal
function showUnblockModal(user) {
    selectedUserId = user.id;
    document.getElementById('unblockUserEmail').textContent = user.email;
    openModal('unblockUserModal');
}

async function confirmUnblockUser() {
    try {
        await adminPanelService.unblockUser(selectedUserId);
        showNotification('User unblocked successfully', 'success');
        closeModal('unblockUserModal');
        await loadUsers();
    } catch (error) {
        console.error('Failed to unblock user:', error);
        showNotification(error.message, 'error');
    }
}

// Role change modal
let pendingRoleAction = null;

function showRoleChangeModal(user, action) {
    selectedUserId = user.id;
    pendingRoleAction = action;
    
    const message = action === 'promote' 
        ? 'Are you sure you want to promote this user to Admin?'
        : 'Are you sure you want to demote this user to Manager?';
    
    document.getElementById('roleChangeMessage').textContent = message;
    document.getElementById('roleChangeUserEmail').textContent = user.email;
    openModal('roleChangeModal');
}

async function confirmRoleChange() {
    try {
        if (pendingRoleAction === 'promote') {
            await adminPanelService.promoteToAdmin(selectedUserId);
            showNotification('User promoted to Admin', 'success');
        } else {
            await adminPanelService.demoteToManager(selectedUserId);
            showNotification('User demoted to Manager', 'success');
        }
        closeModal('roleChangeModal');
        await loadUsers();
    } catch (error) {
        console.error('Failed to change role:', error);
        showNotification(error.message, 'error');
    }
}

// ===== AUDIT LOGS =====

async function loadAuditLogs() {
    try {
        showLoading('auditLoading', true);
        
        const filters = {
            startDate: document.getElementById('auditStartDate').value || undefined,
            endDate: document.getElementById('auditEndDate').value || undefined,
            action: document.getElementById('auditActionFilter').value || undefined
        };

        currentAuditLogs = await adminPanelService.getAuditLogs(filters);
        renderAuditLogsTable(currentAuditLogs);
    } catch (error) {
        console.error('Failed to load audit logs:', error);
        showNotification('Failed to load audit logs', 'error');
    } finally {
        showLoading('auditLoading', false);
    }
}

function renderAuditLogsTable(logs) {
    const tbody = document.getElementById('auditLogsTableBody');
    tbody.innerHTML = '';

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No audit logs found</td></tr>';
        return;
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${formatDateTime(log.created_at)}</td>
            <td>${log.users?.email || 'System'}</td>
            <td>${formatAction(log.action)}</td>
            <td>${log.resource_type || '-'}</td>
            <td>${log.resource_id || '-'}</td>
            <td>${formatDetails(log.details)}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

async function exportAuditLogs() {
    try {
        const filters = {
            startDate: document.getElementById('auditStartDate').value || undefined,
            endDate: document.getElementById('auditEndDate').value || undefined,
            action: document.getElementById('auditActionFilter').value || undefined
        };

        const csv = await adminPanelService.exportAuditLogs(filters);
        downloadCSV(csv, 'audit-logs.csv');
        showNotification('Audit logs exported successfully', 'success');
    } catch (error) {
        console.error('Failed to export audit logs:', error);
        showNotification('Failed to export audit logs', 'error');
    }
}

// ===== STATISTICS =====

async function loadStatistics() {
    try {
        showLoading('statsLoading', true);
        currentStats = await adminPanelService.getSystemStatistics();
        renderStatistics(currentStats);
        
        // Auto-refresh every 5 minutes
        setTimeout(loadStatistics, 5 * 60 * 1000);
    } catch (error) {
        console.error('Failed to load statistics:', error);
        showNotification('Failed to load statistics', 'error');
    } finally {
        showLoading('statsLoading', false);
    }
}

function renderStatistics(stats) {
    // Update stat cards
    document.getElementById('statTotalUsers').textContent = stats.totalUsers;
    document.getElementById('statActiveUsers').textContent = stats.activeUsers;
    document.getElementById('statBlockedUsers').textContent = stats.blockedUsers;
    document.getElementById('statAdminCount').textContent = stats.adminCount;
    document.getElementById('statManagerCount').textContent = stats.managerCount;

    // Render login activity chart
    renderLoginActivityChart(stats.loginActivity);

    // Render most active users
    renderActiveUsersTable(stats.mostActiveUsers);
}

function renderLoginActivityChart(loginActivity) {
    const ctx = document.getElementById('loginActivityChart');
    
    // Destroy existing chart
    if (loginActivityChart) {
        loginActivityChart.destroy();
    }

    // Prepare data
    const dates = Object.keys(loginActivity).sort();
    const counts = dates.map(date => loginActivity[date]);

    loginActivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => formatDate(date)),
            datasets: [{
                label: 'Logins',
                data: counts,
                borderColor: '#ff9900',
                backgroundColor: 'rgba(255, 153, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderActiveUsersTable(activeUsers) {
    const tbody = document.getElementById('activeUsersTableBody');
    tbody.innerHTML = '';

    if (activeUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No activity data</td></tr>';
        return;
    }

    activeUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.email}</td>
            <td>${user.count}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ===== SSO CONFIGURATION =====

async function loadSSOConfiguration() {
    try {
        showLoading('ssoLoading', true);
        
        // Load configuration for each provider
        const providers = ['azure', 'google', 'okta'];
        for (const provider of providers) {
            const config = await adminPanelService.getSSOConfiguration(provider);
            if (config) {
                document.getElementById(`${provider}Enabled`).checked = config.enabled !== false;
            }
        }
    } catch (error) {
        console.error('Failed to load SSO configuration:', error);
        showNotification('Failed to load SSO configuration', 'error');
    } finally {
        showLoading('ssoLoading', false);
    }
}

function editSSOProvider(provider) {
    selectedProvider = provider;
    document.getElementById('ssoProviderName').textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    // Clear form
    document.getElementById('ssoConfigForm').reset();
    document.getElementById('ssoConfigError').style.display = 'none';
    
    openModal('ssoConfigModal');
}

async function saveSSOConfig(e) {
    e.preventDefault();
    
    try {
        const config = {
            clientId: document.getElementById('ssoClientId').value,
            clientSecret: document.getElementById('ssoClientSecret').value,
            tenantId: document.getElementById('ssoTenantId').value,
            redirectUri: document.getElementById('ssoRedirectUri').value,
            enabled: true
        };

        await adminPanelService.configureSSOProvider(selectedProvider, config);
        showNotification('SSO configuration saved successfully', 'success');
        closeModal('ssoConfigModal');
    } catch (error) {
        console.error('Failed to save SSO configuration:', error);
        document.getElementById('ssoConfigError').textContent = error.message;
        document.getElementById('ssoConfigError').style.display = 'block';
    }
}

async function handleSSOToggle(e) {
    const provider = e.target.dataset.provider;
    const enabled = e.target.checked;
    
    try {
        const config = await adminPanelService.getSSOConfiguration(provider) || {};
        config.enabled = enabled;
        await adminPanelService.configureSSOProvider(provider, config);
        showNotification(`${provider} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
        console.error('Failed to toggle SSO provider:', error);
        showNotification('Failed to update SSO provider', 'error');
        e.target.checked = !enabled; // Revert
    }
}

// ===== BACKUP & RESTORE =====

async function exportBackup() {
    try {
        showProgress('exportProgress', true);
        const backup = await adminPanelService.exportAllData();
        
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tom-analytics-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('Backup exported successfully', 'success');
    } catch (error) {
        console.error('Failed to export backup:', error);
        showNotification('Failed to export backup', 'error');
    } finally {
        showProgress('exportProgress', false);
    }
}

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('importFileName').textContent = `Selected: ${file.name}`;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            showProgress('importProgress', true);
            const backup = JSON.parse(event.target.result);
            await adminPanelService.importBackupData(backup);
            showNotification('Backup imported successfully', 'success');
            
            // Reload data
            await loadUsers();
            await loadStatistics();
        } catch (error) {
            console.error('Failed to import backup:', error);
            showNotification('Failed to import backup: ' + error.message, 'error');
        } finally {
            showProgress('importProgress', false);
            document.getElementById('importFileInput').value = '';
        }
    };
    
    reader.readAsText(file);
}

// ===== UTILITY FUNCTIONS =====

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showLoading(elementId, show) {
    document.getElementById(elementId).style.display = show ? 'block' : 'none';
}

function showProgress(elementId, show) {
    document.getElementById(elementId).style.display = show ? 'block' : 'none';
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    toast.textContent = message;
    toast.className = `notification-toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatRole(role) {
    const roleMap = {
        'super_admin': 'Super Admin',
        'admin': 'Admin',
        'manager': 'Manager'
    };
    return roleMap[role] || role;
}

function formatAction(action) {
    return action.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatDetails(details) {
    if (!details || Object.keys(details).length === 0) return '-';
    return JSON.stringify(details);
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Make editSSOProvider globally accessible
window.editSSOProvider = editSSOProvider;
