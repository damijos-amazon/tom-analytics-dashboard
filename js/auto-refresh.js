// AUTO-REFRESH SYSTEM FOR TABLES AND PODIUMS
// Refreshes individual tables without reloading the page

var autoRefreshIntervals = {};
var autoRefreshStates = {};

function initializeAutoRefresh() {
    // Initialize all tables as OFF by default
    const tables = ['tableBody', 'tableBody2', 'tableBody3', 'tableBody4', 'tableBody5', 'tableBody6', 'leaderboardBody'];
    
    tables.forEach(tableId => {
        const savedState = localStorage.getItem(`autoRefresh_${tableId}`);
        autoRefreshStates[tableId] = savedState === 'true';
        
        if (autoRefreshStates[tableId]) {
            startAutoRefresh(tableId);
        }
    });
}

function toggleAutoRefresh(tableId) {
    if (autoRefreshStates[tableId]) {
        stopAutoRefresh(tableId);
    } else {
        startAutoRefresh(tableId);
    }
}

function startAutoRefresh(tableId) {
    autoRefreshStates[tableId] = true;
    localStorage.setItem(`autoRefresh_${tableId}`, 'true');
    
    // Update button appearance
    updateRefreshButton(tableId, true);
    
    // Start interval (5 minutes = 300000 milliseconds)
    autoRefreshIntervals[tableId] = setInterval(() => {
        refreshTable(tableId);
    }, 300000);
    
    console.log(`✅ Auto-refresh started for ${tableId}`);
}

function stopAutoRefresh(tableId) {
    autoRefreshStates[tableId] = false;
    localStorage.setItem(`autoRefresh_${tableId}`, 'false');
    
    // Update button appearance
    updateRefreshButton(tableId, false);
    
    // Clear interval
    if (autoRefreshIntervals[tableId]) {
        clearInterval(autoRefreshIntervals[tableId]);
        delete autoRefreshIntervals[tableId];
    }
    
    console.log(`⏸️ Auto-refresh stopped for ${tableId}`);
}

function refreshTable(tableId) {
    const dashboardsRef = window.dashboards || {};
    
    // Special handling for leaderboard
    if (tableId === 'leaderboardBody') {
        if (typeof updateLeaderboard === 'function') {
            updateLeaderboard();
            console.log('🔄 Leaderboard refreshed');
        }
        return;
    }
    
    // Refresh regular tables
    const dashboard = dashboardsRef[tableId];
    if (dashboard) {
        // Add subtle flash animation
        const tableElement = document.getElementById(tableId);
        if (tableElement) {
            tableElement.style.transition = 'opacity 0.3s';
            tableElement.style.opacity = '0.7';
            
            setTimeout(() => {
                dashboard.calculateChanges();
                dashboard.renderTable();
                dashboard.updatePodium();
                
                tableElement.style.opacity = '1';
                console.log(`🔄 ${tableId} refreshed`);
            }, 150);
        }
    }
}

function updateRefreshButton(tableId, isActive) {
    const button = document.getElementById(`autoRefreshBtn_${tableId}`);
    if (!button) return;
    
    if (isActive) {
        button.innerHTML = '🔄 Auto-Refresh: <span style="color: #067D62; font-weight: bold;">ON</span>';
        button.style.background = 'linear-gradient(135deg, #067D62 0%, #0a9e7a 100%)';
        button.style.boxShadow = '0 0 15px rgba(6,125,98,0.5)';
    } else {
        button.innerHTML = '🔄 Auto-Refresh: <span style="color: #ccc;">OFF</span>';
        button.style.background = '#37475A';
        button.style.boxShadow = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeAutoRefresh();
    }, 2000); // Wait for dashboards to load
});

// Clean up intervals when page unloads
window.addEventListener('beforeunload', () => {
    Object.keys(autoRefreshIntervals).forEach(tableId => {
        clearInterval(autoRefreshIntervals[tableId]);
    });
});
